import { renderHook } from '@testing-library/react';

import { useColorScheme } from './hooks';
import { ColorScheme, ColorSchemeDiff } from './types';

describe('useColorScheme', () => {
  it('uses a compatible initial scheme for standard flamegraphs', () => {
    const { result } = renderHook(() => useColorScheme({ isDiffFlamegraph: () => false } as never, ColorScheme.ValueBased));

    expect(result.current[0]).toBe(ColorScheme.ValueBased);
  });

  it('falls back to the default standard scheme for incompatible initial schemes', () => {
    const { result } = renderHook(() =>
      useColorScheme({ isDiffFlamegraph: () => false } as never, ColorSchemeDiff.DiffColorBlind)
    );

    expect(result.current[0]).toBe(ColorScheme.PackageBased);
  });

  it('uses a compatible initial scheme for diff flamegraphs', () => {
    const { result } = renderHook(() =>
      useColorScheme({ isDiffFlamegraph: () => true } as never, ColorSchemeDiff.DiffColorBlind)
    );

    expect(result.current[0]).toBe(ColorSchemeDiff.DiffColorBlind);
  });
});
