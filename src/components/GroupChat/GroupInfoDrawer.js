// src/components/chats_components/GroupInfoDrawer.jsx
import React, { useState, useMemo, useEffect } from "react";
import {
  Box,
  Typography,
  Avatar,
  Button,
  Stack,
  TextField,
  InputAdornment,
  Tabs,
  Tab,
  ButtonBase,
  Divider,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Tooltip,
  RadioGroup,
  FormControlLabel,
  Radio,
  useMediaQuery,
  useTheme,
  Drawer,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SearchIcon from "@mui/icons-material/Search";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import PhoneOutlinedIcon from "@mui/icons-material/PhoneOutlined";
import ExitToAppOutlinedIcon from "@mui/icons-material/ExitToAppOutlined";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import ShareIcon from "@mui/icons-material/Share";
import PlaceIcon from "@mui/icons-material/Place";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import RemoveCircleOutlineIcon from "@mui/icons-material/RemoveCircleOutline";
import StarRoundedIcon from "@mui/icons-material/StarRounded";
import StarBorderRoundedIcon from "@mui/icons-material/StarBorderRounded";
import NotificationsOffOutlinedIcon from "@mui/icons-material/NotificationsOffOutlined";
import NotificationsActiveOutlinedIcon from "@mui/icons-material/NotificationsActiveOutlined";
import TimelapseRoundedIcon from "@mui/icons-material/TimelapseRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import PermMediaOutlinedIcon from "@mui/icons-material/PermMediaOutlined";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { QRCodeCanvas } from "qrcode.react";
import { auth, db } from "../../firebase";
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
  deleteDoc,
} from "firebase/firestore";
import { safeImageUrl, isValidImageUrl } from "../../utils/uiHelpers";
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

const GroupInfoDrawer = ({
  open,
  onClose,
  groupData,
  groupName: propGroupName,
  messages = [],
  onOpenImage,
  onJumpToMessage,
  onOpenSearch,
  effectiveChatTheme = "dark",
}) => {
  const navigate = useNavigate();
  const muiTheme = useTheme();
  const isDesktop = useMediaQuery(muiTheme.breakpoints.up("md"));
  const isDark = effectiveChatTheme === "dark";
  const currentUser = auth.currentUser;

  const resolvedGroupName =
    groupData?.id ||
    groupData?.groupName ||
    groupData?.name ||
    propGroupName ||
    "";

  // Active Sub-View: null | 'sharedMedia' | 'membersList' | 'groupSettings' | 'editGroup' | 'invite'
  const [activeSubView, setActiveSubView] = useState(null);

  const [groupInfo, setGroupInfo] = useState(groupData || {});
  const [createdByUser, setCreatedByUser] = useState(null);
  const [tripInfo, setTripInfo] = useState(null);
  const [memberInfo, setMemberInfo] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [memberSearchQuery, setMemberSearchQuery] = useState("");
  const [copiedLink, setCopiedLink] = useState(false);

  // Features state
  const [isMuted, setIsMuted] = useState(() => isChatMuted(resolvedGroupName));
  const [isFavorite, setIsFavorite] = useState(() => isChatFavorite(resolvedGroupName));
  const [disappearingDuration, setDisappearingDurationState] = useState(() =>
    getChatDisappearingDuration(resolvedGroupName)
  );
  const [muteDialogOpen, setMuteDialogOpen] = useState(false);
  const [muteDuration, setMuteDuration] = useState("8h");
  const [disappearingDialogOpen, setDisappearingDialogOpen] = useState(false);

  // Add members state
  const [addUserOpen, setAddUserOpen] = useState(false);
  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [userSearchResults, setUserSearchResults] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [searchingUsers, setSearchingUsers] = useState(false);

  // Confirm remove member dialog
  const [confirmRemoveUid, setConfirmRemoveUid] = useState(null);

  // Edit group state
  const [editName, setEditName] = useState(groupInfo.name || "");
  const [editDesc, setEditDesc] = useState(groupInfo.description || "");
  const [groupIconType, setGroupIconType] = useState("emoji");
  const [groupIconValue, setGroupIconValue] = useState("💬");

  // Dynamic Avatar Background Color
  const [avatarColor, setAvatarColor] = useState(isDark ? "#2a2a2e" : "#e0e0e0");
  const groupPhoto = safeImageUrl(groupInfo.iconURL || groupInfo.photoURL);

  useEffect(() => {
    if (!groupPhoto) {
      setAvatarColor(isDark ? "#2a2a2e" : "#e0e0e0");
      return;
    }
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.src = groupPhoto;
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
  }, [groupPhoto, isDark]);

  // Real-time listener for group data
  useEffect(() => {
    if (!resolvedGroupName) return;
    const groupRef = doc(db, "groupChats", resolvedGroupName);
    const unsub = onSnapshot(groupRef, async (snap) => {
      if (snap.exists()) {
        const data = { id: snap.id, ...snap.data() };
        setGroupInfo(data);
        setEditName(data.name || "");
        setEditDesc(data.description || "");
        setGroupIconType(data.iconURL?.startsWith("http") ? "image" : "emoji");
        setGroupIconValue(data.iconURL || data.emoji || "💬");

        if (data.createdBy) {
          try {
            const uSnap = await getDoc(doc(db, "users", data.createdBy));
            if (uSnap.exists()) setCreatedByUser(uSnap.data());
          } catch {}
        }

        if (data.tripId) {
          try {
            const tSnap = await getDoc(doc(db, "trips", data.tripId));
            if (tSnap.exists()) setTripInfo({ id: tSnap.id, ...tSnap.data() });
          } catch {}
        }

        if (Array.isArray(data.members)) {
          const profiles = {};
          await Promise.all(
            data.members.map(async (uid) => {
              try {
                const mSnap = await getDoc(doc(db, "users", uid));
                if (mSnap.exists()) profiles[uid] = mSnap.data();
              } catch {}
            })
          );
          setMemberInfo(profiles);
        }
      }
    });
    return () => unsub();
  }, [resolvedGroupName]);

  // Search users for adding
  useEffect(() => {
    if (userSearchTerm.trim().length < 2) {
      setUserSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearchingUsers(true);
      try {
        const snap = await getDocs(query(collection(db, "users"), limit(40)));
        const existing = groupInfo.members || [];
        const matches = snap.docs
          .map((d) => ({ uid: d.id, ...d.data() }))
          .filter(
            (u) =>
              !existing.includes(u.uid) &&
              (u.name?.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
                u.username?.toLowerCase().includes(userSearchTerm.toLowerCase()))
          );
        setUserSearchResults(matches);
      } catch (e) {
        console.error(e);
      } finally {
        setSearchingUsers(false);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [userSearchTerm, groupInfo.members]);

  const currentUserUid = currentUser?.uid;
  const isCreator = groupInfo?.createdBy === currentUserUid;
  const isAdmin = isCreator || (groupInfo?.admins || []).includes(currentUserUid);
  const canAddMembers = groupInfo?.inviteAccess === "all" || isAdmin;
  const canEditGroupInfo = groupInfo?.editAccess === "all" || isAdmin;

  const sharedMedia = useMemo(() => {
    const list = [];
    (messages || []).forEach((m) => {
      if (m.dataUri) list.push({ url: m.dataUri, msgId: m.id });
      if (m.imageUrl) list.push({ url: m.imageUrl, msgId: m.id });
      if (Array.isArray(m.images)) m.images.forEach((img) => img && list.push({ url: img, msgId: m.id }));
    });
    return list;
  }, [messages]);

  const filteredMembers = useMemo(() => {
    const members = groupInfo.members || [];
    if (!memberSearchQuery.trim()) return members;
    const q = memberSearchQuery.toLowerCase();
    return members.filter((uid) => {
      const m = memberInfo[uid];
      return (
        m?.name?.toLowerCase().includes(q) ||
        m?.username?.toLowerCase().includes(q) ||
        uid.toLowerCase().includes(q)
      );
    });
  }, [groupInfo.members, memberInfo, memberSearchQuery]);

  const handleExitGroup = async () => {
    if (groupInfo.isSystem) {
      alert("You cannot exit a system group.");
      return;
    }
    if (!window.confirm("Are you sure you want to leave this group?")) return;
    try {
      const ref = doc(db, "groupChats", resolvedGroupName);
      await updateDoc(ref, { members: arrayRemove(currentUserUid) });
      await addDoc(collection(db, "groupChat", resolvedGroupName, "messages"), {
        type: "system",
        content: `${auth.currentUser?.displayName || "A user"} left the group.`,
        timestamp: serverTimestamp(),
      });
      navigate("/chats");
    } catch (e) {
      console.error(e);
    }
  };

  const handleRemoveMember = async () => {
    if (!confirmRemoveUid) return;
    try {
      const ref = doc(db, "groupChats", resolvedGroupName);
      await updateDoc(ref, { members: arrayRemove(confirmRemoveUid) });
      const snap = await getDoc(ref);
      if ((snap.data().members || []).length === 0) {
        await deleteDoc(ref);
        navigate("/chats");
        return;
      }
      await addDoc(collection(db, "groupChat", resolvedGroupName, "messages"), {
        type: "system",
        content: `${memberInfo[confirmRemoveUid]?.name || "A member"} was removed.`,
        timestamp: serverTimestamp(),
      });
      setConfirmRemoveUid(null);
    } catch (e) {
      console.error(e);
    }
  };

  const handleBatchAddUsers = async () => {
    if (selectedUsers.length === 0) return;
    try {
      const ref = doc(db, "groupChats", resolvedGroupName);
      await updateDoc(ref, { members: arrayUnion(...selectedUsers) });
      await addDoc(collection(db, "groupChat", resolvedGroupName, "messages"), {
        type: "system",
        content: `New members added to the group.`,
        timestamp: serverTimestamp(),
      });
      setSelectedUsers([]);
      setAddUserOpen(false);
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateGroupInfo = async () => {
    if (!editName.trim()) return;
    try {
      const updates = {
        name: editName.trim(),
        description: editDesc.trim(),
        iconURL: groupIconType === "image" ? groupIconValue : "",
        emoji: groupIconType === "emoji" ? groupIconValue : "",
      };
      await updateDoc(doc(db, "groupChats", resolvedGroupName), updates);
      setActiveSubView(null);
    } catch (e) {
      console.error(e);
    }
  };

  const toggleAdminStatus = async (uid) => {
    if (!isCreator && !isAdmin) return;
    const admins = groupInfo.admins || [];
    const isAdm = admins.includes(uid);
    try {
      await updateDoc(doc(db, "groupChats", resolvedGroupName), {
        admins: isAdm ? arrayRemove(uid) : arrayUnion(uid),
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handlePermissionChange = async (field, val) => {
    try {
      await updateDoc(doc(db, "groupChats", resolvedGroupName), { [field]: val });
    } catch (e) {
      console.error(e);
    }
  };

  const handleConfirmMute = () => {
    let durationMs = 8 * 60 * 60 * 1000;
    if (muteDuration === "1w") durationMs = 7 * 24 * 60 * 60 * 1000;
    if (muteDuration === "forever") durationMs = null;
    muteChat(resolvedGroupName, durationMs);
    setIsMuted(true);
    setMuteDialogOpen(false);
  };

  const bounceTransition = { type: "spring", stiffness: 400, damping: 17 };
  const groupDisplayName = groupInfo.name || resolvedGroupName || "Group";
  const internalDivider = (
    <Divider sx={{ borderColor: isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.05)", my: 0, mx: 3 }} />
  );

  return (
    <Drawer
      anchor={isDesktop ? "right" : "bottom"}
      open={open}
      onClose={() => (activeSubView ? setActiveSubView(null) : onClose())}
      PaperProps={{
        sx: {
          width: isDesktop ? 430 : "auto",
          height: isDesktop ? "100vh" : "95vh",
          bgcolor: isDark ? "#0c0c0c" : "#f1f1f1",
          color: isDark ? "#ffffff" : "#111111",
          px: 2.5,
          pt: 2,
          pb: 4,
          overflowY: "auto",
          scrollbarWidth: "none",
          "&::-webkit-scrollbar": { display: "none" },
        },
      }}
    >
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
          {/* ─── SUB-VIEW: SHARED MEDIA ─── */}
          {activeSubView === "sharedMedia" && (
            <motion.div key="shared-media" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
              <Box sx={{ display: "flex", alignItems: "center", mb: 2.5 }}>
                <Button
                  component={motion.button}
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.94 }}
                  transition={bounceTransition}
                  onClick={() => setActiveSubView(null)}
                  startIcon={<ArrowBackIcon sx={{ fontSize: 18 }} />}
                  sx={{ color: isDark ? "#fff" : "#111", bgcolor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)", borderRadius: "999px", px: 2, py: 0.6, textTransform: "none", fontWeight: 600 }}
                >
                  Back to Group
                </Button>
              </Box>
              <Typography sx={{ fontSize: "1.25rem", fontWeight: 700, mb: 2 }}>Shared Media & Files</Typography>
              <TextField
                fullWidth
                size="small"
                placeholder="Search media..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                sx={{ mb: 2, "& .MuiOutlinedInput-root": { borderRadius: "14px", bgcolor: isDark ? "#161618" : "#fff", color: isDark ? "#fff" : "#111", "& fieldset": { border: "none" } } }}
                InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 20, opacity: 0.5 }} /></InputAdornment> }}
              />
              <SharedMediaLinksWidgetsTabs messages={messages} searchQuery={searchQuery} onOpenImage={onOpenImage} onJumpToMessage={onJumpToMessage} isDark={isDark} />
            </motion.div>
          )}

          {/* ─── SUB-VIEW: ALL MEMBERS ─── */}
          {activeSubView === "membersList" && (
            <motion.div key="members-list" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
              <Box sx={{ display: "flex", alignItems: "center", mb: 2.5 }}>
                <Button
                  component={motion.button}
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.94 }}
                  transition={bounceTransition}
                  onClick={() => setActiveSubView(null)}
                  startIcon={<ArrowBackIcon sx={{ fontSize: 18 }} />}
                  sx={{ color: isDark ? "#fff" : "#111", bgcolor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)", borderRadius: "999px", px: 2, py: 0.6, textTransform: "none", fontWeight: 600 }}
                >
                  Back to Group
                </Button>
              </Box>
              <Typography sx={{ fontSize: "1.25rem", fontWeight: 700, mb: 2 }}>Group Members ({(groupInfo.members || []).length})</Typography>
              <TextField
                fullWidth
                size="small"
                placeholder="Search members..."
                value={memberSearchQuery}
                onChange={(e) => setMemberSearchQuery(e.target.value)}
                sx={{ mb: 2, "& .MuiOutlinedInput-root": { borderRadius: "14px", bgcolor: isDark ? "#161618" : "#fff", "& fieldset": { border: "none" } } }}
                InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 20, opacity: 0.5 }} /></InputAdornment> }}
              />
              <Stack spacing={1.2}>
                {filteredMembers.map((mUid) => {
                  const m = memberInfo[mUid] || {};
                  const isOwn = mUid === currentUserUid;
                  const isOwnCreator = mUid === groupInfo.createdBy;
                  const isOwnAdmin = (groupInfo.admins || []).includes(mUid);
                  return (
                    <Box key={mUid} sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", p: 1.5, bgcolor: isDark ? "#161618" : "#fff", borderRadius: "14px" }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                        <Avatar src={safeImageUrl(m.photoURL)} sx={{ width: 40, height: 40 }}>{(m.name || mUid)[0]?.toUpperCase()}</Avatar>
                        <Box>
                          <Typography sx={{ fontWeight: 600, fontSize: "0.92rem" }}>{m.name || m.displayName || mUid.slice(0, 8)} {isOwn && "(You)"}</Typography>
                          <Typography sx={{ fontSize: "0.78rem", opacity: 0.6 }}>@{m.username || "member"}</Typography>
                        </Box>
                      </Box>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        {(isOwnCreator || isOwnAdmin) && (
                          <Chip label={isOwnCreator ? "Creator" : "Admin"} size="small" sx={{ height: 22, fontWeight: 700, fontSize: "0.7rem" }} />
                        )}
                        {isAdmin && !isOwnCreator && !isOwn && (
                          <IconButton size="small" onClick={() => setConfirmRemoveUid(mUid)} sx={{ color: "#ef4444" }}>
                            <RemoveCircleOutlineIcon sx={{ fontSize: 18 }} />
                          </IconButton>
                        )}
                      </Box>
                    </Box>
                  );
                })}
              </Stack>
            </motion.div>
          )}

          {/* ─── SUB-VIEW: GROUP SETTINGS & PERMISSIONS ─── */}
          {activeSubView === "groupSettings" && (
            <motion.div key="group-settings" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
              <Box sx={{ display: "flex", alignItems: "center", mb: 2.5 }}>
                <Button
                  component={motion.button}
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.94 }}
                  transition={bounceTransition}
                  onClick={() => setActiveSubView(null)}
                  startIcon={<ArrowBackIcon sx={{ fontSize: 18 }} />}
                  sx={{ color: isDark ? "#fff" : "#111", bgcolor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)", borderRadius: "999px", px: 2, py: 0.6, textTransform: "none", fontWeight: 600 }}
                >
                  Back to Group
                </Button>
              </Box>
              <Typography sx={{ fontSize: "1.25rem", fontWeight: 700, mb: 2.5 }}>Group Settings & Permissions</Typography>
              
              <Stack spacing={2.5}>
                <Box sx={{ p: 2, bgcolor: isDark ? "#161618" : "#fff", borderRadius: "16px" }}>
                  <Typography sx={{ fontWeight: 600, mb: 1, fontSize: "0.95rem" }}>Who can edit group info?</Typography>
                  <Stack direction="row" spacing={1}>
                    {["admin", "all"].map((role) => (
                      <Button
                        key={role}
                        variant={groupInfo.editAccess === role ? "contained" : "outlined"}
                        onClick={() => handlePermissionChange("editAccess", role)}
                        sx={{ flex: 1, borderRadius: "10px", textTransform: "none", fontSize: "0.82rem", fontWeight: 600 }}
                      >
                        {role === "admin" ? "Admins Only" : "All Members"}
                      </Button>
                    ))}
                  </Stack>
                </Box>

                <Box sx={{ p: 2, bgcolor: isDark ? "#161618" : "#fff", borderRadius: "16px" }}>
                  <Typography sx={{ fontWeight: 600, mb: 1, fontSize: "0.95rem" }}>Who can add members?</Typography>
                  <Stack direction="row" spacing={1}>
                    {["admin", "all"].map((role) => (
                      <Button
                        key={role}
                        variant={groupInfo.inviteAccess === role ? "contained" : "outlined"}
                        onClick={() => handlePermissionChange("inviteAccess", role)}
                        sx={{ flex: 1, borderRadius: "10px", textTransform: "none", fontSize: "0.82rem", fontWeight: 600 }}
                      >
                        {role === "admin" ? "Admins Only" : "All Members"}
                      </Button>
                    ))}
                  </Stack>
                </Box>

                <Box sx={{ p: 2, bgcolor: isDark ? "#161618" : "#fff", borderRadius: "16px" }}>
                  <Typography sx={{ fontWeight: 600, mb: 1, fontSize: "0.95rem" }}>Admin Management (Promote / Demote)</Typography>
                  <Typography variant="caption" sx={{ opacity: 0.6, display: "block", mb: 1.5 }}>Only group creator and admins can change admin roles.</Typography>
                  <Stack spacing={1} sx={{ maxHeight: 240, overflowY: "auto" }}>
                    {(groupInfo.members || []).map((mUid) => {
                      const m = memberInfo[mUid] || {};
                      const isGrpCreator = mUid === groupInfo.createdBy;
                      const isGrpAdmin = (groupInfo.admins || []).includes(mUid);
                      return (
                        <Box key={mUid} sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", py: 0.5 }}>
                          <Typography sx={{ fontSize: "0.9rem", fontWeight: 500 }}>{m.name || mUid.slice(0, 8)}</Typography>
                          {!isGrpCreator ? (
                            <Button
                              size="small"
                              variant={isGrpAdmin ? "contained" : "outlined"}
                              onClick={() => toggleAdminStatus(mUid)}
                              sx={{ textTransform: "none", fontSize: "0.75rem", borderRadius: "8px" }}
                            >
                              {isGrpAdmin ? "Admin" : "Make Admin"}
                            </Button>
                          ) : (
                            <Chip label="Owner" size="small" />
                          )}
                        </Box>
                      );
                    })}
                  </Stack>
                </Box>
              </Stack>
            </motion.div>
          )}

          {/* ─── 4. SUB-VIEW: EDIT GROUP INFO ─── */}
          {activeSubView === "editGroup" && (
            <motion.div key="edit-group" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
              <Box sx={{ display: "flex", alignItems: "center", mb: 2.5 }}>
                <Button
                  component={motion.button}
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.94 }}
                  transition={bounceTransition}
                  onClick={() => setActiveSubView(null)}
                  startIcon={<ArrowBackIcon sx={{ fontSize: 18 }} />}
                  sx={{ color: isDark ? "#fff" : "#111", bgcolor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)", borderRadius: "999px", px: 2, py: 0.6, textTransform: "none", fontWeight: 600 }}
                >
                  Back to Group
                </Button>
              </Box>
              <Typography sx={{ fontSize: "1.25rem", fontWeight: 700, mb: 2.5 }}>Edit Group Details</Typography>
              
              <TextField
                fullWidth
                label="Group Name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                sx={{ mb: 2.5, "& .MuiOutlinedInput-root": { borderRadius: "14px", bgcolor: isDark ? "#161618" : "#fff" } }}
              />

              <Box display="flex" justifyContent="center" mb={2}>
                {groupIconType === "emoji" ? (
                  <Avatar sx={{ width: 76, height: 76, fontSize: 36, bgcolor: isDark ? "#232323" : "#e0e0e0" }}>
                    {groupIconValue || "📍"}
                  </Avatar>
                ) : (
                  <Avatar src={groupIconValue} sx={{ width: 76, height: 76, bgcolor: isDark ? "#232323" : "#e0e0e0" }} />
                )}
              </Box>

              <FormControl fullWidth sx={{ mb: 2.5 }}>
                <InputLabel sx={{ color: isDark ? "#ccc" : "#555" }}>Icon Type</InputLabel>
                <Select
                  value={groupIconType}
                  label="Icon Type"
                  onChange={(e) => setGroupIconType(e.target.value)}
                  sx={{ borderRadius: "14px", bgcolor: isDark ? "#161618" : "#fff" }}
                >
                  <MenuItem value="emoji">Emoji</MenuItem>
                  <MenuItem value="image">Image URL</MenuItem>
                </Select>
              </FormControl>

              {groupIconType === "emoji" ? (
                <Grid container spacing={1} sx={{ mb: 2.5 }}>
                  {["😀", "😎", "🔥", "🎉", "🚀", "🌍", "📚", "🧠", "🧳", "🍕", "🎮", "🏖️"].map((emoji) => (
                    <Grid item xs={3} key={emoji}>
                      <Button
                        variant={groupIconValue === emoji ? "contained" : "outlined"}
                        onClick={() => setGroupIconValue(emoji)}
                        sx={{ fontSize: 22, width: "100%", aspectRatio: "1", borderRadius: "12px" }}
                      >
                        {emoji}
                      </Button>
                    </Grid>
                  ))}
                </Grid>
              ) : (
                <TextField
                  fullWidth
                  label="Image URL string"
                  value={groupIconValue}
                  onChange={(e) => setGroupIconValue(e.target.value)}
                  sx={{ mb: 2.5, "& .MuiOutlinedInput-root": { borderRadius: "14px", bgcolor: isDark ? "#161618" : "#fff" } }}
                />
              )}

              <TextField
                fullWidth
                multiline
                rows={3}
                label="Group Description"
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                sx={{ mb: 2.5, "& .MuiOutlinedInput-root": { borderRadius: "14px", bgcolor: isDark ? "#161618" : "#fff" } }}
              />

              <Button
                fullWidth
                variant="contained"
                onClick={handleUpdateGroupInfo}
                sx={{ py: 1.4, borderRadius: "14px", fontWeight: 700, textTransform: "none" }}
              >
                Save Changes
              </Button>
            </motion.div>
          )}

          {/* ─── 5. SUB-VIEW: INVITE & QR ─── */}
          {activeSubView === "invite" && (
            <motion.div key="invite-view" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} style={{ textAlign: "center" }}>
              <Box sx={{ display: "flex", alignItems: "center", mb: 2.5, textAlign: "left" }}>
                <Button
                  component={motion.button}
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.94 }}
                  transition={bounceTransition}
                  onClick={() => setActiveSubView(null)}
                  startIcon={<ArrowBackIcon sx={{ fontSize: 18 }} />}
                  sx={{ color: isDark ? "#fff" : "#111", bgcolor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)", borderRadius: "999px", px: 2, py: 0.6, textTransform: "none", fontWeight: 600 }}
                >
                  Back to Group
                </Button>
              </Box>
              <Typography sx={{ fontSize: "1.25rem", fontWeight: 700, mb: 2 }}>Invite to {groupDisplayName}</Typography>
              <Box sx={{ p: 2, bgcolor: "#fff", borderRadius: "20px", display: "inline-block", mb: 2.5, boxShadow: "0 8px 24px rgba(0,0,0,0.1)" }}>
                <QRCodeCanvas value={`${window.location.origin}/group/${encodeURIComponent(resolvedGroupName)}`} size={180} />
              </Box>
              <Button
                fullWidth
                variant="contained"
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/group/${encodeURIComponent(resolvedGroupName)}`);
                  setCopiedLink(true);
                  setTimeout(() => setCopiedLink(false), 2000);
                }}
                startIcon={<ContentCopyIcon />}
                sx={{ py: 1.3, borderRadius: "14px", fontWeight: 700, textTransform: "none", mb: 1.5 }}
              >
                {copiedLink ? "✓ Link Copied!" : "Copy Invite Link"}
              </Button>
            </motion.div>
          )}

          {/* ─── 6. MAIN GROUP INFO PANEL VIEW ─── */}
          {activeSubView === null && (
            <motion.div key="group-main" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
              {onClose && (
                <Box sx={{ display: "flex", alignItems: "center", mt: 1, mb: 1 }}>
                  <IconButton
                    component={motion.button}
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.94 }}
                    transition={bounceTransition}
                    onClick={onClose}
                    sx={{ color: isDark ? "#fff" : "#111", bgcolor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)", borderRadius: "999px", p: 1, width: 38, height: 38 }}
                  >
                    <ArrowBackIcon sx={{ fontSize: 21 }} />
                  </IconButton>
                </Box>
              )}

              <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", mt: 1, mb: 3 }}>
                <Avatar
                  src={groupPhoto}
                  alt={groupDisplayName}
                  sx={{ width: 104, height: 104, mb: 1.5, bgcolor: isDark ? "#232326" : "#e0e0e0", fontSize: "2.4rem", fontWeight: 700 }}
                >
                  {groupInfo.emoji || groupDisplayName[0]?.toUpperCase() || "G"}
                </Avatar>

                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.3 }}>
                  <Typography sx={{ fontWeight: 700, fontSize: "1.35rem" }}>{groupDisplayName}</Typography>
                  {groupDisplayName === "BM - Beta members" && (
                    <Chip label="🔒 Beta" size="small" sx={{ bgcolor: "rgba(0, 247, 33, 0.15)", color: "#00f721", fontWeight: 700, fontSize: "0.72rem", height: 22 }} />
                  )}
                </Box>

                <Typography sx={{ fontSize: "0.9rem", opacity: 0.55, mb: 1 }}>
                  {(groupInfo.members || []).length} Members
                </Typography>

                {groupInfo.description && (
                  <Typography sx={{ fontSize: "0.88rem", opacity: 0.75, px: 2, mb: 1, whiteSpace: "pre-wrap" }}>
                    {groupInfo.description}
                  </Typography>
                )}

                {createdByUser && (
                  <Box sx={{ px: 1.8, py: 0.5, borderRadius: "999px", bgcolor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)", fontSize: "0.82rem" }}>
                    Created by {createdByUser.name || "User"}
                  </Box>
                )}
              </Box>

              {/* 4x1 Quick Grid */}
              <Box sx={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 1, mb: 3.5 }}>
                {[
                  { label: "Search", icon: <SearchIcon sx={{ fontSize: 22, mb: 0.5 }} />, onClick: () => { if (groupData?.onOpenSearch) groupData.onOpenSearch(); if (onClose) onClose(); } },
                  { label: "Invite", icon: <ShareIcon sx={{ fontSize: 22, mb: 0.5 }} />, onClick: () => setActiveSubView("invite") },
                  { label: "Settings", icon: <SettingsOutlinedIcon sx={{ fontSize: 22, mb: 0.5 }} />, onClick: () => setActiveSubView("groupSettings") },
                  { label: "Members", icon: <AddIcon sx={{ fontSize: 22, mb: 0.5 }} />, onClick: () => setActiveSubView("membersList") },
                ].map((item, idx) => (
                  <Box
                    key={idx}
                    component={motion.div}
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.94 }}
                    transition={bounceTransition}
                    onClick={item.onClick}
                    sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", bgcolor: isDark ? "#181818a9" : "#ffffffc6", borderRadius: 5, py: 1.5, cursor: "pointer", boxShadow: 'inset 0 1px 1px rgba(255, 255, 255, 0.08), inset 0 -1px 1px rgba(0,0,0,0.1)' }}
                  >
                    {item.icon}
                    <Typography sx={{ fontSize: "0.75rem", fontWeight: 600 }}>{item.label}</Typography>
                  </Box>
                ))}
              </Box>

              {/* Linked Trip Card */}
              {tripInfo && (
                <Box
                  component={motion.div}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigate(`/trips`)}
                  sx={{ mb: 3.5, p: 2, bgcolor: isDark ? "#161618" : "#ffffff", border: `1px solid ${isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.06)"}`, borderRadius: "16px", cursor: "pointer" }}
                >
                  <Typography sx={{ fontWeight: 700, fontSize: "1.1rem", mb: 1 }}>{tripInfo.name || "Associated Trip"}</Typography>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.6 }}>
                    <PlaceIcon sx={{ fontSize: 16, opacity: 0.6 }} />
                    <Typography sx={{ fontSize: "0.85rem", opacity: 0.7 }}>{tripInfo.from || "Start"} → {tripInfo.to || tripInfo.location || "Destination"}</Typography>
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <AccessTimeIcon sx={{ fontSize: 16, opacity: 0.6 }} />
                    <Typography sx={{ fontSize: "0.85rem", opacity: 0.7 }}>{tripInfo.startDate && tripInfo.endDate ? `${tripInfo.startDate} → ${tripInfo.endDate}` : "Upcoming"}</Typography>
                  </Box>
                </Box>
              )}

              {/* Options Section */}
              <Box sx={{ bgcolor: isDark ? "#f1f1f106" : "#0c0c0c05", borderRadius: 6, overflow: "hidden", mb: 3.5, py: 0.5 }}>
                {canAddMembers && (
                  <Box onClick={() => setAddUserOpen(true)} sx={{ display: "flex", alignItems: "center", px: 2, py: 1.4, cursor: "pointer" }}>
                    <AddIcon sx={{ fontSize: 20, mr: 2, opacity: 0.8 }} />
                    <Typography sx={{ fontSize: "0.95rem", fontWeight: 500 }}>Add Members</Typography>
                  </Box>
                )}
                {canEditGroupInfo && (
                  <>
                    {internalDivider}
                    <Box onClick={() => setActiveSubView("editGroup")} sx={{ display: "flex", alignItems: "center", px: 2, py: 1.4, cursor: "pointer" }}>
                      <EditIcon sx={{ fontSize: 20, mr: 2, opacity: 0.8 }} />
                      <Typography sx={{ fontSize: "0.95rem", fontWeight: 500 }}>Edit Group Info</Typography>
                    </Box>
                  </>
                )}
                {isAdmin && (
                  <>
                    {internalDivider}
                    <Box onClick={() => setActiveSubView("groupSettings")} sx={{ display: "flex", alignItems: "center", px: 2, py: 1.4, cursor: "pointer" }}>
                      <SettingsOutlinedIcon sx={{ fontSize: 20, mr: 2, opacity: 0.8 }} />
                      <Typography sx={{ fontSize: "0.95rem", fontWeight: 500 }}>Group Permissions & Settings</Typography>
                    </Box>
                  </>
                )}

                {internalDivider}

                <Box onClick={() => setIsFavorite(toggleFavoriteChat(resolvedGroupName))} sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: 2, py: 1.4, cursor: "pointer" }}>
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    {isFavorite ? <StarRoundedIcon sx={{ color: "#ffb300", fontSize: 22, mr: 2 }} /> : <StarBorderRoundedIcon sx={{ fontSize: 22, mr: 2, opacity: 0.7 }} />}
                    <Typography sx={{ fontSize: "0.95rem", fontWeight: 500 }}>Add to Favorites</Typography>
                  </Box>
                  <Chip label={isFavorite ? "Favorited" : "Off"} size="small" sx={{ bgcolor: isFavorite ? "rgba(255, 179, 0, 0.15)" : "transparent", color: isFavorite ? "#ffb300" : "inherit", fontWeight: 600, fontSize: "0.75rem" }} />
                </Box>

                {internalDivider}

                <Box onClick={() => setMuteDialogOpen(true)} sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: 2, py: 1.4, cursor: "pointer" }}>
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    {isMuted ? <NotificationsOffOutlinedIcon sx={{ color: "#ef4444", fontSize: 21, mr: 2 }} /> : <NotificationsActiveOutlinedIcon sx={{ fontSize: 21, mr: 2, opacity: 0.7 }} />}
                    <Typography sx={{ fontSize: "0.95rem", fontWeight: 500 }}>Mute Notifications</Typography>
                  </Box>
                  <Chip label={isMuted ? "Muted" : "Unmuted"} size="small" sx={{ bgcolor: isMuted ? "rgba(239, 68, 68, 0.15)" : "transparent", color: isMuted ? "#ef4444" : "inherit", fontWeight: 600, fontSize: "0.75rem" }} />
                </Box>

                {internalDivider}

                <Box onClick={() => setDisappearingDialogOpen(true)} sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: 2, py: 1.4, cursor: "pointer" }}>
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <TimelapseRoundedIcon sx={{ fontSize: 21, mr: 2, opacity: 0.8 }} />
                    <Typography sx={{ fontSize: "0.95rem", fontWeight: 500 }}>Disappearing Messages</Typography>
                  </Box>
                  <Chip label={disappearingDuration > 0 ? "On" : "Off"} size="small" sx={{ fontWeight: 600, fontSize: "0.75rem" }} />
                </Box>
              </Box>

              {/* Shared Content Button */}
              <Box sx={{ mb: 3.5 }}>
                <Box
                  component={motion.div}
                  whileHover={{ scale: 1.01, bgcolor: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)" }}
                  whileTap={{ scale: 0.98 }}
                  transition={bounceTransition}
                  onClick={() => setActiveSubView("sharedMedia")}
                  sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: 2, py: 1.4, bgcolor: isDark ? "#161618" : "#ffffff", border: `1px solid ${isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.06)"}`, borderRadius: "14px", cursor: "pointer" }}
                >
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <PermMediaOutlinedIcon sx={{ fontSize: 21, mr: 2, color: isDark ? "#00b7ff" : "#0288d1" }} />
                    <Typography sx={{ fontSize: "0.95rem", fontWeight: 600 }}>Shared Media & Files</Typography>
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Chip label={`${sharedMedia.length}`} size="small" sx={{ fontWeight: 600, fontSize: "0.75rem" }} />
                    <ChevronRightIcon sx={{ fontSize: 20, opacity: 0.5 }} />
                  </Box>
                </Box>
              </Box>

              {/* Danger Actions Section */}
              <Box sx={{ bgcolor: isDark ? "rgba(239, 68, 68, 0.08)" : "rgba(239, 68, 68, 0.05)", borderRadius: 6, overflow: "hidden", py: 0.5 }}>
                <Box onClick={handleExitGroup} sx={{ display: "flex", alignItems: "center", px: 2, py: 1.5, cursor: "pointer" }}>
                  <ExitToAppOutlinedIcon sx={{ color: "#ef4444", fontSize: 21, mr: 2 }} />
                  <Typography sx={{ color: "#ef4444", fontSize: "0.95rem", fontWeight: 600 }}>Exit Group</Typography>
                </Box>
              </Box>
            </motion.div>
          )}
        </AnimatePresence>
      </Box>

      {/* Add Users Dialog */}
      <Dialog open={addUserOpen} onClose={() => setAddUserOpen(false)} PaperProps={{ sx: { borderRadius: "20px", bgcolor: isDark ? "#18181c" : "#fff", p: 2, width: "100%", maxWidth: 400 } }}>
        <DialogTitle sx={{ fontWeight: 800 }}>Add Members</DialogTitle>
        <DialogContent>
          <TextField fullWidth size="small" placeholder="Search users..." value={userSearchTerm} onChange={(e) => setUserSearchTerm(e.target.value)} sx={{ my: 1.5 }} />
          <Stack spacing={1} sx={{ maxHeight: 240, overflowY: "auto" }}>
            {userSearchResults.map((u) => (
              <Box key={u.uid} onClick={() => setSelectedUsers((prev) => prev.includes(u.uid) ? prev.filter((id) => id !== u.uid) : [...prev, u.uid])} sx={{ display: "flex", alignItems: "center", p: 1, borderRadius: "10px", bgcolor: selectedUsers.includes(u.uid) ? "rgba(0,183,255,0.15)" : "transparent", cursor: "pointer" }}>
                <Avatar src={safeImageUrl(u.photoURL)} sx={{ width: 32, height: 32, mr: 1.5 }} />
                <Typography sx={{ fontSize: "0.9rem", fontWeight: 600 }}>{u.name || u.username}</Typography>
              </Box>
            ))}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddUserOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleBatchAddUsers} disabled={selectedUsers.length === 0}>Add</Button>
        </DialogActions>
      </Dialog>

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
              setChatDisappearingDuration(resolvedGroupName, dur, "group");
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
    </Drawer>
  );
};

export default React.memo(GroupInfoDrawer);