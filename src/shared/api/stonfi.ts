import {stonApiClient as stonClient} from '../stonfi/clients';

export type StonAsset = Awaited<ReturnType<typeof stonClient.getAssets>>[number];

export interface AssetSummary {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  imageUrl?: string;
  tags: StonAsset['tags'];
  kind: StonAsset['kind'];
  priceUsd?: string;
}

// Fetches a simplified list of assets that UI components can render.
export const fetchAssets = async (): Promise<AssetSummary[]> => {
  const assets = await stonClient.getAssets();

  return assets.map((asset) => ({
    address: asset.contractAddress,
    name: asset.displayName ?? asset.symbol,
    symbol: asset.symbol,
    decimals: asset.decimals,
    imageUrl: asset.imageUrl,
    tags: asset.tags,
    kind: asset.kind,
    priceUsd: asset.dexPriceUsd ?? asset.thirdPartyPriceUsd,
  }));
};

// Future extension: add more helpers (simulate swaps, fetch pools, etc.) and keep them typed here.
