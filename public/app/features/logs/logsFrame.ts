import { type DataFrame, FieldType, type FieldWithIndex, DataFrameType, type Labels } from '@grafana/data';

import { parseLegacyLogsFrame } from './legacyLogsFrame';

// these are like Labels, but their values can be
// arbitrary structures, not just strings
export type LogFrameLabels = Record<string, unknown>;

// the attributes-access is a little awkward, but it's necessary
// because there are multiple,very different dataFrame-representations.
export type LogsFrame = {
  timeField: FieldWithIndex;
  bodyField: FieldWithIndex;
  timeNanosecondField: FieldWithIndex | null;
  severityField: FieldWithIndex | null;
  idField: FieldWithIndex | null;
  getLogFrameLabels: () => LogFrameLabels[] | null; // may be slow, so we only do it when asked for it explicitly
  getLogFrameLabelsAsLabels: () => Labels[] | null; // temporarily exists to make the labels=>attributes migration simpler
  getLabelFieldName: () => string | null;
  extraFields: FieldWithIndex[];
};

function getFrameField(frame: DataFrame, name: string, fieldType: FieldType): FieldWithIndex | undefined {
  const index = frame.fields.findIndex((field) => field.name === name && field.type === fieldType);
  if (index === -1) {
    return undefined;
  }

  return {
    ...frame.fields[index],
    index,
  };
}

export const LOGS_DATAPLANE_TIMESTAMP_NAME = 'timestamp';
export const LOGS_DATAPLANE_BODY_NAME = 'body';
export const DATAPLANE_SEVERITY_NAME = 'severity';
export const DATAPLANE_ID_NAME = 'id';
export const DATAPLANE_LABELS_NAME = 'labels';
export const DATAPLANE_LABEL_TYPES_NAME = 'labelTypes';

// NOTE: this is a hot fn, we need to avoid allocating new objects here
export function logFrameLabelsToLabels(logFrameLabels: LogFrameLabels): Labels {
  let needsSerialization = false;

  for (const k in logFrameLabels) {
    const v = logFrameLabels[k];

    if (typeof v !== 'string') {
      needsSerialization = true;
      break;
    }
  }

  if (needsSerialization) {
    let labels: Labels = {};

    for (const k in logFrameLabels) {
      const v = logFrameLabels[k];
      labels[k] = typeof v === 'string' ? v : JSON.stringify(v);
    }

    return labels;
  }

  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  return logFrameLabels as Labels;
}

export function parseDataplaneLogsFrame(frame: DataFrame): LogsFrame | null {
  const timestampField = getFrameField(frame, LOGS_DATAPLANE_TIMESTAMP_NAME, FieldType.time);
  const bodyField = getFrameField(frame, LOGS_DATAPLANE_BODY_NAME, FieldType.string);

  // these two are mandatory
  if (timestampField === undefined || bodyField === undefined) {
    return null;
  }

  const severityField = getFrameField(frame, DATAPLANE_SEVERITY_NAME, FieldType.string) ?? null;
  const idField = getFrameField(frame, DATAPLANE_ID_NAME, FieldType.string) ?? null;
  const labelsField = getFrameField(frame, DATAPLANE_LABELS_NAME, FieldType.other) ?? null;

  const labels = labelsField === null ? null : labelsField.values;

  const extraFields = frame.fields
    .map((field, index) => ({ ...field, index }))
    .filter(
      ({ index }) =>
        index !== timestampField.index &&
        index !== bodyField.index &&
        index !== severityField?.index &&
        index !== idField?.index &&
        index !== labelsField?.index
    );

  return {
    timeField: timestampField,
    bodyField,
    severityField,
    idField,
    getLogFrameLabels: () => labels,
    timeNanosecondField: null,
    getLogFrameLabelsAsLabels: () => (labels !== null ? labels.map(logFrameLabelsToLabels) : null),
    getLabelFieldName: () => (labelsField !== null ? labelsField.name : null),
    extraFields,
  };
}

export function parseLogsFrame(frame: DataFrame): LogsFrame | null {
  if (frame.meta?.type === DataFrameType.LogLines) {
    return parseDataplaneLogsFrame(frame);
  } else {
    return parseLegacyLogsFrame(frame);
  }
}
