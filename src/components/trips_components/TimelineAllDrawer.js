import React from "react";
import {
  Box, Typography, SwipeableDrawer, List, ListItem, ListItemIcon, ListItemText, Checkbox, Button,
} from "@mui/material";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import {
  drawerPaperSx,
  drawerBackdropSx,
  DrawerHandle,
  glassItemSx,
  ctaButtonSx,
  flexBetweenSx,
  designTokens,
} from "../../theme/designSystem";

const TimelineAllDrawer = ({
  timelineAllDrawerOpen,
  setTimelineAllDrawerOpen,
  timeline,
  toggleEventCompleted,
  mode,
  userData,
  onGenerateAiSummary,
}) => {
  const isDevBeta = userData?.type === "Dev Beta";

  return (
    <SwipeableDrawer
      anchor="bottom"
      open={timelineAllDrawerOpen}
      onClose={() => setTimelineAllDrawerOpen(false)}
      PaperProps={{ sx: drawerPaperSx(mode, { maxHeight: "90vh", p: 0, m: 0, borderRadius: "22px 22px 0 0" }) }}
      sx={{ "& .MuiBackdrop-root": drawerBackdropSx }}
    >
      <DrawerHandle mode={mode} />

      <Box sx={{ px: 3, pb: 2, ...flexBetweenSx }}>
        <Typography variant="h6" fontWeight={700}>Full Trip Timeline</Typography>

        {isDevBeta && (
          <Button
            size="small"
            variant="outlined"
            startIcon={<AutoAwesomeIcon sx={{ color: "#00E676" }} />}
            onClick={onGenerateAiSummary}
            sx={{
              borderRadius: designTokens.radii.chip,
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
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center", px: 3, pb: 3 }}>
          No events added yet.
        </Typography>
      ) : (
        <List sx={{ maxHeight: "80vh", overflowY: "auto", px: 2, pb: 3, "&::-webkit-scrollbar": { display: "none" } }}>
          {timeline.map((item) => {
            const itemTime = new Date(item.time);
            const isCompleted = item.completed;
            return (
              <ListItem
                key={item.id}
                sx={{
                  ...glassItemSx(mode),
                  mb: 1,
                  opacity: isCompleted ? 0.6 : 1,
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