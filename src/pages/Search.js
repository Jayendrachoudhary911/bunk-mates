import React, { useState, useMemo, useEffect } from "react";
import {
  Box,
  TextField,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemAvatar,
  Avatar,
  ListItemText,
  Divider,
  Typography,
  CircularProgress,
  Paper,
  SwipeableDrawer,
  Button,
  Stack,
  Chip,
  alpha,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import MessageIcon from "@mui/icons-material/Chat";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import PlaceIcon from "@mui/icons-material/Place";
import { motion } from "framer-motion";
import useUniversalSearch from "../hooks/useUniversalSearch";
import { useNavigate } from "react-router-dom";
import { useThemeToggle } from "../contexts/ThemeToggleContext";
import { getTheme } from "../theme";
import {
  doc,
  onSnapshot,
  getDoc,
  updateDoc,
  arrayUnion,
  setDoc,
  collection,
} from "firebase/firestore";
import { db, auth } from "../firebase";

// Helper Component for Info Row
const InfoRow = ({ label, value }) => (
  <Stack direction="row" justifyContent="space-between" spacing={1}>
    <Typography variant="body2" color="text.secondary">
      {label}
    </Typography>
    <Typography variant="body2" fontWeight={500}>
      {value}
    </Typography>
  </Stack>
);

// Helper Component for Sections (Mutual Friends, Shared Trips)
const Section = ({ title, children }) => (
  <Box sx={{ mb: 2 }}>
    <Typography variant="subtitle2" sx={{ mb: 1 }}>
      {title}
    </Typography>
    <Stack direction="row" spacing={1} flexWrap="wrap">
      {children}
    </Stack>
  </Box>
);

export default function SearchPage() {
  const { mode, accent } = useThemeToggle();
  const theme = getTheme(mode, accent);
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [tab, setTab] = useState("all");
  const [selectedItem, setSelectedItem] = useState(null);
  const [drawerContentType, setDrawerContentType] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  
  const [fetchedAllUsers, setFetchedAllUsers] = useState([]);
  const [isFetchingAllUsers, setIsFetchingAllUsers] = useState(true);

  const { results, loading: isSearchLoading } = useUniversalSearch(q, {
    maxPerCollection: 200,
  });

  // 1. Fetch current user data (MODIFIED to extract visibility from privacy map)
  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (!user) {
        setCurrentUser(null)
        setIsInitialLoading(false);
        return;
      }

      const userId = user.uid;
      const userDocRef = doc(db, "users", userId);

      const unsubscribeSnapshot = onSnapshot(userDocRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setCurrentUser({
            ...data,
            // 🔑 Ensure visibility is correctly extracted for the current user
            profileVisibility: data.privacy?.profileVisibility || 'public',
            // Ensure friends is treated as an array of UIDs, default to empty array
            friends: data.friends || [],
          });
        }
        setIsInitialLoading(false);
      });

      return () => unsubscribeSnapshot();
    });

    return () => unsubscribeAuth();
  }, []);

  // 2. Fetch ALL users from the collection (MODIFIED to extract visibility and nickname)
  useEffect(() => {
    const usersCollectionRef = collection(db, "users");
    
    const unsubscribe = onSnapshot(usersCollectionRef, (snapshot) => {
      const usersList = snapshot.docs.map(docSnap => {
        const data = docSnap.data();
        const uid = docSnap.id;
        
        // Extract the nickname associated with the user's own UID
        const nickname = data.nicknames ? data.nicknames[uid] : null;
        
        // 🔑 Extract profileVisibility from the nested 'privacy' map
        const visibility = data.privacy?.profileVisibility || 'public';

        return {
          id: uid,
          uid: uid,
          ...data,
          // Add extracted fields to the top level for consistency
          nickname: nickname,
          displayName: nickname || data.name || "Unnamed User",
          profileVisibility: visibility, 
        };
      });
      setFetchedAllUsers(usersList);
      setIsFetchingAllUsers(false);
    }, (error) => {
      console.error("Error fetching all users:", error);
      setIsFetchingAllUsers(false);
    });

    return () => unsubscribe();
  }, []);


  const isFriend = (targetUid) => {
    return Array.isArray(currentUser?.friends) && currentUser.friends.includes(targetUid);
  };
  
  // 3. Conditional list of users to display for the "Users" tab
  // 3. Conditional list of users to display for the "Users" tab
  const usersToDisplay = useMemo(() => {
    const trimmedQ = q.trim().toLowerCase();
    
    // Don't show any users if there's no search query
    if (!trimmedQ) {
      return [];
    }

    const baseList = results.users;
    const currentUserId = auth.currentUser?.uid;

    const filteredList = baseList.filter(user => {
        const isSelf = currentUserId && user.uid === currentUserId;
        if (isSelf) {
            return false;
        }

        // Match against name OR nickname/displayName
        const displayName = user.displayName?.toLowerCase() || user.name?.toLowerCase() || "";
        const username = user.username?.toLowerCase() || "";

        // Check for exact matches first
        const isExactMatch = displayName === trimmedQ || username === trimmedQ;
        
        // If it's an exact match, show even if they're friends
        if (isExactMatch) {
            return true;
        }
        
        // Check for partial matches
        return displayName.includes(trimmedQ) || username.includes(trimmedQ);
    });

    return filteredList;
  }, [q, results.users, currentUser]);


const groups = useMemo(
  () => [
    { key: "users", label: "Users", items: usersToDisplay },
    { key: "notes", label: "Notes", items: results.notes },
    { key: "reminders", label: "Reminders", items: results.reminders },
    { key: "trips", label: "Trips", items: results.trips },
    { key: "places", label: "Places", items: results.places },
  ],
  [usersToDisplay, results]
);

  const filteredGroups =
    tab === "all" ? groups : groups.filter((g) => g.key === tab);

  const closeDrawer = () => {
    setDrawerOpen(false);
    setTimeout(() => {
      setSelectedItem(null);
      setDrawerContentType(null);
    }, 300);
  };

  const handleItemClick = (type, item) => {
    setSelectedItem(item);
    if (["users", "friends"].includes(type)) {
      setDrawerContentType("user");
      setDrawerOpen(true);
    } else if (type === "places") {
      setDrawerContentType("place");
      setDrawerOpen(true);
    } else if (type === "notes")
      navigate(`/notes`, { state: { openNoteId: item.id } });
    else if (type === "reminders")
      navigate(`/reminders`, { state: { openReminderId: item.id } });
    else if (type === "trips") navigate(`/trips/${item.id}`);
  };

  const handleAddFriend = async (targetUser) => {
    try {
      if (!auth.currentUser) {
        alert("You must be logged in to add friends");
        return;
      }

      const currentUid = auth.currentUser.uid;
      if (targetUser.uid === currentUid) {
        alert("You cannot add yourself as a friend!");
        return;
      }

      const targetRef = doc(db, "users", targetUser.uid);
      const currentRef = doc(db, "users", currentUid);

      const [targetSnap, currentSnap] = await Promise.all([
        getDoc(targetRef),
        getDoc(currentRef),
      ]);

      if (!targetSnap.exists() || !currentSnap.exists()) {
        console.error("Target or current user document not found");
        alert("User profile data not found.");
        return;
      }

      // Re-read visibility from the doc for accuracy, falling back to data from the search result if necessary
      const targetData = targetSnap.data();
      const visibility = targetData.privacy?.profileVisibility || targetUser.profileVisibility || "public";
      
      const currentData = currentSnap.data();

      if (isFriend(targetUser.uid)) {
        alert("You are already friends with this user!");
        return;
      }

      const currentUserName = currentData.name || "A user";

      if (visibility === "public") {
        await Promise.all([
          updateDoc(currentRef, { friends: arrayUnion(targetUser.uid) }),
          updateDoc(targetRef, { friends: arrayUnion(currentUid) }),
        ]);

        const notificationId1 = `friend_added_${currentUid}_${targetUser.uid}_${Date.now()}`;
        const notificationId2 = `friend_added_${targetUser.uid}_${currentUid}_${Date.now()}`;

        await Promise.all([
          setDoc(doc(db, "notifications", notificationId1), {
            type: "friend_added",
            to: targetUser.uid,
            from: currentUid,
            createdAt: new Date(),
            message: `${currentUserName} added you as a friend.`,
            read: false,
          }),
          setDoc(doc(db, "notifications", notificationId2), {
            type: "friend_added_self",
            to: currentUid,
            from: targetUser.uid,
            createdAt: new Date(),
            message: `You are now friends with ${targetUser.displayName || targetUser.name || "a new user"}.`,
            read: false,
          }),
        ]);

        alert(`You and ${targetUser.displayName || targetUser.name || "the user"} are now friends!`);
      } else {
        const requestId = `friend_request_${currentUid}_${targetUser.uid}_${Date.now()}`;

        await setDoc(doc(db, "notifications", requestId), {
          type: "friend_request",
          to: targetUser.uid,
          from: currentUid,
          createdAt: new Date(),
          message: `${currentUserName} sent you a friend request.`,
          status: "pending",
          read: false,
        });

        alert("Friend request sent! Waiting for approval.");
      }
    } catch (err) {
      console.error("Error adding friend:", err);
      alert("Something went wrong while adding friend. Check console for details.");
    }
  };

  // User Drawer Content component (MODIFIED to use the explicitly fetched visibility)
// ...existing code...

const UserDrawerContent = ({ user }) => {
    const isCurrentUserFriend = isFriend(user.uid);
    const isSelf = auth.currentUser?.uid === user.uid;
    
    const visibility = user.profileVisibility || "public"; 
    const isPublic = visibility === "public";
    
    const isFullyViewable = isSelf || isCurrentUserFriend || isPublic;
    
    const joinDate = user.createdAt
      ? new Date(user.createdAt.seconds * 1000).toLocaleDateString()
      : "Unknown";

    const userDetails = [
      { label: "Display Name", value: user.displayName },
      { label: "Username", value: user.username && `@${user.username}` },
      { label: "Email", value: isFullyViewable ? user.email : null },
      { label: "Location", value: user.location },
      { label: "Phone", value: isFullyViewable ? user.phone : null },
      { label: "Gender", value: user.gender },
      { label: "Date of Birth", value: user.dateOfBirth },
      { label: "Occupation", value: user.occupation },
      { label: "Education", value: user.education },
      { label: "Joined Date", value: joinDate },
      { label: "Profile Status", value: visibility },
      { label: "Languages", value: user.languages?.join(", ") },
      { label: "Hobbies", value: user.hobbies?.join(", ") },
      { label: "Interests", value: user.interests?.join(", ") },
      { label: "Social Links", value: user.socialLinks ? Object.keys(user.socialLinks).join(", ") : null }
    ].filter(item => item.value); // Only show fields that have values

    return (
      <Box sx={{ p: 3 }}>
        {/* Profile Header */}
        <Stack alignItems="center" spacing={1.5} sx={{ mb: 3 }}>
          <Avatar
            src={user.photoURL}
            sx={{
              width: 120,
              height: 120,
              mb: 1,
            }}
          >
            {user.displayName?.[0] || user.name?.[0]}
          </Avatar>

          <Typography variant="h5" fontWeight={600}>
            {user.displayName || user.name || "Unnamed User"}
          </Typography>

          <Stack direction="row" spacing={1}>
            {isCurrentUserFriend && (
              <Chip label="Friend" color="success" size="small" />
            )}
            <Chip 
              label={visibility.charAt(0).toUpperCase() + visibility.slice(1)} 
              color={isPublic ? "info" : "warning"} 
              size="small" 
            />
          </Stack>
        </Stack>

        {/* Bio Section */}
        {user.bio && (
          <Box sx={{ mb: 3, px: 2 }}>
            <Typography
              variant="body1"
              color="text.secondary"
              align="center"
              sx={{ 
                fontStyle: "italic",
                p: 2,
                borderRadius: 4,
                bgcolor: alpha(theme.palette.background.paper, 0.3)
              }}
            >
              "{user.bio}"
            </Typography>
          </Box>
        )}

        {/* Private Profile Warning */}
        {!isFullyViewable && (
          <Box sx={{ 
            p: 2, 
            mb: 3, 
            textAlign: 'center', 
            border: `1px solid ${theme.palette.warning.main}`, 
            borderRadius: 4,
            bgcolor: alpha(theme.palette.warning.main, 0.1)
          }}>
            <Typography color="warning.main" fontWeight={600} variant="body1">
              🔒 This is a {visibility} profile
            </Typography>
            <Typography color="text.secondary" variant="body2">
              Send a friend request to view all details
            </Typography>
          </Box>
        )}

        {/* Details Sections */}
        <Box sx={{ mb: 3 }}>
          {/* Basic Info */}
          <Paper sx={{ 
            p: 2, 
            mb: 2,
            borderRadius: 6,
            bgcolor: alpha(theme.palette.background.paper, 0.4)
          }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Profile Details</Typography>
            <Stack spacing={1.5}>
              {userDetails.map((detail, index) => (
                <Stack 
                  key={index}
                  direction="row" 
                  justifyContent="space-between" 
                  sx={{ 
                    p: 1,
                    borderRadius: 1,
                    '&:hover': { bgcolor: alpha(theme.palette.background.paper, 0.3) }
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    {detail.label}
                  </Typography>
                  <Typography variant="body2" fontWeight={500}>
                    {detail.value}
                  </Typography>
                </Stack>
              ))}
            </Stack>
          </Paper>

          {/* Mutual Friends Section */}
          {isFullyViewable && user.mutualFriends?.length > 0 && (
            <Paper sx={{ p: 2, mb: 2, borderRadius: 6, bgcolor: alpha(theme.palette.background.paper, 0.4) }}>
              <Typography variant="h6" sx={{ mb: 2 }}>Mutual Friends</Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                {user.mutualFriends.map((friend) => (
                  <Chip
                    key={friend.uid}
                    avatar={<Avatar src={friend.photoURL}>{friend.name[0]}</Avatar>}
                    label={friend.name}
                    sx={{ mb: 1 }}
                  />
                ))}
              </Stack>
            </Paper>
          )}

          {/* Shared Trips Section */}
          {isFullyViewable && user.mutualTrips?.length > 0 && (
            <Paper sx={{ p: 2, borderRadius: 6, bgcolor: alpha(theme.palette.background.paper, 0.4) }}>
              <Typography variant="h6" sx={{ mb: 2 }}>Shared Trips</Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                {user.mutualTrips.map((trip) => (
                  <Chip
                    key={trip.id}
                    label={trip.name}
                    sx={{ mb: 1 }}
                  />
                ))}
              </Stack>
            </Paper>
          )}
        </Box>

        {/* Action Buttons */}
        <Stack direction="row" spacing={2} justifyContent="center">
          {isSelf ? (
            <Button variant="contained" disabled>
              This is You
            </Button>
          ) : isCurrentUserFriend ? (
            <Button
              variant="contained"
              startIcon={<MessageIcon />}
              onClick={() => navigate(`/chats/${user.uid}`)}
              fullWidth
              sx={{ borderRadius: 8 }}
            >
              Message
            </Button>
          ) : (
            <Button
              variant="contained"
              startIcon={<PersonAddIcon />}
              onClick={() => handleAddFriend(user)}
              disabled={!currentUser}
              fullWidth
              sx={{ borderRadius: 8 }}
            >
              {visibility === "private" ? "Send Friend Request" : "Add Friend"}
            </Button>
          )}
        </Stack>
      </Box>
    );
  };

// ...existing code...
  
  // Place Drawer Content component
  const PlaceDrawerContent = ({ place }) => (
    <Box
      sx={{
        position: "relative",
        overflow: "hidden",
        borderTopLeftRadius: 22,
        borderTopRightRadius: 22,
      }}
    >
      {/* Background Image with Fade Overlay */}
      {place.images?.[0] && (
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: 220,
            backgroundImage: `url(${place.images[0]})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            transform: "scale(1.1)",
            zIndex: 0,
            "&::after": {
              content: '""',
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: "60%",
              background: `linear-gradient(to bottom, rgba(0,0,0,0) 0%, ${theme.palette.background.paper} 100%)`,
            },
          }}
        />
      )}

      {/* Foreground Content */}
      <Box
        sx={{
          position: "relative",
          zIndex: 2,
          pt: place.images?.[0] ? 16 : 3,
          px: 3,
          pb: 3,
        }}
      >
        <Stack alignItems="center" spacing={2} sx={{ mb: 3 }}>
          <Box
            variant="rounded"
            src={place.images?.[0]}
            sx={{
              width: 120,
              height: 120
            }}
          >
          </Box>
          <Typography
            variant="h5"
            fontWeight={700}
            sx={{
              textAlign: "center",
              color: theme.palette.text.primary,
            }}
          >
            {place.name}
          </Typography>
          <Stack
            direction="row"
            spacing={1}
            flexWrap="wrap"
            justifyContent="center"
          >
            <Chip
              label={place.type || "Attraction"}
              size="small"
              color="primary"
              variant="outlined"
            />
            <Chip
              label={place.city || "Unknown Location"}
              size="small"
              variant="outlined"
            />
          </Stack>
        </Stack>

        <Divider sx={{ mb: 3, background: "transparent" }} />

        <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>
          Overview
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mb: 3, textAlign: "justify" }}
        >
          {place.description || "No detailed description available."}
        </Typography>

        <Stack
          direction="row"
          spacing={1}
          justifyContent="center"
          sx={{ pt: 1 }}
        >
          <Button
            variant="contained"
            onClick={() => navigate(`/trips`, { state: { place } })}
            sx={{
              borderRadius: 8,
            }}
          >
            Plan Trip Here
          </Button>
          <Button variant="outlined" onClick={closeDrawer} sx={{ borderRadius: 8 }}>
            Close
          </Button>
        </Stack>
      </Box>
    </Box>
  );


  // Render
  return (
    <Box sx={{ p: 3, maxWidth: 900, mx: "auto" }}>
      {/* Search Bar */}
      <Paper
        sx={{
          p: 1.2,
          mb: 3,
          borderRadius: 4,
          display: "flex",
          alignItems: "center",
          background: alpha(theme.palette.background.paper, 0.4),
          backdropFilter: "blur(12px)",
          boxShadow: theme.shadows[4],
        }}
      >
        <SearchIcon color="action" sx={{ mx: 1 }} />
        <TextField
          fullWidth
          placeholder="Search across users, notes, trips & more..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          variant="standard"
          InputProps={{ disableUnderline: true }}
        />
        {(isSearchLoading || isFetchingAllUsers) && <CircularProgress size={22} sx={{ mr: 1 }} />}
      </Paper>

      {/* Tabs */}
      <Tabs
        value={tab}
        onChange={(e, val) => setTab(val)}
        variant="scrollable"
        scrollButtons="auto"
        sx={{
          mb: 2,
          "& .MuiTab-root": {
            textTransform: "none",
            fontWeight: 500,
          },
          "& .Mui-selected": {
            color: theme.palette.primary.main,
          },
          "& .MuiTabs-indicator": {
            backgroundColor: theme.palette.primary.main,
            height: 3,
            borderRadius: 2,
          },
        }}
      >
{[
  "all",
  "users",
  "notes",
  "reminders",
  "trips",
  "places",
].map((t) => (
  <Tab
    key={t}
    value={t}
    label={t.charAt(0).toUpperCase() + t.slice(1)}
  />
))}
      </Tabs>

      {/* Results */}
      {!q && (isInitialLoading || isFetchingAllUsers) ? (
        <Stack alignItems="center" sx={{ mt: 5 }}>
          <CircularProgress />
          <Typography color="text.secondary" sx={{ mt: 2 }}>
            Loading user profiles and current data...
          </Typography>
        </Stack>
      ) : (
        <>
        {filteredGroups.every(g => g.items.length === 0) ? (
          <Typography color="text.secondary" align="center" sx={{ mt: 5 }}>
            {!q 
                ? "Type something to start searching ✨" 
                : "No users, notes, or trips match your search term."
            }
          </Typography>
        ) : (
            filteredGroups.map(
                (group) =>
                group.items.length > 0 && (
                    <Box key={group.key} sx={{ mb: 3 }}>
                    <Typography variant="h6" fontWeight={600} sx={{ mb: 1 }}>
                        {group.label} ({group.items.length})
                    </Typography>
                    <List>
                        {group.items.slice(0, 50).map((item) => (
                        <motion.div
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            key={item.id || item.uid}
                        >
                            <Paper
                            sx={{
                                mb: 1.2,
                                p: 1,
                                borderRadius: 3,
                                background: alpha(theme.palette.background.paper, 0.5),
                                backdropFilter: "blur(10px)",
                                transition: "all 0.25s ease",
                                "&:hover": { boxShadow: theme.shadows[6] },
                            }}
                            onClick={() => handleItemClick(group.key, item)}
                            >
                            <ListItem>
                                <ListItemAvatar>
                                <Avatar
                                    src={
                                    item.images?.[0] ||
                                    item.photoURL ||
                                    item.iconURL ||
                                    ""
                                    }
                                    sx={{
                                    bgcolor: alpha(theme.palette.primary.main, 0.15),
                                    boxShadow: `0 0 8px ${alpha(
                                        theme.palette.primary.main,
                                        0.3
                                    )}`,
                                    }}
                                >
                                    {(item.displayName || item.name || item.title || "U")[0]}
                                </Avatar>
                                </ListItemAvatar>
                                <ListItemText
                                primary={
                                    <Typography variant="subtitle1" fontWeight={600}>
                                    {item.displayName || item.name || item.title || "Untitled"}
                                    </Typography>
                                }
                                secondary={
                                    <Typography
                                    variant="body2"
                                    color="text.secondary"
                                    noWrap
                                    >
                                    {item.username ? `@${item.username}` : item.description || item.content || item.location || ""}
                                    </Typography>
                                }
                                />
                            </ListItem>
                            </Paper>
                        </motion.div>
                        ))}
                    </List>
                    </Box>
                )
            )
        )}
        </>
      )}

      {/* Drawer */}
      <SwipeableDrawer
        anchor="bottom"
        open={drawerOpen}
        onClose={closeDrawer}
        PaperProps={{
          sx: {
            borderTopLeftRadius: 22,
            borderTopRightRadius: 22,
            maxWidth: 600,
            mx: "auto",
            maxHeight: "90vh",
            background: alpha(theme.palette.background.paper, 0.3),
            backdropFilter: "blur(38px)",
            boxShadow: theme.shadows[10],
            overflowY: "auto",
          },
        }}
      >
        {/* Render content based on type and if item is selected */}
        {drawerContentType === "user" && selectedItem && (
          <UserDrawerContent user={selectedItem} />
        )}
        {drawerContentType === "place" && selectedItem && (
          <PlaceDrawerContent place={selectedItem} />
        )}
      </SwipeableDrawer>
    </Box>
  );
}