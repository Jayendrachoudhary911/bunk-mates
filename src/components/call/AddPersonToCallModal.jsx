import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  TextField,
  IconButton,
  Avatar,
  Button,
  Stack,
  InputAdornment,
  Chip,
  CircularProgress,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import SearchIcon from "@mui/icons-material/Search";
import PersonAddAlt1Icon from "@mui/icons-material/PersonAddAlt1";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import CheckIcon from "@mui/icons-material/Check";
import GroupAddIcon from "@mui/icons-material/GroupAdd";
import { collection, getDocs, query, limit } from "firebase/firestore";
import { db } from "../../firebase";
import { useCall } from "../../contexts/CallContext";
import { resolveAvatar, DEFAULT_CALLER_AVATAR } from "./CallAssets";

export default function AddPersonToCallModal({ open, onClose }) {
  const { activeCall, inviteUserToCall, groupParticipants, currentUser } = useCall();
  const [searchTerm, setSearchTerm] = useState("");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [invitedIds, setInvitedIds] = useState(new Set());
  const [copiedLink, setCopiedLink] = useState(false);

  // Fetch available users / friends from Firestore
  useEffect(() => {
    if (!open) return;

    let isMounted = true;
    setLoading(true);

    const fetchFriends = async () => {
      try {
        const myUid = currentUser?.uid;
        const usersSnap = await getDocs(query(collection(db, "users"), limit(40)));
        const list = [];
        usersSnap.forEach((docSnap) => {
          const data = docSnap.data();
          const uid = docSnap.id;
          if (uid !== myUid) {
            list.push({
              uid,
              name: data.displayName || data.name || data.username || "User",
              username: data.username || "",
              photoURL: data.photoURL || "",
              email: data.email || "",
            });
          }
        });

        // Also merge any existing group members passed in activeCall
        if (activeCall?.members && Array.isArray(activeCall.members)) {
          activeCall.members.forEach((m) => {
            const mUid = m.uid || m.id;
            if (mUid && mUid !== myUid && !list.some((u) => u.uid === mUid)) {
              list.unshift({
                uid: mUid,
                name: m.name || m.displayName || m.username || "Member",
                username: m.username || "",
                photoURL: m.photoURL || "",
              });
            }
          });
        }

        if (isMounted) {
          setUsers(list);
          setLoading(false);
        }
      } catch (err) {
        console.warn("Could not fetch users to invite:", err);
        if (isMounted) setLoading(false);
      }
    };

    fetchFriends();

    return () => {
      isMounted = false;
    };
  }, [open, activeCall, currentUser]);

  const handleInvite = async (targetUser) => {
    if (!targetUser || !targetUser.uid) return;
    setInvitedIds((prev) => new Set(prev).add(targetUser.uid));
    try {
      if (inviteUserToCall) {
        await inviteUserToCall(targetUser);
      }
    } catch (e) {
      console.warn("Error inviting user to call:", e);
    }
  };

  const handleCopyLink = () => {
    const callUrl = `${window.location.origin}/chats?call_id=${activeCall?.callID || ""}`;
    navigator.clipboard.writeText(callUrl).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    });
  };

  // Determine who is already in the call
  const activeUids = new Set();
  if (activeCall?.callerId) activeUids.add(activeCall.callerId);
  if (activeCall?.receiverId) activeUids.add(activeCall.receiverId);
  if (groupParticipants && Array.isArray(groupParticipants)) {
    groupParticipants.forEach((p) => {
      if (p.uid) activeUids.add(p.uid);
    });
  }

  const filteredUsers = users.filter((u) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      u.name?.toLowerCase().includes(term) ||
      u.username?.toLowerCase().includes(term) ||
      u.email?.toLowerCase().includes(term)
    );
  });

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: "24px",
          bgcolor: "rgba(15, 23, 42, 0.96)",
          backdropFilter: "blur(28px)",
          color: "#fff",
          border: "1px solid rgba(255, 255, 255, 0.14)",
          boxShadow: "0 24px 60px rgba(0, 0, 0, 0.8)",
          overflow: "hidden",
        },
      }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          pb: 1,
          pt: 2.5,
          px: 3,
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1.2}>
          <GroupAddIcon sx={{ color: "#38bdf8", fontSize: 24 }} />
          <Typography variant="h6" sx={{ fontWeight: 800, fontSize: "1.15rem" }}>
            Add People to Call
          </Typography>
        </Stack>
        <IconButton size="small" onClick={onClose} sx={{ color: "rgba(255, 255, 255, 0.7)" }}>
          <CloseIcon sx={{ fontSize: 20 }} />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ px: 3, py: 1 }}>
        {/* Copy Call Link Box */}
        <Box
          sx={{
            mb: 2,
            p: 1.5,
            borderRadius: "14px",
            bgcolor: "rgba(255, 255, 255, 0.05)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 1.5,
          }}
        >
          <Box sx={{ overflow: "hidden", flex: 1 }}>
            <Typography variant="caption" sx={{ color: "rgba(255, 255, 255, 0.6)", display: "block" }}>
              Share call link with friends:
            </Typography>
            <Typography
              variant="body2"
              noWrap
              sx={{ color: "#38bdf8", fontWeight: 600, fontSize: "0.82rem" }}
            >
              {window.location.origin}/chats?call_id={activeCall?.callID?.slice(-8) || "call"}
            </Typography>
          </Box>
          <Button
            size="small"
            variant="contained"
            onClick={handleCopyLink}
            startIcon={copiedLink ? <CheckIcon sx={{ fontSize: 16 }} /> : <ContentCopyIcon sx={{ fontSize: 16 }} />}
            sx={{
              borderRadius: "99px",
              bgcolor: copiedLink ? "#22c55e" : "rgba(56, 189, 248, 0.2)",
              color: copiedLink ? "#fff" : "#38bdf8",
              border: copiedLink ? "none" : "1px solid rgba(56, 189, 248, 0.4)",
              textTransform: "none",
              fontWeight: 700,
              fontSize: "0.75rem",
              px: 1.5,
              whiteSpace: "nowrap",
              "&:hover": {
                bgcolor: copiedLink ? "#16a34a" : "rgba(56, 189, 248, 0.3)",
              },
            }}
          >
            {copiedLink ? "Copied!" : "Copy"}
          </Button>
        </Box>

        {/* Search Input */}
        <TextField
          fullWidth
          size="small"
          placeholder="Search friends by name or username..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: "rgba(255, 255, 255, 0.5)", fontSize: 20 }} />
              </InputAdornment>
            ),
            sx: {
              borderRadius: "12px",
              bgcolor: "rgba(255, 255, 255, 0.06)",
              color: "#fff",
              fontSize: "0.88rem",
              "& fieldset": { borderColor: "rgba(255, 255, 255, 0.12)" },
              "&:hover fieldset": { borderColor: "rgba(56, 189, 248, 0.4)" },
              "&.Mui-focused fieldset": { borderColor: "#38bdf8" },
            },
          }}
          sx={{ mb: 2 }}
        />

        {/* Friends List */}
        <Box
          sx={{
            maxHeight: 280,
            overflowY: "auto",
            pr: 0.5,
            display: "flex",
            flexDirection: "column",
            gap: 1,
          }}
        >
          {loading && (
            <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
              <CircularProgress size={24} sx={{ color: "#38bdf8" }} />
            </Box>
          )}

          {!loading && filteredUsers.length === 0 && (
            <Typography variant="body2" sx={{ textAlign: "center", py: 3, color: "rgba(255, 255, 255, 0.5)" }}>
              No friends found matching "{searchTerm}"
            </Typography>
          )}

          {!loading &&
            filteredUsers.map((user) => {
              const inCall = activeUids.has(user.uid);
              const isInvited = invitedIds.has(user.uid);

              return (
                <Box
                  key={user.uid}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    p: 1.2,
                    borderRadius: "14px",
                    bgcolor: "rgba(255, 255, 255, 0.04)",
                    border: "1px solid rgba(255, 255, 255, 0.06)",
                    transition: "all 0.15s ease",
                    "&:hover": { bgcolor: "rgba(255, 255, 255, 0.08)" },
                  }}
                >
                  <Stack direction="row" alignItems="center" spacing={1.5} sx={{ minWidth: 0, flex: 1 }}>
                    <Avatar
                      src={resolveAvatar(user.photoURL, DEFAULT_CALLER_AVATAR)}
                      alt={user.name}
                      sx={{ width: 40, height: 40, border: "2px solid rgba(255, 255, 255, 0.15)" }}
                    />
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      <Typography variant="subtitle2" noWrap sx={{ fontWeight: 700, fontSize: "0.88rem" }}>
                        {user.name}
                      </Typography>
                      {user.username && (
                        <Typography variant="caption" noWrap sx={{ color: "rgba(255, 255, 255, 0.5)", display: "block" }}>
                          @{user.username}
                        </Typography>
                      )}
                    </Box>
                  </Stack>

                  {inCall ? (
                    <Chip
                      size="small"
                      label="In Call"
                      sx={{
                        bgcolor: "rgba(34, 197, 94, 0.15)",
                        color: "#22c55e",
                        fontWeight: 700,
                        fontSize: "0.72rem",
                        border: "1px solid rgba(34, 197, 94, 0.3)",
                      }}
                    />
                  ) : isInvited ? (
                    <Chip
                      size="small"
                      label="Ringing..."
                      sx={{
                        bgcolor: "rgba(250, 204, 21, 0.15)",
                        color: "#facc15",
                        fontWeight: 700,
                        fontSize: "0.72rem",
                        border: "1px solid rgba(250, 204, 21, 0.3)",
                      }}
                    />
                  ) : (
                    <Button
                      size="small"
                      variant="contained"
                      onClick={() => handleInvite(user)}
                      startIcon={<PersonAddAlt1Icon sx={{ fontSize: 16 }} />}
                      sx={{
                        borderRadius: "99px",
                        bgcolor: "#22c55e",
                        color: "#fff",
                        textTransform: "none",
                        fontWeight: 700,
                        fontSize: "0.75rem",
                        px: 1.5,
                        py: 0.3,
                        boxShadow: "0 4px 12px rgba(34, 197, 94, 0.4)",
                        "&:hover": {
                          bgcolor: "#16a34a",
                          transform: "scale(1.04)",
                        },
                      }}
                    >
                      Invite
                    </Button>
                  )}
                </Box>
              );
            })}
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2.5, pt: 1 }}>
        <Button
          fullWidth
          variant="outlined"
          onClick={onClose}
          sx={{
            borderRadius: "99px",
            borderColor: "rgba(255, 255, 255, 0.18)",
            color: "rgba(255, 255, 255, 0.8)",
            textTransform: "none",
            fontWeight: 700,
            "&:hover": {
              borderColor: "#fff",
              color: "#fff",
              bgcolor: "rgba(255, 255, 255, 0.05)",
            },
          }}
        >
          Done
        </Button>
      </DialogActions>
    </Dialog>
  );
}
