import type { FC, ReactNode } from "react";
import { useTonConnect } from "@/shared/ton/useTonConnect";
import WalletButton from "@/features/Wallet/WalletButton";
import Console from "@/features/Console/Console";
import { useConsoleLogger } from "@/features/Console/useConsoleLogger";
import styles from "./TerminalLayout.module.scss";

interface TerminalLayoutProps {
  children: ReactNode;
}

export const TerminalLayout: FC<TerminalLayoutProps> = ({ children }) => {
  const { isConnected } = useTonConnect();
  const { logs } = useConsoleLogger();

  return (
    <div className={styles.layout}>
      <header className={styles.header}>
        <div className={styles.logo}>TON SWAP TERMINAL</div>
        <div className={styles.status}>
          {isConnected ? "CONNECTED" : "DISCONNECTED"}
        </div>
        <WalletButton />
      </header>

      <div className={styles.leftPanel}>
        <h2 className={styles.panelTitle}>SWAP INTERFACE</h2>
        {children}
      </div>

      <div className={styles.rightPanel}>
        <div className={styles.consoleWrapper}>
          <Console logs={logs} />
        </div>
      </div>
    </div>
  );
};

export default TerminalLayout;
