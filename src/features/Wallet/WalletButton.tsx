import type { FC } from "react";
import { useEffect, useRef } from "react";
import { TonConnectButton, useTonWallet } from "@tonconnect/ui-react";
import { useConsoleLogger } from "@/features/Console/useConsoleLogger";
import styles from "./WalletButton.module.scss";

const formatAddress = (address: string) =>
  `${address.slice(0, 6)}...${address.slice(-4)}`;

const WalletButton: FC = () => {
  const wallet = useTonWallet();
  const address = wallet?.account?.address;
  const { addLog } = useConsoleLogger();
  const prevAddressRef = useRef<string | undefined>();

  useEffect(() => {
    const prevAddress = prevAddressRef.current;

    if (address && address !== prevAddress) {
      addLog("success", `Wallet connected: ${formatAddress(address)}`);
    } else if (!address && prevAddress) {
      addLog("warning", "Wallet disconnected");
    }

    prevAddressRef.current = address;
  }, [address, addLog]);

  return (
    <div className={styles.walletGroup}>
      {address && <div className={styles.address}>{formatAddress(address)}</div>}
      <TonConnectButton />
    </div>
  );
};

export default WalletButton;
