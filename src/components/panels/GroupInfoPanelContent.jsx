// src/components/panels/GroupInfoPanelContent.jsx
import React, { useState } from "react";
import {
  Box,
  Typography,
  Avatar,
  Stack,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Button,
  Snackbar,
  Alert,
} from "@mui/material";
import {
  GroupsOutlined as GroupIcon,
  ContentCopy as CopyIcon,
  Check as CheckIcon,
  PersonOutline as PersonIcon,
  CalendarMonthOutlined as CalendarIcon,
} from "../../icons";
import { useThemeToggle } from "../../contexts/ThemeToggleContext";

const GroupInfoPanelContent = ({ groupData }) => {
  const { mode } = useThemeToggle();
  const isDark = mode === "dark";
  const [copied, setCopied] = useState(false);

  const groupName = groupData?.name || groupData?.groupName || "Group";
  const description = groupData?.description || "No description provided.";
  const members = groupData?.members || [];
  const iconURL = groupData?.iconURL || "";
  const emoji = groupData?.emoji || "";
  const createdBy = groupData?.createdByName || groupData?.createdBy || null;

  const handleCopyId = () => {
    if (groupData?.id || groupName) {
      navigator.clipboard.writeText(groupData?.id || groupName);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      {/* ─── Hero Group Header ─── */}
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          p: 3,
          borderRadius: 4,
          background: isDark
            ? "linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.01) 100%)"
            : "linear-gradient(180deg, rgba(0,0,0,0.03) 0%, rgba(0,0,0,0.01) 100%)",
          border: `1px solid ${
            isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)"
          }`,
        }}
      >
        <Avatar
          src={iconURL}
          sx={{
            width: 76,
            height: 76,
            fontSize: 32,
            fontWeight: 700,
            bgcolor: isDark ? "#222" : "#eee",
            color: isDark ? "#fff" : "#111",
            boxShadow: isDark
              ? "0 10px 24px rgba(0,0,0,0.4)"
              : "0 8px 20px rgba(0,0,0,0.08)",
            border: `2px solid ${
              isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.1)"
            }`,
            mb: 2,
          }}
        >
          {emoji || groupName[0]?.toUpperCase() || "G"}
        </Avatar>

        <Typography
          variant="h6"
          sx={{
            fontWeight: 700,
            letterSpacing: "-0.3px",
            color: isDark ? "#fff" : "#111",
            mb: 0.5,
          }}
        >
          {groupName}
        </Typography>

        <Stack direction="row" spacing={1} sx={{ mt: 0.5, mb: 1.5 }}>
          <Chip
            size="small"
            icon={<GroupIcon sx={{ fontSize: "14px !important" }} />}
            label={`${members.length || 0} Members`}
            sx={{
              fontWeight: 600,
              fontSize: "0.75rem",
              borderRadius: "10px",
              bgcolor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
            }}
          />
          {groupData?.isTripGroup && (
            <Chip
              size="small"
              icon={<CalendarIcon sx={{ fontSize: "14px !important" }} />}
              label="Trip Chat"
              sx={{
                fontWeight: 600,
                fontSize: "0.75rem",
                borderRadius: "10px",
                bgcolor: "rgba(34, 197, 94, 0.15)",
                color: "#22c55e",
              }}
            />
          )}
        </Stack>

        <Typography
          variant="body2"
          sx={{
            color: isDark ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.65)",
            lineHeight: 1.5,
            fontSize: "0.85rem",
            px: 1,
          }}
        >
          {description}
        </Typography>

        <Button
          variant="outlined"
          size="small"
          startIcon={copied ? <CheckIcon /> : <CopyIcon />}
          onClick={handleCopyId}
          sx={{
            mt: 2.5,
            borderRadius: 2.5,
            textTransform: "none",
            fontSize: "0.8rem",
            color: isDark ? "#fff" : "#111",
            borderColor: isDark
              ? "rgba(255,255,255,0.2)"
              : "rgba(0,0,0,0.15)",
          }}
        >
          {copied ? "Group ID Copied" : "Copy Group ID"}
        </Button>
      </Box>

      {/* ─── Group Info Details ─── */}
      <Box
        sx={{
          p: 2,
          borderRadius: 3,
          bgcolor: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)",
          border: `1px solid ${
            isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)"
          }`,
        }}
      >
        <Typography
          variant="caption"
          sx={{
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.8px",
            color: isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)",
            mb: 1.5,
            display: "block",
          }}
        >
          Group Details
        </Typography>

        <Stack spacing={1.5}>
          {createdBy && (
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  color: isDark ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.6)",
                }}
              >
                Created by
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 600,
                  color: isDark ? "#fff" : "#111",
                }}
              >
                {createdBy}
              </Typography>
            </Box>
          )}

          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Typography
              variant="body2"
              sx={{
                color: isDark ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.6)",
              }}
            >
              Privacy
            </Typography>
            <Typography
              variant="body2"
              sx={{
                fontWeight: 600,
                color: isDark ? "#fff" : "#111",
              }}
            >
              {groupData?.isPublic ? "Public Group" : "Private Group"}
            </Typography>
          </Box>
        </Stack>
      </Box>

      <Snackbar
        open={copied}
        autoHideDuration={2500}
        onClose={() => setCopied(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity="success" sx={{ width: "100%" }}>
          Group ID copied to clipboard!
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default GroupInfoPanelContent;
