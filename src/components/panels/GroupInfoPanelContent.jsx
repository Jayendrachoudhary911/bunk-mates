// src/components/panels/GroupInfoPanelContent.jsx
import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Avatar,
  Button,
  Stack,
  IconButton,
  Tooltip,
  Skeleton,
  Chip,
  TextField,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  RadioGroup,
  FormControlLabel,
  Radio,
  SwipeableDrawer,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Checkbox,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Divider,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import PhoneOutlinedIcon from "@mui/icons-material/PhoneOutlined";
import ExitToAppOutlinedIcon from "@mui/icons-material/ExitToAppOutlined";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import SearchIcon from "@mui/icons-material/Search";
import PlaceIcon from "@mui/icons-material/Place";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import RemoveCircleOutlineIcon from "@mui/icons-material/RemoveCircleOutline";
import StarRoundedIcon from "@mui/icons-material/StarRounded";
import StarBorderRoundedIcon from "@mui/icons-material/StarBorderRounded";
import NotificationsOffOutlinedIcon from "@mui/icons-material/NotificationsOffOutlined";
import NotificationsActiveOutlinedIcon from "@mui/icons-material/NotificationsActiveOutlined";
import TimelapseRoundedIcon from "@mui/icons-material/TimelapseRounded";
import ShareIcon from "@mui/icons-material/Share";
import CloseIcon from "@mui/icons-material/Close";
import { QRCodeCanvas } from "qrcode.react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useThemeToggle } from "../../contexts/ThemeToggleContext";
import { db } from "../../firebase";
import {
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  updateDoc,
  arrayRemove,
  arrayUnion,
  collection,
  query,
  limit,
  serverTimestamp,
  addDoc,
} from "firebase/firestore";
import { safeImageUrl } from "../../utils/uiHelpers";
import { getCachedData, setCachedData, getCachedUser, setCachedUser } from "../../utils/chatCache";
import SharedMediaLinksWidgetsTabs from "../chats_components/SharedMediaLinksWidgetsTabs";
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

const GroupInfoPanelContent = ({ groupData, onClose }) => {
  const { user: currentUser } = useAuth();
  const { mode } = useThemeToggle();
  const isDark = mode === "dark";
  const navigate = useNavigate();
  const muiTheme = useTheme();
  const isDesktop = useMediaQuery(muiTheme.breakpoints.up("md"));

  // Resolve group identifier
  const resolvedGroupName =
    groupData?.id ||
    groupData?.groupName ||
    groupData?.name ||
    (typeof groupData === "string" ? groupData : "");

  const [groupInfo, setGroupInfo] = useState(() => {
    const fromProps = typeof groupData === "object" && groupData !== null ? groupData : {};
    if (fromProps.name) return fromProps;
    if (resolvedGroupName) {
      const cached = getCachedData(`group_info_${resolvedGroupName}`, null);
      if (cached) return { ...cached, ...fromProps };
    }
    return fromProps;
  });
  const [createdByUser, setCreatedByUser] = useState(() => {
    if (groupInfo.createdBy) {
      return getCachedUser(groupInfo.createdBy);
    }
    return null;
  });
  const [tripInfo, setTripInfo] = useState(null);
  const [memberInfo, setMemberInfo] = useState(() => {
    const initial = {};
    if (Array.isArray(groupInfo.members)) {
      groupInfo.members.forEach((uid) => {
        const u = getCachedUser(uid);
        if (u) initial[uid] = u;
      });
    }
    return initial;
  });
  const [loading, setLoading] = useState(() => !groupInfo?.name);
  const [memberSearch, setMemberSearch] = useState("");
  const [copiedLink, setCopiedLink] = useState(false);
  const [messages, setMessages] = useState(groupData?.messages || []);

  useEffect(() => {
    if (groupData?.messages && groupData.messages.length > 0) {
      setMessages(groupData.messages);
      return;
    }
    if (!resolvedGroupName) return;
    const unsub = onSnapshot(
      query(collection(db, "groupChat", resolvedGroupName, "messages"), limit(80)),
      (snap) => {
        const msgs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setMessages(msgs);
      }
    );
    return () => unsub();
  }, [resolvedGroupName, groupData?.messages]);

  // Add members drawer state
  const [addUserDialogOpen, setAddUserDialogOpen] = useState(false);
  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [userSearchResults, setUserSearchResults] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [searchingUsers, setSearchingUsers] = useState(false);

  // Invite & QR Drawer
  const [inviteDrawerOpen, setInviteDrawerOpen] = useState(false);

  // Confirm remove member dialog
  const [confirmRemoveUid, setConfirmRemoveUid] = useState(null);

  // Group Features: Favorites, Mute, Disappearing, Edit Settings
  const [isMuted, setIsMuted] = useState(() => isChatMuted(resolvedGroupName));
  const [isFavorite, setIsFavorite] = useState(() => isChatFavorite(resolvedGroupName));
  const [disappearingDuration, setDisappearingDurationState] = useState(() =>
    getChatDisappearingDuration(resolvedGroupName, groupInfo?.disappearingDuration)
  );
  const [muteDialogOpen, setMuteDialogOpen] = useState(false);
  const [disappearingDialogOpen, setDisappearingDialogOpen] = useState(false);

  // Edit Group Info Drawer state
  const [editingGroupInfo, setEditingGroupInfo] = useState(false);
  const [editName, setEditName] = useState(groupInfo.name || "");
  const [editDesc, setEditDesc] = useState(groupInfo.description || "");
  const [groupIconType, setGroupIconType] = useState(() =>
    groupInfo?.iconURL?.startsWith("http") ? "image" : "emoji"
  );
  const [groupIconValue, setGroupIconValue] = useState(() =>
    groupInfo?.emoji || groupInfo?.iconURL || "📍"
  );

  // Group Settings Drawer state
  const [groupSettingsOpen, setGroupSettingsOpen] = useState(false);
  const [searchMembersText, setSearchMembersText] = useState("");
  const [showSearchBar, setShowSearchBar] = useState(false);

  // Sync state whenever groupData changes
  useEffect(() => {
    if (groupData && typeof groupData === "object") {
      setGroupInfo((prev) => ({ ...prev, ...groupData }));
      setEditName(groupData.name || "");
      setEditDesc(groupData.description || "");
    }
    if (resolvedGroupName) {
      setIsMuted(isChatMuted(resolvedGroupName));
      setIsFavorite(isChatFavorite(resolvedGroupName));
      setDisappearingDurationState(
        getChatDisappearingDuration(resolvedGroupName, groupInfo?.disappearingDuration)
      );
    }
  }, [resolvedGroupName, groupData, groupInfo?.disappearingDuration]);

  // 1. Sync group document in real-time
  useEffect(() => {
    if (!resolvedGroupName) return;

    // Check cached info for instant 0ms load
    const cached = getCachedData(`group_info_${resolvedGroupName}`, null);
    if (cached) {
      setGroupInfo((prev) => ({ ...cached, ...prev }));
      setLoading(false);
    }

    const groupRef = doc(db, "groupChats", resolvedGroupName);
    const unsubscribe = onSnapshot(
      groupRef,
      async (snap) => {
        if (snap.exists()) {
          const data = { id: snap.id, ...snap.data() };
          setGroupInfo(data);
          setCachedData(`group_info_${resolvedGroupName}`, data);
          setLoading(false);

          // Fetch creator if not cached
          if (data.createdBy) {
            const cachedCreator = getCachedUser(data.createdBy);
            if (cachedCreator) {
              setCreatedByUser(cachedCreator);
            } else {
              getDoc(doc(db, "users", data.createdBy))
                .then((uSnap) => {
                  if (uSnap.exists()) {
                    const cData = uSnap.data();
                    setCreatedByUser(cData);
                    setCachedUser(data.createdBy, cData);
                  }
                })
                .catch(() => {});
            }
          }

          // Fetch member profiles using local cache
          if (Array.isArray(data.members) && data.members.length > 0) {
            const fetched = {};
            const missingUids = [];

            data.members.forEach((uid) => {
              const uCached = getCachedUser(uid);
              if (uCached) {
                fetched[uid] = uCached;
              } else {
                missingUids.push(uid);
              }
            });

            if (Object.keys(fetched).length > 0) {
              setMemberInfo((prev) => ({ ...prev, ...fetched }));
            }

            if (missingUids.length > 0) {
              Promise.all(
                missingUids.map(async (uid) => {
                  try {
                    const uSnap = await getDoc(doc(db, "users", uid));
                    if (uSnap.exists()) {
                      const uData = uSnap.data();
                      setCachedUser(uid, uData);
                      return { uid, ...uData };
                    }
                  } catch {
                    // ignore
                  }
                  return null;
                })
              ).then((results) => {
                const newProfiles = {};
                results.forEach((r) => {
                  if (r) newProfiles[r.uid] = r;
                });
                setMemberInfo((prev) => ({ ...prev, ...newProfiles }));
              });
            }
          }

          // Fetch trip info if group has tripId
          if (data.tripId) {
            try {
              const tripSnap = await getDoc(doc(db, "trips", data.tripId));
              if (tripSnap.exists()) {
                setTripInfo({ id: tripSnap.id, ...tripSnap.data() });
              }
            } catch {
              // ignore
            }
          }
        } else {
          setLoading(false);
        }
      },
      (err) => {
        console.warn("Group snapshot listener error:", err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [resolvedGroupName]);

  // Search users to add
  useEffect(() => {
    if (userSearchTerm.trim().length < 2) {
      setUserSearchResults([]);
      return;
    }

    let isMounted = true;
    const searchTimer = setTimeout(async () => {
      setSearchingUsers(true);
      try {
        const q = query(collection(db, "users"), limit(40));
        const snap = await getDocs(q);
        if (isMounted) {
          const lower = userSearchTerm.toLowerCase();
          const existingMembers = groupInfo.members || [];
          const matched = snap.docs
            .map((d) => ({ uid: d.id, ...d.data() }))
            .filter(
              (u) =>
                !existingMembers.includes(u.uid) &&
                (u.name?.toLowerCase().includes(lower) ||
                  u.displayName?.toLowerCase().includes(lower) ||
                  u.username?.toLowerCase().includes(lower))
            );
          setUserSearchResults(matched);
        }
      } catch (e) {
        console.error("Failed to search users:", e);
      } finally {
        if (isMounted) setSearchingUsers(false);
      }
    }, 280);

    return () => {
      isMounted = false;
      clearTimeout(searchTimer);
    };
  }, [userSearchTerm, groupInfo.members]);

  const handleRemoveMember = async () => {
    if (!resolvedGroupName || !confirmRemoveUid) return;
    try {
      const groupRef = doc(db, "groupChats", resolvedGroupName);
      await updateDoc(groupRef, {
        members: arrayRemove(confirmRemoveUid),
      });

      await addDoc(
        collection(db, "groupChat", resolvedGroupName, "messages"),
        {
          type: "system",
          content: `${memberInfo[confirmRemoveUid]?.name || "A member"} was removed from the group.`,
          timestamp: serverTimestamp(),
        }
      );
      setConfirmRemoveUid(null);
    } catch (e) {
      console.error("Failed to remove member:", e);
    }
  };

  const handleExitGroup = async () => {
    if (!resolvedGroupName || !currentUser?.uid) return;
    if (groupInfo.isSystem) {
      alert("You cannot exit a system group.");
      return;
    }
    if (
      !window.confirm(
        `Are you sure you want to leave ${groupInfo.name || resolvedGroupName}?`
      )
    ) {
      return;
    }

    try {
      const groupRef = doc(db, "groupChats", resolvedGroupName);
      await updateDoc(groupRef, {
        members: arrayRemove(currentUser.uid),
      });

      await addDoc(
        collection(db, "groupChat", resolvedGroupName, "messages"),
        {
          type: "system",
          content: `${currentUser.displayName || "A user"} left the group.`,
          timestamp: serverTimestamp(),
        }
      );

      if (onClose) onClose();
      navigate("/chats");
    } catch (e) {
      console.error("Failed to exit group:", e);
    }
  };

  const handleCopyLink = () => {
    const link = `${window.location.origin}/group/${encodeURIComponent(resolvedGroupName)}`;
    navigator.clipboard.writeText(link).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    });
  };

  const isCreator = groupInfo?.createdBy === currentUser?.uid;
  const isAdmin =
    isCreator ||
    (Array.isArray(groupInfo?.admins) &&
      groupInfo.admins.includes(currentUser?.uid));
  const canAddMembers = groupInfo?.inviteAccess === "all" || isAdmin;
  const canEditGroupInfo = groupInfo?.editAccess === "all" || isAdmin;

  const handleUpdateGroupInfo = async () => {
    if (!resolvedGroupName || !editName.trim()) return;
    try {
      const updates = {
        name: editName.trim(),
        description: editDesc.trim(),
        iconURL: groupIconType === "image" ? groupIconValue : "",
        emoji: groupIconType === "emoji" ? groupIconValue : "",
      };
      await updateDoc(doc(db, "groupChats", resolvedGroupName), updates);
      setGroupInfo((prev) => ({ ...prev, ...updates }));
      setEditingGroupInfo(false);
    } catch (e) {
      console.error("Failed to update group info:", e);
    }
  };

  const handlePermissionChange = async (field, value) => {
    if (!resolvedGroupName) return;
    try {
      await updateDoc(doc(db, "groupChats", resolvedGroupName), {
        [field]: value,
      });
      setGroupInfo((prev) => ({ ...prev, [field]: value }));
    } catch (e) {
      console.error("Failed to update permission:", e);
    }
  };

  const toggleAdminStatus = async (uidToToggle) => {
    if (!resolvedGroupName || !uidToToggle) return;
    const currentAdmins = groupInfo.admins || [];
    const isCurrentlyAdmin = currentAdmins.includes(uidToToggle);
    try {
      if (isCurrentlyAdmin) {
        await updateDoc(doc(db, "groupChats", resolvedGroupName), {
          admins: arrayRemove(uidToToggle),
        });
        setGroupInfo((prev) => ({
          ...prev,
          admins: (prev.admins || []).filter((id) => id !== uidToToggle),
        }));
      } else {
        await updateDoc(doc(db, "groupChats", resolvedGroupName), {
          admins: arrayUnion(uidToToggle),
        });
        setGroupInfo((prev) => ({
          ...prev,
          admins: [...(prev.admins || []), uidToToggle],
        }));
      }
    } catch (e) {
      console.error("Failed to toggle admin status:", e);
    }
  };

  const handleBatchAddUsers = async () => {
    if (!resolvedGroupName || selectedUsers.length === 0) return;
    try {
      const groupRef = doc(db, "groupChats", resolvedGroupName);
      await updateDoc(groupRef, {
        members: arrayUnion(...selectedUsers),
      });

      const userNames = selectedUsers
        .map((uid) => {
          const u = userSearchResults.find((usr) => usr.uid === uid);
          return u?.name || u?.username || "A user";
        })
        .join(", ");

      await addDoc(collection(db, "groupChat", resolvedGroupName, "messages"), {
        type: "system",
        content: `${userNames} was added to the group.`,
        timestamp: serverTimestamp(),
      });

      setSelectedUsers([]);
      setUserSearchTerm("");
      setAddUserDialogOpen(false);
    } catch (e) {
      console.error("Failed to batch add users:", e);
    }
  };

  // Filter members by search input
  const allMembers = groupInfo.members || [];
  const filteredMembers = allMembers.filter((mUid) => {
    if (!memberSearch.trim()) return true;
    const info = memberInfo[mUid];
    const term = memberSearch.toLowerCase();
    return (
      info?.name?.toLowerCase().includes(term) ||
      info?.username?.toLowerCase().includes(term) ||
      mUid.toLowerCase().includes(term)
    );
  });

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
          width={180}
          height={22}
          sx={{ borderRadius: "8px", bgcolor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)" }}
        />
        <Skeleton
          variant="rounded"
          animation="wave"
          width={110}
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
          {[1, 2, 3, 4].map((i) => (
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

  const groupDisplayName = groupInfo.name || resolvedGroupName || "Group";
  const groupPhoto = safeImageUrl(
    groupInfo.iconURL || groupInfo.photoURL || groupInfo.image
  );

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

      {/* ─── 2. Hero Profile: Large Avatar, Name, Description ─── */}
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
          src={groupPhoto}
          alt={groupDisplayName}
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
          {groupInfo.emoji || groupDisplayName[0]?.toUpperCase() || "G"}
        </Avatar>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.3 }}>
          <Typography
            sx={{
              fontWeight: 700,
              color: isDark ? "#ffffff" : "#111111",
              letterSpacing: "-0.4px",
              fontSize: "1.35rem",
              lineHeight: 1.25,
            }}
          >
            {groupDisplayName}
          </Typography>

          {groupDisplayName === "BM - Beta members" && (
            <Chip
              label="🔒 Beta"
              size="small"
              sx={{
                bgcolor: "rgba(0, 247, 33, 0.15)",
                color: "#00f721",
                fontWeight: 700,
                fontSize: "0.72rem",
                height: 22,
                borderRadius: "6px",
              }}
            />
          )}
          {groupDisplayName === "BM - Dev Beta" && (
            <Chip
              label="🧪 Dev Beta"
              size="small"
              sx={{
                bgcolor: "rgba(102, 204, 255, 0.15)",
                color: "#66ccff",
                fontWeight: 700,
                fontSize: "0.72rem",
                height: 22,
                borderRadius: "6px",
              }}
            />
          )}
        </Box>

        <Typography
          sx={{
            color: isDark
              ? "rgba(255, 255, 255, 0.55)"
              : "rgba(0, 0, 0, 0.55)",
            fontSize: "0.88rem",
            mb: 1,
          }}
        >
          {allMembers.length} Members
        </Typography>

        {groupInfo.description && (
          <Typography
            sx={{
              color: isDark
                ? "rgba(255, 255, 255, 0.72)"
                : "rgba(0, 0, 0, 0.72)",
              fontSize: "0.88rem",
              lineHeight: 1.4,
              px: 2,
              mb: 1,
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
            }}
          >
            {groupInfo.description}
          </Typography>
        )}

        {createdByUser && (
          <Box
            sx={{
              display: "inline-flex",
              alignItems: "center",
              px: 1.8,
              py: 0.4,
              borderRadius: "999px",
              bgcolor: isDark
                ? "rgba(255, 255, 255, 0.08)"
                : "rgba(0, 0, 0, 0.06)",
              color: isDark
                ? "rgba(255, 255, 255, 0.85)"
                : "rgba(0, 0, 0, 0.85)",
              fontSize: "0.8rem",
              fontWeight: 500,
            }}
          >
            Created by {createdByUser.name || "BunkMate"}
          </Box>
        )}
      </Box>

      {/* ─── 3. Linked Trip Card (if any) ─── */}
      {tripInfo && (
        <Box
          component={motion.div}
          whileHover={{ scale: 1.012 }}
          whileTap={{ scale: 0.988 }}
          onClick={() => navigate(`/trips`)}
          sx={{
            mb: 3,
            p: 2,
            bgcolor: isDark ? "#161618" : "#ffffff",
            border: `1px solid ${
              isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.06)"
            }`,
            borderRadius: "18px",
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
              fontSize: "1.1rem",
              mb: 1,
            }}
          >
            {tripInfo.name || "Associated Trip"}
          </Typography>

          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.6 }}>
            <PlaceIcon
              sx={{
                fontSize: 16,
                color: isDark
                  ? "rgba(255, 255, 255, 0.6)"
                  : "rgba(0, 0, 0, 0.6)",
              }}
            />
            <Typography
              sx={{
                color: isDark
                  ? "rgba(255, 255, 255, 0.65)"
                  : "rgba(0, 0, 0, 0.65)",
                fontSize: "0.85rem",
              }}
            >
              {tripInfo.from || tripInfo.location || "Trip"} →{" "}
              {tripInfo.to || tripInfo.location || "Trip"}
            </Typography>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <AccessTimeIcon
              sx={{
                fontSize: 16,
                color: isDark
                  ? "rgba(255, 255, 255, 0.6)"
                  : "rgba(0, 0, 0, 0.6)",
              }}
            />
            <Typography
              sx={{
                color: isDark
                  ? "rgba(255, 255, 255, 0.65)"
                  : "rgba(0, 0, 0, 0.65)",
                fontSize: "0.85rem",
              }}
            >
              {tripInfo.startDate && tripInfo.endDate
                ? `${tripInfo.startDate} → ${tripInfo.endDate}`
                : tripInfo.startDate || "Upcoming"}
            </Typography>
          </Box>
        </Box>
      )}

      {/* ─── 4. Quick Actions Stack: Search, Add Member & Copy Link ─── */}
      <Stack spacing={1} sx={{ mb: 3 }}>
        {groupData?.onOpenSearch && (
          <Button
            fullWidth
            component={motion.button}
            whileHover={{ scale: 1.012 }}
            whileTap={{ scale: 0.988 }}
            startIcon={<SearchIcon sx={{ color: isDark ? "#00b7ff" : "#0288d1" }} />}
            onClick={() => {
              groupData.onOpenSearch();
              if (onClose) onClose();
            }}
            sx={{
              py: 1.2,
              borderRadius: "14px",
              bgcolor: isDark ? "#161618" : "#ffffff",
              border: `1px solid ${
                isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.06)"
              }`,
              color: isDark ? "#fff" : "#111",
              textTransform: "none",
              fontWeight: 600,
              fontSize: "0.9rem",
              boxShadow: "none",
              "&:hover": {
                bgcolor: isDark ? "#1d1d21" : "#f0f0f2",
                boxShadow: "none",
              },
            }}
          >
            Search in Chat
          </Button>
        )}

        {canEditGroupInfo && (
          <Button
            fullWidth
            component={motion.button}
            whileHover={{ scale: 1.012 }}
            whileTap={{ scale: 0.988 }}
            startIcon={<EditIcon sx={{ color: isDark ? "#00b7ff" : "#0288d1" }} />}
            onClick={() => setEditingGroupInfo(true)}
            sx={{
              py: 1.2,
              borderRadius: "14px",
              bgcolor: isDark ? "#161618" : "#ffffff",
              border: `1px solid ${
                isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.06)"
              }`,
              color: isDark ? "#fff" : "#111",
              textTransform: "none",
              fontWeight: 600,
              fontSize: "0.9rem",
              boxShadow: "none",
              "&:hover": {
                bgcolor: isDark ? "#1d1d21" : "#f0f0f2",
                boxShadow: "none",
              },
            }}
          >
            Edit Group Info
          </Button>
        )}

        {isAdmin && (
          <Button
            fullWidth
            component={motion.button}
            whileHover={{ scale: 1.012 }}
            whileTap={{ scale: 0.988 }}
            startIcon={<SettingsOutlinedIcon sx={{ color: isDark ? "#00b7ff" : "#0288d1" }} />}
            onClick={() => setGroupSettingsOpen(true)}
            sx={{
              py: 1.2,
              borderRadius: "14px",
              bgcolor: isDark ? "#161618" : "#ffffff",
              border: `1px solid ${
                isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.06)"
              }`,
              color: isDark ? "#fff" : "#111",
              textTransform: "none",
              fontWeight: 600,
              fontSize: "0.9rem",
              boxShadow: "none",
              "&:hover": {
                bgcolor: isDark ? "#1d1d21" : "#f0f0f2",
                boxShadow: "none",
              },
            }}
          >
            Group Settings
          </Button>
        )}

        {canAddMembers && (
          <Button
            fullWidth
            component={motion.button}
            whileHover={{ scale: 1.012 }}
            whileTap={{ scale: 0.988 }}
            startIcon={<AddIcon />}
            onClick={() => setAddUserDialogOpen(true)}
            sx={{
              py: 1.2,
              borderRadius: "14px",
              bgcolor: isDark ? "#1e1e22" : "#e8e9ec",
              color: isDark ? "#fff" : "#111",
              textTransform: "none",
              fontWeight: 600,
              fontSize: "0.9rem",
              boxShadow: "none",
              "&:hover": {
                bgcolor: isDark ? "#28282e" : "#dedfe3",
                boxShadow: "none",
              },
            }}
          >
            Add Members
          </Button>
        )}

        <Button
          fullWidth
          component={motion.button}
          whileHover={{ scale: 1.012 }}
          whileTap={{ scale: 0.988 }}
          startIcon={<ContentCopyIcon sx={{ fontSize: 18 }} />}
          onClick={() => setInviteDrawerOpen(true)}
          sx={{
            py: 1.2,
            borderRadius: "14px",
            bgcolor: isDark ? "#161618" : "#ffffff",
            border: `1px solid ${
              isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.06)"
            }`,
            color: isDark ? "#fff" : "#111",
            textTransform: "none",
            fontWeight: 600,
            fontSize: "0.9rem",
            boxShadow: "none",
            "&:hover": {
              bgcolor: isDark ? "#1d1d21" : "#f0f0f2",
              boxShadow: "none",
            },
          }}
        >
          {copiedLink ? "✓ Invite Link Copied!" : "Share Group Link"}
        </Button>

        {/* Favorite Group */}
        <Button
          fullWidth
          component={motion.button}
          whileHover={{ scale: 1.012 }}
          whileTap={{ scale: 0.988 }}
          onClick={() => {
            const res = toggleFavoriteChat(resolvedGroupName);
            setIsFavorite(res);
          }}
          sx={{
            py: 1.2,
            borderRadius: "14px",
            bgcolor: isDark ? "#161618" : "#ffffff",
            border: `1px solid ${
              isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.06)"
            }`,
            color: isDark ? "#fff" : "#111",
            textTransform: "none",
            fontWeight: 600,
            fontSize: "0.9rem",
            justifyContent: "space-between",
            "&:hover": { bgcolor: isDark ? "#1d1d21" : "#f0f0f2" },
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            {isFavorite ? (
              <StarRoundedIcon sx={{ color: "#ffb300", fontSize: 20 }} />
            ) : (
              <StarBorderRoundedIcon sx={{ fontSize: 20 }} />
            )}
            <Typography sx={{ fontSize: "0.9rem", fontWeight: 600 }}>
              {isFavorite ? "Favorite Group" : "Add to Favorites"}
            </Typography>
          </Box>
          <Chip
            label={isFavorite ? "Favorited" : "Off"}
            size="small"
            sx={{
              bgcolor: isFavorite ? "rgba(255, 179, 0, 0.2)" : (isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)"),
              color: isFavorite ? "#ffb300" : "inherit",
              fontWeight: 600,
            }}
          />
        </Button>

        {/* Mute Notifications */}
        <Button
          fullWidth
          component={motion.button}
          whileHover={{ scale: 1.012 }}
          whileTap={{ scale: 0.988 }}
          onClick={() => setMuteDialogOpen(true)}
          sx={{
            py: 1.2,
            borderRadius: "14px",
            bgcolor: isDark ? "#161618" : "#ffffff",
            border: `1px solid ${
              isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.06)"
            }`,
            color: isDark ? "#fff" : "#111",
            textTransform: "none",
            fontWeight: 600,
            fontSize: "0.9rem",
            justifyContent: "space-between",
            "&:hover": { bgcolor: isDark ? "#1d1d21" : "#f0f0f2" },
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            {isMuted ? (
              <NotificationsOffOutlinedIcon sx={{ color: "#ef4444", fontSize: 20 }} />
            ) : (
              <NotificationsActiveOutlinedIcon sx={{ fontSize: 20 }} />
            )}
            <Typography sx={{ fontSize: "0.9rem", fontWeight: 600 }}>
              Mute Notifications
            </Typography>
          </Box>
          <Chip
            label={isMuted ? "Muted" : "Unmuted"}
            size="small"
            sx={{
              bgcolor: isMuted ? "rgba(239, 68, 68, 0.2)" : (isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)"),
              color: isMuted ? "#ef4444" : "inherit",
              fontWeight: 600,
            }}
          />
        </Button>

        {/* Disappearing Messages */}
        <Button
          fullWidth
          component={motion.button}
          whileHover={{ scale: 1.012 }}
          whileTap={{ scale: 0.988 }}
          onClick={() => setDisappearingDialogOpen(true)}
          sx={{
            py: 1.2,
            borderRadius: "14px",
            bgcolor: isDark ? "#161618" : "#ffffff",
            border: `1px solid ${
              isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.06)"
            }`,
            color: isDark ? "#fff" : "#111",
            textTransform: "none",
            fontWeight: 600,
            fontSize: "0.9rem",
            justifyContent: "space-between",
            "&:hover": { bgcolor: isDark ? "#1d1d21" : "#f0f0f2" },
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <TimelapseRoundedIcon sx={{ color: isDark ? "#00b7ff" : "#0288d1", fontSize: 20 }} />
            <Typography sx={{ fontSize: "0.9rem", fontWeight: 600 }}>
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
              bgcolor: disappearingDuration > 0 ? "rgba(0, 183, 255, 0.2)" : (isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)"),
              color: disappearingDuration > 0 ? "#00b7ff" : "inherit",
              fontWeight: 600,
            }}
          />
        </Button>

        {/* Edit Group Info (Admins or if not restricted) */}
        {(!groupInfo.onlyAdminsCanEditInfo || isAdmin) && (
          <Button
            fullWidth
            component={motion.button}
            whileHover={{ scale: 1.012 }}
            whileTap={{ scale: 0.988 }}
            startIcon={<EditIcon sx={{ fontSize: 18 }} />}
            onClick={() => {
              setEditName(groupInfo.name || resolvedGroupName);
              setEditDesc(groupInfo.description || "");
              setEditingGroupInfo(true);
            }}
            sx={{
              py: 1.2,
              borderRadius: "14px",
              bgcolor: isDark ? "#161618" : "#ffffff",
              border: `1px solid ${
                isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.06)"
              }`,
              color: isDark ? "#fff" : "#111",
              textTransform: "none",
              fontWeight: 600,
              fontSize: "0.9rem",
              justifyContent: "flex-start",
              "&:hover": { bgcolor: isDark ? "#1d1d21" : "#f0f0f2" },
            }}
          >
            Edit Group Info
          </Button>
        )}

        {/* Group Settings & Permissions (Admins Only) */}
        {isAdmin && (
          <Button
            fullWidth
            component={motion.button}
            whileHover={{ scale: 1.012 }}
            whileTap={{ scale: 0.988 }}
            startIcon={<SettingsOutlinedIcon sx={{ fontSize: 18 }} />}
            onClick={() => {
              setGroupSettingsOpen(true);
            }}
            sx={{
              py: 1.2,
              borderRadius: "14px",
              bgcolor: isDark ? "#161618" : "#ffffff",
              border: `1px solid ${
                isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.06)"
              }`,
              color: isDark ? "#fff" : "#111",
              textTransform: "none",
              fontWeight: 600,
              fontSize: "0.9rem",
              justifyContent: "flex-start",
              "&:hover": { bgcolor: isDark ? "#1d1d21" : "#f0f0f2" },
            }}
          >
            Group Permissions & Settings
          </Button>
        )}
      </Stack>

      {/* ─── 5. Members Section ─── */}
      <Box sx={{ mb: 3 }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 1.5,
          }}
        >
          <Typography
            sx={{
              fontSize: "1.05rem",
              fontWeight: 700,
              color: isDark ? "#fff" : "#111",
              letterSpacing: "-0.2px",
            }}
          >
            Members ({allMembers.length})
          </Typography>
        </Box>

        {/* Member search bar */}
        {allMembers.length > 5 && (
          <TextField
            fullWidth
            size="small"
            placeholder="Search group members..."
            value={memberSearch}
            onChange={(e) => setMemberSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon
                    sx={{
                      fontSize: 18,
                      color: isDark
                        ? "rgba(255, 255, 255, 0.4)"
                        : "rgba(0, 0, 0, 0.4)",
                    }}
                  />
                </InputAdornment>
              ),
            }}
            sx={{
              mb: 1.5,
              "& .MuiOutlinedInput-root": {
                bgcolor: isDark ? "#141416" : "#f2f3f5",
                borderRadius: "12px",
                color: isDark ? "#fff" : "#111",
                fontSize: "0.88rem",
                "& fieldset": {
                  borderColor: isDark
                    ? "rgba(255, 255, 255, 0.08)"
                    : "rgba(0, 0, 0, 0.08)",
                },
              },
            }}
          />
        )}

        <Stack spacing={1}>
          {filteredMembers.map((mUid) => {
            const member = memberInfo[mUid] || {};
            const isUserOwner = mUid === groupInfo.createdBy;
            const isUserAdmin =
              Array.isArray(groupInfo.admins) &&
              groupInfo.admins.includes(mUid);
            const isCurrent = mUid === currentUser?.uid;

            return (
              <Box
                key={mUid}
                component={motion.div}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  bgcolor: isDark ? "#161618" : "#ffffff",
                  border: `1px solid ${
                    isDark
                      ? "rgba(255, 255, 255, 0.05)"
                      : "rgba(0, 0, 0, 0.06)"
                  }`,
                  borderRadius: "14px",
                  p: 1.4,
                  transition: "background-color 0.2s ease",
                  "&:hover": {
                    bgcolor: isDark ? "#1d1d21" : "#f0f0f2",
                  },
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1.5,
                    cursor: "pointer",
                    minWidth: 0,
                    flex: 1,
                  }}
                  onClick={() => {
                    if (!isCurrent) navigate(`/chat/${mUid}`);
                  }}
                >
                  <Avatar
                    src={safeImageUrl(member.photoURL)}
                    alt={member.name || mUid}
                    sx={{
                      width: 40,
                      height: 40,
                      bgcolor: isDark ? "#28282b" : "#e0e0e0",
                      color: isDark ? "#fff" : "#111",
                      fontSize: "1rem",
                      fontWeight: 600,
                      flexShrink: 0,
                    }}
                  >
                    {(member.name || mUid)[0]?.toUpperCase()}
                  </Avatar>

                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 0.8,
                      }}
                    >
                      <Typography
                        sx={{
                          color: isDark ? "#fff" : "#111",
                          fontWeight: 600,
                          fontSize: "0.92rem",
                          lineHeight: 1.25,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {member.name || member.displayName || mUid.slice(0, 8)}
                      </Typography>
                      {isCurrent && (
                        <Typography
                          sx={{
                            color: isDark
                              ? "rgba(255, 255, 255, 0.45)"
                              : "rgba(0, 0, 0, 0.45)",
                            fontSize: "0.78rem",
                          }}
                        >
                          (You)
                        </Typography>
                      )}
                    </Box>

                    <Typography
                      sx={{
                        color: isDark
                          ? "rgba(255, 255, 255, 0.5)"
                          : "rgba(0, 0, 0, 0.5)",
                        fontSize: "0.8rem",
                        lineHeight: 1.2,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {member.username ? `@${member.username}` : "Member"}
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
                  {(isUserOwner || isUserAdmin) && (
                    <Chip
                      label={isUserOwner ? "Creator" : "Admin"}
                      size="small"
                      sx={{
                        bgcolor: isDark
                          ? "rgba(255, 255, 255, 0.08)"
                          : "rgba(0, 0, 0, 0.06)",
                        color: isDark
                          ? "rgba(255, 255, 255, 0.85)"
                          : "rgba(0, 0, 0, 0.85)",
                        fontWeight: 600,
                        fontSize: "0.68rem",
                        height: 22,
                        borderRadius: "6px",
                      }}
                    />
                  )}

                  {!isCurrent && member.mobile && (
                    <Tooltip title="Call">
                      <IconButton
                        size="small"
                        onClick={() =>
                          window.open(`tel:${member.mobile}`, "_self")
                        }
                        sx={{
                          color: isDark ? "#fff" : "#111",
                          p: 0.8,
                          bgcolor: isDark
                            ? "rgba(255, 255, 255, 0.05)"
                            : "rgba(0, 0, 0, 0.04)",
                        }}
                      >
                        <PhoneOutlinedIcon sx={{ fontSize: 17 }} />
                      </IconButton>
                    </Tooltip>
                  )}

                  {isAdmin && !isUserOwner && !isCurrent && (
                    <Tooltip title="Remove Member">
                      <IconButton
                        size="small"
                        onClick={() => setConfirmRemoveUid(mUid)}
                        sx={{
                          color: "#ef4444",
                          p: 0.8,
                          bgcolor: "rgba(239, 68, 68, 0.08)",
                          "&:hover": {
                            bgcolor: "rgba(239, 68, 68, 0.16)",
                          },
                        }}
                      >
                        <RemoveCircleOutlineIcon sx={{ fontSize: 17 }} />
                      </IconButton>
                    </Tooltip>
                  )}
                </Box>
              </Box>
            );
          })}
        </Stack>
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
          Shared in Group
        </Typography>
        <SharedMediaLinksWidgetsTabs
          messages={messages}
          onOpenImage={groupData?.onOpenImage}
          onJumpToMessage={groupData?.onJumpToMessage}
          isDark={isDark}
        />
      </Box>

      {/* ─── 6. Danger Exit Button ─── */}
      <Box sx={{ mt: 2, mb: 1 }}>
        <Button
          fullWidth
          component={motion.button}
          whileHover={{ scale: 1.012 }}
          whileTap={{ scale: 0.988 }}
          startIcon={
            <ExitToAppOutlinedIcon sx={{ color: "#ef4444", fontSize: 20 }} />
          }
          onClick={handleExitGroup}
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
          Exit Group
        </Button>
      </Box>

      {/* ─── Drawer: Add Members (Batch Select) ─── */}
      <SwipeableDrawer
        anchor={isDesktop ? "right" : "bottom"}
        open={addUserDialogOpen}
        onClose={() => {
          setAddUserDialogOpen(false);
          setSelectedUsers([]);
          setUserSearchTerm("");
        }}
        onOpen={() => {}}
        disableSwipeToOpen
        PaperProps={{
          sx: {
            height: isDesktop ? "100vh" : "82vh",
            maxHeight: isDesktop ? "100%" : 700,
            width: isDesktop ? 440 : "100%",
            maxWidth: isDesktop ? 440 : 480,
            mx: isDesktop ? 0 : "auto",
            borderTopRightRadius: isDesktop ? 0 : 24,
            borderTopLeftRadius: isDesktop ? 0 : 24,
            backgroundColor: isDark ? "#18181c" : "#ffffff",
            color: isDark ? "#fff" : "#111",
            p: 3,
            boxShadow: isDesktop
              ? "-8px 0 32px rgba(0, 0, 0, 0.5)"
              : "0 -4px 30px rgba(0, 0, 0, 0.8)",
          },
        }}
      >
        {!isDesktop && (
          <Box sx={{ width: 36, height: 4, bgcolor: isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.2)", borderRadius: 2, mx: "auto", mb: 2 }} />
        )}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
          {isDesktop && (
            <IconButton size="small" onClick={() => setAddUserDialogOpen(false)} sx={{ color: isDark ? "#fff" : "#111" }}>
              <ArrowBackIcon sx={{ fontSize: 20 }} />
            </IconButton>
          )}
          <Typography variant="h6" sx={{ fontWeight: 700, color: isDark ? "#fff" : "#111" }}>
            Select Users to Add
          </Typography>
        </Box>

        <TextField
          fullWidth
          label="Search by username or name"
          value={userSearchTerm}
          onChange={(e) => setUserSearchTerm(e.target.value)}
          variant="outlined"
          size="small"
          sx={{
            mb: 2,
            input: { color: isDark ? "#fff" : "#000" },
            label: { color: isDark ? "#aaa" : "#555" },
            "& .MuiOutlinedInput-root": {
              borderRadius: "12px",
              bgcolor: isDark ? "#121214" : "#f4f5f7",
              "& fieldset": { borderColor: isDark ? "#333" : "#ddd" },
              "&:hover fieldset": { borderColor: isDark ? "#555" : "#bbb" },
              "&.Mui-focused fieldset": { borderColor: "#00b7ff" },
            },
          }}
        />

        <Typography variant="subtitle2" sx={{ mb: 1, color: isDark ? "#aaa" : "#666", fontWeight: 600 }}>
          Search Results
        </Typography>

        <Box sx={{ flex: 1, overflowY: "auto", minHeight: 180, maxHeight: "35vh" }}>
          {searchingUsers ? (
            <Box sx={{ textAlign: "center", mt: 4 }}>
              <CircularProgress size={24} sx={{ color: "#00b7ff" }} />
            </Box>
          ) : (
            <>
              <List dense disablePadding>
                {userSearchResults.map((user) => (
                  <ListItem key={user.uid} disablePadding sx={{ mb: 0.5 }}>
                    <ListItemButton
                      onClick={() => {
                        setSelectedUsers((prev) =>
                          prev.includes(user.uid)
                            ? prev.filter((id) => id !== user.uid)
                            : [...prev, user.uid]
                        );
                      }}
                      sx={{
                        borderRadius: "12px",
                        bgcolor: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)",
                        "&:hover": {
                          bgcolor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)",
                        },
                      }}
                    >
                      <Checkbox
                        edge="start"
                        checked={selectedUsers.includes(user.uid)}
                        tabIndex={-1}
                        sx={{ color: isDark ? "#555" : "#ccc", "&.Mui-checked": { color: "#00b7ff" } }}
                      />
                      <Avatar
                        src={safeImageUrl(user.photoURL)}
                        sx={{ width: 36, height: 36, mr: 1.5, bgcolor: isDark ? "#333" : "#ddd" }}
                      >
                        {(user.username?.[0] || user.name?.[0] || "U").toUpperCase()}
                      </Avatar>
                      <ListItemText
                        primary={user.name || user.displayName || user.username}
                        secondary={user.username ? `@${user.username}` : user.email}
                        primaryTypographyProps={{ fontWeight: 600, color: isDark ? "#fff" : "#111" }}
                        secondaryTypographyProps={{ fontSize: "0.8rem", color: isDark ? "#888" : "#666" }}
                      />
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>

              {userSearchResults.length === 0 && userSearchTerm.length >= 2 && !searchingUsers && (
                <Typography variant="body2" sx={{ color: isDark ? "#666" : "#999", mt: 2, textAlign: "center" }}>
                  No users found.
                </Typography>
              )}
            </>
          )}
        </Box>

        {/* Selected Users Chips */}
        {selectedUsers.length > 0 && (
          <Box sx={{ mt: 2, mb: 1 }}>
            <Divider sx={{ mb: 1.5, borderColor: isDark ? "#333" : "#eee" }} />
            <Typography variant="subtitle2" sx={{ mb: 1, color: isDark ? "#aaa" : "#555", fontWeight: 600 }}>
              Selected Users ({selectedUsers.length})
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ maxHeight: 90, overflowY: "auto" }}>
              {selectedUsers.map((uid) => {
                const u = userSearchResults.find((usr) => usr.uid === uid) || { uid, username: "User" };
                return (
                  <Chip
                    key={uid}
                    avatar={<Avatar src={safeImageUrl(u.photoURL)}>{(u.name?.[0] || u.username?.[0] || "U").toUpperCase()}</Avatar>}
                    label={u.name || u.username || uid}
                    onDelete={() => setSelectedUsers((prev) => prev.filter((id) => id !== uid))}
                    sx={{
                      bgcolor: isDark ? "#28282e" : "#e8e9ec",
                      color: isDark ? "#fff" : "#111",
                      borderRadius: "8px",
                      mb: 0.8,
                    }}
                  />
                );
              })}
            </Stack>
          </Box>
        )}

        {/* Action Buttons */}
        <Box sx={{ display: "flex", justifyContent: "space-between", mt: 2, pt: 1 }}>
          <Button
            onClick={() => {
              setAddUserDialogOpen(false);
              setSelectedUsers([]);
            }}
            variant="text"
            sx={{ color: isDark ? "#aaa" : "#555", textTransform: "none", fontWeight: 600 }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleBatchAddUsers}
            disabled={selectedUsers.length === 0}
            sx={{
              bgcolor: "#00b7ff",
              color: "#fff",
              fontWeight: 700,
              borderRadius: "12px",
              px: 3,
              textTransform: "none",
              "&:hover": { bgcolor: "#009bd9" },
            }}
          >
            Add Selected ({selectedUsers.length})
          </Button>
        </Box>
      </SwipeableDrawer>

      {/* ─── Modal: Confirm Remove Member ─── */}
      <Dialog
        open={Boolean(confirmRemoveUid)}
        onClose={() => setConfirmRemoveUid(null)}
        PaperProps={{
          sx: {
            borderRadius: "20px",
            bgcolor: isDark ? "#141416" : "#ffffff",
            color: isDark ? "#fff" : "#111",
            p: 1,
            width: "100%",
            maxWidth: 380,
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, fontSize: "1.1rem" }}>
          Remove Member?
        </DialogTitle>
        <DialogContent>
          <Typography
            sx={{
              color: isDark
                ? "rgba(255, 255, 255, 0.7)"
                : "rgba(0, 0, 0, 0.7)",
              fontSize: "0.9rem",
            }}
          >
            Are you sure you want to remove{" "}
            <strong>
              {memberInfo[confirmRemoveUid]?.name || "this user"}
            </strong>{" "}
            from {groupDisplayName}?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button
            onClick={() => setConfirmRemoveUid(null)}
            sx={{
              borderRadius: "12px",
              textTransform: "none",
              color: isDark ? "#fff" : "#111",
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleRemoveMember}
            sx={{
              borderRadius: "12px",
              textTransform: "none",
              color: "#ef4444",
              fontWeight: 700,
            }}
          >
            Remove
          </Button>
        </DialogActions>
      </Dialog>

      {/* ─── Drawer: Edit Group Details ─── */}
      <SwipeableDrawer
        anchor={isDesktop ? "right" : "bottom"}
        open={editingGroupInfo}
        onClose={() => setEditingGroupInfo(false)}
        onOpen={() => {}}
        disableSwipeToOpen
        PaperProps={{
          sx: {
            p: 3,
            borderTopLeftRadius: isDesktop ? 0 : 24,
            borderTopRightRadius: isDesktop ? 0 : 24,
            bgcolor: isDark ? "#18181c" : "#ffffff",
            color: isDark ? "#fff" : "#111",
            width: isDesktop ? 440 : "100%",
            maxWidth: isDesktop ? 440 : 480,
            mx: isDesktop ? 0 : "auto",
            height: isDesktop ? "100vh" : "auto",
            maxHeight: isDesktop ? "100%" : "85vh",
            overflowY: "auto",
            boxShadow: isDesktop
              ? "-8px 0 32px rgba(0, 0, 0, 0.5)"
              : "0 -4px 30px rgba(0, 0, 0, 0.8)",
          },
        }}
      >
        {!isDesktop && (
          <Box sx={{ width: 36, height: 4, bgcolor: isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.2)", borderRadius: 2, mx: "auto", mb: 2 }} />
        )}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2.5 }}>
          {isDesktop && (
            <IconButton size="small" onClick={() => setEditingGroupInfo(false)} sx={{ color: isDark ? "#fff" : "#111" }}>
              <ArrowBackIcon sx={{ fontSize: 20 }} />
            </IconButton>
          )}
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Edit Group Details
          </Typography>
        </Box>

        {/* Group Name */}
        <TextField
          label="Group Name"
          fullWidth
          value={editName}
          onChange={(e) => setEditName(e.target.value)}
          sx={{
            mb: 2,
            input: { color: isDark ? "#fff" : "#000" },
            label: { color: isDark ? "#ccc" : "#555" },
            "& .MuiOutlinedInput-root": {
              borderRadius: "12px",
              bgcolor: isDark ? "#121214" : "#f4f5f7",
            },
          }}
        />

        {/* Group Avatar Preview */}
        <Box display="flex" justifyContent="center" mb={2}>
          {groupIconType === "emoji" ? (
            <Avatar sx={{ width: 76, height: 76, fontSize: 36, bgcolor: isDark ? "#232323" : "#e0e0e0" }}>
              {groupIconValue || "📍"}
            </Avatar>
          ) : (
            <Avatar
              src={groupIconValue}
              sx={{ width: 76, height: 76, bgcolor: isDark ? "#232323" : "#e0e0e0" }}
            />
          )}
        </Box>

        {/* Icon Type Toggle */}
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel sx={{ color: isDark ? "#ccc" : "#555" }}>Icon Type</InputLabel>
          <Select
            value={groupIconType}
            label="Icon Type"
            onChange={(e) => setGroupIconType(e.target.value)}
            sx={{
              color: isDark ? "#fff" : "#000",
              borderRadius: "12px",
              bgcolor: isDark ? "#121214" : "#f4f5f7",
            }}
          >
            <MenuItem value="emoji">Emoji</MenuItem>
            <MenuItem value="image">Image URL</MenuItem>
          </Select>
        </FormControl>

        {/* Icon Selector Grid or URL Field */}
        {groupIconType === "emoji" ? (
          <>
            <Typography variant="subtitle2" sx={{ mb: 1, color: isDark ? "#ccc" : "#555", fontWeight: 600 }}>
              Choose an Emoji
            </Typography>
            <Grid container spacing={1} sx={{ mb: 2.5 }}>
              {["😀", "😎", "🔥", "🎉", "🚀", "🌍", "📚", "🧠", "🧳", "🍕", "🎮", "🏖️"].map(
                (emoji) => (
                  <Grid item xs={3} key={emoji}>
                    <Button
                      variant={groupIconValue === emoji ? "contained" : "outlined"}
                      onClick={() => setGroupIconValue(emoji)}
                      sx={{
                        fontSize: 24,
                        width: "100%",
                        aspectRatio: "1",
                        minWidth: 0,
                        bgcolor: groupIconValue === emoji ? (isDark ? "rgba(0,183,255,0.25)" : "rgba(0,183,255,0.15)") : "transparent",
                        borderColor: groupIconValue === emoji ? "#00b7ff" : (isDark ? "#333" : "#ddd"),
                        borderRadius: "12px",
                      }}
                    >
                      {emoji}
                    </Button>
                  </Grid>
                )
              )}
            </Grid>
          </>
        ) : (
          <Box sx={{ mb: 2.5 }}>
            <TextField
              label="Image URL"
              value={groupIconValue}
              onChange={(e) => setGroupIconValue(e.target.value)}
              fullWidth
              sx={{
                input: { color: isDark ? "#fff" : "#000" },
                label: { color: isDark ? "#ccc" : "#555" },
                "& .MuiOutlinedInput-root": {
                  borderRadius: "12px",
                  bgcolor: isDark ? "#121214" : "#f4f5f7",
                },
              }}
            />
          </Box>
        )}

        {/* Group Description */}
        <TextField
          label="Group Description"
          fullWidth
          multiline
          rows={3}
          value={editDesc}
          onChange={(e) => setEditDesc(e.target.value)}
          sx={{
            mb: 3,
            input: { color: isDark ? "#fff" : "#000" },
            label: { color: isDark ? "#ccc" : "#555" },
            "& .MuiOutlinedInput-root": {
              borderRadius: "12px",
              bgcolor: isDark ? "#121214" : "#f4f5f7",
            },
          }}
        />

        {/* Action Buttons */}
        <Box display="flex" justifyContent="space-between" gap={2}>
          <Button
            variant="outlined"
            onClick={() => setEditingGroupInfo(false)}
            sx={{
              flex: 1,
              color: isDark ? "#fff" : "#000",
              borderColor: isDark ? "#444" : "#ccc",
              fontWeight: 600,
              borderRadius: "12px",
              textTransform: "none",
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleUpdateGroupInfo}
            sx={{
              flex: 1,
              bgcolor: "#00b7ff",
              color: "#fff",
              fontWeight: 700,
              borderRadius: "12px",
              textTransform: "none",
              "&:hover": { bgcolor: "#009bd9" },
            }}
          >
            Save Changes
          </Button>
        </Box>
      </SwipeableDrawer>

      {/* ─── Drawer: Group Settings (Permissions & Admin Management) ─── */}
      <Drawer
        anchor={isDesktop ? "right" : "bottom"}
        open={groupSettingsOpen}
        onClose={() => setGroupSettingsOpen(false)}
        PaperProps={{
          sx: {
            p: 3,
            borderTopLeftRadius: isDesktop ? 0 : 24,
            borderTopRightRadius: isDesktop ? 0 : 24,
            bgcolor: isDark ? "#18181cf2" : "#ffffff",
            color: isDark ? "#fff" : "#111",
            width: isDesktop ? 440 : "100%",
            maxWidth: isDesktop ? 440 : 480,
            mx: isDesktop ? 0 : "auto",
            height: isDesktop ? "100vh" : "90vh",
            backdropFilter: "blur(40px)",
            overflowY: "auto",
            boxShadow: isDesktop
              ? "-8px 0 32px rgba(0, 0, 0, 0.5)"
              : "0 -4px 30px rgba(0, 0, 0, 0.8)",
          },
        }}
      >
        <Box display="flex" alignItems="center" sx={{ mb: 2 }}>
          <IconButton onClick={() => setGroupSettingsOpen(false)} sx={{ color: isDark ? "#fff" : "#000", mr: 1 }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Group Settings
          </Typography>
        </Box>

        {/* Section: Permissions */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 700, color: isDark ? "#fff" : "#222" }}>
            Permissions
          </Typography>
          <Stack spacing={2.5}>
            {/* Edit Access */}
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1, color: isDark ? "#ccc" : "#555", fontWeight: 600 }}>
                Who can edit group info?
              </Typography>
              <Stack direction="row" spacing={1.5}>
                {["admin", "all"].map((role) => (
                  <Button
                    key={role}
                    variant={groupInfo?.editAccess === role ? "contained" : "outlined"}
                    onClick={() => handlePermissionChange("editAccess", role)}
                    sx={{
                      borderRadius: "10px",
                      textTransform: "none",
                      fontWeight: 600,
                      px: 2.5,
                      bgcolor: groupInfo?.editAccess === role ? "#00b7ff" : "transparent",
                      color: groupInfo?.editAccess === role ? "#fff" : "inherit",
                      borderColor: groupInfo?.editAccess === role ? "#00b7ff" : (isDark ? "#444" : "#ccc"),
                      "&:hover": {
                        bgcolor: groupInfo?.editAccess === role ? "#009bd9" : (isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)"),
                      },
                    }}
                  >
                    {role === "admin" ? "Admins Only" : "All Members"}
                  </Button>
                ))}
              </Stack>
            </Box>

            {/* Invite Access */}
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1, color: isDark ? "#ccc" : "#555", fontWeight: 600 }}>
                Who can add members?
              </Typography>
              <Stack direction="row" spacing={1.5}>
                {["admin", "all"].map((role) => (
                  <Button
                    key={role}
                    variant={groupInfo?.inviteAccess === role ? "contained" : "outlined"}
                    onClick={() => handlePermissionChange("inviteAccess", role)}
                    sx={{
                      borderRadius: "10px",
                      textTransform: "none",
                      fontWeight: 600,
                      px: 2.5,
                      bgcolor: groupInfo?.inviteAccess === role ? "#00b7ff" : "transparent",
                      color: groupInfo?.inviteAccess === role ? "#fff" : "inherit",
                      borderColor: groupInfo?.inviteAccess === role ? "#00b7ff" : (isDark ? "#444" : "#ccc"),
                      "&:hover": {
                        bgcolor: groupInfo?.inviteAccess === role ? "#009bd9" : (isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)"),
                      },
                    }}
                  >
                    {role === "admin" ? "Admins Only" : "All Members"}
                  </Button>
                ))}
              </Stack>
            </Box>

            {/* Send Messages Access */}
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1, color: isDark ? "#ccc" : "#555", fontWeight: 600 }}>
                Who can send messages?
              </Typography>
              <Stack direction="row" spacing={1.5}>
                {["admin", "all"].map((role) => (
                  <Button
                    key={role}
                    variant={groupInfo?.sendAccess === role ? "contained" : "outlined"}
                    onClick={() => handlePermissionChange("sendAccess", role)}
                    sx={{
                      borderRadius: "10px",
                      textTransform: "none",
                      fontWeight: 600,
                      px: 2.5,
                      bgcolor: groupInfo?.sendAccess === role ? "#00b7ff" : "transparent",
                      color: groupInfo?.sendAccess === role ? "#fff" : "inherit",
                      borderColor: groupInfo?.sendAccess === role ? "#00b7ff" : (isDark ? "#444" : "#ccc"),
                      "&:hover": {
                        bgcolor: groupInfo?.sendAccess === role ? "#009bd9" : (isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)"),
                      },
                    }}
                  >
                    {role === "admin" ? "Admins Only" : "All Members"}
                  </Button>
                ))}
              </Stack>
            </Box>
          </Stack>
        </Box>

        {/* Section: Members & Admin Toggle */}
        <Box sx={{ bgcolor: isDark ? "#121214" : "#f4f5f7", borderRadius: "16px", p: 2 }}>
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={1.5}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              Members & Admins
            </Typography>
            <Button
              size="small"
              onClick={() => setShowSearchBar((prev) => !prev)}
              startIcon={showSearchBar ? <CloseIcon sx={{ fontSize: 16 }} /> : <SearchIcon sx={{ fontSize: 16 }} />}
              sx={{ textTransform: "none", color: "inherit", fontWeight: 600, fontSize: "0.8rem" }}
            >
              {showSearchBar ? "Hide" : "Search"}
            </Button>
          </Box>

          {showSearchBar && (
            <TextField
              size="small"
              fullWidth
              placeholder="Search member by name..."
              value={searchMembersText}
              onChange={(e) => setSearchMembersText(e.target.value)}
              sx={{
                mb: 2,
                input: { color: isDark ? "#fff" : "#000" },
                "& .MuiOutlinedInput-root": {
                  borderRadius: "10px",
                  bgcolor: isDark ? "#1e1e24" : "#ffffff",
                },
              }}
            />
          )}

          <Stack spacing={1} sx={{ maxHeight: "36vh", overflowY: "auto" }}>
            {(groupInfo?.members || [])
              .filter((mUid) => {
                const m = memberInfo[mUid];
                if (!searchMembersText) return true;
                const search = searchMembersText.toLowerCase();
                return (
                  m?.name?.toLowerCase().includes(search) ||
                  m?.username?.toLowerCase().includes(search)
                );
              })
              .map((mUid) => {
                const m = memberInfo[mUid];
                const isGroupCreator = mUid === groupInfo?.createdBy;
                const isGroupAdmin = (groupInfo?.admins || []).includes(mUid);
                const canChangeRole = !isGroupCreator && (isCreator || isAdmin);

                return (
                  <Box
                    key={mUid}
                    sx={{
                      p: 1.2,
                      borderRadius: "12px",
                      bgcolor: isDark ? "#1a1a20" : "#ffffff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <Box display="flex" alignItems="center" gap={1.5}>
                      <Avatar src={safeImageUrl(m?.photoURL)} sx={{ width: 36, height: 36 }}>
                        {(m?.name?.[0] || m?.username?.[0] || "U").toUpperCase()}
                      </Avatar>
                      <Box>
                        <Typography sx={{ fontWeight: 600, fontSize: "0.9rem" }}>
                          {m?.name || m?.displayName || "Member"}
                        </Typography>
                        {m?.username && (
                          <Typography variant="caption" sx={{ color: isDark ? "#888" : "#666" }}>
                            @{m.username}
                          </Typography>
                        )}
                      </Box>
                    </Box>

                    {canChangeRole ? (
                      <FormControl size="small" sx={{ minWidth: 95 }}>
                        <Select
                          value={isGroupAdmin ? "admin" : "member"}
                          onChange={() => toggleAdminStatus(mUid)}
                          sx={{
                            fontSize: "0.82rem",
                            borderRadius: "8px",
                            color: isGroupAdmin ? "#00b7ff" : "inherit",
                            fontWeight: 600,
                          }}
                        >
                          <MenuItem value="member">Member</MenuItem>
                          <MenuItem value="admin">Admin</MenuItem>
                        </Select>
                      </FormControl>
                    ) : (
                      <Chip
                        label={isGroupCreator ? "Owner" : isGroupAdmin ? "Admin" : "Member"}
                        size="small"
                        sx={{
                          bgcolor: isGroupCreator ? "rgba(0, 247, 33, 0.15)" : isGroupAdmin ? "rgba(0, 183, 255, 0.15)" : "rgba(255,255,255,0.06)",
                          color: isGroupCreator ? "#00cc1b" : isGroupAdmin ? "#00b7ff" : "inherit",
                          fontWeight: 700,
                          fontSize: "0.75rem",
                        }}
                      />
                    )}
                  </Box>
                );
              })}
          </Stack>
        </Box>
      </Drawer>

      {/* ─── Drawer: Invite & QR Code ─── */}
      <SwipeableDrawer
        anchor={isDesktop ? "right" : "bottom"}
        open={inviteDrawerOpen}
        onClose={() => setInviteDrawerOpen(false)}
        onOpen={() => {}}
        disableSwipeToOpen
        PaperProps={{
          sx: {
            p: 3,
            borderTopLeftRadius: isDesktop ? 0 : 24,
            borderTopRightRadius: isDesktop ? 0 : 24,
            bgcolor: isDark ? "#18181c" : "#ffffff",
            color: isDark ? "#fff" : "#111",
            width: isDesktop ? 440 : "100%",
            maxWidth: isDesktop ? 440 : 480,
            mx: isDesktop ? 0 : "auto",
            height: isDesktop ? "100vh" : "auto",
            textAlign: "center",
            boxShadow: isDesktop
              ? "-8px 0 32px rgba(0, 0, 0, 0.5)"
              : "0 -4px 30px rgba(0, 0, 0, 0.8)",
          },
        }}
      >
        {!isDesktop && (
          <Box sx={{ width: 36, height: 4, bgcolor: isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.2)", borderRadius: 2, mx: "auto", mb: 2 }} />
        )}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
          {isDesktop && (
            <IconButton size="small" onClick={() => setInviteDrawerOpen(false)} sx={{ color: isDark ? "#fff" : "#111" }}>
              <ArrowBackIcon sx={{ fontSize: 20 }} />
            </IconButton>
          )}
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Invite to {groupDisplayName}
          </Typography>
        </Box>

        <Box sx={{ display: "flex", justifyContent: "center", mb: 2.5 }}>
          <Box sx={{ p: 2, bgcolor: "#fff", borderRadius: "16px", display: "inline-block" }}>
            <QRCodeCanvas value={`${window.location.origin}/group/${encodeURIComponent(resolvedGroupName)}`} size={170} />
          </Box>
        </Box>

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            p: 1.5,
            borderRadius: "12px",
            bgcolor: isDark ? "#121214" : "#f4f5f7",
            mb: 2.5,
          }}
        >
          <Typography
            sx={{
              fontSize: "0.85rem",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              color: isDark ? "#aaa" : "#555",
              mr: 1,
            }}
          >
            {`${window.location.origin}/group/${encodeURIComponent(resolvedGroupName)}`}
          </Typography>
          <IconButton size="small" onClick={handleCopyLink} sx={{ color: copiedLink ? "#00e676" : "#00b7ff" }}>
            <ContentCopyIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Box>

        <Button
          fullWidth
          variant="contained"
          onClick={() => {
            const link = `${window.location.origin}/group/${encodeURIComponent(resolvedGroupName)}`;
            if (navigator.share) {
              navigator.share({ title: groupDisplayName, url: link }).catch(() => {});
            } else {
              handleCopyLink();
            }
          }}
          startIcon={<ShareIcon sx={{ fontSize: 18 }} />}
          sx={{
            py: 1.3,
            bgcolor: "#00b7ff",
            color: "#fff",
            fontWeight: 700,
            borderRadius: "12px",
            textTransform: "none",
            "&:hover": { bgcolor: "#009bd9" },
          }}
        >
          {copiedLink ? "✓ Invite Link Copied!" : "Share Invite Link"}
        </Button>
      </SwipeableDrawer>

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
            Other group members will not see that you muted this group.
          </Typography>
          <Stack spacing={1}>
            <Button
              variant="outlined"
              fullWidth
              onClick={() => {
                muteChat(resolvedGroupName, 8 * 60 * 60 * 1000);
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
                muteChat(resolvedGroupName, 7 * 24 * 60 * 60 * 1000);
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
                muteChat(resolvedGroupName, null);
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
                  unmuteChat(resolvedGroupName);
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
                Unmute Group
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
            When turned on, new messages in this group will disappear after the selected duration.
          </Typography>
          <RadioGroup
            value={disappearingDuration}
            onChange={(e) => {
              const dur = Number(e.target.value);
              setChatDisappearingDuration(resolvedGroupName, dur, "group");
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
    </Box>
  );
};

export default React.memo(GroupInfoPanelContent);
