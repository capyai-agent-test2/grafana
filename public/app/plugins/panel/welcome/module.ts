import { PanelPlugin } from '@grafana/data';

import { WelcomeBanner } from './Welcome';
import { type Options } from './panelcfg.gen';

export const plugin = new PanelPlugin<Options>(WelcomeBanner).setNoPadding();
