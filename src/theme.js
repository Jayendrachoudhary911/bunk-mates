// theme.js
import { createTheme } from "@mui/material/styles";
import { themeColors } from "./elements/themeColors";
import {
  keyframes,
} from "@mui/material"; 

export function getTheme(mode = "dark", accent = "default") {
  let base = { ...themeColors[mode] };

const accents = {
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
    bg: "#c8e6c9ff",
    bgr: "#c8e6c9",
    card: "#f1f8e9",
    shades: ["#E8F5E9", "#A5D6A7", "#66BB6A", "#43A047", "#1B5E20"],
  },
  orange: {
    main: "#f4cc9aff",
    maintxt: "#f9971f",
    mainbg: "#f9971f60",
    select: "#f9971f30",
    bg: "#ffdeb6ff",
    bgr: "#ffeed9ff",
    card: "#d7c7b4ff",
    shades: ["#FFF3E0", "#FFCC80", "#FFA726", "#FB8C00", "#E65100"],
  },
  turquoise: {
    main: "#00bcd6",
    maintxt: "#0098adff",
    mainbg: "#00cfea56",
    select: "#00cfea30",
    bg: "#b6f6ffff",
    bgr: "#c0f7ffec",
    card: "#E0F7FA",
    shades: ["#E0F7FA", "#80DEEA", "#26C6DA", "#00ACC1", "#006064"],
  },
  skyblue: {
    main: "#24baff",
    maintxt: "#009de6ff",
    mainbg: "#81D4FA70",
    select: "#81D4FA30",
    bg: "#ace5ffff",
    bgr: "#caeeffff",
    card: "#E1F5FE",
    shades: ["#E1F5FE", "#81D4FA", "#29B6F6", "#039BE5", "#01579B"],
  },
  gray: {
    main: "#818181ff",
    maintxt: "#4e4e4eff",
    mainbg: "#8080800b",
    select: "#f1f1f121",
    bg: "#d4d4d4ff",
    bgr: "#d4d4d4ff",
    card: "#E8F5E9",
    shades: ["#e2ffe4ff", "#A5D6A7", "#66BB6A", "#4CAF50", "#2E7D32"],
  },

  // 🌟 New funky, jolly, bright themes 🌟
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

  const fadeIn = keyframes`
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  `;

  const theme = createTheme({
    palette: {
      mode: "dark",
      background: {
        default: "#02020200", // almost transparent black for main background
        paper: "#0c0c0c", // deep black for dialogs/paper
        card: "#0c0c0c",
      },
      primary: {
        main: "#ffffffff", // bright green solid for buttons and accents
        contrastText: "#000000", // black text on bright green buttons
      },
      secondary: {
        main: "#444444ea", // dark grey with transparency for popups or secondary backgrounds
      },
      text: {
        primary: "#FFFFFF", // pure white for main text
        secondary: "#BDBDBD", // light grey for secondary text
        disabled: "#f0f0f0", // off-white for less prominent text or backgrounds
      },
      action: {
        hover: "#b6b6b6ff", // bright green hover for interactive elements
        selected: "#131313", // dark black for selected states
        disabledBackground: "rgba(0,155,89,0.16)", // dark green transparent backgrounds for outlines
        disabled: "#BDBDBD",
      },
      divider: "rgb(24, 24, 24)", // very dark grey for borders
    },
    typography: {
      fontFamily: "Roboto, Arial, sans-serif",
      h6: {
        fontWeight: "bold",
        color: "#FFFFFF",
      },
      body1: {
        fontSize: "1rem",
        lineHeight: "1.5",
        color: "#FFFFFF",
      },
      body2: {
        fontSize: "0.875rem",
        color: "#BDBDBD",
      },
    },
    shape: {
      borderRadius: 12,
    },
    components: {
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundColor: "#0c0c0c40",
            backdropFilter: "blur(40px)", // dark grey/black for app bar background
            boxShadow: "none",
            borderBottom: "1px solid rgb(24, 24, 24, 0.5)",
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            backgroundColor: "#2c2c2c00",
            color: "#FFFFFF",
            boxShadow: "none",
            backgroundImage: "none",
            borderRadius: 16,
            transition: "box-shadow 0.3s ease, transform 0.3s ease",
            cursor: "pointer",
            "&:hover": {
              transform: "translateY(-4px)",
              backgroundColor: "#131313",
            },
            animation: `${fadeIn} 0.6s ease forwards`,
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: "none",
            fontWeight: 600,
            borderRadius: "12px",
            transition: "background-color 0.3s ease, box-shadow 0.3s ease",
            color: "#000",
            backgroundColor: "#fff",
            "&:hover": {
              backgroundColor: "#000",
              color: "#fff",
            },
          },
        },
      },
      MuiAvatar: {
        styleOverrides: {
          root: {
            backgroundColor: "#f0f0f0", // off-white avatar background
            color: "#000",
          },
        },
      },
      MuiMenu: {
        styleOverrides: {
          paper: {
            backgroundColor: "#0c0c0c40", // deep black menu background
            color: "#FFFFFF",
            backdropFilter: "blur(40px)",
            borderRadius: 10,
            border: "1px solid rgb(24, 24, 24)",
          },
        },
      },
      MuiMenuItem: {
        styleOverrides: {
          root: {
            "&:hover": {
              backgroundColor: "#2c2c2c", // translucent dark green hover
            },
          },
        },
      },
      MuiBox: {
        styleOverrides: {
          root: {
            // General box overrides if needed
          },
        },
      },
    },
  });

  if (accent !== "default" && base.palette && accents[accent]) {
    const accentColors = accents[accent];
    base.palette.primary = {
      ...base.palette.primary,
      ...accentColors,
    };
  }

  return createTheme(base);
}
