import { of } from 'rxjs';

import { type DataQueryRequest, type DataSourceApi, getDefaultTimeRange, LoadingState } from '@grafana/data';
import { getPanelPlugin } from '@grafana/data/test';
import { setPluginImportUtils } from '@grafana/runtime';
import { AdHocFiltersVariable, SceneQueryRunner, SceneVariableSet, VizPanel } from '@grafana/scenes';
import { MIXED_DATASOURCE_NAME } from 'app/plugins/datasource/mixed/MixedDataSource';

import { activateFullSceneTree } from '../utils/test-utils';

import { DashboardScene } from './DashboardScene';
import { MixedDatasourceAdHocFiltersBehavior } from './MixedDatasourceAdHocFiltersBehavior';
import { DefaultGridLayoutManager } from './layout-default/DefaultGridLayoutManager';

const datasource = {
  uid: MIXED_DATASOURCE_NAME,
  type: MIXED_DATASOURCE_NAME,
  getRef: () => ({ uid: MIXED_DATASOURCE_NAME }),
} as DataSourceApi;

jest.mock('@grafana/runtime', () => ({
  ...jest.requireActual('@grafana/runtime'),
  getDataSourceSrv: () => ({
    get: async () => datasource,
  }),
  getRunRequest: () => (_ds: DataSourceApi, request: DataQueryRequest) =>
    of({
      state: LoadingState.Done,
      series: [],
      timeRange: getDefaultTimeRange(),
      request,
    }),
}));

setPluginImportUtils({
  importPanelPlugin: () => Promise.resolve(getPanelPlugin({})),
  getPanelPluginFromCache: () => undefined,
});

describe('MixedDatasourceAdHocFiltersBehavior', () => {
  it('runs mixed datasource panel queries when matching ad hoc filters change', () => {
    const adhocVariable = new AdHocFiltersVariable({
      name: 'filters',
      datasource: { uid: 'prometheus' },
      filters: [],
    });
    const queryRunner = new SceneQueryRunner({
      datasource: { uid: MIXED_DATASOURCE_NAME },
      queries: [
        { refId: 'A', datasource: { uid: 'prometheus' } },
        { refId: 'B', datasource: { uid: 'testdata' } },
      ],
      $behaviors: [new MixedDatasourceAdHocFiltersBehavior({})],
    });
    const scene = buildScene(adhocVariable, queryRunner);
    const deactivate = activateFullSceneTree(scene);
    const runQueriesSpy = jest.spyOn(queryRunner, 'runQueries').mockImplementation();

    adhocVariable.updateFilters([{ key: 'job', operator: '=', value: 'grafana' }]);

    expect(runQueriesSpy).toHaveBeenCalledTimes(1);
    deactivate();
  });

  it('does not run mixed datasource panel queries when non-matching ad hoc filters change', () => {
    const adhocVariable = new AdHocFiltersVariable({
      name: 'filters',
      datasource: { uid: 'loki' },
      filters: [],
    });
    const queryRunner = new SceneQueryRunner({
      datasource: { uid: MIXED_DATASOURCE_NAME },
      queries: [
        { refId: 'A', datasource: { uid: 'prometheus' } },
        { refId: 'B', datasource: { uid: 'testdata' } },
      ],
      $behaviors: [new MixedDatasourceAdHocFiltersBehavior({})],
    });
    const scene = buildScene(adhocVariable, queryRunner);
    const deactivate = activateFullSceneTree(scene);
    const runQueriesSpy = jest.spyOn(queryRunner, 'runQueries').mockImplementation();

    adhocVariable.updateFilters([{ key: 'job', operator: '=', value: 'grafana' }]);

    expect(runQueriesSpy).not.toHaveBeenCalled();
    deactivate();
  });
});

function buildScene(adhocVariable: AdHocFiltersVariable, queryRunner: SceneQueryRunner): DashboardScene {
  return new DashboardScene({
    title: 'hello',
    uid: 'dash-1',
    meta: {
      canEdit: true,
    },
    $variables: new SceneVariableSet({ variables: [adhocVariable] }),
    body: DefaultGridLayoutManager.fromVizPanels([
      new VizPanel({
        title: 'Panel A',
        pluginId: 'table',
        key: 'panel-1',
        $data: queryRunner,
      }),
    ]),
  });
}
