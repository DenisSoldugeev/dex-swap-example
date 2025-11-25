import {
  createContext,
  useCallback,
  useContext,
  useState,
  type FC,
  type ReactNode,
} from "react";
import type { LogEntry, LogType } from "./Console";

interface ConsoleLoggerContextValue {
  logs: LogEntry[];
  addLog: (type: LogType, message: string) => void;
  clearLogs: () => void;
}

const ConsoleLoggerContext = createContext<ConsoleLoggerContextValue | null>(
  null,
);

export const ConsoleLoggerProvider: FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [logs, setLogs] = useState<LogEntry[]>([
    {
      id: "init",
      timestamp: new Date(),
      type: "info",
      message: "System initialized. Ready for operations.",
    },
  ]);

  const addLog = useCallback((type: LogType, message: string) => {
    const newLog: LogEntry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      timestamp: new Date(),
      type,
      message,
    };
    setLogs((prev) => [...prev, newLog]);
  }, []);

  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  return (
    <ConsoleLoggerContext.Provider value={{ logs, addLog, clearLogs }}>
      {children}
    </ConsoleLoggerContext.Provider>
  );
};

export const useConsoleLogger = () => {
  const context = useContext(ConsoleLoggerContext);
  if (!context) {
    throw new Error(
      "useConsoleLogger must be used within ConsoleLoggerProvider",
    );
  }
  return context;
};
