import React from "react";
import {
  Box, Typography, Button, SwipeableDrawer,
  List, ListItem, ListItemIcon, ListItemText, Checkbox,
} from "@mui/material";
import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import {
  drawerPaperSx,
  drawerBackdropSx,
  DrawerHandle,
  glassItemSx,
  glassIconBtnSx,
  flexBetweenSx,
  designTokens,
} from "../../theme/designSystem";

const ChecklistViewAllDrawer = ({
  checklistViewAllOpen,
  setChecklistViewAllOpen,
  checklist,
  toggleTask,
  mode,
  userData,
  onAiOptimizeChecklist,
}) => {
  const isDevBeta = userData?.type === "Dev Beta";

  return (
    <SwipeableDrawer
      fullWidth
      anchor="bottom"
      open={checklistViewAllOpen}
      onClose={() => setChecklistViewAllOpen(false)}
      onOpen={() => setChecklistViewAllOpen(true)}
      PaperProps={{ sx: drawerPaperSx(mode, { maxHeight: "90vh", p: 0, m: 0, borderRadius: "22px 22px 0 0" }) }}
      sx={{ "& .MuiBackdrop-root": drawerBackdropSx }}
    >
      <DrawerHandle mode={mode} />

      <Box sx={{ px: 3, pb: 2, ...flexBetweenSx }}>
        <Typography variant="h6" fontWeight={700}>Full Checklist</Typography>

        <Box display="flex" alignItems="center" gap={1}>
          {isDevBeta && (
            <Button
              size="small"
              variant="outlined"
              startIcon={<AutoAwesomeIcon sx={{ color: "#00E676" }} />}
              onClick={onAiOptimizeChecklist}
              sx={{
                borderRadius: designTokens.radii.chip,
                textTransform: "none",
                fontWeight: 700,
                borderColor: "#00E676",
                color: mode === "dark" ? "#00E676" : "#00A855",
              }}
            >
              ✨ AI Re-organize
            </Button>
          )}

          <Button
            size="small"
            onClick={() => setChecklistViewAllOpen(false)}
            sx={glassIconBtnSx(mode, { p: 1 })}
            aria-label="Close checklist view"
          >
            <CloseOutlinedIcon fontSize="small" />
          </Button>
        </Box>
      </Box>

      <List sx={{ maxHeight: "80vh", overflowY: "auto", px: 2, pb: 3, "&::-webkit-scrollbar": { display: "none" } }}>
        {checklist.map((task) => (
          <ListItem
            key={task.id}
            onClick={() => toggleTask(task)}
            disableGutters
            sx={{
              ...glassItemSx(mode),
              mb: 0.5,
              opacity: task.completed ? 0.6 : 1,
            }}
          >
            <ListItemIcon>
              <Checkbox
                checked={task.completed}
                onChange={() => toggleTask(task)}
                color="success"
                sx={{ color: task.completed ? undefined : "#999" }}
              />
            </ListItemIcon>
            <ListItemText
              primary={task.text}
              primaryTypographyProps={{
                sx: {
                  textDecoration: task.completed ? "line-through" : "none",
                  color: task.completed ? "#888" : "inherit",
                },
              }}
            />
          </ListItem>
        ))}

        {checklist.length === 0 && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2, textAlign: "center" }}>
            No checklist items yet.
          </Typography>
        )}
      </List>
    </SwipeableDrawer>
  );
};

export default ChecklistViewAllDrawer;