import { LoadingState } from '@grafana/data';
import { type VizPanel } from '@grafana/scenes';

import { preloadSnapshotDataForPanels } from './preloadSnapshotData';

const getQueryRunnerForMock = jest.fn();

jest.mock('../utils/utils', () => ({
  ...jest.requireActual('../utils/utils'),
  getQueryRunnerFor: (panel: VizPanel) => getQueryRunnerForMock(panel),
}));

function createQueryRunner(initialState?: LoadingState) {
  let callback: ((state: { data?: { state: LoadingState } }) => void) | undefined;

  return {
    state: {
      data: initialState === undefined ? undefined : { state: initialState },
    },
    subscribeToState: jest.fn((cb) => {
      callback = cb;
      return { unsubscribe: jest.fn() };
    }),
    runQueries: jest.fn(() => {
      callback?.({ data: { state: LoadingState.Done } });
    }),
  };
}

describe('preloadSnapshotDataForPanels', () => {
  beforeEach(() => {
    getQueryRunnerForMock.mockReset();
  });

  it('runs missing panel queries and waits for them to finish', async () => {
    const loadedRunner = createQueryRunner(LoadingState.Done);
    const hiddenTabRunner = createQueryRunner(LoadingState.NotStarted);

    const panels = [{ key: 'loaded' }, { key: 'hidden' }] as VizPanel[];

    getQueryRunnerForMock.mockImplementation((panel: { key: string }) => {
      return panel.key === 'loaded' ? loadedRunner : hiddenTabRunner;
    });

    await preloadSnapshotDataForPanels(panels);

    expect(loadedRunner.runQueries).not.toHaveBeenCalled();
    expect(hiddenTabRunner.runQueries).toHaveBeenCalledTimes(1);
  });

  it('waits for already-loading queries without restarting them', async () => {
    const loadingRunner = createQueryRunner(LoadingState.Loading);
    const panels = [{ key: 'loading' }] as VizPanel[];

    getQueryRunnerForMock.mockReturnValue(loadingRunner);

    const preloadPromise = preloadSnapshotDataForPanels(panels);
    expect(loadingRunner.runQueries).not.toHaveBeenCalled();

    await Promise.resolve();
    loadingRunner.state.data = { state: LoadingState.Done };
    const subscribeCallback = loadingRunner.subscribeToState.mock.calls[0][0];
    subscribeCallback({ data: { state: LoadingState.Done } });

    await preloadPromise;
  });
});
