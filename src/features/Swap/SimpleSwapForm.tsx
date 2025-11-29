import {useConsoleLogger} from "@/features/Console/useConsoleLogger";
import {REFERRAL_CONFIG} from "@/shared/config/referral";
import {
    ActionIcon,
    Alert,
    Avatar,
    Button,
    Center,
    Group,
    Loader,
    NumberInput,
    Select,
    Stack,
    Text,
} from "@mantine/core";
import {AssetTag, StonApiClient} from "@ston-fi/api";
import {Client, dexFactory} from "@ston-fi/sdk";
import {IconArrowsExchange} from "@tabler/icons-react";
import {useQuery} from "@tanstack/react-query";
import {Cell} from "@ton/core";
import {useTonAddress, useTonConnectUI} from "@tonconnect/ui-react";
import {useEffect, useMemo, useState} from "react";
import SwapSimulationDetails from "./SwapSimulationDetails";

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

const SimpleSwapForm = () => {
  const [fromAssetAddress, setFromAssetAddress] = useState<string>("");
  const [toAssetAddress, setToAssetAddress] = useState<string>("");
  const [amountIn, setAmountIn] = useState<string | number>(1);
  const [error, setError] = useState<string | null>(null);
  const [simulationResult, setSimulationResult] = useState<any>(null);
  const [isSwapping, setIsSwapping] = useState(false);

  const [tonConnectUI] = useTonConnectUI();
  const userAddress = useTonAddress();
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

  // Log assets loaded
  useEffect(() => {
    if (assets.length > 0) {
      addLog("info", `Loaded ${assets.length} assets from STON.fi`);
    }
  }, [assets, addLog]);

  // Find selected assets
  const fromAsset = useMemo(
    () => assets.find((a) => a.contractAddress === fromAssetAddress),
    [assets, fromAssetAddress],
  );

  const toAsset = useMemo(
    () => assets.find((a) => a.contractAddress === toAssetAddress),
    [assets, toAssetAddress],
  );

  const numericAmount = useMemo(() => Number(amountIn), [amountIn]);
  const isAmountValid = Number.isFinite(numericAmount) && numericAmount > 0;
  const isConnected = Boolean(userAddress);

  // Get asset display name
  const getAssetLabel = (asset: (typeof assets)[0]) => {
    return asset.meta?.symbol || asset.meta?.displayName || "Token";
  };

  // Auto-simulate when all parameters are ready
  useEffect(() => {
    if (!fromAsset || !toAsset || !isAmountValid) {
      setSimulationResult(null);
      return;
    }

    const simulateTimeout = setTimeout(async () => {
      try {
        setError(null);
        addLog("info", `Auto-simulating: ${numericAmount} ${getAssetLabel(fromAsset)} → ${getAssetLabel(toAsset)}`);

        const client = new StonApiClient();
        const fromDecimals = 10 ** (fromAsset.meta?.decimals ?? 9);
        const offerUnits = (numericAmount * fromDecimals).toString();

        const result = await client.simulateSwap({
          offerAddress: fromAsset.contractAddress,
          askAddress: toAsset.contractAddress,
          slippageTolerance: "0.01",
          offerUnits,
          referralAddress: REFERRAL_CONFIG.referrerAddress,
          referralFeeBps: REFERRAL_CONFIG.referrerFeeBps,
        });

        setSimulationResult(result);

        const toDecimals = 10 ** (toAsset.meta?.decimals ?? 9);
        const expectedOut = (Number(result.askUnits) / toDecimals).toFixed(4);
        addLog("success", `Expected: ${expectedOut} ${getAssetLabel(toAsset)}`);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Auto-simulation failed";
        setSimulationResult(null);
        addLog("warning", `Auto-simulation: ${message}`);
      }
    }, 500); // Debounce 500ms

    return () => clearTimeout(simulateTimeout);
  }, [fromAsset, toAsset, numericAmount, isAmountValid, addLog]);

  const handleSwapTokens = () => {
    const temp = fromAssetAddress;
    setFromAssetAddress(toAssetAddress);
    setToAssetAddress(temp);
    setSimulationResult(null);
    addLog("info", "Swapped token direction");
  };

  // Main swap function with auto-simulation
  const handleSwap = async () => {
    if (!fromAsset || !toAsset || !isAmountValid) {
      setError("Please select tokens and enter valid amount");
      return;
    }

    if (!userAddress) {
      setError("Please connect wallet first");
      return;
    }

    setIsSwapping(true);
    setError(null);

    try {
      // 1. Simulate swap first
      addLog("info", `Simulating swap: ${numericAmount} ${getAssetLabel(fromAsset)} → ${getAssetLabel(toAsset)}`);

      const client = new StonApiClient();
      const fromDecimals = 10 ** (fromAsset.meta?.decimals ?? 9);
      const offerUnits = (numericAmount * fromDecimals).toString();

      const result = await client.simulateSwap({
        offerAddress: fromAsset.contractAddress,
        askAddress: toAsset.contractAddress,
        slippageTolerance: "0.01",
        offerUnits,
        // Referral parameters for earning fees
        referralAddress: REFERRAL_CONFIG.referrerAddress,
        referralFeeBps: REFERRAL_CONFIG.referrerFeeBps,
      });

      setSimulationResult(result);

      const toDecimals = 10 ** (toAsset.meta?.decimals ?? 9);
      const expectedOut = (Number(result.askUnits) / toDecimals).toFixed(4);
      addLog("success", `Simulation: ${numericAmount} ${getAssetLabel(fromAsset)} → ${expectedOut} ${getAssetLabel(toAsset)}`);

      // 2. Initialize TON JSON-RPC client
      const tonApiClient = new Client({
        endpoint: "https://toncenter.com/api/v2/jsonRPC",
      });

      // 3. Use the embedded router info from the simulation result
      const routerInfo = result.router;
      const dexContracts = dexFactory(routerInfo);
      const router = tonApiClient.open(
        dexContracts.Router.create(routerInfo.address)
      );
      const proxyTon = dexContracts.pTON.create(routerInfo.ptonMasterAddress);

      // 4. Prepare common transaction parameters
      const sharedTxParams = {
        userWalletAddress: userAddress,
        offerAmount: result.offerUnits,
        minAskAmount: result.minAskUnits,
      };

      // 5. Determine swap type and get transaction parameters
      const getSwapParams = () => {
        // TON -> Jetton
        if (fromAsset.kind === 'Ton') {
          return router.getSwapTonToJettonTxParams({
            ...sharedTxParams,
            proxyTon,
            askJettonAddress: result.askAddress,
          });
        }
        // Jetton -> TON
        if (toAsset.kind === 'Ton') {
          return router.getSwapJettonToTonTxParams({
            ...sharedTxParams,
            proxyTon,
            offerJettonAddress: result.offerAddress,
          });
        }
        // Jetton -> Jetton
        return router.getSwapJettonToJettonTxParams({
          ...sharedTxParams,
          offerJettonAddress: result.offerAddress,
          askJettonAddress: result.askAddress,
        });
      };

      const swapParams = await getSwapParams();

      addLog("info", "Sending transaction...");

      // 6. Send transaction via TonConnect
      const txResult = await tonConnectUI.sendTransaction({
        validUntil: Date.now() + 5 * 60 * 1000,
        messages: [
          {
            address: swapParams.to.toString(),
            amount: swapParams.value.toString(),
            payload: swapParams.body?.toBoc().toString("base64"),
          }
        ]
      });

      // Calculate transaction hash from BOC
      let txHash: string | undefined;
      try {
        if (txResult.boc) {
          const cell = Cell.fromBase64(txResult.boc);
          txHash = cell.hash().toString('hex');
        }
      } catch (e) {
        console.error('Failed to calculate tx hash:', e);
      }

      // Log transaction details
      addLog("success", "✅ Transaction sent successfully!");
      addLog("info", "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      addLog("info", "📊 Transaction Details:");
      addLog("info", `   From: ${numericAmount} ${getAssetLabel(fromAsset)}`);
      addLog("info", `   To: ~${expectedOut} ${getAssetLabel(toAsset)}`);
      addLog("info", `   Min: ${(Number(result.minAskUnits) / toDecimals).toFixed(4)} ${getAssetLabel(toAsset)}`);
      addLog("info", `   Slippage: ${(parseFloat(result.slippageTolerance || "0.01") * 100).toFixed(2)}%`);

      if (result.priceImpact) {
        const priceImpact = parseFloat(result.priceImpact);
        const impactPercent = (priceImpact * 100).toFixed(2);
        addLog("info", `   Price Impact: ${impactPercent}%`);
      }

      const rate = (Number(result.askUnits) / Number(result.offerUnits)).toFixed(6);
      addLog("info", `   Rate: 1 ${getAssetLabel(fromAsset)} = ${rate} ${getAssetLabel(toAsset)}`);

      // Add blockchain explorer links
      addLog("info", "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      addLog("success", `🔍 View transaction:`);
      if (txHash) {
        addLog("info", `   TONViewer: https://tonviewer.com/transaction/${txHash}`);
        addLog("info", `   TONScan: https://tonscan.org/tx/${txHash}`);
      } else {
        addLog("info", `   Your wallet: https://tonviewer.com/${userAddress}`);
      }
      addLog("info", "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

      setAmountIn(1);
      setSimulationResult(null);

    } catch (err) {
      const message = err instanceof Error ? err.message : "Swap failed";
      setError(message);
      addLog("error", `Swap failed: ${message}`);
    } finally {
      setIsSwapping(false);
    }
  };

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
        leftSection={
          fromAsset?.meta?.imageUrl && (
            <Avatar src={fromAsset.meta.imageUrl} size={24} radius="xl" />
          )
        }
        renderOption={({ option }) => {
          const asset = assets.find((a) => a.contractAddress === option.value);
          return (
            <Group gap="sm" wrap="nowrap">
              {asset?.meta?.imageUrl && (
                <Avatar src={asset.meta.imageUrl} size={28} radius="xl" />
              )}
              <Text>{option.label}</Text>
            </Group>
          );
        }}
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
        leftSection={
          toAsset?.meta?.imageUrl && (
            <Avatar src={toAsset.meta.imageUrl} size={24} radius="xl" />
          )
        }
        renderOption={({ option }) => {
          const asset = assets.find((a) => a.contractAddress === option.value);
          return (
            <Group gap="sm" wrap="nowrap">
              {asset?.meta?.imageUrl && (
                <Avatar src={asset.meta.imageUrl} size={28} radius="xl" />
              )}
              <Text>{option.label}</Text>
            </Group>
          );
        }}
      />

      {/* Simulation Result */}
      {simulationResult && toAsset && fromAsset && (
        <SwapSimulationDetails
          offerAmount={numericAmount}
          askAmount={
            Number(simulationResult.askUnits) /
            10 ** (toAsset.meta?.decimals ?? 9)
          }
          minAskAmount={
            Number(simulationResult.minAskUnits) /
            10 ** (toAsset.meta?.decimals ?? 9)
          }
          offerSymbol={getAssetLabel(fromAsset)}
          askSymbol={getAssetLabel(toAsset)}
          priceImpact={simulationResult.priceImpact}
          slippageTolerance={simulationResult.slippageTolerance || "0.01"}
          estimatedGas={
            simulationResult.gasParams?.estimatedGasConsumption
              ? (
                  Number(simulationResult.gasParams.estimatedGasConsumption) /
                  1e9
                ).toFixed(2)
              : undefined
          }
        />
      )}

      {/* Error Display */}
      {error && (
        <Alert
          color="red"
          title="⚠ ERROR"
          onClose={() => setError(null)}
          withCloseButton
        >
          {error}
        </Alert>
      )}

      {/* Action Button */}
      <Button
        variant="filled"
        color="terminalGreen"
        size="lg"
        fullWidth
        onClick={handleSwap}
        loading={isSwapping}
        disabled={!isConnected || !isAmountValid || !fromAsset || !toAsset}
      >
        {isSwapping ? "Processing..." : "Swap"}
      </Button>
    </Stack>
  );
};

export default SimpleSwapForm;
