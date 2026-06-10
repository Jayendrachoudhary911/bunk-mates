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
  Button,
  Avatar,
  ListItemAvatar,
  Divider, 
  Chip,
  CardActionArea,
} from "@mui/material";
import { ThemeProvider } from "@mui/material/styles";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import DoneIcon from "@mui/icons-material/Done";
import DeleteIcon from "@mui/icons-material/Delete";
import NotificationsIcon from '@mui/icons-material/Notifications';
import CloseIcon from "@mui/icons-material/Close";
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
import { AnimatePresence, motion } from "framer-motion";

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
    const tempDate = new Date(date.getTime());
    tempDate.setMinutes(0);
    tempDate.setSeconds(0);
    tempDate.setMilliseconds(0);
    return tempDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
};

// Helper to capitalize the first letter of a string
const capitalize = (s) => (s && typeof s === 'string') ? s.charAt(0).toUpperCase() + s.slice(1) : '';

// NotificationCard Component
const NotificationCard = ({
  dateLabel,
  index,
  group,
  handleGroupClick,
  markGroupAsRead,
  deleteNotification,
  selectedNotification,
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

  // Handle Accept Friend Request
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

  // Handle Reject Friend Request
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
    <motion.div layoutId={selectedNotification ? `notification-${selectedNotification.id}` : undefined}>
      <Box
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
            background: "linear-gradient(90deg, rgba(34,197,94,0.15) 0%, rgba(239,68,68,0.15) 100%)",
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

        {/* Main Notification Card rendered as a Native Button Base Component */}
        <motion.div
          {...handlers}
          animate={{ x: swiped ? -140 : 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
        >
          <Card
            sx={(theme) => ({
              bgcolor: isGroupSeen
                ? "transparent"
                : theme.palette.mode === "dark"
                ? "rgba(85,85,85,0.18)"
                : "rgba(77,77,77,0.06)",
              backgroundImage: "none",
              backdropFilter: "blur(14px)",
              borderRadius: 6,
              transition: "all 0.25s ease",
              boxShadow: theme.palette.mode === "dark"
                ? `
                  inset 0 1px 2px rgba(255, 255, 255, 0.11),
                  inset 0 -1px 1px rgba(35, 35, 35, 0.07)
                `
                : `
                  inset 0 1px 1px rgba(255,255,255,0.8),
                  inset 0 -1px 1px rgba(0,0,0,0.1)
                `,
            })}
          >
            <CardActionArea onClick={() => handleGroupClick(group)} sx={{ p: 0.5 }}>
              <CardContent sx={{ py: 1.5, px: 2, "&:last-child": { pb: 1.5 } }}>
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
                      {!latestNotif.pic && <NotificationsIcon fontSize="small" />}
                    </Avatar>
                  </ListItemAvatar>

                  <ListItemText
                    sx={{ ml: 1, my: 0 }}
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
                          <Box sx={{ display: "flex", gap: 1, alignItems: "center", flexWrap: "wrap" }} onClick={(e) => e.stopPropagation()}>
                            <Typography variant="body2" color="text.secondary" sx={{ flexGrow: 1 }}>
                              {latestNotif.content || latestNotif.message}
                            </Typography>
                            <Button
                              variant="contained"
                              color="success"
                              size="small"
                              onClick={() => handleAcceptRequest(latestNotif)}
                            >
                              Accept
                            </Button>
                            <Button
                              variant="outlined"
                              color="error"
                              size="small"
                              onClick={() => handleRejectRequest(latestNotif)}
                            >
                              Reject
                            </Button>
                          </Box>
                        ) : groupCount > 1 ? (
                          <Box display="flex" alignItems="center" gap={1}>
                            <Typography
                              variant="caption"
                              sx={{
                                display: "inline-block",
                                color: isGroupSeen ? "text.secondary" : "primary.main",
                                fontWeight: 600,
                                fontSize: "0.8rem"
                              }}
                            >
                              {groupCount} alerts in this time window
                            </Typography>
                            {!isGroupSeen && (
                              <Box 
                                sx={{ 
                                  width: 6, 
                                  height: 6, 
                                  borderRadius: "50%", 
                                  bgcolor: "primary.main",
                                  display: "inline-block"
                                }} 
                              />
                            )}
                          </Box>
                        ) : (
                          <Box display="flex" alignItems="center" gap={1}>
                            {!latestNotif.seen && (
                              <Box 
                                sx={{ 
                                  width: 6, 
                                  height: 6, 
                                  borderRadius: "50%", 
                                  bgcolor: "primary.main", 
                                  flexShrink: 0 
                                }} 
                              />
                            )}
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              sx={{
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                fontSize: "0.85rem",
                                opacity: latestNotif.seen ? 0.7 : 1,
                                fontWeight: latestNotif.seen ? 400 : 500
                              }}
                            >
                              {latestNotif.content || latestNotif.message || "No details available."}
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    }
                  />
                </ListItem>
              </CardContent>
            </CardActionArea>
          </Card>
        </motion.div>
      </Box>
    </motion.div>
  );
};

// Main Notifications Component
export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [indexError, setIndexError] = useState(null);
  const [filter, setFilter] = useState('all'); 
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [globalUserView, setGlobalUserView] = useState(false);
  const [expandedDetailId, setExpandedDetailId] = useState(null);
  
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
      if (error.code === "failed-precondition") {
        setIndexError(error.message.match(/https:\/\/console\.firebase\.google\.com\/project\/[^\s]+/)?.[0]);
      }
      setNotifications([]);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [currentUser]);

  const notificationTypes = useMemo(() => {
    const types = new Set();
    notifications.forEach(n => {
      if (n.type && n.type !== 'chat') types.add(n.type);
    });
    return Array.from(types);
  }, [notifications]);

  const filteredNotifications = useMemo(() => {
    if (filter === 'all') return notifications;
    if (filter === 'unreads') return notifications.filter(n => !n.seen);
    return notifications.filter(n => n.type === filter);
  }, [notifications, filter]);

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
      const byHourKey = byDate[dateLabel].reduce((acc, notif) => {
        const timeKey = formatTimeLabel(notif.timestamp); 
        const sender = notif.senderId || "system";
        const type = notif.type || "general";
        const key = `${sender}_${type}_${timeKey}`;

        if (!acc[key]) {
          acc[key] = {
            sender,
            senderPic: notif.pic || "",
            groupType: type,
            groupTime: getGroupDisplayTime(notif.timestamp),
            notifications: [], 
            title: notif.title || "Notification",
            isSeen: notif.seen !== undefined ? notif.seen : true,
            latestTimestamp: notif.timestamp,
          };
        }

        acc[key].notifications.push(notif);
        if (!notif.seen) acc[key].isSeen = false;
        return acc;
      }, {});

      const sortedGroups = Object.values(byHourKey).sort(
        (a, b) => (b.latestTimestamp?.toDate().getTime() || 0) - (a.latestTimestamp?.toDate().getTime() || 0)
      );

      finalGrouped[dateLabel] = sortedGroups;
    }

    return finalGrouped;
  }, [filteredNotifications]);

  const markGroupAsRead = async (group) => {
    if (!group) return;
    const updates = group.notifications
        .filter(notif => !notif.seen)
        .map(notif => updateDoc(doc(db, "notifications", notif.id), { seen: true }));
    
    await Promise.all(updates);
  };

  const deleteNotification = async (id) => {
    await deleteDoc(doc(db, "notifications", id));
  };

  const onBack = () => navigate(-1);

  const handleGroupClick = (group) => {
    markGroupAsRead(group);
    setGlobalUserView(false); 
    setExpandedDetailId(null);
    if (group.notifications.length > 0) {
      setSelectedNotification(group.notifications[0]);
    }
  };

  // Popup Item Routing / Interaction Core Controller
  const handlePopupNotificationClick = (notif) => {
    if (notif.type === "chat" && notif.senderId) {
      setSelectedNotification(null);
      navigate(`/chat/${notif.senderId}`, {
        state: {
          displayName: notif.title,
          photoURL: notif.pic,
        },
      });
    } else if (notif.type !== "friend_request") {
      setExpandedDetailId(prev => (prev === notif.id ? null : notif.id));
    }
  };

  // Internal component actions for friend requests inside the list layout
  const handleRequestAction = async (notif, statusText) => {
    try {
      const currentUid = auth.currentUser?.uid;
      if (!currentUid) return;

      await updateDoc(doc(db, "notifications", notif.id), {
        status: statusText,
        read: true,
        message: statusText === "accepted" ? "You are now friends!" : "Friend request rejected.",
      });

      if (statusText === "accepted") {
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
      }
    } catch (err) {
      console.error(`Error processing friend request ${statusText}:`, err);
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ flexGrow: 1, bgcolor: 'background.default', minHeight: '100vh', px: 1, pt: 5 }}>
        <AppBar position="static" elevation={0} sx={{ bgcolor: 'transparent', color: 'text.primary' }}>
          <Toolbar>
            <IconButton edge="start" color="inherit" onClick={onBack} sx={{ mr: 2 }}>
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h6" color="inherit" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
              Notifications
            </Typography>
          </Toolbar>
        </AppBar>

        {/* CHIP FILTER SECTION */}
        <Box 
          sx={{ 
            display: 'flex', 
            overflowX: 'auto', 
            p: 1, 
            gap: 1, 
            '&::-webkit-scrollbar': { display: 'none' } 
          }}
        >
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

        <Container sx={{ mt: 0, p: 0 }}>
          {indexError && (
            <Alert severity="error" sx={{ m: 2, overflowWrap: 'break-word' }}>
              Firestore Index Error. Follow this link: <a href={indexError} target="_blank" rel="noopener noreferrer">{indexError}</a>
            </Alert>
          )}
          {loading ? (
            <Box display="flex" justifyContent="center" alignItems="center" mt={5}><CircularProgress /></Box>
          ) : filteredNotifications.length === 0 ? (
            <Typography variant="body1" align="center" mt={2}>No notifications found for this filter.</Typography>
          ) : (
            <List
              sx={{
                width: "100%",
                filter: selectedNotification ? "blur(4px)" : "none",
                transform: selectedNotification ? "scale(0.98)" : "scale(1)",
                transition: "all 0.35s cubic-bezier(0.22,1,0.36,1)",
                pointerEvents: selectedNotification ? "none" : "auto",
              }}
            >
              {Object.keys(groupedNotifications).map((dateLabel) => (
                <React.Fragment key={dateLabel}>
                  <Typography variant="overline" sx={{ display: 'block', fontWeight: 700, fontSize: '0.8rem', pt: 1.5, px: 2, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 1 }}>
                    {dateLabel}
                  </Typography>
                  {groupedNotifications[dateLabel].map((group, index) => (
                    <NotificationCard
                      key={`${dateLabel}-${index}`}
                      dateLabel={dateLabel}
                      index={index}
                      group={group}
                      handleGroupClick={handleGroupClick}
                      markGroupAsRead={markGroupAsRead}
                      deleteNotification={deleteNotification}
                      selectedNotification={selectedNotification}
                    />
                  ))}
                </React.Fragment>
              ))}
            </List>
          )}
        </Container>

        {/* INTERACTIVE MODAL / POPUP */}
        <AnimatePresence>
          {selectedNotification && (() => {
            const getProgressiveBlurStyle = (themeMode, direction = "to bottom") => {
              const isDark = themeMode === "dark";
              const rgb = isDark ? "15, 15, 15" : "255, 255, 255";
              
              const backgroundGradient = `linear-gradient(
                ${direction},
                rgba(${rgb}, 0.98) 0%,
                rgba(${rgb}, 0.92) 20%,
                rgba(${rgb}, 0.75) 45%,
                rgba(${rgb}, 0.45) 70%,
                rgba(${rgb}, 0.12) 90%,
                rgba(${rgb}, 0) 100%
              )`;

              const maskGradient = `linear-gradient(${direction}, rgba(0,0,0,1) 0%, rgba(0,0,0,0.9) 20%, rgba(0,0,0,0.55) 50%, rgba(0,0,0,0.2) 80%, transparent 100%)`;

              return {
                position: "absolute",
                left: 0,
                right: 0,
                zIndex: 10,
                overflow: "hidden",
                background: backgroundGradient,
                borderBottom: "none",
                boxShadow: "none",

                "&::before": {
                  content: '""',
                  position: "absolute",
                  inset: 0,
                  zIndex: -1,
                  backdropFilter: "blur(30px) saturate(180%)",
                  WebkitBackdropFilter: "blur(30px) saturate(180%)",
                  maskImage: maskGradient,
                  WebkitMaskImage: maskGradient,
                },
                "&::after": {
                  content: '""',
                  position: "absolute",
                  inset: 0,
                  pointerEvents: "none",
                  background: "transparent",
                },
              };
            };

            return (
              <Box
                sx={{
                  position: "fixed",
                  inset: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  zIndex: 1400,
                  p: { xs: 0, sm: 2 },
                }}
              >
                {/* Blur Backdrop Layer */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => {
                    setSelectedNotification(null);
                    setGlobalUserView(false);
                  }}
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: mode === "dark" ? "rgba(0,0,0,0.4)" : "rgba(255,255,255,0.2)",
                    backdropFilter: "blur(24px)",
                    WebkitBackdropFilter: "blur(24px)",
                    zIndex: 1401,
                  }}
                />

                {/* Expanding Interactive Modal */}
                <motion.div
                  layoutId={`notification-${selectedNotification.id}`}
                  initial={{ scale: 0.95, opacity: 0, y: 20 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.97, opacity: 0, y: 15 }}
                  transition={{ type: "spring", stiffness: 300, damping: 28 }}
                  style={{
                    width: "100%",
                    height: "100%",
                    maxWidth: "600px",
                    maxHeight: "100vh",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    zIndex: 1402,
                  }}
                >
                  <Card
                    sx={{
                      width: "100%",
                      height: { xs: "100%", sm: "auto" }, 
                      maxHeight: { xs: "100vh", sm: "85vh" },
                      borderRadius: { xs: 0, sm: 6 }, 
                      overflow: "hidden",
                      display: "flex",
                      flexDirection: "column",
                      background: mode === "dark" ? "rgba(25,25,25,0)" : "rgba(255,255,255,0)",
                      border: "none",
                      boxShadow: "none",
                      position: "relative",
                    }}
                  >
                    {/* --- PROGRESSIVE BLUR HEADER COMPONENT --- */}
                    <Box sx={{ ...getProgressiveBlurStyle(mode, "to bottom"), top: 0, pt: { xs: 7, sm: 2 }, pb: 2 }}>
                      <Box sx={{ p: 3, pb: 1, pt: 1, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <Box display="flex" alignItems="center" gap={1.5}>
                          <Avatar src={selectedNotification.pic} sx={{ width: 54, height: 54, bgcolor: "primary.main" }} />
                          <Box display="flex" flexDirection="column" gap={0.5}>
                            <Typography variant="h6" fontWeight={700} lineHeight={1.2}>
                              {selectedNotification.title || "Notification Updates"}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {selectedNotification.senderId === "system" ? "System Messages" : `Sender: ${selectedNotification.senderId || "Unknown"}`}
                            </Typography>
                          </Box>
                        </Box>
                        <IconButton onClick={() => { setSelectedNotification(null); setGlobalUserView(false); }} sx={{ mr: 1 }}>
                          <CloseIcon />
                        </IconButton>
                      </Box>
                      <Box px={3} pt={0.5}>
                        <Chip 
                          label={globalUserView ? "Showing All History From User" : "Showing Current Time Cluster"} 
                          color={globalUserView ? "secondary" : "default"}
                          size="small"
                          sx={{ fontWeight: 600, fontSize: "0.75rem" }}
                        />
                      </Box>
                    </Box>

                    {/* Core Content: Scroll Box Container */}
                    <Box 
                      px={3} 
                      py={2} 
                      sx={{ 
                        flexGrow: 1, 
                        overflowY: "auto", 
                        pt: { xs: "180px", sm: "150px" }, 
                        pb: { xs: "180px", sm: "160px" },
                        mt: 0,
                        height: "100%",
                      }}
                    >
                      {(() => {
                        let displayList = [];
                        
                        if (globalUserView) {
                          displayList = notifications.filter(n => (n.senderId || "system") === (selectedNotification.senderId || "system"));
                        } else {
                          const parentGroup = Object.values(groupedNotifications)
                            .flatMap(g => g)
                            .find(group => group.notifications.some(n => n.id === selectedNotification.id));
                          displayList = parentGroup ? parentGroup.notifications : [selectedNotification];
                        }

                        return displayList.map((notif, itemIdx) => {
                          const isRequest = notif.type === "friend_request";
                          const isChat = notif.type === "chat";
                          const isExpanded = expandedDetailId === notif.id;

                          return (
                            <Box 
                              key={notif.id}
                              onClick={() => handlePopupNotificationClick(notif)}
                              sx={{
                                py: 2,
                                borderTop: itemIdx > 0 ? "1px solid" : "none",
                                borderColor: "divider",
                                backgroundColor: notif.seen ? "transparent" : mode === "dark" ? "rgba(85,85,85,0.18)" : "rgba(77,77,77,0.06)",
                                borderRadius: 6,
                                px: 2,
                                mb: 1,
                                cursor: isRequest ? "default" : "pointer",
                                backdropFilter: "blur(32px)",
                                transition: "all 0.2s ease-in-out",
                                "&:hover": {
                                  backgroundColor: isRequest ? undefined : (mode === "dark" ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)"),
                                },
                                boxShadow: mode === "dark"
                                  ? `inset 0 1px 2px rgba(255, 255, 255, 0.11), inset 0 -1px 1px rgba(35, 35, 35, 0.07)`
                                  : `inset 0 1px 1px rgba(255,255,255,0.8), inset 0 -1px 1px rgba(0,0,0,0.1)`,
                              }}
                            >
                              <Box display="flex" flexDirection="column" mb={0.5}>
                                {/* Header badge indicators for chat redirection hints */}
                                {isChat && (
                                  <Typography variant="caption" color="primary.main" fontWeight={600} sx={{ mb: 0.5 }}>
                                    💬 Chat Message — Click to Reply
                                  </Typography>
                                )}
                                <Typography 
                                  variant="body1" 
                                  fontWeight={notif.seen ? 500 : 700} 
                                  color="text.primary" 
                                  sx={{ 
                                    whiteSpace: (isExpanded || isRequest) ? "pre-wrap" : "nowrap",
                                    overflow: (isExpanded || isRequest) ? "visible" : "hidden",
                                    textOverflow: (isExpanded || isRequest) ? "clip" : "ellipsis"
                                  }}
                                >
                                  {notif.content || notif.message || "No details provided."}
                                </Typography>
                              </Box>

                              {/* Friend request specific actionable layout rows */}
                              {isRequest && (
                                <Box display="flex" gap={1} mt={1.5} mb={0.5}>
                                  <Button 
                                    variant="contained" 
                                    color="success" 
                                    size="small"
                                    onClick={(e) => { e.stopPropagation(); handleRequestAction(notif, "accepted"); }}
                                    sx={{ borderRadius: 99, px: 2.5, textTransform: "none", fontWeight: 600 }}
                                  >
                                    Accept Request
                                  </Button>
                                  <Button 
                                    variant="outlined" 
                                    color="error" 
                                    size="small"
                                    onClick={(e) => { e.stopPropagation(); handleRequestAction(notif, "rejected"); }}
                                    sx={{ borderRadius: 99, px: 2.5, textTransform: "none", fontWeight: 600 }}
                                  >
                                    Reject
                                  </Button>
                                </Box>
                              )}

                              <Box display="flex" gap={1} alignItems="center" flexWrap="wrap" mt={1}>
                                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                                  {formatDateLabel(notif.timestamp)} • {notif.timestamp?.toDate()?.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                                </Typography>
                                <Chip label={capitalize(notif.type || "General")} size="small" variant="outlined" sx={{ height: 16, fontSize: "0.6rem" }} />
                                {!notif.seen && (
                                  <Chip label="New" color="primary" size="small" sx={{ height: 16, fontSize: "0.65rem", fontWeight: 700 }} />
                                )}
                              </Box>
                            </Box>
                          );
                        });
                      })()}
                    </Box>

                    {/* --- PROGRESSIVE BLUR FOOTER COMPONENT --- */}
                    <Box 
                      sx={{ 
                        ...getProgressiveBlurStyle(mode, "to top"),
                        bottom: 0,
                        pt: 2,
                        pb: { xs: 6, sm: 3 }, 
                        px: 3,
                        display: "flex", 
                        flexDirection: "row", 
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 1.5,
                      }}
                    >
                      {!globalUserView ? (
                        <Button
                          variant="outlined"
                          color="secondary"
                          size="medium"
                          onClick={() => setGlobalUserView(true)}
                          sx={{
                            flex: 1,
                            borderRadius: 99,
                            py: 1.2,
                            textTransform: "none",
                            fontWeight: 600,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            border: "none",
                            color: "white",
                            backgroundColor: mode === "dark" ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.8)",
                            backdropFilter: "blur(5px)",
                            boxShadow: mode === "dark"
                              ? `inset 0 1px 2px rgba(255, 255, 255, 0.11), inset 0 -1px 1px rgba(35, 35, 35, 0.07)`
                              : `inset 0 1px 1px rgba(255,255,255,0.8), inset 0 -1px 1px rgba(0,0,0,0.1)`,
                          }}
                        >
                          View All From User
                        </Button>
                      ) : (
                        <Button
                          variant="outlined"
                          color="primary"
                          size="medium"
                          onClick={() => setGlobalUserView(false)}
                          sx={{
                            flex: 1,
                            borderRadius: 99,
                            py: 1.2,
                            textTransform: "none",
                            fontWeight: 600,
                            whiteSpace: "nowrap",
                            color: "white",
                            border: "none",
                            backgroundColor: mode === "dark" ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.8)",
                            backdropFilter: "blur(5px)",
                            boxShadow: mode === "dark"
                              ? `inset 0 1px 2px rgba(255, 255, 255, 0.11), inset 0 -1px 1px rgba(35, 35, 35, 0.07)`
                              : `inset 0 1px 1px rgba(255,255,255,0.8), inset 0 -1px 1px rgba(0,0,0,0.1)`,
                          }}
                        >
                          Time Cluster View
                        </Button>
                      )}

                      <Button
                        variant="contained"
                        color="primary"
                        size="large"
                        onClick={() => { setSelectedNotification(null); setGlobalUserView(false); }}
                        sx={{
                          flex: 1,
                          borderRadius: 99,
                          py: 1.2,
                          textTransform: "none",
                          fontWeight: 600,
                          whiteSpace: "nowrap",
                          color: "white",
                          backgroundColor: mode === "dark" ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.8)",
                          backdropFilter: "blur(5px)",
                          boxShadow: mode === "dark"
                            ? `inset 0 1px 2px rgba(255, 255, 255, 0.11), inset 0 -1px 1px rgba(35, 35, 35, 0.07)`
                            : `inset 0 1px 1px rgba(255,255,255,0.8), inset 0 -1px 1px rgba(0,0,0,0.1)`,
                        }}
                      >
                        Close
                      </Button>
                    </Box>
                  </Card>
                </motion.div>
              </Box>
            );
          })()}
        </AnimatePresence>
      </Box>
    </ThemeProvider>
  );
}