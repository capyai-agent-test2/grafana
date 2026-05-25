import { render, screen } from '@testing-library/react';

import { createDataFrame, FieldType } from '@grafana/data';
import { TooltipDisplayMode } from '@grafana/ui';

import { TimeSeriesTooltip } from './TimeSeriesTooltip';

describe('TimeSeriesTooltip', () => {
  const series = createDataFrame({
    fields: [
      {
        name: 'time',
        type: FieldType.time,
        values: [1000, 2000, 3000],
        display: (value) => ({ text: String(value), numeric: Number(value) }),
        config: {},
      },
      {
        name: 'visible',
        type: FieldType.number,
        values: [10, null, 30],
        display: (value) => ({ text: String(value), numeric: Number(value) }),
        config: { custom: {} },
      },
      {
        name: 'hidden-neighbor',
        type: FieldType.number,
        values: [null, 20, null],
        display: (value) => ({ text: String(value), numeric: Number(value) }),
        config: { custom: {} },
      },
    ],
  });

  it('uses the hovered series timestamp in single mode', () => {
    render(
      <TimeSeriesTooltip
        series={series}
        dataIdxs={[1, 2, 1]}
        seriesIdx={1}
        mode={TooltipDisplayMode.Single}
        dataLinks={[]}
        isPinned={false}
      />
    );

    expect(screen.getByText('3000')).toBeInTheDocument();
    expect(screen.queryByText('2000')).not.toBeInTheDocument();
    expect(screen.getByText('visible')).toBeInTheDocument();
    expect(screen.getByText('30')).toBeInTheDocument();
  });

  it('keeps the shared x-position timestamp in multi mode', () => {
    render(
      <TimeSeriesTooltip
        series={series}
        dataIdxs={[1, 2, 1]}
        seriesIdx={1}
        mode={TooltipDisplayMode.Multi}
        dataLinks={[]}
        isPinned={false}
      />
    );

    expect(screen.getByText('2000')).toBeInTheDocument();
    expect(screen.getByText('visible')).toBeInTheDocument();
    expect(screen.getByText('hidden-neighbor')).toBeInTheDocument();
  });
});
