const fs = require('fs');
const path = require('path');

const quranDataPath = path.join(__dirname, '../src/data/quranData.ts');
const content = fs.readFileSync(quranDataPath, 'utf8');

function countArabicChars(text) {
  if (!text) return 0;
  // Count only Arabic characters, excluding verse numbers and punctuation
  return (text.match(/[\u0600-\u06FF]/g) || []).length;
}

function parseAudioKey(audioKey) {
  if (!audioKey) return { chapter: 0, verses: [] };
  const [chapter, versePart] = audioKey.split(':');
  if (versePart.includes('-')) {
    const [start, end] = versePart
      .split('-')
      .map((v) => (parseInt(v).toString() === 'NaN' ? 0 : parseInt(v)));
    return {
      chapter: parseInt(chapter),
      verses: Array.from({ length: end - start + 1 }, (_, i) => start + i),
    };
  }
  return { chapter: parseInt(chapter), verses: [parseInt(versePart)] };
}

function parseSourceRange(source) {
  // Matches "Surah Name 114:1-6" or "Surah Name 1:1"
  const match = source.match(/(\d+):(\d+)(?:-(\d+))?/);
  if (!match) return null;
  const chapter = parseInt(match[1]);
  const start = parseInt(match[2]);
  const end = match[3] ? parseInt(match[3]) : start;
  return {
    chapter,
    start,
    end,
    verses: Array.from({ length: end - start + 1 }, (_, i) => start + i),
  };
}

// Extract objects using a more robust approach
// Look for { id: 'quran_...', ... } pattern
const entryMatches = content.match(/\{\s*id:\s*'quran_[a-z0-9_]+'[\s\S]*?\}/g);

if (!entryMatches) {
  console.error('No entries found matching the pattern.');
  process.exit(1);
}

const reports = [];
let totalEntries = 0;

entryMatches.forEach((entryText) => {
  const idMatch = entryText.match(/id:\s*'([^']+)'/);
  const id = idMatch ? idMatch[1] : 'unknown';

  // Only process Quran type entries
  if (!id.startsWith('quran_')) return;

  totalEntries++;

  const arabicMatch = entryText.match(/arabicText:\s*'([^']+)'/);
  const audioKeyMatch = entryText.match(/audioKey:\s*'([^']+)'/);
  const sourceMatch = entryText.match(/source:\s*'([^']+)'/);

  const arabicText = arabicMatch ? arabicMatch[1] : '';
  const audioKey = audioKeyMatch ? audioKeyMatch[1] : '';
  const source = sourceMatch ? sourceMatch[1] : '';

  const charCount = countArabicChars(arabicText);
  const audioRange = parseAudioKey(audioKey);
  const sourceRange = parseSourceRange(source);

  const verseCount = audioRange.verses.length;

  // Heuristic: Average verse has ~50-100 characters
  // Minimum 15 chars per verse is a safe lower bound for non-empty verses
  const minExpectedChars = verseCount * 15;
  const isMismatched = charCount < minExpectedChars;

  // Check if audioKey matches source range
  let rangeMismatch = false;
  if (sourceRange) {
    if (
      sourceRange.verses.length !== audioRange.verses.length ||
      sourceRange.verses[0] !== audioRange.verses[0]
    ) {
      rangeMismatch = true;
    }
  }

  if (isMismatched || rangeMismatch) {
    reports.push({
      id,
      audioKey,
      source,
      verseCount,
      charCount,
      issue: isMismatched ? 'Potential missing text for verses' : 'Source/AudioKey range mismatch',
    });
  }
});

const outputDir = path.join(__dirname, '../output');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir);
}

fs.writeFileSync(
  path.join(outputDir, 'audio-alignment-report.json'),
  JSON.stringify(reports, null, 2),
);

console.log(`Audit complete. Found ${reports.length} potential issues in ${totalEntries} entries.`);
console.log(`Report written to output/audio-alignment-report.json`);
