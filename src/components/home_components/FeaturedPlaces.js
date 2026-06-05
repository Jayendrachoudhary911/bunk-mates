import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Box,
  Typography,
  Grid,
  IconButton,
  Card,
  Stack,
  useTheme,
  alpha,
  CircularProgress,
} from "@mui/material";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Favorite,
  FavoriteBorder,
  Bookmark,
  BookmarkBorder,
} from "../../icons/LucideIcons";
import PlaceDetailsDialog from "../../elements/PlaceDetailsDialog";
import { usePlaceLikesCount } from "../../hooks/usePlaceLikesCount";
import AnimatedLikeCount from "../../elements/AnimatedLikeCount";
import { toggleLikePlace, toggleSavePlace } from "../../utils/placeActions";

const CARD_WIDTH = 365 + 16;
const PARTICLES = 8;

const haptic = (pattern = 10) => {
  if (typeof navigator !== "undefined" && navigator.vibrate) {
    navigator.vibrate(pattern);
  }
};

const LikeBurst = ({ x = 0, y = 0 }) => {
  return (
    <>
      {Array.from({ length: PARTICLES }).map((_, i) => {
        const angle = (Math.PI * 2 * i) / PARTICLES;
        const distance = 18 + Math.random() * 10;

        return (
          <motion.span
            key={i}
            initial={{
              opacity: 1,
              scale: 0,
              x: 0,
              y: 0,
            }}
            animate={{
              opacity: 0,
              scale: 1,
              x: Math.cos(angle) * distance,
              y: Math.sin(angle) * distance,
            }}
            transition={{ duration: 0.45, ease: "easeOut" }}
            style={{
              position: "absolute",
              width: 36,
              height: 36,
              borderRadius: "50%",
              backgroundColor: "#ef4444",
              pointerEvents: "none",
            }}
          />
        );
      })}
    </>
  );
};

const PlaceCard = ({ place, userData, onPlanTrip, relatedPlaces = [] }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const [open, setOpen] = useState(false);
  const [likeAnim, setLikeAnim] = useState(false);
  const [saveAnim, setSaveAnim] = useState(false);
  const [showBurst, setShowBurst] = useState(false);

  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);

  const likesCount = usePlaceLikesCount(place.id, place.likesCount);

  useEffect(() => {
    setLiked(userData?.likedTrips?.includes(place.id) ?? false);
    setSaved(userData?.savedTrips?.includes(place.id) ?? false);
  }, [userData, place.id]);

  const animate = (setter) => {
    setter(true);
    setTimeout(() => setter(false), 260);
  };

  const handleLike = (e) => {
    e.stopPropagation();

    const next = !liked;
    setLiked(next);

    if (next) {
      haptic([15, 20, 15]);
      setLikeAnim(true);
      setShowBurst(true);

      setTimeout(() => setLikeAnim(false), 220);
      setTimeout(() => setShowBurst(false), 500);
    }

    toggleLikePlace(place.id, liked);
  };

  const handleSave = (e) => {
    e.stopPropagation();
    const next = !saved;
    setSaved(next);
    animate(setSaveAnim);
    toggleSavePlace(place.id, saved);
  };

  return (
    <>
      <motion.div
        layoutId={`place-${place.id}`}
        onClick={() => setOpen(true)}
        whileTap={{ scale: 0.985 }}
        transition={{ type: "spring", stiffness: 260, damping: 28 }}
        style={{
          borderRadius: 24,
          overflow: "hidden",
        }}
      >
        <Card
          elevation={0}
          sx={{
            position: "relative",
            height: 360,
            width: "100%",
            maxWidth: 410,
            minWidth: 360,
            p: 1,
            mx: "auto",
            cursor: "default",
            userSelect: "none",
            borderRadius: 3,
            overflow: "hidden",
            backgroundColor: isDark ? "#131313" : "#ffffff",
            boxShadow: isDark
              ? "0 16px 34px rgba(0,0,0,0.55)"
              : "0 14px 30px rgba(0,0,0,0.14)",
            transition: "box-shadow .25s ease, transform .25s ease",
            "&:hover": {
              boxShadow: isDark
                ? "0 20px 42px rgba(0,0,0,0.65)"
                : "0 18px 36px rgba(0,0,0,0.18)",
            },
            "&:active": {
              transform: "scale(0.99)",
            },
            "&:focus-visible": {
              outline: "none",
            },
          }}
        >
          {/* ───── IMAGE HERO ───── */}
          <Box
            sx={{
              height: 260,
              width: "100%",
              maxWidth: 348,
              borderRadius: 4,
              position: "relative",
              overflow: "hidden",
              backgroundImage: `url(${place.images?.[0]})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              transition: "transform .35s ease",
            }}
          >
            {/* ───── ACTIONS ───── */}
            <Stack
              spacing={1}
              sx={{
                position: "absolute",
                top: 12,
                right: 12,
                zIndex: 3,
              }}
            >
              <IconButton
                onClick={(e) => {
                  e.stopPropagation();
                  handleLike(e);
                }}
                sx={{
                  backdropFilter: "blur(14px)",
                  background: alpha(
                    isDark ? theme.palette.common.black : "#000",
                    0.25
                  ),
                  borderRadius: 6,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  color: "#fff",
                  transform: likeAnim ? "scale(1.4)" : "scale(1)",
                  transition:
                    "transform 200ms cubic-bezier(.34,1.56,.64,1), background .25s ease",
                  "&:hover": {
                    background: alpha(theme.palette.error.main, 0.25),
                  },
                }}
              >
                {liked ? (
                  <Favorite
                    fill={theme.palette.error.main}
                    sx={{ color: theme.palette.error.main }}
                  />
                ) : (
                  <FavoriteBorder />
                )}

                <AnimatedLikeCount
                  value={likesCount}
                  sx={{ color: "#fff", fontSize: 8 }}
                />

                {showBurst && (
                  <Box sx={{ position: "absolute", inset: 0 }}>
                    <LikeBurst />
                  </Box>
                )}
              </IconButton>

              <IconButton
                onClick={(e) => {
                  e.stopPropagation();
                  handleSave(e);
                }}
                sx={{
                  backdropFilter: "blur(14px)",
                  background: alpha(
                    isDark ? theme.palette.common.black : "#000",
                    0.25
                  ),
                  color: saved ? "#facc15" : "#fff",
                  transform: saveAnim ? "scale(1.4)" : "scale(1)",
                  transition: "transform 200ms cubic-bezier(.34,1.56,.64,1)",
                }}
              >
                {saved ? <Bookmark fill="#facc15" /> : <BookmarkBorder />}
              </IconButton>
            </Stack>
          </Box>

          {/* ───── CONTENT PANEL ───── */}
          <Box
            sx={{
              px: 1.2,
              pr: 2.2,
              py: 2.2,
              display: "flex",
              flexDirection: "column",
              gap: 0.6,
              backgroundColor: isDark ? "#131313" : "#ffffff",
            }}
          >
            <Typography fontWeight={900} fontSize={16}>
              {place.name}
            </Typography>

            <Typography
              variant="caption"
              color={theme.palette.text.secondary}
              sx={{
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {place.description}
            </Typography>
          </Box>
        </Card>
      </motion.div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 1600,
            }}
          >
            <PlaceDetailsDialog
              key={place.id}
              place={place}
              open={open}
              onClose={() => setOpen(false)}
              liked={liked}
              saved={saved}
              likesCount={likesCount}
              onLike={() => handleLike({ stopPropagation: () => {} })}
              onSave={() => handleSave({ stopPropagation: () => {} })}
              relatedPlaces={relatedPlaces}
              onPlanTrip={onPlanTrip}
              onRedirect={(nextPlace) => {
                place(nextPlace);
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default function FeaturedPlaces({
  allFlattenedPlaces,
  userData,
  onPlanTrip,
  mode,
  navigate,
}) {
  const [placeIndex, setPlaceIndex] = useState(0);
  const placesScrollRef = useRef(null);

  const carouselPlaces = useMemo(() => {
    return allFlattenedPlaces.slice(0, 4);
  }, [allFlattenedPlaces]);

  const remainingPlaces = useMemo(() => {
    return allFlattenedPlaces.slice(4);
  }, [allFlattenedPlaces]);

  if (!allFlattenedPlaces || allFlattenedPlaces.length === 0) {
    return (
      <Box sx={{ py: 10, textAlign: "center", width: "100%" }}>
        <CircularProgress size={30} />
        <Typography mt={2} color="text.secondary">
          Loading suggestions...
        </Typography>
      </Box>
    );
  }

  return (
    <Grid item xs={12} sx={{ px: { xs: 1, md: 0 }, mt: 4, mb: 10 }}>
      {/* Carousel for first 4 places */}
      {carouselPlaces.length > 0 && (
        <>
          <Typography
            variant="h6"
            textAlign="left"
            mb={1.5}
            sx={{ fontWeight: 600, px: 1 }}
          >
            Featured Places
          </Typography>

          <Box sx={{ position: "relative" }}>
            {/* ◀ LEFT */}
            <IconButton
              onClick={() =>
                placesScrollRef.current.scrollBy({
                  left: -CARD_WIDTH,
                  behavior: "smooth",
                })
              }
              sx={{
                position: "absolute",
                left: -6,
                top: "45%",
                zIndex: 5,
                backdropFilter: "blur(14px)",
                background: "rgba(0,0,0,0.35)",
                color: "#fff",
              }}
            >
              <ChevronLeft />
            </IconButton>

            {/* ▶ RIGHT */}
            <IconButton
              onClick={() =>
                placesScrollRef.current.scrollBy({
                  left: CARD_WIDTH,
                  behavior: "smooth",
                })
              }
              sx={{
                position: "absolute",
                right: -6,
                top: "45%",
                zIndex: 5,
                backdropFilter: "blur(14px)",
                background: "rgba(0,0,0,0.35)",
                color: "#fff",
              }}
            >
              <ChevronRight />
            </IconButton>

            {/* SCROLL AREA */}
            <Box
              ref={placesScrollRef}
              onScroll={(e) => {
                setPlaceIndex(Math.round(e.target.scrollLeft / CARD_WIDTH));
              }}
              sx={{
                display: "flex",
                gap: 2,
                px: 1,
                mb: 2,
                overflowX: "auto",
                scrollSnapType: "x mandatory",
                "&::-webkit-scrollbar": { display: "none" },
              }}
            >
              {carouselPlaces.map((place) => (
                <Box
                  key={place.id}
                  sx={{ width: 365, scrollSnapAlign: "start" }}
                >
                  <PlaceCard
                    place={place}
                    userData={userData}
                    onPlanTrip={onPlanTrip}
                  />
                </Box>
              ))}
            </Box>

            {/* DOTS */}
            <Box sx={{ display: "flex", justifyContent: "center", gap: 1 }}>
              {carouselPlaces.map((_, i) => (
                <Box
                  key={i}
                  onClick={() =>
                    placesScrollRef.current.scrollTo({
                      left: i * CARD_WIDTH,
                      behavior: "smooth",
                    })
                  }
                  sx={{
                    width: i === placeIndex ? 18 : 6,
                    height: 6,
                    borderRadius: 99,
                    cursor: "pointer",
                    transition: "all .3s ease",
                    background:
                      i === placeIndex
                        ? mode === "dark"
                          ? "rgba(255,255,255,0.85)"
                          : "rgba(0,0,0,0.85)"
                        : mode === "dark"
                        ? "rgba(255,255,255,0.25)"
                        : "rgba(0,0,0,0.22)",
                  }}
                />
              ))}
            </Box>
          </Box>
        </>
      )}

      {/* Remaining places in a grid */}
      {remainingPlaces.length > 0 && (
        <Box sx={{ mt: 6 }}>
          <Typography
            variant="h6"
            textAlign="left"
            mb={2}
            sx={{ fontWeight: 600 }}
          >
            More Places
          </Typography>
          <Grid container spacing={2}>
            {remainingPlaces.map((place, index) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
                <PlaceCard
                  place={place}
                  userData={userData}
                  onPlanTrip={onPlanTrip}
                />
              </Grid>
            ))}
          </Grid>
        </Box>
      )}
    </Grid>
  );
}
