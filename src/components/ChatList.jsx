// src/components/ChatList.jsx
import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  TextField,
  InputAdornment,
  Avatar,
  Badge,
  Chip,
  IconButton,
  Tooltip,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from "@mui/material";
import {
  Search as SearchIcon,
  CloseRounded as CloseIcon,
  PersonAdd as PersonAddIcon,
  Add as AddIcon,
  GroupAdd as GroupAddIcon,
} from "../icons";
import { isValidImageUrl, safeImageUrl } from "../utils/uiHelpers";
import { format, isToday, isYesterday } from "date-fns";
import { db } from "../firebase";
import { useAuth } from "../hooks/useAuth";
import { useThemeToggle } from "../contexts/ThemeToggleContext";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
  updateDoc,
  setDoc,
  arrayUnion,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";

const formatTimestamp = (date) => {
  if (!date) return "";
  const d = date instanceof Date ? date : date?.toDate ? date.toDate() : new Date(date);
  if (isNaN(d.getTime())) return "";
  if (isToday(d)) return format(d, "h:mm a");
  if (isYesterday(d)) return "Yesterday";
  return format(d, "dd/MM/yy");
};

const ChatList = ({
  selectedChatId,
  onSelectChat,
  onOpenProfile,
}) => {
  const { user: currentUser } = useAuth();
  const { mode } = useThemeToggle();
  const isDark = mode === "dark";

  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all"); // 'all' | 'direct' | 'groups' | 'unread'
  const [friends, setFriends] = useState([]);
  const [friendUsers, setFriendUsers] = useState([]);
  const [nicknames, setNicknames] = useState({});
  const [latestMessages, setLatestMessages] = useState({});
  const [latestTimestamps, setLatestTimestamps] = useState({});
  const [unreadCounts, setUnreadCounts] = useState({});
  const [userGroups, setUserGroups] = useState([]);
  const [latestGroupMessages, setLatestGroupMessages] = useState({});
  const [latestGroupTimestamps, setLatestGroupTimestamps] = useState({});
  const [groupUnreadCounts, setGroupUnreadCounts] = useState({});
  const [loading, setLoading] = useState(true);

  // New Friend / Group Dialog States
  const [addFriendOpen, setAddFriendOpen] = useState(false);
  const [friendSearchQuery, setFriendSearchQuery] = useState("");
  const [searchFriendResults, setSearchFriendResults] = useState([]);
  const [createGroupOpen, setCreateGroupOpen] = useState(false);
  const [groupNameInput, setGroupNameInput] = useState("");
  const [groupDescInput, setGroupDescInput] = useState("");
  const [selectedGroupFriends, setSelectedGroupFriends] = useState([]);

  // Fetch Current User's Friends and Nicknames
  useEffect(() => {
    if (!currentUser?.uid) return;
    const userRef = doc(db, "users", currentUser.uid);

    const unsubUser = onSnapshot(userRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setFriends(data.friends || []);
        setNicknames(data.nicknames || {});
      }
    });

    return () => unsubUser();
  }, [currentUser]);

  // Fetch Friend User Objects
  useEffect(() => {
    if (!currentUser?.uid || friends.length === 0) {
      setFriendUsers([]);
      setLoading(false);
      return;
    }

    const loadFriendsData = async () => {
      try {
        const friendDocs = await Promise.all(
          friends.map((uid) => getDoc(doc(db, "users", uid)))
        );
        const users = friendDocs
          .filter((d) => d.exists())
          .map((d) => ({
            id: d.id,
            uid: d.id,
            ...d.data(),
          }));
        setFriendUsers(users);
      } catch (err) {
        console.error("Error loading friends details:", err);
      } finally {
        setLoading(false);
      }
    };

    loadFriendsData();
  }, [friends, currentUser]);

  // Listen for direct messages and unread counts for each friend
  useEffect(() => {
    if (!currentUser?.uid || friendUsers.length === 0) return;

    const unsubs = friendUsers.map((user) => {
      const chatId = [currentUser.uid, user.id].sort().join("_");
      const q = query(
        collection(db, "chats", chatId, "messages"),
        orderBy("timestamp", "desc"),
        limit(1)
      );

      return onSnapshot(q, (snapshot) => {
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          const msg = data.system
            ? `${data.text}`
            : data.text || (data.imageUrl ? "📷 Photo" : "No messages yet");
          const ts = data.timestamp?.toDate ? data.timestamp.toDate() : new Date(0);
          const unread =
            data.senderId !== currentUser.uid && !data.isRead ? 1 : 0;

          setLatestMessages((prev) => ({ ...prev, [user.id]: msg }));
          setLatestTimestamps((prev) => ({ ...prev, [user.id]: ts }));
          setUnreadCounts((prev) => ({ ...prev, [user.id]: unread }));
        });
      });
    });

    return () => unsubs.forEach((u) => u && u());
  }, [friendUsers, currentUser]);

  // Listen for user group chats
  useEffect(() => {
    if (!currentUser?.uid) return;
    const q = query(
      collection(db, "groupChats"),
      where("members", "array-contains", currentUser.uid)
    );

    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setUserGroups(list);
    });

    return () => unsub();
  }, [currentUser]);

  // Listen for latest group messages and unread counts
  useEffect(() => {
    if (!currentUser?.uid || userGroups.length === 0) return;

    const unsubs = userGroups.map((group) => {
      const q = query(
        collection(db, "groupChat", group.id, "messages"),
        orderBy("timestamp", "desc"),
        limit(1)
      );

      return onSnapshot(q, (snap) => {
        snap.forEach((docSnap) => {
          const data = docSnap.data();
          const msg =
            data.type === "system"
              ? data.content
              : data.text || (data.imageUrl ? "📷 Photo" : "No messages yet");
          const ts = data.timestamp?.toDate ? data.timestamp.toDate() : new Date(0);
          const unread =
            data.senderId !== currentUser.uid &&
            (!data.read || !data.readBy?.includes(currentUser.uid));

          setLatestGroupMessages((prev) => ({ ...prev, [group.id]: msg }));
          setLatestGroupTimestamps((prev) => ({ ...prev, [group.id]: ts }));
          setGroupUnreadCounts((prev) => ({ ...prev, [group.id]: unread ? 1 : 0 }));
        });
      });
    });

    return () => unsubs.forEach((u) => u && u());
  }, [userGroups, currentUser]);

  // Search users in Firestore when adding friend
  useEffect(() => {
    if (!friendSearchQuery.trim() || !currentUser?.uid) {
      setSearchFriendResults([]);
      return;
    }

    const searchTimer = setTimeout(async () => {
      try {
        const usersSnap = await getDocs(collection(db, "users"));
        const matches = [];
        usersSnap.forEach((d) => {
          const data = d.data();
          if (
            (data.username?.toLowerCase().includes(friendSearchQuery.toLowerCase()) ||
              data.name?.toLowerCase().includes(friendSearchQuery.toLowerCase())) &&
            d.id !== currentUser.uid &&
            !friends.includes(d.id)
          ) {
            matches.push({ id: d.id, uid: d.id, ...data });
          }
        });
        setSearchFriendResults(matches);
      } catch (err) {
        console.error("Error searching users:", err);
      }
    }, 250);

    return () => clearTimeout(searchTimer);
  }, [friendSearchQuery, currentUser, friends]);

  // Add friend handler
  const handleAddFriend = async (targetUser) => {
    if (!currentUser?.uid || !targetUser?.id) return;
    try {
      const currentRef = doc(db, "users", currentUser.uid);
      const targetRef = doc(db, "users", targetUser.id);

      await Promise.all([
        updateDoc(currentRef, { friends: arrayUnion(targetUser.id) }),
        updateDoc(targetRef, { friends: arrayUnion(currentUser.uid) }),
      ]);

      await addDoc(collection(db, "notifications"), {
        content: `${currentUser.displayName || "A user"} added you as a friend.`,
        pic: currentUser.photoURL || "",
        seen: false,
        senderId: currentUser.uid,
        timestamp: new Date(),
        title: "New Friend Added",
        type: "friend_added",
        uid: targetUser.id,
      });

      setAddFriendOpen(false);
      setFriendSearchQuery("");
    } catch (err) {
      console.error("Error adding friend:", err);
    }
  };

  // Create Group Chat handler
  const handleCreateGroup = async () => {
    if (!groupNameInput.trim() || !currentUser?.uid) return;
    try {
      const allMembers = [currentUser.uid, ...selectedGroupFriends];
      const newGroupRef = doc(collection(db, "groupChats"));

      await setDoc(newGroupRef, {
        name: groupNameInput.trim(),
        description: groupDescInput.trim(),
        iconURL: "",
        members: allMembers,
        createdBy: currentUser.uid,
        createdAt: new Date().toISOString(),
      });

      setCreateGroupOpen(false);
      setGroupNameInput("");
      setGroupDescInput("");
      setSelectedGroupFriends([]);

      if (onSelectChat) {
        onSelectChat({
          type: "group",
          id: newGroupRef.id,
          name: groupNameInput.trim(),
        });
      }
    } catch (err) {
      console.error("Error creating group:", err);
    }
  };

  // Combine direct and group chats
  const combinedChats = [
    ...friendUsers.map((user) => ({
      type: "user",
      id: user.id,
      name: nicknames[user.id] || user.name || user.username || "Friend",
      photoURL: user.photoURL,
      lastMessage: latestMessages[user.id] || "Start a conversation",
      timestamp: latestTimestamps[user.id] || new Date(0),
      unreadCount: unreadCounts[user.id] || 0,
      rawData: user,
    })),
    ...userGroups.map((group) => ({
      type: "group",
      id: group.id,
      name: group.name || "Group Chat",
      iconURL: group.iconURL,
      lastMessage: latestGroupMessages[group.id] || "No messages yet",
      timestamp: latestGroupTimestamps[group.id] || new Date(0),
      unreadCount: groupUnreadCounts[group.id] || 0,
      rawData: group,
    })),
  ]
    .filter((chat) => {
      // Search filter
      const matchesSearch =
        searchTerm.trim() === "" ||
        chat.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        chat.lastMessage?.toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchesSearch) return false;

      // Chip filter
      if (filter === "direct") return chat.type === "user";
      if (filter === "groups") return chat.type === "group";
      if (filter === "unread") return chat.unreadCount > 0;
      return true;
    })
    .sort((a, b) => b.timestamp - a.timestamp);

  return (
    <Box
      sx={{
        width: { xs: "100%", md: 340, lg: 360 },
        flexShrink: 0,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        borderRight: `1px solid ${
          isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.08)"
        }`,
        backgroundColor: isDark
          ? "rgba(14, 14, 14, 0.65)"
          : "rgba(255, 255, 255, 0.65)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        overflow: "hidden",
      }}
    >
      {/* ─── Top Header & Actions ─── */}
      <Box
        sx={{
          p: 2.5,
          pb: 1.5,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 700, letterSpacing: "-0.3px" }}>
          Messages
        </Typography>

        <Box sx={{ display: "flex", gap: 0.8 }}>
          <Tooltip title="Add New Friend" arrow>
            <IconButton
              size="small"
              onClick={() => setAddFriendOpen(true)}
              sx={{
                width: 32,
                height: 32,
                borderRadius: "10px",
                backgroundColor: isDark
                  ? "rgba(255, 255, 255, 0.06)"
                  : "rgba(0, 0, 0, 0.04)",
                color: isDark ? "#fff" : "#111",
                "&:hover": {
                  backgroundColor: isDark
                    ? "rgba(255, 255, 255, 0.12)"
                    : "rgba(0, 0, 0, 0.08)",
                },
              }}
            >
              <PersonAddIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>

          <Tooltip title="Create Group" arrow>
            <IconButton
              size="small"
              onClick={() => setCreateGroupOpen(true)}
              sx={{
                width: 32,
                height: 32,
                borderRadius: "10px",
                backgroundColor: isDark
                  ? "rgba(255, 255, 255, 0.06)"
                  : "rgba(0, 0, 0, 0.04)",
                color: isDark ? "#fff" : "#111",
                "&:hover": {
                  backgroundColor: isDark
                    ? "rgba(255, 255, 255, 0.12)"
                    : "rgba(0, 0, 0, 0.08)",
                },
              }}
            >
              <GroupAddIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* ─── Search Input ─── */}
      <Box sx={{ px: 2, pb: 1.5 }}>
        <TextField
          size="small"
          fullWidth
          placeholder="Search conversations..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ fontSize: 18, color: "text.secondary" }} />
              </InputAdornment>
            ),
            endAdornment: searchTerm ? (
              <InputAdornment position="end">
                <IconButton size="small" onClick={() => setSearchTerm("")}>
                  <CloseIcon sx={{ fontSize: 16 }} />
                </IconButton>
              </InputAdornment>
            ) : null,
            sx: {
              borderRadius: "14px",
              fontSize: "0.88rem",
              backgroundColor: isDark
                ? "rgba(255, 255, 255, 0.05)"
                : "rgba(0, 0, 0, 0.04)",
              "& fieldset": {
                borderColor: isDark
                  ? "rgba(255, 255, 255, 0.08)"
                  : "rgba(0, 0, 0, 0.08)",
              },
              "&:hover fieldset": {
                borderColor: isDark
                  ? "rgba(255, 255, 255, 0.16)"
                  : "rgba(0, 0, 0, 0.16)",
              },
            },
          }}
        />
      </Box>

      {/* ─── Filter Chips ─── */}
      <Box
        sx={{
          px: 2,
          pb: 1.5,
          display: "flex",
          gap: 0.8,
          overflowX: "auto",
          scrollbarWidth: "none",
          "&::-webkit-scrollbar": { display: "none" },
        }}
      >
        {[
          { id: "all", label: "All" },
          { id: "direct", label: "Friends" },
          { id: "groups", label: "Groups" },
          { id: "unread", label: "Unread" },
        ].map((item) => {
          const selected = filter === item.id;
          return (
            <Chip
              key={item.id}
              label={item.label}
              size="small"
              onClick={() => setFilter(item.id)}
              sx={{
                fontWeight: selected ? 700 : 500,
                fontSize: "0.78rem",
                borderRadius: "10px",
                cursor: "pointer",
                backgroundColor: selected
                  ? isDark
                    ? "#ffffff"
                    : "#111111"
                  : isDark
                  ? "rgba(255, 255, 255, 0.06)"
                  : "rgba(0, 0, 0, 0.05)",
                color: selected
                  ? isDark
                    ? "#000000"
                    : "#ffffff"
                  : "text.primary",
                "&:hover": {
                  backgroundColor: selected
                    ? isDark
                      ? "#ffffff"
                      : "#111111"
                    : isDark
                    ? "rgba(255, 255, 255, 0.1)"
                    : "rgba(0, 0, 0, 0.08)",
                },
              }}
            />
          );
        })}
      </Box>

      {/* ─── Chats List ─── */}
      <Box
        sx={{
          flex: 1,
          overflowY: "auto",
          p: 1.5,
          display: "flex",
          flexDirection: "column",
          gap: 0.75,
          scrollbarWidth: "thin",
          scrollbarColor: isDark
            ? "rgba(255, 255, 255, 0.1) transparent"
            : "rgba(0, 0, 0, 0.1) transparent",
        }}
      >
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
            <CircularProgress size={24} />
          </Box>
        ) : combinedChats.length === 0 ? (
          <Box sx={{ textAlign: "center", py: 8, px: 2 }}>
            <Typography variant="body2" sx={{ color: "text.secondary", mb: 1 }}>
              {searchTerm ? "No matching conversations" : "No conversations yet"}
            </Typography>
            <Button
              size="small"
              variant="outlined"
              startIcon={<PersonAddIcon sx={{ fontSize: 16 }} />}
              onClick={() => setAddFriendOpen(true)}
              sx={{ borderRadius: 2, textTransform: "none", fontSize: "0.8rem", mt: 1 }}
            >
              Add a Friend
            </Button>
          </Box>
        ) : (
          combinedChats.map((chat) => {
            const isSelected = selectedChatId === chat.id;

            return (
              <Box
                key={chat.id}
                onClick={() => onSelectChat && onSelectChat(chat)}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                  p: 1.2,
                  borderRadius: "16px",
                  cursor: "pointer",
                  position: "relative",
                  transition: "all 0.18s cubic-bezier(0.16, 1, 0.3, 1)",
                  backgroundColor: isSelected
                    ? isDark
                      ? "rgba(255, 255, 255, 0.12)"
                      : "rgba(0, 0, 0, 0.08)"
                    : "transparent",
                  boxShadow: isSelected
                    ? isDark
                      ? "inset 0 1px 1px rgba(255,255,255,0.1), 0 2px 8px rgba(0,0,0,0.2)"
                      : "inset 0 1px 1px rgba(255,255,255,0.8), 0 2px 8px rgba(0,0,0,0.04)"
                    : "none",
                  "&:hover": {
                    backgroundColor: isSelected
                      ? isDark
                        ? "rgba(255, 255, 255, 0.15)"
                        : "rgba(0, 0, 0, 0.1)"
                      : isDark
                      ? "rgba(255, 255, 255, 0.05)"
                      : "rgba(0, 0, 0, 0.04)",
                  },
                }}
              >
                {/* Active Indicator Bar */}
                {isSelected && (
                  <Box
                    sx={{
                      position: "absolute",
                      left: 2,
                      width: 3.5,
                      height: 20,
                      borderRadius: 2,
                      backgroundColor: isDark ? "#fff" : "#111",
                    }}
                  />
                )}

                {/* Avatar */}
                <Avatar
                  src={safeImageUrl(chat.photoURL || chat.iconURL)}
                  alt={chat.name}
                  onClick={(e) => {
                    if (onOpenProfile) {
                      e.stopPropagation();
                      onOpenProfile(chat.rawData || chat);
                    }
                  }}
                  sx={{
                    width: 44,
                    height: 44,
                    borderRadius: "14px",
                    fontWeight: 600,
                    fontSize: "1rem",
                    bgcolor: isDark
                      ? "rgba(255, 255, 255, 0.1)"
                      : "rgba(0, 0, 0, 0.08)",
                    color: isDark ? "#fff" : "#111",
                    border: `1px solid ${
                      isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)"
                    }`,
                    flexShrink: 0,
                  }}
                >
                  {(!isValidImageUrl(chat.iconURL) && chat.iconURL) || chat.name?.charAt(0)}
                </Avatar>

                {/* Info Text */}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      mb: 0.25,
                    }}
                  >
                    <Typography
                      variant="subtitle2"
                      sx={{
                        fontWeight: chat.unreadCount > 0 ? 700 : 600,
                        fontSize: "0.92rem",
                        lineHeight: 1.2,
                        color: isDark ? "#fff" : "#111",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {chat.name}
                    </Typography>

                    <Typography
                      variant="caption"
                      sx={{
                        fontSize: "0.72rem",
                        color:
                          chat.unreadCount > 0
                            ? isDark
                              ? "#38bdf8"
                              : "#0284c7"
                            : "text.secondary",
                        fontWeight: chat.unreadCount > 0 ? 600 : 400,
                        ml: 1,
                        flexShrink: 0,
                      }}
                    >
                      {formatTimestamp(chat.timestamp)}
                    </Typography>
                  </Box>

                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{
                        fontSize: "0.82rem",
                        color:
                          chat.unreadCount > 0
                            ? isDark
                              ? "#fff"
                              : "#000"
                            : isDark
                            ? "rgba(255,255,255,0.55)"
                            : "rgba(0,0,0,0.55)",
                        fontWeight: chat.unreadCount > 0 ? 600 : 400,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {chat.lastMessage}
                    </Typography>

                    {chat.unreadCount > 0 && (
                      <Box
                        sx={{
                          ml: 1,
                          minWidth: 18,
                          height: 18,
                          borderRadius: "9px",
                          px: 0.6,
                          backgroundColor: "#ff3b30",
                          color: "#fff",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "0.68rem",
                          fontWeight: 700,
                          flexShrink: 0,
                        }}
                      >
                        {chat.unreadCount}
                      </Box>
                    )}
                  </Box>
                </Box>
              </Box>
            );
          })
        )}
      </Box>

      {/* ─── Add Friend Dialog ─── */}
      <Dialog
        open={addFriendOpen}
        onClose={() => setAddFriendOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 4,
            p: 1,
            backgroundColor: isDark ? "#161616" : "#ffffff",
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, fontSize: "1.1rem" }}>
          Add a Friend
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            size="small"
            placeholder="Search by username or name..."
            value={friendSearchQuery}
            onChange={(e) => setFriendSearchQuery(e.target.value)}
            sx={{
              mt: 1,
              mb: 2,
              "& .MuiOutlinedInput-root": { borderRadius: 3 },
            }}
          />

          <Box sx={{ maxHeight: 240, overflowY: "auto" }}>
            {searchFriendResults.map((u) => (
              <Box
                key={u.id}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  p: 1.2,
                  borderRadius: 2.5,
                  mb: 0.5,
                  backgroundColor: isDark
                    ? "rgba(255,255,255,0.03)"
                    : "rgba(0,0,0,0.02)",
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                  <Avatar src={u.photoURL} sx={{ width: 36, height: 36, borderRadius: 2 }}>
                    {u.name?.charAt(0)}
                  </Avatar>
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {u.name}
                    </Typography>
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>
                      @{u.username}
                    </Typography>
                  </Box>
                </Box>

                <Button
                  size="small"
                  variant="contained"
                  onClick={() => handleAddFriend(u)}
                  sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600 }}
                >
                  Add
                </Button>
              </Box>
            ))}
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setAddFriendOpen(false)} sx={{ textTransform: "none" }}>
            Cancel
          </Button>
        </DialogActions>
      </Dialog>

      {/* ─── Create Group Dialog ─── */}
      <Dialog
        open={createGroupOpen}
        onClose={() => setCreateGroupOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 4,
            p: 1,
            backgroundColor: isDark ? "#161616" : "#ffffff",
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, fontSize: "1.1rem" }}>
          Create New Group
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            size="small"
            label="Group Name"
            value={groupNameInput}
            onChange={(e) => setGroupNameInput(e.target.value)}
            sx={{
              mt: 1.5,
              mb: 1.5,
              "& .MuiOutlinedInput-root": { borderRadius: 3 },
            }}
          />
          <TextField
            fullWidth
            size="small"
            label="Description (optional)"
            value={groupDescInput}
            onChange={(e) => setGroupDescInput(e.target.value)}
            sx={{
              mb: 2,
              "& .MuiOutlinedInput-root": { borderRadius: 3 },
            }}
          />

          <Typography variant="caption" sx={{ fontWeight: 600, color: "text.secondary", mb: 1, display: "block" }}>
            Select Friends to Add:
          </Typography>

          <Box sx={{ maxHeight: 180, overflowY: "auto", display: "flex", flexDirection: "column", gap: 0.5 }}>
            {friendUsers.map((f) => {
              const selected = selectedGroupFriends.includes(f.id);
              return (
                <Box
                  key={f.id}
                  onClick={() => {
                    setSelectedGroupFriends((prev) =>
                      selected ? prev.filter((id) => id !== f.id) : [...prev, f.id]
                    );
                  }}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1.5,
                    p: 1,
                    borderRadius: 2,
                    cursor: "pointer",
                    backgroundColor: selected
                      ? isDark
                        ? "rgba(255,255,255,0.12)"
                        : "rgba(0,0,0,0.08)"
                      : "transparent",
                  }}
                >
                  <Avatar src={f.photoURL} sx={{ width: 30, height: 30, borderRadius: 2 }}>
                    {f.name?.charAt(0)}
                  </Avatar>
                  <Typography variant="body2" sx={{ fontWeight: selected ? 700 : 500, flex: 1 }}>
                    {f.name}
                  </Typography>
                  {selected && <Typography variant="caption" sx={{ color: "#4caf50", fontWeight: 700 }}>✓</Typography>}
                </Box>
              );
            })}
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setCreateGroupOpen(false)} sx={{ textTransform: "none" }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            disabled={!groupNameInput.trim()}
            onClick={handleCreateGroup}
            sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600 }}
          >
            Create Group
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ChatList;
