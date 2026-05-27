import { screen } from '@testing-library/react';
import { render } from 'test/test-utils';

import { SceneTimeRange, SceneVariableSet } from '@grafana/scenes';

import { DashboardScene } from '../DashboardScene';

import { RowItem } from './RowItem';
import { RowsLayoutManager } from './RowsLayoutManager';

describe('RowItemRenderer', () => {
  it('announces whether the row is expanded or collapsed', async () => {
    const { user } = renderScene();

    const toggle = screen.getByRole('button', { name: 'Collapse row Accessibility row' });
    expect(toggle).toHaveAttribute('aria-expanded', 'true');

    await user.click(toggle);

    expect(screen.getByRole('button', { name: 'Expand row Accessibility row' })).toHaveAttribute('aria-expanded', 'false');
  });
});

function renderScene() {
  const row = new RowItem({
    key: 'row-1',
    title: 'Accessibility row',
    collapse: false,
  });

  const scene = new DashboardScene({
    $timeRange: new SceneTimeRange({ from: 'now-6h', to: 'now' }),
    $variables: new SceneVariableSet({ variables: [] }),
    body: new RowsLayoutManager({ rows: [row] }),
  });

  return render(<scene.Component model={scene} />);
}
