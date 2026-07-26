import React from "react";
import {
  Box, Typography, Button, SwipeableDrawer,
  List, ListItem, ListItemIcon, ListItemText, Checkbox,
} from "@mui/material";
import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";

const ChecklistViewAllDrawer = ({
  checklistViewAllOpen,
  setChecklistViewAllOpen,
  checklist,
  toggleTask,
  mode,
  userData, // User object
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
      ModalProps={{
        BackdropProps: {
          sx: {
            p: 3,
            backgroundColor: mode === "dark" ? "#0000000d" : "#0000000d",
            backdropFilter: "blur(2px)",
          },
        },
      }}
      sx={{
        "& .MuiDrawer-paper": {
          background: mode === "dark" ? "#000000ff" : "#ffffffff",
          backdropFilter: "blur(14px)",
          borderTopRightRadius: 16,
          borderTopLeftRadius: 16,
          p: 3,
          boxShadow: "none",
          border: "none",
        },
      }}
    >
      <Box sx={{ px: 0, pt: 0, pb: 2 }}>
        <Box
          sx={{
            width: 40,
            height: 5,
            bgcolor: "grey.500",
            opacity: 0.5,
            borderRadius: 2.5,
            mx: "auto",
            mb: 1,
            cursor: "grab",
          }}
        />
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
          <Typography variant="h6" fontWeight={"bolder"}>
            Full Checklist
          </Typography>

          <Box display="flex" alignItems="center" gap={1}>
            {/* AI Action button shown only for Dev Beta users */}
            {isDevBeta && (
              <Button
                size="small"
                variant="outlined"
                startIcon={<AutoAwesomeIcon sx={{ color: "#00E676" }} />}
                onClick={onAiOptimizeChecklist}
                sx={{
                  borderRadius: 8,
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
              sx={{
                padding: 1,
                borderRadius: 4,
                color: (theme) => theme.palette.text.primary,
              }}
              aria-label="Close checklist view"
            >
              <CloseOutlinedIcon fontSize="small" />
            </Button>
          </Box>
        </Box>
      </Box>

      <List sx={{ maxHeight: "80vh", overflowY: "auto" }}>
        {checklist.map((task) => (
          <ListItem
            key={task.id}
            onClick={() => toggleTask(task)}
            disableGutters
            sx={{
              backgroundColor: task.completed
                ? mode === "dark" ? "#00000011" : "transparent"
                : mode === "dark" ? "#f1f1f111" : "#0000000d",
              mb: 0.5,
              borderRadius: 2,
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