// src/components/chats_components/ProfileDrawer.jsx
import React, { useState } from "react";
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
} from "@mui/material";
import {
  drawerPaperSx,
  drawerBackdropSx,
  DrawerHandle,
} from "../../theme/designSystem";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import PhoneOutlinedIcon from "@mui/icons-material/PhoneOutlined";
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
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { safeImageUrl } from "../../utils/uiHelpers";
import SharedMediaLinksWidgetsTabs from "./SharedMediaLinksWidgetsTabs";
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
  onOpenMutualFriends,
  onOpenCommonGroups,
  onOpenCommonTrips,
  onOpenNicknameDrawer,
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

  // Expansion states for "X more groups" and "X more trips"
  const [showAllGroups, setShowAllGroups] = useState(false);
  const [showAllTrips, setShowAllTrips] = useState(false);

  const name = friendDetails?.name || friendDetails?.displayName || "Friend";
  const username = friendDetails?.username;
  const photoURL = safeImageUrl(friendDetails?.photoURL);
  const phone =
    friendDetails?.mobile ||
    friendDetails?.phoneNumber ||
    friendDetails?.phone ||
    "";
  const friendId = friendDetails?.id || friendDetails?.uid;

  // Features state: Mute, Favorite, Disappearing Messages
  const [isMuted, setIsMuted] = useState(() => isChatMuted(friendId));
  const [isFavorite, setIsFavorite] = useState(() => isChatFavorite(friendId));
  const [disappearingDuration, setDisappearingDurationState] = useState(() =>
    getChatDisappearingDuration(friendId)
  );
  const [muteDialogOpen, setMuteDialogOpen] = useState(false);
  const [disappearingDialogOpen, setDisappearingDialogOpen] = useState(false);

  // Sync state whenever active friend changes
  React.useEffect(() => {
    if (friendId) {
      setIsMuted(isChatMuted(friendId));
      setIsFavorite(isChatFavorite(friendId));
      setDisappearingDurationState(getChatDisappearingDuration(friendId));
    }
  }, [friendId, friendDetails]);

  // Initial display limits to match mockup
  const initialGroupLimit = 3;
  const visibleGroups = showAllGroups
    ? commonGroups
    : commonGroups.slice(0, initialGroupLimit);
  const hasMoreGroups = commonGroups.length > initialGroupLimit;

  const initialTripLimit = 1;
  const visibleTrips = showAllTrips
    ? commonTrips
    : commonTrips.slice(0, initialTripLimit);
  const hasMoreTrips = commonTrips.length > initialTripLimit;

  // Format group members for subtitle
  const formatGroupMembers = (group) => {
    if (
      group.memberNames &&
      Array.isArray(group.memberNames) &&
      group.memberNames.length > 0
    ) {
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
            const mutual = mutualFriends.find(
              (mf) => mf.id === m || mf.uid === m
            );
            if (mutual) return mutual.name || mutual.displayName;
          }
          return null;
        })
        .filter(Boolean);

      if (names.length > 0) {
        return names.join(", ");
      }
      return `${group.members.length} members`;
    }
    return "Members in common";
  };

  return (
    <Drawer
      anchor={isDesktop ? "right" : "bottom"}
      open={open}
      onClose={onClose}
      ModalProps={{
        BackdropProps: {
          sx: drawerBackdropSx,
        },
      }}
      SlideProps={{
        timeout: { enter: 360, exit: 260 },
      }}
      PaperProps={{
        sx: {
          width: isDesktop ? 430 : "100%",
          maxWidth: isDesktop ? 430 : "100%",
          height: isDesktop ? "100vh" : "90vh",
          borderTopLeftRadius: isDesktop ? 0 : "24px",
          borderTopRightRadius: isDesktop ? 0 : "24px",
          bgcolor: isDark ? "#0d0d0f" : "#f8f9fa",
          color: isDark ? "#ffffff" : "#111111",
          px: 2.5,
          pt: 2,
          pb: 4,
          boxShadow: isDesktop
            ? "-12px 0 40px rgba(0,0,0,0.4)"
            : "0 -12px 40px rgba(0,0,0,0.3)",
          border: "none",
          overflowY: "auto",
          scrollbarWidth: "none",
          "&::-webkit-scrollbar": { display: "none" },
        },
      }}
    >
      {/* Drag handle visible only on mobile/touch screens */}
      <Box sx={{ display: { xs: "block", md: "none" }, mb: 1 }}>
        <DrawerHandle mode={isDark ? "dark" : "light"} />
      </Box>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* ─── 1. Top Back Button (Capsule) ─── */}
        <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
          <Button
            component={motion.button}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            startIcon={<ArrowBackIcon sx={{ fontSize: 18 }} />}
            onClick={onClose}
            sx={{
              color: isDark ? "#fff" : "#111",
              bgcolor: isDark
                ? "rgba(255, 255, 255, 0.08)"
                : "rgba(0, 0, 0, 0.06)",
              borderRadius: "999px",
              px: 2,
              py: 0.6,
              textTransform: "none",
              fontSize: "0.875rem",
              fontWeight: 600,
              boxShadow: "none",
              "&:hover": {
                bgcolor: isDark
                  ? "rgba(255, 255, 255, 0.14)"
                  : "rgba(0, 0, 0, 0.1)",
                boxShadow: "none",
              },
            }}
          >
            Back
          </Button>
        </Box>

        {/* ─── 2. Hero Profile: Large Avatar, Name, Username, Nickname Tag ─── */}
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
              border: `3px solid ${
                isDark ? "rgba(255, 255, 255, 0.12)" : "rgba(0, 0, 0, 0.08)"
              }`,
              boxShadow: isDark
                ? "0 10px 28px rgba(0, 0, 0, 0.5)"
                : "0 10px 24px rgba(0, 0, 0, 0.12)",
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
                color: isDark
                  ? "rgba(255, 255, 255, 0.55)"
                  : "rgba(0, 0, 0, 0.55)",
                fontSize: "0.9rem",
                mb: 1,
              }}
            >
              @{username}
            </Typography>
          )}

          {/* Nickname / Display Name Pill */}
          <Box
            sx={{
              display: "inline-flex",
              alignItems: "center",
              px: 1.8,
              py: 0.5,
              borderRadius: "999px",
              bgcolor: isDark
                ? "rgba(255, 255, 255, 0.08)"
                : "rgba(0, 0, 0, 0.06)",
              color: isDark
                ? "rgba(255, 255, 255, 0.85)"
                : "rgba(0, 0, 0, 0.85)",
              fontSize: "0.82rem",
              fontWeight: 500,
            }}
          >
            {nickname || name}
          </Box>
        </Box>

        {/* ─── 3. Stacked Quick-Info Cards ─── */}
        <Stack spacing={1} sx={{ mb: 3.5 }}>
          {/* Row 0: Search in Chat */}
          {onOpenSearch && (
            <Box
              component={motion.div}
              whileHover={{ scale: 1.012 }}
              whileTap={{ scale: 0.988 }}
              onClick={() => {
                onOpenSearch();
                onClose();
              }}
              sx={{
                display: "flex",
                alignItems: "center",
                bgcolor: isDark ? "#161618" : "#ffffff",
                border: `1px solid ${
                  isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.06)"
                }`,
                borderRadius: "14px",
                px: 2,
                py: 1.4,
                cursor: "pointer",
                transition: "background-color 0.2s ease",
                "&:hover": {
                  bgcolor: isDark ? "#1d1d21" : "#f0f0f2",
                },
              }}
            >
              <SearchIcon
                sx={{
                  color: isDark ? "#00b7ff" : "#0288d1",
                  fontSize: 21,
                  mr: 2,
                }}
              />
              <Typography
                sx={{
                  color: isDark ? "#fff" : "#111",
                  fontSize: "0.95rem",
                  fontWeight: 600,
                }}
              >
                Search in Chat
              </Typography>
            </Box>
          )}

          {/* Row 0.5: Add to Favorites */}
          <Box
            component={motion.div}
            whileHover={{ scale: 1.012 }}
            whileTap={{ scale: 0.988 }}
            onClick={() => {
              const res = toggleFavoriteChat(friendId);
              setIsFavorite(res);
            }}
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              bgcolor: isDark ? "#161618" : "#ffffff",
              border: `1px solid ${
                isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.06)"
              }`,
              borderRadius: "14px",
              px: 2,
              py: 1.4,
              cursor: "pointer",
              transition: "background-color 0.2s ease",
              "&:hover": {
                bgcolor: isDark ? "#1d1d21" : "#f0f0f2",
              },
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center" }}>
              {isFavorite ? (
                <StarRoundedIcon sx={{ color: "#ffb300", fontSize: 22, mr: 2 }} />
              ) : (
                <StarBorderRoundedIcon
                  sx={{
                    color: isDark ? "rgba(255, 255, 255, 0.7)" : "rgba(0,0,0,0.6)",
                    fontSize: 22,
                    mr: 2,
                  }}
                />
              )}
              <Typography
                sx={{
                  color: isDark ? "#fff" : "#111",
                  fontSize: "0.95rem",
                  fontWeight: 500,
                }}
              >
                {isFavorite ? "Favorited Chat" : "Add to Favorites"}
              </Typography>
            </Box>
            <Chip
              label={isFavorite ? "Favorited" : "Off"}
              size="small"
              sx={{
                bgcolor: isFavorite
                  ? "rgba(255, 179, 0, 0.15)"
                  : isDark
                  ? "rgba(255,255,255,0.06)"
                  : "rgba(0,0,0,0.05)",
                color: isFavorite
                  ? "#ffb300"
                  : isDark
                  ? "rgba(255,255,255,0.6)"
                  : "#777",
                fontWeight: 600,
                fontSize: "0.75rem",
              }}
            />
          </Box>

          {/* Row 0.6: Mute Notifications */}
          <Box
            component={motion.div}
            whileHover={{ scale: 1.012 }}
            whileTap={{ scale: 0.988 }}
            onClick={() => setMuteDialogOpen(true)}
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              bgcolor: isDark ? "#161618" : "#ffffff",
              border: `1px solid ${
                isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.06)"
              }`,
              borderRadius: "14px",
              px: 2,
              py: 1.4,
              cursor: "pointer",
              transition: "background-color 0.2s ease",
              "&:hover": {
                bgcolor: isDark ? "#1d1d21" : "#f0f0f2",
              },
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center" }}>
              {isMuted ? (
                <NotificationsOffOutlinedIcon
                  sx={{ color: "#ef4444", fontSize: 21, mr: 2 }}
                />
              ) : (
                <NotificationsActiveOutlinedIcon
                  sx={{
                    color: isDark ? "rgba(255, 255, 255, 0.7)" : "rgba(0,0,0,0.6)",
                    fontSize: 21,
                    mr: 2,
                  }}
                />
              )}
              <Typography
                sx={{
                  color: isDark ? "#fff" : "#111",
                  fontSize: "0.95rem",
                  fontWeight: 500,
                }}
              >
                Mute Notifications
              </Typography>
            </Box>
            <Chip
              label={isMuted ? "Muted" : "Unmuted"}
              size="small"
              sx={{
                bgcolor: isMuted
                  ? "rgba(239, 68, 68, 0.15)"
                  : isDark
                  ? "rgba(255,255,255,0.06)"
                  : "rgba(0,0,0,0.05)",
                color: isMuted
                  ? "#ef4444"
                  : isDark
                  ? "rgba(255,255,255,0.6)"
                  : "#777",
                fontWeight: 600,
                fontSize: "0.75rem",
              }}
            />
          </Box>

          {/* Row 0.7: Disappearing Messages */}
          <Box
            component={motion.div}
            whileHover={{ scale: 1.012 }}
            whileTap={{ scale: 0.988 }}
            onClick={() => setDisappearingDialogOpen(true)}
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              bgcolor: isDark ? "#161618" : "#ffffff",
              border: `1px solid ${
                isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.06)"
              }`,
              borderRadius: "14px",
              px: 2,
              py: 1.4,
              cursor: "pointer",
              transition: "background-color 0.2s ease",
              "&:hover": {
                bgcolor: isDark ? "#1d1d21" : "#f0f0f2",
              },
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <TimelapseRoundedIcon
                sx={{
                  color: isDark ? "#00b7ff" : "#0288d1",
                  fontSize: 21,
                  mr: 2,
                }}
              />
              <Typography
                sx={{
                  color: isDark ? "#fff" : "#111",
                  fontSize: "0.95rem",
                  fontWeight: 500,
                }}
              >
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
                bgcolor:
                  disappearingDuration > 0
                    ? "rgba(0, 183, 255, 0.15)"
                    : isDark
                    ? "rgba(255,255,255,0.06)"
                    : "rgba(0,0,0,0.05)",
                color:
                  disappearingDuration > 0
                    ? "#00b7ff"
                    : isDark
                    ? "rgba(255,255,255,0.6)"
                    : "#777",
                fontWeight: 600,
                fontSize: "0.75rem",
              }}
            />
          </Box>

          {/* Row 1: Mutual Friends */}
          <Box
            component={motion.div}
            whileHover={{ scale: 1.012 }}
            whileTap={{ scale: 0.988 }}
            onClick={onOpenMutualFriends}
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              bgcolor: isDark ? "#161618" : "#ffffff",
              border: `1px solid ${
                isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.06)"
              }`,
              borderRadius: "14px",
              px: 2,
              py: 1.4,
              cursor: "pointer",
              transition: "background-color 0.2s ease",
              "&:hover": {
                bgcolor: isDark ? "#1d1d21" : "#f0f0f2",
              },
            }}
          >
            <Typography
              sx={{
                color: isDark ? "#fff" : "#111",
                fontSize: "0.95rem",
                fontWeight: 500,
              }}
            >
              {mutualFriends.length} Mutual Friends
            </Typography>
            {mutualFriends.length > 0 && (
              <Avatar
                src={safeImageUrl(mutualFriends[0]?.photoURL)}
                alt={mutualFriends[0]?.name || "Mutual Friend"}
                sx={{
                  width: 28,
                  height: 28,
                  border: `1.5px solid ${
                    isDark ? "rgba(255, 255, 255, 0.2)" : "rgba(0, 0, 0, 0.15)"
                  }`,
                  fontSize: "0.75rem",
                  fontWeight: 600,
                }}
              >
                {mutualFriends[0]?.name?.[0] || "M"}
              </Avatar>
            )}
          </Box>

          {/* Row 2: Phone */}
          <Box
            component={motion.div}
            whileHover={{ scale: 1.012 }}
            whileTap={{ scale: 0.988 }}
            onClick={() => {
              if (phone) window.open(`tel:${phone}`, "_self");
            }}
            sx={{
              display: "flex",
              alignItems: "center",
              bgcolor: isDark ? "#161618" : "#ffffff",
              border: `1px solid ${
                isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.06)"
              }`,
              borderRadius: "14px",
              px: 2,
              py: 1.4,
              cursor: phone ? "pointer" : "default",
              transition: "background-color 0.2s ease",
              "&:hover": {
                bgcolor: isDark ? "#1d1d21" : "#f0f0f2",
              },
            }}
          >
            <PhoneOutlinedIcon
              sx={{
                color: isDark ? "rgba(255, 255, 255, 0.8)" : "rgba(0, 0, 0, 0.7)",
                fontSize: 20,
                mr: 2,
              }}
            />
            <Typography
              sx={{
                color: isDark ? "#fff" : "#111",
                fontSize: "0.95rem",
                fontWeight: 500,
              }}
            >
              {phone || "No phone added"}
            </Typography>
          </Box>

          {/* Row 3: Profile */}
          <Box
            component={motion.div}
            whileHover={{ scale: 1.012 }}
            whileTap={{ scale: 0.988 }}
            onClick={() => {
              const userParam = username ? `@${username.replace(/^@/, "")}` : (friendId ? `@${friendId}` : "");
              if (userParam) navigate(`/profile/${userParam}`);
            }}
            sx={{
              display: "flex",
              alignItems: "center",
              bgcolor: isDark ? "#161618" : "#ffffff",
              border: `1px solid ${
                isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.06)"
              }`,
              borderRadius: "14px",
              px: 2,
              py: 1.4,
              cursor: "pointer",
              transition: "background-color 0.2s ease",
              "&:hover": {
                bgcolor: isDark ? "#1d1d21" : "#f0f0f2",
              },
            }}
          >
            <PersonOutlineIcon
              sx={{
                color: isDark ? "rgba(255, 255, 255, 0.8)" : "rgba(0, 0, 0, 0.7)",
                fontSize: 21,
                mr: 2,
              }}
            />
            <Typography
              sx={{
                color: isDark ? "#fff" : "#111",
                fontSize: "0.95rem",
                fontWeight: 500,
              }}
            >
              Profile
            </Typography>
          </Box>

          {/* Row 4: Add / Edit Nickname */}
          <Box
            component={motion.div}
            whileHover={{ scale: 1.012 }}
            whileTap={{ scale: 0.988 }}
            onClick={onOpenNicknameDrawer}
            sx={{
              display: "flex",
              alignItems: "center",
              bgcolor: isDark ? "#161618" : "#ffffff",
              border: `1px solid ${
                isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.06)"
              }`,
              borderRadius: "14px",
              px: 2,
              py: 1.4,
              cursor: "pointer",
              transition: "background-color 0.2s ease",
              "&:hover": {
                bgcolor: isDark ? "#1d1d21" : "#f0f0f2",
              },
            }}
          >
            <TextFieldsIcon
              sx={{
                color: isDark ? "rgba(255, 255, 255, 0.8)" : "rgba(0, 0, 0, 0.7)",
                fontSize: 21,
                mr: 2,
              }}
            />
            <Typography
              sx={{
                color: isDark ? "#fff" : "#111",
                fontSize: "0.95rem",
                fontWeight: 500,
              }}
            >
              {nickname ? "Edit Nickname" : "Add a Nickname"}
            </Typography>
          </Box>
        </Stack>

        {/* ─── 4. Common Groups Section ─── */}
        <Box sx={{ mb: 3.5 }}>
          <Typography
            sx={{
              fontSize: "1.05rem",
              fontWeight: 700,
              color: isDark ? "#fff" : "#111",
              letterSpacing: "-0.2px",
              mb: 1.5,
            }}
          >
            Common Groups
          </Typography>

          {visibleGroups.length === 0 ? (
            <Box
              sx={{
                p: 2.5,
                borderRadius: "16px",
                bgcolor: isDark ? "#161618" : "#ffffff",
                border: `1px solid ${
                  isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.06)"
                }`,
                textAlign: "center",
              }}
            >
              <Typography
                sx={{
                  color: isDark
                    ? "rgba(255, 255, 255, 0.4)"
                    : "rgba(0, 0, 0, 0.4)",
                  fontSize: "0.88rem",
                }}
              >
                No common groups
              </Typography>
            </Box>
          ) : (
            <Stack spacing={1.2}>
              {visibleGroups.map((group) => {
                const groupName = group.name || group.groupName || "Group";
                const groupPhoto = safeImageUrl(
                  group.iconURL || group.photoURL || group.image
                );
                const membersSubtitle = formatGroupMembers(group);

                return (
                  <Box
                    key={group.id || groupName}
                    component={motion.div}
                    whileHover={{ scale: 1.012 }}
                    whileTap={{ scale: 0.988 }}
                    onClick={() =>
                      navigate(`/group/${encodeURIComponent(groupName)}`)
                    }
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1.6,
                      bgcolor: isDark ? "#161618" : "#ffffff",
                      border: `1px solid ${
                        isDark
                          ? "rgba(255, 255, 255, 0.05)"
                          : "rgba(0, 0, 0, 0.06)"
                      }`,
                      borderRadius: "16px",
                      p: 1.6,
                      cursor: "pointer",
                      transition: "background-color 0.2s ease",
                      "&:hover": {
                        bgcolor: isDark ? "#1d1d21" : "#f0f0f2",
                      },
                    }}
                  >
                    <Avatar
                      src={groupPhoto}
                      alt={groupName}
                      sx={{
                        width: 44,
                        height: 44,
                        bgcolor: isDark ? "#28282b" : "#e2e2e6",
                        color: isDark ? "#ffffff" : "#222222",
                        border: `1px solid ${
                          isDark
                            ? "rgba(255, 255, 255, 0.1)"
                            : "rgba(0, 0, 0, 0.08)"
                        }`,
                        fontSize: "1.1rem",
                        fontWeight: 600,
                        flexShrink: 0,
                      }}
                    >
                      {group.emoji || groupName[0]?.toUpperCase() || "G"}
                    </Avatar>

                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      <Typography
                        sx={{
                          color: isDark ? "#fff" : "#111",
                          fontWeight: 700,
                          fontSize: "0.96rem",
                          lineHeight: 1.25,
                          mb: 0.3,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {groupName}
                      </Typography>
                      <Typography
                        sx={{
                          color: isDark
                            ? "rgba(255, 255, 255, 0.52)"
                            : "rgba(0, 0, 0, 0.52)",
                          fontSize: "0.82rem",
                          lineHeight: 1.2,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {membersSubtitle}
                      </Typography>
                    </Box>
                  </Box>
                );
              })}

              {hasMoreGroups && (
                <Button
                  fullWidth
                  component={motion.button}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => setShowAllGroups((prev) => !prev)}
                  sx={{
                    bgcolor: isDark ? "#1e1e22" : "#e8e9ec",
                    color: isDark ? "#fff" : "#111",
                    borderRadius: "14px",
                    py: 1.2,
                    textTransform: "none",
                    fontWeight: 700,
                    fontSize: "0.9rem",
                    boxShadow: "none",
                    "&:hover": {
                      bgcolor: isDark ? "#26262c" : "#dedfe3",
                      boxShadow: "none",
                    },
                  }}
                >
                  {showAllGroups
                    ? "Show less groups"
                    : `${commonGroups.length - initialGroupLimit} more groups`}
                </Button>
              )}
            </Stack>
          )}
        </Box>

        {/* ─── 5. Common Trips Section ─── */}
        <Box sx={{ mb: 3.5 }}>
          <Typography
            sx={{
              fontSize: "1.05rem",
              fontWeight: 700,
              color: isDark ? "#fff" : "#111",
              letterSpacing: "-0.2px",
              mb: 1.5,
            }}
          >
            Common Trips
          </Typography>

          {visibleTrips.length === 0 ? (
            <Box
              sx={{
                p: 2.5,
                borderRadius: "16px",
                bgcolor: isDark ? "#161618" : "#ffffff",
                border: `1px solid ${
                  isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.06)"
                }`,
                textAlign: "center",
              }}
            >
              <Typography
                sx={{
                  color: isDark
                    ? "rgba(255, 255, 255, 0.4)"
                    : "rgba(0, 0, 0, 0.4)",
                  fontSize: "0.88rem",
                }}
              >
                No common trips
              </Typography>
            </Box>
          ) : (
            <Stack spacing={1.2}>
              {visibleTrips.map((trip) => {
                const tripName = trip.name || trip.title || "Trip";
                const fromLoc = trip.from || trip.location || "Trip";
                const toLoc = trip.to || trip.location || "Trip";
                const route = `${fromLoc} → ${toLoc}`;
                const dates =
                  trip.startDate && trip.endDate
                    ? `${trip.startDate} → ${trip.endDate}`
                    : trip.startDate || trip.date || "Upcoming";

                return (
                  <Box
                    key={trip.id || tripName}
                    component={motion.div}
                    whileHover={{ scale: 1.012 }}
                    whileTap={{ scale: 0.988 }}
                    onClick={() => navigate(`/trips`)}
                    sx={{
                      bgcolor: isDark ? "#161618" : "#ffffff",
                      border: `1px solid ${
                        isDark
                          ? "rgba(255, 255, 255, 0.05)"
                          : "rgba(0, 0, 0, 0.06)"
                      }`,
                      borderRadius: "18px",
                      p: 2,
                      cursor: "pointer",
                      transition: "background-color 0.2s ease",
                      "&:hover": {
                        bgcolor: isDark ? "#1d1d21" : "#f0f0f2",
                      },
                    }}
                  >
                    <Typography
                      sx={{
                        color: isDark ? "#fff" : "#111",
                        fontWeight: 700,
                        fontSize: "1.2rem",
                        letterSpacing: "-0.2px",
                        mb: 1,
                      }}
                    >
                      {tripName}
                    </Typography>

                    {/* Location row with pin icon */}
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        mb: 0.6,
                      }}
                    >
                      <PlaceIcon
                        sx={{
                          fontSize: 16,
                          color: isDark
                            ? "rgba(255, 255, 255, 0.6)"
                            : "rgba(0, 0, 0, 0.6)",
                          flexShrink: 0,
                        }}
                      />
                      <Typography
                        sx={{
                          color: isDark
                            ? "rgba(255, 255, 255, 0.65)"
                            : "rgba(0, 0, 0, 0.65)",
                          fontSize: "0.88rem",
                          fontWeight: 500,
                        }}
                      >
                        {route}
                      </Typography>
                    </Box>

                    {/* Date row with clock icon */}
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <AccessTimeIcon
                        sx={{
                          fontSize: 16,
                          color: isDark
                            ? "rgba(255, 255, 255, 0.6)"
                            : "rgba(0, 0, 0, 0.6)",
                          flexShrink: 0,
                        }}
                      />
                      <Typography
                        sx={{
                          color: isDark
                            ? "rgba(255, 255, 255, 0.65)"
                            : "rgba(0, 0, 0, 0.65)",
                          fontSize: "0.88rem",
                          fontWeight: 500,
                        }}
                      >
                        {dates}
                      </Typography>
                    </Box>
                  </Box>
                );
              })}

              {hasMoreTrips && (
                <Button
                  fullWidth
                  component={motion.button}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => setShowAllTrips((prev) => !prev)}
                  sx={{
                    bgcolor: isDark ? "#1e1e22" : "#e8e9ec",
                    color: isDark ? "#fff" : "#111",
                    borderRadius: "14px",
                    py: 1.2,
                    textTransform: "none",
                    fontWeight: 700,
                    fontSize: "0.9rem",
                    boxShadow: "none",
                    "&:hover": {
                      bgcolor: isDark ? "#26262c" : "#dedfe3",
                      boxShadow: "none",
                    },
                  }}
                >
                  {showAllTrips
                    ? "Show less trips"
                    : `${commonTrips.length - initialTripLimit} more trips`}
                </Button>
              )}
            </Stack>
          )}
        </Box>

        {/* ─── Shared Media, Links & Widgets ─── */}
        <Box sx={{ mb: 3.5 }}>
          <Typography
            sx={{
              fontSize: "1.05rem",
              fontWeight: 700,
              color: isDark ? "#fff" : "#111",
              letterSpacing: "-0.2px",
              mb: 1.5,
            }}
          >
            Shared in Chat
          </Typography>
          <SharedMediaLinksWidgetsTabs
            messages={messages}
            onOpenImage={onOpenImage}
            onJumpToMessage={onJumpToMessage}
            isDark={isDark}
          />
        </Box>

        {/* ─── 6. Danger Actions (Delete Chat, Block Friend, Remove from Friend) ─── */}
        <Stack spacing={1.2} sx={{ mb: 1 }}>
          {/* Delete Chat */}
          <Button
            fullWidth
            component={motion.button}
            whileHover={{ scale: 1.012 }}
            whileTap={{ scale: 0.988 }}
            startIcon={
              <DeleteOutlineIcon sx={{ color: "#ef4444", fontSize: 22 }} />
            }
            onClick={onDeleteChat || onClearChat}
            sx={{
              bgcolor: isDark
                ? "rgba(239, 68, 68, 0.08)"
                : "rgba(239, 68, 68, 0.07)",
              border: `1px solid ${
                isDark
                  ? "rgba(239, 68, 68, 0.18)"
                  : "rgba(239, 68, 68, 0.22)"
              }`,
              color: "#ef4444",
              borderRadius: "16px",
              py: 1.4,
              px: 2.2,
              justifyContent: "flex-start",
              textTransform: "none",
              fontWeight: 600,
              fontSize: "0.95rem",
              boxShadow: "none",
              "&:hover": {
                bgcolor: isDark
                  ? "rgba(239, 68, 68, 0.16)"
                  : "rgba(239, 68, 68, 0.13)",
                borderColor: "rgba(239, 68, 68, 0.35)",
                boxShadow: "none",
              },
            }}
          >
            Delete Chat
          </Button>

          {/* Block Friend */}
          <Button
            fullWidth
            component={motion.button}
            whileHover={{ scale: 1.012 }}
            whileTap={{ scale: 0.988 }}
            startIcon={<BlockIcon sx={{ color: "#ef4444", fontSize: 22 }} />}
            onClick={onToggleBlock}
            sx={{
              bgcolor: isDark
                ? "rgba(239, 68, 68, 0.08)"
                : "rgba(239, 68, 68, 0.07)",
              border: `1px solid ${
                isDark
                  ? "rgba(239, 68, 68, 0.18)"
                  : "rgba(239, 68, 68, 0.22)"
              }`,
              color: "#ef4444",
              borderRadius: "16px",
              py: 1.4,
              px: 2.2,
              justifyContent: "flex-start",
              textTransform: "none",
              fontWeight: 600,
              fontSize: "0.95rem",
              boxShadow: "none",
              "&:hover": {
                bgcolor: isDark
                  ? "rgba(239, 68, 68, 0.16)"
                  : "rgba(239, 68, 68, 0.13)",
                borderColor: "rgba(239, 68, 68, 0.35)",
                boxShadow: "none",
              },
            }}
          >
            {isBlocked ? "Unblock Friend" : "Block Friend"}
          </Button>

          {/* Remove from Friend */}
          <Button
            fullWidth
            component={motion.button}
            whileHover={{ scale: 1.012 }}
            whileTap={{ scale: 0.988 }}
            startIcon={
              <RemoveCircleOutlineIcon
                sx={{ color: "#ef4444", fontSize: 22 }}
              />
            }
            onClick={onRemoveFriend}
            sx={{
              bgcolor: isDark
                ? "rgba(239, 68, 68, 0.08)"
                : "rgba(239, 68, 68, 0.07)",
              border: `1px solid ${
                isDark
                  ? "rgba(239, 68, 68, 0.18)"
                  : "rgba(239, 68, 68, 0.22)"
              }`,
              color: "#ef4444",
              borderRadius: "16px",
              py: 1.4,
              px: 2.2,
              justifyContent: "flex-start",
              textTransform: "none",
              fontWeight: 600,
              fontSize: "0.95rem",
              boxShadow: "none",
              "&:hover": {
                bgcolor: isDark
                  ? "rgba(239, 68, 68, 0.16)"
                  : "rgba(239, 68, 68, 0.13)",
                borderColor: "rgba(239, 68, 68, 0.35)",
                boxShadow: "none",
              },
            }}
          >
            Remove from Friend
          </Button>
        </Stack>
      </motion.div>

      {/* Mute Duration Drawer */}
      <SwipeableDrawer
        anchor="bottom"
        open={muteDialogOpen}
        onClose={() => setMuteDialogOpen(false)}
        onOpen={() => {}}
        disableSwipeToOpen={false}
        ModalProps={{
          BackdropProps: {
            sx: drawerBackdropSx,
          },
        }}
        PaperProps={{
          sx: {
            ...drawerPaperSx(isDark ? "dark" : "light", {
              maxHeight: "85vh",
            }),
            overflowY: "auto",
          },
        }}
      >
        <Box sx={{ display: { xs: "block", md: "none" } }}>
          <DrawerHandle mode={isDark ? "dark" : "light"} />
        </Box>
        <Box sx={{ maxWidth: 500, mx: "auto", width: "100%", boxSizing: "border-box", pt: { xs: 1, md: 2 } }}>
          <Typography variant="h6" sx={{ fontWeight: 800, fontSize: "1.1rem", mb: 0.5 }}>
            Mute Notifications
          </Typography>
          <Typography variant="body2" sx={{ mb: 2, opacity: 0.75 }}>
            Other participants will not see that you muted this chat.
          </Typography>
          <Stack spacing={1}>
            <Button
              variant="outlined"
              fullWidth
              onClick={() => {
                muteChat(friendId, 8 * 60 * 60 * 1000);
                setIsMuted(true);
                setMuteDialogOpen(false);
              }}
              sx={{
                justifyContent: "flex-start",
                py: 1.2,
                borderRadius: "12px",
                textTransform: "none",
                borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)",
                color: isDark ? "#fff" : "#111",
              }}
            >
              8 Hours
            </Button>
            <Button
              variant="outlined"
              fullWidth
              onClick={() => {
                muteChat(friendId, 7 * 24 * 60 * 60 * 1000);
                setIsMuted(true);
                setMuteDialogOpen(false);
              }}
              sx={{
                justifyContent: "flex-start",
                py: 1.2,
                borderRadius: "12px",
                textTransform: "none",
                borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)",
                color: isDark ? "#fff" : "#111",
              }}
            >
              1 Week
            </Button>
            <Button
              variant="outlined"
              fullWidth
              onClick={() => {
                muteChat(friendId, null);
                setIsMuted(true);
                setMuteDialogOpen(false);
              }}
              sx={{
                justifyContent: "flex-start",
                py: 1.2,
                borderRadius: "12px",
                textTransform: "none",
                borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)",
                color: isDark ? "#fff" : "#111",
              }}
            >
              Always
            </Button>
            {isMuted && (
              <Button
                variant="contained"
                fullWidth
                onClick={() => {
                  unmuteChat(friendId);
                  setIsMuted(false);
                  setMuteDialogOpen(false);
                }}
                sx={{
                  py: 1.2,
                  borderRadius: "12px",
                  bgcolor: "#00b7ff",
                  color: "#fff",
                  textTransform: "none",
                  fontWeight: 600,
                  "&:hover": { bgcolor: "#009bd9" },
                }}
              >
                Unmute Chat
              </Button>
            )}
          </Stack>
          <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}>
            <Button onClick={() => setMuteDialogOpen(false)} sx={{ color: isDark ? "#fff" : "#111" }}>
              Cancel
            </Button>
          </Box>
        </Box>
      </SwipeableDrawer>

      {/* Disappearing Messages Drawer */}
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
            ...drawerPaperSx(isDark ? "dark" : "light", {
              maxHeight: "85vh",
            }),
            overflowY: "auto",
          },
        }}
      >
        <Box sx={{ display: { xs: "block", md: "none" } }}>
          <DrawerHandle mode={isDark ? "dark" : "light"} />
        </Box>
        <Box sx={{ maxWidth: 500, mx: "auto", width: "100%", boxSizing: "border-box", pt: { xs: 1, md: 2 } }}>
          <Typography variant="h6" sx={{ fontWeight: 800, fontSize: "1.1rem", mb: 0.5 }}>
            Disappearing Messages
          </Typography>
          <Typography variant="body2" sx={{ mb: 2, opacity: 0.75 }}>
            When turned on, new messages in this chat will disappear after the selected duration.
          </Typography>
          <RadioGroup
            value={disappearingDuration}
            onChange={(e) => {
              const dur = Number(e.target.value);
              setChatDisappearingDuration(friendId, dur, "direct");
              setDisappearingDurationState(dur);
              setDisappearingDialogOpen(false);
            }}
          >
            {DISAPPEARING_OPTIONS.map((opt) => (
              <FormControlLabel
                key={opt.value}
                value={opt.value}
                control={<Radio sx={{ color: isDark ? "#00b7ff" : "#0288d1" }} />}
                label={opt.label}
              />
            ))}
          </RadioGroup>
          <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}>
            <Button onClick={() => setDisappearingDialogOpen(false)} sx={{ color: isDark ? "#fff" : "#111" }}>
              Close
            </Button>
          </Box>
        </Box>
      </SwipeableDrawer>
    </Drawer>
  );
};

export default React.memo(ProfileDrawer);
