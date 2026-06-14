interface EntrypointAssets {
  assets: { js?: string[]; css?: string[] };
}

function isEntrypointsMap(value: unknown): value is Record<string, EntrypointAssets> {
  return typeof value === 'object' && value !== null;
}

function isAssetEntry(value: unknown): value is { src: string } {
  return typeof value === 'object' && value !== null && 'src' in value;
}

export function manifestTransform(assets: Record<string, unknown>, entrypointsKey: string) {
  const entrypointsValue = assets[entrypointsKey];
  const entrypointAssets = isEntrypointsMap(entrypointsValue)
    ? Object.values(entrypointsValue).flatMap((entry) => [...(entry.assets.js || []), ...(entry.assets.css || [])])
    : [];

  const filteredAssets = Object.entries(assets).filter(([assetFileName]) => {
    const asset = assets[assetFileName];
    return isAssetEntry(asset) && entrypointAssets.includes(asset.src);
  });

  return {
    ...Object.fromEntries(filteredAssets),
    [entrypointsKey]: entrypointsValue,
  };
}
