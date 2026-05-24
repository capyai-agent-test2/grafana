import { type VizPanel } from '@grafana/scenes';
import { getDashboardSnapshotSrv } from 'app/features/dashboard/services/SnapshotSrv';

import { ShareSnapshotTab } from './ShareSnapshotTab';
import { preloadSnapshotDataForPanels } from './preloadSnapshotData';

jest.mock('app/features/dashboard/services/SnapshotSrv', () => ({
  getDashboardSnapshotSrv: jest.fn(),
}));

jest.mock('./preloadSnapshotData', () => ({
  preloadSnapshotDataForPanels: jest.fn(),
}));

jest.mock('../serialization/transformSceneToSaveModel', () => ({
  transformSceneToSaveModel: jest.fn(() => ({ title: 'Dashboard title' })),
  trimDashboardForSnapshot: jest.fn((title: string, _time: unknown, dash: { title: string }) => ({ ...dash, title })),
}));

jest.mock('../serialization/transformSceneToSaveModelSchemaV2', () => ({
  transformSceneToSaveModelSchemaV2: jest.fn(() => ({ title: 'Dashboard title' })),
  trimDashboardForSnapshot: jest.fn((title: string, _time: unknown, dash: { title: string }) => ({ ...dash, title })),
}));

describe('ShareSnapshotTab', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (preloadSnapshotDataForPanels as jest.Mock).mockResolvedValue(undefined);
    (getDashboardSnapshotSrv as jest.Mock).mockReturnValue({
      create: jest.fn().mockResolvedValue({ url: 'snapshot-url', key: 'snapshot-key' }),
    });
  });

  it('preloads data for panels across the dashboard before creating a snapshot', async () => {
    const panelA = { state: { key: 'panel-a' } } as VizPanel;
    const panelB = { state: { key: 'panel-b' } } as VizPanel;
    const getVizPanels = jest.fn(() => [panelA, panelB]);

    const dashboard = {
      state: {
        title: 'Dashboard title',
        body: { getVizPanels },
      },
      serializer: {
        apiVersion: 'dashboard.grafana.app/v2beta1',
        getK8SMetadata: () => ({ name: 'dashboard-uid' }),
      },
    };

    const tab = new ShareSnapshotTab({
      dashboardRef: { resolve: () => dashboard },
    } as never);

    await tab.onSnapshotCreate();

    expect(preloadSnapshotDataForPanels).toHaveBeenCalledWith([panelA, panelB]);
    expect(getVizPanels).toHaveBeenCalledTimes(1);
  });
});
