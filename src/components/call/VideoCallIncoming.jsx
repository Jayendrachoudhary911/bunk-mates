import React from "react";
import { Box, Typography, IconButton, Avatar, Stack, Tooltip } from "@mui/material";
import CallEndIcon from "@mui/icons-material/CallEnd";
import VideocamIcon from "@mui/icons-material/Videocam";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import { resolveAvatar, DEFAULT_CALLER_AVATAR, DEFAULT_STREET_BG } from "./CallAssets";

export default function VideoCallIncoming({
  callerName = "Jayendra choudhary",
  callerAvatar,
  callerHandle,
  onAccept,
  onDecline,
  onSendMessage,
}) {
  const avatarSrc = resolveAvatar(callerAvatar, DEFAULT_CALLER_AVATAR);

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
        py: { xs: 8, sm: 10 },
        px: 3,
        userSelect: "none",
      }}
    >
      {/* Street Wallpaper / Ambient Background (as shown in Figma mockup) */}
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          backgroundImage: `url(${DEFAULT_STREET_BG})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          filter: "brightness(0.65) saturate(1.1)",
          zIndex: 0,
        }}
      />

      {/* Dark Vignette Overlay for readability */}
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          background: "radial-gradient(circle at 50% 40%, rgba(0,0,0,0.3) 0%, rgba(2, 6, 23, 0.75) 100%)",
          zIndex: 1,
        }}
      />

      {/* Top Section: Incoming Video Call & Caller Name */}
      <Box
        sx={{
          position: "relative",
          zIndex: 2,
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <Typography
          variant="subtitle2"
          sx={{
            fontWeight: 600,
            fontSize: { xs: "0.85rem", sm: "0.95rem" },
            color: "rgba(255, 255, 255, 0.8)",
            letterSpacing: "1px",
            mb: 0.8,
            textTransform: "uppercase",
          }}
        >
          Incoming video call...
        </Typography>

        <Typography
          variant="h3"
          sx={{
            fontWeight: 800,
            fontSize: { xs: "1.9rem", sm: "2.5rem" },
            letterSpacing: "-0.5px",
            color: "#ffffff",
            textShadow: "0 4px 20px rgba(0,0,0,0.7)",
          }}
        >
          {callerName}
        </Typography>

        {callerHandle && (
          <Typography
            variant="caption"
            sx={{
              color: "rgba(255,255,255,0.7)",
              fontSize: "0.85rem",
              mt: 0.3,
            }}
          >
            @{callerHandle}
          </Typography>
        )}
      </Box>

      {/* Center Section: Large Circular Profile Photo with Glowing Video Pulse */}
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
        {/* Pulsing Concentric Video Rings */}
        <Box
          sx={{
            position: "absolute",
            width: { xs: 180, sm: 220 },
            height: { xs: 180, sm: 220 },
            borderRadius: "50%",
            border: "2px solid rgba(34, 197, 94, 0.5)",
            animation: "videoPulse 2.4s infinite cubic-bezier(0.2, 0, 0, 1)",
            "@keyframes videoPulse": {
              "0%": { transform: "scale(0.85)", opacity: 0.9 },
              "70%": { transform: "scale(1.45)", opacity: 0.1 },
              "100%": { transform: "scale(1.6)", opacity: 0 },
            },
          }}
        />

        <Box
          sx={{
            position: "absolute",
            width: { xs: 155, sm: 190 },
            height: { xs: 155, sm: 190 },
            borderRadius: "50%",
            border: "2px solid rgba(56, 189, 248, 0.4)",
            animation: "videoPulse2 2.4s infinite cubic-bezier(0.2, 0, 0, 1) 0.6s",
            "@keyframes videoPulse2": {
              "0%": { transform: "scale(0.9)", opacity: 0.8 },
              "70%": { transform: "scale(1.35)", opacity: 0.15 },
              "100%": { transform: "scale(1.5)", opacity: 0 },
            },
          }}
        />

        {/* Circular Profile Photo */}
        <Avatar
          src={avatarSrc}
          alt={callerName}
          sx={{
            width: { xs: 135, sm: 165 },
            height: { xs: 135, sm: 165 },
            border: "4px solid rgba(56, 189, 248, 0.7)",
            boxShadow: "0 20px 60px rgba(0, 0, 0, 0.8), 0 0 35px rgba(56, 189, 248, 0.4)",
          }}
        />
      </Box>

      {/* Bottom Actions Section */}
      <Box
        sx={{
          position: "relative",
          zIndex: 2,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 2.5,
          width: "100%",
          maxWidth: 380,
        }}
      >
        <Stack direction="row" spacing={{ xs: 6, sm: 8 }} alignItems="center" justifyContent="center">
          {/* Decline Button */}
          <Tooltip title="Decline Video Call">
            <IconButton
              onClick={onDecline}
              sx={{
                width: { xs: 66, sm: 72 },
                height: { xs: 66, sm: 72 },
                bgcolor: "#ef4444",
                color: "#fff",
                boxShadow: "0 10px 30px rgba(239, 68, 68, 0.55)",
                transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                "&:hover": {
                  bgcolor: "#dc2626",
                  transform: "scale(1.08)",
                  boxShadow: "0 12px 35px rgba(239, 68, 68, 0.7)",
                },
              }}
            >
              <CallEndIcon sx={{ fontSize: { xs: 32, sm: 36 } }} />
            </IconButton>
          </Tooltip>

          {/* Accept Video Button */}
          <Tooltip title="Accept Video Call">
            <IconButton
              onClick={onAccept}
              sx={{
                width: { xs: 66, sm: 72 },
                height: { xs: 66, sm: 72 },
                bgcolor: "#22c55e",
                color: "#fff",
                boxShadow: "0 10px 30px rgba(34, 197, 94, 0.55)",
                transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                "&:hover": {
                  bgcolor: "#16a34a",
                  transform: "scale(1.08)",
                  boxShadow: "0 12px 35px rgba(34, 197, 94, 0.7)",
                },
              }}
            >
              <VideocamIcon sx={{ fontSize: { xs: 34, sm: 38 } }} />
            </IconButton>
          </Tooltip>
        </Stack>

        {/* Send Message Pill Button */}
        {onSendMessage && (
          <Box
            onClick={onSendMessage}
            sx={{
              display: "inline-flex",
              alignItems: "center",
              gap: 1,
              px: 2.2,
              py: 0.8,
              borderRadius: "99px",
              bgcolor: "rgba(255, 255, 255, 0.12)",
              backdropFilter: "blur(16px)",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              color: "rgba(255, 255, 255, 0.9)",
              fontSize: "0.82rem",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.2s ease",
              "&:hover": {
                bgcolor: "rgba(255, 255, 255, 0.2)",
                color: "#fff",
              },
            }}
          >
            <ChatBubbleOutlineIcon sx={{ fontSize: 16 }} />
            Send Message
          </Box>
        )}
      </Box>
    </Box>
  );
}
