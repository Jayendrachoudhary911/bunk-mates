import React from "react";
import { Collapse, Paper, Box, Typography, ButtonBase } from "@mui/material";
import PollRoundedIcon from "@mui/icons-material/PollRounded";
import ChecklistRoundedIcon from "@mui/icons-material/ChecklistRounded";
import EventNoteRoundedIcon from "@mui/icons-material/EventNoteRounded";
import AccountBalanceWalletRoundedIcon from "@mui/icons-material/AccountBalanceWalletRounded";
import ReceiptLongRoundedIcon from "@mui/icons-material/ReceiptLongRounded";
import ContactPageRoundedIcon from "@mui/icons-material/ContactPageRounded";

const GroupStructuredActionsMenu = ({
  open,
  onClose,
  hasTrip,
  onSendTimeline,
  onSendChecklist,
  onSendBudget,
  onSendExpenses,
  onOpenCreatePoll,
  onOpenShareContact,
  effectiveChatTheme = "dark",
  isEmbeddedInsideInput = false,
}) => {
  const isDark = effectiveChatTheme === "dark";

  const actionItems = [
    {
      key: "poll",
      label: "Create Poll",
      subLabel: "Vote with group",
      icon: <PollRoundedIcon sx={{ fontSize: 22 }} />,
      color: "#00b7ff",
      show: Boolean(onOpenCreatePoll),
      onClick: onOpenCreatePoll,
    },
    {
      key: "checklist",
      label: "Checklist",
      subLabel: "Shared tasks",
      icon: <ChecklistRoundedIcon sx={{ fontSize: 22 }} />,
      color: "#4caf50",
      show: Boolean(hasTrip && onSendChecklist),
      onClick: onSendChecklist,
    },
    {
      key: "timeline",
      label: "Timeline",
      subLabel: "Trip itinerary",
      icon: <EventNoteRoundedIcon sx={{ fontSize: 22 }} />,
      color: "#ff9800",
      show: Boolean(hasTrip && onSendTimeline),
      onClick: onSendTimeline,
    },
    {
      key: "budget",
      label: "Quick Budget",
      subLabel: "Overview widget",
      icon: <AccountBalanceWalletRoundedIcon sx={{ fontSize: 22 }} />,
      color: "#00e676",
      show: Boolean(hasTrip && onSendBudget),
      onClick: onSendBudget,
    },
    {
      key: "expenses",
      label: "Expenses",
      subLabel: "Detailed ledger",
      icon: <ReceiptLongRoundedIcon sx={{ fontSize: 22 }} />,
      color: "#ffb300",
      show: Boolean(hasTrip && onSendExpenses),
      onClick: onSendExpenses,
    },
    {
      key: "contact",
      label: "Share Profile",
      subLabel: "Contact card",
      icon: <ContactPageRoundedIcon sx={{ fontSize: 22 }} />,
      color: "#ba68c8",
      show: Boolean(onOpenShareContact),
      onClick: onOpenShareContact,
    },
  ].filter((item) => item.show);

  const gridContent = (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: {
          xs: "repeat(3, 1fr)",
          sm: `repeat(${Math.min(actionItems.length, 6)}, 1fr)`,
        },
        gap: 1,
        boxSizing: "border-box",
      }}
    >
      {actionItems.map((item) => (
        <ButtonBase
          key={item.key}
          onClick={() => {
            if (item.onClick) item.onClick();
            if (onClose) onClose();
          }}
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 0.8,
            py: 1.4,
            px: 0.8,
            borderRadius: "20px",
            textAlign: "center",
            bgcolor: isDark
              ? "rgba(255, 255, 255, 0.04)"
              : "rgba(0, 0, 0, 0.035)",
            border: `0px solid`,
            transition: "all 160ms cubic-bezier(0.4, 0, 0.2, 1)",
            "&:hover": {
              bgcolor: isDark
                ? "rgba(255, 255, 255, 0.09)"
                : "rgba(0, 0, 0, 0.07)",
              transform: "translateY(-2px)",
              "& .action-icon-box": {
                transform: "scale(1.08)",
                bgcolor: `${item.color}28`,
              },
            },
            "&:active": {
              transform: "scale(0.96)",
            },
          }}
        >
          <Box
            className="action-icon-box"
            sx={{
              width: 44,
              height: 44,
              borderRadius: "14px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              bgcolor: `${item.color}18`,
              color: item.color,
              flexShrink: 0,
              transition: "all 160ms ease",
            }}
          >
            {item.icon}
          </Box>

          <Box sx={{ minWidth: 0, width: "100%" }}>
            <Typography
              variant="body2"
              noWrap
              sx={{
                fontWeight: 700,
                fontSize: "0.76rem",
                color: isDark ? "#fff" : "#1c1c1e",
                lineHeight: 1.2,
              }}
            >
              {item.label}
            </Typography>
            <Typography
              variant="caption"
              noWrap
              sx={{
                fontSize: "0.64rem",
                color: isDark
                  ? "rgba(255, 255, 255, 0.45)"
                  : "rgba(0, 0, 0, 0.48)",
                display: "block",
                mt: 0.2,
              }}
            >
              {item.subLabel}
            </Typography>
          </Box>
        </ButtonBase>
      ))}
    </Box>
  );

  if (isEmbeddedInsideInput) {
    return gridContent;
  }

  return (
    <Collapse in={open} timeout={220} unmountOnExit>
      <Paper
        elevation={0}
        sx={{
          bgcolor: isDark
            ? "rgba(26, 26, 26, 0.75)"
            : "rgba(245, 247, 250, 0.88)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          color: isDark ? "#fff" : "#111",
          borderRadius: "24px",
          border: `1px solid ${
            isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.06)"
          }`,
          boxShadow: "none",
          p: 1.2,
          mb: 1,
        }}
      >
        {gridContent}
      </Paper>
    </Collapse>
  );
};

export default React.memo(GroupStructuredActionsMenu);