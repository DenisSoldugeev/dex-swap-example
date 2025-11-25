import { useTonConnectUI, useTonWallet } from '@tonconnect/ui-react';

export interface TonConnectState {
  walletAddress?: string;
  isConnected: boolean;
  sendTransaction: ReturnType<typeof useTonConnectUI>[0]['sendTransaction'];
}

// Hook that exposes TON Connect state and a sender helper for tx submission.
export const useTonConnect = (): TonConnectState => {
  const [tonConnectUI] = useTonConnectUI();
  const wallet = useTonWallet();

  return {
    walletAddress: wallet?.account?.address,
    isConnected: Boolean(wallet?.account),
    sendTransaction: tonConnectUI.sendTransaction,
  };
};
