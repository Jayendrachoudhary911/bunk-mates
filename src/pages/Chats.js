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
  arrayUnion
} from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import BetaAccessGuard from "../components/BetaAccessGuard";
import {
  Avatar,
  useTheme,
  IconButton,
  Dialog,
  createTheme,
  keyframes,
  Slide,
  Box,
  Tabs,
  Tab,
  InputAdornment,
  Typography,
  TextField,
  Button,
  ThemeProvider,
  CircularProgress,
  Drawer,
  Divider,
  SwipeableDrawer,
  Zoom,
  Fade,
  Card,
  ButtonGroup,
  Chip,
  Stack,
  Paper
} from '@mui/material';
import { format, isToday, isYesterday } from 'date-fns';

import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import GroupAddIcon from '@mui/icons-material/GroupAdd';
import AddIcon from '@mui/icons-material/Add';
import EmojiEmotionsIcon from '@mui/icons-material/EmojiEmotions';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from "@mui/icons-material/Search";
import ProfilePic from '../components/Profile';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ShareOutlinedIcon from '@mui/icons-material/ShareOutlined';
import ContentCopyOutlinedIcon from "@mui/icons-material/ContentCopyOutlined";
import QrCode2OutlinedIcon from '@mui/icons-material/QrCode2Outlined';
import MessageOutlinedIcon from '@mui/icons-material/MessageOutlined';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import Notifications from "../elements/Notifications";

import { weatherGradients, weatherColors, weatherbgColors, weatherIcons } from "../elements/weatherTheme";
import { useWeather } from "../contexts/WeatherContext";
import { Theme } from 'emoji-picker-react';
import { useSettings } from "../contexts/SettingsContext";
import { messaging } from "../firebase";
import { getToken, onMessage } from "firebase/messaging";
import DeviceGuard from '../components/DeviceGuard';
import Snackbar from "@mui/material/Snackbar";
import MuiAlert from "@mui/material/Alert";
import { useThemeToggle } from "../contexts/ThemeToggleContext";
import { getTheme } from "../theme";
import { QRCodeSVG } from "qrcode.react";

// Fade-in animation keyframes
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


const SESSION_KEY = "bunkmate_session";
const USER_STORAGE_KEY = "bunkmateuser";
const WEATHER_STORAGE_KEY = "bunkmate_weather";

function showLocalNotification(title, options) {
  if (Notification.permission === "granted") {
    new Notification(title, options);
  }
}


function Chats({ onlyList }) {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [unreadCounts, setUnreadCounts] = useState({});
  const [latestMessages, setLatestMessages] = useState({});
  const [latestTimestamps, setLatestTimestamps] = useState({});
  const [notification, setNotification] = useState(null);
  const [userGroups, setUserGroups] = useState([]);
  const [groupUnreadCounts, setGroupUnreadCounts] = useState({});
  const [latestGroupMessages, setLatestGroupMessages] = useState({});
  const [latestGroupTimestamps, setLatestGroupTimestamps] = useState({});
  const muiTheme = useTheme();
  const history = useNavigate();
  const [addUserDialog, setAddUserDialog] = useState(false);
  const [groupDialog, setGroupDialog] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]); 
  const [searchUsername, setSearchUsername] = useState('');
  const [foundUsers, setFoundUsers] = useState([]);
  const [groupName, setGroupName] = useState('');
  const [groupEmoji, setGroupEmoji] = useState('💬');
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, chat: null });
  const [friends, setFriends] = useState([]);
  const [nicknames, setNicknames] = useState({});
  const navigate = useNavigate();
  const { mode, setMode, accent, setAccent, toggleTheme } = useThemeToggle();
  const theme = getTheme(mode, accent);
  const [currentUser, setCurrentUser] = useState(null);
  const { weather, setWeather, weatherLoading, setWeatherLoading } = useWeather();
  const [dynamicTheme, setDynamicTheme] = useState(theme);
  const [tab, setTab] = useState(0);
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

  const [hasPendingRequest, setHasPendingRequest] = useState(false);
  const [isRequestReceived, setIsRequestReceived] = useState(false);
  const [requestId, setRequestId] = useState(null);
  const [isCurrentUserFriend, setIsCurrentUserFriend] = useState(false);
  const [loadingRequestState, setLoadingRequestState] = useState(true);


  const [profilePicOpen, setProfilePicOpen] = useState(false);
  const [selectedProfileData, setSelectedProfileData] = useState(null); // To hold the data of the clicked user
  const [viewMode, setViewMode] = useState('avatar');

  const handleCloseSnackbar = (_, reason) => {
    if (reason === "clickaway") return;
    setSnackbar({ ...snackbar, open: false });
  };

const handleAvatarClick = (e, chatData) => {
  e.stopPropagation(); // Prevents navigating to the chat screen
  setSelectedProfileData(chatData);
  setProfilePicOpen(true);
};


useEffect(() => {
  if (!currentUser || !selectedUserProfile) return;

  const notificationsRef = collection(db, "notifications");
  const unsubscribe = onSnapshot(notificationsRef, (snapshot) => {
    const requests = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    const sent = requests.find(
      (r) =>
        r.type === "friend_request" &&
        r.senderId === currentUser.uid &&
        r.uid === selectedUserProfile.uid &&
        (r.status === "pending" || r.status === "accepted")
    );
    const received = requests.find(
      (r) =>
        r.type === "friend_request" &&
        r.senderId === selectedUserProfile.uid &&
        r.uid === currentUser.uid &&
        r.status === "pending"
    );

    setHasPendingRequest(!!sent);
    setIsRequestReceived(!!received);
    setRequestId(received ? received.id : sent ? sent.id : null);
    setLoadingRequestState(false);
    if (sent?.status === "accepted" || received?.status === "accepted") {
      setIsCurrentUserFriend(true);
    }
  });

  return () => unsubscribe();
}, [selectedUserProfile, currentUser]);


// --- Copy these handlers from your previous implementation ---
const handleShare = async () => {
  if (!selectedProfileData) return;
  const shareData = {
    title: `Check out ${selectedProfileData.name}'s profile`,
    text: `Here's a link to their profile.`,
    url: `${window.location.origin}/profile/${selectedProfileData.id}`,
  };
  try {
    await navigator.share(shareData);
  } catch (error) { console.error('Error sharing:', error); }
};

const handleCopyLink = async () => {
    if (!selectedProfileData) return;
    const profileLink = `${window.location.origin}/profile/${selectedProfileData.id}`;
    try {
        await navigator.clipboard.writeText(profileLink);
        setSnackbar({ open: true, message: 'Profile link copied!' });
    } catch (error) {
        console.error('Error copying link:', error);
    }
};

const handleOpenProfileDrawer = () => {
  if (!selectedProfileData || selectedProfileData.type !== 'user') {
    return;
  }
  navigate(`/chat/${selectedProfileData.id}?profile`);
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

useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, (user) => {
    setCurrentUser(user);
  });
  return () => unsubscribe();
}, []);

  const weatherBg =
  weather && weatherGradients[weather.main]
  ? weatherGradients[weather.main]
  : weatherGradients.Default;
  
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

  // Fetch friends list from Firestore (assuming you store friends as an array of user IDs in each user doc)
useEffect(() => {
  if (!currentUser) return;
  const fetchFriends = async () => {
    const userDoc = await getDoc(doc(db, "users", currentUser.uid));
    if (userDoc.exists()) {
      setFriends(userDoc.data().friends || []);
    }
  };
  fetchFriends();
}, [currentUser]);

useEffect(() => {
  if (!currentUser) return;

  const fetchFriends = async () => {
    try {
      const userRef = doc(db, "users", currentUser.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) return;

      const friendsUIDs = userSnap.data().friends || [];

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
      console.error("Failed to fetch friends:", err);
    }
  };

  fetchFriends();
}, [currentUser]);

const filteredFriends = friendsList.filter((friend) => {
  const query = searchFriend.toLowerCase();
  return (
    friend.name?.toLowerCase().includes(query) ||
    friend.username?.toLowerCase().includes(query)
  );
});

const toggleFriendSelection = (friend) => {
  const alreadySelected = selectedFriends.find((f) => f.uid === friend.uid);
  if (alreadySelected) {
    setSelectedFriends((prev) => prev.filter((f) => f.uid !== friend.uid));
  } else {
    setSelectedFriends((prev) => [...prev, friend]);
  }
};


useEffect(() => {
    if (!currentUser) return;
    const fetchNicknames = async () => {
      const userDoc = await getDoc(doc(db, "users", currentUser.uid));
      if (userDoc.exists()) {
        setNicknames(userDoc.data().nicknames || {});
      }
    };
    fetchNicknames();
  }, [currentUser]);


  useEffect(() => {
    const fetchUsers = async () => {
      if (searchTerm.trim() === '') return setSearchResults([]);
      const usersSnapshot = await getDocs(collection(db, "users"));
      const matches = [];
      usersSnapshot.forEach(doc => {
        const data = doc.data();
        if (
          data.username?.toLowerCase().includes(searchTerm.toLowerCase()) &&
          data.uid !== currentUser.uid &&
          !selectedUsers.some(u => u.uid === data.uid)
        ) {
          matches.push({ ...data, uid: doc.id });
        }
      });
      setSearchResults(matches);
    };
    fetchUsers();
  }, [searchTerm, selectedUsers]);

  const handleAddToChatList = async (userToAdd) => {
    if (!userToAdd || !userToAdd.uid) return;
  
    const chatId = [currentUser.uid, userToAdd.uid].sort().join('_');
  
    const userChatRef = doc(db, "userChats", currentUser.uid);
    const userChatSnap = await getDoc(userChatRef);
  
    if (!userChatSnap.exists() || !userChatSnap.data()[chatId]) {
      const currentUserChatData = {
        [chatId]: {
          userInfo: {
            uid: userToAdd.uid,
            displayName: userToAdd.displayName || "Unnamed User",
            photoURL: userToAdd.photoURL || "",
          },
          date: serverTimestamp(),
          lastMessage: {
            text: "Say Hi!",
          },
        },
      };
  
      const otherUserChatData = {
        [chatId]: {
          userInfo: {
            uid: currentUser.uid,
            displayName: currentUser.displayName || "Unnamed User",
            photoURL: currentUser.photoURL || "",
          },
          date: serverTimestamp(),
          lastMessage: {
            text: "Say Hi!",
          },
        },
      };
  
      await setDoc(doc(db, "userChats", currentUser.uid), currentUserChatData, { merge: true });
      await setDoc(doc(db, "userChats", userToAdd.uid), otherUserChatData, { merge: true });
  
      // Optional: Create starter message
      await addDoc(collection(db, "chats", chatId, "messages"), {
        text: "Say Hi!",
        senderId: currentUser.uid,
        timestamp: serverTimestamp(),
      });
    }
  
    setAddUserDialog(false);
    setSearchTerm('');
  };
  

  const handleAddUser = (user) => {
    setSelectedUsers([...selectedUsers, user]);
    setSearchTerm('');
  };
  
  const handleRemoveUser = (uid) => {
    setSelectedUsers(prev => prev.filter(u => u.uid !== uid));
  };

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


useEffect(() => {
  if (!currentUser) return;

  const unsubs = onSnapshot(doc(db, "userChats", currentUser.uid), (docSnap) => {
    if (docSnap.exists()) {
      const chatsData = docSnap.data();
      const sortedChats = Object.entries(chatsData).sort(
        (a, b) => b[1].date?.seconds - a[1].date?.seconds
      );
      setUsers(
        sortedChats.map(([chatId, data]) => ({
          ...data.userInfo,
          chatId,
          lastMessage: data.lastMessage?.text || '',
        }))
      );
    }
  });

  return () => unsubs();
}, [currentUser]);

  
  useEffect(() => {
    const fetchUsers = async () => {
      if (!currentUser) return;
      const snapshot = await getDocs(collection(db, 'users'));
      const usersList = [];
      snapshot.forEach((doc) => {
        if (doc.id !== currentUser.uid) {
          usersList.push({ id: doc.id, ...doc.data() });
        }
      });
      setUsers(usersList);
    };
    fetchUsers();
  }, [currentUser]);

useEffect(() => {
  if (!currentUser || users.length === 0) return;

  const unsubscribes = users.map((user) => {
    const chatId = [currentUser.uid, user.id].sort().join('_');
    const q = query(
      collection(db, 'chats', chatId, 'messages'),
      orderBy('timestamp', 'desc'),
      limit(1)
    );

    return onSnapshot(q, (snapshot) => {
      snapshot.forEach((doc) => {
        const data = doc.data();
        const msg = data.system
          ? `${data.text}`
          : data.text || 'No messages yet';
        const ts = data.timestamp?.toDate?.() || new Date(0);
        const unread =
          data.senderId !== currentUser.uid && !data.isRead ? 1 : 0;

        setLatestMessages((prev) => ({ ...prev, [user.id]: msg }));
        setUnreadCounts((prev) => ({ ...prev, [user.id]: unread }));
        setLatestTimestamps((prev) => ({ ...prev, [user.id]: ts }));

        if (unread) {
          setNotification({
            user: user.name || user.username || 'Unknown',
            message: msg,
          });
          setTimeout(() => setNotification(null), 3000);
        }
      });
    });
  });

  return () => unsubscribes.forEach((unsub) => unsub && unsub());
}, [users, currentUser]);


  useEffect(() => {
    const fetchUserGroups = async () => {
      if (!currentUser) return;
      const q = query(collection(db, 'groupChats'), where('members', 'array-contains', currentUser.uid));
      const snapshot = await getDocs(q);
      const groups = [];
      snapshot.forEach((doc) => {
        groups.push({ id: doc.id, ...doc.data() });
      });
      setUserGroups(groups);
    };
    fetchUserGroups();
  }, [currentUser]);

useEffect(() => {
  if (!currentUser || userGroups.length === 0) return;
  
  const unsubscribes = userGroups.map(group => {
    const q = query(
      collection(db, 'groupChat', group.id, 'messages'),
      orderBy('timestamp', 'desc'),
      limit(1)
    );
    
    return onSnapshot(q, (snapshot) => {
      snapshot.forEach(doc => {
        const data = doc.data();
        const isSystem = data.type === 'system';
        const msg = isSystem ? data.content : data.text || 'No messages yet';
        const senderName = isSystem ? 'System' : data.senderName || 'Unknown';
        const ts = data.timestamp?.toDate?.() || new Date(0);
        
        // Check if message is unread for current user
        const unread = data.senderId !== currentUser.uid && 
                      (!data.read || !data.readBy?.includes(currentUser.uid));
        
        setLatestGroupMessages(prev => ({
          ...prev,
          [group.id]: msg
        }));
        setGroupUnreadCounts(prev => ({
          ...prev,
          [group.id]: unread ? 1 : 0
        }));
        setLatestGroupTimestamps(prev => ({
          ...prev,
          [group.id]: ts
        }));
      });
    });
  });
  
  return () => unsubscribes.forEach(unsub => unsub());
}, [userGroups, currentUser]);


  const goBack = () => {
    history(-1);
  };


  const handleSelect = async (userId) => {
    if (!currentUser) return;
    const chatId = [currentUser.uid, userId].sort().join('_');
    const q = query(collection(db, 'chats', chatId, 'messages'), orderBy('timestamp', 'desc'), limit(20));
    const snapshot = await getDocs(q);

    snapshot.forEach(async (docSnap) => {
      const data = docSnap.data();
      if (data.senderId !== currentUser.uid && !data.isRead) {
        await updateDoc(doc(db, 'chats', chatId, 'messages', docSnap.id), { isRead: true });
      }
    });

    setUnreadCounts((prev) => ({ ...prev, [userId]: 0 }));
    navigate(`/chat/${userId}`);
  };

const handleGroupClick = async (groupId) => {
  if (!currentUser) return;
  
  // Mark messages as read first
  await markGroupAsRead(groupId);
  
  // Update local unread count immediately
  setGroupUnreadCounts(prev => ({
    ...prev,
    [groupId]: 0
  }));
  
  // Navigate to group chat
  navigate(`/group/${groupId}`);
};

async function markGroupAsRead(groupId) {
  const user = auth.currentUser;
  if (!user?.uid) return;
  
  const userId = user.uid;
  try {
    const msgsRef = collection(db, 'groupChat', groupId, 'messages');
    
    // Query unread messages not sent by this user
    const unreadQ = query(
      msgsRef,
      where('senderId', '!=', userId),
      where('read', '==', false),
      orderBy('timestamp', 'desc'),
      limit(50) // Increased limit for better coverage
    );
    
    const snap = await getDocs(unreadQ);
    
    // Batch update all unread messages
    const updates = snap.docs.map(msgDoc => 
      updateDoc(doc(db, 'groupChat', groupId, 'messages', msgDoc.id), {
        read: true,
        status: 'delivered',
        readBy: arrayUnion(userId),
        readAt: serverTimestamp()
      })
    );
    
    if (updates.length > 0) {
      await Promise.all(updates);
    }
  } catch (e) {
    console.error('Error marking group as read:', e);
  }
}


  const formatTimestamp = (date) => {
    if (!(date instanceof Date) || isNaN(date)) return '';
    if (isToday(date)) return format(date, 'h:mm a');
    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'dd/MM/yy');
  };

  const handleContextMenu = (event, chat) => {
    event.preventDefault();
    setContextMenu({
      visible: true,
      x: event.clientX,
      y: event.clientY,
      chat,
    });
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
const [loadingRequests, setLoadingRequests] = useState(true);

useEffect(() => {
  if (!currentUser) return;
  const notificationsRef = collection(db, "notifications");

  const unsubscribe = onSnapshot(notificationsRef, (snapshot) => {
    const reqs = snapshot.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .filter(
        (r) =>
          r.type === "friend_request" &&
          (r.uid === currentUser.uid || r.senderId === currentUser.uid)
      );
    setFriendRequests(reqs);
    setLoadingRequests(false);
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

// Only show chats with friends
const friendUsers = users.filter(u => friends.includes(u.id));

  if (currentUser === null) {
  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#fff' }}>
        <CircularProgress color={theme.palette.primary.main} />
      </Box>
    </ThemeProvider>
  );
}

const combinedChats = [
  ...friendUsers.map((user) => ({
    type: 'user',
    id: user.id,
    name: nicknames[user.id] || user.name || user.username,
    photoURL: user.photoURL,
    lastMessage: latestMessages[user.id],
    timestamp: latestTimestamps[user.id] || new Date(0),
    unreadCount: unreadCounts[user.id] || 0,
  })),
  ...userGroups.map((group) => ({
    type: 'group',
    id: group.id,
    name: group.name,
    emoji: group.emoji,
    iconURL: group.iconURL || "",
    lastMessage: latestGroupMessages[group.id]?.text,
    timestamp: latestGroupTimestamps[group.id] || new Date(0),
    unreadCount: groupUnreadCounts[group.id] || 0,
  })),
]
  .filter((chat) => chat.name?.toLowerCase().includes(searchTerm.toLowerCase()))
  .sort((a, b) => b.timestamp - a.timestamp);


    if (onlyList) {
    // Only render the combined chats/groups list (no dialogs, no search, no floating button, etc)
return (
  <div>
    {combinedChats.map((chat) => (
      <div
        key={chat.id}
        onClick={() => {
          if (chat.type === "group") {
            handleGroupClick(chat.id)
          } else {
            handleSelect(chat.id);
          }
        }}
        onContextMenu={(e) => handleContextMenu(e, chat)}
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
            src={chat.iconURL ? chat.iconURL : ""}
            sx={{
              bgcolor: "#f0f0f0",
              color: "#000",
              fontSize: 28,
              width: 48,
              height: 48,
              marginRight: 2,
            }}
          >
            {chat.iconURL || chat.emoji || chat.name?.[0]?.toUpperCase() || "G"}
          </Avatar>
        ) : (
          <Avatar
            src={chat.photoURL || "https://via.placeholder.com/50"}
            alt={chat.name}
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "50%",
              marginRight: "20px",
            }}
          />
        )}

        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, fontWeight: "bold", color: "#FFFFFF" }}>
            {chat.name}
            {["BM - Beta members", "BM - Dev Beta"].includes(chat.name) && (
              <span
                style={{
                  marginLeft: 6,
                  fontSize: 14,
                  backgroundColor: "#00f72133",
                  padding: "2px 6px",
                  borderRadius: 6,
                  color: "#00f721",
                }}
              >
                {chat.name.includes("Dev") ? "🧪 Dev Beta" : "🔒 Beta"}
              </span>
            )}
          </p>
          <p
            style={{
              margin: 0,
              color: "#BDBDBD",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              maxWidth: "100%",
            }}
          >
            {(chat.lastMessage?.length > 30
              ? chat.lastMessage.slice(0, 14) + "..."
              : chat.lastMessage) || "No messages yet"}
          </p>
        </div>

        {chat.unreadCount > 0 && (
          <span
            style={{
              backgroundColor: buttonWeatherBg,
              color: "#212121",
              padding: "4px 8px",
              borderRadius: "50%",
            }}
          >
            {chat.unreadCount}
          </span>
        )}
      </div>
    ))}
  </div>
);

  }


  return (
      <ThemeProvider theme={theme}>
        {/* <DeviceGuard> */}
                  <BetaAccessGuard>
          <div style={{ padding: '20px', backgroundColor: '#02020200', marginTop: 45 }}>
      <div style={{display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}>
        <Typography variant="h4" style={{ color: theme.palette.text.primary, fontWeight: "bolder", mr: 2 }}>Chats</Typography>
           <Notifications />
      </div>


    <Box
      sx={{
        position: "sticky",
        top: 0,
        zIndex: 999,
        background: `linear-gradient(to bottom, ${theme.palette.background.default}, ${theme.palette.background.default}e3, ${theme.palette.background.default}00)`,
        py: 2,
      }}
    >
      <TextField
        fullWidth
        type="text"
        placeholder="Search users or groups..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        style={{
          marginBottom: '20px',
          color: theme.palette.text.primary,
        }}
        LabelInputProps={{ style: { color: theme.palette.text.primary } }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon sx={{ color: theme.palette.text.primary }} />
            </InputAdornment>
          ),
          sx: { color: theme.palette.text.primary, backgroundColor: theme.palette.background.paper, borderRadius: '8px', height: '40px' },
        }}
      />
    </Box>

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
        
        {combinedChats.map((chat) => (
          <div
            key={chat.id}
            style={{
              padding: '12px',
              marginBottom: '10px',
              borderRadius: '18px',
              display: 'flex',
              alignItems: 'center',
              backgroundColor: '#00000000',
              cursor: 'pointer',
              transition: 'background-color 0.3s',
            }}
          >
            {chat.type === 'group' ? (
              <Avatar
                src={chat.iconURL ? chat.iconURL : ""}
                onClick={(e) => handleAvatarClick(e, chat)}
                sx={{
                  bgcolor: theme.palette.primary.bg,
                  color: theme.palette.primary.main,
                  fontSize: 28,
                  width: 48,
                  height: 48,
                  marginRight: 2,
                }}
              >
                  {(chat.iconURL || chat.emoji || chat.name?.[0]?.toUpperCase() || 'G')}
              </Avatar>
            ) : (
              <Avatar
                src={chat.photoURL || 'https://via.placeholder.com/50'}
                alt={chat.name}
                onClick={(e) => handleAvatarClick(e, chat)}
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  marginRight: '20px',
                }}
              />
            )}

            <div
              onClick={() => chat.type === 'user' ? handleSelect(chat.id) : handleGroupClick(chat.id)}
              onContextMenu={(e) => handleContextMenu(e, chat)}
              style={{ flex: 1 }}
            >
              <p style={{ margin: 0, fontWeight: 'bold', color: theme.palette.text.primary }}>
                {chat.name}
                  {["BM - Beta members", "BM - Dev Beta"].includes(chat.name) && (
                    <span style={{
                      marginLeft: 6,
                      fontSize: 14,
                      backgroundColor: '#00f72133',
                      padding: '2px 6px',
                      borderRadius: 6,
                      color: '#00cc1bff',
                    }}>
                      {chat.name.includes("Dev") ? "🧪 Dev Beta" : "🔒 Beta"}
                    </span>
                  )}
              </p>
              <p
                style={{
                  margin: 0,
                  marginTop: 6,
                  color: theme.palette.text.secondary,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  maxWidth: '100%',
                }}
              >
                {(chat.lastMessage?.length > 30
                  ? chat.lastMessage.slice(0, 21) + '...'
                  : chat.lastMessage) || 'No messages yet'}
              </p>
            </div>

            {chat.unreadCount > 0 ? (
              <span
                style={{
                  backgroundColor: theme.palette.primary.bg,
                  color: theme.palette.primary.main,
                  padding: '4px',
                  borderRadius: '50%',
                }}
              >
              </span>
            ):(
              <span style={{ fontSize: '12px', color: '#919191ff' }}>
                {formatTimestamp(chat.timestamp)}
              </span>
            )}
          </div>
        ))}

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
            src={selectedProfileData?.photoURL || selectedProfileData?.iconURL || selectedProfileData?.emoji || ""}
            alt={selectedProfileData?.name}
              sx={{
                width: "min(370px, 90vw)",
                height: "min(370px, 90vw)",
                borderRadius: 10,
                backgroundColor: theme.palette.primary.bg,
                cursor: "default",
                boxShadow: "none",
                transition: "transform 0.4s ease, box-shadow 0.4s ease",
                "&:hover": {
                  transform: "scale(1.05)",
                  boxShadow: "none",
                },
              }}
          />
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
        }, {
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

<Box>
          {/* Floating Add Button */}
<IconButton
  onClick={() => setAddUserDialog(true)}
  sx={{
    position: 'fixed',
    bottom: 90,
    right: 20,
    minWidth: '40px',
    width: '50px',
    height: '50px',
    backdropFilter: "blur(10px)",
    background: theme.palette.primary.main + "7d",
    borderRadius: '15px',
    fontSize: '38px',
    color: theme.palette.text.primary,
    boxShadow: "none",
  }}
>
  <AddIcon />
</IconButton>

</Box>
      </div>
<Drawer
  anchor="bottom"
  open={membDialogOpen}
  onClose={() => setMembDialogOpen(false)}
  PaperProps={{
    sx: {
      p: 3,
      backgroundColor: mode === "dark" ? "#00000000" : "#f1f1f156",
      backdropFilter: "blur(140px)",
      height: "95vh",
      backgroundImage: "none"
    },
  }}
>
      <>
    <Box display="flex" gap={1.5} alignItems="center" mb={2} mt={7.5}>
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
  const sentRequest = friendRequests.some(
    (r) =>
      r.senderId === currentUser.uid &&
      r.uid === user.uid &&
      r.status === "pending"
  );
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
      </>

<SwipeableDrawer
  anchor="bottom"
  open={profileDrawerOpen}
  onClose={() => setProfileDrawerOpen(false)}
  PaperProps={{
    sx: {
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      background: mode === "dark"
        ? "rgba(15,15,15,0.8)"
        : "rgba(255,255,255,0.85)",
      backdropFilter: "blur(40px)",
      overflowY: "auto",
      maxHeight: "92vh",
      p: 3,
      boxShadow: "0px -10px 25px rgba(0,0,0,0.3)",
    },
  }}
>
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
</SwipeableDrawer>

</Drawer>

<Drawer
  anchor="bottom"
  open={groupDialogOpen}
  onClose={() => setGroupDialogOpen(false)}
  PaperProps={{
    sx: {
      borderTopLeftRadius: 16,
      borderTopRightRadius: 16,
      p: 3,
      backgroundColor: "#121212",
      height: "75vh",
    },
  }}
>
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
          bgcolor: "#1E1E1E",
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
</Drawer>

<Drawer
  anchor="bottom"
  open={addUserDialog}
  onClose={() => setAddUserDialog(false)}
  transitionDuration={400}
  PaperProps={{
    sx: {
      bgcolor: mode === "dark" ? "#00000000" : "#f1f1f1b4",
      backdropFilter: "blur(140px)",
      borderTopLeftRadius: 0,
      borderTopRightRadius: 0,
      height: "100vh",
      backgroundImage: "none",
    },
  }}
>
  <Box sx={{ p: 3, height: "100%", display: "flex", flexDirection: "column", pt: 7.5 }}>
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
</Drawer>

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

<Divider sx={{ mt: 4 }} />
<Box
  sx={{
    mt: 2,
    mb: 10,
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
          </div>
        </BetaAccessGuard>
        {/* </DeviceGuard> */}
    </ThemeProvider>
  );
}

export default Chats;


const ProfileDrawerContent = ({
  user,
  currentUser,
  friends,
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

  // mini quick-view overlay state
  const [miniOpen, setMiniOpen] = useState(false);
  const [miniPerson, setMiniPerson] = useState(null);

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
            src={item.photoURL || item.iconURL || ""}
            sx={{ width: 40, height: 40, boxShadow: "0 0 8px rgba(0,0,0,0.2)" }}
          />
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
