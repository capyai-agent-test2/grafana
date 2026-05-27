import { FieldConfigProperty, PanelPlugin } from '@grafana/data';
import { ColorScheme, ColorSchemeDiff, checkFields, SelectedView } from '@grafana/flamegraph';
import { t } from '@grafana/i18n';

import { FlameGraphPanel } from './FlameGraphPanel';
import { type Options } from './types';

const flamegraphConfigOptions = [FieldConfigProperty.Unit, FieldConfigProperty.Decimals];

export const plugin = new PanelPlugin<Options>(FlameGraphPanel)
  .setMigrationHandler((panel) => {
    if (panel.options?.defaultView) {
      return panel.options;
    }

    return {
      ...panel.options,
      defaultView: panel.options?.showFlameGraphOnly ? SelectedView.FlameGraph : SelectedView.Both,
    };
  })
  // check that the first frame of the data has the required fields for a flamegraph
  .setSuggestionsSupplier((ds) => {
    if (!ds.rawFrames?.some((frame) => checkFields(frame) === undefined)) {
      return;
    }

    return [
      {
        cardOptions: {
          previewModifier: (s) => {
            s.options = s.options || {};
            s.options.showFlameGraphOnly = true;
          },
        },
      },
    ];
  })
  .setPanelOptions((builder) => {
    builder
      .addRadio({
        path: 'defaultView',
        name: t('flamegraph.options.default-view', 'Default view'),
        defaultValue: SelectedView.Both,
        settings: {
          options: [
            { value: SelectedView.TopTable, label: t('flamegraph.options.view-top-table', 'Top Table') },
            { value: SelectedView.FlameGraph, label: t('flamegraph.options.view-flame-graph', 'Flame Graph') },
            { value: SelectedView.Both, label: t('flamegraph.options.view-both', 'Both') },
          ],
        },
      })
      .addRadio({
        path: 'colorScheme',
        name: t('flamegraph.options.color-scheme', 'Color scheme'),
        defaultValue: ColorScheme.PackageBased,
        settings: {
          options: [
            { value: ColorScheme.PackageBased, label: t('flamegraph.options.color-package', 'By package name') },
            { value: ColorScheme.ValueBased, label: t('flamegraph.options.color-value', 'By value') },
            { value: ColorSchemeDiff.Default, label: t('flamegraph.options.color-diff-default', 'Diff: green to red') },
            {
              value: ColorSchemeDiff.DiffColorBlind,
              label: t('flamegraph.options.color-diff-color-blind', 'Diff: blue to red'),
            },
          ],
        },
      });
  })
  .useFieldConfig({
    disableStandardOptions: Object.values(FieldConfigProperty).filter((v) => !flamegraphConfigOptions.includes(v)),
  });
