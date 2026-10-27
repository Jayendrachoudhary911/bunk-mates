import React, { useRef, useEffect, useState, useCallback } from "react";
import { Box, Paper, Fab, Zoom, keyframes } from "@mui/material";
import ArrowDownwardIcon from "@mui/icons-material/ExpandMore";
import MessageItem from "./MessageItem";
import ChatDateSection from "./ChatDateSection";
import MessageListSkeleton from "./MessageListSkeleton";
import { AnimatePresence, motion } from "framer-motion";
import {
  processMessagesWithImageGroups,
  isDifferentDay,
  getMessageDateLabel,
  getTimestampDate,
} from "../../utils/chatHelpers";

const bounce = keyframes`
  0%, 100% { opacity: 0.3; transform: scale(0.8); }
  50% { opacity: 1; transform: scale(1.15); }
`;

const getMessageShape = (messages, index, currentUserId) => {
  const msg = messages[index];
  const prevMsg = messages[index - 1];
  const nextMsg = messages[index + 1];
  const isOwn = msg.senderId === currentUserId;

  const within1Min = (a, b) => {
    if (!a?.timestamp || !b?.timestamp) return false;
    const aSec = a.timestamp.seconds || (new Date(a.timestamp).getTime() / 1000);
    const bSec = b.timestamp.seconds || (new Date(b.timestamp).getTime() / 1000);
    return Math.abs(aSec - bSec) < 60;
  };

  const samePrev = prevMsg && prevMsg.senderId === msg.senderId && within1Min(msg, prevMsg);
  const sameNext = nextMsg && nextMsg.senderId === msg.senderId && within1Min(msg, nextMsg);

  if (isOwn) {
    if (samePrev && sameNext) return "24px 6px 6px 24px";
    if (samePrev && !sameNext) return "24px 6px 24px 24px";
    if (!samePrev && sameNext) return "24px 24px 6px 24px";
    return "24px 24px 6px 24px";
  } else {
    if (samePrev && sameNext) return "6px 24px 24px 6px";
    if (samePrev && !sameNext) return "6px 24px 24px 24px";
    if (!samePrev && sameNext) return "24px 24px 24px 6px";
    return "24px 24px 24px 6px";
  }
};

const shouldShowTimestamp = (messages, index) => {
  const msg = messages[index];
  const nextMsg = messages[index + 1];
  if (!nextMsg) return true;
  if (nextMsg.senderId !== msg.senderId) return true;

  const aSec = msg.timestamp?.seconds || (new Date(msg.timestamp).getTime() / 1000);
  const bSec = nextMsg.timestamp?.seconds || (new Date(nextMsg.timestamp).getTime() / 1000);
  return Math.abs(aSec - bSec) > 60;
};

const MessageList = ({
  messages,
  loadingMessages = false,
  currentUser,
  friendDetails,
  isFriendTyping,
  effectiveChatTheme = "dark",
  onReply,
  onImageClick,
  onOpenReactions,
  onReaction,
  onContextMenu,
  isSelectionMode = false,
  selectedMsgIds = [],
  onToggleSelectMsg,
  onShareCard,
}) => {
  const isDark = effectiveChatTheme === "dark";
  const scrollContainerRef = useRef(null);
  const messagesEndRef = useRef(null);
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const [highlightedMsgId, setHighlightedMsgId] = useState(null);
  const messageRefs = useRef({});

  // Group images sent together or within 2 minutes by the same sender
  const processedMessages = React.useMemo(() => {
    return processMessagesWithImageGroups(messages);
  }, [messages]);

  // Group processed messages by calendar date into date sections
  const dateGroups = React.useMemo(() => {
    if (!processedMessages || processedMessages.length === 0) return [];

    const groups = [];
    let currentGroup = null;

    processedMessages.forEach((msg, index) => {
      const isFirst = index === 0;
      const prevMsg = index > 0 ? processedMessages[index - 1] : null;
      const isNewDay = isFirst || isDifferentDay(prevMsg?.timestamp, msg?.timestamp);

      if (isNewDay || !currentGroup) {
        const label = getMessageDateLabel(msg?.timestamp);
        const d = getTimestampDate(msg?.timestamp);
        const dateKey = `date_${d.getFullYear()}_${d.getMonth()}_${d.getDate()}_${index}`;

        currentGroup = {
          dateKey,
          dateLabel: label,
          items: [],
        };
        groups.push(currentGroup);
      }

      const isOwn = msg.senderId === currentUser?.uid;
      const borderRadius = getMessageShape(processedMessages, index, currentUser?.uid);
      const showTime = shouldShowTimestamp(processedMessages, index);

      currentGroup.items.push({
        msg,
        originalIndex: index,
        isOwn,
        borderRadius,
        showTime,
      });
    });

    return groups;
  }, [processedMessages, currentUser?.uid]);

  // Auto-scroll to bottom on new message if close to bottom
  const scrollToBottom = useCallback((smooth = true) => {
    messagesEndRef.current?.scrollIntoView({
      behavior: smooth ? "smooth" : "auto",
    });
  }, []);

  useEffect(() => {
    scrollToBottom(false);
  }, [scrollToBottom]);

  useEffect(() => {
    if (!showScrollBottom) {
      scrollToBottom(true);
    }
  }, [messages.length, isFriendTyping, showScrollBottom, scrollToBottom]);

  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    const distanceToBottom = scrollHeight - scrollTop - clientHeight;
    setShowScrollBottom(distanceToBottom > 220);
  };

  const handleScrollToMessage = useCallback((msgId) => {
    const el = messageRefs.current[msgId];
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      setHighlightedMsgId(msgId);
      setTimeout(() => setHighlightedMsgId(null), 1800);
    }
  }, []);

  if (loadingMessages && (!messages || messages.length === 0)) {
    return <MessageListSkeleton isDark={isDark} />;
  }

  return (
    <Box
      ref={scrollContainerRef}
      onScroll={handleScroll}
      sx={{
        flex: 1,
        overflowY: "auto",
        overflowX: "hidden",
        px: { xs: 1, sm: 2 },
        py: 1.5,
        display: "flex",
        flexDirection: "column",
        gap: 0.3,
        position: "relative",
      }}
    >
      {dateGroups.map((group) => (
        <Box
          key={group.dateKey}
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 0.3,
            width: "100%",
          }}
        >
          <ChatDateSection label={group.dateLabel} isDark={isDark} />
          {group.items.map(({ msg, originalIndex, isOwn, borderRadius, showTime }) => (
            <div
              key={msg.id || originalIndex}
              id={msg.id ? `msg-${msg.id}` : undefined}
              ref={(el) => {
                if (el && msg.id) messageRefs.current[msg.id] = el;
              }}
            >
              <MessageItem
                msg={msg}
                isOwn={isOwn}
                borderRadius={borderRadius}
                showTimestamp={showTime}
                effectiveChatTheme={effectiveChatTheme}
                friendDetails={friendDetails}
                currentUser={currentUser}
                onReply={onReply}
                onImageClick={onImageClick}
                onOpenReactions={onOpenReactions}
                onReaction={onReaction}
                onAddReaction={onReaction}
                onContextMenu={onContextMenu}
                onScrollToMessage={handleScrollToMessage}
                isHighlighted={highlightedMsgId === msg.id}
                isSelectionMode={isSelectionMode}
                isSelected={selectedMsgIds.includes(msg.id)}
                onToggleSelect={onToggleSelectMsg}
                onShareCard={onShareCard}
              />
            </div>
          ))}
        </Box>
      ))}

      {/* Typing indicator bubble */}
      <AnimatePresence>
        {isFriendTyping && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            transition={{ duration: 0.25 }}
            style={{
              alignSelf: "flex-start",
              margin: "6px 12px",
            }}
          >
            <Paper
              elevation={0}
              sx={{
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                px: 1.8,
                py: 1.2,
                borderRadius: "18px 18px 18px 4px",
                bgcolor: isDark
                  ? "rgba(40, 40, 40, 0.75)"
                  : "rgb(255, 255, 255)",
                backdropFilter: "blur(14px)",
                color: isDark ? "#fff" : "#111",
                boxShadow: isDark
                  ? "inset 0 1px 2px rgba(255, 255, 255, 0.11), inset 0 -1px 3px rgba(0, 0, 0, 0.18)"
                  : "inset 0 1px 1px rgb(255, 255, 255), inset 0 -1px 2px rgba(0,0,0,0.1)",
              }}
            >
              {[0, 0.2, 0.4].map((delay, i) => (
                <Box
                  key={i}
                  sx={{
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    bgcolor: isDark ? "#d0d0d0" : "#2a2a2a",
                    animation: `${bounce} 1.3s infinite`,
                    animationDelay: `${delay}s`,
                  }}
                />
              ))}
            </Paper>
          </motion.div>
        )}
      </AnimatePresence>

      <div ref={messagesEndRef} style={{ height: 1 }} />

      {/* Floating Scroll to Bottom Button */}
<Zoom in={showScrollBottom}>
        <Fab
          size="small"
          onClick={() => scrollToBottom(true)}
          aria-label="Scroll to bottom"
          sx={{
            position: "fixed",
            bottom: { xs: 80, md: 90 },
            right: { xs: 20, md: 36 },
            zIndex: 1050,
            width: 42,
            height: 42,
            borderRadius: 8,
            bgcolor: isDark ? "rgba(49, 49, 49, 0.34)" : "rgba(255, 255, 255, 0.59)",
            color: isDark ? "#fff" : "#111",
            backdropFilter: 'blur(20px)',
            boxShadow: isDark
              ? "inset 0 1px 2px rgba(255, 255, 255, 0.11), inset 0 -1px 3px rgba(0, 0, 0, 0.18)"
              : "inset 0 1px 1px rgb(255, 255, 255), inset 0 -1px 2px rgba(0,0,0,0.1)",
            border: "0px solid",
            transition: "all 180ms ease",
            "&:hover": {
              bgcolor: isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.07)",
              boxShadow: "none",
              transform: "translateY(-2px) scale(1.05)",
            },
            "&:active": {
              transform: "scale(0.95)",
            },
          }}
        >
          <ArrowDownwardIcon sx={{ fontSize: 24 }} />
        </Fab>
      </Zoom>
    </Box>
  );
};

export default React.memo(MessageList);
 