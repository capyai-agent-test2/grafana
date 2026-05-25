import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';

import { Badge } from './Badge';

jest.mock('../Tooltip/Tooltip', () => ({
  Tooltip: ({
    children,
    content,
    interactive,
  }: {
    children: ReactNode;
    content: ReactNode;
    interactive?: boolean;
  }) => (
    <div data-testid="tooltip" data-content={String(content)} data-interactive={interactive ? 'true' : 'false'}>
      {children}
    </div>
  ),
}));

describe('Badge', () => {
  it('passes tooltip interactivity through to Tooltip', () => {
    render(<Badge color="orange" text="1 warning" tooltip="Warning details" tooltipInteractive />);

    expect(screen.getByTestId('tooltip')).toHaveAttribute('data-interactive', 'true');
  });
});
