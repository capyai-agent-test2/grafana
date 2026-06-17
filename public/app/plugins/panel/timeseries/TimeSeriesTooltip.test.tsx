import { render, screen } from '@testing-library/react';

import { type DataFrame, FieldType } from '@grafana/data';
import { SortOrder, TooltipDisplayMode } from '@grafana/schema';

import { TimeSeriesTooltip } from './TimeSeriesTooltip';

describe('TimeSeriesTooltip', () => {
  it('falls back to a hovered non-null stacked series in single mode', () => {
    const series = {
      fields: [
        {
          name: 'time',
          type: FieldType.time,
          values: [1000],
          config: {},
          display: (value: number) => ({ text: `t:${value}`, numeric: value }),
        },
        {
          name: 'error',
          type: FieldType.number,
          values: [null],
          config: { custom: {} },
          display: (value: number | null) => ({ text: String(value), numeric: Number(value) }),
        },
        {
          name: 'info',
          type: FieldType.number,
          values: [2],
          config: { custom: {} },
          display: (value: number) => ({ text: String(value), numeric: value }),
        },
      ],
    } as unknown as DataFrame;

    render(
      <TimeSeriesTooltip
        series={series}
        dataIdxs={[0, 0, 0]}
        seriesIdx={1}
        mode={TooltipDisplayMode.Single}
        sortOrder={SortOrder.None}
        isPinned={false}
        dataLinks={[]}
      />
    );

    expect(screen.getByText('info')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.queryByText('error')).not.toBeInTheDocument();
  });
});
