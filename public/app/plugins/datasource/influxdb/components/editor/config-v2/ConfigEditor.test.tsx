import '@testing-library/jest-dom';

import { render, screen } from '@testing-library/react';

import { ConfigEditor } from './ConfigEditor';
import { createTestProps } from './helpers';

const leftSideBarMock = jest.fn(() => <div data-testid="left-sidebar" />);

jest.mock('./LeftSideBar', () => ({
  LeftSideBar: (props: unknown) => leftSideBarMock(props),
}));

jest.mock('./UrlAndAuthenticationSection', () => ({
  UrlAndAuthenticationSection: () => <div data-testid="url-auth-section" />,
}));

jest.mock('./DatabaseConnectionSection', () => ({
  DatabaseConnectionSection: () => <div data-testid="db-connection-section" />,
}));

describe('ConfigEditor', () => {
  const defaultProps = createTestProps({
    options: {
      jsonData: {},
      secureJsonData: {},
      secureJsonFields: {},
    },
    mocks: {
      onOptionsChange: jest.fn(),
    },
  });

  beforeEach(() => {
    leftSideBarMock.mockClear();
  });

  it('renders the LeftSideBar, UrlAndAuthenticationSection, and DatabaseConnectionSection', () => {
    render(<ConfigEditor {...defaultProps} />);

    expect(screen.getByTestId('left-sidebar')).toBeInTheDocument();
    expect(screen.getByTestId('url-auth-section')).toBeInTheDocument();
    expect(screen.getByTestId('db-connection-section')).toBeInTheDocument();
  });

  it('passes pdcInjected from props instead of jsonData', () => {
    render(
      <ConfigEditor
        {...defaultProps}
        pdcInjected={true}
        options={{ ...defaultProps.options, jsonData: { ...defaultProps.options.jsonData, pdcInjected: false } }}
      />
    );

    expect(leftSideBarMock).toHaveBeenCalledWith(
      expect.objectContaining({ pdcInjected: true })
    );
  });
});
