const DASHBOARD_PATH_REGEX = /^\/d\/([^/]+)(?:\/[^/]+)?\/?$/;

function getDashboardUidFromPath(pathname: string) {
  return DASHBOARD_PATH_REGEX.exec(pathname)?.[1];
}

export function isSameDashboardPath(currentPathname?: string, nextPathname?: string) {
  if (!currentPathname || !nextPathname) {
    return false;
  }

  if (currentPathname === nextPathname) {
    return true;
  }

  const currentDashboardUid = getDashboardUidFromPath(currentPathname);
  return currentDashboardUid !== undefined && currentDashboardUid === getDashboardUidFromPath(nextPathname);
}
