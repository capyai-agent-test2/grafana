import { render, screen } from '@testing-library/react';

import { VariableTextAreaField } from './VariableTextAreaField';

describe('VariableTextAreaField', () => {
  it('shows the required marker in the field label', () => {
    render(<VariableTextAreaField name="Query" placeholder="" width={20} onChange={() => {}} required />);

    expect(screen.getByText('Query *')).toBeInTheDocument();
  });

  it('does not render an orphan required marker when the label is empty', () => {
    const { container } = render(
      <VariableTextAreaField name="" placeholder="" width={20} onChange={() => {}} required />
    );

    expect(container).not.toHaveTextContent(/^\s*\*\s*$/);
  });
});
