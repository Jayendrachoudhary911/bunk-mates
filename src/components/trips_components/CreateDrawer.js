import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  TextField,
  SwipeableDrawer,
  IconButton,
  Stack,
  Chip,
  Avatar,
  Card,
  DialogActions,
  useTheme
} from "@mui/material";
import { CloseOutlined } from "@mui/icons-material";
import { doc, getDoc } from "firebase/firestore"; // Assuming Firebase v9+

const CreateTripDrawer = ({ 
  mode, 
  user, 
  db, 
  // Hooks/Functions passed from parent or custom hook
  createDialogOpen,
  step,
  newTrip,
  setNewTrip,
  selectedMembers,
  setSelectedMembers,
  randomNatureImage,
  closeDrawer,
  handleNext,
  handleBack,
  handleContributionChange,
  totalContribution,
  handleCreateTrip,
}) => {
  const theme = useTheme();
  const [friendCards, setFriendCards] = useState([]);

  // Form Field consistent styling
  const formFieldSx = {
    "& .MuiOutlinedInput-root": {
      borderRadius: 3,
    },
  };

  // Logic for fetching friends
  useEffect(() => {
    if (!user?.uid) {
      setFriendCards([]);
      return;
    }

    const fetchFriends = async () => {
      try {
        const userRef = doc(db, "users", user.uid);
        const snap = await getDoc(userRef);
        if (snap.exists()) {
          const friends = snap.data().friends || [];
          const friendsData = await Promise.all(
            friends.map((uid) => getDoc(doc(db, "users", uid)))
          );
          setFriendCards(
            friendsData
              .filter((f) => f.exists())
              .map((f) => ({
                uid: f.id,
                ...f.data(),
                contribution: "",
              }))
          );
        }
      } catch (e) {
        console.warn("Failed to fetch friends", e);
        setFriendCards([]);
      }
    };

    fetchFriends();
  }, [user, db]);

  const handleAddMember = (member) => {
    if (selectedMembers.some((m) => m.uid === member.uid)) return;
    setSelectedMembers((prev) => [...prev, member]);
  };

  const handleRemoveMember = (uid) => {
    setSelectedMembers((prev) => prev.filter((m) => m.uid !== uid));
  };

  return (
    <SwipeableDrawer
      anchor="bottom"
      open={createDialogOpen}
      onClose={closeDrawer}
      onOpen={() => {}} // Required for SwipeableDrawer
      PaperProps={{
        sx: {
          height: "100vh",
          maxHeight: "100vh",
          overflow: "hidden",
          position: "relative",
          backdropFilter: "blur(22px) saturate(1.6)",
          WebkitBackdropFilter: "blur(22px) saturate(1.6)",
          background: mode === "dark"
            ? "linear-gradient(180deg, rgba(10,10,10,0.88), rgba(0,0,0,0.95))"
            : "linear-gradient(180deg, rgba(255,255,255,0.88), rgba(245,247,250,0.96))",
          color: mode === "dark" ? "#fff" : "#111",
          borderTop: mode === "dark" ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(0,0,0,0.06)",
          boxShadow: mode === "dark" ? "0 -24px 80px rgba(0,0,0,0.85)" : "0 -24px 60px rgba(0,0,0,0.18)",
          transition: "all 420ms cubic-bezier(0.4, 0, 0.2, 1)",
        },
      }}
    >
      <Box
        sx={{
          px: { xs: 2.5, sm: 4 },
          pb: 4,
          pt: 4,
          height: "100%",
          overflowY: "auto",
          "&::-webkit-scrollbar": { width: 6 },
          "&::-webkit-scrollbar-thumb": {
            borderRadius: 6,
            backgroundColor: mode === "dark" ? "rgba(255,255,255,0.18)" : "rgba(0,0,0,0.18)",
          },
        }}
      >
        {/* Header */}
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 4, pb: 2, borderBottom: mode === "dark" ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(0,0,0,0.06)" }}>
          <Box sx={{ display: "flex", flexDirection: "column" }}>
            <Typography variant="h5" sx={{ fontWeight: 900 }}>Create a trip</Typography>
            <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 500 }}>
              Plan routes, dates & invite members
            </Typography>
          </Box>
          <IconButton onClick={closeDrawer} sx={{ background: mode === "dark" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)" }}>
            <CloseOutlined fontSize="small" />
          </IconButton>
        </Box>

        {/* Stepper Visuals */}
        <Box sx={{ mb: 3 }}>
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Chip label="Trip Details" size="small" sx={{ fontWeight: 700, background: step === 0 ? "#fff" : "transparent", color: step === 0 ? "#000" : "inherit" }} />
            <Box sx={{ flex: 1, height: 2, bgcolor: step >= 1 ? "primary.main" : "divider" }} />
            <Chip label="Add Members" size="small" sx={{ fontWeight: 700, background: step === 1 ? "#fff" : "transparent", color: step === 1 ? "#000" : "inherit" }} />
          </Stack>
        </Box>

        {/* Step 0: Details */}
        {step === 0 && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
            <Box sx={{ display: "flex", justifyContent: "center", mb: 1.5 }}>
              <Avatar src={newTrip.iconDataUri || randomNatureImage} sx={{ width: 180, height: 180, borderRadius: 4 }} />
            </Box>
            <TextField label="Trip Name" fullWidth value={newTrip.name} onChange={(e) => setNewTrip({ ...newTrip, name: e.target.value })} sx={formFieldSx} />
            <Box sx={{ display: "flex", gap: 1.5 }}>
              <TextField label="From" fullWidth value={newTrip.from} onChange={(e) => setNewTrip({ ...newTrip, from: e.target.value })} sx={formFieldSx} />
              <TextField label="To" fullWidth value={newTrip.to} onChange={(e) => setNewTrip({ ...newTrip, to: e.target.value })} sx={formFieldSx} />
            </Box>
            <Box sx={{ display: "flex", gap: 1.5 }}>
              <TextField label="Start Date" type="date" InputLabelProps={{ shrink: true }} fullWidth value={newTrip.startDate} onChange={(e) => setNewTrip({ ...newTrip, startDate: e.target.value })} sx={formFieldSx} />
              <TextField label="End Date" type="date" InputLabelProps={{ shrink: true }} fullWidth value={newTrip.endDate} onChange={(e) => setNewTrip({ ...newTrip, endDate: e.target.value })} sx={formFieldSx} />
            </Box>
            <DialogActions sx={{ mt: 2, px: 0, gap: 1.5 }}>
              <Button fullWidth onClick={closeDrawer} variant="outlined">Cancel</Button>
              <Button fullWidth onClick={handleNext} variant="contained" sx={{ bgcolor: mode === 'dark' ? '#fff' : '#000', color: mode === 'dark' ? '#000' : '#fff' }}>Next</Button>
            </DialogActions>
          </Box>
        )}

        {/* Step 1: Members */}
        {step === 1 && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>Your Friends</Typography>
            <Stack direction="row" spacing={2} sx={{ overflowX: "auto", pb: 1 }}>
              {friendCards.map((friend) => (
                <Card key={friend.uid} sx={{ minWidth: 140, p: 2, textAlign: 'center', borderRadius: 4 }}>
                  <Avatar src={friend.photoURL} sx={{ mx: 'auto', mb: 1 }} />
                  <Typography variant="body2" noWrap fontWeight={700}>{friend.name || friend.username}</Typography>
                  <Button size="small" onClick={() => handleAddMember(friend)} sx={{ mt: 1 }}>Add</Button>
                </Card>
              ))}
            </Stack>

            {selectedMembers.length > 0 && (
              <>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Added Members</Typography>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                  {selectedMembers.map((m) => (
                    <Chip key={m.uid} avatar={<Avatar src={m.photoURL} />} label={m.name} onDelete={() => handleRemoveMember(m.uid)} />
                  ))}
                </Box>
                
                <Stack spacing={1.5}>
                  {selectedMembers.map((user, idx) => (
                    <Box key={user.uid} sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 1.5, bgcolor: 'action.hover', borderRadius: 3 }}>
                      <Avatar src={user.photoURL} />
                      <Typography sx={{ flexGrow: 1 }}>{user.name}</Typography>
                      <TextField 
                        label="Amount" 
                        type="number" 
                        size="small" 
                        sx={{ width: 100 }}
                        value={user.contribution || ""}
                        onChange={(e) => handleContributionChange(idx, e.target.value)}
                      />
                    </Box>
                  ))}
                </Stack>

                <Box sx={{ p: 2, borderRadius: 4, bgcolor: 'success.main', color: 'white', textAlign: 'center' }}>
                  <Typography variant="caption">Total Budget</Typography>
                  <Typography variant="h6" fontWeight={900}>₹ {totalContribution}</Typography>
                </Box>
              </>
            )}

            <DialogActions sx={{ mt: 2, px: 0, gap: 1.5 }}>
              <Button fullWidth onClick={handleBack}>Back</Button>
              <Button fullWidth variant="contained" onClick={handleCreateTrip} sx={{ bgcolor: mode === 'dark' ? '#fff' : '#000', color: mode === 'dark' ? '#000' : '#fff' }}>Create Trip</Button>
            </DialogActions>
          </Box>
        )}
      </Box>
    </SwipeableDrawer>
  );
};

export default CreateTripDrawer;