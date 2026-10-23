import React, { useState } from "react";
import {
    Box,
    Typography,
    Button,
    List,
    ListItem,
    ListItemAvatar,
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
import { drawerPaperSx, drawerBackdropSx, DrawerHandle, glassIconBtnSx } from "../../theme/designSystem";

export default function BudgetExpensesSection({
    numericBudget = 0,
    totalSpent = 0,
    normalizedContributors = [],
    rawExpenses = [],
    formatCurrency,
    setBudgetDrawerOpen,
    setExpenseDrawerOpen,
    mode,
    currentUserId,
    userData,
}) {
    const [expensesDrawerOpen, setExpensesDrawerOpen] = useState(false);

    const spendingPercentage = numericBudget > 0 ? Math.min(100, Math.round((totalSpent / numericBudget) * 100)) : 0;
    const isOverBudget = totalSpent > numericBudget && numericBudget > 0;

    // Semi-Arc (Half Circle) SVG calculations
    const radius = 40;
    const circumference = Math.PI * radius;
    const strokeDashoffset = circumference - (spendingPercentage / 100) * circumference;

    // Helper to get the correct display name based on current user ID looking up the nicknames map
    const getDisplayName = (member) => {
        if (userData?.nicknames && typeof userData.nicknames === "object") {
            if (member?.id && userData.nicknames[member.id]) {
                return userData.nicknames[member.id];
            }
        }
        return member?.name || "Unnamed";
    };

    // Helper for category 3D symbol / emoji representation
    const getCategoryAvatar = (category) => {
        const cat = (category || "").toLowerCase();
        if (cat.includes("food") || cat.includes("restaurant") || cat.includes("dining") || cat.includes("cafe")) return "🍔";
        if (cat.includes("transport") || cat.includes("travel") || cat.includes("flight") || cat.includes("taxi") || cat.includes("cab")) return "🚗";
        if (cat.includes("hotel") || cat.includes("stay") || cat.includes("accommodation")) return "🏨";
        if (cat.includes("shop") || cat.includes("shopping") || cat.includes("store")) return "🛍️";
        if (cat.includes("activity") || cat.includes("fun") || cat.includes("ticket") || cat.includes("tour")) return "🎢";
        return "🏷️";
    };


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
                        borderRadius: 6,
                        bgcolor: mode === "dark" ? "rgba(255,255,255,0)" : "rgba(0,0,0,0)",
                        border: "0px solid divider",
                        mb: 2,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        textAlign: "center",
                        position: "relative",
                        overflow: "hidden",
                    }}
                >
                    <Box sx={{ position: "relative", width: 160, height: 110, mb: 1, display: "flex", justifyContent: "center" }}>
                        <svg width="160" height="110" viewBox="0 0 100 55" style={{ overflow: "visible" }}>
                            <path
                                d="M 0 70 A 40 40 0 0 1 100 70"
                                fill="none"
                                stroke={mode === "dark" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}
                                strokeWidth="18"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                            <path
                                d="M 0 70 A 40 40 0 0 1 100 70"
                                fill="none"
                                stroke={isOverBudget ? "#f44336" : mode === "dark" ? "#ffffff" : "#0c0c0c"}
                                strokeWidth="18"
                                strokeDasharray={circumference}
                                strokeDashoffset={strokeDashoffset}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                style={{ 
                                    transition: "stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1)",
                                    filter: isOverBudget ? "drop-shadow(0px 2px 6px rgba(244,67,54,0.4))" : "drop-shadow(0px 2px 6px rgba(255, 255, 255, 0.3))"
                                }}
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
                            fontWeight: 600,
                            mb: 2,
                            bgcolor: isOverBudget ? "rgba(244, 67, 54, 0.15)" : mode === "dark" ? "rgba(255, 255, 255, 0.15)" : "rgba(12, 12, 12, 0.15)",
                            color: isOverBudget ? "#f44336" : mode === "dark" ? "#ffffff" : "#0c0c0c",
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
                        borderRadius: 6,
                        bgcolor: mode === "dark" ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)",
                        border: "0px solid",
                        mb: 2,
                        overflow: "hidden",
                        "&:before": { display: "none" },
                    }}
                >
                    <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ px: 2, py: 0.5 }}>
                        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", mr: 1 }}>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                                <PeopleOutline sx={{ color: "text.secondary", fontSize: 20 }} />
                                <Typography variant="subtitle2" fontWeight={800}>Trip Contrii's</Typography>
                            </Box>
                            <AvatarGroup max={3} sx={{ "& .MuiAvatar-root": { width: 24, height: 24, fontSize: "0.7rem" } }}>
                                {normalizedContributors.map((m) => {
                                    const displayName = getDisplayName(m);
                                    return (
                                        <Avatar key={m.id} src={m.photoURL} alt={displayName}>
                                            {displayName.charAt(0)}
                                        </Avatar>
                                    );
                                })}
                            </AvatarGroup>
                        </Box>
                    </AccordionSummary>
                    <AccordionDetails sx={{ p: 2, pt: 0, borderTop: "1px solid divider" }}>
                        <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 1, mt: 1.5 }}>
                            {normalizedContributors.map((member) => {
                                const displayName = getDisplayName(member);

                                return (
                                    <Box
                                        key={member.id}
                                        sx={{
                                            p: 0,
                                            textAlign: "center",
                                            borderRadius: 3,
                                            border: "0px solid",
                                            bgcolor: 'transparent',
                                            transition: "all 0.2s ease-in-out",
                                            "&:hover": {
                                                transform: "translateY(-1px)",
                                            },
                                        }}
                                    >
                                        <Avatar
                                            src={member.photoURL}
                                            sx={{
                                                width: 62,
                                                height: 62,
                                                mx: "auto",
                                                mb: 1,
                                                fontSize: "0.9rem",
                                                fontWeight: 700,
                                                bgcolor: "primary.main",
                                                color: "primary.contrastText",
                                                border: "0px solid",
                                            }}
                                        >
                                            {displayName.charAt(0)}
                                        </Avatar>
                                        <Typography
                                            variant="body2"
                                            fontWeight={700}
                                            noWrap
                                            display="block"
                                            sx={{ mb: 0.2 }}
                                        >
                                            {displayName}
                                        </Typography>
                                        <Typography
                                            variant="caption"
                                            color="primary.main"
                                            fontWeight={600}
                                            display="block"
                                            sx={{ opacity: 0.9 }}
                                        >
                                            {formatCurrency(member.amount || 0)}
                                        </Typography>
                                    </Box>
                                );
                            })}
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
                            sx={glassIconBtnSx(mode, { p: 1, pl: 2, pb: 0.6, display: 'flex' })}
                        >
                            View All ({rawExpenses.length}) <ChevronRightIcon fontSize="small" />
                        </Button>
                    )}
                </Box>

                <Box sx={{ overflow: "hidden" }}>
                    <List dense sx={{ p: 0, m: 0 }}>
                        {rawExpenses.length === 0 ? (
                            <Typography variant="body2" color="text.secondary" sx={{ py: 1, textAlign: "center" }}>No expenses recorded yet.</Typography>
                        ) : (
                            rawExpenses
                                .slice(-7)
                                .reverse()
                                .filter((_, idx) => {
                                    const isMobile = window.innerWidth < 900;
                                    return isMobile ? idx < 4 : true;
                                })
                                .map((exp, idx) => (
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
                </Box>
            </Paper>

            {/* ================= VIEW ALL EXPENSES DRAWER (NOTEBOOK PAPER STYLE) ================= */}
            <SwipeableDrawer
                anchor="bottom"
                open={expensesDrawerOpen}
                onClose={() => setExpensesDrawerOpen(false)}
                onOpen={() => {}}
                PaperProps={{
                        sx: {
                          ...drawerPaperSx(mode, {
                            maxHeight: "85vh"
                          }),
                          overflowY: "auto",
                        },
                }}
                sx={{ "& .MuiBackdrop-root": drawerBackdropSx }}
            >
                <Box sx={{ display: { xs: "block", md: "none" } }}>
                    <DrawerHandle mode={mode} />
                </Box>

                <Box sx={{ px: 2, pb: { xs: 2, md: 4 }, pt: 1, maxWidth: 600, mx: "auto", width: "100%", boxSizing: "border-box" }}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} sx={{ borderBottom: "2px dashed", borderColor: mode === "dark" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)", pb: 1.5 }}>
                        <Box display="flex" alignItems="center" gap={1.5}>
                            <Typography variant="h6" fontWeight={800} sx={{ fontFamily: "monospace", letterSpacing: "-0.5px" }}>
                                📓 All Trip Expenses
                            </Typography>
                            <Chip
                                label={formatCurrency(totalSpent)}
                                size="small"
                                sx={{
                                    fontWeight: 800,
                                    height: 24,
                                    bgcolor: mode === "dark" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)",
                                    color: mode === "dark" ? "#fff" : "#000",
                                }}
                            />
                        </Box>
                        <IconButton size="small" sx={glassIconBtnSx(mode, { p: 1, display: { xs: 'none', md: 'flex' } })} onClick={() => setExpensesDrawerOpen(false)}>
                            <CloseIcon />
                        </IconButton>
                    </Box>

                    <List dense sx={{ maxHeight: "62vh", overflowY: "auto", pr: 0.5 }}>
                        {rawExpenses.length === 0 ? (
                            <Typography variant="body2" color="text.secondary" sx={{ py: 6, textAlign: "center", fontStyle: "italic" }}>
                                No expenses recorded in the notebook yet.
                            </Typography>
                        ) : (
                            [...rawExpenses].reverse().map((exp, idx) => (
                                <ListItem
                                    key={idx}
                                    disableGutters
                                    sx={{
                                        py: 0.5,
                                        px: 0,
                                        mb: 1.5,
                                        bgcolor: 'transparent',
                                        borderBottom: "1.5px dashed",
                                        borderColor: mode === "dark" ? "rgba(255, 255, 255, 0.13)" : "rgba(0,0,0,0.06)",
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                    }}
                                >
                                    <ListItemAvatar sx={{ minWidth: 48 }}>
                                        <Avatar
                                            sx={{
                                                width: 40,
                                                height: 40,
                                                fontSize: "1.2rem",
                                                bgcolor: mode === "dark" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.04)",
                                                boxShadow: "inset 0 1px 2px rgba(255,255,255,0.2)",
                                            }}
                                        >
                                            {getCategoryAvatar(exp.category)}
                                        </Avatar>
                                    </ListItemAvatar>
                                    <ListItemText
                                        primary={
                                            <Typography variant="body2" fontWeight={800} sx={{ letterSpacing: "-0.2px" }}>
                                                {exp.name || "Expense"}
                                            </Typography>
                                        }
                                        secondary={
                                            <Typography variant="caption" color="text.secondary" fontWeight={500}>
                                                {exp.category || "General"} • {typeof exp.date === "object" && exp.date !== null ? (exp.date instanceof Date ? exp.date.toLocaleDateString() : (exp.date.toDate ? exp.date.toDate().toLocaleDateString() : "")) : String(exp.date || "")} {exp.time ? `at ${typeof exp.time === "object" && exp.time !== null ? (exp.time instanceof Date ? exp.time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "") : String(exp.time)}` : ""}
                                            </Typography>
                                        }
                                    />
                                    <Typography variant="body1" fontWeight={900} color="primary.main" sx={{ fontFamily: "monospace" }}>
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
                            py: 1.4,
                            borderRadius: 6,
                            textTransform: "none",
                            fontWeight: 800,
                            letterSpacing: "0.2px",
                            bgcolor: mode === "dark" ? "#fff" : "#000",
                            color: mode === "dark" ? "#000" : "#fff",
                            boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
                            "&:hover": {
                                bgcolor: mode === "dark" ? "rgba(255,255,255,0.9)" : "rgba(0,0,0,0.85)",
                            },
                        }}
                    >
                        + Add New Expense
                    </Button>
                </Box>
            </SwipeableDrawer>
        </>
    );
}