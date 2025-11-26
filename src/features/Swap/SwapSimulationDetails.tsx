import { Paper, Stack, Text, Group, Divider } from "@mantine/core";

interface SwapSimulationDetailsProps {
  offerAmount: number;
  askAmount: number;
  minAskAmount: number;
  offerSymbol: string;
  askSymbol: string;
  priceImpact?: string;
  slippageTolerance: string;
  estimatedGas?: string;
  swapRate?: string;
}

const SwapSimulationDetails = ({
  offerAmount,
  askAmount,
  minAskAmount,
  offerSymbol,
  askSymbol,
  priceImpact,
  slippageTolerance,
  estimatedGas,
}: SwapSimulationDetailsProps) => {
  const formatNumber = (num: number, decimals = 4) => {
    return num.toFixed(decimals);
  };

  const formatPercentage = (value: string) => {
    const num = parseFloat(value) * 100;
    return `${num.toFixed(2)}%`;
  };

  return (
    <Paper bg="terminalDark.5" withBorder p="md">
      <Stack gap="xs">
        <Text size="sm" c="cyan" fw={700} tt="uppercase" ta="center">
          [ Swap Simulation ]
        </Text>

        <Divider color="terminalGreen.9" />

        <Group justify="space-between">
          <Text size="sm" c="dimmed">
            Offer amount:
          </Text>
          <Text size="sm" fw={600} c="terminalGreen.5">
            {formatNumber(offerAmount)} {offerSymbol}
          </Text>
        </Group>

        <Group justify="space-between">
          <Text size="sm" c="dimmed">
            Ask amount:
          </Text>
          <Text size="sm" fw={600} c="terminalGreen.5">
            {formatNumber(askAmount)} {askSymbol}
          </Text>
        </Group>

        <Group justify="space-between">
          <Text size="sm" c="dimmed">
            Ask amount (min):
          </Text>
          <Text size="sm" fw={600} c="terminalGreen.5">
            {formatNumber(minAskAmount)} {askSymbol}
          </Text>
        </Group>

        {priceImpact && (
          <Group justify="space-between">
            <Text size="sm" c="dimmed">
              Price impact:
            </Text>
            <Text size="sm" fw={600} c="yellow">
              {formatPercentage(priceImpact)}
            </Text>
          </Group>
        )}

        <Group justify="space-between">
          <Text size="sm" c="dimmed">
            Slippage tolerance (max):
          </Text>
          <Text size="sm" fw={600} c="cyan">
            {formatPercentage(slippageTolerance)}
          </Text>
        </Group>

        {estimatedGas && (
          <Group justify="space-between">
            <Text size="sm" c="dimmed">
              Est. gas:
            </Text>
            <Text size="sm" fw={600} c="terminalGreen.5">
              {estimatedGas} TON
            </Text>
          </Group>
        )}
      </Stack>
    </Paper>
  );
};

export default SwapSimulationDetails;
