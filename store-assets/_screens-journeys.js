// The Journeys custom product page (store-assets/app-store-listing.md, "Custom
// product page: Journeys"). Same shape as _screens.js; compose with
// SCREEN_SET=journeys and the output goes to app-store/cpp-journeys/, so the
// default page's files are never touched.
//
// Captured 2026-10-14 on Android (1440x3088), Salah Transformation day 5. The crop
// matches 01b-understand-verse: below the status bar, above the nav bar.
// 02 stops earlier: _device.js fills the rest of the screen with the mean colour
// of the crop's last 8 rows. At 2905 those rows cross the day-3 card's green tick
// (a teal band); anywhere inside that card slices its title. 2662-2706 is the
// plain page background between the day-2 and day-3 cards, so the fill matches.

const CROP = { top: 140, bottom: 2905 };

module.exports = [
  { id: '01-choose-journey', verb: 'CHOOSE', desc: 'A GUIDED JOURNEY, 7 TO 14 DAYS', src: 'CPP-J1-LIST.jpg', crop: CROP },
  { id: '02-follow-lessons', verb: 'FOLLOW', desc: 'ONE LESSON EACH DAY', src: 'CPP-J2-DETAIL.jpg', crop: { top: 140, bottom: 2700 } },
  { id: '03-read-verse', verb: 'READ', desc: 'EACH DAY BEGINS WITH A VERSE', src: 'CPP-J3-VERSE.jpg', crop: CROP },
  { id: '04-understand-meaning', verb: 'UNDERSTAND', desc: 'THE MEANING, FROM THE SCHOLARS', src: 'CPP-J4-CONTEXT.jpg', crop: CROP },
  { id: '05-practice-sunnah', verb: 'PRACTICE', desc: 'THE SUNNAH, ONE STEP AT A TIME', src: 'CPP-J5-PRACTICE.jpg', crop: CROP },
  { id: '06-reflect-privately', verb: 'REFLECT', desc: 'PRIVATELY, IN YOUR OWN WORDS', src: 'CPP-J6-REFLECT.jpg', crop: CROP },
];
