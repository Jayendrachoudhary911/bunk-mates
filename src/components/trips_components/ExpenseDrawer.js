import React from "react";
import {
  Box,
  Typography,
  Button,
  TextField,
  SwipeableDrawer,
  Checkbox,
  Collapse,
  Avatar,
  MenuItem,
  Stack,
  IconButton,
} from "@mui/material";
import { motion } from "framer-motion";
import {
  drawerPaperSx,
  drawerBackdropSx,
  DrawerHandle,
  glassIconBtnSx,
  glassInputSx,
} from "../../theme/designSystem";
import { CloseOutlined as CloseOutlinedIcon } from "../../icons";

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
  const isDarkMode = mode === "dark";

  // Predefined common expense categories
  const categories = [
    "Food & Dining",
    "Transport & Cab",
    "Hotel & Stay",
    "Shopping",
    "Activities & Tickets",
    "Groceries",
    "Other",
  ];

  return (
    <SwipeableDrawer
      anchor="bottom"
      open={expenseDrawerOpen}
      onClose={() => setExpenseDrawerOpen(false)}
      onOpen={() => {}}
      disableBackdropTransition={false}
      ModalProps={{
        BackdropProps: {
          sx: drawerBackdropSx,
        },
      }}
      PaperProps={{
        sx: {
          ...drawerPaperSx(mode, {
            maxHeight: "85vh",
          }),
          overflowY: "auto",
        },
      }}
    >
      {/* Drag Handle for Mobile */}
      <Box sx={{ display: { xs: "block", md: "none" } }}>
        <DrawerHandle mode={mode} />
      </Box>

      {/* Header with Desktop Close Button */}
      <Box
        sx={{
          px: { xs: 0, md: 3.5 },
          pt: { xs: 1, md: 1 },
          pb: 3,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          maxWidth: 600,
          mx: "auto",
          width: "100%",
          boxSizing: "border-box",
        }}
      >
        <Typography
          variant="h6"
          fontWeight={800}
          textAlign="center"
          sx={{
            color: isDarkMode ? "#fff" : "#000",
            letterSpacing: "-0.3px",
            flexGrow: 1,
          }}
        >
          {editingExpense ? "Edit Expense" : "Add New Expense"}
        </Typography>

        <IconButton
          onClick={() => setExpenseDrawerOpen(false)}
          size="small"
          sx={glassIconBtnSx(mode, { p: 1, display: { xs: 'none', md: 'flex' } })}
        >
          <CloseOutlinedIcon fontSize="small" />
        </IconButton>
      </Box>

      {/* Expense Fields Section */}
      <Box
        component={motion.div}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        sx={{
          maxWidth: 600,
          mx: "auto",
          width: "100%",
          boxSizing: "border-box",
          px: { xs: 0, md: 3.5 },
          pb: { xs: 0, md: 4 },
        }}
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
            mb: 2.5,
            ...glassInputSx(mode),
          }}
        />

        {/* Row 1: Amount (₹) and Category (Dropdown) */}
        <Stack direction="row" spacing={2} sx={{ mb: 2.5 }}>
          <TextField
            fullWidth
            label="Amount (₹)"
            type="number"
            value={newExpense.amount}
            onChange={(e) =>
              setNewExpense((prev) => ({ ...prev, amount: e.target.value }))
            }
            sx={glassInputSx(mode)}
          />
          <TextField
            select
            fullWidth
            label="Category"
            value={newExpense.category || ""}
            onChange={(e) =>
              setNewExpense((prev) => ({ ...prev, category: e.target.value }))
            }
            sx={glassInputSx(mode)}
          >
            {categories.map((cat) => (
              <MenuItem key={cat} value={cat}>
                {cat}
              </MenuItem>
            ))}
          </TextField>
        </Stack>

        {/* Row 2: Date and Time */}
        <Stack direction="row" spacing={2} sx={{ mb: 2.5 }}>
          <TextField
            fullWidth
            label="Date"
            type="date"
            InputLabelProps={{ shrink: true }}
            value={newExpense.date}
            onChange={(e) =>
              setNewExpense((prev) => ({ ...prev, date: e.target.value }))
            }
            sx={glassInputSx(mode)}
          />
          <TextField
            fullWidth
            label="Time"
            type="time"
            InputLabelProps={{ shrink: true }}
            value={newExpense.time}
            onChange={(e) =>
              setNewExpense((prev) => ({ ...prev, time: e.target.value }))
            }
            sx={glassInputSx(mode)}
          />
        </Stack>

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
            borderRadius: 6,
            py: 1.5,
            mb: 2.5,
            textTransform: "none",
            fontWeight: 700,
            fontSize: "0.82rem",
            borderColor: "rgba(255,255,255,0)",
            color: theme.palette.text.primary,
            backgroundColor:
              newExpense.splitMode === "multiple_payers"
                ? (isDarkMode ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.04)")
                : isDarkMode ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.01)",
            transition: "all 0.2s ease",
            "&:hover": {
              backgroundColor: isDarkMode ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.06)",
              transform: "translateY(-1px)",
            },
          }}
        >
          {newExpense.splitMode === "single_payer"
            ? "✨ Switch to Multiple Contributors"
            : `👥 Multiple Payers Mode (Total ₹${parseFloat(
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
            sx={{
              mb: 2.5,
              ...glassInputSx(mode),
            }}
          >
            {memberDetails.map((member) => (
              <MenuItem key={member.uid} value={member.uid}>
                {getMemberName(member.uid)}
              </MenuItem>
            ))}
          </TextField>
        )}

        {/* Multiple Contributors Stacked Grid (3x on mobile, 4x on desktop) with full card clickability */}
        {newExpense.splitMode === "multiple_payers" && (
          <Collapse in={true}>
            <Box
              sx={{
                mb: 2.5,
                p: 0,
                backgroundColor: 'transparent',
                border: "0px solid",
              }}
            >
              <Typography variant="subtitle2" fontWeight={700} mb={1.5}>
                Members Paid:
              </Typography>

              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "repeat(3, minmax(0, 1fr))", sm: "repeat(4, minmax(0, 1fr))" },
                  gap: 1.5,
                }}
              >
                {expenseContributors.map((c, index) => {
                  const handleCardClick = () => {
                    const newChecked = !c.included;
                    setExpenseContributors((prev) =>
                      prev.map((x, i) =>
                        i === index
                          ? { ...x, included: newChecked, paidAmount: newChecked ? x.paidAmount : 0 }
                          : x
                      )
                    );
                  };

                  return (
                    <Box
                      key={c.uid}
                      onClick={handleCardClick}
                      sx={{
                        p: 1.5,
                        borderRadius: 6,
                        textAlign: "center",
                        backgroundColor: c.included
                          ? isDarkMode
                            ? "rgba(255,255,255,0.08)"
                            : "rgba(0,0,0,0.06)"
                          : isDarkMode ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)",
                        border: "0px solid",
                        borderColor: c.included ? "primary.main" : (isDarkMode ? "rgba(255,255,255,0.06)" : "divider"),
                        transition: "all 0.25s ease",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 0.5,
                        cursor: "pointer",
                        "&:hover": {
                          borderColor: "primary.main",
                        },
                      }}
                    >
                      <Box display="flex" alignItems="center" justifyContent="flex-end" width="100%">
                        <Checkbox
                          checked={c.included}
                          onChange={() => {}} 
                          size="small"
                          sx={{ p: 0 }}
                        />
                      </Box>
                      <Avatar
                        src={c.photoURL}
                        sx={{
                          width: 58,
                          height: 58,
                          fontWeight: 700,
                          fontSize: "0.85rem",
                          bgcolor: "primary.main",
                          color: "primary.contrastText",
                          mx: "auto",
                        }}
                      >
                        {c.name?.charAt(0)}
                      </Avatar>
                      <Typography variant="caption" fontWeight={700} noWrap sx={{ width: "100%" }}>
                        {getMemberName(c.uid)}
                      </Typography>

                      {c.included && (
                        <TextField
                          size="small"
                          placeholder="₹ Amt"
                          type="number"
                          value={c.paidAmount}
                          onClick={(e) => e.stopPropagation()} 
                          onChange={(e) =>
                            setExpenseContributors((prev) =>
                              prev.map((x, i) =>
                                i === index ? { ...x, paidAmount: e.target.value } : x
                              )
                            )
                          }
                          sx={{
                            mt: 0.5,
                            width: "100%",
                            ...glassInputSx(mode),
                            "& .MuiInputBase-input": { py: 0.5, px: 1, fontSize: "0.75rem", textAlign: "center" },
                          }}
                        />
                      )}
                    </Box>
                  );
                })}
              </Box>
            </Box>
          </Collapse>
        )}

        {/* Save Button */}
        <Button
          fullWidth
          variant="contained"
          onClick={editingExpense ? updateExpense : addExpense}
          sx={{
            mt: 1,
            py: 1.5,
            borderRadius: 8,
            fontWeight: 700,
            fontSize: "0.95rem",
            letterSpacing: 0.4,
            boxShadow: "none",
            backgroundColor: isDarkMode ? "#fff" : "#000",
            color: isDarkMode ? "#000" : "#fff",
            "&:hover": {
              transform: "translateY(-1px)",
              boxShadow: "none",
              backgroundColor: isDarkMode ? "rgba(255,255,255,0.9)" : "rgba(0,0,0,0.85)",
            },
            transition: "all 0.2s ease",
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