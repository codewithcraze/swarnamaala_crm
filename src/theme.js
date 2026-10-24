import { createTheme } from "@mui/material/styles";

// Enterprise, muted, serious palette: slate/blue-gray primary with a restrained
// indigo accent. Neutral grays for surfaces. Semantic colors kept conservative.
const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#334155", // slate-700
      light: "#475569",
      dark: "#1e293b",
      contrastText: "#ffffff",
    },
    secondary: {
      main: "#4f46e5", // indigo-600 (restrained accent)
      light: "#6366f1",
      dark: "#4338ca",
      contrastText: "#ffffff",
    },
    success: { main: "#15803d", light: "#dcfce7", dark: "#166534" },
    warning: { main: "#b45309", light: "#fef3c7", dark: "#92400e" },
    error: { main: "#b91c1c", light: "#fee2e2", dark: "#991b1b" },
    info: { main: "#0369a1", light: "#e0f2fe", dark: "#075985" },
    background: {
      default: "#f8fafc", // slate-50
      paper: "#ffffff",
    },
    text: {
      primary: "#1e293b", // slate-800
      secondary: "#64748b", // slate-500
    },
    divider: "#e2e8f0", // slate-200
  },
  typography: {
    fontFamily:
      '"Inter", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
    h1: { fontWeight: 700 },
    h2: { fontWeight: 700 },
    h3: { fontWeight: 700 },
    h4: { fontWeight: 700, fontSize: "1.5rem" },
    h5: { fontWeight: 600, fontSize: "1.25rem" },
    h6: { fontWeight: 600, fontSize: "1.05rem" },
    subtitle1: { color: "#64748b" },
    subtitle2: { color: "#64748b", fontWeight: 500 },
    button: { textTransform: "none", fontWeight: 600 },
  },
  shape: {
    borderRadius: 10,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: { backgroundColor: "#f8fafc" },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: { borderRadius: 8 },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: "none" },
      },
    },
    MuiCard: {
      defaultProps: { variant: "outlined" },
      styleOverrides: {
        root: {
          borderColor: "#e2e8f0",
          borderRadius: 12,
        },
      },
    },
    MuiAppBar: {
      defaultProps: { elevation: 0, color: "inherit" },
      styleOverrides: {
        root: {
          borderBottom: "1px solid #e2e8f0",
          backgroundColor: "#ffffff",
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          fontWeight: 600,
          fontSize: 12,
          textTransform: "uppercase",
          letterSpacing: "0.04em",
          color: "#64748b",
          backgroundColor: "#f8fafc",
        },
        root: {
          borderColor: "#e2e8f0",
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 600 },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: { borderRadius: 8 },
      },
    },
  },
});

export default theme;
