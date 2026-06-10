#!/usr/bin/env node
/**
 * lint-content.js — Content Authenticity Validator
 *
 * Validates that every practiceStep in quranData.ts complies with the content rules:
 *   1. Every step has a sourceType ∈ {quran_dua, prophetic_dua, prophetic_dhikr, sunnah_action}
 *   2. Every step has a non-empty, recognizable source
 *   3. Prophetic sources have sourceGrading ∈ {sahih, hasan, sahih_li_ghayrihi, hasan_li_ghayrihi}
 *   4. count is only present when countSource is also present
 *   5. No banned wording (visualize, imagine, channel energy, etc.)
 *
 * Usage: node scripts/lint-content.js
 */

const fs = require('fs');
const path = require('path');

const QURAN_DATA_PATH = path.join(__dirname, '../src/data/quranData.ts');
const SUNNAH_DATA_PATH = path.join(__dirname, '../src/data/sunnahData.ts');

// ─── Allowed values ───────────────────────────────────────────
const VALID_SOURCE_TYPES = ['quran_dua', 'prophetic_dua', 'prophetic_dhikr', 'sunnah_action'];
const VALID_GRADINGS = ['sahih', 'hasan', 'sahih_li_ghayrihi', 'hasan_li_ghayrihi'];
const KNOWN_COLLECTIONS = [
  'bukhari',
  'muslim',
  'dawud',
  'tirmidhi',
  "nasa'i",
  'nasa',
  'majah',
  'ahmad',
  'hibban',
  'hakim',
  'tabarani',
  'bayhaqi',
  'darimi',
  'muwatta',
  'hisn',
  'quran',
  'surah',
  'al-adab',
];
const BANNED_WORDS = [
  /\bvisuali[sz]e?\b/i,
  /\bimagine\b/i,
  /\bchannel\s+(your\s+)?energy\b/i,
  /\bmantra\b/i,
  /\baffirmation\b/i,
  /\bpositive\s+energy\b/i,
  /\bfeel\s+the\s+energy\b/i,
  /\buniverse\s+(will|can|shall|help)/i,
  /\bchakra\b/i,
  /\bthird\s+eye\b/i,
  /\bhigher\s+self\b/i,
  /\blaw\s+of\s+attraction\b/i,
];

// ─── Helpers ──────────────────────────────────────────────────
function isRecognizedSource(source) {
  // Unescape quotes for matching
  const unescaped = source.replace(/\\'/g, "'").replace(/\\"/g, '"');
  const lower = unescaped.toLowerCase();
  // Check known collections
  if (KNOWN_COLLECTIONS.some((c) => lower.includes(c))) return true;
  // Check verse reference pattern (e.g., "2:286", "93:4")
  if (/\d+:\d+/.test(unescaped)) return true;
  // Check for hadith number patterns (e.g., "[Bukhari 1234]")
  if (/\[\w+\s+\d+\]/.test(unescaped)) return true;
  // "Based on..." phrases with Prophet/companion names
  if (/based\s+on\s+(the\s+prophet|abu\s+bakr|umar|uthman|ali)/i.test(unescaped)) return true;
  // Authenticated adhkar
  if (/adhkar|morning|evening/i.test(lower)) return true;
  // Ibn X scholarly references
  if (/ibn\s+(al-qayyim|taymiyyah|uthaymeen|baaz|rajab)/i.test(lower)) return true;
  // "Imam" or "Shaykh" prefixed scholar names
  if (/^(imam|shaykh)\s/i.test(lower)) return true;
  // Contains "on" pattern (scholar on topic)
  if (/ibn\s+\w+\s+on\s/i.test(lower)) return true;
  // "The Master" or "The Prophetic" prefixed patterns
  if (/^the\s+(master|prophetic|authentic)/i.test(lower)) return true;
  // Al-Ghazali, An-Nawawi
  if (/al-ghazali|an-nawawi/i.test(lower)) return true;
  return false;
}

function extractAngleBlocks(content) {
  const blocks = [];
  // Find all angle objects with practiceSteps
  const angleIdRegex = /id:\s*'(q_angle_[^']+)'/g;
  const practiceStepsRegex = /practiceSteps:\s*JSON\.stringify\(\[([\s\S]*?)\]\)/g;

  let idMatch;
  const angleIds = [];
  while ((idMatch = angleIdRegex.exec(content)) !== null) {
    angleIds.push({ id: idMatch[1], index: idMatch.index });
  }

  let psMatch;
  let psIndex = 0;
  while ((psMatch = practiceStepsRegex.exec(content)) !== null) {
    // Find the angle ID that precedes this practiceSteps block
    let angleId = 'unknown';
    for (const a of angleIds) {
      if (a.index < psMatch.index) {
        angleId = a.id;
      }
    }

    // Find line number
    const lineNum = content.substring(0, psMatch.index).split('\n').length;

    blocks.push({
      angleId,
      lineNum,
      raw: psMatch[1],
    });
    psIndex++;
  }
  return blocks;
}

function parseStepsFromBlock(raw) {
  // Extract individual step objects from the raw block
  const steps = [];
  // Match each { ... } object
  const objRegex = /\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}/g;
  let m;
  while ((m = objRegex.exec(raw)) !== null) {
    const obj = m[1];

    // Robust field extractor that handles escaped quotes
    const get = (key) => {
      const keyIndex = obj.indexOf(key + ':');
      if (keyIndex === -1) return undefined;
      // Find the opening quote
      let i = keyIndex + key.length + 1;
      while (i < obj.length && obj[i] !== "'") i++;
      if (i >= obj.length) return undefined;
      i++; // skip opening quote
      // Read until unescaped closing quote
      let result = '';
      while (i < obj.length) {
        if (obj[i] === '\\' && i + 1 < obj.length && obj[i + 1] === "'") {
          result += "'";
          i += 2;
        } else if (obj[i] === "'") {
          break;
        } else {
          result += obj[i];
          i++;
        }
      }
      return result;
    };
    const getNum = (key) => {
      const r = new RegExp(`${key}:\\s*(\\d+)`);
      const match = obj.match(r);
      return match ? parseInt(match[1]) : undefined;
    };

    steps.push({
      type: get('type'),
      title: get('title'),
      instruction: get('instruction'),
      source: get('source'),
      sourceType: get('sourceType'),
      sourceGrading: get('sourceGrading'),
      count: getNum('count'),
      countSource: get('countSource'),
      arabicText: get('arabicText'),
    });
  }
  return steps;
}

// ─── Main Validation ──────────────────────────────────────────
function validate() {
  const content = fs.readFileSync(QURAN_DATA_PATH, 'utf8');
  const blocks = extractAngleBlocks(content);
  const errors = [];

  for (const block of blocks) {
    const steps = parseStepsFromBlock(block.raw);

    if (steps.length === 0) {
      errors.push({
        angleId: block.angleId,
        line: block.lineNum,
        error: 'practiceSteps contains no parseable steps',
      });
      continue;
    }

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      const prefix = `[${block.angleId}] Step ${i + 1} ("${step.title || 'untitled'}")`;

      // Rule 1: sourceType must be present and valid
      if (!step.sourceType) {
        errors.push({
          angleId: block.angleId,
          line: block.lineNum,
          error: `${prefix}: missing sourceType`,
        });
      } else if (!VALID_SOURCE_TYPES.includes(step.sourceType)) {
        errors.push({
          angleId: block.angleId,
          line: block.lineNum,
          error: `${prefix}: invalid sourceType "${step.sourceType}"`,
        });
      }

      // Rule 2: source must be present and recognizable
      if (!step.source) {
        errors.push({
          angleId: block.angleId,
          line: block.lineNum,
          error: `${prefix}: missing source`,
        });
      } else if (!isRecognizedSource(step.source)) {
        errors.push({
          angleId: block.angleId,
          line: block.lineNum,
          error: `${prefix}: unrecognized source "${step.source}"`,
        });
      }

      // Rule 3: prophetic sources need grading
      if (
        step.sourceType &&
        ['prophetic_dua', 'prophetic_dhikr', 'sunnah_action'].includes(step.sourceType)
      ) {
        if (!step.sourceGrading) {
          errors.push({
            angleId: block.angleId,
            line: block.lineNum,
            error: `${prefix}: prophetic source missing sourceGrading`,
          });
        } else if (!VALID_GRADINGS.includes(step.sourceGrading)) {
          errors.push({
            angleId: block.angleId,
            line: block.lineNum,
            error: `${prefix}: invalid sourceGrading "${step.sourceGrading}"`,
          });
        }
      }

      // Rule 4: count requires countSource
      if (step.count && !step.countSource) {
        errors.push({
          angleId: block.angleId,
          line: block.lineNum,
          error: `${prefix}: has count=${step.count} but no countSource`,
        });
      }

      // Rule 5: banned wording
      const fullText = `${step.instruction || ''} ${step.title || ''}`;
      for (const pattern of BANNED_WORDS) {
        if (pattern.test(fullText)) {
          const match = fullText.match(pattern);
          errors.push({
            angleId: block.angleId,
            line: block.lineNum,
            error: `${prefix}: banned word "${match[0]}" in instruction/title`,
          });
        }
      }
    }
  }

  return { blocks: blocks.length, errors };
}

// ─── Run ──────────────────────────────────────────────────────
const { blocks, errors } = validate();

console.log(`\nContent Lint: Scanned ${blocks} angle blocks\n`);

if (errors.length === 0) {
  console.log('✅ All content passes validation!\n');
  process.exit(0);
} else {
  console.log(`❌ ${errors.length} violation(s) found:\n`);
  for (const e of errors) {
    console.log(`  Line ${e.line} | ${e.error}`);
  }
  console.log(`\nFix these violations before merging.`);
  process.exit(1);
}
