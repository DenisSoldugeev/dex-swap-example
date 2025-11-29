import {getRouterContracts, stonApiClient} from './clients';

export type StonAsset = Awaited<
  ReturnType<typeof stonApiClient.queryAssets>
>[number];

export interface SwapSimulationRequest {
  offer: StonAsset;
  ask: StonAsset;
  amount: number; // human-readable amount
  slippageTolerance?: string; // e.g. "0.01"
  referralAddress?: string;
  referralFeeBps?: number | string;
}

export interface SwapSimulationResult extends Awaited<
  ReturnType<typeof stonApiClient.simulateSwap>
> {
  offerDecimals: number;
  askDecimals: number;
}

type RouterContract = ReturnType<typeof getRouterContracts>['router'];
type RouterSwapParams = Awaited<
  ReturnType<RouterContract['getSwapJettonToJettonTxParams']>
>;

export interface SwapTxParams {
  to: string;
  value: string;
  payload?: string;
  raw: RouterSwapParams;
}

const toUnits = (amount: number, decimals: number) =>
  BigInt(Math.round(amount * 10 ** decimals)).toString();

export const simulateSwap = async ({
  offer,
  ask,
  amount,
  slippageTolerance = '0.01',
  referralAddress,
  referralFeeBps,
}: SwapSimulationRequest): Promise<SwapSimulationResult> => {
  const offerDecimals = offer.meta?.decimals ?? 9;
  const askDecimals = ask.meta?.decimals ?? 9;
  const offerUnits = toUnits(amount, offerDecimals);
  const referralFee =
    typeof referralFeeBps === 'number' ? referralFeeBps.toString() : referralFeeBps;

  const result = await stonApiClient.simulateSwap({
    offerAddress: offer.contractAddress,
    askAddress: ask.contractAddress,
    offerUnits,
    slippageTolerance,
    referralAddress,
    referralFeeBps: referralFee,
  });

  return {
    ...result,
    offerDecimals,
    askDecimals,
  };
};

export const buildSwapTx = async (
  simulation: SwapSimulationResult,
  userAddress: string,
  offerKind: StonAsset['kind'],
  askKind: StonAsset['kind'],
): Promise<SwapTxParams> => {
  const { router, proxyTon } = getRouterContracts(simulation.router);
  const shared = {
    userWalletAddress: userAddress,
    offerAmount: simulation.offerUnits,
    minAskAmount: simulation.minAskUnits,
  };

  if (offerKind === 'Ton' && askKind === 'Ton') {
    throw new Error('TON to TON swap is not supported');
  }

  const swapParams =
    offerKind === 'Ton'
      ? await router.getSwapTonToJettonTxParams({
          ...shared,
          proxyTon,
          askJettonAddress: simulation.askAddress,
        })
      : askKind === 'Ton'
        ? await router.getSwapJettonToTonTxParams({
            ...shared,
            proxyTon,
            offerJettonAddress: simulation.offerAddress,
          })
        : await router.getSwapJettonToJettonTxParams({
            ...shared,
            offerJettonAddress: simulation.offerAddress,
            askJettonAddress: simulation.askAddress,
          });

  return {
    to: swapParams.to.toString(),
    value: swapParams.value.toString(),
    payload: swapParams.body?.toBoc().toString('base64'),
    raw: swapParams,
  };
};

export const toTonConnectMessage = (tx: SwapTxParams) => ({
  address: tx.to,
  amount: tx.value,
  payload: tx.payload,
});
