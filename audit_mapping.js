const fs = require('fs');
const path = 'c:/dev/guidance-app/src/data/quranData.ts';

try {
    const content = fs.readFileSync(path, 'utf8');
    const moodMap = {};
    // Regex to find source and moods. Assumes source comes before moods in the object.
    const regex = /source:\s*'([^']+)',[\s\S]*?moods:\s*\[([^\]]+)\]/g;
    let match;
    let count = 0;

    while ((match = regex.exec(content)) !== null) {
        count++;
        const source = match[1];
        const moodsStr = match[2];
        const moods = moodsStr.split(',').map(m => m.trim().replace(/'/g, ''));

        moods.forEach(mood => {
            if (!moodMap[mood]) moodMap[mood] = new Set();
            moodMap[mood].add(source);
        });
    }

    console.log(`Total Curated Entries: ${count}\n`);

    Object.keys(moodMap).sort().forEach(mood => {
        console.log(`### ${mood} (${moodMap[mood].size} verses)`);
        Array.from(moodMap[mood]).sort().forEach(v => console.log(`- ${v}`));
        console.log('');
    });
} catch (err) {
    console.error(err);
}
