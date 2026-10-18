// src/pages/Notifications.js
import React, { useEffect, useState, useMemo, useCallback, memo } from "react";
import { useNavigate } from "react-router-dom";
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Card,
  CardContent,
  Skeleton,
  Container,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Alert,
  Button,
  Avatar,
  ListItemAvatar,
  Chip,
  CardActionArea,
  Menu,
  MenuItem,
  ListItemIcon,
  useMediaQuery,
  Badge,
} from "@mui/material";
import { ThemeProvider } from "@mui/material/styles";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import DoneIcon from "@mui/icons-material/Done";
import DoneAllIcon from "@mui/icons-material/DoneAll";
import DeleteIcon from "@mui/icons-material/Delete";
import NotificationsIcon from "@mui/icons-material/Notifications";
import CloseIcon from "@mui/icons-material/Close";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import LayersIcon from "@mui/icons-material/Layers";
import PhoneMissedIcon from "@mui/icons-material/PhoneMissed";
import CallIcon from "@mui/icons-material/Call";
import GroupAddIcon from "@mui/icons-material/GroupAdd";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import ForumOutlinedIcon from "@mui/icons-material/ForumOutlined";
import FeedbackOutlinedIcon from "@mui/icons-material/FeedbackOutlined";
import ContactMailOutlinedIcon from "@mui/icons-material/ContactMailOutlined";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
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
import { AnimatePresence, motion, LayoutGroup } from "framer-motion";

// ============================================================================
// Category Mapping (Chat & Group Chat Separated), Helpers & Styling
// ============================================================================
const CATEGORY_MAP = {
  call: "calls",
  missed_call: "calls",
  friend_added_self: "friends",
  friend_accepted: "friends",
  friend_added: "friends",
  friend_request: "friends",
  chat: "chat",
  group_chat: "group_chat",
  feedback: "feedbacks",
  feedbacks: "feedbacks",
  contact: "contact",
  contacts: "contact",
  contact_us: "contact",
};

const POPUP_ALLOWED_SINGLE_CATEGORIES = new Set(["feedbacks", "contact"]);

const normalizeCategory = (rawType) => {
  if (!rawType) return "general";
  const key = rawType.toLowerCase().trim();
  return CATEGORY_MAP[key] || key;
};

const canGroupOpenPopup = (group) => {
  if (!group || !group.notifications || group.notifications.length === 0) {
    return false;
  }
  return (
    group.notifications.length > 1 ||
    POPUP_ALLOWED_SINGLE_CATEGORIES.has(group.groupType)
  );
};

const formatLabel = (str) => {
  if (!str || typeof str !== "string") return "";
  return str
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

const toJsDate = (timestamp) => {
  if (!timestamp) return null;
  if (typeof timestamp.toDate === "function") return timestamp.toDate();
  if (timestamp instanceof Date) return timestamp;
  if (typeof timestamp === "number" || typeof timestamp === "string") {
    const parsed = new Date(timestamp);
    return isNaN(parsed.getTime()) ? null : parsed;
  }
  return null;
};

const isWithinLastMonth = (timestamp) => {
  const date = toJsDate(timestamp);
  if (!date) return false;
  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
  return date >= oneMonthAgo;
};

const formatDateLabel = (timestamp) => {
  const date = toJsDate(timestamp);
  if (!date) return "Date unknown";
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const isSameDay = (d1, d2) =>
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();
  if (isSameDay(date, today)) return "Today";
  if (isSameDay(date, yesterday)) return "Yesterday";
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  if (date > sevenDaysAgo)
    return date.toLocaleDateString("en-US", { weekday: "long" });
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const getGroupDisplayTime = (timestamp) => {
  const date = toJsDate(timestamp);
  if (!date) return "";
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

const getCategoryBadgeMeta = (category, rawType) => {
  if (rawType === "missed_call") {
    return {
      icon: <PhoneMissedIcon sx={{ fontSize: "0.75rem", color: "#fff" }} />,
      bg: "#ef4444",
    };
  }
  if (category === "calls") {
    return {
      icon: <CallIcon sx={{ fontSize: "0.75rem", color: "#fff" }} />,
      bg: "#10b981",
    };
  }
  if (category === "friends") {
    return {
      icon: <GroupAddIcon sx={{ fontSize: "0.75rem", color: "#fff" }} />,
      bg: "#8b5cf6",
    };
  }
  if (category === "chat") {
    return {
      icon: (
        <ChatBubbleOutlineIcon sx={{ fontSize: "0.75rem", color: "#fff" }} />
      ),
      bg: "#3b82f6",
    };
  }
  if (category === "group_chat") {
    return {
      icon: <ForumOutlinedIcon sx={{ fontSize: "0.75rem", color: "#fff" }} />,
      bg: "#0ea5e9",
    };
  }
  if (category === "feedbacks") {
    return {
      icon: (
        <FeedbackOutlinedIcon sx={{ fontSize: "0.75rem", color: "#fff" }} />
      ),
      bg: "#f59e0b",
    };
  }
  if (category === "contact") {
    return {
      icon: (
        <ContactMailOutlinedIcon sx={{ fontSize: "0.75rem", color: "#fff" }} />
      ),
      bg: "#ec4899",
    };
  }
  return {
    icon: <NotificationsIcon sx={{ fontSize: "0.75rem", color: "#fff" }} />,
    bg: "#6366f1",
  };
};

// Reusable Profile Avatar with Grouped Category Icon Overlay + Optional Stack Count
const CategorizedAvatar = ({
  pic,
  category,
  rawType,
  stackCount = 0,
  size = 46,
}) => {
  const badgeMeta = getCategoryBadgeMeta(category, rawType);
  const isStacked = stackCount > 1;

  return (
    <Badge
      badgeContent={isStacked ? stackCount : 0}
      color="primary"
      overlap="circular"
      anchorOrigin={{ vertical: "top", horizontal: "right" }}
      sx={{
        "& .MuiBadge-badge": {
          fontWeight: 800,
          fontSize: "0.68rem",
          minWidth: 19,
          height: 19,
          padding: "0 4px",
          boxShadow: "0 2px 6px rgba(0,0,0,0.35)",
          zIndex: 3,
        },
      }}
    >
      <Badge
        overlap="circular"
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        badgeContent={
          <Box
            sx={(theme) => ({
              width: 21,
              height: 21,
              borderRadius: "50%",
              bgcolor: badgeMeta.bg,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: `0px solid ${
                theme.palette.mode === "dark" ? "#1c1c20" : "#ffffff"
              }`,
              boxShadow: "0",
            })}
          >
            {badgeMeta.icon}
          </Box>
        }
      >
        <Avatar
          src={pic}
          sx={{
            bgcolor:
              rawType === "missed_call" ? "error.main" : "primary.main",
            width: size,
            height: size,
            fontSize: "1rem",
          }}
        >
          {!pic && badgeMeta.icon}
        </Avatar>
      </Badge>
    </Badge>
  );
};

// ============================================================================
// 0. Skeleton Loader Matching 3D Stacked Notification Cards
// ============================================================================
const NotificationsSkeleton = memo(({ isMobile }) => {
  const skeletonGroups = [
    { labelWidth: 65, items: [{ stacked: true }, { stacked: false }, { stacked: true }] },
    { labelWidth: 85, items: [{ stacked: false }, { stacked: false }] },
  ];

  return (
    <List sx={{ width: "100%", px: 0 }}>
      {skeletonGroups.map((section, sIdx) => (
        <React.Fragment key={`skel-sec-${sIdx}`}>
          {/* Date Header Skeleton */}
          <Box sx={{ pt: 2, pb: 1, px: 1.5 }}>
            <Skeleton
              animation="wave"
              variant="text"
              width={section.labelWidth}
              height={20}
              sx={{ borderRadius: 1 }}
            />
          </Box>

          {section.items.map((item, idx) => (
            <Box
              key={`skel-card-${sIdx}-${idx}`}
              sx={{
                position: "relative",
                mb: item.stacked ? "22px" : "12px",
                borderRadius: 6,
              }}
            >
              {/* Simulated 3D Stack Backdrop Layers */}
              {item.stacked && (
                <>
                  <Box
                    sx={(theme) => ({
                      position: "absolute",
                      inset: 0,
                      borderRadius: 6,
                      bgcolor:
                        theme.palette.mode === "dark"
                          ? "rgba(255,255,255,0.025)"
                          : "rgba(0,0,0,0.02)",
                      border: "0px solid",
                      borderColor:
                        theme.palette.mode === "dark"
                          ? "rgba(255,255,255,0.05)"
                          : "rgba(0,0,0,0.05)",
                      transform: "translate3d(0, 13px, 0) scale(0.92)",
                      zIndex: 0,
                    })}
                  />
                  <Box
                    sx={(theme) => ({
                      position: "absolute",
                      inset: 0,
                      borderRadius: 6,
                      bgcolor:
                        theme.palette.mode === "dark"
                          ? "rgba(255,255,255,0.05)"
                          : "rgba(0,0,0,0.035)",
                      border: "0px solid",
                      borderColor:
                        theme.palette.mode === "dark"
                          ? "rgba(255,255,255,0.08)"
                          : "rgba(0,0,0,0.07)",
                      transform: "translate3d(0, 6.5px, 0) scale(0.96)",
                      zIndex: 1,
                    })}
                  />
                </>
              )}

              {/* Foreground Skeleton Card */}
              <Card
                elevation={0}
                sx={(theme) => ({
                  position: "relative",
                  zIndex: 2,
                  bgcolor:
                    theme.palette.mode === "dark"
                      ? "rgba(28,28,32,0.92)"
                      : "rgba(255,255,255,0.94)",
                  borderRadius: 6,
                  border: "0px solid",
                  borderColor:
                    theme.palette.mode === "dark"
                      ? "rgba(255,255,255,0.07)"
                      : "rgba(0,0,0,0.07)",
                  boxShadow:
                    theme.palette.mode === "dark"
                      ? "0 6px 20px rgba(0,0,0,0.3)"
                      : "0 4px 16px rgba(0,0,0,0.05)",
                  p: 0.5,
                })}
              >
                <CardContent
                  sx={{ py: 1.5, px: 2, "&:last-child": { pb: 1.5 } }}
                >
                  <ListItem disablePadding sx={{ alignItems: "flex-start" }}>
                    {/* Avatar + Category Badge Skeleton */}
                    <ListItemAvatar sx={{ mt: 0.5 }}>
                      <Box sx={{ position: "relative", width: 46, height: 46 }}>
                        <Skeleton
                          animation="wave"
                          variant="circular"
                          width={46}
                          height={46}
                        />
                        <Skeleton
                          animation="wave"
                          variant="circular"
                          width={20}
                          height={20}
                          sx={(theme) => ({
                            position: "absolute",
                            bottom: -2,
                            right: -2,
                            border: `2px solid ${
                              theme.palette.mode === "dark"
                                ? "#1c1c20"
                                : "#ffffff"
                            }`,
                          })}
                        />
                      </Box>
                    </ListItemAvatar>

                    <ListItemText
                      sx={{ ml: 1.5, my: 0, pr: !isMobile ? 4 : 0 }}
                      primary={
                        <Box
                          display="flex"
                          alignItems="center"
                          justifyContent="space-between"
                          gap={1}
                        >
                          <Box
                            display="flex"
                            alignItems="center"
                            gap={1}
                            sx={{ flexGrow: 1 }}
                          >
                            <Skeleton
                              animation="wave"
                              variant="text"
                              width={idx % 2 === 0 ? "42%" : "55%"}
                              height={22}
                              sx={{ borderRadius: 1 }}
                            />
                            <Skeleton
                              animation="wave"
                              variant="rounded"
                              width={54}
                              height={18}
                              sx={{ borderRadius: 99 }}
                            />
                          </Box>
                          <Skeleton
                            animation="wave"
                            variant="text"
                            width={48}
                            height={16}
                            sx={{ borderRadius: 1 }}
                          />
                        </Box>
                      }
                      secondary={
                        <Box sx={{ mt: 0.75 }}>
                          <Skeleton
                            animation="wave"
                            variant="text"
                            width={idx % 2 === 0 ? "88%" : "74%"}
                            height={18}
                            sx={{ borderRadius: 1 }}
                          />
                          {item.stacked && (
                            <Box
                              display="flex"
                              alignItems="center"
                              gap={1}
                              mt={0.5}
                            >
                              <Skeleton
                                animation="wave"
                                variant="circular"
                                width={14}
                                height={14}
                              />
                              <Skeleton
                                animation="wave"
                                variant="text"
                                width={165}
                                height={16}
                                sx={{ borderRadius: 1 }}
                              />
                            </Box>
                          )}
                        </Box>
                      }
                    />

                    {!isMobile && (
                      <Skeleton
                        animation="wave"
                        variant="circular"
                        width={24}
                        height={24}
                        sx={{ mt: 0.5 }}
                      />
                    )}
                  </ListItem>
                </CardContent>
              </Card>
            </Box>
          ))}
        </React.Fragment>
      ))}
    </List>
  );
});

// ============================================================================
// Spring Physics & Unstacking Animation Variants
// ============================================================================
const MORPH_SPRING = {
  type: "spring",
  stiffness: 340,
  damping: 30,
  mass: 0.85,
};

const SWIPE_SPRING = {
  type: "spring",
  stiffness: 420,
  damping: 34,
  mass: 0.6,
};

const feedCardVariants = {
  hidden: { opacity: 0, y: 16, scale: 0.96 },
  visible: (index) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 350,
      damping: 28,
      delay: Math.min(index * 0.035, 0.25),
    },
  }),
  exit: {
    opacity: 0,
    scale: 0.92,
    x: -30,
    transition: { duration: 0.2, ease: "easeOut" },
  },
};

const popupCardUnstackVariants = {
  hidden: {
    opacity: 0,
    y: -18,
    scale: 0.92,
  },
  visible: (index) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 380,
      damping: 26,
      mass: 0.75,
      delay: 0.04 + index * 0.05,
    },
  }),
  exit: {
    opacity: 0,
    scale: 0.88,
    x: -45,
    transition: { duration: 0.18, ease: "easeInOut" },
  },
};

// ============================================================================
// 1. Memoized Notification Item (Used in Desktop Modal & Mobile Inline Stack)
// ============================================================================
const ExpandedNotificationItem = memo(
  ({
    notif,
    index,
    mode,
    isMobile,
    isExpanded,
    onItemClick,
    onMarkRead,
    onDelete,
    onFriendRequest,
  }) => {
    const [swiped, setSwiped] = useState(false);
    const [menuAnchor, setMenuAnchor] = useState(null);

    const isRequest = notif.type === "friend_request";
    const isDirectChat = notif.type === "chat";
    const isGroupChat = notif.type === "group_chat";
    const isMissedCall = notif.type === "missed_call";
    const normalizedCat = normalizeCategory(notif.type);
    const isFeedbackOrContact =
      POPUP_ALLOWED_SINGLE_CATEGORIES.has(normalizedCat);

    const swipeHandlers = useSwipeable({
      onSwipedLeft: () => {
        if (isMobile) setSwiped(true);
      },
      onSwipedRight: () => {
        if (isMobile) setSwiped(false);
      },
      preventScrollOnSwipe: true,
      trackMouse: false,
    });

    const notifDate = toJsDate(notif.timestamp);

    return (
      <motion.div
        layout
        custom={index}
        variants={popupCardUnstackVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        whileHover={!isMobile ? { scale: 1.01, x: 2 } : undefined}
        whileTap={{ scale: 0.985 }}
        style={{
          position: "relative",
          marginBottom: "10px",
          originY: 0,
        }}
      >
        <Box sx={{ position: "relative", overflow: "hidden", borderRadius: 6 }}>
          {/* Mobile Swipe Tray */}
          {isMobile && (
            <Box
              sx={{
                position: "absolute",
                right: 0,
                top: 0,
                bottom: 0,
                width: 120,
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-end",
                gap: 1,
                pr: 1.75,
                zIndex: 1,
                background:
                  "linear-gradient(90deg, rgba(34,197,94,0.2) 0%, rgba(239,68,68,0.25) 100%)",
                opacity: swiped ? 1 : 0,
                pointerEvents: swiped ? "auto" : "none",
                transition: "opacity 0.15s ease",
              }}
            >
              {!notif.seen && (
                <IconButton
                  size="large"
                  sx={{
                    bgcolor: "rgba(34,197,94,0.3)",
                    color: "success.main",
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSwiped(false);
                    onMarkRead(notif.id);
                  }}
                >
                  <DoneIcon fontSize="medium" />
                </IconButton>
              )}
              <IconButton
                size="medium"
                sx={{ bgcolor: "rgba(239,68,68,0.3)", color: "error.main" }}
                onClick={(e) => {
                  e.stopPropagation();
                  setSwiped(false);
                  onDelete(notif.id);
                }}
              >
                <DeleteIcon fontSize="medium" />
              </IconButton>
            </Box>
          )}

          {/* Sliding Foreground Card */}
          <motion.div
            layout
            {...(isMobile ? swipeHandlers : {})}
            animate={{ x: isMobile && swiped ? -112 : 0 }}
            transition={SWIPE_SPRING}
            style={{ position: "relative", zIndex: 2 }}
          >
            <Box
              onClick={() => {
                if (swiped) {
                  setSwiped(false);
                  return;
                }
                onItemClick(notif);
              }}
              sx={{
                py: 1.75,
                px: 2.25,
                borderRadius: 6,
                cursor: isRequest ? "default" : "pointer",
                backgroundColor: notif.seen
                  ? mode === "dark"
                    ? "rgba(255, 255, 255, 0.07)"
                    : "rgb(255, 255, 255)"
                  : mode === "dark"
                  ? "rgba(75, 75, 75, 0.98)"
                  : "rgba(212, 212, 212, 0.99)",
                border: "0px solid",
                boxShadow: 'none',
                transition: "background-color 0.15s ease, border-color 0.2s ease",
              }}
            >
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="flex-start"
                gap={1.5}
              >
                {/* Avatar with Category Icon inside Expanded List */}
                <Box sx={{ mt: 0.25, flexShrink: 0 }}>
                  <CategorizedAvatar
                    pic={notif.pic}
                    category={normalizedCat}
                    rawType={notif.type}
                    size={38}
                  />
                </Box>

                <Box
                  display="flex"
                  flexDirection="column"
                  flexGrow={1}
                  minWidth={0}
                >
                  {isDirectChat && (
                    <Typography
                      variant="caption"
                      color="primary.main"
                      fontWeight={700}
                      sx={{ mb: 0.25 }}
                    >
                      💬 Direct Chat — Click to Reply
                    </Typography>
                  )}
                  {isGroupChat && (
                    <Typography
                      variant="caption"
                      color="info.main"
                      fontWeight={700}
                      sx={{ mb: 0.25 }}
                    >
                      👥 Group Chat — Click to Open
                    </Typography>
                  )}
                  {isMissedCall && (
                    <Typography
                      variant="caption"
                      color="error.main"
                      fontWeight={700}
                      sx={{ mb: 0.25 }}
                    >
                      📞 Missed Call
                    </Typography>
                  )}
                  <motion.div layout="position">
                    <Typography
                      variant="body2"
                      fontWeight={notif.seen ? 500 : 700}
                      color="text.primary"
                      sx={{
                        fontSize: "0.9rem",
                        whiteSpace:
                          isExpanded || isRequest || isFeedbackOrContact
                            ? "pre-wrap"
                            : "nowrap",
                        overflow:
                          isExpanded || isRequest || isFeedbackOrContact
                            ? "visible"
                            : "hidden",
                        textOverflow:
                          isExpanded || isRequest || isFeedbackOrContact
                            ? "clip"
                            : "ellipsis",
                      }}
                    >
                      {notif.content ||
                        notif.message ||
                        "No details provided."}
                    </Typography>
                  </motion.div>

                  {isRequest && (
                    <Box display="flex" gap={1} mt={1.25} mb={0.5}>
                      <Button
                        variant="contained"
                        color="success"
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          onFriendRequest(notif, "accepted");
                        }}
                        sx={{
                          borderRadius: 99,
                          px: 2,
                          textTransform: "none",
                          fontWeight: 600,
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
                          onFriendRequest(notif, "rejected");
                        }}
                        sx={{
                          borderRadius: 99,
                          px: 2,
                          textTransform: "none",
                          fontWeight: 600,
                        }}
                      >
                        Reject
                      </Button>
                    </Box>
                  )}

                  <Box
                    display="flex"
                    gap={1}
                    alignItems="center"
                    flexWrap="wrap"
                    mt={0.75}
                  >
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      fontWeight={500}
                    >
                      {formatDateLabel(notif.timestamp)} •{" "}
                      {notifDate?.toLocaleTimeString("en-US", {
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </Typography>
                    {!notif.seen && (
                      <Chip
                        label="Unread"
                        color="primary"
                        size="small"
                        sx={{ height: 18, fontSize: "0.62rem", fontWeight: 700 }}
                      />
                    )}
                  </Box>
                </Box>

                {!isMobile && (
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuAnchor(e.currentTarget);
                    }}
                    sx={{ color: "text.secondary", mt: -0.5, mr: -1 }}
                  >
                    <MoreVertIcon fontSize="small" />
                  </IconButton>
                )}
              </Box>
            </Box>
          </motion.div>
        </Box>

        {/* Desktop 3-Dots Menu */}
        <Menu
          anchorEl={menuAnchor}
          open={Boolean(menuAnchor)}
          onClose={() => setMenuAnchor(null)}
          onClick={(e) => e.stopPropagation()}
          PaperProps={{
            sx: { borderRadius: 3, minWidth: 160 },
          }}
        >
          {!notif.seen && (
            <MenuItem
              onClick={() => {
                onMarkRead(notif.id);
                setMenuAnchor(null);
              }}
            >
              <ListItemIcon>
                <DoneIcon fontSize="small" color="success" />
              </ListItemIcon>
              <ListItemText primary="Mark as read" />
            </MenuItem>
          )}
          <MenuItem
            onClick={() => {
              onDelete(notif.id);
              setMenuAnchor(null);
            }}
            sx={{ color: "error.main" }}
          >
            <ListItemIcon>
              <DeleteIcon fontSize="small" color="error" />
            </ListItemIcon>
            <ListItemText primary="Delete" />
          </MenuItem>
        </Menu>
      </motion.div>
    );
  }
);

// ============================================================================
// 2. Memoized Stacked Notification Card Component (Main Feed + Mobile Unstack)
// ============================================================================
const NotificationStackCard = memo(
  ({
    group,
    index,
    mode,
    isMobile,
    isInlineExpanded,
    isMobileStackOpen,
    isSelected,
    expandedDetailId,
    handleGroupClick,
    handlePopupNotificationClick,
    markGroupAsRead,
    markSingleAsRead,
    deleteGroup,
    deleteNotification,
    handleFriendRequest,
  }) => {
    const latestNotif = group.notifications[0];
    const groupCount = group.notifications.length;
    const isStacked = groupCount > 1;
    const isGroupSeen = group.isSeen;
    const opensPopup = canGroupOpenPopup(group);

    const [swiped, setSwiped] = useState(false);
    const [menuAnchor, setMenuAnchor] = useState(null);

    const swipeHandlers = useSwipeable({
      onSwipedLeft: () => {
        if (isMobile) setSwiped(true);
      },
      onSwipedRight: () => {
        if (isMobile) setSwiped(false);
      },
      preventScrollOnSwipe: true,
      trackMouse: false,
    });

    const handleMenuOpen = useCallback((e) => {
      e.stopPropagation();
      setMenuAnchor(e.currentTarget);
    }, []);

    const handleMenuClose = useCallback((e) => {
      if (e) e.stopPropagation();
      setMenuAnchor(null);
    }, []);

    return (
      <motion.div
        layout="position"
        custom={index}
        variants={feedCardVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        style={{
          marginBottom: isStacked && !isMobileStackOpen ? "20px" : "12px",
          position: "relative",
          zIndex: isSelected ? 10 : 1,
        }}
      >
        <Box sx={{ position: "relative", borderRadius: 5 }}>
          {/* 3D Stack Backdrop Layers (Hidden when mobile stack is unfolded inline) */}
          {isStacked && !isMobileStackOpen && (
            <>
              {groupCount > 2 && (
                <Box
                  sx={(theme) => ({
                    position: "absolute",
                    inset: 0,
                    borderRadius: 7,
                    bgcolor:
                      theme.palette.mode === "dark"
                        ? "rgb(21, 21, 21)"
                        : "#f0eeee",
                    border: "0px solid",
                    transform: "translate3d(0, 29px, 0) scale(0.82)",
                    zIndex: 0,
                    pointerEvents: "none",
                    boxShadow: 'none',
                  })}
                />
              )}
              <Box
                sx={(theme) => ({
                  position: "absolute",
                  inset: 0,
                  borderRadius: 7,
                  bgcolor:
                    theme.palette.mode === "dark"
                      ? "rgb(25, 25, 25)"
                      : "#f4f4f4",
                  border: "0px solid",
                  transform: "translate3d(0, 14px, 0) scale(0.92)",
                  zIndex: 1,
                  pointerEvents: "none",
                  boxShadow: 'none',
                })}
              />
            </>
          )}

          {/* Shared Layout Morph Target Container (Desktop only uses layoutId for popup) */}
          <motion.div
            layoutId={
              !isMobile && opensPopup ? `stack-${group.groupKey}` : undefined
            }
            transition={MORPH_SPRING}
            style={{
              position: "relative",
              overflow: "hidden",
              borderRadius: "30px",
              zIndex: 2,
            }}
          >
            {/* Static Mobile Swipe Tray */}
            {isMobile && (
              <Box
                sx={{
                  position: "absolute",
                  right: 0,
                  top: 0,
                  bottom: 0,
                  width: 136,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "flex-end",
                  gap: 1.25,
                  pr: 2,
                  zIndex: 1,
                  background:
                    "linear-gradient(90deg, rgba(34,197,94,0.16) 0%, rgba(239,68,68,0.24) 100%)",
                  opacity: swiped ? 1 : 0,
                  pointerEvents: swiped ? "auto" : "none",
                  transition: "opacity 0.15s ease",
                }}
              >
                <IconButton
                  size="large"
                  sx={{
                    bgcolor: "rgba(34,197,94,0.25)",
                    color: "success.main",
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSwiped(false);
                    markGroupAsRead(group);
                  }}
                >
                  <DoneAllIcon fontSize="small" />
                </IconButton>
                <IconButton
                  size="large"
                  sx={{
                    bgcolor: "rgba(239,68,68,0.25)",
                    color: "error.main",
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSwiped(false);
                    deleteGroup(group);
                  }}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Box>
            )}

            {/* Sliding Foreground Card */}
            <motion.div
              {...(isMobile ? swipeHandlers : {})}
              animate={{ x: isMobile && swiped ? -128 : 0 }}
              transition={SWIPE_SPRING}
              style={{ position: "relative", zIndex: 2 }}
            >
              <Card
                elevation={0}
                sx={(theme) => ({
                  bgcolor: isGroupSeen
                    ? theme.palette.mode === "dark"
                      ? "rgba(18,18,18,0.92)"
                      : "rgba(255,255,255,0.94)"
                    : theme.palette.mode === "dark"
                    ? "rgba(255, 255, 255, 0.11)"
                    : "rgba(235, 235, 235, 0.98)",
                  backgroundImage: "none",
                  borderRadius: 7,
                  border: "0px solid",
                  boxShadow: 'none',
                  "&:hover": {
                    transform: 'translate(0)',
                  },
                })}
              >
                <CardActionArea
                  component="div"
                  onClick={() => {
                    if (swiped) {
                      setSwiped(false);
                      return;
                    }
                    handleGroupClick(group);
                  }}
                  sx={{ p: 0.5 }}
                >
                  <CardContent
                    sx={{ py: 1.5, px: 2, "&:last-child": { pb: 1.5 } }}
                  >
                    <ListItem
                      disablePadding
                      sx={{ alignItems: "flex-start" }}
                      secondaryAction={
                        !isMobile && (
                          <IconButton
                            edge="end"
                            size="small"
                            onClick={handleMenuOpen}
                            sx={{
                              color: "text.secondary",
                              mt: 0.5,
                              "&:hover": {
                                bgcolor: "action.hover",
                                color: "text.primary",
                              },
                            }}
                          >
                            <MoreVertIcon fontSize="small" />
                          </IconButton>
                        )
                      }
                    >
                      {/* Profile Avatar with Grouped Category Icon Overlay */}
                      <ListItemAvatar sx={{ mt: 0.5 }}>
                        <CategorizedAvatar
                          pic={latestNotif.pic}
                          category={group.groupType}
                          rawType={latestNotif.type}
                          stackCount={groupCount}
                          size={46}
                        />
                      </ListItemAvatar>

                      <ListItemText
                        sx={{
                          ml: 1.5,
                          my: 0,
                          pr: !isMobile ? 4 : 0,
                        }}
                        primary={
                          <Box
                            display="flex"
                            alignItems="center"
                            justifyContent="space-between"
                            gap={1}
                            width="100%"
                          >
                            <Box
                              display="flex"
                              alignItems="center"
                              gap={1}
                              sx={{ minWidth: 0, flexGrow: 1 }}
                            >
                              <Typography
                                component="span"
                                fontWeight={isGroupSeen ? 600 : 700}
                                fontSize="0.95rem"
                                color="text.primary"
                                noWrap
                              >
                                {latestNotif.title || "Notification"}
                              </Typography>
                              <Chip
                                label={formatLabel(group.groupType)}
                                size="small"
                                variant="outlined"
                                color={
                                  latestNotif.type === "missed_call" &&
                                  !isGroupSeen
                                    ? "error"
                                    : group.groupType === "group_chat"
                                    ? "info"
                                    : POPUP_ALLOWED_SINGLE_CATEGORIES.has(
                                        group.groupType
                                      )
                                    ? "secondary"
                                    : "default"
                                }
                                sx={{
                                  height: 20,
                                  fontSize: "0.65rem",
                                  fontWeight: 600,
                                  flexShrink: 0,
                                }}
                              />
                            </Box>

                            <Typography
                              component="span"
                              variant="caption"
                              sx={{
                                color: "text.secondary",
                                fontSize: "0.75rem",
                                flexShrink: 0,
                              }}
                            >
                              {group.groupTime}
                            </Typography>
                          </Box>
                        }
                        secondary={
                          <Box sx={{ mt: 0.75 }}>
                            {latestNotif.type === "friend_request" &&
                            !isStacked ? (
                              <Box
                                sx={{
                                  display: "flex",
                                  gap: 1,
                                  alignItems: "center",
                                  flexWrap: "wrap",
                                  mt: 0.5,
                                }}
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Typography
                                  variant="body2"
                                  color="text.secondary"
                                  sx={{ width: "100%", mb: 0.5 }}
                                >
                                  {latestNotif.content || latestNotif.message}
                                </Typography>
                                <Button
                                  variant="contained"
                                  color="success"
                                  size="small"
                                  sx={{
                                    borderRadius: 99,
                                    textTransform: "none",
                                  }}
                                  onClick={() =>
                                    handleFriendRequest(latestNotif, "accepted")
                                  }
                                >
                                  Accept
                                </Button>
                                <Button
                                  variant="outlined"
                                  color="error"
                                  size="small"
                                  sx={{
                                    borderRadius: 99,
                                    textTransform: "none",
                                  }}
                                  onClick={() =>
                                    handleFriendRequest(latestNotif, "rejected")
                                  }
                                >
                                  Reject
                                </Button>
                              </Box>
                            ) : (
                              <Box
                                display="flex"
                                flexDirection="column"
                                gap={0.5}
                              >
                                <Typography
                                  variant="body2"
                                  color="text.secondary"
                                  sx={{
                                    whiteSpace: isInlineExpanded
                                      ? "pre-wrap"
                                      : "nowrap",
                                    overflow: isInlineExpanded
                                      ? "visible"
                                      : "hidden",
                                    textOverflow: isInlineExpanded
                                      ? "clip"
                                      : "ellipsis",
                                    fontSize: "0.85rem",
                                    opacity: isGroupSeen ? 0.75 : 1,
                                    fontWeight: isGroupSeen ? 400 : 500,
                                  }}
                                >
                                  {latestNotif.content ||
                                    latestNotif.message ||
                                    "No details available."}
                                </Typography>

                                {isStacked && (
                                  <Box
                                    display="flex"
                                    alignItems="center"
                                    gap={0.75}
                                    mt={0.25}
                                  >
                                    <LayersIcon
                                      sx={{
                                        fontSize: "0.9rem",
                                        color: isGroupSeen
                                          ? "text.secondary"
                                          : "primary.main",
                                      }}
                                    />
                                    <Typography
                                      variant="caption"
                                      sx={{
                                        color: isGroupSeen
                                          ? "text.secondary"
                                          : "primary.main",
                                        fontWeight: 700,
                                        fontSize: "0.75rem",
                                      }}
                                    >
                                      {isMobile && isMobileStackOpen
                                        ? `Tap to collapse ${groupCount} stacked alerts`
                                        : `+${groupCount - 1} more in ${formatLabel(
                                            group.groupType
                                          )} • Tap to ${
                                            isMobile ? "unstack" : "expand"
                                          }`}
                                    </Typography>
                                    {isMobile &&
                                      (isMobileStackOpen ? (
                                        <ExpandLessIcon
                                          sx={{
                                            fontSize: "1rem",
                                            color: "primary.main",
                                          }}
                                        />
                                      ) : (
                                        <ExpandMoreIcon
                                          sx={{
                                            fontSize: "1rem",
                                            color: "text.secondary",
                                          }}
                                        />
                                      ))}
                                    {!isGroupSeen && (
                                      <Box
                                        sx={{
                                          width: 7,
                                          height: 7,
                                          borderRadius: "50%",
                                          bgcolor: "primary.main",
                                        }}
                                      />
                                    )}
                                  </Box>
                                )}

                                {!isStacked && opensPopup && (
                                  <Box
                                    display="flex"
                                    alignItems="center"
                                    gap={0.5}
                                    mt={0.25}
                                  >
                                    <OpenInNewIcon
                                      sx={{
                                        fontSize: "0.85rem",
                                        color: isGroupSeen
                                          ? "text.secondary"
                                          : "secondary.main",
                                      }}
                                    />
                                    <Typography
                                      variant="caption"
                                      sx={{
                                        color: isGroupSeen
                                          ? "text.secondary"
                                          : "secondary.main",
                                        fontWeight: 600,
                                        fontSize: "0.75rem",
                                      }}
                                    >
                                      {isMobile && isMobileStackOpen
                                        ? "Tap to hide details"
                                        : `Tap to view ${formatLabel(
                                            group.groupType
                                          )} details`}
                                    </Typography>
                                  </Box>
                                )}
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
          </motion.div>
        </Box>

        {/* ==================================================================== */}
        {/* MOBILE-ONLY INLINE UNSTACKED LIST (Opens directly beneath the stack) */}
        {/* ==================================================================== */}
        <AnimatePresence>
          {isMobile && isMobileStackOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ type: "spring", stiffness: 320, damping: 28 }}
              style={{ overflow: "hidden" }}
            >
              <Box
                sx={{
                  mt: 0,
                  ml: 3,
                  pl: 1.5,
                  pr: 0.5,
                  py: 1,
                  borderLeft: "2px solid",
                  borderColor: mode === "dark" ? "#f1f1f111" : "#0c0c0c11",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <Box
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                  mb={1}
                  px={0.5}
                >
                  <Typography
                    variant="caption"
                    fontWeight={700}
                    color="primary.main"
                  >
                    {groupCount}{" "}
                    {groupCount === 1
                      ? "Detail Item"
                      : `Stacked ${formatLabel(group.groupType)} Alerts`}
                  </Typography>
                  <Box display="flex" gap={1}>
                    {!isGroupSeen && (
                      <Button
                        size="small"
                        color="success"
                        startIcon={<DoneAllIcon fontSize="small" />}
                        onClick={(e) => {
                          e.stopPropagation();
                          markGroupAsRead(group);
                        }}
                        sx={{
                          fontSize: "0.7rem",
                          py: 0.2,
                          textTransform: "none",
                        }}
                      >
                        Mark Read
                      </Button>
                    )}
                    <Button
                      size="small"
                      color="inherit"
                      endIcon={<ExpandLessIcon fontSize="small" />}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleGroupClick(group);
                      }}
                      sx={{
                        fontSize: "0.7rem",
                        py: 0.2,
                        textTransform: "none",
                        color: "text.secondary",
                        background: mode === "dark" ? "#f1f1f111" : "#0c0c0c11"
                      }}
                    >
                      Collapse
                    </Button>
                  </Box>
                </Box>

                <AnimatePresence mode="popLayout">
                  {group.notifications.map((notif, itemIdx) => (
                    <ExpandedNotificationItem
                      key={`mobile-inline-${notif.id}`}
                      notif={notif}
                      index={itemIdx}
                      mode={mode}
                      isMobile={isMobile}
                      isExpanded={expandedDetailId === notif.id}
                      onItemClick={handlePopupNotificationClick}
                      onMarkRead={markSingleAsRead}
                      onDelete={deleteNotification}
                      onFriendRequest={handleFriendRequest}
                    />
                  ))}
                </AnimatePresence>
              </Box>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Desktop 3-Dots Context Menu */}
        <Menu
          anchorEl={menuAnchor}
          open={Boolean(menuAnchor)}
          onClose={handleMenuClose}
          onClick={(e) => e.stopPropagation()}
          PaperProps={{
            sx: {
              borderRadius: 3,
              minWidth: 185,
              boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
            },
          }}
        >
          <MenuItem
            onClick={() => {
              markGroupAsRead(group);
              handleMenuClose();
            }}
          >
            <ListItemIcon>
              <DoneAllIcon fontSize="small" color="success" />
            </ListItemIcon>
            <ListItemText
              primary={isStacked ? "Mark stack as read" : "Mark as read"}
            />
          </MenuItem>
          <MenuItem
            onClick={() => {
              deleteGroup(group);
              handleMenuClose();
            }}
            sx={{ color: "error.main" }}
          >
            <ListItemIcon>
              <DeleteIcon fontSize="small" color="error" />
            </ListItemIcon>
            <ListItemText primary={isStacked ? "Delete stack" : "Delete"} />
          </MenuItem>
        </Menu>
      </motion.div>
    );
  }
);

// ============================================================================
// 3. Main Notifications Page / Panel Component
// ============================================================================
export default function Notifications({ isPanel = false }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [indexError, setIndexError] = useState(null);
  const [filter, setFilter] = useState("all");
  const [selectedGroupKey, setSelectedGroupKey] = useState(null);
  const [globalUserView, setGlobalUserView] = useState(false);
  const [expandedDetailId, setExpandedDetailId] = useState(null);
  const [inlineExpandedGroupKeys, setInlineExpandedGroupKeys] = useState({});
  const [mobileOpenStackKeys, setMobileOpenStackKeys] = useState({});

  const { mode } = useThemeToggle();
  const theme = useMemo(() => getTheme(mode), [mode]);
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) =>
      setCurrentUser(user)
    );
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!currentUser) {
      setNotifications([]);
      setLoading(false);
      return;
    }
    setLoading(true);

    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    const q = query(
      collection(db, "notifications"),
      where("uid", "==", currentUser.uid),
      where("timestamp", ">=", oneMonthAgo),
      orderBy("timestamp", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const notifData = snapshot.docs
          .map((docSnap) => ({
            id: docSnap.id,
            ...docSnap.data(),
          }))
          .filter((n) => isWithinLastMonth(n.timestamp));

        setNotifications(notifData);
        setLoading(false);
      },
      (error) => {
        console.error("Firestore error:", error);
        if (error.code === "failed-precondition") {
          setIndexError(
            error.message.match(
              /https:\/\/console\.firebase\.google\.com\/project\/[^\s]+/
            )?.[0]
          );
        }
        setNotifications([]);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, [currentUser]);

  // Dynamically derive extra categories (excluding pinned "chat" and "group_chat")
  const notificationCategories = useMemo(() => {
    const categories = new Set();
    notifications.forEach((n) => {
      if (n.type) {
        const normalized = normalizeCategory(n.type);
        if (normalized !== "chat" && normalized !== "group_chat") {
          categories.add(normalized);
        }
      }
    });
    return Array.from(categories);
  }, [notifications]);

  const filteredNotifications = useMemo(() => {
    const recentNotifications = notifications.filter((n) =>
      isWithinLastMonth(n.timestamp)
    );
    if (filter === "all") return recentNotifications;
    if (filter === "unreads")
      return recentNotifications.filter((n) => !n.seen);
    return recentNotifications.filter(
      (n) => normalizeCategory(n.type) === filter
    );
  }, [notifications, filter]);

  // Group notifications by Date + Sender + Separated Category (chat vs group_chat)
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
      const byCategoryAndSender = byDate[dateLabel].reduce((acc, notif) => {
        const sender = notif.senderId || notif.title || "system";
        const combinedCategory = normalizeCategory(notif.type);
        const groupKey = `${dateLabel}_${sender}_${combinedCategory}`;

        if (!acc[groupKey]) {
          acc[groupKey] = {
            groupKey,
            dateLabel,
            sender,
            senderPic: notif.pic || "",
            groupType: combinedCategory,
            groupTime: getGroupDisplayTime(notif.timestamp),
            notifications: [],
            title: notif.title || "Notification",
            isSeen: true,
            latestTimestamp: notif.timestamp,
          };
        }

        acc[groupKey].notifications.push(notif);
        if (!notif.seen) acc[groupKey].isSeen = false;
        return acc;
      }, {});

      finalGrouped[dateLabel] = Object.values(byCategoryAndSender).sort(
        (a, b) =>
          (toJsDate(b.latestTimestamp)?.getTime() || 0) -
          (toJsDate(a.latestTimestamp)?.getTime() || 0)
      );
    }

    return finalGrouped;
  }, [filteredNotifications]);

  // Active group for the Desktop Modal (disabled on mobile)
  const activeGroup = useMemo(() => {
    if (isMobile || !selectedGroupKey) return null;
    for (const dateLabel in groupedNotifications) {
      const found = groupedNotifications[dateLabel].find(
        (g) => g.groupKey === selectedGroupKey
      );
      if (found && canGroupOpenPopup(found)) return found;
    }
    return null;
  }, [groupedNotifications, selectedGroupKey, isMobile]);

  const markGroupAsRead = useCallback(async (group) => {
    if (!group) return;
    const unreadDocs = group.notifications.filter((n) => !n.seen);
    if (!unreadDocs.length) return;
    await Promise.all(
      unreadDocs.map((n) =>
        updateDoc(doc(db, "notifications", n.id), { seen: true })
      )
    );
  }, []);

  const markSingleAsRead = useCallback(async (id) => {
    await updateDoc(doc(db, "notifications", id), { seen: true });
  }, []);

  const deleteNotification = useCallback(async (id) => {
    await deleteDoc(doc(db, "notifications", id));
  }, []);

  const deleteGroup = useCallback(async (group) => {
    if (!group) return;
    setSelectedGroupKey((prev) => (prev === group.groupKey ? null : prev));
    await Promise.all(
      group.notifications.map((n) => deleteDoc(doc(db, "notifications", n.id)))
    );
  }, []);

  const handleFriendRequest = useCallback(async (notif, statusText) => {
    try {
      const currentUid = auth.currentUser?.uid;
      if (!currentUid) return;

      await updateDoc(doc(db, "notifications", notif.id), {
        status: statusText,
        read: true,
        seen: true,
        message:
          statusText === "accepted"
            ? "You are now friends!"
            : "Friend request rejected.",
      });

      if (statusText === "accepted") {
        await Promise.all([
          updateDoc(doc(db, "users", currentUid), {
            friends: arrayUnion(notif.senderId),
          }),
          updateDoc(doc(db, "users", notif.senderId), {
            friends: arrayUnion(currentUid),
          }),
        ]);

        await setDoc(doc(db, "notifications", notif.id), {
          type: "friend_accepted",
          senderId: currentUid,
          uid: notif.senderId,
          title: "Friend Request Accepted",
          content: `${
            auth.currentUser?.displayName || "A user"
          } accepted your friend request.`,
          pic: auth.currentUser?.photoURL || "",
          seen: false,
          timestamp: new Date(),
        });
      }
    } catch (err) {
      console.error(`Error processing friend request (${statusText}):`, err);
    }
  }, []);

  const handleGroupClick = useCallback(
    (group) => {
      markGroupAsRead(group);

      if (canGroupOpenPopup(group)) {
        if (isMobile) {
          setMobileOpenStackKeys((prev) => ({
            ...prev,
            [group.groupKey]: !prev[group.groupKey],
          }));
        } else {
          setGlobalUserView(false);
          setExpandedDetailId(null);
          setSelectedGroupKey(group.groupKey);
        }
        return;
      }

      const singleNotif = group.notifications[0];
      if (!singleNotif) return;

      if (
        (group.groupType === "chat" || group.groupType === "group_chat") &&
        singleNotif.senderId
      ) {
        navigate(
          group.groupType === "group_chat"
            ? `/group-chat/${singleNotif.senderId}`
            : `/chat/${singleNotif.senderId}`,
          {
            state: {
              displayName: singleNotif.title,
              photoURL: singleNotif.pic,
            },
          }
        );
      } else if (singleNotif.type !== "friend_request") {
        setInlineExpandedGroupKeys((prev) => ({
          ...prev,
          [group.groupKey]: !prev[group.groupKey],
        }));
      }
    },
    [markGroupAsRead, isMobile, navigate]
  );

  const handlePopupNotificationClick = useCallback(
    (notif) => {
      if (!notif.seen) {
        markSingleAsRead(notif.id);
      }
      const category = normalizeCategory(notif.type);
      if (
        (category === "chat" || category === "group_chat") &&
        notif.senderId
      ) {
        setSelectedGroupKey(null);
        navigate(
          category === "group_chat"
            ? `/group-chat/${notif.senderId}`
            : `/chat/${notif.senderId}`,
          {
            state: {
              displayName: notif.title,
              photoURL: notif.pic,
            },
          }
        );
      } else if (notif.type !== "friend_request") {
        setExpandedDetailId((prev) => (prev === notif.id ? null : notif.id));
      }
    },
    [markSingleAsRead, navigate]
  );

  const closeModal = useCallback(() => {
    setSelectedGroupKey(null);
    setGlobalUserView(false);
  }, []);

  const modalNotificationsList = useMemo(() => {
    if (!activeGroup) return [];
    if (globalUserView) {
      return notifications.filter(
        (n) =>
          (n.senderId || n.title || "system") === activeGroup.sender &&
          isWithinLastMonth(n.timestamp)
      );
    }
    return activeGroup.notifications;
  }, [activeGroup, globalUserView, notifications]);

  return (
    <ThemeProvider theme={theme}>
      <LayoutGroup>
        <Box
          sx={{
            flexGrow: 1,
            bgcolor: isPanel ? "transparent" : "background.default",
            minHeight: isPanel ? "auto" : "100vh",
            px: isPanel ? 0 : 1,
            pt: isPanel ? 0 : 5,
          }}
        >
          {!isPanel && (
            <AppBar
              position="static"
              elevation={0}
              sx={{ bgcolor: "transparent", color: "text.primary" }}
            >
              <Toolbar>
                <IconButton
                  edge="start"
                  color="inherit"
                  onClick={() => navigate(-1)}
                  sx={{ mr: 2 }}
                >
                  <ArrowBackIcon />
                </IconButton>
                <Typography
                  variant="h6"
                  color="inherit"
                  sx={{ flexGrow: 1, fontWeight: "bold" }}
                >
                  Notifications
                </Typography>
                <Chip
                  label="Last 30 Days"
                  size="small"
                  variant="outlined"
                  sx={{ fontSize: "0.7rem", fontWeight: 600 }}
                />
              </Toolbar>
            </AppBar>
          )}

          {/* CHIP FILTER SECTION (Separate Chat & Group Chat Chips) */}
          <Box
            sx={{
              display: "flex",
              overflowX: "auto",
              p: 1,
              gap: 1,
              "&::-webkit-scrollbar": { display: "none" },
            }}
          >
            <Chip
              label="All"
              onClick={() => setFilter("all")}
              color={filter === "all" ? "primary" : "default"}
              variant={filter === "all" ? "filled" : "outlined"}
            />
            <Chip
              label="Unreads"
              onClick={() => setFilter("unreads")}
              color={filter === "unreads" ? "primary" : "default"}
              variant={filter === "unreads" ? "filled" : "outlined"}
            />
            <Chip
              label="Chat"
              onClick={() => setFilter("chat")}
              color={filter === "chat" ? "primary" : "default"}
              variant={filter === "chat" ? "filled" : "outlined"}
            />
            <Chip
              label="Group Chat"
              onClick={() => setFilter("group_chat")}
              color={filter === "group_chat" ? "primary" : "default"}
              variant={filter === "group_chat" ? "filled" : "outlined"}
            />
            {notificationCategories.map((category) => (
              <Chip
                key={category}
                label={formatLabel(category)}
                onClick={() => setFilter(category)}
                color={filter === category ? "primary" : "default"}
                variant={filter === category ? "filled" : "outlined"}
              />
            ))}
          </Box>

          <Container sx={{ mt: 0, p: 0, pb: 6 }}>
            {indexError && (
              <Alert severity="error" sx={{ m: 2, overflowWrap: "break-word" }}>
                Firestore Index Error. Follow this link:{" "}
                <a href={indexError} target="_blank" rel="noopener noreferrer">
                  {indexError}
                </a>
              </Alert>
            )}
            {loading ? (
              <NotificationsSkeleton isMobile={isMobile} />
            ) : filteredNotifications.length === 0 ? (
              <Typography
                variant="body1"
                align="center"
                mt={4}
                color="text.secondary"
              >
                No notifications from the past month for this filter.
              </Typography>
            ) : (
              <List
                sx={{
                  width: "100%",
                  px: { xs: 0, md: 0 },
                  pointerEvents: activeGroup ? "none" : "auto",
                }}
              >
                {Object.keys(groupedNotifications).map((dateLabel) => (
                  <React.Fragment key={dateLabel}>
                    <Typography
                      variant="overline"
                      sx={{
                        display: "block",
                        fontWeight: 700,
                        fontSize: "0.78rem",
                        pt: 2,
                        pb: 1,
                        px: 1.5,
                        color: "text.secondary",
                        textTransform: "uppercase",
                        letterSpacing: 1.2,
                      }}
                    >
                      {dateLabel}
                    </Typography>
                    <AnimatePresence mode="popLayout">
                      {groupedNotifications[dateLabel].map((group, idx) => (
                        <NotificationStackCard
                          key={group.groupKey}
                          group={group}
                          index={idx}
                          mode={mode}
                          isMobile={isMobile}
                          isSelected={selectedGroupKey === group.groupKey}
                          isInlineExpanded={Boolean(
                            inlineExpandedGroupKeys[group.groupKey]
                          )}
                          isMobileStackOpen={Boolean(
                            mobileOpenStackKeys[group.groupKey]
                          )}
                          expandedDetailId={expandedDetailId}
                          handleGroupClick={handleGroupClick}
                          handlePopupNotificationClick={
                            handlePopupNotificationClick
                          }
                          markGroupAsRead={markGroupAsRead}
                          markSingleAsRead={markSingleAsRead}
                          deleteGroup={deleteGroup}
                          deleteNotification={deleteNotification}
                          handleFriendRequest={handleFriendRequest}
                        />
                      ))}
                    </AnimatePresence>
                  </React.Fragment>
                ))}
              </List>
            )}
          </Container>

          {/* ==================================================================== */}
          {/* DESKTOP-ONLY EXPANDED STACK POPUP MODAL (!isMobile)                  */}
          {/* ==================================================================== */}
          <AnimatePresence>
            {!isMobile && activeGroup && (
              <Box
                key="modal-overlay-wrapper"
                sx={{
                  position: "fixed",
                  inset: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  zIndex: 1400,
                  p: 2,
                }}
              >
                {/* Blur Backdrop */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.22, ease: "easeOut" }}
                  onClick={closeModal}
                  style={{
                    position: "absolute",
                    inset: 0,
                    background:
                      mode === "dark"
                        ? "rgba(0,0,0,0.62)"
                        : "rgba(255,255,255,0.45)",
                    backdropFilter: "blur(16px)",
                    WebkitBackdropFilter: "blur(16px)",
                    zIndex: 1401,
                  }}
                />

                {/* Shared-Layout Expanding Stack Container */}
                <motion.div
                  layoutId={`stack-${activeGroup.groupKey}`}
                  transition={MORPH_SPRING}
                  style={{
                    width: "100%",
                    height: "100%",
                    maxWidth: "620px",
                    maxHeight: "85vh",
                    display: "flex",
                    flexDirection: "column",
                    zIndex: 1402,
                  }}
                >
                  <Card
                    elevation={0}
                    sx={{
                      width: "100%",
                      height: "100%",
                      borderRadius: 6,
                      overflow: "hidden",
                      display: "flex",
                      flexDirection: "column",
                      bgcolor:
                        mode === "dark"
                          ? "rgba(0,0,0,0)"
                          : "rgba(255,255,255,0)",
                      border: "0px solid",
                      boxShadow: "0",
                      backdropFilter: 'blur(0)',
                      position: "relative",
                      "&:hover": {
                        transform: 'translate(0)',
                        boxShadow: "0",
                      }
                    }}
                  >
                    {/* Modal Header */}
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, delay: 0.05 }}
                    >
                      <Box
                        sx={{
                          p: 2.5,
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          borderBottom: "1px solid",
                          borderColor: "divider",
                        }}
                      >
                        <Box display="flex" alignItems="center" gap={1.5}>
                          <CategorizedAvatar
                            pic={activeGroup.senderPic}
                            category={activeGroup.groupType}
                            rawType={activeGroup.notifications[0]?.type}
                            stackCount={activeGroup.notifications.length}
                            size={48}
                          />
                          <Box sx={{ ml: 0.5 }}>
                            <Typography
                              variant="h6"
                              fontWeight={700}
                              lineHeight={1.2}
                            >
                              {activeGroup.title}
                            </Typography>
                            <Box
                              display="flex"
                              alignItems="center"
                              gap={1}
                              mt={0.5}
                            >
                              <Chip
                                label={formatLabel(activeGroup.groupType)}
                                size="small"
                                color="primary"
                                sx={{
                                  height: 20,
                                  fontSize: "0.7rem",
                                  fontWeight: 700,
                                }}
                              />
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                {modalNotificationsList.length}{" "}
                                {modalNotificationsList.length === 1
                                  ? "notification"
                                  : "stacked notifications"}
                              </Typography>
                            </Box>
                          </Box>
                        </Box>

                        <Box display="flex" alignItems="center" gap={1}>
                          {!activeGroup.isSeen && (
                            <Button
                              size="small"
                              variant="outlined"
                              color="success"
                              startIcon={<DoneAllIcon />}
                              onClick={() => markGroupAsRead(activeGroup)}
                              sx={{ borderRadius: 99, textTransform: "none" }}
                            >
                              Mark All Read
                            </Button>
                          )}
                          <IconButton onClick={closeModal}>
                            <CloseIcon />
                          </IconButton>
                        </Box>
                      </Box>
                    </motion.div>

                    {/* Animated Notification List Inside Stack */}
                    <Box
                      sx={{
                        flexGrow: 1,
                        overflowY: "auto",
                        p: 2.5,
                      }}
                    >
                      <AnimatePresence mode="popLayout">
                        {modalNotificationsList.map((notif, idx) => (
                          <ExpandedNotificationItem
                            key={`${
                              globalUserView ? "global" : "stack"
                            }-${notif.id}`}
                            notif={notif}
                            index={idx}
                            mode={mode}
                            isMobile={isMobile}
                            isExpanded={expandedDetailId === notif.id}
                            onItemClick={handlePopupNotificationClick}
                            onMarkRead={markSingleAsRead}
                            onDelete={deleteNotification}
                            onFriendRequest={handleFriendRequest}
                          />
                        ))}
                      </AnimatePresence>
                    </Box>

                    {/* Modal Footer Controls */}
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, delay: 0.1 }}
                    >
                      <Box
                        sx={{
                          p: 2,
                          px: 3,
                          borderTop: "1px solid",
                          borderColor: "divider",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: 1.5,
                        }}
                      >
                        <Button
                          variant="outlined"
                          color={globalUserView ? "primary" : "secondary"}
                          onClick={() => setGlobalUserView((prev) => !prev)}
                          sx={{
                            flex: 1,
                            borderRadius: 99,
                            py: 1,
                            textTransform: "none",
                            fontWeight: 600,
                          }}
                        >
                          {globalUserView
                            ? "Show Current View"
                            : "All From Sender"}
                        </Button>

                        <Button
                          variant="contained"
                          color="primary"
                          onClick={closeModal}
                          sx={{
                            flex: 1,
                            borderRadius: 99,
                            py: 1,
                            textTransform: "none",
                            fontWeight: 600,
                          }}
                        >
                          Done
                        </Button>
                      </Box>
                    </motion.div>
                  </Card>
                </motion.div>
              </Box>
            )}
          </AnimatePresence>
        </Box>
      </LayoutGroup>
    </ThemeProvider>
  );
}