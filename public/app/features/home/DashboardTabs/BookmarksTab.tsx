import { css } from '@emotion/css';

import { type NavModelItem, type GrafanaTheme2 } from '@grafana/data';
import { Trans, t } from '@grafana/i18n';
import { EmptyState, useStyles2 } from '@grafana/ui';
import { NavLandingPageCard } from 'app/core/components/NavLandingPage/NavLandingPageCard';

interface Props {
  items: NavModelItem[];
}

export function BookmarksTab({ items }: Props) {
  const styles = useStyles2(getStyles);

  if (items.length === 0) {
    return (
      <EmptyState hideImage variant="completed" message={t('home.bookmarks-tab.empty', 'Your bookmarks will appear here.')}>
        <Trans i18nKey="home.bookmarks-tab.empty-description">
          Bookmark pages from the navigation menu, or star dashboards to keep them close at hand.
        </Trans>
      </EmptyState>
    );
  }

  return (
    <section className={styles.grid}>
      {items.map((item) => (
        <NavLandingPageCard
          key={item.id || item.url}
          description={item.subTitle}
          text={item.text}
          url={item.url ?? ''}
        />
      ))}
    </section>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  grid: css({
    display: 'grid',
    gap: theme.spacing(2),
    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
    padding: theme.spacing(2, 0),
  }),
});
