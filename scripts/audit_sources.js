const fs = require('fs');

const quranData = fs.readFileSync('src/data/quranData.ts', 'utf8');
const sunnahData = fs.readFileSync('src/data/sunnahData.ts', 'utf8');

let flagged = [];

// ──── Pattern 1: Search for specific red-flag keywords ────
const redFlagPatterns = [
  { pattern: /ya\s+salam/gi, desc: 'Ya Salam wazifa' },
  { pattern: /visualiz/gi, desc: 'Visualization technique' },
  { pattern: /manifest(?:ation|ing)/gi, desc: 'Manifestation language' },
  { pattern: /wazifa/gi, desc: 'Wazifa terminology' },
  { pattern: /imagine\s+/gi, desc: 'Imagination/visualization' },
  { pattern: /feel\s+the\s+energy/gi, desc: 'Energy language' },
  { pattern: /positive\s+energy/gi, desc: 'Positive energy' },
  { pattern: /mantra/gi, desc: 'Mantra terminology' },
  { pattern: /affirmation/gi, desc: 'Affirmation terminology' },
  { pattern: /universe.*(?:will|can|shall|help)/gi, desc: 'Universe as agent' },
  { pattern: /law\s+of\s+attraction/gi, desc: 'Law of attraction' },
  { pattern: /channel.*energy/gi, desc: 'Channeling energy' },
  { pattern: /chakra/gi, desc: 'Chakra reference' },
  { pattern: /third\s+eye/gi, desc: 'Third eye reference' },
  { pattern: /higher\s+self/gi, desc: 'Higher self terminology' },
  { pattern: /cosmic/gi, desc: 'Cosmic terminology' },
  { pattern: /crystal/gi, desc: 'Crystal healing' },
  { pattern: /frequency/gi, desc: 'Frequency/vibration language' },
];

for (const { pattern, desc } of redFlagPatterns) {
  for (const [filename, content] of [
    ['quranData.ts', quranData],
    ['sunnahData.ts', sunnahData],
  ]) {
    let m;
    const regex = new RegExp(pattern.source, pattern.flags);
    while ((m = regex.exec(content)) !== null) {
      const start = Math.max(0, m.index - 60);
      const end = Math.min(content.length, m.index + m[0].length + 60);
      const context = content.substring(start, end).replace(/\n/g, ' ').trim();
      flagged.push({
        file: filename,
        issue: desc,
        match: m[0],
        context: context.substring(0, 150),
      });
    }
  }
}

// ──── Pattern 2: Search for practiceStep sources that look weak ────
// Look for sources that don't reference known hadith collections or Quran
const stepSourceRegex = /source:\s*['\"]([^'\"]+)['\"].*?(?:title:\s*['\"]([^'\"]+)['\"])?/g;
let m2;
while ((m2 = stepSourceRegex.exec(quranData)) !== null) {
  const source = m2[1];
  const lower = source.toLowerCase();
  // Check if source references a known collection
  const hasReliable = [
    'bukhari',
    'muslim',
    'dawud',
    'tirmidhi',
    'nasa',
    'majah',
    'ahmad',
    'hibban',
    'hakim',
    'tabarani',
    'bayhaqi',
    'hisn',
    'quran',
    'surah',
    'darimi',
    'muwatta',
    'al-adab',
  ].some((c) => lower.includes(c));
  if (!hasReliable && source.length > 5) {
    // Check if it's just a generic description
    if (/general|practice|sunnah|islamic|scholars|ibn|imam|tafsir/i.test(lower)) continue;
    flagged.push({
      file: 'quranData.ts',
      issue: 'Practice step with unverifiable source',
      source: source.substring(0, 100),
    });
  }
}

// ──── Pattern 3: Check for fixed dhikr counts without hadith ────
const countRegex = /(?:say|recite|repeat).*?(\d+)\s*(?:times|x\b)/gi;
while ((m2 = countRegex.exec(quranData)) !== null) {
  const start = Math.max(0, m2.index - 80);
  const end = Math.min(quranData.length, m2.index + m2[0].length + 120);
  const context = quranData.substring(start, end).replace(/\n/g, ' ');
  // Check if there's a hadith source nearby
  const hasSource = /bukhari|muslim|dawud|tirmidhi|nasa|majah|ahmad|hisn/i.test(context);
  if (!hasSource) {
    flagged.push({
      file: 'quranData.ts',
      issue: `Fixed count (${m2[1]}x) without nearby hadith citation`,
      context: context.substring(0, 150),
    });
  }
}

// ──── Output ────
console.log(`\n=== AUDIT: ${flagged.length} potential issues ===\n`);
for (let i = 0; i < flagged.length; i++) {
  const f = flagged[i];
  console.log(`--- Issue ${i + 1} ---`);
  console.log(`File: ${f.file}`);
  console.log(`Issue: ${f.issue}`);
  if (f.match) console.log(`Match: "${f.match}"`);
  if (f.source) console.log(`Source: ${f.source}`);
  if (f.context) console.log(`Context: ${f.context}`);
  console.log('');
}
