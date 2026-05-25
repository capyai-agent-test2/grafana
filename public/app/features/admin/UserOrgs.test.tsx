import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { OrgRole } from '@grafana/data';

import { TestProvider } from '../../../test/helpers/TestProvider';
import { contextSrv } from '../../core/services/context_srv';
import { AccessControlAction } from '../../types/accessControl';
import type { UserDTO, UserOrg } from '../../types/user';

import { UserOrgs } from './UserOrgs';

const user: UserDTO = {
  id: 1,
  uid: 'user-1',
  login: 'admin',
  email: 'admin@grafana.com',
  name: 'Admin',
  isGrafanaAdmin: true,
  isDisabled: false,
  isExternal: false,
  isExternallySynced: false,
  isProvisioned: false,
  authLabels: [],
};

const orgs: UserOrg[] = [{ orgId: 1, name: 'Main Org.', role: OrgRole.Admin }];

describe('UserOrgs', () => {
  beforeEach(() => {
    jest.spyOn(contextSrv, 'licensedAccessControlEnabled').mockReturnValue(false);
    jest.spyOn(contextSrv, 'hasPermission').mockImplementation((action) => {
      return (
        action === AccessControlAction.OrgUsersAdd ||
        action === AccessControlAction.OrgUsersWrite ||
        action === AccessControlAction.OrgUsersRemove
      );
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('shows inline save and cancel actions when changing an organization role', async () => {
    render(
      <TestProvider>
        <UserOrgs user={user} orgs={orgs} onOrgAdd={jest.fn()} onOrgRemove={jest.fn()} onOrgRoleChange={jest.fn()} />
      </TestProvider>
    );

    await userEvent.click(screen.getByRole('button', { name: 'Change role' }));

    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Change role' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Remove from organization' })).toBeInTheDocument();
  });
});
