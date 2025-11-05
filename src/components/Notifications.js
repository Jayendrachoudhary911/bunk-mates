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
  arrayUnion,
  setDoc,
} from "firebase/firestore";
import { db, auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useThemeToggle } from "../contexts/ThemeToggleContext";
import { getTheme } from "../theme";
import { useSwipeable } from "react-swipeable";
import { motion } from "framer-motion"; // Optional: smooth animations

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

// NotificationCard.js (or inside the same file above your main component)
const NotificationCard = ({
  dateLabel,
  index,
  group,
  handleGroupClick,
  markGroupAsRead,
  deleteNotification,
}) => {
  const latestNotif = group.notifications[0];
  const groupCount = group.notifications.length;
  const isGroupSeen = group.isSeen;
  const [swiped, setSwiped] = React.useState(false);

  const handlers = useSwipeable({
    onSwipedLeft: () => setSwiped(true),
    onSwipedRight: () => setSwiped(false),
    preventScrollOnSwipe: true,
    trackMouse: true,
  });

  // ✅ Handle Accept Friend Request
  const handleAcceptRequest = async (notif) => {
    try {
      const currentUid = auth.currentUser?.uid;
      if (!currentUid) return;

      await updateDoc(doc(db, "notifications", notif.id), {
        status: "accepted",
        read: true,
        message: "You are now friends!",
      });

      await Promise.all([
        updateDoc(doc(db, "users", currentUid), { friends: arrayUnion(notif.senderId) }),
        updateDoc(doc(db, "users", notif.senderId), { friends: arrayUnion(currentUid) }),
      ]);

      await setDoc(doc(db, "notifications", notif.id), {
        type: "friend_accepted",
        senderId: currentUid,
        uid: notif.senderId,
        title: "Friend Request Accepted",
        content: `${auth.currentUser?.displayName || "A user"} accepted your friend request.`,
        pic: auth.currentUser?.photoURL || "",
        seen: false,
        timestamp: new Date(),
      });
    } catch (err) {
      console.error("Error accepting friend request:", err);
    }
  };

  // ❌ Handle Reject Friend Request
  const handleRejectRequest = async (notif) => {
    try {
      await updateDoc(doc(db, "notifications", notif.id), {
        status: "rejected",
        read: true,
        message: "Friend request rejected.",
      });
    } catch (err) {
      console.error("Error rejecting friend request:", err);
    }
  };

  return (
    <Box
      key={`${dateLabel}-${index}`}
      sx={{
        position: "relative",
        overflow: "hidden",
        mb: 1.2,
        borderRadius: 3,
      }}
    >
      {/* Swipe Background (Mark/Remove) */}
      <motion.div
        animate={{ x: swiped ? 0 : "100%" }}
        transition={{ duration: 0.3 }}
        style={{
          position: "absolute",
          right: 0,
          top: 0,
          height: "100%",
          display: "flex",
          alignItems: "center",
          gap: "12px",
          paddingRight: "20px",
          paddingLeft: "30px",
          zIndex: 0,
          background:
            "linear-gradient(90deg, rgba(34,197,94,0.15) 0%, rgba(239,68,68,0.15) 100%)",
          backdropFilter: "blur(10px)",
        }}
      >
        <IconButton
          size="large"
          sx={{
            bgcolor: "rgba(34,197,94,0.25)",
            color: "success.main",
            "&:hover": { bgcolor: "rgba(34,197,94,0.45)" },
          }}
          onClick={(e) => {
            e.stopPropagation();
            markGroupAsRead(group);
            setSwiped(false);
          }}
        >
          <DoneIcon fontSize="medium" />
        </IconButton>
        <IconButton
          size="large"
          sx={{
            bgcolor: "rgba(239,68,68,0.25)",
            color: "error.main",
            "&:hover": { bgcolor: "rgba(239,68,68,0.45)" },
          }}
          onClick={(e) => {
            e.stopPropagation();
            deleteNotification(latestNotif.id);
            setSwiped(false);
          }}
        >
          <DeleteIcon fontSize="medium" />
        </IconButton>
      </motion.div>

      {/* Main Notification Card */}
      <motion.div
        {...handlers}
        animate={{ x: swiped ? -140 : 0 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
      >
        <Card
          onClick={() =>
            latestNotif.type !== "friend_request" &&
            handleGroupClick(group)
          }
          sx={(theme) => ({
            cursor:
              latestNotif.type === "friend_request"
                ? "default"
                : "pointer",
            bgcolor: isGroupSeen
              ? "transparent"
              : theme.palette.mode === "dark"
              ? "rgba(85,85,85,0.18)"
              : "rgba(77,77,77,0.06)",
            backgroundImage: "none",
            backdropFilter: "blur(14px)",
            borderRadius: 3,
            pb: 0,
            transition: "all 0.25s ease",
            "&:hover": {
              transform:
                latestNotif.type !== "friend_request"
                  ? "translateY(-2px)"
                  : "none",
            },
            boxShadow: "none", // ✅ clean and modern
          })}
        >
          <CardContent sx={{ py: 1.5, px: 2 }}>
            <ListItem disablePadding sx={{ alignItems: "center" }}>
              <ListItemAvatar>
                <Avatar
                  src={latestNotif.pic}
                  sx={{
                    bgcolor: "primary.main",
                    width: 42,
                    height: 42,
                    fontSize: "0.95rem",
                  }}
                >
                  {!latestNotif.pic && (
                    <NotificationsIcon fontSize="small" />
                  )}
                </Avatar>
              </ListItemAvatar>

              <ListItemText
                sx={{ ml: 1 }}
                primary={
                  <Box display="flex" alignItems="center" width="100%">
                    <Typography
                      component="span"
                      fontWeight={600}
                      fontSize="0.95rem"
                      color="text.primary"
                      noWrap
                      sx={{ flexGrow: 1 }}
                    >
                      {latestNotif.title || "Notification"}
                    </Typography>
                    <Typography
                      component="span"
                      variant="caption"
                      sx={{
                        color: "text.secondary",
                        ml: "auto",
                        fontSize: "0.75rem",
                      }}
                    >
                      {group.groupTime}
                    </Typography>
                  </Box>
                }
secondary={
  <Box sx={{ mt: 0.5 }}>
    {latestNotif.type === "friend_request" ? (
      <Box
        sx={{
          display: "flex",
          gap: 1,
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ flexGrow: 1 }}
        >
          {latestNotif.content || latestNotif.message}
        </Typography>
        <Button
          variant="contained"
          color="success"
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            handleAcceptRequest(latestNotif);
          }}
        >
          Accept
        </Button>
        <Button
          variant="outlined"
          color="error"
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            handleRejectRequest(latestNotif);
          }}
        >
          Reject
        </Button>
      </Box>
    ) : (
      <Box>
        {/* ✅ Display a concise summary of grouped notifications */}
        {groupCount > 1 && (
          <Typography
            variant="caption"
            sx={{
              display: "block",
              color: "primary.main",
              fontWeight: 600,
              mb: 0.2,
            }}
          >
            {groupCount} {group.groupType.replace("_", " ")} updates
          </Typography>
        )}

        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            fontSize: "0.85rem",
            opacity: 0.9,
          }}
        >
          {latestNotif.content ||
            latestNotif.message ||
            "No details available."}
        </Typography>
      </Box>
    )}
  </Box>
}

              />
            </ListItem>
          </CardContent>
        </Card>
      </motion.div>
    </Box>
  );
};


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


// 🧩 Group notifications by sender + type + hour
const groupedNotifications = useMemo(() => {
  if (!filteredNotifications.length) return {};

  const byDate = filteredNotifications.reduce((acc, notif) => {
    const dateLabel = formatDateLabel(notif.timestamp);
    if (!acc[dateLabel]) acc[dateLabel] = [];
    acc[dateLabel].push(notif);
    return acc;
  }, {});

  const finalGrouped = {};

  for (const dateLabel in byDate) {
    const bySenderAndType = byDate[dateLabel].reduce((acc, notif) => {
      const sender = notif.senderId || "system";
      const type = notif.type || "general";
      const timeKey = formatTimeLabel(notif.timestamp); // hour-level grouping
      const key = `${sender}_${type}_${timeKey}`;

      if (!acc[key]) {
        acc[key] = {
          sender,
          senderPic: notif.pic || "",
          groupType: type,
          groupTime: getGroupDisplayTime(notif.timestamp),
          notifications: [],
          title: notif.title || "Notification",
          isSeen: notif.seen,
          latestTimestamp: notif.timestamp,
        };
      }

      acc[key].notifications.push(notif);

      // update if any unseen
      if (!notif.seen) acc[key].isSeen = false;
      return acc;
    }, {});

    // Sort groups by most recent
    const sortedGroups = Object.values(bySenderAndType).sort(
      (a, b) =>
        (b.latestTimestamp?.toDate().getTime() || 0) -
        (a.latestTimestamp?.toDate().getTime() || 0)
    );

    finalGrouped[dateLabel] = sortedGroups;
  }

  return finalGrouped;
}, [filteredNotifications]);

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
{Object.values(groupedNotifications[dateLabel]).map((group, index) => (
  <NotificationCard
    key={`${dateLabel}-${index}`}
    dateLabel={dateLabel}
    index={index}
    group={group}
    handleGroupClick={handleGroupClick}
    markGroupAsRead={markGroupAsRead}
    deleteNotification={deleteNotification}
  />
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