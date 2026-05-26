import { Alert } from '@grafana/ui';

import { placeHolderScopedVars } from './monaco-query-field/monaco-completion-provider/validation';
import { isLogsQuery } from '../queryUtils';
import { LokiQueryField } from './LokiQueryField';
import { type LokiQueryEditorProps } from './types';

export function LokiQueryEditorForAlerting(props: LokiQueryEditorProps) {
  const { query, data, datasource, onChange, onRunQuery, history } = props;
  const interpolatedExpr = datasource.interpolateVariablesInQueries([query], placeHolderScopedVars)[0]?.expr ?? query.expr;
  const showMetricQueryError = Boolean(interpolatedExpr) && isLogsQuery(interpolatedExpr);

  return (
    <LokiQueryField
      datasource={datasource}
      query={query}
      onChange={onChange}
      onRunQuery={onRunQuery}
      history={history}
      data={data}
      placeholder="Enter a Loki query"
      data-testid={testIds.editor}
      ExtraFieldElement={
        showMetricQueryError ? (
          <Alert severity="error" title="Alert queries must return metrics">
            Use a Loki metric query such as <code>rate(...)</code> or <code>count_over_time(...)</code>, not a log query.
          </Alert>
        ) : undefined
      }
    />
  );
}

export const testIds = {
  editor: 'loki-editor-cloud-alerting',
};
