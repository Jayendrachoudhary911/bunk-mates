// src/components/DevBeta/GroupChats.js
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, AppBar, Avatar, Paper, Typography, IconButton, TextField, Button, Fab,
  List, ListItem, ListItemButton, ListItemText, Menu, MenuItem, Dialog, DialogTitle,
  DialogContent, DialogActions, SwipeableDrawer, Collapse, Divider, Tooltip, Chip, useTheme,
  CircularProgress, Checkbox, Stack
} from '@mui/material';
import {
  Send as SendIcon, ArrowDownward as ArrowDownwardIcon, Close as CloseIcon,
  Edit as EditIcon, DeleteOutline as DeleteOutlineIcon, CameraAltOutlined as CameraAltOutlinedIcon,
  Check as CheckIcon, DoneAll as DoneAllIcon, Add as AddIcon, Remove as RemoveIcon, ArrowBack as ArrowBackIcon,
  MoreVert as MoreVertIcon, Reply as ReplyIcon, ContentCopy as ContentCopyIcon, Search as SearchIcon
} from '@mui/icons-material';
import { FastAverageColor } from 'fast-average-color';
import EmojiPicker from 'emoji-picker-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import Popover from '@mui/material/Popover';
import { styled } from '@mui/system';

// Firebase imports
import { auth, db } from '../../firebase';
import {
  collection, doc, getDoc, addDoc, updateDoc, arrayUnion, arrayRemove,
  onSnapshot, serverTimestamp, query, orderBy, deleteDoc, deleteField, getDocs
} from 'firebase/firestore';

// Contexts/Theme
import { useThemeToggle } from "../../contexts/ThemeToggleContext";
import { getTheme } from "../../theme";
import GroupInfoDrawer from "../GroupChat/GroupInfoDrawer";
import PollIcon from '@mui/icons-material/Poll';

// ---------------- UTILITIES ----------------

const URL_REGEX = /(https?:\/\/[^\s]+)/g;

const extractUrl = (text) => {
  if (typeof text !== "string") return null;
  const matches = text.match(URL_REGEX);
  return matches ? matches[0] : null;
};

const isSingleEmoji = (text) => {
  return typeof text === "string" &&
    text.trim().length > 0 &&
    /^(\p{Emoji_Presentation}|\p{Emoji}\uFE0F)$/u.test(text.trim());
};

const getMessageShape = (messages, index, currentUserId) => {
  const msg = messages[index];
  const prevMsg = messages[index - 1];
  const nextMsg = messages[index + 1];

  const isOwn = msg.senderId === currentUserId;

  const within1Min = (a, b) =>
    a?.timestamp?.seconds != null &&
    b?.timestamp?.seconds != null &&
    Math.abs(a.timestamp.seconds - b.timestamp.seconds) < 60;

  const samePrev =
    prevMsg && prevMsg.senderId === msg.senderId && within1Min(msg, prevMsg);
  const sameNext =
    nextMsg && nextMsg.senderId === msg.senderId && within1Min(msg, nextMsg);

  const radius = 20;
  const flat = 4;

  const getCorner = (isEdge, isGrouped) => isEdge ? (isGrouped ? flat : radius) : radius;

  const shape = {
    borderTopLeftRadius: getCorner(!isOwn, samePrev),
    borderTopRightRadius: getCorner(isOwn, samePrev),
    borderBottomLeftRadius: getCorner(!isOwn, sameNext),
    borderBottomRightRadius: getCorner(isOwn, sameNext),
  };

  return shape;
};

const groupMessagesByDate = (messages) => {
  return messages.reduce((groups, message) => {
    const timestamp = message.timestamp?.seconds
      ? new Date(message.timestamp.seconds * 1000)
      : new Date();
    const dateString = timestamp.toLocaleDateString();

    if (!groups[dateString]) {
      groups[dateString] = [];
    }
    groups[dateString].push(message);

    return groups;
  }, {});
};

// helper used in parent handlers when currentTarget not available
function bubbleRefForParent(messageId) {
  const el = document.getElementById(`message-${messageId}`);
  return el || null;
}

// ---------------- MAIN COMPONENT ----------------

function GroupChat() {
  const { groupName } = useParams();
  const navigate = useNavigate();
  const { mode, accent } = useThemeToggle();
  const theme = useMemo(() => getTheme(mode, accent), [mode, accent]);
  const currentUserId = auth.currentUser?.uid;

  // State
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState('');
  const [loading, setLoading] = useState(true);
  const [groupInfo, setGroupInfo] = useState({});
  const [memberUsers, setMemberUsers] = useState([]);
  const [memberInfo, setMemberInfo] = useState({});
  const [allUsers, setAllUsers] = useState({});
  const [createdByUser, setCreatedByUser] = useState(null);
  const [typingMembers, setTypingMembers] = useState([]);
  const [replyTo, setReplyTo] = useState(null);
  const [editingMsg, setEditingMsg] = useState(null);
  const [editText, setEditText] = useState('');
  const [notification, setNotification] = useState(null);
  const [imageDataUri, setImageDataUri] = useState('');
  const [imageDrawer, setImageDrawer] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedMsg, setSelectedMsg] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [reactionAnchorEl, setReactionAnchorEl] = useState(null);
  const [reactionMsg, setReactionMsg] = useState(null);
  const [showGoToBottom, setShowGoToBottom] = useState(false);
  const [highlightedMsgId, setHighlightedMsgId] = useState(null);
  const [mentionDrawerOpen, setMentionDrawerOpen] = useState(false);
  const [mentionSelected, setMentionSelected] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  // Trip/Structured Content State
  const [tripInfo, setTripInfo] = useState(null);
  const [timelineStats, setTimelineStats] = useState(null);
  const [checklist, setChecklist] = useState([]);
  const [timeline, setTimeline] = useState([]);
  const [pollDialogOpen, setPollDialogOpen] = useState(false);
  const [messagePreviews, setMessagePreviews] = useState({});

  // Refs
  const bottomRef = useRef(null);
  const containerRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const messageRefs = useRef({});
  const [profileOpen, setProfileOpen] = useState(false);

  // Full-screen image viewer state
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [imageViewerSrc, setImageViewerSrc] = useState(null);
  const [imageViewerZoom, setImageViewerZoom] = useState(1);

  // animation trigger: parent-controlled, passed into MessageBubble as prop
  const [recentReaction, setRecentReaction] = useState(null); // { messageId, emoji }

  // Theme/Wallpaper Logic
  const [effectiveChatTheme, setEffectiveChatTheme] = useState('dark');
  const [headerTextColor, setHeaderTextColor] = useState(mode === "dark" ? "#fff" : "#000");

  const [groupedMessages, indexById] = useMemo(() => {
    const grouped = groupMessagesByDate(messages);
    const indexMap = messages.reduce((acc, msg, index) => { acc[msg.id] = index; return acc; }, {});
    return [grouped, indexMap];
  }, [messages]);

  const getWallpaperUrl = useCallback(() => {
    const selectedWallpaper = localStorage.getItem('bunkmate_chatWallpaper') || 'default';
    if (selectedWallpaper === 'none') return 'none';
    if (selectedWallpaper === 'default') return effectiveChatTheme === 'dark' ? 'url(/assets/images/chatbg/dark.png)' : 'url(/assets/images/chatbg/light.png)';
    return `url(${selectedWallpaper})`;
  }, [effectiveChatTheme]);

  useEffect(() => {
    const fac = new FastAverageColor();
    const wallpaperUrl = getWallpaperUrl().replace(/^url\(["']?/, "").replace(/["']?\)$/, "");
    if (!wallpaperUrl || wallpaperUrl === "none") {
      setHeaderTextColor(effectiveChatTheme === "dark" ? "#fff" : "#000");
      return;
    }
    fac.getColorAsync(wallpaperUrl)
      .then((color) => setHeaderTextColor(color.isLight ? "#000" : "#fff"))
      .catch(() => setHeaderTextColor(effectiveChatTheme === "dark" ? "#fff" : "#000"));
  }, [getWallpaperUrl, effectiveChatTheme]);

  useEffect(() => { /* ... load and listen for theme settings ... */ }, [mode]);

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const handleScroll = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
    setShowGoToBottom(distanceFromBottom > 10);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  // Firebase Listeners
  const fetchUsers = useCallback(async () => {
    const snapshot = await getDocs(collection(db, "users"));
    const usersMap = {};
    snapshot.forEach(docSnap => {
      usersMap[docSnap.id] = docSnap.data();
    });
    setAllUsers(usersMap);
  }, []);
  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  useEffect(() => {
    if (!groupName) return;

    const groupDocRef = doc(db, "groupChats", groupName);

    const unsubscribeGroup = onSnapshot(groupDocRef, async (docSnap) => {
      if (!docSnap.exists()) {
        setLoading(false);
        return;
      }
      const data = docSnap.data();
      setGroupInfo(data);

      const memberIds = data.members || [];
      const memberDetails = {};
      const userPromises = memberIds.map(uid => getDoc(doc(db, 'users', uid)));
      const userSnaps = await Promise.all(userPromises);
      userSnaps.forEach(userSnap => {
        if (userSnap.exists()) {
          memberDetails[userSnap.id] = { uid: userSnap.id, ...userSnap.data() };
        }
      });
      setMemberInfo(memberDetails);
      setMemberUsers(Object.values(memberDetails));

      const drafts = data.drafts || {};
      const typingNames = Object.entries(drafts)
        .filter(([uid, text]) => uid !== currentUserId && text)
        .map(([uid]) => memberDetails[uid]?.name || "Someone");
      setTypingMembers(typingNames);

      if (data.createdBy) {
        const createdBySnap = await getDoc(doc(db, "users", data.createdBy));
        setCreatedByUser(createdBySnap.exists() ? createdBySnap.data() : null);
      }
    });

    const messagesColRef = collection(db, 'groupChats', groupName, 'messages');
    const q = query(messagesColRef, orderBy('timestamp', 'asc'));

    const unsubscribeMessages = onSnapshot(q, (snapshot) => {
      const newMessages = snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data(),
        timestamp: docSnap.data().timestamp ? docSnap.data().timestamp : { seconds: Math.floor(Date.now() / 1000) },
      }));
      setMessages(newMessages);
      setLoading(false);
    });

    return () => { unsubscribeGroup(); unsubscribeMessages(); };
  }, [groupName, currentUserId]);

  // Trip Listeners
  useEffect(() => {
    if (!groupInfo?.tripId) {
      setTripInfo(null); setChecklist([]); setTimeline([]); setTimelineStats(null); return;
    }
    const tripId = groupInfo.tripId;
    getDoc(doc(db, "trips", tripId)).then(snap => snap.exists() && setTripInfo({ id: snap.id, ...snap.data() }));

    const unsubChecklist = onSnapshot(collection(db, "trips", tripId, "checklist"), (snap) => {
      setChecklist(snap.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() })));
    });

    const unsubTimeline = onSnapshot(collection(db, "trips", tripId, "timeline"), (snap) => {
      const events = snap.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
      setTimeline(events);
      const total = events.length || 1;
      const completed = events.filter(e => e.completed === true).length;
      setTimelineStats({ completed, total, percent: Math.round((completed / total) * 100) });
    });

    return () => { unsubChecklist(); unsubTimeline(); };
  }, [groupInfo?.tripId]);

  // Link Preview Fetch
  useEffect(() => {
    const fetchPreviews = async () => {
      const previewsToFetch = messages.filter(msg =>
        msg.type !== 'image' && msg.type !== 'poll' && extractUrl(msg.text) && !messagePreviews[msg.id]
      );
      if (previewsToFetch.length === 0) return;

      const newPreviews = {};
      await Promise.all(
        previewsToFetch.map(async (msg) => {
          const url = extractUrl(msg.text);
          try {
            const res = await axios.get(`https://api.linkpreview.net/?key=3db616e201708f056ee4d32ddab9839a&q=${encodeURIComponent(url)}`);
            newPreviews[msg.id] = res.data;
          } catch {
            newPreviews[msg.id] = null;
          }
        })
      );
      setMessagePreviews(prev => ({ ...prev, ...newPreviews }));
    };
    fetchPreviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages]);

  // Core Handlers
  const senderInfo = useMemo(() => memberInfo[currentUserId] || {}, [memberInfo, currentUserId]);
  const isAdmin = groupInfo?.createdBy === currentUserId || (groupInfo?.admins || []).includes(currentUserId);
  const canSend = groupInfo?.sendAccess === 'all' || isAdmin;

  const updateDraft = useCallback((text) => {
    if (!groupName || !currentUserId) return;
    const groupDocRef = doc(db, "groupChats", groupName);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    updateDoc(groupDocRef, { [`drafts.${currentUserId}`]: text });
    typingTimeoutRef.current = setTimeout(() => {
      updateDoc(groupDocRef, { [`drafts.${currentUserId}`]: "" });
    }, 2000);
  }, [groupName, currentUserId]);

  const sendMessage = useCallback(async (text, type = 'text', additionalFields = {}) => {
    if (!currentUserId || !groupName || !canSend) return;

    try {
      const messagesColRef = collection(db, 'groupChats', groupName, 'messages');

      const messageData = {
        text,
        senderId: currentUserId,
        senderName: senderInfo.name || auth.currentUser.displayName || 'Unknown User',
        photoURL: senderInfo.photoURL || auth.currentUser.photoURL,
        timestamp: serverTimestamp(),
        status: 'sent',
        read: false,
        ...(replyTo && { replyTo: { id: replyTo.id, senderName: replyTo.senderName, text: replyTo.text } }),
        ...(type !== 'text' && { type }),
        ...additionalFields,
      };

      await addDoc(messagesColRef, messageData);
      setReplyTo(null);
      updateDraft('');
    } catch (e) {
      console.error("Error sending message: ", e);
    }
  }, [currentUserId, groupName, canSend, replyTo, senderInfo, updateDraft]);

  const updateMessage = useCallback(async (messageId, newText) => {
    if (!currentUserId || !groupName) return;

    try {
      const messageDocRef = doc(db, 'groupChats', groupName, 'messages', messageId);
      await updateDoc(messageDocRef, {
        text: newText,
        edited: true,
        timestamp: serverTimestamp(),
      });
      setEditingMsg(null);
      setEditText('');
      updateDraft('');
    } catch (e) {
      console.error("Error updating message: ", e);
    }
  }, [groupName, updateDraft, currentUserId]);

  const deleteMessage = useCallback(async (messageId) => {
    if (!currentUserId || !groupName) return;
    try {
      await deleteDoc(doc(db, 'groupChats', groupName, 'messages', messageId));
    } catch (e) {
      console.error("Error deleting message: ", e);
    }
  }, [groupName, currentUserId]);

  const handleAction = (message, action) => {
    if (action === 'reply') {
      setReplyTo(message);
    } else if (action === 'edit') {
      setEditingMsg(message);
      setEditText(message.text);
    } else if (action === 'delete') {
      deleteMessage(message.id);
    }
    setAnchorEl(null);
  };

  // Updated handleReaction: writes Firestore then triggers recentReaction animation
  const handleReaction = useCallback(async (messageId, emoji) => {
    if (!currentUserId || !groupName) return;
    const messageRef = doc(db, 'groupChats', groupName, 'messages', messageId);
    const message = messages.find(m => m.id === messageId);
    const currentReaction = message?.reactions?.[currentUserId];

    const updatePayload = currentReaction === emoji
      ? { [`reactions.${currentUserId}`]: deleteField() }
      : { [`reactions.${currentUserId}`]: emoji };

    try {
      await updateDoc(messageRef, updatePayload);

      // trigger animation on success
      setRecentReaction({ messageId, emoji });
      window.setTimeout(() => setRecentReaction(null), 900);
    } catch (err) {
      console.error("Reaction failed:", err);
    }
  }, [currentUserId, groupName, messages]);

  const handleShowReactionPicker = (message, anchorElement) => {
    setReactionMsg(message);
    setReactionAnchorEl(anchorElement);
  };

  const handleCloseReactionPicker = () => {
    setReactionAnchorEl(null);
    setReactionMsg(null);
  };

  const handleEmojiSelect = (emoji) => {
    if (reactionMsg) {
      handleReaction(reactionMsg.id, emoji);
    }
    handleCloseReactionPicker();
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setImageDataUri(reader.result);
      setImageDrawer(true);
      e.target.value = null;
    };
    reader.readAsDataURL(file);
  };

  const handleSendImage = async () => {
    if (!imageDataUri) return;
    await sendMessage('', 'image', { dataUri: imageDataUri });
    setImageDrawer(false);
    setImageDataUri('');
  };

  const handlePollVote = useCallback(async (messageId, optionIndex) => {
    if (!currentUserId || !groupName) return;
    const messageRef = doc(db, 'groupChats', groupName, 'messages', messageId);
    const message = messages.find(m => m.id === messageId);
    const options = message?.options || [];
    const hasVoted = options.some(option => (option.votes || []).includes(currentUserId));
    if (hasVoted) return;
    await updateDoc(messageRef, {
      [`options.${optionIndex}.votes`]: arrayUnion(currentUserId),
    });
  }, [currentUserId, groupName, messages]);

  const handleToggleChecklistItem = useCallback(async (itemId, checked) => {
    if (!groupInfo?.tripId || !currentUserId) return;
    const itemRef = doc(db, "trips", groupInfo.tripId, "checklist", itemId);
    await updateDoc(itemRef, {
      checkedBy: checked
        ? arrayUnion(currentUserId)
        : arrayRemove(currentUserId),
    });
  }, [groupInfo, currentUserId]);

  const fetchTripTimeline = useCallback(async () => {
    if (!groupInfo?.tripId) return [];
    const timelineSnap = await getDocs(collection(db, "trips", groupInfo.tripId, "timeline"));
    return timelineSnap.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() })).filter(Boolean);
  }, [groupInfo]);

  const fetchTripChecklist = useCallback(async () => {
    if (!groupInfo?.tripId) return [];
    const checklistSnap = await getDocs(collection(db, "trips", groupInfo.tripId, "checklist"));
    return checklistSnap.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() })).filter(Boolean);
  }, [groupInfo]);

  const sendStructuredMessage = useCallback(async (label, items) => {
    if (!groupName || !currentUserId || !items?.length) {
      setNotification(`No ${label.toLowerCase()} items found`);
      return;
    }

    let listText = "";
    if (label.toLowerCase() === "timeline") {
      listText = items.map((item) => {
        let dateObj;
        if (item.timestamp?.seconds) dateObj = new Date(item.timestamp.seconds * 1000);
        else if (item.datetime || item.time) dateObj = new Date(item.datetime || `${item.date || ""} ${item.time || ""}`.trim());
        else dateObj = null;

        let formattedDateTime = "";
        if (dateObj && !isNaN(dateObj.getTime())) formattedDateTime = dateObj.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
        else if (item.time) formattedDateTime = item.time;
        else formattedDateTime = "—";

        const title = item.title || item.text || "Untitled event";
        const completed = item.completed ? "✅" : "🕒";
        return `${completed} [${formattedDateTime}] ${title}`;
      }).join('\n');
    } else if (label.toLowerCase() === "checklist") {
      listText = items.map((item) => {
        const completed = item.completed ? "✅" : "⬜";
        const text = item.text || item.name || "Untitled task";
        return `${completed} ${text}`;
      }).join('\n');
    }

    const messageObject = {
      text: `${listText}`,
      senderId: currentUserId,
      senderName: senderInfo.name || "Anonymous",
      photoURL: senderInfo.photoURL || null,
      timestamp: serverTimestamp(),
      status: 'sent',
      read: false,
      type: label.toLowerCase(),
    };

    try {
      await addDoc(collection(db, "groupChats", groupName, "messages"), messageObject);
      setNotification(`✅ ${label} shared successfully`);
    } catch (err) {
      setNotification(`❌ Could not share ${label}`);
    }
  }, [groupName, currentUserId, senderInfo]);

  // Mentions logic
  const handleMentionSelect = (username) => {
    let text = editingMsg ? editText : newMsg;
    const lastAt = text.lastIndexOf('@');
    if (lastAt !== -1) {
      const newText = text.substring(0, lastAt) + `@${username} `;
      if (editingMsg) setEditText(newText);
      else setNewMsg(newText);
    }
    setMentionSelected(true);
    setMentionDrawerOpen(false);
  };

  useEffect(() => {
    const text = editingMsg ? editText : newMsg;
    const atIndex = text.lastIndexOf('@');
    if (atIndex > -1 && (atIndex === text.length - 1 || text[text.length - 2] === '@') && !mentionSelected) {
      setMentionDrawerOpen(true);
    } else if (atIndex === -1) {
      setMentionDrawerOpen(false);
      setMentionSelected(false);
    }
  }, [newMsg, editText, editingMsg, mentionSelected]);

  const scrollToMessage = useCallback((messageId) => {
    const element = messageRefs.current[messageId];
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
      setHighlightedMsgId(messageId);
      setTimeout(() => setHighlightedMsgId(null), 1200);
    }
  }, []);

  // image viewer helpers
  const openImageViewer = useCallback((src) => {
    setImageViewerSrc(src);
    setImageViewerZoom(1);
    setImageViewerOpen(true);
  }, []);

  const closeImageViewer = useCallback(() => {
    setImageViewerOpen(false);
    setImageViewerSrc(null);
    setImageViewerZoom(1);
  }, []);

  if (loading) return <div>Loading...</div>;

  // --- RENDER ---

  return (
    <Box sx={{
      backgroundImage: getWallpaperUrl() === 'none' ? effectiveChatTheme === 'dark' ? 'none' : 'none' : getWallpaperUrl(),
      backgroundColor: getWallpaperUrl() === 'none' ? (effectiveChatTheme === "dark" ? '#0c0c0c' : '#f0f2f5') : 'transparent',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      color: effectiveChatTheme === "dark" ? "#fff" : "#000"
    }}>

      <AppBar position="fixed" elevation={0} sx={{ /* ... styles for AppBar ... */ }}>
        <Box display={"flex"} alignItems={"center"}>
          <IconButton onClick={() => navigate(-1)} sx={{ mr: 1, color: headerTextColor }}><ArrowBackIcon /></IconButton>
          <Box onClick={() => setProfileOpen(true)} sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer', flexGrow: 1 }}>
            <Avatar src={groupInfo.iconURL || ""} sx={{ bgcolor: effectiveChatTheme === "dark" ? "#aaa" : "#333", color: headerTextColor, width: 40, height: 40, marginRight: 2 }}>{(groupInfo.iconURL || groupInfo.emoji || groupInfo.name?.[0]?.toUpperCase() || 'G')}</Avatar>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold', fontSize: "14px", color: headerTextColor }}>{groupInfo.name || groupName}</Typography>
              <Typography variant="caption" sx={{ color: headerTextColor, mt: 0.1 }} noWrap>
                {typingMembers.length > 0 ? `${typingMembers.join(', ')} is typing...` : `${memberUsers.length || 0} Members`}
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={(e) => setShowMoreMenu(e.currentTarget)} sx={{ color: headerTextColor }}><MoreVertIcon /></IconButton>
        </Box>
      </AppBar>

      <Box ref={containerRef} sx={{ flex: 1, px: 1.3, pt: '80px', pb: '120px', overflowY: 'auto', WebkitOverflowScrolling: 'touch', mt: 2 }}>
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>

          <Paper elevation={1} sx={{ p: 3, mx: 'auto', my: 2, textAlign: 'center', maxWidth: '80%', backdropFilter: 'blur(10px)', bgcolor: effectiveChatTheme === "dark" ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.4)', borderRadius: 4 }}>
            <Avatar src={groupInfo.iconURL || ""} sx={{ mx: 'auto', width: 68, height: 68, mb: 2 }}>{(groupInfo.iconURL || groupInfo.emoji || groupInfo.name?.[0]?.toUpperCase() || 'G')}</Avatar>
            <Typography variant="h6" fontWeight="bold">{groupInfo.name || groupName}</Typography>
            <Typography variant="caption" sx={{ whiteSpace: 'pre-wrap', mt: 0.5 }}>{groupInfo.description || ""}</Typography>
            <Typography variant="caption" sx={{ display: 'block', mt: 1 }}>{groupInfo.members?.length || 0} Members</Typography>
          </Paper>

          {Object.entries(groupedMessages).map(([date, dayMessages]) => (
            <React.Fragment key={date}>
              <Box sx={{ display: "flex", justifyContent: "center", my: 2 }}>
                <Chip label={date} size="small" sx={{ bgcolor: effectiveChatTheme === "dark" ? "rgba(0, 0, 0, 0.21)" : "rgba(255, 255, 255, 0.28)", backdropFilter: "blur(10px)", fontWeight: 600 }} />
              </Box>

              {dayMessages.map((msg, index) => {
                const flatIndex = indexById[msg.id];
                const shape = flatIndex != null ? getMessageShape(messages, flatIndex, currentUserId) : {};
                const isMe = msg.senderId === currentUserId;
                const sender = memberInfo[msg.senderId] || {};

                return (
                  <MessageBubble
                    key={msg.id}
                    message={msg}
                    isMe={isMe}
                    sender={sender}
                    shape={shape}
                    onAction={handleAction}
                    scrollToMessage={scrollToMessage}
                    highlightedMsgId={highlightedMsgId}
                    messageRefs={messageRefs}
                    effectiveChatTheme={effectiveChatTheme}
                    memberInfo={memberInfo}
                    currentUserId={currentUserId}
                    messages={messages}
                    memberUsers={memberUsers}
                    theme={theme}
                    onVote={handlePollVote}
                    onToggleChecklistItem={handleToggleChecklistItem}
                    checklist={checklist}
                    timeline={timeline}
                    messagePreviews={messagePreviews}
                    // parent handlers:
                    onReactionClick={(e) => { setSelectedMsg(msg); setAnchorEl(e.currentTarget || bubbleRefForParent(msg.id)); }}
                    onReactionChipClick={(e) => { setReactionMsg(msg); setReactionAnchorEl(e.currentTarget || bubbleRefForParent(msg.id)); setShowEmojiPicker(false); }}
                    onDoubleTap={() => handleReaction(msg.id, '❤️')}
                    recentReaction={recentReaction}
                    onOpenImage={(src) => openImageViewer(src)}
                  />
                );
              })}
            </React.Fragment>
          ))}

          {typingMembers.length > 0 && (
            <TypingIndicator
              typingMembers={typingMembers}
              memberInfo={memberInfo}
              effectiveChatTheme={effectiveChatTheme}
            />
          )}

          <div ref={bottomRef} />
        </Box>
      </Box>

      {showGoToBottom && (
        <Fab color="primary" size="small" onClick={scrollToBottom} sx={{ position: 'fixed', bottom: 130, right: 24, zIndex: 1500, backgroundColor: theme.palette.primary.main, color: theme.palette.getContrastText(theme.palette.primary.main) }}>
          <ArrowDownwardIcon />
        </Fab>
      )}

      <Box sx={{
        position: "fixed", bottom: "0", left: "50%", transform: "translateX(-50%)", width: "95%",
        borderRadius: "30px 30px 0 0", background: effectiveChatTheme === "dark" ? "#00000013" : "#ffffff39",
        backdropFilter: "blur(30px)", WebkitBackdropFilter: "blur(30px)",
        px: 1.2, py: 1.2, boxShadow: "none", zIndex: 1200
      }}>
        {canSend ? (
          <Composer
            text={editingMsg ? editText : newMsg}
            setText={editingMsg ? setEditText : setNewMsg}
            isEditing={!!editingMsg}
            editMessage={editingMsg}
            onCancelEdit={() => { setEditingMsg(null); setEditText(''); }}
            onUpdateMessage={updateMessage}
            onTyping={updateDraft}
            sendMessage={() => sendMessage(newMsg.trim())}
            replyTo={replyTo}
            onCancelReply={() => setReplyTo(null)}
            onImageUpload={handleImageUpload}
            onOpenPollDialog={() => setPollDialogOpen(true)}
            memberUsers={memberUsers}
            effectiveChatTheme={effectiveChatTheme}
            onToggleMoreMenu={() => setShowMoreMenu(prev => !prev)}
            isMoreMenuOpen={showMoreMenu}
            fetchTripTimeline={fetchTripTimeline}
            fetchTripChecklist={fetchTripChecklist}
            sendStructuredMessage={sendStructuredMessage}
            mentionDrawerOpen={mentionDrawerOpen}
            handleMentionSelect={handleMentionSelect}
          />
        ) : (
          <Typography variant="body2" sx={{ color: headerTextColor, fontStyle: 'italic', p: 1, textAlign: 'center' }}>
            🔒 Only Admins can send messages in this group.
          </Typography>
        )}
      </Box>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        PaperProps={{ sx: { minWidth: 220, borderRadius: 4, bgcolor: effectiveChatTheme === "dark" ? '#1c1c1c' : '#ffffff', p: 1 } }}
      >
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, p: 1 }}>
          {["❤️", "😂", "👍", "😁", "👌"].map((emoji) => (
            <IconButton key={emoji} onClick={() => { handleReaction(selectedMsg.id, emoji); setAnchorEl(null); }} sx={{ width: 38, height: 38, fontSize: 24 }}>{emoji}</IconButton>
          ))}
          <IconButton onClick={() => { handleShowReactionPicker(selectedMsg, anchorEl); setAnchorEl(null); }}><AddIcon /></IconButton>
        </Box>
        <MenuItem onClick={() => handleAction(selectedMsg, 'reply')}><ReplyIcon fontSize="small" sx={{ mr: 1 }} />Reply</MenuItem>
        {selectedMsg?.senderId === currentUserId && <MenuItem onClick={() => handleAction(selectedMsg, 'edit')}><EditIcon fontSize="small" sx={{ mr: 1 }} />Edit</MenuItem>}
        {selectedMsg?.senderId === currentUserId && <MenuItem onClick={() => handleAction(selectedMsg, 'delete')} sx={{ color: '#ff4444' }}><DeleteOutlineIcon fontSize="small" sx={{ mr: 1 }} />Delete</MenuItem>}
        <MenuItem onClick={() => { navigator.clipboard.writeText(selectedMsg?.text || ""); setNotification("Message copied!"); setAnchorEl(null); }}><ContentCopyIcon fontSize="small" sx={{ mr: 1 }} />Copy Text</MenuItem>
      </Menu>

      <ReactionDrawer
        reactionAnchorEl={reactionAnchorEl}
        reactionMsg={reactionMsg}
        memberInfo={memberInfo}
        allUsers={allUsers}
        currentUser={auth.currentUser}
        effectiveChatTheme={effectiveChatTheme}
        handleReaction={handleReaction}
        onClose={handleCloseReactionPicker}
        setShowEmojiPicker={setShowEmojiPicker}
      />

      <Popover
        open={showEmojiPicker}
        anchorEl={reactionAnchorEl}
        onClose={() => setShowEmojiPicker(false)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
        transformOrigin={{ vertical: "bottom", horizontal: "center" }}
        PaperProps={{ sx: { bgcolor: effectiveChatTheme === "dark" ? "#222" : "#fff", borderRadius: 3, boxShadow: "0 4px 24px #000a", p: 0 } }}
      >
        <EmojiPicker
          onEmojiClick={(emojiData) => handleEmojiSelect(emojiData.emoji)}
          theme={effectiveChatTheme === "dark" ? "dark" : "light"}
        />
      </Popover>

      <Dialog open={imageDrawer} onClose={() => setImageDrawer(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Send Image</DialogTitle>
        <DialogContent>
          {imageDataUri && <Box component="img" src={imageDataUri} alt="Preview" sx={{ width: '100%', height: 'auto', borderRadius: 1 }} />}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setImageDrawer(false); setImageDataUri(''); }}>Cancel</Button>
          <Button onClick={handleSendImage} variant="contained" color="primary">Send</Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={imageViewerOpen}
        onClose={closeImageViewer}
        fullScreen
        PaperProps={{
          sx: {
            backgroundColor: "rgba(0,0,0,0.92)",
            backdropFilter: "blur(20px)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }
        }}
      >
        <Box
          sx={{
            width: "100%",
            height: "100%",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            overflow: "hidden",
            position: "relative",
            p: 2
          }}
        >
          {/* Close button */}
          <IconButton
            onClick={closeImageViewer}
            sx={{
              position: "absolute",
              top: 16,
              right: 16,
              color: "#fff",
              backgroundColor: "rgba(0,0,0,0.4)"
            }}
          >
            <CloseIcon />
          </IconButton>

          {/* Zoomable image */}
          <Box
            component="img"
            src={imageViewerSrc}
            alt="Preview"
            onClick={(e) => {
              // toggle zoom between 1 and 2
              setImageViewerZoom(prev => prev === 1 ? 2 : 1);
            }}
            sx={{
              maxWidth: "100%",
              maxHeight: "100%",
              objectFit: "contain",
              cursor: imageViewerZoom === 1 ? "zoom-in" : "zoom-out",
              transition: "transform 0.25s ease",
              transform: `scale(${imageViewerZoom})`
            }}
          />
        </Box>
      </Dialog>

      <PollDialog
        open={pollDialogOpen}
        onClose={() => setPollDialogOpen(false)}
        onSendPoll={(question, options) => {
          sendMessage('', 'poll', { question, options: options.map(t => ({ text: t, votes: [] })) });
          setPollDialogOpen(false);
        }}
        effectiveChatTheme={effectiveChatTheme}
      />

      <GroupInfoDrawer
        profileOpen={profileOpen}
        setProfileOpen={setProfileOpen}
        groupInfo={groupInfo}
        groupName={groupName}
        mode={mode}
        createdByUser={createdByUser}
        tripInfo={tripInfo}
        timelineStats={timelineStats}
        memberInfo={memberInfo}
        currentUser={auth.currentUser}
      />
    </Box>
  );
}

export default GroupChat;

// ---------------- 2. INLINED SUB-COMPONENTS ----------------

const LinkPreviewCard = React.memo(({ url, preview, effectiveChatTheme }) => {
  if (!preview || !preview.title) return null;
  return (
    <Box
      sx={{
        mt: 1, p: 1, borderRadius: 2,
        bgcolor: effectiveChatTheme === "dark" ? "#222" : "#f5f5f5",
        boxShadow: "0 2px 8px #0002", maxWidth: 320, cursor: "pointer"
      }}
      onClick={() => window.open(preview.url, "_blank")}
    >
      {preview.image && (
        <img
          src={preview.image} alt={preview.title}
          style={{ width: "100%", maxHeight: 120, objectFit: "cover", borderRadius: 8, marginBottom: 8 }}
        />
      )}
      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{preview.title}</Typography>
      <Typography variant="body2" sx={{ color: "#888", fontSize: 13 }}>{preview.description}</Typography>
      <Typography variant="caption" sx={{ color: "#2196f3" }}>{preview.url}</Typography>
    </Box>
  );
});

// ---------------- UPDATED MessageBubble ----------------
const MessageBubble = React.memo(({
  message, isMe, sender, shape, scrollToMessage, highlightedMsgId, messageRefs, onAction,
  effectiveChatTheme, memberInfo, currentUserId, messages, memberUsers, theme, onVote,
  onToggleChecklistItem, checklist, timeline, messagePreviews, onReactionClick, onReactionChipClick, onDoubleTap,
  recentReaction, // <- parent-controlled prop for animation
  onOpenImage // function to open image viewer (passed from parent)
}) => {
  const bubbleRef = useRef(null);
  const longPressTimerRef = useRef(null);
  const longPressTriggeredRef = useRef(false);
  const lastPointerRef = useRef({ x: null, y: null }); // capture press point
  const [rippleVisible, setRippleVisible] = useState(false);
  const [rippleStyle, setRippleStyle] = useState({ left: '50%', top: '50%', size: 64 });

  const sortedTimeline = useMemo(() => {
    return [...(timeline || [])].sort((a, b) => {
      const getDate = (event) => event.timestamp?.seconds ? new Date(event.timestamp.seconds * 1000) : (event.datetime ? new Date(event.datetime) : null);
      const da = getDate(a) ? getDate(a).getTime() : 0;
      const db = getDate(b) ? getDate(b).getTime() : 0;
      return db - da;
    });
  }, [timeline]);

  const reactionsMap = useMemo(() => {
    if (!message.reactions) return {};
    return Object.entries(message.reactions).reduce((acc, [uid, emoji]) => {
      acc[emoji] = (acc[emoji] || []).concat(uid);
      return acc;
    }, {});
  }, [message.reactions]);

  const StatusIcon = useMemo(() => {
    const color = message.status === 'read' ? theme.palette.info.main : effectiveChatTheme === "dark" ? "#919191ff" : "#838383ff";
    if (message.status === 'read') return <DoneAllIcon sx={{ fontSize: "1rem", color: "#00b7ffff" }} />;
    if (message.status === 'delivered') return <DoneAllIcon sx={{ fontSize: "1rem", color }} />;
    if (message.status === 'sent') return <CheckIcon sx={{ fontSize: "1rem", color }} />;
    return <Box component="span">⏳</Box>;
  }, [message.status, effectiveChatTheme, theme.palette.info.main]);

  const isSingle = isSingleEmoji(message.text);
  const isSystem = message.type === 'system';
  const isPoll = message.type === 'poll';
  const isTimeline = message.type === 'timeline';
  const isChecklist = message.type === 'checklist';
  const isImage = message.type === 'image';

  // ---------- Long-press handling ----------
  const startLongPress = useCallback((ev) => {
    try {
      let clientX = null, clientY = null;
      if (ev.touches && ev.touches[0]) {
        clientX = ev.touches[0].clientX;
        clientY = ev.touches[0].clientY;
      } else if (ev.clientX != null) {
        clientX = ev.clientX;
        clientY = ev.clientY;
      } else if (ev.currentTarget && ev.currentTarget.getBoundingClientRect) {
        const r = ev.currentTarget.getBoundingClientRect();
        clientX = r.left + r.width / 2;
        clientY = r.top + r.height / 2;
      }
      lastPointerRef.current = { x: clientX, y: clientY };

      if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
      longPressTriggeredRef.current = false;

      longPressTimerRef.current = setTimeout(() => {
        longPressTriggeredRef.current = true;

        const rect = bubbleRef.current?.getBoundingClientRect();
        if (rect && lastPointerRef.current.x != null) {
          const localX = lastPointerRef.current.x - rect.left;
          const localY = lastPointerRef.current.y - rect.top;
          const leftPct = Math.max(10, Math.min(90, (localX / rect.width) * 100));
          const topPct = Math.max(10, Math.min(90, (localY / rect.height) * 100));
          setRippleStyle({ left: `${leftPct}%`, top: `${topPct}%`, size: Math.min(96, Math.max(48, Math.round(Math.min(rect.width, rect.height) * 0.4))) });
        } else {
          setRippleStyle({ left: isMe ? '85%' : '15%', top: '50%', size: 64 });
        }

        setRippleVisible(true);
        setTimeout(() => setRippleVisible(false), 420);

        if (navigator.vibrate) {
          try { navigator.vibrate(16); } catch (e) {}
        }

        // OPEN CONTEXT MENU on long-press
        onReactionClick && onReactionClick({ currentTarget: bubbleRef.current, preventDefault: () => {} });
      }, 520);
    } catch (err) {
      // ignore pointer capture errors
    }
  }, [isMe, onReactionClick]);

  const cancelLongPress = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => { cancelLongPress(); };
  }, [cancelLongPress]);

  // ---------- Keyboard accessibility ----------
  const handleKeyDown = (e) => {
    if (e.key === 'ContextMenu' || (e.shiftKey && e.key === 'F10')) {
      e.preventDefault();
      onReactionClick && onReactionClick({ currentTarget: bubbleRef.current, preventDefault: () => {} });
    }
    // Enter/Space open emoji picker (keyboard long-press fallback)
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      onReactionChipClick && onReactionChipClick({ currentTarget: bubbleRef.current, preventDefault: () => {} });
    }
  };

  const renderTextWithMentionsAndLinks = useCallback((text) => {
    if (!text) return null;
    const parts = [];
    const mentionRegex = /@(\w+)/g;
    let lastIndex = 0;
    let match;

    while ((match = mentionRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        const nonMentionPart = text.slice(lastIndex, match.index);
        nonMentionPart.split(URL_REGEX).forEach((linkPart, i) => {
          if (linkPart.match(URL_REGEX)) {
            parts.push(<a key={`link-${i}-${lastIndex}`} href={linkPart} target="_blank" rel="noopener noreferrer" style={{ color: "#2196f3", textDecoration: "underline", wordBreak: "break-word" }}>{linkPart}</a>);
          } else {
            parts.push(linkPart);
          }
        });
      }

      const username = match[1];
      const user = memberUsers.find(u => u.username === username || u.name === username);
      if (user) {
        parts.push(
          <Typography key={`${username}-${match.index}`} component="span" sx={{ cursor: 'pointer', color: effectiveChatTheme === 'dark' ? '#00f721' : '#007700', fontWeight: 'bold', '&:hover': { textDecoration: 'underline' } }}>
            @{username}
          </Typography>
        );
      } else {
        parts.push(text.slice(match.index, mentionRegex.lastIndex));
      }
      lastIndex = mentionRegex.lastIndex;
    }

    if (lastIndex < text.length) {
      text.slice(lastIndex).split(URL_REGEX).forEach((linkPart, i) => {
        if (linkPart.match(URL_REGEX)) {
          parts.push(<a key={`link-final-${i}-${lastIndex}`} href={linkPart} target="_blank" rel="noopener noreferrer" style={{ color: "#2196f3", textDecoration: "underline", wordBreak: "break-word" }}>{linkPart}</a>);
        } else {
          parts.push(linkPart);
        }
      });
    }

    return parts;
  }, [memberUsers, effectiveChatTheme]);

  if (isSystem) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', my: 1 }}>
        <Chip label={message.content} size="small" variant="outlined" color="info" />
      </Box>
    );
  }

  const now = new Date();
  let upcomingEventId = null;
  for (let i = sortedTimeline.length - 1; i >= 0; i--) {
    const event = sortedTimeline[i];
    const date = event.timestamp?.seconds ? new Date(event.timestamp.seconds * 1000) : event.datetime ? new Date(event.datetime) : null;
    if (!event.completed && date && date >= now) {
      upcomingEventId = event.id;
      break;
    }
  }

  return (
    <Box
      id={`message-${message.id}`}
      ref={(el) => { messageRefs.current[message.id] = el; bubbleRef.current = el; }}
      onDoubleClick={(e) => {
        // Prevent default double-click selecting text
        e.preventDefault();
        onDoubleTap && onDoubleTap();
      }}
      onContextMenu={(e) => {
        e.preventDefault();
        // desktop right-click: open context menu only
        onReactionClick && onReactionClick(e);
      }}
      // touch/mouse handlers for long-press
      onTouchStart={(e) => { startLongPress(e); }}
      onTouchEnd={(e) => {
        const wasLong = longPressTriggeredRef.current;
        cancelLongPress();
        if (wasLong) {
          e.preventDefault();
          e.stopPropagation();
        }
      }}
      onTouchMove={() => { cancelLongPress(); }}
      onMouseDown={(e) => {
        if (e.button === 0) startLongPress(e);
      }}
      onMouseUp={(e) => { cancelLongPress(); }}
      onMouseLeave={() => { cancelLongPress(); }}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      role="button"
      aria-label={`Message from ${sender.name || message.senderName}`}
      sx={{
        display: 'flex',
        width: '100%',
        mt: 0.5,
        mb: 0.5,
        justifyContent: isMe ? 'flex-end' : 'flex-start',
        px: 1,
        boxSizing: 'border-box',
        outline: 'none',
        '&:focus': {
          boxShadow: `0 0 0 3px ${theme.palette.primary.main}22`,
          borderRadius: 2
        }
      }}
    >
      {!isMe && (
        <Avatar src={sender.photoURL || ""} alt={sender.name} sx={{ width: 32, height: 32, mr: 1, mt: 0.5, flexShrink: 0 }} />
      )}

      <motion.div
        drag="x"
        dragConstraints={{ left: isMe ? -80 : 0, right: isMe ? 0 : 80 }}
        dragElastic={0.2}
        onDragEnd={(_, info) => {
          if (Math.abs(info.offset.x) > 60) onAction(message, 'reply');
        }}
        style={{
          maxWidth: '72%',
          minWidth: 80,
          display: 'flex',
          flexDirection: 'column',
          alignItems: isMe ? 'flex-end' : 'flex-start',
          position: 'relative'
        }}
      >
        {/* ripple visual — positioned using rippleStyle */}
        {rippleVisible && (
          <span
            style={{
              position: "absolute",
              width: rippleStyle.size,
              height: rippleStyle.size,
              borderRadius: "50%",
              background: effectiveChatTheme === 'dark' ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.07)",
              animation: "bubble-ripple 420ms ease-out forwards",
              pointerEvents: "none",
              top: rippleStyle.top,
              left: rippleStyle.left,
              transform: "translate(-50%, -50%)",
              zIndex: 0
            }}
          />
        )}

        {!isMe && !message.replyTo && (
          <Typography variant="caption" sx={{ fontWeight: 700, mb: 0.3, color: theme.palette.text.secondary }}>
            {sender.name || message.senderName}
          </Typography>
        )}

        {isSingle ? (
          <motion.div initial={{ scale: 0.7 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }}>
            <Typography sx={{ fontSize: '3.0rem', lineHeight: 0.9 }}>{message.text}</Typography>
          </motion.div>
        ) : (
          <Paper elevation={2} sx={{
            p: 1.1,
            bgcolor: isMe ? theme.palette.primary.main : (effectiveChatTheme === 'dark' ? 'rgba(255,255,255,0.06)' : '#f4f6f8'),
            color: isMe ? theme.palette.primary.contrastText : theme.palette.text.primary,
            ...shape,
            position: 'relative',
            zIndex: 1
          }}>
            {message.replyTo && (
              <Paper onClick={() => scrollToMessage(message.replyTo.id)} elevation={0} sx={{ p: 0.7, mb: 0.6, bgcolor: 'transparent', borderLeft: `3px solid ${theme.palette.primary.main}`, cursor: 'pointer', borderRadius: 1, maxWidth: '100%', opacity: 0.75 }}>
                <Typography variant="caption" sx={{ fontWeight: 700, color: theme.palette.primary.main, display: 'block' }}>{message.replyTo.senderName}</Typography>
                <Typography variant="caption" sx={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{message.replyTo.text}</Typography>
              </Paper>
            )}

            {/* show animated overlay when parent recentReaction matches */}
            {recentReaction?.messageId === message.id && (
              <AnimatedReactionOverlay emoji={recentReaction.emoji} isRight={isMe} />
            )}

            {isPoll && message.options?.length > 0 ? (
              <Box sx={{ mt: 0.5 }}>
                <Typography variant="subtitle2" fontWeight="700" mb={1} sx={{ color: isMe ? theme.palette.primary.contrastText : theme.palette.text.primary }}>
                  📊 {message.question || "Poll"}
                </Typography>
                <List dense sx={{ p: 0 }}>
                  {message.options.map((option, idx) => {
                    const totalVotes = option.votes?.length || 0;
                    const hasVoted = (option.votes || []).includes(currentUserId);
                    const userHasVotedInPoll = message.options.some(opt => (opt.votes || []).includes(currentUserId));
                    const bgColor = hasVoted ? theme.palette.warning.main + '22' : 'transparent';
                    const textColor = hasVoted ? theme.palette.warning.main : (isMe ? theme.palette.primary.contrastText : theme.palette.text.primary);

                    return (
                      <ListItemButton
                        key={idx}
                        onClick={() => onVote(message.id, idx)}
                        disabled={userHasVotedInPoll}
                        sx={{ mt: 0.5, bgcolor: bgColor, borderRadius: 1 }}
                      >
                        <ListItemText primary={option.text} primaryTypographyProps={{ color: textColor, fontWeight: 700 }} />
                        <Chip label={totalVotes} size="small" />
                      </ListItemButton>
                    );
                  })}
                </List>
              </Box>
            ) : isChecklist ? (
              <Box sx={{ mt: 0.5, p: 0.5, border: `1px solid ${theme.palette.divider}`, borderRadius: 2 }}>
                <Typography variant="subtitle2" fontWeight="700">📝 Trip Checklist</Typography>
                <List dense>
                  {checklist.map((item) => {
                    const isChecked = item.checkedBy?.includes(currentUserId);
                    return (
                      <ListItemButton key={item.id} onClick={() => onToggleChecklistItem(item.id, !isChecked)}>
                        <Checkbox edge="start" checked={Boolean(isChecked)} tabIndex={-1} sx={{ color: theme.palette.text.primary }} />
                        <ListItemText primary={item.text || "Untitled"} sx={{ textDecoration: isChecked ? "line-through" : "none" }} />
                      </ListItemButton>
                    );
                  })}
                </List>
              </Box>
            ) : isTimeline ? (
              <Box sx={{ mt: 0.5, p: 0.5, border: `1px solid ${theme.palette.divider}`, borderRadius: 2 }}>
                <Typography variant="subtitle2" fontWeight="700">📅 Shared Timeline</Typography>
                <List dense>
                  {sortedTimeline.map((event, idx) => {
                    const dateObj = event.timestamp?.seconds ? new Date(event.timestamp.seconds * 1000) : event.datetime ? new Date(event.datetime) : null;
                    const timeStr = dateObj ? dateObj.toLocaleString("en-US", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : '---';
                    const isUpcoming = event.id === upcomingEventId;
                    return (
                      <ListItem key={event.id || idx} disableGutters sx={{ bgcolor: isUpcoming ? theme.palette.warning.main + '10' : 'transparent', borderRadius: 1 }}>
                        <ListItemText primary={`${event.completed ? '✅' : (isUpcoming ? '⏩' : '⏳')} ${event.title || event.text}`} secondary={timeStr} primaryTypographyProps={{ sx: { fontWeight: 700 } }} />
                      </ListItem>
                    );
                  })}
                </List>
              </Box>
            ) : isImage ? (
              <img
                src={message.dataUri}
                onClick={(e) => {
                  // prevent opening context menu
                  e.stopPropagation();
                  onOpenImage && onOpenImage(message.dataUri);
                }}
                alt="Shared Image"
                style={{ width: '100%', height: 'auto', borderRadius: 8, display: 'block', cursor: 'zoom-in' }}
              />
            ) : (
              <Typography variant="body2" sx={{ wordBreak: 'break-word', color: isMe ? theme.palette.primary.contrastText : theme.palette.text.primary }}>
                {renderTextWithMentionsAndLinks(message.text)}
                {message.edited && <Typography component="span" variant="caption" sx={{ opacity: 0.7, ml: 1 }}>(edited)</Typography>}
              </Typography>
            )}

            <LinkPreviewCard url={extractUrl(message.text)} preview={messagePreviews[message.id]} effectiveChatTheme={effectiveChatTheme} />

            <Box sx={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start', alignItems: 'center', mt: 0.5 }}>
              <Typography variant="caption" sx={{ mr: isMe ? 0.5 : 0.5, opacity: 0.7, fontSize: '0.72rem' }}>
                {message.timestamp?.seconds ? new Date(message.timestamp.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '...'}
              </Typography>
              {isMe && StatusIcon}
            </Box>

            {Object.entries(reactionsMap).length > 0 && (
              <Box sx={{
                position: 'absolute',
                bottom: -12,
                right: isMe ? 2 : 'auto',
                left: isMe ? 'auto' : 4,
                display: 'flex',
                gap: 0.5,
                p: 0.5,
                bgcolor: effectiveChatTheme === 'dark' ? '#1c1c1c' : '#ffffff',
                borderRadius: 2,
                boxShadow: '0 1px 4px rgba(0,0,0,0.08)'
              }}>
                {Object.entries(reactionsMap).map(([emoji, uids]) => (
                  <Tooltip key={emoji} title={uids.map(uid => memberInfo[uid]?.name || 'Unknown').join(', ')}>
                    <Chip
                      size="small"
                      label={`${emoji} ${uids.length}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onReactionChipClick && onReactionChipClick(e);
                      }}
                      sx={{ height: 24, fontWeight: 600, cursor: 'pointer', bgcolor: uids.includes(currentUserId) ? theme.palette.warning.main + '22' : 'transparent' }}
                      aria-label={`Reactions: ${emoji} (${uids.length})`}
                    />
                  </Tooltip>
                ))}
              </Box>
            )}
          </Paper>
        )}
      </motion.div>

      {isMe && <Box sx={{ width: 32, ml: 1, flexShrink: 0 }} />}
    </Box>
  );
});

// --- Composer, PollDialog, ReactionDrawer, TypingIndicator (unchanged except minor keyboard / aria already included) ---

const Composer = React.memo(({
  text, setText, onTyping, sendMessage, replyTo, onCancelReply, effectiveChatTheme,
  isEditing, editMessage, onCancelEdit, onUpdateMessage, onImageUpload, onOpenPollDialog,
  memberUsers, onToggleMoreMenu, isMoreMenuOpen, fetchTripTimeline, fetchTripChecklist,
  sendStructuredMessage, mentionDrawerOpen, handleMentionSelect
}) => {
  const theme = useTheme();
  const inputRef = useRef(null);
  const currentUserId = auth.currentUser?.uid;

  const handleChange = (e) => {
    const newText = e.target.value;
    setText(newText);
    onTyping(newText);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (text.trim() === '') return;
    if (isEditing) onUpdateMessage(editMessage.id, text.trim());
    else sendMessage();
  };

  const mentionableMembers = useMemo(() =>
    Object.values(memberUsers).filter(u => u.name && u.uid !== currentUserId)
    , [memberUsers, currentUserId]);

  return (
    <Box component="form" onSubmit={handleSubmit}>

      <Collapse in={mentionDrawerOpen && mentionableMembers.length > 0} timeout={300} unmountOnExit>
        <Paper sx={{ maxHeight: 160, overflowY: 'auto', mb: 1, p: 1, bgcolor: effectiveChatTheme === "dark" ? "#1c1c1c" : "#ffffff", border: 'none' }}>
          <List dense>
            {mentionableMembers.map(user => (
              <ListItemButton key={user.uid} onClick={() => handleMentionSelect(user.name || user.username || user.uid)}>
                <Avatar src={user.photoURL} sx={{ width: 28, height: 28, mr: 1 }} />
                <ListItemText primary={user.name} secondary={user.username && `@${user.username}`} />
              </ListItemButton>
            ))}
          </List>
        </Paper>
      </Collapse>

      <Collapse in={Boolean(replyTo) && !isEditing} timeout={300}>
        {replyTo && (
          <Paper elevation={0} sx={{ p: 1, mb: 1, bgcolor: effectiveChatTheme === "dark" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)", display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: 1 }}>
            <Box sx={{ overflow: 'hidden' }}>
              <Typography variant="caption" sx={{ fontWeight: 700, display: 'block', color: theme.palette.primary.main }}>Replying to: {replyTo.senderName}</Typography>
              <Typography variant="caption" sx={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '75vw' }}>{replyTo.text}</Typography>
            </Box>
            <IconButton size="small" onClick={onCancelReply}><CloseIcon fontSize="small" /></IconButton>
          </Paper>
        )}
      </Collapse>

      <Collapse in={isMoreMenuOpen} timeout={300} unmountOnExit>
        <Paper elevation={3} sx={{ p: 1, mb: 1, bgcolor: effectiveChatTheme === "dark" ? "#1c1c1c" : "#ffffff", border: 'none' }}>
          <MenuItem onClick={() => { onOpenPollDialog(); onToggleMoreMenu(); }}><PollIcon sx={{ mr: 1 }} /> Create Poll</MenuItem>
          <MenuItem onClick={async () => { const items = await fetchTripTimeline(); sendStructuredMessage("Timeline", items); onToggleMoreMenu(); }}><Box component="span" sx={{ mr: 1 }}>📅</Box> Share Timeline</MenuItem>
          <MenuItem onClick={async () => { const items = await fetchTripChecklist(); sendStructuredMessage("Checklist", items); onToggleMoreMenu(); }}><CheckIcon sx={{ mr: 1 }} /> Share Checklist</MenuItem>
        </Paper>
      </Collapse>

      <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1 }}>
        <IconButton color="primary" onClick={onToggleMoreMenu} sx={{ bgcolor: effectiveChatTheme === "dark" ? "#14141439" : "#ffffff37", backdropFilter: "blur(6px)" }}>
          <AddIcon sx={{ transform: isMoreMenuOpen ? 'rotate(45deg)' : 'rotate(0deg)', transition: 'transform 0.25s' }} />
        </IconButton>

        <input accept="image/*" type="file" onChange={onImageUpload} style={{ display: 'none' }} id="image-upload-input" />
        <Tooltip title="Send Image">
          <label htmlFor="image-upload-input">
            <IconButton component="span" color="primary" sx={{ bgcolor: effectiveChatTheme === "dark" ? "#14141439" : "#ffffff37", backdropFilter: "blur(6px)" }}><CameraAltOutlinedIcon /></IconButton>
          </label>
        </Tooltip>

        <TextField
          inputRef={inputRef}
          fullWidth
          multiline
          maxRows={4}
          value={text}
          onChange={handleChange}
          placeholder={isEditing ? "Editing message..." : "Type a message..."}
          variant="outlined"
          size="small"
          sx={{ '& fieldset': { borderRadius: 12, borderColor: effectiveChatTheme === "dark" ? '#5E5E5E00' : '#75757500' },
            bgcolor: effectiveChatTheme === "dark" ? "#14141439" : "#ffffff37", backdropFilter: "blur(6px)", borderRadius: 12,
            input: { color: effectiveChatTheme === "dark" ? "#fff" : "#000" }
          }}
        />

        {isEditing ? (
          <Stack direction="row" spacing={1}>
            <Button onClick={onCancelEdit} variant="outlined" color="error" sx={{ minWidth: 48 }}><CloseIcon /></Button>
            <Button type="submit" variant="contained" color="success" disabled={text.trim() === ''} sx={{ minWidth: 48 }}><CheckIcon /></Button>
          </Stack>
        ) : (
          <IconButton type="submit" color="primary" disabled={text.trim() === ''} sx={{ bgcolor: theme.palette.primary.main, color: theme.palette.primary.contrastText }}>
            <SendIcon />
          </IconButton>
        )}
      </Box>
    </Box>
  );
});

const PollDialog = ({ open, onClose, onSendPoll, effectiveChatTheme }) => {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);

  useEffect(() => {
    if (!open) { setQuestion(''); setOptions(['', '']); }
  }, [open]);

  const handleOptionChange = (index, value) => {
    const newOptions = [...options]; newOptions[index] = value; setOptions(newOptions);
  };

  const handleAddOption = () => setOptions(prev => [...prev, '']);
  const handleRemoveOption = (index) => setOptions(options.filter((_, i) => i !== index));

  const handleSend = () => {
    const validOptions = options.filter(opt => opt.trim());
    if (question.trim() && validOptions.length >= 2) {
      onSendPoll(question.trim(), validOptions);
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" PaperProps={{ sx: { bgcolor: effectiveChatTheme === "dark" ? "#121212" : "#fff", borderRadius: 4, p: 2 } }}>
      <DialogTitle sx={{ color: effectiveChatTheme === "dark" ? "#fff" : "#000", fontWeight: "bold" }}>📊 Create Poll</DialogTitle>
      <DialogContent>
        <TextField label="Poll Question" fullWidth value={question} onChange={(e) => setQuestion(e.target.value)} variant="outlined" sx={{ mb: 3 }} InputLabelProps={{ style: { color: effectiveChatTheme === "dark" ? '#aaa' : '#555' } }} InputProps={{ style: { color: effectiveChatTheme === "dark" ? "#fff" : "#000" } }} />
        {options.map((option, index) => (
          <Box key={index} sx={{ display: "flex", alignItems: "center", mb: 2 }}>
            <TextField fullWidth placeholder={`Option ${index + 1}`} value={option} onChange={(e) => handleOptionChange(index, e.target.value)} InputLabelProps={{ style: { color: effectiveChatTheme === "dark" ? '#aaa' : '#555' } }} InputProps={{ style: { color: effectiveChatTheme === "dark" ? "#fff" : "#000" } }} />
            <IconButton onClick={() => handleRemoveOption(index)} disabled={options.length <= 2} sx={{ ml: 1, color: "#ff5555" }}><RemoveIcon /></IconButton>
          </Box>
        ))}
        <Button onClick={handleAddOption} startIcon={<AddIcon />} sx={{ color: effectiveChatTheme === "dark" ? "#00f721" : "#00a300" }}>Add Option</Button>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} sx={{ color: effectiveChatTheme === "dark" ? "#ccc" : "#555" }}>Cancel</Button>
        <Button onClick={handleSend} variant="contained" disabled={question.trim() === '' || options.filter(opt => opt.trim()).length < 2} sx={{ bgcolor: effectiveChatTheme === "dark" ? "#00f721" : "#00a300", color: "#fff" }}>Send Poll</Button>
      </DialogActions>
    </Dialog>
  );
};

const ReactionDrawer = ({ reactionAnchorEl, reactionMsg, memberInfo, allUsers, currentUser, effectiveChatTheme, handleReaction, onClose, setShowEmojiPicker }) => {
  const isDark = effectiveChatTheme === "dark";
  const getGroupedReactions = (msg, users) => {
    const grouped = {};
    if (!msg?.reactions) return grouped;
    for (const [uid, emoji] of Object.entries(msg.reactions)) {
      if (!grouped[emoji]) grouped[emoji] = [];
      grouped[emoji].push({ uid, name: users[uid]?.name || "User", photoURL: users[uid]?.photoURL || "" });
    }
    return grouped;
  };

  const userGroupedReactions = useMemo(() => {
    const grouped = getGroupedReactions(reactionMsg, allUsers);
    const userMap = {};
    for (const [emoji, users] of Object.entries(grouped)) {
      users.forEach(u => {
        if (!userMap[u.uid]) userMap[u.uid] = { user: u, emojis: [] };
        userMap[u.uid].emojis.push(emoji);
      });
    }
    const groupedArray = Object.values(userMap);
    groupedArray.sort((a, b) => (a.user.uid === currentUser.uid ? -1 : b.user.uid === currentUser.uid ? 1 : 0));
    return groupedArray;
  }, [reactionMsg, allUsers, currentUser]);

  return (
    <SwipeableDrawer
      anchor="bottom" open={Boolean(reactionAnchorEl)} onClose={onClose} onOpen={() => {}}
      PaperProps={{ sx: { minWidth: 220, borderRadius: "25px 25px 0 0", bgcolor: isDark ? "#00000026" : "#ffffffde", color: isDark ? "#fff" : "#222", boxShadow: isDark ? "0 12px 32px #000c" : "0 8px 32px #8882", p: 2, backdropFilter: "blur(40px)" } }}
    >
      <Box sx={{ width: 40, height: 4, bgcolor: isDark ? '#6a6a6aff' : '#818181ff', borderRadius: 3, mx: 'auto', mb: 1.5, opacity: 0.5, cursor: "grab" }} />
      <Typography variant="subtitle2" sx={{ textAlign: "center", mb: 1, fontWeight: 600, opacity: 0.8 }}>Reactions</Typography>
      <Divider sx={{ mb: 1, bgcolor: isDark ? "#696969ff" : "#ddd" }} />
      <Box sx={{ px: 1, pb: 1, maxHeight: 300, overflowY: 'auto' }}>
        {userGroupedReactions.map(({ user, emojis }) => (
          <ListItem key={user.uid} sx={{ bgcolor: isDark ? "#0000003d" : "#31313121", borderRadius: 3, my: 0.7, p: 1.2, flexDirection: "column" }}
            onClick={() => { if (user.uid === currentUser.uid) { emojis.forEach(emoji => handleReaction(reactionMsg.id, emoji)); onClose(); } }}
          >
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", gap: 1 }}>
              <Tooltip title={user.name}><Avatar src={user.photoURL || ""} sx={{ width: 36, height: 36 }} /></Tooltip>
              <Box sx={{ flexGrow: 1, ml: 1 }}>
                <Typography variant="body1" sx={{ fontWeight: 700, fontSize: 15 }}>{user.uid === currentUser.uid ? "You" : user.name}</Typography>
                {user.uid === currentUser?.uid && <Typography variant="caption" sx={{ opacity: 0.8, fontSize: 10 }}>Tap to remove all your reactions</Typography>}
              </Box>
              <Box sx={{ display: "flex", gap: 0.5 }}>{emojis.map((emoji) => <Typography key={emoji} variant="body1" fontSize={22}>{emoji}</Typography>)}</Box>
            </Box>
          </ListItem>
        ))}
      </Box>
    </SwipeableDrawer>
  );
};

const TypingIndicator = React.memo(({ typingMembers, effectiveChatTheme }) => {
  if (typingMembers.length === 0) return null;

  const text = typingMembers.length > 2
    ? 'Several people are typing...'
    : typingMembers.length === 2
      ? `${typingMembers[0]} and ${typingMembers[1]} are typing...`
      : `${typingMembers[0]} is typing...`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      transition={{ duration: 0.2 }}
      style={{
        display: "flex",
        flexDirection: "row",
        alignItems: "flex-end",
        gap: "8px",
        margin: "10px 0",
        paddingLeft: "8px",
      }}
    >
      <Paper
        elevation={1}
        sx={{
          px: 2,
          py: 0.8,
          maxWidth: "60%",
          borderRadius: "16px 16px 16px 4px",
          bgcolor: effectiveChatTheme === "dark" ? "#353535" : "#f5f5f5",
        }}
      >
        <Typography
          variant="caption"
          sx={{ color: effectiveChatTheme === "dark" ? "#fff" : "#000" }}
        >
          {text}
        </Typography>
      </Paper>
    </motion.div>
  );
});

// Animated overlay using framer-motion
const AnimatedReactionOverlay = ({ emoji = "👍", isRight = true }) => {
  const particles = Array.from({ length: 7 }).map((_, i) => {
    const angle = (Math.PI * 2) * (i / 7) + (Math.random() - 0.5) * 0.4;
    const distance = 34 + Math.random() * 28;
    const dx = Math.cos(angle) * distance * (isRight ? -1 : 1);
    const dy = Math.sin(angle) * distance * -1;
    const delay = Math.random() * 0.12;
    return { id: i, dx, dy, delay };
  });

  return (
    <Box sx={{ position: "absolute", inset: 0, pointerEvents: "none", display: "flex", alignItems: "center", justifyContent: isRight ? "flex-end" : "flex-start", zIndex: 2200 }}>
      <Box sx={{ position: "relative", width: 0, height: 0 }}>
        <motion.div
          initial={{ scale: 0.2, y: 8, opacity: 0 }}
          animate={{ scale: [1.4, 1.0, 0.96], y: [-6, 0, -3], opacity: [0, 1, 0.9] }}
          transition={{ duration: 0.55, times: [0, 0.5, 1], ease: "easeOut" }}
          style={{ position: "absolute", transformOrigin: "center", right: isRight ? 16 : "auto", left: isRight ? "auto" : 16, fontSize: 22 }}
        >
          <Box sx={{
            width: 44, height: 44, borderRadius: "50%", display: "flex",
            alignItems: "center", justifyContent: "center",
            boxShadow: "0 8px 20px rgba(0,0,0,0.18)",
            background: "linear-gradient(180deg, rgba(255,255,255,0.15), rgba(255,255,255,0.03))",
            backdropFilter: "blur(6px)"
          }}>
            <Typography sx={{ fontSize: 20 }}>{emoji}</Typography>
          </Box>
        </motion.div>

        {particles.map(p => (
          <motion.div
            key={p.id}
            initial={{ x: 0, y: 0, scale: 0.9, opacity: 0.9 }}
            animate={{ x: p.dx, y: p.dy, scale: 1.0, opacity: 0 }}
            transition={{ duration: 0.85, delay: p.delay, ease: [0.2, 0.9, 0.22, 1] }}
            style={{
              position: "absolute",
              right: isRight ? 34 : "auto",
              left: isRight ? "auto" : 34,
              top: 2,
            }}
          >
            <Box sx={{ fontSize: 14, width: 22, height: 22, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ display: "inline-block" }}>{emoji}</span>
            </Box>
          </motion.div>
        ))}

        <motion.span
          initial={{ scale: 0.6, opacity: 0.12 }}
          animate={{ scale: 1.2, opacity: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          style={{
            position: "absolute",
            right: isRight ? 10 : "auto",
            left: isRight ? "auto" : 10,
            top: -6,
            width: 72,
            height: 72,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(0,183,255,0.12), rgba(0,183,255,0.02))",
            pointerEvents: "none",
            zIndex: -1
          }}
        />
      </Box>
    </Box>
  );
};
