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
import SettingsIcon from "@mui/icons-material/Settings";
import PersonAddAlt1Icon from "@mui/icons-material/PersonAddAlt1";
import { resolveAvatar, DEFAULT_CALLER_AVATAR } from "./CallAssets";

export default function AudioCallOngoing({
  peerName = "Jayendra choudhary",
  peerAvatar,
  peerHandle,
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
  onOpenSettings,
  onAddPerson,
}) {
  const avatarSrc = resolveAvatar(peerAvatar, DEFAULT_CALLER_AVATAR);
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
        bgcolor: "#030712",
        color: "#fff",
        py: { xs: 5, sm: 7 },
        px: 3,
        userSelect: "none",
      }}
    >
      {/* Atmospheric Blurred Profile Picture Backdrop */}
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          backgroundImage: `url(${avatarSrc})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          filter: "blur(75px) brightness(0.32) saturate(1.7)",
          transform: "scale(1.3)",
          zIndex: 0,
        }}
      />

      {/* Dark Vignette Overlay */}
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          background: "radial-gradient(circle at 50% 35%, rgba(14, 165, 233, 0.22) 0%, rgba(2, 6, 23, 0.88) 85%)",
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

        {/* Center Call Status & Peer Info */}
        <Box sx={{ textAlign: "center", flex: 1, px: 2 }}>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 800,
              fontSize: { xs: "1.7rem", sm: "2.3rem" },
              letterSpacing: "-0.5px",
              color: "#ffffff",
              textShadow: "0 4px 20px rgba(0,0,0,0.6)",
            }}
          >
            {peerName}
          </Typography>

          <Typography
            variant="subtitle2"
            sx={{
              color: "rgba(255, 255, 255, 0.7)",
              fontSize: { xs: "0.85rem", sm: "0.95rem" },
              mt: 0.5,
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 1,
            }}
          >
            <span>Ongoing audio call</span>
            <span style={{ opacity: 0.4 }}>•</span>
            <span style={{ color: "#38bdf8", fontWeight: 700 }}>
              {callStatus === "connected" ? formattedTime : "Connecting..."}
            </span>
          </Typography>
        </Box>

        {/* Top-Right Action Controls (Add Person, Settings, Chat) */}
        <Stack direction="row" spacing={1} alignItems="center">
          {/* Add Person to Call */}
          <Tooltip title="Add Person to Call">
            <IconButton
              onClick={onAddPerson}
              sx={{
                width: 44,
                height: 44,
                borderRadius: "50%",
                bgcolor: "rgba(34, 197, 94, 0.16)",
                backdropFilter: "blur(16px)",
                border: "1px solid rgba(34, 197, 94, 0.3)",
                color: "#22c55e",
                transition: "all 0.2s ease",
                "&:hover": {
                  bgcolor: "rgba(34, 197, 94, 0.28)",
                  transform: "scale(1.06)",
                },
              }}
            >
              <PersonAddAlt1Icon sx={{ fontSize: 20 }} />
            </IconButton>
          </Tooltip>

          {/* Device Settings */}
          <Tooltip title="Audio & Device Settings">
            <IconButton
              onClick={onOpenSettings}
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
              <SettingsIcon sx={{ fontSize: 20 }} />
            </IconButton>
          </Tooltip>

          {/* In-Call Chat */}
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
        </Stack>
      </Box>

      {/* Center Section: Avatar with Active Audio Waves */}
      <Box
        sx={{
          position: "relative",
          zIndex: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          my: "auto",
        }}
      >
        {/* Animated Concentric Sound Wave Rings */}
        <Box
          sx={{
            position: "absolute",
            width: { xs: 200, sm: 260 },
            height: { xs: 200, sm: 260 },
            borderRadius: "50%",
            border: "2px solid rgba(56, 189, 248, 0.4)",
            animation: callStatus === "connected" ? "audioRipple 2.2s infinite cubic-bezier(0.1, 0.2, 0.3, 1)" : "none",
            "@keyframes audioRipple": {
              "0%": { transform: "scale(0.88)", opacity: 0.8 },
              "50%": { transform: "scale(1.22)", opacity: 0.35 },
              "100%": { transform: "scale(1.48)", opacity: 0 },
            },
          }}
        />

        <Box
          sx={{
            position: "absolute",
            width: { xs: 170, sm: 220 },
            height: { xs: 170, sm: 220 },
            borderRadius: "50%",
            border: "2px solid rgba(56, 189, 248, 0.3)",
            animation: callStatus === "connected" ? "audioRipple2 2.2s infinite cubic-bezier(0.1, 0.2, 0.3, 1) 0.5s" : "none",
            "@keyframes audioRipple2": {
              "0%": { transform: "scale(0.9)", opacity: 0.7 },
              "50%": { transform: "scale(1.15)", opacity: 0.3 },
              "100%": { transform: "scale(1.35)", opacity: 0 },
            },
          }}
        />

        {/* Large Profile Picture */}
        <Avatar
          src={avatarSrc}
          alt={peerName}
          sx={{
            width: { xs: 140, sm: 180 },
            height: { xs: 140, sm: 180 },
            border: "4px solid rgba(56, 189, 248, 0.6)",
            boxShadow: "0 24px 60px rgba(0, 0, 0, 0.8), 0 0 35px rgba(56, 189, 248, 0.35)",
          }}
        />
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
          maxWidth: 560,
        }}
      >
        <Stack
          direction="row"
          spacing={{ xs: 1.2, sm: 2 }}
          alignItems="center"
          sx={{
            p: 1.2,
            px: { xs: 2, sm: 3.2 },
            borderRadius: "99px",
            bgcolor: "rgba(15, 23, 42, 0.84)",
            backdropFilter: "blur(28px)",
            border: "1px solid rgba(255, 255, 255, 0.12)",
            boxShadow: "0 20px 50px rgba(0, 0, 0, 0.7), inset 0 1px 1px rgba(255,255,255,0.1)",
          }}
        >
          {/* Add Person */}
          <Tooltip title="Add Person to Call">
            <IconButton
              onClick={onAddPerson}
              sx={{
                width: { xs: 46, sm: 52 },
                height: { xs: 46, sm: 52 },
                bgcolor: "rgba(34, 197, 94, 0.18)",
                color: "#22c55e",
                border: "1px solid rgba(34, 197, 94, 0.3)",
                transition: "all 0.2s ease",
                "&:hover": {
                  bgcolor: "rgba(34, 197, 94, 0.3)",
                  transform: "scale(1.05)",
                },
              }}
            >
              <PersonAddAlt1Icon sx={{ fontSize: 22 }} />
            </IconButton>
          </Tooltip>

          {/* Mic Mute/Unmute */}
          <Tooltip title={isMuted ? "Unmute Mic" : "Mute Mic"}>
            <IconButton
              onClick={onToggleMute}
              sx={{
                width: { xs: 46, sm: 52 },
                height: { xs: 46, sm: 52 },
                bgcolor: isMuted ? "rgba(239, 68, 68, 0.2)" : "rgba(255, 255, 255, 0.08)",
                color: isMuted ? "#ef4444" : "#fff",
                border: isMuted ? "1px solid #ef4444" : "1px solid rgba(255,255,255,0.08)",
                transition: "all 0.2s ease",
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
                width: { xs: 46, sm: 52 },
                height: { xs: 46, sm: 52 },
                bgcolor: isSpeakerOn ? "rgba(56, 189, 248, 0.18)" : "rgba(255, 255, 255, 0.08)",
                color: isSpeakerOn ? "#38bdf8" : "#fff",
                border: isSpeakerOn ? "1px solid #38bdf8" : "1px solid rgba(255,255,255,0.08)",
                transition: "all 0.2s ease",
                "&:hover": {
                  bgcolor: "rgba(56, 189, 248, 0.28)",
                  transform: "scale(1.05)",
                },
              }}
            >
              {isSpeakerOn ? <VolumeUpIcon sx={{ fontSize: 22 }} /> : <VolumeOffIcon sx={{ fontSize: 22 }} />}
            </IconButton>
          </Tooltip>

          {/* Red End Call Button (Hero Control) */}
          <Tooltip title="End Call">
            <IconButton
              onClick={onEndCall}
              sx={{
                width: { xs: 54, sm: 60 },
                height: { xs: 54, sm: 60 },
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
                width: { xs: 46, sm: 52 },
                height: { xs: 46, sm: 52 },
                bgcolor: "rgba(255, 255, 255, 0.08)",
                color: "#facc15",
                border: "1px solid rgba(255,255,255,0.08)",
                transition: "all 0.2s ease",
                "&:hover": {
                  bgcolor: "rgba(250, 204, 21, 0.2)",
                  transform: "scale(1.05)",
                },
              }}
            >
              <AutoAwesomeIcon sx={{ fontSize: 22 }} />
            </IconButton>
          </Tooltip>

          {/* Settings Button */}
          <Tooltip title="Audio & Device Settings">
            <IconButton
              onClick={onOpenSettings}
              sx={{
                width: { xs: 46, sm: 52 },
                height: { xs: 46, sm: 52 },
                bgcolor: "rgba(255, 255, 255, 0.08)",
                color: "#fff",
                border: "1px solid rgba(255,255,255,0.08)",
                transition: "all 0.2s ease",
                "&:hover": {
                  bgcolor: "rgba(255, 255, 255, 0.2)",
                  transform: "scale(1.05)",
                },
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
