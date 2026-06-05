import {
  motion,
  AnimatePresence,
  useMotionValue,
  useTransform,
  animate,
} from "framer-motion";
import { createPortal } from "react-dom";
import { Box, Stack, Typography, useTheme, Divider, Grid } from "@mui/material";
import { InfoOutlined, WbSunnyOutlined } from "@mui/icons-material";

const getHealthAdvice = (label) => {
  switch (label) {
    case "Good":
      return "Air quality is satisfactory. Enjoy outdoor activities.";
    case "Moderate":
      return "Sensitive individuals should consider reducing prolonged outdoor exertion.";
    case "Unhealthy":
      return "People with respiratory conditions should limit outdoor activity.";
    case "Very Unhealthy":
      return "Avoid prolonged outdoor exposure. Wear a mask if necessary.";
    case "Severe":
    case "Hazardous":
      return "Health warnings of emergency conditions. Stay indoors.";
    default:
      return "";
  }
};

function parseAQIDate(dateStr) {
  if (!dateStr || typeof dateStr !== "string") return null;

  // Expected format: "DD-MM-YYYY HH:MM AM/PM"
  const match = dateStr.match(
    /(\d{2})-(\d{2})-(\d{4}) (\d{1,2}):(\d{2}) (AM|PM)/i
  );

  if (!match) return null;

  let [, dd, mm, yyyy, hh, min, period] = match;

  dd = Number(dd);
  mm = Number(mm) - 1; // JS months are 0-based
  yyyy = Number(yyyy);
  hh = Number(hh);
  min = Number(min);

  if (period.toUpperCase() === "PM" && hh !== 12) hh += 12;
  if (period.toUpperCase() === "AM" && hh === 12) hh = 0;

  return new Date(yyyy, mm, dd, hh, min);
}

function AQIDetailsDrawer({ aqiValue, label, color, aqiData, onClose }) {
  const theme = useTheme();
  const parsedDate = parseAQIDate(aqiData?.last_update);

  const lastUpdateTime = parsedDate
    ? parsedDate.toLocaleTimeString(undefined, {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Just now";

  const textPrimary = theme.palette.text.primary;
  const textSecondary = theme.palette.text.secondary;
  const textMuted =
    theme.palette.mode === "dark"
      ? "rgba(255,255,255,0.55)"
      : "rgba(0,0,0,0.55)";

  return (
    <Box
      sx={{
        p: 3,
        pb: 5,
        pt: 2,
        maxWidth: 720,
        mx: "auto",

        /* Background stays expressive */
        background: `linear-gradient(
          145deg,
          ${color}55,
          ${color}15,
          transparent
        )`,
      }}
    >
      {/* ─── DRAG HANDLE ─── */}
      <Box
        sx={{
          width: 42,
          height: 4,
          borderRadius: 999,
          backgroundColor:
            theme.palette.mode === "dark"
              ? "rgba(255,255,255,0.28)"
              : "rgba(0,0,0,0.25)",
          mx: "auto",
          mb: 2,
        }}
      />

      {/* ─── HEADER ─── */}
      <Stack direction="row" alignItems="center" mb={3}>
        <Box>
          <Typography
            variant="h6"
            fontWeight={900}
            sx={{ lineHeight: 1.1, color: textPrimary }}
          >
            Air Quality Index
          </Typography>

          <Typography
            variant="caption"
            sx={{ color: textMuted, letterSpacing: 0.3 }}
          >
            Station: {aqiData?.station || "Unknown Station"}
          </Typography>
        </Box>
      </Stack>

      {/* ─── MAIN AQI ─── */}
      <Box sx={{ textAlign: "center", mb: 4 }}>
        <Typography
          variant="h2"
          fontWeight={900}
          sx={{
            color,
            letterSpacing: -1,
          }}
        >
          {aqiValue}
        </Typography>

        <Typography
          variant="subtitle1"
          fontWeight={800}
          sx={{ color, opacity: 0.9 }}
        >
          {label}
        </Typography>
      </Box>

      {/* ─── LOCATION & TIME ─── */}
      <Box sx={{ mb: 3 }}>
        <Typography
          variant="caption"
          sx={{
            textTransform: "uppercase",
            color: textMuted,
            fontWeight: 800,
            letterSpacing: 1,
          }}
        >
          Location Information
        </Typography>

        <Stack spacing={1.2} mt={1.5}>
          {[
            ["City & State", `${aqiData?.city}, ${aqiData?.state}`],
            ["Last Updated", lastUpdateTime],
          ].map(([labelText, value]) => (
            <Stack
              key={labelText}
              direction="row"
              justifyContent="space-between"
            >
              <Typography variant="body2" sx={{ color: textMuted }}>
                {labelText}
              </Typography>
              <Typography
                variant="body2"
                fontWeight={700}
                sx={{ color: textPrimary }}
              >
                {value}
              </Typography>
            </Stack>
          ))}
        </Stack>
      </Box>

      <Divider sx={{ mb: 4 }} />

      {/* ─── POLLUTANTS ─── */}
      {aqiData?.pollutants && (
        <Box sx={{ mb: 4 }}>
          <Typography
            variant="caption"
            sx={{
              textTransform: "uppercase",
              color: textMuted,
              fontWeight: 800,
              letterSpacing: 1,
            }}
          >
            Real-time Pollutants
          </Typography>

          <Grid container spacing={1.8} mt={1.5}>
            {Object.entries(aqiData.pollutants).map(([key, pollutant]) => (
              <Grid item xs={6} sm={4} key={key}>
                <Box
                  sx={{
                    p: 1.6,
                    borderRadius: 3,
                    background:
                      theme.palette.mode === "dark"
                        ? "rgba(255,255,255,0.06)"
                        : "rgba(0,0,0,0.04)",
                    border:
                      theme.palette.mode === "dark"
                        ? "1px solid rgba(255,255,255,0.1)"
                        : "1px solid rgba(0,0,0,0.08)",
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{ color: textMuted }}
                  >
                    {key.toUpperCase()}
                  </Typography>

                  <Typography
                    variant="body1"
                    fontWeight={900}
                    sx={{ color: textPrimary }}
                  >
                    {pollutant.value}{" "}
                    <Box
                      component="span"
                      sx={{ fontSize: "0.7em", color: textMuted }}
                    >
                      {pollutant.unit}
                    </Box>
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* ─── HEALTH ADVISORY ─── */}
      <Box
        sx={{
          p: 2.2,
          borderRadius: 3,
          background:
            theme.palette.mode === "dark"
              ? "rgba(255,255,255,0.05)"
              : "rgba(0,0,0,0.04)",
          border:
            theme.palette.mode === "dark"
              ? "1px solid rgba(255,255,255,0.1)"
              : "1px solid rgba(0,0,0,0.08)",
          mb: 4,
        }}
      >
        <Stack direction="row" spacing={1} alignItems="center" mb={1}>
          <WbSunnyOutlined sx={{ fontSize: 18, color }} />
          <Typography
            variant="subtitle2"
            fontWeight={800}
            sx={{ color: textPrimary }}
          >
            Health Advisory
          </Typography>
        </Stack>

        <Typography
          variant="body2"
          sx={{ color: textSecondary, lineHeight: 1.5 }}
        >
          {getHealthAdvice(label)}
        </Typography>
      </Box>

      {/* ─── FOOTER ─── */}
      <Typography
        variant="caption"
        sx={{
          display: "block",
          textAlign: "center",
          color: textMuted,
        }}
      >
        Data source updated at {lastUpdateTime}
      </Typography>
    </Box>
  );
}

export const AQI_SCALE = [
  { max: 50,  label: "Good", color: "#ffffff" },   // Blue
  { max: 100, label: "Moderate", color: "#009E73" }, // Teal
  { max: 150, label: "Unhealthy", color: "#E69F00" }, // Orange
  { max: 200, label: "Very Unhealthy", color: "#D55E00" }, // Vermillion
  { max: 300, label: "Severe", color: "#f0300e" }, // Purple
  { max: Infinity, label: "Hazardous", color: "#7F0000" }, // Maroon
];

export const getAQIDetails = (aqi = 0) =>
  AQI_SCALE.find((d) => aqi <= d.max);

export default function AQIWidget({
  open,
  setOpen,
  mode,
  aqiValue,
  label,
  color,
  aqiData,
}) {
  const y = useMotionValue(0);

  // 🌊 Rubber physics curve
  const rubberY = useTransform(y, (v) => {
    const resistance = 0.35;
    return v < 0
      ? v * 0.2
      : v * (1 - Math.exp(-v * resistance / 100));
  });

  // 🌊 Progress mapping
  const progress = useTransform(rubberY, [0, 300], [0, 1]);

  const scale = useTransform(progress, [0, 1], [1, 0.94]);
  const opacity = useTransform(progress, [0, 1], [1, 0.6]);
  const radius = useTransform(
    progress,
    [0, 1],
    ["32px 32px 22px 22px", "18px"]
  );
  const backdropOpacity = useTransform(progress, [0, 1], [1, 0]);

  // 🌊 Smooth close animation
  const smoothClose = (velocity = 0) => {
    animate(y, 500, {
      type: "spring",
      stiffness: 120,
      damping: 18,
      mass: 0.9,
      velocity,
      onComplete: () => setOpen(false),
    });
  };
  

  return (
    <>
      {/* 🔹 TRIGGER */}
<motion.div
  layoutId="aqi-card"
  onClick={() => setOpen(true)}
  whileTap={{ scale: 0.94 }}
  transition={{ type: "spring", stiffness: 260, damping: 22 }}
  style={{
    width: 130,
    cursor: "pointer",
    position: "relative",
    zIndex: 10,
  }}
>
  <Box
    sx={{
      px: 1,
      py: 0.5,
      borderRadius: "20px",

      backdropFilter: "blur(12px)",
      background: mode === "dark"
        ? "rgba(20,20,20,0.35)"
        : "rgba(255,255,255,0.3)",

      border: `1px solid ${
        mode === "dark"
          ? "rgba(255,255,255,0.15)"
          : "rgba(255,255,255,0.6)"
      }`,

      boxShadow:
        "0 8px 30px rgba(0,0,0,0.2), inset 0 2px 6px rgba(255,255,255,0.2)",

      position: "relative",
    }}
  >
    <Stack spacing={1.2}>
      <InfoOutlined sx={{ fontSize: 14, opacity: 0.6, position: "absolute", right: 8, top: 8 }} />
      <Typography variant="h4" sx={{ fontWeight: 900, textAlign: "center" }}>
        {aqiValue}
      </Typography>
      <Typography variant="caption" sx={{ textAlign: "center" }}>
        AQI • {label}
      </Typography>
    </Stack>
  </Box>
</motion.div>

{/* ─── AQI DETAILS DRAWER PORTAL ─── */}
{typeof document !== "undefined" &&
  createPortal(
    <AnimatePresence mode="wait">
      {open && (
        <>
          {/* BACKDROP */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={() => setOpen(false)}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.35)",
              backdropFilter: "blur(18px)",
              opacity: backdropOpacity,
              zIndex: 99999,
              willChange: "opacity",
            }}
          />

          {/* 🔥 MORPH CONTAINER (NO Y ANIMATION HERE) */}
          <motion.div
            key="card"
            layoutId="aqi-card"
            transition={{
              type: "spring",
              stiffness: 240,
              damping: 26,
            }}
            style={{
              position: "fixed",
              bottom: 0,
              left: 0,
              right: 0,
              zIndex: 100000,
              margin: "12px",
              display: "flex",
              justifyContent: "center",
            }}
          >
            {/* 🔥 INNER SLIDE LAYER */}
<motion.div
  drag="y"
  dragConstraints={{ top: 0, bottom: 0 }}
  dragElastic={0} // ❗ disable default → we control physics
  style={{
    y: rubberY,
    scale,
    opacity,
    width: "100%",
    maxWidth: 600,
    willChange: "transform",
  }}
  initial={{ y: 80, opacity: 0, scale: 0.98 }}
  animate={{ y: 0, opacity: 1, scale: 1 }}
  exit={{ y: 140, opacity: 0, scale: 0.96 }}
  transition={{
    type: "spring",
    stiffness: 160,
    damping: 22,
    mass: 0.8, // 🌊 smoother inertia
  }}
  onDrag={(e, info) => {
    y.set(info.offset.y);
  }}
onDragEnd={(e, info) => {
  const offset = info.offset.y;
  const velocity = info.velocity.y;

  const shouldClose =
    offset > 120 || velocity > 700;

  if (shouldClose) {
    // 🌊 CONTINUE MOTION (no abrupt jump)
    smoothClose(velocity);

    // delay state change slightly → allows animation to finish
    setTimeout(() => setOpen(false), 180);
  } else {
    // 🌊 SMOOTH RETURN (not snap)
    animate(y, 0, {
      type: "spring",
      stiffness: 100,
      damping: 20,
      mass: 0.7,
      velocity,
    });
  }
}}
>
<Box
  sx={{
    height: "80vh",
    borderRadius: radius, // 🔥 dynamic

    overflow: "hidden",
    backdropFilter: "blur(28px)",

    background: mode === "dark"
      ? "rgba(18,18,18,0.92)"
      : "rgba(255,255,255,0.92)",

    boxShadow: "0 -20px 40px rgba(0,0,0,0.3)",

    border: mode === "dark"
      ? "1px solid rgba(255,255,255,0.1)"
      : "1px solid rgba(0,0,0,0.05)",
      borderRadius: "24px",

    position: "relative",

    "&::before": {
      content: '""',
      position: "absolute",
      inset: 0,
      borderRadius: "24px",
      background:
        "radial-gradient(circle at 30% 20%, rgba(255,255,255,0.35), transparent 60%)",
      opacity: 0.4,
      pointerEvents: "none",
    },
  }}
>
                <AQIDetailsDrawer
                  aqiValue={aqiValue}
                  label={label}
                  color={color}
                  aqiData={aqiData}
                  onClose={() => setOpen(false)}
                />
              </Box>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  )}
    </>
  );
}