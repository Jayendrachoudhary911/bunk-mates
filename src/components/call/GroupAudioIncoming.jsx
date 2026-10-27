import React from "react";
import { Box, Typography, IconButton, Avatar, Stack, Tooltip } from "@mui/material";
import CallIcon from "@mui/icons-material/Call";
import CallEndIcon from "@mui/icons-material/CallEnd";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import { resolveGroupMembers } from "./CallAssets";

export default function GroupAudioIncoming({
  groupName = "Bunk1",
  members = [],
  currentUser,
  onAccept,
  onDecline,
  onSendMessage,
}) {
  const displayMembers = resolveGroupMembers(members, currentUser);

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
        py: { xs: 8, sm: 10 },
        px: 3,
        userSelect: "none",
      }}
    >
      {/* Vibrant Warm Blurred Gradient Ambient Backdrop (Matching Figma Row 3) */}
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          background: `
            radial-gradient(circle at 50% 30%, rgba(250, 204, 21, 0.45) 0%, transparent 60%),
            radial-gradient(circle at 25% 65%, rgba(239, 68, 68, 0.4) 0%, transparent 55%),
            radial-gradient(circle at 75% 70%, rgba(34, 197, 94, 0.4) 0%, transparent 55%),
            radial-gradient(circle at 50% 90%, rgba(14, 165, 233, 0.35) 0%, transparent 60%),
            #0f172a
          `,
          filter: "blur(40px)",
          transform: "scale(1.2)",
          zIndex: 0,
        }}
      />

      {/* Dark Vignette Overlay */}
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          background: "radial-gradient(circle at center, rgba(0,0,0,0.2) 0%, rgba(2, 6, 23, 0.75) 100%)",
          zIndex: 1,
        }}
      />

      {/* Top Header Section */}
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
          Incoming group audio call...
        </Typography>

        <Typography
          variant="h3"
          sx={{
            fontWeight: 800,
            fontSize: { xs: "2.1rem", sm: "2.8rem" },
            letterSpacing: "-0.5px",
            color: "#ffffff",
            textShadow: "0 4px 20px rgba(0,0,0,0.7)",
          }}
        >
          {groupName}
        </Typography>
      </Box>

      {/* Center Section: Artistic Diamond/Circular Avatar Cluster (Matching Figma Screenshot) */}
      <Box
        sx={{
          position: "relative",
          zIndex: 2,
          width: { xs: 260, sm: 320 },
          height: { xs: 240, sm: 280 },
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          my: "auto",
        }}
      >
        {/* Pulsing Central Group Ring */}
        <Box
          sx={{
            position: "absolute",
            width: { xs: 220, sm: 270 },
            height: { xs: 220, sm: 270 },
            borderRadius: "50%",
            border: "2px solid rgba(250, 204, 21, 0.4)",
            animation: "clusterPulse 2.6s infinite cubic-bezier(0.2, 0, 0, 1)",
            "@keyframes clusterPulse": {
              "0%": { transform: "scale(0.85)", opacity: 0.8 },
              "70%": { transform: "scale(1.35)", opacity: 0.1 },
              "100%": { transform: "scale(1.5)", opacity: 0 },
            },
          }}
        />

        {/* Member 1: Top (Minion / Yellow) */}
        {displayMembers[2] && (
          <Box
            sx={{
              position: "absolute",
              top: 0,
              left: "50%",
              transform: "translateX(-50%)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <Avatar
              src={displayMembers[2].photoURL}
              alt={displayMembers[2].name}
              sx={{
                width: { xs: 72, sm: 84 },
                height: { xs: 72, sm: 84 },
                border: "3px solid #facc15",
                boxShadow: "0 8px 24px rgba(250, 204, 21, 0.4)",
              }}
            />
          </Box>
        )}

        {/* Member 2: Left (Luffy / Red) */}
        {displayMembers[1] && (
          <Box
            sx={{
              position: "absolute",
              left: 0,
              top: "50%",
              transform: "translateY(-30%)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <Avatar
              src={displayMembers[1].photoURL}
              alt={displayMembers[1].name}
              sx={{
                width: { xs: 72, sm: 84 },
                height: { xs: 72, sm: 84 },
                border: "3px solid #ef4444",
                boxShadow: "0 8px 24px rgba(239, 68, 68, 0.4)",
              }}
            />
          </Box>
        )}

        {/* Member 3: Right (Cat / Green) */}
        {displayMembers[0] && (
          <Box
            sx={{
              position: "absolute",
              right: 0,
              top: "50%",
              transform: "translateY(-30%)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <Avatar
              src={displayMembers[0].photoURL}
              alt={displayMembers[0].name}
              sx={{
                width: { xs: 72, sm: 84 },
                height: { xs: 72, sm: 84 },
                border: "3px solid #22c55e",
                boxShadow: "0 8px 24px rgba(34, 197, 94, 0.4)",
              }}
            />
          </Box>
        )}

        {/* Member 4: Bottom / Center (Jayendra / Blue) */}
        {displayMembers[3] && (
          <Box
            sx={{
              position: "absolute",
              bottom: 0,
              left: "50%",
              transform: "translateX(-50%)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <Avatar
              src={displayMembers[3].photoURL}
              alt={displayMembers[3].name}
              sx={{
                width: { xs: 76, sm: 88 },
                height: { xs: 76, sm: 88 },
                border: "3px solid #38bdf8",
                boxShadow: "0 8px 24px rgba(56, 189, 248, 0.4)",
              }}
            />
          </Box>
        )}
      </Box>

      {/* Bottom Section: Action Buttons */}
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
          <Tooltip title="Decline Group Call">
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
          <Tooltip title="Join Group Audio Call">
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
