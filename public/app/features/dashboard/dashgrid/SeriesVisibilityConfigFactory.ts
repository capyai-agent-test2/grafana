import {
  ByNamesMatcherMode,
  type ConfigOverrideRule,
  type DataFrame,
  type DynamicConfigValue,
  type FieldConfigSource,
  FieldMatcherID,
  fieldMatchers,
  FieldType,
  getFieldDisplayName,
  isSystemOverrideWithRef,
  type SystemConfigOverrideRule,
} from '@grafana/data';
import { SeriesVisibilityChangeMode } from '@grafana/ui';

const displayOverrideRef = 'hideSeriesFrom';
export const isHideSeriesOverride = isSystemOverrideWithRef(displayOverrideRef);

export function seriesVisibilityConfigFactory(
  label: string | string[] | null,
  mode: SeriesVisibilityChangeMode,
  fieldConfig: FieldConfigSource,
  data: DataFrame[]
) {
  const { overrides } = fieldConfig;

  const currentIndex = overrides.findIndex(isHideSeriesOverride);

  if (mode === SeriesVisibilityChangeMode.SetExactly) {
    const overridesCopy = Array.from(overrides);

    if (currentIndex >= 0) {
      overridesCopy.splice(currentIndex, 1);
    }

    if (label === null) {
      return {
        ...fieldConfig,
        overrides: overridesCopy,
      };
    }

    const availableDisplayNames = new Set(getDisplayNames(data));
    const displayNames = (Array.isArray(label) ? label : [label]).filter((name) => availableDisplayNames.has(name));

    if (displayNames.length === 0) {
      return currentIndex >= 0 ? { ...fieldConfig, overrides: overridesCopy } : fieldConfig;
    }

    return {
      ...fieldConfig,
      overrides: [...overridesCopy, createOverride(Array.from(new Set(displayNames)))],
    };
  }

  if (typeof label !== 'string') {
    return fieldConfig;
  }

  const displayName = label;

  if (currentIndex < 0) {
    if (mode === SeriesVisibilityChangeMode.ToggleSelection) {
      const override = createOverride([displayName, ...getNamesOfHiddenFields(overrides, data)]);

      return {
        ...fieldConfig,
        overrides: [...fieldConfig.overrides, override],
      };
    }

    const displayNames = getDisplayNames(data, displayName);
    const override = createOverride(displayNames);

    return {
      ...fieldConfig,
      overrides: [...fieldConfig.overrides, override],
    };
  }

  const overridesCopy = Array.from(overrides);
  const [current] = overridesCopy.splice(currentIndex, 1) as SystemConfigOverrideRule[];

  if (mode === SeriesVisibilityChangeMode.ToggleSelection) {
    let existing = getExistingDisplayNames(current);
    const nameOfHiddenFields = getNamesOfHiddenFields(overridesCopy, data);

    if (nameOfHiddenFields.length > 0) {
      existing = existing.filter((el) => nameOfHiddenFields.indexOf(el) < 0);
    }

    if (existing[0] === displayName && existing.length === 1) {
      return {
        ...fieldConfig,
        overrides: overridesCopy,
      };
    }

    const override = createOverride([displayName, ...nameOfHiddenFields]);

    return {
      ...fieldConfig,
      overrides: [...overridesCopy, override],
    };
  }

  const override = createExtendedOverride(current, displayName);

  if (allFieldsAreExcluded(override, data)) {
    return {
      ...fieldConfig,
      overrides: overridesCopy,
    };
  }

  return {
    ...fieldConfig,
    overrides: [...overridesCopy, override],
  };
}

function createOverride(
  names: string[],
  mode = ByNamesMatcherMode.exclude,
  property?: DynamicConfigValue
): SystemConfigOverrideRule {
  property = property ?? {
    id: 'custom.hideFrom',
    value: {
      viz: true,
      legend: false,
      tooltip: true,
    },
  };

  return {
    __systemRef: displayOverrideRef,
    matcher: {
      id: FieldMatcherID.byNames,
      options: {
        mode: mode,
        names: names,
        prefix: mode === ByNamesMatcherMode.exclude ? 'All except:' : undefined,
        readOnly: true,
      },
    },
    properties: [
      {
        ...property,
        value: {
          viz: true,
          legend: false,
          tooltip: true,
        },
      },
    ],
  };
}

const createExtendedOverride = (
  current: SystemConfigOverrideRule,
  displayName: string,
  mode = ByNamesMatcherMode.exclude
): SystemConfigOverrideRule => {
  const property = current.properties.find((p) => p.id === 'custom.hideFrom');
  const existing = getExistingDisplayNames(current);
  const index = existing.findIndex((name) => name === displayName);

  if (index < 0) {
    existing.push(displayName);
  } else {
    existing.splice(index, 1);
  }

  return createOverride(existing, mode, property);
};

const getExistingDisplayNames = (rule: SystemConfigOverrideRule): string[] => {
  const names = rule.matcher.options?.names;
  if (!Array.isArray(names)) {
    return [];
  }
  return [...names];
};

const allFieldsAreExcluded = (override: SystemConfigOverrideRule, data: DataFrame[]): boolean => {
  return getExistingDisplayNames(override).length === getDisplayNames(data).length;
};

const getDisplayNames = (data: DataFrame[], excludeName?: string): string[] => {
  const unique = new Set<string>();

  for (const frame of data) {
    for (const field of frame.fields) {
      if (field.type !== FieldType.number) {
        continue;
      }

      const name = getFieldDisplayName(field, frame, data);

      if (name === excludeName) {
        continue;
      }

      unique.add(name);
    }
  }

  return Array.from(unique);
};

const getNamesOfHiddenFields = (overrides: ConfigOverrideRule[], data: DataFrame[]): string[] => {
  let names: string[] = [];

  for (const override of overrides) {
    const property = override.properties.find((p) => p.id === 'custom.hideFrom');

    if (property !== undefined && property.value?.legend === true) {
      const info = fieldMatchers.get(override.matcher.id);
      const matcher = info.get(override.matcher.options);

      for (const frame of data) {
        for (const field of frame.fields) {
          if (field.type !== FieldType.number) {
            continue;
          }

          const name = getFieldDisplayName(field, frame, data);

          if (matcher(field, frame, data)) {
            names.push(name);
          }
        }
      }
    }
  }

  return names;
};
