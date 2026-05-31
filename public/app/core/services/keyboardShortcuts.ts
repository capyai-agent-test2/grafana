import { type UrlQueryMap, type UrlQueryValue } from '@grafana/data';

export function areKeyboardShortcutsDisabled(queryParams: UrlQueryMap): boolean {
  return isUrlParamEnabled(queryParams.disableShortcuts) || isUrlParamEnabled(queryParams.disableKeyboardShortcuts);
}

function isUrlParamEnabled(value: UrlQueryValue): boolean {
  return value === true || value === '' || value === '1' || value === 'true';
}
