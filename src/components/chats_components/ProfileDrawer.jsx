// src/components/chats_components/ProfileDrawer.jsx
import React, { useState, useMemo, useEffect } from "react";
import {
  SwipeableDrawer,
  Drawer,
  Box,
  Typography,
  Avatar,
  Button,
  Stack,
  useMediaQuery,
  useTheme,
  Chip,
  RadioGroup,
  FormControlLabel,
  Radio,
  TextField,
  InputAdornment,
  Tabs,
  Tab,
  ButtonBase,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
} from "@mui/material";
import {
  drawerPaperSx,
  drawerBackdropSx,
  DrawerHandle,
} from "../../theme/designSystem";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import PhoneOutlinedIcon from "@mui/icons-material/PhoneOutlined";
import VideocamOutlinedIcon from "@mui/icons-material/VideocamOutlined";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import TextFieldsIcon from "@mui/icons-material/TextFields";
import PlaceIcon from "@mui/icons-material/Place";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import BlockIcon from "@mui/icons-material/Block";
import RemoveCircleOutlineIcon from "@mui/icons-material/RemoveCircleOutline";
import SearchIcon from "@mui/icons-material/Search";
import StarRoundedIcon from "@mui/icons-material/StarRounded";
import StarBorderRoundedIcon from "@mui/icons-material/StarBorderRounded";
import NotificationsOffOutlinedIcon from "@mui/icons-material/NotificationsOffOutlined";
import NotificationsActiveOutlinedIcon from "@mui/icons-material/NotificationsActiveOutlined";
import TimelapseRoundedIcon from "@mui/icons-material/TimelapseRounded";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import AddIcon from "@mui/icons-material/Add";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { safeImageUrl } from "../../utils/uiHelpers";
import SharedMediaLinksWidgetsTabs from "./SharedMediaLinksWidgetsTabs";
import { useCall } from "../../contexts/CallContext";
import {
  isChatMuted,
  muteChat,
  unmuteChat,
  isChatFavorite,
  toggleFavoriteChat,
  getChatDisappearingDuration,
  setChatDisappearingDuration,
  DISAPPEARING_OPTIONS,
} from "../../utils/chatFeaturesService";

const ProfileDrawer = ({
  open,
  onClose,
  friendDetails,
  nickname,
  mutualFriends = [],
  commonGroups = [],
  commonTrips = [],
  messages = [],
  onOpenImage,
  onJumpToMessage,
  isBlocked = false,
  onOpenSearch,
  onSaveNickname,
  onToggleBlock,
  onRemoveFriend,
  onClearChat,
  onDeleteChat,
  effectiveChatTheme = "dark",
}) => {
  const navigate = useNavigate();
  const muiTheme = useTheme();
  const isDesktop = useMediaQuery(muiTheme.breakpoints.up("md"));
  const isDark = effectiveChatTheme === "dark";
  const mode = isDark ? "dark" : "light";
  const { startCall } = useCall();

  // Active sub-view state: null | 'sharedMedia' | 'commonGroupsTrips' | 'mutualFriends'
  const [activeSubView, setActiveSubView] = useState(null);

  // Common Groups & Trips Tab State ('groups' | 'trips')
  const [groupsTripsTab, setGroupsTripsTab] = useState("groups");

  // Search queries for individual sub-pages
  const [mediaSearchQuery, setMediaSearchQuery] = useState("");
  const [groupsTripsSearchQuery, setGroupsTripsSearchQuery] = useState("");
  const [mutualFriendsSearchQuery, setMutualFriendsSearchQuery] = useState("");

  // Inline Nickname Accordion & Input State
  const [isEditingNickname, setIsEditingNickname] = useState(false);
  const [nicknameInput, setNicknameInput] = useState(nickname || "");

  // Dynamic Profile Color Extractor State
  const [avatarColor, setAvatarColor] = useState(isDark ? "#2a2a2e" : "#e0e0e0");

  // Mute & Disappearing Drawer States
  const [muteChatDialogOpen, setMuteChatDialogOpen] = useState(false);
  const [muteDuration, setMuteDuration] = useState("8h");
  
  const [disappearingDialogOpen, setDisappearingDialogOpen] = useState(false);
  const [disappearingDuration, setDisappearingDurationState] = useState(() =>
    getChatDisappearingDuration(friendDetails?.id || friendDetails?.uid)
  );

  const name = friendDetails?.name || friendDetails?.displayName || "Friend";
  const username = friendDetails?.username;
  const photoURL = safeImageUrl(friendDetails?.photoURL);
  const phone =
    friendDetails?.mobile ||
    friendDetails?.phoneNumber ||
    friendDetails?.phone ||
    "";
  const friendId = friendDetails?.id || friendDetails?.uid;

  // Features state: Mute, Favorite
  const [isMuted, setIsMuted] = useState(() => isChatMuted(friendId));
  const [isFavorite, setIsFavorite] = useState(() => isChatFavorite(friendId));

  // Extract dominant color from avatar image URL
  useEffect(() => {
    if (!photoURL) {
      setAvatarColor(isDark ? "#2a2a2e" : "#e0e0e0");
      return;
    }
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.src = photoURL;
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        canvas.width = 1;
        canvas.height = 1;
        ctx.drawImage(img, 0, 0, 1, 1);
        const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
        setAvatarColor(`rgb(${r}, ${g}, ${b})`);
      } catch {
        setAvatarColor(isDark ? "#2a2a2e" : "#e0e0e0");
      }
    };
    img.onerror = () => {
      setAvatarColor(isDark ? "#2a2a2e" : "#e0e0e0");
    };
  }, [photoURL, isDark]);

  React.useEffect(() => {
    if (friendId) {
      setIsMuted(isChatMuted(friendId));
      setIsFavorite(isChatFavorite(friendId));
      setDisappearingDurationState(getChatDisappearingDuration(friendId));
    }
  }, [friendId, friendDetails]);

  React.useEffect(() => {
    setNicknameInput(nickname || "");
  }, [nickname]);

  // Shared media helper
  const sharedMedia = useMemo(() => {
    const list = [];
    (messages || []).forEach((m) => {
      if (m.dataUri) list.push({ url: m.dataUri, msgId: m.id });
      if (m.imageUrl) list.push({ url: m.imageUrl, msgId: m.id });
      if (Array.isArray(m.images)) {
        m.images.forEach((img) => {
          if (img) list.push({ url: img, msgId: m.id });
        });
      }
      if (Array.isArray(m.imageUrls)) {
        m.imageUrls.forEach((img) => {
          if (img) list.push({ url: img, msgId: m.id });
        });
      }
    });
    return list;
  }, [messages]);

  const handleStartAudioCall = () => {
    if (!friendDetails) return;
    const targetUid = friendDetails.uid || friendDetails.id;
    startCall(
      {
        id: targetUid,
        uid: targetUid,
        name: name,
        photoURL: photoURL || "",
        username: username || "",
      },
      "audio"
    );
  };

  const handleStartVideoCall = () => {
    if (!friendDetails) return;
    const targetUid = friendDetails.uid || friendDetails.id;
    startCall(
      {
        id: targetUid,
        uid: targetUid,
        name: name,
        photoURL: photoURL || "",
        username: username || "",
      },
      "video"
    );
  };

  const handleConfirmMute = () => {
    let durationMs = 8 * 60 * 60 * 1000;
    if (muteDuration === "1w") durationMs = 7 * 24 * 60 * 60 * 1000;
    if (muteDuration === "forever") durationMs = null;
    muteChat(friendId, durationMs);
    setIsMuted(true);
    setMuteChatDialogOpen(false);
  };

  const formatGroupMembers = (group) => {
    if (group.memberNames && Array.isArray(group.memberNames) && group.memberNames.length > 0) {
      return group.memberNames.join(", ");
    }
    if (Array.isArray(group.members)) {
      const names = group.members
        .map((m) => {
          if (typeof m === "object" && m !== null) {
            return m.displayName || m.name || m.username;
          }
          if (typeof m === "string") {
            if (m === friendDetails?.uid || m === friendDetails?.id) {
              return friendDetails.name || friendDetails.displayName || "Friend";
            }
            const mutual = mutualFriends.find((mf) => mf.id === m || mf.uid === m);
            if (mutual) return mutual.name || mutual.displayName;
          }
          return null;
        })
        .filter(Boolean);
      if (names.length > 0) return names.join(", ");
      return `${group.members.length} members`;
    }
    return "Members in common";
  };

  const filteredMutualFriends = useMemo(() => {
    if (!mutualFriendsSearchQuery.trim()) return mutualFriends;
    const q = mutualFriendsSearchQuery.toLowerCase();
    return mutualFriends.filter((f) => {
      const mName = (f.name || f.displayName || "").toLowerCase();
      const mUser = (f.username || "").toLowerCase();
      return mName.includes(q) || mUser.includes(q);
    });
  }, [mutualFriends, mutualFriendsSearchQuery]);

  const filteredCommonGroups = useMemo(() => {
    if (!groupsTripsSearchQuery.trim()) return commonGroups;
    const q = groupsTripsSearchQuery.toLowerCase();
    return commonGroups.filter((g) => {
      const gName = (g.name || g.groupName || "").toLowerCase();
      return gName.includes(q);
    });
  }, [commonGroups, groupsTripsSearchQuery]);

  const filteredCommonTrips = useMemo(() => {
    if (!groupsTripsSearchQuery.trim()) return commonTrips;
    const q = groupsTripsSearchQuery.toLowerCase();
    return commonTrips.filter((t) => {
      const tName = (t.name || t.title || "").toLowerCase();
      const fromLoc = (t.from || t.location || "").toLowerCase();
      const toLoc = (t.to || t.location || "").toLowerCase();
      return tName.includes(q) || fromLoc.includes(q) || toLoc.includes(q);
    });
  }, [commonTrips, groupsTripsSearchQuery]);

  const handleDrawerClose = () => {
    if (activeSubView !== null) {
      setActiveSubView(null);
    } else {
      onClose();
    }
  };

  const internalDivider = (
    <Divider sx={{ borderColor: isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.05)", my: 0, mx: 3 }} />
  );

  const bounceTransition = {
    type: "spring",
    stiffness: 400,
    damping: 17,
  };

  return (
    <Drawer
      anchor={isDesktop ? "right" : "bottom"}
      open={open}
      onClose={handleDrawerClose}
      ModalProps={{ BackdropProps: { sx: drawerBackdropSx } }}
      SlideProps={{ timeout: { enter: 360, exit: 260 } }}
      PaperProps={{
        sx: {
          width: isDesktop ? 430 : "auto",
          maxWidth: isDesktop ? 430 : "auto",
          height: isDesktop ? "100vh" : "95vh",
          bgcolor: isDark ? "#0c0c0c" : "#f1f1f1",
          color: isDark ? "#ffffff" : "#111111",
          px: 2.5,
          pt: 2,
          pb: 4,
          boxShadow: 'none',
          border: "none",
          overflowY: "auto",
          scrollbarWidth: "none",
          "&::-webkit-scrollbar": { display: "none" },
        },
      }}
    >
      {/* ─── Profile-Derived Gradient Ambient Background Header ─── */}
      <Box
        sx={{
          position: "absolute",
          top: -35,
          left: 0,
          right: 0,
          height: 440,
          background: `radial-gradient(circle at 50% 0%, ${avatarColor} 0%, transparent 70%)`,
          opacity: isDark ? 0.9 : 0.45,
          pointerEvents: "none",
          zIndex: 0,
          filter: "blur(40px)",
        }}
      />

      <Box sx={{ position: "relative", zIndex: 1 }}>
        <AnimatePresence mode="wait">
          {/* ─── 1. FULL PAGE: Shared Media ─── */}
          {activeSubView === "sharedMedia" && (
            <motion.div
              key="subview-shared-media"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
              style={{ display: "flex", flexDirection: "column", minHeight: "100%" }}
            >
              <Box sx={{ display: "flex", alignItems: "center", mb: 2.5 }}>
                <Button
                  component={motion.button}
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.94 }}
                  transition={bounceTransition}
                  onClick={() => setActiveSubView(null)}
                  sx={{
                    color: isDark ? "#fff" : "#111",
                    bgcolor: isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.06)",
                    borderRadius: "999px",
                    px: 2,
                    py: 0.6,
                    textTransform: "none",
                    fontSize: "0.875rem",
                    fontWeight: 600,
                    boxShadow: "none",
                  }}
                >
                  <ArrowBackIcon sx={{ fontSize: 18 }} />
                </Button>
              </Box>

              <Typography sx={{ fontSize: "1.25rem", fontWeight: 700, color: isDark ? "#fff" : "#111", mb: 2, letterSpacing: "-0.3px" }}>
                Shared Media & Files
              </Typography>

              <TextField
                fullWidth
                size="small"
                placeholder="Search shared media..."
                value={mediaSearchQuery}
                onChange={(e) => setMediaSearchQuery(e.target.value)}
                sx={{
                  mb: 2,
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "14px",
                    bgcolor: isDark ? "#161618" : "#fff",
                    color: isDark ? "#fff" : "#111",
                    "& fieldset": { border: "none" },
                    "&.Mui-focused fieldset": { border: "none" },
                  },
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)", fontSize: 20 }} />
                    </InputAdornment>
                  ),
                }}
              />

              <Box sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
                <SharedMediaLinksWidgetsTabs
                  messages={messages}
                  searchQuery={mediaSearchQuery}
                  onOpenImage={onOpenImage}
                  onJumpToMessage={onJumpToMessage}
                  isDark={isDark}
                />
              </Box>
            </motion.div>
          )}

          {/* ─── 2. FULL PAGE: Common Groups & Trips ─── */}
          {activeSubView === "commonGroupsTrips" && (
            <motion.div
              key="subview-groups-trips"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
            >
              <Box sx={{ display: "flex", alignItems: "center", mb: 2.5 }}>
                <Button
                  component={motion.button}
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.94 }}
                  transition={bounceTransition}
                  startIcon={<ArrowBackIcon sx={{ fontSize: 18 }} />}
                  onClick={() => setActiveSubView(null)}
                  sx={{
                    color: isDark ? "#fff" : "#111",
                    bgcolor: isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.06)",
                    borderRadius: "999px",
                    px: 2,
                    py: 0.6,
                    textTransform: "none",
                    fontSize: "0.875rem",
                    fontWeight: 600,
                    boxShadow: "none",
                  }}
                >
                  Back to Profile
                </Button>
              </Box>

              <Typography sx={{ fontSize: "1.25rem", fontWeight: 700, color: isDark ? "#fff" : "#111", mb: 2, letterSpacing: "-0.3px" }}>
                Shared Spaces
              </Typography>

              <Tabs
                value={groupsTripsTab}
                onChange={(e, val) => setGroupsTripsTab(val)}
                variant="fullWidth"
                sx={{
                  mb: 2,
                  minHeight: 40,
                  bgcolor: isDark ? "#161618" : "#eaeaea",
                  borderRadius: "14px",
                  p: 0.5,
                  "& .MuiTabs-indicator": { display: "none" },
                }}
              >
                <Tab
                  value="groups"
                  label={`Common Groups (${commonGroups.length})`}
                  sx={{
                    minHeight: 36,
                    borderRadius: "12px",
                    textTransform: "none",
                    fontWeight: 600,
                    fontSize: "0.85rem",
                    color: isDark ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.6)",
                    "&.Mui-selected": {
                      bgcolor: isDark ? "#28282d" : "#ffffff",
                      color: isDark ? "#fff" : "#111",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                    },
                  }}
                />
                <Tab
                  value="trips"
                  label={`Common Trips (${commonTrips.length})`}
                  sx={{
                    minHeight: 36,
                    borderRadius: "12px",
                    textTransform: "none",
                    fontWeight: 600,
                    fontSize: "0.85rem",
                    color: isDark ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.6)",
                    "&.Mui-selected": {
                      bgcolor: isDark ? "#28282d" : "#ffffff",
                      color: isDark ? "#fff" : "#111",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                    },
                  }}
                />
              </Tabs>

              <TextField
                fullWidth
                size="small"
                placeholder={groupsTripsTab === "groups" ? "Search common groups..." : "Search common trips..."}
                value={groupsTripsSearchQuery}
                onChange={(e) => setGroupsTripsSearchQuery(e.target.value)}
                sx={{
                  mb: 2,
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "14px",
                    bgcolor: isDark ? "#161618" : "#fff",
                    color: isDark ? "#fff" : "#111",
                    "& fieldset": { border: "none" },
                    "&.Mui-focused fieldset": { border: "none" },
                  },
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)", fontSize: 20 }} />
                    </InputAdornment>
                  ),
                }}
              />

              {groupsTripsTab === "groups" ? (
                <Box
                  sx={{
                    bgcolor: isDark ? "#161618" : "#ffffff",
                    borderRadius: "16px",
                    overflow: "hidden",
                  }}
                >
                  {filteredCommonGroups.length === 0 ? (
                    <Box sx={{ p: 3, textAlign: "center" }}>
                      <Typography sx={{ color: isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)" }}>No common groups found</Typography>
                    </Box>
                  ) : (
                    filteredCommonGroups.map((group, idx) => {
                      const groupName = group.name || group.groupName || "Group";
                      const groupPhoto = safeImageUrl(group.iconURL || group.photoURL || group.image);
                      const membersSubtitle = formatGroupMembers(group);

                      return (
                        <React.Fragment key={group.id || groupName}>
                          <Box
                            component={motion.div}
                            whileHover={{ scale: 1.01, bgcolor: isDark ? "rgba(255, 255, 255, 0.03)" : "rgba(0, 0, 0, 0.02)" }}
                            whileTap={{ scale: 0.98 }}
                            transition={bounceTransition}
                            onClick={() => navigate(`/group/${encodeURIComponent(groupName)}`)}
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1.6,
                              p: 1.6,
                              cursor: "pointer",
                            }}
                          >
                            <Avatar
                              src={groupPhoto}
                              alt={groupName}
                              sx={{ width: 44, height: 44, bgcolor: isDark ? "#28282b" : "#e2e2e6", color: isDark ? "#fff" : "#222" }}
                            >
                              {group.emoji || groupName[0]?.toUpperCase() || "G"}
                            </Avatar>
                            <Box sx={{ minWidth: 0, flex: 1 }}>
                              <Typography sx={{ color: isDark ? "#fff" : "#111", fontWeight: 700, fontSize: "0.96rem", mb: 0.3 }} noWrap>
                                {groupName}
                              </Typography>
                              <Typography sx={{ color: isDark ? "rgba(255, 255, 255, 0.52)" : "rgba(0, 0, 0, 0.52)", fontSize: "0.82rem" }} noWrap>
                                {membersSubtitle}
                              </Typography>
                            </Box>
                          </Box>
                          {idx < filteredCommonGroups.length - 1 && internalDivider}
                        </React.Fragment>
                      );
                    })
                  )}
                </Box>
              ) : (
                <Box
                  sx={{
                    bgcolor: isDark ? "#161618" : "#ffffff",
                    borderRadius: "16px",
                    overflow: "hidden",
                  }}
                >
                  {filteredCommonTrips.length === 0 ? (
                    <Box sx={{ p: 3, textAlign: "center" }}>
                      <Typography sx={{ color: isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)" }}>No common trips found</Typography>
                    </Box>
                  ) : (
                    filteredCommonTrips.map((trip, idx) => {
                      const tripName = trip.name || trip.title || "Trip";
                      const fromLoc = trip.from || trip.location || "Trip";
                      const toLoc = trip.to || trip.location || "Trip";
                      const route = `${fromLoc} → ${toLoc}`;
                      const dates = trip.startDate && trip.endDate ? `${trip.startDate} → ${trip.endDate}` : trip.startDate || trip.date || "Upcoming";

                      return (
                        <React.Fragment key={trip.id || tripName}>
                          <Box
                            component={motion.div}
                            whileHover={{ scale: 1.01, bgcolor: isDark ? "rgba(255, 255, 255, 0.03)" : "rgba(0, 0, 0, 0.02)" }}
                            whileTap={{ scale: 0.98 }}
                            transition={bounceTransition}
                            onClick={() => navigate(`/trips`)}
                            sx={{ p: 2, cursor: "pointer" }}
                          >
                            <Typography sx={{ color: isDark ? "#fff" : "#111", fontWeight: 700, fontSize: "1.1rem", mb: 1 }}>
                              {tripName}
                            </Typography>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.6 }}>
                              <PlaceIcon sx={{ fontSize: 16, color: isDark ? "rgba(255,255,255,0.6)" : "rgba(0, 0, 0, 0.6)" }} />
                              <Typography sx={{ color: isDark ? "rgba(255,255,255,0.65)" : "rgba(0, 0, 0, 0.65)", fontSize: "0.88rem" }}>{route}</Typography>
                            </Box>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                              <AccessTimeIcon sx={{ fontSize: 16, color: isDark ? "rgba(255,255,255,0.6)" : "rgba(0, 0, 0, 0.6)" }} />
                              <Typography sx={{ color: isDark ? "rgba(255,255,255,0.65)" : "rgba(0, 0, 0, 0.65)", fontSize: "0.88rem" }}>{dates}</Typography>
                            </Box>
                          </Box>
                          {idx < filteredCommonTrips.length - 1 && internalDivider}
                        </React.Fragment>
                      );
                    })
                  )}
                </Box>
              )}
            </motion.div>
          )}

          {/* ─── 3. FULL PAGE: Mutual Friends ─── */}
          {activeSubView === "mutualFriends" && (
            <motion.div
              key="subview-mutual-friends"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
            >
              <Box sx={{ display: "flex", alignItems: "center", mb: 2.5 }}>
                <Button
                  component={motion.button}
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.94 }}
                  transition={bounceTransition}
                  startIcon={<ArrowBackIcon sx={{ fontSize: 18 }} />}
                  onClick={() => setActiveSubView(null)}
                  sx={{
                    color: isDark ? "#fff" : "#111",
                    bgcolor: isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.06)",
                    borderRadius: "999px",
                    px: 2,
                    py: 0.6,
                    textTransform: "none",
                    fontSize: "0.875rem",
                    fontWeight: 600,
                    boxShadow: "none",
                  }}
                >
                  Back to Profile
                </Button>
              </Box>

              <Typography sx={{ fontSize: "1.25rem", fontWeight: 700, color: isDark ? "#fff" : "#111", mb: 2, letterSpacing: "-0.3px" }}>
                Mutual Friends ({mutualFriends.length})
              </Typography>

              <TextField
                fullWidth
                size="small"
                placeholder="Search mutual friends..."
                value={mutualFriendsSearchQuery}
                onChange={(e) => setMutualFriendsSearchQuery(e.target.value)}
                sx={{
                  mb: 2,
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "14px",
                    bgcolor: isDark ? "#161618" : "#fff",
                    color: isDark ? "#fff" : "#111",
                    "& fieldset": { border: "none" },
                    "&.Mui-focused fieldset": { border: "none" },
                  },
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)", fontSize: 20 }} />
                    </InputAdornment>
                  ),
                }}
              />

              <Box
                sx={{
                  bgcolor: isDark ? "#161618" : "#ffffff",
                  borderRadius: "16px",
                  overflow: "hidden",
                }}
              >
                {filteredMutualFriends.length === 0 ? (
                  <Box sx={{ p: 3, textAlign: "center" }}>
                    <Typography sx={{ color: isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)" }}>No mutual friends found</Typography>
                  </Box>
                ) : (
                  filteredMutualFriends.map((friend, idx) => {
                    const mName = friend.name || friend.displayName || "Friend";
                    const mUsername = friend.username;
                    const mPhoto = safeImageUrl(friend.photoURL);

                    return (
                      <React.Fragment key={friend.id || friend.uid || mName}>
                        <Box
                          component={motion.div}
                          whileHover={{ scale: 1.01, bgcolor: isDark ? "rgba(255, 255, 255, 0.03)" : "rgba(0, 0, 0, 0.02)" }}
                          whileTap={{ scale: 0.98 }}
                          transition={bounceTransition}
                          onClick={() => {
                            const userParam = mUsername ? `@${mUsername.replace(/^@/, "")}` : (friend.id ? `@${friend.id}` : "");
                            if (userParam) navigate(`/profile/${userParam}`);
                          }}
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1.6,
                            p: 1.6,
                            cursor: "pointer",
                          }}
                        >
                          <Avatar src={mPhoto} alt={mName} sx={{ width: 44, height: 44, bgcolor: isDark ? "#28282b" : "#e2e2e6", color: isDark ? "#fff" : "#222" }}>
                            {mName[0]?.toUpperCase() || "M"}
                          </Avatar>
                          <Box sx={{ minWidth: 0, flex: 1 }}>
                            <Typography sx={{ color: isDark ? "#fff" : "#111", fontWeight: 700, fontSize: "0.96rem", mb: 0.3 }} noWrap>
                              {mName}
                            </Typography>
                            {mUsername && (
                              <Typography sx={{ color: isDark ? "rgba(255, 255, 255, 0.52)" : "rgba(0, 0, 0, 0.52)", fontSize: "0.82rem" }} noWrap>
                                @{mUsername}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                        {idx < filteredMutualFriends.length - 1 && internalDivider}
                      </React.Fragment>
                    );
                  })
                )}
              </Box>
            </motion.div>
          )}

          {/* ─── MAIN PROFILE DRAWER VIEW ─── */}
          {activeSubView === null && (
            <motion.div
              key="profile-main"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            >
              {/* Top Back Button */}
              <Box sx={{ display: "flex", alignItems: "center", mt: 2 }}>
                <IconButton
                  component={motion.button}
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.94 }}
                  transition={bounceTransition}
                  onClick={onClose}
                  sx={{
                    color: isDark ? "#fff" : "#111",
                    bgcolor: isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.06)",
                    borderRadius: "999px",
                    p: 1,
                    width: 38,
                    height: 38,
                    textTransform: "none",
                    fontSize: "0.875rem",
                    fontWeight: 600,
                    boxShadow: "none",
                    "&:hover": {
                      bgcolor: isDark ? "rgba(255, 255, 255, 0.14)" : "rgba(0, 0, 0, 0.1)",
                      boxShadow: "none",
                    },
                  }}
                >
                  <ArrowBackIcon sx={{ fontSize: 21 }} />
                </IconButton>
              </Box>

              {/* Hero Profile */}
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  textAlign: "center",
                  mt: 1,
                  mb: 3,
                }}
              >
                <Avatar
                  src={photoURL}
                  alt={name}
                  sx={{
                    width: 104,
                    height: 104,
                    mb: 1.5,
                    boxShadow: "none",
                    bgcolor: isDark ? "#232326" : "#e0e0e0",
                    color: isDark ? "#ffffff" : "#111111",
                    fontSize: "2.4rem",
                    fontWeight: 700,
                  }}
                >
                  {name?.[0] || "?"}
                </Avatar>

                <Typography
                  sx={{
                    fontWeight: 700,
                    color: isDark ? "#ffffff" : "#111111",
                    letterSpacing: "-0.4px",
                    fontSize: "1.35rem",
                    lineHeight: 1.25,
                    mb: 0.3,
                  }}
                >
                  {name}
                </Typography>

                {username && (
                  <Typography
                    sx={{
                      color: isDark ? "rgba(255, 255, 255, 0.55)" : "rgba(0, 0, 0, 0.55)",
                      fontSize: "0.9rem",
                      mb: 1,
                    }}
                  >
                    @{username}
                  </Typography>
                )}

                <Box
                  sx={{
                    display: "inline-flex",
                    alignItems: "center",
                    px: 1.8,
                    py: 0.5,
                    borderRadius: "999px",
                    bgcolor: isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.06)",
                    color: isDark ? "rgba(255, 255, 255, 0.85)" : "rgba(0, 0, 0, 0.85)",
                    fontSize: "0.82rem",
                    fontWeight: 500,
                  }}
                >
                  {nickname || name}
                </Box>
              </Box>

              {/* 4x1 Grid Options */}
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "repeat(4, 1fr)",
                  gap: 1,
                  mb: 3.5,
                }}
              >
                {[
                  { label: "Search", icon: <SearchIcon sx={{ color: isDark ? "#c1c1c1" : "#242424", fontSize: 22, mb: 0.5 }} />, onClick: () => { if (onOpenSearch) onOpenSearch(); onClose(); } },
                  { label: "Call", icon: <PhoneOutlinedIcon sx={{ color: isDark ? "#c1c1c1" : "#242424", fontSize: 22, mb: 0.5 }} />, onClick: handleStartAudioCall },
                  { label: "Video", icon: <VideocamOutlinedIcon sx={{ color: isDark ? "#c1c1c1" : "#242424", fontSize: 22, mb: 0.5 }} />, onClick: handleStartVideoCall },
                  { label: "Profile", icon: <PersonOutlineIcon sx={{ color: isDark ? "#c1c1c1" : "#242424", fontSize: 22, mb: 0.5 }} />, onClick: () => { const userParam = username ? `@${username.replace(/^@/, "")}` : (friendId ? `@${friendId}` : ""); if (userParam) navigate(`/profile/${userParam}`); } },
                ].map((item, idx) => (
                  <Box
                    key={idx}
                    component={motion.div}
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.94 }}
                    transition={bounceTransition}
                    onClick={item.onClick}
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      bgcolor: isDark ? "#181818a9" : "#ffffffc6",
                      borderRadius: 5,
                      py: 1.5,
                      px: 0.5,
                      cursor: "pointer",
                      boxShadow: 'inset 0 1px 1px rgba(255, 255, 255, 0.08), inset 0 -1px 1px rgba(0,0,0,0.1)',
                    }}
                  >
                    {item.icon}
                    <Typography sx={{ color: isDark ? "#c1c1c1" : "#242424", fontSize: "0.75rem", fontWeight: 600 }}>{item.label}</Typography>
                  </Box>
                ))}
              </Box>

              {/* ─── Shared in Chat Section ─── */}
              <Box sx={{ mb: 3.5 }}>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1, px: 1 }}>
                  <Typography
                    sx={{
                      fontSize: "0.9rem",
                      fontWeight: 600,
                      color: isDark ? "#c0c0c0" : "#3e3e3e",
                      letterSpacing: "-0.2px",
                    }}
                  >
                    Shared in Chat
                  </Typography>
                  <Button
                    component={motion.button}
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.94 }}
                    transition={bounceTransition}
                    onClick={() => setActiveSubView("sharedMedia")}
                    endIcon={<ChevronRightIcon sx={{ fontSize: 18 }} />}
                    sx={{
                      color: isDark ? "#c0c0c0" : "#3e3e3e",
                      textTransform: "none",
                      bgcolor: "transparent",
                      fontWeight: 600,
                      fontSize: "0.85rem",
                      p: 0,
                      minWidth: "auto",
                      "&:hover": { bgcolor: "transparent", opacity: 0.8 },
                    }}
                  >
                    View All ({sharedMedia.length})
                  </Button>
                </Box>

                <Box
                  sx={{
                    bgcolor: "transparent",
                    p: 0.5
                  }}
                >
                  {sharedMedia.length === 0 ? (
                    <Box sx={{ p: 2, textAlign: "center", opacity: 0.55 }}>
                      <Typography variant="caption">No photos or media shared yet</Typography>
                    </Box>
                  ) : (
                    <Box
                      sx={{
                        display: "grid",
                        gridTemplateColumns: "repeat(3, 1fr)",
                        gap: 1,
                      }}
                    >
                      {sharedMedia.slice(0, 5).map((m, idx) => (
                        <ButtonBase
                          key={idx}
                          component={motion.button}
                          whileHover={{ scale: 1.04 }}
                          whileTap={{ scale: 0.94 }}
                          transition={bounceTransition}
                          onClick={() => onOpenImage && onOpenImage(m.url, sharedMedia.map((sm) => sm.url))}
                          sx={{
                            width: "100%",
                            paddingTop: "100%",
                            position: "relative",
                            borderRadius: 4,
                            overflow: "hidden",
                            bgcolor: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
                          }}
                        >
                          <Box
                            component="img"
                            src={m.url}
                            alt="media"
                            loading="lazy"
                            sx={{
                              position: "absolute",
                              top: 0,
                              left: 0,
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                            }}
                          />
                        </ButtonBase>
                      ))}

                      {sharedMedia.length > 5 ? (
                        <ButtonBase
                          component={motion.button}
                          whileHover={{ scale: 1.04 }}
                          whileTap={{ scale: 0.94 }}
                          transition={bounceTransition}
                          onClick={() => setActiveSubView("sharedMedia")}
                          sx={{
                            width: "100%",
                            position: "relative",
                            borderRadius: 4,
                            overflow: "hidden",
                            bgcolor: isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.08)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Typography
                            sx={{
                              position: "absolute",
                              fontWeight: 700,
                              fontSize: "0.95rem",
                              color: isDark ? "#c4c4c4" : "#313131",
                            }}
                          >
                            +{sharedMedia.length - 5} more
                          </Typography>
                        </ButtonBase>
                      ) : sharedMedia.length === 5 ? (
                        <ButtonBase
                          component={motion.button}
                          whileHover={{ scale: 1.04 }}
                          whileTap={{ scale: 0.94 }}
                          transition={bounceTransition}
                          onClick={() => onOpenImage && onOpenImage(sharedMedia[4].url, sharedMedia.map((sm) => sm.url))}
                          sx={{
                            width: "100%",
                            paddingTop: "100%",
                            position: "relative",
                            borderRadius: 4,
                            overflow: "hidden",
                            bgcolor: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
                          }}
                        >
                          <Box
                            component="img"
                            src={sharedMedia[4].url}
                            alt="media"
                            loading="lazy"
                            sx={{
                              position: "absolute",
                              top: 0,
                              left: 0,
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                            }}
                          />
                        </ButtonBase>
                      ) : null}
                    </Box>
                  )}
                </Box>
              </Box>

              {/* ─── Unified Combined Options Section with Smooth Accordion ─── */}
              <Box
                sx={{
                  bgcolor: isDark ? "#f1f1f106" : "#0c0c0c05",
                  borderRadius: 6,
                  overflow: "hidden",
                  mb: 3.5,
                  py: 0.5
                }}
              >
                {/* Contact Info */}
                <Box
                  component={motion.div}
                  whileHover={{ scale: 1.01, bgcolor: isDark ? "rgba(255, 255, 255, 0.03)" : "rgba(0, 0, 0, 0.02)" }}
                  whileTap={{ scale: 0.98 }}
                  transition={bounceTransition}
                  onClick={() => {
                    if (phone) window.open(`tel:${phone}`, "_self");
                  }}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    px: 2,
                    py: 1.4,
                    cursor: phone ? "pointer" : "default",
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <PhoneOutlinedIcon sx={{ color: isDark ? "rgba(255, 255, 255, 0.8)" : "rgba(0, 0, 0, 0.7)", fontSize: 20, mr: 2 }} />
                    <Box>
                      <Typography sx={{ color: isDark ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.5)", fontSize: "0.72rem", fontWeight: 600 }}>
                        Contact Info
                      </Typography>
                      <Typography sx={{ color: isDark ? "#fff" : "#111", fontSize: "0.92rem", fontWeight: 500 }}>
                        {phone || "No phone added"}
                      </Typography>
                    </Box>
                  </Box>
                </Box>

                {internalDivider}

                {/* Accordion Nickname Row with Smooth Expansion and NO background/hover/tap effect */}
                <Accordion
                  expanded={isEditingNickname}
                  onChange={(e, expanded) => setIsEditingNickname(expanded)}
                  disableGutters
                  elevation={0}
                  sx={{
                    bgcolor: "transparent",
                    color: isDark ? "#fff" : "#111",
                    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                    "&:before": { display: "none" },
                    boxShadow: "none",
                  }}
                >
                  <AccordionSummary
                    sx={{
                      px: 2,
                      py: 0,
                      minHeight: "auto",
                      backgroundColor: "transparent !important",
                      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                      "&.Mui-expanded": { minHeight: "auto" },
                      "& .MuiAccordionSummary-content": { my: 1.4, alignItems: "center", justifyContent: "space-between", "&.Mui-expanded": { my: 1.4 } },
                      "&:hover": { bgcolor: "transparent" },
                      "&:active": { bgcolor: "transparent" },
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <TextFieldsIcon sx={{ color: isDark ? "rgba(255, 255, 255, 0.8)" : "rgba(0, 0, 0, 0.7)", fontSize: 21, mr: 2 }} />
                      <Typography sx={{ color: isDark ? "#fff" : "#111", fontSize: "0.95rem", fontWeight: 500 }}>
                        {nickname ? "Edit Nickname" : "Add a Nickname"}
                      </Typography>
                    </Box>
                    <Typography sx={{ fontSize: "0.82rem", fontWeight: 600, opacity: 0.6 }}>
                      {nickname || "Add"}
                    </Typography>
                  </AccordionSummary>

                  <AccordionDetails sx={{ px: 2, pb: 2, pt: 0, bgcolor: "transparent", transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)" }}>
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.2 }}>
                      <TextField
                        fullWidth
                        size="small"
                        placeholder="Enter nickname..."
                        value={nicknameInput}
                        onChange={(e) => setNicknameInput(e.target.value)}
                        autoFocus
                        sx={{
                          "& .MuiOutlinedInput-root": {
                            borderRadius: 8,
                            bgcolor: isDark ? "#222222" : "#d4d4d4",
                            color: isDark ? "#fff" : "#111",
                            "& fieldset": { border: "none" },
                            "&.Mui-focused fieldset": { border: "none" },
                          },
                        }}
                      />
                      <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1 }}>
                        <Button
                          component={motion.button}
                          whileHover={{ scale: 1.04 }}
                          whileTap={{ scale: 0.94 }}
                          transition={bounceTransition}
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            setNicknameInput(nickname || "");
                            setIsEditingNickname(false);
                          }}
                          sx={{
                            color: isDark ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.6)",
                            textTransform: "none",
                            fontSize: "0.82rem",
                            fontWeight: 600,
                            bgcolor: "transparent",
                          }}
                        >
                          Cancel
                        </Button>
                        <Button
                          component={motion.button}
                          whileHover={{ scale: 1.04 }}
                          whileTap={{ scale: 0.94 }}
                          transition={bounceTransition}
                          size="small"
                          variant="contained"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onSaveNickname) onSaveNickname(nicknameInput);
                            setIsEditingNickname(false);
                          }}
                          sx={{
                            bgcolor: isDark ? "#fff" : "#111",
                            color: isDark ? "#000" : "#fff",
                            textTransform: "none",
                            fontWeight: 600,
                            fontSize: "0.82rem",
                            borderRadius: 8,
                            boxShadow: "none",
                            "&:hover": { bgcolor: isDark ? "#e0e0e0" : "#333", boxShadow: "none" },
                          }}
                        >
                          {nickname ? "Save" : "Add"}
                        </Button>
                      </Box>
                    </Box>
                  </AccordionDetails>
                </Accordion>

                {internalDivider}

                {/* Add to Favorites */}
                <Box
                  component={motion.div}
                  whileHover={{ scale: 1.01, bgcolor: isDark ? "rgba(255, 255, 255, 0.03)" : "rgba(0, 0, 0, 0.02)" }}
                  whileTap={{ scale: 0.98 }}
                  transition={bounceTransition}
                  onClick={() => {
                    const res = toggleFavoriteChat(friendId);
                    setIsFavorite(res);
                  }}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    px: 2,
                    py: 1.4,
                    cursor: "pointer",
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    {isFavorite ? (
                      <StarRoundedIcon sx={{ color: "#ffb300", fontSize: 22, mr: 2 }} />
                    ) : (
                      <StarBorderRoundedIcon sx={{ color: isDark ? "rgba(255, 255, 255, 0.7)" : "rgba(0,0,0,0.6)", fontSize: 22, mr: 2 }} />
                    )}
                    <Typography sx={{ color: isDark ? "#fff" : "#111", fontSize: "0.95rem", fontWeight: 500 }}>
                      Add to Favorites
                    </Typography>
                  </Box>
                  <Chip
                    label={isFavorite ? "Favorited" : "Off"}
                    size="small"
                    sx={{
                      bgcolor: isFavorite ? "rgba(255, 179, 0, 0.15)" : isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)",
                      color: isFavorite ? "#ffb300" : isDark ? "rgba(255,255,255,0.6)" : "#777",
                      fontWeight: 600,
                      fontSize: "0.75rem",
                    }}
                  />
                </Box>

                {internalDivider}

                {/* Mute Notifications */}
                <Box
                  component={motion.div}
                  whileHover={{ scale: 1.01, bgcolor: isDark ? "rgba(255, 255, 255, 0.03)" : "rgba(0, 0, 0, 0.02)" }}
                  whileTap={{ scale: 0.98 }}
                  transition={bounceTransition}
                  onClick={() => setMuteChatDialogOpen(true)}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    px: 2,
                    py: 1.4,
                    cursor: "pointer",
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    {isMuted ? (
                      <NotificationsOffOutlinedIcon sx={{ color: "#ef4444", fontSize: 21, mr: 2 }} />
                    ) : (
                      <NotificationsActiveOutlinedIcon sx={{ color: isDark ? "rgba(255, 255, 255, 0.7)" : "rgba(0,0,0,0.6)", fontSize: 21, mr: 2 }} />
                    )}
                    <Typography sx={{ color: isDark ? "#fff" : "#111", fontSize: "0.95rem", fontWeight: 500 }}>
                      Mute Notifications
                    </Typography>
                  </Box>
                  <Chip
                    label={isMuted ? "Muted" : "Unmuted"}
                    size="small"
                    sx={{
                      bgcolor: isMuted ? "rgba(239, 68, 68, 0.15)" : isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)",
                      color: isMuted ? "#ef4444" : isDark ? "rgba(255,255,255,0.6)" : "#777",
                      fontWeight: 600,
                      fontSize: "0.75rem",
                    }}
                  />
                </Box>

                {internalDivider}

                {/* Disappearing Messages */}
                <Box
                  component={motion.div}
                  whileHover={{ scale: 1.01, bgcolor: isDark ? "rgba(255, 255, 255, 0.03)" : "rgba(0, 0, 0, 0.02)" }}
                  whileTap={{ scale: 0.98 }}
                  transition={bounceTransition}
                  onClick={() => setDisappearingDialogOpen(true)}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    px: 2,
                    py: 1.4,
                    cursor: "pointer",
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <TimelapseRoundedIcon sx={{ color: isDark ? "rgba(255,255,255,0.8)" : "rgba(0,0,0,0.7)", fontSize: 21, mr: 2 }} />
                    <Typography sx={{ color: isDark ? "#fff" : "#111", fontSize: "0.95rem", fontWeight: 500 }}>
                      Disappearing Messages
                    </Typography>
                  </Box>
                  <Chip
                    label={
                      disappearingDuration === 24 * 60 * 60 * 1000
                        ? "24h"
                        : disappearingDuration === 7 * 24 * 60 * 60 * 1000
                        ? "7d"
                        : disappearingDuration === 90 * 24 * 60 * 60 * 1000
                        ? "90d"
                        : "Off"
                    }
                    size="small"
                    sx={{
                      bgcolor: disappearingDuration > 0 ? (isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.1)") : isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)",
                      color: disappearingDuration > 0 ? (isDark ? "#fff" : "#111") : isDark ? "rgba(255,255,255,0.6)" : "#777",
                      fontWeight: 600,
                      fontSize: "0.75rem",
                    }}
                  />
                </Box>

                {internalDivider}

                {/* Mutual Friends */}
                <Box
                  component={motion.div}
                  whileHover={{ scale: 1.01, bgcolor: isDark ? "rgba(255, 255, 255, 0.03)" : "rgba(0, 0, 0, 0.02)" }}
                  whileTap={{ scale: 0.98 }}
                  transition={bounceTransition}
                  onClick={() => setActiveSubView("mutualFriends")}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    px: 2,
                    py: 1.4,
                    cursor: "pointer",
                  }}
                >
                  <Typography sx={{ color: isDark ? "#fff" : "#111", fontSize: "0.95rem", fontWeight: 500 }}>
                    {mutualFriends.length} Mutual Friends
                  </Typography>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    {mutualFriends.length > 0 && (
                      <Avatar
                        src={safeImageUrl(mutualFriends[0]?.photoURL)}
                        alt={mutualFriends[0]?.name || "Mutual Friend"}
                        sx={{
                          width: 28,
                          height: 28,
                          border: `1.5px solid ${isDark ? "rgba(255, 255, 255, 0.2)" : "rgba(0, 0, 0, 0.15)"}`,
                          fontSize: "0.75rem",
                          fontWeight: 600,
                        }}
                      >
                        {mutualFriends[0]?.name?.[0] || "M"}
                      </Avatar>
                    )}
                    <ChevronRightIcon sx={{ color: isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)", fontSize: 20 }} />
                  </Box>
                </Box>
              </Box>

              {/* ─── Common Groups Section ─── */}
              <Box sx={{ mb: 3.5 }}>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1.5, px: 1 }}>
                  <Typography sx={{ fontSize: "1.05rem", fontWeight: 600, color: isDark ? "#c0c0c0" : "#3e3e3e", letterSpacing: "-0.2px" }}>
                    Common Groups
                  </Typography>
                </Box>

                <Box
                  sx={{
                    bgcolor: isDark ? "#f1f1f106" : "#0c0c0c05",
                    borderRadius: 6,
                    overflow: "hidden",
                  }}
                >
                  {commonGroups.length === 0 ? (
                    <Box sx={{ p: 2.5, textAlign: "center" }}>
                      <Typography sx={{ color: isDark ? "rgba(255, 255, 255, 0.4)" : "rgba(0, 0, 0, 0.4)", fontSize: "0.88rem" }}>
                        No common groups
                      </Typography>
                    </Box>
                  ) : (
                    <>
                      {commonGroups.slice(0, 3).map((group, idx) => {
                        const groupName = group.name || group.groupName || "Group";
                        const groupPhoto = safeImageUrl(group.iconURL || group.photoURL || group.image);
                        const membersSubtitle = formatGroupMembers(group);

                        return (
                          <React.Fragment key={group.id || groupName}>
                            <Box
                              component={motion.div}
                              whileHover={{ scale: 1.01, bgcolor: isDark ? "rgba(255, 255, 255, 0.03)" : "rgba(0, 0, 0, 0.02)" }}
                              whileTap={{ scale: 0.98 }}
                              transition={bounceTransition}
                              onClick={() => navigate(`/group/${encodeURIComponent(groupName)}`)}
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1.6,
                                p: 1.6,
                                cursor: "pointer",
                              }}
                            >
                              <Avatar
                                src={groupPhoto}
                                alt={groupName}
                                sx={{ width: 44, height: 44, bgcolor: isDark ? "#28282b" : "#e2e2e6", color: isDark ? "#fff" : "#222" }}
                              >
                                {group.emoji || groupName[0]?.toUpperCase() || "G"}
                              </Avatar>
                              <Box sx={{ minWidth: 0, flex: 1 }}>
                                <Typography sx={{ color: isDark ? "#fff" : "#111", fontWeight: 700, fontSize: "0.96rem", mb: 0.3 }} noWrap>
                                  {groupName}
                                </Typography>
                                <Typography sx={{ color: isDark ? "rgba(255, 255, 255, 0.52)" : "rgba(0, 0, 0, 0.52)", fontSize: "0.82rem" }} noWrap>
                                  {membersSubtitle}
                                </Typography>
                              </Box>
                            </Box>
                            {(idx < Math.min(commonGroups.length, 3) - 1 || commonGroups.length > 3) && internalDivider}
                          </React.Fragment>
                        );
                      })}

                      {commonGroups.length > 3 && (
                        <Box
                          component={motion.div}
                          whileHover={{ scale: 1.01, bgcolor: isDark ? "rgba(255, 255, 255, 0.03)" : "rgba(0, 0, 0, 0.02)" }}
                          whileTap={{ scale: 0.98 }}
                          transition={bounceTransition}
                          onClick={() => {
                            setGroupsTripsTab("groups");
                            setActiveSubView("commonGroupsTrips");
                          }}
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 1,
                            py: 1.5,
                            cursor: "pointer",
                          }}
                        >
                          <Typography sx={{ color: isDark ? "#c0c0c0" : "#3e3e3e", fontSize: "0.88rem", fontWeight: 600 }}>
                            +{commonGroups.length - 3} more groups
                          </Typography>
                        </Box>
                      )}
                    </>
                  )}
                </Box>
              </Box>

              {/* ─── Common Trips Section ─── */}
              <Box sx={{ mb: 3.5 }}>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1.5, px: 1 }}>
                  <Typography sx={{ fontSize: "1.05rem", fontWeight: 700, color: isDark ? "#c0c0c0" : "#3e3e3e", letterSpacing: "-0.2px" }}>
                    Common Trips
                  </Typography>
                </Box>

                <Box
                  sx={{
                    bgcolor: isDark ? "#f1f1f106" : "#0c0c0c05",
                    borderRadius: 6,
                    overflow: "hidden",
                  }}
                >
                  {commonTrips.length === 0 ? (
                    <Box sx={{ p: 2.5, textAlign: "center" }}>
                      <Typography sx={{ color: isDark ? "rgba(255, 255, 255, 0.4)" : "rgba(0, 0, 0, 0.4)", fontSize: "0.88rem" }}>
                        No common trips
                      </Typography>
                    </Box>
                  ) : (
                    <>
                      {commonTrips.slice(0, 1).map((trip) => {
                        const tripName = trip.name || trip.title || "Trip";
                        const fromLoc = trip.from || trip.location || "Trip";
                        const toLoc = trip.to || trip.location || "Trip";
                        const route = `${fromLoc} → ${toLoc}`;
                        const dates = trip.startDate && trip.endDate ? `${trip.startDate} → ${trip.endDate}` : trip.startDate || trip.date || "Upcoming";

                        return (
                          <Box
                            key={trip.id || tripName}
                            component={motion.div}
                            whileHover={{ scale: 1.01, bgcolor: isDark ? "rgba(255, 255, 255, 0.03)" : "rgba(0, 0, 0, 0.02)" }}
                            whileTap={{ scale: 0.98 }}
                            transition={bounceTransition}
                            onClick={() => navigate(`/trips`)}
                            sx={{ p: 2, cursor: "pointer" }}
                          >
                            <Typography sx={{ color: isDark ? "#fff" : "#111", fontWeight: 700, fontSize: "1.1rem", mb: 1 }}>
                              {tripName}
                            </Typography>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.6 }}>
                              <PlaceIcon sx={{ fontSize: 16, color: isDark ? "rgba(255,255,255,0.6)" : "rgba(0, 0, 0, 0.6)" }} />
                              <Typography sx={{ color: isDark ? "rgba(255,255,255,0.65)" : "rgba(0, 0, 0, 0.65)", fontSize: "0.88rem" }}>{route}</Typography>
                            </Box>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                              <AccessTimeIcon sx={{ fontSize: 16, color: isDark ? "rgba(255,255,255,0.6)" : "rgba(0, 0, 0, 0.6)" }} />
                              <Typography sx={{ color: isDark ? "rgba(255,255,255,0.65)" : "rgba(0, 0, 0, 0.65)", fontSize: "0.88rem" }}>{dates}</Typography>
                            </Box>
                          </Box>
                        );
                      })}

                      {commonTrips.length > 1 && (
                        <>
                          <Divider sx={{ borderColor: isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.05)", my: 0 }} />
                          <Box
                            component={motion.div}
                            whileHover={{ scale: 1.01, bgcolor: isDark ? "rgba(255, 255, 255, 0.03)" : "rgba(0, 0, 0, 0.02)" }}
                            whileTap={{ scale: 0.98 }}
                            transition={bounceTransition}
                            onClick={() => {
                              setGroupsTripsTab("trips");
                              setActiveSubView("commonGroupsTrips");
                            }}
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: 1,
                              py: 1.5,
                              cursor: "pointer",
                            }}
                          >
                            <Typography sx={{ color: isDark ? "#c0c0c0" : "#3e3e3e", fontSize: "0.88rem", fontWeight: 600 }}>
                              +{commonTrips.length - 1} more trips
                            </Typography>
                          </Box>
                        </>
                      )}
                    </>
                  )}
                </Box>
              </Box>

              {/* ─── Danger Actions Section ─── */}
              <Box
                sx={{
                  bgcolor: isDark ? "rgba(239, 68, 68, 0.08)" : "rgba(239, 68, 68, 0.05)",
                  borderRadius: 6,
                  overflow: "hidden",
                  mb: 1,
                  py: 0.5,
                }}
              >
                {/* Delete Chat */}
                <Box
                  component={motion.div}
                  whileHover={{ scale: 1.01, bgcolor: isDark ? "rgba(239, 68, 68, 0.14)" : "rgba(239, 68, 68, 0.09)" }}
                  whileTap={{ scale: 0.98 }}
                  transition={bounceTransition}
                  onClick={onDeleteChat || onClearChat}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    px: 2,
                    py: 1.5,
                    cursor: "pointer",
                  }}
                >
                  <DeleteOutlineIcon sx={{ color: "#ef4444", fontSize: 21, mr: 2 }} />
                  <Typography sx={{ color: "#ef4444", fontSize: "0.95rem", fontWeight: 600 }}>
                    Delete Chat
                  </Typography>
                </Box>

                <Divider sx={{ borderColor: "rgba(239, 68, 68, 0.15)", my: 0 }} />

                {/* Block Friend */}
                <Box
                  component={motion.div}
                  whileHover={{ scale: 1.01, bgcolor: isDark ? "rgba(239, 68, 68, 0.14)" : "rgba(239, 68, 68, 0.09)" }}
                  whileTap={{ scale: 0.98 }}
                  transition={bounceTransition}
                  onClick={onToggleBlock}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    px: 2,
                    py: 1.5,
                    cursor: "pointer",
                  }}
                >
                  <BlockIcon sx={{ color: "#ef4444", fontSize: 21, mr: 2 }} />
                  <Typography sx={{ color: "#ef4444", fontSize: "0.95rem", fontWeight: 600 }}>
                    {isBlocked ? "Unblock Friend" : "Block Friend"}
                  </Typography>
                </Box>

                <Divider sx={{ borderColor: "rgba(239, 68, 68, 0.15)", my: 0 }} />

                {/* Remove from Friend */}
                <Box
                  component={motion.div}
                  whileHover={{ scale: 1.01, bgcolor: isDark ? "rgba(239, 68, 68, 0.14)" : "rgba(239, 68, 68, 0.09)" }}
                  whileTap={{ scale: 0.98 }}
                  transition={bounceTransition}
                  onClick={onRemoveFriend}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    px: 2,
                    py: 1.5,
                    cursor: "pointer",
                  }}
                >
                  <RemoveCircleOutlineIcon sx={{ color: "#ef4444", fontSize: 21, mr: 2 }} />
                  <Typography sx={{ color: "#ef4444", fontSize: "0.95rem", fontWeight: 600 }}>
                    Remove from Friend
                  </Typography>
                </Box>
              </Box>
            </motion.div>
          )}
        </AnimatePresence>
      </Box>

      {/* ─── Mute Notifications Drawer ─── */}
      <SwipeableDrawer
        anchor="bottom"
        open={muteChatDialogOpen}
        onClose={() => setMuteChatDialogOpen(false)}
        onOpen={() => {}}
        disableSwipeToOpen={false}
        ModalProps={{
          BackdropProps: {
            sx: drawerBackdropSx,
          },
        }}
        PaperProps={{
          sx: {
            ...drawerPaperSx(mode, {
              maxHeight: "85vh",
            }),
            overflowY: "auto",
          },
        }}
      >
        <Box sx={{ display: { xs: "block", md: "none" } }}>
          <DrawerHandle mode={mode} />
        </Box>

        <Box
          sx={{
            maxWidth: 500,
            mx: 'auto',
            width: { xs: 'auto', md: '100%' },
            pt: { xs: 1, md: 2 },
            px: { xs: 1.5, md: 2 },
            pb: 1.5,
          }}
        >
          {/* Header */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              mb: 0.75,
            }}
          >
            <Typography
              variant="h6"
              sx={{
                fontWeight: 800,
                fontSize: { xs: "1.1rem", md: "1.2rem" },
                letterSpacing: "-0.4px",
              }}
            >
              Mute Notifications
            </Typography>

            <IconButton
              component={motion.button}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              transition={bounceTransition}
              onClick={() => setMuteChatDialogOpen(false)}
              size="small"
              aria-label="Close mute notifications"
              sx={{
                display: { xs: "none", md: "inline-flex" },
                width: 34,
                height: 34,
                borderRadius: 8,
                color: "text.secondary",
                bgcolor:
                  mode === "dark"
                    ? "rgba(255,255,255,0.06)"
                    : "rgba(0,0,0,0.04)",
                border: "0px solid",
                boxShadow: mode === "dark" ? 'inset 0 1px 1px rgba(255, 255, 255, 0.11), inset 0 -1px 1px rgba(0,0,0,0.4)' : 'inset 0 1px 1px rgba(255, 255, 255, 0.71), inset 0 -1px 1px rgba(0,0,0,0.1)',
                "&:hover": {
                  bgcolor:
                    mode === "dark"
                      ? "rgba(255,255,255,0.12)"
                      : "rgba(0,0,0,0.08)",
                },
              }}
            >
              <CloseRoundedIcon sx={{ fontSize: 19 }} />
            </IconButton>
          </Box>

          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              mb: 2.5,
              fontSize: "0.84rem",
              lineHeight: 1.6,
            }}
          >
            Other participants won't know that you've muted this chat.
          </Typography>

          {/* Mute duration options: 3 columns */}
          <RadioGroup
            value={muteDuration}
            onChange={(e) => setMuteDuration(e.target.value)}
          >
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                gap: 1,
                width: "100%",
              }}
            >
              {[
                {
                  value: "8h",
                  title: "8 Hours",
                  subtitle: "Temporary",
                },
                {
                  value: "1w",
                  title: "1 Week",
                  subtitle: "7 days",
                },
                {
                  value: "forever",
                  title: "Always",
                  subtitle: "Until unmuted",
                },
              ].map((option) => {
                const selected = muteDuration === option.value;

                return (
                  <Box
                    key={option.value}
                    component={motion.label}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.96 }}
                    transition={bounceTransition}
                    sx={{
                      position: "relative",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      minWidth: 0,
                      minHeight: 104,
                      p: { xs: 0.75, sm: 1 },
                      borderRadius: 6,
                      cursor: "pointer",
                      textAlign: "center",
                      border: "0px solid",
                      boxShadow: selected 
                        ? mode === "dark" 
                          ? 'inset 0 1px 5px rgb(255, 255, 255), inset 0 -1px 6px rgb(0, 0, 0)' 
                          : 'inset 0 1px 5px rgba(255, 255, 255, 0.71), inset 0 -1px 1px rgba(0,0,0,0.1)' 
                        : 'none',
                      bgcolor: selected
                        ? mode === "dark"
                          ? "rgb(219, 219, 219)"
                          : "rgb(29, 29, 29)"
                        : mode === "dark"
                          ? "rgba(255,255,255,0.025)"
                          : "rgba(0,0,0,0.015)",
                      transition:
                        "border-color 180ms ease, background-color 180ms ease",
                      "& .MuiRadio-root": {
                        p: 0,
                        mb: 1,
                        color: selected ? mode === "dark" ? "#000" : "#fff" : "text.disabled",
                      },
                      "& .MuiRadio-root.Mui-checked": {
                        color: mode === "dark" ? "#000" : "#fff",
                      },
                    }}
                  >
                    <Radio
                      value={option.value}
                      size="small"
                      inputProps={{
                        "aria-label": option.title,
                      }}
                    />

                    <Typography
                      sx={{
                        fontSize: { xs: "0.78rem", sm: "0.86rem" },
                        fontWeight: 750,
                        lineHeight: 1.3,
                        color: selected ? mode === "dark" ? "#000" : "#fff" : "text.primary",
                        overflowWrap: "anywhere",
                      }}
                    >
                      {option.title}
                    </Typography>

                    <Typography
                      sx={{
                        mt: 0.4,
                        fontSize: { xs: "0.63rem", sm: "0.68rem" },
                        lineHeight: 1.35,
                        color: selected ? mode === "dark" ? "#2e2e2e" : "#c1c1c1" : mode === "dark" ? "#c1c1c1" : "#2e2e2e",
                        overflowWrap: "anywhere",
                      }}
                    >
                      {option.subtitle}
                    </Typography>
                  </Box>
                );
              })}
            </Box>
          </RadioGroup>

          {/* Footer actions */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 1,
              pt: 2.5,
              mt: 1,
              borderTop: "0px solid",
            }}
          >
            <Button
              component={motion.button}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.95 }}
              transition={bounceTransition}
              variant="contained"
              onClick={() => setMuteChatDialogOpen(false)}
              fullWidth
              sx={{
                minHeight: 42,
                px: 2,
                borderRadius: 8,
                textTransform: "none",
                fontSize: "0.85rem",
                fontWeight: 650,
                boxShadow: mode === "dark" ? 'inset 0 1px 1px rgba(255, 255, 255, 0.11), inset 0 -1px 4px rgba(0,0,0,0.4)' : 'inset 0 1px 1px rgba(255, 255, 255, 0.71), inset 0 -1px 4px rgba(0,0,0,0.1)',
                background: mode === "dark" ? "#f1f1f107" : "#0c0c0c08",
                color: "text.secondary",
                "&:hover": {
                  bgcolor:
                    mode === "dark"
                      ? "rgba(255,255,255,0.06)"
                      : "rgba(0,0,0,0.045)",
                  boxShadow: "none",
                },
              }}
            >
              Cancel
            </Button>

            <Button
              component={motion.button}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.95 }}
              transition={bounceTransition}
              variant="contained"
              onClick={handleConfirmMute}
              disableElevation
              fullWidth
              sx={{
                minHeight: 42,
                minWidth: 110,
                px: 2.5,
                borderRadius: 8,
                textTransform: "none",
                fontSize: "0.85rem",
                fontWeight: 750,
                boxShadow: mode === "dark" ? 'inset 0 1px 1px rgba(255, 255, 255, 0.11), inset 0 -1px 1px rgba(0,0,0,0.4)' : 'inset 0 1px 3px rgba(255, 255, 255, 0.71), inset 0 -1px 1px rgba(0,0,0,0.1)',
                "&:hover": {
                  bgcolor:
                    mode === "dark"
                      ? "rgba(255, 255, 255, 0.7)"
                      : "rgba(0,0,0,0.6)",
                  boxShadow: "none",
                },
              }}
            >
              Confirm
            </Button>
          </Box>
        </Box>
      </SwipeableDrawer>

      {/* ─── Disappearing Messages Drawer ─── */}
      <SwipeableDrawer
        anchor="bottom"
        open={disappearingDialogOpen}
        onClose={() => setDisappearingDialogOpen(false)}
        onOpen={() => {}}
        disableSwipeToOpen={false}
        ModalProps={{
          BackdropProps: {
            sx: drawerBackdropSx,
          },
        }}
        PaperProps={{
          sx: {
            ...drawerPaperSx(mode, {
              maxHeight: "85vh",
            }),
            overflowY: "auto",
            zIndex: 1400,
          },
        }}
      >
        <Box sx={{ display: { xs: "block", md: "none" } }}>
          <DrawerHandle mode={mode} />
        </Box>

        <Box
          sx={{
            maxWidth: 500,
            mx: 'auto',
            width: { xs: 'auto', md: '100%' },
            pt: { xs: 1, md: 2 },
            px: { xs: 1.5, md: 2 },
            pb: 1.5,
          }}
        >
          {/* Header */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              mb: 0.75,
            }}
          >
            <Typography
              variant="h6"
              sx={{
                fontWeight: 800,
                fontSize: { xs: "1.1rem", md: "1.2rem" },
                letterSpacing: "-0.4px",
              }}
            >
              Disappearing Messages
            </Typography>

            <IconButton
              component={motion.button}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              transition={bounceTransition}
              onClick={() => setDisappearingDialogOpen(false)}
              size="small"
              aria-label="Close disappearing messages"
              sx={{
                display: { xs: "none", md: "inline-flex" },
                width: 34,
                height: 34,
                borderRadius: 8,
                color: "text.secondary",
                bgcolor:
                  mode === "dark"
                    ? "rgba(255,255,255,0.06)"
                    : "rgba(0,0,0,0.04)",
                border: "0px solid",
                boxShadow: mode === "dark" ? 'inset 0 1px 1px rgba(255, 255, 255, 0.11), inset 0 -1px 1px rgba(0,0,0,0.4)' : 'inset 0 1px 1px rgba(255, 255, 255, 0.71), inset 0 -1px 1px rgba(0,0,0,0.1)',
                "&:hover": {
                  bgcolor:
                    mode === "dark"
                      ? "rgba(255,255,255,0.12)"
                      : "rgba(0,0,0,0.08)",
                },
              }}
            >
              <CloseRoundedIcon sx={{ fontSize: 19 }} />
            </IconButton>
          </Box>

          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              mb: 2.5,
              fontSize: "0.84rem",
              lineHeight: 1.6,
            }}
          >
            When turned on, new messages in this chat will disappear after the selected duration.
          </Typography>

          {/* Disappearing duration options: 2x2 grid */}
          <RadioGroup
            value={disappearingDuration}
            onChange={(e) => {
              const dur = Number(e.target.value);
              setChatDisappearingDuration(friendId, dur, "direct");
              setDisappearingDurationState(dur);
            }}
          >
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
                gap: 1,
                width: "100%",
              }}
            >
              {[
                {
                  value: 0,
                  title: "Off",
                  subtitle: "Messages stay",
                },
                {
                  value: 24 * 60 * 60 * 1000,
                  title: "24 Hours",
                  subtitle: "1 day",
                },
                {
                  value: 7 * 24 * 60 * 60 * 1000,
                  title: "7 Days",
                  subtitle: "1 week",
                },
                {
                  value: 90 * 24 * 60 * 60 * 1000,
                  title: "90 Days",
                  subtitle: "3 months",
                },
              ].map((option) => {
                const selected = disappearingDuration === option.value;

                return (
                  <Box
                    key={option.value}
                    component={motion.label}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.96 }}
                    transition={bounceTransition}
                    sx={{
                      position: "relative",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      minWidth: 0,
                      minHeight: 50,
                      p: { xs: 0.75, sm: 1 },
                      borderRadius: 5,
                      cursor: "pointer",
                      textAlign: "center",
                      border: "0px solid",
                      boxShadow: selected 
                        ? mode === "dark" 
                          ? 'inset 0 1px 5px rgb(255, 255, 255), inset 0 -1px 6px rgb(0, 0, 0)' 
                          : 'inset 0 1px 5px rgba(255, 255, 255, 0.71), inset 0 -1px 1px rgba(0,0,0,0.1)' 
                        : 'none',
                      bgcolor: selected
                        ? mode === "dark"
                          ? "rgb(219, 219, 219)"
                          : "rgb(29, 29, 29)"
                        : mode === "dark"
                          ? "rgba(255,255,255,0.025)"
                          : "rgba(0,0,0,0.015)",
                      transition:
                        "border-color 180ms ease, background-color 180ms ease",
                      "& .MuiRadio-root": {
                        p: 0,
                        mb: 0.8,
                        color: selected ? mode === "dark" ? "#000" : "#fff" : "text.disabled",
                      },
                      "& .MuiRadio-root.Mui-checked": {
                        color: mode === "dark" ? "#000" : "#fff",
                      },
                    }}
                  >
                    <Radio
                      value={option.value}
                      size="small"
                      inputProps={{
                        "aria-label": option.title,
                      }}
                    />

                    <Typography
                      sx={{
                        fontSize: { xs: "0.78rem", sm: "0.86rem" },
                        fontWeight: 750,
                        lineHeight: 1.3,
                        color: selected ? mode === "dark" ? "#000" : "#fff" : "text.primary",
                        overflowWrap: "anywhere",
                      }}
                    >
                      {option.title}
                    </Typography>

                    <Typography
                      sx={{
                        mt: 0.3,
                        fontSize: { xs: "0.63rem", sm: "0.68rem" },
                        lineHeight: 1.35,
                        color: selected ? mode === "dark" ? "#2e2e2e" : "#c1c1c1" : mode === "dark" ? "#c1c1c1" : "#2e2e2e",
                        overflowWrap: "anywhere",
                      }}
                    >
                      {option.subtitle}
                    </Typography>
                  </Box>
                );
              })}
            </Box>
          </RadioGroup>

          {/* Footer actions */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 1,
              pt: 2.5,
              mt: 1,
              borderTop: "0px solid",
            }}
          >
            <Button
              component={motion.button}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.95 }}
              transition={bounceTransition}
              variant="contained"
              onClick={() => setDisappearingDialogOpen(false)}
              fullWidth
              sx={{
                minHeight: 42,
                px: 2,
                borderRadius: 8,
                textTransform: "none",
                fontSize: "0.85rem",
                fontWeight: 750,
                boxShadow: mode === "dark" ? 'inset 0 1px 1px rgba(255, 255, 255, 0.11), inset 0 -1px 1px rgba(0,0,0,0.4)' : 'inset 0 1px 3px rgba(255, 255, 255, 0.71), inset 0 -1px 1px rgba(0,0,0,0.1)',
                "&:hover": {
                  bgcolor:
                    mode === "dark"
                      ? "rgba(255, 255, 255, 0.7)"
                      : "rgba(0,0,0,0.6)",
                  boxShadow: "none",
                },
              }}
            >
              Done
            </Button>
          </Box>
        </Box>
      </SwipeableDrawer>
    </Drawer>
  );
};

export default React.memo(ProfileDrawer);