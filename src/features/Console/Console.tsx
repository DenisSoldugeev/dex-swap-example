import type { FC } from "react";
import { useEffect, useRef } from "react";
import { Paper, Stack, Text, Group, ScrollArea, Box } from "@mantine/core";
import classes from "./Console.module.css";

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

const LOG_TYPE_COLORS: Record<LogType, string> = {
  info: "cyan",
  success: "terminalGreen.5",
  error: "red",
  warning: "yellow",
};

export const Console: FC<ConsoleProps> = ({ logs, title = "SYSTEM LOGS" }) => {
  const viewport = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (viewport.current) {
      viewport.current.scrollTo({
        top: viewport.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [logs]);

  return (
    <Paper
      h="100%"
      bg="terminalDark.5"
      withBorder
      radius="sm"
      style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}
    >
      <Group
        gap="xs"
        p="md"
        bg="terminalDark.6"
        style={{ borderBottom: "1px solid var(--mantine-color-terminalGreen-5)" }}
      >
        <Text c="terminalGreen.5" size="sm" fw={700} tt="uppercase" className={classes.glow}>
          &gt;
        </Text>
        <Text c="terminalGreen.5" size="sm" fw={700} tt="uppercase" style={{ letterSpacing: "0.1em" }}>
          {title}
        </Text>
      </Group>

      <ScrollArea viewportRef={viewport} h="100%" p="md">
        <Stack gap="xs">
          {logs.length === 0 ? (
            <Text c="dimmed" ta="center" fs="italic" py="xl">
              ~ Waiting for system events... ~
            </Text>
          ) : (
            logs.map((log, index) => (
              <Group key={log.id} gap="md" wrap="nowrap" align="flex-start" className={classes.fadeIn}>
                <Text c="dimmed" size="xs" style={{ flexShrink: 0, userSelect: "none" }}>
                  {formatTime(log.timestamp)}
                </Text>
                <Text
                  c={LOG_TYPE_COLORS[log.type]}
                  size="xs"
                  fw={700}
                  tt="uppercase"
                  style={{ flexShrink: 0, userSelect: "none", minWidth: "60px" }}
                >
                  [{log.type}]
                </Text>
                <Text c="terminalGreen.5" size="xs" style={{ wordBreak: "break-word", flex: 1 }}>
                  {log.message.split(' ').map((word, i) => {
                    if (word.startsWith('http://') || word.startsWith('https://')) {
                      return (
                        <Text
                          key={i}
                          component="a"
                          href={word}
                          target="_blank"
                          rel="noopener noreferrer"
                          c="cyan"
                          td="underline"
                          style={{ cursor: 'pointer' }}
                        >
                          {word}{' '}
                        </Text>
                      );
                    }
                    return word + ' ';
                  })}
                  {index === logs.length - 1 && <Box component="span" className={classes.cursor} />}
                </Text>
              </Group>
            ))
          )}
        </Stack>
      </ScrollArea>
    </Paper>
  );
};

export default Console;
