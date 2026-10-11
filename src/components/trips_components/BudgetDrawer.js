import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  IconButton,
  Divider,
  Stack,
  MenuItem,
  InputAdornment,
  Alert,
  Avatar,
  Chip,
  LinearProgress,
  SwipeableDrawer,
  alpha,
  Badge
} from "@mui/material";

import {
  Close,
  AccountBalanceWalletOutlined,
  PeopleOutline,
  PercentOutlined,
  EqualizerOutlined,
  SaveOutlined,
} from "@mui/icons-material";

import {
  drawerPaperSx,
  drawerBackdropSx,
  DrawerHandle,
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
  // Extract contributors mapping correctly from Firestore structure (items array or root level)
  const budgetDataDoc = editBudget || {};
  const budgetItems = Array.isArray(budgetDataDoc.items) ? budgetDataDoc.items : [];
  const activeBudgetItem = budgetItems[0] || budgetDataDoc;
  
  const contributors = activeBudgetItem.contributors || budgetDataDoc.contributors || [];

  const [totalBudget, setTotalBudget] = useState(
    activeBudgetItem.total || budgetDataDoc.total || ""
  );

  const [splitType, setSplitType] = useState(
    activeBudgetItem.splitType || budgetDataDoc.splitType || "equal"
  );

  const [memberContributions, setMemberContributions] = useState({});

  const [error, setError] = useState("");

  /*
   * Initialize member contributions whenever
   * the drawer opens or the budget changes.
   */
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
  }, [budgetDrawerOpen, editBudget, contributors]);

  /*
   * Normalize contributors so the component can
   * support different member object structures.
   */
  const normalizedContributors = useMemo(() => {
    return tripMembers.map((item, index) => {
      const memberId =
        item.id ||
        item.uid ||
        item.userId ||
        item.email ||
        item.username;

      // Find matching contributor data if available
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

        email:
          item.email ||
          contributor.email ||
          "",

        photoURL:
          item.photoURL ||
          item.profilePic ||
          item.profilePhoto ||
          item.avatar ||
          contributor.photoURL ||
          contributor.profilePic ||
          contributor.profilePhoto ||
          "",

        contribution:
          Number(
            contributor.contribution ??
            contributor.amount ??
            contributor.budget ??
            0
          ),
      };
    });
  }, [contributors, tripMembers]);

  const numericBudget = Number(totalBudget) || 0;

  /*
   * Equal split amount.
   */
  const equalAmount = useMemo(() => {
    if (!numericBudget || !normalizedContributors.length) return 0;

    return numericBudget / normalizedContributors.length;
  }, [numericBudget, normalizedContributors.length]);

  /*
   * Total manually allocated.
   */
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

  /*
   * Update a member contribution.
   */
  const handleContributionChange = (memberId, value) => {
    setError("");

    setMemberContributions((prev) => ({
      ...prev,
      [memberId]: value,
    }));
  };

  /*
   * Apply equal split.
   */
  const handleEqualSplit = () => {
    if (!numericBudget || !normalizedContributors.length) {
      setError("Enter the total budget first.");
      return;
    }

    const amountPerPerson =
      numericBudget / normalizedContributors.length;

    const equalContributions = {};

    normalizedContributors.forEach((member) => {
      equalContributions[member.id] = Number(
        amountPerPerson.toFixed(2)
      );
    });

    setMemberContributions(equalContributions);
    setSplitType("equal");
    setError("");
  };

  /*
   * Apply percentage split.
   */
  const handlePercentageSplit = () => {
    if (!numericBudget || !normalizedContributors.length) {
      setError("Enter the total budget first.");
      return;
    }

    const percentage = 100 / normalizedContributors.length;
    const contributions = {};

    normalizedContributors.forEach((member) => {
      contributions[member.id] = Number(
        ((numericBudget * percentage) / 100).toFixed(2)
      );
    });

    setMemberContributions(contributions);
    setSplitType("percentage");
    setError("");
  };

  /*
   * Save budget.
   */
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

    let finalContributions = {
      ...memberContributions,
    };

    if (splitType === "equal") {
      const amountPerPerson =
        numericBudget / normalizedContributors.length;

      normalizedContributors.forEach((member) => {
        finalContributions[member.id] = Number(
          amountPerPerson.toFixed(2)
        );
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
          finalAllocated > numericBudget
            ? "over-allocated"
            : "still unallocated"
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
        amount: Number(
          (finalContributions[member.id] ?? member.contribution) || 0
        ),
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
          m: 2,
          maxWidth: 480,
          height: "calc(100% - 88px)",
          overflow: "hidden",
          borderRadius: 8,
          backgroundImage: "none",
          backdropFilter: "blur(12px)",
          webkitBackdropFilter: "blur(12px)",
          backgroundColor: mode === "dark" ? "rgba(20, 20, 20, 0.75)" : "rgba(255, 255, 255, 0.55)",
          boxShadow: mode === "dark" ? "inset 0 1px 2px rgba(255, 255, 255, 0.11), inset 0 -1px 1px rgba(35, 35, 35, 0.07), 0 20px 50px rgba(0,0,0,0.5)" :"inset 0 1px 1px rgba(255, 255, 255, 0.8), inset 0 -1px 1px rgba(0, 0, 0, 0.1), 0 20px 50px rgba(0,0,0,0.05)"
        },
      }}
      ModalProps={{
      BackdropProps: {
        sx: {
          backdropFilter: "blur(12px)",
          backgroundColor: "rgba(0, 0, 0, 0.25)",
        },
      }
    }}
    >
      <Box
        sx={{
          height: "100%",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "transparent",
        }}
      >
        <Box
          sx={{
            display: {
              xs: "flex",
              sm: "none",
            },
            justifyContent: "center",
            pt: 1,
          }}
        >
          <DrawerHandle />
        </Box>

        <Box
          sx={{
            flex: 1,
            overflowY: "auto",
            px: {
              xs: 2,
              sm: 3,
            },
            py: 2.5,
          }}
        >
              <Box
                sx={{
                  p: 2,
                  mb: 2,
                  mt: 0,
                  borderRadius: 3,
                  backgroundColor: "action.hover",
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 1,
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 700,
                    }}
                  >
                    Budget Allocation
                  </Typography>

                  <Typography
                    variant="caption"
                    color="text.secondary"
                  >
                    {Math.round(allocationPercentage)}%
                  </Typography>
                </Box>

                <LinearProgress
                  variant="determinate"
                  value={allocationPercentage}
                  sx={{
                    height: 7,
                    borderRadius: 10,
                    mb: 1.5,
                  }}
                />

                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 1,
                  }}
                >
                  <Box>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                    >
                      Allocated
                    </Typography>

                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 800,
                      }}
                    >
                      {formatCurrency(allocatedAmount)}
                    </Typography>
                  </Box>

                  <Box sx={{ textAlign: "right" }}>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                    >
                      Remaining
                    </Typography>

                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 800,
                        color:
                          remainingAmount < 0
                            ? "error.main"
                            : "text.primary",
                      }}
                    >
                      {formatCurrency(
                        Math.abs(remainingAmount)
                      )}
                    </Typography>
                  </Box>
                </Box>
              </Box>

          <Stack spacing={2.5}>
            <Box>
              <Typography
                variant="subtitle2"
                sx={{
                  fontWeight: 800,
                  mb: 1,
                }}
              >
                Total Trip Budget
              </Typography>

              <TextField
                fullWidth
                type="number"
                value={totalBudget}
                onChange={(e) => {
                  setTotalBudget(e.target.value);
                  setError("");
                }}
                placeholder="Enter total budget"
                inputProps={{
                  min: 0,
                  step: 0.01,
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      ₹
                    </InputAdornment>
                  ),
                }}
              />

              {numericBudget > 0 && (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{
                    display: "block",
                    mt: 0.8,
                  }}
                >
                  Total available budget:{" "}
                  <strong>
                    {formatCurrency(numericBudget)}
                  </strong>
                </Typography>
              )}
            </Box>

<Box>
  <Typography
    variant="subtitle2"
    sx={{
      fontWeight: 800,
      mb: 1,
    }}
  >
    Split Budget
  </Typography>

<Box
  sx={{
    display: "flex",
    flexDirection: "row",
    gap: 1.25,
  }}
>
  <Button
    fullWidth
    variant="contained"
    onClick={handleEqualSplit}
    disableElevation
    sx={{
      position: "relative",
      minHeight: 92,
      px: 1.5,
      py: 1.25,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: 0.35,
      borderRadius: 4,
      textTransform: "none",
      backgroundColor:
        splitType === "equal"
          ? "primary.main"
          : "transparent",
      color:
        splitType === "equal"
          ? "#000000"
          : "text.primary",
      border: "1px solid",
      borderColor:
        splitType === "equal"
          ? "primary.main"
          : "divider",
      boxShadow:
        splitType === "equal"
          ? mode === "dark"
            ? "inset 0 1px 2px rgba(255,255,255,0.14), 0 10px 30px rgba(0,0,0,0.35)"
            : "inset 0 1px 1px rgba(255,255,255,0.9), 0 10px 30px rgba(0,0,0,0.06)"
          : "none",
      transition:
        "background-color 180ms ease, border-color 180ms ease, transform 180ms ease, box-shadow 180ms ease",
      "&:hover": {
        backgroundColor:
          splitType === "equal"
            ? "primary.main"
            : "action.hover",
        borderColor:
          splitType === "equal"
            ? "primary.main"
            : "text.primary",
        transform: "translateY(-1px)",
      },
    }}
  >
    <Box
      sx={{
        width: 34,
        height: 34,
        borderRadius: "50%",
        display: "grid",
        placeItems: "center",
        mb: 0.4,
        backgroundColor:
          splitType === "equal"
            ? "rgba(0,0,0,0.08)"
            : "action.hover",
        color:
          splitType === "equal"
            ? "#000000"
            : "text.primary",
      }}
    >
      <EqualizerOutlined sx={{ fontSize: 19 }} />
    </Box>

    <Typography
      variant="body2"
      sx={{
        fontWeight: 850,
        lineHeight: 1.2,
        color: splitType === "equal" ? "#000000" : "text.primary",
      }}
    >
      Equal Split
    </Typography>

    <Typography
      variant="caption"
      sx={{
        mt: 0.15,
        lineHeight: 1.2,
        fontSize: "0.68rem",
        color: splitType === "equal" ? "rgba(0,0,0,0.65)" : "text.secondary",
      }}
    >
      Everyone pays equally
    </Typography>

    {splitType === "equal" && (
      <Box
        sx={{
          position: "absolute",
          top: 8,
          right: 8,
          width: 7,
          height: 7,
          borderRadius: "50%",
          backgroundColor: "#000000",
        }}
      />
    )}
  </Button>

  <Button
    fullWidth
    variant="contained"
    onClick={() => {
      setSplitType("custom");
      setError("");
    }}
    disableElevation
    sx={{
      position: "relative",
      minHeight: 92,
      px: 1.5,
      py: 1.25,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: 0.35,
      borderRadius: 4,
      textTransform: "none",
      backgroundColor:
        splitType === "custom"
          ? "primary.main"
          : "transparent",
      color:
        splitType === "custom"
          ? "#000000"
          : "text.primary",
      border: "1px solid",
      borderColor:
        splitType === "custom"
          ? "primary.main"
          : "divider",
      boxShadow:
        splitType === "custom"
          ? mode === "dark"
            ? "inset 0 1px 2px rgba(255,255,255,0.14), 0 10px 30px rgba(0,0,0,0.35)"
            : "inset 0 1px 1px rgba(255,255,255,0.9), 0 10px 30px rgba(0,0,0,0.06)"
          : "none",
      transition:
        "background-color 180ms ease, border-color 180ms ease, transform 180ms ease, box-shadow 180ms ease",
      "&:hover": {
        backgroundColor:
          splitType === "custom"
            ? "primary.main"
            : "action.hover",
        borderColor:
          splitType === "custom"
            ? "primary.main"
            : "text.primary",
        transform: "translateY(-1px)",
      },
    }}
  >
    <Box
      sx={{
        width: 34,
        height: 34,
        borderRadius: "50%",
        display: "grid",
        placeItems: "center",
        mb: 0.4,
        backgroundColor:
          splitType === "custom"
            ? "rgba(0,0,0,0.08)"
            : "action.hover",
        color:
          splitType === "custom"
            ? "#000000"
            : "text.primary",
      }}
    >
      <PeopleOutline sx={{ fontSize: 19 }} />
    </Box>

    <Typography
      variant="body2"
      sx={{
        fontWeight: 850,
        lineHeight: 1.2,
        color: splitType === "custom" ? "#000000" : "text.primary",
      }}
    >
      Custom Split
    </Typography>

    <Typography
      variant="caption"
      sx={{
        mt: 0.15,
        lineHeight: 1.2,
        fontSize: "0.68rem",
        color: splitType === "custom" ? "rgba(0,0,0,0.65)" : "text.secondary",
      }}
    >
      Set each person's amount
    </Typography>

    {splitType === "custom" && (
      <Box
        sx={{
          position: "absolute",
          top: 8,
          right: 8,
          width: 7,
          height: 7,
          borderRadius: "50%",
          backgroundColor: "#000000",
        }}
      />
    )}
  </Button>
</Box>
</Box>

<Box>
  <Box
    sx={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      mb: 2,
    }}
  >
    <Box>
      <Typography
        variant="subtitle1"
        sx={{
          fontWeight: 600,
          lineHeight: 1.2,
          color: "text.primary",
        }}
      >
        Member Contributions
      </Typography>

      <Typography
        variant="caption"
        color="text.secondary"
        sx={{
          display: "block",
          mt: 0.5,
        }}
      >
        Manage individual share breakdowns for this trip
      </Typography>
    </Box>

    <Chip
      size="small"
      label={`${normalizedContributors.length} ${
        normalizedContributors.length === 1 ? "member" : "members"
      }`}
      icon={<PeopleOutline sx={{ fontSize: "1rem !important" }} />}
      sx={{
        borderRadius: 2,
        backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.1),
        color: "primary.main",
        border: "1px solid",
        borderColor: (theme) => alpha(theme.palette.primary.main, 0.2),
      }}
    />
  </Box>

  {normalizedContributors.length > 0 ? (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: {
          xs: "repeat(3, minmax(0, 1fr))",
          sm: "repeat(3, minmax(0, 1fr))",
        },
        gap: 1,
      }}
    >
      {normalizedContributors.map((member) => {
        const currentValue = memberContributions[member.id] ?? member.contribution ?? "";
        const contribution = Number(currentValue) || 0;
        const percentage =
          numericBudget > 0 ? (contribution / numericBudget) * 100 : 0;
        const displayedAmount =
          splitType === "equal" ? equalAmount : contribution;

        const hasCustomContribution = splitType === "custom" && contribution > 0;

        return (
          <Box
            key={member.id}
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
              p: { xs: 1.25, sm: 1.75 },
              borderRadius: 3,
              backgroundColor: "transparent",
              border: "0px solid",
            }}
          >
            <Badge
              badgeContent={numericBudget > 0 ? `${percentage.toFixed(0)}%` : null}
              color="primary"
              overlap="circular"
              anchorOrigin={{
                vertical: "top",
                horizontal: "right",
              }}
              sx={{
                mb: 1.25,
                "& .MuiBadge-badge": {
                  fontSize: "0.65rem",
                  backgroundColor: "#f1f1f102",
                  backdropFilter: "blur(26px)",
                  color: "text.primary",
                  height: 18,
                  minWidth: 18,
                  borderRadius: "9px",
                  px: 0.5,
                  boxShadow: 'inset 0 1px 1px rgba(255, 255, 255, 0.11), 0 1px 10px rgba(0,0,0,0.1)',
                },
              }}
            >
              <Avatar
                src={member.photoURL}
                alt={member.name}
                sx={{
                  width: { xs: 72, sm: 84 },
                  height: { xs: 72, sm: 84 },
                  borderRadius: "50%",
                  backgroundColor: "action.selected",
                  fontWeight: 700,
                  color: "text.primary",
                  border: "2px solid",
                  borderColor: hasCustomContribution
                    ? "primary.main"
                    : "transparent",
                }}
              >
                {member.name?.charAt(0)?.toUpperCase()}
              </Avatar>
            </Badge>

            <Typography
              variant="body2"
              sx={{
                fontWeight: 500,
                color: "text.primary",
                width: "100%",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                mb: 1,
              }}
            >
              {member.name}
            </Typography>

            <Box sx={{ width: "100%", mt: "auto" }}>
              {splitType === "custom" ? (
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  value={currentValue}
                  onChange={(e) =>
                    handleContributionChange(member.id, e.target.value)
                  }
                  disabled={splitType === "equal"}
                  inputProps={{
                    min: 0,
                    step: 0.01,
                  }}
                  placeholder="0.00"
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      height: 34,
                      borderRadius: 2,
                      backgroundColor: (theme) =>
                        mode === "dark"
                          ? alpha(theme.palette.common.white, 0.04)
                          : alpha(theme.palette.common.black, 0.02),
                      "& fieldset": {
                        borderColor: "divider",
                      },
                      "&:hover fieldset": {
                        borderColor: "primary.main",
                      },
                      "&.Mui-focused fieldset": {
                        borderColor: "primary.main",
                        borderWidth: "1.5px",
                      },
                    },
                    "& .MuiInputBase-input": {
                      fontSize: "0.8rem",
                      fontWeight: 500,
                      textAlign: "center",
                      color: "text.primary",
                    },
                    "& .MuiInputAdornment-root": {
                      mr: -0.5,
                    },
                    "& .MuiInputAdornment-root p": {
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      color: "text.secondary",
                    },
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">₹</InputAdornment>
                    ),
                  }}
                />
              ) : (
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 700,
                    color: "text.primary",
                    fontSize: "0.9rem",
                    py: 0.5,
                  }}
                >
                  {formatCurrency(displayedAmount)}
                </Typography>
              )}
            </Box>
          </Box>
        );
      })}
    </Box>
  ) : (
    <Box
      sx={{
        py: 5,
        px: 3,
        textAlign: "center",
        borderRadius: 3,
        backgroundColor: (theme) => alpha(theme.palette.action.hover, 0.5),
        border: "1.5px dashed",
        borderColor: "divider",
      }}
    >
      <PeopleOutline
        sx={{
          fontSize: 40,
          color: "text.secondary",
          mb: 1.5,
          opacity: 0.8,
        }}
      />

      <Typography
        variant="body2"
        sx={{
          fontWeight: 700,
          mb: 0.5,
        }}
      >
        No members found
      </Typography>

      <Typography variant="caption" color="text.secondary">
        Add members to the trip before setting contributions.
      </Typography>
    </Box>
  )}
</Box>

            {error && (
              <Alert
                severity="error"
                sx={{
                  borderRadius: 2.5,
                }}
              >
                {error}
              </Alert>
            )}
          </Stack>
        </Box>

        <Box
          sx={{
            px: {
              xs: 2,
              sm: 3,
            },
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
      </Box>
    </SwipeableDrawer>
  );
};

export default BudgetDrawer;