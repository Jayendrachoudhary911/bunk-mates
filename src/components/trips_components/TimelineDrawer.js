import React from "react";
import {
  Box, Typography, Button, TextField, SwipeableDrawer, IconButton,
  CloseOutlinedIcon, FormControlLabel, Checkbox,
} from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";

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
}) => {
  return (
    <SwipeableDrawer
      anchor="bottom"
      open={timelineDrawerOpen}
      onClose={() => {
        setTimelineDrawerOpen(false);
        setTimelineDrafts([]);
        setNewEvent({ title: "", time: "", note: "" });
      }}
      ModalProps={{
        BackdropProps: {
          sx: {
            p: 3,
            backgroundColor: mode === "dark" ? "#0000000d" : "#0000000d",
            backdropFilter: "blur(5px)",
          },
        },
      }}
      PaperProps={{
        sx: {
          p: 3,
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          maxHeight: "70vh",
          overflowY: "auto",
          backgroundColor: mode === "dark" ? "#000000ff" : "#fff",
          boxShadow: "none",
        },
      }}
    >
      <Box
        sx={{
          width: 40,
          height: 5,
          bgcolor: "grey.500",
          opacity: 0.5,
          borderRadius: 2.5,
          mx: "auto",
          mb: 2,
          cursor: "grab",
        }}
      />

      <Typography variant="h6" mb={2}>
        Add Timeline Events
      </Typography>

      <Box sx={{ display: "flex", gap: 1 }}>
        <Button
          variant="contained"
          component="label"
          sx={{
            mb: 2,
            boxShadow: "none",
            color: "text.primary",
            borderRadius: 4,
            backgroundColor: mode === 'dark' ? '#ffffff10' : '#00000010',
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
            backgroundColor: mode === 'dark' ? '#ffffff10' : '#00000010',
          }}
        >
          Add Multiple Events
        </Button>
      </Box>

      {/* Drafted timeline preview */}
      {timelineDrafts.length > 0 && (
        <>
          <Typography variant="subtitle1" gutterBottom>
            Preview & Edit Timeline Events
          </Typography>
          {timelineDrafts.map((item, index) => (
            <Box key={index} display="flex" alignItems="center" mb={1} gap={1}>
              <TextField
                fullWidth
                value={item.title}
                onChange={(e) =>
                  updateTimelineDraft(index, { ...item, title: e.target.value })
                }
                placeholder={`Event ${index + 1} title`}
                variant="outlined"
                size="small"
                sx={{
                  borderRadius: 8,
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 8,
                  },
                }}
              />
              <TextField
                type="datetime-local"
                value={item.time}
                onChange={(e) =>
                  updateTimelineDraft(index, { ...item, time: e.target.value })
                }
                size="small"
                sx={{ width: 200, borderRadius: 8 }}
              />
              <IconButton
                color="error"
                onClick={() => removeTimelineDraft(index)}
                size="small"
              >
                <DeleteOutlineIcon fontSize="small" />
              </IconButton>
            </Box>
          ))}
          <Button
            fullWidth
            variant="contained"
            onClick={addAllTimelineEvents}
            sx={{
              mt: 2,
              borderRadius: 8,
              backgroundColor: mode === "dark" ? "#fff" : "#000",
              color: mode === "dark" ? "#000" : "#fff",
            }}
          >
            Add {timelineDrafts.length} Event(s)
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