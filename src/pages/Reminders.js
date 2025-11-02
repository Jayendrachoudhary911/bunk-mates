import React, {
  useState,
  useEffect,
  useRef,
  useImperativeHandle,
  forwardRef,
  useMemo,
  useCallback,
} from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Typography,
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  IconButton,
  SwipeableDrawer,
  Stack,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Menu,
  MenuItem,
  Tooltip,
  InputAdornment,
  Container,
  Collapse,
} from "@mui/material";
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  NotificationsActive as NotificationsActiveIcon,
  MoreVert as MoreVertIcon,
  ArrowBack as ArrowBackIcon,
  Search as SearchIcon,
  CheckCircle as CheckCircleIcon,
  ExpandMore,
  DeleteOutline as DeleteOutlineIcon,
} from "@mui/icons-material";

import { db, messaging } from "../firebase";
import ProfilePic from "../components/Profile";
import { useWeather } from "../contexts/WeatherContext";
import { useThemeToggle } from "../contexts/ThemeToggleContext";
import { getTheme } from "../theme";

// Firestore functions
import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  doc,
  deleteDoc,
  updateDoc,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";

// FCM
import { getToken, onMessage } from "firebase/messaging";

/* -------------------------
   Helper utilities
   ------------------------- */

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
  } catch (err) {
    console.warn("Error reading user from storage", err);
  }
  return null;
}

async function requestNotificationPermission() {
  try {
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      const token = await getToken(messaging, {
        vapidKey:
          "BA3kLicUjBzLvrGk71laA_pRVYsf6LsGczyAzF-NTBWEmOE3r4_OT9YiVt_Mvzqm7dZCoPnht84wfX-WRzlaSLs",
      });
      console.log("FCM Token:", token);
      return token;
    }
  } catch (err) {
    console.error("Notification permission error:", err);
  }
  return null;
}

function showLocalNotification(title, options = {}) {
  if (Notification.permission !== "granted") return;
  // If page is focused, show normal Notification (modern browsers)
  if (document.hasFocus()) {
    try {
      new Notification(title, options);
    } catch (err) {
      console.warn("Local notification failed:", err);
    }
  } else if (navigator.serviceWorker?.ready) {
    navigator.serviceWorker.ready.then((reg) =>
      reg.showNotification(title, options).catch(() => {})
    );
  }
}

function getTodayStr() {
  const now = new Date();
  return now.toLocaleDateString("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

/* -------------------------
   Small presentational items
   ------------------------- */

const ReminderListItem = React.memo(
  // ({ rem, mode, onToggleComplete, onOpenMenu }) => {
  //   const isDark = mode === "dark";
  //   return (
  //     <ListItem
  //       key={rem.id}
  //       sx={{
  //         borderRadius: 3,
  //         py: 0.3,
  //         mb: 1,
  //         background: isDark ? "#222226" : "#f3f3f3",
  //         color: isDark ? "#fff" : "#000",
  //         opacity: rem.completed ? 0.6 : 1,
  //       }}
  //       secondaryAction={
  //         <IconButton
  //           edge="end"
  //           onClick={(e) => onOpenMenu(e, rem)}
  //           sx={{ color: isDark ? "#fff" : "#000" }}
  //           aria-label="more"
  //         >
  //           <MoreVertIcon />
  //         </IconButton>
  //       }
  //     >
  //       <IconButton
  //         onClick={() => onToggleComplete(rem)}
  //         sx={{ mr: 1, px: 0.5 }}
  //         aria-label="toggle-complete"
  //       >
  //         {rem.completed ? (
  //           <CheckCircleIcon sx={{ fontSize: 26, color: "#00c853" }} />
  //         ) : (
  //           <NotificationsActiveIcon sx={{ fontSize: 26 }} />
  //         )}
  //       </IconButton>

  //       <ListItemText
  //         primary={
  //           <Typography
  //             variant="body1"
  //             sx={{
  //               fontWeight: rem.completed ? "normal" : 700,
  //               textDecoration: rem.completed ? "line-through" : "none",
  //             }}
  //           >
  //             {rem.text}
  //           </Typography>
  //         }
  //         secondary={
  //           rem.date || rem.time ? (
  //             <Typography variant="caption" sx={{ color: "text.secondary" }}>
  //               {rem.date} {rem.time}
  //             </Typography>
  //           ) : null
  //         }
  //       />
  //     </ListItem>
  //   );
  // }
);

const CompletedReminderListItem = React.memo(
  // ({ rem, mode, onToggleComplete, onDelete }) => {
  //   const isDark = mode === "dark";
  //   return (
  //     <ListItem
  //       key={rem.id}
  //       sx={{
  //         borderRadius: 3,
  //         mb: 1,
  //         background: isDark ? "#1a1a1a" : "#fafafa",
  //         color: isDark ? "#fff" : "#000",
  //         opacity: 0.7,
  //       }}
  //     >
  //       <IconButton onClick={() => onToggleComplete(rem)} sx={{ mr: 1 }}>
  //         <CheckCircleIcon sx={{ color: "#00c853" }} />
  //       </IconButton>

  //       <ListItemText
  //         primary={
  //           <Typography variant="body1" sx={{ textDecoration: "line-through" }}>
  //             {rem.text}
  //           </Typography>
  //         }
  //         secondary={
  //           rem.time ? (
  //             <Typography variant="caption" sx={{ color: "text.secondary" }}>
  //               {rem.time}
  //             </Typography>
  //           ) : null
  //         }
  //       />
  //       <IconButton
  //         size="small"
  //         onClick={() => onDelete(rem.id)}
  //         aria-label="delete-completed"
  //       >
  //         <DeleteOutlineIcon sx={{ color: "#e53935" }} />
  //       </IconButton>
  //     </ListItem>
  //   );
  // }
);

/* -------------------------
   Main Component
   ------------------------- */

const Reminders = forwardRef(({ open, onClose }, ref) => {
  const navigate = useNavigate();
  const [reminders, setReminders] = useState([]);
  const remindersRef = useRef([]); // always holds latest reminders for intervals/listeners
  const [newReminderData, setNewReminderData] = useState({
    text: "",
    date: "",
    time: "",
  });

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
  const notifiedIdsRef = useRef({}); // track notifications per-day reliably
  const mountedRef = useRef(true);
  const [completedOpen, setCompletedOpen] = useState(false);

  const { weather } = useWeather?.() || {};
  const { mode, accent } = useThemeToggle?.() || { mode: "light", accent: "blue" };
  const theme = getTheme(mode, accent);
  const isDark = mode === "dark";

  // keep remindersRef updated
  useEffect(() => {
    remindersRef.current = reminders;
  }, [reminders]);

  // expose some methods to parent
  useImperativeHandle(ref, () => ({
    openAddReminderDrawer: () => setDrawerOpen(true),
    markReminderComplete: async (reminderId) => {
      const rem = remindersRef.current.find((r) => r.id === reminderId);
      if (rem && !rem.completed) {
        await handleToggleComplete(rem);
      }
    },
  }));

  // -------------------------
  // Firestore real-time listener
  // -------------------------
  useEffect(() => {
    mountedRef.current = true;
    const storedUser = getUserFromStorage();
    setUser(storedUser);

    let unsubscribe = null;
    if (!storedUser?.uid) {
      setReminders([]);
      setLoading(false);
      return () => {
        mountedRef.current = false;
      };
    }

    setLoading(true);
    try {
      const q = query(
        collection(db, "reminders"),
        where("uid", "==", storedUser.uid),
        orderBy("createdAt", "desc")
      );

      unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          if (!mountedRef.current) return;
          const docs = snapshot.docs.map((d) => {
            const data = d.data();
            // normalize timestamps safely
            return {
              id: d.id,
              text: data.text || "",
              date: data.date || "",
              time: data.time || "",
              completed: !!data.completed,
              createdAt: data.createdAt || null,
              completedAt: data.completedAt || null,
              uid: data.uid,
            };
          });
          setReminders(docs);
          setLoading(false);
        },
        (err) => {
          console.error("Realtime listener error:", err);
          setLoading(false);
        }
      );
    } catch (err) {
      console.error("Listener setup error:", err);
      setLoading(false);
    }

    return () => {
      mountedRef.current = false;
      if (unsubscribe) unsubscribe();
    };
    // we intentionally only run once on mount (user will be read from storage)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // -------------------------
  // FCM onMessage listener & permission
  // -------------------------
  useEffect(() => {
    let unsubscribeOnMessage = () => {};
    (async () => {
      // request permission only if not granted
      if (Notification.permission !== "granted") {
        await requestNotificationPermission();
        setNotifAllowed(Notification.permission === "granted");
      } else {
        setNotifAllowed(true);
      }

      try {
        unsubscribeOnMessage = onMessage(messaging, (payload) => {
          // payload.notification may be undefined depending on message
          const title = payload?.notification?.title || "Notification";
          const body = payload?.notification?.body || "";
          showLocalNotification(title, {
            body,
            icon: "/logo192.png",
          });
        });
      } catch (err) {
        console.warn("FCM onMessage setup failed:", err);
      }
    })();

    return () => {
      try {
        unsubscribeOnMessage();
      } catch {}
    };
  }, []);

  // -------------------------
  // Local notification scheduler
  // Uses refs to avoid stale closures & avoids leaking intervals
  // -------------------------
  useEffect(() => {
    if (!notifAllowed) return;
    const minuteInMs = 60 * 1000;
    const checkIntervalMs = 30 * 1000; // 30s

    const intervalId = setInterval(() => {
      const now = new Date();
      const todaysStr = getTodayStr();
      remindersRef.current.forEach((rem) => {
        if (!rem.time || !rem.date || rem.completed) return;
        try {
          // ensure parsing using YYYY-MM-DD + HH:MM
          const iso = `${rem.date}T${rem.time}:00`;
          const reminderDate = new Date(iso);
          if (Number.isNaN(reminderDate.getTime())) return;
          const diff = Math.abs(reminderDate.getTime() - now.getTime());
          if (diff < minuteInMs) {
            const notifiedFor = notifiedIdsRef.current[rem.id];
            if (notifiedFor !== todaysStr) {
              showLocalNotification("Reminder", { body: rem.text, icon: "/logo192.png" });
              // persist daily stamp in memory (not persisted across refresh)
              notifiedIdsRef.current = { ...notifiedIdsRef.current, [rem.id]: todaysStr };
            }
          }
        } catch (err) {
          // ignore invalid date parsing
        }
      });
    }, checkIntervalMs);

    return () => clearInterval(intervalId);
  }, [notifAllowed]);

  // -------------------------
  // Auto-delete completed older than 1 day
  // -------------------------
  useEffect(() => {
    // run once whenever reminders change
    const oneDayMs = 24 * 60 * 60 * 1000;
    reminders.forEach((rem) => {
      if (rem.completed && rem.completedAt) {
        let completedTime = null;
        if (typeof rem.completedAt?.toDate === "function") {
          completedTime = rem.completedAt.toDate().getTime();
        } else {
          completedTime = new Date(rem.completedAt).getTime();
        }
        if (!Number.isNaN(completedTime) && Date.now() - completedTime > oneDayMs) {
          // delete and optimistically update local state
          deleteDoc(doc(db, "reminders", rem.id))
            .then(() => {
              if (!mountedRef.current) return;
              setReminders((prev) => prev.filter((r) => r.id !== rem.id));
            })
            .catch((err) => console.error("Auto-delete error:", err));
        }
      }
    });
  }, [reminders]);

  // -------------------------
  // handlers
  // -------------------------
  const handleToggleComplete = useCallback(async (reminder) => {
    if (!reminder?.id) return;
    try {
      const ref = doc(db, "reminders", reminder.id);
      const completed = !reminder.completed;
      const payload = {
        completed,
        completedAt: completed ? serverTimestamp() : null,
      };
      await updateDoc(ref, payload);
      // local update is optional because real-time listener will update state
      setReminders((prev) => prev.map((r) => (r.id === reminder.id ? { ...r, ...payload } : r)));
    } catch (err) {
      console.error("Error toggling completion:", err);
    }
  }, []);

  const handleDeleteReminder = useCallback(async (id) => {
    if (!id) return;
    try {
      await deleteDoc(doc(db, "reminders", id));
      // optimistic local update (listener will also reflect)
      setReminders((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      console.error("Error deleting reminder:", err);
    }
  }, []);

  const handleAddReminder = useCallback(async () => {
    if (!newReminderData.text.trim() || !user?.uid) return;
    setSaving(true);
    try {
      const newReminder = {
        uid: user.uid,
        text: newReminderData.text.trim(),
        time: newReminderData.time || "",
        date: newReminderData.date || "",
        createdAt: serverTimestamp(),
        completed: false,
      };
      const docRef = await addDoc(collection(db, "reminders"), newReminder);
      // close drawer & reset; listener will add the item. But we'll optimistically insert:
      setReminders((prev) => [{ id: docRef.id, ...newReminder }, ...prev]);
      setNewReminderData({ text: "", time: "", date: "" });
      setDrawerOpen(false);
    } catch (err) {
      console.error("Error adding reminder:", err);
    } finally {
      if (mountedRef.current) setSaving(false);
    }
  }, [newReminderData, user]);

  const handleEditSave = useCallback(async () => {
    if (!editReminder?.text?.trim()) return;
    setSaving(true);
    try {
      const updatePayload = {
        text: editReminder.text,
        time: editReminder.time || "",
        date: editReminder.date || "",
      };
      await updateDoc(doc(db, "reminders", editReminder.id), updatePayload);
      setReminders((prev) => prev.map((r) => (r.id === editReminder.id ? { ...r, ...updatePayload } : r)));
      setEditDialogOpen(false);
      setEditReminder(null);
    } catch (err) {
      console.error("Error updating:", err);
    } finally {
      if (mountedRef.current) setSaving(false);
    }
  }, [editReminder]);

  const handleMenuOpen = useCallback((e, reminder) => {
    setMenuAnchorEl(e.currentTarget);
    setMenuReminder(reminder);
  }, []);
  const handleMenuClose = useCallback(() => {
    setMenuAnchorEl(null);
    setMenuReminder(null);
  }, []);
  const handleEditOpenFromMenu = useCallback(() => {
    handleMenuClose();
    if (menuReminder) {
      setEditReminder(menuReminder);
      setEditDialogOpen(true);
    }
  }, [menuReminder, handleMenuClose]);
  const handleDeleteFromMenu = useCallback(() => {
    handleMenuClose();
    if (menuReminder) handleDeleteReminder(menuReminder.id);
  }, [menuReminder, handleDeleteReminder, handleMenuClose]);

  // -------------------------
  // filtering
  // -------------------------
  const { filteredReminders, completedReminders } = useMemo(() => {
    const lower = searchTerm.toLowerCase();
    const active = reminders.filter((r) => !r.completed && r.text.toLowerCase().includes(lower));
    const completed = reminders.filter((r) => r.completed && r.text.toLowerCase().includes(lower));
    return { filteredReminders: active, completedReminders: completed };
  }, [reminders, searchTerm]);

  // -------------------------
  // UI
  // -------------------------
  return (
    <Box sx={{ px: 2 }}>
      <Box sx={{ pt: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", p: 2, justifyContent: "space-between" }}>
          <Button
            onClick={() => navigate(-1)}
            sx={{
              mr: 2,
              width: 36,
              height: 36,
              minWidth: 0,
              borderRadius: 8,
              p: 3,
              color: isDark ? "#fff" : "#000",
              backgroundColor: isDark ? "#1f1f1fff" : "#f0f0f0",
              "&:hover": {
                backgroundColor: isDark ? "#333337" : "#e0e0e0",
              },
            }}
          >
            <ArrowBackIcon />
          </Button>

          <ProfilePic />
        </Box>
      </Box>

      <Container maxWidth="sm" sx={{ pt: 2, pb: 8 }}>
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

        <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
          <Typography variant="h5" fontWeight="bold" sx={{ flex: 1, color: 'text.primary' }}>
            Reminders
          </Typography>
          <Tooltip title="Add Reminder">
            <Button
              size="medium"
              sx={{ ml: 2, borderRadius: 8, minWidth: 44, color: 'text.primary', backgroundColor: 'primary.mainbg', '&:hover': { backgroundColor: 'primary.mainbg' } }}
              onClick={() => setDrawerOpen(true)}
            >
              <AddIcon />
            </Button>
          </Tooltip>
        </Box>

    <Box
      sx={{
        mb: 2,
        position: "relative",
      }}
    >
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileFocus={{ scale: 1.03 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
        <TextField
          size="small"
          placeholder="Search reminders..."
          variant="outlined"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon
                  sx={{
                    color:
                      theme.palette.mode === "dark"
                        ? "rgba(255,255,255,0.6)"
                        : "rgba(0,0,0,0.5)",
                  }}
                />
              </InputAdornment>
            ),
          }}
          fullWidth
          sx={{
            "& .MuiOutlinedInput-root": {
              borderRadius: 3,
              backgroundColor:
                theme.palette.mode === "dark"
                  ? "rgba(255,255,255,0.05)"
                  : "#fafafa",
              boxShadow: "none",
              transition: "all 0.3s ease",
              "&:hover": {
                boxShadow: "none"
              },
              "&.Mui-focused fieldset": {
                borderColor: theme.palette.primary.main,
                boxShadow: "none",
              },
            },
            "& input::placeholder": {
              color:
                theme.palette.mode === "dark"
                  ? "rgba(255,255,255,0.5)"
                  : "rgba(0,0,0,0.5)",
            },
          }}
        />
      </motion.div>
    </Box>

        <Card sx={{ mb: 2, borderRadius: 5 }}>
          <CardContent>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>
              Active Reminders ({filteredReminders.length})
            </Typography>

            {loading ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                <CircularProgress />
              </Box>
            ) : filteredReminders.length === 0 ? (
              <Typography color="text.secondary">No reminders yet.</Typography>
            ) : (
              <List>
                {filteredReminders.map((rem) => (
                  <ReminderListItem
                    key={rem.id}
                    rem={rem}
                    mode={mode}
                    onToggleComplete={handleToggleComplete}
                    onOpenMenu={handleMenuOpen}
                  />
                ))}
              </List>
            )}
          </CardContent>
        </Card>

        <Card sx={{ mb: 2, borderRadius: 5 }}>
          <Box
            sx={{ display: "flex", alignItems: "center", cursor: "pointer", px: 2, py: 1 }}
            onClick={() => setCompletedOpen((p) => !p)}
          >
            <ExpandMore sx={{ transform: completedOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }} />
            <Typography variant="subtitle1" sx={{ ml: 1 }}>
              Completed ({completedReminders.length})
            </Typography>
          </Box>
          <Collapse in={completedOpen} timeout="auto" unmountOnExit>
            <CardContent sx={{ pt: 0 }}>
              {completedReminders.length === 0 ? (
                <Typography color="text.secondary">No completed reminders.</Typography>
              ) : (
                <List>
                  {completedReminders.map((rem) => (
                    <CompletedReminderListItem
                      key={rem.id}
                      rem={rem}
                      mode={mode}
                      onToggleComplete={handleToggleComplete}
                      onDelete={handleDeleteReminder}
                    />
                  ))}
                </List>
              )}
            </CardContent>
          </Collapse>
        </Card>
      </Container>

      {/* Action menu */}
      <Menu anchorEl={menuAnchorEl} open={Boolean(menuAnchorEl)} onClose={handleMenuClose}>
        <MenuItem onClick={handleEditOpenFromMenu}>
          <EditIcon fontSize="small" sx={{ mr: 1 }} />
          Edit
        </MenuItem>
        <MenuItem onClick={handleDeleteFromMenu} sx={{ color: "#f44336" }}>
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
          Delete
        </MenuItem>
      </Menu>

      {/* Add Drawer */}
      <SwipeableDrawer
        anchor="bottom"
        open={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          setNewReminderData({ text: "", date: "", time: "" });
        }}
        onOpen={() => setDrawerOpen(true)}
        disableSwipeToOpen
        PaperProps={{
          sx: { borderTopLeftRadius: 16, borderTopRightRadius: 16, p: 3 },
        }}
      >
        <Typography variant="h6" sx={{ mb: 2 }}>
          Add New Reminder
        </Typography>
        <Stack spacing={2}>
          <TextField
            label="Reminder"
            value={newReminderData.text}
            onChange={(e) => setNewReminderData((p) => ({ ...p, text: e.target.value }))}
            fullWidth
          />
          <TextField
            label="Remind Date"
            type="date"
            value={newReminderData.date}
            onChange={(e) => setNewReminderData((p) => ({ ...p, date: e.target.value }))}
            fullWidth
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="Remind At"
            type="time"
            value={newReminderData.time}
            onChange={(e) => setNewReminderData((p) => ({ ...p, time: e.target.value }))}
            fullWidth
            InputLabelProps={{ shrink: true }}
          />
          <Button variant="contained" onClick={handleAddReminder} disabled={saving || !newReminderData.text.trim()}>
            {saving ? "Saving..." : "Add Reminder"}
          </Button>
        </Stack>
      </SwipeableDrawer>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Edit Reminder</DialogTitle>
        <DialogContent>
          <TextField
            label="Reminder"
            fullWidth
            value={editReminder?.text || ""}
            onChange={(e) => setEditReminder((p) => ({ ...p, text: e.target.value }))}
            sx={{ mb: 2 }}
          />
          <TextField
            label="Remind Date"
            type="date"
            fullWidth
            value={editReminder?.date || ""}
            onChange={(e) => setEditReminder((p) => ({ ...p, date: e.target.value }))}
            InputLabelProps={{ shrink: true }}
            sx={{ mb: 2 }}
          />
          <TextField
            label="Remind At"
            type="time"
            fullWidth
            value={editReminder?.time || ""}
            onChange={(e) => setEditReminder((p) => ({ ...p, time: e.target.value }))}
            InputLabelProps={{ shrink: true }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleEditSave} disabled={saving || !editReminder?.text?.trim()}>
            {saving ? "Saving..." : "Save"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
});

export default Reminders;
