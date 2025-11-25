import type { FC, ReactNode } from 'react';
import { AppShell, Container } from '@mantine/core';
import { Header } from './Header';

interface AppShellLayoutProps {
  children: ReactNode;
}

export const AppShellLayout: FC<AppShellLayoutProps> = ({ children }) => (
  <AppShell padding="md" header={{ height: 72 }} mah="100vh">
    <AppShell.Header bg={'transparent'}>
      <Header />
    </AppShell.Header>
    <AppShell.Main>
      <Container size="xl" py="xs">
        {children}
      </Container>
    </AppShell.Main>
  </AppShell>
);

export default AppShellLayout;
