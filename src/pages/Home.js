import React, { useEffect, useState, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { doc, collection, query, where, getDoc, onSnapshot, updateDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useWeather } from "../contexts/WeatherContext";
import packageJson from '../../package.json';
import { useThemeToggle } from "../contexts/ThemeToggleContext";
import { getTheme } from "../theme";
import { Backgrounds } from "../theme/backgroundPresets";
import { useBackground } from "../contexts/BackgroundContext";
import placesData from "../data/data.json";
import { Search } from "../icons/LucideIcons";
import { useCreateTripDrawer } from "../hooks/useCreateTripDrawer";
import FloatingSearch from "../elements/FloatingSearch";
import {
  AppBar,
  Toolbar,
  Typography,
  Container,
  Box,
  Grid,
  Card,
  CircularProgress,
  ThemeProvider,
  Button,
  useTheme,
  useMediaQuery,
  keyframes,
} from "@mui/material";
import BetaAccessGuard from "../components/BetaAccessGuard";
import Notifications from "../elements/Notifications";

// Import our new home components
import WeatherWidget from "../components/home_components/WeatherWidget";
import AQIWidget from "../components/home_components/AQIWidget";
import OngoingTripsAlerts from "../components/home_components/OngoingTripsAlerts";
import UpcomingTripsAlerts from "../components/home_components/UpcomingTripsAlerts";
import YourTrips from "../components/home_components/YourTrips";
import RemindersGlimpse from "../components/home_components/RemindersGlimpse";
import FeaturedPlaces from "../components/home_components/FeaturedPlaces";
import CreateTripDrawer from "../components/home_components/CreateTripDrawer";

const WEATHER_STORAGE_KEY = "bunkmate_weather";
const WEATHER_API_KEY = "c5298240cb3e71775b479a32329803ab";
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

const Home = () => {
  const navigate = useNavigate();
  const muiTheme = useTheme();
  const isSmallScreen = useMediaQuery(muiTheme.breakpoints.down("md"));

  const [authInitialized, setAuthInitialized] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notLoggedIn, setNotLoggedIn] = useState(false);
  const [userData, setUserData] = useState({});
  const [, setUserType] = useState("");
  const { weather, setWeather, weatherLoading, setWeatherLoading } = useWeather();
  const [aqiData, setAqiData] = useState(null);
  const [, setAqiLoading] = useState(true);
  const [, setBudgets] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [, setRemindersLoading] = useState(true);

  const [myTrips, setMyTrips] = useState([]);
  const [tripMembersMap, setTripMembersMap] = useState({});
  const [, setTimelineStatsMap] = useState({});
  const [tripGroupsMap, setTripGroupsMap] = useState({});
  const [sliderIndex, setSliderIndex] = useState(0);
  const { mode, accent } = useThemeToggle();
  const theme = getTheme(mode, accent);
  const { backgroundType, category, gradientType, presetIndex, animated } = useBackground();

  const [, setUnreadCount] = useState(0);

  const [liveAlerts, setLiveAlerts] = useState({ upcoming: [], ongoing: [], reminders: [] });
  
  const watchIdRef = useRef(null);
  const [friendCards, setFriendCards] = useState([]);
  
  const [, setScrolled] = useState(false);
  const [, setShowAppBar] = useState(true);

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
    setReminders((prev) =>
      prev.map((r) =>
        r.id === reminderId ? { ...r, completed: !current } : r
      )
    );

    try {
      await updateDoc(doc(db, "reminders", reminderId), {
        completed: !current,
        completedAt: !current ? new Date() : null,
      });
    } catch (err) {
      console.error("Failed to toggle reminder:", err);
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
    let lastScrollYVal = window.scrollY;
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScroll = window.scrollY;
          const shouldBeScrolled = currentScroll > 10;
          setScrolled((prev) => (prev !== shouldBeScrolled ? shouldBeScrolled : prev));

          const isScrollingDown = currentScroll > lastScrollYVal && currentScroll > 100;
          setShowAppBar(!isScrollingDown);

          lastScrollYVal = currentScroll;
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
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

      if (Notification.permission === "granted") {
        registerPushSubscription(firebaseUser.uid);
      } else if (Notification.permission !== "denied") {
        Notification.requestPermission().then(permission => {
          if (permission === "granted") {
            registerPushSubscription(firebaseUser.uid);
          }
        });
      }

      return () => {
        unsubscribeUser();
      };
    });

    return () => unsubscribe();
  }, []);

  const [settings] = useState(() => {
    const saved = localStorage.getItem('settings');
    return saved ? JSON.parse(saved) : { locationMode: 'auto', manualLocation: '' };
  });

  useEffect(() => {
    const now = new Date();
    const in12h = 12 * 60 * 60 * 1000;
    const upcoming = [];
    const ongoing = [];
    const rems = [];

    (myTrips || []).forEach((trip) => {
      try {
        const startRaw = trip.startDate || trip.date;
        const endRaw = trip.endDate || trip.date;
        if (!startRaw) return;

        const start = new Date(startRaw);
        const end = endRaw ? new Date(endRaw) : new Date(startRaw);
        if (isNaN(start.getTime())) return;

        const from = trip.from || trip.startLocation || "Unknown";
        const to = trip.to || trip.endLocation || trip.location || "Unknown";

        if (start > now && start - now <= in12h) {
          upcoming.push({
            id: trip.id,
            name: trip.name || "Unnamed Trip",
            start,
            from,
            to,
          });
        } else if (start <= now && now <= end) {
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
        wind: Math.round(data.wind?.speed * 3.6),
        pressure: data.main?.pressure,
        visibility: data.visibility,
        clouds: data.clouds?.all,
        rain: data.rain?.['1h'] || 0,
        snow: data.snow?.['1h'] || 0,
        windSpeed: data.wind.speed,
        windDeg: data.wind.deg,
        windGust: data.wind.gust || 0,
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
  }, []);

  useEffect(() => {
    if (!user?.uid) {
      setReminders([]);
      setRemindersLoading(false);
      return;
    }

    setRemindersLoading(true);
    
    const unsubscribe = onSnapshot(
      query(collection(db, "reminders"), where("uid", "==", user.uid)),
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

    return () => unsubscribe();
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

    return () => unsubscribe();
  }, []);

  const textColor = useMemo(
    () => (mode === "dark" ? "#fff" : "#000"),
    [mode]
  );

  const backgroundStyle = useMemo(() => {
    if (backgroundType === "solid") {
      const color = Backgrounds.solidByIndex({ category, index: presetIndex });
      return Backgrounds.composeSolid(color);
    }
    if (backgroundType === "mesh") {
      const m = Backgrounds.meshByIndex({ category, index: presetIndex });
      return Backgrounds.composeGradient(m.value);
    }
    if (backgroundType === "gradient") {
      if (animated) {
        const g = Backgrounds.animatedGradientByIndex({ index: presetIndex });
        return Backgrounds.composeGradient(g.value, g.animation);
      }
      const g = Backgrounds.gradientByIndex({ type: gradientType, category, index: presetIndex });
      return Backgrounds.composeGradient(g.value);
    }
    const defaultMesh = Backgrounds.meshByIndex({ category: "atmospheric", index: 0 });
    return Backgrounds.composeGradient(defaultMesh.value);
  }, [backgroundType, category, gradientType, presetIndex, animated]);

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

  async function registerPushSubscription(uid) {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
    try {
      const reg = await navigator.serviceWorker.ready;
      let sub = await reg.pushManager.getSubscription();
      if (!sub) {
        const vapidRes = await fetch(VAPID_PUBLIC_KEY_URL);
        const { publicKey } = await vapidRes.json();
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
        });
      }
      await fetch(`${SAVE_SUBSCRIPTION_URL}?uid=${uid}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sub),
      });
    } catch (e) {
      // Ignore
    }
  }

  function urlBase64ToUint8Array(base64String) {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

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
                top: { xs: 45, lg: 35 },
                transition: "all 0.45s cubic-bezier(.4,0,.2,1)",
                background: "transparent",
                boxShadow: "none",
                py: 0,
                zIndex: 1200,
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
                }}
              >
                <Typography
                  variant="h6"
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    fontWeight: 700,
                    color: textColor,
                    userSelect: "none",
                  }}
                >
                  <Box sx={{ display: "flex", flexDirection: "row", gap: 0.6, color: textColor }}>
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
                      <Typography
                        variant="inherit"
                        sx={{
                          fontSize: { xs: "1.2rem", sm: "1.3rem" },
                          fontWeight: "bold",
                          lineHeight: 1.15,
                          color: textColor,
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

                  {isSmallScreen && (
                    <Box
                      sx={{
                        transition: "transform 0.3s ease",
                        backgroundColor: mode === "dark" ? "#f1f1f102" : "#0c0c0c11",
                        backdropFilter: "blur(120px)",
                        WebkitBackdropFilter: "blur(120px)",
                        color: textColor,
                        borderRadius: "50%",
                        boxShadow: 
            mode === "dark"
              ? `
                inset 0 1px 1px rgba(255, 255, 255, 0.11),
                inset 0 -1px 1px rgba(255, 255, 255, 0.07),
                0 1px 0px rgba(0,0,0,0.1)
              `
              : `
                inset 0 1px 1px rgba(255,255,255,0.8),
                inset 0 -1px 1px rgba(0,0,0,0.1),
                0 1px 0px rgba(0,0,0,0.1)
              `,
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
                ...backgroundStyle,
                transition: "background 1.2s cubic-bezier(.4,0,.2,1)",
                "&::before": {
                  content: '""',
                  position: "absolute",
                  inset: 0,
                  background: "radial-gradient(circle at top center, rgba(255,255,255,0.08), transparent 60%)",
                  opacity: 0.6,
                },
                "&::after": {
                  content: '""',
                  position: "absolute",
                  inset: 0,
                  backgroundImage: "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"120\" height=\"120\"><filter id=\"n\"><feTurbulence type=\"fractalNoise\" baseFrequency=\"0.8\" numOctaves=\"4\" stitchTiles=\"stitch\"/></filter><rect width=\"120\" height=\"120\" filter=\"url(%23n)\" opacity=\"0.035\"/></svg>')",
                  opacity: 0.35,
                  mixBlendMode: "overlay",
                },
              }}
            />

            <Box
              sx={{
                zIndex: 1,
                position: "relative",
                mb: 2,
                color: textColor,
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
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    flexDirection: { xs: "row", md: "row" },
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: 2,
                    borderRadius: 3,
                    pt: 12,
                    pb: 1,
                    px: 1,
                    animation: `${fadeIn} 0.7s`,
                    zIndex: 3,
                    position: "relative",
                  }}
                >
                  <WeatherWidget
                    weather={weather}
                    weatherLoading={weatherLoading}
                    mode={mode}
                    textColor={textColor}
                    theme={theme}
                  />

                  <AQIWidget
                    aqiData={aqiData}
                    mode={mode}
                  />
                </Box>

                <Card
                  sx={{
                    display: "flex",
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    px: 1,
                    py: 1.5,
                    borderRadius: 4,
                    backgroundImage: "none",
                    backgroundColor: 'transparent',
                    color: mode === "dark" ? "#f5f5f5" : "#111",
                    boxShadow: 'none',
                    minWidth: 260,
                    maxWidth: 480,
                    gap: 1,
                  }}
                >
                  <OngoingTripsAlerts
                    ongoingAlerts={liveAlerts.ongoing}
                    tripGroupsMap={tripGroupsMap}
                    mode={mode}
                    navigate={navigate}
                  />

                  <UpcomingTripsAlerts
                    upcomingAlerts={liveAlerts.upcoming}
                    mode={mode}
                    isSmallScreen={isSmallScreen}
                  />
                </Card>
              </Container>
            </Box>

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
                }}
              >
                <Grid container spacing={3} justifyContent={"center"} mt={3}>
                  <Grid item xs={12} md={6} lg={4} xl={2.4}>
                    <YourTrips
                      myTrips={myTrips}
                      tripGroupsMap={tripGroupsMap}
                      tripMembersMap={tripMembersMap}
                      sliderIndex={sliderIndex}
                      setSliderIndex={setSliderIndex}
                      mode={mode}
                      theme={theme}
                      navigate={navigate}
                    />
                  </Grid>

                  <Container maxWidth="lg" sx={{ mt: 4 }}>
                    <RemindersGlimpse
                      reminders={reminders}
                      mode={mode}
                      handleToggleReminderComplete={handleToggleReminderComplete}
                    />
                  </Container>
                </Grid>
              </Container>

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
                      ${mode === "dark" ? "rgba(12,12,12,0.96)" : "rgba(241,241,241,0.96)"} 40%,
                      ${mode === "dark" ? "rgba(12, 12, 12, 0.92)" : "rgba(241,241,241,0.72)"} 85%,
                      ${mode === "dark" ? "rgba(0, 0, 0, 0.06)" : "rgba(255, 255, 255, 0.08)"} 100%
                    )
                  `,
                  transition: "background 600ms cubic-bezier(.4,0,.2,1)",
                }}
              >
                <Container maxWidth="lg" sx={{ flexGrow: 1, pt: 0, position: "relative" }}>
                  <FloatingSearch mode={mode} />

                  {loading ? (
                    <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "60vh" }}>
                      <CircularProgress color={theme.palette.background?.main || "primary"} />
                    </Box>
                  ) : (
                    <Grid container spacing={3} pt={1} justifyContent={"center"}>
                      <FeaturedPlaces
                        allFlattenedPlaces={allFlattenedPlaces}
                        userData={userData}
                        onPlanTrip={onPlanTrip}
                        mode={mode}
                        navigate={navigate}
                      />

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
                          "&:hover": { opacity: 0.85 },
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
        </Box>

        <CreateTripDrawer
          createDialogOpen={createDialogOpen}
          closeDrawer={closeDrawer}
          step={step}
          newTrip={newTrip}
          setNewTrip={setNewTrip}
          handleNext={handleNext}
          handleBack={handleBack}
          selectedMembers={selectedMembers}
          handleRemoveMember={handleRemoveMember}
          handleContributionChange={handleContributionChange}
          totalContribution={totalContribution}
          handleCreateTrip={handleCreateTrip}
          handleAddMember={handleAddMember}
          randomNatureImage={randomNatureImage}
          friendCards={friendCards}
          mode={mode}
          theme={theme}
        />
      </BetaAccessGuard>
    </ThemeProvider>
  );
};

export default Home;