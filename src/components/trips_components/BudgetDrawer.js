import React from "react";
import {
  Box, Typography, Button, TextField, SwipeableDrawer,
} from "@mui/material";

const BudgetDrawer = ({
  budgetDrawerOpen,
  setBudgetDrawerOpen,
  editBudget,
  setEditBudget,
  saveBudget,
  mode,
}) => {
  return (
    <SwipeableDrawer
      anchor="bottom"
      open={budgetDrawerOpen}
      onClose={() => setBudgetDrawerOpen(false)}
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
        Edit Trip Budget
      </Typography>
  
      <TextField
        fullWidth
        label="Total Budget (₹)"
        type="number"
        value={editBudget.total}
        onChange={(e) =>
          setEditBudget({ ...editBudget, total: e.target.value })
        }
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
  
      <Typography variant="subtitle2">Contributors</Typography>
      {editBudget.contributors.map((c, i) => (
        <Box key={i} display="flex" gap={2} mt={1}>
          <TextField
            label="Name"
            value={c.name}
            onChange={(e) => {
              const updated = [...editBudget.contributors];
              updated[i].name = e.target.value;
              setEditBudget({ ...editBudget, contributors: updated });
            }}
            fullWidth
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
          <TextField
            label="Amount"
            type="number"
            value={c.amount}
            onChange={(e) => {
              const updated = [...editBudget.contributors];
              updated[i].amount = e.target.value;
              setEditBudget({ ...editBudget, contributors: updated });
            }}
            sx={{
              bgcolor: (theme) => theme.palette.mode === 'dark' ? '#2a2a2a' : '#fafafa',
              borderRadius: 8,
              boxShadow: "none",
              width: 120,
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
        </Box>
      ))}
  
      <Button
        variant="outlined"
        fullWidth
        sx={{ mt: 2, p: 1, borderRadius: 8, border: mode === "dark" ? "1px solid #ffffffff" : "1px solid #000000ff", color: mode === "dark" ? "#ffffffff" : "#000000ff" }}
        onClick={() => {  
          setEditBudget({
            ...editBudget,
            contributors: [...editBudget.contributors, { name: "", amount: "" }],
          });
        }}
      >
        + Add Contributor
      </Button>
  
      <Button
        fullWidth
        variant="contained"
        sx={{ mt: 3, p: 1.5, borderRadius: 8, backgroundColor: mode === "dark" ? "#ffffffff" : "#000000ff", color: mode === "dark" ? "#000000ff" : "#ffffffff" }}
        onClick={saveBudget}
        disabled={!editBudget.total || editBudget.contributors.length === 0}
      >
        Save Budget
      </Button>
    </SwipeableDrawer>
  );
};

export default BudgetDrawer;