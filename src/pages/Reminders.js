import React, { useState, useEffect, useImperativeHandle, forwardRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Typography, Box, Card, CardContent, TextField, Button,
  List, ListItem, ListItemText, IconButton, Drawer, Stack,
  CircularProgress, Dialog, DialogTitle, DialogContent,
  DialogActions, Menu, MenuItem, Tooltip, ThemeProvider,
  InputAdornment, Container, Collapse, SwipeableDrawer,
} from "@mui/material";
import {
  Add as AddIcon, Delete as DeleteIcon, Edit as EditIcon,
  NotificationsActive as NotificationsActiveIcon, MoreVert as MoreVertIcon,
  ArrowBack as ArrowBackIcon, Search as SearchIcon, CheckCircle as CheckCircleIcon,
  ExpandMore, DeleteOutline as DeleteOutlineIcon,
} from "@mui/icons-material";

import { useWeather } from "../contexts/WeatherContext";
import { weatherGradients, weatherColors, weatherbgColors } from "../elements/weatherTheme";
import { db, messaging } from "../firebase";
import { useThemeToggle } from "../contexts/ThemeToggleContext";
import { getTheme } from "../theme";
import {
  collection, addDoc, query, where, getDocs,
  deleteDoc, doc, orderBy, updateDoc,
} from "firebase/firestore";
import { getToken, onMessage } from "firebase/messaging";
// FIX APPLIED HERE: Revert to default import (no curly braces) as indicated by the error.
import ProfilePic from "../components/Profile";

// --- Helper Functions (Moved out for clarity) ---

// Get User from Storage (Kept as is - robust)
function getUserFromStorage() {
  try {
    const storedUser = localStorage.getItem("bunkmateuser");
    if (storedUser) {
      const parsed = JSON.parse(storedUser);
      if (parsed?.uid) return parsed;
    }
    const cookieUser = document.cookie
      .split("; ")
      .find((row) => row.startsWith("bunkmateuser="))
      ?.split("=")[1];
    if (cookieUser) {
      const parsed = JSON.parse(decodeURIComponent(cookieUser));
      if (parsed?.uid) return parsed;
    }
  } catch {}
  return null;
}

// Request Notification Permission and get FCM token
async function requestNotificationPermission() {
  try {
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      const token = await getToken(messaging, { vapidKey: "BA3kLicUjBzLvrGk71laA_pRVYsf6LsGczyAzF-NTBWEmOE3r4_OT9YiVt_Mvzqm7dZCoPnht84wfX-WRzlaSLs" });
      console.log("FCM Token:", token);
      return token;
    }
  } catch (err) {
    console.error("Notification permission error:", err);
  }
  return null;
}

// Show a local notification
function showLocalNotification(title, options) {
  if (Notification.permission === "granted") {
    if (document.hasFocus()) {
      new Notification(title, options);
    } else if (navigator.serviceWorker && navigator.serviceWorker.ready) {
      navigator.serviceWorker.ready.then(registration => {
        registration.showNotification(title, options);
      });
    }
  }
}

function getTodayStr() {
  const now = new Date();
  // Using toLocaleDateString with specific options to ensure YYYY-MM-DD format consistency for comparison
  return now.toLocaleDateString('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

// --- Reminder Item Component (Extracting the list item logic) ---

const ReminderListItem = React.memo(({ rem, mode, theme, handleToggleComplete, handleMenuOpen }) => {
  const isDark = mode === "dark";
  const itemStyle = {
    borderRadius: 4,
    mb: 1,
    background: isDark ? "#f1f1f111" : "#dbdbdbae",
    color: isDark ? "#fff" : "#000",
    opacity: rem.completed ? 0.5 : 1,
    textDecoration: rem.completed ? "line-through" : "none",
  };

  return (
    <ListItem
      key={rem.id}
      sx={itemStyle}
      secondaryAction={
        <IconButton
          edge="end"
          onClick={(e) => handleMenuOpen(e, rem)}
          sx={{ color: isDark ? "#fff" : "#000" }}
        >
          <MoreVertIcon />
        </IconButton>
      }
    >
      <IconButton
        onClick={() => handleToggleComplete(rem)}
        sx={{
          color: rem.completed ? "#00f721" : "#aaa",
          mr: 1,
          p: 0.5,
        }}
      >
        {rem.completed ? (
          <CheckCircleIcon sx={{ fontSize: 28, color: "#00f721" }} />
        ) : (
          <NotificationsActiveIcon sx={{ fontSize: 28, color: isDark ? "#fff" : "#000" }} />
        )}
      </IconButton>
      <ListItemText
        sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1.3 }}
        primary={
          <Typography
            variant="body1"
            sx={{
              fontSize: 16,
              fontWeight: rem.completed ? "normal" : "bold",
              color: isDark ? "#fff" : "#000",
              textDecoration: rem.completed ? "line-through" : "none",
              opacity: rem.completed ? 0.9 : 1,
            }}
          >
            {rem.text}
          </Typography>
        }
        secondary={
          rem.time ? (
            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
              <Typography variant="caption" sx={{ color: "#646464ff" }}>
                {rem.date} {rem.time}
              </Typography>
            </Box>
          ) : null
        }
      />
    </ListItem>
  );
});

// --- Completed Reminder Item Component (Extracting the list item logic) ---

const CompletedReminderListItem = React.memo(({ rem, mode, theme, handleToggleComplete, handleDeleteReminder }) => {
  const isDark = mode === "dark";

  return (
    <ListItem
      key={rem.id}
      sx={{
        borderRadius: 3,
        mb: 1,
        background: isDark ? "#88888822" : "#dcdcdcff",
        color: isDark ? "#fff" : "#000",
        opacity: 0.5,
        boxShadow: "none",
      }}
    >
      <IconButton
        onClick={() => handleToggleComplete(rem)}
        sx={{ color: "#00f721", mr: 1, p: 0.5 }}
      >
        <CheckCircleIcon sx={{ fontSize: 28, color: "#00f721" }} />
      </IconButton>
      <ListItemText
        sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1.3 }}
        primary={
          <Typography
            variant="body1"
            sx={{
              color: isDark ? "#fff" : "#000",
              textDecoration: "line-through",
              opacity: 0.7,
            }}
          >
            {rem.text}
          </Typography>
        }
        secondary={
          rem.time ? (
            <Box sx={{ display: "flex", flexDirection: "column", mr: 2, gap: 0.1 }}>
              <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                {rem.time}
              </Typography>
            </Box>
          ) : null
        }
      />
      <IconButton
        size="small"
        onClick={() => handleDeleteReminder(rem.id)}
        sx={{
          color: "#cd0000ff",
          backgroundColor: "#ff9090c4",
          p: 1.2,
        }}
      >
        <DeleteOutlineIcon />
      </IconButton>
    </ListItem>
  );
});

// --- Main Reminders Component ---

const Reminders = forwardRef(({ open, onClose }, ref) => {
  const navigate = useNavigate();
  const [reminders, setReminders] = useState([]);
  const [newReminderData, setNewReminderData] = useState({ text: "", time: "", date: "" });
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editReminder, setEditReminder] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [menuReminder, setMenuReminder] = useState(null);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState(null);
  const [notifAllowed, setNotifAllowed] = useState(Notification.permission === "granted");
  const [notifiedIds, setNotifiedIds] = useState({});
  const [completedOpen, setCompletedOpen] = useState(false);

  const { weather } = useWeather();
  const { mode, accent } = useThemeToggle();
  const theme = getTheme(mode, accent);

  // Expose methods via ref
  useImperativeHandle(ref, () => ({
    openAddReminderDrawer: () => setDrawerOpen(true),
    markReminderComplete: async (reminderId) => {
      const reminder = reminders.find(r => r.id === reminderId);
      if (reminder && !reminder.completed) {
        await handleToggleComplete(reminder);
      }
    }
  }));

  // --- Data and State Handlers ---

  const handleToggleComplete = async (reminder) => {
    try {
      const completed = !reminder.completed;
      const completedAt = completed ? new Date() : null;
      await updateDoc(doc(db, "reminders", reminder.id), {
        completed,
        completedAt,
      });
      setReminders((prev) =>
        prev.map((r) =>
          r.id === reminder.id ? { ...r, completed, completedAt } : r
        )
      );
    } catch (err) {
      console.error("Error toggling completion:", err);
    }
  };

  const handleDeleteReminder = async (id) => {
    try {
      await deleteDoc(doc(db, "reminders", id));
      setReminders(prev => prev.filter(rem => rem.id !== id));
    } catch (error) {
      console.error("Error deleting reminder:", error);
    }
  };

  const handleAddReminder = async () => {
    if (!newReminderData.text.trim() || !user) return;
    setSaving(true);
    try {
      const newReminder = {
        uid: user.uid,
        text: newReminderData.text.trim(),
        time: newReminderData.time || "",
        date: newReminderData.date || "",
        createdAt: new Date(),
        completed: false,
      };
      const docRef = await addDoc(collection(db, "reminders"), newReminder);
      setReminders(prev => [{ id: docRef.id, ...newReminder }, ...prev]);
      setNewReminderData({ text: "", time: "", date: "" });
      setDrawerOpen(false);
    } catch (error) {
      console.error("Error adding reminder:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleEditSave = async () => {
    if (!editReminder?.text.trim()) return;
    setSaving(true);
    const reminderToUpdate = {
        text: editReminder.text,
        time: editReminder.time || "",
        date: editReminder.date || "",
    };
    try {
        await updateDoc(doc(db, "reminders", editReminder.id), reminderToUpdate);
        setReminders(prev => prev.map(r => r.id === editReminder.id ? { ...r, ...reminderToUpdate } : r));
        setEditDialogOpen(false);
        setEditReminder(null);
    } catch (error) {
        console.error("Error updating reminder:", error);
    } finally {
        setSaving(false);
    }
  };

  const handleMenuOpen = (event, reminder) => {
    setMenuAnchorEl(event.currentTarget);
    setMenuReminder(reminder);
  };
  const handleMenuClose = () => {
    setMenuAnchorEl(null);
    setMenuReminder(null);
  };
  const handleEditOpenFromMenu = () => {
    handleMenuClose();
    if (menuReminder) {
      setEditReminder(menuReminder);
      setEditDialogOpen(true);
    }
  };
  const handleDeleteFromMenu = () => {
    handleMenuClose();
    if (menuReminder) {
      handleDeleteReminder(menuReminder.id);
    }
  };

  // --- Filtering and Memoization ---

  const { filteredReminders, completedReminders } = useMemo(() => {
    const lowerCaseSearch = searchTerm.toLowerCase();
    const active = reminders.filter(
      (rem) =>
        !rem.completed &&
        rem.text.toLowerCase().includes(lowerCaseSearch)
    );
    const completed = reminders.filter(
      (rem) =>
        rem.completed &&
        rem.text.toLowerCase().includes(lowerCaseSearch)
    );
    return { filteredReminders: active, completedReminders: completed };
  }, [reminders, searchTerm]);

  // --- Effects ---

  // Load User on Mount
  useEffect(() => {
    setUser(getUserFromStorage());
  }, []);

  // Fetch Reminders
  useEffect(() => {
    const fetchReminders = async (currentUser) => {
      if (!currentUser?.uid) {
        setReminders([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const q = query(
          collection(db, "reminders"),
          where("uid", "==", currentUser.uid),
          orderBy("createdAt", "desc")
        );
        const querySnapshot = await getDocs(q);
        const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setReminders(data);
      } catch (err) {
        console.error("Error fetching reminders:", err);
      } finally {
        setLoading(false);
      }
    };

    if (user && user.uid) {
      fetchReminders(user);
    } else {
      setReminders([]);
      setLoading(false);
    }
  }, [user]);

  // Notification setup and listener
  useEffect(() => {
    if (Notification.permission !== "granted") {
      requestNotificationPermission().then(() => {
        setNotifAllowed(Notification.permission === "granted");
      });
    }

    const unsubscribe = onMessage(messaging, (payload) => {
      showLocalNotification(payload.notification.title, {
        body: payload.notification.body,
        icon: "/logo192.png",
      });
    });

    return () => unsubscribe();
  }, []);

  // Local Notification Scheduler
  useEffect(() => {
    if (!notifAllowed) return;

    const interval = setInterval(() => {
      const now = new Date();
      reminders.forEach(rem => {
        if (rem.time && rem.date && !rem.completed) {
          // Note: Creating date object with date and time string ensures correct local time interpretation
          const reminderDateTime = new Date(rem.date + "T" + rem.time + ":00");
          const minuteInMs = 60000;

          // Check if the current time is within 1 minute of the reminder time
          // and if we haven't notified for this reminder *today*
          if (
            Math.abs(reminderDateTime - now) < minuteInMs &&
            (!notifiedIds[rem.id] || notifiedIds[rem.id] !== getTodayStr())
          ) {
            showLocalNotification("Reminder", {
              body: rem.text,
              icon: "/logo192.png",
            });
            setNotifiedIds(prev => ({ ...prev, [rem.id]: getTodayStr() }));
          }
        }
      });
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [reminders, notifAllowed, notifiedIds]);

  // Auto-delete completed reminders after 1 day
  useEffect(() => {
    const now = new Date().getTime();
    reminders.forEach((rem) => {
      if (rem.completed && rem.completedAt) {
        let completedTime;
        // Handle Firestore Timestamp vs plain string/Date object
        if (rem.completedAt.toDate) {
          completedTime = rem.completedAt.toDate().getTime();
        } else if (typeof rem.completedAt === "string" || rem.completedAt instanceof Date) {
          completedTime = new Date(rem.completedAt).getTime();
        }

        const oneDayInMs = 24 * 60 * 60 * 1000;
        if (completedTime && now - completedTime > oneDayInMs) {
          deleteDoc(doc(db, "reminders", rem.id)).then(() => {
            setReminders((prev) => prev.filter((r) => r.id !== rem.id));
          }).catch(err => console.error("Auto-delete error:", err));
        }
      }
    });
    // eslint-disable-next-line
  }, [reminders.length]); // Re-run only when the reminder count changes significantly

  // --- Theme/Weather Styling Logic (Kept as is for compatibility with theme files) ---

  const isDark = mode === "dark";



  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ px: 2 }}>
        {/* Header */}
        <Box sx={{ pt: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", p: 2, justifyContent: "space-between" }}>
          <Button
            onClick={() => navigate(-1)}
            sx={{
              mr: 2, width: 36, height: 36, minWidth: 0, borderRadius: 8, p: 2,
              color: isDark ? "#fff" : "#000",
              backgroundColor: isDark ? "#f1f1f111" : "#8a8a8a6f",
            }}
          >
            <ArrowBackIcon />
          </Button>

          <ProfilePic />
          </Box>
        </Box>

        <Container maxWidth="sm" sx={{ pt: 2, pb: 8 }}>
          {/* Notification Prompt */}
          {!notifAllowed && (
            <Box sx={{ mb: 2 }}>
              <Button
                variant="outlined"
                onClick={async () => {
                  await requestNotificationPermission();
                  setNotifAllowed(Notification.permission === "granted");
                }}
              >
                Enable Push Notifications
              </Button>
            </Box>
          )}

          {/* Action Header */}
          <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
            <Typography variant="h6" fontWeight="bold" sx={{ flex: 1, color: isDark ? "#fff" : "#000" }}>
              Reminders
            </Typography>
            <Tooltip title="Add Reminder">
              <Button
                size="medium"
                sx={{ ml: 2, boxShadow: "none", background: theme.palette.primary.bg, color: "#000", borderRadius: 8, width: "40px" }}
                onClick={() => setDrawerOpen(true)}
              >
                <AddIcon />
              </Button>
            </Tooltip>
          </Box>

          {/* Search Field */}
          <Box sx={{ mb: 2 }}>
            <TextField
              size="small"
              placeholder="Search reminders..."
              variant="outlined"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: isDark ? "#aaa" : "#333" }} />
                  </InputAdornment>
                ),
                style: { color: isDark ? "#fff" : "#000", borderRadius: '15px' },
              }}
              sx={{ width: "100%", mb: 2, borderRadius: 2 }}
            />
          </Box>

          {/* Active Reminders Card */}
          <Card sx={{ mb: 2, backgroundColor: isDark ? "transparent" : "#ffffffaf", borderRadius: 4, boxShadow: "none" }}>
            <CardContent sx={{ mb: 2, backgroundColor: "transparent" }}>
              <Typography variant="h6" fontSize={16} sx={{ mb: 2 }}>
                Active Reminders ({filteredReminders.length})
              </Typography>
              {loading ? (
                <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", py: 4 }}>
                  <CircularProgress color="inherit" />
                </Box>
              ) : filteredReminders.length === 0 ? (
                <Typography color="text.secondary" display={"flex"} alignItems={"center"} justifyContent={"center"} fontSize={16}>
                  No reminders yet.
                </Typography>
              ) : (
                <List>
                  {filteredReminders.map((rem) => (
                    <ReminderListItem
                      key={rem.id}
                      rem={rem}
                      mode={mode}
                      theme={theme}
                      handleToggleComplete={handleToggleComplete}
                      handleMenuOpen={handleMenuOpen}
                    />
                  ))}
                </List>
              )}
            </CardContent>
          </Card>

          {/* Completed Reminders Card */}
          <Card sx={{ mb: 2, backgroundColor: isDark ? "transparent" : "#ffffffaf", borderRadius: 4, boxShadow: "none" }}>
            <Box
              sx={{
                display: "flex", alignItems: "center", cursor: "pointer", px: 2, py: 1, userSelect: "none",
              }}
              onClick={() => setCompletedOpen((prev) => !prev)}
            >
              <ExpandMore
                sx={{
                  transform: completedOpen ? "rotate(180deg)" : "rotate(0deg)",
                  transition: "transform 0.2s",
                }}
              />
              <Typography variant="subtitle1" sx={{ ml: 1 }}>
                Completed ({completedReminders.length})
              </Typography>
            </Box>
            <Collapse in={completedOpen} timeout="auto" unmountOnExit>
              <CardContent sx={{ background: "transparent", pt: 0 }}>
                {completedReminders.length === 0 ? (
                  <Typography color="text.secondary" fontSize={15}>
                    No completed reminders.
                  </Typography>
                ) : (
                  <List>
                    {completedReminders.map((rem) => (
                      <CompletedReminderListItem
                        key={rem.id}
                        rem={rem}
                        mode={mode}
                        theme={theme}
                        handleToggleComplete={handleToggleComplete}
                        handleDeleteReminder={handleDeleteReminder}
                      />
                    ))}
                  </List>
                )}
              </CardContent>
            </Collapse>
          </Card>
        </Container>

        {/* Action Menu (for active items) */}
        <Menu
          anchorEl={menuAnchorEl}
          open={Boolean(menuAnchorEl)}
          onClose={handleMenuClose}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          transformOrigin={{ vertical: "top", horizontal: "right" }}
        >
          <MenuItem onClick={handleEditOpenFromMenu}>
            <EditIcon fontSize="small" sx={{ mr: 1 }} />
            Edit
          </MenuItem>
          <MenuItem onClick={handleDeleteFromMenu} sx={{ color: "#f44336" }}>
            <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
            Delete
          </MenuItem>
        </Menu>

        {/* Add/Edit Drawer (Using SwipeableDrawer for better UX on mobile) */}
        <SwipeableDrawer
          anchor="bottom"
          open={drawerOpen}
          onClose={() => {
            setDrawerOpen(false);
            setNewReminderData({ text: "", time: "", date: "" });
          }}
          onOpen={() => setDrawerOpen(true)}
          disableSwipeToOpen={true}
          PaperProps={{
            sx: {
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
              backgroundColor: "#23252620", // Use existing semi-transparent background
              backdropFilter: "blur(80px)",
              p: 3,
            },
          }}
        >
          <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
            Add New Reminder
          </Typography>
          <Stack spacing={2}>
            <TextField
              label="Reminder"
              value={newReminderData.text}
              onChange={e => setNewReminderData(prev => ({ ...prev, text: e.target.value }))}
              fullWidth
              variant="outlined"
              InputProps={{ style: { color: isDark ? "#fff" : "#000" } }}
              InputLabelProps={{ style: { color: isDark ? "#aaa" : "#333" } }}
            />
            <TextField
              label="Remind Date"
              type="date"
              value={newReminderData.date}
              onChange={e => setNewReminderData(prev => ({ ...prev, date: e.target.value }))}
              fullWidth
              variant="outlined"
              InputProps={{ style: { color: isDark ? "#fff" : "#000" } }}
              InputLabelProps={{ style: { color: isDark ? "#aaa" : "#333" } }}
            />
            <TextField
              label="Remind At"
              type="time"
              value={newReminderData.time}
              onChange={e => setNewReminderData(prev => ({ ...prev, time: e.target.value }))}
              fullWidth
              variant="outlined"
              InputProps={{ style: { color: isDark ? "#fff" : "#000" } }}
              InputLabelProps={{ style: { color: isDark ? "#aaa" : "#333" } }}
            />
            <Button
              variant="contained"
              sx={{
                borderRadius: 4, px: 2, py: 1, color: "#000",
                backgroundColor: theme.palette.primary.main, fontWeight: "bold",
              }}
              onClick={handleAddReminder}
              disabled={saving || !newReminderData.text.trim()}
            >
              {saving ? "Saving..." : "Add Reminder"}
            </Button>
          </Stack>
        </SwipeableDrawer>

        {/* Edit Dialog */}
        <Dialog
          open={editDialogOpen}
          onClose={() => setEditDialogOpen(false)}
          maxWidth="xs"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 2,
              backgroundColor: "#23252620",
              backdropFilter: "blur(80px)",
              p: 2,
            },
          }}
        >
          <DialogTitle>Edit Reminder</DialogTitle>
          <DialogContent sx={{ pt: 1 }}>
            <TextField
              label="Reminder"
              fullWidth
              value={editReminder?.text || ""}
              onChange={e =>
                setEditReminder({ ...editReminder, text: e.target.value })
              }
              sx={{ mb: 2 }}
              variant="outlined"
            />
            <TextField
              label="Remind Date"
              type="date"
              fullWidth
              value={editReminder?.date || ""}
              onChange={e =>
                setEditReminder({ ...editReminder, date: e.target.value })
              }
              sx={{ mb: 2 }}
              variant="outlined"
            />
            <TextField
              label="Remind At"
              type="time"
              fullWidth
              value={editReminder?.time || ""}
              onChange={e =>
                setEditReminder({ ...editReminder, time: e.target.value })
              }
              variant="outlined"
            />
          </DialogContent>
          <DialogActions>
            <Button sx={{ borderRadius: 4, px: 2, py: 1, color: theme.palette.primary.maintxt, backgroundColor: theme.palette.primary.mainbg, fontWeight: "bold" }} onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="contained"
              sx={{
                borderRadius: 4, px: 2, py: 1, color: "#000",
                backgroundColor: theme.palette.primary.mainbg, fontWeight: "bold",
              }}
              onClick={handleEditSave}
              disabled={saving || !editReminder?.text.trim()}
            >
              {saving ? "Saving..." : "Save"}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </ThemeProvider>
  );
});

export default Reminders;