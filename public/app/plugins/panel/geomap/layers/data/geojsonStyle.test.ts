import { getZoomScaledPointValues } from './geojsonStyle';

describe('getZoomScaledPointValues', () => {
  it('keeps the configured size at the base resolution', () => {
    expect(getZoomScaledPointValues({ color: '#000', size: 5 }, 4, 4)).toEqual({ color: '#000', size: 5 });
  });

  it('scales point sizes up as the map zooms in', () => {
    expect(getZoomScaledPointValues({ color: '#000', size: 5 }, 2, 4)).toEqual({ color: '#000', size: 10 });
  });

  it('scales point sizes down as the map zooms out', () => {
    expect(getZoomScaledPointValues({ color: '#000', size: 6 }, 8, 4)).toEqual({ color: '#000', size: 3 });
  });

  it('leaves values unchanged when size or resolution is missing', () => {
    const values = { color: '#000' };

    expect(getZoomScaledPointValues(values, undefined, 4)).toBe(values);
    expect(getZoomScaledPointValues(values, 4, 4)).toBe(values);
    expect(getZoomScaledPointValues({ color: '#000', size: 5 }, 0, 4)).toEqual({ color: '#000', size: 5 });
  });
});
