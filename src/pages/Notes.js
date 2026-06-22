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
  Zoom,
  Link,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  InputAdornment
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
import CloseIcon from "@mui/icons-material/Close";
import ReactMarkdown from 'react-markdown';
import { Search } from "@mui/icons-material";
import { motion, AnimatePresence } from "framer-motion";
import { SquarePen } from "lucide-react";
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
  arrayUnion,
  onSnapshot,
  serverTimestamp,
  limit,
  documentId
} from "firebase/firestore";
import { weatherColors } from "../elements/weatherTheme";
import { useWeather } from "../contexts/WeatherContext";
import BetaAccessGuard from "../components/BetaAccessGuard";
import { useThemeToggle } from "../contexts/ThemeToggleContext";
import { getTheme } from "../theme";
import NotificationsPage from "../elements/Notifications";
import { useNavigate, useParams } from "react-router-dom";
import { useBackButtonClose } from "../hooks/useBackButtonClose";

const WEATHER_STORAGE_KEY = "bunkmate_weather";

const glass = (mode) => ({
  background: mode === "dark" ? "rgba(30, 30, 30, 0.22)" : "rgba(255, 255, 255, 0.4)",
  backdropFilter: "blur(22px)",
  border: "none",
  boxShadow: mode === "dark"
    ? `inset 0 1px 1px rgba(255, 255, 255, 0.11), inset 0 -1px 1px rgba(35, 35, 35, 0.07)`
    : `inset 0 1px 1px rgba(255,255,255,0.8), inset 0 -1px 1px rgba(0,0,0,0.1)`,
});

const cardHover = {
  transition: "transform .2s ease",
  "&:hover": {
    transform: "translateY(-1px)",
    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
  },
};

const CARD_CONTENT_SX = { pb: 1.5 };
const OVERFLOW_SX = { overflowX: "auto", mb: 2 };
const TRANSPARENT_CONTENT_SX = { mb: 2, backgroundColor: "transparent", height: "auto" };
const CARD_STATIC_SX = { mb: 8, padding: 0, backgroundColor: "transparent" };

const FloatingNewNotes = ({ mode, onOpen }) => {
  const [expanded, setExpanded] = useState(true);
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const isScrolled = window.scrollY > 20;
          setScrolled((prev) => (prev !== isScrolled ? isScrolled : prev));
          if (isScrolled) setExpanded(false);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setExpanded(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Box sx={{ position: "fixed", bottom: 85, right: 41, zIndex: 1100, pointerEvents: "none" }}>
      <Button
        onClick={() => navigate(`/notes/new/workspace`)}
        onMouseEnter={() => !scrolled && setExpanded(true)}
        onMouseLeave={() => !scrolled && setExpanded(false)}
        startIcon={<SquarePen sx={{ fontSize: expanded ? 27 : 42 }} />}
        sx={{
          pointerEvents: "auto",
          position: "relative",
          overflow: "hidden",
          minWidth: expanded ? { xs: "130px", md: "200px" } : 56,
          height: 56,
          borderRadius: expanded ? "35px" : "50%",
          px: expanded ? 3 : 0,
          transition: "all 0.45s cubic-bezier(0.4, 0, 0.2, 1)",
          willChange: "transform, min-width, border-radius",
          backdropFilter: "blur(2px) saturate(2)",
          WebkitBackdropFilter: "blur(2px) saturate(2)",
          background: mode === "dark" ? "rgba(0, 0, 0, 0.65)" : "rgba(255, 255, 255, 0.25)",
          color: mode === "dark" ? "#fff" : "#000",
          boxShadow: mode === "dark"
            ? `inset 0 1px 2px rgba(255, 255, 255, 0.11), inset 0 -1px 1px rgba(35, 35, 35, 0.07)`
            : `inset 0 1px 1px rgba(255,255,255,0.8), inset 0 -1px 1px rgba(0,0,0,0.1)`,
          "& .MuiButton-startIcon": {
            margin: expanded ? "0 8px 0 0" : 0,
            marginLeft: expanded ? 0 : "0px",
          },
          "&::before": {
            content: '""', position: "absolute", top: 0, left: "-75%", width: "50%", height: "100%",
            background: "linear-gradient(120deg, transparent, rgba(255, 255, 255, 0.17), transparent)",
            transform: "skewX(-20deg)", transition: "all 0.6s ease",
          },
          "&:hover::before": { left: "125%" },
          "&::after": {
            content: '""', position: "absolute", inset: 0, borderRadius: "inherit",
            background: "linear-gradient(to bottom right, rgba(255, 255, 255, 0.13), transparent)",
            opacity: 0.3, pointerEvents: "none",
          },
          "&:hover": { transform: "scale(1.05)" },
        }}
      >
        <AnimatePresence>
          {expanded && (
            <motion.span
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              exit={{ opacity: 0, width: 0 }}
              style={{ whiteSpace: "nowrap", fontWeight: 300, overflow: "hidden" }}
            >
              New Note
            </motion.span>
          )}
        </AnimatePresence>
      </Button>
    </Box>
  );
};

const NoteCardContent = React.memo(({ previewContent, mdComponents, mode }) => {
  const containerRef = React.useRef(null);
  const [isVisible, setIsVisible] = React.useState(false);

  useEffect(() => {
    if (!window.IntersectionObserver) { setIsVisible(true); return; }
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setIsVisible(true); observer.disconnect(); } },
      { rootMargin: "200px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <Box ref={containerRef} sx={{ maxHeight: 90, overflow: "hidden", pointerEvents: "none", mt: 0.5, opacity: 0.85, minHeight: isVisible ? undefined : 4 }}>
      {isVisible ? (
        <ReactMarkdown components={mdComponents}>{previewContent}</ReactMarkdown>
      ) : (
        <Box sx={{ height: 4, width: "60%", borderRadius: 1, bgcolor: mode === "dark" ? "#ffffff15" : "#00000010" }} />
      )}
    </Box>
  );
});

const createMdComponents = (mode) => ({
  p: ({ children }) => (
    <Typography variant="body2" sx={{ fontSize: 12, lineHeight: 1.4, color: mode === "dark" ? "rgba(255,255,255,0.72)" : "rgba(0,0,0,0.65)", mb: 0.3, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
      {children}
    </Typography>
  ),
  h1: ({ children }) => <Typography variant="body2" sx={{ fontWeight: 700, fontSize: 12, color: mode === "dark" ? "rgba(255,255,255,0.85)" : "rgba(0,0,0,0.8)" }}>{children}</Typography>,
  h2: ({ children }) => <Typography variant="body2" sx={{ fontWeight: 700, fontSize: 12, color: mode === "dark" ? "rgba(255,255,255,0.85)" : "rgba(0,0,0,0.8)" }}>{children}</Typography>,
  h3: ({ children }) => <Typography variant="body2" sx={{ fontWeight: 600, fontSize: 12, color: mode === "dark" ? "rgba(255,255,255,0.85)" : "rgba(0,0,0,0.8)" }}>{children}</Typography>,
  strong: ({ children }) => <strong style={{ color: mode === "dark" ? "rgba(255,255,255,0.9)" : "rgba(0,0,0,0.85)", fontSize: 12 }}>{children}</strong>,
  em: ({ children }) => <em style={{ fontSize: 12 }}>{children}</em>,
  ul: ({ children }) => <Box component="ul" sx={{ pl: 1, m: 0, mb: 0.3 }}>{children}</Box>,
  ol: ({ children }) => <Box component="ol" sx={{ pl: 1, m: 0, mb: 0.3 }}>{children}</Box>,
  li: ({ children }) => <Typography component="li" variant="body2" sx={{ fontSize: 12, color: mode === "dark" ? "rgba(255,255,255,0.72)" : "rgba(0,0,0,0.65)", mb: 0.2 }}>{children}</Typography>,
  code: ({ children }) => <Box component="code" sx={{ fontSize: 10, fontFamily: "monospace", bgcolor: mode === "dark" ? "#ffffff15" : "#00000010", px: 0.3, borderRadius: 0.3 }}>{children}</Box>,
  pre: ({ children }) => <Box component="pre" sx={{ fontSize: 10, fontFamily: "monospace", bgcolor: mode === "dark" ? "#ffffff15" : "#00000010", p: 0.3, borderRadius: 0.5, whiteSpace: "pre-wrap", m: 0, display: "none" }}>{children}</Box>,
  br: () => null,
});

// Upgraded Scroll-Safe Long Press Hook
const useLongPress = (callback, ms = 500) => {
  const timeoutRef = useRef(null);
  const isLongPressTriggeredRef = useRef(false);
  const coordinatesRef = useRef({ x: 0, y: 0 });

  const start = useCallback((event) => {
    const clientX = event.touches ? event.touches[0].clientX : event.clientX;
    const clientY = event.touches ? event.touches[0].clientY : event.clientY;
    
    coordinatesRef.current = { x: clientX, y: clientY };
    isLongPressTriggeredRef.current = false;

    timeoutRef.current = setTimeout(() => {
      isLongPressTriggeredRef.current = true;
      callback(event);
    }, ms);
  }, [callback, ms]);

  const move = useCallback((event) => {
    if (!timeoutRef.current) return;

    const clientX = event.touches ? event.touches[0].clientX : event.clientX;
    const clientY = event.touches ? event.touches[0].clientY : event.clientY;

    const diffX = Math.abs(clientX - coordinatesRef.current.x);
    const diffY = Math.abs(clientY - coordinatesRef.current.y);

    if (diffX > 10 || diffY > 10) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const stop = useCallback((event) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    return isLongPressTriggeredRef.current;
  }, []);

  return {
    onMouseDown: start,
    onTouchStart: start,
    onMouseMove: move,
    onTouchMove: move,
    onMouseUp: stop,
    onTouchEnd: stop,
    onMouseLeave: () => timeoutRef.current && clearTimeout(timeoutRef.current),
  };
};

const NoteCard = React.memo(({ note, onOpen, onMenu, mode, theme, isSelected, actionMode }) => {
  const mdComponents = React.useMemo(() => createMdComponents(mode), [mode]);
  const previewContent = note.content ? note.content.slice(0, 150) : "";
  const longPressHandlers = useLongPress((e) => onMenu(e), 600);

  return (
    <Card
      {...longPressHandlers}
      onClick={(e) => {
        const wasLongPress = longPressHandlers.onMouseUp(e);
        if (wasLongPress) return;
        onOpen();
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen();
        }
      }}
      component="button"
      type="button"
      aria-label={`View note: ${note.title || "Untitled"}`}
      sx={{
        ...glass(mode),
        ...cardHover,
        width: "100%",
        textAlign: "left",
        fontFamily: "inherit",
        borderRadius: 6,
        cursor: "pointer",
        position: "relative",
        padding: 0,
        outline: "none",
        display: "block",
        boxSizing: "border-box",
        transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
        WebkitTapHighlightColor: "transparent",

        ...(isSelected && {
          transform: "scale(1.03) translateY(-4px) !important",
          zIndex: 10001,
        }),

        ...(actionMode && !isSelected && {
          filter: "blur(6px)",
          opacity: 0.25,
          transform: "scale(0.97)",
          pointerEvents: "none",
        }),
      }}
    >
      <CardContent sx={{ ...CARD_CONTENT_SX, width: "100%", boxSizing: "border-box", pointerEvents: "auto" }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
          <Box sx={{ flex: 1, minWidth: 0, pointerEvents: "none" }}>
            <Typography component="div" fontWeight={700} fontSize={16} sx={{ display: "flex", alignItems: "center" }}>
              {note.title || "Untitled"}
              {note.pinned && (
                <PushPinIcon sx={{ ml: 1, fontSize: 16, color: theme.palette.success.main }} />
              )}
            </Typography>
            <NoteCardContent previewContent={previewContent} mdComponents={mdComponents} mode={mode} />
          </Box>
          <IconButton
            component="span"
            onClick={(e) => { e.stopPropagation(); onMenu(e); }}
            size="small"
            sx={{ flexShrink: 0, alignSelf: "flex-start", ml: 1, position: "relative", zIndex: 2 }}
          >
            <MoreVertIcon />
          </IconButton>
        </Stack>

        {note.labels?.length > 0 && (
          <Stack direction="row" spacing={0.8} mt={1} flexWrap="wrap" sx={{ pointerEvents: "none" }}>
            {note.labels.map((label) => (
              <Chip
                key={label} size="small" label={label}
                sx={{ fontSize: 11, borderRadius: 2, backgroundColor: mode === "dark" ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)" }}
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
  prevProps.isSelected === nextProps.isSelected &&
  prevProps.actionMode === nextProps.actionMode &&
  prevProps.mode === nextProps.mode
);

const getFontFamily = (style) => {
  switch (style) {
    case "sans":
      return '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';
    case "serif":
      return 'Georgia, Cambria, "Times New Roman", Times, serif';
    case "dyslexic":
      return '"OpenDyslexic", "Comic Sans MS", cursive, sans-serif';
    case "monospace":
    default:
      return "monospace, Courier New, Courier, sans-serif";
  }
};

const Notes = () => {
  const navigate = useNavigate();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editDrawerOpen, setEditDrawerOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState(null);
  const [noteTitle, setNoteTitle] = useState("");
  const [noteContent, setNoteContent] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [searchDisplayValue, setSearchDisplayValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [user, setUser] = useState(null);
  const [sharedUsersInfo, setSharedUsersInfo] = useState({});
  const noteContentRef = useRef(null);
  const [labels, setLabels] = useState([]);
  const [noteLabels, setNoteLabels] = useState([]);
  const [collaborators, setCollaborators] = useState([]);
  const [detailsDrawerOpen, setDetailsDrawerOpen] = useState(false);
  const [addCollaboratorDrawerOpen, setAddCollaboratorDrawerOpen] = useState(false);
  const [addLabelDrawerOpen, setAddLabelDrawerOpen] = useState(false);
  const [newLabelText, setNewLabelText] = useState("");
  const [searchCollaboratorQuery, setSearchCollaboratorQuery] = useState("");
  const [sortOption, setSortOption] = useState(() => localStorage.getItem("noteSortOption") || "newest");
  const [viewMode, setViewMode] = useState(() => localStorage.getItem("noteViewMode") || "list");
  const [selectedLabelFilter, setSelectedLabelFilter] = useState(() => localStorage.getItem("noteLabelFilter") || "All");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState(null);
  const [selectedNotes, setSelectedNotes] = useState([]);
  const [actionMode, setActionMode] = useState(false);

  const [friendsList, setFriendsList] = useState([]);
  const [loadingFriends, setLoadingFriends] = useState(false);

  const { weather, setWeather } = useWeather();
  const searchDebounceRef = useRef(null);
  
  const collaboratorCacheRef = useRef({});
  const snapshotDebounceRef = useRef(null);
  const [pageSize] = useState(15);

  const { mode, accent } = useThemeToggle();
  const theme = useMemo(() => getTheme(mode, accent), [mode, accent]);

  const [, startTransition] = useTransition();
  const deferredSearchTerm = useDeferredValue(searchTerm);

  const dynamicFontFamily = useMemo(() => {
    return getFontFamily(selectedNote?.fontStyle || "monospace");
  }, [selectedNote?.fontStyle]);

  const mdComponents = useMemo(() => createMdComponents(mode, dynamicFontFamily), [mode, dynamicFontFamily]);

  useBackButtonClose(drawerOpen, () => setDrawerOpen(false));
  useBackButtonClose(addCollaboratorDrawerOpen, () => setAddCollaboratorDrawerOpen(false));
  useBackButtonClose(addLabelDrawerOpen, () => setAddLabelDrawerOpen(false));
  useBackButtonClose(detailsDrawerOpen, () => setDetailsDrawerOpen(false));
  useBackButtonClose(deleteDialogOpen, () => setDeleteDialogOpen(false));
  useBackButtonClose(actionMode, () => setActionMode(false));

  useEffect(() => {
    if (!weather) {
      let cachedWeather = null;
      try {
        const local = localStorage.getItem(WEATHER_STORAGE_KEY);
        if (local) cachedWeather = JSON.parse(local);
      } catch {}
      if (cachedWeather) setTimeout(() => setWeather(cachedWeather), 100);
    }
  }, [weather, setWeather]);

  useEffect(() => {
    try {
      localStorage.setItem("noteSortOption", sortOption);
      localStorage.setItem("noteViewMode", viewMode);
      localStorage.setItem("noteLabelFilter", selectedLabelFilter);
    } catch (e) {}
  }, [sortOption, viewMode, selectedLabelFilter]);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => setUser(currentUser));
    return () => unsubscribe();
  }, []);

  const fetchCollaboratorProfiles = useCallback(async (uids) => {
    const idsToFetch = []; const fromCache = {};
    for (const uid of uids) {
      if (collaboratorCacheRef.current[uid]) fromCache[uid] = collaboratorCacheRef.current[uid];
      else idsToFetch.push(uid);
    }
    if (Object.keys(fromCache).length > 0) setSharedUsersInfo(prev => ({ ...prev, ...fromCache }));
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
      if (Object.keys(newData).length > 0) setSharedUsersInfo(prev => ({ ...prev, ...newData }));
    } catch (e) {}
  }, []);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "notes"), where("owners", "array-contains", user.uid), orderBy("createdAt", "desc"), limit(pageSize));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (snapshotDebounceRef.current) clearTimeout(snapshotDebounceRef.current);
      snapshotDebounceRef.current = setTimeout(async () => {
        const fetched = []; const uids = new Set();
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          const note = {
            id: docSnap.id, title: data.title || "", content: data.content || "", createdAt: data.createdAt,
            owners: data.owners || [], pinned: data.pinned ?? false, labels: data.labels || [], sharedWith: data.sharedWith || [],
            fontStyle: data.fontStyle || "monospace"
          };
          note.owners.forEach((u) => uids.add(u)); note.sharedWith.forEach((u) => uids.add(u));
          fetched.push(note);
        });
        const processed = fetched.map((n) => ({
          ...n, labels: !n.owners.includes(user.uid) ? Array.from(new Set([...n.labels, "Shared"])) : n.labels,
        }));
        setNotes(processed); setLoading(false);
        if (uids.size > 0) fetchCollaboratorProfiles(Array.from(uids));
      }, 200);
    });
    return () => unsubscribe();
  }, [user, pageSize, fetchCollaboratorProfiles]);

  const labelsFromNotes = useMemo(() => {
    const labelSet = new Set();
    notes.forEach((note) => { (note.labels || []).forEach((label) => { if (label !== "Shared") labelSet.add(label); }); });
    return Array.from(labelSet).sort((a, b) => a.localeCompare(b));
  }, [notes]);

  useEffect(() => { setLabels(labelsFromNotes); }, [labelsFromNotes]);

  useEffect(() => {
    if (selectedNote) {
      setCollaborators(selectedNote.sharedWith || []); setNoteLabels(selectedNote.labels || []);
    }
  }, [selectedNote]);

  const fetchCurrentUsersFriends = async () => {
    if (!user) return;
    setLoadingFriends(true);
    try {
      const currentUserDocRef = doc(db, "users", user.uid);
      const currentUserDocSnap = await getDoc(currentUserDocRef);
      
      if (currentUserDocSnap.exists()) {
        const currentUserData = currentUserDocSnap.data();
        const friendsUids = currentUserData.friends || [];
        
        if (friendsUids.length > 0) {
          const resolvedFriends = [];
          const chunkSize = 30;
          
          for (let i = 0; i < friendsUids.length; i += chunkSize) {
            const chunk = friendsUids.slice(i, i + chunkSize);
            const friendsQuery = query(collection(db, "users"), where(documentId(), "in", chunk));
            const querySnapshot = await getDocs(friendsQuery);
            querySnapshot.forEach((docSnap) => {
              const data = docSnap.data();
              resolvedFriends.push({
                uid: docSnap.id,
                name: data.name || data.displayName || "Anonymous User",
                username: data.username || "No username Provided",
                photoURL: data.photoURL || data.profilePic || "",
                email: data.email || ""
              });
            });
          }
          setFriendsList(resolvedFriends);
        } else {
          setFriendsList([]);
        }
      }
    } catch (err) {
      console.error("Failed to query friends list:", err);
    } finally {
      setLoadingFriends(false);
    }
  };

  const handleToggleCollaborator = async (uid) => {
    if (!selectedNote) return;
    const updatedSharedWith = collaborators.includes(uid)
      ? collaborators.filter(id => id !== uid)
      : [...collaborators, uid];

    try {
      await updateDoc(doc(db, "notes", selectedNote.id), {
        sharedWith: updatedSharedWith,
        owners: arrayUnion(user.uid, uid)
      });
      setCollaborators(updatedSharedWith);
    } catch (err) {
      console.error("Failed to update cloud collaborators:", err);
    }
  };

  const handleToggleLabelMemo = async (label) => {
    if (!selectedNote) return;
    const updatedLabels = noteLabels.includes(label)
      ? noteLabels.filter(l => l !== label)
      : [...noteLabels, label];

    try {
      await updateDoc(doc(db, "notes", selectedNote.id), { labels: updatedLabels });
      setNoteLabels(updatedLabels);
    } catch (err) {
      console.error("Failed to update labels:", err);
    }
  };

  const handleAddNewLabel = async () => {
    const sanitized = newLabelText.trim();
    if (!sanitized || !selectedNote) return;
    if (!labels.includes(sanitized)) {
      setLabels(prev => [...prev, sanitized].sort((a, b) => a.localeCompare(b)));
    }
    if (!noteLabels.includes(sanitized)) {
      try {
        await updateDoc(doc(db, "notes", selectedNote.id), { labels: arrayUnion(sanitized) });
        setNoteLabels(prev => [...prev, sanitized]);
      } catch (err) {
        console.error("Failed to write label reference link:", err);
      }
    }
    setNewLabelText("");
  };

  const filteredFriends = useMemo(() => {
    return friendsList.filter(f => 
      f.name.toLowerCase().includes(searchCollaboratorQuery.toLowerCase()) ||
      (f.email && f.email.toLowerCase().includes(searchCollaboratorQuery.toLowerCase()))
    );
  }, [friendsList, searchCollaboratorQuery]);

  const handlePinNote = useCallback(async (note) => {
    if (!note) return;
    await updateDoc(doc(db, "notes", note.id), { pinned: !note.pinned });
    setSelectedNote(prev => prev?.id === note.id ? { ...prev, pinned: !note.pinned } : prev);
  }, []);

  const handleAddNote = useCallback(async () => {
    if (!noteTitle.trim() && !noteContent.trim()) return;
    setSaving(true);
    try {
      await addDoc(collection(db, "notes"), {
        owners: [user.uid], title: noteTitle, content: noteContent, createdAt: serverTimestamp(), sharedWith: collaborators, labels: noteLabels, pinned: false,
      });
      setNoteTitle(""); setNoteContent(""); setDrawerOpen(false); setSaving(false);
    } catch (e) { setSaving(false); }
  }, [noteTitle, noteContent, user, collaborators, noteLabels]);

  const handleEditNote = useCallback(async () => {
    if (!selectedNote || (!noteTitle.trim() && !noteContent.trim())) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, "notes", selectedNote.id), { title: noteTitle, content: noteContent, sharedWith: collaborators, labels: noteLabels });
      setEditDrawerOpen(false); setDrawerOpen(false); setSelectedNote(null); setSaving(false); setActionMode(false);
    } catch (e) { setSaving(false); }
  }, [selectedNote, noteTitle, noteContent, collaborators, noteLabels]);

  const handleDeleteNote = useCallback(async (id) => { await deleteDoc(doc(db, "notes", id)); }, []);
  const openView = useCallback((note) => { navigate(`/notes/${note.id}`); }, [navigate]);

  const handleTitleChange = useCallback((e) => { setNoteTitle(e.target.value); }, []);
  const handleContentChange = useCallback((e) => { setNoteContent(e.target.value); }, []);

  const handleSearchChange = useCallback((e) => {
    const value = e.target.value; setSearchDisplayValue(value);
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => { startTransition(() => setSearchTerm(value)); }, 350);
  }, [startTransition]);

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

  const sortedNotes = useMemo(() => {
    const copy = [...filteredNotes];
    if (sortOption === "title-asc") copy.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
    else if (sortOption === "title-desc") copy.sort((a, b) => (b.title || "").localeCompare(a.title || ""));
    else if (sortOption === "oldest") copy.reverse();
    return copy;
  }, [filteredNotes, sortOption]);

  const { pinnedNotes, unpinnedNotes } = useMemo(() => {
    const pinned = []; const unpinned = [];
    sortedNotes.forEach(n => (n.pinned ? pinned : unpinned).push(n));
    return { pinnedNotes: pinned, unpinnedNotes: unpinned };
  }, [sortedNotes]);

  return (
    <ThemeProvider theme={theme}>
      <BetaAccessGuard>
        <Box sx={{ p: 3, px: 2, backgroundColor: theme.palette.background.default, color: theme.palette.text.primary, minHeight: "100vh", height: "auto", maxWidth: 700, mx: "auto", mt: 4.5, position: "relative" }}>
          <Box sx={{ display: "flex", flexDirection: "row", gap: 3, justifyContent: "space-between", mb: 2, px: 1 }}>
            <Typography variant="h4" fontWeight="bold" sx={{ flex: 1, color: mode === "dark" ? "#fff" : "#000" }}>Notes</Typography>
            <NotificationsPage />
          </Box>

          <AnimatePresence>
            {actionMode && selectedNote && (
              <>
                <Box onClick={() => setActionMode(false)} sx={{ position: "fixed", inset: 0, zIndex: 1300, WebkitOverflowScrolling: "touch", backdropFilter: "blur(10px) saturate(140%)", WebkitBackdropFilter: "blur(10px) saturate(140%)", background: "rgba(0, 0, 0, 0.4)" }} />
                <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }} style={{ position: "fixed", bottom: 20, width: "calc(100% - 32px)", maxWidth: "540px", mx: "auto", zIndex: 1301 }}>
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1.5, p: "8px 16px", width: "100%", boxSizing: "border-box", "& .MuiButton-root": { textTransform: "none", fontWeight: 600, minWidth: 44, height: 38, px: 1.5, color: mode === "dark" ? "rgba(255, 255, 255, 0.8)" : "rgba(0, 0, 0, 0.7)"} }}>
                    <Stack direction="row" spacing={1} sx={{ width: "100%", alignItems: "center", justifyContent: "space-between" }}>
                      <Tooltip title="Share" TransitionComponent={Zoom} arrow>
                        <IconButton 
                          onClick={() => { setAddCollaboratorDrawerOpen(true); fetchCurrentUsersFriends(); }}
                          sx={{ color: 'text.secondary', p: 1.8, borderRadius: 8, backdropFilter: "blur(25px)", background: mode === "dark" ? "rgba(25, 25, 25, 0.75)" : "rgba(255, 255, 255, 0.35)", boxShadow: theme.palette.mode === "dark" ? `inset 0 1px 2px rgba(255, 255, 255, 0.11), inset 0 -1px 1px rgba(35, 35, 35, 0.07)` : `inset 0 1px 1px rgba(255,255,255,0.8), inset 0 -1px 1px rgba(0,0,0,0.1)` }}
                        >
                          <ShareIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>

                      <Stack direction="row" spacing={0.5} sx={{ backdropFilter: "blur(25px)", background: mode === "dark" ? "rgba(25, 25, 25, 0.75)" : "rgba(255, 255, 255, 0.35)", p: 0.5, borderRadius: 8, boxShadow: theme.palette.mode === "dark" ? `inset 0 1px 2px rgba(255, 255, 255, 0.11), inset 0 -1px 1px rgba(35, 35, 35, 0.07)` : `inset 0 1px 1px rgba(255,255,255,0.8), inset 0 -1px 1px rgba(0,0,0,0.1)` }}>
                        <Tooltip title="Labels" TransitionComponent={Zoom} arrow>
                          <IconButton onClick={() => setAddLabelDrawerOpen(true)} sx={{ color: 'text.secondary', p: 1.5 }}><LabelIcon fontSize="small" /></IconButton>
                        </Tooltip>
                        <Tooltip title="Edit Note" TransitionComponent={Zoom} arrow>
                          <IconButton onClick={() => { setNoteTitle(selectedNote.title || ""); setNoteContent(selectedNote.content || ""); navigate(`/notes/${selectedNote.id}/workspace`); setActionMode(false); }} sx={{ color: 'text.secondary', p: 1.5 }}><EditIcon fontSize="small" /></IconButton>
                        </Tooltip>
                        <Tooltip title="Pin Note" TransitionComponent={Zoom} arrow>
                          <IconButton onClick={() => { handlePinNote(selectedNote); setActionMode(false); }} sx={{ color: 'text.secondary', p: 1.5 }}><PushPinIcon fontSize="small" /></IconButton>
                        </Tooltip>
                      </Stack>

                      <Tooltip title="Delete Note" TransitionComponent={Zoom} arrow>
                        <IconButton 
                          color="error" onClick={() => { setNoteToDelete(selectedNote); setDeleteDialogOpen(true); }} 
                          sx={{ color: 'text.secondary', p: 1.8, borderRadius: 8, backdropFilter: "blur(25px)", background: mode === "dark" ? "rgba(25, 25, 25, 0.75)" : "rgba(255, 255, 255, 0.35)", boxShadow: theme.palette.mode === "dark" ? `inset 0 1px 2px rgba(255, 255, 255, 0.11), inset 0 -1px 1px rgba(35, 35, 35, 0.07)` : `inset 0 1px 1px rgba(255,255,255,0.8), inset 0 -1px 1px rgba(0,0,0,0.1)` }}
                        >
                          <DeleteOutlineIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </Box>
                </motion.div>

                <motion.div initial={{ scale: 0.95, opacity: 0, y: 10 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 10 }} style={{ position: "fixed", mx: "auto", zIndex: 1300, width: "calc(100% - 32px)", maxWidth: "540px", maxHeight: "75vh", display: "flex", flexDirection: "column" }}>
                  <Box>
                    <Box sx={{ borderRadius: 8, p: 3, mb: 2, height: 150, background: mode === "dark" ? "rgba(20, 20, 20, 0.75)" : "rgba(255, 255, 255, 0.55)", boxShadow: theme.palette.mode === "dark" ? `inset 0 1px 2px rgba(255, 255, 255, 0.11), inset 0 -1px 1px rgba(35, 35, 35, 0.07)` : `inset 0 1px 1px rgba(255,255,255,0.8), inset 0 -1px 1px rgba(0,0,0,0.1)` }}>
                      <Typography variant="h5" fontWeight={700} sx={{ borderBottom: `2px solid ${mode === "dark" ? "#f1f1f111" : "#0c0c0c11"}`, pb: 1 }}>{selectedNote.title || "Untitled"}</Typography>
                      <Box onClick={() => navigate(`/notes/${selectedNote.id}`)} sx={{ mt: 2, cursor: "pointer" }}>
                        {selectedNote?.content ? (
                          <>
                            <ReactMarkdown children={selectedNote.content.length > 100 ? `${selectedNote.content.substring(0, 100)}... ` : selectedNote.content} />
                            {selectedNote.content.length > 140 && <Link component="button" variant="body1" underline="hover" onClick={(e) => { e.stopPropagation(); }} sx={{ fontSize: "0.95rem", fontWeight: 600, color: "#7e7e7e", textDecoration: "underline", ml: 0.5, cursor: "pointer" }}>Read more</Link>}
                          </>
                        ) : (
                          <Typography variant="body1" sx={{ fontStyle: 'italic', color: 'text.secondary' }}>*No Content*</Typography>
                        )}
                      </Box>
                    </Box>

                    <Box sx={{ flex: 1, overflowY: "auto", pr: 1, height: 400, borderRadius: 8, p: 3, background: mode === "dark" ? "rgba(20, 20, 20, 0.75)" : "rgba(255, 255, 255, 0.55)", boxShadow: theme.palette.mode === "dark" ? `inset 0 1px 2px rgba(255, 255, 255, 0.11), inset 0 -1px 1px rgba(35, 35, 35, 0.07)` : `inset 0 1px 1px rgba(255, 255, 255, 0.8), inset 0 -1px 1px rgba(0, 0, 0, 0.1)` }}>
                      <Typography variant="h6" fontWeight="800" sx={{ mb: 3, textTransform: "uppercase", fontSize: "0.85rem", color: "text.secondary" }}>Note Details</Typography>
                      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                        <Box sx={{ p: 2.5, borderRadius: 6, background: mode === "dark" ? "rgba(255, 255, 255, 0.01)" : "rgba(0, 0, 0, 0.01)", border: `1px solid ${mode === "dark" ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)"}` }}>
                          <Typography variant="subtitle2" sx={{ color: theme.palette.text.secondary, fontWeight: 700, mb: 2, textTransform: "uppercase", fontSize: "0.75rem" }}>Authors & Sharing</Typography>
                          <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, gap: 4 }}>
                            <Box sx={{ flex: 1 }}>
                              <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontWeight: 600, display: "block", mb: 1 }}>Created By:</Typography>
                              {selectedNote?.owners && selectedNote.owners.length > 0 ? (
                                <Box sx={{ display: "inline-flex", alignItems: "center", gap: 1, background: mode === "dark" ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)", borderRadius: "20px", pl: 0.5, pr: 1.5, py: 0.5 }}>
                                  <Avatar src={sharedUsersInfo[selectedNote.owners[0]]?.photoURL || ""} alt={sharedUsersInfo[selectedNote.owners[0]]?.username || "User"} sx={{ width: 22, height: 22, fontSize: 11, bgcolor: theme.palette.secondary.main, color: "#fff" }}>{sharedUsersInfo[selectedNote.owners[0]]?.username ? sharedUsersInfo[selectedNote.owners[0]].username[0].toUpperCase() : "U"}</Avatar>
                                  <Typography variant="body2" sx={{ color: theme.palette.text.primary, fontSize: 13, fontWeight: 500 }}>{sharedUsersInfo[selectedNote.owners[0]]?.username || selectedNote.owners[0].slice(0, 6) + "..."}</Typography>
                                </Box>
                              ) : <Typography variant="body2" sx={{ color: "text.disabled", fontStyle: "italic" }}>Unknown</Typography>}
                            </Box>
                            <Box sx={{ flex: 2 }}>
                              <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontWeight: 600, display: "block", mb: 1 }}>Collaborators:</Typography>
                              <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ gap: 0.5 }}>
                                {selectedNote?.sharedWith && selectedNote.sharedWith.length > 0 ? selectedNote.sharedWith.map((uid) => (
                                  <Box key={uid} sx={{ display: "flex", alignItems: "center", gap: 1, background: mode === "dark" ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)", borderRadius: "20px", pl: 0.5, pr: 1.5, py: 0.5 }}>
                                    <Avatar src={sharedUsersInfo[uid]?.photoURL || ""} sx={{ width: 22, height: 22, fontSize: 11, bgcolor: theme.palette.primary.main, color: "#fff" }}>{sharedUsersInfo[uid]?.username ? sharedUsersInfo[uid].username[0].toUpperCase() : "U"}</Avatar>
                                    <Typography variant="body2" sx={{ color: theme.palette.text.primary, fontSize: 13, fontWeight: 500 }}>{sharedUsersInfo[uid]?.username || uid.slice(0, 6) + "..."}</Typography>
                                  </Box>
                                )) : <Typography variant="body2" sx={{ color: "text.disabled", fontStyle: "italic", mt: 0.5 }}>Private Note</Typography>}
                              </Stack>
                            </Box>
                          </Box>
                        </Box>

                        <Box sx={{ p: 0.5 }}>
                          <Typography variant="subtitle2" sx={{ color: theme.palette.text.secondary, fontWeight: 700, mb: 2, pl: 1, textTransform: "uppercase", fontSize: "0.75rem" }}>Properties & Style</Typography>
                          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
                            <Box sx={{ p: 2.5, borderRadius: 6, background: mode === "dark" ? "rgba(255, 255, 255, 0.01)" : "rgba(0, 0, 0, 0.01)", border: `1px solid ${mode === "dark" ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)"}` }}>
                              <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontWeight: 600, display: "block", mb: 1 }}>Labels:</Typography>
                              <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ gap: 0.5 }}>
                                {selectedNote?.labels && selectedNote.labels.length > 0 ? selectedNote.labels.map((label) => <Chip key={label} icon={<LabelIcon sx={{ color: mode === "dark" ? "#fff" : "#000", fontSize: "14px !important" }} />} label={label} size="small" sx={{ fontSize: "0.75rem", borderRadius: "8px", fontWeight: 500, color: mode === "dark" ? "#fff" : "#000", background: mode === "dark" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)" }} />) : <Typography variant="body2" sx={{ color: "text.disabled", fontStyle: "italic" }}>No labels assigned</Typography>}
                              </Stack>
                            </Box>
                            <Box sx={{ display: "flex", gap: 2 }}>
                              <Box sx={{ p: 2.5, width: "50%", borderRadius: 6, background: mode === "dark" ? "rgba(255, 255, 255, 0.01)" : "rgba(0, 0, 0, 0.01)", border: `1px solid ${mode === "dark" ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)"}` }}>
                                <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontWeight: 600, display: "block", mb: 0.5 }}>Status:</Typography>
                                <Typography variant="body2" sx={{ fontWeight: 700, color: selectedNote?.pinned ? "success.main" : "text.disabled", fontSize: 13 }}>{selectedNote?.pinned ? "📌 Pinned" : "Regular Note"}</Typography>
                              </Box>
                              <Box sx={{ p: 2.5, width: "50%", borderRadius: 6, background: mode === "dark" ? "rgba(255, 255, 255, 0.01)" : "rgba(0, 0, 0, 0.01)", border: `1px solid ${mode === "dark" ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)"}` }}>
                                <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontWeight: 600, display: "block", mb: 0.5 }}>Active Font:</Typography>
                                <Typography variant="body2" sx={{ fontWeight: 600, textTransform: "capitalize", fontFamily: dynamicFontFamily, color: "primary.main", fontSize: 13 }}>{selectedNote?.fontStyle || "Monospace"}</Typography>
                              </Box>
                            </Box>
                          </Box>
                        </Box>

                        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
                          <Box sx={{ p: 2, borderRadius: 6, background: mode === "dark" ? "rgba(255, 255, 255, 0.005)" : "rgba(0, 0, 0, 0.005)", border: `1px solid ${mode === "dark" ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)"}` }}>
                            <Typography variant="subtitle2" sx={{ color: theme.palette.text.secondary, fontWeight: 600, mb: 0.5 }}>Created On:</Typography>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
                              <Typography variant="body2" sx={{ fontWeight: 600, color: "text.primary" }}>{selectedNote?.createdAt?.toDate ? selectedNote.createdAt.toDate().toLocaleDateString(undefined, { dateStyle: 'medium' }) : selectedNote?.createdAt ? new Date(selectedNote.createdAt).toLocaleDateString(undefined, { dateStyle: 'medium' }) : "N/A"}</Typography>
                              <Typography variant="body2" sx={{ fontWeight: 500, color: "text.secondary" }}>@ {selectedNote?.createdAt?.toDate ? selectedNote.createdAt.toDate().toLocaleTimeString(undefined, { timeStyle: 'short', hour12: true }) : selectedNote?.createdAt ? new Date(selectedNote.createdAt).toLocaleTimeString(undefined, { timeStyle: 'short', hour12: true }) : "N/A"}</Typography>
                            </Box>
                          </Box>
                          <Box sx={{ p: 2, borderRadius: 6, background: mode === "dark" ? "rgba(255, 255, 255, 0.005)" : "rgba(0, 0, 0, 0.005)", border: `1px solid ${mode === "dark" ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)"}` }}>
                            <Typography variant="subtitle2" sx={{ color: theme.palette.text.secondary, fontWeight: 600, mb: 0.5 }}>Note ID:</Typography>
                            <Typography variant="body2" sx={{ fontFamily: "monospace", color: "text.secondary", fontSize: "0.8rem", pt: 0.3 }}>{selectedNote?.id || "N/A"}</Typography>
                          </Box>
                        </Box>
                      </Box>
                    </Box>
                  </Box>
                </motion.div>
              </>
            )}
          </AnimatePresence>

          <Box sx={{ position: "sticky", top: 0, zIndex: 10, pb: 3, px: 0, pt: 6.5, backgroundColor: "transparent" }}>
            <Box px={1}>
              <TextField
                size="small" placeholder="Search notes..." variant="outlined" value={searchDisplayValue} onChange={handleSearchChange}
                InputProps={{ startAdornment: (<InputAdornment position="start"><SearchIcon sx={{ color: mode === "dark" ? "rgba(255, 255, 255, 0.5)" : "rgba(0, 0, 0, 0.4)", mr: 1, fontSize: "1.25rem" }} /></InputAdornment>) }}
                sx={{
                  width: "100%", mb: 2,
                  "& .MuiOutlinedInput-root": {
                    color: mode === "dark" ? "#fff" : "#111", borderRadius: 3, backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)", backgroundColor: mode === "dark" ? "rgba(255, 255, 255, 0)" : "rgba(0, 0, 0, 0.02)",
                    boxShadow: mode === "dark" ? `inset 0 1px 2px rgba(255, 255, 255, 0.11), inset 0 -1px 1px rgba(35, 35, 35, 0.07)` : `inset 0 1px 1px rgba(255,255,255,0.8), inset 0 -1px 1px rgba(0,0,0,0.1)`,
                    border: "0px solid", borderColor: mode === "dark" ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.06)", transition: "all 0.2s ease-in-out", "& fieldset": { border: "none" },
                    "&:hover": { backgroundColor: mode === "dark" ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.05)", borderColor: mode === "dark" ? "rgba(255, 255, 255, 0.18)" : "rgba(0, 0, 0, 0.12)" },
                    "&.Mui-focused": { backgroundColor: mode === "dark" ? "rgba(255, 255, 255, 0.04)" : "rgba(255, 255, 255, 0.8)", borderColor: mode === "dark" ? "rgba(255, 255, 255, 0)" : "primary.main", boxShadow: mode === "dark" ? `0 0 0 3px rgba(255, 255, 255, 0.05)` : `0 0 0 3px rgba(25, 118, 210, 0.15)` }
                  },
                  "& .MuiOutlinedInput-input": { py: 1.2, fontSize: "0.9rem", color: mode === "dark" ? "rgba(255, 255, 255, 0.9)" : "rgba(0, 0, 0, 0.85)", "&::placeholder": { color: mode === "dark" ? "rgba(255, 255, 255, 0.4)" : "rgba(0, 0, 0, 0.4)", opacity: 1 } }
                }}
              />

              <Box display="flex" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
                <TextField
                  select label="Sort by" value={sortOption} onChange={(e) => setSortOption(e.target.value)} size="small"
                  sx={{ minWidth: 150, "& .MuiInputLabel-root": { color: mode === "dark" ? "rgba(255, 255, 255, 0.6)" : "rgba(0, 0, 0, 0.6)" }, "& .MuiInputLabel-root.Mui-focused": { color: mode === "dark" ? "#fff" : "#000" } }}
                  InputLabelProps={{ shrink: true }}
                  InputProps={{
                    sx: {
                      color: mode === "dark" ? "#fff" : "#111", borderRadius: 2.5, backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)", backgroundColor: mode === "dark" ? "rgba(255, 255, 255, 0)" : "rgba(0, 0, 0, 0.02)",
                      boxShadow: mode === "dark" ? `inset 0 1px 2px rgba(255, 255, 255, 0.11), inset 0 -1px 1px rgba(35, 35, 35, 0.07)` : `inset 0 1px 1px rgba(255,255,255,0.8), inset 0 -1px 1px rgba(0,0,0,0.05)`,
                      "&:hover": { backgroundColor: mode === "dark" ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.06)" },
                      "&.Mui-focused": { backgroundColor: mode === "dark" ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.04)", color: mode === "dark" ? "rgba(255, 255, 255, 0.6)" : "rgba(0, 0, 0, 0.6)" }, "& fieldset": { border: "none" }
                    }
                  }}
                  SelectProps={{
                    MenuProps: {
                      PaperProps: {
                        sx: {
                          mt: 1, px: 0.6, borderRadius: 4, backdropFilter: "blur(15px)", WebkitBackdropFilter: "blur(15px)", backgroundColor: mode === "dark" ? "rgba(20, 20, 20, 0)" : "rgba(255, 255, 255, 0.5)", backgroundImage: "none",
                          boxShadow: mode === "dark" ? `inset 0 1px 1px rgba(255, 255, 255, 0.15), 0 8px 32px rgba(0, 0, 0, 0.4)` : `inset 0 1px 1px rgba(255,255,255,0.8), 0 8px 32px rgba(31, 38, 135, 0.05)`, border: "0px solid", borderColor: mode === "dark" ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.05)",
                          "& .MuiMenuItem-root": { fontSize: "0.875rem", mx: 0.5, my: 0.3, borderRadius: 2, color: mode === "dark" ? "rgba(255, 255, 255, 0.8)" : "rgba(0, 0, 0, 0.8)", "&:hover": { backgroundColor: mode === "dark" ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.04)" }, "&.Mui-selected": { backgroundColor: mode === "dark" ? "rgba(255, 255, 255, 0.16)" : "rgba(0, 0, 0, 0.08)", fontWeight: 600, color: mode === "dark" ? "#fff" : "#000", "&:hover": { backgroundColor: mode === "dark" ? "rgba(255, 255, 255, 0.22)" : "rgba(0, 0, 0, 0.12)" } } }
                        }
                      }
                    }
                  }}
                >
                  <MenuItem value="newest">Newest First</MenuItem>
                  <MenuItem value="oldest">Oldest First</MenuItem>
                  <MenuItem value="title-asc">Title A–Z</MenuItem>
                  <MenuItem value="title-desc">Title Z–A</MenuItem>
                </TextField>

                <ToggleButtonGroup
                  value={viewMode} exclusive onChange={(e, next) => next && setViewMode(next)} size="small"
                  sx={{
                    borderRadius: 2.5, backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)", backgroundColor: mode === "dark" ? "rgba(255, 255, 255, 0)" : "rgba(0, 0, 0, 0.02)",
                    boxShadow: mode === "dark" ? `inset 0 1px 2px rgba(255, 255, 255, 0.11), inset 0 -1px 1px rgba(35, 35, 35, 0.07)` : `inset 0 1px 1px rgba(255,255,255,0.8), inset 0 -1px 1px rgba(0,0,0,0.05)`, p: "3px", border: "none",
                    "& .MuiToggleButton-root": { border: "none", borderRadius: 2, mx: "1px", px: 1.5, py: 0.5, transition: "all 0.2s ease", color: mode === "dark" ? "rgba(255, 255, 255, 0.4)" : "rgba(0, 0, 0, 0.4)", "&:hover": { backgroundColor: mode === "dark" ? "rgba(255, 255, 255, 0.06)" : "rgba(0, 0, 0, 0.04)", color: mode === "dark" ? "rgba(255, 255, 255, 0.8)" : "rgba(0, 0, 0, 0.8)" }, "&.Mui-selected": { backgroundColor: mode === "dark" ? "rgba(255, 255, 255, 0.15)" : "rgba(255, 255, 255, 0.9)", color: mode === "dark" ? "#ffffff" : "#000000", boxShadow: "none", "&:hover": { backgroundColor: mode === "dark" ? "rgba(255, 255, 255, 0.18)" : "rgba(255, 255, 255, 1)" } } }
                  }}
                >
                  <ToggleButton value="list"><ViewListIcon sx={{ color: "inherit", fontSize: "1.15rem" }} /></ToggleButton>
                  <ToggleButton value="grid"><ViewModuleIcon sx={{ color: "inherit", fontSize: "1.15rem" }} /></ToggleButton>
                </ToggleButtonGroup>
              </Box>

              <Stack direction="row" spacing={1} sx={{ ...OVERFLOW_SX, mb: 1, pb: 0.5 }}>
                {["All", "Pinned", "Shared", ...labels].map((label) => {
                  const isSelected = selectedLabelFilter === label;
                  return (
                    <Chip
                      key={label} label={label === "Pinned" ? "📌 Pinned" : label} clickable onClick={() => setSelectedLabelFilter(label)}
                      sx={{
                        borderRadius: 4, fontSize: "0.85rem", fontWeight: isSelected ? 600 : 500, px: 0.5, transition: "all 0.2s ease-in-out", backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)", border: "0px solid",
                        ...(isSelected ? { backgroundColor: mode === "dark" ? "rgba(255, 255, 255, 0.9)" : "rgba(0, 0, 0, 0.85)", color: mode === "dark" ? "#000" : "#fff", borderColor: "transparent", boxShadow: mode === "dark" ? "0 4px 12px rgba(255, 255, 255, 0.1)" : "0 4px 12px rgba(0, 0, 0, 0.15)", "&:hover": { backgroundColor: mode === "dark" ? "#ffffff" : "#000000" } } : { backgroundColor: mode === "dark" ? "rgba(255, 255, 255, 0)" : "rgba(0, 0, 0, 0.03)", color: mode === "dark" ? "rgba(255, 255, 255, 0.7)" : "rgba(0, 0, 0, 0.65)", borderColor: mode === "dark" ? "rgba(255, 255, 255, 0.06)" : "rgba(0, 0, 0, 0.05)", boxShadow: mode === "dark" ? `inset 0 1px 1px rgba(255, 255, 255, 0.08)` : `inset 0 1px 1px rgba(255, 255, 255, 0.6)`, "&:hover": { backgroundColor: mode === "dark" ? "rgba(255, 255, 255, 0.09)" : "rgba(0, 0, 0, 0.06)", borderColor: mode === "dark" ? "rgba(255, 255, 255, 0.15)" : "rgba(0, 0, 0, 0.12)", color: mode === "dark" ? "#fff" : "#000" } })
                      }}
                    />
                  );
                })}
              </Stack>
            </Box>
            <Box sx={{ position: "absolute", top: -5, left: 0, right: 0, height: 350, zIndex: -1, mx: -2, pointerEvents: "none", backdropFilter: "blur(80px)", WebkitBackdropFilter: "blur(80px)", maskImage: `linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0.92) 18%, rgba(0,0,0,0.72) 38%, rgba(0,0,0,0.42) 62%, rgba(0,0,0,0.12) 82%, rgba(0,0,0,0) 100%)`, WebkitMaskImage: `linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0.92) 18%, rgba(0,0,0,0.72) 38%, rgba(0,0,0,0.42) 62%, rgba(0,0,0,0.12) 82%, rgba(0,0,0,0) 100%)`, background: mode === "dark" ? `linear-gradient(to bottom, rgba(0,0,0,0), rgba(0,0,0,0))` : `linear-gradient(to bottom, rgba(255,255,255,0), rgba(255,255,255,0))` }} />
          </Box>

          <Box sx={TRANSPARENT_CONTENT_SX} px={1}>
            <CardContent sx={CARD_STATIC_SX}>
              {loading ? ( <Box sx={{ display: "flex", justifyContent: "center", py: 1 }}><CircularProgress /></Box> ) : (
                <Box>
                  <Stack spacing={1.4}>
                    {[...pinnedNotes, ...unpinnedNotes].map((note) => (
                      <div key={note.id} style={{ filter: actionMode ? "blur(4px)" : "none", opacity: actionMode ? 0.35 : 1, transition: "all 0.3s ease" }}>
                        <NoteCard note={note} mode={mode} theme={theme} onOpen={() => openView(note)} onMenu={() => { setSelectedNotes([note]); setSelectedNote(note); setActionMode(true); }} isSelected={selectedNotes.some(n => n.id === note.id) && actionMode} actionMode={actionMode} />
                      </div>
                    ))}
                  </Stack>
                </Box>
              )}
            </CardContent>
          </Box>

          <SwipeableDrawer anchor="bottom" open={drawerOpen} onClose={() => setDrawerOpen(false)} onOpen={() => {}} PaperProps={{ sx: { backgroundColor: theme.palette.background.default, p: 3, maxWidth: 480, height: "95vh", mx: "auto" } }}>
            <Box sx={{ display: "flex", flexDirection: "column", pb: 9 }}>
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2, mt: 4.5 }}>
                <Typography variant="h6" fontWeight="bold">{editDrawerOpen ? "Edit Note" : "New Note"}</Typography>
                <Button variant="contained" onClick={editDrawerOpen ? handleEditNote : handleAddNote} sx={{ borderRadius: 4, background: theme.palette.primary.bgr }}>Save</Button>
              </Box>
              <TextField placeholder="Enter title..." value={noteTitle} onChange={handleTitleChange} fullWidth variant="standard" InputProps={{ disableUnderline: true, sx: { fontSize: 22, fontWeight: 600 } }} />
              <TextField placeholder="Start writing your note..." value={noteContent} onChange={handleContentChange} fullWidth multiline minRows={12} variant="standard" InputProps={{ disableUnderline: true }} />
            </Box>
          </SwipeableDrawer>

          {/* COLLABORATORS DRAWER */}
          <SwipeableDrawer
            anchor="bottom"
            open={addCollaboratorDrawerOpen}
            onClose={() => { setAddCollaboratorDrawerOpen(false); setSearchCollaboratorQuery(""); }}
            onOpen={() => {}}
            disableSwipeToOpen
            sx={{ zIndex: 1400 }}
            PaperProps={{
              sx: {
                borderRadius: 8, p: 4, minHeight: "50vh", maxHeight: "80vh",backgroundImage: "none",
                background: mode === "dark" ? "rgba(20,20,20,0.08)" : "rgba(255,255,255,0.39)", backdropFilter: "blur(20px)",
                boxShadow: theme.palette.mode === "dark" ? `inset 0 1px 2px rgba(255, 255, 255, 0.11), inset 0 -1px 1px rgba(35, 35, 35, 0.07)` : `inset 0 1px 1px rgba(255,255,255,0.8), inset 0 -1px 1px rgba(0, 0, 0, 0.1)`,
                mx: "auto", m: 2
              },
            }}
            ModalProps={{ BackdropProps: { sx: { backdropFilter: "blur(10px)", backgroundColor: "rgba(0,0,0,0)" } } }}
          >
            <Box sx={{ display: "flex", justifyContent: "center", py: -1.5, pb: 3 }}>
              <Box
                sx={{
                  width: 60, height: 5, borderRadius: 999,
                  background: mode === "dark" ? "#f1f1f127" : "#0c0c0c3e",
                  backdropFilter: "blur(12px)", cursor: "grab", transition: "all .25s ease",
                  "&:hover": { width: 72 },
                  "&:active": { cursor: "grabbing", transform: "scale(0.95)" },
                }}
              />
            </Box>

            <Typography variant="h6" fontWeight={700} mb={2}>Collaborators</Typography>
            <TextField
              placeholder="Search friends by name or email..." value={searchCollaboratorQuery} onChange={(e) => setSearchCollaboratorQuery(e.target.value)} fullWidth variant="outlined" size="small"
              InputProps={{ startAdornment: (<InputAdornment position="start"><SearchIcon fontSize="small" style={{ color: "gray" }} /></InputAdornment>) }}
              sx={{
                width: "100%", mb: 2,
                "& .MuiOutlinedInput-root": {
                  color: mode === "dark" ? "#fff" : "#111", borderRadius: 3, backgroundColor: mode === "dark" ? "rgba(255, 255, 255, 0.03)" : "rgba(0, 0, 0, 0.02)",
                  boxShadow: mode === "dark" ? `inset 0 1px 2px rgba(255, 255, 255, 0.11), inset 0 -1px 1px rgba(35, 35, 35, 0.07)` : `inset 0 1px 1px rgba(255,255,255,0.8), inset 0 -1px 1px rgba(0,0,0,0.1)`, border: "0px solid", "& fieldset": { border: "none" },
                  "&:hover": { backgroundColor: mode === "dark" ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.05)" },
                  "&.Mui-focused": { backgroundColor: mode === "dark" ? "rgba(255, 255, 255, 0.04)" : "rgba(255, 255, 255, 0.8)", boxShadow: mode === "dark" ? `0 0 0 3px rgba(255, 255, 255, 0.05)` : `0 0 0 3px rgba(25, 118, 210, 0.15)` }
                }
              }}
            />
            {loadingFriends ? <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}><CircularProgress size={28} color="inherit" /></Box> : (
              <List dense sx={{ width: '100%', maxHeight: "50vh", overflowY: "auto" }}>
                {filteredFriends.length > 0 ? filteredFriends.map((friend) => {
                  const isAdded = collaborators.includes(friend.uid);
                  return (
                    <ListItem key={friend.uid} disablePadding secondaryAction={
                      <IconButton edge="end" onClick={() => handleToggleCollaborator(friend.uid)} color={isAdded ? "success" : "default"} sx={{ borderRadius: "20px", background: mode === "dark" ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.8)", backdropFilter: "blur(10px)", boxShadow: theme.palette.mode === "dark" ? `inset 0 1px 2px rgba(255, 255, 255, 0.11), inset 0 -1px 1px rgba(35, 35, 35, 0.07)` : `inset 0 1px 1px rgba(255,255,255,0.8), inset 0 -1px 1px rgba(0, 0, 0, 0.1)` }}>
                        {isAdded ? <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, px: 0.5 }}><span style={{ fontSize: "0.75rem", fontWeight: 700 }}>Added</span></Box> : <AddIcon fontSize="small" />}
                      </IconButton>
                    } sx={{ py: 1 }}>
                      <ListItemAvatar><Avatar src={friend.photoURL || friend.profilePic} sx={{ width: 40, height: 40, fontWeight: 700, bgcolor: theme.palette.primary.main, color: mode === "dark" ? "#000" : "#fff" }}>{friend.name.charAt(0).toUpperCase()}</Avatar></ListItemAvatar>
                      <ListItemText primary={friend.name} secondary={friend.username} primaryTypographyProps={{ fontWeight: 600, sx: { pl: 1 } }} secondaryTypographyProps={{ sx: { pl: 1 } }} />
                    </ListItem>
                  );
                }) : <Typography variant="body2" color="text.secondary" sx={{ mt: 2, fontStyle: "italic", textAlign: "center" }}>No friends match your search criterion.</Typography>}
              </List>
            )}
          </SwipeableDrawer>

          {/* LABELS DRAWER */}
          <SwipeableDrawer
            anchor="bottom"
            open={addLabelDrawerOpen}
            onClose={() => { setAddLabelDrawerOpen(false); setNewLabelText(""); }}
            onOpen={() => {}}
            disableSwipeToOpen
            sx={{ zIndex: 1400 }}
            PaperProps={{
              sx: {
                borderRadius: 8, p: 4, minHeight: "20vh", maxHeight: "50vh",
                background: mode === "dark" ? "rgba(20,20,20,0.08)" : "rgba(255,255,255,0.39)", backdropFilter: "blur(10px)", backgroundImage: "none",
                boxShadow: theme.palette.mode === "dark" ? `inset 0 1px 2px rgba(255, 255, 255, 0.11), inset 0 -1px 1px rgba(35, 35, 35, 0.07)` : `inset 0 1px 1px rgba(255,255,255,0.8), inset 0 -1px 1px rgba(0, 0, 0, 0.1)`,
                mx: "auto", m: 2
              },
            }}
            ModalProps={{ BackdropProps: { sx: { backdropFilter: "blur(10px)", backgroundColor: "rgba(0,0,0,0)" } } }}
          >
            <Box sx={{ display: "flex", justifyContent: "center", py: -1.5, pb: 3 }}>
              <Box
                sx={{
                  width: 60, height: 5, borderRadius: 999,
                  background: mode === "dark" ? "#f1f1f127" : "#0c0c0c3e",
                  backdropFilter: "blur(12px)", cursor: "grab", transition: "all .25s ease",
                  "&:hover": { width: 72 },
                  "&:active": { cursor: "grabbing", transform: "scale(0.95)" },
                }}
              />
            </Box>

            <Typography variant="h6" fontWeight={700} mb={2}>Labels</Typography>
            <Box sx={{ display: "flex", gap: 1, mb: 3 }}>
              <TextField
                placeholder="Create new label..." value={newLabelText} onChange={(e) => setNewLabelText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddNewLabel()} variant="outlined" size="small" fullWidth                
                sx={{
                  width: "100%",
                  "& .MuiOutlinedInput-root": {
                    color: mode === "dark" ? "#fff" : "#111", borderRadius: 3, backgroundColor: mode === "dark" ? "rgba(255, 255, 255, 0)" : "rgba(0, 0, 0, 0.02)",
                    boxShadow: mode === "dark" ? `inset 0 1px 2px rgba(255, 255, 255, 0.11), inset 0 -1px 1px rgba(35, 35, 35, 0.07)` : `inset 0 1px 1px rgba(255,255,255,0.8), inset 0 -1px 1px rgba(0,0,0,0.1)`, border: "0.1px solid", borderColor: mode === "dark" ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.06)", "& fieldset": { border: "none" },
                    "&:hover": { backgroundColor: mode === "dark" ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.05)" },
                    "&.Mui-focused": { backgroundColor: mode === "dark" ? "rgba(255, 255, 255, 0.04)" : "rgba(255, 255, 255, 0.8)", boxShadow: mode === "dark" ? `0 0 0 3px rgba(255, 255, 255, 0.05)` : `0 0 0 3px rgba(25, 118, 210, 0.15)` }
                  }
                }}
              />
              <IconButton onClick={handleAddNewLabel} color="primary" disabled={!newLabelText.trim()} sx={{ color: mode === "dark" ? "#fff" : "#000", background: mode === "dark" ? "rgba(255, 255, 255, 0.18)" : "rgba(255,255,255,0.8)", backdropFilter: "blur(10px)", boxShadow: theme.palette.mode === "dark" ? `inset 0 1px 2px rgba(255, 255, 255, 0.11), inset 0 -1px 1px rgba(35, 35, 35, 0.07)` : `inset 0 1px 1px rgba(255,255,255,0.8), inset 0 -1px 1px rgba(0, 0, 0, 0.1)`, borderRadius: 8 }}><AddIcon /></IconButton>
            </Box>
            <Typography variant="subtitle2" fontWeight={600} mb={1.5} color="text.secondary">Your Labels Collection</Typography>
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", maxHeight: "25vh", overflowY: "auto" }}>
              {labels.length > 0 ? labels.map((label) => {
                const isSelected = noteLabels.includes(label);
                return (<Chip key={label} label={label} onClick={() => handleToggleLabelMemo(label)} variant={isSelected ? "filled" : "outlined"} sx={{ borderRadius: 6, px: 0.5, fontWeight: 600, border: 0, color: isSelected ? (mode === "dark" ? "#000" : "#fff") : "text.primary", backgroundColor: isSelected ? (mode === "dark" ? "#ffffff" : "rgba(21, 21, 21, 0.86)") : (mode === "dark" ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.8)"), boxShadow: isSelected ? (mode === "dark" ? `inset 0 1px 1px rgba(52, 52, 52, 0.96), inset 0 -1px 1px rgba(31, 31, 31, 0.68)` : `inset 0 1px 2px rgba(255, 255, 255, 0.11), inset 0 -1px 1px rgba(35, 35, 35, 0.07)`) : (mode === "dark" ? `inset 0 1px 2px rgba(255, 255, 255, 0.11), inset 0 -1px 1px rgba(35, 35, 35, 0.07)` : `inset 0 1px 1px rgba(255,255,255,0.8), inset 0 -1px 1px rgba(0, 0, 0, 0.1)`), backdropFilter: "blur(10px)" }} />);
              }) : <Typography variant="body2" color="text.secondary" fontStyle="italic">No labels created yet.</Typography>}
            </Box>
          </SwipeableDrawer>

          {/* Note Details Drawer */}
          <SwipeableDrawer
            anchor="bottom" open={detailsDrawerOpen} fullWidth onClose={() => setDetailsDrawerOpen(false)} onOpen={() => {}} disableSwipeToOpen disableDiscovery transitionDuration={{ enter: 200, exit: 150 }}
            PaperProps={{ sx: { borderRadius: 8, background: mode === "dark" ? "rgba(20, 20, 20, 0.08)" : "rgba(255, 255, 255, 0.39)", backgroundImage: "none", backdropFilter: "blur(20px)", p: 3, m: 2, height: "auto", maxHeight: "50vh", width: "80%", mx: "auto", boxShadow: theme.palette.mode === "dark" ? `inset 0 1px 2px rgba(255, 255, 255, 0.11), inset 0 -1px 1px rgba(35, 35, 35, 0.07)` : `inset 0 1px 1px rgba(255,255,255,0.8), inset 0 -1px 1px rgba(0, 0, 0, 0.1)` } }}
          >
            <Box sx={{ display: "flex", justifyContent: "center", py: -1.5, pb: 3 }}>
              <Box
                sx={{
                  width: 60, height: 5, borderRadius: 999,
                  background: mode === "dark" ? "#f1f1f127" : "#0c0c0c3e",
                  backdropFilter: "blur(12px)", cursor: "grab", transition: "all .25s ease",
                  "&:hover": { width: 72 },
                  "&:active": { cursor: "grabbing", transform: "scale(0.95)" },
                }}
              />
            </Box>

            <Box sx={{ display: "flex", justifyContent: "center", py: -1.5, pb: 3 }}><Box sx={{ width: 60, height: 5, borderRadius: 999, background: mode === "dark" ? "#f1f1f127" : "#0c0c0c", backdropFilter: "blur(12px)", cursor: "grab", transition: "all .25s ease", "&:hover": { width: 72 }, "&:active": { cursor: "grabbing", transform: "scale(0.95)" } }} /></Box>
            <Typography variant="h6" fontWeight="800" sx={{ mb: 3, letterSpacing: "0.5px", textTransform: "uppercase", fontSize: "0.85rem", color: "text.secondary" }}>Note Details</Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <Box sx={{ p: 2.5, borderRadius: 4, background: mode === "dark" ? "rgba(255, 255, 255, 0.01)" : "rgba(0, 0, 0, 0.01)", border: `1px solid ${mode === "dark" ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)"}` }}>
                <Typography variant="subtitle2" sx={{ color: theme.palette.text.secondary, fontWeight: 700, mb: 2, textTransform: "uppercase", fontSize: "0.75rem", letterSpacing: "0.5px" }}>Authors & Sharing</Typography>
                <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, gap: 4 }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontWeight: 600, display: "block", mb: 1 }}>Created By:</Typography>
                    {selectedNote?.owners && selectedNote.owners.length > 0 ? (
                      <Box sx={{ display: "inline-flex", alignItems: "center", gap: 1, background: mode === "dark" ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)", borderRadius: "20px", pl: 0.5, pr: 1.5, py: 0.5 }}>
                        <Avatar src={sharedUsersInfo[selectedNote.owners[0]]?.photoURL || ""} sx={{ width: 22, height: 22, fontSize: 11, bgcolor: theme.palette.secondary.main, color: "#fff" }}>{sharedUsersInfo[selectedNote.owners[0]]?.username ? sharedUsersInfo[selectedNote.owners[0]].username[0].toUpperCase() : "U"}</Avatar>
                        <Typography variant="body2" sx={{ color: theme.palette.text.primary, fontSize: 13, fontWeight: 500 }}>{sharedUsersInfo[selectedNote.owners[0]]?.username || selectedNote.owners[0].slice(0, 6) + "..."}</Typography>
                      </Box>
                    ) : <Typography variant="body2" sx={{ color: "text.disabled", fontStyle: "italic" }}>Unknown</Typography>}
                  </Box>
                  <Box sx={{ flex: 2 }}>
                    <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontWeight: 600, display: "block", mb: 1 }}>Collaborators:</Typography>
                    <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ gap: 0.5 }}>
                      {selectedNote?.sharedWith && selectedNote.sharedWith.length > 0 ? selectedNote.sharedWith.map((uid) => (
                        <Box key={uid} sx={{ display: "flex", alignItems: "center", gap: 1, background: mode === "dark" ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)", borderRadius: "20px", pl: 0.5, pr: 1.5, py: 0.5 }}>
                          <Avatar src={sharedUsersInfo[uid]?.photoURL || ""} sx={{ width: 22, height: 22, fontSize: 11, bgcolor: theme.palette.primary.main, color: "#fff" }}>{sharedUsersInfo[uid]?.username ? sharedUsersInfo[uid].username[0].toUpperCase() : "U"}</Avatar>
                          <Typography variant="body2" sx={{ color: theme.palette.text.primary, fontSize: 13, fontWeight: 500 }}>{sharedUsersInfo[uid]?.username || uid.slice(0, 6) + "..."}</Typography>
                        </Box>
                      )) : <Typography variant="body2" sx={{ color: "text.disabled", fontStyle: "italic", mt: 0.5 }}>Private Note</Typography>}
                    </Stack>
                  </Box>
                </Box>
              </Box>

              <Box sx={{ p: 0.5 }}>
                <Typography variant="subtitle2" sx={{ color: theme.palette.text.secondary, fontWeight: 700, mb: 2, textTransform: "uppercase", fontSize: "0.75rem", letterSpacing: "0.5px" }}>Properties & Style</Typography>
                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
                  <Box sx={{ p: 2.5, borderRadius: 4, background: mode === "dark" ? "rgba(255, 255, 255, 0.01)" : "rgba(0, 0, 0, 0.01)", border: `1px solid ${mode === "dark" ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)"}` }}>
                    <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontWeight: 600, display: "block", mb: 1 }}>Labels:</Typography>
                    <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ gap: 0.5 }}>
                      {selectedNote?.labels && selectedNote.labels.length > 0 ? selectedNote.labels.map((label) => <Chip key={label} icon={<LabelIcon sx={{ color: mode === "dark" ? "#fff" : "#000", fontSize: "14px !important" }} />} label={label} size="small" sx={{ fontSize: "0.75rem", borderRadius: "8px", fontWeight: 500, color: mode === "dark" ? "#fff" : "#000", background: mode === "dark" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)" }} />) : <Typography variant="body2" sx={{ color: "text.disabled", fontStyle: "italic" }}>No labels assigned</Typography>}
                    </Stack>
                  </Box>
                  <Box sx={{ display: "flex", gap: 2 }}>
                    <Box sx={{ p: 2.5, width: "50%", borderRadius: 4, background: mode === "dark" ? "rgba(255, 255, 255, 0.01)" : "rgba(0, 0, 0, 0.01)", border: `1px solid ${mode === "dark" ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)"}` }}>
                      <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontWeight: 600, display: "block", mb: 0.5 }}>Status:</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: selectedNote?.pinned ? "success.main" : "text.disabled", fontSize: 13 }}>{selectedNote?.pinned ? "📌 Pinned" : "Regular Note"}</Typography>
                    </Box>
                    <Box sx={{ p: 2.5, width: "50%", borderRadius: 4, background: mode === "dark" ? "rgba(255, 255, 255, 0.01)" : "rgba(0, 0, 0, 0.01)", border: `1px solid ${mode === "dark" ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)"}` }}>
                      <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontWeight: 600, display: "block", mb: 0.5 }}>Active Font:</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, textTransform: "capitalize", fontFamily: dynamicFontFamily, color: "primary.main", fontSize: 13 }}>{selectedNote?.fontStyle || "Monospace"}</Typography>
                    </Box>
                  </Box>
                </Box>
              </Box>

              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
                <Box sx={{ p: 2, borderRadius: 3, background: mode === "dark" ? "rgba(255, 255, 255, 0.005)" : "rgba(0, 0, 0, 0.005)", border: `1px solid ${mode === "dark" ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)"}` }}>
                  <Typography variant="subtitle2" sx={{ color: theme.palette.text.secondary, fontWeight: 600, mb: 0.5 }}>Created On:</Typography>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: "text.primary" }}>{selectedNote?.createdAt?.toDate ? selectedNote.createdAt.toDate().toLocaleDateString(undefined, { dateStyle: 'medium' }) : selectedNote?.createdAt ? new Date(selectedNote.createdAt).toLocaleDateString(undefined, { dateStyle: 'medium' }) : "N/A"}</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500, color: "text.secondary" }}>{selectedNote?.createdAt?.toDate ? selectedNote.createdAt.toDate().toLocaleTimeString(undefined, { timeStyle: 'short', hour12: true }) : selectedNote?.createdAt ? new Date(selectedNote.createdAt).toLocaleTimeString(undefined, { timeStyle: 'short', hour12: true }) : "N/A"}</Typography>
                  </Box>
                </Box>
                <Box sx={{ p: 2, borderRadius: 3, background: mode === "dark" ? "rgba(255, 255, 255, 0.005)" : "rgba(0, 0, 0, 0.005)", border: `1px solid ${mode === "dark" ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)"}` }}>
                  <Typography variant="subtitle2" sx={{ color: theme.palette.text.secondary, fontWeight: 600, mb: 0.5 }}>Note ID:</Typography>
                  <Typography variant="body2" sx={{ fontFamily: "monospace", color: "text.secondary", fontSize: "0.8rem", pt: 0.3 }}>{selectedNote?.id || "N/A"}</Typography>
                </Box>
              </Box>
            </Box>
          </SwipeableDrawer>

          {/* Premium Glassmorphic Delete Swipeable Bottom Sheet */}
          <SwipeableDrawer
            anchor="bottom" open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} onOpen={() => {}} disableSwipeToOpen sx={{ zIndex: 1500 }}
            PaperProps={{ sx: { borderRadius: 8, p: 3, background: mode === "dark" ? "rgba(20, 20, 20, 0.08)" : "rgba(255,255,255,0.39)", backdropFilter: "blur(20px)", boxShadow: theme.palette.mode === "dark" ? `inset 0 1px 2px rgba(255, 255, 255, 0.11), inset 0 -1px 1px rgba(35, 35, 35, 0.07)` : `inset 0 1px 1px rgba(255,255,255,0.8), inset 0 -1px 1px rgba(0, 0, 0, 0.1)`, maxWidth: 540, mx: "auto", m: 3 } }}
            ModalProps={{
              BackdropProps: { sx: { backdropFilter: "blur(10px)", backgroundColor: "rgba(0,0,0,0)" } }
            }}
          >
            <Typography variant="h6" fontWeight="700" sx={{ textAlign: "center", color: mode === "dark" ? "#fff" : "#000", mb: 2 }}>Delete Note</Typography>
            <Box display="flex" flexDirection="column" alignItems="center" gap={2} sx={{ mb: 3 }}>
              <Box sx={{ width: 56, height: 56, borderRadius: "50%", backgroundColor: mode === "dark" ? "rgba(229, 57, 53, 0.15)" : "#ffebee", display: "flex", alignItems: "center", justifyContent: "center" }}><Typography sx={{ fontSize: 26 }}>🗑️</Typography></Box>
              <Typography variant="body1" textAlign="center" sx={{ fontWeight: 500, px: 2 }}>Are you sure you want to permanently delete <strong>{noteToDelete?.title || "this note"}</strong>?</Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontStyle: "italic" }}>This change can't be undone.</Typography>
            </Box>
            <Stack direction="row" spacing={2} justifyContent="center" sx={{ pb: 1 }}>
              <Button variant="outlined" fullWidth onClick={() => setDeleteDialogOpen(false)} sx={{ textTransform: "none", background: mode === "dark" ? "rgba(255, 255, 255, 0.08)" : "rgba(255,255,255,0.42)", backdropFilter: "blur(10px)", boxShadow: theme.palette.mode === "dark" ? `inset 0 1px 2px rgba(255, 255, 255, 0.11), inset 0 -1px 1px rgba(35, 35, 35, 0.07)` : `inset 0 1px 1px rgba(255,255,255,0.8), inset 0 -1px 1px rgba(0, 0, 0, 0.1)`, borderRadius: 8, py: 1.2, fontWeight: 600, border: "none", color: mode === "dark" ? "#fff" : "#000", "&:hover": { backgroundColor: mode === "dark" ? "rgba(255,255,255,0.05)" : "#f5f5f5" } }}>Cancel</Button>
              <Button variant="contained" fullWidth onClick={async () => { await handleDeleteNote(noteToDelete.id); setDeleteDialogOpen(false); setActionMode(false); }} sx={{ textTransform: "none", background: mode === "dark" ? "rgba(229, 57, 53, 0.18)" : "rgba(255, 102, 102, 0.69)", backdropFilter: "blur(10px)", boxShadow: theme.palette.mode === "dark" ? `inset 0 1px 2px rgba(255, 255, 255, 0.11), inset 0 -1px 1px rgba(35, 35, 35, 0.07)` : `inset 0 1px 1px rgba(255,255,255,0.8), inset 0 -1px 1px rgba(0, 0, 0, 0.1)`, borderRadius: 8, py: 1.2, fontWeight: 600, color: mode === "dark" ? "#fff" : "#000", "&:hover": { backgroundColor: "#c62828" } }}>Delete Note</Button>
            </Stack>
          </SwipeableDrawer>

          <FloatingNewNotes mode={mode} onOpen={() => { setNoteTitle(""); setNoteContent(""); setNoteLabels([]); setCollaborators([]); setSelectedNote(null); setEditDrawerOpen(false); setDrawerOpen(true); }} />
        </Box>
      </BetaAccessGuard>
    </ThemeProvider>
  );
};

export const ViewNotePage = () => {
  const { noteId } = useParams();
  const navigate = useNavigate();
  const [note, setNote] = useState(null);
  const [loading, setLoading] = useState(true);
  const { mode } = useThemeToggle();
  const theme = useMemo(() => getTheme(mode, "blue"), [mode]);

  useEffect(() => {
    const fetchNoteIndependent = async () => {
      if (!noteId) return;
      try {
        const docSnap = await getDoc(doc(db, "notes", noteId));
        if (docSnap.exists()) setNote({ id: docSnap.id, ...docSnap.data() });
        setLoading(false);
      } catch (e) { setLoading(false); }
    };
    fetchNoteIndependent();
  }, [noteId]);

  if (loading) return <Box sx={{ display: "flex", height: "100vh", alignItems: "center", justifyContent: "center" }}><CircularProgress /></Box>;
  if (!note) return <Box sx={{ p: 4, textAlign: "center" }}><Typography>Note not found.</Typography><Button onClick={() => navigate("/notes")}>Return</Button></Box>;

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ minHeight: "100vh", bgcolor: theme.palette.background.default, color: theme.palette.text.primary, p: 3, pt: 6, maxWidth: 600, mx: "auto" }}>
        <Button onClick={() => navigate(-1)} startIcon={<ArrowBackIcon />} sx={{ mb: 4, color: mode === "dark" ? "#fff" : "#000" }}>Back</Button>
        <Typography variant="h4" fontWeight={800} sx={{ mb: 2 }}>{note.title || "Untitled Note"}</Typography>
        <Box sx={{ mt: 2, lineHeight: 1.7 }}>
          <ReactMarkdown components={{
            p: ({ children }) => <Typography variant="body1" sx={{ mb: 2, lineHeight: 1.6 }}>{children}</Typography>,
            h1: ({ children }) => <Typography variant="h4" sx={{ mt: 3, fontWeight: 700 }}>{children}</Typography>,
            code: ({ children }) => <Box component="code" sx={{ bgcolor: "rgba(255,255,255,0.08)", px: 0.8, borderRadius: 1.5, fontFamily: 'monospace' }}>{children}</Box>
          }}>{note.content || "*Empty Note Content*"}</ReactMarkdown>
        </Box>
      </Box>
    </ThemeProvider>
  );
};

export default Notes;