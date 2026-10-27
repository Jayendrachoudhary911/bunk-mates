// src/components/chats_components/SharedMediaLinksWidgetsTabs.jsx
import React, { useState, useMemo } from "react";
import {
  Box,
  Typography,
  Tabs,
  Tab,
  ButtonBase,
  IconButton,
} from "@mui/material";
import ImageIcon from "@mui/icons-material/Image";
import LinkIcon from "@mui/icons-material/Link";
import WidgetsIcon from "@mui/icons-material/Widgets";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import { extractUrls } from "../../utils/chatHelpers";

const SharedMediaLinksWidgetsTabs = ({
  messages = [],
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
      if (m.dataUri) list.push({ url: m.dataUri, msgId: m.id, date: m.createdAt || m.timestamp });
      if (m.imageUrl) list.push({ url: m.imageUrl, msgId: m.id, date: m.createdAt || m.timestamp });
      if (Array.isArray(m.images)) {
        m.images.forEach((img) => {
          if (img) list.push({ url: img, msgId: m.id, date: m.createdAt || m.timestamp });
        });
      }
      if (Array.isArray(m.imageUrls)) {
        m.imageUrls.forEach((img) => {
          if (img) list.push({ url: img, msgId: m.id, date: m.createdAt || m.timestamp });
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

  // 3. Extract all Widgets (Trips, Places, Budgets, Expenses, Checklists, Timelines, Polls, Notes)
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

  return (
    <Box sx={{ width: "100%", mt: 1.5 }}>
      {/* Tab Headers */}
      <Tabs
        value={tabIndex}
        onChange={(_, val) => setTabIndex(val)}
        variant="fullWidth"
        sx={{
          minHeight: 38,
          borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"}`,
          "& .MuiTab-root": {
            minHeight: 38,
            textTransform: "none",
            fontWeight: 700,
            fontSize: "0.82rem",
            color: isDark ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.6)",
            "&.Mui-selected": { color: "#00b7ff" },
          },
        }}
      >
        <Tab icon={<ImageIcon sx={{ fontSize: 16 }} />} iconPosition="start" label={`Media (${sharedMedia.length})`} />
        <Tab icon={<LinkIcon sx={{ fontSize: 16 }} />} iconPosition="start" label={`Links (${sharedLinks.length})`} />
        <Tab icon={<WidgetsIcon sx={{ fontSize: 16 }} />} iconPosition="start" label={`Widgets (${sharedWidgets.length})`} />
      </Tabs>

      {/* Tab Panels */}
      <Box sx={{ py: 1.5 }}>
        {/* TAB 0: Media Grid */}
        {tabIndex === 0 && (
          <>
            {sharedMedia.length === 0 ? (
              <Box sx={{ p: 3, textAlign: "center", opacity: 0.55 }}>
                <Typography variant="caption">No photos or media shared yet</Typography>
              </Box>
            ) : (
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gap: 0.8,
                  maxHeight: 280,
                  overflowY: "auto",
                  pr: 0.4,
                }}
              >
                {sharedMedia.map((m, idx) => (
                  <ButtonBase
                    key={idx}
                    onClick={() => onOpenImage && onOpenImage(m.url, sharedMedia.map((sm) => sm.url))}
                    sx={{
                      width: "100%",
                      paddingTop: "100%",
                      position: "relative",
                      borderRadius: "10px",
                      overflow: "hidden",
                      bgcolor: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
                      "&:hover img": { transform: "scale(1.08)" },
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
                        transition: "transform 0.25s ease",
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
            {sharedLinks.length === 0 ? (
              <Box sx={{ p: 3, textAlign: "center", opacity: 0.55 }}>
                <Typography variant="caption">No links shared in this conversation</Typography>
              </Box>
            ) : (
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 0.8,
                  maxHeight: 280,
                  overflowY: "auto",
                  pr: 0.4,
                }}
              >
                {sharedLinks.map((item, idx) => (
                  <Box
                    key={idx}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      p: 1.1,
                      borderRadius: "12px",
                      bgcolor: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.02)",
                      border: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)"}`,
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
                          fontSize: "0.82rem",
                          color: isDark ? "#00b7ff" : "#0288d1",
                        }}
                      >
                        {item.rawUrl}
                      </Typography>
                      <Typography variant="caption" sx={{ opacity: 0.6, fontSize: "0.68rem" }} noWrap>
                        Shared by {item.senderName}
                      </Typography>
                    </Box>

                    <IconButton
                      component="a"
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      size="small"
                      sx={{ color: isDark ? "#00b7ff" : "#0288d1", p: 0.6 }}
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
            {sharedWidgets.length === 0 ? (
              <Box sx={{ p: 3, textAlign: "center", opacity: 0.55 }}>
                <Typography variant="caption">No widgets shared in this conversation</Typography>
              </Box>
            ) : (
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 0.8,
                  maxHeight: 280,
                  overflowY: "auto",
                  pr: 0.4,
                }}
              >
                {sharedWidgets.map((w, idx) => (
                  <Box
                    key={idx}
                    onClick={() => {
                      if (onJumpToMessage) onJumpToMessage(w.msgId);
                    }}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      p: 1.1,
                      px: 1.3,
                      borderRadius: "12px",
                      bgcolor: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.02)",
                      border: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)"}`,
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
                          width: 34,
                          height: 34,
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
                        <Typography variant="body2" sx={{ fontWeight: 700, fontSize: "0.82rem" }} noWrap>
                          {w.title}
                        </Typography>
                        {w.subtitle && (
                          <Typography variant="caption" sx={{ opacity: 0.65, display: "block", fontSize: "0.68rem" }} noWrap>
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
