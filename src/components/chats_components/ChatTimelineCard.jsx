// src/components/chats_components/ChatTimelineCard.jsx
import React, { useState } from "react";
import {
  Box,
  Typography,
  Chip,
  ButtonBase,
} from "@mui/material";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";

const ChatTimelineCard = ({
  cardData = {},
  timeline = [],
  isDark = true,
}) => {
  const [expanded, setExpanded] = useState(false);

  const eventsList = timeline && timeline.length > 0 ? timeline : cardData.items || [];
  const completed = eventsList.filter((e) => e.completed === true).length;

  const visibleEvents = expanded ? eventsList : eventsList.slice(0, 4);
  const remainingCount = eventsList.length - 4;

  return (
    <Box
      sx={{
        mt: 1,
        mb: 1,
        minWidth: { xs: 260, sm: 320 },
        maxWidth: 380,
        width: "100%",
        overflow: "hidden",
        bgcolor: "transparent",
        border: "0px solid",
        boxShadow: "none",
      }}
    >
      {/* Timeline Card Container */}
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
            mb: 1.4,
          }}
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 800, fontSize: "0.95rem" }}>
            🗓️ {cardData.title || "Trip Timeline"}
          </Typography>

            <Typography variant="caption" sx={{ opacity: 0.75, fontSize: "0.72rem" }}>
              {completed} of {eventsList.length} events
            </Typography>
        </Box>

        {/* Timeline Items List - Flex column layout */}
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 0.8,
            mt: 1.2,
            transition: "all 0.3s ease",
          }}
        >
          {visibleEvents.map((ev, evIdx) => (
            <Box
              key={ev.id || evIdx}
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                p: "8px 12px",
                borderRadius: 4,
                bgcolor: isDark ? "rgba(255, 255, 255, 0.04)" : "rgba(0, 0, 0, 0.03)",
                borderLeft: `0px solid ${
                  ev.completed ? "#4caf50" : isDark ? "#00b7ff" : "#1976d2"
                }`,
              }}
            >
              <Box sx={{ minWidth: 0, flex: 1, mr: 1 }}>
                <Typography
                  variant="body2"
                  sx={{
                    fontSize: "0.82rem",
                    fontWeight: 600,
                    textDecoration: ev.completed ? "line-through" : "none",
                    opacity: ev.completed ? 0.75 : 1,
                  }}
                  noWrap
                >
                  {ev.title || ev.activity || ev.name || `Event ${evIdx + 1}`}
                </Typography>
                {(ev.time || ev.date) && (
                  <Typography
                    variant="caption"
                    sx={{
                      fontSize: "0.68rem",
                      opacity: 0.65,
                      display: "flex",
                      alignItems: "center",
                      gap: 0.3,
                      mt: 0.2,
                    }}
                  >
                    <AccessTimeIcon sx={{ fontSize: 11 }} />{" "}
                    {ev.date
                      ? `${typeof ev.date === "string" ? ev.date : ev.date?.toDate ? ev.date.toDate().toLocaleDateString() : ev.date?.seconds != null ? new Date(ev.date.seconds * 1000).toLocaleDateString() : ""} `
                      : ""}
                    {ev.time
                      ? typeof ev.time === "string" ? ev.time : ev.time?.toDate ? ev.time.toDate().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ev.time?.seconds != null ? new Date(ev.time.seconds * 1000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""
                      : ""}
                  </Typography>
                )}
              </Box>

              <Chip
                size="small"
                label={ev.completed ? "Done" : "Upcoming"}
                sx={{
                  height: 20,
                  fontSize: "0.65rem",
                  bgcolor: ev.completed
                    ? "rgba(76, 175, 80, 0.16)"
                    : "rgba(0, 183, 255, 0.14)",
                  color: ev.completed ? "#4caf50" : isDark ? "#00b7ff" : "#0288d1",
                  fontWeight: 600,
                }}
              />
            </Box>
          ))}

          {/* Expand / Collapse Action Button */}
          {remainingCount > 0 && (
            <ButtonBase
              onClick={(e) => {
                e.stopPropagation();
                setExpanded((prev) => !prev);
              }}
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 0.5,
                width: "100%",
                py: 0.8,
                mt: 0.4,
                borderRadius: 8,
                bgcolor: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
                color: isDark ? "#ffffff" : "#181818",
                fontSize: "0.74rem",
                fontWeight: 700,
                transition: "all 0.15s ease",
                "&:hover": {
                  bgcolor: isDark ? "rgba(255, 255, 255, 0.12)" : "rgba(0, 0, 0, 0.08)",
                },
              }}
            >
              {expanded ? (
                <>
                  Show less <KeyboardArrowUpIcon sx={{ fontSize: 16 }} />
                </>
              ) : (
                <>
                  +{remainingCount} more events (Click to expand){" "}
                  <KeyboardArrowDownIcon sx={{ fontSize: 16 }} />
                </>
              )}
            </ButtonBase>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default React.memo(ChatTimelineCard);