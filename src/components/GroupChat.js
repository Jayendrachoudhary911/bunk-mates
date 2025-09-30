import React, { useEffect, useState, useRef } from 'react';
import { auth } from '../firebase';
import { db } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  arrayUnion,
  arrayRemove,
  deleteDoc,
} from 'firebase/firestore';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  TextField,
  Button,
  Typography,
  Avatar,
  Paper,
  IconButton,
  SwipeableDrawer,
  List,
  ListItem,
  ListItemText,
  Dialog,
  ThemeProvider,
  DialogActions,
  DialogContent,
  DialogTitle,
  Checkbox,
  ListItemButton,
  Divider,
  MenuItem,
  Tooltip,
  Menu,
  Fab,
  Collapse,
  AppBar
} from '@mui/material';
import EmojiPicker from 'emoji-picker-react';
import Popover from '@mui/material/Popover';
import { fontSize, fontStyle, styled } from '@mui/system';
import BetaAccessGuard from "../components/BetaAccessGuard";
import SendIcon from '@mui/icons-material/Send';
import CloseIcon from '@mui/icons-material/Close';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import EditIcon from "@mui/icons-material/Edit";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import CheckIcon from '@mui/icons-material/Check';
import RemoveIcon from '@mui/icons-material/Remove';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ReplyIcon from '@mui/icons-material/Reply';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import DoneAllIcon from '@mui/icons-material/DoneAll';

import GroupInfoDrawer from "./GroupChat/GroupInfoDrawer";

import { motion, useAnimation, AnimatePresence, color } from 'framer-motion';
import { useThemeToggle } from "../contexts/ThemeToggleContext";
import { getTheme } from "../theme";
import { FastAverageColor } from "fast-average-color";

const MessageContainer = styled(Box)({
    flex: 1,
    overflowY: 'auto',
    backgroundColor: '#12121200',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-end',
    bottom: '0'
  });
  
  const MessageTime = styled(Typography)({
    fontSize: '10px',
    position: 'absolute',
    bottom: '-18px',
    right: '5px',
    color: '#B0BEC5', // Grey text
  });
  
  const GroupHeader = styled(Box)({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '0',
    backgroundColor: '#2C387E00', // Dark indigo header
    borderBottom: '1px solid rgba(66, 66, 66, 0.16)',
    color: '#FFFFFF',
  });

  const getMessageShape = (messages, index, currentuser) => {
  const msg = messages[index];
  const prevMsg = messages[index - 1];
  const nextMsg = messages[index + 1];
  const isOwn = msg.senderId === currentuser.uid;

  const within1Min = (a, b) =>
    Math.abs(a?.timestamp?.seconds - b?.timestamp?.seconds) < 60;

  const samePrev = prevMsg && prevMsg.senderId === msg.senderId && within1Min(msg, prevMsg);
  const sameNext = nextMsg && nextMsg.senderId === msg.senderId && within1Min(msg, nextMsg);

  let borderRadius;
  if (isOwn) {
    if (samePrev && sameNext) borderRadius = "20px 10px 10px 20px";
    else if (samePrev && !sameNext) borderRadius = "20px 20px 4px 4px";
    else if (!samePrev && sameNext) borderRadius = "20px 20px 10px 20px";
    else borderRadius = "20px 20px 4px 20px";
  } else {
    if (samePrev && sameNext) borderRadius = "10px 20px 20px 10px";
    else if (samePrev && !sameNext) borderRadius = "10px 20px 20px 4px";
    else if (!samePrev && sameNext) borderRadius = "20px 20px 20px 10px";
    else borderRadius = "20px 20px 20px 4px";
  }
  return { borderRadius };
};

// Helper function to decide when to show the timestamp
const shouldShowTimestamp = (messages, index) => {
  const msg = messages[index];
  const nextMsg = messages[index + 1];
  if (!nextMsg) return true;
  const sameSender = nextMsg.senderId === msg.senderId;
  const sameMinute = Math.abs(msg.timestamp?.seconds - nextMsg.timestamp?.seconds) < 60;
  return !(sameSender && sameMinute);
};

const isSingleEmoji = (text) => {
  // Regex for a single emoji (unicode, covers most cases)
  // This will match if the message is only one emoji and optional whitespace
  return typeof text === "string" &&
    text.trim().length > 0 &&
    /^(\p{Emoji_Presentation}|\p{Emoji}\uFE0F)$/u.test(text.trim());
};
  
function GroupChat() {
  const { groupName } = useParams();
  const { mode, accent, } = useThemeToggle();
  const theme = getTheme(mode, accent);
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState('');
  const [loading, setLoading] = useState(true);
  const [groupInfo, setGroupInfo] = useState({});
  const bottomRef = useRef(null);
  const navigate = useNavigate();
  const [createdByUser, setCreatedByUser] = useState(null);
  const [memberUsers, setMemberUsers] = useState([]);
  const currentUser = auth.currentUser;
  const [profileOpen, setProfileOpen] = useState(false);
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, message: null });
  const [replyTo, setReplyTo] = useState(null);
  const [longPressTimer, setLongPressTimer] = useState(null);
  const controls = useAnimation();
  const [user, setUser] = useState(null)
  const [memberInfo, setMemberInfo] = useState({});
  const [addUserDialogOpen, setAddUserDialogOpen] = useState(false);
  const [groupSettingsOpen, setGroupSettingsOpen] = useState(false);
  const [notification, setNotification] = useState(null);
  const [allUsers, setAllUsers] = useState({}); // { uid1: { photoURL, name }, ... }
  const [editingMsg, setEditingMsg] = useState(null); // message object
  const [editText, setEditText] = useState(""); // input value

  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedMsg, setSelectedMsg] = useState(null);

  const [reactionAnchorEl, setReactionAnchorEl] = useState(null);
  const [reactionMsg, setReactionMsg] = useState(null);

  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [membersDrawerOpen, setMembersDrawerOpen] = useState(false);
  const [tripInfo, setTripInfo] = useState(null);
  const [timelineStats, setTimelineStats] = useState(null);
  const [moreAnchorEl, setMoreAnchorEl] = useState(null);
  const [checklist, setChecklist] = useState([]);
  const [timeline, setTimeline] = useState([]);
  const [showPollDialog, setShowPollDialog] = useState(false);
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState(["", ""]);
  const [inviteDrawerOpen, setInviteDrawerOpen] = useState(false);
  const [highlightedMsgId, setHighlightedMsgId] = useState(null);
  const messageRefs = useRef({});
  const [showGoToBottom, setShowGoToBottom] = useState(false);
  const containerRef = useRef(null);
  const [mentionDrawerOpen, setMentionDrawerOpen] = useState(false);
  const [mentionSelected, setMentionSelected] = useState(false);

  const [chatFontSize, setChatFontSize] = useState(parseInt(localStorage.getItem('bunkmate_fontSize'), 10) || 16);
  const [chatWallpaper, setChatWallpaper] = useState(localStorage.getItem('bunkmate_chatWallpaper') || 'default');
  const [effectiveChatTheme, setEffectiveChatTheme] = useState('dark'); // 'light' or 'dark'
  const [typingMembers, setTypingMembers] = useState([]);
  const typingTimeoutRef = useRef(null);
  const [headerTextColor, setHeaderTextColor] = useState(mode === "dark" ? "#fff" : "#000");
  const rgbaFromArray = (arr, alpha = 0.85) => `rgba(${arr[0]}, ${arr[1]}, ${arr[2]}, ${alpha})`;

useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, (u) => {
    if (u) setUser(u);
    else setUser(null);
  });

  return () => unsubscribe();
}, []);

useEffect(() => {
  const text = editingMsg ? editText : newMsg;

  // Check if text contains "@" at the start or anywhere else for new mentions
  const atIndex = text.indexOf('@');

  // Open drawer only if:
  // - starts with @ and no mention is selected
  // - or user types a new '@' after clearing selection
  if (atIndex === 0 && !mentionSelected) {
    setMentionDrawerOpen(true);
  } else if (atIndex > 0 && mentionSelected) {
    // User typed '@' somewhere after a mention was selected, reset to allow new selection
    setMentionSelected(false);
    setMentionDrawerOpen(true);
  } else if (atIndex === -1) {
    // If no @ present at all, close drawer and reset selection
    setMentionDrawerOpen(false);
    setMentionSelected(false);
  }
}, [newMsg, editText, editingMsg]);

const handleMentionSelect = (username) => {
  let text = editingMsg ? editText : newMsg;

  // Replace first '@' and anything typed after it till cursor with '@username '
  // For simplicity, replace whole text starting from '@'

  text = '@' + username + ' ';

  if (editingMsg) {
    setEditText(text);
  } else {
    setNewMsg(text);
  }

  setMentionSelected(true);
  setMentionDrawerOpen(false);
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
  const fetchTrip = async () => {
    if (!groupInfo?.tripId) return setTripInfo(null);
    const tripRef = doc(db, "trips", groupInfo.tripId);
    const tripSnap = await getDoc(tripRef);
    setTripInfo(tripSnap.exists() ? { id: tripSnap.id, ...tripSnap.data() } : null);
  };
  fetchTrip();
}, [groupInfo?.tripId]);

useEffect(() => {
  // Get tripId from groupInfo (if this is a trip group and msg.type === "checklist")
  const tripId = groupInfo?.tripId;
  if (!tripId) return setChecklist([]);
  const q = collection(db, "trips", tripId, "checklist");
  const unsubscribe = onSnapshot(q, (snap) =>
    setChecklist(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })))
  );
  return () => unsubscribe();
}, [groupInfo?.tripId]);

useEffect(() => {
  if (!tripInfo?.id) return setTimelineStats(null);
  getDocs(collection(db, "trips", tripInfo.id, "timeline")).then(snap => {
    const events = snap.docs.map(d => d.data());
    const total = events.length || 1;
    const completed = events.filter(e => e.completed === true).length;
    setTimelineStats({ completed, total, percent: Math.round((completed / total) * 100) });
  });
}, [tripInfo]);

const handleToggleChecklistItem = async (itemId, checked) => {
  if (!groupInfo?.tripId || !currentUser) return;
  const itemRef = doc(db, "trips", groupInfo.tripId, "checklist", itemId);
  await updateDoc(itemRef, {
    checkedBy: checked
      ? arrayUnion(currentUser.uid)
      : arrayRemove(currentUser.uid),
  });
};

const handleOptionChange = (index, value) => {
  setPollOptions((options) => {
    const newOptions = [...options];
    newOptions[index] = value;
    return newOptions;
  });
};

const addOption = () => {
  setPollOptions((options) => [...options, ""]);
};

const removeOption = (index) => {
  setPollOptions((options) => options.filter((_, i) => i !== index));
};

// Fetch timeline from Firestore
const fetchTripTimeline = async () => {
  if (!groupInfo?.tripId) return [];
  const timelineSnap = await getDocs(collection(db, "trips", groupInfo.tripId, "timeline"));
  // Each doc: {text: "...", completed: true/false}
  return timelineSnap.docs.map(doc => doc.data()).filter(Boolean);
};

// Fetch checklist from Firestore
const fetchTripChecklist = async () => {
  if (!groupInfo?.tripId) return [];
  const checklistSnap = await getDocs(collection(db, "trips", groupInfo.tripId, "checklist"));
  // Each doc: {text: "...", completed: true/false}
  return checklistSnap.docs.map(doc => doc.data()).filter(Boolean);
};

useEffect(() => {
  if (!groupInfo?.tripId) return setTimeline([]);
  const q = collection(db, "trips", groupInfo.tripId, "timeline");
  const unsub = onSnapshot(q, (snap) => {
    setTimeline(
      snap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }))
    );
  });
  return () => unsub();
}, [groupInfo?.tripId]);

useEffect(() => {
  const fetchUsers = async () => {
    const snapshot = await getDocs(collection(db, "users"));
    const usersMap = {};
    snapshot.forEach(doc => {
      usersMap[doc.id] = doc.data();
    });
    setAllUsers(usersMap);
  };
  fetchUsers();
}, []);

useEffect(() => {
  if (!groupName) return;

  const groupRef = doc(db, "groupChats", groupName);

  const unsubscribe = onSnapshot(groupRef, (docSnap) => {
    if (docSnap.exists()) {
      setGroupInfo(docSnap.data()); // ✅ keeps everything in sync
    }
  });

  return () => unsubscribe(); // cleanup on unmount
}, [groupName]);

useEffect(() => {
  const fetchMembers = async () => {
    if (!groupInfo?.members) return;

    const fetched = {};
    await Promise.all(
      groupInfo.members.map(async (uid) => {
        try {
          const userRef = doc(db, "users", uid);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            fetched[uid] = userSnap.data();
          }
        } catch (err) {
          console.error("Error fetching member info:", err);
        }
      })
    );
    setMemberInfo(fetched);
  };

  fetchMembers();
}, [groupInfo?.members]);

  useEffect(() => {
    if (!groupName || !currentUser) return;
    const groupDocRef = doc(db, "groupChats", groupName);
    const unsubscribe = onSnapshot(groupDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setGroupInfo(data);
        const drafts = data.drafts || {};
        const typing = Object.entries(drafts)
          .filter(([uid, text]) => uid !== currentUser.uid && text)
          .map(([uid]) => memberInfo[uid]?.name || "Someone");
        setTypingMembers(typing);
      }
    });
    return () => unsubscribe();
  }, [groupName, currentUser, memberInfo]);

    const handleInputChange = (e) => {
      const value = e.target.value;
      editingMsg ? setEditText(value) : setNewMsg(value);
  
      if (!groupName || !currentUser) return;
      const groupDocRef = doc(db, "groupChats", groupName);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
  
      updateDoc(groupDocRef, { [`drafts.${currentUser.uid}`]: value });
      typingTimeoutRef.current = setTimeout(() => {
        updateDoc(groupDocRef, { [`drafts.${currentUser.uid}`]: "" });
      }, 2000);
    };

const sendStructuredMessage = async (label, items) => {
  if (!groupInfo?.tripId || !items?.length) {
    setNotification(`No ${label.toLowerCase()} items found`);
    return;
  }

  let listText = "";
  if (label.toLowerCase() === "timeline") {
    listText = items.map((item, idx) => {
      // Format time and date
      let dateObj;
      // If you store a seconds (timestamp) field, prefer that
      if (item.timestamp?.seconds) {
        dateObj = new Date(item.timestamp.seconds * 1000);
      } else if (item.datetime || item.time) {
        // item.datetime can be an ISO string or item.time can be "09:00 AM"
        dateObj = new Date(item.datetime || `${item.date || ""} ${item.time || ""}`.trim());
      } else {
        dateObj = null;
      }

      let formattedDateTime = "";
      if (dateObj && !isNaN(dateObj.getTime())) {
        formattedDateTime = dateObj.toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });
      } else if (item.time) {
        formattedDateTime = item.time;
      } else {
        formattedDateTime = "—";
      }

      const title = item.title || item.text || "Untitled event";
      const completed = item.completed ? "✅" : "🕒";
      return `${completed} [${formattedDateTime}] ${title}`;
    }).join('\n');
  } else if (label.toLowerCase() === "checklist") {
    listText = items.map((item, idx) => {
      const completed = item.completed ? "✅" : "⬜";
      const text = item.text || item.name || "Untitled task";
      return `${completed} ${text}`;
    }).join('\n');
  }

  const messageObject = {
    text: `${listText}`,
    senderId: currentUser.uid,
    senderName: currentUser.displayName || "Anonymous",
    photoURL: currentUser.photoURL || null,
    timestamp: serverTimestamp(),
    status: 'sent',
    read: false,
    type: label.toLowerCase(),
  };

  try {
    await addDoc(collection(db, "groupChat", groupName, "messages"), messageObject);
    setNotification(`✅ ${label} shared successfully`);
  } catch (err) {
    console.error(`Error sharing ${label}:`, err);
    setNotification(`❌ Could not share ${label}`);
  }
};

const now = new Date(); // Or use new Date("2025-07-20T00:06:00") for consistent testing

// Sort timeline events in descending order (most recent first)
const sortedTimeline = [...timeline].sort((a, b) => {
  // Derive proper Date object from timestamp or datetime
  const getDate = (event) => {
    if (event.timestamp?.seconds)
      return new Date(event.timestamp.seconds * 1000);
    if (event.datetime)
      return new Date(event.datetime);
    return null;
  };
  const dateA = getDate(a);
  const dateB = getDate(b);
  // Descending order
  return dateB - dateA;
});

let upcomingEventId = null;
for (let i = sortedTimeline.length - 1; i >= 0; i--) { // start from soonest
  const event = sortedTimeline[i];
  const date = event.timestamp?.seconds
    ? new Date(event.timestamp.seconds * 1000)
    : event.datetime
    ? new Date(event.datetime)
    : null;
  if (!event.completed && date && date >= now) {
    upcomingEventId = event.id;
    break;
  }
}

const handleSendPoll = async () => {
  const trimmedQuestion = pollQuestion.trim();
  const validOptions = pollOptions.filter(opt => opt.trim() !== "");

  if (!trimmedQuestion || validOptions.length < 2) {
    setNotification("Please enter a question and at least 2 options.");
    return;
  }

  const poll = {
    type: "poll",
    question: trimmedQuestion,
    options: validOptions.map(text => ({ text, votes: [] })),
    senderId: currentUser.uid,
    senderName: currentUser.displayName || "Anonymous",
    photoURL: currentUser.photoURL || null,
    timestamp: serverTimestamp(),
    status: "sent",
    read: false,
  };

  try {
    await addDoc(collection(db, "groupChat", groupName, "messages"), poll);
    setPollQuestion("");
    setPollOptions(["", ""]);
    setShowPollDialog(false);
    setNotification("✅ Poll sent");
  } catch (err) {
    console.error("Error sending poll:", err);
    setNotification("❌ Failed to send poll");
  }
};

const handleVote = async (msgId, optionIdx) => {
  const msgRef = doc(db, "groupChat", groupName, "messages", msgId);
  // Get the current poll message from Firestore
  const snapshot = await getDoc(msgRef);
  if (!snapshot.exists()) return;
  const data = snapshot.data();
  // Prevent duplicate voting
  const alreadyVoted = (data.options || []).some(opt =>
    Array.isArray(opt.votes) && opt.votes.includes(currentUser.uid)
  );
  if (alreadyVoted) return;

  // Safely update ONLY the chosen option's votes array
  const optionPath = `options.${optionIdx}.votes`;
  await updateDoc(msgRef, {
    [optionPath]: arrayUnion(currentUser.uid)
  });
};

useEffect(() => {
  const q = query(
    collection(db, "groupChat", groupName, "messages"),
    orderBy("timestamp", "asc")
  );

  const unsubscribe = onSnapshot(q, (querySnapshot) => {
    const msgs = [];
    querySnapshot.forEach((doc) => {
      msgs.push({ id: doc.id, ...doc.data() });
    });
    setMessages(msgs);
    setLoading(false);
  });

  return () => unsubscribe();
}, [groupName]);

useEffect(() => {
  // Realtime listener for messages and fetching group info and members
  const unsubscribe = onSnapshot(doc(db, 'groupChats', groupName), async (docSnap) => {
    if (docSnap.exists()) {
      const data = docSnap.data();
      setGroupInfo(data);

      // Fetch createdBy user info
      if (data.createdBy) {
        const createdByRef = doc(db, 'users', data.createdBy);
        const createdBySnap = await getDoc(createdByRef);
        if (createdBySnap.exists()) {
          setCreatedByUser(createdBySnap.data());
        }
      }

      // Fetch member user info with UID attached
      if (Array.isArray(data.members) && data.members.length > 0) {
        try {
          const memberFetches = data.members.map((uid) =>
            getDoc(doc(db, 'users', uid))
          );
          const memberDocs = await Promise.all(memberFetches);
          const memberNames = memberDocs
            .map((docSnap, idx) => {
              if (docSnap.exists()) {
                return { uid: data.members[idx], ...docSnap.data() };
              }
              return null;
            })
            .filter(Boolean);
          setMemberUsers(memberNames);
        } catch (e) {
          console.error('Error fetching group members:', e);
          setMemberUsers([]);
        }
      } else {
        setMemberUsers([]);
      }
    }
  });

  return () => unsubscribe();
}, [groupName]);

const BLOCKED_EMOJIS = ["🖕", "🚫"];

const containsBlockedEmoji = (text) => {
  return BLOCKED_EMOJIS.some((emoji) => text.includes(emoji));
};
      
const sendMessage = async () => {
  if (!newMsg.trim()) return;

  // Permissions: check who is allowed to send messages
  const canSend =
    groupInfo?.sendAccess === "all" ||
    groupInfo?.createdBy === currentUser.uid ||
    (groupInfo?.admins || []).includes(currentUser.uid);

  if (!canSend) {
    alert("You don't have permission to send messages in this group.");
    return;
  }

  if (containsBlockedEmoji(newMsg.trim())) {
    alert("This emoji is not allowed.");
    return;
  }

  const messageData = {
    text: newMsg.trim(),
    senderId: currentUser.uid,
    senderName: currentUser.displayName || 'Anonymous',
    photoURL: currentUser.photoURL || null,
    timestamp: serverTimestamp(),
    status: 'sent',
    read: false,
  };

  // Only include replyTo if valid
  if (replyTo?.text && replyTo?.senderName && replyTo?.id) {
    messageData.replyTo = {
      senderName: replyTo.senderName,
      text: replyTo.text,
      id: replyTo.id,
    };
  }

  try {
    await addDoc(collection(db, 'groupChat', groupName, 'messages'), messageData);
    setNewMsg('');
    setReplyTo(null); // Clear reply state
  } catch (err) {
    console.error("Error sending message:", err);
  }
};

  const handleTouchStart = (message) => {
    const timer = setTimeout(() => {
      setContextMenu({ visible: true, x: window.innerWidth / 2, y: window.innerHeight / 2, message });
    }, 600); // 600ms long press
    setLongPressTimer(timer);
  };
  
  const handleTouchEnd = () => {
    clearTimeout(longPressTimer);
  };
  
  const handleReply = (msg) => {
    if (msg?.text && msg?.id && msg?.senderName) {
      setReplyTo(msg);
    }
    setContextMenu({ ...contextMenu, visible: false });
  };
  
const handleDelete = async (messageId) => {
  if (!messageId || !groupName) return;
  try {
    await deleteDoc(doc(db, "groupChat", groupName, "messages", messageId));
    setContextMenu({ ...contextMenu, visible: false });
  } catch (err) {
    console.error("Failed to delete message:", err.message);
  }
};

  useEffect(() => {
    const handleClickOutside = () => {
      if (contextMenu.visible) {
        setContextMenu({ ...contextMenu, visible: false });
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [contextMenu]);
   
  const handleBackButton = () => navigate(-1);

  
const scrollToBottom = () => {
  bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
};

const handleScroll = () => {
  const container = containerRef.current;
  if (!container) return;

  const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
  setShowGoToBottom(distanceFromBottom > 10);
};

useEffect(() => {
  // Scroll to bottom initially and when messages change
  scrollToBottom();
}, [messages]);

useEffect(() => {
  const container = containerRef.current;
  if (!container) return;

  container.addEventListener('scroll', handleScroll);

  return () => {
    container.removeEventListener('scroll', handleScroll);
  };
}, []);

  if (!currentUser) return <div>Loading...</div>;

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

  const groupedMessages = groupMessagesByDate(messages);

const handleReaction = async (emoji, msg) => {
  if (!msg || !msg.id || !groupName || !auth?.currentUser) return;

  const userId = auth.currentUser.uid;
  const messageRef = doc(db, "groupChat", groupName, "messages", msg.id);

  try {
    const msgSnap = await getDoc(messageRef);
    if (!msgSnap.exists()) return;

    const currentData = msgSnap.data();
    const reactions = currentData.reactions || {};

    // Toggle emoji: if same emoji exists, remove it
    if (reactions[userId] === emoji) {
      const updated = { ...reactions };
      delete updated[userId];
      await updateDoc(messageRef, { reactions: updated });
    } else {
      const updated = { ...reactions, [userId]: emoji };
      await updateDoc(messageRef, { reactions: updated });
    }
  } catch (err) {
    console.error("🔥 Failed to update reaction:", err.message);
  }
};

const handleEdit = (msg) => {
  if (msg.senderId !== currentUser.uid) return; // permission check
  setEditingMsg(msg);
  setEditText(msg.text || "");
};

const getGroupedReactions = (msg, allUsers = {}) => {
  const grouped = {};
  if (!msg?.reactions) return grouped;

  for (const [uid, emoji] of Object.entries(msg.reactions)) {
    if (!grouped[emoji]) grouped[emoji] = [];
    grouped[emoji].push({
      uid,
      name: allUsers[uid]?.name || "User",
      photoURL: allUsers[uid]?.photoURL || "",
    });
  }

  return grouped;
};

  const getMessageDate = (timestamp) => {
    if (!timestamp) return "";
    const date = typeof timestamp.toDate === "function" ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString();
  };

const renderMessageWithMentions = (text) => {
  if (!text) return null;

  const mentionRegex = /@(\w+)/g;
  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = mentionRegex.exec(text)) !== null) {
    // Text before mention
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    const username = match[1];

    // Find user by username or name in memberUsers
    const user = memberUsers.find(u => u.username === username || u.name === username);

    if (user) {
      parts.push(
        <Typography
          key={`${username}-${match.index}`}
          component="span"
          onClick={() => navigate(`/chat/${user.uid}`)}
          sx={{
            cursor: 'pointer',
            color: effectiveChatTheme === 'dark' ? '#00f721' : '#007700',
            fontWeight: 'bold',
            '&:hover': { textDecoration: 'underline' },
          }}
        >
          @{username}
        </Typography>
      );
    } else {
      // No matching user: render as plain text
      parts.push(text.slice(match.index, mentionRegex.lastIndex));
    }

    lastIndex = mentionRegex.lastIndex;
  }

  // Remaining text after last mention
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts;
};

  return (
    <ThemeProvider theme={theme}>
          <Box sx={{
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
    }}>

    <AppBar
      position="fixed"
      sx={{
        backgroundImage: getWallpaperUrl(),
        backgroundColor: getWallpaperUrl() === "none"
          ? (effectiveChatTheme === "dark" ? "#0c0c0c" : "#f0f2f5")
          : "transparent",
        backgroundRepeat: "no-repeat",
        backdropFilter: "blur(0px)",
        WebkitBackdropFilter: "blur(0px)",
        padding: "16px 14px 12px",
        zIndex: 1100,
        boxShadow: "none",
        borderRadius: "0px 0px 0px 0px",
        transition: "all 0.3s ease-in-out",
        color: headerTextColor,
      }}
      elevation={0}
    >
  <Box display={"flex"} alignItems={"center"}>
    <IconButton onClick={handleBackButton} sx={{ mr: 1 }} style={{ color: headerTextColor }}>
      <ArrowBackIcon />
    </IconButton>

    <Box
      onClick={() => setProfileOpen(true)}
      sx={{
        display: 'flex',
        alignItems: 'center',
        cursor: 'pointer',
      }}
    >
      <Avatar
        src={groupInfo.iconURL || ""}
        sx={{
          bgcolor: effectiveChatTheme === "dark" ? "#aaa" : "#333",
          color: headerTextColor,
          fontSize: 24,
          width: 40,
          height: 40,
          border: '2px solid rgb(7, 7, 7)',
          marginRight: 2,
        }}
      >
        {(groupInfo.iconURL || groupInfo.emoji || groupInfo.name?.[0]?.toUpperCase() || 'G')}
      </Avatar>

      <Box>
        <Typography
          variant="subtitle1"
          sx={{
            fontWeight: 'bold',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            fontSize: "14px",
            color: headerTextColor,
          }}
        >
          {groupInfo.name || groupName}

          {/* ✅ Conditionally show group chip */}
          {groupInfo.name === "BM - Beta members" && (
            <Box
              component="span"
              sx={{
                ml: 1,
                px: 0.5,
                py: 0.1,
                fontSize: 11,
                backgroundColor: '#00f72133',
                color: '#009e15ff',
                borderRadius: 1.5,
              }}
            >
              🔒 Beta
            </Box>
          )}
          {groupInfo.name === "BM - Dev Beta" && (
            <Box
              component="span"
              sx={{
                ml: 1,
                px: 0.5,
                py: 0.1,
                fontSize: 11,
                backgroundColor: '#66ccff33',
                color: '#66ccff',
                borderRadius: 1.5,
              }}
            >
              🧪 Dev Beta
            </Box>
          )}
        </Typography>
        <Typography
          variant="caption"
          sx={{
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            color: headerTextColor,
            mt: 0.1,
          }}
        >
          {memberUsers.length === 0 ? (
            'None'
          ) : (
            <>
              {memberUsers.slice(0, 2).map((user) => user.name).join(', ')}
              {memberUsers.length > 2 && `...`}
            </>
          )}
        </Typography>
      </Box>
    </Box>
  </Box>
</AppBar>


    <Box
      sx={{
         overflowY: 'auto',
      }}
    >
      <Box
      ref={containerRef}
        sx={{
         flex: 1,
         px: 1.3,
         pt: '80px',
         pb: '80px',
         display: 'flex',
         flexDirection: 'column',
         mt: 2
        }}
      >



        <Box
          onClick={() => setProfileOpen(true)}
          sx={{
            display: 'flex', 
            flexDirection: 'column',
            margin: '20px',
            backgroundColor: '#009b5800',
            borderRadius: '20px',
            alignItems: 'center',
            textAlign: 'center',
            padding: '25px',
            border: '1.2px solid #82828251',
            backdropFilter: 'blur(40px)',
            maxWidth: '100%'
          }}
        >
        <Avatar
            src={groupInfo.iconURL ? groupInfo.iconURL : ""}
            sx={{
              bgcolor: effectiveChatTheme === "dark" ? '#f1f1f1' : "#0c0c0c",
              color: effectiveChatTheme === "dark" ? "#000" : "#fff",
              fontSize: 38,
              width: 68,
              height: 68,
              border: '2px solid rgb(7, 7, 7)',
              marginBottom: 2,
            }}
          >
            {(groupInfo.iconURL || groupInfo.emoji || groupInfo.name?.[0]?.toUpperCase() || 'G')}
          </Avatar>
  <Typography
    variant="subtitle1"
    sx={{
      fontWeight: 'bold',
      fontSize: '21px',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      color: headerTextColor,
      mb: 0.5,
    }}
  >
    {groupInfo.name || groupName}
          {groupInfo.name === "BM - Beta members" && (
            <Box
              component="span"
              sx={{
                ml: 1,
                px: 0.5,
                py: 0.1,
                fontSize: 11,
                backgroundColor: '#00f72133',
                color: '#008912ff',
                borderRadius: 1.5,
              }}
            >
              🔒
            </Box>
          )}
          {groupInfo.name === "BM - Dev Beta" && (
            <Box
              component="span"
              sx={{
                ml: 1,
                px: 0.5,
                py: 0.1,
                fontSize: 11,
                backgroundColor: '#66ccff33',
                color: '#66ccff',
                borderRadius: 1.5,
              }}
            >
              🧪
            </Box>
          )}
  </Typography>

  <Typography
    variant="caption"
    multiline
    sx={{
      whiteSpace: 'pre-wrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      color: headerTextColor,
      textAlign: "center",
      mb: 0.5,
      width: "80vw"
    }}
  >
    {groupInfo.description || ""}
  </Typography>

  {createdByUser && (
    <Typography variant="caption" sx={{ color: headerTextColor, mb: 0.5 }}>
      <strong sx={{color: headerTextColor}}>Created by:</strong> {createdByUser.name}
    </Typography>
  )}

  <Typography variant="caption" sx={{ color: headerTextColor }}>
  <br></br><strong sx={{color: headerTextColor}}>{groupInfo.members?.length || 0} Members</strong>
  </Typography>

<Typography
  variant="caption"
  sx={{
    color: headerTextColor,
    whiteSpace: 'pre-wrap',
    mt: 1,
  }}
>
  <strong style={{ color: headerTextColor }}>Members Joined:</strong>
  {'\n'}
  {memberUsers.length === 0 ? (
    'None'
  ) : (
    <>
      {memberUsers.slice(0, 3).map((user) => user.name).join(', ')}
      {memberUsers.length > 3 && ` +${memberUsers.length - 3} more`}
    </>
  )}
</Typography>

</Box>


{loading ? (
  <Typography
    variant="body1"
    sx={{
      textAlign: "center",
      color: effectiveChatTheme === "dark" ? "#aaa" : "#333",
      py: 3,
      fontStyle: "italic",
    }}
  >
    Loading messages...
  </Typography>
) : (
  <Box sx={{ mb: "0px" }}>
  {Object.keys(groupedMessages).map((date) => (
    <>
    <Box key={date} sx={{ display: "flex", justifyContent: "center", my: 1 }}>
      {/* Date Divider */}
      <Typography
        variant="caption"
        sx={{
          display: "inline-block",
          px: 2,
          py: 0.5,
          mb: 2,
          mx: "auto",
          borderRadius: "20px",
          fontWeight: 600,
          fontSize: "0.75rem",
          backdropFilter: "blur(10px)",
          bgcolor:
            effectiveChatTheme === "dark"
              ? "rgba(0, 0, 0, 0.21)"
              : "rgba(255, 255, 255, 0.28)",
          color: effectiveChatTheme === "dark" ? "#f1f1f1ff" : "#1f1f1fff",
          textAlign: "center",
        }}
      >
        {date}
      </Typography>
    </Box>

      {/* Messages */}
      {(groupedMessages?.[date] || []).map((msg, index) => {
        const { borderRadius, isGroupedWithNext, isGroupedWithPrev } =
          getMessageShape(messages, index, currentUser.uid);

        if (msg.type === "system") {
          return (
            <Box key={msg.id} sx={{ display: "flex", justifyContent: "center", my: 1 }}>
              <Paper
                elevation={0}
                sx={{
                  px: 1,
                  py: 0.5,
                  borderRadius: 2,
                  bgcolor:
                    effectiveChatTheme === "dark"
                      ? "rgba(0, 0, 0, 0.41)"
                      : "rgba(255, 255, 255, 0.35)",
                  backdropFilter: "blur(10px)",
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    fontStyle: "italic",
                    textAlign: "center",
                    fontSize: "0.8rem",
                    color: effectiveChatTheme === "dark" ? "#ccc" : "#373737ff",
                  }}
                >
                  {msg.content}
                </Typography>
              </Paper>
            </Box>
          );
        }

        return (
          <motion.div
            key={msg.id}
            onContextMenu={(e) => {
              e.preventDefault();
              setSelectedMsg(msg);
              setAnchorEl(e.currentTarget);
            }}
            onTouchStart={(e) => handleTouchStart(e, msg)}
            onTouchEnd={handleTouchEnd}
               animate="visible"
               initial="hidden"
               exit="exit"
               onDragEnd={(event, info) => {
                   setReplyTo(msg);
                 controls.start({ x: 0 });
               }}
               transition={{ type: 'spring', stiffness: 300, damping: 25 }}
               style={{ touchAction: 'pan-y',
               ...(highlightedMsgId === msg.id && {
                   boxShadow: "none",
                   paddingX: 1,
                   borderRadius: 12,
                   background: theme.palette.primary.mainbg,
                   transition: "background 1.5s ease-in-out",
                 })
               }}
          >

        <Box
            sx={{
              display: "flex",
              flexDirection:
                msg.senderId === currentUser.uid ? "row-reverse" : "row",
              alignItems: "flex-end",
              gap: 1,
              px: 0,
              maxWidth: "100%",
              mx: 0,
            }}
          >
            {msg.senderId !== currentUser.uid && (
            <Avatar
              src={msg.photoURL || "https://via.placeholder.com/40"}
              alt={msg.senderName}
              sx={{ width: 32, height: 32 }}
            />
            )}

            {/* Message bubble */}
            <motion.div
              key={msg.id}
              ref={(el) => {
                messageRefs.current[msg.id] = el;
              }}
              drag="x"
              dragConstraints={{ left: 0, right: 100 }}
              dragElastic={0.3}
              onDragEnd={(_, info) => {
                if (info.offset.x > 80) handleReply(msg);
                controls.start({
                  x: 0,
                  transition: { type: "spring", stiffness: 300, damping: 30 },
                });
              }}
              animate={controls}
              whileDrag={{ scale: 1.02 }}
              style={{
                flex: 1,
                display: "flex",
                flexDirection:
                  msg.senderId === currentUser.uid ? "row-reverse" : "row",
                alignItems: "flex-end",
              }}
            >
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: msg.senderId === currentUser.uid ? "flex-end" : "flex-start",
                ml: msg.senderId === currentUser.uid ? "auto" : 0,
              }}
            >
              {/* Reply Preview */}
              {msg.replyTo && msg.replyTo.text && msg.replyTo.senderName && (
                <Box
                  elevation={1}
                  sx={{
                    pl: 1.2,
                    pr: 1,
                    py: 0.6,
                    mb: 0.6,
                    mt: 1,
                    bgcolor: effectiveChatTheme === "dark" ? "#0000005a" : "#ffffff88",
                    borderRadius: "10px",
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    cursor: "pointer",
                    maxWidth: "95%",
                    minWidth: "70%",
                    overflow: "hidden",
                    backdropFilter: "blur(40px)",
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
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography
                    variant="caption"
                    sx={{
                      fontWeight: 700,
                      color: theme.palette.primary.main,
                      letterSpacing: 0.2,
                      display: "block",
                      mb: 0.2,
                    }}
                  >
                    {msg.replyTo.senderName === currentUser.displayName ? "You" : msg.replyTo.senderName}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      maxWidth: "55vw",
                      color: effectiveChatTheme === "dark" ? "#d1d1d1" : "#5e5e5eff",
                      fontStyle: "italic",
                      fontSize: "0.9rem",
                      lineHeight: 1.2,
                    }}
                  >
                    {msg.replyTo.text}
                  </Typography>
                </Box>
                </Box>
              )} 

{isSingleEmoji(msg.text) ? (
  <Box
    sx={{
      px: 0,
      py: 0,
      background: "none",
      boxShadow: "none",
      borderRadius: 0,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: msg.senderId === currentUser.uid ? "flex-end" : "flex-start",
      minHeight: 56,
    }}
  >
    <Typography
      variant="h1"
      sx={{
        fontSize: "3rem",
        lineHeight: 1.1,
        mx: 0,
        my: 0.5,
        background: "none",
      }}
    >
      {msg.text.trim()}
    </Typography>

                <Typography
                  variant="caption"
                  sx={{
                    pl: 1,
                    mt: 0.5,
                    display: "block",
                    textAlign: "right",
                    display: "flex",
                    alignItems: "center",
                    gap: 0.5,
                    justifyContent: "flex-end",
                    fontSize: "0.7rem",
                    backgroundColor:
                      msg.senderId === currentUser.uid
                      ? effectiveChatTheme === "dark"
                        ? "#005c4b"
                        : "#d9fdd3"
                      : effectiveChatTheme === "dark"
                      ? "#2f2f2f"
                      : "#ffffff",
                    color: mode === "dark" ? "#e2e2e2ff" : "#5e5e5eff",
                    borderRadius: 10,
                    px: 1,
                    py: 0.3,
                    backdropFilter: "blur(40px)",
                  }}
                >
                  {msg.timestamp?.seconds
                    ? new Date(
                        msg.timestamp.seconds * 1000
                      ).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "Just now"}{" "}
                  <Typography
                    variant="caption"
                    sx={{ fontSize: "0.6rem" }}
                  >
                    {msg.edited ? "edited" : ""}
                  </Typography>
                   {msg.status === "sent" ? <CheckIcon sx={{ fontSize: "1rem", color: "#919191ff" }} /> : msg.status === "delivered" ? <DoneAllIcon sx={{ fontSize: "1rem", color: "#838383ff" }} /> : msg.status === "read" ? <DoneAllIcon sx={{ fontSize: "1 rem", color: "#00b7ffff" }} /> : "⏳"}
                  
                </Typography>
  </Box>
) : (

              <Paper
                elevation={1}
                sx={{
                  px: 2,
                  py: 0.5,
                  maxWidth: "65vw",
                  borderRadius: msg.senderId === currentUser.uid ? "20px 20px 10px 20px" : "20px 20px 20px 10px",
                  bgcolor:
                    msg.senderId === currentUser.uid
                      ? effectiveChatTheme === "dark"
                        ? "#005c4b"
                        : "#d9fdd3"
                      : effectiveChatTheme === "dark"
                      ? "#2f2f2f"
                      : "#ffffff",
                  color: effectiveChatTheme === "dark" ? "#fff" : "#000",
                  position: "relative",
                  boxShadow: "0px 2px 6px rgba(0,0,0,0.15)",
                }}
              >

<Box>
                {/* Sender Name */}
                {msg.senderId !== currentUser.uid && !isGroupedWithPrev &&
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: 600,
                    mb: 0.5,
                    color:
                      effectiveChatTheme === "dark" ? "#a7a7a7" : "#666666",
                  }}
                >
                  {msg.senderName}
                </Typography>
                }
              <Box
                sx={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: 0.3 }}
              >
                {/* Message Content */}
                {msg.type === "poll" && Array.isArray(msg.options) && msg.options.length > 0 ? (
                  <Box> <Typography variant="subtitle1" sx={{ color: "#00f721", fontWeight: 600 }}> 📊 {msg.question || "Untitled Poll"} </Typography> <List> {msg.options.map((opt, i) => { const votes = Array.isArray(opt.votes) ? opt.votes : []; const hasVoted = votes.includes(currentUser.uid); const userHasVoted = msg.options.some(o => Array.isArray(o.votes) && o.votes.includes(currentUser.uid) ); return ( <ListItemButton key={i} disabled={userHasVoted} onClick={() => handleVote(msg.id, i)} sx={{ bgcolor: hasVoted ? "#00f72144" : "transparent", mb: 0.5, borderRadius: 2, }} > <ListItemText primary={opt.text || `Option ${i + 1}`} sx={{ color: hasVoted ? "#00f721" : "#fff", fontWeight: hasVoted ? 600 : 500, }} /> <Typography variant="body2" sx={{ color: "#b5ffca", minWidth: 35 }}> {votes.length} vote{votes.length !== 1 ? "s" : ""} </Typography> </ListItemButton> ); })} </List> <Typography variant="caption" sx={{ color: "#aaa", mt: 1, fontStyle: 'italic' }}> Total votes: {msg.options.reduce((sum, opt) => sum + (opt.votes?.length || 0), 0)} </Typography> </Box>
                ) : msg.type === "timeline" && groupInfo?.tripId ? (
                  <Box sx={{ maxWidth: 250, minWidth: 220 }}> <Typography variant="subtitle1" sx={{ color: effectiveChatTheme === "dark" ? "#fff" : "#000", fontWeight: 700, mb: 1 }} > 📅 Group Timeline </Typography> <List dense> {sortedTimeline.length === 0 && ( <Typography sx={{ color: effectiveChatTheme === "dark" ? "#888888" : "#111111", mb: 1 }}> No timeline events yet. </Typography> )} {sortedTimeline.map((event, idx) => { const dateObj = event.timestamp?.seconds ? new Date(event.timestamp.seconds * 1000) : event.datetime ? new Date(event.datetime) : null; const isUpcoming = event.id === upcomingEventId; let timeStr = ""; if (dateObj && !isNaN(dateObj.getTime())) { timeStr = dateObj.toLocaleString("en-US", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", weekday: "short", }); } else if (event.time) { timeStr = event.time; } else { timeStr = "—"; } return ( <ListItem key={event.id || idx} disableGutters> <Box sx={{ bgcolor: isUpcoming ? "#f794002a" : event.completed ? "transparent" : "#8787873f", border: isUpcoming ? "2px solid #f79400aa" : undefined, px: 1.2, py: 0.5, borderRadius: 1, display: "flex", alignItems: "center", minHeight: 34, m: 0, width: "90%", boxShadow: isUpcoming ? "0 2px 12px #00f72100" : undefined, transition: "background 0.2s, border 0.2s", }} > <Typography variant="body2" sx={{ fontFamily: "monospace", color: event.completed ? effectiveChatTheme === "dark" ? "#c5c5c5ff" : "#313131ff" : isUpcoming ? effectiveChatTheme === "dark" ? "#ffffffff" : "#000000" : effectiveChatTheme === "dark" ? "#b6b6b6ff" : "#333333", fontWeight: 700, minWidth: 30, }} > {event.completed ? "✅" : isUpcoming ? "⏩" : "⏳"} </Typography> <Box ml={0}> <Typography variant="body2" sx={{ color: event.completed ? effectiveChatTheme === "dark" ? "#c5c5c5ff" : "#333333" : effectiveChatTheme === "dark" ? "#fff" : "#000", fontWeight: 700, lineHeight: 1.1, }} > {event.title || event.text || isUpcoming || "Untitled"} </Typography> <Typography variant="caption" sx={{ color: event.completed ? effectiveChatTheme === "dark" ? "#c5c5c5ff" : "#333333" : effectiveChatTheme === "dark" ? "#fff" : "#000", fontWeight: isUpcoming ? 700 : 400 }}> {timeStr} </Typography> </Box> </Box> </ListItem> ); })} </List> </Box>
                ) : msg.type === "checklist" && groupInfo?.tripId ? (
                  <Box sx={{ maxWidth: 250, minWidth: 220 }}> <Typography variant="subtitle1" sx={{ color: effectiveChatTheme === "dark" ? "#fff" : "#000", fontWeight: 700 }}> 📝 Trip Checklist </Typography> <List dense> {checklist.map((item) => { const isChecked = item.checkedBy?.includes(currentUser.uid); return ( <ListItem key={item.id} disableGutters sx={{ borderRadius: 2 }}> <ListItemButton onClick={() => handleToggleChecklistItem(item.id, !isChecked)} sx={{ borderRadius: 2 }} > <Checkbox edge="start" checked={isChecked} tabIndex={-1} sx={{ color: effectiveChatTheme === "dark" ? "#fff" : "#000", '&.Mui-checked': { color: "#56cb66ff" }, }} /> <ListItemText primary={item.text || "Untitled"} sx={{ color: isChecked ? "#56cb66ff" : effectiveChatTheme === "dark" ? "#fff" : "#000", textDecoration: isChecked ? "line-through" : "none", }} /> </ListItemButton> </ListItem> ); })} </List> <Typography variant="caption" sx={{ color: "#818181ff", mt: 1, fontStyle: 'italic' }}> Only you see your own progress </Typography> </Box>
                ) : (
                  <Typography
                    variant="body2"
                    sx={{
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-word",
                      fontSize: "0.95rem",
                    }}
                  >
                    {renderMessageWithMentions(msg.text)}
                  </Typography>
                )}
                              {/* Timestamp & Status */}
                <Typography
                  variant="caption"
                  sx={{
                    pl: 1,
                    mt: 1,
                    display: "block",
                    textAlign: "right",
                    display: "flex",
                    alignItems: "center",
                    gap: 0.5,
                    justifyContent: "flex-end",
                    fontSize: "0.7rem",
                    color: mode === "dark" ? "#b1b1b1ff" : "#5e5e5eff",
                  }}
                >
                  {msg.timestamp?.seconds
                    ? new Date(
                        msg.timestamp.seconds * 1000
                      ).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "Just now"}{" "}
                  <Typography
                    variant="caption"
                    sx={{ fontSize: "0.6rem" }}
                  >
                    {msg.edited ? "edited" : ""}
                  </Typography>
                   {msg.status === "sent" ? <CheckIcon sx={{ fontSize: "1rem", color: "#838383ff" }} /> : msg.status === "delivered" ? <DoneAllIcon sx={{ fontSize: "1rem", color: "#838383ff" }} /> : msg.status === "read" ? <DoneAllIcon sx={{ fontSize: "1 rem", color: "#00b7ffff" }} /> : "⏳"}
                  
                </Typography>
              </Box>
</Box>

              </Paper>
)}
                                {/* Reactions */}
                {msg.reactions && (
                  <Box
                    sx={{
                      position: "relative",
                      bottom: 5,
                      left: msg.senderId === currentUser.uid ? 2 : 0,
                      right: msg.senderId === currentUser.uid ? 0 : 2,
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      mt: 0,
                      flexWrap: "wrap",
                    }}
                  >
                    {Object.entries(msg.reactions).map(([uid, emoji]) => {
                      const user = allUsers[uid] || {};
                      return (
                        <Box
                          key={uid}
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            bgcolor: effectiveChatTheme === "dark" ? "#2b2b2b" : "#efefefff",
                            borderRadius: "20px",
                            px: 0.5,
                            py: 0.2,
                            gap: 0.5,
                          }}
                          onClick={(e) => {
                            setReactionMsg(msg);
                            setReactionAnchorEl(e.currentTarget);
                          }}
                        >
                          <Avatar
                            src={user.photoURL || "https://via.placeholder.com/32"}
                            sx={{
                              width: 15,
                              height: 15
                            }}
                          />
                          <Typography 
                            variant="body2"
                            sx={{
                              fontSize: 14
                            }}
                          >
                            {emoji}
                          </Typography>
                        </Box>
                      );
                    })}
                  </Box>
                )}

<Box m={0.6}></Box>
            </Box>
            </motion.div>
        </Box>
          </motion.div>
        );
      })}
</>
))}

<AnimatePresence>
  {typingMembers.length > 0 && (
    <motion.div
      key="typing-indicator"
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
<Box sx={{ display: "flex" }}>
  {typingMembers.map((uid) => {
    const user = memberUsers[uid] || {};
    return (
      <Avatar
        key={uid}
        src={user.photoURL || "https://via.placeholder.com/40"}
        alt={user.displayName || "User"}
        sx={{
          width: 26,
          height: 26,
          ml: "-6px", // overlap like group chat
          border: "2px solid",
          borderColor: effectiveChatTheme === "dark" ? "#1a1a1a" : "#fff",
        }}
      />
    );
  })}
</Box>


      {/* Bubble */}
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
          {typingMembers.join(", ")}{" "}
          {typingMembers.length > 1 ? "are typing..." : "is typing..."}
        </Typography>
      </Paper>
    </motion.div>
  )}
</AnimatePresence>

<div ref={bottomRef} />
</Box>
)}

<Menu
  anchorEl={anchorEl}
  open={Boolean(anchorEl)}
  onClose={() => setAnchorEl(null)}
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
  {/* 🔥 Row of Reactions */}
  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, px: 1, py: 1, backgroundColor: effectiveChatTheme === "dark" ? '#1c1c1c70' : '#ffffff76', backdropFilter: "blur(20px)", borderRadius: 8, boxShadow: "none" }}>
    {["❤️", "😂", "👍", "😁", "👌"].map((emoji) => (
      <IconButton
        key={emoji}
        onClick={() => {
          handleReaction(emoji, selectedMsg);
          setAnchorEl(null);
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
        setAnchorEl(null);
      }}
          sx={{
            width: 38,
            height: 38,
            bgcolor: effectiveChatTheme === "dark" ? '#29292933' : '#ffffffff',
            borderRadius: 8,
            color: effectiveChatTheme === "dark" ? "#fff" : "#222",
            boxShadow: "none",
            backdropFilter: effectiveChatTheme === "dark" ? 'blur(10px)' : 'blur(2px)',
            transition: 'all 0.18s cubic-bezier(0.4,0,0.2,1)',
            '&:hover': {
              bgcolor: effectiveChatTheme === "dark" ? '#333' : '#e0e0e0',
              borderColor: effectiveChatTheme === "dark" ? '#444' : '#bdbdbd'
            },
          }}
    >
      <AddIcon />
    </IconButton>
  </Box>

    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column', 
        backgroundColor: effectiveChatTheme === "dark" ? '#1c1c1c70' : '#ffffff76',
        backdropFilter: "blur(20px)",
        borderRadius: 7,
        boxShadow: "none",
        px: 0.2,
        py: 0.5,
        mt: 1
      }}
    >
  {/* 📄 Message Actions */}
  <MenuItem
    onClick={() => {
      handleReply(selectedMsg);
      setAnchorEl(null);
    }}
        sx={{
          fontWeight: 500,
          fontSize: 15,
          borderRadius: "25px 25px 8px 8px",
          mx: 0.5,
          my: 0.2,
          backdropFilter: effectiveChatTheme === "dark" ? 'blur(1px)' : 'blur(2px)',
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
          setAnchorEl(null);
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
          setAnchorEl(null);
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

  {selectedMsg?.text?.length > 10 && (
    <MenuItem
      onClick={() => {
        window.open(
          `https://www.google.com/search?q=${encodeURIComponent(selectedMsg.text)}`,
          "_blank"
        );
        setAnchorEl(null);
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

  <MenuItem
    onClick={() => {
      navigator.clipboard.writeText(selectedMsg?.text || "");
      setNotification("Message copied!");
      setAnchorEl(null);
    }}
    sx={{
          fontSize: 15,
          borderRadius: "8px 8px 25px 25px",
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

  </Box>
</Menu>

<SwipeableDrawer
  anchor="bottom"
  anchorEl={reactionAnchorEl}
  open={Boolean(reactionAnchorEl) && !showEmojiPicker}
  onClose={() => {
    setReactionAnchorEl(null);
    setReactionMsg(null);
  }}
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
{reactionMsg && (() => {
  // Group reactions by user id
  const userGroupedReactions = {};
  for (const [emoji, users] of Object.entries(getGroupedReactions(reactionMsg, allUsers))) {
    users.forEach(u => {
      if (!userGroupedReactions[u.uid]) {
        userGroupedReactions[u.uid] = {
          user: u,
          emojis: [],
        };
      }
      userGroupedReactions[u.uid].emojis.push(emoji);
    });
  }

  // Convert to array
  const groupedArray = Object.values(userGroupedReactions);

  // Sort so current user is first
  groupedArray.sort((a, b) => {
    if (a.user.uid === currentUser.uid) return -1;
    if (b.user.uid === currentUser.uid) return 1;
    return 0;
  });

  return groupedArray.map(({ user, emojis }) => (
    <ListItem
      key={user.uid}
      sx={{
        display: "flex",
        alignItems: "center",
        borderRadius: 3,
        mx: 0.5,
        my: 0.7,
        px: 2,
        py: 1.2,
        bgcolor: effectiveChatTheme === "dark" ? "#0000003d" : "#31313121",
        color: effectiveChatTheme === "dark" ? "#fff" : "#222",
        fontWeight: 500,
        fontSize: 17,
        boxShadow: "none",
        backdropFilter: effectiveChatTheme === "dark" ? "blur(8px)" : "blur(2px)",
        border: "none",
        transition: "background 0.2s",
        "&:hover": {
          bgcolor: effectiveChatTheme === "dark" ? "#232323" : "#e0e0e0",
          borderColor: effectiveChatTheme === "dark" ? "#444" : "#bdbdbd",
        },
        flexDirection: "column",
        gap: 0.5,
      }}
      onClick={() => {
        if (user.uid === currentUser.uid) {
          // Remove all reactions of this user from this message
          emojis.forEach(emoji => handleReaction(emoji, reactionMsg));
          setReactionAnchorEl(null);
          setReactionMsg(null);
        }
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%",
          gap: 1,
        }}
      >
        <Tooltip title={user.name}>
          <Avatar
            src={user.photoURL || ""}
            sx={{
              width: 36,
              height: 36,
              border: "none",
              bgcolor: effectiveChatTheme === "dark" ? "#222" : "#fafafa",
              color: effectiveChatTheme === "dark" ? "#fff" : "#222",
              fontWeight: 700,
              fontSize: 18,
            }}
          />
        </Tooltip>
        <Box sx={{ flexGrow: 1, ml: 1 }}>
          <Typography
            variant="body1"
            sx={{
              fontWeight: 700,
              color: effectiveChatTheme === "dark" ? "#fff" : "#222",
              fontSize: 15,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {user.uid === currentUser.uid ? "You" : user.name}
          </Typography>
          {user.uid === currentUser?.uid && (
            <Typography
              variant="caption"
              sx={{
                color: effectiveChatTheme === "dark" ? "#b4b4b4ff" : "#333333ff",
                fontWeight: 500,
                opacity: 0.8,
                fontSize: 10,
                letterSpacing: 0.1,
                userSelect: "none",
              }}
            >
              Tap to remove all your reactions
            </Typography>
          )}
        </Box>
        <Box sx={{ display: "flex", gap: 0.5 }}>
          {emojis.map((emoji) => (
            <Typography key={emoji} variant="body1" fontSize={22}>
              {emoji}
            </Typography>
          ))}
        </Box>
      </Box>
    </ListItem>
  ));
})()}

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
    vertical: "top",
    horizontal: "center",
  }}
  transformOrigin={{
    vertical: "bottom",
    horizontal: "center",
  }}
  PaperProps={{
    sx: {
      bgcolor: "#222",
      borderRadius: 3,
      boxShadow: "0 4px 24px #000a",
      p: 0,
    },
  }}
>
<EmojiPicker
  onEmojiClick={(emojiData) => {
    handleReaction(emojiData.emoji, reactionMsg);
    setShowEmojiPicker(false);
  }}
  theme={effectiveChatTheme === "dark" ? "dark" : "light"}
/>
</Popover>

        </Box>          
          
    {showGoToBottom && (
        <Fab
          color="primary"
          aria-label="scroll to bottom"
          onClick={scrollToBottom}
          sx={{
      position: 'absolute',
      bottom: 200, // adjust for footer height
      right: 24,
      zIndex: 1500,
      backgroundColor: '#00f721',
      color: '#000',
      '&:hover': { backgroundColor: '#00c218' },
          }}
          size="small"
        >
          <ArrowDownwardIcon />
        </Fab>
      )}

  <div ref={bottomRef} />
      </Box>
  

<Box
  sx={{
    position: "absolute",
    bottom: "0",
    left: "50%",
    transform: "translateX(-50%)",
    width: "95%",
    borderRadius: "30px 30px 0 0",
    background: effectiveChatTheme === "dark" ? "#00000013" : "#ffffff39",
    display: "flex",
    flexDirection: "column", // stack reply preview + input area
    backdropFilter: "blur(30px)",
    WebkitBackdropFilter: "blur(30px)",
    justifyContent: "space-between",
    px: 1.2,
    py: 1.2,
    boxShadow: "none",
    zIndex: 1200,
    transition: "all ease-in-out 0.3s"
  }}
>

  {(() => {
    const canSend =
      groupInfo?.sendAccess === "all" ||
      groupInfo?.createdBy === currentUser?.uid ||
      (groupInfo?.admins || []).includes(currentUser?.uid);

    if (!canSend) {
      return (
        <Typography
          variant="body2"
          sx={{
            color: headerTextColor,
            fontStyle: 'italic',
            p: 1,
            textAlign: 'center',
            width: '100%',
          }}
        >
          🔒 Only Admins can send messages in this group.
        </Typography>
      );
    }

    return (
  

<>
<Collapse in={mentionDrawerOpen} timeout={300} unmountOnExit>
  <Paper
    sx={{
      borderTopRightRadius: 24,
      borderTopLeftRadius: 24,
      backgroundColor: effectiveChatTheme === "dark" ? "#1c1c1c20" : "#ffffff2c",
      color: effectiveChatTheme === "dark" ? "#fff" : "#000",
      p: 2,
      mt: 2,
      boxShadow: "none",
      maxHeight: "50vh",
      overflowY: "auto",
    }}
  >
    <Typography variant="h6" sx={{ mb: 2, textAlign: "center" }}>
      Mention a member
    </Typography>

    <List>
      {memberUsers.length === 0 && (
        <Typography
          sx={{
            textAlign: "center",
            mt: 4,
            color: effectiveChatTheme === "dark" ? "#aaa" : "#555",
          }}
        >
          No members found
        </Typography>
      )}

      {memberUsers.map((member) => (
        <ListItemButton
          key={member.uid || member.id}
          onClick={() => handleMentionSelect(member.username || member.name)}
          sx={{
            py: 1,
            borderRadius: 2,
            mb: 1,
            "&:hover": {
              backgroundColor:
                effectiveChatTheme === "dark" ? "#1a1a1a" : "#f2f2f2",
            },
          }}
        >
          <Avatar
            src={member.photoURL || ""}
            sx={{ width: 36, height: 36, mr: 2 }}
          />
          <ListItemText
            primary={member.name || member.username || "Unknown"}
            secondary={member.username || ""}
            primaryTypographyProps={{ noWrap: true }}
            secondaryTypographyProps={{
              noWrap: true,
              variant: "caption",
              sx: {
                color:
                  effectiveChatTheme === "dark" ? "#ccc" : "#666",
              },
            }}
          />
        </ListItemButton>
      ))}
    </List>
  </Paper>
</Collapse>

<Collapse in={Boolean(replyTo)} timeout={300}>
  {replyTo && (
    <Paper
      sx={{
        mb: 1.2,
        p: 1.2,
        px: 1.6,
        borderRadius: "14px",
        background:
          effectiveChatTheme === "dark"
            ? "linear-gradient(145deg, #1c1c1c20, #10101030)"
            : "linear-gradient(145deg, #ffffff2c, #f7f7f73c)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        backdropFilter: "blur(12px)",
        boxShadow: "none",
      }}
      >
      <Box sx={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <Box>
          <Typography variant="caption" color="primary">
            {replyTo.senderName === currentUser.uid ? 'You' : replyTo.senderName}
          </Typography>
          <Typography variant="body2" sx={{ color: '#ccc' }}>
            {replyTo.text.length > 60
              ? replyTo.text.slice(0, 60) + '...'
              : replyTo.text}
          </Typography>
        </Box>
      </Box>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <IconButton
          size="small"
          onClick={() => setReplyTo(null)}
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

<Collapse in={Boolean(moreAnchorEl)} timeout={300} unmountOnExit>
  <Paper
    sx={{
      bgcolor: effectiveChatTheme === "dark" ? "#1c1c1c20" : "#ffffff2c",
      color: effectiveChatTheme === "dark" ? "#fff" : "#222",
      borderRadius: 3,
      maxWidth: 370,
      minWidth: 260,
      backdropFilter: "blur(24px)",
      boxShadow: "none",
      p: 1,
      mx: "auto",
      my: 2,
      border: "none",
      transition: "box-shadow 0.3s, background 0.3s",
    }}
  >
    {/* Send Timeline */}
    <Box
      onClick={async () => {
        const items = await fetchTripTimeline();
        await sendStructuredMessage("Timeline", items);
        setMoreAnchorEl(null);
      }}
      sx={{
        fontWeight: 600,
        fontSize: 16,
        borderRadius: 2,
        mb: 1,
        px: 2,
        py: 1.5,
        cursor: "pointer",
        color: effectiveChatTheme === "dark" ? "#fff" : "#222",
        "&:hover": {
          bgcolor: effectiveChatTheme === "dark" ? "#232323" : "#e0e0e0",
        },
        transition: "background 0.2s",
      }}
    >
      📅 Send Timeline
    </Box>

    {/* Send Checklist */}
    <Box
      onClick={async () => {
        const items = await fetchTripChecklist();
        await sendStructuredMessage("Checklist", items);
        setMoreAnchorEl(null);
      }}
      sx={{
        fontWeight: 600,
        fontSize: 16,
        borderRadius: 2,
        mb: 1,
        px: 2,
        py: 1.5,
        cursor: "pointer",
        color: effectiveChatTheme === "dark" ? "#fff" : "#222",
        "&:hover": {
          bgcolor: effectiveChatTheme === "dark" ? "#232323" : "#e0e0e0",
        },
        transition: "background 0.2s",
      }}
    >
      ✅ Send Checklist
    </Box>

    {/* Poll (optional) */}
    {/* 
    <Box
      onClick={() => { setShowPollDialog(true); setMoreAnchorEl(null); }}
      sx={{
        fontWeight: 600,
        fontSize: 16,
        borderRadius: 2,
        mb: 1,
        px: 2,
        py: 1.5,
        cursor: "pointer",
        color: effectiveChatTheme === "dark" ? "#fff" : "#222",
        "&:hover": {
          bgcolor: effectiveChatTheme === "dark" ? "#232323" : "#e0e0e0",
        },
        transition: "background 0.2s",
      }}
    >
      📊 Create Poll
    </Box>
    */}
  </Paper>
</Collapse>

<Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1, mr: 1 }}>
<Box
  sx={{
    display: "flex",
    alignItems: "center",
    px: 0.6,
    py: 0.2,
    mr: 1,
    borderRadius: "30px",
    bgcolor: effectiveChatTheme === "dark" ? "#14141439" : "#ffffff39",
    backdropFilter: "blur(10px)",
    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
    width: "100%",
  }}
>
<Button
  sx={{
    display: editingMsg ? "none" : "flex",
      minWidth: 0,
      borderRadius: "50%",
      height: 38,
      width: 42,
      bgcolor: "#ffffff37",
      backdropFilter: "blur(6px)",
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
  onClick={() => {
    if (moreAnchorEl) {
      // if already open, close it
      setMoreAnchorEl(null);
    } else {
      // if closed, open it
      setMoreAnchorEl(true);
    }
  }}
>
  {moreAnchorEl ? (
    <AddIcon
      sx={{
        color: effectiveChatTheme === "dark" ? "#fff" : "#000",
        fontSize: 24,
        transform: "rotate(45deg)",
        transition: "transform 0.3s ease",
      }}
    />
  ) : (
    <AddIcon
      sx={{
        color: effectiveChatTheme === "dark" ? "#fff" : "#000",
        fontSize: 24,
        transform: "rotate(0deg)",
        transition: "transform 0.3s ease",
      }}
    />
  )}
</Button>

  <TextField
    value={editingMsg ? editText : newMsg}
    onChange={(e) => {
      if (editingMsg) {
        setEditText(e.target.value);
      } else {
        setNewMsg(e.target.value);
      }
      handleInputChange(e);
    }}
    placeholder={editingMsg ? "Edit message..." : "Type a message..."}
    size="small"
    fullWidth
          sx={{
            zIndex: '1500',
            mr: 1,
            borderRadius: '40px',
            input: {
              color: effectiveChatTheme === "dark" ? "#fff" : "#000",
              height: '28px',
              borderRadius: '40px',
            },
            '& .MuiOutlinedInput-root': {
              '& fieldset': {
                borderColor: '#5E5E5E00',
                borderRadius: '40px'
              },
              '&:hover fieldset': {
                borderColor: '#39393900',
                borderRadius: '40px'
              },
              '&.Mui-focused fieldset': {
                borderColor: '#75757500',
                borderRadius: '40px'
              },
            },
            '& .MuiInputBase-input::placeholder': {
              color: effectiveChatTheme === "dark" ? "#cccccc" : "#343434ff"
            }
          }}
  />
</Box>

  {editingMsg ? (
    <>
      <Button
        sx={{ backgroundColor: effectiveChatTheme === "dark" ? '#430400ff' : '#ffd2cfff', height: '45px', width: '45px', borderRadius: 40, mr: 1 }}
        onClick={() => {
          setEditingMsg(null);
          setEditText("");
        }}
      >
        <CloseIcon sx={{ color: effectiveChatTheme === "dark" ? '#ffd2cfff' : '#430400ff' }} />
      </Button> 
      <Button
        sx={{ backgroundColor: effectiveChatTheme === "dark" ? '#ffffffff' : "#000000", height: '45px', width: '45px', borderRadius: 40 }}
        onClick={async () => {
          try {
            const msgRef = doc(
              db,
              "groupChat",
              groupName,
              "messages",
              editingMsg.id
            );
            await updateDoc(msgRef, {
              text: editText,
              edited: true,
              timestamp: serverTimestamp(), // optional
            });
            setEditingMsg(null);
            setEditText("");
          } catch (err) {
            console.error("❌ Failed to update message:", err.message);
          }
        }}
      >
        <CheckIcon sx={{ color: effectiveChatTheme === "dark" ? '#000' : "#fff" }} />
      </Button>

    </>
  ) : (
    <>
    <Button
      sx={{ backgroundColor: effectiveChatTheme === "dark" ? '#ffffffff' : "#000000", height: '48px', width: '48px', borderRadius: 40 }}
      onClick={sendMessage}
    >
      <SendIcon sx={{ color: effectiveChatTheme === "dark" ? '#000' : "#fff" }} />
    </Button>
  </>
  )}

</Box>

</>
    );
  })()}
</Box>

<Dialog
  open={showPollDialog}
  onClose={() => setShowPollDialog(false)}
  fullWidth
  maxWidth="sm"
  PaperProps={{
    sx: {
      bgcolor: "#121212",
      borderRadius: 4,
      p: 2
    }
  }}
>
  <DialogTitle sx={{ color: effectiveChatTheme === "dark" ? "#fff" : "#000", fontWeight: "bold" }}>
    📊 Create Poll
  </DialogTitle>

  <DialogContent>
    <TextField
      label="Poll Question"
      fullWidth
      value={pollQuestion}
      onChange={(e) => setPollQuestion(e.target.value)}
      variant="outlined"
      sx={{ mb: 3 }}
      InputLabelProps={{ style: { color: '#aaa' } }}
      InputProps={{ style: { color: effectiveChatTheme === "dark" ? "#fff" : "#000" } }}
    />

    {pollOptions.map((option, index) => (
      <Box key={index} sx={{ display: "flex", alignItems: "center", mb: 2 }}>
        <TextField
          fullWidth
          placeholder={`Option ${index + 1}`}
          value={option}
          onChange={(e) => handleOptionChange(index, e.target.value)}
          InputLabelProps={{ style: { color: '#aaa' } }}
          InputProps={{ style: { color: effectiveChatTheme === "dark" ? "#fff" : "#000" } }}
        />
        <IconButton
          onClick={() => removeOption(index)}
          disabled={pollOptions.length <= 2}
          sx={{ ml: 1, color: "#ff5555" }}
        >
          <RemoveIcon />
        </IconButton>
      </Box>
    ))}

    <Button
      onClick={addOption}
      startIcon={<AddIcon />}
      sx={{ color: "#00f721" }}
    >
      Add Option
    </Button>
  </DialogContent>

  <DialogActions>
    <Button onClick={() => setShowPollDialog(false)} sx={{ color: "#ccc" }}>
      Cancel
    </Button>
    <Button onClick={handleSendPoll} variant="contained" sx={{ bgcolor: "#00f721", color: "#000" }}>
      Send Poll
    </Button>
  </DialogActions>
</Dialog>


      <GroupInfoDrawer
        profileOpen={profileOpen}
        setProfileOpen={setProfileOpen}
        // pass all required props here: groupInfo, user, handlers, effectiveChatTheme, etc
        groupInfo={groupInfo}
        groupName="My Group"
        mode="dark"
        createdByUser={createdByUser}
        tripInfo={tripInfo}
        timelineStats={timelineStats}
        memberInfo={memberInfo}
        canEditGroupInfo={true}
        canAddMembers={true}
        currentUser={currentUser}
        user={user}
        handleExitGroup={() => console.log("exit group")}
        handleRemoveMember={(uid) => console.log("remove member", uid)}
        handleUpdateGroupInfo={() => console.log("update")}
        handlePermissionChange={(perm, role) => console.log("perm change", perm, role)}
        toggleAdminStatus={(uid) => console.log("toggle admin", uid)}
        setGroupSettingsOpen={setGroupSettingsOpen}
        groupSettingsOpen={groupSettingsOpen}
        membersDrawerOpen={membersDrawerOpen}
        setMembersDrawerOpen={setMembersDrawerOpen}
        inviteDrawerOpen={inviteDrawerOpen}
        setInviteDrawerOpen={setInviteDrawerOpen}
        setNotification={() => {}}
        notification={null}
        handleShare={() => console.log("share link")}
        addUserDialogOpen={addUserDialogOpen}
        setAddUserDialogOpen={setAddUserDialogOpen}
        searchTerm={""}
        setSearchTerm={() => {}}
        searchLoading={false}
        searchResults={[]}
        selectedUsers={[]}
        setSelectedUsers={() => {}}
        handleBatchAddUsers={() => {}}
      />

      <Box>

</Box>
    </Box>
    </ThemeProvider>
  );
}

export default GroupChat;