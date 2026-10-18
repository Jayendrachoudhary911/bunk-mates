// src/components/DesktopPanelHeader.jsx
import React from "react";
import { Box, Typography, IconButton, Tooltip } from "@mui/material";
import { Close as CloseIcon, ArrowBack as ArrowBackIcon } from "../icons";
import { useThemeToggle } from "../contexts/ThemeToggleContext";

const DesktopPanelHeader = ({
  title,
  subtitle,
  icon,
  onClose,
  onBack,
  rightAction,
}) => {
  const { mode } = useThemeToggle();
  const isDark = mode === "dark";

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        height: 60,
        px: 2.5,
        pt: 1,
        borderBottom: `0px solid ${
          isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.08)"
        }`,
        backgroundColor: isDark
          ? "rgba(18, 18, 18, 0)"
          : "rgba(255, 255, 255, 0)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        position: "sticky",
        top: 0,
        zIndex: 10,
        userSelect: "none",
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, minWidth: 0 }}>
        {onBack && (
          <Tooltip title="Back" arrow>
            <IconButton
              onClick={onBack}
              size="small"
              aria-label="Go back"
              sx={{
                width: 32,
                height: 32,
                borderRadius: 8,
                color: isDark ? "#fff" : "#111",
                backgroundColor: isDark
                  ? "rgba(255, 255, 255, 0.06)"
                  : "rgba(0, 0, 0, 0.04)",
                "&:hover": {
                  backgroundColor: isDark
                    ? "rgba(255, 255, 255, 0.12)"
                    : "rgba(0, 0, 0, 0.08)",
                },
              }}
            >
              <ArrowBackIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
        )}

        {icon && (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 38,
              height: 38,
              borderRadius: 8,
              backgroundColor: isDark
                ? "rgba(255, 255, 255, 0.08)"
                : "rgba(0, 0, 0, 0.05)",
              color: isDark ? "#fff" : "#111",
              flexShrink: 0,
            }}
          >
            {icon}
          </Box>
        )}

        <Box sx={{ minWidth: 0 }}>
          <Typography
            variant="subtitle1"
            sx={{
              fontWeight: 600,
              fontSize: "0.98rem",
              lineHeight: 1.2,
              color: isDark ? "#fff" : "#111",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {title}
          </Typography>
          {subtitle && (
            <Typography
              variant="caption"
              sx={{
                color: isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)",
                display: "block",
                lineHeight: 1.1,
                fontSize: "0.75rem",
              }}
            >
              {subtitle}
            </Typography>
          )}
        </Box>
      </Box>

      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        {rightAction}

        {onClose && (
          <Tooltip title="Close (Esc)" arrow>
            <IconButton
              onClick={onClose}
              size="small"
              aria-label="Close panel"
              sx={{
                width: 32,
                height: 32,
                boxShadow: 'inset 0 1px 1px rgba(255, 255, 255, 0.11), 0 1px 0px rgba(0,0,0,0.1)',
                borderRadius: 8,
                color: isDark ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.6)",
                backgroundColor: isDark
                  ? "rgba(255, 255, 255, 0.05)"
                  : "rgba(0, 0, 0, 0.04)",
                transition: "all 0.2s ease",
                "&:hover": {
                  color: isDark ? "#fff" : "#000",
                  backgroundColor: isDark
                    ? "rgba(255, 255, 255, 0.12)"
                    : "rgba(0, 0, 0, 0.08)",
                  transform: "scale(1.05)",
                },
                "&:active": {
                  transform: "scale(0.95)",
                },
              }}
            >
              <CloseIcon sx={{ fontSize: 22 }} />
            </IconButton>
          </Tooltip>
        )}
      </Box>
    </Box>
  );
};

export default DesktopPanelHeader;
