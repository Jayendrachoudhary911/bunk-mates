// src/components/chats_components/ChatNotePreviewCard.jsx
import React, { useState } from "react";
import { Box, Typography, Button, Chip, Snackbar, Alert, IconButton } from "@mui/material";
import NoteIcon from "@mui/icons-material/Description";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import FlightTakeoffIcon from "@mui/icons-material/FlightTakeoff";
import ShareOutlinedIcon from "@mui/icons-material/ShareOutlined";
import { useNavigate } from "react-router-dom";

const ChatNotePreviewCard = ({ cardData = {}, isDark = true, onShare = null }) => {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  const title = cardData.title || "Trip Note";
  const content = cardData.content || cardData.text || "";
  const tripId = cardData.tripId || "";
  const tripTitle = cardData.tripTitle || cardData.tripName || "";

  const handleCopy = (e) => {
    e.stopPropagation();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(`${title}\n\n${content}`);
      setCopied(true);
    }
  };

  const handleGoToTrip = (e) => {
    e.stopPropagation();
    if (tripId) {
      navigate(`/trip/${tripId}`);
    }
  };

  return (
    <>
      <Box
        sx={{
          mt: 1,
          mb: 1,
          minWidth: { xs: 280, sm: 340 },
          maxWidth: 380,
          width: "100%",
          overflow: "hidden",
          bgcolor: "transparent",
          border: "0px solid",
          boxShadow: "none",
        }}
      >
        {/* Main Note Card Container */}
        <Box
          sx={{
            p: 1.8,
            borderRadius: 6,
            mb: 1,
            bgcolor: isDark ? "rgba(26, 26, 26, 0.6)" : "rgb(255, 255, 255)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            border: `0px solid ${
              isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.06)"
            }`,
          }}
        >
          {/* Header */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              mb: 1.2,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Box
                sx={{
                  width: 30,
                  height: 30,
                  borderRadius: "9px",
                  bgcolor: "rgba(156, 39, 176, 0.18)",
                  color: "#ba68c8",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <NoteIcon sx={{ fontSize: 18 }} />
              </Box>
              <Typography variant="caption" sx={{ fontWeight: 700, fontSize: "0.72rem", color: "#ba68c8" }}>
                Shared Note
              </Typography>
            </Box>

            {tripTitle && (
              <Chip
                icon={<FlightTakeoffIcon sx={{ fontSize: 12 }} />}
                label={tripTitle}
                size="small"
                onClick={handleGoToTrip}
                clickable
                sx={{
                  height: 20,
                  fontSize: "0.64rem",
                  bgcolor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
                  color: isDark ? "#fff" : "#111",
                  border: "none",
                }}
              />
            )}
          </Box>

          {/* Note Title */}
          <Typography variant="subtitle2" sx={{ fontWeight: 800, fontSize: "0.92rem", mb: 0.8 }}>
            {title}
          </Typography>

          {/* Note Content preview */}
          {content && (
            <Box
              sx={{
                p: 1.2,
                borderRadius: "10px",
                bgcolor: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
                border: "none",
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  fontSize: "0.8rem",
                  color: isDark ? "rgba(255,255,255,0.8)" : "rgba(0,0,0,0.8)",
                  whiteSpace: "pre-line",
                  lineHeight: 1.4,
                  maxHeight: 100,
                  overflowY: "auto",
                  "&::-webkit-scrollbar": { width: 4 },
                  "&::-webkit-scrollbar-thumb": {
                    backgroundColor: isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.15)",
                    borderRadius: 2,
                  },
                }}
              >
                {content}
              </Typography>
            </Box>
          )}
        </Box>

        {/* Action Footer Buttons (Copy Note & Share/Trip) */}
        <Box sx={{ display: "flex", gap: 1, alignItems: "center", px: 0.5 }}>
          <Button
            fullWidth
            variant="contained"
            size="small"
            onClick={handleCopy}
            startIcon={<ContentCopyIcon sx={{ fontSize: "15px !important" }} />}
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
            Copy Note
          </Button>

          {tripId && (
            <Button
              variant="contained"
              size="small"
              fullWidth
              onClick={handleGoToTrip}
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
              Go to Trip
            </Button>
          )}

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
              title="Share Note Card"
            >
              <ShareOutlinedIcon sx={{ fontSize: 16 }} />
            </IconButton>
          )}
        </Box>
      </Box>

      <Snackbar
        open={copied}
        autoHideDuration={2000}
        onClose={() => setCopied(false)}
      >
        <Alert severity="success" sx={{ borderRadius: "12px" }}>
          Note copied to clipboard!
        </Alert>
      </Snackbar>
    </>
  );
};

export default React.memo(ChatNotePreviewCard);