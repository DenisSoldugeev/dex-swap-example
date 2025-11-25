import type { FC } from 'react';
import { TonConnectButton, useTonWallet } from '@tonconnect/ui-react';
import { Group, Text } from '@mantine/core';

const formatAddress = (address: string) => `${address.slice(0, 6)}...${address.slice(-4)}`;

const WalletButton: FC = () => {
  const wallet = useTonWallet();
  const address = wallet?.account?.address;

  return (
    <Group gap="xs" align="center">
      {address ? (
        <Text size="sm" fw={600} c="blue">
          {formatAddress(address)}
        </Text>
      ) : (
        <Text size="sm" c="dimmed">
          Connect wallet
        </Text>
      )}
      {/* TonConnectButton handles modal logic for supported wallets */}
      <TonConnectButton />
    </Group>
  );
};

export default WalletButton;
