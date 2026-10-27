import React from "react";
import { Box, Typography, IconButton, Avatar, Stack, Tooltip } from "@mui/material";
import CallIcon from "@mui/icons-material/Call";
import CallEndIcon from "@mui/icons-material/CallEnd";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import { resolveAvatar, DEFAULT_CALLER_AVATAR } from "./CallAssets";

export default function AudioCallIncoming({
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
      {/* Ambient Blurred Profile Picture Backdrop */}
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          backgroundImage: `url(${avatarSrc})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          filter: "blur(70px) brightness(0.35) saturate(1.8)",
          transform: "scale(1.3)",
          zIndex: 0,
        }}
      />

      {/* Atmospheric Soft Gradient Tint */}
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          background: "radial-gradient(circle at 50% 40%, rgba(14, 165, 233, 0.28) 0%, rgba(2, 6, 23, 0.85) 85%)",
          zIndex: 1,
        }}
      />

      {/* Top Section: Header & Caller Name */}
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
            color: "rgba(255, 255, 255, 0.75)",
            letterSpacing: "1px",
            mb: 0.8,
            textTransform: "uppercase",
          }}
        >
          Incoming audio call...
        </Typography>

        <Typography
          variant="h3"
          sx={{
            fontWeight: 800,
            fontSize: { xs: "1.9rem", sm: "2.5rem" },
            letterSpacing: "-0.5px",
            color: "#ffffff",
            textShadow: "0 4px 20px rgba(0,0,0,0.6)",
          }}
        >
          {callerName}
        </Typography>

        {callerHandle && (
          <Typography
            variant="caption"
            sx={{
              color: "rgba(255,255,255,0.6)",
              fontSize: "0.85rem",
              mt: 0.3,
            }}
          >
            @{callerHandle}
          </Typography>
        )}
      </Box>

      {/* Center Section: Pulsing Caller Profile Avatar */}
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
        {/* Pulsing Concentric Ripple Rings */}
        <Box
          sx={{
            position: "absolute",
            width: { xs: 180, sm: 220 },
            height: { xs: 180, sm: 220 },
            borderRadius: "50%",
            border: "2px solid rgba(56, 189, 248, 0.45)",
            animation: "incomingPulse 2.4s infinite cubic-bezier(0.2, 0, 0, 1)",
            "@keyframes incomingPulse": {
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
            border: "2px solid rgba(56, 189, 248, 0.35)",
            animation: "incomingPulse2 2.4s infinite cubic-bezier(0.2, 0, 0, 1) 0.6s",
            "@keyframes incomingPulse2": {
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
            border: "4px solid rgba(255, 255, 255, 0.25)",
            boxShadow: "0 20px 60px rgba(0, 0, 0, 0.8), 0 0 30px rgba(56, 189, 248, 0.3)",
          }}
        />
      </Box>

      {/* Bottom Section: Action Buttons & Send Message */}
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
          <Tooltip title="Decline Call">
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

          {/* Accept Button */}
          <Tooltip title="Accept Call">
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
              <CallIcon sx={{ fontSize: { xs: 32, sm: 36 } }} />
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
              bgcolor: "rgba(255, 255, 255, 0.08)",
              backdropFilter: "blur(16px)",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              color: "rgba(255, 255, 255, 0.85)",
              fontSize: "0.82rem",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.2s ease",
              "&:hover": {
                bgcolor: "rgba(255, 255, 255, 0.16)",
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
