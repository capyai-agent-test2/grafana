import { render, screen } from '@testing-library/react';

import { VariableTextField } from './VariableTextField';

describe('VariableTextField', () => {
  it('shows the required marker in the field label', () => {
    render(<VariableTextField name="Name" value="" onChange={() => {}} required />);

    expect(screen.getByText('Name *')).toBeInTheDocument();
  });

  it('does not render an orphan required marker when the label is empty', () => {
    const { container } = render(<VariableTextField name="" value="" onChange={() => {}} required />);

    expect(container).not.toHaveTextContent(/^\s*\*\s*$/);
  });
});
