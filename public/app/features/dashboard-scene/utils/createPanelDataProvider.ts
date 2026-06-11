import { getPanelPluginMetasMapSync, type PanelPluginMetas } from '@grafana/runtime/internal';
import { type SceneDataProvider, SceneDataTransformer, SceneQueryRunner } from '@grafana/scenes';
import { type DataQuery, type DataSourceRef } from '@grafana/schema';
import { type PanelModel } from 'app/features/dashboard/state/PanelModel';
import { getAbsoluteMaxDataPoints, setMaxDataPoints } from 'app/features/query/utils/relativeMaxDataPoints';
import { supportRelativeMaxDataPointsInScenes } from 'app/features/query/utils/relativeMaxDataPointsScenes';

import { DashboardDatasourceBehaviour } from '../scene/DashboardDatasourceBehaviour';

export function createPanelDataProvider(
  panel: PanelModel,
  panelMetas: PanelPluginMetas = getPanelPluginMetasMapSync()
): SceneDataProvider | undefined {
  supportRelativeMaxDataPointsInScenes();

  // Skip setting query runner for panels without queries
  if (!panel.targets?.length) {
    return undefined;
  }

  // Skip setting query runner for panel plugins with skipDataQuery
  if (panelMetas[panel.type]?.skipDataQuery) {
    return undefined;
  }

  let dataProvider: SceneDataProvider | undefined = undefined;

  dataProvider = new SceneQueryRunner(
    setMaxDataPoints(
      {
        // If panel.datasource is not defined, we use the first datasource from the targets (queries)
        datasource: panel.datasource ?? findFirstDatasource(panel.targets),
        queries: panel.targets,
        maxDataPoints: getAbsoluteMaxDataPoints(panel.maxDataPoints),
        maxDataPointsFromWidth: true,
        cacheTimeout: panel.cacheTimeout,
        queryCachingTTL: panel.queryCachingTTL,
        minInterval: panel.interval ?? undefined,
        dataLayerFilter: {
          panelId: panel.id,
        },
        $behaviors: [new DashboardDatasourceBehaviour({})],
      },
      panel.maxDataPoints
    )
  );

  // Wrap inner data provider in a data transformer
  return new SceneDataTransformer({
    $data: dataProvider,
    transformations: panel.transformations || [],
  });
}

function findFirstDatasource(targets: DataQuery[]): DataSourceRef | undefined {
  const datasource = targets.find((t) => Boolean(t.datasource))?.datasource;
  if (!datasource) {
    return undefined;
  }

  const dsRef: DataSourceRef = {
    ...(datasource?.type && { type: datasource?.type }),
    ...(datasource?.uid && { uid: datasource?.uid }),
  };

  return dsRef;
}
