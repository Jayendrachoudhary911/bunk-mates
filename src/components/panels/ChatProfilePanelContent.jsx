// src/components/panels/ChatProfilePanelContent.jsx
import React, { useState, useMemo, useEffect } from "react";
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
import PermMediaOutlinedIcon from "@mui/icons-material/PermMediaOutlined";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useThemeToggle } from "../../contexts/ThemeToggleContext";
import { useCall } from "../../contexts/CallContext";
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
  const { startCall } = useCall();

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

  // Active sub-view state: null | 'sharedMedia' | 'commonGroupsTrips' | 'mutualFriends'
  const [activeSubView, setActiveSubView] = useState(null);
  const [groupsTripsTab, setGroupsTripsTab] = useState("groups");

  // Search queries for sub-pages
  const [mediaSearchQuery, setMediaSearchQuery] = useState("");
  const [groupsTripsSearchQuery, setGroupsTripsSearchQuery] = useState("");
  const [mutualFriendsSearchQuery, setMutualFriendsSearchQuery] = useState("");

  // Inline Nickname Accordion State
  const [isEditingNickname, setIsEditingNickname] = useState(false);
  const [nicknameInput, setNicknameInput] = useState(profileData?.nickname || "");
  const [nickname, setNickname] = useState(profileData?.nickname || "");

  // Dynamic Profile Color Extractor State
  const [avatarColor, setAvatarColor] = useState(isDark ? "#2a2a2e" : "#e0e0e0");

  const photoURL = safeImageUrl(details.photoURL);

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

  const handleSaveNickname = async (newNick) => {
    if (!currentUser?.uid || !uid) return;
    try {
      await updateDoc(doc(db, "users", currentUser.uid), {
        [`nicknames.${uid}`]: newNick.trim(),
      });
      setNickname(newNick.trim());
      setNicknameInput(newNick.trim());
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
  const [muteDuration, setMuteDuration] = useState("8h");
  const [disappearingDialogOpen, setDisappearingDialogOpen] = useState(false);

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
          const currSnap = await getDoc(doc(db, "users", currentUser.uid));
          if (currSnap.exists() && isMounted) {
            const currData = currSnap.data();
            const blocked = (currData.blockedUids || []).includes(uid);
            setIsBlocked(blocked);
            if (currData.nicknames && currData.nicknames[uid]) {
              setNickname(currData.nicknames[uid]);
              setNicknameInput(currData.nicknames[uid]);
            }

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
                  } catch (e) {}
                  return null;
                })
              );
              fetchedMutual = mutualUsers.filter(Boolean);
              if (isMounted) setMutualFriends(fetchedMutual);
            }
          }

          const groupsSnap = await getDocs(
            query(collection(db, "groupChats"), where("members", "array-contains", currentUser.uid))
          );
          fetchedGroups = groupsSnap.docs
            .map((d) => ({ id: d.id, ...d.data() }))
            .filter((g) => (g.members || []).map(String).includes(String(uid)));
          if (isMounted) setCommonGroups(fetchedGroups);

          const tripsSnap = await getDocs(
            query(collection(db, "trips"), where("members", "array-contains", currentUser.uid))
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
        updateDoc(doc(db, "users", currentUser.uid), { friends: arrayRemove(uid) }),
        updateDoc(doc(db, "users", uid), { friends: arrayRemove(currentUser.uid) }),
      ]);
      if (onClose) onClose();
    } catch (e) {
      console.error("Failed to remove friend:", e);
    }
  };

  const sharedMedia = useMemo(() => {
    const list = [];
    const messages = profileData?.messages || [];
    (messages || []).forEach((m) => {
      if (m.dataUri) list.push({ url: m.dataUri, msgId: m.id });
      if (m.imageUrl) list.push({ url: m.imageUrl, msgId: m.id });
      if (Array.isArray(m.images)) {
        m.images.forEach((img) => {
          if (img) list.push({ url: img, msgId: m.id });
        });
      }
    });
    return list;
  }, [profileData?.messages]);

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
    return commonGroups.filter((g) => (g.name || g.groupName || "").toLowerCase().includes(q));
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

  const handleStartAudioCall = () => {
    if (!details) return;
    startCall({ id: uid, uid, name: details.name || details.displayName || "Friend", photoURL, username }, "audio");
  };

  const handleStartVideoCall = () => {
    if (!details) return;
    startCall({ id: uid, uid, name: details.name || details.displayName || "Friend", photoURL, username }, "video");
  };

  const handleConfirmMute = () => {
    let durationMs = 8 * 60 * 60 * 1000;
    if (muteDuration === "1w") durationMs = 7 * 24 * 60 * 60 * 1000;
    if (muteDuration === "forever") durationMs = null;
    muteChat(uid, durationMs);
    setIsMuted(true);
    setMuteDialogOpen(false);
  };

  const formatGroupMembers = (group) => {
    if (group.memberNames && Array.isArray(group.memberNames) && group.memberNames.length > 0) {
      return group.memberNames.join(", ");
    }
    if (Array.isArray(group.members)) {
      const names = group.members
        .map((m) => {
          if (typeof m === "object" && m !== null) return m.displayName || m.name || m.username;
          if (typeof m === "string") {
            if (m === uid) return details.name || details.displayName || "Friend";
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

  const internalDivider = (
    <Divider sx={{ borderColor: isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.05)", my: 0, mx: 3 }} />
  );

  const bounceTransition = { type: "spring", stiffness: 400, damping: 17 };

  if (loading) {
    return (
      <Box sx={{ p: 3, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
        <Skeleton variant="circular" animation="wave" width={88} height={88} sx={{ bgcolor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)" }} />
        <Skeleton variant="rounded" animation="wave" width={160} height={22} sx={{ borderRadius: "8px", bgcolor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)" }} />
        <Skeleton variant="rounded" animation="wave" width={100} height={14} sx={{ borderRadius: "6px", bgcolor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)" }} />
      </Box>
    );
  }

  const name = details.name || details.displayName || "Friend";
  const username = details.username;
  const phone = details.mobile || details.phoneNumber || details.phone || "";

  return (
    <Box sx={{ p: 2.5, pt: 2, pb: 4, color: isDark ? "#fff" : "#111", position: "relative", overflowX: "hidden" }}>
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
          {/* ─── 1. SUB-VIEW: SHARED MEDIA ─── */}
          {activeSubView === "sharedMedia" && (
            <motion.div
              key="subview-shared-media"
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
                  onClick={() => setActiveSubView(null)}
                  startIcon={<ArrowBackIcon sx={{ fontSize: 18 }} />}
                  sx={{
                    color: isDark ? "#fff" : "#111",
                    bgcolor: isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.06)",
                    borderRadius: "999px",
                    px: 2,
                    py: 0.6,
                    textTransform: "none",
                    fontWeight: 600,
                  }}
                >
                  Back to Profile
                </Button>
              </Box>

              <Typography sx={{ fontSize: "1.25rem", fontWeight: 700, mb: 2 }}>Shared Media & Files</Typography>

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

              <SharedMediaLinksWidgetsTabs
                messages={profileData?.messages || []}
                searchQuery={mediaSearchQuery}
                onOpenImage={profileData?.onOpenImage}
                onJumpToMessage={profileData?.onJumpToMessage}
                isDark={isDark}
              />
            </motion.div>
          )}

          {/* ─── 2. SUB-VIEW: COMMON GROUPS & TRIPS ─── */}
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
                    fontWeight: 600,
                  }}
                >
                  Back to Profile
                </Button>
              </Box>

              <Typography sx={{ fontSize: "1.25rem", fontWeight: 700, mb: 2 }}>Shared Spaces</Typography>

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
                <Box sx={{ bgcolor: isDark ? "#161618" : "#ffffff", borderRadius: "16px", overflow: "hidden" }}>
                  {filteredCommonGroups.length === 0 ? (
                    <Box sx={{ p: 3, textAlign: "center" }}>
                      <Typography sx={{ opacity: 0.5 }}>No common groups found</Typography>
                    </Box>
                  ) : (
                    filteredCommonGroups.map((group, idx) => {
                      const groupName = group.name || group.groupName || "Group";
                      const groupPhoto = safeImageUrl(group.iconURL || group.photoURL || group.image);
                      return (
                        <React.Fragment key={group.id || groupName}>
                          <Box
                            component={motion.div}
                            whileHover={{ scale: 1.01, bgcolor: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)" }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => navigate(`/group/${encodeURIComponent(groupName)}`)}
                            sx={{ display: "flex", alignItems: "center", gap: 1.6, p: 1.6, cursor: "pointer" }}
                          >
                            <Avatar src={groupPhoto} sx={{ width: 44, height: 44, bgcolor: isDark ? "#28282b" : "#e2e2e6" }}>
                              {group.emoji || groupName[0]?.toUpperCase() || "G"}
                            </Avatar>
                            <Box sx={{ minWidth: 0, flex: 1 }}>
                              <Typography sx={{ fontWeight: 700, fontSize: "0.96rem", mb: 0.3 }} noWrap>{groupName}</Typography>
                              <Typography sx={{ fontSize: "0.82rem", opacity: 0.6 }} noWrap>{formatGroupMembers(group)}</Typography>
                            </Box>
                          </Box>
                          {idx < filteredCommonGroups.length - 1 && internalDivider}
                        </React.Fragment>
                      );
                    })
                  )}
                </Box>
              ) : (
                <Box sx={{ bgcolor: isDark ? "#161618" : "#ffffff", borderRadius: "16px", overflow: "hidden" }}>
                  {filteredCommonTrips.length === 0 ? (
                    <Box sx={{ p: 3, textAlign: "center" }}>
                      <Typography sx={{ opacity: 0.5 }}>No common trips found</Typography>
                    </Box>
                  ) : (
                    filteredCommonTrips.map((trip, idx) => {
                      const tripName = trip.name || trip.title || "Trip";
                      const route = `${trip.from || trip.location || "Trip"} → ${trip.to || trip.location || "Trip"}`;
                      const dates = trip.startDate && trip.endDate ? `${trip.startDate} → ${trip.endDate}` : trip.startDate || trip.date || "Upcoming";
                      return (
                        <React.Fragment key={trip.id || tripName}>
                          <Box
                            component={motion.div}
                            whileHover={{ scale: 1.01, bgcolor: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)" }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => navigate(`/trips`)}
                            sx={{ p: 2, cursor: "pointer" }}
                          >
                            <Typography sx={{ fontWeight: 700, fontSize: "1.1rem", mb: 1 }}>{tripName}</Typography>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.6 }}>
                              <PlaceIcon sx={{ fontSize: 16, opacity: 0.6 }} />
                              <Typography sx={{ fontSize: "0.88rem", opacity: 0.7 }}>{route}</Typography>
                            </Box>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                              <AccessTimeIcon sx={{ fontSize: 16, opacity: 0.6 }} />
                              <Typography sx={{ fontSize: "0.88rem", opacity: 0.7 }}>{dates}</Typography>
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

          {/* ─── 3. SUB-VIEW: MUTUAL FRIENDS ─── */}
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
                    fontWeight: 600,
                  }}
                >
                  Back to Profile
                </Button>
              </Box>

              <Typography sx={{ fontSize: "1.25rem", fontWeight: 700, mb: 2 }}>Mutual Friends ({mutualFriends.length})</Typography>

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

              <Box sx={{ bgcolor: isDark ? "#161618" : "#ffffff", borderRadius: "16px", overflow: "hidden" }}>
                {filteredMutualFriends.length === 0 ? (
                  <Box sx={{ p: 3, textAlign: "center" }}>
                    <Typography sx={{ opacity: 0.5 }}>No mutual friends found</Typography>
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
                          whileHover={{ scale: 1.01, bgcolor: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)" }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => {
                            const userParam = mUsername ? `@${mUsername.replace(/^@/, "")}` : (friend.id ? `@${friend.id}` : "");
                            if (userParam) navigate(`/profile/${userParam}`);
                          }}
                          sx={{ display: "flex", alignItems: "center", gap: 1.6, p: 1.6, cursor: "pointer" }}
                        >
                          <Avatar src={mPhoto} sx={{ width: 44, height: 44, bgcolor: isDark ? "#28282b" : "#e2e2e6" }}>
                            {mName[0]?.toUpperCase() || "M"}
                          </Avatar>
                          <Box sx={{ minWidth: 0, flex: 1 }}>
                            <Typography sx={{ fontWeight: 700, fontSize: "0.96rem", mb: 0.3 }} noWrap>{mName}</Typography>
                            {mUsername && <Typography sx={{ fontSize: "0.82rem", opacity: 0.6 }} noWrap>@{mUsername}</Typography>}
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

          {/* ─── 4. MAIN PROFILE PANEL VIEW ─── */}
          {activeSubView === null && (
            <motion.div
              key="profile-main"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            >
              {/* Top Back Button */}
              {onClose && (
                <Box sx={{ display: "flex", alignItems: "center", mt: 1, mb: 1 }}>
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
                    }}
                  >
                    <ArrowBackIcon sx={{ fontSize: 21 }} />
                  </IconButton>
                </Box>
              )}

              {/* Hero Profile */}
              <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", mt: 1, mb: 3 }}>
                <Avatar
                  src={photoURL}
                  alt={name}
                  sx={{
                    width: 104,
                    height: 104,
                    mb: 1.5,
                    bgcolor: isDark ? "#232326" : "#e0e0e0",
                    color: isDark ? "#ffffff" : "#111111",
                    fontSize: "2.4rem",
                    fontWeight: 700,
                  }}
                >
                  {name?.[0] || "?"}
                </Avatar>

                <Typography sx={{ fontWeight: 700, fontSize: "1.35rem", lineHeight: 1.25, mb: 0.3 }}>
                  {name}
                </Typography>

                {username && (
                  <Typography sx={{ fontSize: "0.9rem", opacity: 0.55, mb: 1 }}>
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
                    fontSize: "0.82rem",
                    fontWeight: 500,
                  }}
                >
                  {nickname || name}
                </Box>
              </Box>

              {/* 4x1 Grid Options */}
              <Box sx={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 1, mb: 3.5 }}>
                {[
                  { label: "Search", icon: <SearchIcon sx={{ fontSize: 22, mb: 0.5 }} />, onClick: () => { if (profileData?.onOpenSearch) profileData.onOpenSearch(); if (onClose) onClose(); } },
                  { label: "Call", icon: <PhoneOutlinedIcon sx={{ fontSize: 22, mb: 0.5 }} />, onClick: handleStartAudioCall },
                  { label: "Video", icon: <VideocamOutlinedIcon sx={{ fontSize: 22, mb: 0.5 }} />, onClick: handleStartVideoCall },
                  { label: "Profile", icon: <PersonOutlineIcon sx={{ fontSize: 22, mb: 0.5 }} />, onClick: () => { const userParam = username ? `@${username.replace(/^@/, "")}` : (uid ? `@${uid}` : ""); if (userParam) navigate(`/profile/${userParam}`); } },
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
                    <Typography sx={{ fontSize: "0.75rem", fontWeight: 600 }}>{item.label}</Typography>
                  </Box>
                ))}
              </Box>

              {/* Options Section */}
              <Box sx={{ bgcolor: isDark ? "#f1f1f106" : "#0c0c0c05", borderRadius: 6, overflow: "hidden", mb: 3.5, py: 0.5 }}>
                {/* Shared in Chat Option Button */}
                <Box
                  component={motion.div}
                  whileHover={{ scale: 1.01, bgcolor: isDark ? "rgba(255, 255, 255, 0.03)" : "rgba(0, 0, 0, 0.02)" }}
                  whileTap={{ scale: 0.98 }}
                  transition={bounceTransition}
                  onClick={() => setActiveSubView("sharedMedia")}
                  sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: 2, py: 1.4, cursor: "pointer" }}
                >
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <PermMediaOutlinedIcon sx={{ fontSize: 21, mr: 2, opacity: 0.8 }} />
                    <Typography sx={{ fontSize: "0.95rem", fontWeight: 500 }}>Shared in Chat</Typography>
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Chip label={`${sharedMedia.length}`} size="small" sx={{ fontWeight: 600, fontSize: "0.75rem" }} />
                    <ChevronRightIcon sx={{ fontSize: 20, opacity: 0.5 }} />
                  </Box>
                </Box>

                {internalDivider}

                {/* Contact Info */}
                <Box sx={{ display: "flex", alignItems: "center", px: 2, py: 1.4, cursor: phone ? "pointer" : "default" }} onClick={() => phone && window.open(`tel:${phone}`, "_self")}>
                  <PhoneOutlinedIcon sx={{ fontSize: 20, mr: 2, opacity: 0.8 }} />
                  <Box>
                    <Typography sx={{ fontSize: "0.72rem", fontWeight: 600, opacity: 0.5 }}>Contact Info</Typography>
                    <Typography sx={{ fontSize: "0.92rem", fontWeight: 500 }}>{phone || "No phone added"}</Typography>
                  </Box>
                </Box>

                {internalDivider}

                {/* Nickname Accordion */}
                <Accordion
                  expanded={isEditingNickname}
                  onChange={(e, expanded) => setIsEditingNickname(expanded)}
                  disableGutters
                  elevation={0}
                  sx={{ bgcolor: "transparent", color: "inherit", "&:before": { display: "none" } }}
                >
                  <AccordionSummary sx={{ px: 2, py: 0, minHeight: "auto", "& .MuiAccordionSummary-content": { my: 1.4, alignItems: "center", justifyContent: "space-between" }, "&:hover": { bgcolor: "transparent" } }}>
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <TextFieldsIcon sx={{ fontSize: 21, mr: 2, opacity: 0.8 }} />
                      <Typography sx={{ fontSize: "0.95rem", fontWeight: 500 }}>{nickname ? "Edit Nickname" : "Add a Nickname"}</Typography>
                    </Box>
                    <Typography sx={{ fontSize: "0.82rem", fontWeight: 600, opacity: 0.6 }}>{nickname || "Add"}</Typography>
                  </AccordionSummary>
                  <AccordionDetails sx={{ px: 2, pb: 2, pt: 0 }}>
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.2 }}>
                      <TextField
                        fullWidth
                        size="small"
                        placeholder="Enter nickname..."
                        value={nicknameInput}
                        onChange={(e) => setNicknameInput(e.target.value)}
                        autoFocus
                        sx={{ "& .MuiOutlinedInput-root": { borderRadius: 8, bgcolor: isDark ? "#222222" : "#d4d4d4", "& fieldset": { border: "none" } } }}
                      />
                      <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1 }}>
                        <Button size="small" onClick={(e) => { e.stopPropagation(); setNicknameInput(nickname || ""); setIsEditingNickname(false); }} sx={{ textTransform: "none", fontWeight: 600 }}>Cancel</Button>
                        <Button size="small" variant="contained" onClick={(e) => { e.stopPropagation(); handleSaveNickname(nicknameInput); setIsEditingNickname(false); }} sx={{ textTransform: "none", fontWeight: 600, borderRadius: 8, boxShadow: "none" }}>Save</Button>
                      </Box>
                    </Box>
                  </AccordionDetails>
                </Accordion>

                {internalDivider}

                {/* Add to Favorites */}
                <Box onClick={() => setIsFavorite(toggleFavoriteChat(uid))} sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: 2, py: 1.4, cursor: "pointer" }}>
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    {isFavorite ? <StarRoundedIcon sx={{ color: "#ffb300", fontSize: 22, mr: 2 }} /> : <StarBorderRoundedIcon sx={{ fontSize: 22, mr: 2, opacity: 0.7 }} />}
                    <Typography sx={{ fontSize: "0.95rem", fontWeight: 500 }}>Add to Favorites</Typography>
                  </Box>
                  <Chip label={isFavorite ? "Favorited" : "Off"} size="small" sx={{ bgcolor: isFavorite ? "rgba(255, 179, 0, 0.15)" : "transparent", color: isFavorite ? "#ffb300" : "inherit", fontWeight: 600, fontSize: "0.75rem" }} />
                </Box>

                {internalDivider}

                {/* Mute Notifications */}
                <Box onClick={() => setMuteDialogOpen(true)} sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: 2, py: 1.4, cursor: "pointer" }}>
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    {isMuted ? <NotificationsOffOutlinedIcon sx={{ color: "#ef4444", fontSize: 21, mr: 2 }} /> : <NotificationsActiveOutlinedIcon sx={{ fontSize: 21, mr: 2, opacity: 0.7 }} />}
                    <Typography sx={{ fontSize: "0.95rem", fontWeight: 500 }}>Mute Notifications</Typography>
                  </Box>
                  <Chip label={isMuted ? "Muted" : "Unmuted"} size="small" sx={{ bgcolor: isMuted ? "rgba(239, 68, 68, 0.15)" : "transparent", color: isMuted ? "#ef4444" : "inherit", fontWeight: 600, fontSize: "0.75rem" }} />
                </Box>

                {internalDivider}

                {/* Disappearing Messages */}
                <Box onClick={() => setDisappearingDialogOpen(true)} sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: 2, py: 1.4, cursor: "pointer" }}>
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <TimelapseRoundedIcon sx={{ fontSize: 21, mr: 2, opacity: 0.8 }} />
                    <Typography sx={{ fontSize: "0.95rem", fontWeight: 500 }}>Disappearing Messages</Typography>
                  </Box>
                  <Chip label={disappearingDuration > 0 ? "On" : "Off"} size="small" sx={{ fontWeight: 600, fontSize: "0.75rem" }} />
                </Box>

                {internalDivider}

                {/* Mutual Friends Row */}
                <Box onClick={() => setActiveSubView("mutualFriends")} sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: 2, py: 1.4, cursor: "pointer" }}>
                  <Typography sx={{ fontSize: "0.95rem", fontWeight: 500 }}>{mutualFriends.length} Mutual Friends</Typography>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    {mutualFriends.length > 0 && (
                      <Avatar src={safeImageUrl(mutualFriends[0]?.photoURL)} sx={{ width: 28, height: 28, fontSize: "0.75rem" }}>
                        {mutualFriends[0]?.name?.[0] || "M"}
                      </Avatar>
                    )}
                    <ChevronRightIcon sx={{ fontSize: 20, opacity: 0.5 }} />
                  </Box>
                </Box>
              </Box>

              {/* Common Groups & Trips Shared Section */}
              <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.5, mb: 3.5 }}>
                <Box
                  onClick={() => { setGroupsTripsTab("groups"); setActiveSubView("commonGroupsTrips"); }}
                  sx={{ p: 2, borderRadius: 4, bgcolor: isDark ? "#161618" : "#fff", cursor: "pointer", textAlign: "center" }}
                >
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>{commonGroups.length}</Typography>
                  <Typography variant="caption" sx={{ opacity: 0.6 }}>Common Groups</Typography>
                </Box>
                <Box
                  onClick={() => { setGroupsTripsTab("trips"); setActiveSubView("commonGroupsTrips"); }}
                  sx={{ p: 2, borderRadius: 4, bgcolor: isDark ? "#161618" : "#fff", cursor: "pointer", textAlign: "center" }}
                >
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>{commonTrips.length}</Typography>
                  <Typography variant="caption" sx={{ opacity: 0.6 }}>Common Trips</Typography>
                </Box>
              </Box>

              {/* Danger Actions Section */}
              <Box sx={{ bgcolor: isDark ? "rgba(239, 68, 68, 0.08)" : "rgba(239, 68, 68, 0.05)", borderRadius: 6, overflow: "hidden", py: 0.5 }}>
                <Box onClick={onClearChat} sx={{ display: "flex", alignItems: "center", px: 2, py: 1.5, cursor: "pointer" }}>
                  <DeleteOutlineIcon sx={{ color: "#ef4444", fontSize: 21, mr: 2 }} />
                  <Typography sx={{ color: "#ef4444", fontSize: "0.95rem", fontWeight: 600 }}>Delete Chat</Typography>
                </Box>
                <Divider sx={{ borderColor: "rgba(239, 68, 68, 0.15)", my: 0 }} />
                <Box onClick={handleToggleBlock} sx={{ display: "flex", alignItems: "center", px: 2, py: 1.5, cursor: "pointer" }}>
                  <BlockIcon sx={{ color: "#ef4444", fontSize: 21, mr: 2 }} />
                  <Typography sx={{ color: "#ef4444", fontSize: "0.95rem", fontWeight: 600 }}>{isBlocked ? "Unblock Friend" : "Block Friend"}</Typography>
                </Box>
                <Divider sx={{ borderColor: "rgba(239, 68, 68, 0.15)", my: 0 }} />
                <Box onClick={handleRemove} sx={{ display: "flex", alignItems: "center", px: 2, py: 1.5, cursor: "pointer" }}>
                  <RemoveCircleOutlineIcon sx={{ color: "#ef4444", fontSize: 21, mr: 2 }} />
                  <Typography sx={{ color: "#ef4444", fontSize: "0.95rem", fontWeight: 600 }}>Remove from Friend</Typography>
                </Box>
              </Box>
            </motion.div>
          )}
        </AnimatePresence>
      </Box>

      {/* Mute Notifications Dialog */}
      <Dialog open={muteDialogOpen} onClose={() => setMuteDialogOpen(false)} PaperProps={{ sx: { borderRadius: "20px", bgcolor: isDark ? "#18181c" : "#fff", p: 2 } }}>
        <DialogTitle sx={{ fontWeight: 800 }}>Mute Notifications</DialogTitle>
        <DialogContent>
          <RadioGroup value={muteDuration} onChange={(e) => setMuteDuration(e.target.value)}>
            <FormControlLabel value="8h" control={<Radio />} label="8 Hours" />
            <FormControlLabel value="1w" control={<Radio />} label="1 Week" />
            <FormControlLabel value="forever" control={<Radio />} label="Always" />
          </RadioGroup>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMuteDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleConfirmMute}>Confirm</Button>
        </DialogActions>
      </Dialog>

      {/* Disappearing Messages Dialog */}
      <Dialog open={disappearingDialogOpen} onClose={() => setDisappearingDialogOpen(false)} PaperProps={{ sx: { borderRadius: "20px", bgcolor: isDark ? "#18181c" : "#fff", p: 2 } }}>
        <DialogTitle sx={{ fontWeight: 800 }}>Disappearing Messages</DialogTitle>
        <DialogContent>
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
              <FormControlLabel key={opt.value} value={opt.value} control={<Radio />} label={opt.label} />
            ))}
          </RadioGroup>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDisappearingDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default React.memo(ChatProfilePanelContent);