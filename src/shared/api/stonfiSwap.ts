import { beginCell, Address, TonClient4 } from "@ton/ton";
import { DEX } from "@ston-fi/sdk";

// Mainnet HTTP endpoint; replace with your reliable provider if needed.
const client = new TonClient4({ endpoint: "https://mainnet-v4.tonhubapi.com" });

const router = new DEX.v1.Router();
const routerProvider = client.provider(router.address);

export type SwapConfig = {
  offerMinter: string;
  askMinter: string;
  offerDecimals: number;
  askDecimals: number;
};

// Default pair for manual form; override in UI as needed.
export const DEFAULT_SWAP_CONFIG: SwapConfig = {
  offerMinter: "EQCjDWk_lny7JRjzfD0CYR9eLj9S1bNs7oKgPIsENcYIu5cJ", // STON
  askMinter: "EQCWNM6CTi7d4zJFqeSa9u_oB0te_AKLi6dOa_8uTrX1FIJQ", // jUSDT
  offerDecimals: 9,
  askDecimals: 6,
};

const toUnits = (amount: number, decimals: number) =>
  BigInt(Math.round(amount * 10 ** decimals));

const applySlippage = (value: bigint, bps: number) =>
  (value * BigInt(10_000 - bps)) / BigInt(10_000);

const getJettonWalletAddress = async (jettonMinter: string, owner: Address) => {
  const provider = client.provider(Address.parse(jettonMinter));
  const result = await provider.get("get_wallet_address", [
    { type: "slice", cell: beginCell().storeAddress(owner).endCell() },
  ]);
  return result.stack.readAddress();
};

export interface SwapQuote {
  expectedOut: bigint;
  minOut: bigint;
}

export const getSwapQuote = async (
  config: SwapConfig,
  amountIn: number,
): Promise<SwapQuote> => {
  const { offerMinter, askMinter, offerDecimals } = config;

  const offerAmount = toUnits(amountIn, offerDecimals);
  const pool = await router.getPool(routerProvider, {
    token0: offerMinter,
    token1: askMinter,
  });
  const poolProvider = client.provider(pool.address);

  // Jetton wallet owned by router for the token we are selling
  const offerRouterWallet = await getJettonWalletAddress(
    offerMinter,
    router.address,
  );

  const { jettonToReceive } = await pool.getExpectedOutputs(poolProvider, {
    amount: offerAmount,
    jettonWallet: offerRouterWallet,
  });

  const minOut = applySlippage(jettonToReceive, 50); // 0.5% slippage

  return {
    expectedOut: jettonToReceive,
    minOut,
  };
};

export const buildSwapTransaction = async (
  userAddress: string,
  amountIn: number,
  minAmountOut: bigint,
  config: SwapConfig,
) => {
  const { offerMinter, askMinter, offerDecimals } = config;

  const offerAmount = toUnits(amountIn, offerDecimals);

  const tx = await router.getSwapJettonToJettonTxParams(routerProvider, {
    userWalletAddress: userAddress,
    offerJettonAddress: offerMinter,
    askJettonAddress: askMinter,
    offerAmount,
    minAskAmount: minAmountOut,
  });

  return {
    to: tx.to.toString(),
    value: tx.value.toString(),
    data: tx.body?.toBoc().toString("base64"),
  };
};
