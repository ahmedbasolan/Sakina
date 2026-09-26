import fs from 'fs';
import path from 'path';

// Both verse screens show the premium theme photo through ImmersiveBackground
// and must use the same photo opacity; the journey screen was once left on the
// 0.25 default after the mood screen was brightened. WHAT THIS DOES NOT CATCH:
// how bright the photo looks on a device, or a third verse screen added later.
describe('verse screen photo opacity', () => {
  it.each(['GuidanceScreen.tsx', 'PathStepScreen.tsx'])(
    '%s passes VERSE_SCREEN_PHOTO_OPACITY to ImmersiveBackground',
    (file) => {
      const source = fs.readFileSync(path.join(__dirname, '../../screens', file), 'utf8');
      expect(source).toMatch(
        /<ImmersiveBackground[^>]*overlayOpacity=\{VERSE_SCREEN_PHOTO_OPACITY\}/,
      );
    },
  );
});
