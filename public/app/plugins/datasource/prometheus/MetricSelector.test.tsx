import { fireEvent, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';

const useMetricsBrowser = jest.fn();

jest.mock('react-window', () => ({
  FixedSizeList: ({
    children,
    itemCount,
  }: {
    children: (props: { index: number; style: object }) => ReactNode;
    itemCount: number;
  }) => (
    <div>
      {Array.from({ length: itemCount }, (_, index) => (
        <div key={index}>{children({ index, style: {} })}</div>
      ))}
    </div>
  ),
}));

jest.mock('/home/grafana/node_modules/@grafana/prometheus/dist/cjs/components/metrics-browser/MetricsBrowserContext.cjs', () => ({
  useMetricsBrowser: () => useMetricsBrowser(),
}));

const { MetricSelector } = require('/home/grafana/node_modules/@grafana/prometheus/dist/cjs/components/metrics-browser/MetricSelector.cjs');

describe('Prometheus metrics browser series limit', () => {
  it('defers refreshing series limit until blur', () => {
    const setSeriesLimit = jest.fn();

    useMetricsBrowser.mockReturnValue({
      metrics: [{ name: 'up', details: 'up metric' }],
      selectedMetric: '',
      seriesLimit: 100,
      setSeriesLimit,
      onMetricClick: jest.fn(),
    });

    render(<MetricSelector />);

    const input = screen.getByLabelText('Limit results from series endpoint');

    fireEvent.change(input, { target: { value: '250' } });
    expect(setSeriesLimit).not.toHaveBeenCalled();

    fireEvent.blur(input);
    expect(setSeriesLimit).toHaveBeenCalledWith(250);
  });
});
