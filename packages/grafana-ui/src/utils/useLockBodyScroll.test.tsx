import { render } from '@testing-library/react';

import * as scrollbar from './scrollbar';
import { useLockBodyScroll } from './useLockBodyScroll';

function TestComponent({ enabled = true }: { enabled?: boolean }) {
  useLockBodyScroll(enabled);

  return null;
}

describe('useLockBodyScroll', () => {
  beforeEach(() => {
    jest.spyOn(scrollbar, 'getScrollbarWidth').mockReturnValue(16);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    document.body.removeAttribute('style');
    document.documentElement.removeAttribute('style');
  });

  it('locks body and root scrolling while mounted and restores styles on unmount', () => {
    document.body.style.setProperty('padding-right', '4px', 'important');

    const { unmount } = render(<TestComponent />);

    expect(document.body.style.getPropertyValue('overflow')).toBe('hidden');
    expect(document.body.style.getPropertyPriority('overflow')).toBe('important');
    expect(document.body.style.getPropertyValue('overflow-y')).toBe('hidden');
    expect(document.body.style.getPropertyPriority('overflow-y')).toBe('important');
    expect(document.body.style.getPropertyValue('padding-right')).toBe('20px');
    expect(document.body.style.getPropertyPriority('padding-right')).toBe('important');
    expect(document.documentElement.style.getPropertyValue('overflow')).toBe('hidden');
    expect(document.documentElement.style.getPropertyValue('overflow-y')).toBe('hidden');

    unmount();

    expect(document.body.style.getPropertyValue('overflow')).toBe('');
    expect(document.body.style.getPropertyValue('overflow-y')).toBe('');
    expect(document.body.style.getPropertyValue('padding-right')).toBe('4px');
    expect(document.body.style.getPropertyPriority('padding-right')).toBe('important');
    expect(document.documentElement.style.getPropertyValue('overflow')).toBe('');
    expect(document.documentElement.style.getPropertyValue('overflow-y')).toBe('');
  });

  it('keeps the page locked until the last overlay unmounts', () => {
    const { unmount: unmountFirst } = render(<TestComponent />);
    const { unmount: unmountSecond } = render(<TestComponent />);

    unmountFirst();

    expect(document.body.style.getPropertyValue('overflow')).toBe('hidden');
    expect(document.documentElement.style.getPropertyValue('overflow')).toBe('hidden');

    unmountSecond();

    expect(document.body.style.getPropertyValue('overflow')).toBe('');
    expect(document.documentElement.style.getPropertyValue('overflow')).toBe('');
  });
});
