import React from "react";
import {
  Box,
  Typography,
  Button,
  TextField,
  SwipeableDrawer,
  Paper,
  Stack,
} from "@mui/material";
import AddLinkIcon from "@mui/icons-material/Link";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import YouTubeIcon from "@mui/icons-material/YouTube";
import MapIcon from "@mui/icons-material/Map";
import FolderIcon from "@mui/icons-material/Folder";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import {
  drawerPaperSx,
  drawerBackdropSx,
  DrawerHandle,
  glassInputSx,
  ctaButtonSx,
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
    if (!urlStr) return { label: "General Web Link", icon: <InsertDriveFileIcon fontSize="small" color="action" /> };
    const lower = urlStr.toLowerCase();
    if (lower.includes("youtube.com") || lower.includes("youtu.be")) {
      return { label: "YouTube Video / Stream", icon: <YouTubeIcon fontSize="small" sx={{ color: "#ff0000" }} /> };
    }
    if (lower.includes("maps.google.com") || lower.includes("goo.gl/maps") || lower.includes("maps.app.goo.gl")) {
      return { label: "Google Maps Location / Route", icon: <MapIcon fontSize="small" sx={{ color: "#4285F4" }} /> };
    }
    if (lower.includes("drive.google.com")) {
      return { label: "Google Drive File / Folder", icon: <FolderIcon fontSize="small" sx={{ color: "#34A853" }} /> };
    }
    return { label: "External Web Link", icon: <OpenInNewIcon fontSize="small" color="primary" /> };
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
        sx: drawerPaperSx(mode, { maxHeight: "90vh", borderRadius: "22px 22px 0 0" }),
      }}
      sx={{ "& .MuiBackdrop-root": drawerBackdropSx }}
    >
      <DrawerHandle mode={mode} />

      <Box sx={{ px: 3, pb: 4, pt: 1, maxWidth: 600, mx: "auto", width: "100%", boxSizing: "border-box" }}>
        <Typography variant="h6" fontWeight={700} mb={2.5}>
          Add Trip Link
        </Typography>

        <TextField
          fullWidth
          label="Link Title (e.g. Hotel Booking, Itinerary PDF)"
          variant="outlined"
          sx={{ mb: 2.5, ...glassInputSx(mode) }}
          value={newLink?.title || ""}
          onChange={(e) => setNewLink({ ...newLink, title: e.target.value })}
        />

        <TextField
          fullWidth
          label="Paste Link (e.g. Google Drive, YouTube, Maps)"
          variant="outlined"
          value={newLink?.url || ""}
          sx={{ mb: 3, ...glassInputSx(mode) }}
          onChange={(e) => setNewLink({ ...newLink, url: e.target.value })}
        />

        {/* Live Link Preview Card */}
        {newLink?.url && (
          <Paper
            elevation={0}
            sx={{
              p: 2,
              mb: 3,
              borderRadius: 3,
              border: "1px solid",
              borderColor: "divider",
              bgcolor: mode === "dark" ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)",
            }}
          >
            <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ display: "block", mb: 1, textTransform: "uppercase", letterSpacing: 0.5 }}>
              Live Link Preview
            </Typography>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Box
                sx={{
                  width: 38,
                  height: 38,
                  borderRadius: 2,
                  display: "grid",
                  placeItems: "center",
                  bgcolor: mode === "dark" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)",
                  flexShrink: 0,
                }}
              >
                {previewInfo.icon}
              </Box>
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography variant="subtitle2" fontWeight={700} noWrap>
                  {newLink?.title?.trim() || "Untitled Link"}
                </Typography>
                <Typography variant="caption" color="text.secondary" noWrap display="block">
                  {previewInfo.label} • {newLink.url}
                </Typography>
              </Box>
            </Stack>
          </Paper>
        )}

        <Button
          variant="contained"
          fullWidth
          startIcon={<AddLinkIcon />}
          sx={ctaButtonSx(mode, "primary", { py: 1.4, borderRadius: 3 })}
          onClick={handleAddLink}
        >
          Add Link to Trip
        </Button>
      </Box>
    </SwipeableDrawer>
  );
};

export default LinkDrawer;