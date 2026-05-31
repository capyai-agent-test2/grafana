import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { VariableUrlSyncSwitch } from './VariableUrlSyncSwitch';

describe('VariableUrlSyncSwitch', () => {
  it('syncs variable values to the URL by default', () => {
    render(<VariableUrlSyncSwitch onChange={jest.fn()} />);

    expect(screen.getByRole('switch', { name: /Sync value to URL/ })).toBeChecked();
    expect(screen.getByText(/avoid long URLs/)).toBeInTheDocument();
  });

  it('calls onChange with skipUrlSync when toggled', async () => {
    const onChange = jest.fn();
    const user = userEvent.setup();

    render(<VariableUrlSyncSwitch skipUrlSync={false} onChange={onChange} />);

    await user.click(screen.getByRole('switch', { name: /Sync value to URL/ }));

    expect(onChange).toHaveBeenCalledWith(true);
  });
});
