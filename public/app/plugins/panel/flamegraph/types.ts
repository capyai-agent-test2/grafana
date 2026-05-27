import type { ColorScheme, ColorSchemeDiff, SelectedView } from '@grafana/flamegraph';

export interface Options {
  showFlameGraphOnly?: boolean;
  defaultView?: SelectedView;
  colorScheme?: ColorScheme | ColorSchemeDiff;
}
