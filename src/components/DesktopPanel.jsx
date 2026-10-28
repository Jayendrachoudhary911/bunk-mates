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

  // Responsive width: 390px by default, 440px on extra-large screens, or custom width
  const panelWidth = width || (isLargeScreen ? 440 : 390);

  return (
    <AnimatePresence>
      {open && (
        <Box
          component={motion.aside}
          role="complementary"
          aria-label={title || "Secondary Panel"}
          initial={{
            width: 0,
            opacity: 0,
            scale: 0.98,
            marginLeft: 0,
            marginRight: 0,
          }}
          animate={{
            width: panelWidth,
            opacity: 1,
            scale: 1,
            marginLeft: 16,
            marginRight: 16,
          }}
          exit={{
            width: 0,
            opacity: 0,
            scale: 0.98,
            marginLeft: 0,
            marginRight: 0,
          }}
          transition={{
            type: "spring",
            stiffness: 350,
            damping: 30,
            mass: 0.8,
          }}
          style={{ willChange: "width, transform, opacity" }}
          sx={{
            flexShrink: 0,
            display: "flex",
            my: 2,
            mt: 3,
            borderRadius: 6,
            flexDirection: "column",
            position: "relative",
            zIndex: 1100,
            border: `1px solid ${
              isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.08)"
            }`,
            backgroundColor: isDark
              ? "rgba(14, 14, 14, 0.85)"
              : "rgba(250, 250, 250, 0.9)",
            backdropFilter: "blur(28px) saturate(1.4)",
            WebkitBackdropFilter: "blur(28px) saturate(1.4)",
            boxShadow: 'none',
            overflow: "hidden",
          }}
        >
          {/* Inner content wrapper with fixed width so contents never squish horizontally during smooth flex transitions */}
          <Box
            sx={{
              width: panelWidth,
              minWidth: panelWidth,
              height: "100%",
              display: "flex",
              flexDirection: "column",
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
                p: noPadding ? 0 : 0,
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
        </Box>
      )}
    </AnimatePresence>
  );
};

export default React.memo(DesktopPanel);
