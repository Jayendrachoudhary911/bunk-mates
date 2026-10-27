import React from "react";
import { Box, Skeleton } from "@mui/material";

/**
 * High-fidelity Skeleton Loader for 1-on-1 Chatroom Messages.
 * Renders realistic incoming and outgoing bubble skeletons, media placeholders,
 * and date separators instead of an uninformative spinning wheel.
 */
const MessageListSkeleton = ({ isDark = true }) => {
  const leftBubbleBg = isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.05)";
  const rightBubbleBg = isDark ? "rgba(0, 183, 255, 0.16)" : "rgba(2, 136, 209, 0.12)";
  const skeletonInner = isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.08)";

  return (
    <Box
      sx={{
        flex: 1,
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        p: { xs: 1.5, sm: 2.5 },
        gap: 1.4,
        overflow: "hidden",
      }}
    >
      {/* Centered Date Badge Skeleton */}
      <Box sx={{ display: "flex", justifyContent: "center", my: 1 }}>
        <Skeleton
          variant="rounded"
          animation="wave"
          width={96}
          height={24}
          sx={{
            borderRadius: "999px",
            bgcolor: isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.06)",
          }}
        />
      </Box>

      {/* 1. Incoming Message (Left) */}
      <Box sx={{ display: "flex", flexDirection: "column", alignSelf: "flex-start", maxWidth: { xs: "80%", sm: "60%" } }}>
        <Box
          sx={{
            p: 1.8,
            borderRadius: "18px 18px 18px 4px",
            bgcolor: leftBubbleBg,
            display: "flex",
            flexDirection: "column",
            gap: 0.8,
          }}
        >
          <Skeleton variant="rounded" animation="wave" width={180} height={14} sx={{ bgcolor: skeletonInner, borderRadius: "6px" }} />
          <Skeleton variant="rounded" animation="wave" width={120} height={14} sx={{ bgcolor: skeletonInner, borderRadius: "6px" }} />
          <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 0.2 }}>
            <Skeleton variant="rounded" animation="wave" width={32} height={10} sx={{ bgcolor: skeletonInner, borderRadius: "4px" }} />
          </Box>
        </Box>
      </Box>

      {/* 2. Outgoing Message (Right) */}
      <Box sx={{ display: "flex", flexDirection: "column", alignSelf: "flex-end", maxWidth: { xs: "80%", sm: "60%" } }}>
        <Box
          sx={{
            p: 1.8,
            borderRadius: "18px 18px 4px 18px",
            bgcolor: rightBubbleBg,
            display: "flex",
            flexDirection: "column",
            gap: 0.8,
          }}
        >
          <Skeleton variant="rounded" animation="wave" width={150} height={14} sx={{ bgcolor: skeletonInner, borderRadius: "6px" }} />
          <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 0.2 }}>
            <Skeleton variant="rounded" animation="wave" width={32} height={10} sx={{ bgcolor: skeletonInner, borderRadius: "4px" }} />
          </Box>
        </Box>
      </Box>

      {/* 3. Incoming Message with Image Attachment (Left) */}
      <Box sx={{ display: "flex", flexDirection: "column", alignSelf: "flex-start", maxWidth: { xs: "82%", sm: "62%" } }}>
        <Box
          sx={{
            p: 1.5,
            borderRadius: "18px 18px 18px 4px",
            bgcolor: leftBubbleBg,
            display: "flex",
            flexDirection: "column",
            gap: 1,
          }}
        >
          <Skeleton
            variant="rounded"
            animation="wave"
            width={210}
            height={135}
            sx={{
              borderRadius: "14px",
              bgcolor: skeletonInner,
              maxWidth: "100%",
            }}
          />
          <Skeleton variant="rounded" animation="wave" width={140} height={14} sx={{ bgcolor: skeletonInner, borderRadius: "6px" }} />
          <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
            <Skeleton variant="rounded" animation="wave" width={32} height={10} sx={{ bgcolor: skeletonInner, borderRadius: "4px" }} />
          </Box>
        </Box>
      </Box>

      {/* 4. Outgoing Quick Message (Right) */}
      <Box sx={{ display: "flex", flexDirection: "column", alignSelf: "flex-end", maxWidth: { xs: "75%", sm: "50%" } }}>
        <Box
          sx={{
            p: 1.8,
            borderRadius: "18px 18px 4px 18px",
            bgcolor: rightBubbleBg,
            display: "flex",
            flexDirection: "column",
            gap: 0.8,
          }}
        >
          <Skeleton variant="rounded" animation="wave" width={200} height={14} sx={{ bgcolor: skeletonInner, borderRadius: "6px" }} />
          <Skeleton variant="rounded" animation="wave" width={100} height={14} sx={{ bgcolor: skeletonInner, borderRadius: "6px" }} />
          <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 0.2 }}>
            <Skeleton variant="rounded" animation="wave" width={32} height={10} sx={{ bgcolor: skeletonInner, borderRadius: "4px" }} />
          </Box>
        </Box>
      </Box>

      {/* 5. Incoming Short Response (Left) */}
      <Box sx={{ display: "flex", flexDirection: "column", alignSelf: "flex-start", maxWidth: { xs: "65%", sm: "45%" } }}>
        <Box
          sx={{
            p: 1.8,
            borderRadius: "18px 18px 18px 4px",
            bgcolor: leftBubbleBg,
            display: "flex",
            flexDirection: "column",
            gap: 0.8,
          }}
        >
          <Skeleton variant="rounded" animation="wave" width={95} height={14} sx={{ bgcolor: skeletonInner, borderRadius: "6px" }} />
          <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
            <Skeleton variant="rounded" animation="wave" width={32} height={10} sx={{ bgcolor: skeletonInner, borderRadius: "4px" }} />
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default React.memo(MessageListSkeleton);
