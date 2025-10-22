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

// ... (CATEGORY_ICONS constant remains the same)
const CATEGORY_ICONS = {
  Food: {
    icon: <RestaurantOutlinedIcon sx={{ fontSize: "large" }} />,
    listbgcolor: "#ff9c000f",   // orange[50]
    bgcolor: "#ff9c0030",   // orange[50]
    mcolor: "#ff98005e",    // orange[500]
    fcolor: "#e3aa8b"       // orange[900]
  },
  Tour: {
    icon: <TravelExploreOutlinedIcon sx={{ fontSize: "large" }} />,
    listbgcolor: "#0093ff0f",   // blue[50]
    bgcolor: "#0093ff30",   // blue[50]
    mcolor: "#2196f35e",    // blue[500]
    fcolor: "#92b6ef"       // blue[900]
  },
  Rent: {
    icon: <HomeOutlinedIcon sx={{ fontSize: "large" }} />,
    listbgcolor: "#88ff000f",   // lightGreen[50]
    bgcolor: "#88ff0030",   // lightGreen[50]
    mcolor: "#8bc34a5e",    // lightGreen[500]
    fcolor: "#8dc378"       // lightGreen[900]
  },
  Utilities: {
    icon: <LocalAtmOutlinedIcon sx={{ fontSize: "large" }} />,
    listbgcolor: "#8ad0ff0f",   // blueGrey[50]
    bgcolor: "#8ad0ff30",   // blueGrey[50]
    mcolor: "#607d8b5e",    // blueGrey[500]
    fcolor: "#8e9ba1"       // blueGrey[900]
  },
  Shopping: {
    icon: <LocalMallOutlinedIcon sx={{ fontSize: "large" }} />,
    listbgcolor: "#ff00550f",   // pink[50]
    bgcolor: "#ff005530",   // pink[50]
    mcolor: "#e91e635e",    // pink[500]
    fcolor: "#ffbce0"       // pink[900]
  },
  Fun: {
    icon: <EmojiEventsOutlinedIcon sx={{ fontSize: "large" }} />,
    listbgcolor: "#f5e7480f",   // yellow[50]
    bgcolor: "#f5e74830",   // yellow[50]
    mcolor: "#c3b6415e",    // yellow[500]
    fcolor: "#ddca15"       // yellow[900]
  },
  Hospital: {
    icon: <LocalHospitalOutlinedIcon sx={{ fontSize: "large" }} />,
    listbgcolor: "#ff00260f",   // red[50]
    bgcolor: "#ff002630",   // red[50]
    mcolor: "#f443365e",    // red[500]
    fcolor: "#efa4a4"       // red[900]
  },
  Education: {
    icon: <SchoolOutlinedIcon sx={{ fontSize: "large" }} />,
    listbgcolor: "#0093ff0f",   // blue[50]
    bgcolor: "#0093ff30",   // blue[50]
    mcolor: "#2196f35e",    // blue[500]
    fcolor: "#92b6ef"       // indigo[900]
  },
  Fuel: {
    icon: <LocalGasStationOutlinedIcon sx={{ fontSize: "large" }} />,
    listbgcolor: "#fbe9e70f",   // deepOrange[50]
    bgcolor: "#fbe9e730",   // deepOrange[50]
    mcolor: "#ff5722",      // deepOrange[500]
    fcolor: "#bf360c"       // deepOrange[900]
  },
  Entertainment: {
    icon: <MovieOutlinedIcon sx={{ fontSize: "large" }} />,
    listbgcolor: "#f3e5f50f",   // purple[50]
    bgcolor: "#f3e5f530",   // purple[50]
    mcolor: "#9c27b0",      // purple[500]
    fcolor: "#4a148c"       // purple[900]
  },
  Bills: {
    icon: <LocalAtmOutlinedIcon sx={{ fontSize: "large" }} />,
    listbgcolor: "#e0f2f10f",   // teal[50]
    bgcolor: "#e0f2f130",   // teal[50]
    mcolor: "#009688",      // teal[500]
    fcolor: "#004d40"       // teal[900]
  },
  Travel: {
    icon: <TravelExploreOutlinedIcon sx={{ fontSize: "large" }} />,
    listbgcolor: "#e1f5fe0f",   // lightBlue[50]
    bgcolor: "#e1f5fe",         // lightBlue[50]
    mcolor: "#03a9f4",          // lightBlue[500]
    fcolor: "#01579b"           // lightBlue[900]
  },
  Medical: {
    icon: <LocalHospitalOutlinedIcon sx={{ fontSize: "large" }} />,
    listbgcolor: "#fce4ec0f",   // pink[50]
    bgcolor: "#fce4ec",         // pink[50]
    mcolor: "#e91e63",          // pink[500]
    fcolor: "#880e4f"           // pink[900]
  },
  Other: {
    icon: <CategoryOutlinedIcon sx={{ fontSize: "large" }} />,
    listbgcolor: "#f5f5f50f",   // grey[50]
    bgcolor: "#f5f5f530",       // grey[100]
    mcolor: "#bdbdbd5e",        // grey[400]
    fcolor: "#a4a4a4"           // grey[900]
  }
};
// ... (rest of the constants remain the same)

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
        borderRadius: 4, 
        overflow: 'hidden',
        boxShadow: theme.shadows[4],
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
          />
          <Chip
            icon={<CalendarTodayOutlined />}
            label={`${place.season}`}
            size="small"
            variant="outlined"
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

  // --- START: Places Data Processing ---

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

  // --- END: Places Data Processing ---


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
    const fetchReminders = async () => {
      setRemindersLoading(true);
      try {
        const user = getUserFromStorage();
        if (!user || !user.uid) {
          setReminders([]);
          setRemindersLoading(false);
          return;
        }
        const q = query(
          collection(db, "reminders"),
          orderBy("createdAt", "desc")
        );
        const querySnapshot = await getDocs(q);
        const data = [];
        querySnapshot.forEach((doc) => {
          const reminder = { id: doc.id, ...doc.data() };
          if (reminder.uid && reminder.uid === user.uid) {
            data.push(reminder);
          }
        });
        setReminders(data);
      } catch (err) {
        setReminders([]);
      }
      setRemindersLoading(false);
    };
    fetchReminders();
  }, []);

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
              flexDirection: "column",
              backgroundColor: mode === "dark" ? "#0c0c0c" : "#f1f1f1",
              color: mode === "dark" ? "#fff" : "#000",
            }}
          >
            <AppBar position="fixed" elevation={0} sx={{ backgroundColor: "transparent", backdropFilter: "blur(10px)", boxShadow: "none" }}>
              <Toolbar sx={{ justifyContent: 'space-between', py: 1, px: 3, backgroundColor: 'transparent' }}>
                <Typography variant="h6" sx={{ userSelect: 'none', display: 'flex', alignItems: 'center', gap: 1, fontWeight: 'bold', color: mode === "dark" ? "#f1f1f1" : "#333" }}>
                  BunkMates
                  {userType && (
                    <Typography
                      variant="caption"
                      sx={{
                        backgroundColor: mode === "dark" ? "#f1f1f141" : "#4848484d",
                        color: mode === "dark" ? "#fff" : "#000",
                        px: 1.5,
                        py: 0.2,
                        borderRadius: 2.5,
                        fontWeight: 'bold',
                        fontSize: '0.7rem',
                      }}
                    >
                      {userType}
                    </Typography>
                  )}
                </Typography>
                  <ProfilePic />
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
                  mb: 4,
                  background: `linear-gradient(to top, rgba(0,0,0,0) 0%, #00000000 1%, ${theme.palette.primary.mainbg} 100%)`,
                  transition: "background 0.8s cubic-bezier(.4,2,.6,1)",
                }}
              >
                <Container
                  maxWidth="lg"
                  sx={{
                    pt: 5,
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
                      height: { xs: 60, md: 90 },
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
                      py: 12,
                      px: 1,
                      transition: "background 0.8s cubic-bezier(.4,2,.6,1)",
                      animation: `${fadeIn} 0.7s`,
                      zIndex: 3,
                      position: "relative",
                    }}
                  >
                    <Typography variant="h5" sx={{ color: "text.primary" }}>
                      {getGreeting()},<br /><Typography variant="title" style={{ fontWeight: "bold", fontSize: "1.8rem" }}>{userData.name || "user"}!</Typography>
                    </Typography>
                    {/* Weather Widget */}
<Box
  sx={{
    display: "flex",
    alignItems: "center",
    gap: 1.5,
    px: 2,
    py: 1,
    borderRadius: 5,
    background: mode === "dark" ? "#0c0c0c5a" : "#f1f1f19a",
    minWidth: 170,
    minHeight: 56,
    animation: `${fadeIn} 0.7s`,
  }}
>
  {weatherLoading ? (
    <CircularProgress size={24} color={theme.palette.background.primary} />
  ) : weather ? (
    <>
      {weatherIcons[weather.main] || weatherIcons.Default}
      <Box>
        <Typography variant="body1" sx={{ color: mode === "dark" ? "#fff" : "#000", fontWeight: 600 }}>
          {weather.temp}°C {weather.city && `in ${weather.city}`}
        </Typography>
        <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
          {weather.desc.charAt(0).toUpperCase() + weather.desc.slice(1)}
        </Typography>
      </Box>
    </>
  ) : (
    <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
      Weather unavailable
    </Typography>
  )}
</Box>

                  </Box>

<>
      <Card
        sx={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          px: 2,
          py: 1.5,
          borderRadius: 4,
          backdropFilter: "blur(10px)",
          backgroundImage: "none",
          backgroundColor: 'transparent',
          color: mode === "dark" ? "#f5f5f5" : "#111",
          boxShadow:'none',
          minWidth: 260,
          maxWidth: 520,
          gap: 2,
          transition: "all 280ms cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        {/* Ongoing Alerts (always visible) */}
<Box
  sx={{
    display: "flex",
    flexDirection: "row",
    gap: 1.5,
    alignItems: "center",
    flexWrap: "wrap",
  }}
>
  {liveAlerts.ongoing.map((t) => (
    <Box
      key={t.id}
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1,
        px: 1,
        py: 1,
        borderRadius: 8,
        backgroundColor:
          mode === "dark"
            ? "rgba(201, 201, 201, 0.09)"
            : "rgba(0,0,0,0.03)",
        transition: "all 200ms ease",
        "&:hover": {
          transform: "translateY(-2px)",
          backgroundColor:
            mode === "dark"
              ? "rgba(255,255,255,0.08)"
              : "rgba(0,0,0,0.06)",
        },
      }}
    >
      <Box
        sx={{
          position: "relative",
          display: "inline-flex",
          borderRadius: 8,
          p: 0.5,
          backgroundColor: mode === "dark" ? "#ff575718" : "#ff000030",
          "&::after": {
            content: '""',
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            borderRadius: 8,
            backgroundColor: mode === "dark" ? "#ff5757" : "#ff0000ff",
            opacity: 0.3,
            animation: "pulse 1.5s infinite",
          },
        }}
      >
        <WifiTetheringIcon
          sx={{
            fontSize: 22,
            color: mode === "dark" ? "#ff5757ff" : "#ff0000ff",
          }}
        />
      </Box>

      <Typography variant="body2" sx={{ fontWeight: 600 }}>
        {t.name}
      </Typography>
      <Typography variant="caption" sx={{ color: "text.secondary" }}>
        {t.from} - {t.to}
      </Typography>
      <Typography
        variant="caption"
        sx={{ color: "text.secondary", ml: "auto", mr: 1 }}
      >
        ongoing
      </Typography>
    </Box>
  ))}

  {/* Pulse keyframes */}
  <style>
    {`
      @keyframes pulse {
        0% { transform: scale(1); opacity: 0.3; }
        50% { transform: scale(1.4); opacity: 0; }
        100% { transform: scale(1); opacity: 0.3; }
      }
    `}
  </style>
</Box>


        {/* Upcoming Alerts Icons */}
        <Box sx={{ display: "flex", gap: 1 }}>
          {liveAlerts.upcoming.map((t) => (
            <IconButton
              key={t.id}
              onClick={() => setOpenUpcoming(true)}
              sx={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                backgroundColor:
                  mode === "dark"
                    ? "rgba(158,234,158,0.2)"
                    : "rgba(0,122,51,0.15)",
                "&:hover": {
                  backgroundColor:
                    mode === "dark"
                      ? "rgba(158,234,158,0.3)"
                      : "rgba(0,122,51,0.25)",
                },
                transition: "all 200ms ease",
              }}
            >
              <AccessTime
                sx={{
                  fontSize: 20,
                  color: mode === "dark" ? "#9eea9e" : "#007a33",
                }}
              />
            </IconButton>
          ))}
        </Box>
      </Card>

      {/* Upcoming Alerts Dialog */}
      <Dialog
        open={openUpcoming}
        onClose={() => setOpenUpcoming(false)}
        fullWidth
        maxWidth="xs"
        PaperProps={{
          sx: {
            borderRadius: 3,
            backdropFilter: "blur(12px)",
            backgroundColor:
              mode === "dark" ? "rgba(18,18,18,0.85)" : "rgba(255,255,255,0.9)",
          },
        }}
      >
        <DialogTitle>Upcoming Alerts</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          {liveAlerts.upcoming.map((t) => (
            <Box
              key={t.id}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                px: 1,
                py: 0.6,
                borderRadius: 2,
                backgroundColor:
                  mode === "dark"
                    ? "rgba(255,255,255,0.05)"
                    : "rgba(0,0,0,0.03)",
                transition: "all 200ms ease",
                "&:hover": {
                  transform: "translateX(4px)",
                  backgroundColor:
                    mode === "dark"
                      ? "rgba(158,234,158,0.2)"
                      : "rgba(0,122,51,0.1)",
                },
              }}
            >
              <AccessTime
                sx={{
                  fontSize: 18,
                  color: mode === "dark" ? "#9eea9e" : "#007a33",
                }}
              />
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {t.name}
              </Typography>
              <Typography variant="caption" sx={{ ml: "auto", color: "text.secondary" }}>
                {t.start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </Typography>
            </Box>
          ))}
        </DialogContent>
      </Dialog>
</>

                </Container>

              </Box>
            )}
            {/* Main Content */}
            <Box sx={{ display: "flex", flexGrow: 1 }}>
              {!isSmallScreen && <Sidebar />}
              <Container maxWidth="lg" sx={{ flexGrow: 1, pt: 2, position: "relative" }}>
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
                    <Grid item xs={12} md={6} lg={4}>
                      {myTrips && myTrips.length > 0 ? (
                        <Box sx={{ minWidth: "86vw", px: 0 }}>
                          <Typography variant="h6" textAlign="left" mb={1} ml={1.4}>Your Trips</Typography>
                          <Slider {...sliderSettings} slickGoTo={sliderIndex} afterChange={setSliderIndex} >
                            {myTrips.map((tripInfo) => (
                              <Box key={tripInfo.id} sx={{ px: 0 }}>
                                <Card
                                  sx={{
                                    background: tripGroupsMap[tripInfo.id]?.iconURL
                                      ? `url(${tripGroupsMap[tripInfo.id].iconURL})`
                                      : mode === "dark" ? "#1717175d" : "#fff",
                                    backgroundSize: "cover",
                                    backgroundPosition: "center",
                                    backgroundRepeat: "no-repeat",
                                    color: "#fff",
                                    borderRadius: 4,
                                    boxShadow: "none",
                                    display: "flex",
                                    flexDirection: "column",
                                    justifyContent: "flex-end",
                                    mx: 1,
                                  }}
                                  onClick={() => navigate(`/trips/${tripInfo.id}`)}
                                >
                                  <CardContent
                                    sx={{
                                      backgroundColor: mode === "dark" ? "#00000000" : "#ffffffa1",
                                      backdropFilter: "blur(12px)",
                                      borderBottomLeftRadius: 8,
                                      borderBottomRightRadius: 8,
                                    }}
                                  >
                                    <Box display="flex" gap={2} mb={1} alignItems="flex-start" justifyContent="space-between">
                                      <Box>
                                        <Typography variant="h6" sx={{ fontWeight: 800, mb: 0.5, color: mode === "dark" ? "#cbcbcb" : "#3d3d3d" }}>
                                          {tripInfo?.name || "Unnamed Trip"}
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: mode === "dark" ? "#cbcbcb" : "#3d3d3d", display: "flex", alignItems: "center" }}>
                                          <LocationOn sx={{ fontSize: 16, mr: 1 }} />
                                          {tripInfo?.from || "Unknown"} → {tripInfo?.location || "Unknown"}
                                        </Typography>
                                        {(tripInfo?.startDate || tripInfo?.date) && (
                                          <Typography variant="body2" sx={{ color: mode === "dark" ? "#cbcbcb" : "#3d3d3d", display: "flex", alignItems: "center" }}>
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
                                      <Box>
                                        <Typography variant="caption" sx={{ color: mode === "dark" ? "#cbcbcb" : "#3d3d3d" }}>
                                          Timeline Progress: {timelineStatsMap[tripInfo.id].completed} / {timelineStatsMap[tripInfo.id].total} complete
                                        </Typography>
                                        <LinearProgress
                                          value={timelineStatsMap[tripInfo.id].percent}
                                          variant="determinate"
                                          sx={{
                                            mt: 0.5,
                                            borderRadius: 20,
                                            height: 7,
                                            bgcolor: mode === "dark" ? "#ffffff36" : "#00000018",
                                            "& .MuiLinearProgress-bar": { bgcolor: mode === "dark" ? "#ffffff" : "#3d3d3dff", borderRadius: 20 },
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
                    
                    {/* Trips Suggestions Card (NEW SECTION) */}
                    <Grid item xs={12} md={6} lg={8} sx={{ minWidth: "100%", px: { xs: 3, md: 0 } }}>
                        <Typography variant="h6" textAlign="left" mb={1}>Trip Suggestions & Discovery</Typography>
                        
                        {placeSuggestions.length > 0 ? (
                            <Grid container spacing={2}>
                                {placeSuggestions.map((place) => (
                                    <Grid item xs={12} sm={6} md={6} lg={3} key={place.id}>
                                        <PlaceCard place={place} mode={mode} navigate={navigate} />
                                    </Grid>
                                ))}
                            </Grid>
                        ) : (
                            <Typography variant="body2" color="text.secondary">
                                No travel suggestions loaded from local data.
                            </Typography>
                        )}
                        <Box sx={{ mt: 2, textAlign: 'right' }}>
                            <Button 
                                variant="outlined" 
                                size="small"
                                endIcon={<ArrowForwardIosIcon />}
                                onClick={() => navigate("/search", { state: { tab: 'places' } })}
                            >
                                Discover All Places
                            </Button>
                        </Box>
                    </Grid>


                    {/* Reminders Glimpse Card */}
                    <Container maxWidth="lg" sx={{ mt: 2, mb: 2 }}>
                      <Box
                        sx={{
                          mb: 2,
                          background: mode === "dark" ? "#f1f1f111" : "#afafaf16",
                          color: theme.palette.text.primary,
                          boxShadow: "none",
                          borderRadius: 5,
                        }}
                      >
                        <CardContent>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              mb: 3,
                            }}
                          >
                            <Box sx={{ display: "flex", alignItems: "center" }}>
                              <AlarmOutlinedIcon sx={{ mr: 1 }} />
                              <Typography variant="h6">Reminders</Typography>
                            </Box>
                          </Box>

                          {remindersLoading ? (
                            <Typography color="text.secondary" fontSize={14}>
                              Loading...
                            </Typography>
                          ) : reminders.length === 0 ? (
                            <Typography color="text.secondary" fontSize={14}>
                              No reminders yet.
                            </Typography>
                          ) : (
                            <ul style={{ margin: 0, paddingLeft: 0 }}>
                              {reminders
                                .filter((rem) => !rem.completed)
                                .slice(0, 3)
                                .map((rem) => (
                                  <li
                                    key={rem.id}
                                    style={{
                                      fontSize: 16,
                                      backgroundColor: mode === "dark" ? "#f1f1f111" : "#ffffffff",
                                      borderRadius: 28,
                                      padding: 9,
                                      listStyle: "none",
                                      marginBottom: 7,
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 9,
                                    }}
                                  >
                                    <span
                                      style={{
                                        cursor: "pointer",
                                        marginRight: 8,
                                        marginLeft: 8,
                                        display: "flex",
                                        alignItems: "center",
                                      }}
                                      title="Mark as completed"
                                      // Note: remindersRef.current?.markReminderComplete(rem.id) requires a ref to the Reminders component
                                      // If the Reminders component is not mounted here, this function call will not work.
                                      // It is left as is to match the existing logic structure.
                                      onClick={() =>
                                        remindersRef.current?.markReminderComplete(rem.id)
                                      }
                                    >
                                      <NotificationsActiveIcon
                                        style={{ color: mode === "dark" ? "#aaa" : "#333", fontSize: 22 }}
                                      />
                                    </span>
                                    <span>{rem.text}</span>
                                  </li>
                                ))}
                            </ul>
                          )}

                          <Button
                            size="small"
                            sx={{
                              mt: 1,
                              background: mode === "dark" ? "#f1f1f111" : "#0c0c0c1a",
                              color: theme.palette.text.primary,
                              fontSize: 14,
                              padding: "4px 8px",
                              boxShadow: "none",
                              borderRadius: 3,
                            }}
                            onClick={() => navigate("/reminders")}
                          >
                            View All
                          </Button>
                        </CardContent>
                      </Box>
                    </Container>

                    <Box
                      sx={{
                        mb: 4,
                        alignContent: "center",
                        alignItems: "center",
                        textAlign: "center",
                        opacity: 0.5,
                        fontSize: "0.75rem",
                        userSelect: "none",
                      }}
                    >
                      <Typography variant="caption" color="text.secondary">
                        BunkMate v{packageJson.version || "N/A"} — Made with ❤️
                      </Typography>
                    </Box>
                  </Grid>
                )}
              </Container>
            </Box>
            <Grid
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
            </Grid>
          </Box>
        </BetaAccessGuard>
      </DeviceGuard>
    </ThemeProvider>
  );
};

export default Home;