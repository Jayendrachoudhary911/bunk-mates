import React from "react";
import { Box, Typography } from "@mui/material";

import { getMessageDateLabel } from "../../utils/chatHelpers";

/**
 * ChatDateSection
 * Renders a sticky, glassmorphic date pill divider between days in chat and group chat streams.
 */
const ChatDateSection = ({ label, isDark = true }) => {
  const displayLabel = React.useMemo(() => {
    if (!label) return "";
    if (typeof label === "string") return label;
    if (typeof label === "object") {
      if (label.seconds != null || typeof label.toDate === "function") {
        return getMessageDateLabel(label);
      }
      return String(label.label || label.text || label.date || "");
    }
    return String(label);
  }, [label]);

  if (!displayLabel) return null;

  return (
    <Box
      role="separator"
      aria-label={`Messages on ${displayLabel}`}
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        my: 1.8,
        py: 0.2,
        position: "sticky",
        top: 8,
        zIndex: 10,
        pointerEvents: "none",
        width: "100%",
      }}
    >
      <Box
        sx={{
          display: "inline-flex",
          alignItems: "center",
          gap: 0.7,
          px: 1.8,
          py: 0.45,
          borderRadius: "20px",
          bgcolor: isDark
            ? "rgba(40, 40, 40, 0.28)"
            : "rgba(245, 247, 250, 0.88)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          border: `1px solid ${
            isDark ? "rgba(255, 255, 255, 0.01)" : "rgba(0, 0, 0, 0.04)"
          }`,
          boxShadow: 'none',
          pointerEvents: "auto",
          userSelect: "none",
          transition: "transform 0.18s ease, box-shadow 0.18s ease",
          "&:hover": {
            transform: "scale(1.03)",
          },
        }}
      >
        <Typography
          variant="caption"
          sx={{
            fontSize: "0.74rem",
            fontWeight: 700,
            letterSpacing: "0.3px",
            color: isDark ? "rgba(255, 255, 255, 0.88)" : "rgba(15, 23, 42, 0.82)",
            textTransform: "capitalize",
            lineHeight: 1.2,
          }}
        >
          {displayLabel}
        </Typography>
      </Box>
    </Box>
  );
};

export default React.memo(ChatDateSection);
