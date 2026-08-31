// scripts/add-pilot-story.mjs
//
// Worked example of the structural-edit pattern every content tick follows.
// Locates by id, asserts exactly one match, preserves CRLF, writes nothing
// unless every edit resolved. Kept in the repo as the template for Plan B's
// tick scripts rather than deleted after use.
//
// Every clause of the story below maps to a fetched ayah of Surah Yusuf:
//   84  his eyes became white from grief
//   85  the sons warn he will make himself ill or perish
//   86  he complains only to Allah, and knows from Allah what they do not
//   87  go and find out; despair not of relief from Allah
//   94  the caravan departs; he says he senses Yusuf
//   95  his family calls it his same old error
//   96  the bearer of good tidings casts it over his face; he sees again
//
// Nothing is asserted that those ayat do not say. In particular: no duration
// for the separation, no claim the sons believed Yusuf dead (85 warns about
// Ya'qub, not Yusuf), and no naming of who carried the shirt back — 96 says
// only "the bearer of good tidings". An earlier draft of this file asserted
// all three from memory.
import fs from 'fs';

const FILE = 'src/data/quranData.ts';
const src = fs.readFileSync(FILE, 'utf8');

if (!src.includes('\r\n')) {
  console.error('x refusing to write: CRLF line endings are already gone');
  process.exit(1);
}

const TARGET = "id: 'quran_12_87'";
const hits = [...src.matchAll(new RegExp(TARGET.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'))];
if (hits.length !== 1) {
  console.error(`x expected exactly 1 match for ${TARGET}, found ${hits.length}`);
  process.exit(1);
}

// Anchor on the entry's own `moods:` line so the insert lands inside the right
// object rather than at the first `moods:` after the id.
const objStart = hits[0].index;
const moodsAt = src.indexOf('moods: [', objStart);
if (moodsAt === -1) {
  console.error('x could not find the moods line for quran_12_87');
  process.exit(1);
}

const STORY = [
  '    story: {',
  "      title: 'What He Knew That They Did Not',",
  '      body:',
  '        "Ya\'qub\'s grief for Yusuf turned his eyes white. His sons told him he would " +',
  "        'make himself ill, or destroy himself, going on remembering Yusuf — and he ' +",
  "        'answered that he took his sorrow and his grief to Allah alone, and that he ' +",
  "        'knew from Allah what they did not know. Then he sent them out to search, and ' +",
  "        'told them not to despair of relief from Allah, because despairing of it is ' +",
  "        'not what a believer does. When the caravan set out for home he said he could ' +",
  "        'sense Yusuf, and his family told him he was in the same old error. Then the ' +",
  "        'bearer of good news arrived and cast the shirt over his face, and his sight ' +",
  "        'came back — and he asked them whether he had not told them all along that he ' +",
  "        'knew from Allah what they did not know.',",
  "      source: 'Surah Yusuf 12:84-96',",
  "      sourceType: 'quran_narrative',",
  '    },',
].join('\r\n') + '\r\n';

const out = src.slice(0, moodsAt - 4) + STORY + src.slice(moodsAt - 4);

if (!out.includes('\r\n')) {
  console.error('x refusing to write: the edit destroyed CRLF');
  process.exit(1);
}

fs.writeFileSync(FILE, out);
console.log('ok — pilot story added to quran_12_87');
