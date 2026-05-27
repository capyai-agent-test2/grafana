import { render } from '@testing-library/react';

import { getPanelProps } from '../test-utils';

import { FlameGraphPanel } from './FlameGraphPanel';
import { type Options } from './types';

const flameGraphMock = jest.fn(() => null);
const checkFieldsMock = jest.fn();

jest.mock('@grafana/flamegraph', () => ({
  FlameGraph: (props: unknown) => {
    flameGraphMock(props);
    return null;
  },
  checkFields: (...args: unknown[]) => checkFieldsMock(...args),
  getMessageCheckFieldsResult: jest.fn(),
  SelectedView: {
    TopTable: 'topTable',
    FlameGraph: 'flameGraph',
    Both: 'both',
  },
}));

describe('FlameGraphPanel', () => {
  beforeEach(() => {
    flameGraphMock.mockClear();
    checkFieldsMock.mockReset();
    checkFieldsMock.mockReturnValue(undefined);
  });

  it('prefers persisted default view over the legacy flamegraph-only flag', () => {
    const props = getPanelProps<Options>(
      { showFlameGraphOnly: true, defaultView: 'topTable' as Options['defaultView'] },
      { data: { ...getPanelProps({}).data, series: [{} as never] } }
    );

    render(<FlameGraphPanel {...props} />);

    expect(flameGraphMock).toHaveBeenCalledWith(
      expect.objectContaining({
        showFlameGraphOnly: false,
        initialSelectedView: 'topTable',
      })
    );
  });

  it('falls back to the legacy flamegraph-only behavior when no persisted default view exists', () => {
    const props = getPanelProps<Options>({ showFlameGraphOnly: true }, { data: { ...getPanelProps({}).data, series: [{} as never] } });

    render(<FlameGraphPanel {...props} />);

    expect(flameGraphMock).toHaveBeenCalledWith(
      expect.objectContaining({
        initialSelectedView: 'flameGraph',
      })
    );
  });
});
