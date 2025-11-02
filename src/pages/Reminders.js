// ...existing code...
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  useMediaQuery,
  Alert,
} from "@mui/material";
import { ThemeProvider, useTheme } from "@mui/material/styles";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
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
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentReminder, setCurrentReminder] = useState(null); 
  // ALWAYS use fallback (no orderBy) to avoid composite index requirement
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
      console.log("Auth user:", user); // DEBUG
      setCurrentUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Real-time Firestore subscription — always fallback to query without orderBy
  useEffect(() => {
    if (!currentUser) {
      setReminders([]);
      return;
    }

    setLoading(true);

    const baseCollection = collection(db, "reminders");
    const q = query(baseCollection, where("uid", "==", currentUser.uid)); // fallback: no orderBy

    const unsubscribe = onSnapshot(q, (snapshot) => {
      console.log("Snapshot size:", snapshot.size); // DEBUG
      const remindersData = snapshot.docs.map((d) => {
        const data = d.data() || {};

        // Normalize text
        const text = data.text || "";

        // Normalize createdAt
        const createdAt = data.createdAt ? (data.createdAt.toDate ? data.createdAt.toDate() : new Date(data.createdAt)) : new Date();

        // Normalize date/time fields: support timestamp stored in `date` or combined timestamp
        let dateStr = "";
        let timeStr = "";

        // If there's a dedicated date field that is a Firestore Timestamp
        if (data.date && typeof data.date === "object" && data.date.toDate) {
          const dt = data.date.toDate();
          dateStr = dt.toISOString().split("T")[0];
          timeStr = dt.toTimeString().slice(0,5);
        } else if (data.datetime && typeof data.datetime === "object" && data.datetime.toDate) {
          // Some schemas store a single datetime field
          const dt = data.datetime.toDate();
          dateStr = dt.toISOString().split("T")[0];
          timeStr = dt.toTimeString().slice(0,5);
        } else {
          // Fall back to string fields if present
          dateStr = typeof data.date === "string" ? data.date : (data.date ? String(data.date) : "");
          timeStr = typeof data.time === "string" ? data.time : (data.time ? String(data.time) : "");
        }

        return {
          id: d.id,
          ...data,
          text,
          date: dateStr,
          time: timeStr,
          createdAt,
        };
      });
      console.log("Fetched reminders:", remindersData); // DEBUG
      setReminders(remindersData);
      setLoading(false);
    }, (error) => {
      // Hide index errors — log only and continue with empty state
      console.error("Firestore error fetching reminders (hidden):", error);
      setReminders([]);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [currentUser]);

  // Filter and sort reminders based on search and completion status
  const filteredAndSortedReminders = useMemo(() => {
    const active = [];
    const completed = [];

    reminders.forEach(r => {
      const text = (r.text || "").toString();
      const matchesSearch = text.toLowerCase().includes(searchQuery.toLowerCase());

      if (matchesSearch) {
        if (r.completed) {
          completed.push(r);
        } else {
          active.push(r);
        }
      }
    });

    // Sort active reminders by date/time ascending (soonest first)
    active.sort((a, b) => {
      const dateA = new Date(`${a.date || formatDateForInput(new Date())}T${a.time || "00:00"}:00`);
      const dateB = new Date(`${b.date || formatDateForInput(new Date())}T${b.time || "00:00"}:00`);
      return dateA.getTime() - dateB.getTime();
    });

    // Sort completed reminders by createdAt descending (most recently completed first)
    completed.sort((a, b) => {
      const ca = a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt);
      const cb = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt);
      return cb.getTime() - ca.getTime();
    });

    return { active, completed };
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
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
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

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ flexGrow: 1, bgcolor: 'background.default', minHeight: '100vh', px: isMobile ? 1 : 2 }}>
        <AppBar position="static" elevation={0} sx={{ bgcolor: 'transparent', color: 'text.primary', mt: 2 }}>
          <Toolbar>
            <IconButton edge="start" color="inherit" onClick={onBack} sx={{ mr: 2 }}>
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h6" color="inherit" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
              Reminders
            </Typography>
            <IconButton color="inherit" onClick={() => handleOpenDialog()}>
              <AddIcon />
            </IconButton>
          </Toolbar>
        </AppBar>

        <Container sx={{ mt: 2, p: 0 }}>
          {!currentUser && !loading && (
            <Alert severity="info" sx={{ mb: 2 }}>
              Not signed in. Sign in to view your reminders.
            </Alert>
          )}

          {/* Search Bar */}
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Search reminders..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{ mb: 3, '.MuiOutlinedInput-notchedOutline': { borderColor: 'text.secondary' } }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
            }}
          />

          {loading ? (
            <Box display="flex" justifyContent="center" alignItems="center" mt={5}><CircularProgress /></Box>
          ) : (
            <>
              {/* Active Reminders Section */}
              <Box sx={{ mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
                  Active Reminders ({filteredAndSortedReminders.active.length})
                </Typography>
                {filteredAndSortedReminders.active.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">No active reminders yet.</Typography>
                ) : (
                  <List disablePadding>
                    {filteredAndSortedReminders.active.map((reminder) => {
                      const dateVal = reminder.date || formatDateForInput(new Date());
                      const timeVal = reminder.time || "00:00";
                      const isPast = new Date(`${dateVal}T${timeVal}:00`) < new Date();
                      return (
                      <ListItem
                        key={reminder.id}
                        secondaryAction={
                          <Box>
                            <IconButton edge="end" aria-label="edit" onClick={() => handleOpenDialog(reminder)} size="small">
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton edge="end" aria-label="delete" onClick={() => handleDeleteReminder(reminder.id)} size="small" sx={{ ml: 1 }}>
                              <DeleteIcon fontSize="small" color="error" />
                            </IconButton>
                          </Box>
                        }
                        sx={{ 
                            bgcolor: 'background.paper', 
                            borderRadius: 2, 
                            mb: 1, 
                            boxShadow: theme.shadows[1],
                            opacity: isPast ? 0.6 : 1,
                        }}
                      >
                        <ListItemIcon>
                          <Checkbox
                            edge="start"
                            checked={Boolean(reminder.completed)}
                            onChange={() => handleToggleCompleted(reminder.id, reminder.completed)}
                            tabIndex={-1}
                            disableRipple
                          />
                        </ListItemIcon>
                        <ListItemText 
                            primary={reminder.text} 
                            secondary={`${dateVal} at ${timeVal}`} 
                            primaryTypographyProps={{ 
                                sx: { 
                                    textDecoration: reminder.completed ? 'line-through' : 'none',
                                    color: isPast && !reminder.completed ? 'error.main' : 'inherit'
                                } 
                            }}
                        />
                      </ListItem>
                    )})}
                  </List>
                )}
              </Box>

              {/* Completed Reminders Section */}
              <Box>
                <Button 
                  fullWidth 
                  onClick={() => setShowCompleted(!showCompleted)} 
                  sx={{ 
                    justifyContent: 'flex-start', 
                    color: 'text.primary', 
                    fontWeight: 'bold', 
                    mb: 1, 
                    py: 1,
                    px: 0,
                    bgcolor: 'transparent',
                    '&:hover': { bgcolor: 'action.hover' }
                  }}
                  endIcon={showCompleted ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                >
                  Completed ({filteredAndSortedReminders.completed.length})
                </Button>
                <Collapse in={showCompleted}>
                  <List disablePadding>
                    {filteredAndSortedReminders.completed.length === 0 ? (
                      <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>No completed reminders yet.</Typography>
                    ) : (
                      filteredAndSortedReminders.completed.map((reminder) => (
                        <ListItem
                          key={reminder.id}
                          secondaryAction={
                            <Box>
                              <IconButton edge="end" aria-label="edit" onClick={() => handleOpenDialog(reminder)} size="small">
                                <EditIcon fontSize="small" />
                              </IconButton>
                              <IconButton edge="end" aria-label="delete" onClick={() => handleDeleteReminder(reminder.id)} size="small" sx={{ ml: 1 }}>
                                <DeleteIcon fontSize="small" color="error" />
                              </IconButton>
                            </Box>
                          }
                          sx={{ 
                              bgcolor: 'background.paper', 
                              borderRadius: 2, 
                              mb: 1, 
                              boxShadow: theme.shadows[1],
                              opacity: 0.7,
                          }}
                        >
                          <ListItemIcon>
                            <Checkbox
                              edge="start"
                              checked={Boolean(reminder.completed)}
                              onChange={() => handleToggleCompleted(reminder.id, reminder.completed)}
                              tabIndex={-1}
                              disableRipple
                            />
                          </ListItemIcon>
                          <ListItemText 
                              primary={reminder.text} 
                              secondary={`${reminder.date || ''} at ${reminder.time || ''}`}
                              primaryTypographyProps={{ textDecoration: 'line-through' }}
                          />
                        </ListItem>
                      ))
                    )}
                  </List>
                </Collapse>
              </Box>
            </>
          )}
        </Container>

        {/* Add/Edit Reminder Dialog */}
        <Dialog open={dialogOpen} onClose={handleCloseDialog} fullWidth maxWidth="sm">
          <DialogTitle>{currentReminder ? "Edit Reminder" : "Add New Reminder"}</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Reminder Text"
              type="text"
              fullWidth
              variant="outlined"
              value={reminderText}
              onChange={(e) => setReminderText(e.target.value)}
              sx={{ mb: 2 }}
            />
            <TextField
              margin="dense"
              label="Date"
              type="date"
              fullWidth
              variant="outlined"
              value={reminderDate}
              onChange={(e) => setReminderDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{ mb: 2 }}
            />
            <TextField
              margin="dense"
              label="Time"
              type="time"
              fullWidth
              variant="outlined"
              value={reminderTime}
              onChange={(e) => setReminderTime(e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{ mb: 2 }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog} color="inherit">Cancel</Button>
            <Button onClick={handleSaveReminder} color="primary" variant="contained">
              {currentReminder ? "Save Changes" : "Add Reminder"}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </ThemeProvider>
  );
}
// ...existing code...