import {decrypt, encrypt, getEncryptionPassword} from '@/shared/utils/crypto';
import {Address, Cell, SendMode} from '@ton/core';
import {mnemonicToPrivateKey} from '@ton/crypto';
import {internal, TonClient4, WalletContractV5R1} from '@ton/ton';
import {createContext, ReactNode, useCallback, useContext, useEffect, useState} from 'react';

interface WalletContextType {
  wallet: WalletContractV5R1 | null;
  address: string | null;
  isImported: boolean;
  importWallet: (mnemonic: string[]) => Promise<void>;
  clearWallet: () => void;
  sendTransaction: (params: {
    to: string;
    value: string;
    body?: string;
  }) => Promise<void>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

// Helper function for retry with exponential backoff
const retryWithBackoff = async <T,>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000,
): Promise<T> => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      const isRateLimitError = error?.response?.status === 429 || error?.message?.includes('429');
      const isLastRetry = i === maxRetries - 1;

      if (isLastRetry || !isRateLimitError) {
        throw error;
      }

      // Exponential backoff: 1s, 2s, 4s, 8s...
      const delay = baseDelay * Math.pow(2, i);
      console.log(`Rate limited. Retrying in ${delay}ms... (attempt ${i + 1}/${maxRetries})`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw new Error('Max retries reached');
};

// Use TonClient4 with public endpoint (more reliable)
const client = new TonClient4({
  endpoint: 'https://mainnet-v4.tonhubapi.com',
});

export const WalletProvider = ({ children }: { children: ReactNode }) => {
  const [wallet, setWallet] = useState<WalletContractV5R1 | null>(null);
  const [address, setAddress] = useState<string | null>(null);

  // Auto-load wallet from localStorage on mount
  useEffect(() => {
    const loadWallet = async () => {
      try {
        const encryptedMnemonic = localStorage.getItem('wallet_mnemonic_encrypted');
        if (!encryptedMnemonic) {
          return; // No wallet stored
        }

        // Decrypt mnemonic
        const password = getEncryptionPassword();
        const mnemonic = await decrypt<string[]>(encryptedMnemonic, password);

        // Generate keypair and wallet
        const keyPair = await mnemonicToPrivateKey(mnemonic);
        const workchain = 0;
        const walletContract = WalletContractV5R1.create({
          workchain,
          publicKey: keyPair.publicKey,
        });

        setWallet(walletContract);
        setAddress(walletContract.address.toString());
        console.log('✅ Wallet loaded from storage');
      } catch (error) {
        console.error('Failed to load wallet from storage:', error);
        // Clear corrupted data
        localStorage.removeItem('wallet_mnemonic_encrypted');
      }
    };

    loadWallet();
  }, []);

  const importWallet = useCallback(async (mnemonic: string[]) => {
    try {
      // Generate keypair from mnemonic
      const keyPair = await mnemonicToPrivateKey(mnemonic);

      // Create wallet contract V5R1
      const workchain = 0;
      const walletContract = WalletContractV5R1.create({
        workchain,
        publicKey: keyPair.publicKey,
      });

      // Store wallet info
      setWallet(walletContract);
      setAddress(walletContract.address.toString());

      // Encrypt and store in localStorage
      const password = getEncryptionPassword();
      const encryptedMnemonic = await encrypt(mnemonic, password);
      localStorage.setItem('wallet_mnemonic_encrypted', encryptedMnemonic);

      console.log('✅ Wallet imported and encrypted successfully');
    } catch (error) {
      console.error('Failed to import wallet:', error);
      throw new Error('Invalid mnemonic phrase');
    }
  }, []);

  const clearWallet = useCallback(() => {
    setWallet(null);
    setAddress(null);
    localStorage.removeItem('wallet_mnemonic_encrypted');
    console.log('✅ Wallet cleared');
  }, []);

  const sendTransaction = useCallback(
    async (params: { to: string; value: string; body?: string }) => {
      if (!wallet || !address) {
        throw new Error('Wallet not imported');
      }

      return retryWithBackoff(async () => {
        // Get encrypted mnemonic from localStorage
        const encryptedMnemonic = localStorage.getItem('wallet_mnemonic_encrypted');
        if (!encryptedMnemonic) {
          throw new Error('Encrypted mnemonic not found in storage');
        }

        // Decrypt mnemonic
        const password = getEncryptionPassword();
        const mnemonic = await decrypt<string[]>(encryptedMnemonic, password);
        const keyPair = await mnemonicToPrivateKey(mnemonic);

        // Use TonClient4 provider for wallet operations
        const contract = client.open(wallet);

        // Get seqno
        const seqno = await contract.getSeqno();

        // Parse body if provided
        let body = undefined;
        if (params.body) {
          const { Cell } = await import('@ton/core');
          body = Cell.fromBase64(params.body);
        }

        // Build and sign transaction externally
        const transfer = await wallet.createTransfer({
          seqno,
          secretKey: keyPair.secretKey,
          messages: [
            internal({
              to: Address.parse(params.to),
              value: BigInt(params.value),
              body: body,
            }),
          ],
          sendMode: SendMode.PAY_GAS_SEPARATELY,
        });

        // Send BOC via TonHub API (public, no API key needed, reliable)
        const boc = transfer.toBoc().toString('base64');

        const response = await fetch('https://mainnet-v4.tonhubapi.com/sendBoc', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ boc }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Transaction send failed: ${response.status} ${errorText}`);
        }

        return await response.json();
      }, 3, 3000); // 3 retries, starting with 3s delay
    },
    [wallet, address],
  );

  return (
    <WalletContext.Provider
      value={{
        wallet,
        address,
        isImported: !!wallet,
        importWallet,
        clearWallet,
        sendTransaction,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within WalletProvider');
  }
  return context;
};