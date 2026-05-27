import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom-v5-compat';

import { t } from '@grafana/i18n';
import { Alert, LoadingPlaceholder, Stack } from '@grafana/ui';
import { useGetContactPoint } from 'app/features/alerting/unified/components/contact-points/useContactPoints';
import { useContactPointsNav } from 'app/features/alerting/unified/navigation/useNotificationConfigNav';
import { useAlertmanager } from 'app/features/alerting/unified/state/AlertmanagerContext';
import { GRAFANA_RULES_SOURCE_NAME } from 'app/features/alerting/unified/utils/datasource';
import { makeAMLink, stringifyErrorLike } from 'app/features/alerting/unified/utils/misc';
import { type GrafanaManagedContactPoint } from 'app/plugins/datasource/alertmanager/types';

import { alertRuleApi } from '../../api/alertRuleApi';
import { withPageErrorBoundary } from '../../withPageErrorBoundary';
import { AlertmanagerPageWrapper } from '../AlertingPageWrapper';
import { GrafanaReceiverForm } from '../receivers/form/GrafanaReceiverForm';

import { FileExportPreview } from './FileExportPreview';
import { GrafanaExportDrawer } from './GrafanaExportDrawer';
import { type ExportFormats, allGrafanaExportProviders } from './providers';

interface EmbeddedContactPoint {
  uid?: string;
  name: string;
  type: string;
  settings: Record<string, unknown>;
  disableResolveMessage?: boolean;
}

export const REDACTED_CONTACT_POINT_SECRET = '[REDACTED]';

function setNestedValue(target: Record<string, unknown>, keyPath: string, value: unknown) {
  const keys = keyPath.split('.');
  let current: Record<string, unknown> = target;

  keys.forEach((key, index) => {
    const isLeaf = index === keys.length - 1;

    if (isLeaf) {
      current[key] = value;
      return;
    }

    const next = current[key];
    if (typeof next !== 'object' || next === null || Array.isArray(next)) {
      current[key] = {};
    }

    current = current[key] as Record<string, unknown>;
  });
}

export function getExportableSettings(
  settings: Record<string, unknown>,
  secureFields?: Record<string, boolean>
): Record<string, unknown> {
  const exportableSettings = structuredClone(settings);

  Object.entries(secureFields ?? {}).forEach(([key, configured]) => {
    if (configured) {
      setNestedValue(exportableSettings, key, REDACTED_CONTACT_POINT_SECRET);
    }
  });

  return exportableSettings;
}

function toEmbeddedContactPoints(contactPoint: GrafanaManagedContactPoint): EmbeddedContactPoint[] {
  return (contactPoint.grafana_managed_receiver_configs ?? []).map((receiver) => ({
    uid: receiver.uid,
    name: contactPoint.name,
    type: receiver.type,
    settings: getExportableSettings(receiver.settings, receiver.secureFields),
    disableResolveMessage: receiver.disableResolveMessage,
  }));
}

interface GrafanaContactPointExportPreviewProps {
  contactPoint: GrafanaManagedContactPoint;
  exportFormat: ExportFormats;
  onClose: () => void;
}

function GrafanaContactPointExportPreview({
  contactPoint,
  exportFormat,
  onClose,
}: GrafanaContactPointExportPreviewProps) {
  const [getExport, exportData] = alertRuleApi.endpoints.exportContactPointFromPayload.useMutation();
  const payload = useMemo(() => toEmbeddedContactPoints(contactPoint), [contactPoint]);

  useEffect(() => {
    getExport({ contactPoints: payload, format: exportFormat });
  }, [exportFormat, getExport, payload]);

  if (exportData.isLoading) {
    return <LoadingPlaceholder text={t('alerting.grafana-contact-point-export-preview.text-loading', 'Loading....')} />;
  }

  const downloadFileName = `contact-point-${contactPoint.name}-${new Date().getTime()}`;

  return (
    <FileExportPreview
      format={exportFormat}
      textDefinition={exportData.data ?? ''}
      downloadFileName={downloadFileName}
      onClose={onClose}
    />
  );
}

function GrafanaContactPointDesignerExporter({
  contactPoint,
  onClose,
}: {
  contactPoint: GrafanaManagedContactPoint;
  onClose: () => void;
}) {
  const [activeTab, setActiveTab] = useState<ExportFormats>('yaml');

  return (
    <GrafanaExportDrawer
      title={t('alerting.grafana-contact-point-designer-exporter.title-export-contact-point', 'Export contact point')}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      onClose={onClose}
      formatProviders={Object.values(allGrafanaExportProviders)}
    >
      <GrafanaContactPointExportPreview contactPoint={contactPoint} exportFormat={activeTab} onClose={onClose} />
    </GrafanaExportDrawer>
  );
}

function ContactPointExportForm({
  contactPoint,
  editMode,
}: {
  contactPoint?: GrafanaManagedContactPoint;
  editMode?: boolean;
}) {
  const { selectedAlertmanager } = useAlertmanager();
  const [exportContactPoint, setExportContactPoint] = useState<GrafanaManagedContactPoint>();
  const onClose = useCallback(() => setExportContactPoint(undefined), []);
  const returnTo = makeAMLink('/alerting/notifications', selectedAlertmanager);

  return (
    <Stack direction="column" gap={2}>
      <GrafanaReceiverForm
        contactPoint={contactPoint}
        editMode={editMode}
        onSubmit={setExportContactPoint}
        submitButtonText={t('alerting.contact-point-modify-export.button-export', 'Export')}
        cancelHref={returnTo}
      />
      {exportContactPoint && (
        <GrafanaContactPointDesignerExporter contactPoint={exportContactPoint} onClose={onClose} />
      )}
    </Stack>
  );
}

function ExportNewContactPoint() {
  const { selectedAlertmanager } = useAlertmanager();

  if (selectedAlertmanager !== GRAFANA_RULES_SOURCE_NAME) {
    return (
      <Alert
        title={t('alerting.export-new-contact-point.title-unsupported', 'Export is not supported')}
        severity="error"
      >
        {t(
          'alerting.export-new-contact-point.body-unsupported',
          'This export flow is only available for Grafana-managed contact points.'
        )}
      </Alert>
    );
  }

  return <ContactPointExportForm />;
}

function ModifyExportContactPoint() {
  const { selectedAlertmanager } = useAlertmanager();
  const { name = '' } = useParams();
  const contactPointName = decodeURIComponent(name);
  const {
    isLoading,
    error,
    data: contactPoint,
  } = useGetContactPoint({
    name: contactPointName,
    alertmanager: selectedAlertmanager!,
  });

  if (selectedAlertmanager !== GRAFANA_RULES_SOURCE_NAME) {
    return (
      <Alert
        title={t('alerting.modify-contact-point-export.title-unsupported', 'Export is not supported')}
        severity="error"
      >
        {t(
          'alerting.modify-contact-point-export.body-unsupported',
          'This export flow is only available for Grafana-managed contact points.'
        )}
      </Alert>
    );
  }

  if (isLoading) {
    return <LoadingPlaceholder text={t('alerting.modify-contact-point-export.text-loading', 'Loading...')} />;
  }

  if (error) {
    return (
      <Alert
        severity="error"
        title={t(
          'alerting.modify-contact-point-export.title-failed-to-fetch-contact-point',
          'Failed to fetch contact point'
        )}
      >
        {stringifyErrorLike(error)}
      </Alert>
    );
  }

  if (!contactPoint || !('grafana_managed_receiver_configs' in contactPoint)) {
    return (
      <Alert
        severity="error"
        title={t('alerting.modify-contact-point-export.title-receiver-not-found', 'Receiver not found')}
      >
        {t('alerting.modify-contact-point-export.body-receiver-not-found', 'Sorry, this contact point does not exist.')}
      </Alert>
    );
  }

  return <ContactPointExportForm contactPoint={contactPoint} editMode />;
}

function ExportNewContactPointPage() {
  const { navId } = useContactPointsNav();

  return (
    <AlertmanagerPageWrapper
      navId={navId}
      pageNav={{
        text: t('alerting.export-new-contact-point-page.text-export', 'Export new contact point'),
        subTitle: 'Export a new contact point definition without saving it.',
      }}
      accessType="notification"
    >
      <ExportNewContactPoint />
    </AlertmanagerPageWrapper>
  );
}

function ModifyExportContactPointPage() {
  const { navId } = useContactPointsNav();

  return (
    <AlertmanagerPageWrapper
      navId={navId}
      pageNav={{
        text: t('alerting.modify-contact-point-export-page.text-export', 'Export with modifications'),
        subTitle: 'Modify the current contact point and export the definition without saving it.',
      }}
      accessType="notification"
    >
      <ModifyExportContactPoint />
    </AlertmanagerPageWrapper>
  );
}

export const GrafanaModifyExportContactPointPage = withPageErrorBoundary(ModifyExportContactPointPage);
export default withPageErrorBoundary(ExportNewContactPointPage);
