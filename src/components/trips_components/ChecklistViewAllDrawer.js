import React from "react";
import {
  Box, Typography, Button, SwipeableDrawer, IconButton,
  List, ListItem, ListItemIcon, ListItemText, Checkbox,
} from "@mui/material";
import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";

const ChecklistViewAllDrawer = ({
  checklistViewAllOpen,
  setChecklistViewAllOpen,
  checklist,
  toggleTask,
  mode,
}) => {
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
      {/* Drag indicator */}
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
      {/* Header row */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
        <Typography variant="h6" fontWeight={"bolder"}>Full Checklist</Typography>
        <Button
          size="small"
          onClick={() => setChecklistViewAllOpen(false)}
          sx={{
            padding: 1,
            borderRadius: 4,
            color: (theme) => theme.palette.text.primary,
            '&:hover': {
              backgroundColor: mode === "dark" ? "#000" : "#fff",
            },
          }}
          aria-label="Close checklist view"
        >
          <CloseOutlinedIcon fontSize="small" />
        </Button>
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
        ? (mode === "dark" ? "#00000011" : "transparent")
        : (mode === "dark" ? "#f1f1f111" : "#0000000d"),
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
        inputProps={{ 'aria-label': 'Toggle checklist item' }}
      />
    </ListItemIcon>
    <ListItemText
      primary={task.text}
      primaryTypographyProps={{
        sx: {
          textDecoration: task.completed ? "line-through" : "none",
          color: task.completed ? "#888" : "inherit",
          userSelect: "text",
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