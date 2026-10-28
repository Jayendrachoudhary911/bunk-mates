import { useState, useEffect, useRef, useCallback } from "react";
import {
  collection,
  doc,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  setDoc,
  deleteDoc,
  getDoc,
  getDocs,
  where,
  limit,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
} from "firebase/firestore";
import { db, auth } from "../../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useUser } from "../../contexts/UserContext";
import {
  getCachedData,
  setCachedData,
  getCachedUser,
  setCachedUser,
} from "../../utils/chatCache";
import { generatePlaceSuggestions, askQuickAI } from "../../utils/chatHelpers";
import {
  getChatDisappearingDuration,
  isMessageExpired,
  setActiveChat,
  clearActiveChat,
  clearMarkChatUnread,
} from "../../utils/chatFeaturesService";

/**
 * Custom hook providing optimized, real-time synced 1-on-1 chat state
 * with instant 0ms localStorage hydration and minimal network roundtrips.
 */
export function useChatSync(friendId) {
  let contextUser = null;
  try {
    const ctx = useUser();
    contextUser = ctx?.user || null;
  } catch (e) {
    // Graceful fallback if invoked outside UserProvider
  }

  const [currentUser, setCurrentUser] = useState(() => auth.currentUser || contextUser);
  const [authLoading, setAuthLoading] = useState(!auth.currentUser && !contextUser);

  useEffect(() => {
    if (contextUser && (!currentUser || currentUser.uid !== contextUser.uid)) {
      setCurrentUser(contextUser);
      setAuthLoading(false);
    }
  }, [contextUser, currentUser]);

  const activeUser = currentUser || contextUser || auth.currentUser;

  const chatId =
    activeUser && friendId
      ? [activeUser.uid, friendId].sort().join("_")
      : null;

  // Messages are fetched directly from Firestore in real-time
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(true);

  // 2. Hydrate friend details from cache
  const [friendDetails, setFriendDetails] = useState(() => {
    if (!friendId) return { name: "Loading...", photoURL: "", status: "offline" };
    const cached = getCachedUser(friendId);
    return cached || { name: "Loading...", photoURL: "", status: "offline" };
  });

  const [nickname, setNickname] = useState(() => {
    if (!activeUser || !friendId) return "";
    return getCachedData(`nickname_${activeUser.uid}_${friendId}`, "");
  });

  const [blockedUids, setBlockedUids] = useState([]);
  const [isFriendTyping, setIsFriendTyping] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [mutualFriends, setMutualFriends] = useState([]);
  const [commonGroups, setCommonGroups] = useState([]);
  const [commonTrips, setCommonTrips] = useState([]);
  const [timelineStatsMap, setTimelineStatsMap] = useState({});
  const [pinnedMessage, setPinnedMessage] = useState(null);
  const [pinnedMessages, setPinnedMessages] = useState([]);

  const typingTimeoutRef = useRef(null);
  const pendingMessagesRef = useRef(new Map());

  // Monitor auth state
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (usr) => {
      if (usr) {
        setCurrentUser(usr);
        setAuthLoading(false);
      } else if (contextUser) {
        setCurrentUser(contextUser);
        setAuthLoading(false);
      } else {
        setCurrentUser(null);
        setAuthLoading(false);
      }
    });
    return () => unsub();
  }, [contextUser]);

  // Set active chat, mark unread messages as read in DB and Firestore notifications
  useEffect(() => {
    if (!chatId || !friendId || !currentUser?.uid) return;

    setActiveChat({ type: "direct", id: chatId, friendId });
    clearMarkChatUnread(friendId);

    // Mark any unseen notifications from this friend as seen
    const notifQ = query(
      collection(db, "notifications"),
      where("uid", "==", currentUser.uid),
      where("senderId", "==", friendId),
      where("seen", "==", false)
    );
    getDocs(notifQ)
      .then((snap) => {
        snap.forEach((d) => {
          updateDoc(doc(db, "notifications", d.id), { seen: true }).catch(() => {});
        });
      })
      .catch(() => {});

    return () => {
      clearActiveChat();
    };
  }, [chatId, friendId, currentUser?.uid]);

  // Reset messages when chatId changes
  useEffect(() => {
    setMessages([]);
    setLoadingMessages(Boolean(chatId));
  }, [chatId]);

  // 3. Fetch friend details with caching
  useEffect(() => {
    if (!friendId) return;

    let isMounted = true;
    const fetchFriend = async () => {
      try {
        const cached = getCachedUser(friendId);
        if (cached && isMounted) {
          setFriendDetails(cached);
        }

        const snap = await getDoc(doc(db, "users", friendId));
        if (snap.exists() && isMounted) {
          const data = { id: snap.id, ...snap.data() };
          setFriendDetails(data);
          setCachedUser(friendId, data);
        }
      } catch (err) {
        console.error("Error fetching friend details:", err);
      }
    };

    fetchFriend();
    return () => {
      isMounted = false;
    };
  }, [friendId]);

  // 4. Fetch current user's blocked users and nicknames
  useEffect(() => {
    if (!currentUser?.uid) return;

    const userDocRef = doc(db, "users", currentUser.uid);
    const unsub = onSnapshot(userDocRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setBlockedUids(data.blockedUids || []);
        if (data.nicknames && friendId) {
          const nick = data.nicknames[friendId] || "";
          setNickname(nick);
          setCachedData(`nickname_${currentUser.uid}_${friendId}`, nick);
        }
      }
    });

    return () => unsub();
  }, [currentUser?.uid, friendId]);

  // Real-time listener for messages directly from Firestore DB
  useEffect(() => {
    pendingMessagesRef.current.clear();
    if (!chatId || !currentUser) {
      setLoadingMessages(false);
      return;
    }

    setLoadingMessages(true);

    const q = query(
      collection(db, "chats", chatId, "messages"),
      orderBy("timestamp", "asc")
    );

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        setLoadingMessages(false);
        const msgs = [];
        let hasUnreadFromFriend = false;

        querySnapshot.forEach((docSnap) => {
          const msg = docSnap.data();
          msg.id = docSnap.id;
          const hasPending = Boolean(docSnap.metadata?.hasPendingWrites);
          msg.hasPendingWrites = hasPending;
          msg.isSending = hasPending;
          msg.status = hasPending ? "sending" : "sent";

          if (msg.clientTempId) {
            pendingMessagesRef.current.delete(msg.clientTempId);
          }

          msgs.push(msg);

          if (msg.senderId !== currentUser.uid && !msg.isRead) {
            hasUnreadFromFriend = true;
          }
        });

        // Filter out expired disappearing messages
        const validMsgs = msgs.filter((m) => !isMessageExpired(m));

        // Reconcile remaining optimistic pending messages
        const existingIds = new Set(validMsgs.map((m) => m.clientTempId || m.id));
        const remainingPending = Array.from(pendingMessagesRef.current.values()).filter(
          (p) => !existingIds.has(p.id) && !existingIds.has(p.clientTempId)
        );

        setMessages([...validMsgs, ...remainingPending]);

        // Mark as read efficiently with read timestamp
        if (hasUnreadFromFriend) {
          clearMarkChatUnread(friendId);
          const nowIso = new Date().toISOString();
          const unreadMsgs = msgs.filter(
            (m) => m.senderId !== currentUser.uid && (!m.isRead || !m.read)
          );
          for (const um of unreadMsgs) {
            updateDoc(doc(db, "chats", chatId, "messages", um.id), {
              isRead: true,
              read: true,
              readAt: nowIso,
            }).catch(() => {});
          }

          // Mark any notifications from this friend as seen
          getDocs(
            query(
              collection(db, "notifications"),
              where("uid", "==", currentUser.uid),
              where("senderId", "==", friendId),
              where("seen", "==", false)
            )
          )
            .then((snap) => {
              snap.forEach((d) => {
                updateDoc(doc(db, "notifications", d.id), { seen: true }).catch(() => {});
              });
            })
            .catch(() => {});
        }
      },
      (err) => {
        console.error("Firestore message listener error:", err);
        setLoadingMessages(false);
      }
    );

    return () => unsubscribe();
  }, [chatId, currentUser, friendId]);

  // 6. Listen for friend's typing / draft status
  useEffect(() => {
    if (!chatId || !friendId) return;

    const chatDocRef = doc(db, "chats", chatId);
    const unsub = onSnapshot(chatDocRef, (snap) => {
      if (snap.exists()) {
        const chatData = snap.data();
        const friendDraft = chatData?.drafts?.[friendId] || "";
        setIsFriendTyping(Boolean(friendDraft.trim()));
        setPinnedMessage(chatData?.pinnedMessage || null);
        setPinnedMessages(
          Array.isArray(chatData?.pinnedMessages)
            ? chatData.pinnedMessages
            : chatData?.pinnedMessage
            ? [chatData.pinnedMessage]
            : []
        );
      } else {
        setIsFriendTyping(false);
        setPinnedMessage(null);
        setPinnedMessages([]);
      }
    });

    return () => unsub();
  }, [chatId, friendId]);

  // 7. Update draft / typing status (debounced to save writes)
  const setDraftStatus = useCallback(
    (text) => {
      if (!chatId || !currentUser?.uid) return;

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      typingTimeoutRef.current = setTimeout(async () => {
        try {
          const chatDocRef = doc(db, "chats", chatId);
          await updateDoc(chatDocRef, {
            [`drafts.${currentUser.uid}`]: text,
          });
        } catch {
          // If doc doesn't exist yet, it'll create on first message
        }
      }, 350);
    },
    [chatId, currentUser?.uid]
  );

  // 8. Mutual friends calculation (cached)
  const fetchMutualFriends = useCallback(async () => {
    if (!currentUser?.uid || !friendId) return;
    try {
      const currentSnap = await getDoc(doc(db, "users", currentUser.uid));
      const friendSnap = await getDoc(doc(db, "users", friendId));

      const myFriends = currentSnap.exists() ? currentSnap.data().friends || [] : [];
      const theirFriends = friendSnap.exists() ? friendSnap.data().friends || [] : [];

      const mutualUids = myFriends.filter((id) => theirFriends.includes(id));

      if (mutualUids.length > 0) {
        const details = await Promise.all(
          mutualUids.map(async (uid) => {
            const cached = getCachedUser(uid);
            if (cached) return { id: uid, ...cached };
            const uSnap = await getDoc(doc(db, "users", uid));
            if (uSnap.exists()) {
              const uData = { id: uid, ...uSnap.data() };
              setCachedUser(uid, uData);
              return uData;
            }
            return null;
          })
        );
        setMutualFriends(details.filter(Boolean));
      } else {
        setMutualFriends([]);
      }

      // Fetch common groups
      const groupsSnap = await getDocs(
        query(
          collection(db, "groupChats"),
          where("members", "array-contains", currentUser.uid)
        )
      );
      const sharedGroups = groupsSnap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((g) => (g.members || []).map(String).includes(String(friendId)));
      setCommonGroups(sharedGroups);

      // Fetch common trips (filter by currentUser to avoid scanning entire trips collection)
      const tripsSnap = await getDocs(
        query(
          collection(db, "trips"),
          where("members", "array-contains", currentUser.uid)
        )
      );
      const sharedTrips = tripsSnap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((t) => {
          const members = (t.members || []).map(String);
          const contributors = (t.contributorUids || []).map(String);
          return (
            members.includes(String(friendId)) ||
            contributors.includes(String(friendId))
          );
        });
      setCommonTrips(sharedTrips);

      const statsMap = {};
      await Promise.all(
        sharedTrips.map(async (t) => {
          try {
            const tlSnap = await getDocs(collection(db, "trips", t.id, "timeline"));
            const events = tlSnap.docs.map((d) => d.data());
            const total = events.length || 1;
            const completed = events.filter((e) => e.completed === true).length;
            statsMap[t.id] = { completed, total, percent: Math.round((completed / total) * 100) };
          } catch {
            // ignore
          }
        })
      );
      setTimelineStatsMap(statsMap);
    } catch (e) {
      console.warn("Failed fetching mutual data:", e);
    }
  }, [currentUser?.uid, friendId]);

  // 9. Send message (supports text, image, cards, replies, view-once, disappearing messages)
  const sendMessage = useCallback(
    async (optionsOrText) => {
      const opts =
        typeof optionsOrText === "string"
          ? { text: optionsOrText }
          : optionsOrText || {};

      const {
        text = "",
        imageUrl = null,
        replyingTo = null,
        replyTo = null,
        viewOnce = false,
        type = null,
        images = null,
        cardData = null,
      } = opts;

      const trimmedText = typeof text === "string" ? text.trim() : "";
      const replyTarget = replyingTo || replyTo || null;
      const effectiveUser = currentUser || contextUser || auth.currentUser;
      const effectiveChatId =
        chatId ||
        (effectiveUser && friendId
          ? [effectiveUser.uid, friendId].sort().join("_")
          : null);

      if (
        (!trimmedText && !imageUrl && !images && !cardData) ||
        !effectiveChatId ||
        !effectiveUser
      ) {
        return;
      }

      // Check if blocked
      const isBlocked = (friendDetails?.blockedUids || []).includes(
        effectiveUser.uid
      );

      const disappearingDuration =
        getChatDisappearingDuration(effectiveChatId) ||
        getChatDisappearingDuration(friendId);

      const tempId = `temp_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

      const optimisticMsg = {
        id: tempId,
        clientTempId: tempId,
        senderId: effectiveUser.uid,
        text: trimmedText,
        type:
          type ||
          (imageUrl
            ? "image"
            : images && images.length > 0
            ? "image_group"
            : cardData
            ? "card"
            : "text"),
        timestamp: new Date(),
        isRead: false,
        reactions: [],
        isSending: true,
        hasPendingWrites: true,
        status: "sending",
      };

      if (isBlocked) {
        optimisticMsg.blocked = true;
      }
      if (disappearingDuration > 0) {
        optimisticMsg.expiresAt = Date.now() + disappearingDuration;
      }
      if (viewOnce) {
        optimisticMsg.viewOnce = true;
        optimisticMsg.viewedOnce = false;
      }
      if (imageUrl) {
        optimisticMsg.dataUri = imageUrl;
      }
      if (images && Array.isArray(images) && images.length > 0) {
        optimisticMsg.images = images;
      }
      if (cardData) {
        optimisticMsg.cardData = cardData;
      }
      if (replyTarget) {
        optimisticMsg.replyTo = {
          id: replyTarget.id || "",
          text: replyTarget.text || "",
          senderId: replyTarget.senderId || "",
          imageUrl: replyTarget.imageUrl || replyTarget.dataUri || null,
        };
      }

      pendingMessagesRef.current.set(tempId, optimisticMsg);
      setMessages((prev) => [...prev, optimisticMsg]);
      setIsSending(true);

      try {
        // Clear remote typing indicator
        if (effectiveChatId) {
          updateDoc(doc(db, "chats", effectiveChatId), {
            [`drafts.${effectiveUser.uid}`]: "",
          }).catch(() => {});
        }

        const newMsg = {
          clientTempId: tempId,
          senderId: effectiveUser.uid,
          text: trimmedText,
          type:
            type ||
            (imageUrl
              ? "image"
              : images && images.length > 0
              ? "image_group"
              : cardData
              ? "card"
              : "text"),
          timestamp: serverTimestamp(),
          isRead: false,
          reactions: [],
        };

        if (isBlocked) {
          newMsg.blocked = true;
        }

        if (disappearingDuration > 0) {
          newMsg.expiresAt = Date.now() + disappearingDuration;
        }

        if (viewOnce) {
          newMsg.viewOnce = true;
          newMsg.viewedOnce = false;
        }

        if (imageUrl) {
          newMsg.dataUri = imageUrl;
        }

        if (images && Array.isArray(images) && images.length > 0) {
          newMsg.images = images;
        }

        if (cardData) {
          newMsg.cardData = cardData;
        }

        if (replyTarget) {
          newMsg.replyTo = {
            id: replyTarget.id || "",
            text: replyTarget.text || "",
            senderId: replyTarget.senderId || "",
            imageUrl: replyTarget.imageUrl || replyTarget.dataUri || null,
          };
        }

        await addDoc(
          collection(db, "chats", effectiveChatId, "messages"),
          newMsg
        );

        const lastMsgSnippet =
          trimmedText ||
          (newMsg.dataUri
            ? "Photo"
            : images
            ? "Photos"
            : cardData
            ? "Card"
            : "Attachment");
        setDoc(
          doc(db, "chats", effectiveChatId),
          {
            lastMessage: {
              text: lastMsgSnippet,
              senderId: effectiveUser.uid,
              timestamp: serverTimestamp(),
            },
            users: [effectiveUser.uid, friendId],
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        ).catch(() => {});

        // Dispatch real-time in-app notification to friend only if friend is not in this active chat and not muted
        if (friendId && friendId !== effectiveUser.uid) {
          let shouldSendNotification = true;
          try {
            const friendSnap = await getDoc(doc(db, "users", friendId));
            if (friendSnap.exists()) {
              const fData = friendSnap.data();
              const fActive = fData.activeChat;
              // If the friend currently has THIS chat open, suppress notifications!
              if (
                fActive &&
                (fActive.id === effectiveChatId ||
                  fActive.friendId === effectiveUser.uid ||
                  fActive.chatId === effectiveChatId)
              ) {
                shouldSendNotification = false;
              }
              // If the friend has muted notifications for this chat or user
              if (
                fData.mutedChats &&
                (fData.mutedChats[effectiveChatId] ||
                  fData.mutedChats[effectiveUser.uid])
              ) {
                shouldSendNotification = false;
              }
            }
          } catch {}

          if (shouldSendNotification) {
            const notifType = imageUrl
              ? "photo"
              : replyTarget
              ? "reply"
              : "chat";
            const notifTitle = effectiveUser.displayName || "New Message";
            const notifContent = imageUrl
              ? trimmedText
                ? `Sent a photo: "${trimmedText}"`
                : "Sent a photo"
              : replyTarget
              ? `Replied to your message: "${trimmedText}"`
              : trimmedText || "Sent a message";

            addDoc(collection(db, "notifications"), {
              uid: friendId,
              senderId: effectiveUser.uid,
              type: notifType,
              title: notifTitle,
              content: notifContent,
              pic: effectiveUser.photoURL || "",
              imageUrl: imageUrl || null,
              chatId: effectiveChatId,
              seen: false,
              timestamp: serverTimestamp(),
            }).catch(() => {});
          }
        }
      } catch (err) {
        console.error("Failed to send message:", err);
        pendingMessagesRef.current.delete(tempId);
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
      } finally {
        pendingMessagesRef.current.delete(tempId);
        setIsSending(pendingMessagesRef.current.size > 0);
      }
    },
    [chatId, currentUser, contextUser, friendDetails, friendId]
  );

  // 10. Reactions handling (toggle emoji)
  const handleReaction = useCallback(
    async (emoji, msg) => {
      if (!msg?.id || !chatId || !currentUser?.uid) return;

      const currentReactions = Array.isArray(msg.reactions) ? msg.reactions : [];
      const existingIndex = currentReactions.findIndex(
        (r) => r.user === currentUser.uid && r.emoji === emoji
      );

      let updated;
      if (existingIndex > -1) {
        // Remove reaction
        updated = currentReactions.filter((_, idx) => idx !== existingIndex);
      } else {
        // Add reaction (or replace user's existing reaction)
        const withoutUser = currentReactions.filter(
          (r) => r.user !== currentUser.uid
        );
        updated = [...withoutUser, { emoji, user: currentUser.uid }];
      }

      try {
        await updateDoc(doc(db, "chats", chatId, "messages", msg.id), {
          reactions: updated,
        });

        // Dispatch reaction notification to original message author if reacting (and not self)
        if (msg.senderId && msg.senderId !== currentUser.uid && existingIndex === -1) {
          try {
            const authorSnap = await getDoc(doc(db, "users", msg.senderId));
            if (authorSnap.exists()) {
              const aData = authorSnap.data();
              const aActive = aData.activeChat;
              const isAuthorInChat =
                aActive &&
                (aActive.id === chatId || aActive.friendId === currentUser.uid);
              const isAuthorMuted =
                aData.mutedChats &&
                (aData.mutedChats[chatId] || aData.mutedChats[currentUser.uid]);

              if (!isAuthorInChat && !isAuthorMuted) {
                addDoc(collection(db, "notifications"), {
                  uid: msg.senderId,
                  senderId: currentUser.uid,
                  type: "reaction",
                  title: "New Reaction",
                  content: `${currentUser.displayName || "Someone"} reacted ${emoji} to your message`,
                  pic: currentUser.photoURL || "",
                  chatId: chatId,
                  seen: false,
                  timestamp: serverTimestamp(),
                }).catch(() => {});
              }
            }
          } catch {}
        }
      } catch (e) {
        console.error("Failed to update reaction:", e);
      }
    },
    [chatId, currentUser]
  );

  // 11. Delete & Edit message
  const deleteMessage = useCallback(
    async (msgId) => {
      if (!chatId || !msgId) return;
      try {
        await deleteDoc(doc(db, "chats", chatId, "messages", msgId));
      } catch (e) {
        console.error("Failed to delete message:", e);
      }
    },
    [chatId]
  );

  const editMessage = useCallback(
    async (msgId, newText) => {
      if (!chatId || !msgId || !newText.trim()) return;
      try {
        await updateDoc(doc(db, "chats", chatId, "messages", msgId), {
          text: newText.trim(),
          edited: true,
        });
      } catch (e) {
        console.error("Failed to edit message:", e);
      }
    },
    [chatId]
  );

  // 12. Save nickname
  const saveNickname = useCallback(
    async (newNick) => {
      if (!currentUser?.uid || !friendId) return;
      try {
        await updateDoc(doc(db, "users", currentUser.uid), {
          [`nicknames.${friendId}`]: newNick.trim(),
        });
        setNickname(newNick.trim());
        setCachedData(`nickname_${currentUser.uid}_${friendId}`, newNick.trim());
      } catch (e) {
        console.error("Failed to save nickname:", e);
      }
    },
    [currentUser?.uid, friendId]
  );

  // 13. Block / Unblock friend
  const toggleBlockFriend = useCallback(async () => {
    if (!currentUser?.uid || !friendId) return;
    const isCurrentlyBlocked = blockedUids.includes(friendId);
    const userRef = doc(db, "users", currentUser.uid);

    try {
      if (isCurrentlyBlocked) {
        await updateDoc(userRef, { blockedUids: arrayRemove(friendId) });
        setBlockedUids((prev) => prev.filter((id) => id !== friendId));
      } else {
        await updateDoc(userRef, { blockedUids: arrayUnion(friendId) });
        setBlockedUids((prev) => [...prev, friendId]);
      }
    } catch (e) {
      console.error("Failed to toggle block status:", e);
    }
  }, [currentUser?.uid, friendId, blockedUids]);

  // 14. Remove from Friends
  const removeFriend = useCallback(async () => {
    if (!currentUser?.uid || !friendId) return;
    try {
      await Promise.all([
        updateDoc(doc(db, "users", currentUser.uid), {
          friends: arrayRemove(friendId),
        }),
        updateDoc(doc(db, "users", friendId), {
          friends: arrayRemove(currentUser.uid),
        }),
      ]);
    } catch (e) {
      console.error("Failed to remove friend:", e);
    }
  }, [currentUser?.uid, friendId]);

  // 14. Pin / Unpin message in chat with duration support
  const handlePinMessage = useCallback(
    async (msg, durationHours = null) => {
      if (!chatId || !msg) return;
      const currentPins = Array.isArray(pinnedMessages)
        ? [...pinnedMessages]
        : pinnedMessage
        ? [pinnedMessage]
        : [];

      const existingIdx = currentPins.findIndex((p) => p.id === msg.id);
      let updatedPins = [];

      if (existingIdx >= 0) {
        // Unpin
        updatedPins = currentPins.filter((p) => p.id !== msg.id);
      } else {
        let expiresAt = null;
        if (typeof durationHours === "number" && durationHours > 0) {
          expiresAt = Date.now() + durationHours * 60 * 60 * 1000;
        }

        const newPin = {
          id: msg.id,
          text: msg.text || (msg.imageUrl ? "📷 Photo" : "Pinned card"),
          senderName:
            msg.senderId === currentUser?.uid
              ? "You"
              : friendDetails?.name || "Friend",
          timestamp: msg.timestamp || null,
          pinnedAt: Date.now(),
          expiresAt: expiresAt,
          pinnedBy: currentUser?.uid || null,
        };
        updatedPins = [newPin, ...currentPins];
      }

      try {
        await updateDoc(doc(db, "chats", chatId), {
          pinnedMessages: updatedPins,
          pinnedMessage: updatedPins[0] || null,
        });
      } catch (e) {
        console.error("Failed to pin chat message:", e);
      }
    },
    [chatId, pinnedMessages, pinnedMessage, currentUser?.uid, friendDetails?.name]
  );

  // 15. Send Secured Trip Budget & Expenses loaded from Firestore budgets doc
  const handleSendBudget = useCallback(
    async (tripOrId = null) => {
      if (!chatId || !currentUser) return;
      try {
        let tId = typeof tripOrId === "string" ? tripOrId : tripOrId?.id;
        if (!tId && commonTrips && commonTrips.length > 0) {
          tId = commonTrips[0]?.id;
        }
        if (!tId) return;

        // Query budgets doc in Firestore matching tripId
        let bData = null;
        try {
          const directSnap = await getDoc(doc(db, "budgets", tId));
          if (directSnap.exists()) {
            bData = directSnap.data();
          }
        } catch {}

        if (!bData) {
          try {
            const q = query(collection(db, "budgets"), where("tripId", "==", tId), limit(1));
            const qSnap = await getDocs(q);
            if (!qSnap.empty) {
              bData = qSnap.docs[0].data();
            }
          } catch {}
        }

        const tripSnap = await getDoc(doc(db, "trips", tId));
        const tData = tripSnap.exists()
          ? tripSnap.data()
          : typeof tripOrId === "object" && tripOrId !== null
          ? tripOrId
          : {};

        const budgetItems = Array.isArray(bData?.items) ? bData.items : [];
        const activeItem = budgetItems.find((it) => it.tripId === tId) || budgetItems[0] || bData || {};

        const totalBudget = Number(activeItem.total || bData?.total || tData?.budget) || 0;
        const expenses = Array.isArray(activeItem.expenses)
          ? activeItem.expenses
          : Array.isArray(bData?.expenses)
          ? bData.expenses
          : Array.isArray(tData?.expenses)
          ? tData.expenses
          : [];

        const totalSpent = expenses.length > 0
          ? expenses.reduce((s, e) => s + (Number(e.amount) || 0), 0)
          : Number(activeItem.used || bData?.used || 0) || 0;
        const remaining = totalBudget - totalSpent;
        const contributors = activeItem.contributors || bData?.contributors || [];

        const allowedMembers = Array.from(
          new Set(
            [
              tData?.createdBy,
              ...(Array.isArray(tData?.members) ? tData.members : []),
              currentUser.uid,
              friendId,
            ].filter(Boolean)
          )
        );

        await sendMessage({
          type: "budget",
          cardData: {
            type: "budget",
            tripId: tId,
            tripTitle: tData?.name || "Trip",
            totalBudget,
            totalSpent,
            remaining,
            contributors,
            allowedMembers,
            updatedAt: new Date().toISOString(),
          },
        });
      } catch (e) {
        console.error("Failed to share trip budget in chat:", e);
      }
    },
    [chatId, currentUser, friendId, commonTrips, sendMessage]
  );

  // 16. Send Detailed Expenses breakdown loaded from Firestore budgets doc
  const handleSendExpenses = useCallback(
    async (tripOrId = null) => {
      if (!chatId || !currentUser) return;
      try {
        let tId = typeof tripOrId === "string" ? tripOrId : tripOrId?.id;
        if (!tId && commonTrips && commonTrips.length > 0) {
          tId = commonTrips[0]?.id;
        }
        if (!tId) return;

        let bData = null;
        try {
          const directSnap = await getDoc(doc(db, "budgets", tId));
          if (directSnap.exists()) {
            bData = directSnap.data();
          }
        } catch {}

        if (!bData) {
          try {
            const q = query(collection(db, "budgets"), where("tripId", "==", tId), limit(1));
            const qSnap = await getDocs(q);
            if (!qSnap.empty) {
              bData = qSnap.docs[0].data();
            }
          } catch {}
        }

        const tripSnap = await getDoc(doc(db, "trips", tId));
        const tData = tripSnap.exists()
          ? tripSnap.data()
          : typeof tripOrId === "object" && tripOrId !== null
          ? tripOrId
          : {};

        const budgetItems = Array.isArray(bData?.items) ? bData.items : [];
        const activeItem = budgetItems.find((it) => it.tripId === tId) || budgetItems[0] || bData || {};

        const totalBudget = Number(activeItem.total || bData?.total || tData?.budget) || 0;
        const expenses = Array.isArray(activeItem.expenses)
          ? activeItem.expenses
          : Array.isArray(bData?.expenses)
          ? bData.expenses
          : Array.isArray(tData?.expenses)
          ? tData.expenses
          : [];

        const totalSpent = expenses.length > 0
          ? expenses.reduce((s, e) => s + (Number(e.amount) || 0), 0)
          : Number(activeItem.used || bData?.used || 0) || 0;
        const remaining = totalBudget - totalSpent;
        const contributors = activeItem.contributors || bData?.contributors || [];

        const allowedMembers = Array.from(
          new Set(
            [
              tData?.createdBy,
              ...(Array.isArray(tData?.members) ? tData.members : []),
              currentUser.uid,
              friendId,
            ].filter(Boolean)
          )
        );

        await sendMessage({
          type: "expenses",
          cardData: {
            type: "expenses",
            tripId: tId,
            tripTitle: tData?.name || "Trip",
            totalBudget,
            totalSpent,
            remaining,
            expenses: expenses,
            contributors,
            allowedMembers,
            updatedAt: new Date().toISOString(),
          },
        });
      } catch (e) {
        console.error("Failed to share trip expenses in chat:", e);
      }
    },
    [chatId, currentUser, friendId, commonTrips, sendMessage]
  );

  // 17. Send Contact / User Profile Card
  const handleSendUserProfile = useCallback(
    async (targetUser) => {
      if (!targetUser || !chatId || !currentUser) return;
      try {
        await sendMessage({
          type: "user_profile",
          cardData: {
            type: "user_profile",
            uid: targetUser.uid || targetUser.id,
            id: targetUser.uid || targetUser.id,
            name: targetUser.name || targetUser.displayName || "User",
            username: targetUser.username || "",
            photoURL: targetUser.photoURL || "",
            bio: targetUser.bio || "",
          },
        });
      } catch (e) {
        console.error("Failed to send user profile:", e);
      }
    },
    [chatId, currentUser, sendMessage]
  );

  // 18. Send AI Places recommendations
  const handleSendAiPlaces = useCallback(
    async (destination) => {
      if (!destination || !chatId || !currentUser) return;
      try {
        const suggestions = await generatePlaceSuggestions(destination);
        await sendMessage({
          type: "ai_places",
          cardData: {
            type: "ai_places",
            destination,
            content: suggestions,
          },
        });
      } catch (e) {
        console.error("Failed to send AI places:", e);
      }
    },
    [chatId, currentUser, sendMessage]
  );

  // 19. Send AI Question response
  const handleSendAiQuestion = useCallback(
    async (prompt) => {
      if (!prompt || !chatId || !currentUser) return;
      try {
        const answer = await askQuickAI(prompt);
        await sendMessage({
          type: "ai_assistant",
          cardData: {
            type: "ai_assistant",
            prompt,
            content: answer,
          },
        });
      } catch (e) {
        console.error("Failed to send AI question:", e);
      }
    },
    [chatId, currentUser, sendMessage]
  );

  return {
    currentUser,
    authLoading,
    loadingMessages,
    chatId,
    messages,
    friendDetails,
    nickname,
    blockedUids,
    isBlocked: blockedUids.includes(friendId),
    isFriendTyping,
    isSending,
    pinnedMessage,
    pinnedMessages,
    mutualFriends,
    commonGroups,
    commonTrips,
    timelineStatsMap,
    fetchMutualFriends,
    sendMessage,
    handleReaction,
    deleteMessage,
    editMessage,
    saveNickname,
    toggleBlockFriend,
    removeFriend,
    setDraftStatus,
    handlePinMessage,
    handleSendBudget,
    handleSendExpenses,
    handleSendUserProfile,
    handleSendAiPlaces,
    handleSendAiQuestion,
  };
}

export default useChatSync;
