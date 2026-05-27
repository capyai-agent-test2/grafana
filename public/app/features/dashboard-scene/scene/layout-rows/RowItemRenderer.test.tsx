import { act, screen, waitFor } from '@testing-library/react';
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

    expect(container.querySelector('#traces-instance-stats-row-1')).toBeTruthy();
    expect(screen.getByTestId('data-testid dashboard-row-title-Traces Instance Stats')).toBeInTheDocument();
  });

  it('expands a collapsed row when the hash targets it', async () => {
    window.location.hash = '#traces-instance-stats-row-1';
    const scene = buildScene(true);

    render(<scene.Component model={scene} />);

    await waitFor(() => {
      expect(screen.getByLabelText('Collapse row Traces Instance Stats')).toBeInTheDocument();
    });
  });

  it('does not force a row back open after manual collapse', async () => {
    window.location.hash = '#traces-instance-stats-row-1';
    const scene = buildScene(true);
    const row = ((scene.state.body as RowsLayoutManager).state.rows[0] as RowItem);

    render(<scene.Component model={scene} />);

    await waitFor(() => {
      expect(row.state.collapse).toBe(false);
    });

    act(() => {
      row.onCollapseToggle();
    });

    expect(row.state.collapse).toBe(true);
  });
});

function buildScene(collapse: boolean) {
  return new DashboardScene({
    $timeRange: new SceneTimeRange({ from: 'now-6h', to: 'now' }),
    body: new RowsLayoutManager({
      rows: [
        new RowItem({
          key: 'row-1',
          title: 'Traces Instance Stats',
          collapse,
          layout: DefaultGridLayoutManager.fromVizPanels([]),
        }),
      ],
    }),
  });
}
