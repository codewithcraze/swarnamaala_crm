import { createTheme } from "@mui/material/styles";

// Enterprise, muted, serious palette: slate/blue-gray primary with a restrained
// indigo accent. Neutral grays for surfaces. Semantic colors kept conservative.
//
// The theme is compact by default: small inputs/buttons/chips, dense lists and
// menus, tighter table cells. Pages don't need to pass size="small" themselves.

const BORDER = "#e2e8f0"; // slate-200
const MUTED = "#64748b"; // slate-500
const SURFACE = "#f8fafc"; // slate-50

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
      default: SURFACE,
      paper: "#ffffff",
    },
    text: {
      primary: "#1e293b", // slate-800
      secondary: MUTED,
    },
    divider: BORDER,
    action: {
      hover: "rgba(15, 23, 42, 0.035)",
      selected: "rgba(79, 70, 229, 0.08)",
    },
  },
  typography: {
    fontFamily: '"Inter", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
    fontSize: 13,
    h1: { fontWeight: 700 },
    h2: { fontWeight: 700 },
    h3: { fontWeight: 700 },
    h4: { fontWeight: 700, fontSize: "1.3rem", letterSpacing: "-0.01em" },
    h5: { fontWeight: 600, fontSize: "1.1rem" },
    h6: { fontWeight: 600, fontSize: "0.95rem" },
    subtitle1: { color: MUTED },
    subtitle2: { color: MUTED, fontWeight: 500 },
    body1: { fontSize: "0.875rem" },
    body2: { fontSize: "0.8125rem" },
    caption: { fontSize: "0.75rem" },
    overline: { fontSize: "0.6875rem", lineHeight: 1.8 },
    button: { textTransform: "none", fontWeight: 600 },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: { backgroundColor: SURFACE },
      },
    },

    // --- Compact sizes by default ---
    MuiButton: {
      defaultProps: { disableElevation: true, size: "small" },
      styleOverrides: {
        root: { borderRadius: 6, paddingInline: 12 },
        sizeLarge: { paddingInline: 18 },
      },
    },
    MuiIconButton: { defaultProps: { size: "small" } },
    MuiTextField: { defaultProps: { size: "small" } },
    MuiFormControl: { defaultProps: { size: "small" } },
    MuiSelect: { defaultProps: { size: "small" } },
    MuiAutocomplete: { defaultProps: { size: "small" } },
    MuiToggleButton: {
      defaultProps: { size: "small" },
      styleOverrides: { root: { textTransform: "none", fontWeight: 600 } },
    },
    MuiCheckbox: { defaultProps: { size: "small" } },
    MuiRadio: { defaultProps: { size: "small" } },
    MuiSwitch: { defaultProps: { size: "small" } },
    MuiChip: {
      defaultProps: { size: "small" },
      styleOverrides: {
        root: { fontWeight: 600, borderRadius: 6 },
        sizeSmall: { height: 22, fontSize: 11.5 },
      },
    },
    MuiList: { defaultProps: { dense: true } },
    MuiListItemButton: { defaultProps: { dense: true } },
    MuiListItemIcon: {
      styleOverrides: { root: { "& .MuiSvgIcon-root": { fontSize: 20 } } },
    },
    MuiMenuItem: { defaultProps: { dense: true } },
    MuiToolbar: {
      styleOverrides: { regular: { minHeight: 56, "@media (min-width:600px)": { minHeight: 56 } } },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          backgroundColor: "#fff",
          "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#cbd5e1" },
        },
        notchedOutline: { borderColor: BORDER },
      },
    },

    // --- Surfaces ---
    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: "none" },
      },
    },
    MuiCard: {
      defaultProps: { variant: "outlined" },
      styleOverrides: {
        root: { borderColor: BORDER, borderRadius: 10 },
      },
    },
    MuiCardContent: {
      styleOverrides: {
        root: { padding: 16, "&:last-child": { paddingBottom: 16 } },
      },
    },
    MuiAppBar: {
      defaultProps: { elevation: 0, color: "inherit" },
      styleOverrides: {
        root: { borderBottom: `1px solid ${BORDER}`, backgroundColor: "#ffffff" },
      },
    },
    MuiDialog: {
      styleOverrides: { paper: { borderRadius: 12 } },
    },
    MuiDialogTitle: {
      styleOverrides: { root: { fontSize: "1rem", fontWeight: 600, padding: "14px 20px" } },
    },
    MuiDialogContent: {
      styleOverrides: { root: { padding: "16px 20px" } },
    },
    MuiDialogActions: {
      styleOverrides: { root: { padding: "10px 16px" } },
    },
    MuiAlert: {
      styleOverrides: {
        root: { borderRadius: 8, padding: "2px 12px", fontSize: "0.8125rem" },
      },
    },
    MuiTooltip: {
      styleOverrides: { tooltip: { fontSize: 11.5 } },
    },
    MuiTabs: {
      styleOverrides: { root: { minHeight: 40 } },
    },
    MuiTab: {
      styleOverrides: {
        root: { minHeight: 40, padding: "8px 14px", textTransform: "none", fontWeight: 600 },
      },
    },

    // --- Tables ---
    MuiTable: { defaultProps: { size: "small" } },
    MuiTableCell: {
      styleOverrides: {
        root: { borderColor: BORDER, padding: "7px 12px" },
        head: {
          fontWeight: 600,
          fontSize: 11,
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          color: MUTED,
          backgroundColor: SURFACE,
          whiteSpace: "nowrap",
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: { "&:last-child td": { borderBottom: 0 } },
      },
    },
    MuiTablePagination: {
      styleOverrides: {
        root: { borderTop: `1px solid ${BORDER}` },
        toolbar: { minHeight: 44, "@media (min-width:600px)": { minHeight: 44 } },
        selectLabel: { fontSize: 12 },
        displayedRows: { fontSize: 12 },
      },
    },
  },
});

export default theme;
