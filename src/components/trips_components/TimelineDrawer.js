import React from "react";
import {
  Box,
  Typography,
  Button,
  TextField,
  SwipeableDrawer,
  FormControlLabel,
  Checkbox,
  Stack,
  IconButton,
} from "@mui/material";
import { AutoAwesome as AutoAwesomeIcon } from "../../icons";
import CloseIcon from "@mui/icons-material/Close";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import PlaylistAddIcon from "@mui/icons-material/PlaylistAdd";
import {
  drawerPaperSx,
  drawerBackdropSx,
  DrawerHandle,
  glassInputSx,
  ctaButtonSx,
  glassIconBtnSx
} from "../../theme/designSystem";

const TimelineDrawer = ({
  timelineDrawerOpen,
  setTimelineDrawerOpen,
  timelineDrafts,
  setTimelineDrafts,
  newEvent,
  setNewEvent,
  addTimelineEvent,
  addEmptyTimelineDraft,
  handleTimelineFileUpload,
  mode,
  userData, // User document object
  onAiGenerateTimeline,
}) => {

  const handleClose = () => {
    setTimelineDrawerOpen(false);
    setTimelineDrafts([]);
    setNewEvent({ title: "", time: "", note: "", surprise: false, revealAt: "" });
  };

  return (
    <SwipeableDrawer
      anchor="bottom"
      open={timelineDrawerOpen}
      onClose={handleClose}
      onOpen={() => {}}
      disableSwipeToOpen={false}
      ModalProps={{
        BackdropProps: {
          sx: drawerBackdropSx,
        },
      }}
      PaperProps={{
        sx: {
          ...drawerPaperSx(mode, {
            maxHeight: "85vh"
          }),
          overflowY: "auto",
        },
      }}
    >
      {/* Drag handle visible only on mobile/touch screens */}
      <Box sx={{ display: { xs: "block", md: "none" } }}>
        <DrawerHandle mode={mode} />
      </Box>

      <Box
        sx={{
          px: 1,
          pb: { xs: 0, md: 4 },
          pt: { xs: 1, md: 3 },
          maxWidth: 600,
          mx: "auto",
          width: "100%",
          boxSizing: "border-box",
        }}
      >
        {/* Header with Title and Desktop Close Button */}
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          mb={2.5}
        >
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Box>
              <Typography variant="h6" fontWeight={700} lineHeight={1.2}>
                Add Timeline Events
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Schedule activities, bookings, or surprise moments
              </Typography>
            </Box>
          </Stack>

          <IconButton
            onClick={handleClose}
            size="small"
            sx={glassIconBtnSx(mode, { p: 1, display: { xs: 'none', md: 'flex' } })}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Stack>

        {/* Action Buttons Row */}
<Stack direction="row" spacing={1.5} mb={3}>
  {/* Upload Tile */}
  <Button
    variant="contained"
    component="label"
    sx={{
      flex: 1,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      py: 2,
      px: 1,
      boxShadow: "none",
      color: "text.primary",
      borderRadius: 4,
      textTransform: "none",
      fontSize: "0.8rem",
      fontWeight: 600,
      textAlign: "center",
      backgroundColor:
        mode === "dark" ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
      border: "0px solid",
      transition: "all 0.2s ease-in-out",
      "&:hover": {
        backgroundColor:
          mode === "dark" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.07)",
        boxShadow: "none",
        transform: "translateY(-2px)",
      },
      "&:active": {
        transform: "translateY(0)",
      },
    }}
  >
    <Box
      sx={{
        width: 36,
        height: 36,
        borderRadius: 2,
        display: "grid",
        placeItems: "center",
        mb: 1,
        bgcolor:
          mode === "dark" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)",
        color: "text.primary",
      }}
    >
      <UploadFileIcon fontSize="small" />
    </Box>
    Upload Events
    <input
      type="file"
      accept=".txt,.md,text/plain,text/markdown,text/x-markdown"
      hidden
      onChange={handleTimelineFileUpload}
    />
  </Button>

  {/* Add Multiple Tile */}
  <Button
    variant="contained"
    onClick={addEmptyTimelineDraft}
    sx={{
      flex: 1,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      py: 2,
      px: 1,
      boxShadow: "none",
      color: "text.primary",
      borderRadius: 4,
      textTransform: "none",
      fontSize: "0.8rem",
      fontWeight: 600,
      textAlign: "center",
      backgroundColor:
        mode === "dark" ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
      border: "0px solid",
      transition: "all 0.2s ease-in-out",
      "&:hover": {
        backgroundColor:
          mode === "dark" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.07)",
        boxShadow: "none",
        transform: "translateY(-2px)",
      },
      "&:active": {
        transform: "translateY(0)",
      },
    }}
  >
    <Box
      sx={{
        width: 36,
        height: 36,
        borderRadius: 2,
        display: "grid",
        placeItems: "center",
        mb: 1,
        bgcolor:
          mode === "dark" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)",
        color: "text.primary",
      }}
    >
      <PlaylistAddIcon fontSize="small" />
    </Box>
    Add Multiple
  </Button>

  {/* AI Auto-Fill Tile */}
  {onAiGenerateTimeline && (
    <Button
      variant="outlined"
      onClick={onAiGenerateTimeline}
      sx={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        py: 2,
        px: 1,
        borderRadius: 4,
        color: "text.primary",
        fontWeight: 700,
        fontSize: "0.8rem",
        textTransform: "none",
        textAlign: "center",
        border: 0,
        bgcolor:
          mode === "dark" ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
        transition: "all 0.2s ease-in-out",
        "&:hover": {
          bgcolor:
            mode === "dark" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.07)",
          transform: "translateY(-2px)",
        },
        "&:active": {
          transform: "translateY(0)",
        },
      }}
    >
      <Box
        sx={{
          width: 36,
          height: 36,
          borderRadius: 2,
          display: "grid",
          placeItems: "center",
          mb: 1,
        bgcolor:
          mode === "dark" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)",
        }}
      >
        <AutoAwesomeIcon fontSize="small" />
      </Box>
      AI Auto-Fill
    </Button>
  )}
</Stack>

        {/* Multiple Drafts Mode Preview / Editing */}
        {timelineDrafts.length > 0 ? (
<Box
  component="label"
  sx={{
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    p: 2,
    mb: 2.5,
    borderRadius: 3,
    border: "1px solid",
    borderColor: mode === "dark" ? "rgba(255,255,255,0.08)" : "divider",
    bgcolor: mode === "dark" ? "rgba(255,255,255,0.025)" : "rgba(0,0,0,0.015)",
    cursor: "pointer",
    transition: "all 0.2s ease-in-out",
    "&:hover": {
      borderColor: mode === "dark" ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.1)",
    },
  }}
>
  <Box sx={{ pr: 2 }}>
    <Typography variant="body2" fontWeight={700} sx={{ mb: 0.3 }}>
      Mark as Surprise Timeline
    </Typography>
    <Typography variant="caption" color="text.secondary" display="block">
      Hidden from other travelers until revealed
    </Typography>
  </Box>
  <Checkbox
    checked={newEvent.surprise || false}
    onChange={(e) =>
      setNewEvent({ ...newEvent, surprise: e.target.checked })
    }
    color="primary"
    sx={{ p: 0 }}
  />
</Box>
        ) : (
          /* Single Input Mode */
          <>
            <FormControlLabel
              control={
                <Checkbox
                  checked={newEvent.surprise || false}
                  onChange={(e) =>
                    setNewEvent({ ...newEvent, surprise: e.target.checked })
                  }
                  color="primary"
                />
              }
              label={
                <Typography variant="body2" fontWeight={500}>
                  Mark as Surprise Timeline (hidden from others)
                </Typography>
              }
              sx={{ mb: 2 }}
            />

            {newEvent.surprise && (
              <TextField
                fullWidth
                type="datetime-local"
                label="Auto Reveal Time (optional)"
                InputLabelProps={{ shrink: true }}
                value={newEvent.revealAt || ""}
                onChange={(e) =>
                  setNewEvent({ ...newEvent, revealAt: e.target.value })
                }
                helperText="Leave blank to reveal manually later"
                sx={{ mb: 2.5, ...glassInputSx(mode) }}
              />
            )}

            <TextField
              fullWidth
              label="Event Title"
              placeholder="e.g. Sunset Dinner at Beach"
              variant="outlined"
              value={newEvent.title || ""}
              onChange={(e) =>
                setNewEvent({ ...newEvent, title: e.target.value })
              }
              sx={{ mb: 2.5, ...glassInputSx(mode) }}
              InputLabelProps={{ shrink: true }}
            />

            <TextField
              fullWidth
              type="datetime-local"
              label="Event Time"
              InputLabelProps={{ shrink: true }}
              value={newEvent.time || ""}
              onChange={(e) =>
                setNewEvent({ ...newEvent, time: e.target.value })
              }
              sx={{ mb: 2.5, ...glassInputSx(mode) }}
            />

            <TextField
              fullWidth
              multiline
              rows={2}
              label="Notes"
              placeholder="Add details, confirmation numbers, or addresses..."
              value={newEvent.note || ""}
              onChange={(e) =>
                setNewEvent({ ...newEvent, note: e.target.value })
              }
              sx={{ mb: 3, ...glassInputSx(mode) }}
              InputLabelProps={{ shrink: true }}
            />

            <Button
              variant="contained"
              fullWidth
              onClick={addTimelineEvent}
              disabled={!newEvent.title || !newEvent.time}
              sx={ctaButtonSx(mode, "primary", {
                py: 1.5,
                borderRadius: 8,
                fontWeight: 700,
                textTransform: "none",
                fontSize: "0.95rem",
              })}
            >
              Add Timeline Event
            </Button>
          </>
        )}
      </Box>
    </SwipeableDrawer>
  );
};

export default TimelineDrawer;