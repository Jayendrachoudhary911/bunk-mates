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
  Divider, 
  Chip, // ⭐️ ADDED CHIP
} from "@mui/material";
import { ThemeProvider } from "@mui/material/styles";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import DoneIcon from "@mui/icons-material/Done";
import DeleteIcon from "@mui/icons-material/Delete";
import NotificationsIcon from '@mui/icons-material/Notifications';
import ChatBubbleIcon from '@mui/icons-material/ChatBubble'; 
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

// ⭐️ Helper to capitalize the first letter of a string
const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [indexError, setIndexError] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null); 
  const [viewingDetailNotif, setViewingDetailNotif] = useState(null); 
  // ⭐️ NEW STATE for filtering
  const [filter, setFilter] = useState('all'); // 'all', 'unreads', or a 'type' (e.g., 'chat')
  
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

  // ⭐️ NEW: Compute unique notification types for chips
  const notificationTypes = useMemo(() => {
    const types = new Set();
    notifications.forEach(n => {
      if (n.type && n.type !== 'chat') types.add(n.type); // 'chat' is handled in the default chips
    });
    return Array.from(types);
  }, [notifications]);

  // ⭐️ NEW: Apply the filter to the raw notifications
  const filteredNotifications = useMemo(() => {
    if (filter === 'all') {
      return notifications;
    }
    if (filter === 'unreads') {
      return notifications.filter(n => !n.seen);
    }
    // Filter by type (this handles 'chat' and any other custom type)
    return notifications.filter(n => n.type === filter);
  }, [notifications, filter]);


  // Grouping Logic - now uses filteredNotifications
  const groupedNotifications = useMemo(() => {
    const byDate = filteredNotifications.reduce((acc, notif) => {
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
        // Group by Sender + Type + Pic + Time Block for maximum flexibility.
        const timeKey = formatTimeLabel(notif.timestamp);
        const senderKey = `${notif.senderId || notif.title || 'Unknown'}|${notif.type || 'Generic'}|${notif.pic || 'NoPic'}|${timeKey}`;

        if (!acc[senderKey]) {
          acc[senderKey] = {
            senderTitle: notif.title,
            senderPic: notif.pic,
            groupType: notif.type, 
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
  }, [filteredNotifications]); // DEPENDS ON FILTERED NOTIFICATIONS

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

  // Handles click on the main group card (Opens Drawer to the group list)
  const handleGroupClick = (group) => {
    setSelectedGroup(group);
    setViewingDetailNotif(null); // Ensure detail view is cleared
    setDrawerOpen(true);
  };

  // Handles click on an individual notification inside the drawer
  const handleDrawerNotificationClick = (notif, group) => {
    // 1. Mark the entire group as read
    markGroupAsRead(group); 
    
    // 2. Conditional action based on type
    if (notif.type === 'chat' && notif.senderId) {
      setDrawerOpen(false); // Close drawer before navigation
      navigate(`/chat/${notif.senderId}`, {
        state: {
          displayName: notif.title,
          photoURL: notif.pic, 
        },
      });
    } else {
      // Non-chat: Switch to the detail view inside the drawer
      setViewingDetailNotif(notif);
    }
  };

  // Function to go back from the detail view to the group list view
  const handleBackToGroupList = () => {
    setViewingDetailNotif(null);
  }

  const handleDrawerClose = () => {
    setSelectedGroup(null);
    setViewingDetailNotif(null); // Clear both states on full close
    setDrawerOpen(false);
  };

  const handleDeleteFromDrawer = async () => {
    // Determine which notification to delete (individual detail > latest in group)
    const notifToDelete = viewingDetailNotif || (selectedGroup?.notifications[0]);
    if (notifToDelete) {
      await deleteNotification(notifToDelete.id);
      
      // State cleanup logic
      if (viewingDetailNotif) {
          // If we deleted from the detail view
          const remainingNotifs = selectedGroup.notifications.filter(n => n.id !== notifToDelete.id);
          if (remainingNotifs.length === 0) {
              handleDrawerClose(); 
          } else {
              // Update selectedGroup and go back to the list view
              setSelectedGroup(prev => ({ ...prev, notifications: remainingNotifs }));
              handleBackToGroupList();
          }
      } else {
          // If we deleted from the group list view (Delete Latest)
          handleDrawerClose();
      }
    }
  };

  // --- DRAWER CONTENT RENDERERS ---

  // Renders the list of notifications within the group
  const renderGroupList = (group) => (
    <>
      <Typography variant="h5" component="div" fontWeight="bold" sx={{ mb: 1 }}>
        {group.senderTitle} ({group.notifications.length})
      </Typography>
      <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
        Grouped from {group.groupTime}
      </Typography>
      
      <Divider sx={{ mb: 2 }} />

      {/* List of individual notifications in the group */}
      <List sx={{ maxHeight: '30vh', overflowY: 'auto', p: 0, mb: 2 }}>
        {group.notifications.map((notif) => (
            <ListItem 
                key={notif.id}
                disablePadding 
                button 
                onClick={() => handleDrawerNotificationClick(notif, group)}
                sx={{ 
                    py: 0.5,
                    bgcolor: notif.seen ? 'transparent' : 'action.selected',
                    cursor: 'pointer',
                }}
            >
                <ListItemText
                    primary={notif.content}
                    secondary={notif.timestamp?.toDate().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                    primaryTypographyProps={{ fontWeight: notif.seen ? 'regular' : 'bold', color: 'text.primary', noWrap: true }}
                    secondaryTypographyProps={{ variant: 'caption', color: 'text.secondary' }}
                />
                {/* Icon to indicate type */}
                {notif.type === 'chat' ? (
                    <ChatBubbleIcon sx={{ color: 'primary.main', fontSize: 18 }} />
                ) : (
                    <NotificationsIcon sx={{ color: 'text.secondary', fontSize: 18 }} />
                )}
            </ListItem>
        ))}
      </List>

      <Divider sx={{ my: 2 }} />

      <Button 
        variant="contained" 
        color="primary" 
        fullWidth 
        startIcon={<DoneIcon />} 
        onClick={() => { markGroupAsRead(group); handleDrawerClose(); }}
        disabled={group.isSeen} 
        sx={{ mb: 1 }}
      >
        {group.isSeen ? 'Marked as Read' : 'Mark Group as Read'}
      </Button>
      
      <Button variant="outlined" color="error" fullWidth startIcon={<DeleteIcon />} onClick={handleDeleteFromDrawer}>
        Delete Latest
      </Button>
    </>
  );

  // Renders the detailed content for a single notification (non-chat only)
  const renderIndividualDetail = (notif) => (
    <>
      {/* Back button to return to the group list */}
      <IconButton edge="start" color="inherit" onClick={handleBackToGroupList} sx={{ mb: 2, ml: -2 }}>
        <ArrowBackIcon />
      </IconButton>

      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
        <Avatar src={notif.pic} sx={{ mr: 1, bgcolor: 'secondary.main' }}>
            {!notif.pic && <NotificationsIcon />}
        </Avatar>
        <Typography variant="h5" component="div" fontWeight="bold">{notif.title}</Typography>
      </Box>
      <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
        {notif.timestamp?.toDate().toLocaleString()}
      </Typography>
      
      <Divider sx={{ mb: 2 }} />

      {/* Displaying the whole content/description */}
      <Typography variant="body1" sx={{ mb: 4, whiteSpace: 'pre-wrap', color: 'text.primary' }}>
        **Content/Description:**<br/>
        {notif.content || "No detailed content available."}
      </Typography>

      <Button 
        variant="outlined" 
        color="error" 
        fullWidth 
        startIcon={<DeleteIcon />} 
        onClick={handleDeleteFromDrawer}
      >
        Delete Notification
      </Button>
    </>
  );


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

        {/* --- ⭐️ CHIP FILTER SECTION ⭐️ --- */}
        <Box 
          sx={{ 
            display: 'flex', 
            overflowX: 'auto', 
            p: 1, 
            gap: 1, 
            '&::-webkit-scrollbar': { display: 'none' } 
          }}
        >
          {/* Default Chips */}
          <Chip 
            label="All" 
            onClick={() => setFilter('all')} 
            color={filter === 'all' ? 'primary' : 'default'} 
            variant={filter === 'all' ? 'filled' : 'outlined'}
          />
          <Chip 
            label="Unreads" 
            onClick={() => setFilter('unreads')} 
            color={filter === 'unreads' ? 'primary' : 'default'} 
            variant={filter === 'unreads' ? 'filled' : 'outlined'}
          />
          <Chip 
            label="Chat" 
            onClick={() => setFilter('chat')} 
            color={filter === 'chat' ? 'primary' : 'default'} 
            variant={filter === 'chat' ? 'filled' : 'outlined'}
          />

          {/* Dynamic Type Chips (excluding 'chat') */}
          {notificationTypes.map(type => (
            <Chip 
              key={type}
              label={capitalize(type)} 
              onClick={() => setFilter(type)} 
              color={filter === type ? 'primary' : 'default'} 
              variant={filter === type ? 'filled' : 'outlined'}
            />
          ))}
        </Box>
        {/* ---------------------------------- */}


        <Container sx={{ mt: 0, p: 0 }}>
          {indexError && (
            <Alert severity="error" sx={{ m: 2, overflowWrap: 'break-word' }}>
              Firestore Index Error. You may need to create an index. Follow this link: <a href={indexError} target="_blank" rel="noopener noreferrer">{indexError}</a>
            </Alert>
          )}
          {loading ? (
            <Box display="flex" justifyContent="center" alignItems="center" mt={5}><CircularProgress /></Box>
          ) : filteredNotifications.length === 0 ? (
            <Typography variant="body1" align="center" mt={2}>No notifications found for this filter.</Typography>
          ) : (
            <List sx={{ width: '100%' }}>
              {Object.keys(groupedNotifications).map((dateLabel) => (
                <React.Fragment key={dateLabel}>
                  <Typography variant="overline" sx={{ display: 'block', fontWeight: 700, fontSize: '0.8rem', pt: 1.5, px: 2, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 1, mt: 0 }}>
                    {dateLabel}
                  </Typography>
                  {Object.values(groupedNotifications[dateLabel]).map((group, index) => {
                    const latestNotif = group.notifications[0];
                    const groupCount = group.notifications.length;
                    const isGroupSeen = group.isSeen;

                    return (
                        <Card
                            key={`${dateLabel}-${index}`}
                            onClick={() => handleGroupClick(group)} 
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
                                  {!latestNotif.pic && (group.groupType === 'chat' ? <ChatBubbleIcon /> : <NotificationsIcon />)}
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
                                                ({groupCount} {group.groupType === 'chat' ? 'messages' : 'updates'})
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
  transitionDuration={350}
  sx={{
    "& .MuiDrawer-paper": {
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      maxHeight: "88vh",
      minHeight: "35vh",
      backdropFilter: "blur(16px)",
      background:
        mode === "dark"
          ? "linear-gradient(180deg, rgba(25,25,25,0.95) 0%, rgba(10,10,10,0.85) 100%)"
          : "linear-gradient(180deg, rgba(255,255,255,0.95) 0%, rgba(245,245,245,0.85) 100%)",
      boxShadow:
        mode === "dark"
          ? "0px -6px 20px rgba(0,0,0,0.6)"
          : "0px -6px 20px rgba(0,0,0,0.15)",
      borderTop: `1px solid ${
        mode === "dark" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)"
      }`,
      overflowY: "auto",
      transition: "all 0.3s ease-in-out",
      p: 0,
    },
  }}
>
  <Box
    sx={{
      p: 3,
      pb: 6,
      textAlign: "left",
      animation: "fadeIn 0.4s ease",
      "@keyframes fadeIn": {
        from: { opacity: 0, transform: "translateY(10px)" },
        to: { opacity: 1, transform: "translateY(0)" },
      },
    }}
  >
    {/* Handle Bar */}
    <Box
      sx={{
        width: 48,
        height: 5,
        backgroundColor:
          mode === "dark" ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.2)",
        borderRadius: 3,
        mx: "auto",
        mb: 2,
        transition: "all 0.3s ease",
        "&:hover": {
          backgroundColor:
            mode === "dark" ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.3)",
        },
      }}
    />

    {/* Drawer Content */}
    {viewingDetailNotif ? (
      renderIndividualDetail(viewingDetailNotif)
    ) : selectedGroup ? (
      renderGroupList(selectedGroup)
    ) : (
      <Typography
        variant="body1"
        align="center"
        sx={{
          mt: 4,
          color: "text.secondary",
          fontStyle: "italic",
          opacity: 0.8,
        }}
      >
        No notification selected.
      </Typography>
    )}
  </Box>
</SwipeableDrawer>

      </Box>
    </ThemeProvider>
  );
}