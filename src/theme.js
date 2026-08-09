// theme.js
import { createTheme } from "@mui/material/styles";
import { keyframes } from "@mui/material";

/**
 * 🎨 Common Theme Colors for BunkMate
 * Matches the signature color palette and glass design language of Notes & Trips.
 */
export const themeColors = {
  dark: {
    palette: {
      mode: "dark",
      background: {
        default: "#060606",
        paper: "#0c0c0c",
        main: "rgba(0, 0, 0, 0.65)",
        card: "rgba(30, 30, 30, 0.22)",
        surface: "rgba(20, 20, 20, 0.75)",
      },
      primary: {
        main: "#ffffff",
        contrastText: "#000000",
        bg: "rgba(255, 255, 255, 0.08)",
        mainbg: "rgba(255, 255, 255, 0.12)",
        maintxt: "#ffffff",
        bgr: "rgba(255, 255, 255, 0.05)",
        card: "rgba(30, 30, 30, 0.22)",
      },
      secondary: {
        main: "#444444ea",
        contrastText: "#ffffff",
      },
      success: {
        main: "#4ADE80",
        contrastText: "#000000",
      },
      info: {
        main: "#38BDF8",
        contrastText: "#000000",
      },
      warning: {
        main: "#F59E0B",
        contrastText: "#000000",
      },
      error: {
        main: "#FF5252",
        contrastText: "#ffffff",
      },
      text: {
        primary: "#FFFFFF",
        secondary: "rgba(255, 255, 255, 0.7)",
        disabled: "rgba(255, 255, 255, 0.4)",
        muted: "rgba(255, 255, 255, 0.4)",
      },
      action: {
        hover: "rgba(255, 255, 255, 0.08)",
        selected: "#131313",
        disabledBackground: "rgba(255, 255, 255, 0.04)",
        disabled: "rgba(255, 255, 255, 0.3)",
      },
      divider: "rgba(255, 255, 255, 0.08)",
    },
  },
  light: {
    palette: {
      mode: "light",
      background: {
        default: "#F0F2F5",
        paper: "#ffffff",
        main: "rgba(255, 255, 255, 0.8)",
        card: "rgba(255, 255, 255, 0.4)",
        surface: "rgba(255, 255, 255, 0.55)",
      },
      primary: {
        main: "#000000",
        contrastText: "#ffffff",
        bg: "rgba(0, 0, 0, 0.04)",
        mainbg: "rgba(0, 0, 0, 0.08)",
        maintxt: "#000000",
        bgr: "rgba(0, 0, 0, 0.03)",
        card: "rgba(255, 255, 255, 0.4)",
      },
      secondary: {
        main: "#e0e0e0",
        contrastText: "#000000",
      },
      success: {
        main: "#22c55e",
        contrastText: "#ffffff",
      },
      info: {
        main: "#0284c7",
        contrastText: "#ffffff",
      },
      warning: {
        main: "#d97706",
        contrastText: "#ffffff",
      },
      error: {
        main: "#dc2626",
        contrastText: "#ffffff",
      },
      text: {
        primary: "#111111",
        secondary: "rgba(0, 0, 0, 0.7)",
        disabled: "rgba(0, 0, 0, 0.4)",
        muted: "rgba(0, 0, 0, 0.4)",
      },
      action: {
        hover: "rgba(0, 0, 0, 0.05)",
        selected: "rgba(0, 0, 0, 0.08)",
        disabledBackground: "rgba(0, 0, 0, 0.04)",
        disabled: "rgba(0, 0, 0, 0.26)",
      },
      divider: "rgba(0, 0, 0, 0.06)",
    },
  },
};

/**
 * 🌟 Accent color palettes
 */
export const accents = {
  blue: {
    main: "#9fcfff",
    maintxt: "#1976d2",
    mainbg: "#1976d260",
    select: "#1976d230",
    bg: "#bbdefb",
    bgr: "#bbdefb",
    card: "#e3f2fd",
    shades: ["#E3F2FD", "#90CAF9", "#42A5F5", "#1976D2", "#0D47A1"],
  },
  green: {
    main: "#6ac16e",
    maintxt: "#43a047",
    mainbg: "#43a04760",
    select: "#43a04730",
    bg: "#c8e6c9",
    bgr: "#c8e6c9",
    card: "#f1f8e9",
    shades: ["#E8F5E9", "#A5D6A7", "#66BB6A", "#43A047", "#1B5E20"],
  },
  orange: {
    main: "#f4cc9a",
    maintxt: "#f9971f",
    mainbg: "#f9971f60",
    select: "#f9971f30",
    bg: "#ffdeb6",
    bgr: "#ffeed9",
    card: "#d7c7b4",
    shades: ["#FFF3E0", "#FFCC80", "#FFA726", "#FB8C00", "#E65100"],
  },
  turquoise: {
    main: "#00bcd6",
    maintxt: "#0098adff",
    mainbg: "#00cfea56",
    select: "#00cfea30",
    bg: "#b6f6ff",
    bgr: "#c0f7ffec",
    card: "#E0F7FA",
    shades: ["#E0F7FA", "#80DEEA", "#26C6DA", "#00ACC1", "#006064"],
  },
  skyblue: {
    main: "#24baff",
    maintxt: "#009de6ff",
    mainbg: "#81D4FA70",
    select: "#81D4FA30",
    bg: "#ace5ff",
    bgr: "#caeeffff",
    card: "#E1F5FE",
    shades: ["#E1F5FE", "#81D4FA", "#29B6F6", "#039BE5", "#01579B"],
  },
  gray: {
    main: "#969696",
    maintxt: "#7d7d7dff",
    mainbg: "#8080800b",
    select: "#f1f1f121",
    bg: "#d4d4d4",
    bgr: "#d4d4d4ff",
    card: "#E8F5E9",
    shades: ["#e2ffe4ff", "#A5D6A7", "#66BB6A", "#4CAF50", "#2E7D32"],
  },
  yellow: {
    main: "#ffe501ff",
    maintxt: "#fbc02d",
    mainbg: "#ffeb3b60",
    select: "#ffeb3b30",
    bg: "#fff9c4",
    bgr: "#fffde7",
    card: "#fffde7",
    shades: ["#FFFDE7", "#FFF59D", "#FFEE58", "#FBC02D", "#F57F17"],
  },
  coral: {
    main: "#ff7043",
    maintxt: "#e64a19",
    mainbg: "#ff704360",
    select: "#ff704330",
    bg: "#ffccbc",
    bgr: "#ffe0b2",
    card: "#fbe9e7",
    shades: ["#FBE9E7", "#FFAB91", "#FF7043", "#F4511E", "#BF360C"],
  },
  lime: {
    main: "#cddc39",
    maintxt: "#afb42b",
    mainbg: "#cddc3960",
    select: "#cddc3930",
    bg: "#f0f4c3",
    bgr: "#f9fbe7",
    card: "#f9fbe7",
    shades: ["#F9FBE7", "#E6EE9C", "#D4E157", "#AFB42B", "#827717"],
  },
  aqua: {
    main: "#40e0d0",
    maintxt: "#00897b",
    mainbg: "#40e0d060",
    select: "#40e0d030",
    bg: "#b2fef7",
    bgr: "#e0f7fa",
    card: "#e0f2f1",
    shades: ["#E0F2F1", "#80CBC4", "#4DB6AC", "#26A69A", "#004D40"],
  },
  red: {
    main: "#ff5252",
    maintxt: "#d32f2f",
    mainbg: "#ff525260",
    select: "#ff525230",
    bg: "#ffcdd2",
    bgr: "#ffebee",
    card: "#ffebee",
    shades: ["#FFEBEE", "#EF9A9A", "#E57373", "#F44336", "#B71C1C"],
  },
};

export const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

/**
 * 🚀 Build unified Material-UI Theme
 */
export function getTheme(mode = "dark", accent = "default") {
  const isDark = mode === "dark";
  const basePalette = JSON.parse(JSON.stringify(themeColors[mode]?.palette || themeColors.dark.palette));

  if (accent !== "default" && accents[accent]) {
    const accentColors = accents[accent];
    basePalette.primary = {
      ...basePalette.primary,
      ...accentColors,
    };
  }

  return createTheme({
    palette: basePalette,
    typography: {
      fontFamily: '"Outfit", "Roboto", "Arial", sans-serif',
      h6: {
        fontWeight: "bold",
        color: basePalette.text.primary,
      },
      body1: {
        fontSize: "1rem",
        lineHeight: 1.5,
        color: basePalette.text.primary,
      },
      body2: {
        fontSize: "0.875rem",
        color: basePalette.text.secondary,
      },
    },
    shape: {
      borderRadius: 4,
    },
    components: {
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundColor: isDark ? "rgba(12, 12, 12, 0)" : "rgba(255, 255, 255, 0)",
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            backgroundColor: isDark ? "rgba(30, 30, 30, 0.22)" : "rgba(255, 255, 255, 0.4)",
            backdropFilter: "blur(22px)",
            WebkitBackdropFilter: "blur(22px)",
            color: basePalette.text.primary,
            boxShadow: isDark
              ? "inset 0 1px 2px rgba(255, 255, 255, 0.11), inset 0 -1px 1px rgba(35, 35, 35, 0.07)"
              : "inset 0 1px 1px rgba(255, 255, 255, 0.8), inset 0 -1px 1px rgba(0, 0, 0, 0.1)",
            backgroundImage: "none",
            borderRadius: 6,
            border: `1px solid ${isDark ? "rgba(255, 255, 255, 0.04)" : "rgba(0, 0, 0, 0.03)"}`,
            transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
            willChange: "transform, box-shadow",
            "&:hover": {
              transform: "translateY(-2px)",
              boxShadow: "0 8px 24px rgba(0, 0, 0, 0.12)",
            },
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: "none",
            fontWeight: 600,
            borderRadius: 24,
            transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
            color: isDark ? "#000000" : "#ffffff",
            backgroundColor: isDark ? "#ffffff" : "#000000",
            "&:hover": {
              backgroundColor: isDark ? "#f0f0f0" : "#1a1a1a",
              transform: "translateY(-1px)",
            },
          },
        },
      },
      MuiAvatar: {
        styleOverrides: {
          root: {
            backgroundColor: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.06)",
            color: basePalette.text.primary,
          },
        },
      },
      MuiMenu: {
        styleOverrides: {
          paper: {
            backgroundColor: isDark ? "rgba(22, 22, 22, 0.85)" : "rgba(255, 255, 255, 0.9)",
            color: basePalette.text.primary,
            backdropFilter: "blur(30px) saturate(160%)",
            WebkitBackdropFilter: "blur(30px) saturate(160%)",
            borderRadius: 16,
            border: `1px solid ${basePalette.divider}`,
            boxShadow: isDark ? "0 12px 32px rgba(0, 0, 0, 0.7)" : "0 12px 32px rgba(0, 0, 0, 0.12)",
          },
        },
      },
      MuiMenuItem: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            margin: "2px 6px",
            "&:hover": {
              backgroundColor: isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.05)",
            },
          },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            backgroundColor: isDark ? "rgba(20, 20, 20, 0.75)" : "rgba(255, 255, 255, 0.55)",
            backdropFilter: "blur(30px) saturate(160%)",
            WebkitBackdropFilter: "blur(30px) saturate(160%)",
            borderRadius: 24,
            border: `1px solid ${basePalette.divider}`,
            backgroundImage: "none",
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            backgroundColor: isDark ? "rgba(20, 20, 20, 0.75)" : "rgba(255, 255, 255, 0.55)",
            backdropFilter: "blur(30px) saturate(160%)",
            WebkitBackdropFilter: "blur(30px) saturate(160%)",
            backgroundImage: "none",
            color: basePalette.text.primary,
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: 16,
            fontWeight: 500,
            backdropFilter: "blur(10px)",
            WebkitBackdropFilter: "blur(10px)",
          },
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: 14,
            transition: "all 0.2s ease-in-out",
            "& fieldset": {
              borderColor: basePalette.divider,
            },
            "&:hover fieldset": {
              borderColor: isDark ? "rgba(255, 255, 255, 0.25)" : "rgba(0, 0, 0, 0.2)",
            },
          },
        },
      },
    },
  });
}

export default getTheme;
