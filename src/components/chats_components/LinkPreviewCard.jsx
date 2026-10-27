// src/components/chats_components/LinkPreviewCard.jsx
import React from "react";
import { Box, Typography, Paper } from "@mui/material";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import LanguageIcon from "@mui/icons-material/Language";
import YouTubeIcon from "@mui/icons-material/YouTube";
import PlaceIcon from "@mui/icons-material/Place";
import MusicNoteIcon from "@mui/icons-material/MusicNote";
import GitHubIcon from "@mui/icons-material/GitHub";
import { parseUrlMetadata } from "../../utils/chatHelpers";

const LinkPreviewCard = ({ url, isDark = true }) => {
  const meta = React.useMemo(() => parseUrlMetadata(url), [url]);
  if (!meta) return null;

  const handleClick = (e) => {
    e.stopPropagation();
    window.open(meta.url, "_blank", "noopener,noreferrer");
  };

  const getServiceIcon = () => {
    switch (meta.type) {
      case "youtube":
        return <YouTubeIcon sx={{ color: "#ff0000", fontSize: 18 }} />;
      case "maps":
        return <PlaceIcon sx={{ color: "#4caf50", fontSize: 18 }} />;
      case "spotify":
        return <MusicNoteIcon sx={{ color: "#1db954", fontSize: 18 }} />;
      case "github":
        return <GitHubIcon sx={{ color: isDark ? "#fff" : "#111", fontSize: 18 }} />;
      default:
        return <LanguageIcon sx={{ opacity: 0.6, fontSize: 18 }} />;
    }
  };

  return (
    <Paper
      elevation={0}
      onClick={handleClick}
      sx={{
        mt: 1,
        mb: 0.5,
        borderRadius: 4,
        overflow: "hidden",
        bgcolor: isDark ? "rgba(0, 0, 0, 0.35)" : "rgb(255, 255, 255)",
        border: `1px solid ${
          isDark ? "rgba(255, 255, 255, 0.12)" : "rgba(0, 0, 0, 0.08)"
        }`,
        cursor: "pointer",
        transition: "transform 0.15s ease, background 0.15s ease, border-color 0.15s ease",
        maxWidth: 320,
        "&:hover": {
          bgcolor: isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.08)",
          borderColor: isDark ? "rgba(255, 255, 255, 0.21)" : "rgba(0, 0, 0, 0.18)",
          transform: "translateY(-1px)",
        },
      }}
    >
      {/* Video / image thumbnail if available */}
      {meta.thumbnail && (
        <Box
          component="img"
          src={meta.thumbnail}
          alt={meta.title}
          sx={{
            width: "100%",
            height: 140,
            objectFit: "cover",
            display: "block",
          }}
        />
      )}

      <Box sx={{ p: 1.2 }}>
        {/* Favicon & Hostname Header */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.8, mb: 0.5 }}>
          {meta.favicon ? (
            <Box
              component="img"
              src={meta.favicon}
              alt={meta.hostname}
              onError={(e) => {
                e.target.style.display = "none";
              }}
              sx={{ width: 15, height: 15, borderRadius: "3px" }}
            />
          ) : (
            getServiceIcon()
          )}
          <Typography
            variant="caption"
            sx={{
              fontWeight: 700,
              fontSize: "0.72rem",
              textTransform: "uppercase",
              letterSpacing: 0.4,
              opacity: 0.75,
              flex: 1,
            }}
            noWrap
          >
            {meta.hostname}
          </Typography>
          <OpenInNewIcon sx={{ fontSize: 13, opacity: 0.5 }} />
        </Box>

        {/* Title */}
        <Typography
          variant="body2"
          sx={{
            fontWeight: 600,
            fontSize: "0.85rem",
            lineHeight: 1.25,
            mb: 0.3,
            color: isDark ? "#fff" : "#111",
          }}
          noWrap
        >
          {meta.title}
        </Typography>

        {/* URL snippet */}
        <Typography
          variant="caption"
          sx={{
            fontSize: "0.7rem",
            opacity: 0.6,
            wordBreak: "break-all",
            display: "-webkit-box",
            WebkitLineClamp: 1,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {meta.url}
        </Typography>
      </Box>
    </Paper>
  );
};

export default React.memo(LinkPreviewCard);
