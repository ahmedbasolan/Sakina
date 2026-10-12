import { resolveStep, resolvePath, redactVariantId } from '../leaderChoice';
import { PathStep, SpiritualPath } from '../../types';

const plain: PathStep = {
  id: 'step_x_1', pathId: 'path_x', day: 1, title: 'T', focus: 'F',
  contentId: 'quran_1_1', angleId: 'q_angle_x_day1', hadithContentId: 'hadith_x_1', isCompleted: false,
};
const withVariant: PathStep = {
  ...plain, id: 'step_x_2', day: 2, angleId: 'q_angle_x_day2',
  variants: { womanLeading: { angleId: 'q_angle_x_day2_f', title: 'TW' } },
};
const path: SpiritualPath = {
  id: 'path_x', title: 'X', description: 'd', duration: 2, theme: 'Hopeful', target: 't',
  dailySteps: [plain, withVariant], leaderChoice: true,
};

describe('resolveStep', () => {
  it('returns the same object when there is no choice', () => {
    expect(resolveStep(withVariant, null)).toBe(withVariant);
  });
  it('returns the same object for "man"', () => {
    expect(resolveStep(withVariant, 'man')).toBe(withVariant);
  });
  it('returns the same object for a day without a variant', () => {
    expect(resolveStep(plain, 'woman')).toBe(plain);
  });
  it('applies only the fields the variant sets', () => {
    const r = resolveStep(withVariant, 'woman');
    expect(r.angleId).toBe('q_angle_x_day2_f');
    expect(r.title).toBe('TW');
    expect(r.focus).toBe('F');
    expect(r.hadithContentId).toBe('hadith_x_1');
    expect(r.contentId).toBe('quran_1_1');
    expect(withVariant.angleId).toBe('q_angle_x_day2'); // source not mutated
  });
});

describe('resolvePath', () => {
  it('returns the same object for "man" and for null', () => {
    expect(resolvePath(path, 'man')).toBe(path);
    expect(resolvePath(path, null)).toBe(path);
  });
  it('ignores the choice on a path without leaderChoice', () => {
    const other = { ...path, leaderChoice: undefined };
    expect(resolvePath(other, 'woman')).toBe(other);
  });
  it('resolves every step for "woman" without mutating the source', () => {
    const r = resolvePath(path, 'woman');
    expect(r).not.toBe(path);
    expect(r.dailySteps[0]).toBe(plain);
    expect(r.dailySteps[1].angleId).toBe('q_angle_x_day2_f');
    expect(path.dailySteps[1].angleId).toBe('q_angle_x_day2');
  });
});

describe('redactVariantId', () => {
  it('strips the women-variant suffix', () => {
    expect(redactVariantId('q_angle_imam_day8_f')).toBe('q_angle_imam_day8');
    expect(redactVariantId('hadith_imam_14_f')).toBe('hadith_imam_14');
  });
  it('leaves other ids alone', () => {
    expect(redactVariantId('q_angle_imam_day8')).toBe('q_angle_imam_day8');
  });
});
