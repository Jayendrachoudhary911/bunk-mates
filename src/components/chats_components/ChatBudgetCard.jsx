// src/components/chats_components/ChatBudgetCard.jsx
import React, { useState, useEffect, useMemo } from "react";
import {
  Box,
  Typography,
  Chip,
  Button,
} from "@mui/material";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import ShareOutlinedIcon from "@mui/icons-material/ShareOutlined";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import {
  doc,
  onSnapshot,
  collection,
  query,
  where,
  limit,
  getDocs,
} from "firebase/firestore";
import { db } from "../../firebase";
import { useNavigate } from "react-router-dom";

/**
 * ChatBudgetCard: Quick View Budget Widget
 * Displays total budget, spent, remaining, and live progress bar.
 */
const ChatBudgetCard = ({
  cardData = {},
  isBudgetAllowed = true,
  isDark = true,
  onShare = null,
}) => {
  const navigate = useNavigate();
  const tripId = cardData?.tripId;

  // Real-time live budget state from Firestore budgets collection
  const [liveBudget, setLiveBudget] = useState(null);

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
        "Trip Budget",
      totalBudget,
      totalSpent,
      remaining,
      expensesCount: expensesList.length,
    };
  }, [liveBudget, cardData, tripId]);

  if (!isBudgetAllowed) {
    return (
      <Box
        sx={{
          mt: 1,
          minWidth: { xs: 260, sm: 300 },
          maxWidth: 420,
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
            Private Trip Budget
          </Typography>
          <Typography
            variant="caption"
            sx={{
              color: isDark ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.7)",
              fontSize: "0.74rem",
              display: "block",
            }}
          >
            Restricted access. Only members of this trip have permission to view budget details.
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
      {/* Main Budget Card Container */}
      <Box
        sx={{
          p: 1.8,
          borderRadius: 6,
          mb: 1,
          bgcolor: isDark
            ? isOverBudget
              ? "#ff4d4d1d"
              : "#00e67717"
            : isOverBudget
            ? "#ff4d4d20"
            : "#00e67714",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          border: "0px solid",
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
                color: isDark
                  ? isOverBudget
                    ? "#ff4d4d"
                    : "#00e676"
                  : isOverBudget
                  ? "#ff4d4d"
                  : "#00e676",
                flexShrink: 0,
              }}
            >
              <AccountBalanceWalletIcon sx={{ fontSize: 24 }} />
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
                Budget Overview
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
                  : "rgba(255, 255, 255, 0.09)",
                color: isOverBudget ? "#ff4d4d" : "#00e676",
                fontWeight: 700,
              }}
            />
          </Box>
        </Box>

        {/* Numbers Grid */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: 1,
            mb: 0,
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
              Total Budget
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
              Total Spent
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
      </Box>

      {/* Action Footer Buttons (View Budget & Share) */}
      <Box sx={{ display: "flex", gap: 1, alignItems: "center", px: 0.5 }}>
        <Button
          fullWidth
          variant="contained"
          size="small"
          onClick={() => tripId && navigate(`/trip/${tripId}`)}
          endIcon={<OpenInNewIcon sx={{ fontSize: "14px !important" }} />}
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
          View Budget
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
    </Box>
  );
};

export default React.memo(ChatBudgetCard);