// src/components/chats_components/ChatUserProfileCard.jsx
import React from "react";
import {
  Box,
  Typography,
  Avatar,
  Button,
  IconButton,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import MessageOutlinedIcon from "@mui/icons-material/MessageOutlined";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import ShareOutlinedIcon from "@mui/icons-material/ShareOutlined";
import { useNavigate } from "react-router-dom";
import { useDesktopPanel } from "../../contexts/DesktopPanelContext";
import { safeImageUrl } from "../../utils/uiHelpers";

const ChatUserProfileCard = ({
  cardData = {},
  currentUser,
  isDark = true,
  onOpenProfileDrawer = null,
  onShare = null,
}) => {
  const navigate = useNavigate();
  const muiTheme = useTheme();
  const isDesktop = useMediaQuery(muiTheme.breakpoints.up("md"));
  const { openPanel } = useDesktopPanel();

  const targetUid = cardData.uid || cardData.id;
  const name = cardData.name || cardData.displayName || "User";
  const username = cardData.username || "";
  const photoURL = safeImageUrl(cardData.photoURL || cardData.avatar);
  const bio = cardData.bio || "";
  const isSelf = currentUser?.uid === targetUid;

  const handleMessage = (e) => {
    e.stopPropagation();
    if (!targetUid || isSelf) return;
    navigate(`/chat/${targetUid}`);
  };

  const handleViewProfile = (e) => {
    e.stopPropagation();
    if (!targetUid) return;

    if (isDesktop) {
      openPanel("chatProfile", {
        id: targetUid,
        uid: targetUid,
        name,
        displayName: name,
        username,
        photoURL,
        bio,
      });
    } else if (onOpenProfileDrawer) {
      onOpenProfileDrawer(cardData);
    } else {
      navigate(`/chat/${targetUid}?profile`);
    }
  };

  return (
    <Box
      sx={{
        mt: 1,
        mb: 1,
        minWidth: { xs: 260, sm: 320 },
        maxWidth: 380,
        width: "100%",
        overflow: "hidden",
        bgcolor: "transparent",
        border: "0px solid",
        boxShadow: "none",
      }}
    >
      {/* Profile Card Main Container */}
      <Box
        sx={{
          p: 1.5,
          borderRadius: 6,
          mb: 1,
          bgcolor: isDark ? "rgba(26, 26, 26, 0.6)" : "rgb(255, 255, 255)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          border: `1px solid ${
            isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.06)"
          }`,
        }}
      >

        {/* User Info Row */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.4, mb: bio ? 1 : 0 }}>
          <Avatar
            src={photoURL}
            sx={{
              width: 60,
              height: 60,
              borderRadius: 10,
              bgcolor: isDark ? "#333" : "#ddd",
            }}
          >
            {name[0] || "U"}
          </Avatar>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography
              variant="subtitle1"
              sx={{ fontWeight: 800, fontSize: "0.98rem", lineHeight: 1.2 }}
              noWrap
            >
              {name}
            </Typography>
            {username && (
              <Typography
                variant="caption"
                sx={{
                  opacity: 0.6,
                  fontSize: "0.75rem",
                  display: "block",
                  mt: 0.2,
                }}
                noWrap
              >
                @{username}
              </Typography>
            )}
          </Box>
        </Box>

        {/* Bio / Description */}
        {bio && (
          <Typography
            variant="body2"
            sx={{
              fontSize: "0.78rem",
              opacity: 0.8,
              fontStyle: "italic",
              mt: 1,
              px: 0.2,
              maxHeight: 44,
              overflow: "hidden",
              textOverflow: "ellipsis",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
            }}
          >
            “{bio}”
          </Typography>
        )}
      </Box>

      {/* Action Buttons: Message & View Profile & Share */}
      <Box sx={{ display: "flex", gap: 1, alignItems: "center", px: 1 }}>
        {!isSelf && (
          <Button
            fullWidth
            size="small"
            variant="contained"
            startIcon={<MessageOutlinedIcon sx={{ fontSize: 15 }} />}
            onClick={handleMessage}
            sx={{
              py: 0.8,
              borderRadius: 8,
              bgcolor: isDark ? "#dadada" : "#282828",
              color: isDark ? "#090909" : "#f5f5f5",
              textTransform: "none",
              fontWeight: 700,
              fontSize: "0.8rem",
              boxShadow: "none",
              transition: "all 150ms ease",
              "&:hover": {
                bgcolor: isDark ? "#f1f0f0" : "#0f0f0f",
                boxShadow: "none",
              },
            }}
          >
            Message
          </Button>
        )}
        <Button
          fullWidth
          size="small"
          variant="contained"
          startIcon={<PersonOutlineIcon sx={{ fontSize: 15 }} />}
          onClick={handleViewProfile}
          sx={{
            py: 0.8,
            px: 1.6,
            borderRadius: 8,
            bgcolor: isDark ? "rgb(26, 26, 26)" : "rgb(255, 255, 255)",
            color: isDark ? "#fff" : "#1c1c1e",
            textTransform: "none",
            boxShadow: "none",
            fontWeight: 600,
            fontSize: "0.8rem",
            whiteSpace: "nowrap",
            transition: "all 150ms ease",
            "&:hover": {
              bgcolor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
              boxShadow: "none",
            },
          }}
        >
          View Profile
        </Button>
        {onShare && (
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              onShare(cardData);
            }}
            sx={{
              borderRadius: 8,
              p: "8px 10px",
              bgcolor: isDark ? "rgb(26, 26, 26)" : "rgb(255, 255, 255)",
              color: isDark ? "#fff" : "#1c1c1e",
              border: "none",
              transition: "all 150ms ease",
              "&:hover": {
                bgcolor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
              },
            }}
            title="Share Profile Card"
          >
            <ShareOutlinedIcon sx={{ fontSize: 16 }} />
          </IconButton>
        )}
      </Box>
    </Box>
  );
};

export default React.memo(ChatUserProfileCard);