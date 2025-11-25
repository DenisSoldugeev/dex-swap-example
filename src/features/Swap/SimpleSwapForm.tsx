import { useState, useMemo } from "react";
import { useMutation } from "@tanstack/react-query";
import { useTonConnect } from "@/shared/ton/useTonConnect";
import { useConsoleLogger } from "@/features/Console/useConsoleLogger";
import {
  buildSwapTransaction,
  getSwapQuote,
  type SwapConfig,
  type SwapQuote,
} from "@/shared/api/stonfiSwap";
import styles from "./SwapForm.module.scss";

const TON_ADDRESS = "EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c";
const USDT_ADDRESS = "EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs"; // jUSDT on mainnet

type TokenType = "TON" | "USDT";

const FIVE_MINUTES = 5 * 60;

const formatUnits = (value: bigint, decimals: number) => {
  const raw = value.toString();
  if (decimals === 0) return raw;
  const padded = raw.padStart(decimals + 1, "0");
  const integer = padded.slice(0, -decimals) || "0";
  const fraction = padded.slice(-decimals).replace(/0+$/, "");
  return fraction ? `${integer}.${fraction}` : integer;
};

const SimpleSwapForm = () => {
  const [fromToken, setFromToken] = useState<TokenType>("TON");
  const [toToken, setToToken] = useState<TokenType>("USDT");
  const [amountIn, setAmountIn] = useState<string>("1");
  const [quote, setQuote] = useState<SwapQuote | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { walletAddress, isConnected, sendTransaction } = useTonConnect();
  const { addLog } = useConsoleLogger();

  const config: SwapConfig = useMemo(
    () => ({
      offerMinter: fromToken === "TON" ? TON_ADDRESS : USDT_ADDRESS,
      askMinter: toToken === "TON" ? TON_ADDRESS : USDT_ADDRESS,
      offerDecimals: fromToken === "TON" ? 9 : 6,
      askDecimals: toToken === "TON" ? 9 : 6,
    }),
    [fromToken, toToken],
  );

  const numericAmount = useMemo(() => Number(amountIn), [amountIn]);
  const isAmountValid = Number.isFinite(numericAmount) && numericAmount > 0;

  const handleSwapTokens = () => {
    setFromToken(toToken);
    setToToken(fromToken);
    setQuote(null);
    addLog("info", `Swapped token direction: ${toToken} → ${fromToken}`);
  };

  const quoteMutation = useMutation({
    mutationFn: async () => {
      if (!isAmountValid) throw new Error("Enter amount > 0");
      addLog("info", `Requesting quote for ${numericAmount} ${fromToken}...`);
      const q = await getSwapQuote(config, numericAmount);
      setQuote(q);
      const expectedOut = formatUnits(q.expectedOut, config.askDecimals);
      addLog(
        "success",
        `Quote received: ${numericAmount} ${fromToken} ≈ ${expectedOut} ${toToken}`,
      );
      return q;
    },
    onError: (e) => {
      const message = e instanceof Error ? e.message : "Failed to get quote";
      setError(message);
      addLog("error", `Quote failed: ${message}`);
    },
  });

  const swapMutation = useMutation({
    mutationFn: async () => {
      if (!walletAddress) throw new Error("Connect wallet first");
      if (!isAmountValid) throw new Error("Enter amount > 0");

      addLog(
        "info",
        `Initiating swap: ${numericAmount} ${fromToken} → ${toToken}`,
      );

      const currentQuote: SwapQuote =
        quote ?? (await getSwapQuote(config, numericAmount));
      if (!quote) {
        setQuote(currentQuote);
        addLog("info", "Quote fetched automatically");
      }

      const tx = await buildSwapTransaction(
        walletAddress,
        numericAmount,
        currentQuote.minOut,
        config,
      );

      addLog("info", "Transaction prepared. Waiting for user confirmation...");

      await sendTransaction({
        validUntil: Math.floor(Date.now() / 1000) + FIVE_MINUTES,
        messages: [
          {
            address: tx.to,
            amount: tx.value,
            payload: tx.data,
          },
        ],
      });

      addLog("success", "Transaction sent successfully!");
      setQuote(null);
      setAmountIn("1");
    },
    onError: (e) => {
      const message = e instanceof Error ? e.message : "Swap failed";
      setError(message);
      addLog("error", `Swap failed: ${message}`);
    },
  });

  return (
    <div className={styles.form}>
      <div className={styles.inputGroup}>
        <div className={styles.label}>From</div>
        <div className={styles.tokenSelector}>
          <button
            type="button"
            className={`${styles.tokenButton} ${fromToken === "TON" ? styles.active : ""}`}
            onClick={() => {
              setFromToken("TON");
              setToToken("USDT");
              setQuote(null);
            }}
          >
            TON
          </button>
          <button
            type="button"
            className={`${styles.tokenButton} ${fromToken === "USDT" ? styles.active : ""}`}
            onClick={() => {
              setFromToken("USDT");
              setToToken("TON");
              setQuote(null);
            }}
          >
            USDT
          </button>
        </div>
      </div>

      <div className={styles.inputGroup}>
        <div className={styles.label}>Amount</div>
        <input
          type="number"
          className={styles.input}
          value={amountIn}
          onChange={(e) => {
            setAmountIn(e.target.value);
            setQuote(null);
            setError(null);
          }}
          placeholder="0.0"
          min="0"
          step="0.1"
        />
      </div>

      <div className={styles.swapIcon}>⇅</div>

      <div className={styles.inputGroup}>
        <div className={styles.label}>To</div>
        <div className={styles.tokenSelector}>
          <button
            type="button"
            className={`${styles.tokenButton} ${toToken === "TON" ? styles.active : ""}`}
            disabled
          >
            TON
          </button>
          <button
            type="button"
            className={`${styles.tokenButton} ${toToken === "USDT" ? styles.active : ""}`}
            disabled
          >
            USDT
          </button>
        </div>
      </div>

      {quote && (
        <div className={styles.quoteBox}>
          <div className={styles.quoteTitle}>Quote</div>
          <div className={styles.quoteRow}>
            <span className={styles.quoteLabel}>Expected out:</span>
            <span className={styles.quoteValue}>
              {formatUnits(quote.expectedOut, config.askDecimals)} {toToken}
            </span>
          </div>
          <div className={styles.quoteRow}>
            <span className={styles.quoteLabel}>Min out (0.5%):</span>
            <span className={styles.quoteValue}>
              {formatUnits(quote.minOut, config.askDecimals)} {toToken}
            </span>
          </div>
        </div>
      )}

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.actions}>
        <button
          type="button"
          className={styles.button}
          onClick={() => quoteMutation.mutate()}
          disabled={quoteMutation.isPending || !isAmountValid}
        >
          {quoteMutation.isPending ? "Loading..." : "Get Quote"}
        </button>
        <button
          type="button"
          className={`${styles.button} ${styles.primary}`}
          onClick={() => swapMutation.mutate()}
          disabled={!isConnected || !isAmountValid || swapMutation.isPending}
        >
          {swapMutation.isPending ? "Processing..." : "Swap"}
        </button>
      </div>
    </div>
  );
};

export default SimpleSwapForm;
