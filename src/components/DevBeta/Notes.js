import React, { useState, useEffect, useRef, useCallback, useMemo, useTransition, useDeferredValue } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  IconButton,
  Button,
  TextField,
  Stack,
  CircularProgress,
  MenuItem,
  Chip,
  Tooltip,
  SwipeableDrawer,
  Avatar,
  ThemeProvider,
  ToggleButton,
  ToggleButtonGroup,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ShareIcon from "@mui/icons-material/Share";
import SearchIcon from "@mui/icons-material/Search";
import FormatBoldIcon from "@mui/icons-material/FormatBold";
import FormatItalicIcon from "@mui/icons-material/FormatItalic";
import CodeIcon from "@mui/icons-material/Code";
import PushPinIcon from "@mui/icons-material/PushPin";
import LabelIcon from "@mui/icons-material/Label";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import LabelOutlinedIcon from "@mui/icons-material/LabelOutlined";
import ViewListIcon from '@mui/icons-material/ViewList';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import ReactMarkdown from 'react-markdown';
import { db, auth } from "../../firebase";
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
  arrayUnion,
  onSnapshot,
  serverTimestamp,
  limit
} from "firebase/firestore";
import { weatherColors } from "../../elements/weatherTheme";
import { useWeather } from "../../contexts/WeatherContext";
import BetaAccessGuard from "../../components/BetaAccessGuard";
import { useThemeToggle } from "../../contexts/ThemeToggleContext";
import { getTheme } from "../../theme";
import NotificationsPage from "../../elements/Notifications";

const WEATHER_STORAGE_KEY = "bunkmate_weather";

// Memoized constants to prevent recreation
const EMPTY_ARRAY = [];
const EMPTY_OBJECT = {};

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
// ─── Static sx objects: module-level constants, never recreated ────────────
const CARD_CONTENT_SX = { pb: 1.5 };
const OVERFLOW_SX = { overflowX: "auto", mb: 2 };
const TRANSPARENT_CONTENT_SX = { mb: 2, backgroundColor: "transparent", height: "auto" };
const CARD_STATIC_SX = { mb: 8, padding: 0, backgroundColor: "transparent" };

// ─── NoteCardContent: lazily renders ReactMarkdown via IntersectionObserver ───
// Off-screen cards skip the markdown parse completely — critical for low-end Android
// with large lists. Cards pre-render 200px before entering the viewport (no pop-in).
const NoteCardContent = React.memo(({ previewContent, mdComponents, mode }) => {
  const containerRef = React.useRef(null);
  const [isVisible, setIsVisible] = React.useState(false);

  React.useEffect(() => {
    if (!window.IntersectionObserver) { setIsVisible(true); return; } // fallback
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setIsVisible(true); observer.disconnect(); } },
      { rootMargin: "200px" } // pre-render 200px above viewport edge
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []); // stable — never re-runs after mount

  return (
    <Box
      ref={containerRef}
      sx={{ maxHeight: 90, overflow: "hidden", pointerEvents: "none", mt: 0.5, opacity: 0.85, minHeight: isVisible ? undefined : 4 }}
    >
      {isVisible ? (
        <ReactMarkdown components={mdComponents}>{previewContent}</ReactMarkdown>
      ) : (
        // Skeleton placeholder while off-screen — zero parse cost
        <Box sx={{ height: 4, width: "60%", borderRadius: 1, bgcolor: mode === "dark" ? "#ffffff15" : "#00000010" }} />
      )}
    </Box>
  );
});

// ─── NoteCard: defined at MODULE level so React.memo is effective ─────────────
// If defined inside Notes(), every keystroke recreates this reference,
// destroying memo and forcing React to unmount+remount every card in the list.
const NoteCard = React.memo(({ note, onOpen, onMenu, mode, theme }) => {
  // Memoize the ReactMarkdown component map per mode change only
  const mdComponents = React.useMemo(() => ({
    p: ({ children }) => (
      <Typography variant="body2" sx={{ fontSize: 13, lineHeight: 1.5, color: mode === "dark" ? "rgba(255,255,255,0.72)" : "rgba(0,0,0,0.65)", mb: 0.5, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
        {children}
      </Typography>
    ),
    h1: ({ children }) => <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: 13, color: mode === "dark" ? "rgba(255,255,255,0.85)" : "rgba(0,0,0,0.8)" }}>{children}</Typography>,
    h2: ({ children }) => <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: 13, color: mode === "dark" ? "rgba(255,255,255,0.85)" : "rgba(0,0,0,0.8)" }}>{children}</Typography>,
    h3: ({ children }) => <Typography variant="subtitle2" sx={{ fontWeight: 600, fontSize: 13, color: mode === "dark" ? "rgba(255,255,255,0.85)" : "rgba(0,0,0,0.8)" }}>{children}</Typography>,
    strong: ({ children }) => <strong style={{ color: mode === "dark" ? "rgba(255,255,255,0.9)" : "rgba(0,0,0,0.85)" }}>{children}</strong>,
    em: ({ children }) => <em>{children}</em>,
    ul: ({ children }) => <Box component="ul" sx={{ pl: 2, m: 0 }}>{children}</Box>,
    ol: ({ children }) => <Box component="ol" sx={{ pl: 2, m: 0 }}>{children}</Box>,
    li: ({ children }) => <Typography component="li" variant="body2" sx={{ fontSize: 13, color: mode === "dark" ? "rgba(255,255,255,0.72)" : "rgba(0,0,0,0.65)" }}>{children}</Typography>,
    code: ({ children }) => <Box component="code" sx={{ fontSize: 12, fontFamily: "monospace", bgcolor: mode === "dark" ? "#ffffff15" : "#00000010", px: 0.5, borderRadius: 0.5 }}>{children}</Box>,
    pre: ({ children }) => <Box component="pre" sx={{ fontSize: 12, fontFamily: "monospace", bgcolor: mode === "dark" ? "#ffffff15" : "#00000010", p: 0.5, borderRadius: 1, whiteSpace: "pre-wrap", m: 0 }}>{children}</Box>,
    br: () => <br />,
  }), [mode]);

  // Limit content to 400 chars to avoid parsing huge documents for a small preview
  const previewContent = note.content ? note.content.slice(0, 400) : "";

  return (
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
      <CardContent sx={CARD_CONTENT_SX}>
        <Stack direction="row" justifyContent="space-between">
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography fontWeight={700} fontSize={16}>
              {note.title || "Untitled"}
              {note.pinned && (
                <PushPinIcon
                  sx={{ ml: 1, fontSize: 16, color: theme.palette.success.main }}
                />
              )}
            </Typography>

            {/* IntersectionObserver lazy render: skip ReactMarkdown for off-screen cards */}
            <NoteCardContent previewContent={previewContent} mdComponents={mdComponents} mode={mode} />
          </Box>

          <IconButton
            onClick={(e) => {
              e.stopPropagation();
              onMenu(e);
            }}
            size="small"
            sx={{ flexShrink: 0, alignSelf: "flex-start" }}
          >
            <MoreVertIcon />
          </IconButton>
        </Stack>

        {note.labels?.length > 0 && (
          <Stack direction="row" spacing={0.8} mt={1} flexWrap="wrap">
            {note.labels.map((label) => (
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
          </Stack>
        )}
      </CardContent>
    </Card>
  );
},
(prevProps, nextProps) =>
  prevProps.note.id === nextProps.note.id &&
  prevProps.note.title === nextProps.note.title &&
  prevProps.note.content === nextProps.note.content &&
  prevProps.note.pinned === nextProps.note.pinned &&
  prevProps.note.labels === nextProps.note.labels &&
  prevProps.mode === nextProps.mode
);


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
  const [searchDisplayValue, setSearchDisplayValue] = useState(""); // Separate display state for instant input response
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [menuIndex, setMenuIndex] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [user, setUser] = useState(null);
  const [sharedUsersInfo, setSharedUsersInfo] = useState({});
  const noteContentRef = useRef(null);
  const [labels, setLabels] = useState([]);
  const [noteLabels, setNoteLabels] = useState([]); // For add/edit
  const [selectedNoteLabels, setSelectedNoteLabels] = useState([]); // For view
  const [collaborators, setCollaborators] = useState([]); // For add/edit
  const [detailsDrawerOpen, setDetailsDrawerOpen] = useState(false);
  const [addCollaboratorDrawerOpen, setAddCollaboratorDrawerOpen] = useState(false);
  const [addLabelDrawerOpen, setAddLabelDrawerOpen] = useState(false);
  const [newCollaboratorUsername, setNewCollaboratorUsername] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [sortOption, setSortOption] = useState(() => localStorage.getItem("noteSortOption") || "newest");
  const [viewMode, setViewMode] = useState(() => localStorage.getItem("noteViewMode") || "list");
  const [selectedLabelFilter, setSelectedLabelFilter] = useState(() => localStorage.getItem("noteLabelFilter") || "All");
  const [isPreview, setIsPreview] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState(null);

  const { weather, setWeather } = useWeather();
  const [autoSaveStatus, setAutoSaveStatus] = useState("");
  const autoSaveTimerRef = useRef(null);
  const titleInputRef = useRef("");
  const contentInputRef = useRef("");
  const inputDebounceRef = useRef(null);
  const searchDebounceRef = useRef(null);
  
  // Advanced: Cache collaborator profiles + pagination + debouncing
  const collaboratorCacheRef = useRef({});
  const snapshotDebounceRef = useRef(null);
  const isManuallySavedRef = useRef(false); // Prevents auto-save duplicating a manual save
  const [pageSize] = useState(30);

  // Static sx objects promoted to module-level constants above — no useMemo overhead needed
  // overflowSx, transparentContentSx, cardSx, cardContentSx are now OVERFLOW_SX, TRANSPARENT_CONTENT_SX, CARD_STATIC_SX, CARD_CONTENT_SX
  
  const { mode, accent } = useThemeToggle();
  const theme = useMemo(() => getTheme(mode, accent), [mode, accent]);

  // React 18: startTransition marks sort/filter/search updates as non-urgent
  // → typing is always smooth; filtering can be interrupted/deferred
  const [, startTransition] = useTransition();

  // useDeferredValue: React renders the note list with the old search
  // while computing the new one — input never blocks on list re-render
  const deferredSearchTerm = useDeferredValue(searchTerm);

  const buttonWeatherBg =
  weather && weatherColors[weather.main]
    ? weatherColors[weather.main]
    : weatherColors.Default;
    

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
}, []); // eslint-disable-line react-hooks/exhaustive-deps


// NOTE: Redundant localStorage read removed — sortOption, viewMode, selectedLabelFilter
// are already initialized from localStorage via lazy useState() on lines 117-119.

// Advanced: Batch localStorage writes
useEffect(() => {
  localStorage.setItem("noteSortOption", sortOption);
  localStorage.setItem("noteViewMode", viewMode);
  localStorage.setItem("noteLabelFilter", selectedLabelFilter);
}, [sortOption, viewMode, selectedLabelFilter]);



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


  
  // Fixed: functional updater removes sharedUsersInfo from deps → no listener re-subscribe churn
  const fetchCollaboratorProfiles = useCallback(async (uids) => {
    const idsToFetch = [];
    const fromCache = {};

    for (const uid of uids) {
      if (collaboratorCacheRef.current[uid]) {
        fromCache[uid] = collaboratorCacheRef.current[uid];
      } else {
        idsToFetch.push(uid);
      }
    }

    // Apply cached entries instantly via functional updater (no stale state captured)
    if (Object.keys(fromCache).length > 0) {
      setSharedUsersInfo(prev => ({ ...prev, ...fromCache }));
    }

    if (idsToFetch.length === 0) return;

    try {
      const docs = await Promise.all(idsToFetch.map(uid => getDoc(doc(db, "users", uid))));
      const newData = {};

      docs.forEach((docSnap, idx) => {
        if (docSnap.exists()) {
          const userData = { username: docSnap.data().username, photoURL: docSnap.data().photoURL };
          newData[idsToFetch[idx]] = userData;
          collaboratorCacheRef.current[idsToFetch[idx]] = userData;
        }
      });

      if (Object.keys(newData).length > 0) {
        setSharedUsersInfo(prev => ({ ...prev, ...newData }));
      }
    } catch (e) {
      console.warn("Error batching profiles:", e);
    }
  }, []); // Stable: no sharedUsersInfo dep → Firestore listener won't re-subscribe on every profile load

useEffect(() => {
  if (!user) return;

  // Advanced: Limit query + debounce updates
  const q = query(
    collection(db, "notes"),
    where("owners", "array-contains", user.uid),
    orderBy("createdAt", "desc"),
    limit(pageSize)
  );

  const unsubscribe = onSnapshot(q, (snapshot) => {
    if (snapshotDebounceRef.current) clearTimeout(snapshotDebounceRef.current);
    
    snapshotDebounceRef.current = setTimeout(async () => {
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

      const processed = fetched.map((n) => ({
        ...n,
        labels: !n.owners.includes(user.uid) ? Array.from(new Set([...n.labels, "Shared"])) : n.labels,
      }));

      setNotes(processed);
      setLoading(false);

      if (uids.size > 0) fetchCollaboratorProfiles(Array.from(uids));
    }, 150);
  }, (err) => {
    console.error("Notes listener error:", err);
    setLoading(false);
  });

  return () => {
    unsubscribe();
    if (snapshotDebounceRef.current) clearTimeout(snapshotDebounceRef.current);
  };
}, [user, pageSize, fetchCollaboratorProfiles]);

// Advanced: Memoize label extraction
const labelsFromNotes = useMemo(() => {
  const labelSet = new Set();
  notes.forEach((note) => {
    (note.labels || []).forEach((label) => {
      if (label !== "Shared") labelSet.add(label);
    });
  });
  return Array.from(labelSet).sort((a, b) => a.localeCompare(b));
}, [notes]);

useEffect(() => {
  const labelsString = labelsFromNotes.join("|");
  const prevLabelsString = labels.join("|");
  if (labelsString !== prevLabelsString) {
    setLabels(labelsFromNotes);
  }
}, [labelsFromNotes, labels]);

  // Advanced: Consolidate drawer state updates
  useEffect(() => {
    if (editDrawerOpen && selectedNote) {
      setCollaborators(selectedNote.sharedWith || []);
      setNoteLabels(selectedNote.labels || []);
    } else if (drawerOpen) {
      setCollaborators([]);
      setNoteLabels([]);
    }
    
    if (viewDrawerOpen && selectedNote) {
      setSelectedNoteLabels(selectedNote.labels || []);
    }
  }, [editDrawerOpen, drawerOpen, viewDrawerOpen, selectedNote]);


const handleAddCollaboratorFromDrawer = useCallback(async () => {
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
      setError("");
    } else {
      setError("User not found or no note selected.");
    }
  } catch (error) {
    console.error("Error adding collaborator:", error);
    setError("Something went wrong. Please try again.");
  }
}, [newCollaboratorUsername, selectedNote?.id, user?.uid, collaborators]);

  // --- Label add/remove logic for add/edit ---
  const handleAddCustomLabel = useCallback(() => {
    if (!newLabel.trim()) return;
    if (!labels.includes(newLabel.trim())) {
      setLabels(prev => [...prev, newLabel.trim()]);
    }
    setNoteLabels(prev => [...prev, newLabel.trim()]);
    setNewLabel("");
    setAddLabelDrawerOpen(false);
  }, [newLabel, labels]);

  // --- Pin note logic ---
  const handlePinNote = useCallback(async (note) => {
    await updateDoc(doc(db, "notes", note.id), { pinned: !note.pinned });
    // onSnapshot will update the list; no additional fetch to reduce reads
  }, []);

  const handleAddNote = useCallback(async () => {
    if (!noteTitle.trim() && !noteContent.trim()) return;
    setSaving(true);
    isManuallySavedRef.current = true; // Flag: manual save — stop auto-save effect from duplicating
    try {
      await addDoc(collection(db, "notes"), {
        owners: [user.uid],
        title: noteTitle,
        content: noteContent,
        createdAt: serverTimestamp(),
        sharedWith: collaborators,
        labels: noteLabels,
        pinned: false,
      });
      // Clear refs BEFORE setDrawerOpen so the auto-save effect sees empty content
      titleInputRef.current = "";
      contentInputRef.current = "";
      setNoteTitle("");
      setNoteContent("");
      setDrawerOpen(false);
      setSaving(false);
    } catch (error) {
      console.error("Error adding note:", error);
      isManuallySavedRef.current = false; // Reset on failure
      setSaving(false);
    }
    // onSnapshot will update notes
  }, [noteTitle, noteContent, user?.uid, collaborators, noteLabels]);

  // --- AUTO SAVE FOR EDITING NOTES (Google Keep/Notion Style) ---
  // Real-time debounced auto-save with optimized dependencies
  useEffect(() => {
    if (!editDrawerOpen || !selectedNote) return;
    
    // Clear previous timer
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    
    // Use current values from refs to avoid stale closures
    const currentTitle = noteTitle === undefined ? titleInputRef.current : noteTitle;
    const currentContent = noteContent === undefined ? contentInputRef.current : noteContent;
    
    // Debounce: wait 1000ms after user stops typing, then save
    // 1000ms is better for low-end devices — more typing time, fewer Firestore writes
    autoSaveTimerRef.current = setTimeout(async () => {
      const finalTitle = titleInputRef.current || currentTitle;
      const finalContent = contentInputRef.current || currentContent;
      
      if (!finalTitle.trim() && !finalContent.trim()) return;
      
      try {
        setAutoSaveStatus("saving");
        await updateDoc(doc(db, "notes", selectedNote.id), {
          title: finalTitle,
          content: finalContent,
          sharedWith: collaborators,
          labels: noteLabels,
        });
        setAutoSaveStatus("saved");
        setTimeout(() => setAutoSaveStatus(""), 1500);
      } catch (error) {
        console.error("Auto-save error:", error);
        setAutoSaveStatus("");
      }
    }, 500);
    
    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    };
  }, [noteTitle, noteContent, selectedNote?.id, editDrawerOpen, collaborators, noteLabels]);

  // Batch all cleanup — capture ref values locally so cleanup sees the correct timer IDs
  useEffect(() => {
    const inputTimer = inputDebounceRef.current;
    const searchTimer = searchDebounceRef.current;
    const snapshotTimer = snapshotDebounceRef.current;
    return () => {
      if (inputTimer) clearTimeout(inputTimer);
      if (searchTimer) clearTimeout(searchTimer);
      if (snapshotTimer) clearTimeout(snapshotTimer);
    };
  }, []);

  // Advanced: Clean up drawer save
  useEffect(() => {
    if (editDrawerOpen || !selectedNote) return;
    
    const saveFinalChanges = async () => {
      if (noteTitle.trim() || noteContent.trim()) {
        try {
          await updateDoc(doc(db, "notes", selectedNote.id), {
            title: noteTitle,
            content: noteContent,
            sharedWith: collaborators,
            labels: noteLabels,
          });
        } catch (error) {
          console.error("Error in final save:", error);
        }
      }
    };
    
    saveFinalChanges();
  }, [editDrawerOpen, selectedNote, noteTitle, noteContent, collaborators, noteLabels]);

  // --- Save on page unload/refresh ---
  useEffect(() => {
    if (!editDrawerOpen || !selectedNote) return;
    
    const handleBeforeUnload = (e) => {
      if (noteTitle.trim() || noteContent.trim()) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [editDrawerOpen, selectedNote, noteTitle, noteContent]);

  // Removed: redundant unmount-cleanup save. The debounced auto-save (above)
  // and the drawer-close save effect cover all scenarios without race conditions.

  // --- AUTO SAVE FOR NEW NOTES (Create Drawer) ---
  // Fires when drawer closes. Guard: skipped if isManuallySavedRef is set (handleAddNote ran already).
  useEffect(() => {
    if (drawerOpen || !user || selectedNote) return; // Only for new notes (no selectedNote)
    // Skip if handleAddNote already saved — prevents duplicate Firestore writes
    if (isManuallySavedRef.current) {
      isManuallySavedRef.current = false;
      return;
    }
    const autoSaveNewNote = async () => {
      const finalTitle = titleInputRef.current || noteTitle;
      const finalContent = contentInputRef.current || noteContent;
      
      if (finalTitle.trim() || finalContent.trim()) {
        try {
          setAutoSaveStatus("saving");
          
          // Save new note with same structure as handleAddNote
          await addDoc(collection(db, "notes"), {
            owners: [user.uid],
            title: finalTitle,
            content: finalContent,
            createdAt: serverTimestamp(),
            sharedWith: collaborators,
            labels: noteLabels,
            pinned: false,
          });
          
          setAutoSaveStatus("saved");
          
          // Clear form after save
          setNoteTitle("");
          setNoteContent("");
          titleInputRef.current = "";
          contentInputRef.current = "";
          setCollaborators([]);
          setNoteLabels([]);
          
          // Show success status for 1.5 seconds
          setTimeout(() => setAutoSaveStatus(""), 1500);
          
          console.log("✓ New note auto-saved on drawer close");
        } catch (error) {
          console.error("Error auto-saving new note:", error);
          setAutoSaveStatus("");
        }
      }
    };
    
    autoSaveNewNote();
  }, [drawerOpen, user, selectedNote, noteTitle, noteContent, collaborators, noteLabels]);
 
   // Advanced: Memoized edit handler
   const handleEditNote = useCallback(async () => {
     if (!selectedNote || (!noteTitle.trim() && !noteContent.trim())) return;
     setSaving(true);
     try {
       await updateDoc(doc(db, "notes", selectedNote.id), {
         title: noteTitle,
         content: noteContent,
         sharedWith: collaborators,
         labels: noteLabels,
       });
       // Clear form fields and refs so drawer doesn't re-open in "Add Note" mode with stale content
       titleInputRef.current = "";
       contentInputRef.current = "";
       setNoteTitle("");
       setNoteContent("");
       setNoteLabels([]);
       setCollaborators([]);
       // Close BOTH drawers — editDrawerOpen and drawerOpen
       setEditDrawerOpen(false);
       setDrawerOpen(false);
       setSelectedNote(null);
       setSaving(false);
     } catch (error) {
       console.error("Error editing note:", error);
       setSaving(false);
     }
   }, [selectedNote, noteTitle, noteContent, collaborators, noteLabels]);
 
   const handleDeleteNote = useCallback(async (id) => {
     await deleteDoc(doc(db, "notes", id));
    // onSnapshot will update notes
   }, []);

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

  const handleTitleChange = useCallback((e) => {
    const value = e.target.value;
    titleInputRef.current = value; // Keep ref in sync for auto-save
    setNoteTitle(value);           // Synchronous: preserves cursor position in controlled input
  }, []);

  const handleContentChange = useCallback((e) => {
    const value = e.target.value;
    contentInputRef.current = value; // Keep ref in sync for auto-save
    setNoteContent(value);           // Synchronous: preserves cursor position in controlled input
  }, []);

  const handleSearchChange = useCallback((e) => {
    const value = e.target.value;
    setSearchDisplayValue(value); // Instant update so input display never lags
    // Wrap in startTransition: filtering is non-urgent, typing stays smooth
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      startTransition(() => setSearchTerm(value));
    }, 200); // 200ms debounce inside transition — low-end friendly
  }, [startTransition]);

  const handleToggleLabelMemo = useCallback((label) => {
    setNoteLabels(prev =>
      prev.includes(label) ? prev.filter(l => l !== label) : [...prev, label]
    );
  }, []);
  
  // const handleShareWithUser = async () => {
  //   if (!shareUsername.trim()) return;
  //   // Find user by username
  //   const q = query(collection(db, "users"), where("username", "==", shareUsername.trim()));
  //   const snapshot = await getDocs(q);
  //   if (!snapshot.empty) {
  //     const userDoc = snapshot.docs[0];
  //     const shareUid = userDoc.id;
  //     // Update note's sharedWith and owners
  //     await updateDoc(doc(db, "notes", selectedNote.id), {
  //       sharedWith: [...(selectedNote.sharedWith || []), shareUid],
  //       owners: Array.from(new Set([...(selectedNote.owners || []), shareUid])),
  //     });
  //     setSharedWith((prev) => [...prev, shareUid]);
  //     setShareUsername("");
  //     // rely on onSnapshot to reflect changes; avoid manual fetch to prevent loops & extra reads
  //   } else {
  //     setError("User not found!");
  //   }
  // };

// Advanced: Optimize filtering — uses deferredSearchTerm so typing never blocks
const filteredNotes = useMemo(() => {
  const s = (deferredSearchTerm || "").toLowerCase().trim();
  
  return notes.filter(note => {
    if (selectedLabelFilter !== "All") {
      if (selectedLabelFilter === "Pinned" && !note.pinned) return false;
      if (selectedLabelFilter === "Shared" && !(note.labels || []).includes("Shared")) return false;
      if (!["Pinned", "Shared"].includes(selectedLabelFilter) && !(note.labels || []).includes(selectedLabelFilter)) return false;
    }
    if (!s) return true;
    return (note.title || "").toLowerCase().includes(s) || (note.content || "").toLowerCase().includes(s);
  });
}, [notes, deferredSearchTerm, selectedLabelFilter]);

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

// Advanced: Combine filters in single pass
const { pinnedNotes, unpinnedNotes } = useMemo(() => {
  const pinned = [];
  const unpinned = [];
  sortedNotes.forEach(n => (n.pinned ? pinned : unpinned).push(n));
  return { pinnedNotes: pinned, unpinnedNotes: unpinned };
}, [sortedNotes]);

// Memoize the flat sorted note list — avoid [...pinnedNotes,...unpinnedNotes] spread on every render
const flatNotes = useMemo(() => [...pinnedNotes, ...unpinnedNotes], [pinnedNotes, unpinnedNotes]);

// Memoize the filter chip labels array — avoids spread allocation on every Notes render
const allFilterLabels = useMemo(() => ["All", "Pinned", "Shared", ...labels], [labels]);

 // Advanced: Optimize preview toggle with early return
 useEffect(() => {
  if ((drawerOpen || editDrawerOpen) && isPreview) {
    setIsPreview(false);
  }
}, [drawerOpen, editDrawerOpen, isPreview]);


  // --- Add formatting helper used by toolbar (fixes no-undef) ---
  // Advanced: Optimize format execution with requestAnimationFrame
  const applyFormat = useCallback((format) => {
    const textarea = noteContentRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart || 0;
    const end = textarea.selectionEnd || 0;
    const before = noteContent.slice(0, start);
    const selected = noteContent.slice(start, end);
    const after = noteContent.slice(end);

    const formatMap = {
      bold: `**${selected || "bold text"}**`,
      italic: `*${selected || "italic text"}*`,
      underline: `<u>${selected || "underlined text"}</u>`,
      ul: selected ? selected.split("\n").map(l => (l.startsWith("- ") ? l : `- ${l}`)).join("\n") : "- List item",
      code: `\`\`\`\n${selected || "code"}\n\`\`\``,
    };

    const formatted = formatMap[format] || selected;
    setNoteContent(before + formatted + after);

    requestAnimationFrame(() => {
      textarea.focus();
      const pos = before.length + formatted.length;
      textarea.setSelectionRange(pos, pos);
    });
  }, [noteContent]);



  return (
    <ThemeProvider theme={theme}>
      {/* <DeviceGuard> */}
      <BetaAccessGuard>
              <Box
        sx={{
          p: 3,
          backgroundColor: theme.palette.background.default,
          color: theme.palette.text.primary,
          height: "auto",
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
            value={searchDisplayValue}
            onChange={handleSearchChange}
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
  sx={{ minWidth: 150 }}
  InputLabelProps={{ sx: { color: mode === "dark" ? "#aaa" : "#555" } }}
  InputProps={{ sx: { color: mode === "dark" ? "#fff" : "#000", borderRadius: 1.5 } }}
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
  sx={{ borderRadius: 1.5 }}
>
  <ToggleButton value="list">
    <ViewListIcon sx={{ color: mode === "dark" ? "#ffffffff" : "#000000ff" }} />
  </ToggleButton>
  <ToggleButton value="grid">
    <ViewModuleIcon sx={{ color: mode === "dark" ? "#ffffffff" : "#000000ff" }} />
  </ToggleButton>
</ToggleButtonGroup>
</Box>


<Stack direction="row" spacing={1} sx={OVERFLOW_SX}>
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
          <Box sx={TRANSPARENT_CONTENT_SX}>
          <CardContent sx={CARD_STATIC_SX}>
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
    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
      <Typography variant="h6" fontWeight="bold" color={theme.palette.text.primary}>
        {editDrawerOpen ? "Edit Note" : ""}
      </Typography>
      {editDrawerOpen && (
        <Typography 
          variant="caption" 
          sx={{ 
            fontSize: "11px",
            color: autoSaveStatus === "saving" ? theme.palette.warning.main : autoSaveStatus === "saved" ? theme.palette.success.main : "transparent",
            transition: "color 0.3s ease"
          }}
        >
          {autoSaveStatus === "saving" ? "⏳ Saving..." : autoSaveStatus === "saved" ? "✓ Saved" : ""}
        </Typography>
      )}
    </Box>
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
      onChange={handleTitleChange}
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
          onClick={() => handleToggleLabelMemo(label)}
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
            p: ({ children }) => <Typography variant="body1" sx={{ mb: 2, color: theme.palette.text.primary, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{children}</Typography>,
            h1: ({ children }) => <Typography variant="h4" sx={{ mb: 1, fontWeight: 'bold', color: theme.palette.text.primary, whiteSpace: "pre-wrap" }}>{children}</Typography>,
            h2: ({ children }) => <Typography variant="h5" sx={{ mb: 1, fontWeight: 'bold', color: theme.palette.text.primary, whiteSpace: "pre-wrap" }}>{children}</Typography>,
            h3: ({ children }) => <Typography variant="h6" sx={{ mb: 1, fontWeight: 'bold', color: theme.palette.text.primary, whiteSpace: "pre-wrap" }}>{children}</Typography>,
            ul: ({ children }) => <Box component="ul" sx={{ pl: 2, mb: 2, "& li": { whiteSpace: "pre-wrap", wordBreak: "break-word" } }}>{children}</Box>,
            ol: ({ children }) => <Box component="ol" sx={{ pl: 2, mb: 2, "& li": { whiteSpace: "pre-wrap", wordBreak: "break-word" } }}>{children}</Box>,
            li: ({ children }) => <Typography component="li" sx={{ color: theme.palette.text.primary, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{children}</Typography>,
            code: ({ children }) => <Box component="code" sx={{ bgcolor: mode === "dark" ? "#333" : "#f5f5f5", p: 0.5, borderRadius: 1, fontFamily: 'monospace', whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{children}</Box>,
            br: () => <br />,
            pre: ({ children }) => <Box component="pre" sx={{ bgcolor: mode === "dark" ? "#333" : "#f5f5f5", p: 1, borderRadius: 1, overflow: 'auto', mb: 2, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{children}</Box>,
          }}
        >
          {noteContent || 'Nothing to preview'}
        </ReactMarkdown>
      </Box>
    ) : (
      <TextField
        placeholder="Start writing your note..."
        value={noteContent}
        onChange={handleContentChange}
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
    <IconButton onClick={() => setAddCollaboratorDrawerOpen(true)}>
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
              backgroundColor: `${theme.palette.background.default}00`,
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
              backgroundColor: `${theme.palette.background.default}00`,
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
                    p: ({ children }) => <Typography variant="body1" sx={{ mb: 2, color: theme.palette.text.primary, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{children}</Typography>,
                    h1: ({ children }) => <Typography variant="h4" sx={{ mb: 1, fontWeight: 'bold', color: theme.palette.text.primary, whiteSpace: "pre-wrap" }}>{children}</Typography>,
                    h2: ({ children }) => <Typography variant="h5" sx={{ mb: 1, fontWeight: 'bold', color: theme.palette.text.primary, whiteSpace: "pre-wrap" }}>{children}</Typography>,
                    h3: ({ children }) => <Typography variant="h6" sx={{ mb: 1, fontWeight: 'bold', color: theme.palette.text.primary, whiteSpace: "pre-wrap" }}>{children}</Typography>,
                    ul: ({ children }) => <Box component="ul" sx={{ pl: 2, mb: 2, "& li": { whiteSpace: "pre-wrap", wordBreak: "break-word" } }}>{children}</Box>,
                    ol: ({ children }) => <Box component="ol" sx={{ pl: 2, mb: 2, "& li": { whiteSpace: "pre-wrap", wordBreak: "break-word" } }}>{children}</Box>,
                    li: ({ children }) => <Typography component="li" sx={{ color: theme.palette.text.primary, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{children}</Typography>,
                    code: ({ children }) => <Box component="code" sx={{ bgcolor: mode === "dark" ? "#333" : "#f5f5f5", p: 0.5, borderRadius: 1, fontFamily: 'monospace', whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{children}</Box>,
                    br: () => <br />,
                    pre: ({ children }) => <Box component="pre" sx={{ bgcolor: mode === "dark" ? "#333" : "#f5f5f5", p: 1, borderRadius: 1, overflow: 'auto', mb: 2, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{children}</Box>,
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
                onClick={() => setAddCollaboratorDrawerOpen(true)}
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

        {/* Duplicate Add Collaborator drawer removed — the one inside the Add/Edit note drawer (above) handles this */}


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
  <DialogTitle variant="h6">Delete Note</DialogTitle>
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
                <Typography variant="h5" sx={{ fontSize: "2rem" }}>{selectedNote.title || "Untitled"}</Typography>
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
            onClick={() => {
              // Reset everything so the drawer always opens as a fresh new note
              setNoteTitle("");
              setNoteContent("");
              titleInputRef.current = "";
              contentInputRef.current = "";
              setNoteLabels([]);
              setCollaborators([]);
              setSelectedNote(null);
              setEditDrawerOpen(false);
              setDrawerOpen(true);
            }}
          > 
            <AddIcon sx={{ px: 0 }} />
          </Button>
          
          </Box>
      </BetaAccessGuard>
      {/* </DeviceGuard> */}
    </ThemeProvider>
  );
};

export default Notes;