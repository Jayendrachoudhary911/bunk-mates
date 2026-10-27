import React, { useEffect, useState, useRef } from "react";
import {
  Box,
  Typography,
  TextField,
  InputAdornment,
  Avatar,
  Chip,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Radio,
  RadioGroup,
  FormControlLabel,
} from "@mui/material";
import {
  Search as SearchIcon,
  CloseRounded as CloseIcon,
  PersonAdd as PersonAddIcon,
  GroupAdd as GroupAddIcon,
} from "../icons";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import StarRoundedIcon from "@mui/icons-material/StarRounded";
import PushPinRoundedIcon from "@mui/icons-material/PushPinRounded";
import NotificationsOffOutlinedIcon from "@mui/icons-material/NotificationsOffOutlined";
import NotificationsActiveOutlinedIcon from "@mui/icons-material/NotificationsActiveOutlined";
import MarkChatUnreadOutlinedIcon from "@mui/icons-material/MarkChatUnreadOutlined";
import MarkChatReadOutlinedIcon from "@mui/icons-material/MarkChatReadOutlined";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import BlockRoundedIcon from "@mui/icons-material/BlockRounded";
import ExitToAppOutlinedIcon from "@mui/icons-material/ExitToAppOutlined";
import { isValidImageUrl, safeImageUrl } from "../utils/uiHelpers";
import { formatMessageSnippet } from "../utils/chatHelpers";
import ChatListSkeleton from "./chats_components/ChatListSkeleton";
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
  arrayRemove,
  addDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import {
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

  // Real-time chat & group states synchronized directly from Firestore DB
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all"); // 'all' | 'direct' | 'groups' | 'unread'
  const [friends, setFriends] = useState([]);
  const [friendUsers, setFriendUsers] = useState([]);
  const [nicknames, setNicknames] = useState({});

  const [unreadCounts, setUnreadCounts] = useState({});
  const [latestMessages, setLatestMessages] = useState({});
  const [latestTimestamps, setLatestTimestamps] = useState({});

  const [userGroups, setUserGroups] = useState([]);
  const [groupUnreadCounts, setGroupUnreadCounts] = useState({});
  const [latestGroupMessages, setLatestGroupMessages] = useState({});
  const [latestGroupTimestamps, setLatestGroupTimestamps] = useState({});
  const [loading, setLoading] = useState(true);

  // New Friend / Group Dialog States
  const [addFriendOpen, setAddFriendOpen] = useState(false);
  const [friendSearchQuery, setFriendSearchQuery] = useState("");
  const [searchFriendResults, setSearchFriendResults] = useState([]);
  const [createGroupOpen, setCreateGroupOpen] = useState(false);
  const [groupNameInput, setGroupNameInput] = useState("");
  const [groupDescInput, setGroupDescInput] = useState("");
  const [selectedGroupFriends, setSelectedGroupFriends] = useState([]);

  // Context Menu & Mobile Long Press state
  const [blockedUids, setBlockedUids] = useState([]);
  const [chatMenuAnchor, setChatMenuAnchor] = useState(null);
  const [selectedMenuChat, setSelectedMenuChat] = useState(null);
  const [muteChatDialogOpen, setMuteChatDialogOpen] = useState(false);
  const [muteDuration, setMuteDuration] = useState("8h");
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [blockConfirmOpen, setBlockConfirmOpen] = useState(false);
  const [leaveGroupConfirmOpen, setLeaveGroupConfirmOpen] = useState(false);
  const [, setFeaturesVersion] = useState(0);

  const longPressTimerRef = useRef(null);
  const touchStartPosRef = useRef({ x: 0, y: 0 });
  const isLongPressTriggeredRef = useRef(false);

  useEffect(() => {
    const triggerUpdate = () => setFeaturesVersion((v) => v + 1);
    window.addEventListener("bm_favorite_chats_changed", triggerUpdate);
    window.addEventListener("bm_pinned_chats_changed", triggerUpdate);
    window.addEventListener("bm_unread_chats_changed", triggerUpdate);
    window.addEventListener("bm_chat_mute_changed", triggerUpdate);
    return () => {
      window.removeEventListener("bm_favorite_chats_changed", triggerUpdate);
      window.removeEventListener("bm_pinned_chats_changed", triggerUpdate);
      window.removeEventListener("bm_unread_chats_changed", triggerUpdate);
      window.removeEventListener("bm_chat_mute_changed", triggerUpdate);
    };
  }, []);

  // Fetch Current User's Friends and Nicknames
  useEffect(() => {
    if (!currentUser?.uid) return;
    const userRef = doc(db, "users", currentUser.uid);

    const unsubUser = onSnapshot(userRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setFriends(data.friends || []);
        setNicknames(data.nicknames || {});
        setBlockedUids(data.blockedUids || []);
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

  // 1. Real-time direct chat documents sync from Firestore 'chats' collection
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
      console.warn("Direct chats snapshot error in ChatList:", err);
    });
    return () => unsub();
  }, [currentUser?.uid]);

  // 2. Fallback direct chat fetch for friends whose chat summary doc does not exist yet
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

  // 3. Real-time group chats sync from Firestore 'groupChats' collection
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
      setLoading(false);
    }, (err) => {
      console.warn("groupChats snapshot error in ChatList:", err);
      setLoading(false);
    });

    return () => unsub();
  }, [currentUser?.uid, selectedChatId]);

  // 4. Real-time unseen notifications listener for exact unread counts
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
      console.warn("Unseen notifications error in ChatList:", err);
    });

    return () => unsub();
  }, [currentUser?.uid, selectedChatId]);

  // 5. Real-time recent notifications listener (incoming message snippet updates)
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
      console.warn("Recent notifications error in ChatList:", err);
    });

    return () => unsub();
  }, [currentUser?.uid]);

  // 6. Window event listener for optimistic local updates
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

  // 7. Keep active selected chat read, clear manual unread, and mark notifications seen
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
    } else {
      setUnreadCounts((prev) => ({ ...prev, [selectedChatId]: 0 }));

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
  }, [selectedChatId, currentUser?.uid, userGroups]);

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
    togglePinChat(selectedMenuChat.id);
    setChatMenuAnchor(null);
  };

  const handleMenuFavoriteToggle = () => {
    if (!selectedMenuChat) return;
    toggleFavoriteChat(selectedMenuChat.id);
    setChatMenuAnchor(null);
  };

  const handleMenuMuteToggle = () => {
    if (!selectedMenuChat) return;
    const muted = isChatMuted(selectedMenuChat.id);
    if (muted) {
      unmuteChat(selectedMenuChat.id);
      setChatMenuAnchor(null);
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
    } else {
      toggleMarkChatUnread(selectedMenuChat.id);
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
    } catch (err) {
      console.error("Failed to delete chat:", err);
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
      } else {
        await updateDoc(userRef, { blockedUids: arrayUnion(targetUid) });
        setBlockedUids((prev) => [...prev, targetUid]);
      }
    } catch (err) {
      console.error("Failed to block/unblock friend:", err);
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
    } catch (err) {
      console.error("Failed to leave group:", err);
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
      unreadCount: selectedChatId === user.id ? 0 : ((unreadCounts[user.id] || 0) + (isChatMarkedUnread(user.id) && !unreadCounts[user.id] ? 1 : 0)),
      rawData: user,
    })),
    ...userGroups.map((group) => ({
      type: "group",
      id: group.id,
      name: group.name || "Group Chat",
      iconURL: group.iconURL,
      lastMessage: latestGroupMessages[group.id] || "No messages yet",
      timestamp: latestGroupTimestamps[group.id] || new Date(0),
      unreadCount: selectedChatId === group.id ? 0 : ((groupUnreadCounts[group.id] || 0) + (isChatMarkedUnread(group.id) && !groupUnreadCounts[group.id] ? 1 : 0)),
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
    .sort((a, b) => {
      const aPinned = isChatPinned(a.id);
      const bPinned = isChatPinned(b.id);
      if (aPinned && !bPinned) return -1;
      if (!aPinned && bPinned) return 1;
      return b.timestamp - a.timestamp;
    });

  return (
    <Box
      sx={{
        width: { xs: "100%", md: 340, lg: 360 },
        flexShrink: 0,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        borderRight: `0px solid transparent`,
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
          <ChatListSkeleton count={7} isDark={isDark} />
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
                    setGroupUnreadCounts((prev) => ({ ...prev, [chat.id]: 0 }));
                    try {
                      localStorage.setItem(`bunkmate_group_read_${chat.id}`, Date.now().toString());
                    } catch {}
                    clearMarkChatUnread(chat.id);
                    markChatAsReadInDB(chat.id, true);

                    if (currentUser?.uid) {
                      const notifQ = query(
                        collection(db, "notifications"),
                        where("uid", "==", currentUser.uid),
                        where("groupName", "==", chat.id),
                        where("seen", "==", false)
                      );
                      getDocs(notifQ).then((snap) => {
                        snap.forEach((d) => {
                          updateDoc(doc(db, "notifications", d.id), { seen: true }).catch(() => {});
                        });
                      }).catch(() => {});

                      setDoc(
                        doc(db, "groupChats", chat.id),
                        {
                          readTimestamps: {
                            [currentUser.uid]: serverTimestamp(),
                          },
                        },
                        { merge: true }
                      ).catch(() => {});
                    }
                  } else {
                    setUnreadCounts((prev) => ({ ...prev, [chat.id]: 0 }));
                    clearMarkChatUnread(chat.id);
                    markChatAsReadInDB(chat.id, false);

                    if (currentUser?.uid) {
                      const notifQ = query(
                        collection(db, "notifications"),
                        where("uid", "==", currentUser.uid),
                        where("senderId", "==", chat.id),
                        where("seen", "==", false)
                      );
                      getDocs(notifQ).then((snap) => {
                        snap.forEach((d) => {
                          updateDoc(doc(db, "notifications", d.id), { seen: true }).catch(() => {});
                        });
                      }).catch(() => {});
                    }
                  }

                  if (onSelectChat) onSelectChat(chat);
                }}
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
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, minWidth: 0 }}>
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
                      {isChatPinned(chat.id) && (
                        <PushPinRoundedIcon sx={{ fontSize: 13, color: isDark ? "#38bdf8" : "#0284c7", transform: "rotate(45deg)", flexShrink: 0 }} />
                      )}
                      {isChatFavorite(chat.id) && (
                        <StarRoundedIcon sx={{ fontSize: 16, color: "#fbc02d", flexShrink: 0 }} />
                      )}
                      {isChatMuted(chat.id) && (
                        <NotificationsOffOutlinedIcon sx={{ fontSize: 13, color: "text.secondary", opacity: 0.7, flexShrink: 0 }} />
                      )}
                    </Box>

                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, flexShrink: 0 }}>
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
                          transition: "opacity 0.2s ease",
                          "&:hover": { color: "text.primary", opacity: 1 },
                          ".MuiBox-root:hover &": { opacity: 1 },
                          p: 0.5,
                        }}
                      >
                        <MoreVertIcon sx={{ fontSize: 17 }} />
                      </IconButton>
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
                          flexShrink: 0,
                        }}
                      >
                        {formatTimestamp(chat.timestamp)}
                      </Typography>
                    </Box>
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

      {/* ─── Chat Action Context Menu ─── */}
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
            borderRadius: "16px",
            minWidth: 220,
            py: 0.75,
            bgcolor: isDark ? "rgba(24, 24, 27, 0.96)" : "rgba(255, 255, 255, 0.96)",
            backdropFilter: "blur(20px)",
            border: `1px solid ${isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)"}`,
            boxShadow:
              isDark
                ? "0 12px 36px rgba(0,0,0,0.6), 0 0 1px rgba(255,255,255,0.2)"
                : "0 12px 36px rgba(0,0,0,0.12)",
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
                    py: 1,
                    px: 2,
                    borderRadius: "10px",
                    mx: 0.5,
                    "&:hover": {
                      bgcolor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)",
                    },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <PushPinRoundedIcon
                      sx={{
                        fontSize: 20,
                        transform: isPinned ? "rotate(0deg)" : "rotate(45deg)",
                        color: isPinned ? (isDark ? "#38bdf8" : "#0284c7") : "text.secondary",
                      }}
                    />
                  </ListItemIcon>
                  <ListItemText
                    primary={isPinned ? "Unpin Chat" : "Pin Chat"}
                    primaryTypographyProps={{
                      fontSize: "0.88rem",
                      fontWeight: 600,
                      color: isPinned ? (isDark ? "#38bdf8" : "#0284c7") : "text.primary",
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
                    py: 1,
                    px: 2,
                    borderRadius: "10px",
                    mx: 0.5,
                    "&:hover": {
                      bgcolor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)",
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
                      color: isFav ? "#fbc02d" : "text.primary",
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
                    py: 1,
                    px: 2,
                    borderRadius: "10px",
                    mx: 0.5,
                    "&:hover": {
                      bgcolor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)",
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
                      color: isMuted ? "#4caf50" : "text.primary",
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
                    py: 1,
                    px: 2,
                    borderRadius: "10px",
                    mx: 0.5,
                    "&:hover": {
                      bgcolor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)",
                    },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    {isUnread ? (
                      <MarkChatReadOutlinedIcon sx={{ fontSize: 20, color: "text.secondary" }} />
                    ) : (
                      <MarkChatUnreadOutlinedIcon sx={{ fontSize: 20, color: isDark ? "#38bdf8" : "#0284c7" }} />
                    )}
                  </ListItemIcon>
                  <ListItemText
                    primary={isUnread ? "Mark as Read" : "Mark as Unread"}
                    primaryTypographyProps={{
                      fontSize: "0.88rem",
                      fontWeight: 600,
                    }}
                  />
                </MenuItem>
              );
            })()}

            <Divider sx={{ my: 0.75, opacity: 0.5 }} />

            {/* 5. Delete Chat */}
            <MenuItem
              onClick={() => {
                setChatMenuAnchor(null);
                setDeleteConfirmOpen(true);
              }}
              sx={{
                py: 1,
                px: 2,
                borderRadius: "10px",
                mx: 0.5,
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
                  py: 1,
                  px: 2,
                  borderRadius: "10px",
                  mx: 0.5,
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
                      py: 1,
                      px: 2,
                      borderRadius: "10px",
                      mx: 0.5,
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

      {/* Mute Notifications Dialog */}
      <Dialog
        open={muteChatDialogOpen}
        onClose={() => setMuteChatDialogOpen(false)}
        PaperProps={{
          sx: {
            borderRadius: "20px",
            p: 1,
            minWidth: 320,
            bgcolor: isDark ? "#1e1e24" : "#ffffff",
            border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)"}`,
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 800, fontSize: "1.1rem" }}>
          Mute Notifications
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Other participants will not see that you muted this chat.
          </Typography>
          <RadioGroup
            value={muteDuration}
            onChange={(e) => setMuteDuration(e.target.value)}
          >
            <FormControlLabel
              value="8h"
              control={<Radio color="primary" />}
              label={<Typography sx={{ fontSize: "0.9rem", fontWeight: 600 }}>8 Hours</Typography>}
            />
            <FormControlLabel
              value="1w"
              control={<Radio color="primary" />}
              label={<Typography sx={{ fontSize: "0.9rem", fontWeight: 600 }}>1 Week</Typography>}
            />
            <FormControlLabel
              value="forever"
              control={<Radio color="primary" />}
              label={<Typography sx={{ fontSize: "0.9rem", fontWeight: 600 }}>Always</Typography>}
            />
          </RadioGroup>
        </DialogContent>
        <DialogActions sx={{ px: 2, pb: 1.5 }}>
          <Button
            onClick={() => setMuteChatDialogOpen(false)}
            sx={{ borderRadius: "10px", textTransform: "none", color: "text.secondary" }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleConfirmMute}
            sx={{ borderRadius: "10px", textTransform: "none", fontWeight: 700, px: 2.5 }}
          >
            Mute
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Chat Confirmation Dialog */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        PaperProps={{
          sx: {
            borderRadius: "20px",
            p: 1,
            minWidth: 320,
            bgcolor: isDark ? "#1e1e24" : "#ffffff",
            border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)"}`,
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 800, fontSize: "1.1rem" }}>
          Delete Chat?
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            Are you sure you want to delete this chat with{" "}
            <strong style={{ color: isDark ? "#fff" : "#111" }}>
              {selectedMenuChat?.name}
            </strong>
            ? All messages in this conversation will be permanently removed.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 2, pb: 1.5 }}>
          <Button
            onClick={() => setDeleteConfirmOpen(false)}
            sx={{ borderRadius: "10px", textTransform: "none", color: "text.secondary" }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleConfirmDeleteChat}
            sx={{ borderRadius: "10px", textTransform: "none", fontWeight: 700, px: 2.5 }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Block / Unblock Friend Confirmation Dialog */}
      <Dialog
        open={blockConfirmOpen}
        onClose={() => setBlockConfirmOpen(false)}
        PaperProps={{
          sx: {
            borderRadius: "20px",
            p: 1,
            minWidth: 320,
            bgcolor: isDark ? "#1e1e24" : "#ffffff",
            border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)"}`,
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 800, fontSize: "1.1rem" }}>
          {selectedMenuChat && blockedUids.includes(selectedMenuChat.id)
            ? `Unblock ${selectedMenuChat?.name}?`
            : `Block ${selectedMenuChat?.name}?`}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            {selectedMenuChat && blockedUids.includes(selectedMenuChat.id)
              ? `They will be able to call you and send you messages.`
              : `Blocked contacts will no longer be able to call you or send you messages.`}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 2, pb: 1.5 }}>
          <Button
            onClick={() => setBlockConfirmOpen(false)}
            sx={{ borderRadius: "10px", textTransform: "none", color: "text.secondary" }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color={selectedMenuChat && blockedUids.includes(selectedMenuChat.id) ? "primary" : "error"}
            onClick={handleConfirmBlockFriend}
            sx={{ borderRadius: "10px", textTransform: "none", fontWeight: 700, px: 2.5 }}
          >
            {selectedMenuChat && blockedUids.includes(selectedMenuChat.id) ? "Unblock" : "Block"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Leave Group Confirmation Dialog */}
      <Dialog
        open={leaveGroupConfirmOpen}
        onClose={() => setLeaveGroupConfirmOpen(false)}
        PaperProps={{
          sx: {
            borderRadius: "20px",
            p: 1,
            minWidth: 320,
            bgcolor: isDark ? "#1e1e24" : "#ffffff",
            border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)"}`,
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 800, fontSize: "1.1rem" }}>
          Leave {selectedMenuChat?.name}?
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            Are you sure you want to leave this group? You will no longer receive any messages from this group.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 2, pb: 1.5 }}>
          <Button
            onClick={() => setLeaveGroupConfirmOpen(false)}
            sx={{ borderRadius: "10px", textTransform: "none", color: "text.secondary" }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleConfirmLeaveGroup}
            sx={{ borderRadius: "10px", textTransform: "none", fontWeight: 700, px: 2.5 }}
          >
            Leave Group
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ChatList;
