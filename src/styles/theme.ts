import { createTheme } from "@mantine/core";

export const theme = createTheme({
  primaryColor: "green",
  fontFamily:
    "'Fira Code', 'JetBrains Mono', 'Consolas', 'Monaco', 'Courier New', monospace",
  defaultRadius: "sm",
  colors: {
    dark: [
      "#3d4f5c",
      "#2d3f4c",
      "#1d2f3c",
      "#141819",
      "#0a0e0f",
      "#060809",
      "#040607",
      "#020405",
      "#010203",
      "#000000",
    ],
    green: [
      "#ccffe5",
      "#99ffcc",
      "#66ffb2",
      "#33ff99",
      "#00ff80",
      "#00ff41",
      "#00cc33",
      "#009926",
      "#006619",
      "#00330d",
    ],
  },
  black: "#0a0e0f",
  white: "#00ff41",
});
