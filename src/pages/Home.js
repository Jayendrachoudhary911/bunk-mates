import React, { useEffect, useState, useMemo, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { doc, collection, query, where, orderBy, getDoc, onSnapshot, getDocs } from "firebase/firestore";
import { auth, db } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useWeather } from "../contexts/WeatherContext";
import { Chats } from "./Chats";
import packageJson from '../../package.json';
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { weatherGradients, weatherColors, weatherbgColors, weatherIcons } from "../elements/weatherTheme";
import { useThemeToggle } from "../contexts/ThemeToggleContext";
import { getTheme } from "../theme";
import Snackbar from "@mui/material/Snackbar";
import MuiAlert from "@mui/material/Alert";
// Import placesData (assuming path is correct relative to Home.js)
import placesData from '../data/data.json';
import {
  motion,
  AnimatePresence,
  useAnimationControls,
  useMotionValue
} from "framer-motion";
import { Drawer, TextField, DialogActions, SwipeableDrawer } from "@mui/material";
import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import AddIcon from "@mui/icons-material/Add";
import { useCreateTripDrawer } from "../hooks/useCreateTripDrawer";
import MapOutlinedIcon from "@mui/icons-material/MapOutlined";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import SearchIcon from "@mui/icons-material/Search";

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
  Fab,
  Zoom,
  Badge,
  IconButton,
  Collapse,
  BottomNavigation,
  BottomNavigationAction,
  Dialog,
  DialogTitle,
  DialogContent,
  Chip, // Added Chip for place details
  Divider, // Added Divider for visual separation
  CardMedia, // Added CardMedia for place image
  Stack
} from "@mui/material";
import {
  LocationOn,
  AccessTime,
  WbSunnyOutlined, // Added weather icon
  CalendarTodayOutlined, // Added season icon
  Cloud as CloudIcon,
  FlashOffRounded, // Added for AQI
} from "@mui/icons-material";
import ProfilePic from "../components/Profile";
import Notifications from "../elements/Notifications";
import Reminders from "./Reminders";
import DeviceGuard from "../components/DeviceGuard";
import BetaAccessGuard from "../components/BetaAccessGuard";
import CategoryOutlinedIcon from '@mui/icons-material/CategoryOutlined';
import RestaurantOutlinedIcon from '@mui/icons-material/RestaurantOutlined';
import TravelExploreOutlinedIcon from '@mui/icons-material/TravelExploreOutlined';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import LocalMallOutlinedIcon from '@mui/icons-material/LocalMallOutlined';
import LocalHospitalOutlinedIcon from '@mui/icons-material/LocalHospitalOutlined';
import SchoolOutlinedIcon from '@mui/icons-material/SchoolOutlined';
import EmojiEventsOutlinedIcon from '@mui/icons-material/EmojiEventsOutlined';
import LocalGasStationOutlinedIcon from '@mui/icons-material/LocalGasStationOutlined';
import MovieOutlinedIcon from '@mui/icons-material/MovieOutlined';
import LocalAtmOutlinedIcon from '@mui/icons-material/LocalAtmOutlined';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import AccountBalanceWalletOutlinedIcon from '@mui/icons-material/AccountBalanceWalletOutlined';
import ExploreOutlinedIcon from '@mui/icons-material/ExploreOutlined';
import StickyNote2OutlinedIcon from '@mui/icons-material/StickyNote2Outlined';
import AlarmOutlinedIcon from '@mui/icons-material/AlarmOutlined';
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import NotificationsNoneOutlinedIcon from '@mui/icons-material/NotificationsNoneOutlined';
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import CircleIcon from "@mui/icons-material/Circle";
import LiveTvIcon from "@mui/icons-material/LiveTv";
import BroadcastOnPersonalIcon from "@mui/icons-material/BroadcastOnPersonal";
import WifiTetheringIcon from "@mui/icons-material/WifiTethering";
import { MapContainer, TileLayer, Polyline, Marker } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import Confetti from "react-confetti";
import BlurEffect from "react-progressive-blur";

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

// Stable random tilt per card (no jitter on re-render)
const getCardTilt = (() => {
  const cache = {};
  return (id) => {
    if (!cache[id]) {
      cache[id] = (Math.random() * 2 - 1) * 1.2; // -1.2° → +1.2°
    }
    return cache[id];
  };
})();

const LIKED_PLACES_KEY = "bunkmate_liked_places";

const getLikedPlaces = () => {
  try {
    return JSON.parse(localStorage.getItem(LIKED_PLACES_KEY)) || [];
  } catch {
    return [];
  }
};

const saveLikedPlace = (place) => {
  const liked = getLikedPlaces();
  if (!liked.find(p => p.id === place.id)) {
    localStorage.setItem(
      LIKED_PLACES_KEY,
      JSON.stringify([...liked, place])
    );
  }
};


const SWIPE_THRESHOLD = 120;

// Safe haptics (mobile only, no crashes)
const triggerHaptic = (velocity = 0.5) => {
  if (!navigator.vibrate) return;

  if (velocity > 1.2) navigator.vibrate([12, 18, 12]);
  else if (velocity > 0.6) navigator.vibrate(12);
  else navigator.vibrate(6);
};


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

const getAQIDetails = (aqi) => {
  if (aqi <= 50) return { label: "Good", color: "#10b981" };
  if (aqi <= 100) return { label: "Satisfactory", color: "#84cc16" };
  if (aqi <= 200) return { label: "Moderate", color: "#facc15" };
  if (aqi <= 300) return { label: "Poor", color: "#f97316" };
  if (aqi <= 400) return { label: "Very Poor", color: "#ef4444" };
  return { label: "Severe", color: "#991b1b" };
};

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

const getOSMRouteEmbed = (from, to) => {
  const base = "https://www.openstreetmap.org/export/embed.html";
  const query = new URLSearchParams({
    layer: "mapnik",
    marker: from,
  });

  return `${base}?${query.toString()}`;
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


const SESSION_KEY = "bunkmate_session";
const WEATHER_STORAGE_KEY = "bunkmate_weather";
const WEATHER_API_KEY = "c5298240cb3e71775b479a32329803ab"; // <-- Replace with your API key
const NOTIF_API_URL = "http://localhost:5000/notifications"; // Adjust if needed
const VAPID_PUBLIC_KEY_URL = "http://localhost:5000/vapid_public_key";
const SAVE_SUBSCRIPTION_URL = "http://localhost:5000/save_subscription";
const POLL_INTERVAL = 6000; // ms
const CPCB_URL = `https://api.data.gov.in/resource/3b01bcb8-0b14-4abf-b6f2-c1bfd384ba69?api-key=579b464db66ec23bdd0000011c04ccafb50742ba6a0a7d5e22aa498e&format=json&limit=1000`;

function getUserFromStorage() {
  try {
    const storedUser = localStorage.getItem("bunkmateuser");
    if (storedUser) {
      const parsed = JSON.parse(storedUser);
      if (parsed?.uid) return parsed;
    }
    const cookieUser = document.cookie
      .split("; ")
      .find(row => row.startsWith("bunkmateuser="))
      ?.split("=")[1];
    if (cookieUser) {
      const parsed = JSON.parse(decodeURIComponent(cookieUser));
      if (parsed?.uid) return parsed;
    }
  } catch {}
  return null;
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "Good Morning";
  if (hour >= 12 && hour < 17) return "Good Afternoon";
  if (hour >= 17 && hour < 21) return "Good Evening";
  return "Good Night";
}

const getGreetingEmoji = () => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "☀️";
  if (hour >= 12 && hour < 17) return "🌤️";
  if (hour >= 17 && hour < 21) return "🌆";
  return "🌙";
};

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

const carouselSettings = {
  dots: true,
  dotsClass: "slick-dots slick-thumb",
  infinite: false,
  speed: 500,
  slidesToShow: 4,
  slidesToScroll: 1,
  swipeToSlide: true,
  adaptiveHeight: true,
  arrows: false,
  responsive: [
    {
      breakpoint: 1024,
      settings: {
        slidesToShow: 3,
        slidesToScroll: 1,
      }
    },
    {
      breakpoint: 600,
      settings: {
        slidesToShow: 2,
        slidesToScroll: 1
      }
    },
    {
      breakpoint: 480,
      settings: {
        slidesToShow: 1,
        slidesToScroll: 1
      }
    }
  ]
};

const pickTip = keyframes`
  0% { transform: translateY(0) rotate(0deg); }
  40% { transform: translateY(-6px) rotate(-1deg); }
  70% { transform: translateY(-2px) rotate(0.4deg); }
  100% { transform: translateY(0) rotate(0deg); }
`;

// Helper component for Place Cards
const PlaceCard = ({ place, mode, navigate, onPlanTrip }) => {
  const theme = useTheme();

  return (
<Card
  onClick={(e) => {
    e.stopPropagation();
    onPlanTrip(place);
  }}
  sx={{
    position: "relative",
    height: 410,
    width: "100%",
    borderRadius: 6,
    overflow: "hidden",
    cursor: "pointer",
    border:
      mode === "dark"
        ? "1px solid rgba(255,255,255,0.1)"
        : "1px solid rgba(0,0,0,0.05)",
    backgroundImage: `url(${place.images?.[0]})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
    boxShadow:
      mode === "dark"
        ? "0 20px 40px rgba(0,0,0,0.6)"
        : "0 15px 35px rgba(0,0,0,0.15)",
    transition: "transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
    "&:hover": {
      transform: "scale(1.01)",
    },
  }}
>

  <CardContent
    sx={{
      position: "relative",
      zIndex: 2,
      background:
        "linear-gradient(to top, rgba(0,0,0,0.85), rgba(0,0,0,0.55), rgba(0,0,0,0.3), rgba(0,0,0,0))",
      height: "90%",
      display: "flex",
      flexDirection: "column",
      justifyContent: "flex-end",
      color: "#fff",
      p: 3,
      pb: 6
    }}
  >
    {/* Title & Location */}
    <Typography
      variant="h5"
      sx={{
        fontWeight: 900,
        mb: 0.5,
        textShadow: "0 2px 10px rgba(0,0,0,0.4)",
      }}
    >
      {place.name}
    </Typography>

    <Stack direction="row" spacing={0.5} alignItems="center" mb={2}>
      <LocationOn sx={{ fontSize: 18, color: theme.palette.primary.main }} />
      <Typography variant="body2" sx={{ fontWeight: 600, opacity: 0.9 }}>
        {place.city}, {place.state}
      </Typography>
    </Stack>

    {/* Info Chips */}
    <Stack direction="row" gap={1} flexWrap="wrap" mb={2}>
      {[place.weather.split(";")[0], place.season].map((text, i) => (
        <Chip
          key={i}
          label={text}
          size="small"
          sx={{
            background: "rgba(255,255,255,0.15)",
            backdropFilter: "blur(10px)",
            WebkitBackdropFilter: "blur(10px)",
            color: "#fff",
            fontWeight: 700,
            fontSize: "0.7rem",
            border: "1px solid rgba(255,255,255,0.1)",
          }}
        />
      ))}
    </Stack>

    <Typography
      variant="body2"
      sx={{
        opacity: 0.8,
        mb: 3,
        display: "-webkit-box",
        WebkitLineClamp: 2,
        WebkitBoxOrient: "vertical",
        overflow: "hidden",
        fontSize: "0.85rem",
        lineHeight: 1.5,
      }}
    >
      {place.description}
    </Typography>

    {/* Action Button */}
    <Button
      variant="contained"
      fullWidth
      onClick={(e) => {
        e.stopPropagation();
        onPlanTrip(place);
      }}
      sx={{
        py: 1.5,
        mb: 1,
        borderRadius: 4,
        fontWeight: 800,
        textTransform: "none",
        fontSize: "1rem",
        background: "#fff",
        color: "#000",
        "&:hover": { background: "#f1f1f1" },
      }}
    >
      Plan this Trip
    </Button>
  </CardContent>
</Card>
  );
};

const Home = () => {
  const navigate = useNavigate();
  const muiTheme = useTheme();
  const isSmallScreen = useMediaQuery(muiTheme.breakpoints.down("md"));
  const location = useLocation();

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
  const [remindersDrawerOpen, setRemindersDrawerOpen] = useState(false);
  const remindersRef = useRef();
  const [expandedId, setExpandedId] = useState(null);
  const [expandedOngoingId, setExpandedOngoingId] = useState(null);

  const [myTrips, setMyTrips] = useState([]);
  const [tripMembersMap, setTripMembersMap] = useState({});
  const [timelineStatsMap, setTimelineStatsMap] = useState({});
  const [tripGroupsMap, setTripGroupsMap] = useState({});
  const [sliderIndex, setSliderIndex] = useState(0);

  const { mode, accent } = useThemeToggle();
  const theme = getTheme(mode, accent);

  const [notifications, setNotifications] = useState([]);
  const [notifPopup, setNotifPopup] = useState({ open: false, message: "", id: null });
  const [unreadCount, setUnreadCount] = useState(0);

  const [liveAlerts, setLiveAlerts] = useState({ upcoming: [], ongoing: [], reminders: [] });
  const [expandedGroups, setExpandedGroups] = useState({ upcoming: true, reminders: true });
  const [openUpcoming, setOpenUpcoming] = useState(false);

  const [scrolled, setScrolled] = useState(false);
  const [showAppBar, setShowAppBar] = useState(true);
  const lastScrollY = useRef(0);
  const watchIdRef = useRef(null);
  const [friendCards, setFriendCards] = useState([]);

  const isDesktop = useMediaQuery(muiTheme.breakpoints.up('lg'));
  const isLargeDesktop = useMediaQuery(muiTheme.breakpoints.up('xl'));

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

const {
  createDialogOpen,
  step,
  newTrip,
  setNewTrip,
  selectedMembers,
  setSelectedMembers,
  randomNatureImage,
  startLocationMode,
  setStartLocationMode,
  resolvedStartLocation,
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

  const toggleGroup = (group) => {
    setExpandedGroups(prev => ({ ...prev, [group]: !prev[group] }));
  };

  const NAV_ITEMS = [ // <-- NEW CONSTANT ARRAY
    {
      label: "Notes",
      icon: <StickyNote2OutlinedIcon />,
      path: "/notes",
    },
    {
      label: "Reminder",
      icon: <AlarmOutlinedIcon />,
      path: "/reminders",
    },
    {
      label: "Trip",
      icon: <ExploreOutlinedIcon />,
      path: "/trips",
    },
    {
      label: "Budget",
      icon: <AccountBalanceWalletOutlinedIcon />,
      path: "/budget-mngr",
    },
  ];


  const placeSuggestions = useMemo(() => {
    if (!placesData || !placesData.states) return [];

    const allStates = Array.isArray(placesData.states) ? placesData.states : [];
          
    // Flatten the nested structure: states -> districts -> places
    const flatPlaces = allStates.flatMap(state => 
      (state.districts || []).flatMap(district => 
        (district.places || []).map(p => ({ 
          // Generate a unique ID and add location context
          id: p.name.replace(/\s/g, '_') + '_' + state.code + '_' + district.name,
          location: `${district.name}, ${state.name}`, 
          city: district.name,
          state: state.name,
          ...p 
        }))
      )
    );
    // Shuffle the array and take a maximum of 4 suggestions
    return flatPlaces
      .sort(() => 0.5 - Math.random())
      .slice(0, 4);
  }, []);

const incompleteRemindersCount = useMemo(() => {
    return reminders.filter((rem) => !rem.completed).length;
  }, [reminders]);


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

  const weatherBg =
    weather && weatherGradients[weather.main]
      ? weatherGradients[weather.main]
      : weatherGradients.Default;

  const buttonWeatherBg =
    weather && weatherColors[weather.main]
      ? weatherColors[weather.main]
      : weatherColors.Default;

  const WeatherBgdrop =
    weather && weatherbgColors[weather.main]
      ? weatherbgColors[weather.main]
      : weatherbgColors.Default;

  const sortedBudgets = useMemo(() => {
    return [...budgets].sort((a, b) => {
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bTime - aTime;
    });
  }, [budgets]);

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

  const handleLogout = () => {
    localStorage.removeItem(SESSION_KEY);
    document.cookie = `${SESSION_KEY}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;`;
    localStorage.removeItem("bunkmateuser");
    auth.signOut().then(() => navigate("/login"));
  };

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
      <DeviceGuard>
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
<AppBar
  position="absolute"
  elevation={0}
  sx={{
    top: 45 , // ⬆ hides smoothly
    transition: "all 0.45s cubic-bezier(.4,0,.2,1)",
    background: "transparent",
    backdropFilter: "none",
    WebkitBackdropFilter: "none",
    boxShadow: "none",
    py: 0,
    px: 0,
    zIndex: 1200,
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
        color: mode === "dark" ? "#f5f5f5" : "#222",
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
          color: scrolled
            ? mode === "dark"
              ? "#f1f1f1"
              : "#111"
            : mode === "dark"
              ? "#f1f1f1"
              : "#111",
        }}
      >
    <Box>
  <Typography
    variant="h5"
    sx={{
      fontSize: { xs: "1rem", sm: "1.3rem" },
      letterSpacing: 0.3,
      color: "text.secondary",
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
      color: mode == "dark" ? "#fff" : "#000000ff",
      animation: "nameGlow 2.8s ease-in-out infinite",
    }}
  >
    {userData.name || "Explorer"}
  </Typography>
    </Box>
      </Box>

    </Typography>

    {/* Right-side profile icon */}
    <Box
      sx={{
        transition: "transform 0.3s ease",
        backgroundColor: mode === "dark" ? "#1e1e1e23" : "#ffffff24",
        backdropFilter: "blur(120px)",
        WebkitBackdropFilter: "blur(120px)",
        borderRadius: "50%",
        p: 1.2,
        border: mode === "dark" ? "1px solid #33333346" : "1px solid #ddd",
        "&:hover": { transform: "scale(1.05)" },
      }}
    >
      <Notifications />
    </Box>
  </Toolbar>
</AppBar>

            <Box sx={{ height: { xs: 0, sm: 77 } }} />
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
                  mb: 1,
                  background: `linear-gradient(to top, rgba(0,0,0,0) 0%, #00000000 1%, ${theme.palette.primary.mainbg} 100%)`,
                  transition: "background 0.8s cubic-bezier(.4,2,.6,1)",
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
        color: mode === "dark" ? "#e5e7eb" : "#111",
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
            color: mode === "dark" ? "#fff" : "#111",
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
      sx={{ color: theme.palette.text.secondary, fontWeight: 600 }}
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

{/* AQI Widget */}
<Box
  sx={{
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 1.6,
    px: 2.4,
    py: 0.7,
    borderRadius: 4.5,
    minWidth: 95,
    minHeight: 64,
    position: "relative",
    overflow: "hidden",

    // Glassmorphism
    // backdropFilter: "saturate(1.6)",
    // WebkitBackdropFilter: "saturate(1.6)",

    background: aqiData
      ? `linear-gradient(
          180deg,
          ${getAQIDetails(aqiData.maxAqi).color}32,
          ${getAQIDetails(aqiData.maxAqi).color}00
        )`
      : mode === "dark"
      ? "rgba(255,255,255,0.06)"
      : "rgba(0,0,0,0.04)",

    border: "none",

    boxShadow: "none",

    animation: `${fadeIn} 0.6s ease both`,
    transition: "all 280ms cubic-bezier(0.4,0,0.2,1)",

    "&:hover": {
      transform: "translateY(-3px) scale(1.02)",
      boxShadow: "none",
    },

    "&:active": {
      transform: "translateY(-1px) scale(0.99)",
    },
  }}
>
  {/* Soft AQI Glow */}
  {aqiData && (
    <Box
      sx={{
        position: "absolute",
        inset: -20,
        background: `radial-gradient(circle at center,
          ${getAQIDetails(aqiData.maxAqi).color}33,
          transparent 65%
        )`,
        filter: "blur(24px)",
        opacity: 0.6,
        pointerEvents: "none",
      }}
    />
  )}

  {aqiLoading ? (
    <CircularProgress
      size={26}
      thickness={4.5}
      sx={{
        color: mode === "dark" ? "#e5e7eb" : "#111",
      }}
    />
  ) : aqiData && aqiData.maxAqi != null ? (
    <Box sx={{ lineHeight: 1.15, zIndex: 1 }}>
      <Typography
        variant="h5"
        sx={{
          fontWeight: 900,
          letterSpacing: -0.4,
          color: mode === "dark" ? "#fff" : "#111",
          textAlign: "center",
        }}
      >
        {aqiData.maxAqi}
      </Typography>

      <Typography
        variant="caption"
        sx={{
          display: "block",
          mt: 0.3,
          textTransform: "capitalize",
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: 0.3,
          color:
            mode === "dark"
              ? "rgba(255,255,255,0.7)"
              : "rgba(0,0,0,0.65)",
        }}
      >
        AQI • {getAQIDetails(aqiData.maxAqi).label}
      </Typography>
    </Box>
  ) : (
    <Typography
      variant="body2"
      sx={{
        fontWeight: 600,
        color: theme.palette.text.secondary,
        zIndex: 1,
      }}
    >
      AQI unavailable
    </Typography>
  )}
</Box>

</Box>

              <Button
                fullWidth
                startIcon={<SearchIcon />}
                onClick={() => navigate('/search')}
                sx={{
                  py: 1,
                  mb: 0,
                  borderRadius: 10,
                  fontSize: '1rem',
                  fontWeight: 700,
                  textTransform: "none",
                  width: '100%',
                  boxShadow: "none",
                  background: 
                    mode === "dark"
                      ? "linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.04))"
                      : "linear-gradient(135deg, rgba(0,0,0,0.05), rgba(0,0,0,0.02))",
                  backdropFilter: "blur(15px)",
                  border: `1.2px solid ${mode === "dark" ? "#35353562" : "#aeaeae49"}`,
                  color: mode === "dark" ? "#a2a2a2ff" : "#848484ff",
                  '&:hover': {
                    backgroundColor: theme.palette.mode === "light" ? "#e0e0e0" : "#3a3a3a4e",
                  },
                }}
              >
                Search Exploration
              </Button>

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
                    <CheckCircleOutlineIcon
                      sx={{ color: "#10b981" }}
                    />
                  ) : (
                    <WifiTetheringIcon
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
            <Box sx={{ display: "flex", flexGrow: 1 }}>
              {!isSmallScreen && <Sidebar />}
              <Container maxWidth="lg" sx={{ flexGrow: 1, pt: 1, position: "relative" }}>
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
                  <Grid container spacing={3} justifyContent={"center"}>
                    
                    {/* Trips Display card */}
                    <Grid item xs={12} md={6} lg={4} xl={2.4}>
                      {myTrips && myTrips.length > 0 ? (
                        <Box sx={{ minWidth: "86vw", px: 0 }}>
                          <Typography variant="h6" textAlign="left" mb={1} ml={1.4}>Your Trips</Typography>
                          <Slider {...sliderSettings} slickGoTo={sliderIndex} afterChange={setSliderIndex} >
                            {myTrips.map((tripInfo) => (
                              <Box key={tripInfo.id} sx={{ px: 0 }}>
                                <Card
                                  sx={{
                                    position: "relative",
                                    overflow: "hidden",
                                  
                                    background: tripGroupsMap[tripInfo.id]?.iconURL
                                      ? `url(${tripGroupsMap[tripInfo.id].iconURL})`
                                      : mode === "dark"
                                      ? "#17171791"
                                      : "#fff",
                                  
                                    backgroundSize: "cover",
                                    backgroundPosition: "center",
                                    backgroundRepeat: "no-repeat",
                                  
                                    color: "#fff",
                                    borderRadius: 4,
                                    boxShadow: "none",
                                    display: "flex",
                                    flexDirection: "column",
                                    justifyContent: "flex-end",
                                    mx: { xs: 1, lg: 0 },
                                    height: { xs: 260, lg: 320 },
                                    cursor: "pointer",
                                    p: 0,
                                  }}
                                  onClick={() => navigate(`/trips/${tripInfo.id}`)}
                                >
                                  {/* Progressive Blur Overlay */}
                                  <Box
                                    sx={{
                                      position: "absolute",
                                      inset: 0,
                                      pointerEvents: "none",
                                      zIndex: 1,
                                    
                                      backdropFilter: "blur(14px)",
                                      WebkitBackdropFilter: "blur(14px)",
                                    
                                      maskImage:
                                        "linear-gradient(to top, black 0%, black 30%, transparent 80%)",
                                      WebkitMaskImage:
                                        "linear-gradient(to top, black 0%, black 30%, transparent 80%)",
                                    }}
                                  />

                                  <CardContent
                                    sx={{
                                      position: "relative",
                                      zIndex: 2,
                                      background:"linear-gradient(to top, rgba(0, 0, 0, 0.37), rgba(0, 0, 0, 0.36), rgba(0, 0, 0, 0.27), rgba(0, 0, 0, 0))",
                                      borderBottomLeftRadius: 8,
                                      borderBottomRightRadius: 8,
                                    }}
                                  >
                                    <BlurEffect position="top" intensity={50} />
                                    <Box display="flex" gap={2} mb={1} alignItems="flex-start" justifyContent="space-between">
                                      <Box>
                                        <Typography variant="h6" sx={{ fontWeight: 800, mb: 0.5, color: "#ffffffff" }}>
                                          {tripInfo?.name || "Unnamed Trip"}
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: "#cbcbcb", display: "flex", alignItems: "center" }}>
                                          <LocationOn sx={{ fontSize: 16, mr: 1 }} />
                                          {tripInfo?.from || "Unknown"} → {tripInfo?.location || "Unknown"}
                                        </Typography>
                                        {(tripInfo?.startDate || tripInfo?.date) && (
                                          <Typography variant="body2" sx={{ color: "#cbcbcb", display: "flex", alignItems: "center" }}>
                                            <AccessTime sx={{ fontSize: 16, mr: 1 }} />
                                            {tripInfo?.startDate || "?"} → {tripInfo?.date || "?"}
                                          </Typography>
                                        )}
                                      </Box>
                                      {/* Member avatars as avatar group */}
                                      {tripMembersMap[tripInfo.id]?.length > 0 && (
                                        <AvatarGroup max={3} sx={{ mt: 1, width: 24, height: 24 }}>
                                          {tripMembersMap[tripInfo.id].map((m) => (
                                            <Tooltip title={m.name || `@${m.username}`} key={m.uid}>
                                              <Avatar
                                                sx={{
                                                  width: 24,
                                                  height: 24,
                                                }}
                                                src={m.photoURL || `https://api.dicebear.com/7.x/identicon/svg?seed=${m.uid}`}
                                                alt={m.name || m.username}
                                              />
                                            </Tooltip>
                                          ))}
                                        </AvatarGroup>
                                      )}
                                    </Box>
                                    {timelineStatsMap[tripInfo.id] && (
                                      <Box sx={{ mb: 1 }}>
                                        <Typography variant="caption" sx={{ color: "#cbcbcb" }}>
                                          Timeline Progress: {timelineStatsMap[tripInfo.id].completed} / {timelineStatsMap[tripInfo.id].total} complete
                                        </Typography>
                                        <LinearProgress
                                          value={timelineStatsMap[tripInfo.id].percent}
                                          variant="determinate"
                                          sx={{
                                            mt: 0.5,
                                            borderRadius: 20,
                                            height: 7,
                                            bgcolor: "#ffffff36",
                                            "& .MuiLinearProgress-bar": { bgcolor: "#ffffffff", borderRadius: 20 },
                                          }}
                                        />
                                      </Box>
                                    )}
                                  </CardContent>
                                </Card>
                              </Box>
                            ))}
                          </Slider>
                        </Box>
                      ) : (
                        <Typography variant="body2" sx={{ color: theme.palette.text.secondary, textAlign: "center", mt: 4 }}>
                          No trips found. Start planning!
                        </Typography>
                      )}
                    </Grid>

                                        {/* Reminders Glimpse Card */}
<Container maxWidth="lg" sx={{ mt: 6 }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: 2.5,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <AlarmOutlinedIcon
            sx={{
              fontSize: 22,
              color: theme.palette.text.primary,
            }}
          />
          <Typography variant="h6">
            Reminders
          </Typography>
        </Box>
      </Box>
  <Box
    sx={{
      position: "relative",
      borderRadius: 5,
      overflow: "hidden",
      background:
        mode === "dark"
          ? "linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))"
          : "linear-gradient(180deg, #ffffff, #f8fafc)",
      backdropFilter: "blur(10px)",
      border:
        mode === "dark"
          ? "1px solid rgba(255,255,255,0.08)"
          : "1px solid rgba(0,0,0,0.06)",
      boxShadow: "none",
    }}
  >
    <CardContent sx={{ p: 3 }}>
      {/* Header */}

      {/* Content */}
      {remindersLoading ? (
        <Typography color="text.secondary" fontSize={14}>
          Loading reminders…
        </Typography>
      ) : reminders.length === 0 ? (
        <Typography color="text.secondary" fontSize={14}>
          No reminders yet.
        </Typography>
      ) : (
        <Box sx={{ mb: 1.5 }}>
          {reminders
            .filter((rem) => !rem.completed)
            .slice(0, 1)
            .map((rem) => (
              <Box
                key={rem.id}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                  px: 2,
                  py: 1.25,
                  borderRadius: 4,
                  background:
                    mode === "dark"
                      ? "rgba(255,255,255,0.06)"
                      : "rgba(0,0,0,0.04)",
                  transition: "all 0.25s ease",
                  "&:hover": {
                    background:
                      mode === "dark"
                        ? "rgba(255,255,255,0.1)"
                        : "rgba(0,0,0,0.06)",
                  },
                }}
              >
                {/* Action Icon */}
                <Box
                  onClick={() =>
                    remindersRef.current?.markReminderComplete(rem.id)
                  }
                  sx={{
                    width: 36,
                    height: 36,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: "50%",
                    cursor: "pointer",
                    background:
                      mode === "dark"
                        ? "rgba(255,255,255,0.08)"
                        : "rgba(0,0,0,0.08)",
                    "&:hover": {
                      background:
                        mode === "dark"
                          ? "rgba(255,255,255,0.15)"
                          : "rgba(0,0,0,0.15)",
                    },
                  }}
                  title="Mark as completed"
                >
                  <NotificationsActiveIcon
                    sx={{
                      fontSize: 20,
                      color:
                        mode === "dark"
                          ? "#e5e7eb"
                          : theme.palette.text.primary,
                    }}
                  />
                </Box>

                {/* Text */}
                <Typography
                  sx={{
                    fontSize: 15,
                    fontWeight: 500,
                    lineHeight: 1.4,
                    flexGrow: 1,
                  }}
                >
                  {rem.text}
                </Typography>
              </Box>
            ))}
        </Box>
      )}

      {/* Footer */}
      <Button
        size="small"
        onClick={() => navigate("/reminders")}
        sx={{
          mt: 1,
          px: 1.5,
          py: 0.6,
          fontSize: 13,
          fontWeight: 600,
          textTransform: "none",
          borderRadius: 3,
          color: theme.palette.text.primary,
          background:
            mode === "dark"
              ? "rgba(36, 36, 36, 0.71)"
              : "rgba(211, 211, 211, 0.2)",
          "&:hover": {
            background:
              mode === "dark"
                ? "rgba(36, 36, 36, 1)"
                : "rgba(211, 211, 211, 1)",
          },
        }}
      >
        View All ({incompleteRemindersCount})
      </Button>
    </CardContent>
  </Box>
</Container>

                    
                    {/* Trips Suggestions Card (NEW SECTION) */}
{/* Trips Suggestions Carousel and List */}
<Grid item xs={12} sx={{ px: { xs: 1, md: 0 }, mt: 4, mb: 10 }}>
  <Typography variant="h6" textAlign="left" mb={3} sx={{ fontWeight: 700 }}>
    Trip Suggestions & Discovery
  </Typography>

  {allFlattenedPlaces.length > 0 ? (
    <>
      {/* Carousel for first 4 places */}
      {carouselPlaces.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" textAlign="left" mb={2} sx={{ fontWeight: 600 }}>
            Featured Places
          </Typography>
          <Slider {...carouselSettings}>
            {carouselPlaces.map((place, index) => (
              <Box key={index} sx={{ px: 0 }}>
                <PlaceCard place={place} mode={mode} navigate={navigate} mr={2} onPlanTrip={onPlanTrip} />
              </Box>
            ))}
          </Slider>
        </Box>
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
                <PlaceCard place={place} mode={mode} navigate={navigate} onPlanTrip={onPlanTrip} />
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
                        mb: 11,
                        alignContent: "center",
                        alignItems: "center",
                        textAlign: "center",
                        opacity: 0.5,
                        fontSize: "0.75rem",
                        userSelect: "none",
                      }}
                    >
                      <Typography variant="caption" fontWeight={800} color="text.secondary">
                        BunkMate v{packageJson.version || "N/A"} — Made with ❤️
                      </Typography>
                    </Box>
                  </Grid>
                )}
              </Container>
            </Box>
            {/* <Grid
              justifyContent={"right"}
              container
              sx={{
                position: "sticky",
                bottom: 90,
                right: 30,
                mr: 1.5
              }}
            >
              {isSmallScreen && (
                <Zoom in>
                  <Fab
                    color="primary"
                    aria-label="chat"
                    sx={{
                      zIndex: 999,
                      width: '70px',
                      height: '70px',
                      background: theme.palette.primary.bg,
                      color: theme.palette.primary.maintxt,
                      boxShadow: "none",
                      borderRadius: 5,
                      "&:hover": {
                        background: theme.palette.primary.bg,
                      },
                    }}
                    onClick={() => navigate("/chats")}
                  >
                    <ChatBubbleOutlineIcon />
                  </Fab>
                </Zoom>
              )}
            </Grid> */}


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
    <CloseOutlinedIcon fontSize="small" />
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
        </BetaAccessGuard>
      </DeviceGuard>
    </ThemeProvider>
  );
};

export default Home;