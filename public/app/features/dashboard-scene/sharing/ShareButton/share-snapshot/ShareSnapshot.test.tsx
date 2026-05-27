import userEvent from '@testing-library/user-event';
import { render, screen } from 'test/test-utils';

import { useReturnToPrevious } from '@grafana/runtime';

import { ShareSnapshot } from './ShareSnapshot';

jest.mock('@grafana/runtime', () => ({
  ...jest.requireActual('@grafana/runtime'),
  useReturnToPrevious: jest.fn(),
}));

describe('ShareSnapshot', () => {
  it('sets a return target before navigating to the snapshots list', async () => {
    const user = userEvent.setup();
    const setReturnToPrevious = jest.fn();
    jest.mocked(useReturnToPrevious).mockReturnValue(setReturnToPrevious);

    const model = {
      useState: () => ({
        snapshotName: 'Production overview',
        snapshotSharingOptions: undefined,
        selectedExpireOption: { label: '1 Week', value: 604800 },
        panelRef: undefined,
        onDismiss: jest.fn(),
        dashboardRef: {
          resolve: () => ({
            state: {
              title: 'Production overview',
            },
          }),
        },
      }),
      onSnapshotCreate: jest.fn(),
      onSnapshotDelete: jest.fn(),
      onSnasphotNameChange: jest.fn(),
      onExpireChange: jest.fn(),
    } as unknown as ShareSnapshot;

    render(<ShareSnapshot.Component model={model} />);

    const link = screen.getByRole('link', { name: 'View all snapshots' });

    expect(link).toHaveAttribute('href', expect.stringContaining('/dashboard/snapshots'));
    expect(link).not.toHaveAttribute('target', '_blank');

    await user.click(link);

    expect(setReturnToPrevious).toHaveBeenCalledWith('Production overview');
  });
});
