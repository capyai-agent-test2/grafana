import { createDataFrame, DataFrameType, FieldType, getPanelDataSummary } from '@grafana/data';

import { plugin } from './module';

const suggestionsSupplier = (plugin as unknown as { suggestionsSupplier: Function }).suggestionsSupplier;

describe('logs panel suggestions supplier', () => {
  it('does not suggest logs when time and string fields only exist across different frames', () => {
    const dataSummary = getPanelDataSummary([
      createDataFrame({
        fields: [
          { name: 'time', type: FieldType.time, values: [1, 2, 3] },
          { name: 'value', type: FieldType.number, values: [10, 20, 30] },
        ],
      }),
      createDataFrame({
        fields: [
          { name: 'library', type: FieldType.string, values: ['React', 'Vue', 'Angular'] },
          { name: 'stars', type: FieldType.number, values: [1, 2, 3] },
        ],
      }),
    ]);

    expect(suggestionsSupplier(dataSummary)).toBeUndefined();
  });

  it('suggests logs when a frame has both time and string fields', () => {
    const dataSummary = getPanelDataSummary([
      createDataFrame({
        fields: [
          { name: 'time', type: FieldType.time, values: [1, 2, 3] },
          { name: 'line', type: FieldType.string, values: ['a', 'b', 'c'] },
        ],
      }),
    ]);

    expect(suggestionsSupplier(dataSummary)).toHaveLength(1);
  });

  it('suggests logs for LogLines frames', () => {
    const dataSummary = getPanelDataSummary([
      createDataFrame({
        meta: { type: DataFrameType.LogLines },
        fields: [
          { name: 'timestamp', type: FieldType.time, values: [1, 2, 3] },
          { name: 'body', type: FieldType.string, values: ['a', 'b', 'c'] },
        ],
      }),
    ]);

    expect(suggestionsSupplier(dataSummary)).toHaveLength(1);
  });
});
