import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  Box,
  Typography,
  Button,
  Container,
  Card,
  CardContent,
  DialogContent,
  TextField,
  AvatarGroup,
  Avatar,
  IconButton,
  Stack,
  ThemeProvider,
  Chip,
  Tabs,
  Tab,
  Drawer,
  Slider,
  Slide,
  Tooltip,
  LinearProgress,
  InputAdornment,
  Badge,
  ListItem,
  ListItemAvatar,
  ListItemText,
  CircularProgress,
  Zoom,
  List,
  SwipeableDrawer,
} from "@mui/material";
import {
  LocationOn,
  ArrowForward,
  Search,
  FilterList,
  PushPin as PushPinIcon,
  MoreVert as MoreVertIcon,
  Share as ShareIcon,
  CalendarToday as CalendarTodayIcon,
  DeleteOutline as DeleteOutlineIcon,
  Add as AddIcon,
  CloseOutlined as CloseOutlinedIcon,
} from "../icons";
import { db, auth } from "../firebase";
import {
  collection,
  getDocs,
  addDoc,
  query,
  where,
  setDoc,
  doc,
  updateDoc,
  onSnapshot,
  getDoc,
  deleteDoc,
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { useThemeToggle } from "../contexts/ThemeToggleContext";
import { getTheme } from "../theme";
import Cropper from "react-easy-crop";
import Notifications from "../elements/Notifications";
import { motion, AnimatePresence, useAnimation } from "framer-motion";
import { useBackButtonClose } from "../hooks/useBackButtonClose";
import { SquarePen } from "lucide-react"; 
import CreateTripDrawer from "../components/trips_components/CreateDrawer";
import {
  designTokens as tokens,
  glass,
  cardHover,
  drawerPaperSx,
  drawerBackdropSx,
  drawerHandleSx,
  searchFieldSx,
  floatingButtonSx,
  DrawerHandle,
} from "../theme/designSystem";

const getTripColor = (id) => {
  const colors = [tokens.accents.blue, tokens.accents.green, tokens.accents.amber];
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
  const desc = `DESCRIPTION:Trip from ${trip.from} to ${trip.to}. Managed via BunkMates.`;

  const icsData = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PROID:-//BunkMates//Trip Planner//EN",
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
  const [friendCards, setFriendCards] = useState([]);
  const [latestTripId, setLatestTripId] = useState(null);
  const [createdTripDetails, setCreatedTripDetails] = useState(null);

  const [pinnedTripIds, setPinnedTripIds] = useState([]);

  const [searchQuery, setSearchQuery] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [filterPlace, setFilterPlace] = useState("");
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");

  const [cropDrawerOpen, setCropDrawerOpen] = useState(false);
  const [uploadedImageSrc, setUploadedImageSrc] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const [selectedTrip, setSelectedTrip] = useState(null);
  const [actionMode, setActionMode] = useState(false);
  const [shareDrawerOpen, setShareDrawerOpen] = useState(false);
  const [searchFriendQuery, setSearchFriendQuery] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [loadingFriends, setLoadingFriends] = useState(false);

  const { mode, accent } = useThemeToggle();
  const theme = getTheme(mode, accent);
  const isDarkMode = mode === 'dark';
  const navigate = useNavigate();
  const user = auth.currentUser;
  const [randomNatureImage, setRandomNatureImage] = useState("");

  const [expanded, setExpanded] = useState(true);
  const [scrolled, setScrolled] = useState(false);

  useBackButtonClose(createDialogOpen, () => handleCloseDrawer());
  useBackButtonClose(cropDrawerOpen, () => setCropDrawerOpen(false));
  useBackButtonClose(filterOpen, () => setFilterOpen(false));
  useBackButtonClose(actionMode, () => setActionMode(false));
  useBackButtonClose(shareDrawerOpen, () => setShareDrawerOpen(false));
  useBackButtonClose(deleteDialogOpen, () => setDeleteDialogOpen(false));

  const handleCloseDrawer = () => {
    setCreateDialogOpen(false);
    setStep(0);
    setNewTrip({ name: "", from: "", to: "", location: "", startDate: "", endDate: "", iconDataUri: "", travelType: "Adventure", budgetGoal: "" });
    setSelectedMembers([]);
    setCreatedTripDetails(null);
  };

  useEffect(() => {
    if (user) {
      const savedPinned = localStorage.getItem(`bunkmate.pinnedTrips.${user.uid}`);
      if (savedPinned) {
        try {
          setPinnedTripIds(JSON.parse(savedPinned));
        } catch (e) {
          console.warn("Failed parsing local storage matrix logs:", e);
        }
      }
    }
  }, [user]);

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

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "trips"), where("members", "array-contains", user.uid));
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
    setStep(prev => prev + 1);
  };
  const handleBack = () => setStep(prev => prev - 1);

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

  // Updated handleCreateTrip to return trip details and keep drawer open if requested
  const handleCreateTrip = async (options = {}) => {
    const { name, from, to, location, startDate, endDate, iconDataUri, description } = newTrip;
    const iconURL = iconDataUri || randomNatureImage;
    const members = selectedMembers.map(m => m.uid);
    const contributors = selectedMembers.map(m => ({ uid: m.uid, name: m.name || m.username, amount: parseInt(m.contribution || 0) }));
    const total = contributors.reduce((sum, c) => sum + c.amount, 0);

    try {
      const tripDoc = await addDoc(collection(db, "trips"), { 
        name: name || `${from} to ${to}`, 
        from: from || "", 
        to: to || "", 
        location: location || `${from} → ${to}`, 
        description: description || "",
        startDate: startDate || "", 
        endDate: endDate || "", 
        members, 
        createdBy: user.uid, 
        createdAt: new Date().toISOString() 
      });
      await setDoc(doc(db, "groupChats", tripDoc.id), { tripId: tripDoc.id, name: `${from} → ${to}`, members, iconURL, createdBy: user.uid, createdAt: new Date().toISOString() });
      await setDoc(doc(db, "budgets", tripDoc.id), { tripId: tripDoc.id, tripName: name, total, used: 0, contributors, createdBy: user.uid, createdAt: new Date().toISOString() });
      
      const tripDetails = { id: tripDoc.id, name, from, to, location, startDate, endDate, members };
      setCreatedTripDetails(tripDetails);
      setLatestTripId(tripDoc.id);

      if (!options?.keepOpen) {
        handleCloseDrawer();
      }

      return tripDetails;
    } catch (error) { 
      alert(error.message); 
      throw error;
    }
  };

  const fetchFriendsNetwork = async () => {
    if (!user) return;
    setLoadingFriends(true);
    try {
      const uSnap = await getDoc(doc(db, "users", user.uid));
      if (uSnap.exists()) {
        const friendIds = uSnap.data().friends || [];
        const chunk = [];
        for (const fId of friendIds) {
          const fSnap = await getDoc(doc(db, "users", fId));
          if (fSnap.exists()) {
            const d = fSnap.data();
            chunk.push({ uid: fSnap.id, name: d.name || d.displayName || "Anonymous", username: d.username || "", photoURL: d.photoURL || "" });
          }
        }
        setFriendsList(chunk);
      }
    } catch (e) { console.error(e); }
    setLoadingFriends(false);
  };

  const handleToggleTripCollaborator = async (fUid) => {
    if (!selectedTrip) return;
    const isMember = selectedTrip.members.includes(fUid);
    const updatedMembers = isMember ? selectedTrip.members.filter(id => id !== fUid) : [...selectedTrip.members, fUid];
    try {
      await updateDoc(doc(db, "trips", selectedTrip.id), { members: updatedMembers });
      await updateDoc(doc(db, "groupChats", selectedTrip.id), { members: updatedMembers });
      setSelectedTrip(prev => ({ ...prev, members: updatedMembers }));
    } catch (e) { console.error(e); }
  };

  const handleDeleteTrip = async () => {
    if (!selectedTrip) return;
    try {
      await deleteDoc(doc(db, "trips", selectedTrip.id));
      await deleteDoc(doc(db, "groupChats", selectedTrip.id));
      await deleteDoc(doc(db, "budgets", selectedTrip.id));
      setDeleteDialogOpen(false);
      setActionMode(false);
    } catch (e) { console.error(e); }
  };

  const [friendsList, setFriendsList] = useState([]);
  const filteredFriends = useMemo(() => {
    return friendsList.filter(f => f.name.toLowerCase().includes(searchFriendQuery.toLowerCase()));
  }, [friendsList, searchFriendQuery]);

  const today = useMemo(() => new Date(), []);
  
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

  const sortPinnedFirst = useCallback((a, b) => {
    const aPinned = pinnedTripIds.includes(a.id);
    const bPinned = pinnedTripIds.includes(b.id);
    return (bPinned ? 1 : 0) - (aPinned ? 1 : 0);
  }, [pinnedTripIds]);

  const { upcomingTrips, ongoingTrips, pastTrips } = useMemo(() => {
    const pooled = [...filteredTrips].sort(sortPinnedFirst);
    return {
      upcomingTrips: pooled.filter(t => new Date(t.startDate) > today),
      ongoingTrips: pooled.filter(t => new Date(t.startDate) <= today && new Date(t.endDate) >= today),
      pastTrips: pooled.filter(t => new Date(t.endDate) < today)
    };
  }, [filteredTrips, today, sortPinnedFirst]);

  const allTabsData = useMemo(() => [
    [...filteredTrips].sort(sortPinnedFirst),
    upcomingTrips,
    ongoingTrips,
    pastTrips
  ], [filteredTrips, upcomingTrips, ongoingTrips, pastTrips]);

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

  const timeoutRef = useRef(null);
  const isLongPressTriggeredRef = useRef(false);
  const coordinatesRef = useRef({ x: 0, y: 0 });

  const renderTripCard = (trip) => {
    const isNew = trip.id === latestTripId;
    const isSelected = selectedTrip?.id === trip.id && actionMode;

    return (
      <Slide in direction="up" timeout={isNew ? 600 : 0} mountOnEnter unmountOnExit key={trip.id}>
        <div
          style={{
            filter: actionMode && !isSelected ? "blur(4px)" : "none",
            opacity: actionMode && !isSelected ? 0.35 : 1,
            transition: "all 0.3s ease"
          }}
        >
          <Card
            id={`trip-${trip.id}`}
            onMouseDown={(e) => {
              coordinatesRef.current = { x: e.clientX, y: e.clientY };
              isLongPressTriggeredRef.current = false;
              timeoutRef.current = setTimeout(() => {
                isLongPressTriggeredRef.current = true;
                setSelectedTrip(trip);
                setActionMode(true);
              }, 600);
            }}
            onTouchStart={(e) => {
              coordinatesRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
              isLongPressTriggeredRef.current = false;
              timeoutRef.current = setTimeout(() => {
                isLongPressTriggeredRef.current = true;
                setSelectedTrip(trip);
                setActionMode(true);
              }, 600);
            }}
            onMouseMove={(e) => {
              if (!timeoutRef.current) return;
              if (Math.abs(e.clientX - coordinatesRef.current.x) > 10 || Math.abs(e.clientY - coordinatesRef.current.y) > 10) {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
              }
            }}
            onTouchMove={(e) => {
              if (!timeoutRef.current) return;
              if (Math.abs(e.touches[0].clientX - coordinatesRef.current.x) > 10 || Math.abs(e.touches[0].clientY - coordinatesRef.current.y) > 10) {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
              }
            }}
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
              cursor: "pointer",
              WebkitTapHighlightColor: "transparent",
              '&:hover': { transform: "scale(1.015)" },
              ...(isSelected && {
                transform: "scale(1.03) translateY(-4px) !important",
                zIndex: 10
              })
            }}
          >
            <Tooltip title="Trip Menu Matrix Options">
              <IconButton
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  setSelectedTrip(trip);
                  setActionMode(true);
                }}
                sx={{
                  position: 'absolute',
                  top: 5,
                  right: 5,
                  zIndex: 50,
                  color: mode === 'dark' ? '#ffffff' : '#000000',
                  background: mode === "dark" ? "rgba(30, 30, 30, 0.22)" : "rgba(255, 255, 255, 0.4)",
                  boxShadow: theme.palette.mode === "dark" ? `inset 0 1px 2px rgba(255, 255, 255, 0.11), inset 0 -1px 1px rgba(35, 35, 35, 0.07)` : `inset 0 1px 1px rgba(255,255,255,0.8), inset 0 -1px 1px rgba(0,0,0,0.1)`,
                  backdropFilter: 'blur(20px)',
                  '&:hover': { backgroundColor: mode === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)' }
                }}
              >
                <MoreVertIcon sx={{ fontSize: 20 }} /> 
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
        </div>
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
                onClick={() => { 
                  if (hasTrips) {
                    const targetTrip = active[0];
                    scrollToAndHighlightTrip(targetTrip.id, markerColor);
                    setSelectedTrip(targetTrip);
                    setActionMode(true);
                  } 
                }}
                sx={{
                  minWidth: 46, height: 62, borderRadius: 8, display: "flex", flexDirection: "column", alignItems: "center", justifyOrigin: "center", justifyContent: "center", position: "relative",
                  background: hasTrips ? markerColor + "30" : isCurrent ? (isDarkMode ? "#FFF" : "#000") : "transparent",
                  color: isCurrent ? (isDarkMode ? "#000" : "#FFF") : "inherit",
                  border: hasTrips ? `0px solid ${markerColor}` : `1px solid ${isDarkMode ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)"}`,
                  boxShadow: isDarkMode
                    ? `inset 0 1px 1px rgba(255, 255, 255, 0.11), inset 0 -1px 1px rgba(35, 35, 35, 0.07)`
                    : `inset 0 1px 1px rgba(255,255,255,0.8), inset 0 -1px 1px rgba(0,0,0,0.1)`,
                  backdropFilter: "blur(15px)",
                  webkitBackdropFilter: "blur(15px)", 
                  cursor: hasTrips ? "pointer" : "default",
                  transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
                  "&:hover": hasTrips ? {
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

  const isSelectedTripPinned = useMemo(() => {
    return selectedTrip ? pinnedTripIds.includes(selectedTrip.id) : false;
  }, [selectedTrip, pinnedTripIds]);

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ minHeight: "100vh", mt: 5, color: isDarkMode ? "#FFF" : "#000", pb: 12, position: "relative" }}>
        <AmbientLiquidGrain />
        <Container sx={{ px: 0 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={-3} sx={{ p: 1.1, px: 3}}>
            <Box zIndex={112}>
              <Typography variant="h4" sx={{ fontWeight: 950, letterSpacing: "-1.8px", mt: 0.2 }}>Where next?</Typography>
            </Box>
            <Box zIndex={112}>
              <Notifications/>
            </Box>
          </Box>
          
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
                    color: mode === "dark" ? "#fff" : "#111", borderRadius: 8, height: 44, backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)", backgroundColor: mode === "dark" ? "rgba(0, 0, 0, 0.2)" : "rgba(255, 255, 255, 0.2)",
                    boxShadow: mode === "dark" ? `inset 0 1px 2px rgba(255, 255, 255, 0.11), inset 0 -1px 1px rgba(35, 35, 35, 0.07)` : `inset 0 1px 1px rgba(255,255,255,0.8), inset 0 -1px 1px rgba(0,0,0,0.1)`,
                    border: "0px solid", borderColor: mode === "dark" ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.06)", transition: "all 0.2s ease-in-out", "& fieldset": { border: "none" },
                    "&:hover": { backgroundColor: mode === "dark" ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.05)", borderColor: mode === "dark" ? "rgba(255, 255, 255, 0.18)" : "rgba(0, 0, 0, 0.12)" },
                    "&.Mui-focused": { backgroundColor: mode === "dark" ? "rgba(255, 255, 255, 0.04)" : "rgba(255, 255, 255, 0.8)", borderColor: mode === "dark" ? "rgba(255, 255, 255, 0)" : "primary.main", boxShadow: mode === "dark" ? `0 0 0 3px rgba(255, 255, 255, 0.05)` : `0 0 0 3px rgba(25, 118, 210, 0.15)` }
                  },
                  "& .MuiOutlinedInput-input": { py: 1.2, fontSize: "0.9rem", color: mode === "dark" ? "rgba(255, 255, 255, 0.9)" : "rgba(0, 0, 0, 0.85)", "&::placeholder": { color: mode === "dark" ? "rgba(255, 255, 255, 0.4)" : "rgba(0, 0, 0, 0.4)", opacity: 1 } }
                }}
              />
              {(() => {
                const activeFiltersCount = [filterPlace, filterStartDate, filterEndDate].filter(Boolean).length;

                return (
                  <IconButton
                    onClick={() => setFilterOpen(true)}
                    sx={{
                      height: 44,
                      width: 44,
                      borderRadius: 8,
                      border: 0,
                      boxShadow: mode === "dark" 
                        ? `inset 0 1px 2px rgba(255, 255, 255, 0.11), inset 0 -1px 1px rgba(35, 35, 35, 0.07)` 
                        : `inset 0 1px 1px rgba(255,255,255,0.8), inset 0 -1px 1px rgba(0,0,0,0.1)`,
                      backgroundColor: activeFiltersCount > 0 
                        ? (isDarkMode ? "#FFF" : "#000") 
                        : (mode === "dark" ? "rgba(0, 0, 0, 0.2)" : "rgba(255, 255, 255, 0.2)"),
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

          <Box sx={{ width: "100%", px: 2.3, mb: 7, boxSizing: "border-box" }}>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {allTabsData[currentTab] && allTabsData[currentTab].length > 0 ? (
                allTabsData[currentTab].map(renderTripCard)
              ) : (
                <Box id="empty-state-frame" sx={{ textAlign: "center", py: 8, borderRadius: "24px", border: `2px dashed ${isDarkMode ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)"}` }}>
                  <Typography variant="h3" sx={{ mb: 1 }}>🗺️</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 800 }}>No tracking data instances found in this timeline spectrum.</Typography>
                </Box>
              )}
            </Box>
          </Box>
        </Container>

        <AnimatePresence>
          {actionMode && selectedTrip && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25, ease: "easeInOut" }}
                style={{
                  position: "fixed",
                  inset: 0,
                  zIndex: 1300,
                  WebkitOverflowScrolling: "touch",
                  backdropFilter: "blur(10px) saturate(140%)",
                  WebkitBackdropFilter: "blur(10px) saturate(140%)",
                  background: "rgba(0, 0, 0, 0.1)",
                  overflowY: "auto"
                }}
                onClick={() => setActionMode(false)}
              />

              <motion.div 
                initial={{ scale: 0.75, opacity: 0, y: 80 }} 
                animate={{ scale: 1, opacity: 1, y: 0 }} 
                exit={{ scale: 0.8, opacity: 0, y: 50 }}
                transition={{ 
                  type: "spring", 
                  damping: 14,
                  stiffness: 240,
                  mass: 0.8
                }}
                style={{ 
                  position: "fixed", 
                  top: "7%", 
                  left: 0,
                  right: 0,
                  margin: "0 auto",
                  zIndex: 1302, 
                  width: "calc(100% - 32px)", 
                  maxWidth: "540px",
                  maxHeight: "68vh", 
                  display: "flex", 
                  flexDirection: "column" 
                }}
              >
                <Box sx={{ mx: "auto", width: "100%", height: 400 }}>
                  <Box
                    sx={(theme) => ({
                      borderRadius: 8,
                      mb: 2,
                      overflow: "hidden",
                      position: "relative",
                      backgroundImage: `url(${selectedTrip.iconURL})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                      height: "calc(100% - 32px)", 
                      maxHeight: 280,
                      boxShadow:
                        theme.palette.mode === "dark"
                          ? `inset 0 1px 2px rgba(255,255,255,0.11), inset 0 -1px 1px rgba(35, 35, 35, 0.07)`
                          : `inset 0 1px 1px rgba(255,255,255,0.8), inset 0 -1px 1px rgba(0,0,0,0.1)`,
                    })}
                  >
                    <Box
                      sx={{
                        position: "absolute",
                        bottom: 0,
                        left: 0,
                        right: 0,
                        zIndex: 1,
                        height: 250,
                        pointerEvents: "none",
                        backdropFilter: "blur(80px)", 
                        WebkitBackdropFilter: "blur(80px)", 
                        maskImage: `linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0.92) 18%, rgba(0,0,0,0.72) 38%, rgba(0,0,0,0.42) 62%, rgba(0,0,0,0.12) 82%, rgba(0,0,0,0) 100%)`, 
                        WebkitMaskImage: `linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0.92) 18%, rgba(0,0,0,0.72) 38%, rgba(0,0,0,0.42) 62%, rgba(0,0,0,0.12) 82%, rgba(0,0,0,0) 100%)`, 
                        background: mode === "dark" 
                          ? `linear-gradient(to top, rgba(0, 0, 0, 0.5), rgba(0,0,0,0))` 
                          : `linear-gradient(to top, rgba(255, 255, 255, 0.0), rgba(255,255,255,0))`
                      }}
                    />

                    <Box
                      sx={{
                        position: "absolute",
                        zIndex: 2,
                        bottom: 0,
                        p: 3,
                        pt: selectedTrip.iconURL ? 2 : 3,
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: "row",
                          justifyContent: "space-between",
                          alignItems: "center",
                          gap: 1,
                          color: mode === "dark" ? "#fff" : "#000000",
                        }}
                      >
                        <Typography
                          variant="h5"
                          fontWeight={700}
                          sx={{
                            borderBottom: `2px solid ${mode === "dark" ? "#f1f1f172" : "#0000007c"}`,
                            pb: 1,
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          {selectedTrip.name}
                        </Typography>
                        <Stack direction="row" spacing={1} alignItems="center">
                          {isSelectedTripPinned && (
                            <Chip
                              label="Pinned"
                              size="small"
                              variant="filled"
                              sx={{
                                fontWeight: 800,
                                fontSize: "0.65rem",
                                letterSpacing: "0.02em",
                                height: 22,
                                borderRadius: 8,
                                textTransform: "uppercase",
                                backdropFilter: "blur(8px) saturate(120%)",
                                WebkitBackdropFilter: "blur(8px) saturate(120%)",
                                backgroundColor: mode === "dark" ? "rgba(255, 255, 255, 0.92)" : "rgba(0, 0, 0, 0.53)",
                                color: mode === "dark" ? "#000000" : "#ffffff",
                                boxShadow: mode === "dark"
                                  ? `inset 0 1px 1px rgba(255, 255, 255, 0.1), 0 4px 12px rgba(35, 35, 35, 0.07)`
                                  : `inset 0 1px 1px rgba(255, 255, 255, 0.6), 0 4px 12px rgba(245, 158, 11, 0.05)`,
                                "& .MuiChip-label": { px: 1 }
                              }}
                            />
                          )}

                          <Chip
                            label={selectedTrip.travelType || "Adventure"}
                            size="small"
                            variant="outlined"
                            sx={{
                              fontWeight: 700,
                              fontSize: "0.68rem",
                              height: 22,
                              borderRadius: 8,
                              backdropFilter: "blur(10px) saturate(120%)",
                              WebkitBackdropFilter: "blur(10px) saturate(120%)",
                              backgroundColor: mode === "dark" ? "rgba(255, 255, 255, 0.03)" : "rgba(0, 0, 0, 0.03)",
                              border: `0px solid ${mode === "dark" ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.06)"}`,
                              color: mode === "dark" ? "rgba(255, 255, 255, 0.85)" : "rgba(0, 0, 0, 0.8)",
                              boxShadow: mode === "dark"
                                ? `inset 0 1px 2px rgba(255, 255, 255, 0.11), inset 0 -1px 1px rgba(35, 35, 35, 0.07)`
                                : `inset 0 1px 1px rgba(255, 255, 255, 0.8), inset 0 -1px 1px rgba(0, 0, 0, 0.1)`,
                              "& .MuiChip-label": { px: 1 }
                            }}
                          />
                        </Stack>
                      </Box>

                      <Box sx={{ mt: 1.5 }}>
                        <Typography variant="body1" sx={{ fontWeight: 600, display: "flex", alignItems: "center", gap: 1 }}>
                          <LocationOn fontSize="small" />
                          {selectedTrip.location}
                        </Typography>
                        <Typography variant="body2" color="text.primary" sx={{ mt: 0.5, pl: 3 }}>
                          Route Direction Matrix: {selectedTrip.from} → {selectedTrip.to}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>

                  <Box sx={{ overflowY: "auto", pr: 1, height: "auto", borderRadius: 8, p: 1, background: "transparent" }}>
                    <Stack spacing={2}>
                      {selectedTrip.budget && (
                        <Box 
                          sx={{ 
                            p: 2.5, 
                            borderRadius: 6, 
                            display: "flex",
                            alignItems: "center",
                            gap: 2.5,
                            backdropFilter: "blur(20px) saturate(180%)", 
                            WebkitBackdropFilter: "blur(20px) saturate(180%)", 
                            background: mode === "dark" ? "rgba(255, 255, 255, 0.02)" : "rgba(0, 0, 0, 0.02)", 
                            border: `1px solid ${mode === "dark" ? "rgba(255, 255, 255, 0.06)" : "rgba(0, 0, 0, 0.05)"}`,
                            boxShadow: theme.palette.mode === "dark" 
                              ? `inset 0 1px 2px rgba(255, 255, 255, 0.11), inset 0 -1px 1px rgba(35, 35, 35, 0.07)` 
                              : `inset 0 1px 1px rgba(255,255,255,0.8), inset 0 -1px 1px rgba(0, 0, 0, 0.05)` 
                          }}
                        >
                          <Box sx={{ position: "relative", display: "inline-flex", flexShrink: 0 }}>
                            <CircularProgress
                              variant="determinate"
                              value={100}
                              size={58}
                              thickness={5}
                              sx={{ color: mode === "dark" ? "rgba(255, 255, 255, 0.06)" : "rgba(0, 0, 0, 0.06)", position: "absolute", left: 0 }}
                            />
                            <CircularProgress
                              variant="determinate"
                              value={Math.min(100, selectedTrip.budget.amount ? (selectedTrip.budget.used / selectedTrip.budget.amount) * 100 : 0)}
                              size={58}
                              thickness={5}
                              sx={{ 
                                color: selectedTrip.budget.used > selectedTrip.budget.amount ? "error.main" : isDarkMode ? "#ffffff" : "#111111",
                                strokeLinecap: "round",
                                filter: "drop-shadow(0px 2px 4px rgba(0,0,0,0.1))"
                              }}
                            />
                            <Box sx={{ inset: 0, position: "absolute", display: "flex", alignItems: "center", justifyContent: "center" }}>
                              <Typography variant="caption" fontWeight={900} sx={{ fontSize: "0.72rem", color: mode === "dark" ? "#fff" : "#111", fontVariantNumeric: "tabular-nums" }}>
                                {Math.round(selectedTrip.budget.amount ? (selectedTrip.budget.used / selectedTrip.budget.amount) * 100 : 0)}%
                              </Typography>
                            </Box>
                          </Box>

                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography 
                              variant="caption" 
                              sx={{ 
                                fontWeight: 800, 
                                display: "block", 
                                mb: 0.5, 
                                letterSpacing: "0.05em", 
                                fontSize: "0.65rem",
                                color: mode === "dark" ? "rgba(255, 255, 255, 0.45)" : "rgba(0, 0, 0, 0.45)" 
                              }}
                            >
                              BUDGET UTILIZATION SPECTRUM
                            </Typography>
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                fontWeight: 800, 
                                fontSize: "0.9rem",
                                color: mode === "dark" ? "#ffffff" : "#111111",
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis"
                              }}
                            >
                              ₹{selectedTrip.budget.used || 0} <span style={{ fontWeight: 400, opacity: 0.5, fontSize: "0.8rem" }}>used of</span> ₹{selectedTrip.budget.amount || 0}
                            </Typography>
                          </Box>
                        </Box>
                      )}

                      <Box sx={{ p: 2, borderRadius: 6, backdropFilter: "blur(20px) saturate(180%)", WebkitBackdropFilter: "blur(20px) saturate(180%)", background: mode === "dark" ? "rgba(20, 20, 20, 0.05)" : "rgba(255, 255, 255, 0.2)", boxShadow: theme.palette.mode === "dark" ? `inset 0 1px 2px rgba(255, 255, 255, 0.11), inset 0 -1px 1px rgba(35, 35, 35, 0.07)` : `inset 0 1px 1px rgba(255,255,255,0.8), inset 0 -1px 1px rgba(0, 0, 0, 0.1)` }}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: "block", mb: 0.5 }}>TIMELINE SPAN HORIZON</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {new Date(selectedTrip.startDate).toLocaleDateString(undefined, { dateStyle: 'medium' })} — {new Date(selectedTrip.endDate).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                        </Typography>
                      </Box>

                      <Box sx={{ p: 2, borderRadius: 6, backdropFilter: "blur(20px) saturate(180%)", WebkitBackdropFilter: "blur(20px) saturate(180%)", background: mode === "dark" ? "rgba(20, 20, 20, 0.05)" : "rgba(255, 255, 255, 0.2)", boxShadow: theme.palette.mode === "dark" ? `inset 0 1px 2px rgba(255, 255, 255, 0.11), inset 0 -1px 1px rgba(35, 35, 35, 0.07)` : `inset 0 1px 1px rgba(255,255,255,0.8), inset 0 -1px 1px rgba(0, 0, 0, 0.1)` }}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: "block", mb: 1 }}>ACCOUNT SYSTEM DEPLOYED MEMBERS</Typography>
                        <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ gap: 0.5 }}>
                          {selectedTrip.memberProfiles?.map((m) => (
                            <Chip 
                              key={m.uid} 
                              avatar={
                                <Avatar 
                                  src={m.photoURL || `https://api.dicebear.com/7.x/identicon/svg?seed=${m.uid}`} 
                                  sx={{
                                    width: 20,
                                    height: 20,
                                    boxShadow: mode === "dark"
                                      ? `inset 0 1px 2px rgba(255, 255, 255, 0.11), inset 0 -1px 1px rgba(35, 35, 35, 0.07)` 
                                      : `inset 0 1px 1px rgba(255,255,255,0.8), inset 0 -1px 1px rgba(0,0,0,0.1)`,
                                  }}
                                />
                              } 
                              label={m.name || m.username} 
                              size="small" 
                              sx={{ 
                                fontWeight: 700, 
                                fontSize: "0.72rem",
                                height: 26,
                                borderRadius: 3, 
                                backdropFilter: "blur(10px) saturate(120%)",
                                WebkitBackdropFilter: "blur(10px) saturate(120%)",
                                backgroundColor: mode === "dark" ? "rgba(255, 255, 255, 0.03)" : "rgba(0, 0, 0, 0.03)",
                                border: `0px solid ${mode === "dark" ? "rgba(255, 255, 255, 0.06)" : "rgba(0, 0, 0, 0.05)"}`,
                                color: mode === "dark" ? "rgba(255, 255, 255, 0.85)" : "rgba(0, 0, 0, 0.8)",
                                boxShadow: mode === "dark" 
                                  ? `inset 0 1px 2px rgba(255, 255, 255, 0.11), inset 0 -1px 1px rgba(35, 35, 35, 0.07)` 
                                  : `inset 0 1px 1px rgba(255,255,255,0.8), inset 0 -1px 1px rgba(0,0,0,0.1)`,
                                "& .MuiChip-label": { px: 1 },
                                transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                                "&:hover": {
                                  backgroundColor: mode === "dark" ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.06)",
                                }
                              }}
                            />
                          ))}
                        </Stack>
                      </Box>
                    </Stack>
                  </Box>
                </Box>
              </motion.div>

              <motion.div 
                initial={{ y: 100, scale: 0.9, opacity: 0 }} 
                animate={{ y: 0, scale: 1, opacity: 1 }} 
                exit={{ y: 80, scale: 0.95, opacity: 0 }} 
                transition={{ 
                  type: "spring", 
                  damping: 15,
                  stiffness: 220, 
                  mass: 0.85,
                  delay: 0.05
                }}
                style={{ 
                  position: "fixed", 
                  bottom: 20, 
                  left: 0,
                  right: 0,
                  margin: "0 auto",
                  width: "calc(100% - 32px)", 
                  maxWidth: "540px", 
                  zIndex: 1301 
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1.5, p: "8px 16px", width: "100%", boxSizing: "border-box", mx: "auto", "& .MuiButton-root": { textTransform: "none", fontWeight: 600, minWidth: 44, height: 38, px: 1.5, color: mode === "dark" ? "rgba(255, 255, 255, 0.8)" : "rgba(0, 0, 0, 0.7)"} }}>
                  <Stack direction="row" spacing={1} sx={{ width: "100%", alignItems: "center", justifyContent: "space-between" }}>
                    <Tooltip title="Share Network Matrix" TransitionComponent={Zoom} arrow>
                      <IconButton 
                        onClick={() => { setShareDrawerOpen(true); fetchFriendsNetwork(); }}
                        sx={{ color: 'text.secondary', p: 1.8, borderRadius: 8, backdropFilter: "blur(25px)", background: mode === "dark" ? "rgba(25, 25, 25, 0.75)" : "rgba(255, 255, 255, 0.35)", boxShadow: theme.palette.mode === "dark" ? `inset 0 1px 2px rgba(255, 255, 255, 0.11), inset 0 -1px 1px rgba(35, 35, 35, 0.07)` : `inset 0 1px 1px rgba(255,255,255,0.8), inset 0 -1px 1px rgba(0,0,0,0.1)` }}
                      >
                        <ShareIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>

                    <Stack direction="row" spacing={0.5} sx={{ backdropFilter: "blur(25px)", background: mode === "dark" ? "rgba(25, 25, 25, 0.75)" : "rgba(255, 255, 255, 0.35)", p: 0.5, borderRadius: 8, boxShadow: theme.palette.mode === "dark" ? `inset 0 1px 2px rgba(255, 255, 255, 0.11), inset 0 -1px 1px rgba(35, 35, 35, 0.07)` : `inset 0 1px 1px rgba(255,255,255,0.8), inset 0 -1px 1px rgba(0,0,0,0.1)` }}>
                      <Tooltip title="Export iCal Sync Engine" TransitionComponent={Zoom} arrow>
                        <IconButton onClick={() => exportToICS(selectedTrip)} sx={{ color: 'text.secondary', p: 1.5 }}><CalendarTodayIcon fontSize="small" /></IconButton>
                      </Tooltip>
                      
                      <Tooltip title="Pin Trip Matrix to Top" TransitionComponent={Zoom} arrow>
                        <IconButton 
                          onClick={() => {
                            if (!selectedTrip || !user) return;
                            setPinnedTripIds(prev => {
                              const isPinned = prev.includes(selectedTrip.id);
                              const updated = isPinned 
                                ? prev.filter(id => id !== selectedTrip.id) 
                                : [...prev, selectedTrip.id];
                              localStorage.setItem(`bunkmate.pinnedTrips.${user.uid}`, JSON.stringify(updated));
                              return updated;
                            });
                          }} 
                          sx={{ backgroundColor: isSelectedTripPinned ? mode === "dark" ? "rgba(25, 25, 25, 0.84)" : "rgba(255, 255, 255, 0.9)" : "transparent", color: isSelectedTripPinned ? "text.primary" : "text.secondary", p: 1.5 }}
                        >
                          <PushPinIcon fontSize="small" style={{ transform: isSelectedTripPinned ? "none" : "rotate(45deg)", transition: "transform 0.2s ease" }} />
                        </IconButton>
                      </Tooltip>

                      <Tooltip title="Open Trip Horizon View" TransitionComponent={Zoom} arrow>
                        <IconButton onClick={() => { navigate(`/trips/${selectedTrip.id}`); setActionMode(false); }} sx={{ color: 'text.secondary', p: 1.5 }}><ArrowForward fontSize="small" /></IconButton>
                      </Tooltip>
                    </Stack>

                    <Tooltip title="Delete Frame instance" TransitionComponent={Zoom} arrow>
                      <IconButton 
                        color="error" onClick={() => setDeleteDialogOpen(true)} 
                        sx={{ color: 'text.secondary', p: 1.8, borderRadius: 8, backdropFilter: "blur(25px)", background: mode === "dark" ? "rgba(25, 25, 25, 0.75)" : "rgba(255, 255, 255, 0.35)", boxShadow: theme.palette.mode === "dark" ? `inset 0 1px 2px rgba(255, 255, 255, 0.11), inset 0 -1px 1px rgba(35, 35, 35, 0.07)` : `inset 0 1px 1px rgba(255,255,255,0.8), inset 0 -1px 1px rgba(0,0,0,0.1)` }}
                      >
                        <DeleteOutlineIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </Box>
              </motion.div>
            </>
          )}
        </AnimatePresence>

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
                backdropFilter: "blur(6px) saturate(180%)",
                WebkitBackdropFilter: "blur(6px) saturate(180%)",
                boxShadow: mode === "dark"
                  ? `0 8px 32px rgba(0,0,0,0.35), inset 0 1px 1px rgba(244, 244, 244, 0.11), inset 0 -1px 1px rgba(35, 35, 35, 0.07)`
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
                  background: mode === "dark" ? "rgba(0, 0, 0, 0.08)" : "rgba(255, 255, 255, 0.1)", 
                  backdropFilter: "blur(10px)", 
                  boxShadow: theme.palette.mode === "dark" 
                    ? `inset 0 1px 2px rgba(255, 255, 255, 0.11), inset 0 -1px 1px rgba(35, 35, 35, 0.07)` 
                    : `inset 0 1px 1px rgba(255,255,255,0.8), inset 0 -1px 1px rgba(0, 0, 0, 0.1)`, 
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
                    : `inset 0 1px 1px rgba(255,255,255,0.8), inset 0 -1px 1px rgba(0, 0, 0, 0.1)`, 
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

        <SwipeableDrawer
          anchor="bottom"
          open={shareDrawerOpen}
          onClose={() => { setShareDrawerOpen(false); setSearchFriendQuery(""); }}
          onOpen={() => {}}
          disableSwipeToOpen
          sx={{ zIndex: 1400 }}
          PaperProps={{
            sx: {
              borderRadius: 8, 
              p: 4, 
              minHeight: "45vh", 
              maxHeight: "80vh",
              background: mode === "dark" ? "rgba(20, 20, 20, 0.08)" : "rgba(255, 255, 255, 0.39)", 
              backdropFilter: "blur(20px)",
              boxShadow: theme.palette.mode === "dark" 
                ? `inset 0 1px 2px rgba(255, 255, 255, 0.11), inset 0 -1px 1px rgba(35, 35, 35, 0.07)` 
                : `inset 0 1px 1px rgba(255, 255, 255, 0.8), inset 0 -1px 1px rgba(0, 0, 0, 0.1)`,
              mx: "auto", 
              m: 2, 
              maxWidth: 540
            },
          }}
          ModalProps={{ BackdropProps: { sx: { backdropFilter: "blur(10px)", backgroundColor: "rgba(0,0,0,0)" } } }}
        >
          <Typography variant="h6" fontWeight={950} letterSpacing="-0.5px" mb={2}>
            Trip Matrix Access Network
          </Typography>
          
          <TextField
            placeholder="Search account connections..." 
            value={searchFriendQuery} 
            onChange={(e) => setSearchFriendQuery(e.target.value)} 
            fullWidth 
            variant="outlined" 
            size="small"
            InputProps={{ 
              startAdornment: (
                <InputAdornment position="start">
                  <Search sx={{ fontSize: "1.1rem", color: mode === "dark" ? "rgba(255, 255, 255, 0.4)" : "rgba(0, 0, 0, 0.4)" }} />
                </InputAdornment>
              ) 
            }}
            sx={{
              width: "100%", 
              mb: 2,
              "& .MuiOutlinedInput-root": {
                color: mode === "dark" ? "#fff" : "#111", 
                borderRadius: 4, 
                backgroundColor: mode === "dark" ? "rgba(0, 0, 0, 0.2)" : "rgba(255, 255, 255, 0.2)",
                boxShadow: mode === "dark" 
                  ? `inset 0 1px 2px rgba(255, 255, 255, 0.11), inset 0 -1px 1px rgba(35, 35, 35, 0.07)` 
                  : `inset 0 1px 1px rgba(255, 255, 255, 0.8), inset 0 -1px 1px rgba(0, 0, 0, 0.1)`, 
                border: "0px solid", 
                "& fieldset": { border: "none" }
              }
            }}
          />
          
          {loadingFriends ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
              <CircularProgress size={28} color="inherit" />
            </Box>
          ) : (
            <List dense sx={{ width: '100%', maxHeight: "40vh", overflowY: "auto", pr: 0.5 }}>
              {filteredFriends.map((friend) => {
                const isAdded = selectedTrip?.members.includes(friend.uid);
                const isAdmin = selectedTrip?.createdBy === user?.uid;

                return (
                  <ListItem 
                    key={friend.uid} 
                    disablePadding 
                    secondaryAction={
                      isAdded ? (
                        isAdmin ? (
                          <Button
                            onClick={() => handleToggleTripCollaborator(friend.uid)}
                            size="small"
                            sx={{
                              borderRadius: 3,
                              height: 28,
                              textTransform: "none",
                              fontWeight: 700,
                              fontSize: "0.72rem",
                              backdropFilter: "blur(10px)",
                              WebkitBackdropFilter: "blur(10px)",
                              backgroundColor: "rgba(74, 222, 128, 0.15)",
                              border: "1px solid rgba(74, 222, 128, 0.3)",
                              color: tokens.accent.green,
                              boxShadow: mode === "dark" 
                                ? `inset 0 1px 1px rgba(255, 255, 255, 0.05)` 
                                : `inset 0 1px 1px rgba(255, 255, 255, 0.4)`,
                              transition: "all 0.2s ease-in-out",
                              "&:hover": {
                                backgroundColor: "rgba(239, 68, 68, 0.15)",
                                border: "1px solid rgba(239, 68, 68, 0.3)",
                                color: "#F87171",
                                content: '"Remove"',
                                "& .status-text": { display: "none" },
                                "&::after": { content: '"Remove"' }
                              }
                            }}
                          >
                            <span className="status-text">Active</span>
                          </Button>
                        ) : (
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              px: 2,
                              height: 28,
                              borderRadius: 3,
                              backdropFilter: "blur(10px)",
                              WebkitBackdropFilter: "blur(10px)",
                              backgroundColor: mode === "dark" ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.04)",
                              border: `1px solid ${mode === "dark" ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.06)"}`,
                              color: mode === "dark" ? "rgba(255, 255, 255, 0.5)" : "rgba(0, 0, 0, 0.5)",
                              fontSize: "0.72rem",
                              fontWeight: 700
                            }}
                          >
                            Active
                          </Box>
                        )
                      ) : (
                        <IconButton 
                          edge="end" 
                          onClick={() => handleToggleTripCollaborator(friend.uid)} 
                          sx={{ 
                            borderRadius: 3, 
                            width: 32,
                            height: 32,
                            backgroundColor: mode === "dark" ? "rgba(255, 255, 255, 0.03)" : "rgba(0, 0, 0, 0.03)", 
                            border: `1px solid ${mode === "dark" ? "rgba(255, 255, 255, 0.06)" : "rgba(0, 0, 0, 0.05)"}`,
                            backdropFilter: "blur(10px)",
                            color: mode === "dark" ? "#fff" : "#000",
                            transition: "all 0.2s ease",
                            "&:hover": {
                              backgroundColor: mode === "dark" ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.06)",
                              transform: "scale(1.05)"
                            }
                          }}
                        >
                          <AddIcon fontSize="small" />
                        </IconButton>
                      )
                    } 
                    sx={{ py: 1.2 }}
                  >
                    <ListItemAvatar>
                      <Avatar 
                        src={friend.photoURL} 
                        sx={{ 
                          width: 42, 
                          height: 42, 
                          fontWeight: 800, 
                          fontSize: "0.9rem",
                          bgcolor: theme.palette.primary.main,
                          boxShadow: mode === "dark"
                            ? `inset 0 1px 2px rgba(255, 255, 255, 0.11), inset 0 -1px 1px rgba(35, 35, 35, 0.07)` 
                            : `inset 0 1px 1px rgba(255,255,255,0.8), inset 0 -1px 1px rgba(0,0,0,0.1)`
                        }}
                      >
                        {friend.name.charAt(0)}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText 
                      primary={friend.name} 
                      secondary={`@${friend.username}`} 
                      primaryTypographyProps={{ fontWeight: 700, sx: { pl: 1, color: mode === "dark" ? "#fff" : "#111" } }} 
                      secondaryTypographyProps={{ sx: { pl: 1, fontWeight: 500, color: "text.secondary" } }} 
                    />
                  </ListItem>
                );
              })}
            </List>
          )}
        </SwipeableDrawer>

        <SwipeableDrawer
          anchor="bottom" open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} onOpen={() => {}} disableSwipeToOpen sx={{ zIndex: 1500 }}
          PaperProps={{ sx: { borderRadius: 8, p: 3, background: mode === "dark" ? "rgba(20, 20, 20, 0.08)" : "rgba(255,255,255,0.39)", backdropFilter: "blur(20px)", boxShadow: theme.palette.mode === "dark" ? `inset 0 1px 2px rgba(255, 255, 255, 0.11), inset 0 -1px 1px rgba(35, 35, 35, 0.07)` : `inset 0 1px 1px rgba(255,255,255,0.8), inset 0 -1px 1px rgba(0, 0, 0, 0.1)`, maxWidth: 540, mx: "auto", m: 3 } }}
          ModalProps={{ BackdropProps: { sx: { backdropFilter: "blur(10px)", backgroundColor: "rgba(0,0,0,0)" } } }}
        >
          <Typography variant="h6" fontWeight="700" sx={{ textTransform: "none", textAlign: "center", mb: 2 }}>Delete Trip Instance</Typography>
          <Box display="flex" flexDirection="column" alignItems="center" gap={2} sx={{ mb: 3 }}>
            <Box sx={{ width: 56, height: 56, borderRadius: "50%", backgroundColor: mode === "dark" ? "rgba(229, 57, 53, 0.15)" : "#ffebee", display: "flex", alignItems: "center", justifyContent: "center" }}><Typography sx={{ fontSize: 26 }}>🗑️</Typography></Box>
            <Typography variant="body1" textAlign="center" sx={{ fontWeight: 500, px: 2 }}>Are you sure you want to completely drop <strong>{selectedTrip?.name}</strong>?</Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontStyle: "italic" }}>This change can't be reversed.</Typography>
          </Box>
          <Stack direction="row" spacing={2} justifyContent="center">
            <Button variant="outlined" fullWidth onClick={() => setDeleteDialogOpen(false)} sx={{ textTransform: "none", background: mode === "dark" ? "rgba(255, 255, 255, 0.08)" : "rgba(255,255,255,0.42)", backdropFilter: "blur(10px)", boxShadow: theme.palette.mode === "dark" ? `inset 0 1px 2px rgba(255, 255, 255, 0.11), inset 0 -1px 1px rgba(35, 35, 35, 0.07)` : `inset 0 1px 1px rgba(255,255,255,0.8), inset 0 -1px 1px rgba(0, 0, 0, 0.1)`, borderRadius: 8, py: 1.2, fontWeight: 600, border: "none", color: mode === "dark" ? "#fff" : "#000", "&:hover": { backgroundColor: mode === "dark" ? "rgba(255, 255, 255, 0.05)" : "#f5f5f5" } }}>Cancel</Button>
            <Button variant="contained" fullWidth onClick={handleDeleteTrip} sx={{ textTransform: "none", background: mode === "dark" ? "rgba(229, 57, 53, 0.18)" : "rgba(255, 102, 102, 0.69)", backdropFilter: "blur(10px)", boxShadow: theme.palette.mode === "dark" ? `inset 0 1px 2px rgba(255, 255, 255, 0.11), inset 0 -1px 1px rgba(35, 35, 35, 0.07)` : `inset 0 1px 1px rgba(255,255,255,0.8), inset 0 -1px 1px rgba(0, 0, 0, 0.1)`, borderRadius: 8, py: 1.2, fontWeight: 600, color: mode === "dark" ? "#fff" : "#000", "&:hover": { backgroundColor: "#c62828" } }}>Delete Trip</Button>
          </Stack>
        </SwipeableDrawer>

        <CreateTripDrawer
          createDialogOpen={createDialogOpen}
          closeDrawer={handleCloseDrawer}
          step={step}
          setStep={setStep}
          newTrip={newTrip}
          setNewTrip={setNewTrip}
          selectedMembers={selectedMembers}
          setSelectedMembers={setSelectedMembers}
          randomNatureImage={randomNatureImage}
          handleNext={handleNext}
          handleBack={handleBack}
          handleCreateTrip={handleCreateTrip}
          createdTripDetails={createdTripDetails}
          setCreatedTripDetails={setCreatedTripDetails}
          user={user}
          db={db}
          mode={mode}
        />
        
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