import { render, screen } from '@testing-library/react';

import { type StandardEditorContext, type StandardEditorsRegistryItem } from '@grafana/data';
import { ScalarDimensionMode, type ScalarDimensionConfig } from '@grafana/schema';

import { ScalarDimensionEditor } from './ScalarDimensionEditor';

const mockContext: StandardEditorContext<unknown> = {
  data: [],
};

const mockItem = {
  id: 'scalarDimension',
  name: 'Scalar dimension',
  editor: ScalarDimensionEditor,
} as StandardEditorsRegistryItem<ScalarDimensionConfig>;

describe('ScalarDimensionEditor', () => {
  it('renders the field selector with an accessible label', () => {
    render(
      <ScalarDimensionEditor
        value={{ mode: ScalarDimensionMode.Mod }}
        context={mockContext}
        onChange={jest.fn()}
        item={mockItem}
      />
    );

    expect(screen.getByRole('combobox', { name: 'Scalar' })).toBeInTheDocument();
  });
});
