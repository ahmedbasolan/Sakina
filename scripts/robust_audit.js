const fs = require('fs');
const path = require('path');

const quranDataPath = path.join(__dirname, '../src/data/quranData.ts');
const content = fs.readFileSync(quranDataPath, 'utf8');

function getField(entryText, fieldName) {
  const regex = new RegExp(`${fieldName}:\\s*['"\`]([\\s\\S]*?)['"\`]`);
  const match = entryText.match(regex);
  return match ? match[1].trim() : null;
}

function parseRange(str) {
  if (!str) return null;
  const match = str.match(/(\d+):(\d+)(?:-(\d+))?/);
  if (!match) return null;
  const chapter = parseInt(match[1]);
  const start = parseInt(match[2]);
  const end = match[3] ? parseInt(match[3]) : start;
  return { chapter, start, end };
}

// Extract Quran Content entries
const quranContentMatches = content.match(/\{\s*id:\s*'quran_[a-z0-9_]+'[\s\S]*?\}/g);
const issues = [];

if (quranContentMatches) {
  quranContentMatches.forEach((entryText) => {
    const id = getField(entryText, 'id');
    if (!id) return;

    const audioKey = getField(entryText, 'audioKey');
    const source = getField(entryText, 'source');
    const arabicText = getField(entryText, 'arabicText');
    const transliteration = getField(entryText, 'transliteration');
    const englishTranslation = getField(entryText, 'englishTranslation');

    const vIssues = [];
    if (!audioKey) vIssues.push('missing audioKey');
    if (!source) vIssues.push('missing source');
    if (!arabicText) vIssues.push('missing arabicText');
    if (!transliteration) vIssues.push('missing transliteration');
    if (!englishTranslation) vIssues.push('missing englishTranslation');

    // Check for range mismatch
    if (source && audioKey) {
      const sRange = parseRange(source);
      const aRange = parseRange(audioKey);
      if (sRange && aRange) {
        if (
          sRange.chapter !== aRange.chapter ||
          sRange.start !== aRange.start ||
          sRange.end !== aRange.end
        ) {
          vIssues.push(
            `range mismatch: source ${sRange.chapter}:${sRange.start}-${sRange.end} vs audioKey ${aRange.chapter}:${aRange.start}-${aRange.end}`,
          );
        }
      }
    }

    if (vIssues.length > 0) {
      issues.push({ id, type: 'QuranContent', issues: vIssues });
    }
  });
}

// Extract ContentAngle entries
const angleMatches = content.match(/\{\s*id:\s*'q_angle_[a-z0-9_]+'[\s\S]*?\}/g);

if (angleMatches) {
  angleMatches.forEach((entryText) => {
    const id = getField(entryText, 'id');
    if (!id) return;

    const action = getField(entryText, 'action');
    const practiceStepsRaw = getField(entryText, 'practiceSteps');
    const actionSource = getField(entryText, 'actionSource');

    const aIssues = [];
    if (action && !practiceStepsRaw) aIssues.push('missing practiceSteps for action');
    if (action && !actionSource) {
      // Check if source is in practiceSteps if not in actionSource
      if (practiceStepsRaw) {
        try {
          // Try to extract source from practiceSteps if it's a JSON string
          // Note: getField might return something like JSON.stringify([...])
          // We need a more careful extraction for practiceSteps
          const psMatch = entryText.match(/practiceSteps:\s*JSON\.stringify\(([\s\S]*?)\),/);
          if (psMatch) {
            const psJson = psMatch[1].trim();
            if (!psJson.includes('source:')) {
              aIssues.push('missing source in action and practiceSteps');
            }
          }
        } catch (e) {
          aIssues.push('error parsing practiceSteps');
        }
      } else {
        aIssues.push('missing actionSource');
      }
    }

    if (aIssues.length > 0) {
      issues.push({ id, type: 'ContentAngle', issues: aIssues });
    }
  });
}

console.log(JSON.stringify(issues, null, 2));
