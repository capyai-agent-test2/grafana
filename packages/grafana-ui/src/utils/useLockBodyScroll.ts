import { useEffect } from 'react';

import { getScrollbarWidth } from './scrollbar';

type StyleSnapshot = {
  value: string;
  priority: string;
};

let lockCount = 0;
let bodyOverflow: StyleSnapshot | undefined;
let bodyOverflowY: StyleSnapshot | undefined;
let bodyPaddingRight: StyleSnapshot | undefined;
let htmlOverflow: StyleSnapshot | undefined;
let htmlOverflowY: StyleSnapshot | undefined;

function getStyleSnapshot(style: CSSStyleDeclaration, property: string): StyleSnapshot {
  return {
    value: style.getPropertyValue(property),
    priority: style.getPropertyPriority(property),
  };
}

function restoreStyle(style: CSSStyleDeclaration, property: string, snapshot: StyleSnapshot | undefined) {
  if (snapshot?.value) {
    style.setProperty(property, snapshot.value, snapshot.priority);
    return;
  }

  style.removeProperty(property);
}

function lockBodyScroll() {
  if (typeof document === 'undefined' || !document.body) {
    return () => {};
  }

  const { body, documentElement } = document;

  if (lockCount === 0) {
    bodyOverflow = getStyleSnapshot(body.style, 'overflow');
    bodyOverflowY = getStyleSnapshot(body.style, 'overflow-y');
    bodyPaddingRight = getStyleSnapshot(body.style, 'padding-right');
    htmlOverflow = getStyleSnapshot(documentElement.style, 'overflow');
    htmlOverflowY = getStyleSnapshot(documentElement.style, 'overflow-y');

    const currentPaddingRight = Number.parseFloat(window.getComputedStyle(body).paddingRight) || 0;
    const scrollbarWidth = getScrollbarWidth();

    body.style.setProperty('overflow', 'hidden', 'important');
    body.style.setProperty('overflow-y', 'hidden', 'important');

    if (scrollbarWidth > 0) {
      body.style.setProperty('padding-right', `${currentPaddingRight + scrollbarWidth}px`, 'important');
    }

    documentElement.style.setProperty('overflow', 'hidden');
    documentElement.style.setProperty('overflow-y', 'hidden');
  }

  lockCount++;

  return () => {
    lockCount--;

    if (lockCount > 0) {
      return;
    }

    restoreStyle(body.style, 'overflow', bodyOverflow);
    restoreStyle(body.style, 'overflow-y', bodyOverflowY);
    restoreStyle(body.style, 'padding-right', bodyPaddingRight);
    restoreStyle(documentElement.style, 'overflow', htmlOverflow);
    restoreStyle(documentElement.style, 'overflow-y', htmlOverflowY);
  };
}

export function useLockBodyScroll(enabled = true) {
  useEffect(() => {
    if (!enabled) {
      return;
    }

    return lockBodyScroll();
  }, [enabled]);
}
