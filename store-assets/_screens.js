// The eight store screenshots, in one place. The App Store, iPad and Google Play
// composers each kept their own copy of this list, and two of them had no
// source paths at all — they cropped finished App Store PNGs instead.
//
// `src` is relative to app-store/real-screenshots/, which is gitignored: the
// captures live on the machine that makes the screenshots, not in the repo.
// `play` is the Google Play filename for the same screen; Play orders READ
// before GROW, the App Store the other way round.

const STANDARD_CROP = { top: 120, bottom: 2940 }; // 1440-wide native captures
const COMPACT_CROP = { top: 80, bottom: 1905 }; // 932-wide captures (chat-attachment resolution)

module.exports = [
  { id: '01-find-verse', play: '01-hook-mood-grid', verb: 'FIND', desc: 'A VERSE FOR HOW YOU FEEL', src: 'FIND-v2.jpg', crop: STANDARD_CROP },
  { id: '02-ease-overwhelm', play: '02-relief-verse-match', verb: 'EASE', desc: 'OVERWHELM, ONE VERSE AT A TIME', src: 'EASE-v2.jpg', crop: STANDARD_CROP },
  { id: '03-build-habit', play: '03-growth-streak-journeys', verb: 'BUILD', desc: 'A DAILY HABIT THAT STICKS', src: 'BUILD-v2.jpg', crop: STANDARD_CROP },
  // REFLECTION.png and BEGIN.png were recovered on 2026-09-21 from the committed
  // composites after the original captures were lost: the old 994-wide screen
  // region, with the gold wash that frame painted over it inverted exactly
  // (round-trip error 0.000). Already screen-width and status-bar-free, so no crop.
  { id: '04-keep-private', play: '04-trust-private-journal', verb: 'KEEP', desc: 'YOUR REFLECTIONS COMPLETELY PRIVATE', src: 'REFLECTION.png', crop: null },
  { id: '05-begin-journey', play: '05-brand-welcome', verb: 'BEGIN', desc: 'YOUR JOURNEY TO SAKINA', src: 'BEGIN.png', crop: null },
  { id: '06-grow-journeys', play: '07-grow-journeys', verb: 'GROW', desc: 'THROUGH GUIDED SPIRITUAL JOURNEYS', src: 'JOURNEYS.jpg', crop: COMPACT_CROP },
  { id: '07-read-quran', play: '06-read-quran', verb: 'READ', desc: 'THE COMPLETE QURAN, BEAUTIFULLY', src: 'READ-v2.jpg', crop: STANDARD_CROP },
  { id: '08-save-verses', play: '08-save-verses', verb: 'SAVE', desc: 'EVERY VERSE THAT SPEAKS TO YOU', src: 'SAVE.jpg', crop: COMPACT_CROP },
];
