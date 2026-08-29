import React, { useEffect, useState, useCallback } from "react";
import {
    Box,
    Typography,
    Container,
    AvatarGroup,
    Avatar,
    LinearProgress,
    Button,
    Card,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Divider,
    IconButton,
    TextField,
    Snackbar,
    Collapse,
    Tooltip,
    Checkbox,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    CircularProgress,
    Paper,
    Grid,
    Chip,
    Stack,
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
    DeleteOutline as DeleteOutlineIcon,
    ExpandMore as ExpandMoreIcon,
    LockOutlined as LockOutlinedIcon,
    Celebration as CelebrationIcon,
    DriveFolderUpload as DriveFolderUploadIcon,
    YouTube as YouTubeIcon,
    PhotoLibrary as PhotoLibraryIcon,
    Edit as EditIcon,
    Link as LinkIcon,
    Cancel as CancelIcon,
    AddLink as AddLinkIcon,
    Share as ShareIcon,
    AutoAwesome as AutoAwesomeIcon,
    Explore as ExploreIcon,
    EventNote as EventNoteIcon,
    PlaylistAddCheck as PlaylistAddCheckIcon,
    Delete as DeleteIcon,
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
    const [budget, setBudget] = useState({ total: 0, used: 0, contributors: [], expenses: [] });
    const [photos, setPhotos] = useState([]);
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
    const [checklistDrafts, setChecklistDrafts] = useState([]);
    const [uploadingBatch, setUploadingBatch] = useState(false);
    const [checklistViewAllOpen, setChecklistViewAllOpen] = useState(false);
    const [open, setOpen] = useState(false);
    const [settingsDrawerOpen, setSettingsDrawerOpen] = useState(false);

    // AI Features & Famous Places State
    const [groqApiKey, setGroqApiKey] = useState("");
    const [isGeneratingAiTimeline, setIsGeneratingAiTimeline] = useState(false);
    const [isGeneratingAiChecklist, setIsGeneratingAiChecklist] = useState(false);
    const [isGeneratingPlaces, setIsGeneratingPlaces] = useState(false);
    const [famousPlaces, setFamousPlaces] = useState([]);

    const [tripLinks, setTripLinks] = useState([]);
    const [newLink, setNewLink] = useState({ title: "", url: "" });
    const [linkDrawerOpen, setLinkDrawerOpen] = useState(false);
    const [editingLink, setEditingLink] = useState(null);
    const [editingExpense, setEditingExpense] = useState(null);
    const [editingChecklist, setEditingChecklist] = useState(null);
    const [editingTimeline, setEditingTimeline] = useState(null);

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
    const [showAllExpenses, setShowAllExpenses] = useState(false);

    const [userData, setUserData] = useState(null);

    const [memberDetails, setMemberDetails] = useState([]);
    const [timelineDrafts, setTimelineDrafts] = useState([]);

    const [memberToRemove, setMemberToRemove] = useState(null);
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

    const visibleExpenses = showAllExpenses ? budget?.expenses || [] : (budget?.expenses || []).slice(0, 4);

    // Fetch user's Groq API Key
    useEffect(() => {
        const fetchGroqKey = async () => {
            if (!currentUseruid) return;
            try {
                const userDocSnap = await getDoc(doc(db, "users", currentUseruid));
                if (userDocSnap.exists() && userDocSnap.data().groqApiKey) {
                    setGroqApiKey(userDocSnap.data().groqApiKey);
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

    // Check if user is assigned "Dev Beta" type in Firestore
    const isDevBeta = userData?.type === "Dev Beta";

    // Real-time listener for groupChats document matching trip ID to get hero image iconURL
    useEffect(() => {
        if (!id) return;

        // Try direct document by ID first
        const unsubGroup = onSnapshot(doc(db, "groupChats", id), async (snap) => {
            if (snap.exists()) {
                const data = snap.data();
                const icon = data.iconURL || data.photoURL || data.icon || "";
                if (icon) setGroupChatIcon(icon);
            } else {
                // Fallback: Query by tripId field
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

        // Trip doc
        const tripRef = doc(db, "trips", id);
        const unsubTrip = onSnapshot(tripRef, (snap) => {
            if (!snap.exists()) return;
            const data = snap.data();
            setTrip((prev) => ({ ...prev, ...data }));
            setEditTrip(data);
            setTripPermissions(data.permissions || tripPermissions);
            setTripAdmins(data.admins || [data.createdBy]);
            setTripLinks(data.links || []);
            if (data.display) {
                setDisplaySettings((prev) => ({ ...prev, ...data.display }));
            }
            if (data.members?.length) loadMemberDetails(data.members);
            if (data.location) {
                getWeather(data.location).then(setWeather).catch(() => {});
            }
        });

        // Famous Places Subcollection
        const unsubPlaces = onSnapshot(collection(db, `trips/${id}/places`), (snap) => {
            setFamousPlaces(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        });

        // Checklist
        const unsubChecklist = onSnapshot(collection(db, `trips/${id}/checklist`), (snap) => {
            setChecklist(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        });

        // Photos
        const unsubPhotos = onSnapshot(collection(db, `trips/${id}/photos`), (snap) => {
            setPhotos(snap.docs.map((d) => d.data().url).filter(Boolean));
        });

        // Timeline
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
                if (event.revealed) return true;
                if (event.revealAt && event.revealAt <= now) return true;
                return false;
            });

            setTimeline(visibleEvents.sort((a, b) => new Date(a.time) - new Date(b.time)));
        });

        // Budget Doc
        const budgetRef = doc(db, "budgets", id);
        const unsubBudget = onSnapshot(budgetRef, (snap) => {
            if (!snap.exists()) {
                setBudget({ total: 0, used: 0, contributors: [], expenses: [] });
                return;
            }
            const data = snap.data();
            const used = (data.expenses || []).reduce((s, e) => s + (Number(e.amount) || 0), 0);
            setBudget({ total: data.total || 0, used, contributors: data.contributors || [], expenses: data.expenses || [] });
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
    }, [id, currentUseruid]);

    // Update Display Settings
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

    // Budget & Expense Actions
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
            setBudget((prev) => ({ ...prev, used: updatedExpenses.reduce((s, e) => s + (Number(e.amount) || 0), 0), expenses: updatedExpenses }));
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
            setBudget((prev) => ({ ...prev, used: updatedExpenses.reduce((s, e) => s + (Number(e.amount) || 0), 0), expenses: updatedExpenses }));
            setSnackbar({ open: true, message: "Expense updated successfully!" });
            setExpenseDrawerOpen(false);
            setEditingExpense(null);
        } catch (err) {
            console.error(err);
            setSnackbar({ open: true, message: "Failed to update expense." });
        }
    };

    // Link Drawer Actions
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

    // Checklist Drawer Actions
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

    // Timeline Drawer Actions
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

    // AI Generate Famous Places & Save to Firestore Subcollection
    const handleGenerateAiPlaces = async () => {
        const destLocation = trip?.to || trip?.location || trip?.name;
        if (!destLocation) {
            setSnackbar({ open: true, message: "No destination location set for this trip." });
            return;
        }
        if (!groqApiKey) {
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
}
Do not output markdown.`;

            const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${groqApiKey}` },
                body: JSON.stringify({
                    model: "llama-3.3-70b-versatile",
                    messages: [{ role: "user", content: prompt }],
                    temperature: 0.3,
                }),
            });

            const data = await res.json();
            const cleanJsonStr = (data?.choices?.[0]?.message?.content || "").replace(/```json/g, "").replace(/```/g, "").trim();
            const parsed = JSON.parse(cleanJsonStr);

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
            setSnackbar({ open: true, message: "Error discovering AI places." });
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
        if (!groqApiKey) {
            setSnackbar({ open: true, message: "Please save your Groq API Key in Profile -> AI Features." });
            return;
        }
        if (!trip?.from || !trip?.to) {
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

            const prompt = `Generate a ${numDays}-day itinerary timeline for travel from "${trip.from}" to "${trip.to}" starting on "${trip.startDate || "N/A"}" and ending on "${trip.endDate || "N/A"}".
Return strictly raw JSON:
{
  "timeline": [
    {
      "title": "Day 1 - Arrival & Hotel Check-in",
      "time": "${trip?.startDate || getCurrentDate()}T10:00",
      "note": "Transit to destination, check in at hotel, and evening sightseeing."
    }
  ]
}
Do not output markdown.`;

            const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${groqApiKey}` },
                body: JSON.stringify({ model: "llama-3.3-70b-versatile", messages: [{ role: "user", content: prompt }] }),
            });

            const data = await res.json();
            const cleanJsonStr = (data?.choices?.[0]?.message?.content || "").replace(/```json/g, "").replace(/```/g, "").trim();
            const parsed = JSON.parse(cleanJsonStr);

            if (parsed.timeline?.length) {
                const timelineRef = collection(db, `trips/${id}/timeline`);
                for (const item of parsed.timeline) {
                    await addDoc(timelineRef, {
                        title: item.title,
                        time: item.time,
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
            setSnackbar({ open: true, message: "Failed to generate AI Timeline." });
        } finally {
            setIsGeneratingAiTimeline(false);
        }
    };

    const handleGenerateAiChecklist = async () => {
        if (!groqApiKey) {
            setSnackbar({ open: true, message: "Please save your Groq API Key in Profile -> AI Features." });
            return;
        }

        setIsGeneratingAiChecklist(true);

        try {
            const prompt = `Generate an essential packing checklist for a trip to "${trip?.to || trip?.location || "Destination"}".
Return strictly raw JSON:
{
  "checklist": ["Government IDs & Tickets", "Phone Chargers", "First Aid Kit", "Comfortable Shoes"]
}
Do not output markdown.`;

            const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${groqApiKey}` },
                body: JSON.stringify({ model: "llama-3.3-70b-versatile", messages: [{ role: "user", content: prompt }] }),
            });

            const data = await res.json();
            const cleanJsonStr = (data?.choices?.[0]?.message?.content || "").replace(/```json/g, "").replace(/```/g, "").trim();
            const parsed = JSON.parse(cleanJsonStr);

            if (parsed.checklist?.length) {
                const checklistRef = collection(db, `trips/${id}/checklist`);
                for (const textItem of parsed.checklist) {
                    await addDoc(checklistRef, { text: textItem, completed: false });
                }
                setSnackbar({ open: true, message: `✨ Added ${parsed.checklist.length} checklist items!` });
            }
        } catch (err) {
            console.error("AI Checklist generation failed:", err);
            setSnackbar({ open: true, message: "Failed to generate AI Checklist." });
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

    const canUserDo = (action) => {
        if (!currentUseruid) return false;
        if (tripAdmins.includes(currentUseruid)) return true;
        return tripPermissions[action] === "all";
    };

    const getMemberName = (uid) => {
        const member = memberDetails.find((m) => m.uid === uid);
        if (uid === currentUseruid) return `${member?.name || "You"} (Me)`;
        return member?.name || "Unknown";
    };

    const handleSaveEdit = async () => {
        if (!id) return;
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
    const mapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(trip?.from || "")}&destination=${encodeURIComponent(trip?.to || "")}`;
    const displayIconURL = groupChatIcon || trip?.iconURL || trip?.coverImage || "";

    return (
        <Box sx={{ color: mode === "dark" ? "#fff" : "#000", minHeight: "100vh" }}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={goBack}
            sx={{
              mb: 2,
              borderRadius: 8,
              color: mode === "dark" ? "#fff" : "#000",
              position: "absolute",
              top: 46,
              left: 16,
              backgroundColor: mode === "dark" ? "#00000047" : "#ffffff36",
              backdropFilter: "blur(180px)",
              zIndex: 10,
            }}
          >
            Back
          </Button>

          <Box
            sx={{
              display: "flex",
              justifyContent: "flex-end",
              alignItems: "center",
              gap: 1,
              position: "absolute",
              top: 46,
              right: 16,
              zIndex: 10,
            }}
          >
            <Button
              onClick={() => setShareDrawerOpen(true)}
              sx={{
                mb: 2,
                borderRadius: 8,
                color: mode === "dark" ? "#fff" : "#000",
                backgroundColor: mode === "dark" ? "#00000047" : "#ffffff36",
                backdropFilter: "blur(180px)",
                border: "none",
              }}
            >
              <ShareIcon />
            </Button>

            <Button
              onClick={() => navigate(`/group/${id}`)}
              sx={{
                mb: 2,
                borderRadius: 8,
                color: mode === "dark" ? "#fff" : "#000",
                backgroundColor: mode === "dark" ? "#00000047" : "#ffffff36",
                backdropFilter: "blur(180px)",
                border: "none",
              }}
            >
              <GroupIcon />
            </Button>

            <Button
              onClick={() => setSettingsDrawerOpen(true)}
              sx={{
                mb: 2,
                borderRadius: 8,
                color: mode === "dark" ? "#fff" : "#000",
                backgroundColor: mode === "dark" ? "#00000047" : "#ffffff36",
                backdropFilter: "blur(180px)",
                border: "none",
              }}
            >
              {currentUseruid === trip?.createdBy ? <SettingsIcon /> : <InfoIcon />}
            </Button>
          </Box>

          {/* Hero Banner Section */}
          <Box
            sx={{
              position: "relative",
              backgroundImage: displayIconURL ? `url(${displayIconURL})` : "none",
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundColor: mode === "dark" ? "#1d1d1d" : "#f0f0f0",
              height: { xs: 340, sm: 380 },
              boxShadow: "none",
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "flex-start",
              p: { xs: 2, sm: 3 },
            }}
          >
            {/* Weather widget positioned nicely inside the hero banner */}
            {weather && (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  background:
                    mode === "dark"
                      ? "rgba(20, 20, 20, 0.15)"
                      : "rgba(255, 255, 255, 0.25)",
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

            {!displayIconURL && (
              <Box
                sx={{
                  width: 100,
                  height: 100,
                  borderRadius: 3,
                  backgroundColor: mode === "dark" ? "#222" : "#e0e0e0",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: mode === "dark" ? "#fff" : "#000",
                  fontWeight: 700,
                  fontSize: 32,
                  mb: 2,
                }}
              >
                {trip?.name ? trip.name.charAt(0).toUpperCase() : "T"}
              </Box>
            )}
          </Box>

          {/* Main Content Section */}
          <Container
            maxWidth="lg"
            sx={{
              position: "relative",
              zIndex: 3,
              mt: -3,
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              bgcolor: mode === "dark" ? "#00000000" : "#f8f9fa0e",
              backdropFilter: "blur(30px)",
              pt: 3,
              pb: 8,
              boxShadow: mode === "dark" ? "0 -8px 30px rgba(0,0,0,0.5)" : "0 -8px 30px rgba(0,0,0,0.06)",
            }}
          >
            {/* Title + Edit */}
            <Box display="flex" flexDirection="column" gap={1} px={{ xs: 1, sm: 2 }} py={1}>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                {editMode ? (
                  <TextField
                    value={editTrip.name}
                    onChange={(e) => setEditTrip({ ...editTrip, name: e.target.value })}
                    fullWidth
                    variant="standard"
                    sx={{ mr: 2, fontSize: "2rem", fontWeight: "bold" }}
                  />
                ) : (
                  <Typography variant="h3" fontWeight="bold">{trip?.name}</Typography>
                )}
                {trip?.createdBy === currentUseruid && canUserDo("canEdit") && (
                  <IconButton onClick={() => setEditMode(!editMode)} size="small">
                    <Edit fontSize="small" />
                  </IconButton>
                )}
              </Box>

              <Typography sx={{ mt: 1 }}>
                {editMode ? (
                  <TextField
                    value={editTrip.location}
                    onChange={(e) => setEditTrip({ ...editTrip, location: e.target.value })}
                    variant="standard"
                  />
                ) : (
                  <Typography variant="body2" color="text.secondary" sx={{ display: "flex", alignItems: "center" }}>
                    <LocationOn sx={{ fontSize: 18, mr: 0.5, color: mode === "dark" ? "#fff" : "#333" }} /> {trip?.location}
                  </Typography>
                )}
                </Typography>

                {trip?.description && (
                  <Typography variant="body2" sx={{ opacity: 0.85, mt: 0.5 }}>
                    {trip.description}
                  </Typography>
                )}

                <Typography sx={{ mt: 1 }}>
                  <Box>
                    {editMode ? (
                      <Box display="flex" gap={2}>
                        <TextField
                          type="date"
                          label="Start Date"
                          value={editTrip.startDate || ""}
                          onChange={(e) => setEditTrip({ ...editTrip, startDate: e.target.value })}
                          variant="standard"
                        />
                        <TextField
                          type="date"
                          label="End Date"
                          value={editTrip.endDate || ""}
                          onChange={(e) => setEditTrip({ ...editTrip, endDate: e.target.value })}
                          variant="standard"
                        />
                      </Box>
                    ) : (
                      <Typography variant="body2" color="text.secondary" sx={{ display: "flex" }}>
                        <AccessTime sx={{ fontSize: 16, mr: 0.5 }} />
                        {trip?.startDate && trip?.endDate
                          ? `${new Date(trip.startDate).toDateString()} → ${new Date(trip.endDate).toDateString()}`
                          : "Date not set"}
                      </Typography>
                    )}
                  </Box>
                </Typography>

                {trip?.from && trip?.to && (
                  <Box mt={2}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Route:
                    </Typography>
                    <Box display="flex" gap={1} mt={0.5} justifyContent={"space-between"}>
                      <Typography variant="body1" fontWeight="bold" gutterBottom>
                        {trip.from} → {trip.to}
                      </Typography>
                      <Button
                        href={mapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{ backgroundColor: "#ffffff11", width: 40, height: 40, borderRadius: 8, color: mode === "dark" ? "#fff" : "#333" }}
                      >
                        <DirectionsIcon />
                      </Button>
                    </Box>
                  </Box>
                )}

                {editMode && (
                  <Button variant="contained" onClick={handleSaveEdit} sx={{ mt: 2, backgroundColor: mode === "dark" ? "#fff" : "#000", color: mode === "dark" ? "#000" : "#fff", borderRadius: 8 }}>
                    Save Changes
                  </Button>
                )}
              </Box>

              <Box sx={{ mb: 4 }}>
                {/* AI Famous Places Section */}
                {isDevBeta && (
                  <Box sx={{ mt: 3, p: 2, borderRadius: 4, bgcolor: mode === "dark" ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)", border: "1px solid divider" }}>
                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 1, mb: 2 }}>
                      <Typography variant="h6" fontWeight="bold" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <ExploreIcon sx={{ color: "#00E676" }} /> Famous Places & Top Attractions
                      </Typography>

                      <Button
                        variant="outlined"
                        onClick={handleGenerateAiPlaces}
                        disabled={isGeneratingPlaces}
                        startIcon={isGeneratingPlaces ? <CircularProgress size={16} /> : <AutoAwesomeIcon sx={{ color: "#00E676" }} />}
                        sx={{
                          borderRadius: 8,
                          textTransform: "none",
                          fontWeight: 700,
                          borderColor: "#00E676",
                          color: mode === "dark" ? "#00E676" : "#00A855",
                          "&:hover": { bgcolor: "rgba(0, 230, 118, 0.08)", borderColor: "#00E676" },
                        }}
                      >
                        {isGeneratingPlaces ? "Discovering..." : "✨ Discover Places"}
                      </Button>
                    </Box>

                    {famousPlaces.length === 0 ? (
                      <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: "center" }}>
                        No places discovered yet. Click <b>"✨ Discover Places"</b> to find top local spots with Groq AI!
                      </Typography>
                    ) : (
                      <Grid container spacing={2}>
                        {famousPlaces.map((place) => (
                          <Grid item xs={12} sm={6} key={place.id}>
                            <Paper
                              elevation={0}
                              sx={{
                                p: 2,
                                borderRadius: 3,
                                border: "1px solid divider",
                                height: "100%",
                                display: "flex",
                                flexDirection: "column",
                                justifyContent: "space-between",
                                bgcolor: mode === "dark" ? "rgba(255,255,255,0.02)" : "#fff",
                              }}
                            >
                              <Box>
                                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 0.5 }}>
                                  <Typography variant="subtitle1" fontWeight={700}>
                                    {place.name}
                                  </Typography>
                                  <IconButton size="small" color="error" onClick={() => handleDeletePlace(place.id)}>
                                    <DeleteIcon fontSize="small" />
                                  </IconButton>
                                </Box>

                                <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
                                  <Chip label={place.category} size="small" variant="outlined" sx={{ fontWeight: 600, fontSize: "0.7rem" }} />
                                  {place.suggestedTime && (
                                    <Chip label={place.suggestedTime} size="small" sx={{ fontWeight: 600, fontSize: "0.7rem", bgcolor: "rgba(0, 230, 118, 0.15)", color: "#00E676" }} />
                                  )}
                                </Stack>

                                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                  {place.description}
                                </Typography>
                              </Box>

                              <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
                                <Button
                                  size="small"
                                  variant="contained"
                                  startIcon={<EventNoteIcon />}
                                  onClick={() => handleAddPlaceToTimeline(place)}
                                  sx={{
                                    borderRadius: 2,
                                    fontSize: "0.72rem",
                                    textTransform: "none",
                                    fontWeight: 700,
                                    bgcolor: mode === "dark" ? "#fff" : "#000",
                                    color: mode === "dark" ? "#000" : "#fff",
                                    flex: 1,
                                  }}
                                >
                                  + Timeline
                                </Button>

                                <Button
                                  size="small"
                                  variant="outlined"
                                  startIcon={<PlaylistAddCheckIcon />}
                                  onClick={() => handleAddPlaceToChecklist(place)}
                                  sx={{
                                    borderRadius: 2,
                                    fontSize: "0.72rem",
                                    textTransform: "none",
                                    fontWeight: 700,
                                    flex: 1,
                                  }}
                                >
                                  + Checklist
                                </Button>
                              </Box>
                            </Paper>
                          </Grid>
                        ))}
                      </Grid>
                    )}
                  </Box>
                )}

                {/* Checklist with AI Auto-Generator */}
                <Box sx={{ mt: 4, p: 2 }}>
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 1 }}>
                    <Typography variant="h5" gutterBottom sx={{ mb: 0 }}>
                      Checklist
                    </Typography>
                    
                    <Box sx={{ display: "flex", gap: 1 }}>
                      {isDevBeta && (
                        <Button
                          variant="outlined"
                          onClick={handleGenerateAiChecklist}
                          disabled={isGeneratingAiChecklist}
                          startIcon={isGeneratingAiChecklist ? <CircularProgress size={16} /> : <AutoAwesomeIcon sx={{ color: "#00E676" }} />}
                          sx={{
                            borderRadius: 8,
                            textTransform: "none",
                            fontWeight: 700,
                            borderColor: "#00E676",
                            color: mode === "dark" ? "#00E676" : "#00A855",
                            "&:hover": { bgcolor: "rgba(0, 230, 118, 0.08)", borderColor: "#00E676" },
                          }}
                        >
                          {isGeneratingAiChecklist ? "Generating..." : "✨ AI Checklist"}
                        </Button>
                      )}

                      <Button
                        variant="outlined"
                        onClick={() => setChecklistDrawerOpen(true)}
                        sx={{ px: 2, color: theme.palette.text.primary, border: "none", backgroundColor: mode === "dark" ? "#ffffff10" : "#00000010", borderRadius: 8 }}
                      >
                        + Add
                      </Button>
                    </Box>
                  </Box>

                  <Box sx={{ position: "relative", backgroundColor: "transparent", mt: 1.5 }}>
                    <List sx={{ maxHeight: "200px", overflowY: "auto", scrollbarWidth: "none", pb: 4 }}>
                      {checklist.map((task) => (
                        <ListItem key={task.id} onClick={() => toggleTask(task)} disableGutters sx={{ mb: 0.5, borderRadius: 2 }}>
                          <ListItemIcon>
                            <Checkbox checked={task.completed} onChange={() => toggleTask(task)} color="success" />
                          </ListItemIcon>
                          <ListItemText primary={<Typography sx={{ textDecoration: task.completed ? "line-through" : "none", color: task.completed ? "#888" : "inherit" }}>{task.text}</Typography>} />
                        </ListItem>
                      ))}
                    </List>

                    <Button
                      variant="text"
                      size="small"
                      fullWidth
                      onClick={() => setChecklistViewAllOpen(true)}
                      sx={{ textTransform: "none", color: (t) => t.palette.mode === "dark" ? "#fff" : "#000", backgroundColor: mode === "dark" ? "#ffffff10" : "#00000010", fontWeight: 500, borderRadius: 8, py: 1 }}
                    >
                      View All
                    </Button>
                  </Box>
                </Box>

                <Divider sx={{ my: 2 }} />

                {/* Timeline with AI Auto-Generator */}
                <Box sx={{ mt: 4, px: 2, py: 1 }}>
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 1 }}>
                    <Typography variant="h5" gutterBottom sx={{ mb: 0 }}>
                      Trip Timeline
                    </Typography>

                    <Box sx={{ display: "flex", gap: 1 }}>
                      {isDevBeta && (
                        <Button
                          variant="outlined"
                          onClick={handleGenerateAiTimeline}
                          disabled={isGeneratingAiTimeline}
                          startIcon={isGeneratingAiTimeline ? <CircularProgress size={16} /> : <AutoAwesomeIcon sx={{ color: "#00E676" }} />}
                          sx={{
                            borderRadius: 8,
                            textTransform: "none",
                            fontWeight: 700,
                            borderColor: "#00E676",
                            color: mode === "dark" ? "#00E676" : "#00A855",
                            "&:hover": { bgcolor: "rgba(0, 230, 118, 0.08)", borderColor: "#00E676" },
                          }}
                        >
                          {isGeneratingAiTimeline ? "Generating..." : "✨ AI Timeline"}
                        </Button>
                      )}

                      <Button
                        variant="outlined"
                        onClick={() => setTimelineDrawerOpen(true)}
                        sx={{ px: 2, color: theme.palette.text.primary, border: "none", backgroundColor: mode === "dark" ? "#ffffff10" : "#00000010", borderRadius: 8 }}
                      >
                        + Add
                      </Button>
                    </Box>
                  </Box>

                  <Box sx={{ position: "relative", mt: 1.5 }}>
                    {timeline.length === 0 ? (
                      <Typography variant="body2" color="text.secondary" sx={{ pb: 3, textAlign: "center" }}>
                        No events added yet.
                      </Typography>
                    ) : (
                      <List sx={{ maxHeight: "300px", overflowY: "auto", scrollbarWidth: "none", pb: 2 }}>
                        {timeline.map((item) => {
                          const itemTime = new Date(item.time);
                          return (
                            <ListItem key={item.id} sx={{ bgcolor: mode === "dark" ? "#1c1c1c" : "#f0f0f0ff", borderRadius: 3, mb: 1, px: 2, py: 1 }}>
                              <ListItemIcon>
                                <Checkbox checked={item.completed} onChange={() => toggleEventCompleted(item)} />
                              </ListItemIcon>
                              <ListItemText
                                primary={<Typography fontWeight={600}>{item.title}</Typography>}
                                secondary={`${itemTime.toLocaleString()} ${item.note ? `— ${item.note}` : ""}`}
                              />
                            </ListItem>
                          );
                        })}
                      </List>
                    )}

                    <Button
                      variant="text"
                      size="small"
                      fullWidth
                      onClick={() => setTimelineAllDrawerOpen(true)}
                      sx={{ textTransform: "none", color: (t) => t.palette.mode === "dark" ? "#fff" : "#000", backgroundColor: mode === "dark" ? "#ffffff10" : "#00000010", fontWeight: 500, borderRadius: 8, py: 1 }}
                    >
                      View All
                    </Button>
                  </Box>
                </Box>

                <Divider sx={{ my: 2 }} />

                {/* Members Section */}
                <Box mt={4} mx={2}>
                  <Typography variant="h6" gutterBottom>
                    Members
                  </Typography>
                  <List dense>
                    {memberDetails.map((user) => (
                      <ListItem key={user.uid} disableGutters sx={{ borderRadius: 3, mb: 1, py: 1, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <Box display="flex" alignItems="center" gap={1.5} sx={{ cursor: "pointer" }} onClick={() => navigate(`/chat/${user.uid}`)}>
                          <Avatar src={user.photoURL} sx={{ width: 40, height: 40 }} />
                          <Box>
                            <Typography fontWeight="medium">{user.uid === currentUseruid ? `${user.name || "You"} (Me)` : user.name || "Unknown"}</Typography>
                            <Typography variant="caption" color="text.secondary">{user.email}</Typography>
                          </Box>
                        </Box>
                      </ListItem>
                    ))}
                  </List>

                  <Button
                    variant="outlined"
                    fullWidth
                    sx={{ mt: 2, color: theme.palette.text.primary, borderColor: mode === "dark" ? "#fff" : "#000", borderRadius: 3 }}
                    onClick={() => setShareDrawerOpen(true)}
                  >
                    Invite Members
                  </Button>
                </Box>
              </Box>
          </Container>

          {/* Sub-components with userData passed down */}
          <ShareDrawer
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

          <BudgetDrawer budgetDrawerOpen={budgetDrawerOpen} setBudgetDrawerOpen={setBudgetDrawerOpen} editBudget={editBudget} setEditBudget={setEditBudget} saveBudget={saveBudget} mode={mode} />

          <ExpenseDrawer expenseDrawerOpen={expenseDrawerOpen} setExpenseDrawerOpen={setExpenseDrawerOpen} newExpense={newExpense} setNewExpense={setNewExpense} expenseContributors={expenseContributors} setExpenseContributors={setExpenseContributors} memberDetails={memberDetails} currentUseruid={currentUseruid} getMemberName={getMemberName} initializeExpenseContributors={initializeExpenseContributors} addExpense={addExpense} updateExpense={updateExpense} editingExpense={editingExpense} mode={mode} theme={theme} />

          <LinkDrawer linkDrawerOpen={linkDrawerOpen} setLinkDrawerOpen={setLinkDrawerOpen} newLink={newLink} setNewLink={setNewLink} handleAddLink={handleAddLink} mode={mode} />
          
          <SettingsDrawer settingsDrawerOpen={settingsDrawerOpen} setSettingsDrawerOpen={setSettingsDrawerOpen} trip={trip} tripAdmins={tripAdmins} memberDetails={memberDetails} tripPermissions={tripPermissions} updatePermissions={async (p) => { await updateDoc(doc(db, "trips", id), { permissions: p }); setTripPermissions(p); setSnackbar({ open: true, message: "Permissions updated!" }); }} promoteToAdmin={async (uid) => { const newAdmins = [...tripAdmins, uid]; await updateDoc(doc(db, "trips", id), { admins: newAdmins }); setTripAdmins(newAdmins); setSnackbar({ open: true, message: "Member promoted!" }); }} demoteAdmin={async (uid) => { const newAdmins = tripAdmins.filter((a) => a !== uid); await updateDoc(doc(db, "trips", id), { admins: newAdmins }); setTripAdmins(newAdmins); setSnackbar({ open: true, message: "Admin demoted!" }); }} mode={mode} setMode={setMode} accent={accent} setAccent={setAccent} confirmDeleteOpen={confirmDeleteOpen} setConfirmDeleteOpen={setConfirmDeleteOpen} getMemberName={getMemberName} currentUseruid={currentUseruid} displaySettings={displaySettings} updateDisplaySettings={updateDisplaySettings} />

          <ConfirmDeleteDialog confirmDeleteOpen={confirmDeleteOpen} setConfirmDeleteOpen={setConfirmDeleteOpen} handleDeleteTrip={handleDeleteTrip} mode={mode} />

          <ChecklistViewAllDrawer 
            checklistViewAllOpen={checklistViewAllOpen} 
            setChecklistViewAllOpen={setChecklistViewAllOpen} 
            checklist={checklist} 
            toggleTask={toggleTask} 
            mode={mode} 
            userData={userData}
          />

          <TimelineAllDrawer 
            timelineAllDrawerOpen={timelineAllDrawerOpen} 
            setTimelineAllDrawerOpen={setTimelineAllDrawerOpen} 
            timeline={timeline} 
            toggleEventCompleted={toggleEventCompleted} 
            mode={mode} 
            userData={userData}
          />

          {/* <Snackbar open={!!snackbar.open} autoHideDuration={3000} message={snackbar.message} onClose={() => setSnackbar({ open: false, message: "" })} /> */}
        </Box>
    );
}