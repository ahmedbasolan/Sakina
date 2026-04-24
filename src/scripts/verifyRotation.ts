import { quranContent, quranContentAngles } from '../data/quranData';
import { Mood } from '../types';

console.log('Verifying content integrity...');

// 1. Check Content IDs
console.log('1. Checking Content IDs...');
const contentIds = new Set(quranContent.map((c: any) => c.id));
let missingIds = 0;
quranContentAngles.forEach((angle: any) => {
  if (!contentIds.has(angle.contentId)) {
    console.error(`Missing content for angle ${angle.id}: ${angle.contentId}`);
    missingIds++;
  }
});
if (missingIds === 0) console.log('All content IDs valid.');

// 2. Verify Mood Coverage
console.log('\n2. Verifying Mood Coverage...');
const moodsToCheck: Mood[] = [
  'Overwhelmed',
  'Sad',
  'Angry',
  'Tired',
  'Lonely',
  'Grateful',
  'Hopeful',
  'Calm',
];

moodsToCheck.forEach((mood: Mood) => {
  console.log(`\nChecking Mood: ${mood}`);

  // Count direct mood matches
  const directMatches = quranContentAngles.filter((a: any) => a.mood === mood);
  console.log(`  - Direct Angle Matches: ${directMatches.length}`);

  if (directMatches.length === 0) {
    console.warn(`  [WARNING] No angles found for mood: ${mood}`);
  }
});

console.log('\nVerification complete.');
