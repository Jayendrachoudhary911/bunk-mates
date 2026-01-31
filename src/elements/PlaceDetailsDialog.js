import React from "react";
import { motion, useMotionValue, useTransform } from "framer-motion";
import {
  Box,
  Typography,
  Stack,
  Button,
  IconButton,
  useTheme,
} from "@mui/material";
import { 
  Favorite as FavoriteIcon, 
  FavoriteBorder as FavoriteBorderIcon, 
  Bookmark as BookmarkIcon, 
  BookmarkBorder as BookmarkBorderIcon, 
  Close as CloseIcon 
} from "../icons/LucideIcons";

const CLOSE_THRESHOLD = 120;
const NEXT_THRESHOLD = -120;

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

const rubberBand = (d, dim = 300, r = 0.55) =>
  (dim * r * d) / (dim + r * Math.abs(d));

const PlaceDetailsDialog = ({
  place,
  open,
  onClose,
  onNext,
  liked,
  saved,
  likesCount,
  onLike,
  onSave,
  onPlanTrip={onPlanTrip}, 
  relatedPlaces = [],
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  /* ───────── MOTION MAPPINGS ───────── */
  const scale = useTransform(y, [0, 300], [1, 0.96]);

  const backdropOpacity = useTransform(y, [0, 300], [0.55, 0.15]);
  const backdropBlur = useTransform(y, [0, 300], [20, 0]);
  const backdropSaturate = useTransform(y, [0, 300], [120, 100]);

  if (!open) return null;

  return (
    <>
      {/* ───────────────── BACKDROP ───────────────── */}
      <motion.div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 1500,

          background: isDark
            ? "radial-gradient(120% 90% at 50% 100%, rgba(32, 32, 32, 0.92), rgba(32, 32, 32, 0.92))"
            : "radial-gradient(120% 90% at 50% 100%, rgba(255, 255, 255, 0.85), rgba(255, 255, 255, 0.87))",

          opacity: 1,
          backdropFilter: `blur(${backdropBlur}px) saturate(${backdropSaturate}%)`,
          WebkitBackdropFilter: `blur(${backdropBlur}px) saturate(${backdropSaturate}%)`,
        }}
      />

      {/* ───────────────── DIALOG ───────────────── */}
      <motion.div
        layoutId={`place-${place.id}`}
        drag
        dragElastic={0}
        dragConstraints={{ top: 0, bottom: 0, left: 0, right: 0 }}
        onDrag={(e, info) => {
          x.set(rubberBand(info.offset.x));
          y.set(rubberBand(info.offset.y));
        }}
        onDragEnd={(e, info) => {
          if (
            info.offset.y > CLOSE_THRESHOLD ||
            info.offset.x > CLOSE_THRESHOLD
          ) {
            onClose();
          } else if (info.offset.x < NEXT_THRESHOLD) {
            onNext?.();
          } else {
            x.set(0);
            y.set(0);
          }
        }}
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 1600,

          left: 12,
          right: 12,
          top: 18,
          bottom: 72,
          height: "80vh",
          margin: "auto",

          background: isDark
            ? "linear-gradient(180deg, #0b0b0b 0%, #121212 100%)"
            : "#ffffff",

          borderRadius: 35,
          overflow: "hidden",

          boxShadow: isDark
            ? "0 40px 120px rgba(0,0,0,0.85)"
            : "0 40px 120px rgba(0,0,0,0.35)",

          x,
          y,
          scale,
          touchAction: "none",
        }}
        transition={{ type: "spring", stiffness: 260, damping: 30 }}
      >
        {/* ───────── HERO ───────── */}
        <Box
          sx={{
            height: 260,
            backgroundImage: `url(${place.images?.[0]})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            m: 1,
            borderRadius: 7.5,
            position: "relative",
          }}
        >
          <IconButton
            onClick={onClose}
            sx={{
              position: "absolute",
              top: 16,
              right: 16,
              zIndex: 3,
              backdropFilter: "blur(18px)",
              background: "rgba(0,0,0,0.35)",
              color: "#fff",
              borderRadius: 4,
              "&:hover": {
                background: "rgba(0,0,0,0.6)",
                transform: "scale(1.05)",
              },
            }}
          >
            <CloseIcon />
          </IconButton>

<Stack
  direction="row"
  spacing={1}
  sx={{
    position: "absolute",
    bottom: 2,
    left: 2,
    right: 2,
    zIndex: 3,

    p: 0.8,
    borderRadius: 4,

    alignItems: "center",
  }}
>
  {/* LIKE */}
  <Button
    onClick={onLike}
    sx={{
      minWidth: 40,
      height: 44,
      px: 1.6,
      borderRadius: 6,
      fontWeight: 700,
      fontSize: 13,
      backdropFilter: "blur(22px) saturate(0.8) brightness(1.9)",

      background: liked ? "rgba(255, 255, 255, 0.65)" : "rgba(255,255,255,0.12)",
      color: "#fff",

      "&:hover": {
        transform: "scale(1.05)",
      },
      transition: "all .25s ease",
    }}
  >
    {liked ? <FavoriteIcon sx={{ color: liked ? theme.palette.error.main : "#fff" }} /> : <FavoriteBorderIcon />}
  </Button>

  {/* SAVE */}
  <Button
    onClick={onSave}
    startIcon={saved ? <BookmarkIcon /> : <BookmarkBorderIcon />}
    sx={{
      minWidth: 78,
      height: 44,
      px: 1.8,
      borderRadius: 6,
      fontWeight: 700,
      fontSize: 13,

      background: saved
        ? "rgba(255, 234, 0, 0.14)"
        : "rgba(0, 0, 0, 0.17)",
      color: saved ? "#ffffff" :"#fff",
      backdropFilter: "blur(22px) saturate(0.8) brightness(1.9)",

      "&:hover": {
        transform: "scale(1.05)",
      },
      transition: "all .25s ease",
    }}
  >
    {saved ? "Saved" : "Save"}
  </Button>

  {/* PRIMARY CTA */}
  <Button
    onClick={(e) => {
      e.stopPropagation();
      onPlanTrip?.(place);
    }}
    sx={{
      flex: 1,
      height: 48,
      ml: 0.5,
      borderRadius: 6,

      fontWeight: 500,
      fontSize: "0.95rem",
      textTransform: "none",

      background: "#ffffff",
      color: "#000",

      boxShadow: "0 6px 18px rgba(0,0,0,0.25)",

      "&:hover": {
        background: "#f4f4f4",
        transform: "translateY(-1px)",
      },
      transition: "all .25s cubic-bezier(.34,1.56,.64,1)",
    }}
  >
    Plan this Trip
  </Button>
</Stack>

        </Box>

    {/* ─────────────── CONTENT ─────────────── */}
<Box
  sx={{
    p: 3,
    color: theme.palette.text.primary,

    "&::-webkit-scrollbar": { width: 6 },
    "&::-webkit-scrollbar-thumb": {
      borderRadius: 6,
      background: "rgba(0,0,0,0.25)",
    },
  }}
>
  {/* ───────── TITLE ───────── */}
  <Typography fontWeight={900} variant="h6" mb={0.5}>
    {place.name}
  </Typography>

  <Typography opacity={0.65} mb={1}>
    {place.city}, {place.state}
  </Typography>

  <Typography
    variant="caption"
    sx={{
      display: "inline-block",
      px: 1.2,
      py: 0.4,
      borderRadius: 2,
      bgcolor: "rgba(0,0,0,0.06)",
      mb: 2,
      fontWeight: 600,
    }}
  >
    {place.type}
  </Typography>

  <Typography>
    {likesCount}
  </Typography>

  {/* ───────── DESCRIPTION ───────── */}
  <Typography sx={{ mb: 3, lineHeight: 1.7 }}>
    {place.description}
  </Typography>

  {/* ───────── INFO GRID ───────── */}
  <Box
    sx={{
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 2,
      mb: 3,
    }}
  >
    <InfoItem label="Best Time" value={place.bestTimeToVisit} />
    <InfoItem label="Season" value={place.season} />
    <InfoItem label="Weather" value={place.weather} full />
  </Box>


  {/* ───────── NEARBY ATTRACTIONS ───────── */}
  {/* {place.nearestAttractions?.length > 0 && (
    <>
      <Typography fontWeight={800} mb={1}>
        📍 Nearby Attractions
      </Typography>

      <Stack spacing={1.5}>
        {place.nearestAttractions.map((a, i) => (
          <Box
            key={i}
            sx={{
              p: 1.5,
              borderRadius: 3,
              background: "rgba(0,0,0,0.04)",
              display: "flex",
              gap: 1.5,
            }}
          >
            <Box
              sx={{
                width: 56,
                height: 56,
                borderRadius: 2,
                backgroundImage: `url(${a.image})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                flexShrink: 0,
              }}
            />
            <Box>
              <Typography fontWeight={700} fontSize={14}>
                {a.name}
              </Typography>
              <Typography opacity={0.7} fontSize={12}>
                {a.description}
              </Typography>
            </Box>
          </Box>
        ))}
      </Stack>
    </>
  )} */}
</Box>

  </motion.div>
</>

  );
};

export default PlaceDetailsDialog;
