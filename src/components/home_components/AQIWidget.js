import React, { useState } from "react";
import {
  Box,
  Typography,
  Grid,
  Stack,
  Divider,
  useTheme,
  useMediaQuery,
  IconButton,
  Collapse,
  SwipeableDrawer,
  LinearProgress,
} from "@mui/material";
import { Close as CloseIcon, ExpandMore as ExpandMoreIcon, InfoOutlined } from "@mui/icons-material";
import {
  designTokens,
  cardHover,
  drawerPaperSx,
  drawerBackdropSx,
  DrawerHandle,
} from "../../theme/designSystem";

// Color-blind safe AQI palette (Okabe–Ito inspired)
export const AQI_SCALE = [
  { max: 50, label: "Good", color: "#22c55e", bg: "rgba(34, 197, 94, 0.15)" },
  { max: 100, label: "Moderate", color: "#009E73", bg: "rgba(0, 158, 115, 0.15)" },
  { max: 150, label: "Unhealthy for Sensitive", color: "#E69F00", bg: "rgba(230, 159, 0, 0.15)" },
  { max: 200, label: "Unhealthy", color: "#D55E00", bg: "rgba(213, 94, 0, 0.15)" },
  { max: 300, label: "Severe", color: "#f0300e", bg: "rgba(240, 48, 14, 0.15)" },
  { max: Infinity, label: "Hazardous", color: "#7F0000", bg: "rgba(127, 0, 0, 0.2)" },
];

export const getAQIDetails = (aqi = 0) =>
  AQI_SCALE.find((d) => aqi <= d.max) || AQI_SCALE[0];

const getHealthAdvice = (label) => {
  switch (label) {
    case "Good":
      return "Air quality is satisfactory. Enjoy outdoor activities.";
    case "Moderate":
      return "Sensitive individuals should consider reducing prolonged outdoor exertion.";
    case "Unhealthy for Sensitive":
    case "Unhealthy":
      return "People with respiratory conditions should limit outdoor activity. Wear a mask if outside.";
    case "Severe":
    case "Hazardous":
      return "Health warning of emergency conditions. Keep windows closed and stay indoors.";
    default:
      return "Air quality monitored in real-time.";
  }
};

function parseAQIDate(dateStr) {
  if (!dateStr || typeof dateStr !== "string") return null;
  const match = dateStr.match(
    /(\d{2})-(\d{2})-(\d{4}) (\d{1,2}):(\d{2}) (AM|PM)/i
  );
  if (!match) return null;
  let [, dd, mm, yyyy, hh, min, period] = match;
  dd = Number(dd);
  mm = Number(mm) - 1;
  yyyy = Number(yyyy);
  hh = Number(hh);
  min = Number(min);
  if (period.toUpperCase() === "PM" && hh !== 12) hh += 12;
  if (period.toUpperCase() === "AM" && hh === 12) hh = 0;
  return new Date(yyyy, mm, dd, hh, min);
}

function AQIDetailContent({ aqiValue, label, color, aqiData, isDark, textPrimary, textMuted }) {
  const parsedDate = parseAQIDate(aqiData?.last_update);
  const lastUpdateTime = parsedDate
    ? parsedDate.toLocaleTimeString(undefined, {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Just now";

  const advice = getHealthAdvice(label);

  return (
    <Box>
      {/* ─── MAIN AQI & STATUS ─── */}
      <Box sx={{ textAlign: "center", mb: 3, py: 1 }}>
        <Typography
          variant="h2"
          fontWeight={900}
          sx={{
            color,
            letterSpacing: -1,
            lineHeight: 1,
            fontSize: { xs: "3rem", sm: "3.5rem" },
          }}
        >
          {aqiValue}
        </Typography>

        <Box
          sx={{
            display: "inline-block",
            mt: 1,
            px: 2,
            py: 0.5,
            borderRadius: 99,
            backgroundColor: `${color}22`,
            border: `1px solid ${color}44`,
          }}
        >
          <Typography variant="subtitle2" fontWeight={800} sx={{ color }}>
            AQI • {label}
          </Typography>
        </Box>
      </Box>

      {/* ─── HEALTH ADVICE ─── */}
      <Box
        sx={{
          mb: 3,
          p: 1.8,
          borderRadius: 3,
          background: isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.03)",
          border: `1px solid ${isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.06)"}`,
        }}
      >
        <Typography variant="caption" sx={{ textTransform: "uppercase", color: textMuted, fontWeight: 800, letterSpacing: 0.8, display: "block", mb: 0.5 }}>
          Health Advisory
        </Typography>
        <Typography variant="body2" sx={{ color: textPrimary, fontWeight: 500, lineHeight: 1.4 }}>
          {advice}
        </Typography>
      </Box>

      {/* ─── LOCATION & TIME ─── */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="caption" sx={{ textTransform: "uppercase", color: textMuted, fontWeight: 800, letterSpacing: 1 }}>
          Station Information
        </Typography>
        <Stack spacing={1.2} mt={1}>
          {[
            ["Station", aqiData?.station || "Nearest Monitoring Station"],
            ["City & State", `${aqiData?.city || "Local"}, ${aqiData?.state || "Region"}`],
            ["Last Updated", lastUpdateTime],
          ].map(([labelText, value]) => (
            <Stack key={labelText} direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="body2" sx={{ color: textMuted }}>
                {labelText}
              </Typography>
              <Typography variant="body2" fontWeight={700} sx={{ color: textPrimary, textAlign: "right", maxWidth: "60%" }}>
                {value}
              </Typography>
            </Stack>
          ))}
        </Stack>
      </Box>

      <Divider sx={{ mb: 2.5 }} />

      {/* ─── POLLUTANTS ─── */}
      {aqiData?.pollutants && Object.keys(aqiData.pollutants).length > 0 && (
        <Box>
          <Typography variant="caption" sx={{ textTransform: "uppercase", color: textMuted, fontWeight: 800, letterSpacing: 1, display: "block", mb: 1.5 }}>
            Real-time Pollutants Breakdown
          </Typography>

          <Grid container spacing={1.5}>
            {Object.entries(aqiData.pollutants).map(([key, pollutant]) => {
              const val = parseFloat(pollutant.value) || 0;
              const maxScale = key.includes("PM2.5") ? 100 : key.includes("PM10") ? 150 : 200;
              const progressVal = Math.min(100, (val / maxScale) * 100);

              return (
                <Grid item xs={6} sm={4} key={key}>
                  <Box
                    sx={{
                      p: 1.5,
                      borderRadius: 3,
                      background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.03)",
                      border: isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(0,0,0,0.06)",
                    }}
                  >
                    <Typography variant="caption" sx={{ color: textMuted, fontWeight: 700 }}>
                      {key.toUpperCase()}
                    </Typography>
                    <Typography variant="body1" fontWeight={900} sx={{ color: textPrimary, my: 0.5 }}>
                      {pollutant.value}{" "}
                      <Box component="span" sx={{ fontSize: "0.75em", opacity: 0.6, fontWeight: 600 }}>
                        {pollutant.unit}
                      </Box>
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={progressVal}
                      sx={{
                        height: 4,
                        borderRadius: 2,
                        bgcolor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)",
                        "& .MuiLinearProgress-bar": {
                          bgcolor: color,
                          borderRadius: 2,
                        },
                      }}
                    />
                  </Box>
                </Grid>
              );
            })}
          </Grid>
        </Box>
      )}
    </Box>
  );
}

function AQIDetailsDrawer({ aqiValue, label, color, aqiData, open, onClose }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
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
          background: `linear-gradient(145deg, ${color}20 0%, ${isDark ? "#121212" : "#ffffff"} 70%)`,
        },
      }}
    >
      <Box sx={{ p: { xs: 2.5, sm: 3 }, pb: 6, color: textPrimary, width: "100%", maxWidth: 600, mx: "auto" }}>
        <DrawerHandle mode={isDark ? "dark" : "light"} />

        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2.5}>
          <Typography variant="h6" fontWeight={900} sx={{ color: textPrimary }}>
            Air Quality Index
          </Typography>
          <IconButton size="small" onClick={onClose} sx={{ color: textPrimary, bgcolor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)" }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Stack>

        <AQIDetailContent
          aqiValue={aqiValue}
          label={label}
          color={color}
          aqiData={aqiData}
          isDark={isDark}
          textPrimary={textPrimary}
          textMuted={textMuted}
        />
      </Box>
    </SwipeableDrawer>
  );
}

export default function AQIWidget({ aqiData, mode }) {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));
  const [open, setOpen] = useState(false);
  const [expandedDesktop, setExpandedDesktop] = useState(false);

  const aqiValue = aqiData?.maxAqi ?? 42; // default healthy baseline if loading
  const { label, color } = getAQIDetails(aqiValue);
  const isDark = (mode || theme.palette.mode) === "dark";
  const textPrimary = theme.palette.text.primary;
  const textMuted = isDark ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.55)";

  const handleWidgetClick = () => {
    if (isDesktop) {
      setExpandedDesktop((prev) => !prev);
    } else {
      setOpen(true);
    }
  };

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
        {/* COMPACT TRIGGER */}
        <Box
          onClick={handleWidgetClick}
          sx={{
            px: 0,
            py: 1,
            pr: 0,
            borderRadius: designTokens.radii.card,
            cursor: "pointer",
            ...cardHover,
            minHeight: 56,
            minWidth: 120,
            maxWidth: expandedDesktop && isDesktop ? "100%" : 160,
            background: 'transaprent',
            border: `0px solid ${isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.06)"}`,
            backdropFilter: "blur(14px)",
            WebkitBackdropFilter: "blur(14px)",
            boxShadow: "none",
            display: "flex",
            alignItems: "right",
            alignContent: 'right',
            justifyContent: "space-between",
            gap: 1,
          }}
        >
          <Box sx={{ textAlign: "right", lineHeight: 1.2, pr: 0 }}>
              <Typography variant="h5" sx={{ fontWeight: 900, color }}>
                {aqiValue}
              <Typography variant="caption" sx={{ color: textMuted, fontWeight: 300 }}>
                AQI
              </Typography>
              </Typography>
            <Typography variant="caption" sx={{ color: textMuted, fontWeight: 600 }}>
              {label}
            </Typography>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center" }}>
            {isDesktop ? (
              <IconButton
                size="small"
                sx={{
                  p: 0.5,
                  transform: expandedDesktop ? "rotate(180deg)" : "rotate(0deg)",
                  transition: "transform 0.3s ease",
                  color: textMuted,
                }}
              >
                <ExpandMoreIcon fontSize="small" />
              </IconButton>
            ) : (
              <InfoOutlined sx={{ fontSize: 16, color: textMuted, opacity: 0 }} />
            )}
          </Box>
        </Box>

        {/* DESKTOP EXPANDED DETAILS CARD */}
        {isDesktop && (
          <Collapse in={expandedDesktop} timeout="auto" unmountOnExit>
            <Box
              sx={{
                mt: 1.5,
                p: 2.5,
                borderRadius: designTokens.radii.card,
                background: `linear-gradient(145deg, ${color}15 0%, ${isDark ? "rgba(20,20,20,0.85)" : "rgba(255,255,255,0.9)"} 80%)`,
                border: `1px solid ${isDark ? "rgba(255, 255, 255, 0.12)" : "rgba(0, 0, 0, 0.08)"}`,
                backdropFilter: "blur(24px)",
                WebkitBackdropFilter: "blur(24px)",
                boxShadow: isDark
                  ? "0 20px 40px rgba(0,0,0,0.6), inset 0 1px 2px rgba(255,255,255,0.15)"
                  : "0 20px 40px rgba(0,0,0,0.1), inset 0 1px 2px rgba(255,255,255,0.9)",
              }}
            >
              <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="subtitle1" fontWeight={900} sx={{ color: textPrimary }}>
                  Air Quality Details
                </Typography>
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

              <AQIDetailContent
                aqiValue={aqiValue}
                label={label}
                color={color}
                aqiData={aqiData}
                isDark={isDark}
                textPrimary={textPrimary}
                textMuted={textMuted}
              />
            </Box>
          </Collapse>
        )}
      </Box>

      {/* MOBILE SWIPEABLE DRAWER */}
      {!isDesktop && (
        <AQIDetailsDrawer
          aqiValue={aqiValue}
          label={label}
          color={color}
          aqiData={aqiData}
          open={open}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
