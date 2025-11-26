import type {FC, ReactNode} from "react";
import {Box, Grid, Group, Text, SimpleGrid, Flex} from "@mantine/core";
import {useTonConnect} from "@/shared/ton/useTonConnect";
import WalletButton from "@/features/Wallet/WalletButton";
import Console from "@/features/Console/Console";
import {useConsoleLogger} from "@/features/Console/useConsoleLogger";
import classes from "./TerminalLayout.module.css";

interface TerminalLayoutProps {
    children: ReactNode;
}

export const TerminalLayout: FC<TerminalLayoutProps> = ({children}) => {
    const {isConnected} = useTonConnect();
    const {logs} = useConsoleLogger();

    return (
        <Flex direction={'column'} gap={32} bg="terminalDark.4" p={{ base: 'md', sm: 'lg', md: 'xl' }} style={{ minHeight: '100vh', position: 'relative' }}>
            <Group justify="space-between" align="center" style={{ position: 'relative' }}>
                <Text size="lg" fw={600} tt="uppercase">
                    ▸ DEX SWAP
                </Text>
                <Group gap="lg">
                    <Group gap="xs" className={classes.status}>
                        <Text c="terminalGreen.6" size="sm" tt="uppercase">
                            {isConnected ? "CONNECTED" : "WALLET DISCONNECTED"}
                        </Text>
                    </Group>
                    <WalletButton/>
                </Group>
            </Group>

            <Grid gutter={'lg'}>
                <Grid.Col span={{base: 12, md: 4}}>
                    <Box>
                        <Text
                            c="terminalGreen.5"
                            size="lg"
                            fw={700}
                            tt="uppercase"
                            mb="lg"
                            pb="sm"
                            style={{
                                borderBottom: "1px solid var(--mantine-color-terminalDark-2)",
                            }}
                        >
                            [ SWAP INTERFACE ]
                        </Text>
                        {children}
                    </Box>
                </Grid.Col>

                {/* Right Panel - Console (Hidden on mobile) */}
                <Grid.Col
                    span={{base: 12, md: 8}}
                    visibleFrom="md"
                    style={{
                        display: "flex",
                        flexDirection: "column",
                    }}
                >
                    <Box style={{flex: 1, display: "flex", flexDirection: "column"}}>
                        <Console logs={logs}/>
                    </Box>
                </Grid.Col>
            </Grid>
        </Flex>
    );
};

export default TerminalLayout;
