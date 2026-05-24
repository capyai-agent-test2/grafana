import fs from 'fs';
import path from 'path';

describe('Prometheus metrics browser series limit patch', () => {
  it('updates the series limit on blur instead of each change', () => {
    const prometheusPackagePath = path.dirname(require.resolve('@grafana/prometheus/package.json'));
    const metricSelectorPath = path.join(prometheusPackagePath, 'dist/cjs/components/metrics-browser/MetricSelector.cjs');
    const source = fs.readFileSync(metricSelectorPath, 'utf8');

    expect(source).toContain('const [seriesLimitInput, setSeriesLimitInput] = React.useState');
    expect(source).toContain('onChange: (e) => setSeriesLimitInput(e.currentTarget.value)');
    expect(source).toContain('onBlur: () => {');
    expect(source).toContain('setSeriesLimit(trimmed === "" ? Number.NaN : parseInt(trimmed, 10));');
    expect(source).not.toContain('onChange: (e) => setSeriesLimit(parseInt(e.currentTarget.value.trim(), 10))');
  });
});
