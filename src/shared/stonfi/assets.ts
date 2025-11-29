import {AssetTag} from '@ston-fi/api';
import {stonApiClient} from './clients';

// Pull only assets with medium+ liquidity to keep selections usable.
const LIQUIDITY_CONDITION = [
  AssetTag.LiquidityVeryHigh,
  AssetTag.LiquidityHigh,
  AssetTag.LiquidityMedium,
].join(' | ');

export const fetchLiquidAssets = () =>
  stonApiClient.queryAssets({ condition: LIQUIDITY_CONDITION });
