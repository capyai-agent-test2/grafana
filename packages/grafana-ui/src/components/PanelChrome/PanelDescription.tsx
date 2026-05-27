import { css, cx } from '@emotion/css';
import type { JSX } from 'react';

import { type GrafanaTheme2 } from '@grafana/data';
import { t } from '@grafana/i18n';

import { useStyles2 } from '../../themes/ThemeContext';
import { Icon } from '../Icon/Icon';
import { Tooltip } from '../Tooltip/Tooltip';

import { TitleItem } from './TitleItem';

interface Props {
  description: string | (() => string);
  className?: string;
}

export function PanelDescription({ description, className }: Props) {
  const styles = useStyles2(getStyles);

  const getDescriptionContent = (): JSX.Element => {
    // description
    const panelDescription = typeof description === 'function' ? description() : description;

    return (
      <div className="panel-info-content markdown-html">
        <div dangerouslySetInnerHTML={{ __html: panelDescription }} />
      </div>
    );
  };

  return description !== '' ? (
    <Tooltip interactive content={getDescriptionContent}>
      <TitleItem
        aria-label={t('grafana-ui.panel-description.aria-label', 'More information about panel')}
        className={cx(className, styles.description)}
        role="button"
      >
        <Icon name="info-circle" size="md" />
      </TitleItem>
    </Tooltip>
  ) : null;
}

const getStyles = (theme: GrafanaTheme2) => {
  return {
    description: css({
      code: {
        whiteSpace: 'normal',
        wordWrap: 'break-word',
      },

      'pre > code': {
        display: 'block',
      },
    }),
  };
};
