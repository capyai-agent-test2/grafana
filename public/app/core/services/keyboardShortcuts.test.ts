import { areKeyboardShortcutsDisabled } from './keyboardShortcuts';

describe('areKeyboardShortcutsDisabled', () => {
  it.each([true, '', '1', 'true'])('returns true when disableShortcuts is %p', (disableShortcuts) => {
    expect(areKeyboardShortcutsDisabled({ disableShortcuts })).toBe(true);
  });

  it.each([true, '', '1', 'true'])('returns true when disableKeyboardShortcuts is %p', (disableKeyboardShortcuts) => {
    expect(areKeyboardShortcutsDisabled({ disableKeyboardShortcuts })).toBe(true);
  });

  it('returns true when repeated params include an enabled value', () => {
    expect(areKeyboardShortcutsDisabled({ disableShortcuts: ['0', '1'] })).toBe(true);
  });

  it.each([undefined, false, '0', 'false'])('returns false when the disable params are not enabled: %p', (value) => {
    expect(areKeyboardShortcutsDisabled({ disableShortcuts: value, disableKeyboardShortcuts: value })).toBe(false);
  });
});
