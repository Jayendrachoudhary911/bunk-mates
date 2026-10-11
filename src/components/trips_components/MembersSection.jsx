import React, { useState } from "react";
import {
    Box,
    Typography,
    Button,
    List,
    ListItem,
    Avatar,
    AvatarGroup,
    Paper,
    Chip,
    SwipeableDrawer,
    IconButton,
    Tooltip,
} from "@mui/material";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import CloseIcon from "@mui/icons-material/Close";
import StarIcon from "@mui/icons-material/Star";
import SupervisorAccountIcon from "@mui/icons-material/SupervisorAccount";
import { drawerPaperSx, drawerBackdropSx, DrawerHandle } from "../../theme/designSystem";

export default function MembersSection({
    memberDetails = [],
    currentUseruid,
    trip = {},
    tripAdmins = [],
    userData = {},
    navigate,
    setShareDrawerOpen,
    mode,
}) {
    const [membersDrawerOpen, setMembersDrawerOpen] = useState(false);

    // Helper to resolve nickname from current user's document or fallback to name/You
    const getMemberDisplayName = (user) => {
        const uid = user.uid;
        const userNicknames = userData?.nicknames || {};
        const customNickname = typeof userNicknames === "object" ? userNicknames[uid] : null;

        if (customNickname) {
            return customNickname;
        }
        if (uid === currentUseruid) {
            return `${user.name || "You"} (Me)`;
        }
        return user.name || "Unknown";
    };

    const ownerUid = trip?.createdBy;

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
                {/* Header with Title, Count & Invite Button */}
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
                    <Box display="flex" alignItems="center" gap={1}>
                        <Typography variant="subtitle1" fontWeight="bold">
                            Members
                        </Typography>
                        <Chip
                            label={memberDetails.length}
                            size="small"
                            sx={{
                                height: 20,
                                fontSize: "0.7rem",
                                fontWeight: 700,
                                bgcolor: mode === "dark" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)",
                                color: mode === "dark" ? "#fff" : "#000",
                            }}
                        />
                    </Box>
                    <Button
                        size="small"
                        variant="outlined"
                        startIcon={<PersonAddIcon sx={{ fontSize: "14px !important" }} />}
                        onClick={() => setShareDrawerOpen(true)}
                        sx={{
                            borderRadius: 6,
                            fontSize: "0.7rem",
                            textTransform: "none",
                            color: mode === "dark" ? "#fff" : "#000",
                            backgroundColor: mode === "dark" ? "#ffffff07" : "#00000007",
                            boxShadow: mode === "dark"
                                ? 'inset 0 1px 1px rgba(255, 255, 255, 0.11), 0 1px 4px rgba(0,0,0,0.1)'
                                : 'inset 0 1px 1px rgba(0, 0, 0, 0.11), 0 1px 4px rgba(0, 0, 0, 0.07)',
                            backdropFilter: "blur(12px)",
                            border: "none",
                        }}
                    >
                        Invite
                    </Button>
                </Box>

                {/* Avatar Group Preview with Tooltips */}
                <Box
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        p: 1.5,
                        borderRadius: 6,
                        bgcolor: mode === "dark" ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)",
                        border: "0px solid divider",
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                        "&:hover": { borderColor: "primary.main" },
                    }}
                    onClick={() => setMembersDrawerOpen(true)}
                >
                    <AvatarGroup
                        max={6}
                        sx={{
                            "& .MuiAvatar-root": {
                                width: 34,
                                height: 34,
                                fontSize: "0.75rem",
                                fontWeight: 700,
                                border: "2px solid",
                                borderColor: mode === "dark" ? "#1e1e1e" : "#fff",
                            },
                        }}
                    >
                        {memberDetails.map((user) => {
                            const name = getMemberDisplayName(user);
                            const roleBadge = user.uid === ownerUid ? " [Owner]" : tripAdmins.includes(user.uid) ? " [Admin]" : "";
                            return (
                                <Tooltip key={user.uid} title={`${name}${roleBadge}`} arrow placement="top">
                                    <Avatar src={user.photoURL} alt={user.name}>
                                        {user.name?.charAt(0)?.toUpperCase() || "U"}
                                    </Avatar>
                                </Tooltip>
                            );
                        })}
                    </AvatarGroup>
                    <Box display="flex" alignItems="center" gap={0.5}>
                        <Typography variant="caption" fontWeight={700} color="text.secondary">
                            View All
                        </Typography>
                        <ChevronRightIcon fontSize="small" sx={{ color: "text.secondary" }} />
                    </Box>
                </Box>
            </Paper>

            {/* ================= VIEW ALL MEMBERS DRAWER (GRID LAYOUT) ================= */}
            <SwipeableDrawer
                anchor="bottom"
                open={membersDrawerOpen}
                onClose={() => setMembersDrawerOpen(false)}
                onOpen={() => {}}
                PaperProps={{
                    sx: drawerPaperSx(mode, { maxHeight: "85vh" }),
                }}
                sx={{ "& .MuiBackdrop-root": drawerBackdropSx }}
            >
                <DrawerHandle mode={mode} />

                <Box sx={{ px: 1, pb: { xs: 0, md: 4 }, pt: 1, maxWidth: 800, mx: "auto", width: "100%", boxSizing: "border-box" }}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2.5}>
                        <Box display="flex" alignItems="center" gap={1.5}>
                            <Typography variant="h6" fontWeight={700}>
                                Trip Members
                            </Typography>
                            <Chip
                                label={memberDetails.length}
                                size="small"
                                sx={{ fontWeight: 700, height: 22 }}
                            />
                        </Box>
                        <IconButton size="small" sx={{ display: { xs: "none", sm: "block" } }} onClick={() => setMembersDrawerOpen(false)}>
                            <CloseIcon />
                        </IconButton>
                    </Box>

                    {/* Grid Layout: 3 columns on mobile, 5 columns on desktop */}
                    <Box
                        sx={{
                            display: "grid",
                            gridTemplateColumns: { xs: "repeat(3, minmax(0, 1fr))", sm: "repeat(5, minmax(0, 1fr))" },
                            gap: 1.5,
                            maxHeight: "55vh",
                            overflowY: "auto",
                            pr: 0.5,
                            pb: 1,
                        }}
                    >
                        {memberDetails.map((user) => {
                            const name = getMemberDisplayName(user);
                            const isOwner = user.uid === ownerUid;
                            const isAdmin = tripAdmins.includes(user.uid);

                            return (
                                <Box
                                    key={user.uid}
                                    sx={{
                                        display: "flex",
                                        flexDirection: "column",
                                        alignItems: "center",
                                        textAlign: "center",
                                        p: 1.5,
                                        borderRadius: 6,
                                        bgcolor: { xs: 'transparent', md: mode === "dark" ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)" },
                                        border: "1px solid divider",
                                        cursor: "pointer",
                                        position: "relative",
                                        transition: "transform 0.15s ease, borderColor 0.15s ease",
                                        "&:hover": {
                                            borderColor: "primary.main",
                                            bgcolor: mode === "dark" ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
                                        },
                                    }}
                                    onClick={() => {
                                        setMembersDrawerOpen(false);
                                        navigate(`/chat/${user.uid}`);
                                    }}
                                >
                                    {/* Avatar with Overlaid Badge */}
                                    <Box sx={{ position: "relative", mb: 1 }}>
                                        <Tooltip title={`Chat with ${name}`} arrow placement="top">
                                            <Avatar
                                                src={user.photoURL}
                                                sx={{ width: 65, height: 65, fontWeight: 700, fontSize: "1rem" }}
                                            >
                                                {user.name?.charAt(0)?.toUpperCase() || "U"}
                                            </Avatar>
                                        </Tooltip>

                                        {/* Owner or Admin Overlaid Badge */}
                                        {isOwner && (
                                            <Box
                                                sx={{
                                                    position: "absolute",
                                                    bottom: -2,
                                                    right: -2,
                                                    bgcolor: "#FFD700",
                                                    color: "#000",
                                                    borderRadius: "50%",
                                                    width: 20,
                                                    height: 20,
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    border: "2px solid",
                                                    borderColor: mode === "dark" ? "#1e1e1e" : "#fff",
                                                    boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                                                }}
                                                title="Owner"
                                            >
                                                <StarIcon sx={{ fontSize: "11px !important" }} />
                                            </Box>
                                        )}
                                        {!isOwner && isAdmin && (
                                            <Box
                                                sx={{
                                                    position: "absolute",
                                                    bottom: -2,
                                                    right: -2,
                                                    bgcolor: "#2196f3",
                                                    color: "#fff",
                                                    borderRadius: "50%",
                                                    width: 20,
                                                    height: 20,
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    border: "2px solid",
                                                    borderColor: mode === "dark" ? "#1e1e1e" : "#fff",
                                                    boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                                                }}
                                                title="Admin"
                                            >
                                                <SupervisorAccountIcon sx={{ fontSize: "11px !important" }} />
                                            </Box>
                                        )}
                                    </Box>

                                    <Typography
                                        variant="body2"
                                        fontWeight="bold"
                                        noWrap
                                        sx={{ width: "100%", fontSize: "0.8rem", mb: 0.25 }}
                                    >
                                        {name}
                                    </Typography>
                                    <Typography
                                        variant="caption"
                                        color="text.secondary"
                                        noWrap
                                        sx={{ width: "100%", fontSize: "0.68rem", opacity: 0.85 }}
                                    >
                                        {user.email || "No email"}
                                    </Typography>
                                </Box>
                            );
                        })}
                    </Box>

                    <Button
                        variant="contained"
                        fullWidth
                        startIcon={<PersonAddIcon />}
                        sx={{
                            mt: 3,
                            py: 1.3,
                            borderRadius: 8,
                            textTransform: "none",
                            fontWeight: 700,
                            bgcolor: mode === "dark" ? "#fff" : "#000",
                            color: mode === "dark" ? "#000" : "#fff",
                        }}
                        onClick={() => {
                            setMembersDrawerOpen(false);
                            setShareDrawerOpen(true);
                        }}
                    >
                        Invite More Members
                    </Button>
                </Box>
            </SwipeableDrawer>
        </>
    );
}