// src/components/panels/ChatProfilePanelContent.jsx
import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Avatar,
  Button,
  Stack,
  Skeleton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  RadioGroup,
  FormControlLabel,
  Radio,
} from "@mui/material";
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
import { useAuth } from "../../hooks/useAuth";
import { useThemeToggle } from "../../contexts/ThemeToggleContext";
import { db } from "../../firebase";
import {
  doc,
  getDoc,
  getDocs,
  collection,
  query,
  where,
  updateDoc,
  arrayRemove,
  arrayUnion,
} from "firebase/firestore";
import { safeImageUrl } from "../../utils/uiHelpers";
import SharedMediaLinksWidgetsTabs from "../chats_components/SharedMediaLinksWidgetsTabs";
import MutualFriendsDrawer from "../chats_components/MutualFriendsDrawer";
import AddNicknameDrawer from "../chats_components/AddNicknameDrawer";
import {
  getCachedUser,
  setCachedUser,
  getCachedData,
  setCachedData,
} from "../../utils/chatCache";
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

const ChatProfilePanelContent = ({
  profileData,
  onClose,
  onClearChat,
  onRemoveFriend,
}) => {
  const { user: currentUser } = useAuth();
  const { mode } = useThemeToggle();
  const isDark = mode === "dark";
  const navigate = useNavigate();

  const uid = profileData?.id || profileData?.uid;

  const [details, setDetails] = useState(() => {
    const initial = profileData || {};
    const targetUid = initial.id || initial.uid;
    if (initial.name || initial.displayName) return initial;
    if (targetUid) {
      const cached = getCachedUser(targetUid);
      if (cached) return { ...cached, ...initial };
    }
    return initial;
  });

  const [loading, setLoading] = useState(() => {
    const initial = profileData || {};
    const targetUid = initial.id || initial.uid;
    if (initial.name || initial.displayName) return false;
    if (targetUid && getCachedUser(targetUid)) return false;
    return true;
  });

  const [mutualFriends, setMutualFriends] = useState(() => {
    if (Array.isArray(profileData?.mutualFriendsList)) return profileData.mutualFriendsList;
    if (uid) {
      const cached = getCachedData(`profile_extra_${uid}`, null);
      if (cached?.mutualFriends) return cached.mutualFriends;
    }
    return [];
  });

  const [commonGroups, setCommonGroups] = useState(() => {
    if (uid) {
      const cached = getCachedData(`profile_extra_${uid}`, null);
      if (cached?.commonGroups) return cached.commonGroups;
    }
    return [];
  });

  const [commonTrips, setCommonTrips] = useState(() => {
    if (uid) {
      const cached = getCachedData(`profile_extra_${uid}`, null);
      if (cached?.commonTrips) return cached.commonTrips;
    }
    return [];
  });

  const [isBlocked, setIsBlocked] = useState(false);
  const [showAllGroups, setShowAllGroups] = useState(false);
  const [showAllTrips, setShowAllTrips] = useState(false);

  // Nickname & Mutual Friends Drawers
  const [mutualFriendsOpen, setMutualFriendsOpen] = useState(false);
  const [nicknameDrawerOpen, setNicknameDrawerOpen] = useState(false);
  const [nickname, setNickname] = useState(profileData?.nickname || "");

  const handleSaveNickname = async (newNick) => {
    if (!currentUser?.uid || !uid) return;
    try {
      await updateDoc(doc(db, "users", currentUser.uid), {
        [`nicknames.${uid}`]: newNick.trim(),
      });
      setNickname(newNick.trim());
    } catch (e) {
      console.error("Failed to save nickname:", e);
    }
  };

  // Features state: Mute, Favorite, Disappearing Messages
  const [isMuted, setIsMuted] = useState(() => isChatMuted(uid));
  const [isFavorite, setIsFavorite] = useState(() => isChatFavorite(uid));
  const [disappearingDuration, setDisappearingDurationState] = useState(() =>
    getChatDisappearingDuration(uid)
  );
  const [muteDialogOpen, setMuteDialogOpen] = useState(false);
  const [disappearingDialogOpen, setDisappearingDialogOpen] = useState(false);

  // Sync state whenever active profile changes
  useEffect(() => {
    if (profileData) {
      setDetails((prev) => ({ ...prev, ...profileData }));
      if (profileData.name || profileData.displayName) {
        setLoading(false);
      }
    }
    if (uid) {
      setIsMuted(isChatMuted(uid));
      setIsFavorite(isChatFavorite(uid));
      setDisappearingDurationState(getChatDisappearingDuration(uid));
    }
  }, [uid, profileData]);

  useEffect(() => {
    if (!uid) return;

    let isMounted = true;
    const fetchAllData = async () => {
      try {
        const snap = await getDoc(doc(db, "users", uid));
        let fetchedMutual = [];
        let fetchedGroups = [];
        let fetchedTrips = [];

        if (snap.exists() && isMounted) {
          const uData = { ...snap.data(), id: uid };
          setDetails((prev) => ({ ...prev, ...uData }));
          setCachedUser(uid, uData);
        }

        if (currentUser?.uid) {
          // Check block status
          const currSnap = await getDoc(doc(db, "users", currentUser.uid));
          if (currSnap.exists() && isMounted) {
            const currData = currSnap.data();
            const blocked = (currData.blockedUids || []).includes(uid);
            setIsBlocked(blocked);
            if (currData.nicknames && currData.nicknames[uid]) {
              setNickname(currData.nicknames[uid]);
            }

            // Fetch mutual friends with client cache protection
            const myFriends = currData.friends || [];
            const theirFriends = snap.exists() ? snap.data().friends || [] : [];
            const mutual = myFriends.filter((id) => theirFriends.includes(id));

            if (mutual.length > 0) {
              const mutualUsers = await Promise.all(
                mutual.map(async (mId) => {
                  const cachedUser = getCachedUser(mId);
                  if (cachedUser) return { id: mId, ...cachedUser };
                  try {
                    const mSnap = await getDoc(doc(db, "users", mId));
                    if (mSnap.exists()) {
                      const mData = { id: mId, ...mSnap.data() };
                      setCachedUser(mId, mData);
                      return mData;
                    }
                  } catch (e) {
                    // ignore individual fail
                  }
                  return null;
                })
              );
              fetchedMutual = mutualUsers.filter(Boolean);
              if (isMounted) setMutualFriends(fetchedMutual);
            }
          }

          // Common groups
          const groupsSnap = await getDocs(
            query(
              collection(db, "groupChats"),
              where("members", "array-contains", currentUser.uid)
            )
          );
          fetchedGroups = groupsSnap.docs
            .map((d) => ({ id: d.id, ...d.data() }))
            .filter((g) => (g.members || []).map(String).includes(String(uid)));
          if (isMounted) setCommonGroups(fetchedGroups);

          // Common trips (Optimized query: Only current user's trips, not whole DB!)
          const tripsSnap = await getDocs(
            query(
              collection(db, "trips"),
              where("members", "array-contains", currentUser.uid)
            )
          );
          fetchedTrips = tripsSnap.docs
            .map((d) => ({ id: d.id, ...d.data() }))
            .filter((t) => {
              const members = (t.members || []).map(String);
              const contributors = (t.contributorUids || []).map(String);
              return (
                (members.includes(String(currentUser.uid)) && members.includes(String(uid))) ||
                (contributors.includes(String(currentUser.uid)) && contributors.includes(String(uid)))
              );
            });
          if (isMounted) setCommonTrips(fetchedTrips);

          // Cache extra profile relationships for instant next load
          setCachedData(`profile_extra_${uid}`, {
            mutualFriends: fetchedMutual,
            commonGroups: fetchedGroups,
            commonTrips: fetchedTrips,
          });
        }
      } catch (err) {
        console.error("Error loading chat friend profile panel data:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchAllData();
    return () => {
      isMounted = false;
    };
  }, [uid, currentUser?.uid]);

  const handleToggleBlock = async () => {
    if (!currentUser?.uid || !uid) return;
    try {
      const userRef = doc(db, "users", currentUser.uid);
      if (isBlocked) {
        await updateDoc(userRef, { blockedUids: arrayRemove(uid) });
        setIsBlocked(false);
      } else {
        await updateDoc(userRef, { blockedUids: arrayUnion(uid) });
        setIsBlocked(true);
      }
    } catch (e) {
      console.error("Failed to toggle block:", e);
    }
  };

  const handleRemove = async () => {
    if (!currentUser?.uid || !uid) return;
    if (onRemoveFriend) {
      onRemoveFriend();
      return;
    }
    try {
      await Promise.all([
        updateDoc(doc(db, "users", currentUser.uid), {
          friends: arrayRemove(uid),
        }),
        updateDoc(doc(db, "users", uid), {
          friends: arrayRemove(currentUser.uid),
        }),
      ]);
      if (onClose) onClose();
    } catch (e) {
      console.error("Failed to remove friend:", e);
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 3, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
        <Skeleton
          variant="circular"
          animation="wave"
          width={88}
          height={88}
          sx={{ bgcolor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)" }}
        />
        <Skeleton
          variant="rounded"
          animation="wave"
          width={160}
          height={22}
          sx={{ borderRadius: "8px", bgcolor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)" }}
        />
        <Skeleton
          variant="rounded"
          animation="wave"
          width={100}
          height={14}
          sx={{ borderRadius: "6px", bgcolor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)" }}
        />
        <Box sx={{ display: "flex", gap: 1.5, my: 1, width: "100%", justifyContent: "center" }}>
          {[1, 2, 3, 4].map((i) => (
            <Skeleton
              key={i}
              variant="rounded"
              animation="wave"
              width={56}
              height={44}
              sx={{ borderRadius: "12px", bgcolor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)" }}
            />
          ))}
        </Box>
        <Box sx={{ width: "100%", mt: 2, display: "flex", flexDirection: "column", gap: 1.5 }}>
          {[1, 2, 3].map((i) => (
            <Skeleton
              key={i}
              variant="rounded"
              animation="wave"
              width="100%"
              height={56}
              sx={{ borderRadius: "14px", bgcolor: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)" }}
            />
          ))}
        </Box>
      </Box>
    );
  }

  const name = details.name || details.displayName || "Friend";
  const username = details.username;
  const photoURL = safeImageUrl(details.photoURL);
  const phone = details.mobile || details.phoneNumber || details.phone || "";

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
            if (m === uid) return name;
            const mutual = mutualFriends.find((mf) => mf.id === m);
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

  return (
    <Box sx={{ p: 2, pt: 1, color: isDark ? "#fff" : "#111" }}>
      {/* ─── 1. Top Back Button ─── */}
      {onClose && (
        <Box sx={{ mb: 2 }}>
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
      )}

      {/* ─── 2. Hero Profile ─── */}
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          mt: 0.5,
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
        {profileData?.onOpenSearch && (
          <Box
            component={motion.div}
            whileHover={{ scale: 1.012 }}
            whileTap={{ scale: 0.988 }}
            onClick={() => {
              profileData.onOpenSearch();
              if (onClose) onClose();
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

        {/* Favorite Chat */}
        <Box
          component={motion.div}
          whileHover={{ scale: 1.012 }}
          whileTap={{ scale: 0.988 }}
          onClick={() => {
            const res = toggleFavoriteChat(uid);
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

        {/* Mute Notifications */}
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

        {/* Disappearing Messages */}
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

        {/* Mutual Friends */}
        <Box
          component={motion.div}
          whileHover={{ scale: 1.012 }}
          whileTap={{ scale: 0.988 }}
          onClick={() => {
            setMutualFriendsOpen(true);
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

        {/* Phone */}
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

        {/* Profile */}
        <Box
          component={motion.div}
          whileHover={{ scale: 1.012 }}
          whileTap={{ scale: 0.988 }}
          onClick={() => {
            const targetUsername = details?.username || profileData?.username;
            const targetUserParam = targetUsername ? `@${targetUsername.replace(/^@/, "")}` : (uid ? `@${uid}` : "");
            if (targetUserParam) navigate(`/profile/${targetUserParam}`);
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

        {/* Add a Nickname */}
        <Box
          component={motion.div}
          whileHover={{ scale: 1.012 }}
          whileTap={{ scale: 0.988 }}
          onClick={() => {
            setNicknameDrawerOpen(true);
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

      {/* ─── 4. Common Groups ─── */}
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

      {/* ─── 5. Common Trips ─── */}
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
          messages={profileData?.messages || []}
          onOpenImage={profileData?.onOpenImage}
          onJumpToMessage={profileData?.onJumpToMessage}
          isDark={isDark}
        />
      </Box>

      {/* ─── 6. Danger Actions ─── */}
      <Stack spacing={1.2} sx={{ mb: 1 }}>
        <Button
          fullWidth
          component={motion.button}
          whileHover={{ scale: 1.012 }}
          whileTap={{ scale: 0.988 }}
          startIcon={
            <DeleteOutlineIcon sx={{ color: "#ef4444", fontSize: 22 }} />
          }
          onClick={onClearChat}
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

        <Button
          fullWidth
          component={motion.button}
          whileHover={{ scale: 1.012 }}
          whileTap={{ scale: 0.988 }}
          startIcon={<BlockIcon sx={{ color: "#ef4444", fontSize: 22 }} />}
          onClick={handleToggleBlock}
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

        <Button
          fullWidth
          component={motion.button}
          whileHover={{ scale: 1.012 }}
          whileTap={{ scale: 0.988 }}
          startIcon={
            <RemoveCircleOutlineIcon sx={{ color: "#ef4444", fontSize: 22 }} />
          }
          onClick={handleRemove}
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

      {/* Mute Duration Dialog */}
      <Dialog
        open={muteDialogOpen}
        onClose={() => setMuteDialogOpen(false)}
        PaperProps={{
          sx: {
            borderRadius: "20px",
            bgcolor: isDark ? "#18181c" : "#ffffff",
            color: isDark ? "#fff" : "#111",
            p: 1,
            minWidth: 290,
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, fontSize: "1.1rem" }}>
          Mute Notifications
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2, opacity: 0.75 }}>
            Other participants will not see that you muted this chat.
          </Typography>
          <Stack spacing={1}>
            <Button
              variant="outlined"
              fullWidth
              onClick={() => {
                muteChat(uid, 8 * 60 * 60 * 1000);
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
                muteChat(uid, 7 * 24 * 60 * 60 * 1000);
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
                muteChat(uid, null);
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
                  unmuteChat(uid);
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
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMuteDialogOpen(false)} sx={{ color: isDark ? "#fff" : "#111" }}>
            Cancel
          </Button>
        </DialogActions>
      </Dialog>

      {/* Disappearing Messages Dialog */}
      <Dialog
        open={disappearingDialogOpen}
        onClose={() => setDisappearingDialogOpen(false)}
        PaperProps={{
          sx: {
            borderRadius: "20px",
            bgcolor: isDark ? "#18181c" : "#ffffff",
            color: isDark ? "#fff" : "#111",
            p: 1,
            minWidth: 300,
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, fontSize: "1.1rem" }}>
          Disappearing Messages
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2, opacity: 0.75 }}>
            When turned on, new messages in this chat will disappear after the selected duration.
          </Typography>
          <RadioGroup
            value={disappearingDuration}
            onChange={(e) => {
              const dur = Number(e.target.value);
              setChatDisappearingDuration(uid, dur, "direct");
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
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDisappearingDialogOpen(false)} sx={{ color: isDark ? "#fff" : "#111" }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Mutual Friends Drawer */}
      <MutualFriendsDrawer
        open={mutualFriendsOpen}
        onClose={() => setMutualFriendsOpen(false)}
        mutualFriends={mutualFriends}
        effectiveChatTheme={isDark ? "dark" : "light"}
      />

      {/* Add / Edit Nickname Drawer */}
      <AddNicknameDrawer
        open={nicknameDrawerOpen}
        onClose={() => setNicknameDrawerOpen(false)}
        initialNickname={nickname}
        onSave={handleSaveNickname}
        effectiveChatTheme={isDark ? "dark" : "light"}
      />
    </Box>
  );
};

export default React.memo(ChatProfilePanelContent);
