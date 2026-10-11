import React, { useState } from "react";
import {
    Box,
    Typography,
    Button,
    List,
    ListItem,
    ListItemText,
    Avatar,
    AvatarGroup,
    Paper,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Chip,
    SwipeableDrawer,
    IconButton,
} from "@mui/material";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import PeopleOutline from "@mui/icons-material/PeopleOutline";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import CloseIcon from "@mui/icons-material/Close";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { drawerPaperSx, drawerBackdropSx, DrawerHandle } from "../../theme/designSystem";

export default function BudgetExpensesSection({
    numericBudget = 0,
    totalSpent = 0,
    normalizedContributors = [],
    rawExpenses = [],
    formatCurrency,
    setBudgetDrawerOpen,
    setExpenseDrawerOpen,
    mode,
}) {
    const [expensesDrawerOpen, setExpensesDrawerOpen] = useState(false);

    const spendingPercentage = numericBudget > 0 ? Math.min(100, Math.round((totalSpent / numericBudget) * 100)) : 0;
    const isOverBudget = totalSpent > numericBudget && numericBudget > 0;

    // Semi-Arc (Half Circle) SVG calculations
    const radius = 40;
    const circumference = Math.PI * radius;
    const strokeDashoffset = circumference - (spendingPercentage / 100) * circumference;

    return (
        <>
            <Paper
                elevation={0}
                sx={{
                    p: { xs: 1.5, sm: 2, md: 2.5 },
                    borderRadius: { xs: 3, sm: 4 },
                    minWidth: 0,
                    bgcolor: "transparent",
                    border: "none",
                }}
            >
                {/* Header & Action Buttons */}
                <Box
                    sx={{
                        display: "flex",
                        flexWrap: "wrap",
                        rowGap: 1,
                        columnGap: 1,
                        alignItems: "center",
                        justifyContent: "space-between",
                        mb: 2,
                    }}
                >
                    <Typography variant="subtitle1" fontWeight="bold" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <AccountBalanceWalletIcon fontSize="small" /> Budget & Expenses
                    </Typography>
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
                        <Button
                            variant="outlined"
                            size="small"
                            onClick={() => setBudgetDrawerOpen(true)}
                            sx={{
                                borderRadius: 6,
                                textTransform: "none",
                                fontSize: "0.75rem",
                                color: mode === "dark" ? "#fff" : "#000",
                                backgroundColor: mode === "dark" ? "#ffffff07" : "#00000007",
                                boxShadow: mode === "dark"
                                    ? 'inset 0 1px 1px rgba(255, 255, 255, 0.11), 0 1px 4px rgba(0,0,0,0.1)'
                                    : 'inset 0 1px 1px rgba(0, 0, 0, 0.11), 0 1px 4px rgba(0, 0, 0, 0.07)',
                                backdropFilter: "blur(12px)",
                                border: "none",
                            }}
                        >
                            Set Budget
                        </Button>
                        <Button
                            variant="outlined"
                            size="small"
                            onClick={() => setExpenseDrawerOpen(true)}
                            sx={{
                                borderRadius: 6,
                                textTransform: "none",
                                fontSize: "0.75rem",
                                color: mode === "dark" ? "#fff" : "#000",
                                backgroundColor: mode === "dark" ? "#ffffff07" : "#00000007",
                                boxShadow: mode === "dark"
                                    ? 'inset 0 1px 1px rgba(255, 255, 255, 0.11), 0 1px 4px rgba(0,0,0,0.1)'
                                    : 'inset 0 1px 1px rgba(0, 0, 0, 0.11), 0 1px 4px rgba(0, 0, 0, 0.07)',
                                backdropFilter: "blur(12px)",
                                border: "none",
                            }}
                        >
                            + Expense
                        </Button>
                    </Box>
                </Box>

                {/* Modern Semi-Arc Gauge Card */}
                <Box
                    sx={{
                        p: 2.5,
                        borderRadius: 3.5,
                        bgcolor: mode === "dark" ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)",
                        border: "1px solid divider",
                        mb: 2,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        textAlign: "center",
                        position: "relative",
                        overflow: "hidden",
                    }}
                >
                    {/* SVG Semi-Arc (Half Circle) Gauge */}
                    <Box sx={{ position: "relative", width: 110, height: 60, mb: 1, display: "flex", justifyContent: "center" }}>
                        <svg width="110" height="65" viewBox="0 0 100 55">
                            <path
                                d="M 10 50 A 40 40 0 0 1 90 50"
                                fill="none"
                                stroke={mode === "dark" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}
                                strokeWidth="8"
                                strokeLinecap="round"
                            />
                            <path
                                d="M 10 50 A 40 40 0 0 1 90 50"
                                fill="none"
                                stroke={isOverBudget ? "#f44336" : "#00E676"}
                                strokeWidth="8"
                                strokeDasharray={circumference}
                                strokeDashoffset={strokeDashoffset}
                                strokeLinecap="round"
                                style={{ transition: "stroke-dashoffset 0.8s ease" }}
                            />
                        </svg>
                        <Box sx={{ position: "absolute", bottom: 0, textAlign: "center" }}>
                            <Typography variant="h6" fontWeight={800} sx={{ lineHeight: 1 }}>
                                {spendingPercentage}%
                            </Typography>
                        </Box>
                    </Box>

                    <Chip
                        label={isOverBudget ? "⚠️ Over Budget Limit" : "✨ Spending On Track"}
                        size="small"
                        sx={{
                            height: 20,
                            fontSize: "0.65rem",
                            fontWeight: 700,
                            mb: 2,
                            bgcolor: isOverBudget ? "rgba(244, 67, 54, 0.15)" : "rgba(0, 230, 118, 0.15)",
                            color: isOverBudget ? "#f44336" : "#00E676",
                        }}
                    />

                    <Box sx={{ display: "flex", justifyContent: "space-between", width: "100%", px: 1 }}>
                        <Box textAlign="left">
                            <Typography variant="caption" color="text.secondary" display="block">Total Budget</Typography>
                            <Typography variant="body2" fontWeight="bold">{formatCurrency(numericBudget)}</Typography>
                        </Box>
                        <Box textAlign="right">
                            <Typography variant="caption" color="text.secondary" display="block">Spent So Far</Typography>
                            <Typography variant="body2" fontWeight="bold" color={isOverBudget ? "error.main" : "inherit"}>
                                {formatCurrency(totalSpent)}
                            </Typography>
                        </Box>
                    </Box>
                </Box>

                {/* Member Contributions Accordion */}
                <Accordion
                    elevation={0}
                    sx={{
                        borderRadius: "12px !important",
                        bgcolor: mode === "dark" ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)",
                        border: "1px solid",
                        borderColor: "divider",
                        mb: 2,
                        overflow: "hidden",
                        "&:before": { display: "none" },
                    }}
                >
                    <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ px: 2, py: 0.5 }}>
                        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", mr: 1 }}>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                                <PeopleOutline sx={{ color: "text.secondary", fontSize: 20 }} />
                                <Typography variant="subtitle2" fontWeight={800}>Member Contributions</Typography>
                            </Box>
                            <AvatarGroup max={3} sx={{ "& .MuiAvatar-root": { width: 24, height: 24, fontSize: "0.7rem" } }}>
                                {normalizedContributors.map((m) => (
                                    <Avatar key={m.id} src={m.photoURL} alt={m.name}>{m.name?.charAt(0)}</Avatar>
                                ))}
                            </AvatarGroup>
                        </Box>
                    </AccordionSummary>
                    <AccordionDetails sx={{ p: 2, pt: 0, borderTop: "1px solid divider" }}>
                        <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 1, mt: 1.5 }}>
                            {normalizedContributors.map((member) => (
                                <Box key={member.id} sx={{ p: 1, textAlign: "center", bgcolor: "background.paper", borderRadius: 2, border: "1px solid divider" }}>
                                    <Avatar src={member.photoURL} sx={{ width: 32, height: 32, mx: "auto", mb: 0.5, fontSize: "0.75rem" }}>
                                        {member.name?.charAt(0)}
                                    </Avatar>
                                    <Typography variant="caption" fontWeight={700} noWrap display="block">{member.name}</Typography>
                                    <Typography variant="caption" color="text.secondary">{formatCurrency(member.amount)}</Typography>
                                </Box>
                            ))}
                        </Box>
                    </AccordionDetails>
                </Accordion>

                {/* Recent Expenses Header & List */}
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography variant="subtitle2" fontWeight="bold" sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                        <ReceiptLongIcon fontSize="small" /> Recent Expenses
                    </Typography>
                    {rawExpenses.length > 0 && (
                        <Button
                            size="small"
                            onClick={() => setExpensesDrawerOpen(true)}
                            sx={{ fontSize: "0.7rem", textTransform: "none", fontWeight: 700, minWidth: "auto", p: 0.5 }}
                        >
                            View All ({rawExpenses.length}) <ChevronRightIcon fontSize="small" />
                        </Button>
                    )}
                </Box>
                <List dense sx={{ maxHeight: 150, overflowY: "auto", pr: 0.5 }}>
                    {rawExpenses.length === 0 ? (
                        <Typography variant="body2" color="text.secondary" sx={{ py: 1, textAlign: "center" }}>No expenses recorded yet.</Typography>
                    ) : (
                        rawExpenses.slice(-4).reverse().map((exp, idx) => (
                            <ListItem key={idx} disableGutters sx={{ py: 0.5, borderBottom: "1px solid divider" }}>
                                <ListItemText
                                    primary={<Typography variant="body2" fontWeight="medium">{exp.name || "Expense"}</Typography>}
                                    secondary={<Typography variant="caption" color="text.secondary">{exp.category || "General"} • {exp.date || ""}</Typography>}
                                />
                                <Typography variant="body2" fontWeight="bold">{formatCurrency(exp.amount)}</Typography>
                            </ListItem>
                        ))
                    )}
                </List>
            </Paper>

            {/* ================= VIEW ALL EXPENSES DRAWER ================= */}
            <SwipeableDrawer
                anchor="bottom"
                open={expensesDrawerOpen}
                onClose={() => setExpensesDrawerOpen(false)}
                onOpen={() => {}}
                PaperProps={{
                    sx: drawerPaperSx(mode, { maxHeight: "85vh", borderRadius: "22px 22px 0 0" }),
                }}
                sx={{ "& .MuiBackdrop-root": drawerBackdropSx }}
            >
                <DrawerHandle mode={mode} />

                <Box sx={{ px: 3, pb: 4, pt: 1, maxWidth: 600, mx: "auto", width: "100%", boxSizing: "border-box" }}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2.5}>
                        <Box display="flex" alignItems="center" gap={1.5}>
                            <Typography variant="h6" fontWeight={700}>
                                All Trip Expenses
                            </Typography>
                            <Chip
                                label={formatCurrency(totalSpent)}
                                size="small"
                                color="primary"
                                sx={{ fontWeight: 700, height: 22 }}
                            />
                        </Box>
                        <IconButton size="small" onClick={() => setExpensesDrawerOpen(false)}>
                            <CloseIcon />
                        </IconButton>
                    </Box>

                    <List dense sx={{ maxHeight: "60vh", overflowY: "auto", pr: 0.5 }}>
                        {rawExpenses.length === 0 ? (
                            <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: "center" }}>
                                No expenses recorded yet.
                            </Typography>
                        ) : (
                            [...rawExpenses].reverse().map((exp, idx) => (
                                <ListItem
                                    key={idx}
                                    disableGutters
                                    sx={{
                                        py: 1.2,
                                        px: 2,
                                        mb: 1,
                                        borderRadius: 3,
                                        bgcolor: mode === "dark" ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)",
                                        border: "1px solid divider",
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                    }}
                                >
                                    <ListItemText
                                        primary={
                                            <Typography variant="body2" fontWeight={700}>
                                                {exp.name || "Expense"}
                                            </Typography>
                                        }
                                        secondary={
                                            <Typography variant="caption" color="text.secondary">
                                                {exp.category || "General"} • {exp.date} {exp.time ? `at ${exp.time}` : ""}
                                            </Typography>
                                        }
                                    />
                                    <Typography variant="body1" fontWeight={800} color="primary.main">
                                        {formatCurrency(exp.amount)}
                                    </Typography>
                                </ListItem>
                            ))
                        )}
                    </List>

                    <Button
                        variant="contained"
                        fullWidth
                        onClick={() => {
                            setExpensesDrawerOpen(false);
                            setExpenseDrawerOpen(true);
                        }}
                        sx={{
                            mt: 3,
                            py: 1.3,
                            borderRadius: 3,
                            textTransform: "none",
                            fontWeight: 700,
                            bgcolor: mode === "dark" ? "#fff" : "#000",
                            color: mode === "dark" ? "#000" : "#fff",
                        }}
                    >
                        + Add New Expense
                    </Button>
                </Box>
            </SwipeableDrawer>
        </>
    );
}