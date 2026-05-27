import { type AlertmanagerAlert } from 'app/plugins/datasource/alertmanager/types';

import { alertmanagerApi } from '../api/alertmanagerApi';
import { GRAFANA_RULES_SOURCE_NAME } from '../utils/datasource';

/**
 * Fetches the full list of currently silenced alerts from the Grafana Alertmanager.
 *
 * This is intentionally unfiltered by rule so the result can be shared through RTK Query's cache
 * across the rule list and rule viewer without per-rule requests.
 */
export function useSilencedAlerts(): {
  silencedAlerts: AlertmanagerAlert[];
  isLoading: boolean;
} {
  const { data, isLoading } = alertmanagerApi.useGetAlertmanagerAlertsQuery(
    {
      amSourceName: GRAFANA_RULES_SOURCE_NAME,
      filter: { silenced: true, active: false, inhibited: false },
      showErrorAlert: false,
    },
    { skip: false }
  );

  return {
    silencedAlerts: data ?? [],
    isLoading,
  };
}
