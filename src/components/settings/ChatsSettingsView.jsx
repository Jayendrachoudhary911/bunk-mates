import React, { useState } from "react";
import {
  Box,
  Typography,
  Select,
  MenuItem,
  FormControl,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Snackbar,
} from "@mui/material";
import {
  WallpaperOutlined,
  SendOutlined,
  LinkOutlined,
  DoneAllOutlined,
  EditOutlined,
  TimerOutlined,
  CloudDownloadOutlined,
  DeleteSweepOutlined,
  DeleteForeverOutlined,
  RestartAltOutlined,
  ArchiveOutlined,
} from "../../icons";
import {
  SettingsHeader,
  SettingsCard,
  SettingsSectionTitle,
  SettingsSwitchRow,
  SettingsRow,
  SETTINGS_THEME,
} from "./SettingsComponents";

const WALLPAPERS = [
  { id: "none", name: "Default Pure Dark", url: "none" },
  { id: "1", name: "Aurora Night", url: "/assets/images/chatbg/1.jpeg" },
  { id: "2", name: "Deep Indigo", url: "/assets/images/chatbg/2.jpeg" },
  { id: "3", name: "Cosmic Glow", url: "/assets/images/chatbg/3.jpeg" },
  { id: "4", name: "Dark Peaks", url: "/assets/images/chatbg/4.jpeg" },
  { id: "5", name: "Star Trails", url: "/assets/images/chatbg/5.jpeg" },
];

export const ChatsSettingsView = ({ onBack, preferences, onUpdatePreference }) => {
  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  const chat = preferences?.chat || {
    wallpaper: "none",
    enterIsSend: true,
    linkPreviews: true,
    readReceipts: true,
    typingIndicator: true,
    disappearingMessages: "off",
    autoDownloadMedia: true,
    saveToGallery: false,
    keepArchived: true,
  };

  const handleUpdate = (key, value) => {
    onUpdatePreference("chat", { [key]: value });
  };

  const handleClearAllMessages = () => {
    localStorage.removeItem("bunkmates_chat_local_cache");
    setClearDialogOpen(false);
    setSnackbarMessage("Local chat message cache cleared.");
  };

  const handleDeleteAllChats = () => {
    setDeleteDialogOpen(false);
    setSnackbarMessage("Chat storage reset successfully.");
  };

  const handleResetSettings = () => {
    onUpdatePreference("chat", {
      wallpaper: "none",
      enterIsSend: true,
      linkPreviews: true,
      readReceipts: true,
      typingIndicator: true,
      disappearingMessages: "off",
      autoDownloadMedia: true,
      saveToGallery: false,
      keepArchived: true,
    });
    setSnackbarMessage("Chat preferences restored to defaults.");
  };

  return (
    <Box sx={{ minHeight: "100%", pb: 6, backgroundColor: SETTINGS_THEME.bg }}>
      <SettingsHeader title="Chats" onBack={onBack} />

      {/* Chat Display & Wallpaper */}
      <SettingsSectionTitle>CHAT DISPLAY & WALLPAPER</SettingsSectionTitle>
      <SettingsCard sx={{ p: 2.5 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1.5 }}>
          <WallpaperOutlined sx={{ fontSize: 20, color: SETTINGS_THEME.accent }} />
          <Typography sx={{ fontWeight: 600, fontSize: "0.95rem", color: "#FFFFFF" }}>
            Chat Wallpaper
          </Typography>
        </Box>

        <Box sx={{ display: "flex", gap: 1.5, overflowX: "auto", pb: 1, mb: 2 }}>
          {WALLPAPERS.map((wp) => {
            const isSelected = (chat.wallpaper || "none") === wp.url;
            return (
              <Box
                key={wp.id}
                onClick={() => handleUpdate("wallpaper", wp.url)}
                sx={{
                  flexShrink: 0,
                  width: 72,
                  height: 100,
                  borderRadius: "14px",
                  cursor: "pointer",
                  border: isSelected
                    ? `2.5px solid ${SETTINGS_THEME.accent}`
                    : "1.5px solid rgba(255, 255, 255, 0.12)",
                  backgroundColor: wp.url === "none" ? "#1A1A1E" : "#2A2A30",
                  backgroundImage: wp.url !== "none" ? `url(${wp.url})` : "none",
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  display: "flex",
                  alignItems: "flex-end",
                  p: 0.8,
                  transition: "transform 0.2s ease, border-color 0.2s ease",
                  "&:hover": { transform: "scale(1.05)" },
                }}
              >
                <Typography
                  sx={{
                    fontSize: "0.65rem",
                    fontWeight: 700,
                    color: "#FFFFFF",
                    backgroundColor: "rgba(0,0,0,0.6)",
                    borderRadius: "6px",
                    px: 0.5,
                  }}
                >
                  {wp.name.split(" ")[0]}
                </Typography>
              </Box>
            );
          })}
        </Box>

        <SettingsSwitchRow
          icon={<SendOutlined sx={{ fontSize: 20 }} />}
          title="Enter is Send"
          subtitle="Pressing Enter on desktop or keyboard sends the message"
          checked={chat.enterIsSend}
          onChange={(checked) => handleUpdate("enterIsSend", checked)}
        />

        <SettingsSwitchRow
          icon={<LinkOutlined sx={{ fontSize: 20 }} />}
          title="Link Previews"
          subtitle="Show rich link previews for travel destinations and URLs"
          checked={chat.linkPreviews}
          onChange={(checked) => handleUpdate("linkPreviews", checked)}
          isLast
        />
      </SettingsCard>

      {/* Privacy & Receipts */}
      <SettingsSectionTitle>PRIVACY & RECEIPTS</SettingsSectionTitle>
      <SettingsCard sx={{ p: 0 }}>
        <SettingsSwitchRow
          icon={<DoneAllOutlined sx={{ fontSize: 20 }} />}
          title="Read Receipts"
          subtitle="If turned off, you won't send or see read receipts"
          checked={chat.readReceipts}
          onChange={(checked) => handleUpdate("readReceipts", checked)}
        />

        <SettingsSwitchRow
          icon={<EditOutlined sx={{ fontSize: 20 }} />}
          title="Typing Indicator"
          subtitle="Show other group members when you are composing a reply"
          checked={chat.typingIndicator}
          onChange={(checked) => handleUpdate("typingIndicator", checked)}
        />

        {/* Disappearing Messages */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            py: 2,
            px: 2,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.8 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                backgroundColor: SETTINGS_THEME.iconBg,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#FFFFFF",
              }}
            >
              <TimerOutlined sx={{ fontSize: 20 }} />
            </Box>
            <Box>
              <Typography sx={{ fontWeight: 600, fontSize: "0.98rem", color: "#FFFFFF" }}>
                Disappearing Messages
              </Typography>
              <Typography sx={{ fontSize: "0.82rem", color: SETTINGS_THEME.textSecondary }}>
                Auto-delete new messages after time elapsed
              </Typography>
            </Box>
          </Box>

          <FormControl size="small">
            <Select
              value={chat.disappearingMessages || "off"}
              onChange={(e) => handleUpdate("disappearingMessages", e.target.value)}
              sx={{
                color: "#FFFFFF",
                backgroundColor: "#202024",
                borderRadius: "12px",
                fontSize: "0.85rem",
                fontWeight: 600,
                "& fieldset": { borderColor: SETTINGS_THEME.divider },
                "& .MuiSvgIcon-root": { color: "#FFFFFF" },
              }}
            >
              <MenuItem value="off">Off</MenuItem>
              <MenuItem value="24h">24 Hours</MenuItem>
              <MenuItem value="7d">7 Days</MenuItem>
              <MenuItem value="90d">90 Days</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </SettingsCard>

      {/* Media & Storage */}
      <SettingsSectionTitle>MEDIA & STORAGE</SettingsSectionTitle>
      <SettingsCard sx={{ p: 0 }}>
        <SettingsSwitchRow
          icon={<CloudDownloadOutlined sx={{ fontSize: 20 }} />}
          title="Auto-Download Media"
          subtitle="Automatically download photos and trip tickets over Wi-Fi & cellular"
          checked={chat.autoDownloadMedia}
          onChange={(checked) => handleUpdate("autoDownloadMedia", checked)}
        />

        <SettingsSwitchRow
          icon={<ArchiveOutlined sx={{ fontSize: 20 }} />}
          title="Keep Chats Archived"
          subtitle="Archived chats will remain archived when new messages arrive"
          checked={chat.keepArchived}
          onChange={(checked) => handleUpdate("keepArchived", checked)}
          isLast
        />
      </SettingsCard>

      {/* Storage Management & Danger */}
      <SettingsSectionTitle>STORAGE MANAGEMENT</SettingsSectionTitle>
      <SettingsCard sx={{ p: 0 }}>
        <SettingsRow
          icon={<DeleteSweepOutlined sx={{ fontSize: 20 }} />}
          title="Clear All Messages"
          subtitle="Delete all message history while keeping your groups and chat rooms"
          onClick={() => setClearDialogOpen(true)}
        />

        <SettingsRow
          icon={<DeleteForeverOutlined sx={{ fontSize: 20, color: SETTINGS_THEME.error }} />}
          iconBg="rgba(240, 82, 82, 0.15)"
          title="Delete All Chats"
          subtitle="Leave all non-essential chat groups and clear all chat data"
          destructive
          onClick={() => setDeleteDialogOpen(true)}
        />

        <SettingsRow
          icon={<RestartAltOutlined sx={{ fontSize: 20 }} />}
          title="Reset Chat Settings"
          subtitle="Restore all chat configuration to application defaults"
          isLast
          onClick={handleResetSettings}
        />
      </SettingsCard>

      {/* Clear Messages Dialog */}
      <Dialog
        open={clearDialogOpen}
        onClose={() => setClearDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: "#161616",
            color: "#FFFFFF",
            borderRadius: "24px",
            border: `1px solid ${SETTINGS_THEME.divider}`,
            p: 1,
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, fontSize: "1.2rem" }}>
          Clear All Messages?
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ color: SETTINGS_THEME.textSecondary, fontSize: "0.9rem" }}>
            This will wipe cached messages on this device. You will remain a member of all your trip
            groups and conversations.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setClearDialogOpen(false)}
            sx={{ color: SETTINGS_THEME.textSecondary, textTransform: "none", fontWeight: 600 }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleClearAllMessages}
            sx={{
              backgroundColor: SETTINGS_THEME.accent,
              color: "#FFFFFF",
              textTransform: "none",
              fontWeight: 700,
              borderRadius: "14px",
              px: 3,
            }}
          >
            Clear Messages
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete All Chats Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: "#161616",
            color: "#FFFFFF",
            borderRadius: "24px",
            border: `1px solid ${SETTINGS_THEME.divider}`,
            p: 1,
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, fontSize: "1.2rem", color: SETTINGS_THEME.error }}>
          Delete All Chats?
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ color: SETTINGS_THEME.textSecondary, fontSize: "0.9rem" }}>
            This destructive action removes your chat threads and attachments. This cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setDeleteDialogOpen(false)}
            sx={{ color: SETTINGS_THEME.textSecondary, textTransform: "none", fontWeight: 600 }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDeleteAllChats}
            sx={{
              borderRadius: "14px",
              textTransform: "none",
              fontWeight: 700,
              px: 3,
            }}
          >
            Delete Everything
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={Boolean(snackbarMessage)}
        autoHideDuration={2500}
        onClose={() => setSnackbarMessage("")}
        message={snackbarMessage}
      />
    </Box>
  );
};

export default ChatsSettingsView;
