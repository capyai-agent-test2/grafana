import { useEffect, useState } from 'react';

import { type FlameGraphDataContainer } from './FlameGraph/dataTransform';
import { ColorScheme, ColorSchemeDiff } from './types';

/**
 * Manages the color scheme state, resetting it when the data changes between
 * diff and non-diff profiles.
 */
function isStandardColorScheme(colorScheme: ColorScheme | ColorSchemeDiff): colorScheme is ColorScheme {
  return colorScheme === ColorScheme.PackageBased || colorScheme === ColorScheme.ValueBased;
}

function isDiffColorScheme(colorScheme: ColorScheme | ColorSchemeDiff): colorScheme is ColorSchemeDiff {
  return colorScheme === ColorSchemeDiff.Default || colorScheme === ColorSchemeDiff.DiffColorBlind;
}

function getCompatibleColorScheme(
  colorScheme: ColorScheme | ColorSchemeDiff | undefined,
  isDiffFlamegraph: boolean
): ColorScheme | ColorSchemeDiff {
  if (isDiffFlamegraph) {
    return colorScheme && isDiffColorScheme(colorScheme) ? colorScheme : ColorSchemeDiff.Default;
  }

  return colorScheme && isStandardColorScheme(colorScheme) ? colorScheme : ColorScheme.PackageBased;
}

export function useColorScheme(
  dataContainer: FlameGraphDataContainer | undefined,
  initialColorScheme?: ColorScheme | ColorSchemeDiff
) {
  const defaultColorScheme = getCompatibleColorScheme(initialColorScheme, dataContainer?.isDiffFlamegraph() ?? false);
  const [colorScheme, setColorScheme] = useState<ColorScheme | ColorSchemeDiff>(defaultColorScheme);

  useEffect(() => {
    setColorScheme(defaultColorScheme);
  }, [defaultColorScheme]);

  return [colorScheme, setColorScheme] as const;
}
