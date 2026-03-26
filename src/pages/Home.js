import React, { useEffect, useState, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
// import Sidebar from "../components/Sidebar";
import { doc, collection, query, where, getDoc, onSnapshot, updateDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useWeather } from "../contexts/WeatherContext";
import packageJson from '../../package.json';
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { weatherIcons } from "../elements/weatherTheme";
import { useThemeToggle } from "../contexts/ThemeToggleContext";
import { getTheme } from "../theme";
// Update this line to include hashString and gradientPresets (if needed)
import { Backgrounds } from "../theme/backgroundPresets";
import { useBackground } from "../contexts/BackgroundContext";
// Import placesData (assuming path is correct relative to Home.js)
import placesData from '../data/data.json';
import {
  motion,
  AnimatePresence,
  useMotionValue, useTransform, animate } from "framer-motion";
import { Drawer, TextField, DialogActions, SwipeableDrawer } from "@mui/material";
import { 
  CloseOutlined,
  CheckCircleOutline,
  Search,
  Favorite,
  FavoriteBorder,
  Bookmark,
  BookmarkBorder
} from "../icons/LucideIcons";
import { useCreateTripDrawer } from "../hooks/useCreateTripDrawer";
import FloatingSearch from "../elements/FloatingSearch";
import { createPortal } from "react-dom";
import {
  AppBar,
  Toolbar,
  Typography,
  Container,
  Box,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  ThemeProvider,
  keyframes,
  Button,
  LinearProgress,
  Avatar,
  AvatarGroup,
  Tooltip,
  useTheme,
  useMediaQuery,
  IconButton,
  DialogTitle,
  DialogContent,
  Chip, // Added Chip for place details
  Divider, // Added Divider for visual separation
  Stack,
  alpha,
} from "@mui/material";
import {
  LocationOn,
  AccessTime,
  WbSunnyOutlined, // Added weather icon
} from "../icons/LucideIcons";
import Notifications from "../elements/Notifications";
import BetaAccessGuard from "../components/BetaAccessGuard";
import {
  ChevronRight,
  ChevronLeft,
  Check,
  WifiTethering,
  InfoOutlined,
  CalendarMonth,
  NotificationsNone,
} from "../icons/LucideIcons";

import { MapContainer, TileLayer, Polyline, Marker } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import Confetti from "react-confetti";
import BlurEffect from "react-progressive-blur";
import { toggleLikePlace, toggleSavePlace } from "../utils/placeActions";
import PlaceDetailsDialog from "../elements/PlaceDetailsDialog";
import { usePlaceLikesCount } from "../hooks/usePlaceLikesCount";
import AnimatedLikeCount from "../elements/AnimatedLikeCount";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const geoCache = {};

async function geocodePlace(place) {
  if (geoCache[place]) return geoCache[place];

  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
      place
    )}`
  );
  const data = await res.json();
  if (!data?.length) return null;

  const coords = [parseFloat(data[0].lat), parseFloat(data[0].lon)];
  geoCache[place] = coords;
  return coords;
}

const MiniRouteMap = ({ from, to }) => {
  const [points, setPoints] = useState([]);

  useEffect(() => {
    let mounted = true;

    (async () => {
      const start = await geocodePlace(from);
      const end = await geocodePlace(to);

      if (start && end && mounted) {
        setPoints([start, end]);
      }
    })();

    return () => (mounted = false);
  }, [from, to]);

  if (points.length < 2) {
    return (
      <Box
        sx={{
          height: 90,
          borderRadius: 8,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "rgba(0,0,0,0.08)",
          fontSize: 12,
        }}
      >
        Loading map…
      </Box>
    );
  }

  return (
    <Box
      sx={{
        height: 90,
        borderRadius: 2,
        overflow: "hidden",
        border: "1px solid rgba(0,0,0,0.08)",
      }}
    >
      <MapContainer
        center={points[0]}
        zoom={6}
        scrollWheelZoom={false}
        style={{ height: "100%", width: "100%" }}
        dragging={false}
        zoomControl={false}
        doubleClickZoom={false}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="© OpenStreetMap"
        />
        <Polyline
          positions={points}
          pathOptions={{ color: "#22c55e", weight: 4 }}
        />
        <Marker position={points[0]} />
        <Marker position={points[1]} />
      </MapContainer>
    </Box>
  );
};


// Safe haptics (mobile only, no crashes)
// const triggerHaptic = (velocity = 0.5) => {
//   if (!navigator.vibrate) return;

//   if (velocity > 1.2) navigator.vibrate([12, 18, 12]);
//   else if (velocity > 0.6) navigator.vibrate(12);
//   else navigator.vibrate(6);
// };


const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const PRIORITY_COLORS = {
  high: {
    ring: "#ef4444",
    bg: "rgba(239,68,68,0.15)",
  },
  medium: {
    ring: "#f59e0b",
    bg: "rgba(245,158,11,0.15)",
  },
  low: {
    ring: "#10b981",
    bg: "rgba(16,185,129,0.15)",
  },
};

// Color-blind safe AQI palette (Okabe–Ito inspired)
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


function inferPriority(start) {
  const diff = start - new Date();
  if (diff < 2 * 60 * 60 * 1000) return "high";
  if (diff < 6 * 60 * 60 * 1000) return "medium";
  return "low";
}

function computeProgress(start) {
  const now = Date.now();
  const total = start - now + 12 * 60 * 60 * 1000;
  const elapsed = 12 * 60 * 60 * 1000 - (start - now);
  return Math.min(Math.max(elapsed / total, 0), 1);
}

const getDayProgress = (start, end) => {
  const startDate = new Date(start);
  const endDate = new Date(end || start);
  const now = new Date();

  const totalDays =
    Math.max(1, Math.ceil((endDate - startDate) / 86400000) + 1);

  const currentDay =
    now < startDate
      ? 0
      : Math.min(
          totalDays,
          Math.ceil((now - startDate) / 86400000) + 1
        );

  return { currentDay, totalDays };
};


const TimeProgressRing = ({ progress, color }) => {
  const radius = 16;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - progress * circumference;

  return (
    <svg width="40" height="40">
      <circle
        cx="20"
        cy="20"
        r={radius}
        stroke="rgba(255, 255, 255, 0.38)"
        strokeWidth="4"
        fill="none"
      />
      <motion.circle
        cx="20"
        cy="20"
        r={radius}
        stroke={color}
        strokeWidth="4"
        fill="none"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        strokeLinecap="round"
      />
    </svg>
  );
};

const AlertRow = ({ alert, expanded, onToggle, mode }) => {
  const priority = PRIORITY_COLORS[alert.priority];

  return (
    <motion.div layout>
      <Box
        onClick={onToggle}
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          p: 1.5,
          borderRadius: 3,
          cursor: "pointer",
          background: priority.bg,
        }}
      >
        <TimeProgressRing
          progress={alert.progress}
          color={priority.ring}
        />

        <Box sx={{ flexGrow: 1 }}>
          <Typography fontWeight={700}>{alert.name}</Typography>
          <Typography variant="caption" color="text.secondary">
            {alert.from} → {alert.to}
          </Typography>
        </Box>

        <AccessTime sx={{ color: priority.ring }} />
      </Box>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Box
              sx={{
                px: 2,
                py: 1.5,
                mt: 0.5,
                borderRadius: 3,
                background:
                  mode === "dark"
                    ? "rgba(255,255,255,0.05)"
                    : "rgba(0,0,0,0.04)",
              }}
            >
              <Typography variant="body2">
                🗺 Route: {alert.from} → {alert.to}
              </Typography>
              <Typography variant="body2">
                ⏰ Starts at:{" "}
                {alert.start.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Typography>
              <Typography variant="body2">
                📌 Priority: {alert.priority.toUpperCase()}
              </Typography>
            </Box>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const formFieldSx = {
  borderRadius: 3,
  backgroundColor: (theme) =>
    theme.palette.mode === "dark"
      ? "rgba(255,255,255,0.06)"
      : "#fafafa",
  "& .MuiOutlinedInput-root": {
    borderRadius: 3,
  },
};


const WEATHER_STORAGE_KEY = "bunkmate_weather";
const WEATHER_API_KEY = "c5298240cb3e71775b479a32329803ab"; // <-- Replace with your API key
const VAPID_PUBLIC_KEY_URL = "https://app.bunkmates.xyz/vapid_public_key";
const SAVE_SUBSCRIPTION_URL = "https://app.bunkmates.xyz/save_subscription";
const CPCB_URL = `https://api.data.gov.in/resource/3b01bcb8-0b14-4abf-b6f2-c1bfd384ba69?api-key=579b464db66ec23bdd0000011c04ccafb50742ba6a0a7d5e22aa498e&format=json&limit=1000`;

function getGreeting() {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "Good Morning";
  if (hour >= 12 && hour < 17) return "Good Afternoon";
  if (hour >= 17 && hour < 21) return "Good Evening";
  return "Good Night";
}

function getDefaultTripIndex(trips) {
  const now = new Date();
  let ongoing = null, upcoming = null, upcomingDate = null;
  trips.forEach((trip, idx) => {
    const start = new Date(trip.startDate || trip.date);
    const end = new Date(trip.endDate || trip.date);
    if (start <= now && now <= end) ongoing = idx;
    else if (start > now && (!upcomingDate || start < upcomingDate)) {
      upcoming = idx;
      upcomingDate = start;
    }
  });
  if (ongoing !== null) return ongoing;
  if (upcoming !== null) return upcoming;
  return 0;
}

const sliderSettings = {
  dots: true,
  dotsClass: "slick-dots slick-thumb",
  infinite: false,
  speed: 500,
  slidesToShow: 1,
  slidesToScroll: 1,
  swipeToSlide: true,
  adaptiveHeight: true,
  arrows: false,
};

const haptic = (pattern = 10) => {
  if (typeof navigator !== "undefined" && navigator.vibrate) {
    navigator.vibrate(pattern);
  }
};

const PARTICLES = 8;

const LikeBurst = ({ x = 0, y = 0 }) => {
  return (
    <>
      {Array.from({ length: PARTICLES }).map((_, i) => {
        const angle = (Math.PI * 2 * i) / PARTICLES;
        const distance = 18 + Math.random() * 10;

        return (
          <motion.span
            key={i}
            initial={{
              opacity: 1,
              scale: 0,
              x: 0,
              y: 0,
            }}
            animate={{
              opacity: 0,
              scale: 1,
              x: Math.cos(angle) * distance,
              y: Math.sin(angle) * distance,
            }}
            transition={{ duration: 0.45, ease: "easeOut" }}
            style={{
              position: "absolute",
              width: 36,
              height: 36,
              borderRadius: "50%",
              backgroundColor: "#ef4444",
              pointerEvents: "none",
            }}
          />
        );
      })}
    </>
  );
};

const PlaceCard = ({ place, userData, onPlanTrip,  relatedPlaces = [] }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  /* ─── LOCAL UI STATE ─── */
  const [open, setOpen] = useState(false);
  const [likeAnim, setLikeAnim] = useState(false);
  const [saveAnim, setSaveAnim] = useState(false);
  const [showBurst, setShowBurst] = useState(false);

  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);

  /* 🔥 REAL-TIME GLOBAL LIKE COUNT */
  const likesCount = usePlaceLikesCount(place.id, place.likesCount);

  /* ─── SYNC USER-SPECIFIC STATE ─── */
  useEffect(() => {
    setLiked(userData?.likedTrips?.includes(place.id) ?? false);
    setSaved(userData?.savedTrips?.includes(place.id) ?? false);
  }, [userData, place.id]);

  /* ─── ANIMATION HELPER ─── */
  const animate = (setter) => {
    setter(true);
    setTimeout(() => setter(false), 260);
  };

  /* ─── HANDLERS ─── */
  const handleLike = (e) => {
    e.stopPropagation();

    const next = !liked;
    setLiked(next);

    if (next) {
      haptic([15, 20, 15]);
      setLikeAnim(true);
      setShowBurst(true);

      setTimeout(() => setLikeAnim(false), 220);
      setTimeout(() => setShowBurst(false), 500);
    }

    // 🔐 Firestore batch (authoritative)
    toggleLikePlace(place.id, liked);
  };

  const handleSave = (e) => {
    e.stopPropagation();
    const next = !saved;
    setSaved(next);
    animate(setSaveAnim);
    toggleSavePlace(place.id, saved);
  };
  

  return (
    <>

<motion.div
  layoutId={`place-${place.id}`}
  onClick={() => setOpen(true)}
  whileTap={{ scale: 0.985 }}   // tactile press, not link
  transition={{ type: "spring", stiffness: 260, damping: 28 }}
  style={{
    borderRadius: 24,
    overflow: "hidden",
  }}
>
  <Card
    elevation={0}
    sx={{
      position: "relative",
      height: 360,
      width: "100%",
      maxWidth: 410,
      minWidth: 360,
      p: 1,
      mx: "auto",

      // 👇 NOT link-like
      cursor: "default",
      userSelect: "none",

      borderRadius: 3,
      overflow: "hidden",
      backgroundColor: isDark ? "#131313" : "#ffffff",

      boxShadow: isDark
        ? "0 16px 34px rgba(0,0,0,0.55)"
        : "0 14px 30px rgba(0,0,0,0.14)",

      transition: "box-shadow .25s ease, transform .25s ease",

      // 👇 Subtle depth only, not hover CTA
      "&:hover": {
        boxShadow: isDark
          ? "0 20px 42px rgba(0,0,0,0.65)"
          : "0 18px 36px rgba(0,0,0,0.18)",
      },

      // 👇 Physical press feedback
      "&:active": {
        transform: "scale(0.99)",
      },

      // 👇 Remove link-like focus ring
      "&:focus-visible": {
        outline: "none",
      },
    }}
  >
    {/* ───── IMAGE HERO ───── */}
    <Box
      sx={{
        height: 260,
        width: "100%",
        maxWidth: 348,
        borderRadius: 4,
        position: "relative",
        overflow: "hidden",
        backgroundImage: `url(${place.images?.[0]})`,
        backgroundSize: "cover",
        backgroundPosition: "center",

        // 👇 No hover zoom = not link
        transition: "transform .35s ease",
      }}
    >
      {/* ───── ACTIONS (GLASS BUTTONS) ───── */}
      <Stack
        spacing={1}
        sx={{
          position: "absolute",
          top: 12,
          right: 12,
          zIndex: 3,
        }}
      >
        <IconButton
          onClick={(e) => {
            e.stopPropagation();
            handleLike(e);
          }}
          sx={{
            backdropFilter: "blur(14px)",
            background: alpha(
              isDark ? theme.palette.common.black : "#000",
              0.25
            ),
            borderRadius: 6,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            color: "#fff",

            transform: likeAnim ? "scale(1.4)" : "scale(1)",
            transition:
              "transform 200ms cubic-bezier(.34,1.56,.64,1), background .25s ease",

            "&:hover": {
              background: alpha(theme.palette.error.main, 0.25),
            },
          }}
        >
          {liked ? (
            <Favorite fill={theme.palette.error.main} sx={{ color: theme.palette.error.main }} />
          ) : (
            <FavoriteBorder />
          )}

          <AnimatedLikeCount
            value={likesCount}
            sx={{ color: "#fff", fontSize: 8 }}
          />

          {showBurst && (
            <Box sx={{ position: "absolute", inset: 0 }}>
              <LikeBurst />
            </Box>
          )}
        </IconButton>

        <IconButton
          onClick={(e) => {
            e.stopPropagation();
            handleSave(e);
          }}
          sx={{
            backdropFilter: "blur(14px)",
            background: alpha(
              isDark ? theme.palette.common.black : "#000",
              0.25
            ),
            color: saved ? "#facc15" : "#fff",
            transform: saveAnim ? "scale(1.4)" : "scale(1)",
            transition: "transform 200ms cubic-bezier(.34,1.56,.64,1)",
          }}
        >
          {saved ? <Bookmark fill="#facc15" /> : <BookmarkBorder />}
        </IconButton>
      </Stack>
    </Box>

    {/* ───── CONTENT PANEL ───── */}
    <Box
      sx={{
        px: 1.2,
        pr: 2.2,
        py: 2.2,
        display: "flex",
        flexDirection: "column",
        gap: 0.6,
        backgroundColor: isDark ? "#131313" : "#ffffff",
      }}
    >
      <Typography fontWeight={900} fontSize={16}>
        {place.name}
      </Typography>

      <Typography
        variant="caption"
        color={theme.palette.text.secondary}
        sx={{
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}
      >
        {place.description}
      </Typography>
    </Box>
  </Card>
</motion.div>


<AnimatePresence>
  {open && (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1600, // higher than blurred content
      }}
    >
      <PlaceDetailsDialog
        key={place.id}
        place={place}
        open={open}
        onClose={() => setOpen(false)}
        liked={liked}
        saved={saved}
        likesCount={likesCount}
        onLike={() => handleLike({ stopPropagation: () => {} })}
        onSave={() => handleSave({ stopPropagation: () => {} })}
        relatedPlaces={relatedPlaces}
        onPlanTrip={onPlanTrip}
        onRedirect={(nextPlace) => {
          place(nextPlace);
        }}
      />
    </motion.div>
  )}
</AnimatePresence>

    </>
  );
};

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

const weatherBackgrounds = {
  Clear: {
    // A bright morning sky transitioning to a soft horizon
    light: "linear-gradient(180deg, #a9e4ff 0%, #e0f2fe 70%, #f1f1f1 100%)",
    // Deep midnight blue with a hint of atmospheric depth
    dark: "linear-gradient(180deg, #15285bcc 0%, #0c0c0c 100%)",
  },
  Clouds: {
    // Soft overcast gray with a hint of blue-white
    light: "linear-gradient(180deg, #cbd5e1 0%, #e2e8f0 50%, #f8fafc 100%)",
    // Moody storm clouds
    dark: "linear-gradient(180deg, #1e293b 0%, #0f172a 100%)",
  },
  Rain: {
    // Cool, wet blue-gray
    light: "linear-gradient(180deg, #94a3b8 0%, #cbd5e1 60%, #dbeafe 100%)",
    // Dark rainy night
    dark: "linear-gradient(180deg, #0f172a 0%, #020617 100%)",
  },
  Drizzle: {
    light: "linear-gradient(180deg, #b1bfd8 0%, #dfe9f3 100%)",
    dark: "linear-gradient(180deg, #2c3e50 0%, #000000 100%)",
  },
  Thunderstorm: {
    // High contrast purple-blue for electric atmosphere
    light: "linear-gradient(180deg, #9ca3af 0%, #4b5563 40%, #8b5cf6 100%)",
    // Deep black with a faint purple lightning tint
    dark: "linear-gradient(180deg, #020617 0%, #1e1b4b 70%, #000000 100%)",
  },
  Snow: {
    // Crisp, icy white
    light: "linear-gradient(180deg, #f1f5f9 0%, #ffffff 100%)",
    // Cold, desaturated winter night
    dark: "linear-gradient(180deg, #334155 0%, #0f172a 100%)",
  },
  Mist: {
    // Also covers Haze, Fog, and Smoke
    light: "linear-gradient(180deg, #d1d5db 0%, #f3f4f6 100%)",
    dark: "linear-gradient(180deg, #374151 0%, #111827 100%)",
  },
  Haze: {
    // Slightly warm tint for dusty/sandy haze
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
    (weatherBackgrounds[currentCondition] ||
      weatherBackgrounds.Default)[isDark ? "dark" : "light"];

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
<Grid
  container
  spacing={2}
  sx={{
    mt: 2,
  }}
>
  {/* ── Temperature Cluster ── */}
  <Grid item xs={6} sm={4}>
    <DataItem
      label="Feels Like"
      value={weather.feelsLike}
      unit="°C"
    />
  </Grid>

  {/* ── Atmosphere Cluster ── */}
  <Grid item xs={6} sm={4}>
    <DataItem
      label="Pressure"
      value={weather.pressure}
      unit=" hPa"
    />
  </Grid>

  <Grid item xs={6} sm={4}>
    <DataItem
      label="Humidity"
      value={weather.humidity}
      unit="%"
    />
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
          <Grid item xs={6}><DataItem label="Cloudiness" value={weather.clouds} unit="%" /></Grid>
          <Grid item xs={6}><DataItem label="Condition" value={weather.main} /></Grid>
          <Grid item xs={6}><DataItem label="Rain (1h)" value={weather.rain || 0} unit=" mm" /></Grid>
          <Grid item xs={6}><DataItem label="Snow (1h)" value={weather.snow || 0} unit=" mm" /></Grid>
        </Grid>

        <SectionTitle index="3" title="Wind & Atmosphere" />
        <Grid container spacing={2}>
          <Grid item xs={6}><DataItem label="Wind Speed" value={weather.windSpeed} unit=" m/s" /></Grid>
          <Grid item xs={6}><DataItem label="Direction" value={weather.windDeg} unit="°" /></Grid>
          <Grid item xs={6}><DataItem label="Gusts" value={weather.windGust || "—"} unit=" m/s" /></Grid>
          {/* <Grid item xs={6}><DataItem label="UV Index" value="N/A" /></Grid> */}
        </Grid>

        {/* <Typography
          variant="caption"
          sx={{ mt: 1, display: "block", opacity: 0.5 }}
        >
          * UV Index requires One Call API 3.0
        </Typography> */}

        <SectionTitle index="4" title="Solar & System" />
        <Grid container spacing={2}>
          <Grid item xs={6}><DataItem label="Sunrise" value={formatTime(weather.sunrise, 0)} /></Grid>
          <Grid item xs={6}><DataItem label="Sunset" value={formatTime(weather.sunset, 0)} /></Grid>
        </Grid>
      </Box>
    </SwipeableDrawer>
  );
}

const REMCARD_WIDTH = 140;
const MAX_VISIBLE = 4;

const ConfettiParticle = ({ x, y, rotate, color }) => (
  <motion.div
    initial={{ opacity: 1, scale: 1, x: 0, y: 0 }}
    animate={{ opacity: 0, scale: 0.6, x, y, rotate }}
    transition={{ duration: 0.9, ease: "easeOut" }}
    style={{
      position: "absolute",
      width: 6,
      height: 10,
      borderRadius: 2,
      background: color,
      top: "50%",
      left: "50%",
      pointerEvents: "none",
    }}
  />
);

/* ───────── PROGRESS RING ───────── */
const ProgressRing = ({ progress, color }) => {
  const radius = 14;
  const stroke = 3;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset =
    circumference - progress * circumference;

  return (
    <svg width={radius * 2} height={radius * 2}>
      <circle
        stroke="rgba(0,0,0,0.1)"
        fill="transparent"
        strokeWidth={stroke}
        r={normalizedRadius}
        cx={radius}
        cy={radius}
      />
      <circle
        stroke={color}
        fill="transparent"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={`${circumference} ${circumference}`}
        style={{ strokeDashoffset }}
        r={normalizedRadius}
        cx={radius}
        cy={radius}
      />
    </svg>
  );
};

/* ───────── REMINDER CARD ───────── */
const ReminderCard = ({ rem, mode, onToggleComplete }) => {
  const navigate = useNavigate();

  /* ───── HOOKS MUST COME FIRST ───── */
  const prevCompleted = useRef(false);
  const [showConfetti, setShowConfetti] = useState(false);

  const isCompleted = rem?.completed === true;

  /* 🎉 CONFETTI EFFECT (SAFE) */
  useEffect(() => {
    if (!rem) return; // guard INSIDE effect

    if (!prevCompleted.current && isCompleted) {
      setShowConfetti(true);
      const t = setTimeout(() => setShowConfetti(false), 900);
      return () => clearTimeout(t);
    }

    prevCompleted.current = isCompleted;
  }, [isCompleted, rem]);

  /* ───── EMPTY STATE (AFTER HOOKS) ───── */
if (!rem) {
  return (
    <Box
      onClick={() => navigate("/reminders")}
      sx={{
        minWidth: 290,
        height: 160,
        scrollSnapAlign: "start",
        borderRadius: 5,
        p: 2.4,
        position: "relative",
        overflow: "hidden",
        mx: "auto",

        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 0.8,

        background:
          mode === "dark"
            ? `
              linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.015)),
              repeating-linear-gradient(
                0deg,
                rgba(255,255,255,0.04),
                rgba(255,255,255,0.04) 1px,
                transparent 1px,
                transparent 18px
              ),
              repeating-linear-gradient(
                90deg,
                rgba(255,255,255,0.035),
                rgba(255,255,255,0.035) 1px,
                transparent 1px,
                transparent 18px
              )
            `
            : `
              linear-gradient(180deg, #ffffff, #f8fafc),
              repeating-linear-gradient(
                0deg,
                rgba(0,0,0,0.035),
                rgba(0,0,0,0.035) 1px,
                transparent 1px,
                transparent 20px
              ),
              repeating-linear-gradient(
                90deg,
                rgba(0,0,0,0.03),
                rgba(0,0,0,0.03) 1px,
                transparent 1px,
                transparent 20px
              )
            `,

        border:
          mode === "dark"
            ? "1px dashed rgba(255,255,255,0.18)"
            : "1px dashed rgba(0,0,0,0.12)",

        boxShadow:
          mode === "dark"
            ? "0 10px 26px rgba(0,0,0,0.4)"
            : "0 10px 22px rgba(0,0,0,0.14)",

        opacity: 0.9,
        userSelect: "none",
      }}
    >
      {/* 🧠 Watermark icon */}
      <CalendarMonth
        sx={{
          position: "absolute",
          right: -20,
          bottom: -20,
          fontSize: 120,
          opacity: mode === "dark" ? 0.06 : 0.05,
          pointerEvents: "none",
        }}
      />

      {/* 🔔 Icon bubble */}
      <Box
        sx={{
          width: 42,
          height: 42,
          borderRadius: "50%",
          display: "grid",
          placeItems: "center",
          background:
            mode === "dark"
              ? "rgba(255,255,255,0.08)"
              : "rgba(0,0,0,0.06)",
          boxShadow:
            mode === "dark"
              ? "0 0 0 6px rgba(255,255,255,0.04)"
              : "0 0 0 6px rgba(0,0,0,0.04)",
        }}
      >
        <NotificationsNone sx={{ fontSize: 22, opacity: 0.55 }} />
      </Box>

      <Typography
        sx={{
          fontWeight: 800,
          fontSize: 15,
          opacity: 0.85,
        }}
      >
        No reminders yet
      </Typography>

      <Typography
        variant="caption"
        sx={{
          maxWidth: 220,
          textAlign: "center",
          lineHeight: 1.5,
          opacity: 0.6,
        }}
      >
        Your upcoming reminders will appear here once you add one.
      </Typography>

      <Typography
        variant="caption"
        sx={{
          mt: 0.4,
          fontWeight: 600,
          letterSpacing: "0.03em",
          opacity: 0.45,
        }}
      >
        Tap <strong>the card</strong> to create your first reminder
      </Typography>
    </Box>
  );
}


  /* ───── NORMAL CARD LOGIC ───── */
  const now = Date.now();
  const dueTime = rem?.dueAt ? new Date(rem.dueAt).getTime() : null;
  const createdAt = rem?.createdAt
    ? new Date(rem.createdAt).getTime()
    : now;

  const isOverdue = !isCompleted && dueTime && dueTime < now;
  const isUrgent =
    !isCompleted && dueTime && dueTime - now < 1000 * 60 * 60 * 24;

  const accent = isCompleted
    ? "#22c55e"
    : isOverdue
    ? "#ef4444"
    : isUrgent
    ? "#facc15"
    : "#60a5fa";
  const progress =
    isCompleted || !dueTime
      ? 1
      : Math.min(
          Math.max((now - createdAt) / (dueTime - createdAt), 0),
          1
        );

  return (
    <motion.div
      whileHover={!isCompleted ? { y: -6 } : {}}
      transition={{ type: "spring", stiffness: 260, damping: 22 }}
      sx={{ backgroundColor: "transparent" }}
    >
      <Box
        sx={{
          minWidth: 180,
          height: 75,
          borderRadius: 5,
          p: 2,
          position: "relative",
          overflow: "hidden",

          background: `
            linear-gradient(
              120deg,
              ${accent}22,
              ${
                mode === "dark"
                  ? "rgba(255,255,255,0.04)"
                  : "rgba(255,255,255,0.85)"
              },
              ${accent}22
            ),
            repeating-linear-gradient(
                0deg,
                rgba(255,255,255,0.04),
                rgba(255,255,255,0.04) 1px,
                transparent 1px,
                transparent 18px
              )
          `,
          backgroundSize: "300% 300%",
          animation: isCompleted
            ? "none"
            : "gradientShift 8s ease infinite",

          "@keyframes gradientShift": {
            "0%": { backgroundPosition: "0% 50%" },
            "50%": { backgroundPosition: "100% 50%" },
            "100%": { backgroundPosition: "0% 50%" },
          },

          border:
            mode === "dark"
              ? "1px solid rgba(255,255,255,0.14)"
              : "1px solid rgba(0,0,0,0.08)",

          boxShadow:
            isOverdue
              ? "0 0 0 1px rgba(239,68,68,0.4), 0 18px 40px rgba(239,68,68,0.25)"
              : "none",

          opacity: isCompleted ? 0.7 : 1,
        }}
      >
      <CalendarMonth
        sx={{
          position: "absolute",
          right: -18,
          bottom: -18,
          fontSize: 120,
          opacity: 0.06,
          pointerEvents: "none",
        }}
      />

        {/* 🎉 CONFETTI */}
        <AnimatePresence>
          {showConfetti &&
            [...Array(10)].map((_, i) => (
              <ConfettiParticle
                key={i}
                x={(Math.random() - 0.5) * 120}
                y={(Math.random() - 1) * 120}
                rotate={Math.random() * 360}
                color={accent}
              />
            ))}
        </AnimatePresence>

        {/* HEADER */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 1,
          }}
        >
          <ProgressRing progress={progress} color={accent} />

<IconButton
  size="small"
  onClick={(e) => {
    e.stopPropagation();
    onToggleComplete?.(rem.id, rem.completed);
  }}
  sx={{
    p: 0.6,
    borderRadius: 2.5,
    height: 25,

    background: rem.completed
      ? `${accent}22`
      : mode === "dark"
      ? "rgba(255,255,255,0.08)"
      : "rgba(0, 0, 0, 0.01)",

    border: rem.completed
      ? `1px solid ${accent}55`
      : mode === "dark"
      ? "1px solid rgba(255,255,255,0)"
      : "1px solid rgba(0, 0, 0, 0.11)",

    boxShadow: rem.completed
      ? `0 0 0 3px ${accent}22`
      : "0 2px 8px rgba(0,0,0,0)",

    transition:
      "background .25s ease, box-shadow .25s ease, transform .15s ease",

    "&:hover": {
      background: `${accent}33`,
      transform: "scale(1.08)",
    },

    "&:active": {
      transform: "scale(0.96)",
    },
  }}
>
  <motion.div
    initial={false}
    animate={{
      scale: rem.completed ? 1.05 : 0.9,
      rotate: rem.completed ? 0 : -20,
    }}
    transition={{ type: "spring", stiffness: 420, damping: 26 }}
  >
    <Check
      sx={{
        fontSize: 18,
        color: rem.completed ? accent : `${accent}cc`,
        filter: rem.completed
          ? "drop-shadow(0 0 6px rgba(34,197,94,0.6))"
          : "none",
      }}
    />
  </motion.div>
</IconButton>

        </Box>

        <Typography
          sx={{
            fontSize: 15,
            fontWeight: 800,
            textDecoration: isCompleted ? "line-through" : "none",
            mb: 0.6,
          }}
        >
          {rem.text}
        </Typography>

        <Typography variant="caption" sx={{ opacity: 0.7 }}>
          {rem.date} • {rem.time}
        </Typography>
      </Box>
    </motion.div>
  );
};

const Home = () => {
  const navigate = useNavigate();
  const muiTheme = useTheme();
  const isSmallScreen = useMediaQuery(muiTheme.breakpoints.down("md"));

  const [authInitialized, setAuthInitialized] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notLoggedIn, setNotLoggedIn] = useState(false);
  const [userData, setUserData] = useState({});
  const [userType, setUserType] = useState("");
  const { weather, setWeather, weatherLoading, setWeatherLoading } = useWeather();
  const [aqiData, setAqiData] = useState(null);
  const [aqiLoading, setAqiLoading] = useState(true);
  const [budgets, setBudgets] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [remindersLoading, setRemindersLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [expandedOngoingId, setExpandedOngoingId] = useState(null);

  const [myTrips, setMyTrips] = useState([]);
  const [tripMembersMap, setTripMembersMap] = useState({});
  const [timelineStatsMap, setTimelineStatsMap] = useState({});
  const [tripGroupsMap, setTripGroupsMap] = useState({});
  const [sliderIndex, setSliderIndex] = useState(0);
  const { mode, accent } = useThemeToggle();
  const theme = getTheme(mode, accent);

  const [unreadCount, setUnreadCount] = useState(0);

  const [liveAlerts, setLiveAlerts] = useState({ upcoming: [], ongoing: [], reminders: [] });
  
  const watchIdRef = useRef(null);
  const [friendCards, setFriendCards] = useState([]);
  const remindersScrollRef = useRef(null);
  const [weatherOpen, setWeatherOpen] = useState(false);
  const lastScrollY = useRef(0);
  
  const [openUpcoming, setOpenUpcoming] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showAppBar, setShowAppBar] = useState(true);

// 🛎️ Reminders
const [reminderIndex, setReminderIndex] = useState(0);

const y = useMotionValue(0);

// 🌊 NON-LINEAR RUBBER BAND CURVE
const rubberY = useTransform(y, (value) => {
  const resistance = 0.35;
  return value < 0
    ? value * 0.2 // upward resistance
    : value * (1 - Math.exp(-value * resistance / 100));
});

// 🌊 VISUAL FEEDBACK
const scale = useTransform(rubberY, [0, 300], [1, 0.95]);
const opacity = useTransform(rubberY, [0, 300], [1, 0.65]);

// 🌊 LIQUID EDGE MORPH
const radius = useTransform(
  rubberY,
  [0, 250],
  ["32px 32px 22px 22px", "20px"]
);

const smoothClose = (value, velocity) => {
  return animate(value, 500, {
    type: "spring",
    stiffness: 120,
    damping: 18,
    mass: 0.9,
    velocity, // 🔥 carry momentum
  });
};

// 🌍 Places
const placesScrollRef = useRef(null);
const [placeIndex, setPlaceIndex] = useState(0);

    const sortedReminders = useMemo(() => {
  return [...reminders].sort((a, b) => {
    const ta = a.createdAt?.toMillis?.() ?? new Date(a.createdAt).getTime();
    const tb = b.createdAt?.toMillis?.() ?? new Date(b.createdAt).getTime();
    return tb - ta; // latest first
  });
}, [reminders]);

const visibleReminders = sortedReminders.slice(0, MAX_VISIBLE);
const remainingCount = Math.max(sortedReminders.length - MAX_VISIBLE, 0);

const displayReminders =
  reminders.length === 0 ? [null] : visibleReminders;

const CARD_WIDTH = 365 + 16;

  const allFlattenedPlaces = useMemo(() => {
  if (!placesData || !placesData.states) return [];
  const allStates = Array.isArray(placesData.states) ? placesData.states : [];
  
  return allStates.flatMap(state => 
    (state.districts || []).flatMap(district => 
      (district.places || []).map(p => ({ 
        id: p.name.replace(/\s/g, '_') + '_' + state.code + '_' + district.name,
        location: `${district.name}, ${state.name}`, 
        city: district.name,
        state: state.name,
        ...p 
      }))
    )
  ).sort(() => 0.5 - Math.random());
}, []);

// Normalized AQI number (single source of truth)
const aqiValue = aqiData?.maxAqi ?? 0;

// AQI semantic details
const { label, color } = getAQIDetails(aqiValue);

// Progress (0–300 scale, clamped)
const [open, setOpen] = useState(false);

const carouselPlaces = allFlattenedPlaces.slice(0, 4);
const remainingPlaces = allFlattenedPlaces.slice(4);

const onPlanTrip = (p) => {
  const today = new Date();
  const plus2 = new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000);

  const prefill = {
    name: p.name || "",
    from: userData?.city || "My Location",
    to: `${p.city || ""}, ${p.state || ""}`.trim(),
    location:
      p.location ||
      `${userData?.city || "My Location"} → ${p.city || p.name || ""}`,
    startDate: today.toISOString().slice(0, 10),
    endDate: plus2.toISOString().slice(0, 10),
  };

  openDrawerWithPrefill(prefill);
};

const handleToggleReminderComplete = async (reminderId, current) => {
  // 1️⃣ Optimistic UI update
  setReminders((prev) =>
    prev.map((r) =>
      r.id === reminderId ? { ...r, completed: !current } : r
    )
  );

  try {
    // 2️⃣ Firestore update (authoritative)
    await updateDoc(doc(db, "reminders", reminderId), {
      completed: !current,
      completedAt: !current ? new Date() : null,
    });
  } catch (err) {
    console.error("Failed to toggle reminder:", err);

    // 3️⃣ Rollback on failure
    setReminders((prev) =>
      prev.map((r) =>
        r.id === reminderId ? { ...r, completed: current } : r
      )
    );
  }
};

const {
  createDialogOpen,
  step,
  newTrip,
  setNewTrip,
  selectedMembers,
  setSelectedMembers,
  randomNatureImage,
  openDrawerWithPrefill,
  closeDrawer,
  handleNext,
  handleBack,
  handleContributionChange,
  totalContribution,
  handleCreateTrip,
} = useCreateTripDrawer();


useEffect(() => {
  if (!user?.uid) {
    setFriendCards([]);
    return;
  }

  const fetchFriends = async () => {
    try {
      const userRef = doc(db, "users", user.uid);
      const snap = await getDoc(userRef);
      if (snap.exists()) {
        const friends = snap.data().friends || [];
        const friendsData = await Promise.all(
          friends.map((uid) => getDoc(doc(db, "users", uid)))
        );
        setFriendCards(
          friendsData
            .filter((f) => f.exists())
            .map((f) => ({
              uid: f.id,
              ...f.data(),
              contribution: "",
            }))
        );
      } else {
        setFriendCards([]);
      }
    } catch (e) {
      console.warn("Failed to fetch friends", e);
      setFriendCards([]);
    }
  };

  fetchFriends();
}, [user]);

const handleAddMember = (member) => {
  if (selectedMembers.some((m) => m.uid === member.uid)) return;
  setSelectedMembers((prev) => [...prev, member]);
};

const handleRemoveMember = (uid) => {
  setSelectedMembers((prev) => prev.filter((m) => m.uid !== uid));
};


useEffect(() => {
  const handleScroll = () => {
    const currentScroll = window.scrollY;
    setScrolled(currentScroll > 50);

    // Frosted effect toggle
    setScrolled(currentScroll > 10);

    // Hide on scroll down, show on scroll up
    if (currentScroll > lastScrollY.current && currentScroll > 100) {
      setShowAppBar(false); // scrolling down → hide
    } else {
      setShowAppBar(true); // scrolling up → show
    }

    lastScrollY.current = currentScroll;
  };

  window.addEventListener("scroll", handleScroll);
  return () => window.removeEventListener("scroll", handleScroll);
}, []);


  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setAuthInitialized(true);
      if (!firebaseUser) {
        setUser(null);
        setNotLoggedIn(true);
        setLoading(false);
        return;
      }
      setUser(firebaseUser);

      // Fetch user data realtime listener
      const userDocRef = doc(db, "users", firebaseUser.uid);
      const unsubscribeUser = onSnapshot(userDocRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setUserData(data);
          setUserType(data.type || "");
        }
        setNotLoggedIn(false);
        setLoading(false);
      }, () => {
        setUserData({});
        setUserType("");
        setLoading(false);
      });

      // Register push subscription
      if (Notification.permission === "granted") {
        registerPushSubscription(firebaseUser.uid);
      } else if (Notification.permission !== "denied") {
        Notification.requestPermission().then(permission => {
          if (permission === "granted") {
            registerPushSubscription(firebaseUser.uid);
          }
        });
      }

      // Cleanup on unmount
      return () => {
        unsubscribeUser();
      };
    });

    return () => unsubscribe();
  }, []);

  // Weather with cache

const [settings, setSettings] = useState(() => {
  const saved = localStorage.getItem('settings');
  return saved ? JSON.parse(saved) : { locationMode: 'auto', manualLocation: '' };
});

useEffect(() => {
  const now = new Date();
  const in12h = 12 * 60 * 60 * 1000; // 12 hours in ms
  const upcoming = [];
  const ongoing = [];
  const rems = [];

  // Trips
  (myTrips || []).forEach((trip) => {
    try {
      const startRaw = trip.startDate || trip.date;
      const endRaw = trip.endDate || trip.date;
      if (!startRaw) return;

      const start = new Date(startRaw);
      const end = endRaw ? new Date(endRaw) : new Date(startRaw);
      if (isNaN(start.getTime())) return;

      // Fetch from/to locations
      const from = trip.from || trip.startLocation || "Unknown";
      const to = trip.to || trip.endLocation || trip.location || "Unknown";

      if (start > now && start - now <= in12h) {
        // Upcoming trips within next 12h
        upcoming.push({
          id: trip.id,
          name: trip.name || "Unnamed Trip",
          start,
          from,
          to,
        });
      } else if (start <= now && now <= end) {
        // Ongoing trips
        ongoing.push({
          id: trip.id,
          name: trip.name || "Unnamed Trip",
          start,
          end,
          from,
          to,
        });
      }
    } catch (e) {
      console.warn("Malformed trip data", e);
    }
  });

  // Reminders (look for time/due fields or Firestore timestamp)
  (reminders || []).forEach((r) => {
    if (r.completed) return;
    let dt = null;
    if (r.time && typeof r.time === "string") dt = new Date(r.time);
    if (!dt && r.due) dt = new Date(r.due);
    if (!dt && r.when) dt = new Date(r.when);
    if (!dt && r.timestamp && r.timestamp.seconds) dt = new Date(r.timestamp.seconds * 1000);
    if (!dt) return;
    if (isNaN(dt.getTime())) return;
    if (dt > now && dt - now <= in12h) {
      rems.push({ id: r.id, text: r.text || r.title || "Reminder", time: dt });
    }
  });

  setLiveAlerts({
    upcoming: upcoming.map(t => ({
      ...t,
      priority: inferPriority(t.start),
      progress: computeProgress(t.start),
    })),
    ongoing,
    reminders: rems,
  });

}, [myTrips, reminders]);

  const fetchWeather = async (location) => {
    try {
      let url = '';
      if (location.mode === "auto") {
        url = `https://api.openweathermap.org/data/2.5/weather?lat=${location.lat}&lon=${location.lon}&appid=${WEATHER_API_KEY}&units=metric`;
      } else if (location.mode === "manual") {
        url = `https://api.openweathermap.org/data/2.5/weather?q=${location.manualLocation}&appid=${WEATHER_API_KEY}&units=metric`;
      }
      const res = await fetch(url);
      const data = await res.json();
      if (data.cod !== 200) throw new Error("Location not found");
      const weatherObj = {
        main: data.weather?.[0]?.main || "Default",
        desc: data.weather?.[0]?.description || "",
        temp: Math.round(data.main?.temp),
        city: data.name,
        feelsLike: Math.round(data.main?.feels_like),
        humidity: data.main?.humidity,
        wind: Math.round(data.wind?.speed * 3.6), // Convert m/s to km/h
        pressure: data.main?.pressure,visibility: data.visibility, // in meters
      
      // Sky & Precipitation
      clouds: data.clouds?.all,
      rain: data.rain?.['1h'] || 0,
      snow: data.snow?.['1h'] || 0,
      
      // Wind
      windSpeed: data.wind.speed,
      windDeg: data.wind.deg,
      windGust: data.wind.gust || 0,
      
      // System
      country: data.sys.country,
      sunrise: data.sys.sunrise,
      sunset: data.sys.sunset,
      timezone: data.timezone,
      id: data.id
      };
      setWeather(weatherObj);
      setWeatherLoading(false);
      localStorage.setItem(WEATHER_STORAGE_KEY, JSON.stringify(weatherObj));
      document.cookie = `${WEATHER_STORAGE_KEY}=${encodeURIComponent(
        JSON.stringify(weatherObj)
      )}; path=/; max-age=1800`;
    } catch (error) {
      console.error("Weather fetch error:", error);
      setWeather(null);
      setWeatherLoading(false);
    }
  };

  const fetchAQI = async (lat, lon) => {
    setAqiLoading(true);
    try {
      const response = await fetch(CPCB_URL);
      const json = await response.json();
      const stationsMap = {};
      json.records.forEach(r => {
        const key = r.station;
        if (!stationsMap[key]) {
          stationsMap[key] = {
            id: r.id || key,
            city: r.city,
            station: r.station,
            state: r.state,
            lat: parseFloat(r.latitude),
            lng: parseFloat(r.longitude),
            last_update: r.last_update,
            pollutants: {},
            maxAqi: 0
          };
        }
        const val = parseInt(r.avg_value) || 0;
        stationsMap[key].pollutants[r.pollutant_id] = { value: r.avg_value, unit: r.pollutant_unit };
        if (val > stationsMap[key].maxAqi) stationsMap[key].maxAqi = val;
      });
      const grouped = Object.values(stationsMap).filter(s => !isNaN(s.lat));
      // Find nearest
      let minDist = Infinity;
      let nearest = null;
      grouped.forEach(s => {
        const dist = Math.sqrt((lat - s.lat)**2 + (lon - s.lng)**2);
        if (dist < minDist) {
          minDist = dist;
          nearest = s;
        }
      });
      setAqiData(nearest);
      setAqiLoading(false);
    } catch (error) {
      console.error('AQI fetch error:', error);
      setAqiLoading(false);
    }
  };

useEffect(() => {

  // Clear any existing watch
  if (watchIdRef.current) {
    navigator.geolocation.clearWatch(watchIdRef.current);
    watchIdRef.current = null;
  }

  if (settings.locationMode === "auto") {
    if (navigator.geolocation) {
      watchIdRef.current = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const location = {
            mode: "auto",
            lat: latitude,
            lon: longitude,
          };
          fetchWeather(location);
        },
        (error) => {
          console.error('Geolocation error:', error);
          setWeatherLoading(false);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      );
    } else {
      console.error('Geolocation not supported');
      setWeatherLoading(false);
    }
  } else if (settings.locationMode === "manual") {
    const manualLocation = localStorage.getItem("manualLocation") || settings.manualLocation;
    if (manualLocation) {
      const location = {
        mode: "manual",
        manualLocation,
      };
      fetchWeather(location);
    } else {
      setWeatherLoading(false);
    }
    setAqiData(null);
    setAqiLoading(false);
  }

  return () => {
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  };
}, [settings.locationMode, settings.manualLocation]);

// Fetch AQI only once on app refresh
useEffect(() => {
  if (settings.locationMode === "auto") {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          fetchAQI(position.coords.latitude, position.coords.longitude);
        },
        (error) => {
          console.error('AQI geolocation error:', error);
          setAqiLoading(false);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      );
    } else {
      setAqiLoading(false);
    }
  } else {
    setAqiData(null);
    setAqiLoading(false);
  }
}, []); // Empty dependency array: only on mount


useEffect(() => {
    if (!user?.uid) { // 👈 FIX: Guard against null user or missing uid
      setReminders([]);
      setRemindersLoading(false); // Make sure to handle loading state correctly
      return;
    }

    setRemindersLoading(true);
    
    const unsubscribe = onSnapshot(
      query(collection(db, "reminders"), where("uid", "==", user.uid)), // Now safe to access user.uid
      (snapshot) => {
        const remindersData = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setReminders(remindersData);
        setRemindersLoading(false);
      },
      (error) => {
        console.error("Error fetching reminders:", error);
        setRemindersLoading(false);
      }
    );

    return () => unsubscribe(); // Cleanup subscription on unmount
  }, [user]);

  useEffect(() => {
    if (!user?.uid) {
      setBudgets([]);
      setLoading(false);
      return;
    }
    setLoading(true);

    const budgetsDocRef = doc(db, "budgets", user.uid);

    const unsubscribeBudgets = onSnapshot(budgetsDocRef, (docSnap) => {
      if (docSnap.exists()) {
        setBudgets(docSnap.data().items || []);
      } else {
        setBudgets([]);
      }
      setLoading(false);
    }, () => {
      setBudgets([]);
      setLoading(false);
    });

    return () => unsubscribeBudgets();
  }, [user]);


    useEffect(() => {
        if (!auth.currentUser) return;

        const userId = auth.currentUser.uid;
        const notificationsQuery = query(
            collection(db, "notifications"),
            where("uid", "==", userId),
            where("seen", "==", false)
        );

        const unsubscribe = onSnapshot(notificationsQuery, (querySnapshot) => {
            setUnreadCount(querySnapshot.size);
        });

        // Cleanup listener on component unmount
        return () => unsubscribe();
    }, []);

const {
    backgroundType,
    category,
    gradientType,
    presetIndex,
    animated,
  } = useBackground();

  // 1. Logic to determine the background style object
  const backgroundStyle = useMemo(() => {
    // ─── SOLID ─────────────────────────
    if (backgroundType === "solid") {
      const color = Backgrounds.solidByIndex({
        category,
        index: presetIndex,
      });
      return Backgrounds.composeSolid(color);
    }

    // ─── MESH (Complex Radial Glows) ───
    if (backgroundType === "mesh") {
      const m = Backgrounds.meshByIndex({
        category, // e.g., 'atmospheric', 'weather'
        index: presetIndex,
      });
      return Backgrounds.composeGradient(m.value);
    }

    // ─── GRADIENT ──────────────────────
    if (backgroundType === "gradient") {
      if (animated) {
        const g = Backgrounds.animatedGradientByIndex({
          index: presetIndex,
        });
        return Backgrounds.composeGradient(g.value, g.animation);
      }

      const g = Backgrounds.gradientByIndex({
        type: gradientType, // 'single' or 'multi'
        category,
        index: presetIndex,
      });
      return Backgrounds.composeGradient(g.value);
    }

    // ─── SAFE FALLBACK ─────────────────
    const defaultMesh = Backgrounds.meshByIndex({ category: "atmospheric", index: 0 });
    return Backgrounds.composeGradient(defaultMesh.value);
  }, [backgroundType, category, gradientType, presetIndex, animated]);

  // 2. Logic to determine text color for the AppBar and Greeting
const textColor = useMemo(
  () => (mode === "dark" ? "#fff" : "#000"),
  [mode]
);

  // Real-time trips listener + timelines + trip member fetch (one-time per trip)
  useEffect(() => {
    if (!user?.uid) {
      setMyTrips([]);
      setTripMembersMap({});
      setTimelineStatsMap({});
      setTripGroupsMap({});
      return;
    }

    const tripsQuery = query(
      collection(db, "trips"),
      where("members", "array-contains", user.uid)
    );

    const unsubscribeTrips = onSnapshot(tripsQuery, (querySnapshot) => {
      const tripsList = [];
      querySnapshot.forEach(doc => tripsList.push({ id: doc.id, ...doc.data() }));
      setMyTrips(tripsList);

      tripsList.forEach(async (trip) => {
        if (trip.members && Array.isArray(trip.members)) {
          const membersData = await Promise.all(
            trip.members.map(uid =>
              getDoc(doc(db, "users", uid)).then(d => d.exists() ? { uid: d.id, ...d.data() } : null)
            )
          );
          setTripMembersMap(prev => ({ ...prev, [trip.id]: membersData.filter(Boolean) }));
        }
      });

      let timelineUnsubs = [];
      timelineUnsubs.forEach(unsub => unsub && unsub());
      timelineUnsubs = tripsList.map(trip => {
        const timelineCol = collection(db, "trips", trip.id, "timeline");
        const unsub = onSnapshot(timelineCol, snap => {
          const events = snap.docs.map(d => d.data());
          const total = events.length || 1;
          const completed = events.filter(e => e.completed === true).length;
          setTimelineStatsMap(prev => ({
            ...prev,
            [trip.id]: { completed, total, percent: Math.round((completed / total) * 100) }
          }));
        });
        return unsub;
      });

      return () => timelineUnsubs.forEach(unsub => unsub && unsub());
    });

    return () => unsubscribeTrips();
  }, [user]);

  useEffect(() => {
    if (myTrips && myTrips.length > 0) {
      setSliderIndex(getDefaultTripIndex(myTrips));
    }
  }, [myTrips]);

  useEffect(() => {
    if (!myTrips.length) {
      setTripGroupsMap({});
      return;
    }

    const fetchGroupsForTrips = async () => {
      const groupMap = {};
      await Promise.all(
        myTrips.map(async trip => {
          const groupSnap = await getDoc(doc(db, "groupChats", trip.id));
          if (groupSnap.exists()) {
            groupMap[trip.id] = groupSnap.data();
          }
        })
      );
      setTripGroupsMap(groupMap);
    };

    fetchGroupsForTrips();
  }, [myTrips]);

  // const handleLogout = () => {
  //   localStorage.removeItem(SESSION_KEY);
  //   document.cookie = `${SESSION_KEY}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;`;
  //   localStorage.removeItem("bunkmateuser");
  //   auth.signOut().then(() => navigate("/login"));
  // };

  // Register push subscription with backend
  async function registerPushSubscription(uid) {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
    try {
      const reg = await navigator.serviceWorker.ready;
      let sub = await reg.pushManager.getSubscription();
      if (!sub) {
        // Get VAPID public key from backend
        const vapidRes = await fetch(VAPID_PUBLIC_KEY_URL);
        const { publicKey } = await vapidRes.json();
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
        });
      }
      // Save subscription to backend
      await fetch(`${SAVE_SUBSCRIPTION_URL}?uid=${uid}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sub),
      });
    } catch (e) {
      // Ignore errors
    }
  }

  // Helper to convert VAPID key
  function urlBase64ToUint8Array(base64String) {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, "+")
      .replace(/_/g, "/");
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  // Listen for push events and show notification
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.ready.then(reg => {
      reg.addEventListener("message", event => {
        if (event.data && event.data.type === "push-notification") {
          const { title, body } = event.data;
          if (Notification.permission === "granted") {
            new Notification(title, { body });
          }
        }
      });
    });
  }, []);

  if (!authInitialized) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (notLoggedIn) {
    navigate("/login", { replace: true });
    return null;
  }
  

  return (
    <ThemeProvider theme={theme}>
        <BetaAccessGuard>
          <Box
            sx={{
              display: "flex",
              minHeight: "100vh",
              flexDirection: { xs: 'column', lg: 'row' },
              backgroundColor: mode === "dark" ? "#0c0c0c" : "#f1f1f1",
              color: mode === "dark" ? "#fff" : "#000",
            }}
          >

<Box sx={{ flexGrow: 1, display: "flex", flexDirection: "column" }}>
<AppBar
  position="absolute"
  elevation={0}
  sx={{
    top: {xs: 45, lg: 35},
    transition: "all 0.45s cubic-bezier(.4,0,.2,1)",
    background: "transparent",
    backdropFilter: "none",
    WebkitBackdropFilter: "none",
    boxShadow: "none",
    py: 0,
    zIndex: 1200,
    m: 0,
    borderRadius: 28,
  }}
>
  <Toolbar
    sx={{
      justifyContent: "space-between",
      alignItems: "center",
      px: { xs: 3, lg: 5 },
      py: 1,
      minHeight: 64,
      transition: "padding 0.3s ease, background 0.3s ease",
    }}
  >
    {/* App Title */}
    <Typography
      variant="h6"
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1,
        fontWeight: 700,
        letterSpacing: 0.3,
        color: textColor,
        userSelect: "none",
      }}
    >
      <Box
        component="span"
        sx={{
          transition: "all 0.3s ease",
          display: "flex",
          flexDirection: "row",
          gap: 0.6,
          color: textColor,
        }}
      >
    <Box>
  <Typography
    variant="h5"
    sx={{
      fontSize: { xs: "1rem", sm: "1.3rem" },
      letterSpacing: 0.3,
      color: textColor + "ac",
      display: "flex",
      alignItems: "center",
      gap: 1,
      animation: "fadeSlideIn 0.7s ease",
    }}
  >
    {getGreeting()},
  </Typography>

  {/* Name highlight */}
  <Typography
    variant="title"
    sx={{
      fontSize: { xs: "1.2rem", sm: "1.3rem" },
      fontWeight: "bold",
      lineHeight: 1.15,
      color: textColor,
      animation: "nameGlow 2.8s ease-in-out infinite",
    }}
  >
    {userData.name || "Explorer"}
  </Typography>
    </Box>
      </Box>

    </Typography>

        {!isSmallScreen && (
          <Button
            onClick={() => navigate('/search')}
            startIcon={<Search />}
            sx={{
              width: 400,
              justifyContent: "flex-start",
              borderRadius: 8,
              py: 1,
              px: 2,
              backgroundColor: mode === "dark" ? "#ffffff08" : "#00000005",
              color: "text.secondary",
              textTransform: "none",
              border: "1px solid rgba(255,255,255,0.1)",
              '&:hover': { backgroundColor: mode === "dark" ? "#ffffff12" : "#00000008" }
            }}
          >
            Search Exploration...
          </Button>
        )}

    {/* Right-side profile icon */}
    {isSmallScreen && (
    <Box
      sx={{
        transition: "transform 0.3s ease",
        backgroundColor: mode === "dark" ? "#f1f1f102" : "#0c0c0c11",
        backdropFilter: "blur(120px)",
        WebkitBackdropFilter: "blur(120px)",
        color: textColor,
        borderRadius: "50%",
        boxShadow: mode === "dark" ? "inset 0 2px 6px rgba(255, 255, 255, 0.2), inset 0 -4px 10px rgba(255, 255, 255, 0.2)" : "inset 0 2px 6px rgba(0, 0, 0, 0.2), inset 0 -4px 10px rgba(0, 0, 0, 0.2)",
        p: 1.2,
        border: mode === "dark" ? "1px solid #ffffff46" : "1px solid #ffffff00",
        "&:hover": { transform: "scale(1.05)" },
      }}
    >
      <Notifications sx={{ color: textColor }} />
    </Box>
  )}
  </Toolbar>
</AppBar>

<Box
  sx={{
    position: "fixed",
    inset: 0,
    zIndex: 0,
    pointerEvents: "none",

    /* Base dynamic background */
    ...backgroundStyle,

    /* Smooth transitions when background changes */
    transition: "background 1.2s cubic-bezier(.4,0,.2,1)",

    /* Subtle cinematic depth */
    "&::before": {
      content: '""',
      position: "absolute",
      inset: 0,
      background:
        "radial-gradient(circle at top center, rgba(255,255,255,0.08), transparent 60%)",
      opacity: 0.6,
    },

    /* Grain / texture layer */
    "&::after": {
      content: '""',
      position: "absolute",
      inset: 0,
      backgroundImage:
        "url('data:image/svg+xml;utf8,\
        <svg xmlns=\"http://www.w3.org/2000/svg\" width=\"120\" height=\"120\">\
        <filter id=\"n\"><feTurbulence type=\"fractalNoise\" baseFrequency=\"0.8\" numOctaves=\"4\" stitchTiles=\"stitch\"/></filter>\
        <rect width=\"120\" height=\"120\" filter=\"url(%23n)\" opacity=\"0.035\"/></svg>')",
      opacity: 0.35,
      mixBlendMode: "overlay",
    },
  }}
/>


            <Box sx={{ height: { xs: 0, sm: 0 } }} />
            {notLoggedIn ? (
              <Box sx={{ p: 6, textAlign: "center" }}>
                <Typography variant="h5" color="text.secondary">
                  Please log in to use BunkMate.
                </Typography>
              </Box>
            ) : (
              <Box
                fullWidth
                sx={{
                  zIndex: 1,
                  position: "relative",
                  mb: 2,
color: textColor,
transition: "all 1.2s cubic-bezier(.4,0,.2,1)",
borderRadius: "0 0 34px 34px",
                }}
              >
                <Container
                  maxWidth="lg"
                  sx={{
                    pt: 10,
                    pb: 2,
                    position: "relative",
                    zIndex: 3,
                    "&:after": {
                      content: '""',
                      display: "block",
                      position: "absolute",
                      left: 0,
                      right: 0,
                      bottom: 0,
                      height: { xs: 60, md: 60 }, 
                      pointerEvents: "none",
                      zIndex: 2,
                    },
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      flexWrap: "wrap",
                      gap: 2,
                      borderRadius: 3,
                      pt: 12,
                      pb: 1,
                      px: 1,
                      transition: "background 0.8s cubic-bezier(.4,2,.6,1)",
                      animation: `${fadeIn} 0.7s`,
                      zIndex: 3,
                      position: "relative",
                    }}
                  >


                    {/* Weather Widget */}

<Box
  fullWidth
  sx={{
    display: "flex",
    alignItems: "center",
    gap: 1.6,
    px: 1,
    pb: 1,
    borderRadius: 6,
    minHeight: 58,
    width: { xs: '100%', sm: 'auto' },
    border: "none",
    boxShadow: "none",

    // backdropFilter: "blur(14px) saturate(1.4)",
    // WebkitBackdropFilter: "blur(14px) saturate(1.4)",

    // background:
    //   mode === "dark"
    //     ? "linear-gradient(135deg, rgba(255, 255, 255, 0.05), rgba(255,255,255,0.03))"
    //     : "linear-gradient(135deg, rgba(255, 255, 255, 0.29), rgba(255, 255, 255, 0.27))",
  }}
>
<Box
  fullWidth
  onClick={() => setWeatherOpen(true)}
  sx={{
    display: "flex",
    alignItems: "center",
    gap: 1.6,
    px: 0,
    py: 1.3,
    borderRadius: 6,
    minHeight: 58,
    width: { xs: '100%', sm: 'auto' },

    border: "none",

    boxShadow: "none",

    animation: `${fadeIn} 0.6s ease both`,
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
      {/* Weather Icon */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {weatherIcons[weather.main] || weatherIcons.Default}
      </Box>

      {/* Text */}
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
              {" "}· {weather.city}
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

  {/* Animations */}
  <style>
    {`
      @keyframes iconFloat {
        0% { transform: translateY(0); }
        50% { transform: translateY(-4px); }
        100% { transform: translateY(0); }
      }
    `}
  </style>
</Box>

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
              zIndex: 99999,
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
    smoothClose(y, velocity);

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

<WeatherDetailsDrawer
  weather={weather}
  open={weatherOpen}
  onClose={() => setWeatherOpen(false)}
/>

</Box>

                  </Box>

<>
      <Card
        sx={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          px: 1,
          py: 1.5,
          borderRadius: 4,
          backdropFilter: "blur(0px)",
          backgroundImage: "none",
          backgroundColor: 'transparent',
          color: mode === "dark" ? "#f5f5f5" : "#111",
          boxShadow:'none',
          minWidth: 260,
          maxWidth: 480,
          gap: 1,
          transition: "all 280ms cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        {/* Ongoing Alerts (always visible) */}
<Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
  {liveAlerts.ongoing.map((t) => {
    const expanded = expandedOngoingId === t.id;
    const { currentDay, totalDays } = getDayProgress(
      t.start,
      t.end
    );

    const completed = currentDay >= totalDays;

    return (
      <motion.div
        key={t.id}
        layout
        transition={{ layout: { duration: 0.35, ease: "easeOut" } }}
      >
        <motion.div
          onClick={() =>
            setExpandedOngoingId(expanded ? null : t.id)
          }
          whileHover={{ y: -6 }}
          whileTap={{ scale: 0.98 }}
          style={{ cursor: "pointer" }}
        >
          <Box
            sx={{
              width: 260,
              p: 1.6,
              borderRadius: 6,
              display: "flex",
              flexDirection: "column",
              gap: 1.2,

              backdropFilter: "blur(10px)",
              background:
                completed
                  ? "linear-gradient(135deg, rgba(16,185,129,0.18), rgba(16,185,129,0.08))"
                  : mode === "dark"
                  ? "linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.04))"
                  : "linear-gradient(135deg, rgba(0,0,0,0.05), rgba(0,0,0,0.02))",

              border:
                completed
                  ? "1px solid rgba(16,185,129,0.4)"
                  : mode === "dark"
                  ? "1px solid rgba(255,255,255,0.1)"
                  : "1px solid rgba(0,0,0,0.06)",
            }}
          >
            {/* ─── HEADER ─── */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              {/* Icon */}
              <motion.div
                animate={{ scale: [1, 1.15, 1] }}
                transition={{ repeat: Infinity, duration: 1.6 }}
              >
                <Box
                  sx={{
                    width: 38,
                    height: 38,
                    borderRadius: 10,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: completed
                      ? "rgba(16,185,129,0.25)"
                      : "rgba(255,0,0,0.22)",
                  }}
                >
                  {completed ? (
                    <CheckCircleOutline
                      sx={{ color: "#10b981" }}
                    />
                  ) : (
                    <WifiTethering
                      sx={{ color: "#ff6b6b" }}
                    />
                  )}
                </Box>
              </motion.div>

              {/* Title */}
              <Box sx={{ flexGrow: 1 }}>
                <Typography
                  variant="body2"
                  sx={{ fontWeight: 800 }}
                  noWrap
                >
                  {t.name}
                </Typography>

                <Typography variant="caption" color="text.secondary">
                  Day {currentDay} / {totalDays}
                </Typography>
              </Box>

              {/* Status */}
              <Chip
                size="small"
                label={completed ? "COMPLETED" : "LIVE"}
                sx={{
                  fontWeight: 800,
                  backgroundColor: completed
                    ? "rgba(16,185,129,0.25)"
                    : "rgba(255,0,0,0.25)",
                  color: completed ? "#10b981" : mode === "dark" ? "#ffb4b4" : "#ff6868ff",
                }}
              />
            </Box>

{completed && expanded && (
  <Confetti
    numberOfPieces={160}
    recycle={false}
    gravity={0.25}
    tweenDuration={5000}
  />
)}


            {/* ─── EXPANDED ─── */}
<AnimatePresence>
  {expanded && (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.35 }}
    >
      <Box
        onClick={(e) => e.stopPropagation()}
        sx={{
          mt: 1,
          pt: 1,
          borderTop:
            mode === "dark"
              ? "1px solid rgba(255,255,255,0.1)"
              : "1px solid rgba(0,0,0,0.08)",
          display: "flex",
          flexDirection: "column",
          gap: 1,
        }}
      >
        <Typography variant="caption">
          Route • {t.from} → {t.to}
        </Typography>

        {/* 🗺 OSM Map Preview */}
        <MiniRouteMap from={t.from} to={t.to} />

        {/* 🎉 Confetti */}
        {completed && (
          <Typography
            variant="caption"
            sx={{
              color: "#10b981",
              fontWeight: 700,
              textAlign: "center",
            }}
          >
            🎉 Trip Completed!
          </Typography>
        )}

<Box
  sx={{
    display: "flex",
    gap: 1.2,
    mt: 0.5,
  }}
>
  {/* PRIMARY CTA */}
  {/* <Button
    fullWidth
    variant="contained"
    size="small"
    onClick={() => navigate(`/trips/${t.id}`)}
    sx={{
      textTransform: "none",
      fontWeight: 800,
      letterSpacing: 0.2,
      borderRadius: 999,
      py: 0.9,

      background:
        mode === "dark"
          ? "linear-gradient(135deg, #ffffffff, #ffffffff)"
          : "linear-gradient(135deg, #000000ff, #000000ff)",

      color: mode === "dark" ? "#000000ff" : "#fff",
      boxShadow: "none",

      transition: "all 220ms cubic-bezier(0.4,0,0.2,1)",

      "&:hover": {
        transform: "translateY(-1px) scale(1.02)",
        boxShadow: "none",
      },

      "&:active": {
        transform: "scale(0.96)",
      },
    }}
  >
    Go to Trip
  </Button> */}

  {/* SECONDARY CTA */}
  <Button
    fullWidth
    variant="outlined"
    size="small"
    onClick={() => navigate(`/trips/${t.id}?tab=details`)}
    sx={{
      textTransform: "none",
      fontWeight: 700,
      borderRadius: 6,
      py: 0.9,

      color: mode === "dark" ? "#e5e7eb" : "#111",

      border:
        mode === "dark"
          ? "1px solid rgba(255,255,255,0.25)"
          : "1px solid rgba(0,0,0,0.18)",

      background:
        mode === "dark"
          ? "rgba(255,255,255,0.06)"
          : "rgba(0,0,0,0.04)",

      backdropFilter: "blur(10px)",

      transition: "all 200ms cubic-bezier(0.4,0,0.2,1)",

      "&:hover": {
        background:
          mode === "dark"
            ? "rgba(255,255,255,0.12)"
            : "rgba(0,0,0,0.08)",
        transform: "translateY(-1px)",
      },

      "&:active": {
        transform: "scale(0.97)",
      },
    }}
  >
    Go to Trip
  </Button>
</Box>

      </Box>
    </motion.div>
  )}
</AnimatePresence>

          </Box>
        </motion.div>
      </motion.div>
    );
  })}
</Box>

        {/* Upcoming Alerts Icons */}
<Box
  sx={{
    display: "flex",
    gap: 1,
    alignItems: "center",
  }}
>
  {liveAlerts.upcoming.map((t, index) => (
    <IconButton
      key={t.id}
      onClick={() => setOpenUpcoming(true)}
      sx={{
        width: 64,
        height: 64,
        borderRadius: 6,
        position: "relative",
        overflow: "hidden",

        backdropFilter: "blur(6px)",
        background:
          mode === "dark"
            ? "linear-gradient(135deg, rgba(158,234,158,0.25), rgba(158,234,158,0.15))"
            : "linear-gradient(135deg, rgba(0,122,51,0.18), rgba(0,122,51,0.08))",

        border:
          mode === "dark"
            ? "1px solid rgba(158,234,158,0.35)"
            : "1px solid rgba(0,122,51,0.28)",

        boxShadow: "none",

        transition:
          "transform 240ms cubic-bezier(0.4, 0, 0.2, 1), box-shadow 240ms ease, background 240ms ease",

        animation: `iconFloatIn 280ms ease ${index * 60}ms both`,

        "&:hover": {
          transform: "scale(1.15) rotate(-6deg)",
          boxShadow:
            mode === "dark"
              ? "0 10px 28px rgba(0,0,0,0.6)"
              : "0 10px 28px rgba(0,0,0,0.28)",
          background:
            mode === "dark"
              ? "linear-gradient(135deg, rgba(158,234,158,0.38), rgba(158,234,158,0.22))"
              : "linear-gradient(135deg, rgba(0,122,51,0.28), rgba(0,122,51,0.14))",
        },

        "&:active": {
          transform: "scale(0.95)",
        },
      }}
    >
      {/* Subtle Pulse Ring */}
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          borderRadius: 6,
          backgroundColor:
            mode === "dark"
              ? "rgba(158,234,158,0.6)"
              : "rgba(0,122,51,0.5)",
          opacity: 0.25,
          animation: "softPulse 2.2s infinite",
          pointerEvents: "none",
        }}
      />

      {/* Icon */}
      <AccessTime
        sx={{
          position: "relative",
          fontSize: 26,
          color: mode === "dark" ? "#9eea9e" : "#007a33",
        }}
      />

      {/* Animations */}
      <style>
        {`
          @keyframes softPulse {
            0% { transform: scale(1); opacity: 0.25; }
            60% { transform: scale(1.6); opacity: 0; }
            100% { transform: scale(1); opacity: 0.25; }
          }

          @keyframes iconFloatIn {
            from {
              opacity: 0;
              transform: translateY(6px) scale(0.85);
            }
            to {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }
        `}
      </style>
    </IconButton>
  ))}
</Box>

      </Card>

      {/* Upcoming Alerts Dialog */}
<AnimatePresence>
  {openUpcoming && (
<SwipeableDrawer
  anchor="bottom"
  open
  onClose={() => setOpenUpcoming(false)}
  disableSwipeToOpen
  PaperProps={{
    component: motion.div,
    drag: isSmallScreen ? "y" : false,
    dragConstraints: { top: 0, bottom: 320 },
    dragElastic: 0.2,
    onDragEnd: (_, info) => {
      if (info.offset.y > 140) setOpenUpcoming(false);
    },
    initial: {
      y: isSmallScreen ? "100%" : 24,
      opacity: 0,
      scale: isSmallScreen ? 1 : 0.96,
    },
    animate: {
      y: 0,
      opacity: 1,
      scale: 1,
    },
    exit: {
      y: isSmallScreen ? "100%" : 24,
      opacity: 0,
      scale: 0.96,
    },
    transition: {
      duration: 0.38,
      ease: [0.4, 0, 0.2, 1],
    },
    sx: {
      height: isSmallScreen ? "58vh" : "auto",
      maxHeight: "92vh",
      borderRadius: isSmallScreen ? "22px 22px 0 0" : 4,
      overflow: "hidden",
      zIndex: 1300,

      backdropFilter: "blur(18px) saturate(1.6)",
      WebkitBackdropFilter: "blur(18px) saturate(1.6)",

      background:
        mode === "dark"
          ? "linear-gradient(180deg, rgba(18, 18, 18, 0.55), rgba(18, 18, 18, 0.55))"
          : "linear-gradient(180deg, rgba(255, 255, 255, 0.55), rgba(248,250,252,0.55))",

      boxShadow:
        mode === "dark"
          ? "0 -24px 60px rgba(0,0,0,0.7)"
          : "0 -24px 60px rgba(255, 255, 255, 0.25)",
    },
  }}
>
  {/* Drag Handle */}
  <Box
    sx={{
      display: "flex",
      justifyContent: "center",
      pt: 1.2,
      pb: 0.6,
    }}
  >
    <Box
      sx={{
        width: 42,
        height: 4,
        borderRadius: 999,
        backgroundColor:
          mode === "dark"
            ? "rgba(255,255,255,0.25)"
            : "rgba(0,0,0,0.25)",
      }}
    />
  </Box>

  {/* Header */}
  <DialogTitle
    sx={{
      fontWeight: 900,
      fontSize: "1.05rem",
      px: 3,
      pb: 1,
      mb: 1,
      letterSpacing: 0.2,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      borderBottom:
        mode === "dark"
          ? "1px solid rgba(255,255,255,0.08)"
          : "1px solid rgba(0,0,0,0.06)",
    }}
  >
    Upcoming Trips & Alerts
  </DialogTitle>

  {/* Content */}
  <DialogContent
    sx={{
      px: 3,
      pt: 2,
      pb: 3,
      display: "flex",
      flexDirection: "column",
      gap: 1.4,
      overflowY: "auto",

      "&::-webkit-scrollbar": {
        width: 6,
        display: "none",
      },
      "&::-webkit-scrollbar-thumb": {
        borderRadius: 6,
        display: "none",
        backgroundColor:
          mode === "dark"
            ? "rgba(255,255,255,0.2)"
            : "rgba(0,0,0,0.2)",
      },
    }}
  >
    {liveAlerts.upcoming.length === 0 && (
      <Typography
        variant="body2"
        sx={{
          color: "text.secondary",
          textAlign: "center",
          mt: 4,
        }}
      >
        No upcoming alerts
      </Typography>
    )}

    {liveAlerts.upcoming.map((alert) => (
      <AlertRow
        key={alert.id}
        alert={alert}
        mode={mode}
        expanded={expandedId === alert.id}
        onToggle={() =>
          setExpandedId(
            expandedId === alert.id ? null : alert.id
          )
        }
      />
    ))}
  </DialogContent>
</SwipeableDrawer>
  )}
</AnimatePresence>
</>


                </Container>
              </Box>
            )}

            {/* Main Content */}
<Box>
            <Container
              maxWidth="lg"
              sx={{
                position: "relative",
                zIndex: 3,
                display: "flex",
                flexDirection: "column",
                gap: 4,
                animation: `${fadeIn} 0.8s ease both`,
                px: 4,
                zIndex: 3,
              }}
            >
<Grid container spacing={3} justifyContent={"center"} mt={3}>
                    {/* Trips Display card */}
                    <Grid item xs={12} md={6} lg={4} xl={2.4}>
                      {myTrips && myTrips.length > 0 ? (
                        <Box sx={{ minWidth: {xs: "86vw", lg: "50vw"}, px: 0 }}>
                          <Typography variant="h6" textAlign="left" mb={1} ml={1.4}>Your Trips</Typography>
                          <Slider {...sliderSettings} slickGoTo={sliderIndex} afterChange={setSliderIndex} >
                            {myTrips.map((tripInfo) => (
<Box key={tripInfo.id} sx={{ px: 0 }}>
  <Card
    onClick={() => navigate(`/trips/${tripInfo.id}`)}
    sx={{
      position: "relative",
      overflow: "hidden",
      borderRadius: "24px",
      cursor: "pointer",
      mx: { xs: 1, lg: 0 },

      background:
          tripGroupsMap[tripInfo.id]?.iconURL
            ? `url(${tripGroupsMap[tripInfo.id].iconURL})`
            : mode === "dark"
          ? "linear-gradient(135deg, #1e1e1e, #2c2c2c)"
          : "linear-gradient(135deg, #f5f5f5, #e0e0e0)",

      backgroundSize: "cover",
      backgroundPosition: "center",

      boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
      transition: "all 0.35s ease",

      "&:hover": {
        boxShadow: "none",
      },

      "&::before": {
        content: '""',
        position: "absolute",
        inset: 0,
        background:
          "linear-gradient(to top, rgba(0,0,0,0.75), rgba(0,0,0,0.2))",
        zIndex: 1,
      },
    }}
  >
    {/* Glass Content Layer */}
    <CardContent
      sx={{
        position: "relative",
        zIndex: 2,
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end",
        backdropFilter: "blur(6px)",
      }}
    >
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="flex-start"
        gap={2}
      >
        {/* Left Content */}
        <Box>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 800,
              color: "#fff",
              letterSpacing: 0.3,
            }}
          >
            {tripInfo?.name || "Unnamed Trip"}
          </Typography>

          <Typography
            variant="body2"
            sx={{
              color: "rgba(255,255,255,0.75)",
              display: "flex",
              alignItems: "center",
              mt: 0.5,
            }}
          >
            <LocationOn sx={{ fontSize: 16, mr: 0.7 }} />
            {tripInfo?.from || "Unknown"} →{" "}
            {tripInfo?.location || "Unknown"}
          </Typography>

          {(tripInfo?.startDate || tripInfo?.date) && (
            <Typography
              variant="body2"
              sx={{
                color: "rgba(255,255,255,0.7)",
                display: "flex",
                alignItems: "center",
                mt: 0.3,
              }}
            >
              <AccessTime sx={{ fontSize: 16, mr: 0.7 }} />
              {tripInfo?.startDate || "?"} → {tripInfo?.date || "?"}
            </Typography>
          )}
        </Box>

        {/* Avatar Group */}
        {tripMembersMap[tripInfo.id]?.length > 0 && (
          <AvatarGroup
            max={3}
            sx={{
              "& .MuiAvatar-root": {
                width: 30,
                height: 30,
                fontSize: 12,
                border: mode === "dark" ? "2px solid #1d1d1d" : "2px solid #ddd",
                backdropFilter: "blur(4px)",
              },
            }}
          >
            {tripMembersMap[tripInfo.id].map((m) => (
              <Tooltip
                title={m.name || `@${m.username}`}
                key={m.uid}
              >
                <Avatar
                  src={
                    m.photoURL ||
                    `https://api.dicebear.com/7.x/identicon/svg?seed=${m.uid}`
                  }
                  alt={m.name || m.username}
                />
              </Tooltip>
            ))}
          </AvatarGroup>
        )}
      </Box>
    </CardContent>
  </Card>
</Box>
                            ))}
                          </Slider>
                        </Box>
                      ) : (
<Box
  sx={{
    mt: 6,
    px: 2,
    py: 2,
    textAlign: "center",
    borderRadius: "20px",

    backdropFilter: "blur(14px)",
    background:
      theme.palette.mode === "dark"
        ? "rgba(255,255,255,0.05)"
        : "rgba(255,255,255,0.7)",

    border: "1px solid rgba(255,255,255,0.15)",
    boxShadow: "0 10px 30px rgba(0,0,0,0.1)",

    maxWidth: 420,
    mx: "auto",

    transition: "all 0.3s ease",
    "&:hover": {
      transform: "translateY(-4px)",
      boxShadow: "0 20px 50px rgba(0,0,0,0.15)",
    },
  }}
>
  {/* Emoji / Icon */}
  <Typography
    sx={{
      fontSize: "40px",
      mb: 1,
    }}
  >
    🧳
  </Typography>

  {/* Title */}
  <Typography
    variant="h6"
    sx={{
      fontWeight: 700,
      mb: 0.5,
      color: theme.palette.text.primary,
    }}
  >
    No Trips Yet
  </Typography>

  {/* Subtitle */}
  <Typography
    variant="body2"
    sx={{
      color: theme.palette.text.secondary,
      opacity: 0.85,
    }}
  >
    You haven’t planned any trips yet. Start your next adventure now!
  </Typography>

  {/* Optional CTA Button */}
    
    <Button
      onClick={() => navigate('/search')}
      variant="contained"
      sx={{
        mt: 2,
        borderRadius: "12px",
        textTransform: "none",
        background: mode === "dark" ? "#fff" : "#0c0c0c",
        color: mode === "dark" ? "#0c0c0c" : "#fff",
        px: 3,
        py: 1,
      }}
    >
      + Create Trip
    </Button> 
   
</Box>
                      )}
                    </Grid>

                    {/* Reminders Glimpse Card */}
<Container maxWidth="lg" sx={{ mt: 4 }}>
  {/* Header */}
  <Box
    sx={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      mb: 2,
    }}
  >
    <Typography variant="h6" fontWeight={600}>
      Reminders
    </Typography>

    <Button
      size="small"
      onClick={() => navigate("/reminders")}
      sx={{
        textTransform: "none",
        fontSize: 13,
        fontWeight: 600,
        opacity: 0.7,
      }}
    >
      View all
    </Button>
  </Box>

  {/* Cards Row */}
<Box sx={{ position: "relative", mt: 1, backgroundColor: "transparent" }}>
  {/* ⬅️ LEFT */}
  {/* {/* <IconButton
    onClick={() =>
      remindersScrollRef.current.scrollBy({
        left: -REMCARD_WIDTH,
        behavior: "smooth",
      })
    }
    sx={{
      position: "absolute",
      left: -12,
      top: "35%",
      transform: "translateY(-35%)",
      zIndex: 3,
      backdropFilter: "blur(10px)",
      background: "rgba(0,0,0,0.35)",
      color: "#fff",
    }}
  >
    <ChevronLeft />
  </IconButton> */}

  {/* ➡️ RIGHT */}
  {/* <IconButton
    onClick={() =>
      remindersScrollRef.current.scrollBy({
        left: REMCARD_WIDTH,
        behavior: "smooth",
      })
    }
    sx={{
      position: "absolute",
      right: -12,
      top: "35%",
      transform: "translateY(-35%)",
      zIndex: 3,
      backdropFilter: "blur(10px)",
      background: "rgba(0,0,0,0.35)",
      color: "#fff",
    }}
  >
    <ChevronRight />
  </IconButton> */}

  {/* SCROLL CONTAINER */}
  <Box
    ref={remindersScrollRef}
    sx={{
      display: "flex",
      gap: 1,
      pl: 1,
      overflowX: "auto",
      paddingBottom: 1,
      scrollSnapType: "x mandatory",
      backgroundColor: "transparent",
      background: "transparent"
    }}
    onScroll={(e) => {
      setReminderIndex(
        Math.round(e.target.scrollLeft / REMCARD_WIDTH)
      );
    }}
  >
{displayReminders.map((rem, index) => (
  <motion.div
    key={rem?.id ?? "empty-reminder"}
    style={{ scrollSnapAlign: "start" }}
    initial={{ scale: 0.9, opacity: 0 }}
    animate={{ scale: 1, opacity: 1 }}
    whileHover={{ scale: 1.04 }}
    whileTap={{ scale: 0.96 }}
    transition={{
      type: "spring",
      stiffness: 240,
      damping: 18,
      mass: 0.55,
      delay: index * 0.05,
    }}
  >
    <Box sx={{ backgroundColor: "transparent" }}>
      <ReminderCard
        rem={rem}
        mode={mode}
        onToggleComplete={handleToggleReminderComplete}
      />
    </Box>
  </motion.div>
))}

{/* ➕ GROUPED "+N MORE" CARD */}
{remainingCount > 0 && (
  <motion.div
    style={{ scrollSnapAlign: "start" }}
    initial={{ scale: 0.85, opacity: 0 }}
    animate={{ scale: 1, opacity: 1 }}
    whileHover={{ scale: 1.06 }}
    whileTap={{ scale: 0.95 }}
    transition={{
      type: "spring",
      stiffness: 220,
      damping: 16,
      mass: 0.5,
    }}
  >
    <Box
      onClick={() => navigate("/reminders")}
      sx={{
        minWidth: 240,
        height: 100,
        borderRadius: 5,
        p: 2.5,
        cursor: "pointer",
        position: "relative",
        overflow: "hidden",
        userSelect: "none",

        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 0.6,

        background:
          mode === "dark"
            ? `
              linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02)),
              repeating-linear-gradient(
                0deg,
                rgba(255,255,255,0.04),
                rgba(255,255,255,0.04) 1px,
                transparent 1px,
                transparent 18px
              )
            `
            : `
              linear-gradient(180deg, #ffffff, #f8fafc),
              repeating-linear-gradient(
                0deg,
                rgba(0,0,0,0.035),
                rgba(0,0,0,0.035) 1px,
                transparent 1px,
                transparent 18px
              )
            `,

        border:
          mode === "dark"
            ? "1px dashed rgba(255,255,255,0.18)"
            : "1px dashed rgba(0,0,0,0.12)",

        boxShadow:
          mode === "dark"
            ? "0 10px 26px rgba(0,0,0,0.4)"
            : "0 10px 22px rgba(0,0,0,0.14)",

        transition: "box-shadow .3s ease",
      }}
    >
      {/* Watermark */}
      <CalendarMonth
        sx={{
          position: "absolute",
          right: -18,
          bottom: -18,
          fontSize: 120,
          opacity: 0.06,
          pointerEvents: "none",
        }}
      />

      <Typography fontSize={26} fontWeight={900}>
        +{remainingCount}
      </Typography>

      <Typography variant="caption" sx={{ opacity: 0.65, fontWeight: 600 }}>
        more reminders
      </Typography>

      <Typography variant="caption" sx={{ opacity: 0.45 }}>
        View all →
      </Typography>
    </Box>
  </motion.div>
)}


  </Box>
</Box>

</Container>
</Grid> 
</Container>

          <Box>
            <Box
              sx={{
                top: 0,
                zIndex: 20,
                display: "flex",
                flexGrow: 1,

                borderRadius: "30px 30px 0 0",
                pt: 2,

                background: `
                  linear-gradient(
                    to top,
                    ${mode === "dark"
                      ? "rgba(12,12,12,0.96)"
                      : "rgba(241,241,241,0.96)"} 40%,
                    ${mode === "dark"
                      ? "rgba(12, 12, 12, 0.92)"
                      : "rgba(241,241,241,0.72)"} 85%,
                    ${mode === "dark"
                      ? "rgba(0, 0, 0, 0.06)"
                      : "rgba(255, 255, 255, 0.08)"} 100%
                  )
                `,
                    
                transition:
                  "background 600ms cubic-bezier(.4,0,.2,1)",

                "&::after": {
                  content: '""',
                  inset: 0,
                  pointerEvents: "none",
                },
              }}
            >

              <Container maxWidth="lg" sx={{ flexGrow: 1, pt: 0, position: "relative" }}>

<FloatingSearch mode={mode} />

                {loading ? (
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      height: "60vh",
                    }}
                  >
                    <CircularProgress color={theme.palette.background.main} />

                  </Box>
                ) : (
                  <Grid container spacing={3} pt={1} justifyContent={"center"}>

                    
                    {/* Trips Suggestions Card (NEW SECTION) */}
{/* Trips Suggestions Carousel and List */}
<Grid item xs={12} sx={{ px: { xs: 1, md: 0 }, mt: 4, mb: 10 }}>

  {allFlattenedPlaces.length > 0 ? (
    <>
      {/* Carousel for first 4 places */}
{carouselPlaces.length > 0 && (
  <>
    <Typography
      variant="h6"
      textAlign="left"
      mb={1.5}
      sx={{ fontWeight: 600, px: 1 }}
    >
      Featured Places
    </Typography>

<Box sx={{ position: "relative" }}>
  {/* ◀ LEFT */}
  <IconButton
    onClick={() =>
      placesScrollRef.current.scrollBy({
        left: -CARD_WIDTH,
        behavior: "smooth",
      })
    }
    sx={{
      position: "absolute",
      left: -6,
      top: "45%",
      zIndex: 5,
      backdropFilter: "blur(14px)",
      background: "rgba(0,0,0,0.35)",
      color: "#fff",
    }}
  >
    <ChevronLeft />
  </IconButton>

  {/* ▶ RIGHT */}
  <IconButton
    onClick={() =>
      placesScrollRef.current.scrollBy({
        left: CARD_WIDTH,
        behavior: "smooth",
      })
    }
    sx={{
      position: "absolute",
      right: -6,
      top: "45%",
      zIndex: 5,
      backdropFilter: "blur(14px)",
      background: "rgba(0,0,0,0.35)",
      color: "#fff",
    }}
  >
    <ChevronRight />
  </IconButton>

  {/* SCROLL AREA */}
  <Box
    ref={placesScrollRef}
    onScroll={(e) => {
      setPlaceIndex(
        Math.round(e.target.scrollLeft / CARD_WIDTH)
      );
    }}
    sx={{
      display: "flex",
      gap: 2,
      px: 1,
      mb: 2,
      overflowX: "auto",
      scrollSnapType: "x mandatory",
      "&::-webkit-scrollbar": { display: "none" },
    }}
  >
    {carouselPlaces.map((place) => (
      <Box
        key={place.id}
        sx={{ width: 365, scrollSnapAlign: "start" }}
      >
        <PlaceCard
          place={place}
          mode={mode}
          navigate={navigate}
          userData={userData}
          onPlanTrip={onPlanTrip}
        />
      </Box>
    ))}
  </Box>

  {/* DOTS */}
  <Box sx={{ display: "flex", justifyContent: "center", gap: 1 }}>
    {carouselPlaces.map((_, i) => (
      <Box
        key={i}
        onClick={() =>
          placesScrollRef.current.scrollTo({
            left: i * CARD_WIDTH,
            behavior: "smooth",
          })
        }
        sx={{
          width: i === placeIndex ? 18 : 6,
          height: 6,
          borderRadius: 99,
          cursor: "pointer",
          transition: "all .3s ease",
          background:
            i === placeIndex
              ? mode === "dark"
                ? "rgba(255,255,255,0.85)"
                : "rgba(0,0,0,0.85)"
              : mode === "dark"
              ? "rgba(255,255,255,0.25)"
              : "rgba(0,0,0,0.22)",
        }}
      />
    ))}
  </Box>
</Box>

  </>
)}


      {/* Remaining places in a grid */}
      {remainingPlaces.length > 0 && (
        <Box>
          <Typography variant="h6" textAlign="left" mb={2} sx={{ fontWeight: 600 }}>
            More Places
          </Typography>
          <Grid container spacing={2}>
            {remainingPlaces.map((place, index) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
                <PlaceCard place={place} mode={mode} navigate={navigate} userData={userData} onPlanTrip={onPlanTrip} />
              </Grid>
            ))}
          </Grid>
        </Box>
      )}
    </>
  ) : (
    <Box sx={{ py: 10, textAlign: 'center' }}>
       <CircularProgress size={30} />
       <Typography mt={2} color="text.secondary">Loading suggestions...</Typography>
    </Box>
  )}
</Grid>

<Box
  sx={{
    mt: 5,
    mb: 16,
    textAlign: "center",
    userSelect: "none",

    display: "flex",
    justifyContent: "center",
    alignItems: "center",

    opacity: 0.55,
    transition: "opacity .25s ease",

    "&:hover": {
      opacity: 0.85,
    },
  }}
>
  <Typography
    variant="caption"
    sx={{
      fontWeight: 800,
      letterSpacing: "0.08em",
      fontSize: "0.72rem",

      display: "inline-flex",
      alignItems: "center",
      gap: 0.6,

      color: "text.secondary",

      px: 2.5,
      py: 1,

      borderRadius: 999,
      backdropFilter: "blur(10px)",
      background: "rgba(0,0,0,0.04)",

      boxShadow: "0 6px 18px rgba(0,0,0,0.08)",
    }}
  >
    BunkMate v{packageJson.version || "N/A"}
    <span style={{ opacity: 0.6 }}>—</span>
    Made with ❤️
  </Typography>
</Box>

                  </Grid>
                )}
              </Container>
            </Box>
          </Box>
</Box>

<Drawer
  anchor="bottom"
  open={createDialogOpen}
  onClose={closeDrawer}
  PaperProps={{
    sx: {
      height: "100vh",
      maxHeight: "100vh",
      overflow: "hidden",
      position: "relative",

      /* 🌫 Glassmorphism */
      backdropFilter: "blur(22px) saturate(1.6)",
      WebkitBackdropFilter: "blur(22px) saturate(1.6)",

      background:
        mode === "dark"
          ? "linear-gradient(180deg, rgba(10,10,10,0.88), rgba(0,0,0,0.95))"
          : "linear-gradient(180deg, rgba(255,255,255,0.88), rgba(245,247,250,0.96))",

      color: mode === "dark" ? "#fff" : "#111",

      /* 🪟 Soft border */
      borderTop:
        mode === "dark"
          ? "1px solid rgba(255,255,255,0.08)"
          : "1px solid rgba(0,0,0,0.06)",

      /* 🌬 Depth without heaviness */
      boxShadow:
        mode === "dark"
          ? "0 -24px 80px rgba(0,0,0,0.85)"
          : "0 -24px 60px rgba(0,0,0,0.18)",

      /* 🎬 Motion */
      transition: "all 420ms cubic-bezier(0.4, 0, 0.2, 1)",
    },
  }}
>


  {/* ───── Content Wrapper ───── */}
  <Box
    sx={{
      px: { xs: 2.5, sm: 4 },
      pb: 4,
      pt: 4,
      height: "100%",
      overflowY: "auto",

      /* Clean scroll */
      "&::-webkit-scrollbar": {
        width: 6,
      },
      "&::-webkit-scrollbar-thumb": {
        borderRadius: 6,
        backgroundColor:
          mode === "dark"
            ? "rgba(255,255,255,0.18)"
            : "rgba(0,0,0,0.18)",
      },
    }}
  >
  {/* Header */}
<Box
  sx={{
    position: "relative",
    mb: 4,
    pb: 2,
    px: { xs: 0.5, sm: 1 },

    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",

    /* Subtle separation */
    borderBottom:
      mode === "dark"
        ? "1px solid rgba(255,255,255,0.08)"
        : "1px solid rgba(0,0,0,0.06)",
  }}
>
  {/* Title */}
  <Box sx={{ display: "flex", flexDirection: "column" }}>
    <Typography
      variant="h5"
      sx={{
        fontWeight: 900,
        letterSpacing: 0.3,
        lineHeight: 1.2,
      }}
    >
      Create a trip
    </Typography>

    <Typography
      variant="caption"
      sx={{
        mt: 0.5,
        color: "text.secondary",
        fontWeight: 500,
      }}
    >
      Plan routes, dates & invite members
    </Typography>
  </Box>

  {/* Close Button */}
  <IconButton
    onClick={closeDrawer}
    aria-label="Close create trip"
    sx={{
      width: 40,
      height: 40,
      borderRadius: 8,

      background:
        mode === "dark"
          ? "rgba(255,255,255,0.08)"
          : "rgba(0,0,0,0.06)",

      backdropFilter: "blur(10px)",
      WebkitBackdropFilter: "blur(10px)",

      border:
        mode === "dark"
          ? "1px solid rgba(255,255,255,0.12)"
          : "1px solid rgba(0,0,0,0.08)",

      transition: "all 180ms cubic-bezier(0.4,0,0.2,1)",

      "&:hover": {
        background:
          mode === "dark"
            ? "rgba(255,255,255,0.14)"
            : "rgba(0,0,0,0.1)",
        transform: "scale(1.05)",
      },

      "&:active": {
        transform: "scale(0.95)",
      },
    }}
  >
    <CloseOutlined fontSize="small" />
  </IconButton>
</Box>

  {/* Stepper */}
<Box sx={{ mb: 3 }}>
  <Stack
    direction="row"
    alignItems="center"
    spacing={1.5}
    sx={{
      px: 1,
    }}
  >
    {/* Step 1 */}
    <Chip
      label="Trip Details"
      size="small"
      sx={{
        px: 1.5,
        height: 32,
        fontWeight: 700,
        letterSpacing: 0.2,

        background:
          step === 0
            ? "linear-gradient(135deg, #ffffff, #f1f1f1)"
            : mode === "dark"
            ? "rgba(255,255,255,0.08)"
            : "rgba(0,0,0,0.06)",

        color:
          step === 0
            ? "#000"
            : mode === "dark"
            ? "rgba(255,255,255,0.7)"
            : "rgba(0,0,0,0.7)",

        border:
          step === 0
            ? "none"
            : mode === "dark"
            ? "1px solid rgba(255,255,255,0.15)"
            : "1px solid rgba(0,0,0,0.15)",

        boxShadow:
          step === 0
            ? "none"
            : "none",

        transition: "all 220ms cubic-bezier(0.4,0,0.2,1)",
      }}
    />

    {/* Connector */}
    <Box
      sx={{
        flex: 1,
        height: 2,
        borderRadius: 2,
        background:
          step >= 1
            ? "linear-gradient(90deg, #ffffff, #f1f1f1)"
            : mode === "dark"
            ? "rgba(255,255,255,0.12)"
            : "rgba(0,0,0,0.12)",
        transition: "background 300ms ease",
      }}
    />

    {/* Step 2 */}
    <Chip
      label="Add Members"
      size="small"
      sx={{
        px: 1.5,
        height: 32,
        fontWeight: 700,
        letterSpacing: 0.2,

        background:
          step === 1
            ? "linear-gradient(135deg, #ffffff, #f1f1f1)"
            : mode === "dark"
            ? "rgba(255,255,255,0.08)"
            : "rgba(0,0,0,0.06)",

        color:
          step === 1
            ? "#000"
            : mode === "dark"
            ? "rgba(255,255,255,0.7)"
            : "rgba(0,0,0,0.7)",

        border:
          step === 1
            ? "none"
            : mode === "dark"
            ? "1px solid rgba(255,255,255,0.15)"
            : "1px solid rgba(0,0,0,0.15)",

        boxShadow:
          step === 1
            ? "none"
            : "none",

        transition: "all 220ms cubic-bezier(0.4,0,0.2,1)",
      }}
    />
  </Stack>
</Box>

  {/* Step 0: Details */}
{step === 0 && (
  <Box
    sx={{
      display: "flex",
      flexDirection: "column",
      gap: 2.5,
      animation: "fadeUp 0.35s ease",
    }}
  >
    {/* ───── Trip Cover / Icon ───── */}
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        mb: 1.5,
      }}
    >
      <Box
        sx={{
          position: "relative",
          p: 0,
          borderRadius: 5,
          background: "transparent",
        }}
      >
        <Avatar
          src={newTrip.iconDataUri || randomNatureImage}
          sx={{
            width: 210,
            height: 210,
            borderRadius: 4,
            boxShadow:
              mode === "dark"
                ? "0 20px 40px rgba(0,0,0,0.6)"
                : "0 16px 36px rgba(0,0,0,0.18)",
          }}
        />
      </Box>
    </Box>

    {/* ───── Trip Name ───── */}
    <TextField
      label="Trip Name"
      placeholder="e.g. Weekend in Manali"
      fullWidth
      value={newTrip.name}
      onChange={(e) =>
        setNewTrip((prev) => ({ ...prev, name: e.target.value }))
      }
      sx={formFieldSx}
    />

    {/* ───── From / To ───── */}
    <Box sx={{ display: "flex", gap: 1.5 }}>
      <TextField
        label="From"
        placeholder="Start location"
        fullWidth
        value={newTrip.from}
        onChange={(e) =>
          setNewTrip((prev) => ({ ...prev, from: e.target.value }))
        }
        sx={formFieldSx}
      />
      <TextField
        label="To"
        placeholder="Destination"
        fullWidth
        value={newTrip.to}
        onChange={(e) =>
          setNewTrip((prev) => ({ ...prev, to: e.target.value }))
        }
        sx={formFieldSx}
      />
    </Box>

    {/* ───── Route / Location ───── */}
    <TextField
      label="Route / Location"
      placeholder="Optional route or description"
      fullWidth
      value={newTrip.location}
      onChange={(e) =>
        setNewTrip((prev) => ({ ...prev, location: e.target.value }))
      }
      sx={formFieldSx}
    />

    {/* ───── Dates ───── */}
    <Box sx={{ display: "flex", gap: 1.5 }}>
      <TextField
        label="Start Date"
        type="date"
        InputLabelProps={{ shrink: true }}
        fullWidth
        value={newTrip.startDate}
        onChange={(e) =>
          setNewTrip((prev) => ({ ...prev, startDate: e.target.value }))
        }
        sx={formFieldSx}
      />
      <TextField
        label="End Date"
        type="date"
        InputLabelProps={{ shrink: true }}
        fullWidth
        value={newTrip.endDate}
        onChange={(e) =>
          setNewTrip((prev) => ({ ...prev, endDate: e.target.value }))
        }
        sx={formFieldSx}
      />
    </Box>

    {/* ───── Actions ───── */}
    <DialogActions sx={{ mt: 2, px: 0, gap: 1.5 }}>
      <Button
        fullWidth
        onClick={closeDrawer}
        sx={{
          height: 46,
          textTransform: "none",
          fontWeight: 600,
          borderRadius: 8,
          background:
            mode === "dark"
              ? "rgba(255,255,255,0.06)"
              : "rgba(0,0,0,0.05)",
          color: "text.primary",
          "&:hover": {
            background:
              mode === "dark"
                ? "rgba(255,255,255,0.12)"
                : "rgba(0,0,0,0.1)",
          },
        }}
      >
        Cancel
      </Button>

      <Button
        variant="contained"
        fullWidth
        onClick={handleNext}
        sx={{
          height: 46,
          textTransform: "none",
          backgroundColor: mode === "dark" ? "#ffffff" : "#000000",
          color: mode === "dark" ? "#000000" : "#ffffff",
          fontWeight: 700,
          borderRadius: 8,
        }}
      >
        Next
      </Button>
    </DialogActions>

    {/* Animations */}
    <style>
      {`
        @keyframes fadeUp {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}
    </style>
  </Box>
)}

  {/* Step 1: Members + budget */}
{step === 1 && (
  <Box
    sx={{
      display: "flex",
      flexDirection: "column",
      gap: 3,
      animation: "fadeUp 0.35s ease",
    }}
  >
    {/* ───── Friends Picker ───── */}
    {friendCards.length > 0 && (
      <Box>
        <Typography
          variant="subtitle1"
          sx={{ fontWeight: 800, mb: 1 }}
        >
          Your Friends
        </Typography>

        <Stack
          direction="row"
          spacing={2}
          sx={{
            overflowX: "auto",
            pb: 1,
            "&::-webkit-scrollbar": { height: 6 },
            "&::-webkit-scrollbar-thumb": {
              backgroundColor:
                theme.palette.mode === "dark"
                  ? "rgba(255,255,255,0.25)"
                  : "rgba(0,0,0,0.25)",
              borderRadius: 3,
            },
          }}
        >
          {friendCards.map((friend) => (
            <Card
              key={friend.uid}
              sx={{
                minWidth: 140,
                p: 2,
                borderRadius: 4,
                flexShrink: 0,
                boxShadow: "none",

                background:
                  mode === "dark"
                    ? "linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03))"
                    : "linear-gradient(180deg, #ffffff, #f4f6f8)",

                border:
                  mode === "dark"
                    ? "1px solid rgba(255,255,255,0.12)"
                    : "1px solid rgba(0,0,0,0.08)",

                transition: "transform 180ms ease, box-shadow 180ms ease",

                "&:hover": {
                  transform: "translateY(-4px)",
                },
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  textAlign: "center",
                }}
              >
                <Avatar
                  src={friend.photoURL}
                  sx={{ width: 56, height: 56, mb: 1 }}
                />

                <Typography
                  sx={{ fontWeight: 700, lineHeight: 1.2 }}
                  noWrap
                >
                  {friend.name || friend.username}
                </Typography>

                <Typography
                  variant="caption"
                  sx={{ color: "text.secondary" }}
                  noWrap
                >
                  @{friend.username}
                </Typography>

                <Button
                  size="small"
                  onClick={() => handleAddMember(friend)}
                  sx={{
                    mt: 1.2,
                    px: 2,
                    borderRadius: 999,
                    fontWeight: 700,
                    textTransform: "none",
                    boxShadow: "none",

                    background:
                      mode === "dark"
                        ? "#ffffff"
                        : "#000000",
                    color:
                      mode === "dark"
                        ? "#000000"
                        : "#ffffff",

                    "&:hover": {
                      opacity: 0.85,
                    },
                  }}
                >
                  Add
                </Button>
              </Box>
            </Card>
          ))}
        </Stack>
      </Box>
    )}

    {/* ───── Selected Members ───── */}
    {selectedMembers.length > 0 && (
      <Box>
        <Typography
          variant="subtitle2"
          sx={{ fontWeight: 700, mb: 1 }}
        >
          Added Members
        </Typography>

        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
          {selectedMembers.map((user) => (
            <Chip
              key={user.uid}
              avatar={<Avatar src={user.photoURL} />}
              label={user.name || user.username}
              onDelete={() => handleRemoveMember(user.uid)}
              sx={{
                px: 0.5,
                fontWeight: 600,
                borderRadius: 2,

                background:
                  mode === "dark"
                    ? "rgba(255,255,255,0.08)"
                    : "rgba(0,0,0,0.06)",
              }}
            />
          ))}
        </Box>
      </Box>
    )}

    {/* ───── Contributions ───── */}
    {selectedMembers.length > 0 && (
      <Box>
        <Typography
          variant="subtitle2"
          sx={{ fontWeight: 700, mb: 1 }}
        >
          Contributions
        </Typography>

        <Stack spacing={1.5}>
          {selectedMembers.map((user, idx) => (
            <Box
              key={user.uid}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                p: 1.5,
                borderRadius: 3,

                background:
                  mode === "dark"
                    ? "rgba(255,255,255,0.06)"
                    : "rgba(0,0,0,0.04)",

                border:
                  mode === "dark"
                    ? "1px solid rgba(255,255,255,0.08)"
                    : "1px solid rgba(0,0,0,0.08)",
              }}
            >
              <Avatar src={user.photoURL} />

              <Box sx={{ flexGrow: 1 }}>
                <Typography fontWeight={600}>
                  {user.name || user.username}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  @{user.username}
                </Typography>
              </Box>

              <TextField
                label="₹ Amount"
                type="number"
                size="small"
                value={user.contribution || ""}
                onChange={(e) =>
                  handleContributionChange(idx, e.target.value)
                }
                sx={{
                  width: 120,
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 2,
                  },
                }}
              />
            </Box>
          ))}
        </Stack>
      </Box>
    )}

    {/* ───── Total Budget ───── */}
    <Box
      sx={{
        mt: 2,
        p: 2,
        borderRadius: 4,
        textAlign: "center",

        background:
          mode === "dark"
            ? "linear-gradient(135deg, rgba(16,185,129,0.2), rgba(16,185,129,0.08))"
            : "linear-gradient(135deg, rgba(16,185,129,0.18), rgba(16,185,129,0.08))",
      }}
    >
      <Typography variant="caption" sx={{ opacity: 0.8 }}>
        Total Budget
      </Typography>
      <Typography variant="h6" sx={{ fontWeight: 900 }}>
        ₹ {totalContribution}
      </Typography>
    </Box>

    {/* ───── Actions ───── */}
    <DialogActions sx={{ mt: 2, px: 0, gap: 1.5 }}>
      <Button
        fullWidth
        onClick={handleBack}
        sx={{
          height: 46,
          borderRadius: 8,
          fontWeight: 600,
          textTransform: "none",
          color: "text.primary",
          background:
            mode === "dark"
              ? "rgba(255,255,255,0.06)"
              : "rgba(0,0,0,0.06)",
        }}
      >
        Back
      </Button>

      <Button
        variant="contained"
        fullWidth
        onClick={handleCreateTrip}
        sx={{
          height: 46,
          borderRadius: 8,
          fontWeight: 700,
          textTransform: "none",
          color: mode === "dark" ? "#000000" : "#ffffff",
          backgroundColor: mode === "dark" ? "#ffffff" : "#000000",
        }}
      >
        Create Trip
      </Button>
    </DialogActions>

    <style>
      {`
        @keyframes fadeUp {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}
    </style>
  </Box>
)}

</Box>
</Drawer>
</Box>
          </Box>
        </BetaAccessGuard>
    </ThemeProvider>
  );
};

export default Home;