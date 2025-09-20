import React, { useEffect, useState, useRef } from 'react';
import {
  Box, Button, Avatar, Typography, TextField, IconButton, CircularProgress,
  AppBar, Toolbar, Paper, Menu, MenuItem, Slide, Dialog, Divider, SwipeableDrawer, Stack, Chip, useTheme, keyframes, createTheme,
  ThemeProvider,
  Card,
  CardActionArea,
  CardContent,
  Grid, List, ListItemText, ListItemAvatar, LinearProgress, InputAdornment, Drawer, CardMedia,
  Zoom
} from '@mui/material';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { X, Phone, Video, MoreVertical, ArrowDownToDotIcon } from 'lucide-react';
import SendIcon from '@mui/icons-material/Send';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import CloseIcon from '@mui/icons-material/Close';
import ChatOutlinedIcon from '@mui/icons-material/ChatOutlined';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined';
import EmojiEmotionsIcon from '@mui/icons-material/EmojiEmotions';
import EmojiPicker from 'emoji-picker-react';
import Popover from '@mui/material/Popover';
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import ReplyIcon from '@mui/icons-material/Reply';
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import CameraAltOutlinedIcon from '@mui/icons-material/CameraAltOutlined';

import { useParams, useNavigate } from 'react-router-dom';
import { useSwipeable } from "react-swipeable";
import {
  collection, addDoc, query, orderBy, onSnapshot,
  serverTimestamp, doc, updateDoc, getDoc, getDocs, where, deleteDoc
} from "firebase/firestore";
import { db, auth } from '../firebase';
import { onAuthStateChanged } from "firebase/auth";
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import TextFieldsIcon from '@mui/icons-material/TextFields';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import EditIcon from '@mui/icons-material/Edit';
import AddAPhoto from '@mui/icons-material/AddAPhoto';
import DownloadIcon from '@mui/icons-material/Download';

import {
  LocationOn, AccessTime,
} from "@mui/icons-material";
import { v4 as uuidv4 } from 'uuid'; // For notification message id
import { messaging } from "../firebase";
import { getToken, onMessage } from "firebase/messaging";
import { useThemeToggle } from "../contexts/ThemeToggleContext";
import { getTheme } from "../theme";

function showLocalNotification(title, options) {
  if (Notification.permission === "granted") {
    if (document.hasFocus()) {
      // Show notification in foreground
      new Notification(title, options);
    } else if (navigator.serviceWorker && navigator.serviceWorker.ready) {
      // Show notification via Service Worker in background
      navigator.serviceWorker.ready.then(registration => {
        registration.showNotification(title, options);
      });
    }
  }
}

  const fadeIn = keyframes`
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  `;

function ChatRoom() {
  const { friendId } = useParams();
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [friendDetails, setFriendDetails] = useState({ name: 'Loading...', photoURL: '', status: 'offline' });
  const [editMessageId, setEditMessageId] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedMsg, setSelectedMsg] = useState(null);
  const [showProfile, setShowProfile] = useState(false);
  const [commonGroups, setCommonGroups] = useState([]);
  const [commonTrips, setCommonTrips] = useState([]);
  const [replyingTo, setReplyingTo] = useState(null);
  const [selectedReplyMessage, setSelectedReplyMessage] = useState(null);
  const controls = useAnimation();
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [newMessagesCount, setNewMessagesCount] = useState(0);
  const [reactionAnchorEl, setReactionAnchorEl] = useState(null);
  const [reactionMsg, setReactionMsg] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [nickname, setNickname] = useState('');
  const [editNickname, setEditNickname] = useState(false);
  const [addNicknameDrawerOpen, setAddNicknameDrawerOpen] = useState(false);
  const [sharedBudgets, setSharedBudgets] = useState([]);
  const { mode, setMode, accent, setAccent, toggleTheme } = useThemeToggle();
  const theme = getTheme(mode, accent);
  const muiTheme = useTheme();
  const [groupMembersInfo, setGroupMembersInfo] = useState({});
  const [allCommonGroupsDrawerOpen, setAllCommonGroupsDrawerOpen] = useState(false);
  const [groupSearch, setGroupSearch] = useState("");
  const [checklist, setChecklist] = useState([]);
  const [timelineStatsMap, setTimelineStatsMap] = useState([]);
  const [showAllTripsDrawer, setShowAllTripsDrawer] = useState(false);
  const [tripSearch, setTripSearch] = useState("");
  const visibleTrips = commonTrips.slice(0, 1);
  const moreCount = commonTrips.length - 1;
  const messageRefs = useRef({});
  const [highlightedMsgId, setHighlightedMsgId] = useState(null);
  const [draggedMsgId, setDraggedMsgId] = useState(null);

  const scrollContainerRef = useRef(null);
  const chatId = currentUser && friendId ? [currentUser.uid, friendId].sort().join('_') : null;

  const history = useNavigate();
  const messagesEndRef = useRef(null);

  const [notification, setNotification] = useState(null);

  const [chatFontSize, setChatFontSize] = useState(parseInt(localStorage.getItem('bunkmate_fontSize'), 10) || 16);
  const [chatWallpaper, setChatWallpaper] = useState(localStorage.getItem('bunkmate_chatWallpaper') || 'default');
  const [effectiveChatTheme, setEffectiveChatTheme] = useState('dark'); // 'light' or 'dark'
  const [imageDrawer, setImageDrawer] = useState(false);
  const [imageDataUri, setImageDataUri] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [openViewer, setOpenViewer] = useState(false);
  const images = messages.filter(msg => msg.type === "image").map(msg => msg.dataUri);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [selectedImage, setSelectedImage] = useState(null);

  const messageVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 20, transition: { duration: 0.2 } },
  };

    const getWallpaperUrl = () => {
      const selectedWallpaper = localStorage.getItem('bunkmate_chatWallpaper') || 'default';
      if (selectedWallpaper === 'none') {
          return 'none'; // No background image
      }
      if (selectedWallpaper === 'default') {
          // Use default light/dark wallpaper based on the effective theme
          return effectiveChatTheme === 'dark'
              ? 'url(/assets/images/chatbg/dark.png)'
              : 'url(/assets/images/chatbg/light.png)';
      }
      // If it's not 'default' or 'none', it's a custom URL
      return `url(${selectedWallpaper})`;
    };

    useEffect(() => {
        const savedThemeSetting = localStorage.getItem('bunkmate_chatTheme') || 'system';
        if (savedThemeSetting !== 'system') {
            setEffectiveChatTheme(savedThemeSetting);
            return;
        }
        const applyAppTheme = () => {
            const globalAppTheme = localStorage.getItem('theme') || 'dark';
            setEffectiveChatTheme(globalAppTheme);
        };

        applyAppTheme();

        const handleStorageChange = (event) => {
            if (event.key === 'theme') {
                applyAppTheme();
            }
        };

        window.addEventListener('storage', handleStorageChange);

        // Cleanup the listener when the component unmounts
        return () => {
            window.removeEventListener('storage', handleStorageChange);
        };
    }, []);

    // ⭐️ 4. LISTEN FOR REAL-TIME CHANGES FROM OTHER TABS
    useEffect(() => {
        const handleStorageChange = (event) => {
            if (event.key === 'bunkmate_fontSize') {
                setChatFontSize(parseInt(event.newValue, 10) || 16);
            }
            if (event.key === 'bunkmate_chatWallpaper') {
                setChatWallpaper(event.newValue || 'default');
            }
            if (event.key === 'bunkmate_chatTheme') {
                // For theme, we just reload to apply all changes consistently
                window.location.reload();
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

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

  // Listen for foreground FCM messages
  const unsubscribe = onMessage(messaging, (payload) => {
    if (payload?.notification) {
      showLocalNotification(payload.notification.title, {
        body: payload.notification.body,
        icon: "/logo192.png",
      });
    }
  });

  return () => {
    // No unsubscribe needed for onMessage in v9 modular
  };
}, []);

// --- In your onSnapshot for messages, show notification for new messages, reactions, or nickname edits ---
useEffect(() => {
  if (!chatId || !currentUser) return;

  const q = query(collection(db, "chats", chatId, "messages"), orderBy("timestamp", "asc"));
  const unsubscribe = onSnapshot(q, (querySnapshot) => {
    const msgs = [];
    querySnapshot.forEach((doc) => {
      const msg = doc.data();
      msg.id = doc.id;
      msgs.push(msg);
    });
    setMessages(msgs);

    // Notification for new message from friend
    const lastMessage = msgs[msgs.length - 1];
    if (
      lastMessage &&
      lastMessage.senderId !== currentUser.uid &&
      !lastMessage.isRead &&
      !lastMessage.system
    ) {
      showLocalNotification("New Message", {
        body: lastMessage.text,
        icon: "/logo192.png",
      });
    }

    // Notification for system messages (nickname edits, etc)
    if (
      lastMessage &&
      lastMessage.system &&
      lastMessage.senderId !== currentUser.uid &&
      lastMessage.notificationType === "nickname"
    ) {
      showLocalNotification("Nickname Changed", {
        body: lastMessage.text,
        icon: "/logo192.png",
      });
    }

    // Notification for reactions
    if (
      lastMessage &&
      lastMessage.reactions &&
      Array.isArray(lastMessage.reactions) &&
      lastMessage.reactions.some(r => r.user !== currentUser.uid)
    ) {
      showLocalNotification("New Reaction", {
        body: "Someone reacted to a message!",
        icon: "/logo192.png",
      });
    }

    const lastMsg = msgs[msgs.length - 1];
    if (lastMsg && lastMsg.senderId !== currentUser?.uid && !lastMsg.isRead) {
      updateDoc(doc(db, "chats", chatId, "messages", lastMsg.id), {
        isRead: true
      });
    }
  });

  return () => unsubscribe();
}, [chatId, currentUser]);

  const getGroupedReactions = (msg) => {
    if (!msg.reactions) return {};
    // reactions: [{emoji: '❤️', users: ['uid1', 'uid2']}]
    const grouped = {};
    msg.reactions.forEach(r => {
      if (!grouped[r.emoji]) grouped[r.emoji] = [];
      grouped[r.emoji].push(r.user);
    });
    return grouped;
  };

  useEffect(() => {
    const fetchNickname = async () => {
      if (!currentUser || !friendId) return;
      const userDoc = await getDoc(doc(db, "users", currentUser.uid));
      if (userDoc.exists()) {
        const nicknames = userDoc.data().nicknames || {};
        setNickname(nicknames[friendId] || '');
      }
    };
    fetchNickname();
  }, [currentUser, friendId]);

  // --- Remove user from friends ---
  const handleRemoveFriend = async () => {
    if (!window.confirm("Are you sure you want to remove this user from your friends?")) return;
    // Remove from current user's friends
    const userRef = doc(db, "users", currentUser.uid);
    const userDoc = await getDoc(userRef);
    const friends = userDoc.exists() ? (userDoc.data().friends || []) : [];
    await updateDoc(userRef, {
      friends: friends.filter(uid => uid !== friendId)
    });
    // Remove from friend's friends
    const friendRef = doc(db, "users", friendId);
    const friendDoc = await getDoc(friendRef);
    const friendFriends = friendDoc.exists() ? (friendDoc.data().friends || []) : [];
    await updateDoc(friendRef, {
      friends: friendFriends.filter(uid => uid !== currentUser.uid)
    });
    setNotification("Removed from friends.");
    setOpenProfile(false);
    // Optionally redirect to chats list
    history('/chats');
  };

  // --- Clear chat history ---
  const handleClearChat = async () => {
    if (!window.confirm("Clear all chat messages with this user?")) return;
    const msgsQuery = query(collection(db, "chats", chatId, "messages"));
    const msgsSnapshot = await getDocs(msgsQuery);
    const batch = [];
    msgsSnapshot.forEach(docSnap => {
      batch.push(deleteDoc(doc(db, "chats", chatId, "messages", docSnap.id)));
    });
    await Promise.all(batch);
    setNotification("Chat cleared.");
  };

  // --- Edit nickname ---
  const handleSaveNickname = async () => {
    const userRef = doc(db, "users", currentUser.uid);
    const userDoc = await getDoc(userRef);
    const nicknames = userDoc.exists() ? (userDoc.data().nicknames || {}) : {};
    nicknames[friendId] = nickname;
    await updateDoc(userRef, { nicknames });
    setEditNickname(false);

    // Send a notification message in the chat (styled as a system/notification message)
    await addDoc(collection(db, "chats", chatId, "messages"), {
      text: `${currentUser.displayName || "A user"} set a nickname for you: "${nickname}"`,
      senderId: currentUser.uid,
      timestamp: serverTimestamp(),
      isRead: false,
      system: true, // Use this flag to style as a notification in your message rendering
      notificationType: "nickname"
    });
  };

  function handleImageUpload(e) {
  const file = e.target.files[0];
  const reader = new FileReader();
  reader.onloadend = () => {
    setImageDataUri(reader.result);
    setImageDrawer(true);
  };
  reader.readAsDataURL(file);
}

  function handleSendImage() {
  if (imageDataUri) {
    // Save as a message in Firestore:
    addDoc(collection(db, 'chats', chatId, 'messages'), {
      senderId: currentUser.uid,
      type: 'image',
      dataUri: imageDataUri,
      timestamp: serverTimestamp(),
      // ... any additional fields
    });
    setImageDrawer(false);
    setImageDataUri("");
  }
}

function downloadImage(dataUri, id) {
  const link = document.createElement('a');
  link.href = dataUri;
  link.download = `chat-image-${id}.jpg`; // or .png, etc.
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  // Optionally move/save in specific folder for PWA/native
  // Optionally notify, "Saved to gallery"/"Saved to downloads"
}

  async function handleSendMessage(e) {
    e.preventDefault();
    setIsSending(true);
    if (imageDataUri) {
      await addDoc(collection(db, "chats", chatId, "messages"), {
        senderId: currentUser.uid,
        type: "image",
        dataUri: imageDataUri,
        timestamp: serverTimestamp(),
      });
      setImageDrawer(false);
      setImageDataUri("");
      setImageFile(null);
    } else if (input.trim()) {
      await addDoc(collection(db, "chats", chatId, "messages"), {
        senderId: currentUser.uid,
        type: "text",
        text: input.trim(),
        timestamp: serverTimestamp(),
      });
      setInput("");
    }
    setIsSending(false);
  }

  const handlePrev = () => {
    setSelectedIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setSelectedIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const swipeHandlers = useSwipeable({
    onSwipedLeft: handleNext,
    onSwipedRight: handlePrev,
    preventDefaultTouchmoveEvent: true,
    trackMouse: true,
  });

  const imageSrc = images[selectedIndex] || images[0];

  // --- Budget card click handler ---
  const handleBudgetClick = (budgetId) => {
    history(`/budgets/${budgetId}`);
  };

  const Transition = React.forwardRef(function Transition(props, ref) {
    return <Slide direction="up" ref={ref} {...props} />;
  });

  const [openProfile, setOpenProfile] = useState(false);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const toggleDrawer = (open) => (event) => {
    if (event && event.type === 'keydown' && (event.key === 'Tab' || event.key === 'Shift')) return;
    setDrawerOpen(open);
  };

  useEffect(() => {
    if (messages.length > 0) {
      if (isAtBottom) {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      } else {
        // Don't scroll, just show button
        setNewMessagesCount(prev => prev + 1);
      }
    }
  }, [messages]);


  const bottomRef = useRef(null);

    useEffect(() => {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);



  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);


const fetchCommonGroupsAndTrips = async (currentUser, friendId) => {
  if (!currentUser?.uid || !friendId) return;

  // --- Fetch Groups where currentUser is a member ---
  const groupQuery = query(
    collection(db, 'groupChats'),
    where('members', 'array-contains', currentUser.uid)
  );
  const groupSnapshot = await getDocs(groupQuery);

  const matchedGroups = groupSnapshot.docs
    .filter(doc => {
      const members = doc.data().members || [];
      // member arrays can be mixed, make sure elements are string
      return members.map(String).includes(String(friendId));
    })
    .map(doc => ({
      id: doc.id,
      name: doc.data().name ?? "",
      iconURL: doc.data().iconURL ?? "",
      emoji: doc.data().emoji ?? "",
      members: doc.data().members || [],
    }));

  setCommonGroups(matchedGroups);

  // --- Fetch Trips where currentUser is a member ---
  const tripQuery = query(
    collection(db, 'trips'),
    where('members', 'array-contains', currentUser.uid)
  );
  const tripSnapshot = await getDocs(tripQuery);

  const matchedTrips = tripSnapshot.docs
    .filter(doc => {
      const members = doc.data().members || [];
      return members.map(String).includes(String(friendId));
    })
    .map(doc => ({
      id: doc.id,
      name: doc.data().name ?? "",
      from: doc.data().from ?? "",
      location: doc.data().location ?? "",
      startDate: doc.data().startDate ?? "",
      endDate: doc.data().endDate ?? "",
      iconURL: doc.data().iconURL ?? ""
    }));

  setCommonTrips(matchedTrips);
};

useEffect(() => {
  if (currentUser && friendDetails?.uid) {
    fetchCommonGroupsAndTrips({
      currentUser,
      friendDetails,
      setCommonGroups,
      setCommonTrips,
    });
  }
}, [currentUser, friendDetails]);

useEffect(() => {
  // Get all unique member UIDs for all common groups
  const allUids = [...new Set(commonGroups.flatMap(g => g.members || []))];
  if (allUids.length === 0) {
    setGroupMembersInfo({});
    return;
  }
  const fetchMembers = async () => {
    const map = {};
    await Promise.all(
      allUids.map(async uid => {
        const snap = await getDoc(doc(db, "users", uid));
        if (snap.exists()) map[uid] = snap.data();
      })
    );
    setGroupMembersInfo(map);
  };
  fetchMembers();
}, [commonGroups]);

useEffect(() => {
  if (!commonTrips || commonTrips.length === 0) return;

  // Reset when trips change
  setTimelineStatsMap({});

  commonTrips.forEach(async (trip) => {
    const snap = await getDocs(collection(db, "trips", trip.id, "timeline"));
    const events = snap.docs.map(d => d.data());
    const total = events.length || 1;
    const completed = events.filter(e => e.completed === true).length;
    const percent = Math.round((completed / total) * 100);
    setTimelineStatsMap(prev => ({
      ...prev,
      [trip.id]: { completed, total, percent }
    }));
  });
}, [commonTrips]);


useEffect(() => {
  const fetchSharedBudgets = async () => {
    if (!currentUser?.uid || !friendId) return;

    // 1. Get all budgets.
    const q = collection(db, "budgets");
    const snap = await getDocs(q);

    // 2. Filter for budgets where both users are contributors.
    const shared = snap.docs
      .filter(doc => {
        const contributors = Array.isArray(doc.data().contributors) ? doc.data().contributors : [];
        // Defensive: Check for .uid property in contributor objects
        const contributorUids = contributors
          .map(c => typeof c === "object" && c && c.uid ? String(c.uid) : null)
          .filter(Boolean);
        return contributorUids.includes(String(currentUser.uid)) &&
               contributorUids.includes(String(friendId));
      })
      .map(doc => ({
        id: doc.id,
        name: doc.data().name || doc.data().tripName,
        total: doc.data().total || "N/A",
        contributors: doc.data().contributors || [],
      }));

    setSharedBudgets(shared);
  };
  fetchSharedBudgets();
}, [currentUser, friendId]);

// Usage in your component
useEffect(() => {
  if (currentUser && friendId) {
    fetchCommonGroupsAndTrips(currentUser, friendId);
  }
}, [currentUser, friendId]);


  useEffect(() => {
    const fetchUserDetails = async () => {
      const userDoc = await getDoc(doc(db, "users", friendId));
      if (userDoc.exists()) setFriendDetails(userDoc.data());
    };
    fetchUserDetails();
  }, [friendId]);

  useEffect(() => {
    if (!chatId) return;
  
    const q = query(collection(db, "chats", chatId, "messages"), orderBy("timestamp", "asc"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const msgs = [];
      querySnapshot.forEach((doc) => {
        const msg = doc.data();
        msg.id = doc.id;
        msgs.push(msg);
      });
      setMessages(msgs);
  
      const lastMessage = msgs[msgs.length - 1];
      if (lastMessage && lastMessage.senderId !== currentUser?.uid && !lastMessage.isRead) {
        updateDoc(doc(db, "chats", chatId, "messages", lastMessage.id), {
          isRead: true
        });
      }
    });
  
    return () => unsubscribe();
  }, [chatId, currentUser]);
  

const sendMessage = async (e) => {
  e.preventDefault();
  if (!input.trim() && !selectedImage) return; // ensure there's text or image
  setIsSending(true);

  const messageData = {
    senderId: currentUser.uid,
    timestamp: serverTimestamp(),
    isRead: false,
    replyTo: replyingTo
      ? {
          id: replyingTo.id,
          text: replyingTo.text || replyingTo.imageUrl || "",
          senderId: replyingTo.senderId,
          imageUrl: replyingTo.imageUrl || null,
        }
      : null,
  };

  if (editMessageId) {
    await updateDoc(doc(db, "chats", chatId, "messages", editMessageId), {
      ...messageData,
      text: input.trim() || "",
      imageUrl: selectedImage || null,
      edited: true,
    });
    setEditMessageId(null);
  } else {
    // Add new message
    await addDoc(collection(db, "chats", chatId, "messages"), {
      ...messageData,
      text: input.trim() || "",
      imageUrl: selectedImage || null,
    });

    // Save notification for the receiver
    await addDoc(collection(db, "notifications"), {
      uid: friendId,
      type: "chat",
      title: (currentUser.displayName || "A user") + " sent a new message",
      pic: currentUser.photoURL || "",
      content: input.trim() || (selectedImage ? "📷 Image" : ""),
      timestamp: serverTimestamp(),
      seen: false,
      senderId: currentUser.uid,
    });
  }

  // Reset input & image
  setInput("");
  setSelectedImage(null);
  setIsSending(false);
};

  const handleEdit = (msg) => {
    setInput(msg.text || "");
    setEditMessageId(msg.id);
  };

  const handleDelete = async (msgId) => {
    await deleteDoc(doc(db, "chats", chatId, "messages", msgId));
  };

  const handleContextMenu = (event, msg) => {
    event.preventDefault();
    if (msg.senderId === currentUser.uid || msg.senderId === friendId) {
      setAnchorEl(event.currentTarget);
      setSelectedMsg(msg);
    }
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedMsg(null);
  };

  // --- Update handleReaction to support multiple reactions per message ---
  const handleReaction = async (emoji, msg = reactionMsg || selectedMsg) => {
    if (!msg) return;
    const reactions = msg.reactions || [];
    const userId = currentUser.uid;

    // Remove any previous reaction by this user (regardless of emoji)
    let updated = reactions.filter(r => r.user !== userId);

    // Add the new reaction
    updated.push({ emoji, user: userId });

    await updateDoc(doc(db, "chats", chatId, "messages", msg.id), {
      reactions: updated
    });

    setShowEmojiPicker(false);
    setReactionAnchorEl(null);
    setReactionMsg(null);
    handleMenuClose();
  };

const removeUserReaction = async (msg, emoji) => {
  if (!msg || !msg.reactions) return;
  const userId = currentUser.uid;
  // Keep all reactions except the one with this emoji and user
  const updated = msg.reactions.filter(
    r => !(r.emoji === emoji && r.user === userId)
  );
  await updateDoc(doc(db, "chats", chatId, "messages", msg.id), {
    reactions: updated
  });
};


  const getMessageDate = (timestamp) => {
    const date = new Date(timestamp?.toDate());
    return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
  };

  const goBack = () => {
    history(-1);
  };

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  if (authLoading || !currentUser) {
    return (
      <Box sx={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', color: effectiveChatTheme === "dark" ? "#fff" : "#000" }}>
        <CircularProgress color="inherit" />
      </Box>
    );
  }
  
  return (
    <ThemeProvider theme={theme}>
          <Box sx={{ backgroundColor: '#21212100', height: '98vh', display: 'flex', flexDirection: 'column', color: effectiveChatTheme === "dark" ? "#fff" : "#000" }}>
      
      {/* Header */}
      <AppBar
        position="fixed"
        sx={{
          background: effectiveChatTheme === "dark" ? 'linear-gradient(to bottom, #000000, #000000d9, #000000c9, #00000090, #00000000)' : 'linear-gradient(to bottom, #ffffff, #ffffffd9, #ffffffc9, #ffffff90, #ffffff00)',
          backdropFilter: 'blur(0px)',
          padding: '18px 10px 10px 10px',
          borderBottom: "none",
          zIndex: 1100,
          boxShadow: "none",
        }}
        elevation={1}
      >
        <Box display={"flex"} justifyContent={"space-between"} alignItems={"center"}>
          <Box display={"flex"} alignItems={"center"}>
          <IconButton onClick={goBack} sx={{ mr: 1, color: effectiveChatTheme === "dark" ? "#fff" : "#000" }}>
            <ArrowBackIcon />
          </IconButton>
          <Avatar src={friendDetails.photoURL} alt={friendDetails.name} sx={{ mr: 2, height: '40px', width: '40px' }} />
          <Box onClick={() => setOpenProfile(true)}>
            <Typography variant="h6" color={effectiveChatTheme === "dark" ? "#fff" : "#000"} fontSize="14px">
              {nickname ? nickname : friendDetails.name}
            </Typography>
            <Typography variant="h6" color={effectiveChatTheme === "dark" ? "#aaa" : "#333"} fontSize="10px">@{friendDetails.username}</Typography>
            <Typography variant="body2" sx={{ color: friendDetails.status === 'online' ? '#AEEA00' : '#BDBDBD' }}>
              {friendDetails.status}
            </Typography>
          </Box>
          </Box>
                  <IconButton
                    sx={{ color: effectiveChatTheme === "dark" ? "#fff" : "#000", backgroundColor: effectiveChatTheme === "dark" ? "#181818" : "#d6d6d6ff", backdropFilter: "blur(80px)", borderRadius: 8, py: 1, px: 1, display: "flex", alignItems: "center", mr: 2 }}
                    onClick={() => window.open(`tel:${friendDetails.mobile}`, '_blank')}
                    disabled={!friendDetails.mobile}
                  >
                    <PhoneOutlinedIcon />
                  </IconButton>
        </Box>
      </AppBar>

      {/* Messages */}
      <Box
        ref={scrollContainerRef}
        sx={{
          backgroundImage: getWallpaperUrl(),
          backgroundColor: getWallpaperUrl() === 'none'
              ? (effectiveChatTheme === 'dark' ? '#0c0c0c' : '#f0f2f5')
              : 'transparent',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          flex: 1,
          overflowY: 'auto',
          px: 2,
          pt: '80px',
          pb: '80px',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <AnimatePresence initial={false}>
          {messages.map((msg, index) => {
            const isOwn = msg.senderId === currentUser.uid;
            const showDate =
              index === 0 ||
              getMessageDate(msg.timestamp) !== getMessageDate(messages[index - 1].timestamp);

            // System/notification message style
            if (msg.system) {
              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20, transition: { duration: 0.2 } }}
                  transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                  style={{
                    display: 'flex',
                    justifyContent: 'center',
                    margin: '10px 0'
                  }}
                >
                  <Paper
                    elevation={0}
                    sx={{
                      px: 1,
                      py: 1,
                      bgcolor: effectiveChatTheme === "dark" ? "#f1f1f111" : "#00000011",
                      backdropFilter: "blur(80px)",
                      color: effectiveChatTheme === "dark" ? "#fff" : "#000",
                      borderRadius: '12px',
                      fontStyle: 'italic',
                      fontSize: '0.95em',
                      opacity: 0.85,
                      boxShadow: 'none',
                      textAlign: "center"
                    }}
                  >
                    {msg.text}
                  </Paper>
                </motion.div>
              );
            }

            return (
              <motion.div
                key={msg.id}
                ref={el => { messageRefs.current[msg.id] = el; }}
                className={`message-container ${isOwn ? 'own' : ''}`}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                onDragStart={() => setDraggedMsgId(msg.id)}
                onDragEnd={(event, info) => {
                  setDraggedMsgId(null); // Hide icon after drag
                  if (info.offset.x > 100) {
                    setReplyingTo(msg);
                  }
                  controls.start({ x: 0 });
                }}
                animate="visible"
                initial="hidden"
                exit="exit"
                variants={messageVariants}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                style={{ touchAction: 'pan-y',
                ...(highlightedMsgId === msg.id && {
                    boxShadow: "none",
                    padding: 2,
                    borderRadius: 12,
                    background: theme.palette.primary.mainbg,
                    transition: "background 1.5s ease-in-out",
                  })
                }}
              >
                {showDate && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    style={{
                      width: '100%',
                      display: 'flex',
                      justifyContent: 'center',
                      marginBottom: 0,
                      marginTop: 15
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{ color: effectiveChatTheme === "dark" ? "#aaa" : "#333", backgroundColor: effectiveChatTheme === "dark" ? "#f1f1f111" : "#88888811", backdropFilter: "blur(120px)", px: 1, borderRadius: 8, textAlign: 'center' }}
                    >
                      {getMessageDate(msg.timestamp)}
                    </Typography>
                  </motion.div>
                )}

                <Box
                  onContextMenu={(e) => handleContextMenu(e, msg)}
                  onDoubleClick={() => isOwn && handleEdit(msg)}
                  sx={{
                    display: 'flex',
                    justifyContent: isOwn ? 'flex-end' : 'flex-start',
                    mb: 2,
                  }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: isOwn ? 'flex-end' : 'flex-start',
                      maxWidth: '90%',
                      position: 'relative',
                    }}>
{msg.replyTo && (
  <Box
    sx={{
      border: effectiveChatTheme === "dark" ? '1px solid #6565659d' : '1px solid #9f9f9fff',
      borderLeft: effectiveChatTheme === "dark" ? '4px solid #00f72172' : '4px solid #057c1572',
      px: 1.5,
      py: 0.2,
      mb: 0.3,
      bgcolor: effectiveChatTheme === "dark" ? '#4a4a4a00' : "#ececec70",
      backdropFilter: 'blur(24px)',
      color: effectiveChatTheme === "dark" ? "#fff" : "#222",
      borderRadius: 2,
      boxShadow: effectiveChatTheme === "dark"
        ? "0 2px 8px #0002"
        : "0 2px 8px #8881",
      display: "flex",
      flexDirection: "column",
      gap: 0.2,
      maxWidth: "95%",
    }}
    onClick={() => {
      const replyId = msg.replyTo.id;
      const el = messageRefs.current[replyId];
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        setHighlightedMsgId(replyId);
        setTimeout(() => setHighlightedMsgId(null), 1200);
      }
    }}
  >
    <Box sx={{ display: "flex", alignItems: "center", gap: 0.3, mb: 0 }}>
      <Typography
        variant="caption"
        sx={{
          fontWeight: 700,
          color: effectiveChatTheme === "dark" ? "#00f721ab" : "#057c1572",
          letterSpacing: 0.2,
        }}
      >
        {msg.replyTo.senderId === currentUser.uid
          ? (msg.senderId === currentUser.uid ? "You (self)" : "You")
          : friendDetails.name}
      </Typography>
    </Box>

    {/* Show text if available, otherwise show image preview */}
    {msg.replyTo.text ? (
      <Typography
        variant="body2"
        sx={{
          color: effectiveChatTheme === "dark" ? "#919191ff" : "#7c7c7cff",
          fontStyle: 'italic',
          fontSize: "0.97em",
          wordBreak: "break-word",
        }}
      >
        {msg.replyTo.text.length > 60
          ? msg.replyTo.text.slice(0, 30) + "..."
          : msg.replyTo.text}
      </Typography>
    ) : msg.replyTo.imageUrl ? (
      <Box
        component="img"
        src={msg.replyTo.imageUrl}
        alt="reply preview"
        sx={{
          maxWidth: 120,
          maxHeight: 120,
          borderRadius: 1,
          mt: 0.5,
        }}
      />
    ) : null}
  </Box>
)}

<Dialog
  open={openViewer}
  onClose={() => setOpenViewer(false)}
  fullScreen
  PaperProps={{
    sx: {
      backgroundColor: mode === "dark" ? "#00000000" : "#ffffffb2",
      overflow: "hidden",
      backgroundImage: "none"
    },
  }}
>
  <Box
    sx={{
      position: "relative",
      height: "100%",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      backdropFilter: "blur(5px)",
      p: 3,
    }}
  >
    {/* Close Button */}
    <IconButton
      onClick={() => setOpenViewer(false)}
      sx={{
        position: "absolute",
        top: 20,
        right: 20,
        bgcolor: "rgba(0,0,0,0.4)",
        color: "white",
        border: "1px solid rgba(255,255,255,0.2)",
        backdropFilter: "blur(6px)",
        "&:hover": { bgcolor: "rgba(255,255,255,0.15)" },
      }}
    >
      <CloseIcon />
    </IconButton>

    {/* Left Arrow */}
    <IconButton
      onClick={handlePrev}
      sx={{
        position: "absolute",
        left: 20,
        color: "white",
        bgcolor: "rgba(0,0,0,0.4)",
        "&:hover": { bgcolor: "rgba(0,0,0,0.6)" },
      }}
    >
      <ArrowBackIosNewIcon />
    </IconButton>

    {/* Right Arrow */}
    <IconButton
      onClick={handleNext}
      sx={{
        position: "absolute",
        right: 20,
        color: "white",
        bgcolor: "rgba(0,0,0,0.4)",
        "&:hover": { bgcolor: "rgba(0,0,0,0.6)" },
      }}
    >
      <ArrowForwardIosIcon />
    </IconButton>

    {/* Full Image */}
    <Zoom in={openViewer} style={{ transitionDelay: "100ms" }}>
      <Box
        {...swipeHandlers}
        component="img"
        src={images[selectedIndex]}
        alt="full-view"
        sx={{
          maxWidth: "90%",
          maxHeight: "75%",
          borderRadius: 4,
          boxShadow: "none",
          objectFit: "contain",
          transition: "transform 0.4s ease, box-shadow 0.4s ease",
          "&:hover": {
            transform: "scale(1.02)",
            boxShadow: "none",
          },
        }}
      />
    </Zoom>

    {/* Bottom Thumbnail Navigator */}
    <Box
      sx={{
        mt: 4,
        display: "flex",
        overflowX: "auto",
        gap: 1.5,
        p: 1,
        px: 2,
        bgcolor: "rgba(0,0,0,0.4)",
        borderRadius: 4,
        backdropFilter: "blur(10px)",
        boxShadow: "none",
      }}
    >
      {images.map((img, i) => (
        <Box
          key={i}
          component="img"
          src={img}
          alt={`thumb-${i}`}
          onClick={() => setSelectedIndex(i)}
          sx={{
            width: 70,
            height: 70,
            borderRadius: 2,
            cursor: "pointer",
            objectFit: "cover",
            border: selectedIndex === i ? "2px solid white" : "2px solid transparent",
            opacity: selectedIndex === i ? 1 : 0.6,
            transition: "all 0.3s ease",
            "&:hover": { opacity: 1 },
          }}
        />
      ))}
    </Box>
  </Box>
</Dialog>

                  <Paper
                    elevation={1}
                    sx={{
                      px: 0.5,
                      py: 0.5,
                      maxWidth: '70%',
                      minWidth: "100px",
                      bgcolor: isOwn ? effectiveChatTheme === "dark" ? "#005c4b" : "#d9fdd3" : effectiveChatTheme === "dark" ? "#353535" : "#ffffff",
                      borderRadius: isOwn ? '16px 4px 16px 16px' : '4px 16px 16px 16px',
                      color: effectiveChatTheme === "dark" ? "#fff" : "#000",
                      position: 'relative',
                      boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.15)',
                    }}
                  >

      {msg.type === "image" ? (
        <Card
          sx={{
            borderRadius: "16px",
            position: "relative",
            overflow: "hidden",
            boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
            cursor: "pointer",
            "&:hover .overlay": { opacity: 1 },
          }}
        >
          {/* Image */}
          <CardMedia
            component="img"
            image={msg.dataUri}
            alt="chat-img"
            sx={{
              width: "100%",
              height: "auto",
              borderRadius: "16px",
              transition: "transform 0.3s ease",
              "&:hover": {
                transform: "scale(1.02)",
              },
            }}
            onClick={() => setOpenViewer(true)}
          />

          {/* Hover Overlay (Download Button) */}
          <Box
            className="overlay"
            sx={{
              position: "absolute",
              bottom: 8,
              right: 8,
              opacity: 0,
              transition: "opacity 0.3s ease",
            }}
          >
            <IconButton
              onClick={() => downloadImage(msg.dataUri, msg.id)}
              sx={{
                bgcolor: "rgba(0,0,0,0.6)",
                color: "white",
                "&:hover": { bgcolor: "rgba(0,0,0,0.8)" },
              }}
            >
              <DownloadIcon />
            </IconButton>
          </Box>
        </Card>
      ) : (
        <Typography
          variant="body1"
          sx={{ fontSize: `${chatFontSize}px`, px: 2 }}
        >
          {msg.text}
        </Typography>
      )}
      
                    {msg.reactions && msg.reactions.length > 0 && (
                      <Box
                        sx={{
                          display: 'flex',
                          gap: 0.5,
                          alignItems: 'center',
                          position: 'absolute',
                          bottom: -8,
                          right: 5,
                          zIndex: 2,
                          borderRadius: '12px',
                        }}
                      >
                        {Object.entries(getGroupedReactions(msg)).map(([emoji, users]) => (
<Chip
  key={emoji}
  label={    <span style={{
      fontSize: '0.8rem',
      fontWeight: 700,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '100%',
      height: '100%',
      letterSpacing: 0,
      userSelect: 'none'
    }}>
      {emoji}
    </span>}
  size="small"
  sx={{
    bgcolor: effectiveChatTheme === "dark" ? "#353535" : "#ffffff",
    color: effectiveChatTheme === "dark" ? "#fff" : "#222",
    borderRadius: '25px',
    cursor: 'pointer',
    border: effectiveChatTheme === "dark" ? '1.5px solid #000000ff' : '1.5px solid #d3d3d3ff',
    height: 20,
    width: 20,
    minWidth: 0,
    minHeight: 0,
    boxShadow: effectiveChatTheme === "dark"
      ? "0 2px 8px #000a"
      : "0 2px 8px #8882",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.18s cubic-bezier(0.4,0,0.2,1)",
    '&:hover': {
      bgcolor: effectiveChatTheme === "dark" ? "#444" : "#f5f5f5",
      borderColor: effectiveChatTheme === "dark" ? "#b2b2b2ff" : "#565656ff",
      transform: "scale(1.13)",
      boxShadow: effectiveChatTheme === "dark"
        ? "0 4px 16px #000c"
        : "0 4px 16px #1976d233",
    },
    m: 0.2,
    p: 0,
  }}
  onClick={(e) => {
    setReactionAnchorEl(e.currentTarget);
    setReactionMsg(msg);
  }}
/>
                        ))}
                      </Box>
                    )}

                  </Paper>
                    <Typography
                      variant="caption"
                      sx={{
                        fontSize: '0.7rem',
                        width: '75%',
                        minWidth: "100px",
                        color: effectiveChatTheme === "dark" ? "#ccc" : "#555",
                        mt: 0.5,
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center"
                      }}
                    >
                      {msg.timestamp?.toDate().toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}


                      {isOwn && (
                        <Box sx={{ textAlign: 'right', display: "flex", alignItems: "center", gap: 1 }}>
                      {msg.edited && (
                        <Typography
                        variant="caption"
                        sx={{ color: "#888", ml: 1, fontStyle: "italic" }}
                        >
                          edited
                        </Typography>
                      )}
                          <DoneAllIcon
                            fontSize="small"
                            sx={{ color: msg.isRead ? '#00b7ffff' : '#7b7b7bff' }}
                          />
                        </Box>
                      )}
                    </Typography>
                    </Box>
                  <div ref={messagesEndRef} />
                </Box>
                
                  {!isAtBottom && newMessagesCount > 0 && (
                    <button
                      className="scroll-to-bottom-btn"
                      onClick={() => {
                        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
                        setNewMessagesCount(0);
                      }}
                    >
                      ↓ {newMessagesCount} New Message{newMessagesCount > 1 ? 's' : ''}
                    </button>
                  )}
              </motion.div>
            );
          })}
        </AnimatePresence>

        <div ref={messagesEndRef} />
      </Box>

{replyingTo && (
  <Paper
    sx={{
      p: 1,
      position: "relative",
      bottom: "55px",
      width: "90vw",
      mx: "auto",
      bgcolor:
        effectiveChatTheme === "dark" ? "#2b2b2bc0" : "#dadadac0",
      boxShadow: "none",
      mb: 1,
      borderLeft:
        effectiveChatTheme === "dark"
          ? "4px solid #00f721"
          : "4px solid #057c15ff",
      backdropFilter: "blur(80px)",
      borderRadius: "11px",
      zIndex: 1000,
    }}
  >
    <Box display="flex" justifyContent="space-between" alignItems="center">
      <Box>
        <Typography
          variant="caption"
          color={
            effectiveChatTheme === "dark" ? "#00f721" : "#057c15ff"
          }
        >
          Replying to{" "}
          {replyingTo.senderId === currentUser.uid
            ? "Self"
            : friendDetails.name}
        </Typography>

        {/* If text exists → show text */}
        {replyingTo.text ? (
          <Typography
            variant="body2"
            sx={{
              color:
                effectiveChatTheme === "dark"
                  ? "#e7e7e7ff"
                  : "#242424ff",
            }}
          >
            {replyingTo.text.length > 60
              ? replyingTo.text.slice(0, 60) + "..."
              : replyingTo.text}
          </Typography>
        ) : replyingTo.imageUrl ? (
          /* If image → show thumbnail */
          <Box
            component="img"
            src={replyingTo?.imageUrl}
            alt="reply preview"
            sx={{
              maxWidth: 100,
              maxHeight: 100,
              borderRadius: 1,
              mt: 0.5,
              cursor: "pointer",
            }}
            onClick={() => {
              // Optional: open your fullscreen image viewer here
              setSelectedImage(replyingTo?.imageUrl);
              setOpenViewer(true);
            }}
          />
        ) : null}
      </Box>

      {/* Close button */}
      <IconButton onClick={() => setReplyingTo(null)}>
        <CloseIcon
          fontSize="small"
          sx={{
            color: effectiveChatTheme === "dark" ? "#fff" : "#000",
          }}
        />
      </IconButton>
    </Box>
  </Paper>
)}


          <div ref={bottomRef} />
      {/* Input Field */}
      <Box
        component="form"
        onSubmit={sendMessage}
        sx={{
          p: 1,
          mx: 'auto',
          display: 'flex',
          position: 'fixed',
          bottom: 0,
          left: 0,
          width: '95vw',
          alignItems: 'center',
          zIndex: '1200',
          borderTop: '0px solid #5E5E5E',
          background: effectiveChatTheme === "dark" ? 'linear-gradient(to top, #000000, #000000d9, #000000c9, #00000090, #00000000)' : 'linear-gradient(to top, #ffffff, #ffffffd9, #ffffffc9, #ffffff90, #ffffff00)',
        }}
      >
<Button
  component="label"
  size="large"
  sx={{
    minWidth: 0,
    borderRadius: "50%",
    bgcolor: "rgba(255,255,255,0.08)",
    backdropFilter: "blur(8px)",
    color: "white",
    boxShadow: "0 4px 20px rgba(0,0,0,0.25)",
    transition: "all 0.3s ease",
    "&:hover": {
      bgcolor: "rgba(255,255,255,0.15)",
      transform: "scale(1.1)",
      boxShadow: "0 6px 25px rgba(0,0,0,0.35)",
    },
    "&:active": {
      transform: "scale(0.95)",
    },
  }}
>
  <CameraAltOutlinedIcon sx={{ fontSize: 24 }} />
  <input
    type="file"
    accept="image/*"
    hidden
    onChange={handleImageUpload}
  />
</Button>


        <TextField
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={editMessageId ? "Editing message..." : "Type your message..."}
          fullWidth
          variant="outlined"
          size="small"
          position="fixed"
          elevation={1}
          sx={{
            zIndex: '1500',
            mr: 1,
            borderRadius: '40px',
            input: {
              color: effectiveChatTheme === "dark" ? "#fff" : "#000",
              height: '28px',
              borderRadius: '40px',
              backdropFilter: "blur(30px)",
            },
            '& .MuiOutlinedInput-root': {
              '& fieldset': {
                borderColor: '#5E5E5E',
                borderRadius: '40px'
              },
              '&:hover fieldset': {
                borderColor: '#393939ff',
                borderRadius: '40px'
              },
              '&.Mui-focused fieldset': {
                borderColor: '#757575',
                borderRadius: '40px'
              },
            },
            '& .MuiInputBase-input::placeholder': {
              color: effectiveChatTheme === "dark" ? "#cccccc" : "#343434ff"
            }
          }}
        />
        <Button type="submit" sx={{ backgroundColor: effectiveChatTheme === "dark" ? "#fff" : "#000", height: '45px', width: '30px', borderRadius: 8, }} disabled={isSending}>
          {isSending ? <CircularProgress size={24} sx={{ color: effectiveChatTheme === "dark" ? "#000" : "#fff" }} /> : <SendIcon sx={{ color: effectiveChatTheme === "dark" ? "#000" : "#fff" }} />}
        </Button>
      </Box>

      {/* Context Menu */}
<Menu
  anchorEl={anchorEl}
  open={Boolean(anchorEl)}
  onClose={handleMenuClose}
  PaperProps={{
    sx: {
      minWidth: 220,
      borderRadius: 4,
      bgcolor: effectiveChatTheme === "dark" ? "#18181823" : "#ffffff43",
      color: effectiveChatTheme === "dark" ? "#fff" : "#222",
      boxShadow: effectiveChatTheme === "dark" ? "0 8px 32px #000b" : "0 8px 32px #8882",
      p: 1,
      backdropFilter: effectiveChatTheme === "dark" ? 'blur(18px)' : 'blur(8px)',
      border: effectiveChatTheme === "dark" ? '1.5px solid #232323' : '1.5px solid #e0e0e0',
      overflow: 'hidden',
      transition: "box-shadow 0.3s, background 0.3s",
    },
  }}
>
  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, px: 1, py: 0.5 }}>
    {['❤️', '😂', '👍', '😁', '👌'].map((emoji) => (
      <IconButton
        key={emoji}
        onClick={() => {
          handleReaction(emoji, selectedMsg);
          handleMenuClose();
        }}
        sx={{
          width: 38,
          height: 38,
          fontSize: 20,
          bgcolor: effectiveChatTheme === "dark" ? 'rgba(41,41,41,0.85)' : '#f7f7f7',
          borderRadius: 2,
          color: effectiveChatTheme === "dark" ? "#fff" : "#222",
          backdropFilter: effectiveChatTheme === "dark" ? 'blur(10px)' : 'blur(2px)',
          border: effectiveChatTheme === "dark" ? '1.5px solid #232323' : '1.5px solid #e0e0e0',
          boxShadow: effectiveChatTheme === "dark" ? '0 2px 8px #0004' : '0 2px 8px #bbb2',
          transition: 'all 0.18s cubic-bezier(0.4,0,0.2,1)',
          '&:hover': {
            bgcolor: effectiveChatTheme === "dark" ? '#333' : '#e0e0e0',
            borderColor: effectiveChatTheme === "dark" ? '#444' : '#bdbdbd'
          },
        }}
      >
        {emoji}
      </IconButton>
    ))}
    <IconButton
      onClick={() => {
        setShowEmojiPicker(true);
        handleMenuClose();
      }}
      sx={{
        width: 38,
        height: 38,
        bgcolor: effectiveChatTheme === "dark" ? '#292929d9' : '#ffffffff',
        borderRadius: 2,
        color: effectiveChatTheme === "dark" ? "#fff" : "#222",
        border: effectiveChatTheme === "dark" ? '1.5px solid #232323' : '1.5px solid #e0e0e0',
        boxShadow: effectiveChatTheme === "dark" ? '0 2px 8px #0004' : '0 2px 8px #bbb2',
        backdropFilter: effectiveChatTheme === "dark" ? 'blur(10px)' : 'blur(2px)',
        transition: 'all 0.18s cubic-bezier(0.4,0,0.2,1)',
        '&:hover': {
          bgcolor: effectiveChatTheme === "dark" ? '#333' : '#e0e0e0',
          borderColor: effectiveChatTheme === "dark" ? '#444' : '#bdbdbd'
        },
      }}
    >
      <AddIcon fontSize="small" />
    </IconButton>
  </Box>

  <Divider sx={{ my: 1, bgcolor: effectiveChatTheme === "dark" ? '#333' : '#e0e0e0', borderRadius: 2 }} />

  <MenuItem
    onClick={() => {
      setReplyingTo(selectedMsg);
      handleMenuClose();
    }}
    sx={{
      fontWeight: 500,
      fontSize: 15,
      borderRadius: 2,
      mx: 0.5,
      my: 0.2,
      backdropFilter: effectiveChatTheme === "dark" ? 'blur(8px)' : 'blur(2px)',
      color: effectiveChatTheme === "dark" ? "#fff" : "#222",
      '&:hover': { bgcolor: effectiveChatTheme === "dark" ? '#232323' : '#ffffffff' },
      transition: 'background 0.2s',
      display: 'flex',
      alignItems: 'center',
      gap: 1,
    }}
  >
    <ReplyIcon fontSize="small" sx={{ color: effectiveChatTheme === "dark" ? "#fff" : "#222" }} />
    Reply
  </MenuItem>

  {selectedMsg?.senderId === currentUser.uid && (
    <>
      <MenuItem
        onClick={() => {
          handleEdit(selectedMsg);
          handleMenuClose();
        }}
        sx={{
          fontWeight: 500,
          fontSize: 15,
          borderRadius: 2,
          mx: 0.5,
          my: 0.2,
          backdropFilter: effectiveChatTheme === "dark" ? 'blur(8px)' : 'blur(2px)',
          color: effectiveChatTheme === "dark" ? "#fff" : "#222",
          '&:hover': { bgcolor: effectiveChatTheme === "dark" ? '#232323' : '#ffffffff' },
          display: 'flex',
          alignItems: 'center',
          gap: 1,
        }}
      >
        <EditIcon fontSize="small" sx={{ color: effectiveChatTheme === "dark" ? "#fff" : "#222" }} />
        Edit
      </MenuItem>
      <MenuItem
        onClick={() => {
          handleDelete(selectedMsg?.id);
          handleMenuClose();
        }}
        sx={{
          color: '#ff4444',
          fontWeight: 500,
          fontSize: 15,
          borderRadius: 2,
          mx: 0.5,
          my: 0.2,
          backdropFilter: effectiveChatTheme === "dark" ? 'blur(8px)' : 'blur(2px)',
          '&:hover': { bgcolor: effectiveChatTheme === "dark" ? '#2a1818' : '#ffe2e2ff' },
          display: 'flex',
          alignItems: 'center',
          gap: 1,
        }}
      >
        <DeleteOutlineIcon fontSize="small" sx={{ color: '#ff4444' }} />
        Delete
      </MenuItem>
    </>
  )}

  <Divider sx={{ my: 0.5, bgcolor: effectiveChatTheme === "dark" ? '#333' : '#e0e0e0', borderRadius: 2 }} />

  <MenuItem
    onClick={() => {
      navigator.clipboard.writeText(selectedMsg?.text || '');
      setNotification('Message copied!');
      handleMenuClose();
    }}
    sx={{
      fontSize: 15,
      borderRadius: 2,
      mx: 0.5,
      my: 0.2,
      backdropFilter: effectiveChatTheme === "dark" ? 'blur(8px)' : 'blur(2px)',
      color: effectiveChatTheme === "dark" ? "#fff" : "#222",
      '&:hover': { bgcolor: effectiveChatTheme === "dark" ? '#232323' : '#ffffffff' },
      display: 'flex',
      alignItems: 'center',
      gap: 1,
    }}
  >
    <ContentCopyIcon fontSize="small" sx={{ color: effectiveChatTheme === "dark" ? "#fff" : "#222" }} />
    Copy Text
  </MenuItem>

  {selectedMsg?.text?.length > 10 && (
    <MenuItem
      onClick={() => {
        window.open(
          `https://www.google.com/search?q=${encodeURIComponent(selectedMsg.text)}`,
          '_blank'
        );
        handleMenuClose();
      }}
      sx={{
        fontSize: 15,
        borderRadius: 2,
        mx: 0.5,
        my: 0.2,
        backdropFilter: effectiveChatTheme === "dark" ? 'blur(8px)' : 'blur(2px)',
        color: effectiveChatTheme === "dark" ? "#fff" : "#222",
        '&:hover': { bgcolor: effectiveChatTheme === "dark" ? '#232323' : '#ffffffff' },
        display: 'flex',
        alignItems: 'center',
        gap: 1,
      }}
    >
      <SearchIcon fontSize="small" sx={{ color: effectiveChatTheme === "dark" ? "#fff" : "#222" }} />
      Search on Google
    </MenuItem>
  )}
</Menu>

      <SwipeableDrawer
        anchor="bottom"
        open={imageDrawer}
        onClose={() => setImageDrawer(false)}
        disableSwipeToOpen={true}
      >
        <Box sx={{ p: 2, textAlign: "center" }}>
          <Typography variant="h6" sx={{ mb: 2 }}>Edit & Send Image</Typography>
          {imageDataUri && (
            <img src={imageDataUri} alt="Preview" style={{ maxWidth: "90%", borderRadius: 10, boxShadow: "0 2px 8px #0004" }} />
          )}
          {/* Hidden TextField for DataURI */}
          <TextField value={imageDataUri} style={{ display: "none" }} />
          <Box sx={{ mt: 2, display: "flex", justifyContent: "center", gap: 2 }}>
            <Button variant="contained" color="primary" onClick={handleSendMessage}>Send</Button>
            <Button startIcon={<CloseIcon />} onClick={() => setImageDrawer(false)}>Cancel</Button>
          </Box>
        </Box>
      </SwipeableDrawer>

<SwipeableDrawer
  anchor="bottom"
  open={Boolean(reactionAnchorEl) && !showEmojiPicker}
  onClose={() => {
    setReactionAnchorEl(null);
    setReactionMsg(null);
  }}
  onOpen={() => {}} // Required for SwipeableDrawer
  disableSwipeToOpen={false}
  disableDiscovery={false}
  PaperProps={{
    sx: {
      minWidth: 220,
      borderRadius: "25px 25px 0 0",
      bgcolor: effectiveChatTheme === "dark" ? "#00000026" : "#ffffffde",
      color: effectiveChatTheme === "dark" ? "#fff" : "#222",
      boxShadow: effectiveChatTheme === "dark" ? "0 12px 32px #000c" : "0 8px 32px #8882",
      p: 2,
      backdropFilter: "blur(40px)",
      border: "none",
      overflow: 'hidden',
      transition: "box-shadow 0.3s, background 0.3s",
    },
  }}
>
  <Box
    sx={{
      width: 40,
      height: 4,
      bgcolor: effectiveChatTheme === "dark" ? '#6a6a6aff' : '#818181ff',
      borderRadius: 3,
      mx: 'auto',
      mb: 1.5,
      opacity: 0.5,
      cursor: "grab"
    }}
  />
  <Typography
    variant="subtitle2"
    sx={{
      color: effectiveChatTheme === "dark" ? "#fff" : "#222",
      textAlign: "center",
      mb: 1,
      letterSpacing: 1,
      fontWeight: 600,
      opacity: 0.8,
      textShadow: effectiveChatTheme === "dark" ? "0 2px 8px #0008" : "none"
    }}
  >
    Reactions
  </Typography>
  <Divider sx={{ mb: 1, bgcolor: "#696969ff", borderRadius: 2 }} />
  <Box sx={{ px: 1, pb: 1 }}>
    {reactionMsg &&
      Object.entries(getGroupedReactions(reactionMsg)).map(([emoji, users]) => (
        users.map((uid, idx) => (
          <MenuItem
            key={emoji + uid}
            sx={{
              display: "flex",
              alignItems: "center",
              borderRadius: 3,
              mx: 0.5,
              my: 0.7,
              px: 2,
              py: 1.2,
              bgcolor: effectiveChatTheme === "dark" ? "#0000003d" : "#31313121",
              color: effectiveChatTheme === "dark"
                ? "#fff"
                : "#222",
              fontWeight: 500,
              fontSize: 17,
              boxShadow: "none",
              backdropFilter: effectiveChatTheme === "dark" ? 'blur(8px)' : 'blur(2px)',
              border: "none",
              transition: "background 0.2s",
              '&:hover': {
                bgcolor: effectiveChatTheme === "dark" ? '#232323' : '#e0e0e0',
                borderColor: effectiveChatTheme === "dark" ? "#444" : "#bdbdbd"
              },
              flexDirection: "column",
              alignItems: "flex-start",
              gap: 0.5,
            }}
            onClick={async () => {
              if (uid === currentUser?.uid) {
                await removeUserReaction(reactionMsg, emoji);
                setReactionAnchorEl(null);
                setReactionMsg(null);
              }
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", width: "100%" }}>
             <Box sx={{ display: "flex", alignItems: "center", flex: 1 }}>
               <Avatar
                src={groupMembersInfo?.[uid]?.photoURL}
                sx={{
                  width: 28,
                  height: 28,
                  mr: 1.2,
                  border: effectiveChatTheme === "dark" ? "2px solid #232323" : "2px solid #e0e0e0",
                  bgcolor: effectiveChatTheme === "dark" ? "#222" : "#fafafa",
                  color: effectiveChatTheme === "dark" ? "#fff" : "#222",
                  fontWeight: 700,
                  fontSize: 18,
                }}
              >
                {groupMembersInfo?.[uid]?.photoURL ? "" : groupMembersInfo?.[uid]?.name?.[0] || "?"}
              </Avatar>
              <Box sx={{ display: "flex", flexDirection: "column", flex: 1 }}>
              <Typography
                variant="body1"
                sx={{
                  fontWeight: 700,
                  color: effectiveChatTheme === "dark" ? "#fff" : "#222",
                  fontSize: 13,
                  flex: 1,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap"
                }}
              >
                {uid === currentUser?.uid
                  ? "You"
                  : groupMembersInfo?.[uid]?.name || "Unknown"}
              </Typography>

            {uid === currentUser?.uid && (
              <Typography
                variant="caption"
                sx={{
                  color: effectiveChatTheme === "dark" ? "#b4b4b4ff" : "#333333ff",
                  fontWeight: 500,
                  opacity: 0.8,
                  fontSize: 10,
                  letterSpacing: 0.1,
                  userSelect: "none"
                }}
              >
                Tap to remove reaction
              </Typography>
            )}
            </Box>
             </Box>
              <span
                style={{
                  fontSize: 22,
                  marginLeft: "auto",
                  marginRight: 2,
                  filter: "none"
                }}
              >
                {emoji}
              </span>
            </Box>
          </MenuItem>
        ))
      ))
    }
    {!reactionMsg && (
      <Typography variant="body2" sx={{ color: effectiveChatTheme === "dark" ? "#bbb" : "#888", textAlign: "center", py: 2 }}>
        No reactions yet.
      </Typography>
    )}
  </Box>
</SwipeableDrawer>

<Popover
  open={showEmojiPicker}
  anchorEl={reactionAnchorEl}
  onClose={() => setShowEmojiPicker(false)}
  anchorOrigin={{
    vertical: 'top',
    horizontal: 'center',
  }}
  transformOrigin={{
    vertical: 'bottom',
    horizontal: 'center',
  }}
  PaperProps={{
    sx: {
      borderRadius: 3,
      bgcolor: "rgba(24,24,24,0.98)",
      boxShadow: "0 8px 32px #000b",
      backdropFilter: 'blur(18px)',
      border: '1.5px solid #232323',
      overflow: 'hidden',
    }
  }}
>
  <EmojiPicker
    onEmojiClick={(emojiData) => {
      handleReaction(emojiData.emoji, reactionMsg);
      setShowEmojiPicker(false);
    }}
    theme={ effectiveChatTheme === "dark" ? "dark" : "light" }
  />
</Popover>

      {/* Notification Snackbar */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            transition={{ duration: 0.3 }}
            style={{
              position: 'fixed',
              top: 20,
              right: 20,
              padding: '10px',
              backgroundColor: '#000',
              color: effectiveChatTheme === "dark" ? "#fff" : "#000",
              borderRadius: '5px',
              zIndex: 1000,
            }}
          >
            <Typography variant="body2">{notification}</Typography>
          </motion.div>
        )}
      </AnimatePresence>

      <Box>
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', stiffness: 100 }}
        >
<Drawer
  anchor="bottom"
  open={openProfile}
  onClose={() => setOpenProfile(false)}
  onOpen={() => {}}
  fullHeight
  PaperProps={{
    sx: {
      border: 'transparent',
      backgroundColor: effectiveChatTheme === "dark" ? '#0c0c0c0a' : '#f1f1f1de',
      backdropFilter: 'blur(70px)',
      color: effectiveChatTheme === "dark" ? "#fff" : "#000",
      maxWidth: 470,
      mx: 'auto',
    },
  }}
>
  <Box sx={{ p: 3, position: 'relative', height: '100%', overflowY: 'auto' }}>

    <Button
      startIcon={<ArrowBackIcon />}
      onClick={() => setOpenProfile(false)}
      sx={{
        mb: 0,
        borderRadius: 8,
        color: effectiveChatTheme === "dark" ? "#fff" : "#000",
        backgroundColor: effectiveChatTheme === "dark" ? "#f1f1f111" : "#0c0c0c11",
        '&:hover': { backgroundColor: "#f1f1f121" },
      }}
    >
      Back
    </Button>

    {/* Profile Section */}
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 2 }}>
      <Avatar src={friendDetails.photoURL} sx={{ width: 90, height: 90, mb: 2 }} />
      <Typography variant="h6" fontWeight="bold" color={effectiveChatTheme === "dark" ? "#fff" : "#000"}>{friendDetails.name}</Typography>
      <Typography variant="subtitle1" sx={{ color: effectiveChatTheme === "dark" ? "#aaa" : "#333" }}>@{friendDetails.username}</Typography>

      <Typography
        variant="body2"
        sx={{
          backgroundColor: effectiveChatTheme === "dark" ? "#f1f1f111" : "#0c0c0c11",
          px: 2,
          py: 0.5,
          borderRadius: 4,
          color: effectiveChatTheme === "dark" ? "#aaa" : "#333",
        }}
      >
        {nickname || friendDetails.name}
      </Typography>

      {friendDetails.bio && (
        <Box
          sx={{
            bgcolor: effectiveChatTheme === "dark" ? "#f1f1f111" : "#0c0c0c11",
            color: effectiveChatTheme === "dark" ? "#aaa" : "#333",
            borderRadius: 1.2,
            py: 1.4,
            px: 2,
            display: 'flex',
            justifyContent: 'left',
            gap: 1.5,
            mt: 1,
          }}
        >
          <Typography variant="body2" textAlign="justify">
            <strong>Bio:</strong> {friendDetails.bio}
          </Typography>
        </Box>
      )}
    </Box>

    
    {/* Action Buttons */}
    <Stack spacing={0.5} mt={3} mb={2} sx={{ backgroundColor: "#f1f1f100", borderRadius: 1, p: 1 }}>
      {/* <IconButton
        onClick={() => window.open(`mailto:${friendDetails.email}`, '_blank')}
        disabled={!friendDetails.email}
        sx={{
          bgcolor: effectiveChatTheme === "dark" ? "#f1f1f111" : "#0c0c0c11",
          color: effectiveChatTheme === "dark" ? "#fff" : "#000",
          py: 1.4,
          px: 2,
          borderRadius: "20px 20px 7px 7px",
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'left',
          gap: 1.5,
        }}
      >
        <EmailOutlinedIcon />
        <Typography variant="body1" sx={{ fontSize: 16, color: effectiveChatTheme === "dark" ? "#aaa" : "#333" }}>
          {friendDetails.email || 'Email not available'}
        </Typography>
      </IconButton> */}

      {friendDetails.mobile && (
        <IconButton
          onClick={() => window.open(`tel:${friendDetails.mobile}`, '_blank')}
          sx={{
            bgcolor: effectiveChatTheme === "dark" ? "#f1f1f111" : "#0c0c0c11",
            color: effectiveChatTheme === "dark" ? "#fff" : "#000",
            py: 1.4,
            px: 2,
            borderRadius: "20px 20px 7px 7px",
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'left',
            gap: 1.5,
          }}
        >
          <PhoneOutlinedIcon />
          <Typography variant="body1" sx={{ fontSize: 16, color: effectiveChatTheme === "dark" ? "#aaa" : "#333" }}>
            {friendDetails.mobile}
          </Typography>
        </IconButton>
      )}

      <IconButton
        onClick={() => setOpenProfile(false)}
        sx={{
          bgcolor: effectiveChatTheme === "dark" ? "#f1f1f111" : "#0c0c0c11",
          color: effectiveChatTheme === "dark" ? "#fff" : "#000",
          py: 1.4,
          px: 2,
          borderRadius: "7px",
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'left',
          gap: 1.5,
        }}
      >
        <ChatOutlinedIcon />
        <Typography variant="body1" sx={{ fontSize: 16, color: effectiveChatTheme === "dark" ? "#aaa" : "#333" }}>
          Send a Message
        </Typography>
      </IconButton>

      <IconButton
        onClick={() => {
          setAddNicknameDrawerOpen(true);
          setEditNickname(true);
        }}
        sx={{
          bgcolor: effectiveChatTheme === "dark" ? "#f1f1f111" : "#0c0c0c11",
          color: effectiveChatTheme === "dark" ? "#fff" : "#000",
          py: 1.4,
          px: 2,
          borderRadius: "7px 7px 20px 20px",
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'left',
          gap: 1.5,
        }}
      >
        <TextFieldsIcon />
        <Typography variant="body1" sx={{ fontSize: 16, color: effectiveChatTheme === "dark" ? "#aaa" : "#333" }}>
          Add a Nickname
        </Typography>
      </IconButton>


    {/* Common Groups */}
<Box>
  <Typography variant="subtitle1" fontWeight="bold" mt={3} mb={0.5}>Common Groups</Typography>
  <Grid container spacing={0.5} mb={2}>
    {(commonGroups.slice(0,3)).map(group => (
      <Grid item xs={12} sm={6} md={4} key={group.id}>
        <Card sx={{ bgcolor: effectiveChatTheme === "dark" ? "#f1f1f106" : "#0c0c0c06", color: effectiveChatTheme === "dark" ? "#fff" : "#000", borderRadius: "10px", overflow: 'hidden', boxShadow: "none"}}>
          <CardActionArea onClick={() => history(`/group/${group.id}`)}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar
                src={group.iconURL}
                sx={{ bgcolor: effectiveChatTheme === "dark" ? "#fff" : "#000", color: '#111' }}
              >
                {group.emoji || group.name?.charAt(0)}
              </Avatar>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="body1" color={effectiveChatTheme === "dark" ? "#fff" : "#000"} fontWeight={"bolder"} noWrap>
                  {group.name}
                </Typography>
                <Box
                  sx={{
                    width: '100%',
                    overflow: 'hidden',
                    whiteSpace: 'nowrap',
                    textOverflow: 'ellipsis',
                    fontSize: 13,
                    color: effectiveChatTheme === "dark" ? "#ccc" : "#555",
                  }}
                >
                  {(group.members ?? [])
                    .map(uid => groupMembersInfo[uid]?.name)
                    .filter(Boolean)
                    .join(", ") ||
                    <Typography variant="caption" sx={{ color: "#ccc" }}>Loading...</Typography>
                  }
                </Box>
              </Box>
            </CardContent>
          </CardActionArea>
        </Card>
      </Grid>
    ))}
    {(commonGroups.length > 3) && (
        <Button
          variant="contained"
          fullWidth
          sx={{ color: effectiveChatTheme === "dark" ? "#fff" : "#000", backgroundColor: effectiveChatTheme === "dark" ? "#f1f1f121" : "#0c0c0c11", borderRadius: 3, fontWeight: 600, boxShadow: "none" }}
          onClick={() => setAllCommonGroupsDrawerOpen(true)}
        >
          {commonGroups.length - 3} more group{commonGroups.length - 3 > 1 ? "s" : ""}
        </Button>
    )}
  </Grid>
</Box>

<Box mb={4}>
  <Typography variant="subtitle1" fontWeight="bold" mb={1}>Common Trips</Typography>
  <List>
    {visibleTrips.map(trip => (
      <Card key={trip.id}
        sx={{
          background: `url(${trip?.iconURL})`,
          backgroundSize: "cover",
          backgroundColor: effectiveChatTheme === "dark" ? "#f1f1f111" : "#0c0c0c01",
          backgroundPosition: "center",
          color: effectiveChatTheme === "dark" ? "#fff" : "#000",
          borderRadius: "20px 20px 7px 7px",
          boxShadow: "none",
          mb: 0.5,
        }}
      >
        <CardContent sx={{ backdropFilter: "blur(20px)", backgroundColor: "#0c0c0c21" }}>
          <Box display="flex" alignItems="start" gap={2} py="0">
            <Box py="0">
              <Box sx={{
                display: "flex", width: "75vw", flexDirection: "row",
                alignItems: "center", justifyContent: "space-between", gap: 1
              }}>
                <Typography variant="h6"
                  sx={{
                    width: '100%', fontWeight: 800, mb: 1,
                    overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis'
                  }}>
                  {trip.name}
                </Typography>
                {timelineStatsMap?.[trip.id] && (
                  <Box mb={1} minWidth={110}>
                    <Typography variant="caption" sx={{
                      color: effectiveChatTheme === "dark" ? "#ccc" : "#555",
                    }}>
                      {timelineStatsMap[trip.id].messages} messages
                    </Typography>
                  </Box>
                )}
              <Typography variant="body2" sx={{ color: effectiveChatTheme === "dark" ? "#aaa" : "#333", display: "flex", alignItems: "center" }}>
                <AccessTime sx={{ fontSize: 16, mr: 1 }} /> {trip.startDate} → {trip.endDate}
              </Typography>
            </Box>
          </Box>
          </Box>
        </CardContent>
      </Card>
    ))}

    {moreCount > 0 && (
      <Button
        variant="contained"
        fullWidth
        sx={{
          color: effectiveChatTheme === "dark" ? "#fff" : "#000", backgroundColor: effectiveChatTheme === "dark" ? "#f1f1f111" : "#0c0c0c11", borderRadius: "7px 7px 20px 20px", fontWeight: 600, boxShadow: "none",
          fontWeight: 600, py: 1, px: 2,
        }}
        onClick={() => setShowAllTripsDrawer(true)}
      >
        {moreCount} more trip{moreCount > 1 ? "s" : ""}
      </Button>
    )}
  </List>
</Box>


    {/* Shared Budgets */}
    {/* {sharedBudgets.length > 0 && (
      <>
        <Typography variant="subtitle2" fontWeight="bold" mt={2} mb={1}>Shared Budgets</Typography>
        <List>
          {sharedBudgets.map(budget => (
            <Card key={budget.id} sx={{ bgcolor: '#232323', color: effectiveChatTheme === "dark" ? "#fff" : "#000", mb: 2, borderRadius: 3 }}>
              <CardActionArea onClick={() => history(`/budgets/${budget.id}`)}>
                <CardContent sx={{ display: 'flex', alignItems: 'center' }}>
                  <Avatar sx={{ bgcolor: "#00f721", color: '#000', mr: 2 }}>
                    <CreditCardIcon />
                  </Avatar>
                  <Box flex={1}>
                    <Typography variant="h6">{budget.name}</Typography>
                    <Typography variant="body2" sx={{ color: "#BBB" }}>
                      Total: {budget.total ?? "—"}
                    </Typography>
                  </Box>
                </CardContent>
              </CardActionArea>
            </Card>
          ))}
        </List>
      </>
    )} */}

    <Box></Box>

      <IconButton
        onClick={handleClearChat}
        sx={{
          bgcolor: effectiveChatTheme === "dark" ? "#ff676711" : "#ff676726",
          color: '#ff6767',
          py: 1.4,
          px: 2,
          borderRadius: "20px 20px 7px 7px",
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'left',
          gap: 1.5,
          mt: 2
        }}
      >
        <DeleteOutlineIcon />
        <Typography variant="body1" sx={{ fontSize: 16, color: '#ff6767' }}>
          Delete Chat
        </Typography>
      </IconButton>
      <IconButton
        onClick={handleRemoveFriend}
        sx={{
          bgcolor: effectiveChatTheme === "dark" ? "#ff676711" : "#ff676726",
          color: '#ff6767',
          py: 1.4,
          px: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-start',
          gap: 1.5,
          borderRadius: "7px 7px 20px 20px",
        }}
      >
        <RemoveCircleOutlineIcon sx={{ color: '#ff6767' }} />
        <Typography variant="body1" sx={{ fontSize: 16, color: '#ff6767' }}>
          Remove from Friend
        </Typography>
      </IconButton>
    </Stack>
  </Box>

  <SwipeableDrawer
  anchor="bottom"
  open={allCommonGroupsDrawerOpen}
  onClose={() => setAllCommonGroupsDrawerOpen(false)}
  onOpen={()=>{}}
  PaperProps={{
    sx: {
      borderTopLeftRadius: 20, borderTopRightRadius: 20,
      backgroundColor: effectiveChatTheme === "dark" ? "#0c0c0c0a" : "#f1f1f19a",
      backdropFilter: 'blur(70px)',
      color: effectiveChatTheme === "dark" ? "#fff" : "#000",
      maxWidth: 470, mx: 'auto',
      p: 2, height: '90vh'
    }
  }}
>

    <Box sx={{ width: 40, height: 5, bgcolor: '#555', borderRadius: 3, mx: 'auto', mb: 2 }} />

  <Box sx={{ mb: 2, position: 'relative' }}>
    <Typography variant="h6" sx={{ mb: 2, textAlign: "center", fontWeight: 700 }}>All Common Groups</Typography>
    <TextField
      value={groupSearch}
      onChange={e => setGroupSearch(e.target.value)}
      placeholder="Search groups..."
      fullWidth
      size="small"
      variant="outlined"
      InputProps={{
        style: { color: effectiveChatTheme === "dark" ? "#fafafa" : "#0c0c0c", borderRadius: 8 },
        startAdornment: (
          <InputAdornment position="start">
            <SearchIcon sx={{ color: "#777" }} />
          </InputAdornment>
        ),
      }}
      sx={{ mb: 2 }}
    />
    <Box sx={{ maxHeight: "75vh", overflowY: "auto", pr: 1 }}>
      {commonGroups
        .filter(g =>
          !groupSearch.trim() ||
          g.name?.toLowerCase().includes(groupSearch.toLowerCase()) ||
          (g.members ?? []).some(uid => (groupMembersInfo[uid]?.name || "").toLowerCase().includes(groupSearch.toLowerCase()))
        )
        .map(group => (
          <Card key={group.id}
            sx={{ bgcolor: effectiveChatTheme === "dark" ? '#0c0c0c11' : '#ffffff31', color: effectiveChatTheme === "dark" ? "#fff" : "#000", borderRadius: 2, mb: 0.5, boxShadow: "none", overflow: "hidden" }}>
            <CardActionArea onClick={() => {
              setAllCommonGroupsDrawerOpen(false);
              history(`/group/${group.id}`);
            }}>
              <CardContent sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Avatar
                  src={group.iconURL}
                  sx={{ bgcolor: effectiveChatTheme === "dark" ? "#fff" : "#000", color: '#111' }}
                >
                  {group.emoji || group.name?.charAt(0)}
                </Avatar>
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="body1" color={effectiveChatTheme === "dark" ? "#fff" : "#000"} fontWeight="regular" noWrap>
                    {group.name}
                  </Typography>
                  <Box
                    sx={{
                      minWidth: 0,
                      overflow: 'hidden',
                      whiteSpace: 'nowrap',
                      textOverflow: 'ellipsis',
                      fontSize: 11,
                      color: effectiveChatTheme === "dark" ? "#ccc" : "#555",
                    }}
                  >
                    {(group.members ?? [])
                      .map(uid => groupMembersInfo[uid]?.name)
                      .filter(Boolean)
                      .join(", ") ||
                      <Typography variant="caption" sx={{ color: "#ccc" }}>Loading...</Typography>
                    }
                  </Box>
                </Box>
              </CardContent>
            </CardActionArea>
          </Card>
        ))}
    </Box>
  </Box>
  </SwipeableDrawer>

<SwipeableDrawer
  anchor="bottom"
  open={showAllTripsDrawer}
  onClose={() => setShowAllTripsDrawer(false)}
  onOpen={() => {}}
  PaperProps={{
    sx: { borderTopLeftRadius: 20, borderTopRightRadius: 20, backgroundColor: effectiveChatTheme === "dark" ? "#0c0c0c0a" : "#f1f1f19a", backdropFilter: 'blur(70px)', color: effectiveChatTheme === "dark" ? "#fff" : "#000", maxWidth: 470, mx: 'auto', p: 2, height: '90vh' }
  }}
>
      <Box sx={{ width: 40, height: 5, bgcolor: '#555', borderRadius: 3, mx: 'auto', mb: 2 }} />

  <Box>
    <Typography variant="h6" sx={{ mb: 2, mt: 1, fontWeight: 700, textAlign: "center" }}>All Common Trips</Typography>
    <TextField
      value={tripSearch}
      onChange={e => setTripSearch(e.target.value)}
      placeholder="Search trips..."
      fullWidth
      size="small"
      variant="outlined"
      sx={{ mb: 2 }}
      InputProps={{ style: { borderRadius: 8, color: effectiveChatTheme === "dark" ? "#fafafa" : "#0c0c0c" },
        startAdornment: (
          <InputAdornment position="start">
            <SearchIcon sx={{ color: "#777" }} />
          </InputAdornment>
        ),
      }}
    />
    <Box sx={{ maxHeight: "75vh", overflowY: "auto", pr: 1 }}>
      {commonTrips.filter(trip =>
        !tripSearch.trim() ||
        trip.name?.toLowerCase().includes(tripSearch.toLowerCase()) ||
        (trip.location || "").toLowerCase().includes(tripSearch.toLowerCase())
      ).map(trip => (
        <Card key={trip.id} sx={{
          background: `url(${trip.iconURL})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          color: effectiveChatTheme === "dark" ? "#fff" : "#000",
          mb: 1,
          overflow: "hidden",
          boxShadow: "none",
        }}>
          <CardContent sx={{ backdropFilter: "blur(20px)", borderRadius: 3 }}>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: '100%' }}>
              <Typography variant="h6" noWrap>{trip.name}</Typography>
              {timelineStatsMap?.[trip.id] && (
                <Box minWidth={110}>
                  <Typography variant="caption" sx={{ color: effectiveChatTheme === "dark" ? "#aaa" : "#333" }}>
                    {timelineStatsMap[trip.id]?.completed} / {timelineStatsMap[trip.id]?.total} complete
                  </Typography>
                  <LinearProgress
                    value={timelineStatsMap[trip.id]?.percent}
                    variant="determinate"
                    sx={{
                      mt: 0.5, borderRadius: 20, height: 7, bgcolor: effectiveChatTheme === "dark" ? "#ffffff36" : "#00000018",
                      "& .MuiLinearProgress-bar": { bgcolor: effectiveChatTheme === "dark" ? "#ffffff" : "#1e1e1eff" }
                    }}
                  />
                </Box>
              )}
            </Box>
            <Typography variant="body2" sx={{ color: effectiveChatTheme === "dark" ? "#aaa" : "#333", display: "flex", flexDirection: "row", alignItems: "center" }}>
              <LocationOn sx={{ fontSize: 14, mr: 1 }} />
              {trip.from} → {trip.location}
            </Typography>
            <Typography variant="body2" sx={{ color: effectiveChatTheme === "dark" ? "#ccc" : "#555", display: "flex", flexDirection: "row", alignItems: "center" }}>
              <AccessTime sx={{ fontSize: 14, mr: 1 }} />
              {trip.startDate} → {trip.endDate}
            </Typography>
          </CardContent>
        </Card>
      ))}
    </Box>
  </Box>
</SwipeableDrawer>

                  <SwipeableDrawer
                    anchor="bottom"
                    open={addNicknameDrawerOpen}
                    onClose={() => setAddNicknameDrawerOpen(false)}
                    onOpen={() => {}}
                    disableSwipeToOpen={true}
                    disableDiscovery={true}
                    PaperProps={{
                      sx: {
                        borderTopLeftRadius: 20,
                        borderTopRightRadius: 20,
                        backgroundColor: effectiveChatTheme === "dark" ? "#00000011" : "#ffffffd1",
                        backdropFilter: "blur(80px)",
                        p: 3,
                        maxWidth: 400,
                        mx: "auto",
                      },
                    }}
                  >
                  <Typography variant="subtitle2" sx={{ color: effectiveChatTheme === "dark" ? "#fff" : "#000", mb: 0.5 }}>Add a Nickname</Typography>
                  {editNickname && (
                    <Box sx={{ display: 'flex', mt: 2, flexDirection: "column", alignItems: 'center', gap: 1 }}>
                      <TextField
                        value={nickname}
                        label={"Nickname"}
                        onChange={e => setNickname(e.target.value)}
                        size="small"
                        fullWidth
                        variant="outlined"
                        sx={{ 
                          borderRadius: 1,
                          input: { color: effectiveChatTheme === "dark" ? "#fff" : "#000" }
                        }}
                        InputProps={{
                          disableUnderline: true,
                          sx: {
                            fontSize: 22,
                            fontWeight: 600,
                            color: effectiveChatTheme === "dark" ? "#fff" : "#000",
                            mb: 1,
                          },
                        }}
                        InputLabelProps={{ 
                          style: { color: effectiveChatTheme === "dark" ? "#aaa" : "#333" }
                        }}
                      />
                      <Box 
                      display={"flex"} 
                      sx={{
                        width: "100%",
                        gap: 2,
                      }}
                      >
                        <Button
                        sx={{ 
                          backgroundColor: effectiveChatTheme === "dark" ? "#f1f1f111" : "#0c0c0c11",
                          fontSize: 14,
                          color: effectiveChatTheme === "dark" ? "#fff" : "#000",
                          width: "100vw",
                          px: 2,
                          py: 1,
                          borderRadius: 14, 
                        }}  
                        onClick={() => { 
                          setAddNicknameDrawerOpen(false); 
                          setNickname(nickname);
                        }}>
                          Close
                        </Button>
                        <Button 
                        sx={{ 
                          backgroundColor: effectiveChatTheme === "dark" ? "#f1f1f1" : "#0c0c0c",
                          fontSize: 14,
                          color: effectiveChatTheme === "dark" ? "#000" : "#fff",
                          width: "100vw",
                          px: 2,
                          py: 1,
                          borderRadius: 14 
                        }} 
                        onClick={handleSaveNickname}>
                          Save
                        </Button>
                      </Box>
                    </Box>
                  )}
                  </SwipeableDrawer>

</Drawer>
       

        </motion.div>
      </Box>
    </Box>
    </ThemeProvider>

  );
}
export default ChatRoom;