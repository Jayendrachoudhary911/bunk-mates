import React from "react";
import {
  Box,
  Typography,
  IconButton,
  Switch,
  Divider,
} from "@mui/material";
import { ArrowBack, ArrowForwardIos, Launch } from "@mui/icons-material";
import { useThemeToggle } from "../../contexts/ThemeToggleContext";

export function useSettingsTheme() {
  const { mode } = useThemeToggle();
  return mode || "dark";
}

export const getSettingsThemeTokens = (isDark = true) => ({
  bg: isDark ? "#0c0c0c" : "#f1f1f1",
  card: isDark ? "#161616" : "#ffffff",
  surface: isDark ? "#202024" : "#e4e6eb",
  textPrimary: isDark ? "#FFFFFF" : "#111111",
  textSecondary: isDark ? "#A0A3AD" : "#616770",
  divider: isDark ? "rgba(255, 255, 255, 0.06)" : "rgba(0, 0, 0, 0.06)",
  border: isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.06)",
  accent: "#287FE0",
  success: "#29C99A",
  error: "#F05252",
});

export const SETTINGS_THEME = {
  get bg() {
    const isLight = typeof document !== "undefined" && document.documentElement.getAttribute("data-theme") === "light";
    return isLight ? "#f1f1f1" : "#0c0c0c";
  },
  get card() {
    const isLight = typeof document !== "undefined" && document.documentElement.getAttribute("data-theme") === "light";
    return isLight ? "#ffffff" : "#161616";
  },
  get surface() {
    const isLight = typeof document !== "undefined" && document.documentElement.getAttribute("data-theme") === "light";
    return isLight ? "#e4e6eb" : "#202024";
  },
  get textPrimary() {
    const isLight = typeof document !== "undefined" && document.documentElement.getAttribute("data-theme") === "light";
    return isLight ? "#111111" : "#FFFFFF";
  },
  get textSecondary() {
    const isLight = typeof document !== "undefined" && document.documentElement.getAttribute("data-theme") === "light";
    return isLight ? "#616770" : "#A0A3AD";
  },
  get divider() {
    const isLight = typeof document !== "undefined" && document.documentElement.getAttribute("data-theme") === "light";
    return isLight ? "rgba(0, 0, 0, 0.06)" : "rgba(255, 255, 255, 0.06)";
  },
  get border() {
    const isLight = typeof document !== "undefined" && document.documentElement.getAttribute("data-theme") === "light";
    return isLight ? "rgba(0, 0, 0, 0.06)" : "rgba(255, 255, 255, 0.05)";
  },
  accent: "#287FE0",
  success: "#29C99A",
  error: "#F05252",
};

/**
 * Common Layout wrapper for Settings screens
 */
export function SettingsLayout({ children, maxWidth = 640, sx = {} }) {
  const mode = useSettingsTheme();
  const isDark = mode === "dark";
  const tokens = getSettingsThemeTokens(isDark);

  return (
    <Box
      sx={{
        width: "100%",
        minHeight: "100vh",
        bgcolor: tokens.bg,
        color: tokens.textPrimary,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        boxSizing: "border-box",
        px: { xs: 2, sm: 3 },
        pt: { xs: 2, sm: 3 },
        pb: { xs: 12, sm: 8 },
        transition: "background-color 0.2s ease, color 0.2s ease",
        ...sx,
      }}
    >
      <Box
        sx={{
          width: "100%",
          maxWidth,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {children}
      </Box>
    </Box>
  );
}

/**
 * Top Header matching the reference screenshots
 */
export function SettingsHeader({ title, onBack, rightAction, subtitle }) {
  const mode = useSettingsTheme();
  const isDark = mode === "dark";
  const tokens = getSettingsThemeTokens(isDark);

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        width: "100%",
        mb: 2.5,
        mt: 0.5,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
        {onBack && (
          <IconButton
            onClick={onBack}
            aria-label="Back"
            sx={{
              width: 42,
              height: 42,
              borderRadius: "50%",
              bgcolor: tokens.surface,
              color: tokens.textPrimary,
              border: `1px solid ${tokens.border}`,
              "&:hover": {
                bgcolor: isDark ? "rgba(255, 255, 255, 0.15)" : "rgba(0, 0, 0, 0.1)",
              },
            }}
          >
            <ArrowBack sx={{ fontSize: 20 }} />
          </IconButton>
        )}
        <Box>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 700,
              fontSize: { xs: "1.45rem", sm: "1.65rem" },
              color: tokens.textPrimary,
              letterSpacing: -0.3,
            }}
          >
            {title}
          </Typography>
          {subtitle && (
            <Typography
              variant="caption"
              sx={{ color: tokens.textSecondary, display: "block" }}
            >
              {subtitle}
            </Typography>
          )}
        </Box>
      </Box>

      {rightAction && <Box>{rightAction}</Box>}
    </Box>
  );
}

/**
 * Section Title
 */
export function SettingsSection({ title, sx = {} }) {
  const mode = useSettingsTheme();
  const isDark = mode === "dark";
  const tokens = getSettingsThemeTokens(isDark);

  return (
    <Typography
      variant="caption"
      sx={{
        textTransform: "uppercase",
        letterSpacing: "1.2px",
        fontWeight: 700,
        fontSize: "0.75rem",
        color: tokens.textSecondary,
        ml: 1.5,
        mb: 1.2,
        mt: 3,
        display: "block",
        ...sx,
      }}
    >
      {title}
    </Typography>
  );
}

/**
 * Grouped rounded card
 */
export function SettingsGroup({ children, sx = {} }) {
  const mode = useSettingsTheme();
  const isDark = mode === "dark";
  const tokens = getSettingsThemeTokens(isDark);

  return (
    <Box
      sx={{
        bgcolor: tokens.card,
        borderRadius: "26px",
        border: `1px solid ${tokens.border}`,
        boxShadow: isDark ? "none" : "0 2px 12px rgba(0,0,0,0.03)",
        overflow: "hidden",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        transition: "background-color 0.2s ease, border-color 0.2s ease",
        ...sx,
      }}
    >
      {children}
    </Box>
  );
}

function renderSettingIcon(Icon, danger = false) {
  if (!Icon) return null;
  if (React.isValidElement(Icon)) {
    return Icon;
  }
  const Comp = Icon;
  return <Comp sx={{ fontSize: 20 }} />;
}

/**
 * Row item with icon, label, subtitle, and trailing action
 */
export function SettingsRow({
  icon: IconComponent,
  title,
  subtitle,
  onClick,
  trailing,
  showChevron = true,
  isExternal = false,
  showDivider = false,
  disabled = false,
  danger = false,
}) {
  const mode = useSettingsTheme();
  const isDark = mode === "dark";
  const tokens = getSettingsThemeTokens(isDark);

  return (
    <>
      <Box
        component={onClick ? "button" : "div"}
        onClick={disabled ? undefined : onClick}
        type={onClick ? "button" : undefined}
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%",
          py: 1.7,
          px: 2.2,
          bgcolor: "transparent",
          border: "none",
          outline: "none",
          textAlign: "left",
          cursor: disabled ? "not-allowed" : onClick ? "pointer" : "default",
          opacity: disabled ? 0.45 : 1,
          transition: "background-color 0.15s ease",
          "&:hover": onClick && !disabled ? { bgcolor: isDark ? "rgba(255, 255, 255, 0.04)" : "rgba(0, 0, 0, 0.04)" } : {},
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, flex: 1, minWidth: 0, pr: 1.5 }}>
          {IconComponent && (
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                bgcolor: tokens.surface,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: danger ? tokens.error : tokens.textPrimary,
                flexShrink: 0,
              }}
            >
              {renderSettingIcon(IconComponent, danger)}
            </Box>
          )}

          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography
              variant="body1"
              sx={{
                fontWeight: 600,
                fontSize: "0.95rem",
                color: danger ? tokens.error : tokens.textPrimary,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {title}
            </Typography>
            {subtitle && (
              <Typography
                variant="caption"
                sx={{
                  color: tokens.textSecondary,
                  fontSize: "0.8rem",
                  display: "block",
                  lineHeight: 1.35,
                  mt: 0.2,
                  whiteSpace: "normal",
                }}
              >
                {subtitle}
              </Typography>
            )}
          </Box>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexShrink: 0 }}>
          {trailing}
          {showChevron && !trailing && (
            isExternal ? (
              <Launch sx={{ fontSize: 18, color: tokens.textSecondary }} />
            ) : (
              <ArrowForwardIos sx={{ fontSize: 14, color: tokens.textSecondary }} />
            )
          )}
        </Box>
      </Box>
      {showDivider && (
        <Divider sx={{ borderColor: tokens.divider, ml: IconComponent ? "76px" : 2, mr: 2 }} />
      )}
    </>
  );
}

/**
 * Switch row item
 */
export function SettingsSwitchRow({
  icon: IconComponent,
  title,
  subtitle,
  checked,
  onChange,
  showDivider = false,
  disabled = false,
}) {
  const mode = useSettingsTheme();
  const isDark = mode === "dark";
  const tokens = getSettingsThemeTokens(isDark);

  return (
    <>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%",
          py: 1.6,
          px: 2.2,
          opacity: disabled ? 0.45 : 1,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, flex: 1, minWidth: 0, pr: 1.5 }}>
          {IconComponent && (
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                bgcolor: tokens.surface,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: tokens.textPrimary,
                flexShrink: 0,
              }}
            >
              {renderSettingIcon(IconComponent)}
            </Box>
          )}

          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography
              variant="body1"
              sx={{
                fontWeight: 600,
                fontSize: "0.95rem",
                color: tokens.textPrimary,
              }}
            >
              {title}
            </Typography>
            {subtitle && (
              <Typography
                variant="caption"
                sx={{
                  color: tokens.textSecondary,
                  fontSize: "0.8rem",
                  display: "block",
                  lineHeight: 1.35,
                  mt: 0.2,
                }}
              >
                {subtitle}
              </Typography>
            )}
          </Box>
        </Box>

        <Switch
          checked={Boolean(checked)}
          onChange={(e) => onChange && onChange(e.target.checked)}
          disabled={disabled}
          sx={{
            "& .MuiSwitch-switchBase.Mui-checked": {
              color: "#FFFFFF",
              "& + .MuiSwitch-track": {
                backgroundColor: tokens.accent,
                opacity: 1,
              },
            },
            "& .MuiSwitch-track": {
              backgroundColor: isDark ? "rgba(255, 255, 255, 0.2)" : "rgba(0, 0, 0, 0.2)",
              opacity: 1,
              borderRadius: 16,
            },
          }}
        />
      </Box>
      {showDivider && (
        <Divider sx={{ borderColor: tokens.divider, ml: IconComponent ? "76px" : 2, mr: 2 }} />
      )}
    </>
  );
}

/**
 * Segmented Control for 2-4 mutual options
 */
export function SettingsSegmentedControl({ options = [], value, onChange }) {
  const mode = useSettingsTheme();
  const isDark = mode === "dark";
  const tokens = getSettingsThemeTokens(isDark);

  return (
    <Box
      sx={{
        display: "flex",
        bgcolor: tokens.surface,
        borderRadius: "16px",
        p: 0.5,
        width: "100%",
        boxSizing: "border-box",
      }}
    >
      {options.map((opt) => {
        const isSelected = opt.value === value;
        return (
          <Box
            key={opt.value}
            component="button"
            type="button"
            onClick={() => onChange(opt.value)}
            sx={{
              flex: 1,
              py: 1,
              px: 1.5,
              borderRadius: "12px",
              border: "none",
              outline: "none",
              cursor: "pointer",
              bgcolor: isSelected ? tokens.accent : "transparent",
              color: isSelected ? "#FFFFFF" : tokens.textSecondary,
              fontWeight: isSelected ? 700 : 500,
              fontSize: "0.85rem",
              transition: "all 0.2s ease",
              textAlign: "center",
              "&:hover": {
                color: isSelected ? "#FFFFFF" : tokens.textPrimary,
              },
            }}
          >
            {opt.label}
          </Box>
        );
      })}
    </Box>
  );
}

