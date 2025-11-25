import "./polyfills"
import React from "react";
import ReactDOM from "react-dom/client";
import { MantineProvider } from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";
import TonProvider from "./ton/TonProvider";
import { RouterProvider } from "@tanstack/react-router";
import { queryClient, router } from "./router/config";
import { theme } from "./styles/theme";
import "./styles/global.scss";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <TonProvider>
        <MantineProvider theme={theme}>
          <Notifications />
          <RouterProvider router={router} />
          <ReactQueryDevtools initialIsOpen={false} />
        </MantineProvider>
      </TonProvider>
    </QueryClientProvider>
  </React.StrictMode>,
);
