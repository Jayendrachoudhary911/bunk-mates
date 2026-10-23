import React, { useState } from "react";
import {
  Box,
  Typography,
  Button,
  Snackbar,
} from "@mui/material";
import { QRCodeSVG } from "qrcode.react";
import {
  ContentCopyOutlined,
  WhatsApp as WhatsAppIcon,
  Email as EmailIcon,
  Telegram as TelegramIcon,
  Share as ShareIcon,
} from "../../icons";
import {
  SettingsHeader,
  SettingsCard,
  SETTINGS_THEME,
} from "./SettingsComponents";

const DOWNLOAD_LINK = "https://bunkmateshome.vercel.app/bm-install";

export const InviteFriendView = ({ onBack }) => {
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(DOWNLOAD_LINK);
      setSnackbarOpen(true);
    } catch (err) {
      console.error("Failed to copy download link:", err);
    }
  };

  const handleShareMore = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Join me on BunkMates!",
          text: "Plan trips, split bills, and explore together on BunkMates:",
          url: DOWNLOAD_LINK,
        });
      } catch (_) {}
    } else {
      handleCopyLink();
    }
  };

  return (
    <Box sx={{ minHeight: "100%", pb: 6, backgroundColor: SETTINGS_THEME.bg }}>
      <SettingsHeader title="Invite a Friend" onBack={onBack} />

      <Box sx={{ px: 2, mb: 3 }}>
        <Typography sx={{ color: SETTINGS_THEME.textSecondary, fontSize: "0.95rem" }}>
          Share BunkMates with your friends and explore together!
        </Typography>
      </Box>

      {/* Main QR Card */}
      <SettingsCard sx={{ p: 3, textAlign: "center" }}>
        <Box
          sx={{
            display: "inline-block",
            p: 2,
            borderRadius: "20px",
            backgroundColor: "#FFFFFF",
            mb: 2,
            boxShadow: "0 8px 24px rgba(0, 0, 0, 0.4)",
          }}
        >
          <QRCodeSVG
            value={DOWNLOAD_LINK}
            size={220}
            level="H"
            bgColor="#FFFFFF"
            fgColor="#000000"
          />
        </Box>

        <Typography
          sx={{
            color: SETTINGS_THEME.textSecondary,
            fontSize: "0.9rem",
            fontWeight: 500,
            mb: 3,
          }}
        >
          Scan QR Code
        </Typography>

        <Box sx={{ textAlign: "left", mb: 1.5 }}>
          <Typography
            sx={{
              fontSize: "0.72rem",
              fontWeight: 700,
              color: "#7E828D",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              mb: 1,
            }}
          >
            APP DOWNLOAD LINK
          </Typography>

          <Box
            sx={{
              backgroundColor: "#202024",
              borderRadius: "14px",
              py: 1.4,
              px: 2,
              color: "#FFFFFF",
              fontSize: "0.92rem",
              fontFamily: "monospace",
              border: `1px solid ${SETTINGS_THEME.divider}`,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {DOWNLOAD_LINK}
          </Box>
        </Box>

        <Button
          fullWidth
          variant="contained"
          onClick={handleCopyLink}
          startIcon={<ContentCopyOutlined />}
          sx={{
            mt: 2,
            py: 1.5,
            borderRadius: "16px",
            backgroundColor: SETTINGS_THEME.accent,
            color: "#FFFFFF",
            fontWeight: 700,
            fontSize: "0.95rem",
            textTransform: "none",
            "&:hover": {
              backgroundColor: "#1D6ECB",
            },
          }}
        >
          Copy Download Link
        </Button>
      </SettingsCard>

      {/* Share Invite Link Via */}
      <Box sx={{ px: 2, mt: 4 }}>
        <Typography
          sx={{
            fontSize: "0.72rem",
            fontWeight: 700,
            color: "#7E828D",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            mb: 2,
          }}
        >
          SHARE INVITE LINK VIA
        </Typography>

        <Box sx={{ display: "flex", gap: 1.5, alignItems: "center", flexWrap: "wrap" }}>
          {/* WhatsApp */}
          <Box
            component="a"
            href={`https://wa.me/?text=${encodeURIComponent(
              `Join me on BunkMates! Download here: ${DOWNLOAD_LINK}`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            sx={{
              width: 52,
              height: 52,
              borderRadius: "50%",
              backgroundColor: "#202024",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#FFFFFF",
              textDecoration: "none",
              border: `1px solid ${SETTINGS_THEME.divider}`,
              transition: "transform 0.2s, background-color 0.2s",
              "&:hover": {
                transform: "translateY(-2px)",
                backgroundColor: "#2A2A30",
              },
            }}
          >
            <WhatsAppIcon sx={{ fontSize: 22 }} />
          </Box>

          {/* Email */}
          <Box
            component="a"
            href={`mailto:?subject=${encodeURIComponent(
              "Join me on BunkMates"
            )}&body=${encodeURIComponent(
              `Hey! Plan trips with me on BunkMates. Download the app here: ${DOWNLOAD_LINK}`
            )}`}
            sx={{
              width: 52,
              height: 52,
              borderRadius: "50%",
              backgroundColor: "#202024",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#FFFFFF",
              textDecoration: "none",
              border: `1px solid ${SETTINGS_THEME.divider}`,
              transition: "transform 0.2s, background-color 0.2s",
              "&:hover": {
                transform: "translateY(-2px)",
                backgroundColor: "#2A2A30",
              },
            }}
          >
            <EmailIcon sx={{ fontSize: 22 }} />
          </Box>

          {/* Telegram */}
          <Box
            component="a"
            href={`https://t.me/share/url?url=${encodeURIComponent(
              DOWNLOAD_LINK
            )}&text=${encodeURIComponent("Join me on BunkMates!")}`}
            target="_blank"
            rel="noopener noreferrer"
            sx={{
              width: 52,
              height: 52,
              borderRadius: "50%",
              backgroundColor: "#202024",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#FFFFFF",
              textDecoration: "none",
              border: `1px solid ${SETTINGS_THEME.divider}`,
              transition: "transform 0.2s, background-color 0.2s",
              "&:hover": {
                transform: "translateY(-2px)",
                backgroundColor: "#2A2A30",
              },
            }}
          >
            <TelegramIcon sx={{ fontSize: 22 }} />
          </Box>

          {/* More pill button */}
          <Box
            onClick={handleShareMore}
            sx={{
              height: 52,
              px: 3,
              borderRadius: "26px",
              backgroundColor: "#202024",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 1,
              color: "#FFFFFF",
              cursor: "pointer",
              border: `1px solid ${SETTINGS_THEME.divider}`,
              transition: "transform 0.2s, background-color 0.2s",
              "&:hover": {
                transform: "translateY(-2px)",
                backgroundColor: "#2A2A30",
              },
            }}
          >
            <ShareIcon sx={{ fontSize: 18 }} />
            <Typography sx={{ fontWeight: 600, fontSize: "0.9rem" }}>More</Typography>
          </Box>
        </Box>
      </Box>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={2500}
        onClose={() => setSnackbarOpen(false)}
        message="App download link copied to clipboard!"
      />
    </Box>
  );
};

export default InviteFriendView;
