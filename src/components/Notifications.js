// src/pages/Notifications.js
import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Card,
  CardContent,
  CircularProgress,
  Container,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Alert,
  SwipeableDrawer,
  Button,
  Avatar,
  ListItemAvatar,
} from "@mui/material";
import { ThemeProvider } from "@mui/material/styles";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import DoneIcon from "@mui/icons-material/Done";
import DeleteIcon from "@mui/icons-material/Delete";
import NotificationsIcon from '@mui/icons-material/Notifications';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  updateDoc,
  doc,
  deleteDoc,
} from "firebase/firestore";
import { db, auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useThemeToggle } from "../contexts/ThemeToggleContext";
import { getTheme } from "../theme";

// Helper function to format date labels
const formatDateLabel = (timestamp) => {
  if (!timestamp || !timestamp.toDate) return 'Date unknown';
  const date = timestamp.toDate();
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const isSameDay = (d1, d2) => d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();
  if (isSameDay(date, today)) return 'Today';
  if (isSameDay(date, yesterday)) return 'Yesterday';
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  if (date > sevenDaysAgo) return date.toLocaleDateString('en-US', { weekday: 'long' });
  return date.toLocaleDateString('en-US');
};

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [indexError, setIndexError] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const { mode } = useThemeToggle();
  const theme = getTheme(mode);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => setCurrentUser(user));
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!currentUser) {
      setNotifications([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const q = query(
      collection(db, "notifications"),
      where("uid", "==", currentUser.uid),
      orderBy("timestamp", "desc")
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifData = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setNotifications(notifData);
      setLoading(false);
    }, (error) => {
      console.error("Firestore error:", error);
      if (error.code === "failed-precondition") setIndexError(error.message.match(/https:\/\/console\.firebase\.google\.com\/project\/[^\s]+/)?.[0]);
      setNotifications([]);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [currentUser]);

  const groupedNotifications = useMemo(() => {
    return notifications.reduce((acc, notif) => {
      const dateLabel = formatDateLabel(notif.timestamp);
      if (!acc[dateLabel]) acc[dateLabel] = [];
      acc[dateLabel].push(notif);
      return acc;
    }, {});
  }, [notifications]);

  const markAsRead = async (id) => {
    await updateDoc(doc(db, "notifications", id), { seen: true });
  };

  const deleteNotification = async (id) => {
    await deleteDoc(doc(db, "notifications", id));
  };

  const onBack = () => navigate(-1);

  // --- ⭐️ Updated Click Handler ---
  const handleNotificationClick = (notif) => {
    if (!notif.seen) {
      markAsRead(notif.id);
    }

    // Check for 'chat' type AND the required 'senderId' field
    if (notif.type === 'chat' && notif.senderId) {
      // Navigate to a user-specific chat URL
      navigate(`/chat/${notif.senderId}`, {
        // Pass the sender's info to the chat component using state
        state: {
          displayName: notif.title, // The sender's name from the notification title
          photoURL: notif.pic,       // The sender's picture from the notification pic
        },
      });
    } else {
      // For all other types, open the details drawer
      setSelectedNotification(notif);
      setDrawerOpen(true);
    }
  };
  // -------------------------

  const handleDrawerClose = () => setDrawerOpen(false);

  const handleDeleteFromDrawer = async () => {
    if (selectedNotification) {
      await deleteNotification(selectedNotification.id);
      setDrawerOpen(false);
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ flexGrow: 1, bgcolor: 'background.default', minHeight: '100vh', px: 1 }}>
        <AppBar position="static" elevation={0} sx={{ bgcolor: 'transparent', color: 'text.primary', mt: 2 }}>
          <Toolbar>
            <IconButton edge="start" color="inherit" onClick={onBack} sx={{ mr: 2 }}>
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h6" color="inherit" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
              Notifications
            </Typography>
          </Toolbar>
        </AppBar>

        <Container sx={{ mt: 0, p: 0 }}>
          {loading ? (
            <Box display="flex" justifyContent="center" alignItems="center" mt={5}><CircularProgress /></Box>
          ) : notifications.length === 0 ? (
            <Typography variant="body1" align="center">No notifications found.</Typography>
          ) : (
            <List sx={{ width: '100%' }}>
              {Object.keys(groupedNotifications).map((dateLabel) => (
                <React.Fragment key={dateLabel}>
                  <Typography variant="overline" sx={{ display: 'block', fontWeight: 700, fontSize: '0.8rem', pt: 1.5, px: 2, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 1, mt: 0 }}>
                    {dateLabel}
                  </Typography>
                  {groupedNotifications[dateLabel].map((notif) => (
                    <Card
                      key={notif.id}
                      onClick={() => handleNotificationClick(notif)}
                      sx={{
                        mb: 0,
                        my: 0.3,
                        cursor: 'pointer',
                        bgcolor: notif.seen ? 'transparent' : 'primary.mainbg',
                        color: notif.seen ? 'text.secondary' : 'primary.contrastText',
                        boxShadow: "none",
                        borderRadius: 3,
                        '&.MuiPaper-root': {
                          backgroundImage: 'none',
                        },
                      }}
                    >
                      <CardContent sx={{ pt: 0, pb: "0 !Important", my: 0.3 }}>
                        <ListItem disablePadding sx={{ pt: 0, pb: 0 }}>
                          <ListItemAvatar>
                            <Avatar src={notif.pic} sx={{ bgcolor: 'secondary.main' }}>
                              {!notif.pic && <NotificationsIcon />}
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={notif.title}
                            secondary={
                              <Typography variant="body2" sx={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'text.secondary' }}>
                                {notif.content}
                              </Typography>
                            }
                            primaryTypographyProps={{ fontWeight: 'bold', color: 'text.primary', noWrap: true }}
                            sx={{ '& .MuiListItemText-primary': { mb: 0.5 } }}
                          />
                        </ListItem>
                      </CardContent>
                    </Card>
                  ))}
                </React.Fragment>
              ))}
            </List>
          )}
        </Container>
        
        <SwipeableDrawer
          anchor="bottom"
          open={drawerOpen}
          onClose={handleDrawerClose}
          onOpen={() => setDrawerOpen(true)}
          sx={{ '& .MuiDrawer-paper': { borderTopLeftRadius: 16, borderTopRightRadius: 16, height: 'auto', maxHeight: '70vh', bgcolor: 'background.paper' } }}
        >
          {selectedNotification && (
            <Box sx={{ p: 2, pb: 4, textAlign: 'left' }}>
              <Box sx={{ width: 40, height: 5, backgroundColor: 'grey.300', borderRadius: 3, mx: 'auto', mb: 2 }} />
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Typography variant="h5" component="div" fontWeight="bold">{selectedNotification.title}</Typography>
              </Box>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>{selectedNotification.timestamp?.toDate().toLocaleString()}</Typography>
              <Typography variant="body1" sx={{ mb: 4, whiteSpace: 'pre-wrap', color: 'text.primary' }}>{selectedNotification.content}</Typography>
              <Button variant="outlined" color="error" fullWidth startIcon={<DeleteIcon />} onClick={handleDeleteFromDrawer}>
                Delete
              </Button>
            </Box>
          )}
        </SwipeableDrawer>
      </Box>
    </ThemeProvider>
  );
}