// src/components/panels/ChatProfilePanelContent.jsx
import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Avatar,
  Button,
  Stack,
  Divider,
  IconButton,
  Tooltip,
  CircularProgress,
  Chip,
} from "@mui/material";
import {
  PhoneOutlined as PhoneIcon,
  EmailOutlined as EmailIcon,
  PeopleOutline as FriendsIcon,
  DeleteOutline as DeleteIcon,
  Block as BlockIcon,
  ChatBubbleOutline as ChatIcon,
  ExploreOutlined as TripsIcon,
} from "../../icons";
import { useAuth } from "../../hooks/useAuth";
import { useThemeToggle } from "../../contexts/ThemeToggleContext";
import { db } from "../../firebase";
import { doc, getDoc } from "firebase/firestore";

const ChatProfilePanelContent = ({ profileData, onClearChat, onRemoveFriend }) => {
  const { user: currentUser } = useAuth();
  const { mode } = useThemeToggle();
  const isDark = mode === "dark";

  const [details, setDetails] = useState(profileData || {});
  const [loading, setLoading] = useState(!profileData?.name);

  useEffect(() => {
    if (!profileData?.id && !profileData?.uid) return;
    const uid = profileData.id || profileData.uid;

    const fetchDetails = async () => {
      try {
        const snap = await getDoc(doc(db, "users", uid));
        if (snap.exists()) {
          setDetails((prev) => ({ ...prev, ...snap.data(), id: uid }));
        }
      } catch (err) {
        console.error("Error loading chat friend profile:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [profileData]);

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress size={28} />
      </Box>
    );
  }

  const name = details.name || details.displayName || "Friend";
  const username = details.username || "bunkmate";
  const bio = details.bio || details.userBio || "Using BunkMates";
  const photoURL = details.photoURL || "";
  const phone = details.mobile || details.phoneNumber;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      {/* ─── Profile Avatar Card ─── */}
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          p: 3,
          borderRadius: 4,
          backgroundColor: isDark
            ? "rgba(255, 255, 255, 0.04)"
            : "rgba(0, 0, 0, 0.03)",
          border: `1px solid ${
            isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.08)"
          }`,
        }}
      >
        <Avatar
          src={photoURL}
          alt={name}
          sx={{
            width: 84,
            height: 84,
            borderRadius: "26px",
            fontSize: "2.2rem",
            fontWeight: 700,
            mb: 1.5,
            border: `2px solid ${
              isDark ? "rgba(255, 255, 255, 0.15)" : "rgba(0, 0, 0, 0.1)"
            }`,
            boxShadow: isDark
              ? "0 8px 24px rgba(0,0,0,0.4)"
              : "0 8px 20px rgba(0,0,0,0.08)",
          }}
        >
          {name.charAt(0)}
        </Avatar>

        <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
          {name}
        </Typography>

        <Typography
          variant="body2"
          sx={{
            color: isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)",
            mb: 1.5,
          }}
        >
          @{username}
        </Typography>

        {bio && (
          <Typography
            variant="body2"
            sx={{
              color: isDark ? "rgba(255,255,255,0.75)" : "rgba(0,0,0,0.75)",
              fontSize: "0.88rem",
              lineHeight: 1.4,
              px: 1,
            }}
          >
            {bio}
          </Typography>
        )}
      </Box>

      {/* ─── Contact Details (if available) ─── */}
      {phone && (
        <Box
          sx={{
            p: 2,
            borderRadius: 3,
            backgroundColor: isDark
              ? "rgba(255, 255, 255, 0.03)"
              : "rgba(0, 0, 0, 0.02)",
            border: `1px solid ${
              isDark ? "rgba(255, 255, 255, 0.06)" : "rgba(0, 0, 0, 0.06)"
            }`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <PhoneIcon sx={{ fontSize: 18, color: "text.secondary" }} />
            <Box>
              <Typography variant="caption" sx={{ color: "text.secondary", display: "block" }}>
                Phone Number
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {phone}
              </Typography>
            </Box>
          </Box>

          <Button
            size="small"
            variant="outlined"
            onClick={() => window.open(`tel:${phone}`, "_blank")}
            sx={{
              borderRadius: 2,
              textTransform: "none",
              fontSize: "0.78rem",
            }}
          >
            Call
          </Button>
        </Box>
      )}

      {/* ─── Mutual Friends / Connection Status ─── */}
      <Box
        sx={{
          p: 2,
          borderRadius: 3,
          backgroundColor: isDark
            ? "rgba(255, 255, 255, 0.03)"
            : "rgba(0, 0, 0, 0.02)",
          border: `1px solid ${
            isDark ? "rgba(255, 255, 255, 0.06)" : "rgba(0, 0, 0, 0.06)"
          }`,
          display: "flex",
          alignItems: "center",
          gap: 1.5,
        }}
      >
        <FriendsIcon sx={{ fontSize: 20, color: "text.secondary" }} />
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            Connected on BunkMates
          </Typography>
          <Typography variant="caption" sx={{ color: "text.secondary" }}>
            Direct message history active
          </Typography>
        </Box>
      </Box>

      <Divider sx={{ borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)" }} />

      {/* ─── Danger Actions ─── */}
      <Stack spacing={1}>
        {onClearChat && (
          <Button
            fullWidth
            variant="outlined"
            startIcon={<DeleteIcon sx={{ fontSize: 18 }} />}
            onClick={onClearChat}
            sx={{
              borderRadius: 3,
              py: 1.2,
              textTransform: "none",
              fontWeight: 600,
              color: isDark ? "rgba(255,255,255,0.8)" : "rgba(0,0,0,0.8)",
              borderColor: isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.12)",
              "&:hover": {
                borderColor: "#ff5252",
                color: "#ff5252",
              },
            }}
          >
            Clear Conversation
          </Button>
        )}

        {onRemoveFriend && (
          <Button
            fullWidth
            variant="text"
            startIcon={<BlockIcon sx={{ fontSize: 18 }} />}
            onClick={onRemoveFriend}
            sx={{
              borderRadius: 3,
              py: 1.2,
              textTransform: "none",
              fontWeight: 600,
              color: "#ff5252",
              "&:hover": {
                backgroundColor: "rgba(255, 82, 82, 0.08)",
              },
            }}
          >
            Remove Friend
          </Button>
        )}
      </Stack>
    </Box>
  );
};

export default ChatProfilePanelContent;
