/**
 * Verse-Audio Alignment Audit Script
 *
 * This script audits all verses in quranData.ts to check if the displayed text
 * matches the full content specified by the audioKey. It fetches official verse
 * text from the Quran.com API and compares it with the stored text.
 *
 * Run with: node scripts/audit-verse-alignment.js
 */

const fs = require('fs');
const path = require('path');

// Path to quranData file
const dataPath = path.join(__dirname, '..', 'src', 'data', 'quranData.ts');
const outputDir = path.join(__dirname, 'output');

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Quran.com API for fetching official verse text
const QURAN_API_BASE = 'https://api.quran.com/api/v4';

// Helper to fetch verse from API
async function fetchVerse(chapter, verse) {
  const url = `${QURAN_API_BASE}/verses/by_key/${chapter}:${verse}?words=true&word_fields=text_uthmani`;
  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`Failed to fetch ${chapter}:${verse}: ${response.status}`);
      return null;
    }
    const data = await response.json();
    return data.verse;
  } catch (error) {
    console.error(`Error fetching ${chapter}:${verse}:`, error.message);
    return null;
  }
}

// Helper to get Arabic text from API response
function getArabicText(verse) {
  if (!verse || !verse.words) return '';
  return verse.words
    .filter((w) => w.char_type_name === 'word')
    .map((w) => w.text_uthmani)
    .join(' ');
}

// Parse verse range from audioKey (e.g., "3:26-27" -> [{chapter: 3, verse: 26}, {chapter: 3, verse: 27}])
function parseAudioKey(audioKey) {
  if (!audioKey) return [];

  const [chapterStr, versePart] = audioKey.split(':');
  const chapter = parseInt(chapterStr);

  if (versePart.includes('-')) {
    const [start, end] = versePart.split('-').map((v) => parseInt(v));
    const verses = [];
    for (let v = start; v <= end; v++) {
      verses.push({ chapter, verse: v });
    }
    return verses;
  }

  return [{ chapter, verse: parseInt(versePart) }];
}

// Extract entries from quranData.ts
function extractEntries(content) {
  const entries = [];

  // Split into entry-like blocks
  const blocks = content.split(/\n\s*\{\s*\n/);

  for (const block of blocks) {
    if (!block.includes("id: 'quran_")) continue;

    const idMatch = block.match(/id:\s*['"]([^'"]+)['"]/);
    const audioKeyMatch = block.match(/audioKey:\s*['"]([^'"]+)['"]/);
    const arabicTextMatch = block.match(/arabicText:\s*['"`]([^'"`]+)['"`]/);
    const sourceMatch = block.match(/source:\s*['"]([^'"]+)['"]/);

    if (idMatch && audioKeyMatch && arabicTextMatch) {
      entries.push({
        id: idMatch[1],
        audioKey: audioKeyMatch[1],
        arabicText: arabicTextMatch[1],
        source: sourceMatch ? sourceMatch[1] : 'Unknown',
      });
    }
  }

  return entries;
}

// Count Arabic characters (excluding diacritics for fair comparison)
function countArabicWords(text) {
  if (!text) return 0;
  // Remove verse numbers and extra whitespace
  const cleaned = text.replace(/[﴿﴾٠-٩\d]/g, '').trim();
  return cleaned.split(/\s+/).filter((w) => w.length > 0).length;
}

// Main audit function
async function auditVerses() {
  console.log('=== Verse-Audio Alignment Audit ===\n');

  // Read quranData.ts
  const content = fs.readFileSync(dataPath, 'utf-8');

  // Extract entries
  const entries = extractEntries(content);
  console.log(`Found ${entries.length} Quran verse entries\n`);

  if (entries.length === 0) {
    console.log('No entries found. Using alternative parsing...');
    // Alternative: just list all audioKeys for manual review
    const audioKeyMatches = content.matchAll(/audioKey:\s*['"](\d+:\d+(?:-\d+)?)['"],?/g);
    const audioKeys = [...audioKeyMatches].map((m) => m[1]);
    console.log(`Found ${audioKeys.length} audioKeys:`, audioKeys.slice(0, 10), '...');
    return;
  }

  const results = {
    checked: 0,
    matches: [],
    mismatches: [],
    errors: [],
  };

  // Check each entry
  for (const entry of entries) {
    results.checked++;
    console.log(`Checking ${entry.audioKey}...`);

    const verseRefs = parseAudioKey(entry.audioKey);
    if (verseRefs.length === 0) {
      results.errors.push({ ...entry, error: 'Invalid audioKey format' });
      continue;
    }

    // Fetch official text for all verses in the range
    let officialText = '';
    for (const ref of verseRefs) {
      const verse = await fetchVerse(ref.chapter, ref.verse);
      if (verse) {
        const arabicText = getArabicText(verse);
        officialText += (officialText ? ' ' : '') + arabicText;
      } else {
        results.errors.push({ ...entry, error: `Failed to fetch ${ref.chapter}:${ref.verse}` });
      }
      // Rate limiting
      await new Promise((resolve) => setTimeout(resolve, 200));
    }

    // Compare word counts
    const storedWordCount = countArabicWords(entry.arabicText);
    const officialWordCount = countArabicWords(officialText);

    const wordDiff = Math.abs(storedWordCount - officialWordCount);
    const diffPercent = officialWordCount > 0 ? (wordDiff / officialWordCount) * 100 : 0;

    const comparison = {
      ...entry,
      storedWordCount,
      officialWordCount,
      wordDiff,
      diffPercent: diffPercent.toFixed(1) + '%',
      officialTextSample: officialText.substring(0, 100) + '...',
    };

    if (diffPercent > 10) {
      results.mismatches.push(comparison);
      console.log(
        `  ⚠️ MISMATCH: ${storedWordCount} stored vs ${officialWordCount} official words`,
      );
    } else {
      results.matches.push(comparison);
      console.log(`  ✓ OK: ${storedWordCount} words`);
    }
  }

  // Print summary
  console.log('\n=== AUDIT SUMMARY ===');
  console.log(`Total checked: ${results.checked}`);
  console.log(`Matches: ${results.matches.length}`);
  console.log(`Mismatches: ${results.mismatches.length}`);
  console.log(`Errors: ${results.errors.length}`);

  if (results.mismatches.length > 0) {
    console.log('\n--- MISMATCHES (text length differs significantly) ---');
    results.mismatches.forEach((m) => {
      console.log(`\n${m.id} (${m.source})`);
      console.log(`  AudioKey: ${m.audioKey}`);
      console.log(`  Stored words: ${m.storedWordCount}, Official words: ${m.officialWordCount}`);
      console.log(`  Difference: ${m.wordDiff} words (${m.diffPercent})`);
    });
  }

  if (results.errors.length > 0) {
    console.log('\n--- ERRORS ---');
    results.errors.forEach((e) => {
      console.log(`${e.id}: ${e.error}`);
    });
  }

  // Save detailed report
  const reportPath = path.join(outputDir, 'verse-alignment-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
  console.log(`\nDetailed report saved to: ${reportPath}`);
}

// Run the audit
auditVerses().catch(console.error);
