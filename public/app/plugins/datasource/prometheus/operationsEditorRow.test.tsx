import { render, screen } from '@testing-library/react';
import { type ReactNode } from 'react';

jest.mock('@emotion/css', () => ({
  css: () => 'mock-css-class',
}));

jest.mock('@grafana/ui', () => ({
  Stack: ({ wrap, children }: { wrap?: string; children: ReactNode }) => (
    <div data-testid="stack" data-wrap={wrap ?? 'unset'}>
      {children}
    </div>
  ),
  useStyles2: () => ({ root: 'mock-root' }),
}));

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { OperationsEditorRow } = require('../../../../../node_modules/@grafana/prometheus/dist/cjs/querybuilder/shared/OperationsEditorRow.cjs');

describe('OperationsEditorRow', () => {
  it('wraps controls so operation cards do not overflow the row', () => {
    render(
      <OperationsEditorRow operationsLength={2}>
        <div>operations</div>
        <div>hints</div>
      </OperationsEditorRow>
    );

    expect(screen.getByTestId('stack')).toHaveAttribute('data-wrap', 'wrap');
  });
});
