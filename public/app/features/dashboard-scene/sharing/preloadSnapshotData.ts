import { LoadingState } from '@grafana/data';
import { type VizPanel } from '@grafana/scenes';

import { getQueryRunnerFor } from '../utils/utils';

const snapshotReadyStates = new Set([LoadingState.Done, LoadingState.Error, LoadingState.Streaming]);

function isSnapshotReady(state?: LoadingState) {
  return state !== undefined && snapshotReadyStates.has(state);
}

function waitForQueryRunner(queryRunner: NonNullable<ReturnType<typeof getQueryRunnerFor>>) {
  const currentState = queryRunner.state.data?.state;
  if (isSnapshotReady(currentState)) {
    return Promise.resolve();
  }

  return new Promise<void>((resolve) => {
    const subscription = queryRunner.subscribeToState((state) => {
      if (isSnapshotReady(state.data?.state)) {
        subscription.unsubscribe();
        resolve();
      }
    });

    if (isSnapshotReady(queryRunner.state.data?.state)) {
      subscription.unsubscribe();
      resolve();
    }
  });
}

export async function preloadSnapshotDataForPanels(panels: VizPanel[]) {
  const queryRunners = panels
    .map((panel) => getQueryRunnerFor(panel))
    .filter((queryRunner): queryRunner is NonNullable<typeof queryRunner> => Boolean(queryRunner));

  const pendingQueries = queryRunners.map((queryRunner) => waitForQueryRunner(queryRunner));

  for (const queryRunner of queryRunners) {
    const currentState = queryRunner.state.data?.state;
    if (currentState === undefined || currentState === LoadingState.NotStarted) {
      queryRunner.runQueries();
    }
  }

  await Promise.all(pendingQueries);
}
