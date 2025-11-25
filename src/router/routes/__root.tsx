import { Outlet, createRootRouteWithContext } from '@tanstack/react-router';
import type { QueryClient } from '@tanstack/react-query';
import AppShellLayout from '../../layout/AppShellLayout';

export type RouterContext = {
  queryClient: QueryClient;
};

export const Route = createRootRouteWithContext<RouterContext>()({
  component: () => (
    <AppShellLayout>
      <Outlet />
    </AppShellLayout>
  ),
});
