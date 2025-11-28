import {useWallet} from '@/shared/wallet/WalletContext';
import {Alert, Button, Card, Code, Group, Paper, Stack, Text, Textarea,} from '@mantine/core';
import {IconAlertTriangle, IconShieldLock, IconWallet} from '@tabler/icons-react';
import {useState} from 'react';

const WalletImport = () => {
  const [mnemonicInput, setMnemonicInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { importWallet, address } = useWallet();

  const handleImport = async () => {
    setError(null);
    setIsLoading(true);

    try {
      // Clean and validate mnemonic
      const words = mnemonicInput
        .trim()
        .toLowerCase()
        .split(/\s+/)
        .filter((w) => w.length > 0);

      if (words.length !== 24 && words.length !== 12) {
        throw new Error('Mnemonic must be 12 or 24 words');
      }

      await importWallet(words);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to import wallet';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  if (address) {
    return (
      <Paper p="xl" withBorder>
        <Stack gap="lg" align="center">
          <IconWallet size={48} color="var(--mantine-color-terminalGreen-5)" />
          <Text size="lg" fw={600} c="terminalGreen.5" tt="uppercase">
            Wallet Imported
          </Text>
          <Code block>{address}</Code>
          <Text size="sm" c="dimmed" ta="center">
            Your wallet is ready for automatic trading
          </Text>
        </Stack>
      </Paper>
    );
  }

  return (
    <Stack gap="lg">
      <Card padding="lg" withBorder>
        <Stack gap="md">
          <Group gap="sm">
            <IconWallet size={32} color="var(--mantine-color-terminalGreen-5)" />
            <Text size="xl" fw={600} c="terminalGreen.5" tt="uppercase">
              Import Wallet
            </Text>
          </Group>

          <Text size="sm" c="dimmed">
            Import your wallet using seed phrase to enable automatic trading without
            confirmations.
          </Text>

          <Alert
            icon={<IconAlertTriangle size={16} />}
            title="Security Warning"
            color="yellow"
            variant="light"
          >
            <Stack gap="xs">
              <Text size="xs">
                • Never share your seed phrase with anyone
              </Text>
              <Text size="xs">
                • Use a separate wallet with small funds for trading
              </Text>
              <Text size="xs">
                • Seed phrase is stored only in browser session (not sent anywhere)
              </Text>
              <Text size="xs">
                • Clear session when done trading
              </Text>
            </Stack>
          </Alert>

          <Textarea
            label={
              <Text size="sm" fw={600} c="terminalGreen.5" tt="uppercase">
                &gt; Seed Phrase (12 or 24 words)
              </Text>
            }
            placeholder="word1 word2 word3 ... (separate words with spaces)"
            value={mnemonicInput}
            onChange={(e) => {
              setMnemonicInput(e.currentTarget.value);
              setError(null);
            }}
            minRows={4}
            maxRows={6}
            autosize
            disabled={isLoading}
          />

          {error && (
            <Alert color="red" title="Import Failed" withCloseButton onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          <Button
            variant="filled"
            color="terminalGreen"
            size="lg"
            fullWidth
            onClick={handleImport}
            loading={isLoading}
            disabled={!mnemonicInput.trim() || isLoading}
            leftSection={<IconShieldLock size={20} />}
          >
            {isLoading ? 'Importing...' : 'Import Wallet'}
          </Button>
        </Stack>
      </Card>

      <Card padding="md" withBorder>
        <Stack gap="xs">
          <Text size="sm" fw={600} c="terminalGreen.5">
            HOW IT WORKS:
          </Text>
          <Text size="xs" c="dimmed">
            1. Enter your 12 or 24 word seed phrase
          </Text>
          <Text size="xs" c="dimmed">
            2. Wallet will be imported and stored in browser session
          </Text>
          <Text size="xs" c="dimmed">
            3. All swaps will be signed automatically without popups
          </Text>
          <Text size="xs" c="dimmed">
            4. Session clears when you close the browser
          </Text>
        </Stack>
      </Card>
    </Stack>
  );
};

export default WalletImport;
