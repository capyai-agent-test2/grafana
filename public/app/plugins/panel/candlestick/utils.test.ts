import { representativeDelta } from './utils';

describe('representativeDelta', () => {
  it('returns the spacing for uniform data', () => {
    expect(representativeDelta([1000, 2000, 3000, 4000], [1, 1, 1, 1])).toBe(1000);
  });

  it('ignores a small first gap from a partial edge bucket', () => {
    expect(representativeDelta([0, 250, 1250, 2250, 3250], [1, 1, 1, 1, 1])).toBe(1000);
  });

  it('ignores a small last gap from a partial edge bucket', () => {
    expect(representativeDelta([0, 1000, 2000, 3000, 3100], [1, 1, 1, 1, 1])).toBe(1000);
  });

  it('is not dominated by an interior outlier gap', () => {
    expect(representativeDelta([0, 1000, 2000, 3000, 5000, 6000, 7000], [1, 1, 1, 1, 1, 1, 1])).toBe(1000);
  });

  it('keeps the full-gap median for short series with an interior outlier', () => {
    expect(representativeDelta([0, 1000, 3000, 4000], [1, 1, 1, 1])).toBe(1000);
  });

  it('stays stable under timestamp jitter', () => {
    expect(representativeDelta([0, 1000, 2001, 2999, 4000], [1, 1, 1, 1, 1])).toBe(999.5);
  });

  it('skips null and undefined y values', () => {
    expect(representativeDelta([0, 1000, 2000, 3000], [1, null, 1, 1])).toBe(1500);
    expect(representativeDelta([0, 1000, 2000, 3000], [1, undefined, 1, 1])).toBe(1500);
  });

  it('skips non-positive and non-finite deltas', () => {
    expect(representativeDelta([1000, 1000, 2000], [1, 1, 1])).toBe(1000);
    expect(representativeDelta([1000, NaN, 2000, 3000], [1, 1, 1, 1])).toBe(1000);
  });

  it('handles short series without edge exclusion', () => {
    expect(representativeDelta([1000, 2000], [1, 1])).toBe(1000);
    expect(representativeDelta([0, 1000, 4000], [1, 1, 1])).toBe(2000);
  });

  it('returns null with fewer than two valid points', () => {
    expect(representativeDelta([], [])).toBeNull();
    expect(representativeDelta([1000], [1])).toBeNull();
    expect(representativeDelta([1000, 2000], [null, 1])).toBeNull();
  });
});
