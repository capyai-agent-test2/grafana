import { isSameDashboardPath } from './isSameDashboardPath';

describe('isSameDashboardPath', () => {
  it('treats identical paths as the same dashboard', () => {
    expect(isSameDashboardPath('/d/test-uid/test-slug', '/d/test-uid/test-slug')).toBe(true);
  });

  it('treats slugless and slugged paths with the same uid as the same dashboard', () => {
    expect(isSameDashboardPath('/d/test-uid/test-slug', '/d/test-uid')).toBe(true);
    expect(isSameDashboardPath('/d/test-uid', '/d/test-uid/test-slug')).toBe(true);
  });

  it('does not treat different dashboard uids as the same dashboard', () => {
    expect(isSameDashboardPath('/d/test-uid/test-slug', '/d/other-uid/test-slug')).toBe(false);
  });

  it('does not treat other routes as the same dashboard', () => {
    expect(isSameDashboardPath('/d/test-uid/test-slug', '/d-solo/test-uid/test-slug')).toBe(false);
    expect(isSameDashboardPath('/d/test-uid/test-slug', '/dashboard/new')).toBe(false);
  });
});
