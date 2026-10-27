import React from "react";
import { Box, Typography, IconButton, Avatar, Stack, Tooltip, useMediaQuery, useTheme } from "@mui/material";
import CallEndIcon from "@mui/icons-material/CallEnd";
import VideocamIcon from "@mui/icons-material/Videocam";
import VideocamOffIcon from "@mui/icons-material/VideocamOff";
import MicIcon from "@mui/icons-material/Mic";
import MicOffIcon from "@mui/icons-material/MicOff";
import VolumeUpIcon from "@mui/icons-material/VolumeUp";
import VolumeOffIcon from "@mui/icons-material/VolumeOff";
import ScreenShareIcon from "@mui/icons-material/ScreenShare";
import StopScreenShareIcon from "@mui/icons-material/StopScreenShare";
import CloseFullscreenIcon from "@mui/icons-material/CloseFullscreen";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import GraphicEqIcon from "@mui/icons-material/GraphicEq";
import SettingsIcon from "@mui/icons-material/Settings";
import PersonAddAlt1Icon from "@mui/icons-material/PersonAddAlt1";
import { resolveGroupMembers } from "./CallAssets";

export default function GroupVideoOngoing({
  groupName = "Bunk1",
  members = [],
  currentUser,
  duration = 0,
  formatCallTime,
  isMuted = false,
  isVideoOff = false,
  isSpeakerOn = true,
  isScreenSharing = false,
  hasRemoteVideo = false,
  callStatus = "connected",
  attachLocalVideo,
  attachRemoteVideo,
  onToggleMute,
  onToggleVideo,
  onToggleSpeaker,
  onToggleScreenShare,
  onEndCall,
  onMinimize,
  onToggleChat,
  onToggleReactions,
  onOpenSettings,
  onAddMember,
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const displayMembers = resolveGroupMembers(members, currentUser);
  const formattedTime = formatCallTime ? formatCallTime(duration) : "00:00";

  return (
    <Box
      sx={{
        position: "relative",
        width: "100%",
        height: "100%",
        overflow: "hidden",
        bgcolor: "#030712",
        color: "#fff",
        userSelect: "none",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* 1. The 2x2 Video Tiles Grid (Matching Figma Mockup) */}
      <Box
        sx={{
          flex: 1,
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gridTemplateRows: "1fr 1fr",
          gap: { xs: "3px", sm: "6px" },
          p: { xs: "3px", sm: "6px" },
          bgcolor: "#020617",
          position: "relative",
          zIndex: 0,
        }}
      >
        {/* Tile 1: Top-Left (Cat / Saini) */}
        <Box
          sx={{
            position: "relative",
            borderRadius: { xs: "12px", sm: "16px" },
            overflow: "hidden",
            bgcolor: "#0b1329",
            border: displayMembers[0]?.isSpeaking
              ? "2px solid #22c55e"
              : "1px solid rgba(255, 255, 255, 0.08)",
            boxShadow: displayMembers[0]?.isSpeaking
              ? "0 0 20px rgba(34, 197, 94, 0.3)"
              : "none",
          }}
        >
          {/* Tile Video / Avatar */}
          <Box
            component="img"
            src={displayMembers[0]?.photoURL}
            alt={displayMembers[0]?.name}
            sx={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />

          {/* Participant Name Badge & Speaking Wave */}
          <Box
            sx={{
              position: "absolute",
              bottom: { xs: 8, sm: 14 },
              left: { xs: 8, sm: 14 },
              display: "flex",
              alignItems: "center",
              gap: 0.8,
              px: { xs: 1, sm: 1.4 },
              py: { xs: 0.3, sm: 0.5 },
              borderRadius: "99px",
              bgcolor: "rgba(0, 0, 0, 0.65)",
              backdropFilter: "blur(12px)",
              border: "1px solid rgba(255, 255, 255, 0.12)",
            }}
          >
            <GraphicEqIcon sx={{ fontSize: { xs: 14, sm: 16 }, color: "#22c55e" }} />
            <Typography variant="caption" sx={{ fontWeight: 800, fontSize: { xs: "0.7rem", sm: "0.8rem" } }}>
              {displayMembers[0]?.name}
            </Typography>
          </Box>
        </Box>

        {/* Tile 2: Top-Right (Luffy / Deepesh) */}
        <Box
          sx={{
            position: "relative",
            borderRadius: { xs: "12px", sm: "16px" },
            overflow: "hidden",
            bgcolor: "#0b1329",
            border: displayMembers[1]?.isSpeaking
              ? "2px solid #ef4444"
              : "1px solid rgba(255, 255, 255, 0.08)",
          }}
        >
          <Box
            component="img"
            src={displayMembers[1]?.photoURL}
            alt={displayMembers[1]?.name}
            sx={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />

          <Box
            sx={{
              position: "absolute",
              bottom: { xs: 8, sm: 14 },
              left: { xs: 8, sm: 14 },
              display: "flex",
              alignItems: "center",
              gap: 0.8,
              px: { xs: 1, sm: 1.4 },
              py: { xs: 0.3, sm: 0.5 },
              borderRadius: "99px",
              bgcolor: "rgba(0, 0, 0, 0.65)",
              backdropFilter: "blur(12px)",
              border: "1px solid rgba(255, 255, 255, 0.12)",
            }}
          >
            <Typography variant="caption" sx={{ fontWeight: 800, fontSize: { xs: "0.7rem", sm: "0.8rem" } }}>
              {displayMembers[1]?.name}
            </Typography>
          </Box>
        </Box>

        {/* Tile 3: Bottom-Left (Minion / Bunk) */}
        <Box
          sx={{
            position: "relative",
            borderRadius: { xs: "12px", sm: "16px" },
            overflow: "hidden",
            bgcolor: "#0b1329",
            border: displayMembers[2]?.isSpeaking
              ? "2px solid #facc15"
              : "1px solid rgba(255, 255, 255, 0.08)",
          }}
        >
          <Box
            component="img"
            src={displayMembers[2]?.photoURL}
            alt={displayMembers[2]?.name}
            sx={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />

          <Box
            sx={{
              position: "absolute",
              bottom: { xs: 8, sm: 14 },
              left: { xs: 8, sm: 14 },
              display: "flex",
              alignItems: "center",
              gap: 0.8,
              px: { xs: 1, sm: 1.4 },
              py: { xs: 0.3, sm: 0.5 },
              borderRadius: "99px",
              bgcolor: "rgba(0, 0, 0, 0.65)",
              backdropFilter: "blur(12px)",
              border: "1px solid rgba(255, 255, 255, 0.12)",
            }}
          >
            <Typography variant="caption" sx={{ fontWeight: 800, fontSize: { xs: "0.7rem", sm: "0.8rem" } }}>
              {displayMembers[2]?.name}
            </Typography>
          </Box>
        </Box>

        {/* Tile 4: Bottom-Right (Jayendra / Local Camera Feed) */}
        <Box
          sx={{
            position: "relative",
            borderRadius: { xs: "12px", sm: "16px" },
            overflow: "hidden",
            bgcolor: "#0b1329",
            border: displayMembers[3]?.isSpeaking
              ? "2px solid #38bdf8"
              : "1px solid rgba(255, 255, 255, 0.08)",
            boxShadow: displayMembers[3]?.isSpeaking
              ? "0 0 20px rgba(56, 189, 248, 0.35)"
              : "none",
          }}
        >
          {/* Local Camera Video Stream */}
          <video
            ref={attachLocalVideo}
            autoPlay
            playsInline
            muted
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              transform: !isScreenSharing ? "scaleX(-1)" : "none",
              display: isVideoOff ? "none" : "block",
            }}
          />

          {/* Fallback to Avatar when camera is turned off */}
          {isVideoOff && (
            <Box
              sx={{
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                bgcolor: "#111827",
              }}
            >
              <Avatar
                src={displayMembers[3]?.photoURL}
                alt={displayMembers[3]?.name}
                sx={{
                  width: { xs: 68, sm: 90 },
                  height: { xs: 68, sm: 90 },
                  border: "3px solid #38bdf8",
                }}
              />
            </Box>
          )}

          {/* Participant Name Badge with Mic Status */}
          <Box
            sx={{
              position: "absolute",
              bottom: { xs: 8, sm: 14 },
              left: { xs: 8, sm: 14 },
              display: "flex",
              alignItems: "center",
              gap: 0.8,
              px: { xs: 1, sm: 1.4 },
              py: { xs: 0.3, sm: 0.5 },
              borderRadius: "99px",
              bgcolor: "rgba(0, 0, 0, 0.65)",
              backdropFilter: "blur(12px)",
              border: "1px solid rgba(255, 255, 255, 0.12)",
            }}
          >
            {isMuted ? (
              <MicOffIcon sx={{ fontSize: { xs: 14, sm: 16 }, color: "#ef4444" }} />
            ) : (
              <GraphicEqIcon sx={{ fontSize: { xs: 14, sm: 16 }, color: "#38bdf8" }} />
            )}
            <Typography variant="caption" sx={{ fontWeight: 800, fontSize: { xs: "0.7rem", sm: "0.8rem" } }}>
              {displayMembers[3]?.name} (You)
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* 2. Top Header Navigation (Mobile View) */}
      {isMobile && (
        <Box
          sx={{
            position: "absolute",
            top: 14,
            left: 14,
            right: 14,
            zIndex: 10,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              px: 1.6,
              py: 0.5,
              borderRadius: "99px",
              bgcolor: "rgba(15, 23, 42, 0.8)",
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(255, 255, 255, 0.12)",
            }}
          >
            <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "#22c55e", boxShadow: "0 0 10px #22c55e" }} />
            <Typography variant="caption" sx={{ fontWeight: 800 }}>
              {groupName} • {formattedTime}
            </Typography>
          </Box>

          <IconButton
            size="small"
            onClick={onMinimize}
            sx={{
              bgcolor: "rgba(15, 23, 42, 0.8)",
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              color: "#fff",
            }}
          >
            <CloseFullscreenIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Box>
      )}

      {/* 3. Bottom Floating Frosted Glass Action Dock */}
      <Box
        sx={{
          position: "absolute",
          bottom: { xs: 16, sm: 28 },
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 15,
          display: "flex",
          alignItems: "center",
          width: "auto",
        }}
      >
        <Stack
          direction="row"
          spacing={{ xs: 1.2, sm: 2 }}
          alignItems="center"
          sx={{
            p: 1.1,
            px: { xs: 2, sm: 3 },
            borderRadius: "99px",
            bgcolor: "rgba(15, 23, 42, 0.84)",
            backdropFilter: "blur(28px)",
            border: "1px solid rgba(255, 255, 255, 0.14)",
            boxShadow: "0 20px 50px rgba(0, 0, 0, 0.75)",
          }}
        >
          {/* Desktop Left Info Pill Badge */}
          {!isMobile && (
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                pr: 2,
                borderRight: "1px solid rgba(255, 255, 255, 0.15)",
              }}
            >
              <Typography variant="caption" sx={{ color: "#facc15", fontWeight: 700, fontSize: "0.75rem" }}>
                {formattedTime}
              </Typography>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "#fff", lineHeight: 1.2 }}>
                {groupName}
              </Typography>
            </Box>
          )}

          {/* Speakerphone Toggle (Mobile & Desktop) */}
          <Tooltip title={isSpeakerOn ? "Speakerphone On" : "Speakerphone Off"}>
            <IconButton
              onClick={onToggleSpeaker}
              sx={{
                width: { xs: 46, sm: 50 },
                height: { xs: 46, sm: 50 },
                color: isSpeakerOn ? "#38bdf8" : "#fff",
                bgcolor: isSpeakerOn ? "rgba(56, 189, 248, 0.16)" : "rgba(255, 255, 255, 0.08)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              {isSpeakerOn ? <VolumeUpIcon sx={{ fontSize: 22 }} /> : <VolumeOffIcon sx={{ fontSize: 22 }} />}
            </IconButton>
          </Tooltip>

          {/* Mic Toggle */}
          <Tooltip title={isMuted ? "Unmute Mic" : "Mute Mic"}>
            <IconButton
              onClick={onToggleMute}
              sx={{
                width: { xs: 46, sm: 50 },
                height: { xs: 46, sm: 50 },
                bgcolor: isMuted ? "rgba(239, 68, 68, 0.2)" : "rgba(255, 255, 255, 0.08)",
                color: isMuted ? "#ef4444" : "#fff",
                border: isMuted ? "1px solid #ef4444" : "1px solid rgba(255,255,255,0.08)",
              }}
            >
              {isMuted ? <MicOffIcon sx={{ fontSize: 22 }} /> : <MicIcon sx={{ fontSize: 22 }} />}
            </IconButton>
          </Tooltip>

          {/* Video Toggle */}
          <Tooltip title={isVideoOff ? "Turn Camera On" : "Turn Camera Off"}>
            <IconButton
              onClick={onToggleVideo}
              sx={{
                width: { xs: 46, sm: 50 },
                height: { xs: 46, sm: 50 },
                bgcolor: isVideoOff ? "rgba(239, 68, 68, 0.2)" : "rgba(255, 255, 255, 0.08)",
                color: isVideoOff ? "#ef4444" : "#fff",
                border: isVideoOff ? "1px solid #ef4444" : "1px solid rgba(255,255,255,0.08)",
              }}
            >
              {isVideoOff ? <VideocamOffIcon sx={{ fontSize: 22 }} /> : <VideocamIcon sx={{ fontSize: 22 }} />}
            </IconButton>
          </Tooltip>

          {/* Red End Call Hero Button */}
          <Tooltip title="Leave Group Call">
            <IconButton
              onClick={onEndCall}
              sx={{
                width: { xs: 52, sm: 58 },
                height: { xs: 52, sm: 58 },
                bgcolor: "#ef4444",
                color: "#fff",
                boxShadow: "0 10px 30px rgba(239, 68, 68, 0.6)",
                transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                "&:hover": {
                  bgcolor: "#dc2626",
                  transform: "scale(1.08)",
                  boxShadow: "0 12px 35px rgba(239, 68, 68, 0.75)",
                },
              }}
            >
              <CallEndIcon sx={{ fontSize: { xs: 26, sm: 30 } }} />
            </IconButton>
          </Tooltip>

          {/* Screen Share (Desktop only) */}
          {!isMobile && (
            <Tooltip title={isScreenSharing ? "Stop Screen Share" : "Share Screen"}>
              <IconButton
                onClick={onToggleScreenShare}
                sx={{
                  width: 50,
                  height: 50,
                  bgcolor: isScreenSharing ? "rgba(34, 197, 94, 0.2)" : "rgba(255, 255, 255, 0.08)",
                  color: isScreenSharing ? "#22c55e" : "#fff",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                {isScreenSharing ? <StopScreenShareIcon sx={{ fontSize: 22 }} /> : <ScreenShareIcon sx={{ fontSize: 22 }} />}
              </IconButton>
            </Tooltip>
          )}

          {/* Emoji Reactions */}
          <Tooltip title="Send Reactions">
            <IconButton
              onClick={onToggleReactions}
              sx={{
                width: { xs: 46, sm: 50 },
                height: { xs: 46, sm: 50 },
                bgcolor: "rgba(255, 255, 255, 0.08)",
                color: "#facc15",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <AutoAwesomeIcon sx={{ fontSize: 22 }} />
            </IconButton>
          </Tooltip>

            {/* Add Person */}
            <Tooltip title="Add Person to Call">
              <IconButton
                onClick={onAddMember}
                sx={{
                  width: { xs: 46, sm: 50 },
                  height: { xs: 46, sm: 50 },
                  bgcolor: "rgba(34, 197, 94, 0.18)",
                  color: "#22c55e",
                  border: "1px solid rgba(34, 197, 94, 0.3)",
                  "&:hover": { bgcolor: "rgba(34, 197, 94, 0.3)" },
                }}
              >
                <PersonAddAlt1Icon sx={{ fontSize: 22 }} />
              </IconButton>
            </Tooltip>

            {/* In-Call Chat Drawer */}
            <Tooltip title="In-Call Chat">
              <IconButton
                onClick={onToggleChat}
                sx={{
                  width: { xs: 46, sm: 50 },
                  height: { xs: 46, sm: 50 },
                  bgcolor: "rgba(255, 255, 255, 0.08)",
                  color: "#fff",
                  border: "1px solid rgba(255,255,255,0.08)",
                  "&:hover": { bgcolor: "rgba(255, 255, 255, 0.2)" },
                }}
              >
                <ChatBubbleOutlineIcon sx={{ fontSize: 22 }} />
              </IconButton>
            </Tooltip>

            {/* Device Settings */}
            <Tooltip title="Audio & Video Settings">
              <IconButton
                onClick={onOpenSettings}
                sx={{
                  width: { xs: 46, sm: 50 },
                  height: { xs: 46, sm: 50 },
                  bgcolor: "rgba(255, 255, 255, 0.08)",
                  color: "#fff",
                  border: "1px solid rgba(255,255,255,0.08)",
                  "&:hover": { bgcolor: "rgba(255, 255, 255, 0.2)" },
                }}
              >
                <SettingsIcon sx={{ fontSize: 22 }} />
              </IconButton>
            </Tooltip>
          </Stack>
        </Box>
      )}
    </Box>
  );
}
