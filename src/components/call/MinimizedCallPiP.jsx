import React from "react";
import { Box, Typography, IconButton, Avatar, Paper, Tooltip, Stack } from "@mui/material";
import CallEndIcon from "@mui/icons-material/CallEnd";
import VideocamIcon from "@mui/icons-material/Videocam";
import VideocamOffIcon from "@mui/icons-material/VideocamOff";
import MicIcon from "@mui/icons-material/Mic";
import MicOffIcon from "@mui/icons-material/MicOff";
import OpenInFullIcon from "@mui/icons-material/OpenInFull";
import { motion } from "framer-motion";
import { resolveAvatar, DEFAULT_CALLER_AVATAR } from "./CallAssets";

export default function MinimizedCallPiP({
  peerName = "Jayendra choudhary",
  peerAvatar,
  isVideo = false,
  isGroupCall = false,
  groupName,
  duration = 0,
  formatCallTime,
  callStatus = "connected",
  isMuted = false,
  isVideoOff = false,
  hasRemoteVideo = false,
  attachRemoteVideo,
  onToggleMute,
  onToggleVideo,
  onEndCall,
  onExpand,
}) {
  const avatarSrc = resolveAvatar(peerAvatar, DEFAULT_CALLER_AVATAR);
  const title = isGroupCall ? (groupName || "Group Call") : peerName;
  const formattedTime = formatCallTime ? formatCallTime(duration) : "00:00";

  return (
    <motion.div
      drag
      dragConstraints={{ left: -400, right: 20, top: -500, bottom: 20 }}
      style={{
        position: "fixed",
        bottom: 24,
        right: 24,
        zIndex: 1400,
        cursor: "grab",
      }}
    >
      <Paper
        elevation={16}
        sx={{
          width: { xs: 260, sm: 300 },
          borderRadius: "22px",
          bgcolor: "rgba(15, 23, 42, 0.94)",
          backdropFilter: "blur(24px)",
          color: "#fff",
          overflow: "hidden",
          border: "1px solid rgba(255, 255, 255, 0.16)",
          boxShadow: "0 20px 50px rgba(0, 0, 0, 0.8)",
        }}
      >
        {/* Preview Screen */}
        <Box
          sx={{
            position: "relative",
            width: "100%",
            height: 155,
            bgcolor: "#070a13",
            overflow: "hidden",
          }}
        >
          {/* Remote Video Stream if active */}
          {isVideo ? (
            <video
              ref={attachRemoteVideo}
              autoPlay
              playsInline
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: hasRemoteVideo ? "block" : "none",
              }}
            />
          ) : null}

          {/* Fallback to Avatar with Ambient Glow */}
          {(!isVideo || !hasRemoteVideo) && (
            <Box
              sx={{
                width: "100%",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                background: "radial-gradient(circle at center, #1e293b 0%, #030712 100%)",
                position: "relative",
              }}
            >
              <Avatar
                src={avatarSrc}
                alt={title}
                sx={{
                  width: 58,
                  height: 58,
                  border: "2px solid rgba(56, 189, 248, 0.5)",
                  boxShadow: "0 8px 24px rgba(0,0,0,0.6)",
                  mb: 1,
                }}
              />
              <Typography variant="subtitle2" sx={{ fontWeight: 800, fontSize: "0.85rem" }}>
                {title}
              </Typography>
            </Box>
          )}

          {/* Top Status & Timer Pill */}
          <Box
            sx={{
              position: "absolute",
              top: 10,
              left: 10,
              bgcolor: "rgba(0, 0, 0, 0.65)",
              backdropFilter: "blur(12px)",
              px: 1.2,
              py: 0.3,
              borderRadius: "99px",
              display: "flex",
              alignItems: "center",
              gap: 0.8,
              border: "1px solid rgba(255, 255, 255, 0.12)",
            }}
          >
            <Box
              sx={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                bgcolor: callStatus === "connected" ? "#22c55e" : "#facc15",
                boxShadow: callStatus === "connected" ? "0 0 8px #22c55e" : "none",
              }}
            />
            <Typography variant="caption" sx={{ fontWeight: 800, fontSize: "0.72rem" }}>
              {callStatus === "connected" ? formattedTime : "Connecting..."}
            </Typography>
          </Box>

          {/* Expand to Fullscreen Button */}
          <Tooltip title="Expand Call View">
            <IconButton
              size="small"
              onClick={onExpand}
              sx={{
                position: "absolute",
                top: 10,
                right: 10,
                bgcolor: "rgba(0, 0, 0, 0.65)",
                color: "#fff",
                backdropFilter: "blur(12px)",
                border: "1px solid rgba(255, 255, 255, 0.12)",
                "&:hover": { bgcolor: "rgba(255, 255, 255, 0.25)" },
              }}
            >
              <OpenInFullIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Quick Bottom Control Bar */}
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-around"
          sx={{
            p: 1.2,
            bgcolor: "rgba(255, 255, 255, 0.03)",
            borderTop: "1px solid rgba(255, 255, 255, 0.08)",
          }}
        >
          {/* Mic */}
          <Tooltip title={isMuted ? "Unmute" : "Mute"}>
            <IconButton
              size="small"
              onClick={onToggleMute}
              sx={{
                color: isMuted ? "#ef4444" : "#fff",
                bgcolor: isMuted ? "rgba(239, 68, 68, 0.2)" : "rgba(255, 255, 255, 0.08)",
              }}
            >
              {isMuted ? <MicOffIcon sx={{ fontSize: 18 }} /> : <MicIcon sx={{ fontSize: 18 }} />}
            </IconButton>
          </Tooltip>

          {/* Video Toggle (for video calls) */}
          {isVideo && (
            <Tooltip title={isVideoOff ? "Turn Video On" : "Turn Video Off"}>
              <IconButton
                size="small"
                onClick={onToggleVideo}
                sx={{
                  color: isVideoOff ? "#ef4444" : "#fff",
                  bgcolor: isVideoOff ? "rgba(239, 68, 68, 0.2)" : "rgba(255, 255, 255, 0.08)",
                }}
              >
                {isVideoOff ? <VideocamOffIcon sx={{ fontSize: 18 }} /> : <VideocamIcon sx={{ fontSize: 18 }} />}
              </IconButton>
            </Tooltip>
          )}

          {/* End Call */}
          <Tooltip title="End Call">
            <IconButton
              size="small"
              onClick={onEndCall}
              sx={{
                color: "#fff",
                bgcolor: "#ef4444",
                boxShadow: "0 4px 12px rgba(239, 68, 68, 0.5)",
                "&:hover": { bgcolor: "#dc2626" },
              }}
            >
              <CallEndIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
        </Stack>
      </Paper>
    </motion.div>
  );
}
