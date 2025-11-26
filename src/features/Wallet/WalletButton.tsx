import type { FC } from "react";
import { useEffect, useRef } from "react";
import { Group, Text } from "@mantine/core";
import { TonConnectButton, useTonWallet } from "@tonconnect/ui-react";
import { useConsoleLogger } from "@/features/Console/useConsoleLogger";

const formatAddress = (address: string) =>
  `${address.slice(0, 6)}...${address.slice(-4)}`;

const WalletButton: FC = () => {
  const wallet = useTonWallet();
  const address = wallet?.account?.address;
  const { addLog } = useConsoleLogger();
  const prevAddressRef = useRef<string | undefined>(null);

  useEffect(() => {
    const prevAddress = prevAddressRef.current;

    if (address && address !== prevAddress) {
      addLog("success", `Wallet connected: ${formatAddress(address)}`);
    } else if (!address && prevAddress) {
      addLog("warning", "Wallet disconnected");
    }

    prevAddressRef.current = address;
  }, [address, addLog]);

  return (
    <Group gap="md" align="center">
      {address && (
        <Text
          c="cyan"
          size="sm"
          fw={600}
          px="sm"
          py="xs"
          bg="terminalDark.6"
        >
          ◆ {formatAddress(address)}
        </Text>
      )}
    </Group>
  );
};

export default WalletButton;
