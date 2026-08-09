import React, { useState, useEffect, useMemo } from "react";
import {
  Box,
  Typography,
  Button,
  TextField,
  InputAdornment,
  IconButton,
  SwipeableDrawer,
  Tooltip,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  CircularProgress,
  Divider,
  Stack
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
  Add as AddIcon,
} from "../../icons";
import {
  designTokens,
  glass,
  cardHover,
  drawerPaperSx,
  drawerBackdropSx,
  DrawerHandle,
  glassInputSx,
  ctaButtonSx,
} from "../../theme/designSystem";
import { doc, getDoc, updateDoc } from "firebase/firestore";

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
        if (uSnap.exists()) {
          const friendIds = uSnap.data().friends || [];
          const chunk = [];
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
          setFriendsList(chunk);
        }
      } catch (e) {
        console.error("Failed to load friend connections:", e);
      } finally {
        setLoadingFriends(false);
      }
    };

    fetchFriends();
  }, [user, shareDrawerOpen, db]);

  const filteredFriends = useMemo(() => {
    return friendsList.filter((f) =>
      f.name.toLowerCase().includes(searchFriendQuery.toLowerCase())
    );
  }, [friendsList, searchFriendQuery]);

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

  return (
    <SwipeableDrawer
      anchor="bottom"
      open={shareDrawerOpen}
      onClose={() => {
        setShareDrawerOpen(false);
        setSearchFriendQuery("");
      }}
      onOpen={() => {}}
      disableSwipeToOpen
      sx={{ zIndex: 1500 }}
      PaperProps={{
        sx: {
          ...drawerPaperSx(mode),
          maxHeight: "85vh",
          overflowY: "auto",
        },
      }}
      ModalProps={{
        BackdropProps: { sx: drawerBackdropSx },
      }}
    >
      <DrawerHandle mode={mode} />

      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
        <Typography variant="h6" fontWeight={900} letterSpacing="-0.5px">
          Trip Invite & Access Network
        </Typography>
        <IconButton onClick={() => setShareDrawerOpen(false)}>
          <CloseOutlinedIcon />
        </IconButton>
      </Box>

      {/* QR Code */}
      <Box sx={{ mb: 2.5, display: "flex", justifyContent: "center" }}>
        <Box
          sx={{
            width: 180,
            height: 180,
            backgroundColor: "#fff",
            p: 1.5,
            borderRadius: 4,
            boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <QRCodeSVG value={inviteLink} size={160} bgColor="#fff" fgColor="#000" />
        </Box>
      </Box>

      {/* Invite Link Text Field */}
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
              >
                <ContentCopy fontSize="small" />
              </IconButton>
            </InputAdornment>
          ),
        }}
        sx={{
          mb: 2,
          "& .MuiOutlinedInput-root": {
            borderRadius: 3,
            bgcolor: isDarkMode ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
          },
        }}
      />

      {/* Direct Friends Search Section */}
      <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 1, mt: 1 }}>
        Add Connections Directly
      </Typography>

      <TextField
        placeholder="Search account connections..."
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
        sx={{
          mb: 1.5,
          "& .MuiOutlinedInput-root": {
            borderRadius: 3,
            bgcolor: isDarkMode ? "rgba(0, 0, 0, 0.2)" : "rgba(255, 255, 255, 0.2)",
          },
        }}
      />

      {loadingFriends ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
          <CircularProgress size={24} color="inherit" />
        </Box>
      ) : (
        <List dense sx={{ width: "100%", maxHeight: "180px", overflowY: "auto", mb: 2 }}>
          {filteredFriends.map((friend) => {
            const isAdded = trip?.members?.includes(friend.uid);
            const isAdmin = trip?.createdBy === user?.uid;

            return (
              <ListItem
                key={friend.uid}
                disablePadding
                secondaryAction={
                  isAdded ? (
                    isAdmin ? (
                      <Button
                        onClick={() => handleToggleTripCollaborator(friend.uid)}
                        size="small"
                        sx={{
                          borderRadius: 3,
                          height: 26,
                          textTransform: "none",
                          fontWeight: 700,
                          fontSize: "0.72rem",
                          backgroundColor: "rgba(74, 222, 128, 0.15)",
                          border: "1px solid rgba(74, 222, 128, 0.3)",
                          color: "#4ADE80",
                          "&:hover": {
                            backgroundColor: "rgba(239, 68, 68, 0.15)",
                            color: "#F87171",
                          },
                        }}
                      >
                        Active
                      </Button>
                    ) : (
                      <Box
                        sx={{
                          px: 1.5,
                          height: 26,
                          borderRadius: 3,
                          bgcolor: "action.hover",
                          fontSize: "0.72rem",
                          fontWeight: 700,
                        }}
                      >
                        Active
                      </Box>
                    )
                  ) : (
                    <IconButton
                      edge="end"
                      onClick={() => handleToggleTripCollaborator(friend.uid)}
                      sx={{ borderRadius: 3, width: 30, height: 30 }}
                    >
                      <AddIcon fontSize="small" />
                    </IconButton>
                  )
                }
                sx={{ py: 0.8 }}
              >
                <ListItemAvatar>
                  <Avatar src={friend.photoURL} sx={{ width: 36, height: 36, fontWeight: 800 }}>
                    {friend.name.charAt(0)}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={friend.name}
                  secondary={`@${friend.username}`}
                  primaryTypographyProps={{ fontWeight: 700, fontSize: "0.85rem" }}
                  secondaryTypographyProps={{ fontSize: "0.72rem" }}
                />
              </ListItem>
            );
          })}
        </List>
      )}

      <Divider sx={{ my: 2 }} />

      {/* Device & Social Share Options */}
      <Stack direction="row" spacing={1.5} justifyContent="center" alignItems="center">
        <Tooltip title="Share on WhatsApp">
          <IconButton
            component="a"
            href={`https://wa.me/?text=${encodeURIComponent(`You're invited to join "${trip?.name}" on BunkMate! 🚀\nTap here: ${inviteLink}`)}`}
            target="_blank"
            sx={{ backgroundColor: "#25D366", color: "#fff", p: 1.5 }}
          >
            <WhatsAppIcon />
          </IconButton>
        </Tooltip>

        <Tooltip title="Share on Telegram">
          <IconButton
            component="a"
            href={`https://t.me/share/url?url=${encodeURIComponent(inviteLink)}&text=${encodeURIComponent(`Join "${trip?.name}" on BunkMate! 🚀`)}`}
            target="_blank"
            sx={{ backgroundColor: "#229ED9", color: "#fff", p: 1.5 }}
          >
            <TelegramIcon />
          </IconButton>
        </Tooltip>

        <Tooltip title="Share on X (Twitter)">
          <IconButton
            component="a"
            href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Join my trip "${trip?.name}" on BunkMate! 🌍 ${inviteLink}`)}`}
            target="_blank"
            sx={{ backgroundColor: "#1DA1F2", color: "#fff", p: 1.5 }}
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
            sx={{ backgroundColor: "#E1306C", color: "#fff", p: 1.5 }}
          >
            <InstagramIcon />
          </IconButton>
        </Tooltip>

        {navigator.share && (
          <Tooltip title="Share via Native Device">
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
              sx={{ backgroundColor: isDarkMode ? "#ffffff" : "#000000", color: isDarkMode ? "#000" : "#fff", p: 1.5 }}
            >
              <ShareIcon />
            </IconButton>
          </Tooltip>
        )}
      </Stack>
    </SwipeableDrawer>
  );
};

export default ShareDrawer;