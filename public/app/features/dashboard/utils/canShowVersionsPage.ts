import { type DashboardMeta } from 'app/types/dashboard';

export function canShowVersionsPage(
  uid: string | undefined,
  meta: Pick<DashboardMeta, 'canEdit' | 'canMakeEditable' | 'canSave' | 'isDashboardTemplate'>
) {
  return Boolean(uid || meta.isDashboardTemplate) && Boolean(meta.canSave || meta.canEdit || meta.canMakeEditable);
}
