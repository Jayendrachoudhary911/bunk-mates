import React, { useEffect, useState } from "react";
import {
    Box,
    Typography,
    Container,
    Button,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    IconButton,
    TextField,
    Checkbox,
    CircularProgress,
    Paper,
    Chip,
    Stack,
    Fade,
    Modal,
    InputBase
} from "@mui/material";

import {
    LocationOn,
    AccessTime,
    Edit,
    Settings as SettingsIcon,
    Info as InfoIcon,
    Directions as DirectionsIcon,
    ArrowBack as ArrowBackIcon,
    Group as GroupIcon,
    Share as ShareIcon,
    AutoAwesome as AutoAwesomeIcon,
    Explore as ExploreIcon,
    EventNote as EventNoteIcon,
    PlaylistAddCheck as PlaylistAddCheckIcon,
    Delete as DeleteIcon,
    Close as CloseIcon,
    Search as SearchIcon,
    Hotel as HotelIcon,
    Restaurant as RestaurantIcon,
    Place as PlaceIcon
} from "@mui/icons-material";

import { useParams, useNavigate } from "react-router-dom";
import {
    getDoc,
    getDocs,
    doc,
    updateDoc,
    collection,
    addDoc,
    onSnapshot,
    deleteDoc,
    setDoc,
    query,
    where,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { db } from "../firebase";

import { useWeather } from "../contexts/WeatherContext";
import { useThemeToggle } from "../contexts/ThemeToggleContext";
import { getTheme } from "../theme";
import { glassInputSx } from "../theme/designSystem";

// imported sub-components
import ShareDrawer from "./trips_components/ShareDrawer";
import ChecklistDrawer from "./trips_components/ChecklistDrawer";
import TimelineDrawer from "./trips_components/TimelineDrawer";
import BudgetDrawer from "./trips_components/BudgetDrawer";
import ExpenseDrawer from "./trips_components/ExpenseDrawer";
import LinkDrawer from "./trips_components/LinkDrawer";
import SettingsDrawer from "./trips_components/SettingsDrawer";
import ConfirmDeleteDialog from "./trips_components/ConfirmDeleteDialog";
import ChecklistViewAllDrawer from "./trips_components/ChecklistViewAllDrawer";
import TimelineAllDrawer from "./trips_components/TimelineAllDrawer";
import RouteMap from "./trips_components/RouteMap";
import MembersSection from "./trips_components/MembersSection";
import BudgetExpensesSection from "./trips_components/BudgetExpensesSection";

const getCurrentDate = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
};

const getCurrentTime = () => {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    return `${hours}:${minutes}`;
};

export default function TripDetails() {
    const { id } = useParams();
    const navigate = useNavigate();

    const auth = getAuth();
    const currentUser = auth.currentUser;
    const currentUseruid = currentUser ? currentUser.uid : null;
    const [groupChatIcon, setGroupChatIcon] = useState("");
    const [trip, setTrip] = useState(null);
    const [editMode, setEditMode] = useState(false);
    const [editTrip, setEditTrip] = useState({});
    const [checklist, setChecklist] = useState([]);
    const [checklistDrawerOpen, setChecklistDrawerOpen] = useState(false);
    const [newTask, setNewTask] = useState("");
    
    // Budget & Expenses State
    const [budget, setBudget] = useState({ total: 0, used: 0, contributors: [], expenses: [] });

    // eslint-disable-next-line no-unused-vars
    const [photos, setPhotos] = useState([]);
    // eslint-disable-next-line no-unused-vars
    const [snackbar, setSnackbar] = useState({ open: false, message: "" });
    const [shareDrawerOpen, setShareDrawerOpen] = useState(false);
    const [timeline, setTimeline] = useState([]);
    const [timelineDrawerOpen, setTimelineDrawerOpen] = useState(false);
    const [timelineAllDrawerOpen, setTimelineAllDrawerOpen] = useState(false);
    const [newEvent, setNewEvent] = useState({ title: "", time: "", note: "" });
    const [budgetDrawerOpen, setBudgetDrawerOpen] = useState(false);
    const [editBudget, setEditBudget] = useState({ total: "", contributors: [] });
    const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
    const { getWeather } = useWeather();
    const [weather, setWeather] = useState(null);
    const [, setWeatherLoading] = useState(false);
    const [, setAqiData] = useState(null);
    const [checklistDrafts, setChecklistDrafts] = useState([]);
    const [uploadingBatch, setUploadingBatch] = useState(false);
    const [checklistViewAllOpen, setChecklistViewAllOpen] = useState(false);
    const [settingsDrawerOpen, setSettingsDrawerOpen] = useState(false);

    // AI Features & Famous Places State
    const [groqApiKey, setGroqApiKey] = useState("");
    const [isGeneratingAiTimeline, setIsGeneratingAiTimeline] = useState(false);
    const [isGeneratingAiChecklist, setIsGeneratingAiChecklist] = useState(false);
    const [isGeneratingPlaces, setIsGeneratingPlaces] = useState(false);
    const [famousPlaces, setFamousPlaces] = useState([]);

    // Fullscreen Interactive Map & Search State
    const [mapModalOpen, setMapModalOpen] = useState(false);
    const [mapSearchQuery, setMapSearchQuery] = useState("");
    const [mapCategoryFilter, setMapCategoryFilter] = useState("all");

    const [tripLinks, setTripLinks] = useState([]);
    const [newLink, setNewLink] = useState({ title: "", url: "" });
    const [linkDrawerOpen, setLinkDrawerOpen] = useState(false);
    const [editingExpense, setEditingExpense] = useState(null);

    const { mode, setMode, accent, setAccent } = useThemeToggle();
    const theme = getTheme(mode, accent);

    // Expense states
    const [expenseDrawerOpen, setExpenseDrawerOpen] = useState(false);
    const [newExpense, setNewExpense] = useState({
        name: "",
        amount: "",
        category: "",
        date: getCurrentDate(),
        time: getCurrentTime(),
        paidBy: currentUseruid,
        splitMode: "single_payer",
    });
    const [expenseContributors, setExpenseContributors] = useState([]);

    const [userData, setUserData] = useState(null);

    const [memberDetails, setMemberDetails] = useState([]);
    const [timelineDrafts, setTimelineDrafts] = useState([]);

    const [tripPermissions, setTripPermissions] = useState({
        canAddMembers: "all",
        canAddExpenses: "all",
        canAddChecklists: "all",
        canAddTimelines: "all",
        canEditTrip: "admins",
    });
    const [displaySettings, setDisplaySettings] = useState({
        layout: "grid",
        gridCols: 3,
        listCols: 1,
        cardType: "regular",
    });
    const [tripAdmins, setTripAdmins] = useState([]);


    // Extract schema mapping accurately from fetched budget structure
    const budgetDataDoc = budget || {};
    const budgetItems = Array.isArray(budgetDataDoc.items) ? budgetDataDoc.items : [];
    const activeBudgetItem = budgetItems.find(item => item.tripId === id) || budgetItems[0] || budgetDataDoc;

    const rawContributors = activeBudgetItem.contributors || budgetDataDoc.contributors || [];
    const rawExpenses = activeBudgetItem.expenses || budgetDataDoc.expenses || [];

const normalizedContributors = rawContributors.length > 0
        ? rawContributors.map(c => {
            const memberObj = memberDetails.find(m => m.uid === (c.uid || c.id)) || {};
            return {
                id: c.uid || c.id || Math.random().toString(),
                name: c.name || memberObj.name || "Member",
                nickname: memberObj.nickname || c.nickname, // <--- added direct nickname fallback
                nicknames: memberObj.nicknames || c.nicknames || {}, // <--- crucial: pass nicknames map
                photoURL: memberObj.photoURL || c.photoURL || "",
                amount: Number(c.amount) || 0
            };
        })
        : memberDetails.map(m => ({
            id: m.uid,
            name: m.name || "Member",
            nickname: m.nickname,
            nicknames: m.nicknames || {}, // <--- crucial: pass nicknames map here too
            photoURL: m.photoURL || "",
            amount: 0
        }));

    const numericBudget = Number(activeBudgetItem.total || budgetDataDoc.total) || 0;
    const totalSpent = rawExpenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);

    const formatCurrency = (val) => {
        return `₹${Number(val || 0).toFixed(2)}`;
    };

    // Safely format Firestore Timestamps, Dates, or strings into readable date string
    const formatTimestampOrDate = (val) => {
        if (!val) return "";
        if (typeof val === "string") return val;
        if (typeof val === "number") return new Date(val).toLocaleDateString();
        if (typeof val === "object" && val !== null) {
            if (typeof val.toDate === "function") {
                return val.toDate().toLocaleDateString();
            }
            if (typeof val.seconds === "number") {
                return new Date(val.seconds * 1000).toLocaleDateString();
            }
            if (val instanceof Date) {
                return val.toLocaleDateString();
            }
            return "";
        }
        return String(val);
    };

    // Safely format Firestore Timestamps, Dates, or strings into readable time string
    const formatEventTime = (val) => {
        if (!val) return "";
        let d = null;
        if (typeof val === "object" && val !== null) {
            if (typeof val.toDate === "function") d = val.toDate();
            else if (typeof val.seconds === "number") d = new Date(val.seconds * 1000);
            else if (val instanceof Date) d = val;
        } else {
            d = new Date(val);
        }
        if (!d || isNaN(d.getTime())) return typeof val === "string" ? val : "";
        return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    };

    // Safely format Trip date range (handling Timestamps and strings)
    const formatTripDateRange = (startDate, endDate) => {
        const parse = (d) => {
            if (!d) return null;
            if (typeof d === "object" && d !== null) {
                if (typeof d.toDate === "function") return d.toDate();
                if (typeof d.seconds === "number") return new Date(d.seconds * 1000);
                if (d instanceof Date) return d;
            }
            const parsed = new Date(d);
            return isNaN(parsed.getTime()) ? null : parsed;
        };
        const s = parse(startDate);
        const e = parse(endDate);
        if (s && e) return `${s.toDateString()} → ${e.toDateString()}`;
        if (s) return s.toDateString();
        return "Date not set";
    };

    // Fetch user's Groq API Key with automatic env & storage fallback
    useEffect(() => {
        const fetchGroqKey = async () => {
            const envKey = process.env.REACT_APP_GROQ_API_KEY || "";
            if (envKey) {
                setGroqApiKey(envKey);
            }
            if (!currentUseruid) return;
            try {
                const userDocSnap = await getDoc(doc(db, "users", currentUseruid));
                if (userDocSnap.exists() && userDocSnap.data().groqApiKey) {
                    setGroqApiKey(userDocSnap.data().groqApiKey);
                } else if (!envKey) {
                    const localKey = localStorage.getItem("groqApiKey") || localStorage.getItem("REACT_APP_GROQ_API_KEY");
                    if (localKey) setGroqApiKey(localKey);
                }
            } catch (err) {
                console.warn("Could not fetch Groq API Key:", err);
            }
        };
        fetchGroqKey();
    }, [currentUseruid]);

    useEffect(() => {
        if (!currentUseruid) return;
        const unsub = onSnapshot(doc(db, "users", currentUseruid), (snap) => {
            if (snap.exists()) {
                setUserData(snap.data());
            }
        });
        return () => unsub();
    }, [currentUseruid]);


    // Real-time listener for groupChats document matching trip ID
    useEffect(() => {
        if (!id) return;
        const unsubGroup = onSnapshot(doc(db, "groupChats", id), async (snap) => {
            if (snap.exists()) {
                const data = snap.data();
                const icon = data.iconURL || data.photoURL || data.icon || "";
                if (icon) setGroupChatIcon(icon);
            } else {
                try {
                    const q = query(collection(db, "groupChats"), where("tripId", "==", id));
                    const qSnap = await getDocs(q);
                    if (!qSnap.empty) {
                        const data = qSnap.docs[0].data();
                        const icon = data.iconURL || data.photoURL || data.icon || "";
                        if (icon) setGroupChatIcon(icon);
                    }
                } catch (err) {
                    console.warn("Failed querying groupChats for icon:", err);
                }
            }
        });
        return () => unsubGroup();
    }, [id]);

    // Subscriptions & Initial Load
    useEffect(() => {
        if (!id) return;

        const tripRef = doc(db, "trips", id);
        const unsubTrip = onSnapshot(tripRef, (snap) => {
            if (!snap.exists()) return;
            const data = snap.data();
            setTrip((prev) => ({ ...prev, ...data }));
            setEditTrip(data);
            setTripPermissions(data.permissions || tripPermissions);
            // Normalize admins to an array of user IDs and always include the creator.
            const adminValues = Array.isArray(data.admins)
                ? data.admins
                : data.admins
                    ? [data.admins]
                    : [];
            const adminIds = adminValues
                .map((admin) => typeof admin === "string" ? admin : admin?.uid || admin?.id)
                .filter(Boolean);
            setTripAdmins([...new Set([data.createdBy, ...adminIds].filter(Boolean))]);
            setTripLinks(data.links || []);
            if (data.display) {
                setDisplaySettings((prev) => ({ ...prev, ...data.display }));
            }
            if (data.members?.length) loadMemberDetails(data.members);
            if (data.location) {
                getWeather(data.location).then(setWeather).catch(() => {});
            }
        });

        const unsubPlaces = onSnapshot(collection(db, `trips/${id}/places`), (snap) => {
            setFamousPlaces(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        });

        const unsubChecklist = onSnapshot(collection(db, `trips/${id}/checklist`), (snap) => {
            setChecklist(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        });

        const unsubPhotos = onSnapshot(collection(db, `trips/${id}/photos`), (snap) => {
            setPhotos(snap.docs.map((d) => d.data().url).filter(Boolean));
        });

        const timelineRef = collection(db, `trips/${id}/timeline`);
        const unsubTimeline = onSnapshot(timelineRef, async (snap) => {
            const events = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
            const now = new Date().toISOString();

            await Promise.all(
                events
                    .filter((e) => e.surprise && e.revealAt && !e.revealed && e.revealAt <= now)
                    .map((e) => updateDoc(doc(db, `trips/${id}/timeline`, e.id), { revealed: true }).catch(() => {}))
            );

            const visibleEvents = events.filter((event) => {
                if (!event.surprise) return true;
                if (event.createdBy === currentUseruid) return true;
                if (event.admins === currentUseruid) return true;
                if (event.revealed) return true;
                if (event.revealAt && event.revealAt <= now) return true;
                return false;
            });

            setTimeline(visibleEvents.sort((a, b) => new Date(a.time) - new Date(b.time)));
        });

        const budgetRef = doc(db, "budgets", id);
        const unsubBudget = onSnapshot(budgetRef, (snap) => {
            if (!snap.exists()) {
                setBudget({ total: 0, used: 0, contributors: [], expenses: [] });
                return;
            }
            const data = snap.data();
            setBudget(data);
            setEditBudget({ total: data.total || 0, contributors: data.contributors || [] });
        });

        return () => {
            unsubTrip();
            unsubPlaces();
            unsubChecklist();
            unsubPhotos();
            unsubTimeline();
            unsubBudget();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id, currentUseruid]);

    const fetchTripWeatherAndAQI = async (locationStr) => {
        if (!locationStr) return;
        setWeatherLoading(true);
        try {
            const apiKey = process.env.REACT_APP_OPENWEATHER_API_KEY || "";
            if (!apiKey) {
                console.warn("OpenWeather API key is not configured. Set REACT_APP_OPENWEATHER_API_KEY in your environment.");
                setWeatherLoading(false);
                return;
            }
            const weatherRes = await fetch(
                `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(locationStr)}&appid=${apiKey}&units=metric`
            );
            const wData = await weatherRes.json();
            if (wData && wData.cod === 200) {
                const weatherObj = {
                    main: wData.weather?.[0]?.main || "Default",
                    desc: wData.weather?.[0]?.description || "",
                    temp: Math.round(wData.main?.temp),
                    city: wData.name,
                    feelsLike: Math.round(wData.main?.feels_like),
                    humidity: wData.main?.humidity,
                    wind: Math.round((wData.wind?.speed || 0) * 3.6),
                    pressure: wData.main?.pressure,
                    visibility: wData.visibility,
                    clouds: wData.clouds?.all,
                    rain: wData.rain?.['1h'] || 0,
                    snow: wData.snow?.['1h'] || 0,
                    windSpeed: wData.wind?.speed,
                    windDeg: wData.wind?.deg,
                    windGust: wData.wind?.gust || 0,
                    country: wData.sys?.country,
                    sunrise: wData.sys?.sunrise,
                    sunset: wData.sys?.sunset,
                    timezone: wData.timezone,
                    id: wData.id,
                };
                setWeather(weatherObj);

                // Fetch real-time Air Pollution / AQI for coordinates
                if (wData.coord?.lat && wData.coord?.lon) {
                    try {
                        const aqiRes = await fetch(
                            `https://api.openweathermap.org/data/2.5/air_pollution?lat=${wData.coord.lat}&lon=${wData.coord.lon}&appid=${apiKey}`
                        );
                        const aData = await aqiRes.json();
                        if (aData?.list?.[0]) {
                            const item = aData.list[0];
                            const aqiLevel = item.main?.aqi || 1;
                            const scaledAqi = aqiLevel === 1 ? 35 : aqiLevel === 2 ? 70 : aqiLevel === 3 ? 120 : aqiLevel === 4 ? 175 : 260;
                            const comps = item.components || {};
                            setAqiData({
                                station: `${wData.name} Monitoring Station`,
                                city: wData.name,
                                state: wData.sys?.country || "Region",
                                last_update: new Date().toLocaleTimeString(),
                                maxAqi: scaledAqi,
                                pollutants: {
                                    "pm2.5": { value: Math.round(comps.pm2_5 || 0), unit: "µg/m³" },
                                    "pm10": { value: Math.round(comps.pm10 || 0), unit: "µg/m³" },
                                    "no2": { value: Math.round(comps.no2 || 0), unit: "µg/m³" },
                                    "so2": { value: Math.round(comps.so2 || 0), unit: "µg/m³" },
                                    "co": { value: Math.round(comps.co || 0), unit: "µg/m³" },
                                    "ozone": { value: Math.round(comps.o3 || 0), unit: "µg/m³" },
                                }
                            });
                        }
                    } catch (aqiErr) {
                        console.warn("Trip AQI fetch fallback:", aqiErr);
                    }
                }
            }
        } catch (err) {
            console.warn("Trip weather fetch error:", err);
        } finally {
            setWeatherLoading(false);
        }
    };

    useEffect(() => {
        const dest = trip?.to || trip?.location || trip?.name;
        if (dest) {
            fetchTripWeatherAndAQI(dest);
        }
    }, [trip?.to, trip?.location, trip?.name]);

    const updateDisplaySettings = async (partial) => {
        const next = { ...displaySettings, ...partial };
        setDisplaySettings(next);
        if (!id) return;
        try {
            await updateDoc(doc(db, "trips", id), { display: next });
            setTrip((t) => (t ? { ...t, display: next } : t));
        } catch (err) {
            console.error("Failed to save display settings:", err);
        }
    };

    const initializeExpenseContributors = (members, mode) =>
        members.map((member) => ({
            uid: member.uid,
            name: member.name || "Unknown",
            photoURL: member.photoURL,
            included: mode === "multiple_payers" ? true : member.uid === currentUseruid,
            paidAmount: 0,
        }));

    const saveBudget = async () => {
        if (!trip) return;
        try {
            const budgetRef = doc(db, "budgets", id);
            const total = Number(editBudget.total) || 0;
            const contributors = (editBudget.contributors || []).map((c) => ({ ...c, amount: Number(c.amount) || 0 }));
            await setDoc(budgetRef, { total, contributors, updatedAt: new Date().toISOString(), createdBy: trip.createdBy || currentUseruid, tripId: id }, { merge: true });
            setSnackbar({ open: true, message: "Budget saved successfully!" });
            setBudgetDrawerOpen(false);
        } catch (err) {
            console.error(err);
            setSnackbar({ open: true, message: "Failed to save budget." });
        }
    };

    const addExpense = async () => {
        if (!newExpense.name || !newExpense.amount || !newExpense.date || !newExpense.time) {
            setSnackbar({ open: true, message: "Please fill all required fields." });
            return;
        }
        try {
            const budgetRef = doc(db, "budgets", id);
            const budgetSnap = await getDoc(budgetRef);
            if (!budgetSnap.exists()) {
                setSnackbar({ open: true, message: "Please set up the budget first." });
                return;
            }
            const data = budgetSnap.data();
            const expenses = data.expenses || [];

            let payers = [];
            if (newExpense.splitMode === "multiple_payers") {
                payers = (expenseContributors || []).filter((p) => p.included && parseFloat(p.paidAmount) > 0).map((p) => ({ uid: p.uid, name: getMemberName(p.uid), amount: parseFloat(p.paidAmount) }));
                const totalPaid = payers.reduce((s, p) => s + p.amount, 0);
                if (totalPaid !== parseFloat(newExpense.amount)) {
                    setSnackbar({ open: true, message: `Total of payers (${totalPaid}) !== expense total (${newExpense.amount}).` });
                    return;
                }
            } else {
                if (!newExpense.paidBy) {
                    setSnackbar({ open: true, message: "Please select who paid." });
                    return;
                }
                payers = [{ uid: newExpense.paidBy, name: getMemberName(newExpense.paidBy), amount: parseFloat(newExpense.amount) }];
            }

            const expenseDateTime = new Date(`${newExpense.date}T${newExpense.time}`).toISOString();
            const newExpenseItem = { name: newExpense.name, amount: parseFloat(newExpense.amount), category: newExpense.category || "General", date: newExpense.date, time: newExpense.time, dateTime: expenseDateTime, payers, splitMode: newExpense.splitMode, createdBy: currentUseruid, createdAt: new Date().toISOString() };
            const updatedExpenses = [...expenses, newExpenseItem];
            await updateDoc(budgetRef, { expenses: updatedExpenses });
            setBudget((prev) => ({ ...prev, expenses: updatedExpenses }));
            setSnackbar({ open: true, message: "Expense added successfully!" });
            setExpenseDrawerOpen(false);
            setNewExpense({ name: "", amount: "", category: "", date: getCurrentDate(), time: getCurrentTime(), paidBy: currentUseruid, splitMode: "single_payer" });
            setExpenseContributors(initializeExpenseContributors(memberDetails, "single_payer"));
        } catch (err) {
            console.error(err);
            setSnackbar({ open: true, message: "Failed to add expense." });
        }
    };

    const updateExpense = async () => {
        if (!editingExpense) return;
        try {
            const budgetRef = doc(db, "budgets", id);
            const budgetSnap = await getDoc(budgetRef);
            if (!budgetSnap.exists()) {
                setSnackbar({ open: true, message: "Budget not found." });
                return;
            }
            const data = budgetSnap.data();
            const expenses = data.expenses || [];

            let payers = [];
            if (newExpense.splitMode === "multiple_payers") {
                payers = (expenseContributors || []).filter((p) => p.included && parseFloat(p.paidAmount) > 0).map((p) => ({ uid: p.uid, name: getMemberName(p.uid), amount: parseFloat(p.paidAmount) }));
                const totalPaid = payers.reduce((s, p) => s + p.amount, 0);
                if (totalPaid !== parseFloat(newExpense.amount)) {
                    setSnackbar({ open: true, message: `Total of payers (${totalPaid}) !== expense total (${newExpense.amount}).` });
                    return;
                }
            } else {
                payers = [{ uid: newExpense.paidBy, name: getMemberName(newExpense.paidBy), amount: parseFloat(newExpense.amount) }];
            }

            const expenseDateTime = new Date(`${newExpense.date}T${newExpense.time}`).toISOString();
            const updatedExpense = { ...editingExpense, name: newExpense.name, amount: parseFloat(newExpense.amount), category: newExpense.category || "General", date: newExpense.date, time: newExpense.time, dateTime: expenseDateTime, payers, splitMode: newExpense.splitMode };
            const updatedExpenses = expenses.map((exp) => (exp.dateTime === editingExpense.dateTime ? updatedExpense : exp));
            await updateDoc(budgetRef, { expenses: updatedExpenses });
            setBudget((prev) => ({ ...prev, expenses: updatedExpenses }));
            setSnackbar({ open: true, message: "Expense updated successfully!" });
            setExpenseDrawerOpen(false);
            setEditingExpense(null);
        } catch (err) {
            console.error(err);
            setSnackbar({ open: true, message: "Failed to update expense." });
        }
    };

    const handleAddLink = async () => {
        if (!newLink.url || !newLink.title) {
            setSnackbar({ open: true, message: "Please fill both fields." });
            return;
        }
        try {
            const tripRef = doc(db, "trips", id);
            const updatedLinks = [
                ...(tripLinks || []),
                { id: crypto.randomUUID(), ...newLink, createdBy: currentUseruid, createdAt: new Date().toISOString() },
            ];
            await updateDoc(tripRef, { links: updatedLinks });
            setNewLink({ title: "", url: "" });
            setLinkDrawerOpen(false);
            setSnackbar({ open: true, message: "Link added successfully!" });
        } catch (err) {
            console.error(err);
            setSnackbar({ open: true, message: "Failed to add link." });
        }
    };

    const addTask = async () => {
        if (!newTask?.trim()) return;
        await addDoc(collection(db, `trips/${id}/checklist`), { text: newTask.trim(), completed: false });
        setNewTask("");
    };

    const handleChecklistFileUpload = (event) => {
        const file = event.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target.result || "";
            const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
            if (lines.length === 0) setSnackbar({ open: true, message: "No valid checklist items found in file." });
            else setChecklistDrafts(lines);
        };
        reader.readAsText(file);
    };

    const addAllChecklistItems = async () => {
        if (!checklistDrafts.length) {
            setSnackbar({ open: true, message: "No checklist items to add." });
            return;
        }
        setUploadingBatch(true);
        try {
            await Promise.all(checklistDrafts.map((text) => addDoc(collection(db, `trips/${id}/checklist`), { text, completed: false })));
            setChecklistDrafts([]);
            setChecklistDrawerOpen(false);
            setSnackbar({ open: true, message: `${checklistDrafts.length} checklist item(s) added!` });
        } catch (err) {
            console.error(err);
            setSnackbar({ open: true, message: "Failed to add checklist items." });
        }
        setUploadingBatch(false);
    };

    const addTimelineEvent = async () => {
        if (!newEvent.title || !newEvent.time) {
            setSnackbar({ open: true, message: "Please fill all required fields." });
            return;
        }
        try {
            const eventData = {
                title: newEvent.title,
                time: newEvent.time,
                note: newEvent.note || "",
                completed: false,
                createdBy: currentUseruid,
                createdAt: new Date().toISOString(),
                surprise: newEvent.surprise || false,
                revealed: !newEvent.surprise,
                revealAt: newEvent.revealAt || null,
            };
            await addDoc(collection(db, `trips/${id}/timeline`), eventData);
            setNewEvent({ title: "", time: getCurrentDate() + "T" + getCurrentTime(), note: "" });
            setTimelineDrawerOpen(false);
            setSnackbar({ open: true, message: eventData.surprise ? "Surprise timeline added secretly!" : "Timeline event added successfully!" });
        } catch (err) {
            console.error(err);
            setSnackbar({ open: true, message: "Failed to add timeline event." });
        }
    };

    const handleTimelineFileUpload = (event) => {
        const file = event.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target.result || "";
            const lines = text.split("\n").map((l) => l.trim()).filter((l) => /^([-*•]|\d+\.)\s+.+/.test(l)).map((l) => ({ title: l.replace(/^([-*•]|\d+\.)\s*/, "").trim(), time: getCurrentDate() + "T" + getCurrentTime(), note: "" }));
            if (lines.length === 0) setSnackbar({ open: true, message: "No valid list items found in file." });
            else setTimelineDrafts(lines);
        };
        reader.readAsText(file);
    };

    const cleanAndParseJson = (content) => {
        if (!content) throw new Error("Empty response from AI");
        const cleaned = content
            .replace(/```json/gi, "")
            .replace(/```/g, "")
            .trim();
        try {
            return JSON.parse(cleaned);
        } catch (e) {
            const match = cleaned.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
            if (match) {
                return JSON.parse(match[0]);
            }
            throw e;
        }
    };

    const handleGenerateAiPlaces = async () => {
        const destLocation = trip?.to || trip?.location || trip?.name;
        if (!destLocation) {
            setSnackbar({ open: true, message: "No destination location set for this trip." });
            return;
        }
        const activeKey = groqApiKey || process.env.REACT_APP_GROQ_API_KEY || "";
        if (!activeKey) {
            setSnackbar({ open: true, message: "Please configure your Groq API Key in Profile settings." });
            return;
        }

        setIsGeneratingPlaces(true);
        try {
            const prompt = `Give me 5 famous, must-visit tourist attractions and local places to visit in "${destLocation}".
Return strictly raw JSON format:
{
  "places": [
    {
      "name": "Amber Fort",
      "category": "Historical Monument",
      "description": "Majestic hilltop fort with stunning mirror work and panoramic vistas.",
      "suggestedTime": "Morning"
    }
  ]
}`;

            const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json", 
                    Authorization: `Bearer ${activeKey}` 
                },
                body: JSON.stringify({
                    model: "openai/gpt-oss-120b",
                    messages: [{ role: "user", content: prompt }],
                    temperature: 0.3,
                }),
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData?.error?.message || "Groq API request failed");
            }

            const data = await res.json();
            const content = data?.choices?.[0]?.message?.content;
            const parsed = cleanAndParseJson(content);

            if (parsed.places?.length) {
                const placesRef = collection(db, `trips/${id}/places`);
                for (const item of parsed.places) {
                    await addDoc(placesRef, {
                        name: item.name,
                        category: item.category || "Sightseeing",
                        description: item.description || "",
                        suggestedTime: item.suggestedTime || "Flexible",
                        createdAt: new Date().toISOString(),
                        createdBy: currentUseruid,
                    });
                }
                setSnackbar({ open: true, message: `✨ Added ${parsed.places.length} famous places for ${destLocation}!` });
            }
        } catch (err) {
            console.error("Failed to generate AI places:", err);
            setSnackbar({ open: true, message: `Error: ${err.message}` });
        } finally {
            setIsGeneratingPlaces(false);
        }
    };

    const handleAddPlaceToTimeline = async (place) => {
        try {
            const eventData = {
                title: `Visit ${place.name}`,
                time: `${trip?.startDate || getCurrentDate()}T10:00`,
                note: place.description || `${place.category} in ${trip?.to || trip?.location}`,
                completed: false,
                createdBy: currentUseruid,
                createdAt: new Date().toISOString(),
                surprise: false,
                revealed: true,
                revealAt: null,
            };
            await addDoc(collection(db, `trips/${id}/timeline`), eventData);
            setSnackbar({ open: true, message: `Added "${place.name}" to Timeline!` });
        } catch (err) {
            console.error(err);
            setSnackbar({ open: true, message: "Failed to add to timeline." });
        }
    };

    const handleAddPlaceToChecklist = async (place) => {
        try {
            await addDoc(collection(db, `trips/${id}/checklist`), {
                text: `Explore ${place.name} (${place.category})`,
                completed: false,
            });
            setSnackbar({ open: true, message: `Added "${place.name}" to Checklist!` });
        } catch (err) {
            console.error(err);
            setSnackbar({ open: true, message: "Failed to add to checklist." });
        }
    };

    const handleDeletePlace = async (placeId) => {
        try {
            await deleteDoc(doc(db, `trips/${id}/places`, placeId));
            setSnackbar({ open: true, message: "Place removed." });
        } catch (err) {
            console.error(err);
        }
    };

    const handleGenerateAiTimeline = async () => {
        const activeKey = groqApiKey || process.env.REACT_APP_GROQ_API_KEY || "";
        if (!activeKey) {
            setSnackbar({ open: true, message: "Please save your Groq API Key in Profile -> AI Features." });
            return;
        }
        if (!trip?.from && !trip?.to && !trip?.location) {
            setSnackbar({ open: true, message: "Origin and Destination required to generate timeline." });
            return;
        }

        setIsGeneratingAiTimeline(true);
        try {
            let numDays = 3;
            if (trip?.startDate && trip?.endDate) {
                const diffTime = Math.abs(new Date(trip.endDate) - new Date(trip.startDate));
                numDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
            }

            const origin = trip.from || "Starting Point";
            const destination = trip.to || trip.location || trip.name || "Destination";

            const prompt = `Generate a ${numDays}-day travel itinerary timeline from "${origin}" to "${destination}" starting on "${trip.startDate || getCurrentDate()}" and ending on "${trip.endDate || "N/A"}".
Return strictly raw JSON format without conversational text:
{
  "timeline": [
    {
      "title": "Day 1 - Arrival & Check-in",
      "time": "${trip?.startDate || getCurrentDate()}T10:00",
      "note": "Arrive at ${destination}, check in to accommodation, explore surrounding area."
    }
  ]
}`;

            const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${activeKey}` },
                body: JSON.stringify({ model: "openai/gpt-oss-120b", messages: [{ role: "user", content: prompt }] }),
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData?.error?.message || "Groq request failed");
            }

            const data = await res.json();
            const content = data?.choices?.[0]?.message?.content;
            const parsed = cleanAndParseJson(content);

            if (parsed.timeline?.length) {
                const timelineRef = collection(db, `trips/${id}/timeline`);
                for (const item of parsed.timeline) {
                    await addDoc(timelineRef, {
                        title: item.title,
                        time: item.time || `${getCurrentDate()}T10:00`,
                        note: item.note || "",
                        completed: false,
                        createdBy: currentUseruid,
                        createdAt: new Date().toISOString(),
                        revealAt: null,
                        revealed: true,
                        surprise: false,
                    });
                }
                setSnackbar({ open: true, message: `✨ Generated ${parsed.timeline.length} timeline events!` });
            }
        } catch (err) {
            console.error("AI Timeline generation failed:", err);
            setSnackbar({ open: true, message: `Failed to generate AI Timeline: ${err.message}` });
        } finally {
            setIsGeneratingAiTimeline(false);
        }
    };

    const handleGenerateAiChecklist = async () => {
        const activeKey = groqApiKey || process.env.REACT_APP_GROQ_API_KEY || "";
        if (!activeKey) {
            setSnackbar({ open: true, message: "Please save your Groq API Key in Profile -> AI Features." });
            return;
        }

        setIsGeneratingAiChecklist(true);
        try {
            const dest = trip?.to || trip?.location || trip?.name || "Destination";
            const prompt = `Generate an essential travel packing and preparation checklist for a trip to "${dest}". Include essentials, clothing suitable for the destination, documents, and gear.
Return strictly raw JSON format without markdown preamble:
{
  "checklist": ["Government ID & Travel Tickets", "Phone Chargers & Power Bank", "Comfortable Walking Shoes", "Weather Appropriate Outfits", "First Aid Kit & Medications", "Toiletries & Sunscreen"]
}`;

            const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${activeKey}` },
                body: JSON.stringify({ model: "openai/gpt-oss-120b", messages: [{ role: "user", content: prompt }] }),
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData?.error?.message || "Groq request failed");
            }

            const data = await res.json();
            const content = data?.choices?.[0]?.message?.content;
            const parsed = cleanAndParseJson(content);

            if (parsed.checklist?.length) {
                const checklistRef = collection(db, `trips/${id}/checklist`);
                for (const textItem of parsed.checklist) {
                    await addDoc(checklistRef, { text: textItem, completed: false });
                }
                setSnackbar({ open: true, message: `✨ Added ${parsed.checklist.length} checklist items!` });
            }
        } catch (err) {
            console.error("AI Checklist generation failed:", err);
            setSnackbar({ open: true, message: `Failed to generate AI Checklist: ${err.message}` });
        } finally {
            setIsGeneratingAiChecklist(false);
        }
    };

    const loadMemberDetails = (uids) => {
        if (!Array.isArray(uids) || uids.length === 0) {
            setMemberDetails([]);
            return;
        }
        const unsubscribes = [];
        const membersMap = {};
        uids.forEach((uid) => {
            const userRef = doc(db, "users", uid);
            const unsub = onSnapshot(userRef, (snap) => {
                if (!snap.exists()) return;
                membersMap[uid] = { uid: snap.id, ...snap.data() };
                setMemberDetails(Object.values(membersMap));
            });
            unsubscribes.push(unsub);
        });
        return () => unsubscribes.forEach((u) => u());
    };

    const isTripAdmin = Boolean(
        currentUseruid &&
        (trip?.createdBy === currentUseruid || tripAdmins.includes(currentUseruid))
    );

    const canUserDo = (action) => {
        if (!currentUseruid) return false;
        if (isTripAdmin) return true;

        // The trip settings store this permission as `canEditTrip`.
        const permissionKey = action === "canEdit" ? "canEditTrip" : action;
        return tripPermissions[permissionKey] === "all";
    };

    const getMemberName = (uid) => {
        const member = memberDetails.find((m) => m.uid === uid);
        if (uid === currentUseruid) return `${member?.name || "You"} (Me)`;
        return member?.name || "Unknown";
    };

    const handleSaveEdit = async () => {
        if (!id) return;
        if (!canUserDo("canEdit")) {
            setSnackbar({ open: true, message: "Only trip admins can update trip details." });
            return;
        }
        try {
            const tripRef = doc(db, "trips", id);
            await updateDoc(tripRef, {
                name: editTrip.name,
                location: editTrip.location,
                startDate: editTrip.startDate,
                endDate: editTrip.endDate,
                from: editTrip.from || "",
                to: editTrip.to || "",
            });
            setTrip((prev) => ({ ...prev, ...editTrip }));
            setEditMode(false);
            setSnackbar({ open: true, message: "Trip updated successfully!" });
        } catch (err) {
            console.error(err);
            setSnackbar({ open: true, message: "Failed to save changes." });
        }
    };

    const handleDeleteTrip = async () => {
        try {
            setConfirmDeleteOpen(false);
            await deleteDoc(doc(db, "trips", id));
            await deleteDoc(doc(db, "groupChats", id)).catch(() => {});
            setSnackbar({ open: true, message: "Trip deleted successfully!" });
            setTimeout(() => navigate("/trips"), 800);
        } catch (err) {
            console.error(err);
            setSnackbar({ open: true, message: "Error deleting trip." });
        }
    };

    const toggleTask = async (task) => {
        try {
            await updateDoc(doc(db, `trips/${id}/checklist`, task.id), { completed: !task.completed });
        } catch (err) {
            console.error(err);
        }
    };

    const toggleEventCompleted = async (event) => {
        try {
            await updateDoc(doc(db, `trips/${id}/timeline`, event.id), { completed: !event.completed });
        } catch (err) {
            console.error(err);
        }
    };

    const goBack = () => navigate(-1);
    const inviteLink = `${window.location.origin}/join?trip=${id}`;
    const displayIconURL = groupChatIcon || trip?.iconURL || trip?.coverImage || "";

    const rightDrawerProps = {
        anchor: "right",
        sx: {
            "& .MuiDrawer-paper": {
                width: { xs: "100%", sm: 420, md: 460 },
                maxWidth: "100vw",
                boxSizing: "border-box",
                overflowX: "hidden",
            },
        },
    };

    // Filtered famous places for the interactive map modal
    const filteredMapPlaces = famousPlaces.filter(p => {
        const matchesQuery = p.name.toLowerCase().includes(mapSearchQuery.toLowerCase()) ||
                             (p.description && p.description.toLowerCase().includes(mapSearchQuery.toLowerCase()));
        if (mapCategoryFilter === "all") return matchesQuery;
        if (mapCategoryFilter === "hotel") return matchesQuery && (p.category?.toLowerCase().includes("hotel") || p.category?.toLowerCase().includes("stay"));
        if (mapCategoryFilter === "restaurant") return matchesQuery && (p.category?.toLowerCase().includes("restaurant") || p.category?.toLowerCase().includes("food") || p.category?.toLowerCase().includes("cafe"));
        if (mapCategoryFilter === "attraction") return matchesQuery && !(p.category?.toLowerCase().includes("hotel") || p.category?.toLowerCase().includes("restaurant"));
        return matchesQuery;
    });

    return (
        <Box
            sx={{
                color: mode === "dark" ? "#fff" : "#000",
                minHeight: "100vh",
                width: "100%",
                maxWidth: "100vw",
                overflowX: "clip",
                boxSizing: "border-box",
                "& *, & *::before, & *::after": { boxSizing: "border-box" },
                "& .MuiPaper-root": { minWidth: 0 },
                "& .MuiTypography-root": { overflowWrap: "anywhere" },
                "& .MuiButton-root": { maxWidth: "100%", touchAction: "manipulation" },
                "& img, & svg, & canvas": { maxWidth: "100%" },
            }}
        >
            {/* Top Navigation Controls */}
            <Box sx={{ position: "sticky", top: 40, zIndex: 20, py: 1, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 1, px: { xs: 1.5, sm: 2.5, md: 4 }, width: "100%" }}>
                <Button
                    onClick={goBack}
                    sx={{
                        borderRadius: 8,
                        color: mode === "dark" ? "#fff" : "#000",
                        backgroundColor: mode === "dark" ? { xs: "#ffffff15" , md: "#ffffff05" } : { xs: "#00000015" , md: "#00000005" },
                        boxShadow: mode === "dark" ? 'inset 0 1px 1px rgba(255, 255, 255, 0.11), 0 1px 4px rgba(0,0,0,0.1)' : 'inset 0 1px 1px rgba(0, 0, 0, 0.04), 0 1px 4px rgba(0, 0, 0, 0.02)',
                        backdropFilter: "blur(12px)",
                        py: 1,
                        px: 0.5,
                        minHeight: 44,
                        minWidth: 44,
                        width: 44,
                        p: 0,
                    }}
                >
                    <ArrowBackIcon />
                </Button>

                <Box
                    sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: { xs: 0.25, sm: 0.75 },
                        minHeight: 48,
                        color: mode === "dark" ? "#fff" : "#000",
                        backgroundColor: mode === "dark" ? { xs: "#ffffff15" , md: "#ffffff05" } : { xs: "#00000015" , md: "#00000005" },
                        boxShadow: mode === "dark" ? 'inset 0 1px 1px rgba(255, 255, 255, 0.11), 0 1px 4px rgba(0,0,0,0.1)' : 'inset 0 1px 1px rgba(0, 0, 0, 0.04), 0 1px 4px rgba(0, 0, 0, 0.02)',
                        backdropFilter: "blur(12px)",
                        border: "none",
                        borderRadius: 8,
                        p: 0.5,
                        flexShrink: 0,
                    }}
                >
                    <Button
                        aria-label="Share trip"
                        onClick={() => setShareDrawerOpen(true)}
                        sx={{
                            minWidth: 44, minHeight: 44, p: 1,
                            borderRadius: 8,
                            color: mode === "dark" ? "#fff" : "#000",
                            background: 'transparent',
                            border: "none",
                        }}
                    >
                        <ShareIcon />
                    </Button>

                    <Button
                        aria-label="Open trip group chat"
                        onClick={() => navigate(`/group/${id}`)}
                        sx={{
                            minWidth: 44, minHeight: 44, p: 1,
                            borderRadius: 8,
                            color: mode === "dark" ? "#fff" : "#000",
                            background: 'transparent',
                            border: "none",
                        }}
                    >
                        <GroupIcon />
                    </Button>

                    <Button
                        aria-label={currentUseruid === trip?.createdBy ? "Trip settings" : "Trip information"}
                        onClick={() => setSettingsDrawerOpen(true)}
                        sx={{
                            minWidth: 44, minHeight: 44, p: 1,
                            borderRadius: 8,
                            color: mode === "dark" ? "#fff" : "#000",
                            background: 'transparent',
                            border: "none",
                        }}
                    >
                        {currentUseruid === trip?.createdBy ? <SettingsIcon /> : <InfoIcon />}
                    </Button>
                </Box>
            </Box>

            {/* Mobile Hero Banner */}
            <Box
                sx={{
                    position: "sticky",
                    top: 0,
                    backgroundImage: displayIconURL ? `url(${displayIconURL})` : "none",
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    backgroundColor: mode === "dark" ? "#1d1d1d" : "#f0f0f0",
                    height: { xs: 440, sm: 380 },
                    boxShadow: "none",
                    borderBottomLeftRadius: 28,
                    borderBottomRightRadius: 28,
                    display: { xs: "flex", md: "none" },
                    alignItems: "flex-end",
                    justifyContent: "flex-start",
                    p: { xs: 2, sm: 3 },
                    mt: -8.5,
                }}
            >
                {weather && (
                    <Box
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            background: mode === "dark" ? "rgba(20, 20, 20, 0.15)" : "rgba(255, 255, 255, 0.25)",
                            borderRadius: 4,
                            width: "auto",
                            minWidth: 200,
                            py: 1,
                            px: 2,
                            backdropFilter: "blur(12px)",
                            boxShadow: 'inset 0 1px 1px rgba(255, 255, 255, 0.11), 0 1px 0px rgba(0,0,0,0.1)',
                            zIndex: 2,
                            mb: 2,
                        }}
                    >
                        <Box display="flex" alignItems="center" gap={1.2}>
                            <Box sx={{ fontSize: 26, opacity: 0.9 }}>
                                {weather.temp > 32 ? "🔥" : weather.temp < 10 ? "❄️" : weather.description?.includes("rain") ? "🌧️" : weather.description?.includes("cloud") ? "⛅" : "☀️"}
                            </Box>
                            <Box>
                                <Typography variant="subtitle1" fontWeight="700" sx={{ lineHeight: 1.1, color: mode === "dark" ? "#fff" : "#000" }}>
                                    {weather.temp ? `${Math.round(weather.temp)}°C` : "—"}
                                </Typography>
                                <Typography variant="caption" color="text.secondary" sx={{ textTransform: "capitalize" }}>
                                    {weather.description || "N/A"}
                                </Typography>
                            </Box>
                        </Box>
                        <Typography variant="caption" color="text.secondary" sx={{ textTransform: "uppercase", ml: 2, fontWeight: 700 }}>
                            in {trip?.location || "—"}
                        </Typography>
                    </Box>
                )}
            </Box>

            {/* ================= 3-COLUMN DESKTOP & RESPONSIVE CONTAINER ================= */}
            <Container maxWidth="xxl" sx={{ pt: { xs: 1, sm: 2, md: 3 }, pb: { xs: 4, sm: 6, md: 8 }, px: { xs: 0, sm: 2, md: 3, lg: 4 }, width: "100%", minWidth: 0 }}>
                <Box
                    sx={{
                        display: "flex",
                        flexDirection: { xs: "column", md: "column", lg: "row" },
                        gap: { xs: 1.5, sm: 2, lg: 1.5 },
                        alignItems: "stretch",
                        width: "100%",
                        minWidth: 0,
                        borderRadius: 8,
                        bgcolor: { xs: mode === "dark" ? "rgba(12, 12, 12, 0.71)" : "rgba(255,255,255,0.6)", md: "transparent" },
                        backdropFilter: { xs: "blur(12px)", md: "none" },
                        p: { xs: 0, sm: 0.5, lg: 1 },
                        pt: { xs: 0, sm: 0.5, lg: 2},
                    }}
                >
                    
                    {/* ================= 1. LEFT SECTION: Trip Image, Details, Shared Links & Maps ================= */}
                    <Box
                      sx={{
                          flex: { xs: "1 1 100%", lg: "0 0 35%" },
                          minWidth: 0,
                          minHeight: 0,
                          display: "flex",
                          flexDirection: "column",
                          gap: 2.5,
                          p: { xs: 2, md: 2, lg: 1.5 },
                          width: "100%",
                          boxSizing: "border-box",

                          // Sticky only when the desktop layout switches to columns
                          position: { xs: "relative", lg: "sticky" },
                          top: { xs: "auto", lg: 88 },
                          alignSelf: { xs: "stretch", lg: "flex-start" },
                          height: { xs: "auto", lg: "fit-content" },
                          maxHeight: { xs: "none", lg: "calc(100vh - 104px)" },

                          // Allows the left section to scroll if its content exceeds the viewport
                          overflowY: { xs: "visible", lg: "auto" },
                          overflowX: "hidden",

                          // Hide scrollbar while retaining scrolling
                          scrollbarWidth: "none",
                          "&::-webkit-scrollbar": {
                              display: "none",
                          },
                      }}
                    >
                        {/* Trip Image Banner */}
                        <Box
                            sx={{
                                position: "relative",
                                backgroundImage: displayIconURL ? `url(${displayIconURL})` : "none",
                                backgroundSize: "cover",
                                backgroundRepeat: "no-repeat",
                                backgroundPosition: "center",
                                backgroundColor: mode === "dark" ? "#1d1d1d" : "#f5f5f5",
                                height: { xs: 220, md: 220 },
                                display: { xs: "none", md: "flex" },
                                alignItems: "flex-end",
                                p: 2,
                                borderRadius: 6,
                                border: "0px solid",
                                borderColor: mode === "dark" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)",
                                overflow: "hidden",
                            }}
                        >

                {weather && (
                    <Box
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            background: mode === "dark" ? "rgba(20, 20, 20, 0.15)" : "rgba(255, 255, 255, 0.25)",
                            borderRadius: 4,
                            width: "auto",
                            minWidth: 200,
                            py: 1,
                            px: 1,
                            backdropFilter: "blur(12px)",
                            boxShadow: mode === "dark" ? 'inset 0 1px 1px rgba(255, 255, 255, 0.11), 0 1px 4px rgba(0,0,0,0.1)' : 'inset 0 1px 2px rgba(0, 0, 0, 0.11), 0 1px 4px rgba(0, 0, 0, 0.06)',
                            zIndex: 2,
                            mb: 0,
                        }}
                    >
                        <Box display="flex" alignItems="center" gap={1.2}>
                            <Box sx={{ fontSize: 38, opacity: 0.9 }}>
                                {weather.temp > 32 ? "🔥" : weather.temp < 10 ? "❄️" : weather.description?.includes("rain") ? "🌧️" : weather.description?.includes("cloud") ? "⛅" : "☀️"}
                            </Box>
                            <Box>
                                <Typography variant="subtitle1" fontWeight="700" sx={{ lineHeight: 1.1, color: mode === "dark" ? "#fff" : "#000" }}>
                                    {weather.temp ? `${Math.round(weather.temp)}°C` : "—"}
                                </Typography>
                                <Typography variant="caption" color="text.secondary" sx={{ textTransform: "capitalize" }}>
                                    {weather.description || "N/A"}
                                </Typography>
                            </Box>
                        </Box>
                        <Typography variant="caption" color="text.secondary" sx={{ textTransform: "uppercase", ml: 2, fontWeight: 700 }}>
                            in {trip?.location || "—"}
                        </Typography>
                    </Box>
                )}
                        </Box>

                        {/* Trip Details Card */}
{/* Trip Details Card */}
                        <Paper
                            elevation={0}
                            sx={{
                                p: { xs: 1, sm: 1.5, md: 2 },
                                pt: 2,
                                borderRadius: { xs: 4, sm: 5 },
                                minWidth: 0,
                                bgcolor: 'transparent',
                                border: "0px solid",
                            }}
                        >
                            <Box display="flex" alignItems="center" justifyContent="space-between" mb={1.5}>
                                {editMode ? (
                                    <TextField
                                        value={editTrip.name || ""}
                                        onChange={(e) => setEditTrip({ ...editTrip, name: e.target.value })}
                                        fullWidth
                                        variant="outlined"
                                        size="small"
                                        placeholder="Trip Name"
                                        sx={{ mr: 1.5, ...glassInputSx(mode), "& .MuiInputBase-input": { fontSize: "1.25rem", fontWeight: 800 } }}
                                    />
                                ) : (
                                    <Typography variant="h4" fontWeight={800} sx={{ letterSpacing: "-0.5px" }}>
                                        {trip?.name}
                                    </Typography>
                                )}
                                {canUserDo("canEdit") && (
                                    <IconButton
                                        aria-label={editMode ? "Close trip details editing" : "Edit trip details"}
                                        onClick={() => {
                                            if (!editMode) setEditTrip(trip || {});
                                            setEditMode((current) => !current);
                                        }}
                                        size="small"
                                        sx={{
                                            bgcolor: mode === "dark" ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
                                            color: "text.secondary",
                                            "&:hover": {
                                                bgcolor: mode === "dark" ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)",
                                                color: "text.primary",
                                            },
                                        }}
                                    >
                                        <Edit fontSize="small" />
                                    </IconButton>
                                )}
                            </Box>

                            {editMode ? (
                                <TextField
                                    value={editTrip.location || ""}
                                    onChange={(e) => setEditTrip({ ...editTrip, location: e.target.value })}
                                    variant="outlined"
                                    size="small"
                                    fullWidth
                                    placeholder="Location"
                                    sx={{ mb: 2, ...glassInputSx(mode) }}
                                />
                            ) : (
                                <Typography variant="body2" color="text.secondary" sx={{ display: "flex", alignItems: "center", mb: 1.5, fontWeight: 600 }}>
                                    <LocationOn sx={{ fontSize: 16, mr: 0.5, color: "primary.main" }} /> {trip?.location || "Location not set"}
                                </Typography>
                            )}

                            {trip?.description && !editMode && (
                                <Typography variant="body2" sx={{ opacity: 0.85, mb: 2, lineHeight: 1.5 }}>
                                    {trip.description}
                                </Typography>
                            )}

                            {editMode ? (
                                <Box display="flex" gap={1.5} mt={2} mb={2.5}>
                                    <TextField
                                        type="date"
                                        label="Start Date"
                                        InputLabelProps={{ shrink: true }}
                                        value={editTrip.startDate || ""}
                                        onChange={(e) => setEditTrip({ ...editTrip, startDate: e.target.value })}
                                        size="small"
                                        fullWidth
                                        sx={glassInputSx(mode)}
                                    />
                                    <TextField
                                        type="date"
                                        label="End Date"
                                        InputLabelProps={{ shrink: true }}
                                        value={editTrip.endDate || ""}
                                        onChange={(e) => setEditTrip({ ...editTrip, endDate: e.target.value })}
                                        size="small"
                                        fullWidth
                                        sx={glassInputSx(mode)}
                                    />
                                </Box>
                            ) : (
                                <Typography variant="caption" color="text.secondary" sx={{ display: "flex", alignItems: "center", mb: 0, fontWeight: 600 }}>
                                    <AccessTime sx={{ fontSize: 14, mr: 0.5, color: "primary.main" }} />
                                    {formatTripDateRange(trip?.startDate, trip?.endDate)}
                                </Typography>
                            )}

                            {editMode && (
                                <Button
                                    variant="contained"
                                    onClick={handleSaveEdit}
                                    fullWidth
                                    sx={{
                                        mt: 1,
                                        py: 1.2,
                                        backgroundColor: mode === "dark" ? "#fff" : "#000",
                                        color: mode === "dark" ? "#000" : "#fff",
                                        borderRadius: 8,
                                        fontWeight: 700,
                                        boxShadow: "none",
                                        "&:hover": {
                                            boxShadow: "none",
                                            backgroundColor: mode === "dark" ? "rgba(255,255,255,0.9)" : "rgba(0,0,0,0.85)",
                                        },
                                        transition: "all 0.2s ease",
                                    }}
                                >
                                    Save Changes
                                </Button>
                            )}
                        </Paper>


                        {/* Shared Links Section */}
<Paper elevation={0} sx={{ p: { xs: 1.5, sm: 2 }, borderRadius: { xs: 3, sm: 4 }, minWidth: 0, bgcolor: "transparent", border: "none" }}>
                            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
                                <Typography variant="subtitle2" fontWeight="bold">Shared Links</Typography>
                                <Button size="small" variant="outlined" onClick={() => setLinkDrawerOpen(true)}
                                    sx={{ 
                                        borderRadius: 6, 
                                        fontSize: "0.7rem", 
                                        textTransform: "none",
                                        color: mode === "dark" ? "#fff" : "#000",
                                        backgroundColor: mode === "dark" ? "#ffffff07" : "#00000007",
                                        boxShadow: mode === "dark" ? 'inset 0 1px 1px rgba(255, 255, 255, 0.11), 0 1px 4px rgba(0,0,0,0.1)' : 'inset 0 1px 1px rgba(0, 0, 0, 0.11), 0 1px 4px rgba(0, 0, 0, 0.07)',
                                        backdropFilter: "blur(12px)",
                                        border: "none",
                                    }}
                                >
                                    + Add Link
                                </Button>
                            </Box>

                            {tripLinks.length === 0 ? (
                                <Typography variant="caption" color="text.secondary" sx={{ display: "block", textAlign: "center", py: 2 }}>No links shared yet.</Typography>
                            ) : displaySettings?.layout === "grid" ? (
                                /* Grid View respecting gridCols from displaySettings */
                                <Box
                                    sx={{
                                        display: "grid",
                                        gridTemplateColumns: `repeat(${displaySettings.gridCols || 2}, minmax(0, 1fr))`,
                                        gap: 1.5,
                                        maxHeight: 260,
                                        overflowY: "auto",
                                        pr: 0.5,
                                    }}
                                >
                                    {tripLinks.map((link) => {
                                        const lowerUrl = (link.url || "").toLowerCase();
                                        const isYoutube = lowerUrl.includes("youtube.com") || lowerUrl.includes("youtu.be");
                                        const isMaps = lowerUrl.includes("maps.google.com") || lowerUrl.includes("goo.gl/maps");
                                        const isDrive = lowerUrl.includes("drive.google.com");

                                        return (

<Paper
    key={link.id}
    elevation={0}
    component="a"
    href={link.url}
    target="_blank"
    rel="noopener noreferrer"
    sx={{
        boxSizing: "border-box",
        p: { xs: 1.5, sm: 2 },
        borderRadius: 6,
        width: { xs: 130, sm: 150, md: 160 },
        minWidth: 0,
        flex: "0 0 auto",
        overflow: "hidden",

        border: "0px solid",

        bgcolor: mode === "dark"
            ? "rgba(255,255,255,0.03)"
            : "rgba(255,255,255,0.8)",

        textDecoration: "none",
        color: "inherit",

        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
        gap: 1,

        transition: "all 0.2s ease, border-color 0.2s ease",

        "&:hover": {
            borderColor: "primary.main",
            bgcolor: mode === "dark"
            ? "rgba(255,255,255,0.07)"
            : "rgba(0, 0, 0, 0.06)",
        },

        "&:focus-visible": {
            outline: "1px solid",
            outlineColor: "primary.main",
            outlineOffset: 2,
        },
    }}
>
    <Box
        sx={{
            width: 44,
            height: 44,
            flexShrink: 0,
            display: "grid",
            placeItems: "center",
            fontSize: "2rem",
            borderRadius: 2,
        }}
    >
        {isYoutube ? "▶️" : isMaps ? "🗺️" : isDrive ? "📁" : "🔗"}
    </Box>

    <Typography
        variant="subtitle2"
        color="text.primary"
        sx={{
            width: "100%",
            minWidth: 0,
            fontSize: "0.82rem",
            fontWeight: 600,
            textAlign: "center",
            overflowWrap: "anywhere",
            display: "-webkit-box",
            WebkitBoxOrient: "vertical",
            WebkitLineClamp: 2,
            overflow: "hidden",
            lineHeight: 1.35,
        }}
    >
        {link.title || "Shared link"}
    </Typography>

    <Typography
        variant="caption"
        color="text.secondary"
        sx={{
            width: "100%",
            minWidth: 0,
            fontSize: "0.68rem",
            opacity: 0.8,
            textAlign: "center",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
        }}
        title={link.url}
    >
        {link.url}
    </Typography>
</Paper>

                                        );
                                    })}
                                </Box>
                            ) : (
                                /* List View */
                                <List dense sx={{ maxHeight: 200, overflowY: "auto", pr: 0.5 }}>
                                    {tripLinks.map((link) => {
                                        const lowerUrl = (link.url || "").toLowerCase();
                                        const isYoutube = lowerUrl.includes("youtube.com") || lowerUrl.includes("youtu.be");
                                        const isMaps = lowerUrl.includes("maps.google.com") || lowerUrl.includes("goo.gl/maps");
                                        const isDrive = lowerUrl.includes("drive.google.com");

                                        return (
                                            <ListItem
                                                key={link.id}
                                                component="a"
                                                href={link.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                disableGutters
                                                sx={{
                                                    py: 1,
                                                    px: 1.5,
                                                    mb: 1,
                                                    borderRadius: 5,
                                                    border: "0px solid",
                                                    bgcolor: mode === "dark" ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.8)",
                                                    textDecoration: "none",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: 1.5,
                                                    "&:hover": {
                                                        bgcolor: mode === "dark" ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.03)",
                                                    },
                                                }}
                                            >
                                                <Box sx={{ width: 32, height: 32, borderRadius: 2, display: "grid", placeItems: "center", bgcolor: "action.hover", flexShrink: 0 }}>
                                                    {isYoutube ? "▶️" : isMaps ? "🗺️" : isDrive ? "📁" : "🔗"}
                                                </Box>
                                                <ListItemText
                                                    primary={
                                                        <Typography variant="body2" fontWeight={700} color="text.primary" sx={{ fontSize: "0.85rem" }}>
                                                            {link.title}
                                                        </Typography>
                                                    }
                                                    secondary={
                                                        <Typography variant="caption" color="text.secondary" noWrap display="block" sx={{ fontSize: "0.75rem" }}>
                                                            {link.url}
                                                        </Typography>
                                                    }
                                                />
                                            </ListItem>
                                        );
                                    })}
                                </List>
                            )}
                        </Paper>

                        {/* Interactive Route Map with Enlarger Button mobile */}
                        {(trip?.from || trip?.to) && (
                            <Paper elevation={0} sx={{ p: { xs: 1.5, sm: 2 }, display: { xs: "block", md: "none" }, borderRadius: { xs: 3, sm: 4 }, minWidth: 0, bgcolor: "transparent", border: "none", position: "relative" }}>
                                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                                    <Typography variant="subtitle2" fontWeight="bold" sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                                        <DirectionsIcon fontSize="small" /> Route & Map
                                    </Typography>
                                </Box>
                                <Box sx={{ cursor: "pointer" }} onClick={() => setMapModalOpen(true)}>
                                    <RouteMap
                                        from={trip?.from || "Current Location"}
                                        to={trip?.to || trip?.location || "Destination"}
                                        waypoints={famousPlaces}
                                        mode={mode}
                                    />
                                </Box>
                            </Paper>
                        )}

                        {/* Members Section desktop */}
                        <Paper elevation={0} sx={{ p: { xs: 1.5, sm: 2, md: 2.5 }, display: { xs: "none", md: "block" }, borderRadius: { xs: 3, sm: 4 }, minWidth: 0, bgcolor: "transparent", border: "none" }}>
<MembersSection
    memberDetails={memberDetails}
    setShareDrawerOpen={setShareDrawerOpen}
    currentUseruid={currentUseruid}
    trip={trip}
    tripAdmins={tripAdmins}
    userData={userData}
    navigate={navigate}
    mode={mode}
/>
                        </Paper>
                    </Box>


                    {/* ================= 2. MIDDLE SECTION: Budget, Expenses, Checklist(on mobile) & AI Recommendations, Timeline, Members(on desktop) ================= */}
                    <Box
                        sx={{
                            flex: { xs: "1 1 100%", lg: "1 1 35%" },
                            minWidth: 0,
                            display: "flex",
                            flexDirection: "column",
                            gap: 3,
                            p: { xs: 2, md: 2 },
                            width: "100%",
                        }}
                    >
                      

                        {/* Interactive Route Map with Enlarger Button mobile */}
                        {(trip?.from || trip?.to) && (
                            <Paper elevation={0} sx={{ p: { xs: 1.5, sm: 2 }, display: { xs: "none", md: "block" }, borderRadius: { xs: 3, sm: 4 }, minWidth: 0, bgcolor: "transparent", border: "none", position: "relative" }}>
                                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                                    <Typography variant="subtitle2" fontWeight="bold" 
                                    sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                                        <DirectionsIcon fontSize="small" /> Route & Map
                                    </Typography>
                                </Box>
                                <Box sx={{ cursor: "pointer" }} onClick={() => setMapModalOpen(true)}>
                                    <RouteMap
                                        from={trip?.from || "Current Location"}
                                        to={trip?.to || trip?.location || "Destination"}
                                        waypoints={famousPlaces}
                                        mode={mode}
                                    />
                                </Box>
                            </Paper>
                        )}

                        {/* Budget & Expenses Section mobile */}
                        <Paper elevation={0} sx={{ p: { xs: 1.5, sm: 2, md: 2.5 }, display: { xs: "block", md: "none" }, borderRadius: { xs: 3, sm: 4 }, minWidth: 0, bgcolor: "transparent", border: "none" }}>
<BudgetExpensesSection
        numericBudget={numericBudget}
        totalSpent={totalSpent}
        normalizedContributors={normalizedContributors}
        rawExpenses={rawExpenses}
        formatCurrency={formatCurrency}
        setBudgetDrawerOpen={setBudgetDrawerOpen}
        setExpenseDrawerOpen={setExpenseDrawerOpen}
        mode={mode}
        currentUserId={currentUseruid}
        userData={userData}
    />
                        </Paper>

                        {/* Trip AI Recommendations in Vertical Scroll */}
                        <Paper elevation={0} sx={{ p: { xs: 1.5, sm: 2, md: 2.5 }, borderRadius: { xs: 3, sm: 4 }, minWidth: 0, bgcolor: "transparent", border: "none" }}>
                            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
                                <Typography variant="subtitle1" fontWeight="bold" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                    <ExploreIcon sx={{ color: mode === "dark" ? "#fff" : "#000" }} /> AI Recommendations
                                </Typography>
                                <Button
                                    variant="outlined"
                                    size="small"
                                    onClick={handleGenerateAiPlaces}
                                    disabled={isGeneratingPlaces}
                                    startIcon={isGeneratingPlaces ? <CircularProgress size={12} /> : <AutoAwesomeIcon sx={{ color: mode === "dark" ? "#fff" : "#000" }} />}
                                    sx={{ borderRadius: 8, fontSize: "0.7rem", textTransform: "none", fontWeight: 700, 
                                    color: mode === "dark" ? "#fff" : "#000",
                                    backgroundColor: mode === "dark" ? "#ffffff07" : "#00000007",
                                    boxShadow: mode === "dark" ? 'inset 0 1px 1px rgba(255, 255, 255, 0.11), 0 1px 4px rgba(0,0,0,0.1)' : 'inset 0 1px 1px rgba(0, 0, 0, 0.11), 0 1px 4px rgba(0, 0, 0, 0.07)',
                                    backdropFilter: "blur(12px)",
                                    border: "none", }}
                                >
                                    {isGeneratingPlaces ? "Finding..." : "Discover"}
                                </Button>
                            </Box>

                            {/* Vertical Scroll for AI Recommendations */}
                            <Box
                                sx={{
                                    display: "flex",
                                    flexDirection: "row",
                                    gap: 1.5,
                                    maxHeight: 'fit-content',
                                    maxWidth: "100%",
                                    borderRadius: 6,
                                    overflowX: "auto",
                                    WebkitOverflowScrolling: "touch",
                                    pb: 1,
                                    pr: 0.5,
                                    scrollbarWidth: "thin",
                                    "&::-webkit-scrollbar": { height: "6px" },
                                    "&::-webkit-scrollbar-thumb": { backgroundColor: "rgba(0,0,0,0.2)", borderRadius: "3px" },
                                }}
                            >
                                {famousPlaces.length === 0 ? (
                                    <Typography variant="body2" color="text.secondary" sx={{ py: 3, textAlign: "center", fontStyle: "italic", width: "100%" }}>
                                        No recommendations yet. Click <b>"✨ Discover"</b> for local top spots!
                                    </Typography>
                                ) : (
                                    famousPlaces.map((place) => (
                                        <Paper
                                            key={place.id}
                                            elevation={0}
                                            sx={{
                                                p: 1.5,
                                                width: 240,
                                                minWidth: 240,
                                                flexShrink: 0,
                                                borderRadius: 6,
                                                border: "1px solid divider",
                                                bgcolor: mode === "dark" ? "rgba(30,30,30,0.6)" : "rgba(255,255,255,0.9)",
                                                display: "flex",
                                                flexDirection: "column",
                                                justifyContent: "space-between",
                                            }}
                                        >
                                            <Box>
                                                <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={0.5}>
                                                    <Typography variant="subtitle2" fontWeight={700} noWrap sx={{ maxWidth: 180 }}>
                                                        {place.name}
                                                    </Typography>
                                                    <IconButton size="small" color="error" onClick={() => handleDeletePlace(place.id)}
                                                      sx={{ borderRadius: 6, fontSize: "0.65rem", textTransform: "none", bgcolor: "#ff000018", boxShadow: 'none' }}>
                                                        <DeleteIcon sx={{ fontSize: 16 }} />
                                                    </IconButton>
                                                </Box>
                                                <Stack direction="row" spacing={1} mb={1} flexWrap="wrap">
                                                    <Chip label={place.category} size="small" sx={{  bgcolor: mode === "dark" ? "#ffffff18" : "#00000010", color: mode === "dark" ? "#fff" : "#000", fontSize: "0.6rem", height: 20 }} />
                                                    {place.suggestedTime && (
                                                        <Chip label={formatTimestampOrDate(place.suggestedTime)} size="small" sx={{ fontSize: "0.6rem", height: 20,  bgcolor: mode === "dark" ? "#ffffff18" : "#00000010", color: mode === "dark" ? "#fff" : "#000" }} />
                                                    )}
                                                </Stack>
                                                <Typography variant="caption" color="text.secondary" display="block" mb={1.5} sx={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                                                    {place.description}
                                                </Typography>
                                            </Box>
                                            <Box display="flex" gap={1}>
                                                <Button size="small" variant="contained" onClick={() => handleAddPlaceToTimeline(place)} 
                                                sx={{ borderRadius: 6, fontSize: "0.65rem", textTransform: "none", flex: 1, bgcolor: mode === "dark" ? "#ffffff18" : "#00000010", color: mode === "dark" ? "#fff" : "#000", boxShadow: 'none' }}>
                                                    + Timeline
                                                </Button>
                                                <Button size="small" variant="contained" onClick={() => handleAddPlaceToChecklist(place)} 
                                                sx={{ borderRadius: 6, fontSize: "0.65rem", textTransform: "none", flex: 1, bgcolor: mode === "dark" ? "#ffffff18" : "#00000010", color: mode === "dark" ? "#fff" : "#000", boxShadow: 'none' }}>
                                                    + Checklist
                                                </Button>
                                            </Box>
                                        </Paper>
                                    ))
                                )}
                            </Box>
                        </Paper>

                        {/* Trip Timeline Widget */}
                        <Paper elevation={0} sx={{ p: { xs: 1.5, sm: 2, md: 2.5 }, borderRadius: { xs: 3, sm: 4 }, minWidth: 0, bgcolor: "transparent", border: "none" }}>
                            <Box sx={{ display: "flex", flexWrap: "wrap", rowGap: 1, columnGap: 1, alignItems: "center", justifyContent: "space-between", mb: 1.5 }}>
                                <Typography variant="subtitle1" fontWeight="bold" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                    <EventNoteIcon fontSize="small" /> Trip Timeline
                                </Typography>
                                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75, maxWidth: "100%" }}>
                                    <Button variant="outlined" size="small" onClick={handleGenerateAiTimeline} disabled={isGeneratingAiTimeline} startIcon={isGeneratingAiTimeline ? <CircularProgress size={12} /> : <AutoAwesomeIcon sx={{ color: mode === "dark" ? "#fff" : "#000" }} />} 
                                    sx={{ borderRadius: 8, fontSize: "0.7rem", textTransform: "none", 
                                    color: mode === "dark" ? "#fff" : "#000",
                                    backgroundColor: mode === "dark" ? "#ffffff07" : "#00000007",
                                    boxShadow: mode === "dark" ? 'inset 0 1px 1px rgba(255, 255, 255, 0.11), 0 1px 4px rgba(0,0,0,0.1)' : 'inset 0 1px 1px rgba(0, 0, 0, 0.11), 0 1px 4px rgba(0, 0, 0, 0.07)',
                                    backdropFilter: "blur(12px)",
                                    border: "none", }}>
                                        {isGeneratingAiTimeline ? "..." : "AI"}
                                    </Button>
                                    <Button variant="outlined" size="small" onClick={() => setTimelineDrawerOpen(true)} 
                                    sx={{ borderRadius: 8, fontSize: "0.75rem", textTransform: "none",
                                    color: mode === "dark" ? "#fff" : "#000",
                                    backgroundColor: mode === "dark" ? "#ffffff07" : "#00000007",
                                    boxShadow: mode === "dark" ? 'inset 0 1px 1px rgba(255, 255, 255, 0.11), 0 1px 4px rgba(0,0,0,0.1)' : 'inset 0 1px 1px rgba(0, 0, 0, 0.11), 0 1px 4px rgba(0, 0, 0, 0.07)',
                                    backdropFilter: "blur(12px)",
                                    border: "none", }}>
                                        + Add
                                    </Button>
                                </Box>
                            </Box>
<List sx={{ p: 0, m: 0, overflow: "hidden" }}>
    {timeline.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ py: 1, textAlign: "center" }}>No timeline events added yet.</Typography>
    ) : (
        timeline
            .slice(-7)
            .reverse()
            .filter((_, idx) => (window.innerWidth < 900 ? idx < 4 : true))
            .map((item) => (
                <ListItem key={item.id} sx={{ bgcolor: mode === "dark" ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)", borderRadius: 6, mb: 1, py: 0.5, px: 1 }}>
                    <ListItemIcon sx={{ minWidth: 32 }}>
                        <Checkbox checked={item.completed} onChange={() => toggleEventCompleted(item)} size="small" />
                    </ListItemIcon>
                    <ListItemText
                        primary={<Typography variant="body2" fontWeight={600}>{typeof item.title === "object" ? JSON.stringify(item.title) : item.title}</Typography>}
                        secondary={<Typography variant="caption" color="text.secondary">{formatEventTime(item.time)}</Typography>}
                    />
                </ListItem>
            ))
    )}
</List>
                            {timeline.length > 0 && (
                                <Button size="small" fullWidth onClick={() => setTimelineAllDrawerOpen(true)} 
                                sx={{ mt: 1, py: 1, borderRadius: 8, textTransform: "none",
                                    color: mode === "dark" ? "#fff" : "#000",
                                    backgroundColor: mode === "dark" ? "#ffffff07" : "#00000007",
                                    boxShadow: mode === "dark" ? 'inset 0 1px 4px rgba(255, 255, 255, 0.11), inset 0 -1px 2px rgba(255, 255, 255, 0.01), 0 1px 4px rgba(0,0,0,0.1)' : 'inset 0 1px 6px rgba(0, 0, 0, 0.11), inset 0 -1px 2px rgba(0, 0, 0, 0.02), 0 1px 4px rgba(0, 0, 0, 0.07)',
                                    backdropFilter: "blur(2px)",
                                    border: "none", }}>
                                    View All Timelines
                                </Button>
                            )}
                        </Paper>

                        {/* Checklist Section */}
                        <Paper elevation={0} sx={{ p: { xs: 1.5, sm: 2, md: 2.5 }, borderRadius: { xs: 3, sm: 4 }, minWidth: 0, bgcolor: "transparent", border: "none" }}>
                            <Box sx={{ display: "flex", flexWrap: "wrap", rowGap: 1, columnGap: 1, alignItems: "center", justifyContent: "space-between", mb: 1.5 }}>
                                <Typography variant="subtitle1" fontWeight="bold" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                    <PlaylistAddCheckIcon fontSize="small" /> Checklist
                                </Typography>
                                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75, maxWidth: "100%" }}>
                                    <Button variant="outlined" size="small" onClick={handleGenerateAiChecklist} disabled={isGeneratingAiChecklist} startIcon={isGeneratingAiChecklist ? <CircularProgress size={12} /> : <AutoAwesomeIcon sx={{ color: mode === "dark" ? "#fff" : "#000" }} />} 
                                    sx={{ borderRadius: 8, fontSize: "0.7rem", textTransform: "none",
                                    color: mode === "dark" ? "#fff" : "#000",
                                    backgroundColor: mode === "dark" ? "#ffffff07" : "#00000007",
                                    boxShadow: mode === "dark" ? 'inset 0 1px 1px rgba(255, 255, 255, 0.11), 0 1px 4px rgba(0,0,0,0.1)' : 'inset 0 1px 1px rgba(0, 0, 0, 0.11), 0 1px 4px rgba(0, 0, 0, 0.07)',
                                    backdropFilter: "blur(12px)",
                                    border: "none", }}>
                                        {isGeneratingAiChecklist ? "..." : "AI"}
                                    </Button>
                                    <Button variant="outlined" size="small" onClick={() => setChecklistDrawerOpen(true)} 
                                    sx={{ borderRadius: 8, fontSize: "0.75rem", textTransform: "none",
                                    color: mode === "dark" ? "#fff" : "#000",
                                    backgroundColor: mode === "dark" ? "#ffffff07" : "#00000007",
                                    boxShadow: mode === "dark" ? 'inset 0 1px 1px rgba(255, 255, 255, 0.11), 0 1px 4px rgba(0,0,0,0.1)' : 'inset 0 1px 1px rgba(0, 0, 0, 0.11), 0 1px 4px rgba(0, 0, 0, 0.07)',
                                    backdropFilter: "blur(12px)",
                                    border: "none", }}>
                                        + Add
                                    </Button>
                                </Box>
                            </Box>
<List sx={{ p: 0, m: 0, overflow: "hidden" }}>
    {checklist.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ py: 1, textAlign: "center" }}>No checklist items yet.</Typography>
    ) : (
        checklist
            .slice(-7)
            .reverse()
            .filter((_, idx) => (window.innerWidth < 900 ? idx < 4 : true))
            .map((task) => (
                <ListItem key={task.id} onClick={() => toggleTask(task)} disableGutters sx={{ mb: 0.5, cursor: "pointer" }}>
                    <ListItemIcon sx={{ minWidth: 32 }}>
                        <Checkbox checked={task.completed} onChange={() => toggleTask(task)} color="success" size="small" />
                    </ListItemIcon>
                    <ListItemText primary={<Typography variant="body2" sx={{ textDecoration: task.completed ? "line-through" : "none", color: task.completed ? "text.secondary" : "inherit" }}>{task.text}</Typography>} />
                </ListItem>
            ))
    )}
</List>
                            {checklist.length > 0 && (
                                <Button size="small" fullWidth onClick={() => setChecklistViewAllOpen(true)} 
                                sx={{ mt: 1, py: 1, borderRadius: 8, textTransform: "none",
                                    color: mode === "dark" ? "#fff" : "#000",
                                    backgroundColor: mode === "dark" ? "#ffffff07" : "#00000007",
                                    boxShadow: mode === "dark" ? 'inset 0 1px 4px rgba(255, 255, 255, 0.11), inset 0 -1px 2px rgba(255, 255, 255, 0.01), 0 1px 4px rgba(0,0,0,0.1)' : 'inset 0 1px 6px rgba(0, 0, 0, 0.11), inset 0 -1px 2px rgba(0, 0, 0, 0.02), 0 1px 4px rgba(0, 0, 0, 0.07)',
                                    backdropFilter: "blur(12px)",
                                    border: "none", }}>
                                    View All Checklist Items
                                </Button>
                            )}
                        </Paper>
                    </Box>


                    {/* ================= 3. RIGHT SECTION: Budget, Expenses, Checklist(on desktop) ================= */}
                    <Box
                        sx={{
                            flex: { xs: "1 1 100%", lg: "1 1 30%" },
                            minWidth: 0,
                            display: "flex",
                            flexDirection: "column",
                            gap: 3,
                            p: { xs: 2, md: 2 },
                            width: "100%",
                        }}
                    >
                      
                        {/* Budget & Expenses Section desktop */}
                        <Paper elevation={0} sx={{ p: { xs: 1.5, sm: 2, md: 2.5 }, display: { xs: "none", md: "block" }, borderRadius: { xs: 3, sm: 4 }, minWidth: 0, bgcolor: "transparent", border: "none" }}>
<BudgetExpensesSection
        numericBudget={numericBudget}
        totalSpent={totalSpent}
        normalizedContributors={normalizedContributors}
        rawExpenses={rawExpenses}
        formatCurrency={formatCurrency}
        setBudgetDrawerOpen={setBudgetDrawerOpen}
        setExpenseDrawerOpen={setExpenseDrawerOpen}
        mode={mode}
        currentUserId={currentUseruid}
        userData={userData}
    />
                        </Paper>

                        {/* Members Section mobile */}
                        <Paper elevation={0} sx={{ p: { xs: 1.5, sm: 2, md: 2.5 }, display: { xs: "block", md: "none" }, borderRadius: { xs: 3, sm: 4 }, minWidth: 0, bgcolor: "transparent", border: "none" }}>
<MembersSection
    memberDetails={memberDetails}
    setShareDrawerOpen={setShareDrawerOpen}
    currentUseruid={currentUseruid}
    trip={trip}
    tripAdmins={tripAdmins}
    userData={userData}
    navigate={navigate}
    mode={mode}
/>
                        </Paper>
                    </Box>

                </Box>
            </Container>

            {/* ================= FULLSCREEN ENLARGED MAP OVERLAY WITH SEARCH & FILTERS ================= */}
            <Modal
                open={mapModalOpen}
                onClose={() => setMapModalOpen(false)}
                closeAfterTransition
                sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    p: { xs: 0, sm: 1.5, md: 4 },
                    overflow: "hidden",
                }}
            >
                <Fade in={mapModalOpen}>
                    <Box
                        sx={{
                            width: { xs: "100%", sm: "96vw", md: "90vw" },
                            height: { xs: "100dvh", sm: "92dvh", md: "88dvh" },
                            maxWidth: "100%",
                            maxHeight: "100%",
                            bgcolor: mode === "dark" ? "#121212" : "#ffffff",
                            borderRadius: { xs: 0, md: 4 },
                            boxShadow: 24,
                            overflow: "hidden",
                            display: "flex",
                            flexDirection: "column",
                            border: "1px solid divider",
                            outline: "none"
                        }}
                    >
                        {/* Map Header & Controls */}
                        <Box sx={{ p: { xs: 1, sm: 1.5, md: 2 }, display: "flex", flexWrap: "wrap", gap: 1, alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid divider", bgcolor: mode === "dark" ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)" }}>
                            <Box display="flex" alignItems="center" gap={2} sx={{ width: { xs: "calc(100% - 48px)", sm: "70%", md: "40%" }, minWidth: 0, flex: { xs: "1 1 calc(100% - 48px)", md: "0 1 40%" } }}>
                                <Typography variant="h6" fontWeight="bold" sx={{ display: { xs: "none", sm: "flex" }, alignItems: "center", gap: 1 }}>
                                    <DirectionsIcon /> Interactive Map
                                </Typography>
                                <Paper elevation={0} sx={{ p: '2px 8px', display: 'flex', alignItems: 'center', width: '100%', borderRadius: 6, border: '1px solid divider', bgcolor: mode === "dark" ? "#1e1e1e" : "#f5f5f5" }}>
                                    <SearchIcon sx={{ color: 'text.secondary', mr: 1, fontSize: 20 }} />
                                    <InputBase
                                        placeholder="Search places, hotels, restaurants..."
                                        value={mapSearchQuery}
                                        onChange={(e) => setMapSearchQuery(e.target.value)}
                                        sx={{ ml: 1, flex: 1, fontSize: '0.85rem' }}
                                    />
                                </Paper>
                            </Box>

                            {/* Category Filter Chips */}
                            <Stack direction="row" spacing={0.75} sx={{ display: { xs: "flex", lg: "flex" }, order: { xs: 3, md: 0 }, width: { xs: "100%", md: "auto" }, maxWidth: "100%", overflowX: "auto", pb: 0.25, flexShrink: 0, "& .MuiChip-root": { flexShrink: 0 } }}>
                                <Chip label="All" onClick={() => setMapCategoryFilter("all")} color={mapCategoryFilter === "all" ? "primary" : "default"} size="small" />
                                <Chip icon={<HotelIcon fontSize="small" />} label="Hotels" onClick={() => setMapCategoryFilter("hotel")} color={mapCategoryFilter === "hotel" ? "primary" : "default"} size="small" />
                                <Chip icon={<RestaurantIcon fontSize="small" />} label="Restaurants" onClick={() => setMapCategoryFilter("restaurant")} color={mapCategoryFilter === "restaurant" ? "primary" : "default"} size="small" />
                                <Chip icon={<PlaceIcon fontSize="small" />} label="Attractions" onClick={() => setMapCategoryFilter("attraction")} color={mapCategoryFilter === "attraction" ? "primary" : "default"} size="small" />
                            </Stack>

                            <IconButton aria-label="Close map" onClick={() => setMapModalOpen(false)} sx={{ minWidth: 44, minHeight: 44, flexShrink: 0 }}>
                                <CloseIcon />
                            </IconButton>
                        </Box>

                        {/* Map View Canvas */}
                        <Box sx={{ flex: 1, position: "relative", width: "100%", height: "100%", minHeight: 0, minWidth: 0, overflow: "hidden" }}>
                            <RouteMap
                                from={trip?.from || "Current Location"}
                                to={trip?.to || trip?.location || "Destination"}
                                waypoints={filteredMapPlaces}
                                mode={mode}
                                fullScreen={true}
                            />
                        </Box>
                    </Box>
                </Fade>
            </Modal>

            {/* ================= RIGHT-MOST DRAWERS ================= */}
            <ShareDrawer
                {...rightDrawerProps}
                shareDrawerOpen={shareDrawerOpen}
                setShareDrawerOpen={setShareDrawerOpen}
                inviteLink={inviteLink}
                trip={trip}
                mode={mode}
                setSnackbar={setSnackbar}
                user={currentUser}
                db={db}
            />

            <ChecklistDrawer 
                {...rightDrawerProps}
                checklistDrawerOpen={checklistDrawerOpen} 
                setChecklistDrawerOpen={setChecklistDrawerOpen} 
                checklistDrafts={checklistDrafts} 
                setChecklistDrafts={setChecklistDrafts} 
                newTask={newTask} 
                setNewTask={setNewTask} 
                uploadingBatch={uploadingBatch} 
                addTask={addTask} 
                addAllChecklistItems={addAllChecklistItems} 
                addEmptyChecklistDraft={() => setChecklistDrafts((s) => [...s, ""])} 
                updateChecklistDraft={(i, v) => setChecklistDrafts((s) => s.map((it, idx) => (idx === i ? v : it)))} 
                removeChecklistDraft={(i) => setChecklistDrafts((s) => s.filter((_, idx) => idx !== i))} 
                handleChecklistFileUpload={handleChecklistFileUpload} 
                mode={mode} 
                userData={userData}
                onAiGenerateChecklist={handleGenerateAiChecklist}
            />

            <TimelineDrawer 
                {...rightDrawerProps}
                timelineDrawerOpen={timelineDrawerOpen} 
                setTimelineDrawerOpen={setTimelineDrawerOpen} 
                timelineDrafts={timelineDrafts} 
                setTimelineDrafts={setTimelineDrafts} 
                newEvent={newEvent} 
                setNewEvent={setNewEvent} 
                addTimelineEvent={addTimelineEvent} 
                addEmptyTimelineDraft={() => setTimelineDrafts((s) => [...s, { title: "", time: getCurrentDate() + "T" + getCurrentTime(), note: "" }])} 
                updateTimelineDraft={(i, item) => setTimelineDrafts((s) => s.map((it, idx) => (idx === i ? item : it)))} 
                removeTimelineDraft={(i) => setTimelineDrafts((s) => s.filter((_, idx) => idx !== i))} 
                handleTimelineFileUpload={handleTimelineFileUpload} 
                mode={mode} 
                userData={userData}
                onAiGenerateTimeline={handleGenerateAiTimeline}
            />

            <BudgetDrawer
                {...rightDrawerProps}
                budgetDrawerOpen={budgetDrawerOpen}
                setBudgetDrawerOpen={setBudgetDrawerOpen}
                editBudget={editBudget}
                setEditBudget={setEditBudget}
                saveBudget={saveBudget}
                mode={mode}
                tripMembers={memberDetails}
            />

            <ExpenseDrawer {...rightDrawerProps} expenseDrawerOpen={expenseDrawerOpen} setExpenseDrawerOpen={setExpenseDrawerOpen} newExpense={newExpense} setNewExpense={setNewExpense} expenseContributors={expenseContributors} setExpenseContributors={setExpenseContributors} memberDetails={memberDetails} currentUseruid={currentUseruid} getMemberName={getMemberName} initializeExpenseContributors={initializeExpenseContributors} addExpense={addExpense} updateExpense={updateExpense} editingExpense={editingExpense} mode={mode} theme={theme} />

            <LinkDrawer {...rightDrawerProps} setNewLink={setNewLink} linkDrawerOpen={linkDrawerOpen} setLinkDrawerOpen={setLinkDrawerOpen} newLink={newLink} handleAddLink={handleAddLink} mode={mode} />
            
            <SettingsDrawer {...rightDrawerProps} settingsDrawerOpen={settingsDrawerOpen} setSettingsDrawerOpen={setSettingsDrawerOpen} trip={trip} tripAdmins={tripAdmins} memberDetails={memberDetails} tripPermissions={tripPermissions} updatePermissions={async (p) => { await updateDoc(doc(db, "trips", id), { permissions: p }); setTripPermissions(p); setSnackbar({ open: true, message: "Permissions updated!" }); }} promoteToAdmin={async (uid) => { const newAdmins = [...tripAdmins, uid]; await updateDoc(doc(db, "trips", id), { admins: newAdmins }); setTripAdmins(newAdmins); setSnackbar({ open: true, message: "Member promoted!" }); }} demoteAdmin={async (uid) => { const newAdmins = tripAdmins.filter((a) => a !== uid); await updateDoc(doc(db, "trips", id), { admins: newAdmins }); setTripAdmins(newAdmins); setSnackbar({ open: true, message: "Admin demoted!" }); }} mode={mode} setMode={setMode} accent={accent} setAccent={setAccent} confirmDeleteOpen={confirmDeleteOpen} setConfirmDeleteOpen={setConfirmDeleteOpen} getMemberName={getMemberName} currentUseruid={currentUseruid} displaySettings={displaySettings} updateDisplaySettings={updateDisplaySettings} />

            <ConfirmDeleteDialog confirmDeleteOpen={confirmDeleteOpen} setConfirmDeleteOpen={setConfirmDeleteOpen} handleDeleteTrip={handleDeleteTrip} mode={mode} />

            <ChecklistViewAllDrawer {...rightDrawerProps} checklistViewAllOpen={checklistViewAllOpen} setChecklistViewAllOpen={setChecklistViewAllOpen} checklist={checklist} toggleTask={toggleTask} mode={mode} userData={userData} />

            <TimelineAllDrawer {...rightDrawerProps} timelineAllDrawerOpen={timelineAllDrawerOpen} setTimelineAllDrawerOpen={setTimelineAllDrawerOpen} timeline={timeline} toggleEventCompleted={toggleEventCompleted} mode={mode} userData={userData} />
        </Box>
    );
}