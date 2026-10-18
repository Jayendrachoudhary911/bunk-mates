import React, { useState, useEffect, useMemo } from "react";
import {
  Box,
  Typography,
  TextField,
  InputAdornment,
  IconButton,
  SwipeableDrawer,
  Tooltip,
  Avatar,
  CircularProgress,
  Divider,
  Stack,
  Paper,
  Tabs,
  Tab,
  Button,
} from "@mui/material";
import { QRCodeSVG } from "qrcode.react";
import {
  CloseOutlined as CloseOutlinedIcon,
  Share as ShareIcon,
  ContentCopy,
  WhatsApp as WhatsAppIcon,
  Telegram as TelegramIcon,
  Twitter as TwitterIcon,
  Instagram as InstagramIcon,
  Search as SearchIcon,
  QrCode2Outlined as QrCodeIcon,
  Group as PeopleAltIcon,
  Check as CheckIcon,
  Add as AddIcon,
} from "../../icons";
import {
  drawerPaperSx,
  drawerBackdropSx,
  DrawerHandle,
  glassInputSx,
  glassIconBtnSx
} from "../../theme/designSystem";
import { doc, getDoc, updateDoc, collection, getDocs } from "firebase/firestore";

const ShareDrawer = ({
  shareDrawerOpen,
  setShareDrawerOpen,
  inviteLink,
  trip,
  mode,
  setSnackbar,
  user,
  db,
}) => {
  const isDarkMode = mode === "dark";
  const [currentTab, setCurrentTab] = useState(0); // 0: QR & Link, 1: Add Friends
  const [searchFriendQuery, setSearchFriendQuery] = useState("");
  const [friendsList, setFriendsList] = useState([]);
  const [loadingFriends, setLoadingFriends] = useState(false);

  // Fetch account connections
  useEffect(() => {
    if (!user || !shareDrawerOpen) return;

    const fetchFriends = async () => {
      setLoadingFriends(true);
      try {
        const uSnap = await getDoc(doc(db, "users", user.uid));
        let friendIds = [];

        if (uSnap.exists()) {
          friendIds = uSnap.data().friends || [];
        }

        let chunk = [];
        if (friendIds.length > 0) {
          for (const fId of friendIds) {
            const fSnap = await getDoc(doc(db, "users", fId));
            if (fSnap.exists()) {
              const d = fSnap.data();
              chunk.push({
                uid: fSnap.id,
                name: d.name || d.displayName || "Anonymous",
                username: d.username || "",
                photoURL: d.photoURL || "",
              });
            }
          }
        } else {
          const allUsersSnap = await getDocs(collection(db, "users"));
          allUsersSnap.forEach((docSnap) => {
            if (docSnap.id !== user.uid) {
              const d = docSnap.data();
              chunk.push({
                uid: docSnap.id,
                name: d.name || d.displayName || "Anonymous",
                username: d.username || "",
                photoURL: d.photoURL || "",
              });
            }
          });
        }

        setFriendsList(chunk);
      } catch (e) {
        console.error("Failed to load connections:", e);
      } finally {
        setLoadingFriends(false);
      }
    };

    fetchFriends();
  }, [user, shareDrawerOpen, db]);

  // Separate friends into already added vs available to add
  const { addedFriends, availableFriends } = useMemo(() => {
    const filtered = friendsList.filter(
      (f) =>
        f.name.toLowerCase().includes(searchFriendQuery.toLowerCase()) ||
        f.username.toLowerCase().includes(searchFriendQuery.toLowerCase())
    );

    const added = [];
    const available = [];

    filtered.forEach((friend) => {
      if (trip?.members?.includes(friend.uid)) {
        added.push(friend);
      } else {
        available.push(friend);
      }
    });

    return { addedFriends: added, availableFriends: available };
  }, [friendsList, searchFriendQuery, trip?.members]);

  const handleToggleTripCollaborator = async (fUid) => {
    if (!trip?.id) return;
    const isMember = trip.members?.includes(fUid);
    const updatedMembers = isMember
      ? trip.members.filter((id) => id !== fUid)
      : [...(trip.members || []), fUid];

    try {
      await updateDoc(doc(db, "trips", trip.id), { members: updatedMembers });
      await updateDoc(doc(db, "groupChats", trip.id), { members: updatedMembers }).catch(() => {});
      if (setSnackbar) {
        setSnackbar({
          open: true,
          message: isMember ? "Removed from trip" : "Added to trip!",
        });
      }
    } catch (e) {
      console.error(e);
      if (setSnackbar) setSnackbar({ open: true, message: "Failed to update member." });
    }
  };

  const handleClose = () => {
    setShareDrawerOpen(false);
    setSearchFriendQuery("");
    setCurrentTab(0);
  };

  // Reusable Grid Card Component for Users
  const renderUserGridCard = (friend, isAdded) => (
    <Paper
      key={friend.uid}
      elevation={0}
      sx={{
        borderRadius: 5,
        border: "0px solid",
        bgcolor: 'transparent',
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
        position: "relative",
        transition: "all 0.2s ease-in-out",
        "&:hover": {
          transform: "translateY(-1px)",
        },
      }}
    >
      <Avatar
        src={friend.photoURL}
        sx={{
          width: 65,
          height: 65,
          mb: 1,
          fontWeight: 700,
          bgcolor: "primary.main",
          color: "primary.contrastText",
          boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
          border: "0px solid",
        }}
      >
        {friend.name.charAt(0)}
      </Avatar>

      <Typography variant="body2" fontWeight={700} noWrap sx={{ width: "100%", mb: 0.2 }}>
        {friend.name}
      </Typography>
      <Typography variant="caption" color="text.secondary" noWrap sx={{ width: "100%", mb: 1.5, fontSize: "0.7rem" }}>
        {friend.username ? `@${friend.username}` : "Trip Member"}
      </Typography>

      <Button
        variant="contained"
        size="small"
        fullWidth
        onClick={() => handleToggleTripCollaborator(friend.uid)}
        startIcon={isAdded ? <CheckIcon sx={{ fontSize: "14px !important" }} /> : <AddIcon sx={{ fontSize: "14px !important" }} />}
        sx={{
          borderRadius: 6,
          py: 0.6,
          textTransform: "none",
          fontWeight: 700,
          fontSize: "0.72rem",
          boxShadow: "none",
          backgroundColor: isAdded ? "rgba(239, 68, 68, 0.12)" : mode === "dark" ? "rgba(255, 255, 255, 0.09)" : "rgba(0, 0, 0, 0.09)",
          border: "0px solid",
          color: isAdded ? "#F87171" : 'text.primary',
          "&:hover": {
            backgroundColor: isAdded ? "rgba(239, 68, 68, 0.2)" : "rgba(74, 222, 128, 0.25)",
            boxShadow: "none",
          },
        }}
      >
        {isAdded ? "Remove" : "Add"}
      </Button>
    </Paper>
  );

  return (
    <SwipeableDrawer
      anchor="bottom"
      open={shareDrawerOpen}
      onClose={handleClose}
      onOpen={() => {}}
      disableSwipeToOpen
      PaperProps={{
        sx: {
          ...drawerPaperSx(mode, {
            maxHeight: "85vh"
          }),
          overflowY: "auto",
        },
      }}
      ModalProps={{
        BackdropProps: { sx: drawerBackdropSx },
      }}
    >
      <Box sx={{ display: { xs: "block", md: "none" } }}>
        <DrawerHandle mode={mode} />
      </Box>

      <Box
        sx={{
          px: 1,
          pb: { xs: 0, md: 4 },
          pt: { xs: 1, md: 3 },
          maxWidth: 600,
          mx: "auto",
          width: "100%",
          boxSizing: "border-box",
        }}
      >
        {/* Header */}
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Box>
              <Typography variant="h6" fontWeight={700} lineHeight={1.2}>
                Invite your Friends
              </Typography>
            </Box>
          </Stack>

          <IconButton
            onClick={handleClose}
            size="medium"
            sx={glassIconBtnSx(mode, { p: 1, display: { xs: 'none', md: 'flex' } })}
          >
            <CloseOutlinedIcon fontSize="small" />
          </IconButton>
        </Stack>

        {/* Navigation Tabs */}
<Box
  sx={{
    p: 0.75,
    mb: 2.5,
    borderRadius: 8,
    bgcolor: isDarkMode ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
    border: "0px solid",
  }}
>
  <Tabs
    value={currentTab}
    onChange={(e, val) => setCurrentTab(val)}
    variant="fullWidth"
    sx={{
      minHeight: 40,
      "& .MuiTabs-indicator": {
        height: "100%",
        borderRadius: 8,
        bgcolor: isDarkMode ? "rgba(255,255,255,0.1)" : "background.paper",
        boxShadow: 'none',
        zIndex: 1,
        transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
      },
      "& .MuiTab-root": {
        textTransform: "none",
        fontWeight: 700,
        fontSize: "0.82rem",
        minHeight: 40,
        borderRadius: 8,
        zIndex: 2,
        color: "text.secondary",
        transition: "color 0.2s ease-in-out",
        "&.Mui-selected": {
          color: "text.primary",
        },
      },
    }}
  >
    <Tab icon={<QrCodeIcon fontSize="small" />} iconPosition="start" label="QR & Invite Link" />
    <Tab icon={<PeopleAltIcon fontSize="small" />} iconPosition="start" label="Add Friends" />
  </Tabs>
</Box>

        {/* TAB 0: QR Code & Link Share */}
        {currentTab === 0 && (
          <Box>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                mb: 2.5,
                borderRadius: 4,
                border: "0px solid",
                bgcolor: 'transparent',
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                textAlign: "center",
              }}
            >
              <Box
                sx={{
                  width: 210,
                  height: 210,
                  backgroundColor: "#fff",
                  p: 2.5,
                  borderRadius: 6,
                  boxShadow: isDarkMode ? "0 8px 24px rgba(0,0,0,0.5)" : "0 4px 20px rgba(0,0,0,0.08)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  mb: 1.5,
                }}
              >
                <QRCodeSVG value={inviteLink} size={250} bgColor="#fff" fgColor="#000" />
              </Box>
              <Typography variant="caption" color="text.secondary" fontWeight={600}>
                Scan QR code to join trip instantly
              </Typography>
            </Paper>

            <TextField
              fullWidth
              size="small"
              value={inviteLink}
              InputProps={{
                readOnly: true,
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => {
                        navigator.clipboard.writeText(inviteLink);
                        if (setSnackbar) setSnackbar({ open: true, message: "Copied invite link!" });
                      }}
                      size="small"
                      sx={{ color: "primary.main" }}
                    >
                      <ContentCopy fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{ mb: 3, ...glassInputSx(mode) }}
            />

            <Divider sx={{ my: 2, borderColor: isDarkMode ? "rgba(255,255,255,0.08)" : "divider" }} />

            <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ display: "block", mb: 1.5, textAlign: "center", textTransform: "uppercase", letterSpacing: 0.8 }}>
              Share via Social & Apps
            </Typography>

            <Stack direction="row" spacing={1.5} justifyContent="center" alignItems="center">
              <Tooltip title="Share on WhatsApp">
                <IconButton
                  component="a"
                  href={`https://wa.me/?text=${encodeURIComponent(`You're invited to join "${trip?.name}" on BunkMate! 🚀\nTap here: ${inviteLink}`)}`}
                  target="_blank"
                  sx={{ backgroundColor: "#25D366", color: "#fff", p: 1.5, borderRadius: 8 }}
                >
                  <WhatsAppIcon />
                </IconButton>
              </Tooltip>

              <Tooltip title="Share on Telegram">
                <IconButton
                  component="a"
                  href={`https://t.me/share/url?url=${encodeURIComponent(inviteLink)}&text=${encodeURIComponent(`Join "${trip?.name}" on BunkMate! 🚀`)}`}
                  target="_blank"
                  sx={{ backgroundColor: "#229ED9", color: "#fff", p: 1.5, borderRadius: 8 }}
                >
                  <TelegramIcon />
                </IconButton>
              </Tooltip>

              <Tooltip title="Share on X (Twitter)">
                <IconButton
                  component="a"
                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Join my trip "${trip?.name}" on BunkMate! 🌍 ${inviteLink}`)}`}
                  target="_blank"
                  sx={{ backgroundColor: "#1DA1F2", color: "#fff", p: 1.5, borderRadius: 8 }}
                >
                  <TwitterIcon />
                </IconButton>
              </Tooltip>

              <Tooltip title="Copy for Instagram Story">
                <IconButton
                  onClick={() => {
                    navigator.clipboard.writeText(inviteLink);
                    if (setSnackbar) setSnackbar({ open: true, message: "Copied for Instagram Story!" });
                  }}
                  sx={{ backgroundColor: "#E1306C", color: "#fff", p: 1.5, borderRadius: 8 }}
                >
                  <InstagramIcon />
                </IconButton>
              </Tooltip>

              {navigator.share && (
                <Tooltip title="Share via Device Sheet">
                  <IconButton
                    onClick={async () => {
                      try {
                        await navigator.share({
                          title: `Join "${trip?.name}" on BunkMate!`,
                          text: `Hey! Join our trip "${trip?.name}" on BunkMate.`,
                          url: inviteLink,
                        });
                      } catch (e) {
                        console.log("Share cancelled:", e);
                      }
                    }}
                    sx={{ backgroundColor: isDarkMode ? "#ffffff" : "#000000", color: isDarkMode ? "#000" : "#fff", p: 1.5, borderRadius: 8 }}
                  >
                    <ShareIcon />
                  </IconButton>
                </Tooltip>
              )}
            </Stack>
          </Box>
        )}

        {/* TAB 1: Add Friends & Collaborators */}
        {currentTab === 1 && (
          <Box>
            <TextField
              placeholder="Search connections..."
              value={searchFriendQuery}
              onChange={(e) => setSearchFriendQuery(e.target.value)}
              fullWidth
              variant="outlined"
              size="small"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ fontSize: "1.1rem", color: "text.secondary" }} />
                  </InputAdornment>
                ),
              }}
              sx={{ mb: 2, ...glassInputSx(mode) }}
            />

            {loadingFriends ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                <CircularProgress size={24} color="primary" />
              </Box>
            ) : (
              <Box sx={{ maxHeight: "350px", overflowY: "auto", pr: 0.5 }}>
                {/* Already Added Friends Section */}
                {addedFriends.length > 0 && (
                  <Box sx={{ mb: 2.5 }}>
                    <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ display: "block", mb: 1.5, textTransform: "uppercase", letterSpacing: 0.5 }}>
                      Already Added ({addedFriends.length})
                    </Typography>
                    <Box
                      sx={{
                        display: "grid",
                        gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                        gap: 1.5,
                      }}
                    >
                      {addedFriends.map((friend) => renderUserGridCard(friend, true))}
                    </Box>
                  </Box>
                )}

                {/* Available Friends Section */}
                <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ display: "block", mb: 1.5, textTransform: "uppercase", letterSpacing: 0.5 }}>
                  Available Connections ({availableFriends.length})
                </Typography>
                
                {availableFriends.length === 0 ? (
                  <Typography variant="caption" color="text.secondary" sx={{ textAlign: "center", display: "block", py: 3 }}>
                    No other connections found.
                  </Typography>
                ) : (
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                      gap: 1.5,
                    }}
                  >
                    {availableFriends.map((friend) => renderUserGridCard(friend, false))}
                  </Box>
                )}
              </Box>
            )}
          </Box>
        )}
      </Box>
    </SwipeableDrawer>
  );
};

export default ShareDrawer;