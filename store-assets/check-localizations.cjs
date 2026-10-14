// Checks store-assets/app-store-localizations.json against Apple's field limits
// and the rule that a word should not repeat across name, subtitle and keywords
// within one locale (Apple indexes them as one pool, so a repeat wastes space).
// It does NOT check translation quality or that claims match the app.
const fs = require('fs');
const path = require('path');
const all = JSON.parse(fs.readFileSync(path.join(__dirname, 'app-store-localizations.json'), 'utf8'));
const resolve = (loc) => (typeof all[loc] === 'string' ? all[all[loc].slice(1)] : all[loc]);
const LIMITS = { name: 30, subtitle: 30, keywords: 100, promotionalText: 170, description: 4000, whatsNew: 4000 };
let bad = 0;
for (const loc of Object.keys(all).filter((k) => !k.startsWith('_'))) {
  const L = resolve(loc);
  const row = [];
  for (const [field, max] of Object.entries(LIMITS)) {
    const v = L[field];
    if (typeof v === 'string' && v.startsWith('@')) { row.push(`${field}=${v}`); continue; }
    const n = [...v].length;
    if (n > max) { bad++; row.push(`!! ${field} ${n}/${max}`); } else row.push(`${field} ${n}/${max}`);
  }
  const kw = L.keywords.split(',');
  if (kw.some((k) => k !== k.trim() || !k)) { bad++; row.push('!! keyword spacing/empty'); }
  const dupes = kw.filter((k, i) => kw.indexOf(k) !== i);
  const words = new Set(`${L.name} ${L.subtitle}`.toLocaleLowerCase().split(/[\s:,&،·]+/u).filter(Boolean));
  const repeats = kw.filter((k) => words.has(k.toLocaleLowerCase()));
  if (dupes.length || repeats.length) { bad++; row.push(`!! repeated: ${[...dupes, ...repeats].join(',')}`); }
  console.log(loc.padEnd(6), row.join(' | '));
}
console.log(bad ? `${bad} problem(s)` : 'all locales within limits, no repeated words');
process.exit(bad ? 1 : 0);
