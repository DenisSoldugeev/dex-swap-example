import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { TanStackRouterVite } from "@tanstack/router-vite-plugin";

// Vite config with React SWC for fast HMR and TS support
export default defineConfig({
  plugins: [
    TanStackRouterVite({
      routesDirectory: "./src/router/routes",
      generatedRouteTree: "./src/router/routeTree.gen.ts",
    }),
    react(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  server: {
    host: true,
    port: 5190,
    allowedHosts: ["localhost", "veritably-stellar-batfish.cloudpub.ru"], // adjust as needed
  },
  css: {
    modules: {
      localsConvention: "camelCaseOnly",
    },
  },
});
