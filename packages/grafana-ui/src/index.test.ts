import {
  getQuickOptions,
  isRangeValid,
  isRelativeFormat,
  mapOptionToRelativeTimeRange,
  mapRelativeTimeRangeToOption,
  quickOptions,
} from './index';

describe('@grafana/ui DateTimePicker exports', () => {
  it('exports the quick time options helpers', () => {
    expect(quickOptions).toBe(getQuickOptions);
    expect(quickOptions()[0]).toEqual({
      from: 'now-5m',
      to: 'now',
      display: 'Last 5 minutes',
    });
  });

  it('exports relative time range mapping and validation helpers', () => {
    expect(mapOptionToRelativeTimeRange({ from: 'now-5m', to: 'now', display: 'Last 5 minutes' })).toEqual({
      from: 300,
      to: 0,
    });
    expect(mapRelativeTimeRangeToOption({ from: 300, to: 0 })).toEqual({
      from: 'now-5m',
      to: 'now',
      display: 'now-5m to now',
    });
    expect(isRelativeFormat('now-5m')).toBe(true);
    expect(isRangeValid('now-5m')).toEqual({ isValid: true });
  });
});
