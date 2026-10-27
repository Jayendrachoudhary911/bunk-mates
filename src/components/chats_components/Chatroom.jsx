import React, { useState, useCallback, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Box, Popover, Button, IconButton, Chip, useMediaQuery, useTheme } from "@mui/material";
import ShortcutRoundedIcon from "@mui/icons-material/ShortcutRounded";
import ShareRoundedIcon from "@mui/icons-material/ShareRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import EmojiPicker from "emoji-picker-react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../../firebase";
import { useThemeToggle } from "../../contexts/ThemeToggleContext";
import { useDesktopPanel } from "../../contexts/DesktopPanelContext";
import { useChatSync } from "./useChatSync";
import { setActiveChat, clearActiveChat } from "../../utils/chatFeaturesService";
import ChatHeader from "./ChatHeader";
import MessageList from "./MessageList";
import ChatInput from "./ChatInput";
import MessageActionsMenu from "./MessageActionsMenu";
import MessageReactionsDrawer from "./MessageReactionsDrawer";
import ProfileDrawer from "./ProfileDrawer";
import MutualFriendsDrawer from "./MutualFriendsDrawer";
import CommonGroupsDrawer from "./CommonGroupsDrawer";
import CommonTripsDrawer from "./CommonTripsDrawer";
import AddNicknameDrawer from "./AddNicknameDrawer";
import ImageUploadCropperModal from "./ImageUploadCropperModal";
import MediaViewerModal from "./MediaViewerModal";
import PinnedMessageBanner from "./PinnedMessageBanner";
import PinDurationDialog from "./PinDurationDialog";
import SearchInChatDrawer from "./SearchInChatDrawer";
import SelectTripDialog from "./SelectTripDialog";
import ShareContactDialog from "./ShareContactDialog";
import MessageInfoDialog from "./MessageInfoDialog";
import UniversalShareToChatDialog from "./UniversalShareToChatDialog";
import ExternalShareDialog from "./ExternalShareDialog";

function Chatroom({
  friendIdProp,
  isEmbedded = false,
  onOpenProfile: externalOpenProfile,
}) {
  const { friendId: paramFriendId } = useParams();
  const friendId = friendIdProp || paramFriendId;
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
    chatId,
    messages,
    friendDetails,
    nickname,
    isBlocked,
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
  } = useChatSync(friendId);

  // Local UI State
  const [input, setInput] = useState("");
  const [editingMsgId, setEditingMsgId] = useState(null);
  const [replyingTo, setReplyingTo] = useState(null);

  // Modals & Drawers state
  const [profileOpen, setProfileOpen] = useState(false);
  const [mutualFriendsOpen, setMutualFriendsOpen] = useState(false);
  const [commonGroupsOpen, setCommonGroupsOpen] = useState(false);
  const [commonTripsOpen, setCommonTripsOpen] = useState(false);
  const [nicknameDrawerOpen, setNicknameDrawerOpen] = useState(false);
  const [imageCropperOpen, setImageCropperOpen] = useState(false);
  const [pendingImageDataUri, setPendingImageDataUri] = useState("");
  const [mediaViewerOpen, setMediaViewerOpen] = useState(false);
  const [viewingImageUrl, setViewingImageUrl] = useState("");
  const [activeMediaList, setActiveMediaList] = useState([]);

  // Trip selection and Contact sharing dialog states
  const [selectTripOpen, setSelectTripOpen] = useState(false);
  const [pendingTripAction, setPendingTripAction] = useState("budget"); // "budget" | "expenses"
  const [shareContactOpen, setShareContactOpen] = useState(false);

  const handleInitiateBudget = useCallback(() => {
    if (!commonTrips || commonTrips.length === 0) return;
    if (commonTrips.length === 1) {
      handleSendBudget(commonTrips[0]);
    } else {
      setPendingTripAction("budget");
      setSelectTripOpen(true);
    }
  }, [commonTrips, handleSendBudget]);

  const handleInitiateExpenses = useCallback(() => {
    if (!commonTrips || commonTrips.length === 0) return;
    if (commonTrips.length === 1) {
      handleSendExpenses(commonTrips[0]);
    } else {
      setPendingTripAction("expenses");
      setSelectTripOpen(true);
    }
  }, [commonTrips, handleSendExpenses]);

  const handleConfirmTripSelect = useCallback(
    (trip) => {
      if (pendingTripAction === "budget") {
        handleSendBudget(trip);
      } else {
        handleSendExpenses(trip);
      }
      setSelectTripOpen(false);
    },
    [pendingTripAction, handleSendBudget, handleSendExpenses]
  );

  // Context menu & reaction drawer state
  const [actionsAnchorEl, setActionsAnchorEl] = useState(null);
  const [selectedMsg, setSelectedMsg] = useState(null);
  const [reactionsDrawerOpen, setReactionsDrawerOpen] = useState(false);
  const [activeReactionMsg, setActiveReactionMsg] = useState(null);
  const [infoDialogOpen, setInfoDialogOpen] = useState(false);
  const [infoDialogMsg, setInfoDialogMsg] = useState(null);

  // Standalone Emoji Picker Popover (when opening from reaction menu '+')
  const [emojiPickerAnchorEl, setEmojiPickerAnchorEl] = useState(null);
  const [emojiPickerMsg, setEmojiPickerMsg] = useState(null);

  // Extract all media images for gallery forward/backward navigation
  const allChatImages = React.useMemo(() => {
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
      setActiveMediaList(customList || allChatImages);
      setMediaViewerOpen(true);

      if (options?.isViewOnce && options?.msgId && chatId) {
        updateDoc(doc(db, "chats", chatId, "messages", options.msgId), {
          viewedOnce: true,
          openedAt: Date.now(),
        }).catch(() => {});
      }
    },
    [allChatImages, chatId]
  );

  // Handlers
  const handleBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  // Auto-open profile drawer if URL has ?profile
  useEffect(() => {
    try {
      const searchParams = new URLSearchParams(window.location.search);
      if (searchParams.has("profile")) {
        fetchMutualFriends();
        if (isDesktop) {
          if (externalOpenProfile) {
            externalOpenProfile({
              id: friendId,
              ...friendDetails,
              onOpenSearch: () => setSearchDrawerOpen(true),
            });
          } else {
            openPanel("chatProfile", {
              id: friendId,
              ...friendDetails,
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
  }, [isDesktop, fetchMutualFriends, externalOpenProfile, openPanel, friendId, friendDetails]);

  const handleOpenProfile = useCallback(() => {
    fetchMutualFriends();
    if (isDesktop) {
      if (externalOpenProfile) {
        externalOpenProfile({
          id: friendId,
          ...friendDetails,
          messages,
          onOpenImage: handleOpenImage,
          onJumpToMessage: handleScrollToMessage,
          onOpenSearch: () => setSearchDrawerOpen(true),
        });
      } else {
        openPanel("chatProfile", {
          id: friendId,
          ...friendDetails,
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
    externalOpenProfile,
    openPanel,
    friendId,
    friendDetails,
    fetchMutualFriends,
    messages,
    handleOpenImage,
    handleScrollToMessage,
  ]);

  // Synchronize desktop panel ONLY when switching chats while panel is open
  const prevPanelFriendIdRef = React.useRef(friendId);
  useEffect(() => {
    if (activePanel === "chatProfile" && friendId && isDesktop) {
      if (prevPanelFriendIdRef.current !== friendId) {
        prevPanelFriendIdRef.current = friendId;
        const panelPayload = {
          id: friendId,
          ...friendDetails,
          messages,
          onOpenImage: handleOpenImage,
          onJumpToMessage: handleScrollToMessage,
          onOpenSearch: () => setSearchDrawerOpen(true),
        };
        if (externalOpenProfile) {
          externalOpenProfile(panelPayload);
        } else {
          openPanel("chatProfile", panelPayload);
        }
      }
    } else {
      prevPanelFriendIdRef.current = friendId;
    }
  }, [
    friendId,
    activePanel,
    isDesktop,
    friendDetails,
    messages,
    handleOpenImage,
    handleScrollToMessage,
    openPanel,
    externalOpenProfile,
  ]);

  const handleSendMessage = useCallback(
    (customText) => {
      const textToSend = typeof customText === "string" ? customText : input;
      if (!textToSend || !textToSend.trim()) return;

      if (editingMsgId) {
        editMessage(editingMsgId, textToSend);
        setEditingMsgId(null);
        setInput("");
        return;
      }

      sendMessage({
        text: textToSend,
        replyingTo,
      });
      setInput("");
      setReplyingTo(null);
    },
    [editingMsgId, editMessage, input, sendMessage, replyingTo]
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
            replyingTo,
          });
          setReplyingTo(null);
        });
      }
      e.target.value = "";
    },
    [replyingTo, sendMessage]
  );

  const handleSendCroppedImage = useCallback(
    (croppedUri, caption, options = {}) => {
      sendMessage({
        text: caption || "",
        imageUrl: croppedUri,
        replyingTo,
        viewOnce: Boolean(options.viewOnce),
      });
      setReplyingTo(null);
    },
    [sendMessage, replyingTo]
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
      sourceType: "direct",
      sourceId: friendId,
      sourceName: friendDetails?.name || friendDetails?.username || "Friend",
      sourceFriendUids: [currentUser?.uid, friendId].filter(Boolean),
    });
    setShareToChatOpen(true);
  }, [friendId, friendDetails, currentUser?.uid]);

  const handleShareExternalMessage = useCallback((msg) => {
    setExternalShareItems([msg]);
    setExternalShareOpen(true);
  }, []);

  // Active chat notification suppression
  useEffect(() => {
    if (friendId) {
      setActiveChat({
        type: "direct",
        friendId,
        id: [currentUser?.uid, friendId].sort().join("_"),
      });
    }
    return () => {
      clearActiveChat();
    };
  }, [friendId, currentUser?.uid]);

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
      sourceType: "direct",
      sourceId: friendId,
      sourceName: friendDetails?.name || friendDetails?.username || "Friend",
      sourceFriendUids: [currentUser?.uid, friendId].filter(Boolean),
    });
    setShareToChatOpen(true);
  }, [messages, selectedMsgIds, friendId, friendDetails, currentUser?.uid]);

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
    setReplyingTo(msg);
  }, []);

  const handleEdit = useCallback((msg) => {
    setEditingMsgId(msg.id);
    setInput(msg.text || "");
  }, []);

  const [pinDialogOpen, setPinDialogOpen] = useState(false);
  const [msgToPin, setMsgToPin] = useState(null);

  const handleOpenReactions = useCallback((msg) => {
    setActiveReactionMsg(msg);
    setReactionsDrawerOpen(true);
  }, []);

  const handleClearChat = useCallback(() => {
    // Soft clear from state and cache
    if (window.confirm("Are you sure you want to clear this chat view?")) {
      messages.forEach((m) => {
        if (m.senderId === currentUser?.uid) {
          deleteMessage(m.id);
        }
      });
    }
  }, [messages, currentUser?.uid, deleteMessage]);

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        position: "relative",
        bgcolor: 'transparent',
        width: '100%',
        height: '100%',
      }}
    >
      {/* 1. Header */}
      <ChatHeader
        friendDetails={friendDetails}
        nickname={nickname}
        isFriendTyping={isFriendTyping}
        onBack={handleBack}
        onOpenProfile={handleOpenProfile}
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

      {/* 2. Message List with real-time sync & smooth scrolling */}
      <MessageList
        messages={messages}
        loadingMessages={loadingMessages}
        currentUser={currentUser}
        friendDetails={friendDetails}
        isFriendTyping={isFriendTyping}
        effectiveChatTheme={effectiveChatTheme}
        onReply={handleReply}
        onImageClick={handleOpenImage}
        onOpenReactions={handleOpenReactions}
        onReaction={handleReaction}
        onContextMenu={handleContextMenu}
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
            borderTop: `0px solid ${
              isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.1)"
            }`,
            boxShadow: "none",
            zIndex: 10,
          }}
        >
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
            zIndex: 10,
          }}
        >
          <ChatInput
            input={input}
            setInput={setInput}
            isSending={isSending}
            onSendMessage={handleSendMessage}
            onImageSelect={handleImageFileSelect}
            replyingTo={replyingTo}
            onCancelReply={() => setReplyingTo(null)}
            onTyping={setDraftStatus}
            isBlocked={isBlocked}
            onUnblock={toggleBlockFriend}
            onClearChat={handleClearChat}
            onSendBudget={handleInitiateBudget}
            onSendExpenses={handleInitiateExpenses}
            onOpenShareContact={() => setShareContactOpen(true)}
            hasTrip={Boolean(commonTrips && commonTrips.length > 0)}
            isEmbedded={isEmbedded}
            effectiveChatTheme={effectiveChatTheme}
          />
        </Box>
      )}

      {/* 4. Context Menu */}
      <MessageActionsMenu
        anchorEl={actionsAnchorEl}
        onClose={() => setActionsAnchorEl(null)}
        selectedMsg={selectedMsg}
        currentUser={currentUser}
        friendDetails={friendDetails}
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
        isGroup={false}
        friendDetails={friendDetails}
        effectiveChatTheme={effectiveChatTheme}
      />

      {/* 5. Reactions Drawer */}
      <MessageReactionsDrawer
        open={reactionsDrawerOpen}
        onClose={() => setReactionsDrawerOpen(false)}
        reactionMsg={activeReactionMsg}
        currentUser={currentUser}
        friendDetails={friendDetails}
        onReaction={handleReaction}
        onRemoveReaction={handleReaction}
        effectiveChatTheme={effectiveChatTheme}
      />

      {/* 6. Profile & Sub-Drawers - Only on mobile devices */}
      {!isDesktop && (
        <ProfileDrawer
          open={profileOpen}
          onClose={() => setProfileOpen(false)}
          friendDetails={friendDetails}
          nickname={nickname}
          mutualFriends={mutualFriends}
          commonGroups={commonGroups}
          commonTrips={commonTrips}
          messages={messages}
          onOpenImage={handleOpenImage}
          onJumpToMessage={handleScrollToMessage}
          isBlocked={isBlocked}
          onOpenSearch={() => setSearchDrawerOpen(true)}
          onOpenMutualFriends={() => {
            fetchMutualFriends();
            setMutualFriendsOpen(true);
          }}
          onOpenCommonGroups={() => setCommonGroupsOpen(true)}
          onOpenCommonTrips={() => setCommonTripsOpen(true)}
          onOpenNicknameDrawer={() => setNicknameDrawerOpen(true)}
          onToggleBlock={toggleBlockFriend}
          onRemoveFriend={removeFriend}
          onClearChat={handleClearChat}
          onDeleteChat={handleClearChat}
          effectiveChatTheme={effectiveChatTheme}
        />
      )}

      <MutualFriendsDrawer
        open={mutualFriendsOpen}
        onClose={() => setMutualFriendsOpen(false)}
        mutualFriends={mutualFriends}
        effectiveChatTheme={effectiveChatTheme}
      />

      <CommonGroupsDrawer
        open={commonGroupsOpen}
        onClose={() => setCommonGroupsOpen(false)}
        commonGroups={commonGroups}
        effectiveChatTheme={effectiveChatTheme}
      />

      <CommonTripsDrawer
        open={commonTripsOpen}
        onClose={() => setCommonTripsOpen(false)}
        commonTrips={commonTrips}
        timelineStatsMap={timelineStatsMap}
        effectiveChatTheme={effectiveChatTheme}
      />

      <AddNicknameDrawer
        open={nicknameDrawerOpen}
        onClose={() => setNicknameDrawerOpen(false)}
        initialNickname={nickname}
        onSave={saveNickname}
        effectiveChatTheme={effectiveChatTheme}
      />

      {/* 7. Image Cropper Modal */}
      <ImageUploadCropperModal
        open={imageCropperOpen}
        onClose={() => setImageCropperOpen(false)}
        imageDataUri={pendingImageDataUri}
        onSend={handleSendCroppedImage}
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

      {/* 8. Fullscreen Media Viewer with Forward/Backward and Thumbnails */}
      <MediaViewerModal
        open={mediaViewerOpen}
        onClose={() => setMediaViewerOpen(false)}
        imageUrl={viewingImageUrl}
        images={activeMediaList.length > 0 ? activeMediaList : allChatImages}
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

      {/* 10. Search in Chat Drawer */}
      <SearchInChatDrawer
        open={searchDrawerOpen}
        onClose={() => setSearchDrawerOpen(false)}
        messages={messages}
        memberInfo={(() => {
          const m = {};
          if (friendDetails?.uid) m[friendDetails.uid] = friendDetails;
          if (currentUser?.uid) m[currentUser.uid] = currentUser;
          return m;
        })()}
        onSelectMessage={handleScrollToMessage}
        isDark={isDark}
      />

      {/* 11. Select Common Trip Dialog */}
      <SelectTripDialog
        open={selectTripOpen}
        onClose={() => setSelectTripOpen(false)}
        trips={commonTrips || []}
        onSelectTrip={handleConfirmTripSelect}
        title={
          pendingTripAction === "expenses"
            ? "Select Trip to Share Expenses"
            : "Select Trip to Share Budget"
        }
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

export { Chatroom };
export default Chatroom;
