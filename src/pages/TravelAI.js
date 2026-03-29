import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  TextField,
  IconButton,
  Typography,
  Paper,
  Stack,
  Avatar,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import SmartToyIcon from "@mui/icons-material/SmartToy";
import PersonIcon from "@mui/icons-material/Person";
import { askTravelAI } from "../utils/gemini";

import { auth } from "../firebase";
import { fetchTripsFromFirestore } from "../utils/firestore";

export default function TravelAI() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const [user, setUser] = useState(null);
  const [trips, setTrips] = useState([]);

  const chatEndRef = useRef(null);

  useEffect(() => {
    const currentUser = auth.currentUser;
    setUser(currentUser);

    const loadTrips = async () => {
      try {
        if (currentUser) {
          const data = await fetchTripsFromFirestore(currentUser.uid);
          setTrips(data || []);
        }
      } catch (err) {
        console.error(err);
      }
    };

    loadTrips();
  }, []);

  // 🔥 Auto scroll
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = { type: "user", text: input };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const aiResponse = await askTravelAI({
        message: input,
        user,
        trips,
      });

      const botMessage = { type: "bot", text: aiResponse };

      setMessages((prev) => [...prev, botMessage]);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        { type: "bot", text: "Something went wrong." },
      ]);
    }

    setLoading(false);
  };

  return (
    <Box
      sx={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        bgcolor: "#0f0f0f",
        color: "#fff",
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: 2,
          background: "rgba(255,255,255,0.05)",
          backdropFilter: "blur(10px)",
          borderBottom: "1px solid rgba(255,255,255,0.1)",
          display: "flex",
          alignItems: "center",
          gap: 1,
        }}
      >
        <SmartToyIcon />
        <Typography variant="h6" fontWeight="bold">
          BunkMate AI
        </Typography>
      </Box>

      {/* Chat Area */}
      <Box
        sx={{
          flex: 1,
          overflowY: "auto",
          p: 2,
        }}
      >
        <Stack spacing={2}>
          {messages.map((msg, index) => (
            <Box
              key={index}
              sx={{
                display: "flex",
                justifyContent:
                  msg.type === "user" ? "flex-end" : "flex-start",
              }}
            >
              <Stack direction="row" spacing={1} alignItems="flex-end">
                {msg.type === "bot" && (
                  <Avatar
                    sx={{
                      bgcolor: "#1f1f1f",
                      border: "1px solid rgba(255,255,255,0.1)",
                    }}
                  >
                    <SmartToyIcon />
                  </Avatar>
                )}

                <Paper
                  sx={{
                    p: 1.5,
                    maxWidth: "70%",
                    borderRadius: 3,
                    backdropFilter: "blur(12px)",
                    background:
                      msg.type === "user"
                        ? "linear-gradient(135deg, #000, #222)"
                        : "rgba(255,255,255,0.05)",
                    border:
                      msg.type === "bot"
                        ? "1px solid rgba(255,255,255,0.08)"
                        : "none",
                    color: "#fff",
                  }}
                >
                  <Typography variant="body2">
                    {msg.text}
                  </Typography>
                </Paper>

                {msg.type === "user" && (
                  <Avatar
                    sx={{
                      bgcolor: "#000",
                      border: "1px solid rgba(255,255,255,0.1)",
                    }}
                  >
                    <PersonIcon />
                  </Avatar>
                )}
              </Stack>
            </Box>
          ))}

          {loading && (
            <Typography variant="body2" sx={{ opacity: 0.6 }}>
              Thinking...
            </Typography>
          )}

          <div ref={chatEndRef} />
        </Stack>
      </Box>

      {/* Input */}
      <Box
        sx={{
          p: 2,
          borderTop: "1px solid rgba(255,255,255,0.1)",
          background: "rgba(255,255,255,0.03)",
          backdropFilter: "blur(10px)",
          display: "flex",
          gap: 1,
        }}
      >
        <TextField
          fullWidth
          placeholder="Ask about trips, budgets, routes..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          variant="outlined"
          sx={{
            "& .MuiOutlinedInput-root": {
              borderRadius: 3,
              color: "#fff",
              background: "rgba(255,255,255,0.05)",
              "& fieldset": {
                borderColor: "rgba(255,255,255,0.1)",
              },
              "&:hover fieldset": {
                borderColor: "rgba(255,255,255,0.2)",
              },
              "&.Mui-focused fieldset": {
                borderColor: "#fff",
              },
            },
            input: {
              color: "#fff",
            },
          }}
        />

        <IconButton
          onClick={handleSend}
          sx={{
            bgcolor: "#fff",
            color: "#000",
            "&:hover": {
              bgcolor: "#ddd",
            },
            borderRadius: 2,
            px: 2,
          }}
        >
          <SendIcon />
        </IconButton>
      </Box>
    </Box>
  );
}