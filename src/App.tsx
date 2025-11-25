import type { FC } from 'react';
import { Stack, Title } from '@mantine/core';
import SwapForm from './features/Swap/SwapForm';

const App: FC = () => (
  <Stack gap="md">
    <Title order={2}>Swap</Title>
    <SwapForm />
  </Stack>
);

export default App;
