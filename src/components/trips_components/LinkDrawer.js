import React from "react";
import {
  Box,
  Typography,
  Button,
  TextField,
  SwipeableDrawer,
  Paper,
  Stack,
  IconButton,
} from "@mui/material";
import AddLinkIcon from "@mui/icons-material/Link";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import YouTubeIcon from "@mui/icons-material/YouTube";
import MapIcon from "@mui/icons-material/Map";
import FolderIcon from "@mui/icons-material/Folder";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import CloseIcon from "@mui/icons-material/Close";
import {
  drawerPaperSx,
  drawerBackdropSx,
  DrawerHandle,
  glassInputSx,
  ctaButtonSx,
  glassIconBtnSx
} from "../../theme/designSystem";

const LinkDrawer = ({
  linkDrawerOpen,
  setLinkDrawerOpen,
  newLink,
  setNewLink,
  handleAddLink,
  mode,
}) => {
  // Helper to detect URL type for live preview
  const getUrlTypeInfo = (urlStr) => {
    if (!urlStr) {
      return {
        label: "General Web Link",
        icon: <InsertDriveFileIcon fontSize="small" color="action" />,
      };
    }
    const lower = urlStr.toLowerCase();
    if (lower.includes("youtube.com") || lower.includes("youtu.be")) {
      return {
        label: "YouTube Video / Stream",
        icon: <YouTubeIcon fontSize="small" sx={{ color: "#ff0000" }} />,
      };
    }
    if (
      lower.includes("maps.google.com") ||
      lower.includes("goo.gl/maps") ||
      lower.includes("maps.app.goo.gl")
    ) {
      return {
        label: "Google Maps Location / Route",
        icon: <MapIcon fontSize="small" sx={{ color: "#4285F4" }} />,
      };
    }
    if (lower.includes("drive.google.com")) {
      return {
        label: "Google Drive File / Folder",
        icon: <FolderIcon fontSize="small" sx={{ color: "#34A853" }} />,
      };
    }
    return {
      label: "External Web Link",
      icon: <OpenInNewIcon fontSize="small" color="primary" />,
    };
  };

  const previewInfo = getUrlTypeInfo(newLink?.url);

  return (
    <SwipeableDrawer
      anchor="bottom"
      open={linkDrawerOpen}
      onClose={() => setLinkDrawerOpen(false)}
      onOpen={() => {}}
      disableSwipeToOpen={false}
      PaperProps={{
        sx: drawerPaperSx(mode, {
          maxHeight: "90vh"
        }),
      }}
      sx={{ "& .MuiBackdrop-root": drawerBackdropSx }}
    >
      {/* Drag handle visible only on mobile/touch screens */}
      <Box sx={{ display: { xs: "block", md: "none" } }}>
        <DrawerHandle mode={mode} />
      </Box>

      <Box
        sx={{
          px: 1.5,
          pb: { xs: 0, md: 4 },
          pt: { xs: 1, md: 3 },
          maxWidth: 600,
          mx: "auto",
          width: "100%",
          boxSizing: "border-box",
        }}
      >
        {/* Header with Responsive Close Button */}
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          mb={3}
        >
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: 2.5,
                display: "grid",
                placeItems: "center",
                bgcolor:
                  mode === "dark"
                    ? "rgba(255,255,255,0.08)"
                    : "rgba(0,0,0,0.04)",
                color: "primary.main",
              }}
            >
              <AddLinkIcon />
            </Box>
            <Box>
              <Typography variant="h6" fontWeight={700} lineHeight={1.2}>
                Add Trip Link
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Attach useful resources, bookings, or maps to your trip
              </Typography>
            </Box>
          </Stack>

          {/* Close Button visible only on desktop screens */}
          <IconButton
            onClick={() => setLinkDrawerOpen(false)}
            size="small"
            sx={glassIconBtnSx(mode, { p: 1, display: { xs: 'none', md: 'flex' } })}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Stack>

        {/* Inputs */}
        <TextField
          fullWidth
          label="Link Title"
          placeholder="e.g. Hotel Booking, Itinerary PDF"
          variant="outlined"
          sx={{ mb: 2.5, ...glassInputSx(mode) }}
          value={newLink?.title || ""}
          onChange={(e) => setNewLink({ ...newLink, title: e.target.value })}
          InputLabelProps={{ shrink: true }}
        />

        <TextField
          fullWidth
          label="Destination URL"
          placeholder="e.g. https://drive.google.com/..."
          variant="outlined"
          value={newLink?.url || ""}
          sx={{ mb: 3, ...glassInputSx(mode) }}
          onChange={(e) => setNewLink({ ...newLink, url: e.target.value })}
          InputLabelProps={{ shrink: true }}
        />

        {/* Live Link Preview Card */}
        {newLink?.url && (
          <Paper
            elevation={0}
            sx={{
              p: 2,
              mb: 3,
              borderRadius: 6,
              border: "0px solid",
              borderColor:
                mode === "dark" ? "rgba(255,255,255,0.08)" : "divider",
              bgcolor:
                mode === "dark"
                  ? "rgba(255,255,255,0.03)"
                  : "rgba(0,0,0,0.015)",
              transition: "all 0.2s ease-in-out",
            }}
          >
            <Typography
              variant="caption"
              color="text.secondary"
              fontWeight={700}
              sx={{
                display: "block",
                mb: 1.5,
                textTransform: "uppercase",
                letterSpacing: 0.8,
                fontSize: "0.7rem",
              }}
            >
              Live Link Preview
            </Typography>
            <Stack direction="row" spacing={2} alignItems="center">
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: 2.5,
                  display: "grid",
                  placeItems: "center",
                  bgcolor:
                    mode === "dark"
                      ? "rgba(255,255,255,0.08)"
                      : "rgba(0,0,0,0.05)",
                  flexShrink: 0,
                  boxShadow:
                    mode === "dark"
                      ? "inset 0 1px 0 rgba(255,255,255,0.1)"
                      : "inset 0 1px 0 rgba(255,255,255,0.6)",
                }}
              >
                {previewInfo.icon}
              </Box>
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography variant="subtitle2" fontWeight={700} noWrap>
                  {newLink?.title?.trim() || "Untitled Link"}
                </Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  noWrap
                  display="block"
                  sx={{ mt: 0.2 }}
                >
                  {previewInfo.label}
                </Typography>
                <Typography
                  variant="caption"
                  color="primary.main"
                  noWrap
                  display="block"
                  sx={{ opacity: 0.85, fontSize: "0.72rem" }}
                >
                  {newLink.url}
                </Typography>
              </Box>
            </Stack>
          </Paper>
        )}

        {/* Action Button */}
        <Button
          variant="contained"
          fullWidth
          startIcon={<AddLinkIcon />}
          sx={ctaButtonSx(mode, "primary", {
            py: 1.5,
            borderRadius: 8,
            fontWeight: 700,
            textTransform: "none",
            fontSize: "0.95rem",
          })}
          onClick={handleAddLink}
          disabled={!newLink?.url?.trim()}
        >
          Add Link to Trip
        </Button>
      </Box>
    </SwipeableDrawer>
  );
};

export default LinkDrawer;