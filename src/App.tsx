import {Button, Group, SegmentedControl, Stack} from '@mantine/core';
import {IconLogout} from '@tabler/icons-react';
import {FC, useState} from 'react';
import CyclicSwapForm from './features/Swap/CyclicSwapForm';
import SimpleSwapForm from './features/Swap/SimpleSwapForm';
import WalletImport from './features/Wallet/WalletImport';
import TerminalLayout from './layout/TerminalLayout';
import {useWallet, WalletProvider} from './shared/wallet/WalletContext';

const AppContent: FC = () => {
  const [mode, setMode] = useState<string>('simple');
  const { isImported, clearWallet } = useWallet();

  // Cyclic swap requires wallet import
  const needsWalletImport = mode === 'cyclic' && !isImported;

  // Show wallet import only for cyclic mode
  if (needsWalletImport) {
    return (
      <TerminalLayout>
        <Stack gap="lg">
          <Group justify="space-between">
            <SegmentedControl
              value={mode}
              onChange={setMode}
              data={[
                { label: 'Simple Swap', value: 'simple' },
                { label: 'Cyclic Swap', value: 'cyclic' },
              ]}
              color="terminalGreen"
              style={{ flex: 1 }}
            />
          </Group>
          <WalletImport />
        </Stack>
      </TerminalLayout>
    );
  }

  // Show trading interface
  return (
    <TerminalLayout>
      <Stack gap="lg">
        <SegmentedControl
          value={mode}
          onChange={setMode}
          data={[
            { label: 'Simple Swap', value: 'simple' },
            { label: 'Cyclic Swap', value: 'cyclic' },
          ]}
          color="terminalGreen"
          fullWidth
        />
        {isImported && (
          <Button
            variant="subtle"
            color="red"
            size="sm"
            onClick={clearWallet}
            leftSection={<IconLogout size={16} />}
            fullWidth
          >
            Clear Wallet
          </Button>
        )}
        {mode === 'simple' ? <SimpleSwapForm /> : <CyclicSwapForm />}
      </Stack>
    </TerminalLayout>
  );
};

const App: FC = () => (
  <WalletProvider>
    <AppContent />
  </WalletProvider>
);

export default App;
