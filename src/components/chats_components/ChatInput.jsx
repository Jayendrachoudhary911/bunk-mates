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
import PersonOffIcon from "@mui/icons-material/PersonOff";
import DeleteIcon from "@mui/icons-material/DeleteOutline";
import EmojiIcon from "@mui/icons-material/SentimentSatisfiedAlt";
import EmojiPicker from "emoji-picker-react";
import SlashCommandPalette, { getFilteredCommands } from "./SlashCommandPalette";
import EmojiCommandPalette, { getFilteredEmojis } from "./EmojiCommandPalette";

const ChatInput = ({
  input,
  setInput,
  isSending,
  onSendMessage,
  onImageSelect,
  replyingTo,
  onCancelReply,
  onTyping,
  isBlocked,
  onUnblock,
  onClearChat,
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
  const [pastedImages, setPastedImages] = useState([]);
  const [emojiAnchorEl, setEmojiAnchorEl] = useState(null);
  const [slashIndex, setSlashIndex] = useState(0);
  const [emojiIndex, setEmojiIndex] = useState(0);
  const inputRef = useRef(null);

  // Handle clipboard paste for images
  const handlePaste = (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    const imageFiles = [];
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith("image/")) {
        const file = items[i].getAsFile();
        if (file) imageFiles.push(file);
      }
    }
    if (imageFiles.length > 0) {
      e.preventDefault();
      imageFiles.forEach((file) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          setPastedImages((prev) => [...prev, event.target.result]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const handleRemovePastedImage = (index) => {
    setPastedImages((prev) => prev.filter((_, i) => i !== index));
  };

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
    if (e && e.preventDefault) e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed && pastedImages.length === 0) return;

    if (pastedImages.length > 0) {
      if (onSendMessage) {
        if (pastedImages.length === 1) {
          onSendMessage({
            text: trimmed,
            imageUrl: pastedImages[0],
            replyingTo,
          });
        } else {
          onSendMessage({
            text: trimmed,
            images: pastedImages,
            replyingTo,
          });
        }
      }
      setInput("");
      setPastedImages([]);
      return;
    }

    // Check slash commands
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

    onSendMessage(trimmed);
  };

  const handleKeyDown = (e) => {
    // 1. Emoji palette navigation
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

    // 2. Slash command palette navigation
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

  if (isBlocked) {
    return (
      <Box
        sx={{
          p: 1.5,
          display: "flex",
          gap: 1.5,
          width: "100%",
          maxWidth: 640,
          mx: "auto",
        }}
      >
        <Button
          fullWidth
          variant="contained"
          onClick={onUnblock}
          startIcon={<PersonOffIcon />}
          sx={{
            py: 1.2,
            borderRadius: "14px",
            bgcolor: "rgba(255, 77, 77, 0.15)",
            color: "#ff4d4d",
            border: "1px solid rgba(255, 77, 77, 0.3)",
            fontWeight: 600,
            textTransform: "none",
            "&:hover": {
              bgcolor: "rgba(255, 77, 77, 0.25)",
            },
          }}
        >
          Unblock Friend
        </Button>
        <Button
          fullWidth
          variant="outlined"
          onClick={onClearChat}
          startIcon={<DeleteIcon />}
          sx={{
            py: 1.2,
            borderRadius: "14px",
            borderColor: isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.15)",
            color: isDark ? "#fff" : "#111",
            fontWeight: 600,
            textTransform: "none",
            "&:hover": {
              borderColor: isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)",
              bgcolor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)",
            },
          }}
        >
          Delete Chat
        </Button>
      </Box>
    );
  }

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

      {/* Collapsible Reply Preview */}
      <Collapse in={Boolean(replyingTo)} timeout={250}>
        {replyingTo && (
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
                Replying to{" "}
                {replyingTo.senderName ||
                  (replyingTo.senderId ? "message" : "user")}
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
                {replyingTo.text || "📷 Photo"}
              </Typography>
            </Box>

            <IconButton
              size="small"
              onClick={onCancelReply}
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
          onPaste={handlePaste}
          sx={{
            flex: 1,
            display: "flex",
            flexDirection: pastedImages.length > 0 ? "column" : "row",
            alignItems: pastedImages.length > 0 ? "stretch" : "center",
            px: 0.4,
            py: 0.4,
            borderRadius: pastedImages.length > 0 ? "20px" : "28px",
            bgcolor: isDark
              ? "rgba(30, 30, 30, 0.65)"
              : "rgba(255, 255, 255, 0.8)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            border: `1px solid ${
              isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.08)"
            }`,
            boxShadow: 'none',
            overflow: "hidden",
            transition: "all 200ms ease",
          }}
        >
          {/* Pasted Images Preview Strip */}
          {pastedImages.length > 0 && (
            <Box
              sx={{
                p: 1.2,
                pb: 0.8,
                display: "flex",
                alignItems: "center",
                gap: 1.2,
                overflowX: "auto",
                "&::-webkit-scrollbar": { height: 4 },
                "&::-webkit-scrollbar-thumb": {
                  bgcolor: isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.2)",
                  borderRadius: 2,
                },
              }}
            >
              {pastedImages.map((imgUri, idx) => (
                <Box
                  key={idx}
                  sx={{
                    position: "relative",
                    display: "inline-block",
                    borderRadius: "14px",
                    overflow: "hidden",
                    border: `1px solid ${
                      isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.1)"
                    }`,
                    bgcolor: isDark ? "#111" : "#f0f0f0",
                    flexShrink: 0,
                  }}
                >
                  <Box
                    component="img"
                    src={imgUri}
                    alt={`Pasted image ${idx + 1}`}
                    sx={{
                      width: 90,
                      height: 72,
                      objectFit: "cover",
                      display: "block",
                    }}
                  />
                  <IconButton
                    size="small"
                    onClick={() => handleRemovePastedImage(idx)}
                    sx={{
                      position: "absolute",
                      top: 3,
                      right: 3,
                      bgcolor: "rgba(0,0,0,0.65)",
                      color: "#fff",
                      p: 0.35,
                      "&:hover": {
                        bgcolor: "rgba(255, 77, 77, 0.9)",
                      },
                    }}
                  >
                    <CloseIcon sx={{ fontSize: 13 }} />
                  </IconButton>
                </Box>
              ))}
            </Box>
          )}

          {/* Lower controls row: Attachment buttons, TextField, Send button */}
          <Box sx={{ display: "flex", alignItems: "center", width: "100%", gap: 0 }}>
            {/* Attachment / Action Buttons Group */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 0 }}>
              {/* Camera Button (Hides when typing or image attached) */}
              <Collapse in={!input.trim() && pastedImages.length === 0} orientation="horizontal" timeout={200}>
                <IconButton
                  component="label"
                  size="small"
                  aria-label="Attach images"
                  sx={{
                    width: 42,
                    height: 42,
                    mr: 0.5,
                    borderRadius: 8,
                    color: isDark ? "rgba(255, 255, 255, 0.75)" : "text.secondary",
                    bgcolor: isDark ? "rgba(255, 255, 255, 0.035)" : "rgba(0, 0, 0, 0.035)",
                    boxShadow: isDark
                      ? "inset 0 1px 1px rgba(255, 255, 255, 0.08), inset 0 -1px 2px rgba(0,0,0,0.3)"
                      : "inset 0 1px 1px rgba(255, 255, 255, 0.6), inset 0 -1px 2px rgba(0,0,0,0.08)",
                    transition: "all 180ms ease",
                    "&:hover": {
                      bgcolor: isDark ? "rgba(255, 255, 255, 0.09)" : "rgba(0, 0, 0, 0.07)",
                      color: isDark ? "#fff" : "text.primary",
                      boxShadow: "none",
                    },
                    "&:active": {
                      transform: "scale(0.95)",
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
              </Collapse>

              {/* Emoji Button */}
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
                  transition: "all 180ms ease",
                  "&:hover": {
                    bgcolor: isDark ? "rgba(255, 255, 255, 0.09)" : "rgba(0, 0, 0, 0.07)",
                    color: isDark ? "#fff" : "text.primary",
                    boxShadow: "none",
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
              onChange={(e) => {
                setInput(e.target.value);
                onTyping(e.target.value);
              }}
              onKeyDown={handleKeyDown}
              placeholder={pastedImages.length > 0 ? "Add a caption..." : "Type your message..."}
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

            {/* Send Button */}
            <Button
              type="submit"
              disabled={!input.trim() && pastedImages.length === 0}
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
                transition: "all 180ms ease",
                "&:hover": {
                  bgcolor: isDark ? "rgba(255, 255, 255, 0.85)" : "rgba(17, 17, 17, 0.85)",
                  boxShadow: "none",
                  transform: "translate(0px)",
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
              <SendIcon sx={{ fontSize: 20 }} />
            </Button>
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
            overflow: "hidden",
            boxShadow: "none",
            border: 'none',
            borderRadius: 8,
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

export default React.memo(ChatInput);