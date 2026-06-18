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
  Zoom
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
  limit
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
  background: mode === "dark" ? "rgba(30, 30, 30, 0.4)" : "rgba(255, 255, 255, 0.4)",
  backdropFilter: "blur(22px)",
  border: "none",
  boxShadow: mode === "dark"
    ? `inset 0 1px 2px rgba(255, 255, 255, 0.11), inset 0 -1px 1px rgba(35, 35, 35, 0.07)`
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
        onClick={onOpen}
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

const useLongPress = (callback, ms = 500) => {
  const timeoutRef = useRef(null);
  const isLongPressTriggeredRef = useRef(false);

  const start = useCallback((event) => {
    event.persist();
    isLongPressTriggeredRef.current = false;
    timeoutRef.current = setTimeout(() => {
      isLongPressTriggeredRef.current = true;
      callback(event);
    }, ms);
  }, [callback, ms]);

  const stop = useCallback((event) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    return isLongPressTriggeredRef.current;
  }, []);

  return {
    onMouseDown: start,
    onTouchStart: start,
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
        border: "2px solid transparent",
        display: "block",
        boxSizing: "border-box",
        transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
        WebkitTapHighlightColor: "transparent",

        ...(isSelected && {
          transform: "scale(1.03) translateY(-4px) !important",
          zIndex: 10001,
          border: mode === "dark" 
            ? "1px solid rgba(255, 255, 255, 0.45)" 
            : `1px solid ${theme.palette.primary.main}`,
          boxShadow: mode === "dark" ? "0 24px 64px rgba(0,0,0,0.65)" : "0 24px 64px rgba(0, 0, 0, 0.16)",
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
  const [newCollaboratorUsername, setNewCollaboratorUsername] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [sortOption, setSortOption] = useState(() => localStorage.getItem("noteSortOption") || "newest");
  const [viewMode, setViewMode] = useState(() => localStorage.getItem("noteViewMode") || "list");
  const [selectedLabelFilter, setSelectedLabelFilter] = useState(() => localStorage.getItem("noteLabelFilter") || "All");
  const [isPreview, setIsPreview] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState(null);
  const [selectedNotes, setSelectedNotes] = useState([]);
  const [actionMode, setActionMode] = useState(false);

  const { weather, setWeather } = useWeather();
  const [autoSaveStatus, setAutoSaveStatus] = useState("");
  const autoSaveTimerRef = useRef(null);
  const titleInputRef = useRef("");
  const contentInputRef = useRef("");
  const searchDebounceRef = useRef(null);
  
  const collaboratorCacheRef = useRef({});
  const snapshotDebounceRef = useRef(null);
  const isManuallySavedRef = useRef(false);
  const [pageSize] = useState(15);

  const { mode, accent } = useThemeToggle();
  const theme = useMemo(() => getTheme(mode, accent), [mode, accent]);

  const [, startTransition] = useTransition();
  const deferredSearchTerm = useDeferredValue(searchTerm);

  // Synchronous Stack Listener configurations mapping hardware button responses
  useEffect(() => {
    if (actionMode || drawerOpen || addCollaboratorDrawerOpen || addLabelDrawerOpen || detailsDrawerOpen || deleteDialogOpen) {
      window.history.pushState({ overlayActive: true }, "");
    }
  }, [actionMode, drawerOpen, addCollaboratorDrawerOpen, addLabelDrawerOpen, detailsDrawerOpen, deleteDialogOpen]);

  useEffect(() => {
    const handleHardwareBackTrigger = () => {
      if (actionMode) { setActionMode(false); return; }
      if (drawerOpen) { setDrawerOpen(false); return; }
      if (addCollaboratorDrawerOpen) { setAddCollaboratorDrawerOpen(false); return; }
      if (addLabelDrawerOpen) { setAddLabelDrawerOpen(false); return; }
      if (detailsDrawerOpen) { setDetailsDrawerOpen(false); return; }
      if (deleteDialogOpen) { setDeleteDialogOpen(false); return; }
    };
    window.addEventListener("popstate", handleHardwareBackTrigger);
    return () => window.removeEventListener("popstate", handleHardwareBackTrigger);
  }, [actionMode, drawerOpen, addCollaboratorDrawerOpen, addLabelDrawerOpen, detailsDrawerOpen, deleteDialogOpen]);

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
    if (editDrawerOpen && selectedNote) {
      setCollaborators(selectedNote.sharedWith || []); setNoteLabels(selectedNote.labels || []);
    } else if (drawerOpen) {
      setCollaborators([]); setNoteLabels([]);
    }
  }, [editDrawerOpen, drawerOpen, selectedNote]);

  const handleAddCollaboratorFromDrawer = useCallback(async () => {
    if (!newCollaboratorUsername.trim() || !selectedNote?.id) return;
    try {
      const q = query(collection(db, "users"), where("username", "==", newCollaboratorUsername.trim()));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const shareUid = snapshot.docs[0].id;
        if (shareUid === user.uid) { setError("You cannot share with yourself."); return; }
        await updateDoc(doc(db, "notes", selectedNote.id), { sharedWith: arrayUnion(shareUid), owners: arrayUnion(user.uid, shareUid) });
        setCollaborators(prev => [...prev, shareUid]); setNewCollaboratorUsername(""); setAddCollaboratorDrawerOpen(false);
      } else { setError("User not found."); }
    } catch (e) {}
  }, [newCollaboratorUsername, selectedNote, user]);

  const handleAddCustomLabel = useCallback(() => {
    if (!newLabel.trim()) return;
    setNoteLabels(prev => [...prev, newLabel.trim()]); setNewLabel(""); setAddLabelDrawerOpen(false);
  }, [newLabel]);

  const handlePinNote = useCallback(async (note) => {
    if (!note) return;
    await updateDoc(doc(db, "notes", note.id), { pinned: !note.pinned });
    setSelectedNote(prev => prev?.id === note.id ? { ...prev, pinned: !note.pinned } : prev);
  }, []);

  const handleAddNote = useCallback(async () => {
    if (!noteTitle.trim() && !noteContent.trim()) return;
    setSaving(true); isManuallySavedRef.current = true;
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

  const handleToggleLabelMemo = useCallback((label) => {
    setNoteLabels(prev => prev.includes(label) ? prev.filter(l => l !== label) : [...prev, label]);
  }, []);

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

  const applyFormat = useCallback((format) => {
    const textarea = noteContentRef.current; if (!textarea) return;
    const start = textarea.selectionStart || 0; const end = textarea.selectionEnd || 0;
    const formatted = `**${noteContent.slice(start, end)}**`;
    setNoteContent(noteContent.slice(0, start) + formatted + noteContent.slice(end));
  }, [noteContent]);

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
                <Box onClick={() => setActionMode(false)} sx={{ position: "fixed", inset: 0, zIndex: 1300, backdropFilter: "blur(10px) saturate(140%)", WebkitBackdropFilter: "blur(10px) saturate(140%)", background: "rgba(0, 0, 0, 0.4)" }} />
                <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }} style={{ position: "fixed", bottom: 20, width: "calc(100% - 32px)", maxWidth: "540px", mx: "auto", zIndex: 1301 }}>
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1.5, p: "8px 16px", width: "100%", boxSizing: "border-box", "& .MuiButton-root": { textTransform: "none", fontWeight: 600, minWidth: 44, height: 38, px: 1.5, color: mode === "dark" ? "rgba(255, 255, 255, 0.8)" : "rgba(0, 0, 0, 0.7)"} }}>
<Stack 
  direction="row" 
  spacing={1} 
  sx={{ 
    width: "100%", 
    alignItems: "center", 
    justifyContent: "space-between",
    "&::-webkit-scrollbar": { display: "none" }, 
    scrollbarWidth: "none" 
  }}
>
    <Tooltip title="Share" TransitionComponent={Zoom} arrow>
      <IconButton 
        onClick={() => setAddCollaboratorDrawerOpen(true)}
        sx={{ color: 'text.secondary', '&:hover': { color: 'success.main', bgcolor: 'success.lighter' },
        backdropFilter: "blur(25px)", 
        background: mode === "dark" ? "rgba(25, 25, 25, 0.75)" : "rgba(255, 255, 255, 0.8)", 
        padding: 1.8, borderRadius: 8,
              boxShadow: theme.palette.mode === "dark"
                ? `
                  inset 0 1px 2px rgba(255, 255, 255, 0.11),
                  inset 0 -1px 1px rgba(35, 35, 35, 0.07)
                `
                : `
                  inset 0 1px 1px rgba(255,255,255,0.8),
                  inset 0 -1px 1px rgba(0,0,0,0.1)
                `,
      }}
      >
        <ShareIcon fontSize="small" />
      </IconButton>
    </Tooltip>

  {/* Left/Main Action Group */}
  <Stack direction="row" spacing={0.5} 
  sx={{
            backdropFilter: "blur(25px)", 
        background: mode === "dark" ? "rgba(25, 25, 25, 0.75)" : "rgba(255, 255, 255, 0.8)", 
        padding: 1, borderRadius: 8,
              boxShadow: theme.palette.mode === "dark"
                ? `
                  inset 0 1px 2px rgba(255, 255, 255, 0.11),
                  inset 0 -1px 1px rgba(35, 35, 35, 0.07)
                `
                : `
                  inset 0 1px 1px rgba(255,255,255,0.8),
                  inset 0 -1px 1px rgba(0,0,0,0.1)
                `,
  }}>

    <Tooltip title="Labels" TransitionComponent={Zoom} arrow>
      <IconButton 
        onClick={() => setAddLabelDrawerOpen(true)}
        sx={{ color: 'text.secondary', '&:hover': { color: 'secondary.main', bgcolor: 'secondary.lighter' } }}
      >
        <LabelIcon fontSize="small" />
      </IconButton>
    </Tooltip>

    <Tooltip title="Edit Note" TransitionComponent={Zoom} arrow>
      <IconButton 
        onClick={() => { setNoteTitle(selectedNote.title || ""); setNoteContent(selectedNote.content || ""); setEditDrawerOpen(true); setDrawerOpen(true); setActionMode(false); }}
        sx={{ color: 'text.secondary', '&:hover': { color: 'primary.main', bgcolor: 'primary.lighter' } }}
      >
        <EditIcon fontSize="small" />
      </IconButton>
    </Tooltip>


    <Tooltip title="Pin Note" TransitionComponent={Zoom} arrow>
      <IconButton 
        onClick={() => { handlePinNote(selectedNote); setActionMode(false); }}
        sx={{ color: 'text.secondary', '&:hover': { color: 'info.main', bgcolor: 'info.lighter' } }}
      >
        <PushPinIcon fontSize="small" />
      </IconButton>
    </Tooltip>

  {/* Dangerous Action Group (Destructive) */}
  <Tooltip title="Delete Note" TransitionComponent={Zoom} arrow>
    <IconButton 
      color="error" 
      onClick={() => { setNoteToDelete(selectedNote); setDeleteDialogOpen(true); }} 
      sx={{ 
        transition: 'all 0.2s ease-in-out',
        '&:hover': { 
          bgcolor: 'error.lighter',
          transform: 'scale(1.05)'
        } 
      }} 
    >
      <DeleteOutlineIcon fontSize="small" />
    </IconButton>
  </Tooltip>
  </Stack>

    <Tooltip title="Info" TransitionComponent={Zoom} arrow>
      <IconButton 
        onClick={() => setDetailsDrawerOpen(true)}
        sx={{ color: 'text.secondary', '&:hover': { color: 'action.active' },
              backdropFilter: "blur(25px)", 
        background: mode === "dark" ? "rgba(25, 25, 25, 0.75)" : "rgba(255, 255, 255, 0.8)", 
        padding: 1.8, borderRadius: 8,
              boxShadow: theme.palette.mode === "dark"
                ? `
                  inset 0 1px 2px rgba(255, 255, 255, 0.11),
                  inset 0 -1px 1px rgba(35, 35, 35, 0.07)
                `
                : `
                  inset 0 1px 1px rgba(255,255,255,0.8),
                  inset 0 -1px 1px rgba(0,0,0,0.1)
                `, }}
      >
        <InfoOutlinedIcon fontSize="small" />
      </IconButton>
    </Tooltip>

</Stack>
                  </Box>
                </motion.div>

                {/* Highly Configured typography preview modal panel slots overlaying backgrounds */}
                <motion.div initial={{ scale: 0.95, opacity: 0, y: 10 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 10 }} style={{ position: "fixed", mx: "auto", zIndex: 1301, width: "calc(100% - 32px)", maxWidth: "540px", maxHeight: "65vh", display: "flex", flexDirection: "column" }}>
                  <Box sx={{ borderRadius: 6, p: 3, display: "flex", flexDirection: "column", overflow: "hidden", background: mode === "dark" ? "rgba(28, 28, 28, 0.85)" : "rgba(255, 255, 255, 0.9)", border: "1px solid rgba(255,255,255,0.15)", boxShadow: "0 24px 64px rgba(0,0,0,0.75)" }}>
                    <Typography variant="h5" fontWeight={700} sx={{ mb: 2, pb: 1.5, borderBottom: "1px solid rgba(255,255,255,0.08)" }}>{selectedNote.title || "Untitled"}</Typography>
                    <Box sx={{ flex: 1, overflowY: "auto", pr: 1, WebkitOverflowScrolling: "touch" }}>
                      <ReactMarkdown components={{
                        p: ({ children }) => <Typography variant="body1" sx={{ mb: 2, fontSize: "0.95rem", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{children}</Typography>,
                        h1: ({ children }) => <Typography variant="h4" sx={{ mb: 2, fontWeight: 800 }}>{children}</Typography>,
                        code: ({ children }) => <Box component="code" sx={{ bgcolor: "rgba(255,255,255,0.08)", px: 0.6, py: 0.2, borderRadius: 1.5, fontFamily: 'monospace' }}>{children}</Box>,
                      }}>{selectedNote.content || '*No Content*'}</ReactMarkdown>
                    </Box>
                  </Box>
                </motion.div>
              </>
            )}
          </AnimatePresence>

<Box 
  sx={{ 
    position: "sticky", 
    top: 0, 
    zIndex: 10, // Increased zIndex slightly to make sure parent stays above scrolling list
    pb: 3,
    px: 0,
    pt: 5.5,
    backgroundColor: "transparent", 
  }}
>

  <Box px={1}>
  {/* 1. Search Bar */}
<TextField
  size="small"
  placeholder="Search notes..."
  variant="outlined"
  value={searchDisplayValue}
  onChange={handleSearchChange}
  InputProps={{
    startAdornment: (
      <SearchIcon 
        sx={{ 
          color: mode === "dark" ? "rgba(255, 255, 255, 0.5)" : "rgba(0, 0, 0, 0.4)", 
          mr: 1,
          fontSize: "1.25rem"
        }} 
      />
    ),
  }}
  sx={{
    width: "100%",
    mb: 2,
    
    // Style the inner container wrapper
    "& .MuiOutlinedInput-root": {
      color: mode === "dark" ? "#fff" : "#111",
      borderRadius: 3, // Premium rounded capsule
      backdropFilter: "blur(10px)",
      WebkitBackdropFilter: "blur(10px)",
      
      // Translucent backgrounds so the backdrop blur actually has something to blend with
      backgroundColor: mode === "dark" ? "rgba(255, 255, 255, 0)" : "rgba(0, 0, 0, 0.03)",
      
      // Sleek composite shadows (incorporating your inner lighting details)
      boxShadow: mode === "dark"
                            ? `inset 0 1px 2px rgba(255, 255, 255, 0.11), inset 0 -1px 1px rgba(35, 35, 35, 0.07)`
                            : `inset 0 1px 1px rgba(255,255,255,0.8), inset 0 -1px 1px rgba(0,0,0,0.1)`,
      
      // Thin glass perimeter border line
      border: "0.1px solid",
      borderColor: mode === "dark" ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.06)",
      transition: "all 0.2s ease-in-out",

      // Completely strip the default Material fieldset border lines
      "& fieldset": { border: "none" },

      "&:hover": {
        backgroundColor: mode === "dark" ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.05)",
        borderColor: mode === "dark" ? "rgba(255, 255, 255, 0.18)" : "rgba(0, 0, 0, 0.12)",
      },
      
      "&.Mui-focused": {
        backgroundColor: mode === "dark" ? "rgba(255, 255, 255, 0.04)" : "rgba(255, 255, 255, 0.8)",
        borderColor: mode === "dark" ? "rgba(255, 255, 255, 0)" : "primary.main",
        boxShadow: mode === "dark"
          ? `0 0 0 3px rgba(255, 255, 255, 0.05)`
          : `0 0 0 3px rgba(25, 118, 210, 0.15)`, // Light glowing halo on focus
      },
    },

    // Style the placeholder and input text specifically
    "& .MuiOutlinedInput-input": {
      py: 1.2,
      fontSize: "0.9rem",
      color: mode === "dark" ? "rgba(255, 255, 255, 0.9)" : "rgba(0, 0, 0, 0.85)",
      "&::placeholder": {
        color: mode === "dark" ? "rgba(255, 255, 255, 0.4)" : "rgba(0, 0, 0, 0.4)",
        opacity: 1,
      },
    },
  }}
/>

  {/* 2. Sorting & View Modes */}
<Box display="flex" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
  {/* 1. Styled Sort Dropdown */}
  <TextField
    select
    label="Sort by"
    value={sortOption}
    onChange={(e) => setSortOption(e.target.value)}
    size="small"
    sx={{ 
      minWidth: 150,
      "& .MuiInputLabel-root": {
        color: mode === "dark" ? "rgba(255, 255, 255, 0.6)" : "rgba(0, 0, 0, 0.6)",
      },
      "& .MuiInputLabel-root.Mui-focused": {
        color: mode === "dark" ? "#fff" : "primary.main",
      }
    }}
    InputLabelProps={{ shrink: true }}
    InputProps={{
      sx: {
        color: mode === "dark" ? "#fff" : "#111",
        borderRadius: 2.5,
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        backgroundColor: mode === "dark" ? "rgba(255, 255, 255, 0)" : "rgba(0, 0, 0, 0.03)",
        boxShadow: mode === "dark"
          ? `inset 0 1px 2px rgba(255, 255, 255, 0.11), inset 0 -1px 1px rgba(35, 35, 35, 0.07)`
          : `inset 0 1px 1px rgba(255,255,255,0.8), inset 0 -1px 1px rgba(0,0,0,0.05)`,
        
        "&:hover": {
          backgroundColor: mode === "dark" ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.06)",
        },
        "&.Mui-focused": {
          backgroundColor: mode === "dark" ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.04)",
        },
        "& fieldset": { border: "none" }, 
      }
    }}
    SelectProps={{
      MenuProps: {
        PaperProps: {
          sx: {
            mt: 1,
            px: 0.6,
            borderRadius: 4,
            backdropFilter: "blur(15px)",
            WebkitBackdropFilter: "blur(15px)",
            backgroundColor: mode === "dark" ? "rgba(20, 20, 20, 0)" : "rgba(255, 255, 255, 0.75)",
            backgroundImage: "none",
            boxShadow: mode === "dark"
              ? `inset 0 1px 1px rgba(255, 255, 255, 0.15), 0 8px 32px rgba(0, 0, 0, 0.4)`
              : `inset 0 1px 1px rgba(255,255,255,0.8), 0 8px 32px rgba(31, 38, 135, 0.05)`,
            border: "0px solid",
            borderColor: mode === "dark" ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.05)",
            
            "& .MuiMenuItem-root": {
              fontSize: "0.875rem",
              mx: 0.5,
              my: 0.3,
              borderRadius: 2,
              color: mode === "dark" ? "rgba(255, 255, 255, 0.8)" : "rgba(0, 0, 0, 0.8)",
              "&:hover": {
                backgroundColor: mode === "dark" ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.04)",
              },
              "&.Mui-selected": {
                backgroundColor: mode === "dark" ? "rgba(255, 255, 255, 0.16)" : "rgba(0, 0, 0, 0.08)",
                fontWeight: 600,
                color: mode === "dark" ? "#fff" : "#000",
                "&:hover": {
                  backgroundColor: mode === "dark" ? "rgba(255, 255, 255, 0.22)" : "rgba(0, 0, 0, 0.12)",
                }
              }
            }
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

  {/* 2. Glassmorphic ToggleButtonGroup Component */}
  <ToggleButtonGroup
    value={viewMode}
    exclusive
    onChange={(e, next) => next && setViewMode(next)}
    size="small"
    sx={{ 
      borderRadius: 2.5, // Matches the textfield radius
      backdropFilter: "blur(10px)",
      WebkitBackdropFilter: "blur(10px)",
      backgroundColor: mode === "dark" ? "rgba(255, 255, 255, 0)" : "rgba(0, 0, 0, 0.03)",
      boxShadow: mode === "dark"
        ? `inset 0 1px 2px rgba(255, 255, 255, 0.11), inset 0 -1px 1px rgba(35, 35, 35, 0.07)`
        : `inset 0 1px 1px rgba(255,255,255,0.8), inset 0 -1px 1px rgba(0,0,0,0.05)`,
      p: "3px", // Creates a capsule frame look around the nested inner elements
      border: "none",

      // Target individual buttons inside the group wrapper
      "& .MuiToggleButton-root": {
        border: "none",
        borderRadius: 2, // Smooth interior geometry
        mx: "1px",
        px: 1.5,
        py: 0.5,
        transition: "all 0.2s ease",
        color: mode === "dark" ? "rgba(255, 255, 255, 0.4)" : "rgba(0, 0, 0, 0.4)",

        "&:hover": {
          backgroundColor: mode === "dark" ? "rgba(255, 255, 255, 0.06)" : "rgba(0, 0, 0, 0.04)",
          color: mode === "dark" ? "rgba(255, 255, 255, 0.8)" : "rgba(0, 0, 0, 0.8)",
        },

        // Style for the currently active/selected tab 
        "&.Mui-selected": {
          backgroundColor: mode === "dark" ? "rgba(255, 255, 255, 0.15)" : "rgba(255, 255, 255, 0.9)",
          color: mode === "dark" ? "#ffffff" : "#000000",
          boxShadow: "none",
          "&:hover": {
            backgroundColor: mode === "dark" ? "rgba(255, 255, 255, 0.18)" : "rgba(255, 255, 255, 1)",
          }
        }
      }
    }}
  >
    <ToggleButton value="list">
      <ViewListIcon sx={{ color: "inherit", fontSize: "1.15rem" }} />
    </ToggleButton>
    <ToggleButton value="grid">
      <ViewModuleIcon sx={{ color: "inherit", fontSize: "1.15rem" }} />
    </ToggleButton>
  </ToggleButtonGroup>
</Box>

  {/* 3. Filter Chips */}
<Stack direction="row" spacing={1} sx={{ ...OVERFLOW_SX, mb: 1, pb: 0.5 }}>
  {["All", "Pinned", "Shared", ...labels].map((label) => {
    const isSelected = selectedLabelFilter === label;
    
    return (
      <Chip
        key={label}
        label={label === "Pinned" ? "📌 Pinned" : label}
        clickable
        onClick={() => setSelectedLabelFilter(label)}
        sx={{
          borderRadius: 4, // Uniform corner rounding with the rest of your inputs
          fontSize: "0.85rem",
          fontWeight: isSelected ? 600 : 500,
          px: 0.5,
          transition: "all 0.2s ease-in-out",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
          border: "1px solid",
          
          // Dynamic styling based on Selected vs. Unselected & Dark vs. Light mode
          ...(isSelected ? {
            // Selected State Glass (Stands out crisply)
            backgroundColor: mode === "dark" ? "rgba(255, 255, 255, 0.9)" : "rgba(0, 0, 0, 0.85)",
            color: mode === "dark" ? "#000" : "#fff",
            borderColor: "transparent",
            boxShadow: mode === "dark" 
              ? "0 4px 12px rgba(255, 255, 255, 0.1)" 
              : "0 4px 12px rgba(0, 0, 0, 0.15)",
            "&:hover": {
              backgroundColor: mode === "dark" ? "#ffffff" : "#000000",
            }
          } : {
            // Unselected State Glass (Subtle, matches your TextFields)
            backgroundColor: mode === "dark" ? "rgba(255, 255, 255, 0)" : "rgba(0, 0, 0, 0.03)",
            color: mode === "dark" ? "rgba(255, 255, 255, 0.7)" : "rgba(0, 0, 0, 0.65)",
            borderColor: mode === "dark" ? "rgba(255, 255, 255, 0.06)" : "rgba(0, 0, 0, 0.05)",
            boxShadow: mode === "dark"
              ? `inset 0 1px 1px rgba(255, 255, 255, 0.08)`
              : `inset 0 1px 1px rgba(255, 255, 255, 0.6)`,
            "&:hover": {
              backgroundColor: mode === "dark" ? "rgba(255, 255, 255, 0.09)" : "rgba(0, 0, 0, 0.06)",
              borderColor: mode === "dark" ? "rgba(255, 255, 255, 0.15)" : "rgba(0, 0, 0, 0.12)",
              color: mode === "dark" ? "#fff" : "#000",
            }
          })
        }}
      />
    );
  })}
</Stack>
</Box>
  {/* 4. Progressive Blur Overlay (Positioned right below all elements) */}
<Box
  sx={{
    position: "absolute",
    top: -5,
    left: 0,
    right: 0,
    height: 250,
    zIndex: -1,
    mx: -2,
    pointerEvents: "none",

    /* Glass blur */
    backdropFilter: "blur(80px)",
    WebkitBackdropFilter: "blur(80px)",

    /* Premium gradient fade */
    maskImage: `
      linear-gradient(
        to bottom,
        rgba(0,0,0,1) 0%,
        rgba(0,0,0,0.92) 18%,
        rgba(0,0,0,0.72) 38%,
        rgba(0,0,0,0.42) 62%,
        rgba(0,0,0,0.12) 82%,
        rgba(0,0,0,0) 100%
      )
    `,
    WebkitMaskImage: `
      linear-gradient(
        to bottom,
        rgba(0,0,0,1) 0%,
        rgba(0,0,0,0.92) 18%,
        rgba(0,0,0,0.72) 38%,
        rgba(0,0,0,0.42) 62%,
        rgba(0,0,0,0.12) 82%,
        rgba(0,0,0,0) 100%
      )
    `,

    background:
      mode === "dark"
        ? `
          linear-gradient(
            to bottom,
            rgba(0,0,0,0),
            rgba(0,0,0,0)
          )
        `
        : `
          linear-gradient(
            to bottom,
            rgba(255,255,255,0),
            rgba(255,255,255,0)
          )
        `,
  }}
/>
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

          {/* New/Edit Core Fields Form Sheets */}
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

          {/* Add Collaborator Drawer */}
          <SwipeableDrawer anchor="bottom" open={addCollaboratorDrawerOpen} onClose={() => setAddCollaboratorDrawerOpen(false)} onOpen={() => {}} PaperProps={{ sx: { p: 3, maxWidth: 400, mx: "auto" } }}>
            <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>Add Collaborator</Typography>
            <Stack spacing={2}>
              <TextField label="Username" value={newCollaboratorUsername} onChange={e => setNewCollaboratorUsername(e.target.value)} fullWidth />
              <Button variant="contained" onClick={handleAddCollaboratorFromDrawer} fullWidth>Add</Button>
            </Stack>
          </SwipeableDrawer>

          {/* Add Label Drawer */}
          <SwipeableDrawer anchor="bottom" open={addLabelDrawerOpen} onClose={() => setAddLabelDrawerOpen(false)} onOpen={() => {}} PaperProps={{ sx: { p: 3, maxWidth: 400, mx: "auto" } }}>
            <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>Add Custom Label</Typography>
            <Stack spacing={2}>
              <TextField label="Label Name" value={newLabel} onChange={e => setNewLabel(e.target.value)} fullWidth />
              <Button variant="contained" onClick={handleAddCustomLabel} fullWidth>Add</Button>
            </Stack>
          </SwipeableDrawer>

          {/* Note Details Drawer */}
          <SwipeableDrawer
            anchor="bottom"
            open={detailsDrawerOpen}
            onClose={() => setDetailsDrawerOpen(false)}
            onOpen={() => {}}
            disableSwipeToOpen={true}
            disableDiscovery={true}
            transitionDuration={{ enter: 200, exit: 150 }}
            fullWidth
            maxWidth="sm"
            variant="temporary"
            ModalProps={{ keepMounted: true }}
            // 1. FORCE THE DRAWER LAYER ABOVE THE ACTION MODE OVERLAY
            sx={{ zIndex: 1400 }} 
            PaperProps={{
              sx: {
                borderRadius: 6,
                backgroundColor: mode === "dark" ? "rgba(20, 20, 20, 0.85)" : "rgba(255, 255, 255, 0.85)",
                backgroundImage: "none",
                p: 3,
                height: "50vh",
                mx: "auto",
                m: 2.5,
                backdropFilter: "blur(25px)", 
                WebkitBackdropFilter: "blur(25px)",
                boxShadow: theme.palette.mode === "dark"
                  ? `
                    inset 0 1px 2px rgba(255, 255, 255, 0.11),
                    inset 0 -1px 1px rgba(35, 35, 35, 0.07),
                    0 12px 40px rgba(0,0,0,0.5)
                  `
                  : `
                    inset 0 1px 1px rgba(255,255,255,0.8),
                    inset 0 -1px 1px rgba(0,0,0,0.1),
                    0 12px 40px rgba(0,0,0,0.15)
                  `,
              },
            }}
          >
            <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
              Note Details
            </Typography>
            <Stack spacing={2}>
              <Box>
                <Typography variant="subtitle2" sx={{ color: theme.palette.text.secondary }}>Title:</Typography>
                <Typography variant="h5" sx={{ fontSize: "2rem" }}>{selectedNote?.title || "Untitled"}</Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" sx={{ color: theme.palette.text.secondary }}>Labels:</Typography>
                <Stack direction="row" spacing={1}>
                  {(selectedNote?.labels || []).map(label => (
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
                <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                  {(selectedNote?.sharedWith || []).map(uid => {
                    const u = sharedUsersInfo[uid];
                    return (
                      <Box key={uid} sx={{ display: "flex", alignItems: "center", gap: 1, background: mode === "dark" ? "#171717" : "#acacac7e", borderRadius: 8, px: 0.5, py: 0.5 }}>
                        <Avatar
                          src={u?.photoURL || ""}
                          alt={u?.username || "User"}
                          sx={{ width: 24, height: 24, fontSize: 14, bgcolor: theme.palette.primary.bg, color: "#000" }}
                        >
                          {u?.username ? u.username[0].toUpperCase() : "U"}
                        </Avatar>
                        <Typography variant="body2" sx={{ color: theme.palette.text.primary, fontSize: 14, marginRight: 1 }}>
                          {u?.username || uid.slice(0, 6) + "..."}
                        </Typography>
                      </Box>
                    );
                  })}
                </Stack>
              </Box>
              <Box>
                <Typography variant="subtitle2" sx={{ color: theme.palette.text.secondary }}>Created At:</Typography>
                <Typography variant="body2">
                  {selectedNote?.createdAt?.toDate
                    ? selectedNote.createdAt.toDate().toLocaleString()
                    : selectedNote?.createdAt 
                      ? new Date(selectedNote.createdAt).toLocaleString()
                      : "N/A"}
                </Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" sx={{ color: theme.palette.text.secondary }}>Created By:</Typography>
                <Stack direction="row" spacing={1}>
                  {selectedNote?.owners && selectedNote.owners.length > 0 && (
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
                <Typography variant="body2">{selectedNote?.id || "N/A"}</Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" sx={{ color: theme.palette.text.secondary }}>Pinned:</Typography>
                <Typography variant="body2">{selectedNote?.pinned ? "Yes" : "No"}</Typography>
              </Box>
            </Stack>
          </SwipeableDrawer>

          {/* Delete Dialog Prompt validation card */}
          <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
            <DialogTitle>Delete Note</DialogTitle>
            <DialogContent><Typography>Are you sure you want to delete this note?</Typography></DialogContent>
            <DialogActions><Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button><Button onClick={async () => { await handleDeleteNote(noteToDelete.id); setDeleteDialogOpen(false); setActionMode(false); }} color="error">Delete</Button></DialogActions>
          </Dialog>

          <FloatingNewNotes mode={mode} onOpen={() => { setNoteTitle(""); setNoteContent(""); setNoteLabels([]); setCollaborators([]); setSelectedNote(null); setEditDrawerOpen(false); setDrawerOpen(true); }} />
        </Box>
      </BetaAccessGuard>
    </ThemeProvider>
  );
};

// ─── MODULAR DEDICATED INDEPENDENT NOTES VIEW PAGE SUB-ROUTE ─────────────────
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