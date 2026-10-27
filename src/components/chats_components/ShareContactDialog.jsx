// src/components/chats_components/ShareContactDialog.jsx
import React, { useState, useEffect } from "react";
import {
  SwipeableDrawer,
  Box,
  Typography,
  Button,
  Avatar,
  IconButton,
  TextField,
  InputAdornment,
  CircularProgress,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import SearchIcon from "@mui/icons-material/Search";
import { doc, getDoc } from "firebase/firestore";
import { db, auth } from "../../firebase";
import { safeImageUrl } from "../../utils/uiHelpers";
import {
  drawerPaperSx,
  drawerBackdropSx,
  DrawerHandle,
} from "../../theme/designSystem";

const ShareContactDialog = ({
  open,
  onClose,
  currentUser,
  onSelectUser,
  onSelectContact,
  isDark = true,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(false);
  const mode = isDark ? "dark" : "light";

  const handleSelect = onSelectContact || onSelectUser;

  useEffect(() => {
    if (!open) return;
    const uid = currentUser?.uid || auth.currentUser?.uid;
    if (!uid) return;

    let isMounted = true;
    const fetchFriends = async () => {
      setLoading(true);
      try {
        const userSnap = await getDoc(doc(db, "users", uid));
        const rawFriends = userSnap.exists()
          ? userSnap.data().friends || []
          : [];

        const friendUids = rawFriends
          .map((f) => (typeof f === "string" ? f : f?.uid || f?.id))
          .filter(Boolean);

        if (friendUids.length === 0) {
          if (isMounted) {
            setFriends([]);
            setLoading(false);
          }
          return;
        }

        const friendDocs = await Promise.all(
          friendUids.map(async (fUid) => {
            try {
              const snap = await getDoc(doc(db, "users", fUid));
              if (snap.exists()) {
                return { uid: fUid, ...snap.data() };
              }
              return null;
            } catch {
              return null;
            }
          })
        );

        if (isMounted) {
          setFriends(friendDocs.filter(Boolean));
          setLoading(false);
        }
      } catch (err) {
        console.error("Error fetching friends for contact share:", err);
        if (isMounted) setLoading(false);
      }
    };

    fetchFriends();
    return () => {
      isMounted = false;
    };
  }, [open, currentUser]);

  const filtered = friends.filter((f) => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    const name = (f.name || f.displayName || "").toLowerCase();
    const username = (f.username || "").toLowerCase();
    return name.includes(q) || username.includes(q);
  });

  return (
    <SwipeableDrawer
      anchor="bottom"
      open={open}
      onClose={onClose}
      onOpen={() => {}}
      disableSwipeToOpen={false}
      ModalProps={{
        BackdropProps: {
          sx: drawerBackdropSx,
        },
      }}
      PaperProps={{
        sx: {
          ...drawerPaperSx(mode, {
            maxHeight: "85vh",
          }),
          overflowY: "auto",
        },
      }}
    >
      <Box sx={{ display: { xs: "block", md: "none" } }}>
        <DrawerHandle mode={mode} />
      </Box>

      <Box sx={{ maxWidth: 500, mx: "auto", width: "100%", boxSizing: "border-box", pt: { xs: 1, md: 2 } }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            pb: 1.5,
          }}
        >
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, fontSize: "1.05rem" }}>
              Share Contact / Profile
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: isDark ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.6)",
                fontSize: "0.74rem",
                display: "block",
              }}
            >
              Select a contact to send their profile into this chat
            </Typography>
          </Box>
          <IconButton size="small" onClick={onClose} sx={{ color: "inherit", opacity: 0.7 }}>
            <CloseIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Box>

        <Box sx={{ py: 1, display: "flex", flexDirection: "column", gap: 1.4 }}>
          <TextField
            size="small"
            placeholder="Search contacts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ fontSize: 18, opacity: 0.6 }} />
                </InputAdornment>
              ),
            }}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: "12px",
                bgcolor: isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.03)",
              },
            }}
          />

          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
              <CircularProgress size={28} sx={{ color: "#00b7ff" }} />
            </Box>
          ) : filtered.length === 0 ? (
            <Box sx={{ p: 3, textAlign: "center", opacity: 0.6 }}>
              <Typography variant="caption">No contacts found</Typography>
            </Box>
          ) : (
            <Box
              sx={{
                maxHeight: 320,
                overflowY: "auto",
                display: "flex",
                flexDirection: "column",
                gap: 0.8,
              }}
            >
              {filtered.map((user) => {
                const name = user.name || user.displayName || "User";
                const photo = safeImageUrl(user.photoURL);
                return (
                  <Box
                    key={user.uid || user.id}
                    onClick={() => {
                      if (handleSelect) handleSelect(user);
                      onClose();
                    }}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1.4,
                      p: 1.1,
                      borderRadius: "12px",
                      bgcolor: isDark ? "rgba(255, 255, 255, 0.04)" : "rgba(0, 0, 0, 0.03)",
                      border: `1px solid ${
                        isDark ? "rgba(255, 255, 255, 0.06)" : "rgba(0, 0, 0, 0.04)"
                      }`,
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                      "&:hover": {
                        bgcolor: isDark
                          ? "rgba(0, 183, 255, 0.12)"
                          : "rgba(0, 183, 255, 0.08)",
                        borderColor: "rgba(0, 183, 255, 0.3)",
                        transform: "translateX(2px)",
                      },
                    }}
                  >
                    <Avatar src={photo} sx={{ width: 40, height: 40, borderRadius: "10px" }}>
                      {name[0]}
                    </Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="body2" sx={{ fontWeight: 700 }} noWrap>
                        {name}
                      </Typography>
                      {user.username && (
                        <Typography variant="caption" sx={{ opacity: 0.6, display: "block" }} noWrap>
                          @{user.username}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                );
              })}
            </Box>
          )}
        </Box>

        <Box sx={{ display: "flex", justifyContent: "flex-end", pt: 1.5, pb: 1 }}>
          <Button onClick={onClose} sx={{ textTransform: "none", color: "inherit", opacity: 0.7 }}>
            Cancel
          </Button>
        </Box>
      </Box>
    </SwipeableDrawer>
  );
};

export default React.memo(ShareContactDialog);
