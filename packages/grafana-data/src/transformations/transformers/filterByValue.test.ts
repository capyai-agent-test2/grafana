import {
  SceneDataNode,
  SceneDataTransformer,
  type SceneDeactivationHandler,
  SceneFlexItem,
  SceneFlexLayout,
  sceneGraph,
  type SceneObject,
  SceneObjectBase,
  type SceneVariable,
  SceneVariableSet,
  TestVariable,
} from '@grafana/scenes';
import { type DataTransformerConfig, LoadingState } from '@grafana/schema';

import { toDataFrame } from '../../dataframe/processDataFrame';
import { type DataFrame, FieldType } from '../../types/dataFrame';
import { type MatcherConfig } from '../../types/transformations';
import { getDefaultTimeRange } from '../../types/time';
import { mockTransformationsRegistry } from '../../utils/tests/mockTransformationsRegistry';
import { ValueMatcherID } from '../matchers/ids';
import { type BasicValueMatcherOptions } from '../matchers/valueMatchers/types';
import { transformDataFrame } from '../transformDataFrame';

import {
  FilterByValueMatch,
  filterByValueTransformer,
  type FilterByValueTransformerOptions,
  FilterByValueType,
} from './filterByValue';
import { DataTransformerID } from './ids';

const seriesAWithSingleField = toDataFrame({
  name: 'A',
  length: 7,
  fields: [
    { name: 'time', type: FieldType.time, values: [1000, 2000, 3000, 4000, 5000, 6000, 7000] },
    { name: 'numbers', type: FieldType.number, values: [1, 2, 3, 4, 5, 6, 7] },
  ],
});

const multiSeriesWithSingleField = [
  toDataFrame({
    name: 'A',
    length: 3,
    fields: [
      { name: 'time', type: FieldType.time, values: [1000, 2000, 3000] },
      { name: 'value', type: FieldType.number, values: [1, 0, 1] },
    ],
  }),
  toDataFrame({
    name: 'B',
    length: 3,
    fields: [
      { name: 'time', type: FieldType.time, values: [5000, 6000, 7000] },
      { name: 'value', type: FieldType.number, values: [0, 1, 1] },
    ],
  }),
];

let spyConsoleWarn: jest.SpyInstance;
describe('FilterByValue transformer', () => {
  beforeAll(() => {
    mockTransformationsRegistry([filterByValueTransformer]);
  });

  beforeEach(() => {
    spyConsoleWarn = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  it('should exclude values', async () => {
    const lower: MatcherConfig<BasicValueMatcherOptions<number>> = {
      id: ValueMatcherID.lower,
      options: { value: 6 },
    };

    const cfg: DataTransformerConfig<FilterByValueTransformerOptions> = {
      id: DataTransformerID.filterByValue,
      options: {
        type: FilterByValueType.exclude,
        match: FilterByValueMatch.all,
        filters: [
          {
            fieldName: 'numbers',
            config: lower,
          },
        ],
      },
    };

    await expect(transformDataFrame([cfg], [seriesAWithSingleField])).toEmitValuesWith((received) => {
      const processed = received[0];

      expect(processed.length).toEqual(1);
      expect(processed[0].fields).toEqual([
        {
          name: 'time',
          type: FieldType.time,
          values: [6000, 7000],
          state: {},
        },
        {
          name: 'numbers',
          type: FieldType.number,
          values: [6, 7],
          state: {},
        },
      ]);
    });
  });

  it('should not cross frame boundaries when equals 0', async () => {
    const cfg: DataTransformerConfig<FilterByValueTransformerOptions> = {
      id: DataTransformerID.filterByValue,
      options: {
        type: FilterByValueType.exclude,
        match: FilterByValueMatch.any,
        filters: [
          {
            fieldName: 'A value',
            config: {
              id: ValueMatcherID.equal,
              options: { value: 0 },
            },
          },
          {
            fieldName: 'B value',
            config: {
              id: ValueMatcherID.equal,
              options: { value: 0 },
            },
          },
        ],
      },
    };

    await expect(transformDataFrame([cfg], multiSeriesWithSingleField)).toEmitValuesWith((received) => {
      const processed = received[0];

      expect(processed.length).toEqual(2);

      expect(processed[0].fields).toEqual([
        {
          name: 'time',
          type: FieldType.time,
          values: [1000, 3000],
          state: {},
        },
        {
          name: 'value',
          type: FieldType.number,
          values: [1, 1],
          state: {},
        },
      ]);

      expect(processed[1].fields).toEqual([
        {
          name: 'time',
          type: FieldType.time,
          values: [6000, 7000],
          state: {},
        },
        {
          name: 'value',
          type: FieldType.number,
          values: [1, 1],
          state: {},
        },
      ]);

      expect(console.warn).toHaveBeenCalledTimes(2);
    });

    spyConsoleWarn.mockRestore();
  });

  it('should not cross frame boundaries', async () => {
    const cfg: DataTransformerConfig<FilterByValueTransformerOptions> = {
      id: DataTransformerID.filterByValue,
      options: {
        type: FilterByValueType.exclude,
        match: FilterByValueMatch.any,
        filters: [
          {
            fieldName: 'A value',
            config: {
              id: ValueMatcherID.greater,
              options: { value: 0 },
            },
          },
        ],
      },
    };

    await expect(transformDataFrame([cfg], multiSeriesWithSingleField)).toEmitValuesWith((received) => {
      const processed = received[0];
      expect(processed.length).toEqual(2);

      expect(processed[0].fields).toEqual([
        {
          name: 'time',
          type: FieldType.time,
          values: [2000],
          state: {},
        },
        {
          name: 'value',
          type: FieldType.number,
          values: [0],
          state: {},
        },
      ]);

      expect(processed[1].fields).toEqual([
        {
          name: 'time',
          type: FieldType.time,
          values: [5000, 6000, 7000],
          state: {},
        },
        {
          name: 'value',
          type: FieldType.number,
          values: [0, 1, 1],
          state: {},
        },
      ]);

      expect(console.warn).toHaveBeenCalledTimes(1);
    });
  });

  it('should include values', async () => {
    const lowerOrEqual: MatcherConfig<BasicValueMatcherOptions<number>> = {
      id: ValueMatcherID.lowerOrEqual,
      options: { value: 5 },
    };

    const cfg: DataTransformerConfig<FilterByValueTransformerOptions> = {
      id: DataTransformerID.filterByValue,
      options: {
        type: FilterByValueType.include,
        match: FilterByValueMatch.all,
        filters: [
          {
            fieldName: 'numbers',
            config: lowerOrEqual,
          },
        ],
      },
    };

    await expect(transformDataFrame([cfg], [seriesAWithSingleField])).toEmitValuesWith((received) => {
      const processed = received[0];

      expect(processed.length).toEqual(1);
      expect(processed[0].fields).toEqual([
        {
          name: 'time',
          type: FieldType.time,
          values: [1000, 2000, 3000, 4000, 5000],
          state: {},
        },
        {
          name: 'numbers',
          type: FieldType.number,
          values: [1, 2, 3, 4, 5],
          state: {},
        },
      ]);
    });
  });

  it('should match any condition', async () => {
    const lowerOrEqual: MatcherConfig<BasicValueMatcherOptions<number>> = {
      id: ValueMatcherID.lowerOrEqual,
      options: { value: 4 },
    };

    const equal: MatcherConfig<BasicValueMatcherOptions<number>> = {
      id: ValueMatcherID.equal,
      options: { value: 7 },
    };

    const cfg: DataTransformerConfig<FilterByValueTransformerOptions> = {
      id: DataTransformerID.filterByValue,
      options: {
        type: FilterByValueType.include,
        match: FilterByValueMatch.any,
        filters: [
          {
            fieldName: 'numbers',
            config: lowerOrEqual,
          },
          {
            fieldName: 'numbers',
            config: equal,
          },
        ],
      },
    };

    await expect(transformDataFrame([cfg], [seriesAWithSingleField])).toEmitValuesWith((received) => {
      const processed = received[0];

      expect(processed.length).toEqual(1);
      expect(processed[0].fields).toEqual([
        {
          name: 'time',
          type: FieldType.time,
          values: [1000, 2000, 3000, 4000, 7000],
          state: {},
        },
        {
          name: 'numbers',
          type: FieldType.number,
          values: [1, 2, 3, 4, 7],
          state: {},
        },
      ]);
    });
  });

  it('should match all condition', async () => {
    const greaterOrEqual: MatcherConfig<BasicValueMatcherOptions<number>> = {
      id: ValueMatcherID.greaterOrEqual,
      options: { value: 4 },
    };

    const lowerOrEqual: MatcherConfig<BasicValueMatcherOptions<number>> = {
      id: ValueMatcherID.lowerOrEqual,
      options: { value: 5 },
    };

    const cfg: DataTransformerConfig<FilterByValueTransformerOptions> = {
      id: DataTransformerID.filterByValue,
      options: {
        type: FilterByValueType.include,
        match: FilterByValueMatch.all,
        filters: [
          {
            fieldName: 'numbers',
            config: lowerOrEqual,
          },
          {
            fieldName: 'numbers',
            config: greaterOrEqual,
          },
        ],
      },
    };

    await expect(transformDataFrame([cfg], [seriesAWithSingleField])).toEmitValuesWith((received) => {
      const processed = received[0];

      expect(processed.length).toEqual(1);
      expect(processed[0].fields).toEqual([
        {
          name: 'time',
          type: FieldType.time,
          values: [4000, 5000],
          state: {},
        },
        {
          name: 'numbers',
          type: FieldType.number,
          values: [4, 5],
          state: {},
        },
      ]);
    });
  });

  it('matches any selected value from a multi-select variable with equals', async () => {
    const cfg = {
      id: DataTransformerID.filterByValue,
      options: {
        type: FilterByValueType.include,
        match: FilterByValueMatch.all,
        filters: [
          {
            fieldName: 'name',
            config: {
              id: ValueMatcherID.equal,
              options: { value: '$var' },
            },
          },
        ],
      },
    };

    const data = await setupTransformationScene(
      toDataFrame({
        fields: [
          { name: 'name', type: FieldType.string, values: ['alice', 'bob', 'carol', 'dave'] },
          { name: 'value', type: FieldType.number, values: [1, 2, 3, 4] },
        ],
      }),
      cfg,
      [new TestVariable({ name: 'var', value: ['alice', 'carol'] })]
    );

    expect(data).toHaveLength(1);
    expect(data[0].fields).toEqual([
      {
        config: {},
        name: 'name',
        type: FieldType.string,
        values: ['alice', 'carol'],
        state: {},
      },
      {
        config: {},
        name: 'value',
        type: FieldType.number,
        values: [1, 3],
        state: {},
      },
    ]);
  });
});

function activateFullSceneTree(scene: SceneObject): SceneDeactivationHandler {
  const deactivationHandlers: SceneDeactivationHandler[] = [];

  // Important that variables are activated before other children
  if (scene.state.$variables) {
    deactivationHandlers.push(activateFullSceneTree(scene.state.$variables));
  }

  scene.forEachChild((child) => {
    if ('setContainerWidth' in child) {
      // @ts-expect-error
      child.setContainerWidth(500);
    }
    deactivationHandlers.push(activateFullSceneTree(child));
  });

  deactivationHandlers.push(scene.activate());

  return () => {
    for (const handler of deactivationHandlers) {
      handler();
    }
  };
}

async function setupTransformationScene(
  inputData: DataFrame,
  cfg: DataTransformerConfig,
  variables: SceneVariable[]
): Promise<DataFrame[]> {
  class TestSceneObject extends SceneObjectBase<{}> {}
  const dataNode = new SceneDataNode({
    data: {
      state: LoadingState.Loading,
      timeRange: getDefaultTimeRange(),
      series: [inputData],
    },
  });

  const transformationNode = new SceneDataTransformer({
    transformations: [cfg],
  });

  const consumer = new TestSceneObject({
    $data: transformationNode,
  });

  const scene = new SceneFlexLayout({
    $data: dataNode,
    $variables: new SceneVariableSet({ variables }),
    children: [new SceneFlexItem({ body: consumer })],
  });

  activateFullSceneTree(scene);

  return new Promise<DataFrame[]>((resolve) => {
    const dataProvider = sceneGraph.getData(consumer);
    const sub = dataProvider.subscribeToState((state) => {
      sub.unsubscribe();
      resolve(state.data?.series ?? []);
    });
  });
}
