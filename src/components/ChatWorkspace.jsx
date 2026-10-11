// src/components/ChatWorkspace.jsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Button,
  useTheme,
  useMediaQuery,
  Stack,
} from "@mui/material";
import {
  ChatBubbleOutline as ChatIcon,
  ExploreOutlined as ExploreIcon,
} from "../icons";
import Chatroom from "./Chatroom";
import GroupChat from "./GroupChat";
import { useDesktopPanel } from "../contexts/DesktopPanelContext";
import { useThemeToggle } from "../contexts/ThemeToggleContext";
import Chats from "../pages/Chats";

const ChatWorkspace = () => {
  const { friendId, groupName } = useParams();
  const navigate = useNavigate();
  const muiTheme = useTheme();
  const isDesktop = useMediaQuery(muiTheme.breakpoints.up("md"));
  const { mode } = useThemeToggle();
  const isDark = mode === "dark";

  const { openPanel } = useDesktopPanel();

  // Active chat state
  const [selectedChat, setSelectedChat] = useState(() => {
    if (friendId) return { type: "user", id: friendId };
    if (groupName) return { type: "group", id: groupName };
    return null;
  });

  // Keep selected chat in sync with route params
  useEffect(() => {
    if (friendId) {
      setSelectedChat({ type: "user", id: friendId });
    } else if (groupName) {
      setSelectedChat({ type: "group", id: groupName });
    }
  }, [friendId, groupName]);

  const handleSelectChat = (chat) => {
    setSelectedChat(chat);
    if (isDesktop) {
      if (chat.type === "user") {
        navigate(`/chat/${chat.id}`, { replace: true });
      } else {
        navigate(`/group/${chat.id}`, { replace: true });
      }
    } else {
      if (chat.type === "user") {
        navigate(`/chat/${chat.id}`);
      } else {
        navigate(`/group/${chat.id}`);
      }
    }
  };

  const handleOpenProfile = (profileData) => {
    if (isDesktop) {
      openPanel("chatProfile", profileData);
    } else {
      if (profileData?.id) {
        navigate(`/chat/${profileData.id}?profile`);
      }
    }
  };

  const handleOpenGroupInfo = (groupInfo) => {
    if (isDesktop) {
      openPanel("groupInfo", groupInfo);
    }
  };

  // ─── Mobile View ───
  if (!isDesktop) {
    if (friendId) {
      return <Chatroom />;
    }
    if (groupName) {
      return <GroupChat />;
    }
    return <Chats />;
  }

  // ─── Desktop Multi-Panel Chat View ───
  return (
    <Box
      sx={{
        display: "flex",
        width: "100%",
        height: "100%",
        overflow: "hidden",
        backgroundColor: isDark ? "#090909" : "#f5f6f9",
      }}
    >
      {/* ─── Left Side: Chat List (fetched directly from /pages/Chats.js) ─── */}
      <Box
        sx={{
          width: { md: 340, lg: 380 },
          flexShrink: 0,
          height: "100%",
          borderRight: `1px solid ${
            isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.08)"
          }`,
          backgroundColor: isDark ? "#0c0c0c" : "#f8f9fa",
          display: "flex",
          flexDirection: "column",
          overflowY: "auto",
          overflowX: "hidden",
        }}
      >
        <Chats
          isEmbedded={true}
          selectedChatId={selectedChat?.id}
          onSelectChat={handleSelectChat}
        />
      </Box>

      {/* ─── Center Side: Selected Chat Area ─── */}
      <Box
        sx={{
          flex: 1,
          minWidth: 0,
          height: "100%",
          display: "flex",
          flexDirection: "column",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {selectedChat?.type === "user" ? (
          <Chatroom
            key={selectedChat.id}
            friendIdProp={selectedChat.id}
            isEmbedded={true}
            onOpenProfile={handleOpenProfile}
          />
        ) : selectedChat?.type === "group" ? (
          <GroupChat
            key={selectedChat.id}
            groupNameProp={selectedChat.id}
            isEmbedded={true}
            onOpenGroupInfo={handleOpenGroupInfo}
          />
        ) : (
          /* Empty State when no conversation is selected */
          <Box
            sx={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              p: 4,
              textAlign: "center",
              userSelect: "none",
            }}
          >
            <Box
              sx={{
                width: 88,
                height: 88,
                borderRadius: "28px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                mb: 2.5,
                background: isDark
                  ? "linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02))"
                  : "linear-gradient(135deg, rgba(0,0,0,0.06), rgba(0,0,0,0.01))",
                border: `1px solid ${
                  isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)"
                }`,
                boxShadow: isDark
                  ? "0 12px 32px rgba(0,0,0,0.3)"
                  : "0 8px 24px rgba(0,0,0,0.04)",
              }}
            >
              <ChatIcon
                sx={{
                  fontSize: 40,
                  color: isDark ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.6)",
                }}
              />
            </Box>

            <Typography
              variant="h5"
              sx={{
                fontWeight: 700,
                letterSpacing: "-0.4px",
                mb: 1,
                color: isDark ? "#fff" : "#111",
              }}
            >
              Select a Conversation
            </Typography>

            <Typography
              variant="body2"
              sx={{
                color: isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)",
                maxWidth: 380,
                lineHeight: 1.5,
                mb: 3,
              }}
            >
              Pick a chat from the left sidebar to start messaging, plan upcoming trips, or share notes with friends.
            </Typography>

            <Stack direction="row" spacing={1.5}>
              <Button
                variant="outlined"
                startIcon={<ExploreIcon sx={{ fontSize: 18 }} />}
                onClick={() => navigate("/trips")}
                sx={{
                  borderRadius: 3,
                  py: 1,
                  px: 2.5,
                  textTransform: "none",
                  fontWeight: 600,
                  color: isDark ? "#fff" : "#111",
                  borderColor: isDark
                    ? "rgba(255,255,255,0.15)"
                    : "rgba(0,0,0,0.15)",
                }}
              >
                Explore Trips
              </Button>
            </Stack>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default ChatWorkspace;
