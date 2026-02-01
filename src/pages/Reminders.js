// src/pages/Reminders.js
import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Container,
  IconButton,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Checkbox,
  TextField,
  InputAdornment,
  Collapse,
  Button,
  useMediaQuery,
  Alert,
  SwipeableDrawer,
  Divider
} from "@mui/material";
import { ThemeProvider, useTheme } from "@mui/material/styles";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import CloseIcon from "@mui/icons-material/Close";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { db, auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useThemeToggle } from "../contexts/ThemeToggleContext";
import { getTheme } from "../theme";
import { motion } from "framer-motion";
import Notifications from "../elements/Notifications";

// Helper to format date for input type="date" (YYYY-MM-DD)
const formatDateForInput = (date) => {
  if (!date) return '';
  const d = date instanceof Date ? date : (date.toDate ? date.toDate() : new Date(date));
  return d.toISOString().split('T')[0];
};

// Helper to format time for input type="time" (HH:MM)
const formatTimeForInput = (date) => {
  if (!date) return '';
  const d = date instanceof Date ? date : (date.toDate ? date.toDate() : new Date(date));
  return d.toTimeString().slice(0, 5); // "HH:MM"
};

export default function Reminders() {
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCompleted, setShowCompleted] = useState(false);
  // ⭐️ NEW STATE for past reminders grouping
  const [showPast, setShowPast] = useState(false); 
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [currentReminder, setCurrentReminder] = useState(null); 
  
  // Form states for adding/editing
  const [reminderText, setReminderText] = useState("");
  const [reminderDate, setReminderDate] = useState(formatDateForInput(new Date()));
  const [reminderTime, setReminderTime] = useState(formatTimeForInput(new Date()));

  const { mode } = useThemeToggle();
  const theme = getTheme(mode);
  const muiTheme = useTheme(); 
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('sm'));
  const navigate = useNavigate();

  // Fetches and sets the current authenticated user
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Real-time Firestore subscription
  useEffect(() => {
    if (!currentUser) {
      setReminders([]);
      return;
    }

    setLoading(true);

    const baseCollection = collection(db, "reminders");
    const q = query(baseCollection, where("uid", "==", currentUser.uid)); // fallback: no orderBy

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const remindersData = snapshot.docs.map((d) => {
        const data = d.data() || {};
        const createdAt = data.createdAt ? (data.createdAt.toDate ? data.createdAt.toDate() : new Date(data.createdAt)) : new Date();
        
        let dateStr = typeof data.date === "string" ? data.date : "";
        let timeStr = typeof data.time === "string" ? data.time : "";

        return {
          id: d.id,
          ...data,
          text: data.text || "",
          date: dateStr,
          time: timeStr,
          createdAt,
        };
      });
      setReminders(remindersData);
      setLoading(false);
    }, (error) => {
      console.error("Firestore error fetching reminders (hidden):", error);
      setReminders([]);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [currentUser]);

  // Filter and sort reminders based on search and completion status
  const filteredAndSortedReminders = useMemo(() => {
    // ⭐️ Split into three categories
    const past = []; 
    const active = [];
    const completed = [];
    const now = new Date();

    reminders.forEach(r => {
      const text = (r.text || "").toString();
      const matchesSearch = text.toLowerCase().includes(searchQuery.toLowerCase());
      
      if (matchesSearch) {
        if (r.completed) {
          completed.push(r);
        } else {
          // Check if date/time is valid and in the past
          const reminderDateTime = new Date(`${r.date || formatDateForInput(now)}T${r.time || "00:00"}:00`);
          
          if (reminderDateTime < now) {
            past.push(r); // ⭐️ Past AND UNCOMPLETED
          } else {
            active.push(r); // Active (future or current time)
          }
        }
      }
    });

    // Sort active reminders by date/time ascending (soonest first)
    active.sort((a, b) => {
      const dateA = new Date(`${a.date || formatDateForInput(now)}T${a.time || "00:00"}:00`);
      const dateB = new Date(`${b.date || formatDateForInput(now)}T${b.time || "00:00"}:00`);
      return dateA.getTime() - dateB.getTime();
    });

    // Sort past reminders by date/time ascending (oldest past first)
    past.sort((a, b) => {
      const dateA = new Date(`${a.date || formatDateForInput(now)}T${a.time || "00:00"}:00`);
      const dateB = new Date(`${b.date || formatDateForInput(now)}T${b.time || "00:00"}:00`);
      return dateA.getTime() - dateB.getTime();
    });

    // Sort completed reminders by createdAt descending (most recently completed first)
    completed.sort((a, b) => {
      const ca = a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt);
      const cb = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt);
      return cb.getTime() - ca.getTime();
    });

    return { past, active, completed };
  }, [reminders, searchQuery]);

  // Firestore update: Toggle completion status
  const handleToggleCompleted = async (id, currentStatus) => {
    if (!currentUser) return;
    try {
      const reminderRef = doc(db, "reminders", id);
      await updateDoc(reminderRef, {
        completed: !currentStatus,
      });
    } catch (err) {
      console.error("Error toggling completed:", err);
    }
  };

  // Firestore delete
  const handleDeleteReminder = async (id) => {
    if (!currentUser) return;
    try {
      await deleteDoc(doc(db, "reminders", id));
    } catch (err) {
      console.error("Error deleting reminder:", err);
    }
  };

  // Dialog handlers
  const handleOpenDialog = (reminder = null) => {
    setCurrentReminder(reminder);
    if (reminder) {
      setReminderText(reminder.text || "");
      setReminderDate(reminder.date || formatDateForInput(new Date()));
      setReminderTime(reminder.time || formatTimeForInput(new Date()));
    } else {
      setReminderText("");
      setReminderDate(formatDateForInput(new Date()));
      setReminderTime(formatTimeForInput(new Date()));
    }
    setDrawerOpen(true);
  };

  const handleCloseDialog = () => {
    setDrawerOpen(false);
    setCurrentReminder(null);
    setReminderText("");
    setReminderDate(formatDateForInput(new Date()));
    setReminderTime(formatTimeForInput(new Date()));
  };

  // Firestore add/update
  const handleSaveReminder = async () => {
    if (!currentUser || !reminderText.trim() || !reminderDate.trim() || !reminderTime.trim()) {
      alert("Please fill in all reminder details.");
      return;
    }

    const reminderData = {
      text: reminderText.trim(),
      date: reminderDate,
      time: reminderTime,
      uid: currentUser.uid,
    };

    try {
      if (currentReminder) {
        // Update existing reminder
        const reminderRef = doc(db, "reminders", currentReminder.id);
        await updateDoc(reminderRef, reminderData);
      } else {
        // Add new reminder
        await addDoc(collection(db, "reminders"), {
          ...reminderData,
          completed: false,
          createdAt: new Date(), 
        });
      }
    } catch (err) {
      console.error("Error saving reminder:", err);
      alert("Failed to save reminder. Check console for details.");
    }
    handleCloseDialog();
  };

  const onBack = () => navigate(-1);

  // Reusable Reminder List Item component
  const ReminderListItem = ({ reminder, isPast }) => {
    const dateVal = reminder.date || "";
    const timeVal = reminder.time || "";

    return (
      <ListItem
        sx={{
          borderRadius: 3,
          mb: 1.5,
          bgcolor: isPast ? (theme.palette.mode === "dark" ? "rgba(255,100,100,0.1)" : "rgba(255,100,100,0.05)") : 
                 (theme.palette.mode === "dark" ? "rgba(255,255,255,0.05)" : "background.paper"),
          boxShadow: "none",
          opacity: reminder.completed ? 0.7 : 1,
          border: "1px solid transparent",
          transition: "all 0.25s ease-in-out",
          "&:hover": {
            transform: "translateY(-2px)",
            boxShadow: "none",
          },
        }}
        secondaryAction={
          <Box>
            <IconButton
              onClick={() => handleOpenDialog(reminder)}
              size="small"
              sx={{ color: "text.secondary", "&:hover": { color: "primary.main" } }}
            >
              <EditIcon fontSize="small" />
            </IconButton>
            <IconButton
              onClick={() => handleDeleteReminder(reminder.id)}
              size="small"
              sx={{ ml: 0.5, color: "text.secondary", "&:hover": { color: "error.main" } }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Box>
        }
      >
        <ListItemIcon sx={{ minWidth: 40 }}>
          <Checkbox
            checked={Boolean(reminder.completed)}
            onChange={() => handleToggleCompleted(reminder.id, reminder.completed)}
            sx={{ color: isPast ? "error.main" : "primary.main" }}
          />
        </ListItemIcon>
        <ListItemText
          primary={reminder.text}
          secondary={`${dateVal} at ${timeVal}`}
          primaryTypographyProps={{
            sx: {
              fontWeight: 600,
              color: isPast ? "error.light" : "text.primary",
              textDecoration: reminder.completed ? "line-through" : "none",
              transition: "color 0.3s",
            },
          }}
          secondaryTypographyProps={{ sx: { color: "text.secondary", fontSize: 13, mt: 0.2 } }}
        />
      </ListItem>
    );
  };


  return (
    <ThemeProvider theme={theme}>
    <Box
      sx={{
        flexGrow: 1,
        bgcolor: "background.default",
        px: isMobile ? 3 : 3,
        pt: 4.5,
      }}
    >
      {/* Top Bar (AppBar) remains the same */}

    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        top: 0,
        backdropFilter: "blur(18px) saturate(180%)",
        WebkitBackdropFilter: "blur(18px) saturate(180%)",
        backgroundColor: "transparent",
        color: theme.palette.text.primary,
        px: 0.5,
        py: 0.2,
        transition: "all 0.3s ease",
      }}
    >
      <Toolbar
        disableGutters
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          minHeight: "64px",
        }}
      >
        {/* Back Button */}
        <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
          <IconButton
            onClick={onBack}
            sx={{
              background:
                theme.palette.mode === "dark"
                  ? "rgba(255, 255, 255, 0.04)"
                  : "rgba(0,0,0,0.05)",
              color: theme.palette.text.primary,
              backdropFilter: "blur(10px)",
              WebkitBackdropFilter: "blur(10px)",
              "&:hover": {
                background:
                  theme.palette.mode === "dark"
                    ? "rgba(255,255,255,0.2)"
                    : "rgba(0,0,0,0.1)",
              },
              transition: "0.3s ease",
            }}
          >
            <ArrowBackRoundedIcon />
          </IconButton>
        </motion.div>

        {/* Profile Picture */}
        <motion.div
          whileHover={{ scale: 1.05 }}
          transition={{ duration: 0.2 }}
        >
          <Notifications />
        </motion.div>
      </Toolbar>
    </AppBar>

      <Box
        position="sticky"
        elevation={0}
        sx={{
          bgcolor: "transparent",
          color: "text.primary",
          backdropFilter: "blur(12px)",
          mt: 1,
        }}
      >
        <Toolbar>
          <Typography
            variant="h6"
            sx={{ flexGrow: 1, fontWeight: 700, letterSpacing: 0.3 }}
          >
            Reminders
          </Typography>
          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
            <IconButton
              color="primary"
              onClick={() => handleOpenDialog()}
              sx={{
                bgcolor: "primary.main",
                color: "#fff",
                "&:hover": { bgcolor: "primary.dark" },
              }}
            >
              <AddIcon />
            </IconButton>
          </motion.div>
        </Toolbar>
      </Box>

      <Container sx={{ mt: 1, p: 0 }}>
        {!currentUser && !loading && (
          <Alert severity="info" sx={{ mb: 2, borderRadius: 2 }}>
            Not signed in. Sign in to view your reminders.
          </Alert>
        )}

        {/* Search Bar */}
        <Box
          component={motion.div}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          sx={{ mb: 3, position: "relative" }}
        >
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Search reminders..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            // ... (rest of search bar styling remains the same)
             InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: "text.secondary", mr: 0.5, transition: "0.3s" }} />
                </InputAdornment>
              ),
              endAdornment: searchQuery && (
                <InputAdornment position="end">
                  <IconButton
                    size="small"
                    onClick={() => setSearchQuery("")}
                    sx={{ color: "text.secondary", "&:hover": { color: "error.main" } }}
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: "16px",
                px: 1.5,
                py: 0.25,
                backgroundColor: "transparent",
                boxShadow: "none",
                transition: "all 0.3s ease",
                border: mode === "dark" ? "1.3px solid #797979ff" : "1.3px solid #c8c8c8ff",
                "&:hover": { boxShadow: "none" },
                "&.Mui-focused": {
                  boxShadow: "none",
                  "& .MuiOutlinedInput-notchedOutline": {
                    borderColor: "primary.main",
                    borderWidth: 1.5,
                  },
                },
                "& .MuiOutlinedInput-notchedOutline": { borderColor: "transparent" },
              },
              "& input": { py: 1.5, color: "text.primary", fontWeight: 500 },
            }}
          />
        </Box>

        {/* Loading Spinner */}
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" mt={6}><CircularProgress /></Box>
        ) : (
          <>
            {/* Active Reminders Section (Remaining Active/Future) */}
            <Box sx={{ mb: 4 }}>
              <Typography
                variant="h6"
                sx={{ fontWeight: 700, mb: 2, color: "text.primary", letterSpacing: 0.5, display: "flex", alignItems: "center", gap: 1 }}
              >
                Active Reminders{" "}
                <Typography
                  component="span"
                  variant="subtitle2"
                  sx={{
                    bgcolor: theme.palette.mode === "dark" ? "primary.dark" : "primary.light",
                    color: theme.palette.mode === "dark" ? "primary.light" : "primary.dark",
                    px: 1.2, py: 0.2, borderRadius: 2, fontWeight: 600,
                  }}
                >
                  {filteredAndSortedReminders.active.length}
                </Typography>
              </Typography>

              {filteredAndSortedReminders.active.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ fontStyle: "italic", opacity: 0.8, ml: 0.5 }}>
                  No upcoming reminders.
                </Typography>
              ) : (
                <List disablePadding>
                  {filteredAndSortedReminders.active.map((reminder, index) => (
                    <motion.div
                      key={reminder.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <ReminderListItem reminder={reminder} isPast={false} />
                    </motion.div>
                  ))}
                </List>
              )}
            </Box>

            {filteredAndSortedReminders.past.length > 0 && (
              <Box sx={{ mb: 2 }}>
                <Button
                  fullWidth
                  onClick={() => setShowPast(!showPast)}
                  sx={{
                    justifyContent: "space-between",
                    fontWeight: 700,
                    color: "error.main",
                    mb: 1,
                    textTransform: "none",
                    borderRadius: 2,
                    px: 2,
                    py: 1.2,
                    background: theme.palette.mode === "dark" ? "rgba(255,0,0,0.1)" : "rgba(255,0,0,0.05)",
                    border: `1px solid #ff110024`,
                    boxShadow: "none",
                    transition: "all 0.3s ease",
                    "&:hover": { boxShadow: "none", transform: "scale(1.01)", background: theme.palette.mode === "dark" ? "rgba(255,0,0,0.2)" : "rgba(255,0,0,0.1)" },
                  }}
                  endIcon={showPast ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                >
                  🔴 Past Reminders ({filteredAndSortedReminders.past.length})
                </Button>

                <Collapse in={showPast} timeout="auto" unmountOnExit>
                  <List disablePadding sx={{ mt: 1 }}>
                    {filteredAndSortedReminders.past.map((reminder, index) => (
                      <motion.div
                        key={reminder.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <ReminderListItem reminder={reminder} isPast={true} />
                      </motion.div>
                    ))}
                  </List>
                </Collapse>
                <Divider sx={{ my: 0 }} />
              </Box>
            )}

            {/* Completed Reminders Section (unchanged logic) */}
            <Button
              fullWidth
              onClick={() => setShowCompleted(!showCompleted)}
              sx={{
                justifyContent: "space-between", fontWeight: 700, color: "text.primary", mb: 1, mt: 1, textTransform: "none", borderRadius: 2, px: 2, py: 1.2,
                background: theme.palette.mode === "dark" ? "linear-gradient(90deg, rgba(60,60,60,0.6), rgba(80,80,80,0.2))" : "linear-gradient(90deg, rgba(245,245,245,0.9), rgba(255,255,255,0.6))",
                boxShadow: "none", transition: "all 0.3s ease",
                "&:hover": { boxShadow: "none", transform: "scale(1.01)", background: theme.palette.mode === "dark" ? "linear-gradient(90deg, rgba(70,70,70,0.9), rgba(100,100,100,0.3))" : "linear-gradient(90deg, rgba(255,255,255,1), rgba(245,245,245,0.7))", },
              }}
              endIcon={showCompleted ? <ExpandLessIcon sx={{ transition: "0.3s" }} /> : <ExpandMoreIcon sx={{ transition: "0.3s" }} />}
            >
              Completed ({filteredAndSortedReminders.completed.length})
            </Button>

            <Collapse in={showCompleted} timeout="auto" unmountOnExit>
              <List disablePadding sx={{ mt: 1 }}>
                {filteredAndSortedReminders.completed.length === 0 ? (
                  <Typography variant="body2" color="text.secondary" sx={{ ml: 2, mb: 2 }}>
                    No completed reminders yet.
                  </Typography>
                ) : (
                  filteredAndSortedReminders.completed.map((reminder, index) => (
                    <motion.div
                      key={reminder.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <ReminderListItem reminder={reminder} isPast={false} />
                    </motion.div>
                  ))
                )}
              </List>
            </Collapse>
          </>
        )}
      </Container>

      {/* Add/Edit Reminder Drawer (unchanged) */}
      <SwipeableDrawer
        anchor="bottom"
        open={drawerOpen}
        onClose={handleCloseDialog}
        onOpen={() => setDrawerOpen(true)}
        disableSwipeToOpen={false}
        swipeAreaWidth={40}
        PaperProps={{
          sx: {
            borderTopLeftRadius: 22, borderTopRightRadius: 22, maxHeight: "90vh", p: 0, overflow: "hidden",
            backdropFilter: "blur(22px) saturate(180%)", WebkitBackdropFilter: "blur(22px) saturate(180%)",
            background: theme.palette.mode === "dark" ? "rgba(25, 25, 25, 0.45)" : "rgba(255, 255, 255, 0.55)",
            border: "none",
            boxShadow: theme.palette.mode === "dark" ? "0px -6px 40px rgba(0,0,0,0.5)" : "0px -6px 30px rgba(0,0,0,0.15)",
            transition: "all 0.3s ease-in-out", color: "text.primary",
          },
        }}
        sx={{
          "& .MuiBackdrop-root": {
            backdropFilter: "blur(10px) saturate(160%) brightness(0.9)", WebkitBackdropFilter: "blur(10px) saturate(160%) brightness(0.9)",
            backgroundColor: theme.palette.mode === "dark" ? "rgba(0, 0, 0, 0.5)" : "rgba(255, 255, 255, 0.3)",
            transition: "backdrop-filter 0.3s ease",
          },
        }}
      >
        <Box sx={{ p: 2.5, pb: 4, display: "flex", flexDirection: "column", height: "100%" }}>
          <Box sx={{ width: 40, height: 5, borderRadius: 4, backgroundColor: "grey.400", mx: "auto", mb: 2 }} />

          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: "text.primary" }}>
              {currentReminder ? "Edit Reminder" : "Add New Reminder"}
            </Typography>
            <IconButton onClick={handleCloseDialog}><CloseIcon /></IconButton>
          </Box>
          <Divider sx={{ mb: 2 }} />

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <TextField fullWidth label="Reminder Text" variant="outlined" value={reminderText} onChange={(e) => setReminderText(e.target.value)} sx={{ mb: 2, "& .MuiOutlinedInput-root": { borderRadius: 4, backgroundColor: "background.paper" } }} />
            <TextField fullWidth label="Date" type="date" value={reminderDate} onChange={(e) => setReminderDate(e.target.value)} InputLabelProps={{ shrink: true }} sx={{ mb: 2, "& .MuiOutlinedInput-root": { borderRadius: 4, backgroundColor: "background.paper" } }} />
            <TextField fullWidth label="Time" type="time" value={reminderTime} onChange={(e) => setReminderTime(e.target.value)} InputLabelProps={{ shrink: true }} sx={{ mb: 3, "& .MuiOutlinedInput-root": { borderRadius: 4, backgroundColor: "background.paper" } }} />
          </motion.div>

          <Box sx={{ mt: "auto", display: "flex", justifyContent: "space-between", gap: 2 }}>
            <Button fullWidth variant="outlined" color="inherit" onClick={handleCloseDialog} sx={{ borderRadius: 8, py: 1, fontWeight: 600, textTransform: "none" }}>
              Cancel
            </Button>
            <Button fullWidth variant="contained" onClick={handleSaveReminder} sx={{ borderRadius: 8, py: 1, fontWeight: 600, textTransform: "none", background: theme.palette.mode === "dark" ? "linear-gradient(90deg, #1e88e5, #42a5f5)" : "linear-gradient(90deg, #1976d2, #64b5f6)", boxShadow: theme.shadows[3] }}>
              {currentReminder ? "Save Changes" : "Add Reminder"}
            </Button>
          </Box>
        </Box>
      </SwipeableDrawer>
    </Box>
    </ThemeProvider>
  );
}