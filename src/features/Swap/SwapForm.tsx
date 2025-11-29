import {
    buildSwapTransaction,
    DEFAULT_SWAP_CONFIG,
    getSwapQuote,
    type SwapConfig,
    type SwapQuote,
} from "@/shared/api/stonfiSwap.ts";
import {useTonConnect} from "@/shared/ton/useTonConnect.ts";
import {Alert, Button, Group, NumberInput, Stack, Text, TextInput,} from "@mantine/core";
import {useMutation} from "@tanstack/react-query";
import {useMemo, useState} from "react";

const FIVE_MINUTES = 5 * 60;

const formatUnits = (value: bigint, decimals: number) => {
  const raw = value.toString();
  if (decimals === 0) return raw;
  const padded = raw.padStart(decimals + 1, "0");
  const integer = padded.slice(0, -decimals);
  const fraction = padded.slice(-decimals).replace(/0+$/, "");
  return fraction ? `${integer}.${fraction}` : integer;
};

const SwapForm = () => {
  const [config, setConfig] = useState<SwapConfig>(DEFAULT_SWAP_CONFIG);
  const [amountIn, setAmountIn] = useState<string>("1");
  const [quote, setQuote] = useState<SwapQuote | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { walletAddress, isConnected, sendTransaction } = useTonConnect();

  const numericAmount = useMemo(() => Number(amountIn), [amountIn]);
  const isAmountValid = Number.isFinite(numericAmount) && numericAmount > 0;

  const ensureConfigIsFilled = () => {
    if (!config.offerMinter || !config.askMinter) {
      throw new Error("Please specify jetton minter addresses for offer and ask");
    }
    if (config.offerDecimals < 0 || config.askDecimals < 0) {
      throw new Error("Decimals cannot be negative");
    }
  };

  const quoteMutation = useMutation({
    mutationFn: async () => {
      ensureConfigIsFilled();
      if (!isAmountValid) throw new Error("Enter amount > 0");
      const q = await getSwapQuote(config, numericAmount);
      setQuote(q);
      return q;
    },
    onError: (e) =>
      setError(
        e instanceof Error ? e.message : "Failed to get quote",
      ),
  });

  const swapMutation = useMutation({
    mutationFn: async () => {
      ensureConfigIsFilled();
      if (!walletAddress) throw new Error("Please connect wallet first");
      if (!isAmountValid) throw new Error("Enter amount > 0");

      const currentQuote: SwapQuote =
        quote ?? (await getSwapQuote(config, numericAmount));
      if (!quote) setQuote(currentQuote);

      const tx = await buildSwapTransaction(
        walletAddress,
        numericAmount,
        currentQuote.minOut,
        config,
      );

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
    },
    onError: (e) =>
      setError(e instanceof Error ? e.message : "Swap failed"),
  });

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <Text fw={700}>STON.fi Router</Text>
      </Group>

      <TextInput
        label="Offer jetton minter (we give)"
        value={config.offerMinter}
        onChange={(e) =>
          setConfig((prev) => ({ ...prev, offerMinter: e.currentTarget.value }))
        }
      />
      <NumberInput
        label="Offer decimals"
        value={config.offerDecimals}
        onChange={(v) =>
          setConfig((prev) => ({
            ...prev,
            offerDecimals: typeof v === "number" ? v : prev.offerDecimals,
          }))
        }
        min={0}
        step={1}
      />

      <TextInput
        label="Ask jetton minter (we receive)"
        value={config.askMinter}
        onChange={(e) =>
          setConfig((prev) => ({ ...prev, askMinter: e.currentTarget.value }))
        }
      />
      <NumberInput
        label="Ask decimals"
        value={config.askDecimals}
        onChange={(v) =>
          setConfig((prev) => ({
            ...prev,
            askDecimals: typeof v === "number" ? v : prev.askDecimals,
          }))
        }
        min={0}
        step={1}
      />

      <NumberInput
        label="Amount (in offer token)"
        value={amountIn}
        onChange={(v) => setAmountIn(v === null ? "" : String(v))}
        min={0}
        step={0.1}
        thousandSeparator=" "
      />

      <Group gap="sm">
        <Button
          onClick={() => quoteMutation.mutate()}
          loading={quoteMutation.isPending}
        >
          Get quote
        </Button>
        <Button
          variant="filled"
          disabled={!isConnected || !isAmountValid}
          onClick={() => swapMutation.mutate()}
          loading={swapMutation.isPending}
        >
          Swap
        </Button>
      </Group>

      {quote && (
        <Alert color="blue" title="Quote">
          <Text>
            Expected out: {formatUnits(quote.expectedOut, config.askDecimals)}{" "}
            (raw {quote.expectedOut.toString()})
          </Text>
          <Text>
            Min out (0.5% slippage):{" "}
            {formatUnits(quote.minOut, config.askDecimals)} (raw{" "}
            {quote.minOut.toString()})
          </Text>
        </Alert>
      )}

      {(quoteMutation.isPending || swapMutation.isPending) && (
        <Text>Processing...</Text>
      )}

      {error && (
        <Alert
          color="red"
          title="Error"
          onClose={() => setError(null)}
          closeButtonLabel="Close"
          withCloseButton
        >
          {error}
        </Alert>
      )}
    </Stack>
  );
};

export default SwapForm;
