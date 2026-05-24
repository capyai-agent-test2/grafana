import { QueryEditorExpressionType } from '../expressions';
import type { SQLQuery } from '../types';

import { getColumnsWithIndices } from './getColumnsWithIndices';

describe('getColumnsWithIndices', () => {
  const query: SQLQuery = {
    refId: 'A',
    sql: {
      columns: [
        {
          name: '$__timeGroupAlias',
          parameters: [
            { name: 'createdAt', type: QueryEditorExpressionType.FunctionParameter },
            { name: '$__interval', type: QueryEditorExpressionType.FunctionParameter },
          ],
          type: QueryEditorExpressionType.Function,
        },
        {
          name: 'AVG',
          parameters: [{ name: 'value', type: QueryEditorExpressionType.FunctionParameter }],
          type: QueryEditorExpressionType.Function,
        },
      ],
    },
  };

  it('keeps selected column expressions as values by default', () => {
    const [selectedColumns] = getColumnsWithIndices(query, []);

    expect(selectedColumns.options).toEqual([
      { value: '$__timeGroupAlias(createdAt, $__interval)', label: '1 - $__timeGroupAlias(createdAt, $__interval)' },
      { value: 'AVG(value)', label: '2 - AVG(value)' },
    ]);
  });

  it('can use positional indices as selected column values', () => {
    const [selectedColumns] = getColumnsWithIndices(query, [], true);

    expect(selectedColumns.options).toEqual([
      { value: '1', label: '1 - $__timeGroupAlias(createdAt, $__interval)' },
      { value: '2', label: '2 - AVG(value)' },
    ]);
  });
});
