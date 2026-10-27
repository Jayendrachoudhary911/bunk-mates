import React from "react";
import { Box, Typography, IconButton, Avatar, Stack, Tooltip } from "@mui/material";
import CallEndIcon from "@mui/icons-material/CallEnd";
import MicIcon from "@mui/icons-material/Mic";
import MicOffIcon from "@mui/icons-material/MicOff";
import VolumeUpIcon from "@mui/icons-material/VolumeUp";
import VolumeOffIcon from "@mui/icons-material/VolumeOff";
import CloseFullscreenIcon from "@mui/icons-material/CloseFullscreen";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import PersonAddAlt1Icon from "@mui/icons-material/PersonAddAlt1";
import SettingsIcon from "@mui/icons-material/Settings";
import { resolveGroupMembers } from "./CallAssets";

export default function GroupAudioOngoing({
  groupName = "Bunk1",
  members = [],
  currentUser,
  duration = 0,
  formatCallTime,
  isMuted = false,
  isSpeakerOn = true,
  callStatus = "connected",
  onToggleMute,
  onToggleSpeaker,
  onEndCall,
  onMinimize,
  onToggleChat,
  onToggleReactions,
  onAddMember,
  onOpenSettings,
}) {
  const displayMembers = resolveGroupMembers(members, currentUser);
  const formattedTime = formatCallTime ? formatCallTime(duration) : "00:00";

  return (
    <Box
      sx={{
        position: "relative",
        width: "100%",
        height: "100%",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "space-between",
        bgcolor: "#020617",
        color: "#fff",
        py: { xs: 5, sm: 7 },
        px: 3,
        userSelect: "none",
      }}
    >
      {/* Warm Ambient Blurred Backdrop (Matching Figma Row 3 Column 4) */}
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          background: `
            radial-gradient(circle at 50% 25%, rgba(250, 204, 21, 0.38) 0%, transparent 60%),
            radial-gradient(circle at 20% 65%, rgba(34, 197, 94, 0.35) 0%, transparent 55%),
            radial-gradient(circle at 80% 65%, rgba(14, 165, 233, 0.35) 0%, transparent 55%),
            #0a0f1d
          `,
          filter: "blur(45px)",
          transform: "scale(1.2)",
          zIndex: 0,
        }}
      />

      {/* Dark Vignette Overlay */}
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          background: "radial-gradient(circle at center, rgba(0,0,0,0.1) 0%, rgba(2, 6, 23, 0.8) 100%)",
          zIndex: 1,
        }}
      />

      {/* Top Header Section */}
      <Box
        sx={{
          position: "relative",
          zIndex: 2,
          width: "100%",
          maxWidth: 900,
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
        }}
      >
        {/* Top-Left Minimize Button */}
        <Tooltip title="Minimize to PiP">
          <IconButton
            onClick={onMinimize}
            sx={{
              width: 44,
              height: 44,
              borderRadius: "50%",
              bgcolor: "rgba(255, 255, 255, 0.08)",
              backdropFilter: "blur(16px)",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              color: "#fff",
              transition: "all 0.2s ease",
              "&:hover": {
                bgcolor: "rgba(255, 255, 255, 0.2)",
                transform: "scale(1.06)",
              },
            }}
          >
            <CloseFullscreenIcon sx={{ fontSize: 20 }} />
          </IconButton>
        </Tooltip>

        {/* Center Group Info & Live Timer */}
        <Box sx={{ textAlign: "center", flex: 1, px: 2 }}>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 800,
              fontSize: { xs: "1.9rem", sm: "2.5rem" },
              letterSpacing: "-0.5px",
              color: "#ffffff",
              textShadow: "0 4px 20px rgba(0,0,0,0.6)",
            }}
          >
            {groupName}
          </Typography>

          <Typography
            variant="subtitle2"
            sx={{
              color: "rgba(255, 255, 255, 0.75)",
              fontSize: { xs: "0.85rem", sm: "0.95rem" },
              mt: 0.5,
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 1,
            }}
          >
            <span>Ongoing group audio call</span>
            <span style={{ opacity: 0.4 }}>•</span>
            <span style={{ color: "#facc15", fontWeight: 700 }}>
              {callStatus === "connected" ? formattedTime : "Connecting..."}
            </span>
          </Typography>
        </Box>

        {/* Top-Right Add Member / In-Call Chat */}
        <Tooltip title="In-Call Chat">
          <IconButton
            onClick={onToggleChat}
            sx={{
              width: 44,
              height: 44,
              borderRadius: "50%",
              bgcolor: "rgba(255, 255, 255, 0.08)",
              backdropFilter: "blur(16px)",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              color: "#fff",
              transition: "all 0.2s ease",
              "&:hover": {
                bgcolor: "rgba(255, 255, 255, 0.2)",
                transform: "scale(1.06)",
              },
            }}
          >
            <ChatBubbleOutlineIcon sx={{ fontSize: 20 }} />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Center Section: Dynamic Floating Participants Canvas (Matching Figma Row 3 Column 4) */}
      <Box
        sx={{
          position: "relative",
          zIndex: 2,
          width: "100%",
          maxWidth: { xs: 340, sm: 600 },
          height: { xs: 280, sm: 340 },
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          my: "auto",
        }}
      >
        {/* Participant 1: Top-Left (Jayendra) */}
        {displayMembers[3] && (
          <Box
            sx={{
              position: "absolute",
              top: { xs: "5%", sm: "8%" },
              left: { xs: "8%", sm: "14%" },
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 1,
            }}
          >
            <Box sx={{ position: "relative" }}>
              {/* Speaking Ripple Wave */}
              <Box
                sx={{
                  position: "absolute",
                  inset: -8,
                  borderRadius: "50%",
                  border: "2px solid #38bdf8",
                  animation: "audioPulseParticipant 2s infinite ease-out",
                  "@keyframes audioPulseParticipant": {
                    "0%": { transform: "scale(0.9)", opacity: 0.8 },
                    "100%": { transform: "scale(1.3)", opacity: 0 },
                  },
                }}
              />
              <Avatar
                src={displayMembers[3].photoURL}
                alt={displayMembers[3].name}
                sx={{
                  width: { xs: 72, sm: 88 },
                  height: { xs: 72, sm: 88 },
                  border: "3px solid #38bdf8",
                  boxShadow: "0 8px 24px rgba(56, 189, 248, 0.45)",
                }}
              />
            </Box>
            <Box
              sx={{
                px: 1.2,
                py: 0.3,
                borderRadius: "99px",
                bgcolor: "rgba(0, 0, 0, 0.55)",
                backdropFilter: "blur(10px)",
                border: "1px solid rgba(255, 255, 255, 0.12)",
                fontSize: "0.75rem",
                fontWeight: 700,
                color: "#fff",
              }}
            >
              {displayMembers[3].name} {displayMembers[3].isMe ? "(You)" : ""}
            </Box>
          </Box>
        )}

        {/* Participant 2: Top-Right (Minion / Yellow) */}
        {displayMembers[2] && (
          <Box
            sx={{
              position: "absolute",
              top: { xs: "8%", sm: "10%" },
              right: { xs: "8%", sm: "14%" },
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 1,
            }}
          >
            <Box sx={{ position: "relative" }}>
              <Avatar
                src={displayMembers[2].photoURL}
                alt={displayMembers[2].name}
                sx={{
                  width: { xs: 72, sm: 88 },
                  height: { xs: 72, sm: 88 },
                  border: "3px solid #facc15",
                  boxShadow: "0 8px 24px rgba(250, 204, 21, 0.4)",
                }}
              />
            </Box>
            <Box
              sx={{
                px: 1.2,
                py: 0.3,
                borderRadius: "99px",
                bgcolor: "rgba(0, 0, 0, 0.55)",
                backdropFilter: "blur(10px)",
                border: "1px solid rgba(255, 255, 255, 0.12)",
                fontSize: "0.75rem",
                fontWeight: 700,
                color: "#fff",
              }}
            >
              {displayMembers[2].name}
            </Box>
          </Box>
        )}

        {/* Participant 3: Bottom-Left (Luffy / Red) */}
        {displayMembers[1] && (
          <Box
            sx={{
              position: "absolute",
              bottom: { xs: "8%", sm: "10%" },
              left: { xs: "12%", sm: "18%" },
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 1,
            }}
          >
            <Box sx={{ position: "relative" }}>
              <Avatar
                src={displayMembers[1].photoURL}
                alt={displayMembers[1].name}
                sx={{
                  width: { xs: 72, sm: 88 },
                  height: { xs: 72, sm: 88 },
                  border: "3px solid #ef4444",
                  boxShadow: "0 8px 24px rgba(239, 68, 68, 0.4)",
                }}
              />
            </Box>
            <Box
              sx={{
                px: 1.2,
                py: 0.3,
                borderRadius: "99px",
                bgcolor: "rgba(0, 0, 0, 0.55)",
                backdropFilter: "blur(10px)",
                border: "1px solid rgba(255, 255, 255, 0.12)",
                fontSize: "0.75rem",
                fontWeight: 700,
                color: "#fff",
              }}
            >
              {displayMembers[1].name}
            </Box>
          </Box>
        )}

        {/* Participant 4: Bottom-Right (Cat / Green) */}
        {displayMembers[0] && (
          <Box
            sx={{
              position: "absolute",
              bottom: { xs: "5%", sm: "6%" },
              right: { xs: "12%", sm: "18%" },
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 1,
            }}
          >
            <Box sx={{ position: "relative" }}>
              {/* Speaking Ripple Wave */}
              <Box
                sx={{
                  position: "absolute",
                  inset: -8,
                  borderRadius: "50%",
                  border: "2px solid #22c55e",
                  animation: "audioPulseParticipant2 2.2s infinite ease-out 0.4s",
                  "@keyframes audioPulseParticipant2": {
                    "0%": { transform: "scale(0.9)", opacity: 0.8 },
                    "100%": { transform: "scale(1.3)", opacity: 0 },
                  },
                }}
              />
              <Avatar
                src={displayMembers[0].photoURL}
                alt={displayMembers[0].name}
                sx={{
                  width: { xs: 72, sm: 88 },
                  height: { xs: 72, sm: 88 },
                  border: "3px solid #22c55e",
                  boxShadow: "0 8px 24px rgba(34, 197, 94, 0.45)",
                }}
              />
            </Box>
            <Box
              sx={{
                px: 1.2,
                py: 0.3,
                borderRadius: "99px",
                bgcolor: "rgba(0, 0, 0, 0.55)",
                backdropFilter: "blur(10px)",
                border: "1px solid rgba(255, 255, 255, 0.12)",
                fontSize: "0.75rem",
                fontWeight: 700,
                color: "#fff",
              }}
            >
              {displayMembers[0].name}
            </Box>
          </Box>
        )}
      </Box>

      {/* Bottom Floating Frosted Glass Action Dock */}
      <Box
        sx={{
          position: "relative",
          zIndex: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          maxWidth: 550,
        }}
      >
        <Stack
          direction="row"
          spacing={{ xs: 1.5, sm: 2.2 }}
          alignItems="center"
          sx={{
            p: 1.2,
            px: { xs: 2.2, sm: 3.5 },
            borderRadius: "99px",
            bgcolor: "rgba(15, 23, 42, 0.82)",
            backdropFilter: "blur(28px)",
            border: "1px solid rgba(255, 255, 255, 0.12)",
            boxShadow: "0 20px 50px rgba(0, 0, 0, 0.7)",
          }}
        >
          {/* Mic Mute/Unmute */}
          <Tooltip title={isMuted ? "Unmute Mic" : "Mute Mic"}>
            <IconButton
              onClick={onToggleMute}
              sx={{
                width: { xs: 48, sm: 54 },
                height: { xs: 48, sm: 54 },
                bgcolor: isMuted ? "rgba(239, 68, 68, 0.2)" : "rgba(255, 255, 255, 0.08)",
                color: isMuted ? "#ef4444" : "#fff",
                border: isMuted ? "1px solid #ef4444" : "1px solid rgba(255,255,255,0.08)",
                "&:hover": {
                  bgcolor: isMuted ? "rgba(239, 68, 68, 0.3)" : "rgba(255, 255, 255, 0.18)",
                  transform: "scale(1.05)",
                },
              }}
            >
              {isMuted ? <MicOffIcon sx={{ fontSize: 22 }} /> : <MicIcon sx={{ fontSize: 22 }} />}
            </IconButton>
          </Tooltip>

          {/* Speaker Toggle */}
          <Tooltip title={isSpeakerOn ? "Speakerphone On" : "Speakerphone Off"}>
            <IconButton
              onClick={onToggleSpeaker}
              sx={{
                width: { xs: 48, sm: 54 },
                height: { xs: 48, sm: 54 },
                bgcolor: isSpeakerOn ? "rgba(56, 189, 248, 0.18)" : "rgba(255, 255, 255, 0.08)",
                color: isSpeakerOn ? "#38bdf8" : "#fff",
                border: isSpeakerOn ? "1px solid #38bdf8" : "1px solid rgba(255,255,255,0.08)",
                "&:hover": {
                  bgcolor: "rgba(56, 189, 248, 0.28)",
                  transform: "scale(1.05)",
                },
              }}
            >
              {isSpeakerOn ? <VolumeUpIcon sx={{ fontSize: 22 }} /> : <VolumeOffIcon sx={{ fontSize: 22 }} />}
            </IconButton>
          </Tooltip>

          {/* Red End Call Button */}
          <Tooltip title="Leave Group Call">
            <IconButton
              onClick={onEndCall}
              sx={{
                width: { xs: 56, sm: 64 },
                height: { xs: 56, sm: 64 },
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

          {/* Reactions Button */}
          <Tooltip title="Send Reactions">
            <IconButton
              onClick={onToggleReactions}
              sx={{
                width: { xs: 48, sm: 54 },
                height: { xs: 48, sm: 54 },
                bgcolor: "rgba(255, 255, 255, 0.08)",
                color: "#facc15",
                border: "1px solid rgba(255,255,255,0.08)",
                "&:hover": { bgcolor: "rgba(250, 204, 21, 0.2)" },
              }}
            >
              <AutoAwesomeIcon sx={{ fontSize: 22 }} />
            </IconButton>
          </Tooltip>

          {/* Add Member Button */}
          {onAddMember && (
            <Tooltip title="Invite Friends to Call">
              <IconButton
                onClick={onAddMember}
                sx={{
                  width: { xs: 48, sm: 54 },
                  height: { xs: 48, sm: 54 },
                  bgcolor: "rgba(34, 197, 94, 0.18)",
                  color: "#22c55e",
                  border: "1px solid rgba(34, 197, 94, 0.3)",
                  "&:hover": { bgcolor: "rgba(34, 197, 94, 0.3)" },
                }}
              >
                <PersonAddAlt1Icon sx={{ fontSize: 22 }} />
              </IconButton>
            </Tooltip>
          )}

          {/* Settings Button */}
          <Tooltip title="Audio & Device Settings">
            <IconButton
              onClick={onOpenSettings}
              sx={{
                width: { xs: 48, sm: 54 },
                height: { xs: 48, sm: 54 },
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
    </Box>
  );
}
