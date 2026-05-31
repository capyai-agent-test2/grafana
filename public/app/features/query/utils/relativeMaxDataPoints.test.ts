import { getMaxDataPointsFromWidth, parseMaxDataPoints } from './relativeMaxDataPoints';

describe('relative max data points', () => {
  it('parses absolute and relative max data points', () => {
    expect(parseMaxDataPoints('100')).toBe(100);
    expect(parseMaxDataPoints(' 50% ')).toBe('50%');
    expect(parseMaxDataPoints('12.5%')).toBe('12.5%');
  });

  it('treats empty, zero, and invalid values as auto', () => {
    expect(parseMaxDataPoints('')).toBeNull();
    expect(parseMaxDataPoints('0')).toBeNull();
    expect(parseMaxDataPoints('0%')).toBeNull();
    expect(parseMaxDataPoints('10px')).toBeNull();
  });

  it('calculates relative max data points from panel width', () => {
    expect(getMaxDataPointsFromWidth('50%', 401)).toBe(200);
    expect(getMaxDataPointsFromWidth('0.5%', 100)).toBe(1);
    expect(getMaxDataPointsFromWidth(123, 401)).toBe(123);
    expect(getMaxDataPointsFromWidth(null, 401)).toBe(401);
  });
});
