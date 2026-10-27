// src/components/chats_components/UniversalShareToChatDialog.jsx
import React, { useState, useEffect } from "react";
import {
  SwipeableDrawer,
  Box,
  Typography,
  Button,
  Avatar,
  IconButton,
  TextField,
  InputAdornment,
  CircularProgress,
  Tabs,
  Tab,
  Checkbox,
  Snackbar,
  Alert,
} from "@mui/material";
import {
  drawerPaperSx,
  drawerBackdropSx,
  DrawerHandle,
} from "../../theme/designSystem";
import CloseIcon from "@mui/icons-material/Close";
import SearchIcon from "@mui/icons-material/Search";
import SendIcon from "@mui/icons-material/Send";
import GroupIcon from "@mui/icons-material/Group";
import PersonIcon from "@mui/icons-material/Person";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import {
  collection,
  getDocs,
  query,
  where,
  addDoc,
  serverTimestamp,
  doc,
  getDoc,
  updateDoc,
} from "firebase/firestore";
import { db, auth } from "../../firebase";
import { safeImageUrl } from "../../utils/uiHelpers";

const UniversalShareToChatDialog = ({
  open,
  onClose,
  itemType = "trip", // "trip" | "place" | "user" | "note"
  itemData = {},
  currentUser,
  effectiveChatTheme = "dark",
}) => {
  const isDark = effectiveChatTheme === "dark";
  const safeItemData = itemData || {};
  const isForward = itemType === "forward" || itemType === "forward_messages";
  const msgsToForward = isForward
    ? Array.isArray(safeItemData.messages)
      ? safeItemData.messages
      : safeItemData.id || safeItemData.text || safeItemData.imageUrl || safeItemData.cardData
      ? [safeItemData]
      : []
    : [];

  const [activeTab, setActiveTab] = useState(0); // 0: All, 1: Groups, 2: Friends
  const [searchTerm, setSearchTerm] = useState("");
  const [personalNote, setPersonalNote] = useState("");
  const [groups, setGroups] = useState([]);
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedDestinations, setSelectedDestinations] = useState([]); // [{ type: 'group' | 'direct', id, name, avatar }]
  const [isSending, setIsSending] = useState(false);
  const [toast, setToast] = useState({ open: false, message: "", severity: "success" });

  const currentUid = currentUser?.uid || auth.currentUser?.uid;

  // Load user's active direct friends and group chats
  useEffect(() => {
    if (!open || !currentUid) return;

    let isMounted = true;
    const loadDestinations = async () => {
      setLoading(true);
      try {
        // 1. Fetch user doc for friends list and user's group references
        const userDoc = await getDoc(doc(db, "users", currentUid));
        const rawFriends = userDoc.exists() ? userDoc.data().friends || [] : [];
        const friendUids = rawFriends
          .map((f) => (typeof f === "string" ? f : f?.uid || f?.id))
          .filter(Boolean);

        // Fetch friend profiles
        const loadedFriends = [];
        for (const fUid of friendUids.slice(0, 30)) {
          try {
            const fSnap = await getDoc(doc(db, "users", fUid));
            if (fSnap.exists()) {
              const data = fSnap.data();
              // Compute or find chatId
              const chatId = [currentUid, fUid].sort().join("_");
              loadedFriends.push({
                type: "direct",
                id: chatId,
                friendId: fUid,
                name: data.displayName || data.name || "Friend",
                username: data.username || "",
                photoURL: data.photoURL || "",
              });
            }
          } catch {}
        }

        // 2. Fetch user's joined group chats from groupChats & groupChat docs
        const groupsMap = new Map();

        const addGroupToMap = (docId, data = {}) => {
          if (!docId || groupsMap.has(docId)) return;
          const members = data.members || [];
          groupsMap.set(docId, {
            type: "group",
            id: docId,
            groupName: docId,
            name: data.name || data.groupName || data.title || docId,
            photoURL: data.groupImage || data.photoURL || data.image || "",
            memberCount: Array.isArray(members) ? members.length : 1,
          });
        };

        // 2A. Query 'groupChats' collection where members array-contains currentUid
        try {
          const qGroupChats = query(
            collection(db, "groupChats"),
            where("members", "array-contains", currentUid)
          );
          const snapGroupChats = await getDocs(qGroupChats);
          snapGroupChats.forEach((d) => addGroupToMap(d.id, d.data()));
        } catch (err) {
          console.warn("Could not query groupChats collection:", err);
        }

        // 2B. Query 'groupChat' collection where members array-contains currentUid
        try {
          const qGroupChat = query(
            collection(db, "groupChat"),
            where("members", "array-contains", currentUid)
          );
          const snapGroupChat = await getDocs(qGroupChat);
          snapGroupChat.forEach((d) => addGroupToMap(d.id, d.data()));
        } catch (err) {
          console.warn("Could not query groupChat collection:", err);
        }

        // 2C. Check user doc for groupChats / groupChat / groups array
        if (userDoc.exists()) {
          const uData = userDoc.data();
          const userGroupList = [
            ...(Array.isArray(uData.groupChats) ? uData.groupChats : []),
            ...(Array.isArray(uData.groupChat) ? uData.groupChat : []),
            ...(Array.isArray(uData.groups) ? uData.groups : []),
          ];

          for (const g of userGroupList) {
            const gId = typeof g === "string" ? g : g?.id || g?.groupId || g?.groupName;
            if (gId && !groupsMap.has(gId)) {
              try {
                const gSnap1 = await getDoc(doc(db, "groupChats", gId));
                if (gSnap1.exists()) {
                  addGroupToMap(gSnap1.id, gSnap1.data());
                } else {
                  const gSnap2 = await getDoc(doc(db, "groupChat", gId));
                  if (gSnap2.exists()) {
                    addGroupToMap(gSnap2.id, gSnap2.data());
                  } else if (typeof g === "object") {
                    addGroupToMap(gId, g);
                  }
                }
              } catch {}
            }
          }
        }

        // 2D. Fallback query all groupChats if available
        try {
          const allGroupsSnap = await getDocs(collection(db, "groupChats"));
          allGroupsSnap.forEach((d) => {
            const data = d.data();
            const members = (data.members || []).map((m) => (typeof m === "string" ? m : m?.uid || m?.id));
            if (members.includes(currentUid) || data.createdBy === currentUid || data.admin === currentUid) {
              addGroupToMap(d.id, data);
            }
          });
        } catch {}

        const loadedGroups = Array.from(groupsMap.values());

        if (isMounted) {
          setFriends(loadedFriends);
          setGroups(loadedGroups);
        }
      } catch (err) {
        console.error("Failed to load share destinations:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadDestinations();
    setSelectedDestinations([]);
    setPersonalNote("");
    setSearchTerm("");

    return () => {
      isMounted = false;
    };
  }, [open, currentUid]);

  const toggleSelect = (dest) => {
    setSelectedDestinations((prev) => {
      const exists = prev.some((d) => d.id === dest.id && d.type === dest.type);
      if (exists) {
        return prev.filter((d) => !(d.id === dest.id && d.type === dest.type));
      } else {
        return [...prev, dest];
      }
    });
  };

  const isSelected = (dest) => {
    return selectedDestinations.some((d) => d.id === dest.id && d.type === dest.type);
  };

  const handleSend = async () => {
    if (selectedDestinations.length === 0 || !currentUid || isSending) return;

    setIsSending(true);
    const nowIso = new Date().toISOString();
    const senderName = currentUser?.displayName || currentUser?.name || "Member";
    const senderPic = currentUser?.photoURL || "";

    // Determine message payload according to itemType
    let messageType = "trip_preview";
    let cardPayload = {};

    if (isForward) {
      // Handled separately in destination loop
    } else if (itemType === "trip") {
      messageType = "trip_preview";
      cardPayload = {
        type: "trip_preview",
        tripId: safeItemData.id || safeItemData.tripId || "",
        title: safeItemData.name || safeItemData.title || "Trip",
        destination: safeItemData.to || safeItemData.destination || safeItemData.location || safeItemData.name || "",
        startDate: safeItemData.startDate || "",
        endDate: safeItemData.endDate || "",
        budget: safeItemData.budget || 0,
        imageUrl: safeItemData.image || safeItemData.imageUrl || (Array.isArray(safeItemData.images) ? safeItemData.images[0] : ""),
        membersCount: Array.isArray(safeItemData.members) ? safeItemData.members.length : 1,
      };
    } else if (itemType === "place") {
      messageType = "place_preview";
      cardPayload = {
        type: "place_preview",
        placeId: safeItemData.id || safeItemData.placeId || "",
        title: safeItemData.name || safeItemData.title || "Place",
        location: safeItemData.location || safeItemData.city || safeItemData.state || "",
        rating: safeItemData.rating || 4.8,
        category: safeItemData.category || safeItemData.type || "Must Visit",
        description: safeItemData.description || safeItemData.about || "",
        imageUrl: safeItemData.image || safeItemData.imageUrl || safeItemData.photo || (Array.isArray(safeItemData.images) ? safeItemData.images[0] : ""),
        mapsUrl: safeItemData.mapsUrl || "",
      };
    } else if (itemType === "user") {
      messageType = "user_profile";
      cardPayload = {
        type: "user_profile",
        uid: safeItemData.uid || safeItemData.id || "",
        name: safeItemData.displayName || safeItemData.name || "User",
        username: safeItemData.username || "",
        photoURL: safeItemData.photoURL || safeItemData.image || "",
        bio: safeItemData.bio || safeItemData.about || "",
      };
    } else if (itemType === "note") {
      messageType = "note_preview";
      cardPayload = {
        type: "note_preview",
        noteId: safeItemData.id || safeItemData.noteId || "",
        title: safeItemData.title || "Trip Note",
        content: safeItemData.content || safeItemData.text || "",
        tripId: safeItemData.tripId || "",
        tripTitle: safeItemData.tripTitle || safeItemData.tripName || "",
        createdAt: safeItemData.createdAt || nowIso,
      };
    } else if (["budget", "expenses", "timeline", "checklist", "poll"].includes(itemType)) {
      messageType = itemType;
      cardPayload = safeItemData.cardData || safeItemData;
    }

    try {
      let sentCount = 0;
      for (const dest of selectedDestinations) {
        if (isForward) {
          // Forward each selected message item in order, restricting if forwarded >= 15 times
          const eligibleMsgs = msgsToForward.filter((m) => (m.forwardCount || 0) < 15);
          if (eligibleMsgs.length === 0) {
            setToast({
              open: true,
              message: "Selected message(s) have reached the maximum forward limit (15 times).",
              severity: "warning",
            });
            setIsSending(false);
            return;
          }

          for (const m of eligibleMsgs) {
            const fwdType = m.type || (m.imageUrl || m.dataUri ? "image" : "text");
            const newFwdCount = (m.forwardCount || 0) + 1;
            const fwdPayload = {
              senderId: currentUid,
              senderName,
              senderPic,
              type: fwdType,
              text: m.text || "",
              imageUrl: m.imageUrl || m.dataUri || null,
              dataUri: m.dataUri || m.imageUrl || null,
              images: Array.isArray(m.images) ? m.images : null,
              cardData: m.cardData || null,
              forwarded: true,
              forwardCount: newFwdCount,
              sourceType: safeItemData?.sourceType || m.sourceType || "direct",
              sourceId: safeItemData?.sourceId || m.sourceId || currentUid,
              sourceName: safeItemData?.sourceName || m.sourceName || m.forwardedFromName || senderName,
              sourceFriendUids: safeItemData?.sourceFriendUids || m.sourceFriendUids || [currentUid],
              sourceGroupMembers: safeItemData?.sourceGroupMembers || m.sourceGroupMembers || [],
              forwardedFromName: safeItemData?.sourceName || m.sourceName || m.forwardedFromName || senderName,
              timestamp: serverTimestamp(),
              createdAt: nowIso,
            };

            if (dest.type === "group") {
              await addDoc(collection(db, "groupChat", dest.id, "messages"), fwdPayload).catch(() => {});
              await addDoc(collection(db, "groupChats", dest.id, "messages"), fwdPayload).catch(() => {});
            } else if (dest.type === "direct") {
              await addDoc(collection(db, "chats", dest.id, "messages"), fwdPayload).catch(() => {});
            }
          }

          // If user added a personal note alongside forwarded messages, send that too
          if (personalNote.trim()) {
            const notePayload = {
              senderId: currentUid,
              senderName,
              senderPic,
              type: "text",
              text: personalNote.trim(),
              timestamp: serverTimestamp(),
              createdAt: nowIso,
            };
            if (dest.type === "group") {
              await addDoc(collection(db, "groupChat", dest.id, "messages"), notePayload).catch(() => {});
              await addDoc(collection(db, "groupChats", dest.id, "messages"), notePayload).catch(() => {});
            } else {
              await addDoc(collection(db, "chats", dest.id, "messages"), notePayload).catch(() => {});
            }
          }

          const lastMsg = personalNote.trim() || `Forwarded ${msgsToForward.length} message${msgsToForward.length > 1 ? "s" : ""}`;
          if (dest.type === "group") {
            const updatePayload = {
              lastMessage: lastMsg,
              lastMessageTimestamp: serverTimestamp(),
              lastSender: senderName,
              updatedAt: nowIso,
            };
            await updateDoc(doc(db, "groupChat", dest.id), updatePayload).catch(() => {});
            await updateDoc(doc(db, "groupChats", dest.id), updatePayload).catch(() => {});
          } else {
            await updateDoc(doc(db, "chats", dest.id), {
              lastMessage: lastMsg,
              lastMessageTimestamp: serverTimestamp(),
              updatedAt: nowIso,
            }).catch(() => {});
          }
          sentCount++;
        } else {
          // Standard card / preview share
          if (dest.type === "group") {
            const msgPayload = {
              senderId: currentUid,
              senderName,
              senderPic,
              type: messageType,
              cardData: cardPayload,
              text: personalNote.trim(),
              timestamp: serverTimestamp(),
              createdAt: nowIso,
            };

            await addDoc(collection(db, "groupChat", dest.id, "messages"), msgPayload).catch(() => {});
            await addDoc(collection(db, "groupChats", dest.id, "messages"), msgPayload).catch(() => {});

            const updatePayload = {
              lastMessage: personalNote.trim() || `Shared a ${itemType}`,
              lastMessageTimestamp: serverTimestamp(),
              lastSender: senderName,
              updatedAt: nowIso,
            };
            await updateDoc(doc(db, "groupChat", dest.id), updatePayload).catch(() => {});
            await updateDoc(doc(db, "groupChats", dest.id), updatePayload).catch(() => {});
            sentCount++;
          } else if (dest.type === "direct") {
            const directMessagesRef = collection(db, "chats", dest.id, "messages");
            await addDoc(directMessagesRef, {
              senderId: currentUid,
              senderName,
              type: messageType,
              cardData: cardPayload,
              text: personalNote.trim(),
              timestamp: serverTimestamp(),
              createdAt: nowIso,
            });

            await updateDoc(doc(db, "chats", dest.id), {
              lastMessage: personalNote.trim() || `Shared a ${itemType}`,
              lastMessageTimestamp: serverTimestamp(),
              updatedAt: nowIso,
            }).catch(() => {});
            sentCount++;
          }
        }
      }

      setToast({
        open: true,
        message: isForward
          ? `Successfully forwarded to ${sentCount} chat${sentCount > 1 ? "s" : ""}!`
          : `Successfully shared ${itemType} to ${sentCount} chat${sentCount > 1 ? "s" : ""}!`,
        severity: "success",
      });
      setTimeout(() => {
        onClose();
      }, 700);
    } catch (err) {
      console.error("Failed to share to chats:", err);
      setToast({
        open: true,
        message: "Failed to send to some chats. Please try again.",
        severity: "error",
      });
    } finally {
      setIsSending(false);
    }
  };

  // Filter destinations
  const allDestinations = [
    ...groups.map((g) => ({ ...g, sub: `${g.memberCount} members` })),
    ...friends.map((f) => ({ ...f, sub: f.username ? `@${f.username}` : "Friend" })),
  ];

  const displayedDestinations = allDestinations.filter((d) => {
    if (activeTab === 1 && d.type !== "group") return false;
    if (activeTab === 2 && d.type !== "direct") return false;
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return d.name?.toLowerCase().includes(q) || d.sub?.toLowerCase().includes(q);
  });

  const mode = isDark ? "dark" : "light";

  return (
    <>
      <SwipeableDrawer
        anchor="bottom"
        open={open}
        onClose={onClose}
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

        <Box sx={{ maxWidth: 500, mx: "auto", width: "100%", boxSizing: "border-box", pt: { xs: 1, md: 2 } }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              pb: 1,
              px: 1,
            }}
          >
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, fontSize: "1.05rem" }}>
                {isForward
                  ? `Forward ${msgsToForward.length > 1 ? `${msgsToForward.length} Messages` : "Message"}`
                  : `Share ${
                      itemType === "trip"
                        ? "Trip"
                        : itemType === "place"
                        ? "Place"
                        : itemType === "user"
                        ? "Profile"
                        : itemType === "note"
                        ? "Note"
                        : itemType.charAt(0).toUpperCase() + itemType.slice(1)
                    } to Chats`}
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.65 }}>
                Choose friends or group chats to share directly
              </Typography>
            </Box>
            <IconButton size="small" onClick={onClose} sx={{ color: "inherit", opacity: 0.7 }}>
              <CloseIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Box>

          <Box sx={{ px: 1, pt: 0.5, display: "flex", flexDirection: "column", gap: 1.5 }}>
          {isForward && msgsToForward.some((m) => (m.forwardCount || 0) >= 15) && (
            <Alert
              severity="warning"
              sx={{
                borderRadius: "14px",
                fontSize: "0.8rem",
                bgcolor: isDark ? "rgba(255, 152, 0, 0.15)" : "rgba(255, 152, 0, 0.1)",
                color: isDark ? "#ffa726" : "#e65100",
                "& .MuiAlert-icon": { color: isDark ? "#ffa726" : "#e65100" },
              }}
            >
              Messages forwarded 15+ times have reached the limit and cannot be forwarded again.
            </Alert>
          )}

          {/* Item Preview Card */}
          <Box
            sx={{
              p: 1.2,
              borderRadius: "14px",
              maxHeight: 120,
              overflowY: "auto",
              scrollbarWidth: "thin",
              "&::-webkit-scrollbar": { width: "4px" },
              "&::-webkit-scrollbar-thumb": {
                backgroundColor: isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.2)",
                borderRadius: "4px",
              },
              bgcolor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)",
              border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"}`,
              display: "flex",
              alignItems: "center",
              gap: 1.4,
            }}
          >
            {safeItemData.image || safeItemData.photoURL || safeItemData.imageUrl || (Array.isArray(safeItemData.images) && safeItemData.images[0]) ? (
              <Avatar
                src={safeImageUrl(safeItemData.image || safeItemData.photoURL || safeItemData.imageUrl || (Array.isArray(safeItemData.images) && safeItemData.images[0]))}
                variant="rounded"
                sx={{ width: 44, height: 44, borderRadius: "10px" }}
              />
            ) : (
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: "10px",
                  bgcolor: "rgba(0, 183, 255, 0.15)",
                  color: "#00b7ff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "1.3rem",
                }}
              >
                {isForward ? "↗️" : itemType === "trip" ? "✈️" : itemType === "place" ? "📍" : itemType === "user" ? "👤" : itemType === "note" ? "📝" : "📊"}
              </Box>
            )}
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }} noWrap>
                {isForward
                  ? `${msgsToForward.length} Message${msgsToForward.length > 1 ? "s" : ""} to Forward`
                  : safeItemData.name || safeItemData.title || safeItemData.displayName || "Item"}
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.65, display: "block" }} noWrap>
                {isForward
                  ? msgsToForward.map((m) => m.text || (m.imageUrl || m.dataUri ? "[Photo]" : `[${m.type || "Widget"}]`)).filter(Boolean).slice(0, 2).join(" • ") || "Selected messages"
                  : safeItemData.to || safeItemData.location || (safeItemData.username ? `@${safeItemData.username}` : safeItemData.content?.slice(0, 40)) || `Shared ${itemType}`}
              </Typography>
            </Box>
          </Box>

          {/* Optional message input */}
          <TextField
            size="small"
            placeholder="Add an optional message..."
            value={personalNote}
            onChange={(e) => setPersonalNote(e.target.value)}
            fullWidth
            InputProps={{
              sx: {
                borderRadius: "12px",
                bgcolor: isDark ? "rgba(255, 255, 255, 0.04)" : "rgba(0, 0, 0, 0.02)",
                fontSize: "0.85rem",
              },
            }}
          />

          {/* Destination Tabs (All, Groups, Friends) */}
          <Box sx={{ borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"}` }}>
            <Tabs
              value={activeTab}
              onChange={(_, v) => setActiveTab(v)}
              variant="fullWidth"
              sx={{
                minHeight: 36,
                "& .MuiTab-root": {
                  minHeight: 36,
                  textTransform: "none",
                  fontWeight: 600,
                  fontSize: "0.82rem",
                  color: isDark ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.6)",
                  "&.Mui-selected": { color: "#00b7ff" },
                },
              }}
            >
              <Tab label="All" />
              <Tab icon={<GroupIcon sx={{ fontSize: 16 }} />} iconPosition="start" label={`Groups (${groups.length})`} />
              <Tab icon={<PersonIcon sx={{ fontSize: 16 }} />} iconPosition="start" label={`Friends (${friends.length})`} />
            </Tabs>
          </Box>

          {/* Search box */}
          <TextField
            size="small"
            placeholder="Search chats or groups..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ fontSize: 18, opacity: 0.6 }} />
                </InputAdornment>
              ),
              sx: {
                borderRadius: "12px",
                bgcolor: isDark ? "rgba(255, 255, 255, 0.04)" : "rgba(0, 0, 0, 0.02)",
                fontSize: "0.82rem",
              },
            }}
          />

          {/* List of Destinations */}
          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
              <CircularProgress size={26} sx={{ color: "#00b7ff" }} />
            </Box>
          ) : displayedDestinations.length === 0 ? (
            <Box sx={{ p: 3, textAlign: "center", opacity: 0.6 }}>
              <Typography variant="caption">No chats found</Typography>
            </Box>
          ) : (
            <Box
              sx={{
                maxHeight: 220,
                overflowY: "auto",
                display: "flex",
                flexDirection: "column",
                gap: 0.6,
                pr: 0.5,
              }}
            >
              {displayedDestinations.map((dest) => {
                const checked = isSelected(dest);
                return (
                  <Box
                    key={`${dest.type}_${dest.id}`}
                    onClick={() => toggleSelect(dest)}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      p: 0.9,
                      px: 1.2,
                      borderRadius: "12px",
                      bgcolor: checked
                        ? isDark
                          ? "rgba(0, 183, 255, 0.16)"
                          : "rgba(2, 136, 209, 0.1)"
                        : isDark
                        ? "rgba(255, 255, 255, 0.03)"
                        : "rgba(0, 0, 0, 0.02)",
                      border: `1px solid ${
                        checked ? "#00b7ff" : isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)"
                      }`,
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                      "&:hover": {
                        bgcolor: isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.05)",
                      },
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.2, minWidth: 0, flex: 1 }}>
                      <Avatar
                        src={safeImageUrl(dest.photoURL)}
                        sx={{
                          width: 36,
                          height: 36,
                          borderRadius: dest.type === "group" ? "10px" : "50%",
                          bgcolor: dest.type === "group" ? "#9c27b0" : "#0288d1",
                        }}
                      >
                        {dest.name?.[0] || "?"}
                      </Avatar>
                      <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 700 }} noWrap>
                          {dest.name}
                        </Typography>
                        <Typography variant="caption" sx={{ opacity: 0.6, display: "block" }} noWrap>
                          {dest.sub}
                        </Typography>
                      </Box>
                    </Box>

                    <Checkbox
                      checked={checked}
                      icon={<RadioButtonUncheckedIcon sx={{ fontSize: 20, opacity: 0.4 }} />}
                      checkedIcon={<CheckCircleIcon sx={{ fontSize: 20, color: "#00b7ff" }} />}
                      sx={{ p: 0.5 }}
                    />
                  </Box>
                );
              })}
            </Box>
          )}
          </Box>

          <Box sx={{ px: 1, pb: 1, pt: 1.5, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Typography variant="caption" sx={{ opacity: 0.7, fontWeight: 600 }}>
              {selectedDestinations.length} selected
            </Typography>

            <Box sx={{ display: "flex", gap: 1 }}>
              <Button onClick={onClose} sx={{ textTransform: "none", color: "inherit", opacity: 0.7 }}>
                Cancel
              </Button>
              <Button
                variant="contained"
                onClick={handleSend}
                disabled={
                  selectedDestinations.length === 0 ||
                  isSending ||
                  (isForward && msgsToForward.length > 0 && msgsToForward.every((m) => (m.forwardCount || 0) >= 15))
                }
                startIcon={isSending ? <CircularProgress size={16} sx={{ color: "#fff" }} /> : <SendIcon sx={{ fontSize: 16 }} />}
                sx={{
                  bgcolor: "#00b7ff",
                  color: "#fff",
                  fontWeight: 700,
                  textTransform: "none",
                  borderRadius: "12px",
                  px: 2,
                  "&:hover": { bgcolor: "#009bd9" },
                }}
              >
                Share Now
              </Button>
            </Box>
          </Box>
        </Box>
      </SwipeableDrawer>

      <Snackbar
        open={toast.open}
        autoHideDuration={3000}
        onClose={() => setToast((prev) => ({ ...prev, open: false }))}
      >
        <Alert severity={toast.severity} sx={{ borderRadius: "12px" }}>
          {toast.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default React.memo(UniversalShareToChatDialog);
