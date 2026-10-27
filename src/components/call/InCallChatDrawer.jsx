import React, { useState, useRef, useEffect } from "react";
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  TextField,
  Avatar,
  Paper,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import SendIcon from "@mui/icons-material/Send";
import { useCall } from "../../contexts/CallContext";
import { useUser } from "../../contexts/UserContext";

export default function InCallChatDrawer({ open, onClose }) {
  const { inCallMessages, sendInCallMessage } = useCall();
  const { user: currentUser } = useUser();
  const [inputText, setInputText] = useState("");
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (open) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [open, inCallMessages]);

  const handleSend = (e) => {
    e?.preventDefault();
    if (!inputText.trim()) return;
    sendInCallMessage(inputText);
    setInputText("");
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: { xs: "100%", sm: 360 },
          bgcolor: "rgba(18, 20, 24, 0.95)",
          backdropFilter: "blur(24px)",
          color: "#fff",
          borderLeft: "1px solid rgba(255,255,255,0.1)",
          display: "flex",
          flexDirection: "column",
          boxShadow: "-8px 0 32px rgba(0,0,0,0.6)",
        },
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
          In-Call Messages
        </Typography>
        <IconButton onClick={onClose} sx={{ color: "rgba(255,255,255,0.6)" }}>
          <CloseIcon />
        </IconButton>
      </Box>

      {/* Messages List */}
      <Box sx={{ flex: 1, p: 2, overflowY: "auto", display: "flex", flexDirection: "column", gap: 1.5 }}>
        {inCallMessages.length === 0 ? (
          <Box sx={{ my: "auto", textAlign: "center", opacity: 0.5, px: 2 }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              No messages yet
            </Typography>
            <Typography variant="caption" sx={{ display: "block", mt: 0.5 }}>
              Send addresses, trip plans, or links during the call!
            </Typography>
          </Box>
        ) : (
          inCallMessages.map((msg) => {
            const isMe = msg.senderId === currentUser?.uid;
            return (
              <Box
                key={msg.id}
                sx={{
                  display: "flex",
                  justifyContent: isMe ? "flex-end" : "flex-start",
                  alignItems: "flex-end",
                  gap: 1,
                }}
              >
                {!isMe && (
                  <Avatar src={msg.senderAvatar || ""} sx={{ width: 28, height: 28, fontSize: "0.75rem" }}>
                    {msg.senderName?.[0] || "U"}
                  </Avatar>
                )}
                <Paper
                  sx={{
                    p: 1.2,
                    px: 1.6,
                    maxWidth: "75%",
                    borderRadius: isMe ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                    bgcolor: isMe ? "#00e676" : "rgba(255,255,255,0.1)",
                    color: isMe ? "#000" : "#fff",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                  }}
                >
                  {!isMe && (
                    <Typography variant="caption" sx={{ fontWeight: 800, opacity: 0.8, display: "block", mb: 0.2 }}>
                      {msg.senderName}
                    </Typography>
                  )}
                  <Typography variant="body2" sx={{ fontWeight: 500, wordBreak: "break-word" }}>
                    {msg.text}
                  </Typography>
                </Paper>
              </Box>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </Box>

      {/* Input Field */}
      <Box
        component="form"
        onSubmit={handleSend}
        sx={{
          p: 1.5,
          borderTop: "1px solid rgba(255,255,255,0.08)",
          bgcolor: "rgba(0,0,0,0.3)",
          display: "flex",
          alignItems: "center",
          gap: 1,
        }}
      >
        <TextField
          fullWidth
          size="small"
          placeholder="Type message to participants..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          sx={{
            "& .MuiOutlinedInput-root": {
              borderRadius: "99px",
              bgcolor: "rgba(255,255,255,0.06)",
              color: "#fff",
              fontSize: "0.88rem",
            },
          }}
        />
        <IconButton
          type="submit"
          disabled={!inputText.trim()}
          sx={{
            bgcolor: "#00e676",
            color: "#000",
            "&:hover": { bgcolor: "#00c853" },
            "&.Mui-disabled": { bgcolor: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.3)" },
          }}
        >
          <SendIcon sx={{ fontSize: 18 }} />
        </IconButton>
      </Box>
    </Drawer>
  );
}
