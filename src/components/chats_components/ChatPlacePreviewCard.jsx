// src/components/chats_components/ChatPlacePreviewCard.jsx
import React, { useState } from "react";
import { Box, Typography, Button, Chip, Rating, Snackbar, Alert, IconButton } from "@mui/material";
import PlaceIcon from "@mui/icons-material/Place";
import MapIcon from "@mui/icons-material/Map";
import BookmarkBorderIcon from "@mui/icons-material/BookmarkBorder";
import BookmarkIcon from "@mui/icons-material/Bookmark";
import ShareOutlinedIcon from "@mui/icons-material/ShareOutlined";
import { safeImageUrl } from "../../utils/uiHelpers";

const ChatPlacePreviewCard = ({ cardData = {}, isDark = true, onShare = null }) => {
  const [saved, setSaved] = useState(false);
  const [toastOpen, setToastOpen] = useState(false);

  const title = cardData.title || cardData.name || "Tourist Attraction";
  const location = cardData.location || cardData.city || "";
  const rating = Number(cardData.rating) || 4.8;
  const category = cardData.category || "Must Visit";
  const description = cardData.description || "";
  const imageUrl = safeImageUrl(cardData.imageUrl || cardData.image || cardData.photo);
  const mapsUrl =
    cardData.mapsUrl ||
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      `${title} ${location}`
    )}`;

  const handleOpenMaps = (e) => {
    e.stopPropagation();
    window.open(mapsUrl, "_blank", "noopener,noreferrer");
  };

  const handleToggleSave = (e) => {
    e.stopPropagation();
    setSaved((prev) => !prev);
    setToastOpen(true);
  };

  return (
    <>
      <Box
        sx={{
          mt: 1,
          mb: 1,
          minWidth: { xs: 260, sm: 320 },
          maxWidth: 380,
          width: "100%",
          overflow: "hidden",
          bgcolor: 'transparent',
          border: `0px solid`,
          boxShadow: 'none',
        }}
      >
        {/* Cover Photo */}
        <Box
          sx={{
            height: 130,
            borderRadius: 5,
            mb: 1,
            position: "relative",
            bgcolor: isDark ? "#2a1e12" : "#fff3e0",
            backgroundImage: imageUrl
              ? `url(${imageUrl})`
              : "linear-gradient(135deg, #ff9800 0%, #ff5722 100%)",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              borderRadius: 4.8,
              background: isDark 
                ? "linear-gradient(to right, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.2) 60%, transparent 100%)" 
                : "linear-gradient(to right, rgba(0, 0, 0, 0.52) 0%, rgba(0,0,0,0.2) 60%, transparent 100%)",
            }}
          />

          {/* Category Chip */}
          <Box sx={{ position: "absolute", top: 12, left: 12 }}>
            <Chip
              icon={<PlaceIcon sx={{ fontSize: "13px !important", color: "#fff !important" }} />}
              label={category}
              size="small"
              sx={{
                height: 24,
                fontSize: "0.7rem",
                fontWeight: 700,
                bgcolor: "rgba(255, 255, 255, 0.1)",
                color: "#fff",
                backdropFilter: "blur(10px)",
                boxShadow: "none",
              }}
            />
          </Box>

          {/* Place Title */}
          <Box sx={{ position: "absolute", bottom: 35, left: 14, right: 14 }}>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 800,
                fontSize: "1.1rem",
                color: "#fff",
                lineHeight: 1.2,
                letterSpacing: "-0.01em",
              }}
              noWrap
            >
              {title}
            </Typography>
            {location && (
              <Typography
                variant="caption"
                sx={{ color: "rgba(255,255,255,0.85)", fontSize: "0.75rem", fontWeight: 500 }}
                noWrap
              >
                📍 {location}
              </Typography>
            )}
          </Box>

          {/* Rating Row inside bottom banner */}
          <Box sx={{ position: "absolute", bottom: 10, left: 14, display: "flex", alignItems: "center", gap: 1 }}>
            <Rating value={rating} precision={0.1} readOnly size="small" sx={{ color: "#ffb400" }} />
            <Typography variant="caption" sx={{ fontWeight: 700, fontSize: "0.75rem", color: "#fff", textShadow: "0 1px 2px rgba(0,0,0,0.6)" }}>
              {rating.toFixed(1)}
            </Typography>
          </Box>
        </Box>

        {/* Description snippet */}
        {description && (
          <Typography
            variant="body2"
            sx={{
              fontSize: "0.8rem",
              color: isDark ? "rgba(255,255,255,0.75)" : "rgba(0,0,0,0.7)",
              px: 1,
              mb: 1.2,
              lineHeight: 1.4,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {description}
          </Typography>
        )}

        {/* Suggested Quick Access Action Buttons */}
        <Box sx={{ display: "flex", gap: 1, alignItems: "center", px: 1 }}>
          <Button
            fullWidth
            variant="contained"
            size="small"
            onClick={handleOpenMaps}
            endIcon={<MapIcon sx={{ fontSize: "14px !important" }} />}
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
            Open in Maps
          </Button>

          <Button
            variant="contained"
            size="small"
            fullWidth
            startIcon={saved ? <BookmarkIcon sx={{ fontSize: 16, color: "#ff9800" }} /> : <BookmarkBorderIcon sx={{ fontSize: 16 }} />}
            onClick={handleToggleSave}
            sx={{
              py: 0.8,
              px: 1.6,
              borderRadius: 8,
              bgcolor: isDark ? "rgb(26, 26, 26)" : "rgb(255, 255, 255)",
              color: isDark ? "#fff" : "#1c1c1e",
              textTransform: "none",
              boxShadow: 'none',
              fontWeight: 600,
              fontSize: "0.8rem",
              whiteSpace: "nowrap",
              transition: "all 150ms ease",
              "&:hover": {
                bgcolor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
                boxShadow: 'none',
              },
            }}
          >
            {saved ? "Saved" : "Save"}
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
              title="Share Place Card"
            >
              <ShareOutlinedIcon sx={{ fontSize: 16 }} />
            </IconButton>
          )}
        </Box>
      </Box>

      <Snackbar
        open={toastOpen}
        autoHideDuration={2500}
        onClose={() => setToastOpen(false)}
      >
        <Alert severity="success" sx={{ borderRadius: "12px" }}>
          {saved ? "Place saved to your favorites!" : "Removed from saved places."}
        </Alert>
      </Snackbar>
    </>
  );
};

export default React.memo(ChatPlacePreviewCard);