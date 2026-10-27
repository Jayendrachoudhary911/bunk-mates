import React from "react";
import {
  Collapse,
  Paper,
  Typography,
  Box,
  Avatar,
} from "@mui/material";

const GroupMentionDrawer = ({
  open,
  members = [],
  memberInfo = {},
  onSelectMember,
  effectiveChatTheme = "dark",
}) => {
  const isDark = effectiveChatTheme === "dark";

  return (
    <Collapse in={open} timeout={250} unmountOnExit>
      <Paper
        elevation={0}
        sx={{
          bgcolor: 'transparent',
          backgroundImage: 'none',
          color: isDark ? "#fff" : "#111",
          border: `0px solid ${
            isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"
          }`,
          boxShadow: 'none',
          p: 0.5,
          mb: 1.5,
          maxHeight: "42vh",
          overflowY: "auto",
        }}
      >
        <Typography
          variant="caption"
          sx={{
            fontWeight: 700,
            color: isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)",
            px: 0.5,
            mb: 1.5,
            display: "block",
            letterSpacing: "0.5px",
            textTransform: "uppercase",
          }}
        >
          Mention a member
        </Typography>

        {/* Card Grid Layout */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))",
            gap: 1.5,
          }}
        >
          {members.map((uid) => {
            const member = memberInfo[uid] || {};
            const name = member.name || "Member";
            const username = member.username;

            return (
              <Box
                key={uid}
                onClick={() => onSelectMember(username || name)}
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  textAlign: "center",
                  gap: 0.8,
                  p: 1.5,
                  borderRadius: 5,
                  cursor: "pointer",
                  bgcolor: isDark
                    ? "rgba(255, 255, 255, 0.03)"
                    : "rgba(0, 0, 0, 0.02)",
                  border: `0px solid ${
                    isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)"
                  }`,
                  transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                  "&:hover": {
                    bgcolor: isDark
                      ? "rgba(255, 255, 255, 0.08)"
                      : "rgba(0, 0, 0, 0.05)",
                    borderColor: isDark
                      ? "rgba(255,255,255,0.15)"
                      : "rgba(0,0,0,0.1)",
                    transform: "translateY(-3px)",
                    boxShadow: isDark
                      ? "0 6px 16px rgba(0,0,0,0.4)"
                      : "0 4px 12px rgba(0,0,0,0.06)",
                  },
                }}
              >
                <Avatar
                  src={member.photoURL}
                  sx={{
                    width: 42,
                    height: 42,
                    fontSize: "0.95rem",
                    fontWeight: 600,
                    bgcolor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)",
                    color: isDark ? "#fff" : "#333",
                    mb: 0.2,
                  }}
                >
                  {name[0] || "?"}
                </Avatar>

                <Box sx={{ width: "100%", minWidth: 0 }}>
                  <Typography
                    variant="body2"
                    sx={{
                      fontSize: "0.82rem",
                      fontWeight: 600,
                      lineHeight: 1.25,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {name}
                  </Typography>
                  {username && (
                    <Typography
                      variant="caption"
                      sx={{
                        fontSize: "0.7rem",
                        color: isDark
                          ? "rgba(255,255,255,0.45)"
                          : "rgba(0,0,0,0.45)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        display: "block",
                        mt: 0.2,
                      }}
                    >
                      @{username}
                    </Typography>
                  )}
                </Box>
              </Box>
            );
          })}
        </Box>
      </Paper>
    </Collapse>
  );
};

export default React.memo(GroupMentionDrawer);