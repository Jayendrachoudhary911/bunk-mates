import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  Box, Button, Avatar, Typography, TextField, IconButton, CircularProgress,
  AppBar, Toolbar, Paper, Menu, MenuItem, Slide, Dialog, Divider, SwipeableDrawer, Stack, Chip, useTheme, keyframes, createTheme,
  ThemeProvider,
  Card,
  CardActionArea,
  CardContent,
  Grid, List, ListItemText, ListItemAvatar, LinearProgress, InputAdornment, Drawer, CardMedia,
  Zoom,
  Collapse
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
import PeopleOutlineIcon from '@mui/icons-material/PeopleOutline';

import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useSwipeable } from "react-swipeable";
import {
  collection, addDoc, query, orderBy, onSnapshot,
  serverTimestamp, doc, updateDoc, getDoc, getDocs, where, deleteDoc, setDoc, arrayUnion, arrayRemove
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
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import CropIcon from "@mui/icons-material/Crop";
import RotateRightIcon from "@mui/icons-material/RotateRight";
import BlockIcon from '@mui/icons-material/Block';
import PersonOffIcon from '@mui/icons-material/PersonOff';

import {
  LocationOn, AccessTime,
} from "@mui/icons-material";
import { v4 as uuidv4 } from 'uuid'; // For notification message id
import { messaging } from "../firebase";
import { getToken, onMessage } from "firebase/messaging";
import { useThemeToggle } from "../contexts/ThemeToggleContext";
import { getTheme } from "../theme";
import { getDynamicBorderRadius } from "../utils/uiHelpers";
import Cropper from 'react-easy-crop';
import ColorThief from 'colorthief';
import { FastAverageColor } from "fast-average-color";

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

// --- NEW CONSTANT FOR BACKDROP BLUR STYLE ---
const backdropBlurStyle = {
  backdropFilter: 'blur(10px)',
  WebkitBackdropFilter: 'blur(10px)', // For Safari support
};
// --------------------------------------------

const getMessageShape = (messages, index, currentUserId) => {
  const msg = messages[index];
  const prevMsg = messages[index - 1];
  const nextMsg = messages[index + 1];
  const isOwn = msg.senderId === currentUserId;

  const within1Min = (a, b) =>
    Math.abs(a?.timestamp?.seconds - b?.timestamp?.seconds) < 60; // 1 minute

  const samePrev =
    prevMsg && prevMsg.senderId === msg.senderId && within1Min(msg, prevMsg);

  const sameNext =
    nextMsg && nextMsg.senderId === msg.senderId && within1Min(msg, nextMsg);

  // shape logic
  let borderRadius;
  if (isOwn) {
    if (samePrev && sameNext) borderRadius = "20px 10px 10px 20px"; // middle
    else if (samePrev && !sameNext) borderRadius = "20px 10px 4px 20px"; // end
    else if (!samePrev && sameNext) borderRadius = "20px 20px 10px 20px"; // start
    else borderRadius = "20px 20px 4px 20px"; // single
  } else {
    if (samePrev && sameNext) borderRadius = "10px 20px 20px 10px";
    else if (samePrev && !sameNext) borderRadius = "10px 20px 20px 4px";
    else if (!samePrev && sameNext) borderRadius = "20px 20px 20px 10px";
    else borderRadius = "20px 20px 20px 4px";
  }

  // count index of this msg inside its 1-min group
  let groupIndex = 0;
  if (samePrev) {
    let i = index - 1;
    while (i >= 0 && messages[i].senderId === msg.senderId && within1Min(messages[i], msg)) {
      groupIndex++;
      i--;
    }
  }

  // only show timestamp/seen on the **last message of the group**
  const showMeta = !sameNext;

  return { borderRadius, groupIndex, showMeta };
};

const shouldShowTimestamp = (messages, index) => {
  const msg = messages[index];
  const nextMsg = messages[index + 1];

  if (!nextMsg) return true; // last message → always show timestamp

  const sameSender = nextMsg.senderId === msg.senderId;
  const sameMinute =
    Math.abs(msg.timestamp?.seconds - nextMsg.timestamp?.seconds) < 60;

  // ✅ Hide timestamp if next message is from same sender in the same minute
  return !(sameSender && sameMinute);
};
  
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
  const [isFriendTyping, setIsFriendTyping] = useState(false);
  const [mutualFriendsCount, setMutualFriendsCount] = useState(0);

  // === START OF NEW/MODIFIED STATE AND LOGIC FOR MUTUAL FRIENDS ===
  const [mutualFriends, setMutualFriends] = useState([]);
  const [mutualFriendsDrawerOpen, setMutualFriendsDrawerOpen] = useState(false);

  const fetchMutualFriends = useCallback(async (currentUserId, friendId) => {
    if (!currentUserId || !friendId) return;

    // 1. Get current user's friends list
    const currentUserDoc = await getDoc(doc(db, "users", currentUserId));
    const currentUserFriends = currentUserDoc.exists() ? (currentUserDoc.data().friends || []) : [];

    // 2. Get friend's friends list
    const friendDoc = await getDoc(doc(db, "users", friendId));
    const friendFriends = friendDoc.exists() ? (friendDoc.data().friends || []) : [];

    // 3. Find intersection (mutual friends UIDs)
    const mutualUids = currentUserFriends.filter(uid => friendFriends.includes(uid));

    // 4. Fetch mutual friend details
    if (mutualUids.length > 0) {
      const mutualFriendsDetails = await Promise.all(
        mutualUids.map(async (uid) => {
          const userSnap = await getDoc(doc(db, "users", uid));
          return userSnap.exists() ? { id: uid, ...userSnap.data() } : null;
        })
      );
      const filteredMutualFriends = mutualFriendsDetails.filter(Boolean).filter(mf => mf.id !== currentUserId);
      setMutualFriendsCount(filteredMutualFriends.length);
      setMutualFriends(filteredMutualFriends);
    } else {
      setMutualFriendsCount(0);
      setMutualFriends([]);
    }
  }, []);

  useEffect(() => {
    if (currentUser?.uid && friendId) {
      fetchMutualFriends(currentUser.uid, friendId);
    }
  }, [currentUser, friendId, fetchMutualFriends]);
  // === END OF NEW/MODIFIED STATE AND LOGIC FOR MUTUAL FRIENDS ===

  const typingTimeoutRef = useRef(null);

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
  const [showViewerControls, setShowViewerControls] = useState(true);
  
  // Memoize the images array to prevent re-calculation on every render
  const images = React.useMemo(() => 
      messages.filter(msg => msg.type === "image").map(msg => msg.dataUri), 
  [messages]);

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [selectedImage, setSelectedImage] = useState(null);
  const [text, setText] = useState(""); // Store overlay text
  const [cropMode, setCropMode] = useState(false); // Track crop mode active
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [showCropper, setShowCropper] = useState(false);
  const [headerColor, setHeaderColor] = useState(mode === "dark" ? "linear-gradient(to bottom, #00000000, #00000030, #000000a0, #000000f9)" : "linear-gradient(to bottom, #ffffff00, #ffffff30, #ffffffa0, #fffffff9");
  const [headerBg, setHeaderBg] = useState(mode === "dark" ? "linear-gradient(to top, #00000000, #00000030, #000000a0, #000000f9)" : "linear-gradient(to top, #ffffff00, #ffffff30, #ffffffa0, #fffffff9}");
  const [headerTextColor, setHeaderTextColor] = useState(mode === "dark" ? "#fff" : "#000");
  const rgbaFromArray = (arr, alpha = 0.85) => `rgba(${arr[0]}, ${arr[1]}, ${arr[2]}, ${alpha})`;

  const [blockedUids, setBlockedUids] = useState([]);
  const [dominantColor, setDominantColor] = useState(null); 

  const location = useLocation();

  const handleOpenProfile = () => {
    history({ search: `?profile` });
  };

  const handleCloseProfile = () => {
    history({ search: `` });
  };
  
  // Handler to open the mutual friends drawer
  const handleOpenMutualFriendsDrawer = () => {
    setMutualFriendsDrawerOpen(true);
  };
  
  // Handler to close the mutual friends drawer
  const handleCloseMutualFriendsDrawer = () => {
    setMutualFriendsDrawerOpen(false);
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const isProfileOpen = params.get('profile') !== null;
    setOpenProfile(isProfileOpen);
  }, [location.search]);

  const messageVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 20, transition: { duration: 0.2 } },
  };

  useEffect(() => {
  const fetchBlocked = async () => {
    if (!auth.currentUser) return;
    const userRef = doc(db, "users", auth.currentUser.uid);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      setBlockedUids(userSnap.data().blockedUids || []);
    }
  };
  fetchBlocked();
}, []);

const isBlocked = blockedUids.includes(friendId);

const toggleBlockFriend = async () => {
  if (!auth.currentUser) return;

  const userRef = doc(db, "users", auth.currentUser.uid);
  try {
    if (isBlocked) {
      await updateDoc(userRef, {
        blockedUids: arrayRemove(friendId),
      });
      setBlockedUids(prev => prev.filter(uid => uid !== friendId));
    } else {
      await updateDoc(userRef, {
        blockedUids: arrayUnion(friendId),
      });
      setBlockedUids(prev => [...prev, friendId]);
    }
  } catch (error) {
    console.error("Error updating block status: ", error);
    alert("Failed to update block status.");
  }
};


  // Removed the old fetchMutualFriendsCount and using the new unified fetchMutualFriends now.
  // The useEffect that called fetchMutualFriendsCount is now removed as well, 
  // as the new one is more comprehensive.

    const getWallpaperUrl = () => {
      const selectedWallpaper = localStorage.getItem('bunkmate_chatWallpaper') || 'default';
      if (selectedWallpaper === 'none') {
          return effectiveChatTheme === 'dark'
            ? 'url(/assets/images/chatbg/dark.png)'
            : 'url(/assets/images/chatbg/light.png)';
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
    const fac = new FastAverageColor();
    const wallpaperUrl = getWallpaperUrl().replace(/^url\(["']?/, "").replace(/["']?\)$/, ""); // clean url()

    if (!wallpaperUrl || wallpaperUrl === "none") {
      setHeaderTextColor(effectiveChatTheme === "dark" ? "#fff" : "#000");
      return;
    }

    fac.getColorAsync(wallpaperUrl)
      .then((color) => {
        const isLight = color.isLight;
        setHeaderTextColor(isLight ? "#000" : "#fff");
      })
      .catch(() => {
        setHeaderTextColor(effectiveChatTheme === "dark" ? "#fff" : "#000");
      });
  }, [getWallpaperUrl, effectiveChatTheme]);

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
        body: lastMessage.text || "Sent an image",
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

  useEffect(() => {
    if (!chatId || !friendId) return;
  
    const chatDocRef = doc(db, "chats", chatId);
  
    const unsubscribe = onSnapshot(chatDocRef, (docSnapshot) => {
      if (docSnapshot.exists()) {
        const chatData = docSnapshot.data();
        const friendDraft = chatData.drafts ? chatData.drafts[friendId] : '';
        setIsFriendTyping(!!friendDraft);
      } else {
        setIsFriendTyping(false);
      }
    });
  
    return () => unsubscribe();
  }, [chatId, friendId]);


  const getGroupedReactions = (msg) => {
    if (!msg.reactions) return {};
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
    const userRef = doc(db, "users", currentUser.uid);
    const userDoc = await getDoc(userRef);
    const friends = userDoc.exists() ? (userDoc.data().friends || []) : [];
    await updateDoc(userRef, {
      friends: friends.filter(uid => uid !== friendId)
    });
    const friendRef = doc(db, "users", friendId);
    const friendDoc = await getDoc(friendRef);
    const friendFriends = friendDoc.exists() ? (friendDoc.data().friends || []) : [];
    await updateDoc(friendRef, {
      friends: friendFriends.filter(uid => uid !== currentUser.uid)
    });
    setNotification("Removed from friends.");
    setOpenProfile(false);
    history('/chats');
  };

  const getGradientStyle = useCallback((position) => {
    if (!dominantColor) {
      // Fallback for when color is loading or not found
      const fallbackColor = effectiveChatTheme === 'dark' ? '17, 17, 17' : '255, 255, 255';
      const fallbackColorEnd = effectiveChatTheme === 'dark' ? '0, 0, 0' : '255, 255, 255';
      return position === 'top' 
        ? `linear-gradient(to bottom, rgba(${fallbackColorEnd}, 0.9), rgba(${fallbackColor}, 0.6), rgba(${fallbackColor}, 0.0))` 
        : `linear-gradient(to top, rgba(${fallbackColor}, 0.9), rgba(${fallbackColor}, 0.6), rgba(${fallbackColor}, 0.0))`;
    }

    const colorString = `${dominantColor[0]}, ${dominantColor[1]}, ${dominantColor[2]}`;
    
    // Gradient for AppBar (top to bottom)
    if (position === 'top') {
      return `linear-gradient(to bottom, rgba(${colorString}, 0.9), rgba(${colorString}, 0.6), rgba(${colorString}, 0.0))`;
    } 
    // Gradient for bottom input field (bottom to top)
    else if (position === 'bottom') {
      return `linear-gradient(to top, rgba(${colorString}, 0.9), rgba(${colorString}, 0.6), rgba(${colorString}, 0.0))`;
    }
    return 'transparent';
  }, [dominantColor, effectiveChatTheme]);


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

    await addDoc(collection(db, "chats", chatId, "messages"), {
      text: `${currentUser.displayName || "A user"} set a nickname for you: "${nickname}"`,
      senderId: currentUser.uid,
      timestamp: serverTimestamp(),
      isRead: false,
      system: true,
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
    addDoc(collection(db, 'chats', chatId, 'messages'), {
      senderId: currentUser.uid,
      type: 'image',
      dataUri: imageDataUri,
      timestamp: serverTimestamp(),
    });
    setImageDrawer(false);
    setImageDataUri("");
  }
}

function downloadImage(dataUri, id) {
  const link = document.createElement('a');
  link.href = dataUri;
  link.download = `chat-image-${id}.jpg`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
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

  const handleInputChange = (e) => {
    const value = e.target.value;
    setInput(value);
  
    if (!chatId || !currentUser) return;
  
    const chatDocRef = doc(db, "chats", chatId);
  
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  
    if (value.trim().length > 0) {
      setDoc(chatDocRef, {
        drafts: { [currentUser.uid]: value }
      }, { merge: true });
  
      typingTimeoutRef.current = setTimeout(() => {
        setDoc(chatDocRef, {
          drafts: { [currentUser.uid]: "" }
        }, { merge: true });
      }, 2000);
    } else {
      setDoc(chatDocRef, {
        drafts: { [currentUser.uid]: "" }
      }, { merge: true });
    }
  };

  // ✅ FIX 1: New function to handle opening the image viewer at the correct index
  const handleImageClick = (clickedMsg) => {
    const allImageUris = messages
      .filter((m) => m.type === "image")
      .map((m) => m.dataUri);
    const index = allImageUris.findIndex(uri => uri === clickedMsg.dataUri);
    if (index !== -1) {
      setSelectedIndex(index);
    }
    setOpenViewer(true);
  };


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
        setNewMessagesCount(prev => prev + 1);
      }
    }
  }, [messages]);

const handleAddText = () => {
  const canvas = document.createElement("canvas");
  const img = new window.Image();
  img.src = imageDataUri;
  img.onload = () => {
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0);
    ctx.font = "40px sans-serif";
    ctx.fillStyle = "#FFFFFF";
    ctx.fillText(text, 40, 60); // Optional: let user choose position
    setImageDataUri(canvas.toDataURL());
  };
};

const handleCropImage = () => setCropMode(true);

const onCropComplete = (_, croppedAreaPixels) => setCroppedAreaPixels(croppedAreaPixels);

async function getCroppedImg(imageSrc, crop) {
  return new Promise((resolve) => {
    const image = new window.Image();
    image.src = imageSrc;
    image.crossOrigin = "anonymous";
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = crop.width;
      canvas.height = crop.height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(
        image,
        crop.x,
        crop.y,
        crop.width,
        crop.height,
        0,
        0,
        crop.width,
        crop.height
      );
      resolve(canvas.toDataURL("image/jpeg"));
    };
  });
}

const applyCrop = async () => {
  const croppedImage = await getCroppedImg(imageDataUri, croppedAreaPixels);
  setImageDataUri(croppedImage);
  setCropMode(false);
};

const handleRotateImage = () => {
  const canvas = document.createElement('canvas');
  const img = new window.Image();
  img.src = imageDataUri;
  img.onload = () => {
    canvas.width = img.height;
    canvas.height = img.width;
    const ctx = canvas.getContext('2d');
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate(Math.PI / 2);
    ctx.drawImage(img, -img.width / 2, -img.height / 2);
    setImageDataUri(canvas.toDataURL());
  };
};

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

  const groupQuery = query(
    collection(db, 'groupChats'),
    where('members', 'array-contains', currentUser.uid)
  );
  const groupSnapshot = await getDocs(groupQuery);

  const matchedGroups = groupSnapshot.docs
    .filter(doc => {
      const members = doc.data().members || [];
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

    const q = collection(db, "budgets");
    const snap = await getDocs(q);

    const shared = snap.docs
      .filter(doc => {
        const contributors = Array.isArray(doc.data().contributors) ? doc.data().contributors : [];
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
  if (!input.trim() && !selectedImage) return;
  setIsSending(true);

  if (typingTimeoutRef.current) {
    clearTimeout(typingTimeoutRef.current);
  }

  if (chatId) {
    const chatDocRef = doc(db, "chats", chatId);
    await updateDoc(chatDocRef, {
      [`drafts.${currentUser.uid}`]: "",
    });
  }

  // Check if user is blocked
  const blockedUids = friendDetails?.blockedUids || [];
  if (blockedUids.includes(currentUser.uid)) {
    // Save to localStorage and add to local chat state
    const localMessages = JSON.parse(localStorage.getItem(`blockedMessages_${friendId}`)) || [];
    const blockedMessage = {
      id: Date.now(), // temporary ID for rendering
      senderId: currentUser.uid,
      text: input.trim() || (selectedImage ? "📷 Image" : ""),
      dataUri: selectedImage || null,
      timestamp: new Date().toISOString(),
      blocked: true,
      replyTo: replyingTo
        ? {
            id: replyingTo.id,
            text: replyingTo.text || "",
            senderId: replyingTo.senderId,
            imageUrl: replyingTo.imageUrl || replyingTo.dataUri || null,
          }
        : null,
    };
    localMessages.push(blockedMessage);
    localStorage.setItem(`blockedMessages_${friendId}`, JSON.stringify(localMessages));

    // Optionally, update local chat state to display immediately
    setMessages((prev) => [...prev, blockedMessage]);

    setInput("");
    setSelectedImage(null);
    setReplyingTo(null);
    setIsSending(false);
    return;
  }

  const messageData = {
    senderId: currentUser.uid,
    timestamp: serverTimestamp(),
    isRead: false,
    replyTo: replyingTo
      ? {
          id: replyingTo.id,
          text: replyingTo.text || "",
          senderId: replyingTo.senderId,
          imageUrl: replyingTo.imageUrl || replyingTo.dataUri || null,
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
    await addDoc(collection(db, "chats", chatId, "messages"), {
      ...messageData,
      text: input.trim() || "",
      dataUri: selectedImage || null,
      type: selectedImage ? "image" : "text",
    });

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

  setInput("");
  setSelectedImage(null);
  setReplyingTo(null);
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

  const handleReaction = async (emoji, msg = reactionMsg || selectedMsg) => {
    if (!msg) return;
    const reactions = msg.reactions || [];
    const userId = currentUser.uid;

    let updated = reactions.filter(r => r.user !== userId);

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
  const updated = msg.reactions.filter(
    r => !(r.emoji === emoji && r.user === userId)
  );
  await updateDoc(doc(db, "chats", chatId, "messages", msg.id), {
    reactions: updated
  });
};

  const stackItems = [
  friendDetails.bio && (
    <Box key="bio" sx={{ bgcolor: effectiveChatTheme === "dark" ? "#f1f1f111" : "#ffffff2d", color: effectiveChatTheme === "dark" ? "#aaa" : "#333", py: 1.4, px: 2, display: 'flex', justifyContent: 'left', gap: 1.5, mt: 1, ...backdropBlurStyle }}>
      <Typography variant="body2" textAlign="justify">
        <strong>Bio:</strong> {friendDetails.bio}
      </Typography>
    </Box>
  ),
  (<IconButton 
      key="mutual-friends" 
      onClick={handleOpenMutualFriendsDrawer} // Open the dedicated mutual friends drawer
      sx={{ 
        bgcolor: effectiveChatTheme === "dark" ? "#f1f1f111" : "#ffffff2d", 
        color: effectiveChatTheme === "dark" ? "#fff" : "#000", 
        py: 1.4, 
        px: 2, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'left', 
        gap: 1.5, 
        ...backdropBlurStyle,
        mt: 1, 
        borderRadius: '16px', 
        width: '100%' 
      }}
    >
      
      <Typography variant="body1" sx={{ fontSize: 16, color: effectiveChatTheme === "dark" ? "#aaa" : "#333", flexGrow: 1, textAlign: 'left' }}>
        {mutualFriendsCount} Mutual Friends
      </Typography>
      {/* Mutal Friend Avatars for quick preview */}
      <Box sx={{ display: 'flex', alignItems: 'center', mr: 1 }}>
          {mutualFriends.slice(0, 3).map((mf, index) => (
              <Avatar
                  key={mf.id}
                  src={mf.photoURL}
                  alt={mf.name}
                  sx={{ 
                      width: 24, 
                      height: 24, 
                      fontSize: '0.7rem',
                      border: `1.5px solid ${effectiveChatTheme === "dark" ? '#0c0c0c' : '#fff'}`,
                      ml: index > 0 ? -1 : 0, // Overlap effect
                      zIndex: 10 - index,
                      '&:hover': { zIndex: 100 }
                  }}
              >
                  {mf.name?.charAt(0)}
              </Avatar>
          ))}
      </Box>
    </IconButton>),
  friendDetails.mobile && (
    <IconButton key="mobile" onClick={() => window.open(`tel:${friendDetails.mobile}`, '_blank')} sx={{ bgcolor: effectiveChatTheme === "dark" ? "#f1f1f111" : "#ffffff2d", color: effectiveChatTheme === "dark" ? "#fff" : "#000", py: 1.4, px: 2, display: 'flex', alignItems: 'center', justifyContent: 'left', gap: 1.5, ...backdropBlurStyle }}>
      <PhoneOutlinedIcon />
      <Typography variant="body1" sx={{ fontSize: 16, color: effectiveChatTheme === "dark" ? "#aaa" : "#333" }}>
        {friendDetails.mobile}
      </Typography>
    </IconButton>
  ),
  <IconButton key="message" onClick={() => setOpenProfile(false)} sx={{ bgcolor: effectiveChatTheme === "dark" ? "#f1f1f111" : "#ffffff2d", color: effectiveChatTheme === "dark" ? "#fff" : "#000", py: 1.4, px: 2, display: 'flex', alignItems: 'center', justifyContent: 'left', gap: 1.5, ...backdropBlurStyle }}>
    <PersonOutlineIcon />
    <Typography variant="body1" sx={{ fontSize: 16, color: effectiveChatTheme === "dark" ? "#aaa" : "#333" }}>
      Profile
    </Typography>
  </IconButton>,
  <IconButton key="nickname" onClick={() => { setAddNicknameDrawerOpen(true); setEditNickname(true); }} sx={{ bgcolor: effectiveChatTheme === "dark" ? "#f1f1f111" : "#ffffff2d", color: effectiveChatTheme === "dark" ? "#fff" : "#000", py: 1.4, px: 2, display: 'flex', alignItems: 'center', justifyContent: 'left', gap: 1.5, ...backdropBlurStyle }}>
    <TextFieldsIcon />
    <Typography variant="body1" sx={{ fontSize: 16, color: effectiveChatTheme === "dark" ? "#aaa" : "#333" }}>
      Add a Nickname
    </Typography>
  </IconButton>
];
const actionButtons = [
  handleClearChat && (
    <IconButton
      key="clearChat"
      onClick={handleClearChat}
      sx={{
        bgcolor: effectiveChatTheme === "dark" ? "#ff676711" : "#ff676726",
        color: '#ff6767',
        py: 1.4,
        px: 2,
        borderRadius: getDynamicBorderRadius(0, 3), // first visible item
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'left',
        gap: 1.5,
        mt: 2,
        ...backdropBlurStyle,
      }}
    >
      <DeleteOutlineIcon />
      <Typography variant="body1" sx={{ fontSize: 16, color: '#ff6767' }}>
        Delete Chat
      </Typography>
    </IconButton>
  ),

    // New Block Friend button
  (
    <IconButton
      key="blockFriend"
      onClick={toggleBlockFriend}
      sx={{
        bgcolor: effectiveChatTheme === "dark" ? "#ff676711" : "#ff676726",
        color: '#ff6767',
        py: 1.4,
        px: 2,
        borderRadius: getDynamicBorderRadius(2, 3), // third visible item
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-start',
        gap: 1.5,
        ...backdropBlurStyle,
      }}
    >
      {isBlocked ? <PersonOffIcon sx={{ color: '#ff6767' }} /> : <BlockIcon sx={{ color: '#ff6767' }} />}
      <Typography variant="body1" sx={{ fontSize: 16, color: '#ff6767' }}>
        {isBlocked ? "Unblock Friend" : "Block Friend"}
      </Typography>
    </IconButton>
  ),

  handleRemoveFriend && (
    <IconButton
      key="removeFriend"
      onClick={handleRemoveFriend}
      sx={{
        bgcolor: effectiveChatTheme === "dark" ? "#ff676711" : "#ff676726",
        color: '#ff6767',
        py: 1.4,
        px: 2,
        borderRadius: getDynamicBorderRadius(1, 3), // second visible item
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-start',
        gap: 1.5,
        ...backdropBlurStyle,
      }}
    >
      <RemoveCircleOutlineIcon sx={{ color: '#ff6767' }} />
      <Typography variant="body1" sx={{ fontSize: 16, color: '#ff6767' }}>
        Remove from Friend
      </Typography>
    </IconButton>
  ),
];

const visibleStackItems = stackItems.filter(Boolean);

const getMessageDate = (timestamp) => {
  if (!timestamp) return "";

  // Convert Firestore Timestamp to Date or parse string
  const date = typeof timestamp.toDate === "function" ? timestamp.toDate() : new Date(timestamp);

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
        <Box
          sx={{
            backgroundImage: getWallpaperUrl() === 'none' ? effectiveChatTheme === 'dark' ? '/assets/images/chatbg/dark.png' : '/assets/images/chatbg/light.png' : getWallpaperUrl(),
            backgroundColor: getWallpaperUrl() === 'none'
                ? (effectiveChatTheme === 'dark' ? '#0c0c0c' : '#f0f2f5')
                : 'transparent',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            color: effectiveChatTheme === "dark" ? "#fff" : "#000"
          }}
        >
        
    <AppBar
      position="fixed"
      sx={{
        background: getGradientStyle('top'),
        backgroundRepeat: "no-repeat",
        padding: "45px 14px 12px",
        zIndex: 1100,
        boxShadow: "none",
        borderRadius: "0px 0px 0px 0px",
        transition: "all 0.3s ease-in-out",
        color: headerTextColor,
      }}
      elevation={0}
    >
      <Box display={"flex"} justifyContent={"space-between"} alignItems={"center"}>
        <Box display={"flex"} alignItems={"center"}>
          <IconButton onClick={goBack} sx={{ mr: 1, color: headerTextColor, backgroundColor: "#5e5e5e4f", border: "2px solid #f1f1f111", ...backdropBlurStyle }}>
            <ArrowBackIcon />
          </IconButton>

          {/* This Box is the new clickable area */}
          <Box 
            onClick={handleOpenProfile} // QUICK OPEN PROFILE DRAWER
            sx={{ 
              mr: 1, 
              px: 1, 
              borderRadius: 8, 
              backgroundColor: "#5e5e5e4f", 
              border: "2px solid #f1f1f111", 
              ...backdropBlurStyle,
              cursor: 'pointer', // Indicate it's clickable
              display: "flex",
              alignItems: "center",
              flexShrink: 1,
              overflow: 'hidden'
            }}
          >
            <Avatar
              src={friendDetails.photoURL}
              alt={friendDetails.name}
              sx={{ mr: 2, height: "35px", width: "35px" }}
            />
            <Box sx={{ pr: 2, flexGrow: 1 }}>
              <Typography variant="h6" color={headerTextColor} fontSize="16px" noWrap>
                {nickname ? nickname : friendDetails.name}
              </Typography>
              <Typography variant="h6" color={headerTextColor} fontSize="12px">
              @{friendDetails.username}
              </Typography>
            </Box>
          </Box>
        </Box>
        <IconButton
          sx={{
            color: headerTextColor,
            backgroundColor: effectiveChatTheme === "dark" ? "#5e5e5e4f" : "#d6d6d62f",
            ...backdropBlurStyle, // <-- APPLIED BLUR
            borderRadius: 8,
            py: 1,
            px: 1,
            display: "flex",
            alignItems: "center",
            mr: 2,
            border: "2px solid #f1f1f111"
          }}
          onClick={() => window.open(`tel:${friendDetails.mobile}`, "_blank")}
          disabled={!friendDetails.mobile}
        >
          <PhoneOutlinedIcon />
        </IconButton>
      </Box>
    </AppBar>

    <Box
      sx={{
          overflowY: 'auto',
      }}
    >
      <Box
        ref={scrollContainerRef}
        sx={{
          flex: 1,
          px: 2,
          pt: '80px',
          pb: '80px',
          display: 'flex',
          flexDirection: 'column',
          mt: 2
        }}
      >
        <AnimatePresence initial={false}>
          {messages.map((msg, index) => {
            const isOwn = msg.senderId === currentUser.uid;
            const showDate =
              index === 0 ||
              getMessageDate(msg.timestamp) !== getMessageDate(messages[index - 1].timestamp);

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
                    margin: '10px 0' ,
                  }}
                >
                  <Box
                    elevation={0}
                    sx={{
                      px: 1,
                      py: 1,
                      bgcolor: effectiveChatTheme === "dark" ? "#00000031" : "#00000011",
                      ...backdropBlurStyle, // <-- APPLIED BLUR
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
                  </Box>
                </motion.div>
              );
            }

            const { borderRadius, groupIndex, showMeta } = getMessageShape(messages, index, currentUser.uid);

            return (
              <motion.div
                key={msg.id}
                ref={el => { messageRefs.current[msg.id] = el; }}
                className={`message-container ${isOwn ? 'own' : ''}`}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                onDragStart={() => setDraggedMsgId(msg.id)}
                onDragEnd={(event, info) => {
                  setDraggedMsgId(null);
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
                      paddingX: 2,
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
                      marginBottom: 10,
                      marginTop: 15
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{ color: effectiveChatTheme === "dark" ? "#dededeff" : "#333", backgroundColor: effectiveChatTheme === "dark" ? "#00000041" : "#88888811", ...backdropBlurStyle, px: 1, borderRadius: 8, textAlign: 'center' }}
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
                    mb: 0.5,
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
      pl: 1.2,
      pr: 1,
      py: 0.6,
      mb: 0.6,
      bgcolor: effectiveChatTheme === "dark" ? "#0000005a" : "#0000000a",
      borderRadius: "10px",
      display: "flex",
      alignItems: "center",
      gap: 1,
      cursor: "pointer",
      maxWidth: "95%",
      minWidth: "70%",
      overflow: "hidden",
      ...backdropBlurStyle, // <-- APPLIED BLUR
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
    {/* Text/Name Section */}
    <Box sx={{ flex: 1, minWidth: 0 }}>
      <Typography
        variant="caption"
        sx={{
          fontWeight: 700,
          color: effectiveChatTheme === "dark" ? "#00f721" : "#057c15",
          letterSpacing: 0.2,
          display: "block",
          mb: 0.2,
        }}
      >
        {msg.replyTo.senderId === currentUser.uid
          ? msg.senderId === currentUser.uid
            ? "You (self)"
            : "You"
          : friendDetails.name}
      </Typography>

      {msg.replyTo.text ? (
        <Typography
          variant="body2"
          noWrap
          sx={{
            color: effectiveChatTheme === "dark" ? "#d1d1d1" : "#555",
            fontStyle: "italic",
            fontSize: "0.9rem",
            lineHeight: 1.2,
            textOverflow: "ellipsis",
            overflow: "hidden",
            opacity: 0.95,
            whiteSpace: "nowrap",
            maxWidth: "55vw",
          }}
        >
          {msg.replyTo.text}
        </Typography>
      ) : (
        msg.replyTo.imageUrl && (
          <Typography
            variant="body2"
            sx={{
              color: effectiveChatTheme === "dark" ? "#d1d1d1" : "#555",
              fontStyle: "italic",
              fontSize: "0.9rem",
              opacity: 0.95,
            }}
          >
            Photo
          </Typography>
        )
      )}
    </Box>

    {/* Image Thumbnail */}
    {msg.replyTo.imageUrl && (
      <Box
        component="img"
        src={msg.replyTo.imageUrl}
        alt="reply preview"
        sx={{
          width: 48,
          height: 48,
          borderRadius: 1.5,
          objectFit: "cover",
          flexShrink: 0,
        }}
      />
    )}
  </Box>
)}

<Dialog
  open={openViewer}
  onClose={() => setOpenViewer(false)}
  fullScreen
  PaperProps={{
    sx: {
      backgroundColor: mode === "dark" ? "#00000048" : "#ffffff95",
      overflow: "hidden",
      backgroundImage: "none",
      ...backdropBlurStyle, // <-- APPLIED BLUR TO DIALOG BACKGROUND
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
    }}
  >
    {/* Close, Prev, and Next buttons with conditional visibility */}
    <IconButton
      onClick={() => setOpenViewer(false)}
      sx={{
        position: "absolute",
        top: 20,
        right: 20,
        bgcolor: "rgba(0,0,0,0.4)",
        color: "white",
        border: "1px solid rgba(255,255,255,0.2)",
        ...backdropBlurStyle, // <-- APPLIED BLUR TO BUTTON
        transition: "opacity 0.3s ease-in-out",
        opacity: showViewerControls ? 1 : 0,
        pointerEvents: showViewerControls ? "auto" : "none",
        "&:hover": { bgcolor: "rgba(255,255,255,0.15)" },
      }}
    >
      <CloseIcon />
    </IconButton>

    {/* Main Image Viewer */}
    <Zoom in={openViewer} style={{ transitionDelay: "100ms" }}>
      <Box
        {...swipeHandlers}
        component="img"
        onClick={() => setShowViewerControls((prev) => !prev)} // Toggle controls on click
        src={images[selectedIndex]}
        alt="full-view"
        sx={{
          maxWidth: "100%",
          maxHeight: "100%",
          borderRadius: 0,
          boxShadow: "none",
          objectFit: "contain",
          cursor: "pointer",
        }}
      />
    </Zoom>

    {/* Thumbnail Bar with conditional visibility */}
    <Box
      sx={{
        display: "flex",
        overflowX: "auto",
        gap: 1.5,
        p: 1.5,
        bgcolor: "rgba(0, 0, 0, 0.25)",
        borderRadius: 4,
        ...backdropBlurStyle, // <-- APPLIED BLUR TO THUMBNAIL BAR
        position: "absolute",
        bottom: 20,
        width: "90%",
        transition: "opacity 0.3s ease-in-out, transform 0.3s ease-in-out",
        opacity: showViewerControls ? 1 : 0,
        transform: showViewerControls ? "translateY(0)" : "translateY(150%)",
        pointerEvents: showViewerControls ? "auto" : "none",
        // For better scrollbar aesthetics on webkit browsers
        '&::-webkit-scrollbar': {
          height: '4px',
        },
        '&::-webkit-scrollbar-thumb': {
          backgroundColor: 'rgba(255,255,255,0.4)',
          borderRadius: '2px',
        }
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
            minWidth: "70px",
            height: 70,
            borderRadius: 2,
            cursor: "pointer",
            objectFit: "cover",
            border: selectedIndex === i ? "2.5px solid #ffffff" : "2.5px solid transparent",
            opacity: selectedIndex === i ? 1 : 0.7,
            transition: "all 0.3s ease",
            "&:hover": { opacity: 1, transform: "scale(1.05)" },
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
    py: 0.8,
    maxWidth: '70%',
    minWidth: "100px",
    bgcolor: isOwn
      ? effectiveChatTheme === "dark"
        ? "#005c4b5e"
        : "#d9fdd3"
      : effectiveChatTheme === "dark"
      ? "#5e5e5e4f"
      : "#ffffff",
    borderRadius,
    color: effectiveChatTheme === "dark" ? "#fff" : "#000",
    position: 'relative',
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.15)',
    transition: "border-radius 0.2s ease-in-out",
        ...backdropBlurStyle,
    border: "2px solid #f1f1f111"
  }}
>
  {msg.type === "image" ? (
    <Card
      sx={{
        borderRadius: "16px",
        position: "relative",
        maxHeight: "300px",
        mx: 0.2,
        overflow: "hidden",
        boxShadow: "none",
        cursor: "pointer",
        "&:hover .overlay": { opacity: 1 },
      }}
    >
      <CardMedia
        component="img"
        image={msg.dataUri}
        alt="chat-img"
        sx={{
          width: "100%",
          height: "auto",
          objectFit: "cover",
          borderRadius: "14px",
          transition: "transform 0.3s ease",
          "&:hover": {
            transform: "scale(1.02)",
          },
        }}
        onClick={() => handleImageClick(msg)}
      />

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
      {Object.entries(getGroupedReactions(msg)).map(([emoji]) => (
        <Chip
          key={emoji}
          label={
            <span
              style={{
                fontSize: '0.8rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
                height: '100%',
                letterSpacing: 0,
                userSelect: 'none',
              }}
            >
              {emoji}
            </span>
          }
          size="small"
          sx={{
            bgcolor: effectiveChatTheme === "dark" ? "#353535" : "#ffffff",
            color: effectiveChatTheme === "dark" ? "#fff" : "#222",
            borderRadius: '25px',
            cursor: 'pointer',
            border:
              effectiveChatTheme === "dark"
                ? '1.5px solid #000000ff'
                : '1.5px solid #d3d3d3ff',
            height: 20,
            width: 20,
            minWidth: 0,
            minHeight: 0,
            boxShadow:
              effectiveChatTheme === "dark"
                ? "0 2px 8px #000a"
                : "0 2px 8px #8882",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.18s cubic-bezier(0.4,0,0.2,1)",
            '&:hover': {
              bgcolor: effectiveChatTheme === "dark" ? "#444" : "#f5f5f5",
              borderColor:
                effectiveChatTheme === "dark" ? "#b2b2b2ff" : "#565656ff",
              transform: "scale(1.13)",
              boxShadow:
                effectiveChatTheme === "dark"
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

{shouldShowTimestamp(messages, index) && (
  <Typography
    variant="caption"
    sx={{
      fontSize: '0.7rem',
      width: '75%',
      minWidth: "100px",
      color: headerTextColor,
      mt: 0.5,
      mb: 1.5,
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center"
    }}
  >
    {(() => {
      if (!msg.timestamp) return "";
      const date = typeof msg.timestamp.toDate === "function"
        ? msg.timestamp.toDate()
        : new Date(msg.timestamp);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    })()}

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
)}

          </Box>
            <div ref={messagesEndRef} />
          </Box>  

          </motion.div>
        );
          })}
        </AnimatePresence>

        <AnimatePresence>
            {isFriendTyping && (
                <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.9 }}
                transition={{ duration: 0.3, type: 'spring', stiffness: 200, damping: 20 }}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    alignSelf: 'flex-start',
                    margin: '0 0 10px 0'
                }}
                >
                <Paper
                    elevation={1}
                    sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    p: '10px 12px',
                    borderRadius: '20px 20px 20px 4px',
                    bgcolor: effectiveChatTheme === "dark" ? "#353535" : "#ffffff",
                    color: effectiveChatTheme === "dark" ? "#fff" : "#000",
                    boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
                    }}
                >
                    <Box sx={{ display: 'flex', gap: '3px', '& span': {
                        width: '6px', height: '6px', borderRadius: '50%', bgcolor: 'currentColor',
                        animation: `${keyframes`0%, 100% { opacity: 0.3; transform: scale(0.8); } 50% { opacity: 1; transform: scale(1); }`} 1.4s infinite`,
                        '&:nth-of-type(2)': { animationDelay: '0.2s' },
                        '&:nth-of-type(3)': { animationDelay: '0.4s' }
                    }}}>
                    <span></span><span></span><span></span>
                    </Box>
                </Paper>
                </motion.div>
            )}
        </AnimatePresence>

        <div ref={messagesEndRef} />
      </Box>
    </Box>


      <div ref={bottomRef} />
<Box
  component="form"
  fullWidth
  onSubmit={sendMessage}
  sx={{
    position: "absolute",
    bottom: "40px",
    left: "50%",
    transform: "translateX(-50%)",
    width: "95%",
    borderRadius: "30px 30px 0 0",
    background: getGradientStyle('bottom'),
    display: "flex",
    flexDirection: "column", // stack reply preview + input area
    justifyContent: "space-between",
    px: 1.2,
    py: 1.2,
    boxShadow: "none",
    zIndex: 1200,
    transition: "all ease-in-out 0.3s"
  }}
>
  {/* Reply preview collapse */}
<Collapse in={Boolean(replyingTo)} timeout={300}>
  {replyingTo && (
    <Paper
      sx={{
        mb: 1.2,
        p: 1.2,
        px: 1.6,
        borderRadius: "14px",
        background:
          effectiveChatTheme === "dark"
            ? "linear-gradient(145deg, #5e5e5e4f, #5e5e5e4f)"
            : "linear-gradient(145deg, #ffffff2c, #f7f7f73c)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        ...backdropBlurStyle, // <-- APPLIED BLUR TO REPLY PREVIEW
        boxShadow: "none",
        border: "2px solid #f1f1f111"
      }}
    >
      {/* Left Section */}
      <Box sx={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <Typography
          variant="caption"
          sx={{
            fontWeight: 700,
            letterSpacing: 0.3,
            color: effectiveChatTheme === "dark" ? "#4CAF50" : "#0a7c3a",
          }}
        >
          {replyingTo.senderId === currentUser.uid ? "You" : friendDetails.name}
        </Typography>

        {replyingTo.text ? (
          <Typography
            variant="body2"
            noWrap
            sx={{
              color: effectiveChatTheme === "dark" ? "#e0e0e0" : "#333",
              fontSize: "0.9rem",
              opacity: 0.95,
              maxWidth: "65vw",
            }}
          >
            {replyingTo.text}
          </Typography>
        ) : (replyingTo.imageUrl || replyingTo.dataUri) ? (
          <Typography
            variant="body2"
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 0.6,
              color: effectiveChatTheme === "dark" ? "#e0e0e0" : "#333",
              fontSize: "0.9rem",
              opacity: 0.95,
            }}
          >
            <Box component="span" sx={{ fontSize: "1.1rem" }}>📷</Box>
            Photo
          </Typography>
        ) : null}
      </Box>

      {/* Right Section */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        {(replyingTo.imageUrl || replyingTo.dataUri) && (
          <Box
            component="img"
            src={replyingTo.imageUrl || replyingTo.dataUri}
            alt="reply preview"
            sx={{
              width: 42,
              height: 42,
              borderRadius: 1.5,
              objectFit: "cover",
              boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
            }}
          />
        )}
        <IconButton
          size="small"
          onClick={() => setReplyingTo(null)}
          sx={{
            bgcolor: effectiveChatTheme === "dark" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)",
            color: effectiveChatTheme === "dark" ? "#fff" : "#333",
            width: 26,
            height: 26,
            transition: "all 0.2s ease",
            "&:hover": {
              bgcolor: effectiveChatTheme === "dark" ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.1)",
              transform: "scale(1.1)",
            },
          }}
        >
          <CloseIcon sx={{ fontSize: "16px" }} />
        </IconButton>
      </Box>
    </Paper>
  )}
</Collapse>

  {isBlocked ? (
    // Show unblock and delete chat options when blocked
<Box
  sx={{
    display: "flex",
    gap: 1.5,
    mt: 2,
    width: "100%",
  }}
>
  {/* Unblock / Block Button */}
  <Button
    onClick={toggleBlockFriend}
    fullWidth
    sx={{
      flex: 1,
      bgcolor: mode === "dark" ? "#ffffff1f" : "rgba(0,0,0,0.05)",
      color: "#ff4d4d",
      ...backdropBlurStyle, // <-- APPLIED BLUR
      borderRadius: "12px",
      py: 1.4,
      px: 1.6,
      fontWeight: 600,
      textTransform: "none",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 1,
      transition: "all 0.25s ease",
      "&:hover": {
        bgcolor: mode === "dark"
          ? "rgba(255,0,0,0.15)"
          : "rgba(255,0,0,0.08)",
        transform: "translateY(-2px)",
        boxShadow: "0 4px 15px rgba(0,0,0,0.25)",
      },
      "&:active": { transform: "scale(0.97)" },
    }}
  >
    <PersonOffIcon sx={{ fontSize: 20 }} />
    <Typography variant="body1" sx={{ fontSize: 15, fontWeight: 600 }}>
      Unblock Friend
    </Typography>
  </Button>

  {/* Delete Chat Button */}
  <Button
    onClick={handleClearChat}
    fullWidth
    sx={{
      flex: 1,
      bgcolor: mode === "dark" ? "#ffffff1f" : "rgba(0,0,0,0.05)",
      color: mode === "dark" ? "#fff" : "#000",
      ...backdropBlurStyle, // <-- APPLIED BLUR
      borderRadius: "12px",
      py: 1.4,
      px: 1.6,
      fontWeight: 600,
      textTransform: "none",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 1,
      transition: "all 0.25s ease",
      "&:hover": {
        bgcolor: mode === "dark"
          ? "rgba(255,255,255,0.12)"
          : "rgba(0,0,0,0.08)",
        transform: "translateY(-2px)",
        boxShadow: "0 4px 15px rgba(0,0,0,0.25)",
      },
      "&:active": { transform: "scale(0.97)" },
    }}
  >
    <DeleteOutlineIcon sx={{ fontSize: 20 }} />
    <Typography variant="body1" sx={{ fontSize: 15, fontWeight: 600 }}>
      Delete Chat
    </Typography>
  </Button>
</Box>

  ) : (
  <Box sx={{ display: "flex", alignItems: "center" }}>
<Box
  sx={{
    display: "flex",
    alignItems: "center",
    px: 0.6,
    py: 0.2,
    mr: 1,
    borderRadius: "30px",
    bgcolor: effectiveChatTheme === "dark" ? "#5e5e5e4f" : "#ffffff39",
    ...backdropBlurStyle, // <-- APPLIED BLUR TO INPUT WRAPPER
    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
    width: "100%",
    border: "2px solid #f1f1f111"
  }}
>
  {/* Camera Button */}
  <Button
    component="label"
    size="large"
    sx={{
      minWidth: 0,
      borderRadius: "50%",
      height: 38,
      width: 42,
      bgcolor: "#ffffff37",
      ...backdropBlurStyle, // <-- APPLIED BLUR TO BUTTON
      color: effectiveChatTheme === "dark" ? "#fff" : "#000",
      boxShadow: "none",
      transition: "all 0.3s ease",
      "&:hover": {
        bgcolor: "rgba(255,255,255,0.15)",
        transform: "scale(1.1)",
        boxShadow: "0 6px 20px rgba(0,0,0,0.25)",
      },
      "&:active": { transform: "scale(0.95)" },
    }}
  >
    <CameraAltOutlinedIcon sx={{ fontSize: 22 }} />
    <input type="file" accept="image/*" hidden onChange={handleImageUpload} />
  </Button>

  {/* Message Input */}
  <TextField
    value={input}
    onChange={handleInputChange}
    placeholder={editMessageId ? "Editing message..." : "Type your message..."}
    fullWidth
    variant="outlined"
    size="small"
    sx={{
      borderRadius: "40px",
      input: {
        color: effectiveChatTheme === "dark" ? "#fff" : "#000",
        height: "28px",
        borderRadius: "40px",
        px: 2,
      },
      "& .MuiOutlinedInput-root": {
        "& fieldset": {
          borderColor: "transparent",
          borderRadius: "40px",
        },
        "&:hover fieldset": { borderColor: "#88888800" },
        "&.Mui-focused fieldset": { borderColor: "#66666600" },
      },
      "& .MuiInputBase-input::placeholder": {
        color: effectiveChatTheme === "dark" ? "#bbb" : "#555",
        opacity: 0.9,
      },
    }}
  />
</Box>
    <Button
      type="submit"
      sx={{
        backgroundColor: effectiveChatTheme === "dark" ? "#ffffffd2" : "#000000a8",
        height: "48px",
        minWidth: "48px",
        borderRadius: 8,
        ...backdropBlurStyle, // <-- APPLIED BLUR TO BUTTON
      }}
      disabled={isSending}
    >
      {isSending ? (
        <CircularProgress size={21} sx={{ color: effectiveChatTheme === "dark" ? "#000" : "#fff" }} />
      ) : (
        <SendIcon sx={{ fontSize: 21, color: effectiveChatTheme === "dark" ? "#000" : "#fff" }} />
      )}
    </Button>
  </Box>
)}
</Box>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          sx: {
            minWidth: 220,
            borderRadius: 4,
            backgroundImage: "none",
            backgroundColor: "transparent",
            color: effectiveChatTheme === "dark" ? "#fff" : "#222",
            boxShadow: "none",
            p: 1,
            overflow: 'hidden',
            transition: "box-shadow 0.3s, background 0.3s",
          },
        }}
      >
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, px: 1, py: 1, backgroundColor: effectiveChatTheme === "dark" ? '#1c1c1c70' : '#ffffff76', ...backdropBlurStyle, borderRadius: 8, boxShadow: "none" }}>
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
              fontSize: 24,
              bgcolor: effectiveChatTheme === "dark" ? '#29292900' : '#f7f7f700',
              borderRadius: 8,
              color: effectiveChatTheme === "dark" ? "#fff" : "#222",
              boxShadow: "none",
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
            bgcolor: effectiveChatTheme === "dark" ? '#29292933' : '#ffffffff',
            borderRadius: 8,
            color: effectiveChatTheme === "dark" ? "#fff" : "#222",
            boxShadow: "none",
            ...backdropBlurStyle, // <-- APPLIED BLUR TO BUTTON
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
      
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column', 
          backgroundColor: effectiveChatTheme === "dark" ? '#1c1c1c70' : '#ffffff76',
          ...backdropBlurStyle, // <-- APPLIED BLUR TO MENU ITEM GROUP
          borderRadius: 7,
          boxShadow: "none",
          px: 0.2,
          py: 0.5,
          mt: 1
        }}
      >
        <MenuItem
          onClick={() => {
            setReplyingTo(selectedMsg);
            handleMenuClose();
          }}
          sx={{
            fontWeight: 500,
            fontSize: 15,
            borderRadius: "25px 25px 8px 8px",
            mx: 0.5,
            my: 0.2,
            ...backdropBlurStyle, // <-- APPLIED BLUR TO MENU ITEM
            color: effectiveChatTheme === "dark" ? "#fff" : "#222",
            '&:hover': { bgcolor: effectiveChatTheme === "dark" ? '#23232358' : '#ffffffff' },
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
                ...backdropBlurStyle, // <-- APPLIED BLUR TO MENU ITEM
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
                ...backdropBlurStyle, // <-- APPLIED BLUR TO MENU ITEM
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
              ...backdropBlurStyle, // <-- APPLIED BLUR TO MENU ITEM
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

        <MenuItem
          onClick={() => {
            navigator.clipboard.writeText(selectedMsg?.text || '');
            setNotification('Message copied!');
            handleMenuClose();
          }}
          sx={{
            fontSize: 15,
            borderRadius: "8px 8px 25px 25px",
            mx: 0.5,
            my: 0.2,
            ...backdropBlurStyle, // <-- APPLIED BLUR TO MENU ITEM
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
      </Box>
      </Menu>
      
<Dialog
  open={imageDrawer}
  onClose={() => setImageDrawer(false)}
  fullScreen
  PaperProps={{
    sx: {
      backgroundColor: "rgba(0,0,0,0.9)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      ...backdropBlurStyle, // <-- APPLIED BLUR TO DIALOG
    },
  }}
>
  <Box sx={{ position: "absolute", top: 20, right: 20 }}>
    <IconButton onClick={() => setImageDrawer(false)} sx={{ color: "#fff" }}>
      <CloseIcon />
    </IconButton>
  </Box>
  <Box sx={{ p: 3, textAlign: "center", width: "100%", maxWidth: 600 }}>
    <Typography variant="h5" sx={{ mb: 2, color: "#fff" }}>
      Edit & Send Image
    </Typography>

    {/* Cropper UI */}
    {cropMode ? (
      <>
        <Box sx={{ position: "relative", width: "100%", height: 400 }}>
          <Cropper
            image={imageDataUri}
            crop={crop}
            zoom={zoom}
            aspect={4 / 3}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        </Box>
        <Box sx={{ mt: 2, display: "flex", justifyContent: "center", gap: 2 }}>
          <Button variant="contained" color="primary" onClick={applyCrop}>
            Apply Crop
          </Button>
          <Button onClick={() => setCropMode(false)} color="secondary">
            Cancel
          </Button>
        </Box>
      </>
    ) : (
      <>
        {/* Image Preview */}
        {imageDataUri && (
          <img
            src={imageDataUri}
            alt="Preview"
            style={{
              maxWidth: "100%",
              maxHeight: "55vh",
              borderRadius: 10,
              boxShadow: "0 2px 8px #0008",
              marginBottom: 20,
            }}
          />
        )}
        <Box sx={{ display: "flex", justifyContent: "center", gap: 2, mb: 3 }}>
          <IconButton aria-label="Add Text" color="primary" onClick={handleAddText}>
            <TextFieldsIcon />
          </IconButton>
          <IconButton aria-label="Crop" color="primary" onClick={handleCropImage}>
            <CropIcon />
          </IconButton>
          <IconButton aria-label="Rotate" color="primary" onClick={handleRotateImage}>
            <RotateRightIcon />
          </IconButton>
        </Box>
        {/* Add Text input */}
        <TextField
          placeholder="Enter text to add"
          value={text}
          onChange={e => setText(e.target.value)}
          sx={{
            mb: 2,
            input: { color: "#fff", backgroundColor: "#222" },
          }}
          fullWidth
          variant="outlined"
        />
        <Box sx={{ display: "flex", justifyContent: "center", gap: 2 }}>
          <Button variant="contained" color="primary" onClick={handleSendMessage}>
            Send
          </Button>
          <Button
            startIcon={<CloseIcon />}
            onClick={() => setImageDrawer(false)}
            sx={{ color: "#fff", borderColor: "#fff" }}
          >
            Cancel
          </Button>
        </Box>
      </>
    )}
  </Box>
</Dialog>

      
      <SwipeableDrawer
        anchor="bottom"
        open={Boolean(reactionAnchorEl) && !showEmojiPicker}
        onClose={() => {
          setReactionAnchorEl(null);
          setReactionMsg(null);
        }}
        onOpen={() => {}}
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
            ...backdropBlurStyle, // <-- APPLIED BLUR TO DRAWER
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
                  ...backdropBlurStyle, // <-- APPLIED BLUR TO MENU ITEM
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
                        color: effectiveChatTheme === "dark" ? "#fff" : "#000",
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
            ...backdropBlurStyle, // <-- APPLIED BLUR TO POPOVER
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
                backgroundColor: effectiveChatTheme === "dark" ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.7)',
                color: effectiveChatTheme === "dark" ? "#fff" : "#000",
                borderRadius: '5px',
                zIndex: 1000,
                ...backdropBlurStyle, // <-- APPLIED BLUR TO NOTIFICATION
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
  onClose={handleCloseProfile}
  onOpen={handleOpenProfile}
  fullHeight
  PaperProps={{
    sx: {
      border: 'transparent',
      backgroundColor: effectiveChatTheme === "dark" ? '#0c0c0c9d' : '#ffffffad',
      ...backdropBlurStyle, // <-- APPLIED BLUR TO DRAWER
      color: effectiveChatTheme === "dark" ? "#fff" : "#000",
      maxWidth: 470,
      height: '100vh',
      mx: 'auto',
      backgroundImage: "none",
      pt: 4.5
    },
  }}
>
  <Box sx={{ p: 3, position: 'relative', height: '100%', overflowY: 'auto', mt: 4.5 }}>

    <Button
      startIcon={<ArrowBackIcon />}
      onClick={goBack}
      sx={{
        mb: 0,
        borderRadius: 8,
        color: effectiveChatTheme === "dark" ? "#fff" : "#000",
        backgroundColor: effectiveChatTheme === "dark" ? "#f1f1f111" : "#0c0c0c11",
        ...backdropBlurStyle, // <-- APPLIED BLUR TO BUTTON
        '&:hover': { backgroundColor: "#f1f1f121" },
      }}
    >
      Back
    </Button>

    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 2 }}>
      <Avatar src={friendDetails.photoURL} sx={{ width: 90, height: 90, mb: 2 }} />
      <Typography variant="h6" fontWeight="bold" color={effectiveChatTheme === "dark" ? "#fff" : "#000"}>{nickname || friendDetails.name}</Typography>
      <Typography variant="subtitle1" sx={{ color: effectiveChatTheme === "dark" ? "#aaa" : "#333" }}>@{friendDetails.username}</Typography>

      <Typography
        variant="body2"
        sx={{
          backgroundColor: effectiveChatTheme === "dark" ? "#f1f1f111" : "#0c0c0c11",
          px: 2,
          py: 0.5,
          borderRadius: 4,
          color: effectiveChatTheme === "dark" ? "#aaa" : "#333",
          ...backdropBlurStyle, // <-- APPLIED BLUR
        }}
      >
        {friendDetails.name}
      </Typography>
    </Box>

    <Stack spacing={0.5} mt={3} mb={2} sx={{ backgroundColor: "#f1f1f100", borderRadius: 1, p: 1 }}>
  {visibleStackItems.map((item, index) =>
    React.cloneElement(item, {
      sx: {
        ...item.props.sx,
        borderRadius: getDynamicBorderRadius(index, visibleStackItems.length),
        ...backdropBlurStyle, // Already in item.props.sx, but ensuring here too.
      }
    })
  )}

<Box>
  {commonGroups.length > 0 && (
  <Typography variant="subtitle1" fontWeight="bold" mt={3} mb={0.5}>
    Common Groups
  </Typography>
  )}
<Grid container spacing={0.5} mb={2}>
  {commonGroups.length > 0 && (
    <>
      {commonGroups.slice(0, 3).map((group, index, arr) => (
        <Grid item xs={12} sm={6} md={4} key={group.id}>
          <Card
            sx={{
              bgcolor: effectiveChatTheme === "dark" ? "#f1f1f106" : "#ffffff2d",
              color: effectiveChatTheme === "dark" ? "#fff" : "#000",
              borderRadius: getDynamicBorderRadius(index, arr.length + (commonGroups.length > 3 ? 1 : 0)),
              overflow: "hidden",
              boxShadow: "none",
              ...backdropBlurStyle, // <-- APPLIED BLUR TO CARD
            }}
          >
            <CardActionArea onClick={() => history(`/group/${group.id}`)}>
              <CardContent sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Avatar
                  src={group.iconURL}
                  sx={{ bgcolor: effectiveChatTheme === "dark" ? "#fff" : "#000", color: "#111" }}
                >
                  {group.emoji || group.name?.charAt(0)}
                </Avatar>
                <Box sx={{ minWidth: 0 }}>
                  <Typography
                    variant="body1"
                    color={effectiveChatTheme === "dark" ? "#fff" : "#000"}
                    fontWeight="bolder"
                    noWrap
                  >
                    {group.name}
                  </Typography>
                  <Box
                    sx={{
                      width: "100%",
                      overflow: "hidden",
                      whiteSpace: "nowrap",
                      textOverflow: "ellipsis",
                      fontSize: 13,
                      color: effectiveChatTheme === "dark" ? "#ccc" : "#555"
                    }}
                  >
                    {(group.members ?? [])
                      .map(uid => groupMembersInfo[uid]?.name)
                      .filter(Boolean)
                      .join(", ") || (
                        <Typography variant="caption" sx={{ color: "#ccc" }}>
                          Loading...
                        </Typography>
                      )}
                  </Box>
                </Box>
              </CardContent>
            </CardActionArea>
          </Card>
        </Grid>
      ))}

      {commonGroups.length > 3 && (
          <Button
            variant="contained"
            fullWidth
            sx={{
              color: effectiveChatTheme === "dark" ? "#fff" : "#000",
              backgroundColor: effectiveChatTheme === "dark" ? "#f1f1f121" : "#ffffff2d",
              borderRadius: getDynamicBorderRadius(
                Math.min(commonGroups.length, 3), // last item index in the visible stack
                Math.min(commonGroups.length, 3) + 1 // total visible items including the button
              ),
              fontWeight: 600,
              boxShadow: "none",
              ...backdropBlurStyle, // <-- APPLIED BLUR TO BUTTON
            }}
            onClick={() => setAllCommonGroupsDrawerOpen(true)}
          >
            {commonGroups.length - 3} more group{commonGroups.length - 3 > 1 ? "s" : ""}
          </Button>
      )}
    </>
  )}
</Grid>
</Box>

<Box mb={4}>
  {visibleTrips.length > 0 && (
  <Typography variant="subtitle1" fontWeight="bold" mb={1}>
    Common Trips
  </Typography>
  )}
  <List>
    {visibleTrips.map((trip, index, arr) => {
      const borderRadius = getDynamicBorderRadius(index, arr.length + (moreCount > 0 ? 1 : 0)); // include "more" button

      return (
        <Card
          key={trip.id}
          sx={{
            background: `url(${trip?.iconURL})`,
            backgroundSize: "cover",
            backgroundColor: effectiveChatTheme === "dark" ? "#f1f1f111" : "#ffffff2d",
            backgroundPosition: "center",
            color: effectiveChatTheme === "dark" ? "#fff" : "#000",
            borderRadius,
            boxShadow: "none",
            mb: 0.5,
            ...backdropBlurStyle, // <-- APPLIED BLUR TO CARD
          }}
        >
          <CardContent>
            <Box display="flex" alignItems="start" gap={2} py="0">
              <Box py="0">
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 1
                  }}
                >
                  {timelineStatsMap?.[trip.id] && (
                  <Box>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: '75vw' }}>
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
                      </Box>
                      )}
                    </Box>
                  </Box>
                </Box>
              </CardContent>
            </Card>
      );
    })}

    {moreCount > 0 && (
      <Button
        variant="contained"
        fullWidth
        sx={{
          color: effectiveChatTheme === "dark" ? "#fff" : "#000",
          backgroundColor: effectiveChatTheme === "dark" ? "#f1f1f111" : "#ffffff3c",
          borderRadius: getDynamicBorderRadius(visibleTrips.length, visibleTrips.length + 1), // last item
          fontWeight: 600,
          boxShadow: "none",
          py: 1,
          px: 2,
          ...backdropBlurStyle, // <-- APPLIED BLUR TO BUTTON
        }}
        onClick={() => setShowAllTripsDrawer(true)}
      >
        {moreCount} more trip{moreCount > 1 ? "s" : ""}
      </Button>
    )}
  </List>
</Box>

    <Box></Box>

<Stack spacing={0.5}>
  {actionButtons.filter(Boolean).map((btn, index, arr) =>
    React.cloneElement(btn, {
      sx: { ...btn.props.sx, borderRadius: getDynamicBorderRadius(index, arr.length), ...backdropBlurStyle }
    })
  )}
</Stack>
    </Stack>

  </Box>

{/* NEW: Mutual Friends List Drawer */}
<SwipeableDrawer
  anchor="bottom"
  open={mutualFriendsDrawerOpen}
  onClose={handleCloseMutualFriendsDrawer}
  onOpen={() => {}}
  PaperProps={{
    sx: { 
      borderTopLeftRadius: 20, 
      borderTopRightRadius: 20, 
      backgroundColor: effectiveChatTheme === "dark" ? "#0c0c0c0a" : "#f1f1f19a", 
      ...backdropBlurStyle,
      color: effectiveChatTheme === "dark" ? "#fff" : "#000", 
      maxWidth: 470, 
      mx: 'auto', 
      p: 2, 
      height: '90vh' 
    }
  }}
>
  <Box sx={{ width: 40, height: 5, bgcolor: '#555', borderRadius: 3, mx: 'auto', mb: 2 }} />
  <Typography variant="h6" sx={{ mb: 3, textAlign: "center", fontWeight: 700 }}>
    Mutual Friends ({mutualFriendsCount})
  </Typography>

  <List sx={{ maxHeight: "calc(90vh - 100px)", overflowY: "auto", pr: 1 }}>
    {mutualFriends.map((mf) => (
      <Card key={mf.id} sx={{ 
        bgcolor: effectiveChatTheme === "dark" ? '#0c0c0c11' : '#ffffff31', 
        color: effectiveChatTheme === "dark" ? "#fff" : "#000", 
        borderRadius: 2, 
        mb: 0.5, 
        boxShadow: "none", 
        overflow: "hidden", 
        ...backdropBlurStyle 
      }}>
        <CardActionArea 
          // You might want to link to their profile or chat here
          onClick={() => {
            // Example: close drawer and navigate to friend's profile/chat
            handleCloseMutualFriendsDrawer();
            history(`/profile/${mf.id}`);
          }}
        >
          <CardContent sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Avatar src={mf.photoURL} sx={{ bgcolor: effectiveChatTheme === "dark" ? "#fff" : "#000", color: '#111' }}>
              {mf.name?.charAt(0)}
            </Avatar>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="body1" color={effectiveChatTheme === "dark" ? "#fff" : "#000"} fontWeight="regular" noWrap>
                {mf.name}
              </Typography>
              <Typography variant="caption" sx={{ color: effectiveChatTheme === "dark" ? "#ccc" : "#555" }} noWrap>
                @{mf.username}
              </Typography>
            </Box>
          </CardContent>
        </CardActionArea>
      </Card>
    ))}
    {mutualFriendsCount === 0 && (
      <Typography variant="body2" sx={{ textAlign: 'center', py: 3, color: effectiveChatTheme === "dark" ? "#aaa" : "#555" }}>
        No mutual friends found.
      </Typography>
    )}
  </List>
</SwipeableDrawer>

<SwipeableDrawer
  anchor="bottom"
  open={allCommonGroupsDrawerOpen}
  onClose={() => setAllCommonGroupsDrawerOpen(false)}
  onOpen={()=>{}}
  PaperProps={{
    sx: {
      borderTopLeftRadius: 20, borderTopRightRadius: 20,
      backgroundColor: effectiveChatTheme === "dark" ? "#0c0c0c0a" : "#f1f1f19a",
      ...backdropBlurStyle, // <-- APPLIED BLUR TO DRAWER
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
            sx={{ bgcolor: effectiveChatTheme === "dark" ? '#0c0c0c11' : '#ffffff31', color: effectiveChatTheme === "dark" ? "#fff" : "#000", borderRadius: 2, mb: 0.5, boxShadow: "none", overflow: "hidden", ...backdropBlurStyle }}>
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
    sx: { borderTopLeftRadius: 20, borderTopRightRadius: 20, backgroundColor: effectiveChatTheme === "dark" ? "#0c0c0c0a" : "#f1f1f19a", ...backdropBlurStyle, color: effectiveChatTheme === "dark" ? "#fff" : "#000", maxWidth: 470, mx: 'auto', p: 2, height: '90vh' }
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
          ...backdropBlurStyle, // <-- APPLIED BLUR TO CARD
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
              ...backdropBlurStyle, // <-- APPLIED BLUR TO DRAWER
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
                ...backdropBlurStyle, // <-- APPLIED BLUR TO BUTTON
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
                borderRadius: 14,
                ...backdropBlurStyle, // <-- APPLIED BLUR TO BUTTON
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

