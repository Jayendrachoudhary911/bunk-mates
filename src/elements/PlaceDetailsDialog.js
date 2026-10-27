import React from "react";
import {
  Box,
  Typography,
  Stack,
  Button,
  IconButton,
  useTheme,
  SwipeableDrawer,
} from "@mui/material";
import { 
  Favorite as FavoriteIcon, 
  FavoriteBorder as FavoriteBorderIcon, 
  Bookmark as BookmarkIcon, 
  BookmarkBorder as BookmarkBorderIcon, 
  Close as CloseIcon,
  Share as ShareIcon
} from "../icons";
import { glassIconBtnSx, ctaButtonSx } from "../theme/designSystem";
import UniversalShareToChatDialog from "../components/chats_components/UniversalShareToChatDialog";

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

const PlaceDetailsDialog = ({
  place,
  open,
  onClose,
  liked,
  saved,
  likesCount,
  onLike,
  onSave,
  onPlanTrip,
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const [shareDialogOpen, setShareDialogOpen] = React.useState(false);

  if (!place) return null;

  return (
    <SwipeableDrawer
      anchor="bottom"
      open={open}
      onOpen={() => {}}
      onClose={onClose}
      disableBackdropTransition={false}
      disableDiscovery={false}
      swipeAreaWidth={56}
      sx={{
        zIndex: 1600,
        "& .MuiBackdrop-root": {
          backdropFilter: "blur(20px) saturate(120%)",
          WebkitBackdropFilter: "blur(20px) saturate(120%)",
          background: isDark
            ? "rgba(18, 18, 18, 0)"
            : "rgba(255, 255, 255, 0)",
        },
        "& .MuiDrawer-paper": {
          borderRadius: 8,
          m: 1.5,
          backgroundColor: isDark ? "#0b0b0b01" : "#ffffff07",
          color: theme.palette.text.primary,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          boxShadow: isDark
            ? 'inset 0 1px 1px rgba(255, 255, 255, 0.11), 0 1px 0px rgba(0,0,0,0.1)'
            : 'inset 0 1px 1px rgba(255, 255, 255, 0.11), 0 1px 0px rgba(0,0,0,0.1)',
        },
      }}
    >
      {/* ───────── PULL HANDLE INDICATOR ───────── */}
      <Box
        sx={{
          width: "100%",
          display: "flex",
          justifyContent: "center",
          pt: 1.5,
          pb: 1,
          flexShrink: 0,
          cursor: "grab",
        }}
        onClick={onClose}
      >
        <Box
          sx={{
            width: 44,
            height: 5,
            borderRadius: 3,
            backgroundColor: isDark ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.2)",
          }}
        />
      </Box>

      {/* ───────── SCROLLABLE CONTENT BODY ───────── */}
      <Box
        sx={{
          flexGrow: 1,
          overflowY: "auto",
          px: 2,
          pb: 4,
          "&::-webkit-scrollbar": { width: 6 },
          "&::-webkit-scrollbar-thumb": {
            borderRadius: 6,
            background: isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.15)",
          },
        }}
      >
        {/* ───────── HERO IMAGE & FLOATING ACTIONS ───────── */}
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
            onClick={onClose}
            sx={{
              position: "absolute",
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
            {/* LIKE BUTTON */}
            <Button
              onClick={onLike}
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

            {/* SAVE BUTTON */}
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
                background: saved ? "rgba(255, 234, 0, 0.14)" : "rgba(0, 0, 0, 0.17)",
                color: "#fff",
                backdropFilter: "blur(22px) saturate(0.8) brightness(1.9)",
                "&:hover": { transform: "scale(1.05)" },
                transition: "all .25s ease",
              }}
            >
              {saved ? "Saved" : "Save"}
            </Button>

            {/* SHARE TO CHAT BUTTON */}
            <IconButton
              onClick={(e) => {
                e.stopPropagation();
                setShareDialogOpen(true);
              }}
              sx={{
                p: 1.4,
                borderRadius: "50%",
                background: "rgba(0, 0, 0, 0.2)",
                color: "#fff",
                backdropFilter: "blur(22px) saturate(0.8) brightness(1.9)",
                "&:hover": { transform: "scale(1.08)" },
                transition: "all .25s ease",
              }}
              title="Share Place to Chat"
            >
              <ShareIcon sx={{ fontSize: 18 }} />
            </IconButton>

            {/* PRIMARY PLAN TRIP CTA */}
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

        {/* ───────── PLACE DETAILS INFO ───────── */}
        <Box sx={{ px: 1 }}>
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

          {/* ───────── INFO GRID ───────── */}
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
        </Box>
        {/* Share to Chat & Groups Dialog */}
        <UniversalShareToChatDialog
          open={shareDialogOpen}
          onClose={() => setShareDialogOpen(false)}
          itemType="place"
          itemData={place || {}}
          effectiveChatTheme={isDark ? "dark" : "light"}
        />
      </Box>
    </SwipeableDrawer>
  );
};

export default PlaceDetailsDialog;