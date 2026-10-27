import React, { useState, useCallback, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Box, Popover, Button, IconButton, Chip, useMediaQuery, useTheme } from "@mui/material";
import ShortcutRoundedIcon from "@mui/icons-material/ShortcutRounded";
import ShareRoundedIcon from "@mui/icons-material/ShareRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import EmojiPicker from "emoji-picker-react";
import { useThemeToggle } from "../../contexts/ThemeToggleContext";
import { useDesktopPanel } from "../../contexts/DesktopPanelContext";
import { useGroupChatSync } from "./useGroupChatSync";
import { setActiveChat, clearActiveChat } from "../../utils/chatFeaturesService";
import GroupChatHeader from "./GroupChatHeader";
import GroupMessageList from "./GroupMessageList";
import GroupChatInput from "./GroupChatInput";
import GroupMessageActionsMenu from "./GroupMessageActionsMenu";
import GroupMessageReactionsDrawer from "./GroupMessageReactionsDrawer";
import GroupPollDialog from "./GroupPollDialog";
import GroupInfoDrawer from "./GroupInfoDrawer";
import ImageUploadCropperModal from "../chats_components/ImageUploadCropperModal";
import MediaViewerModal from "../chats_components/MediaViewerModal";
import PinnedMessageBanner from "../chats_components/PinnedMessageBanner";
import PinDurationDialog from "../chats_components/PinDurationDialog";
import SearchInChatDrawer from "../chats_components/SearchInChatDrawer";
import ShareContactDialog from "../chats_components/ShareContactDialog";
import GroupChecklistDialog from "./GroupChecklistDialog";
import MessageInfoDialog from "../chats_components/MessageInfoDialog";
import UniversalShareToChatDialog from "../chats_components/UniversalShareToChatDialog";
import ExternalShareDialog from "../chats_components/ExternalShareDialog";
import ProgressiveBlur from "../ProgressiveBlur";
import {
  doc,
  updateDoc,
  setDoc,
  query,
  collection,
  where,
  getDocs,
  serverTimestamp,
  arrayUnion,
} from "firebase/firestore";
import { db } from "../../firebase";

function GroupChat({
  groupNameProp,
  isEmbedded = false,
  onOpenGroupInfo: externalOpenGroupInfo,
}) {
  const { groupName: paramGroupName } = useParams();
  const groupName = groupNameProp || paramGroupName;
  const navigate = useNavigate();
  const muiTheme = useTheme();
  const isDesktop = useMediaQuery(muiTheme.breakpoints.up("md"));
  const { openPanel, activePanel } = useDesktopPanel();
  const { mode } = useThemeToggle();
  const effectiveChatTheme = mode === "dark" ? "dark" : "light";
  const isDark = effectiveChatTheme === "dark";

  // State managed through optimized real-time sync hook
  const {
    currentUser,
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
    pinnedMessage,
    pinnedMessages,
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
    typingMembers,
    setDraftStatus,
  } = useGroupChatSync(groupName);

  // Local UI State
  const [input, setInput] = useState("");
  const [editingMsg, setEditingMsg] = useState(null);
  const [replyTo, setReplyTo] = useState(null);

  // Modals & Drawers
  const [profileOpen, setProfileOpen] = useState(false);
  const [groupSettingsOpen, setGroupSettingsOpen] = useState(false);
  const [membersDrawerOpen, setMembersDrawerOpen] = useState(false);
  const [inviteDrawerOpen, setInviteDrawerOpen] = useState(false);
  const [addUserDialogOpen, setAddUserDialogOpen] = useState(false);
  const [pollDialogOpen, setPollDialogOpen] = useState(false);
  const [imageCropperOpen, setImageCropperOpen] = useState(false);
  const [pendingImageDataUri, setPendingImageDataUri] = useState("");
  const [mediaViewerOpen, setMediaViewerOpen] = useState(false);
  const [viewingImageUrl, setViewingImageUrl] = useState("");
  const [activeMediaList, setActiveMediaList] = useState([]);
  const [shareContactOpen, setShareContactOpen] = useState(false);

  // Context menu & reaction drawer state
  const [actionsAnchorEl, setActionsAnchorEl] = useState(null);
  const [selectedMsg, setSelectedMsg] = useState(null);
  const [reactionsDrawerOpen, setReactionsDrawerOpen] = useState(false);
  const [activeReactionMsg, setActiveReactionMsg] = useState(null);
  const [infoDialogOpen, setInfoDialogOpen] = useState(false);
  const [infoDialogMsg, setInfoDialogMsg] = useState(null);

  // Standalone Emoji Picker Popover
  const [emojiPickerAnchorEl, setEmojiPickerAnchorEl] = useState(null);
  const [emojiPickerMsg, setEmojiPickerMsg] = useState(null);

  // Extract all media images for gallery forward/backward navigation
  const allGroupImages = React.useMemo(() => {
    const list = [];
    messages.forEach((m) => {
      if (m.dataUri) list.push(m.dataUri);
      if (m.imageUrl) list.push(m.imageUrl);
      if (Array.isArray(m.images)) list.push(...m.images);
    });
    return Array.from(new Set(list.filter(Boolean)));
  }, [messages]);

  const [searchDrawerOpen, setSearchDrawerOpen] = useState(false);

  // Smooth scroll & glow on message
  const handleScrollToMessage = useCallback((msgId) => {
    const el = document.getElementById(`msg-${msgId}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.style.transition = "background-color 0.4s ease, transform 0.2s ease";
      el.style.backgroundColor = "rgba(0, 183, 255, 0.25)";
      el.style.transform = "scale(1.02)";
      setTimeout(() => {
        el.style.backgroundColor = "transparent";
        el.style.transform = "scale(1)";
      }, 1800);
    }
  }, []);

  const handleOpenImage = useCallback(
    (url, customList = null, options = {}) => {
      setViewingImageUrl(url);
      setActiveMediaList(customList || allGroupImages);
      setMediaViewerOpen(true);

      if (options?.isViewOnce && options?.msgId && groupName && currentUser?.uid) {
        updateDoc(doc(db, "groupChat", groupName, "messages", options.msgId), {
          viewedByOnce: arrayUnion(currentUser.uid),
          openedAt: Date.now(),
        }).catch(() => {});
      }
    },
    [allGroupImages, groupName, currentUser?.uid]
  );

  // Handlers
  const handleBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  // Automatically mark group as read on mount and as messages arrive
  useEffect(() => {
    if (!currentUser?.uid || !groupName) return;

    const markReadInDb = async () => {
      try {
        const nowIso = new Date().toISOString();
        const msgsToMark = messages.slice(-30).filter(
          (m) =>
            m.senderId !== currentUser.uid &&
            (!m.readBy || !m.readBy.includes(currentUser.uid) || !m.readByMap?.[currentUser.uid])
        );
        for (const m of msgsToMark) {
          if (m.id) {
            const payload = {
              read: true,
              readBy: arrayUnion(currentUser.uid),
              [`readByMap.${currentUser.uid}`]: nowIso,
            };
            updateDoc(doc(db, "groupChat", groupName, "messages", m.id), payload).catch(() => {});
            updateDoc(doc(db, "groupChats", groupName, "messages", m.id), payload).catch(() => {});
          }
        }

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

        window.dispatchEvent(new CustomEvent("bm_unread_chats_changed"));
        window.dispatchEvent(
          new CustomEvent("bm_last_message_updated", {
            detail: { chatId: groupName, unreadCount: 0, isGroup: true },
          })
        );
      } catch {}
    };

    markReadInDb();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupName, currentUser?.uid, messages.length]);

  // Auto-open group info drawer if URL has ?info or ?profile
  useEffect(() => {
    try {
      const searchParams = new URLSearchParams(window.location.search);
      if (searchParams.has("info") || searchParams.has("profile")) {
        if (isDesktop) {
          if (externalOpenGroupInfo) {
            externalOpenGroupInfo({
              id: groupName,
              groupName,
              ...groupInfo,
              onOpenSearch: () => setSearchDrawerOpen(true),
            });
          } else {
            openPanel("groupInfo", {
              id: groupName,
              groupName,
              ...groupInfo,
              onOpenSearch: () => setSearchDrawerOpen(true),
            });
          }
        } else {
          setProfileOpen(true);
        }
      }
    } catch {
      // ignore
    }
  }, [isDesktop, externalOpenGroupInfo, openPanel, groupName, groupInfo]);

  const handleOpenGroupInfo = useCallback(() => {
    if (isDesktop) {
      if (externalOpenGroupInfo) {
        externalOpenGroupInfo({
          id: groupName,
          groupName,
          ...groupInfo,
          messages,
          onOpenImage: handleOpenImage,
          onJumpToMessage: handleScrollToMessage,
          onOpenSearch: () => setSearchDrawerOpen(true),
        });
      } else {
        openPanel("groupInfo", {
          id: groupName,
          groupName,
          ...groupInfo,
          messages,
          onOpenImage: handleOpenImage,
          onJumpToMessage: handleScrollToMessage,
          onOpenSearch: () => setSearchDrawerOpen(true),
        });
      }
    } else {
      setProfileOpen(true);
    }
  }, [
    isDesktop,
    externalOpenGroupInfo,
    openPanel,
    groupName,
    groupInfo,
    messages,
    handleOpenImage,
    handleScrollToMessage,
  ]);

  // Synchronize desktop panel ONLY when switching group chats while panel is open
  const prevPanelGroupNameRef = React.useRef(groupName);
  useEffect(() => {
    if (activePanel === "groupInfo" && groupName && isDesktop) {
      if (prevPanelGroupNameRef.current !== groupName) {
        prevPanelGroupNameRef.current = groupName;
        const panelPayload = {
          id: groupName,
          groupName,
          ...groupInfo,
          messages,
          onOpenImage: handleOpenImage,
          onJumpToMessage: handleScrollToMessage,
          onOpenSearch: () => setSearchDrawerOpen(true),
        };
        if (externalOpenGroupInfo) {
          externalOpenGroupInfo(panelPayload);
        } else {
          openPanel("groupInfo", panelPayload);
        }
      }
    } else {
      prevPanelGroupNameRef.current = groupName;
    }
  }, [
    groupName,
    activePanel,
    isDesktop,
    groupInfo,
    messages,
    handleOpenImage,
    handleScrollToMessage,
    openPanel,
    externalOpenGroupInfo,
  ]);

  const handleSendMessage = useCallback(
    (customText) => {
      const textToSend = typeof customText === "string" ? customText : input;
      if (!textToSend || !textToSend.trim()) return;

      if (editingMsg) {
        editMessage(editingMsg.id, textToSend);
        setEditingMsg(null);
        setInput("");
        return;
      }

      sendMessage({
        text: textToSend,
        replyTo,
      });
      setInput("");
      setReplyTo(null);
    },
    [editingMsg, editMessage, input, sendMessage, replyTo]
  );

  const handleImageFileSelect = useCallback(
    (e) => {
      const files = Array.from(e.target.files || []);
      if (files.length === 0) return;

      if (files.length === 1) {
        const reader = new FileReader();
        reader.onload = () => {
          setPendingImageDataUri(reader.result);
          setImageCropperOpen(true);
        };
        reader.readAsDataURL(files[0]);
      } else {
        // Multiple images: send as stacked group
        Promise.all(
          files.map(
            (file) =>
              new Promise((resolve) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result);
                reader.readAsDataURL(file);
              })
          )
        ).then((dataUrls) => {
          sendMessage({
            type: "image_group",
            images: dataUrls,
            replyTo,
          });
          setReplyTo(null);
        });
      }
      e.target.value = "";
    },
    [replyTo, sendMessage]
  );

  const handleSendCroppedImage = useCallback(
    (croppedUri, caption, options = {}) => {
      sendMessage({
        text: caption || "",
        imageUrl: croppedUri,
        replyTo,
        viewOnce: Boolean(options.viewOnce),
      });
      setReplyTo(null);
    },
    [sendMessage, replyTo]
  );

  const handleSendTimeline = useCallback(() => {
    if (!timeline || timeline.length === 0) return;
    sendMessage({
      type: "timeline",
      cardData: {
        title: `${tripInfo?.name || "Trip"} Timeline`,
        items: timeline,
      },
    });
  }, [timeline, tripInfo, sendMessage]);

  const [pinDialogOpen, setPinDialogOpen] = useState(false);
  const [msgToPin, setMsgToPin] = useState(null);
  const [checklistDialogOpen, setChecklistDialogOpen] = useState(false);

  const handleSendChecklist = useCallback(() => {
    setChecklistDialogOpen(true);
  }, []);

  const handleConfirmSendChecklist = useCallback(
    (checklistData) => {
      sendMessage({
        type: "checklist",
        cardData: checklistData,
      });
    },
    [sendMessage]
  );

  const handleCreatePoll = useCallback(
    (pollData) => {
      sendMessage({
        type: "poll",
        cardData: pollData,
      });
    },
    [sendMessage]
  );

  const handleContextMenu = useCallback((e, msg, targetEl) => {
    setSelectedMsg(msg);
    setActionsAnchorEl(targetEl || e.currentTarget);
  }, []);

  // Multi-select & Forwarding / Sharing States
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedMsgIds, setSelectedMsgIds] = useState([]);
  const [shareToChatOpen, setShareToChatOpen] = useState(false);
  const [shareToChatType, setShareToChatType] = useState("forward");
  const [shareToChatData, setShareToChatData] = useState(null);
  const [externalShareOpen, setExternalShareOpen] = useState(false);
  const [externalShareItems, setExternalShareItems] = useState([]);

  const handleToggleSelectMsg = useCallback((msgId) => {
    setSelectedMsgIds((prev) =>
      prev.includes(msgId) ? prev.filter((id) => id !== msgId) : [...prev, msgId]
    );
  }, []);

  const handleSelectAllMsgs = useCallback(() => {
    if (selectedMsgIds.length === messages.length) {
      setSelectedMsgIds([]);
    } else {
      setSelectedMsgIds(messages.map((m) => m.id));
    }
  }, [messages, selectedMsgIds.length]);

  const handleEnterSelectionMode = useCallback((msg) => {
    setIsSelectionMode(true);
    setSelectedMsgIds(msg?.id ? [msg.id] : []);
  }, []);

  const handleExitSelectionMode = useCallback(() => {
    setIsSelectionMode(false);
    setSelectedMsgIds([]);
  }, []);

  const handleForwardMessage = useCallback((msg) => {
    setShareToChatType("forward");
    setShareToChatData({
      messages: [msg],
      sourceType: "group",
      sourceId: groupName,
      sourceName: groupInfo?.name || groupName,
      sourceGroupMembers: Array.isArray(groupInfo?.members) ? groupInfo.members : [],
    });
    setShareToChatOpen(true);
  }, [groupName, groupInfo]);

  const handleShareExternalMessage = useCallback((msg) => {
    setExternalShareItems([msg]);
    setExternalShareOpen(true);
  }, []);

  // Active group chat notification suppression & mark as read
  useEffect(() => {
    if (groupName) {
      setActiveChat({
        type: "group",
        groupName,
        id: groupName,
      });
      window.dispatchEvent(new CustomEvent("bm_unread_chats_changed"));
    }
    return () => {
      clearActiveChat();
    };
  }, [groupName]);

  const handleBatchDelete = useCallback(() => {
    if (selectedMsgIds.length === 0) return;
    if (window.confirm(`Delete ${selectedMsgIds.length} selected message${selectedMsgIds.length > 1 ? "s" : ""}?`)) {
      selectedMsgIds.forEach((id) => {
        deleteMessage(id);
      });
      setIsSelectionMode(false);
      setSelectedMsgIds([]);
    }
  }, [selectedMsgIds, deleteMessage]);

  const handleBatchForward = useCallback(() => {
    const selectedMsgs = messages.filter((m) => selectedMsgIds.includes(m.id));
    if (selectedMsgs.length === 0) return;
    setShareToChatType("forward");
    setShareToChatData({
      messages: selectedMsgs,
      sourceType: "group",
      sourceId: groupName,
      sourceName: groupInfo?.name || groupName,
      sourceGroupMembers: Array.isArray(groupInfo?.members) ? groupInfo.members : [],
    });
    setShareToChatOpen(true);
  }, [messages, selectedMsgIds, groupName, groupInfo]);

  const handleBatchExternalShare = useCallback(() => {
    const selectedMsgs = messages.filter((m) => selectedMsgIds.includes(m.id));
    if (selectedMsgs.length === 0) return;
    setExternalShareItems(selectedMsgs);
    setExternalShareOpen(true);
  }, [messages, selectedMsgIds]);

  const handleShareCard = useCallback((type, cardData) => {
    setShareToChatType(type);
    setShareToChatData(cardData);
    setShareToChatOpen(true);
  }, []);

  const handleReply = useCallback((msg) => {
    setReplyTo(msg);
  }, []);

  const handleEdit = useCallback((msg) => {
    setEditingMsg(msg);
    setInput(msg.text || "");
  }, []);

  const handleOpenReactions = useCallback((msg) => {
    setActiveReactionMsg(msg);
    setReactionsDrawerOpen(true);
  }, []);

  return (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        position: "relative",
        bgcolor: 'transparent',
      }}
    >
      {/* 1. Header */}
      <GroupChatHeader
        groupInfo={groupInfo}
        groupName={groupName}
        typingMembers={typingMembers}
        onBack={handleBack}
        onOpenGroupInfo={handleOpenGroupInfo}
        isEmbedded={isEmbedded}
        effectiveChatTheme={effectiveChatTheme}
      />

      {/* Pinned Message Banner */}
      <PinnedMessageBanner
        pinnedMessage={pinnedMessage}
        pinnedMessages={pinnedMessages}
        onScrollToMessage={handleScrollToMessage}
        onViewPinned={handleScrollToMessage}
        onUnpin={(m) => handlePinMessage({ id: m?.id || pinnedMessage?.id })}
        isDark={isDark}
      />

      {/* 2. Message List with real-time sync, structured messages & smooth scrolling */}
      <GroupMessageList
        messages={messages}
        loadingMessages={loadingMessages}
        currentUser={currentUser}
        memberInfo={memberInfo}
        groupInfo={groupInfo}
        timeline={timeline}
        typingMembers={typingMembers}
        effectiveChatTheme={effectiveChatTheme}
        onReply={handleReply}
        onImageClick={handleOpenImage}
        onOpenReactions={handleOpenReactions}
        onReaction={handleReaction}
        onContextMenu={handleContextMenu}
        onVotePoll={handleVotePoll}
        onToggleChecklist={handleToggleChecklistItem}
        isSelectionMode={isSelectionMode}
        selectedMsgIds={selectedMsgIds}
        onToggleSelectMsg={handleToggleSelectMsg}
        onShareCard={handleShareCard}
      />

      {/* 3. Input bar OR Floating Multi-Select Action Bar */}
      {isSelectionMode ? (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            p: { xs: 1.2, sm: 1.5 },
            position: "relative",
            overflow: "hidden",
            borderTop: `1px solid ${
              isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.1)"
            }`,
            boxShadow: "0 -4px 20px rgba(0,0,0,0.2)",
            zIndex: 10,
          }}
        >
          <ProgressiveBlur
            mode={isDark ? "dark" : "light"}
            direction="top"
            height="100%"
            blur="28px"
          />
          <Box sx={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center", gap: 1 }}>
            <IconButton
              size="small"
              onClick={handleExitSelectionMode}
              sx={{ color: isDark ? "#fff" : "#111" }}
            >
              <CloseRoundedIcon />
            </IconButton>
            <Chip
              label={`${selectedMsgIds.length} Selected`}
              size="small"
              sx={{
                fontWeight: 700,
                bgcolor: isDark ? "rgba(0, 183, 255, 0.2)" : "rgba(2, 136, 209, 0.15)",
                color: "#00b7ff",
              }}
            />
            <Button
              size="small"
              onClick={handleSelectAllMsgs}
              sx={{
                textTransform: "none",
                fontSize: "0.78rem",
                color: isDark ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.6)",
              }}
            >
              {selectedMsgIds.length === messages.length ? "Deselect All" : "Select All"}
            </Button>
          </Box>

          <Box sx={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center", gap: 1 }}>
            <Button
              variant="outlined"
              size="small"
              disabled={selectedMsgIds.length === 0}
              startIcon={<DeleteOutlineRoundedIcon sx={{ fontSize: 16 }} />}
              onClick={handleBatchDelete}
              sx={{
                borderRadius: "12px",
                textTransform: "none",
                fontSize: "0.82rem",
                fontWeight: 600,
                borderColor: "rgba(255, 82, 82, 0.4)",
                color: "#ff5252",
                "&:hover": { borderColor: "#ff5252", bgcolor: "rgba(255, 82, 82, 0.08)" },
              }}
            >
              Delete
            </Button>

            <Button
              variant="outlined"
              size="small"
              disabled={selectedMsgIds.length === 0}
              startIcon={<ShareRoundedIcon sx={{ fontSize: 16 }} />}
              onClick={handleBatchExternalShare}
              sx={{
                borderRadius: "12px",
                textTransform: "none",
                fontSize: "0.82rem",
                fontWeight: 600,
                borderColor: isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.2)",
                color: isDark ? "#fff" : "#111",
                "&:hover": { borderColor: "#00b7ff" },
              }}
            >
              Share to Apps
            </Button>

            <Button
              variant="contained"
              size="small"
              disabled={selectedMsgIds.length === 0}
              startIcon={<ShortcutRoundedIcon sx={{ fontSize: 16 }} />}
              onClick={handleBatchForward}
              sx={{
                borderRadius: "12px",
                textTransform: "none",
                fontSize: "0.82rem",
                fontWeight: 700,
                bgcolor: "#00b7ff",
                color: "#fff",
                "&:hover": { bgcolor: "#0091ea" },
              }}
            >
              Forward
            </Button>
          </Box>
        </Box>
      ) : (
        <Box
          sx={{
            position: "relative",
            width: "100%",
            zIndex: 10,
          }}
        >
          <GroupChatInput
            input={input}
            setInput={setInput}
            isSending={isSending}
            onSendMessage={handleSendMessage}
            onTyping={setDraftStatus}
            onImageSelect={handleImageFileSelect}
            replyTo={replyTo}
            onCancelReply={() => setReplyTo(null)}
            editingMsg={editingMsg}
            onCancelEdit={() => {
              setEditingMsg(null);
              setInput("");
            }}
            groupInfo={groupInfo}
            currentUser={currentUser}
            memberInfo={memberInfo}
            hasTrip={Boolean(groupInfo?.tripId)}
            onSendTimeline={handleSendTimeline}
            onSendChecklist={handleSendChecklist}
            onSendBudget={handleSendBudget}
            onSendExpenses={handleSendExpenses}
            onOpenShareContact={() => setShareContactOpen(true)}
            onOpenCreatePoll={() => setPollDialogOpen(true)}
            isEmbedded={isEmbedded}
            effectiveChatTheme={effectiveChatTheme}
          />
        </Box>
      )}

      {/* 4. Context Menu */}
      <GroupMessageActionsMenu
        anchorEl={actionsAnchorEl}
        onClose={() => setActionsAnchorEl(null)}
        selectedMsg={selectedMsg}
        currentUser={currentUser}
        groupInfo={groupInfo}
        memberInfo={memberInfo}
        onReaction={handleReaction}
        onReply={handleReply}
        onEdit={handleEdit}
        onDelete={deleteMessage}
        onForward={handleForwardMessage}
        onShareExternal={handleShareExternalMessage}
        onEnterSelectionMode={handleEnterSelectionMode}
        onPinMessage={(msg) => {
          const isCurrentlyPinned =
            (pinnedMessages || []).some((p) => p.id === msg?.id) ||
            pinnedMessage?.id === msg?.id;
          if (isCurrentlyPinned) {
            handlePinMessage(msg);
          } else {
            setMsgToPin(msg);
            setPinDialogOpen(true);
          }
        }}
        isPinned={
          (pinnedMessages || []).some((p) => p.id === selectedMsg?.id) ||
          pinnedMessage?.id === selectedMsg?.id
        }
        effectiveChatTheme={effectiveChatTheme}
        onOpenEmojiPicker={(msg) => {
          setEmojiPickerMsg(msg);
          setEmojiPickerAnchorEl(actionsAnchorEl);
        }}
        onInfo={(msg) => {
          setInfoDialogMsg(msg);
          setInfoDialogOpen(true);
        }}
      />

      {/* 4.1 Message Info Dialog */}
      <MessageInfoDialog
        open={infoDialogOpen}
        onClose={() => setInfoDialogOpen(false)}
        message={infoDialogMsg}
        currentUser={currentUser}
        isGroup={true}
        groupInfo={groupInfo}
        memberInfo={memberInfo}
        effectiveChatTheme={effectiveChatTheme}
      />

      {/* 5. Reactions Breakdown Drawer */}
      <GroupMessageReactionsDrawer
        open={reactionsDrawerOpen}
        onClose={() => setReactionsDrawerOpen(false)}
        reactionMsg={activeReactionMsg}
        currentUser={currentUser}
        memberInfo={memberInfo}
        onReaction={handleReaction}
        onRemoveReaction={handleReaction}
        effectiveChatTheme={effectiveChatTheme}
      />

      {/* 6. Poll Creation Dialog */}
      <GroupPollDialog
        open={pollDialogOpen}
        onClose={() => setPollDialogOpen(false)}
        onCreatePoll={handleCreatePoll}
        effectiveChatTheme={effectiveChatTheme}
      />

      {/* Checklist Creation & Privacy Dialog */}
      <GroupChecklistDialog
        open={checklistDialogOpen}
        onClose={() => setChecklistDialogOpen(false)}
        tripChecklist={checklist}
        tripName={tripInfo?.name || "Trip"}
        onSendChecklist={handleConfirmSendChecklist}
        effectiveChatTheme={effectiveChatTheme}
      />

      {/* Pin Duration Selection Dialog */}
      <PinDurationDialog
        open={pinDialogOpen}
        onClose={() => setPinDialogOpen(false)}
        messageText={msgToPin?.text || "Card / Media message"}
        isDark={isDark}
        onConfirmPin={({ durationMs }) => {
          const hours = durationMs ? durationMs / (1000 * 60 * 60) : null;
          handlePinMessage(msgToPin, hours);
          setMsgToPin(null);
        }}
      />

      {/* 7. Image Cropper Modal */}
      <ImageUploadCropperModal
        open={imageCropperOpen}
        onClose={() => setImageCropperOpen(false)}
        imageDataUri={pendingImageDataUri}
        onSend={handleSendCroppedImage}
        effectiveChatTheme={effectiveChatTheme}
      />

      {/* 8. Fullscreen Media Viewer with Forward/Backward and Thumbnails */}
      <MediaViewerModal
        open={mediaViewerOpen}
        onClose={() => setMediaViewerOpen(false)}
        imageUrl={viewingImageUrl}
        images={activeMediaList.length > 0 ? activeMediaList : allGroupImages}
      />

      {/* 9. Standalone Emoji Picker Popover */}
      <Popover
        open={Boolean(emojiPickerAnchorEl)}
        anchorEl={emojiPickerAnchorEl}
        onClose={() => setEmojiPickerAnchorEl(null)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
        transformOrigin={{ vertical: "bottom", horizontal: "center" }}
        PaperProps={{
          sx: {
            borderRadius: "20px",
            overflow: "hidden",
            boxShadow: "0 12px 32px rgba(0,0,0,0.4)",
            bgcolor: isDark ? "#181818" : "#fff",
          },
        }}
      >
        <EmojiPicker
          theme={isDark ? "dark" : "light"}
          onEmojiClick={(data) => {
            if (emojiPickerMsg) {
              handleReaction(data.emoji, emojiPickerMsg);
            }
            setEmojiPickerAnchorEl(null);
          }}
        />
      </Popover>

      {/* 10. Complete Group Info Drawer - Only on mobile devices */}
      {!isDesktop && (
        <GroupInfoDrawer
          profileOpen={profileOpen}
          setProfileOpen={setProfileOpen}
          groupInfo={groupInfo}
          groupName={groupName}
          createdByUser={createdByUser}
          tripInfo={tripInfo}
          timelineStats={timelineStats}
          memberInfo={memberInfo}
          currentUser={currentUser}
          user={currentUser}
          messages={messages}
          onOpenImage={handleOpenImage}
          onJumpToMessage={handleScrollToMessage}
          onOpenSearch={() => setSearchDrawerOpen(true)}
          setGroupSettingsOpen={setGroupSettingsOpen}
          groupSettingsOpen={groupSettingsOpen}
          membersDrawerOpen={membersDrawerOpen}
          setMembersDrawerOpen={setMembersDrawerOpen}
          inviteDrawerOpen={inviteDrawerOpen}
          setInviteDrawerOpen={setInviteDrawerOpen}
          addUserDialogOpen={addUserDialogOpen}
          setAddUserDialogOpen={setAddUserDialogOpen}
          navigate={navigate}
        />
      )}

      {/* 11. Search in Chat Drawer */}
      <SearchInChatDrawer
        open={searchDrawerOpen}
        onClose={() => setSearchDrawerOpen(false)}
        messages={messages}
        memberInfo={memberInfo}
        onSelectMessage={handleScrollToMessage}
        isDark={isDark}
      />

      {/* 12. Share Contact / Profile Dialog */}
      <ShareContactDialog
        open={shareContactOpen}
        onClose={() => setShareContactOpen(false)}
        currentUser={currentUser}
        onSelectContact={handleSendUserProfile}
        isDark={isDark}
      />

      {/* 13. Universal Share to Chat / Group Dialog */}
      <UniversalShareToChatDialog
        open={shareToChatOpen}
        onClose={() => setShareToChatOpen(false)}
        currentUser={currentUser}
        itemType={shareToChatType}
        itemData={shareToChatData}
        effectiveChatTheme={effectiveChatTheme}
      />

      {/* 14. External Share Dialog with dynamic Canvas preview card generator */}
      <ExternalShareDialog
        open={externalShareOpen}
        onClose={() => setExternalShareOpen(false)}
        items={externalShareItems}
        currentUser={currentUser}
        effectiveChatTheme={effectiveChatTheme}
      />
    </Box>
  );
}

export { GroupChat };
export default GroupChat;
