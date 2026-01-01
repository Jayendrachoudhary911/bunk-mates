import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  IconButton,
  Button,
  Fab,
  Drawer,
  TextField,
  Stack,
  CircularProgress,
  Menu,
  MenuItem,
  Chip,
  Tooltip,
  SwipeableDrawer,
  Collapse,
  Avatar,
  ThemeProvider,
  createTheme,
  keyframes,
  Container,
  ToggleButton,
  ToggleButtonGroup,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Icon,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ShareIcon from "@mui/icons-material/Share";
import SearchIcon from "@mui/icons-material/Search";
import ExpandMore from "@mui/icons-material/ExpandMore";
import FormatBoldIcon from "@mui/icons-material/FormatBold";
import FormatItalicIcon from "@mui/icons-material/FormatItalic";
import FormatUnderlinedIcon from "@mui/icons-material/FormatUnderlined";
import FormatListBulletedIcon from "@mui/icons-material/FormatListBulleted";
import FormatListNumberedIcon from "@mui/icons-material/FormatListNumbered";
import CodeIcon from "@mui/icons-material/Code";
import PushPinIcon from "@mui/icons-material/PushPin";
import LabelIcon from "@mui/icons-material/Label";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import LabelOutlinedIcon from "@mui/icons-material/LabelOutlined";
import ViewListIcon from '@mui/icons-material/ViewList';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import ReactMarkdown from 'react-markdown';

import { db, auth } from "../firebase";
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  deleteDoc,
  doc,
  orderBy,
  updateDoc,
  getDoc,
  setDoc,
  arrayUnion,
  onSnapshot,
  serverTimestamp
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { Navigate } from "react-router-dom";
import ProfilePic from "../components/Profile";
import { weatherGradients, weatherColors, weatherbgColors, weatherIcons } from "../elements/weatherTheme";
import { useWeather } from "../contexts/WeatherContext";
import BetaAccessGuard from "../components/BetaAccessGuard";
import DeviceGuard from "../components/DeviceGuard";
import { useThemeToggle } from "../contexts/ThemeToggleContext";
import { getTheme } from "../theme";
import BottomNavBar from "../components/BottomNavBar";
import NotificationsPage from "../elements/Notifications";

function setCookie(name, value, days = 7) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = name + "=" + encodeURIComponent(value) + "; expires=" + expires + "; path=/";
}

function getCookie(name) {
  return document.cookie.split("; ").reduce((r, v) => {
    const parts = v.split("=");
    return parts[0] === name ? decodeURIComponent(parts[1]) : r;
  }, "");
}


const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(20px);}
  to { opacity: 1; transform: translateY(0);}
`;

function getUserFromStorage() {
  try {
    const storedUser = localStorage.getItem("bunkmateuser");
    if (storedUser) {
      const parsed = JSON.parse(storedUser);
      if (parsed?.uid) return parsed;
    }
    const cookieUser = document.cookie
      .split("; ")
      .find((row) => row.startsWith("bunkmateuser="))
      ?.split("=")[1];
    if (cookieUser) {
      const parsed = JSON.parse(decodeURIComponent(cookieUser));
      if (parsed?.uid) return parsed;
    }
  } catch {}
  return null;
}

const fetchUserInfo = async (uid) => {
  try {
    const userDoc = await getDoc(doc(db, "users", uid));
    if (userDoc.exists()) {
      return userDoc.data();
    }
  } catch (e) {
    // ignore
  }
  return null;
};

const WEATHER_STORAGE_KEY = "bunkmate_weather";

const glass = (mode) => ({
  background:
    mode === "dark"
      ? "rgba(30,30,30,0.65)"
      : "rgba(255,255,255,0.65)",
  backdropFilter: "blur(22px)",
  border: "1px solid rgba(255,255,255,0.08)",
});

const cardHover = {
  transition: "transform .15s ease, box-shadow .15s ease",
  "&:hover": {
    transform: "translateY(-2px)",
    boxShadow: "0 8px 30px rgba(0,0,0,0.15)",
  },
};


const Notes = () => {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editDrawerOpen, setEditDrawerOpen] = useState(false);
  const [viewDrawerOpen, setViewDrawerOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState(null);
  const [noteTitle, setNoteTitle] = useState("");
  const [noteContent, setNoteContent] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [menuIndex, setMenuIndex] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [user, setUser] = useState(null);
  const [shareDrawerOpen, setShareDrawerOpen] = useState(false);
  const [shareUsername, setShareUsername] = useState("");
  const [sharedWith, setSharedWith] = useState([]);
  const [sharedUsersInfo, setSharedUsersInfo] = useState({});
  const [expanded, setExpanded] = useState(false);
  const noteContentRef = useRef(null);
  const [labels, setLabels] = useState([]);
  const [noteLabels, setNoteLabels] = useState([]); // For add/edit
  const [selectedNoteLabels, setSelectedNoteLabels] = useState([]); // For view
  const [collaborators, setCollaborators] = useState([]); // For add/edit
  const [collaboratorInput, setCollaboratorInput] = useState("");
  const [detailsDrawerOpen, setDetailsDrawerOpen] = useState(false);
  const [addCollaboratorDrawerOpen, setAddCollaboratorDrawerOpen] = useState(false);
  const [addCollabDrawerOpen, setAddCollabDrawerOpen] = useState(false);
  const [addLabelDrawerOpen, setAddLabelDrawerOpen] = useState(false);
  const [newCollaboratorUsername, setNewCollaboratorUsername] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [sortOption, setSortOption] = useState(() => localStorage.getItem("noteSortOption") || "newest");
  const [viewMode, setViewMode] = useState(() => localStorage.getItem("noteViewMode") || "list");
  const [selectedLabelFilter, setSelectedLabelFilter] = useState(() => localStorage.getItem("noteLabelFilter") || "All");
  const [isPreview, setIsPreview] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState(null);

  const history = useNavigate();
  const { weather, setWeather, weatherLoading, setWeatherLoading } = useWeather();
  
  const { mode, setMode, accent, setAccent, toggleTheme } = useThemeToggle();
  const theme = getTheme(mode, accent);

  const buttonWeatherBg =
  weather && weatherColors[weather.main]
    ? weatherColors[weather.main]
    : weatherColors.Default;

  const WeatherBgdrop =
  weather && weatherbgColors[weather.main]
    ? weatherbgColors[weather.main]
    : weatherbgColors.Default;
    

useEffect(() => {
  if (!weather) {
    let cachedWeather = null;
    try {
      const local = localStorage.getItem(WEATHER_STORAGE_KEY);
      if (local) cachedWeather = JSON.parse(local);
      if (!cachedWeather) {
        const cookieWeather = document.cookie
          .split("; ")
          .find((row) => row.startsWith(WEATHER_STORAGE_KEY + "="))
          ?.split("=")[1];
        if (cookieWeather) cachedWeather = JSON.parse(decodeURIComponent(cookieWeather));
      }
    } catch {}

    if (cachedWeather) {
      setWeather(cachedWeather);
    }
  }
}, []);


useEffect(() => {
  const savedSort = localStorage.getItem("noteSortOption");
  const savedView = localStorage.getItem("noteViewMode");
  const savedLabel = localStorage.getItem("noteLabelFilter");

  if (savedSort) setSortOption(savedSort);
  if (savedView) setViewMode(savedView);
  if (savedLabel) setSelectedLabelFilter(savedLabel);
}, []);

useEffect(() => {
  localStorage.setItem("noteSortOption", sortOption);
}, [sortOption]);

useEffect(() => {
  localStorage.setItem("noteViewMode", viewMode);
}, [viewMode]);

useEffect(() => {
  localStorage.setItem("noteLabelFilter", selectedLabelFilter);
}, [selectedLabelFilter]);



useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        // Optional: Redirect to login if user is lost
        // history("/login");
      }
    });
    return () => unsubscribe();
  }, []);


useEffect(() => {
  if (!user) return;

  const q = query(
    collection(db, "notes"),
    where("owners", "array-contains", user.uid),
    orderBy("createdAt", "desc")
  );

  const unsubscribe = onSnapshot(
    q,
    async (snapshot) => {
      const fetched = [];
      const uids = new Set();

      snapshot.forEach((docSnap) => {
        const data = docSnap.data();

        const note = {
          id: docSnap.id,
          title: data.title || "",
          content: data.content || "",
          createdAt: data.createdAt,
          owners: data.owners || [],
          pinned: data.pinned ?? false,
          labels: data.labels || [],
          sharedWith: data.sharedWith || [],
        };

        note.owners.forEach((u) => uids.add(u));
        note.sharedWith.forEach((u) => uids.add(u));

        fetched.push(note);
      });

      // 🔹 Add "Shared" label automatically
      const processed = fetched.map((n) => {
        const isShared = !n.owners.includes(user.uid);
        return {
          ...n,
          labels: isShared ? [...new Set([...n.labels, "Shared"])] : n.labels,
        };
      });

      setNotes(processed);
      setLoading(false);

      fetchCollaboratorProfiles(Array.from(uids));
    },
    (err) => {
      console.error("Notes listener error:", err);
      setLoading(false);
    }
  );

  return () => unsubscribe();
}, [user]);


  const fetchCollaboratorProfiles = async (uids) => {
    const newInfo = { ...sharedUsersInfo };
    let hasNewData = false;

    for (const uid of uids) {
      if (!newInfo[uid]) {
        try {
          const userDoc = await getDoc(doc(db, "users", uid));
          if (userDoc.exists()) {
            newInfo[uid] = userDoc.data();
            hasNewData = true;
          }
        } catch (e) {
          console.warn(`Could not fetch profile for ${uid}`);
        }
      }
    }
    if (hasNewData) setSharedUsersInfo(newInfo);
  };

useEffect(() => {
  // Build user-selectable labels; exclude system "Shared" label
  const labelSet = new Set();
  notes.forEach((note) => {
    (note.labels || []).forEach((label) => {
      if (label === "Shared") return;
      labelSet.add(label);
    });
  });
  const sortedLabels = Array.from(labelSet).sort((a, b) => a.localeCompare(b));
  setLabels(sortedLabels);
}, [notes]);


  // When opening edit drawer, set collaborators and labels
  useEffect(() => {
    if (editDrawerOpen && selectedNote) {
      setCollaborators(selectedNote.sharedWith || []);
      setNoteLabels(selectedNote.labels || []);
    }
    if (drawerOpen) {
      setCollaborators([]);
      setNoteLabels([]);
    }
  }, [editDrawerOpen, drawerOpen, selectedNote]);

  // When viewing a note, show its labels
  useEffect(() => {
    if (viewDrawerOpen && selectedNote) {
      setSelectedNoteLabels(selectedNote.labels || []);
    }
  }, [viewDrawerOpen, selectedNote]);

  // --- Collaborator add/remove logic for add/edit ---
  const handleAddCollaborator = async () => {
    if (!collaboratorInput.trim()) return;
    // Find user by username
    const q = query(collection(db, "users"), where("username", "==", collaboratorInput.trim()));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      const userDoc = snapshot.docs[0];
      const shareUid = userDoc.id;
      if (!collaborators.includes(shareUid) && shareUid !== user.uid) {
        setCollaborators(prev => [...prev, shareUid]);
      }
      setCollaboratorInput("");
    } else {
      setError("User not found!");
    }
  };
  const handleRemoveCollaborator = (uid) => {
    setCollaborators(prev => prev.filter(id => id !== uid));
  };

const handleAddCollaboratorFromDrawer = async () => {
  if (!newCollaboratorUsername.trim()) return;

  try {
    const q = query(
      collection(db, "users"),
      where("username", "==", newCollaboratorUsername.trim())
    );
    const snapshot = await getDocs(q);

    if (!snapshot.empty && selectedNote?.id) {
      const userDoc = snapshot.docs[0];
      const shareUid = userDoc.id;

      if (shareUid === user.uid) {
        setError("You cannot share with yourself.");
        return;
      }

      const noteRef = doc(db, "notes", selectedNote.id);

      // Add both the current user and collaborator to owners and sharedWith
      await updateDoc(noteRef, {
        sharedWith: arrayUnion(shareUid),
        owners: arrayUnion(user.uid, shareUid)
      });

      // Update local state
      if (!collaborators.includes(shareUid)) {
        setCollaborators(prev => [...prev, shareUid]);
      }

      setNewCollaboratorUsername("");
      setAddCollaboratorDrawerOpen(false);
      setAddCollabDrawerOpen(false);
      setError("");
    } else {
      setError("User not found or no note selected.");
    }
  } catch (error) {
    console.error("Error adding collaborator:", error);
    setError("Something went wrong. Please try again.");
  }
};

  // --- Label add/remove logic for add/edit ---
  const handleToggleLabel = (label) => {
    setNoteLabels(prev =>
      prev.includes(label) ? prev.filter(l => l !== label) : [...prev, label]
    );
  };

    const handleAddCustomLabel = () => {
    if (!newLabel.trim()) return;
    if (!labels.includes(newLabel.trim())) {
      setLabels(prev => [...prev, newLabel.trim()]);
    }
    setNoteLabels(prev => [...prev, newLabel.trim()]);
    setNewLabel("");
    setAddLabelDrawerOpen(false);
  };

  // --- Pin note logic ---
  const handlePinNote = async (note) => {
    await updateDoc(doc(db, "notes", note.id), { pinned: !note.pinned });
    // onSnapshot will update the list; no additional fetch to reduce reads
  };

  const handleAddNote = async () => {
    if (!noteTitle.trim() && !noteContent.trim()) return;
    setSaving(true);
await addDoc(collection(db, "notes"), {
  owners: [user.uid],
  title: noteTitle,
  content: noteContent,
  createdAt: serverTimestamp(),
  sharedWith: collaborators,
  labels: noteLabels,
  pinned: false,
});
    setNoteTitle("");
    setNoteContent("");
    setDrawerOpen(false);
    setSaving(false);
    // onSnapshot will update notes
  };
 
   // --- Edit Note ---
   const handleEditNote = async () => {
     if (!selectedNote || (!noteTitle.trim() && !noteContent.trim())) return;
     setSaving(true);
     await updateDoc(doc(db, "notes", selectedNote.id), {
       title: noteTitle,
       content: noteContent,
       sharedWith: collaborators,
       labels: noteLabels,
     });
     setEditDrawerOpen(false);
     setSelectedNote(true);
     setSaving(false);
    // onSnapshot will update notes
   };
 
   const handleDeleteNote = async (id) => {
     await deleteDoc(doc(db, "notes", id));
    // onSnapshot will update notes
   };

  const handleMenuOpen = (event, index) => {
    setMenuAnchorEl(event.currentTarget);
    setMenuIndex(index);
  };
  const handleMenuClose = () => {
    setMenuAnchorEl(null);
    setMenuIndex(null);
  };

  // Open the view drawer for a note
  const openView = useCallback((note) => {
    setSelectedNote(note);
    setViewDrawerOpen(true);
  }, []);

  // Open the contextual menu for a note (stops event propagation)
  const openMenu = useCallback((event, index) => {
    event?.stopPropagation?.();
    setMenuAnchorEl(event.currentTarget);
    setMenuIndex(index);
  }, []);
  
  const handleShareNote = (note) => {
    setSelectedNote(note);
    setShareDrawerOpen(true);
    setShareUsername("");
    setSharedWith(note.sharedWith || []);
  };

  const handleShareWithUser = async () => {
    if (!shareUsername.trim()) return;
    // Find user by username
    const q = query(collection(db, "users"), where("username", "==", shareUsername.trim()));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      const userDoc = snapshot.docs[0];
      const shareUid = userDoc.id;
      // Update note's sharedWith and owners
      await updateDoc(doc(db, "notes", selectedNote.id), {
        sharedWith: [...(selectedNote.sharedWith || []), shareUid],
        owners: Array.from(new Set([...(selectedNote.owners || []), shareUid])),
      });
      setSharedWith((prev) => [...prev, shareUid]);
      setShareUsername("");
      // rely on onSnapshot to reflect changes; avoid manual fetch to prevent loops & extra reads
    } else {
      setError("User not found!");
    }
  };

// Memoized filtering (search + label)
const filteredNotes = useMemo(() => {
  const s = (searchTerm || "").toLowerCase().trim();
  return notes.filter(note => {
    // Search filter
    if (s) {
      const inTitle = (note.title || "").toLowerCase().includes(s);
      const inContent = (note.content || "").toLowerCase().includes(s);
      if (!inTitle && !inContent) return false;
    }

    // Label filter
    if (selectedLabelFilter === "All") return true;
    if (selectedLabelFilter === "Pinned") return !!note.pinned;
    if (selectedLabelFilter === "Shared") return (note.labels || []).includes("Shared");
    return (note.labels || []).includes(selectedLabelFilter);
  });
}, [notes, searchTerm, selectedLabelFilter]);

// Memoized sorting (server-side provides pinned+createdAt ordering by default)
const sortedNotes = useMemo(() => {
  const copy = [...filteredNotes];
  if (sortOption === "title-asc") {
    copy.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
  } else if (sortOption === "title-desc") {
    copy.sort((a, b) => (b.title || "").localeCompare(a.title || ""));
  } else if (sortOption === "oldest") {
    // reverse server order (server gives newest first)
    copy.reverse();
  }
  // default: server order is newest pinned-first
  return copy;
}, [filteredNotes, sortOption]);

const pinnedNotes = useMemo(() => sortedNotes.filter(n => n.pinned), [sortedNotes]);
const unpinnedNotes = useMemo(() => sortedNotes.filter(n => !n.pinned), [sortedNotes]);


  const goBack = () => {
    history(-1);
 };

 useEffect(() => {
  if (drawerOpen || editDrawerOpen) {
    setIsPreview(false);
  }
}, [drawerOpen, editDrawerOpen]);


  // --- Add formatting helper used by toolbar (fixes no-undef) ---
const applyFormat = useCallback((format) => {
  const textarea = noteContentRef.current;
  if (!textarea) return;

  const start = typeof textarea.selectionStart === "number" ? textarea.selectionStart : 0;
  const end = typeof textarea.selectionEnd === "number" ? textarea.selectionEnd : 0;

  const before = noteContent.slice(0, start);
  const selected = noteContent.slice(start, end);
  const after = noteContent.slice(end);

  let formatted = selected;
  switch (format) {
    case "bold":
      formatted = `**${selected || "bold text"}**`;
      break;
    case "italic":
      formatted = `*${selected || "italic text"}*`;
      break;
    case "underline":
      formatted = `<u>${selected || "underlined text"}</u>`;
      break;
    case "ul":
      formatted = selected
        ? selected.split("\n").map(line => (line.startsWith("- ") ? line : `- ${line}`)).join("\n")
        : "- List item";
      break;
    case "code":
      formatted = `\`\`\`\n${selected || "code"}\n\`\`\``;
      break;
    default:
      break;
  }

  const newValue = before + formatted + after;
  setNoteContent(newValue);

  // restore focus and put caret after inserted text
  setTimeout(() => {
    textarea.focus();
    const pos = before.length + formatted.length;
    textarea.selectionStart = textarea.selectionEnd = pos;
  }, 0);
}, [noteContent, noteContentRef, setNoteContent]);


const NoteCard = ({ note, onOpen, onMenu, mode, theme }) => (
  <Card
    onClick={onOpen}
    sx={{
      ...glass(mode),
      ...cardHover,
      borderRadius: 4,
      cursor: "pointer",
      position: "relative",
    }}
  >
    <CardContent sx={{ pb: 1.5 }}>
      <Stack direction="row" justifyContent="space-between">
        <Box>
          <Typography fontWeight={700} fontSize={16}>
            {note.title || "Untitled"}
            {note.pinned && (
              <PushPinIcon
                sx={{ ml: 1, fontSize: 16, color: theme.palette.success.main }}
              />
            )}
          </Typography>

          <Box sx={{ mt: 0.5, opacity: 0.75 }}>
            <ReactMarkdown
              components={{
                p: ({ children }) => <Typography variant="body2" sx={{ display: 'inline' }}>{children}</Typography>,
                h1: ({ children }) => <Typography variant="body2" sx={{ fontWeight: 'bold', display: 'inline' }}>{children}</Typography>,
                h2: ({ children }) => <Typography variant="body2" sx={{ fontWeight: 'bold', display: 'inline' }}>{children}</Typography>,
                h3: ({ children }) => <Typography variant="body2" sx={{ fontWeight: 'bold', display: 'inline' }}>{children}</Typography>,
                ul: ({ children }) => <Typography variant="body2" sx={{ display: 'inline' }}>{children}</Typography>,
                ol: ({ children }) => <Typography variant="body2" sx={{ display: 'inline' }}>{children}</Typography>,
                li: ({ children }) => <Typography variant="body2" sx={{ display: 'inline' }}>{children}</Typography>,
                code: ({ children }) => <Typography variant="body2" sx={{ fontFamily: 'monospace', display: 'inline' }}>{children}</Typography>,
                pre: ({ children }) => <Typography variant="body2" sx={{ display: 'inline' }}>{children}</Typography>,
              }}
            >
              {note.content?.slice(0, 80) + (note.content?.length > 80 ? "…" : "")}
            </ReactMarkdown>
          </Box>
        </Box>

        <IconButton
          onClick={(e) => {
            e.stopPropagation();
            onMenu(e);
          }}
          size="small"
        >
          <MoreVertIcon />
        </IconButton>
      </Stack>

      {(note.labels?.length > 0 || note.owners?.[0] !== undefined) && (
        <Stack direction="row" spacing={0.8} mt={1} flexWrap="wrap">
          {note.labels?.map((label) => (
            <Chip
              key={label}
              size="small"
              label={label}
              sx={{
                fontSize: 11,
                borderRadius: 2,
                backgroundColor: mode === "dark" ? "#ffffff20" : "#00000020",
              }}
            />
          ))}

          {!note.owners == undefined && (
            <Chip
              size="small"
              label="Shared"
              sx={{
                fontSize: 11,
                fontWeight: 600,
                color: mode === "dark" ? "#ffffffff" : "#000000ff",
                background: mode === "dark" ? "#ffffff20" : "#00000020",
              }}
            />
          )}
        </Stack>
      )}
    </CardContent>
  </Card>
);


  return (
    <ThemeProvider theme={theme}>
      <DeviceGuard>
      <BetaAccessGuard>
              <Box
        sx={{
          p: 3,
          backgroundColor: theme.palette.background.default,
          color: theme.palette.text.primary,
          Height: "auto",
          maxWidth: 700,
          mx: "auto",
          mt: 4.5,
        }}
      >
          <Box
            sx={{
              display: "flex",
              flexDirection: "row",
              gap: 3,
              justifyContent: "space-between",
              mb: 2
            }}
          >
            <Typography variant="h4" fontWeight="bold" sx={{ flex: 1, color: mode === "dark" ? "#fff" : "#000" }}>
              Notes
            </Typography>

            <NotificationsPage />
          </Box>

        <Box 
          sx={{ 
            position: "sticky", 
            top: 0,
            paddingTop: "25px", 
            zIndex: 1,
            pb: 3,
            background: `linear-gradient(to bottom, ${theme.palette.background.default}, ${theme.palette.background.default}, ${theme.palette.background.default}, ${theme.palette.background.default}, ${theme.palette.background.default}90, ${theme.palette.background.default}00)`,
          }}
        >
          <TextField
            size="small"
            placeholder="Search notes..."
            variant="outlined"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <SearchIcon sx={{ color: mode === "dark" ? "#aaa" : "#333", mr: 1 }} />
              ),
              style: { color: mode === "dark" ? "#aaa" : "#333", borderRadius: 11 },
            }}
            sx={{
              width: "100%",
              mb: 2,
              input: { color: mode === "dark" ? "#aaa" : "#333", borderColor: mode === "dark" ? "#fff" : "#000" },
            }}
          />

<Box display="flex" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
  <TextField
  select
  label="Sort by"
  value={sortOption}
  onChange={(e) => setSortOption(e.target.value)}
  size="small"
  sx={{ minWidth: 150, color: mode === "dark" ? "#000000ff" : "#ffffffff" }}
  InputLabelProps={{ color: mode === "dark" ? "#000000ff" : "#ffffffff", borderRadius: 12 }}
  InputProps={{ color: mode === "dark" ? "#000000ff" : "#ffffffff", borderRadius: 12 }}
>
  <MenuItem value="newest">Newest First</MenuItem>
  <MenuItem value="oldest">Oldest First</MenuItem>
  <MenuItem value="title-asc">Title A–Z</MenuItem>
  <MenuItem value="title-desc">Title Z–A</MenuItem>
</TextField>

<ToggleButtonGroup
  value={viewMode}
  exclusive
  onChange={(e, next) => next && setViewMode(next)}
  size="small"
  borderRadius={12}
>
  <ToggleButton value="list">
    <ViewListIcon sx={{ color: mode === "dark" ? "#ffffffff" : "#000000ff" }} />
  </ToggleButton>
  <ToggleButton value="grid">
    <ViewModuleIcon sx={{ color: mode === "dark" ? "#ffffffff" : "#000000ff" }} />
  </ToggleButton>
</ToggleButtonGroup>
</Box>


<Stack direction="row" spacing={1} sx={{ overflowX: "auto", mb: 2 }}>
  {["All", "Pinned", "Shared", ...labels].map((label) => (
    <Chip
      key={label}
      label={label === "Pinned" ? "📌 Pinned" : label}
      clickable
      color={selectedLabelFilter === label ? "primary" : "default"}
      onClick={() => setSelectedLabelFilter(label)}
      sx={{
        borderRadius: 5,
        backdropFilter: "blur(80px)",
        color: selectedLabelFilter === label ? mode === "dark" ? "#000000ff" : "#ffffffff" : theme.palette.text.secondary,
        backgroundColor: selectedLabelFilter === label ? mode === "dark" ? "#ffffffff" : "#000000ff" : theme.palette.background.paper,
      }}
    />
  ))}
</Stack>


        </Box>
          <Box sx={{ mb: 2, backgroundColor: "transparent", height: "auto" }}>
          <CardContent sx={{ mb: 8, padding: 0, backgroundColor: "transparent" }}>
            {loading ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 1 }}>
                <CircularProgress color="inherit" />
              </Box>
            ) : sortedNotes.length === 0 ? (
              <Box sx={{ display: "flex", height: "70vh", alignItems: "center", justifyContent: "center" }}>
                <Typography color="text.secondary" fontSize={16}>
                  No notes yet.
                </Typography>
              </Box>
            ) : (
<Box>
{viewMode === "list" ? (
  <Stack spacing={1.4}>
    {[...pinnedNotes, ...unpinnedNotes].map((note, idx) => (
      <NoteCard
        key={note.id}
        note={note}
        mode={mode}
        theme={theme}
        onOpen={() => openView(note)}
        onMenu={(e) => openMenu(e, idx)}
      />
    ))}
  </Stack>
) : (
  <Box
    sx={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(240px,1fr))",
      gap: 1.5,
    }}
  >
    {[...pinnedNotes, ...unpinnedNotes].map((note, idx) => (
      <NoteCard
        key={note.id}
        note={note}
        mode={mode}
        theme={theme}
        onOpen={() => openView(note)}
        onMenu={(e) => openMenu(e, idx)}
      />
    ))}
  </Box>
)}

</Box>
            )}
          </CardContent>
          </Box>

        {/* Add Note Drawer */}
        <SwipeableDrawer
          anchor="bottom"
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          onOpen={() => {}}
          disableSwipeToOpen={true}
          disableDiscovery={true}
          PaperProps={{
            sx: {
              borderTopLeftRadius: 0,
              borderTopRightRadius: 0,
              borderBottomLeftRadius: 0,
              borderBottomRightRadius: 0,
              backgroundColor: theme.palette.background.default,
              p: 3,
              maxWidth: 480,
              height: "95vh",
              mx: "auto",
            },
          }}
        >
            <Box
    sx={{
      display: "flex",
      flexDirection: "column",
      pb: 9, // space for floating button
    }}
  >
    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2, mt: 4.5 }}>
    <Typography variant="h6" fontWeight="bold" color={theme.palette.text.primary}>
      {editDrawerOpen ? "Edit Note" : ""}
    </Typography>
    <Button
      variant="contained"
      onClick={editDrawerOpen ? handleEditNote : handleAddNote}
      disabled={saving}
      fullWidth
      sx={{ borderRadius: 4, color: "#000", backgroundColor: theme.palette.primary.bgr, fontWeight: "bold", width: "110px", boxShadow: "none" }}
    >
      {saving ? "Saving..." : editDrawerOpen ? "Save" : "Add Note"}
    </Button>
    </Box>

    {/* Title Input */}
    <TextField
      placeholder="Enter title..."
      value={noteTitle}
      onChange={(e) => setNoteTitle(e.target.value)}
      fullWidth
      variant="standard"
      InputProps={{
        disableUnderline: true,
        sx: {
          fontSize: 22,
          fontWeight: 600,
          color: mode === "dark" ? "#fff" : "#000",
          mb: 1,
        },
      }}
    />
        {/* Labels Display */}
    <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", mt: 1, mb: 1 }}>
      {labels.map((label) => (
        <Chip
          key={label}
          label={label}
          onClick={() => handleToggleLabel(label)}
          variant={noteLabels.includes(label) ? "filled" : "outlined"}
          size="small"
          sx={{
            color: noteLabels.includes(label) ? "#000" : "#BDBDBD",
            background: noteLabels.includes(label) ? theme.palette.primary.bgr : "#f1f1f111",
          }}
        />
      ))}
    </Stack>

    {/* Preview Toggle */}
    <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
      <Button
        variant={isPreview ? "contained" : "outlined"}
        onClick={() => setIsPreview(!isPreview)}
        sx={{
          borderRadius: 4,
          color: isPreview ? "#000" : theme.palette.text.primary,
          backgroundColor: isPreview ? theme.palette.primary.bgr : "transparent",
          borderColor: mode === "dark" ? "#fff" : "#000",
        }}
      >
        {isPreview ? "Edit" : "Preview"}
      </Button>
    </Box>

    {/* Content */}
    {isPreview ? (
      <Box sx={{ flex: 1, mb: 2, p: 2, border: `1px solid ${theme.palette.divider}`, borderRadius: 2, minHeight: 300 }}>
        <ReactMarkdown
          components={{
            p: ({ children }) => <Typography variant="body1" sx={{ mb: 2, color: theme.palette.text.primary }}>{children}</Typography>,
            h1: ({ children }) => <Typography variant="h4" sx={{ mb: 1, fontWeight: 'bold', color: theme.palette.text.primary }}>{children}</Typography>,
            h2: ({ children }) => <Typography variant="h5" sx={{ mb: 1, fontWeight: 'bold', color: theme.palette.text.primary }}>{children}</Typography>,
            h3: ({ children }) => <Typography variant="h6" sx={{ mb: 1, fontWeight: 'bold', color: theme.palette.text.primary }}>{children}</Typography>,
            ul: ({ children }) => <Box component="ul" sx={{ pl: 2, mb: 2 }}>{children}</Box>,
            ol: ({ children }) => <Box component="ol" sx={{ pl: 2, mb: 2 }}>{children}</Box>,
            li: ({ children }) => <Typography component="li" sx={{ color: theme.palette.text.primary }}>{children}</Typography>,
            code: ({ children }) => <Box component="code" sx={{ bgcolor: mode === "dark" ? "#333" : "#f5f5f5", p: 0.5, borderRadius: 1, fontFamily: 'monospace' }}>{children}</Box>,
            pre: ({ children }) => <Box component="pre" sx={{ bgcolor: mode === "dark" ? "#333" : "#f5f5f5", p: 1, borderRadius: 1, overflow: 'auto', mb: 2 }}>{children}</Box>,
          }}
        >
          {noteContent || 'Nothing to preview'}
        </ReactMarkdown>
      </Box>
    ) : (
      <TextField
        placeholder="Start writing your note..."
        value={noteContent}
        onChange={(e) => setNoteContent(e.target.value)}
        fullWidth
        multiline
        minRows={12}
        variant="standard"
        inputRef={noteContentRef}
        InputProps={{
          disableUnderline: true,
          sx: { color: mode === "dark" ? "#fff" : "#000", fontFamily: "inherit", fontSize: 16 },
        }}
        sx={{ flex: 1, mb: 2 }}
      />
    )}

  </Box>

    {/* Toolbar */}
<Box
  sx={{
    position: "sticky",
    bottom: 0,
    ...glass(mode),
    borderRadius: 4,
    p: 1,
    display: "flex",
    justifyContent: "space-between",
  }}
>
  <Stack direction="row" spacing={0.5}>
    <IconButton onClick={() => applyFormat("bold")}><FormatBoldIcon /></IconButton>
    <IconButton onClick={() => applyFormat("italic")}><FormatItalicIcon /></IconButton>
    <IconButton onClick={() => applyFormat("code")}><CodeIcon /></IconButton>
  </Stack>

  <Stack direction="row" spacing={0.5}>
    <IconButton onClick={() => setAddCollabDrawerOpen(true)}>
      <PersonAddIcon />
    </IconButton>
    <IconButton onClick={() => setAddLabelDrawerOpen(true)}>
      <LabelOutlinedIcon />
    </IconButton>
  </Stack>
</Box>

          </SwipeableDrawer>

        <SwipeableDrawer
          anchor="bottom"
          open={addCollaboratorDrawerOpen}
          onClose={() => setAddCollaboratorDrawerOpen(false)}
          onOpen={() => {}}
          disableSwipeToOpen={true}
          disableDiscovery={true}
          PaperProps={{
            sx: {
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              backgroundColor: "${theme.palette.background.default}00",
              backdropFilter: "blur(80px)",
              p: 3,
              maxWidth: 400,
              mx: "auto",
            },
          }}
        >
          <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
            Add Collaborator
          </Typography>
          <Stack spacing={2}>
            <TextField
              label="Username"
              value={newCollaboratorUsername}
              onChange={e => setNewCollaboratorUsername(e.target.value)}
              fullWidth
              variant="outlined"
              InputProps={{ style: { color: mode === "dark" ? "#fff" : "#000" } }}
              InputLabelProps={{ style: { color: mode === "dark" ? "#aaa" : "#333" } }}
            />
            {error && (
              <Typography color="error" sx={{ mt: 1 }}>
                {error}
              </Typography>
            )}
            <Button
              variant="contained"
              sx={{
                borderRadius: 5,
                px: 2,
                py: 1,
                color: "#000",
                background: theme.palette.primary.bgr,
                boxShadow: "none",
                fontWeight: "bold",
              }}
              onClick={handleAddCollaboratorFromDrawer}
              fullWidth
            >
              Add Collaborator
            </Button>
          </Stack>
        </SwipeableDrawer>

        {/* Add Custom Label Drawer */}
        <SwipeableDrawer
          anchor="bottom"
          open={addLabelDrawerOpen}
          onClose={() => setAddLabelDrawerOpen(false)}
          onOpen={() => {}}
          disableSwipeToOpen={true}
          disableDiscovery={true}
          PaperProps={{
            sx: {
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              backgroundColor: "${theme.palette.background.default}00",
              backdropFilter: "blur(80px)",
              p: 3,
              maxWidth: 400,
              mx: "auto",
            },
          }}
        >
          <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
            Add Custom Label
          </Typography>
          <Stack spacing={2}>
            <TextField
              label="Label Name"
              value={newLabel}
              onChange={e => setNewLabel(e.target.value)}
              fullWidth
              variant="outlined"
              InputProps={{ style: { color: mode === "dark" ? "#fff" : "#000" } }}
              InputLabelProps={{ style: { color: mode === "dark" ? "#aaa" : "#333" } }}
            />
            <Button
              variant="contained"
              sx={{
                borderRadius: 4,
                px: 2,
                py: 1,
                color: "#000",
                background: theme.palette.primary.bgr,
                fontWeight: "bold",
              }}
              onClick={handleAddCustomLabel}
              fullWidth
            >
              Add Label
            </Button>
          </Stack>
        </SwipeableDrawer>

        {/* View Note Drawer */}
        <SwipeableDrawer
          anchor="bottom"
          open={viewDrawerOpen}
          onClose={() => setViewDrawerOpen(false)}
          onOpen={() => {}}
          disableSwipeToOpen={true}
          disableDiscovery={true}
          PaperProps={{
            sx: {
              backgroundColor: mode === "dark" ? "#0c0c0c" : "#f1f1f1",
              p: 3,
              maxWidth: 480,
              height: "95vh",
              mx: "auto",
            },
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2, mt: 4.5 }}>
            <Button
              onClick={() => setViewDrawerOpen(false)}
              sx={{
                mr: 2,
                height: 36,
                minWidth: 0,
                borderRadius: 8,
                color: mode === "dark" ? "#fff" : "#000",
                backgroundColor: mode === "dark" ? "#f1f1f111" : "#e0e0e0",
                gap: 0.5,
              }}
            >
              <ArrowBackIcon /> <Typography>Back</Typography>
            </Button>
          </Box>
          
          <Box sx={{ mb: 2 }}>
            <Typography variant="h4" fontWeight="bold" sx={{ flex: 1, borderBottom: "1px solid #777777ff", paddingBottom: 1, mb: 3 }}>
              {selectedNote?.title || ""}
            </Typography>

          {selectedNote?.sharedWith && selectedNote.sharedWith.length > 0 && (
  <Box sx={{ mt: 2, mb: 2 }}>
    <Stack direction="row" spacing={1}>
      {selectedNote.sharedWith.map((uid, i) => {
        const user = sharedUsersInfo[uid];
        return (
          <Box key={uid} sx={{ display: "flex", alignItems: "center", gap: 1, background: mode === "dark" ? "#171717" : "#acacac7e", borderRadius: 8, px: 0.5, py: 0.5 }}>
            <Avatar
              src={user?.photoURL || ""}
              alt={user?.username || "User"}
              sx={{ width: 24, height: 24, fontSize: 14, bgcolor: theme.palette.primary.bg, color: "#000" }}
            >
              {user?.username ? user.username[0].toUpperCase() : "U"}
            </Avatar>
            <Typography variant="body2" sx={{ color: mode === "dark" ? "#aaa" : "#333", fontSize: 14, mr: 0.3 }}>
              {user?.username || uid.slice(0, 6) + "..."}
            </Typography>
          </Box>
        );
      })}
    </Stack>
  </Box>
)}


          {selectedNote?.labels && selectedNote.labels.length > 0 && (
            <Box sx={{ width: "100%", mb: 2 }}>
              <Stack direction="row" display="flex" alignItems="center" spacing={1}>
                {selectedNote.labels.map(label => (
                  <Chip
                    key={label}
                    icon={<LabelIcon sx={{ color: theme.palette.text.primary }} />}
                    label={label}
                    size="small"
                    sx={{
                      fontSize: "0.7rem",
                      borderRadius: '10px',
                      color: theme.palette.text.primary,
                      background: mode === "dark" ? "#3a3a3a" : "#bdbdbd83",
                    }}
                  />
                ))}
              </Stack>
            </Box>
          )}

            <Box>
              <Box height={"-webkit-fill-available"}>
                <ReactMarkdown
                  components={{
                    p: ({ children }) => <Typography variant="body1" sx={{ mb: 2, color: theme.palette.text.primary }}>{children}</Typography>,
                    h1: ({ children }) => <Typography variant="h4" sx={{ mb: 1, fontWeight: 'bold', color: theme.palette.text.primary }}>{children}</Typography>,
                    h2: ({ children }) => <Typography variant="h5" sx={{ mb: 1, fontWeight: 'bold', color: theme.palette.text.primary }}>{children}</Typography>,
                    h3: ({ children }) => <Typography variant="h6" sx={{ mb: 1, fontWeight: 'bold', color: theme.palette.text.primary }}>{children}</Typography>,
                    ul: ({ children }) => <Box component="ul" sx={{ pl: 2, mb: 2 }}>{children}</Box>,
                    ol: ({ children }) => <Box component="ol" sx={{ pl: 2, mb: 2 }}>{children}</Box>,
                    li: ({ children }) => <Typography component="li" sx={{ color: theme.palette.text.primary }}>{children}</Typography>,
                    code: ({ children }) => <Box component="code" sx={{ bgcolor: mode === "dark" ? "#333" : "#f5f5f5", p: 0.5, borderRadius: 1, fontFamily: 'monospace' }}>{children}</Box>,
                    pre: ({ children }) => <Box component="pre" sx={{ bgcolor: mode === "dark" ? "#333" : "#f5f5f5", p: 1, borderRadius: 1, overflow: 'auto', mb: 2 }}>{children}</Box>,
                  }}
                >
                  {selectedNote?.content || ''}
                </ReactMarkdown>
              </Box>


            <Box 
              sx={{ 
                display: "flex",
                padding: 1,
                position: "sticky",
                right: 0,
                bottom: 0,
                backgroundColor: mode === "dark" ? "#252525ff" : "#e0e0e0",
                justifyContent: "space-between",
                borderRadius: 8,
                alignContent: "center"
              }}>
              <Tooltip title="Edit">
              <IconButton
                onClick={() => {
                  setSelectedNote(selectedNote);
                  setNoteTitle(selectedNote.title || "");
                  setNoteContent(selectedNote.content || "");
                  setEditDrawerOpen(true);
                  setDrawerOpen(true);
                  setViewDrawerOpen(false);
                }}
                sx={{ color: theme.palette.text.primary, backgroundColor: mode === "dark" ? "#3a3a3a" : "#bdbdbd83", padding: 1 }}
              >
                <EditIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Share">
              <IconButton
                onClick={() => {
                  handleShareNote(selectedNote);
                  setAddCollabDrawerOpen(true);
                }}
                sx={{ color: theme.palette.text.primary, backgroundColor: mode === "dark" ? "#3a3a3a" : "#bdbdbd83", padding: 1 }}
              >
                <ShareIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title={selectedNote?.pinned ? "Unpin" : "Pin to Top"}>
              <IconButton
                onClick={() => handlePinNote(selectedNote)}
                sx={{ 
                  color: selectedNote?.pinned ? "#00f721" : theme.palette.text.primary,
                  backgroundColor: selectedNote?.pinned ? "#00f72121" : `${mode === "dark" ? "#3a3a3a" : "#bdbdbd83"}`,
                  padding: 1,
                  transform: selectedNote?.pinned ? "rotate(30deg)" : "rotate(0deg)",
                 }}
              >
                <PushPinIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Note Details">
              <IconButton
                onClick={() => setDetailsDrawerOpen(true)}
                sx={{ color: theme.palette.text.primary, backgroundColor: mode === "dark" ? "#3a3a3a" : "#bdbdbd83", padding: 1 }}
              >
                <InfoOutlinedIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete Note">
              <IconButton
                onClick={() => {
                  setNoteToDelete(selectedNote);
                  setDeleteDialogOpen(true);
                }}
                sx={{ color: mode === "dark" ? "#ffd4d4" : "#ff0000ff", backgroundColor: mode === "dark" ? "#ff0000" : "#ffd4d4", padding: 1 }}
              >
                <DeleteOutlineIcon />
              </IconButton>
            </Tooltip>
            </Box>

            </Box>
          </Box>

        </SwipeableDrawer>

        <SwipeableDrawer
          anchor="bottom"
          open={addCollabDrawerOpen}
          onClose={() => setAddCollabDrawerOpen(false)}
          onOpen={() => {}}
          disableSwipeToOpen={true}
          disableDiscovery={true}
          PaperProps={{
            sx: {
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              backgroundColor: "${theme.palette.background.default}00",
              backdropFilter: "blur(80px)",
              p: 3,
              maxWidth: 400,
              mx: "auto",
              zIndex: 999,
            },
          }}
        >
          <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
            Add Collaborator11
          </Typography>
          <Stack spacing={2}>
            <TextField
              label="Username"
              value={newCollaboratorUsername}
              onChange={e => setNewCollaboratorUsername(e.target.value)}
              fullWidth
              variant="outlined"
              InputProps={{ style: { color: "#fff" } }}
              InputLabelProps={{ style: { color: "#aaa" } }}
            />
            {error && (
              <Typography color="error" sx={{ mt: 1 }}>
                {error}
              </Typography>
            )}
            <Button
              variant="contained"
              sx={{
                borderRadius: 4,
                px: 2,
                py: 1,
                color: "#000",
                background: buttonWeatherBg,
                fontWeight: "bold",
              }}
              onClick={handleAddCollaboratorFromDrawer}
              fullWidth
            >
              Add Collaborator
            </Button>
          </Stack>
        </SwipeableDrawer>


<Dialog
  open={deleteDialogOpen}
  onClose={() => setDeleteDialogOpen(false)}
  PaperProps={{
    sx: {
      backgroundColor: mode === "dark" ? "#00000000" : "#ffffff91",
      backdropFilter: 'blur(10px)',
      boxShadow: 'none',
      borderRadius: 6,
    }
  }}
>
  <DialogTitle variant="title">Delete Note</DialogTitle>
  <DialogContent>
    <Typography>
      Are you sure you want to delete{" "}
      <strong>{noteToDelete?.title || "this note"}</strong>?
    </Typography>
  </DialogContent>
  <DialogActions sx={{ mb: 2, mr: 2 }}>
    <Button 
      onClick={() => setDeleteDialogOpen(false)} 
      color="inherit" 
      variant="outlined" 
      sx={{ 
        color: "#000",
        borderRadius: 4,
        fontWeight: "bold",
        backgroundColor: mode === "dark" ? "#f1f1f111" : "#e0e0e071",
        color: mode === "dark" ? "#fff" : "#000", 
        boxShadow: "none",
      }}
    >
      Cancel
    </Button>
    <Button
      onClick={async () => {
        await handleDeleteNote(noteToDelete.id);
        setDeleteDialogOpen(false);
        setNoteToDelete(null);
        setViewDrawerOpen(false);
      }}
      color="error"
      variant="contained"
      sx={{ backgroundColor: mode === "dark" ? "#700000ff" : "#ffd4d4", borderRadius: 4, color: mode === "dark" ? "#ffd4d4" : "#ff0000ff", boxShadow: "none", fontWeight: "bold" }}
    >
      Delete
    </Button>
  </DialogActions>
</Dialog>


        {/* Note Details Drawer */}
        <SwipeableDrawer
          anchor="right"
          open={detailsDrawerOpen}
          onClose={() => setDetailsDrawerOpen(false)}
          onOpen={() => {}}
          disableSwipeToOpen={true}
          disableDiscovery={true}
          PaperProps={{
            sx: {
              borderTopLeftRadius: 16,
              borderBottomLeftRadius: 16,
              backgroundColor: mode === "dark" ? "#00000000" : "#ffffffda",
              backdropFilter: "blur(80px)",
              p: 3,
              pt: 7.5,
              maxWidth: 340,
              width: "85vw", 
              height: "95vh",
              mx: "auto",
            },
          }}
        >
          <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
            Note Details
          </Typography>
          {selectedNote && (
            <Stack spacing={2}>
              <Box>
                <Typography variant="subtitle2" sx={{ color: theme.palette.text.secondary }}>Title:</Typography>
                <Typography variant="title" sx={{ fontSize: "2rem" }}>{selectedNote.title || "Untitled"}</Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" sx={{ color: theme.palette.text.secondary }}>Labels:</Typography>
                <Stack direction="row" spacing={1}>
                  {(selectedNote.labels || []).map(label => (
                    <Chip
                      key={label}
                      icon={<LabelIcon sx={{ color: "#000" }} />}
                      label={label}
                      size="small"
                      sx={{
                        fontSize: "0.7rem",
                        borderRadius: '10px',
                        color: mode === "dark" ? "#fff" : "#000",
                        background: mode === "dark" ? "#3a3a3a" : "#bdbdbd83",
                      }}
                    />
                  ))}
                </Stack>
              </Box>
              <Box>
                <Typography variant="subtitle2" sx={{ color: theme.palette.text.secondary }}>Collaborators:</Typography>
                <Stack direction="row" spacing={1}>
                  {(selectedNote.sharedWith || []).map(uid => {
                    const user = sharedUsersInfo[uid];
                    return (
                      <Box key={uid} sx={{ display: "flex", alignItems: "center", gap: 1, background: mode === "dark" ? "#171717" : "#acacac7e", borderRadius: 8, px: 0.5, py: 0.5 }}>
                        <Avatar
                          src={user?.photoURL || ""}
                          alt={user?.username || "User"}
                          sx={{ width: 24, height: 24, fontSize: 14, bgcolor: theme.palette.primary.bg, color: "#000" }}
                        >
                          {user?.username ? user.username[0].toUpperCase() : "U"}
                        </Avatar>
                        <Typography variant="body2" sx={{ color: theme.palette.text.primary, fontSize: 14, marginRight: 1 }}>
                          {user?.username || uid.slice(0, 6) + "..."}
                        </Typography>
                      </Box>
                    );
                  })}
                </Stack>
              </Box>
              <Box>
                <Typography variant="subtitle2" sx={{ color: theme.palette.text.secondary }}>Created At:</Typography>
                <Typography variant="body2">
                  {selectedNote.createdAt?.toDate
                    ? selectedNote.createdAt.toDate().toLocaleString()
                    : new Date(selectedNote.createdAt).toLocaleString()}
                </Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" sx={{ color: theme.palette.text.secondary }}>Created By:</Typography>
                <Stack direction="row" spacing={1}>
                  {selectedNote.owners && selectedNote.owners.length > 0 && (
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, background: mode === "dark" ? "#171717" : "#acacac7e", borderRadius: 8, px: 0.5, py: 0.5 }}>
                      <Avatar
                        src={sharedUsersInfo[selectedNote.owners[0]]?.photoURL || ""}
                        alt={sharedUsersInfo[selectedNote.owners[0]]?.username || "User"}
                        sx={{ width: 24, height: 24, fontSize: 14, bgcolor: theme.palette.primary.bg, color: "#000" }}
                      >
                        {sharedUsersInfo[selectedNote.owners[0]]?.username
                          ? sharedUsersInfo[selectedNote.owners[0]].username[0].toUpperCase()
                          : "U"}
                      </Avatar>
                      <Typography variant="body2" sx={{ color: theme.palette.text.primary, fontSize: 14, marginRight: 1 }}>
                        {sharedUsersInfo[selectedNote.owners[0]]?.username ||
                          selectedNote.owners[0].slice(0, 6) + "..."}
                      </Typography>
                    </Box>
                  )}
                </Stack>
              </Box>
              <Box>
                <Typography variant="subtitle2" sx={{ color: theme.palette.text.secondary }}>Note ID:</Typography>
                <Typography variant="body2">{selectedNote.id}</Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" sx={{ color: theme.palette.text.secondary }}>Pinned:</Typography>
                <Typography variant="body2">{selectedNote.pinned ? "Yes" : "No"}</Typography>
              </Box>
            </Stack>
          )}
        </SwipeableDrawer>
        
          <Button
            size="medium"
            sx={{ ml: 2, backgroundColor: theme.palette.primary.bg + "7d", backdropFilter: "blur(20px)", minWidth: "40px", width: "50px", height: "50px", color: mode === "dark" ? "#fff" : "#000", borderRadius: "15px", boxShadow: "none", position: "fixed", bottom: 90, right: 20, zIndex: 999 }}
            onClick={() => setDrawerOpen(true)}
          > 
            <AddIcon sx={{ px: 0 }} />
          </Button>
          
          </Box>
      </BetaAccessGuard>
      </DeviceGuard>
    </ThemeProvider>
  );
};

export default Notes;