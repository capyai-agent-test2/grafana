import { type PluginState } from '@grafana/data';
import { t } from '@grafana/i18n';
import { InlineField } from '@grafana/ui';
import { PluginStateInfo } from 'app/features/plugins/components/PluginStateInfo';

export type Props = {
  state?: PluginState;
};

export function DataSourcePluginState({ state }: Props) {
  return (
    <InlineField
      label={t('datasources.data-source-plugin-state.plugin-state', 'Plugin state')}
      labelWidth={10}
    >
      <PluginStateInfo state={state} />
    </InlineField>
  );
}
