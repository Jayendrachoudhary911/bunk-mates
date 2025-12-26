import React from "react";
import {
  Box, Typography, Button, TextField, SwipeableDrawer, IconButton,
  CloseOutlinedIcon, FormControlLabel, Checkbox, Collapse, Avatar,
} from "@mui/material";
import { motion } from "framer-motion";

const ExpenseDrawer = ({
  expenseDrawerOpen,
  setExpenseDrawerOpen,
  newExpense,
  setNewExpense,
  expenseContributors,
  setExpenseContributors,
  memberDetails,
  currentUseruid,
  getMemberName,
  initializeExpenseContributors,
  addExpense,
  updateExpense,
  editingExpense,
  mode,
  theme,
}) => {
  return (
    <SwipeableDrawer
      anchor="bottom"
      open={expenseDrawerOpen}
      onClose={() => setExpenseDrawerOpen(false)}
      onOpen={() => {}}
      disableBackdropTransition={false}
      ModalProps={{
        BackdropProps: {
          sx: {
            backgroundColor: "rgba(0,0,0,0.2)",
            backdropFilter: "blur(4px)",
          },
        },
      }}
      PaperProps={{
        sx: {
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          background: mode === "dark"
            ? "rgba(20,20,20,0.9)"
            : "rgba(255,255,255,0.9)",
          backdropFilter: "blur(16px)",
          boxShadow: mode === "dark"
            ? "0px -6px 20px rgba(0,0,0,0.5)"
            : "0px -6px 20px rgba(0,0,0,0.1)",
          p: 3,
          maxHeight: "85vh",
          overflowY: "auto",
          transition: "all 0.3s ease-in-out",
        },
      }}
    >
      {/* Drag Handle */}
      <Box
        sx={{
          width: 40,
          height: 5,
          bgcolor: "grey.500",
          opacity: 0.5,
          borderRadius: 2.5,
          mx: "auto",
          mb: 2,
        }}
      />

      {/* Header */}
      <Typography
        variant="h6"
        fontWeight="bold"
        textAlign="center"
        sx={{
          mb: 2.5,
          color: mode === "dark" ? "#fff" : "#000",
          letterSpacing: 0.5,
        }}
      >
        Add New Expense
      </Typography>

      {/* Expense Fields Section */}
      <Box
        component={motion.div}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Expense Name */}
        <TextField
          fullWidth
          label="Expense Name"
          value={newExpense.name}
          onChange={(e) =>
            setNewExpense((prev) => ({ ...prev, name: e.target.value }))
          }
          sx={{
            mb: 2,
            borderRadius: 3,
            "& .MuiOutlinedInput-root": {
              borderRadius: 3,
              backgroundColor: mode === "dark" ? "#1e1e1e" : "#fafafa",
              "&:hover fieldset": { borderColor: "#888" },
              "&.Mui-focused fieldset": { borderColor: mode === "dark" ? "#fff" : "#000" },
            },
          }}
        />

        {/* Split Mode Button */}
        <Button
          fullWidth
          variant="outlined"
          onClick={() => {
            const newMode =
              newExpense.splitMode === "single_payer"
                ? "multiple_payers"
                : "single_payer";
            setNewExpense((prev) => ({ ...prev, splitMode: newMode }));
            setExpenseContributors(
              initializeExpenseContributors(memberDetails, newMode)
            );
          }}
          sx={{
            borderRadius: 3,
            py: 1.5,
            mb: 2,
            textTransform: "none",
            borderColor: theme.palette.divider,
            color: theme.palette.text.primary,
            backgroundColor:
              newExpense.splitMode === "multiple_payers"
                ? (mode === "dark" ? "#ffffff10" : "#00000008")
                : "transparent",
            transition: "all 0.2s ease",
            "&:hover": {
              backgroundColor: mode === "dark" ? "#ffffff15" : "#00000010",
              transform: "translateY(-2px)",
            },
          }}
        >
          {newExpense.splitMode === "single_payer"
            ? "Switch to Multiple Contributors"
            : `Multiple Payers Mode (Total ₹${parseFloat(
                newExpense.amount || 0
              ).toFixed(2)})`}
        </Button>

        {/* Conditional payer inputs */}
        {newExpense.splitMode === "single_payer" && (
          <TextField
            select
            fullWidth
            label="Paid By"
            value={newExpense.paidBy || currentUseruid}
            onChange={(e) =>
              setNewExpense((prev) => ({ ...prev, paidBy: e.target.value }))
            }
            SelectProps={{ native: true }}
            sx={{
              mb: 2,
              borderRadius: 3,
              "& .MuiOutlinedInput-root": {
                borderRadius: 3,
                backgroundColor: mode === "dark" ? "#1e1e1e" : "#fafafa",
              },
            }}
          >
            {memberDetails.map((member) => (
              <option key={member.uid} value={member.uid}>
                {getMemberName(member.uid)}
              </option>
            ))}
          </TextField>
        )}

        {newExpense.splitMode === "multiple_payers" && (
          <Collapse in={true}>
            <Box
              sx={{
                mb: 2,
                p: 1,
                borderRadius: 3,
                backgroundColor:
                  mode === "dark" ? "#ffffff08" : "#00000008",
              }}
            >
              <Typography variant="subtitle2" fontWeight={600} mb={1}>
                Members Paid:
              </Typography>

              {expenseContributors.map((c, index) => (
                <Box
                  key={c.uid}
                  display="flex"
                  alignItems="center"
                  gap={1.5}
                  sx={{
                    p: 1,
                    mb: 1,
                    borderRadius: 2,
                    backgroundColor: c.included
                      ? mode === "dark"
                        ? "#ffffff10"
                        : "#00000010"
                      : "transparent",
                    transition: "all 0.25s ease",
                  }}
                >
                  <Checkbox
                    checked={c.included}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setExpenseContributors((prev) =>
                        prev.map((x, i) =>
                          i === index
                            ? { ...x, included: checked, paidAmount: checked ? x.paidAmount : 0 }
                            : x
                        )
                      );
                    }}
                  />
                  <Avatar src={c.photoURL} sx={{ width: 32, height: 32 }} />
                  <Typography sx={{ flexGrow: 1 }}>
                    {getMemberName(c.uid)}
                  </Typography>

                  {c.included && (
                    <TextField
                      size="small"
                      label="Amount Paid"
                      type="number"
                      value={c.paidAmount}
                      onChange={(e) =>
                        setExpenseContributors((prev) =>
                          prev.map((x, i) =>
                            i === index ? { ...x, paidAmount: e.target.value } : x
                          )
                        )
                      }
                      sx={{
                        width: 110,
                        "& .MuiOutlinedInput-root": { borderRadius: 2 },
                      }}
                    />
                  )}
                </Box>
              ))}
            </Box>
          </Collapse>
        )}

        {/* Other Fields */}
        {["Amount (₹)", "Category", "Date", "Time"].map((label, idx) => (
          <TextField
            key={label}
            fullWidth
            label={label}
            type={label === "Date" ? "date" : label === "Time" ? "time" : label === "Amount (₹)" ? "number" : "text"}
            InputLabelProps={label === "Date" || label === "Time" ? { shrink: true } : {}}
            value={
              label === "Amount (₹)"
                ? newExpense.amount
                : label === "Category"
                ? newExpense.category
                : label === "Date"
                ? newExpense.date
                : newExpense.time
            }
            onChange={(e) => {
              const value = e.target.value;
              setNewExpense((prev) => ({
                ...prev,
                [label === "Amount (₹)"
                  ? "amount"
                  : label === "Category"
                  ? "category"
                  : label === "Date"
                  ? "date"
                  : "time"]: value,
              }));
            }}
            sx={{
              mb: 2,
              borderRadius: 3,
              "& .MuiOutlinedInput-root": {
                borderRadius: 3,
                backgroundColor: mode === "dark" ? "#1e1e1e" : "#fafafa",
              },
            }}
          />
        ))}

        {/* Save Button */}
<Button
  fullWidth
  variant="contained"
  onClick={editingExpense ? updateExpense : addExpense}
  sx={{
    mt: 1,
    py: 1.4,
    borderRadius: 3,
    fontWeight: 600,
    fontSize: "1rem",
    letterSpacing: 0.4,
    backgroundColor: mode === "dark" ? "#fff" : "#000",
    color: mode === "dark" ? "#000" : "#fff",
    "&:hover": {
      transform: "translateY(-2px)",
      backgroundColor: mode === "dark" ? "#f1f1f1" : "#111",
    },
    transition: "all 0.3s ease",
  }}
  disabled={
    !newExpense.name ||
    !newExpense.amount ||
    !newExpense.date ||
    !newExpense.time
  }
>
  {editingExpense ? "Update Expense" : "Save Expense"}
</Button>
      </Box>
    </SwipeableDrawer>
  );
};

export default ExpenseDrawer;