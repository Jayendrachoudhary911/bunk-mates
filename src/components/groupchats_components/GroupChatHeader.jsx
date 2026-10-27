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
import ProgressiveBlur from "../ProgressiveBlur";

const GroupChatHeader = ({
  groupInfo,
  groupName,
  typingMembers = [],
  onBack,
  onOpenGroupInfo,
  isEmbedded = false,
  effectiveChatTheme = "dark",
}) => {
  const { startCall } = useCall();
  const isDark = effectiveChatTheme === "dark";

  const displayName = groupInfo?.name || groupName || "Group Chat";
  const memberCount = groupInfo?.members?.length || 0;
  const iconURL = safeImageUrl(groupInfo?.iconURL);
  const emoji = groupInfo?.emoji;

  const handleGroupAudioCall = () => {
    if (!groupInfo) return;
    startCall(
      {
        id: groupName,
        uid: groupName,
        name: displayName,
        photoURL: iconURL || "",
        isGroup: true,
      },
      "audio"
    );
  };

  const handleGroupVideoCall = () => {
    if (!groupInfo) return;
    startCall(
      {
        id: groupName,
        uid: groupName,
        name: displayName,
        photoURL: iconURL || "",
        isGroup: true,
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
      <ProgressiveBlur
        mode={isDark ? "dark" : "light"}
        direction="bottom"
        height="100%"
        blur="20px"
      />
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
        {/* Left: Back + Avatar + Group Info */}
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
            onClick={onOpenGroupInfo}
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
              src={iconURL}
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
              {emoji || displayName?.[0]?.toUpperCase() || "👥"}
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

              {typingMembers && typingMembers.length > 0 ? (
                <Typography
                  variant="caption"
                  noWrap
                  sx={{
                    color: isDark ? "#00b7ff" : "#0288d1",
                    fontSize: "0.72rem",
                    fontWeight: 600,
                    letterSpacing: "-0.1px",
                  }}
                >
                  {typingMembers.length === 1
                    ? `${typingMembers[0]} is typing...`
                    : typingMembers.length === 2
                    ? `${typingMembers[0]} & ${typingMembers[1]} are typing...`
                    : `${typingMembers[0]} & ${typingMembers.length - 1} others are typing...`}
                </Typography>
              ) : (
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
                  {memberCount} member{memberCount === 1 ? "" : "s"}
                </Typography>
              )}
            </Box>
          </Box>
        </Box>

        {/* Right: Call icons + Group Info trigger */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          <Tooltip title="Group Voice Call">
            <IconButton
              onClick={handleGroupAudioCall}
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

          <Tooltip title="Group Video Call">
            <IconButton
              onClick={handleGroupVideoCall}
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

          <Tooltip title="Group Info">
            <IconButton
              onClick={onOpenGroupInfo}
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

export default React.memo(GroupChatHeader);
