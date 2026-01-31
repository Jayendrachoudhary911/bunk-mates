// ...existing code...
import React, { useEffect, useState } from "react";
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
    InputAdornment,
    Collapse,
    Tooltip,
    Checkbox,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Grid,
} from "@mui/material";

import {
    LocationOn,
    AccessTime,
    Edit,
    Add,
    ContentCopy,
    Settings as SettingsIcon,
    Info as InfoIcon,
    Directions as DirectionsIcon,
    ArrowBack as ArrowBackIcon,
    Group as GroupIcon,
    DeleteOutline as DeleteOutlineIcon,
    CloseOutlined as CloseOutlinedIcon,
    ExpandMore as ExpandMoreIcon,
    LockOutlined as LockOutlinedIcon,
    Celebration as CelebrationIcon,
    WarningAmberRounded as WarningAmberRoundedIcon,
    DriveFolderUpload as DriveFolderUploadIcon,
    YouTube as YouTubeIcon,
    PhotoLibrary as PhotoLibraryIcon,
    Edit as EditIcon,
    Link as LinkIcon,
    Cancel as CancelIcon,
    AddLink as AddLinkIcon,
    Share as ShareIcon,
} from "@mui/icons-material";

import { useParams, useNavigate } from "react-router-dom";
import {
    getDoc,
    doc,
    updateDoc,
    collection,
    addDoc,
    onSnapshot,
    getDocs,
    deleteDoc,
    setDoc,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { db } from "../firebase";
import { QRCodeSVG } from "qrcode.react";

import { motion, AnimatePresence } from "framer-motion";

import { useWeather } from "../contexts/WeatherContext";
import { useThemeToggle } from "../contexts/ThemeToggleContext";
import { getTheme } from "../theme";

// imported sub-components (from attached files)
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
// ...existing code...

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
    const [coverImage, setCoverImage] = useState("");
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

    const [tripLinks, setTripLinks] = useState([]);
    const [newLink, setNewLink] = useState({ title: "", url: "" });
    const [linkDrawerOpen, setLinkDrawerOpen] = useState(false);
    const [editingLink, setEditingLink] = useState(null);
    const [editingExpense, setEditingExpense] = useState(null);
    const [editingChecklist, setEditingChecklist] = useState(null);
    const [editingTimeline, setEditingTimeline] = useState(null);

    const { mode, setMode, accent, setAccent } = useThemeToggle();
    const theme = getTheme(mode, accent);

    // expense states
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
     layout: "grid",       // 'grid' | 'list'
     gridCols: 3,         // number of items per row in grid
     listCols: 1,         // number of columns in list (if applicable)
     cardType: "regular", // 'regular' | 'detailed'
   });
    const [tripAdmins, setTripAdmins] = useState([]);

    const visibleExpenses = showAllExpenses ? budget?.expenses || [] : (budget?.expenses || []).slice(0, 4);

    // subscribe to groupChats/{id} to read iconURL (keeps UI in sync if group chat icon is updated)
    useEffect(() => {
      if (!id) return;
      const gcRef = doc(db, "groupChats", id);
      const unsub = onSnapshot(
        gcRef,
        (snap) => {
          if (!snap.exists()) {
            setGroupChatIcon("");
            return;
          }
          const data = snap.data();
          // support both top-level iconURL and drafts.iconURL
          const icon = data?.iconURL || data?.drafts?.iconURL || "";
          setGroupChatIcon(icon || "");
        },
        (err) => {
          console.error("groupChats snapshot error:", err);
        }
      );
      return () => unsub();
    }, [id]);

    // --- Subscriptions & initial load ---
    useEffect(() => {
        if (!id) return;

        // trip doc
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
                fetchCoverImage(data.name || data.location).then(setCoverImage).catch(() => {});
                getWeather(data.location).then(setWeather).catch(() => {});
            }
            if (data.location) {
                fetchCoverImage(data.name || data.location)
                  .then((url) => {
                    if (url) {
                      setCoverImage(url);
                      // prefer trip.iconURL if present, else use fetched cover
                      const iconToSync = data.iconURL || url;
                      syncGroupChatIcon(iconToSync);
                    }
                  })
                  .catch(() => {});
                getWeather(data.location).then(setWeather).catch(() => {});
            }
            // if trip already has an iconURL, ensure groupChats doc synced
            if (data.iconURL) {
              syncGroupChatIcon(data.iconURL);
            }
        });

        // checklist
        const unsubChecklist = onSnapshot(collection(db, `trips/${id}/checklist`), (snap) => {
            setChecklist(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        });

        // photos
        const unsubPhotos = onSnapshot(collection(db, `trips/${id}/photos`), (snap) => {
            setPhotos(snap.docs.map((d) => d.data().url).filter(Boolean));
        });

        // timeline with auto-reveal logic
        const timelineRef = collection(db, `trips/${id}/timeline`);
        const unsubTimeline = onSnapshot(timelineRef, async (snap) => {
            const events = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
            const now = new Date().toISOString();

            // auto reveal scheduled surprises
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

        // budget doc
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
            unsubChecklist();
            unsubPhotos();
            unsubTimeline();
            unsubBudget();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id, currentUseruid]);

    // load trip links separately if needed (kept in trip snapshot above)

    // helper: load member details
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
        // return cleanup if caller wants it
        return () => unsubscribes.forEach((u) => u());
    };

  const updateDisplaySettings = async (partial) => {
    const next = { ...displaySettings, ...partial };
    setDisplaySettings(next);
    if (!id) return;
    try {
      await updateDoc(doc(db, "trips", id), { display: next });
      // also update local trip object for immediate consistency
      setTrip((t) => (t ? { ...t, display: next } : t));
    } catch (err) {
      console.error("Failed to save display settings:", err);
    }
  };

  const syncGroupChatIcon = async (iconURL) => {
    if (!iconURL || !id) return;
    try {
        const groupChatRef = doc(db, "groupChats", id);
        const groupChatSnap = await getDoc(groupChatRef);
        const groupChatData = groupChatSnap.exists() ? groupChatSnap.data() : null;

        const iconURL = groupChatData?.iconURL || null;
    } catch (err) {
      console.error("Failed to sync group chat icon:", err);
    }
  };

    // simple utility functions
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

    const calculateMemberPayments = (memberUid) => {
        if (!budget?.expenses) return 0;
        return budget.expenses.reduce((totalPaid, exp) => {
            if (exp.payers && exp.payers.length > 0) {
                const m = exp.payers.find((p) => p.uid === memberUid);
                if (m) return totalPaid + (Number(m.amount) || 0);
                return totalPaid;
            } else if (exp.paidBy === memberUid) {
                return totalPaid + (Number(exp.amount) || 0);
            }
            return totalPaid;
        }, 0);
    };

    const initializeExpenseContributors = (members, mode) =>
        members.map((member) => ({
            uid: member.uid,
            name: member.name || "Unknown",
            photoURL: member.photoURL,
            included: mode === "multiple_payers" ? true : member.uid === currentUseruid,
            paidAmount: 0,
        }));

    // --- Actions (trimmed but complete) ---
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

    const handleDeleteLink = async (linkId) => {
        try {
            const tripRef = doc(db, "trips", id);
            const updated = (tripLinks || []).filter((l) => l.id !== linkId);
            await updateDoc(tripRef, { links: updated });
            setSnackbar({ open: true, message: "Link removed." });
        } catch (err) {
            console.error(err);
            setSnackbar({ open: true, message: "Failed to remove link." });
        }
    };

    const handleRenameLink = async (linkId, newTitle) => {
        try {
            const tripRef = doc(db, "trips", id);
            const updated = (tripLinks || []).map((l) => (l.id === linkId ? { ...l, title: newTitle } : l));
            await updateDoc(tripRef, { links: updated });
            setEditingLink(null);
            setSnackbar({ open: true, message: "Link renamed successfully!" });
        } catch (err) {
            console.error(err);
            setSnackbar({ open: true, message: "Failed to rename link." });
        }
    };

    const getLinkIcon = (url) => {
        if (!url) return <LinkIcon />;
        if (url.includes("drive.google")) return <DriveFolderUploadIcon />;
        if (url.includes("youtube")) return <YouTubeIcon color="error" />;
        if (url.includes("photos.google")) return <PhotoLibraryIcon color="info" />;
        return <LinkIcon />;
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

    const handleRemoveMember = async (memberUid) => {
        if (!trip?.createdBy || trip.createdBy !== currentUseruid) {
            setSnackbar({ open: true, message: "Only the trip creator can remove members." });
            return;
        }
        if (memberUid === currentUseruid) {
            setSnackbar({ open: true, message: "You cannot remove yourself." });
            return;
        }
        try {
            const tripRef = doc(db, "trips", id);
            const updatedMembers = (trip.members || []).filter((uid) => uid !== memberUid);
            await updateDoc(tripRef, { members: updatedMembers });
            setSnackbar({ open: true, message: "Member removed successfully!" });
        } catch (err) {
            console.error(err);
            setSnackbar({ open: true, message: "Failed to remove member." });
        }
    };

    const revealSurpriseEvent = async (eventId) => {
        try {
            const eventRef = doc(db, `trips/${id}/timeline`, eventId);
            await updateDoc(eventRef, { revealed: true });
            setSnackbar({ open: true, message: "Surprise revealed to everyone!" });
        } catch (err) {
            console.error(err);
            setSnackbar({ open: true, message: "Failed to reveal surprise." });
        }
    };

    const revealAllSurprises = async () => {
        try {
            const hidden = timeline.filter((e) => e.surprise && e.createdBy === currentUseruid && !e.revealed);
            await Promise.all(hidden.map((e) => updateDoc(doc(db, `trips/${id}/timeline`, e.id), { revealed: true })));
            setSnackbar({ open: true, message: "All surprise events revealed to members!" });
        } catch (err) {
            console.error(err);
            setSnackbar({ open: true, message: "Failed to reveal some surprises." });
        }
    };

    const addTask = async () => {
        if (!newTask?.trim()) return;
        await addDoc(collection(db, `trips/${id}/checklist`), { text: newTask.trim(), completed: false });
        setNewTask("");
    };

    const toggleTask = async (task) => {
        try {
            await updateDoc(doc(db, `trips/${id}/checklist`, task.id), { completed: !task.completed });
        } catch (err) {
            console.error(err);
        }
    };

    // timeline add / update / delete
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

    const deleteTimelineEvent = async (eventId) => {
        try {
            await deleteDoc(doc(db, `trips/${id}/timeline`, eventId));
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

    // budget / expense functions (saveBudget, addExpense, updateExpense) - implement core flows
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

    const addAllTimelineEvents = async () => {
        if (!timelineDrafts.length) {
            setSnackbar({ open: true, message: "No timeline events to add." });
            return;
        }
        try {
            await Promise.all(timelineDrafts.map((item) => addDoc(collection(db, `trips/${id}/timeline`), { ...item, completed: false })));
            setTimelineDrafts([]);
            setTimelineDrawerOpen(false);
            setSnackbar({ open: true, message: `${timelineDrafts.length} event(s) added!` });
        } catch (err) {
            console.error(err);
            setSnackbar({ open: true, message: "Failed to add timeline events." });
        }
    };

    const updateChecklistItem = async (itemId, newText) => {
        if (!newText?.trim()) return;
        try {
            await updateDoc(doc(db, `trips/${id}/checklist`, itemId), { text: newText.trim() });
            setEditingChecklist(null);
        } catch (err) {
            console.error(err);
        }
    };

    const updateTimelineEvent = async (eventId, updatedData) => {
        if (!updatedData?.title || !updatedData?.time) {
            setSnackbar({ open: true, message: "Please fill title and time." });
            return;
        }
        try {
            await updateDoc(doc(db, `trips/${id}/timeline`, eventId), updatedData);
            setEditingTimeline(null);
            setSnackbar({ open: true, message: "Timeline event updated!" });
        } catch (err) {
            console.error(err);
            setSnackbar({ open: true, message: "Failed to update timeline event." });
        }
    };

const fetchCoverImage = async (location) => {
  // Combine 'travel' + location for the search query
  const query = location ? `travel ${trip?.location}` : "travel";

  try {
    const response = await fetch(
      `https://api.unsplash.com/photos/random?query=${encodeURIComponent(query)}&client_id=MGCA3bsEUNBsSG6XbcqnJXckFB4dDyN5ZPKVBrD0FeQ`
    );
    const data = await response.json();
    return data?.urls?.regular || "";
  } catch (error) {
    console.error("Failed to fetch cover image:", error);
    return "";
  }
};

const fetchTripData = async () => {
  if (!id) return;

  // Fetch trip details
  const docRef = doc(db, "trips", id);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) return;

  const tripData = docSnap.data();

  // Fetch group chat iconURL
  const groupChatRef = doc(db, "groupChats", id);
  const groupChatSnap = await getDoc(groupChatRef);
  const groupChatData = groupChatSnap.exists() ? groupChatSnap.data() : null;

  const iconURL = groupChatData?.iconURL || null;

  // Combine trip data with iconURL
  const combinedData = {
    ...tripData,
    iconURL
  };

  // Set full trip state
  setTrip(combinedData);
  setEditTrip(tripData); // preserve separate edit state

  // Load members
  if (tripData.members?.length) {
    loadMemberDetails(tripData.members);
  }

  // Fallback image if no icon
  const imageQuery = tripData.name || tripData.location || "travel";
  const imageUrl = await fetchCoverImage(imageQuery);
  setCoverImage(imageUrl);

  // Fetch weather
  if (tripData.location) {
    try {
      const weatherData = await getWeather(tripData.location); // From WeatherContext
      setWeather(weatherData); // assume you have `const [weather, setWeather] = useState(null)`
    } catch (err) {
      console.error("Failed to fetch weather:", err);
    }
  }
};

    const renderExpensePayers = (exp) => {
    const payers = exp?.payers || [];
    const maxShown = 3;
    return (
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            {payers.slice(0, maxShown).map((p) => {
                const member = memberDetails.find((m) => m.uid === p.uid);
                return (
                    <Tooltip key={p.uid} title={`${member?.name || p.name} — ₹${p.amount}`}>
                        <Avatar
                            src={member?.photoURL}
                            sx={{ width: 24, height: 24, fontSize: 12 }}
                        >
                            {(!member?.photoURL && (member?.name || p.name)) ? (member?.name || p.name)[0] : null}
                        </Avatar>
                    </Tooltip>
                );
            })}
            {payers.length > maxShown && (
                <Typography variant="caption">+{payers.length - maxShown}</Typography>
            )}
        </Box>
    );
};

    const confirmRemoveMember = async () => {
    if (!memberToRemove) return;
    await handleRemoveMember(memberToRemove);
    setMemberToRemove(null);
};

    const renderTripLinks = () => {
      if (!tripLinks || tripLinks.length === 0) {
        return (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ pb: 2, textAlign: "center" }}
          >
            No links added yet.
          </Typography>
        );
      }

const cardCommon = (link) => ({
  onClick: () => window.open(link.url, "_blank"),
  sx: {
    cursor: "pointer",
    p: 2,
    borderRadius: 3,
    position: "relative",
    overflow: "hidden",

    background:
      mode === "dark"
        ? "linear-gradient(145deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))"
        : "linear-gradient(145deg, #ffffff, #f9f9f9)",

    border:
      mode === "dark"
        ? "1px solid rgba(255,255,255,0.08)"
        : "1px solid rgba(0,0,0,0.06)",

    display: "flex",
    flexDirection:
      displaySettings.cardType === "detailed" ? "column" : "row",
    alignItems:
      displaySettings.cardType === "detailed" ? "flex-start" : "center",
    gap: 1.5,

    transition: "all 0.25s cubic-bezier(.4,0,.2,1)",

    "&:hover": {
      transform: "translateY(-4px)",
      boxShadow:
        mode === "dark"
          ? "0 10px 28px rgba(0,0,0,0.6)"
          : "0 10px 28px rgba(0,0,0,0.08)",

      "& .link-actions": {
        opacity: 1,
        transform: "translateY(0)",
      },
    },
  },
});

      // choose layout: for 'grid' use gridCols, for 'list' use listCols (multi-column list)
      const cols =
        displaySettings.layout === "grid"
          ? Math.max(1, Number(displaySettings.gridCols || 1))
          : Math.max(1, Number(displaySettings.listCols || 1));

      return (
  <Box
    sx={{
      display: "grid",
      gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
      gap: 2,
      mt: 1,
    }}
  >
    {tripLinks.map((link) => (
      <Box key={link.id || link.url} {...cardCommon(link)}>
        {/* ---------- Icon ---------- */}
        <Box
          sx={{
            width:
              displaySettings.cardType === "detailed" ? "100%" : 48,
            height:
              displaySettings.cardType === "detailed" ? 44 : 48,

            display: "flex",
            alignItems: "center",
            justifyContent: "center",

            borderRadius: 2,
            flexShrink: 0,

            background:
              mode === "dark"
                ? "rgba(255,255,255,0.06)"
                : "rgba(0,0,0,0.04)",

            color: "text.primary",
          }}
        >
          {getLinkIcon(link.url)}
        </Box>

        {/* ---------- Content ---------- */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            variant={
              displaySettings.cardType === "detailed"
                ? "subtitle1"
                : "body1"
            }
            fontWeight={600}
            sx={{
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {link.title || link.url}
          </Typography>

          {displaySettings.cardType === "detailed" && (
            <>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{
                  display: "block",
                  mt: 0.4,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {link.url}
              </Typography>

              {link.createdBy && (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ mt: 0.4, display: "block" }}
                >
                  Added by {getMemberName(link.createdBy)}
                </Typography>
              )}
            </>
          )}
        </Box>

        {/* ---------- Actions ---------- */}
        {trip?.createdBy === currentUseruid && (
          <Box
            className="link-actions"
            sx={{
              display: "flex",
              gap: 0.5,
              alignItems: "center",

              opacity: 0,
              transform: "translateY(4px)",
              transition: "all 0.2s ease",
            }}
          >
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                setEditingLink(link.id);
              }}
              sx={{
                background:
                  mode === "dark"
                    ? "rgba(255,255,255,0.08)"
                    : "rgba(0,0,0,0.05)",
              }}
            >
              <EditIcon fontSize="small" />
            </IconButton>

            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteLink(link.id);
              }}
              sx={{
                background:
                  mode === "dark"
                    ? "rgba(255,0,0,0.15)"
                    : "rgba(255,0,0,0.08)",
              }}
            >
              <CancelIcon color="error" fontSize="small" />
            </IconButton>
          </Box>
        )}
      </Box>
    ))}
  </Box>
      );
    };

    const goBack = () => navigate(-1);
    const inviteLink = `${window.location.origin}/join?trip=${id}`;
    const mapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(trip?.from || "")}&destination=${encodeURIComponent(trip?.to || "")}`;
    const now = new Date();
    const upcomingIndex = timeline.findIndex((item) => new Date(item.time) > now);
    const displayIconURL = trip?.iconURL || groupChatIcon || coverImage || "";
    // --- Render ---
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

              {currentUseruid === trip?.createdBy ? (
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
      <SettingsIcon />
    </Button>
  ) : (
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
      <InfoIcon />
    </Button>
  )}
          </Box>

          <Box
            sx={{
            backgroundImage:  `url(${displayIconURL})`,
             backgroundSize: "cover",
             backgroundPosition: "center",
             backgroundColor: mode === "dark" ? "#1d1d1dff" : "#ffffff",
             height: { xs: 470, sm: 320 },
             boxShadow: "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
           }}
         >
          {!displayIconURL && (
            <Box
              sx={{
                width: 120,
                height: 120,
                borderRadius: 2,
                backgroundColor: mode === "dark" ? "#222" : "#f2f2f2",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: mode === "dark" ? "#fff" : "#000",
                fontWeight: 600,
              }}
            >
              {trip?.name ? trip.name.charAt(0).toUpperCase() : "T"}
            </Box>
          )}
         </Box>

        <Container sx={{ py: 0, px: 0, position: "absolute", top: 250}}>

{weather && (
  <Box
    m={1.5}
    sx={{
      position: "relative",
      display: "flex",
      flexDirection: "column",
      gap: 1,
      background:
        mode === "dark"
          ? "linear-gradient(145deg, rgba(39, 39, 39, 0.35), rgba(25, 25, 25, 0.5))"
          : "linear-gradient(145deg, rgba(255,255,255,0.58), rgba(245, 245, 245, 0.52))",
      borderRadius: 4,
      width: 240,
      py: 1.5,
      px: 2,
      border:"none",
      backdropFilter: "blur(20px)",
      boxShadow:"none",
      cursor: "pointer",
      transition: "all 0.3s ease",
    }}
  >
    {/* Main Weather Row */}
    <Box
      display="flex"
      alignItems="center"
      justifyContent="space-between"
    >
      <Box display="flex" alignItems="center" gap={1.2}>
        <Box
          sx={{
            backgroundColor:
              mode === "dark" ? "rgba(255,255,255,0.05)" : "#ffffffb3",
            p: 0.1,
            borderRadius: "50%",
            boxShadow:
              mode === "dark"
                ? "0 0 8px rgba(255,255,255,0.05)"
                : "0 0 5px rgba(0,0,0,0.1)",
          }}
        >
      <Box
        sx={{
          fontSize: 28,
          opacity: 0.8,
        }}
      >
        {weather.temp > 32
          ? "🔥"
          : weather.temp < 10
          ? "❄️"
          : weather.description?.includes("rain")
          ? "🌧️"
          : weather.description?.includes("cloud")
          ? "⛅"
          : "☀️"}
      </Box>
        </Box>

        <Box>
          <Typography
            variant="h6"
            fontWeight="600"
            sx={{
              lineHeight: 1.1,
              color: mode === "dark" ? "#fff" : "#000",
            }}
          >
            {weather.temp ? `${Math.round(weather.temp)}°C` : "—"}
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{
              textTransform: "capitalize",
              letterSpacing: 0.2,
            }}
          >
            {weather.description || "N/A"}
          </Typography>
        </Box>
      </Box>

      {/* Small Icon for Conditions */}
    <Typography
      variant="caption"
      color="text.secondary"
      sx={{
        fontWeight: 400,
        letterSpacing: 0.3,
        textTransform: "uppercase",
      }}
    >
      in {trip?.location || "—"}
    </Typography>
    </Box>

  </Box>
)}

          <Container sx={{ borderRadius: 5, backgroundColor: mode === "dark" ? "#00000000" : "#ffffff50", backdropFilter: "blur(80px)", py: 2, pb: 6 }}>

          {/* Title + Edit */}
          <Box display="flex" flexDirection="column" gap={1} px={3} py={2}>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              {editMode ? (
<TextField
  value={editTrip.name}
  onChange={e => setEditTrip({ ...editTrip, name: e.target.value })}
  fullWidth
  variant="standard"
  sx={{
    mr: 2,
    fontSize: '2rem',
    fontWeight: 'bold',
    '& .MuiInputBase-input': {
      fontSize: '2rem',
      fontWeight: 'bold',
      lineHeight: 1.2,
      padding: 0,
    },
    '& .MuiInput-underline:before': {
      borderBottom: '1px solid',
    },
    '& .MuiInput-underline:hover:not(.Mui-disabled):before': {
      borderBottom: '2px solid',
      borderColor: theme => theme.palette.text.primary,
    },
    '& .MuiInput-underline:after': {
      borderBottom: '2px solid',
    },
  }}
/>

              ) : (
                <Typography variant="h3" fontWeight="bold">{trip?.name}</Typography>
              )}
{trip?.createdBy === currentUseruid && canUserDo('canEdit') && (
  <IconButton onClick={() => setEditMode(!editMode)} size="small">
    <Edit fontSize="small" />
  </IconButton>
)}

            </Box>

            <Typography sx={{ mt: 1 }}>
              {editMode ? (
                <TextField
                  value={editTrip.location}
                  onChange={e => setEditTrip({ ...editTrip, location: e.target.value })}
                  variant="standard"
                  sx={{
                    mr: 2,
                    fontWeight: 'bold',
                    '& .MuiInputBase-input': {
                      fontWeight: 'bold',
                      lineHeight: 1.2,
                      padding: 0,
                    },
                    '& .MuiInput-underline:before': {
                      borderBottom: '1px solid',
                    },
                    '& .MuiInput-underline:hover:not(.Mui-disabled):before': {
                      borderBottom: '2px solid',
                      borderColor: theme => theme.palette.text.primary,
                    },
                    '& .MuiInput-underline:after': {
                      borderBottom: '2px solid',
                    },
                  }}
                />
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ display: "flex" }}>
                  <LocationOn sx={{ fontSize: 16, mr: 0.5, color: mode === "dark" ? "#fff" : "#333" }} /> {trip?.location}
                </Typography>
              )}
            </Typography>
            <Typography>
<Box>
  {editMode ? (
    <Box display="flex" gap={2}>
      <TextField
        type="date"
        label="Start Date"
        value={editTrip.startDate || ""}
        onChange={(e) =>
          setEditTrip({ ...editTrip, startDate: e.target.value })
        }
        variant="standard"
        sx={{
          mr: 2,             // approximate size similar to h3
          fontWeight: 'bold',              // h3 is usually bold
          '& .MuiInputBase-input': {
            fontWeight: 'bold',
            lineHeight: 1.2,
            padding: 0,
          },
          '& .MuiInput-underline:before': {
            borderBottom: '1px solid',
          },
          '& .MuiInput-underline:hover:not(.Mui-disabled):before': {
            borderBottom: '2px solid',
            borderColor: theme => theme.palette.text.primary,
          },
          '& .MuiInput-underline:after': {
            borderBottom: '2px solid',
          },
        }}
      />
      <TextField
        type="date"
        label="End Date"
        value={editTrip.endDate || ""}
        onChange={(e) =>
          setEditTrip({ ...editTrip, endDate: e.target.value })
        }
        variant="standard"
        sx={{
          mr: 2,             // approximate size similar to h3
          fontWeight: 'bold',              // h3 is usually bold
          '& .MuiInputBase-input': {
            fontWeight: 'bold',
            lineHeight: 1.2,
            padding: 0,
          },
          '& .MuiInput-underline:before': {
            borderBottom: '1px solid',
          },
          '& .MuiInput-underline:hover:not(.Mui-disabled):before': {
            borderBottom: '2px solid',
            borderColor: theme => theme.palette.text.primary,
          },
          '& .MuiInput-underline:after': {
            borderBottom: '2px solid',
          },
        }}
      />
    </Box>
  ) : (
    <Typography variant="body2" color="text.secondary" sx={{ display: "flex" }}>
      <AccessTime sx={{ fontSize: 16, mr: 0.5 }} />
      {trip?.startDate && trip?.endDate
        ? `${new Date(trip.startDate).toDateString()} → ${new Date(
            trip.endDate
          ).toDateString()}`
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
      {editMode ? (
        <Box display="flex" gap={2} alignItems="center" width="100%">
          <TextField
            label="From"
            value={editTrip.from || ""}
            onChange={(e) => setEditTrip({ ...editTrip, from: e.target.value })}
            variant="standard"
            sx={{
              flex: 1,
              '& .MuiInput-underline:before': {
                borderBottom: '1px solid',
              },
              '& .MuiInput-underline:hover:not(.Mui-disabled):before': {
                borderBottom: '2px solid',
                borderColor: theme.palette.text.primary,
              },
              '& .MuiInput-underline:after': {
                borderBottom: '2px solid',
              },
            }}
          />
          <Typography>→</Typography>
          <TextField
            label="To"
            value={editTrip.to || ""}
            onChange={(e) => setEditTrip({ ...editTrip, to: e.target.value })}
            variant="standard"
            sx={{
              flex: 1,
              '& .MuiInput-underline:before': {
                borderBottom: '1px solid',
              },
              '& .MuiInput-underline:hover:not(.Mui-disabled):before': {
                borderBottom: '2px solid',
                borderColor: theme.palette.text.primary,
              },
              '& .MuiInput-underline:after': {
                borderBottom: '2px solid',
              },
            }}
          />
        </Box>
      ) : (
        <Typography variant="body1" fontWeight="bold" gutterBottom>
          {trip.from} → {trip.to}
        </Typography>
      )}
      <Button
        href={mapsUrl}
        target="_blank"
        rel="noopener noreferrer"
        sx={{
          backgroundColor: "#ffffff11",
          width: 40,
          height: 40,
          borderRadius: 8,
          color: mode === "dark" ? "#fff" : "#333",
        }}
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

<Box mt={3}>
  <Typography variant="h6" fontWeight="bold" mb={1}>
    Shared Trip Links
  </Typography>

{renderTripLinks()}

  {trip?.createdBy === currentUseruid && (
    <Button
      variant="contained"
      startIcon={<AddLinkIcon />}
      onClick={() => setLinkDrawerOpen(true)}
      sx={{
        borderRadius: 3,
        mt: 1,
        py: 1,
        fontWeight: "bold",
        backgroundColor: mode === "dark" ? "#fff" : "#000",
        color: mode === "dark" ? "#000" : "#fff",
        "&:hover": {
          backgroundColor: mode === "dark" ? "#f1f1f1" : "#111",
        },
      }}
    >
      Add Trip Link
    </Button>
  )}
</Box>


          </Box>

          {/* Snackbar */}
          <Snackbar
            open={snackbar.open}
            autoHideDuration={3000}
            onClose={() => setSnackbar({ ...snackbar, open: false })}
            message={snackbar.message}
          />

          <Container sx={{ mb: 4 }}>
            {/* Budget */}
            <Box sx={{ mt: 0, p: 2 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="h6">Budget</Typography>
                <Box>
                  <>
                  {trip?.createdBy === currentUseruid && (
                    <Button size="small" color={theme.palette.text.primary} onClick={() => setBudgetDrawerOpen(true)}>Edit</Button>
                  )}
                  {trip?.createdBy === currentUseruid && canUserDo('canAddExpenses') && (
                    <Button size="small" color={theme.palette.text.primary} onClick={() => setExpenseDrawerOpen(true)} sx={{ ml: 1 }}>
                      Add Expense
                    </Button>
                  )}
                  </>
                </Box>
              </Box>

              <Typography variant="body2" sx={{ mt: 1 }}>
                ₹{budget?.used || 0} used of ₹{budget?.total || 0}
              </Typography>

              <LinearProgress
                value={budget?.total ? (budget.used / budget.total) * 100 : 0}
                variant="determinate"
                sx={{
                  mt: 0.5,
                  borderRadius: 20,
                  height: 7,
                  bgcolor: mode === "dark" ? "#ffffff36" : "#00000018",
                  "& .MuiLinearProgress-bar": { bgcolor: mode === "dark" ? "#ffffff" : "#3d3d3dff", borderRadius: 20 },
                }}
              />
              
{(budget?.contributors?.length > 0 || budget?.expenses?.length > 0) && (
  <Box mt={3}>
    {/* ---------- Contributors Section ---------- */}
    {budget?.contributors?.length > 0 && (
      <Box
        sx={{
          borderRadius: 3,
          mb: 1,
          transition: "all 0.3s ease",
        }}
      >
        {/* Header */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            cursor: "pointer",
            userSelect: "none",
          }}
          onClick={() => setOpen(!open)}
        >
          <Typography
            variant="subtitle1"
            sx={{
              fontWeight: 600,
              color: theme.palette.text.primary,
            }}
          >
            Contributions
          </Typography>
          <IconButton
            size="small"
            sx={{
              transform: open ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 0.3s ease",
            }}
          >
            <ExpandMoreIcon />
          </IconButton>
        </Box>

        <Collapse in={open} timeout={400}>
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Divider sx={{ my: 1.5 }} />
            {budget.contributors.map((c, i) => {
              const intendedContribution = Number(c.amount) || 0;
              const actualPaid = calculateMemberPayments(c.uid);
              const remaining = intendedContribution - actualPaid;

              return (
                <Box
                  key={i}
                  sx={{
                    mb: 1.5,
                    borderRadius: 2,
                    transition: "all 0.3s ease",
                  }}
                >
                  <Typography variant="body2" fontWeight="bold">
                    {getMemberName(c.uid)} — ₹{intendedContribution.toFixed(2)}
                  </Typography>

                  <Typography
                    variant="caption"
                    display="flex"
                    justifyContent="space-between"
                    mt={0.3}
                    color="text.secondary"
                  >
                    Paid:
                    <Typography
                      component="span"
                      fontWeight="medium"
                      color={
                        actualPaid >= intendedContribution
                          ? "error.main"
                          : "text.primary"
                      }
                    >
                      ₹{actualPaid.toFixed(2)}
                    </Typography>
                  </Typography>

                  <Typography
                    variant="caption"
                    display="flex"
                    justifyContent="space-between"
                    color="text.secondary"
                  >
                    Remaining:
                    <Typography
                      component="span"
                      fontWeight="bold"
                      color={remaining > 0 ? "success.main" : "error.main"}
                    >
                      ₹{remaining < 0 ? "-" : ""}{Math.abs(remaining).toFixed(2)}
                    </Typography>
                  </Typography>
                </Box>
              );
            })}
          </motion.div>
        </Collapse>
      </Box>
    )}

    {/* ---------- Expenses Section ---------- */}
    {budget.expenses?.length > 0 && (
      <Box
        sx={{
          borderRadius: 3,
        }}
      >
        <Typography
          variant="subtitle2"
          color="text.secondary"
          sx={{ mb: 1.5, fontWeight: 600 }}
        >
          Expenses
        </Typography>

{visibleExpenses.map((exp, idx) => {
  const canEdit =
    exp.payers?.some((p) => p.uid === currentUseruid) ||
    exp.paidBy === currentUseruid;

  const payers = exp.payers?.length
    ? exp.payers
    : exp.paidBy
    ? [{ uid: exp.paidBy, amount: exp.amount }]
    : [];

  return (
    <Box
      key={idx}
      sx={{
        p: 1.5,
        mb: 1.2,
        borderRadius: 3,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 1.5,

        background:
          mode === "dark"
            ? "linear-gradient(145deg, rgba(255,255,255,0.05), rgba(255,255,255,0.015))"
            : "linear-gradient(145deg, #ffffff, #f8f8f8)",

        border:
          mode === "dark"
            ? "1px solid rgba(255,255,255,0.08)"
            : "1px solid rgba(0,0,0,0.06)",

        transition: "all 0.2s ease",

        "&:hover": {
          transform: "translateY(-2px)",
          boxShadow:
            mode === "dark"
              ? "0 8px 22px rgba(0,0,0,0.6)"
              : "0 8px 22px rgba(0,0,0,0.08)",
        },
      }}
    >
      {/* ---------- Left: Expense Info ---------- */}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography
          variant="body1"
          fontWeight={600}
          sx={{
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {exp.name || "Unnamed Expense"}
        </Typography>

        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: "block", mt: 0.2 }}
        >
          ₹{exp.amount}
        </Typography>
      </Box>

      {/* ---------- Payers Avatar Group ---------- */}
      <AvatarGroup
        max={3}
        sx={{
          "& .MuiAvatar-root": {
            width: 28,
            height: 28,
            fontSize: 12,
            border: "2px solid",
            borderColor: mode === "dark" ? "#000" : "#fff",
          },
        }}
      >
        {payers.map((p) => {
          const member = memberDetails.find((m) => m.uid === p.uid);
          return (
            <Tooltip
              key={p.uid}
              title={`${member?.name || "Member"} — ₹${p.amount}`}
            >
              <Avatar src={member?.photoURL}>
                {(!member?.photoURL &&
                  (member?.name || "M")[0]) ||
                  null}
              </Avatar>
            </Tooltip>
          );
        })}
      </AvatarGroup>

      {/* ---------- Right: Meta + Actions ---------- */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          flexShrink: 0,
        }}
      >
        {/* Category Chip */}
        <Typography
          variant="caption"
          sx={{
            px: 1,
            py: 0.4,
            borderRadius: 1.5,
            background:
              mode === "dark"
                ? "rgba(255,255,255,0.1)"
                : "rgba(0,0,0,0.06)",
            fontWeight: 500,
            whiteSpace: "nowrap",
          }}
        >
          {exp.category || "General"}
        </Typography>

        {/* Edit Action */}
        {canEdit && (
          <IconButton
            size="small"
            onClick={() => {
              setEditingExpense(exp);
              setNewExpense({
                name: exp.name,
                amount: exp.amount.toString(),
                category: exp.category,
                date: exp.date,
                time: exp.time,
                paidBy: exp.paidBy || exp.payers?.[0]?.uid,
                splitMode: exp.splitMode || "single_payer",
              });
              setExpenseContributors(
                memberDetails.map((member) => ({
                  uid: member.uid,
                  name: member.name || "Unknown",
                  photoURL: member.photoURL,
                  included:
                    exp.payers?.some((p) => p.uid === member.uid) ||
                    exp.paidBy === member.uid,
                  paidAmount:
                    exp.payers?.find((p) => p.uid === member.uid)?.amount ||
                    (exp.paidBy === member.uid ? exp.amount : 0),
                }))
              );
              setExpenseDrawerOpen(true);
            }}
            sx={{
              background:
                mode === "dark"
                  ? "rgba(255,255,255,0.08)"
                  : "rgba(0,0,0,0.05)",
            }}
          >
            <EditIcon fontSize="small" />
          </IconButton>
        )}
      </Box>
    </Box>
  );
})}


        {budget.expenses.length > 4 && (
          <Button
            onClick={() => setShowAllExpenses(!showAllExpenses)}
            size="small"
            variant="text"
            sx={{
              mt: 1.5,
              textTransform: 'none',
              color: mode === 'dark' ? '#90caf9' : '#1976d2',
            }}
          >
            {showAllExpenses ? 'Hide' : 'View More'}
          </Button>
        )}
      </Box>
    )}
  </Box>
)}


            </Box>

            {/* Checklist */}
          <Box sx={{ mt: 4, p: 2 }}>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <Typography variant="h5" gutterBottom>
                Checklist
              </Typography>
              <Button
                variant="outlined"
                onClick={() => setChecklistDrawerOpen(true)}
                sx={{ px: 2, color: theme.palette.text.primary, border: "none", backgroundColor: mode === 'dark' ? '#ffffff10' : '#00000010', borderRadius: 8 }}
              >
                + Add
              </Button>
            </Box>

<Box sx={{ position: "relative", backgroundColor: "transparent" }}>
  <List
    sx={{
      maxHeight: "200px",
      overflowY: "auto",
      scrollbarWidth: "none",
      pb: 4,
    }}
  >

{checklist.map((task) => (
  <ListItem
    key={task.id}
    onClick={() => toggleTask(task)}
    disableGutters
    sx={{
      backgroundColor: task.completed
        ? (mode === "dark" ? "#00000000" : "transparent")
        : (mode === "dark" ? "#f1f1f106" : "#00000006"),
      mb: 0.5,
      borderRadius: 2,
    }}
  >
    <ListItemIcon>
      <Checkbox
        checked={task.completed}
        onChange={() => toggleTask(task)}
        color="success"
        sx={{ color: task.completed ? undefined : "#999" }}
        inputProps={{ 'aria-label': 'Toggle checklist item' }}
      />
    </ListItemIcon>
    <ListItemText
      primary={
        editingChecklist === task.id ? (
          <TextField
            fullWidth
            defaultValue={task.text}
            onBlur={(e) => updateChecklistItem(task.id, e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                updateChecklistItem(task.id, e.target.value);
              }
            }}
            autoFocus
            variant="standard"
            sx={{
              '& .MuiInput-underline:before': { borderBottom: '1px solid' },
              '& .MuiInput-underline:after': { borderBottom: '2px solid' },
            }}
          />
        ) : (
          <Typography
            sx={{
              textDecoration: task.completed ? "line-through" : "none",
              color: task.completed ? "#888" : "inherit",
              userSelect: "text",
            }}
          >
            {task.text}
          </Typography>
        )
      }
    />
    {!editingChecklist && (
      <IconButton
        size="small"
        onClick={(e) => {
          e.stopPropagation();
          setEditingChecklist(task.id);
        }}
      >
        <EditIcon fontSize="small" />
      </IconButton>
    )}
  </ListItem>
))}
  </List>


  <Box
    sx={{
      position: "absolute",
      bottom: "-2px",
      left: "-2px",
      right: "-2px",
      height: 60,
      background: mode === "dark" ? 'linear-gradient(to top, #0c0c0c, #0c0c0cd9, #0c0c0cc9, #0c0c0c90, #0c0c0c00)' : 'linear-gradient(to top, #ffffff, #ffffffd9, #ffffffc9, #ffffff90, #ffffff00)',
      pointerEvents: "none", // allows interaction with list behind
      borderBottomLeftRadius: 8,
      borderBottomRightRadius: 8,
      pt: 6
    }}
  />

<Button
  variant="text"
  size="small"
  fullWidth
  onClick={() => setChecklistViewAllOpen(true)}
  sx={{
    textTransform: "none",
    color: theme => theme.palette.mode === 'dark' ? '#fff' : '#000',
    backgroundColor: mode === 'dark' ? '#ffffff10' : '#00000010',
    fontWeight: 500,
    borderRadius: 8,
    px: 1.5,
    py: 1,
  }}
>
  View All
</Button>

</Box>

          </Box>


<Divider sx={{ my: 2 }} />

{/* Surprise Reveal Card — visible only to creator */}
{timeline.some(
  (event) =>
    event.surprise &&
    event.createdBy === currentUseruid &&
    !event.revealed
) && (
  <Card
    sx={{
      mb: 2,
      borderRadius: 4,
      background:
        mode === "dark"
          ? "linear-gradient(145deg, #111, #222)"
          : "linear-gradient(145deg, #fff, #f3f3f3)",
      boxShadow:
        mode === "dark"
          ? "0 0 20px rgba(255,255,255,0.05)"
          : "0 0 10px rgba(0,0,0,0.05)",
      p: 3,
      display: "flex",
      flexDirection: "column",
      gap: 1,
      alignItems: "center",
      justifyContent: "center",
    }}
  >
    <CelebrationIcon
      sx={{
        fontSize: 40,
        color: mode === "dark" ? "#fff" : "#000",
        mb: 1,
      }}
    />
    <Typography fontWeight="bold" fontSize={18}>
      You have surprise events hidden from others!
    </Typography>
    <Typography color="text.secondary" fontSize={14}>
      You can reveal them manually or let them auto-reveal on schedule.
    </Typography>
    <Button
      variant="contained"
      onClick={revealAllSurprises}
      sx={{
        mt: 2,
        borderRadius: 3,
        px: 4,
        py: 1,
        fontWeight: "bold",
        backgroundColor: mode === "dark" ? "#fff" : "#000",
        color: mode === "dark" ? "#000" : "#fff",
        "&:hover": {
          backgroundColor: mode === "dark" ? "#f3f3f3" : "#222",
        },
      }}
    >
      Reveal All Surprises Now
    </Button>
  </Card>
)}


            {/* Timeline */}
<Box sx={{ mt: 4, px: 2, py: 1 }}>
  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
  <Typography variant="h5" gutterBottom>
    Trip Timeline
  </Typography>
  
  <Button
    variant="outlined"
    onClick={() => setTimelineDrawerOpen(true)}
    sx={{ px: 2, color: theme.palette.text.primary, border: "none", backgroundColor: mode === 'dark' ? '#ffffff10' : '#00000010', borderRadius: 8 }}
  >
    + Add
  </Button>
  </Box>
  
<Box sx={{ position: "relative" }}>
{timeline.length === 0 ? (
  <Typography
    variant="body2"
    color="text.secondary"
    backgroundColor="transparent"
    sx={{ pb: 5, mb: 3, textAlign: "center" }}
  >
    No events added yet.
  </Typography>
) : (
  <List
    sx={{
      maxHeight: "300px",
      overflowY: "auto",
      scrollbarWidth: "none",
      pb: 5,
      mb: 1,
    }}
  >
{timeline.map((item, index) => {
  const itemTime = new Date(item.time);
  const isCompleted = item.completed;
  const isCreator = trip?.createdBy === currentUseruid; // Add this line
  const isUpcoming =
    !isCompleted &&
    itemTime > new Date() &&
    timeline.findIndex(
      (e) => new Date(e.time) > new Date() && !e.completed
    ) === index;

  const isLocked =
    item.surprise &&
    !item.revealed &&
    !isCreator &&
    (!item.revealAt || new Date(item.revealAt) > new Date());
  const canReveal =
    item.surprise && isCreator && !item.revealed;

  return (
    <ListItem
      key={item.id}
      sx={{
        backgroundColor: isLocked
          ? mode === "dark"
            ? "#292929"
            : "#f4f4f4"
          : isUpcoming
          ? "#bc751835"
          : isCompleted
          ? mode === "dark"
            ? "#000000"
            : "#ffffff"
          : mode === "dark"
          ? "#1c1c1c"
          : "#f0f0f0ff",
        borderRadius: 3,
        mb: 1,
        px: 2,
        py: 1,
        border: isUpcoming
          ? "2px solid #bc7518ff"
          : isLocked
          ? "1px dashed #888"
          : "none",
        boxShadow: isUpcoming
          ? "0 0 10px #bc751880"
          : "none",
        display: "flex",
        alignItems: "center",
        transition: "all 0.2s ease",
      }}
      secondaryAction={
        isCompleted &&
        trip?.createdBy === currentUseruid && (
          <IconButton onClick={() => deleteTimelineEvent(item.id)}>
            <CancelIcon color="error" />
          </IconButton>
        )
      }
    >
      {!isLocked && (
        <ListItemIcon>
          <Checkbox
            checked={isCompleted}
            onChange={() => toggleEventCompleted(item)}
            sx={{ color: "#999" }}
          />
        </ListItemIcon>
      )}

      <ListItemText
        primary={
          editingTimeline === item.id ? (
            <Box>
              <TextField
                fullWidth
                label="Title"
                defaultValue={item.title}
                onChange={(e) => setEditingTimeline({ ...editingTimeline, title: e.target.value })}
                sx={{ mb: 1 }}
              />
              <TextField
                fullWidth
                type="datetime-local"
                label="Time"
                defaultValue={item.time}
                onChange={(e) => setEditingTimeline({ ...editingTimeline, time: e.target.value })}
                sx={{ mb: 1 }}
              />
              <TextField
                fullWidth
                multiline
                rows={2}
                label="Note"
                defaultValue={item.note || ""}
                onChange={(e) => setEditingTimeline({ ...editingTimeline, note: e.target.value })}
              />
              <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
                <Button
                  size="small"
                  onClick={() => updateTimelineEvent(item.id, editingTimeline)}
                >
                  Save
                </Button>
                <Button
                  size="small"
                  onClick={() => setEditingTimeline(null)}
                >
                  Cancel
                </Button>
              </Box>
            </Box>
          ) : (
            <Typography
              variant="body1"
              fontWeight={
                isLocked
                  ? "bold"
                  : isUpcoming
                  ? "bold"
                  : isCompleted
                  ? "normal"
                  : "medium"
              }
              color={
                isLocked
                  ? "text.secondary"
                  : isCompleted
                  ? "#888"
                  : theme.palette.text.primary
              }
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 0.8,
                textDecoration: isCompleted ? "line-through" : "none",
              }}
            >
              {isLocked ? (
                <>
                  <LockOutlinedIcon
                    sx={{
                      fontSize: 18,
                      color: mode === "dark" ? "#bbb" : "#555",
                    }}
                  />
                  🎁 Surprise Locked
                </>
              ) : (
                item.title
              )}
            </Typography>
          )
        }
        secondary={
          !editingTimeline && (
            <>
              {isLocked ? (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ fontStyle: "italic" }}
                >
                  Planned secretly by{" "}
                  <b>{getMemberName(item.createdBy) || "a member"}</b>
                </Typography>
              ) : (
                <Typography variant="caption" color="text.secondary">
                  {itemTime.toLocaleString()}
                  {item.note && ` — ${item.note}`}
                </Typography>
              )}
            </>
          )
        }
      />

      {!editingTimeline && !isLocked && (
        <IconButton
          size="small"
          onClick={() => setEditingTimeline(item)}
        >
          <EditIcon fontSize="small" />
        </IconButton>
      )}

      {canReveal && (
        <Button
          size="small"
          variant="outlined"
          sx={{
            ml: 1,
            borderRadius: 2,
            textTransform: "none",
            borderColor:
              mode === "dark" ? "#ffffff60" : "#00000060",
            color: mode === "dark" ? "#fff" : "#000",
            "&:hover": {
              backgroundColor:
                mode === "dark" ? "#ffffff20" : "#00000010",
            },
          }}
          onClick={() => revealSurpriseEvent(item.id)}
        >
          Reveal Now
        </Button>
      )}
    </ListItem>
  );
})}
  </List>
)}

    <Box
    sx={{
      position: "absolute",
      bottom: "-2px",
      left: "-2px",
      right: "-2px",
      height: 60,
      background: mode === "dark" ? 'linear-gradient(to top, #0c0c0c, #0c0c0cd9, #0c0c0cc9, #0c0c0c90, #0c0c0c00)' : 'linear-gradient(to top, #ffffff, #ffffffd9, #ffffffc9, #ffffff90, #ffffff00)',
      pointerEvents: "none", // allows interaction with list behind
      borderBottomLeftRadius: 8,
      borderBottomRightRadius: 8,
    }}
  />
</Box>

  <Button
    variant="text"
    size="small"
    fullWidth
    onClick={() => setTimelineAllDrawerOpen(true)}
    sx={{
      textTransform: "none",
      color: theme => theme.palette.mode === 'dark' ? '#fff' : '#000',
      backgroundColor: mode === 'dark' ? '#ffffff10' : '#00000010',
      fontWeight: 500,
      borderRadius: 8,
      px: 1.5,
      py: 1,
    }}
  >
    View All
  </Button>

</Box>


<Divider sx={{ my: 2 }} />

            {/* Chat Button */}
          <Box mt={4} mx={2}>
            <Typography variant="h6" gutterBottom>
              Members
            </Typography>
<List dense>
  {memberDetails.map((user) => (
    <ListItem
      key={user.uid}
      disableGutters
      sx={{
        borderRadius: 3,
        mb: 1,
        py: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        transition: "all 0.2s ease",
      }}
    >
      <Box
        display="flex"
        alignItems="center"
        gap={1.5}
        sx={{ cursor: "pointer" }}
        onClick={() => navigate(`/chat/${user.uid}`)}
      >
        <Avatar src={user.photoURL} sx={{ width: 40, height: 40 }} />
        <Box>
          <Typography fontWeight="medium">
            {user.uid === currentUseruid
              ? `${user.name || "You"} (Me)`
              : user.name || "Unknown"}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {user.email}
          </Typography>
        </Box>
      </Box>

      {/* Only show remove button to trip creator */}
      {tripAdmins.includes(currentUseruid) && user.uid !== currentUseruid && (
        <Tooltip title="Remove Member">
          <IconButton
            size="small"
            color="error"
            onClick={(e) => {
              e.stopPropagation();
              setMemberToRemove(user.uid);
            }}
            sx={{
              backgroundColor:
                mode === "dark" ? "#ff000015" : "#ff000010",
              "&:hover": {
                backgroundColor:
                  mode === "dark" ? "#ff000025" : "#ff000020",
              },
              borderRadius: 2,
            }}
          >
            <DeleteOutlineIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}
    </ListItem>
  ))}
</List>

<motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
<Dialog
  open={!!memberToRemove}
  onClose={() => setMemberToRemove(null)}
  PaperProps={{
    sx: {
      borderRadius: 4,
      background:
        mode === "dark"
          ? "linear-gradient(145deg, #1a1a1a3b, rgba(34, 34, 34, 0.2))"
          : "linear-gradient(145deg, #fff, #f9f9f9)",
      boxShadow: "none",
      backgroundImage: "none",
      p: 2,
      backdropFilter: "blur(26px)",
      width: "100%",
      maxWidth: 400,
    },
  }}
  TransitionProps={{
    timeout: 300,
  }}
>
  <DialogTitle
    sx={{
      textAlign: "center",
      fontWeight: "700",
      fontSize: "1.2rem",
      color: mode === "dark" ? "#fff" : "#000",
      pb: 0,
    }}
  >
    Remove Member
  </DialogTitle>

  <DialogContent sx={{ textAlign: "center", mt: 2 }}>
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      gap={1.5}
    >
      <Box
        sx={{
          width: 60,
          height: 60,
          borderRadius: "50%",
          backgroundColor: mode === "dark" ? "#2a0000" : "#ffebee",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "none",
          mb: 1,
        }}
      >
        <Typography sx={{ fontSize: 30 }}>🚫</Typography>
      </Box>

      <Typography
        variant="body1"
        color="text.primary"
        sx={{
          fontWeight: 500,
          px: 2,
        }}
      >
        Are you sure you want to remove this member from the trip?
      </Typography>

      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ fontStyle: "italic" }}
      >
        This action can’t be undone.
      </Typography>
    </Box>
  </DialogContent>

  <DialogActions
    sx={{
      justifyContent: "center",
      mt: 1,
      pb: 2,
      gap: 1.5,
    }}
  >
    <Button
      variant="outlined"
      onClick={() => setMemberToRemove(null)}
      sx={{
        textTransform: "none",
        borderRadius: 3,
        px: 3,
        fontWeight: 600,
        borderColor: mode === "dark" ? "#888" : "#ccc",
        color: mode === "dark" ? "#fff" : "#000",
        "&:hover": {
          borderColor: mode === "dark" ? "#aaa" : "#000",
          backgroundColor: mode === "dark" ? "#222" : "#f0f0f0",
        },
      }}
    >
      Cancel
    </Button>

    <Button
      variant="contained"
      color="error"
      onClick={confirmRemoveMember}
      sx={{
        textTransform: "none",
        borderRadius: 3,
        px: 3,
        fontWeight: 600,
        boxShadow: "none",
        backgroundColor: "#e53935",
        "&:hover": {
          backgroundColor: "#c62828",
        },
      }}
    >
      Remove
    </Button>
  </DialogActions>
</Dialog>
</motion.div>

            <Button
              variant="outlined"
              fullWidth
              sx={{ mt: 2, color: theme.palette.text.primary, borderColor: mode === "dark" ? "#fff" : "#000", borderRadius: 3 }}
              onClick={() => setShareDrawerOpen(true)}
            >
              Invite Members
            </Button>

<Divider sx={{ my: 2 }} />

{trip?.createdBy === currentUseruid && (
  <Button
    variant="outlined"
    fullWidth
    startIcon={<DeleteOutlineIcon />}
    color="error"
    sx={{ mt: 1, borderRadius: 3, backgroundColor: "#ff000010" }}
    onClick={() => setConfirmDeleteOpen(true)} // ✅ Corrected here
  >
    Delete Trip
  </Button>
)}


          </Box>


          </Container>
          </Container>
        </Container>

            {/* Sub-components (drawers, dialogs) */}
            <ShareDrawer shareDrawerOpen={shareDrawerOpen} setShareDrawerOpen={setShareDrawerOpen} inviteLink={inviteLink} trip={trip} mode={mode} generateSharePoster={() => {}} setSnackbar={setSnackbar} />

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
            />

            <BudgetDrawer budgetDrawerOpen={budgetDrawerOpen} setBudgetDrawerOpen={setBudgetDrawerOpen} editBudget={editBudget} setEditBudget={setEditBudget} saveBudget={saveBudget} mode={mode} />

            <ExpenseDrawer
                expenseDrawerOpen={expenseDrawerOpen}
                setExpenseDrawerOpen={setExpenseDrawerOpen}
                newExpense={newExpense}
                setNewExpense={setNewExpense}
                expenseContributors={expenseContributors}
                setExpenseContributors={setExpenseContributors}
                memberDetails={memberDetails}
                currentUseruid={currentUseruid}
                getMemberName={getMemberName}
                initializeExpenseContributors={initializeExpenseContributors}
                addExpense={addExpense}
                updateExpense={updateExpense}
                editingExpense={editingExpense}
                mode={mode}
                theme={theme}
            />

            <LinkDrawer linkDrawerOpen={linkDrawerOpen} setLinkDrawerOpen={setLinkDrawerOpen} newLink={newLink} setNewLink={setNewLink} handleAddLink={handleAddLink} mode={mode} />
            
            <SettingsDrawer
                settingsDrawerOpen={settingsDrawerOpen}
                setSettingsDrawerOpen={setSettingsDrawerOpen}
                trip={trip}
                tripAdmins={tripAdmins}
                memberDetails={memberDetails}
                tripPermissions={tripPermissions}
                updatePermissions={async (p) => { await updateDoc(doc(db, "trips", id), { permissions: p }); setTripPermissions(p); setSnackbar({ open: true, message: "Permissions updated!" }); }}
                promoteToAdmin={async (uid) => { const newAdmins = [...tripAdmins, uid]; await updateDoc(doc(db, "trips", id), { admins: newAdmins }); setTripAdmins(newAdmins); setSnackbar({ open: true, message: "Member promoted to admin!" }); }}
                demoteAdmin={async (uid) => { const newAdmins = tripAdmins.filter((a) => a !== uid); await updateDoc(doc(db, "trips", id), { admins: newAdmins }); setTripAdmins(newAdmins); setSnackbar({ open: true, message: "Admin demoted!" }); }}
                mode={mode}
                setMode={setMode}
                accent={accent}
                setAccent={setAccent}
                confirmDeleteOpen={confirmDeleteOpen}
                setConfirmDeleteOpen={setConfirmDeleteOpen}
                getMemberName={getMemberName}
                currentUseruid={currentUseruid}
                displaySettings={displaySettings}
                updateDisplaySettings={updateDisplaySettings}
            />

            <ConfirmDeleteDialog confirmDeleteOpen={confirmDeleteOpen} setConfirmDeleteOpen={setConfirmDeleteOpen} handleDeleteTrip={handleDeleteTrip} mode={mode} />

            <ChecklistViewAllDrawer checklistViewAllOpen={checklistViewAllOpen} setChecklistViewAllOpen={setChecklistViewAllOpen} checklist={checklist} toggleTask={toggleTask} mode={mode} />

            <TimelineAllDrawer timelineAllDrawerOpen={timelineAllDrawerOpen} setTimelineAllDrawerOpen={setTimelineAllDrawerOpen} timeline={timeline} toggleEventCompleted={toggleEventCompleted} mode={mode} />

            {/* Snackbar */}
            <Snackbar open={!!snackbar.open} autoHideDuration={3000} message={snackbar.message} onClose={() => setSnackbar({ open: false, message: "" })} />
        </Box>
    );
}