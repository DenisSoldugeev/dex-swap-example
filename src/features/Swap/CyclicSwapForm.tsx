import {useConsoleLogger} from "@/features/Console/useConsoleLogger";
import {REFERRAL_CONFIG} from "@/shared/config/referral";
import {fetchLiquidAssets} from "@/shared/stonfi/assets";
import {buildSwapTx, simulateSwap} from "@/shared/stonfi/swap";
import {tonLiteClient} from "@/shared/ton/clients";
import {decrypt, getEncryptionPassword} from "@/shared/utils/crypto";
import {useWallet} from "@/shared/wallet/WalletContext";
import {
    Alert,
    Button as MantineButton,
    Avatar,
    Badge,
    Button,
    Card,
    Group,
    Loader,
    NumberInput,
    Progress,
    Select,
    Stack,
    Text,
    Modal,
} from "@mantine/core";
import {useQuery} from "@tanstack/react-query";
import {SendMode} from "@ton/core";
import {mnemonicToPrivateKey} from "@ton/crypto";
import {internal, WalletContractV5R1} from "@ton/ton";
import {useCallback, useMemo, useState} from "react";
import {Address} from "@ton/core";

const CyclicSwapForm = () => {
  const [tokenAddress, setTokenAddress] = useState<string>("");
  const [usdtAddress] = useState<string>("EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs"); // jUSDT address (STON.fi compatible)
  const [amountUSDT, setAmountUSDT] = useState<string | number>(5);
  const [cyclesCount, setCyclesCount] = useState<string | number>(3);
  const [delaySeconds, setDelaySeconds] = useState<string | number>(20);
  const [error, setError] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [currentCycle, setCurrentCycle] = useState(0);
  const [currentStep, setCurrentStep] = useState<"idle" | "buying" | "waiting" | "selling">("idle");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [slippagePct, setSlippagePct] = useState<number>(1); // percent, e.g. 1 = 1%

  const { address: userAddress } = useWallet();
  const { addLog } = useConsoleLogger();

  // Fetch assets query
  const {
    data: assets = [],
    isLoading: assetsLoading,
    error: assetsError,
  } = useQuery({
    queryKey: ["assets"],
    queryFn: fetchLiquidAssets,
    staleTime: 5 * 60 * 1000,
  });

  // Find selected token
  const selectedToken = useMemo(
    () => assets.find((a) => a.contractAddress === tokenAddress),
    [assets, tokenAddress],
  );

  const usdtToken = useMemo(
    () => assets.find((a) => a.contractAddress === usdtAddress),
    [assets, usdtAddress],
  );

  const numericAmount = useMemo(() => Number(amountUSDT), [amountUSDT]);
  const numericCycles = useMemo(() => Number(cyclesCount), [cyclesCount]);
  const numericDelay = useMemo(() => Number(delaySeconds), [delaySeconds]);
  const isAmountValid = Number.isFinite(numericAmount) && numericAmount > 0;
  const isCyclesValid = Number.isFinite(numericCycles) && numericCycles > 0;
  const isDelayValid = Number.isFinite(numericDelay) && numericDelay >= 0;
  const isConnected = Boolean(userAddress);

  const formatUnits = (units: string, decimals: number) =>
    Number(units) / 10 ** decimals;

  const getAssetLabel = (asset: (typeof assets)[0]) => {
    return asset.meta?.symbol || asset.meta?.displayName || "Token";
  };

  const validationError = () => {
    if (!selectedToken || !usdtToken || !isAmountValid || !isCyclesValid) {
      return "Please configure all parameters correctly";
    }
    if (!userAddress) {
      return "Please connect wallet first";
    }
    return null;
  };

  // Execute single swap - АВТОМАТИЧЕСКАЯ ПОДПИСЬ
  const executeSwap = useCallback(
    async (
      fromAsset: typeof selectedToken,
      toAsset: typeof selectedToken,
      amount: number,
    ) => {
      if (!fromAsset || !toAsset || !userAddress) {
        throw new Error("Missing required parameters");
      }

      // 1. Simulate swap
      const result = await simulateSwap({
        offer: fromAsset,
        ask: toAsset,
        amount,
        slippageTolerance: (slippagePct / 100).toString(),
      });

      const toDecimals = toAsset.meta?.decimals ?? 9;
      const expectedOut = formatUnits(result.askUnits, toDecimals);
      const minOut = formatUnits(result.minAskUnits, toDecimals);
      const slippageBuffer = expectedOut - minOut;

      addLog(
        "info",
        `Swap: ${amount.toFixed(2)} ${getAssetLabel(fromAsset)} → ${expectedOut.toFixed(4)} ${getAssetLabel(toAsset)}`,
      );
      addLog(
        "info",
        `Slippage buffer (${slippagePct}%): may get as low as ${minOut.toFixed(4)} ${getAssetLabel(toAsset)} (buffer ${slippageBuffer.toFixed(4)})`,
      );

      // 2. Get tx params via shared builder
      const swapParams = await buildSwapTx(
        result,
        userAddress,
        fromAsset.kind,
        toAsset.kind,
      );

      // 5. АВТОМАТИЧЕСКАЯ ПОДПИСЬ И ОТПРАВКА
      addLog("info", "Auto-signing transaction...");

      // Получаем зашифрованную мнемонику из localStorage
      const encryptedMnemonic = localStorage.getItem("wallet_mnemonic_encrypted");
      if (!encryptedMnemonic) {
        throw new Error("Wallet not imported");
      }

      // Расшифровываем мнемонику
      const password = getEncryptionPassword();
      const mnemonic = await decrypt<string[]>(encryptedMnemonic, password);
      const keyPair = await mnemonicToPrivateKey(mnemonic);

      // Создаём wallet contract V5R1
      const wallet = WalletContractV5R1.create({
        workchain: 0,
        publicKey: keyPair.publicKey,
      });

      // Открываем контракт с клиентом
      const contract = tonLiteClient.open(wallet);

      // Получаем seqno
      let seqno = await contract.getSeqno();
      addLog("info", `Current seqno: ${seqno}`);

      // Парсим body
      const body = swapParams.raw.body ?? undefined;

      // Отправляем транзакцию напрямую через контракт
      addLog("info", `Sending transaction to blockchain...`);

      const transferResult = await contract.sendTransfer({
        seqno,
        secretKey: keyPair.secretKey,
        messages: [
          internal({
            to: swapParams.raw.to,
            value: swapParams.raw.value,
            body: body,
          }),
        ],
        sendMode: SendMode.PAY_GAS_SEPARATELY,
      });

      // Log wallet address for blockchain explorer tracking
      const walletAddress = wallet.address.toString();
      addLog("success", `✅ Transaction sent to mempool!`);
      addLog("info", `Wallet: ${walletAddress}`);
      addLog("info", `Track at: https://tonviewer.com/${walletAddress}`);

      // Ждём пока seqno обновится (транзакция подтвердится)
      addLog("info", `Waiting for transaction confirmation...`);

      const maxWaitTime = 90000; // 90 секунд максимум
      const checkInterval = 5000; // Проверяем каждые 5 секунд (меньше нагрузка на API)
      const startTime = Date.now();
      let confirmed = false;
      let attempts = 0;
      const maxAttempts = Math.floor(maxWaitTime / checkInterval);

      while (!confirmed && (Date.now() - startTime) < maxWaitTime) {
        await new Promise((resolve) => setTimeout(resolve, checkInterval));
        attempts++;

        try {
          const newSeqno = await contract.getSeqno();

          if (newSeqno > seqno) {
            confirmed = true;
            addLog("success", `✅ Transaction confirmed! New seqno: ${newSeqno}`);
          } else {
            addLog("info", `Waiting... (seqno still ${newSeqno}, attempt ${attempts}/${maxAttempts})`);
          }
        } catch (seqnoError) {
          addLog("warning", `⚠ Error checking seqno: ${seqnoError instanceof Error ? seqnoError.message : 'Unknown error'}`);
          // Continue waiting despite error
        }
      }

      if (!confirmed) {
        addLog("error", `❌ Transaction not confirmed within 90s!`);
        addLog("warning", `Please check the transaction status at: https://tonviewer.com/${walletAddress}`);
        throw new Error(`Transaction timeout - check blockchain explorer for status`);
      }

      return {
        expectedOut,
        minOut,
        slippageBuffer,
      };
    },
    [userAddress, addLog, getAssetLabel],
  );

  // Main cycle function
  const startCyclicSwap = async () => {
    const maybeError = validationError();
    if (maybeError) {
      setError(maybeError);
      return;
    }

    // После валидации объекты гарантированно заданы
    const token = selectedToken!;
    const usdt = usdtToken!;
    const tokenLabel = getAssetLabel(token);
    const usdtLabel = getAssetLabel(usdt);

    setConfirmOpen(false);
    setIsRunning(true);
    setError(null);
    setCurrentCycle(0);

    addLog("info", "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    addLog("success", "🔄 Starting cyclic swap");
    addLog("info", `Token: ${tokenLabel}`);
    addLog("info", `Amount: ${numericAmount} ${usdtLabel}`);
    addLog("info", `Cycles: ${numericCycles}`);
    addLog("info", `Delay: ${numericDelay}s`);
    addLog("info", "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    let currentAmount = numericAmount;
    let totalSlippageUsdtBuffer = 0;

    try {
      for (let i = 0; i < numericCycles; i++) {
        setCurrentCycle(i + 1);

        try {
          // Step 1: Buy token with USDT
          addLog("info", `\n[Cycle ${i + 1}/${numericCycles}] Step 1: Buying ${tokenLabel}`);
          setCurrentStep("buying");

          const buyResult = await executeSwap(
            usdt,
            token,
            currentAmount,
          );

          addLog("success", `Bought ${buyResult.expectedOut.toFixed(4)} ${tokenLabel}`);

          // Небольшая пауза перед следующим свопом (транзакция уже подтверждена внутри executeSwap)
          addLog("info", `Pausing 5s before next swap...`);
          setCurrentStep("waiting");
          await new Promise((resolve) => setTimeout(resolve, 5000));

          // Step 2: Sell token back to USDT
          addLog("info", `[Cycle ${i + 1}/${numericCycles}] Step 2: Selling back to USDT`);
          setCurrentStep("selling");

          const sellResult = await executeSwap(
            token,
            usdt,
            buyResult.expectedOut,
          );

          // Accumulate slippage buffer on the USDT leg
          totalSlippageUsdtBuffer += sellResult.slippageBuffer;

          currentAmount = sellResult.expectedOut;
          addLog("success", `Sold for ${currentAmount.toFixed(4)} USDT`);
          addLog("info", `Cycle ${i + 1} complete. Balance: ${currentAmount.toFixed(4)} USDT`);

          // Небольшая пауза перед следующим циклом
          if (i < numericCycles - 1) {
            addLog("info", `Pausing 5s before next cycle...`);
            setCurrentStep("waiting");
            await new Promise((resolve) => setTimeout(resolve, 5000));
          }
        } catch (cycleError) {
          const message = cycleError instanceof Error ? cycleError.message : "Cycle failed";
          addLog("error", `❌ Cycle ${i + 1} failed: ${message}`);

          // If it's a rate limit error, wait longer
          if (message.includes("429") || message.includes("Rate limit")) {
            addLog("warning", `Rate limit hit. Waiting 30s...`);
            await new Promise((resolve) => setTimeout(resolve, 30000));
            i--; // Retry
            continue;
          }

throw cycleError;
        }
      }

      addLog("info", "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      addLog("success", `🎉 Cyclic swap completed!`);
      addLog("info", `Started with: ${numericAmount.toFixed(4)} USDT`);
      addLog("info", `Ended with: ${currentAmount.toFixed(4)} USDT`);
      const diff = currentAmount - numericAmount;
      const diffPercent = ((diff / numericAmount) * 100).toFixed(2);
      addLog(
        diff >= 0 ? "success" : "warning",
        `Difference: ${diff >= 0 ? "+" : ""}${diff.toFixed(4)} USDT (${diff >= 0 ? "+" : ""}${diffPercent}%)`,
      );
      addLog(
        "info",
        `Total slippage buffer on USDT legs (${slippagePct}% each): up to ${totalSlippageUsdtBuffer.toFixed(4)} USDT could be lost to price moves within tolerance.`,
      );
      addLog("info", "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Cyclic swap failed";
      setError(message);
      addLog("error", `❌ Error at cycle ${currentCycle}: ${message}`);
    } finally {
      setIsRunning(false);
      setCurrentStep("idle");
      setCurrentCycle(0);
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
        {String(assetsError)}
      </Alert>
    );
  }

  const progress = numericCycles > 0 ? (currentCycle / numericCycles) * 100 : 0;

  const confirmationSummary = (
    <Stack gap="xs">
      <Text size="sm" c="dimmed">
        Token: {selectedToken ? getAssetLabel(selectedToken) : "—"}
      </Text>
      <Text size="sm" c="dimmed">
        Amount per cycle: {numericAmount.toFixed(2)} USDT
      </Text>
      <Text size="sm" c="dimmed">
        Cycles: {numericCycles}
      </Text>
      <Text size="sm" c="dimmed">
        Pause between operations: {Math.max(numericDelay, 15)} seconds
      </Text>
      <Text size="sm" c="dimmed">
        Slippage tolerance: {slippagePct}%
      </Text>
    </Stack>
  );

  return (
    <Stack gap="lg">
      <Modal.Root
        opened={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        centered
      >
        <Modal.Overlay />
        <Modal.Content>
          <Modal.Header bg={"transparent"}>
            <Modal.Title>Confirm cyclic swap</Modal.Title>
            <Modal.CloseButton />
          </Modal.Header>
          <Modal.Body>
            <Stack gap="md">
              {confirmationSummary}
              <Group justify="flex-end">
                <Button variant="default" onClick={() => setConfirmOpen(false)}>
                  Cancel
                </Button>
                <MantineButton color="terminalGreen" onClick={startCyclicSwap}>
                  Start
                </MantineButton>
              </Group>
            </Stack>
          </Modal.Body>
        </Modal.Content>
      </Modal.Root>

      {/* Progress Card */}
      {isRunning && (
        <Card padding="lg" withBorder>
          <Stack gap="sm">
            <Group justify="space-between">
              <Text size="sm" fw={600} c="terminalGreen.5">
                CYCLE {currentCycle} / {numericCycles}
              </Text>
              <Badge
                color={
                  currentStep === "buying"
                    ? "green"
                    : currentStep === "selling"
                      ? "red"
                      : "gray"
                }
                variant="filled"
              >
                {currentStep.toUpperCase()}
              </Badge>
            </Group>
            <Progress value={progress} color="terminalGreen" size="lg" />
            <Text size="xs" c="dimmed" ta="center">
              {progress.toFixed(0)}% Complete
            </Text>
          </Stack>
        </Card>
      )}

      {/* Token Selector */}
      <Select
        label={
          <Text size="sm" fw={600} c="terminalGreen.5" tt="uppercase">
            &gt; Select Token to Trade
          </Text>
        }
        placeholder="Select token"
        value={tokenAddress}
        onChange={(value) => {
          setTokenAddress(value || "");
          setError(null);
        }}
        data={assets
          .filter((a) => a.contractAddress !== usdtAddress)
          .map((asset) => ({
            value: asset.contractAddress,
            label: getAssetLabel(asset),
          }))}
        searchable
        size="md"
        disabled={isRunning}
        leftSection={
          selectedToken?.meta?.imageUrl && (
            <Avatar src={selectedToken.meta.imageUrl} size={24} radius="xl" />
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
            &gt; USDT Amount per Cycle
          </Text>
        }
        value={amountUSDT}
        onChange={(val) => {
          setAmountUSDT(val);
          setError(null);
        }}
        min={0}
        step={1}
        decimalScale={2}
        placeholder="5.00"
        size="md"
        disabled={isRunning}
        rightSection={
          <Text size="sm" c="dimmed">
            USDT
          </Text>
        }
        rightSectionWidth={60}
      />

      {/* Slippage */}
      <NumberInput
        label={
          <Text size="sm" fw={600} c="terminalGreen.5" tt="uppercase">
            &gt; Slippage tolerance (%)
          </Text>
        }
        value={slippagePct}
        onChange={(val) => {
          setSlippagePct(typeof val === "number" ? val : slippagePct);
          setError(null);
        }}
        min={0}
        max={50}
        step={0.1}
        decimalScale={2}
        placeholder="1.00"
        size="md"
        disabled={isRunning}
        description="If execution price moves beyond this percent, swap will fail (minAsk)."
        rightSection={
          <Text size="sm" c="dimmed">
            %
          </Text>
        }
        rightSectionWidth={30}
      />

      {/* Cycles Count */}
      <NumberInput
        label={
          <Text size="sm" fw={600} c="terminalGreen.5" tt="uppercase">
            &gt; Number of Cycles
          </Text>
        }
        value={cyclesCount}
        onChange={(val) => {
          setCyclesCount(val);
          setError(null);
        }}
        min={1}
        max={100}
        step={1}
        placeholder="3"
        size="md"
        disabled={isRunning}
        description="How many times to buy and sell"
      />

      {/* Delay Between Operations */}
      <NumberInput
        label={
          <Text size="sm" fw={600} c="terminalGreen.5" tt="uppercase">
            &gt; Delay Between Operations
          </Text>
        }
        value={delaySeconds}
        onChange={(val) => {
          setDelaySeconds(val);
          setError(null);
        }}
        min={15}
        max={300}
        step={1}
        placeholder="20"
        size="md"
        disabled={isRunning}
        description="Seconds to wait (minimum 15s)"
        rightSection={
          <Text size="sm" c="dimmed">
            sec
          </Text>
        }
        rightSectionWidth={50}
      />

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

      {/* Info Card */}
      {selectedToken && !isRunning && (
        <Card padding="md" withBorder>
          <Stack gap="xs">
            <Text size="sm" fw={600} c="terminalGreen.5">
              CYCLE PLAN:
            </Text>
            <Text size="xs" c="dimmed">
              1. Buy {getAssetLabel(selectedToken)} with {numericAmount} USDT
            </Text>
            <Text size="xs" c="dimmed">
              2. Wait {Math.max(numericDelay, 15)}s for confirmation
            </Text>
            <Text size="xs" c="dimmed">
              3. Sell {getAssetLabel(selectedToken)} back to USDT
            </Text>
            <Text size="xs" c="dimmed">
              4. Repeat {numericCycles} times
            </Text>
            <Text size="xs" c="yellow" fw={500} mt="xs">
              ⚡ Automatic signing - no popups!
            </Text>
          </Stack>
        </Card>
      )}

      {/* Action Button */}
      <Button
        variant="filled"
        color={isRunning ? "red" : "terminalGreen"}
        size="lg"
        fullWidth
        onClick={() => {
          const maybeError = validationError();
          if (maybeError) {
            setError(maybeError);
            return;
          }
          setConfirmOpen(true);
        }}
        loading={isRunning}
        disabled={
          !isConnected ||
          !isAmountValid ||
          !isCyclesValid ||
          !isDelayValid ||
          !selectedToken ||
          isRunning
        }
      >
        {isRunning ? `Running... (${currentCycle}/${numericCycles})` : "Start Cyclic Swap"}
      </Button>
    </Stack>
  );
};

export default CyclicSwapForm;
