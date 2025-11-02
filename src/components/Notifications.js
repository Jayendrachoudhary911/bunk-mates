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
  Divider, // Added Divider for the drawer list
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

// Helper function to format the time label for grouping
const formatTimeLabel = (timestamp) => {
    if (!timestamp || !timestamp.toDate) return 'Time unknown';
    const date = timestamp.toDate();
    const hour = date.getHours();
    return `${date.toISOString().split('T')[0]}-${hour}`;
};

// Helper function to get a display time for the group
const getGroupDisplayTime = (timestamp) => {
    if (!timestamp || !timestamp.toDate) return 'Time unknown';
    const date = timestamp.toDate();
    date.setMinutes(0);
    date.setSeconds(0);
    date.setMilliseconds(0);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [indexError, setIndexError] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  // Renamed to selectedGroup to hold the entire group object for the drawer
  const [selectedGroup, setSelectedGroup] = useState(null); 
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

  // --- Grouping Logic (Same as previous step) ---
  const groupedNotifications = useMemo(() => {
    const byDate = notifications.reduce((acc, notif) => {
      const dateLabel = formatDateLabel(notif.timestamp);
      if (!acc[dateLabel]) acc[dateLabel] = [];
      acc[dateLabel].push(notif);
      return acc;
    }, {});

    const finalGrouped = {};

    for (const dateLabel in byDate) {
      finalGrouped[dateLabel] = [];
      const notifsForDate = byDate[dateLabel];

      const bySenderAndTime = notifsForDate.reduce((acc, notif) => {
        const timeKey = formatTimeLabel(notif.timestamp);
        // Use senderId if available for more robust chat grouping, otherwise fall back to title/pic
        const senderKey = `${notif.senderId || notif.title || 'Unknown'}|${notif.pic || 'NoPic'}|${timeKey}`;

        if (!acc[senderKey]) {
          acc[senderKey] = {
            senderTitle: notif.title,
            senderPic: notif.pic,
            groupTime: getGroupDisplayTime(notif.timestamp),
            notifications: [],
            isSeen: notif.seen,
            latestTimestamp: notif.timestamp,
          };
        }
        
        acc[senderKey].notifications.push(notif);

        if (!notif.seen) {
            acc[senderKey].isSeen = false;
        }

        return acc;
      }, {});

      const groupsArray = Object.values(bySenderAndTime).sort((a, b) => 
        (b.latestTimestamp?.toDate().getTime() || 0) - (a.latestTimestamp?.toDate().getTime() || 0)
      );

      finalGrouped[dateLabel] = groupsArray;
    }

    return finalGrouped;
  }, [notifications]);
  // -----------------------------------

  // Function to mark an entire group as read
  const markGroupAsRead = async (group) => {
    if (!group) return;
    const updates = group.notifications
        .filter(notif => !notif.seen)
        .map(notif => updateDoc(doc(db, "notifications", notif.id), { seen: true }));
    
    await Promise.all(updates);
  }

  const deleteNotification = async (id) => {
    await deleteDoc(doc(db, "notifications", id));
  };

  const onBack = () => navigate(-1);

  // --- ⭐️ New: Handles click on the main group card (Opens Drawer) ---
  const handleGroupClick = (group) => {
    setSelectedGroup(group);
    setDrawerOpen(true);
  };
  // -------------------------

  // --- ⭐️ New: Handles click on an individual notification inside the drawer ---
  const handleDrawerNotificationClick = (notif, group) => {
    // 1. Mark the entire group as read
    markGroupAsRead(group); 
    setDrawerOpen(false);
    
    // 2. Navigation logic for 'chat' type
    if (notif.type === 'chat' && notif.senderId) {
      navigate(`/chat/${notif.senderId}`, {
        state: {
          displayName: notif.title,
          photoURL: notif.pic, 
        },
      });
    }
    // For non-chat types, we simply mark as read and close the drawer.
  };
  // -------------------------

  const handleDrawerClose = () => {
    setSelectedGroup(null);
    setDrawerOpen(false);
  };

  const handleDeleteFromDrawer = async () => {
    // For simplicity, delete the latest notification in the group. 
    // In a real app, you might want to delete the whole group.
    if (selectedGroup) {
      await deleteNotification(selectedGroup.notifications[0].id);
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
          {indexError && (
            <Alert severity="error" sx={{ m: 2, overflowWrap: 'break-word' }}>
              Firestore Index Error. You may need to create an index. Follow this link: <a href={indexError} target="_blank" rel="noopener noreferrer">{indexError}</a>
            </Alert>
          )}
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
                  {groupedNotifications[dateLabel].map((group, index) => {
                    const latestNotif = group.notifications[0];
                    const groupCount = group.notifications.length;
                    const isGroupSeen = group.isSeen;

                    return (
                        <Card
                            key={`${dateLabel}-${index}`}
                            onClick={() => handleGroupClick(group)} // Click on group opens the drawer
                            sx={{
                              mb: 0,
                              my: 0.3,
                              cursor: 'pointer',
                              bgcolor: isGroupSeen ? 'transparent' : 'primary.mainbg',
                              color: isGroupSeen ? 'text.secondary' : 'primary.contrastText',
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
                                <Avatar src={latestNotif.pic} sx={{ bgcolor: 'secondary.main' }}>
                                  {!latestNotif.pic && <NotificationsIcon />}
                                </Avatar>
                              </ListItemAvatar>
                              <ListItemText
                                primary={
                                    <Box>
                                        <Typography component="span" fontWeight="bold" color="text.primary" noWrap sx={{ mr: 1 }}>
                                            {group.senderTitle}
                                        </Typography>
                                        {groupCount > 1 && (
                                            <Typography component="span" variant="caption" sx={{ color: 'text.secondary', fontWeight: 'bold' }}>
                                                ({groupCount} messages)
                                            </Typography>
                                        )}
                                        <Typography component="span" variant="caption" sx={{ color: 'text.secondary', float: 'right' }}>
                                            {group.groupTime}
                                        </Typography>
                                    </Box>
                                }
                                secondary={
                                  <Typography variant="body2" sx={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'text.secondary' }}>
                                    {groupCount > 1 ? `Latest: ${latestNotif.content}` : latestNotif.content}
                                  </Typography>
                                }
                                primaryTypographyProps={{ sx: { mb: 0.5 } }}
                                sx={{ '& .MuiListItemText-primary': { mb: 0.5 } }}
                              />
                            </ListItem>
                          </CardContent>
                        </Card>
                    );
                  })}
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
          {selectedGroup && (
            <Box sx={{ p: 2, pb: 4, textAlign: 'left' }}>
              <Box sx={{ width: 40, height: 5, backgroundColor: 'grey.300', borderRadius: 3, mx: 'auto', mb: 2 }} />
              
              <Typography variant="h5" component="div" fontWeight="bold" sx={{ mb: 1 }}>
                {selectedGroup.senderTitle} ({selectedGroup.notifications.length})
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
                {selectedGroup.groupTime}
              </Typography>
              
              <Divider sx={{ mb: 2 }} />

              {/* List of individual notifications in the group */}
              <List sx={{ maxHeight: '30vh', overflowY: 'auto', p: 0, mb: 2 }}>
                {selectedGroup.notifications.map((notif) => (
                    <ListItem 
                        key={notif.id}
                        disablePadding 
                        button // Makes it clickable
                        onClick={() => handleDrawerNotificationClick(notif, selectedGroup)}
                        sx={{ 
                            py: 0.5,
                            bgcolor: notif.seen ? 'transparent' : 'action.selected',
                            cursor: notif.type === 'chat' ? 'pointer' : 'default', // Indicate chat items are special
                        }}
                    >
                        <ListItemText
                            primary={notif.content}
                            secondary={notif.timestamp?.toDate().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                            primaryTypographyProps={{ fontWeight: notif.seen ? 'regular' : 'bold', color: 'text.primary', noWrap: true }}
                            secondaryTypographyProps={{ variant: 'caption', color: 'text.secondary' }}
                        />
                        {notif.type === 'chat' && <NotificationsIcon sx={{ color: 'primary.main', fontSize: 18 }} />}
                    </ListItem>
                ))}
              </List>

              <Divider sx={{ my: 2 }} />

              <Button 
                variant="contained" 
                color="primary" 
                fullWidth 
                startIcon={<DoneIcon />} 
                onClick={() => { markGroupAsRead(selectedGroup); handleDrawerClose(); }}
                disabled={selectedGroup.isSeen} // Disable if already seen
                sx={{ mb: 1 }}
              >
                {selectedGroup.isSeen ? 'Marked as Read' : 'Mark Group as Read'}
              </Button>
              
              <Button variant="outlined" color="error" fullWidth startIcon={<DeleteIcon />} onClick={handleDeleteFromDrawer}>
                Delete Latest Notification
              </Button>
            </Box>
          )}
        </SwipeableDrawer>
      </Box>
    </ThemeProvider>
  );
}