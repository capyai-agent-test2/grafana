import { type StyleConfigValues } from '../../style/types';

export function getZoomScaledPointValues(
  values: StyleConfigValues,
  resolution: number | undefined,
  baseResolution: number
): StyleConfigValues {
  if (values.size == null || resolution == null || resolution <= 0 || baseResolution <= 0) {
    return values;
  }

  return {
    ...values,
    size: values.size * (baseResolution / resolution),
  };
}
