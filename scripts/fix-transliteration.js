const fs = require('fs');
const path = require('path');

// Read the quranData.ts file
const filePath = path.join(__dirname, '..', 'src', 'data', 'quranData.ts');
let content = fs.readFileSync(filePath, 'utf-8');

// List of verse IDs that need transliteration added
const versesNeedingFix = [
  'quran_94_5',
  'quran_2_255',
  'quran_2_286',
  'quran_65_3',
  'quran_3_173',
  'quran_53_39',
  'quran_2_257',
  'quran_8_40',
  'quran_5_23',
  'quran_14_12',
  'quran_8_2',
  'quran_67_29',
  'quran_25_58',
  'quran_12_90',
  'quran_8_46',
  'quran_10_62',
  'quran_12_87',
  'quran_94_5_sad',
  'quran_65_7',
  'quran_21_87',
  'quran_3_8',
  'quran_40_60',
  'quran_39_10',
  'quran_11_115',
  'quran_35_12',
  'quran_2_172',
  'quran_39_7',
  'quran_54_35',
  'quran_4_147',
  'quran_76_3',
  'quran_27_40',
  'quran_34_13',
  'quran_7_58',
  'quran_31_14',
  'quran_30_38',
  'quran_17_7',
  'quran_18_30',
  'quran_28_77',
  'quran_2_148',
  'quran_5_48',
  'quran_18_110',
  'quran_67_2',
  'quran_30_4',
  'quran_3_170',
  'quran_25_63',
  'quran_8_10',
  'quran_9_26',
  'quran_9_40',
  'quran_2_265',
  'quran_65_2',
  'quran_2_216',
  'quran_94_6',
  'quran_3_26',
  'quran_18_46',
  'quran_17_11',
  'quran_21_90',
  'quran_32_16',
  'quran_13_28',
  'quran_89_27',
  'quran_2_45',
  'quran_6_17',
  'quran_7_188',
  'quran_42_30',
  'quran_27_62',
  'quran_21_83',
  'quran_9_51',
  'quran_48_4',
  'quran_30_21',
  'quran_48_18',
  'quran_2_208',
  'quran_6_54',
  'quran_16_32',
  'quran_97_5',
  'quran_56_91',
  'quran_89_27_30',
  'quran_36_58',
  'quran_93_11',
  'quran_55_13',
  'quran_10_58',
  'quran_5_3',
  'quran_28_73',
  'quran_2_152',
  'quran_20_25',
  'quran_20_25_28',
  'quran_94_1_8',
  'quran_2_186',
  'quran_40_44',
  'quran_2_153',
  'quran_41_30',
  'quran_20_46',
  'quran_24_22',
  'quran_8_33',
  'quran_50_16',
  'quran_67_13',
  'quran_93_1_5',
  'quran_16_53',
  'quran_35_35',
  'quran_25_47',
  'quran_78_9',
  'quran_6_13',
  'quran_2_177',
  'quran_20_130',
  'quran_17_79',
  'quran_29_69',
  'quran_23_1',
  'quran_7_31',
  'quran_29_45',
  'quran_22_77',
  'quran_14_40',
  'quran_51_22',
  'quran_11_6',
];

let fixedCount = 0;
let alreadyHasTransliteration = 0;
let noPrimaryText = 0;

console.log('\n🔧 Starting transliteration fix...\n');

versesNeedingFix.forEach((verseId) => {
  // Find the verse block
  const versePattern = new RegExp(
    `(\\{\\s*id:\\s*'${verseId}'[\\s\\S]*?moods:\\s*\\[[^\\]]+\\][\\s\\S]*?\\})`,
    'g',
  );

  const match = versePattern.exec(content);
  if (!match) {
    console.log(`❌ Could not find verse: ${verseId}`);
    return;
  }

  const verseBlock = match[1];

  // Check if already has transliteration
  if (/transliteration:\s*'/.test(verseBlock) || /transliteration:\s*"/.test(verseBlock)) {
    alreadyHasTransliteration++;
    return;
  }

  // Extract primaryText
  const primaryTextMatch = verseBlock.match(/primaryText:\s*['"]([^'"]+)['"]/);
  if (!primaryTextMatch) {
    console.log(`⚠️  No primaryText found for: ${verseId}`);
    noPrimaryText++;
    return;
  }

  const primaryText = primaryTextMatch[1];

  // Find where to insert transliteration (after arabicText)
  const insertPattern = new RegExp(
    `(\\{\\s*id:\\s*'${verseId}'[\\s\\S]*?arabicText:[\\s\\S]*?['"][\\s\\S]*?['"],)(\\n)`,
    'g',
  );

  const newContent = content.replace(insertPattern, (match, before, newline) => {
    return `${before}${newline}    transliteration: '${primaryText}',${newline}`;
  });

  if (newContent !== content) {
    content = newContent;
    fixedCount++;
    console.log(`✅ ${verseId}`);
  }
});

// Write the fixed content back
fs.writeFileSync(filePath, content, 'utf-8');

console.log(`\n📊 Fix Summary:`);
console.log(`   ✅ Fixed: ${fixedCount} verses`);
console.log(`   ⏭️  Already had transliteration: ${alreadyHasTransliteration} verses`);
console.log(`   ⚠️  No primaryText: ${noPrimaryText} verses`);
console.log(`\n✨ quranData.ts has been updated!\n`);
