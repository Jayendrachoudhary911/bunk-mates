import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  IconButton,
  Stack,
  Paper,
  InputAdornment,
  Alert,
  Avatar,
  Chip,
  LinearProgress,
  SwipeableDrawer,
  Badge
} from "@mui/material";

import {
  Close,
} from "@mui/icons-material";

import {
  drawerPaperSx,
  drawerBackdropSx,
  DrawerHandle,
  glassInputSx,
  glassIconBtnSx,
} from "../../theme/designSystem";

const BudgetDrawer = ({
  budgetDrawerOpen,
  setBudgetDrawerOpen,
  editBudget,
  setEditBudget,
  saveBudget,
  mode,
  tripMembers = [],
}) => {
  const isDarkMode = mode === "dark";

  // Extract contributors mapping correctly from Firestore structure (items array or root level)
  const budgetDataDoc = editBudget || {};
  const budgetItems = Array.isArray(budgetDataDoc.items) ? budgetDataDoc.items : [];
  const activeBudgetItem = budgetItems[0] || budgetDataDoc;
  
  const contributors = useMemo(
    () => activeBudgetItem.contributors || budgetDataDoc.contributors || [],
    [activeBudgetItem.contributors, budgetDataDoc.contributors]
  );

  const [totalBudget, setTotalBudget] = useState(
    activeBudgetItem.total || budgetDataDoc.total || ""
  );

  const [splitType, setSplitType] = useState(
    activeBudgetItem.splitType || budgetDataDoc.splitType || "equal"
  );

  const [memberContributions, setMemberContributions] = useState({});
  const [error, setError] = useState("");

  useEffect(() => {
    if (!budgetDrawerOpen) return;

    setTotalBudget(activeBudgetItem.total || budgetDataDoc.total || "");
    setSplitType(activeBudgetItem.splitType || budgetDataDoc.splitType || "equal");
    setError("");

    const initialContributions = {};

    contributors.forEach((member) => {
      const id =
        member.id ||
        member.uid ||
        member.userId ||
        member.email ||
        member.username;

      initialContributions[id] = Number(
        member.contribution ??
          member.amount ??
          member.budget ??
          0
      );
    });

    setMemberContributions(initialContributions);
  }, [
    budgetDrawerOpen,
    contributors,
    activeBudgetItem.splitType,
    activeBudgetItem.total,
    budgetDataDoc.splitType,
    budgetDataDoc.total,
  ]);

  const normalizedContributors = useMemo(() => {
    return tripMembers.map((item, index) => {
      const memberId =
        item.id ||
        item.uid ||
        item.userId ||
        item.email ||
        item.username;

      const contributor = contributors.find((c) => {
        const cId = c.id || c.uid || c.userId || c.email || c.username;
        return cId === memberId;
      }) || {};

      return {
        id: memberId,
        name:
          item.displayName ||
          item.name ||
          item.username ||
          contributor.name ||
          contributor.displayName ||
          contributor.username ||
          contributor.email ||
          `Member ${index + 1}`,
        email: item.email || contributor.email || "",
        photoURL:
          item.photoURL ||
          item.profilePic ||
          item.profilePhoto ||
          item.avatar ||
          contributor.photoURL ||
          contributor.profilePic ||
          contributor.profilePhoto ||
          "",
        contribution: Number(
          contributor.contribution ??
          contributor.amount ??
          contributor.budget ??
          0
        ),
      };
    });
  }, [contributors, tripMembers]);

  const numericBudget = Number(totalBudget) || 0;

  const equalAmount = useMemo(() => {
    if (!numericBudget || !normalizedContributors.length) return 0;
    return numericBudget / normalizedContributors.length;
  }, [numericBudget, normalizedContributors.length]);

  const allocatedAmount = useMemo(() => {
    return normalizedContributors.reduce((sum, member) => {
      return sum + (Number(memberContributions[member.id] ?? member.contribution) || 0);
    }, 0);
  }, [memberContributions, normalizedContributors]);

  const remainingAmount = numericBudget - allocatedAmount;
  const allocationPercentage =
    numericBudget > 0
      ? Math.min((allocatedAmount / numericBudget) * 100, 100)
      : 0;

  const handleContributionChange = (memberId, value) => {
    setError("");
    setMemberContributions((prev) => ({
      ...prev,
      [memberId]: value,
    }));
  };

  const handleEqualSplit = () => {
    if (!numericBudget || !normalizedContributors.length) {
      setError("Enter the total budget first.");
      return;
    }

    const amountPerPerson = numericBudget / normalizedContributors.length;
    const equalContributions = {};

    normalizedContributors.forEach((member) => {
      equalContributions[member.id] = Number(amountPerPerson.toFixed(2));
    });

    setMemberContributions(equalContributions);
    setSplitType("equal");
    setError("");
  };

  const handleSave = () => {
    setError("");

    if (!numericBudget || numericBudget <= 0) {
      setError("Please enter a valid total budget.");
      return;
    }

    if (!normalizedContributors.length) {
      setError("No trip members are available.");
      return;
    }

    let finalContributions = { ...memberContributions };

    if (splitType === "equal") {
      const amountPerPerson = numericBudget / normalizedContributors.length;
      normalizedContributors.forEach((member) => {
        finalContributions[member.id] = Number(amountPerPerson.toFixed(2));
      });
    }

    const finalAllocated = normalizedContributors.reduce(
      (sum, member) =>
        sum + (Number(finalContributions[member.id] ?? member.contribution) || 0),
      0
    );

    if (Math.abs(finalAllocated - numericBudget) > 0.01) {
      setError(
        `Contributions must equal the total budget. ₹${Math.abs(
          numericBudget - finalAllocated
        ).toFixed(2)} is ${
          finalAllocated > numericBudget ? "over-allocated" : "still unallocated"
        }.`
      );
      return;
    }

    const updatedBudget = {
      ...(editBudget || {}),
      total: numericBudget,
      totalBudget: numericBudget,
      splitType,
      contributors: normalizedContributors.map((member) => ({
        uid: member.id,
        name: member.name,
        amount: Number((finalContributions[member.id] ?? member.contribution) || 0),
      })),
    };

    setEditBudget(updatedBudget);
    if (typeof saveBudget === "function") {
      saveBudget(updatedBudget);
    }
    setBudgetDrawerOpen(false);
  };

  const formatCurrency = (value) => {
    return `₹${Number(value || 0).toLocaleString("en-IN", {
      maximumFractionDigits: 2,
    })}`;
  };

  return (
    <SwipeableDrawer
      anchor="bottom"
      open={budgetDrawerOpen}
      onClose={() => setBudgetDrawerOpen(false)}
      onOpen={() => setBudgetDrawerOpen(true)}
      PaperProps={{
        sx: {
          ...drawerPaperSx(mode, {
            maxHeight: "85vh",
          }),
          overflowY: "auto",
        },
      }}
      ModalProps={{
        BackdropProps: {
          sx: drawerBackdropSx,
        },
      }}
    >
      {/* Mobile Drag Handle */}
      <Box sx={{ display: { xs: "block", md: "none" } }}>
        <DrawerHandle mode={mode} />
      </Box>

      {/* Header with Desktop Close Button */}
      <Box
        sx={{
          px: { xs: 1, md: 3.5 },
          pt: { xs: 1, md: 3 },
          pb: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          maxWidth: 600,
          mx: "auto",
          width: "100%",
          boxSizing: "border-box",
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Box>
            <Typography variant="h6" fontWeight={800} lineHeight={1.2}>
              Trip Budget Manager
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Set your total budget and manage contributor allocations
            </Typography>
          </Box>
        </Stack>

        <IconButton
          onClick={() => setBudgetDrawerOpen(false)}
          size="small"
          sx={glassIconBtnSx(mode, { p: 1, display: { xs: 'none', md: 'flex' } })}
        >
          <Close fontSize="small" />
        </IconButton>
      </Box>

      <Box
        sx={{
          maxWidth: 600,
          mx: "auto",
          width: "100%",
          boxSizing: "border-box",
          px: {xs: 0, md: 3.5},
          pb: {xs: 0, md: 0},
        }}
      >
        {/* Allocation Summary Card */}
        <Box
          sx={{
            p: 2.5,
            mb: 3,
            borderRadius: 6,
            border: "0px solid",
            bgcolor: isDarkMode ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.01)",
          }}
        >
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
            <Typography variant="body2" fontWeight={700}>
              Budget Allocation Status
            </Typography>
            <Typography variant="caption" fontWeight={800} color="primary.main">
              {Math.round(allocationPercentage)}% Allocated
            </Typography>
          </Box>

          <LinearProgress
            variant="determinate"
            value={allocationPercentage}
            sx={{
              height: 8,
              borderRadius: 4,
              mb: 2,
              bgcolor: isDarkMode ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
            }}
          />

          <Box display="grid" gridTemplateColumns="1fr 1fr" gap={2}>
            <Box>
              <Typography variant="caption" color="text.secondary" fontWeight={600} display="block">
                Allocated Amount
              </Typography>
              <Typography variant="body1" fontWeight={800}>
                {formatCurrency(allocatedAmount)}
              </Typography>
            </Box>
            <Box textAlign="right">
              <Typography variant="caption" color="text.secondary" fontWeight={600} display="block">
                Remaining
              </Typography>
              <Typography variant="body1" fontWeight={800} color={remainingAmount < 0 ? "error.main" : "text.primary"}>
                {formatCurrency(Math.abs(remainingAmount))}
              </Typography>
            </Box>
          </Box>
        </Box>

        <Stack spacing={2.5}>
          {/* Total Trip Budget Field */}
          <Box>
            <Typography variant="subtitle2" fontWeight={700} mb={1}>
              Total Trip Budget
            </Typography>
            <TextField
              fullWidth
              size="small"
              type="number"
              value={totalBudget}
              onChange={(e) => {
                setTotalBudget(e.target.value);
                setError("");
              }}
              placeholder="Enter total budget amount"
              inputProps={{ min: 0, step: 0.01 }}
              InputProps={{
                startAdornment: <InputAdornment position="start">₹</InputAdornment>,
              }}
              sx={glassInputSx(mode)}
            />
          </Box>

          {/* Split Type Selector */}
          <Box
            sx={{
              border: "0px solid",
              bgcolor: 'transparent',
            }}
          >
            <Typography
              variant="caption"
              fontWeight={700}
              color="text.secondary"
              sx={{ display: "block", mb: 1.5, textTransform: "uppercase", letterSpacing: 0.5 }}
            >
              Split Strategy
            </Typography>
            <Stack direction="row" spacing={1.5}>
              <Button
                fullWidth
                variant={splitType === "equal" ? "contained" : "outlined"}
                onClick={handleEqualSplit}
                sx={{
                  borderRadius: 5,
                  py: 1.5,
                  textTransform: "none",
                  fontWeight: 700,
                  fontSize: "0.85rem",
                  boxShadow: "none",
                  backgroundColor:
                    splitType === "equal"
                      ? isDarkMode
                        ? "#fff"
                        : "#000"
                      : isDarkMode
                      ? "rgba(255,255,255,0.03)"
                      : "rgba(0,0,0,0.02)",
                  color: splitType === "equal" ? (isDarkMode ? "#000" : "#fff") : "text.primary",
                  border: 'none',
                  "&:hover": {
                    backgroundColor:
                      splitType === "equal"
                        ? isDarkMode
                          ? "rgba(255,255,255,0.9)"
                          : "rgba(0,0,0,0.85)"
                        : isDarkMode
                        ? "rgba(255,255,255,0.06)"
                        : "rgba(0,0,0,0.04)",
                    borderColor: isDarkMode ? "rgba(255,255,255,0.15)" : "divider",
                    boxShadow: "none",
                  },
                }}
              >
                ⚡ Equal Split
              </Button>
              <Button
                fullWidth
                variant={splitType === "custom" ? "contained" : "outlined"}
                onClick={() => {
                  setSplitType("custom");
                  setError("");
                }}
                sx={{
                  borderRadius: 5,
                  py: 1.5,
                  textTransform: "none",
                  fontWeight: 700,
                  fontSize: "0.85rem",
                  boxShadow: "none",
                  backgroundColor:
                    splitType === "custom"
                      ? isDarkMode
                        ? "#fff"
                        : "#000"
                      : isDarkMode
                      ? "rgba(255,255,255,0.03)"
                      : "rgba(0,0,0,0.02)",
                  color: splitType === "custom" ? (isDarkMode ? "#000" : "#fff") : "text.primary",
                  border: 'none',
                  "&:hover": {
                    backgroundColor:
                      splitType === "custom"
                        ? isDarkMode
                          ? "rgba(255,255,255,0.9)"
                          : "rgba(0,0,0,0.85)"
                        : isDarkMode
                        ? "rgba(255,255,255,0.06)"
                        : "rgba(0,0,0,0.04)",
                    borderColor: isDarkMode ? "rgba(255,255,255,0.15)" : "divider",
                    boxShadow: "none",
                  },
                }}
              >
                👥 Custom Split
              </Button>
            </Stack>
          </Box>

          {/* Member Contributions Grid */}
          <Box>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
              <Typography variant="subtitle2" fontWeight={700}>
                Member Contributions
              </Typography>
              <Chip
                size="small"
                label={`${normalizedContributors.length} members`}
                sx={{ fontWeight: 700, height: 22 }}
              />
            </Box>

            {normalizedContributors.length > 0 ? (
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "repeat(3, minmax(0, 1fr))", sm: "repeat(3, minmax(0, 1fr))" },
                  gap: 1.5,
                  maxHeight: 300,
                  overflowY: "auto",
                  pr: 0.5,
                }}
              >
                {normalizedContributors.map((member) => {
                  const currentValue = memberContributions[member.id] ?? member.contribution ?? "";
                  const contribution = Number(currentValue) || 0;
                  const percentage = numericBudget > 0 ? (contribution / numericBudget) * 100 : 0;
                  const displayedAmount = splitType === "equal" ? equalAmount : contribution;

                  return (
                    <Paper
                      key={member.id}
                      elevation={0}
                      sx={{
                        p: 1.5,
                        borderRadius: 3,
                        border: 'none',
                        bgcolor: 'transparent',
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        textAlign: "center",
                      }}
                    >
                      <Badge
                        badgeContent={numericBudget > 0 ? `${percentage.toFixed(0)}%` : null}
                        color="primary"
                        sx={{ mb: 1, "& .MuiBadge-badge": { fontSize: "0.6rem", height: 16, minWidth: 16 } }}
                      >
                        <Avatar
                          src={member.photoURL}
                          alt={member.name}
                          sx={{
                            width: 64,
                            height: 64,
                            fontWeight: 700,
                            bgcolor: "primary.main",
                            color: "primary.contrastText",
                          }}
                        >
                          {member.name?.charAt(0)?.toUpperCase()}
                        </Avatar>
                      </Badge>

                      <Typography variant="body2" fontWeight={700} noWrap sx={{ width: "100%", mb: 1, fontSize: "0.8rem" }}>
                        {member.name}
                      </Typography>

                      <Box sx={{ width: "100%", mt: "auto" }}>
                        {splitType === "custom" ? (
                          <TextField
                            fullWidth
                            size="small"
                            type="number"
                            value={currentValue}
                            onChange={(e) => handleContributionChange(member.id, e.target.value)}
                            placeholder="0.00"
                            InputProps={{
                              startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                            }}
                            sx={glassInputSx(mode)}
                          />
                        ) : (
                          <Typography variant="body2" fontWeight={800} color="primary.main">
                            {formatCurrency(displayedAmount)}
                          </Typography>
                        )}
                      </Box>
                    </Paper>
                  );
                })}
              </Box>
            ) : (
              <Typography variant="caption" color="text.secondary" sx={{ textAlign: "center", display: "block", py: 2 }}>
                No members found for this trip.
              </Typography>
            )}
          </Box>

          {error && (
            <Alert severity="error" sx={{ borderRadius: 2.5 }}>
              {error}
            </Alert>
          )}

          {/* Action Buttons */}
        <Box
          sx={{
            px: 0,
            py: 2,
            borderTop: "1px solid",
            borderColor: "divider",
            backgroundColor: "transparent",
          }}
        >
          <Box
            sx={{
              display: "flex",
              gap: 1.25,
            }}
          >
            <Button
              fullWidth
              variant="outlined"
              onClick={() => setBudgetDrawerOpen(false)}
              sx={{
                borderRadius: 8,
                textTransform: "none",
                backgroundColor: "#f1f1f111",
                boxShadow: 'inset 0 1px 1px rgba(255, 255, 255, 0.11), 0 1px 0px rgba(0,0,0,0.1)',
                border: 0,
                color: "text.primary",
              }}
            >
              Cancel
            </Button>

            <Button
              fullWidth
              variant="contained"
              onClick={handleSave}
              disabled={
                !numericBudget ||
                !normalizedContributors.length
              }
              sx={{
                borderRadius: 8,
                textTransform: "none",
              }}
            >
              Save Budget
            </Button>
          </Box>
        </Box>
        </Stack>
      </Box>
    </SwipeableDrawer>
  );
};

export default BudgetDrawer;