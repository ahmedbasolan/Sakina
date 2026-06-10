// Content Audit Script - Find incomplete verses
const fs = require('fs');
const path = require('path');

// Read the quranData.ts file
const quranDataPath = path.join(__dirname, '..', 'src', 'data', 'quranData.ts');
const content = fs.readFileSync(quranDataPath, 'utf-8');

// Extract quranContentData array
const match = content.match(/const quranContentData: Content\[\] = \[([\s\S]*?)\];/);
if (!match) {
  console.error('Could not find quranContentData');
  process.exit(1);
}

// Parse content items (simple regex-based parser)
const items = [];
const itemMatches = [
  ...content.matchAll(/{\s*id: '(quran_\d+_\d+)',[\s\S]*?moods: \[(.*?)\],?\s*}/g),
];

console.log('\n=== CONTENT AUDIT REPORT ===\n');

const moodMap = {};
let totalIssues = 0;

for (const itemMatch of itemMatches) {
  const fullItemText = itemMatch[0];
  const id = itemMatch[1];
  const moodsText = itemMatch[2];

  // Extract moods
  const moods = moodsText.match(/'([^']+)'/g)?.map((m) => m.replace(/'/g, '')) || [];

  // Check for required fields
  const hasAudioKey = /audioKey:\s*'[^']+'/.test(fullItemText);
  const hasArabicText = /arabicText:\s*'[^']+'/.test(fullItemText);
  const hasTransliteration = /transliteration:\s*'[^']+'/.test(fullItemText);
  const hasEnglishTranslation =
    /englishTranslation:\s*'[^']+'/.test(fullItemText) ||
    /englishTranslation:\s*\n\s*'[^']+'/.test(fullItemText);

  const issues = [];
  if (!hasAudioKey) issues.push('missing audioKey');
  if (!hasArabicText) issues.push('missing arabicText');
  if (!hasTransliteration) issues.push('missing transliteration');
  if (!hasEnglishTranslation) issues.push('missing englishTranslation');

  if (issues.length > 0) {
    totalIssues++;
    moods.forEach((mood) => {
      if (!moodMap[mood]) moodMap[mood] = [];
      moodMap[mood].push({ id, issues });
    });
  }
}

// Print results by mood
const allMoods = [
  'Anxious',
  'Sad',
  'Angry',
  'Guilty',
  'Grateful',
  'Content',
  'Calm',
  'Stressed',
  'Hopeful',
  'Energized',
];

allMoods.forEach((mood) => {
  const items = moodMap[mood] || [];
  console.log(`\n📊 ${mood.toUpperCase()}: ${items.length} incomplete verse(s)`);
  items.forEach((item) => {
    console.log(`   ❌ ${item.id}: ${item.issues.join(', ')}`);
  });
});

console.log(`\n\n🔍 SUMMARY: Found ${totalIssues} incomplete verse(s) across all moods\n`);
