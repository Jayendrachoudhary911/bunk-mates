import React, { useState, useMemo, useEffect, useCallback, useDeferredValue } from "react";
import {
  Box,
  TextField,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemAvatar,
  Avatar,
  ListItemText,
  Divider,
  Typography,
  CircularProgress,
  Paper,
  SwipeableDrawer,
  Button,
  Stack,
  Chip,
  alpha,
  IconButton,
  Card,
} from "@mui/material";
import {
  Search as SearchIcon,
  ArrowBack as ArrowBackIcon,
  Chat as MessageIcon,
  PersonAdd as PersonAddIcon,
  Close as CloseIcon,
  AutoAwesome as AutoAwesomeIcon,
  SmartToy as SmartToyIcon,
  FlightTakeoff as FlightTakeoffIcon,
  LocationOn as LocationOnIcon,
  DeleteOutline as DeleteOutlineIcon,
  Clear as ClearIcon,
  Refresh as RefreshIcon,
  ArrowForwardIos as ArrowForwardIosIcon,
} from "../icons";
import { motion, AnimatePresence } from "framer-motion";
import useUniversalSearch from "../hooks/useUniversalSearch";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useThemeToggle } from "../contexts/ThemeToggleContext";
import { useBackButtonClose } from "../hooks/useBackButtonClose";
import { getTheme } from "../theme";
import {
  designTokens,
  glass,
  cardHover,
  drawerPaperSx,
  drawerBackdropSx,
  drawerHandleSx,
  searchFieldSx,
  filterChipSx,
  toggleGroupSx,
  DrawerHandle,
  glassPanelSx,
} from "../theme/designSystem";
import {
  doc,
  onSnapshot,
  getDoc,
  updateDoc,
  arrayUnion,
  collection,
  addDoc,
} from "firebase/firestore";
import { db, auth } from "../firebase";
import { useCreateTripDrawer } from "../hooks/useCreateTripDrawer";
import CreateTripDrawer from "../components/trips_components/CreateDrawer";

// Modular utilities and AI Services
import {
  getAllDataJsonPlaces,
  getCurrentSeasonMeta,
  getHistoryMeta,
  getFallbackSuggestions,
  getUnsplashTravelImages,
  getNearestSuggestedPlaces,
  getFeaturedPlaces,
} from "../utils/searchHelpers";
import {
  fetchContextAiSuggestions,
  fetchQueryAiTripRecommendations,
  fetchPlaceAiGuide,
  fetchSearchAiSummary,
} from "../services/aiSearchService";

// Safely format location field (handling string, GeoPoint object with lat/lng, or city/state object)
const safeLocationString = (loc) => {
  if (!loc) return "";
  if (typeof loc === "string") return loc;
  if (typeof loc === "object") {
    if (loc.city || loc.state) {
      return [loc.city, loc.state].filter(Boolean).join(", ");
    }
    if (loc.lat !== undefined && loc.lng !== undefined) {
      return `${Number(loc.lat).toFixed(2)}°, ${Number(loc.lng).toFixed(2)}°`;
    }
    return "";
  }
  return String(loc);
};

export default function SearchPage() {
  const { mode, accent } = useThemeToggle();
  const theme = getTheme(mode, accent);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [q, setQ] = useState("");
  const [committedQuery, setCommittedQuery] = useState("");
  const [isCommitted, setIsCommitted] = useState(false);
  const [aiSummary, setAiSummary] = useState(null);
  const [isAiSummaryLoading, setIsAiSummaryLoading] = useState(false);
  const [tab, setTab] = useState("all");
  const [swipeDirection, setSwipeDirection] = useState(1);
  const [selectedItem, setSelectedItem] = useState(null);
  const [drawerContentType, setDrawerContentType] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);


  // Close drawer and clean URL search params without clearing search query or results
  const closeDrawer = useCallback(() => {
    setDrawerOpen(false);

    // Remove drawer params from URL while keeping search query
    setSearchParams((prevParams) => {
      const newParams = new URLSearchParams(prevParams);
      if (newParams.has("drawer")) {
        newParams.delete("drawer");
        newParams.delete("type");
      }
      return newParams;
    }, { replace: true });

    setTimeout(() => {
      setSelectedItem(null);
      setDrawerContentType(null);
    }, 300);
  }, [setSearchParams]);

  // Open drawer cleanly on click
  const openDrawerWithItem = useCallback((type, item) => {
    setSelectedItem(item);
    setDrawerContentType(type);
    setDrawerOpen(true);

    setSearchParams((prevParams) => {
      const newParams = new URLSearchParams(prevParams);
      newParams.set("drawer", "open");
      newParams.set("type", type);
      return newParams;
    }, { replace: true });
  }, [setSearchParams]);

  // Handle Header & Navigation Back Button Click
  const handleHeaderBackClick = useCallback(() => {
    if (drawerOpen) {
      closeDrawer();
      return;
    }
    if (isCommitted) {
      setIsCommitted(false);
      setCommittedQuery("");
      setShowSuggestions(false);
      setAiSummary(null);
    } else {
      navigate(-1);
    }
  }, [drawerOpen, closeDrawer, isCommitted, navigate]);

  // Sync hardware back button / URL params with drawer state
  useEffect(() => {
    const isDrawerParamOpen = searchParams.get("drawer") === "open";
    // Only close if URL doesn't have drawer=open AND drawer state is currently open
    if (!isDrawerParamOpen && drawerOpen) {
      setDrawerOpen(false);
      setTimeout(() => {
        setSelectedItem(null);
        setDrawerContentType(null);
      }, 300);
    }
  }, [searchParams]); // Removed `drawerOpen` from dependency array to prevent immediate close loop

  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

  const [fetchedAllUsers, setFetchedAllUsers] = useState([]);
  const [isFetchingAllUsers, setIsFetchingAllUsers] = useState(true);

  // Context-Aware AI Search State
  const [userLocation, setUserLocation] = useState("India");
  const seasonMeta = useMemo(() => getCurrentSeasonMeta(), []);

  const [searchHistory, setSearchHistory] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("search_history")) || [];
    } catch {
      return [];
    }
  });

  const [aiSuggestions, setAiSuggestions] = useState(() =>
    getFallbackSuggestions("India", seasonMeta.season)
  );
  const quickQueryChips = useMemo(() => [
    `Trips near ${userLocation}`,
    `Best places in ${seasonMeta.month}`,
    `Top getaways in ${seasonMeta.season}`
  ], [userLocation, seasonMeta]);
  const [isAiSuggestionsLoading, setIsAiSuggestionsLoading] = useState(false);

  const deferredQ = useDeferredValue(q);
  const { results } = useUniversalSearch(deferredQ, { maxPerCollection: 200 });
  const [showSuggestions, setShowSuggestions] = useState(false);
  const allPlacesCatalog = useMemo(() => getAllDataJsonPlaces(), []);

  const allUsersList = useMemo(() => {
    const combined = [
      ...(results.users || []),
      ...(fetchedAllUsers || []),
    ];
    const map = new Map();
    combined.forEach((u) => {
      const uid = u.uid || u.id;
      if (uid && !map.has(uid)) {
        map.set(uid, u);
      }
    });
    return Array.from(map.values());
  }, [results.users, fetchedAllUsers]);

  const usersToDisplay = useMemo(() => {
    const trimmedQ = deferredQ.trim().toLowerCase();
    const currentUserId = auth.currentUser?.uid;

    const filtered = allUsersList.filter((user) => {
      const isSelf = currentUserId && (user.uid === currentUserId || user.id === currentUserId);
      if (isSelf) return false;

      if (!trimmedQ) return true;

      const displayName = (user.displayName || user.name || "").toLowerCase();
      const username = (user.username || "").toLowerCase();
      const email = (user.email || "").toLowerCase();

      return displayName.includes(trimmedQ) || username.includes(trimmedQ) || email.includes(trimmedQ);
    });

    if (!trimmedQ) return filtered;

    return filtered.map((user) => {
      const displayName = (user.displayName || user.name || "").toLowerCase();
      const username = (user.username || "").toLowerCase();

      let score = 0;
      if (username.startsWith(trimmedQ) || displayName.startsWith(trimmedQ)) score += 3;
      else if (username.includes(trimmedQ) || displayName.includes(trimmedQ)) score += 1;

      return { ...user, _matchScore: score };
    }).sort((a, b) => (b._matchScore || 0) - (a._matchScore || 0));
  }, [deferredQ, allUsersList]);

  const liveSuggestions = useMemo(() => {
    const trimmed = deferredQ.trim();
    if (!trimmed) return [];
    const lowerTerm = trimmed.toLowerCase();
    const suggestions = [];

    // 1. Users
    allUsersList.forEach((u) => {
      const isSelf = auth.currentUser && (u.uid === auth.currentUser.uid || u.id === auth.currentUser.uid);
      if (isSelf) return;

      const name = u.displayName || u.name || u.nickname || "";
      const username = u.username || "";
      const email = u.email || "";

      if (!name && !username && !email) return;

      const lowerName = name.toLowerCase();
      const lowerUser = username.toLowerCase();
      const lowerEmail = email.toLowerCase();

      if (
        lowerName.includes(lowerTerm) ||
        lowerUser.includes(lowerTerm) ||
        lowerEmail.includes(lowerTerm)
      ) {
        suggestions.push({
          id: `u-${u.id || u.uid || username || name}`,
          label: name || `@${username}` || email,
          sublabel: username ? `@${username} • User Profile` : email ? `${email} • User` : "User Profile",
          category: "Users",
          icon: "👤",
          type: "user",
          image: u.photoURL || u.avatar || u.profileImage || "",
          item: u,
        });
      }
    });

    // 2. Notes
    (results.notes || []).forEach((n) => {
      const title = n.title || n.name || "Untitled Note";
      const text = n.content || n.text || "";
      if (title.toLowerCase().includes(lowerTerm) || text.toLowerCase().includes(lowerTerm)) {
        suggestions.push({
          id: `n-${n.id || title}`,
          label: title,
          sublabel: text ? text.slice(0, 45) + "..." : "Note",
          category: "Notes",
          icon: "📝",
          type: "note",
          item: n,
        });
      }
    });

    // 3. Reminders
    (results.reminders || []).forEach((r) => {
      const title = r.title || r.text || "Reminder";
      if (title.toLowerCase().includes(lowerTerm)) {
        suggestions.push({
          id: `r-${r.id || title}`,
          label: title,
          sublabel: r.date ? `Due: ${r.date}` : "Reminder",
          category: "Reminders",
          icon: "⏰",
          type: "reminder",
          item: r,
        });
      }
    });

    // 4. Trips
    (results.trips || []).forEach((t) => {
      const title = t.name || t.title || "Trip";
      const loc = t.location || t.to || "";
      if (title.toLowerCase().includes(lowerTerm) || loc.toLowerCase().includes(lowerTerm)) {
        suggestions.push({
          id: `t-${t.id || title}`,
          label: title,
          sublabel: loc ? `To ${loc}` : "Trip",
          category: "Trips",
          icon: "🧳",
          type: "trip",
          item: t,
        });
      }
    });

    // 5. Places
    (allPlacesCatalog || []).forEach((p) => {
      const name = p.name || "";
      const city = p.city || p.district || "";
      const state = p.state || "";
      const type = p.type || "Place";
      if (
        name.toLowerCase().includes(lowerTerm) ||
        city.toLowerCase().includes(lowerTerm) ||
        state.toLowerCase().includes(lowerTerm) ||
        type.toLowerCase().includes(lowerTerm)
      ) {
        suggestions.push({
          id: `p-${p.id || name}`,
          label: name,
          sublabel: `${type} in ${city}, ${state}`,
          category: "Places",
          icon: "📍",
          type: "place",
          image: p.images?.[0] || p.image || "",
          item: p,
        });
      }
    });

    // Deduplicate by case-insensitive label
    const map = new Map();
    suggestions.forEach((s) => {
      if (!map.has(s.label.toLowerCase())) {
        map.set(s.label.toLowerCase(), s);
      }
    });

    const topItems = Array.from(map.values()).slice(0, 7);

    // Append AI Search option
    topItems.push({
      id: `ai-opt-${trimmed}`,
      label: `Ask Groq AI about "${trimmed}"`,
      sublabel: `Auto-generate travel itineraries & tips`,
      category: "AI Search",
      icon: "✨",
      type: "ai_search",
      query: trimmed,
    });

    return topItems;
  }, [deferredQ, results, allPlacesCatalog, allUsersList]);

  const handleSelectAutocompleteSuggestion = (sugg) => {
    setShowSuggestions(false);
    if (sugg.type === "place") {
      openDrawerWithItem("place", sugg.item);
      setQ(sugg.label);
    } else if (sugg.type === "user") {
      openDrawerWithItem("user", sugg.item);
      setQ(sugg.label);
    } else if (sugg.type === "trip") {
      openDrawerWithItem("trip", sugg.item);
      setQ(sugg.label);
    } else if (sugg.type === "ai_search") {
      handleSearchCommit(sugg.query);
      setTab("ai");
      handleQueryAiSearch(sugg.query);
    } else {
      handleSearchCommit(sugg.label);
    }
  };

  const handleClearHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem("search_history");
  };

  const handleDeleteHistoryItem = (e, itemToDelete) => {
    e.stopPropagation();
    setSearchHistory((prev) => {
      const updated = prev.filter((i) => i !== itemToDelete);
      localStorage.setItem("search_history", JSON.stringify(updated));
      return updated;
    });
  };

  const {
    createDialogOpen,
    step,
    setStep,
    newTrip,
    setNewTrip,
    selectedMembers,
    setSelectedMembers,
    openDrawerWithPrefill,
    closeDrawer: closeTripDrawer,
    handleNext,
    handleBack,
    handleCreateTrip,
    isFetchingLocation,
    createdTripDetails,
    setCreatedTripDetails,
  } = useCreateTripDrawer();

  const [aiResults, setAiResults] = useState([]);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [userGroqKey, setUserGroqKey] = useState("");
  const [placeAiGuide, setPlaceAiGuide] = useState(null);
  const [isPlaceAiLoading, setIsPlaceAiLoading] = useState(false);

  useEffect(() => {
    const fetchGroqKey = async () => {
      const activeUser = auth.currentUser;
      if (!activeUser?.uid) return;
      try {
        const snap = await getDoc(doc(db, "users", activeUser.uid));
        if (snap.exists() && snap.data().groqApiKey) {
          setUserGroqKey(snap.data().groqApiKey);
        }
      } catch (e) {
        console.warn("Could not fetch Groq key:", e);
      }
    };
    fetchGroqKey();
  }, []);

  // Detect user's current physical location
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            const res = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
            );
            const resData = await res.json();
            const city = resData?.address?.city || resData?.address?.state || resData?.address?.country || "India";
            setUserLocation(city);
          } catch (e) {
            console.warn("Could not resolve location address:", e);
          }
        },
        () => console.log("Geolocation permission denied or unavailable.")
      );
    }
  }, []);

  // Fetch contextual AI search suggestions formatted for search list from data/data.json
  const generateContextAiSuggestions = useCallback(async () => {
    setIsAiSuggestionsLoading(true);
    try {
      const suggestions = await fetchContextAiSuggestions(
        userGroqKey,
        userLocation,
        seasonMeta,
        searchHistory
      );
      if (suggestions && suggestions.length > 0) {
        setAiSuggestions(suggestions);
      }
    } catch (err) {
      console.error("AI Suggestions error:", err);
      setAiSuggestions(getFallbackSuggestions(userLocation, seasonMeta.season));
    } finally {
      setIsAiSuggestionsLoading(false);
    }
  }, [userGroqKey, userLocation, seasonMeta, searchHistory]);

  useEffect(() => {
    generateContextAiSuggestions();
  }, [userLocation, generateContextAiSuggestions]);

  const handleQueryAiSearch = useCallback(async (searchQueryText) => {
    const queryToUse = searchQueryText || q;
    if (!queryToUse.trim()) return;

    setIsAiLoading(true);
    try {
      const recs = await fetchQueryAiTripRecommendations(userGroqKey, queryToUse, userLocation, seasonMeta);
      setAiResults(recs);
    } catch (err) {
      console.error("AI Search failed:", err);
    } finally {
      setIsAiLoading(false);
    }
  }, [q, userGroqKey, userLocation, seasonMeta]);

  // Auto-generate AI search results when user types a query
  useEffect(() => {
    const trimmed = q.trim();
    if (!trimmed || trimmed.length < 2) {
      setAiResults([]);
      return;
    }

    const timer = setTimeout(() => {
      handleQueryAiSearch(trimmed);
    }, 450);

    return () => clearTimeout(timer);
  }, [q, handleQueryAiSearch]);

  const handlePlanAiRecommendation = (rec) => {
    const today = new Date();
    const endDate = new Date(today.getTime() + (rec.durationDays || 3) * 24 * 60 * 60 * 1000);

    openDrawerWithPrefill({
      name: rec.name || `${rec.from || "Origin"} to ${rec.to || "Destination"}`,
      from: rec.from || userLocation || "",
      to: rec.to || "",
      location: rec.to ? `${rec.from ? rec.from + " → " : ""}${rec.to}` : "Destination",
      startDate: today.toISOString().slice(0, 10),
      endDate: endDate.toISOString().slice(0, 10),
      budget: rec.budget ? rec.budget.toString() : "",
      description: rec.description || "",
    });
  };

  // Reset place AI guide when selectedItem changes
  useEffect(() => {
    setPlaceAiGuide(null);
  }, [selectedItem?.name]);

  const generatePlaceAiGuide = async (placeName, placeCity) => {
    setIsPlaceAiLoading(true);
    try {
      const guide = await fetchPlaceAiGuide(userGroqKey, placeName, placeCity, selectedItem);
      setPlaceAiGuide(guide);
    } catch (err) {
      console.warn("Place AI guide error:", err);
    } finally {
      setIsPlaceAiLoading(false);
    }
  };

  useBackButtonClose(drawerOpen, closeDrawer);
  useBackButtonClose(createDialogOpen, () => closeTripDrawer());

  useEffect(() => {
    const bottomBar = document.getElementById("bottom-nav");
    if (bottomBar) {
      bottomBar.style.display = q.trim() ? "none" : "flex";
    }
    return () => {
      if (bottomBar) bottomBar.style.display = "flex";
    };
  }, [q]);

  // Fetch current user data
  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (!user) {
        setCurrentUser(null);
        setIsInitialLoading(false);
        return;
      }

      const userId = user.uid;
      const userDocRef = doc(db, "users", userId);

      const unsubscribeSnapshot = onSnapshot(userDocRef, (docSnap) => {
        if (docSnap.exists()) {
          const resData = docSnap.data();
          setCurrentUser({
            ...resData,
            profileVisibility: resData.privacy?.profileVisibility || 'public',
            friends: resData.friends || [],
          });
        }
        setIsInitialLoading(false);
      });

      return () => unsubscribeSnapshot();
    });

    return () => unsubscribeAuth();
  }, []);

  // Fetch ALL users
  useEffect(() => {
    const usersCollectionRef = collection(db, "users");

    const unsubscribe = onSnapshot(usersCollectionRef, (snapshot) => {
      const usersList = snapshot.docs.map(docSnap => {
        const resData = docSnap.data();
        const uid = docSnap.id;
        const nickname = resData.nicknames ? resData.nicknames[uid] : null;
        const visibility = resData.privacy?.profileVisibility || 'public';

        return {
          id: uid,
          uid: uid,
          ...resData,
          nickname: nickname,
          displayName: nickname || resData.name || "Unnamed User",
          profileVisibility: visibility,
        };
      });
      setFetchedAllUsers(usersList);
      setIsFetchingAllUsers(false);
    }, (error) => {
      console.error("Error fetching all users:", error);
      setIsFetchingAllUsers(false);
    });

    return () => unsubscribe();
  }, []);

  const generateAiSummary = useCallback(async (searchTerm) => {
    if (!searchTerm || !searchTerm.trim()) return;
    setIsAiSummaryLoading(true);
    setAiSummary(null);
    try {
      const summary = await fetchSearchAiSummary(userGroqKey, searchTerm, userLocation, seasonMeta);
      setAiSummary(summary);
    } catch (err) {
      console.error("AI Summary generation failed:", err);
    } finally {
      setIsAiSummaryLoading(false);
    }
  }, [userGroqKey, userLocation, seasonMeta]);

  const handleSearchCommit = (value) => {
    const term = (value || "").trim();
    if (!term) return;
    setQ(term);
    setCommittedQuery(term);
    setIsCommitted(true);
    setShowSuggestions(false);

    setSearchHistory((prev) => {
      const updated = [term, ...prev.filter((i) => i !== term)].slice(0, 6);
      localStorage.setItem("search_history", JSON.stringify(updated));
      return updated;
    });

    generateAiSummary(term);
    handleQueryAiSearch(term);
  };

  const handleExecuteSuggestion = (suggestionParam) => {
    if (typeof suggestionParam === "object" && suggestionParam?.dataJsonItem) {
      openDrawerWithItem("place", suggestionParam.dataJsonItem);
      return;
    }
    const searchString = typeof suggestionParam === "string" ? suggestionParam : suggestionParam?.query || suggestionParam?.place || "";
    if (!searchString) return;
    handleSearchCommit(searchString);
    setTab("ai");
    handleQueryAiSearch(searchString);
  };

  const currentUid = auth.currentUser?.uid;

  const filteredNotes = useMemo(() => {
    if (!results.notes || !currentUid) return [];
    return results.notes.filter(
      (note) =>
        note.createdBy === currentUid ||
        (Array.isArray(note.sharedWith) && note.sharedWith.includes(currentUid))
    );
  }, [results.notes, currentUid]);

  const filteredReminders = useMemo(() => {
    if (!results.reminders || !currentUid) return [];
    return results.reminders.filter(
      (reminder) =>
        reminder.createdBy === currentUid ||
        (Array.isArray(reminder.sharedWith) && reminder.sharedWith.includes(currentUid))
    );
  }, [results.reminders, currentUid]);

  const myTrips = useMemo(() => {
    return results.trips || [];
  }, [results.trips]);

  const filteredTrips = useMemo(() => {
    return myTrips;
  }, [myTrips]);

  const placesToDisplay = useMemo(() => {
    const term = deferredQ.trim().toLowerCase();
    const directPlaces = results.places || [];
    const placeMap = new Map();

    directPlaces.forEach((p) => {
      const key = (p.name || "").toLowerCase();
      if (key) placeMap.set(key, p);
    });

    if (term) {
      allPlacesCatalog.forEach((p) => {
        const pName = (p.name || "").toLowerCase();
        const pCity = (p.city || p.district || "").toLowerCase();
        const pState = (p.state || "").toLowerCase();

        if (
          pName.includes(term) ||
          pCity.includes(term) ||
          pState.includes(term) ||
          term.includes(pCity) ||
          term.includes(pName)
        ) {
          if (!placeMap.has(pName)) {
            placeMap.set(pName, p);
          }
        }
      });

      (myTrips || []).forEach((t) => {
        const tripDest = (t.to || t.location || "").toLowerCase();
        if (tripDest && (tripDest.includes(term) || term.includes(tripDest))) {
          allPlacesCatalog.forEach((p) => {
            const pName = (p.name || "").toLowerCase();
            const pCity = (p.city || p.district || "").toLowerCase();
            if (
              pName.includes(tripDest) ||
              pCity.includes(tripDest) ||
              tripDest.includes(pCity)
            ) {
              if (!placeMap.has(pName)) {
                placeMap.set(pName, p);
              }
            }
          });
        }
      });
    }

    return Array.from(placeMap.values());
  }, [deferredQ, results.places, myTrips, allPlacesCatalog]);

  const totalAllCount = useMemo(() => {
    return (
      usersToDisplay.length +
      (filteredNotes?.length || 0) +
      (filteredReminders?.length || 0) +
      myTrips.length +
      placesToDisplay.length
    );
  }, [usersToDisplay, filteredNotes, filteredReminders, myTrips, placesToDisplay]);

  const tabsConfig = useMemo(() => {
    const rawTabs = [
      { id: "all", label: `ALL (${totalAllCount})`, count: totalAllCount },
      { id: "users", label: `USERS (${usersToDisplay.length})`, count: usersToDisplay.length },
      { id: "trips", label: `TRIPS (${myTrips.length})`, count: myTrips.length },
      { id: "places", label: `PLACES (${placesToDisplay.length})`, count: placesToDisplay.length },
      { id: "notes", label: `NOTES (${filteredNotes?.length || 0})`, count: filteredNotes?.length || 0 },
      { id: "reminders", label: `REMINDERS (${filteredReminders?.length || 0})`, count: filteredReminders?.length || 0 },
      { id: "ai", label: `✨ AI ASSIST (${aiResults.length})`, count: aiResults.length },
    ];

    const nonZeroTabs = rawTabs.filter((t) => t.count > 0);
    return nonZeroTabs.length > 0 ? nonZeroTabs : [rawTabs[0]];
  }, [totalAllCount, usersToDisplay.length, myTrips.length, placesToDisplay.length, filteredNotes, filteredReminders, aiResults.length]);

  // Automatically activate the tab that contains the highest number of results
  useEffect(() => {
    if (!isCommitted || !committedQuery.trim()) return;

    const counts = {
      users: usersToDisplay.length,
      places: placesToDisplay.length,
      trips: myTrips.length,
      notes: filteredNotes?.length || 0,
      reminders: filteredReminders?.length || 0,
      ai: aiResults.length,
    };

    let maxCat = tabsConfig[0]?.id || "all";
    let maxVal = 0;
    for (const [cat, count] of Object.entries(counts)) {
      if (count > maxVal) {
        maxVal = count;
        maxCat = cat;
      }
    }

    if (tabsConfig.some((t) => t.id === maxCat)) {
      setTab(maxCat);
    } else if (tabsConfig.length > 0) {
      setTab(tabsConfig[0].id);
    }
  }, [isCommitted, committedQuery, usersToDisplay.length, placesToDisplay.length, myTrips.length, filteredNotes, filteredReminders, aiResults.length, tabsConfig]);

  const groups = useMemo(
    () => [
      { key: "users", label: "Users", items: usersToDisplay },
      { key: "notes", label: "Notes", items: filteredNotes },
      { key: "reminders", label: "Reminders", items: filteredReminders },
      { key: "trips", label: "Trips", items: filteredTrips },
      { key: "places", label: "Places", items: placesToDisplay },
    ],
    [usersToDisplay, filteredNotes, filteredReminders, filteredTrips, placesToDisplay]
  );

  const filteredGroups =
    tab === "all" ? groups : groups.filter((g) => g.key === tab);

  const handleItemClick = (type, item) => {
    if (["users", "friends"].includes(type)) {
      openDrawerWithItem("user", item);
    } else if (type === "places") {
      openDrawerWithItem("place", item);
    } else if (["ai_trip", "ai_recommendation", "ai"].includes(type)) {
      openDrawerWithItem("ai_trip", item);
    } else if (type === "notes")
      navigate(`/notes`, { state: { openNoteId: item.id } });
    else if (type === "reminders")
      navigate(`/reminders`, { state: { openReminderId: item.id } });
    else if (type === "trips") navigate(`/trips/${item.id}`);
  };

  const handleAddFriend = async (targetUser) => {
    try {
      if (!auth.currentUser) {
        alert("You must be logged in to add friends");
        return;
      }

      const currentUid = auth.currentUser.uid;
      if (targetUser.uid === currentUid) {
        alert("You cannot add yourself as a friend!");
        return;
      }

      const currentUserRef = doc(db, "users", currentUid);
      const targetUserRef = doc(db, "users", targetUser.uid);
      const [currentSnap, targetSnap] = await Promise.all([
        getDoc(currentUserRef),
        getDoc(targetUserRef),
      ]);

      if (!currentSnap.exists() || !targetSnap.exists()) {
        alert("User data not found");
        return;
      }

      const currentUserData = currentSnap.data();
      const visibility = targetSnap.data().privacy?.profileVisibility || "public";
      const currentUserName = currentUserData.name || "A user";
      const currentUserPic = currentUserData.photoURL || "";

      if (visibility === "public") {
        await Promise.all([
          updateDoc(currentUserRef, { friends: arrayUnion(targetUser.uid) }),
          updateDoc(targetUserRef, { friends: arrayUnion(currentUid) }),
        ]);

        await Promise.all([
          addDoc(collection(db, "notifications"), {
            content: `${currentUserName} added you as a friend.`,
            pic: currentUserPic,
            seen: false,
            senderId: currentUid,
            timestamp: new Date(),
            title: "New Friend Added",
            type: "friend_added",
            uid: targetUser.uid,
          }),
          addDoc(collection(db, "notifications"), {
            content: `You are now friends with ${targetUser.displayName || targetUser.name}.`,
            pic: targetUser.photoURL || "",
            seen: false,
            senderId: targetUser.uid,
            timestamp: new Date(),
            title: "Friendship Confirmed",
            type: "friend_added_self",
            uid: currentUid,
          }),
        ]);

        alert(`You and ${targetUser.displayName || targetUser.name} are now friends!`);
      } else {
        await addDoc(collection(db, "notifications"), {
          content: `${currentUserName} sent you a friend request.`,
          pic: currentUserPic,
          seen: false,
          senderId: currentUid,
          timestamp: new Date(),
          title: "Friend Request Received",
          type: "friend_request",
          uid: targetUser.uid,
          status: "pending",
        });

        alert("Friend request sent! Waiting for approval.");
      }
    } catch (err) {
      console.error("Error adding friend:", err);
      alert("Something went wrong while adding friend.");
    }
  };

  const UserDrawerContent = ({ user }) => {
    const [hasPendingRequest, setHasPendingRequest] = useState(false);
    const [isRequestReceived, setIsRequestReceived] = useState(false);
    const [requestId, setRequestId] = useState(null);
    const [loadingRequestState, setLoadingRequestState] = useState(true);
    const [isCurrentUserFriend, setIsCurrentUserFriend] = useState(false);

    const currentUid = auth.currentUser?.uid;
    const isSelf = currentUid === user.uid;
    const visibility = user.profileVisibility || "public";
    const isPublic = visibility === "public";
    const isFullyViewable = isSelf || isCurrentUserFriend || isPublic;

    const joinDate = user.createdAt
      ? new Date(user.createdAt.seconds * 1000).toLocaleDateString()
      : "Unknown";

    useEffect(() => {
      if (!currentUid || !user?.uid || isSelf) return;
      setLoadingRequestState(true);

      const notificationsRef = collection(db, "notifications");
      const unsubscribe = onSnapshot(notificationsRef, (snapshot) => {
        const requests = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));

        const sent = requests.find(
          (r) =>
            r.type === "friend_request" &&
            r.senderId === currentUid &&
            r.uid === user.uid &&
            (r.status === "pending" || r.status === "accepted")
        );

        const received = requests.find(
          (r) =>
            r.type === "friend_request" &&
            r.senderId === user.uid &&
            r.uid === currentUid &&
            r.status === "pending"
        );

        setHasPendingRequest(!!sent);
        setIsRequestReceived(!!received);
        setRequestId(received ? received.id : sent ? sent.id : null);
        setLoadingRequestState(false);
        if (sent?.status === "accepted" || received?.status === "accepted") {
          setIsCurrentUserFriend(true);
        }
      });

      return () => unsubscribe();
    }, [currentUid, user?.uid, isSelf]);

    useEffect(() => {
      if (!currentUid || !user?.uid || isSelf) return;

      const currentUserRef = doc(db, "users", currentUid);
      const unsubscribe = onSnapshot(currentUserRef, (docSnap) => {
        if (docSnap.exists()) {
          const friends = docSnap.data().friends || [];
          setIsCurrentUserFriend(friends.includes(user.uid));
        }
      });

      return () => unsubscribe();
    }, [currentUid, user?.uid, isSelf]);

    const handleAcceptRequest = async () => {
      if (!requestId || !user?.uid || !currentUid) return;
      try {
        const requestRef = doc(db, "notifications", requestId);
        await updateDoc(requestRef, { status: "accepted" });

        await Promise.all([
          updateDoc(doc(db, "users", currentUid), {
            friends: arrayUnion(user.uid),
          }),
          updateDoc(doc(db, "users", user.uid), {
            friends: arrayUnion(currentUid),
          }),
        ]);

        await addDoc(collection(db, "notifications"), {
          content: `${auth.currentUser?.displayName || "A user"} accepted your friend request.`,
          pic: auth.currentUser?.photoURL || "",
          seen: false,
          senderId: currentUid,
          timestamp: new Date(),
          title: "Friend Request Accepted",
          type: "friend_accept",
          uid: user.uid,
          status: "accepted",
        });

        alert(`You and ${user.displayName || user.name} are now friends!`);
      } catch (err) {
        console.error("Error accepting request:", err);
        alert("Something went wrong while accepting the friend request.");
      }
    };

    const handleRejectRequest = async () => {
      if (!requestId) return;
      try {
        await addDoc(collection(db, "notifications"), {
          content: `${auth.currentUser?.displayName || "A user"} rejected your friend request.`,
          pic: auth.currentUser?.photoURL || "",
          seen: false,
          senderId: currentUid,
          timestamp: new Date(),
          title: "Friend Request Rejected",
          type: "friend_reject",
          uid: user.uid,
          status: "rejected",
        });

        alert("Friend request rejected.");
      } catch (err) {
        console.error("Error rejecting request:", err);
      }
    };

    const limitedInfo = [
      { label: "Display Name", value: user.displayName || user.name },
      { label: "Profile Status", value: visibility },
    ];

    const fullInfo = [
      { label: "Username", value: user.username && `@${user.username}` },
      { label: "Email", value: user.email },
      { label: "Location", value: safeLocationString(user.location) },
      { label: "Gender", value: user.gender },
      { label: "Date of Birth", value: user.dateOfBirth },
      { label: "Occupation", value: user.occupation },
      { label: "Education", value: user.education },
      { label: "Joined Date", value: joinDate },
      { label: "Languages", value: user.languages?.join(", ") },
      { label: "Hobbies", value: user.hobbies?.join(", ") },
      { label: "Interests", value: user.interests?.join(", ") },
      {
        label: "Social Links",
        value: user.socialLinks ? Object.keys(user.socialLinks).join(", ") : null,
      },
    ].filter((item) => item.value);

    return (
      <Box
        src={user.photoURL}
        sx={{
          position: "relative",
          p: 3,
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            zIndex: 0,
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            maskImage:
              "linear-gradient(to bottom, black 0%, black 30%, transparent 75%)",
            WebkitMaskImage:
              "linear-gradient(to bottom, black 0%, black 30%, transparent 75%)",
          }}
        />

        <Box sx={{ position: "relative", zIndex: 1 }}>
          <Stack alignItems="center" spacing={1.5} sx={{ mb: 3 }}>
            <Avatar
              src={user.photoURL}
              sx={{
                width: 120,
                height: 120,
                mb: 1,
                borderRadius: 6,
                boxShadow:
                  theme.palette.mode === "dark"
                    ? "0 20px 60px rgba(0,0,0,0.7)"
                    : "0 20px 60px rgba(0,0,0,0.25)",
                border:
                  theme.palette.mode === "dark"
                    ? "1px solid rgba(255,255,255,0.12)"
                    : "1px solid rgba(0,0,0,0.08)",
              }}
            >
              {user.displayName?.[0] || user.name?.[0]}
            </Avatar>

            <Typography variant="h5" fontWeight={700}>
              {user.displayName || user.name || "Unnamed User"}
            </Typography>

            <Stack direction="row" spacing={1}>
              {isCurrentUserFriend && (
                <Chip
                  label="Friend"
                  size="small"
                  sx={{
                    fontWeight: 700,
                    background:
                      theme.palette.mode === "dark"
                        ? "rgba(16,185,129,0.25)"
                        : "rgba(16,185,129,0.18)",
                    color: "#10b981",
                  }}
                />
              )}
              <Chip
                label={visibility.charAt(0).toUpperCase() + visibility.slice(1)}
                size="small"
                sx={{
                  fontWeight: 700,
                  background:
                    isPublic
                      ? "rgba(59,130,246,0.18)"
                      : "rgba(245,158,11,0.18)",
                  color: isPublic ? "#3b82f6" : "#f59e0b",
                }}
              />
            </Stack>
          </Stack>

          {user.bio && isFullyViewable ? (
            <Box sx={{ mb: 3, px: 2 }}>
              <Typography
                variant="body1"
                align="center"
                sx={{
                  fontStyle: "italic",
                  ...glass(theme.palette.mode, {
                    p: 2.5,
                    borderRadius: 4,
                  }),
                }}
              >
                “{user.bio}”
              </Typography>
            </Box>
          ) : !isFullyViewable ? (
            <Box
              sx={{
                p: 2.5,
                mb: 3,
                textAlign: "center",
                borderRadius: designTokens.radii.card,
                background:
                  theme.palette.mode === "dark"
                    ? "linear-gradient(135deg, rgba(245,158,11,0.18), rgba(245,158,11,0.06))"
                    : "linear-gradient(135deg, rgba(245,158,11,0.12), rgba(245,158,11,0.04))",
                border: "1px solid rgba(245,158,11,0.25)",
              }}
            >
              <Typography fontWeight={700}>
                🔒 This profile is private
              </Typography>
              <Typography color="text.secondary" variant="body2">
                Send a friend request to view more details
              </Typography>
            </Box>
          ) : null}

          <Paper
            sx={{
              ...glassPanelSx(theme.palette.mode, {
                p: 2.5,
                mb: 2,
                borderRadius: designTokens.radii.card,
              }),
            }}
          >
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
              Profile Details
            </Typography>

            <Stack spacing={1.2}>
              {(isFullyViewable ? fullInfo : limitedInfo).map((detail, index) => (
                <Stack
                  key={index}
                  direction="row"
                  justifyContent="space-between"
                  sx={{
                    p: 1.2,
                    borderRadius: 2,
                    transition: "background 180ms ease",
                    "&:hover": {
                      background:
                        theme.palette.mode === "dark"
                          ? "rgba(255,255,255,0.08)"
                          : "rgba(0,0,0,0.04)",
                    },
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    {detail.label}
                  </Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {detail.value}
                  </Typography>
                </Stack>
              ))}
            </Stack>
          </Paper>

          <Stack direction="row" spacing={1.5} justifyContent="center" sx={{ mt: 3 }}>
            {isSelf ? (
              <Button variant="contained" disabled>
                This is You
              </Button>
            ) : isCurrentUserFriend ? (
              <Button
                variant="contained"
                startIcon={<MessageIcon />}
                onClick={() => navigate(`/chats/${user.uid}`)}
                fullWidth
                sx={{ borderRadius: 8 }}
              >
                Message
              </Button>
            ) : isRequestReceived ? (
              <>
                <Button
                  variant="contained"
                  color="success"
                  onClick={handleAcceptRequest}
                  fullWidth
                  sx={{ borderRadius: 8 }}
                >
                  Accept
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  onClick={handleRejectRequest}
                  fullWidth
                  sx={{ borderRadius: 8 }}
                >
                  Reject
                </Button>
              </>
            ) : hasPendingRequest ? (
              <Button
                variant="outlined"
                disabled
                fullWidth
                sx={{ borderRadius: 8 }}
              >
                Requested
              </Button>
            ) : (
              <Button
                variant="contained"
                startIcon={<PersonAddIcon />}
                onClick={() => handleAddFriend(user)}
                disabled={loadingRequestState}
                fullWidth
                sx={{ borderRadius: 8 }}
              >
                {visibility === "private" ? "Send Friend Request" : "Add Friend"}
              </Button>
            )}
          </Stack>
        </Box>
      </Box>
    );
  };

  const PlaceDrawerContent = ({ place }) => {
    const { mode } = useThemeToggle();
    const theme = getTheme(mode);

    const unsplashPhotos = useMemo(() => getUnsplashTravelImages(place, 3), [place]);
    const nearestPlaces = useMemo(() => getNearestSuggestedPlaces(place, 3), [place]);
    const featuredPlaces = useMemo(() => getFeaturedPlaces(4), []);

    if (!place) return null;

    return (
      <Box
        sx={{
          position: "relative",
          borderTopLeftRadius: 22,
          borderTopRightRadius: 22,
          backgroundColor: theme.palette.background.paper,
          p: 3,
        }}
      >
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
          <Box>
            <Typography variant="h5" fontWeight={800} color="text.primary">
              📍 {place.name}
            </Typography>
            <Typography variant="caption" color="text.secondary" fontWeight={600}>
              🏛️ {safeLocationString(place.location) || `${place.city || ""}, ${place.state || ""}`}
            </Typography>
          </Box>
          <IconButton size="small" onClick={closeDrawer}>
            <CloseIcon />
          </IconButton>
        </Stack>

        {/* 📸 Multi-Photo Unsplash Gallery Strip */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ display: "block", mb: 1 }}>
            📷 Destination Gallery ({unsplashPhotos.length} High-Res Photos):
          </Typography>
          <Stack direction="row" spacing={1.5} sx={{ overflowX: "auto", pb: 1 }}>
            {unsplashPhotos.map((imgUrl, i) => (
              <Box
                key={i}
                component="img"
                src={imgUrl}
                alt={`${place.name} ${i + 1}`}
                sx={{
                  width: 200,
                  height: 125,
                  borderRadius: 3,
                  objectFit: "cover",
                  flexShrink: 0,
                  boxShadow: "0 6px 16px rgba(0,0,0,0.18)",
                  border: `1px solid ${mode === "dark" ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.08)"}`,
                }}
              />
            ))}
          </Stack>
        </Box>

        <Stack direction="row" spacing={1} flexWrap="wrap" mb={2}>
          <Chip
            label={place.type || "Attraction"}
            size="small"
            variant="outlined"
            sx={{ fontWeight: 700, borderRadius: 2 }}
          />
          <Chip
            label={place.city || "Destination"}
            size="small"
            variant="outlined"
            sx={{ fontWeight: 700, borderRadius: 2 }}
          />
          {(place.season || place.bestTimeToVisit) && (
            <Chip
              icon={<AutoAwesomeIcon sx={{ fontSize: 14 }} />}
              label={`Best: ${place.season || place.bestTimeToVisit}`}
              size="small"
              sx={{ fontWeight: 700, borderRadius: 2, bgcolor: "rgba(168,85,247,0.2)", color: "#a855f7" }}
            />
          )}
        </Stack>

        <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 0.5 }}>
          Overview
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3, lineHeight: 1.6 }}>
          {place.description || "No detailed description available."}
        </Typography>

        {/* 🤖 Groq AI Travel Guide */}
        <Paper
          sx={{
            p: 2.5,
            mb: 3,
            borderRadius: 4,
            background: mode === "dark"
              ? "linear-gradient(135deg, rgba(99,102,241,0.15), rgba(168,85,247,0.15))"
              : "linear-gradient(135deg, rgba(99,102,241,0.08), rgba(168,85,247,0.08))",
            border: `1px solid ${mode === "dark" ? "rgba(168,85,247,0.3)" : "rgba(99,102,241,0.2)"}`,
          }}
        >
          <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1.5}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <AutoAwesomeIcon sx={{ color: "#a855f7" }} />
              <Typography variant="subtitle1" fontWeight={800} sx={{ color: mode === "dark" ? "#e9d5ff" : "#581c87" }}>
                Groq AI Travel Guide
              </Typography>
            </Stack>
            {!placeAiGuide && (
              <Button
                size="small"
                variant="contained"
                disabled={isPlaceAiLoading}
                onClick={() => generatePlaceAiGuide(place.name, place.city)}
                sx={{
                  borderRadius: 6,
                  textTransform: "none",
                  fontWeight: 700,
                  background: "linear-gradient(135deg, #6366f1, #a855f7)",
                  color: "#fff",
                }}
              >
                {isPlaceAiLoading ? <CircularProgress size={16} color="inherit" /> : "✨ Generate AI Guide"}
              </Button>
            )}
          </Stack>

          {placeAiGuide && (
            <Stack spacing={1.5} sx={{ mt: 1 }}>
              <Typography variant="body2" fontWeight={600}>
                🗓️ Best Time: {placeAiGuide.bestTime}
              </Typography>
              <Typography variant="body2" fontWeight={600}>
                ⏱️ Duration: {placeAiGuide.recommendedDays} Days | 💰 Est. Budget: ₹{placeAiGuide.estimatedBudget}
              </Typography>
              {placeAiGuide.topAttractions && (
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={700}>Must-Visit Highlights:</Typography>
                  <Stack direction="row" spacing={0.8} flexWrap="wrap" sx={{ mt: 0.5 }}>
                    {placeAiGuide.topAttractions.map((spot, i) => (
                      <Chip key={i} label={spot} size="small" sx={{ borderRadius: 2, fontSize: "0.75rem", fontWeight: 600 }} />
                    ))}
                  </Stack>
                </Box>
              )}
              {placeAiGuide.travelTip && (
                <Typography variant="caption" sx={{ fontStyle: "italic", opacity: 0.9, display: "block" }}>
                  💡 Tip: {placeAiGuide.travelTip}
                </Typography>
              )}
              <Button
                fullWidth
                variant="contained"
                startIcon={<AutoAwesomeIcon />}
                onClick={() => {
                  const today = new Date();
                  const endDate = new Date(today.getTime() + (placeAiGuide.recommendedDays || 3) * 24 * 60 * 60 * 1000);
                  closeDrawer();
                  openDrawerWithPrefill({
                    name: place.name || "",
                    from: userLocation || "",
                    to: `${place.city || ""}, ${place.state || ""}`.trim() || place.name,
                    location: place.location || `${place.city || ""}, ${place.state || ""}`.trim(),
                    startDate: today.toISOString().slice(0, 10),
                    endDate: endDate.toISOString().slice(0, 10),
                    budget: placeAiGuide.estimatedBudget ? placeAiGuide.estimatedBudget.toString() : "",
                    description: `AI recommended trip to ${place.name}. Highlights: ${(placeAiGuide.topAttractions || []).join(", ")}.`,
                  });
                }}
                sx={{
                  mt: 1,
                  borderRadius: 8,
                  fontWeight: 700,
                  background: "linear-gradient(135deg, #6366f1, #a855f7)",
                  color: "#fff",
                }}
              >
                Plan AI Trip to {place.name}
              </Button>
            </Stack>
          )}
        </Paper>

        {/* 📍 Nearest Suggested Attractions */}
        {nearestPlaces.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" fontWeight={800} sx={{ mb: 1.5 }}>
              📍 Nearest Suggested Attractions ({nearestPlaces.length})
            </Typography>
            <Stack direction="row" spacing={1.5} sx={{ overflowX: "auto", pb: 1 }}>
              {nearestPlaces.map((nearPlace, nIdx) => {
                const nearPhotos = getUnsplashTravelImages(nearPlace, 1);
                return (
                  <Card
                    key={nIdx}
                    sx={{
                      width: 170,
                      flexShrink: 0,
                      p: 1.2,
                      borderRadius: 3.5,
                      cursor: "pointer",
                      background: mode === "dark" ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)",
                      border: `1px solid ${mode === "dark" ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)"}`,
                      transition: "all 0.2s ease",
                      "&:hover": {
                        borderColor: "#a855f7",
                      },
                    }}
                    onClick={() => handleItemClick("places", nearPlace)}
                  >
                    <Box
                      component="img"
                      src={nearPhotos[0]}
                      sx={{ width: "100%", height: 90, borderRadius: 2.5, objectFit: "cover", mb: 1 }}
                    />
                    <Typography variant="subtitle2" fontWeight={800} noWrap>
                      {nearPlace.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" noWrap sx={{ display: "block" }}>
                      📍 {nearPlace.city || nearPlace.state || "Nearby"}
                    </Typography>
                  </Card>
                );
              })}
            </Stack>
          </Box>
        )}

        {/* ⭐ Featured Popular Destinations */}
        {featuredPlaces.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" fontWeight={800} sx={{ mb: 1.5 }}>
              ⭐ Featured Popular Destinations
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
              {featuredPlaces.map((featPlace, fIdx) => {
                const featPhotos = getUnsplashTravelImages(featPlace, 1);
                return (
                  <Chip
                    key={fIdx}
                    avatar={<Avatar src={featPhotos[0]} />}
                    label={`${featPlace.name} (${featPlace.city || featPlace.state})`}
                    onClick={() => handleItemClick("places", featPlace)}
                    sx={{
                      borderRadius: 3,
                      fontWeight: 700,
                      py: 0.5,
                      px: 0.5,
                      cursor: "pointer",
                      background: mode === "dark" ? "rgba(168,85,247,0.15)" : "rgba(99,102,241,0.08)",
                      border: `1px solid ${mode === "dark" ? "rgba(168,85,247,0.3)" : "rgba(99,102,241,0.2)"}`,
                    }}
                  />
                );
              })}
            </Stack>
          </Box>
        )}

        <Stack direction="row" spacing={1.5} justifyContent="space-between" sx={{ pt: 1 }}>
          <Button
            fullWidth
            variant="outlined"
            onClick={closeDrawer}
            sx={{ borderRadius: 8, borderColor: theme.palette.mode === "dark" ? "#555555" : "#cccccc", color: "text.primary", px: 3, fontWeight: 700 }}
          >
            Close
          </Button>

          <Button
            fullWidth
            variant="contained"
            onClick={() => {
              const today = new Date();
              const plus2 = new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000);

              openDrawerWithPrefill({
                name: place.name || "",
                from: userLocation || "",
                to: `${place.city || ""}, ${place.state || ""}`.trim(),
                location:
                  place.location ||
                  `${place.city || ""}, ${place.state || ""}`.trim(),
                startDate: today.toISOString().slice(0, 10),
                endDate: plus2.toISOString().slice(0, 10),
              });
            }}
            sx={{
              borderRadius: 8,
              px: 3,
              fontWeight: 700,
              color: theme.palette.mode === "dark" ? "#000000" : "#ffffff",
              backgroundColor: theme.palette.mode === "dark" ? "#ffffff" : "#000000",
              '&:hover': {
                backgroundColor: theme.palette.mode === "dark" ? "#f1f1f1" : "#010101",
              },
            }}
          >
            Plan Trip Here
          </Button>
        </Stack>
      </Box>
    );
  };

  const AiTripDrawerContent = ({ trip }) => {
    const unsplashPhotos = useMemo(() => getUnsplashTravelImages(trip, 3), [trip]);
    const nearestPlaces = useMemo(() => getNearestSuggestedPlaces(trip, 3), [trip]);
    const featuredPlaces = useMemo(() => getFeaturedPlaces(4), []);

    if (!trip) return null;

    const days = parseInt(trip.durationDays || trip.days || 3, 10);
    const today = new Date();
    const endDate = new Date(today.getTime() + days * 24 * 60 * 60 * 1000);

    return (
      <Box sx={{ p: 3 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Avatar sx={{ bgcolor: "rgba(168,85,247,0.2)", color: "#a855f7", width: 44, height: 44 }}>
              <SmartToyIcon sx={{ fontSize: 24 }} />
            </Avatar>
            <Box>
              <Typography variant="h6" fontWeight={800} color="text.primary">
                🧳 {trip.name || trip.title || trip.place || "AI Suggested Trip"}
              </Typography>
              <Typography variant="caption" color="text.secondary" fontWeight={600}>
                Groq AI Custom Travel Itinerary
              </Typography>
            </Box>
          </Stack>
          <IconButton size="small" onClick={closeDrawer}>
            <CloseIcon />
          </IconButton>
        </Stack>

        {/* 📸 Multi-Photo Unsplash Gallery Strip */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ display: "block", mb: 1 }}>
            📷 Destination Gallery ({unsplashPhotos.length} High-Res Photos):
          </Typography>
          <Stack direction="row" spacing={1.5} sx={{ overflowX: "auto", pb: 1 }}>
            {unsplashPhotos.map((imgUrl, i) => (
              <Box
                key={i}
                component="img"
                src={imgUrl}
                alt={`Trip spot ${i + 1}`}
                sx={{
                  width: 200,
                  height: 125,
                  borderRadius: 3,
                  objectFit: "cover",
                  flexShrink: 0,
                  boxShadow: "0 6px 16px rgba(0,0,0,0.18)",
                  border: `1px solid ${mode === "dark" ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.08)"}`,
                }}
              />
            ))}
          </Stack>
        </Box>

        <Paper
          elevation={0}
          sx={{
            p: 2.5,
            mb: 3,
            borderRadius: 4,
            background: mode === "dark"
              ? "linear-gradient(135deg, rgba(30, 27, 75, 0.45), rgba(88, 28, 135, 0.45))"
              : "linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(243, 232, 255, 0.95))",
            border: `1.5px solid ${mode === "dark" ? "rgba(168,85,247,0.35)" : "rgba(99,102,241,0.25)"}`,
            backdropFilter: "blur(12px)",
          }}
        >
          <Stack direction="row" spacing={1.5} flexWrap="wrap" gap={1} mb={2}>
            <Chip
              icon={<LocationOnIcon sx={{ fontSize: 16 }} />}
              label={`Route: ${trip.from || userLocation || "Start"} → ${trip.to || trip.location || trip.place || "Destination"}`}
              size="small"
              sx={{ fontWeight: 700, borderRadius: 2 }}
            />
            <Chip
              label={`⏱️ ${days} Days Trip`}
              size="small"
              color="primary"
              variant="outlined"
              sx={{ fontWeight: 700, borderRadius: 2 }}
            />
            {trip.budget && (
              <Chip
                label={`💰 Est. ₹${trip.budget}`}
                size="small"
                color="success"
                sx={{ fontWeight: 800, borderRadius: 2 }}
              />
            )}
          </Stack>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 2, lineHeight: 1.6 }}>
            {trip.description || trip.tagline || "Comprehensive AI generated travel recommendation customized for your location and season."}
          </Typography>

          {trip.highlights && trip.highlights.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ display: "block", mb: 1 }}>
                ✨ Featured Highlights & Key Attractions:
              </Typography>
              <Stack direction="row" spacing={0.8} flexWrap="wrap" gap={0.8}>
                {trip.highlights.map((h, idx) => (
                  <Chip
                    key={idx}
                    label={`📍 ${h}`}
                    size="small"
                    sx={{
                      borderRadius: 2,
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      bgcolor: mode === "dark" ? "rgba(168,85,247,0.2)" : "rgba(99,102,241,0.12)",
                      color: mode === "dark" ? "#e9d5ff" : "#4338ca",
                    }}
                  />
                ))}
              </Stack>
            </Box>
          )}

          {(trip.bestSeason || trip.season) && (
            <Typography variant="caption" sx={{ fontStyle: "italic", opacity: 0.9, display: "block", color: "text.secondary" }}>
              💡 Best Season: {trip.bestSeason || trip.season}
            </Typography>
          )}
        </Paper>

        {/* 📍 Nearest Suggested Attractions */}
        {nearestPlaces.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" fontWeight={800} sx={{ mb: 1.5 }}>
              📍 Nearest Suggested Attractions ({nearestPlaces.length})
            </Typography>
            <Stack direction="row" spacing={1.5} sx={{ overflowX: "auto", pb: 1 }}>
              {nearestPlaces.map((nearPlace, nIdx) => {
                const nearPhotos = getUnsplashTravelImages(nearPlace, 1);
                return (
                  <Card
                    key={nIdx}
                    sx={{
                      width: 170,
                      flexShrink: 0,
                      p: 1.2,
                      borderRadius: 3.5,
                      cursor: "pointer",
                      background: mode === "dark" ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)",
                      border: `1px solid ${mode === "dark" ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)"}`,
                      transition: "all 0.2s ease",
                      "&:hover": {
                        borderColor: "#a855f7",
                      },
                    }}
                    onClick={() => handleItemClick("places", nearPlace)}
                  >
                    <Box
                      component="img"
                      src={nearPhotos[0]}
                      sx={{ width: "100%", height: 90, borderRadius: 2.5, objectFit: "cover", mb: 1 }}
                    />
                    <Typography variant="subtitle2" fontWeight={800} noWrap>
                      {nearPlace.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" noWrap sx={{ display: "block" }}>
                      📍 {nearPlace.city || nearPlace.state || "Nearby"}
                    </Typography>
                  </Card>
                );
              })}
            </Stack>
          </Box>
        )}

        {/* ⭐ Featured Popular Destinations */}
        {featuredPlaces.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" fontWeight={800} sx={{ mb: 1.5 }}>
              ⭐ Featured Popular Destinations
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
              {featuredPlaces.map((featPlace, fIdx) => {
                const featPhotos = getUnsplashTravelImages(featPlace, 1);
                return (
                  <Chip
                    key={fIdx}
                    avatar={<Avatar src={featPhotos[0]} />}
                    label={`${featPlace.name} (${featPlace.city || featPlace.state})`}
                    onClick={() => handleItemClick("places", featPlace)}
                    sx={{
                      borderRadius: 3,
                      fontWeight: 700,
                      py: 0.5,
                      px: 0.5,
                      cursor: "pointer",
                      background: mode === "dark" ? "rgba(168,85,247,0.15)" : "rgba(99,102,241,0.08)",
                      border: `1px solid ${mode === "dark" ? "rgba(168,85,247,0.3)" : "rgba(99,102,241,0.2)"}`,
                    }}
                  />
                );
              })}
            </Stack>
          </Box>
        )}

        <Stack direction="row" spacing={1.5} justifyContent="space-between">
          <Button
            fullWidth
            variant="outlined"
            onClick={closeDrawer}
            sx={{ borderRadius: 8, borderColor: mode === "dark" ? "#555" : "#ccc", color: "text.primary", fontWeight: 700, px: 3 }}
          >
            Close
          </Button>

          <Button
            fullWidth
            variant="contained"
            startIcon={<FlightTakeoffIcon />}
            onClick={() => {
              closeDrawer();
              openDrawerWithPrefill({
                name: trip.name || trip.title || `Trip to ${trip.to || trip.location || trip.place || "Destination"}`,
                from: trip.from || userLocation || "",
                to: trip.to || trip.location || trip.place || "",
                location: trip.to || trip.location || trip.place || "",
                startDate: today.toISOString().slice(0, 10),
                endDate: endDate.toISOString().slice(0, 10),
                budget: trip.budget ? trip.budget.toString() : "",
                description: trip.description || `AI trip itinerary to ${trip.to || trip.location || trip.place}`,
              });
            }}
            sx={{
              borderRadius: 8,
              fontWeight: 700,
              px: 3,
              background: "linear-gradient(135deg, #6366f1, #a855f7)",
              color: "#fff",
            }}
          >
            Plan AI Trip Now
          </Button>
        </Stack>
      </Box>
    );
  };

  return (
    <Box sx={{ p: 3, maxWidth: 900, mx: "auto", mt: 4.5 }}>
      {/* 🔍 Always Visible Search Header Bar with Live Case-Sensitive Autocomplete */}
      <Box sx={{ position: "relative", mb: 3.5, zIndex: 1100 }}>
        <Paper
          elevation={0}
          sx={{
            py: 1.2,
            px: 2.5,
            borderRadius: 8,
            backdropFilter: "blur(20px)",
            background: mode === "dark"
              ? "linear-gradient(135deg, rgba(30, 27, 75, 0.75), rgba(88, 28, 135, 0.75))"
              : "linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(243, 232, 255, 0.95))",
            boxShadow: mode === "dark" ? "0 10px 30px rgba(0,0,0,0.5)" : "0 10px 30px rgba(99,102,241,0.12)",
            border: `1.5px solid ${mode === "dark" ? "rgba(168,85,247,0.35)" : "rgba(99,102,241,0.25)"}`,
            transition: "all 0.25s ease",
          }}
        >
          <Stack direction="row" spacing={1} alignItems="center">
            <IconButton
              size="small"
              onClick={handleHeaderBackClick}
              sx={{
                color: "#a855f7",
                p: 0.8,
                transition: "transform 0.2s",
                "&:hover": { transform: "scale(1.1)", bgcolor: mode === "dark" ? "rgba(168,85,247,0.2)" : "rgba(99,102,241,0.1)" }
              }}
            >
              <ArrowBackIcon sx={{ fontSize: 22 }} />
            </IconButton>

            <TextField
              fullWidth
              autoFocus
              placeholder="Search places, trips, users, notes, reminders, or ask Groq AI..."
              variant="standard"
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setIsCommitted(false);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSearchCommit(q);
                  setShowSuggestions(false);
                }
              }}
              InputProps={{ disableUnderline: true }}
              sx={{
                fontSize: "1.05rem",
                fontWeight: 600,
                "& input": { color: mode === "dark" ? "#ffffff" : "#1e293b" },
              }}
            />

            {q && (
              <IconButton
                size="small"
                onClick={() => {
                  setQ("");
                  setCommittedQuery("");
                  setIsCommitted(false);
                  setAiResults([]);
                  setAiSummary(null);
                  setShowSuggestions(false);
                }}
                sx={{ color: "text.secondary" }}
              >
                <ClearIcon sx={{ fontSize: 20 }} />
              </IconButton>
            )}

            <IconButton
              size="small"
              onClick={() => handleSearchCommit(q)}
              sx={{
                color: "#a855f7",
                bgcolor: mode === "dark" ? "rgba(168,85,247,0.2)" : "rgba(99,102,241,0.1)",
                p: 0.8,
                "&:hover": { bgcolor: mode === "dark" ? "rgba(168,85,247,0.3)" : "rgba(99,102,241,0.2)" }
              }}
            >
              <SearchIcon sx={{ fontSize: 20 }} />
            </IconButton>
          </Stack>
        </Paper>

        {/* Live Case-Sensitive & Category-Aware Autocomplete Popover */}
        <AnimatePresence>
          {showSuggestions && liveSuggestions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <Paper
                elevation={8}
                sx={{
                  position: "absolute",
                  top: "100%",
                  left: 0,
                  right: 0,
                  mt: 1,
                  zIndex: 1200,
                  borderRadius: 4,
                  maxHeight: 420,
                  overflowY: "auto",
                  background: mode === "dark" ? "#18181b" : "#ffffff",
                  border: `1.5px solid ${mode === "dark" ? "rgba(168,85,247,0.35)" : "rgba(99,102,241,0.25)"}`,
                  boxShadow: "0 16px 40px rgba(0,0,0,0.25)",
                }}
              >
                <List sx={{ p: 1 }}>
                  {liveSuggestions.map((sugg) => (
                    <ListItem
                      key={sugg.id}
                      button
                      onClick={() => handleSelectAutocompleteSuggestion(sugg)}
                      sx={{
                        borderRadius: 3,
                        mb: 0.5,
                        transition: "background 0.2s",
                        "&:hover": {
                          background: mode === "dark" ? "rgba(168,85,247,0.2)" : "rgba(99,102,241,0.1)",
                        },
                      }}
                    >
                      <ListItemAvatar sx={{ minWidth: 44 }}>
                        <Avatar
                          src={sugg.image || ""}
                          sx={{
                            width: 34,
                            height: 34,
                            fontSize: "1rem",
                            bgcolor: sugg.type === "ai_search" ? "rgba(168,85,247,0.25)" : mode === "dark" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)",
                            color: sugg.type === "ai_search" ? "#d8b4fe" : "text.primary",
                          }}
                        >
                          {!sugg.image && sugg.icon}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Typography variant="body2" fontWeight={700} sx={{ color: sugg.type === "ai_search" ? "#a855f7" : "text.primary" }}>
                            {sugg.label}
                          </Typography>
                        }
                        secondary={sugg.sublabel}
                        secondaryTypographyProps={{ variant: "caption", color: "text.secondary", noWrap: true }}
                      />
                      <Chip
                        label={sugg.category}
                        size="small"
                        sx={{
                          height: 22,
                          fontSize: "0.7rem",
                          fontWeight: 700,
                          bgcolor: sugg.type === "ai_search" ? "rgba(168,85,247,0.25)" : mode === "dark" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
                          color: sugg.type === "ai_search" ? "#d8b4fe" : "text.secondary",
                        }}
                      />
                    </ListItem>
                  ))}
                </List>
              </Paper>
            </motion.div>
          )}
        </AnimatePresence>
      </Box>

      {/* 🌟 UNCOMMITTED STATE: AI CONTEXT & RECOMMENDATIONS & RECENT SEARCHES */}
      {!isCommitted && (
        <>
          {/* Active Location & Season Pills */}
          <Paper
            elevation={0}
            sx={{
              p: 2,
              mb: 3,
              borderRadius: 4,
              background: mode === "dark" ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)",
              border: `1px solid ${mode === "dark" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"}`,
            }}
          >
            <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1.5}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <AutoAwesomeIcon sx={{ color: "#a855f7", fontSize: 20 }} />
                <Typography variant="subtitle2" fontWeight={800}>
                  Smart AI Context
                </Typography>
              </Stack>

              <Stack direction="row" spacing={1} flexWrap="wrap">
                <Chip
                  icon={<LocationOnIcon sx={{ fontSize: 16 }} />}
                  label={`Location: ${userLocation}`}
                  size="small"
                  variant="outlined"
                  sx={{ borderRadius: 3, fontWeight: 600 }}
                />
                <Chip
                  icon={seasonMeta.icon}
                  label={`${seasonMeta.month} (${seasonMeta.season})`}
                  size="small"
                  variant="outlined"
                  sx={{ borderRadius: 3, fontWeight: 600 }}
                />
              </Stack>
            </Stack>

            {/* Quick AI Search Chips */}
            {quickQueryChips.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ display: "block", mb: 1 }}>
                  💡 Suggested AI Quick Searches:
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" gap={0.8}>
                  {quickQueryChips.map((queryText, idx) => (
                    <Chip
                      key={idx}
                      label={queryText}
                      onClick={() => handleExecuteSuggestion(queryText)}
                      sx={{
                        borderRadius: 3,
                        fontWeight: 600,
                        fontSize: "0.8rem",
                        cursor: "pointer",
                        background: mode === "dark" ? "rgba(168,85,247,0.15)" : "rgba(99,102,241,0.08)",
                        color: mode === "dark" ? "#d8b4fe" : "#4338ca",
                        border: `1px solid ${mode === "dark" ? "rgba(168,85,247,0.3)" : "rgba(99,102,241,0.2)"}`,
                        '&:hover': {
                          background: mode === "dark" ? "rgba(168,85,247,0.25)" : "rgba(99,102,241,0.15)",
                        },
                      }}
                    />
                  ))}
                </Stack>
              </Box>
            )}
          </Paper>

          {/* 🎯 AI RECOMMENDED PLACES TO VISIT */}
          <Box sx={{ mb: 4 }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1.5}>
              <Typography
                variant="overline"
                sx={{
                  fontWeight: 800,
                  color: "#555",
                  letterSpacing: 1,
                  display: "flex",
                  alignItems: "center",
                  flex: 1,
                  "&::after": {
                    content: '""',
                    flex: 1,
                    height: "1px",
                    ml: 1.5,
                    background: "linear-gradient(90deg, #bbb 0%, transparent 100%)",
                  },
                }}
              >
                ✨ Recommended Places To Visit ({aiSuggestions.length})
              </Typography>
              <IconButton size="small" onClick={generateContextAiSuggestions} disabled={isAiSuggestionsLoading}>
                <RefreshIcon sx={{ fontSize: 18, color: "#a855f7" }} />
              </IconButton>
            </Stack>

            {isAiSuggestionsLoading ? (
              <Stack direction="row" spacing={2} alignItems="center" py={2} px={1}>
                <CircularProgress size={20} color="secondary" />
                <Typography variant="body2" color="text.secondary">
                  Updating suggestions based on {seasonMeta.season} in {userLocation}...
                </Typography>
              </Stack>
            ) : (
              <List sx={{ p: 0 }}>
                {aiSuggestions.map((item, index) => {
                  return (
                    <motion.div
                      key={index}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                    >
                      <Paper
                        sx={{
                          mb: 1.2,
                          p: 1,
                          borderRadius: 3,
                          cursor: "pointer",
                          boxShadow: theme.shadows[0],
                          background: mode === "dark"
                            ? "linear-gradient(135deg, rgba(168,85,247,0.08), rgba(99,102,241,0.08))"
                            : "linear-gradient(135deg, rgba(238,242,255,0.7), rgba(243,232,255,0.7))",
                          backdropFilter: "blur(10px)",
                          border: `1px solid ${mode === "dark" ? "rgba(168,85,247,0.25)" : "rgba(99,102,241,0.2)"}`,
                          transition: "all 0.25s ease",
                          "&:hover": {
                            borderColor: "#a855f7",
                            background: mode === "dark" ? "rgba(168,85,247,0.15)" : "rgba(238,242,255,0.9)",
                          },
                        }}
                        onClick={() => handleExecuteSuggestion(item)}
                      >
                        <ListItem disableGutters sx={{ px: 1 }}>
                          <ListItemAvatar>
                            <Avatar
                              src={item.image || ""}
                              sx={{
                                bgcolor: mode === "dark" ? "rgba(168,85,247,0.2)" : "rgba(99,102,241,0.15)",
                                color: mode === "dark" ? "#e9d5ff" : "#4338ca",
                              }}
                            >
                              {!item.image && <AutoAwesomeIcon />}
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={
                              <Stack direction="row" alignItems="center" spacing={1}>
                                <Typography variant="subtitle1" fontWeight={700}>
                                  📍 {item.place}
                                </Typography>
                                <Chip
                                  label={item.category || "Recommended"}
                                  size="small"
                                  sx={{
                                    height: 18,
                                    fontSize: "0.65rem",
                                    fontWeight: 800,
                                    bgcolor: "rgba(168,85,247,0.2)",
                                    color: "#a855f7",
                                  }}
                                />
                              </Stack>
                            }
                            secondary={
                              <Typography variant="body2" color="text.secondary" noWrap>
                                {item.tagline}
                              </Typography>
                            }
                          />
                          <ArrowForwardIosIcon sx={{ fontSize: 16, opacity: 0.4, color: "#a855f7" }} />
                        </ListItem>
                      </Paper>
                    </motion.div>
                  );
                })}
              </List>
            )}
          </Box>

          {/* Recent Searches (Only visible when search input 'q' is completely empty) */}
          {!q && searchHistory.length > 0 && (
            <Box sx={{ mb: 5 }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1.5}>
                <Typography
                  variant="overline"
                  sx={{
                    fontWeight: 800,
                    color: "#555",
                    letterSpacing: 1,
                    display: "flex",
                    alignItems: "center",
                    flex: 1,
                    "&::after": {
                      content: '""',
                      flex: 1,
                      height: "1px",
                      ml: 1.5,
                      background: "linear-gradient(90deg, #bbb 0%, transparent 100%)",
                    },
                  }}
                >
                  Recent Searches ({searchHistory.length})
                </Typography>
                <Button
                  size="small"
                  onClick={handleClearHistory}
                  startIcon={<DeleteOutlineIcon sx={{ fontSize: 16 }} />}
                  sx={{ textTransform: "none", fontWeight: 700, color: "text.secondary", fontSize: "0.75rem" }}
                >
                  Clear All
                </Button>
              </Stack>
              <List sx={{ p: 0 }}>
                {searchHistory.map((item, i) => {
                  const meta = getHistoryMeta(item);
                  return (
                    <ListItem
                      key={i}
                      button
                      onClick={() => { handleSearchCommit(item); }}
                      sx={{
                        borderBottom: `1px solid ${theme.palette.divider}`,
                        borderRadius: 2,
                        "&:hover": {
                          background: mode === "dark" ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)",
                        },
                      }}
                    >
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: mode === "dark" ? "#ffffff0b" : "#0000000d", color: mode === "dark" ? "#d7d7d7ff" : "#303030ff" }}>
                          <SearchIcon />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={item}
                        secondary={meta.type.charAt(0).toUpperCase() + meta.type.slice(1)}
                        sx={{ mb: 0, color: "text.primary" }}
                      />
                      <IconButton
                        size="small"
                        onClick={(e) => handleDeleteHistoryItem(e, item)}
                        sx={{ opacity: 0.6, "&:hover": { opacity: 1, color: "error.main" } }}
                      >
                        <CloseIcon sx={{ fontSize: 18 }} />
                      </IconButton>
                    </ListItem>
                  );
                })}
              </List>
            </Box>
          )}
        </>
      )}

      {/* 🚀 COMMITTED STATE: AI SEARCH SUMMARY OVERVIEW & CATEGORY TABS */}
      {isCommitted && committedQuery && (
        <>
          {/* 🤖 AI Search Summary Overview Banner */}
          {(isAiSummaryLoading || aiSummary) && (
            <Paper
              elevation={0}
              sx={{
                p: 2.5,
                mb: 3,
                borderRadius: 4,
                background: mode === "dark"
                  ? "linear-gradient(135deg, rgba(88,28,135,0.35), rgba(30,27,75,0.35))"
                  : "linear-gradient(135deg, rgba(243,232,255,0.9), rgba(238,242,255,0.9))",
                border: `1.5px solid ${mode === "dark" ? "rgba(168,85,247,0.3)" : "rgba(99,102,241,0.25)"}`,
                backdropFilter: "blur(10px)",
              }}
            >
              <Stack direction="row" spacing={1.5} alignItems="flex-start">
                <AutoAwesomeIcon sx={{ color: "#a855f7", fontSize: 24, mt: 0.3 }} />
                <Box flex={1}>
                  <Stack direction="row" alignItems="center" justifyContent="space-between" mb={0.5}>
                    <Typography variant="subtitle2" fontWeight={800} sx={{ color: mode === "dark" ? "#e9d5ff" : "#4338ca" }}>
                      ✨ AI Search Overview for "{committedQuery}"
                    </Typography>
                    <Chip label="Groq AI" size="small" sx={{ height: 20, fontSize: "0.68rem", fontWeight: 700, bgcolor: "rgba(168,85,247,0.2)", color: "#a855f7" }} />
                  </Stack>

                  {isAiSummaryLoading ? (
                    <Stack direction="row" spacing={1.5} alignItems="center" py={1}>
                      <CircularProgress size={16} color="secondary" />
                      <Typography variant="body2" color="text.secondary" fontStyle="italic">
                        Generating AI summary across all matching categories...
                      </Typography>
                    </Stack>
                  ) : (
                    <Typography variant="body2" sx={{ lineHeight: 1.6, color: "text.primary" }}>
                      {aiSummary}
                    </Typography>
                  )}
                </Box>
              </Stack>
            </Paper>
          )}

          {/* Category Tabs with live counts & automatic max-result tab activation */}
          <Tabs
            value={tab}
            onChange={(_, val) => {
              const oldIdx = tabsConfig.findIndex((t) => t.id === tab);
              const newIdx = tabsConfig.findIndex((t) => t.id === val);
              setSwipeDirection(newIdx >= oldIdx ? 1 : -1);
              setTab(val);
            }}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              mb: 3,
              "& .MuiTab-root": {
                fontWeight: 700,
                borderRadius: 4,
                minHeight: 40,
                textTransform: "none",
                px: 2,
              },
            }}
          >
            {tabsConfig.map((t) => (
              <Tab key={t.id} value={t.id} label={t.label} />
            ))}
          </Tabs>

          {/* 👆 Seamless Touch Swipe Container across Tabs */}
          <motion.div
            key={tab}
            initial={{ opacity: 0, x: swipeDirection > 0 ? 40 : -40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: swipeDirection > 0 ? -40 : 40 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.15}
            onDragEnd={(_, { offset, velocity }) => {
              const swipeThreshold = 50;
              const currentIndex = tabsConfig.findIndex((t) => t.id === tab);

              if (offset.x < -swipeThreshold || velocity.x < -250) {
                if (currentIndex < tabsConfig.length - 1) {
                  setSwipeDirection(1);
                  setTab(tabsConfig[currentIndex + 1].id);
                }
              } else if (offset.x > swipeThreshold || velocity.x > 250) {
                if (currentIndex > 0) {
                  setSwipeDirection(-1);
                  setTab(tabsConfig[currentIndex - 1].id);
                }
              }
            }}
            style={{ touchAction: "pan-y", width: "100%" }}
          >
            {/* AI Assistant Tab View */}
            {tab === "ai" && (
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  mb: 4,
                  borderRadius: 4,
                  background: mode === "dark"
                    ? "linear-gradient(135deg, rgba(30, 27, 75, 0.5), rgba(88, 28, 135, 0.5))"
                    : "linear-gradient(135deg, rgba(238, 242, 255, 0.9), rgba(243, 232, 255, 0.9))",
                  border: `1px solid ${mode === "dark" ? "rgba(168,85,247,0.4)" : "rgba(99,102,241,0.3)"}`,
                  backdropFilter: "blur(12px)",
                }}
              >
                <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
                  <Stack direction="row" alignItems="center" spacing={1.5}>
                    <AutoAwesomeIcon sx={{ color: "#a855f7", fontSize: 28 }} />
                    <Box>
                      <Typography variant="h6" fontWeight={800}>
                        Groq AI Travel Assistant
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Smart AI trip suggestions for "{q || 'travel'}" (Context: {seasonMeta.season} in {userLocation})
                      </Typography>
                    </Box>
                  </Stack>
                  <Button
                    variant="contained"
                    disabled={isAiLoading || !q.trim()}
                    onClick={() => handleQueryAiSearch(q)}
                    startIcon={isAiLoading ? <CircularProgress size={16} color="inherit" /> : <AutoAwesomeIcon />}
                    sx={{
                      borderRadius: 8,
                      textTransform: "none",
                      fontWeight: 700,
                      px: 2.5,
                      background: "linear-gradient(135deg, #6366f1, #a855f7)",
                      color: "#fff",
                    }}
                  >
                    {isAiLoading ? "Generating..." : "✨ Refresh AI Trips"}
                  </Button>
                </Stack>

                {isAiLoading && (
                  <Box textAlign="center" py={5}>
                    <CircularProgress size={36} sx={{ color: "#a855f7", mb: 2 }} />
                    <Typography fontWeight={700} variant="body1" sx={{ color: mode === "dark" ? "#e9d5ff" : "#4338ca" }}>
                      ✨ Groq AI is generating custom trip recommendations for "{q}"...
                    </Typography>
                    <Typography color="text.secondary" variant="caption">
                      Tailored for {userLocation} during {seasonMeta.season}
                    </Typography>
                  </Box>
                )}

                {aiResults.length === 0 && !isAiLoading && (
                  <Box textAlign="center" py={4}>
                    <SmartToyIcon sx={{ fontSize: 48, color: "#a855f7", opacity: 0.8, mb: 1 }} />
                    <Typography fontWeight={700} variant="body1" sx={{ mb: 0.5 }}>
                      {q ? `No AI recommendations generated yet for "${q}".` : "Type any destination to auto-generate AI trips!"}
                    </Typography>
                    <Typography color="text.secondary" variant="body2" sx={{ maxWidth: 450, mx: "auto" }}>
                      Groq AI constructs custom trip itineraries tailored to {userLocation} during {seasonMeta.season}!
                    </Typography>
                  </Box>
                )}

                {aiResults.length > 0 && (
                  <Stack spacing={2} sx={{ mt: 2 }}>
                    {aiResults.map((rec, idx) => (
                      <Card
                        key={idx}
                        sx={{
                          p: 2.5,
                          borderRadius: 3,
                          cursor: "pointer",
                          background: mode === "dark" ? "rgba(15,15,15,0.6)" : "rgba(255,255,255,0.95)",
                          border: `1px solid ${mode === "dark" ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)"}`,
                          transition: "all 0.25s ease",
                          "&:hover": {
                            borderColor: "#a855f7",
                            boxShadow: mode === "dark" ? "0 6px 20px rgba(168,85,247,0.2)" : "0 6px 20px rgba(99,102,241,0.15)",
                          },
                        }}
                        onClick={() => handleItemClick("ai_trip", rec)}
                      >
                        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={1}>
                          <Box>
                            <Typography variant="h6" fontWeight={800}>
                              🧳 {rec.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" fontWeight={600}>
                              Route: {rec.from || userLocation} → {rec.to || "Destination"} | {rec.durationDays || 3} Days
                            </Typography>
                          </Box>
                          <Chip label={`Est. ₹${rec.budget || 0}`} color="success" size="small" sx={{ fontWeight: 800 }} />
                        </Stack>

                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                          {rec.description}
                        </Typography>

                        {rec.highlights && (
                          <Stack direction="row" spacing={0.8} flexWrap="wrap" sx={{ mb: 2 }}>
                            {rec.highlights.map((h, i) => (
                              <Chip key={i} label={`✨ ${h}`} size="small" variant="outlined" sx={{ borderRadius: 2, fontSize: "0.75rem", fontWeight: 600 }} />
                            ))}
                          </Stack>
                        )}

                        <Stack direction="row" spacing={1.5}>
                          <Button
                            fullWidth
                            variant="outlined"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleItemClick("ai_trip", rec);
                            }}
                            sx={{
                              borderRadius: 8,
                              fontWeight: 700,
                              textTransform: "none",
                              py: 0.8,
                              borderColor: mode === "dark" ? "rgba(168,85,247,0.4)" : "rgba(99,102,241,0.4)",
                              color: mode === "dark" ? "#e9d5ff" : "#4338ca",
                            }}
                          >
                            View Trip Details
                          </Button>
                          <Button
                            fullWidth
                            variant="contained"
                            startIcon={<FlightTakeoffIcon />}
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePlanAiRecommendation(rec);
                            }}
                            sx={{
                              borderRadius: 8,
                              fontWeight: 700,
                              textTransform: "none",
                              py: 0.8,
                              background: "linear-gradient(135deg, #6366f1, #a855f7)",
                              color: "#fff",
                            }}
                          >
                            Plan AI Trip
                          </Button>
                        </Stack>
                      </Card>
                    ))}
                  </Stack>
                )}
              </Paper>
            )}

            {/* Results (for non-AI tabs) */}
            {tab !== "ai" && (
              !q && (isInitialLoading || isFetchingAllUsers) ? (
                <Stack alignItems="center" sx={{ mt: 5 }}>
                  <CircularProgress />
                  <Typography color="text.secondary" sx={{ mt: 2 }}>
                    Loading user profiles and current data...
                  </Typography>
                </Stack>
              ) : (
                <>
                  {filteredGroups.every(g => g.items.length === 0) ? (
                    <Typography color="text.secondary" align="center" sx={{ mt: 5 }}>
                      {!q
                        ? "Type something to start searching ✨"
                        : "No users, notes, or trips match your search term."
                      }
                    </Typography>
                  ) : (
                    filteredGroups.map(
                      (group) =>
                        group.items.length > 0 && (
                          <Box key={group.key} sx={{ mb: 3 }}>
                            <Typography
                              variant="overline"
                              sx={{
                                mb: 1.5,
                                fontWeight: 700,
                                letterSpacing: 1,
                                textTransform: "uppercase",
                                color: "#555",
                                display: "flex",
                                alignItems: "center",
                                "&::after": {
                                  content: '""',
                                  flex: 1,
                                  height: "1px",
                                  ml: 1.5,
                                  background: "linear-gradient(90deg, #bbb 0%, transparent 100%)",
                                },
                              }}
                            >
                              {group.label} ({group.items.length})
                            </Typography>

                            {group.key === "places" ? (
                              <Stack spacing={2} sx={{ mb: 2 }}>
                                {group.items
                                  .slice(0, tab === "all" ? 5 : 50)
                                  .map((place, pIdx) => {
                                    const placePhotos = getUnsplashTravelImages(place, 3);
                                    return (
                                      <motion.div
                                        key={place.id || place.name || pIdx}
                                        whileHover={{ scale: 1.01 }}
                                        whileTap={{ scale: 0.99 }}
                                      >
                                        <Card
                                          elevation={0}
                                          sx={{
                                            p: 2,
                                            borderRadius: 4,
                                            cursor: "pointer",
                                            background: mode === "dark"
                                              ? "linear-gradient(135deg, rgba(30,27,75,0.45), rgba(88,28,135,0.45))"
                                              : "linear-gradient(135deg, rgba(255,255,255,0.95), rgba(243,232,255,0.95))",
                                            border: `1.5px solid ${mode === "dark" ? "rgba(168,85,247,0.35)" : "rgba(99,102,241,0.25)"}`,
                                            backdropFilter: "blur(12px)",
                                            boxShadow: mode === "dark" ? "0 8px 24px rgba(0,0,0,0.4)" : "0 8px 24px rgba(99,102,241,0.1)",
                                            transition: "all 0.25s ease",
                                            "&:hover": {
                                              borderColor: "#a855f7",
                                            },
                                          }}
                                          onClick={() => handleItemClick("places", place)}
                                        >
                                          <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems="center">
                                            {/* Multi-Photo Unsplash Thumbnail Strip */}
                                            <Stack direction="row" spacing={0.8} sx={{ width: { xs: "100%", sm: "auto" } }}>
                                              {placePhotos.map((photoUrl, pImgIdx) => (
                                                <Avatar
                                                  key={pImgIdx}
                                                  variant="rounded"
                                                  src={photoUrl}
                                                  sx={{
                                                    width: pImgIdx === 0 ? { xs: 90, sm: 110 } : { xs: 65, sm: 80 },
                                                    height: { xs: 90, sm: 110 },
                                                    borderRadius: 3,
                                                    bgcolor: mode === "dark" ? "rgba(168,85,247,0.2)" : "rgba(99,102,241,0.15)",
                                                  }}
                                                />
                                              ))}
                                            </Stack>

                                            <Box flex={1} sx={{ width: "100%" }}>
                                              <Stack direction="row" alignItems="center" justifyContent="space-between" mb={0.5} flexWrap="wrap" gap={1}>
                                                <Typography variant="h6" fontWeight={800} sx={{ color: "text.primary" }}>
                                                  📍 {place.name}
                                                </Typography>
                                                <Chip
                                                  label={place.type || place.category || "Attraction"}
                                                  size="small"
                                                  sx={{
                                                    height: 22,
                                                    fontSize: "0.7rem",
                                                    fontWeight: 800,
                                                    bgcolor: "rgba(168,85,247,0.2)",
                                                    color: "#a855f7",
                                                  }}
                                                />
                                              </Stack>

                                              <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ display: "block", mb: 1 }}>
                                                🏛️ {safeLocationString(place.location) || `${place.city || place.district || ""}, ${place.state || ""}`}
                                              </Typography>

                                              <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                                                {place.description || place.tagline || "Popular destination for travel & exploration."}
                                              </Typography>

                                              <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1}>
                                                {(place.season || place.bestTimeToVisit) ? (
                                                  <Chip
                                                    icon={<AutoAwesomeIcon sx={{ fontSize: 14 }} />}
                                                    label={`Best: ${place.season || place.bestTimeToVisit}`}
                                                    size="small"
                                                    variant="outlined"
                                                    sx={{ borderRadius: 2, fontSize: "0.72rem", fontWeight: 600 }}
                                                  />
                                                ) : (
                                                  <Box />
                                                )}
                                                <Button
                                                  size="small"
                                                  endIcon={<ArrowForwardIosIcon sx={{ fontSize: 12 }} />}
                                                  sx={{ textTransform: "none", fontWeight: 700, color: "#a855f7" }}
                                                >
                                                  View Place Details
                                                </Button>
                                              </Stack>
                                            </Box>
                                          </Stack>
                                        </Card>
                                      </motion.div>
                                    );
                                  })}
                              </Stack>
                            ) : (
                              <List>
                                {group.items
                                  .slice(0, tab === "all" ? 5 : 50)
                                  .map((item) => (
                                    <motion.div
                                      whileHover={{ scale: 1.02 }}
                                      whileTap={{ scale: 0.98 }}
                                      key={item.id || item.uid}
                                    >
                                      <Paper
                                        sx={{
                                          mb: 0,
                                          p: 1,
                                          borderRadius: 3,
                                          boxShadow: theme.shadows[0],
                                          background: alpha(theme.palette.background.paper, 0.15),
                                          backdropFilter: "blur(10px)",
                                          transition: "all 0.25s ease",
                                          "&:hover": { boxShadow: theme.shadows[0] },
                                        }}
                                        onClick={() => handleItemClick(group.key, item)}
                                      >
                                        <ListItem>
                                          <ListItemAvatar>
                                            <Avatar
                                              src={
                                                item.images?.[0] ||
                                                item.photoURL ||
                                                item.iconURL ||
                                                ""
                                              }
                                              sx={{
                                                bgcolor: alpha(theme.palette.primary.main, 0.15),
                                                boxShadow: "none",
                                              }}
                                            >
                                              {(item.displayName || item.name || item.title || "U")[0]}
                                            </Avatar>
                                          </ListItemAvatar>
                                          <ListItemText
                                            primary={
                                              <Typography variant="subtitle1" fontWeight={600}>
                                                {item.displayName || item.name || item.title || "Untitled"}
                                              </Typography>
                                            }
                                            secondary={
                                              <Typography
                                                variant="body2"
                                                color="text.secondary"
                                                noWrap
                                              >
                                                {item.username ? `@${item.username}` : item.description || item.content || safeLocationString(item.location) || ""}
                                              </Typography>
                                            }
                                          />
                                        </ListItem>
                                      </Paper>
                                    </motion.div>
                                  ))}
                              </List>
                            )}
                            {tab === "all" && group.items.length > 5 && (
                              <Box textAlign="center" sx={{ mt: 1, mb: 8 }}>
                                <Button
                                  size="small"
                                  onClick={() => setTab(group.key)}
                                  sx={{ textTransform: "none", borderRadius: 3 }}
                                >
                                  View all {group.label}
                                </Button>
                              </Box>
                            )}

                          </Box>
                        )
                    )
                  )}
                </>
              )
            )}
          </motion.div>
        </>
      )}

      {/* Drawer Instance */}
      <SwipeableDrawer
        anchor="bottom"
        open={drawerOpen}
        onOpen={() => setDrawerOpen(true)}
        onClose={closeDrawer}
        disableSwipeToOpen={true}
        PaperProps={{
          sx: {
            borderTopLeftRadius: 22,
            borderTopRightRadius: 22,
            maxWidth: 600,
            mx: "auto",
            maxHeight: "90vh",
            background: mode === "dark" ? "rgba(18, 18, 18, 0.96)" : "rgba(255, 255, 255, 0.96)",
            backdropFilter: "blur(38px)",
            boxShadow: theme.shadows[10],
            overflowY: "auto",
          },
        }}
      >
        {drawerContentType === "user" && selectedItem && (
          <UserDrawerContent user={selectedItem} />
        )}
        {drawerContentType === "place" && selectedItem && (
          <PlaceDrawerContent place={selectedItem} />
        )}
        {drawerContentType === "ai_trip" && selectedItem && (
          <AiTripDrawerContent trip={selectedItem} />
        )}
      </SwipeableDrawer>

      <CreateTripDrawer
        createDialogOpen={createDialogOpen}
        closeDrawer={closeTripDrawer}
        step={step}
        setStep={setStep}
        newTrip={newTrip}
        setNewTrip={setNewTrip}
        selectedMembers={selectedMembers}
        setSelectedMembers={setSelectedMembers}
        handleNext={handleNext}
        handleBack={handleBack}
        handleCreateTrip={handleCreateTrip}
        isFetchingLocation={isFetchingLocation}
        createdTripDetails={createdTripDetails}
        setCreatedTripDetails={setCreatedTripDetails}
        user={currentUser || auth.currentUser}
        db={db}
        mode={mode}
      />
    </Box>
  );
}