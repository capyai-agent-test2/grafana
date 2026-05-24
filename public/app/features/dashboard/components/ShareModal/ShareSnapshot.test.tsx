import { getDashboardModel } from '../../../../../test/helpers/getDashboardModel';

import { ShareSnapshot } from './ShareSnapshot';

jest.mock('app/features/dashboard/services/TimeSrv', () => ({
  getTimeSrv: () => ({
    timeRange: () => {
      return { from: new Date(1000), to: new Date(2000) };
    },
  }),
}));

describe('ShareSnapshot', () => {
  it('keeps a repeated panel snapshot to a single panel', () => {
    const dashboard = getDashboardModel({
      panels: [{ id: 2, type: 'timeseries', title: 'Panel ${apps}', repeat: 'apps', repeatDirection: 'h', gridPos: { x: 0, y: 0, h: 2, w: 8 } }],
      templating: {
        list: [
          {
            name: 'apps',
            type: 'custom',
            current: {
              text: 'se1 + se2 + se3',
              value: ['se1', 'se2', 'se3'],
            },
            options: [
              { text: 'se1', value: 'se1', selected: true },
              { text: 'se2', value: 'se2', selected: true },
              { text: 'se3', value: 'se3', selected: true },
            ],
          },
        ],
      },
    });
    dashboard.processRepeats();

    const repeatedPanel = dashboard.panels[0];
    const shareSnapshot = new ShareSnapshot({ dashboard, panel: repeatedPanel });
    const snapshotDashboard = dashboard.getSaveModelCloneOld();

    shareSnapshot.scrubDashboard(snapshotDashboard);

    expect(snapshotDashboard.panels).toHaveLength(1);
    expect(snapshotDashboard.panels[0]).toMatchObject({
      id: 2,
      title: 'Panel ${apps}',
      scopedVars: {
        apps: {
          value: 'se1',
        },
      },
    });
    expect(snapshotDashboard.panels[0].repeat).toBeUndefined();
    expect(snapshotDashboard.panels[0].repeatDirection).toBeUndefined();
    expect(snapshotDashboard.panels[0].repeatPanelId).toBeUndefined();
  });
});
