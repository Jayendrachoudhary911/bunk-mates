import React from "react";
import {
  AppBar,
  Toolbar,
  Box,
  Typography,
  Avatar,
  IconButton,
  Tooltip,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBackIosNew";
import PhoneIcon from "@mui/icons-material/PhoneOutlined";
import VideoIcon from "@mui/icons-material/VideocamOutlined";
import InfoIcon from "@mui/icons-material/InfoOutlined";
import { useCall } from "../../contexts/CallContext";
import { safeImageUrl } from "../../utils/uiHelpers";

const ChatHeader = ({
  friendDetails,
  nickname,
  isFriendTyping,
  onBack,
  onOpenProfile,
  isEmbedded = false,
  effectiveChatTheme = "dark",
}) => {
  const { startCall } = useCall();
  const isDark = effectiveChatTheme === "dark";

  const displayName = nickname || friendDetails?.name || "Chat";
  const username = friendDetails?.username;
  const photoURL = safeImageUrl(friendDetails?.photoURL);

  const handleStartAudioCall = () => {
    if (!friendDetails) return;
    const targetUid = friendDetails.uid || friendDetails.id;
    startCall(
      {
        id: targetUid,
        uid: targetUid,
        name: displayName,
        photoURL: photoURL || "",
        username: username || "",
      },
      "audio"
    );
  };

  const handleStartVideoCall = () => {
    if (!friendDetails) return;
    const targetUid = friendDetails.uid || friendDetails.id;
    startCall(
      {
        id: targetUid,
        uid: targetUid,
        name: displayName,
        photoURL: photoURL || "",
        username: username || "",
      },
      "video"
    );
  };

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        backgroundColor: "transparent",
        backgroundImage: "none",
        color: isDark ? "#fff" : "#111",
        top: 0,
        zIndex: 1100,
        borderBottom: `0px solid ${
          isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.07)"
        }`,
        position: "sticky",
        overflow: "hidden",
      }}
    >
      <Toolbar
        sx={{
          position: "relative",
          zIndex: 1,
          display: "flex",
          justifyContent: "space-between",
          px: { xs: 1.5, sm: 2 },
          minHeight: { xs: 58, sm: 64 },
        }}
      >
        {/* Left: Back button + Avatar + Name + Typing status */}
        <Box sx={{ display: "flex", alignItems: "center", minWidth: 0, gap: 1 }}>
          {!isEmbedded && (
            <IconButton
              onClick={onBack}
              edge="start"
              size="small"
              sx={{
                color: isDark ? "rgba(255,255,255,0.85)" : "#222",
                p: 1,
                borderRadius: "50%",
                "&:hover": {
                  bgcolor: isDark
                    ? "rgba(255,255,255,0.1)"
                    : "rgba(0,0,0,0.06)",
                },
              }}
            >
              <ArrowBackIcon sx={{ fontSize: 18 }} />
            </IconButton>
          )}

          <Box
            onClick={onOpenProfile}
            sx={{
              display: "flex",
              alignItems: "center",
              cursor: "pointer",
              gap: 1.2,
              userSelect: "none",
              minWidth: 0,
            }}
          >
            <Avatar
              src={photoURL}
              alt={displayName}
              sx={{
                width: 38,
                height: 38,
                border: `2px solid ${
                  isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)"
                }`,
                bgcolor: isDark ? "#222" : "#e0e0e0",
                color: isDark ? "#fff" : "#111",
                fontSize: 16,
                fontWeight: 600,
              }}
            >
              {displayName?.[0]?.toUpperCase() || "?"}
            </Avatar>

            <Box sx={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
              <Typography
                variant="subtitle1"
                noWrap
                sx={{
                  fontWeight: 600,
                  fontSize: { xs: 15, sm: 16 },
                  color: isDark ? "#fff" : "#111",
                  letterSpacing: "-0.2px",
                  maxWidth: { xs: 150, sm: 260 },
                }}
              >
                {displayName}
              </Typography>

              {isFriendTyping ? (
                <Typography
                  variant="caption"
                  sx={{
                    color: "#00b7ff",
                    fontWeight: 600,
                    fontSize: "0.72rem",
                    animation: "pulse 1.5s infinite",
                  }}
                >
                  typing...
                </Typography>
              ) : username ? (
                <Typography
                  variant="caption"
                  noWrap
                  sx={{
                    color: isDark
                      ? "rgba(255,255,255,0.45)"
                      : "rgba(0,0,0,0.5)",
                    fontSize: "0.72rem",
                  }}
                >
                  @{username}
                </Typography>
              ) : null}
            </Box>
          </Box>
        </Box>

        {/* Right: Audio call, Video call, Profile/Info button */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          <Tooltip title="Voice Call">
            <IconButton
              onClick={handleStartAudioCall}
              size="small"
              sx={{
                color: isDark ? "rgba(255,255,255,0.75)" : "#333",
                p: 1,
                borderRadius: "50%",
                "&:hover": {
                  bgcolor: isDark
                    ? "rgba(255,255,255,0.1)"
                    : "rgba(0,0,0,0.06)",
                },
              }}
            >
              <PhoneIcon sx={{ fontSize: 20 }} />
            </IconButton>
          </Tooltip>

          <Tooltip title="Video Call">
            <IconButton
              onClick={handleStartVideoCall}
              size="small"
              sx={{
                color: isDark ? "rgba(255,255,255,0.75)" : "#333",
                p: 1,
                borderRadius: "50%",
                "&:hover": {
                  bgcolor: isDark
                    ? "rgba(255,255,255,0.1)"
                    : "rgba(0,0,0,0.06)",
                },
              }}
            >
              <VideoIcon sx={{ fontSize: 22 }} />
            </IconButton>
          </Tooltip>

          <Tooltip title="Chat Info">
            <IconButton
              onClick={onOpenProfile}
              size="small"
              sx={{
                color: isDark ? "rgba(255,255,255,0.75)" : "#333",
                p: 1,
                borderRadius: "50%",
                "&:hover": {
                  bgcolor: isDark
                    ? "rgba(255,255,255,0.1)"
                    : "rgba(0,0,0,0.06)",
                },
              }}
            >
              <InfoIcon sx={{ fontSize: 20 }} />
            </IconButton>
          </Tooltip>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default React.memo(ChatHeader);
