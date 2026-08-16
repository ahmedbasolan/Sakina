/**
 * Rebuilds assets/icon.png at the full 1024×1024 Apple requires.
 *
 * Why this exists:
 *   icon.png shipped at 512×512. Expo always emits the iOS icon at exactly
 *   1024 (@expo/prebuild-config withIosIcons.js — `const size = 1024`) and its
 *   resize path has no upscale guard, so a 512 source was being stretched to
 *   1024. Since Xcode 14 the App Store marketing icon ships inside the binary,
 *   so that upscaled image was what rendered on the store listing.
 *
 * How it works:
 *   - RGB comes from assets/new-icon.png (1254×1254), which is the same
 *     artwork at higher resolution — verified as a 0.89/255 mean per-channel
 *     match against the old icon.png, measured with both normalised to 256×256.
 *     (Re-measuring at a different size gives a different number; the figure is
 *     only meaningful with that normalisation.)
 *   - The alpha channel is carried over from the old icon.png so the ~3.7%
 *     rounded corners are preserved exactly. Six in-app screens render this
 *     asset as a brand emblem, and one of them (AuthScreens' `emblemIcon`)
 *     has no borderRadius of its own — it relies on the baked corners. Keeping
 *     the mask means the resolution fix changes nothing on screen.
 *
 * On the alpha channel and App Store rejection (ITMS-90717):
 *   Apple rejects app icons containing alpha, but Expo strips it during
 *   prebuild — `removeTransparency: true` with `backgroundColor: '#ffffff'`
 *   for the light and tinted variants. The transparent corners flatten to
 *   white, and at a 3.7% radius they sit far inside iOS's ~22.4% squircle
 *   mask, so the white is never visible. Transparency is deliberately kept
 *   for the dark variant, which is what Expo expects.
 *
 * Run:
 *   node scripts/build-ios-icon.js
 *
 * Icons are baked into the binary — this cannot ship over EAS Update.
 * It needs a rebuild.
 */

const path = require('path');
const fs = require('fs');

let sharp;
try {
  sharp = require('sharp');
} catch {
  console.error('sharp not installed. Run: npm install sharp --save-dev');
  process.exit(1);
}

const SRC_RGB = path.join(__dirname, '../assets/new-icon.png');
const SRC_ALPHA = path.join(__dirname, '../assets/icon.png');
const TMP = path.join(__dirname, '../assets/icon.tmp.png');
const DST = path.join(__dirname, '../assets/icon.png');

const TARGET = 1024;

async function main() {
  const rgbMeta = await sharp(SRC_RGB).metadata();
  if (rgbMeta.width < TARGET || rgbMeta.height < TARGET) {
    throw new Error(
      `${path.basename(SRC_RGB)} is ${rgbMeta.width}×${rgbMeta.height} — ` +
        `smaller than ${TARGET}. Refusing to upscale, which is the exact bug this fixes.`,
    );
  }
  // Square check is separate from the size check on purpose: the resize below
  // uses fit:'cover', which centre-crops rather than letterboxing. A non-square
  // source that is large enough in both dimensions passes the size guard and
  // then loses the overhang silently (a 2000×1100 source drops 900px of width
  // with no warning). Assert squareness rather than discover it in the artwork.
  if (rgbMeta.width !== rgbMeta.height) {
    throw new Error(
      `${path.basename(SRC_RGB)} is ${rgbMeta.width}×${rgbMeta.height} — not square. ` +
        `fit:'cover' would centre-crop it silently. Supply a square source.`,
    );
  }

  // Alpha mask from the current icon, scaled to target. The mask is a plain
  // rounded-corner shape with no detail, so resampling it is lossless in
  // practice — unlike the artwork, which must come from the high-res source.
  const alpha = await sharp(SRC_ALPHA)
    .ensureAlpha()
    .extractChannel(3)
    .resize(TARGET, TARGET, { fit: 'fill' })
    .raw()
    .toBuffer();

  const rgb = await sharp(SRC_RGB)
    .resize(TARGET, TARGET, { fit: 'cover' })
    .removeAlpha()
    .raw()
    .toBuffer();

  // Interleave RGB + alpha by hand. sharp's joinChannel() produced a 4-band
  // image that it did not tag as alpha (metadata reported channels: 3,
  // hasAlpha: false), silently dropping the corner mask. Building the RGBA
  // buffer explicitly leaves no room for that ambiguity.
  const px = TARGET * TARGET;
  const rgba = Buffer.alloc(px * 4);
  for (let i = 0, j = 0, k = 0; i < px; i++, j += 3, k += 4) {
    rgba[k] = rgb[j];
    rgba[k + 1] = rgb[j + 1];
    rgba[k + 2] = rgb[j + 2];
    rgba[k + 3] = alpha[i];
  }

  await sharp(rgba, { raw: { width: TARGET, height: TARGET, channels: 4 } })
    .png({ compressionLevel: 9 })
    .toFile(TMP);

  // Verify the written file before it replaces the real one. The first version
  // of this script printed "alpha MISSING" and moved the file into place
  // anyway; a check that only reports is not a check.
  //
  // WHAT THESE CHECKS DO NOT CATCH — read this before treating a green run as
  // "the icon is correct". They confirm the output is a 1024×1024 RGBA image
  // whose corner is transparent and whose centre is opaque. They say nothing
  // about:
  //   - Whether the RGB is the *right artwork*. Point SRC_RGB at any square
  //     image ≥1024 and every check below still passes. Nothing here compares
  //     pixels against a reference, so a swapped or corrupted source ships
  //     silently. Verify the artwork by eye, or diff against new-icon.png.
  //   - Whether the corner radius matches the original. Only pixel (0,0) is
  //     sampled, so any mask with a transparent extreme corner passes — a
  //     50%-radius circle would too. The radius is preserved by construction
  //     (the mask is copied from the previous icon.png), not by this check.
  //   - Colour profile, ICC data, or bit depth.
  //   - Anything about how Expo later flattens the alpha, which is where the
  //     actual App Store icon is produced.
  let renamed = false;
  try {
    const out = await sharp(TMP).metadata();
    const problems = [];
    if (out.width !== TARGET || out.height !== TARGET)
      problems.push(`expected ${TARGET}×${TARGET}, got ${out.width}×${out.height}`);
    if (!out.hasAlpha) problems.push('alpha channel was dropped — corner mask lost');

    const outAlpha = await sharp(TMP).ensureAlpha().extractChannel(3).raw().toBuffer();
    const corner = outAlpha[0];
    const centre = outAlpha[TARGET * (TARGET >> 1) + (TARGET >> 1)];
    if (corner !== 0) problems.push(`corner should be transparent, alpha=${corner}`);
    if (centre !== 255) problems.push(`centre should be opaque, alpha=${centre}`);

    if (problems.length) {
      throw new Error(`Refusing to overwrite icon.png:\n  - ${problems.join('\n  - ')}`);
    }

    fs.renameSync(TMP, DST);
    renamed = true;
    console.log(
      `Done — icon.png is ${out.width}×${out.height}, alpha preserved ` +
        `(corner ${corner}, centre ${centre}), ${(fs.statSync(DST).size / 1024).toFixed(0)} KB`,
    );
  } finally {
    // Any throw between writing TMP and renaming it — including one from sharp
    // reading TMP back — must not leave assets/icon.tmp.png behind. It is not
    // gitignored, so a leaked temp file lands in `git status` and gets committed.
    if (!renamed && fs.existsSync(TMP)) fs.unlinkSync(TMP);
  }
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
