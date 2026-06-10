const fs = require('fs');

// We'll read the file directly since it might have non-standard TS syntax or imports
const content = fs.readFileSync('../src/data/quranData.ts', 'utf8');

const NEGATIVE_MOODS = ['Anxious', 'Stressed', 'Sad', 'Angry', 'Tired'];
const POSITIVE_MOODS = ['Grateful', 'Hopeful', 'Calm', 'Content', 'Energized', 'Happy']; // Added 'Happy' as it's in the Mood type

// Simple parser for the quranContentData array
// We'll search for id: and moods:
const verseRegex = /id:\s*'([^']+)'[\s\S]*?moods:\s*\[([^\]]+)\]/g;
let match;
const violations = [];
const overshared = [];
const distribution = {};

[...NEGATIVE_MOODS, ...POSITIVE_MOODS].forEach((mood) => (distribution[mood] = 0));

const verseMoodMap = {};

while ((match = verseRegex.exec(content)) !== null) {
  const id = match[1];
  const moods = match[2].split(',').map((m) => m.trim().replace(/'/g, ''));
  verseMoodMap[id] = moods;

  const hasNegative = moods.some((m) => NEGATIVE_MOODS.includes(m));
  const hasPositive = moods.some((m) => POSITIVE_MOODS.includes(m));

  moods.forEach((mood) => {
    if (distribution[mood] !== undefined) {
      distribution[mood]++;
    }
  });

  if (hasNegative && hasPositive) {
    violations.push({ id, moods });
  }

  if (moods.length > 3) {
    overshared.push({ id, moods });
  }
}

// Simple parser for ContentAngles
const angleRegex =
  /id:\s*'(q_angle_[^']+)'[\s\S]*?contentId:\s*'([^']+)'[\s\S]*?mood:\s*'([^']+)'/g;
const orphanedAngles = [];
while ((match = angleRegex.exec(content)) !== null) {
  const angleId = match[1];
  const contentId = match[2];
  const angleMood = match[3];

  if (!verseMoodMap[contentId]) {
    orphanedAngles.push({ angleId, contentId, reason: 'Verse not found' });
  } else if (!verseMoodMap[contentId].includes(angleMood)) {
    orphanedAngles.push({ angleId, contentId, angleMood, verseMoods: verseMoodMap[contentId] });
  }
}

console.log('--- MOOD CATEGORY AUDIT REPORT ---');
console.log('\n❌ Category Violations (Mixed Negative & Positive):');
if (violations.length === 0) console.log('None');
violations.forEach((v) => console.log(`${v.id}: [${v.moods.join(', ')}]`));

console.log('\n⚠️ Over-shared Verses (> 3 moods):');
if (overshared.length === 0) console.log('None');
overshared.forEach((v) => console.log(`${v.id}: [${v.moods.join(', ')}]`));

console.log('\n🧹 Orphaned Content Angles (Mood mismatch):');
if (orphanedAngles.length === 0) console.log('None');
orphanedAngles.forEach((oa) => {
  console.log(
    `${oa.angleId}: Verse ${oa.contentId} has [${oa.verseMoods.join(', ')}] but angle is for ${oa.angleMood}`,
  );
});

console.log('\n📊 Current Mood Distribution:');
Object.entries(distribution).forEach(([mood, count]) => {
  console.log(`${mood.padEnd(10)}: ${count} verses`);
});

const totalUnique = (content.match(/id:\s*'quran_/g) || []).length;
console.log(`\nTotal Unique Verses: ${totalUnique}`);
