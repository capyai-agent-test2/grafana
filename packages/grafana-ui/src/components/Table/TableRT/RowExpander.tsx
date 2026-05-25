import { type Cell } from 'react-table';

import { t } from '@grafana/i18n';

import { Icon } from '../../Icon/Icon';
import { type GrafanaTableRow } from '../types';

import { type TableStyles } from './styles';

export interface Props {
  row: GrafanaTableRow;
  tableStyles: TableStyles;
  cell?: Cell;
}

export function RowExpander({ row, tableStyles, cell }: Props) {
  const cellProps = cell?.getCellProps() ?? {};
  const { key, ...rest } = cellProps;

  return (
    <div key={key} className={tableStyles.expanderCell} {...rest} role="cell" {...row.getToggleRowExpandedProps()}>
      <Icon
        aria-label={
          row.isExpanded
            ? t('grafana-ui.row-expander.collapse', 'Collapse row')
            : t('grafana-ui.row-expander.expand', 'Expand row')
        }
        name={row.isExpanded ? 'angle-down' : 'angle-right'}
        size="lg"
      />
    </div>
  );
}
