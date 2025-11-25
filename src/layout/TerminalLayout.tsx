import type { FC, ReactNode } from "react";
import { Box, Grid, Group, Text, Paper } from "@mantine/core";
import { useTonConnect } from "@/shared/ton/useTonConnect";
import WalletButton from "@/features/Wallet/WalletButton";
import Console from "@/features/Console/Console";
import { useConsoleLogger } from "@/features/Console/useConsoleLogger";
import classes from "./TerminalLayout.module.css";

interface TerminalLayoutProps {
  children: ReactNode;
}

export const TerminalLayout: FC<TerminalLayoutProps> = ({ children }) => {
  const { isConnected } = useTonConnect();
  const { logs } = useConsoleLogger();

  return (
    <Box h="100vh" bg="terminalDark.4" style={{ display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <Paper
        radius={0}
        p="md"
        bg="terminalDark.5"
        style={{ borderBottom: "2px solid var(--mantine-color-terminalGreen-5)" }}
      >
        <Group justify="space-between" align="center">
          <Group gap="md">
            <Text c="terminalGreen.5" size="xl" fw={700} tt="uppercase" className={classes.logo}>
              ▸ TON SWAP TERMINAL
            </Text>
          </Group>

          <Group gap="lg">
            <Group gap="xs" className={classes.status}>
              <Text c="dimmed" size="sm">
                ●
              </Text>
              <Text c="terminalGreen.6" size="sm" tt="uppercase">
                {isConnected ? "CONNECTED" : "DISCONNECTED"}
              </Text>
            </Group>
            <WalletButton />
          </Group>
        </Group>
      </Paper>

      {/* Main Content Grid */}
      <Grid gutter={0} grow style={{ flex: 1, overflow: "hidden" }}>
        {/* Left Panel - Swap Interface */}
        <Grid.Col
          span={{ base: 12, md: 6 }}
          style={{
            borderRight: "1px solid var(--mantine-color-terminalDark-2)",
            overflowY: "auto",
          }}
        >
          <Box p="xl">
            <Text
              c="terminalGreen.5"
              size="lg"
              fw={700}
              tt="uppercase"
              mb="lg"
              pb="sm"
              style={{
                letterSpacing: "0.1em",
                borderBottom: "1px solid var(--mantine-color-terminalDark-2)",
              }}
            >
              [ SWAP INTERFACE ]
            </Text>
            {children}
          </Box>
        </Grid.Col>

        {/* Right Panel - Console */}
        <Grid.Col
          span={{ base: 12, md: 6 }}
          style={{
            display: "flex",
            flexDirection: "column",
            maxHeight: "100%",
          }}
        >
          <Box p="xl" style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
            <Console logs={logs} />
          </Box>
        </Grid.Col>
      </Grid>
    </Box>
  );
};

export default TerminalLayout;
