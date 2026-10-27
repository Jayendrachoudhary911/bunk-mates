import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  Typography,
  Grid,
  IconButton,
  Button,
  Card,
  Stack,
  useTheme,
  alpha,
  CircularProgress,
  SwipeableDrawer,
} from "@mui/material";
import { motion } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Favorite as FavoriteIcon, 
  FavoriteBorder as FavoriteBorderIcon, 
  Bookmark as BookmarkIcon, 
  BookmarkBorder as BookmarkBorderIcon, 
  Close as CloseIcon,
  ExploreOutlined as ExploreIcon,
  Share as ShareIcon,
} from "../../icons";
import { usePlaceLikesCount } from "../../hooks/usePlaceLikesCount";
import { toggleLikePlace, toggleSavePlace } from "../../utils/placeActions";
import { glass, glassIconBtnSx, ctaButtonSx, drawerPaperSx, drawerBackdropSx, drawerHandleSx } from "../../theme/designSystem";
import { auth } from "../../firebase";
import UniversalShareToChatDialog from "../chats_components/UniversalShareToChatDialog";

const CARD_WIDTH = 270;
const CARD_GAP = 16;
const SCROLL_AMOUNT = CARD_WIDTH + CARD_GAP;

const InfoItem = ({ label, value, full }) => (
  <Box sx={{ gridColumn: full ? "span 2" : "auto" }}>
    <Typography opacity={0.6} fontSize={12}>
      {label}
    </Typography>
    <Typography fontWeight={600} fontSize={14}>
      {value}
    </Typography>
  </Box>
);

const haptic = (pattern = 10) => {
  if (typeof navigator !== "undefined" && navigator.vibrate) {
    navigator.vibrate(pattern);
  }
};

const PlaceCard = ({ place, userData, onPlanTrip, relatedPlaces,
  onClose,
  onLike,
  onSave, mode = [] }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const [open, setOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveAnim, setSaveAnim] = useState(false);

  const likesCount = usePlaceLikesCount(place.id, place.likesCount);

  useEffect(() => {
    setLiked(userData?.likedTrips?.includes(place.id) ?? false);
    setSaved(userData?.savedTrips?.includes(place.id) ?? false);
  }, [userData, place.id]);

  const handleLike = (e) => {
    e.stopPropagation();
    const next = !liked;
    setLiked(next);
    if (next) {
      haptic([15, 20, 15]);
    }
    toggleLikePlace(place.id, liked);
  };

  const handleSave = (e) => {
    e.stopPropagation();
    const next = !saved;
    setSaved(next);
    setSaveAnim(true);
    setTimeout(() => setSaveAnim(false), 260);
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
          flexShrink: 0,
          width: CARD_WIDTH,
          border: 0,
          textDecoration: "none",
          WebkitTapHighlightColor: "transparent",
        }}
      >
        <Card
          component="div"
          elevation={0}
          sx={{
            position: "relative",
            p: 1,
            cursor: "pointer",
            userSelect: "none",
            textDecoration: "none",
            color: "inherit",
            WebkitTapHighlightColor: "transparent",
            borderRadius: 3,
            border: 0,
            overflow: "hidden",
            backgroundColor: isDark ? "#131313" : "#ffffff",
            boxShadow: 'none',
          }}
        >
          {/* IMAGE HERO */}
          <Box
            sx={{
              height: 150,
              width: "100%",
              borderRadius: 4,
              position: "relative",
              overflow: "hidden",
              backgroundImage: `url(${place.images?.[0]})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            <Stack
              spacing={1}
              sx={{ position: "absolute", top: 12, right: 12, zIndex: 3 }}
            >
              <IconButton
                onClick={handleSave}
                sx={{
                  backdropFilter: "blur(14px)",
                  background: alpha(isDark ? theme.palette.common.black : "#000", 0.25),
                  color: saved ? "#facc15" : "#fff",
                  transform: saveAnim ? "scale(1.4)" : "scale(1)",
                  transition: "transform 200ms cubic-bezier(.34,1.56,.64,1)",
                }}
              >
                {saved ? <BookmarkIcon fill="#facc15" /> : <BookmarkBorderIcon />}
              </IconButton>

              <IconButton
                onClick={(e) => {
                  e.stopPropagation();
                  setShareOpen(true);
                }}
                sx={{
                  backdropFilter: "blur(14px)",
                  background: alpha(isDark ? theme.palette.common.black : "#000", 0.25),
                  color: "#fff",
                  "&:hover": { background: alpha(isDark ? theme.palette.common.black : "#000", 0.45) },
                }}
                title="Share Place to Chat"
              >
                <ShareIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Stack>
          </Box>

          {/* CONTENT PANEL */}
          <Box
            sx={{
              px: 1.2,
              pr: 2.2,
              py: 1.4,
              display: "flex",
              flexDirection: "column",
              gap: 0.5,
              ...glass(isDark ? "dark" : "light", {
                backgroundColor: isDark ? "rgba(20, 20, 20, 0)" : "rgba(255, 255, 255, 0)",
                border: 0, boxShadow: 0,
              }),
            }}
          >
            <Typography fontWeight={900} fontSize={15} noWrap sx={{ textDecoration: "none" }}>
              {place.name}
            </Typography>

            {/* LOCATION SUBTITLE */}
            {(place.city || place.state || place.location) && (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0.5,
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  textDecoration: "none",
                }}
                noWrap
              >
                📍 {place.location || `${place.city || ""}, ${place.state || ""}`.trim()}
              </Typography>
            )}

            <Typography
              variant="caption"
              color={theme.palette.text.secondary}
              sx={{
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
                textDecoration: "none",
                lineHeight: 1.35,
              }}
            >
              {place.description}
            </Typography>

            {/* METADATA ROW: TYPE & BEST TIME */}
            <Stack
              direction="row"
              spacing={1.5}
              alignItems="center"
              sx={{ mt: 0.8, pt: 0.6, borderTop: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}` }}
            >
              {place.type && (
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: 600,
                    fontSize: "0.7rem",
                    px: 1,
                    py: 0.2,
                    borderRadius: 1.5,
                    backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)",
                    color: isDark ? "rgba(255,255,255,0.85)" : "rgba(0,0,0,0.75)",
                  }}
                  noWrap
                >
                  🏷️ {place.type}
                </Typography>
              )}

              {place.bestTimeToVisit && (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ fontSize: "0.7rem", fontWeight: 500 }}
                  noWrap
                >
                  ☀️ {place.bestTimeToVisit}
                </Typography>
              )}
            </Stack>
          </Box>
        </Card>
      </motion.div>

      {/* ───── SWIPEABLE FULL-SCREEN DRAWER ───── */}
      <SwipeableDrawer
        anchor="bottom"
        open={open}
        onOpen={() => setOpen(true)}
        onClose={() => setOpen(false)}
        disableBackdropTransition={true}
        disableDiscovery={true}
        swipeAreaWidth={56}
        ModalProps={{
          keepMounted: true, // Keeps DOM node mounted for instant slide performance
        }}
        PaperProps={{
          sx: drawerPaperSx(mode, { maxHeight: "90vh" }),
        }}
        sx={{ "& .MuiBackdrop-root": drawerBackdropSx }}
      >
        <Box sx={{ display: { xs: "flex", md: "none" }, justifyContent: "center", pt: -1, pb: 1 }}>
          <Box mode={mode} sx={{ ...drawerHandleSx() }} />
        </Box>

        <Box sx={{ p: 0, overflowY: "auto", flexGrow: 1 }}>
          <Box
            sx={{
              flexGrow: 1,
              overflowY: "auto",
              px: 0,
              pb: 0,
              "&::-webkit-scrollbar": { width: 6 },
              "&::-webkit-scrollbar-thumb": {
                borderRadius: 6,
                background: isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.15)",
              },
            }}
          >
            {/* HERO IMAGE & FLOATING ACTIONS */}
            <Box
              sx={{
                height: 280,
                backgroundImage: `url(${place.images?.[0]})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                borderRadius: 6,
                position: "relative",
                mb: 3,
              }}
            >
              <IconButton
                onClick={() => setOpen(false)}
                sx={{
                  position: "absolute",
                  display: { xs: "none", md: "flex" },
                  top: 16,
                  right: 16,
                  zIndex: 3,
                  ...glassIconBtnSx("dark"),
                }}
              >
                <CloseIcon />
              </IconButton>

              <Stack
                direction="row"
                spacing={1}
                sx={{
                  position: "absolute",
                  bottom: 12,
                  left: 12,
                  right: 12,
                  zIndex: 3,
                  p: 0.8,
                  borderRadius: 4,
                  alignItems: "center",
                }}
              >
                <Button
                  onClick={handleLike}
                  sx={{
                    minWidth: 44,
                    height: 44,
                    px: 1.6,
                    borderRadius: 6,
                    fontWeight: 700,
                    fontSize: 13,
                    backdropFilter: "blur(22px) saturate(0.8) brightness(1.9)",
                    background: liked ? "rgba(255, 255, 255, 0.65)" : "rgba(255,255,255,0.12)",
                    color: "#fff",
                    "&:hover": { transform: "scale(1.05)" },
                    transition: "all .25s ease",
                  }}
                >
                  {liked ? (
                    <FavoriteIcon sx={{ color: theme.palette.error.main }} />
                  ) : (
                    <FavoriteBorderIcon />
                  )}
                </Button>

                <Button
                  onClick={handleSave}
                  startIcon={saved ? <BookmarkIcon /> : <BookmarkBorderIcon />}
                  sx={{
                    minWidth: 78,
                    height: 44,
                    px: 1.8,
                    borderRadius: 6,
                    fontWeight: 700,
                    fontSize: 13,
                    background: saved ? "rgba(255, 234, 0, 0.14)" : "rgba(0, 0, 0, 0.17)",
                    color: "#fff",
                    backdropFilter: "blur(22px) saturate(0.8) brightness(1.9)",
                    "&:hover": { transform: "scale(1.05)" },
                    transition: "all .25s ease",
                  }}
                >
                  {saved ? "Saved" : "Save"}
                </Button>

                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    onPlanTrip?.(place);
                  }}
                  sx={ctaButtonSx("dark", "primary", {
                    flex: 1,
                    height: 48,
                    ml: 0.5,
                    borderRadius: 6,
                    fontSize: "0.95rem",
                  })}
                >
                  Plan this Trip
                </Button>
              </Stack>
            </Box>

            {/* PLACE DETAILS INFO */}
            <Box sx={{ px: 2 }}>
              <Typography fontWeight={900} variant="h5" mb={0.5}>
                {place.name}
              </Typography>

              <Typography opacity={0.65} mb={1.5} fontSize={15}>
                {place.city}, {place.state}
              </Typography>

              <Box sx={{ display: "flex", gap: 1.5, alignItems: "center", mb: 3 }}>
                <Typography
                  variant="caption"
                  sx={{
                    display: "inline-block",
                    px: 1.5,
                    py: 0.6,
                    borderRadius: 2,
                    bgcolor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
                    fontWeight: 600,
                  }}
                >
                  {place.type}
                </Typography>

                {likesCount > 0 && (
                  <Typography variant="caption" fontWeight={600} opacity={0.7}>
                    ❤️ {likesCount} Likes
                  </Typography>
                )}
              </Box>

              <Typography sx={{ mb: 4, lineHeight: 1.8, fontSize: "0.95rem", opacity: 0.9 }}>
                {place.description}
              </Typography>

              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 2.5,
                  p: 2.5,
                  borderRadius: 4,
                  bgcolor: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)",
                  border: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}`,
                }}
              >
                <InfoItem label="Best Time to Visit" value={place.bestTimeToVisit} />
                <InfoItem label="Season" value={place.season} />
                <InfoItem label="Weather" value={place.weather} full />
              </Box>

              <Button
                variant="contained"
                fullWidth
                startIcon={<ShareIcon />}
                onClick={() => setShareOpen(true)}
                sx={{
                  mt: 3,
                  py: 1.3,
                  borderRadius: 3,
                  fontWeight: 700,
                  textTransform: "none",
                  background: isDark ? "#ffffff" : "#0f172a",
                  color: isDark ? "#000000" : "#ffffff",
                  "&:hover": {
                    background: isDark ? "#e2e8f0" : "#1e293b",
                  },
                }}
              >
                Share Place to Chats & Groups
              </Button>
            </Box>
          </Box>
        </Box>
      </SwipeableDrawer>

      <UniversalShareToChatDialog
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        itemType="place"
        itemData={place}
        currentUser={auth.currentUser}
        effectiveChatTheme={isDark ? "dark" : "light"}
      />
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
  const placesScrollRef = useRef(null);

  const scrollLeft = () => {
    if (placesScrollRef.current) {
      placesScrollRef.current.scrollBy({ left: -SCROLL_AMOUNT, behavior: "smooth" });
    }
  };

  const scrollRight = () => {
    if (placesScrollRef.current) {
      placesScrollRef.current.scrollBy({ left: SCROLL_AMOUNT, behavior: "smooth" });
    }
  };

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

  // Limit to only 10 places initially
  const displayedPlaces = allFlattenedPlaces.slice(0, 10);
  const hasMore = allFlattenedPlaces.length > 10;

  return (
    <Grid item xs={12} sx={{ mt: 4, mb: 4, overflow: "hidden" }}>
      {allFlattenedPlaces.length > 0 && (
        <>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              px: { xs: 2, md: 0 },
              mb: 1.5,
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Explore Places
            </Typography>

            <Box sx={{ display: { xs: "none", sm: "flex" }, gap: 1 }}>
              <IconButton
                onClick={scrollLeft}
                size="small"
                sx={{
                  background: mode === "dark" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
                  color: mode === "dark" ? "#fff" : "#000",
                }}
              >
                <ChevronLeft fontSize="small" />
              </IconButton>
              <IconButton
                onClick={scrollRight}
                size="small"
                sx={{
                  background: mode === "dark" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
                  color: mode === "dark" ? "#fff" : "#000",
                }}
              >
                <ChevronRight fontSize="small" />
              </IconButton>
            </Box>
          </Box>

          {/* SCROLLER CONTAINER WITH ADAPTIVE EDGE MASKS */}
          <Box sx={{ position: "relative" }}>
            {/* Left Edge Mask Gradient */}
            <Box
              sx={{
                position: "absolute",
                left: 0,
                top: 0,
                bottom: 0,
                width: 32,
                zIndex: 2,
                pointerEvents: "none",
                background:
                  mode === "dark"
                    ? "linear-gradient(to right, rgba(12,12,12,0.9), transparent)"
                    : "linear-gradient(to right, rgba(241,241,241,0.9), transparent)",
              }}
            />

            {/* Right Edge Mask Gradient */}
            <Box
              sx={{
                position: "absolute",
                right: 0,
                top: 0,
                bottom: 0,
                width: 32,
                zIndex: 2,
                pointerEvents: "none",
                background:
                  mode === "dark"
                    ? "linear-gradient(to left, rgba(12,12,12,0.9), transparent)"
                    : "linear-gradient(to left, rgba(241,241,241,0.9), transparent)",
              }}
            />

            <Box
              ref={placesScrollRef}
              sx={{
                display: "flex",
                gap: `${CARD_GAP}px`,
                px: { xs: 2, md: 0 },
                pr: { xs: 4, md: 2 },
                overflowX: "auto",
                scrollSnapType: "none",
                WebkitOverflowScrolling: "touch",
                "&::-webkit-scrollbar": { display: "none" },
                scrollbarWidth: "none",
                alignItems: "center",
              }}
            >
              {displayedPlaces.map((place) => (
                <PlaceCard
                  key={place.id}
                  place={place}
                  userData={userData}
                  onPlanTrip={onPlanTrip}
                  mode={mode}
                />
              ))}

              {/* OPTIONAL EXPLORE MORE CARD / BUTTON */}
              {hasMore && (
                <Box
                  onClick={() => navigate ? navigate("/explore") : null}
                  sx={{
                    flexShrink: 0,
                    width: 220,
                    height: 310,
                    borderRadius: 4,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 1.5,
                    cursor: "pointer",
                    backgroundColor: mode === "dark" ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
                    border: `1px dashed ${mode === "dark" ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.15)"}`,
                    transition: "all 0.2s ease",
                    "&:hover": {
                      backgroundColor: mode === "dark" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
                      borderColor: "#00d2ff",
                    },
                  }}
                >
                  <Box
                    sx={{
                      width: 50,
                      height: 50,
                      borderRadius: "50%",
                      backgroundColor: mode === "dark" ? "rgba(0,210,255,0.15)" : "rgba(0,210,255,0.1)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#00d2ff",
                    }}
                  >
                    <ExploreIcon />
                  </Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: mode === "dark" ? "#fff" : "#000" }}>
                    Explore More
                  </Typography>
                  <Typography variant="caption" color="text.secondary" textAlign="center" sx={{ px: 2 }}>
                    Discover all available destinations
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>
        </>
      )}
    </Grid>
  );
}