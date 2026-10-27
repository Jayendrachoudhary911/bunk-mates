import { useState, useEffect, useCallback, useRef } from "react";
import {
  collection,
  doc,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  setDoc,
  updateDoc,
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

export function useGroupChatSync(groupName) {
  const [currentUser, setCurrentUser] = useState(() => auth.currentUser);
  const [authLoading, setAuthLoading] = useState(!auth.currentUser);

  // Typing members state
  const [typingMembers, setTypingMembers] = useState([]);
  const typingTimeoutRef = useRef(null);

  // Messages are fetched directly from Firestore in real-time
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(true);

  const [groupInfo, setGroupInfo] = useState(() => {
    if (!groupName) return null;
    return getCachedData(`group_info_${groupName}`, null);
  });

  const [memberInfo, setMemberInfo] = useState({});
  const [createdByUser, setCreatedByUser] = useState(null);
  const [tripInfo, setTripInfo] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [checklist, setChecklist] = useState([]);
  const [timelineStats, setTimelineStats] = useState(null);
  const [isSending, setIsSending] = useState(false);

  // Auth observer
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (usr) => {
      setCurrentUser(usr);
      setAuthLoading(false);
    });
    return () => unsub();
  }, []);

  // Set active group chat, mark group as read in DB and Firestore notifications
  useEffect(() => {
    if (!groupName || !currentUser?.uid) return;
    setActiveChat({ type: "group", id: groupName, groupName });
    clearMarkChatUnread(groupName);

    // Mark group notifications as seen in Firestore
    const notifQ = query(
      collection(db, "notifications"),
      where("uid", "==", currentUser.uid),
      where("groupName", "==", groupName),
      where("seen", "==", false)
    );
    getDocs(notifQ)
      .then((snap) => {
        snap.forEach((d) => {
          updateDoc(doc(db, "notifications", d.id), { seen: true }).catch(() => {});
        });
      })
      .catch(() => {});

    // Update read timestamp on groupChats document in Firestore
    setDoc(
      doc(db, "groupChats", groupName),
      {
        readTimestamps: {
          [currentUser.uid]: serverTimestamp(),
        },
      },
      { merge: true }
    ).catch(() => {});

    try {
      window.dispatchEvent(new CustomEvent("bm_unread_chats_changed"));
      window.dispatchEvent(
        new CustomEvent("bm_last_message_updated", {
          detail: { chatId: groupName, unreadCount: 0, isGroup: true },
        })
      );
    } catch {}

    return () => {
      clearActiveChat();
    };
  }, [groupName, currentUser?.uid]);

  // Reset messages when groupName changes
  useEffect(() => {
    setMessages([]);
    setLoadingMessages(Boolean(groupName));
  }, [groupName]);

  // 2. Single high-performance listener for Group Metadata
  useEffect(() => {
    if (!groupName) return;

    const groupDocRef = doc(db, "groupChats", groupName);
    const unsubscribe = onSnapshot(groupDocRef, async (docSnap) => {
      if (!docSnap.exists()) {
        setGroupInfo(null);
        return;
      }

      const data = { id: docSnap.id, ...docSnap.data() };
      setGroupInfo(data);
      setCachedData(`group_info_${groupName}`, data);

      if (data.name) {
        try {
          localStorage.setItem(`bm_group_name_${groupName}`, data.name);
        } catch (e) {}
        window.dispatchEvent(
          new CustomEvent("bm_group_info_loaded", {
            detail: { groupName, name: data.name },
          })
        );
      }

      // Fetch creator if not already cached
      if (data.createdBy) {
        const cachedCreator = getCachedUser(data.createdBy);
        if (cachedCreator) {
          setCreatedByUser(cachedCreator);
        } else {
          getDoc(doc(db, "users", data.createdBy))
            .then((snap) => {
              if (snap.exists()) {
                const uData = snap.data();
                setCreatedByUser(uData);
                setCachedUser(data.createdBy, uData);
              }
            })
            .catch(() => {});
        }
      }

      // Fetch member profiles using cache to avoid fetching every user
      if (Array.isArray(data.members) && data.members.length > 0) {
        const fetched = {};
        const missingUids = [];

        data.members.forEach((uid) => {
          const cached = getCachedUser(uid);
          if (cached) {
            fetched[uid] = cached;
          } else {
            missingUids.push(uid);
          }
        });

        if (missingUids.length > 0) {
          await Promise.all(
            missingUids.map(async (uid) => {
              try {
                const snap = await getDoc(doc(db, "users", uid));
                if (snap.exists()) {
                  const uData = snap.data();
                  fetched[uid] = uData;
                  setCachedUser(uid, uData);
                }
              } catch (e) {
                // ignore
              }
            })
          );
        }

        setMemberInfo((prev) => ({ ...prev, ...fetched }));
      }

      // Real-time group typing members detection
      const drafts = data.drafts || {};
      const currentUid = currentUser?.uid;
      const activeTypingUids = Object.entries(drafts)
        .filter(([uid, val]) => uid !== currentUid && Boolean(val))
        .map(([uid]) => uid);

      if (activeTypingUids.length > 0) {
        const names = activeTypingUids.map((uid) => {
          const profile = memberInfo[uid] || getCachedUser(uid);
          return profile?.displayName || profile?.name || profile?.username || "Someone";
        });
        setTypingMembers(names);
      } else {
        setTypingMembers([]);
      }
    });

    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupName, currentUser?.uid]);

  // 3. Single listener for Group Messages
  useEffect(() => {
    if (!groupName) {
      setLoadingMessages(false);
      return;
    }

    setLoadingMessages(true);

    const q = query(
      collection(db, "groupChat", groupName, "messages"),
      orderBy("timestamp", "asc")
    );

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        setLoadingMessages(false);
        const msgs = [];
        const missingUids = [];
        querySnapshot.forEach((docSnap) => {
          const m = { id: docSnap.id, ...docSnap.data() };
          msgs.push(m);
          if (
            m.senderId &&
            m.senderId !== "system" &&
            !memberInfo[m.senderId]
          ) {
            const cached = getCachedUser(m.senderId);
            if (cached) {
              memberInfo[m.senderId] = cached;
            } else {
              missingUids.push(m.senderId);
            }
          }
        });

        if (missingUids.length > 0) {
          const uniqueMissing = Array.from(new Set(missingUids));
          Promise.all(
            uniqueMissing.map(async (uid) => {
              try {
                const snap = await getDoc(doc(db, "users", uid));
                if (snap.exists()) {
                  const uData = snap.data();
                  setCachedUser(uid, uData);
                  return { uid, uData };
                }
              } catch (e) {
                // ignore
              }
              return null;
            })
          ).then((results) => {
            const newProfiles = {};
            results.forEach((res) => {
              if (res) newProfiles[res.uid] = res.uData;
            });
            if (Object.keys(newProfiles).length > 0) {
              setMemberInfo((prev) => ({ ...prev, ...newProfiles }));
            }
          });
        }

        const validMsgs = msgs.filter((m) => !isMessageExpired(m));
        setMessages(validMsgs);
      },
      (err) => {
        console.error("Group messages listener error:", err);
        setLoadingMessages(false);
      }
    );

    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupName]);

  // 4. Trip connection listeners (if connected to a trip)
  useEffect(() => {
    const tripId = groupInfo?.tripId;
    if (!tripId) {
      setTripInfo(null);
      setTimeline([]);
      setChecklist([]);
      setTimelineStats(null);
      return;
    }

    // Fetch trip info
    getDoc(doc(db, "trips", tripId))
      .then((snap) => {
        if (snap.exists()) {
          setTripInfo({ id: snap.id, ...snap.data() });
        }
      })
      .catch(() => {});

    // Listen to checklist
    const unsubChecklist = onSnapshot(
      collection(db, "trips", tripId, "checklist"),
      (snap) => {
        setChecklist(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      }
    );

    // Listen to timeline
    const unsubTimeline = onSnapshot(
      collection(db, "trips", tripId, "timeline"),
      (snap) => {
        const events = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setTimeline(events);
        const total = events.length || 1;
        const completed = events.filter((e) => e.completed === true).length;
        setTimelineStats({
          completed,
          total,
          percent: Math.round((completed / total) * 100),
        });
      }
    );

    return () => {
      unsubChecklist();
      unsubTimeline();
    };
  }, [groupInfo?.tripId]);

  // Broadcast current user's typing status to group
  const setDraftStatus = useCallback(
    (text) => {
      if (!groupName || !currentUser?.uid) return;
      const groupDocRef = doc(db, "groupChats", groupName);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      const isTyping = Boolean(text && String(text).trim());
      updateDoc(groupDocRef, {
        [`drafts.${currentUser.uid}`]: isTyping,
      }).catch(() => {});

      if (isTyping) {
        typingTimeoutRef.current = setTimeout(() => {
          updateDoc(groupDocRef, {
            [`drafts.${currentUser.uid}`]: false,
          }).catch(() => {});
        }, 2500);
      }
    },
    [groupName, currentUser?.uid]
  );

  // Clear typing on group switch or unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      if (groupName && currentUser?.uid) {
        updateDoc(doc(db, "groupChats", groupName), {
          [`drafts.${currentUser.uid}`]: false,
        }).catch(() => {});
      }
    };
  }, [groupName, currentUser?.uid]);

  // 5. Send message (text, image, structured cards, reply)
  const sendMessage = useCallback(
    async ({
      text = "",
      imageUrl = null,
      images = null,
      replyTo = null,
      type = "text",
      cardData = null,
      viewOnce = false,
    }) => {
      if ((!text.trim() && !imageUrl && !images && !cardData) || !groupName || !currentUser) {
        return;
      }
      setIsSending(true);

      // Immediately clear typing state
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      updateDoc(doc(db, "groupChats", groupName), {
        [`drafts.${currentUser.uid}`]: false,
      }).catch(() => {});

      const msgData = {
        senderId: currentUser.uid,
        senderName:
          currentUser.displayName ||
          memberInfo[currentUser.uid]?.name ||
          "Member",
        senderPhoto:
          currentUser.photoURL || memberInfo[currentUser.uid]?.photoURL || "",
        text: text.trim(),
        type: imageUrl ? "image" : type,
        timestamp: serverTimestamp(),
        reactions: [],
        readBy: [currentUser.uid],
        readByMap: { [currentUser.uid]: new Date().toISOString() },
      };

      const disappearingDuration = getChatDisappearingDuration(groupName, groupInfo?.disappearingDuration);
      if (disappearingDuration > 0) {
        msgData.expiresAt = Date.now() + disappearingDuration;
      }

      if (viewOnce) {
        msgData.viewOnce = true;
        msgData.viewedByOnce = [];
      }

      if (imageUrl) {
        msgData.dataUri = imageUrl;
      }

      if (images && Array.isArray(images)) {
        msgData.images = images;
        msgData.type = "image_group";
      }

      if (cardData) {
        msgData.cardData = cardData;
      }

      if (replyTo) {
        msgData.replyTo = {
          id: replyTo.id,
          text: replyTo.text || "",
          senderName: replyTo.senderName || "Member",
          imageUrl: replyTo.imageUrl || replyTo.dataUri || null,
        };
      }

      try {
        await addDoc(
          collection(db, "groupChat", groupName, "messages"),
          msgData
        );

        const groupMsgSnippet = msgData.text || (msgData.dataUri ? "Photo" : "Attachment");
        const senderDisplayName = memberInfo[currentUser.uid]?.name || currentUser.displayName || "Member";
        setDoc(
          doc(db, "groupChats", groupName),
          {
            lastMessage: {
              text: groupMsgSnippet,
              senderId: currentUser.uid,
              senderName: senderDisplayName,
              timestamp: serverTimestamp(),
            },
            lastMessageTimestamp: serverTimestamp(),
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        ).catch(() => {});


        // Group members to notify
        const members = Array.isArray(groupInfo?.members) ? groupInfo.members : [];
        const otherMembers = members.filter((m) => m !== currentUser.uid);
        const groupTitle = groupInfo?.name || groupName || "Group";
        const senderName = memberInfo[currentUser.uid]?.name || currentUser.displayName || "Member";
        const senderAvatar = memberInfo[currentUser.uid]?.photoURL || currentUser.photoURL || "";

        // 1. Detect mentions in text (@username)
        const mentionMatches = (text.match(/@([a-zA-Z0-9_.-]+)/g) || []).map((m) =>
          m.slice(1).toLowerCase()
        );
        const mentionedUids = new Set();
        if (mentionMatches.length > 0) {
          Object.entries(memberInfo).forEach(([uid, info]) => {
            if (
              info?.username &&
              mentionMatches.includes(info.username.toLowerCase()) &&
              uid !== currentUser.uid
            ) {
              mentionedUids.add(uid);
            }
          });
        }

        // Check which members are eligible for notifications (not currently in this group and not muted)
        const checkMemberNotificationAllowed = async (uid) => {
          try {
            const uSnap = await getDoc(doc(db, "users", uid));
            if (uSnap.exists()) {
              const uData = uSnap.data();
              // If user currently has this group open, do not send notification
              if (uData.activeChat?.groupName === groupName || uData.activeChat?.id === groupName) {
                return false;
              }
              // If user muted this group
              if (uData.mutedChats?.[groupName]) {
                return false;
              }
            }
            return true;
          } catch {
            return true;
          }
        };

        // Send mention notifications
        for (const uid of mentionedUids) {
          const allowed = await checkMemberNotificationAllowed(uid);
          if (allowed) {
            addDoc(collection(db, "notifications"), {
              uid,
              senderId: currentUser.uid,
              type: "mention",
              title: `${senderName} mentioned you in ${groupTitle}`,
              content: text,
              pic: senderAvatar,
              groupName: groupName,
              seen: false,
              timestamp: serverTimestamp(),
            }).catch(() => {});
          }
        }

        // 2. Specific notifications: Poll, Timeline, Checklist, Photo, Reply, or Group Chat
        const isPhoto = Boolean(imageUrl);
        const isPoll = type === "poll" || Boolean(cardData?.options);
        const isTimeline = type === "timeline";
        const isChecklist = type === "checklist";
        const isReply = Boolean(replyTo?.senderId && replyTo.senderId !== currentUser.uid);

        if (isReply) {
          const allowed = await checkMemberNotificationAllowed(replyTo.senderId);
          if (allowed) {
            addDoc(collection(db, "notifications"), {
              uid: replyTo.senderId,
              senderId: currentUser.uid,
              type: "reply",
              title: `${senderName} replied to you in ${groupTitle}`,
              content: text || (isPhoto ? "Sent a photo" : "Replied to your message"),
              pic: senderAvatar,
              imageUrl: imageUrl || null,
              groupName: groupName,
              seen: false,
              timestamp: serverTimestamp(),
            }).catch(() => {});
          }
        }

        // Notify other group members (excluding already notified mentioned users)
        const remainingMembers = otherMembers.filter((m) => !mentionedUids.has(m) && (m !== replyTo?.senderId));
        
        let generalNotifType = "group_chat";
        let generalNotifTitle = `${senderName} in ${groupTitle}`;
        let generalNotifContent = text;

        if (isPoll) {
          generalNotifType = "poll";
          generalNotifTitle = `📊 New Poll in ${groupTitle}`;
          generalNotifContent = cardData?.question || text || "New poll created";
        } else if (isTimeline) {
          generalNotifType = "timeline";
          generalNotifTitle = `🗓️ Trip Timeline in ${groupTitle}`;
          generalNotifContent = `${senderName} shared the trip timeline`;
        } else if (isChecklist) {
          generalNotifType = "checklist";
          generalNotifTitle = `☑️ Trip Checklist in ${groupTitle}`;
          generalNotifContent = `${senderName} shared the trip checklist`;
        } else if (isPhoto) {
          generalNotifType = "photo";
          generalNotifTitle = `${senderName} in ${groupTitle}`;
          generalNotifContent = text ? `Sent a photo: "${text}"` : "Sent a photo";
        }

        for (const uid of remainingMembers) {
          const allowed = await checkMemberNotificationAllowed(uid);
          if (allowed) {
            addDoc(collection(db, "notifications"), {
              uid,
              senderId: currentUser.uid,
              type: generalNotifType,
              title: generalNotifTitle,
              content: generalNotifContent,
              pic: senderAvatar,
              imageUrl: imageUrl || null,
              groupName: groupName,
              seen: false,
              timestamp: serverTimestamp(),
            }).catch(() => {});
          }
        }
      } catch (err) {
        console.error("Failed to send group message:", err);
      } finally {
        setIsSending(false);
      }
    },
    [groupName, currentUser, memberInfo, groupInfo]
  );

  // 6. Interactive Poll Vote
  const handleVotePoll = useCallback(
    async (msgId, optionIndex) => {
      if (!groupName || !currentUser?.uid) return;
      const msgRef = doc(db, "groupChat", groupName, "messages", msgId);

      try {
        const snap = await getDoc(msgRef);
        if (!snap.exists()) return;
        const data = snap.data();
        const poll = data.cardData;
        if (!poll || !poll.options) return;

        const uid = currentUser.uid;
        const allowMultiple = Boolean(poll.allowMultiple);
        const updatedOptions = poll.options.map((opt, idx) => {
          let votes = Array.isArray(opt.votes) ? [...opt.votes] : [];
          if (idx === optionIndex) {
            // Toggle vote
            if (votes.includes(uid)) {
              votes = votes.filter((v) => v !== uid);
            } else {
              votes = [...votes, uid];
            }
          } else if (!allowMultiple) {
            // If single choice only, remove user's vote from any other option
            votes = votes.filter((v) => v !== uid);
          }
          return { ...opt, votes };
        });

        await updateDoc(msgRef, {
          "cardData.options": updatedOptions,
        });

        // Notify poll creator
        if (data.senderId && data.senderId !== currentUser.uid) {
          const groupTitle = groupInfo?.name || groupName || "Group";
          addDoc(collection(db, "notifications"), {
            uid: data.senderId,
            senderId: currentUser.uid,
            type: "poll",
            title: `Vote on Poll in ${groupTitle}`,
            content: `${currentUser.displayName || "A member"} voted on "${poll.question || "Poll"}"`,
            pic: currentUser.photoURL || "",
            groupName: groupName,
            seen: false,
            timestamp: serverTimestamp(),
          }).catch(() => {});
        }
      } catch (err) {
        console.error("Failed to vote in poll:", err);
      }
    },
    [groupName, currentUser?.uid, currentUser?.displayName, currentUser?.photoURL, groupInfo]
  );

  // 7. Toggle checklist item
  const handleToggleChecklistItem = useCallback(
    async (itemId, checked, msgId = null) => {
      if (!currentUser?.uid) return;

      if (groupInfo?.tripId) {
        const itemRef = doc(db, "trips", groupInfo.tripId, "checklist", itemId);
        updateDoc(itemRef, {
          checkedBy: checked
            ? arrayUnion(currentUser.uid)
            : arrayRemove(currentUser.uid),
        }).catch(() => {});
      }

      if (msgId && groupName) {
        try {
          const msgRef = doc(db, "groupChat", groupName, "messages", msgId);
          const msgSnap = await getDoc(msgRef);
          if (msgSnap.exists()) {
            const data = msgSnap.data();
            const cardData = data.cardData || {};
            const items = (cardData.items || []).map((it) => {
              if (it.id === itemId || it.title === itemId) {
                const currentChecked = it.checkedBy || [];
                const updatedChecked = checked
                  ? Array.from(new Set([...currentChecked, currentUser.uid]))
                  : currentChecked.filter((id) => id !== currentUser.uid);
                return { ...it, checkedBy: updatedChecked };
              }
              return it;
            });
            await updateDoc(msgRef, {
              "cardData.items": items,
            });
          }
        } catch (e) {
          console.error("Failed to update message checklist item:", e);
        }
      }

      // Notify group of checklist update
      const groupTitle = groupInfo?.name || groupName || "Trip";
      const members = Array.isArray(groupInfo?.members) ? groupInfo.members : [];
      members.filter((m) => m !== currentUser.uid).forEach((uid) => {
        addDoc(collection(db, "notifications"), {
          uid,
          senderId: currentUser.uid,
          type: "checklist",
          title: `Checklist update in ${groupTitle}`,
          content: `${currentUser.displayName || "Someone"} marked a task ${checked ? "completed" : "pending"}`,
          pic: currentUser.photoURL || "",
          groupName: groupName,
          tripId: groupInfo?.tripId || null,
          seen: false,
          timestamp: serverTimestamp(),
        }).catch(() => {});
      });
    },
    [groupInfo, currentUser, groupName]
  );

  // 8. Reactions
  const handleReaction = useCallback(
    async (emoji, msg) => {
      if (!msg?.id || !groupName || !currentUser?.uid) return;

      const currentReactions = Array.isArray(msg.reactions) ? msg.reactions : [];
      const existingIndex = currentReactions.findIndex(
        (r) => r.user === currentUser.uid && r.emoji === emoji
      );

      let updated;
      if (existingIndex > -1) {
        updated = currentReactions.filter((_, idx) => idx !== existingIndex);
      } else {
        const withoutUser = currentReactions.filter(
          (r) => r.user !== currentUser.uid
        );
        updated = [...withoutUser, { emoji, user: currentUser.uid }];
      }

      try {
        await updateDoc(
          doc(db, "groupChat", groupName, "messages", msg.id),
          { reactions: updated }
        );

        if (msg.senderId && msg.senderId !== currentUser.uid && existingIndex === -1) {
          const groupTitle = groupInfo?.name || groupName || "Group";
          addDoc(collection(db, "notifications"), {
            uid: msg.senderId,
            senderId: currentUser.uid,
            type: "reaction",
            reaction: emoji,
            title: `${currentUser.displayName || "Member"} reacted in ${groupTitle}`,
            content: `Reacted ${emoji} to: "${(msg.text || "your message").slice(0, 40)}"`,
            pic: currentUser.photoURL || "",
            groupName: groupName,
            seen: false,
            timestamp: serverTimestamp(),
          }).catch(() => {});
        }
      } catch (e) {
        console.error("Failed to update group reaction:", e);
      }
    },
    [groupName, currentUser, groupInfo]
  );

  // 9. Delete & Edit
  const deleteMessage = useCallback(
    async (msgId) => {
      if (!groupName || !msgId) return;
      try {
        await deleteDoc(doc(db, "groupChat", groupName, "messages", msgId));
      } catch (e) {
        console.error("Failed to delete group message:", e);
      }
    },
    [groupName]
  );

  const editMessage = useCallback(
    async (msgId, newText) => {
      if (!groupName || !msgId || !newText.trim()) return;
      try {
        await updateDoc(doc(db, "groupChat", groupName, "messages", msgId), {
          text: newText.trim(),
          edited: true,
        });
      } catch (e) {
        console.error("Failed to edit group message:", e);
      }
    },
    [groupName]
  );

  // 10. Pin / Unpin Message with duration support
  const handlePinMessage = useCallback(
    async (msg, durationHours = null) => {
      if (!groupName || !msg) return;
      const currentPins = Array.isArray(groupInfo?.pinnedMessages)
        ? [...groupInfo.pinnedMessages]
        : groupInfo?.pinnedMessage
        ? [groupInfo.pinnedMessage]
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
          text: msg.text || (msg.imageUrl ? "📷 Photo" : "Pinned Card"),
          senderName: msg.senderName || "Member",
          timestamp: msg.timestamp || null,
          pinnedAt: Date.now(),
          expiresAt: expiresAt,
          pinnedBy: currentUser?.uid || null,
        };
        updatedPins = [newPin, ...currentPins];
      }

      try {
        await updateDoc(doc(db, "groupChat", groupName), {
          pinnedMessages: updatedPins,
          pinnedMessage: updatedPins[0] || null,
        });
      } catch (e) {
        console.error("Failed to toggle pin group message:", e);
      }
    },
    [groupName, groupInfo?.pinnedMessages, groupInfo?.pinnedMessage, currentUser?.uid]
  );

  // 11. Send Secured Trip Budget & Expenses loaded from Firestore budgets collection
  const handleSendBudget = useCallback(
    async () => {
      const tId = groupInfo?.tripId;
      if (!tId || !groupName || !currentUser) return;
      try {
        // Query the budgets doc in Firestore matching tripId
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
        const tData = tripSnap.exists() ? tripSnap.data() : {};

        const budgetItems = Array.isArray(bData?.items) ? bData.items : [];
        const activeItem = budgetItems.find((it) => it.tripId === tId) || budgetItems[0] || bData || {};

        const totalBudget = Number(activeItem.total || bData?.total || tData.budget) || 0;
        const expenses = Array.isArray(activeItem.expenses)
          ? activeItem.expenses
          : Array.isArray(bData?.expenses)
          ? bData.expenses
          : Array.isArray(tData.expenses)
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
              tData.createdBy,
              ...(Array.isArray(tData.members) ? tData.members : []),
              ...(Array.isArray(groupInfo?.members) ? groupInfo.members : []),
              currentUser.uid,
            ].filter(Boolean)
          )
        );

        await sendMessage({
          type: "budget",
          cardData: {
            type: "budget",
            tripId: tId,
            tripTitle: tData.name || "Trip",
            totalBudget,
            totalSpent,
            remaining,
            contributors,
            allowedMembers,
            updatedAt: new Date().toISOString(),
          },
        });
      } catch (e) {
        console.error("Failed to share group trip budget:", e);
      }
    },
    [groupInfo, groupName, currentUser, sendMessage]
  );

  // 12. Send Detailed Expenses breakdown loaded from Firestore budgets collection
  const handleSendExpenses = useCallback(
    async (overrideTripId = null) => {
      const tId = overrideTripId || groupInfo?.tripId;
      if (!tId || !groupName || !currentUser) return;
      try {
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
        const tData = tripSnap.exists() ? tripSnap.data() : {};

        const budgetItems = Array.isArray(bData?.items) ? bData.items : [];
        const activeItem = budgetItems.find((it) => it.tripId === tId) || budgetItems[0] || bData || {};

        const totalBudget = Number(activeItem.total || bData?.total || tData.budget) || 0;
        const expenses = Array.isArray(activeItem.expenses)
          ? activeItem.expenses
          : Array.isArray(bData?.expenses)
          ? bData.expenses
          : Array.isArray(tData.expenses)
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
              tData.createdBy,
              ...(Array.isArray(tData.members) ? tData.members : []),
              ...(Array.isArray(groupInfo?.members) ? groupInfo.members : []),
              currentUser.uid,
            ].filter(Boolean)
          )
        );

        await sendMessage({
          type: "expenses",
          cardData: {
            type: "expenses",
            tripId: tId,
            tripTitle: tData.name || "Trip",
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
        console.error("Failed to share group trip expenses:", e);
      }
    },
    [groupInfo, groupName, currentUser, sendMessage]
  );

  // 13. Send Contact / User Profile Card
  const handleSendUserProfile = useCallback(
    async (targetUser) => {
      if (!targetUser || !groupName || !currentUser) return;
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
    [groupName, currentUser, sendMessage]
  );

  // 14. Send AI Places recommendations
  const handleSendAiPlaces = useCallback(
    async (destination) => {
      if (!destination || !groupName || !currentUser) return;
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
    [groupName, currentUser, sendMessage]
  );

  // 15. Send AI Question response
  const handleSendAiQuestion = useCallback(
    async (prompt) => {
      if (!prompt || !groupName || !currentUser) return;
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
    [groupName, currentUser, sendMessage]
  );

  return {
    currentUser,
    authLoading,
    loadingMessages,
    messages,
    groupInfo,
    memberInfo,
    createdByUser,
    tripInfo,
    timeline,
    checklist,
    timelineStats,
    isSending,
    pinnedMessage: groupInfo?.pinnedMessage || (groupInfo?.pinnedMessages?.[0] || null),
    pinnedMessages: (groupInfo?.pinnedMessages || (groupInfo?.pinnedMessage ? [groupInfo.pinnedMessage] : [])),
    sendMessage,
    handleVotePoll,
    handleToggleChecklistItem,
    handleReaction,
    deleteMessage,
    editMessage,
    handlePinMessage,
    handleSendBudget,
    handleSendExpenses,
    handleSendUserProfile,
    handleSendAiPlaces,
    handleSendAiQuestion,
    typingMembers,
    setDraftStatus,
  };
}

export default useGroupChatSync;
