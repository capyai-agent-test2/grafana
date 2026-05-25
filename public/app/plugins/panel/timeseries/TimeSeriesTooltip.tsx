import { type ReactNode } from 'react';

import {
  type DataFrame,
  type Field,
  FieldType,
  formattedValueToString,
  type InterpolateFunction,
  type LinkModel,
  usePluginContext,
} from '@grafana/data';
import { SortOrder, TooltipDisplayMode } from '@grafana/schema';
import {
  VizTooltipContent,
  VizTooltipFooter,
  VizTooltipHeader,
  VizTooltipWrapper,
  getContentItems,
  type VizTooltipItem,
  type AdHocFilterModel,
  type FilterByGroupedLabelsModel,
} from '@grafana/ui/internal';

import { getFieldActions } from '../status-history/utils';

import { isTooltipScrollable } from './utils';

// exemplar / annotation / time region hovering?
// add annotation UI / alert dismiss UI?

export interface TimeSeriesTooltipProps {
  // aligned series frame
  series: DataFrame;

  // aligned fields that are not series
  _rest?: Field[];

  // hovered points
  dataIdxs: Array<number | null>;
  // closest/hovered series
  seriesIdx?: number | null;
  mode?: TooltipDisplayMode;
  sortOrder?: SortOrder;

  isPinned: boolean;

  annotate?: () => void;
  maxHeight?: number;

  replaceVariables?: InterpolateFunction;
  dataLinks: LinkModel[];
  hideZeros?: boolean;
  adHocFilters?: AdHocFilterModel[];
  filterByGroupedLabels?: FilterByGroupedLabelsModel;
  canExecuteActions?: boolean;
  compareDiffMs?: number[];
}

const getTooltipSeriesIdx = (series: DataFrame, dataIdxs: Array<number | null>, seriesIdx: number | null | undefined) => {
  if (seriesIdx == null) {
    return seriesIdx;
  }

  const hoveredField = series.fields[seriesIdx];
  const hoveredDataIdx = dataIdxs[seriesIdx];

  if (hoveredField == null || hoveredDataIdx == null) {
    return seriesIdx;
  }

  if (hoveredField.values[hoveredDataIdx] != null || hoveredField.config.noValue != null) {
    return seriesIdx;
  }

  for (let i = 1; i < series.fields.length; i++) {
    const field = series.fields[i];
    const dataIdx = dataIdxs[i];

    if (
      i !== seriesIdx &&
      dataIdx != null &&
      !field.config.custom?.hideFrom?.tooltip &&
      (field.type === FieldType.number || field.type === FieldType.enum) &&
      field.values[dataIdx] != null
    ) {
      return i;
    }
  }

  return seriesIdx;
};

export const TimeSeriesTooltip = ({
  series,
  _rest,
  dataIdxs,
  seriesIdx,
  mode = TooltipDisplayMode.Single,
  sortOrder = SortOrder.None,
  isPinned,
  annotate,
  maxHeight,
  replaceVariables = (str) => str,
  dataLinks,
  hideZeros,
  adHocFilters,
  canExecuteActions,
  compareDiffMs,
  filterByGroupedLabels,
}: TimeSeriesTooltipProps) => {
  const pluginContext = usePluginContext();
  const tooltipSeriesIdx = mode === TooltipDisplayMode.Single ? getTooltipSeriesIdx(series, dataIdxs, seriesIdx) : seriesIdx;

  const xField = series.fields[0];
  let xVal = xField.values[dataIdxs[0]!];

  if (compareDiffMs != null && xField.type === FieldType.time) {
    xVal += compareDiffMs[tooltipSeriesIdx ?? 1];
  }

  const xDisp = formattedValueToString(xField.display!(xVal));

  const contentItems = getContentItems(
    series.fields,
    xField,
    dataIdxs,
    tooltipSeriesIdx,
    mode,
    sortOrder,
    (field) => field.type === FieldType.number || field.type === FieldType.enum,
    hideZeros,
    _rest
  );

  let footer: ReactNode;

  if (tooltipSeriesIdx != null) {
    const field = series.fields[tooltipSeriesIdx];
    const hasOneClickLink = dataLinks.some((dataLink) => dataLink.oneClick === true);

    if (isPinned || hasOneClickLink) {
      const visualizationType = pluginContext?.meta?.id ?? 'timeseries';
      const dataIdx = dataIdxs[tooltipSeriesIdx]!;
      const actions = canExecuteActions
        ? getFieldActions(series, field, replaceVariables, dataIdx, visualizationType)
        : [];

      footer = (
        <VizTooltipFooter
          dataLinks={dataLinks}
          actions={actions}
          annotate={annotate}
          adHocFilters={adHocFilters}
          filterByGroupedLabels={filterByGroupedLabels}
        />
      );
    }
  }

  const headerItem: VizTooltipItem = {
    label: xField.type === FieldType.time ? '' : (xField.state?.displayName ?? xField.name),
    value: xDisp,
  };

  return (
    <VizTooltipWrapper>
      {headerItem != null && <VizTooltipHeader item={headerItem} isPinned={isPinned} />}
      <VizTooltipContent
        items={contentItems}
        isPinned={isPinned}
        scrollable={isTooltipScrollable({ mode, maxHeight })}
        maxHeight={maxHeight}
      />
      {footer}
    </VizTooltipWrapper>
  );
};
