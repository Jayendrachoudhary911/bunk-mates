import React, { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { doc, getDoc, collection, query, where, getDocs, orderBy, onSnapshot } from "firebase/firestore";
import { auth, db } from "../firebase";
import { getAuth } from "firebase/auth";
import { useWeather } from "../contexts/WeatherContext";
import { Chats } from "./Chats"
import packageJson from '../../package.json'; 
import Slider from 'react-slick';
import "slick-carousel/slick/slick.css"; 
import "slick-carousel/slick/slick-theme.css";

import {
  AppBar,
  Toolbar,
  Typography,
  Container,
  Box,
  Grid,
  Card,
  CardContent,
  CardMedia,
  CircularProgress,
  ThemeProvider,
  createTheme,
  keyframes,
  Button,
  Chip,
  LinearProgress,
  Avatar,
  AvatarGroup,
  Tooltip,
} from "@mui/material"; 
import {
  LocationOn, AccessTime,
} from "@mui/icons-material";
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import { useTheme, useMediaQuery, Fab, Zoom } from "@mui/material";
import { weatherGradients, weatherColors, weatherbgColors, weatherIcons } from "../elements/weatherTheme";
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
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";

const CATEGORY_ICONS = {
  Food: {
    icon: <RestaurantOutlinedIcon sx={{ fontSize: "large" }} />,
    listbgcolor: "#ff9c000f",   // orange[50]
    bgcolor: "#ff9c0030",   // orange[50]
    mcolor: "#ff98005e",    // orange[500]
    fcolor: "#e3aa8b"     // orange[900]
  },
  Tour: {
    icon: <TravelExploreOutlinedIcon sx={{ fontSize: "large" }} />,
    listbgcolor: "#0093ff0f",   // blue[50]
    bgcolor: "#0093ff30",   // blue[50]
    mcolor: "#2196f35e",    // blue[500]
    fcolor: "#92b6ef"     // blue[900]
  },
  Rent: {
    icon: <HomeOutlinedIcon sx={{ fontSize: "large" }} />,
    listbgcolor: "#88ff000f",   // lightGreen[50]
    bgcolor: "#88ff0030",   // lightGreen[50]
    mcolor: "#8bc34a5e",    // lightGreen[500]
    fcolor: "#8dc378"     // lightGreen[900]
  },
  Utilities: {
    icon: <LocalAtmOutlinedIcon sx={{ fontSize: "large" }} />,
    listbgcolor: "#8ad0ff0f",   // blueGrey[50]
    bgcolor: "#8ad0ff30",   // blueGrey[50]
    mcolor: "#607d8b5e",    // blueGrey[500]
    fcolor: "#8e9ba1"     // blueGrey[900]
  },
  Shopping: {
    icon: <LocalMallOutlinedIcon sx={{ fontSize: "large" }} />,
    listbgcolor: "#ff00550f",   // pink[50]
    bgcolor: "#ff005530",   // pink[50]
    mcolor: "#e91e635e",    // pink[500]
    fcolor: "#ffbce0"     // pink[900]
  },
  Fun: {
    icon: <EmojiEventsOutlinedIcon sx={{ fontSize: "large" }} />,
    listbgcolor: "#f5e7480f",   // yellow[50]
    bgcolor: "#f5e74830",   // yellow[50]
    mcolor: "#c3b6415e",    // yellow[500]
    fcolor: "#ddca15"     // yellow[900]
  },
  Hospital: {
    icon: <LocalHospitalOutlinedIcon sx={{ fontSize: "large" }} />,
    listbgcolor: "#ff00260f",   // red[50]
    bgcolor: "#ff002630",   // red[50]
    mcolor: "#f443365e",    // red[500]
    fcolor: "#efa4a4"     // red[900]
  },
  Education: {
    icon: <SchoolOutlinedIcon sx={{ fontSize: "large" }} />,
    listbgcolor: "#0093ff0f",   // blue[50]
    bgcolor: "#0093ff30",   // blue[50]
    mcolor: "#2196f35e",    // blue[500]
    fcolor: "#92b6ef"      // indigo[900]
  },
  Fuel: {
    icon: <LocalGasStationOutlinedIcon sx={{ fontSize: "large" }} />,
    listbgcolor: "#fbe9e70f",   // deepOrange[50]
    bgcolor: "#fbe9e730",   // deepOrange[50]
    mcolor: "#ff5722",    // deepOrange[500]
    fcolor: "#bf360c"     // deepOrange[900]
  },
  Entertainment: {
    icon: <MovieOutlinedIcon sx={{ fontSize: "large" }} />,
    listbgcolor: "#f3e5f50f",   // purple[50]
    bgcolor: "#f3e5f530",   // purple[50]
    mcolor: "#9c27b0",    // purple[500]
    fcolor: "#4a148c"     // purple[900]
  },
  Bills: {
    icon: <LocalAtmOutlinedIcon sx={{ fontSize: "large" }} />,
    listbgcolor: "#e0f2f10f",   // teal[50]
    bgcolor: "#e0f2f130",   // teal[50]
    mcolor: "#009688",    // teal[500]
    fcolor: "#004d40"     // teal[900]
  },
  Travel: {
    icon: <TravelExploreOutlinedIcon sx={{ fontSize: "large" }} />,
    listbgcolor: "#e1f5fe0f",   // lightBlue[50]
    bgcolor: "#e1f5fe",   // lightBlue[50]
    mcolor: "#03a9f4",    // lightBlue[500]
    fcolor: "#01579b"     // lightBlue[900]
  },
  Medical: {
    icon: <LocalHospitalOutlinedIcon sx={{ fontSize: "large" }} />,
    listbgcolor: "#fce4ec0f",   // pink[50]
    bgcolor: "#fce4ec",   // pink[50]
    mcolor: "#e91e63",    // pink[500]
    fcolor: "#880e4f"     // pink[900]
  },
  Other: {
    icon: <CategoryOutlinedIcon sx={{ fontSize: "large" }} />,
    listbgcolor: "#f5f5f50f",   // grey[50]
    bgcolor: "#f5f5f530",   // grey[100]
    mcolor: "#bdbdbd5e",    // grey[400]
    fcolor: "#a4a4a4"     // grey[900]
  },
};

const WEATHER_API_KEY = "c5298240cb3e71775b479a32329803ab"; // <-- Replace with your API key


// Fade-in animation keyframes
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

// Custom dark theme based on your detailed colors
const theme = createTheme({
  palette: {
    mode: "dark",
    background: {
      default: "#02020200", // almost transparent black for main background
      paper: "#0c0c0c", // deep black for dialogs/paper
    },
    primary: {
      main: "#ffffffff", // bright green solid for buttons and accents
      contrastText: "#000000", // black text on bright green buttons
    },
    secondary: {
      main: "#444444ea", // dark grey with transparency for popups or secondary backgrounds
    },
    text: {
      primary: "#FFFFFF", // pure white for main text
      secondary: "#BDBDBD", // light grey for secondary text
      disabled: "#f0f0f0", // off-white for less prominent text or backgrounds
    },
    action: {
      hover: "#b6b6b6ff", // bright green hover for interactive elements
      selected: "#131313", // dark black for selected states
      disabledBackground: "rgba(0,155,89,0.16)", // dark green transparent backgrounds for outlines
      disabled: "#BDBDBD",
    },
    divider: "rgb(24, 24, 24)", // very dark grey for borders
  },
  typography: {
    fontFamily: "Roboto, Arial, sans-serif",
    h6: {
      fontWeight: "bold",
      color: "#FFFFFF",
    },
    body1: {
      fontSize: "1rem",
      lineHeight: "1.5",
      color: "#FFFFFF",
    },
    body2: {
      fontSize: "0.875rem",
      color: "#BDBDBD",
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: "#0c0c0c40",
          backdropFilter: "blur(40px)", // dark grey/black for app bar background
          boxShadow: "none",
          borderBottom: "1px solid rgb(24, 24, 24, 0.5)",
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: "#2c2c2c00", // dark grey card background
          color: "#FFFFFF",
          boxShadow: "none",
          borderRadius: 16,
          transition: "box-shadow 0.3s ease, transform 0.3s ease",
          cursor: "pointer",
          "&:hover": {
            transform: "translateY(-4px)",
            backgroundColor: "#131313",
          },
          animation: `${fadeIn} 0.6s ease forwards`,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          fontWeight: 600,
          borderRadius: "12px",
          transition: "background-color 0.3s ease, box-shadow 0.3s ease",
          color: "#000",
          backgroundColor: "#fff",
          "&:hover": {
            backgroundColor: "#000",
            color: "#fff",
          },
        },
      },
    },
    MuiAvatar: {
      styleOverrides: {
        root: {
          backgroundColor: "#f0f0f0", // off-white avatar background
          color: "#000",
        },
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: {
          backgroundColor: "#0c0c0c40", // deep black menu background
          color: "#FFFFFF",
          backdropFilter: "blur(40px)",
          borderRadius: 10,
          border: "1px solid rgb(24, 24, 24)",
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          "&:hover": {
            backgroundColor: "#2c2c2c", // translucent dark green hover
          },
        },
      },
    },
    MuiBox: {
      styleOverrides: {
        root: {
          // General box overrides if needed
        },
      },
    },
  },
});

const SESSION_KEY = "bunkmate_session";
const WEATHER_STORAGE_KEY = "bunkmate_weather";

function getGreeting() {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "Good Morning";
  if (hour >= 12 && hour < 17) return "Good Afternoon";
  if (hour >= 17 && hour < 21) return "Good Evening";
  return "Good Night";
}

function getUserFromStorage() {
  // Try localStorage first
  try {
    const storedUser = localStorage.getItem("bunkmateuser");
    if (storedUser) {
      const parsed = JSON.parse(storedUser);
      if (parsed?.uid) return parsed;
    }
    // Try cookies
    const cookieUser = document.cookie
      .split("; ")
      .find((row) => row.startsWith("bunkmateuser="))
      ?.split("=")[1];
    if (cookieUser) {
      const parsed = JSON.parse(decodeURIComponent(cookieUser));
      if (parsed?.uid) return parsed;
    }
  } catch {}
  return null;
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
  infinite: false,
  speed: 500,
  slidesToShow: 1,
  slidesToScroll: 1,
  swipeToSlide: true,
  adaptiveHeight: true,
  arrows: true,
};


const Home = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [notLoggedIn, setNotLoggedIn] = useState(false);
  const muiTheme = useTheme();
  const isSmallScreen = useMediaQuery(muiTheme.breakpoints.down("md"));
  const { weather, setWeather, weatherLoading, setWeatherLoading } = useWeather();
  const [budgets, setBudgets] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [remindersLoading, setRemindersLoading] = useState(true);
  const [remindersDrawerOpen, setRemindersDrawerOpen] = useState(false);
  const remindersRef = useRef();const [myTrips, setMyTrips] = useState([]); // All trips the user joined
  const [tripMembersMap, setTripMembersMap] = useState({}); // uid array for each tripID: array of user objects
  const [timelineStatsMap, setTimelineStatsMap] = useState({}); // timeline status per tripID
  const [sliderIndex, setSliderIndex] = useState(0);
  const [tripGroupsMap, setTripGroupsMap] = useState({});

  // User data states
  const [userData, setUserData] = useState({
    name: "",
    username: "",
    email: "",
    mobile: "",
    photoURL: "",
    bio: "",
  });

  const [userType, setUserType] = useState(""); // BETA or DEV BETA label

  
  const gotoBudgetMngr = () => {
    navigate("/budget-mngr");
  };

useEffect(() => {
    const user = getUserFromStorage();
    if (!user?.uid) {
      setReminders([]);
      setRemindersLoading(false);
      return;
    }
    setRemindersLoading(true);
    const q = query(
      collection(db, "reminders"),
      where("uid", "==", user.uid),
      orderBy("createdAt", "desc")
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = [];
      snapshot.forEach(doc => data.push({ id: doc.id, ...doc.data() }));
      setReminders(data);
      setRemindersLoading(false);
    }, () => {
      setReminders([]);
      setRemindersLoading(false);
    });
    return () => unsubscribe();
  }, []);

     // Fetch reminders for Home page glimpse
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
        // Fetch ALL reminders, then filter by uid (for full safety)
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
  // Try to load weather from localStorage/cookie first
  let cachedWeather = null;
  try {
    const local = localStorage.getItem(WEATHER_STORAGE_KEY);
    if (local) cachedWeather = JSON.parse(local);
    if (!cachedWeather) {
      const cookieWeather = document.cookie
        .split("; ")
        .find((row) => row.startsWith(WEATHER_STORAGE_KEY + "="))
        ?.split("=")[1];
      if (cookieWeather) cachedWeather = JSON.parse(decodeURIComponent(cookieWeather));
    }
  } catch {}
  if (cachedWeather) {
    setWeather(cachedWeather);
    setWeatherLoading(false);
  }

  if (!navigator.geolocation) {
    setWeatherLoading(false);
    return;
  }
  navigator.geolocation.getCurrentPosition(
    async (position) => {
      try {
        const { latitude, longitude } = position.coords;
        const res = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${WEATHER_API_KEY}&units=metric`
        );
        const data = await res.json();
        const weatherObj = {
          main: data.weather?.[0]?.main || "Default",
          desc: data.weather?.[0]?.description || "",
          temp: Math.round(data.main?.temp),
          city: data.name
        };
        setWeather(weatherObj);
        // Save to localStorage and cookie for sync/offline
        localStorage.setItem(WEATHER_STORAGE_KEY, JSON.stringify(weatherObj));
        document.cookie = `${WEATHER_STORAGE_KEY}=${encodeURIComponent(JSON.stringify(weatherObj))}; path=/; max-age=1800`; // 30 min
      } catch {
        setWeather(null);
      }
      setWeatherLoading(false);
    },
    () => setWeatherLoading(false),
    { timeout: 10000 }
  );
}, [setWeather, setWeatherLoading]);

  useEffect(() => {
    // Try to get userId from localStorage/cookie (like Budget.js)
    let userId = null;
    try {
      const storedUser = localStorage.getItem("bunkmateuser");
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        if (parsed?.uid) userId = parsed.uid;
      }
      if (!userId) {
        // Try cookie
        const cookieUser = document.cookie
          .split("; ")
          .find((row) => row.startsWith("bunkmateuser="))
          ?.split("=")[1];
        if (cookieUser) {
          const parsed = JSON.parse(decodeURIComponent(cookieUser));
          if (parsed?.uid) userId = parsed.uid;
        }
      }
    } catch {}
    if (!userId) {
      setBudgets([]);
      return;
    }

        import("../firebase").then(({ db }) => {
      import("firebase/firestore").then(({ doc, getDoc }) => {
        const docRef = doc(db, "budgets", userId);
        getDoc(docRef).then((docSnap) => {
          if (docSnap.exists()) {
            setBudgets(docSnap.data().items || []);
          } else {
            setBudgets([]);
          }
        });
      });
    });
  }, []);

    const sortedBudgets = useMemo(() => {
    return [...budgets].sort((a, b) => {
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bTime - aTime;
    });
  }, [budgets]);

    useEffect(() => {
    if (!navigator.geolocation) {
      setWeatherLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const res = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${WEATHER_API_KEY}&units=metric`
          );
          const data = await res.json();
          setWeather({
            main: data.weather?.[0]?.main || "Default",
            desc: data.weather?.[0]?.description || "",
            temp: Math.round(data.main?.temp),
            city: data.name
          });
        } catch {
          setWeather(null);
        }
        setWeatherLoading(false);
      },
      () => setWeatherLoading(false),
      { timeout: 10000 }
    );
  }, []);

  
useEffect(() => {
  const user = getUserFromStorage();
  if (!user || !user.uid) {
    setMyTrips([]);
    setTripMembersMap({});
    setTimelineStatsMap({});
    return;
  }

  // Listen to trips where user is a member
  const tripsQuery = query(
    collection(db, "trips"),
    where("members", "array-contains", user.uid)
  );

  // Subscribe to real-time updates on trips
  const unsubscribeTrips = onSnapshot(tripsQuery, (querySnapshot) => {
    const tripsList = [];
    querySnapshot.forEach((doc) => {
      tripsList.push({ id: doc.id, ...doc.data() });
    });
    setMyTrips(tripsList);

    // For every trip, set up listeners for members and timeline
    // Because tripsList changes on every snapshot, clean up listeners safely:
    
    // Store unsubscribes so we can remove old listeners
    let memberUnsubs = [];
    let timelineUnsubs = [];

    // Members fetch with real-time updates
    tripsList.forEach((trip) => {
      if (trip.members && Array.isArray(trip.members)) {
        // For simplicity, we fetch all member docs once (not real-time per member here)
        // For full real-time, you'd setup onSnapshot per member, but this is costly.
        Promise.all(
          trip.members.map((uid) =>
            getDoc(doc(db, "users", uid)).then((d) =>
              d.exists() ? { uid: d.id, ...(d.data() || {}) } : null
            )
          )
        ).then((membersData) => {
          setTripMembersMap((prev) => ({
            ...prev,
            [trip.id]: membersData.filter(Boolean),
          }));
        });
      }
    });

    // Timeline listeners per trip
    // Unsubscribe from previous listeners to avoid leak. (Use refs or strong closure here)
    let timelineUnsubFunctions = [];
    timelineUnsubs.forEach((unsub) => unsub && unsub());
    timelineUnsubs = tripsList.map((trip) => {
      const timelineCol = collection(db, "trips", trip.id, "timeline");
      const unsub = onSnapshot(timelineCol, (snap) => {
        const events = snap.docs.map((d) => d.data());
        const total = events.length || 1;
        const completed = events.filter((e) => e.completed === true).length;
        setTimelineStatsMap((prev) => ({
          ...prev,
          [trip.id]: {
            completed,
            total,
            percent: Math.round((completed / total) * 100),
          },
        }));
      });
      timelineUnsubFunctions.push(unsub);
      return unsub;
    });

    // Cleanup timeline listeners when trips update
    return () => {
      timelineUnsubFunctions.forEach((unsub) => unsub && unsub());
    };
  });

  return () => {
    unsubscribeTrips();
  };
}, []);

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
    async function fetchGroupsForTrips() {
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
    }
    fetchGroupsForTrips();
  }, [myTrips]);


  // Pick gradient based on weather
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
  
  useEffect(() => {
    const session = localStorage.getItem(SESSION_KEY) || document.cookie.split('; ').find(row => row.startsWith(SESSION_KEY + '='))?.split('=')[1];
    if (!session) {
      setLoading(true);
      // No session, check for user in localStorage
      const storedUser = localStorage.getItem("bunkmateuser");
      if (!storedUser) {
        setNotLoggedIn(true); // Instead of redirect
        setLoading(false);
        return;
      }
    } else {
      setLoading(false);
    }
  }, [navigate]);

  // Save session on successful login/fetch
  useEffect(() => {
    if (userData && userData.email) {
      localStorage.setItem(SESSION_KEY, "active");
      document.cookie = `${SESSION_KEY}=active; path=/; max-age=604800`; // 7 days
    }
  }, [userData]);

    // Add loading state to budgets fetch
useEffect(() => {
    const user = getUserFromStorage();
    if (!user?.uid) {
      setBudgets([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const budgetsDocRef = doc(db, "budgets", user.uid);
    const unsubscribe = onSnapshot(budgetsDocRef, (docSnap) => {
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
    return () => unsubscribe();
  }, []);

  // --------- User Data Load ---------
  useEffect(() => {
    async function fetchUserData() {
      setLoading(true);
      let uid = auth.currentUser?.uid || null;

      if (!uid) {
        const storedUser = localStorage.getItem("bunkmateuser");
        if (storedUser) {
          try {
            const parsed = JSON.parse(storedUser);
            if (parsed?.uid) uid = parsed.uid;
          } catch {}
        }
        if (!uid) {
          const cookieUser = document.cookie.split("; ")
            .find(row => row.startsWith("bunkmateuser="))
            ?.split("=")[1];
          if (cookieUser) {
            try {
              const parsed = JSON.parse(decodeURIComponent(cookieUser));
              if (parsed?.uid) uid = parsed.uid;
            } catch {}
          }
        }
      }

      if (!uid) {
        setNotLoggedIn(true);
        setLoading(false);
        return;
      }

      try {
        const docRef = doc(db, "users", uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          const newUserData = {
            name: data.displayName || data.name || "User",
            email: data.email || "",
            mobile: data.phoneNumber || data.mobile || "Not provided",
            photoURL: data.photoURL || "",
            bio: data.userBio || data.bio || "",
            uid
          };
          setUserData(newUserData);
          setUserType(data.type || "");
          localStorage.setItem("bunkmateuser", JSON.stringify(newUserData));
          localStorage.setItem(SESSION_KEY, "active");
          document.cookie = `${SESSION_KEY}=active; path=/; max-age=604800`;
          setNotLoggedIn(false);
        } else {
          setNotLoggedIn(true);
        }
      } catch {
        setNotLoggedIn(true);
      }
      setLoading(false);
    }
    if (!userData.email || !userData.uid) fetchUserData();
  }, [userData.email, userData.uid]);

  // --------- Slider index setup ---------
  useEffect(() => {
    if (myTrips && myTrips.length > 0) {
      setSliderIndex(getDefaultTripIndex(myTrips));
    }
  }, [myTrips]);


  const handleLogout = () => {
    localStorage.removeItem(SESSION_KEY);
    document.cookie = `${SESSION_KEY}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;`;
    localStorage.removeItem("bunkmateuser");
    navigate("/login");
  };


  return (
    <ThemeProvider theme={theme}>
      <DeviceGuard>
              <BetaAccessGuard>
      <Box
        sx={{
          display: "flex",
          minHeight: "100vh",
          flexDirection: "column",
        }}
      >
        
        {/* AppBar */}
        <AppBar position="fixed" elevation={0} backgroundColor="transparent">
          <Toolbar sx={{ justifyContent: 'space-between', py: 1, px: 3, backgroundColor: 'transparent' }}>
            <Typography variant="h6" sx={{ userSelect: 'none', display: 'flex', alignItems: 'center', gap: 1 }}>
              BunkMate 🏖️
              {userType && (
                <Typography
                  variant="caption"
                  sx={{
                    backgroundColor: '#f1f1f131',
                    color: '#fff',
                    px: 1.5,
                    py: 0.5,
                    borderRadius: 0.5,
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

<Box sx={{ height: { xs: 86, sm: 77 } }} />
                {loading ? (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: "60vh",
              zIndex: 1500
            }}
          >
            <CircularProgress color="white" />
          </Box>
        ) : notLoggedIn ? (
          <Box sx={{ p: 6, textAlign: "center" }}>
            <Typography variant="h5" color="text.secondary">
              Please log in to use BunkMate.
            </Typography>
          </Box>
        ) : (
        <Box
          sx={{
            width: "100%",
            position: "relative",
            zIndex: 1,
            mb: 4,
            borderTopLeftRadius: "2.5rem",
            borderTopRightRadius: "2.5rem",
            background: weatherBg,
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
              // Add blend/fade effect at the bottom of the container
              "&:after": {
                content: '""',
                display: "block",
                position: "absolute",
                left: 0,
                right: 0,
                bottom: 0,
                height: { xs: 60, md: 90 },
                background: `linear-gradient(to bottom, rgba(0,0,0,0) 0%, ${theme.palette.background.default} 100%)`,
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
                p: 3,
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
                  borderRadius: 2,
                  background: "#222c",
                  minWidth: 170,
                  minHeight: 56,
                  animation: `${fadeIn} 0.7s`,
                }}
              >
                {weatherLoading ? (
                  <CircularProgress size={24} color="white" />
                ) : weather ? (
                  <>
                    {weatherIcons[weather.main] || weatherIcons.Default}
                    <Box>
                      <Typography variant="body1" sx={{ color: "#fff", fontWeight: 600 }}>
                        {weather.temp}°C {weather.city && `in ${weather.city}`}
                      </Typography>
                      <Typography variant="body2" sx={{ color: "#BDBDBD" }}>
                        {weather.desc.charAt(0).toUpperCase() + weather.desc.slice(1)}
                      </Typography>
                    </Box>
                  </>
                ) : (
                  <Typography variant="body2" sx={{ color: "#BDBDBD" }}>
                    Weather unavailable
                  </Typography>
                )}
              </Box>
            </Box>
          </Container>

        <Container maxWidth="lg" sx={{ mb: 3, padding: 0 }}>
          <Grid
            container
            spacing={1.2}
            justifyContent="center"
            alignItems="stretch"
          >
            {[
              {
                label: "Add Notes",
                icon: <StickyNote2OutlinedIcon />,
                onClick: () => navigate("/notes"),
              },
              {
                label: "Reminder",
                icon: <AlarmOutlinedIcon />,
                onClick: () => setRemindersDrawerOpen(true),
              },
              {
                label: "Trip",
                icon: <ExploreOutlinedIcon />,
                onClick: () => navigate("/trips"),
              },
              {
                label: "Budget",
                icon: <AccountBalanceWalletOutlinedIcon />,
                onClick: () => navigate("/budget-mngr"),
              },
            ].map((tile) => (
              <Grid
                item
                xs={3}
                sm={3}
                md={3}
                lg={3}
                key={tile.label}
                sx={{ display: "flex" }}
              >
                <Card
                  sx={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    minHeight: 105,
                    width: "21vw",
                    aspectRatio: "1 / 1",
                    cursor: "pointer",
                    background: "#f1f1f111",
                    backdropFilter: "blur(80px)",
                    boxShadow: "none",
                    "&:hover": { background: "#232526" },
                    transition: "background 0.2s",
                  }}
                  onClick={tile.onClick}
                >
                  <Box sx={{ mb: 1, fontSize: 34, px: 1.5, py: 0.5, borderRadius: 4, backgroundColor: WeatherBgdrop, color: buttonWeatherBg }}>
                    {tile.icon}
                  </Box>
                  <Typography
                    variant="subtitle6"
                    sx={{ color: "text.primary", fontSize: "10.5px" }}
                  >
                    {tile.label}
                  </Typography>
                </Card>
              </Grid>
            ))}
          </Grid>
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
                <CircularProgress color="white" />
              </Box>
            ) : (
    <Grid container spacing={3} justifyContent={"center"}>

{/* Trips Display card */}
{myTrips && myTrips.length > 0 ? (
  <Box sx={{ minWidth: 340, maxWidth: 340, mx: "auto", px: 0 }}>
<Typography variant="h6" textAlign="left" mb={1}>Your Trips</Typography>

    <Slider {...sliderSettings} slickGoTo={sliderIndex}>
      {myTrips.map((tripInfo) => (
<Box key={tripInfo.id} sx={{ px: 1 }}>
  <Card
    sx={{
      background: tripGroupsMap[tripInfo.id]?.iconURL
        ? `url(${tripGroupsMap[tripInfo.id].iconURL})`
        : "#232526",
      backgroundSize: "cover",
      backgroundPosition: "center",
      backgroundRepeat: "no-repeat",
      color: "#fff",
      borderRadius: 1,
      boxShadow: "0 2px 10px #0002",
      display: "flex",
      flexDirection: "column",
      justifyContent: "flex-end",
      mx: 1,
    }}
  >
    <CardContent
      sx={{
        backdropFilter: "blur(12px)",
        borderBottomLeftRadius: 8,
        borderBottomRightRadius: 8,
      }}
    >
      <Box display="flex" gap={2} mb={1} alignItems="flex-start" justifyContent="space-between">
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 800, mb: 0.5 }}>
            {tripInfo?.name || "Unnamed Trip"}
          </Typography>
          <Typography variant="body2" sx={{ color: "#fff", display: "flex", alignItems: "center" }}>
            <LocationOn sx={{ fontSize: 16, mr: 1 }} />
            {tripInfo?.from || "Unknown"} → {tripInfo?.location || "Unknown"}
          </Typography>
          {(tripInfo?.startDate || tripInfo?.date) && (
            <Typography variant="body2" sx={{ color: "#e7e7e7", display: "flex", alignItems: "center" }}>
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
              "& .MuiLinearProgress-bar": { bgcolor: "#ffffffff" },
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
  <Typography variant="body2" sx={{ color: "#BDBDBD", textAlign: "center", mt: 4 }}>
    No trips found.
  </Typography>
)}


      {/* Budgets Display Card */}
<Grid item xs={12} md={6} lg={4}>
  <Box sx={{ minWidth: 356, maxWidth: 356 }} >
    <CardContent>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
        <Typography variant="h6" sx={{ color: "text.primary" }}>
          Your Budgets
        </Typography>
        {budgets.length > 0 && (
          <Box
            component="button"
            onClick={() => navigate("/budget-mngr")}
            sx={{
              display: "flex",
              alignItems: "center",
              background: "none",
              border: "none",
              color: buttonWeatherBg,
              fontWeight: 600,
              fontSize: 14,
              cursor: "pointer",
              px: 1,
              py: 0.5,
              borderRadius: 1,
              transition: "background 0.2s",
              "&:hover": {
                background: "#232526",
              },
            }}
          >
            View More <ChevronRightIcon />
          </Box>
        )}
      </Box>
      {budgets.length > 0 ? (
        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            gap: 1,
            overflowX: "auto",
            maxWidth: "100%",
            px: 1,
            py: 0.5,
            scrollbarWidth: "none",
            "&::-webkit-scrollbar": {
              display: "none",
              height: 6,
            },
            "&::-webkit-scrollbar-thumb": {
              display: "none",
              borderRadius: 4,
            },
          }}
        >
{sortedBudgets.slice(0, 5).map((b, idx) => {
  // Match Budget.js logic for category and icon
  const category =
    b.category || (Array.isArray(b.items) && b.items[0]?.category) || "Other";
  const cat = CATEGORY_ICONS[category] || CATEGORY_ICONS.Other;

  // Budget name: Prefer b.name, fallback to b.title, fallback to first item name, fallback to "Untitled"
  const budgetName =
    b.name || b.title || (Array.isArray(b.items) && b.items[0]?.name) || "Untitled";

  // Total budgeted amount (Budget.js: item.amount)
  const totalBudget = Number(b.amount || b.total || 0);

  // Expenses array (Budget.js: item.expenses)
  const expenses = Array.isArray(b.expenses)
    ? b.expenses
    : Array.isArray(b.items)
      ? b.items.flatMap(i => i.expenses || [])
      : [];

  // Current spent amount: sum of all expense amounts (Budget.js: totalExpense)
  const totalExpense = expenses.reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0);

  // Current budget left (Budget.js: balance)
  const balance = totalBudget - totalExpense;

  // Contributors: Budget.js usually has a contributors array or users array
  const contributors = Array.isArray(b.contributors)
    ? b.contributors
    : Array.isArray(b.users)
      ? b.users
      : [];

  const budgetIndex = sortedBudgets.findIndex(budget => budget === b);

  return (
    <Box
      key={b.id || b.name || idx}
      sx={{
        background: cat.listbgcolor,
        borderRadius: 2,
        px: 1,
        py: 1,
        minWidth: 120,
        maxWidth: 180,
        fontSize: 13,
        color: "#fff",
        textAlign: "left",
        boxShadow: "0 1px 4px #0003",
        flex: "0 0 auto",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "flex-start",
        cursor: "pointer",
        transition: "box-shadow 0.2s",
        "&:hover": {
          boxShadow: "0 4px 16px #0006",
        },
      }}
      onClick={() => navigate(`/budget-mngr?index=${budgetIndex}&expdrawer=true`)}
    >
      <Box sx={{ display: "flex", alignItems: "center", mb: 0 }}>
        <Box
          sx={{
            background: cat.mcolor,
            borderRadius: "50%",
            width: 36,
            height: 36,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            mr: 1,
          }}
        >
          {React.cloneElement(
            cat.icon,
            { sx: { fontSize: 22, color: cat.fcolor } }
          )}
        </Box>
        <Box>
          <Box display={"flex"} flexDirection={"row"} justifyContent={"space-between"} alignItems="center" gap={1}>
            <Typography style={{ fontSize: 15 }}>
              {budgetName}
            </Typography>
            <Typography variant="caption" style={{ backgroundColor: "#f1f1f111", color: "#aaa", padding: "1px 6px", borderRadius: "20px", mt: 0, fontWeight: "bolder" }}>
              {contributors.length > 0
                ? `${contributors.length}`
                : "0"}
            </Typography>
          </Box>
          <div style={{ color: cat.fcolor, fontWeight: 600 }}>
            ₹{balance.toFixed(2)}
            {totalBudget > 0 && (
              <span style={{ color: "#BDBDBD", fontWeight: 400, fontSize: 12, marginLeft: 4 }}>
                / ₹{totalBudget}
              </span>
            )}
          </div>
        </Box>
      </Box>
    </Box>
  );
})}

          {budgets.length > 5 && (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                px: 2,
                color: "#BDBDBD",
                fontSize: 13,
                fontWeight: 500,
                minWidth: 60,
              }}
            >
              +{budgets.length - 5} more...
            </Box>
          )}
        </Box>
      ) : (
        <Typography variant="body2" sx={{ color: "#BDBDBD" }}>
          No budgets found.
        </Typography>
      )}
    </CardContent>
  </Box>
</Grid>

        {/* Reminders Glimpse Card */}
        <Container maxWidth="lg" sx={{ mt: 2, mb: 2 }}>
          <Box sx={{ mb: 2, background: "#f1f1f111", color: "#fff", boxShadow: "none", borderRadius: 2 }}>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" , mb: 3 }}>
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <AlarmOutlinedIcon sx={{ mr: 1 }} />
                  <Typography variant="h6">Reminders</Typography>
                </Box>

                <Button
                  size="small"
                  sx={{ height: 30, minWidth: 30, borderRadius: "80px", backgroundColor: WeatherBgdrop, color: buttonWeatherBg, fontSize: 24, padding: "4px 6px", boxShadow: "none" }}
                  onClick={() => {
                      remindersRef.current?.openAddReminderDrawer();
                  }}
                >
                  +
                </Button>
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
                    .filter(rem => !rem.completed)
                    .slice(0, 3)
                    .map((rem) => (
                      <li
                        key={rem.id}
                        style={{
                          fontSize: 16,
                          backgroundColor: "#f1f1f111",
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
                          style={{ cursor: "pointer", marginRight: 8, marginLeft: 8, display: "flex", alignItems: "center" }}
                          title="Mark as completed"
                          onClick={() => remindersRef.current?.markReminderComplete(rem.id)}
                        >
                          <NotificationsActiveIcon style={{ color: "#aaa", fontSize: 22 }} />
                        </span>
                        <span>{rem.text}</span>
                      </li>
                    ))}
                </ul>
              )}
              <Button
                size="small"
                sx={{ mt: 1, background: WeatherBgdrop, color: buttonWeatherBg, fontSize: 14, padding: "4px 8px", boxShadow: "none" }}
                onClick={() => setRemindersDrawerOpen(true)}
              >
                View All
              </Button>
            </CardContent>
          </Box>
        </Container>



        <Reminders
          ref={remindersRef}
          open={remindersDrawerOpen}
          onClose={() => setRemindersDrawerOpen(false)}
          asDrawer
        />

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
    bottom: 20,
    right: 20,
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
            borderRadius: 1.5,
            background: buttonWeatherBg,
            color: "#000",
            "&:hover": {
              background: buttonWeatherBg,
            },
          }}
          onClick={() => navigate("/chats")} // Or your chat route
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