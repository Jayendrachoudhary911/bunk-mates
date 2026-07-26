import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  Button,
  TextField,
  SwipeableDrawer,
  IconButton,
  Stack,
  Chip,
  Avatar,
  Card,
  DialogActions,
  useTheme,
  ToggleButton,
  ToggleButtonGroup,
  CircularProgress,
  Paper,
  InputAdornment,
  Autocomplete,
  Grid,
} from "@mui/material";
import {
  CloseOutlined,
  CloudUpload,
  LocationOn,
  AutoAwesome,
  Map as MapIcon,
  Search as SearchIcon,
  ChevronLeft,
  ChevronRight,
  SwapVert,
  WbSunny,
  CheckCircle,
  ListAlt,
  Timeline as TimelineIcon,
  Calculate,
  Delete,
  Add,
  Notes,
} from "@mui/icons-material";
import { doc, getDoc, collection, addDoc } from "firebase/firestore";
import { auth, db, firestore } from "../../firebase";
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Leaflet default marker icons fix
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const originIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const destinationIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const MapBoundsController = ({ originCoords, destCoords }) => {
  const map = useMap();
  useEffect(() => {
    if (originCoords && destCoords) {
      const bounds = L.latLngBounds([originCoords, destCoords]);
      map.fitBounds(bounds, { padding: [50, 50] });
    } else if (originCoords) {
      map.setView(originCoords, 11, { animate: true });
    } else if (destCoords) {
      map.setView(destCoords, 11, { animate: true });
    }
  }, [originCoords, destCoords, map]);
  return null;
};

const LocationMarker = ({ activeField, onSelectLocation }) => {
  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      onSelectLocation(lat, lng, activeField);
    },
  });
  return null;
};

const AirbnbStyleCalendar = ({ startDate, endDate, onChange, isDarkMode }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const handleDateClick = (dateStr) => {
    if (!startDate || (startDate && endDate)) {
      onChange(dateStr, "");
    } else if (startDate && !endDate) {
      if (new Date(dateStr) < new Date(startDate)) {
        onChange(dateStr, "");
      } else {
        onChange(startDate, dateStr);
      }
    }
  };

  const renderMonth = (monthOffset) => {
    const targetDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + monthOffset, 1);
    const year = targetDate.getFullYear();
    const month = targetDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const monthName = targetDate.toLocaleString("default", { month: "long", year: "numeric" });

    const days = [];
    for (let i = 0; i < firstDay; i++) {
      days.push(<Box key={`empty-${i}`} sx={{ width: 38, height: 38 }} />);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateObj = new Date(year, month, day);
      const dateStr = dateObj.toISOString().split("T")[0];

      const isStart = startDate === dateStr;
      const isEnd = endDate === dateStr;
      const inRange =
        startDate &&
        endDate &&
        new Date(dateStr) > new Date(startDate) &&
        new Date(dateStr) < new Date(endDate);

      days.push(
        <Button
          key={dateStr}
          onClick={() => handleDateClick(dateStr)}
          sx={{
            width: 38,
            minWidth: 38,
            height: 38,
            p: 0,
            borderRadius: isStart ? "50% 0 0 50%" : isEnd ? "0 50% 50% 0" : inRange ? 0 : "50%",
            bgcolor: isStart || isEnd ? "#00E676" : inRange ? "rgba(0, 230, 118, 0.2)" : "transparent",
            color: isStart || isEnd ? "#000" : isDarkMode ? "#fff" : "#000",
            fontWeight: isStart || isEnd ? 800 : 500,
            "&:hover": {
              bgcolor: isStart || isEnd ? "#00E676" : "rgba(0, 230, 118, 0.3)",
            },
          }}
        >
          {day}
        </Button>
      );
    }

    return (
      <Box sx={{ width: "100%", maxWidth: 300, mx: "auto" }}>
        <Typography variant="subtitle2" fontWeight={700} textAlign="center" sx={{ mb: 1.5 }}>
          {monthName}
        </Typography>
        <Grid container spacing={0.5} columns={7} textAlign="center" sx={{ mb: 1 }}>
          {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
            <Grid item xs={1} key={d}>
              <Typography variant="caption" color="text.secondary" fontWeight={700}>
                {d}
              </Typography>
            </Grid>
          ))}
        </Grid>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: "2px" }}>{days}</Box>
      </Box>
    );
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2.5,
        borderRadius: 4,
        border: "1px solid",
        borderColor: "divider",
        bgcolor: isDarkMode ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.01)",
      }}
    >
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <IconButton size="small" onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}>
          <ChevronLeft />
        </IconButton>
        <Typography variant="caption" color="text.secondary" fontWeight={600}>
          {startDate ? `Start: ${startDate}` : "Select Start Date"} {endDate ? `→ End: ${endDate}` : ""}
        </Typography>
        <IconButton size="small" onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}>
          <ChevronRight />
        </IconButton>
      </Box>

      <Stack direction={{ xs: "column", md: "row" }} spacing={3} justifyContent="center">
        {renderMonth(0)}
        {renderMonth(1)}
      </Stack>
    </Paper>
  );
};

const CreateTripDrawer = ({
  mode,
  user,
  db: dbProp,
  createDialogOpen,
  step,
  setStep,
  newTrip = {},
  setNewTrip,
  selectedMembers,
  setSelectedMembers,
  randomNatureImage,
  closeDrawer,
  handleNext,
  handleBack,
  handleCreateTrip,
  createdTripDetails,
  setCreatedTripDetails,
}) => {
  const theme = useTheme();
  const isDarkMode = mode === "dark" || theme.palette.mode === "dark";
  const effectiveDb = dbProp || firestore || db;

  const [friendCards, setFriendCards] = useState([]);

  const [internalStep, setInternalStep] = useState(0);
  const activeStep = typeof step === "number" ? step : internalStep;
  const changeStep = typeof setStep === "function" ? setStep : setInternalStep;

  const [internalMembers, setInternalMembers] = useState([]);
  const activeMembers = Array.isArray(selectedMembers) ? selectedMembers : internalMembers;
  const updateSelectedMembers = typeof setSelectedMembers === "function"
    ? setSelectedMembers
    : setInternalMembers;

  const [originCoords, setOriginCoords] = useState(null);
  const [destCoords, setDestCoords] = useState(null);
  const [activeMapField, setActiveMapField] = useState("from");
  const [fromSearchQuery, setFromSearchQuery] = useState("");
  const [toSearchQuery, setToSearchQuery] = useState("");
  const [fromResults, setFromResults] = useState([]);
  const [toResults, setToResults] = useState([]);

  const [weatherData, setWeatherData] = useState(null);
  const [isWeatherLoading, setIsWeatherLoading] = useState(false);

  const [splitMode, setSplitMode] = useState("equal");
  const [totalBudget, setTotalBudget] = useState(newTrip?.budget || "");
  const [groqApiKey, setGroqApiKey] = useState("");

  const [isGeneratingItinerary, setIsGeneratingItinerary] = useState(false);
  const [isCreatingTrip, setIsCreatingTrip] = useState(false);
  const [isSavingSubcollections, setIsSavingSubcollections] = useState(false);
  const [localCreatedTripId, setLocalCreatedTripId] = useState(null);

  // Step 5 Interactive Preview States (with Timeline Notes/Descriptions)
  const [previewTimeline, setPreviewTimeline] = useState([]);
  const [previewChecklist, setPreviewChecklist] = useState([]);
  const [newChecklistText, setNewChecklistText] = useState("");
  const [isAiGeneratingStep5, setIsAiGeneratingStep5] = useState(false);

  const [userProfileData, setUserProfileData] = useState(null);

  useEffect(() => {
    if (newTrip?.budget) {
      setTotalBudget(newTrip.budget);
    }
  }, [newTrip?.budget]);

  useEffect(() => {
    const fetchGroqKey = async () => {
      const activeUser = user || auth.currentUser;
      if (!activeUser?.uid) return;
      try {
        const userDocRef = doc(effectiveDb, "users", activeUser.uid);
        const docSnap = await getDoc(userDocRef);
        if (docSnap.exists() && docSnap.data().groqApiKey) {
          setGroqApiKey(docSnap.data().groqApiKey);
        }
      } catch (err) {
        console.warn("Could not fetch Groq API key:", err);
      }
    };
    if (createDialogOpen) {
      fetchGroqKey();
    }
  }, [createDialogOpen, user, effectiveDb]);

  useEffect(() => {
    const fetchUserData = async () => {
      const activeUser = user || auth.currentUser;
      if (!activeUser?.uid) return;
      try {
        const snap = await getDoc(doc(effectiveDb, "users", activeUser.uid));
        if (snap.exists()) {
          setUserProfileData(snap.data());
        }
      } catch (e) {
        console.warn("Failed to fetch user profile data", e);
      }
    };
    fetchUserData();
  }, [user, effectiveDb]);

  const isDevBeta = userProfileData?.type === "Dev Beta";

  const handleSwapLocations = () => {
    const prevFrom = newTrip.from || "";
    const prevTo = newTrip.to || "";
    const prevOriginCoords = originCoords;
    const prevDestCoords = destCoords;

    setNewTrip((prev) => ({
      ...prev,
      from: prevTo,
      to: prevFrom,
    }));
    setFromSearchQuery(prevTo);
    setToSearchQuery(prevFrom);
    setOriginCoords(prevDestCoords);
    setDestCoords(prevOriginCoords);
  };

  useEffect(() => {
    if (!fromSearchQuery.trim() || fromSearchQuery.length < 3) {
      setFromResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(fromSearchQuery)}&limit=5`);
        const data = await res.json();
        setFromResults(data || []);
      } catch (err) {
        console.error("From search failed:", err);
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [fromSearchQuery]);

  useEffect(() => {
    if (!toSearchQuery.trim() || toSearchQuery.length < 3) {
      setToResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(toSearchQuery)}&limit=5`);
        const data = await res.json();
        setToResults(data || []);
      } catch (err) {
        console.error("To search failed:", err);
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [toSearchQuery]);

  const fetchDestinationWeather = async (coords) => {
    if (!coords) return;
    setIsWeatherLoading(true);
    try {
      const [lat, lon] = coords;
      const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&daily=temperature_2m_max,temperature_2m_min,weathercode&timezone=auto`);
      const data = await res.json();
      setWeatherData(data);
    } catch (err) {
      console.warn("Failed to fetch weather data:", err);
    } finally {
      setIsWeatherLoading(false);
    }
  };

  useEffect(() => {
    if (destCoords) {
      fetchDestinationWeather(destCoords);
    }
  }, [destCoords]);

  const generateAiTripDetails = useCallback(
    async (fromLoc, toLoc) => {
      if (!groqApiKey || !fromLoc || !toLoc) return;

      setIsGeneratingItinerary(true);
      try {
        const prompt = `You are an expert travel assistant. Plan a trip from "${fromLoc}" to "${toLoc}". Start Date: ${newTrip.startDate || "N/A"}, End Date: ${newTrip.endDate || "N/A"}. Provide:
1. Suggested Trip Name (e.g. "Jaipur to Pokhara Adventure")
2. Summary description (2-3 sentences)
3. 3 top spots/attractions
4. Recommended budget in INR
Return strictly raw JSON:
{
  "tripName": "...",
  "description": "...",
  "topSpots": ["...","..."],
  "recommendedBudget": 15000
}
Do not output markdown.`;

        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${groqApiKey}`,
          },
          body: JSON.stringify({
            model: "llama-3.3-70b-versatile",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.3,
          }),
        });

        const data = await response.json();
        const cleanJsonStr = (data?.choices?.[0]?.message?.content || "").replace(/```json/g, "").replace(/```/g, "").trim();
        const parsed = JSON.parse(cleanJsonStr);

        setNewTrip((prev) => ({
          ...prev,
          name: prev.name || parsed.tripName || `${fromLoc} to ${toLoc}`,
          description: parsed.description || `${fromLoc} → ${toLoc} trip.`,
          location: `${fromLoc} → ${toLoc}`,
          budget: parsed.recommendedBudget ? parsed.recommendedBudget.toString() : prev.budget,
        }));

        if (parsed.recommendedBudget) {
          setTotalBudget(parsed.recommendedBudget.toString());
        }
      } catch (err) {
        console.error("AI Trip details generation failed:", err);
      } finally {
        setIsGeneratingItinerary(false);
      }
    },
    [groqApiKey, newTrip.startDate, newTrip.endDate, setNewTrip]
  );

  useEffect(() => {
    if (activeStep === 2 && newTrip.from && newTrip.to && !newTrip.description) {
      generateAiTripDetails(newTrip.from, newTrip.to);
    }
  }, [activeStep, newTrip.from, newTrip.to, newTrip.description, generateAiTripDetails]);

  // Helper to generate date-accurate default timeline events with clear descriptions
  const buildDefaultTimeline = useCallback(() => {
    let start = new Date(newTrip.startDate || new Date());
    let end = new Date(newTrip.endDate || new Date());
    if (isNaN(start.getTime())) start = new Date();
    if (isNaN(end.getTime())) end = new Date(start.getTime() + 86400000 * 2);

    const timeDiff = Math.abs(end.getTime() - start.getTime());
    const daysCount = Math.max(1, Math.ceil(timeDiff / (1000 * 3600 * 24)));

    const events = [];
    for (let i = 0; i < daysCount; i++) {
      const eventDate = new Date(start);
      eventDate.setDate(start.getDate() + i);
      const dateIsoStr = eventDate.toISOString().split("T")[0];

      events.push({
        title: i === 0 ? "Day 1 - Arrival & Check-in" : i === daysCount - 1 ? `Day ${i + 1} - Final Exploration & Departure` : `Day ${i + 1} - Main Destination Exploration`,
        time: `${dateIsoStr}T10:00`,
        note: i === 0 ? `Travel from ${newTrip.from || "Origin"} to ${newTrip.to || "Destination"}, check into accommodations, and rest.` : i === daysCount - 1 ? `Souvenir shopping and comfortable return journey back to ${newTrip.from || "Home"}.` : `Visit key local attractions and hotspots in ${newTrip.to || "Destination"}.`,
      });
    }
    return events;
  }, [newTrip.from, newTrip.to, newTrip.startDate, newTrip.endDate]);

  // Step 5: Auto-populate preview timeline with notes & relevant checklist using Groq AI
  const fetchAndSetStep5Previews = useCallback(async () => {
    setIsAiGeneratingStep5(true);
    const defaultTimeline = buildDefaultTimeline();
    const defaultChecklist = [
      "Government IDs & Passports",
      "Booking Confirmations & Tickets",
      "Phone Chargers & Power Banks",
      "Personal First Aid & Medicines",
      `Weather Appropriate Clothing for ${newTrip.to || "Destination"}`,
      `Group Snacks & Water Bottles (${activeMembers.length + 1} travelers)`,
    ];

    if (!groqApiKey || !newTrip.from || !newTrip.to) {
      setPreviewTimeline(defaultTimeline);
      setPreviewChecklist(defaultChecklist);
      setIsAiGeneratingStep5(false);
      return;
    }

    try {
      const numMembers = activeMembers.length + 1;
      const prompt = `Generate a structured travel timeline with clear titles, precise date-times, and informative descriptions (note), plus a relevant packing checklist for a trip from "${newTrip.from}" to "${newTrip.to}" starting on "${newTrip.startDate || "N/A"}" and ending on "${newTrip.endDate || "N/A"}" with ${numMembers} travelers.
Return strictly raw JSON matching:
{
  "timeline": [
    {
      "title": "Day 1 - Arrival & Sightseeing",
      "time": "${newTrip.startDate || "2026-04-01"}T10:00",
      "note": "Morning transit, check-in at stay, evening walk through local markets."
    }
  ],
  "checklist": [
    "Government IDs & Tickets",
    "Powerbanks & Chargers",
    "First Aid Kit",
    "Rainwear / Heavy Jackets"
  ]
}
Do not output markdown.`;

      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${groqApiKey}` },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.3,
        }),
      });

      const data = await response.json();
      const cleanJsonStr = (data?.choices?.[0]?.message?.content || "").replace(/```json/g, "").replace(/```/g, "").trim();
      const parsed = JSON.parse(cleanJsonStr);

      setPreviewTimeline(parsed.timeline?.length > 0 ? parsed.timeline : defaultTimeline);
      setPreviewChecklist(parsed.checklist?.length > 0 ? parsed.checklist : defaultChecklist);
    } catch (err) {
      console.warn("Falling back to default timeline & checklist:", err);
      setPreviewTimeline(defaultTimeline);
      setPreviewChecklist(defaultChecklist);
    } finally {
      setIsAiGeneratingStep5(false);
    }
  }, [groqApiKey, newTrip.from, newTrip.to, newTrip.startDate, newTrip.endDate, activeMembers.length, buildDefaultTimeline]);

  useEffect(() => {
    if (activeStep === 4) {
      fetchAndSetStep5Previews();
    }
  }, [activeStep, fetchAndSetStep5Previews]);

  // Handle Step 4 -> 5 Transition
  const onCreateTripAndProceedToStep5 = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setIsCreatingTrip(true);
    const activeUser = user || auth.currentUser;

    try {
      if (typeof handleCreateTrip === "function") {
        const result = await handleCreateTrip({ keepOpen: true });
        if (result?.id) {
          setLocalCreatedTripId(result.id);
          if (setCreatedTripDetails) setCreatedTripDetails(result);
        }
      } else {
        const docRef = await addDoc(collection(effectiveDb, "trips"), {
          ...newTrip,
          budget: totalBudget,
          members: activeMembers,
          createdBy: activeUser?.uid || "",
          createdAt: new Date().toISOString(),
          display: {
            from: newTrip.from,
            location: newTrip.to,
            endDate: newTrip.endDate,
            cardType: "regular",
            gridCols: 4,
            layout: "grid",
            listCols: 1,
          },
          admins: [activeUser?.uid || ""],
        });
        setLocalCreatedTripId(docRef.id);
        if (setCreatedTripDetails) {
          setCreatedTripDetails({ id: docRef.id, ...newTrip });
        }
      }
      changeStep(4);
    } catch (err) {
      console.error("Error creating trip:", err);
      alert("Failed to save trip. Please check your network connection.");
    } finally {
      setIsCreatingTrip(false);
    }
  };

  // Final Action: Save enriched Timeline (with notes) & Checklist directly into Firestore Subcollections and close drawer
  const handleFinishAndSaveSubcollections = async () => {
    const tripId = createdTripDetails?.id || localCreatedTripId;
    const activeUser = user || auth.currentUser;

    if (!tripId) {
      alert("Trip record is missing.");
      closeDrawer();
      return;
    }

    setIsSavingSubcollections(true);

    try {
      // Save Checklist items into subcollection `trips/{tripId}/checklist`
      const checklistRef = collection(effectiveDb, "trips", tripId, "checklist");
      for (const textItem of previewChecklist) {
        if (textItem && textItem.trim()) {
          await addDoc(checklistRef, { text: textItem.trim(), completed: false });
        }
      }

      // Save Timeline events into subcollection `trips/{tripId}/timeline`
      const timelineRef = collection(effectiveDb, "trips", tripId, "timeline");
      for (const item of previewTimeline) {
        await addDoc(timelineRef, {
          title: item.title || "Trip Activity",
          time: item.time || new Date().toISOString().slice(0, 16),
          note: item.note || "",
          completed: false,
          createdAt: new Date().toISOString(),
          createdBy: activeUser?.uid || "",
          revealAt: null,
          revealed: true,
          surprise: false,
        });
      }

      closeDrawer();
    } catch (err) {
      console.error("Error saving timeline or checklist:", err);
      alert("Failed to save timeline & checklist to trip.");
    } finally {
      setIsSavingSubcollections(false);
    }
  };

  const handleLocationPickOnMap = async (lat, lng, targetField) => {
    const coords = [lat, lng];
    if (targetField === "from") {
      setOriginCoords(coords);
    } else {
      setDestCoords(coords);
    }

    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
      const data = await res.json();
      const placeName = data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
      setNewTrip((prev) => ({ ...prev, [targetField]: placeName }));
      if (targetField === "from") setFromSearchQuery(placeName);
      else setToSearchQuery(placeName);
    } catch {
      setNewTrip((prev) => ({ ...prev, [targetField]: `${lat.toFixed(4)}, ${lng.toFixed(4)}` }));
    }
  };

  const onNextStep = () => {
    if (activeStep === 0) {
      if (!newTrip?.from?.trim() || !newTrip?.to?.trim()) {
        alert("Please specify both Origin ('From') and Destination ('To').");
        return;
      }
      changeStep(1);
    } else if (activeStep === 1) {
      if (!newTrip?.startDate || !newTrip?.endDate) {
        alert("Please select start and end travel dates.");
        return;
      }
      changeStep(2);
    } else if (activeStep === 2) {
      if (!newTrip?.name?.trim()) {
        alert("Please enter a trip name.");
        return;
      }
      changeStep(3);
    } else if (activeStep === 3) {
      onCreateTripAndProceedToStep5();
    } else if (typeof handleNext === "function") {
      handleNext();
    } else {
      changeStep((prev) => Math.min(prev + 1, 4));
    }
  };

  const onBackStep = () => {
    if (typeof handleBack === "function") {
      handleBack();
    }
    changeStep((prev) => Math.max(prev - 1, 0));
  };

  const formFieldSx = {
    "& .MuiOutlinedInput-root": { borderRadius: 3 },
  };

  useEffect(() => {
    const activeUser = user || auth.currentUser;
    if (!activeUser?.uid) {
      setFriendCards([]);
      return;
    }

    const fetchFriends = async () => {
      try {
        const userRef = doc(effectiveDb, "users", activeUser.uid);
        const snap = await getDoc(userRef);
        if (snap.exists()) {
          const friends = snap.data().friends || [];
          const friendsData = await Promise.all(
            friends.map((uid) => getDoc(doc(effectiveDb, "users", uid)))
          );
          setFriendCards(
            friendsData
              .filter((f) => f.exists())
              .map((f) => ({
                uid: f.id,
                ...f.data(),
                contribution: 0,
              }))
          );
        }
      } catch (e) {
        console.warn("Failed to fetch friends", e);
        setFriendCards([]);
      }
    };

    fetchFriends();
  }, [user, effectiveDb]);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewTrip((prev) => ({ ...prev, iconDataUri: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddMember = (member) => {
    if (activeMembers.some((m) => m.uid === member.uid)) return;
    updateSelectedMembers((prev) => [...prev, { ...member, contribution: 0 }]);
  };

  const handleRemoveMember = (uid) => {
    updateSelectedMembers((prev) => prev.filter((m) => m.uid !== uid));
  };

  const handleContributionChange = (index, val) => {
    const updated = [...activeMembers];
    updated[index].contribution = parseFloat(val) || 0;
    updateSelectedMembers(updated);
  };

  useEffect(() => {
    if (!activeMembers.length) return;
    const budgetNum = parseFloat(totalBudget) || 0;

    if (splitMode === "equal") {
      const share = (budgetNum / activeMembers.length).toFixed(2);
      updateSelectedMembers((prev) =>
        prev.map((m) => ({ ...m, contribution: parseFloat(share) }))
      );
    } else if (splitMode === "auto") {
      const share = (budgetNum / activeMembers.length).toFixed(2);
      updateSelectedMembers((prev) =>
        prev.map((m) => ({ ...m, contribution: parseFloat(share) }))
      );
    }
  }, [splitMode, totalBudget, activeMembers.length]);

  const stepsList = ["Route & Map", "Dates", "Identity & Weather", "Budget & Members", "Timeline & Checklist"];
  const mapTileUrl = isDarkMode
    ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
    : "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";

  return (
    <SwipeableDrawer
      anchor="bottom"
      open={createDialogOpen}
      onClose={closeDrawer}
      onOpen={() => {}}
      PaperProps={{
        sx: {
          height: "100vh",
          maxHeight: "100vh",
          overflow: "hidden",
          backdropFilter: "blur(22px) saturate(1.6)",
          background: isDarkMode
            ? "linear-gradient(180deg, rgba(10,10,10,0.88), rgba(0,0,0,0.95))"
            : "linear-gradient(180deg, rgba(255,255,255,0.88), rgba(245,247,250,0.96))",
          color: isDarkMode ? "#fff" : "#111",
        },
      }}
    >
      <Box sx={{ px: { xs: 2.5, sm: 4 }, pb: 4, pt: 3, height: "100%", overflowY: "auto" }}>
        {/* Header */}
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 3, pb: 2, borderBottom: isDarkMode ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(0,0,0,0.06)" }}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 900 }}>Create a Trip</Typography>
            <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 500 }}>
              Step {activeStep + 1} of 5 — {stepsList[activeStep]}
            </Typography>
          </Box>
          <IconButton onClick={closeDrawer}>
            <CloseOutlined fontSize="small" />
          </IconButton>
        </Box>

        {/* Stepper Progress */}
        <Stack direction="row" spacing={1} sx={{ mb: 4 }} alignItems="center">
          {stepsList.map((label, idx) => (
            <React.Fragment key={idx}>
              <Chip
                label={`${idx + 1}. ${label}`}
                size="small"
                onClick={() => changeStep(idx)}
                sx={{
                  fontWeight: 700,
                  bgcolor: activeStep === idx ? (isDarkMode ? "#fff" : "#000") : "transparent",
                  color: activeStep === idx ? (isDarkMode ? "#000" : "#fff") : "inherit",
                  border: "1px solid",
                  borderColor: activeStep === idx ? "transparent" : "divider",
                }}
              />
              {idx < stepsList.length - 1 && (
                <Box sx={{ flex: 1, height: 2, bgcolor: activeStep > idx ? "primary.main" : "divider" }} />
              )}
            </React.Fragment>
          ))}
        </Stack>

        {/* STEP 1: Map + Search Inputs + Swap Button */}
        {activeStep === 0 && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Box sx={{ flex: 1, display: "flex", flexDirection: "column", gap: 1.5 }}>
                <Autocomplete
                  freeSolo
                  options={fromResults}
                  getOptionLabel={(option) => (typeof option === "string" ? option : option.display_name)}
                  onInputChange={(e, val) => {
                    setFromSearchQuery(val);
                    setNewTrip((prev) => ({ ...prev, from: val }));
                  }}
                  onChange={(e, val) => {
                    if (val && typeof val === "object") {
                      const coords = [parseFloat(val.lat), parseFloat(val.lon)];
                      setOriginCoords(coords);
                      setNewTrip((prev) => ({ ...prev, from: val.display_name }));
                    }
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="From (Origin)"
                      onFocus={() => setActiveMapField("from")}
                      sx={formFieldSx}
                      InputProps={{
                        ...params.InputProps,
                        startAdornment: (
                          <InputAdornment position="start">
                            <LocationOn sx={{ color: "#00E676" }} />
                          </InputAdornment>
                        ),
                      }}
                    />
                  )}
                />

                <Autocomplete
                  freeSolo
                  options={toResults}
                  getOptionLabel={(option) => (typeof option === "string" ? option : option.display_name)}
                  onInputChange={(e, val) => {
                    setToSearchQuery(val);
                    setNewTrip((prev) => ({ ...prev, to: val }));
                  }}
                  onChange={(e, val) => {
                    if (val && typeof val === "object") {
                      const coords = [parseFloat(val.lat), parseFloat(val.lon)];
                      setDestCoords(coords);
                      setNewTrip((prev) => ({ ...prev, to: val.display_name }));
                    }
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="To (Destination)"
                      onFocus={() => setActiveMapField("to")}
                      sx={formFieldSx}
                      InputProps={{
                        ...params.InputProps,
                        startAdornment: (
                          <InputAdornment position="start">
                            <MapIcon sx={{ color: "#FF1744" }} />
                          </InputAdornment>
                        ),
                      }}
                    />
                  )}
                />
              </Box>

              <IconButton
                onClick={handleSwapLocations}
                sx={{
                  bgcolor: isDarkMode ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.04)",
                  p: 1.5,
                  borderRadius: 3,
                  "&:hover": { bgcolor: "#00E676", color: "#000" },
                }}
              >
                <SwapVert />
              </IconButton>
            </Box>

            <Typography variant="caption" color="text.secondary">
              Currently clicking on map places: <b>{activeMapField.toUpperCase()}</b>
            </Typography>

            <Paper sx={{ height: 380, borderRadius: 3, overflow: "hidden", border: "1px solid divider" }}>
              <MapContainer
                center={originCoords || destCoords || [20.5937, 78.9629]}
                zoom={5}
                style={{ height: "100%", width: "100%" }}
              >
                <MapBoundsController originCoords={originCoords} destCoords={destCoords} />
                <TileLayer
                  url={mapTileUrl}
                  attribution='&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                />
                
                {originCoords && (
                  <Marker position={originCoords} icon={originIcon}>
                    <Popup><b>Origin:</b> {newTrip.from || "Start Location"}</Popup>
                  </Marker>
                )}

                {destCoords && (
                  <Marker position={destCoords} icon={destinationIcon}>
                    <Popup><b>Destination:</b> {newTrip.to || "Destination Location"}</Popup>
                  </Marker>
                )}

                <LocationMarker activeField={activeMapField} onSelectLocation={handleLocationPickOnMap} />
              </MapContainer>
            </Paper>

            <DialogActions sx={{ mt: 2, px: 0, gap: 1.5 }}>
              <Button fullWidth onClick={closeDrawer} variant="outlined">
                Cancel
              </Button>
              <Button
                fullWidth
                onClick={onNextStep}
                variant="contained"
                disabled={!newTrip.from || !newTrip.to}
                sx={{ bgcolor: isDarkMode ? "#fff" : "#000", color: isDarkMode ? "#000" : "#fff" }}
              >
                Next: Select Dates
              </Button>
            </DialogActions>
          </Box>
        )}

        {/* STEP 2: Dates Selection */}
        {activeStep === 1 && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              Select Travel Schedule (Interactive Calendar)
            </Typography>

            <AirbnbStyleCalendar
              startDate={newTrip.startDate || ""}
              endDate={newTrip.endDate || ""}
              isDarkMode={isDarkMode}
              onChange={(start, end) => {
                setNewTrip((prev) => ({
                  ...prev,
                  startDate: start,
                  endDate: end,
                }));
              }}
            />

            <DialogActions sx={{ mt: 2, px: 0, gap: 1.5 }}>
              <Button fullWidth onClick={onBackStep}>
                Back
              </Button>
              <Button
                fullWidth
                onClick={onNextStep}
                variant="contained"
                disabled={!newTrip.startDate || !newTrip.endDate}
                sx={{ bgcolor: isDarkMode ? "#fff" : "#000", color: isDarkMode ? "#000" : "#fff" }}
              >
                Next: Identity & Weather
              </Button>
            </DialogActions>
          </Box>
        )}

        {/* STEP 3: Identity, Image, Weather Widget & Editable AI Description */}
        {activeStep === 2 && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <Paper
              sx={{
                p: 2,
                borderRadius: 4,
                bgcolor: isDarkMode ? "rgba(0, 230, 118, 0.08)" : "rgba(0, 230, 118, 0.05)",
                border: "1px solid rgba(0, 230, 118, 0.3)",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
                <Typography variant="subtitle2" fontWeight={800} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <WbSunny sx={{ color: "#FFD600" }} /> Live Destination Weather & Travel Indicator
                </Typography>
                {isWeatherLoading && <CircularProgress size={16} />}
              </Box>

              {weatherData?.current_weather ? (
                <Stack direction="row" spacing={3} alignItems="center">
                  <Box>
                    <Typography variant="h4" fontWeight={900}>
                      {weatherData.current_weather.temperature}°C
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Current Temperature
                    </Typography>
                  </Box>
                  <Box>
                    <Chip
                      icon={<CheckCircle sx={{ color: "#00E676 !important" }} />}
                      label="Ideal Time to Visit"
                      color="success"
                      variant="outlined"
                      sx={{ fontWeight: 700 }}
                    />
                    <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 0.5 }}>
                      Weather conditions are favorable for outdoors.
                    </Typography>
                  </Box>
                </Stack>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Fetching destination weather analysis...
                </Typography>
              )}
            </Paper>

            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
              <Avatar src={newTrip.iconDataUri || randomNatureImage} sx={{ width: 120, height: 120, borderRadius: 4, boxShadow: 3 }} />
              <Button variant="outlined" component="label" startIcon={<CloudUpload />} size="small" sx={{ borderRadius: 3 }}>
                Upload Photo
                <input type="file" hidden accept="image/*" onChange={handleImageUpload} />
              </Button>
            </Box>

<TextField
  label={isDevBeta ? "Trip Name (Auto-Suggested by AI)" : "Trip Name"}
  fullWidth
  value={newTrip.name || ""}
  onChange={(e) => setNewTrip({ ...newTrip, name: e.target.value })}
  sx={formFieldSx}
  InputProps={{
    endAdornment: isDevBeta && (
      isGeneratingItinerary ? <CircularProgress size={18} /> : <AutoAwesome sx={{ color: "#00E676" }} />
    ),
  }}
/>

            <TextField
              label="Trip Description (Auto-Generated & Editable)"
              fullWidth
              multiline
              rows={3}
              value={newTrip.description || ""}
              onChange={(e) => setNewTrip({ ...newTrip, description: e.target.value })}
              sx={formFieldSx}
            />

            <DialogActions sx={{ mt: 2, px: 0, gap: 1.5 }}>
              <Button fullWidth onClick={onBackStep}>
                Back
              </Button>
              <Button
                fullWidth
                onClick={onNextStep}
                variant="contained"
                disabled={!newTrip.name}
                sx={{ bgcolor: isDarkMode ? "#fff" : "#000", color: isDarkMode ? "#000" : "#fff" }}
              >
                Next: Budget & Members
              </Button>
            </DialogActions>
          </Box>
        )}

        {/* STEP 4: Budget, Friends & Multi-Mode Splitting */}
        {activeStep === 3 && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
              Add Friends
            </Typography>
            <Stack direction="row" spacing={2} sx={{ overflowX: "auto", pb: 1 }}>
              {friendCards.map((friend) => (
                <Card key={friend.uid} sx={{ minWidth: 120, p: 1.5, textAlign: "center", borderRadius: 3 }}>
                  <Avatar src={friend.photoURL} sx={{ mx: "auto", mb: 1 }} />
                  <Typography variant="caption" noWrap fontWeight={700} display="block">
                    {friend.name || friend.username}
                  </Typography>
                  <Button size="small" onClick={() => handleAddMember(friend)}>
                    + Add
                  </Button>
                </Card>
              ))}
            </Stack>

            {activeMembers.length > 0 && (
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                {activeMembers.map((m) => (
                  <Chip
                    key={m.uid}
                    avatar={<Avatar src={m.photoURL} />}
                    label={m.name || m.username}
                    onDelete={() => handleRemoveMember(m.uid)}
                  />
                ))}
              </Box>
            )}

            <TextField
              label="Total Budget"
              type="number"
              fullWidth
              value={totalBudget}
              onChange={(e) => {
                setTotalBudget(e.target.value);
                setNewTrip({ ...newTrip, budget: e.target.value });
              }}
              sx={formFieldSx}
              InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }}
            />

            <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
              Split Method
            </Typography>
            <ToggleButtonGroup
              value={splitMode}
              exclusive
              onChange={(e, newMode) => newMode && setSplitMode(newMode)}
              fullWidth
              size="small"
            >
              <ToggleButton value="equal">Equal</ToggleButton>
              <ToggleButton value="manual">Manual</ToggleButton>
              <ToggleButton value="auto">
                <Calculate sx={{ mr: 0.5, fontSize: 16 }} /> Auto
              </ToggleButton>
            </ToggleButtonGroup>

            {activeMembers.length > 0 && (
              <Stack spacing={1.5}>
                {activeMembers.map((m, idx) => (
                  <Box
                    key={m.uid}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 2,
                      p: 1.5,
                      bgcolor: "action.hover",
                      borderRadius: 3,
                    }}
                  >
                    <Avatar src={m.photoURL} />
                    <Typography sx={{ flexGrow: 1 }} variant="body2" fontWeight={600}>
                      {m.name || m.username}
                    </Typography>
                    <TextField
                      label="Contribution"
                      type="number"
                      size="small"
                      disabled={splitMode === "equal"}
                      sx={{ width: 130 }}
                      value={m.contribution || ""}
                      onChange={(e) => handleContributionChange(idx, e.target.value)}
                      InputProps={{
                        startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                      }}
                    />
                  </Box>
                ))}
              </Stack>
            )}

            <DialogActions sx={{ mt: 2, px: 0, gap: 1.5 }}>
              <Button fullWidth onClick={onBackStep}>
                Back
              </Button>
              <Button
                fullWidth
                variant="contained"
                onClick={onCreateTripAndProceedToStep5}
                disabled={isCreatingTrip}
                startIcon={isCreatingTrip ? <CircularProgress size={18} color="inherit" /> : null}
                sx={{ bgcolor: isDarkMode ? "#fff" : "#000", color: isDarkMode ? "#000" : "#fff" }}
              >
                {isCreatingTrip ? "Creating Trip..." : "Create Trip"}
              </Button>
            </DialogActions>
          </Box>
        )}

        {/* STEP 5: Clarified Timeline & Relevant Checklist Previews */}
        {activeStep === 4 && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <Box sx={{ textAlign: "center", mt: 1 }}>
              <Avatar sx={{ bgcolor: "rgba(0, 230, 118, 0.15)", mx: "auto", width: 64, height: 64, mb: 1.5 }}>
                <AutoAwesome sx={{ color: "#00E676", fontSize: 36 }} />
              </Avatar>
              <Typography variant="h6" fontWeight="bold">
                🎉 Trip Created! Fine-tune Timeline & Checklist
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                Review, add notes, and edit activities for <b>{createdTripDetails?.name || newTrip.name}</b>.
              </Typography>
            </Box>

            {isAiGeneratingStep5 ? (
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", py: 4, gap: 2 }}>
                <CircularProgress size={24} sx={{ color: "#00E676" }} />
                <Typography variant="body2" fontWeight={600}>
                  Building clarified schedule and packing essentials...
                </Typography>
              </Box>
            ) : (
              <Stack spacing={3}>
                {/* 1. Day-by-Day Timeline Preview with Descriptions */}
                <Paper sx={{ p: 2.5, borderRadius: 4, border: "1px solid divider", bgcolor: "action.hover" }}>
                  <Typography variant="subtitle2" fontWeight={800} sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                    <TimelineIcon sx={{ color: "#00E676" }} /> Itinerary Timeline ({previewTimeline.length} Days)
                  </Typography>

                  <Stack spacing={2}>
                    {previewTimeline.map((item, idx) => (
                      <Paper key={idx} sx={{ p: 2, borderRadius: 3, display: "flex", flexDirection: "column", gap: 1.5, border: "1px solid divider" }}>
                        <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                          <Chip label={`Day ${idx + 1}`} size="small" sx={{ fontWeight: 800, bgcolor: "#00E676", color: "#000" }} />
                          <TextField
                            size="small"
                            label="Event Title"
                            fullWidth
                            value={item.title || ""}
                            onChange={(e) => {
                              const updated = [...previewTimeline];
                              updated[idx].title = e.target.value;
                              setPreviewTimeline(updated);
                            }}
                            sx={formFieldSx}
                          />
                        </Box>

                        <TextField
                          size="small"
                          type="datetime-local"
                          label="Scheduled Date & Time"
                          InputLabelProps={{ shrink: true }}
                          fullWidth
                          value={item.time || ""}
                          onChange={(e) => {
                            const updated = [...previewTimeline];
                            updated[idx].time = e.target.value;
                            setPreviewTimeline(updated);
                          }}
                          sx={formFieldSx}
                        />

                        <TextField
                          size="small"
                          label="Activity Description / Note"
                          multiline
                          rows={2}
                          fullWidth
                          placeholder="Add details (e.g. Visit spots, check-in details, transit modes)..."
                          value={item.note || ""}
                          onChange={(e) => {
                            const updated = [...previewTimeline];
                            updated[idx].note = e.target.value;
                            setPreviewTimeline(updated);
                          }}
                          sx={formFieldSx}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <Notes size="small" />
                              </InputAdornment>
                            ),
                          }}
                        />
                      </Paper>
                    ))}
                  </Stack>
                </Paper>

                {/* 2. Relevant Checklist Preview */}
                <Paper sx={{ p: 2.5, borderRadius: 4, border: "1px solid divider", bgcolor: "action.hover" }}>
                  <Typography variant="subtitle2" fontWeight={800} sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                    <ListAlt sx={{ color: "#00B0FF" }} /> Relevant Packing Checklist
                  </Typography>

                  <Stack spacing={1.5} sx={{ mb: 2 }}>
                    {previewChecklist.map((itemText, idx) => (
                      <Box key={idx} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <TextField
                          size="small"
                          fullWidth
                          value={itemText}
                          onChange={(e) => {
                            const updated = [...previewChecklist];
                            updated[idx] = e.target.value;
                            setPreviewChecklist(updated);
                          }}
                          sx={formFieldSx}
                        />
                        <IconButton
                          color="error"
                          onClick={() => {
                            setPreviewChecklist(previewChecklist.filter((_, i) => i !== idx));
                          }}
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </Box>
                    ))}
                  </Stack>

                  {/* Add Custom Item */}
                  <Box sx={{ display: "flex", gap: 1 }}>
                    <TextField
                      size="small"
                      fullWidth
                      placeholder="Add custom item (e.g. Camera Chargers, Medicines)..."
                      value={newChecklistText}
                      onChange={(e) => setNewChecklistText(e.target.value)}
                      sx={formFieldSx}
                    />
                    <Button
                      variant="outlined"
                      startIcon={<Add />}
                      onClick={() => {
                        if (newChecklistText.trim()) {
                          setPreviewChecklist([...previewChecklist, newChecklistText.trim()]);
                          setNewChecklistText("");
                        }
                      }}
                      sx={{ borderRadius: 3, textTransform: "none", fontWeight: 700, px: 2 }}
                    >
                      Add
                    </Button>
                  </Box>
                </Paper>
              </Stack>
            )}

            <DialogActions sx={{ flexDirection: "column", gap: 1.5, mt: 2, px: 0 }}>
              <Button
                fullWidth
                variant="contained"
                onClick={handleFinishAndSaveSubcollections}
                disabled={isSavingSubcollections || isAiGeneratingStep5}
                startIcon={isSavingSubcollections ? <CircularProgress size={18} color="inherit" /> : <CheckCircle />}
                sx={{
                  py: 1.4,
                  borderRadius: 3,
                  fontWeight: 700,
                  background: "linear-gradient(135deg, #00E676, #00B0FF)",
                  color: "#000",
                  textTransform: "none",
                  "&:hover": { opacity: 0.9 },
                }}
              >
                {isSavingSubcollections ? "Saving Timeline & Checklist..." : "Finish & Save to Trip"}
              </Button>

              <Button
                fullWidth
                variant="outlined"
                onClick={closeDrawer}
                disabled={isSavingSubcollections}
                sx={{ borderRadius: 3, textTransform: "none" }}
              >
                Skip for Now
              </Button>
            </DialogActions>
          </Box>
        )}
      </Box>
    </SwipeableDrawer>
  );
};

export default CreateTripDrawer;