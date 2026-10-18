import React from "react";
import {
  Box,
  Typography,
  Button,
  TextField,
  SwipeableDrawer,
  Stack,
  IconButton,
  Paper,
} from "@mui/material";
import { DeleteOutline, AutoAwesome } from "../../icons";
import CloseIcon from "@mui/icons-material/Close";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import PlaylistAddIcon from "@mui/icons-material/PlaylistAdd";
import ChecklistIcon from "@mui/icons-material/Checklist";
import {
  drawerPaperSx,
  drawerBackdropSx,
  DrawerHandle,
  glassInputSx,
  ctaButtonSx,
  glassIconBtnSx
} from "../../theme/designSystem";

const ChecklistDrawer = ({
  checklistDrawerOpen,
  setChecklistDrawerOpen,
  checklistDrafts,
  setChecklistDrafts,
  newTask,
  setNewTask,
  uploadingBatch,
  addTask,
  addAllChecklistItems,
  addEmptyChecklistDraft,
  updateChecklistDraft,
  removeChecklistDraft,
  handleChecklistFileUpload,
  mode,
  userData, // User object
  onAiGenerateChecklist,
}) => {
  
  const handleClose = () => {
    setChecklistDrawerOpen(false);
    setChecklistDrafts([]);
    setNewTask("");
  };

  return (
    <SwipeableDrawer
      anchor="bottom"
      open={checklistDrawerOpen}
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
          px: 1.5,
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
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: 2.5,
                display: "grid",
                placeItems: "center",
                bgcolor:
                  mode === "dark"
                    ? "rgba(255,255,255,0.08)"
                    : "rgba(0,0,0,0.04)",
                color: "primary.main",
              }}
            >
              <ChecklistIcon />
            </Box>
            <Box>
              <Typography variant="h6" fontWeight={700} lineHeight={1.2}>
                Add Checklist Items
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Manage your packing lists, gear, or to-dos
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

        {/* Action Tiles Row */}
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
            Upload List
            <input
              type="file"
              accept=".txt,.md,text/plain,text/markdown,text/x-markdown"
              hidden
              onChange={handleChecklistFileUpload}
            />
          </Button>

          {/* Add Multiple Tile */}
          <Button
            variant="contained"
            onClick={addEmptyChecklistDraft}
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

          {/* AI Packing List Tile */}
          {onAiGenerateChecklist && (
            <Button
              variant="outlined"
              onClick={onAiGenerateChecklist}
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
                <AutoAwesome fontSize="small" />
              </Box>
              AI Packing List
            </Button>
          )}
        </Stack>

        {/* Multi-Drafts Preview Mode */}
        {checklistDrafts.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" fontWeight={700} gutterBottom sx={{ mb: 1.5 }}>
              Preview & Edit Items to Add ({checklistDrafts.length})
            </Typography>
            <Stack spacing={1.5} mb={2}>
              {checklistDrafts.map((item, index) => (
                <Paper
                  key={index}
                  elevation={0}
                  sx={{
                    p: 1.5,
                    borderRadius: 6,
                    border: "0px solid",
                    borderColor:
                      mode === "dark" ? "rgba(255,255,255,0.08)" : "divider",
                    bgcolor:
                      mode === "dark"
                        ? "rgba(255,255,255,0.02)"
                        : "rgba(0,0,0,0.01)",
                    display: "flex",
                    alignItems: "center",
                    gap: 1.5,
                  }}
                >
                  <TextField
                    fullWidth
                    value={item}
                    onChange={(e) => updateChecklistDraft(index, e.target.value)}
                    placeholder={`Item ${index + 1}`}
                    variant="outlined"
                    size="small"
                    sx={glassInputSx(mode)}
                  />

                  <IconButton
                    size="small"
                    onClick={() => removeChecklistDraft(index)}
                    sx={{
                      color: "error.main",
                      p: 1,
                      bgcolor:
                        mode === "dark"
                          ? "rgba(255, 82, 82, 0.08)"
                          : "rgba(211, 47, 47, 0.06)",
                      "&:hover": {
                        bgcolor:
                          mode === "dark"
                            ? "rgba(255, 82, 82, 0.15)"
                            : "rgba(211, 47, 47, 0.12)",
                      },
                    }}
                  >
                    <DeleteOutline fontSize="medium" />
                  </IconButton>
                </Paper>
              ))}
            </Stack>

            <Button
              variant="outlined"
              fullWidth
              onClick={addEmptyChecklistDraft}
              sx={{
                mb: 2,
                borderRadius: 8,
                textTransform: "none",
                fontWeight: 600,
                background: mode === "dark" ? "#f1f1f111" : "#0c0c0c10",
                borderColor: mode === "dark" ? "rgba(255,255,255,0.15)" : "divider",
                color: "text.primary",
              }}
            >
              + Add Another Item
            </Button>

            <Button
              variant="contained"
              fullWidth
              onClick={addAllChecklistItems}
              disabled={uploadingBatch || checklistDrafts.length === 0}
              sx={ctaButtonSx(mode, "primary", {
                py: 1.5,
                borderRadius: 3,
                fontWeight: 700,
                textTransform: "none",
                fontSize: "0.95rem",
              })}
            >
              {uploadingBatch ? "Adding Items..." : `Save All ${checklistDrafts.length} Items`}
            </Button>
          </Box>
        )}

        {/* Single Input Mode */}
        {checklistDrafts.length === 0 && (
          <>
            <TextField
              fullWidth
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              label="New Checklist Item"
              placeholder="e.g. Passport, Charger, Sunscreen"
              variant="outlined"
              size="small"
              InputLabelProps={{ shrink: true }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && newTask.trim()) {
                  setChecklistDrafts([newTask.trim()]);
                  setNewTask("");
                }
              }}
              sx={{
                mb: 3,
                ...glassInputSx(mode),
              }}
            />

            <Button
              variant="contained"
              fullWidth
              onClick={addTask}
              disabled={!newTask.trim()}
              sx={ctaButtonSx(mode, "primary", {
                py: 1.5,
                borderRadius: 8,
                fontWeight: 700,
                textTransform: "none",
                fontSize: "0.95rem",
              })}
            >
              Add Checklist Item
            </Button>
          </>
        )}
      </Box>
    </SwipeableDrawer>
  );
};

export default ChecklistDrawer; 