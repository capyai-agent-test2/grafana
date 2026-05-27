import { getWrapper, renderHook, waitFor } from 'test/test-utils';

import { AlertState } from 'app/plugins/datasource/alertmanager/types';

import { setupMswServer } from '../mockApi';
import { mockAlertmanagerAlert } from '../mocks';
import { setAlertmanagerAlertsHandler } from '../mocks/server/configure';

import { useHasSilencedInstances } from './useHasSilencedInstances';

setupMswServer();

const TEST_RULE_UID = 'test-rule-uid-123';
const OTHER_RULE_UID = 'other-rule-uid-456';

const wrapper = () => getWrapper({ renderWithRouter: true });

describe('useHasSilencedInstances', () => {
  beforeEach(() => {
    setAlertmanagerAlertsHandler([]);
  });

  it('should return false when no silenced alerts exist', async () => {
    const { result } = renderHook(() => useHasSilencedInstances(TEST_RULE_UID), { wrapper: wrapper() });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.hasSilencedInstances).toBe(false);
  });

  it('should return true when a silenced alert matches the rule UID', async () => {
    setAlertmanagerAlertsHandler([
      mockAlertmanagerAlert({
        labels: { __alert_rule_uid__: TEST_RULE_UID, alertname: 'TestAlert' },
        status: { state: AlertState.Suppressed, silencedBy: ['silence-id'], inhibitedBy: [] },
      }),
    ]);

    const { result } = renderHook(() => useHasSilencedInstances(TEST_RULE_UID), { wrapper: wrapper() });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.hasSilencedInstances).toBe(true);
  });

  it('should return false when silenced alerts exist but none match the rule UID', async () => {
    setAlertmanagerAlertsHandler([
      mockAlertmanagerAlert({
        labels: { __alert_rule_uid__: OTHER_RULE_UID, alertname: 'OtherAlert' },
        status: { state: AlertState.Suppressed, silencedBy: ['silence-id'], inhibitedBy: [] },
      }),
    ]);

    const { result } = renderHook(() => useHasSilencedInstances(TEST_RULE_UID), { wrapper: wrapper() });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.hasSilencedInstances).toBe(false);
  });
});
