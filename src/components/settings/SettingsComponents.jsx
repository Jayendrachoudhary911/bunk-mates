import React from "react";
import {
  Box,
  Typography,
  IconButton,
  Switch,
  Divider,
} from "@mui/material";
import { ArrowBack, ArrowForwardIos } from "../../icons";

// Design Tokens matching reference screenshots
export const SETTINGS_THEME = {
  bg: "#000000",
  card: "#161616",
  surface: "#202024",
  textPrimary: "#FFFFFF",
  textSecondary: "#A0A3AD",
  divider: "rgba(255, 255, 255, 0.06)",
  accent: "#287FE0",
  success: "#29C99A",
  error: "#F05252",
  iconBg: "rgba(255, 255, 255, 0.08)",
  cardRadius: "24px",
};

/**
 * Top Navigation Header for Settings Pages
 */
export const SettingsHeader = ({ title, onBack, rightAction }) => {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        py: 2,
        px: 2,
        position: "sticky",
        top: 0,
        zIndex: 100,
        backgroundColor: "rgba(0, 0, 0, 0.9)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
        {onBack && (
          <IconButton
            onClick={onBack}
            sx={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              backgroundColor: "rgba(255, 255, 255, 0.08)",
              color: "#FFFFFF",
              "&:hover": {
                backgroundColor: "rgba(255, 255, 255, 0.16)",
              },
            }}
          >
            <ArrowBack sx={{ fontSize: 20 }} />
          </IconButton>
        )}
        <Typography
          variant="h6"
          sx={{
            fontWeight: 700,
            fontSize: "1.25rem",
            color: "#FFFFFF",
            letterSpacing: "-0.01em",
          }}
        >
          {title}
        </Typography>
      </Box>

      {rightAction && <Box>{rightAction}</Box>}
    </Box>
  );
};

/**
 * Uppercase compact Section Title
 */
export const SettingsSectionTitle = ({ children, sx = {} }) => {
  return (
    <Typography
      sx={{
        fontSize: "0.75rem",
        fontWeight: 700,
        color: "#7E828D",
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        mt: 3,
        mb: 1.2,
        px: 2,
        ...sx,
      }}
    >
      {children}
    </Typography>
  );
};

/**
 * Dark Rounded Grouped Card
 */
export const SettingsCard = ({ children, sx = {}, ...props }) => {
  return (
    <Box
      sx={{
        backgroundColor: SETTINGS_THEME.card,
        borderRadius: SETTINGS_THEME.cardRadius,
        border: `1px solid ${SETTINGS_THEME.divider}`,
        overflow: "hidden",
        mx: 2,
        mb: 2,
        ...sx,
      }}
      {...props}
    >
      {children}
    </Box>
  );
};

/**
 * Single Row Item in Settings
 */
export const SettingsRow = ({
  icon,
  iconColor,
  iconBg,
  title,
  subtitle,
  trailing,
  onClick,
  isLast = false,
  destructive = false,
  badge,
}) => {
  const isClickable = Boolean(onClick);

  return (
    <Box
      onClick={onClick}
      role={isClickable ? "button" : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={
        isClickable
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        py: 1.8,
        px: 2,
        cursor: isClickable ? "pointer" : "default",
        transition: "background-color 0.2s ease",
        borderBottom: isLast ? "none" : `1px solid ${SETTINGS_THEME.divider}`,
        "&:hover": isClickable
          ? {
              backgroundColor: "rgba(255, 255, 255, 0.04)",
            }
          : {},
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.8, flex: 1, minWidth: 0, mr: 1.5 }}>
        {icon && (
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              backgroundColor: iconBg || SETTINGS_THEME.iconBg,
              color: iconColor || "#FFFFFF",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            {icon}
          </Box>
        )}

        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography
              sx={{
                fontSize: "0.98rem",
                fontWeight: 600,
                color: destructive ? SETTINGS_THEME.error : SETTINGS_THEME.textPrimary,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {title}
            </Typography>
            {badge}
          </Box>

          {subtitle && (
            <Typography
              sx={{
                fontSize: "0.82rem",
                color: SETTINGS_THEME.textSecondary,
                mt: 0.3,
                lineHeight: 1.35,
              }}
            >
              {subtitle}
            </Typography>
          )}
        </Box>
      </Box>

      <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexShrink: 0 }}>
        {trailing ? (
          trailing
        ) : isClickable ? (
          <ArrowForwardIos sx={{ fontSize: 13, color: "rgba(255, 255, 255, 0.3)" }} />
        ) : null}
      </Box>
    </Box>
  );
};

/**
 * Settings Row with Toggle Switch
 */
export const SettingsSwitchRow = ({
  icon,
  iconColor,
  iconBg,
  title,
  subtitle,
  checked,
  onChange,
  disabled = false,
  isLast = false,
}) => {
  return (
    <SettingsRow
      icon={icon}
      iconColor={iconColor}
      iconBg={iconBg}
      title={title}
      subtitle={subtitle}
      isLast={isLast}
      trailing={
        <Switch
          checked={Boolean(checked)}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
          sx={{
            width: 48,
            height: 28,
            padding: 0,
            "& .MuiSwitch-switchBase": {
              padding: 0.35,
              "&.Mui-checked": {
                transform: "translateX(20px)",
                color: "#FFFFFF",
                "& + .MuiSwitch-track": {
                  backgroundColor: SETTINGS_THEME.accent,
                  opacity: 1,
                  border: 0,
                },
              },
            },
            "& .MuiSwitch-thumb": {
              width: 22,
              height: 22,
              boxShadow: "0 2px 4px rgba(0,0,0,0.3)",
              backgroundColor: "#FFFFFF",
            },
            "& .MuiSwitch-track": {
              borderRadius: 14,
              backgroundColor: "rgba(255, 255, 255, 0.16)",
              opacity: 1,
              transition: "background-color 0.25s ease",
            },
          }}
        />
      }
    />
  );
};

/**
 * Segmented Pill Selector (e.g. for light/dark/system, 12h/24h, units)
 */
export const SettingsSegmentedControl = ({ options, value, onChange, sx = {} }) => {
  return (
    <Box
      sx={{
        display: "flex",
        backgroundColor: "#101012",
        borderRadius: "14px",
        p: 0.5,
        border: `1px solid ${SETTINGS_THEME.divider}`,
        ...sx,
      }}
    >
      {options.map((opt) => {
        const isSelected = value === opt.value;
        return (
          <Box
            key={opt.value}
            onClick={() => onChange(opt.value)}
            sx={{
              flex: 1,
              py: 0.9,
              px: 1.5,
              textAlign: "center",
              cursor: "pointer",
              borderRadius: "10px",
              fontSize: "0.86rem",
              fontWeight: isSelected ? 600 : 500,
              backgroundColor: isSelected ? SETTINGS_THEME.accent : "transparent",
              color: isSelected ? "#FFFFFF" : SETTINGS_THEME.textSecondary,
              transition: "all 0.2s ease",
              "&:hover": {
                color: "#FFFFFF",
              },
            }}
          >
            {opt.label}
          </Box>
        );
      })}
    </Box>
  );
};
