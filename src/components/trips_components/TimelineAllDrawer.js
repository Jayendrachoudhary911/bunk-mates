import React from "react";
import {
  Box, Typography, SwipeableDrawer, List, ListItem, ListItemIcon, ListItemText, Checkbox, Button,
} from "@mui/material";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";

const TimelineAllDrawer = ({
  timelineAllDrawerOpen,
  setTimelineAllDrawerOpen,
  timeline,
  toggleEventCompleted,
  mode,
  userData, // Passed down user document object from Firestore
  onGenerateAiSummary,
}) => {
  // Check if user has "Dev Beta" access based on Firestore schema
  const isDevBeta = userData?.type === "Dev Beta";

  return (
    <SwipeableDrawer
      anchor="bottom"
      open={timelineAllDrawerOpen}
      onClose={() => setTimelineAllDrawerOpen(false)}
      ModalProps={{
        BackdropProps: {
          sx: {
            p: 3,
            backgroundColor: mode === "dark" ? "#0000000d" : "#0000000d",
            backdropFilter: "blur(2px)",
          },
        },
      }}
      PaperProps={{
        sx: {
          p: 3,
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          backgroundColor: mode === "dark" ? "#000000ff" : "#ffffffff",
          boxShadow: "none",
        },
      }}
    >
      {/* Drag indicator */}
      <Box sx={{ width: 40, height: 5, bgcolor: "grey.500", opacity: 0.5, borderRadius: 2.5, mx: "auto", mb: 2, cursor: "grab" }} />

      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Typography variant="h6">Full Trip Timeline</Typography>
        
        {/* Render AI Feature only for Dev Beta users */}
        {isDevBeta && (
          <Button
            size="small"
            variant="outlined"
            startIcon={<AutoAwesomeIcon sx={{ color: "#00E676" }} />}
            onClick={onGenerateAiSummary}
            sx={{
              borderRadius: 8,
              textTransform: "none",
              borderColor: "#00E676",
              color: mode === "dark" ? "#00E676" : "#00A855",
            }}
          >
            ✨ AI Summary
          </Button>
        )}
      </Box>

      {timeline.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center" }}>
          No events added yet.
        </Typography>
      ) : (
        <List sx={{ maxHeight: "80vh", overflowY: "auto" }}>
          {timeline.map((item) => {
            const itemTime = new Date(item.time);
            const isCompleted = item.completed;
            return (
              <ListItem
                key={item.id}
                sx={{
                  backgroundColor: isCompleted
                    ? mode === "dark" ? "#00000011" : "transparent"
                    : mode === "dark" ? "#1c1c1c" : "#f0f0f0ff",
                  borderRadius: 2,
                  mb: 1,
                  px: 2,
                  py: 0.5,
                }}
              >
                <ListItemIcon>
                  <Checkbox checked={isCompleted} onChange={() => toggleEventCompleted(item)} sx={{ color: "#999" }} />
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Typography
                      variant="body1"
                      fontWeight={isCompleted ? "normal" : "medium"}
                      color={isCompleted ? "#888" : "text.primary"}
                      sx={{ textDecoration: isCompleted ? "line-through" : "none" }}
                    >
                      {item.title}
                    </Typography>
                  }
                  secondary={
                    <Typography variant="caption" color="text.secondary">
                      {itemTime.toLocaleString()}
                      {item.note && ` — ${item.note}`}
                    </Typography>
                  }
                />
              </ListItem>
            );
          })}
        </List>
      )}
    </SwipeableDrawer>
  );
};

export default TimelineAllDrawer;