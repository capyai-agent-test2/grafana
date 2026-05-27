import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { render, screen, waitFor } from 'test/test-utils';

import { config, locationService } from '@grafana/runtime';

import { FolderActionsButton } from './FolderActionsButton';

const mockDeleteGrafanaRulesFromFolder = jest.fn();
const mockDispatch = jest.fn();

jest.mock('@grafana/ui', () => {
  const actual = jest.requireActual('@grafana/ui');
  const Menu = ({ children }: { children: ReactNode }) => <div>{children}</div>;
  Menu.Item = ({
    label,
    onClick,
    disabled,
  }: {
    label: string;
    onClick?: () => void;
    disabled?: boolean;
  }) => (
    <button disabled={disabled} onClick={onClick}>
      {label}
    </button>
  );
  Menu.Divider = () => null;

  return {
    ...actual,
    Dropdown: ({ children, overlay }: { children: ReactNode; overlay: ReactNode }) => (
      <div>
        {children}
        {overlay}
      </div>
    ),
    Menu,
  };
});

jest.mock('app/types/store', () => ({
  ...jest.requireActual('app/types/store'),
  useDispatch: () => mockDispatch,
}));

jest.mock('../../api/alertingFolderActionsApi', () => ({
  alertingFolderActionsApi: {
    endpoints: {
      deleteGrafanaRulesFromFolder: {
        useMutation: () => [mockDeleteGrafanaRulesFromFolder, { isLoading: false }],
      },
      pauseFolder: {
        useMutation: () => [jest.fn(), { isLoading: false }],
      },
      unpauseFolder: {
        useMutation: () => [jest.fn(), { isLoading: false }],
      },
    },
  },
}));

jest.mock('../../featureToggles', () => ({
  ...jest.requireActual('../../featureToggles'),
  shouldUseAlertingListViewV2: () => true,
  shouldUsePrometheusRulesPrimary: () => false,
}));

jest.mock('../../hooks/useAbilities', () => ({
  AlertingAction: {
    ExportGrafanaManagedRules: 'export',
  },
  FolderBulkAction: {
    Pause: 'pause',
    Delete: 'delete',
  },
  useAlertingAbility: () => [false, false],
  useFolderBulkActionAbility: (action: string) => [action === 'delete', action === 'delete'],
}));

jest.mock('../../hooks/useFolder', () => ({
  useFolder: () => ({
    folder: { title: 'My folder' },
  }),
}));

jest.mock('../MoreButton', () => ({
  __esModule: true,
  default: (props: ButtonHTMLAttributes<HTMLButtonElement>) => <button {...props}>More</button>,
}));

jest.mock('./DeleteModal', () => ({
  DeleteModal: ({
    isOpen,
    onConfirm,
  }: {
    isOpen: boolean;
    onConfirm: () => Promise<void>;
  }) => (isOpen ? <button onClick={() => void onConfirm()}>Confirm delete</button> : null),
}));

describe('FolderActionsButton', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    config.featureToggles.alertingBulkActionsInUI = true;
    mockDispatch.mockResolvedValue(undefined);
    mockDeleteGrafanaRulesFromFolder.mockReturnValue({
      unwrap: () => Promise.resolve(),
    });
  });

  it('redirects back to grouped view after deleting from grouped layout', async () => {
    const { user } = render(<FolderActionsButton folderUID="folder-1" />, {
      historyOptions: { initialEntries: ['/alerting/list'] },
    });

    await user.click(screen.getByRole('button', { name: /delete all rules/i }));
    await user.click(screen.getByRole('button', { name: /confirm delete/i }));

    await waitFor(() => expect(locationService.getLocation().pathname).toBe('/alerting/list'));
    expect(locationService.getLocation().search).toBe('');
  });

  it('preserves list layout after deleting from list view', async () => {
    const { user } = render(<FolderActionsButton folderUID="folder-1" />, {
      historyOptions: { initialEntries: ['/alerting/list?view=list'] },
    });

    await user.click(screen.getByRole('button', { name: /delete all rules/i }));
    await user.click(screen.getByRole('button', { name: /confirm delete/i }));

    await waitFor(() => expect(locationService.getLocation().pathname).toBe('/alerting/list'));
    expect(locationService.getLocation().search).toBe('?view=list');
  });
});
