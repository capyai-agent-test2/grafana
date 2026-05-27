import { screen } from '@testing-library/react';
import { render } from 'test/test-utils';

import { SceneTimeRange } from '@grafana/scenes';

import { DashboardScene } from '../DashboardScene';
import { DefaultGridLayoutManager } from '../layout-default/DefaultGridLayoutManager';

import { RowItem } from './RowItem';
import { RowsLayoutManager } from './RowsLayoutManager';

describe('RowItemRenderer', () => {
  beforeEach(() => {
    window.location.hash = '';
  });

  it('adds a row anchor id from the title', () => {
    const scene = buildScene(false);

    const { container } = render(<scene.Component model={scene} />);

    expect(container.querySelector('#traces-instance-stats')).toBeTruthy();
    expect(screen.getByTestId('data-testid dashboard-row-title-Traces Instance Stats')).toBeInTheDocument();
  });

  it('expands a collapsed row when the hash targets it', () => {
    window.location.hash = '#traces-instance-stats';
    const scene = buildScene(true);

    render(<scene.Component model={scene} />);

    expect(screen.getByLabelText('Collapse row Traces Instance Stats')).toBeInTheDocument();
  });
});

function buildScene(collapse: boolean) {
  return new DashboardScene({
    $timeRange: new SceneTimeRange({ from: 'now-6h', to: 'now' }),
    body: new RowsLayoutManager({
      rows: [
        new RowItem({
          title: 'Traces Instance Stats',
          collapse,
          layout: DefaultGridLayoutManager.fromVizPanels([]),
        }),
      ],
    }),
  });
}
