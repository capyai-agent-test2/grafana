export const getVariableValueCandidates = (value: unknown): unknown[] => {
  if (Array.isArray(value)) {
    return value;
  }

  if (typeof value !== 'string' || value.length < 2 || value[0] !== '{' || value[value.length - 1] !== '}') {
    return [value];
  }

  return value
    .slice(1, -1)
    .split(',')
    .map((candidate) => candidate.trim());
};
