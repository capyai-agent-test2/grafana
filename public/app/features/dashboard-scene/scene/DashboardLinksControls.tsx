import { css } from '@emotion/css';

import { type GrafanaTheme2 } from '@grafana/data';
import { sceneGraph } from '@grafana/scenes';
import { type DashboardLink } from '@grafana/schema';
import { useStyles2 } from '@grafana/ui';
import { DashboardExternalLinksDropdown } from 'app/features/dashboard/components/SubMenu/DashboardLinksDashboard';

import { DashboardLinkRenderer } from './DashboardLinkRenderer';
import { type DashboardScene } from './DashboardScene';

export interface Props {
  links: DashboardLink[];
  dashboard: DashboardScene;
}

export function DashboardLinksControls({ links, dashboard }: Props) {
  sceneGraph.getTimeRange(dashboard).useState();
  const { uid } = dashboard.useState();
  const styles = useStyles2(getStyles);
  const linksToDisplay = excludeControlMenuLinks(links);
  const dropdownLinks = linksToDisplay.filter((link) => link.type === 'link' && link.asDropdown);

  if (linksToDisplay.length === 0) {
    return null;
  }

  let hasRenderedDropdown = false;
  const renderedLinks = linksToDisplay.map((link: DashboardLink, index: number) => {
    const key = `${link.title}-$${index}`;

    if (link.type === 'link' && link.asDropdown) {
      if (hasRenderedDropdown) {
        return null;
      }

      hasRenderedDropdown = true;
      return <DashboardExternalLinksDropdown key={key} links={dropdownLinks} />;
    }

    return (
      <DashboardLinkRenderer
        link={link}
        dashboardUID={uid}
        key={key}
        linkIndex={links.indexOf(link)}
        dashboard={dashboard}
      />
    );
  });

  return <div className={styles.linksContainer}>{renderedLinks}</div>;
}

function excludeControlMenuLinks(links: DashboardLink[]): DashboardLink[] {
  if (!links || links.length === 0) {
    return [];
  }

  return links.filter((link) => link.placement === undefined);
}

function getStyles(theme: GrafanaTheme2) {
  return {
    linksContainer: css({
      label: 'dashboard-links-controls',
      display: 'inline-flex',
      alignItems: 'center',
      gap: theme.spacing(1),
      marginRight: theme.spacing(1),
      marginBottom: theme.spacing(1),
      flexWrap: 'wrap',
      // Match variable/annotation alignment in the controls row
      alignSelf: 'flex-start',
    }),
  };
}
