import { createTheme, MantineColorsTuple } from "@mantine/core";

const terminalGreen: MantineColorsTuple = [
  "#ccffe5",
  "#99ffcc",
  "#66ffb2",
  "#33ff99",
  "#00ff80",
  "#00ff41", // primary
  "#00cc33",
  "#009926",
  "#006619",
  "#00330d",
];

const terminalDark: MantineColorsTuple = [
  "#3d4f5c",
  "#2d3f4c",
  "#1d2f3c",
  "#141819",
  "#0a0e0f", // primary dark
  "#060809",
  "#040607",
  "#020405",
  "#010203",
  "#000000",
];

export const theme = createTheme({
  primaryColor: "terminalGreen",
  fontFamily:
    "'Fira Code', 'JetBrains Mono', 'Consolas', 'Monaco', 'Courier New', monospace",
  defaultRadius: "lg",
  colors: {
    terminalGreen,
    terminalDark,
  },
  black: "#0a0e0f",

  // Global component defaults
  components: {
    Button: {
      defaultProps: {
        variant: "outline",
      },
      styles: {
        root: {
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.05em",
        },
      },
    },
    TextInput: {
      styles: {
        input: {
          fontFamily: "'Fira Code', 'JetBrains Mono', monospace",
        },
      },
    },
    NumberInput: {
      styles: {
        input: {
          fontFamily: "'Fira Code', 'JetBrains Mono', monospace",
        },
      },
    },
    Paper: {
      defaultProps: {
        p: "md",
        withBorder: true,
      },
    },
  },

  // Other theme tokens
  spacing: {
    xs: "0.25rem",
    sm: "0.5rem",
    md: "1rem",
    lg: "1.5rem",
    xl: "2rem",
  },
});
