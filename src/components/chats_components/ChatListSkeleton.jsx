import React from "react";
import { Box, Skeleton } from "@mui/material";

/**
 * Premium Skeleton Loader for Chat List Items (Direct & Group chats)
 * Replaces jarring CircularProgress with realistic pulsing chat list previews.
 */
const ChatListSkeleton = ({ count = 7, isDark = true, onlyList = false }) => {
  const bgBase = isDark ? "rgba(255, 255, 255, 0.03)" : "rgba(0, 0, 0, 0.02)";
  const borderBase = isDark ? "rgba(255, 255, 255, 0.04)" : "rgba(0, 0, 0, 0.04)";
  const skeletonPrimary = isDark ? "rgba(255, 255, 255, 0.09)" : "rgba(0, 0, 0, 0.08)";
  const skeletonSecondary = isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.04)";

  // Width variations to mimic realistic usernames and last messages
  const nameWidths = ["42%", "55%", "38%", "48%", "60%", "35%", "50%"];
  const messageWidths = ["75%", "60%", "85%", "50%", "70%", "80%", "65%"];

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 1,
        width: "100%",
        py: onlyList ? 0.5 : 1,
      }}
    >
      {Array.from({ length: count }).map((_, idx) => (
        <Box
          key={idx}
          sx={{
            display: "flex",
            alignItems: "center",
            p: "12px 14px",
            borderRadius: "18px",
            backgroundColor: bgBase,
            border: `1px solid ${borderBase}`,
            transition: "all 0.2s ease",
          }}
        >
          {/* Avatar Skeleton */}
          <Skeleton
            variant="circular"
            animation="wave"
            width={44}
            height={44}
            sx={{
              mr: 2,
              flexShrink: 0,
              bgcolor: skeletonPrimary,
            }}
          />

          {/* Details Skeleton */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            {/* Top Row: Name & Timestamp */}
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 0.8,
              }}
            >
              <Skeleton
                variant="rounded"
                animation="wave"
                width={nameWidths[idx % nameWidths.length]}
                height={16}
                sx={{
                  bgcolor: skeletonPrimary,
                  borderRadius: "6px",
                }}
              />
              <Skeleton
                variant="rounded"
                animation="wave"
                width={36}
                height={12}
                sx={{
                  bgcolor: skeletonSecondary,
                  borderRadius: "4px",
                }}
              />
            </Box>

            {/* Bottom Row: Message Snippet */}
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Skeleton
                variant="rounded"
                animation="wave"
                width={messageWidths[idx % messageWidths.length]}
                height={13}
                sx={{
                  bgcolor: skeletonSecondary,
                  borderRadius: "4px",
                }}
              />
              {idx % 3 === 0 && (
                <Skeleton
                  variant="circular"
                  animation="wave"
                  width={16}
                  height={16}
                  sx={{
                    ml: 1,
                    flexShrink: 0,
                    bgcolor: isDark ? "rgba(0, 183, 255, 0.25)" : "rgba(2, 136, 209, 0.2)",
                  }}
                />
              )}
            </Box>
          </Box>
        </Box>
      ))}
    </Box>
  );
};

export default React.memo(ChatListSkeleton);
