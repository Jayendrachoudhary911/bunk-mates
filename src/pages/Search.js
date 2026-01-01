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
  IconButton,
  Card,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import MessageIcon from "@mui/icons-material/Chat";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import PlaceIcon from "@mui/icons-material/Place";
import HistoryIcon from "@mui/icons-material/History";
import CloseIcon from "@mui/icons-material/Close";
import { motion, AnimatePresence } from "framer-motion";
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
  addDoc,
} from "firebase/firestore";
import { db, auth } from "../firebase";
import { useCreateTripDrawer } from "../hooks/useCreateTripDrawer";
import data from "../data/data.json";

const getHistoryMeta = (text) => {
  const lower = text.toLowerCase();

  if (lower.includes("@")) {
    return { type: "user", icon: "👤", color: "#6366f1" };
  }

  if (
    lower.includes("trip") ||
    lower.includes("tour") ||
    lower.includes("journey")
  ) {
    return { type: "trip", icon: "🧳", color: "#22c55e" };
  }

  if (
    lower.includes("jaipur") ||
    lower.includes("goa") ||
    lower.includes("delhi") ||
    lower.includes("beach") ||
    lower.includes("mountain")
  ) {
    return { type: "place", icon: "📍", color: "#f97316" };
  }

  return { type: "search", icon: "🔍", color: "#64748b" };
};

const fieldSx = {
  borderRadius: 3,
  backgroundColor: (theme) =>
    theme.palette.mode === "dark"
      ? "rgba(255,255,255,0.06)"
      : "#fafafa",
  "& .MuiOutlinedInput-root": {
    borderRadius: 3,
  },
};


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
  const [user, setUser] = useState(null);
  const [q, setQ] = useState("");
  const [tab, setTab] = useState("all");
  const [selectedItem, setSelectedItem] = useState(null);
  const [drawerContentType, setDrawerContentType] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  
  const [fetchedAllUsers, setFetchedAllUsers] = useState([]);
  const [isFetchingAllUsers, setIsFetchingAllUsers] = useState(true);
  const [friendCards, setFriendCards] = useState([]);

  useEffect(() => {
    let mounted = true;
    const fetchFriends = async () => {
      try {
        if (!currentUser?.friends || currentUser.friends.length === 0) {
          if (mounted) setFriendCards([]);
          return;
        }

        const friendDocs = await Promise.all(
          currentUser.friends.map((uid) => getDoc(doc(db, "users", uid)))
        );

        if (!mounted) return;

        const cards = friendDocs
          .filter((d) => d.exists())
          .map((d) => ({ uid: d.id, ...d.data(), contribution: "" }));

        setFriendCards(cards);
      } catch (err) {
        console.warn("Failed to fetch friends:", err);
        if (mounted) setFriendCards([]);
      }
    };

    fetchFriends();
    return () => (mounted = false);
  }, [currentUser?.friends]);

  const { results, loading: isSearchLoading } = useUniversalSearch(q, {
    maxPerCollection: 200,
  });
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchHistory, setSearchHistory] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("search_history")) || [];
    } catch {
      return [];
    }
  });

  const {
  createDialogOpen,
  step,
  newTrip,
  setNewTrip,
  selectedMembers,
  setSelectedMembers,
  randomNatureImage,
  startLocationMode,
  setStartLocationMode,
  resolvedStartLocation,
  openDrawerWithPrefill,
  closeDrawer: closeTripDrawer,
  handleNext,
  handleBack,
  handleContributionChange,
  totalContribution,
  handleCreateTrip,
} = useCreateTripDrawer();


  useEffect(() => {
    const bottomBar = document.getElementById("bottom-nav"); // Adjust ID based on your layout
    if (bottomBar) {
      bottomBar.style.display = q.trim() ? "none" : "flex";
    }
    return () => {
      if (bottomBar) bottomBar.style.display = "flex";
    };
  }, [q]);


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

  const handleSearchCommit = (value) => {
    const term = value.trim();
    if (!term) return;
    setQ(term);
    setSearchHistory((prev) => {
      const updated = [term, ...prev.filter((i) => i !== term)].slice(0, 6);
      localStorage.setItem("search_history", JSON.stringify(updated));
      return updated;
    });
  };
  
  // 3. Conditional list of users to display for the "Users" tab
const usersToDisplay = useMemo(() => {
  const trimmedQ = q.trim().toLowerCase();
  const currentUserId = auth.currentUser?.uid;

  if (!trimmedQ) return [];

  // Merge useUniversalSearch results + all fetched users
  const combinedList = [
    ...(results.users || []),
    ...(fetchedAllUsers || []),
  ];

  // Filter and rank matches
  const scoredMatches = combinedList
    .filter((user) => {
      const isSelf = currentUserId && user.uid === currentUserId;
      if (isSelf) return false;

      const displayName = (user.displayName || user.name || "").toLowerCase();
      const username = (user.username || "").toLowerCase();

      // Match logic: either name or username includes the query
      return displayName.includes(trimmedQ) || username.includes(trimmedQ);
    })
    .map((user) => {
      const displayName = (user.displayName || user.name || "").toLowerCase();
      const username = (user.username || "").toLowerCase();

      // Relevance scoring
      let score = 0;
      if (username.startsWith(trimmedQ) || displayName.startsWith(trimmedQ)) score += 3;
      else if (username.includes(trimmedQ) || displayName.includes(trimmedQ)) score += 1;

      // Slight boost if name length is short (more likely a direct match)
      if (displayName.length <= trimmedQ.length + 2) score += 0.5;

      return { ...user, _matchScore: score };
    });

  // Remove duplicates (keep highest score)
  const uniqueByUid = new Map();
  for (const user of scoredMatches) {
    const existing = uniqueByUid.get(user.uid);
    if (!existing || user._matchScore > existing._matchScore) {
      uniqueByUid.set(user.uid, user);
    }
  }

  // Sort by score (desc), then alphabetically
  const sortedResults = Array.from(uniqueByUid.values()).sort((a, b) => {
    if (b._matchScore !== a._matchScore) return b._matchScore - a._matchScore;
    return (a.displayName || a.name || "").localeCompare(b.displayName || b.name || "");
  });

  return sortedResults;
}, [q, results.users, fetchedAllUsers, currentUser]);


  // Filter Notes and Reminders — only show if created or shared with the current user
const currentUid = auth.currentUser?.uid;

const filteredNotes = useMemo(() => {
  if (!results.notes || !currentUid) return [];
  return results.notes.filter(
    (note) =>
      note.createdBy === currentUid ||
      (Array.isArray(note.sharedWith) && note.sharedWith.includes(currentUid))
  );
}, [results.notes, currentUid]);

const filteredReminders = useMemo(() => {
  if (!results.reminders || !currentUid) return [];
  return results.reminders.filter(
    (reminder) =>
      reminder.createdBy === currentUid ||
      (Array.isArray(reminder.sharedWith) && reminder.sharedWith.includes(currentUid))
  );
}, [results.reminders, currentUid]);

const filteredTrips = useMemo(() => {
  if (!q.trim()) return data.trips || [];
  const trimmedQ = q.trim().toLowerCase();
  return (data.trips || []).filter(trip =>
    trip.name.toLowerCase().includes(trimmedQ) ||
    trip.to.toLowerCase().includes(trimmedQ) ||
    (trip.description && trip.description.toLowerCase().includes(trimmedQ))
  );
}, [q]);


const groups = useMemo(
  () => [
    { key: "users", label: "Users", items: usersToDisplay },
    { key: "notes", label: "Notes", items: filteredNotes },
    { key: "reminders", label: "Reminders", items: filteredReminders },
    { key: "trips", label: "Trips", items: filteredTrips },
    { key: "places", label: "Places", items: results.places },
  ],
  [usersToDisplay, filteredNotes, filteredReminders, filteredTrips, results]
);

const handleAddMember = (member) => {
  if (selectedMembers.some((m) => m.uid === member.uid)) return;
  setSelectedMembers((prev) => [...prev, member]);
};

const handleRemoveMember = (uid) => {
  setSelectedMembers((prev) => prev.filter((m) => m.uid !== uid));
};

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

    const currentUserRef = doc(db, "users", currentUid);
    const targetUserRef = doc(db, "users", targetUser.uid);
    const [currentSnap, targetSnap] = await Promise.all([
      getDoc(currentUserRef),
      getDoc(targetUserRef),
    ]);

    if (!currentSnap.exists() || !targetSnap.exists()) {
      alert("User data not found");
      return;
    }

    const currentUserData = currentSnap.data();
    const visibility = targetSnap.data().privacy?.profileVisibility || "public";
    const currentUserName = currentUserData.name || "A user";
    const currentUserPic = currentUserData.photoURL || "";

    if (visibility === "public") {
      await Promise.all([
        updateDoc(currentUserRef, { friends: arrayUnion(targetUser.uid) }),
        updateDoc(targetUserRef, { friends: arrayUnion(currentUid) }),
      ]);

      // 🟢 Friend added notifications
      await Promise.all([
        addDoc(collection(db, "notifications"), {
          content: `${currentUserName} added you as a friend.`,
          pic: currentUserPic,
          seen: false,
          senderId: currentUid,
          timestamp: new Date(),
          title: "New Friend Added",
          type: "friend_added",
          uid: targetUser.uid,
        }),
        addDoc(collection(db, "notifications"), {
          content: `You are now friends with ${targetUser.displayName || targetUser.name}.`,
          pic: targetUser.photoURL || "",
          seen: false,
          senderId: targetUser.uid,
          timestamp: new Date(),
          title: "Friendship Confirmed",
          type: "friend_added_self",
          uid: currentUid,
        }),
      ]);

      alert(`You and ${targetUser.displayName || targetUser.name} are now friends!`);
    } else {
      // 🔵 Friend request notification (Private Profile)
      await addDoc(collection(db, "notifications"), {
        content: `${currentUserName} sent you a friend request.`,
        pic: currentUserPic,
        seen: false,
        senderId: currentUid,
        timestamp: new Date(),
        title: "Friend Request Received",
        type: "friend_request",
        uid: targetUser.uid,
        status: "pending",
      });

      alert("Friend request sent! Waiting for approval.");
    }
  } catch (err) {
    console.error("Error adding friend:", err);
    alert("Something went wrong while adding friend.");
  }
};

const UserDrawerContent = ({ user }) => {
  const [hasPendingRequest, setHasPendingRequest] = useState(false);
  const [isRequestReceived, setIsRequestReceived] = useState(false);
  const [requestId, setRequestId] = useState(null);
  const [loadingRequestState, setLoadingRequestState] = useState(true);
  const [isCurrentUserFriend, setIsCurrentUserFriend] = useState(false);

  const currentUid = auth.currentUser?.uid;
  const isSelf = currentUid === user.uid;
  const visibility = user.profileVisibility || "public";
  const isPublic = visibility === "public";
  const isFullyViewable = isSelf || isCurrentUserFriend || isPublic;

  const joinDate = user.createdAt
    ? new Date(user.createdAt.seconds * 1000).toLocaleDateString()
    : "Unknown";

  // 🧠 Listen for existing friend requests (sent or received)
useEffect(() => {
  if (!currentUid || !user?.uid || isSelf) return;
  setLoadingRequestState(true);

  const notificationsRef = collection(db, "notifications");
  const unsubscribe = onSnapshot(notificationsRef, (snapshot) => {
    const requests = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));

    // ✅ Check friend requests using the new structure
    const sent = requests.find(
      (r) =>
        r.type === "friend_request" &&
        r.senderId === currentUid &&
        r.uid === user.uid &&
        (r.status === "pending" || r.status === "accepted")
    );

    const received = requests.find(
      (r) =>
        r.type === "friend_request" &&
        r.senderId === user.uid &&
        r.uid === currentUid &&
        r.status === "pending"
    );

    setHasPendingRequest(!!sent);
    setIsRequestReceived(!!received);
    setRequestId(received ? received.id : sent ? sent.id : null);
    setLoadingRequestState(false);
    if (sent?.status === "accepted" || received?.status === "accepted") {
      setIsCurrentUserFriend(true);
    }
  });

  return () => unsubscribe();
}, [currentUid, user?.uid, isSelf]);


  // 🔁 Real-time listener for friendship status
  useEffect(() => {
    if (!currentUid || !user?.uid || isSelf) return;

    const currentUserRef = doc(db, "users", currentUid);
    const unsubscribe = onSnapshot(currentUserRef, (docSnap) => {
      if (docSnap.exists()) {
        const friends = docSnap.data().friends || [];
        setIsCurrentUserFriend(friends.includes(user.uid));
      }
    });

    return () => unsubscribe();
  }, [currentUid, user?.uid, isSelf]);

  // ✅ Accept Friend Request
  const handleAcceptRequest = async () => {
    if (!requestId || !user?.uid || !currentUid) return;
    try {
      const requestRef = doc(db, "notifications", requestId);
      await updateDoc(requestRef, { status: "accepted" });

      await Promise.all([
        updateDoc(doc(db, "users", currentUid), {
          friends: arrayUnion(user.uid),
        }),
        updateDoc(doc(db, "users", user.uid), {
          friends: arrayUnion(currentUid),
        }),
      ]);

await addDoc(collection(db, "notifications"), {
  content: `${auth.currentUser?.displayName || "A user"} accepted your friend request.`,
  pic: auth.currentUser?.photoURL || "",
  seen: false,
  senderId: currentUid,
  timestamp: new Date(),
  title: "Friend Request Accepted",
  type: "friend_accept",
  uid: user.uid,
  status: "accepted",
});

      alert(`You and ${user.displayName || user.name} are now friends!`);
    } catch (err) {
      console.error("Error accepting request:", err);
      alert("Something went wrong while accepting the friend request.");
    }
  };

  // ❌ Reject Friend Request
  const handleRejectRequest = async () => {
    if (!requestId) return;
    try {
      await addDoc(collection(db, "notifications"), {
        content: `${auth.currentUser?.displayName || "A user"} rejected your friend request.`,
        pic: auth.currentUser?.photoURL || "",
        seen: false,
        senderId: currentUid,
        timestamp: new Date(),
        title: "Friend Request Rejected",
        type: "friend_reject",
        uid: user.uid,
        status: "rejected",
      });

      alert("Friend request rejected.");
    } catch (err) {
      console.error("Error rejecting request:", err);
    }
  };

  const limitedInfo = [
    { label: "Display Name", value: user.displayName || user.name },
    { label: "Profile Status", value: visibility },
  ];

  const fullInfo = [
    { label: "Username", value: user.username && `@${user.username}` },
    { label: "Email", value: user.email },
    { label: "Location", value: user.location },
    { label: "Gender", value: user.gender },
    { label: "Date of Birth", value: user.dateOfBirth },
    { label: "Occupation", value: user.occupation },
    { label: "Education", value: user.education },
    { label: "Joined Date", value: joinDate },
    { label: "Languages", value: user.languages?.join(", ") },
    { label: "Hobbies", value: user.hobbies?.join(", ") },
    { label: "Interests", value: user.interests?.join(", ") },
    {
      label: "Social Links",
      value: user.socialLinks ? Object.keys(user.socialLinks).join(", ") : null,
    },
  ].filter((item) => item.value);

  return (
<Box
  src={user.photoURL}
  sx={{
    position: "relative",
    p: 3,
    overflow: "hidden",
  }}
>
  {/* ───── Progressive Blur Overlay ───── */}
  <Box
    sx={{
      position: "absolute",
      inset: 0,
      pointerEvents: "none",
      zIndex: 0,

      backdropFilter: "blur(16px)",
      WebkitBackdropFilter: "blur(16px)",

      maskImage:
        "linear-gradient(to bottom, black 0%, black 30%, transparent 75%)",
      WebkitMaskImage:
        "linear-gradient(to bottom, black 0%, black 30%, transparent 75%)",
    }}
  />

  {/* ───── CONTENT ───── */}
  <Box sx={{ position: "relative", zIndex: 1 }}>
    {/* Header */}
    <Stack alignItems="center" spacing={1.5} sx={{ mb: 3 }}>
      <Avatar
        src={user.photoURL}
        sx={{
          width: 120,
          height: 120,
          mb: 1,
          borderRadius: 6,
          boxShadow:
            theme.palette.mode === "dark"
              ? "0 20px 60px rgba(0,0,0,0.7)"
              : "0 20px 60px rgba(0,0,0,0.25)",
          border:
            theme.palette.mode === "dark"
              ? "1px solid rgba(255,255,255,0.12)"
              : "1px solid rgba(0,0,0,0.08)",
        }}
      >
        {user.displayName?.[0] || user.name?.[0]}
      </Avatar>

      <Typography variant="h5" fontWeight={700}>
        {user.displayName || user.name || "Unnamed User"}
      </Typography>

      <Stack direction="row" spacing={1}>
        {isCurrentUserFriend && (
          <Chip
            label="Friend"
            size="small"
            sx={{
              fontWeight: 700,
              background:
                theme.palette.mode === "dark"
                  ? "rgba(16,185,129,0.25)"
                  : "rgba(16,185,129,0.18)",
              color: "#10b981",
            }}
          />
        )}
        <Chip
          label={visibility.charAt(0).toUpperCase() + visibility.slice(1)}
          size="small"
          sx={{
            fontWeight: 700,
            background:
              isPublic
                ? "rgba(59,130,246,0.18)"
                : "rgba(245,158,11,0.18)",
            color: isPublic ? "#3b82f6" : "#f59e0b",
          }}
        />
      </Stack>
    </Stack>

    {/* Bio / Private Notice */}
    {user.bio && isFullyViewable ? (
      <Box sx={{ mb: 3, px: 2 }}>
        <Typography
          variant="body1"
          align="center"
          sx={{
            fontStyle: "italic",
            p: 2.5,
            borderRadius: 4,

            background:
              theme.palette.mode === "dark"
                ? "rgba(255,255,255,0.06)"
                : "rgba(0,0,0,0.04)",

            backdropFilter: "blur(10px)",
          }}
        >
          “{user.bio}”
        </Typography>
      </Box>
    ) : !isFullyViewable ? (
      <Box
        sx={{
          p: 2.5,
          mb: 3,
          textAlign: "center",
          borderRadius: 4,

          background:
            theme.palette.mode === "dark"
              ? "linear-gradient(135deg, rgba(245,158,11,0.18), rgba(245,158,11,0.06))"
              : "linear-gradient(135deg, rgba(245,158,11,0.12), rgba(245,158,11,0.04))",
        }}
      >
        <Typography fontWeight={700}>
          🔒 This profile is private
        </Typography>
        <Typography color="text.secondary" variant="body2">
          Send a friend request to view more details
        </Typography>
      </Box>
    ) : null}

    {/* Profile Info */}
    <Paper
      sx={{
        p: 2.5,
        mb: 2,
        borderRadius: 6,

        background:
          theme.palette.mode === "dark"
            ? "rgba(255,255,255,0.05)"
            : "rgba(255,255,255,0.75)",

        backdropFilter: "blur(14px)",
        boxShadow: "none",
      }}
    >
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
        Profile Details
      </Typography>

      <Stack spacing={1.2}>
        {(isFullyViewable ? fullInfo : limitedInfo).map((detail, index) => (
          <Stack
            key={index}
            direction="row"
            justifyContent="space-between"
            sx={{
              p: 1.2,
              borderRadius: 2,

              transition: "background 180ms ease",
              "&:hover": {
                background:
                  theme.palette.mode === "dark"
                    ? "rgba(255,255,255,0.08)"
                    : "rgba(0,0,0,0.04)",
              },
            }}
          >
            <Typography variant="body2" color="text.secondary">
              {detail.label}
            </Typography>
            <Typography variant="body2" fontWeight={600}>
              {detail.value}
            </Typography>
          </Stack>
        ))}
      </Stack>
    </Paper>

    {/* Action Buttons */}
    <Stack direction="row" spacing={1.5} justifyContent="center" sx={{ mt: 3 }}>
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
      ) : isRequestReceived ? (
        <>
          <Button
            variant="contained"
            color="success"
            onClick={handleAcceptRequest}
            fullWidth
            sx={{ borderRadius: 8 }}
          >
            Accept
          </Button>
          <Button
            variant="outlined"
            color="error"
            onClick={handleRejectRequest}
            fullWidth
            sx={{ borderRadius: 8 }}
          >
            Reject
          </Button>
        </>
      ) : hasPendingRequest ? (
        <Button
          variant="outlined"
          disabled
          fullWidth
          sx={{ borderRadius: 8 }}
        >
          Requested
        </Button>
      ) : (
        <Button
          variant="contained"
          startIcon={<PersonAddIcon />}
          onClick={() => handleAddFriend(user)}
          disabled={loadingRequestState}
          fullWidth
          sx={{ borderRadius: 8 }}
        >
          {visibility === "private" ? "Send Friend Request" : "Add Friend"}
        </Button>
      )}
    </Stack>
  </Box>
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
    backgroundColor: theme.palette.background.paper,
  }}
>
  {/* ───── Background Image ───── */}
  {place.images?.[0] && (
    <Box
      sx={{
        position: "absolute",
        inset: 0,
        height: 240,
        backgroundImage: `url(${place.images[0]})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        transform: "scale(1.12)",
        boxShadow: "none",
        zIndex: 0,
      }}
    />
  )}

  {/* ───── Progressive Blur Layer ───── */}
  {place.images?.[0] && (
    <Box
      sx={{
        position: "absolute",
        inset: 0,
        height: 340,
        zIndex: 1,
        pointerEvents: "none",

        backdropFilter: "blur(18px)",
        WebkitBackdropFilter: "blur(18px)",

        maskImage: `
          linear-gradient(
            to top,
            black 0%,
            black 35%,
            rgba(0,0,0,0.7) 55%,
            transparent 85%
          )
        `,
        WebkitMaskImage: `
          linear-gradient(
            to top,
            black 0%,
            black 35%,
            rgba(0,0,0,0.7) 55%,
            transparent 85%
          )
        `,
      }}
    />
  )}

  {/* ───── Gradient Fade to Surface ───── */}
  <Box
    sx={{
      position: "absolute",
      top: 160,
      left: 0,
      right: 0,
      height: 120,
      zIndex: 2,
      boxShadow: "none",
      background: `linear-gradient(
        to bottom,
        rgba(0,0,0,0) 0%,
        ${theme.palette.background.paper} 85%
      )`,
    }}
  />

  {/* ───── Foreground Content ───── */}
  <Box
    sx={{
      position: "relative",
      zIndex: 3,
      pt: place.images?.[0] ? 16 : 3,
      px: 3,
      pb: 3,
    }}
  >
    <Stack alignItems="left" spacing={2} sx={{ mb: 3, mt: 10 }}>


      <Typography
        variant="h5"
        fontWeight={800}
        sx={{
          textAlign: "left",
          letterSpacing: 0.2,
        }}
      >
        {place.name}
      </Typography>

      <Stack
        direction="row"
        spacing={1}
        flexWrap="wrap"
        justifyContent="left"
      >
        <Chip
          label={place.type || "Attraction"}
          size="small"
          variant="outlined"
          sx={{
            textTransform: "capitalize",
            backdropFilter: "blur(50px)",
            fontWeight: 700,
          }}
        />
        <Chip
          label={place.city || "Unknown Location"}
          size="small"
          variant="outlined"
          sx={{
            textTransform: "capitalize",
            backdropFilter: "blur(50px)",
            fontWeight: 700,
          }}
        />
      </Stack>
    </Stack>

    <Divider sx={{ mb: 3, opacity: 0.3 }} />

    <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1 }}>
      Overview
    </Typography>

    <Typography
      variant="body2"
      color="text.secondary"
      sx={{
        mb: 3,
        lineHeight: 1.6,
        textAlign: "justify",
      }}
    >
      {place.description || "No detailed description available."}
    </Typography>

    {/* Actions */}
    <Stack
      direction="row"
      spacing={1.5}
      justifyContent="space-between"
      sx={{ pt: 1 }}
    >

      <Button
      fullWidth
        variant="outlined"
        onClick={closeDrawer}
        sx={{ borderRadius: 8, borderColor: theme.palette.mode === "dark" ? "#555555" : "#cccccc", color: "text.primary", px: 3, fontWeight: 700 }}
      >
        Close
      </Button>

      <Button
      fullWidth
        variant="contained"
        onClick={() => {
          const today = new Date();
          const plus2 = new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000);

          openDrawerWithPrefill({
            name: place.name || "",
            from: "",
            to: `${place.city || ""}, ${place.state || ""}`.trim(),
            location:
              place.location ||
              `${place.city || ""}, ${place.state || ""}`.trim(),
            startDate: today.toISOString().slice(0, 10),
            endDate: plus2.toISOString().slice(0, 10),
          });
        }}
        sx={{
          borderRadius: 8,
          px: 3,
          fontWeight: 700,
          color: theme.palette.mode === "dark" ? "#000000" : "#ffffff",
          backgroundColor: theme.palette.mode === "dark" ? "#ffffff" : "#000000",
          '&:hover': {
            backgroundColor: theme.palette.mode === "dark" ? "#f1f1f1" : "#010101",
          },
        }}
      >
        Plan Trip Here
      </Button>

    </Stack>
  </Box>
</Box>

  );


  // Render
  return (
    <Box sx={{ p: 3, maxWidth: 900, mx: "auto", mt: 4.5 }}>
      
<Box sx={{ position: "fixed", bottom: q.trim() ? 4 : 68, transition: "bottom 0.25s ease", left: 0, right: 0, px: 2, zIndex: 1000 }}>
        <Box sx={{ maxWidth: 330, mx: "auto", pointerEvents: 'auto' }}>
          <AnimatePresence>
            {searchOpen ? (
              <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }}>
                <Paper sx={{ py: 1, px: 2, borderRadius: 10, backdropFilter: "blur(20px)", background: alpha(theme.palette.background.paper, 0.45), boxShadow: theme.shadows[0], border: `1.5px solid ${mode === "dark" ? "#1c1c1cff" : "#edededff"}`, mb: 2 }}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <SearchIcon color="primary" />
                    <TextField
                      autoFocus
                      fullWidth
                      placeholder="Find people, trips, or places..."
                      variant="standard"
                      value={q}
                      onChange={(e) => setQ(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSearchCommit(q)}
                      InputProps={{ disableUnderline: true }}
                    />
                    <IconButton onClick={() => { setSearchOpen(false); setQ(""); }}>
                      <CloseIcon />
                    </IconButton>
                  </Stack>
                </Paper>
              </motion.div>
            ) : (
              <Button
                fullWidth
                variant="contained"
                startIcon={<SearchIcon />}
                onClick={() => setSearchOpen(true)}
                sx={{
                  py: 1,
                  mb: 3,
                  borderRadius: 10,
                  fontSize: '1rem',
                  fontWeight: 700,
                  textTransform: "none",
                  width: '100%',
                  boxShadow: "none",
                  backgroundColor: theme.palette.mode === "light" ? "#ffffffa0" : "#2121217a",
                  backdropFilter: "blur(15px)",
                  border: `1.2px solid ${mode === "dark" ? "#353535ff" : "#aeaeaeff"}`,
                  color: mode === "dark" ? "#595959ff" : "#848484ff",
                  '&:hover': {
                    backgroundColor: theme.palette.mode === "light" ? "#e0e0e0" : "#3a3a3a",
                  },
                }}
              >
                Search Exploration
              </Button>
            )}
          </AnimatePresence>
        </Box>
      </Box>

      {!q && searchHistory.length > 0 && (
        <Box sx={{ mb: 5 }}>
          <Typography variant="overline" sx={{ fontWeight: 800, color: "text.secondary", mb: 2, display: "block" }}>
            Recent Searches
          </Typography>
          <List sx={{ p: 0 }}>
            {searchHistory.map((item, i) => {
              const meta = getHistoryMeta(item);
              return (
                <ListItem 
                  key={i} 
                  button 
                  onClick={() => setQ(item)}
                  sx={{ 
                    borderBottom: `1px solid ${theme.palette.divider}`,
                  }}
                >
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: mode === "dark" ? "#ffffff0b" : "#0000000d", color: mode === "dark" ? "#d7d7d7ff" : "#303030ff" }}>
                      <SearchIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText 
                    primary={item} 
                    secondary={meta.type.charAt(0).toUpperCase() + meta.type.slice(1)} 
                    sx={{ mb: 0, color: "text.primary" }}
                  />
                  <HistoryIcon sx={{ opacity: 0.3 }} />
                </ListItem>
              );
            })}
          </List>
        </Box>
      )}

      {q && (
        <>
          <Tabs
            value={tab}
            onChange={(_, val) => setTab(val)}
            variant="scrollable"
            sx={{ mb: 3 }}
          >
            {["all", "users", "trips", "places"].map((t) => (
              <Tab key={t} value={t} label={t.toUpperCase()} />
            ))}
          </Tabs>
        </>
      )}

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
<Typography
  variant="overline"
  sx={{
    mb: 1.5,
    fontWeight: 700,
    letterSpacing: 1,
    textTransform: "uppercase",
    color: "#555", // Neutral mid-gray tone, fixed (doesn’t switch in themes)
    display: "flex",
    alignItems: "center",
    "&::after": {
      content: '""',
      flex: 1,
      height: "1px",
      ml: 1.5,
      background: "linear-gradient(90deg, #bbb 0%, transparent 100%)",
    },
  }}
>
  {group.label} ({group.items.length})
</Typography>

                    <List>
                        {group.items
                          .slice(0, tab === "all" ? 5 : 50) // show only top 5 items in "All" tab
                          .map((item) => (
                        <motion.div
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            key={item.id || item.uid}
                        >
                            <Paper
                            sx={{
                                mb: 0,
                                p: 1,
                                borderRadius: 3,
                                boxShadow: theme.shadows[0],
                                background: alpha(theme.palette.background.paper, 0.15),
                                backdropFilter: "blur(10px)",
                                transition: "all 0.25s ease",
                                "&:hover": { boxShadow: theme.shadows[0] },
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
                                    boxShadow: "none",
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
                    {tab === "all" && group.items.length > 5 && (
                      <Box textAlign="center" sx={{ mt: 1, mb: 8 }}>
                        <Button
                          size="small"
                          onClick={() => setTab(group.key)}
                          sx={{ textTransform: "none", borderRadius: 3 }}
                        >
                          View all {group.label}
                        </Button>
                      </Box>
                    )}

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


      {/* Create Trip Drawer (shared hook) */}
<SwipeableDrawer
  anchor="bottom"
  open={createDialogOpen}
  onClose={closeTripDrawer}
  disableSwipeToOpen={false}
  PaperProps={{
    sx: {
      /* 📐 Shape */
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      maxWidth: 600,
      mx: "auto",
      maxHeight: "95vh",

      /* 🧊 Glassmorphism */
      backdropFilter: "blur(26px) saturate(1.6)",
      WebkitBackdropFilter: "blur(26px) saturate(1.6)",

      background:
        theme.palette.mode === "dark"
          ? "linear-gradient(180deg, rgba(12,12,12,0.88), rgba(0,0,0,0.95))"
          : "linear-gradient(180deg, rgba(255,255,255,0.88), rgba(248,250,252,0.96))",

      color:
        theme.palette.mode === "dark"
          ? "#ffffff"
          : "#111111",

      /* 🪟 Subtle border */
      borderTop:
        theme.palette.mode === "dark"
          ? "1px solid rgba(255,255,255,0.08)"
          : "1px solid rgba(0,0,0,0.06)",

      /* 🌬 Depth */
      boxShadow:
        theme.palette.mode === "dark"
          ? "0 -28px 80px rgba(0,0,0,0.85)"
          : "0 -24px 60px rgba(0,0,0,0.18)",

      /* 📜 Scroll */
      overflowY: "auto",
      p: { xs: 2.5, sm: 3 },

      "&::-webkit-scrollbar": {
        width: 6,
      },
      "&::-webkit-scrollbar-thumb": {
        borderRadius: 6,
        backgroundColor:
          theme.palette.mode === "dark"
            ? "rgba(255,255,255,0.18)"
            : "rgba(0,0,0,0.18)",
      },

      /* 🎬 Smoothness */
      transition: "all 420ms cubic-bezier(0.4,0,0.2,1)",
    },
  }}
>
  {/* ───── Drag Handle ───── */}
  <Box
    sx={{
      position: "sticky",
      top: 0,
      zIndex: 10,
      display: "flex",
      justifyContent: "center",
      pt: 1,
      pb: 1.2,
      mb: 1,
    }}
  >
    <Box
      sx={{
        width: 44,
        height: 4,
        borderRadius: 999,
        backgroundColor:
          theme.palette.mode === "dark"
            ? "rgba(255,255,255,0.25)"
            : "rgba(0,0,0,0.25)",
      }}
    />
  </Box>
  {/* Header */}
<Box
  sx={{
    position: "relative",
    mb: 3,
    pb: 2,

    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",

    borderBottom:
      theme.palette.mode === "dark"
        ? "1px solid rgba(255,255,255,0.08)"
        : "1px solid rgba(0,0,0,0.06)",
  }}
>
  <Box sx={{ display: "flex", flexDirection: "column" }}>
    <Typography
      variant="h6"
      sx={{
        fontWeight: 900,
        letterSpacing: 0.3,
        lineHeight: 1.2,
      }}
    >
      Create a Trip
    </Typography>

    <Typography
      variant="caption"
      sx={{
        mt: 0.5,
        color: "text.secondary",
        fontWeight: 500,
      }}
    >
      Plan routes, dates & invite members
    </Typography>
  </Box>
</Box>

  {/* Step chips */}
<Stack
  direction="row"
  alignItems="center"
  spacing={1.5}
  sx={{ mb: 2 }}
>
  {/* Step 1 */}
  <Chip
    label="Trip Details"
    size="small"
    sx={{
      px: 1.5,
      height: 30,
      fontWeight: 700,
      letterSpacing: 0.2,

      background:
        step === 0
          ? "linear-gradient(135deg, #ffffff, #f1f1f1)"
          : theme.palette.mode === "dark"
          ? "rgba(255,255,255,0.08)"
          : "rgba(0,0,0,0.06)",

      color:
        step === 0
          ? "#000"
          : theme.palette.mode === "dark"
          ? "rgba(255,255,255,0.75)"
          : "rgba(0,0,0,0.7)",

      border:
        step === 0
          ? "none"
          : theme.palette.mode === "dark"
          ? "1px solid rgba(255,255,255,0.15)"
          : "1px solid rgba(0,0,0,0.15)",

      boxShadow: "none",

      transition: "all 220ms cubic-bezier(0.4,0,0.2,1)",
    }}
  />

  {/* Connector */}
  <Box
    sx={{
      flex: 1,
      height: 2,
      borderRadius: 2,
      background:
        step >= 1
          ? "linear-gradient(90deg, #ffffff, #f1f1f1)"
          : theme.palette.mode === "dark"
          ? "rgba(255,255,255,0.12)"
          : "rgba(0,0,0,0.12)",
      transition: "background 300ms ease",
    }}
  />

  {/* Step 2 */}
  <Chip
    label="Add Members"
    size="small"
    sx={{
      px: 1.5,
      height: 30,
      fontWeight: 700,
      letterSpacing: 0.2,

      background:
        step === 1
          ? "linear-gradient(135deg, #ffffff, #f1f1f1)"
          : theme.palette.mode === "dark"
          ? "rgba(255,255,255,0.08)"
          : "rgba(0,0,0,0.06)",

      color:
        step === 1
          ? "#000"
          : theme.palette.mode === "dark"
          ? "rgba(255,255,255,0.75)"
          : "rgba(0,0,0,0.7)",

      border:
        step === 1
          ? "none"
          : theme.palette.mode === "dark"
          ? "1px solid rgba(255,255,255,0.15)"
          : "1px solid rgba(0,0,0,0.15)",

      boxShadow: "none",

      transition: "all 220ms cubic-bezier(0.4,0,0.2,1)",
    }}
  />
</Stack>


  {/* STEP 0: details */}
{step === 0 && (
  <Box
    sx={{
      display: "flex",
      flexDirection: "column",
      gap: 2.5,
      animation: "fadeUp 0.3s ease",
    }}
  >
    {/* ───── Trip Image ───── */}
    <Stack alignItems="center" spacing={1.5}>
      <Box
        sx={{
          p: 0.8,
          borderRadius: 5,
          background:
            theme.palette.mode === "dark"
              ? "linear-gradient(135deg, rgba(255,255,255,0.12), rgba(255,255,255,0.03))"
              : "linear-gradient(135deg, rgba(0,0,0,0.06), rgba(0,0,0,0.02))",
        }}
      >
        <Avatar
          src={newTrip.iconDataUri || randomNatureImage}
          sx={{
            width: 96,
            height: 96,
            borderRadius: 4,
            boxShadow:
              theme.palette.mode === "dark"
                ? "0 18px 36px rgba(0,0,0,0.6)"
                : "0 14px 28px rgba(0,0,0,0.18)",
          }}
        />
      </Box>

      <Typography variant="caption" color="text.secondary">
        Trip cover
      </Typography>
    </Stack>

    {/* ───── Trip Name ───── */}
    <TextField
      label="Trip Name"
      placeholder="e.g. Himachal Road Trip"
      fullWidth
      value={newTrip.name}
      onChange={(e) =>
        setNewTrip((prev) => ({ ...prev, name: e.target.value }))
      }
      sx={fieldSx}
    />

    {/* ───── From Location ───── */}
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
      <Typography variant="caption" sx={{ fontWeight: 600 }}>
        Starting point
      </Typography>

<Stack
  direction="row"
  spacing={1}
  sx={{
    p: 0.5,
    borderRadius: 999,
    width: "fit-content",

    background:
      theme.palette.mode === "dark"
        ? "rgba(255,255,255,0.06)"
        : "rgba(0,0,0,0.05)",

    border:
      theme.palette.mode === "dark"
        ? "1px solid rgba(255,255,255,0.12)"
        : "1px solid rgba(0,0,0,0.08)",
  }}
>
  <Chip
    icon="📍"
    label="Use current location"
    size="small"
    clickable
    onClick={() => setStartLocationMode("auto")}
    sx={{
      px: 1.2,
      height: 34,
      fontWeight: 700,
      borderRadius: 999,
      transition: "all 220ms cubic-bezier(0.4,0,0.2,1)",

      background:
        startLocationMode === "auto"
          ? theme.palette.primary.main
          : "transparent",

      color:
        startLocationMode === "auto"
          ? theme.palette.primary.contrastText
          : "text.secondary",

      boxShadow:
        startLocationMode === "auto"
          ? "0 6px 18px rgba(0,0,0,0.25)"
          : "none",

      "&:hover": {
        background:
          startLocationMode === "auto"
            ? theme.palette.primary.dark
            : theme.palette.mode === "dark"
              ? "rgba(255,255,255,0.08)"
              : "rgba(0,0,0,0.08)",
      },
    }}
  />

  <Chip
    icon="✍️"
    label="Enter manually"
    size="small"
    clickable
    onClick={() => setStartLocationMode("manual")}
    sx={{
      px: 1.2,
      height: 34,
      fontWeight: 700,
      borderRadius: 999,
      transition: "all 220ms cubic-bezier(0.4,0,0.2,1)",

      background:
        startLocationMode === "manual"
          ? theme.palette.primary.main
          : "transparent",

      color:
        startLocationMode === "manual"
          ? theme.palette.primary.contrastText
          : "text.secondary",

      boxShadow:
        startLocationMode === "manual"
          ? "0 6px 18px rgba(0,0,0,0.25)"
          : "none",

      "&:hover": {
        background:
          startLocationMode === "manual"
            ? theme.palette.primary.dark
            : theme.palette.mode === "dark"
              ? "rgba(255,255,255,0.08)"
              : "rgba(0,0,0,0.08)",
      },
    }}
  />
</Stack>


      {startLocationMode === "auto" ? (
        <TextField
          label="From (auto)"
          fullWidth
          value={newTrip.from || resolvedStartLocation}
          InputProps={{ readOnly: true }}
          sx={fieldSx}
        />
      ) : (
        <TextField
          label="From"
          fullWidth
          value={newTrip.from}
          onChange={(e) =>
            setNewTrip((prev) => ({ ...prev, from: e.target.value }))
          }
          sx={fieldSx}
        />
      )}
    </Box>

    {/* ───── Destination ───── */}
    <TextField
      label="To"
      fullWidth
      value={newTrip.to}
      onChange={(e) =>
        setNewTrip((prev) => ({ ...prev, to: e.target.value }))
      }
      sx={fieldSx}
    />

    <TextField
      label="Route / Location"
      fullWidth
      value={newTrip.location}
      onChange={(e) =>
        setNewTrip((prev) => ({ ...prev, location: e.target.value }))
      }
      sx={fieldSx}
    />

    {/* ───── Dates ───── */}
    <Stack direction="row" spacing={1.5}>
      <TextField
        label="Start Date"
        type="date"
        fullWidth
        InputLabelProps={{ shrink: true }}
        value={newTrip.startDate}
        onChange={(e) =>
          setNewTrip((prev) => ({ ...prev, startDate: e.target.value }))
        }
        sx={fieldSx}
      />
      <TextField
        label="End Date"
        type="date"
        fullWidth
        InputLabelProps={{ shrink: true }}
        value={newTrip.endDate}
        onChange={(e) =>
          setNewTrip((prev) => ({ ...prev, endDate: e.target.value }))
        }
        sx={fieldSx}
      />
    </Stack>

    {/* ───── Time & Duration ───── */}
    <Stack direction="row" spacing={1.5}>
      <TextField
        label="Start Time"
        type="time"
        fullWidth
        InputLabelProps={{ shrink: true }}
        value={newTrip.time || ""}
        onChange={(e) =>
          setNewTrip((prev) => ({ ...prev, time: e.target.value }))
        }
        sx={fieldSx}
      />
      <TextField
        label="Duration (days)"
        type="number"
        fullWidth
        value={newTrip.duration || ""}
        onChange={(e) =>
          setNewTrip((prev) => ({ ...prev, duration: e.target.value }))
        }
        sx={fieldSx}
      />
    </Stack>

    {/* ───── Actions ───── */}
    <Stack direction="row" spacing={1.5} sx={{ mt: 2 }}>
      <Button
        fullWidth
        onClick={closeTripDrawer}
        sx={{
          height: 46,
          borderRadius: 8,
          fontWeight: 600,
          textTransform: "none",
          color: theme.palette.text.primary,  
          background:
            theme.palette.mode === "dark"
              ? "rgba(255,255,255,0.06)"
              : "rgba(0,0,0,0.06)",
        }}
      >
        Cancel
      </Button>

      <Button
        variant="contained"
        fullWidth
        onClick={handleNext}
        sx={{
          height: 46,
          borderRadius: 8,
          fontWeight: 700,
          textTransform: "none",
          backgroundColor: theme.palette.mode === "dark" ? "#ffffff" : "#000000",
          color: theme.palette.mode === "dark" ? "#000000" : "#ffffff",
          "&:hover": {
            backgroundColor: theme.palette.mode === "dark" ? "#e6e6e6" : "#1a1a1a",
          },
        }}
      >
        Next
      </Button>
    </Stack>

    {/* Animation */}
    <style>
      {`
        @keyframes fadeUp {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}
    </style>
  </Box>
)}

  {/* STEP 1: members + contributions */}
{step === 1 && (
  <Box
    sx={{
      display: "flex",
      flexDirection: "column",
      gap: 3,
      animation: "fadeUp 0.35s ease",
    }}
  >
    {/* ───── Friends Picker ───── */}
    {friendCards.length > 0 && (
      <Box>
        <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 1 }}>
          Your Friends
        </Typography>

        <Stack
          direction="row"
          spacing={2}
          sx={{
            overflowX: "auto",
            pb: 1,
            "&::-webkit-scrollbar": { height: 6 },
            "&::-webkit-scrollbar-thumb": {
              backgroundColor:
                theme.palette.mode === "dark"
                  ? "rgba(255,255,255,0.25)"
                  : "rgba(0,0,0,0.25)",
              borderRadius: 3,
            },
          }}
        >
          {friendCards.map((friend) => (
            <Card
              key={friend.uid}
              sx={{
                minWidth: 140,
                p: 2,
                borderRadius: 4,
                flexShrink: 0,
                boxShadow: "none",

                background:
                  mode === "dark"
                    ? "linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03))"
                    : "linear-gradient(180deg, #ffffff, #f4f6f8)",

                border:
                  mode === "dark"
                    ? "1px solid rgba(255,255,255,0.12)"
                    : "1px solid rgba(0,0,0,0.08)",

                transition: "transform 180ms ease",

                "&:hover": {
                  transform: "translateY(-4px)",
                },
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  textAlign: "center",
                }}
              >
                <Avatar
                  src={friend.photoURL}
                  sx={{ width: 56, height: 56, mb: 1 }}
                />

                <Typography fontWeight={700} noWrap>
                  {friend.name || friend.username}
                </Typography>

                <Typography variant="caption" color="text.secondary" noWrap>
                  @{friend.username}
                </Typography>

                <Button
                  size="small"
                  onClick={() => handleAddMember(friend)}
                  sx={{
                    mt: 1.2,
                    px: 2,
                    borderRadius: 999,
                    fontWeight: 700,
                    textTransform: "none",
                    boxShadow: "none",
                    background: mode === "dark" ? "#ffffff" : "#000000",
                    color: mode === "dark" ? "#000000" : "#ffffff",
                    "&:hover": { opacity: 0.85 },
                  }}
                >
                  Add
                </Button>
              </Box>
            </Card>
          ))}
        </Stack>
      </Box>
    )}

    {/* ───── Selected Members Chips ───── */}
    {selectedMembers.length > 0 && (
      <Box>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
          Added Members
        </Typography>

        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
          {selectedMembers.map((user) => (
            <Chip
              key={user.uid}
              avatar={<Avatar src={user.photoURL} />}
              label={user.name || user.username}
              onDelete={() => handleRemoveMember(user.uid)}
              sx={{
                fontWeight: 600,
                borderRadius: 2,
                background:
                  mode === "dark"
                    ? "rgba(255,255,255,0.08)"
                    : "rgba(0,0,0,0.06)",
              }}
            />
          ))}
        </Box>
      </Box>
    )}

    {/* ───── Contributions List ───── */}
    {selectedMembers.length > 0 && (
      <Box>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
          Contributions
        </Typography>

        <Stack spacing={1.5}>
          {selectedMembers.map((m, idx) => (
            <Box
              key={m.uid}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                p: 1.5,
                borderRadius: 3,

                background:
                  theme.palette.mode === "dark"
                    ? "rgba(255,255,255,0.06)"
                    : "rgba(0,0,0,0.04)",

                border:
                  theme.palette.mode === "dark"
                    ? "1px solid rgba(255,255,255,0.08)"
                    : "1px solid rgba(0,0,0,0.08)",
              }}
            >
              <Avatar src={m.photoURL} sx={{ width: 44, height: 44 }} />

              <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                <Typography fontWeight={600} noWrap>
                  {m.name || m.username}
                </Typography>
                <Typography variant="caption" color="text.secondary" noWrap>
                  @{m.username}
                </Typography>
              </Box>

              <TextField
                label="₹ Amount"
                type="number"
                size="small"
                value={m.contribution || ""}
                onChange={(e) =>
                  handleContributionChange(idx, e.target.value)
                }
                sx={{
                  width: 120,
                  "& .MuiOutlinedInput-root": { borderRadius: 2 },
                }}
              />
            </Box>
          ))}
        </Stack>
      </Box>
    )}

    {/* ───── Total Budget Summary ───── */}
    <Box
      sx={{
        mt: 2,
        p: 2,
        borderRadius: 4,
        textAlign: "center",
        background:
          theme.palette.mode === "dark"
            ? "linear-gradient(135deg, rgba(16,185,129,0.22), rgba(16,185,129,0.08))"
            : "linear-gradient(135deg, rgba(16,185,129,0.18), rgba(16,185,129,0.08))",
      }}
    >
      <Typography variant="caption" sx={{ opacity: 0.8 }}>
        Total Budget
      </Typography>
      <Typography variant="h6" sx={{ fontWeight: 900 }}>
        ₹ {totalContribution}
      </Typography>
    </Box>

    {/* ───── Actions ───── */}
    <Stack direction="row" spacing={1.5} sx={{ mt: 2 }}>
      <Button
        fullWidth
        onClick={handleBack}
        sx={{
          height: 46,
          borderRadius: 8,
          fontWeight: 600,
          textTransform: "none",
          color: theme.palette.text.primary,
          background:
            theme.palette.mode === "dark"
              ? "rgba(255,255,255,0.06)"
              : "rgba(0,0,0,0.06)",
        }}
      >
        Back
      </Button>

      <Button
        variant="contained"
        fullWidth
        onClick={handleCreateTrip}
        sx={{
          height: 46,
          borderRadius: 8,
          fontWeight: 700,
          textTransform: "none",
          background: mode === "dark" ? "#ffffff" : "#000000",
          color: mode === "dark" ? "#000000" : "#ffffff",
        }}
      >
        Create Trip
      </Button>
    </Stack>

    {/* Animation */}
    <style>
      {`
        @keyframes fadeUp {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}
    </style>
  </Box>
)}

</SwipeableDrawer>

    </Box>
  );
}