export type MaxDataPoints = number | string;

const relativeMaxDataPointsPattern = /^\d+(?:\.\d+)?%$/;

export function isRelativeMaxDataPoints(value: unknown): value is string {
  return typeof value === 'string' && relativeMaxDataPointsPattern.test(value.trim());
}

export function parseMaxDataPoints(value: string): MaxDataPoints | null {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return null;
  }

  if (isRelativeMaxDataPoints(trimmedValue)) {
    const percent = Number.parseFloat(trimmedValue);
    return percent > 0 ? `${percent}%` : null;
  }

  if (!/^\d+$/.test(trimmedValue)) {
    return null;
  }

  const maxDataPoints = Number.parseInt(trimmedValue, 10);
  return maxDataPoints > 0 ? maxDataPoints : null;
}

export function getMaxDataPointsFromWidth(maxDataPoints: MaxDataPoints | null | undefined, width: number): number {
  if (isRelativeMaxDataPoints(maxDataPoints)) {
    return Math.max(1, Math.floor((width * Number.parseFloat(maxDataPoints)) / 100));
  }

  return maxDataPoints || Math.floor(width);
}

export function getAbsoluteMaxDataPoints(maxDataPoints: MaxDataPoints | null | undefined): number | undefined {
  return isRelativeMaxDataPoints(maxDataPoints) ? undefined : (maxDataPoints ?? undefined);
}

export function setMaxDataPoints<T extends object>(target: T, maxDataPoints: MaxDataPoints | null | undefined): T {
  Reflect.set(target, 'maxDataPoints', maxDataPoints ?? undefined);
  return target;
}
