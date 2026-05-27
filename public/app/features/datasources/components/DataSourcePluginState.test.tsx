import { render, screen } from '@testing-library/react';

import { PluginState } from '@grafana/data';

import { DataSourcePluginState } from './DataSourcePluginState';

describe('<DataSourcePluginState>', () => {
  it('renders the plugin state label and badge', () => {
    render(<DataSourcePluginState state={PluginState.beta} />);

    expect(screen.getByText('Plugin state')).toBeInTheDocument();
    expect(screen.getByText('Beta')).toBeInTheDocument();
  });
});
