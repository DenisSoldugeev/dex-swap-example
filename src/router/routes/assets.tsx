import { Stack, Text, Title } from '@mantine/core';
import { createFileRoute } from '@tanstack/react-router';
import AssetsList from '../../features/Assets/AssetsList';

export const Route = createFileRoute('/assets')({
  component: AssetsPage,
});

function AssetsPage() {
  return (
    <Stack gap="md">
      <Title order={2}>Assets</Title>
      <AssetsList />
    </Stack>
  );
}
