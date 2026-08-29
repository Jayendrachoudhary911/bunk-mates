import React from "react";
import {
  Box, Typography, Button, TextField, SwipeableDrawer, IconButton,
  FormControlLabel, Checkbox,
} from "@mui/material";
import { DeleteOutline as DeleteOutlineIcon, AutoAwesome as AutoAwesomeIcon } from "../../icons";
import {
  drawerPaperSx,
  drawerBackdropSx,
  DrawerHandle,
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
  addAllTimelineEvents,
  updateTimelineDraft,
  removeTimelineDraft,
  handleTimelineFileUpload,
  mode,
  userData, // User document object
  onAiGenerateTimeline,
}) => {
  // Access control check for Dev Beta role
  const isDevBeta = userData?.type === "Dev Beta";

  return (
    <SwipeableDrawer
      anchor="bottom"
      open={timelineDrawerOpen}
      onClose={() => {
        setTimelineDrawerOpen(false);
        setTimelineDrafts([]);
        setNewEvent({ title: "", time: "", note: "" });
      }}
      onOpen={() => {}}
      ModalProps={{
        BackdropProps: {
          sx: drawerBackdropSx,
        },
      }}
      PaperProps={{
        sx: {
          ...drawerPaperSx(mode),
          maxHeight: "75vh",
          overflowY: "auto",
        },
      }}
    >
      <DrawerHandle mode={mode} />

      <Typography variant="h6" mb={2}>
        Add Timeline Events
      </Typography>

      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
        <Button
          variant="contained"
          component="label"
          sx={{
            mb: 2,
            boxShadow: "none",
            color: "text.primary",
            borderRadius: 4,
            backgroundColor: mode === "dark" ? "#ffffff10" : "#00000010",
          }}
        >
          Upload Events
          <input
            type="file"
            accept=".txt,.md,text/plain,text/markdown,text/x-markdown"
            hidden
            onChange={handleTimelineFileUpload}
          />
        </Button>

        <Button
          variant="contained"
          onClick={addEmptyTimelineDraft}
          sx={{
            mb: 2,
            boxShadow: "none",
            color: "text.primary",
            borderRadius: 4,
            backgroundColor: mode === "dark" ? "#ffffff10" : "#00000010",
          }}
        >
          Add Multiple Events
        </Button>

        {/* Dev Beta AI Feature */}
        {isDevBeta && (
          <Button
            variant="outlined"
            onClick={onAiGenerateTimeline}
            startIcon={<AutoAwesomeIcon sx={{ color: "#00E676" }} />}
            sx={{
              mb: 2,
              borderRadius: 4,
              borderColor: "#00E676",
              color: mode === "dark" ? "#00E676" : "#00A855",
              fontWeight: 700,
              textTransform: "none",
            }}
          >
            ✨ AI Auto-Fill Timeline
          </Button>
        )}
      </Box>

      {/* Drafted timeline preview */}
{/* Single input mode */}
{timelineDrafts.length === 0 && (
  <>
    <FormControlLabel
      control={
        <Checkbox
          checked={newEvent.surprise || false}
          onChange={(e) =>
            setNewEvent({ ...newEvent, surprise: e.target.checked })
          }
        />
      }
      label="Mark as Surprise Timeline (hidden from others)"
      sx={{ mb: 2 }}
    />

    {newEvent.surprise && (
      <TextField
        fullWidth
        type="datetime-local"
        label="Auto Reveal Time (optional)"
        value={newEvent.revealAt || ""}
        onChange={(e) =>
          setNewEvent({ ...newEvent, revealAt: e.target.value })
        }
        helperText="Leave blank to reveal manually later"
        sx={{ mb: 2 }}
      />
    )}

    <TextField
      fullWidth
      label="Event Title"
      value={newEvent.title}
      onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
      sx={{ mb: 2 }}
    />
    <TextField
      fullWidth
      type="datetime-local"
      label="Event Time"
      value={newEvent.time}
      onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
      sx={{ mb: 2 }}
    />
    <TextField
      fullWidth
      multiline
      rows={2}
      label="Notes"
      value={newEvent.note}
      onChange={(e) => setNewEvent({ ...newEvent, note: e.target.value })}
      sx={{ mb: 3 }}
    />
    <Button
      fullWidth
      variant="contained"
      onClick={addTimelineEvent}
      disabled={!newEvent.title || !newEvent.time}
      sx={{
        borderRadius: 8,
        backgroundColor: mode === "dark" ? "#fff" : "#000",
        color: mode === "dark" ? "#000" : "#fff",
      }}
    >
      Add Timeline Event
    </Button>
  </>
)}

      <FormControlLabel
        control={
          <Checkbox
            checked={newEvent.surprise || false}
            onChange={(e) =>
              setNewEvent({ ...newEvent, surprise: e.target.checked })
            }
          />
        }
        label="Mark as Surprise Timeline (hidden from others)"
        sx={{ mb: 2 }}
      />

      {newEvent.surprise && (
        <TextField
          fullWidth
          type="datetime-local"
          label="Auto Reveal Time (optional)"
          value={newEvent.revealAt || ""}
          onChange={(e) =>
            setNewEvent({ ...newEvent, revealAt: e.target.value })
          }
          helperText="Leave blank to reveal manually later"
          sx={{ mb: 2 }}
        />
      )}

      {/* Single input mode */}
      {timelineDrafts.length === 0 && (
        <>
          <TextField
            fullWidth
            label="Event Title"
            value={newEvent.title}
            onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            type="datetime-local"
            label="Event Time"
            value={newEvent.time}
            onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            multiline
            rows={2}
            label="Notes"
            value={newEvent.note}
            onChange={(e) => setNewEvent({ ...newEvent, note: e.target.value })}
            sx={{ mb: 3 }}
          />
          <Button
            fullWidth
            variant="contained"
            onClick={addTimelineEvent}
            disabled={!newEvent.title || !newEvent.time}
            sx={{
              borderRadius: 8,
              backgroundColor: mode === "dark" ? "#fff" : "#000",
              color: mode === "dark" ? "#000" : "#fff",
            }}
          >
            Add Timeline Event
          </Button>
        </>
      )}
    </SwipeableDrawer>
  );
};

export default TimelineDrawer;