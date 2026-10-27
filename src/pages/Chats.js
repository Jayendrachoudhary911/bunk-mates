import React, { useEffect, useState, useCallback } from 'react';
import { auth, db } from '../firebase';
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  getDocs,
  query,
  orderBy,
  limit,
  onSnapshot,
  doc,
  updateDoc,
  addDoc,
  where,
  serverTimestamp,
  getDoc,
  setDoc,
  arrayUnion,
  arrayRemove,
  deleteDoc
} from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import BetaAccessGuard from "../components/BetaAccessGuard";
import { useBackButtonClose } from '../hooks/useBackButtonClose';
import {
  Avatar,
  IconButton,
  Dialog,
  Box,
  InputAdornment,
  Typography,
  TextField,
  Button,
  ThemeProvider,
  CircularProgress,
  Divider,
  SwipeableDrawer,
  Zoom,
  Chip,
  Stack,
  Paper,
  Tooltip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Checkbox,
  Radio,
  RadioGroup,
} from '@mui/material';
import CallIcon from "@mui/icons-material/Call";
import VideocamIcon from "@mui/icons-material/Videocam";
import PhoneMissedIcon from "@mui/icons-material/PhoneMissed";
import CallMadeIcon from "@mui/icons-material/CallMade";
import CallReceivedIcon from "@mui/icons-material/CallReceived";
import CallEndIcon from "@mui/icons-material/CallEnd";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import DoneAllIcon from "@mui/icons-material/DoneAll";
import StarRoundedIcon from "@mui/icons-material/StarRounded";
import CampaignIcon from "@mui/icons-material/Campaign";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import PlaylistAddIcon from "@mui/icons-material/PlaylistAdd";
import FolderSpecialIcon from "@mui/icons-material/FolderSpecial";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import PushPinRoundedIcon from "@mui/icons-material/PushPinRounded";
import NotificationsOffOutlinedIcon from "@mui/icons-material/NotificationsOffOutlined";
import NotificationsActiveOutlinedIcon from "@mui/icons-material/NotificationsActiveOutlined";
import MarkChatUnreadOutlinedIcon from "@mui/icons-material/MarkChatUnreadOutlined";
import MarkChatReadOutlinedIcon from "@mui/icons-material/MarkChatReadOutlined";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import BlockRoundedIcon from "@mui/icons-material/BlockRounded";
import ExitToAppOutlinedIcon from "@mui/icons-material/ExitToAppOutlined";
import { useCall } from "../contexts/CallContext";
import { format, isToday, isYesterday } from 'date-fns';
import { 
  ArrowBack as ArrowBackIcon, 
  PersonAdd as GroupAddIcon, 
  PersonAdd as PersonAddIcon, 
  Add as AddIcon, 
  CloseRounded as CloseRoundedIcon, 
  Search as SearchIcon, 
  CheckCircle as CheckCircleIcon, 
  Message as MessageOutlinedIcon, 
  ChatBubbleOutline as ChatBubbleOutlineIcon, 
  InfoOutlined as InfoOutlinedIcon, 
  OpenInNew as OpenInNewIcon,
  DeleteForeverOutlined as DeleteRoundedIcon,
  Logout as LogoutRoundedIcon,
} from '../icons';

import { weatherColors, weatherbgColors } from "../elements/weatherTheme";
import { useWeather } from "../contexts/WeatherContext";
import { messaging } from "../firebase";
import { getToken } from "firebase/messaging";
import Snackbar from "@mui/material/Snackbar";
import MuiAlert from "@mui/material/Alert";
import { useThemeToggle } from "../contexts/ThemeToggleContext";
import { getTheme } from "../theme";
import {
  drawerPaperSx,
  drawerBackdropSx,
  DrawerHandle,
} from "../theme/designSystem";
import { isValidImageUrl, safeImageUrl } from "../utils/uiHelpers";
import { formatMessageSnippet } from "../utils/chatHelpers";
import ChatListSkeleton from "../components/chats_components/ChatListSkeleton";
import {
  getCustomChatLists,
  createCustomChatList,
  deleteCustomChatList,
  isChatFavorite,
  toggleFavoriteChat,
  isChatPinned,
  togglePinChat,
  isChatMarkedUnread,
  toggleMarkChatUnread,
  clearMarkChatUnread,
  isChatMuted,
  muteChat,
  unmuteChat,
} from "../utils/chatFeaturesService";
import {
  saveLastMessageToDB,
  markChatAsReadInDB,
} from "../utils/chatIndexedDB";

const USER_STORAGE_KEY = "bunkmateuser";
const WEATHER_STORAGE_KEY = "bunkmate_weather";


function Chats({ onlyList, isEmbedded = false, selectedChatId = null, onSelectChat = null }) {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Real-time chat & group states synchronized directly from Firestore DB
  const [unreadCounts, setUnreadCounts] = useState({});
  const [latestMessages, setLatestMessages] = useState({});
  const [latestTimestamps, setLatestTimestamps] = useState({});

  const [userGroups, setUserGroups] = useState([]);
  const [groupUnreadCounts, setGroupUnreadCounts] = useState({});
  const [latestGroupMessages, setLatestGroupMessages] = useState({});
  const [latestGroupTimestamps, setLatestGroupTimestamps] = useState({});
  const [loadingChats, setLoadingChats] = useState(true);


  const [addUserDialog, setAddUserDialog] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [groupName, setGroupName] = useState('');
  const [friends, setFriends] = useState([]);
  const [nicknames, setNicknames] = useState({});
  const navigate = useNavigate();
  const { mode, accent } = useThemeToggle();
  const theme = getTheme(mode, accent);
  const [currentUser, setCurrentUser] = useState(null);
  const { weather, setWeather } = useWeather();
  const [friendsList, setFriendsList] = useState([]);
  const [searchFriend, setSearchFriend] = useState(""); 
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [selectedGroupMembers, setSelectedGroupMembers] = useState([]);
  const [groupDescription, setGroupDescription] = useState('');
  const [groupDialogOpen, setGroupDialogOpen] = useState(false); // Controls group drawer
  const [membDialogOpen, setMembDialogOpen] = useState(false); // Controls group drawer
  const [groupIcon, setGroupIcon] = useState(""); // Icon or emoji
  const [selectedFriends, setSelectedFriends] = useState([]); // List of selected members for group
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success", // can be "success", "error", "info", etc.
  });

  const [selectedUserProfile, setSelectedUserProfile] = useState(null);
  const [profileDrawerOpen, setProfileDrawerOpen] = useState(false);

  const [hasPendingRequest,] = useState(false);
  const [isRequestReceived, setIsRequestReceived] = useState(false);
  const [requestId, setRequestId] = useState(null);
  const [isCurrentUserFriend, setIsCurrentUserFriend] = useState(false);
  const [loadingRequestState, setLoadingRequestState] = useState(true);


  const [profilePicOpen, setProfilePicOpen] = useState(false);
  const [selectedProfileData, setSelectedProfileData] = useState(null); // To hold the data of the clicked user
  const [viewMode, setViewMode] = useState('avatar');

  const { startCall } = useCall();

  // Desktop tab filtering & WebRTC Call States
  const [activeTab, setActiveTab] = useState("all"); // "all" | "direct" | "groups" | "unread" | "favorites" | "calls" | customListId
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [customChatLists, setCustomChatLists] = useState(() => getCustomChatLists());
  const [, setFavVersion] = useState(0);

  // Broadcast dialog state
  const [broadcastDialogOpen, setBroadcastDialogOpen] = useState(false);
  const [broadcastText, setBroadcastText] = useState("");
  const [selectedBroadcastRecipients, setSelectedBroadcastRecipients] = useState([]);
  const [broadcastSearchTerm, setBroadcastSearchTerm] = useState("");
  const [isBroadcasting, setIsBroadcasting] = useState(false);

  // Custom list creation & management state
  const [createListDialogOpen, setCreateListDialogOpen] = useState(false);
  const [newListName, setNewListName] = useState("");
  const [selectedListChats, setSelectedListChats] = useState([]);
  const [listSearchTerm, setListSearchTerm] = useState("");
  const [manageListsDialogOpen, setManageListsDialogOpen] = useState(false);

  // Context Menu & Mobile Long Press state
  const [blockedUids, setBlockedUids] = useState([]);
  const [chatMenuAnchor, setChatMenuAnchor] = useState(null); // { mouseX, mouseY }
  const [selectedMenuChat, setSelectedMenuChat] = useState(null);
  const [muteChatDialogOpen, setMuteChatDialogOpen] = useState(false);
  const [muteDuration, setMuteDuration] = useState("8h");
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [blockConfirmOpen, setBlockConfirmOpen] = useState(false);
  const [leaveGroupConfirmOpen, setLeaveGroupConfirmOpen] = useState(false);

  const longPressTimerRef = React.useRef(null);
  const touchStartPosRef = React.useRef({ x: 0, y: 0 });
  const isLongPressTriggeredRef = React.useRef(false);

  useEffect(() => {
    const handleListsChanged = () => setCustomChatLists(getCustomChatLists());
    const handleFavsChanged = () => setFavVersion((v) => v + 1);
    window.addEventListener("bm_custom_lists_changed", handleListsChanged);
    window.addEventListener("bm_favorite_chats_changed", handleFavsChanged);
    window.addEventListener("bm_pinned_chats_changed", handleFavsChanged);
    window.addEventListener("bm_unread_chats_changed", handleFavsChanged);
    window.addEventListener("bm_chat_mute_changed", handleFavsChanged);
    return () => {
      window.removeEventListener("bm_custom_lists_changed", handleListsChanged);
      window.removeEventListener("bm_favorite_chats_changed", handleFavsChanged);
      window.removeEventListener("bm_pinned_chats_changed", handleFavsChanged);
      window.removeEventListener("bm_unread_chats_changed", handleFavsChanged);
      window.removeEventListener("bm_chat_mute_changed", handleFavsChanged);
    };
  }, []);

  // Broadcast total unread counts for tab title & favicon badge
  useEffect(() => {
    const directTotal = Object.values(unreadCounts || {}).reduce((acc, c) => acc + (Number(c) || 0), 0);
    const groupTotal = Object.values(groupUnreadCounts || {}).reduce((acc, c) => acc + (Number(c) || 0), 0);
    const total = directTotal + groupTotal;
    try {
      localStorage.setItem("bm_total_unread_chats", String(total));
      window.dispatchEvent(new CustomEvent("bm_unread_total_changed", { detail: total }));
    } catch (e) {
      // ignore
    }
  }, [unreadCounts, groupUnreadCounts]);

  // Listen to blockedUids in real time from users/{currentUser.uid}
  useEffect(() => {
    if (!currentUser?.uid) return;
    const unsub = onSnapshot(doc(db, "users", currentUser.uid), (snap) => {
      if (snap.exists()) {
        const d = snap.data();
        setFriends(d.friends || []);
        setBlockedUids(d.blockedUids || []);
        if (d.nicknames) setNicknames(d.nicknames);
      }
    });
    return () => unsub();
  }, [currentUser?.uid]);

  // Real-time call history for the current user from users/{currentUser.uid}/callHistory
  const [callHistoryList, setCallHistoryList] = useState([]);

  useEffect(() => {
    if (!currentUser) return;
    const historyCol = collection(db, "users", currentUser.uid, "callHistory");
    const q = query(historyCol, orderBy("createdAt", "desc"), limit(50));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const calls = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        setCallHistoryList(calls);
      },
      (err) => {
        console.warn("Could not fetch callHistory:", err);
      }
    );
    return () => unsubscribe();
  }, [currentUser]);

  const formatCallTimestamp = (ts) => {
    if (!ts) return "";
    const date = ts.toDate ? ts.toDate() : new Date(ts);
    if (isNaN(date.getTime())) return "";
    if (isToday(date)) {
      return format(date, "h:mm a");
    }
    if (isYesterday(date)) {
      return "Yesterday";
    }
    return format(date, "MMM d, h:mm a");
  };

  const handleInitiateCall = (targetUser, callType = "video") => {
    if (!targetUser) return;
    startCall(targetUser, callType);
  };

  // Back button responsiveness for drawers and dialogs
  useBackButtonClose(addUserDialog, () => setAddUserDialog(false));
  useBackButtonClose(groupDialogOpen, () => setGroupDialogOpen(false));
  useBackButtonClose(membDialogOpen, () => setMembDialogOpen(false));
  useBackButtonClose(profileDrawerOpen, () => setProfileDrawerOpen(false));
  useBackButtonClose(profilePicOpen, () => setProfilePicOpen(false));
  useBackButtonClose(broadcastDialogOpen, () => setBroadcastDialogOpen(false));
  useBackButtonClose(createListDialogOpen, () => setCreateListDialogOpen(false));
  useBackButtonClose(manageListsDialogOpen, () => setManageListsDialogOpen(false));

  const markGroupAsRead = useCallback(async (groupId) => {
    if (!currentUser?.uid || !groupId) return;
    const userId = currentUser.uid;
    const now = Date.now();

    try {
      localStorage.setItem(`bunkmate_group_read_${groupId}`, now.toString());
    } catch {}

    // 1. Mark group notifications as seen in Firestore
    try {
      const notifQ = query(
        collection(db, "notifications"),
        where("uid", "==", userId),
        where("groupName", "==", groupId),
        where("seen", "==", false)
      );
      const snap = await getDocs(notifQ);
      snap.forEach((d) => {
        updateDoc(doc(db, "notifications", d.id), { seen: true }).catch(() => {});
      });
    } catch (err) {
      console.warn("Failed to mark group notifications seen:", err);
    }

    // 2. Update group read timestamp on groupChats in Firestore
    try {
      await setDoc(
        doc(db, "groupChats", groupId),
        {
          readTimestamps: {
            [userId]: serverTimestamp(),
          },
        },
        { merge: true }
      );
    } catch (err) {
      console.warn("Failed to update group readTimestamp:", err);
    }

    // 3. Mark recent message documents with readBy in Firestore
    try {
      const msgsRef = collection(db, "groupChat", groupId, "messages");
      const q = query(msgsRef, orderBy("timestamp", "desc"), limit(25));
      const snap = await getDocs(q);
      const updates = [];
      snap.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.senderId !== userId) {
          const hasRead = Array.isArray(data.readBy) && data.readBy.includes(userId);
          if (!hasRead) {
            updates.push(
              updateDoc(doc(db, "groupChat", groupId, "messages", docSnap.id), {
                read: true,
                readBy: arrayUnion(userId),
                [`readByMap.${userId}`]: new Date().toISOString(),
              }).catch(() => {})
            );
          }
        }
      });
      if (updates.length > 0) {
        await Promise.all(updates);
      }
    } catch (err) {
      console.warn("Could not mark messages in groupChat:", err);
    }

    setGroupUnreadCounts((prev) => ({ ...prev, [groupId]: 0 }));
    clearMarkChatUnread(groupId);
    markChatAsReadInDB(groupId, true);

    try {
      window.dispatchEvent(new CustomEvent("bm_unread_chats_changed"));
      window.dispatchEvent(
        new CustomEvent("bm_last_message_updated", {
          detail: { chatId: groupId, unreadCount: 0, isGroup: true },
        })
      );
    } catch {}
  }, [currentUser?.uid]);

  const handleMarkAllAsRead = async () => {
    setMenuAnchorEl(null);
    if (!currentUser) return;
    try {
      let markedCount = 0;
      // Direct chats
      const unreadUsers = users.filter((u) => (unreadCounts[u.id] || 0) > 0);
      for (const u of unreadUsers) {
        const chatId = [currentUser.uid, u.id].sort().join('_');
        const q = query(collection(db, 'chats', chatId, 'messages'), orderBy('timestamp', 'desc'), limit(20));
        const snapshot = await getDocs(q);
        snapshot.forEach(async (docSnap) => {
          const data = docSnap.data();
          if (data.senderId !== currentUser.uid && (!data.isRead || !data.readAt)) {
            await updateDoc(doc(db, 'chats', chatId, 'messages', docSnap.id), {
              isRead: true,
              read: true,
              readAt: new Date().toISOString(),
            }).catch(() => {});
          }
        });
        setUnreadCounts((prev) => ({ ...prev, [u.id]: 0 }));
        markedCount++;
      }

      // Group chats
      const unreadGroups = userGroups.filter((g) => (groupUnreadCounts[g.id] || 0) > 0);
      for (const g of unreadGroups) {
        await markGroupAsRead(g.id);
        setGroupUnreadCounts((prev) => ({ ...prev, [g.id]: 0 }));
        markedCount++;
      }

      setSnackbar({
        open: true,
        message: markedCount > 0 ? "All messages marked as read" : "No unread messages",
        severity: "success",
      });
    } catch (err) {
      console.error("Failed to mark all as read:", err);
      setSnackbar({ open: true, message: "Failed to mark all as read", severity: "error" });
    }
  };

  const handleSendBroadcast = async () => {
    if (!broadcastText.trim() || selectedBroadcastRecipients.length === 0 || !currentUser) return;
    setIsBroadcasting(true);
    try {
      for (const targetUserId of selectedBroadcastRecipients) {
        const chatId = [currentUser.uid, targetUserId].sort().join('_');
        await addDoc(collection(db, "chats", chatId, "messages"), {
          senderId: currentUser.uid,
          text: broadcastText.trim(),
          timestamp: serverTimestamp(),
          isRead: false,
          read: false,
          isBroadcast: true,
        });
      }
      setSnackbar({
        open: true,
        message: `Broadcast message sent to ${selectedBroadcastRecipients.length} chat(s)!`,
        severity: "success",
      });
      setBroadcastDialogOpen(false);
      setBroadcastText("");
      setSelectedBroadcastRecipients([]);
    } catch (err) {
      console.error("Failed to send broadcast:", err);
      setSnackbar({ open: true, message: "Failed to send broadcast message", severity: "error" });
    } finally {
      setIsBroadcasting(false);
    }
  };

  const handleCreateCustomList = () => {
    if (!newListName.trim()) return;
    const created = createCustomChatList({
      name: newListName.trim(),
      chatIds: selectedListChats,
    });
    if (created) {
      setSnackbar({ open: true, message: `List "${created.name}" created!`, severity: "success" });
      setCreateListDialogOpen(false);
      setNewListName("");
      setSelectedListChats([]);
      setActiveTab(created.id);
    }
  };

  const handleDeleteCustomList = (listId) => {
    deleteCustomChatList(listId);
    if (activeTab === listId) {
      setActiveTab("all");
    }
    setSnackbar({ open: true, message: "Chat list deleted", severity: "info" });
  };

  const handleCloseSnackbar = (_, reason) => {
    if (reason === "clickaway") return;
    setSnackbar({ ...snackbar, open: false });
  };

const handleAvatarClick = (e, chatData) => {
  e.stopPropagation(); // Prevents navigating to the chat screen
  setSelectedProfileData(chatData);
  setProfilePicOpen(true);
};

  // ─── Chat Context Menu & Mobile Long-Press Handlers ───
  const handleChatTouchStart = (e, chat) => {
    const touch = e.touches[0];
    touchStartPosRef.current = { x: touch.clientX, y: touch.clientY };
    isLongPressTriggeredRef.current = false;
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    longPressTimerRef.current = setTimeout(() => {
      isLongPressTriggeredRef.current = true;
      if (navigator.vibrate) {
        try { navigator.vibrate(40); } catch (_) {}
      }
      setChatMenuAnchor({ mouseX: touch.clientX, mouseY: touch.clientY });
      setSelectedMenuChat(chat);
    }, 500);
  };

  const handleChatTouchMove = (e) => {
    if (!touchStartPosRef.current) return;
    const touch = e.touches[0];
    const diffX = Math.abs(touch.clientX - touchStartPosRef.current.x);
    const diffY = Math.abs(touch.clientY - touchStartPosRef.current.y);
    if (diffX > 10 || diffY > 10) {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
    }
  };

  const handleChatTouchEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const handleChatContextMenu = (e, chat) => {
    e.preventDefault();
    e.stopPropagation();
    setChatMenuAnchor({ mouseX: e.clientX, mouseY: e.clientY });
    setSelectedMenuChat(chat);
  };

  const handleCloseChatMenu = () => {
    setChatMenuAnchor(null);
  };

  const handleMenuPinToggle = () => {
    if (!selectedMenuChat) return;
    const isPinned = togglePinChat(selectedMenuChat.id);
    setChatMenuAnchor(null);
    setSnackbar({
      open: true,
      message: isPinned ? "Chat pinned to top" : "Chat unpinned",
      severity: "success",
    });
  };

  const handleMenuFavoriteToggle = () => {
    if (!selectedMenuChat) return;
    const isFav = toggleFavoriteChat(selectedMenuChat.id);
    setChatMenuAnchor(null);
    setSnackbar({
      open: true,
      message: isFav ? "Added to favorites" : "Removed from favorites",
      severity: "success",
    });
  };

  const handleMenuMuteToggle = () => {
    if (!selectedMenuChat) return;
    const muted = isChatMuted(selectedMenuChat.id);
    if (muted) {
      unmuteChat(selectedMenuChat.id);
      setChatMenuAnchor(null);
      setSnackbar({ open: true, message: "Notifications unmuted", severity: "success" });
    } else {
      setChatMenuAnchor(null);
      setMuteChatDialogOpen(true);
    }
  };

  const handleConfirmMute = () => {
    if (!selectedMenuChat) return;
    let durationMs = null;
    if (muteDuration === "8h") durationMs = 8 * 60 * 60 * 1000;
    else if (muteDuration === "1w") durationMs = 7 * 24 * 60 * 60 * 1000;
    else durationMs = null;

    muteChat(selectedMenuChat.id, durationMs);
    setMuteChatDialogOpen(false);
    setSnackbar({ open: true, message: "Notifications muted", severity: "success" });
  };

  const handleMenuUnreadToggle = async () => {
    if (!selectedMenuChat) return;
    const isCurrentlyUnread = (selectedMenuChat.unreadCount > 0) || isChatMarkedUnread(selectedMenuChat.id);
    setChatMenuAnchor(null);

    if (isCurrentlyUnread) {
      if (isChatMarkedUnread(selectedMenuChat.id)) {
        toggleMarkChatUnread(selectedMenuChat.id);
      }
      if (selectedMenuChat.type === "group") {
        await markGroupAsRead(selectedMenuChat.id);
        setGroupUnreadCounts((prev) => ({ ...prev, [selectedMenuChat.id]: 0 }));
      } else {
        const chatId = [currentUser.uid, selectedMenuChat.id].sort().join('_');
        try {
          const q = query(collection(db, 'chats', chatId, 'messages'), orderBy('timestamp', 'desc'), limit(20));
          const snap = await getDocs(q);
          const updatePromises = snap.docs.map((docSnap) => {
            const data = docSnap.data();
            if (data.senderId !== currentUser.uid && (!data.isRead || !data.readAt)) {
              return updateDoc(doc(db, 'chats', chatId, 'messages', docSnap.id), {
                isRead: true,
                read: true,
                readAt: new Date().toISOString(),
              }).catch(() => {});
            }
            return Promise.resolve();
          });
          await Promise.all(updatePromises);
        } catch (_) {}
        setUnreadCounts((prev) => ({ ...prev, [selectedMenuChat.id]: 0 }));
      }
      setSnackbar({ open: true, message: "Marked as read", severity: "success" });
    } else {
      toggleMarkChatUnread(selectedMenuChat.id);
      setSnackbar({ open: true, message: "Marked as unread", severity: "success" });
    }
  };

  const handleConfirmDeleteChat = async () => {
    if (!selectedMenuChat || !currentUser) return;
    setDeleteConfirmOpen(false);
    try {
      if (selectedMenuChat.type === "user") {
        const chatId = [currentUser.uid, selectedMenuChat.id].sort().join('_');
        const messagesRef = collection(db, "chats", chatId, "messages");
        const snap = await getDocs(messagesRef);
        await Promise.all(snap.docs.map((d) => deleteDoc(d.ref)));

        setLatestMessages((prev) => ({ ...prev, [selectedMenuChat.id]: "No messages yet" }));
        setLatestTimestamps((prev) => ({ ...prev, [selectedMenuChat.id]: new Date(0) }));
        setUnreadCounts((prev) => ({ ...prev, [selectedMenuChat.id]: 0 }));
        if (isChatMarkedUnread(selectedMenuChat.id)) toggleMarkChatUnread(selectedMenuChat.id);
        if (isChatPinned(selectedMenuChat.id)) togglePinChat(selectedMenuChat.id);
      } else {
        setGroupUnreadCounts((prev) => ({ ...prev, [selectedMenuChat.id]: 0 }));
        if (isChatMarkedUnread(selectedMenuChat.id)) toggleMarkChatUnread(selectedMenuChat.id);
        if (isChatPinned(selectedMenuChat.id)) togglePinChat(selectedMenuChat.id);
      }
      setSnackbar({ open: true, message: "Chat deleted", severity: "success" });
    } catch (err) {
      console.error("Failed to delete chat:", err);
      setSnackbar({ open: true, message: "Failed to delete chat", severity: "error" });
    }
  };

  const handleConfirmBlockFriend = async () => {
    if (!selectedMenuChat || !currentUser) return;
    setBlockConfirmOpen(false);
    const targetUid = selectedMenuChat.id;
    const isBlocked = blockedUids.includes(targetUid);
    try {
      const userRef = doc(db, "users", currentUser.uid);
      if (isBlocked) {
        await updateDoc(userRef, { blockedUids: arrayRemove(targetUid) });
        setBlockedUids((prev) => prev.filter((id) => id !== targetUid));
        setSnackbar({ open: true, message: "Friend unblocked", severity: "success" });
      } else {
        await updateDoc(userRef, { blockedUids: arrayUnion(targetUid) });
        setBlockedUids((prev) => [...prev, targetUid]);
        setSnackbar({ open: true, message: "Friend blocked", severity: "success" });
      }
    } catch (err) {
      console.error("Failed to block/unblock friend:", err);
      setSnackbar({ open: true, message: "Action failed", severity: "error" });
    }
  };

  const handleConfirmLeaveGroup = async () => {
    if (!selectedMenuChat || !currentUser) return;
    setLeaveGroupConfirmOpen(false);
    try {
      const groupRef = doc(db, "groupChats", selectedMenuChat.id);
      await updateDoc(groupRef, {
        members: arrayRemove(currentUser.uid),
        admins: arrayRemove(currentUser.uid),
      });
      setUserGroups((prev) => prev.filter((g) => g.id !== selectedMenuChat.id));
      setSnackbar({ open: true, message: "You left the group", severity: "success" });
    } catch (err) {
      console.error("Failed to leave group:", err);
      setSnackbar({ open: true, message: "Failed to leave group", severity: "error" });
    }
  };

  const renderChatActionMenuAndDialogs = () => (
    <>
      {/* Chat Action Context Menu (Mobile Long-Press & Desktop Right-Click/3-Dots) */}
      <Menu
        open={chatMenuAnchor !== null}
        onClose={handleCloseChatMenu}
        anchorReference="anchorPosition"
        anchorPosition={
          chatMenuAnchor !== null
            ? { top: chatMenuAnchor.mouseY, left: chatMenuAnchor.mouseX }
            : undefined
        }
        PaperProps={{
          elevation: 8,
          sx: {
            borderRadius: 6,
        py: 0,
        px: 0.5,
        backgroundImage: "none",
        bgcolor:
          mode === "dark"
            ? "rgba(12, 12, 12, 0.46)"
            : "rgba(255, 255, 255, 0.61)",
            backdropFilter: "blur(20px)",
        border: "1px solid",
        borderColor: mode === "dark" ? "#f1f1f111" : "#00000012",
            boxShadow: "none",
          },
        }}
      >
        {selectedMenuChat && (
          <>
            {/* 1. Pin Chat / Unpin Chat */}
            {(() => {
              const isPinned = isChatPinned(selectedMenuChat.id);
              return (
                <MenuItem
                  onClick={handleMenuPinToggle}
                  sx={{
                    py: 0.7,
                    px: 1,
                    borderRadius: 4.5,
                    "&:hover": {
                      bgcolor: mode === "dark" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)",
                    },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <PushPinRoundedIcon
                      sx={{
                        fontSize: 20,
                        transform: isPinned ? "rotate(0deg)" : "rotate(45deg)",
                        color: isPinned ? theme.palette.primary.main : "text.secondary",
                      }}
                    />
                  </ListItemIcon>
                  <ListItemText
                    primary={isPinned ? "Unpin Chat" : "Pin Chat"}
                    primaryTypographyProps={{
                      fontSize: "0.88rem",
                      fontWeight: 600,
                      color: isPinned ? theme.palette.primary.main : "text.secondary",
                    }}
                  />
                </MenuItem>
              );
            })()}

            {/* 2. Add to / Remove from Favorites */}
            {(() => {
              const isFav = isChatFavorite(selectedMenuChat.id);
              return (
                <MenuItem
                  onClick={handleMenuFavoriteToggle}
                  sx={{
                    py: 0.7,
                    px: 1,
                    borderRadius: 4.5,
                    "&:hover": {
                      bgcolor: mode === "dark" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)",
                    },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <StarRoundedIcon
                      sx={{
                        fontSize: 20,
                        color: isFav ? "#fbc02d" : "text.secondary",
                      }}
                    />
                  </ListItemIcon>
                  <ListItemText
                    primary={isFav ? "Remove from Favorites" : "Add to Favorites"}
                    primaryTypographyProps={{
                      fontSize: "0.88rem",
                      fontWeight: 600,
                      color: isFav ? "#fbc02d" : "text.secondary",
                    }}
                  />
                </MenuItem>
              );
            })()}

            {/* 3. Mute / Unmute Notifications */}
            {(() => {
              const isMuted = isChatMuted(selectedMenuChat.id);
              return (
                <MenuItem
                  onClick={handleMenuMuteToggle}
                  sx={{
                    py: 0.7,
                    px: 1,
                    borderRadius: 4.5,
                    "&:hover": {
                      bgcolor: mode === "dark" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)",
                    },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    {isMuted ? (
                      <NotificationsActiveOutlinedIcon sx={{ fontSize: 20, color: "#4caf50" }} />
                    ) : (
                      <NotificationsOffOutlinedIcon sx={{ fontSize: 20, color: "text.secondary" }} />
                    )}
                  </ListItemIcon>
                  <ListItemText
                    primary={isMuted ? "Unmute Notifications" : "Mute Notifications"}
                    primaryTypographyProps={{
                      fontSize: "0.88rem",
                      fontWeight: 600,
                      color: isMuted ? "#4caf50" : "text.secondary",
                    }}
                  />
                </MenuItem>
              );
            })()}

            {/* 4. Mark as Read / Mark as Unread */}
            {(() => {
              const isUnread = (selectedMenuChat.unreadCount > 0) || isChatMarkedUnread(selectedMenuChat.id);
              return (
                <MenuItem
                  onClick={handleMenuUnreadToggle}
                  sx={{
                    py: 0.7,
                    px: 1,
                    borderRadius: 4.5,
                    "&:hover": {
                      bgcolor: mode === "dark" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)",
                    },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    {!isUnread ? (
                      <MarkChatReadOutlinedIcon sx={{ fontSize: 20, color: "text.secondary" }} />
                    ) : (
                      <MarkChatUnreadOutlinedIcon sx={{ fontSize: 20, color: mode === "dark" ? "#fff" : "#000" }} />
                    )}
                  </ListItemIcon>
                  <ListItemText
                    primary={isUnread ? "Mark as Read" : "Mark as Unread"}
                    primaryTypographyProps={{
                      fontSize: "0.88rem",
                      fontWeight: 600,
                      color: isUnread ? mode === "dark" ? "#fff" : "#000000" : "text.secondary",
                    }}
                  />
                </MenuItem>
              );
            })()}

            <Divider sx={{ my: 1.75, opacity: 0.5 }} />

            {/* 5. Delete Chat */}
            <MenuItem
              onClick={() => {
                setChatMenuAnchor(null);
                setDeleteConfirmOpen(true);
              }}
                  sx={{
                    py: 0.7,
                    px: 1,
                    borderRadius: 4.5,
                    "&:hover": {
                      bgcolor: "rgba(239, 68, 68, 0.12)",
                    },
                  }}
            >
              <ListItemIcon sx={{ minWidth: 36 }}>
                <DeleteOutlineRoundedIcon sx={{ fontSize: 20, color: "#ef4444" }} />
              </ListItemIcon>
              <ListItemText
                primary="Delete Chat"
                primaryTypographyProps={{
                  fontSize: "0.88rem",
                  fontWeight: 600,
                  color: "#ef4444",
                }}
              />
            </MenuItem>

            {/* 6. Block Friend (User) or Leave Group (Group) */}
            {selectedMenuChat.type === "group" ? (
              <MenuItem
                onClick={() => {
                  setChatMenuAnchor(null);
                  setLeaveGroupConfirmOpen(true);
                }}
                  sx={{
                    py: 0.7,
                    px: 1,
                    borderRadius: 4.5,
                    "&:hover": {
                      bgcolor: "rgba(239, 68, 68, 0.12)",
                    },
                  }}
              >
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <ExitToAppOutlinedIcon sx={{ fontSize: 20, color: "#ef4444" }} />
                </ListItemIcon>
                <ListItemText
                  primary="Leave Group"
                  primaryTypographyProps={{
                    fontSize: "0.88rem",
                    fontWeight: 600,
                    color: "#ef4444",
                  }}
                />
              </MenuItem>
            ) : (
              (() => {
                const isBlocked = blockedUids.includes(selectedMenuChat.id);
                return (
                  <MenuItem
                    onClick={() => {
                      setChatMenuAnchor(null);
                      setBlockConfirmOpen(true);
                    }}
                  sx={{
                    py: 0.7,
                    px: 1,
                    borderRadius: 4.5,
                    "&:hover": {
                      bgcolor: "rgba(239, 68, 68, 0.12)",
                    },
                  }}
                  >
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <BlockRoundedIcon sx={{ fontSize: 20, color: "#ef4444" }} />
                    </ListItemIcon>
                    <ListItemText
                      primary={isBlocked ? "Unblock Friend" : "Block Friend"}
                      primaryTypographyProps={{
                        fontSize: "0.88rem",
                        fontWeight: 600,
                        color: "#ef4444",
                      }}
                    />
                  </MenuItem>
                );
              })()
            )}
          </>
        )}
      </Menu>

      {/* Mute Notifications Drawer */}
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

    {/* Desktop-only close button */}
    <IconButton
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
            component="label"
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
                "border-color 180ms ease, background-color 180ms ease, transform 180ms ease",
              "&:hover": {
                borderColor: "primary.main",
                bgcolor: selected
                  ? mode === "dark"
                    ? "rgb(179, 179, 179)"
                    : "rgb(44, 44, 44)"
                  : mode === "dark"
                    ? "rgba(255,255,255,0.1)"
                    : "rgba(0,0,0,0.075)",
              },
              "&:active": {
                transform: "scale(0.97)",
              },
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
          transform: 'translate(0px)'
        },
      }}
    >
      Cancel
    </Button>

    <Button
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
          transform: 'translate(0px)'
        },
        "&:active": {
          transform: "scale(0.98)",
        },
      }}
    >
      Conifrm
    </Button>
  </Box>
</Box>
      </SwipeableDrawer>

{/* 1. Delete Chat Confirmation Drawer */}
      <SwipeableDrawer
        anchor="bottom"
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
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
            mx: "auto",
            width: { xs: "auto", md: "100%" },
            boxSizing: "border-box",
            pt: { xs: 1, md: 2 },
            px: { xs: 1.5, md: 2 },
            pb: { xs: 0, md: 1.5 },
          }}
        >
          {/* Top Warning Icon */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              mb: 1.5,
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 64,
                height: 64,
                borderRadius: 8,
                bgcolor: mode === "dark" ? "rgba(211, 47, 47, 0.15)" : "rgba(211, 47, 47, 0.1)",
                color: mode === "dark" ? "#ef5350" : "#d32f2f",
              }}
            >
              <DeleteRoundedIcon sx={{ fontSize: 34 }} />
            </Box>
          </Box>

          {/* Header */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 1,
              mb: 0.75,
            }}
          >
            <Typography
              variant="h6"
              sx={{
                width: "100%",
                textAlign: "center",
                fontWeight: 800,
                fontSize: { xs: "1.1rem", md: "1.2rem" },
                letterSpacing: "-0.4px",
                overflowWrap: "anywhere",
              }}
            >
              Delete Chat?
            </Typography>

            {/* Desktop-only close button */}
            <IconButton
              onClick={() => setDeleteConfirmOpen(false)}
              size="small"
              aria-label="Close delete chat confirmation"
              sx={{
                position: "absolute",
                top: { xs: 8, md: 16 },
                right: { xs: 12, md: 16 },
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
                boxShadow:
                  mode === "dark"
                    ? "inset 0 1px 1px rgba(255, 255, 255, 0.11), inset 0 -1px 1px rgba(0,0,0,0.4)"
                    : "inset 0 1px 1px rgba(255, 255, 255, 0.71), inset 0 -1px 1px rgba(0,0,0,0.1)",
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
              textAlign: "center",
            }}
          >
            Are you sure you want to delete your conversation with{" "}
            <strong style={{ color: mode === "dark" ? "#fff" : "#111" }}>
              {selectedMenuChat?.name}
            </strong>
            ? All messages in this chat will be permanently removed.
          </Typography>

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
              variant="contained"
              onClick={() => setDeleteConfirmOpen(false)}
              fullWidth
              sx={{
                minHeight: 42,
                px: 2,
                borderRadius: 8,
                textTransform: "none",
                fontSize: "0.85rem",
                fontWeight: 650,
                boxShadow:
                  mode === "dark"
                    ? "inset 0 1px 1px rgba(255, 255, 255, 0.11), inset 0 -1px 4px rgba(0,0,0,0.4)"
                    : "inset 0 1px 1px rgba(255, 255, 255, 0.71), inset 0 -1px 4px rgba(0,0,0,0.1)",
                background: mode === "dark" ? "#f1f1f107" : "#0c0c0c08",
                color: "text.secondary",
                "&:hover": {
                  bgcolor:
                    mode === "dark"
                      ? "rgba(255,255,255,0.06)"
                      : "rgba(0,0,0,0.045)",
                  boxShadow: "none",
                  transform: "translate(0px)",
                },
              }}
            >
              Cancel
            </Button>

            <Button
              variant="contained"
              onClick={handleConfirmDeleteChat}
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
                bgcolor: "error.main",
                color: "#fff",
                boxShadow:
                  mode === "dark"
                    ? "inset 0 1px 1px rgba(255, 255, 255, 0.2), inset 0 -1px 2px rgba(0,0,0,0.4)"
                    : "inset 0 1px 2px rgba(255, 255, 255, 0.3)",
                "&:hover": {
                  bgcolor: "error.dark",
                  boxShadow: "none",
                  transform: "translate(0px)",
                },
                "&:active": {
                  transform: "scale(0.98)",
                },
              }}
            >
              Delete
            </Button>
          </Box>
        </Box>
      </SwipeableDrawer>

      {/* 2. Block / Unblock Friend Confirmation Drawer */}
      <SwipeableDrawer
        anchor="bottom"
        open={blockConfirmOpen}
        onClose={() => setBlockConfirmOpen(false)}
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
            mx: "auto",
            width: { xs: "auto", md: "100%" },
            boxSizing: "border-box",
            pt: { xs: 1, md: 2 },
            px: { xs: 1.5, md: 2 },
            pb: { xs: 0, md: 1.5 },
          }}
        >
          {/* Top Warning Icon */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              mb: 1.5,
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 54,
                height: 54,
                borderRadius: 8,
                bgcolor:
                  selectedMenuChat && blockedUids.includes(selectedMenuChat.id)
                    ? mode === "dark" ? "rgba(25, 118, 210, 0.15)" : "rgba(25, 118, 210, 0.1)"
                    : mode === "dark" ? "rgba(211, 47, 47, 0.15)" : "rgba(211, 47, 47, 0.1)",
                color:
                  selectedMenuChat && blockedUids.includes(selectedMenuChat.id)
                    ? mode === "dark" ? "#90caf9" : "#1976d2"
                    : mode === "dark" ? "#ef5350" : "#d32f2f",
              }}
            >
              <BlockRoundedIcon sx={{ fontSize: 34 }} />
            </Box>
          </Box>

          {/* Header */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 1,
              mb: 0.75,
            }}
          >
            <Typography
              variant="h6"
              sx={{
                width: "100%",
                textAlign: "center",
                fontWeight: 800,
                fontSize: { xs: "1.1rem", md: "1.2rem" },
                letterSpacing: "-0.4px",
                overflowWrap: "anywhere",
              }}
            >
              {selectedMenuChat && blockedUids.includes(selectedMenuChat.id)
                ? `Unblock ${selectedMenuChat?.name}?`
                : `Block ${selectedMenuChat?.name}?`}
            </Typography>

            {/* Desktop-only close button */}
            <IconButton
              onClick={() => setBlockConfirmOpen(false)}
              size="small"
              aria-label="Close block confirmation"
              sx={{
                position: "absolute",
                top: { xs: 8, md: 16 },
                right: { xs: 12, md: 16 },
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
                boxShadow:
                  mode === "dark"
                    ? "inset 0 1px 1px rgba(255, 255, 255, 0.11), inset 0 -1px 1px rgba(0,0,0,0.4)"
                    : "inset 0 1px 1px rgba(255, 255, 255, 0.71), inset 0 -1px 1px rgba(0,0,0,0.1)",
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
              textAlign: "center",
            }}
          >
            {selectedMenuChat && blockedUids.includes(selectedMenuChat.id) ? (
              <>
                Are you sure you want to unblock{" "}
                <strong style={{ color: mode === "dark" ? "#fff" : "#111" }}>
                  {selectedMenuChat?.name}
                </strong>
                ? They will be able to call you and send you messages again.
              </>
            ) : (
              <>
                Are you sure you want to block{" "}
                <strong style={{ color: mode === "dark" ? "#fff" : "#111" }}>
                  {selectedMenuChat?.name}
                </strong>
                ? Blocked contacts will no longer be able to call you or send you messages.
              </>
            )}
          </Typography>

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
              variant="contained"
              onClick={() => setBlockConfirmOpen(false)}
              fullWidth
              sx={{
                minHeight: 42,
                px: 2,
                borderRadius: 8,
                textTransform: "none",
                fontSize: "0.85rem",
                fontWeight: 650,
                boxShadow:
                  mode === "dark"
                    ? "inset 0 1px 1px rgba(255, 255, 255, 0.11), inset 0 -1px 4px rgba(0,0,0,0.4)"
                    : "inset 0 1px 1px rgba(255, 255, 255, 0.71), inset 0 -1px 4px rgba(0,0,0,0.1)",
                background: mode === "dark" ? "#f1f1f107" : "#0c0c0c08",
                color: "text.secondary",
                "&:hover": {
                  bgcolor:
                    mode === "dark"
                      ? "rgba(255,255,255,0.06)"
                      : "rgba(0,0,0,0.045)",
                  boxShadow: "none",
                  transform: "translate(0px)",
                },
              }}
            >
              Cancel
            </Button>

            <Button
              variant="contained"
              onClick={handleConfirmBlockFriend}
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
                bgcolor:
                  selectedMenuChat && blockedUids.includes(selectedMenuChat.id)
                    ? "primary.main"
                    : "error.main",
                color: "#fff",
                boxShadow:
                  mode === "dark"
                    ? "inset 0 1px 1px rgba(255, 255, 255, 0.2), inset 0 -1px 2px rgba(0,0,0,0.4)"
                    : "inset 0 1px 2px rgba(255, 255, 255, 0.3)",
                "&:hover": {
                  bgcolor:
                    selectedMenuChat && blockedUids.includes(selectedMenuChat.id)
                      ? "primary.dark"
                      : "error.dark",
                  boxShadow: "none",
                  transform: "translate(0px)",
                },
                "&:active": {
                  transform: "scale(0.98)",
                },
              }}
            >
              {selectedMenuChat && blockedUids.includes(selectedMenuChat.id)
                ? "Unblock"
                : "Block"}
            </Button>
          </Box>
        </Box>
      </SwipeableDrawer>

      {/* 3. Leave Group Confirmation Drawer */}
      <SwipeableDrawer
        anchor="bottom"
        open={leaveGroupConfirmOpen}
        onClose={() => setLeaveGroupConfirmOpen(false)}
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
            mx: "auto",
            width: { xs: "auto", md: "100%" },
            boxSizing: "border-box",
            pt: { xs: 1, md: 2 },
            px: { xs: 1.5, md: 2 },
            pb: { xs: 0, md: 1.5 },
          }}
        >
          {/* Top Warning Icon */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              mb: 1.5,
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 54,
                height: 54,
                borderRadius: 8,
                bgcolor: mode === "dark" ? "rgba(211, 47, 47, 0.15)" : "rgba(211, 47, 47, 0.1)",
                color: mode === "dark" ? "#ef5350" : "#d32f2f",
              }}
            >
              <LogoutRoundedIcon sx={{ fontSize: 34 }} />
            </Box>
          </Box>

          {/* Header */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 1,
              mb: 0.75,
            }}
          >
            <Typography
              variant="h6"
              sx={{
                width: "100%",
                textAlign: "center",
                fontWeight: 800,
                fontSize: { xs: "1.1rem", md: "1.2rem" },
                letterSpacing: "-0.4px",
                overflowWrap: "anywhere",
              }}
            >
              Leave {selectedMenuChat?.name}?
            </Typography>

            {/* Desktop-only close button */}
            <IconButton
              onClick={() => setLeaveGroupConfirmOpen(false)}
              size="small"
              aria-label="Close leave group confirmation"
              sx={{
                position: "absolute",
                top: { xs: 8, md: 16 },
                right: { xs: 12, md: 16 },
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
                boxShadow:
                  mode === "dark"
                    ? "inset 0 1px 1px rgba(255, 255, 255, 0.11), inset 0 -1px 1px rgba(0,0,0,0.4)"
                    : "inset 0 1px 1px rgba(255, 255, 255, 0.71), inset 0 -1px 1px rgba(0,0,0,0.1)",
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
              textAlign: "center",
            }}
          >
            Are you sure you want to leave{" "}
            <strong style={{ color: mode === "dark" ? "#fff" : "#111" }}>
              {selectedMenuChat?.name}
            </strong>
            ? You will no longer receive any messages from this group.
          </Typography>

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
              variant="contained"
              onClick={() => setLeaveGroupConfirmOpen(false)}
              fullWidth
              sx={{
                minHeight: 42,
                px: 2,
                borderRadius: 8,
                textTransform: "none",
                fontSize: "0.85rem",
                fontWeight: 650,
                boxShadow:
                  mode === "dark"
                    ? "inset 0 1px 1px rgba(255, 255, 255, 0.11), inset 0 -1px 4px rgba(0,0,0,0.4)"
                    : "inset 0 1px 1px rgba(255, 255, 255, 0.71), inset 0 -1px 4px rgba(0,0,0,0.1)",
                background: mode === "dark" ? "#f1f1f107" : "#0c0c0c08",
                color: "text.secondary",
                "&:hover": {
                  bgcolor:
                    mode === "dark"
                      ? "rgba(255,255,255,0.06)"
                      : "rgba(0,0,0,0.045)",
                  boxShadow: "none",
                  transform: "translate(0px)",
                },
              }}
            >
              Cancel
            </Button>

            <Button
              variant="contained"
              onClick={handleConfirmLeaveGroup}
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
                bgcolor: "error.main",
                color: "#fff",
                boxShadow:
                  mode === "dark"
                    ? "inset 0 1px 1px rgba(255, 255, 255, 0.2), inset 0 -1px 2px rgba(0,0,0,0.4)"
                    : "inset 0 1px 2px rgba(255, 255, 255, 0.3)",
                "&:hover": {
                  bgcolor: "error.dark",
                  boxShadow: "none",
                  transform: "translate(0px)",
                },
                "&:active": {
                  transform: "scale(0.98)",
                },
              }}
            >
              Leave Group
            </Button>
          </Box>
        </Box>
      </SwipeableDrawer>
    </>
  );


useEffect(() => {
  if (!currentUser || !selectedUserProfile) return;

  const q = query(
    collection(db, "notifications"),
    where("uid", "==", currentUser.uid),
    where("type", "==", "friend_request")
  );
  const unsubscribe = onSnapshot(q, (snapshot) => {
    const received = snapshot.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .find(
        (r) =>
          r.senderId === selectedUserProfile.uid &&
          (r.status === "pending" || r.status === "accepted")
      );

    setIsRequestReceived(!!received && received.status === "pending");
    if (received) {
      setRequestId(received.id);
      if (received.status === "accepted") {
        setIsCurrentUserFriend(true);
      }
    }
    setLoadingRequestState(false);
  });

  return () => unsubscribe();
}, [selectedUserProfile, currentUser]);


const handleOpenProfileDrawer = () => {
  if (!selectedProfileData || selectedProfileData.type !== 'user') {
    return;
  }
  navigate(`/profile/@${selectedProfileData.username}`);
  setProfileDrawerOpen(true);
};

const handleSnackbarClose = () => {
  setSnackbar({ ...snackbar, open: false });
};

  useEffect(() => {
  // Request notification permission and FCM token
  async function requestPermission() {
    if (Notification.permission !== "granted") {
      await Notification.requestPermission();
    }
    if (Notification.permission === "granted") {
      await getToken(messaging, { vapidKey: "BA3kLicUjBzLvrGk71laA_pRVYsf6LsGczyAzF-NTBWEmOE3r4_OT9YiVt_Mvzqm7dZCoPnht84wfX-WRzlaSLs" });
    }
  }
  requestPermission();

  return () => {
    // No unsubscribe needed for onMessage in v9 modular
  };
}, []);

useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, (user) => {
    setCurrentUser(user);
  });
  return () => unsubscribe();
}, []);
  
  const buttonWeatherBg =
  weather && weatherColors[weather.main]
    ? weatherColors[weather.main]
    : weatherColors.Default;
  
    
  const WeatherBgdrop =
  weather && weatherbgColors[weather.main]
    ? weatherbgColors[weather.main]
    : weatherbgColors.Default;


const [userData, setUserData] = useState({
  name: "",
  username: "",
  email: "",
  mobile: "",
  photoURL: "",
  bio: "",
  uid: "",
});

// Fetch user details from localStorage/cookie (reference: Home.js)
useEffect(() => {
  let user = auth.currentUser;
  if (!user) {
    // Try localStorage
    const storedUser = localStorage.getItem(USER_STORAGE_KEY);
    if (storedUser) {
      setUserData(JSON.parse(storedUser));
      return;
    }
    // Try cookie
    const cookieUser = document.cookie
      .split("; ")
      .find((row) => row.startsWith(USER_STORAGE_KEY + "="))
      ?.split("=")[1];
    if (cookieUser) {
      setUserData(JSON.parse(decodeURIComponent(cookieUser)));
      return;
    }
  } else {
    // If user is authenticated, use Firebase user object
    const { displayName, email, photoURL, phoneNumber, userBio, uid } = user;
    setUserData({
        name: displayName || "User",
        email: email || "",
        mobile: phoneNumber || "Not provided",
        photoURL: photoURL || "",
        bio: userBio || "",
        uid: uid || "",
      });
    }
  }, []);

  useEffect(() => {
  if (!weather) {
    let cachedWeather = null;
    try {
      const local = localStorage.getItem(WEATHER_STORAGE_KEY);
      if (local) cachedWeather = JSON.parse(local);
      if (!cachedWeather) {
        const cookieWeather = document.cookie
          .split("; ")
          .find((row) => row.startsWith(WEATHER_STORAGE_KEY + "="))
          ?.split("=")[1];
        if (cookieWeather) cachedWeather = JSON.parse(decodeURIComponent(cookieWeather));
      }
    } catch {}
    if (cachedWeather) {
      setWeather(cachedWeather);
    }
  }
}, [weather, setWeather]);

  // Consolidated user friends and nicknames fetch (eliminates 3 duplicate getDoc reads)
  useEffect(() => {
    if (!currentUser) return;

    const fetchUserDataAndFriends = async () => {
      try {
        const userRef = doc(db, "users", currentUser.uid);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) return;
        const uData = userSnap.data();

        const friendsUIDs = uData.friends || [];
        setFriends(friendsUIDs);
        setNicknames(uData.nicknames || {});

        if (friendsUIDs.length === 0) {
          setFriendsList([]);
          return;
        }

        const friendDocs = await Promise.all(
          friendsUIDs.map(uid => getDoc(doc(db, "users", uid)))
        );

        const fetchedFriends = friendDocs
          .filter(doc => doc.exists())
          .map(doc => {
            const data = doc.data();
            return {
              uid: doc.id,
              name: data.name || "Unnamed",
              username: data.username || "",
              photoURL:
                data.photoURL ||
                `https://api.dicebear.com/7.x/identicon/svg?seed=${doc.id}`,
            };
          });

        setFriendsList(fetchedFriends);
      } catch (err) {
        console.error("Failed to fetch friends and profile data:", err);
      }
    };

    fetchUserDataAndFriends();
  }, [currentUser]);

  const filteredFriends = friendsList.filter((friend) => {
    const query = searchFriend.toLowerCase();
    return (
      friend.name?.toLowerCase().includes(query) ||
      friend.username?.toLowerCase().includes(query)
    );
  });



const handleCreateGroup = async () => {
  if (!groupName || selectedFriends.length === 0) return;

  const currentUser = auth.currentUser;
  const allMembers = [...selectedFriends.map(f => f.uid), currentUser.uid];

  try {
    const groupRef = doc(collection(db, "groupChats")); // Auto-generates ID

    await setDoc(groupRef, {
      name: groupName,
      description: groupDescription,
      iconURL: groupIcon,
      emoji: "", // If you want to support emojis later
      members: allMembers,
      createdBy: currentUser.uid,
      createdAt: new Date().toISOString(),
      inviteAccess: "all",
    });

    setGroupDialogOpen(false);
    setGroupName("");
    setGroupDescription("");
    setGroupIcon("");
    setSelectedFriends([]);

    setSnackbar({ open: true, message: "Group created successfully!" });

  } catch (error) {
    console.error("Error creating group:", error);
    setSnackbar({ open: true, message: "Failed to create group." });
  }
};


  // 1. Real-time users collection listener
  useEffect(() => {
    if (!currentUser?.uid) return;
    const unsubscribe = onSnapshot(collection(db, "users"), (snapshot) => {
      const usersList = [];
      snapshot.forEach((docSnap) => {
        if (docSnap.id !== currentUser.uid) {
          usersList.push({ id: docSnap.id, ...docSnap.data() });
        }
      });
      setUsers(usersList);
      setLoadingChats(false);
    });
    return () => unsubscribe();
  }, [currentUser?.uid]);

  // 2. Real-time direct chat documents sync from Firestore 'chats' collection
  useEffect(() => {
    if (!currentUser?.uid) return;
    const chatsQ = query(
      collection(db, "chats"),
      where("users", "array-contains", currentUser.uid)
    );
    const unsub = onSnapshot(chatsQ, (snap) => {
      const msgs = {};
      const tsMap = {};
      snap.forEach((docSnap) => {
        const data = docSnap.data();
        const otherUid = (data.users || []).find((u) => u !== currentUser.uid);
        if (otherUid && data.lastMessage) {
          const raw = data.lastMessage;
          const text = typeof raw === "string" ? raw : (raw.text || "No messages yet");
          const ts = raw.timestamp?.toDate ? raw.timestamp.toDate() : (raw.timestamp ? new Date(raw.timestamp) : new Date(0));
          msgs[otherUid] = text;
          tsMap[otherUid] = ts;
          saveLastMessageToDB(otherUid, {
            lastMessage: text,
            timestamp: ts,
            unreadCount: 0,
            isGroup: false,
          });
        }
      });
      setLatestMessages((prev) => ({ ...prev, ...msgs }));
      setLatestTimestamps((prev) => ({ ...prev, ...tsMap }));
    }, (err) => {
      console.warn("Direct chats snapshot error:", err);
    });
    return () => unsub();
  }, [currentUser?.uid]);

  // 3. Fallback direct chat fetch for friends whose chat summary doc does not exist yet
  useEffect(() => {
    if (!currentUser?.uid || friends.length === 0) return;
    friends.forEach((friendId) => {
      if (!latestMessages[friendId] || latestMessages[friendId] === "No messages yet") {
        const chatId = [currentUser.uid, friendId].sort().join("_");
        const q = query(
          collection(db, "chats", chatId, "messages"),
          orderBy("timestamp", "desc"),
          limit(1)
        );
        getDocs(q).then((snap) => {
          if (!snap.empty) {
            const data = snap.docs[0].data();
            const msg = formatMessageSnippet(data);
            const ts = data.timestamp?.toDate?.() || (data.timestamp ? new Date(data.timestamp) : new Date(0));
            setLatestMessages((prev) => ({ ...prev, [friendId]: msg }));
            setLatestTimestamps((prev) => ({ ...prev, [friendId]: ts }));
          }
        }).catch(() => {});
      }
    });
  }, [currentUser?.uid, friends, latestMessages]);

  // 4. Real-time group chats sync from Firestore 'groupChats' collection
  useEffect(() => {
    if (!currentUser?.uid) return;
    const q = query(
      collection(db, "groupChats"),
      where("members", "array-contains", currentUser.uid)
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const groups = [];
      const gMsgs = {};
      const gTs = {};
      const gUnreads = {};

      snapshot.forEach((docSnap) => {
        const groupData = { id: docSnap.id, ...docSnap.data() };
        groups.push(groupData);

        if (groupData.lastMessage) {
          const rawMsg = groupData.lastMessage;
          const msg = typeof rawMsg === "string" ? rawMsg : (rawMsg.text || "No messages yet");
          const ts = rawMsg.timestamp?.toDate ? rawMsg.timestamp.toDate() : (rawMsg.timestamp ? new Date(rawMsg.timestamp) : new Date());
          gMsgs[docSnap.id] = msg;
          gTs[docSnap.id] = ts;

          const isSelected = selectedChatId === docSnap.id;
          const isSentByMe = rawMsg.senderId === currentUser.uid;
          const firestoreReadRaw = groupData.readTimestamps?.[currentUser.uid];
          const firestoreReadTs = firestoreReadRaw?.toDate ? firestoreReadRaw.toDate().getTime() : (firestoreReadRaw ? new Date(firestoreReadRaw).getTime() : 0);
          const localReadTs = Number(localStorage.getItem(`bunkmate_group_read_${docSnap.id}`) || 0);
          const effectiveReadTs = Math.max(firestoreReadTs, localReadTs);
          const msgTime = ts.getTime();

          const isUnread = !isSelected && !isSentByMe && (!effectiveReadTs || (msgTime - effectiveReadTs > 1000));
          gUnreads[docSnap.id] = isUnread ? 1 : 0;
        } else {
          // If no lastMessage yet on group document, fetch latest from groupChat/{docSnap.id}/messages
          const msgQ = query(
            collection(db, "groupChat", docSnap.id, "messages"),
            orderBy("timestamp", "desc"),
            limit(1)
          );
          getDocs(msgQ).then((msgSnap) => {
            if (!msgSnap.empty) {
              const d = msgSnap.docs[0].data();
              const snippet = formatMessageSnippet(d);
              const ts = d.timestamp?.toDate ? d.timestamp.toDate() : (d.timestamp ? new Date(d.timestamp) : new Date(0));
              setLatestGroupMessages((prev) => ({ ...prev, [docSnap.id]: snippet }));
              setLatestGroupTimestamps((prev) => ({ ...prev, [docSnap.id]: ts }));
              setDoc(doc(db, "groupChats", docSnap.id), {
                lastMessage: {
                  text: snippet,
                  senderId: d.senderId || "",
                  timestamp: d.timestamp || serverTimestamp(),
                },
                lastMessageTimestamp: d.timestamp || serverTimestamp(),
                updatedAt: serverTimestamp(),
              }, { merge: true }).catch(() => {});
            }
          }).catch(() => {});
        }
      });

      setUserGroups(groups);
      setLatestGroupMessages((prev) => ({ ...prev, ...gMsgs }));
      setLatestGroupTimestamps((prev) => ({ ...prev, ...gTs }));
      setGroupUnreadCounts((prev) => {
        const next = { ...prev };
        Object.entries(gUnreads).forEach(([gid, count]) => {
          if (count === 0 && !isChatMarkedUnread(gid)) {
            next[gid] = 0;
          } else if (count > 0) {
            next[gid] = Math.max(next[gid] || 0, count);
          }
        });
        if (selectedChatId) next[selectedChatId] = 0;
        return next;
      });
      setLoadingChats(false);
    }, (err) => {
      console.warn("groupChats snapshot error:", err);
      setLoadingChats(false);
    });

    return () => unsub();
  }, [currentUser?.uid, selectedChatId]);

  // 5. Real-time unseen notifications listener for precise unread badges across direct & group chats
  useEffect(() => {
    if (!currentUser?.uid) return;

    const notifQ = query(
      collection(db, "notifications"),
      where("uid", "==", currentUser.uid),
      where("seen", "==", false)
    );

    const unsub = onSnapshot(notifQ, (snapshot) => {
      const dUnreads = {};
      const gUnreads = {};

      snapshot.forEach((docSnap) => {
        const notif = docSnap.data();
        if (notif.groupName) {
          if (selectedChatId !== notif.groupName) {
            gUnreads[notif.groupName] = (gUnreads[notif.groupName] || 0) + 1;
          } else {
            updateDoc(doc(db, "notifications", docSnap.id), { seen: true }).catch(() => {});
          }
        } else if (notif.senderId && notif.senderId !== currentUser.uid) {
          if (selectedChatId !== notif.senderId) {
            dUnreads[notif.senderId] = (dUnreads[notif.senderId] || 0) + 1;
          } else {
            updateDoc(doc(db, "notifications", docSnap.id), { seen: true }).catch(() => {});
          }
        }
      });

      setUnreadCounts(dUnreads);
      setGroupUnreadCounts((prev) => {
        const merged = { ...prev };
        // Reset groups that have no unseen notifications unless locally marked unread
        Object.keys(merged).forEach((gid) => {
          if (!gUnreads[gid] && !isChatMarkedUnread(gid)) {
            merged[gid] = 0;
          }
        });
        Object.assign(merged, gUnreads);
        if (selectedChatId) merged[selectedChatId] = 0;
        return merged;
      });
    }, (err) => {
      console.warn("Unseen notifications listener error:", err);
    });

    return () => unsub();
  }, [currentUser?.uid, selectedChatId]);

  // 6. Real-time recent notifications listener (incoming message snippet updates)
  useEffect(() => {
    if (!currentUser?.uid) return;

    const notifQ = query(
      collection(db, "notifications"),
      where("uid", "==", currentUser.uid),
      orderBy("timestamp", "desc"),
      limit(25)
    );

    const unsub = onSnapshot(notifQ, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added" || change.type === "modified") {
          const notif = change.doc.data();
          const snippet = notif.content || (notif.imageUrl ? "Photo" : "New message");
          const ts = notif.timestamp?.toDate ? notif.timestamp.toDate() : new Date();

          if (notif.groupName) {
            setLatestGroupMessages((prev) => ({ ...prev, [notif.groupName]: snippet }));
            setLatestGroupTimestamps((prev) => ({ ...prev, [notif.groupName]: ts }));
          } else if (notif.senderId && notif.senderId !== currentUser.uid) {
            setLatestMessages((prev) => ({ ...prev, [notif.senderId]: snippet }));
            setLatestTimestamps((prev) => ({ ...prev, [notif.senderId]: ts }));
          }
        }
      });
    }, (err) => {
      console.warn("Recent notifications listener error:", err);
    });

    return () => unsub();
  }, [currentUser?.uid]);

  // 7. Active/selected direct chat listener (live message when open)
  useEffect(() => {
    if (!currentUser || !selectedChatId) return;
    const isUserChat = users.some((u) => u.id === selectedChatId);
    if (!isUserChat) return;

    const chatId = [currentUser.uid, selectedChatId].sort().join('_');
    const q = query(
      collection(db, 'chats', chatId, 'messages'),
      orderBy('timestamp', 'desc'),
      limit(1)
    );

    const unsub = onSnapshot(q, (snapshot) => {
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const msg = formatMessageSnippet(data);
        const ts = data.timestamp?.toDate?.() || (data.timestamp ? new Date(data.timestamp) : new Date(0));
        setLatestMessages((prev) => ({ ...prev, [selectedChatId]: msg }));
        setUnreadCounts((prev) => ({ ...prev, [selectedChatId]: 0 }));
        setLatestTimestamps((prev) => ({ ...prev, [selectedChatId]: ts }));
      });
    });

    return () => unsub();
  }, [selectedChatId, currentUser, users]);

  // 8. Active/selected group chat listener (live message when open)
  useEffect(() => {
    if (!currentUser || !selectedChatId) return;
    const isGroupChat = userGroups.some((g) => g.id === selectedChatId);
    if (!isGroupChat) return;

    const q = query(
      collection(db, 'groupChat', selectedChatId, 'messages'),
      orderBy('timestamp', 'desc'),
      limit(1)
    );

    const unsub = onSnapshot(q, (snapshot) => {
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const msg = formatMessageSnippet(data);
        const ts = data.timestamp?.toDate?.() || (data.timestamp ? new Date(data.timestamp) : new Date(0));
        try {
          localStorage.setItem(`bunkmate_group_read_${selectedChatId}`, Date.now().toString());
        } catch {}
        setLatestGroupMessages((prev) => ({ ...prev, [selectedChatId]: msg }));
        setLatestGroupTimestamps((prev) => ({ ...prev, [selectedChatId]: ts }));
        setGroupUnreadCounts((prev) => ({ ...prev, [selectedChatId]: 0 }));
      });
    });

    return () => unsub();
  }, [selectedChatId, currentUser, userGroups]);

  // 9. Window event listener for optimistic local updates
  useEffect(() => {
    const handleLastMsgUpdated = (e) => {
      if (!e.detail) return;
      const { chatId, lastMessage, timestamp, unreadCount, isGroup } = e.detail;
      const ts = timestamp ? new Date(timestamp) : new Date();
      if (isGroup) {
        if (lastMessage) setLatestGroupMessages((prev) => ({ ...prev, [chatId]: lastMessage }));
        setLatestGroupTimestamps((prev) => ({ ...prev, [chatId]: ts }));
        if (typeof unreadCount === "number") {
          setGroupUnreadCounts((prev) => ({ ...prev, [chatId]: unreadCount }));
        }
      } else {
        if (lastMessage) setLatestMessages((prev) => ({ ...prev, [chatId]: lastMessage }));
        setLatestTimestamps((prev) => ({ ...prev, [chatId]: ts }));
        if (typeof unreadCount === "number") {
          setUnreadCounts((prev) => ({ ...prev, [chatId]: unreadCount }));
        }
      }
    };

    window.addEventListener("bm_last_message_updated", handleLastMsgUpdated);
    return () => {
      window.removeEventListener("bm_last_message_updated", handleLastMsgUpdated);
    };
  }, []);

  // 10. Automatically mark selected chat as read in Firestore and clear notifications
  useEffect(() => {
    if (!currentUser?.uid || !selectedChatId) return;

    const isGroup = userGroups.some((g) => g.id === selectedChatId);

    if (isGroup) {
      setGroupUnreadCounts((prev) => ({ ...prev, [selectedChatId]: 0 }));
      try {
        localStorage.setItem(`bunkmate_group_read_${selectedChatId}`, Date.now().toString());
      } catch {}

      // Mark group notifications as seen in Firestore
      const groupNotifQ = query(
        collection(db, "notifications"),
        where("uid", "==", currentUser.uid),
        where("groupName", "==", selectedChatId),
        where("seen", "==", false)
      );
      getDocs(groupNotifQ).then((snap) => {
        snap.forEach((d) => {
          updateDoc(doc(db, "notifications", d.id), { seen: true }).catch(() => {});
        });
      }).catch(() => {});

      // Update group read timestamp in Firestore
      setDoc(
        doc(db, "groupChats", selectedChatId),
        {
          readTimestamps: {
            [currentUser.uid]: serverTimestamp(),
          },
        },
        { merge: true }
      ).catch(() => {});

      markGroupAsRead(selectedChatId).catch(() => {});
    } else {
      setUnreadCounts((prev) => ({ ...prev, [selectedChatId]: 0 }));

      // Mark direct notifications as seen in Firestore
      const directNotifQ = query(
        collection(db, "notifications"),
        where("uid", "==", currentUser.uid),
        where("senderId", "==", selectedChatId),
        where("seen", "==", false)
      );
      getDocs(directNotifQ).then((snap) => {
        snap.forEach((d) => {
          updateDoc(doc(db, "notifications", d.id), { seen: true }).catch(() => {});
        });
      }).catch(() => {});
    }

    clearMarkChatUnread(selectedChatId);
    markChatAsReadInDB(selectedChatId, isGroup);
  }, [selectedChatId, currentUser?.uid, userGroups, markGroupAsRead]);

  const handleSelect = (userId) => {
    if (!currentUser) return;
    setUnreadCounts((prev) => ({ ...prev, [userId]: 0 }));
    clearMarkChatUnread(userId);
    markChatAsReadInDB(userId, false);

    const notifQ = query(
      collection(db, "notifications"),
      where("uid", "==", currentUser.uid),
      where("senderId", "==", userId),
      where("seen", "==", false)
    );
    getDocs(notifQ).then((snap) => {
      snap.forEach((d) => {
        updateDoc(doc(db, "notifications", d.id), { seen: true }).catch(() => {});
      });
    }).catch(() => {});

    if (onSelectChat) {
      onSelectChat({ type: "user", id: userId });
    } else {
      navigate(`/chat/${userId}`);
    }
  };

  const handleGroupClick = (groupId) => {
    if (!currentUser) return;
    
    // Update local unread count immediately
    setGroupUnreadCounts(prev => ({
      ...prev,
      [groupId]: 0
    }));
    clearMarkChatUnread(groupId);
    markChatAsReadInDB(groupId, true);

    try {
      localStorage.setItem(`bunkmate_group_read_${groupId}`, Date.now().toString());
    } catch {}

    const notifQ = query(
      collection(db, "notifications"),
      where("uid", "==", currentUser.uid),
      where("groupName", "==", groupId),
      where("seen", "==", false)
    );
    getDocs(notifQ).then((snap) => {
      snap.forEach((d) => {
        updateDoc(doc(db, "notifications", d.id), { seen: true }).catch(() => {});
      });
    }).catch(() => {});

    setDoc(
      doc(db, "groupChats", groupId),
      {
        readTimestamps: {
          [currentUser.uid]: serverTimestamp(),
        },
      },
      { merge: true }
    ).catch(() => {});
    
    // Navigate or select immediately without blocking
    if (onSelectChat) {
      onSelectChat({ type: "group", id: groupId });
    } else {
      navigate(`/group/${groupId}`);
    }

    markGroupAsRead(groupId).catch(() => {});
  };


  const formatTimestamp = (date) => {
    if (!(date instanceof Date) || isNaN(date)) return '';
    if (isToday(date)) return format(date, 'h:mm a');
    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'dd/MM/yy');
  };


  // Fetch all users for search (excluding current user and already-friends)
useEffect(() => {
  if (searchTerm.trim() === '') return setSearchResults([]);
  const fetchUsers = async () => {
    const usersSnapshot = await getDocs(collection(db, "users"));
    const matches = [];
    usersSnapshot.forEach(docSnap => {
      const data = docSnap.data();
      if (
        data.username?.toLowerCase().includes(searchTerm.toLowerCase()) &&
        data.uid !== currentUser.uid &&
        !friends.includes(data.uid)
      ) {
        matches.push({ ...data, uid: docSnap.id });
      }
    });
    setSearchResults(matches);
  };
  fetchUsers();
}, [searchTerm, currentUser, friends]);

// Add friend logic
// --- Enhanced Friend Logic (visibility + requests) ---
const handleAddFriend = async (targetUser) => {
  try {
    if (!auth.currentUser) {
      setSnackbar({ open: true, message: "You must be logged in to add friends", severity: "info" });
      return;
    }

    const currentUid = auth.currentUser.uid;
    if (targetUser.uid === currentUid) {
      setSnackbar({ open: true, message: "You cannot add yourself!", severity: "warning" });
      return;
    }

    const currentUserRef = doc(db, "users", currentUid);
    const targetUserRef = doc(db, "users", targetUser.uid);
    const [currentSnap, targetSnap] = await Promise.all([
      getDoc(currentUserRef),
      getDoc(targetUserRef),
    ]);

    if (!currentSnap.exists() || !targetSnap.exists()) {
      setSnackbar({ open: true, message: "User not found", severity: "error" });
      return;
    }

    const currentUserData = currentSnap.data();
    const targetUserData = targetSnap.data();
    const visibility = targetUserData.privacy?.profileVisibility || "public";
    const currentUserName = currentUserData.name || "A user";
    const currentUserPic = currentUserData.photoURL || "";

    if (visibility === "public") {
      // 🔓 Public: Add directly
      await Promise.all([
        updateDoc(currentUserRef, { friends: arrayUnion(targetUser.uid) }),
        updateDoc(targetUserRef, { friends: arrayUnion(currentUid) }),
      ]);

      await Promise.all([
        addDoc(collection(db, "notifications"), {
          content: `${currentUserName} added you as a friend.`,
          pic: currentUserPic,
          seen: false,
          senderId: currentUid,
          timestamp: new Date(),
          title: "New Friend Added",
          type: "friend_added",
          uid: targetUser.uid,
        }),
        addDoc(collection(db, "notifications"), {
          content: `You are now friends with ${targetUser.displayName || targetUser.name}.`,
          pic: targetUser.photoURL || "",
          seen: false,
          senderId: targetUser.uid,
          timestamp: new Date(),
          title: "Friendship Confirmed",
          type: "friend_added_self",
          uid: currentUid,
        }),
      ]);

      setSnackbar({ open: true, message: `You and ${targetUser.displayName || targetUser.name} are now friends!`, severity: "success" });
    } else {
      // 🔒 Private: Send friend request
      await addDoc(collection(db, "notifications"), {
        content: `${currentUserName} sent you a friend request.`,
        pic: currentUserPic,
        seen: false,
        senderId: currentUid,
        timestamp: new Date(),
        title: "Friend Request Received",
        type: "friend_request",
        uid: targetUser.uid,
        status: "pending",
      });

      setSnackbar({ open: true, message: "Friend request sent!", severity: "info" });
    }
  } catch (err) {
    console.error("Error adding friend:", err);
    setSnackbar({ open: true, message: "Something went wrong.", severity: "error" });
  }
};

const [friendRequests, setFriendRequests] = useState([]);

useEffect(() => {
  if (!currentUser) return;
  const q = query(
    collection(db, "notifications"),
    where("uid", "==", currentUser.uid),
    where("type", "==", "friend_request")
  );

  const unsubscribe = onSnapshot(q, (snapshot) => {
    const reqs = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    setFriendRequests(reqs);
  });

  return () => unsubscribe();
}, [currentUser]);


const handleAcceptRequest = async () => {
  if (!requestId || !selectedUserProfile?.uid || !currentUser) return;
  try {
    const requestRef = doc(db, "notifications", requestId);
    await updateDoc(requestRef, { status: "accepted" });

    await Promise.all([
      updateDoc(doc(db, "users", currentUser.uid), {
        friends: arrayUnion(selectedUserProfile.uid),
      }),
      updateDoc(doc(db, "users", selectedUserProfile.uid), {
        friends: arrayUnion(currentUser.uid),
      }),
    ]);

    await addDoc(collection(db, "notifications"), {
      content: `${userData.name || "A user"} accepted your friend request.`,
      pic: userData.photoURL || "",
      seen: false,
      senderId: currentUser.uid,
      timestamp: new Date(),
      title: "Friend Request Accepted",
      type: "friend_accept",
      uid: selectedUserProfile.uid,
      status: "accepted",
    });

    setSnackbar({ open: true, message: "Friend request accepted!", severity: "success" });
  } catch (err) {
    console.error("Error accepting request:", err);
  }
};

const handleRejectRequest = async () => {
  if (!requestId) return;
  try {
    await updateDoc(doc(db, "notifications", requestId), { status: "rejected" });
    await addDoc(collection(db, "notifications"), {
      content: `${userData.name || "A user"} rejected your friend request.`,
      pic: userData.photoURL || "",
      seen: false,
      senderId: currentUser.uid,
      timestamp: new Date(),
      title: "Friend Request Rejected",
      type: "friend_reject",
      uid: selectedUserProfile.uid,
      status: "rejected",
    });
    setSnackbar({ open: true, message: "Friend request rejected.", severity: "info" });
  } catch (err) {
    console.error("Error rejecting request:", err);
  }
};

useEffect(() => {
  const autoAddToSystemGroup = async () => {
    if (!currentUser?.uid) return;

    try {
      const userDocRef = doc(db, "users", currentUser.uid);
      const userSnap = await getDoc(userDocRef);

      if (!userSnap.exists()) return;

      const userData = userSnap.data();
      const userType = userData.type?.toLowerCase();

      // Group IDs from Firestore (must already exist!)
      const systemGroups = {
        beta: "bm-beta-testers-group",      // Replace with actual Firestore ID
        "dev beta": "bm-dev-beta-group"   // Replace with actual Firestore ID
      };

      const targetGroupId = systemGroups[userType];
      if (!targetGroupId) return;

      const groupRef = doc(db, "groupChats", targetGroupId);
      const groupSnap = await getDoc(groupRef);
      if (!groupSnap.exists()) return;

      const groupData = groupSnap.data();

      if (!groupData.members.includes(currentUser.uid)) {
        await updateDoc(groupRef, {
          members: arrayUnion(currentUser.uid)
        });

        // Optionally: send a system message to the group
        await addDoc(collection(db, "groupChat", targetGroupId, "messages"), {
          type: "system",
          content: `${userData.name || "A user"} joined the ${groupData.name} group.`,
          timestamp: serverTimestamp(),
        });

        console.log(`✅ User added to ${groupData.name} group.`);
      }
    } catch (err) {
      console.error("❌ Failed to auto-add user to system group:", err);
    }
  };

  autoAddToSystemGroup();
}, [currentUser]);

// Direct chat users: all friends, users with messages or unread counts, or available contacts
const directChatUsers = users.filter((u) => {
  if (friends.includes(u.id)) return true;
  if (latestMessages[u.id] && latestMessages[u.id] !== 'No messages yet') return true;
  if (unreadCounts[u.id] > 0) return true;
  return false;
});
const displayUsers = directChatUsers.length > 0 ? directChatUsers : users.slice(0, 15);

  if (currentUser === null) {
    if (onlyList) {
      return <ChatListSkeleton count={7} isDark={mode === "dark"} onlyList={true} />;
    }
    return (
      <ThemeProvider theme={theme}>
        <Box
          sx={{
            width: "100%",
            maxWidth: isEmbedded ? "100%" : 900,
            mx: "auto",
            px: { xs: 2, sm: 2.5, md: isEmbedded ? 2 : 4 },
            pt: { xs: 2, md: 3 },
          }}
        >
          <ChatListSkeleton count={8} isDark={mode === "dark"} />
        </Box>
      </ThemeProvider>
    );
  }

const combinedChats = [
  ...displayUsers.map((user) => ({
    type: 'user',
    id: user.id,
    name: nicknames[user.id] || user.name || user.username || "User",
    username: user.username || "",
    photoURL: user.photoURL,
    lastMessage: latestMessages[user.id] || 'No messages yet',
    timestamp: latestTimestamps[user.id] || new Date(0),
    unreadCount: selectedChatId === user.id ? 0 : ((unreadCounts[user.id] || 0) + (isChatMarkedUnread(user.id) && !unreadCounts[user.id] ? 1 : 0)),
    rawUser: user,
  })),
  ...userGroups.map((group) => {
    const rawMsg = latestGroupMessages[group.id];
    const msgText = typeof rawMsg === 'string' ? rawMsg : (rawMsg?.text || rawMsg?.content || 'No messages yet');
    return {
      type: 'group',
      id: group.id,
      name: group.name || 'Group',
      emoji: group.emoji,
      iconURL: group.iconURL || "",
      memberCount: group.members?.length || 0,
      lastMessage: msgText,
      timestamp: latestGroupTimestamps[group.id] || new Date(0),
      unreadCount: selectedChatId === group.id ? 0 : ((groupUnreadCounts[group.id] || 0) + (isChatMarkedUnread(group.id) && !groupUnreadCounts[group.id] ? 1 : 0)),
      rawGroup: group,
    };
  }),
]
  .filter((chat) => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (
      chat.name?.toLowerCase().includes(q) ||
      chat.username?.toLowerCase().includes(q) ||
      chat.lastMessage?.toLowerCase().includes(q)
    );
  })
  .sort((a, b) => {
    const aPinned = isChatPinned(a.id);
    const bPinned = isChatPinned(b.id);
    if (aPinned && !bPinned) return -1;
    if (!aPinned && bPinned) return 1;
    return b.timestamp - a.timestamp;
  });

const filteredCombinedChats = combinedChats.filter((chat) => {
  if (activeTab === "direct") return chat.type === "user";
  if (activeTab === "groups") return chat.type === "group";
  if (activeTab === "unread") return chat.unreadCount > 0;
  if (activeTab === "favorites") return isChatFavorite(chat.id);
  const customList = customChatLists.find((l) => l.id === activeTab);
  if (customList) return (customList.chatIds || []).includes(chat.id);
  return true; // "all"
});


    if (onlyList) {
      // Only render the combined chats/groups list (no dialogs, no search, no floating button, etc)
      if (loadingChats && combinedChats.length === 0) {
        return <ChatListSkeleton count={7} isDark={mode === "dark"} onlyList={true} />;
      }
      return (
        <div>
          {filteredCombinedChats.map((chat) => (
            <div
              key={chat.id}
              onTouchStart={(e) => handleChatTouchStart(e, chat)}
              onTouchMove={handleChatTouchMove}
              onTouchEnd={handleChatTouchEnd}
              onContextMenu={(e) => handleChatContextMenu(e, chat)}
              onClick={() => {
                if (isLongPressTriggeredRef.current) {
                  isLongPressTriggeredRef.current = false;
                  return;
                }
                if (chat.type === "group") {
                  handleGroupClick(chat.id);
                } else {
                  handleSelect(chat.id);
                }
              }}
              style={{
                padding: "12px",
                marginBottom: "10px",
                borderRadius: "18px",
                display: "flex",
                alignItems: "center",
                backgroundColor:
                  chat.unreadCount > 0 ? WeatherBgdrop : "#00000000",
                cursor: "pointer",
                transition: "background-color 0.3s",
              }}
            >
              {chat.type === "group" ? (
                <Avatar
                  src={safeImageUrl(chat.iconURL)}
                  sx={{
                    bgcolor: theme.palette.primary.bg,
                    color: theme.palette.primary.main,
                    fontSize: 22,
                    fontWeight: 800,
                    width: 44,
                    height: 44,
                    marginRight: 2,
                  }}
                >
                  {(!isValidImageUrl(chat.iconURL) && chat.iconURL) || chat.emoji || chat.name?.[0]?.toUpperCase() || "G"}
                </Avatar>
              ) : (
                <Avatar
                  src={chat.photoURL || "https://via.placeholder.com/50"}
                  alt={chat.name}
                  style={{
                    width: "44px",
                    height: "44px",
                    borderRadius: "50%",
                    marginRight: "16px",
                  }}
                />
              )}

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <p style={{ margin: 0, fontWeight: "bold", color: "#FFFFFF" }}>
                    {chat.name}
                  </p>
                  {isChatPinned(chat.id) && (
                    <PushPinRoundedIcon sx={{ fontSize: 13, color: theme.palette.primary.main, transform: "rotate(45deg)", flexShrink: 0 }} />
                  )}
                  {isChatFavorite(chat.id) && (
                    <StarRoundedIcon sx={{ fontSize: 16, color: "#fbc02d", flexShrink: 0 }} />
                  )}
                  {isChatMuted(chat.id) && (
                    <NotificationsOffOutlinedIcon sx={{ fontSize: 13, color: "text.secondary", opacity: 0.7, flexShrink: 0 }} />
                  )}
                  {chat.type === "group" && (
                    <Chip
                      size="small"
                      label={chat.memberCount > 0 ? `${chat.memberCount} members` : "Group"}
                      sx={{
                        height: 18,
                        fontSize: "0.62rem",
                        fontWeight: 800,
                        bgcolor: "rgba(255,255,255,0.08)",
                        color: "text.secondary",
                      }}
                    />
                  )}
                  {["BM - Beta members", "BM - Dev Beta"].includes(chat.name) && (
                    <span
                      style={{
                        fontSize: 12,
                        backgroundColor: "#00f72133",
                        padding: "2px 6px",
                        borderRadius: 6,
                        color: "#00f721",
                        fontWeight: 700,
                      }}
                    >
                      {chat.name.includes("Dev") ? "🧪 Dev Beta" : "🔒 Beta"}
                    </span>
                  )}
                </div>
                <p
                  style={{
                    margin: 0,
                    marginTop: 4,
                    color: "#BDBDBD",
                    fontSize: "0.82rem",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    maxWidth: "100%",
                  }}
                >
                  {chat.lastMessage || "No messages yet"}
                </p>
              </div>

              {/* Quick Call Actions for onlyList */}
              {chat.type === "user" && (
                <Box sx={{ display: "flex", gap: 0.5, mr: 1 }}>
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleInitiateCall(chat.rawUser || { id: chat.id, name: chat.name, photoURL: chat.photoURL, username: chat.username }, "audio");
                    }}
                    sx={{ color: "text.secondary", "&:hover": { color: "#00e676" } }}
                  >
                    <CallIcon sx={{ fontSize: "1.05rem" }} />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleInitiateCall(chat.rawUser || { id: chat.id, name: chat.name, photoURL: chat.photoURL, username: chat.username }, "video");
                    }}
                    sx={{ color: "text.secondary", "&:hover": { color: "#2979ff" } }}
                  >
                    <VideocamIcon sx={{ fontSize: "1.1rem" }} />
                  </IconButton>
                </Box>
              )}

              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  setChatMenuAnchor({ mouseX: e.clientX, mouseY: e.clientY });
                  setSelectedMenuChat(chat);
                }}
                sx={{
                  color: "text.secondary",
                  opacity: { xs: 0.6, md: 0 },
                  transition: "opacity 0.2s",
                  "&:hover": { color: "text.primary", opacity: 1 },
                  ".MuiBox-root:hover &, div:hover &": { opacity: 1 },
                  p: 0.5,
                  mr: 0.5,
                }}
              >
                <MoreVertIcon sx={{ fontSize: 18 }} />
              </IconButton>

              {chat.unreadCount > 0 ? (
                <span
                  style={{
                    backgroundColor: buttonWeatherBg,
                    color: "#212121",
                    padding: "4px 8px",
                    borderRadius: "50%",
                    fontSize: "0.75rem",
                    fontWeight: 800,
                  }}
                >
                  {chat.unreadCount}
                </span>
              ) : (
                <span style={{ fontSize: "11px", color: "#888" }}>
                  {formatTimestamp(chat.timestamp)}
                </span>
              )}
            </div>
          ))}
          {renderChatActionMenuAndDialogs()}
        </div>
      );
    }


  return (
      <ThemeProvider theme={theme}>
        {/* <DeviceGuard> */}
      <BetaAccessGuard fallback={<ChatListSkeleton count={8} sx={{ p: 2 }} isDark={mode === "dark"} onlyList={onlyList} />}>
        <Box
          sx={{
            width: "100%",
            minHeight: "100%",
            boxSizing: "border-box",
            px: { xs: 0, sm: 2.5, md: isEmbedded ? 2.2 : 4 },
            pb: { xs: 12, md: isEmbedded ? 3 : 5 },
            maxWidth: isEmbedded ? "100%" : 900,
            mx: "auto",
            background: 'transparent',
          }}
        >
          {/* Header Row */}
<Box
sx={{
  display: "flex",
  flexDirection: "column",
  mb: 1.5,
  mt: 3,
  px: { xs: 2.5, md: 0 },
  pt: { xs: 1.5, sm: 2, md: isEmbedded ? 1.5 : 3 },
  position: { xs: "sticky", md: "relative" },
  top: 0,
  zIndex: 99,

  background: mode === "dark"
    ? "linear-gradient(to bottom, rgba(12,12,12,1) 0%, rgba(12,12,12,0.96) 55%, rgba(12,12,12,0.72) 80%, rgba(12,12,12,0) 100%)"
    : isEmbedded
      ? "linear-gradient(to bottom, rgba(248,249,250,1) 0%, rgba(248,249,250,0.96) 55%, rgba(248,249,250,0.72) 80%, rgba(248,249,250,0) 100%)"
      : "linear-gradient(to bottom, rgba(241,241,241,1) 0%, rgba(241,241,241,0.96) 55%, rgba(241,241,241,0.72) 80%, rgba(241,241,241,0) 100%)",

  backgroundRepeat: "no-repeat",
  backgroundSize: "100% 100%",
}}
>
            <Box
              sx={{
                display: "flex",
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
            <Typography
              variant={isEmbedded ? "h3" : "h3"}
              sx={{
                color: theme.palette.text.primary,
                fontWeight: 600,
                fontSize: { xs: "1.5rem", sm: "1.75rem", md: isEmbedded ? "1.85rem" : "2rem" },
                letterSpacing: "-0.02em",
              }}
            >
              Chats
            </Typography>

            <Stack direction="row" spacing={0.75} alignItems="center">
              <Tooltip title="New Chat">
                <IconButton
                  onClick={() => setAddUserDialog(true)}
                  size="medium"
                  sx={{
                    color: "text.primary",
                    boxShadow: mode === "dark" ? 'inset 0 1px 1px rgba(255, 255, 255, 0.11), inset 0 -1px 1px rgba(0,0,0,0.4)' : 'inset 0 1px 1px rgba(255, 255, 255, 0.71), inset 0 -1px 1px rgba(0,0,0,0.1)',
                    bgcolor: mode === "dark" ? "#f1f1f111" : "rgba(0,0,0,0.04)",
                    "&:hover": { bgcolor: mode === "dark" ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)" },
                  }}
                >
                  <AddIcon fontSize="large" />
                </IconButton>
              </Tooltip>
            
            {isEmbedded &&
              <Tooltip title="Calls">
                <IconButton
                  onClick={() => setActiveTab('calls')}
                  size="medium"
                  sx={{
                    color: "text.primary",
                    boxShadow: mode === "dark" ? 'inset 0 1px 1px rgba(255, 255, 255, 0.11), inset 0 -1px 1px rgba(0,0,0,0.4)' : 'inset 0 1px 1px rgba(255, 255, 255, 0.71), inset 0 -1px 1px rgba(0,0,0,0.1)',
                    bgcolor: mode === "dark" ? "#f1f1f111" : "rgba(0,0,0,0.04)",
                    "&:hover": { bgcolor: mode === "dark" ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)" },
                  }}
                >
                  <CallIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            }
                  
              <Tooltip title="More options">
                <IconButton
                  onClick={(e) => setMenuAnchorEl(e.currentTarget)}
                  size="medium"
                  sx={{
                    color: "text.primary",
                    boxShadow: mode === "dark" ? 'inset 0 1px 1px rgba(255, 255, 255, 0.11), inset 0 -1px 1px rgba(0,0,0,0.4)' : 'inset 0 1px 1px rgba(255, 255, 255, 0.71), inset 0 -1px 1px rgba(0,0,0,0.1)',
                    bgcolor: mode === "dark" ? "#f1f1f111" : "rgba(0,0,0,0.04)",
                    "&:hover": { bgcolor: mode === "dark" ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)" },
                  }}
                >
                  <MoreVertIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Stack>
            </Box>
    <Box
      sx={{
        py: 1,
        mb: 0,
      }}
    >
      <TextField
        fullWidth
        type="text"
        placeholder="Search users or groups..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        InputProps={{ startAdornment: (<InputAdornment position="start"><SearchIcon sx={{ color: mode === "dark" ? "rgba(255, 255, 255, 0.5)" : "rgba(0, 0, 0, 0.4)", mr: 1, fontSize: "1.25rem" }} /></InputAdornment>) }}
        sx={{
          width: "100%",
          "& .MuiOutlinedInput-root": {
            color: mode === "dark" ? "#fff" : "#111", borderRadius: 8, height: 44, backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)", backgroundColor: mode === "dark" ? "rgba(255, 255, 255, 0.04)" : "rgba(0, 0, 0, 0.04)",
            boxShadow: mode === "dark" ? `inset 0 1px 2px rgba(255, 255, 255, 0.11), inset 0 -1px 1px rgba(35, 35, 35, 0.07)` : `inset 0 1px 1px rgba(255,255,255,0.8), inset 0 -1px 1px rgba(0,0,0,0.1)`,
            border: "0px solid", borderColor: mode === "dark" ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.06)", transition: "all 0.2s ease-in-out", "& fieldset": { border: "none" },
            "&:hover": { backgroundColor: mode === "dark" ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.05)" },
            "&.Mui-focused": { backgroundColor: mode === "dark" ? "rgba(255, 255, 255, 0.04)" : "rgba(255, 255, 255, 0.8)" }
          },
          "& .MuiOutlinedInput-input": { py: 1.2, fontSize: "0.9rem" }
        }}
      />
    </Box>

        <Box
          sx={{
            display: "flex",
            gap: 1,
            my: { xs: 1, md: 1.5 },
            overflowX: "auto",
            pb: 0.5,
            scrollbarWidth: "none",
            "&::-webkit-scrollbar": { display: "none" },
            WebkitOverflowScrolling: "touch",
          }}
        >
          {[
            { id: "all", label: "All", count: combinedChats.length },
            { id: "unread", label: "Unread", count: combinedChats.filter((c) => c.unreadCount > 0).length },
            { id: "groups", label: "Groups", count: combinedChats.filter((c) => c.type === "group").length },
            ...customChatLists.map((list) => ({
              id: list.id,
              label: list.name,
              isCustom: true,
              count: combinedChats.filter((c) => (list.chatIds || []).includes(c.id)).length,
            })),
          ].map((tab) => (
            <Button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              size="small"
              sx={{
                px: 1.8,
                py: 0.4,
                borderRadius: 8,
                fontSize: "0.75rem",
                fontWeight: 700,
                textTransform: "none",
                whiteSpace: "nowrap",
                flexShrink: 0,
                backdropFilter: 'blur(20px)',
                bgcolor:
                  activeTab === tab.id
                    ? mode === "dark"
                      ? "rgba(255, 255, 255, 0.9)"
                      : "rgba(0, 0, 0, 0.8)"
                    : mode === "dark"
                    ? "rgba(255,255,255,0.04)"
                    : "rgba(0,0,0,0.03)",
                color:
                  activeTab === tab.id
                    ? mode === "dark"
                      ? "#000000"
                      : "#ffffff"
                    : "text.secondary",
                boxShadow: mode === "dark" ? 'inset 0 1px 1px rgba(255, 255, 255, 0.11), inset 0 -1px 1px rgba(0,0,0,0.4)' : 'inset 0 1px 1px rgba(255, 255, 255, 0.21), inset 0 -1px 1px rgba(0,0,0,0.1)',
                border:
                  activeTab === tab.id
                    ? `0px solid ${mode === "dark" ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.15)"}`
                    : "0px solid transparent",
                "&:hover": {
                  bgcolor: activeTab === tab.id ? mode === "dark" ? "rgba(255,255,255, 1)" : "rgba(0,0,0,1)" : mode === "dark" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.06)",
                  transform: 'translate(0px)'
                },
              }}
            >
              {tab.label}
              {tab.count > 0 && (
                <Box
                  component="span"
                  sx={{
                    ml: 0.8,
                    px: 0.7,
                    py: 0.1,
                    borderRadius: "99px",
                    fontSize: "0.68rem",
                    bgcolor:
                      tab.id === "unread" && tab.count > 0
                        ? "#f44336"
                        : mode === "dark"
                        ? "rgba(255,255,255,0.1)"
                        : "rgba(0,0,0,0.08)",
                    color: tab.id === "unread" && tab.count > 0 ? "#fff" : "inherit",
                  }}
                >
                  {tab.count}
                </Box>
              )}
            </Button>
          ))}
          <Button
            onClick={() => {
              setNewListName("");
              setSelectedListChats([]);
              setListSearchTerm("");
              setCreateListDialogOpen(true);
            }}
            size="small"
            sx={{
              px: 1.5,
              py: 0.4,
              borderRadius: "99px",
              fontSize: "0.75rem",
              fontWeight: 700,
              textTransform: "none",
              whiteSpace: "nowrap",
              flexShrink: 0,
              bgcolor: mode === "dark" ? "rgba(255,255,255,0)" : "rgba(0,0,0,0)",
              color: mode === "dark" ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.7)",
              border: `1.5px dashed ${mode === "dark" ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)"}`,
              "&:hover": {
                bgcolor: mode === "dark" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
                transform: 'translate(0px)',
              },
            }}
            startIcon={<AddIcon sx={{ fontSize: 14 }} />}
          >
            New List
          </Button>
        </Box>
</Box>

          {/* Three-Dots Menu */}
<Menu
  anchorEl={menuAnchorEl}
  open={Boolean(menuAnchorEl)}
  onClose={() => setMenuAnchorEl(null)}
  anchorOrigin={{
    vertical: "bottom",
    horizontal: "right",
  }}
  transformOrigin={{
    vertical: "top",
    horizontal: "right",
  }}
  slotProps={{
    paper: {
      sx: {
        mt: 1,
        p: 0.7,
        px: 0,
        borderRadius: 6,
        overflow: "hidden",
        backgroundImage: "none",
        bgcolor:
          mode === "dark"
            ? "rgba(0, 0, 0, 0.26)"
            : "rgba(255, 255, 255, 0.41)",
        backdropFilter: "blur(28px) saturate(180%)",
        WebkitBackdropFilter: "blur(28px) saturate(180%)",
        border: "1px solid",
        borderColor: mode === "dark" ? "#f1f1f111" : "#00000012",
        color: mode === "dark" ? "#dcdcdc" : "#000",

        "& .MuiMenu-list": {
          p: 0,
          display: "flex",
          flexDirection: "column",
          gap: "3px",
        },

        "& .MuiDivider-root": {
          my: 0.5,
          mx: 0.75,
          borderColor:
            mode === "dark"
              ? "rgba(255,255,255,0.09)"
              : "rgba(0,0,0,0.07)",
        },
      },
    },
  }}
>
  {[
    {
      label: "Read all messages",
      icon: <DoneAllIcon />,
      color: theme.palette.primary.main,
      action: handleMarkAllAsRead,
    },
    {
      label: "New group",
      icon: <GroupAddIcon />,
      color: theme.palette.primary.main,
      action: () => {
        setMenuAnchorEl(null);
        setGroupDialogOpen(true);
      },
    },
    {
      label: "Starred chats",
      icon: <StarRoundedIcon />,
      color: "#f5b82e",
      action: () => {
        setMenuAnchorEl(null);
        setActiveTab("favorites");
      },
    },
    {
      label: "Broadcast message",
      icon: <CampaignIcon />,
      color: "#29b6f6",
      action: () => {
        setMenuAnchorEl(null);
        setSelectedBroadcastRecipients([]);
        setBroadcastText("");
        setBroadcastSearchTerm("");
        setBroadcastDialogOpen(true);
      },
    },
    {
      label: "Manage chat lists",
      icon: <PlaylistAddIcon />,
      color: "#ab47bc",
      action: () => {
        setMenuAnchorEl(null);
        setManageListsDialogOpen(true);
      },
    },
  ].map((item) => (
    <MenuItem
      key={item.label}
      onClick={item.action}
      sx={{
        minHeight: 44,
        pr: 1,
        pl: 0.1,
        py: 0.7,
        borderRadius: 4.5,
        gap: 1.05,
        transition: "background-color 160ms ease, transform 160ms ease",
        "&:hover": {
          bgcolor:
            mode === "dark"
              ? "rgba(255,255,255,0.07)"
              : "rgba(20,35,55,0.045)",
        },
        "&:active": {
          transform: "scale(0.985)",
        },
      }}
    >
      <ListItemIcon
        sx={{
          borderRadius: "11px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "text.secondary",
          "& .MuiSvgIcon-root": {
            fontSize: 20,
          },
        }}
      >
        {item.icon}
      </ListItemIcon>

      <ListItemText
        primary={item.label}
        primaryTypographyProps={{
          fontSize: "0.875rem",
          fontWeight: 600,
          letterSpacing: "-0.01em",
          color: "text.secondary",
        }}
      />
    </MenuItem>
  ))}

  <Divider />

  <MenuItem
    onClick={() => {
      setMenuAnchorEl(null);
      navigate("/profile");
    }}
    sx={{
      minHeight: 44,
        pr: 1,
        pl: 0.1,
        py: 0.7,
      borderRadius: 4.5,
      gap: 1.05,
      transition: "background-color 160ms ease, transform 160ms ease",
      "&:hover": {
        bgcolor:
          mode === "dark"
            ? "rgba(255,255,255,0.07)"
            : "rgba(20,35,55,0.045)",
      },
      "&:active": {
        transform: "scale(0.985)",
      },
    }}
  >
    <ListItemIcon
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "text.secondary",
        "& .MuiSvgIcon-root": {
          fontSize: 20,
        },
      }}
    >
      <SettingsOutlinedIcon />
    </ListItemIcon>

    <ListItemText
      primary="Chat settings"
      primaryTypographyProps={{
        fontSize: "0.875rem",
        fontWeight: 600,
        color: "text.secondary",
        letterSpacing: "-0.01em",
      }}
    />
  </MenuItem>
</Menu>



      {/* {notification && (
        <div
          style={{
            position: 'fixed',
            display: 'flex',
            flexDirection: 'row',
            top: '20px',
            right: '20px',
            backgroundColor: '#444444ea',
            backdropFilter: 'blur(80px)',
            color: '#f0f0f0',
            padding: '10px 20px',
            borderRadius: '12px',
            width: '80vw',
            height: 'auto',
            mx: "auto",
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.06)',
            fontSize: '14px',
            zIndex: 1000,
          }}
        >
          <Avatar src={notification.photoURL} style={{marginRight: '20px'}}></Avatar><div><strong style={{color: '#fff', fontSize: '16px'}}>{notification.user}</strong> <br></br> {notification.message}</div>
        </div>
      )} */}

      <div>
        {/* Desktop & Mobile Chat Filter Tabs */}

        {activeTab === "calls" ? (
          callHistoryList.length === 0 ? (
            <Box sx={{ textAlign: "center", py: 8, opacity: 0.6 }}>
              <CallIcon sx={{ fontSize: 44, mb: 1, opacity: 0.3 }} />
              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                No call history yet
              </Typography>
              <Typography variant="caption" sx={{ display: "block", mt: 0.5, opacity: 0.7 }}>
                Start a voice or video call with any BunkMate!
              </Typography>
            </Box>
          ) : (
            callHistoryList.map((call) => {
              const isMissed = call.status === "missed";
              const isDeclined = call.status === "declined";
              const isIncomingDir = call.direction === "incoming";
              const isVid = call.callType === "video";
              const peerName = call.peerName || "User";

              return (
                <Box
                  key={call.id}
                  sx={{
                    padding: "14px 19px",
                    marginBottom: "0px",
                    borderRadius: "18px",
                    display: "flex",
                    alignItems: "center",
                    backgroundColor: mode === "dark" ? "rgba(255,255,255,0)" : "rgba(0,0,0,0)",
                    border: `0px solid ${mode === "dark" ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)"}`,
                    transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
                    "&:hover": {
                      backgroundColor: mode === "dark" ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
                      transform: "translateX(0px)",
                    },
                  }}
                >
                  <Avatar
                    src={call.peerAvatar || ""}
                    alt={peerName}
                    sx={{
                      width: 44,
                      height: 44,
                      borderRadius: "50%",
                      marginRight: 2,
                      boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                    }}
                  >
                    {peerName?.[0] || "U"}
                  </Avatar>

                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 700,
                        color: isMissed ? "#f44336" : mode === "dark" ? "#fff" : "#000",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {peerName}
                    </Typography>

                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 0.3 }}>
                      {isMissed ? (
                        <PhoneMissedIcon sx={{ fontSize: 14, color: "#f44336" }} />
                      ) : isDeclined ? (
                        <CallEndIcon sx={{ fontSize: 14, color: "#ff9800" }} />
                      ) : isIncomingDir ? (
                        <CallReceivedIcon sx={{ fontSize: 14, color: "#4caf50" }} />
                      ) : (
                        <CallMadeIcon sx={{ fontSize: 14, color: "#4caf50" }} />
                      )}

                      <Typography
                        variant="caption"
                        sx={{
                          color: isMissed ? "#f44336" : isDeclined ? "#ff9800" : "text.secondary",
                          fontWeight: isMissed || isDeclined ? 600 : 500,
                        }}
                      >
                        {isMissed
                          ? "Missed Call"
                          : isDeclined
                          ? "Declined Call"
                          : `${isIncomingDir ? "Incoming" : "Outgoing"} ${isVid ? "Video" : "Audio"}${
                              call.duration ? ` • ${Math.floor(call.duration / 60)}m ${call.duration % 60}s` : ""
                            }`}
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, ml: 1 }}>
                    <Typography variant="caption" sx={{ color: "text.secondary", fontSize: "0.7rem", mr: 0.5 }}>
                      {formatCallTimestamp(call.createdAt)}
                    </Typography>

                    <Tooltip title={`Call back (${isVid ? "Video" : "Audio"})`}>
                      <IconButton
                        size="medium"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleInitiateCall(
                            {
                              id: call.peerId,
                              uid: call.peerId,
                              name: peerName,
                              photoURL: call.peerAvatar,
                              username: call.peerHandle,
                            },
                            call.callType || "audio"
                          );
                        }}
                        sx={{
                          bgcolor: isMissed ? "#f4433611" : mode === "dark" ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)",
                          boxShadow: mode === "dark" ? 'inset 0 1px 1px rgba(255, 255, 255, 0.11), inset 0 -1px 1px rgba(0,0,0,0.4)' : 'inset 0 1px 1px rgba(255, 255, 255, 0.71), inset 0 -1px 1px rgba(0,0,0,0.1)',
                          color: isMissed ? "#ff1100b3" : mode === "dark" ? "#fff" : "#000",
                          "&:hover": {
                            bgcolor: isVid ? "rgba(255, 255, 255, 0.15)" : "rgba(0, 0, 0, 0.15)",
                          },
                        }}
                      >
                        {isVid ? <VideocamIcon sx={{ fontSize: 24 }} /> : <CallIcon sx={{ fontSize: 24 }} />}
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>
              );
            })
          )
        ) : loadingChats && combinedChats.length === 0 ? (
          <Box sx={{ px: 2 }}>
            <ChatListSkeleton count={7} isDark={mode === "dark"} />
          </Box>
        ) : filteredCombinedChats.length === 0 ? (
          <Box sx={{ textAlign: "center", py: 8, opacity: 0.65 }}>
            {activeTab === "favorites" ? (
              <>
                <StarRoundedIcon sx={{ fontSize: 44, mb: 1, opacity: 0.45, color: "#fbc02d" }} />
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  No starred chats yet
                </Typography>
                <Typography variant="caption" sx={{ display: "block", mt: 0.5, opacity: 0.8 }}>
                  Star chats from their profile or settings to find them quickly here.
                </Typography>
              </>
            ) : customChatLists.some((l) => l.id === activeTab) ? (
              <>
                <FolderSpecialIcon sx={{ fontSize: 44, mb: 1, opacity: 0.45, color: "#ab47bc" }} />
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  No chats in this list
                </Typography>
                <Typography variant="caption" sx={{ display: "block", mt: 0.5, opacity: 0.8 }}>
                  Click &ldquo;Manage chat lists&rdquo; from the menu to add chats to this folder.
                </Typography>
              </>
            ) : (
              <>
                <ChatBubbleOutlineIcon sx={{ fontSize: 44, mb: 1, opacity: 0.35 }} />
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  No chats found
                </Typography>
                <Typography variant="caption" sx={{ display: "block", mt: 0.5, opacity: 0.8 }}>
                  Start a new chat or search for friends!
                </Typography>
              </>
            )}
          </Box>
        ) : (
          filteredCombinedChats.map((chat) => (
          <Box
            key={chat.id}
            onTouchStart={(e) => handleChatTouchStart(e, chat)}
            onTouchMove={handleChatTouchMove}
            onTouchEnd={handleChatTouchEnd}
            onContextMenu={(e) => handleChatContextMenu(e, chat)}
            onClick={() => {
              if (isLongPressTriggeredRef.current) {
                isLongPressTriggeredRef.current = false;
                return;
              }
              if (onSelectChat) {
                onSelectChat({ type: chat.type, id: chat.id });
              }
              if (chat.type === 'group') {
                handleGroupClick(chat.id);
              } else {
                handleSelect(chat.id);
              }
            }}
            sx={{
              padding: '14px 19px',
              marginBottom: '0',
              borderRadius: 6,
              display: 'flex',
              alignItems: 'center',
              backgroundColor: selectedChatId === chat.id 
                ? (mode === "dark" ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)") 
                : (mode === "dark" ? "rgba(255,255,255,0)" : "rgba(0,0,0,0)"),
              border: selectedChatId === chat.id
                ? `0px solid transparent`
                : `0px solid transparent`,
              cursor: 'pointer',
              transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
              "&:hover": {
                backgroundColor: mode === "dark" ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
                transform: "translateX(0px)",
                "& .chat-quick-call-actions": {
                  opacity: 1,
                  pointerEvents: "auto",
                },
                "& .chat-more-dots": {
                  opacity: 1,
                },
              },
            }}
          >
            {chat.type === 'group' ? (
              <Avatar
                src={safeImageUrl(chat.iconURL)}
                onClick={(e) => handleAvatarClick(e, chat)}
                sx={{
                  bgcolor: theme.palette.primary.bg,
                  color: theme.palette.primary.main,
                  fontSize: 22,
                  fontWeight: 800,
                  width: { xs: 46, md: 54 },
                  height: { xs: 46, md: 54 },
                  marginRight: 2,
                  boxShadow: "none",
                }}
              >
                  {(!isValidImageUrl(chat.iconURL) && chat.iconURL) || chat.emoji || chat.name?.[0]?.toUpperCase() || 'G'}
              </Avatar>
            ) : (
              <Avatar
                src={chat.photoURL || 'https://via.placeholder.com/50'}
                alt={chat.name}
                onClick={(e) => handleAvatarClick(e, chat)}
                sx={{
                  width: { xs: 46, md: 54 },
                  height: { xs: 46, md: 54 },
                  borderRadius: '50%',
                  marginRight: 2,
                  boxShadow: "none",
                }}
              />
            )}

            <div
              onClick={() => {
                if (isLongPressTriggeredRef.current) {
                  isLongPressTriggeredRef.current = false;
                  return;
                }
                chat.type === 'user' ? handleSelect(chat.id) : handleGroupClick(chat.id);
              }}
              style={{ flex: 1, minWidth: 0, paddingRight: 8 }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <p style={{ margin: 0, fontWeight: chat.unreadCount > 0 ? 800 : 700, color: theme.palette.text.primary, fontSize: "0.95rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {chat.name}
                </p>
                {isChatPinned(chat.id) && (
                  <PushPinRoundedIcon sx={{ fontSize: 13, color: theme.palette.primary.main, transform: "rotate(45deg)", flexShrink: 0 }} />
                )}
                {isChatFavorite(chat.id) && (
                  <StarRoundedIcon sx={{ fontSize: 16, color: "#fbc02d", flexShrink: 0 }} />
                )}
                {isChatMuted(chat.id) && (
                  <NotificationsOffOutlinedIcon sx={{ fontSize: 13, color: "text.secondary", opacity: 0.7, flexShrink: 0 }} />
                )}
                {["BM - Beta members", "BM - Dev Beta"].includes(chat.name) && (
                  <span style={{
                    fontSize: 12,
                    backgroundColor: '#00f72133',
                    padding: '2px 6px',
                    borderRadius: 6,
                    color: '#00cc1bff',
                    fontWeight: 700,
                  }}>
                    {chat.name.includes("Dev") ? "🧪 Dev Beta" : "🔒 Beta"}
                  </span>
                )}
              </div>
              <p
                style={{
                  margin: 0,
                  marginTop: 4,
                  fontSize: "0.82rem",
                  color: chat.unreadCount > 0 ? theme.palette.text.primary : theme.palette.text.secondary,
                  fontWeight: chat.unreadCount > 0 ? 600 : 400,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  maxWidth: '100%',
                }}
              >
                {chat.lastMessage || 'No messages yet'}
              </p>
            </div>

            {/* Context menu 3-dots button */}
            <IconButton
              className="chat-more-dots"
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                setChatMenuAnchor({ mouseX: e.clientX, mouseY: e.clientY });
                setSelectedMenuChat(chat);
              }}
              sx={{
                color: "text.secondary",
                opacity: { xs: 0, md: 0 },
                transition: "opacity 0.2s ease",
                "&:hover": { color: "text.primary", opacity: { xs: 0, md: 1 } },
                p: 0.5,
                mr: 0.5,
                flexShrink: 0,
              }}
            >
              <MoreVertIcon sx={{ fontSize: 18 }} />
            </IconButton>

            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-end", flexShrink: 0, ml: 0.5 }}>
              <Typography variant="caption" sx={{ fontSize: '11px', color: chat.unreadCount > 0 ? theme.palette.primary.main : '#919191', fontWeight: chat.unreadCount > 0 ? 700 : 500 }}>
                {formatTimestamp(chat.timestamp)}
              </Typography>
              {chat.unreadCount > 0 && (
                <Box
                  sx={{
                    mt: 0.5,
                    px: 0.8,
                    py: 0.15,
                    borderRadius: "99px",
                    bgcolor: theme.palette.primary.main,
                    color: "#fff",
                    fontSize: "0.68rem",
                    fontWeight: 800,
                  }}
                >
                  {chat.unreadCount}
                </Box>
              )}
            </Box>
          </Box>
        ))
        )}

<Dialog
  fullScreen
  open={profilePicOpen}
  onClose={() => {
    setProfilePicOpen(false);
    setTimeout(() => setViewMode('avatar'), 300); // Reset view on close
  }}
  PaperProps={{
    sx: {
      backgroundColor: "rgba(0,0,0,0.05)",
      backgroundImage: "none",
      backdropFilter: "blur(12px)",
      overflow: "hidden",
    },
  }}
>
  <Box
    onClick={() => {
        setProfilePicOpen(false);
        setTimeout(() => setViewMode('avatar'), 300);
    }}
    sx={{
      position: "relative",
      height: "100%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "column",
      p: 3,
    }}
  >
    {/* Content Area: Switches between Avatar and QR Code */}
    <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
      {/* View 1: Profile Avatar */}
      <Zoom in={profilePicOpen && viewMode === 'avatar'}>
        <Box onClick={(e) => e.stopPropagation()} sx={{ position: "relative", display: "flex", flexDirection: "column", alignContent: 'center', justifyContent: 'center' }}>
          <Avatar
            src={safeImageUrl(selectedProfileData?.photoURL || selectedProfileData?.iconURL)}
            alt={selectedProfileData?.name}
              sx={{
                width: "min(370px, 90vw)",
                height: "min(370px, 90vw)",
                borderRadius: 10,
                backgroundColor: theme.palette.primary.bg,
                fontSize: "5rem",
                cursor: "default",
                boxShadow: "none",
                transition: "transform 0.4s ease, box-shadow 0.4s ease",
                "&:hover": {
                  transform: "scale(1.05)",
                  boxShadow: "none",
                },
              }}
          >
            {(!isValidImageUrl(selectedProfileData?.photoURL || selectedProfileData?.iconURL) && (selectedProfileData?.iconURL || selectedProfileData?.emoji)) || selectedProfileData?.name?.[0]?.toUpperCase()}
          </Avatar>
          <Typography sx={{ color: "white", fontSize: 18, fontWeight: "bolder", backgroundColor: mode === "dark" ? "#f1f1f111" : "#0c0c0c31", px: 2, py: 0.5, mt: 1, borderRadius: 4 }}>
            {selectedProfileData?.name}
          </Typography>
          
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 0.5,
          mt: 2,
          width: "250px",
        }}
      >
        {[{
          label: "Message",
          icon: <MessageOutlinedIcon />,
          onClick: () =>
            selectedProfileData?.type === "user"
              ? handleSelect(selectedProfileData?.id)
              : handleGroupClick(selectedProfileData?.id),
        },{
          label: "Profile Info",
          icon: <InfoOutlinedIcon />,
          onClick: handleOpenProfileDrawer,
        }].map(({ label, icon, onClick }, index) => (
          <Zoom key={label} in={profilePicOpen} style={{ transitionDelay: `${index * 200}ms` }}>
            <Button
              variant="contained"
              startIcon={icon}
              onClick={onClick}
              sx={{
                textTransform: "none",
                fontWeight: 500,
                bgcolor: mode === "dark" ? "#f1f1f111" : "#0c0c0c31",
                color: "white",
                boxShadow: "none",
                py: 1.5,
                borderRadius: index === 0 ? "16px 16px 6px 6px" : "6px 6px 16px 16px",
                justifyContent: "flex-start",
                "& .MuiButton-startIcon": { marginRight: 1.5 },
                "&:hover": {
                  bgcolor: mode === "dark" ? "#f1f1f121" : "#0c0c0c21",
                  color: "#fff",
                  boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
                  transform: "scale(1.03)",
                },
                transition: "all 0.3s ease",
              }}
            >
              {label}
            </Button>
          </Zoom>
        ))}
      </Box>

        </Box>
      </Zoom>
    </Box>    
  </Box>

  {/* Snackbar for feedback */}
  <Snackbar
    open={snackbar.open}
    autoHideDuration={3000}
    onClose={handleSnackbarClose}
    message={snackbar.message}
  />
</Dialog>

{!isEmbedded && (
  <Box>
    {/* Floating Add Button */}
    <IconButton
      onClick={() => setActiveTab('calls')}
      sx={{
        position: 'fixed',
        bottom: { xs: 90, sm: 96 },
        right: { xs: 30, sm: 28 },
        minWidth: '44px',
        width: '54px',
        height: '54px',
        backdropFilter: "blur(12px)",
        background: mode === "dark" ? "#e8e8e8" : "#272727",
        borderRadius: 8,
        fontSize: '28px',
        color: mode === "dark" ? "#000" : '#fff',
        boxShadow: mode === "dark" ? 'inset 0 1px 1px rgba(255, 255, 255, 0.11), inset 0 -1px 1px rgba(0,0,0,0.4)' : 'inset 0 1px 1px rgba(255, 255, 255, 0.71), inset 0 -1px 1px rgba(0,0,0,0.1)',
        zIndex: 1000,
        "&:hover": {
          background: theme.palette.primary.dark,
          transform: "scale(1.06)",
        },
        transition: "all 0.2s ease",
      }}
    >
      <CallIcon />
    </IconButton>
  </Box>
)}
      </div>
<SwipeableDrawer
  anchor="bottom"
  open={membDialogOpen}
  onClose={() => setMembDialogOpen(false)}
  onOpen={() => {}}
  disableSwipeToOpen={false}
  ModalProps={{ BackdropProps: { sx: drawerBackdropSx } }}
  PaperProps={{
    sx: {
      ...drawerPaperSx(mode, { maxHeight: "90vh" }),
      overflowY: "auto",
    },
  }}
>
  <Box sx={{ display: { xs: "block", md: "none" } }}>
    <DrawerHandle mode={mode} />
  </Box>
  <Box sx={{ maxWidth: 540, mx: "auto", width: "100%", boxSizing: "border-box", p: { xs: 2, md: 3 } }}>
    <Box display="flex" gap={1.5} alignItems="center" mb={2}>
      <IconButton onClick={() => setMembDialogOpen(false)} sx={{ bgcolor: mode === "dark" ? "#f1f1f111" : "#1F1F1F11" }}>
        <ArrowBackIcon sx={{ color: mode === "dark" ? "#fff" : "#000" }} />
      </IconButton>
      <Typography variant="h5" fontWeight="bold" color={theme.palette.text.primary}>
        New Contact
      </Typography>
    </Box>

        <TextField
          fullWidth
          placeholder="Search by username"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{
            input: { color: mode === "dark" ? "#fff" : "#000" },
            backgroundColor: mode === "dark" ? "#3131314d" : "#d0d0d0a0",
            borderRadius: 1,
            mb: 2,
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: mode === "dark" ? "#fff" : "#000" }} />
              </InputAdornment>
            ),
          }}
        />

        <Box sx={{ overflowY: "auto", flex: 1 }}>
{searchResults.map((user) => {
  const existingFriend = friends.includes(user.uid);

  const receivedRequest = friendRequests.find(
    (r) =>
      r.senderId === user.uid &&
      r.uid === currentUser.uid &&
      r.status === "pending"
  );

  return (
    <Box
      key={user.uid}
      onClick={() => {
        setSelectedUserProfile(user);
        setProfileDrawerOpen(true);
      }}
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        bgcolor: "#1a1a1a3a",
        borderRadius: 2,
        px: 2,
        py: 1.5,
        mb: 1,
      }}
    >
      <Box display="flex" alignItems="center">
        <Avatar src={user.photoURL} sx={{ width: 40, height: 40, mr: 2 }} />
        <Typography color="white">{user.username}</Typography>
      </Box>

      {existingFriend ? (
        <Chip label="Friend" color="success" size="small" />
      ) : receivedRequest && (
        <Stack direction="row" spacing={1}>
          <Button
            variant="contained"
            color="success"
            size="small"
            onClick={() => handleAcceptRequest(receivedRequest)}
          >
            Accept
          </Button>
          <Button
            variant="outlined"
            color="error"
            size="small"
            onClick={() => handleRejectRequest(receivedRequest)}
          >
            Reject
          </Button>
        </Stack>
      )}
    </Box>
  );
})}

        </Box>
  </Box>

<SwipeableDrawer
  anchor="bottom"
  open={profileDrawerOpen}
  onClose={() => setProfileDrawerOpen(false)}
  onOpen={() => {}}
  disableSwipeToOpen={false}
  ModalProps={{ BackdropProps: { sx: drawerBackdropSx } }}
  PaperProps={{
    sx: {
      ...drawerPaperSx(mode, { maxHeight: "92vh" }),
      overflowY: "auto",
      p: { xs: 2, md: 3 },
    },
  }}
>
  <Box sx={{ display: { xs: "block", md: "none" } }}>
    <DrawerHandle mode={mode} />
  </Box>
  <Box sx={{ maxWidth: 540, mx: "auto", width: "100%", boxSizing: "border-box" }}>
  {selectedUserProfile && (
    <ProfileDrawerContent
      user={selectedUserProfile}
      currentUser={currentUser}
      friends={friends}
      isCurrentUserFriend={isCurrentUserFriend}
      isRequestReceived={isRequestReceived}
      hasPendingRequest={hasPendingRequest}
      loadingRequestState={loadingRequestState}
      handleAcceptRequest={handleAcceptRequest}
      handleRejectRequest={handleRejectRequest}
      handleAddFriend={handleAddFriend}
      navigate={navigate}
      mode={mode}
      theme={theme}
    />
  )}
  </Box>
</SwipeableDrawer>

</SwipeableDrawer>

<SwipeableDrawer
  anchor="bottom"
  open={groupDialogOpen}
  onClose={() => setGroupDialogOpen(false)}
  onOpen={() => {}}
  disableSwipeToOpen={false}
  ModalProps={{ BackdropProps: { sx: drawerBackdropSx } }}
  PaperProps={{
    sx: {
      ...drawerPaperSx(mode, { maxHeight: "85vh" }),
      overflowY: "auto",
    },
  }}
>
  <Box sx={{ display: { xs: "block", md: "none" } }}>
    <DrawerHandle mode={mode} />
  </Box>
  <Box sx={{ maxWidth: 540, mx: "auto", width: "100%", boxSizing: "border-box", p: { xs: 2.5, md: 3 } }}>
  <Typography variant="h6" fontWeight="bold" mb={2}>
    Create New Group
  </Typography>

  <TextField
    label="Group Name"
    fullWidth
    value={groupName}
    onChange={(e) => setGroupName(e.target.value)}
    placeholder="Enter group name"
    sx={{ mb: 2 }}
  />

  <TextField
    label="Group Icon (Emoji or Image URL)"
    fullWidth
    value={groupIcon}
    onChange={(e) => setGroupIcon(e.target.value)}
    placeholder="e.g. 😊 or https://img.com/icon.png"
    sx={{ mb: 2 }}
  />

  <TextField
    label="Group Description"
    fullWidth
    multiline
    rows={2}
    value={groupDescription}
    onChange={(e) => setGroupDescription(e.target.value)}
    placeholder="What’s this group about?"
    sx={{ mb: 3 }}
  />

  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
    Members ({selectedFriends.length})
  </Typography>

  <Box
    sx={{
      maxHeight: 180,
      overflowY: "auto",
      mb: 3,
      pr: 1,
      display: "flex",
      flexDirection: "column",
      gap: 1,
    }}
  >
    {selectedFriends.map((friend) => (
      <Box
        key={friend.uid}
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 2,
          p: 1,
          bgcolor: mode === "dark" ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
          borderRadius: 2,
        }}
      >
        <Avatar src={friend.photoURL || ""} />
        <Box>
          <Typography>{friend.name || friend.username}</Typography>
          <Typography variant="caption" color="text.secondary">
            @{friend.username}
          </Typography>
        </Box>
      </Box>
    ))}
  </Box>

  <Button
    variant="contained"
    color="primary"
    fullWidth
    sx={{ py: 1.4, borderRadius: 2, fontWeight: "bold" }}
    onClick={handleCreateGroup}
    disabled={!groupName || selectedFriends.length === 0}
  >
    Create Group
  </Button>
  </Box>
</SwipeableDrawer>

<SwipeableDrawer
  anchor="bottom"
  open={addUserDialog}
  onClose={() => setAddUserDialog(false)}
  onOpen={() => {}}
  disableSwipeToOpen={false}
  ModalProps={{ BackdropProps: { sx: drawerBackdropSx } }}
  PaperProps={{
    sx: {
      ...drawerPaperSx(mode, { maxHeight: "90vh" }),
      overflowY: "auto",
    },
  }}
>
  <Box sx={{ display: { xs: "block", md: "none" } }}>
    <DrawerHandle mode={mode} />
  </Box>
  <Box sx={{ maxWidth: 540, mx: "auto", width: "100%", boxSizing: "border-box", p: { xs: 2, md: 3 } }}>
    {/* Header */}
    <Box display="flex" gap={1.5} alignItems="center" mb={2}>
      <IconButton onClick={() => setAddUserDialog(false)} sx={{ bgcolor: mode === "dark" ? "#f1f1f111" : "#1F1F1F11" }}>
        <ArrowBackIcon sx={{ color: mode === "dark" ? "#fff" : "#000" }} />
      </IconButton>
      <Typography variant="h5" fontWeight="bold" color={theme.palette.text.primary}>
        New Chat
      </Typography>
    </Box>

<Box mt={3}>
  <TextField
  fullWidth
  placeholder="Search friends by name or username"
  value={searchFriend}
  onChange={(e) => setSearchFriend(e.target.value)}
  sx={{
    mb: 2,
    input: { color: mode === "dark" ? "#fff" : "#000" },
    backgroundColor: mode === "dark" ? "#1010104d" : "#d0d0d0a0",
  }}
  InputProps={{
    startAdornment: (
      <InputAdornment position="start">
        <SearchIcon sx={{ color: "#777" }} />
      </InputAdornment>
    ),
  }}
/>

{!creatingGroup && (
  <Button
    variant="contained"
    fullWidth
    onClick={() => setCreatingGroup(true)}
    sx={{ 
      mb: 2,
      backgroundColor: "rgba(51, 51, 51, 0.0)",
      boxShadow: "none",
      display: "flex",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "left",
      gap: 2,
      color: mode === "dark" ? "#fff" : "#000"
    }}
  >
    <GroupAddIcon sx={{ p: 1.5, backgroundColor: theme.palette.primary.bg, borderRadius: 8, color: "#000000" }} />
    Create Group
  </Button>
)}

  <Button
    variant="contained"
    fullWidth
    onClick={() => 
      {setMembDialogOpen(true);
      setAddUserDialog(false);}
    }
    sx={{ 
      mb: 2,
      backgroundColor: "rgba(51, 51, 51, 0.0)",
      boxShadow: "none",
      display: "flex",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "left",
      gap: 2,
      color: mode === "dark" ? "#fff" : "#000"
    }}
  >
    <PersonAddIcon sx={{ p: 1.5, backgroundColor: theme.palette.primary.bg, borderRadius: 8, color: "#000000" }} />
    New Contact
  </Button>

  <Typography variant="subtitle1" color={mode === "dark" ? "#fff" : "#000"} gutterBottom>
    Your Friends
  </Typography>

{filteredFriends.map((friend) => {
  const isSelected = selectedGroupMembers.some((u) => u.uid === friend.uid);

  return (
    <Box
      key={friend.uid}
      onClick={() => {
        if (!creatingGroup) return;

        setSelectedGroupMembers((prev) =>
          isSelected
            ? prev.filter((u) => u.uid !== friend.uid)
            : [...prev, friend]
        );
      }}
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 2,
        px: 2,
        py: 1,
        mb: 1,
        borderRadius: 5,
        backgroundColor: isSelected ? theme.palette.primary.select : "#24242401",
        color: isSelected ? "#000" : "#fff",
        cursor: creatingGroup ? "pointer" : "default",
      }}
    >
      <Avatar src={friend.photoURL} />
      <Box>
        <Typography color={theme.palette.text.primary} fontWeight={500}>
          {friend.name || friend.username}
        </Typography>
        <Typography color="text.secondary" variant="caption">
          @{friend.username}
        </Typography>
      </Box>
      {creatingGroup && isSelected && (
        <CheckCircleIcon sx={{ ml: "auto", color: theme.palette.primary.main }} />
      )}
    </Box>
  );
})}

</Box>

{creatingGroup && (
  <Box sx={{ mt: 2, display: "flex", flexDirection: "row", gap: 1 }}>
    <Button
    fullWidth
      variant="outlined"
      onClick={() => {
        setCreatingGroup(false);
        setSelectedGroupMembers([]); // Optional: clear selected
      }}
      sx={{
        py: 1,
        borderRadius: 8,
        backgroundColor: "#ff000005",
        color: "#ffa3a3",
        borderColor: "#ffa3a3",
      }}
    >
      Cancel
    </Button>

    <Button
      fullWidth
      variant="contained"
      disabled={selectedGroupMembers.length === 0}
      onClick={() => {
        setSelectedFriends([...selectedGroupMembers]);
        setGroupDialogOpen(true);
        setAddUserDialog(false);
      }}
      sx={{
        py: 1.5,
        borderRadius: 8,
        bgcolor: theme.palette.primary.bg,
        color: "#000",
        fontWeight: "bold",
        boxShadow: "none",
      }}
    >
      Continue
    </Button>
  </Box>
)}

  </Box>
</SwipeableDrawer>

<Snackbar
  open={snackbar.open}
  autoHideDuration={3000}
  onClose={handleCloseSnackbar}
  anchorOrigin={{ vertical: "top", horizontal: "center" }}
>
  <MuiAlert
    elevation={6}
    variant="filled"
    onClose={handleCloseSnackbar}
    severity={snackbar.severity}
    sx={{ width: "100%" }}
  >
    {snackbar.message}
  </MuiAlert>
</Snackbar>

{/* Broadcast Message Drawer */}
<SwipeableDrawer
  anchor="bottom"
  open={broadcastDialogOpen}
  onClose={() => !isBroadcasting && setBroadcastDialogOpen(false)}
  onOpen={() => {}}
  disableSwipeToOpen={false}
  ModalProps={{ BackdropProps: { sx: drawerBackdropSx } }}
  PaperProps={{
    sx: {
      ...drawerPaperSx(mode, { maxHeight: "85vh" }),
      overflowY: "auto",
    },
  }}
>
  <Box sx={{ display: { xs: "block", md: "none" } }}>
    <DrawerHandle mode={mode} />
  </Box>
  <Box sx={{ maxWidth: 540, mx: "auto", width: "100%", boxSizing: "border-box", pt: { xs: 1, md: 2 } }}>
    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, pb: 1, px: 2 }}>
      <Box
        sx={{
          width: 40,
          height: 40,
          borderRadius: "12px",
          bgcolor: "rgba(41, 182, 246, 0.15)",
          color: "#29b6f6",
          display: "grid",
          placeItems: "center",
        }}
      >
        <CampaignIcon />
      </Box>
      <Box sx={{ flex: 1 }}>
        <Typography variant="h6" fontWeight={800} fontSize="1.1rem">
          Broadcast Message
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Send a direct message to multiple contacts simultaneously
        </Typography>
      </Box>
      <IconButton
        size="small"
        disabled={isBroadcasting}
        onClick={() => setBroadcastDialogOpen(false)}
      >
        <CloseRoundedIcon fontSize="small" />
      </IconButton>
    </Box>

    <Box sx={{ px: 2, py: 1.5, borderTop: `1px solid ${mode === "dark" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}`, borderBottom: `1px solid ${mode === "dark" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)}"}` }}>
      <Box sx={{ display: "flex", gap: 1, mb: 1.5, alignItems: "center" }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Filter friends..."
          value={broadcastSearchTerm}
          onChange={(e) => setBroadcastSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ fontSize: 18, color: "text.secondary" }} />
              </InputAdornment>
            ),
            sx: {
              borderRadius: "12px",
              bgcolor: mode === "dark" ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)",
              fontSize: "0.85rem",
            },
          }}
        />
        <Button
          size="small"
          onClick={() => {
            const avail = directChatUsers
              .filter((u) => {
                const q = broadcastSearchTerm.toLowerCase();
                return !q || (u.name || "").toLowerCase().includes(q) || (u.username || "").toLowerCase().includes(q);
              })
              .map((u) => u.id);
            const allSelected = avail.length > 0 && avail.every((id) => selectedBroadcastRecipients.includes(id));
            if (allSelected) {
              setSelectedBroadcastRecipients((prev) => prev.filter((id) => !avail.includes(id)));
            } else {
              setSelectedBroadcastRecipients((prev) => Array.from(new Set([...prev, ...avail])));
            }
          }}
          sx={{
            whiteSpace: "nowrap",
            borderRadius: "10px",
            textTransform: "none",
            fontWeight: 700,
            fontSize: "0.78rem",
          }}
        >
          Toggle All
        </Button>
      </Box>

      <Typography variant="caption" sx={{ fontWeight: 700, color: "text.secondary", mb: 0.5, display: "block" }}>
        Recipients ({selectedBroadcastRecipients.length} selected):
      </Typography>

      <Box
        sx={{
          maxHeight: 180,
          overflowY: "auto",
          mb: 2,
          borderRadius: "12px",
          border: `1px solid ${mode === "dark" ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}`,
          p: 0.5,
        }}
      >
        {directChatUsers
          .filter((u) => {
            const q = broadcastSearchTerm.toLowerCase();
            return !q || (u.name || "").toLowerCase().includes(q) || (u.username || "").toLowerCase().includes(q);
          })
          .map((u) => {
            const isSelected = selectedBroadcastRecipients.includes(u.id);
            return (
              <Box
                key={u.id}
                onClick={() => {
                  setSelectedBroadcastRecipients((prev) =>
                    isSelected ? prev.filter((id) => id !== u.id) : [...prev, u.id]
                  );
                }}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                  p: 0.8,
                  borderRadius: "10px",
                  cursor: "pointer",
                  bgcolor: isSelected
                    ? mode === "dark"
                      ? "rgba(41,182,246,0.12)"
                      : "rgba(41,182,246,0.08)"
                    : "transparent",
                  "&:hover": {
                    bgcolor: mode === "dark" ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
                  },
                }}
              >
                <Checkbox checked={isSelected} size="small" sx={{ p: 0.5 }} />
                <Avatar src={u.photoURL} sx={{ width: 32, height: 32 }}>
                  {(u.name || "U")[0]}
                </Avatar>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="body2" fontWeight={600} noWrap>
                    {nicknames[u.id] || u.name || u.username}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" noWrap>
                    @{u.username || "user"}
                  </Typography>
                </Box>
              </Box>
            );
          })}
      </Box>

      <TextField
        fullWidth
        multiline
        minRows={3}
        maxRows={6}
        placeholder="Type your broadcast message here..."
        value={broadcastText}
        onChange={(e) => setBroadcastText(e.target.value)}
        InputProps={{
          sx: {
            borderRadius: "14px",
            bgcolor: mode === "dark" ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
            fontSize: "0.9rem",
          },
        }}
      />
    </Box>

    <Box sx={{ p: 2, display: "flex", justifyContent: "flex-end", gap: 1 }}>
      <Button
        disabled={isBroadcasting}
        onClick={() => setBroadcastDialogOpen(false)}
        sx={{ borderRadius: "10px", textTransform: "none", color: "text.secondary" }}
      >
        Cancel
      </Button>
      <Button
        variant="contained"
        disabled={!broadcastText.trim() || selectedBroadcastRecipients.length === 0 || isBroadcasting}
        onClick={handleSendBroadcast}
        startIcon={isBroadcasting ? <CircularProgress size={16} color="inherit" /> : <CampaignIcon />}
        sx={{
          borderRadius: "12px",
          textTransform: "none",
          fontWeight: 700,
          px: 2.5,
          bgcolor: "#29b6f6",
          color: "#fff",
          "&:hover": { bgcolor: "#0288d1" },
        }}
      >
        {isBroadcasting
          ? "Sending..."
          : `Send to ${selectedBroadcastRecipients.length} contact${selectedBroadcastRecipients.length !== 1 ? "s" : ""}`}
      </Button>
    </Box>
  </Box>
</SwipeableDrawer>

{/* Create Custom Chat List Drawer */}
<SwipeableDrawer
  anchor="bottom"
  open={createListDialogOpen}
  onClose={() => setCreateListDialogOpen(false)}
  onOpen={() => {}}
  disableSwipeToOpen={false}
  ModalProps={{ BackdropProps: { sx: drawerBackdropSx } }}
  PaperProps={{
    sx: {
      ...drawerPaperSx(mode, { maxHeight: "85vh" }),
      overflowY: "auto",
    },
  }}
>
  <Box sx={{ display: { xs: "block", md: "none" } }}>
    <DrawerHandle mode={mode} />
  </Box>
  <Box sx={{ maxWidth: 540, mx: "auto", width: "100%", boxSizing: "border-box", pt: { xs: 1, md: 2 } }}>
    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, pb: 1, px: 2 }}>
      <Box
        sx={{
          width: 40,
          height: 40,
          borderRadius: "12px",
          bgcolor: "rgba(171, 71, 188, 0.15)",
          color: "#ab47bc",
          display: "grid",
          placeItems: "center",
        }}
      >
        <PlaylistAddIcon />
      </Box>
      <Box sx={{ flex: 1 }}>
        <Typography variant="h6" fontWeight={800} fontSize="1.1rem">
          New Chat List
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Create a custom folder to organize direct chats and groups
        </Typography>
      </Box>
      <IconButton size="small" onClick={() => setCreateListDialogOpen(false)}>
        <CloseRoundedIcon fontSize="small" />
      </IconButton>
    </Box>

    <Box sx={{ px: 2, py: 1.5, borderTop: `1px solid ${mode === "dark" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}`, borderBottom: `1px solid ${mode === "dark" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)}"}` }}>
      <TextField
        fullWidth
        autoFocus
        label="List Name"
        placeholder="e.g., Work, College, Close Friends, Family"
        value={newListName}
        onChange={(e) => setNewListName(e.target.value)}
        sx={{
          mb: 2,
          mt: 1,
          "& .MuiOutlinedInput-root": {
            borderRadius: "12px",
            bgcolor: mode === "dark" ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
          },
        }}
      />

      <Box sx={{ display: "flex", gap: 1, mb: 1.5, alignItems: "center" }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Search chats to include..."
          value={listSearchTerm}
          onChange={(e) => setListSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ fontSize: 18, color: "text.secondary" }} />
              </InputAdornment>
            ),
            sx: {
              borderRadius: "12px",
              bgcolor: mode === "dark" ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)",
              fontSize: "0.85rem",
            },
          }}
        />
      </Box>

      <Typography variant="caption" sx={{ fontWeight: 700, color: "text.secondary", mb: 0.5, display: "block" }}>
        Included Chats ({selectedListChats.length} selected):
      </Typography>

      <Box
        sx={{
          maxHeight: 220,
          overflowY: "auto",
          borderRadius: "12px",
          border: `1px solid ${mode === "dark" ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}`,
          p: 0.5,
        }}
      >
        {combinedChats
          .filter((c) => {
            const q = listSearchTerm.toLowerCase();
            return !q || (c.name || "").toLowerCase().includes(q) || (c.username || "").toLowerCase().includes(q);
          })
          .map((c) => {
            const isSelected = selectedListChats.includes(c.id);
            return (
              <Box
                key={c.id}
                onClick={() => {
                  setSelectedListChats((prev) =>
                    isSelected ? prev.filter((id) => id !== c.id) : [...prev, c.id]
                  );
                }}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                  p: 0.8,
                  borderRadius: "10px",
                  cursor: "pointer",
                  bgcolor: isSelected
                    ? mode === "dark"
                      ? "rgba(171,71,188,0.12)"
                      : "rgba(171,71,188,0.08)"
                    : "transparent",
                  "&:hover": {
                    bgcolor: mode === "dark" ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
                  },
                }}
              >
                <Checkbox checked={isSelected} size="small" sx={{ p: 0.5 }} />
                {c.type === "group" ? (
                  <Avatar
                    src={safeImageUrl(c.iconURL)}
                    sx={{
                      width: 32,
                      height: 32,
                      bgcolor: theme.palette.primary.bg,
                      color: theme.palette.primary.main,
                      fontSize: 14,
                      fontWeight: 800,
                    }}
                  >
                    {(!isValidImageUrl(c.iconURL) && c.iconURL) || c.emoji || c.name?.[0]?.toUpperCase() || "G"}
                  </Avatar>
                ) : (
                  <Avatar src={c.photoURL} sx={{ width: 32, height: 32 }}>
                    {(c.name || "U")[0]}
                  </Avatar>
                )}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="body2" fontWeight={600} noWrap>
                    {c.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" noWrap>
                    {c.type === "group" ? "Group" : `@${c.username || "user"}`}
                  </Typography>
                </Box>
                <Chip
                  size="small"
                  label={c.type === "group" ? "Group" : "Direct"}
                  sx={{ height: 20, fontSize: "0.65rem", fontWeight: 700 }}
                />
              </Box>
            );
          })}
      </Box>
    </Box>

    <Box sx={{ p: 2, display: "flex", justifyContent: "flex-end", gap: 1 }}>
      <Button
        onClick={() => setCreateListDialogOpen(false)}
        sx={{ borderRadius: "10px", textTransform: "none", color: "text.secondary" }}
      >
        Cancel
      </Button>
      <Button
        variant="contained"
        disabled={!newListName.trim()}
        onClick={handleCreateCustomList}
        sx={{
          borderRadius: "12px",
          textTransform: "none",
          fontWeight: 700,
          px: 2.5,
          bgcolor: "#ab47bc",
          color: "#fff",
          "&:hover": { bgcolor: "#8e24aa" },
        }}
      >
        Create List
      </Button>
    </Box>
  </Box>
</SwipeableDrawer>

{/* Manage Custom Chat Lists Drawer */}
<SwipeableDrawer
  anchor="bottom"
  open={manageListsDialogOpen}
  onClose={() => setManageListsDialogOpen(false)}
  onOpen={() => {}}
  disableSwipeToOpen={false}
  ModalProps={{ BackdropProps: { sx: drawerBackdropSx } }}
  PaperProps={{
    sx: {
      ...drawerPaperSx(mode, { maxHeight: "85vh" }),
      overflowY: "auto",
    },
  }}
>
  <Box sx={{ display: { xs: "block", md: "none" } }}>
    <DrawerHandle mode={mode} />
  </Box>
  <Box sx={{ maxWidth: 540, mx: "auto", width: "100%", boxSizing: "border-box", pt: { xs: 1, md: 2 } }}>
    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, pb: 1, px: 2 }}>
      <Box
        sx={{
          width: 40,
          height: 40,
          borderRadius: "12px",
          bgcolor: "rgba(171, 71, 188, 0.15)",
          color: "#ab47bc",
          display: "grid",
          placeItems: "center",
        }}
      >
        <FolderSpecialIcon />
      </Box>
      <Box sx={{ flex: 1 }}>
        <Typography variant="h6" fontWeight={800} fontSize="1.1rem">
          Custom Chat Lists
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Organize conversations into custom tab folders
        </Typography>
      </Box>
      <IconButton size="small" onClick={() => setManageListsDialogOpen(false)}>
        <CloseRoundedIcon fontSize="small" />
      </IconButton>
    </Box>

    <Box sx={{ px: 2, py: 1.5, borderTop: `1px solid ${mode === "dark" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}`, borderBottom: `1px solid ${mode === "dark" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)}"}` }}>
      {customChatLists.length === 0 ? (
        <Box sx={{ textAlign: "center", py: 5, opacity: 0.7 }}>
          <FolderSpecialIcon sx={{ fontSize: 44, mb: 1, opacity: 0.4, color: "#ab47bc" }} />
          <Typography variant="body2" fontWeight={600}>
            No custom chat lists yet
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
            Create lists like &ldquo;Work&rdquo;, &ldquo;Family&rdquo;, or &ldquo;Projects&rdquo; to quickly filter chats.
          </Typography>
        </Box>
      ) : (
        <Stack spacing={1}>
          {customChatLists.map((list) => (
            <Box
              key={list.id}
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                p: 1.5,
                borderRadius: "14px",
                bgcolor: mode === "dark" ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
                border: `1px solid ${mode === "dark" ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}`,
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                <FolderSpecialIcon sx={{ color: "#ab47bc", fontSize: 24 }} />
                <Box>
                  <Typography variant="body2" fontWeight={700}>
                    {list.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {(list.chatIds || []).length} chat{list.chatIds?.length !== 1 ? "s" : ""} included
                  </Typography>
                </Box>
              </Box>
              <Tooltip title="Delete list">
                <IconButton
                  size="small"
                  onClick={() => handleDeleteCustomList(list.id)}
                  sx={{
                    color: "#f44336",
                    bgcolor: "rgba(244,67,54,0.08)",
                    "&:hover": { bgcolor: "rgba(244,67,54,0.18)" },
                  }}
                >
                  <DeleteOutlineIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          ))}
        </Stack>
      )}
    </Box>

    <Box sx={{ p: 2, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <Button
        onClick={() => setManageListsDialogOpen(false)}
        sx={{ borderRadius: "10px", textTransform: "none", color: "text.secondary" }}
      >
        Close
      </Button>
      <Button
        variant="contained"
        onClick={() => {
          setManageListsDialogOpen(false);
          setNewListName("");
          setSelectedListChats([]);
          setListSearchTerm("");
          setCreateListDialogOpen(true);
        }}
        startIcon={<AddIcon />}
        sx={{
          borderRadius: "12px",
          textTransform: "none",
          fontWeight: 700,
          px: 2.2,
          bgcolor: "#ab47bc",
          color: "#fff",
          "&:hover": { bgcolor: "#8e24aa" },
        }}
      >
        New Chat List
      </Button>
    </Box>
  </Box>
</SwipeableDrawer>

{renderChatActionMenuAndDialogs()}

<Divider sx={{ mt: 4, mx: 4 }} />
<Box
  sx={{
    mt: 2,
    mb: 6,
    pb: 4,
    alignContent: "center",
    alignItems: "center",
    textAlign: "center",
    opacity: 0.5,
    fontSize: "0.75rem",
    userSelect: "none",
  }}
>
  <Typography variant="caption" color="text.secondary">
    Your Messages are end-to-end encrypted
  </Typography>
</Box>
          </Box>
        </BetaAccessGuard>
        {/* </DeviceGuard> */}
    </ThemeProvider>
  );
}

export default Chats;


const ProfileDrawerContent = ({
  user,
  currentUser,
  isCurrentUserFriend,
  isRequestReceived,
  hasPendingRequest,
  loadingRequestState,
  handleAcceptRequest,
  handleRejectRequest,
  handleAddFriend,
  navigate,
  mode,
  theme,
}) => {
  const [mutualTrips, setMutualTrips] = useState([]);
  const [mutualGroups, setMutualGroups] = useState([]);
  const [mutualFriends, setMutualFriends] = useState([]);

  const [miniOpen, setMiniOpen] = useState(false);
  const [miniPerson, setMiniPerson] = useState(null);

  useBackButtonClose(miniOpen, () => setMiniOpen(false));

const isSelf = currentUser?.uid === user?.uid;

// Determine whether the profile should be visible
const isPrivate = user.privacy?.profileVisibility === "private";

// Show private overlay only if profile is private AND current user is NOT a friend or self
const showPrivateOverlay = isPrivate && !isCurrentUserFriend && !isSelf;


  // 🔁 Fetch mutual data (skip when viewing self)
  useEffect(() => {
    if (!currentUser || !user?.uid || isSelf) return;

    (async () => {
      try {
        // Trips (shared)
        const tripsSnap = await getDocs(
          query(collection(db, "trips"), where("members", "array-contains", currentUser.uid))
        );
        const tripsData = tripsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setMutualTrips(tripsData.filter((t) => t.members?.includes(user.uid)));

        // Groups (shared)
        const groupsSnap = await getDocs(
          query(collection(db, "groupChats"), where("members", "array-contains", currentUser.uid))
        );
        const groupsData = groupsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setMutualGroups(groupsData.filter((g) => g.members?.includes(user.uid)));

        // Friends (mutual)
        const usersSnap = await getDocs(collection(db, "users"));
        const allUsers = usersSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
        const currentFriends = allUsers.find((u) => u.uid === currentUser.uid)?.friends || [];
        const targetFriends  = allUsers.find((u) => u.uid === user.uid)?.friends || [];
        const mutuals = allUsers.filter(
          (u) => currentFriends.includes(u.uid) && targetFriends.includes(u.uid)
        );
        setMutualFriends(mutuals);
      } catch (err) {
        console.error("Error fetching mutual data:", err);
      }
    })();
  }, [currentUser, user, isSelf]);

  // handlers for quick-view mini overlay
  const openMiniFor = (person) => {
    setMiniPerson(person);
    setMiniOpen(true);
  };
  const closeMini = () => setMiniOpen(false);

  const handleMiniMessage = () => {
    if (!miniPerson?.uid) return;
    navigate(`/chat/${miniPerson.uid}`);
    closeMini();
  };
  const handleMiniViewProfile = () => {
    if (!miniPerson?.uid) return;
    navigate(`/profile/${miniPerson.uid}`);
    closeMini();
  };

  // top/bottom message actions
  const goMessage = () => navigate(`/chat/${user.uid}`);

  return (
    <Box sx={{ position: "relative" }}>
      {/* Header */}
      <Stack alignItems="center" spacing={1.25} sx={{ mb: 2.25 }}>
        <Avatar
          src={user.photoURL}
          sx={{ 
            width: 120,
            height: 120,
            mb: 1,
            boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
            border: `3px solid ${
              user.privacy?.profileVisibility === "private"
                ? "#ffb74d"
                : theme.palette.primary.main
            }`,
          }}
        >
          {user.displayName?.[0] || user.name?.[0] || "U"}
        </Avatar>

        <Typography
          variant="h5"
          fontWeight={800}
          sx={{
            textAlign: "center",
            letterSpacing: 0.2,
            background:
              mode === "dark"
                ? "linear-gradient(90deg,#fff,#cfcfcf)"
                : "linear-gradient(90deg,#101010,#6a6a6a)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          {isSelf ? "You" : user.displayName || user.name || "User"}
        </Typography>

        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          @{user.username || "unknown_user"}
        </Typography>

        <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
          {isSelf && <Chip label="This is You" color="info" size="small" />}
          {isCurrentUserFriend && !isSelf && (
            <Chip label="Friend" color="success" size="small" />
          )}
          <Chip
            label={
              (user.privacy?.profileVisibility || "Public")
                .replace(/^\w/, (c) => c.toUpperCase())
            }
            color={user.privacy?.profileVisibility === "private" ? "warning" : "info"}
            size="small"
          />
        </Stack>

        {/* compact header "Send Message" if friend */}
        {isCurrentUserFriend && !isSelf && (
          <Button
            onClick={goMessage}
            startIcon={<ChatBubbleOutlineIcon />}
            variant="contained"
            sx={{
              mt: 1,
              borderRadius: 8,
              px: 2.25,
              py: 1,
              boxShadow: "none",
            }}
          >
            Send Message
          </Button>
        )}
      </Stack>

      {/* Bio */}
      {user.bio && !showPrivateOverlay && (
        <Box
          sx={{
            textAlign: "center",
            px: 2.5,
            mb: 2.5,
            py: 1.5,
            borderRadius: 4,
            bgcolor: mode === "dark" ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)",
            fontStyle: "italic",
          }}
        >
          “{user.bio}”
        </Box>
      )}

      {/* Private Blur Overlay */}
      {showPrivateOverlay && (
        <Box
          sx={{
            inset: 0,
            background:
              "linear-gradient(180deg, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.85) 100%)",
            backdropFilter: "blur(6px)",
            zIndex: 2,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            px: 3,
            textAlign: "center",
          }}
        >
          <Box>
            <Typography variant="h6" fontWeight={800} sx={{ color: "#fff", mb: 0.75 }}>
              🔒 Private Profile
            </Typography>
            <Typography variant="body2" sx={{ color: "#eaeaea" }}>
              Send a friend request to view full details about this user.
            </Typography>
          </Box>
        </Box>
      )}

      {/* About / Info Section (shows for self or friends even if private) */}
      {!showPrivateOverlay && (
        <Paper
          elevation={0}
          sx={{
            p: 2.5,
            mb: 2.25,
            borderRadius: 5,
            background: mode === "dark" ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
          }}
        >
          <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
            About
          </Typography>
          <Stack spacing={1.1}>
            <InfoRow label="Email" value={user.email || "Hidden"} />
            <InfoRow
              label="Joined"
              value={
                user.createdAt
                  ? new Date(
                      user.createdAt.seconds ? user.createdAt.seconds * 1000 : user.createdAt
                    ).toLocaleDateString()
                  : "Unknown"
              }
            />
            {user.location && <InfoRow label="Location" value={user.location} />}
            {user.occupation && <InfoRow label="Occupation" value={user.occupation} />}
            {Array.isArray(user.hobbies) && user.hobbies.length > 0 && (
              <InfoRow label="Hobbies" value={user.hobbies.join(", ")} />
            )}
            {user.gender && <InfoRow label="Gender" value={user.gender} />}
            {user.dateOfBirth && <InfoRow label="DOB" value={user.dateOfBirth} />}
          </Stack>
        </Paper>
      )}

      {/* Mutuals (only when not self and not blocked by privacy) */}
      {!isSelf && !showPrivateOverlay && (
        <Paper
          elevation={0}
          sx={{
            p: 2.5,
            borderRadius: 5,
            background: mode === "dark" ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
          }}
        >
          <Typography variant="h6" fontWeight={700} sx={{ mb: 1.5 }}>
            Mutual Info
          </Typography>

          {mutualFriends.length === 0 && mutualTrips.length === 0 && mutualGroups.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No mutual connections yet.
            </Typography>
          ) : (
            <Stack spacing={2}>
              {mutualFriends.length > 0 && (
                <MutualSection
                  title={`Mutual Friends (${mutualFriends.length})`}
                  items={mutualFriends}
                  onItemClick={(p) => openMiniFor(p)}
                  showMessageBadge
                />
              )}
              {mutualTrips.length > 0 && (
                <MutualSection title={`Shared Trips (${mutualTrips.length})`} items={mutualTrips} />
              )}
              {mutualGroups.length > 0 && (
                <MutualSection
                  title={`Common Groups (${mutualGroups.length})`}
                  items={mutualGroups}
                />
              )}
            </Stack>
          )}
        </Paper>
      )}

      {/* Bottom Actions */}
      {!isSelf && (
        <Stack direction="row" spacing={2} sx={{ mt: 2.5 }}>
          {isCurrentUserFriend ? (
            <Button
              variant="contained"
              onClick={goMessage}
              startIcon={<MessageOutlinedIcon />}
              fullWidth
              sx={{ borderRadius: 10, py: 1.25 }}
            >
              Message
            </Button>
          ) : isRequestReceived ? (
            <>
              <Button
                variant="contained"
                color="success"
                onClick={handleAcceptRequest}
                fullWidth
                sx={{ borderRadius: 10, py: 1.25 }}
              >
                Accept
              </Button>
              <Button
                variant="outlined"
                color="error"
                onClick={handleRejectRequest}
                fullWidth
                sx={{ borderRadius: 10, py: 1.25 }}
              >
                Reject
              </Button>
            </>
          ) : hasPendingRequest ? (
            <Button variant="outlined" color="warning" disabled fullWidth sx={{ borderRadius: 10, py: 1.25 }}>
              Requested
            </Button>
          ) : (
            <Button
              variant="contained"
              startIcon={<PersonAddIcon />}
              onClick={() => handleAddFriend(user)}
              disabled={loadingRequestState}
              fullWidth
              sx={{ borderRadius: 10, py: 1.25 }}
            >
              {user.privacy?.profileVisibility === "private" ? "Send Friend Request" : "Add Friend"}
            </Button>
          )}
        </Stack>
      )}

      {/* Floating mini-profile quick view (Instagram-style) */}
      <MiniProfileOverlay
        open={miniOpen}
        onClose={closeMini}
        person={miniPerson}
        onMessage={handleMiniMessage}
        onViewProfile={handleMiniViewProfile}
        mode={mode}
        theme={theme}
      />
    </Box>
  );
};

// 🧩 Reusable Components
// small reusable info row
const InfoRow = ({ label, value }) => (
  <Stack direction="row" justifyContent="space-between">
    <Typography color="text.secondary">{label}</Typography>
    <Typography fontWeight={600}>{value}</Typography>
  </Stack>
);

// Mutuals with message badge indicator (for friends)
const MutualSection = ({ title, items, onItemClick, showMessageBadge = false }) => (
  <Box>
    <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
      {title}
    </Typography>
    <Stack direction="row" spacing={1.25} flexWrap="wrap">
      {items.slice(0, 8).map((item) => (
        <Box
          key={item.id || item.uid}
          onClick={() => onItemClick && onItemClick(item)}
          sx={{
            position: "relative",
            cursor: onItemClick ? "pointer" : "default",
            "&:hover": { transform: onItemClick ? "translateY(-2px)" : "none" },
            transition: "transform .15s ease",
          }}
        >
          <Avatar
            src={safeImageUrl(item.photoURL || item.iconURL)}
            sx={{ width: 40, height: 40, boxShadow: "0 0 8px rgba(0,0,0,0.2)" }}
          >
            {(!isValidImageUrl(item.photoURL || item.iconURL) && (item.iconURL || item.name?.[0])) || ""}
          </Avatar>
          {showMessageBadge && (
            <Box
              sx={{
                position: "absolute",
                right: -2,
                bottom: -2,
                width: 18,
                height: 18,
                borderRadius: "50%",
                bgcolor: "primary.main",
                display: "grid",
                placeItems: "center",
                boxShadow: "0 0 0 2px rgba(0,0,0,0.2)",
              }}
            >
              <MessageOutlinedIcon sx={{ fontSize: 12, color: "#000" }} />
            </Box>
          )}
        </Box>
      ))}
      {items.length > 8 && (
        <Chip label={`+${items.length - 8}`} size="small" sx={{ ml: 0.5 }} />
      )}
    </Stack>
  </Box>
);

// Instagram-style floating mini profile overlay
const MiniProfileOverlay = ({ open, onClose, person, onMessage, onViewProfile, mode, theme }) => {
  if (!open || !person) return null;

  return (
    <>
      {/* dim background */}
      <Box
        onClick={onClose}
        sx={{
          position: "fixed",
          inset: 0,
          bgcolor: "rgba(0,0,0,0.35)",
          zIndex: 9999,
        }}
      />
      {/* floating card */}
      <Box
        sx={{
          position: "fixed",
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -50%)",
          width: 320,
          maxWidth: "90vw",
          borderRadius: 16,
          zIndex: 10000,
          background: mode === "dark" ? "rgba(20,20,20,0.82)" : "rgba(255,255,255,0.9)",
          backdropFilter: "blur(18px)",
          boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
          overflow: "hidden",
        }}
      >
        <Stack direction="row" alignItems="center" sx={{ p: 2 }}>
          <Avatar src={person.photoURL} sx={{ width: 56, height: 56, mr: 1.5 }}>
            {(person.displayName || person.name || "U")[0]}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="subtitle1" fontWeight={700} noWrap>
              {person.displayName || person.name || "User"}
            </Typography>
            <Typography variant="body2" color="text.secondary" noWrap>
              @{person.username || "unknown_user"}
            </Typography>
          </Box>
          <IconButton onClick={onClose} size="small">
            <CloseRoundedIcon />
          </IconButton>
        </Stack>

        {person.bio && (
          <Typography
            variant="body2"
            sx={{
              px: 2,
              pb: 1.5,
              color: "text.secondary",
              maxHeight: 72,
              overflow: "hidden",
            }}
          >
            “{person.bio}”
          </Typography>
        )}

        <Stack direction="row" spacing={1.25} sx={{ px: 2, pb: 2 }}>
          <Button
            fullWidth
            startIcon={<MessageOutlinedIcon />}
            onClick={onMessage}
            variant="contained"
            sx={{ borderRadius: 8, py: 1 }}
          >
            Message
          </Button>
          <Button
            fullWidth
            startIcon={<OpenInNewIcon />}
            onClick={onViewProfile}
            variant="outlined"
            sx={{ borderRadius: 8, py: 1 }}
          >
            View Profile
          </Button>
        </Stack>
      </Box>
    </>
  );
};
