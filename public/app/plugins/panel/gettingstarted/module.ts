import { PanelPlugin } from '@grafana/data';

import { GettingStarted } from './GettingStarted';
import { type Options } from './panelcfg.gen';

export const plugin = new PanelPlugin<Options>(GettingStarted).setNoPadding();
