import { useState, useMemo, useEffect } from "react";
import {
  Stack,
  Button,
  Group,
  NumberInput,
  Text,
  Paper,
  Alert,
  Select,
  ActionIcon,
  Center,
  Loader,
} from "@mantine/core";
import { IconArrowsExchange } from "@tabler/icons-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { StonApiClient, AssetTag } from "@ston-fi/api";
import { useTonConnect } from "@/shared/ton/useTonConnect";
import { useConsoleLogger } from "@/features/Console/useConsoleLogger";
import {
  buildSwapTransaction,
  getSwapQuote,
  type SwapConfig,
} from "@/shared/api/stonfiSwap";

const FIVE_MINUTES = 5 * 60;

// Fetch assets with high/medium liquidity
const fetchAssets = async () => {
  const client = new StonApiClient();
  const condition = [
    AssetTag.LiquidityVeryHigh,
    AssetTag.LiquidityHigh,
    AssetTag.LiquidityMedium,
  ].join(" | ");
  return client.queryAssets({ condition });
};

const formatUnits = (value: bigint, decimals: number) => {
  const raw = value.toString();
  if (decimals === 0) return raw;
  const padded = raw.padStart(decimals + 1, "0");
  const integer = padded.slice(0, -decimals) || "0";
  const fraction = padded.slice(-decimals).replace(/0+$/, "");
  return fraction ? `${integer}.${fraction}` : integer;
};

const SimpleSwapForm = () => {
  const [fromAssetAddress, setFromAssetAddress] = useState<string>("");
  const [toAssetAddress, setToAssetAddress] = useState<string>("");
  const [amountIn, setAmountIn] = useState<string | number>(1);
  const [error, setError] = useState<string | null>(null);
  const [simulationResult, setSimulationResult] = useState<any>(null);

  const { walletAddress, isConnected, sendTransaction } = useTonConnect();
  const { addLog } = useConsoleLogger();

  // Fetch assets query
  const {
    data: assets = [],
    isLoading: assetsLoading,
    error: assetsError,
  } = useQuery({
    queryKey: ["assets"],
    queryFn: fetchAssets,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Set default assets when loaded
  useEffect(() => {
    if (assets.length > 0 && !fromAssetAddress && !toAssetAddress) {
      setFromAssetAddress(assets[0].contractAddress);
      if (assets[1]) {
        setToAssetAddress(assets[1].contractAddress);
      }
      addLog("info", `Loaded ${assets.length} assets from STON.fi`);
    }
  }, [assets, fromAssetAddress, toAssetAddress, addLog]);

  // Find selected assets
  const fromAsset = useMemo(
    () => assets.find((a) => a.contractAddress === fromAssetAddress),
    [assets, fromAssetAddress],
  );

  const toAsset = useMemo(
    () => assets.find((a) => a.contractAddress === toAssetAddress),
    [assets, toAssetAddress],
  );

  // Build swap config
  const config: SwapConfig = useMemo(() => {
    if (!fromAsset || !toAsset) {
      return {
        offerMinter: "",
        askMinter: "",
        offerDecimals: 9,
        askDecimals: 9,
      };
    }

    return {
      offerMinter: fromAsset.contractAddress,
      askMinter: toAsset.contractAddress,
      offerDecimals: fromAsset.meta?.decimals ?? 9,
      askDecimals: toAsset.meta?.decimals ?? 9,
    };
  }, [fromAsset, toAsset]);

  const numericAmount = useMemo(() => Number(amountIn), [amountIn]);
  const isAmountValid = Number.isFinite(numericAmount) && numericAmount > 0;

  // Get asset display name
  const getAssetLabel = (asset: typeof assets[0]) => {
    return asset.meta?.symbol || asset.meta?.displayName || "Token";
  };

  const handleSwapTokens = () => {
    const temp = fromAssetAddress;
    setFromAssetAddress(toAssetAddress);
    setToAssetAddress(temp);
    setSimulationResult(null);
    addLog("info", "Swapped token direction");
  };

  // Simulate swap
  const handleSimulate = async () => {
    if (!fromAsset || !toAsset || !isAmountValid) {
      setError("Please select tokens and enter valid amount");
      return;
    }

    try {
      setError(null);
      addLog("info", `Simulating swap: ${numericAmount} ${getAssetLabel(fromAsset)} → ${getAssetLabel(toAsset)}`);

      const client = new StonApiClient();
      const fromDecimals = 10 ** (fromAsset.meta?.decimals ?? 9);

      // Convert amount to blockchain units
      const offerUnits = (numericAmount * fromDecimals).toString();

      const result = await client.simulateSwap({
        offerAddress: fromAsset.contractAddress,
        askAddress: toAsset.contractAddress,
        slippageTolerance: "0.01", // 1% slippage
        offerUnits,
      });

      setSimulationResult(result);

      const toDecimals = 10 ** (toAsset.meta?.decimals ?? 9);
      const expectedOut = (Number(result.askUnits) / toDecimals).toFixed(4);

      addLog("success", `Simulation: ${numericAmount} ${getAssetLabel(fromAsset)} → ${expectedOut} ${getAssetLabel(toAsset)}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Simulation failed";
      setError(message);
      setSimulationResult(null);
      addLog("error", `Simulation failed: ${message}`);
    }
  };

  // Swap mutation
  const swapMutation = useMutation({
    mutationFn: async () => {
      if (!walletAddress) throw new Error("Connect wallet first");
      if (!isAmountValid) throw new Error("Enter amount > 0");
      if (!fromAsset || !toAsset) throw new Error("Select tokens");

      addLog(
        "info",
        `Initiating swap: ${numericAmount} ${getAssetLabel(fromAsset)} → ${getAssetLabel(toAsset)}`,
      );

      // Get quote
      const quote = await getSwapQuote(config, numericAmount);
      const expectedOut = formatUnits(quote.expectedOut, config.askDecimals);
      addLog(
        "success",
        `Quote: ${numericAmount} ${getAssetLabel(fromAsset)} ≈ ${expectedOut} ${getAssetLabel(toAsset)}`,
      );

      // Build transaction
      const tx = await buildSwapTransaction(
        walletAddress,
        numericAmount,
        quote.minOut,
        config,
      );

      addLog("info", "Transaction prepared. Awaiting confirmation...");

      // Send transaction
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
      setAmountIn(1);
    },
    onError: (e) => {
      const message = e instanceof Error ? e.message : "Swap failed";
      setError(message);
      addLog("error", `Swap failed: ${message}`);
    },
  });

  if (assetsLoading) {
    return (
      <Stack align="center" gap="md" py="xl">
        <Loader color="terminalGreen" size="lg" />
        <Text c="dimmed" size="sm">
          Loading assets...
        </Text>
      </Stack>
    );
  }

  if (assetsError) {
    return (
      <Alert color="red" title="Error loading assets">
        {assetsError instanceof Error ? assetsError.message : "Unknown error"}
      </Alert>
    );
  }

  return (
    <Stack gap="lg">
      {/* From Asset Selector */}
      <Select
        label={
          <Text size="sm" fw={600} c="terminalGreen.5" tt="uppercase">
            &gt; From
          </Text>
        }
        placeholder="Select token"
        value={fromAssetAddress}
        onChange={(value) => {
          setFromAssetAddress(value || "");
          setError(null);
          setSimulationResult(null);
        }}
        data={assets.map((asset) => ({
          value: asset.contractAddress,
          label: getAssetLabel(asset),
        }))}
        searchable
        size="md"
      />

      {/* Amount Input */}
      <NumberInput
        label={
          <Text size="sm" fw={600} c="terminalGreen.5" tt="uppercase">
            &gt; Amount
          </Text>
        }
        value={amountIn}
        onChange={(val) => {
          setAmountIn(val);
          setError(null);
          setSimulationResult(null);
        }}
        min={0}
        step={0.1}
        decimalScale={6}
        placeholder="0.0"
        size="md"
        rightSection={
          fromAsset && (
            <Text size="sm" c="dimmed">
              {getAssetLabel(fromAsset)}
            </Text>
          )
        }
        rightSectionWidth={80}
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

      {/* To Asset Selector */}
      <Select
        label={
          <Text size="sm" fw={600} c="terminalGreen.5" tt="uppercase">
            &gt; To
          </Text>
        }
        placeholder="Select token"
        value={toAssetAddress}
        onChange={(value) => {
          setToAssetAddress(value || "");
          setError(null);
          setSimulationResult(null);
        }}
        data={assets.map((asset) => ({
          value: asset.contractAddress,
          label: getAssetLabel(asset),
        }))}
        searchable
        size="md"
      />

      {/* Simulation Result */}
      {simulationResult && toAsset && (
        <Paper bg="terminalDark.5" withBorder p="md">
          <Stack gap="xs">
            <Text size="sm" c="cyan" fw={700} tt="uppercase" ta="center">
              [ Swap Summary ]
            </Text>
            <Group justify="center" gap="sm">
              <Text size="lg" fw={700} c="terminalGreen.5">
                {numericAmount} {getAssetLabel(fromAsset!)}
              </Text>
              <Text c="dimmed">→</Text>
              <Text size="lg" fw={700} c="terminalGreen.5">
                {(Number(simulationResult.askUnits) / 10 ** (toAsset.meta?.decimals ?? 9)).toFixed(4)}{" "}
                {getAssetLabel(toAsset)}
              </Text>
            </Group>
            <Text size="xs" c="dimmed" ta="center">
              Slippage tolerance: 1%
            </Text>
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
          color="cyan"
          size="lg"
          onClick={handleSimulate}
          disabled={!isAmountValid || !fromAsset || !toAsset}
        >
          Simulate
        </Button>
        <Button
          variant="filled"
          color="terminalGreen"
          size="lg"
          onClick={() => swapMutation.mutate()}
          loading={swapMutation.isPending}
          disabled={!isConnected || !isAmountValid || !fromAsset || !toAsset}
        >
          Swap
        </Button>
      </Group>
    </Stack>
  );
};

export default SimpleSwapForm;
