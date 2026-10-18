// src/components/DesktopPanel.jsx
import React from "react";
import { Box, useTheme, useMediaQuery } from "@mui/material";
import { motion, AnimatePresence } from "framer-motion";
import DesktopPanelHeader from "./DesktopPanelHeader";
import { useThemeToggle } from "../contexts/ThemeToggleContext";

const DesktopPanel = ({
  open = false,
  title,
  subtitle,
  icon,
  onClose,
  onBack,
  width,
  headerRight,
  hideHeader = false,
  noPadding = false,
  children,
}) => {
  const muiTheme = useTheme();
  const isLargeScreen = useMediaQuery(muiTheme.breakpoints.up("xl"));
  const { mode } = useThemeToggle();
  const isDark = mode === "dark";

  // Responsive width: 380px by default, 440px on extra-large screens, or custom width
  const panelWidth = width || (isLargeScreen ? 440 : 390);

  return (
    <AnimatePresence>
      {open && (
        <Box
          component={motion.aside}
          role="complementary"
          aria-label={title || "Secondary Panel"}
          initial={{ x: 40, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 40, opacity: 0 }}
          transition={{ type: "spring", stiffness: 350, damping: 30 }}
          sx={{
            width: panelWidth,
            flexShrink: 0,
            display: "flex",
            m: 2,
            mt: 3,
            borderRadius: 6,
            flexDirection: "column",
            position: "relative",
            zIndex: 1100,
            border: `1px solid ${
              isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.08)"
            }`,
            backgroundColor: isDark
              ? "rgba(14, 14, 14, 0.82)"
              : "rgba(250, 250, 250, 0.88)",
            backdropFilter: "blur(26px) saturate(1.3)",
            WebkitBackdropFilter: "blur(26px) saturate(1.3)",
            boxShadow: 'none',
            overflow: "hidden",
          }}
        >
          {!hideHeader && title && (
            <DesktopPanelHeader
              title={title}
              subtitle={subtitle}
              icon={icon}
              onClose={onClose}
              onBack={onBack}
              rightAction={headerRight}
            />
          )}

          {/* Panel Scroll Container */}
          <Box
            sx={{
              flex: 1,
              overflowY: "auto",
              overflowX: "hidden",
              position: "relative",
              p: noPadding ? 0 : 0.5,
              scrollbarWidth: "thin",
              scrollbarColor: isDark
                ? "rgba(255, 255, 255, 0.15) transparent"
                : "rgba(0, 0, 0, 0.15) transparent",
              "&::-webkit-scrollbar": {
                width: 6,
              },
              "&::-webkit-scrollbar-track": {
                background: "transparent",
              },
              "&::-webkit-scrollbar-thumb": {
                backgroundColor: isDark
                  ? "rgba(255, 255, 255, 0.15)"
                  : "rgba(0, 0, 0, 0.15)",
                borderRadius: 3,
                "&:hover": {
                  backgroundColor: isDark
                    ? "rgba(255, 255, 255, 0.25)"
                    : "rgba(0, 0, 0, 0.25)",
                },
              },
            }}
          >
            {children}
          </Box>
        </Box>
      )}
    </AnimatePresence>
  );
};

export default DesktopPanel;
