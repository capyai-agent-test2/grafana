import { type NavModelItem } from '@grafana/data';

export function findBookmarkItemByUrl(nodes: NavModelItem[], url: string): NavModelItem | null {
  for (const item of nodes) {
    if (item.url === url) {
      return item;
    }

    if (item.children?.length) {
      const found = findBookmarkItemByUrl(item.children, url);
      if (found) {
        return found;
      }
    }
  }

  return null;
}

export function getPinnedNavItems(navTree: NavModelItem[], pinnedUrls: string[]): NavModelItem[] {
  return pinnedUrls.reduce((acc: NavModelItem[], url) => {
    const item = findBookmarkItemByUrl(navTree, url);
    if (item) {
      acc.push(item);
    }
    return acc;
  }, []);
}

export function getStarredNavItems(navTree: NavModelItem[]): NavModelItem[] {
  return navTree.find((item) => item.id === 'starred')?.children ?? [];
}

export function getCombinedBookmarkItems(navTree: NavModelItem[], pinnedUrls: string[]): NavModelItem[] {
  const seen = new Set<string>();
  const items = [...getPinnedNavItems(navTree, pinnedUrls), ...getStarredNavItems(navTree)];

  return items.filter((item) => {
    const key = item.url ?? item.id ?? item.text;
    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}
