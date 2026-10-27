import React, { useState } from "react";
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
import CameraswitchIcon from "@mui/icons-material/Cameraswitch";
import SettingsIcon from "@mui/icons-material/Settings";
import PersonAddAlt1Icon from "@mui/icons-material/PersonAddAlt1";
import { motion } from "framer-motion";
import { resolveAvatar, DEFAULT_CALLER_AVATAR } from "./CallAssets";

export default function VideoCallOngoing({
  peerName = "Jayendra choudhary",
  peerAvatar,
  myAvatar,
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
  onAddPerson,
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const avatarSrc = resolveAvatar(peerAvatar, DEFAULT_CALLER_AVATAR);
  const myAvatarSrc = resolveAvatar(myAvatar, DEFAULT_CALLER_AVATAR);
  const formattedTime = formatCallTime ? formatCallTime(duration) : "00:00";
  const [pipSwapped, setPipSwapped] = useState(false);

  return (
    <Box
      sx={{
        position: "relative",
        width: "100%",
        height: "100%",
        overflow: "hidden",
        bgcolor: "#000",
        color: "#fff",
        userSelect: "none",
      }}
    >
      {/* 1. Remote Video Stream or Avatar fallback (Main Canvas) */}
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          zIndex: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: "#07090e",
        }}
      >
        {/* Remote Live Video Element */}
        <video
          ref={pipSwapped ? attachLocalVideo : attachRemoteVideo}
          autoPlay
          playsInline
          muted={pipSwapped}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: hasRemoteVideo || pipSwapped ? "block" : "none",
            transform: pipSwapped && !isScreenSharing ? "scaleX(-1)" : "none",
          }}
        />

        {/* Fallback to Peer's Profile Pic when remote video is not streaming */}
        {(!hasRemoteVideo && !pipSwapped) && (
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              background: "radial-gradient(circle at center, #1e293b 0%, #030712 100%)",
            }}
          >
            {/* Ambient Blurred Background Glow */}
            <Box
              sx={{
                position: "absolute",
                inset: 0,
                backgroundImage: `url(${avatarSrc})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                filter: "blur(60px) brightness(0.28)",
                opacity: 0.6,
              }}
            />
            <Avatar
              src={avatarSrc}
              alt={peerName}
              sx={{
                position: "relative",
                zIndex: 2,
                width: { xs: 130, sm: 160 },
                height: { xs: 130, sm: 160 },
                border: "4px solid rgba(56, 189, 248, 0.4)",
                boxShadow: "0 20px 60px rgba(0, 0, 0, 0.8)",
                mb: 2,
              }}
            />
            <Typography
              variant="h5"
              sx={{
                position: "relative",
                zIndex: 2,
                fontWeight: 800,
                color: "#fff",
              }}
            >
              {peerName}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                position: "relative",
                zIndex: 2,
                color: "rgba(255,255,255,0.6)",
                mt: 0.5,
              }}
            >
              Camera is turned off
            </Typography>
          </Box>
        )}
      </Box>

      {/* 2. Top Info & Floating Bar (Mobile View) */}
      {isMobile && (
        <Box
          sx={{
            position: "absolute",
            top: 20,
            left: 20,
            right: 20,
            zIndex: 10,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          {/* Status & Timer Pill */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.2,
              px: 1.8,
              py: 0.6,
              borderRadius: "99px",
              bgcolor: "rgba(15, 23, 42, 0.75)",
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(255, 255, 255, 0.12)",
            }}
          >
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                bgcolor: "#22c55e",
                boxShadow: "0 0 10px #22c55e",
              }}
            />
            <Typography variant="caption" sx={{ fontWeight: 800, letterSpacing: "0.5px" }}>
              {peerName} • {formattedTime}
            </Typography>
          </Box>

          {/* Minimize Button */}
          <Tooltip title="Minimize">
            <IconButton
              size="small"
              onClick={onMinimize}
              sx={{
                bgcolor: "rgba(15, 23, 42, 0.75)",
                backdropFilter: "blur(20px)",
                border: "1px solid rgba(255, 255, 255, 0.12)",
                color: "#fff",
              }}
            >
              <CloseFullscreenIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
        </Box>
      )}

      {/* 3. Floating Picture-in-Picture (PiP) Window (Self Camera Preview) */}
      <motion.div
        drag
        dragConstraints={{ left: -400, right: 20, top: -400, bottom: 20 }}
        style={{
          position: "absolute",
          ...(isMobile
            ? { bottom: 28, left: 20 }
            : { bottom: 36, right: 36 }),
          zIndex: 20,
          cursor: "grab",
        }}
        onClick={() => setPipSwapped(!pipSwapped)}
      >
        <Box
          sx={{
            width: { xs: 110, sm: 160 },
            height: { xs: 155, sm: 115 },
            borderRadius: "20px",
            overflow: "hidden",
            bgcolor: "#111827",
            border: "2px solid rgba(255, 255, 255, 0.22)",
            boxShadow: "0 16px 40px rgba(0, 0, 0, 0.75)",
            position: "relative",
            transition: "transform 0.15s ease",
            "&:hover": { transform: "scale(1.03)" },
          }}
        >
          {/* Local Camera Video */}
          <video
            ref={pipSwapped ? attachRemoteVideo : attachLocalVideo}
            autoPlay
            playsInline
            muted={!pipSwapped}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              transform: !pipSwapped && !isScreenSharing ? "scaleX(-1)" : "none",
              display: isVideoOff && !pipSwapped ? "none" : "block",
            }}
          />

          {/* Avatar Fallback if camera is turned off */}
          {isVideoOff && !pipSwapped && (
            <Box
              sx={{
                width: "100%",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                bgcolor: "#1e293b",
              }}
            >
              <Avatar
                src={myAvatarSrc}
                sx={{
                  width: 44,
                  height: 44,
                  border: "2px solid rgba(255,255,255,0.2)",
                  mb: 0.5,
                }}
              />
              <VideocamOffIcon sx={{ fontSize: 16, opacity: 0.6 }} />
            </Box>
          )}

          {/* Subtitle tag */}
          <Box
            sx={{
              position: "absolute",
              bottom: 6,
              left: 6,
              px: 0.9,
              py: 0.2,
              borderRadius: "99px",
              bgcolor: "rgba(0, 0, 0, 0.6)",
              backdropFilter: "blur(8px)",
              fontSize: "0.68rem",
              fontWeight: 700,
            }}
          >
            {pipSwapped ? peerName : "You"}
          </Box>
        </Box>
      </motion.div>

      {/* 4. Desktop Left Vertical Floating Pill Dock */}
      {!isMobile && (
        <Box
          sx={{
            position: "absolute",
            left: 28,
            top: "50%",
            transform: "translateY(-50%)",
            zIndex: 15,
          }}
        >
          <Stack
            spacing={1.6}
            sx={{
              p: 1.2,
              borderRadius: "99px",
              bgcolor: "rgba(15, 23, 42, 0.78)",
              backdropFilter: "blur(24px)",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              boxShadow: "0 16px 40px rgba(0, 0, 0, 0.6)",
            }}
          >
            {/* Add Person */}
            <Tooltip title="Add Person to Call" placement="right">
              <IconButton
                onClick={onAddPerson}
                sx={{
                  width: 46,
                  height: 46,
                  color: "#22c55e",
                  bgcolor: "rgba(34, 197, 94, 0.18)",
                  "&:hover": { bgcolor: "rgba(34, 197, 94, 0.3)" },
                }}
              >
                <PersonAddAlt1Icon sx={{ fontSize: 22 }} />
              </IconButton>
            </Tooltip>

            {/* Speaker Toggle */}
            <Tooltip title={isSpeakerOn ? "Speakerphone On" : "Speakerphone Off"} placement="right">
              <IconButton
                onClick={onToggleSpeaker}
                sx={{
                  width: 46,
                  height: 46,
                  color: isSpeakerOn ? "#38bdf8" : "#fff",
                  bgcolor: isSpeakerOn ? "rgba(56, 189, 248, 0.16)" : "rgba(255, 255, 255, 0.08)",
                  "&:hover": { bgcolor: "rgba(255, 255, 255, 0.2)" },
                }}
              >
                {isSpeakerOn ? <VolumeUpIcon sx={{ fontSize: 22 }} /> : <VolumeOffIcon sx={{ fontSize: 22 }} />}
              </IconButton>
            </Tooltip>

            {/* Screen Share */}
            <Tooltip title={isScreenSharing ? "Stop Screen Share" : "Share Screen"} placement="right">
              <IconButton
                onClick={onToggleScreenShare}
                sx={{
                  width: 46,
                  height: 46,
                  color: isScreenSharing ? "#22c55e" : "#fff",
                  bgcolor: isScreenSharing ? "rgba(34, 197, 94, 0.16)" : "rgba(255, 255, 255, 0.08)",
                  "&:hover": { bgcolor: "rgba(255, 255, 255, 0.2)" },
                }}
              >
                {isScreenSharing ? <StopScreenShareIcon sx={{ fontSize: 22 }} /> : <ScreenShareIcon sx={{ fontSize: 22 }} />}
              </IconButton>
            </Tooltip>

            {/* Device Settings */}
            <Tooltip title="Audio & Video Settings" placement="right">
              <IconButton
                onClick={onOpenSettings}
                sx={{
                  width: 46,
                  height: 46,
                  color: "#fff",
                  bgcolor: "rgba(255, 255, 255, 0.08)",
                  "&:hover": { bgcolor: "rgba(255, 255, 255, 0.2)" },
                }}
              >
                <SettingsIcon sx={{ fontSize: 20 }} />
              </IconButton>
            </Tooltip>

            {/* Minimize */}
            <Tooltip title="Minimize to PiP" placement="right">
              <IconButton
                onClick={onMinimize}
                sx={{
                  width: 46,
                  height: 46,
                  color: "#fff",
                  bgcolor: "rgba(255, 255, 255, 0.08)",
                  "&:hover": { bgcolor: "rgba(255, 255, 255, 0.2)" },
                }}
              >
                <CloseFullscreenIcon sx={{ fontSize: 20 }} />
              </IconButton>
            </Tooltip>
          </Stack>
        </Box>
      )}

      {/* 5. Mobile Right Vertical Floating Pill Dock (Matching Figma Column 1 Row 1) */}
      {isMobile && (
        <Box
          sx={{
            position: "absolute",
            bottom: 28,
            right: 20,
            zIndex: 20,
          }}
        >
          <Stack
            spacing={1.2}
            sx={{
              p: 1.1,
              borderRadius: "99px",
              bgcolor: "rgba(15, 23, 42, 0.85)",
              backdropFilter: "blur(24px)",
              border: "1px solid rgba(255, 255, 255, 0.14)",
              boxShadow: "0 16px 45px rgba(0, 0, 0, 0.7)",
            }}
          >
            {/* Add Person */}
            <IconButton
              size="small"
              onClick={onAddPerson}
              sx={{
                width: 46,
                height: 46,
                color: "#22c55e",
                bgcolor: "rgba(34, 197, 94, 0.18)",
              }}
            >
              <PersonAddAlt1Icon sx={{ fontSize: 20 }} />
            </IconButton>

            {/* Speaker */}
            <IconButton
              size="small"
              onClick={onToggleSpeaker}
              sx={{
                width: 46,
                height: 46,
                color: isSpeakerOn ? "#38bdf8" : "#fff",
                bgcolor: "rgba(255, 255, 255, 0.08)",
              }}
            >
              {isSpeakerOn ? <VolumeUpIcon sx={{ fontSize: 20 }} /> : <VolumeOffIcon sx={{ fontSize: 20 }} />}
            </IconButton>

            {/* Camera Switch / Flip */}
            <IconButton
              size="small"
              onClick={onToggleVideo}
              sx={{
                width: 46,
                height: 46,
                color: isVideoOff ? "#ef4444" : "#fff",
                bgcolor: isVideoOff ? "rgba(239, 68, 68, 0.2)" : "rgba(255, 255, 255, 0.08)",
              }}
            >
              {isVideoOff ? <VideocamOffIcon sx={{ fontSize: 20 }} /> : <CameraswitchIcon sx={{ fontSize: 20 }} />}
            </IconButton>

            {/* Mic Toggle */}
            <IconButton
              size="small"
              onClick={onToggleMute}
              sx={{
                width: 46,
                height: 46,
                color: isMuted ? "#ef4444" : "#fff",
                bgcolor: isMuted ? "rgba(239, 68, 68, 0.2)" : "rgba(255, 255, 255, 0.08)",
              }}
            >
              {isMuted ? <MicOffIcon sx={{ fontSize: 20 }} /> : <MicIcon sx={{ fontSize: 20 }} />}
            </IconButton>

            {/* Device Settings */}
            <IconButton
              size="small"
              onClick={onOpenSettings}
              sx={{
                width: 46,
                height: 46,
                color: "#fff",
                bgcolor: "rgba(255, 255, 255, 0.08)",
              }}
            >
              <SettingsIcon sx={{ fontSize: 20 }} />
            </IconButton>

            {/* Red End Call */}
            <IconButton
              size="small"
              onClick={onEndCall}
              sx={{
                width: 50,
                height: 50,
                bgcolor: "#ef4444",
                color: "#fff",
                boxShadow: "0 8px 24px rgba(239, 68, 68, 0.6)",
                "&:hover": { bgcolor: "#dc2626" },
              }}
            >
              <CallEndIcon sx={{ fontSize: 24 }} />
            </IconButton>
          </Stack>
        </Box>
      )}

      {/* 6. Desktop Bottom Floating Frosted Glass Bar (Matching Figma Row 2 Column 4) */}
      {!isMobile && (
        <Box
          sx={{
            position: "absolute",
            bottom: 32,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 15,
            display: "flex",
            alignItems: "center",
          }}
        >
          <Stack
            direction="row"
            spacing={1.8}
            alignItems="center"
            sx={{
              p: 1.2,
              px: 3,
              borderRadius: "99px",
              bgcolor: "rgba(15, 23, 42, 0.82)",
              backdropFilter: "blur(28px)",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              boxShadow: "0 20px 50px rgba(0, 0, 0, 0.75)",
            }}
          >
            {/* Status & Timer Pill Badge */}
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                pr: 2,
                borderRight: "1px solid rgba(255, 255, 255, 0.15)",
              }}
            >
              <Typography variant="caption" sx={{ color: "#38bdf8", fontWeight: 700, fontSize: "0.75rem" }}>
                {formattedTime} Ongoing video call
              </Typography>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "#fff", lineHeight: 1.2 }}>
                {peerName}
              </Typography>
            </Box>

            {/* Add Person */}
            <Tooltip title="Add Person to Call">
              <IconButton
                onClick={onAddPerson}
                sx={{
                  width: 48,
                  height: 48,
                  bgcolor: "rgba(34, 197, 94, 0.18)",
                  color: "#22c55e",
                  border: "1px solid rgba(34, 197, 94, 0.3)",
                  "&:hover": { bgcolor: "rgba(34, 197, 94, 0.3)" },
                }}
              >
                <PersonAddAlt1Icon sx={{ fontSize: 22 }} />
              </IconButton>
            </Tooltip>

            {/* Mic Toggle */}
            <Tooltip title={isMuted ? "Unmute Mic" : "Mute Mic"}>
              <IconButton
                onClick={onToggleMute}
                sx={{
                  width: 48,
                  height: 48,
                  bgcolor: isMuted ? "rgba(239, 68, 68, 0.2)" : "rgba(255, 255, 255, 0.08)",
                  color: isMuted ? "#ef4444" : "#fff",
                  border: isMuted ? "1px solid #ef4444" : "1px solid rgba(255,255,255,0.08)",
                  "&:hover": { bgcolor: "rgba(255, 255, 255, 0.2)" },
                }}
              >
                {isMuted ? <MicOffIcon sx={{ fontSize: 22 }} /> : <MicIcon sx={{ fontSize: 22 }} />}
              </IconButton>
            </Tooltip>

            {/* Video Camera Toggle */}
            <Tooltip title={isVideoOff ? "Turn Camera On" : "Turn Camera Off"}>
              <IconButton
                onClick={onToggleVideo}
                sx={{
                  width: 48,
                  height: 48,
                  bgcolor: isVideoOff ? "rgba(239, 68, 68, 0.2)" : "rgba(255, 255, 255, 0.08)",
                  color: isVideoOff ? "#ef4444" : "#fff",
                  border: isVideoOff ? "1px solid #ef4444" : "1px solid rgba(255,255,255,0.08)",
                  "&:hover": { bgcolor: "rgba(255, 255, 255, 0.2)" },
                }}
              >
                {isVideoOff ? <VideocamOffIcon sx={{ fontSize: 22 }} /> : <VideocamIcon sx={{ fontSize: 22 }} />}
              </IconButton>
            </Tooltip>

            {/* Hero End Call Button */}
            <Tooltip title="End Video Call">
              <IconButton
                onClick={onEndCall}
                sx={{
                  width: 56,
                  height: 56,
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
                <CallEndIcon sx={{ fontSize: 28 }} />
              </IconButton>
            </Tooltip>

            {/* Reactions */}
            <Tooltip title="Send Reactions">
              <IconButton
                onClick={onToggleReactions}
                sx={{
                  width: 48,
                  height: 48,
                  bgcolor: "rgba(255, 255, 255, 0.08)",
                  color: "#facc15",
                  border: "1px solid rgba(255,255,255,0.08)",
                  "&:hover": { bgcolor: "rgba(250, 204, 21, 0.2)" },
                }}
              >
                <AutoAwesomeIcon sx={{ fontSize: 22 }} />
              </IconButton>
            </Tooltip>

            {/* Device Settings */}
            <Tooltip title="Audio & Video Settings">
              <IconButton
                onClick={onOpenSettings}
                sx={{
                  width: 48,
                  height: 48,
                  bgcolor: "rgba(255, 255, 255, 0.08)",
                  color: "#fff",
                  border: "1px solid rgba(255,255,255,0.08)",
                  "&:hover": { bgcolor: "rgba(255, 255, 255, 0.2)" },
                }}
              >
                <SettingsIcon sx={{ fontSize: 22 }} />
              </IconButton>
            </Tooltip>

            {/* In-Call Chat Drawer */}
            <Tooltip title="In-Call Chat">
              <IconButton
                onClick={onToggleChat}
                sx={{
                  width: 48,
                  height: 48,
                  bgcolor: "rgba(255, 255, 255, 0.08)",
                  color: "#fff",
                  border: "1px solid rgba(255,255,255,0.08)",
                  "&:hover": { bgcolor: "rgba(255, 255, 255, 0.2)" },
                }}
              >
                <ChatBubbleOutlineIcon sx={{ fontSize: 22 }} />
              </IconButton>
            </Tooltip>
          </Stack>
        </Box>
      )}
    </Box>
  );
}
