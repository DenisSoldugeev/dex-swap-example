import type { FC } from "react";
import { useEffect, useRef } from "react";
import styles from "./Console.module.scss";

export type LogType = "info" | "success" | "error" | "warning";

export interface LogEntry {
  id: string;
  timestamp: Date;
  type: LogType;
  message: string;
}

interface ConsoleProps {
  logs: LogEntry[];
  title?: string;
}

const formatTime = (date: Date): string => {
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  return `${hours}:${minutes}:${seconds}`;
};

export const Console: FC<ConsoleProps> = ({ logs, title = "SYSTEM LOGS" }) => {
  const outputRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className={styles.console}>
      <div className={styles.header}>
        <h2 className={styles.title}>{title}</h2>
      </div>
      <div className={styles.output} ref={outputRef}>
        {logs.length === 0 ? (
          <div className={styles.empty}>Waiting for system events...</div>
        ) : (
          logs.map((log) => (
            <div key={log.id} className={styles.logEntry}>
              <span className={styles.timestamp}>{formatTime(log.timestamp)}</span>
              <span className={`${styles.type} ${styles[log.type]}`}>
                [{log.type}]
              </span>
              <span className={styles.message}>
                {log.message}
                <span className={styles.cursor} />
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Console;
