import React from "react";
import {
  SwipeableDrawer,
  Box,
  Typography,
  Divider,
  MenuItem,
  Avatar,
  IconButton,
} from "@mui/material";

const QUICK_EMOJIS = ["❤️", "👍", "😂", "😮", "😢", "🔥", "👏", "🎉"];

const MessageReactionsDrawer = ({
  open,
  onClose,
  reactionMsg,
  currentUser,
  friendDetails,
  onReaction,
  onRemoveReaction,
  effectiveChatTheme = "dark",
}) => {
  const isDark = effectiveChatTheme === "dark";

  const reactionsList = React.useMemo(() => {
    if (!reactionMsg?.reactions || !Array.isArray(reactionMsg.reactions)) return [];
    return reactionMsg.reactions.map((r) => {
      const isMe = r.user === currentUser?.uid;
      const userObj = isMe
        ? {
            name: "You",
            photoURL: currentUser?.photoURL,
          }
        : {
            name: friendDetails?.name || "Friend",
            photoURL: friendDetails?.photoURL,
          };
      return {
        ...r,
        isMe,
        userObj,
      };
    });
  }, [reactionMsg, currentUser, friendDetails]);

  return (
    <SwipeableDrawer
      anchor="bottom"
      open={open}
      onClose={onClose}
      onOpen={() => {}}
      disableSwipeToOpen
      PaperProps={{
        sx: {
          borderTopLeftRadius: "24px",
          borderTopRightRadius: "24px",
          bgcolor: isDark
            ? "rgba(18, 18, 18, 0.94)"
            : "rgba(255, 255, 255, 0.96)",
          backdropFilter: "blur(24px)",
          color: isDark ? "#fff" : "#111",
          maxWidth: 480,
          mx: "auto",
          p: 2,
          pb: 4,
        },
      }}
    >
      <Box
        sx={{
          width: 36,
          height: 4,
          bgcolor: isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.2)",
          borderRadius: 2,
          mx: "auto",
          mb: 1.5,
        }}
      />

      <Typography
        variant="subtitle1"
        sx={{
          textAlign: "center",
          fontWeight: 700,
          mb: 1.2,
        }}
      >
        Reactions ({reactionsList.length})
      </Typography>

      {/* Quick Reaction Bar to Add or Toggle Reactions */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexWrap: "wrap",
          gap: 0.8,
          mb: 1.5,
          p: "6px 10px",
          borderRadius: "20px",
          bgcolor: isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.03)",
          border: `1px solid ${isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.06)"}`,
        }}
      >
        {QUICK_EMOJIS.map((emoji) => {
          const userHasReacted = reactionsList.some(
            (r) => r.isMe && r.emoji === emoji
          );
          return (
            <IconButton
              key={emoji}
              onClick={() => {
                if (userHasReacted) {
                  onRemoveReaction?.(emoji, reactionMsg);
                } else if (onReaction) {
                  onReaction(emoji, reactionMsg);
                } else if (onRemoveReaction) {
                  onRemoveReaction(emoji, reactionMsg);
                }
              }}
              sx={{
                width: 38,
                height: 38,
                fontSize: "1.3rem",
                borderRadius: "12px",
                bgcolor: userHasReacted
                  ? isDark
                    ? "rgba(0, 183, 255, 0.25)"
                    : "rgba(0, 122, 255, 0.15)"
                  : "transparent",
                outline: userHasReacted
                  ? `1.5px solid ${isDark ? "#4fc3f7" : "#0288d1"}`
                  : "none",
                transition: "transform 150ms ease, background-color 150ms ease",
                "&:hover": {
                  transform: "scale(1.2)",
                  bgcolor: isDark
                    ? "rgba(255, 255, 255, 0.12)"
                    : "rgba(0, 0, 0, 0.08)",
                },
              }}
              title={userHasReacted ? `Remove ${emoji}` : `React with ${emoji}`}
            >
              {emoji}
            </IconButton>
          );
        })}
      </Box>

      <Divider
        sx={{
          mb: 1.5,
          borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)",
        }}
      />

      <Box sx={{ maxHeight: "40vh", overflowY: "auto" }}>
        {reactionsList.map((item, index) => (
          <MenuItem
            key={`${item.user}_${item.emoji}_${index}`}
            onClick={() => {
              if (item.isMe) {
                onRemoveReaction?.(item.emoji, reactionMsg);
                onClose();
              }
            }}
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              p: 1.2,
              borderRadius: "14px",
              my: 0.5,
              bgcolor: isDark
                ? "rgba(255, 255, 255, 0.04)"
                : "rgba(0, 0, 0, 0.03)",
              "&:hover": {
                bgcolor: isDark
                  ? "rgba(255, 255, 255, 0.08)"
                  : "rgba(0, 0, 0, 0.06)",
              },
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <Avatar
                src={item.userObj.photoURL}
                sx={{ width: 34, height: 34 }}
              >
                {item.userObj.name?.[0]}
              </Avatar>
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {item.userObj.name}
                </Typography>
                {item.isMe && (
                  <Typography
                    variant="caption"
                    sx={{
                      color: isDark ? "#00b7ff" : "#0288d1",
                      fontSize: "0.72rem",
                    }}
                  >
                    Tap to remove
                  </Typography>
                )}
              </Box>
            </Box>

            <Typography sx={{ fontSize: "1.4rem" }}>{item.emoji}</Typography>
          </MenuItem>
        ))}

        {reactionsList.length === 0 && (
          <Typography
            variant="body2"
            sx={{
              textAlign: "center",
              py: 3,
              color: isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)",
            }}
          >
            No reactions yet.
          </Typography>
        )}
      </Box>
    </SwipeableDrawer>
  );
};

export default React.memo(MessageReactionsDrawer);
