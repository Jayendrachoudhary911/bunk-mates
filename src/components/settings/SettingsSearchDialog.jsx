import React, { useState, useMemo } from "react";
import {
  Box,
  Typography,
  TextField,
  InputAdornment,
  Chip,
  IconButton,
  Dialog,
  Fade,
} from "@mui/material";
import {
  Search as SearchIcon,
  Close as CloseIcon,
  ArrowForwardIos,
} from "../../icons";
import {
  SETTINGS_REGISTRY,
  SETTINGS_CATEGORIES,
} from "./SettingsRegistry";
import {
  SETTINGS_THEME,
} from "./SettingsComponents";

export const SettingsSearchDialog = ({ open, onClose, onSelectSetting }) => {
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const filteredResults = useMemo(() => {
    let list = SETTINGS_REGISTRY;

    if (selectedCategory !== "all") {
      list = list.filter((item) => item.category === selectedCategory);
    }

    if (!query.trim()) {
      return list;
    }

    const q = query.toLowerCase().trim();
    return list.filter((item) => {
      const matchTitle = item.title.toLowerCase().includes(q);
      const matchDesc = item.description.toLowerCase().includes(q);
      const matchCat = item.categoryLabel.toLowerCase().includes(q);
      const matchKeywords = item.keywords.some((k) => k.toLowerCase().includes(q));
      return matchTitle || matchDesc || matchCat || matchKeywords;
    });
  }, [query, selectedCategory]);

  const handleSelect = (setting) => {
    onSelectSetting(setting.page);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen
      TransitionComponent={Fade}
      PaperProps={{
        sx: {
          backgroundColor: SETTINGS_THEME.bg,
          color: "#FFFFFF",
          backgroundImage: "none",
        },
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          height: "100%",
          maxHeight: "100vh",
          overflow: "hidden",
        }}
      >
        {/* Search Input Bar */}
        <Box
          sx={{
            p: 2,
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            borderBottom: `1px solid ${SETTINGS_THEME.divider}`,
            backgroundColor: "rgba(0, 0, 0, 0.95)",
          }}
        >
          <TextField
            autoFocus
            fullWidth
            placeholder="Search settings..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: SETTINGS_THEME.textSecondary, fontSize: 22 }} />
                </InputAdornment>
              ),
              endAdornment: query ? (
                <InputAdornment position="end">
                  <IconButton
                    size="small"
                    onClick={() => setQuery("")}
                    sx={{ color: SETTINGS_THEME.textSecondary }}
                  >
                    <CloseIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                </InputAdornment>
              ) : null,
            }}
            sx={{
              "& .MuiOutlinedInput-root": {
                backgroundColor: "#161616",
                borderRadius: "20px",
                color: "#FFFFFF",
                fontSize: "0.95rem",
                "& fieldset": {
                  borderColor: "rgba(255, 255, 255, 0.12)",
                },
                "&:hover fieldset": {
                  borderColor: SETTINGS_THEME.accent,
                },
                "&.Mui-focused fieldset": {
                  borderColor: SETTINGS_THEME.accent,
                },
              },
            }}
          />

          <IconButton
            onClick={onClose}
            sx={{
              width: 42,
              height: 42,
              borderRadius: "50%",
              backgroundColor: "rgba(255, 255, 255, 0.08)",
              color: "#FFFFFF",
              flexShrink: 0,
            }}
          >
            <CloseIcon sx={{ fontSize: 20 }} />
          </IconButton>
        </Box>

        {/* Category Filter Chips */}
        <Box
          sx={{
            px: 2,
            py: 1.5,
            display: "flex",
            gap: 1,
            overflowX: "auto",
            borderBottom: `1px solid ${SETTINGS_THEME.divider}`,
            backgroundColor: "rgba(0,0,0,0.4)",
            "&::-webkit-scrollbar": { display: "none" },
          }}
        >
          {SETTINGS_CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <Chip
                key={cat.id}
                label={cat.label}
                onClick={() => setSelectedCategory(cat.id)}
                sx={{
                  backgroundColor: isSelected ? SETTINGS_THEME.accent : "#202024",
                  color: "#FFFFFF",
                  fontWeight: isSelected ? 700 : 500,
                  fontSize: "0.82rem",
                  borderRadius: "16px",
                  cursor: "pointer",
                  border: isSelected ? "none" : `1px solid ${SETTINGS_THEME.divider}`,
                  "&:hover": {
                    backgroundColor: isSelected ? "#1D6ECB" : "#2A2A30",
                  },
                }}
              />
            );
          })}
        </Box>

        {/* Search Results List */}
        <Box sx={{ flex: 1, overflowY: "auto", p: 2 }}>
          {filteredResults.length === 0 ? (
            <Box sx={{ textAlign: "center", py: 8 }}>
              <Typography sx={{ color: SETTINGS_THEME.textSecondary, fontSize: "1rem", mb: 1 }}>
                No settings found matching "{query}"
              </Typography>
              <Typography sx={{ color: "#7E828D", fontSize: "0.82rem" }}>
                Try searching for "theme", "password", "currency", or "notifications"
              </Typography>
            </Box>
          ) : (
            <Box
              sx={{
                backgroundColor: SETTINGS_THEME.card,
                borderRadius: "24px",
                border: `1px solid ${SETTINGS_THEME.divider}`,
                overflow: "hidden",
              }}
            >
              {filteredResults.map((item, idx) => (
                <Box
                  key={item.id}
                  onClick={() => handleSelect(item)}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    py: 1.8,
                    px: 2.5,
                    cursor: "pointer",
                    borderBottom:
                      idx === filteredResults.length - 1
                        ? "none"
                        : `1px solid ${SETTINGS_THEME.divider}`,
                    transition: "background-color 0.2s ease",
                    "&:hover": {
                      backgroundColor: "rgba(255, 255, 255, 0.05)",
                    },
                  }}
                >
                  <Box sx={{ minWidth: 0, flex: 1, mr: 2 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Typography
                        sx={{
                          fontSize: "0.96rem",
                          fontWeight: 600,
                          color: "#FFFFFF",
                        }}
                      >
                        {item.title}
                      </Typography>
                      <Chip
                        label={item.categoryLabel}
                        size="small"
                        sx={{
                          height: 18,
                          fontSize: "0.68rem",
                          backgroundColor: "rgba(255, 255, 255, 0.08)",
                          color: SETTINGS_THEME.textSecondary,
                          borderRadius: "6px",
                        }}
                      />
                    </Box>
                    <Typography
                      sx={{
                        fontSize: "0.8rem",
                        color: SETTINGS_THEME.textSecondary,
                        mt: 0.3,
                        lineHeight: 1.3,
                      }}
                    >
                      {item.description}
                    </Typography>
                  </Box>

                  <ArrowForwardIos sx={{ fontSize: 13, color: "rgba(255, 255, 255, 0.3)" }} />
                </Box>
              ))}
            </Box>
          )}
        </Box>
      </Box>
    </Dialog>
  );
};

export default SettingsSearchDialog;
