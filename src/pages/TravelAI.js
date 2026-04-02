import React, { useState, useEffect, useRef, memo } from "react";
import {
  Box, TextField, IconButton, Typography, Avatar, Paper, Fade, Collapse
} from "@mui/material";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import SmartToyRoundedIcon from "@mui/icons-material/SmartToyRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import CodeIcon from "@mui/icons-material/Code";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { askTravelAI } from "../utils/groq";
import { auth } from "../firebase";
import AIResponseRenderer from "../components/AIResponseRenderer";

import {
  getUserMemory,
  saveMessage,
  updateSummary,
} from "../utils/memory";

const JSONViewer = ({ data }) => (
  <Box sx={{ mt: 1, p: 1, bgcolor: "#020617", fontFamily: "monospace", fontSize: "0.75rem" }}>
    {JSON.stringify(data, null, 2)}
  </Box>
);

const ChatBubble = memo(({ msg }) => {
  const isUser = msg.type === "user";
  const [showJSON, setShowJSON] = useState(false);

  return (
    <Fade in>
      <Box sx={{ display: "flex", flexDirection: isUser ? "row-reverse" : "row", gap: 1, mb: 2 }}>
        <Avatar>{isUser ? <PersonRoundedIcon /> : <SmartToyRoundedIcon />}</Avatar>

        <Box>
          <Paper sx={{ p: 1.5 }}>
            {msg.isTyping ? "..." : (
              <>
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {msg.text}
                </ReactMarkdown>

                <AIResponseRenderer message={msg} />

                {msg.json && (
                  <>
                    <IconButton onClick={() => setShowJSON(!showJSON)}>
                      <CodeIcon />
                    </IconButton>

                    <Collapse in={showJSON}>
                      <JSONViewer data={msg.json} />
                    </Collapse>
                  </>
                )}
              </>
            )}
          </Paper>

          {msg.time && <Typography variant="caption">{msg.time}</Typography>}
        </Box>
      </Box>
    </Fade>
  );
});

export default function TravelAI() {
  const [messages, setMessages] = useState([]);
  const [summary, setSummary] = useState("");
  const [input, setInput] = useState("");
  const chatEndRef = useRef(null);
  const [preferences, setPreferences] = useState({});

  // 🔥 Load Firestore memory

  useEffect(() => {
  const load = async () => {
    if (!auth.currentUser) return;

    const data = await getUserMemory(auth.currentUser.uid);

    setSummary(data.summary || "");
    setMessages(data.messages || []);
    setPreferences(data.preferences || {}); // ✅ NEW
  };

  load();
}, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg = { type: "user", text: input };
    setMessages(prev => [...prev, userMsg]);

    await saveMessage(auth.currentUser.uid, userMsg);

    const id = Date.now();
    setMessages(prev => [...prev, { id, type: "bot", text: "", isTyping: true }]);

    const history = messages.slice(-6);

    let acc = "";

    try {
      const res = await askTravelAI({
        message: input,
        user: auth.currentUser,
        history,
        summary,
        onChunk: (c) => {
          acc += c;
          setMessages(prev =>
            prev.map(m => m.id === id ? { ...m, text: acc } : m)
          );
        }
      });

      const botMsg = {
        type: "bot",
        text: res.content || acc,
        json: res,
      };

      setMessages(prev =>
        prev.map(m => m.id === id ? { ...botMsg } : m)
      );

      await saveMessage(auth.currentUser.uid, botMsg);

      // 🔥 AUTO SUMMARIZATION
      if (messages.length % 10 === 0) {
        const summaryRes = await askTravelAI({
          message: "Summarize this conversation briefly",
          history: messages.slice(-10),
          user: auth.currentUser,
        });

        setSummary(summaryRes.content);
        await updateSummary(auth.currentUser.uid, summaryRes.content);
      }

    } catch {
      setMessages(prev =>
        prev.map(m => m.id === id ? { ...m, text: "Error", isTyping: false } : m)
      );
    }

    setInput("");
  };

  return (
    <Box sx={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      <Box sx={{ flex: 1, overflowY: "auto", p: 2 }}>
        {messages.map((m, i) => <ChatBubble key={m.id || i} msg={m} />)}
        <div ref={chatEndRef} />
      </Box>

      <Box sx={{ p: 2, display: "flex", gap: 1 }}>
        <TextField
          fullWidth
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
        />
        <IconButton onClick={handleSend}>
          <SendRoundedIcon />
        </IconButton>
      </Box>
    </Box>
  );
}