import type { FC } from 'react';
import { Alert, Avatar, Badge, Group, Loader, Stack, Table, Text } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { fetchAssets, type AssetSummary } from '../../shared/api/stonfi';

const formatPrice = (value?: string) => {
  if (!value) return '—';
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? `$${numberValue.toFixed(4)}` : '—';
};

const AssetsList: FC = () => {
  const { data, isPending, error } = useQuery<AssetSummary[]>({
    queryKey: ['assets'],
    queryFn: () => fetchAssets(),
    staleTime: 60_000,
  });

  const assets = data?.slice(0, 25) ?? [];

  if (isPending) {
    return (
      <Group justify="center" py="lg">
        <Loader />
        <Text>Loading assets from STON.fi…</Text>
      </Group>
    );
  }

  if (error) {
    return (
      <Alert color="red" title="Could not fetch assets">
        {error instanceof Error ? error.message : 'Failed to load assets'}
      </Alert>
    );
  }

  return (
    <Stack gap="sm">
      <Table striped highlightOnHover withColumnBorders>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Name</Table.Th>
            <Table.Th>Symbol</Table.Th>
            <Table.Th>Type</Table.Th>
            <Table.Th>Decimals</Table.Th>
            <Table.Th>Price (USD)</Table.Th>
            <Table.Th>Tags</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {assets.map((asset) => (
            <Table.Tr key={asset.address}>
              <Table.Td>
                <Group gap="sm">
                  <Avatar src={asset.imageUrl} radius="xl" size={32} alt={asset.symbol}>
                    {asset.symbol.slice(0, 2)}
                  </Avatar>
                  <Stack gap={0}>
                    <Text fw={600}>{asset.name}</Text>
                    <Text size="xs" c="dimmed">
                      {asset.address}
                    </Text>
                  </Stack>
                </Group>
              </Table.Td>
              <Table.Td>{asset.symbol}</Table.Td>
              <Table.Td>{asset.kind}</Table.Td>
              <Table.Td>{asset.decimals}</Table.Td>
              <Table.Td>{formatPrice(asset.priceUsd)}</Table.Td>
              <Table.Td>
                <Group gap={6} wrap="wrap">
                  {asset.tags.map((tag) => (
                    <Badge key={`${asset.address}-${tag}`} size="xs" variant="light">
                      {tag}
                    </Badge>
                  ))}
                </Group>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
      <Text size="sm" c="dimmed">
        Data is fetched live from STON.fi public API via the typed client.
      </Text>
    </Stack>
  );
};

export default AssetsList;
