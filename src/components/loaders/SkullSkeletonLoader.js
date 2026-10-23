import React from "react";
import { Box, Grid, Stack, Skeleton } from "@mui/material";
import { useThemeToggle } from "../../contexts/ThemeToggleContext";
import { MONOCHROME_DESIGN_SYSTEM } from "../../theme/designSystem";

/**
 * Shimmering glass card surface for monochrome skeleton placeholders
 */
const ShimmerSurface = ({ children, sx = {}, height, width, borderRadius = "24px" }) => {
  const { mode } = useThemeToggle();
  const isDark = mode === "dark";
  const palette = isDark ? MONOCHROME_DESIGN_SYSTEM.colors.dark : MONOCHROME_DESIGN_SYSTEM.colors.light;

  return (
    <Box
      className="shimmer"
      sx={{
        position: "relative",
        overflow: "hidden",
        backgroundColor: palette.card,
        backdropFilter: "blur(22px)",
        WebkitBackdropFilter: "blur(22px)",
        border: `1px solid ${palette.border}`,
        borderRadius,
        boxShadow: isDark
          ? "inset 0 1px 1px rgba(255, 255, 255, 0.11), inset 0 -1px 1px rgba(255, 255, 255, 0.07), 0 1px 0px rgba(0,0,0,0.1)"
          : "inset 0 1px 1px rgba(255, 255, 255, 0.8), inset 0 -1px 1px rgba(0,0,0,0.1), 0 1px 0px rgba(0,0,0,0.1)",
        height,
        width,
        ...sx,
      }}
    >
      {children}
    </Box>
  );
};

/**
 * BunkMates Logo Glyph (replaces skull with official BunkMates logo watermark)
 */
export const SkullGlyph = ({ size = 28, opacity = 0.85 }) => {
  return (
    <Box
      sx={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        opacity,
        transition: "opacity 0.3s ease",
      }}
    >
      <Box
        component="img"
        src="/logo.svg"
        alt="BunkMates"
        sx={{
          width: size,
          height: size,
          borderRadius: "6px",
          filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.3))",
        }}
      />
    </Box>
  );
};

export const BunkMatesLogo = SkullGlyph;

/**
 * Places Grid Skeleton Loader (replaces circular progress when loading places in Home)
 */
export const PlacesGridSkullLoader = ({ count = 6 }) => {
  const { mode } = useThemeToggle();
  const isDark = mode === "dark";
  const skeletonBg = isDark ? "rgba(255, 255, 255, 0.06)" : "rgba(0, 0, 0, 0.06)";

  return (
    <Box sx={{ width: "100%", py: 2 }}>
      <Grid container spacing={3} justifyContent="center">
        {Array.from({ length: count }).map((_, idx) => (
          <Grid item xs={12} sm={6} md={4} key={`place-skel-${idx}`}>
            <ShimmerSurface
              height={360}
              borderRadius="28px"
              sx={{
                p: 2,
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              {/* Media image skeleton */}
              <Box sx={{ position: "relative", width: "100%", height: 200, borderRadius: "20px", overflow: "hidden" }}>
                <Skeleton
                  variant="rectangular"
                  width="100%"
                  height="100%"
                  animation="wave"
                  sx={{ bgcolor: skeletonBg, borderRadius: "20px" }}
                />
                <Box sx={{ position: "absolute", top: 12, right: 12 }}>
                  <SkullGlyph size={20} opacity={0.4} />
                </Box>
              </Box>

              {/* Title & subtitle lines */}
              <Box sx={{ mt: 2, px: 0.5 }}>
                <Skeleton
                  variant="text"
                  width="70%"
                  height={28}
                  animation="wave"
                  sx={{ bgcolor: skeletonBg, borderRadius: 2 }}
                />
                <Skeleton
                  variant="text"
                  width="45%"
                  height={20}
                  animation="wave"
                  sx={{ bgcolor: skeletonBg, borderRadius: 2, mt: 0.5 }}
                />
              </Box>

              {/* Action buttons row */}
              <Stack direction="row" spacing={1.5} sx={{ mt: 2, px: 0.5 }}>
                <Skeleton
                  variant="rectangular"
                  width="65%"
                  height={40}
                  animation="wave"
                  sx={{ bgcolor: skeletonBg, borderRadius: "20px" }}
                />
                <Skeleton
                  variant="rectangular"
                  width="35%"
                  height={40}
                  animation="wave"
                  sx={{ bgcolor: skeletonBg, borderRadius: "20px" }}
                />
              </Stack>
            </ShimmerSurface>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

/**
 * Full Page Home Skull Loader (replaces initial !authInitialized CircularProgress)
 */
export const HomeSkullLoader = () => {
  const { mode } = useThemeToggle();
  const isDark = mode === "dark";
  const skeletonBg = isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.08)";

  return (
    <Box
      sx={{
        minHeight: "100vh",
        width: "100%",
        bgcolor: isDark ? "#000000" : "#f1f1f1",
        p: { xs: 2, sm: 3, md: 5 },
        boxSizing: "border-box",
      }}
    >
      {/* Top App Bar wireframe */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          maxWidth: 1200,
          mx: "auto",
          mb: 4,
        }}
      >
        <Stack direction="row" spacing={2} alignItems="center">
          <Skeleton
            variant="circular"
            width={48}
            height={48}
            animation="wave"
            sx={{ bgcolor: skeletonBg }}
          />
          <Box>
            <Skeleton
              variant="text"
              width={140}
              height={26}
              animation="wave"
              sx={{ bgcolor: skeletonBg, borderRadius: 2 }}
            />
            <Skeleton
              variant="text"
              width={90}
              height={18}
              animation="wave"
              sx={{ bgcolor: skeletonBg, borderRadius: 2 }}
            />
          </Box>
        </Stack>

        <Stack direction="row" spacing={1.5} alignItems="center">
          <SkullGlyph size={26} opacity={0.5} />
          <Skeleton
            variant="circular"
            width={40}
            height={40}
            animation="wave"
            sx={{ bgcolor: skeletonBg }}
          />
          <Skeleton
            variant="circular"
            width={40}
            height={40}
            animation="wave"
            sx={{ bgcolor: skeletonBg }}
          />
        </Stack>
      </Box>

      {/* Main layout container */}
      <Box sx={{ maxWidth: 1200, mx: "auto" }}>
        {/* Banner / Live Alerts Carousel Skeleton */}
        <Grid container spacing={2.5} sx={{ mb: 3 }}>
          <Grid item xs={12} md={7}>
            <ShimmerSurface height={190} borderRadius="28px" sx={{ p: 3 }}>
              <Stack spacing={1.5}>
                <Skeleton
                  variant="text"
                  width="40%"
                  height={24}
                  animation="wave"
                  sx={{ bgcolor: skeletonBg, borderRadius: 2 }}
                />
                <Skeleton
                  variant="text"
                  width="85%"
                  height={34}
                  animation="wave"
                  sx={{ bgcolor: skeletonBg, borderRadius: 2 }}
                />
                <Skeleton
                  variant="rectangular"
                  width={140}
                  height={42}
                  animation="wave"
                  sx={{ bgcolor: skeletonBg, borderRadius: "24px", mt: 1 }}
                />
              </Stack>
            </ShimmerSurface>
          </Grid>

          <Grid item xs={12} md={5}>
            <ShimmerSurface height={190} borderRadius="28px" sx={{ p: 3 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Box sx={{ width: "60%" }}>
                  <Skeleton
                    variant="text"
                    width="50%"
                    height={20}
                    animation="wave"
                    sx={{ bgcolor: skeletonBg, borderRadius: 2 }}
                  />
                  <Skeleton
                    variant="text"
                    width="70%"
                    height={44}
                    animation="wave"
                    sx={{ bgcolor: skeletonBg, borderRadius: 2, my: 1 }}
                  />
                  <Skeleton
                    variant="text"
                    width="90%"
                    height={18}
                    animation="wave"
                    sx={{ bgcolor: skeletonBg, borderRadius: 2 }}
                  />
                </Box>
                <Skeleton
                  variant="circular"
                  width={64}
                  height={64}
                  animation="wave"
                  sx={{ bgcolor: skeletonBg }}
                />
              </Stack>
            </ShimmerSurface>
          </Grid>
        </Grid>

        {/* Floating Search Pill Wireframe */}
        <Box sx={{ mb: 4 }}>
          <ShimmerSurface height={64} borderRadius="32px" sx={{ px: 3, display: "flex", alignItems: "center" }}>
            <Skeleton
              variant="text"
              width="60%"
              height={26}
              animation="wave"
              sx={{ bgcolor: skeletonBg, borderRadius: 2 }}
            />
          </ShimmerSurface>
        </Box>

        {/* Places Grid Section Header */}
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2.5, px: 1 }}>
          <Skeleton
            variant="text"
            width={200}
            height={32}
            animation="wave"
            sx={{ bgcolor: skeletonBg, borderRadius: 2 }}
          />
          <Skeleton
            variant="rectangular"
            width={110}
            height={36}
            animation="wave"
            sx={{ bgcolor: skeletonBg, borderRadius: "20px" }}
          />
        </Box>

        {/* Places Grid */}
        <PlacesGridSkullLoader count={6} />
      </Box>
    </Box>
  );
};

/**
 * Dedicated Create Trip Skull Loader
 * Used when initializing trip creation or during AI itinerary generation
 */
export const CreateTripSkullLoader = ({ isAiGenerating = false }) => {
  const { mode } = useThemeToggle();
  const isDark = mode === "dark";
  const skeletonBg = isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.08)";
  const palette = isDark ? MONOCHROME_DESIGN_SYSTEM.colors.dark : MONOCHROME_DESIGN_SYSTEM.colors.light;

  return (
    <Box sx={{ width: "100%", maxWidth: 860, mx: "auto", py: 3, px: { xs: 1.5, sm: 3 } }}>
      {/* Header wireframe */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 3 }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <Skeleton
            variant="circular"
            width={44}
            height={44}
            animation="wave"
            sx={{ bgcolor: skeletonBg }}
          />
          <Box>
            <Skeleton
              variant="text"
              width={200}
              height={32}
              animation="wave"
              sx={{ bgcolor: skeletonBg, borderRadius: 2 }}
            />
            <Skeleton
              variant="text"
              width={140}
              height={18}
              animation="wave"
              sx={{ bgcolor: skeletonBg, borderRadius: 2 }}
            />
          </Box>
        </Stack>
        <SkullGlyph size={28} opacity={0.6} />
      </Box>

      {/* Stepper pills wireframe */}
      <Stack direction="row" spacing={1} sx={{ mb: 4, overflowX: "auto", pb: 1 }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton
            key={`step-skel-${i}`}
            variant="rectangular"
            width={130}
            height={38}
            animation="wave"
            sx={{ bgcolor: skeletonBg, borderRadius: "24px", flexShrink: 0 }}
          />
        ))}
      </Stack>

      {/* Main Form Body / AI Loading State */}
      <ShimmerSurface borderRadius="32px" sx={{ p: { xs: 2.5, sm: 4 }, minHeight: 460 }}>
        {isAiGenerating ? (
          <Box sx={{ textAlign: "center", py: 6 }}>
            <Box sx={{ display: "inline-flex", p: 2, borderRadius: "50%", bgcolor: skeletonBg, mb: 2 }}>
              <SkullGlyph size={48} opacity={0.8} />
            </Box>
            <Skeleton
              variant="text"
              width={260}
              height={32}
              animation="wave"
              sx={{ bgcolor: skeletonBg, mx: "auto", borderRadius: 2 }}
            />
            <Skeleton
              variant="text"
              width={380}
              height={20}
              animation="wave"
              sx={{ bgcolor: skeletonBg, mx: "auto", mt: 1, borderRadius: 2 }}
            />
            <Stack spacing={2} sx={{ mt: 5, maxWidth: 500, mx: "auto" }}>
              <Skeleton
                variant="rectangular"
                width="100%"
                height={70}
                animation="wave"
                sx={{ bgcolor: skeletonBg, borderRadius: "20px" }}
              />
              <Skeleton
                variant="rectangular"
                width="100%"
                height={70}
                animation="wave"
                sx={{ bgcolor: skeletonBg, borderRadius: "20px" }}
              />
              <Skeleton
                variant="rectangular"
                width="100%"
                height={70}
                animation="wave"
                sx={{ bgcolor: skeletonBg, borderRadius: "20px" }}
              />
            </Stack>
          </Box>
        ) : (
          <Stack spacing={3}>
            {/* Map Placeholder skeleton */}
            <Skeleton
              variant="rectangular"
              width="100%"
              height={260}
              animation="wave"
              sx={{ bgcolor: skeletonBg, borderRadius: "24px" }}
            />

            {/* Inputs skeleton */}
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Skeleton
                  variant="rectangular"
                  width="100%"
                  height={56}
                  animation="wave"
                  sx={{ bgcolor: skeletonBg, borderRadius: "24px" }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Skeleton
                  variant="rectangular"
                  width="100%"
                  height={56}
                  animation="wave"
                  sx={{ bgcolor: skeletonBg, borderRadius: "24px" }}
                />
              </Grid>
            </Grid>

            {/* Action button skeleton */}
            <Box sx={{ display: "flex", justifyContent: "flex-end", pt: 2 }}>
              <Skeleton
                variant="rectangular"
                width={160}
                height={48}
                animation="wave"
                sx={{ bgcolor: skeletonBg, borderRadius: palette ? "24px" : "24px" }}
              />
            </Box>
          </Stack>
        )}
      </ShimmerSurface>
    </Box>
  );
};

/**
 * Universal SkullLoader / SkeletonLoader
 */
export const SkullLoader = ({ type = "home", ...props }) => {
  if (type === "places" || type === "grid") {
    return <PlacesGridSkullLoader {...props} />;
  }
  if (type === "createTrip" || type === "trip") {
    return <CreateTripSkullLoader {...props} />;
  }
  return <HomeSkullLoader {...props} />;
};

export const SkeletonLoader = SkullLoader;
export default SkullLoader;
