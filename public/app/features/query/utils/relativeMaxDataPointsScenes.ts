import { SceneQueryRunner } from '@grafana/scenes';

import { getMaxDataPointsFromWidth, isRelativeMaxDataPoints, type MaxDataPoints } from './relativeMaxDataPoints';

let sceneQueryRunnerPatched = false;

export function supportRelativeMaxDataPointsInScenes() {
  if (sceneQueryRunnerPatched) {
    return;
  }

  const proto = SceneQueryRunner.prototype;
  const getMaxDataPoints: (this: SceneQueryRunner) => number = Reflect.get(proto, 'getMaxDataPoints');
  const setContainerWidth: (this: SceneQueryRunner, width: number) => void = Reflect.get(proto, 'setContainerWidth');

  Reflect.set(proto, 'getMaxDataPoints', function (this: SceneQueryRunner) {
    const { maxDataPoints } = this.state;

    if (isRelativeMaxDataPoints(maxDataPoints)) {
      return getMaxDataPointsFromWidth(maxDataPoints, Reflect.get(this, '_containerWidth') ?? 500);
    }

    return getMaxDataPoints.call(this);
  });

  Reflect.set(proto, 'setContainerWidth', function (this: SceneQueryRunner, width: number) {
    const hadContainerWidth = Boolean(Reflect.get(this, '_containerWidth'));
    setContainerWidth.call(this, width);

    if (
      !hadContainerWidth &&
      width > 0 &&
      isRelativeMaxDataPoints(this.state.maxDataPoints) &&
      this.isActive &&
      !this.state._hasFetchedData
    ) {
      this.runQueries();
    }
  });

  sceneQueryRunnerPatched = true;
}
