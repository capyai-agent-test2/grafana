import { combineLatest, type Observable, of } from 'rxjs';
import { mergeMap } from 'rxjs/operators';

import { arrayToDataFrame, type DataFrame, DataTopic, type PanelData } from '@grafana/data';

import { type DashboardQueryRunnerResult } from './DashboardQueryRunner/types';

function addAnnoDataTopic(annotations: DataFrame[] = []) {
  annotations.forEach((f) => {
    f.meta = {
      ...f.meta,
      dataTopic: DataTopic.Annotations,
    };
  });
}

function getAnnotationFieldNames(annotations: DashboardQueryRunnerResult['annotations']) {
  const names = new Set<string>();

  for (const annotation of annotations ?? []) {
    for (const name of Object.keys(annotation)) {
      names.add(name);
    }
  }

  return names.size ? Array.from(names) : undefined;
}

export function mergePanelAndDashData(
  panelObservable: Observable<PanelData>,
  dashObservable: Observable<DashboardQueryRunnerResult>
): Observable<PanelData> {
  return combineLatest([panelObservable, dashObservable]).pipe(
    mergeMap((combined) => {
      const [panelData, dashData] = combined;

      if (Boolean(dashData.annotations?.length) || Boolean(dashData.alertState)) {
        if (!panelData.annotations) {
          panelData.annotations = [];
        }

        const annotations = panelData.annotations.concat(
          arrayToDataFrame(dashData.annotations, getAnnotationFieldNames(dashData.annotations))
        );

        addAnnoDataTopic(annotations);

        const alertState = dashData.alertState;
        return of({ ...panelData, annotations, alertState });
      }

      addAnnoDataTopic(panelData.annotations);

      return of(panelData);
    })
  );
}
