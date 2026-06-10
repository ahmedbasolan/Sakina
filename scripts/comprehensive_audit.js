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
  return { chapter, start, end, length: end - start + 1 };
}

function countArabicChars(text) {
  if (!text) return 0;
  return (text.match(/[\u0600-\u06FF]/g) || []).length;
}

const auditResults = {
  quranContent: [],
  contentAngles: [],
  summary: {
    totalQuranEntries: 0,
    totalAngleEntries: 0,
    issuesFound: 0,
  },
};

// More robust entry extraction: split by "  }," at the end of an object
const entries = content.split(/\n\s+\},/);

entries.forEach((entryText) => {
  const idMatch = entryText.match(/id:\s*'([^']+)'/);
  if (!idMatch) return;
  const id = idMatch[1];

  if (id.startsWith('quran_')) {
    auditResults.summary.totalQuranEntries++;

    const audioKey = getField(entryText, 'audioKey');
    const source = getField(entryText, 'source');
    const arabic = getField(entryText, 'arabicText');
    const english = getField(entryText, 'englishTranslation');

    const issues = [];
    if (!audioKey) issues.push('Missing audioKey');
    if (!source) issues.push('Missing source');
    if (!arabic) issues.push('Missing arabicText');
    if (!english) issues.push('Missing englishTranslation');

    if (source && audioKey) {
      const sRange = parseRange(source);
      const aRange = parseRange(audioKey);
      if (sRange && aRange) {
        if (
          sRange.chapter !== aRange.chapter ||
          sRange.start !== aRange.start ||
          sRange.end !== aRange.end
        ) {
          issues.push(`Range mismatch: Source(${source}) vs AudioKey(${audioKey})`);
        }
      }
    }

    if (arabic && audioKey) {
      const aRange = parseRange(audioKey);
      if (aRange) {
        const charCount = countArabicChars(arabic);
        const minChars = aRange.length * 15;
        if (charCount < minChars) {
          issues.push(`Text suspiciously short for ${aRange.length} verses (${charCount} chars)`);
        }
      }
    }

    if (issues.length > 0) {
      auditResults.quranContent.push({ id, issues });
      auditResults.summary.issuesFound += issues.length;
    }
  } else if (id.startsWith('q_angle_')) {
    auditResults.summary.totalAngleEntries++;

    const action = getField(entryText, 'action');
    const hasPracticeSteps = entryText.includes('practiceSteps:');
    const actionSource = getField(entryText, 'actionSource');

    const issues = [];
    if (action) {
      if (!hasPracticeSteps) {
        issues.push('Action present but missing practiceSteps');
      } else {
        // Check if source is present in the object text (simplistic check)
        if (!entryText.includes('source:') && !actionSource) {
          issues.push('Action missing source (both in actionSource and practiceSteps)');
        }
      }
    }

    if (issues.length > 0) {
      auditResults.contentAngles.push({ id, issues });
      auditResults.summary.issuesFound += issues.length;
    }
  }
});

const outputDir = path.join(__dirname, '../output');
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);
fs.writeFileSync(
  path.join(outputDir, 'comprehensive-audit-report.json'),
  JSON.stringify(auditResults, null, 2),
);

console.log(`Audit complete. Found ${auditResults.summary.issuesFound} issues.`);
console.log(
  `Summary: ${auditResults.summary.totalQuranEntries} Quran entries, ${auditResults.summary.totalAngleEntries} angles.`,
);
console.log(`Report written to output/comprehensive-audit-report.json`);
