import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Box,
  Typography,
  Button,
  TextField,
  IconButton,
  Stack,
  Chip,
  Avatar,
  Card,
  DialogActions,
  useTheme,
  ToggleButton,
  ToggleButtonGroup,
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
  ChevronLeft,
  ChevronRight,
  SwapVert,
  WbSunny,
  CheckCircle,
  ListAlt,
  Timeline as TimelineIcon,
  Delete,
  Add,
} from "../../icons";
import { doc, getDoc, collection, addDoc } from "firebase/firestore";
import { auth, db, firestore } from "../../firebase";

import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import {
  glassInputSx,
  glassIconBtnSx,
} from "../../theme/designSystem";
import { SkullGlyph, CreateTripSkullLoader } from "../loaders/SkullSkeletonLoader";
import { useThemeToggle } from "../../contexts/ThemeToggleContext";

// Fallback nature image definition
const randomNatureImage = "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=800&q=80";

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
            bgcolor: isStart || isEnd ? (isDarkMode ? "#fff" : "#000") : inRange ? (isDarkMode ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.08)") : "transparent",
            color: isStart || isEnd ? (isDarkMode ? "#000" : "#fff") : isDarkMode ? "#fff" : "#000",
            fontWeight: isStart || isEnd ? 800 : 500,
            "&:hover": {
              bgcolor: isStart || isEnd ? (isDarkMode ? "#eee" : "#222") : (isDarkMode ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.12)"),
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
        borderColor: isDarkMode ? "rgba(255,255,255,0.08)" : "divider",
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
  mode: modeProp,
  user: userProp,
  db: dbProp,
  createDialogOpen = true,
  step,
  setStep,
  newTrip: newTripProp = {},
  setNewTrip: setNewTripProp,
  selectedMembers,
  setSelectedMembers,
  closeDrawer,
  handleNext,
  handleBack,
  handleCreateTrip,
  isFetchingLocation,
  createdTripDetails,
  setCreatedTripDetails,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const { mode: contextMode } = useThemeToggle();
  const mode = modeProp || contextMode || theme.palette.mode || "dark";
  const isDarkMode = mode === "dark";
  const effectiveDb = dbProp || firestore || db;
  const user = userProp || auth.currentUser;

  const [internalTripState, setInternalTripState] = useState(() => ({
    name: "",
    from: "",
    to: "",
    location: "",
    startDate: "",
    endDate: "",
    time: "",
    duration: "",
    budget: "",
    description: "",
    iconDataUri: "",
    ...(location?.state?.prefill || {}),
    ...(newTripProp || {}),
  }));

  const newTrip = newTripProp && Object.keys(newTripProp).length > 0 ? newTripProp : internalTripState;
  const setNewTrip = typeof setNewTripProp === "function" ? setNewTripProp : setInternalTripState;

  useEffect(() => {
    if (location?.state?.prefill) {
      setNewTrip((prev) => ({
        ...prev,
        ...location.state.prefill,
      }));
    }
  }, [location?.state?.prefill, setNewTrip]);

  const [friendCards, setFriendCards] = useState([]);

  const [internalStep, setInternalStep] = useState(0);
  const activeStep = typeof step === "number" ? step : internalStep;
  const changeStep = typeof setStep === "function" ? setStep : setInternalStep;

  const [internalMembers, setInternalMembers] = useState([]);
  const activeMembers = Array.isArray(selectedMembers) ? selectedMembers : internalMembers;
  const updateSelectedMembers = typeof setSelectedMembers === "function"
    ? setSelectedMembers
    : setInternalMembers;

  const handleExit = useCallback(() => {
    if (typeof closeDrawer === "function") {
      closeDrawer();
    }
    navigate(-1);
  }, [closeDrawer, navigate]);

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

  // Step 5 Interactive Preview States
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
    if (!createDialogOpen) return;

    if (newTrip?.from) {
      setFromSearchQuery(newTrip.from);
      if (newTrip.currentLatLon) {
        setOriginCoords(newTrip.currentLatLon);
      } else if (!originCoords) {
        fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(newTrip.from)}&limit=1`)
          .then((res) => res.json())
          .then((data) => {
            if (data && data[0]) {
              setOriginCoords([parseFloat(data[0].lat), parseFloat(data[0].lon)]);
            }
          })
          .catch((err) => console.warn("Origin auto-geocode error:", err));
      }
    }

    if (newTrip?.to) {
      setToSearchQuery(newTrip.to);
      if (!destCoords) {
        fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(newTrip.to)}&limit=1`)
          .then((res) => res.json())
          .then((data) => {
            if (data && data[0]) {
              setDestCoords([parseFloat(data[0].lat), parseFloat(data[0].lon)]);
            }
          })
          .catch((err) => console.warn("Destination auto-geocode error:", err));
      }
    }
  }, [createDialogOpen, newTrip?.from, newTrip?.to, newTrip?.currentLatLon, originCoords, destCoords]);

  useEffect(() => {
    if (!fromSearchQuery.trim() || fromSearchQuery.length < 3) {
      setFromResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const apiKey = process.env.REACT_APP_MAP_API_KEY || "72a80d89-2fa4-422b-ad14-e0064315ff45";
        if (apiKey) {
          const stadiaRes = await fetch(
            `https://api.stadiamaps.com/geocoding/v1/search?api_key=${apiKey}&size=5&text=${encodeURIComponent(fromSearchQuery)}`
          );
          if (stadiaRes.ok) {
            const data = await stadiaRes.json();
            if (data?.features?.length > 0) {
              const formatted = data.features.map((f) => ({
                display_name: f.properties.label,
                lat: f.geometry.coordinates[1],
                lon: f.geometry.coordinates[0],
              }));
              setFromResults(formatted);
              return;
            }
          }
        }
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
        const apiKey = process.env.REACT_APP_MAP_API_KEY || "72a80d89-2fa4-422b-ad14-e0064315ff45";
        if (apiKey) {
          const stadiaRes = await fetch(
            `https://api.stadiamaps.com/geocoding/v1/search?api_key=${apiKey}&size=5&text=${encodeURIComponent(toSearchQuery)}`
          );
          if (stadiaRes.ok) {
            const data = await stadiaRes.json();
            if (data?.features?.length > 0) {
              const formatted = data.features.map((f) => ({
                display_name: f.properties.label,
                lat: f.geometry.coordinates[1],
                lon: f.geometry.coordinates[0],
              }));
              setToResults(formatted);
              return;
            }
          }
        }
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
            model: "openai/gpt-oss-120b",
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
          iconDataUri: prev.iconDataUri || randomNatureImage,
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
          model: "openai/gpt-oss-120b",
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
          iconDataUri: newTrip.iconDataUri || randomNatureImage,
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
      const checklistRef = collection(effectiveDb, "trips", tripId, "checklist");
      for (const textItem of previewChecklist) {
        if (textItem && textItem.trim()) {
          await addDoc(checklistRef, { text: textItem.trim(), completed: false });
        }
      }

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

      if (typeof closeDrawer === "function") {
        closeDrawer();
      }
      navigate(tripId ? `/trips/${tripId}` : "/trips");
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
  }, [splitMode, totalBudget, activeMembers.length, updateSelectedMembers]);

  const stepsList = ["Route & Map", "Dates", "Identity & Weather", "Budget & Members", "Timeline & Checklist"];
  const mapApiKey = process.env.REACT_APP_MAP_API_KEY || "72a80d89-2fa4-422b-ad14-e0064315ff45";
  const mapTileUrl = mapApiKey
    ? (isDarkMode
        ? `https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png?api_key=${mapApiKey}`
        : `https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png?api_key=${mapApiKey}`)
    : (isDarkMode
        ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png");

  return (
    <Box
      sx={{
        minHeight: "100vh",
        width: "100%",
        bgcolor: isDarkMode ? "#000000" : "#f1f1f1",
        py: { xs: 2, sm: 3, md: 5 },
        px: { xs: 1.5, sm: 2.5, md: 3 },
        boxSizing: "border-box",
        transition: "background 0.3s ease",
      }}
    >
      <Box
        sx={{
          maxWidth: 820,
          mx: "auto",
          width: "100%",
          boxSizing: "border-box",
          backgroundColor: isDarkMode ? "rgba(30, 30, 30, 0.22)" : "rgba(255, 255, 255, 0.4)",
          backdropFilter: "blur(22px)",
          WebkitBackdropFilter: "blur(22px)",
          border: isDarkMode ? "1px solid rgba(255, 255, 255, 0.11)" : "1px solid rgba(0, 0, 0, 0.08)",
          borderRadius: { xs: "24px", md: "32px" },
          p: { xs: 2, sm: 3.5, md: 4.5 },
          boxShadow: isDarkMode
            ? "inset 0 1px 1px rgba(255, 255, 255, 0.11), inset 0 -1px 1px rgba(255, 255, 255, 0.07), 0 1px 0px rgba(0,0,0,0.1)"
            : "inset 0 1px 1px rgba(255, 255, 255, 0.8), inset 0 -1px 1px rgba(0,0,0,0.1), 0 1px 0px rgba(0,0,0,0.1)",
        }}
      >
        {/* Header */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 3,
            pb: 2,
            borderBottom: "1px solid",
            borderColor: isDarkMode ? "rgba(255,255,255,0.08)" : "divider",
          }}
        >
          <Stack direction="row" spacing={1.5} alignItems="center">
            <IconButton
              onClick={handleExit}
              size="small"
              sx={glassIconBtnSx(mode, { p: 1 })}
              aria-label="Back"
            >
              <ChevronLeft fontSize="medium" />
            </IconButton>
            <Box>
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="h5" sx={{ fontWeight: 900, letterSpacing: "-0.5px" }}>
                  Create a Trip
                </Typography>
                <SkullGlyph size={22} opacity={0.6} />
              </Stack>
              <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600 }}>
                Step {activeStep + 1} of 5 — {stepsList[activeStep]}
              </Typography>
            </Box>
          </Stack>

          <IconButton
            onClick={handleExit}
            size="small"
            sx={glassIconBtnSx(mode, { p: 1 })}
            aria-label="Close"
          >
            <CloseOutlined fontSize="small" />
          </IconButton>
        </Box>

        {/* Scrollable & Responsive Stepper Progress Indicator */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.25,
            mb: 3.5,
            overflowX: "auto",
            py: 0.75,
            px: 0.5,
            scrollbarWidth: "none",
            "&::-webkit-scrollbar": { display: "none" },
            WebkitOverflowScrolling: "touch",
          }}
        >
          {stepsList.map((label, idx) => (
            <React.Fragment key={idx}>
              <Chip
                label={`${idx + 1}. ${label}`}
                size="small"
                onClick={() => changeStep(idx)}
                sx={{
                  fontWeight: 700,
                  fontSize: "0.75rem",
                  height: 32,
                  px: 1,
                  borderRadius: 2.5,
                  flexShrink: 0,
                  bgcolor: activeStep === idx ? (isDarkMode ? "#fff" : "#000") : isDarkMode ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
                  color: activeStep === idx ? (isDarkMode ? "#000" : "#fff") : "text.secondary",
                  border: "1px solid",
                  borderColor: activeStep === idx ? "transparent" : isDarkMode ? "rgba(255,255,255,0.08)" : "divider",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  "&:hover": {
                    bgcolor: activeStep === idx ? (isDarkMode ? "#eee" : "#222") : isDarkMode ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
                  },
                }}
              />
              {idx < stepsList.length - 1 && (
                <Box
                  sx={{
                    width: 16,
                    height: 2,
                    bgcolor: activeStep > idx ? "primary.main" : isDarkMode ? "rgba(255,255,255,0.1)" : "divider",
                    borderRadius: 1,
                    flexShrink: 0,
                  }}
                />
              )}
            </React.Fragment>
          ))}
        </Box>

        {/* STEP 1: Route & Map */}
        {activeStep === 0 && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <Box sx={{ flex: 1, display: "flex", flexDirection: "column", gap: 2 }}>
                <Autocomplete
                  freeSolo
                  options={fromResults}
                  inputValue={fromSearchQuery || newTrip.from || ""}
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
                      setFromSearchQuery(val.display_name);
                    }
                  }}
                  renderInput={(params) => {
                    const isFetchingLoc = (newTrip?.from && newTrip.from.includes("Fetching")) || isFetchingLocation;
                    return (
                      <TextField
                        {...params}
                        label="From (Origin)"
                        placeholder={isFetchingLoc ? "📍 Fetching your current location..." : "Search starting location"}
                        onFocus={() => setActiveMapField("from")}
                        helperText={
                          isFetchingLoc ? (
                            <Box component="span" sx={{ display: "inline-flex", alignItems: "center", gap: 0.8, color: "#4ADE80", fontWeight: 600, mt: 0.5 }}>
                              <SkullGlyph size={14} opacity={0.8} /> Fetching precise current location...
                            </Box>
                          ) : null
                        }
                        sx={glassInputSx(mode)}
                        InputProps={{
                          ...params.InputProps,
                          startAdornment: (
                            <InputAdornment position="start">
                              {isFetchingLoc ? (
                                <SkullGlyph size={20} opacity={0.8} />
                              ) : (
                                <LocationOn sx={{ color: "#4ADE80" }} />
                              )}
                            </InputAdornment>
                          ),
                        }}
                      />
                    );
                  }}
                />

                <Autocomplete
                  freeSolo
                  options={toResults}
                  inputValue={toSearchQuery || newTrip.to || ""}
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
                      setToSearchQuery(val.display_name);
                    }
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="To (Destination)"
                      onFocus={() => setActiveMapField("to")}
                      sx={glassInputSx(mode)}
                      InputProps={{
                        ...params.InputProps,
                        startAdornment: (
                          <InputAdornment position="start">
                            <MapIcon sx={{ color: "#F87171" }} />
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
                  borderRadius: 3.5,
                  "&:hover": { bgcolor: "primary.main", color: "primary.contrastText" },
                }}
              >
                <SwapVert />
              </IconButton>
            </Box>

            <Typography variant="caption" color="text.secondary" fontWeight={600}>
              Selected Map Target: <Box component="span" sx={{ color: "primary.main", fontWeight: 800 }}>{activeMapField.toUpperCase()}</Box>
            </Typography>

            <Paper sx={{ height: { xs: 300, sm: 360 }, borderRadius: 4, overflow: "hidden", border: "1px solid", borderColor: isDarkMode ? "rgba(255,255,255,0.08)" : "divider" }}>
              <MapContainer
                center={originCoords || destCoords || [20.5937, 78.9629]}
                zoom={5}
                style={{ height: "100%", width: "100%" }}
              >
                <MapBoundsController originCoords={originCoords} destCoords={destCoords} />
                <TileLayer
                  url={mapTileUrl}
                  attribution='&copy; <a href="https://stadiamaps.com/">Stadia Maps</a> &copy; <a href="https://openstreetmap.org">OpenStreetMap</a>'
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
              <Button fullWidth onClick={closeDrawer} variant="outlined" sx={{ borderRadius: 3, py: 1.2, fontWeight: 700, textTransform: "none" }}>
                Cancel
              </Button>
              <Button
                fullWidth
                onClick={onNextStep}
                variant="contained"
                disabled={!newTrip.from || !newTrip.to}
                sx={{ borderRadius: 3, py: 1.2, fontWeight: 700, textTransform: "none", bgcolor: isDarkMode ? "#fff" : "#000", color: isDarkMode ? "#000" : "#fff", boxShadow: "none" }}
              >
                Next: Select Dates
              </Button>
            </DialogActions>
          </Box>
        )}

        {/* STEP 2: Dates Selection */}
        {activeStep === 1 && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
              Select Travel Schedule
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
              <Button fullWidth onClick={onBackStep} sx={{ borderRadius: 3, py: 1.2, fontWeight: 700, textTransform: "none" }}>
                Back
              </Button>
              <Button
                fullWidth
                onClick={onNextStep}
                variant="contained"
                disabled={!newTrip.startDate || !newTrip.endDate}
                sx={{ borderRadius: 3, py: 1.2, fontWeight: 700, textTransform: "none", bgcolor: isDarkMode ? "#fff" : "#000", color: isDarkMode ? "#000" : "#fff", boxShadow: "none" }}
              >
                Next: Identity & Weather
              </Button>
            </DialogActions>
          </Box>
        )}

        {/* STEP 3: Identity & Weather */}
        {activeStep === 2 && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <Paper
              elevation={0}
              sx={{
                p: 2.5,
                borderRadius: 4,
                bgcolor: isDarkMode ? "rgba(74, 222, 128, 0.05)" : "rgba(74, 222, 128, 0.04)",
                border: "1px solid",
                borderColor: "rgba(74, 222, 128, 0.2)",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1.5 }}>
                <Typography variant="subtitle2" fontWeight={800} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <WbSunny sx={{ color: "#FACC15" }} /> Live Destination Weather
                </Typography>
                {isWeatherLoading && <SkullGlyph size={16} opacity={0.7} />}
              </Box>

              {weatherData?.current_weather ? (
                <Stack direction="row" spacing={3} alignItems="center">
                  <Box>
                    <Typography variant="h4" fontWeight={900}>
                      {weatherData.current_weather.temperature}°C
                    </Typography>
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>
                      Current Temperature
                    </Typography>
                  </Box>
                  <Box>
                    <Chip
                      icon={<CheckCircle sx={{ color: "#4ADE80 !important" }} />}
                      label="Ideal Time to Visit"
                      size="small"
                      sx={{ fontWeight: 700, bgcolor: "rgba(74, 222, 128, 0.1)", color: "#4ADE80", border: "1px solid rgba(74, 222, 128, 0.3)" }}
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
              <Avatar src={newTrip.iconDataUri || randomNatureImage} sx={{ width: 100, height: 100, borderRadius: 4, boxShadow: "0 4px 20px rgba(0,0,0,0.15)", border: "2px solid", borderColor: isDarkMode ? "rgba(255,255,255,0.15)" : "divider" }} />
              <Button variant="outlined" component="label" startIcon={<CloudUpload />} size="small" sx={{ borderRadius: 3, textTransform: "none", fontWeight: 700 }}>
                Upload Cover Photo
                <input type="file" hidden accept="image/*" onChange={handleImageUpload} />
              </Button>
            </Box>

            <TextField
              label={isDevBeta ? "Trip Name (Auto-Suggested by AI)" : "Trip Name"}
              fullWidth
              value={newTrip.name || ""}
              onChange={(e) => setNewTrip({ ...newTrip, name: e.target.value })}
              sx={glassInputSx(mode)}
              InputProps={{
                endAdornment: isDevBeta && (
                  isGeneratingItinerary ? <SkullGlyph size={18} opacity={0.8} /> : <AutoAwesome sx={{ color: "primary.main" }} />
                ),
              }}
            />

            <TextField
              label="Trip Description"
              fullWidth
              multiline
              rows={3}
              value={newTrip.description || ""}
              onChange={(e) => setNewTrip({ ...newTrip, description: e.target.value })}
              sx={glassInputSx(mode)}
            />

            <DialogActions sx={{ mt: 2, px: 0, gap: 1.5 }}>
              <Button fullWidth onClick={onBackStep} sx={{ borderRadius: 3, py: 1.2, fontWeight: 700, textTransform: "none" }}>
                Back
              </Button>
              <Button
                fullWidth
                onClick={onNextStep}
                variant="contained"
                disabled={!newTrip.name}
                sx={{ borderRadius: 3, py: 1.2, fontWeight: 700, textTransform: "none", bgcolor: isDarkMode ? "#fff" : "#000", color: isDarkMode ? "#000" : "#fff", boxShadow: "none" }}
              >
                Next: Budget & Members
              </Button>
            </DialogActions>
          </Box>
        )}

        {/* STEP 4: Budget & Members */}
        {activeStep === 3 && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
              Add Connections & Friends
            </Typography>
            <Stack direction="row" spacing={2} sx={{ overflowX: "auto", pb: 1 }}>
              {friendCards.map((friend) => (
                <Card key={friend.uid} elevation={0} sx={{ minWidth: 120, p: 2, textAlign: "center", borderRadius: 3.5, border: "1px solid", borderColor: isDarkMode ? "rgba(255,255,255,0.08)" : "divider", bgcolor: isDarkMode ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.01)" }}>
                  <Avatar src={friend.photoURL} sx={{ mx: "auto", mb: 1, width: 44, height: 44, fontWeight: 700 }}>
                    {(friend.name || friend.username || "A").charAt(0)}
                  </Avatar>
                  <Typography variant="caption" noWrap fontWeight={700} display="block" sx={{ mb: 1 }}>
                    {friend.name || friend.username}
                  </Typography>
                  <Button size="small" variant="outlined" onClick={() => handleAddMember(friend)} sx={{ borderRadius: 2, textTransform: "none", fontSize: "0.7rem", fontWeight: 700 }}>
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
                    sx={{ fontWeight: 700, borderRadius: 2.5 }}
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
              sx={glassInputSx(mode)}
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
              sx={{
                bgcolor: isDarkMode ? "rgba(0,0,0,0.2)" : "rgba(0,0,0,0.04)",
                borderRadius: 2.5,
                p: 0.5,
                "& .MuiToggleButton-root": {
                  border: "none",
                  borderRadius: 2,
                  textTransform: "none",
                  fontWeight: 700,
                  fontSize: "0.8rem",
                  py: 0.8,
                  color: "text.secondary",
                  "&.Mui-selected": {
                    bgcolor: isDarkMode ? "rgba(255,255,255,0.12)" : "background.paper",
                    color: "text.primary",
                    boxShadow: isDarkMode ? "0 2px 8px rgba(0,0,0,0.4)" : "0 2px 8px rgba(0,0,0,0.08)",
                  },
                },
              }}
            >
              <ToggleButton value="equal">Equal Split</ToggleButton>
              <ToggleButton value="manual">Manual</ToggleButton>
              <ToggleButton value="auto">Auto</ToggleButton>
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
                      bgcolor: isDarkMode ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.01)",
                      border: "1px solid",
                      borderColor: isDarkMode ? "rgba(255,255,255,0.06)" : "divider",
                      borderRadius: 3,
                    }}
                  >
                    <Avatar src={m.photoURL} sx={{ width: 36, height: 36, fontWeight: 700 }}>
                      {(m.name || "M").charAt(0)}
                    </Avatar>
                    <Typography sx={{ flexGrow: 1 }} variant="body2" fontWeight={700}>
                      {m.name || m.username}
                    </Typography>
                    <TextField
                      label="Contribution"
                      type="number"
                      size="small"
                      disabled={splitMode === "equal"}
                      sx={{ width: 130, ...glassInputSx(mode) }}
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
              <Button fullWidth onClick={onBackStep} sx={{ borderRadius: 3, py: 1.2, fontWeight: 700, textTransform: "none" }}>
                Back
              </Button>
              <Button
                fullWidth
                variant="contained"
                onClick={onCreateTripAndProceedToStep5}
                disabled={isCreatingTrip}
                startIcon={isCreatingTrip ? <SkullGlyph size={18} opacity={0.9} /> : null}
                sx={{ borderRadius: 3, py: 1.2, fontWeight: 700, textTransform: "none", bgcolor: isDarkMode ? "#fff" : "#000", color: isDarkMode ? "#000" : "#fff", boxShadow: "none" }}
              >
                {isCreatingTrip ? "Creating Trip..." : "Create Trip"}
              </Button>
            </DialogActions>
          </Box>
        )}

        {/* STEP 5: Timeline & Checklist Previews */}
        {activeStep === 4 && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <Box sx={{ textAlign: "center", mt: 1 }}>
              <Avatar sx={{ bgcolor: isDarkMode ? "rgba(74, 222, 128, 0.15)" : "rgba(74, 222, 128, 0.1)", mx: "auto", width: 64, height: 64, mb: 1.5 }}>
                <AutoAwesome sx={{ color: "#4ADE80", fontSize: 32 }} />
              </Avatar>
              <Typography variant="h6" fontWeight={800}>
                🎉 Trip Created Successfully!
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                Fine-tune itinerary timeline and packing checklist for <b>{createdTripDetails?.name || newTrip.name}</b>.
              </Typography>
            </Box>

            {isAiGeneratingStep5 ? (
              <CreateTripSkullLoader isAiGenerating={true} />
            ) : (
              <Stack spacing={3}>
                {/* Timeline Preview */}
                <Paper elevation={0} sx={{ p: 2.5, borderRadius: 4, border: "1px solid", borderColor: isDarkMode ? "rgba(255,255,255,0.08)" : "divider", bgcolor: isDarkMode ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.01)" }}>
                  <Typography variant="subtitle2" fontWeight={800} sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                    <TimelineIcon sx={{ color: "#4ADE80" }} /> Itinerary Timeline ({previewTimeline.length} Days)
                  </Typography>

                  <Stack spacing={2}>
                    {previewTimeline.map((item, idx) => (
                      <Paper key={idx} elevation={0} sx={{ p: 2, borderRadius: 3, display: "flex", flexDirection: "column", gap: 1.5, border: "1px solid", borderColor: isDarkMode ? "rgba(255,255,255,0.06)" : "divider", bgcolor: isDarkMode ? "rgba(255,255,255,0.01)" : "background.paper" }}>
                        <Box sx={{ display: "flex", gap: 1.5, alignItems: "center" }}>
                          <Chip label={`Day ${idx + 1}`} size="small" sx={{ fontWeight: 800, bgcolor: "#4ADE80", color: "#000" }} />
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
                            sx={glassInputSx(mode)}
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
                          sx={glassInputSx(mode)}
                        />

                        <TextField
                          size="small"
                          label="Activity Description"
                          multiline
                          rows={2}
                          fullWidth
                          value={item.note || ""}
                          onChange={(e) => {
                            const updated = [...previewTimeline];
                            updated[idx].note = e.target.value;
                            setPreviewTimeline(updated);
                          }}
                          sx={glassInputSx(mode)}
                        />
                      </Paper>
                    ))}
                  </Stack>
                </Paper>

                {/* Checklist Preview */}
                <Paper elevation={0} sx={{ p: 2.5, borderRadius: 4, border: "1px solid", borderColor: isDarkMode ? "rgba(255,255,255,0.08)" : "divider", bgcolor: isDarkMode ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.01)" }}>
                  <Typography variant="subtitle2" fontWeight={800} sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                    <ListAlt sx={{ color: "#38BDF8" }} /> Relevant Packing Checklist
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
                          sx={glassInputSx(mode)}
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

                  <Box sx={{ display: "flex", gap: 1 }}>
                    <TextField
                      size="small"
                      fullWidth
                      placeholder="Add custom item..."
                      value={newChecklistText}
                      onChange={(e) => setNewChecklistText(e.target.value)}
                      sx={glassInputSx(mode)}
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
                      sx={{ borderRadius: 3, textTransform: "none", fontWeight: 700, px: 2.5 }}
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
                startIcon={isSavingSubcollections ? <SkullGlyph size={18} opacity={0.9} /> : <CheckCircle />}
                sx={{
                  py: 1.4,
                  borderRadius: 3.5,
                  fontWeight: 700,
                  background: "linear-gradient(135deg, #4ADE80, #38BDF8)",
                  color: "#000",
                  textTransform: "none",
                  boxShadow: "none",
                  "&:hover": { opacity: 0.9, boxShadow: "none" },
                }}
              >
                {isSavingSubcollections ? "Saving Timeline & Checklist..." : "Finish & Save to Trip"}
              </Button>

              <Button
                fullWidth
                variant="outlined"
                onClick={handleExit}
                disabled={isSavingSubcollections}
                sx={{ borderRadius: 3.5, textTransform: "none", fontWeight: 700 }}
              >
                Skip for Now
              </Button>
            </DialogActions>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default CreateTripDrawer;