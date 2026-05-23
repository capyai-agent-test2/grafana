import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { useEffect, useReducer } from 'react';

import { type TimeRange } from '@grafana/data';

import { testIds } from '../../components/LokiQueryEditor';
import { type LokiDatasource } from '../../datasource';
import { type LokiQuery } from '../../types';
import { lokiQueryModeller } from '../LokiQueryModeller';
import { buildVisualQueryFromString } from '../parsing';
import { type LokiVisualQuery } from '../types';

import { LokiQueryBuilder } from './LokiQueryBuilder';
import { QueryPreview } from './QueryPreview';

export interface Props {
  query: LokiQuery;
  datasource: LokiDatasource;
  onChange: (update: LokiQuery) => void;
  onRunQuery: () => void;
  showExplain: boolean;
  timeRange?: TimeRange;
}

export interface State {
  visQuery?: LokiVisualQuery;
  expr: string;
}

interface QueryStatePayload {
  expr: string;
  visualQuery?: LokiVisualQuery;
}

/**
 * This component is here just to contain the translation logic between string query and the visual query builder model.
 */
export function LokiQueryBuilderContainer(props: Props) {
  const { query, onChange, onRunQuery, datasource, showExplain, timeRange } = props;
  const [state, dispatch] = useReducer(stateSlice.reducer, {
    expr: query.expr,
    visQuery: getVisualQueryForExpr(query.expr, query.visualQuery),
  });

  // Only rebuild visual query if expr changes from outside
  useEffect(() => {
    dispatch(queryChanged({ expr: query.expr, visualQuery: query.visualQuery }));
  }, [query.expr, query.visualQuery]);

  const onVisQueryChange = (visQuery: LokiVisualQuery) => {
    const expr = lokiQueryModeller.renderQuery(visQuery);
    dispatch(visualQueryChange({ visQuery, expr }));
    onChange({ ...props.query, expr, visualQuery: visQuery });
  };

  if (!state.visQuery) {
    return null;
  }

  return (
    <>
      <LokiQueryBuilder
        query={state.visQuery}
        datasource={datasource}
        onChange={onVisQueryChange}
        onRunQuery={onRunQuery}
        showExplain={showExplain}
        data-testid={testIds.editor}
        timeRange={timeRange}
      />
      {query.expr !== '' && <QueryPreview query={query.expr} />}
    </>
  );
}

const initialState: State = { expr: '' };

const stateSlice = createSlice({
  name: 'loki-builder-container',
  initialState,
  reducers: {
    visualQueryChange: (state, action: PayloadAction<{ visQuery: LokiVisualQuery; expr: string }>) => {
      state.expr = action.payload.expr;
      state.visQuery = action.payload.visQuery;
    },
    queryChanged: (state, action: PayloadAction<QueryStatePayload>) => {
      const { expr, visualQuery } = action.payload;
      if (!state.visQuery || state.expr !== expr) {
        state.expr = expr;
        state.visQuery = getVisualQueryForExpr(expr, visualQuery);
      }
    },
  },
});

function getVisualQueryForExpr(expr: string, visualQuery?: LokiVisualQuery) {
  if (visualQuery && lokiQueryModeller.renderQuery(visualQuery) === expr) {
    return visualQuery;
  }

  if (expr === '') {
    return {
      labels: [],
      operations: [{ id: '__line_contains', params: [''] }],
    };
  }

  const parseResult = buildVisualQueryFromString(expr);
  return parseResult.query;
}

const { visualQueryChange, queryChanged } = stateSlice.actions;
