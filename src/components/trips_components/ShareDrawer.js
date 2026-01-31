import React from "react";
import {
  Box, Typography, Button, TextField, InputAdornment, IconButton,
  SwipeableDrawer, Tooltip
} from "@mui/material";
import { QRCodeSVG } from "qrcode.react";
import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import ShareIcon from "@mui/icons-material/Share";
import ContentCopy from "@mui/icons-material/ContentCopy";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import TelegramIcon from "@mui/icons-material/Telegram";
import TwitterIcon from "@mui/icons-material/Twitter";
import InstagramIcon from "@mui/icons-material/Instagram";

const ShareDrawer = ({
  shareDrawerOpen,
  setShareDrawerOpen,
  inviteLink,
  trip,
  mode,
  generateSharePoster,
  setSnackbar,
}) => {
  return (
    <SwipeableDrawer
      anchor="bottom"
      open={shareDrawerOpen}
      onClose={() => setShareDrawerOpen(false)}
      ModalProps={{
        BackdropProps: {
          sx: {
            p: 3,
            backgroundColor: mode === "dark" ? "#0000000d" : "#0000000d",
            backdropFilter: "blur(10px)",
          },
        },
      }}
      PaperProps={{
        sx: {
          p: 3,
          borderRadius: 8,
          backgroundColor: mode === "dark" ? "#00000061" : "#ffffff10",
          backgroundImage: "none",
          backdropFilter: "blur(40px)",
          webkitBackdropFilter: "blur(40px)",
          boxShadow: "none",
          m: 1.2
        },
      }}
    >
      {/* Drawer Handle */}
      <Box
        sx={{
          width: 40,
          height: 5,
          bgcolor: "grey.500",
          opacity: 0.5,
          borderRadius: 2.5,
          mx: "auto",
          mb: 2,
          cursor: "grab",
        }}
      />

      {/* Header */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: 3,
        }}
      >
        <Typography variant="h6" fontWeight="bold">
          Share Trip Invite
        </Typography>
        <IconButton onClick={() => setShareDrawerOpen(false)}>
          <CloseOutlinedIcon />
        </IconButton>
      </Box>

      {/* QR Code */}
      <Box sx={{ mb: 3, display: "flex", justifyContent: "center" }}>
        <Box
          sx={{
            width: 210,
            height: 210,
            backgroundColor: "#fff",
            p: 2,
            borderRadius: 4,
            boxShadow: "0 4px 14px rgba(0,0,0,0.15)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <QRCodeSVG value={inviteLink} size={200} bgColor="#fff" fgColor="#000" />
        </Box>
      </Box>

      {/* Invite Link */}
      <TextField
        fullWidth
        multiline
        value={inviteLink}
        InputProps={{
          readOnly: true,
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                onClick={() => {
                  navigator.clipboard.writeText(inviteLink);
                  setSnackbar({ open: true, message: "Copied invite link!" });
                }}
              >
                <ContentCopy />
              </IconButton>
            </InputAdornment>
          ),
        }}
        sx={{ mb: 3 }}
      />

      {/* Native Device Share */}
      {navigator.share && (
        <Button
          fullWidth
          variant="contained"
          startIcon={<ShareIcon />}
          onClick={async () => {
            try {
              await navigator.share({
                title: `Join my trip "${trip?.name}" on BunkMate!`,
                text: `Hey! Join our trip "${trip?.name}" using this invite link.`,
                url: inviteLink,
              });
              setSnackbar({ open: true, message: "Shared successfully!" });
            } catch (error) {
              console.log("Share cancelled or failed:", error);
            }
          }}
          sx={{
            mb: 2,
            py: 1.3,
            fontWeight: 600,
            borderRadius: 10,
            backgroundColor: mode === "dark" ? "#ffffff" : "#000000",
            color: mode === "dark" ? "#000" : "#fff",
            "&:hover": {
              backgroundColor: mode === "dark" ? "#f1f1f1" : "#111",
            },
          }}
        >
          Share via Device
        </Button>
      )}

      {/* Social Sharing Options */}
      <Box
        display="flex"
        flexWrap="wrap"
        justifyContent="center"
        alignItems="center"
        gap={2}
      >
        <Tooltip title="Share on WhatsApp">
          <IconButton
            component="a"
            href={`https://wa.me/?text=${encodeURIComponent(
              `You're invited to join "${trip?.name}" on BunkMate! 🚀\nTap here: ${inviteLink}`
            )}`}
            target="_blank"
            sx={{
              backgroundColor: "#25D366",
              color: "#fff",
              p: 2,
              "&:hover": { opacity: 0.8 },
            }}
          >
            <WhatsAppIcon />
          </IconButton>
        </Tooltip>

        <Tooltip title="Share on Telegram">
          <IconButton
            component="a"
            href={`https://t.me/share/url?url=${encodeURIComponent(
              inviteLink
            )}&text=${encodeURIComponent(
              `Join our "${trip?.name}" on BunkMate! 🚀`
            )}`}
            target="_blank"
            sx={{
              backgroundColor: "#229ED9",
              color: "#fff",
              p: 2,
              "&:hover": { opacity: 0.8 },
            }}
          >
            <TelegramIcon />
          </IconButton>
        </Tooltip>

        <Tooltip title="Share on X (Twitter)">
          <IconButton
            component="a"
            href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(
              `Join my trip "${trip?.name}" on BunkMate! 🌍 ${inviteLink}`
            )}`}
            target="_blank"
            sx={{
              backgroundColor: "#1DA1F2",
              color: "#fff",
              p: 2,
              "&:hover": { opacity: 0.8 },
            }}
          >
            <TwitterIcon />
          </IconButton>
        </Tooltip>

        <Tooltip title="Copy for Instagram Story">
          <IconButton
            onClick={() => {
              navigator.clipboard.writeText(inviteLink);
              setSnackbar({
                open: true,
                message: "Copied! Paste link in your Instagram story caption.",
              });
            }}
            sx={{
              backgroundColor: "#E1306C",
              color: "#fff",
              p: 2,
              "&:hover": { opacity: 0.8 },
            }}
          >
            <InstagramIcon />
          </IconButton>
        </Tooltip>

        <Tooltip title="Share QR Image">
          <IconButton
            onClick={async () => {
              try {
                const canvas = document.querySelector("svg").outerHTML;
                const blob = new Blob([canvas], { type: "image/svg+xml" });
                const file = new File([blob], "trip_qr.svg", { type: "image/svg+xml" });

                if (navigator.canShare && navigator.canShare({ files: [file] })) {
                  await navigator.share({
                    title: `Trip QR for ${trip?.name}`,
                    text: "Scan this QR to join our trip on BunkMate!",
                    files: [file],
                  });
                } else {
                  setSnackbar({
                    open: true,
                    message: "QR saved. Your device may not support file sharing.",
                  });
                }
              } catch (error) {
                console.log("QR sharing failed:", error);
              }
            }}
            sx={{
              backgroundColor: mode === "dark" ? "#555" : "#ddd",
              color: mode === "dark" ? "#fff" : "#000",
              p: 2,
              "&:hover": { opacity: 0.9 },
            }}
          >
            <ShareIcon />
          </IconButton>
        </Tooltip>
      </Box>
    </SwipeableDrawer>
  );
};

export default ShareDrawer;