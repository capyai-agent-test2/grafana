import { dateTime } from '@grafana/data';
import { formatRegistry } from '@grafana/scenes';
import { VariableFormatID } from '@grafana/schema';

let utcDateFormatterRegistered = false;

export function registerUtcDateFormatter() {
  if (utcDateFormatterRegistered) {
    return;
  }

  utcDateFormatterRegistered = true;

  const dateFormat = formatRegistry.get(VariableFormatID.Date);
  const dateFormatter = dateFormat.formatter;

  dateFormat.formatter = (value, args, variable, fieldPath) => {
    if (args[0] !== 'utc') {
      return dateFormatter(value, args, variable, fieldPath);
    }

    let nrValue = NaN;
    if (typeof value === 'number') {
      nrValue = value;
    } else if (typeof value === 'string') {
      nrValue = parseInt(value, 10);
    }

    if (isNaN(nrValue)) {
      return 'NaN';
    }

    const date = dateTime(nrValue).utc();
    const dateFormat = args.slice(1).join(':') || 'iso';

    switch (dateFormat) {
      case 'ms':
        return String(value);
      case 'seconds':
        return date.unix().toString();
      case 'iso':
        return date.toISOString();
      default:
        return date.format(dateFormat);
    }
  };
}
