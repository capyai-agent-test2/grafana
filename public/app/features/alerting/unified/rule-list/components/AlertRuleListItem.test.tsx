import { render, screen, waitFor } from 'test/test-utils';

import { AlertState } from 'app/plugins/datasource/alertmanager/types';

import { setupMswServer } from '../../mockApi';
import { mockAlertmanagerAlert } from '../../mocks';
import { setAlertmanagerAlertsHandler } from '../../mocks/server/configure';

import { AlertRuleListItem } from './AlertRuleListItem';

setupMswServer();

const TEST_RULE_UID = 'test-rule-uid-123';

describe('AlertRuleListItem', () => {
  beforeEach(() => {
    setAlertmanagerAlertsHandler([]);
  });

  it('shows a suppressed badge when the Grafana rule has silenced instances', async () => {
    setAlertmanagerAlertsHandler([
      mockAlertmanagerAlert({
        labels: { __alert_rule_uid__: TEST_RULE_UID, alertname: 'TestAlert' },
        status: { state: AlertState.Suppressed, silencedBy: ['silence-id'], inhibitedBy: [] },
      }),
    ]);

    render(
      <AlertRuleListItem
        name="CPU alert"
        href="/alerting/grafana/test-rule-uid-123/view"
        state="firing"
        grafanaRuleUid={TEST_RULE_UID}
      />,
      { renderWithRouter: true }
    );

    await waitFor(() => {
      expect(screen.getByText('Suppressed')).toBeInTheDocument();
    });
  });
});
