import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Avatar,
  AvatarGroup,
  Tooltip,
  Button,
} from "@mui/material";
import { LocationOn, AccessTime } from "../../icons/LucideIcons";

export default function YourTrips({
  myTrips,
  tripGroupsMap,
  tripMembersMap,
  sliderIndex,
  setSliderIndex,
  mode,
  theme,
  navigate,
}) {
  const hasTrips = myTrips && myTrips.length > 0;
  const containerRef = useRef(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    if (containerRef.current) {
      setWidth(containerRef.current.clientWidth);
    }
    if (typeof ResizeObserver !== "undefined" && containerRef.current) {
      const observer = new ResizeObserver((entries) => {
        for (let entry of entries) {
          setWidth(entry.contentRect.width);
        }
      });
      observer.observe(containerRef.current);
      return () => observer.disconnect();
    } else {
      const handleResize = () => {
        if (containerRef.current) {
          setWidth(containerRef.current.clientWidth);
        }
      };
      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }
  }, [hasTrips]);

  const handleDragEnd = (event, info) => {
    const dragOffset = info.offset.x;
    const currentPosition = -sliderIndex * width + dragOffset;
    const rawIndex = -currentPosition / (width || 1);
    
    let newIndex = Math.round(rawIndex);
    
    // Quick swipe detection for highly responsive touch gestures
    const swipeThreshold = 40;
    const velocityThreshold = 0.2;
    if (info.velocity.x < -velocityThreshold && dragOffset < -swipeThreshold) {
      newIndex = Math.min(sliderIndex + 1, myTrips.length - 1);
    } else if (info.velocity.x > velocityThreshold && dragOffset > swipeThreshold) {
      newIndex = Math.max(sliderIndex - 1, 0);
    }
    
    newIndex = Math.max(0, Math.min(newIndex, myTrips.length - 1));
    setSliderIndex(newIndex);
  };

  const tripInfo = hasTrips ? myTrips[sliderIndex] : null;

  return (
    <GridContainerWrapper hasTrips={hasTrips} theme={theme} mode={mode} navigate={navigate}>
      {hasTrips && tripInfo ? (
        <Box sx={{ minWidth: { xs: "86vw", lg: "50vw" }, px: 0 }}>
          <Typography variant="h6" textAlign="left" mb={1} ml={1.4}>
            Your Trips
          </Typography>

          <Box 
            ref={containerRef}
            sx={{ position: "relative", minHeight: 125, width: "100%", overflow: "hidden" }}
          >
            <motion.div
              drag="x"
              dragConstraints={{ left: -width * (myTrips.length - 1), right: 0 }}
              dragElastic={0.2}
              onDragEnd={handleDragEnd}
              animate={{ x: -sliderIndex * width }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              style={{
                display: "flex",
                width: `${myTrips.length * 100}%`,
                cursor: "grab",
              }}
              whileDrag={{ cursor: "grabbing" }}
            >
              {myTrips.map((trip, i) => {
                const tripInfo = trip;
                return (
                  <Box
                    key={tripInfo.id}
                    sx={{
                      width: width || "100%",
                      flexShrink: 0,
                      boxSizing: "border-box",
                      px: { xs: 1, lg: 0 },
                    }}
                  >
                    <Card
                      onClick={() => navigate(`/trips/${tripInfo.id}`)}
                      sx={{
                        position: "relative",
                        overflow: "hidden",
                        borderRadius: "24px",
                        cursor: "pointer",
                        height: 125,
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "flex-end",

                        background:
                          mode === "dark"
                            ? "linear-gradient(135deg, #1e1e1e00, #2c2c2c00)"
                            : "linear-gradient(135deg, #f5f5f501, #e0e0e001)",

                        boxShadow:
                          mode === "dark"
                            ? `
                              inset 0 1px 1px rgba(255, 255, 255, 0.11),
                              inset 0 -1px 1px rgba(255, 255, 255, 0.07),
                              0 1px 0px rgba(0,0,0,0.1)
                            `
                            : `
                              inset 0 1px 1px rgba(255,255,255,0.8),
                              inset 0 -1px 1px rgba(0,0,0,0.1),
                              0 1px 0px rgba(0,0,0,0.1)
                            `,

                        transition: "all 0.35s ease",

                        "&:hover": {
                          boxShadow: "none",
                        },

                        // Transparent image layer
                        "&::after": tripGroupsMap[tripInfo.id]?.iconURL
                          ? {
                              content: '""',
                              position: "absolute",
                              inset: 0,
                              backgroundImage: `url(${tripGroupsMap[tripInfo.id].iconURL})`,
                              backgroundSize: "cover",
                              backgroundPosition: "center",
                              opacity: 0.15, // <-- image transparency
                              zIndex: 0,
                            }
                          : {},

                        // Dark overlay
                        "&::before": {
                          content: '""',
                          position: "absolute",
                          inset: 0,
                          zIndex: 1,
                        },

                        // Keep card content above both layers
                        "& > *": {
                          position: "relative",
                          zIndex: 2,
                        },
                      }}
                    >
                      {/* Glass Content Layer */}
                      <CardContent
                        sx={{
                          position: "relative",
                          zIndex: 2,
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "flex-end",
                          backdropFilter: "blur(6px)",
                          height: "100%",
                          boxSizing: "border-box",
                          p: 2,
                        }}
                      >
                        <Box
                          display="flex"
                          justifyContent="space-between"
                          alignItems="flex-end"
                          gap={2}
                          width="100%"
                        >
                          {/* Left Content */}
                          <Box sx={{ overflow: "hidden" }}>
                            <Typography
                              variant="h6"
                              sx={{
                                fontWeight: 800,
                                color: "#fff",
                                letterSpacing: 0.3,
                              }}
                              noWrap
                            >
                              {tripInfo?.name || "Unnamed Trip"}
                            </Typography>

                            <Typography
                              variant="body2"
                              sx={{
                                color: "rgba(255,255,255,0.75)",
                                display: "flex",
                                alignItems: "center",
                                mt: 0.5,
                              }}
                              noWrap
                            >
                              <LocationOn sx={{ fontSize: 16, mr: 0.7, flexShrink: 0 }} />
                              {tripInfo?.from || "Unknown"} →{" "}
                              {tripInfo?.location || "Unknown"}
                            </Typography>

                            {(tripInfo?.startDate || tripInfo?.date) && (
                              <Typography
                                variant="body2"
                                sx={{
                                  color: "rgba(255,255,255,0.7)",
                                  display: "flex",
                                  alignItems: "center",
                                  mt: 0.3,
                                }}
                              >
                                <AccessTime sx={{ fontSize: 16, mr: 0.7, flexShrink: 0 }} />
                                {tripInfo?.startDate || "?"} → {tripInfo?.date || "?"}
                              </Typography>
                            )}
                          </Box>

                          {/* Avatar Group */}
                          {tripMembersMap[tripInfo.id]?.length > 0 && (
                            <AvatarGroup
                              max={3}
                              sx={{
                                flexShrink: 0,
                                "& .MuiAvatar-root": {
                                  width: 30,
                                  height: 30,
                                  fontSize: 12,
                                  border:
                                    mode === "dark"
                                      ? "2px solid #1d1d1d"
                                      : "2px solid #ddd",
                                  backdropFilter: "blur(4px)",
                                },
                              }}
                            >
                              {tripMembersMap[tripInfo.id].map((m) => (
                                <Tooltip
                                  title={m.name || `@${m.username}`}
                                  key={m.uid}
                                >
                                  <Avatar
                                    src={
                                      m.photoURL ||
                                      `https://api.dicebear.com/7.x/identicon/svg?seed=${m.uid}`
                                    }
                                    alt={m.name || m.username}
                                  />
                                </Tooltip>
                              ))}
                            </AvatarGroup>
                          )}
                        </Box>
                      </CardContent>
                    </Card>
                  </Box>
                );
              })}
            </motion.div>
          </Box>

          {/* DOTS / INDICATORS */}
          {myTrips.length > 1 && (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                gap: 1.5,
                mt: 1.5,
              }}
            >
              {myTrips.map((_, i) => (
                <Box
                  key={i}
onClick={() => {
  if (i !== sliderIndex) {
    setSliderIndex(i);
  }
}}
                  sx={{
                    width: i === sliderIndex ? 34 : 8,
                    height: 6,
                    borderRadius: "7px",
                    cursor: "pointer",
                    transition:
  "all 0.55s cubic-bezier(0.22, 1, 0.36, 1)",
                    background:
                      i === sliderIndex
                        ? (mode === "dark" ? "#ffffff" : "#000000")
                        : (mode === "dark" ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.22)"),
                  }}
                />
              ))}
            </Box>
          )}
        </Box>
      ) : null}
    </GridContainerWrapper>
  );
}

// Wrapper to handle the grid configuration and empty state cleanly
function GridContainerWrapper({ hasTrips, theme, mode, navigate, children }) {
  if (hasTrips) {
    return children;
  }

  return (
    <Box
      sx={{
        mt: 6,
        px: 2,
        py: 2,
        textAlign: "center",
        borderRadius: "20px",
        backdropFilter: "blur(14px)",
        background:
          theme.palette.mode === "dark"
            ? "rgba(255,255,255,0.05)"
            : "rgba(255,255,255,0.7)",
        border: "1px solid rgba(255,255,255,0.15)",
        boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
        maxWidth: 420,
        mx: "auto",
        width: "100%",
        transition: "all 0.3s ease",
        "&:hover": {
          transform: "transform 0.6s cubic-bezier(0.22, 1, 0.36, 1)",
          boxShadow: "0 20px 50px rgba(0,0,0,0.15)",
        },
      }}
    >
      <Typography sx={{ fontSize: "40px", mb: 1 }}>🧳</Typography>

      <Typography
        variant="h6"
        sx={{
          fontWeight: 700,
          mb: 0.5,
          color: theme.palette.text.primary,
        }}
      >
        No Trips Yet
      </Typography>

      <Typography
        variant="body2"
        sx={{
          color: theme.palette.text.secondary,
          opacity: 0.85,
        }}
      >
        You haven’t planned any trips yet. Start your next adventure now!
      </Typography>

      <Button
        onClick={() => navigate("/search")}
        variant="contained"
        sx={{
          mt: 2,
          borderRadius: "12px",
          textTransform: "none",
          background: mode === "dark" ? "#fff" : "#0c0c0c",
          color: mode === "dark" ? "#0c0c0c" : "#fff",
          px: 3,
          py: 1,
        }}
      >
        + Create Trip
      </Button>
    </Box>
  );
}
