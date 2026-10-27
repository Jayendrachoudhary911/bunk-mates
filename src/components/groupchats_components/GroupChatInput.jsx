import React, { useState, useRef } from "react";
import {
  Box,
  TextField,
  IconButton,
  Button,
  Collapse,
  Paper,
  Typography,
  CircularProgress,
  Popover,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import CloseIcon from "@mui/icons-material/Close";
import CameraIcon from "@mui/icons-material/CameraAltOutlined";
import AttachFileIcon from "@mui/icons-material/AttachFileOutlined";
import CheckIcon from "@mui/icons-material/Check";
import EmojiIcon from "@mui/icons-material/SentimentSatisfiedAlt";
import EmojiPicker from "emoji-picker-react";
import GroupStructuredActionsMenu from "./GroupStructuredActionsMenu";
import GroupMentionDrawer from "./GroupMentionDrawer";
import SlashCommandPalette, { getFilteredCommands } from "../chats_components/SlashCommandPalette";
import EmojiCommandPalette, { getFilteredEmojis } from "../chats_components/EmojiCommandPalette";
import ProgressiveBlur from "../ProgressiveBlur";

const GroupChatInput = ({
  input,
  setInput,
  isSending,
  onSendMessage,
  onTyping,
  onImageSelect,
  replyTo,
  onCancelReply,
  editingMsg,
  onCancelEdit,
  groupInfo,
  currentUser,
  memberInfo = {},
  hasTrip = false,
  onSendTimeline,
  onSendChecklist,
  onSendBudget,
  onSendExpenses,
  onOpenShareContact,
  onOpenCreatePoll,
  isEmbedded = false,
  effectiveChatTheme = "dark",
}) => {
  const isDark = effectiveChatTheme === "dark";
  const [actionsMenuOpen, setActionsMenuOpen] = useState(false);
  const [mentionDrawerOpen, setMentionDrawerOpen] = useState(false);
  const [emojiAnchorEl, setEmojiAnchorEl] = useState(null);
  const [slashIndex, setSlashIndex] = useState(0);
  const [emojiIndex, setEmojiIndex] = useState(0);
  const inputRef = useRef(null);

  const filteredCommands = React.useMemo(() => {
    return getFilteredCommands(input, hasTrip);
  }, [input, hasTrip]);

  const filteredEmojis = React.useMemo(() => {
    return getFilteredEmojis(input);
  }, [input]);

  React.useEffect(() => {
    setSlashIndex(0);
    setEmojiIndex(0);
  }, [input]);

  const canSend =
    !groupInfo ||
    groupInfo.sendAccess === "all" ||
    groupInfo.createdBy === currentUser?.uid ||
    (groupInfo.admins || []).includes(currentUser?.uid);

  if (!canSend) {
    return (
      <Box sx={{ p: 2, textAlign: "center" }}>
        <Typography
          variant="body2"
          sx={{
            color: isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)",
            fontStyle: "italic",
          }}
        >
          🔒 Only Admins can send messages in this group.
        </Typography>
      </Box>
    );
  }

  const handleInputChange = (e) => {
    const val = e.target.value;
    setInput(val);
    if (onTyping) onTyping(val);

    if (val.endsWith("@")) {
      setMentionDrawerOpen(true);
      if (actionsMenuOpen) setActionsMenuOpen(false); // Close actions menu if mentions open
    } else if (mentionDrawerOpen && !val.includes("@")) {
      setMentionDrawerOpen(false);
    }
  };

  const handleMentionSelect = (usernameOrName) => {
    setInput((prev) => {
      const lastAt = prev.lastIndexOf("@");
      if (lastAt !== -1) {
        return prev.substring(0, lastAt) + `@${usernameOrName} `;
      }
      return prev + `@${usernameOrName} `;
    });
    setMentionDrawerOpen(false);
  };

  const handleSelectCommand = (c) => {
    if (c.cmd === "/budget") {
      if (onSendBudget) onSendBudget();
      setInput("");
    } else if (c.cmd === "/expenses") {
      if (onSendExpenses) onSendExpenses();
      setInput("");
    } else if (c.cmd === "/profile") {
      if (onOpenShareContact) onOpenShareContact();
      setInput("");
    } else if (c.cmd === "/timeline") {
      if (onSendTimeline) onSendTimeline();
      setInput("");
    } else if (c.cmd === "/checklist") {
      if (onSendChecklist) onSendChecklist();
      setInput("");
    } else if (c.cmd === "/poll") {
      if (onOpenCreatePoll) onOpenCreatePoll();
      setInput("");
    } else if (c.cmd === "/shrug") {
      setInput((prev) => (prev.startsWith("/") ? "" : prev) + "¯\\_(ツ)_/¯");
    } else if (c.cmd === "/tableflip") {
      setInput((prev) => (prev.startsWith("/") ? "" : prev) + "(╯°□°)╯︵ ┻━┻");
    } else if (c.cmd === "/clear") {
      setInput("");
    }
  };

  const handleSendDirectEmoji = (emoji) => {
    if (onSendMessage) {
      onSendMessage(emoji);
    }
    setInput("");
  };

  const handleSelectEmoji = (emoji) => {
    setInput((prev) => {
      const match = prev.match(/(?:^|\s):([a-zA-Z0-9_+-]*)$/);
      if (!match) return prev + emoji;
      const idx = prev.lastIndexOf(":");
      return prev.substring(0, idx) + emoji + " ";
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isSending) return;

    if (trimmed === "/budget" && onSendBudget) {
      onSendBudget();
      setInput("");
      return;
    } else if (trimmed === "/expenses" && onSendExpenses) {
      onSendExpenses();
      setInput("");
      return;
    } else if (trimmed === "/profile" && onOpenShareContact) {
      onOpenShareContact();
      setInput("");
      return;
    } else if (trimmed === "/timeline" && onSendTimeline) {
      onSendTimeline();
      setInput("");
      return;
    } else if (trimmed === "/checklist" && onSendChecklist) {
      onSendChecklist();
      setInput("");
      return;
    } else if (trimmed === "/poll" && onOpenCreatePoll) {
      onOpenCreatePoll();
      setInput("");
      return;
    } else if (trimmed === "/clear") {
      setInput("");
      return;
    }

    onSendMessage();
  };

  const handleKeyDown = (e) => {
    if (filteredEmojis.length > 0) {
      if (e.key === "ArrowDown" || e.key === "ArrowRight") {
        e.preventDefault();
        setEmojiIndex((prev) => (prev + 1) % filteredEmojis.length);
        return;
      }
      if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
        e.preventDefault();
        setEmojiIndex((prev) => (prev - 1 + filteredEmojis.length) % filteredEmojis.length);
        return;
      }
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        const activeEmoji = filteredEmojis[emojiIndex] || filteredEmojis[0];
        if (activeEmoji) {
          handleSendDirectEmoji(activeEmoji.emoji);
        }
        return;
      }
      if (e.key === "Tab") {
        e.preventDefault();
        const activeEmoji = filteredEmojis[emojiIndex] || filteredEmojis[0];
        if (activeEmoji) {
          handleSelectEmoji(activeEmoji.emoji);
        }
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        setInput("");
        return;
      }
    }

    if (filteredCommands.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSlashIndex((prev) => (prev + 1) % filteredCommands.length);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSlashIndex((prev) => (prev - 1 + filteredCommands.length) % filteredCommands.length);
        return;
      }
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        const activeCmd = filteredCommands[slashIndex] || filteredCommands[0];
        if (activeCmd) {
          handleSelectCommand(activeCmd);
        }
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        setInput("");
        return;
      }
    }

    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{
        width: "auto",
        maxWidth: isEmbedded ? "auto" : 920,
        mx: "auto",
        px: { xs: 1.2, sm: 2 },
        pb: isEmbedded ? 2 : { xs: 1.5, md: 2 },
        pt: 0.5,
        display: "flex",
        flexDirection: "column",
        gap: 0.8,
        position: "relative",
      }}
    >
      <ProgressiveBlur
        mode={isDark ? "dark" : "light"}
        direction="top"
        height="100%"
        blur="24px"
      />

      {/* 0. Emoji Command Palette */}
      <EmojiCommandPalette
        input={input}
        onSelectEmoji={handleSelectEmoji}
        onSendDirectEmoji={handleSendDirectEmoji}
        isDark={isDark}
        selectedIndex={emojiIndex}
      />

      {/* 1. Slash Command Palette */}
      <SlashCommandPalette
        input={input}
        onSelectCommand={handleSelectCommand}
        isDark={isDark}
        hasTrip={hasTrip}
        visible={filteredCommands.length > 0}
        selectedIndex={slashIndex}
      />

      {/* 3. Reply / Edit Preview Banner */}
      <Collapse in={Boolean(replyTo || editingMsg)} timeout={200}>
        {(replyTo || editingMsg) && (
          <Paper
            elevation={0}
            sx={{
              p: 1.2,
              px: 1.6,
              borderRadius: 4.5,
              bgcolor: isDark
                ? "rgba(35, 35, 35, 0.25)"
                : "rgba(245, 245, 245, 0.9)",
              backdropFilter: "blur(14px)",
              border: `1px solid ${
                isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"
              }`,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Box sx={{ minWidth: 0, overflow: "hidden" }}>
              <Typography
                variant="subtitle2"
                sx={{
                  fontWeight: 400,
                  color: isDark ? "#ffffff" : "#000000",
                  display: "block",
                }}
              >
                {editingMsg ? "Editing message" : `Replying to ${replyTo?.senderName || "Member"}`}
              </Typography>
              <Typography
                variant="body2"
                noWrap
                sx={{
                  color: isDark ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.7)",
                  fontSize: "0.85rem",
                  maxWidth: { xs: 260, sm: 480 },
                }}
              >
                {editingMsg?.text || replyTo?.text || "📷 Photo"}
              </Typography>
            </Box>

            <IconButton
              size="small"
              onClick={editingMsg ? onCancelEdit : onCancelReply}
              sx={{
                color: isDark ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.6)",
                p: 0.5,
              }}
            >
              <CloseIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Paper>
        )}
      </Collapse>

      {/* Input controls row */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Paper
          elevation={0}
          sx={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            px: 0.4,
            py: 0.4,
            borderRadius: "28px",
            bgcolor: isDark
              ? "rgba(30, 30, 30, 0.65)"
              : "rgba(255, 255, 255, 0.8)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            border: `1px solid ${
              isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.08)"
            }`,
            boxShadow: "none",
            overflow: "hidden",
            willChange: "transform, height",
            transition: "all 180ms cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        >
          {/* Expanded Mention Drawer inside the input box (Opened above text field row) */}
          <Collapse in={mentionDrawerOpen} timeout={180}>
            <Box
              sx={{
                pt: 1,
                pb: 1,
                px: 1,
                borderBottom: `1px solid ${
                  isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.06)"
                }`,
                mb: 0.5,
                maxHeight: 180,
                overflowY: "auto",
              }}
            >
              <GroupMentionDrawer
                open={mentionDrawerOpen}
                members={groupInfo?.members || []}
                memberInfo={memberInfo}
                onSelectMember={handleMentionSelect}
                effectiveChatTheme={effectiveChatTheme}
                isEmbeddedInsideInput={true}
              />
            </Box>
          </Collapse>

          {/* Expanded Structured Actions Menu inside the input box (Opened above text field row) */}
          <Collapse in={actionsMenuOpen} timeout={180}>
            <Box
              sx={{
                pt: 1,
                pb: 1,
                px: 1,
                borderBottom: `1px solid ${
                  isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.06)"
                }`,
                mb: 0.5,
              }}
            >
              <GroupStructuredActionsMenu
                open={actionsMenuOpen}
                onClose={() => setActionsMenuOpen(false)}
                hasTrip={hasTrip}
                onSendTimeline={onSendTimeline}
                onSendChecklist={onSendChecklist}
                onSendBudget={onSendBudget}
                onSendExpenses={onSendExpenses}
                onOpenCreatePoll={onOpenCreatePoll}
                onOpenShareContact={onOpenShareContact}
                effectiveChatTheme={effectiveChatTheme}
                isEmbeddedInsideInput={true}
              />
            </Box>
          </Collapse>

          <Box sx={{ display: "flex", alignItems: "center", width: "100%" }}>
            {/* Left Side: Emoji Button */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 0 }}>
              <IconButton
                size="small"
                onClick={(e) => setEmojiAnchorEl(e.currentTarget)}
                aria-label="Open emoji picker"
                sx={{
                  width: 42,
                  height: 42,
                  borderRadius: 8,
                  color: isDark ? "rgba(255, 255, 255, 0.75)" : "text.secondary",
                  bgcolor: isDark ? "rgba(255, 255, 255, 0.035)" : "rgba(0, 0, 0, 0.035)",
                  boxShadow: isDark
                    ? "inset 0 1px 1px rgba(255, 255, 255, 0.08), inset 0 -1px 2px rgba(0,0,0,0.3)"
                    : "inset 0 1px 1px rgba(255, 255, 255, 0.6), inset 0 -1px 2px rgba(0,0,0,0.08)",
                  transition: "all 150ms ease",
                  "&:hover": {
                    bgcolor: isDark ? "rgba(255, 255, 255, 0.09)" : "rgba(0, 0, 0, 0.07)",
                    color: isDark ? "#fff" : "text.primary",
                  },
                  "&:active": {
                    transform: "scale(0.95)",
                  },
                }}
              >
                <EmojiIcon sx={{ fontSize: 20 }} />
              </IconButton>
            </Box>

            {/* Text Field */}
            <TextField
              inputRef={inputRef}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder={
                editingMsg ? "Editing group message..." : "Type a message or @ to mention..."
              }
              multiline
              maxRows={4}
              variant="standard"
              InputProps={{
                disableUnderline: true,
                sx: {
                  color: isDark ? "#fff" : "#111",
                  fontSize: "1rem",
                  px: 1,
                  py: 0.6,
                },
              }}
              sx={{ flex: 1 }}
            />

            {/* Right Side: Camera/Attach Buttons vs Send Button with smooth optimized transitions */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              {/* Camera & Attach buttons (Displayed when user is NOT typing) */}
              <Collapse in={!input.trim()} orientation="horizontal" timeout={150}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  <IconButton
                    component="label"
                    size="small"
                    aria-label="Capture or attach media"
                    sx={{
                      width: 42,
                      height: 42,
                      borderRadius: 8,
                      color: isDark ? "rgba(255, 255, 255, 0.75)" : "text.secondary",
                      bgcolor: isDark ? "rgba(255, 255, 255, 0.035)" : "rgba(0, 0, 0, 0.035)",
                      boxShadow: isDark
                        ? "inset 0 1px 1px rgba(255, 255, 255, 0.08), inset 0 -1px 2px rgba(0,0,0,0.3)"
                        : "inset 0 1px 1px rgba(255, 255, 255, 0.6), inset 0 -1px 2px rgba(0,0,0,0.08)",
                      transition: "all 150ms ease",
                      "&:hover": {
                        bgcolor: isDark ? "rgba(255, 255, 255, 0.09)" : "rgba(0, 0, 0, 0.07)",
                        color: isDark ? "#fff" : "text.primary",
                      },
                    }}
                  >
                    <CameraIcon sx={{ fontSize: 20 }} />
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      hidden
                      onChange={onImageSelect}
                    />
                  </IconButton>

                  <IconButton
                    size="small"
                    onClick={() => {
                      setActionsMenuOpen((prev) => {
                        const nextState = !prev;
                        if (nextState && mentionDrawerOpen) setMentionDrawerOpen(false);
                        return nextState;
                      });
                    }}
                    aria-label="Open structured actions"
                    sx={{
                      width: 42,
                      height: 42,
                      borderRadius: 8,
                      color: isDark ? "rgba(255, 255, 255, 0.75)" : "text.secondary",
                      bgcolor: isDark ? "rgba(255, 255, 255, 0.035)" : "rgba(0, 0, 0, 0.035)",
                      boxShadow: isDark
                        ? "inset 0 1px 1px rgba(255, 255, 255, 0.08), inset 0 -1px 2px rgba(0,0,0,0.3)"
                        : "inset 0 1px 1px rgba(255, 255, 255, 0.6), inset 0 -1px 2px rgba(0,0,0,0.08)",
                      transform: actionsMenuOpen ? "rotate(45deg)" : "rotate(0deg)",
                      transition: "transform 180ms ease, background-color 150ms ease",
                      "&:hover": {
                        bgcolor: isDark ? "rgba(255, 255, 255, 0.09)" : "rgba(0, 0, 0, 0.07)",
                        color: isDark ? "#fff" : "text.primary",
                      },
                    }}
                  >
                    <AttachFileIcon sx={{ fontSize: 20 }} />
                  </IconButton>
                </Box>
              </Collapse>

              {/* Send / Edit Button (Displayed when user is TYPING or editing message) */}
              <Collapse in={Boolean(input.trim() || editingMsg)} orientation="horizontal" timeout={150}>
                {editingMsg ? (
                  <Box sx={{ display: "flex", gap: 0.8 }}>
                    <Button
                      onClick={onCancelEdit}
                      sx={{
                        width: 42,
                        height: 42,
                        minWidth: 42,
                        borderRadius: 8,
                        bgcolor: isDark ? "#ff4d4d22" : "#ffebee",
                        color: "#ff4d4d",
                      }}
                    >
                      <CloseIcon sx={{ fontSize: 18 }} />
                    </Button>
                    <Button
                      onClick={handleSubmit}
                      sx={{
                        width: 42,
                        height: 42,
                        minWidth: 42,
                        borderRadius: 8,
                        bgcolor: "#00b7ff",
                        color: "#fff",
                      }}
                    >
                      <CheckIcon sx={{ fontSize: 18 }} />
                    </Button>
                  </Box>
                ) : (
                  <Button
                    type="submit"
                    disabled={!input.trim() || isSending}
                    disableElevation
                    sx={{
                      width: 64,
                      height: 42,
                      minWidth: 48,
                      px: 2,
                      borderRadius: 8,
                      textTransform: "none",
                      bgcolor: isDark ? "#cacaca" : "#252525",
                      color: isDark ? "#111" : "#fff",
                      boxShadow: isDark
                        ? "inset 0 1px 4px rgba(255, 255, 255, 1), inset 0 -1px 8px rgba(0, 0, 0, 0.9)"
                        : "inset 0 1px 4px rgba(255, 255, 255, 0.8), inset 0 -1px 6px rgba(0,0,0,0.2)",
                      transition: "all 150ms ease",
                      "&:hover": {
                        bgcolor: isDark ? "rgba(255, 255, 255, 0.85)" : "rgba(17, 17, 17, 0.85)",
                        boxShadow: "none",
                      },
                      "&:active": {
                        transform: "scale(0.98)",
                      },
                      "&:disabled": {
                        bgcolor: isDark
                          ? "rgba(255, 255, 255, 0.05)"
                          : "rgba(0, 0, 0, 0.04)",
                        color: isDark
                          ? "rgba(255, 255, 255, 0.25)"
                          : "rgba(0, 0, 0, 0.25)",
                        boxShadow: "none",
                      },
                    }}
                  >
                    {isSending ? (
                      <CircularProgress size={20} sx={{ color: "inherit" }} />
                    ) : (
                      <SendIcon sx={{ fontSize: 20 }} />
                    )}
                  </Button>
                )}
              </Collapse>
            </Box>
          </Box>
        </Paper>
      </Box>

      {/* Emoji Picker Popover */}
      <Popover
        open={Boolean(emojiAnchorEl)}
        anchorEl={emojiAnchorEl}
        onClose={() => setEmojiAnchorEl(null)}
        anchorOrigin={{ vertical: "top", horizontal: "left" }}
        transformOrigin={{ vertical: "bottom", horizontal: "left" }}
        PaperProps={{
          sx: {
            borderRadius: "20px",
            overflow: "hidden",
            boxShadow: "none",
            border: "none",
            bgcolor: isDark ? "rgba(20, 20, 20, 0.17)" : "rgba(255, 255, 255, 0.48)",
          },
        }}
      >
        <EmojiPicker
          theme={isDark ? "dark" : "light"}
          onEmojiClick={(data) => {
            setInput((prev) => prev + data.emoji);
            setEmojiAnchorEl(null);
            inputRef.current?.focus();
          }}
        />
      </Popover>
    </Box>
  );
};

export default React.memo(GroupChatInput);