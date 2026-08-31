/**
 * Layer-addressing guard for GuidanceScreen.
 *
 * GuidanceScreen used to address layers by literal index — `currentLayer !== 1`
 * to clear the reflection-focus ref, `currentLayer === 1` to render
 * ContextLayer. Its own comment records why that matters: a stuck focus ref
 * "silently kill[s] swipe-to-next-verse". A literal index beside an array
 * whose length now varies is the next person's bug, so this asserts the
 * literals are gone and that story is APPENDED rather than inserted.
 *
 * WHAT THIS DOES NOT CATCH: that the layers render correctly, or that the
 * pager's dots match the layer count on a device. This is a source-shape
 * check; StoryLayer.test.tsx covers the component and the device check covers
 * the rest.
 */
import fs from 'fs';
import path from 'path';

const src = fs.readFileSync(path.join(__dirname, '..', 'GuidanceScreen.tsx'), 'utf8');

describe('GuidanceScreen layer addressing', () => {
  it('appends story rather than inserting it', () => {
    const at = src.indexOf('LAYER_TYPES');
    expect(at).toBeGreaterThan(-1);
    const decl = src.slice(at, src.indexOf('];', at) + 2);
    expect(decl).toContain("'story'");
    expect(decl.indexOf("'story'")).toBeGreaterThan(decl.indexOf("'context'"));
  });

  it('has no hardcoded layer index left', () => {
    expect(src).not.toMatch(/currentLayer !== 1\b/);
    expect(src).not.toMatch(/currentLayer === 1\b/);
  });

  it('gives the pager a label for every layer type', () => {
    expect(src).toContain("'Story'");
  });
});
