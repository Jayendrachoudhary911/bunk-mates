import React from "react";
import {
  Box, Typography, Button, TextField, SwipeableDrawer, IconButton,
} from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";

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
}) => {
  return (
    <SwipeableDrawer
      anchor="bottom"
      open={checklistDrawerOpen}
      onClose={() => {
        setChecklistDrawerOpen(false);
        setChecklistDrafts([]);
        setNewTask("");
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
          boxShadow: "none"
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
        Add Checklist Items
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
            backgroundColor: mode === 'dark' ? '#ffffff10' : '#00000010'
          }}
        >
          Upload Checklist
          <input
            type="file"
            accept=".txt,.md,text/plain,text/markdown,text/x-markdown"
            hidden
            onChange={handleChecklistFileUpload}
          />
        </Button>

        <Button
          variant="contained"
          component="label"
          sx={{
            mb: 2,
            boxShadow: "none",
            color: "text.primary",
            borderRadius: 4,
            backgroundColor: mode === 'dark' ? '#ffffff10' : '#00000010'
            }}
            onClick={addEmptyChecklistDraft}
          >
              Add Multiple Checklists
          </Button>
        </Box>

        {checklistDrafts.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Preview & Edit Items to Add
            </Typography>
            {checklistDrafts.map((item, index) => (
<Box
  key={index}
  display="flex"
  alignItems="center"
  mb={1}
  gap={1}
  sx={{
    '& .MuiTextField-root': {
      bgcolor: (theme) => theme.palette.mode === 'dark' ? '#2c2c2c' : '#fff',
      borderRadius: 1,
    },
    '& .MuiButton-root': {
      minWidth: 90,
      height: 36,
      textTransform: 'none',
    },
  }}
>
<TextField
  fullWidth
  value={item}
  onChange={(e) => updateChecklistDraft(index, e.target.value)}
  placeholder={`Item ${index + 1}`}
  variant="outlined"
  size="small"
  sx={{
    bgcolor: (theme) => theme.palette.mode === 'dark' ? '#2a2a2a' : '#fafafa',
    borderRadius: 8,
    boxShadow: "none",
    '& .MuiInputLabel-root.Mui-focused': {
      color: mode === "dark" ? "#fff" : "#000",
    },
    '& .MuiOutlinedInput-root': {
      borderRadius: 8,
      '& fieldset': {
        borderColor: (theme) => (theme.palette.mode === 'dark' ? '#555' : '#c1c1c1ff'),
      },
      '&:hover fieldset': {
        borderColor: (theme) => (theme.palette.mode === 'dark' ? '#bbb' : '#aaa'),
      },
      '&.Mui-focused fieldset': {
        borderColor: (theme) => mode === 'dark' ? '#ffffffff' : '#000000ff',
        boxShadow: "none",
        color: mode === "dark" ? "#fff" : "#000"
      },
      backgroundColor: 'inherit',
    },
    input: {
      color: (theme) => (theme.palette.mode === 'dark' ? '#eee' : '#222'),
    },
    label: {
      color: (theme) => (theme.palette.mode === 'dark' ? '#bbb' : '#666'),
    },
  }}
/>


<Button
  variant="outlined"
  color="error"
  onClick={() => removeChecklistDraft(index)}
  sx={{
    maxWidth: 16,
    height: 36,
    padding: 0,
    textTransform: 'none',
    alignSelf: 'flex-start',
    borderRadius: 8,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    '&:hover': {
      backgroundColor: (theme) =>
        theme.palette.mode === 'dark' ? '#a32e2e33' : '#f4433622',
    },
  }}
  aria-label={`Remove item ${index + 1}`}
>
  <DeleteOutlineIcon fontSize="small" />
</Button>

</Box>

            ))}
       <Box sx={{ mb: 2 }}>
          <Button variant="contained" component="label" sx={{ mb: 2, boxShadow: "none", color: "text.primary", borderRadius: 8, backgroundColor: mode === 'dark' ? '#ffffff10' : '#00000010', }} onClick={addEmptyChecklistDraft}>
            + Add More Items
          </Button>
        </Box>
          </Box>
        )}



        {/* If no drafts, show single input */}
        {checklistDrafts.length === 0 && (
          <>
            <TextField
              fullWidth
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              label="New Checklist Item"
              variant="outlined"
              size="small"
              onKeyDown={(e) => {
                if (e.key === "Enter" && newTask.trim()) {
                  setChecklistDrafts([newTask.trim()]);
                  setNewTask("");
                }
              }}
              sx={{
                bgcolor: (theme) => theme.palette.mode === 'dark' ? '#2a2a2a' : '#fafafa',
                borderRadius: 8,
                mb: 3,
                mt: 1,
                boxShadow: "none",
                '& .MuiInputLabel-root.Mui-focused': {
                  color: mode === "dark" ? "#fff" : "#000",
                },
                '& .MuiOutlinedInput-root': {
                  borderRadius: 8,
                  '& fieldset': {
                    borderColor: (theme) => (theme.palette.mode === 'dark' ? '#555' : '#c1c1c1ff'),
                  },
                  '&:hover fieldset': {
                    borderColor: (theme) => (theme.palette.mode === 'dark' ? '#bbb' : '#aaa'),
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: (theme) => mode === 'dark' ? '#ffffffff' : '#000000ff',
                    boxShadow: "none",
                    color: mode === "dark" ? "#fff" : "#000"
                  },
                  backgroundColor: 'inherit',
                },
                input: {
                  color: (theme) => (theme.palette.mode === 'dark' ? '#eee' : '#222'),
                },
                label: {
                  color: (theme) => (theme.palette.mode === 'dark' ? '#bbb' : '#666'),
                },
              }}
            />

            <Button
              variant="contained"
              fullWidth
              onClick={addTask}
              disabled={!newTask.trim()}
              sx={{
                mb: 1,
                backgroundColor: mode === "dark" ? "#fff" : "#000",
                borderRadius: 8,
                color: mode === "dark" ? "#000" : "#fff"
              }}
            >
              Add Checklist Item
            </Button>
          </>
        )}

        {checklistDrafts.length > 0 && (
          <Button
            variant="contained"
            fullWidth
            onClick={addAllChecklistItems}
            disabled={uploadingBatch}
            sx={{
              backgroundColor: mode === "dark" ? "#fff" : "#000",
              borderRadius: 8,
              color: mode === "dark" ? "#000" : "#fff"
            }}
          >
            {uploadingBatch ? "Adding..." : "Add Checklist Item(s)"}
          </Button>
        )}
      </SwipeableDrawer>
  );
};

export default ChecklistDrawer;