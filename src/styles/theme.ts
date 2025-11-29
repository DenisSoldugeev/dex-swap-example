import {createTheme, MantineColorsTuple} from "@mantine/core";

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
  "#4a5568",
  "#3a4556",
  "#2d3748",
  "#252d3a",
  "#1a202c", // primary dark - dark gray, not black
  "#171d28",
  "#141924",
  "#111520",
  "#0e111c",
  "#0a0d18",
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
  black: "#1a202c",

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
          border: "2px solid",
          transition: "all 0.2s ease",
          "&:hover": {
            transform: "translateY(-2px)",
            boxShadow: "0 4px 12px rgba(0, 255, 65, 0.3)",
          },
        },
      },
    },
    TextInput: {
      styles: {
        input: {
          fontFamily: "'Fira Code', 'JetBrains Mono', monospace",
          backgroundColor: "#252d3a",
          border: "1px solid #3a4556",
          color: "#00ff41",
          transition: "all 0.2s ease",
          "&:focus": {
            borderColor: "#00ff41",
            boxShadow: "0 0 0 1px #00ff41",
          },
          "&::placeholder": {
            color: "#4a5568",
          },
        },
        label: {
          color: "#00ff41",
        },
      },
    },
    NumberInput: {
      styles: {
        input: {
          fontFamily: "'Fira Code', 'JetBrains Mono', monospace",
          backgroundColor: "#252d3a",
          border: "1px solid #3a4556",
          color: "#00ff41",
          transition: "all 0.2s ease",
          "&:focus": {
            borderColor: "#00ff41",
            boxShadow: "0 0 0 1px #00ff41",
          },
          "&::placeholder": {
            color: "#4a5568",
          },
        },
        label: {
          color: "#00ff41",
        },
      },
    },
    Select: {
      styles: {
        input: {
          fontFamily: "'Fira Code', 'JetBrains Mono', monospace",
          backgroundColor: "#252d3a",
          border: "1px solid #3a4556",
          color: "#00ff41",
          transition: "all 0.2s ease",
          "&:focus": {
            borderColor: "#00ff41",
            boxShadow: "0 0 0 1px #00ff41",
          },
          "&::placeholder": {
            color: "#4a5568",
          },
        },
        label: {
          color: "#00ff41",
        },
        dropdown: {
          backgroundColor: "#252d3a",
          border: "1px solid #3a4556",
        },
        option: {
          color: "#00ff41",
          "&[data-combobox-selected]": {
            backgroundColor: "#2d3748",
          },
          "&:hover": {
            backgroundColor: "#2d3748",
          },
        },
      },
    },
    Paper: {
      defaultProps: {
        p: "md",
        withBorder: true,
      },
      styles: {
        root: {
          backgroundColor: "#252d3a",
          borderColor: "#3a4556",
        },
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
