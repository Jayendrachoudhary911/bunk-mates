import React, { useState, useMemo } from "react";
import {
  Box,
  Typography,
  IconButton,
  InputBase,
  Chip,
  Dialog,
  Slide,
} from "@mui/material";
import {
  Search,
  Close,
  ArrowForwardIos,
  HelpOutline,
} from "@mui/icons-material";
import { SETTINGS_REGISTRY, SETTINGS_CATEGORIES } from "./settingsRegistry";
import { SETTINGS_THEME } from "./SettingsShared";

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

export default function SettingsSearchModal({ open, onClose, onSelectSetting }) {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");

  const filteredResults = useMemo(() => {
    const q = query.trim().toLowerCase();

    return SETTINGS_REGISTRY.filter((item) => {
      // Category filter
      if (activeCategory !== "all" && item.category !== activeCategory) {
        return false;
      }

      // If query is empty, show all in category (or suggestions)
      if (!q) return true;

      const titleMatch = item.title.toLowerCase().includes(q);
      const subtitleMatch = item.subtitle.toLowerCase().includes(q);
      const keywordMatch = item.keywords.some((k) => k.toLowerCase().includes(q));

      return titleMatch || subtitleMatch || keywordMatch;
    });
  }, [query, activeCategory]);

  const handleSelect = (item) => {
    onClose();
    if (onSelectSetting) {
      onSelectSetting(item.view);
    }
  };

  return (
    <Dialog
      fullScreen
      open={open}
      onClose={onClose}
      TransitionComponent={Transition}
      PaperProps={{
        sx: {
          bgcolor: SETTINGS_THEME.bg,
          color: SETTINGS_THEME.textPrimary,
          p: { xs: 2, sm: 3 },
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        },
      }}
    >
      <Box sx={{ width: "100%", maxWidth: 640, display: "flex", flexDirection: "column", height: "100%" }}>
        {/* Top Search Bar */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            bgcolor: SETTINGS_THEME.surface,
            borderRadius: "28px",
            px: 2,
            py: 0.8,
            mb: 2,
            border: "1px solid rgba(255, 255, 255, 0.08)",
          }}
        >
          <Search sx={{ color: SETTINGS_THEME.textSecondary, fontSize: 22 }} />
          <InputBase
            autoFocus
            fullWidth
            placeholder="Search settings, features, privacy..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            sx={{
              color: SETTINGS_THEME.textPrimary,
              fontSize: "0.98rem",
            }}
          />
          {query ? (
            <IconButton size="small" onClick={() => setQuery("")} sx={{ color: SETTINGS_THEME.textSecondary }}>
              <Close fontSize="small" />
            </IconButton>
          ) : (
            <IconButton size="small" onClick={onClose} sx={{ color: SETTINGS_THEME.textSecondary }}>
              <Close fontSize="small" />
            </IconButton>
          )}
        </Box>

        {/* Category Pills */}
        <Box
          sx={{
            display: "flex",
            gap: 1,
            overflowX: "auto",
            pb: 1.5,
            mb: 1,
            scrollbarWidth: "none",
            "&::-webkit-scrollbar": { display: "none" },
          }}
        >
          {SETTINGS_CATEGORIES.map((cat) => {
            const isSelected = activeCategory === cat.id;
            return (
              <Chip
                key={cat.id}
                label={cat.label}
                clickable
                onClick={() => setActiveCategory(cat.id)}
                sx={{
                  bgcolor: isSelected ? SETTINGS_THEME.accent : SETTINGS_THEME.surface,
                  color: isSelected ? "#FFFFFF" : SETTINGS_THEME.textSecondary,
                  fontWeight: isSelected ? 700 : 500,
                  fontSize: "0.82rem",
                  borderRadius: "16px",
                  border: "1px solid rgba(255, 255, 255, 0.05)",
                  "&:hover": {
                    bgcolor: isSelected ? SETTINGS_THEME.accent : "rgba(255, 255, 255, 0.1)",
                  },
                }}
              />
            );
          })}
        </Box>

        {/* Results Header */}
        <Typography
          variant="caption"
          sx={{
            color: SETTINGS_THEME.textSecondary,
            textTransform: "uppercase",
            fontWeight: 700,
            letterSpacing: "1px",
            mb: 1.5,
            ml: 1,
          }}
        >
          {query ? `Search Results (${filteredResults.length})` : "Suggested Settings"}
        </Typography>

        {/* Results List */}
        <Box
          sx={{
            flex: 1,
            overflowY: "auto",
            bgcolor: SETTINGS_THEME.card,
            borderRadius: "24px",
            border: "1px solid rgba(255, 255, 255, 0.04)",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {filteredResults.length > 0 ? (
            filteredResults.map((item, idx) => (
              <Box
                key={item.id}
                component="button"
                onClick={() => handleSelect(item)}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  py: 1.8,
                  px: 2.2,
                  bgcolor: "transparent",
                  border: "none",
                  borderBottom:
                    idx < filteredResults.length - 1
                      ? `1px solid ${SETTINGS_THEME.divider}`
                      : "none",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "background 0.15s ease",
                  "&:hover": {
                    bgcolor: "rgba(255, 255, 255, 0.04)",
                  },
                }}
              >
                <Box sx={{ minWidth: 0, pr: 1.5 }}>
                  <Typography
                    variant="body1"
                    sx={{
                      fontWeight: 600,
                      color: SETTINGS_THEME.textPrimary,
                      fontSize: "0.95rem",
                    }}
                  >
                    {item.title}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      color: SETTINGS_THEME.textSecondary,
                      fontSize: "0.8rem",
                      display: "block",
                      mt: 0.2,
                    }}
                  >
                    {item.subtitle}
                  </Typography>
                </Box>
                <ArrowForwardIos sx={{ color: SETTINGS_THEME.textSecondary, fontSize: 13 }} />
              </Box>
            ))
          ) : (
            <Box
              sx={{
                p: 5,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
              }}
            >
              <HelpOutline sx={{ fontSize: 44, color: SETTINGS_THEME.textSecondary, mb: 1.5 }} />
              <Typography variant="body1" sx={{ fontWeight: 600, color: SETTINGS_THEME.textPrimary, mb: 0.5 }}>
                No settings found
              </Typography>
              <Typography variant="caption" sx={{ color: SETTINGS_THEME.textSecondary, maxWidth: 280 }}>
                Try searching with different keywords like "theme", "password", "currency", or "weather".
              </Typography>
            </Box>
          )}
        </Box>
      </Box>
    </Dialog>
  );
}
