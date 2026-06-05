import React, { useState } from "react";
import {
  Box,
  Typography,
  Grid,
  CircularProgress,
  SwipeableDrawer,
  Stack,
  useTheme,
} from "@mui/material";
import { weatherIcons } from "../../elements/weatherTheme";

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

function WeatherDetailsDrawer({ weather, open, onClose }) {
  const theme = useTheme();
  if (!weather) return null;

  const isDark = theme.palette.mode === "dark";
  const currentCondition = weather.main || "Default";

  const bgGradient =
    (weatherBackgrounds[currentCondition] || weatherBackgrounds.Default)[
      isDark ? "dark" : "light"
    ];

  const textPrimary = theme.palette.text.primary;
  const textMuted = isDark
    ? "rgba(255,255,255,0.6)"
    : "rgba(0,0,0,0.55)";

  const formatTime = (unix, offset) =>
    new Date((unix + offset) * 1000).toISOString().substr(11, 5);

  const SectionTitle = ({ title, index }) => (
    <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 4, mb: 1.5 }}>
      <Typography
        variant="caption"
        sx={{
          fontWeight: 900,
          opacity: 0.4,
        }}
      >
        {index}.
      </Typography>
      <Typography
        variant="caption"
        sx={{
          fontWeight: 800,
          letterSpacing: 1.2,
          textTransform: "uppercase",
          color: textMuted,
        }}
      >
        {title}
      </Typography>
    </Stack>
  );

  const DataItem = ({ label, value, unit }) => {
    const theme = useTheme();
    const isDark = theme.palette.mode === "dark";

    return (
      <Box
        sx={{
          p: 2,
          borderRadius: 3,
          backdropFilter: "blur(12px)",
          background: isDark
            ? "rgba(255,255,255,0.06)"
            : "rgba(255,255,255,0.8)",
          border: isDark
            ? "1px solid rgba(255,255,255,0.14)"
            : "1px solid rgba(0,0,0,0.08)",
          transition: "transform 200ms ease, box-shadow 200ms ease",
          "&:hover": {
            transform: "translateY(-2px)",
            boxShadow: isDark
              ? "0 10px 30px rgba(0,0,0,0.4)"
              : "0 10px 30px rgba(0,0,0,0.15)",
          },
        }}
      >
        <Typography
          variant="caption"
          sx={{
            opacity: 0.65,
            fontWeight: 700,
            letterSpacing: 0.4,
          }}
        >
          {label}
        </Typography>

        <Typography
          variant="h6"
          fontWeight={900}
          sx={{ mt: 0.5, lineHeight: 1.2 }}
        >
          {value}
          <Box
            component="span"
            sx={{
              ml: 0.3,
              opacity: 0.6,
              fontSize: "0.8em",
              fontWeight: 600,
            }}
          >
            {unit}
          </Box>
        </Typography>
      </Box>
    );
  };

  return (
    <SwipeableDrawer
      anchor="bottom"
      open={open}
      onClose={onClose}
      onOpen={() => {}}
      PaperProps={{
        sx: {
          borderRadius: 6,
          m: 1,
          height: "75vh",
          background: bgGradient,
          backdropFilter: "blur(22px) saturate(1.4)",
          transition: "background 800ms ease",
        },
      }}
    >
      <Box
        sx={{
          p: 3,
          pb: 8,
          mx: "auto",
          color: textPrimary,
          width: "100%",
          maxWidth: 720,
        }}
      >
        {/* Drag Handle */}
        <Box
          sx={{
            width: 44,
            height: 4,
            borderRadius: 999,
            backgroundColor: isDark
              ? "rgba(255,255,255,0.3)"
              : "rgba(0,0,0,0.3)",
            mx: "auto",
            mb: 3,
          }}
        />

        {/* Header */}
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          mb={4}
        >
          <Box>
            <Typography variant="h5" fontWeight={900}>
              {weather.city}, {weather.country}
            </Typography>
            <Typography variant="caption" sx={{ color: textMuted }}>
              Station ID: {weather.id} • GMT
              {weather.timezone / 3600 >= 0 ? "+" : ""}
              {weather.timezone / 3600}
            </Typography>
          </Box>
        </Stack>

        {/* Hero Temperature */}
        <Box sx={{ textAlign: "center", mb: 5 }}>
          <Typography
            variant="h1"
            sx={{
              fontWeight: 900,
              fontSize: { xs: "4.5rem", sm: "5.5rem" },
              letterSpacing: -2,
            }}
          >
            {weather.temp}°
          </Typography>
          <Typography
            variant="h6"
            fontWeight={700}
            sx={{ opacity: 0.75, textTransform: "capitalize" }}
          >
            {weather.desc}
          </Typography>
        </Box>

        {/* Sections */}
        <SectionTitle index="1" title="Meteorological Data" />
        <Grid container spacing={2} sx={{ mt: 2 }}>
          <Grid item xs={6} sm={4}>
            <DataItem label="Feels Like" value={weather.feelsLike} unit="°C" />
          </Grid>
          <Grid item xs={6} sm={4}>
            <DataItem label="Pressure" value={weather.pressure} unit=" hPa" />
          </Grid>
          <Grid item xs={6} sm={4}>
            <DataItem label="Humidity" value={weather.humidity} unit="%" />
          </Grid>
          <Grid item xs={6} sm={4}>
            <DataItem
              label="Visibility"
              value={(weather.visibility / 1000).toFixed(1)}
              unit=" km"
            />
          </Grid>
        </Grid>

        <SectionTitle index="2" title="Sky & Precipitation" />
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <DataItem label="Cloudiness" value={weather.clouds} unit="%" />
          </Grid>
          <Grid item xs={6}>
            <DataItem label="Condition" value={weather.main} />
          </Grid>
          <Grid item xs={6}>
            <DataItem label="Rain (1h)" value={weather.rain || 0} unit=" mm" />
          </Grid>
          <Grid item xs={6}>
            <DataItem label="Snow (1h)" value={weather.snow || 0} unit=" mm" />
          </Grid>
        </Grid>

        <SectionTitle index="3" title="Wind & Atmosphere" />
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <DataItem label="Wind Speed" value={weather.windSpeed} unit=" m/s" />
          </Grid>
          <Grid item xs={6}>
            <DataItem label="Direction" value={weather.windDeg} unit="°" />
          </Grid>
          <Grid item xs={6}>
            <DataItem label="Gusts" value={weather.windGust || "—"} unit=" m/s" />
          </Grid>
        </Grid>

        <SectionTitle index="4" title="Solar & System" />
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <DataItem label="Sunrise" value={formatTime(weather.sunrise, 0)} />
          </Grid>
          <Grid item xs={6}>
            <DataItem label="Sunset" value={formatTime(weather.sunset, 0)} />
          </Grid>
        </Grid>
      </Box>
    </SwipeableDrawer>
  );
}

export default function WeatherWidget({
  weather,
  weatherLoading,
  mode,
  textColor,
  theme,
}) {
  const [weatherOpen, setWeatherOpen] = useState(false);

  return (
    <>
      <Box
        onClick={() => setWeatherOpen(true)}
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.6,
          px: 0,
          py: 1.3,
          borderRadius: 6,
          minHeight: 58,
          maxWidth: 200,
          width: { xs: "100%", sm: "auto" },
          border: "none",
          boxShadow: "none",
          cursor: "pointer",
          animation: "fadeIn 0.6s ease both",
          transition: "all 260ms cubic-bezier(0.4,0,0.2,1)",
          "&:hover": {
            transform: "translateY(-2px)",
            boxShadow: "none",
          },
        }}
      >
        {weatherLoading ? (
          <CircularProgress
            size={24}
            sx={{
              color: textColor,
            }}
          />
        ) : weather ? (
          <>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {weatherIcons[weather.main] || weatherIcons.Default}
            </Box>

            <Box sx={{ lineHeight: 1.2 }}>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 800,
                  letterSpacing: 0.2,
                  color: textColor,
                }}
              >
                {weather.temp}°C
                {weather.city && (
                  <Box component="span" sx={{ opacity: 0.8, fontWeight: 600 }}>
                    {" "}
                    · {weather.city}
                  </Box>
                )}
              </Typography>

              <Typography
                variant="caption"
                sx={{
                  textTransform: "capitalize",
                  color: theme.palette.text.secondary,
                  fontWeight: 600,
                }}
              >
                {weather.desc}
              </Typography>
            </Box>
          </>
        ) : (
          <Typography
            variant="body2"
            sx={{ color: textColor + "ac", fontWeight: 600 }}
          >
            Weather unavailable
          </Typography>
        )}
      </Box>

      <WeatherDetailsDrawer
        weather={weather}
        open={weatherOpen}
        onClose={() => setWeatherOpen(false)}
      />
    </>
  );
}
