import React from "react";
import { Box, Card, Button, TextField, InputAdornment } from "@mui/material";
import { motion, AnimatePresence } from "framer-motion";
import { Search } from "../icons";

/**
 * Common Design Tokens used across the entire BunkMate project.
 * Derived from the signature design language of Notes and Trips pages.
 */
export const designTokens = {
  dark: {
    bg: "#060606",
    surface: "rgba(20, 20, 20, 0.75)",
    surfaceMuted: "rgba(25, 25, 25, 0.45)",
    cardBg: "rgba(30, 30, 30, 0.22)",
    cardHoverBg: "rgba(35, 35, 35, 0.35)",
    inputBg: "rgba(0, 0, 0, 0.2)",
    inputHoverBg: "rgba(255, 255, 255, 0.08)",
    border: "rgba(255, 255, 255, 0.08)",
    borderSubtle: "rgba(255, 255, 255, 0.04)",
    textPrimary: "#FFFFFF",
    textSecondary: "rgba(255, 255, 255, 0.7)",
    textMuted: "rgba(255, 255, 255, 0.4)",
    innerGlow: "rgba(255, 255, 255, 0.11)",
    glassSpecular: "linear-gradient(135deg, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0.01) 100%)",
    glassMelt: "linear-gradient(180deg, rgba(255, 255, 255, 0.05) 0%, rgba(0, 0, 0, 0.6) 100%)",
    scrim: "linear-gradient(to bottom, rgba(6, 6, 6, 0.9) 0%, rgba(6, 6, 6, 0.4) 70%, transparent 100%)",
    insetShadow: "inset 0 1px 2px rgba(255, 255, 255, 0.11), inset 0 -1px 1px rgba(35, 35, 35, 0.07)",
    drawerShadow: "inset 0 1px 2px rgba(255, 255, 255, 0.11), inset 0 -1px 1px rgba(35, 35, 35, 0.07), 0 20px 50px rgba(0,0,0,0.5)",
  },
  light: {
    bg: "#F0F2F5",
    surface: "rgba(255, 255, 255, 0.55)",
    surfaceMuted: "rgba(255, 255, 255, 0.35)",
    cardBg: "rgba(255, 255, 255, 0.4)",
    cardHoverBg: "rgba(255, 255, 255, 0.6)",
    inputBg: "rgba(255, 255, 255, 0.2)",
    inputHoverBg: "rgba(0, 0, 0, 0.05)",
    border: "rgba(0, 0, 0, 0.06)",
    borderSubtle: "rgba(0, 0, 0, 0.03)",
    textPrimary: "#111111",
    textSecondary: "rgba(0, 0, 0, 0.7)",
    textMuted: "rgba(0, 0, 0, 0.4)",
    innerGlow: "rgba(255, 255, 255, 0.8)",
    glassSpecular: "linear-gradient(135deg, rgba(255, 255, 255, 0.7) 0%, rgba(0, 0, 0, 0.02) 100%)",
    glassMelt: "linear-gradient(180deg, rgba(255, 255, 255, 0.4) 0%, rgba(0, 0, 0, 0.05) 100%)",
    scrim: "linear-gradient(to bottom, rgba(240, 242, 245, 0.9) 0%, rgba(240, 242, 245, 0.4) 70%, transparent 100%)",
    insetShadow: "inset 0 1px 1px rgba(255,255,255,0.8), inset 0 -1px 1px rgba(0,0,0,0.1)",
    drawerShadow: "inset 0 1px 1px rgba(255, 255, 255, 0.8), inset 0 -1px 1px rgba(0, 0, 0, 0.1), 0 20px 50px rgba(0,0,0,0.05)",
  },
  radii: {
    card: 6, // 24px in 4px MUI scale
    cardLg: 8, // 32px
    cardSm: 4, // 16px
    drawer: 8, // 32px
    button: 8, // 32px pill
    buttonPill: "35px",
    input: 8,
    chip: 4,
    dragHandle: 999,
  },
  blurs: {
    glass: "blur(22px)",
    deep: "blur(30px) saturate(160%)",
    subtle: "blur(10px)",
    ambient: "blur(80px)",
  },
  accents: {
    green: "#4ADE80",
    blue: "#38BDF8",
    amber: "#F59E0B",
    coral: "#FF7043",
    purple: "#A855F7",
  },
};

/**
 * Signature Frosted Glass background & specular styling
 */
export const glass = (mode = "dark", custom = {}) => {
  const isDark = mode === "dark";
  const tokens = isDark ? designTokens.dark : designTokens.light;

  return {
    background: custom.background || tokens.cardBg,
    backdropFilter: custom.blur || designTokens.blurs.glass,
    WebkitBackdropFilter: custom.blur || designTokens.blurs.glass,
    border: custom.border || `1px solid ${tokens.borderSubtle}`,
    boxShadow: custom.boxShadow || tokens.insetShadow,
    ...custom,
  };
};

/**
 * Card hover transition & lift
 */
export const cardHover = {
  transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
  "&:hover": {
    transform: "translateY(-2px)",
    boxShadow: "0 8px 24px rgba(0, 0, 0, 0.12)",
  },
};

/**
 * Card Action Mode styling (scaling selected note/trip & blurring non-selected)
 */
export const actionCardSx = (mode = "dark", isSelected = false, actionMode = false) => ({
  ...glass(mode),
  ...cardHover,
  borderRadius: designTokens.radii.card,
  cursor: "pointer",
  position: "relative",
  outline: "none",
  transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
  WebkitTapHighlightColor: "transparent",

  ...(isSelected && {
    transform: "scale(1.03) translateY(-4px) !important",
    zIndex: 10001,
  }),

  ...(actionMode && !isSelected && {
    filter: "blur(6px)",
    opacity: 0.25,
    transform: "scale(0.97)",
    pointerEvents: "none",
  }),
});

/**
 * Standardized Drawer Paper Props sx
 */
export const drawerPaperSx = (mode = "dark", custom = {}) => {
  const isDark = mode === "dark";
  const tokens = isDark ? designTokens.dark : designTokens.light;

  return {
    borderRadius: designTokens.radii.drawer,
    p: 3.5,
    pb: 4,
    background: tokens.surface,
    backdropFilter: designTokens.blurs.deep,
    WebkitBackdropFilter: designTokens.blurs.deep,
    boxShadow: tokens.drawerShadow,
    maxWidth: 540,
    mx: "auto",
    m: 2,
    backgroundImage: "none",
    ...custom,
  };
};

/**
 * Standardized Drawer Backdrop Props
 */
export const drawerBackdropSx = {
  backdropFilter: "blur(12px)",
  backgroundColor: "rgba(0, 0, 0, 0.25)",
};

/**
 * Standardized Dialog Paper Props
 */
export const dialogPaperSx = (mode = "dark", custom = {}) => {
  const isDark = mode === "dark";
  const tokens = isDark ? designTokens.dark : designTokens.light;

  return {
    borderRadius: designTokens.radii.drawer,
    p: 3,
    background: tokens.surface,
    backdropFilter: designTokens.blurs.deep,
    WebkitBackdropFilter: designTokens.blurs.deep,
    boxShadow: tokens.drawerShadow,
    border: `1px solid ${tokens.border}`,
    ...custom,
  };
};

/**
 * Standardized Context Menu / Popover Paper Props
 */
export const menuPaperSx = (mode = "dark", custom = {}) => {
  const isDark = mode === "dark";
  const tokens = isDark ? designTokens.dark : designTokens.light;

  return {
    borderRadius: 4,
    p: 1,
    background: isDark ? "rgba(22, 22, 22, 0.85)" : "rgba(255, 255, 255, 0.9)",
    backdropFilter: designTokens.blurs.deep,
    WebkitBackdropFilter: designTokens.blurs.deep,
    boxShadow: isDark ? "0 12px 32px rgba(0,0,0,0.7)" : "0 12px 32px rgba(0,0,0,0.12)",
    border: `1px solid ${tokens.border}`,
    ...custom,
  };
};

/**
 * Standard Horizontal Scrollable Container
 */
export const scrollableRowSx = {
  display: "flex",
  gap: 1.5,
  overflowX: "auto",
  scrollSnapType: "x mandatory",
  "&::-webkit-scrollbar": { display: "none" },
  msOverflowStyle: "none",
  scrollbarWidth: "none",
};

/**
 * Helper alias for glass card
 */
export const glassCard = (mode = "dark", custom = {}) => ({
  ...glass(mode),
  borderRadius: designTokens.radii.card,
  p: 2.5,
  ...custom,
});

/**
 * Standard Layout Styles
 */
export const flexCenterSx = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

export const flexBetweenSx = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
};

export const flexRowSx = {
  display: "flex",
  alignItems: "center",
};

/**
 * Standard Frosted Glass Panel
 */
export const glassPanelSx = (mode = "dark", custom = {}) => ({
  ...glass(mode),
  borderRadius: designTokens.radii.card,
  p: 2,
  ...custom,
});

/**
 * Standard Glass Pill Badge / Chip
 */
export const glassPillSx = (mode = "dark", custom = {}) => {
  const isDark = mode === "dark";
  return {
    display: "inline-flex",
    alignItems: "center",
    px: 1.4,
    py: 0.5,
    borderRadius: designTokens.radii.dragHandle,
    fontSize: "0.75rem",
    fontWeight: 600,
    backdropFilter: "blur(10px)",
    WebkitBackdropFilter: "blur(10px)",
    background: isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.04)",
    color: isDark ? "rgba(255, 255, 255, 0.9)" : "rgba(0, 0, 0, 0.8)",
    border: `1px solid ${isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.05)"}`,
    ...custom,
  };
};

/**
 * Standard Glass Action Icon Button
 */
export const glassIconBtnSx = (mode = "dark", custom = {}) => {
  const isDark = mode === "dark";
  const tokens = isDark ? designTokens.dark : designTokens.light;

  return {
    borderRadius: designTokens.radii.button,
    p: 1.2,
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    background: isDark ? "rgba(25, 25, 25, 0.75)" : "rgba(255, 255, 255, 0.35)",
    boxShadow: tokens.insetShadow,
    color: isDark ? "rgba(255, 255, 255, 0.85)" : "rgba(0, 0, 0, 0.75)",
    transition: "all 0.25s cubic-bezier(0.22, 0.61, 0.36, 1)",
    "&:hover": {
      background: isDark ? "rgba(255, 255, 255, 0.14)" : "rgba(0, 0, 0, 0.08)",
      transform: "scale(1.05)",
    },
    "&:active": {
      transform: "scale(0.95)",
    },
    ...custom,
  };
};

/**
 * Standard Drawer Header Container
 */
export const drawerHeaderSx = {
  px: 3,
  pb: 2,
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
};

/**
 * Standard Drawer Body Container
 */
export const drawerBodySx = {
  p: 3,
  pb: 4,
  display: "flex",
  flexDirection: "column",
  gap: 2,
  overflowY: "auto",
  "&::-webkit-scrollbar": { display: "none" },
  msOverflowStyle: "none",
  scrollbarWidth: "none",
};

/**
 * Standard Interactive Glass List Item
 */
export const glassItemSx = (mode = "dark", custom = {}) => ({
  ...glass(mode),
  ...cardHover,
  borderRadius: designTokens.radii.cardSm,
  p: 1.5,
  display: "flex",
  alignItems: "center",
  gap: 1.5,
  cursor: "pointer",
  ...custom,
});

/**
 * Standard Drag Handle Pill sx
 */
export const drawerHandleSx = (mode = "dark") => ({
  width: 60,
  height: 5,
  borderRadius: designTokens.radii.dragHandle,
  background: mode === "dark" ? "#f1f1f127" : "#0c0c0c3e",
  backdropFilter: "blur(12px)",
  cursor: "grab",
  transition: "all 0.25s ease",
  "&:hover": { width: 72 },
  "&:active": { cursor: "grabbing", transform: "scale(0.95)" },
});

/**
 * Floating Action Button (FAB) / Pill sx with specular shine animation
 */
export const floatingButtonSx = (mode = "dark", expanded = false) => {
  const isDark = mode === "dark";
  const tokens = isDark ? designTokens.dark : designTokens.light;

  return {
    pointerEvents: "auto",
    position: "relative",
    overflow: "hidden",
    minWidth: expanded ? { xs: "130px", md: "200px" } : 56,
    height: 56,
    borderRadius: expanded ? designTokens.radii.buttonPill : "50%",
    px: expanded ? 3 : 0,
    transition: "all 0.45s cubic-bezier(0.4, 0, 0.2, 1)",
    willChange: "transform, min-width, border-radius",
    backdropFilter: "blur(2px) saturate(2)",
    WebkitBackdropFilter: "blur(2px) saturate(2)",
    background: isDark ? "rgba(0, 0, 0, 0.65)" : "rgba(255, 255, 255, 0.25)",
    color: isDark ? "#fff" : "#000",
    boxShadow: tokens.insetShadow,
    "& .MuiButton-startIcon": {
      margin: expanded ? "0 8px 0 0" : 0,
      marginLeft: expanded ? 0 : "0px",
    },
    "&::before": {
      content: '""',
      position: "absolute",
      top: 0,
      left: "-75%",
      width: "50%",
      height: "100%",
      background: "linear-gradient(120deg, transparent, rgba(255, 255, 255, 0.17), transparent)",
      transform: "skewX(-20deg)",
      transition: "all 0.6s ease",
    },
    "&:hover::before": { left: "125%" },
    "&::after": {
      content: '""',
      position: "absolute",
      inset: 0,
      borderRadius: "inherit",
      background: "linear-gradient(to bottom right, rgba(255, 255, 255, 0.13), transparent)",
      opacity: 0.3,
      pointerEvents: "none",
    },
    "&:hover": { transform: "scale(1.05)" },
  };
};

/**
 * CTA Button styling (Primary solid contrast, Secondary frosted glass, Danger)
 */
export const ctaButtonSx = (mode = "dark", variant = "primary", custom = {}) => {
  const isDark = mode === "dark";

  if (variant === "primary") {
    return {
      textTransform: "none",
      fontWeight: 600,
      borderRadius: designTokens.radii.button,
      py: 1.2,
      px: 2.5,
      backgroundColor: isDark ? "#ffffff" : "#000000",
      color: isDark ? "#000000" : "#ffffff",
      boxShadow: "0 4px 14px rgba(0, 0, 0, 0.1)",
      transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
      "&:hover": {
        backgroundColor: isDark ? "#f0f0f0" : "#1a1a1a",
        transform: "translateY(-2px)",
        boxShadow: "0 6px 20px rgba(0, 0, 0, 0.18)",
      },
      "&:active": {
        transform: "scale(0.97)",
      },
      ...custom,
    };
  }

  if (variant === "secondary") {
    return {
      textTransform: "none",
      fontWeight: 600,
      borderRadius: designTokens.radii.button,
      py: 1.2,
      px: 2.5,
      backdropFilter: "blur(10px)",
      WebkitBackdropFilter: "blur(10px)",
      backgroundColor: isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.04)",
      color: isDark ? "#ffffff" : "#000000",
      border: `1px solid ${isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.06)"}`,
      boxShadow: isDark ? designTokens.dark.insetShadow : designTokens.light.insetShadow,
      transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
      "&:hover": {
        backgroundColor: isDark ? "rgba(255, 255, 255, 0.12)" : "rgba(0, 0, 0, 0.08)",
        transform: "translateY(-2px)",
      },
      "&:active": {
        transform: "scale(0.97)",
      },
      ...custom,
    };
  }

  if (variant === "danger") {
    return {
      textTransform: "none",
      fontWeight: 600,
      borderRadius: designTokens.radii.button,
      py: 1.2,
      px: 2.5,
      backdropFilter: "blur(10px)",
      WebkitBackdropFilter: "blur(10px)",
      backgroundColor: isDark ? "rgba(229, 57, 53, 0.2)" : "rgba(255, 102, 102, 0.7)",
      color: isDark ? "#fff" : "#000",
      border: "1px solid rgba(229, 57, 53, 0.3)",
      boxShadow: isDark ? designTokens.dark.insetShadow : designTokens.light.insetShadow,
      transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
      "&:hover": {
        backgroundColor: "#c62828",
        color: "#ffffff",
        transform: "translateY(-2px)",
      },
      "&:active": {
        transform: "scale(0.97)",
      },
      ...custom,
    };
  }

  return {};
};

/**
 * Standard Glass Icon Button
 */
export const glassIconButtonSx = (mode = "dark", custom = {}) => {
  const isDark = mode === "dark";
  const tokens = isDark ? designTokens.dark : designTokens.light;

  return {
    borderRadius: designTokens.radii.button,
    p: 1.5,
    backdropFilter: "blur(25px)",
    WebkitBackdropFilter: "blur(25px)",
    background: isDark ? "rgba(25, 25, 25, 0.75)" : "rgba(255, 255, 255, 0.35)",
    boxShadow: tokens.insetShadow,
    color: isDark ? "rgba(255, 255, 255, 0.85)" : "rgba(0, 0, 0, 0.75)",
    transition: "all 0.25s cubic-bezier(0.22, 0.61, 0.36, 1)",
    "&:hover": {
      background: isDark ? "rgba(255, 255, 255, 0.12)" : "rgba(0, 0, 0, 0.08)",
      transform: "scale(1.04)",
    },
    ...custom,
  };
};

/**
 * Standardized Search Field sx
 */
export const searchFieldSx = (mode = "dark", custom = {}) => {
  const isDark = mode === "dark";
  const tokens = isDark ? designTokens.dark : designTokens.light;

  return {
    flex: 1,
    "& .MuiOutlinedInput-root": {
      color: isDark ? "#fff" : "#111",
      borderRadius: designTokens.radii.input,
      height: 44,
      backdropFilter: "blur(10px)",
      WebkitBackdropFilter: "blur(10px)",
      backgroundColor: tokens.inputBg,
      boxShadow: tokens.insetShadow,
      border: "0px solid",
      borderColor: tokens.border,
      transition: "all 0.2s ease-in-out",
      "& fieldset": { border: "none" },
      "&:hover": {
        backgroundColor: tokens.inputHoverBg,
        borderColor: isDark ? "rgba(255, 255, 255, 0.18)" : "rgba(0, 0, 0, 0.12)",
      },
      "&.Mui-focused": {
        backgroundColor: isDark ? "rgba(255, 255, 255, 0.04)" : "rgba(255, 255, 255, 0.8)",
        boxShadow: isDark ? "0 0 0 3px rgba(255, 255, 255, 0.05)" : "0 0 0 3px rgba(25, 118, 210, 0.15)",
      },
    },
    "& .MuiOutlinedInput-input": {
      py: 1.2,
      fontSize: "0.9rem",
      color: tokens.textPrimary,
      "&::placeholder": { color: tokens.textMuted, opacity: 1 },
    },
    ...custom,
  };
};

/**
 * Standardized Form Input sx
 */
export const glassInputSx = (mode = "dark", custom = {}) => {
  const isDark = mode === "dark";
  const tokens = isDark ? designTokens.dark : designTokens.light;

  return {
    width: "100%",
    "& .MuiOutlinedInput-root": {
      color: isDark ? "#fff" : "#111",
      borderRadius: designTokens.radii.input,
      backgroundColor: isDark ? "rgba(255, 255, 255, 0.03)" : "rgba(0, 0, 0, 0.02)",
      boxShadow: tokens.insetShadow,
      border: "0px solid",
      "& fieldset": { border: "none" },
      "&:hover": {
        backgroundColor: isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.05)",
      },
      "&.Mui-focused": {
        backgroundColor: isDark ? "rgba(255, 255, 255, 0.04)" : "rgba(255, 255, 255, 0.8)",
        boxShadow: isDark ? "0 0 0 3px rgba(255, 255, 255, 0.05)" : "0 0 0 3px rgba(25, 118, 210, 0.15)",
      },
    },
    ...custom,
  };
};

/**
 * Standard Segmented Control ToggleButtonGroup sx
 */
export const toggleGroupSx = (mode = "dark", custom = {}) => {
  const isDark = mode === "dark";
  const tokens = isDark ? designTokens.dark : designTokens.light;

  return {
    borderRadius: designTokens.radii.chip,
    backgroundColor: isDark ? "rgba(255, 255, 255, 0.02)" : "rgba(0, 0, 0, 0.02)",
    border: `1px solid ${isDark ? "rgba(255, 255, 255, 0.06)" : "rgba(0, 0, 0, 0.05)"}`,
    p: "3px",
    "& .MuiToggleButton-root": {
      border: "none !important",
      borderRadius: designTokens.radii.chip,
      py: 1,
      fontWeight: 700,
      fontSize: "0.8rem",
      textTransform: "none",
      color: tokens.textMuted,
      transition: "all 0.2s cubic-bezier(0.22, 0.61, 0.36, 1)",
      "&:hover": {
        backgroundColor: isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.03)",
      },
      "&.Mui-selected": {
        backgroundColor: isDark ? "#ffffff" : "#111111",
        color: isDark ? "#000000" : "#ffffff",
        boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
      },
    },
    ...custom,
  };
};

/**
 * Standard Filter Chip sx
 */
export const filterChipSx = (mode = "dark", isSelected = false, custom = {}) => {
  const isDark = mode === "dark";
  const tokens = isDark ? designTokens.dark : designTokens.light;

  return {
    borderRadius: designTokens.radii.chip,
    fontSize: "0.85rem",
    fontWeight: isSelected ? 600 : 500,
    px: 0.5,
    transition: "all 0.2s ease-in-out",
    backdropFilter: "blur(10px)",
    WebkitBackdropFilter: "blur(10px)",
    border: "0px solid",
    ...(isSelected
      ? {
          backgroundColor: isDark ? "rgba(255, 255, 255, 0.9)" : "rgba(0, 0, 0, 0.85)",
          color: isDark ? "#000" : "#fff",
          borderColor: "transparent",
          boxShadow: tokens.insetShadow,
          "&:hover": { backgroundColor: isDark ? "#ffffff" : "#000000" },
        }
      : {
          backgroundColor: isDark ? "rgba(255, 255, 255, 0)" : "rgba(0, 0, 0, 0.03)",
          color: tokens.textSecondary,
          borderColor: isDark ? "rgba(255, 255, 255, 0.06)" : "rgba(0, 0, 0, 0.05)",
          boxShadow: isDark ? "inset 0 1px 1px rgba(255, 255, 255, 0.08)" : "inset 0 1px 1px rgba(255, 255, 255, 0.6)",
          "&:hover": {
            backgroundColor: isDark ? "rgba(255, 255, 255, 0.09)" : "rgba(0, 0, 0, 0.06)",
            color: isDark ? "#fff" : "#000",
          },
        }),
    ...custom,
  };
};

/**
 * Top Deep Blur Cover Mask (iOS / Photos style)
 */
export const topBlurMaskSx = (mode = "dark") => ({
  position: "absolute",
  top: -5,
  left: 0,
  right: 0,
  height: 200,
  zIndex: -1,
  mx: -2,
  pointerEvents: "none",
  backdropFilter: designTokens.blurs.ambient,
  WebkitBackdropFilter: designTokens.blurs.ambient,
  maskImage: `linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0.92) 18%, rgba(0,0,0,0.72) 38%, rgba(0,0,0,0.42) 62%, rgba(0,0,0,0.12) 82%, rgba(0,0,0,0) 100%)`,
  WebkitMaskImage: `linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0.92) 18%, rgba(0,0,0,0.72) 38%, rgba(0,0,0,0.42) 62%, rgba(0,0,0,0.12) 82%, rgba(0,0,0,0) 100%)`,
  background:
    mode === "dark"
      ? `linear-gradient(to bottom, rgba(0,0,0,0), rgba(0,0,0,0))`
      : `linear-gradient(to bottom, rgba(255,255,255,0), rgba(255,255,255,0))`,
});

/* ---------------- Reusable Components ---------------- */

/**
 * Drawer Top Drag Handle
 */
export const DrawerHandle = ({ mode = "dark" }) => (
  <Box sx={{ display: "flex", justifyContent: "center", py: 1.5, pb: 2.5 }}>
    <Box sx={drawerHandleSx(mode)} />
  </Box>
);

/**
 * Reusable Glassmorphic Card Container
 */
export const GlassCard = ({ mode = "dark", children, sx = {}, ...props }) => (
  <Card sx={{ ...glass(mode), ...cardHover, borderRadius: designTokens.radii.card, ...sx }} {...props}>
    {children}
  </Card>
);

/**
 * Reusable Glass Search Bar
 */
export const GlassSearchBar = ({
  mode = "dark",
  placeholder = "Search...",
  value,
  onChange,
  onClear,
  sx = {},
  ...props
}) => (
  <TextField
    size="small"
    placeholder={placeholder}
    variant="outlined"
    value={value}
    onChange={onChange}
    InputProps={{
      startAdornment: (
        <InputAdornment position="start">
          <Search sx={{ color: mode === "dark" ? "rgba(255, 255, 255, 0.5)" : "rgba(0, 0, 0, 0.4)", mr: 0.5, fontSize: "1.2rem" }} />
        </InputAdornment>
      ),
    }}
    sx={searchFieldSx(mode, sx)}
    {...props}
  />
);

/**
 * Reusable Floating Action Button / Pill
 */
export const FloatingCTA = ({
  mode = "dark",
  label = "Create",
  icon,
  onClick,
  bottom = 85,
  right = 41,
  zIndex = 1100,
}) => {
  const [expanded, setExpanded] = React.useState(true);
  const [scrolled, setScrolled] = React.useState(false);

  React.useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const isScrolled = window.scrollY > 20;
          setScrolled((prev) => (prev !== isScrolled ? isScrolled : prev));
          if (isScrolled) setExpanded(false);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  React.useEffect(() => {
    const timer = setTimeout(() => setExpanded(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Box sx={{ position: "fixed", bottom, right, zIndex, pointerEvents: "none" }}>
      <Button
        onClick={onClick}
        onMouseEnter={() => !scrolled && setExpanded(true)}
        onMouseLeave={() => !scrolled && setExpanded(false)}
        startIcon={icon}
        sx={floatingButtonSx(mode, expanded)}
      >
        <AnimatePresence>
          {expanded && (
            <motion.span
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              exit={{ opacity: 0, width: 0 }}
              style={{ whiteSpace: "nowrap", fontWeight: 600, overflow: "hidden" }}
            >
              {label}
            </motion.span>
          )}
        </AnimatePresence>
      </Button>
    </Box>
  );
};

/* ============================================================
   EXTENDED HELPERS — added for full project-wide standardization
   ============================================================ */

/**
 * Auth Screen Text Input (dark-only — Login / Signup)
 */
export const authInputSx = (custom = {}) => ({
  "& .MuiOutlinedInput-root": {
    borderRadius: "14px",
    background: "rgba(255,255,255,0)",
    color: "#fff",
    "& fieldset": { borderColor: "rgba(255,255,255,0.15)" },
    "&:hover fieldset": { borderColor: "rgba(255,255,255,0.35)" },
    "&.Mui-focused fieldset": { borderColor: "#ffffff" },
  },
  "& .MuiInputLabel-root": { color: "rgba(255,255,255,0.6)" },
  "& .MuiInputLabel-root.Mui-focused": { color: "#ffffff" },
  ...custom,
});

/**
 * Auth Screen Card Container (frosted black glass)
 */
export const authCardSx = (custom = {}) => ({
  width: "100%",
  maxWidth: 420,
  margin: "0 auto",
  pb: 4,
  backgroundColor: "rgba(0,0,0,0.6)",
  borderRadius: 8,
  boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
  backdropFilter: "blur(12px)",
  WebkitBackdropFilter: "blur(12px)",
  padding: 4,
  ...custom,
});

/**
 * Auth Screen CTA Buttons
 */
export const authCTASx = (variant = "primary", custom = {}) => {
  if (variant === "primary") {
    return {
      py: 1.6,
      borderRadius: "14px",
      background: "linear-gradient(135deg,#ffffff,#eaeaea)",
      color: "#000",
      fontWeight: 700,
      letterSpacing: "0.03em",
      boxShadow: "none",
      transition: "all 0.25s ease",
      textTransform: "none",
      "&:hover": {
        transform: "translateY(-1px)",
        boxShadow: "0 14px 40px rgba(0,0,0,0.35)",
        background: "linear-gradient(135deg,#ffffff,#f1f1f1)",
      },
      "&:active": { transform: "scale(0.97)" },
      ...custom,
    };
  }
  if (variant === "secondary") {
    return {
      py: 1.5,
      borderRadius: "14px",
      background: "rgba(255, 255, 255, 0.01)",
      border: "1.5px solid rgba(255,255,255,0.35)",
      color: "#ffffff",
      fontWeight: 600,
      transition: "all 0.25s ease",
      textTransform: "none",
      "&:hover": {
        background: "rgba(255,255,255,0.1)",
        borderColor: "#ff8a00",
        color: "#ff8a00",
      },
      "&:active": { transform: "scale(0.97)" },
      ...custom,
    };
  }
  if (variant === "google") {
    return {
      py: 1.5,
      borderRadius: "14px",
      border: "1px solid rgba(255,255,255,0.15)",
      background: "rgba(255,255,255,0.05)",
      color: "#fff",
      fontWeight: 600,
      transition: "all 0.25s ease",
      textTransform: "none",
      "&:hover": {
        background: "rgba(255,255,255,0.12)",
        borderColor: "rgba(255,255,255,0.3)",
      },
      "&:active": { transform: "scale(0.97)" },
      ...custom,
    };
  }
  return {};
};

/**
 * Sticky Section Header (Budget, Reminders, Chats list)
 */
export const sectionHeaderSx = (mode = "dark", custom = {}) => {
  const isDark = mode === "dark";
  return {
    position: "sticky",
    top: 0,
    zIndex: 10,
    py: 1,
    px: 2,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    backdropFilter: "blur(16px)",
    WebkitBackdropFilter: "blur(16px)",
    background: isDark ? "rgba(6,6,6,0.7)" : "rgba(240,242,245,0.7)",
    borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)"}`,
    ...custom,
  };
};

/**
 * Metric Stat Card (Budget totals, TripDetails summary)
 */
export const statCardSx = (mode = "dark", custom = {}) => ({
  ...glass(mode),
  borderRadius: designTokens.radii.card,
  p: 2.5,
  display: "flex",
  flexDirection: "column",
  gap: 0.5,
  ...cardHover,
  ...custom,
});

/**
 * Progress Bar Wrapper (Budget category breakdown)
 */
export const progressBarSx = (mode = "dark", color = "#4ADE80", custom = {}) => {
  const isDark = mode === "dark";
  return {
    height: 8,
    borderRadius: 999,
    background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
    overflow: "hidden",
    position: "relative",
    "& .progress-fill": {
      height: "100%",
      borderRadius: 999,
      background: color,
      transition: "width 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
    },
    ...custom,
  };
};

/**
 * Chat Message Bubble
 */
export const messageBubbleSx = (mode = "dark", isMine = false, custom = {}) => {
  const isDark = mode === "dark";
  return {
    maxWidth: "75%",
    px: 2,
    py: 1.2,
    borderRadius: isMine
      ? "18px 18px 4px 18px"
      : "18px 18px 18px 4px",
    backdropFilter: "blur(10px)",
    WebkitBackdropFilter: "blur(10px)",
    wordBreak: "break-word",
    ...(isMine
      ? {
          background: isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)",
          color: isDark ? "#fff" : "#000",
          border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.06)"}`,
          alignSelf: "flex-end",
          boxShadow: isDark ? designTokens.dark.insetShadow : designTokens.light.insetShadow,
        }
      : {
          background: isDark ? "rgba(30,30,30,0.6)" : "rgba(255,255,255,0.75)",
          color: isDark ? "rgba(255,255,255,0.92)" : "#111",
          border: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)"}`,
          alignSelf: "flex-start",
          boxShadow: isDark ? designTokens.dark.insetShadow : designTokens.light.insetShadow,
        }),
    ...custom,
  };
};

/**
 * Chat Composer Input Row
 */
export const chatInputSx = (mode = "dark", custom = {}) => {
  const isDark = mode === "dark";
  const tokens = isDark ? designTokens.dark : designTokens.light;
  return {
    display: "flex",
    alignItems: "center",
    gap: 1,
    px: 2,
    py: 1.5,
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    background: isDark ? "rgba(10,10,10,0.75)" : "rgba(255,255,255,0.75)",
    borderTop: `1px solid ${tokens.border}`,
    "& .MuiOutlinedInput-root": {
      borderRadius: 6,
      background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
      color: isDark ? "#fff" : "#111",
      "& fieldset": { border: "none" },
      "&:hover": { background: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)" },
      "&.Mui-focused": { background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)" },
    },
    ...custom,
  };
};

/**
 * Settings / Profile List Item Row
 */
export const listItemRowSx = (mode = "dark", custom = {}) => {
  const isDark = mode === "dark";
  return {
    display: "flex",
    alignItems: "center",
    gap: 1.5,
    px: 2,
    py: 1.5,
    borderRadius: designTokens.radii.cardSm,
    cursor: "pointer",
    transition: "background 0.18s ease",
    "&:hover": {
      background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)",
    },
    "&:active": {
      background: isDark ? "rgba(255,255,255,0.09)" : "rgba(0,0,0,0.06)",
    },
    ...custom,
  };
};

/**
 * Settings Grouped Section Panel
 */
export const settingsSectionSx = (mode = "dark", custom = {}) => ({
  ...glass(mode),
  borderRadius: designTokens.radii.card,
  overflow: "hidden",
  mb: 2,
  ...custom,
});

/**
 * Colored Tag / Category Chip
 */
export const tagChipSx = (mode = "dark", color = "#4ADE80", custom = {}) => {
  const isDark = mode === "dark";
  // Parse a soft tinted background from the accent color
  return {
    display: "inline-flex",
    alignItems: "center",
    gap: 0.5,
    px: 1.2,
    py: 0.4,
    borderRadius: designTokens.radii.dragHandle,
    fontSize: "0.72rem",
    fontWeight: 600,
    color,
    background: `${color}1a`,
    border: `1px solid ${color}33`,
    backdropFilter: "blur(8px)",
    WebkitBackdropFilter: "blur(8px)",
    ...custom,
  };
};

