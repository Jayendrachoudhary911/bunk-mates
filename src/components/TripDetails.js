import React, { useEffect, useState } from "react";
import {
  Box, Typography, Container, AvatarGroup, Avatar, LinearProgress,
  Button, Card, CardContent, List, ListItem, ListItemIcon, ListItemText,
  Divider, IconButton, TextField, Dialog, DialogTitle, DialogContent,
  DialogActions, Snackbar, InputAdornment, Drawer,
  SwipeableDrawer, Paper, Checkbox, Tooltip, Collapse, useTheme
} from "@mui/material";
import {
  LocationOn, AccessTime, CheckCircle, Cancel, Edit, Add, ContentCopy
} from "@mui/icons-material";
import { useParams, useNavigate } from "react-router-dom";
import {
  getDoc, doc, updateDoc, collection, addDoc, onSnapshot,
  query, getDocs, deleteDoc, setDoc
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { db } from "../firebase";
import { QRCodeSVG } from "qrcode.react";
import ShareIcon from "@mui/icons-material/Share";
import DirectionsIcon from "@mui/icons-material/Directions";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import GroupIcon from "@mui/icons-material/Group";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import TelegramIcon from '@mui/icons-material/Telegram';
import InstagramIcon from '@mui/icons-material/Instagram';
import TwitterIcon from '@mui/icons-material/Twitter';
import CloseOutlinedIcon from '@mui/icons-material/CloseOutlined';
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { useWeather } from "../contexts/WeatherContext";
import { useThemeToggle } from "../contexts/ThemeToggleContext";
import { getTheme } from "../theme";
import { motion } from "framer-motion";


export default function TripDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const auth = getAuth();
  const currentUser = auth.currentUser;
  const currentUseruid = currentUser ? currentUser.uid : null;

  const [trip, setTrip] = useState(null);
  const [coverImage, setCoverImage] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [editTrip, setEditTrip] = useState({});
  const [checklist, setChecklist] = useState([]);
  const [checklistDrawerOpen, setChecklistDrawerOpen] = useState(false);
  const [newTask, setNewTask] = useState("");
  const [budget, setBudget] = useState(null);
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

  const unsubTimeline = onSnapshot(collection(db, `trips/${id}/timeline`), (snap) => {
  const events = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  const sorted = events.sort((a, b) => new Date(a.time) - new Date(b.time));
    setTimeline(sorted);
  });

  const { mode, setMode, accent, setAccent, toggleTheme } = useThemeToggle();
  const theme = getTheme(mode, accent);

  // New states for expenses drawer
  const [expenseDrawerOpen, setExpenseDrawerOpen] = useState(false);
  const [newExpense, setNewExpense] = useState({
    name: "",
    amount: "",
    category: "",
    date: "",
    time: "",
    paidBy: currentUseruid,
    splitMode: 'single_payer',
  });
  const [expenseContributors, setExpenseContributors] = useState([]);
  const [showAllExpenses, setShowAllExpenses] = useState(false);
const visibleExpenses = showAllExpenses
  ? budget?.expenses || []
  : (budget?.expenses || []).slice(0, 4);

  const [memberDetails, setMemberDetails] = useState([]);

useEffect(() => {
  if (!id) return;

  // Real-time listener for trip document
  fetchTripData();
  const tripDocRef = doc(db, "trips", id);
  const unsubscribeTrip = onSnapshot(tripDocRef, (docSnap) => {
    if (docSnap.exists()) {
      const tripData = docSnap.data();

      setTrip(prev => ({
        ...prev,
        ...tripData,
      }));

      setEditTrip(tripData);

      // Optionally, update cover image if location or name changed
      const imageQuery = tripData.name || tripData.location || "travel";
      fetchCoverImage(imageQuery).then(setCoverImage).catch(() => {});

      // Load members if present
      if (tripData.members?.length) {
        loadMemberDetails(tripData.members);
      }
    }
  });

  // Existing listeners for checklist, photos, timeline remain unchanged

  const unsubChecklist = onSnapshot(collection(db, `trips/${id}/checklist`), snapshot => {
    setChecklist(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  });

  const unsubPhotos = onSnapshot(collection(db, `trips/${id}/photos`), snap => {
    setPhotos(snap.docs.map(doc => doc.data().url));
  });

  const unsubTimeline = onSnapshot(collection(db, `trips/${id}/timeline`), snap => {
    const events = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const sorted = events.sort((a, b) => new Date(a.time) - new Date(b.time));
    setTimeline(sorted);
  });

  // Cleanup on unmount or id change
  return () => {
    unsubscribeTrip();
    unsubChecklist();
    unsubPhotos();
    unsubTimeline();
  };
}, [id]);

  
const handleChecklistFileUpload = (event) => {
  const file = event.target.files[0];
  if (!file) return;

  const validTypes = ['text/plain', 'text/markdown', 'text/x-markdown'];
  if (!validTypes.includes(file.type) && !file.name.match(/\.(txt|md)$/i)) {
    setSnackbar({ open: true, message: "Unsupported file type. Please upload .txt or .md files." });
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    const text = e.target.result;
    // Split lines and filter out empty lines and trim
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    if (lines.length > 0) {
      setChecklistDrafts(lines);
    } else {
      setSnackbar({ open: true, message: "No valid checklist items found in file." });
    }
  };
  reader.readAsText(file);
};

// Update a single draft checklist item
const updateChecklistDraft = (index, value) => {
  setChecklistDrafts(prev => {
    const updated = [...prev];
    updated[index] = value;
    return updated;
  });
};

const calculateMemberPayments = (memberUid) => {
    if (!budget?.expenses) return 0;
    
    // Sum payments from all expenses where the member is listed in the 'payers' array
    return budget.expenses.reduce((totalPaid, exp) => {
        if (exp.payers && exp.payers.length > 0) {
            const memberPayment = exp.payers.find(p => p.uid === memberUid);
            if (memberPayment) {
                totalPaid += Number(memberPayment.amount) || 0;
            }
        } else if (exp.paidBy === memberUid) {
            // Include support for legacy single-payer expenses (amount paid = total expense amount)
            totalPaid += Number(exp.amount) || 0;
        }
        return totalPaid;
    }, 0);
};

// Remove a draft checklist item
const removeChecklistDraft = (index) => {
  setChecklistDrafts(prev => prev.filter((_, i) => i !== index));
};

// Add empty draft checklist item
const addEmptyChecklistDraft = () => {
  setChecklistDrafts(prev => [...prev, ""]);
};

// Save all draft checklist items to Firestore, then clear and close drawer
const addAllChecklistItems = async () => {
  if (checklistDrafts.length === 0) {
    setSnackbar({ open: true, message: "No checklist items to add." });
    return;
  }
  setUploadingBatch(true);
  try {
    const batchPromises = checklistDrafts.map(text =>
      addDoc(collection(db, `trips/${id}/checklist`), { text, completed: false })
    );
    await Promise.all(batchPromises);
    setSnackbar({ open: true, message: `${checklistDrafts.length} checklist item(s) added!` });
    setChecklistDrafts([]);
    setChecklistDrawerOpen(false);
  } catch (error) {
    setSnackbar({ open: true, message: "Failed to add checklist items." });
    console.error(error);
  }
  setUploadingBatch(false);
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

  // Fetch personal budget
  fetchBudget(tripData.name);

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

const loadMemberDetails = (uids) => {
  const userDetailsUnsubs = [];

  const members = [];

  uids.forEach(uid => {
    const userDocRef = doc(db, "users", uid);
    const unsubscribe = onSnapshot(userDocRef, snapshot => {
      if (snapshot.exists()) {
        // update or add member info
        const userData = { uid: snapshot.id, ...snapshot.data() };

        const index = members.findIndex(m => m.uid === uid);
        if (index !== -1) {
          members[index] = userData;
        } else {
          members.push(userData);
        }

        // trigger state update (force new array for react state change detection)
        setMemberDetails([...members]);
      }
    });
    userDetailsUnsubs.push(unsubscribe);
  });

  // Optional: return unsubscribe functions to clean up listeners if needed
  return () => userDetailsUnsubs.forEach(unsub => unsub());
};

  // Fetch budget & expenses for this trip from budgets collection (budgets/{userUid} document)
  const fetchBudget = async (tripName) => {
    if (!currentUseruid) return;

    const budgetDocRef = doc(db, "budgets", currentUseruid);
    const budgetSnap = await getDoc(budgetDocRef);

    if (budgetSnap.exists()) {
      const data = budgetSnap.data();
      const items = data.items || [];

      // Find budget item matching current tripId
      const tripBudget = items.find(item => item.tripId === id);

      if (tripBudget) {
        // Calculate total used amount by summing expenses amount
        const totalUsed = (tripBudget.expenses || []).reduce(
          (sum, exp) => sum + (exp.amount || 0),
          0
        );

        setBudget({
          total: tripBudget.amount,
          used: totalUsed,
          contributors: tripBudget.contributors || [],
          expenses: tripBudget.expenses || []
        });

        // Also initialize editBudget so user can edit it in budget drawer
        setEditBudget({
          total: tripBudget.amount,
          contributors: tripBudget.contributors || []
        });
      } else {
        setBudget(null);
        setEditBudget({ total: "", contributors: [] });
      }
    }
  };

  const handleSaveEdit = async () => {
  if (!trip || !id) return;

  try {
    const tripRef = doc(db, "trips", id);
    await updateDoc(tripRef, {
      name: editTrip.name,
      location: editTrip.location,
      startDate: editTrip.startDate,
      endDate: editTrip.endDate,
      from: editTrip.from || "",
      to: editTrip.to || ""
    });

    setTrip(prev => ({
      ...prev,
      name: editTrip.name,
      location: editTrip.location,
      startDate: editTrip.startDate,
      endDate: editTrip.endDate,
      from: editTrip.from,
      to: editTrip.to
    }));

    setSnackbar({ open: true, message: "Trip updated successfully!" });
    setEditMode(false);
  } catch (err) {
    console.error("Error updating trip:", err);
    setSnackbar({ open: true, message: "Failed to save changes." });
  }
};

const handleDeleteTrip = async () => {
  try {
    setConfirmDeleteOpen(false);

    // Delete trip document
    await deleteDoc(doc(db, "trips", id));

    // Delete group chat
    await deleteDoc(doc(db, "groupChats", id));

    // Remove from all users' budgets
    const budgetDocs = await getDocs(collection(db, "budgets"));
    await Promise.all(
      budgetDocs.docs.map(async (snap) => {
        const data = snap.data();
        const updatedItems = (data.items || []).filter(item => item.tripId !== id);
        if (updatedItems.length !== (data.items || []).length) {
          await updateDoc(doc(db, "budgets", snap.id), { items: updatedItems });
        }
      })
    );

    setSnackbar({ open: true, message: "Trip deleted successfully!" });
    setTimeout(() => navigate("/trips"), 1000);
  } catch (err) {
    console.error("Failed to delete trip:", err);
    setSnackbar({ open: true, message: "Error deleting trip." });
  }
};



const handleEditSave = async () => {
  if (!currentUseruid) return;

  try {
    const budgetDocRef = doc(db, "budgets", currentUseruid);
    const budgetSnap = await getDoc(budgetDocRef);

    // ✅ FIX: Declare and initialize items and tripBudgetIndex in the main function scope
    let items = [];
    let tripBudgetIndex = -1;

    if (!budgetSnap.exists()) {
      setSnackbar({ open: true, message: "Budget document not found. Creating a new budget entry." });
      // If document doesn't exist, items remains []
    } else {
      const data = budgetSnap.data();
      items = data.items || [];
      // Find the budget item matching current tripId
      tripBudgetIndex = items.findIndex(item => item.tripId === id);
    }
    
    // The variables items and tripBudgetIndex are now properly defined and accessible here.

    const updatedItem = {
      name: trip?.name || "",
      amount: parseInt(editBudget.total),
      category: "General",
      contributors: editBudget.contributors,
      // Safely access expenses: either existing or an empty array
      expenses: tripBudgetIndex !== -1 ? (items[tripBudgetIndex]?.expenses || []) : [],
      tripId: id,
    };

    if (tripBudgetIndex !== -1) {
      // Update existing item
      items[tripBudgetIndex] = updatedItem;
    } else {
      // Add new item
      items.push(updatedItem);
    }

    // Use setDoc with merge:true for safety, ensuring the doc is created/updated.
    await setDoc(budgetDocRef, { items }, { merge: true });

    // Recalculate and update local budget state
    const totalUsed = updatedItem.expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    
    setBudget({
      total: updatedItem.amount,
      used: totalUsed,
      contributors: updatedItem.contributors,
      expenses: updatedItem.expenses
    });

    setBudgetDrawerOpen(false);
    setSnackbar({ open: true, message: "Budget updated successfully!" });
  } catch (error) {
    console.error("Error updating budget:", error);
    setSnackbar({ open: true, message: "Failed to update budget." });
  }
};

    // Timeline handlers
const addTimelineEvent = async () => {
  if (!newEvent.title || !newEvent.time) return;

  try {
    await addDoc(collection(db, `trips/${id}/timeline`), {
      ...newEvent,
      completed: false, // Default to incomplete
    });
    setNewEvent({ title: "", time: "", note: "" });
    setTimelineDrawerOpen(false);
  } catch (error) {
    console.error("Error adding timeline event:", error);
  }
};

const deleteTimelineEvent = async (eventId) => {
  try {
    await deleteDoc(doc(db, `trips/${id}/timeline`, eventId));
  } catch (error) {
    console.error("Error deleting timeline event:", error);
  }
};

// ✅ Toggle event completion manually by admin
const toggleEventCompleted = async (event) => {
  try {
    const eventRef = doc(db, `trips/${id}/timeline`, event.id);
    await updateDoc(eventRef, {
      completed: !event.completed,
    });
  } catch (error) {
    console.error("Failed to toggle event completion:", error);
  }
};


      const saveBudget = async () => {
        if (!trip) return;
    
        const userBudgetRef = doc(db, "budgets", currentUseruid);
        const userBudgetSnap = await getDoc(userBudgetRef);
    
        let existingData = { items: [] };
        if (userBudgetSnap.exists()) {
          existingData = userBudgetSnap.data();
          if (!Array.isArray(existingData.items)) existingData.items = [];
        }
    
        const updatedItems = [...existingData.items];
        const index = updatedItems.findIndex((item) => item.tripId === id);
    
        const newItem = {
          name: trip.name,
          amount: Number(editBudget.total),
          category: "General",
          contributors: editBudget.contributors.map((c) => ({
            name: c.name,
            amount: Number(c.amount),
            uid: c.uid || "",
          })),
          expenses: budget?.expenses || [],
          tripId: id,
        };
    
        if (index !== -1) {
          updatedItems[index] = newItem;
        } else {
          updatedItems.push(newItem);
        }
    
        await setDoc(userBudgetRef, { items: updatedItems }, { merge: true });
    
        setBudgetDrawerOpen(false);
        await fetchBudget(id);
        setSnackbar({ open: true, message: "Budget saved successfully!" });
      };

  // Expense adding function - saves expense to Firestore budget doc
const addExpense = async () => {

  if (!currentUseruid) {
    setSnackbar({ open: true, message: "User not authenticated." });
    return;
  }
  
  // 1. Validate based on mode
  if (!newExpense.name || !newExpense.amount || !newExpense.date || !newExpense.time) {
    setSnackbar({ open: true, message: "Please fill all required fields (Name, Amount, Date, Time)." });
    return;
  }
  
  // If multiple payers, calculate total paid amount from contributors
  let totalPaid = 0;
  let payers = [];
  
  if (newExpense.splitMode === 'multiple_payers') {
    payers = expenseContributors
      .filter(c => c.included && parseFloat(c.paidAmount) > 0)
      .map(c => ({ 
          uid: c.uid, 
          amount: parseFloat(c.paidAmount) 
      }));
      
    totalPaid = payers.reduce((sum, p) => sum + p.amount, 0);

    if (totalPaid <= 0) {
      setSnackbar({ open: true, message: "Please enter the amount paid by at least one member." });
      return;
    }
  } else {
    // Single Payer Mode (using the old logic)
    if (!newExpense.paidBy) {
      setSnackbar({ open: true, message: "Please select the member who paid." });
      return;
    }
    totalPaid = parseFloat(newExpense.amount);
    if (totalPaid <= 0) {
      setSnackbar({ open: true, message: "Amount must be greater than zero." });
      return;
    }
    payers.push({ uid: newExpense.paidBy, amount: totalPaid });
  }

  // 2. Data consistency check
  const expenseAmount = parseFloat(newExpense.amount);
  if (totalPaid !== expenseAmount) {
     setSnackbar({ open: true, message: `Total paid amount (₹${totalPaid.toFixed(2)}) does not match the expense total (₹${expenseAmount.toFixed(2)}).` });
     return;
  }

  // 3. Save to Firestore
  try {
    const budgetDocRef = doc(db, "budgets", currentUseruid); 
    const budgetSnap = await getDoc(budgetDocRef);

    // ✅ FIX: Declare and initialize variables here, before they are used later.
    let items = [];
    let tripBudgetIndex = -1;

    if (budgetSnap.exists()) {
      const data = budgetSnap.data();
      items = data.items || [];
      tripBudgetIndex = items.findIndex(item => item.tripId === id);
    }

    if (tripBudgetIndex === -1) {
      setSnackbar({ open: true, message: "Budget for this trip not found. Please set up the trip budget first." });
      return;
    }
    // End of scope check for budget

    const expenseDateTime = new Date(`${newExpense.date}T${newExpense.time}`).toISOString();

    const expenseItem = {
      name: newExpense.name,
      amount: expenseAmount, // Total expense amount
      category: newExpense.category || "General",
      date: newExpense.date,
      time: newExpense.time,
      dateTime: expenseDateTime,
      
      payers: payers, 
    };

    // Use the correctly scoped variables
    items[tripBudgetIndex].expenses = items[tripBudgetIndex].expenses || [];
    items[tripBudgetIndex].expenses.push(expenseItem);

    // Using setDoc with merge:true is generally safer when updating complex fields like items
    await setDoc(budgetDocRef, { items }, { merge: true }); 

    // 4. Update local state and reset drawer
    const totalUsed = items[tripBudgetIndex].expenses.reduce((sum, e) => sum + (e.amount || 0), 0);

    setBudget(prev => ({
      ...prev,
      expenses: items[tripBudgetIndex].expenses,
      used: totalUsed,
    }));

    setSnackbar({ open: true, message: "Expense added successfully!" });
    setExpenseDrawerOpen(false);
    setNewExpense({ 
      name: "", 
      amount: "", 
      category: "", 
      date: "", 
      time: "", 
      paidBy: currentUseruid,
      splitMode: 'single_payer' // Reset mode
    });
    // Reset contributors state
    setExpenseContributors(initializeExpenseContributors(memberDetails, 'single_payer')); 

  } catch (error) {
    console.error("Error adding expense:", error);
    setSnackbar({ open: true, message: "Failed to add expense." });
  }
};

const getMemberName = (uid) => {
  const member = memberDetails.find(m => m.uid === uid);
  // Prioritize showing 'You (Me)' for the current user for clarity
  if (uid === currentUseruid) return `${member?.name || 'You'} (Me)`;
  return member?.name || 'Unknown User';
};

const initializeExpenseContributors = (members, mode) => {
  return members.map(member => ({
    uid: member.uid,
    name: member.name || 'Unknown',
    photoURL: member.photoURL,
    // When initializing, set 'included' to true only for the current user in 'single_payer' mode,
    // but keep track of who paid (paidAmount: 0).
    // In 'multiple_payers' mode, all are included.
    included: mode === 'multiple_payers' ? true : (member.uid === currentUseruid),
    paidAmount: 0, // This will hold how much this member actually paid for the total expense
  }));
};

  const addTask = async () => {
    if (!newTask) return;
    await addDoc(collection(db, `trips/${id}/checklist`), {
      text: newTask,
      completed: false,
    });
    setNewTask("");
  };

  const toggleTask = async (task) => {
    await updateDoc(doc(db, `trips/${id}/checklist`, task.id), {
      completed: !task.completed
    });
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

// --- Helper: Render Expense Payers ---
const renderExpensePayers = (expense) => {
  let payerUids = [];
  if (expense.payers && expense.payers.length > 0) {
    payerUids = expense.payers.map((p) => p.uid);
  } else if (expense.paidBy) {
    payerUids = [expense.paidBy];
  }

  const payersDetails = payerUids
    .map((uid) => memberDetails.find((m) => m.uid === uid))
    .filter(Boolean);

  if (payersDetails.length === 0) return null;

  if (payersDetails.length > 1) {
    return (
      <AvatarGroup
        max={3}
        total={payersDetails.length}
        sx={{
          '& .MuiAvatar-root': {
            width: 18,
            height: 18,
            fontSize: 10,
            border: `1px solid ${mode === 'dark' ? '#fff' : '#000'}`,
          },
        }}
      >
        {payersDetails.map((detail, idx) => (
          <Tooltip title={getMemberName(detail.uid)} key={idx}>
            <Avatar alt={detail.name} src={detail.photoURL} />
          </Tooltip>
        ))}
      </AvatarGroup>
    );
  } else {
    const singlePayer = payersDetails[0];
    return (
      <Tooltip title={`Paid by: ${getMemberName(singlePayer.uid)}`}>
        <Avatar
          alt={singlePayer.name}
          src={singlePayer.photoURL}
          sx={{
            width: 18,
            height: 18,
            fontSize: 10,
            border: `1px solid ${mode === 'dark' ? '#fff' : '#000'}`,
          }}
        />
      </Tooltip>
    );
  }
};



  const inviteLink = `${window.location.origin}/join?trip=${id}`;

  const mapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(
    trip?.from || ""
  )}&destination=${encodeURIComponent(trip?.to || "")}`;

  const goBack = () => {
    navigate(-1);  
  };

  const now = new Date();
  const upcomingIndex = timeline.findIndex(item => new Date(item.time) > now);

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ color: mode === "dark" ? "#fff" : "#000", minHeight: "100vh" }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={goBack}
          sx={{
            mb: 2,
            borderRadius: 8,
            color: mode === "dark" ? "#fff" : "#000",
            position: "absolute",
            top: 16,
            left: 16,
            backgroundColor: mode === "dark" ? "#00000047" : "#ffffff47",
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
              top: 16,
              right: 16,
            }}
          >
            <Button
              onClick={() => setShareDrawerOpen(true)}
              sx={{
                mb: 2,
                borderRadius: 8,
                color: mode === "dark" ? "#fff" : "#000",
                backgroundColor: mode === "dark" ? "#00000047" : "#ffffff47",
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
                backgroundColor: mode === "dark" ? "#00000047" : "#ffffff47",
                backdropFilter: "blur(180px)",
                border: "none",
              }}
            >
              <GroupIcon />
            </Button>
          </Box>

        <Box
          sx={{
            backgroundImage: `url(${trip?.iconURL})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundColor: mode === "dark" ? "#1d1d1dff" : "#ffffff",
            height: { xs: 470, sm: 320 },
            boxShadow: "none",
          }}
        />


        <Container sx={{ py: 0, px: 0, position: "absolute", top: 250}}>

          {weather && (
  <Box m={1} sx={{ backgroundColor: mode === "dark" ? "#27272773" : "#ffffffa3", py: 1, px: 2, width: 220, borderRadius: 3, backdropFilter: "blur(30px)" }}>
    <Typography variant="subtitle2" color="text.secondary">
      Weather in {trip?.location}:
    </Typography> 
    <Box display="flex" alignItems="center" gap={1}>
      <img src={weather.icon} alt="weather" width={32} height={32} />
      <Typography variant="body2">
        {weather.temp}°C — {weather.description}
      </Typography>
    </Box>
  </Box>
)}

          <Container sx={{ borderRadius: 5, backgroundColor: mode === "dark" ? "#00000000" : "#ffffffa3", backdropFilter: "blur(80px)", py: 2 }}>
            
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
    fontSize: '2rem',                // approximate size similar to h3
    fontWeight: 'bold',              // h3 is usually bold
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
{trip?.createdBy === currentUseruid && (
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
                  <Typography variant="body1" fontWeight="bold" gutterBottom>
                    {trip.from} → {trip.to}
                  </Typography>
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
                  <Button size="small" color={theme.palette.text.primary} onClick={() => setExpenseDrawerOpen(true)} sx={{ ml: 1 }}>
                    Add Expense
                  </Button>
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

        {visibleExpenses.length ? (
          visibleExpenses.map((exp, idx) => (
            <Box
              key={idx}
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 1,
                p: 1,
                borderRadius: 2,
                backgroundColor:
                  mode === 'dark' ? 'rgba(255,255,255,0.04)' : '#fff',
                boxShadow: "none",
              }}
            >
              <Typography
                variant="body2"
                fontWeight="bold"
                sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
              >
                {exp.name || 'Unnamed'} — ₹{exp.amount}
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  {renderExpensePayers(exp)}
                </Box>
              </Typography>

              <Typography
                variant="caption"
                sx={{
                  px: 1,
                  py: 0.3,
                  ml: 1,
                  borderRadius: 1,
                  backgroundColor:
                    mode === 'dark'
                      ? 'rgba(255,255,255,0.08)'
                      : 'rgba(0,0,0,0.05)',
                }}
              >
                {exp.category}
              </Typography>
            </Box>
          ))
        ) : (
          <Typography color="text.secondary">
            No expenses added yet.
          </Typography>
        )}

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

<Box sx={{ position: "relative" }}>
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
      primary={task.text}
      primaryTypographyProps={{
        sx: {
          textDecoration: task.completed ? "line-through" : "none",
          color: task.completed ? "#888" : "inherit",
          userSelect: "text",
        },
      }}
    />
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
    <Typography variant="body2" color="text.secondary" sx={{ pb: 5, mb: 3, textAlign: "center" }}>
      No events added yet.
    </Typography>
  ) : (
    <List
      sx={{
        maxHeight: "300px",
        overflowY: "auto",
        scrollbarWidth: "none",
        pb: 5,
        mb: 1
      }}
    >
      {timeline.map((item, index) => {
        const itemTime = new Date(item.time);
        const isCompleted = item.completed;
        const isUpcoming = !isCompleted && itemTime > new Date() &&
          timeline.findIndex((e) => new Date(e.time) > new Date() && !e.completed) === index;

        return (
          <ListItem
            key={item.id}
            sx={{
              backgroundColor: isUpcoming
                ? "#bc751835" // Indigo for upcoming
                : isCompleted
                ? mode === "dark" ? "#000000" : "#ffffff"
                : mode === "dark" ? "#1c1c1c" : "#f0f0f0ff",
              borderRadius: 3,
              mb: 1,
              px: 2,
              py: 0.1,
              border: isUpcoming ? "2px solid #bc7518ff" : "none",
              boxShadow: isUpcoming ? "0 0 10px #bc751880" : "none",
            }}
            secondaryAction={
              isCompleted &&
              trip?.createdBy === currentUseruid && (
                <IconButton onClick={() => deleteTimelineEvent(item.id)}>
                  <Cancel color="error" />
                </IconButton>
              )
            }
          >
            <ListItemIcon>
              <Checkbox
                checked={isCompleted}
                onChange={() => toggleEventCompleted(item)}
                sx={{ color: "#999" }}
              />
            </ListItemIcon>

            <ListItemText
              primary={
                <Typography
                  variant="body1"
                  fontWeight={isUpcoming ? "bold" : isCompleted ? "normal" : "medium"}
                  color={isCompleted ? "#888" : isUpcoming ? theme.palette.text.primary : theme.palette.text.primary}
                  sx={{
                    textDecoration: isCompleted ? "line-through" : "none",
                  }}
                >
                  {item.title}
                </Typography>
              }
              secondary={
                <Typography variant="caption" color="text.secondary">
                  {itemTime.toLocaleString()}
                  {item.note && ` — ${item.note}`}
                </Typography>
              }
            />
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
                <ListItem key={user.uid} disableGutters onClick={() => navigate(`/chat/${user.uid}`)} sx={{ cursor: "pointer" }}>
                  <Avatar src={user.photoURL} sx={{ mr: 2 }} />
                  <Box>
                    <Typography fontWeight="medium">{user.name || "Unknown"}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {user.email}
                    </Typography>
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


                  {/* Invite Drawer */}
<SwipeableDrawer
  anchor="bottom"
  open={shareDrawerOpen}
  onClose={() => setShareDrawerOpen(false)}
  ModalProps={{
    BackdropProps: {
      sx: {
        p: 3,
        backgroundColor: mode === "dark" ? "#0000000d" : "#0000000d",
        backdropFilter: "blur(5px)",
      },
    },
  }}
  PaperProps={{
    sx: {
      p: 3,
      borderTopLeftRadius: 26,
      borderTopRightRadius: 26,
      backgroundColor: mode === "dark" ? "#000000ff" : "#ffffffff",
      boxShadow: "none"
    },
  }}
>

    <Box
      sx={{
        width: 40,
        height: 5,
        bgcolor: "grey.500",
        opacity: 0.5,
        borderRadius: 2.5,
        mx: "auto",
        mb: 1,
        cursor: "grab",
      }}
    />

  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 4 }}>

    <Typography variant="h6">
      Invite Members via Link
    </Typography>

    <Button
      onClick={() => setShareDrawerOpen(false)}
    >
      Close
    </Button>
  </Box>

  {/* QR Code */}
  <Box sx={{ mb: 3, display: "flex", justifyContent: "center" }}>
    <Box
      sx={{
        width: 180,
        height: 180,
        backgroundColor: "#fff",
        padding: 2,
        borderRadius: 3,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <QRCodeSVG value={inviteLink} size={180} bgColor="#fff" fgColor="#000000" p={3} />
    </Box>
  </Box>

    <TextField
    fullWidth
    multiline
    value={inviteLink}
    InputProps={{
      readOnly: true,
      endAdornment: (
        <InputAdornment position="end">
          <IconButton
            onClick={() => {
              navigator.clipboard.writeText(inviteLink);
              setSnackbar({ open: true, message: "Copied invite link!" });
            }}
          >
            <ContentCopy />
          </IconButton>
        </InputAdornment>
      ),
    }}
    sx={{ mb: 2 }}
  />


  {/* MUI Social Icons */}
  <Box display="flex" justifyContent="center" gap={3} mb={2}>
    <Tooltip title="Share on WhatsApp">
      <IconButton
        component="a"
        href={`https://wa.me/?text=${encodeURIComponent(
          `You're invited to join our trip "${trip?.name}" on BunkMate! 🚀\nClick to join: ${inviteLink}`
        )}`}
        target="_blank"
        sx={{ color: mode === "dark" ? "#fff" : "#000", p: 1.5, backgroundColor: "#25D366" }}
      >
        <WhatsAppIcon />
      </IconButton>
    </Tooltip>

    <Tooltip title="Share on Telegram">
      <IconButton
        component="a"
        href={`https://t.me/share/url?url=${encodeURIComponent(inviteLink)}&text=${encodeURIComponent(
          `Join our "${trip?.name}" trip on BunkMate! 🚀`
        )}`}
        target="_blank"
        sx={{ color: mode === "dark" ? "#fff" : "#000", p: 1.5, backgroundColor: "#229ED9" }}
      >
        <TelegramIcon />
      </IconButton>
    </Tooltip>

    <Tooltip title="Copy for Instagram Story">
      <IconButton
        onClick={() => {
          navigator.clipboard.writeText(inviteLink);
          setSnackbar({ open: true, message: "Copied! Share it on Instagram." });
        }}
        sx={{ color: mode === "dark" ? "#fff" : "#000", p: 1.5, backgroundColor: "#E1306C" }}
      >
        <InstagramIcon />
      </IconButton>
    </Tooltip>

    <Tooltip title="Share on Twitter / X">
      <IconButton
        component="a"
        href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(
          `Join my trip "${trip?.name}" on BunkMate! ${inviteLink}`
        )}`}
        target="_blank"
        sx={{ color: "#1DA1F2", p: 1.5, backgroundColor: mode === "dark" ? "white" : "#d5d5d5ff" }}
      >
        <TwitterIcon />
      </IconButton>
    </Tooltip>
  </Box>

  {/* Native Share API */}
  {navigator.share && (
    <Button
      fullWidth
      variant="contained"
      startIcon={<ShareIcon />}
      sx={{ mb: 1, borderRadius: 8, py: 1.5, backgroundColor: theme.palette.text.primary, color: mode === "dark" ? "#000" : "#fff" }}
      onClick={() =>
        navigator.share({
          title: `Join our trip on BunkMate`,
          text: `You're invited to join "${trip?.name}" on BunkMate! 🚀\nTap to accept the invite.`,
          url: inviteLink,
        })
      }
    >
      Share via Device…
    </Button>
  )}

</SwipeableDrawer>

        
                  {/* Checklist Drawer */}
      <SwipeableDrawer
        anchor="bottom"
        open={checklistDrawerOpen}
        onClose={() => {
          setChecklistDrawerOpen(false);
          setChecklistDrafts([]);
          setNewTask("");
        }}
        ModalProps={{
          BackdropProps: {
            sx: {
              p: 3,
              backgroundColor: mode === "dark" ? "#0000000d" : "#0000000d",
              backdropFilter: "blur(5px)",
            },
          },
        }}
        PaperProps={{
          sx: {
            p: 3,
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            maxHeight: "70vh",
            overflowY: "auto",
            backgroundColor: mode === "dark" ? "#000000ff" : "#fff",
            boxShadow: "none"
          },
        }}
      >
        <Box
          sx={{
            width: 40,
            height: 5,
            bgcolor: "grey.500",
            opacity: 0.5,
            borderRadius: 2.5,
            mx: "auto",
            mb: 2,
            cursor: "grab",
          }}
        />

        <Typography variant="h6" mb={2}>
          Add Checklist Items
        </Typography>


        <Box sx={{ display: "flex", gap: 1 }}>
          <Button
            variant="contained"
            component="label"
            sx={{
              mb: 2,
              boxShadow: "none",
              color: theme.palette.text.primary,
              borderRadius: 4,
              backgroundColor: mode === 'dark' ? '#ffffff10' : '#00000010'
            }}
          >
            Upload Checklist
            <input
              type="file"
              accept=".txt,.md,text/plain,text/markdown,text/x-markdown"
              hidden
              onChange={handleChecklistFileUpload}
            />
          </Button>

          <Button
            variant="contained"
            component="label"
            sx={{
              mb: 2,
              boxShadow: "none",
              color: theme.palette.text.primary,
              borderRadius: 4,
              backgroundColor: mode === 'dark' ? '#ffffff10' : '#00000010'
              }}
            onClick={addEmptyChecklistDraft}
          >
              Add Multiple Checklists
          </Button>
        </Box>

        {checklistDrafts.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Preview & Edit Items to Add
            </Typography>
            {checklistDrafts.map((item, index) => (
<Box
  key={index}
  display="flex"
  alignItems="center"
  mb={1}
  gap={1}
  sx={{
    '& .MuiTextField-root': {
      bgcolor: (theme) => theme.palette.mode === 'dark' ? '#2c2c2c' : '#fff',
      borderRadius: 1,
    },
    '& .MuiButton-root': {
      minWidth: 90,
      height: 36,
      textTransform: 'none',
    },
  }}
>
<TextField
  fullWidth
  value={item}
  onChange={(e) => updateChecklistDraft(index, e.target.value)}
  placeholder={`Item ${index + 1}`}
  variant="outlined"
  size="small"
  sx={{
    bgcolor: (theme) => theme.palette.mode === 'dark' ? '#2a2a2a' : '#fafafa',
    borderRadius: 8,
    boxShadow: "none",
    '& .MuiInputLabel-root.Mui-focused': {
      color: mode === "dark" ? "#fff" : "#000",
    },
    '& .MuiOutlinedInput-root': {
      borderRadius: 8,
      '& fieldset': {
        borderColor: (theme) => (theme.palette.mode === 'dark' ? '#555' : '#c1c1c1ff'),
      },
      '&:hover fieldset': {
        borderColor: (theme) => (theme.palette.mode === 'dark' ? '#bbb' : '#aaa'),
      },
      '&.Mui-focused fieldset': {
        borderColor: (theme) => mode === 'dark' ? '#ffffffff' : '#000000ff',
        boxShadow: "none",
        color: mode === "dark" ? "#fff" : "#000"
      },
      backgroundColor: 'inherit',
    },
    input: {
      color: (theme) => (theme.palette.mode === 'dark' ? '#eee' : '#222'),
    },
    label: {
      color: (theme) => (theme.palette.mode === 'dark' ? '#bbb' : '#666'),
    },
  }}
/>


<Button
  variant="outlined"
  color="error"
  onClick={() => removeChecklistDraft(index)}
  sx={{
    maxWidth: 16,
    height: 36,
    padding: 0,
    textTransform: 'none',
    alignSelf: 'flex-start',
    borderRadius: 8,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    '&:hover': {
      backgroundColor: (theme) =>
        theme.palette.mode === 'dark' ? '#a32e2e33' : '#f4433622',
    },
  }}
  aria-label={`Remove item ${index + 1}`}
>
  <DeleteOutlineIcon fontSize="small" />
</Button>

</Box>

            ))}
       <Box sx={{ mb: 2 }}>
          <Button variant="contained" component="label" sx={{ mb: 2, boxShadow: "none", color: theme.palette.text.primary, borderRadius: 8, backgroundColor: mode === 'dark' ? '#ffffff10' : '#00000010', }} onClick={addEmptyChecklistDraft}>
            + Add More Items
          </Button>
        </Box>
          </Box>
        )}



        {/* If no drafts, show single input */}
        {checklistDrafts.length === 0 && (
          <>
            <TextField
              fullWidth
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              label="New Checklist Item"
              variant="outlined"
              size="small"
              onKeyDown={(e) => {
                if (e.key === "Enter" && newTask.trim()) {
                  setChecklistDrafts([newTask.trim()]);
                  setNewTask("");
                }
              }}
              sx={{
                bgcolor: (theme) => theme.palette.mode === 'dark' ? '#2a2a2a' : '#fafafa',
                borderRadius: 8,
                mb: 3,
                mt: 1,
                boxShadow: "none",
                '& .MuiInputLabel-root.Mui-focused': {
                  color: mode === "dark" ? "#fff" : "#000",
                },
                '& .MuiOutlinedInput-root': {
                  borderRadius: 8,
                  '& fieldset': {
                    borderColor: (theme) => (theme.palette.mode === 'dark' ? '#555' : '#c1c1c1ff'),
                  },
                  '&:hover fieldset': {
                    borderColor: (theme) => (theme.palette.mode === 'dark' ? '#bbb' : '#aaa'),
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: (theme) => mode === 'dark' ? '#ffffffff' : '#000000ff',
                    boxShadow: "none",
                    color: mode === "dark" ? "#fff" : "#000"
                  },
                  backgroundColor: 'inherit',
                },
                input: {
                  color: (theme) => (theme.palette.mode === 'dark' ? '#eee' : '#222'),
                },
                label: {
                  color: (theme) => (theme.palette.mode === 'dark' ? '#bbb' : '#666'),
                },
              }}
            />

            <Button
              variant="contained"
              fullWidth
              onClick={addTask}
              disabled={!newTask.trim()}
              sx={{
                mb: 1,
                backgroundColor: mode === "dark" ? "#fff" : "#000",
                borderRadius: 8,
                color: mode === "dark" ? "#000" : "#fff"
              }}
            >
              Add Checklist Item
            </Button>
          </>
        )}

        {checklistDrafts.length > 0 && (
          <Button
            variant="contained"
            fullWidth
            onClick={addAllChecklistItems}
            disabled={uploadingBatch}
            sx={{
              backgroundColor: mode === "dark" ? "#fff" : "#000",
              borderRadius: 8,
              color: mode === "dark" ? "#000" : "#fff"
            }}
          >
            {uploadingBatch ? "Adding..." : "Add Checklist Item(s)"}
          </Button>
        )}
      </SwipeableDrawer>

<SwipeableDrawer
  fullWidth
  anchor="bottom"
  open={checklistViewAllOpen}
  onClose={() => setChecklistViewAllOpen(false)}
  onOpen={() => setChecklistViewAllOpen(true)}
  ModalProps={{
    BackdropProps: {
      sx: {
        p: 3,
        backgroundColor: mode === "dark" ? "#0000000d" : "#0000000d",
        backdropFilter: "blur(2px)",
      },
    },
  }}
  sx={{
    "& .MuiDrawer-paper": {
      background: mode === "dark" ? "#000000ff" : "#ffffffff",
      backdropFilter: "blur(14px)",
      borderTopRightRadius: 16,
      borderTopLeftRadius: 16,
      p: 3,
      boxShadow: "none",
      border: "none",
    },
  }}
>
<Box sx={{ px: 0, pt: 0, pb: 2 }}>
  {/* Drag indicator */}
  <Box
    sx={{
      width: 40,
      height: 5,
      bgcolor: "grey.500",
      opacity: 0.5,
      borderRadius: 2.5,
      mx: "auto",
      mb: 1,
      cursor: "grab",
    }}
  />
  {/* Header row */}
  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
    <Typography variant="h6" fontWeight={"bolder"}>Full Checklist</Typography>
    <Button
      size="small"
      onClick={() => setChecklistViewAllOpen(false)}
      sx={{
        padding: 1,
        borderRadius: 4,
        color: (theme) => theme.palette.text.primary,
        '&:hover': {
          backgroundColor: mode === "dark" ? "#000" : "#fff",
        },
      }}
      aria-label="Close checklist view"
    >
      <CloseOutlinedIcon fontSize="small" />
    </Button>
  </Box>
</Box>


  <List sx={{ maxHeight: "80vh", overflowY: "auto" }}>
{checklist.map((task) => (
  <ListItem
    key={task.id}
    onClick={() => toggleTask(task)}
    disableGutters
    sx={{
      backgroundColor: task.completed
        ? (mode === "dark" ? "#00000011" : "transparent")
        : (mode === "dark" ? "#f1f1f111" : "#0000000d"),
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
      primary={task.text}
      primaryTypographyProps={{
        sx: {
          textDecoration: task.completed ? "line-through" : "none",
          color: task.completed ? "#888" : "inherit",
          userSelect: "text",
        },
      }}
    />
  </ListItem>
))}

    
    {checklist.length === 0 && (
      <Typography variant="body2" color="text.secondary" sx={{ mt: 2, textAlign: "center" }}>
        No checklist items yet.
      </Typography>
    )}
  </List>
</SwipeableDrawer>
        
                  {/* Timeline Drawer */}
                  <SwipeableDrawer
                    anchor="bottom"
                    open={timelineDrawerOpen}
                    onClose={() => setTimelineDrawerOpen(false)}
                    ModalProps={{
                      BackdropProps: {
                        sx: {
                          p: 3,
                          backgroundColor: mode === "dark" ? "#0000000d" : "#0000000d",
                          backdropFilter: "blur(2px)",
                        },
                      },
                    }}
                    PaperProps={{
                      sx: {
                        p: 3,
                        borderTopLeftRadius: 16,
                        borderTopRightRadius: 16,
                        backgroundColor: mode === "dark" ? "#000000ff" : "#ffffffff",
                        boxShadow: "none"
                      },
                    }}
                  >
                    <Box
                      sx={{
                        width: 40,
                        height: 5,
                        bgcolor: "grey.500",
                        opacity: 0.5,
                        borderRadius: 2.5,
                        mx: "auto",
                        mb: 2,
                        cursor: "grab",
                      }}
                    />

                    <Typography variant="h5" mb={2}>
                      Add Timeline Event
                    </Typography>
                    
                    <Typography variant="caption" ml={2} fontWeight={"bolder"}>Title</Typography>
                    <TextField
                      fullWidth
                      value={newEvent.title}
                      onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                      placeholder="Enter your timelines title..."
                      sx={{
                        bgcolor: (theme) => theme.palette.mode === 'dark' ? '#2a2a2a' : '#fafafa',
                        borderRadius: 8,
                        mb: 2,
                        boxShadow: "none",
                        '& .MuiInputLabel-root.Mui-focused': {
                          color: mode === "dark" ? "#fff" : "#000",
                        },
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 8,
                          '& fieldset': {
                            borderColor: (theme) => (theme.palette.mode === 'dark' ? '#555' : '#c1c1c1ff'),
                          },
                          '&:hover fieldset': {
                            borderColor: (theme) => (theme.palette.mode === 'dark' ? '#bbb' : '#aaa'),
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: (theme) => mode === 'dark' ? '#ffffffff' : '#000000ff',
                            boxShadow: "none",
                            color: mode === "dark" ? "#fff" : "#000"
                          },
                          backgroundColor: 'inherit',
                        },
                        input: {
                          color: (theme) => (theme.palette.mode === 'dark' ? '#eee' : '#222'),
                        },
                        label: {
                          color: (theme) => (theme.palette.mode === 'dark' ? '#bbb' : '#666'),
                        },
                      }}
                    />

                    <Typography variant="caption" ml={2} fontWeight={"bolder"}>Time</Typography>
                    <TextField
                      fullWidth
                      type="datetime-local"
                      value={newEvent.time}
                      onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
                      placeholder="Time"
                      InputLabelProps={{ shrink: true }}
                      sx={{
                        bgcolor: (theme) => theme.palette.mode === 'dark' ? '#2a2a2a' : '#fafafa',
                        borderRadius: 8,
                        mb: 2,
                        boxShadow: "none",
                        '& .MuiInputLabel-root.Mui-focused': {
                          color: mode === "dark" ? "#fff" : "#000",
                        },
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 8,
                          '& fieldset': {
                            borderColor: (theme) => (theme.palette.mode === 'dark' ? '#555' : '#c1c1c1ff'),
                          },
                          '&:hover fieldset': {
                            borderColor: (theme) => (theme.palette.mode === 'dark' ? '#bbb' : '#aaa'),
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: (theme) => mode === 'dark' ? '#ffffffff' : '#000000ff',
                            boxShadow: "none",
                            color: mode === "dark" ? "#fff" : "#000"
                          },
                          backgroundColor: 'inherit',
                        },
                        input: {
                          color: (theme) => (theme.palette.mode === 'dark' ? '#eee' : '#222'),
                        },
                        label: {
                          color: (theme) => (theme.palette.mode === 'dark' ? '#bbb' : '#666'),
                        },
                      }}
                    />

                    <Typography variant="caption" ml={2} fontWeight={"bolder"}>Notes</Typography>
                    <TextField
                      fullWidth
                      value={newEvent.note}
                      onChange={(e) => setNewEvent({ ...newEvent, note: e.target.value })}
                      placeholder="Enter your timeline notes..."
                      multiline
                      rows={3}
                      sx={{
                        bgcolor: (theme) => theme.palette.mode === 'dark' ? '#2a2a2a' : '#fafafa',
                        borderRadius: 8,
                        mb: 2,
                        boxShadow: "none",
                        '& .MuiInputLabel-root.Mui-focused': {
                          color: mode === "dark" ? "#fff" : "#000",
                        },
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 8,
                          '& fieldset': {
                            borderColor: (theme) => (theme.palette.mode === 'dark' ? '#555' : '#c1c1c1ff'),
                          },
                          '&:hover fieldset': {
                            borderColor: (theme) => (theme.palette.mode === 'dark' ? '#bbb' : '#aaa'),
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: (theme) => mode === 'dark' ? '#ffffffff' : '#000000ff',
                            boxShadow: "none",
                            color: mode === "dark" ? "#fff" : "#000"
                          },
                          backgroundColor: 'inherit',
                        },
                        input: {
                          color: (theme) => (theme.palette.mode === 'dark' ? '#eee' : '#222'),
                        },
                        label: {
                          color: (theme) => (theme.palette.mode === 'dark' ? '#bbb' : '#666'),
                        },
                      }}
                    />
                    <Button
                      variant="contained"
                      fullWidth
                      onClick={addTimelineEvent}
                      disabled={!newEvent.title || !newEvent.time}
                      sx={{
                        textTransform: "none",
                        color: theme => theme.palette.mode === 'dark' ? '#fff' : '#000',
                        backgroundColor: mode === 'dark' ? '#ffffff10' : '#00000010',
                        fontWeight: 500,
                        borderRadius: 8,
                        px: 1.5,
                        py: 1,
                        mt: 2
                      }}
                    >
                      Add Event
                    </Button>
                  </SwipeableDrawer>

                  <SwipeableDrawer
                    anchor="bottom"
                    open={timelineAllDrawerOpen}
                    onClose={() => setTimelineAllDrawerOpen(false)}
                    ModalProps={{
                      BackdropProps: {
                        sx: {
                          p: 3,
                          backgroundColor: mode === "dark" ? "#0000000d" : "#0000000d",
                          backdropFilter: "blur(2px)",
                        },
                      },
                    }}
                    PaperProps={{
                      sx: {
                        p: 3,
                        borderTopLeftRadius: 16,
                        borderTopRightRadius: 16,
                        backgroundColor: mode === "dark" ? "#000000ff" : "#ffffffff",
                        boxShadow: "none",
                      },
                    }}
                  >
                    {/* Drag indicator */}
                    <Box sx={{ width: 40, height: 5, bgcolor: "grey.500", opacity: 0.5, borderRadius: 2.5, mx: "auto", mb: 2, cursor: "grab" }} />

                    <Typography variant="h6" mb={2}>Full Trip Timeline</Typography>
                  
                    {timeline.length === 0 ? (
                      <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center" }}>
                        No events added yet.
                      </Typography>
                                      ) : (
                      <List sx={{ maxHeight: "80vh", overflowY: "auto" }}>
                        {timeline.map(item => {
                          const itemTime = new Date(item.time);
                          const isCompleted = item.completed;
                          return (
                            <ListItem key={item.id} sx={{
                              backgroundColor: isCompleted ? (mode === "dark" ? "#00000011" : "transparent") : (mode === "dark" ? "#1c1c1c" : "#f0f0f0ff"),
                              borderRadius: 2,
                              mb: 1,
                              px: 2,
                              py: 0.5,
                            }}>
                              <ListItemIcon>
                                <Checkbox checked={isCompleted} onChange={() => toggleEventCompleted(item)} sx={{ color: "#999" }} />
                              </ListItemIcon>
                              <ListItemText
                                primary={
                                  <Typography
                                    variant="body1"
                                    fontWeight={isCompleted ? "normal" : "medium"}
                                    color={isCompleted ? "#888" : theme.palette.text.primary}
                                    sx={{ textDecoration: isCompleted ? "line-through" : "none" }}
                                  >
                                    {item.title}
                                  </Typography>
                                }
                                secondary={
                                  <Typography variant="caption" color="text.secondary">
                                    {itemTime.toLocaleString()}
                                    {item.note && ` — ${item.note}`}
                                  </Typography>
                                }
                              />
                            </ListItem>
                          );
                        })}
                      </List>
                    )}
                  </SwipeableDrawer>

        
                  {/* Budget Drawer */}
                  <SwipeableDrawer
                    anchor="bottom"
                    open={budgetDrawerOpen}
                    onClose={() => setBudgetDrawerOpen(false)}
                    ModalProps={{
                      BackdropProps: {
                        sx: {
                          p: 3,
                          backgroundColor: mode === "dark" ? "#0000000d" : "#0000000d",
                          backdropFilter: "blur(2px)",
                        },
                      },
                    }}
                    PaperProps={{
                      sx: {
                        p: 3,
                        borderTopLeftRadius: 16,
                        borderTopRightRadius: 16,
                        backgroundColor: mode === "dark" ? "#000000ff" : "#ffffffff",
                        boxShadow: "none"
                      },
                    }}
                  >

                  <Box
                    sx={{
                      width: 40,
                      height: 5,
                      bgcolor: "grey.500",
                      opacity: 0.5,
                      borderRadius: 2.5,
                      mx: "auto",
                      mb: 2,
                      cursor: "grab",
                    }}
                  />

                    <Typography variant="h6" mb={2}>
                      Edit Trip Budget
                    </Typography>
        
                    <TextField
                      fullWidth
                      label="Total Budget (₹)"
                      type="number"
                      value={editBudget.total}
                      onChange={(e) =>
                        setEditBudget({ ...editBudget, total: e.target.value })
                      }
                      sx={{
                        bgcolor: (theme) => theme.palette.mode === 'dark' ? '#2a2a2a' : '#fafafa',
                        borderRadius: 8,
                        boxShadow: "none",
                        '& .MuiInputLabel-root.Mui-focused': {
                          color: mode === "dark" ? "#fff" : "#000",
                        },
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 8,
                          '& fieldset': {
                            borderColor: (theme) => (theme.palette.mode === 'dark' ? '#555' : '#c1c1c1ff'),
                          },
                          '&:hover fieldset': {
                            borderColor: (theme) => (theme.palette.mode === 'dark' ? '#bbb' : '#aaa'),
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: (theme) => mode === 'dark' ? '#ffffffff' : '#000000ff',
                            boxShadow: "none",
                            color: mode === "dark" ? "#fff" : "#000"
                          },
                          backgroundColor: 'inherit',
                        },
                        input: {
                          color: (theme) => (theme.palette.mode === 'dark' ? '#eee' : '#222'),
                        },
                        label: {
                          color: (theme) => (theme.palette.mode === 'dark' ? '#bbb' : '#666'),
                        },
                      }}
                    />
        
                    <Typography variant="subtitle2">Contributors</Typography>
                    {editBudget.contributors.map((c, i) => (
                      <Box key={i} display="flex" gap={2} mt={1}>
                        <TextField
                          label="Name"
                          value={c.name}
                          onChange={(e) => {
                            const updated = [...editBudget.contributors];
                            updated[i].name = e.target.value;
                            setEditBudget({ ...editBudget, contributors: updated });
                          }}
                          fullWidth
                          sx={{
                            bgcolor: (theme) => theme.palette.mode === 'dark' ? '#2a2a2a' : '#fafafa',
                            borderRadius: 8,
                            boxShadow: "none",
                            '& .MuiInputLabel-root.Mui-focused': {
                              color: mode === "dark" ? "#fff" : "#000",
                            },
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 8,
                              '& fieldset': {
                                borderColor: (theme) => (theme.palette.mode === 'dark' ? '#555' : '#c1c1c1ff'),
                              },
                              '&:hover fieldset': {
                                borderColor: (theme) => (theme.palette.mode === 'dark' ? '#bbb' : '#aaa'),
                              },
                              '&.Mui-focused fieldset': {
                                borderColor: (theme) => mode === 'dark' ? '#ffffffff' : '#000000ff',
                                boxShadow: "none",
                                color: mode === "dark" ? "#fff" : "#000"
                              },
                              backgroundColor: 'inherit',
                            },
                            input: {
                              color: (theme) => (theme.palette.mode === 'dark' ? '#eee' : '#222'),
                            },
                            label: {
                              color: (theme) => (theme.palette.mode === 'dark' ? '#bbb' : '#666'),
                            },
                          }}
                        />
                        <TextField
                          label="Amount"
                          type="number"
                          value={c.amount}
                          onChange={(e) => {
                            const updated = [...editBudget.contributors];
                            updated[i].amount = e.target.value;
                            setEditBudget({ ...editBudget, contributors: updated });
                          }}
                          sx={{
                            bgcolor: (theme) => theme.palette.mode === 'dark' ? '#2a2a2a' : '#fafafa',
                            borderRadius: 8,
                            boxShadow: "none",
                            width: 120,
                            '& .MuiInputLabel-root.Mui-focused': {
                              color: mode === "dark" ? "#fff" : "#000",
                            },
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 8,
                              '& fieldset': {
                                borderColor: (theme) => (theme.palette.mode === 'dark' ? '#555' : '#c1c1c1ff'),
                              },
                              '&:hover fieldset': {
                                borderColor: (theme) => (theme.palette.mode === 'dark' ? '#bbb' : '#aaa'),
                              },
                              '&.Mui-focused fieldset': {
                                borderColor: (theme) => mode === 'dark' ? '#ffffffff' : '#000000ff',
                                boxShadow: "none",
                                color: mode === "dark" ? "#fff" : "#000"
                              },
                              backgroundColor: 'inherit',
                            },
                            input: {
                              color: (theme) => (theme.palette.mode === 'dark' ? '#eee' : '#222'),
                            },
                            label: {
                              color: (theme) => (theme.palette.mode === 'dark' ? '#bbb' : '#666'),
                            },
                          }}
                        />
                      </Box>
                    ))}
        
                    <Button
                      variant="outlined"
                      fullWidth
                      sx={{ mt: 2, p: 1, borderRadius: 8, border: mode === "dark" ? "1px solid #ffffffff" : "1px solid #000000ff", color: mode === "dark" ? "#ffffffff" : "#000000ff" }}
                      onClick={() => {  
                        setEditBudget({
                          ...editBudget,
                          contributors: [...editBudget.contributors, { name: "", amount: "" }],
                        });
                      }}
                    >
                      + Add Contributor
                    </Button>
        
                    <Button
                      fullWidth
                      variant="contained"
                      sx={{ mt: 3, p: 1.5, borderRadius: 8, backgroundColor: mode === "dark" ? "#ffffffff" : "#000000ff", color: mode === "dark" ? "#000000ff" : "#ffffffff" }}
                      onClick={saveBudget}
                      disabled={!editBudget.total || editBudget.contributors.length === 0}
                    >
                      Save Budget
                    </Button>
                  </SwipeableDrawer>

        {/* Expense Drawer */}
<SwipeableDrawer
  anchor="bottom"
  open={expenseDrawerOpen}
  onClose={() => setExpenseDrawerOpen(false)}
  onOpen={() => {}}
  disableBackdropTransition={false}
  ModalProps={{
    BackdropProps: {
      sx: {
        backgroundColor: "rgba(0,0,0,0.2)",
        backdropFilter: "blur(4px)",
      },
    },
  }}
  PaperProps={{
    sx: {
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      background: mode === "dark"
        ? "rgba(20,20,20,0.9)"
        : "rgba(255,255,255,0.9)",
      backdropFilter: "blur(16px)",
      boxShadow: mode === "dark"
        ? "0px -6px 20px rgba(0,0,0,0.5)"
        : "0px -6px 20px rgba(0,0,0,0.1)",
      p: 3,
      maxHeight: "85vh",
      overflowY: "auto",
      transition: "all 0.3s ease-in-out",
    },
  }}
>
  {/* Drag Handle */}
  <Box
    sx={{
      width: 40,
      height: 5,
      bgcolor: "grey.500",
      opacity: 0.5,
      borderRadius: 2.5,
      mx: "auto",
      mb: 2,
    }}
  />

  {/* Header */}
  <Typography
    variant="h6"
    fontWeight="bold"
    textAlign="center"
    sx={{
      mb: 2.5,
      color: mode === "dark" ? "#fff" : "#000",
      letterSpacing: 0.5,
    }}
  >
    Add New Expense
  </Typography>

  {/* Expense Fields Section */}
  <Box
    component={motion.div}
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
  >
    {/* Expense Name */}
    <TextField
      fullWidth
      label="Expense Name"
      value={newExpense.name}
      onChange={(e) =>
        setNewExpense((prev) => ({ ...prev, name: e.target.value }))
      }
      sx={{
        mb: 2,
        borderRadius: 3,
        "& .MuiOutlinedInput-root": {
          borderRadius: 3,
          backgroundColor: mode === "dark" ? "#1e1e1e" : "#fafafa",
          "&:hover fieldset": { borderColor: "#888" },
          "&.Mui-focused fieldset": { borderColor: mode === "dark" ? "#fff" : "#000" },
        },
      }}
    />

    {/* Split Mode Button */}
    <Button
      fullWidth
      variant="outlined"
      onClick={() => {
        const newMode =
          newExpense.splitMode === "single_payer"
            ? "multiple_payers"
            : "single_payer";
        setNewExpense((prev) => ({ ...prev, splitMode: newMode }));
        setExpenseContributors(
          initializeExpenseContributors(memberDetails, newMode)
        );
      }}
      sx={{
        borderRadius: 3,
        py: 1.5,
        mb: 2,
        textTransform: "none",
        borderColor: theme => theme.palette.divider,
        color: theme => theme.palette.text.primary,
        backgroundColor:
          newExpense.splitMode === "multiple_payers"
            ? (mode === "dark" ? "#ffffff10" : "#00000008")
            : "transparent",
        transition: "all 0.2s ease",
        "&:hover": {
          backgroundColor: mode === "dark" ? "#ffffff15" : "#00000010",
          transform: "translateY(-2px)",
        },
      }}
    >
      {newExpense.splitMode === "single_payer"
        ? "Switch to Multiple Contributors"
        : `Multiple Payers Mode (Total ₹${parseFloat(
            newExpense.amount || 0
          ).toFixed(2)})`}
    </Button>

    {/* Conditional payer inputs */}
    {newExpense.splitMode === "single_payer" && (
      <TextField
        select
        fullWidth
        label="Paid By"
        value={newExpense.paidBy || currentUseruid}
        onChange={(e) =>
          setNewExpense((prev) => ({ ...prev, paidBy: e.target.value }))
        }
        SelectProps={{ native: true }}
        sx={{
          mb: 2,
          borderRadius: 3,
          "& .MuiOutlinedInput-root": {
            borderRadius: 3,
            backgroundColor: mode === "dark" ? "#1e1e1e" : "#fafafa",
          },
        }}
      >
        {memberDetails.map((member) => (
          <option key={member.uid} value={member.uid}>
            {getMemberName(member.uid)}
          </option>
        ))}
      </TextField>
    )}

    {newExpense.splitMode === "multiple_payers" && (
      <Collapse in={true}>
        <Box
          sx={{
            mb: 2,
            p: 1,
            borderRadius: 3,
            backgroundColor:
              mode === "dark" ? "#ffffff08" : "#00000008",
          }}
        >
          <Typography variant="subtitle2" fontWeight={600} mb={1}>
            Members Paid:
          </Typography>

          {expenseContributors.map((c, index) => (
            <Box
              key={c.uid}
              display="flex"
              alignItems="center"
              gap={1.5}
              sx={{
                p: 1,
                mb: 1,
                borderRadius: 2,
                backgroundColor: c.included
                  ? mode === "dark"
                    ? "#ffffff10"
                    : "#00000010"
                  : "transparent",
                transition: "all 0.25s ease",
              }}
            >
              <Checkbox
                checked={c.included}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setExpenseContributors((prev) =>
                    prev.map((x, i) =>
                      i === index
                        ? { ...x, included: checked, paidAmount: checked ? x.paidAmount : 0 }
                        : x
                    )
                  );
                }}
              />
              <Avatar src={c.photoURL} sx={{ width: 32, height: 32 }} />
              <Typography sx={{ flexGrow: 1 }}>
                {getMemberName(c.uid)}
              </Typography>

              {c.included && (
                <TextField
                  size="small"
                  label="Amount Paid"
                  type="number"
                  value={c.paidAmount}
                  onChange={(e) =>
                    setExpenseContributors((prev) =>
                      prev.map((x, i) =>
                        i === index ? { ...x, paidAmount: e.target.value } : x
                      )
                    )
                  }
                  sx={{
                    width: 110,
                    "& .MuiOutlinedInput-root": { borderRadius: 2 },
                  }}
                />
              )}
            </Box>
          ))}
        </Box>
      </Collapse>
    )}

    {/* Other Fields */}
    {["Amount (₹)", "Category", "Date", "Time"].map((label, idx) => (
      <TextField
        key={label}
        fullWidth
        label={label}
        type={label === "Date" ? "date" : label === "Time" ? "time" : label === "Amount (₹)" ? "number" : "text"}
        InputLabelProps={label === "Date" || label === "Time" ? { shrink: true } : {}}
        value={
          label === "Amount (₹)"
            ? newExpense.amount
            : label === "Category"
            ? newExpense.category
            : label === "Date"
            ? newExpense.date
            : newExpense.time
        }
        onChange={(e) => {
          const value = e.target.value;
          setNewExpense((prev) => ({
            ...prev,
            [label === "Amount (₹)"
              ? "amount"
              : label === "Category"
              ? "category"
              : label === "Date"
              ? "date"
              : "time"]: value,
          }));
        }}
        sx={{
          mb: 2,
          borderRadius: 3,
          "& .MuiOutlinedInput-root": {
            borderRadius: 3,
            backgroundColor: mode === "dark" ? "#1e1e1e" : "#fafafa",
          },
        }}
      />
    ))}

    {/* Save Button */}
    <Button
      fullWidth
      variant="contained"
      onClick={addExpense}
      sx={{
        mt: 1,
        py: 1.4,
        borderRadius: 3,
        fontWeight: 600,
        fontSize: "1rem",
        letterSpacing: 0.4,
        backgroundColor: mode === "dark" ? "#fff" : "#000",
        color: mode === "dark" ? "#000" : "#fff",
        "&:hover": {
          transform: "translateY(-2px)",
          backgroundColor: mode === "dark" ? "#f1f1f1" : "#111",
        },
        transition: "all 0.3s ease",
      }}
      disabled={
        !newExpense.name ||
        !newExpense.amount ||
        !newExpense.date ||
        !newExpense.time
      }
    >
      Save Expense
    </Button>
  </Box>
</SwipeableDrawer>


        <Dialog
  open={confirmDeleteOpen}
  onClose={() => setConfirmDeleteOpen(false)}
  PaperProps={{ sx: { backgroundColor: "#0000002b", p: 2, borderRadius: 2, backdropFilter: "blur(20px)" } }}
>
  <DialogTitle sx={{ color: mode === "dark" ? "#fff" : "#000" }}>Confirm Delete</DialogTitle>
  <DialogContent>
    <Typography color="text.secondary">
      Are you sure you want to permanently delete this trip? This action cannot be undone.
    </Typography>
  </DialogContent>
  <DialogActions>
    <Button onClick={() => setConfirmDeleteOpen(false)} color="primary" variant="outlined">
      Cancel
    </Button>
    <Button onClick={handleDeleteTrip} color="error" variant="contained">
      Delete
    </Button>
  </DialogActions>
</Dialog>


      </Box>
    </ThemeProvider>
  );
}
