import type { FC, ReactNode } from 'react';
import { TonConnectUIProvider } from '@tonconnect/ui-react';

// Provides TonConnect context for the whole app using the manifest hosted in /public
const manifestUrl = `${window.location.origin}/tonconnect-manifest.json`;

interface TonProviderProps {
  children: ReactNode;
}

const TonProvider: FC<TonProviderProps> = ({ children }) => (
  <TonConnectUIProvider manifestUrl={manifestUrl} actionsConfiguration={{ twaReturnUrl: window.location.origin as `${string}://${string}` }}>
    {children}
  </TonConnectUIProvider>
);

export default TonProvider;
