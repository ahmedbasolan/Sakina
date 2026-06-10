const fs = require('fs');
const path = require('path');

const quranDataPath = path.resolve(__dirname, '../src/data/quranData.ts');

function auditQuranData() {
  const content = fs.readFileSync(quranDataPath, 'utf8');

  // Regex to find objects {} that might be ContentAngles
  const matches = content.match(/\{[\s\S]*?\}/g);
  const toRemove = [];

  matches.forEach((m) => {
    // Check if it's a ContentAngle (has id starting with q_angle)
    if (m.includes('id:') && m.includes('q_angle')) {
      const hasAction = m.match(/action:\s*['"`]/);
      const hasActionSource = m.match(/actionSource:\s*['"`]/);
      const hasRewardSource = m.match(/actionReward:\s*['"`][\s\S]*?\[[\s\S]*?\]/);

      if (hasAction && !hasActionSource && !hasRewardSource) {
        const idMatch = m.match(/id:\s*['"](.*?)['"]/);
        if (idMatch) {
          toRemove.push(idMatch[1]);
        }
      }
    }
  });

  console.log(JSON.stringify(toRemove, null, 2));
}

auditQuranData();
