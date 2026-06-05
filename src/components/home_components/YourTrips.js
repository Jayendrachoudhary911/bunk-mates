import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
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

const slideVariants = {
  enter: (direction) => ({
    x: direction > 0 ? 250 : -250,
    opacity: 0,
    scale: 0.96,
    filter: "blur(8px)",
  }),

  center: {
    zIndex: 2,
    x: 0,
    opacity: 1,
    scale: 1,
    filter: "blur(0px)",
  },

  exit: (direction) => ({
    zIndex: 1,
    x: direction < 0 ? 250 : -250,
    opacity: 0,
    scale: 0.96,
    filter: "blur(8px)",
    position: "absolute",
    width: "100%",
    top: 0,
    left: 0,
  }),
};

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
  const [direction, setDirection] = useState(0);
  const lastIndexRef = useRef(sliderIndex);

  useEffect(() => {
    if (sliderIndex !== lastIndexRef.current) {
      setDirection(sliderIndex > lastIndexRef.current ? 1 : -1);
      lastIndexRef.current = sliderIndex;
    }
  }, [sliderIndex]);

  const paginate = (newDirection) => {
    const nextIndex = sliderIndex + newDirection;
    if (nextIndex >= 0 && nextIndex < myTrips.length) {
      setDirection(newDirection);
      lastIndexRef.current = sliderIndex;
      setSliderIndex(nextIndex);
    }
  };

  const tripInfo = hasTrips ? myTrips[sliderIndex] : null;

  return (
    <GridContainerWrapper hasTrips={hasTrips} theme={theme} mode={mode} navigate={navigate}>
      {hasTrips && tripInfo ? (
        <Box sx={{ minWidth: { xs: "86vw", lg: "50vw" }, px: 0 }}>
          <Typography variant="h6" textAlign="left" mb={1} ml={1.4}>
            Your Trips
          </Typography>

          <Box sx={{ position: "relative", minHeight: 125, width: "100%", overflow: "hidden" }}>
            <AnimatePresence initial={false} custom={direction}>
              <motion.div
                key={tripInfo.id}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
transition={{
  x: {
    type: "spring",
    stiffness: 110,
    damping: 22,
    mass: 1.1,
  },

  opacity: {
    duration: 0.45,
    ease: [0.22, 1, 0.36, 1],
  },

  scale: {
    duration: 0.45,
    ease: [0.22, 1, 0.36, 1],
  },

  filter: {
    duration: 0.45,
  },
}}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.18}
dragMomentum={true}
dragTransition={{
  bounceStiffness: 120,
  bounceDamping: 18,
}}
whileDrag={{
  scale: 0.97,
  rotateY: 3,
  cursor: "grabbing",
}}
                onDragEnd={(e, { offset, velocity }) => {
                  const swipeThreshold = 50; // px
                  if (offset.x < -swipeThreshold && sliderIndex < myTrips.length - 1) {
                    paginate(1);
                  } else if (offset.x > swipeThreshold && sliderIndex > 0) {
                    paginate(-1);
                  }
                }}
                style={{
                  width: "100%",
                }}
              >
                <Box sx={{ px: 0 }}>
                  <Card
                    onClick={() => navigate(`/trips/${tripInfo.id}`)}
                    sx={{
                      position: "relative",
                      overflow: "hidden",
                      borderRadius: "24px",
                      cursor: "pointer",
                      mx: { xs: 1, lg: 0 },
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
              </motion.div>
            </AnimatePresence>
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
                      setDirection(i > sliderIndex ? 1 : -1);
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
