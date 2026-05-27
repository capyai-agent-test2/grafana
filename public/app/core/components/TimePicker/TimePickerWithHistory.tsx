import { uniqBy } from 'lodash';

import {
  AppEvents,
  type DateTime,
  LocalStorageValueProvider,
  dateTimeFormat,
  type TimeRange,
  type TimeOption,
  isDateTime,
  rangeUtil,
} from '@grafana/data';
import { t } from '@grafana/i18n';
import { type TimeRangePickerProps, TimeRangePicker } from '@grafana/ui';
import { appEvents } from 'app/core/app_events';

const LOCAL_STORAGE_KEY = 'grafana.dashboard.timepicker.history';
const MAX_RECENT_HISTORY_ITEMS = 4;
const MAX_SAVED_HISTORY_ITEMS = 8;

interface Props extends Omit<TimeRangePickerProps, 'history' | 'theme'> {}

// Simplified object to store in local storage
interface TimePickerHistoryItem {
  from: string;
  to: string;
  label?: string;
  saved?: boolean;
}

interface TimePickerHistoryOption extends TimeOption {
  saved?: boolean;
}

export const TimePickerWithHistory = (props: Props) => {
  return (
    <LocalStorageValueProvider<unknown> storageKey={LOCAL_STORAGE_KEY} defaultValue={[]}>
      {(values, onSaveToStore) => {
        const validHistory = getValidHistory(values);
        const history = deserializeHistory(validHistory);
        const historyOptions = mapHistoryToOptions(validHistory, props.timeZone);
        const historyTitle = validHistory.some((item) => item.saved)
          ? t('time-picker.history.saved-and-recent-title', 'Saved and recent absolute ranges')
          : t('time-picker.absolute.recent-title', 'Recently used absolute ranges');

        return (
          <TimeRangePicker
            {...props}
            history={history}
            historyOptions={historyOptions}
            historyTitle={historyTitle}
            onSaveHistoryOption={(option) => onSaveToHistory(option, validHistory, onSaveToStore)}
            onChange={(value) => {
              onAppendToHistory(value, validHistory, onSaveToStore);
              props.onChange(value);
            }}
            onError={(error?: string) =>
              appEvents.emit(AppEvents.alertError, [
                t('time-picker.copy-paste.default-error-title', 'Invalid time range'),
                t('time-picker.copy-paste.default-error-message', `{{error}} is not a valid time range`, { error }),
              ])
            }
          />
        );
      }}
    </LocalStorageValueProvider>
  );
};

function getValidHistory(values: unknown): TimePickerHistoryItem[] {
  const result: TimePickerHistoryItem[] = [];

  if (!Array.isArray(values)) {
    return result;
  }
  // Check if the values are already in the correct format

  for (let item of values) {
    const parsed = getValidHistoryItem(item);
    if (parsed) {
      result.push(parsed);
    }
  }

  return result;
}

export function deserializeHistory(values: TimePickerHistoryItem[]): TimeRange[] {
  return values.map((item) => rangeUtil.convertRawToRange(item, 'utc', undefined, 'YYYY-MM-DD HH:mm:ss'));
}

function mapHistoryToOptions(values: TimePickerHistoryItem[], timeZone?: Props['timeZone']): TimePickerHistoryOption[] {
  return values.map((item) => {
    const range = rangeUtil.convertRawToRange(item, timeZone, undefined, 'YYYY-MM-DD HH:mm:ss');
    const formattedRange = `${dateTimeFormat(range.from, { timeZone })} to ${dateTimeFormat(range.to, { timeZone })}`;

    return {
      from: item.from,
      to: item.to,
      display: item.saved && item.label ? `${item.label} · ${formattedRange}` : formattedRange,
      saved: item.saved,
    };
  });
}

function onAppendToHistory(
  newTimeRange: TimeRange,
  values: TimePickerHistoryItem[],
  onSaveToStore: (values: TimePickerHistoryItem[]) => void
) {
  if (!isAbsoluteTimeRange(newTimeRange)) {
    // If the time range is not absolute, do not append it to history, ex: last 5 minutes
    return;
  }

  // Convert DateTime objects to strings
  const toAppend = {
    from: convertToISOString(newTimeRange.raw.from),
    to: convertToISOString(newTimeRange.raw.to),
  };

  const existingItem = values.find((item) => item.from === toAppend.from && item.to === toAppend.to);
  const mergedItem = existingItem ? { ...toAppend, label: existingItem.label, saved: existingItem.saved } : toAppend;
  const remainingValues = values.filter((item) => item.from !== toAppend.from || item.to !== toAppend.to);
  const toStore = limit([mergedItem, ...remainingValues]);
  onSaveToStore(toStore);
}

function isAbsoluteTimeRange(value: TimeRange): boolean {
  return isDateTime(value.raw.from) || isDateTime(value.raw.to);
}

function limit(value: TimePickerHistoryItem[]): TimePickerHistoryItem[] {
  const unique = uniqBy(value, (v) => v.from + v.to);
  const saved = unique.filter((item) => item.saved).slice(0, MAX_SAVED_HISTORY_ITEMS);
  const recent = unique.filter((item) => !item.saved).slice(0, MAX_RECENT_HISTORY_ITEMS);

  return [...saved, ...recent];
}

/**
 * Check if the value is a valid TimePickerHistoryItem. If it doesn't match the format exactly, it will return false.
 * @returns true if the value match exactly to TimePickerHistoryItem, false otherwise
 */
export function getValidHistoryItem(value: unknown): TimePickerHistoryItem | null {
  // First check if it's a valid object
  if (typeof value !== 'object' || value === null) {
    return null;
  }

  const allowedKeys = ['from', 'to', 'label', 'saved'];
  if (Object.keys(value).some((key) => !allowedKeys.includes(key))) {
    return null;
  }

  // Check if it has the required properties
  if (!('from' in value) || !('to' in value)) {
    return null;
  }

  const { from, to } = value;
  // Check if both properties are strings
  if (typeof from === 'string' && typeof to === 'string') {
    const item: TimePickerHistoryItem = { from, to };

    if ('label' in value && typeof value.label === 'string' && value.label.trim()) {
      item.label = value.label.trim();
    }

    if ('saved' in value && typeof value.saved === 'boolean') {
      item.saved = value.saved;
    }

    return item;
  }

  return null;
}

function onSaveToHistory(
  timeOption: TimeOption,
  values: TimePickerHistoryItem[],
  onSaveToStore: (values: TimePickerHistoryItem[]) => void
) {
  const currentItem = values.find((item) => item.from === timeOption.from && item.to === timeOption.to);
  const label = window.prompt(
    currentItem?.saved
      ? t('time-picker.history.edit-prompt', 'Edit label for this saved time range')
      : t('time-picker.history.save-prompt', 'Label this time range'),
    currentItem?.label ?? ''
  );

  if (label === null) {
    return;
  }

  const trimmedLabel = label.trim();
  if (!trimmedLabel) {
    return;
  }

  const nextItem: TimePickerHistoryItem = {
    from: timeOption.from,
    to: timeOption.to,
    label: trimmedLabel,
    saved: true,
  };
  const remainingValues = values.filter((item) => item.from !== timeOption.from || item.to !== timeOption.to);

  onSaveToStore(limit([nextItem, ...remainingValues]));
}

function convertToISOString(value: DateTime | string): string {
  if (typeof value === 'string') {
    return value;
  }

  if (!value?.toISOString) {
    throw console.error('Invalid DateTime object passed to convertToISOString');
  }

  return value.toISOString();
}
