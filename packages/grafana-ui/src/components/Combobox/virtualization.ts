import { type RefObject, useEffect, useMemo, useState } from 'react';

import { type ComboboxOption } from './types';
import { isNewGroup } from './utils';

export const FALLBACK_BROWSER_MAX_SCROLL_HEIGHT = 16_777_216;

let cachedBrowserMaxScrollHeight: number | undefined;

export function estimateComboboxItemHeight<T extends string | number>(
  option: ComboboxOption<T>,
  previousOption: ComboboxOption<T> | undefined,
  optionHeight: number,
  optionWithDescriptionHeight: number
) {
  const firstGroupItem = isNewGroup(option, previousOption);
  const hasDescription = 'description' in option;
  const hasGroup = 'group' in option;

  let itemHeight = hasDescription ? optionWithDescriptionHeight : optionHeight;
  if (firstGroupItem && hasGroup) {
    itemHeight += optionHeight;
  }

  return itemHeight;
}

export function getBrowserMaxScrollHeight() {
  if (cachedBrowserMaxScrollHeight !== undefined) {
    return cachedBrowserMaxScrollHeight;
  }

  if (typeof document === 'undefined' || !document.body) {
    cachedBrowserMaxScrollHeight = FALLBACK_BROWSER_MAX_SCROLL_HEIGHT;
    return cachedBrowserMaxScrollHeight;
  }

  const probe = document.createElement('div');
  probe.style.position = 'absolute';
  probe.style.visibility = 'hidden';
  probe.style.pointerEvents = 'none';
  probe.style.height = `${FALLBACK_BROWSER_MAX_SCROLL_HEIGHT * 4}px`;

  document.body.appendChild(probe);
  cachedBrowserMaxScrollHeight = Math.max(probe.getBoundingClientRect().height, FALLBACK_BROWSER_MAX_SCROLL_HEIGHT);
  document.body.removeChild(probe);

  return cachedBrowserMaxScrollHeight;
}

export function getVirtualScrollMetrics(totalSize: number, viewportSize: number, maxScrollHeight: number) {
  if (totalSize <= 0) {
    return {
      physicalTotalSize: 0,
      physicalToLogicalScale: 1,
    };
  }

  if (viewportSize <= 0 || totalSize <= maxScrollHeight) {
    return {
      physicalTotalSize: totalSize,
      physicalToLogicalScale: 1,
    };
  }

  const logicalScrollableSize = Math.max(totalSize - viewportSize, 1);
  const physicalScrollableSize = Math.max(maxScrollHeight - viewportSize, 1);
  const physicalToLogicalScale = physicalScrollableSize / logicalScrollableSize;

  return {
    physicalTotalSize: viewportSize + logicalScrollableSize * physicalToLogicalScale,
    physicalToLogicalScale,
  };
}

export function getAdjustedVirtualRowOffset(
  virtualRowStart: number,
  physicalScrollOffset: number,
  physicalToLogicalScale: number
) {
  if (physicalToLogicalScale === 1) {
    return virtualRowStart;
  }

  const logicalStart = virtualRowStart / physicalToLogicalScale;
  const logicalScrollOffset = physicalScrollOffset / physicalToLogicalScale;

  return logicalStart - logicalScrollOffset + physicalScrollOffset;
}

export function useComboboxViewportSize(scrollRef: RefObject<HTMLDivElement | null>) {
  const [viewportSize, setViewportSize] = useState(0);

  useEffect(() => {
    const element = scrollRef.current;
    if (!element) {
      return;
    }

    const updateViewportSize = () => {
      setViewportSize(element.clientHeight);
    };

    updateViewportSize();

    const resizeObserver = new ResizeObserver(updateViewportSize);
    resizeObserver.observe(element);

    return () => {
      resizeObserver.disconnect();
    };
  }, [scrollRef]);

  return viewportSize;
}

export function useComboboxVirtualMetrics<T extends string | number>(
  options: Array<ComboboxOption<T>>,
  scrollRef: RefObject<HTMLDivElement | null>,
  optionHeight: number,
  optionWithDescriptionHeight: number
) {
  const viewportSize = useComboboxViewportSize(scrollRef);

  const logicalTotalSize = useMemo(
    () =>
      options.reduce(
        (total, option, index) =>
          total +
          estimateComboboxItemHeight(
            option,
            index > 0 ? options[index - 1] : undefined,
            optionHeight,
            optionWithDescriptionHeight
          ),
        0
      ),
    [optionHeight, optionWithDescriptionHeight, options]
  );

  return useMemo(
    () => getVirtualScrollMetrics(logicalTotalSize, viewportSize, getBrowserMaxScrollHeight()),
    [logicalTotalSize, viewportSize]
  );
}
