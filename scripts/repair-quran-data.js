/**
 * Quran Data Repair Script
 *
 * This script systematically updates all Quran entries in quranData.ts to ensure
 * they match the official text from Quran.com. It preserves the 'id' and 'audioKey',
 * but updates everything else to be correct based on those keys.
 *
 * Run with: node scripts/repair-quran-data.js
 */

const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, '..', 'src', 'data', 'quranData.ts');
const outputDir = path.join(__dirname, 'output');
const QURAN_API_BASE = 'https://api.quran.com/api/v4';

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Helper to fetch verse data from API
async function fetchVerseData(chapter, verse) {
  const url = `${QURAN_API_BASE}/verses/by_key/${chapter}:${verse}?translations=131&words=true&word_fields=text_uthmani`;
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const data = await response.json();
    return data.verse;
  } catch (error) {
    console.error(`Error fetching ${chapter}:${verse}:`, error.message);
    return null;
  }
}

// Fetch transliteration separately if needed
async function fetchTransliteration(chapter, verse) {
  // Quran.com API v4 has a specific endpoint for transliterations
  const url = `${QURAN_API_BASE}/quran/transliteration?chapter_number=${chapter}&verse_number=${verse}`;
  try {
    const response = await fetch(url);
    if (!response.ok) return '';
    const data = await response.json();
    return data.transliterations[0].text_madani.replace(/<[^>]*>?/gm, ''); // Remove any HTML tags
  } catch (error) {
    return '';
  }
}

// Simple transliteration generator if API fails
function simpleTransliterate(words) {
  return words.map((w) => w.transliteration?.text || '').join(' ');
}

async function getFullVerseInfo(chapter, verse) {
  const verseData = await fetchVerseData(chapter, verse);
  if (!verseData) {
    console.error(`  ❌ Failed to fetch verse data for ${chapter}:${verse}`);
    return null;
  }

  const arabic = verseData.words
    ? verseData.words
        .filter((w) => w.char_type_name === 'word')
        .map((w) => w.text_uthmani)
        .join(' ')
    : '';

  // Try to get verse-level translation, fallback to word-by-word if missing
  let translation = '';
  if (verseData.translations && verseData.translations.length > 0) {
    translation = verseData.translations[0].text.replace(/<[^>]*>?/gm, '');
  } else if (verseData.words) {
    translation = verseData.words
      .filter((w) => w.char_type_name === 'word')
      .map((w) => w.translation?.text || '')
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  const transliteration = verseData.words
    ? verseData.words
        .filter((w) => w.char_type_name === 'word')
        .map((w) => w.transliteration?.text || '')
        .join(' ')
    : '';

  return { arabic, translation, transliteration };
}

async function repairData() {
  console.log('=== Quran Data Repair Started ===\n');

  const originalFile = fs.readFileSync(dataPath, 'utf-8');
  const lines = originalFile.split('\n');

  // Custom parsing to identify blocks
  let updatedFile = '';
  let insideEntry = false;
  let currentEntryLines = [];
  let currentId = '';
  let currentAudioKey = '';
  let entriesProcessed = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (
      line.trim().startsWith('{') &&
      (lines[i + 1]?.includes('id:') || lines[i + 1]?.trim().startsWith('id:'))
    ) {
      insideEntry = true;
      currentEntryLines = [line];
      continue;
    }

    if (insideEntry) {
      currentEntryLines.push(line);

      const idMatch = line.match(/id:\s*['"]([^'"]+)['"]/);
      if (idMatch) currentId = idMatch[1];

      const audioKeyMatch = line.match(/audioKey:\s*['"]([^'"]+)['"]/);
      if (audioKeyMatch) currentAudioKey = audioKeyMatch[1];

      if (line.trim() === '},' || line.trim() === '}') {
        // End of entry, process it
        if (currentId.startsWith('quran_') && currentAudioKey) {
          console.log(`\nRepairing Entry: ${currentId} (AudioKey: ${currentAudioKey})`);

          // Parse range
          const [chapter, versePart] = currentAudioKey.split(':');
          const ranges = [];
          if (versePart.includes('-')) {
            const [start, end] = versePart.split('-').map((v) => parseInt(v));
            for (let v = start; v <= end; v++) ranges.push({ chapter, verse: v });
          } else {
            ranges.push({ chapter, verse: parseInt(versePart) });
          }

          let fullArabic = '';
          let fullTranslit = '';
          let fullEnglish = '';

          for (const ref of ranges) {
            const info = await getFullVerseInfo(ref.chapter, ref.verse);
            if (info) {
              fullArabic += (fullArabic ? ' ' : '') + info.arabic;
              fullTranslit += (fullTranslit ? ' ' : '') + info.transliteration;
              fullEnglish += (fullEnglish ? ' ' : '') + info.translation;
            }
            await new Promise((r) => setTimeout(r, 100)); // Rate limit
          }

          // Clean symbols from Arabic
          fullArabic = fullArabic.replace(/[﴿﴾٠-٩\d]/g, '').trim();
          if (ranges.length === 1) {
            fullArabic += ` ﴿${ranges[0].verse}﴾`;
          } else {
            fullArabic += ` ﴿${ranges[0].verse}-${ranges[ranges.length - 1].verse}﴾`;
          }

          // Build updated entry
          const indent = currentEntryLines[1].match(/^\s*/)[0];
          updatedFile += currentEntryLines[0] + '\n';
          updatedFile += `${indent}id: '${currentId}',\n`;
          updatedFile += `${indent}type: 'Quran',\n`;
          updatedFile += `${indent}primaryText: "${fullTranslit.replace(/"/g, '\\"')}",\n`;
          updatedFile += `${indent}arabicText: '${fullArabic}',\n`;
          updatedFile += `${indent}transliteration: "${fullTranslit.replace(/"/g, '\\"')}",\n`;
          updatedFile += `${indent}englishTranslation: "${fullEnglish.replace(/"/g, '\\"')}",\n`;

          // Find original non-standard fields like source, whyThis, moods
          const sourceLine = currentEntryLines.find((l) => l.includes('source:'));
          const whyThisLine = currentEntryLines.find((l) => l.includes('whyThis:'));
          const moodsLine = currentEntryLines.find((l) => l.includes('moods:'));

          if (sourceLine) updatedFile += sourceLine + '\n';
          updatedFile += `${indent}audioKey: '${currentAudioKey}',\n`;
          if (whyThisLine) updatedFile += whyThisLine + '\n';
          if (moodsLine) updatedFile += moodsLine + '\n';
          updatedFile += line + '\n';

          entriesProcessed++;
        } else {
          // Non-Quran entry or no audioKey, keep as is
          updatedFile += currentEntryLines.join('\n') + '\n';
        }

        insideEntry = false;
        currentEntryLines = [];
        currentId = '';
        currentAudioKey = '';
      }
    } else {
      updatedFile += line + '\n';
    }
  }

  // Final cleanup (handle trailing newlines)
  updatedFile = updatedFile.trimEnd() + '\n';

  console.log(`\nFinal file length: ${updatedFile.length} characters`);

  if (updatedFile.length < 1000) {
    console.error('❌ ERROR: Generated file is too short. Something went wrong.');
    return;
  }

  const tempPath = path.join(outputDir, 'quranData_repaired.ts');
  console.log(`Writing to: ${tempPath}`);
  fs.writeFileSync(tempPath, updatedFile);

  console.log(`\n=== Repair Complete ===`);
  console.log(`Processed ${entriesProcessed} Quran entries.`);
  console.log(`Repaired file saved to: ${tempPath}`);
}

repairData().catch((err) => {
  const errorMsg = `\nCRITICAL ERROR DURING REPAIR: ${err.message}\n${err.stack}\n`;
  console.error(errorMsg);
  fs.writeFileSync(path.join(__dirname, 'output', 'repair_error.log'), errorMsg);
  process.exit(1);
});
