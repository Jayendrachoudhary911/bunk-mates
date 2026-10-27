import React from "react";
import { Box, Skeleton } from "@mui/material";

/**
 * High-fidelity Skeleton Loader for Group Chat Messages.
 * Features sender avatar indicators, member name tags, poll/media cards,
 * and realistic incoming/outgoing bubble layouts.
 */
const GroupMessageListSkeleton = ({ isDark = true }) => {
  const leftBubbleBg = isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.05)";
  const rightBubbleBg = isDark ? "rgba(0, 183, 255, 0.16)" : "rgba(2, 136, 209, 0.12)";
  const skeletonInner = isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.08)";
  const memberAvatarBg = isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)";

  return (
    <Box
      sx={{
        flex: 1,
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        p: { xs: 1.5, sm: 2.5 },
        gap: 1.6,
        overflow: "hidden",
      }}
    >
      {/* Centered Date Badge Skeleton */}
      <Box sx={{ display: "flex", justifyContent: "center", my: 1 }}>
        <Skeleton
          variant="rounded"
          animation="wave"
          width={104}
          height={24}
          sx={{
            borderRadius: "999px",
            bgcolor: isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.06)",
          }}
        />
      </Box>

      {/* 1. Group Member A Message (Left with Avatar & Name) */}
      <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.2, maxWidth: { xs: "85%", sm: "65%" } }}>
        <Skeleton variant="circular" animation="wave" width={32} height={32} sx={{ bgcolor: memberAvatarBg, flexShrink: 0, mt: 0.5 }} />
        <Box sx={{ display: "flex", flexDirection: "column", gap: 0.4, width: "100%" }}>
          <Skeleton variant="rounded" animation="wave" width={75} height={11} sx={{ bgcolor: isDark ? "rgba(0, 183, 255, 0.3)" : "rgba(2, 136, 209, 0.25)", borderRadius: "4px" }} />
          <Box
            sx={{
              p: 1.8,
              borderRadius: "16px 16px 16px 4px",
              bgcolor: leftBubbleBg,
              display: "flex",
              flexDirection: "column",
              gap: 0.8,
            }}
          >
            <Skeleton variant="rounded" animation="wave" width="90%" height={14} sx={{ bgcolor: skeletonInner, borderRadius: "6px" }} />
            <Skeleton variant="rounded" animation="wave" width="60%" height={14} sx={{ bgcolor: skeletonInner, borderRadius: "6px" }} />
            <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 0.2 }}>
              <Skeleton variant="rounded" animation="wave" width={32} height={10} sx={{ bgcolor: skeletonInner, borderRadius: "4px" }} />
            </Box>
          </Box>
        </Box>
      </Box>

      {/* 2. My Outgoing Message (Right) */}
      <Box sx={{ display: "flex", flexDirection: "column", alignSelf: "flex-end", maxWidth: { xs: "80%", sm: "58%" } }}>
        <Box
          sx={{
            p: 1.8,
            borderRadius: "16px 16px 4px 16px",
            bgcolor: rightBubbleBg,
            display: "flex",
            flexDirection: "column",
            gap: 0.8,
          }}
        >
          <Skeleton variant="rounded" animation="wave" width={160} height={14} sx={{ bgcolor: skeletonInner, borderRadius: "6px" }} />
          <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 0.2 }}>
            <Skeleton variant="rounded" animation="wave" width={32} height={10} sx={{ bgcolor: skeletonInner, borderRadius: "4px" }} />
          </Box>
        </Box>
      </Box>

      {/* 3. Group Member B Message with Poll / Card Placeholder (Left) */}
      <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.2, maxWidth: { xs: "88%", sm: "70%" } }}>
        <Skeleton variant="circular" animation="wave" width={32} height={32} sx={{ bgcolor: memberAvatarBg, flexShrink: 0, mt: 0.5 }} />
        <Box sx={{ display: "flex", flexDirection: "column", gap: 0.4, width: "100%" }}>
          <Skeleton variant="rounded" animation="wave" width={90} height={11} sx={{ bgcolor: isDark ? "rgba(76, 175, 80, 0.3)" : "rgba(76, 175, 80, 0.25)", borderRadius: "4px" }} />
          <Box
            sx={{
              p: 1.8,
              borderRadius: "16px 16px 16px 4px",
              bgcolor: leftBubbleBg,
              display: "flex",
              flexDirection: "column",
              gap: 1.2,
            }}
          >
            <Skeleton variant="rounded" animation="wave" width="80%" height={15} sx={{ bgcolor: skeletonInner, borderRadius: "6px" }} />
            {/* Poll options skeleton */}
            <Box sx={{ display: "flex", flexDirection: "column", gap: 0.8 }}>
              <Skeleton variant="rounded" animation="wave" width="100%" height={28} sx={{ bgcolor: skeletonInner, borderRadius: "10px" }} />
              <Skeleton variant="rounded" animation="wave" width="100%" height={28} sx={{ bgcolor: skeletonInner, borderRadius: "10px" }} />
            </Box>
            <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
              <Skeleton variant="rounded" animation="wave" width={32} height={10} sx={{ bgcolor: skeletonInner, borderRadius: "4px" }} />
            </Box>
          </Box>
        </Box>
      </Box>

      {/* 4. My Outgoing Quick Follow-up (Right) */}
      <Box sx={{ display: "flex", flexDirection: "column", alignSelf: "flex-end", maxWidth: { xs: "75%", sm: "50%" } }}>
        <Box
          sx={{
            p: 1.8,
            borderRadius: "16px 16px 4px 16px",
            bgcolor: rightBubbleBg,
            display: "flex",
            flexDirection: "column",
            gap: 0.8,
          }}
        >
          <Skeleton variant="rounded" animation="wave" width={110} height={14} sx={{ bgcolor: skeletonInner, borderRadius: "6px" }} />
          <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 0.2 }}>
            <Skeleton variant="rounded" animation="wave" width={32} height={10} sx={{ bgcolor: skeletonInner, borderRadius: "4px" }} />
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default React.memo(GroupMessageListSkeleton);
