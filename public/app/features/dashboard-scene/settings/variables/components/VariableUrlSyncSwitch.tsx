import { t } from '@grafana/i18n';
import { Field, Switch } from '@grafana/ui';

interface Props {
  skipUrlSync?: boolean;
  onChange: (skipUrlSync: boolean) => void;
}

export function VariableUrlSyncSwitch({ skipUrlSync, onChange }: Props) {
  return (
    <Field
      label={t('dashboard-scene.variable-url-sync-switch.label', 'Sync value to URL')}
      description={t(
        'dashboard-scene.variable-url-sync-switch.description',
        'Disabling URL sync can improve performance and avoid long URLs when this variable has many selected values.'
      )}
      noMargin
    >
      <Switch value={!skipUrlSync} onChange={(event) => onChange(!event.currentTarget.checked)} />
    </Field>
  );
}
