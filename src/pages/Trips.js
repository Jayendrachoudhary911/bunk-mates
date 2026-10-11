import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  Box,
  Typography,
  Button,
  Container,
  Card,
  TextField,
  AvatarGroup,
  Avatar,
  IconButton,
  Stack,
  ThemeProvider,
  Chip,
  Tabs,
  Tab,
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
  useMediaQuery,
  Popover,
  Menu,
  MenuItem,
  ListItemIcon,
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
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
} from "../icons";
import {
  CalendarMonth,
  ChatBubbleOutline,
  BookmarkBorder,
  MoreHoriz,
  Add,
  OpenInNew,
  Share,
  CalendarToday,
  PushPin,
  DeleteOutline,
} from "@mui/icons-material";
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
import Notifications from "../elements/Notifications";
import { motion, AnimatePresence } from "framer-motion";
import { useBackButtonClose } from "../hooks/useBackButtonClose";
import { SquarePen } from "lucide-react"; 
import CreateTripDrawer from "../components/trips_components/CreateDrawer";
import {
  designTokens as tokens,
} from "../theme/designSystem";
import { isValidImageUrl } from "../utils/uiHelpers";
import { BoxHelper } from "three/src/Three.Core.js";

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


export default function Trips() {
  const [trips, setTrips] = useState([]);
  const [currentTab, setCurrentTab] = useState(0); 
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [step, setStep] = useState(0); 
  const [newTrip, setNewTrip] = useState({
    name: "", from: "", to: "", location: "", startDate: "", endDate: "", iconDataUri: "", travelType: "Adventure", budgetGoal: ""
  });
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [latestTripId, setLatestTripId] = useState(null);
  const [createdTripDetails, setCreatedTripDetails] = useState(null);

  const [pinnedTripIds, setPinnedTripIds] = useState([]);

  const [searchQuery, setSearchQuery] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [filterPlace, setFilterPlace] = useState("");
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");

  const [selectedTrip, setSelectedTrip] = useState(null);
  const [actionMode, setActionMode] = useState(false);
  const [shareDrawerOpen, setShareDrawerOpen] = useState(false);
  const [searchFriendQuery, setSearchFriendQuery] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [loadingFriends, setLoadingFriends] = useState(false);

  // Desktop Dropdown Anchors
  const [filterAnchorEl, setFilterAnchorEl] = useState(null);
  const [desktopMenuAnchorEl, setDesktopMenuAnchorEl] = useState(null);

  const { mode, accent } = useThemeToggle();
  const theme = getTheme(mode, accent);
  const isDarkMode = mode === 'dark';
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));
  const navigate = useNavigate();
  const user = auth.currentUser;

  const [expanded, setExpanded] = useState(true);
  const [scrolled, setScrolled] = useState(false);
  const [desktopCardsScrolled, setDesktopCardsScrolled] = useState(false);

  useBackButtonClose(createDialogOpen, () => handleCloseDrawer());
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
    if (!user) return;
    const userProfileCache = new Map();
    const groupIconCache = new Map();

    const q = query(collection(db, "trips"), where("members", "array-contains", user.uid));
    const unsubscribe = onSnapshot(q, async snapshot => {
      let cachedUserBudgetDoc = null;
      try {
        const userBudgetRef = doc(db, "budgets", user.uid);
        const budgetSnap = await getDoc(userBudgetRef);
        if (budgetSnap.exists()) {
          cachedUserBudgetDoc = budgetSnap.data();
        }
      } catch (e) {
        console.warn("User budget fetch fallback:", e);
      }

      const allTrips = await Promise.all(
        snapshot.docs.map(async docSnap => {
          const trip = { id: docSnap.id, ...docSnap.data() };
          
          let tripBudget = null;
          try {
            const tripBudgetRef = doc(db, "budgets", trip.id);
            const tripBudgetSnap = await getDoc(tripBudgetRef);
            if (tripBudgetSnap.exists()) {
              const bData = tripBudgetSnap.data();
              const expenses = Array.isArray(bData.expenses) ? bData.expenses : [];
              const used = expenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
              const totalAmount = parseFloat(bData.total) || parseFloat(trip.budget) || 0;
              tripBudget = {
                amount: totalAmount,
                total: totalAmount,
                used,
                expenses,
                contributors: bData.contributors || [],
              };
            } else if (cachedUserBudgetDoc) {
              const matchingItem = Array.isArray(cachedUserBudgetDoc.items)
                ? cachedUserBudgetDoc.items.find((item) => item.tripId === trip.id)
                : null;
              if (matchingItem) {
                const expenses = Array.isArray(matchingItem.expenses) ? matchingItem.expenses : [];
                const used = expenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
                const totalAmount = parseFloat(matchingItem.amount) || parseFloat(matchingItem.total) || parseFloat(trip.budget) || 0;
                tripBudget = { ...matchingItem, amount: totalAmount, total: totalAmount, used, expenses };
              }
            }
          } catch (e) {
            console.warn("Budget fetch fallback:", e);
          }
          if (!tripBudget && trip.budget) {
            const numBudget = parseFloat(trip.budget) || 0;
            tripBudget = { amount: numBudget, total: numBudget, used: 0, expenses: [] };
          }
          trip.budget = tripBudget;

          const memberProfiles = await Promise.all(
            (trip.members || []).map(async uid => {
              if (userProfileCache.has(uid)) return userProfileCache.get(uid);
              try {
                const uSnap = await getDoc(doc(db, "users", uid));
                if (uSnap.exists()) {
                  const data = uSnap.data();
                  const p = { uid: uSnap.id, photoURL: data.photoURL || "", name: data.name || "", username: data.username || "" };
                  userProfileCache.set(uid, p);
                  return p;
                }
              } catch (e) {
                console.warn("Member fetch fallback:", e);
              }
              return null;
            })
          );
          trip.memberProfiles = memberProfiles.filter(Boolean);

          let matchedIconURL = groupIconCache.get(trip.id);
          if (matchedIconURL === undefined) {
            try {
              const groupChatSnap = await getDoc(doc(db, "groupChats", trip.id));
              if (groupChatSnap.exists()) {
                const gData = groupChatSnap.data();
                matchedIconURL = gData.iconURL || gData.photoURL || gData.icon || null;
              }
              if (!matchedIconURL) {
                const gq = query(collection(db, "groupChats"), where("tripId", "==", trip.id));
                const gqSnap = await getDocs(gq);
                if (!gqSnap.empty) {
                  const gData = gqSnap.docs[0].data();
                  matchedIconURL = gData.iconURL || gData.photoURL || gData.icon || null;
                }
              }
            } catch (e) {
              console.warn("Group chat icon fetch fallback:", e);
            }
            groupIconCache.set(trip.id, matchedIconURL || null);
          }
          trip.iconURL = matchedIconURL || trip.iconURL || trip.coverImage || null;

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

  const handleCreateTrip = async (options = {}) => {
    const { name, from, to, location, startDate, endDate, iconDataUri, description } = newTrip;
    const iconURL = iconDataUri || "";
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
  ], [filteredTrips, upcomingTrips, ongoingTrips, pastTrips, sortPinnedFirst]);

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

    const startDate = trip?.startDate ? new Date(trip.startDate) : null;
    const endDate = trip?.endDate ? new Date(trip.endDate) : null;

    const now = new Date();

    const isValidStartDate =
      startDate instanceof Date && !Number.isNaN(startDate.getTime());

    const isValidEndDate =
      endDate instanceof Date && !Number.isNaN(endDate.getTime());

    let tripStatus = "Upcoming";

    if (isValidStartDate && isValidEndDate) {
      if (now > endDate) {
        tripStatus = "Past";
      } else if (now >= startDate && now <= endDate) {
        tripStatus = "Ongoing";
      }
    }

    const tripDays =
      isValidStartDate && isValidEndDate
        ? Math.max(
            1,
            Math.ceil(
              (new Date(
                endDate.getFullYear(),
                endDate.getMonth(),
                endDate.getDate()
              ) -
                new Date(
                  startDate.getFullYear(),
                  startDate.getMonth(),
                  startDate.getDate()
                )) /
                (1000 * 60 * 60 * 24)
            ) + 1
          )
        : null;

    const totalBudget = Number(
      trip?.budget?.total || trip?.budget?.amount || 0
    );

    const usedBudget = Number(trip?.budget?.used || 0);

    const budgetProgress =
      totalBudget > 0
        ? Math.min(100, Math.max(0, (usedBudget / totalBudget) * 100))
        : 0;

    const remainingBudget = Math.max(0, totalBudget - usedBudget);

    const isOverBudget =
      totalBudget > 0 && usedBudget > totalBudget;

    const hasTripImage = isValidImageUrl(trip?.iconURL);

    const tripCategory =
      trip?.category ||
      trip?.tripType ||
      trip?.type ||
      "Adventure";

    const locationText =
      trip?.location ||
      trip?.destination ||
      trip?.place ||
      "Trip destination";

    const formatDate = (date) => {
      if (!date || Number.isNaN(date.getTime())) return "";

      return date.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
      });
    };

    const formattedDateRange =
      isValidStartDate && isValidEndDate
        ? `${formatDate(startDate)} to ${formatDate(endDate)}`
        : "Dates not set";

    const statusColor =
      tripStatus === "Ongoing"
        ? "#34d399"
        : tripStatus === "Upcoming"
          ? "#60a5fa"
          : "#a1a1aa";

    const handleCardClick = () => {
      if (isLongPressTriggeredRef.current) {
        isLongPressTriggeredRef.current = false;
        return;
      }

      navigate(`/trips/${trip.id}`);
    };

    const handleMenuClick = (e) => {
      e.stopPropagation();
      e.preventDefault();

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      setSelectedTrip(trip);
      if (isDesktop) {
        setDesktopMenuAnchorEl(e.currentTarget);
      } else {
        setActionMode(true);
      }
    };

    const handleChatClick = (e) => {
      e.stopPropagation();
      e.preventDefault();

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      navigate(`/group/${trip.id}`);
    };

    return (
      <Slide
        in={true}
        direction="up"
        timeout={isNew ? 600 : 0}
        mountOnEnter
        unmountOnExit
        key={trip.id}
      >
        <Box
          sx={{
            width: "100%",
            filter:
              actionMode && !isSelected
                ? "blur(4px)"
                : "none",
            opacity:
              actionMode && !isSelected
                ? 0.35
                : 1,
            transform:
              isSelected
                ? "scale(1.02)"
                : "scale(1)",
            transition: "all 0.35s cubic-bezier(0.16,1,0.3,1)",
            position: "relative",
          }}
        >
          <Card
            id={`trip-${trip.id}`}
            onMouseDown={(e) => {
              coordinatesRef.current = {
                x: e.clientX,
                y: e.clientY,
              };

              isLongPressTriggeredRef.current = false;

              timeoutRef.current = setTimeout(() => {
                isLongPressTriggeredRef.current = true;

                setSelectedTrip(trip);
                if (!isDesktop) setActionMode(true);
              }, 600);
            }}
            onMouseUp={() => {
              if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
              }
            }}
            onMouseLeave={() => {
              if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
              }
            }}
            onMouseMove={(e) => {
              if (!timeoutRef.current) return;

              if (
                Math.abs(
                  e.clientX - coordinatesRef.current.x
                ) > 10 ||
                Math.abs(
                  e.clientY - coordinatesRef.current.y
                ) > 10
              ) {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
              }
            }}
            onTouchStart={(e) => {
              coordinatesRef.current = {
                x: e.touches[0].clientX,
                y: e.touches[0].clientY,
              };

              isLongPressTriggeredRef.current = false;

              timeoutRef.current = setTimeout(() => {
                isLongPressTriggeredRef.current = true;

                setSelectedTrip(trip);
                if (!isDesktop) setActionMode(true);
              }, 600);
            }}
            onTouchEnd={() => {
              if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
              }
            }}
            onTouchMove={(e) => {
              if (!timeoutRef.current) return;

              if (
                Math.abs(
                  e.touches[0].clientX -
                    coordinatesRef.current.x
                ) > 10 ||
                Math.abs(
                  e.touches[0].clientY -
                    coordinatesRef.current.y
                ) > 10
              ) {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
              }
            }}
            onClick={handleCardClick}
            sx={{
              position: "relative",
              width: "100%",
              minHeight: { xs: 80, sm: 150, md: 440, lg: 290 },
              borderRadius: { xs: "28px", sm: "30px", md: "34px" },
              overflow: "hidden",
              cursor: "pointer",
              color: "#fff",
              backgroundColor:
                mode === "dark"
                  ? "#18191d"
                  : "#e4e4e4",
              backgroundImage: hasTripImage
                ? `url("${trip.iconURL}")`
                : "none",
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
              border: "0px solid rgba(255,255,255,0.18)",
              boxShadow: `inset 0 1px 1px rgba(255,255,255,0.22), inset 0 -1px 2px rgba(0,0,0,0.35)`,
              backdropFilter: "blur(16px)",
              WebkitBackdropFilter: "blur(16px)",
              WebkitTapHighlightColor: "transparent",
              transition: "transform 300ms cubic-bezier(0.16,1,0.3,1), border-color 300ms ease",
              "&:hover": {
                transform: "scale(1.012)",
                borderColor: "rgba(255,255,255,0.3)",
              },
              "&:active": {
                transform: "scale(0.992)",
              },
              ...(isSelected && {
                transform: "scale(1.025) translateY(-4px)",
                zIndex: 20,
                borderColor: "rgba(255,255,255,0.42)",
              }),
              "@media (max-width: 600px)": {
                minHeight: 230,
                borderRadius: "26px",
              },
            }}
          >
            <Box
              sx={{
                position: "absolute",
                inset: 0,
                background: hasTripImage
                  ? isDarkMode ?  `linear-gradient(180deg, rgba(0, 0, 0, 0.13) 0%, rgba(0, 0, 0, 0.59) 30%, rgba(0, 0, 0, 0.67) 57%, rgba(0, 0, 0, 0.81) 100%)`
                  : `linear-gradient(180deg, rgba(0, 0, 0, 0.03) 0%, rgba(0, 0, 0, 0.29) 30%, rgba(0, 0, 0, 0.37) 57%, rgba(0, 0, 0, 0.51) 100%)`
                  : `linear-gradient(180deg, rgba(30,30,30,0.65), rgba(10,10,10,0.95))`,
                pointerEvents: "none",
                zIndex: 0,
              }}
            />

            <Box
              sx={{
                position: "absolute",
                inset: 0,
                background: "linear-gradient(180deg, rgba(255,255,255,0.1), transparent 30%)",
                pointerEvents: "none",
                zIndex: 1,
              }}
            />

            <Box
              sx={{
                position: "absolute",
                top: { xs: 18, sm: 24, md: 28 },
                left: { xs: 18, sm: 28, md: 32 },
                right: { xs: 18, sm: 28, md: 32 },
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 1,
                zIndex: 5,
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  minWidth: 0,
                  overflow: "hidden",
                }}
              >
                <Box
                  sx={{
                    height: 28,
                    px: { xs: 1.5, sm: 1.2 },
                    borderRadius: "24px",
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    flexShrink: 0,
                    background: "rgba(255, 255, 255, 0.1)",
                    border: "0px solid rgba(255,255,255,0.25)",
                    boxShadow: `inset 0 1px 1px rgba(255,255,255,0.18), inset 0 -1px 2px rgba(0,0,0,0.16)`,
                    backdropFilter: "blur(20px)",
                    WebkitBackdropFilter: "blur(20px)",
                  }}
                >
                  <Box
                    sx={{
                      width: 9,
                      height: 9,
                      borderRadius: "50%",
                      backgroundColor: statusColor,
                      boxShadow: `0 0 10px ${statusColor}80`,
                    }}
                  />

                  <Typography
                    sx={{
                      fontSize: { xs: "0.78rem", sm: "0.95rem" },
                      whiteSpace: "nowrap",
                      color: '#ffffff',
                    }}
                  >
                    {tripStatus}
                  </Typography>
                </Box>

                <Box
                  sx={{
                    height: 28,
                    px: { xs: 1.5, sm: 1.2 },
                    maxWidth: { xs: 120, sm: 180 },
                    borderRadius: "24px",
                    display: "flex",
                    alignItems: "center",
                    background: "rgba(255,255,255,0.1)",
                    border: "0px solid rgba(255,255,255,0.20)",
                    backdropFilter: "blur(20px)",
                    WebkitBackdropFilter: "blur(20px)",
                    overflow: "hidden",
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: { xs: "0.78rem", sm: "0.95rem" },
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      color: '#ffffff',
                    }}
                  >
                    {tripCategory}
                  </Typography>
                </Box>
              </Box>

              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: { xs: 0.5, sm: 1 },
                  flexShrink: 0,
                }}
              >
                {trip.memberProfiles?.length > 0 && (
                  <AvatarGroup
                    max={3}
                    sx={{
                      display: { xs: "flex", sm: "flex" },
                      mr: 0.5,
                      "& .MuiAvatar-root": {
                        width: { sm: 18, md: 32 },
                        height: { sm: 18, md: 32 },
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        border: "0px solid rgba(20,20,25,0.8)",
                        backgroundColor: "rgba(255,255,255,0.1)",
                        backdropFilter: "blur(12px)",
                        boxShadow: 0,
                      },
                      "& .MuiAvatarGroup-avatar": {
                        backgroundColor: "rgba(255, 255, 255, 0.2)",
                        boxShadow: 'inset 0 1px 1px rgba(255, 255, 255, 0.11), 0 1px 0px rgba(0,0,0,0.1)',
                        color: "#fff",
                        border: "0px solid rgba(255,255,255,0.25)",
                      },
                    }}
                  >
                    {trip.memberProfiles.map((member) => (
                      <Tooltip
                        title={member.name || `@${member.username}`}
                        key={member.uid}
                        arrow
                      >
                        <Avatar
                          src={member.photoURL || `https://api.dicebear.com/7.x/identicon/svg?seed=${member.uid}`}
                          alt={member.name || member.username}
                        />
                      </Tooltip>
                    ))}
                  </AvatarGroup>
                )}

                <Tooltip title="Trip options">
                  <IconButton
                    onClick={handleMenuClick}
                    sx={{
                      width: { xs: 38, sm: 32 },
                      height: { xs: 38, sm: 32 },
                      borderRadius: "50%",
                      color: "#fff",
                      background: "rgba(255,255,255,0.15)",
                      border: "0px solid rgba(255,255,255,0.18)",
                      backdropFilter: "blur(20px)",
                      WebkitBackdropFilter: "blur(20px)",
                      boxShadow: `inset 0 1px 1px rgba(255,255,255,0.13), inset 0 -1px 2px rgba(0,0,0,0.25)`,
                      "&:hover": {
                        background: "rgba(255,255,255,0.14)",
                      },
                    }}
                  >
                    <MoreHoriz
                      sx={{
                        fontSize: { xs: 23, sm: 24 },
                      }}
                    />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>

            <Box
              sx={{
                position: "absolute",
                left: { xs: 20, sm: 32, md: 42 },
                right: { xs: 20, sm: 32, md: 42 },
                bottom: { xs: 70, sm: 105, md: 100 },
                zIndex: 3,
              }}
            >
              <Typography
                sx={{
                  fontSize: { xs: "1.5rem", sm: "2rem", md: "2rem" },
                  fontWeight: 800,
                  letterSpacing: "-1.8px",
                  color: "#fff",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  mb: -0.2,
                }}
              >
                {trip.name || "Untitled Trip"}
              </Typography>

              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  mb: 0,
                  minWidth: 0,
                }}
              >
                <LocationOn
                  sx={{
                    fontSize: { xs: 16, sm: 18 },
                    color: "#cacaca",
                    flexShrink: 0,
                  }}
                />

                <Typography
                  sx={{
                    fontSize: { xs: "0.8rem", sm: "0.9rem", md: "0.9rem" },
                    fontWeight: 700,
                    color: "#cfcfcf",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    textShadow: "0 2px 10px rgba(0,0,0,0.4)",
                  }}
                >
                  {locationText}
                </Typography>
              </Box>

              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: { xs: 1, sm: 1.3 },
                  flexWrap: "wrap",
                }}
              >
                <CalendarMonth
                  sx={{
                    fontSize: { xs: 16, sm: 18 },
                    color: "#cacaca",
                  }}
                />

                <Typography
                  sx={{
                    fontSize: { xs: "0.8rem", sm: "0.9rem", md: "0.9rem" },
                    fontWeight: 450,
                    color: "#cfcfcf",
                  }}
                >
                  {formattedDateRange}
                </Typography>

                {tripDays && (
                  <Box
                    sx={{
                      px: 1.5,
                      py: 0.3,
                      borderRadius: "20px",
                      background: "rgba(255,255,255,0.16)",
                      border: "0px solid rgba(255,255,255,0.12)",
                      backdropFilter: "blur(12px)",
                      WebkitBackdropFilter: "blur(12px)",
                      boxShadow: 'inset 0 1px 1px rgba(255, 255, 255, 0.11), 0 1px 0px rgba(0,0,0,0.04)',
                    }}
                  >
                    <Typography
                      sx={{
                        fontSize: { xs: "0.72rem", sm: "0.85rem" },
                        fontWeight: 850,
                        color: "#e6e6e6",
                      }}
                    >
                      {tripDays} {tripDays === 1 ? "Day" : "Days"}
                    </Typography>
                  </Box>
                )}
              </Box>
            </Box>

            <Box
              sx={{
                position: "absolute",
                left: { xs: 20, sm: 32, md: 42 },
                right: { xs: 20, sm: 32, md: 42 },
                bottom: { xs: 18, sm: 24, md: 28 },
                zIndex: 5,
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "flex-end",
                  justifyContent: "space-between",
                  gap: 2,
                }}
              >
                <Box
                  sx={{
                    minWidth: 0,
                    flex: 1,
                    maxWidth: { xs: 190, sm: 210 },
                  }}
                >
                  {totalBudget > 0 ? (
                    <>
                      <Typography
                        sx={{
                          fontSize: { xs: "0.95rem", sm: "1rem" },
                          fontWeight: 750,
                          color: "#dadada",
                          mb: 0.7,
                        }}
                      >
                        ₹{usedBudget.toLocaleString("en-IN")} / ₹{totalBudget.toLocaleString("en-IN")}
                      </Typography>

                      <LinearProgress
                        variant="determinate"
                        value={budgetProgress}
                        sx={{
                          height: 9,
                          borderRadius: 10,
                          backdropFilter: "blur(12px)",
                          webkitBackdropFilter: "blur(12px)",
                          backgroundColor: "rgba(255,255,255,0.18)",
                          "& .MuiLinearProgress-bar": {
                            borderRadius: 10,
                            backgroundColor: isOverBudget ? "#f87171" : "#fff",
                          },
                        }}
                      />

                      <Typography
                        sx={{
                          mt: 0.6,
                          fontSize: "0.65rem",
                          fontWeight: 650,
                          color: "rgba(255,255,255,0.58)",
                          display: { xs: "none", sm: "block" },
                        }}
                      >
                        {isOverBudget
                          ? "Budget exceeded"
                          : `₹${remainingBudget.toLocaleString("en-IN")} remaining`}
                      </Typography>
                    </>
                  ) : (
                    <Typography
                      sx={{
                        fontSize: "0.9rem",
                        fontWeight: 700,
                        color: "rgba(255,255,255,0.65)",
                      }}
                    >
                      No budget set
                    </Typography>
                  )}
                </Box>

                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: { xs: 0.8, sm: 1.5 },
                    flexShrink: 0,
                  }}
                >
                  <Button
                    onClick={handleChatClick}
                    sx={{
                      width: { xs: 38, sm: 38 },
                      height: { xs: 38, sm: 38 },
                      px: { xs: 0.1, sm: 0.1 },
                      borderRadius: "30px",
                      color: "#fff",
                      textTransform: "none",
                      background: "rgba(255,255,255,0.10)",
                      border: "0px solid rgba(255,255,255,0.20)",
                      backdropFilter: "blur(18px)",
                      WebkitBackdropFilter: "blur(18px)",
                      boxShadow: `inset 0 1px 1px rgba(255,255,255,0.14), inset 0 -1px 2px rgba(0,0,0,0.2)`,
                      "&:hover": {
                        background: "rgba(255,255,255,0.18)",
                      },
                    }}
                  >
                    <ChatBubbleOutline
                      sx={{
                        fontSize: { xs: 18, sm: 18 },
                      }}
                    />
                  </Button>

                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();

                      if (timeoutRef.current) {
                        clearTimeout(timeoutRef.current);
                        timeoutRef.current = null;
                      }

                      navigate(`/trips/${trip.id}`);
                    }}
                    endIcon={
                      <ArrowForward
                        sx={{
                          fontSize: { xs: 20, sm: 24 },
                        }}
                      />
                    }
                    sx={{
                      borderRadius: "30px",
                      color: "#fff",
                      textTransform: "none",
                      fontSize: { xs: "0.9rem", sm: "1.05rem" },
                      fontWeight: 700,
                      background: "rgba(255,255,255,0)",
                      textDecoration: "underline",
                    }}
                  >
                    Details
                  </Button>
                </Box>
              </Box>
            </Box>
          </Card>
        </Box>
      </Slide>
    );
  };

  const HorizontalInfiniteCalendar = React.memo(({ trips = [], isDesktopColumn = false }) => {
    const [viewDate, setViewDate] = useState(
      () => new Date(today.getFullYear(), today.getMonth(), 1)
    );

    const scrollContainerRef = useRef(null);

    const isViewingCurrentMonth =
      viewDate.getFullYear() === today.getFullYear() &&
      viewDate.getMonth() === today.getMonth();

    const handlePrevMonth = () => {
      setViewDate(
        (prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1)
      );
    };

    const handleNextMonth = () => {
      setViewDate(
        (prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1)
      );
    };

    const handleResetToday = () => {
      setViewDate(new Date(today.getFullYear(), today.getMonth(), 1));
    };

    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const totalDaysInMonth = new Date(year, month + 1, 0).getDate();

    const getTripImage = (trip) =>
      trip?.profilePic ||
      trip?.profilePicture ||
      trip?.tripPic ||
      trip?.tripImage ||
      trip?.imageUrl ||
      trip?.imageURL ||
      trip?.image ||
      trip?.photoURL ||
      trip?.photoUrl ||
      trip?.iconURL ||
      trip?.iconUrl ||
      "";

    const getTripTitle = (trip) =>
      trip?.name || trip?.title || trip?.location || "Trip";

    const getTripDateRange = (trip) => {
      if (!trip?.startDate || !trip?.endDate) return "";

      const start = new Date(trip.startDate);
      const end = new Date(trip.endDate);

      if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
        return "";
      }

      const startText = start.toLocaleDateString("default", {
        day: "numeric",
        month: "short",
      });

      const endText = end.toLocaleDateString("default", {
        day: "numeric",
        month: "short",
      });

      return `${startText} – ${endText}`;
    };

    const getTripDuration = (trip) => {
      if (!trip?.startDate || !trip?.endDate) return "";

      const start = new Date(trip.startDate);
      const end = new Date(trip.endDate);

      if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
        return "";
      }

      const startDay = new Date(start);
      const endDay = new Date(end);
      startDay.setHours(0, 0, 0, 0);
      endDay.setHours(0, 0, 0, 0);

      const days = Math.max(
        1,
        Math.round((endDay - startDay) / (1000 * 60 * 60 * 24)) + 1
      );

      return `${days} ${days === 1 ? "day" : "days"}`;
    };

    const getTripForDate = (date) => {
      return trips.filter((trip) => {
        if (!trip?.startDate || !trip?.endDate) return false;

        const start = new Date(trip.startDate);
        const end = new Date(trip.endDate);
        const target = new Date(date);

        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        target.setHours(12, 0, 0, 0);

        return target >= start && target <= end;
      });
    };

    const handleTripClick = (trip, color) => {
      if (!trip) return;

      scrollToAndHighlightTrip(trip.id, color);
      setSelectedTrip(trip);
      setActionMode(true);
    };

    const tripsInMonth = useMemo(() => {
      const startOfMonth = new Date(year, month, 1, 0, 0, 0, 0);
      const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59, 999);

      return trips.filter((trip) => {
        if (!trip?.startDate || !trip?.endDate) return false;

        const start = new Date(trip.startDate);
        const end = new Date(trip.endDate);

        return start <= endOfMonth && end >= startOfMonth;
      });
    }, [trips, year, month]);

    const matrixDays = useMemo(() => {
      const firstDayOfWeek = new Date(year, month, 1).getDay();
      const prevMonthDaysCount = new Date(year, month, 0).getDate();
      const items = [];

      for (let i = firstDayOfWeek; i > 0; i -= 1) {
        items.push({
          date: new Date(year, month - 1, prevMonthDaysCount - i + 1),
          isCurrentMonth: false,
        });
      }

      for (let d = 1; d <= totalDaysInMonth; d += 1) {
        items.push({
          date: new Date(year, month, d),
          isCurrentMonth: true,
        });
      }

      const remainder = items.length % 7;

      if (remainder !== 0) {
        const trailingNeeded = 7 - remainder;

        for (let d = 1; d <= trailingNeeded; d += 1) {
          items.push({
            date: new Date(year, month + 1, d),
            isCurrentMonth: false,
          });
        }
      }

      return items;
    }, [year, month, totalDaysInMonth]);

    const monthDaysList = useMemo(
      () =>
        Array.from(
          { length: totalDaysInMonth },
          (_, index) => new Date(year, month, index + 1)
        ),
      [year, month, totalDaysInMonth]
    );

    useEffect(() => {
      if (isDesktopColumn || !scrollContainerRef.current) return;

      if (isViewingCurrentMonth) {
        const todayElement = scrollContainerRef.current.querySelector(
          "#cal-day-today"
        );

        if (todayElement) {
          todayElement.scrollIntoView({
            behavior: "smooth",
            inline: "center",
            block: "nearest",
          });
        }
      } else {
        scrollContainerRef.current.scrollTo({
          left: 0,
          behavior: "smooth",
        });
      }
    }, [viewDate, isDesktopColumn, isViewingCurrentMonth]);

    const softBorder = isDarkMode
      ? "rgba(255,255,255,0.075)"
      : "rgba(0,0,0,0.065)";

    const controlBackground = isDarkMode
      ? "rgba(255,255,255,0.055)"
      : "rgba(0,0,0,0.045)";

    const secondaryText = isDarkMode
      ? "rgba(255,255,255,0.55)"
      : "rgba(0,0,0,0.5)";

    const calendarButtonSx = {
      width: 32,
      height: 32,
      borderRadius: 8,
      color: "inherit",
      bgcolor: controlBackground,
      border: `0px solid ${softBorder}`,
      transition: "background-color 180ms ease, transform 180ms ease",
      boxShadow: 'inset 0 1px 1px rgba(255, 255, 255, 0.11), 0 1px 0px rgba(0,0,0,0.1)',
      "&:hover": {
        bgcolor: isDarkMode
          ? "rgba(255,255,255,0.095)"
          : "rgba(0,0,0,0.075)",
        transform: "translateY(-1px)",
      },
    };

    const todayButtonSx = {
      minWidth: "auto",
      px: 1.25,
      py: 0.45,
      borderRadius: 99,
      textTransform: "none",
      fontSize: "0.7rem",
      fontWeight: 800,
      color: "inherit",
      bgcolor: controlBackground,
      border: `0px solid ${softBorder}`,
      boxShadow: 'inset 0 1px 1px rgba(255, 255, 255, 0.11), 0 1px 0px rgba(0,0,0,0.1)',
      "&:hover": {
        bgcolor: isDarkMode
          ? "rgba(255,255,255,0.095)"
          : "rgba(0,0,0,0.075)",
      },
    };

    return (
      <Box
        sx={{
          position: "relative",
          width: "100%",
          minWidth: 0,
          pt: 0.5,
          pb: 0.5,
        }}
      >
        {isDesktopColumn ? (
          <Box sx={{ minWidth: 0 }}>
            <Box
              sx={{
                mb: 1.8,
                p: 0.5,
                borderRadius: "16px",
                bgcolor: 'transparent',
                border: `0px solid ${softBorder}`,
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 1,
                  mb: 1,
                }}
              >
                <Box sx={{ minWidth: 0 }}>
                  <Typography
                    variant="h5"
                    sx={{
                      fontWeight: 900,
                      letterSpacing: "-0.15px",
                      color: isDarkMode ? '#f3f3f3' : '#0c0c0c'
                    }}
                  >
                    {viewDate.toLocaleString("default", {
                      month: "long",
                      year: "numeric",
                    })}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      display: "block",
                      mt: 0.35,
                      color: secondaryText,
                      fontWeight: 650,
                      fontSize: "0.68rem",
                    }}
                  >
                    Plan your trips at a glance
                  </Typography>
                </Box>

                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 0.55,
                    flexShrink: 0,
                  }}
                >
                  {!isViewingCurrentMonth && (
                    <Button size="small" onClick={handleResetToday} sx={todayButtonSx}>
                      Today
                    </Button>
                  )}

                  <IconButton
                    size="small"
                    onClick={handlePrevMonth}
                    title="Previous Month"
                    aria-label="Previous month"
                    sx={calendarButtonSx}
                  >
                    <ChevronLeftIcon sx={{ fontSize: "1.15rem" }} />
                  </IconButton>

                  <IconButton
                    size="small"
                    onClick={handleNextMonth}
                    title="Next Month"
                    aria-label="Next month"
                    sx={calendarButtonSx}
                  >
                    <ChevronRightIcon sx={{ fontSize: "1.15rem" }} />
                  </IconButton>
                </Box>
              </Box>
            </Box>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
                gap: 0.55,
                mb: 0.65,
                px: 0.15,
                textAlign: "center",
              }}
            >
              {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
                <Typography
                  key={day}
                  variant="caption"
                  sx={{
                    fontSize: "0.66rem",
                    fontWeight: 900,
                    color: secondaryText,
                    letterSpacing: "0.15px",
                  }}
                >
                  {day}
                </Typography>
              ))}
            </Box>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
                gap: 0.55,
              }}
            >
              {matrixDays.map(({ date, isCurrentMonth: inThisMonth }, index) => {
                const isCurrent = isSameDay(date, today);
                const active = getTripForDate(date);
                const hasTrips = active.length > 0;
                const markerColor = hasTrips
                  ? getTripColor(active[0].id)
                  : "transparent";

                return (
                  <Tooltip
                    key={`${date.toISOString()}-${index}`}
                    title={
                      hasTrips
                        ? active
                            .map((trip) => getTripTitle(trip))
                            .join(", ")
                        : ""
                    }
                    arrow
                    disableHoverListener={!hasTrips}
                  >
                    <Box
                      onClick={() => {
                        if (hasTrips) {
                          handleTripClick(active[0], markerColor);
                        } else if (!inThisMonth) {
                          setViewDate(
                            new Date(date.getFullYear(), date.getMonth(), 1)
                          );
                        }
                      }}
                      sx={{
                        minWidth: 0,
                        height: { xs: 34, md: 58 },
                        borderRadius: 8,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        position: "relative",
                        overflow: "hidden",
                        cursor:
                          hasTrips || !inThisMonth ? "pointer" : "default",
                        bgcolor: isCurrent
                          ? isDarkMode
                            ? "#fff"
                            : "#000"
                          : hasTrips
                          ? `${markerColor}20`
                          : "#1c1c1c07",
                        color: isCurrent
                          ? isDarkMode
                            ? "#000"
                            : "#fff"
                          : !inThisMonth
                          ? isDarkMode
                            ? "rgba(255,255,255,0.22)"
                            : "rgba(0,0,0,0.25)"
                          : "inherit",
                        boxShadow: hasTrips && !isCurrent ? 'inset 0 1px 1px rgba(255, 255, 255, 0.11), 0 1px 0px rgba(0,0,0,0.1)' : "none",
                        border: hasTrips && !isCurrent
                          ? `0px solid ${markerColor}55`
                          : isCurrent
                          ? "1px solid transparent"
                          : `0px solid ${softBorder}`,
                        transition:
                          "transform 180ms cubic-bezier(0.16, 1, 0.3, 1), background-color 180ms ease",
                        "&:hover": {
                          transform: hasTrips || !inThisMonth ? "scale(1.045)" : "none",
                          bgcolor: isCurrent
                            ? undefined
                            : hasTrips
                            ? `${markerColor}38`
                            : controlBackground,
                        },
                      }}
                    >
                      <Typography
                        variant="caption"
                        sx={{
                          position: "relative",
                          zIndex: 1,
                          fontWeight: isCurrent ? 950 : inThisMonth ? 750 : 500,
                          fontSize: "0.78rem",
                          lineHeight: 1,
                        }}
                      >
                        {date.getDate()}
                      </Typography>

                      {hasTrips && !isCurrent && (
                        <Box
                          sx={{
                            position: "absolute",
                            bottom: 4,
                            width: 4,
                            height: 4,
                            borderRadius: "50%",
                            bgcolor: markerColor,
                          }}
                        />
                      )}
                    </Box>
                  </Tooltip>
                );
              })}
            </Box>

            {tripsInMonth.length > 0 ? (
              <Box
                sx={{
                  mt: 2,
                  pt: 1.5,
                  borderTop: `1px solid ${softBorder}`,
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    mb: 1,
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      fontSize: "0.67rem",
                      fontWeight: 900,
                      color: secondaryText,
                      textTransform: "uppercase",
                      letterSpacing: "0.65px",
                    }}
                  >
                    Scheduled this month
                  </Typography>

                  <Typography
                    variant="caption"
                    sx={{
                      fontSize: "0.64rem",
                      color: secondaryText,
                      fontWeight: 700,
                    }}
                  >
                    {tripsInMonth.length} total
                  </Typography>
                </Box>

                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 0.8,
                    maxHeight: 220,
                    overflowY: "auto",
                    pr: 0.3,
                    scrollbarWidth: "thin",
                    "&::-webkit-scrollbar": {
                      width: 4,
                    },
                    "&::-webkit-scrollbar-thumb": {
                      backgroundColor: isDarkMode
                        ? "rgba(255,255,255,0.14)"
                        : "rgba(0,0,0,0.12)",
                      borderRadius: 99,
                    },
                  }}
                >
                  {tripsInMonth.map((trip) => {
                    const tripColor = getTripColor(trip.id);
                    const tripImage = getTripImage(trip);
                    const tripTitle = getTripTitle(trip);
                    const tripDateRange = getTripDateRange(trip);
                    const tripDuration = getTripDuration(trip);

                    return (
                      <Box
                        key={trip.id}
                        onClick={() => handleTripClick(trip, tripColor)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            handleTripClick(trip, tripColor);
                          }
                        }}
                        sx={{
                          position: "relative",
                          minHeight: 86,
                          overflow: "hidden",
                          borderRadius: 5,
                          cursor: "pointer",
                          isolation: "isolate",
                          border: "1px solid transparent",
                          bgcolor: isDarkMode
                            ? "rgba(255,255,255,0.045)"
                            : "rgba(0,0,0,0.035)",
                          transition:
                            "transform 180ms cubic-bezier(0.16, 1, 0.3, 1), border-color 180ms ease",
                          "&:hover": {
                            border: "1px solid rgba(255,255,255,0.1)",
                          },
                          "&:focus-visible": {
                            outline: `2px solid ${tripColor}`,
                            outlineOffset: 2,
                          },
                        }}
                      >
                        {tripImage ? (
                          <Box
                            aria-hidden="true"
                            sx={{
                              position: "absolute",
                              inset: 0,
                              zIndex: -3,
                              backgroundImage: `url(${JSON.stringify(
                                tripImage
                              )})`,
                              backgroundSize: "cover",
                              backgroundPosition: "center",
                              transform: "scale(1.02)",
                            }}
                          />
                        ) : (
                          <Box
                            aria-hidden="true"
                            sx={{
                              position: "absolute",
                              inset: 0,
                              zIndex: -3,
                              bgcolor: `${tripColor}18`,
                            }}
                          />
                        )}

                        <Box
                          aria-hidden="true"
                          sx={{
                            position: "absolute",
                            inset: 0,
                            zIndex: -2,
                            background: tripImage
                              ? isDarkMode
                                ? "rgba(0,0,0,0.36)"
                                : "rgba(0,0,0,0.42)"
                              : isDarkMode
                              ? "rgba(0,0,0,0.08)"
                              : "rgba(255,255,255,0.04)",
                          }}
                        />

                        <Box
                          sx={{
                            position: "relative",
                            zIndex: 3,
                            minHeight: 86,
                            p: 1.25,
                            pl: 1.45,
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "space-between",
                            color: tripImage ? "#fff" : "inherit",
                          }}
                        >
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "flex-start",
                              justifyContent: "space-between",
                              gap: 1,
                            }}
                          >
                            <Box sx={{ minWidth: 0 }}>
                              <Typography
                                variant="caption"
                                sx={{
                                  display: "block",
                                  fontSize: "0.59rem",
                                  fontWeight: 150,
                                  opacity: tripImage ? 0.72 : 0.58,
                                  textTransform: "uppercase",
                                  letterSpacing: "0.55px",
                                  mb: 0.25,
                                }}
                              >
                                Trip
                              </Typography>

                              <Typography
                                variant="body2"
                                sx={{
                                  fontWeight: 900,
                                  fontSize: "0.84rem",
                                  lineHeight: 1.15,
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  display: "-webkit-box",
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: "vertical",
                                  color: "#f3f3f3",
                                }}
                              >
                                {tripTitle}
                              </Typography>
                            </Box>

                            <Box
                              sx={{
                                flexShrink: 0,
                                px: 0.7,
                                py: 0.35,
                                borderRadius: 99,
                                bgcolor: tripImage
                                  ? "rgba(255,255,255,0.14)"
                                  : `${tripColor}18`,
                                border: `0px solid ${
                                  tripImage
                                    ? "rgba(255,255,255,0.18)"
                                    : `${tripColor}35`
                                }`,
                                backdropFilter: "blur(8px)",
                                WebkitBackdropFilter: "blur(8px)",
                                boxShadow: 'inset 0 1px 2px rgba(255, 255, 255, 0.11), inset 0 -1px 2px rgba(255, 255, 255, 0.11)',
                              }}
                            >
                              <Typography
                                variant="caption"
                                sx={{
                                  fontSize: "0.6rem",
                                  fontWeight: 850,
                                  whiteSpace: "nowrap",
                                  opacity: 0.9,
                                }}
                              >
                                {tripDuration}
                              </Typography>
                            </Box>
                          </Box>

                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              gap: 1,
                              mt: 1,
                            }}
                          >
                            <Typography
                              variant="caption"
                              sx={{
                                fontSize: "0.64rem",
                                fontWeight: 750,
                                opacity: tripImage ? 0.78 : 0.58,
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                              }}
                            >
                              {tripDateRange || "Dates not set"}
                            </Typography>

                            <Typography
                              variant="caption"
                              sx={{
                                fontSize: "0.62rem",
                                fontWeight: 900,
                                opacity: tripImage ? 0.8 : 0.58,
                                flexShrink: 0,
                              }}
                            >
                              Open →
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                    );
                  })}
                </Box>
              </Box>
            ) : (
              <Box
                sx={{
                  mt: 1.5,
                  display: "flex",
                  flexDirection: "column",
                  gap: 1.2,
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "baseline",
                    justifyContent: "space-between",
                    gap: 1,
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      color: secondaryText,
                      fontWeight: 800,
                      fontSize: "0.7rem",
                      whiteSpace: "nowrap",
                      textTransform: "uppercase",
                      letterSpacing: "0.45px",
                    }}
                  >
                    {tripsInMonth.length === 0
                      ? "Nothing scheduled"
                      : `${tripsInMonth.length} ${
                          tripsInMonth.length === 1 ? "trip" : "trips"
                        }`}
                  </Typography>
                </Box>

                {tripsInMonth.length === 0 && (
                  <Box
                    sx={{
                      position: "relative",
                      overflow: "hidden",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      textAlign: "center",
                      minHeight: 185,
                      px: 2.5,
                      py: 2.5,
                      borderRadius: "18px",
                      background:
                        mode === "dark"
                          ? "rgba(255,255,255,0)"
                          : "rgba(0,0,0,0)",
                      border: 'none',
                      backdropFilter: "blur(14px)",
                      WebkitBackdropFilter: "blur(14px)",
                    }}
                  >
                    <Box
                      sx={{
                        width: 46,
                        height: 46,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        borderRadius: 6,
                        boxShadow: 'inset 0 1px 4px rgba(255, 255, 255, 0.11), inset 0 -1px 4px rgba(255, 255, 255, 0.11), 0 1px 0px rgba(0,0,0,0.1)',
                        mb: 1.2,
                        background:
                          mode === "dark"
                            ? "rgba(255,255,255,0.05)"
                            : "rgba(0,0,0,0.045)",
                        border: "none",
                        color: "#b4b4b4",
                      }}
                    >
                      <CalendarMonth sx={{ fontSize: 22 }} />
                    </Box>

                    <Typography
                      sx={{
                        fontSize: "0.88rem",
                        fontWeight: 850,
                        color: '#f3f3f3',
                        lineHeight: 1.2,
                      }}
                    >
                      No trips scheduled
                    </Typography>

                    <Typography
                      sx={{
                        mt: 0.5,
                        maxWidth: 240,
                        fontSize: "0.7rem",
                        lineHeight: 1.45,
                        fontWeight: 500,
                        color: secondaryText,
                      }}
                    >
                      You don't have any trips planned for this month.
                    </Typography>

                    <Button
                      onClick={() => setCreateDialogOpen(true)}
                      startIcon={
                        <Add
                          sx={{
                            fontSize: "18px !important",
                          }}
                        />
                      }
                      sx={{
                        mt: 1.6,
                        minHeight: 34,
                        px: 1.8,
                        borderRadius: 8,
                        textTransform: "none",
                        fontSize: "0.72rem",
                        fontWeight: 800,
                        color: "#fff",
                        background:
                          mode === "dark"
                            ? "#ffffff11"
                            : "#111",
                        boxShadow: 'inset 0 1px 1px rgba(255, 255, 255, 0.11), 0 1px 0px rgba(0,0,0,0.1)',
                        transition:
                          "transform 180ms ease, opacity 180ms ease",
                        "&:hover": {
                          background:
                            mode === "dark"
                              ? "#ffffff22"
                              : "#111",
                          opacity: 0.88,
                          transform: "translateY(-1px)",
                        },
                        "&:active": {
                          transform: "scale(0.97)",
                        },
                      }}
                    >
                      Create new trip
                    </Button>
                  </Box>
                )}
              </Box>
            )}
          </Box>
        ) : (
          <Box sx={{ minWidth: 0 }}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 1,
                px: 1.5,
                mb: 1.1,
              }}
            >
              <Box
                sx={{
                  minWidth: 0,
                  display: "flex",
                  alignItems: "baseline",
                  gap: 0.8,
                }}
              >
                <Typography
                  variant="subtitle2"
                  sx={{
                    fontWeight: 900,
                    fontSize: "0.92rem",
                    whiteSpace: "nowrap",
                  }}
                >
                  {viewDate.toLocaleString("default", {
                    month: "long",
                    year: "numeric",
                  })}
                </Typography>

                {tripsInMonth.length > 0 && (
                  <Chip
                    size="small"
                    label={`${tripsInMonth.length} trip${
                      tripsInMonth.length > 1 ? "s" : ""
                    }`}
                    sx={{
                      height: 19,
                      fontSize: "0.61rem",
                      fontWeight: 850,
                      bgcolor: controlBackground,
                      border: `1px solid ${softBorder}`,
                    }}
                  />
                )}
              </Box>

              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0.35,
                  flexShrink: 0,
                }}
              >
                {!isViewingCurrentMonth && (
                  <Button size="small" onClick={handleResetToday} sx={todayButtonSx}>
                    Today
                  </Button>
                )}

                <IconButton
                  size="small"
                  onClick={handlePrevMonth}
                  aria-label="Previous month"
                  sx={{ ...calendarButtonSx, width: 29, height: 29 }}
                >
                  <ChevronLeftIcon sx={{ fontSize: "1.05rem" }} />
                </IconButton>

                <IconButton
                  size="small"
                  onClick={handleNextMonth}
                  aria-label="Next month"
                  sx={{ ...calendarButtonSx, width: 29, height: 29 }}
                >
                  <ChevronRightIcon sx={{ fontSize: "1.05rem" }} />
                </IconButton>
              </Box>
            </Box>

            <Box
              ref={scrollContainerRef}
              sx={{
                display: "flex",
                overflowX: "auto",
                overflowY: "hidden",
                px: 1.5,
                gap: 1,
                overscrollBehaviorX: "contain",
                WebkitOverflowScrolling: "touch",
                touchAction: "pan-x",
                scrollbarWidth: "none",
                "&::-webkit-scrollbar": {
                  display: "none",
                },
              }}
            >
              {monthDaysList.map((date, index) => {
                const isCurrent = isSameDay(date, today);
                const active = getTripForDate(date);
                const hasTrips = active.length > 0;
                const markerColor = hasTrips
                  ? getTripColor(active[0].id)
                  : "transparent";

                return (
                  <Box
                    key={`${date.toISOString()}-${index}`}
                    id={isCurrent ? "cal-day-today" : undefined}
                    onClick={() => {
                      if (hasTrips) {
                        handleTripClick(active[0], markerColor);
                      }
                    }}
                    sx={{
                      flex: "0 0 auto",
                      minWidth: 48,
                      width: 48,
                      height: 64,
                      borderRadius: 8,
                      backdropFilter: "blur(8px)",
                      WebkitBackdropFilter: "blur(8px)",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      position: "relative",
                      overflow: "hidden",
                      bgcolor: hasTrips
                        ? `${markerColor}28`
                        : isCurrent
                        ? isDarkMode
                          ? "#fff"
                          : "#000"
                        : controlBackground,
                      boxShadow: 'inset 0 1px 1px rgba(255, 255, 255, 0.11), 0 1px 0px rgba(0,0,0,0.1)',
                      color: isCurrent
                        ? isDarkMode
                          ? "#000"
                          : "#fff"
                        : "inherit",
                      border: hasTrips
                        ? `0px solid ${markerColor}45`
                        : `0px solid ${softBorder}`,
                      cursor: hasTrips ? "pointer" : "default",
                      transition:
                        "transform 180ms cubic-bezier(0.16, 1, 0.3, 1), background-color 180ms ease",
                      "&:hover": hasTrips
                        ? {
                            transform: "translateY(-2px)",
                            bgcolor: `${markerColor}38`,
                          }
                        : {},
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{
                        opacity: isCurrent ? 0.7 : 0.48,
                        fontSize: "0.57rem",
                        fontWeight: 850,
                        lineHeight: 1,
                      }}
                    >
                      {date.toLocaleString("default", { weekday: "short" })}
                    </Typography>

                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 950,
                        mt: 0.35,
                        fontSize: "0.88rem",
                        lineHeight: 1,
                        color: isCurrent ? (isDarkMode ? "#000" : "#fff") : "inherit",
                      }}
                    >
                      {date.getDate()}
                    </Typography>

                    {hasTrips && !isCurrent && (
                      <Box
                        sx={{
                          position: "absolute",
                          bottom: 6,
                          width: 4,
                          height: 4,
                          borderRadius: "50%",
                          bgcolor: markerColor,
                        }}
                      />
                    )}
                  </Box>
                );
              })}
            </Box>
          </Box>
        )}
      </Box>
    );
  });

  HorizontalInfiniteCalendar.displayName = "HorizontalInfiniteCalendar";

  const isSelectedTripPinned = useMemo(() => {
    return selectedTrip ? pinnedTripIds.includes(selectedTrip.id) : false;
  }, [selectedTrip, pinnedTripIds]);

  const renderFilterButton = () => {
    const activeFiltersCount = [filterPlace, filterStartDate, filterEndDate].filter(Boolean).length;

    return (
      <IconButton
        onClick={(e) => {
          if (isDesktop) {
            setFilterAnchorEl(e.currentTarget);
          } else {
            setFilterOpen(true);
          }
        }}
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
            : (mode === "dark" ? "rgba(255, 255, 255, 0.04)" : "rgba(0, 0, 0, 0.1)"),
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
  };

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ minHeight: "100vh", mt: isDesktop ? 5 : 5, color: isDarkMode ? "#FFF" : "#000", pb: isDesktop ? 0 : 12, position: "relative" }}>
        <Container sx={{ px: 0, maxWidth: isDesktop ? "1440px !important" : undefined }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={isDesktop ? 0 : -3} sx={{ p: 1.1, px: isDesktop ? 6 : 3 }}>
            <Box zIndex={112}>  
              <Typography variant="h4" sx={{ fontWeight: 950, letterSpacing: "-1.8px", mt: 0.2 }}>Where next?</Typography>
            </Box>
            <Box zIndex={112} sx={{ display: isDesktop ? "none" : "flex" }}>
              <Notifications />
            </Box>
          </Box>
          
          {isDesktop ? (
            <Box sx={{ display: "flex", gap: 3.5, px: 3, pt: 0, alignItems: "flex-start" }}>
              <Box
                sx={{
                  width: 320,
                  flexShrink: 0,
                  position: "sticky",
                  top: 24,
                  borderRadius: "24px",
                  p: 2.5,
                  backgroundColor: isDarkMode ? "rgba(18, 18, 18, 0)" : "rgba(255, 255, 255, 0)",
                  border: 'none',
                  boxShadow: 'none',
                }}
              >
                <Box sx={{ mb: 2, display: "flex", gap: 1.5, alignItems: "center" }}>
                  <TextField
                    placeholder="Search your trips..."
                    variant="outlined"
                    size="small"
                    fullWidth
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    InputProps={{ startAdornment: (<InputAdornment position="start"><Search sx={{ color: mode === "dark" ? "rgba(255, 255, 255, 0.5)" : "rgba(0, 0, 0, 0.4)", mr: 1, fontSize: "1.25rem" }} /></InputAdornment>) }}
                    sx={{
                      width: "100%",
                      "& .MuiOutlinedInput-root": {
                        color: mode === "dark" ? "#fff" : "#111", borderRadius: 8, height: 44, backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)", backgroundColor: mode === "dark" ? "rgba(255, 255, 255, 0.04)" : "rgba(0, 0, 0, 0.04)",
                        boxShadow: mode === "dark" ? `inset 0 1px 2px rgba(255, 255, 255, 0.11), inset 0 -1px 1px rgba(35, 35, 35, 0.07)` : `inset 0 1px 1px rgba(255,255,255,0.8), inset 0 -1px 1px rgba(0,0,0,0.1)`,
                        border: "0px solid", borderColor: mode === "dark" ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.06)", transition: "all 0.2s ease-in-out", "& fieldset": { border: "none" },
                        "&:hover": { backgroundColor: mode === "dark" ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.05)" },
                        "&.Mui-focused": { backgroundColor: mode === "dark" ? "rgba(255, 255, 255, 0.04)" : "rgba(255, 255, 255, 0.8)" }
                      },
                      "& .MuiOutlinedInput-input": { py: 1.2, fontSize: "0.9rem" }
                    }}
                  />
                  {renderFilterButton()}
                </Box>

                <HorizontalInfiniteCalendar trips={filteredTrips} isDesktopColumn={true} />
              </Box>

              <Box sx={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 1.5, pt: 0 }}>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 2,
                    mb: 3,
                    flexWrap: "wrap",
                    position: "sticky",
                    top: 40,
                    zIndex: 110,
                  }}
                >
                  <Tabs
                    value={currentTab}
                    onChange={(_, v) => setCurrentTab(v)}
                    variant="scrollable"
                    scrollButtons={false}
                    sx={{
                      minHeight: 34,
                      height: 34,
                      backgroundColor: isDarkMode ? "rgba(20, 20, 20, 0.65)" : "rgba(255, 255, 255, 0.45)",
                      borderRadius: 8,
                      backdropFilter: "blur(10px)",
                      border: `0px solid ${isDarkMode ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}`,
                      p: "4px",
                      "& .MuiTabs-indicator": {
                        height: "100%",
                        borderRadius: 8,
                        backgroundColor: isDarkMode ? "#ffffff" : "#111111",
                        transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1) !important",
                      },
                      "& .MuiTabs-flexContainer": { height: "100%" }
                    }}
                  >
                    {['All', 'Upcoming', 'Ongoing', 'Past'].map((lbl, idx) => (
                      <Tab
                        label={lbl}
                        key={idx}
                        disableRipple
                        sx={{
                          textTransform: "none",
                          fontWeight: 700,
                          fontSize: "0.78rem",
                          letterSpacing: "0.01em",
                          minHeight: "100%",
                          height: "100%",
                          zIndex: 1,
                          minWidth: "auto",
                          px: 2.2,
                          color: isDarkMode ? "rgba(255, 255, 255, 0.6)" : "rgba(0, 0, 0, 0.6)",
                          "&.Mui-selected": {
                            color: isDarkMode ? "#000000" : "#ffffff",
                          },
                        }}
                      />
                    ))}
                  </Tabs>

                  <Button
                    variant="contained"
                    onClick={() => setCreateDialogOpen(true)}
                    startIcon={<Add sx={{ fontSize: 18 }} />}
                    sx={{
                      height: 44,
                      borderRadius: 8,
                      px: 2.5,
                      fontWeight: 700,
                      fontSize: "0.85rem",
                      textTransform: "none",
                      backgroundColor: isDarkMode ? "#ffffff" : "#000000",
                      color: isDarkMode ? "#313131" : "#ffffff",
                      boxShadow: isDarkMode ? 'inset 0 1px 10px rgba(1, 1, 1, 0.64), 0 1px 4px rgba(0,0,0,0.1)' : 'inset 0 1px 4px rgba(255, 255, 255, 0.11), 0 1px 4px rgba(0,0,0,0.1)',
                      "&:hover": {
                        backgroundColor: isDarkMode ? "rgba(255,255,255,0.85)" : "rgba(0,0,0,0.85)",
                        transform: "translateY(-1px)",
                      },
                      transition: "all 0.2s ease",
                    }}
                  >
                    New Trip
                  </Button>
                </Box>

                {/* Cards Section with Desktop Scroll Mask Gradient */}
                <Box
                  sx={{
                    width: "100%",
                    px: 2.3,
                    mb: 7,
                    boxSizing: "border-box",
                    maxHeight: "calc(100vh - 80px)",
                    position: "relative",
                    transition: "mask-image 0.3s ease, -webkit-mask-image 0.3s ease",
                  }}
                >
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: {
                        xs: "1fr",
                        sm: "1fr",
                        md: "repeat(2, minmax(0, 1fr))",
                      },
                      gap: {
                        xs: 2,
                        sm: 2.5,
                        md: 3,
                      },
                      width: "100%",
                      alignItems: "stretch",
                      pt: 1,
                    }}
                  >
                    {allTabsData[currentTab] &&
                    allTabsData[currentTab].length > 0 ? (
                      allTabsData[currentTab].map((trip) => (
                        <Box
                          key={trip.id}
                          sx={{
                            width: "100%",
                            minWidth: 0,
                          }}
                        >
                          {renderTripCard(trip)}
                        </Box>
                      ))
                    ) : (
                      <Box
                        id="empty-state-frame"
                        sx={{
                          gridColumn: "1 / -1",
                          textAlign: "center",
                          py: 8,
                          borderRadius: "24px",
                          border: `2px dashed ${
                            isDarkMode
                              ? "rgba(255,255,255,0.04)"
                              : "rgba(0,0,0,0.04)"
                          }`,
                        }}
                      >
                        <Typography
                          variant="h3"
                          sx={{ mb: 1 }}
                        >
                          🗺️
                        </Typography>

                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ fontWeight: 800 }}
                        >
                          No tracking data instances found in this timeline spectrum.
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Box>
              </Box>
            </Box>
          ) : (
            <>
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
                  {renderFilterButton()}
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
            </>
          )}
        </Container>

        {/* Desktop Trip Options Menu Dropdown */}
        {isDesktop && (
          <Menu
            anchorEl={desktopMenuAnchorEl}
            open={Boolean(desktopMenuAnchorEl)}
            onClose={() => { setDesktopMenuAnchorEl(null); setSelectedTrip(null); }}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            PaperProps={{
              sx: {
                width: 150,
                borderRadius: 6,
                p: 0.8,
                py: 0,
                background: isDarkMode ? "rgba(0, 0, 0, 0.2)" : "rgba(255, 255, 255, 0.75)",
                backdropFilter: "blur(20px) saturate(180%)",
                WebkitBackdropFilter: "blur(20px) saturate(180%)",
                border: `0px solid ${isDarkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.08)"}`,
                boxShadow: isDarkMode ? 'inset 0 1px 4px rgba(255, 255, 255, 0.11), 0 1px 4px rgba(0,0,0,0.1)' : "0 15px 35px rgba(0,0,0,0.1)",
                "& .MuiMenuItem-root": {
                  borderRadius: '10px',
                  my: 0.5,
                  py: 0.7,
                  px: 1.5,
                  fontWeight: 600,
                  fontSize: '0.88rem',
                }
              }
            }}
          >
            {selectedTrip && (
              <>
                <MenuItem onClick={() => { 
                  navigate(`/trips/${selectedTrip.id}`); 
                  setDesktopMenuAnchorEl(null); 
                  setSelectedTrip(null); 
                }}>
                  <ListItemIcon><OpenInNew fontSize="small" /></ListItemIcon>
                  Open
                </MenuItem>

                <MenuItem onClick={() => { 
                  setShareDrawerOpen(true); 
                  fetchFriendsNetwork(); 
                  setDesktopMenuAnchorEl(null); 
                }}>
                  <ListItemIcon><Share fontSize="small" /></ListItemIcon>
                  Share
                </MenuItem>

                <MenuItem onClick={() => { 
                  exportToICS(selectedTrip); 
                  setDesktopMenuAnchorEl(null); 
                  setSelectedTrip(null); 
                }}>
                  <ListItemIcon><CalendarToday fontSize="small" /></ListItemIcon>
                  Calendar
                </MenuItem>

                <MenuItem onClick={() => {
                  if (!selectedTrip || !user) return;
                  setPinnedTripIds(prev => {
                    const isPinned = prev.includes(selectedTrip.id);
                    const updated = isPinned 
                      ? prev.filter(id => id !== selectedTrip.id) 
                      : [...prev, selectedTrip.id];
                    localStorage.setItem(`bunkmate.pinnedTrips.${user.uid}`, JSON.stringify(updated));
                    return updated;
                  });
                  setDesktopMenuAnchorEl(null);
                  setSelectedTrip(null);
                }}>
                  <ListItemIcon><PushPin fontSize="small" /></ListItemIcon>
                  {isSelectedTripPinned ? "Unpin" : "Pin"}
                </MenuItem>

                <MenuItem 
                  onClick={() => { 
                    setDeleteDialogOpen(true); 
                    setDesktopMenuAnchorEl(null); 
                  }}
                  sx={{ color: '#f87171', '&:hover': { backgroundColor: 'rgba(248, 113, 113, 0.08)' } }}
                >
                  <ListItemIcon sx={{ color: '#f87171' }}><DeleteOutline fontSize="small" /></ListItemIcon>
                  Delete
                </MenuItem>
              </>
            )}
          </Menu>
        )}

        {/* Desktop Dropdown for Filters */}
        {isDesktop && (
          <Popover
            open={Boolean(filterAnchorEl)}
            anchorEl={filterAnchorEl}
            onClose={() => setFilterAnchorEl(null)}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            PaperProps={{
              sx: {
                width: 280,
                borderRadius: 8,
                p: 3,
                mt: 1.5,
                background: isDarkMode ? "rgba(255, 255, 255, 0.02)" : "rgba(255, 255, 255, 0.75)",
                backdropFilter: "blur(25px) saturate(180%)",
                WebkitBackdropFilter: "blur(25px) saturate(180%)",
                border: `0px solid ${isDarkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.08)"}`,
                boxShadow: isDarkMode ? 'inset 0 1px 4px rgba(255, 255, 255, 0.11), 0 1px 4px rgba(0,0,0,0.1)' : "0 15px 35px rgba(0,0,0,0.1)",
              }
            }}
          >
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2.5}>
              <Typography variant="h6" fontWeight={600} sx={{ letterSpacing: "-0.5px" }}>
                Filter/Sort
              </Typography>
              <IconButton size="medium" sx={{ background: isDarkMode ? '#f1f1f111' : "#0c0c0c07" }} onClick={() => setFilterAnchorEl(null)}>
                <CloseOutlinedIcon fontSize="medium" />
              </IconButton>
            </Box>

<Stack spacing={2.5}>
  {/* Filter by location */}
  <TextField
    label="Filter by Location / Place"
    placeholder="e.g. Jaipur, Goa, Manali"
    fullWidth
    size="small"
    value={filterPlace}
    onChange={(e) => setFilterPlace(e.target.value)}
    InputProps={{
      sx: {
        borderRadius: "16px",
        backgroundColor: isDarkMode
          ? "rgba(255,255,255,0.035)"
          : "rgba(0,0,0,0.025)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",

        "& input": {
          py: 1.35,
        },

        "&:hover": {
          backgroundColor: isDarkMode
            ? "rgba(255,255,255,0.055)"
            : "rgba(0,0,0,0.04)",
        },

        "&.Mui-focused": {
          backgroundColor: isDarkMode
            ? "rgba(255,255,255,0.06)"
            : "#fff",
        },
      },
    }}
    InputLabelProps={{
      sx: {
      },
    }}
  />

  {/* Date range */}
  <Stack
    direction={{
      xs: "column",
      sm: "row",
    }}
    spacing={1.5}
  >
    <TextField
      label="Start Date"
      type="date"
      size="small"
      fullWidth
      value={filterStartDate}
      onChange={(e) => setFilterStartDate(e.target.value)}
      InputLabelProps={{
        shrink: true,
      }}
      InputProps={{
        sx: {
          borderRadius: "16px",
          backgroundColor: isDarkMode
            ? "rgba(255,255,255,0.035)"
            : "rgba(0,0,0,0.025)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",

          "& input": {
            py: 1.35,
          },

          "&:hover": {
            backgroundColor: isDarkMode
              ? "rgba(255,255,255,0.055)"
              : "rgba(0,0,0,0.04)",
          },
        },
      }}
    />

    <TextField
      label="End Date"
      type="date"
      size="small"
      fullWidth
      value={filterEndDate}
      onChange={(e) => setFilterEndDate(e.target.value)}
      InputLabelProps={{
        shrink: true,
      }}
      InputProps={{
        sx: {
          borderRadius: "16px",
          backgroundColor: isDarkMode
            ? "rgba(255,255,255,0.035)"
            : "rgba(0,0,0,0.025)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",

          "& input": {
            py: 1.35,
          },

          "&:hover": {
            backgroundColor: isDarkMode
              ? "rgba(255,255,255,0.055)"
              : "rgba(0,0,0,0.04)",
          },
        },
      }}
    />
  </Stack>

  {/* Active filter indicator */}
  {(filterPlace || filterStartDate || filterEndDate) && (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1,
        px: 1.5,
        py: 1,
        borderRadius: "14px",
        backgroundColor: isDarkMode
          ? "rgba(255,255,255,0.045)"
          : "rgba(0,0,0,0.035)",
        border: `1px solid ${
          isDarkMode
            ? "rgba(255,255,255,0.07)"
            : "rgba(0,0,0,0.06)"
        }`,
      }}
    >
      <Box
        sx={{
          width: 7,
          height: 7,
          borderRadius: "50%",
          backgroundColor: isDarkMode ? "#fff" : "#111",
          flexShrink: 0,
        }}
      />

      <Typography
        variant="caption"
        sx={{
          color: "text.secondary",
          fontSize: "0.72rem",
        }}
      >
        Filters are currently active
      </Typography>
    </Box>
  )}

  {/* Actions */}
  <Stack
    direction="row"
    spacing={1.25}
    pt={0.5}
  >
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
        minHeight: 46,
        textTransform: "none",
        borderRadius: 8,
        fontSize: "0.9rem",
        borderColor: isDarkMode
          ? "rgba(255,255,255,0)"
          : "rgba(0,0,0,0.12)",
        color: "text.primary",
        boxShadow: 'inset 0 1px 4px rgba(255, 255, 255, 0.11), 0 1px 4px rgba(0,0,0,0)',
        backgroundColor: isDarkMode
          ? "rgba(255,255,255,0.025)"
          : "rgba(0,0,0,0.015)",
        transition: "all 0.2s ease",

        "&:hover": {
          borderColor: isDarkMode
            ? "rgba(255,255,255,0.25)"
            : "rgba(0,0,0,0.22)",
          backgroundColor: isDarkMode
            ? "rgba(255,255,255,0.06)"
            : "rgba(0,0,0,0.04)",
        },
      }}
    >
      Clear
    </Button>

    <Button
      fullWidth
      variant="contained"
      onClick={() => setFilterAnchorEl(null)}
      sx={{
        minHeight: 46,
        textTransform: "none",
        borderRadius: 8,
        fontSize: "0.9rem",

        backgroundColor: isDarkMode ? "#fff" : "#111",
        color: isDarkMode ? "#000" : "#fff",

        boxShadow: "none",

        "&:hover": {
          backgroundColor: isDarkMode
            ? "rgba(255,255,255,0.88)"
            : "#292929",
          boxShadow: "none",
          transform: "translateY(-1px)",
        },

        "&:active": {
          transform: "translateY(0)",
        },
      }}
    >
      Apply Filters
    </Button>
  </Stack>
</Stack>
          </Popover>
        )}

        <AnimatePresence>
          {actionMode && selectedTrip && !isDesktop && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.22, ease: "easeInOut" }}
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
                      backgroundImage: isValidImageUrl(selectedTrip?.iconURL) ? `url(${selectedTrip.iconURL})` : "none",
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

        {!isDesktop && (
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
        )}

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
          PaperProps={{ sx: { borderRadius: 8, p: 3, background: mode === "dark" ? "rgba(20, 20, 20, 0.08)" : "rgba(255,255,255,0.39)", backdropFilter: "blur(20px)", boxShadow: theme.palette.mode === "dark" ? `inset 0 1px 2px rgba(255, 255, 255, 0.11), inset 0 -1px 1px rgba(35, 35, 35, 0.07)` : `inset 0 1px 1px rgba(255,255,255,0.8), inset 0 -1px 1px rgba(0,0,0,0.1)`, maxWidth: 540, mx: "auto", m: 3 } }}
          ModalProps={{ BackdropProps: { sx: { backdropFilter: "blur(10px)", backgroundColor: "rgba(0,0,0,0)" } } }}
        >
          <Typography variant="h6" fontWeight="700" sx={{ textTransform: "none", textAlign: "center", mb: 2 }}>Delete Trip Instance</Typography>
          <Box display="flex" flexDirection="column" alignItems="center" gap={2} sx={{ mb: 3 }}>
            <Box sx={{ width: 56, height: 56, borderRadius: "50%", backgroundColor: mode === "dark" ? "rgba(229, 57, 53, 0.15)" : "#ffebee", display: "flex", alignItems: "center", justifyContent: "center" }}><Typography sx={{ fontSize: 26 }}>🗑️</Typography></Box>
            <Typography variant="body1" textAlign="center" sx={{ fontWeight: 500, px: 2 }}>Are you sure you want to completely drop <strong>{selectedTrip?.name}</strong>?</Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontStyle: "italic" }}>This change can't be reversed.</Typography>
          </Box>
          <Stack direction="row" spacing={2} justifyContent="center">
            <Button variant="outlined" fullWidth onClick={() => setDeleteDialogOpen(false)} sx={{ textTransform: "none", background: mode === "dark" ? "rgba(255, 255, 255, 0.08)" : "rgba(255,255,255,0.42)", backdropFilter: "blur(10px)", boxShadow: theme.palette.mode === "dark" ? `inset 0 1px 2px rgba(255, 255, 255, 0.11), inset 0 -1px 1px rgba(35, 35, 35, 0.07)` : `inset 0 1px 1px rgba(255,255,255,0.8), inset 0 -1px 1px rgba(0,0,0,0.1)`, borderRadius: 8, py: 1.2, fontWeight: 650, border: "none", color: mode === "dark" ? "#fff" : "#000", "&:hover": { backgroundColor: mode === "dark" ? "rgba(255, 255, 255, 0.05)" : "#f5f5f5" } }}>Cancel</Button>
            <Button variant="contained" fullWidth onClick={handleDeleteTrip} sx={{ textTransform: "none", background: mode === "dark" ? "rgba(229, 57, 53, 0.18)" : "rgba(255, 102, 102, 0.69)", backdropFilter: "blur(10px)", boxShadow: theme.palette.mode === "dark" ? `inset 0 1px 2px rgba(255, 255, 255, 0.11), inset 0 -1px 1px rgba(35, 35, 35, 0.07)` : `inset 0 1px 1px rgba(255,255,255,0.8), inset 0 -1px 1px rgba(0,0,0,0.1)`, borderRadius: 8, py: 1.2, fontWeight: 650, color: mode === "dark" ? "#fff" : "#000", "&:hover": { backgroundColor: "#c62828" } }}>Delete Trip</Button>
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
          handleNext={handleNext}
          handleBack={handleBack}
          handleCreateTrip={handleCreateTrip}
          createdTripDetails={createdTripDetails}
          setCreatedTripDetails={setCreatedTripDetails}
          user={user}
          db={db}
          mode={mode}
        />
        
      </Box>
    </ThemeProvider>
  );
}