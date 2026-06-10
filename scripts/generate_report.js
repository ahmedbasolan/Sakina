const fs = require('fs');
const path = require('path');

const quranDataPath = path.resolve(__dirname, '../src/data/quranData.ts');
const sunnahDataPath = path.resolve(__dirname, '../src/data/sunnahData.ts');

function generateReport() {
  const quranContent = fs.readFileSync(quranDataPath, 'utf8');
  const sunnahContent = fs.readFileSync(sunnahDataPath, 'utf8');

  // Extract anglesData from quranData.ts
  let anglesMatchText;
  const anglesDataMatch = quranContent.match(
    /quranContentAnglesData[:\w\s\[\]]* = \[\s*([\s\S]*?)\s*\];/,
  );

  if (anglesDataMatch) {
    anglesMatchText = anglesDataMatch[1];
  } else {
    console.error('Could not find quranContentAnglesData in quranData.ts');
    return;
  }

  const items = anglesMatchText.split(/\},\s*\{/);
  console.log(`Found ${items.length} curated angles.`);
  const report = {};

  items.forEach((item) => {
    const idMatch = item.match(/id:\s*['"](.*?)['"]/);
    const moodMatch = item.match(/mood:\s*['"](.*?)['"]/);
    const actionMatch = item.match(/action:\s*['"](.*?)['"]/);
    const sourceMatch = item.match(/actionSource:\s*['"](.*?)['"]/);
    const rewardMatch = item.match(/actionReward:\s*['"]([\s\S]*?)['"]/);

    const id = idMatch ? idMatch[1] : 'unknown';
    const mood = moodMatch ? moodMatch[1] : 'Unknown';
    const action = actionMatch ? actionMatch[1] : null;
    const hasSource = sourceMatch || (rewardMatch && rewardMatch[1].includes('['));

    if (!report[mood]) report[mood] = { hasAction: [], reflectionOnly: [] };

    if (action && hasSource) {
      report[mood].hasAction.push({
        id,
        action,
        source: sourceMatch ? sourceMatch[1] : 'Hadith Citation',
      });
    } else {
      report[mood].reflectionOnly.push({
        id,
        status: action ? 'Unauthenticated Action' : 'Pure Reflection',
      });
    }
  });

  // Add Sunnah Data
  const sunnahMatches = sunnahContent.match(/\{[\s\S]*?\}/g);
  if (sunnahMatches) {
    sunnahMatches.forEach((m) => {
      const moodMatch = m.match(/moods:\s*\[([\s\S]*?)\]/);
      const textMatch = m.match(/primaryText:\s*['"](.*?)['"]/);
      const sourceMatch = m.match(/source:\s*['"](.*?)['"]/);

      if (moodMatch && textMatch) {
        const moods = moodMatch[1].replace(/['"\s]/g, '').split(',');
        moods.forEach((mood) => {
          if (!report[mood]) report[mood] = { hasAction: [], reflectionOnly: [] };
          report[mood].hasAction.push({
            id: 'Sunnah',
            action: textMatch[1],
            source: sourceMatch ? sourceMatch[1] : 'Verified',
          });
        });
      }
    });
  }

  // Output Markdown
  let md = '# Guidance Content Report\n\n';
  for (const mood in report) {
    md += `## Mood: ${mood}\n\n`;
    md += `### âœ… Practical Actions (Authenticated)\n`;
    if (report[mood].hasAction.length === 0) md += '_None_\n';
    report[mood].hasAction.forEach((a) => {
      md += `- **[${a.id}]**: ${a.action} (_Source: ${a.source}_)\n`;
    });

    md += `\n### ðŸ’­ Reflection Only (To be Fallback)\n`;
    if (report[mood].reflectionOnly.length === 0) md += '_None_\n';
    report[mood].reflectionOnly.forEach((r) => {
      md += `- **[${r.id}]**: ${r.status}\n`;
    });
    md += '\n---\n\n';
  }

  fs.writeFileSync(path.resolve(__dirname, 'guidance_report.md'), md);
  console.log('Report generated: scripts/guidance_report.md');
}

generateReport();
