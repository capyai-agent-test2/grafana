import { render, screen } from 'test/test-utils';

import { type ComponentTypeWithExtensionMeta, type NavModelItem, PluginExtensionPoints } from '@grafana/data';
import { GrafanaEdition } from '@grafana/data/internal';
import { config, setBackendSrv, setPluginComponentsHook } from '@grafana/runtime';
import { setupMockServer } from '@grafana/test-utils/server';
import { backendSrv } from 'app/core/services/backend_srv';
import { createComponentWithMeta } from 'app/features/plugins/extensions/usePluginComponents';
import { configureStore } from 'app/store/configureStore';

import HomePage from './HomePage';

setBackendSrv(backendSrv);
setupMockServer();

beforeEach(() => {
  setPluginComponentsHook(() => ({ components: [], isLoading: false }));
});

jest.mock('app/core/components/AppChrome/MegaMenu/hooks', () => ({
  usePinnedItems: jest.fn(() => []),
}));

const navBarTree: NavModelItem[] = [
  { id: 'home', text: 'Home', url: '/' },
  { id: 'bookmarks', text: 'Bookmarks', url: '/bookmarks' },
  { id: 'starred', text: 'Starred', children: [{ id: 'starred-1', text: 'Starred Dashboard 1', url: '/d/1' }] },
];

const renderHomePage = () => render(<HomePage />, { store: configureStore({ navBarTree }) });

const createHomepageExtensionComponent = (
  pluginId: string,
  content: string,
  extensionPointId: PluginExtensionPoints
): ComponentTypeWithExtensionMeta<{}> =>
  createComponentWithMeta(
    {
      pluginId,
      title: content,
      component: () => <div>{content}</div>,
    },
    extensionPointId
  );

describe('HomePage', () => {
  const originalBuildInfo = { ...config.buildInfo };
  const originalNamespace = config.namespace;

  afterEach(() => {
    config.buildInfo = { ...originalBuildInfo };
    config.namespace = originalNamespace;
  });

  it('renders the greeting', async () => {
    renderHomePage();
    expect(await screen.findByRole('heading', { name: /^Good \w+\.$/ })).toBeInTheDocument();
  });

  it('renders the OSS welcome message', async () => {
    config.buildInfo.edition = GrafanaEdition.OpenSource;

    renderHomePage();
    expect(await screen.findByText('Welcome to Grafana.')).toBeInTheDocument();
  });

  it('renders dashboard tabs and auto-switches to bookmarks', async () => {
    renderHomePage();
    expect(screen.getByRole('tab', { name: /recent/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /bookmarks/i })).toBeInTheDocument();

    expect(await screen.findByRole('tab', { name: /bookmarks/i, selected: true })).toBeInTheDocument();
  });

  it('renders the Enterprise welcome message', async () => {
    config.buildInfo.edition = GrafanaEdition.Enterprise;

    renderHomePage();
    expect(await screen.findByText('Welcome to Grafana Enterprise.')).toBeInTheDocument();
  });

  it('renders the Cloud welcome message', async () => {
    config.namespace = 'stacks-12345';

    renderHomePage();
    expect(await screen.findByText('Welcome to Grafana Cloud.')).toBeInTheDocument();
  });

  it('renders homepage pre extension components', async () => {
    setPluginComponentsHook(({ extensionPointId }) => ({
      isLoading: false,
      components:
        extensionPointId === PluginExtensionPoints.HomepagePre
          ? [
              createHomepageExtensionComponent(
                'grafana-setupguide-app',
                'Homepage pre extension',
                PluginExtensionPoints.HomepagePre
              ),
              createHomepageExtensionComponent(
                'grafana-untrusted-app',
                'Untrusted homepage pre extension',
                PluginExtensionPoints.HomepagePre
              ),
            ]
          : [],
    }));

    renderHomePage();

    expect(await screen.findByText('Homepage pre extension')).toBeInTheDocument();
    expect(screen.queryByText('Untrusted homepage pre extension')).not.toBeInTheDocument();
  });

  it('renders homepage extra extension components', async () => {
    setPluginComponentsHook(({ extensionPointId }) => ({
      isLoading: false,
      components:
        extensionPointId === PluginExtensionPoints.HomepageExtra
          ? [
              createHomepageExtensionComponent(
                'grafana-setupguide-app',
                'Homepage extra extension 1',
                PluginExtensionPoints.HomepageExtra
              ),
              createHomepageExtensionComponent(
                'grafana-setupguide-app',
                'Homepage extra extension 2',
                PluginExtensionPoints.HomepageExtra
              ),
              createHomepageExtensionComponent(
                'grafana-untrusted-app',
                'Untrusted homepage extra extension',
                PluginExtensionPoints.HomepageExtra
              ),
            ]
          : [],
    }));

    renderHomePage();

    expect(await screen.findByText('Homepage extra extension 1')).toBeInTheDocument();
    expect(await screen.findByText('Homepage extra extension 2')).toBeInTheDocument();
    expect(screen.queryByText('Untrusted homepage extra extension')).not.toBeInTheDocument();
  });
});
