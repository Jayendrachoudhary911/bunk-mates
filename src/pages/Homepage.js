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
} from "@mui/icons-material";
import ProfilePic from "../components/Profile";
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

const SESSION_KEY = "bunkmate_session";
const WEATHER_STORAGE_KEY = "bunkmate_weather";
const WEATHER_API_KEY = "c5298240cb3e71775b479a32329803ab"; // <-- Replace with your API key
const NOTIF_API_URL = "http://localhost:5000/notifications"; // Adjust if needed
const VAPID_PUBLIC_KEY_URL = "http://localhost:5000/vapid_public_key";
const SAVE_SUBSCRIPTION_URL = "http://localhost:5000/save_subscription";
const POLL_INTERVAL = 6000; // ms

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

const pickTip = keyframes`
  0% { transform: translateY(0) rotate(0deg); }
  40% { transform: translateY(-6px) rotate(-1deg); }
  70% { transform: translateY(-2px) rotate(0.4deg); }
  100% { transform: translateY(0) rotate(0deg); }
`;

// Helper component for Place Cards
const PlaceCard = ({ place, mode, navigate }) => {
  const theme = useTheme();
  return (
    <Card 
      sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        borderRadius: 6, 
        overflow: 'hidden',
        backgroundColor: mode === 'dark' ? '#101010c8' : '#ffffff',
        backgroundImage: "none",
        boxShadow: 'none',
        transition: "transform 0.2s ease, box-shadow 0.2s ease",
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: theme.shadows[8],
          cursor: 'pointer',
        }
      }}
      onClick={() => navigate("/search", { state: { initialSearch: place.name, openPlaceId: place.id } })}
    >
      <CardMedia
        component="img"
        height="140"
        image={place.images?.[0]}
        alt={place.name}
        sx={{ filter: mode === 'dark' ? 'brightness(0.8)' : 'none' }}
      />
      <CardContent sx={{ flexGrow: 1, pb: 1 }}>
        <Typography variant="h6" component="div" sx={{ fontWeight: 700, mb: 0.5, lineHeight: 1.2 }}>
          {place.name}
        </Typography>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
          <LocationOn fontSize="small" sx={{ color: theme.palette.text.secondary }} />
          <Typography variant="body2" color="text.secondary">
            {place.city}, {place.state}
          </Typography>
        </Stack>
        
        <Stack direction="row" spacing={1} flexWrap="wrap">
          <Chip
            icon={<WbSunnyOutlined />}
            label={`${place.weather.split(';')[0].trim()}`}
            size="small"
            variant="outlined"
            sx={{p:1}}
          />
          <Chip
            icon={<CalendarTodayOutlined />}
            label={`${place.season}`}
            size="small"
            variant="outlined"
            sx={{p:1}}
          />
        </Stack>
        
        <Typography variant="body2" sx={{ mt: 1, color: theme.palette.text.primary }} noWrap>
          {place.description}
        </Typography>
        
      </CardContent>
      <Box sx={{ p: 2, pt: 0 }}>
         <Button 
            size="small" 
            variant="contained" 
            fullWidth
            onClick={(e) => {
              e.stopPropagation();
              navigate("/trips", { state: { place } });
            }}
            sx={{ borderRadius: 3.5, px: 2, py: 1 }}
         >
          Plan Trip
         </Button>
      </Box>
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
  const [budgets, setBudgets] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [remindersLoading, setRemindersLoading] = useState(true);
  const [remindersDrawerOpen, setRemindersDrawerOpen] = useState(false);
  const remindersRef = useRef();

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

  setLiveAlerts({ upcoming, ongoing, reminders: rems });
}, [myTrips, reminders]);


useEffect(() => {
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

  const loadWeather = () => {
    const cached = localStorage.getItem(WEATHER_STORAGE_KEY);
    if (cached) {
      setWeather(JSON.parse(cached));
      setWeatherLoading(false);
      return;
    }

    setWeatherLoading(true);
    if (settings.locationMode === "auto") {
      if (!navigator.geolocation) {
        setWeatherLoading(false);
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const location = {
            mode: "auto",
            lat: latitude,
            lon: longitude,
          };
          fetchWeather(location);
        },
        () => setWeatherLoading(false),
        { timeout: 10000 }
      );
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
    }
  };

  loadWeather();
}, [settings.locationMode, settings.manualLocation]);


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
    flexDirection: "column",
    minHeight: "100vh",
    background: mode === "dark"
      ? "linear-gradient(180deg,#0c0c0c,#141414)"
      : "linear-gradient(180deg,#fafafa,#f3f3f3)",
    color: mode === "dark" ? "#fff" : "#000",
    overflowX: "hidden",
    transition: "background 0.6s ease",
  }}
>
  {/* TOP APPBAR */}
  <AppBar
    position="fixed"
    sx={{
      background: mode === "dark"
        ? "rgba(20,20,20,0.7)"
        : "rgba(255,255,255,0.75)",
      backdropFilter: "blur(12px)",
      borderBottom: mode === "dark"
        ? "1px solid rgba(255,255,255,0.07)"
        : "1px solid rgba(0,0,0,0.06)",
      boxShadow: "none",
      transition: "all 0.4s ease",
    }}
  >
    <Toolbar sx={{ justifyContent: "space-between", py: 1, px: 3 }}>
      <Typography
        variant="h6"
        sx={{
          display: "flex",
          alignItems: "center",
          fontWeight: 700,
          gap: 1,
          color: mode === "dark" ? "#f2f2f2" : "#1a1a1a",
        }}
      >
        BunkMates
        {userType && (
          <Typography
            variant="caption"
            sx={{
              px: 1.3,
              py: 0.2,
              borderRadius: 2,
              fontWeight: 600,
              background: mode === "dark"
                ? "rgba(255,255,255,0.08)"
                : "rgba(0,0,0,0.05)",
              color: mode === "dark" ? "#fafafa" : "#333",
            }}
          >
            {userType}
          </Typography>
        )}
      </Typography>
      <ProfilePic />
    </Toolbar>
  </AppBar>

  <Box sx={{ height: { xs: 60, sm: 85 } }} />

  {/* GREETING + WEATHER SECTION */}
  <Container
    maxWidth="lg"
    sx={{
      pt: 6,
      pb: 3,
      animation: "fadeInUp 0.6s ease",
      "@keyframes fadeInUp": {
        from: { opacity: 0, transform: "translateY(20px)" },
        to: { opacity: 1, transform: "translateY(0)" },
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
        p: 4,
        borderRadius: 4,
        background: mode === "dark"
          ? "rgba(255,255,255,0.04)"
          : "rgba(0,0,0,0.02)",
        backdropFilter: "blur(10px)",
        transition: "transform 0.3s ease",
        "&:hover": { transform: "scale(1.01)" },
      }}
    >
      <Typography variant="h5">
        {getGreeting()},
        <br />
        <Typography
          component="span"
          variant="h4"
          sx={{
            fontWeight: 700,
            display: "block",
            mt: 0.5,
          }}
        >
          {userData.name || "Traveler"}!
        </Typography>
      </Typography>

      {/* Weather Widget */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          px: 2.5,
          py: 1.3,
          borderRadius: 3,
          background: mode === "dark"
            ? "rgba(255,255,255,0.07)"
            : "rgba(0,0,0,0.04)",
          minWidth: 180,
          transition: "all 0.3s ease",
          "&:hover": {
            transform: "translateY(-2px)",
            background: mode === "dark"
              ? "rgba(255,255,255,0.1)"
              : "rgba(0,0,0,0.06)",
          },
        }}
      >
        {weatherLoading ? (
          <CircularProgress size={22} />
        ) : weather ? (
          <>
            {weatherIcons[weather.main] || weatherIcons.Default}
            <Box>
              <Typography fontWeight={600}>
                {weather.temp}°C
                <Typography
                  variant="caption"
                  sx={{ opacity: 0.7, ml: 0.5 }}
                  component="span"
                >
                  {weather.city}
                </Typography>
              </Typography>
              <Typography
                variant="caption"
                sx={{ opacity: 0.6, textTransform: "capitalize" }}
              >
                {weather.desc}
              </Typography>
            </Box>
          </>
        ) : (
          <Typography variant="caption">Weather unavailable</Typography>
        )}
      </Box>
    </Box>

    {/* ONGOING + UPCOMING ALERTS */}
    <Card
      sx={{
        mt: 4,
        px: 2.2,
        py: 1.8,
        borderRadius: 4,
        background: mode === "dark"
          ? "rgba(255,255,255,0.03)"
          : "rgba(0,0,0,0.02)",
        backdropFilter: "blur(12px)",
        transition: "transform 0.25s ease",
        "&:hover": { transform: "translateY(-2px)" },
      }}
    >
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.4 }}>
        {liveAlerts.ongoing.map((t) => (
          <Box
            key={t.id}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              px: 1.2,
              py: 0.8,
              borderRadius: 3,
              background: mode === "dark"
                ? "rgba(255,255,255,0.06)"
                : "rgba(0,0,0,0.04)",
              transition: "transform 0.25s ease",
              "&:hover": { transform: "scale(1.03)" },
            }}
          >
            <WifiTetheringIcon
              sx={{
                fontSize: 18,
                color: mode === "dark" ? "#ff6666" : "#e33",
              }}
            />
            <Typography variant="body2" fontWeight={600}>
              {t.name}
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.6 }}>
              {t.from} → {t.to}
            </Typography>
          </Box>
        ))}
      </Box>

      {/* Upcoming buttons */}
      <Box sx={{ display: "flex", gap: 1.2, mt: 1 }}>
        {liveAlerts.upcoming.map((t) => (
          <IconButton
            key={t.id}
            onClick={() => setOpenUpcoming(true)}
            sx={{
              width: 38,
              height: 38,
              borderRadius: "50%",
              background: mode === "dark"
                ? "rgba(150,255,150,0.08)"
                : "rgba(0,128,60,0.1)",
              transition: "transform 0.25s ease",
              "&:hover": { transform: "scale(1.08)" },
            }}
          >
            <AccessTime
              sx={{
                color: mode === "dark" ? "#9eea9e" : "#007a33",
                fontSize: 20,
              }}
            />
          </IconButton>
        ))}
      </Box>
    </Card>

    {/* UPCOMING DIALOG */}
    <Dialog
      open={openUpcoming}
      onClose={() => setOpenUpcoming(false)}
      fullWidth
      maxWidth="xs"
      PaperProps={{
        sx: {
          borderRadius: 3,
          backdropFilter: "blur(10px)",
          background: mode === "dark"
            ? "rgba(20,20,20,0.9)"
            : "rgba(255,255,255,0.95)",
        },
      }}
    >
      <DialogTitle sx={{ fontWeight: 600 }}>Upcoming Alerts</DialogTitle>
      <DialogContent>
        {liveAlerts.upcoming.length === 0 ? (
          <Typography variant="body2" sx={{ opacity: 0.6 }}>
            No upcoming trips
          </Typography>
        ) : (
          liveAlerts.upcoming.map((t) => (
            <Box
              key={t.id}
              sx={{
                display: "flex",
                alignItems: "center",
                p: 1,
                borderRadius: 2,
                mb: 1,
                background: mode === "dark"
                  ? "rgba(255,255,255,0.05)"
                  : "rgba(0,0,0,0.03)",
                transition: "transform 0.25s ease",
                "&:hover": { transform: "translateX(5px)" },
              }}
            >
              <AccessTime sx={{ mr: 1 }} />
              <Typography fontWeight={600}>{t.name}</Typography>
              <Typography
                variant="caption"
                sx={{ ml: "auto", opacity: 0.6 }}
              >
                {t.start.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Typography>
            </Box>
          ))
        )}
      </DialogContent>
    </Dialog>

    {/* TRIPS CARDS */}
    <Typography variant="h6" sx={{ mt: 5, mb: 2 }}>
      Your Trips
    </Typography>
    {myTrips && myTrips.length > 0 ? (
      <Slider {...sliderSettings}>
        {myTrips.map((tripInfo) => (
          <Card
            key={tripInfo.id}
            sx={{
              borderRadius: 4,
              overflow: "hidden",
              background: tripGroupsMap[tripInfo.id]?.iconURL
                ? `url(${tripGroupsMap[tripInfo.id].iconURL}) center/cover no-repeat`
                : mode === "dark"
                ? "rgba(255,255,255,0.03)"
                : "rgba(0,0,0,0.02)",
              color: mode === "dark" ? "#fafafa" : "#222",
              transition: "transform 0.3s ease",
              "&:hover": { transform: "translateY(-4px)" },
            }}
            onClick={() => navigate(`/trips/${tripInfo.id}`)}
          >
            <CardContent
              sx={{
                backdropFilter: "blur(12px)",
                background: mode === "dark"
                  ? "rgba(20,20,20,0.65)"
                  : "rgba(255,255,255,0.8)",
              }}
            >
              <Typography variant="h6" fontWeight={700}>
                {tripInfo.name}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>
                {tripInfo.from} → {tripInfo.location}
              </Typography>
            </CardContent>
          </Card>
        ))}
      </Slider>
    ) : (
      <Typography variant="body2" sx={{ opacity: 0.6 }}>
        No trips found.
      </Typography>
    )}

    {/* REMINDERS CARD */}
    <Box
      sx={{
        mt: 6,
        borderRadius: 4,
        p: 3,
        background: mode === "dark"
          ? "rgba(255,255,255,0.03)"
          : "rgba(0,0,0,0.02)",
        backdropFilter: "blur(10px)",
        transition: "transform 0.3s ease",
        "&:hover": { transform: "translateY(-2px)" },
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
        <AlarmOutlinedIcon sx={{ mr: 1 }} />
        <Typography variant="h6" fontWeight={600}>
          Reminders
        </Typography>
      </Box>

      {remindersLoading ? (
        <Typography variant="body2" sx={{ opacity: 0.6 }}>
          Loading...
        </Typography>
      ) : reminders.length === 0 ? (
        <Typography variant="body2" sx={{ opacity: 0.6 }}>
          No reminders yet.
        </Typography>
      ) : (
        reminders
          .filter((r) => !r.completed)
          .slice(0, 2)
          .map((rem) => (
            <Box
              key={rem.id}
              sx={{
                py: 1,
                px: 2,
                borderRadius: 3,
                mb: 1,
                background: mode === "dark"
                  ? "rgba(255,255,255,0.05)"
                  : "rgba(0,0,0,0.04)",
              }}
            >
              <Typography>{rem.text}</Typography>
            </Box>
          ))
      )}

      <Button
        variant="outlined"
        size="small"
        onClick={() => navigate("/reminders")}
        sx={{
          mt: 1,
          borderColor: mode === "dark" ? "#ffffff30" : "#00000030",
          color: mode === "dark" ? "#fafafa" : "#222",
          borderRadius: 3,
          textTransform: "none",
          "&:hover": { background: "transparent", opacity: 0.7 },
        }}
      >
        View All ({incompleteRemindersCount})
      </Button>
    </Box>

    {/* TRIP SUGGESTIONS */}
    <Typography variant="h6" sx={{ mt: 6, mb: 2 }}>
      Trip Suggestions
    </Typography>
    <Grid container spacing={2}>
      {placeSuggestions.map((p) => (
        <Grid item xs={12} sm={6} md={3} key={p.id}>
          <PlaceCard place={p} mode={mode} navigate={navigate} />
        </Grid>
      ))}
    </Grid>

    {/* FOOTER */}
    <Typography
      variant="caption"
      sx={{
        display: "block",
        mt: 6,
        textAlign: "center",
        opacity: 0.5,
      }}
    >
      BunkMate v{packageJson.version} — Made with ❤️
    </Typography>
  </Container>

  {/* FLOATING CHAT BUTTON */}
  {isSmallScreen && (
    <Zoom in>
      <Fab
        color="primary"
        sx={{
          position: "fixed",
          bottom: 80,
          right: 24,
          width: 65,
          height: 65,
          borderRadius: 4,
          background: mode === "dark"
            ? "rgba(255,255,255,0.07)"
            : "rgba(0,0,0,0.05)",
          backdropFilter: "blur(8px)",
          color: mode === "dark" ? "#fff" : "#000",
          transition: "transform 0.25s ease",
          "&:hover": { transform: "scale(1.06)" },
        }}
        onClick={() => navigate("/chats")}
      >
        <ChatBubbleOutlineIcon />
      </Fab>
    </Zoom>
  )}
</Box>


        </BetaAccessGuard>
      </DeviceGuard>
    </ThemeProvider>
  );
};

export default Home;