import { useState, useMemo } from "react";
import {
  Stack,
  Button,
  Group,
  NumberInput,
  Text,
  Paper,
  Alert,
  SegmentedControl,
  ActionIcon,
  Center,
} from "@mantine/core";
import { IconArrowsExchange } from "@tabler/icons-react";
import { useMutation } from "@tanstack/react-query";
import { useTonConnect } from "@/shared/ton/useTonConnect";
import { useConsoleLogger } from "@/features/Console/useConsoleLogger";
import {
  buildSwapTransaction,
  getSwapQuote,
  type SwapConfig,
  type SwapQuote,
} from "@/shared/api/stonfiSwap";

const TON_ADDRESS = "EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c";
const USDT_ADDRESS = "EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs";

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
  const [amountIn, setAmountIn] = useState<string | number>(1);
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
    addLog("info", `Swapped direction: ${toToken} → ${fromToken}`);
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
        `Quote: ${numericAmount} ${fromToken} ≈ ${expectedOut} ${toToken}`,
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

      addLog("info", `Initiating swap: ${numericAmount} ${fromToken} → ${toToken}`);

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

      addLog("info", "Transaction prepared. Awaiting confirmation...");

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
      setAmountIn(1);
    },
    onError: (e) => {
      const message = e instanceof Error ? e.message : "Swap failed";
      setError(message);
      addLog("error", `Swap failed: ${message}`);
    },
  });

  return (
    <Stack gap="lg">
      {/* From Token Selector */}
      <Stack gap="xs">
        <Text size="sm" fw={600} c="terminalGreen.5" tt="uppercase">
          &gt; From
        </Text>
        <SegmentedControl
          value={fromToken}
          onChange={(value) => {
            setFromToken(value as TokenType);
            setToToken(value === "TON" ? "USDT" : "TON");
            setQuote(null);
          }}
          data={[
            { label: "TON", value: "TON" },
            { label: "USDT", value: "USDT" },
          ]}
          color="terminalGreen"
          fullWidth
        />
      </Stack>

      {/* Amount Input */}
      <NumberInput
        label={
          <Text size="sm" fw={600}  tt="uppercase">
            &gt; Amount
          </Text>
        }
        value={amountIn}
        onChange={(val) => {
          setAmountIn(val);
          setQuote(null);
          setError(null);
        }}
        min={0}
        step={0.1}
        decimalScale={6}
        placeholder="0.0"
        size="md"
        bg={'transparent'}
      />

      {/* Swap Direction Indicator */}
      <Center>
        <ActionIcon
          variant="outline"
          color="cyan"
          size="xl"
          radius="xl"
          onClick={handleSwapTokens}
          aria-label="Swap tokens"
        >
          <IconArrowsExchange size={24} stroke={2} />
        </ActionIcon>
      </Center>

      {/* To Token Display */}
      <Stack gap="xs">
        <Text size="sm" fw={600} c="terminalGreen.5" tt="uppercase">
          &gt; To
        </Text>
        <SegmentedControl
          value={toToken}
          data={[
            { label: "TON", value: "TON" },
            { label: "USDT", value: "USDT" },
          ]}
          color="terminalGreen"
          fullWidth
          disabled
        />
      </Stack>

      {/* Quote Display */}
      {quote && (
        <Paper bg="terminalDark.5" withBorder>
          <Stack gap="xs">
            <Text size="sm" c="cyan" fw={700} tt="uppercase">
              [ Quote ]
            </Text>
            <Group justify="space-between">
              <Text size="sm" c="dimmed">
                Expected out:
              </Text>
              <Text size="sm" c="terminalGreen.5" fw={600}>
                {formatUnits(quote.expectedOut, config.askDecimals)} {toToken}
              </Text>
            </Group>
            <Group justify="space-between">
              <Text size="sm" c="dimmed">
                Min out (0.5%):
              </Text>
              <Text size="sm" c="terminalGreen.5" fw={600}>
                {formatUnits(quote.minOut, config.askDecimals)} {toToken}
              </Text>
            </Group>
          </Stack>
        </Paper>
      )}

      {/* Error Display */}
      {error && (
        <Alert color="red" title="⚠ ERROR" onClose={() => setError(null)} withCloseButton>
          {error}
        </Alert>
      )}

      {/* Action Buttons */}
      <Group grow>
        <Button
          variant="outline"
          color="terminalGreen"
          onClick={() => quoteMutation.mutate()}
          loading={quoteMutation.isPending}
          disabled={!isAmountValid}
        >
          Get Quote
        </Button>
        <Button
          variant="filled"
          color="terminalGreen"
          onClick={() => swapMutation.mutate()}
          loading={swapMutation.isPending}
          disabled={!isConnected || !isAmountValid}
        >
          Swap
        </Button>
      </Group>
    </Stack>
  );
};

export default SimpleSwapForm;
