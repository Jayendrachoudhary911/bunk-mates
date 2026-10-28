// src/components/chats_components/SharedMediaLinksWidgetsTabs.jsx
import React, { useState, useMemo } from "react";
import {
  Box,
  Typography,
  ButtonBase,
  IconButton,
} from "@mui/material";
import ImageIcon from "@mui/icons-material/Image";
import LinkIcon from "@mui/icons-material/Link";
import WidgetsIcon from "@mui/icons-material/Widgets";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import { motion } from "framer-motion";
import { extractUrls } from "../../utils/chatHelpers";

const SharedMediaLinksWidgetsTabs = ({
  messages = [],
  searchQuery = "",
  onOpenImage,
  onJumpToMessage,
  onOpenTrip,
  onOpenPlace,
  effectiveChatTheme = "dark",
}) => {
  const isDark = effectiveChatTheme === "dark";
  const [tabIndex, setTabIndex] = useState(0);

  // 1. Extract all Media (images)
  const sharedMedia = useMemo(() => {
    const list = [];
    (messages || []).forEach((m) => {
      if (m.dataUri) list.push({ url: m.dataUri, msgId: m.id });
      if (m.imageUrl) list.push({ url: m.imageUrl, msgId: m.id });
      if (Array.isArray(m.images)) {
        m.images.forEach((img) => {
          if (img) list.push({ url: img, msgId: m.id });
        });
      }
      if (Array.isArray(m.imageUrls)) {
        m.imageUrls.forEach((img) => {
          if (img) list.push({ url: img, msgId: m.id });
        });
      }
    });
    return list;
  }, [messages]);

  // 2. Extract all Links
  const sharedLinks = useMemo(() => {
    const list = [];
    (messages || []).forEach((m) => {
      if (typeof m.text === "string") {
        const urls = extractUrls(m.text);
        urls.forEach((u) => {
          list.push({
            url: u.url,
            rawUrl: u.rawUrl,
            protocol: u.protocol,
            isSecure: u.isSecure,
            msgId: m.id,
            senderName: m.senderName || "Member",
            date: m.createdAt || m.timestamp,
          });
        });
      }
    });
    return list;
  }, [messages]);

  // 3. Extract all Widgets
  const sharedWidgets = useMemo(() => {
    const list = [];
    (messages || []).forEach((m) => {
      const type = m.type;
      const card = m.cardData || {};
      if (
        type === "trip_preview" ||
        type === "place_preview" ||
        type === "user_profile" ||
        type === "note_preview" ||
        type === "budget" ||
        type === "expenses" ||
        type === "checklist" ||
        type === "timeline" ||
        type === "poll"
      ) {
        let sub = "";
        if (card.destination && typeof card.destination === "string") {
          sub = card.destination;
        } else if (card.location && typeof card.location === "string") {
          sub = card.location;
        } else if (type === "poll") {
          sub = `${(card.options || []).length} Options`;
        } else {
          const rawDate = card.date || card.createdAt;
          if (rawDate) {
            if (typeof rawDate === "string") sub = rawDate;
            else if (typeof rawDate.toDate === "function") sub = rawDate.toDate().toLocaleDateString();
            else if (rawDate.seconds != null) sub = new Date(rawDate.seconds * 1000).toLocaleDateString();
          }
        }

        const rawTitle = card.title || card.name || card.question || card.tripTitle;
        const safeTitle = typeof rawTitle === "string" && rawTitle.trim()
          ? rawTitle
          : type === "budget"
          ? "Trip Budget"
          : type === "expenses"
          ? "Expense Ledger"
          : "Shared Widget";

        list.push({
          msgId: m.id,
          type,
          title: safeTitle,
          subtitle: String(sub || ""),
          icon:
            type === "trip_preview" ? "✈️"
            : type === "place_preview" ? "📍"
            : type === "user_profile" ? "👤"
            : type === "note_preview" ? "📝"
            : type === "budget" ? "💰"
            : type === "expenses" ? "🧾"
            : type === "checklist" ? "✅"
            : type === "timeline" ? "🗓️"
            : "📊",
          cardData: card,
          senderName: m.senderName || "Member",
        });
      }
    });
    return list;
  }, [messages]);

  const filteredMedia = useMemo(() => {
    if (!searchQuery.trim()) return sharedMedia;
    return sharedMedia;
  }, [sharedMedia, searchQuery]);

  const filteredLinks = useMemo(() => {
    if (!searchQuery.trim()) return sharedLinks;
    const q = searchQuery.toLowerCase();
    return sharedLinks.filter(
      (item) => item.rawUrl.toLowerCase().includes(q) || item.senderName.toLowerCase().includes(q)
    );
  }, [sharedLinks, searchQuery]);

  const filteredWidgets = useMemo(() => {
    if (!searchQuery.trim()) return sharedWidgets;
    const q = searchQuery.toLowerCase();
    return sharedWidgets.filter(
      (w) => w.title.toLowerCase().includes(q) || w.subtitle.toLowerCase().includes(q)
    );
  }, [sharedWidgets, searchQuery]);

  const tabsData = [
    { label: `Media (${sharedMedia.length})`, icon: <ImageIcon sx={{ fontSize: 16 }} /> },
    { label: `Links (${sharedLinks.length})`, icon: <LinkIcon sx={{ fontSize: 16 }} /> },
    { label: `Widgets (${sharedWidgets.length})`, icon: <WidgetsIcon sx={{ fontSize: 16 }} /> },
  ];

  return (
    <Box sx={{ width: "100%", height: "100%", display: "flex", flexDirection: "column" }}>
      {/* Seamless Sliding Pill Tab Switcher */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          bgcolor: isDark ? "#161618" : "#eaeaea",
          borderRadius: "14px",
          p: 0.5,
          mb: 2,
          minHeight: 40,
          position: "relative",
        }}
      >
        {tabsData.map((tab, idx) => {
          const isSelected = tabIndex === idx;

          return (
            <ButtonBase
              key={idx}
              onClick={() => setTabIndex(idx)}
              sx={{
                position: "relative",
                zIndex: 1,
                minHeight: 36,
                borderRadius: "12px",
                textTransform: "none",
                fontWeight: 600,
                fontSize: "0.8rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 0.8,
                color: isSelected
                  ? isDark
                    ? "#fff"
                    : "#111"
                  : isDark
                  ? "rgba(255,255,255,0.55)"
                  : "rgba(0,0,0,0.55)",
                transition: "color 0.2s ease",
              }}
            >
              {isSelected && (
                <Box
                  component={motion.div}
                  layoutId="sharedMediaActiveTabPill"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  sx={{
                    position: "absolute",
                    inset: 0,
                    bgcolor: isDark ? "#28282d" : "#ffffff",
                    borderRadius: "12px",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
                    zIndex: -1,
                  }}
                />
              )}
              {tab.icon}
              <Typography variant="caption" sx={{ fontWeight: 700, fontSize: "0.8rem" }}>
                {tab.label}
              </Typography>
            </ButtonBase>
          );
        })}
      </Box>

      {/* Tab Panels with Full Height Scrolling */}
      <Box sx={{ py: 0.5, flex: 1, minHeight: 0, overflowY: "auto", pr: 0.5 }}>
        {/* TAB 0: Media Grid */}
        {tabIndex === 0 && (
          <>
            {filteredMedia.length === 0 ? (
              <Box sx={{ p: 3, textAlign: "center", opacity: 0.55 }}>
                <Typography variant="caption">No photos or media found</Typography>
              </Box>
            ) : (
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gap: 1,
                  pb: 2,
                }}
              >
                {filteredMedia.map((m, idx) => (
                  <ButtonBase
                    key={idx}
                    onClick={() => onOpenImage && onOpenImage(m.url, sharedMedia.map((sm) => sm.url))}
                    sx={{
                      width: "100%",
                      paddingTop: "100%",
                      position: "relative",
                      borderRadius: "12px",
                      overflow: "hidden",
                      bgcolor: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
                    }}
                  >
                    <Box
                      component="img"
                      src={m.url}
                      alt="media"
                      loading="lazy"
                      sx={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  </ButtonBase>
                ))}
              </Box>
            )}
          </>
        )}

        {/* TAB 1: Links List */}
        {tabIndex === 1 && (
          <>
            {filteredLinks.length === 0 ? (
              <Box sx={{ p: 3, textAlign: "center", opacity: 0.55 }}>
                <Typography variant="caption">No links found</Typography>
              </Box>
            ) : (
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 1,
                  pb: 2,
                }}
              >
                {filteredLinks.map((item, idx) => (
                  <Box
                    key={idx}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      p: 1.2,
                      borderRadius: "14px",
                      bgcolor: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.02)",
                    }}
                  >
                    <Box
                      onClick={() => onJumpToMessage && onJumpToMessage(item.msgId)}
                      sx={{ minWidth: 0, flex: 1, mr: 1, cursor: "pointer" }}
                    >
                      <Typography
                        variant="body2"
                        noWrap
                        sx={{
                          fontWeight: 600,
                          fontSize: "0.85rem",
                          color: isDark ? "#ffffff" : "#111111",
                        }}
                      >
                        {item.rawUrl}
                      </Typography>
                      <Typography variant="caption" sx={{ opacity: 0.6, fontSize: "0.7rem" }} noWrap>
                        Shared by {item.senderName}
                      </Typography>
                    </Box>

                    <IconButton
                      component="a"
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      size="small"
                      sx={{ color: isDark ? "rgba(255,255,255,0.8)" : "rgba(0,0,0,0.7)", p: 0.6 }}
                    >
                      <OpenInNewIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Box>
                ))}
              </Box>
            )}
          </>
        )}

        {/* TAB 2: Widgets List */}
        {tabIndex === 2 && (
          <>
            {filteredWidgets.length === 0 ? (
              <Box sx={{ p: 3, textAlign: "center", opacity: 0.55 }}>
                <Typography variant="caption">No widgets found</Typography>
              </Box>
            ) : (
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 1,
                  pb: 2,
                }}
              >
                {filteredWidgets.map((w, idx) => (
                  <Box
                    key={idx}
                    onClick={() => {
                      if (onJumpToMessage) onJumpToMessage(w.msgId);
                    }}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      p: 1.2,
                      px: 1.4,
                      borderRadius: "14px",
                      bgcolor: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.02)",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                      "&:hover": {
                        bgcolor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)",
                        transform: "translateX(2px)",
                      },
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.2, minWidth: 0, flex: 1 }}>
                      <Box
                        sx={{
                          width: 36,
                          height: 36,
                          borderRadius: "10px",
                          bgcolor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "1.1rem",
                          flexShrink: 0,
                        }}
                      >
                        {w.icon}
                      </Box>
                      <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 700, fontSize: "0.85rem" }} noWrap>
                          {w.title}
                        </Typography>
                        {w.subtitle && (
                          <Typography variant="caption" sx={{ opacity: 0.65, display: "block", fontSize: "0.7rem" }} noWrap>
                            {w.subtitle}
                          </Typography>
                        )}
                      </Box>
                    </Box>

                    <ArrowForwardIosIcon sx={{ fontSize: 12, opacity: 0.4 }} />
                  </Box>
                ))}
              </Box>
            )}
          </>
        )}
      </Box>
    </Box>
  );
};

export default React.memo(SharedMediaLinksWidgetsTabs);