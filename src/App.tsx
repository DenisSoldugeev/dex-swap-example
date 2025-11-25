import type { FC } from 'react';
import { Stack, Text, Title } from '@mantine/core';
import SwapForm from './features/Swap/SwapForm';

const App: FC = () => (
  <Stack gap="md">
    <Title order={2}>Swap Govno ↔ USDT</Title>
    <Text c="dimmed">
      Используйте STON.fi SDK на MAINNET. Получите котировку, проверьте minAmountOut и отправьте транзу через TON Connect.
    </Text>
    <SwapForm />
  </Stack>
);

export default App;
