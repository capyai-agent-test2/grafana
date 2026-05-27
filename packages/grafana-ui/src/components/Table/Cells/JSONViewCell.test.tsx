import { render } from '@testing-library/react';

import { FieldType } from '@grafana/data';

import { JSONViewCell } from './JSONViewCell';

describe('JSONViewCell', () => {
  it('renders parsed JSON strings instead of escaped source text', () => {
    const { container } = render(
      <JSONViewCell
        {...({
          cell: { value: '{"request":"{\\"aggregate\\":\\"somecoll\\"}"}' },
          row: { index: 0 },
          field: {
            name: 'json',
            type: FieldType.string,
            values: [],
            config: {},
          },
          tableStyles: {
            cellContainer: 'cell-container',
            cellContainerNoOverflow: 'cell-container-no-overflow',
            cellText: 'cell-text',
          },
          cellProps: {},
        } as const)}
      />
    );

    expect(container.textContent).toContain('"request": "{\\"aggregate\\":\\"somecoll\\"}"');
    expect(container.textContent).not.toContain('{\\"request\\":');
  });
});
