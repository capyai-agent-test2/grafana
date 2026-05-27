import { type PluginState } from '@grafana/data';
import { Trans } from '@grafana/i18n';
import { InlineField } from '@grafana/ui';
import { PluginStateInfo } from 'app/features/plugins/components/PluginStateInfo';

export type Props = {
  state?: PluginState;
};

export function DataSourcePluginState({ state }: Props) {
  return (
    <InlineField
      label={
        <Trans i18nKey="datasources.data-source-plugin-state.plugin-state">Plugin state</Trans>
      }
      labelWidth={10}
    >
      <PluginStateInfo state={state} />
    </InlineField>
  );
}
