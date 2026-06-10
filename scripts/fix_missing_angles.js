const fs = require('fs');
const path = require('path');

const filePath = path.join(process.cwd(), 'src', 'data', 'quranData.ts');
const fileContent = fs.readFileSync(filePath, 'utf-8');

// Find all Quran IDs
const idMatches = [...fileContent.matchAll(/id:\s*['\"](quran_\d+_\d+.*?)['\"]/g)];
const ids = idMatches.map((m) => m[1]);

// Find all existing angle contentIds
const angles = [...fileContent.matchAll(/contentId:\s*['\"](quran_\d+_\d+.*?)['\"]/g)].map(
  (m) => m[1],
);

const missing = [];
idMatches.forEach((m) => {
  const id = m[1];
  if (!angles.includes(id)) {
    // Extract moods for this ID
    const endOfId = m.index + m[0].length;
    const endOfBlock = fileContent.indexOf('},', endOfId);
    if (endOfBlock === -1) return;
    const block = fileContent.substring(m.index, endOfBlock);
    const moodsMatch = block.match(/moods:\s*\[([\s\S]*?)\]/);
    const moods = moodsMatch
      ? moodsMatch[1]
          .split(',')
          .map((mo) => mo.trim().replace(/['\"]/g, ''))
          .filter(Boolean)
      : [];
    missing.push({ id, moods });
  }
});

console.log(`Found ${missing.length} verses missing angles.`);

if (missing.length === 0) {
  process.exit(0);
}

// Generate new angles
let newAnglesStr = '';
missing.forEach((item) => {
  item.moods.forEach((mood) => {
    newAnglesStr += `  {
    id: 'q_angle_${item.id.replace('quran_', '')}_${mood.toLowerCase()}',
    contentId: '${item.id}',
    mood: '${mood}',
    angle: 'Reflect on how this verse provides light and guidance for your heart.',
    action: 'Recite this verse slowly and reflect on its meaning for your current state.',
    reflection: 'How does it feel to know that Allah has sent this specific message for you?',
  },\n`;
  });
});

// Insert new angles before the closing bracket of quranContentAnglesData
const anglesEndTag = '];';
const lastAnglesArrayIdx = fileContent.lastIndexOf(
  'export { quranContent, quranContentAnglesData as quranContentAngles };',
);
const insertPos = fileContent.lastIndexOf(anglesEndTag, lastAnglesArrayIdx);

if (insertPos !== -1) {
  const updatedContent =
    fileContent.substring(0, insertPos) + newAnglesStr + fileContent.substring(insertPos);
  fs.writeFileSync(filePath, updatedContent, 'utf-8');
  console.log(`Successfully added ${missing.length} missing angles to quranData.ts`);
} else {
  console.error('Could not find insertion point for angles.');
}
