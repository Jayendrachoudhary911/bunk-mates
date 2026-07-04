import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
  Box,
  Typography,
  Button,
  Container,
  Card,
  CardContent,
  DialogContent,
  TextField,
  DialogActions,
  AvatarGroup,
  Avatar,
  IconButton,
  Stack,
  ThemeProvider,
  Chip,
  Fade,
  Tabs,
  Tab,
  Drawer,
  Stepper,
  Step,
  StepLabel,
  Autocomplete,
  Slider,
  Slide,
  Tooltip,
  LinearProgress,
  InputAdornment,
  Badge,
  SwipeableDrawer
} from "@mui/material";
import {
  LocationOn,
  PhotoCamera,
  WbSunny,
  ArrowForward,
  Search,
  FilterList,
} from "@mui/icons-material";
import { db, auth } from "../firebase"; // <-- Reference preserved verbatim
import {
  collection,
  getDocs,
  addDoc,
  query,
  where,
  setDoc,
  doc,
  arrayUnion,
  updateDoc,
  onSnapshot,
  getDoc,
} from "firebase/firestore"; // <-- Preserved verbatim
import { useNavigate } from "react-router-dom"; // <-- Preserved verbatim
import CloseOutlinedIcon from '@mui/icons-material/CloseOutlined'; // <-- Preserved verbatim
import { useThemeToggle } from "../contexts/ThemeToggleContext"; // <-- Preserved
import { getTheme } from "../theme"; // <-- Preserved
import Cropper from "react-easy-crop"; // <-- Preserved verbatim
import Notifications from "../elements/Notifications"; // <-- Preserved verbatim
import { motion, useAnimation, useMotionValue, AnimatePresence } from "framer-motion"; // <-- Preserved verbatim
import { useBackButtonClose } from "../hooks/useBackButtonClose"; // <-- Preserved verbatim
import AddIcon from '@mui/icons-material/Add'; // <-- Preserved verbatim
import { SquarePen } from "lucide-react"; // Ensure lucide-react is installed
import FloatingNewTripsButton  from "../components/trips_components/FloatingNewTripsButton";

// Pure Liquid Glass & Premium Morphic Design Language Tokens
const tokens = {
  dark: {
    bg: "#060606",
    surface: "rgba(14, 14, 14, 0.45)",
    cardBg: "rgba(20, 20, 20, 0.4)",
    border: "rgba(255, 255, 255, 0.06)",
    innerGlow: "rgba(255, 255, 255, 0.03)",
    glassSpecular: "linear-gradient(135deg, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0.01) 100%)",
    glassMelt: "linear-gradient(180deg, rgba(255, 255, 255, 0.05) 0%, rgba(0, 0, 0, 0.6) 100%)",
    scrim: "linear-gradient(to bottom, rgba(6, 6, 6, 0.9) 0%, rgba(6, 6, 6, 0.4) 70%, transparent 100%)",
    shadow: "0 30px 70px rgba(0, 0, 0, 0.85), inset 0 1px 1px rgba(255, 255, 255, 0.08)"
  },
  light: {
    bg: "#F0F2F5",
    surface: "rgba(255, 255, 255, 0.55)",
    cardBg: "rgba(255, 255, 255, 0.45)",
    border: "rgba(0, 0, 0, 0.05)",
    innerGlow: "rgba(255, 255, 255, 0.6)",
    glassSpecular: "linear-gradient(135deg, rgba(255, 255, 255, 0.7) 0%, rgba(0, 0, 0, 0.02) 100%)",
    glassMelt: "linear-gradient(180deg, rgba(255, 255, 255, 0.4) 0%, rgba(0, 0, 0, 0.05) 100%)",
    scrim: "linear-gradient(to bottom, rgba(240, 242, 245, 0.9) 0%, rgba(240, 242, 245, 0.4) 70%, transparent 100%)",
    shadow: "0 30px 70px rgba(0, 0, 0, 0.03), inset 0 1px 2px rgba(255, 255, 255, 0.7)"
  },
  accent: {
    green: "#4ADE80",
    blue: "#38BDF8",
    amber: "#F59E0B"
  }
};

const getTripColor = (id) => {
  const colors = [tokens.accent.blue, tokens.accent.green, tokens.accent.amber];
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
};

const exportToICS = (trip) => {
  const formatDate = (dateString) => {
    return new Date(dateString).toISOString().replace(/-|:|\.\d+/g, "");
  };

  const title = `SUMMARY:${trip.name}`;
  const start = `DTSTART:${formatDate(trip.startDate)}`;
  const end = `DTEND:${formatDate(trip.endDate)}`;
  const loc = `LOCATION:${trip.location}`;
  const desc = `DESCRIPTION:Trip from ${trip.from} to ${trip.to}. Managed via BunkMate.`;

  const icsData = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PROID:-//BunkMate//Trip Planner//EN",
    "BEGIN:VEVENT",
    `UID:${trip.id}@bunkmate.app`,
    `DTSTAMP:${formatDate(new Date())}`,
    start,
    end,
    title,
    desc,
    loc,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\n");

  const blob = new Blob([icsData], { type: "text/calendar;charset=utf-8" });
  const link = document.createElement("a");
  link.href = window.URL.createObjectURL(blob);
  link.setAttribute("download", `${trip.name.replace(/\s+/g, "_")}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const isSameDay = (d1, d2) => 
  d1.getFullYear() === d2.getFullYear() && 
  d1.getMonth() === d2.getMonth() && 
  d1.getDate() === d2.getDate();

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
};

// Utility function to crop image canvas data
async function getCroppedImg(imageSrc, croppedAreaPixels) {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  canvas.width = croppedAreaPixels.width;
  canvas.height = croppedAreaPixels.height;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(
    image,
    croppedAreaPixels.x, croppedAreaPixels.y, croppedAreaPixels.width, croppedAreaPixels.height,
    0, 0, croppedAreaPixels.width, croppedAreaPixels.height
  );
  return canvas.toDataURL("image/png");
}

function createImage(url) {
  return new Promise((resolve, reject) => {
    const image = new window.Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = error => reject(error);
    image.src = url;
  });
}

// Monolithic Liquid Shimmer Grain Mask
const AmbientLiquidGrain = React.memo(() => (
  <Box
    sx={{
      position: "fixed",
      inset: 0,
      zIndex: 9999,
      pointerEvents: "none",
      opacity: 0.02,
      backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='liquidGrain'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23liquidGrain)'/%3E%3C/svg%3E")`
    }}
  />
));
AmbientLiquidGrain.displayName = "AmbientLiquidGrain";

const LOCAL_STORAGE_KEY = "bunkmate.newTripForm";
const UNSPLASH_ACCESS_KEY = "MGCA3bsEUNBsSG6XbcqnJXckFB4dDyN5ZPKVBrD0FeQ";

export default function Trips() {
  const [trips, setTrips] = useState([]);
  const [currentTab, setCurrentTab] = useState(0); 
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [step, setStep] = useState(0); 
  const [isFabExtended, setIsFabExtended] = useState(true);
  const [newTrip, setNewTrip] = useState({
    name: "", from: "", to: "", location: "", startDate: "", endDate: "", iconDataUri: "", travelType: "Adventure", budgetGoal: ""
  });
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [memberInput, setMemberInput] = useState("");
  const [userSuggestions, setUserSuggestions] = useState([]);
  const [friendCards, setFriendCards] = useState([]);
  const [latestTripId, setLatestTripId] = useState(null);

  // Search & Filter State Control Matrix
  const [searchQuery, setSearchQuery] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [filterPlace, setFilterPlace] = useState("");
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");

  // Crop Canvas Configurations
  const [cropDrawerOpen, setCropDrawerOpen] = useState(false);
  const [uploadedImageSrc, setUploadedImageSrc] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const { mode, accent } = useThemeToggle(); // Preserved
  const theme = getTheme(mode, accent); // Preserved
  const isDarkMode = mode === 'dark';
  const currentTokens = isDarkMode ? tokens.dark : tokens.light;
  const navigate = useNavigate(); // Preserved
  const user = auth.currentUser; // Preserved
  const [randomNatureImage, setRandomNatureImage] = useState("");

  // Control hooks for fluid dragging and preview bleeding
  const containerRef = useRef(null);
  const dragX = useMotionValue(0);
  const carouselControls = useAnimation();
  const [expanded, setExpanded] = useState(true);
  const [scrolled, setScrolled] = useState(false);

  useBackButtonClose(createDialogOpen, () => setCreateDialogOpen(false)); // Preserved
  useBackButtonClose(cropDrawerOpen, () => setCropDrawerOpen(false)); // Preserved
  useBackButtonClose(filterOpen, () => setFilterOpen(false));

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const isScrolled = window.scrollY > 20;
          setScrolled((prev) => (prev !== isScrolled ? isScrolled : prev));
          if (isScrolled) setExpanded(false);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setExpanded(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  // Optimized Scroll Event Handling using requestAnimationFrame
  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setIsFabExtended(window.scrollY <= 60);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Fetch Fallback Cover Images Safely
  useEffect(() => {
    if (createDialogOpen && !newTrip.iconDataUri) {
      fetch(`https://api.unsplash.com/photos/random?query=travel,nature,minimal&orientation=landscape&client_id=${UNSPLASH_ACCESS_KEY}`)
        .then(res => res.json())
        .then(data => {
          if (data?.urls?.regular) setRandomNatureImage(data.urls.regular);
        })
        .catch(() => setRandomNatureImage(""));
    }
  }, [createDialogOpen, newTrip.iconDataUri]);

  // Synchronize Framework State Pipeline
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.iconDataUri?.length > 100000) parsed.iconDataUri = "";
        setNewTrip(prev => ({ ...prev, ...parsed }));
      }
    } catch (e) { console.warn(e); }
  }, []);

  useEffect(() => {
    const compact = {
      name: newTrip.name || "", from: newTrip.from || "", to: newTrip.to || "", location: newTrip.location || "", startDate: newTrip.startDate || "", endDate: newTrip.endDate || "", travelType: newTrip.travelType || "Adventure", budgetGoal: newTrip.budgetGoal || ""
    };
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(compact));
  }, [newTrip]);

  // Realtime Data Layer Context Observers
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "trips"), where("members", "array-contains", user.uid)); // Preserved verbatim
    const unsubscribe = onSnapshot(q, async snapshot => {
      const allTrips = await Promise.all(
        snapshot.docs.map(async docSnap => {
          const trip = { id: docSnap.id, ...docSnap.data() };
          const userBudgetRef = doc(db, "budgets", user.uid);
          const budgetSnap = await getDoc(userBudgetRef);
          if (budgetSnap.exists()) {
            const budgetDoc = budgetSnap.data();
            const matchingItem = Array.isArray(budgetDoc.items) ? budgetDoc.items.find(item => item.tripId === trip.id) : null;
            if (matchingItem) {
              const used = Array.isArray(matchingItem.expenses) ? matchingItem.expenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0) : 0;
              trip.budget = { ...matchingItem, used };
            } else { trip.budget = null; }
          } else { trip.budget = null; }
          
          const memberSnapshots = await Promise.all(trip.members.map(uid => getDoc(doc(db, "users", uid))));
          trip.memberProfiles = memberSnapshots.filter(s => s.exists()).map(s => {
            const data = s.data();
            return { uid: s.id, photoURL: data.photoURL || "", name: data.name || "", username: data.username || "" };
          });
          const groupChatSnap = await getDoc(doc(db, "groupChats", trip.id));
          trip.iconURL = groupChatSnap.exists() ? groupChatSnap.data().iconURL || null : null;

          const timelineSnap = await getDocs(collection(db, "trips", trip.id, "timeline"));
          const timelineEvents = timelineSnap.docs.map(d => d.data());
          const total = timelineEvents.length || 1;
          const completedCount = timelineEvents.filter(ev => ev.completed === true).length;
          trip.timelineProgress = Math.round((completedCount / total) * 100);
          trip.timelineStats = { completed: completedCount, total };
          return trip;
        })
      );
      setTrips(allTrips);
    });
    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if ((createDialogOpen || step === 1) && user) {
      if (!selectedMembers.some(m => m.uid === user.uid)) {
        setSelectedMembers(prev => [
          ...prev,
          { uid: user.uid, name: user.displayName || "You", username: user.email?.split("@")[0] || "you", email: user.email, photoURL: user.photoURL || "", contribution: "" }
        ]);
      }
    }
  }, [createDialogOpen, step, user, selectedMembers]);

  const handleNext = () => {
    const { name, from, to, location, startDate, endDate } = newTrip;
    if (!name || !from || !to || !location || !startDate || !endDate) return;
    setStep(1);
  };
  const handleBack = () => setStep(prev => prev - 1);

  const handleIconUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setUploadedImageSrc(reader.result);
      setCropDrawerOpen(true);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setCroppedAreaPixels(null);
    };
    reader.readAsDataURL(file);
  };

  const onCropComplete = useCallback((_, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleContinueCrop = async () => {
    if (!uploadedImageSrc || !croppedAreaPixels) return;
    try {
      const dataUri = await getCroppedImg(uploadedImageSrc, croppedAreaPixels);
      setNewTrip(prev => ({ ...prev, iconDataUri: dataUri }));
      setCropDrawerOpen(false);
    } catch (err) { console.error(err); }
  };

  const handleSearchUsers = async input => {
    if (!input) { setUserSuggestions([]); return; }
    const q = query(collection(db, "users"), where("keywords", "array-contains", input.toLowerCase()));
    const snap = await getDocs(q);
    setUserSuggestions(snap.docs.map(doc => ({ uid: doc.id, ...doc.data(), contribution: "" })));
  };

  useEffect(() => {
    if (!user) return;
    (async () => {
      const userRef = doc(db, "users", user.uid);
      const snap = await getDoc(userRef);
      if (snap.exists()) {
        const friends = snap.data().friends || [];
        const friendsData = await Promise.all(friends.map(uid => getDoc(doc(db, "users", uid))));
        setFriendCards(friendsData.filter(f => f.exists()).map(f => ({ uid: f.id, ...f.data(), contribution: "" })));
      }
    })();
  }, [user, step]);

  const handleAddMember = member => {
    if (!selectedMembers.some(m => m.uid === member.uid)) setSelectedMembers(prev => [...prev, member]);
    setMemberInput("");
    setUserSuggestions([]);
  };

  const handleRemoveMember = uid => setSelectedMembers(prev => prev.filter(m => m.uid !== uid));
  const handleContributionChange = (idx, value) => {
    setSelectedMembers(prev => {
      const updated = [...prev];
      updated[idx].contribution = value;
      return updated;
    });
  };

  const handleCreateTrip = async () => {
    const { name, from, to, location, startDate, endDate, iconDataUri } = newTrip;
    if (selectedMembers.length === 0) return;
    const iconURL = iconDataUri || randomNatureImage;
    const members = selectedMembers.map(m => m.uid);
    const contributors = selectedMembers.map(m => ({ uid: m.uid, name: m.name || m.username, amount: parseInt(m.contribution || 0) }));
    const total = contributors.reduce((sum, c) => sum + c.amount, 0);

    try {
      const tripDoc = await addDoc(collection(db, "trips"), { name, from, to, location, startDate, endDate, members, createdBy: user.uid, createdAt: new Date().toISOString() });
      await setDoc(doc(db, "groupChats", tripDoc.id), { tripId: tripDoc.id, name: `${from} → ${location}`, members, iconURL, createdBy: user.uid, createdAt: new Date().toISOString() });
      await setDoc(doc(db, "budgets", tripDoc.id), { tripId: tripDoc.id, tripName: name, total, used: 0, contributors, createdBy: user.uid, createdAt: new Date().toISOString() });
      setStep(0); setCreateDialogOpen(false);
      setNewTrip({ name: "", from: "", to: "", location: "", startDate: "", endDate: "", iconDataUri: "", travelType: "Adventure", budgetGoal: "" });
      setSelectedMembers([]);
    } catch (error) { alert(error.message); }
  };

  const today = useMemo(() => new Date(), []);
  
  // Real-time Search and Filter Vector Pipeline
  const filteredTrips = useMemo(() => {
    return trips.filter(t => {
      const matchQuery = searchQuery ? (
        t.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.from?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.to?.toLowerCase().includes(searchQuery.toLowerCase())
      ) : true;

      const matchPlace = filterPlace ? (
        t.location?.toLowerCase().includes(filterPlace.toLowerCase()) ||
        t.from?.toLowerCase().includes(filterPlace.toLowerCase()) ||
        t.to?.toLowerCase().includes(filterPlace.toLowerCase())
      ) : true;

      const matchStart = filterStartDate ? new Date(t.startDate) >= new Date(filterStartDate) : true;
      const matchEnd = filterEndDate ? new Date(t.endDate) <= new Date(filterEndDate) : true;

      return matchQuery && matchPlace && matchStart && matchEnd;
    });
  }, [trips, searchQuery, filterPlace, filterStartDate, filterEndDate]);

  // High Performance Memoized Vector Sorting Splits applied to the filtered pool
  const { upcomingTrips, ongoingTrips, pastTrips } = useMemo(() => {
    return {
      upcomingTrips: filteredTrips.filter(t => new Date(t.startDate) > today),
      ongoingTrips: filteredTrips.filter(t => new Date(t.startDate) <= today && new Date(t.endDate) >= today),
      pastTrips: filteredTrips.filter(t => new Date(t.endDate) < today)
    };
  }, [filteredTrips, today]);

  // Memoized Metric Statistics
  const uniqueCountries = useMemo(() => new Set(trips.map(t => t.location?.split(',').pop()?.trim())).size || 0, [trips]);
  const totalBudgetSpent = useMemo(() => trips.reduce((acc, t) => acc + (t.budget?.used || 0), 0), [trips]);
  const totalDaysTravelled = useMemo(() => trips.reduce((acc, t) => {
    const diff = new Date(t.endDate) - new Date(t.startDate);
    return acc + Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }, 0), [trips]);

  // Synchronous dataset indexing matrix
  const allTabsData = useMemo(() => [
    filteredTrips,
    upcomingTrips,
    ongoingTrips,
    pastTrips
  ], [filteredTrips, upcomingTrips, ongoingTrips, pastTrips]);

  // Unified Scroll Anchor with Highlight Mechanics
  const scrollToAndHighlightTrip = useCallback((tripId, targetColor) => {
    const element = document.getElementById(`trip-frame-${tripId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      element.style.transition = 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)';
      element.style.transform = 'scale(1.03) translateY(-8px)';
      element.style.boxShadow = `0 40px 90px ${targetColor}44, inset 0 1px 2px rgba(255,255,255,0.4)`;
      element.style.borderColor = targetColor;
      
      setTimeout(() => {
        element.style.transform = '';
        element.style.boxShadow = '';
        element.style.borderColor = '';
      }, 1500);
    }
  }, []);

  // Update programmatic animations if tab is selected via top bar buttons
  useEffect(() => {
    const width = containerRef.current?.offsetWidth || window.innerWidth;
    carouselControls.start({
      x: -currentTab * width,
      transition: { type: "spring", stiffness: 300, damping: 30 }
    });
  }, [currentTab, carouselControls]);

  const renderTripCard = (trip) => {
    const isNew = trip.id === latestTripId;

    return (
      <Slide in direction="up" timeout={isNew ? 600 : 0} mountOnEnter unmountOnExit key={trip.id}>
        <Card
          id={`trip-${trip.id}`}
          onClick={() => navigate(`/trips/${trip.id}`)}
          sx={{
            backdropFilter: "blur(12px)",
            backgroundImage: `url(${trip?.iconURL})`,
            backgroundSize: "cover",
            backgroundColor: mode === "dark" ? "#313131ff" : "#e4e4e4ff",
            backgroundPosition: "center",
            borderRadius: 6,
            overflow: "hidden",
            color: mode === "dark" ? "#fff" : "#000",
            boxShadow: mode === "dark" ? `inset 0 1px 2px rgba(255, 255, 255, 0.11), inset 0 -1px 1px rgba(35, 35, 35, 0.07)` : `inset 0 1px 1px rgba(255,255,255,0.8), inset 0 -1px 1px rgba(0,0,0,0.05)`,
            transition: "transform 0.3s ease",
            '&:hover': { transform: "scale(1.015)" }
          }}
        >
          <Tooltip title="Add to Google/Apple Calendar">
            <IconButton
              onClick={(e) => {
                e.stopPropagation();
                exportToICS(trip);
              }}
              sx={{
                position: 'absolute',
                top: 5,
                right: 5,
                zIndex: 5,
                color: mode === 'dark' ? '#ffffff' : '#000000',
                background: mode === "dark" ? "rgba(30, 30, 30, 0.22)" : "rgba(255, 255, 255, 0.4)",
                boxShadow: theme.palette.mode === "dark" ? `inset 0 1px 2px rgba(255, 255, 255, 0.11), inset 0 -1px 1px rgba(35, 35, 35, 0.07)` : `inset 0 1px 1px rgba(255,255,255,0.8), inset 0 -1px 1px rgba(0,0,0,0.1)`,
                backdropFilter: 'blur(20px)',
                '&:hover': { backgroundColor: mode === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)' }
              }}
            >
              <AddIcon sx={{ fontSize: 20 }} /> 
            </IconButton>
          </Tooltip>

          <CardContent 
            sx={{ 
              p: 2, 
              backgroundColor: mode === "dark" ? "rgba(0, 0, 0, 0.4)" : "rgba(255, 255, 255, 0.4)", 
              backdropFilter: "blur(12px)",
              border: `1px solid ${mode === "dark" ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.06)"}`,
              borderRadius: '16px',
              '&:last-child': { pb: 2 }
            }}
          >
            <Box 
              sx={{ 
                display: "flex", 
                alignItems: "center", 
                justifyContent: "space-between",
                gap: 2,
                width: "100%",
                overflow: "hidden" 
              }}
            >
              <Box 
                sx={{ 
                  display: "flex", 
                  alignItems: "center", 
                  gap: 1.5, 
                  minWidth: 0, 
                  flex: 1 
                }}
              >
                <Typography 
                  variant="h6" 
                  fontWeight="700" 
                  sx={{ 
                    whiteSpace: "nowrap", 
                    overflow: "hidden", 
                    textOverflow: "ellipsis",
                    flexShrink: 1, 
                    color: mode === "dark" ? "#ffffff" : "#111111"
                  }}
                >
                  {trip.name}
                </Typography>
              </Box>

              <AvatarGroup 
                max={3} 
                sx={{ 
                  flexShrink: 0, 
                  mr: 4,
                  '& .MuiAvatar-root': { 
                    width: 26, 
                    height: 26, 
                    fontSize: '0.7rem', 
                    fontWeight: 600,
                    border: 0, 
                    backgroundClip: 'padding-box', 
                    boxShadow: theme.palette.mode === "dark" 
                      ? `inset 0 1px 2px rgba(255, 255, 255, 0.11), inset 0 -1px 1px rgba(35, 35, 35, 0.07)` 
                      : `inset 0 1px 1px rgba(255,255,255,0.8), inset 0 -1px 1px rgba(0,0,0,0.1)`,
                    marginLeft: '-8px !important', 
                  },
                  '& .MuiAvatarGroup-avatar': {
                    backgroundColor: theme.palette.mode === "dark" ? "rgba(255, 255, 255, 0.12)" : "rgba(0, 0, 0, 0.08)",
                    color: theme.palette.text.secondary,
                    fontVariantNumeric: 'tabular-nums', 
                  }
                }}
              >
                {trip.memberProfiles?.map((m) => (
                  <Tooltip title={m.name || `@${m.username}`} key={m.uid} arrow>
                    <Avatar 
                      src={m.photoURL || `https://api.dicebear.com/7.x/identicon/svg?seed=${m.uid}`} 
                      alt={m.name || m.username} 
                    />
                  </Tooltip>
                ))}
              </AvatarGroup>
            </Box>
            
            <Box 
              sx={{ 
                display: "flex", 
                alignItems: "center", 
                gap: 0.5, 
                color: "text.secondary",
                minWidth: 0,
                flexShrink: 2 
              }}
            >
              <LocationOn sx={{ fontSize: 16, flexShrink: 0 }} />
              <Typography 
                variant="body2" 
                sx={{ 
                  whiteSpace: "nowrap", 
                  overflow: "hidden", 
                  textOverflow: "ellipsis" 
                }}
              >
                {trip.location} — {new Date(trip.startDate).toLocaleDateString([], {month: 'short', day: 'numeric'})} to {new Date(trip.endDate).toLocaleDateString([], {month: 'short', day: 'numeric', year: 'numeric'})}
              </Typography>
            </Box>

            {trip.budget && (
              <Box mt={2}>
                <Typography variant="caption" sx={{ color: "#ccc" }}>Budget Used:</Typography>
                <Typography variant="body2" fontWeight="medium">₹{trip.budget.used || 0} / ₹{trip.budget.amount || 0}</Typography>
                <LinearProgress
                  variant="determinate"
                  value={trip.budget.amount ? (trip.budget.used / trip.budget.amount) * 100 : 0}
                  sx={{ mt: 0.5, borderRadius: 20, height: 7, bgcolor: mode === "dark" ? "#ffffff36" : "#00000018", "& .MuiLinearProgress-bar": { bgcolor: mode === "dark" ? "#ffffff" : "#3d3d3dff", borderRadius: 20 } }}
                />
              </Box>
            )}

            <Box mt={2}>
              <Typography variant="caption" color={mode === "dark" ? "#ccc" : "#555"}>Timeline: {trip.timelineStats?.completed || 0} / {trip.timelineStats?.total || 0} completed</Typography>
              <LinearProgress
                value={trip.timelineProgress || 0}
                variant="determinate"
                sx={{ mt: 0.5, borderRadius: 20, height: 7, bgcolor: mode === "dark" ? "#ffffff36" : "#00000018", "& .MuiLinearProgress-bar": { bgcolor: mode === "dark" ? "#ffffff" : "#3d3d3dff", borderRadius: 20 } }}
              />
            </Box>
          </CardContent>
        </Card>
      </Slide>
    );
  };

  const HorizontalInfiniteCalendar = React.memo(({ trips = [] }) => {
    const [days, setDays] = useState([]);
    
    useEffect(() => {
      const start = new Date(); start.setDate(today.getDate() - 4);
      setDays(Array.from({ length: 24 }, (_, i) => { const d = new Date(start); d.setDate(d.getDate() + i); return d; }));
    }, []);

    return (
      <Box sx={{ position: 'relative', pt: 1, pb: 0.5 }}>
        <Box sx={{ display: "flex", overflowX: "auto", px: 2, gap: 1.2, "&::-webkit-scrollbar": { display: "none" } }}>
          {days.map((date, i) => {
            const isCurrent = isSameDay(date, today);
            const active = trips.filter(t => date >= new Date(t.startDate) && date <= new Date(t.endDate));
            const hasTrips = active.length > 0;
            const markerColor = hasTrips ? getTripColor(active[0].id) : "transparent";

            return (
              <Box
                key={i} id={isCurrent ? 'cal-day-today' : undefined}
                onClick={() => { if (hasTrips) scrollToAndHighlightTrip(active[0].id, markerColor); }}
                sx={{
                  minWidth: 46, height: 62, borderRadius: "14px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", position: "relative",
                  background: isCurrent ? (isDarkMode ? "#FFF" : "#000") : "transparent",
                  color: isCurrent ? (isDarkMode ? "#000" : "#FFF") : "inherit",
                  border: hasTrips ? `1.5px solid ${markerColor}` : `1px solid ${isDarkMode ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)"}`,
                  boxShadow: isDarkMode
                    ? `inset 0 1px 1px rgba(255, 255, 255, 0.11), inset 0 -1px 1px rgba(35, 35, 35, 0.07)`
                    : `inset 0 1px 1px rgba(255,255,255,0.8), inset 0 -1px 1px rgba(0,0,0,0.1)`,
                  backdropFilter: "blur(15px)",
                  webkitBackdropFilter: "blur(15px)", 
                  cursor: hasTrips ? "pointer" : "default",
                  transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
                  "&:hover": hasTrips ? {
                    transform: "translateY(-3px)",
                    boxShadow: `0 8px 16px ${markerColor}40`,
                    background: isCurrent ? undefined : "rgba(128,128,128,0.1)"
                  } : {}
                }}
              >
                <Typography variant="caption" sx={{ opacity: 0.4, fontSize: "0.58rem", fontWeight: 800 }}>{date.toLocaleString('default', { weekday: 'short' })}</Typography>
                <Typography variant="body2" sx={{ fontWeight: 950, mt: 0.1, fontSize: "0.85rem" }}>{date.getDate()}</Typography>
                {hasTrips && !isCurrent && <Box sx={{ position: "absolute", bottom: 5, width: 4, height: 4, borderRadius: "50%", backgroundColor: markerColor }} />}
              </Box>
            );
          })}
        </Box>
      </Box>
    );
  });
  HorizontalInfiniteCalendar.displayName = "HorizontalInfiniteCalendar";

  const handleDragEnd = (event, info) => {
    const swipeThreshold = 50;
    const width = containerRef.current?.offsetWidth || window.innerWidth;
    
    let targetTab = currentTab;
    if (info.offset.x < -swipeThreshold && currentTab < 3) {
      targetTab = currentTab + 1;
    } else if (info.offset.x > swipeThreshold && currentTab > 0) {
      targetTab = currentTab - 1;
    }

    setCurrentTab(targetTab);
    carouselControls.start({
      x: -targetTab * width,
      transition: { type: "spring", stiffness: 300, damping: 30 }
    });
  };

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ minHeight: "100vh", mt: 5, color: isDarkMode ? "#FFF" : "#000", pb: 12, position: "relative" }}>
        <AmbientLiquidGrain />
        <Container sx={{ px: 0 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={-4} sx={{ p: 1.1, px: 3}}>
            <Box zIndex={112}>
              <Typography variant="subtitle2" sx={{ fontWeight: 900, color: "text.secondary", textTransform: "uppercase", letterSpacing: "1px", fontSize: "0.68rem" }}>{getGreeting()} ⚡</Typography>
              <Typography variant="h4" sx={{ fontWeight: 950, letterSpacing: "-1.8px", mt: 0.2 }}>Where next?</Typography>
            </Box>
            <Notifications />
          </Box>

          {/* Liquid Masked Dynamic Scrim Top Panel Controller */}
          <Box sx={{ 
            position: 'sticky', 
            top: 0, 
            left: 0,
            zIndex: 100, 
            mb: 1, 
            pb: 1.5,
            pt: 5,
            '&::before': {
              content: '""',
              position: 'absolute',
              inset: 0,
              zIndex: -1,
              backdropFilter: 'blur(20px) saturate(210%)',
              WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0.95) 60%, rgba(0,0,0,0) 100%)',
              maskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0.95) 60%, rgba(0,0,0,0) 100%)',
            }
          }}>
                      <Box sx={{ px: 3, mb: 2, display: "flex", gap: 1.5, alignItems: "center" }}>
            <TextField
              placeholder="Search trips by name or destination..."
              variant="outlined"
              size="small"
              fullWidth
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{ startAdornment: (<InputAdornment position="start"><Search sx={{ color: mode === "dark" ? "rgba(255, 255, 255, 0.5)" : "rgba(0, 0, 0, 0.4)", mr: 1, fontSize: "1.25rem" }} /></InputAdornment>) }}
                sx={{
                  width: "100%",
                  "& .MuiOutlinedInput-root": {
                    color: mode === "dark" ? "#fff" : "#111", borderRadius: 3, backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)", backgroundColor: mode === "dark" ? "rgba(255, 255, 255, 0)" : "rgba(0, 0, 0, 0.02)",
                    boxShadow: mode === "dark" ? `inset 0 1px 2px rgba(255, 255, 255, 0.11), inset 0 -1px 1px rgba(35, 35, 35, 0.07)` : `inset 0 1px 1px rgba(255,255,255,0.8), inset 0 -1px 1px rgba(0,0,0,0.1)`,
                    border: "0px solid", borderColor: mode === "dark" ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.06)", transition: "all 0.2s ease-in-out", "& fieldset": { border: "none" },
                    "&:hover": { backgroundColor: mode === "dark" ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.05)", borderColor: mode === "dark" ? "rgba(255, 255, 255, 0.18)" : "rgba(0, 0, 0, 0.12)" },
                    "&.Mui-focused": { backgroundColor: mode === "dark" ? "rgba(255, 255, 255, 0.04)" : "rgba(255, 255, 255, 0.8)", borderColor: mode === "dark" ? "rgba(255, 255, 255, 0)" : "primary.main", boxShadow: mode === "dark" ? `0 0 0 3px rgba(255, 255, 255, 0.05)` : `0 0 0 3px rgba(25, 118, 210, 0.15)` }
                  },
                  "& .MuiOutlinedInput-input": { py: 1.2, fontSize: "0.9rem", color: mode === "dark" ? "rgba(255, 255, 255, 0.9)" : "rgba(0, 0, 0, 0.85)", "&::placeholder": { color: mode === "dark" ? "rgba(255, 255, 255, 0.4)" : "rgba(0, 0, 0, 0.4)", opacity: 1 } }
                }}
            />
{/* Calculate the active filter count matrix */}
{(() => {
  const activeFiltersCount = [filterPlace, filterStartDate, filterEndDate].filter(Boolean).length;

  return (
    <IconButton
      onClick={() => setFilterOpen(true)}
      sx={{
        height: 40,
        width: 40,
        borderRadius: "14px",
        border: 0,
        boxShadow: mode === "dark" 
          ? `inset 0 1px 2px rgba(255, 255, 255, 0.11), inset 0 -1px 1px rgba(35, 35, 35, 0.07)` 
          : `inset 0 1px 1px rgba(255,255,255,0.8), inset 0 -1px 1px rgba(0,0,0,0.1)`,
        backgroundColor: activeFiltersCount > 0 
          ? (isDarkMode ? "#FFF" : "#000") 
          : (mode === "dark" ? "rgba(255, 255, 255, 0)" : "rgba(0, 0, 0, 0.02)"),
        color: activeFiltersCount > 0 
          ? (isDarkMode ? "#000" : "#FFF") 
          : "inherit",
        transition: "all 0.3s ease",
        "&:hover": { 
          backgroundColor: activeFiltersCount > 0 
            ? (isDarkMode ? "rgba(255,255,255,0.85)" : "rgba(0,0,0,0.85)") 
            : "rgba(128,128,128,0.08)" 
        }
      }}
    >
      <Badge 
        badgeContent={activeFiltersCount} 
        color={isDarkMode ? "error" : "primary"}
        sx={{
          "& .MuiBadge-badge": {
            right: -2,
            top: -2,
            fontSize: "0.65rem",
            height: 16,
            minWidth: 16,
            // Adjust contrast badge colors dynamically when the button state toggles
            backgroundColor: activeFiltersCount > 0 
              ? (isDarkMode ? tokens.accent.green : tokens.accent.blue) 
              : undefined,
            color: activeFiltersCount > 0 ? "#000" : undefined
          }
        }}
      >
        <FilterList sx={{ fontSize: 20 }} />
      </Badge>
    </IconButton>
  );
})()}
          </Box>

            <HorizontalInfiniteCalendar trips={filteredTrips} />
          </Box>

                    {/* Liquid Matrix Metric Nodes */}
          <Box sx={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 1.5, mb: 3, px: 3 }}>
            {[
              { val: trips.length, lbl: "Trips" },
              { val: uniqueCountries, lbl: "Places" },
              { val: `₹${(totalBudgetSpent/1000).toFixed(0)}k`, lbl: "Budget" },
              { val: totalDaysTravelled, lbl: "Days" }
            ].map((stat, i) => (
              <Box key={i} sx={{ p: 2, borderRadius: "18px", boxShadow: mode === "dark"
                ? `inset 0 1px 1px rgba(255, 255, 255, 0.11), inset 0 -1px 1px rgba(35, 35, 35, 0.07)`
                : `inset 0 1px 1px rgba(255,255,255,0.8), inset 0 -1px 1px rgba(0,0,0,0.1)`, background: isDarkMode ? "rgba(255,255,255,0.015)" : "rgba(0,0,0,0.015)", textAlign: "center" }}>
                <Typography variant="h5" sx={{ fontWeight: 950, letterSpacing: "-0.5px" }}>{stat.val}</Typography>
                <Typography variant="caption" color="text.secondary" fontWeight={800} sx={{ fontSize: "0.62rem", textTransform: "uppercase", letterSpacing: "0.5px" }}>{stat.lbl}</Typography>
              </Box>
            ))}
          </Box>

          {/* Glitch-free fluid Drag Carousel Canvas window */}
          <Box 
            ref={containerRef} 
            sx={{ 
              overflowX: "hidden", 
              width: "100%", 
              position: "relative",
            }}
          >
            <motion.div
              drag="x"
              dragConstraints={{ left: -((allTabsData.length - 1) * (containerRef.current?.offsetWidth || window.innerWidth)), right: 0 }}
              dragElastic={0.6}
              style={{ x: dragX }}
              animate={carouselControls}
              onDragEnd={handleDragEnd}
              style={{ display: "flex", width: "100%", overflow: "visible", x: dragX }}
            >
              {allTabsData.map((tabTrips, index) => (
                <Box 
                  key={index} 
                  sx={{ 
                    minWidth: "100%", 
                    width: "100%", 
                    px: 2.3,
                    boxSizing: "border-box",
                    opacity: currentTab === index ? 1 : 0.4,
                    scale: currentTab === index ? 1 : 0.96,
                    transition: "opacity 0.2s linear, scale 0.2s linear"
                  }}
                >
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    {tabTrips.length > 0 ? (
                      tabTrips.map(renderTripCard)
                    ) : (
                      <Box id="empty-state-frame" sx={{ textAlign: "center", py: 8, borderRadius: "24px", border: `2px dashed ${isDarkMode ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)"}` }}>
                        <Typography variant="h3" sx={{ mb: 1 }}>🗺️</Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 800 }}>No tracking data instances found in this timeline spectrum.</Typography>
                      </Box>
                    )}
                  </Box>
                </Box>
              ))}
            </motion.div>
          </Box>
        </Container>

        {/* Liquid Action FAB Trigger Node */}
        <Box 
          sx={{ 
            position: "fixed", 
            bottom: 85, 
            right: 41, 
            zIndex: 1100, 
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            gap: 1,
            maxWidth: "100vw",
            pointerEvents: "none" 
          }}
        >
          <Box 
            sx={{ 
              pointerEvents: "auto",
              width: { xs: expanded ? "165px" : "265px", sm: "380px" },
              transition: "width 0.45s cubic-bezier(0.4, 0, 0.2, 1)",
              willChange: "width",
              mt: 0
            }}
          >
            <Tabs
              value={currentTab}
              onChange={(_, v) => setCurrentTab(v)}
              variant="scrollable" 
              scrollButtons={false} 
              sx={{
                minHeight: 44, 
                height: 44,
                backgroundColor: isDarkMode ? "rgba(20, 20, 20, 0.65)" : "rgba(255, 255, 255, 0.25)",
                borderRadius: 8,
                backdropFilter: "blur(20px) saturate(180%)",
                WebkitBackdropFilter: "blur(20px) saturate(180%)",
                boxShadow: mode === "dark"
                  ? `0 8px 32px rgba(0,0,0,0.35), inset 0 1px 1px rgba(255, 255, 255, 0.11), inset 0 -1px 1px rgba(35, 35, 35, 0.07)`
                  : `0 8px 32px rgba(0,0,0,0.06), inset 0 1px 1px rgba(255,255,255,0.8), inset 0 -1px 1px rgba(0,0,0,0.1)`,
                p: '4px',
                '&::-webkit-scrollbar': { display: 'none' },
                msOverflowStyle: 'none',
                scrollbarWidth: 'none',
                '& .MuiTabs-indicator': {
                  height: '100%',
                  borderRadius: 8,
                  backgroundColor: isDarkMode ? "#ffffff" : "#111111",
                  boxShadow: mode === "dark"
                    ? `inset 0 1px 1px rgba(0, 0, 0, 0.2)`
                    : `inset 0 1px 1px rgba(255, 255, 255, 0.3)`,
                  transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1) !important',
                },
                '& .MuiTabs-flexContainer': {
                  height: '100%',
                }
              }}
            >
              {['All', 'Upcoming', 'Ongoing', 'Past'].map((lbl, idx) => {
                const isSelected = currentTab === idx;
                return (
                  <Tab
                    label={lbl}
                    key={idx}
                    disableRipple
                    sx={{
                      textTransform: 'none',
                      fontWeight: 700,
                      fontSize: '0.72rem',
                      letterSpacing: '0.01em',
                      minHeight: '100%',
                      height: '100%',
                      zIndex: 1,
                      minWidth: 'auto', 
                      flexShrink: 0, 
                      whiteSpace: 'nowrap',
                      px: 2, 
                      color: isDarkMode ? 'rgba(255, 255, 255, 0.55)' : 'rgba(0, 0, 0, 0.56)',
                      transition: 'color 0.2s ease',
                      '&.Mui-selected': {
                        color: isDarkMode ? '#000000' : '#ffffff',
                      },
                      '&:hover': {
                        color: isSelected 
                          ? (isDarkMode ? '#000000' : '#ffffff') 
                          : (isDarkMode ? '#ffffff' : '#000000'),
                        opacity: isSelected ? 1 : 0.85,
                      }
                    }}
                  />
                );
              })}
            </Tabs>
          </Box>
          
          <Button
            onClick={() => { setCreateDialogOpen(true); }} 
            onMouseEnter={() => !scrolled && setExpanded(true)}
            onMouseLeave={() => !scrolled && setExpanded(false)}
            startIcon={<SquarePen sx={{ fontSize: expanded ? 27 : 42 }} />}
            sx={{
              pointerEvents: "auto",
              position: "relative",
              overflowX: "hidden",
              flexShrink: 0,
              minWidth: expanded ? { xs: "130px", md: "200px" } : 56,
              height: 56,
              borderRadius: expanded ? "35px" : "50%",
              px: expanded ? 3 : 0,
              transition: "all 0.45s cubic-bezier(0.4, 0, 0.2, 1)",
              willChange: "transform, min-width, border-radius",
              backdropFilter: "blur(2px) saturate(2)",
              WebkitBackdropFilter: "blur(2px) saturate(2)",
              background: mode === "dark" ? "rgba(0, 0, 0, 0.65)" : "rgba(255, 255, 255, 0.25)",
              color: mode === "dark" ? "#fff" : "#000",
              boxShadow: mode === "dark"
                ? `0 8px 32px rgba(0,0,0,0.4), inset 0 1px 2px rgba(255, 255, 255, 0.11), inset 0 -1px 1px rgba(35, 35, 35, 0.07)`
                : `0 8px 32px rgba(0,0,0,0.08), inset 0 1px 1px rgba(255,255,255,0.8), inset 0 -1px 1px rgba(0,0,0,0.1)`,
              "& .MuiButton-startIcon": {
                margin: expanded ? "0 8px 0 0" : 0,
                marginLeft: expanded ? 0 : "0px",
              },
              "&::before": {
                content: '""', position: "absolute", top: 0, left: "-75%", width: "50%", height: "100%",
                background: "linear-gradient(120deg, transparent, rgba(255, 255, 255, 0.17), transparent)",
                transform: "skewX(-20deg)", transition: "all 0.6s ease",
              },
              "&:hover::before": { left: "125%" },
              "&::after": {
                content: '""', position: "absolute", inset: 0, borderRadius: "inherit",
                background: "linear-gradient(to bottom right, rgba(255, 255, 255, 0.13), transparent)",
                opacity: 0.3, pointerEvents: "none",
              },
              "&:hover": { transform: "scale(1.05)" },
            }}
          >
            <AnimatePresence>
              {expanded && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  style={{ whiteSpace: "nowrap", fontWeight: 300, overflow: "hidden" }}
                >
                  New Trip
                </motion.span>
              )}
            </AnimatePresence>
          </Button>
        </Box>

        {/* Advanced Filter Modal Sheet Drawer */}
<SwipeableDrawer
          anchor="bottom" 
          open={filterOpen} 
          onClose={() => setFilterOpen(false)} 
          onOpen={() => {}}
          disableSwipeToOpen
          sx={{ zIndex: 1500 }}
          PaperProps={{
            sx: {
              borderRadius: 8,
              p: 3,
              background: mode === "dark" ? "rgba(20, 20, 20, 0.08)" : "rgba(255, 255, 255, 0.39)",
              backdropFilter: "blur(20px)",
              boxShadow: theme.palette.mode === "dark" 
                ? `inset 0 1px 2px rgba(255, 255, 255, 0.11), inset 0 -1px 1px rgba(35, 35, 35, 0.07)` 
                : `inset 0 1px 1px rgba(255, 255, 255, 0.8), inset 0 -1px 1px rgba(0, 0, 0, 0.1)`,
              maxWidth: 460,
              mx: "auto",
              m: 3
            }
          }}
          ModalProps={{
            BackdropProps: { sx: { backdropFilter: "blur(10px)", backgroundColor: "rgba(0,0,0,0)" } }
          }}
        >
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2.5}>
            <Typography variant="h6" fontWeight="700" sx={{ color: mode === "dark" ? "#fff" : "#000", letterSpacing: "-0.5px" }}>
              Filter Framework Matrix
            </Typography>
            <IconButton 
              onClick={() => setFilterOpen(false)}
              sx={{ color: mode === "dark" ? "#fff" : "#000" }}
            >
              <CloseOutlinedIcon />
            </IconButton>
          </Box>
          
          <Stack spacing={2.5}>
            <TextField
              label="Filter by Location / Place"
              fullWidth
              value={filterPlace}
              onChange={(e) => setFilterPlace(e.target.value)}
              InputProps={{ 
                sx: { 
                  borderRadius: 8,
                  backgroundColor: mode === "dark" ? "rgba(255, 255, 255, 0.03)" : "rgba(0, 0, 0, 0.02)"
                } 
              }}
            />
            
            <Box display="flex" gap={2}>
              <TextField
                label="Timeline Horizon Start"
                type="date"
                InputLabelProps={{ shrink: true }}
                fullWidth
                value={filterStartDate}
                onChange={(e) => setFilterStartDate(e.target.value)}
                InputProps={{ 
                  sx: { 
                    borderRadius: 8,
                    backgroundColor: mode === "dark" ? "rgba(255, 255, 255, 0.03)" : "rgba(0, 0, 0, 0.02)"
                  } 
                }}
              />
              <TextField
                label="Timeline Horizon End"
                type="date"
                InputLabelProps={{ shrink: true }}
                fullWidth
                value={filterEndDate}
                onChange={(e) => setFilterEndDate(e.target.value)}
                InputProps={{ 
                  sx: { 
                    borderRadius: 8,
                    backgroundColor: mode === "dark" ? "rgba(255, 255, 255, 0.03)" : "rgba(0, 0, 0, 0.02)"
                  } 
                }}
              />
            </Box>
            
            <Stack direction="row" spacing={2} justifyContent="center" mt={1}>
              <Button
                fullWidth
                variant="outlined"
                onClick={() => {
                  setFilterPlace("");
                  setFilterStartDate("");
                  setFilterEndDate("");
                  setSearchQuery("");
                }}
                sx={{ 
                  textTransform: "none", 
                  background: mode === "dark" ? "rgba(255, 255, 255, 0.08)" : "rgba(255, 255, 255, 0.42)", 
                  backdropFilter: "blur(10px)", 
                  boxShadow: theme.palette.mode === "dark" 
                    ? `inset 0 1px 2px rgba(255, 255, 255, 0.11), inset 0 -1px 1px rgba(35, 35, 35, 0.07)` 
                    : `inset 0 1px 1px rgba(255, 255, 255, 0.8), inset 0 -1px 1px rgba(0, 0, 0, 0.1)`, 
                  borderRadius: 8, 
                  py: 1.2, 
                  fontWeight: 600, 
                  border: "none", 
                  color: mode === "dark" ? "#fff" : "#000", 
                  "&:hover": { backgroundColor: mode === "dark" ? "rgba(255, 255, 255, 0.05)" : "#f5f5f5" } 
                }}
              >
                Clear
              </Button>
              
              <Button
                fullWidth
                variant="contained"
                onClick={() => setFilterOpen(false)}
                sx={{ 
                  textTransform: "none", 
                  background: mode === "dark" ? "rgba(255, 255, 255, 0.85)" : "rgba(0, 0, 0, 0.85)", 
                  backdropFilter: "blur(10px)", 
                  boxShadow: theme.palette.mode === "dark" 
                    ? `inset 0 1px 2px rgba(255, 255, 255, 0.11), inset 0 -1px 1px rgba(35, 35, 35, 0.07)` 
                    : `inset 0 1px 1px rgba(255, 255, 255, 0.8), inset 0 -1px 1px rgba(0, 0, 0, 0.1)`, 
                  borderRadius: 8, 
                  py: 1.2, 
                  fontWeight: 600, 
                  color: mode === "dark" ? "#000" : "#fff", 
                  "&:hover": { backgroundColor: mode === "dark" ? "#fff" : "#222" } 
                }}
              >
                Apply Filter
              </Button>
            </Stack>
          </Stack>
        </SwipeableDrawer>

        {/* Architectural Creation Frame Drawer Component */}
        <Drawer anchor="bottom" open={createDialogOpen} onClose={() => { setCreateDialogOpen(false); setStep(0); }} sx={{ "& .MuiDrawer-paper": { height: "100vh", backgroundColor: isDarkMode ? tokens.dark.bg : tokens.light.bg, color: isDarkMode ? "#FFF" : "#000" } }}>
          <Box sx={{ position: "relative", height: "22vh", overflow: "hidden" }}>
            <Box sx={{ width: "100%", height: "100%", backgroundImage: `url(${newTrip.iconDataUri || randomNatureImage || 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1000&q=80'})`, backgroundSize: "cover", backgroundPosition: "center" }} />
            <Box sx={{ position: "absolute", inset: 0, background: currentTokens.glassMelt }} />
            <IconButton onClick={() => { setCreateDialogOpen(false); setStep(0); }} sx={{ position: "absolute", top: 16, right: 16, backgroundColor: "rgba(0,0,0,0.45)", color: "#FFF" }}><CloseOutlinedIcon /></IconButton>
            <Box sx={{ position: "absolute", bottom: 16, left: 24 }}><Typography variant="h4" sx={{ fontWeight: 950, color: "#FFF", letterSpacing: "-1px" }}>Build Adventure</Typography></Box>
            <Button component="label" startIcon={<PhotoCamera />} sx={{ position: "absolute", bottom: 16, right: 24, borderRadius: "8px", textTransform: "none", fontSize: "0.68rem", fontWeight: 800, backgroundColor: "rgba(255,255,255,0.12)", color: "#FFF", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.1)" }}>Cover<input type="file" accept="image/*" hidden onChange={handleIconUpload} /></Button>
          </Box>

          <Box sx={{ p: 3, mx: "auto", maxWidth: 460, width: "100%" }}>
            <Stepper activeStep={step} alternativeLabel sx={{ mb: 4, "& .MuiStepIcon-root.Mui-active, & .MuiStepIcon-root.Mui-completed": { color: tokens.accent.blue } }}>
              <Step><StepLabel>Parameters</StepLabel></Step>
              <Step><StepLabel>Deploy Matrix</StepLabel></Step>
            </Stepper>

            <Fade in>
              <Box>
                {step === 0 ? (
                  <DialogContent sx={{ p: 0, display: "flex", flexDirection: "column", gap: 2.5 }}>
                    <TextField label="Trip Designation Name" fullWidth value={newTrip.name} onChange={e => setNewTrip({ ...newTrip, name: e.target.value })} InputProps={{ sx: { borderRadius: "12px" } }} />
                    <Box display="flex" gap={2}>
                      <TextField label="Origin" fullWidth value={newTrip.from} onChange={e => setNewTrip({ ...newTrip, from: e.target.value })} InputProps={{ sx: { borderRadius: "12px" } }} />
                      <TextField label="Destination" fullWidth value={newTrip.to} onChange={e => setNewTrip({ ...newTrip, to: e.target.value })} InputProps={{ sx: { borderRadius: "12px" } }} />
                    </Box>
                    <TextField label="Spatial Route Coordinates" fullWidth value={newTrip.location} onChange={e => setNewTrip({ ...newTrip, location: e.target.value })} InputProps={{ sx: { borderRadius: "12px" } }} />
                    <Box display="flex" gap={2}>
                      <TextField label="Start" type="date" InputLabelProps={{ shrink: true }} fullWidth value={newTrip.startDate} onChange={e => setNewTrip({ ...newTrip, startDate: e.target.value })} InputProps={{ sx: { borderRadius: "12px" } }} />
                      <TextField label="End" type="date" InputLabelProps={{ shrink: true }} fullWidth value={newTrip.endDate} onChange={e => setNewTrip({ ...newTrip, endDate: e.target.value })} InputProps={{ sx: { borderRadius: "12px" } }} />
                    </Box>
                    <Box display="flex" gap={2}>
                      <Autocomplete options={["Adventure", "Leisure", "Business", "Backpacking"]} value={newTrip.travelType} onChange={(_, v) => setNewTrip({ ...newTrip, travelType: v || "Adventure" })} renderInput={(p) => <TextField {...p} label="Vector Category" />} fullWidth sx={{ "& .MuiOutlinedInput-root": { borderRadius: "12px" } }} />
                      <TextField label="Target Allocation (₹)" type="number" fullWidth value={newTrip.budgetGoal} onChange={e => setNewTrip({ ...newTrip, budgetGoal: e.target.value })} InputProps={{ sx: { borderRadius: "12px" } }} />
                    </Box>
                    <DialogActions sx={{ mt: 3, p: 0, gap: 2 }}>
                      <Button fullWidth onClick={() => setCreateDialogOpen(false)} sx={{ borderRadius: "12px", height: 46, textTransform: "none", fontWeight: 800, border: `1px solid ${isDarkMode ? "#222" : "#E2E2E2"}`, color: "inherit" }}>Cancel</Button>
                      <Button fullWidth variant="contained" onClick={handleNext} endIcon={<ArrowForward />} sx={{ borderRadius: "12px", height: 46, textTransform: "none", fontWeight: 800, background: isDarkMode ? "#FFF" : "#000", color: isDarkMode ? "#000" : "#FFF" }}>Continue</Button>
                    </DialogActions>
                  </DialogContent>
                ) : (
                  <DialogContent sx={{ p: 0, display: "flex", flexDirection: "column", gap: 2.5 }}>
                    <Autocomplete freeSolo options={userSuggestions} getOptionLabel={o => `${o.name || o.username} (${o.email})`} inputValue={memberInput} onInputChange={(_, v) => { setMemberInput(v); handleSearchUsers(v); }} onChange={(_, value) => value && handleAddMember(value)} renderInput={params => <TextField {...params} label="Search Account Network" InputProps={{ ...params.InputProps, sx: { borderRadius: "12px" } }} />} />
                    
                    {friendCards.length > 0 && (
                      <Box>
                        <Stack direction="row" spacing={1} sx={{ overflowX: "auto", pb: 0.5, "&::-webkit-scrollbar": { display: "none" } }}>
                          {friendCards.map(friend => (
                            <Card key={friend.uid} sx={{ p: 1.5, minWidth: 96, textAlign: "center", borderRadius: "14px", background: "rgba(128,128,128,0.03)", boxShadow: "none", border: "inherit" }}>
                              <Avatar src={friend.photoURL} sx={{ mx: "auto", width: 36, height: 36, mb: 0.5 }} />
                              <Typography variant="caption" noWrap sx={{ fontWeight: 800, display: "block", fontSize: "0.65rem" }}>{friend.name || friend.username}</Typography>
                              <Button size="small" onClick={() => handleAddMember(friend)} sx={{ mt: 0.5, height: 20, fontSize: "0.6rem", background: isDarkMode ? "#FFF" : "#000", color: isDarkMode ? "#000" : "#FFF", textTransform: "none" }}>Add</Button>
                            </Card>
                          ))}
                        </Stack>
                      </Box>
                    )}

                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                      {selectedMembers.map(m => <Chip key={m.uid} avatar={<Avatar src={m.photoURL} />} label={m.name} onDelete={() => handleRemoveMember(m.uid)} sx={{ borderRadius: "8px" }} />)}
                    </Box>

                    <Stack spacing={1} sx={{ maxHeight: "20vh", overflowY: "auto" }}>
                      {selectedMembers.map((m, i) => (
                        <Box key={m.uid} display="flex" alignItems="center" justifyContent="space-between" sx={{ p: 1, borderRadius: "10px", background: "rgba(128,128,128,0.02)" }}>
                          <Box display="flex" alignItems="center" gap={1}><Avatar src={m.photoURL} sx={{ width: 32, height: 32 }} /><Typography variant="caption" fontWeight={700}>{m.name}</Typography></Box>
                          <TextField label="Contribution" size="small" type="number" value={m.contribution} onChange={e => handleContributionChange(i, e.target.value)} sx={{ width: 100, "& .MuiOutlinedInput-root": { borderRadius: "8px" } }} />
                        </Box>
                      ))}
                    </Stack>

                    <DialogActions sx={{ mt: 2, p: 0, gap: 2 }}>
                      <Button fullWidth onClick={handleBack} sx={{ borderRadius: "12px", height: 46, textTransform: "none", fontWeight: 800, border: `1px solid ${isDarkMode ? "#222" : "#E2E2E2"}`, color: "inherit" }}>Back</Button>
                      <Button fullWidth variant="contained" onClick={handleCreateTrip} sx={{ borderRadius: "12px", height: 46, textTransform: "none", fontWeight: 800, background: tokens.accent.green, color: "#000" }}>Deploy Framework</Button>
                    </DialogActions>
                  </DialogContent>
                )}
              </Box>
            </Fade>
          </Box>
        </Drawer>

        {/* Spec Crop drawer Utility Layer */}
        <Drawer anchor="bottom" open={cropDrawerOpen} onClose={() => setCropDrawerOpen(false)} sx={{ zIndex: 1400 }}>
          <DialogContent sx={{ p: 3, maxWidth: 420, mx: "auto", width: "100%", backgroundColor: isDarkMode ? "#121212" : "#FFF" }}>
            {uploadedImageSrc && (
              <Box sx={{ position: "relative", height: 220, width: "100%", borderRadius: "14px", overflow: "hidden" }}>
                <Cropper image={uploadedImageSrc} crop={crop} zoom={zoom} aspect={1.77} onCropChange={setCrop} onZoomChange={setZoom} onCropComplete={onCropComplete} />
              </Box>
            )}
            <Slider value={zoom} min={1} max={3} step={0.01} onChange={(_, v) => setZoom(v)} sx={{ color: isDarkMode ? "#FFF" : "#000", mt: 3 }} />
            <Box display="flex" gap={2} mt={2}>
              <Button fullWidth variant="outlined" onClick={() => setCropDrawerOpen(false)} sx={{ borderRadius: "10px", textTransform: "none" }}>Drop</Button>
              <Button fullWidth variant="contained" onClick={handleContinueCrop} sx={{ borderRadius: "10px", textTransform: "none", background: isDarkMode ? "#FFF" : "#000", color: isDarkMode ? "#000" : "#FFF" }}>Commit</Button>
            </Box>
          </DialogContent>
        </Drawer>
      </Box>
    </ThemeProvider>
  );
}