export function getRowAnchorId(title?: string, fallback = 'row'): string {
  const normalizedTitle = title
    ?.trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return normalizedTitle || fallback;
}

export function doesRowAnchorMatchLocation(title?: string, fallback?: string): boolean {
  return window.location.hash === `#${getRowAnchorId(title, fallback)}`;
}
