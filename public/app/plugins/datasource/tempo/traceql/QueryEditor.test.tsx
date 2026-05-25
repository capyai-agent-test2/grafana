import { render, screen } from '@testing-library/react';
import React from 'react';

import { CoreApp, toUtc } from '@grafana/data';
import { type TemplateSrv } from '@grafana/runtime';

import { createTempoDatasource } from '../test/mocks';
import { type TempoQuery } from '../types';

import { QueryEditor } from './QueryEditor';

jest.mock('./TraceQLEditor', () => ({
  TraceQLEditor: () => <div data-testid="traceql-editor" />,
}));

describe('Tempo TraceQL QueryEditor', () => {
  const range = {
    from: toUtc('2024-01-01T00:00:00Z'),
    to: toUtc('2024-01-01T01:00:00Z'),
    raw: {
      from: toUtc('2024-01-01T00:00:00Z'),
      to: toUtc('2024-01-01T01:00:00Z'),
    },
  };

  function renderQueryEditor(query: TempoQuery = { refId: 'A', queryType: 'traceql' } as TempoQuery) {
    const datasource = createTempoDatasource({} as unknown as TemplateSrv);

    return render(
      <QueryEditor
        app={CoreApp.Explore}
        datasource={datasource}
        onChange={jest.fn()}
        onClearResults={jest.fn()}
        onRunQuery={jest.fn()}
        query={query}
        range={range}
      />
    );
  }

  it('renders a wrapping TraceQL description block instead of a fixed-height inline label', () => {
    renderQueryEditor();

    const description = screen.getByTestId('traceql-description');

    expect(description).toHaveStyle('display: flex');
    expect(description).toHaveStyle('flex-wrap: wrap');
    expect(description).toHaveStyle('min-height: 32px');
  });

  it('lets the query options wrap instead of forcing both panels onto one row', () => {
    renderQueryEditor();

    const optionsGroup = screen.getByTestId('tempo-query-builder-options');

    expect(screen.getByText('Search Options')).toBeInTheDocument();
    expect(screen.getByText('Metrics Options')).toBeInTheDocument();
    expect(optionsGroup).toHaveStyle('display: flex');
    expect(optionsGroup).toHaveStyle('flex-wrap: wrap');
    expect(optionsGroup).toHaveStyle('align-items: flex-start');
  });
});
