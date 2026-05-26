import { css } from '@emotion/css';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAsyncRetry } from 'react-use';

import { type ComponentTypeWithExtensionMeta, PluginExtensionPoints, type GrafanaTheme2 } from '@grafana/data';
import { t } from '@grafana/i18n';
import { usePluginComponents } from '@grafana/runtime';
import { ScrollContainer, Stack, Tab, TabContent, TabsBar, useStyles2 } from '@grafana/ui';
import { usePinnedItems } from 'app/core/components/AppChrome/MegaMenu/hooks';
import { SETUPGUIDE_PLUGIN_ID } from 'app/core/constants';
import { getCombinedBookmarkItems } from 'app/core/utils/bookmarkItems';
import { getRecentlyViewedDashboards } from 'app/features/browse-dashboards/api/recentlyViewed';
import { useDashboardLocationInfo } from 'app/features/search/hooks/useDashboardLocationInfo';
import { useSelector } from 'app/types/store';

import { BookmarksTab } from './BookmarksTab';
import { RecentDashboardsTab } from './RecentDashboardsTab';
import { type HomepageTabExtensionProps, type HomepageTab, validateHomepageTab } from './types';

const RECENT_TAB_ID = 'recent';
const BOOKMARKS_TAB_ID = 'bookmarks';
const MAX_RECENT = 20;

function DashboardExtensionTab({
  Component,
  registerTab,
  activeTab,
}: {
  Component: ComponentTypeWithExtensionMeta<HomepageTabExtensionProps>;
  registerTab: (tab: HomepageTab) => () => void;
  activeTab: string;
}) {
  const [id, setId] = useState<string | null>(null);
  const register = useCallback(
    (tab: unknown) => {
      validateHomepageTab(tab);

      setId(tab.id);
      const unregister = registerTab(tab);

      return () => {
        setId(null);
        unregister();
      };
    },
    [registerTab]
  );

  return <Component register={register} active={activeTab === id} />;
}

export function DashboardTabs() {
  const styles = useStyles2(getStyles);
  const [activeTab, setActiveTab] = useState(RECENT_TAB_ID);
  const [extensionTabs, setExtensionTabs] = useState<HomepageTab[]>([]);
  const navTree = useSelector((state) => state.navBarTree);
  const pinnedItems = usePinnedItems();
  const bookmarkItems = useMemo(() => getCombinedBookmarkItems(navTree, pinnedItems), [navTree, pinnedItems]);

  const {
    value: recentDashboards,
    loading: recentLoading,
    error: recentError,
    retry: recentRetry,
  } = useAsyncRetry(() => getRecentlyViewedDashboards(MAX_RECENT), []);

  const { foldersByUid } = useDashboardLocationInfo((recentDashboards?.length ?? 0) > 0);

  const { components: extensionComponents } = usePluginComponents<HomepageTabExtensionProps>({
    extensionPointId: PluginExtensionPoints.HomepageTabs,
  });

  const registerTab = useCallback((tab: HomepageTab) => {
    setExtensionTabs((prev) => [...prev, tab]);
    return () => setExtensionTabs((prev) => prev.filter((t) => t !== tab));
  }, []);

  // Auto-switch to the non-empty tab when initial data finishes loading
  const didAutoSwitch = useRef(false);
  useEffect(() => {
    if (didAutoSwitch.current || recentLoading) {
      return;
    }

    const recentEmpty = !recentDashboards?.length;
    const bookmarksEmpty = bookmarkItems.length === 0;

    if (activeTab === RECENT_TAB_ID && recentEmpty && !bookmarksEmpty) {
      setActiveTab(BOOKMARKS_TAB_ID);
      didAutoSwitch.current = true;
      return;
    }

    if (activeTab === BOOKMARKS_TAB_ID && bookmarksEmpty && !recentEmpty) {
      setActiveTab(RECENT_TAB_ID);
      didAutoSwitch.current = true;
      return;
    }

    if ((activeTab === RECENT_TAB_ID || activeTab === BOOKMARKS_TAB_ID) && recentEmpty && bookmarksEmpty) {
      const extensionTab = extensionTabs.find((tab) => !tab.href);
      if (extensionTab) {
        setActiveTab(extensionTab.id);
        didAutoSwitch.current = true;
        return;
      }
    }
  }, [recentLoading, recentDashboards, bookmarkItems, extensionTabs, activeTab]);

  const builtInTabs: HomepageTab[] = [
    {
      id: RECENT_TAB_ID,
      label: t('home.dashboard-tabs.recent', 'Recent'),
      activeLabel: t('home.dashboard-tabs.recent-active', 'Recent dashboards'),
      counter: recentDashboards?.length,
    },
    {
      id: BOOKMARKS_TAB_ID,
      label: t('home.dashboard-tabs.bookmarks', 'Bookmarks'),
      activeLabel: t('home.dashboard-tabs.bookmarks-active', 'Bookmarks'),
      counter: bookmarkItems.length,
    },
  ];

  const contentTabs = [...builtInTabs, ...extensionTabs.filter((tab) => !tab.href)];
  const linkTabs = extensionTabs.filter((tab) => tab.href);

  return (
    <Stack direction="column" gap={2}>
      <TabsBar>
        {contentTabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <Tab
              key={tab.id}
              label={isActive ? (tab.activeLabel ?? tab.label) : tab.label}
              active={isActive}
              counter={tab.counter}
              onChangeTab={() => setActiveTab(tab.id)}
            />
          );
        })}
        {linkTabs.length > 0 && <div className={styles.linkTabsSpacer} />}
        {linkTabs.map((tab) => (
          <Tab key={tab.id} label={tab.label} icon={tab.icon} href={tab.href!} />
        ))}
      </TabsBar>

      {(activeTab === RECENT_TAB_ID || activeTab === BOOKMARKS_TAB_ID) && (
        <TabContent className={styles.tabContent}>
          <ScrollContainer showScrollIndicators maxHeight="256px" minHeight="256px">
            {activeTab === RECENT_TAB_ID && (
              <RecentDashboardsTab
                dashboards={recentDashboards ?? []}
                loading={recentLoading}
                error={recentError}
                retry={recentRetry}
                foldersByUid={foldersByUid}
              />
            )}
            {activeTab === BOOKMARKS_TAB_ID && <BookmarksTab items={bookmarkItems} />}
          </ScrollContainer>
        </TabContent>
      )}

      {/* Render extension component tabs without background + scroller */}
      {extensionComponents
        .filter((Component) => Component.meta.pluginId === SETUPGUIDE_PLUGIN_ID)
        .map((Component, i) => (
          <DashboardExtensionTab key={i} Component={Component} registerTab={registerTab} activeTab={activeTab} />
        ))}
    </Stack>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  tabContent: css({
    padding: 0,
    borderRadius: theme.shape.radius.default,
  }),
  linkTabsSpacer: css({
    flex: 1,
  }),
});
