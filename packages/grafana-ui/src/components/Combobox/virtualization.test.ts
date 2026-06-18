import { MENU_OPTION_HEIGHT, MENU_OPTION_HEIGHT_DESCRIPTION } from './getComboboxStyles';
import { type ComboboxOption } from './types';
import {
  estimateComboboxItemHeight,
  FALLBACK_BROWSER_MAX_SCROLL_HEIGHT,
  getAdjustedVirtualRowOffset,
  getVirtualScrollMetrics,
} from './virtualization';

describe('combobox virtualization helpers', () => {
  it('includes group headers and descriptions in item height estimates', () => {
    const previousOption: ComboboxOption = { label: 'a', value: 'a', group: 'group-1' };
    const option: ComboboxOption = {
      label: 'b',
      value: 'b',
      group: 'group-2',
      description: 'has description',
    };

    expect(
      estimateComboboxItemHeight(option, previousOption, MENU_OPTION_HEIGHT, MENU_OPTION_HEIGHT_DESCRIPTION)
    ).toBe(MENU_OPTION_HEIGHT + MENU_OPTION_HEIGHT_DESCRIPTION);
  });

  it('keeps native scroll sizing when the list fits within browser limits', () => {
    expect(getVirtualScrollMetrics(10_000, 300, FALLBACK_BROWSER_MAX_SCROLL_HEIGHT)).toEqual({
      physicalTotalSize: 10_000,
      physicalToLogicalScale: 1,
    });
  });

  it('caps scroll height and preserves access to the logical bottom of large lists', () => {
    const viewportSize = 320;
    const totalSize = 39_000_000;
    const maxScrollHeight = 16_777_216;

    const metrics = getVirtualScrollMetrics(totalSize, viewportSize, maxScrollHeight);

    expect(metrics.physicalTotalSize).toBeLessThanOrEqual(maxScrollHeight);

    const logicalMaxOffset = totalSize - viewportSize;
    const physicalMaxOffset = metrics.physicalTotalSize - viewportSize;

    expect(physicalMaxOffset / metrics.physicalToLogicalScale).toBeCloseTo(logicalMaxOffset);
  });

  it('keeps rendered rows anchored relative to the viewport while scrolling in compressed mode', () => {
    const scale = 0.4;
    const logicalScrollOffset = 1_000_000;
    const physicalScrollOffset = logicalScrollOffset * scale;
    const logicalRowStart = logicalScrollOffset + 200;
    const physicalRowStart = logicalRowStart * scale;

    expect(getAdjustedVirtualRowOffset(physicalRowStart, physicalScrollOffset, scale) - physicalScrollOffset).toBe(
      200
    );
  });
});
