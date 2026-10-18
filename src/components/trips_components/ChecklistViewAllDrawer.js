import React from "react";
import {
  Box, Typography, Button, SwipeableDrawer,
  List, ListItem, ListItemIcon, ListItemText, Checkbox, Stack,
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
      PaperProps={{ sx: drawerPaperSx(mode, { maxHeight: "90vh", p: 0 }) }}
      sx={{ "& .MuiBackdrop-root": drawerBackdropSx }}
    >
      <Box sx={{ display: { xs: "block", md: "none" } }}>
        <DrawerHandle mode={mode} />
      </Box>

      <Box sx={{ px: 3,
          pt: { xs: 1, md: 3 }, pb: 2, ...flexBetweenSx }}>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Box>
            <Typography variant="h6" fontWeight={700} lineHeight={1.2}>
              Full Checklist
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {checklist.length} {checklist.length === 1 ? "checklist" : "checklists"}
            </Typography>
          </Box>
        </Stack>

        <Box display="flex" alignItems="center" gap={1}>
          {isDevBeta && (
            <Button
              size="small"
              variant="outlined"
              startIcon={<AutoAwesomeIcon sx={{ color: mode === "dark" ? "#ffffff" : "#000000" }} />}
              onClick={onAiOptimizeChecklist}
              sx={{
                borderRadius: designTokens.radii.chip,
                textTransform: "none",
                fontWeight: 600,
                border: 0,
                color: mode === "dark" ? "#ffffff" : "#000000",
                bgcolor:
                  mode === "dark"
                    ? "rgba(255, 255, 255, 0.06)"
                    : "rgba(1, 1, 1, 0.1)",
              }}
            >
              AI Checklist
            </Button>
          )}

          <Button
            size="small"
            onClick={() => setChecklistViewAllOpen(false)}
            sx={glassIconBtnSx(mode, { p: 1, display: { xs: 'none', md: 'flex' } })}
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