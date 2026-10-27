// src/components/chats_components/ChatExpensesCard.jsx
import React, { useState, useEffect, useMemo } from "react";
import {
  Box,
  Typography,
  Chip,
  Button,
  SwipeableDrawer,
  TextField,
  MenuItem,
  CircularProgress,
} from "@mui/material";
import {
  drawerPaperSx,
  drawerBackdropSx,
  DrawerHandle,
} from "../../theme/designSystem";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import AddIcon from "@mui/icons-material/Add";
import ShareOutlinedIcon from "@mui/icons-material/ShareOutlined";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import {
  doc,
  onSnapshot,
  updateDoc,
  arrayUnion,
  collection,
  query,
  where,
  limit,
  getDocs,
} from "firebase/firestore";
import { db } from "../../firebase";

const CATEGORIES = [
  "Food",
  "Travel",
  "Stay",
  "Fuel",
  "Bills",
  "Utilities",
  "Shopping",
  "Entertainment",
  "Medical",
  "Other",
];

/**
 * ChatExpensesCard: Complete Detailed Expenses Card
 * Includes top budget overview widget + full scrollable expenses ledger + category filters + add expense.
 */
const ChatExpensesCard = ({
  cardData = {},
  currentUser,
  isBudgetAllowed = true,
  isDark = true,
  messageId = null,
  chatType = "group",
  chatId = null,
  onShare = null,
}) => {
  const tripId = cardData?.tripId;

  const [liveBudget, setLiveBudget] = useState(null);
  const [selectedCategory] = useState("All");
  const [addExpenseOpen, setAddExpenseOpen] = useState(false);
  const [expenseName, setExpenseName] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseCategory, setExpenseCategory] = useState("Food");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Quick Direct Category Suggestion state
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [quickCategory, setQuickCategory] = useState("Food");
  const [quickAmount, setQuickAmount] = useState("");
  const [quickNote, setQuickNote] = useState("");

  const handleOpenQuickAdd = (category) => {
    setQuickCategory(category);
    setQuickNote(`${category} Expense`);
    setQuickAmount("");
    setQuickAddOpen(true);
  };

  // Live real-time Firestore sync with budgets doc matching tripId
  useEffect(() => {
    if (!tripId) return;

    let unsubDirect = null;
    try {
      const budgetRef = doc(db, "budgets", tripId);
      unsubDirect = onSnapshot(budgetRef, (snap) => {
        if (snap.exists()) {
          setLiveBudget(snap.data());
        } else {
          const q = query(
            collection(db, "budgets"),
            where("tripId", "==", tripId),
            limit(1)
          );
          getDocs(q).then((qSnap) => {
            if (!qSnap.empty) {
              setLiveBudget(qSnap.docs[0].data());
            }
          }).catch(() => {});
        }
      }, () => {});
    } catch {
      // ignore
    }

    return () => {
      if (unsubDirect) unsubDirect();
    };
  }, [tripId]);

  const activeBudget = useMemo(() => {
    const rawDoc = liveBudget || {};
    const items = Array.isArray(rawDoc.items) ? rawDoc.items : [];
    const activeItem =
      items.find((it) => it.tripId === tripId) || items[0] || rawDoc;

    const contributors =
      activeItem.contributors || rawDoc.contributors || cardData.contributors || [];
    const contributorTotal =
      Array.isArray(contributors) && contributors.length > 0
        ? contributors.reduce((s, c) => s + (Number(c.amount) || 0), 0)
        : 0;

    const totalBudget =
      Number(
        activeItem.total ||
          rawDoc.total ||
          contributorTotal ||
          cardData.totalBudget ||
          cardData.budget ||
          0
      ) || 0;

    const expensesList = Array.isArray(activeItem.expenses)
      ? activeItem.expenses
      : Array.isArray(rawDoc.expenses)
      ? rawDoc.expenses
      : Array.isArray(cardData.expenses)
      ? cardData.expenses
      : [];

    const totalSpent =
      expensesList.length > 0
        ? expensesList.reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0)
        : Number(activeItem.used || rawDoc.used || cardData.totalSpent || 0) || 0;

    const remaining = totalBudget - totalSpent;

    return {
      title:
        activeItem.name ||
        rawDoc.name ||
        cardData.tripTitle ||
        "Trip Expenses",
      totalBudget,
      totalSpent,
      remaining,
      expenses: expensesList,
    };
  }, [liveBudget, cardData, tripId]);

  // Filtered expenses by category
  const filteredExpenses = useMemo(() => {
    if (selectedCategory === "All") return activeBudget.expenses;
    return activeBudget.expenses.filter((e) => e.category === selectedCategory);
  }, [activeBudget.expenses, selectedCategory]);

  const handleAddExpense = async (e) => {
    e?.preventDefault();
    const numAmount = parseFloat(expenseAmount);
    if (!expenseName.trim() || isNaN(numAmount) || numAmount <= 0 || !tripId) {
      return;
    }

    setIsSubmitting(true);
    try {
      const newExp = {
        id: `exp_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        name: expenseName.trim(),
        description: expenseName.trim(),
        title: expenseName.trim(),
        amount: numAmount,
        category: expenseCategory,
        date: new Date().toISOString().split("T")[0],
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        payer: currentUser?.displayName || currentUser?.name || "Member",
        paidBy: currentUser?.uid || "",
        createdAt: new Date().toISOString(),
      };

      const budgetRef = doc(db, "budgets", tripId);
      const updatedSpent = (activeBudget.totalSpent || 0) + numAmount;

      await updateDoc(budgetRef, {
        expenses: arrayUnion(newExp),
        used: updatedSpent,
        updatedAt: new Date().toISOString(),
      }).catch(async () => {
        const q = query(collection(db, "budgets"), where("tripId", "==", tripId), limit(1));
        const qSnap = await getDocs(q);
        if (!qSnap.empty) {
          await updateDoc(qSnap.docs[0].ref, {
            expenses: arrayUnion(newExp),
            used: updatedSpent,
            updatedAt: new Date().toISOString(),
          });
        }
      });

      if (messageId && chatId) {
        const msgPath =
          chatType === "group"
            ? doc(db, "groupChat", chatId, "messages", messageId)
            : doc(db, "chats", chatId, "messages", messageId);

        updateDoc(msgPath, {
          "cardData.expenses": arrayUnion(newExp),
          "cardData.totalSpent": updatedSpent,
          "cardData.remaining": (activeBudget.totalBudget || 0) - updatedSpent,
        }).catch(() => {});
      }

      setExpenseName("");
      setExpenseAmount("");
      setAddExpenseOpen(false);
    } catch (err) {
      console.error("Failed to add trip expense:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveQuickExpense = async (e) => {
    e?.preventDefault();
    const numAmount = parseFloat(quickAmount);
    if (isNaN(numAmount) || numAmount <= 0 || !tripId) return;

    setIsSubmitting(true);
    try {
      const now = new Date();
      const currentDate = now.toISOString().split("T")[0];
      const currentTime = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      const currentIso = now.toISOString();
      const currentUid = currentUser?.uid || "";
      const currentName = currentUser?.displayName || currentUser?.name || "Member";

      const newExp = {
        id: `exp_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        name: quickNote.trim() || `${quickCategory} Expense`,
        description: quickNote.trim() || `${quickCategory} Expense`,
        title: quickNote.trim() || `${quickCategory} Expense`,
        amount: numAmount,
        category: quickCategory,
        date: currentDate,
        time: currentTime,
        dateTime: currentIso,
        payer: currentName,
        paidBy: currentUid,
        paidByUid: currentUid,
        createdBy: currentUid,
        createdAt: currentIso,
      };

      const budgetRef = doc(db, "budgets", tripId);
      const updatedSpent = (activeBudget.totalSpent || 0) + numAmount;

      await updateDoc(budgetRef, {
        expenses: arrayUnion(newExp),
        used: updatedSpent,
        updatedAt: currentIso,
      }).catch(async () => {
        const q = query(collection(db, "budgets"), where("tripId", "==", tripId), limit(1));
        const qSnap = await getDocs(q);
        if (!qSnap.empty) {
          await updateDoc(qSnap.docs[0].ref, {
            expenses: arrayUnion(newExp),
            used: updatedSpent,
            updatedAt: currentIso,
          });
        }
      });

      if (messageId && chatId) {
        const msgPath =
          chatType === "group"
            ? doc(db, "groupChat", chatId, "messages", messageId)
            : doc(db, "chats", chatId, "messages", messageId);

        updateDoc(msgPath, {
          "cardData.expenses": arrayUnion(newExp),
          "cardData.totalSpent": updatedSpent,
          "cardData.remaining": (activeBudget.totalBudget || 0) - updatedSpent,
        }).catch(() => {});
      }

      setQuickAmount("");
      setQuickNote("");
      setQuickAddOpen(false);
    } catch (err) {
      console.error("Failed to add quick expense:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isBudgetAllowed) {
    return (
      <Box
        sx={{
          mt: 1,
          minWidth: { xs: 260, sm: 300 },
          maxWidth: 440,
          width: "100%",
          p: 1.6,
          borderRadius: "14px",
          bgcolor: isDark ? "rgba(40, 10, 10, 0.7)" : "rgba(255, 235, 235, 0.8)",
          border: "1px solid rgba(255, 77, 77, 0.3)",
          display: "flex",
          alignItems: "center",
          gap: 1.4,
        }}
      >
        <LockOutlinedIcon sx={{ color: "#ff4d4d", fontSize: 26 }} />
        <Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#ff4d4d" }}>
            Private Trip Expenses
          </Typography>
          <Typography
            variant="caption"
            sx={{
              color: isDark ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.7)",
              fontSize: "0.74rem",
              display: "block",
            }}
          >
            Restricted access. Only members of this trip have permission to view expense details.
          </Typography>
        </Box>
      </Box>
    );
  }

  const isOverBudget = activeBudget.remaining < 0;

  return (
    <Box
      sx={{
        mt: 1,
        mb: 1,
        minWidth: { xs: 280, sm: 340 },
        maxWidth: 380,
        width: "100%",
        overflow: "hidden",
        bgcolor: "transparent",
        border: "0px solid",
        boxShadow: "none",
      }}
    >
      {/* Main Expense Card Container */}
      <Box
        sx={{
          p: 1.8,
          borderRadius: 6,
          mb: 1,
          bgcolor: isDark ? isOverBudget ? "#ff4d4d1d" : "#00e67717" : isOverBudget ? "#ff4d4d20" : "#00e67714",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          border: `0px solid ${
            isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.06)"
          }`,
        }}
      >
        {/* Header */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 1.4,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: 3,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                bgcolor: isDark ? "rgba(255, 255, 255, 0.07)" : "rgba(255, 251, 251, 0.46)",
                color: isDark ? isOverBudget ? "#ff4d4d" : "#00e676" : isOverBudget ? "#ff4d4d" : "#00e676",
                flexShrink: 0,
              }}
            >
              <ReceiptLongIcon sx={{ fontSize: 24 }} />
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography
                variant="subtitle2"
                sx={{ fontWeight: 800, fontSize: "0.92rem" }}
                noWrap
              >
                {activeBudget.title}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  opacity: 0.6,
                  fontSize: "0.68rem",
                  display: "block",
                }}
                noWrap
              >
                Expenses Ledger
              </Typography>
            </Box>
          </Box>


                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.6 }}>
                        <Chip
                          size="small"
                          label={isOverBudget ? "Over Budget" : "On Track"}
                          icon={
                            isOverBudget ? (
                              <ErrorOutlineIcon sx={{ fontSize: "13px !important", color: "#ff4d4d !important" }} />
                            ) : (
                              <CheckCircleOutlineIcon sx={{ fontSize: "13px !important", color: "#00e676 !important" }} />
                            )
                          }
                          sx={{
                            height: 20,
                            fontSize: "0.64rem",
                            bgcolor: isOverBudget
                              ? "rgba(255, 77, 77, 0.15)"
                              : "rgba(0, 230, 119, 0.07)",
                            color: isOverBudget ? "#ff4d4d" : "#00e676",
                            fontWeight: 700,
                          }}
                        />
                      </Box>
        </Box>

        {/* ─── Compact Budget Summary Widget at Top ─── */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: 1,
            mb: 1.4,
            p: 1.2,
            borderRadius: 4,
            bgcolor: isDark ? "rgba(0, 0, 0, 0.25)" : "rgba(255, 255, 255, 0.6)",
            border: `1px solid ${
              isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.04)"
            }`,
          }}
        >
          <Box>
            <Typography
              variant="caption"
              sx={{ opacity: 0.6, fontSize: "0.68rem", display: "block" }}
            >
              Budget
            </Typography>
            <Typography
              variant="body2"
              sx={{ fontWeight: 700, fontSize: "0.84rem" }}
            >
              ₹{Number(activeBudget.totalBudget || 0).toLocaleString()}
            </Typography>
          </Box>
          <Box>
            <Typography
              variant="caption"
              sx={{ opacity: 0.6, fontSize: "0.68rem", display: "block" }}
            >
              Spent
            </Typography>
            <Typography
              variant="body2"
              sx={{
                fontWeight: 700,
                fontSize: "0.84rem",
                color: isOverBudget ? "#ff4d4d" : "#ffa726",
              }}
            >
              ₹{Number(activeBudget.totalSpent || 0).toLocaleString()}
            </Typography>
          </Box>
          <Box>
            <Typography
              variant="caption"
              sx={{ opacity: 0.6, fontSize: "0.68rem", display: "block" }}
            >
              Remaining
            </Typography>
            <Typography
              variant="body2"
              sx={{
                fontWeight: 700,
                fontSize: "0.84rem",
                color: isOverBudget ? "#ff4d4d" : "#00e676",
              }}
            >
              ₹{Number(activeBudget.remaining || 0).toLocaleString()}
            </Typography>
          </Box>
        </Box>


        {/* Expenses Items List */}
        {filteredExpenses.length === 0 ? (
          <Box
            sx={{
              p: 1.4,
              borderRadius: 4,
              bgcolor: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)",
              textAlign: "center",
            }}
          >
            <Typography
              variant="caption"
              sx={{ opacity: 0.5, fontSize: "0.75rem" }}
            >
              {selectedCategory === "All"
                ? "No expenses recorded yet."
                : `No expenses under ${selectedCategory}.`}
            </Typography>
          </Box>
        ) : (
          <Box
            sx={{
              maxHeight: 190,
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: 0.6,
              borderRadius: 4,
              pr: 0.4,
              "&::-webkit-scrollbar": { width: 4 },
              "&::-webkit-scrollbar-thumb": {
                backgroundColor: isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.15)",
                borderRadius: 2,
              },
            }}
          >
            {filteredExpenses.map((exp, idx) => (
                <Box
                  key={exp.id || idx}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    p: "7px 10px",
                    borderRadius: 4,
                    bgcolor: isDark
                      ? "rgba(255, 255, 255, 0.04)"
                      : "rgba(0, 0, 0, 0.03)",
                    border: "none",
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0, flex: 1, mr: 1 }}>

                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      <Typography
                        variant="body2"
                        sx={{ fontSize: "0.8rem", fontWeight: 600 }}
                        noWrap
                      >
                        {exp.name || exp.description || exp.title || "Expense"}
                      </Typography>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.6, flexWrap: "wrap" }}>
                        <Typography
                          variant="caption"
                          sx={{
                            fontSize: "0.64rem",
                            color: '#7b7b7b',
                            fontWeight: 700,
                          }}
                        >
                          {exp.category || "General"}
                        </Typography>
                        {(exp.payer || exp.paidBy) && (
                          <Typography
                            variant="caption"
                            sx={{ fontSize: "0.64rem", opacity: 0.5 }}
                            noWrap
                          >
                            • by {exp.payer || "Member"}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </Box>

                  <Typography
                    variant="body2"
                    sx={{
                      fontSize: "0.82rem",
                      fontWeight: 700,
                      color: isDark ? "#fffefc" : "#030303",
                      flexShrink: 0,
                    }}
                  >
                    ₹{Number(exp.amount || 0).toLocaleString()}
                  </Typography>
                </Box>
            ))}
          </Box>
        )}
      </Box>

      {/* ─── Direct Quick Category Go-Through Buttons (Using Emojis styled like Share Button) ─── */}
      <Box sx={{ mb: 1.2, px: 0.5 }}>
        <Typography
          variant="caption"
          sx={{
            display: "block",
            mb: 0.6,
            fontSize: "0.68rem",
            fontWeight: 700,
            opacity: 0.7,
            letterSpacing: "0.2px",
          }}
        >
          ⚡ Quick Add Category:
        </Typography>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            overflowX: "auto",
            scrollbarWidth: "none",
            "&::-webkit-scrollbar": { display: "none" },
            pb: 0.4,
          }}
        >
          {[
            { cat: "Food", label: "🍔 Food" },
            { cat: "Travel", label: "🚕 Travel" },
            { cat: "Stay", label: "🏨 Stay" },
            { cat: "Shopping", label: "🛍️ Shopping" },
            { cat: "Entertainment", label: "🎟️ Fun" },
          ].map((sug) => (
            <Button
              key={sug.cat}
              size="small"
              variant="contained"
              onClick={() => handleOpenQuickAdd(sug.cat)}
              sx={{
                py: 0.6,
                px: 1.2,
                borderRadius: 8,
                bgcolor: isDark ? "rgb(26, 26, 26)" : "rgb(255, 255, 255)",
                color: isDark ? "#fff" : "#1c1c1e",
                textTransform: "none",
                boxShadow: "none",
                fontWeight: 600,
                fontSize: "0.75rem",
                whiteSpace: "nowrap",
                flexShrink: 0,
                transition: "all 150ms ease",
                "&:hover": {
                  bgcolor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
                  boxShadow: "none",
                },
              }}
            >
              {sug.label}
            </Button>
          ))}
        </Box>
      </Box>

      {/* Suggested Quick Access Action Buttons (Add Expense & Share) */}
      <Box sx={{ display: "flex", gap: 1, alignItems: "center", px: 0.5 }}>
        <Button
          fullWidth
          variant="contained"
          size="small"
          onClick={() => setAddExpenseOpen(true)}
          startIcon={<AddIcon sx={{ fontSize: "15px !important" }} />}
          sx={{
            py: 0.8,
            borderRadius: 8,
            bgcolor: isDark ? "#dadada" : "#282828",
            color: isDark ? "#090909" : "#f5f5f5",
            textTransform: "none",
            fontWeight: 700,
            fontSize: "0.8rem",
            boxShadow: "none",
            transition: "all 150ms ease",
            "&:hover": {
              bgcolor: isDark ? "#f1f0f0" : "#0f0f0f",
              boxShadow: "none",
            },
          }}
        >
          Add Expense
        </Button>

        {onShare && (
          <Button
            variant="contained"
            size="small"
            fullWidth
            startIcon={<ShareOutlinedIcon sx={{ fontSize: 16 }} />}
            onClick={(e) => {
              e.stopPropagation();
              onShare(cardData);
            }}
            sx={{
              py: 0.8,
              px: 1.6,
              borderRadius: 8,
              bgcolor: isDark ? "rgb(26, 26, 26)" : "rgb(255, 255, 255)",
              color: isDark ? "#fff" : "#1c1c1e",
              textTransform: "none",
              boxShadow: "none",
              fontWeight: 600,
              fontSize: "0.8rem",
              whiteSpace: "nowrap",
              transition: "all 150ms ease",
              "&:hover": {
                bgcolor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
                boxShadow: "none",
              },
            }}
          >
            Share
          </Button>
        )}
      </Box>

      {/* Add Expense Drawer */}
      <SwipeableDrawer
        anchor="bottom"
        open={addExpenseOpen}
        onClose={() => !isSubmitting && setAddExpenseOpen(false)}
        onOpen={() => {}}
        disableSwipeToOpen={false}
        ModalProps={{
          BackdropProps: {
            sx: drawerBackdropSx,
          },
        }}
        PaperProps={{
          sx: {
            ...drawerPaperSx(isDark ? "dark" : "light", {
              maxHeight: "85vh",
            }),
            overflowY: "auto",
          },
        }}
      >
        <Box sx={{ display: { xs: "block", md: "none" } }}>
          <DrawerHandle mode={isDark ? "dark" : "light"} />
        </Box>

        <Box sx={{ maxWidth: 500, mx: "auto", width: "100%", boxSizing: "border-box", pt: { xs: 1, md: 2 } }}>
          <Typography variant="h6" sx={{ pb: 1, fontWeight: 700, fontSize: "1.05rem" }}>
            Add Trip Expense
          </Typography>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.6, pt: 1 }}>
            <TextField
              autoFocus
              label="Expense Name / Title"
              placeholder="e.g. Dinner, Fuel, Museum Tickets"
              value={expenseName}
              onChange={(e) => setExpenseName(e.target.value)}
              fullWidth
              size="small"
            />
            <TextField
              label="Amount (₹)"
              type="number"
              placeholder="0"
              value={expenseAmount}
              onChange={(e) => setExpenseAmount(e.target.value)}
              fullWidth
              size="small"
            />
            <TextField
              select
              label="Category"
              value={expenseCategory}
              onChange={(e) => setExpenseCategory(e.target.value)}
              fullWidth
              size="small"
            >
              {CATEGORIES.map((cat) => (
                <MenuItem key={cat} value={cat}>
                  {cat}
                </MenuItem>
              ))}
            </TextField>
          </Box>
          <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1, pt: 2.5, pb: 1 }}>
            <Button
              onClick={() => setAddExpenseOpen(false)}
              disabled={isSubmitting}
              sx={{ textTransform: "none", color: "inherit", opacity: 0.7 }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleAddExpense}
              disabled={isSubmitting || !expenseName.trim() || !expenseAmount}
              sx={{
                borderRadius: "10px",
                textTransform: "none",
                fontWeight: 700,
                bgcolor: "#ffb300",
                color: "#000",
                "&:hover": { bgcolor: "#ffa000" },
              }}
            >
              {isSubmitting ? (
                <CircularProgress size={20} sx={{ color: "#000" }} />
              ) : (
                "Save Expense"
              )}
            </Button>
          </Box>
        </Box>
      </SwipeableDrawer>

      {/* Quick Add Expense Drawer */}
      <SwipeableDrawer
        anchor="bottom"
        open={quickAddOpen}
        onClose={() => !isSubmitting && setQuickAddOpen(false)}
        onOpen={() => {}}
        disableSwipeToOpen={false}
        ModalProps={{
          BackdropProps: {
            sx: drawerBackdropSx,
          },
        }}
        PaperProps={{
          sx: {
            ...drawerPaperSx(isDark ? "dark" : "light", {
              maxHeight: "85vh",
            }),
            overflowY: "auto",
          },
        }}
      >
        <Box sx={{ display: { xs: "block", md: "none" } }}>
          <DrawerHandle mode={isDark ? "dark" : "light"} />
        </Box>

        <Box sx={{ maxWidth: 500, mx: "auto", width: "100%", boxSizing: "border-box", pt: { xs: 1, md: 2 } }}>
          <Typography variant="h6" sx={{ pb: 0.5, fontWeight: 700, fontSize: "1.05rem" }}>
            Quick Add {quickCategory} Expense
          </Typography>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.4, pt: 1.5 }}>
            <TextField
              autoFocus
              label="Amount (₹)"
              type="number"
              placeholder="0"
              value={quickAmount}
              onChange={(e) => setQuickAmount(e.target.value)}
              fullWidth
              size="medium"
              inputProps={{ style: { fontSize: "1.2rem", fontWeight: 700 } }}
            />
            <TextField
              label="Note / Title"
              placeholder={`${quickCategory} Expense`}
              value={quickNote}
              onChange={(e) => setQuickNote(e.target.value)}
              fullWidth
              size="small"
            />
          </Box>
          <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1, pt: 2.5, pb: 1 }}>
            <Button
              onClick={() => setQuickAddOpen(false)}
              disabled={isSubmitting}
              sx={{ textTransform: "none", color: "inherit", opacity: 0.7 }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleSaveQuickExpense}
              disabled={isSubmitting || !quickAmount || parseFloat(quickAmount) <= 0}
              sx={{
                borderRadius: "10px",
                textTransform: "none",
                fontWeight: 700,
                bgcolor: "#ffb300",
                color: "#000",
                "&:hover": { bgcolor: "#ffa000" },
              }}
            >
              {isSubmitting ? (
                <CircularProgress size={20} sx={{ color: "#000" }} />
              ) : (
                "Confirm & Save"
              )}
            </Button>
          </Box>
        </Box>
      </SwipeableDrawer>
    </Box>
  );
};

export default React.memo(ChatExpensesCard);