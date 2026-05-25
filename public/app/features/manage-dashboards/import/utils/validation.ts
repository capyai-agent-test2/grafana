import { t } from '@grafana/i18n';
import { isRecord } from 'app/core/utils/isRecord';
import { AnnoKeyFolderTitle } from 'app/features/apiserver/types';
import { getDashboardAPI } from 'app/features/dashboard/api/dashboard_api';
import {
  isDashboardV1Resource,
  isDashboardV1Spec,
  isDashboardV2Resource,
  isDashboardV2Spec,
} from 'app/features/dashboard/api/utils';

import { validationSrv } from '../../services/ValidationSrv';

export const validateDashboardJson = (json: string) => {
  let dashboard;
  try {
    dashboard = JSON.parse(json);
  } catch (error) {
    return t('dashboard.validation.invalid-json', 'Not valid JSON');
  }
  if (dashboard && dashboard.hasOwnProperty('tags')) {
    if (Array.isArray(dashboard.tags)) {
      const hasInvalidTag = dashboard.tags.some((tag: string) => typeof tag !== 'string');
      if (hasInvalidTag) {
        return t('dashboard.validation.tags-expected-strings', 'tags expected array of strings');
      }
      const hasTooLongTag = dashboard.tags.some((tag: string) => tag.length > 50);
      if (hasTooLongTag) {
        return t('dashboard.validation.tag-too-long', 'Dashboard tag too long, max 50 characters');
      }
    } else {
      return t('dashboard.validation.tags-expected-array', 'tags expected array');
    }
  }
  return validateDashboardModel(dashboard);
};

export const validateDashboardModel = (dashboard: unknown) => {
  if (
    isDashboardV1Spec(dashboard) ||
    (isDashboardV1Resource(dashboard) && isDashboardV1Spec(dashboard.spec)) ||
    isValidDashboardV2Model(dashboard) ||
    (isDashboardV2Resource(dashboard) && isValidDashboardV2Model(dashboard.spec))
  ) {
    return true;
  }

  if (!isRecord(dashboard)) {
    return t('dashboard.validation.invalid-dashboard-object', 'Dashboard JSON must be an object');
  }

  return t(
    'dashboard.validation.missing-dashboard-definition',
    'Dashboard JSON must include a dashboard title or dashboard elements'
  );
};

function isValidDashboardV2Model(dashboard: unknown): boolean {
  if (!isDashboardV2Spec(dashboard)) {
    return false;
  }

  if (!isRecord(dashboard.layout) || typeof dashboard.layout.kind !== 'string' || !isRecord(dashboard.layout.spec)) {
    return false;
  }

  if (!isRecord(dashboard.elements) || !Object.values(dashboard.elements).every(isValidDashboardV2Element)) {
    return false;
  }

  if (!Array.isArray(dashboard.variables)) {
    return false;
  }

  if (!dashboard.variables.every(isValidDashboardV2Variable)) {
    return false;
  }

  if (!Array.isArray(dashboard.annotations)) {
    return false;
  }

  if (!dashboard.annotations.every(isValidDashboardV2Annotation)) {
    return false;
  }

  return true;
}

function isValidDashboardV2Element(element: unknown): boolean {
  if (!isRecord(element) || typeof element.kind !== 'string' || !isRecord(element.spec)) {
    return false;
  }

  if (element.kind !== 'Panel') {
    return true;
  }

  const data = element.spec.data;
  if (!isRecord(data) || data.kind !== 'QueryGroup') {
    return true;
  }

  return isRecord(data.spec) && Array.isArray(data.spec.queries);
}

function isValidDashboardV2Variable(variable: unknown): boolean {
  if (!isRecord(variable) || typeof variable.kind !== 'string' || !isRecord(variable.spec)) {
    return false;
  }

  if (variable.kind === 'QueryVariable') {
    return hasQueryGroup(variable.spec.query);
  }

  return true;
}

function isValidDashboardV2Annotation(annotation: unknown): boolean {
  return (
    isRecord(annotation) &&
    typeof annotation.kind === 'string' &&
    isRecord(annotation.spec) &&
    hasQueryGroup(annotation.spec.query)
  );
}

function hasQueryGroup(query: unknown): boolean {
  return isRecord(query) && typeof query.group === 'string';
}

export const validateGcomDashboard = (gcomDashboard: string) => {
  // From DashboardImportCtrl
  const match = /(^\d+$)|dashboards\/(\d+)/.exec(gcomDashboard);

  return match && (match[1] || match[2])
    ? true
    : t('dashboard.validation.invalid-dashboard-id', 'Could not find a valid Grafana.com ID');
};

export const validateTitle = (newTitle: string, folderUid: string) => {
  return validationSrv
    .validateNewDashboardName(folderUid, newTitle)
    .then(() => {
      return true;
    })
    .catch((error) => {
      if (error.type === 'EXISTING') {
        return error.message;
      }
    });
};

export const validateUid = (value: string) => {
  return getDashboardAPI()
    .then(async (api) => {
      const existingDashboard = await api.getDashboardDTO(value);
      const isV2 = isDashboardV2Resource(existingDashboard);
      const dashboard = isV2 ? existingDashboard.spec : existingDashboard.dashboard;
      const folderTitle = isV2
        ? existingDashboard.metadata.annotations?.[AnnoKeyFolderTitle]
        : existingDashboard.meta.folderTitle;
      return `Dashboard named '${dashboard.title}' in folder '${folderTitle}' has the same UID`;
    })
    .catch((error) => {
      error.isHandled = true;

      // when Editor user tries to import admin only dashboard (with same uid) he gets an unhelpful 403 error
      //  therefore handling this use case to return some indication of whats wrong
      if (error.status === 403) {
        return 'Dashboard with the same UID already exists';
      }
      return true;
    });
};
