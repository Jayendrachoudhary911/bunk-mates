import React, { useState } from "react";
import {
  Box,
  Typography,
  Grid,
  CircularProgress,
  SwipeableDrawer,
  Stack,
  useTheme,
  useMediaQuery,
  IconButton,
  Collapse,
} from "@mui/material";
import { Close as CloseIcon, ExpandMore as ExpandMoreIcon } from "@mui/icons-material";
import { weatherIcons } from "../../elements/weatherTheme";
import {
  designTokens,
  cardHover,
  drawerPaperSx,
  drawerBackdropSx,
  DrawerHandle,
  flexRowSx,
} from "../../theme/designSystem";

const weatherBackgrounds = {
  Clear: {
    light: "linear-gradient(180deg, #a9e4ff 0%, #e0f2fe 70%, #f1f1f1 100%)",
    dark: "linear-gradient(180deg, #15285bcc 0%, #0c0c0c 100%)",
  },
  Clouds: {
    light: "linear-gradient(180deg, #cbd5e1 0%, #e2e8f0 50%, #f8fafc 100%)",
    dark: "linear-gradient(180deg, #1e293b 0%, #0f172a 100%)",
  },
  Rain: {
    light: "linear-gradient(180deg, #94a3b8 0%, #cbd5e1 60%, #dbeafe 100%)",
    dark: "linear-gradient(180deg, #0f172a 0%, #020617 100%)",
  },
  Drizzle: {
    light: "linear-gradient(180deg, #b1bfd8 0%, #dfe9f3 100%)",
    dark: "linear-gradient(180deg, #2c3e50 0%, #000000 100%)",
  },
  Thunderstorm: {
    light: "linear-gradient(180deg, #9ca3af 0%, #4b5563 40%, #8b5cf6 100%)",
    dark: "linear-gradient(180deg, #020617 0%, #1e1b4b 70%, #000000 100%)",
  },
  Snow: {
    light: "linear-gradient(180deg, #f1f5f9 0%, #ffffff 100%)",
    dark: "linear-gradient(180deg, #334155 0%, #0f172a 100%)",
  },
  Mist: {
    light: "linear-gradient(180deg, #d1d5db 0%, #f3f4f6 100%)",
    dark: "linear-gradient(180deg, #374151 0%, #111827 100%)",
  },
  Haze: {
    light: "linear-gradient(180deg, #e5e7eb 0%, #d1d5db 50%, #fef3c7 100%)",
    dark: "linear-gradient(180deg, #1f2937 0%, #111827 100%)",
  },
  Default: {
    light: "linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)",
    dark: "linear-gradient(180deg, #020617 0%, #000000 100%)",
  },
};

const formatTime = (unix, offset = 0) => {
  if (!unix) return "—";
  return new Date((unix + offset) * 1000).toISOString().substr(11, 5);
};

export function WeatherDataGrid({ weather, isDark, textMuted }) {
  const DataItem = ({ label, value, unit = "" }) => (
    <Box
      sx={{
        p: 1.6,
        borderRadius: 3,
        backdropFilter: "blur(12px)",
        background: isDark ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.75)",
        border: isDark ? "1px solid rgba(255,255,255,0.12)" : "1px solid rgba(0,0,0,0.06)",
        transition: "all 0.2s ease",
        "&:hover": {
          transform: "translateY(-2px)",
          boxShadow: isDark ? "0 8px 24px rgba(0,0,0,0.3)" : "0 8px 20px rgba(0,0,0,0.08)",
        },
      }}
    >
      <Typography variant="caption" sx={{ opacity: 0.65, fontWeight: 700, letterSpacing: 0.4 }}>
        {label}
      </Typography>
      <Typography variant="h6" fontWeight={900} sx={{ mt: 0.5, lineHeight: 1.2 }}>
        {value}
        {unit && (
          <Box component="span" sx={{ ml: 0.3, opacity: 0.6, fontSize: "0.8em", fontWeight: 600 }}>
            {unit}
          </Box>
        )}
      </Typography>
    </Box>
  );

  return (
    <Box>
      <Typography variant="caption" sx={{ fontWeight: 800, letterSpacing: 1.2, textTransform: "uppercase", color: textMuted, display: "block", mb: 1 }}>
        Meteorological Data
      </Typography>
      <Grid container spacing={1.5} sx={{ mb: 2.5 }}>
        <Grid item xs={6} sm={4}>
          <DataItem label="Feels Like" value={weather.feelsLike ?? "—"} unit="°C" />
        </Grid>
        <Grid item xs={6} sm={4}>
          <DataItem label="Humidity" value={weather.humidity ?? "—"} unit="%" />
        </Grid>
        <Grid item xs={6} sm={4}>
          <DataItem label="Pressure" value={weather.pressure ?? "—"} unit=" hPa" />
        </Grid>
        <Grid item xs={6} sm={4}>
          <DataItem label="Visibility" value={weather.visibility ? (weather.visibility / 1000).toFixed(1) : "—"} unit=" km" />
        </Grid>
        <Grid item xs={6} sm={4}>
          <DataItem label="Cloud Cover" value={weather.clouds ?? "—"} unit="%" />
        </Grid>
        <Grid item xs={6} sm={4}>
          <DataItem label="Rain / Snow" value={weather.rain || weather.snow ? `${weather.rain || weather.snow}` : "0"} unit=" mm" />
        </Grid>
      </Grid>

      <Typography variant="caption" sx={{ fontWeight: 800, letterSpacing: 1.2, textTransform: "uppercase", color: textMuted, display: "block", mb: 1 }}>
        Wind & Atmosphere
      </Typography>
      <Grid container spacing={1.5} sx={{ mb: 2.5 }}>
        <Grid item xs={6} sm={4}>
          <DataItem label="Wind Speed" value={weather.windSpeed ?? weather.wind ?? "—"} unit=" m/s" />
        </Grid>
        <Grid item xs={6} sm={4}>
          <DataItem label="Direction" value={weather.windDeg ? `${weather.windDeg}°` : "—"} />
        </Grid>
        <Grid item xs={6} sm={4}>
          <DataItem label="Gusts" value={weather.windGust || "—"} unit=" m/s" />
        </Grid>
      </Grid>

      <Typography variant="caption" sx={{ fontWeight: 800, letterSpacing: 1.2, textTransform: "uppercase", color: textMuted, display: "block", mb: 1 }}>
        Sun & Daylight
      </Typography>
      <Grid container spacing={1.5}>
        <Grid item xs={6}>
          <DataItem label="Sunrise" value={formatTime(weather.sunrise, 0)} />
        </Grid>
        <Grid item xs={6}>
          <DataItem label="Sunset" value={formatTime(weather.sunset, 0)} />
        </Grid>
      </Grid>
    </Box>
  );
}

function WeatherDetailsDrawer({ weather, open, onClose }) {
  const theme = useTheme();
  if (!weather) return null;

  const isDark = theme.palette.mode === "dark";
  const currentCondition = weather.main || "Default";
  const bgGradient = (weatherBackgrounds[currentCondition] || weatherBackgrounds.Default)[isDark ? "dark" : "light"];
  const textPrimary = theme.palette.text.primary;
  const textMuted = isDark ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.55)";

  return (
    <SwipeableDrawer
      anchor="bottom"
      open={open}
      onClose={onClose}
      onOpen={() => {}}
      ModalProps={{ BackdropProps: { sx: drawerBackdropSx } }}
      PaperProps={{
        sx: {
          ...drawerPaperSx(isDark ? "dark" : "light"),
          m: { xs: 0, md: "auto" },
          maxHeight: "85vh",
          background: bgGradient,
          transition: "background 800ms ease",
        },
      }}
    >
      <Box sx={{ p: { xs: 2.5, sm: 3 }, pb: 6, color: textPrimary, width: "100%", maxWidth: 640, mx: "auto" }}>
        <DrawerHandle mode={isDark ? "dark" : "light"} />

        {/* Header */}
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
          <Box>
            <Typography variant="h5" fontWeight={900}>
              {weather.city || "Current Location"}, {weather.country || ""}
            </Typography>
            <Typography variant="caption" sx={{ color: textMuted }}>
              Station ID: {weather.id || "Live"} • GMT{weather.timezone ? (weather.timezone / 3600 >= 0 ? "+" : "") + weather.timezone / 3600 : ""}
            </Typography>
          </Box>
          <IconButton size="small" onClick={onClose} sx={{ color: textPrimary, bgcolor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)" }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Stack>

        {/* Hero Temp */}
        <Box sx={{ textAlign: "center", mb: 4, py: 1 }}>
          <Box sx={{ display: "inline-flex", p: 1, mb: 1 }}>
            {weatherIcons[weather.main] || weatherIcons.Default}
          </Box>
          <Typography variant="h1" sx={{ fontWeight: 900, fontSize: { xs: "3.5rem", sm: "4.5rem" }, letterSpacing: -2, lineHeight: 1 }}>
            {weather.temp}°
          </Typography>
          <Typography variant="h6" fontWeight={700} sx={{ opacity: 0.8, textTransform: "capitalize", mt: 0.5 }}>
            {weather.desc}
          </Typography>
        </Box>

        <WeatherDataGrid weather={weather} isDark={isDark} textMuted={textMuted} />
      </Box>
    </SwipeableDrawer>
  );
}

export default function WeatherWidget({
  weather,
  weatherLoading,
  mode,
  textColor,
  theme: themeProp,
}) {
  const muiTheme = useTheme();
  const theme = themeProp || muiTheme;
  const [weatherOpen, setWeatherOpen] = useState(false);
  const [expandedDesktop, setExpandedDesktop] = useState(false);
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));
  const isDark = (mode || theme.palette.mode) === "dark";

  const handleWidgetClick = () => {
    if (isDesktop) {
      setExpandedDesktop((prev) => !prev);
    } else {
      setWeatherOpen(true);
    }
  };

  const currentCondition = weather?.main || "Default";
  const bgGradient = (weatherBackgrounds[currentCondition] || weatherBackgrounds.Default)[isDark ? "dark" : "light"];
  const textMuted = isDark ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.55)";

  return (
    <>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          borderRadius: designTokens.radii.card,
          transition: "all 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
          position: "relative",
          zIndex: expandedDesktop ? 10 : 2,
        }}
      >
        {/* COMPACT PILL / TRIGGER */}
        <Box
          onClick={handleWidgetClick}
          sx={{
            ...flexRowSx,
            gap: 1.6,
            px: 1.5,
            py: 1.2,
            borderRadius: designTokens.radii.card,
            minHeight: 56,
            maxWidth: expandedDesktop && isDesktop ? "100%" : 220,
            cursor: "pointer",
            ...cardHover,
            background: 'transparent',
            border: `0px solid ${isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.06)"}`,
            backdropFilter: "blur(14px)",
            WebkitBackdropFilter: "blur(14px)",
            boxShadow: 'none',
          }}
        >
          {weatherLoading ? (
            <CircularProgress size={22} sx={{ color: textColor }} />
          ) : weather ? (
            <>
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                {weatherIcons[weather.main] || weatherIcons.Default}
              </Box>

              <Box sx={{ lineHeight: 1.2, flex: 1 }}>
                <Typography variant="h6" sx={{ fontWeight: 800, letterSpacing: 0.2, color: textColor, fontSize: "1rem" }}>
                  {weather.temp}°C
                  {weather.city && (
                    <Box component="span" sx={{ opacity: 0.8, fontWeight: 600, fontSize: "0.85rem" }}>
                      {" "}· {weather.city}
                    </Box>
                  )}
                </Typography>

                <Typography variant="caption" sx={{ textTransform: "capitalize", color: theme.palette.text.secondary, fontWeight: 600 }}>
                  {weather.desc}
                </Typography>
              </Box>

              {isDesktop && (
                <IconButton
                  size="small"
                  sx={{
                    p: 0.5,
                    transform: expandedDesktop ? "rotate(180deg)" : "rotate(0deg)",
                    transition: "transform 0.3s ease",
                    color: textColor,
                    opacity: 0.7,
                  }}
                >
                  <ExpandMoreIcon fontSize="small" />
                </IconButton>
              )}
            </>
          ) : (
            <Typography variant="body2" sx={{ color: textColor + "ac", fontWeight: 600 }}>
              Weather unavailable
            </Typography>
          )}
        </Box>

        {/* DESKTOP EXPANDED DETAILS CARD */}
        {isDesktop && weather && (
          <Collapse in={expandedDesktop} timeout="auto" unmountOnExit>
            <Box
              sx={{
                mt: 1.5,
                p: 2.5,
                borderRadius: designTokens.radii.card,
                background: bgGradient,
                border: `1px solid ${isDark ? "rgba(255, 255, 255, 0.12)" : "rgba(0, 0, 0, 0.08)"}`,
                backdropFilter: "blur(24px)",
                WebkitBackdropFilter: "blur(24px)",
                boxShadow: isDark
                  ? "0 20px 40px rgba(0,0,0,0.6), inset 0 1px 2px rgba(255,255,255,0.15)"
                  : "0 20px 40px rgba(0,0,0,0.1), inset 0 1px 2px rgba(255,255,255,0.9)",
              }}
            >
              <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                <Box>
                  <Typography variant="subtitle1" fontWeight={900} sx={{ color: theme.palette.text.primary }}>
                    {weather.city || "Current Location"}, {weather.country || ""}
                  </Typography>
                  <Typography variant="caption" sx={{ color: textMuted }}>
                    Station ID: {weather.id || "Live"} • Detailed Forecast
                  </Typography>
                </Box>
                <IconButton
                  size="small"
                  onClick={() => setExpandedDesktop(false)}
                  sx={{
                    bgcolor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)",
                    "&:hover": { bgcolor: isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.1)" },
                  }}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Stack>

              <WeatherDataGrid weather={weather} isDark={isDark} textMuted={textMuted} />
            </Box>
          </Collapse>
        )}
      </Box>

      {/* MOBILE SWIPEABLE DRAWER */}
      {!isDesktop && (
        <WeatherDetailsDrawer
          weather={weather}
          open={weatherOpen}
          onClose={() => setWeatherOpen(false)}
        />
      )}
    </>
  );
}
