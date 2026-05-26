import { canShowVersionsPage } from './canShowVersionsPage';

describe('canShowVersionsPage', () => {
  it('shows versions for saved editable dashboards', () => {
    expect(
      canShowVersionsPage('dash-1', {
        canEdit: true,
        canMakeEditable: false,
        canSave: true,
        isDashboardTemplate: false,
      })
    ).toBe(true);
  });

  it('shows versions for saved readonly dashboards that can be made editable', () => {
    expect(
      canShowVersionsPage('dash-1', {
        canEdit: false,
        canMakeEditable: true,
        canSave: false,
        isDashboardTemplate: false,
      })
    ).toBe(true);
  });

  it('shows versions after readonly dashboards are made editable without requiring save access', () => {
    expect(
      canShowVersionsPage('dash-1', {
        canEdit: true,
        canMakeEditable: false,
        canSave: false,
        isDashboardTemplate: false,
      })
    ).toBe(true);
  });

  it('hides versions for unsaved dashboards', () => {
    expect(
      canShowVersionsPage(undefined, {
        canEdit: true,
        canMakeEditable: false,
        canSave: true,
        isDashboardTemplate: false,
      })
    ).toBe(false);
  });
});
