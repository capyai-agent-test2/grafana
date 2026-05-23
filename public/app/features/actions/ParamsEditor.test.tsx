import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ParamsEditor } from './ParamsEditor';

describe('ParamsEditor', () => {
  const mockOnChange = jest.fn();

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  it('renders labeled key and value inputs', () => {
    render(<ParamsEditor value={[]} onChange={mockOnChange} suggestions={[]} />);

    expect(screen.getByLabelText('Key')).toBeInTheDocument();
    expect(screen.getByLabelText('Value')).toBeInTheDocument();
  });

  it('renders labeled content type inputs when enabled', () => {
    render(
      <ParamsEditor
        value={[['Content-Type', 'application/json']]}
        onChange={mockOnChange}
        suggestions={[]}
        contentTypeHeader={true}
      />
    );

    expect(screen.getAllByLabelText('Content-Type')).toHaveLength(2);
    expect(screen.getByText('application/json')).toBeInTheDocument();
  });

  it('adds a new parameter when labeled inputs are filled', async () => {
    const user = userEvent.setup();
    render(<ParamsEditor value={[]} onChange={mockOnChange} suggestions={[]} />);

    const [keyInput] = screen.getAllByLabelText('Key');
    const [valueInput] = screen.getAllByLabelText('Value');

    await user.type(keyInput, 'header-name');
    await user.type(valueInput, 'header-value');
    await user.click(screen.getByRole('button', { name: 'Add' }));

    expect(mockOnChange).toHaveBeenCalledWith([['header-name', 'header-value']]);
  });
});
