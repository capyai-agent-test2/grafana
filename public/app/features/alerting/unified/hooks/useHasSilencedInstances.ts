import { useSilencedAlerts } from './useSilencedAlerts';

/**
 * Checks whether any instances of a given Grafana-managed alert rule
 * are currently silenced by the Grafana Alertmanager.
 *
 * Uses the shared useSilencedAlerts cache (one request for the full silenced list)
 * and matches client-side via the __alert_rule_uid__ label, which the backend
 * stamps on Grafana-managed alert instances.
 */
export function useHasSilencedInstances(ruleUid: string | undefined): {
  hasSilencedInstances: boolean;
  isLoading: boolean;
} {
  const { silencedAlerts, isLoading } = useSilencedAlerts();

  const hasSilencedInstances =
    ruleUid !== undefined && silencedAlerts.some((alert) => alert.labels.__alert_rule_uid__ === ruleUid);

  return { hasSilencedInstances, isLoading };
}
