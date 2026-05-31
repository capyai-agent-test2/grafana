import { config, locationService } from '@grafana/runtime';
import { KioskMode } from 'app/types/dashboard';

import { AppChromeService } from './AppChromeService';

describe('AppChromeService', () => {
  const defaultKioskMode = config.defaultKioskMode;

  afterEach(() => {
    config.defaultKioskMode = defaultKioskMode;
    jest.restoreAllMocks();
  });

  it('Ignore state updates when sectionNav and pageNav have new instance but same text, url or active child', () => {
    const chromeService = new AppChromeService();
    let stateChanges = 0;

    chromeService.state.subscribe(() => stateChanges++);
    chromeService.update({
      sectionNav: { node: { text: 'hello' }, main: { text: '' } },
      pageNav: { text: 'test', url: 'A' },
    });
    chromeService.update({
      sectionNav: { node: { text: 'hello' }, main: { text: '' } },
      pageNav: { text: 'test', url: 'A' },
    });

    expect(stateChanges).toBe(2);

    // if url change we should update
    chromeService.update({
      sectionNav: { node: { text: 'hello' }, main: { text: '' } },
      pageNav: { text: 'test', url: 'new/url' },
    });
    expect(stateChanges).toBe(3);

    // if active child changed should update state
    chromeService.update({
      sectionNav: { node: { text: 'hello' }, main: { text: '' } },
      pageNav: { text: 'test', url: 'A', children: [{ text: 'child', active: true }] },
    });
    expect(stateChanges).toBe(4);

    // If active child is the same we should not update state
    chromeService.update({
      sectionNav: { node: { text: 'hello' }, main: { text: '' } },
      pageNav: { text: 'test', url: 'A', children: [{ text: 'child', active: true }] },
    });
    expect(stateChanges).toBe(4);
  });

  it('uses kiosk mode when default kiosk mode is enabled and the URL does not specify a mode', () => {
    config.defaultKioskMode = true;
    const chromeService = new AppChromeService();

    chromeService.setKioskModeFromUrl(undefined);

    expect(chromeService.state.getValue().kioskMode).toBe(KioskMode.Full);
  });

  it('lets the URL opt out of default kiosk mode', () => {
    config.defaultKioskMode = true;
    const chromeService = new AppChromeService();

    chromeService.setKioskModeFromUrl(undefined);
    chromeService.setKioskModeFromUrl('false');

    expect(chromeService.state.getValue().kioskMode).toBeNull();
  });

  it('keeps kiosk mode disabled after exiting when default kiosk mode is enabled', () => {
    config.defaultKioskMode = true;
    const partialSpy = jest.spyOn(locationService, 'partial').mockImplementation();
    const chromeService = new AppChromeService();

    chromeService.setKioskModeFromUrl(true);
    chromeService.exitKioskMode();

    expect(chromeService.state.getValue().kioskMode).toBeUndefined();
    expect(partialSpy).toHaveBeenCalledWith({ kiosk: false });
  });
});
