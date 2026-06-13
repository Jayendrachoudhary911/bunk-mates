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
import { Search } from "@mui/icons-material";
import { motion, AnimatePresence } from "framer-motion";
import {
  FilePlus,
  NotebookPen,
  SquarePen,
  PenSquare,
  StickyNote,
  FileText,
  ClipboardPen,
} from "lucide-react";
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

const WEATHER_STORAGE_KEY = "bunkmate_weather";

// Memoized constants to prevent recreation
const EMPTY_ARRAY = [];
const EMPTY_OBJECT = {};

const glass = (mode) => ({
  background:
    mode === "dark"
      ? "rgba(30, 30, 30, 0.4)"
      : "rgba(255, 255, 255, 0.4)",
  backdropFilter: "blur(22px)",
  border: "none",
  boxShadow: mode === "dark"
                            ? `inset 0 1px 2px rgba(255, 255, 255, 0.11), inset 0 -1px 1px rgba(35, 35, 35, 0.07)`
                            : `inset 0 1px 1px rgba(255,255,255,0.8), inset 0 -1px 1px rgba(0,0,0,0.1)`,
});

// Reduced animation complexity for low-end devices
const cardHover = {
  transition: "transform .2s ease", // Simplified and slowed transition
  "&:hover": {
    transform: "translateY(-1px)", // Reduced lift distance
    boxShadow: "0 4px 12px rgba(0,0,0,0.1)", // Simpler shadow
  },
};
// ─── Static sx objects: module-level constants, never recreated ────────────
const CARD_CONTENT_SX = { pb: 1.5 };
const OVERFLOW_SX = { overflowX: "auto", mb: 2 };
const TRANSPARENT_CONTENT_SX = { mb: 2, backgroundColor: "transparent", height: "auto" };
const CARD_STATIC_SX = { mb: 8, padding: 0, backgroundColor: "transparent" };

const GlassActionToolbar = ({
  mode,
  isPinned,
  onEdit,
  onShare,
  onPin,
  onInfo,
  onDelete,
}) => {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "8px 16px",
        width: 260,
        mx: "auto",
        
        // Pinned to the floor of its relative parent container
        position: "absolute",
        bottom: 16,
        left: 24,
        right: 24,
        zIndex: 1000,
        borderRadius: 8,

        // Premium Glass Blur mechanics
        backdropFilter: "blur(25px) saturate(180%)",
        WebkitBackdropFilter: "blur(25px) saturate(180%)",

        backgroundColor:
          mode === "dark" ? "#1d1d1d" : "rgba(255, 255, 255, 0.75)",

                          boxShadow: mode === "dark"
                            ? `inset 0 1px 2px rgba(255, 255, 255, 0.11), inset 0 -1px 1px rgba(35, 35, 35, 0.07)`
                            : `inset 0 1px 1px rgba(255,255,255,0.8), inset 0 -1px 1px rgba(0,0,0,0.1)`,

        border: "1px solid",
        borderColor: mode === "dark" ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.05)",

        "& .MuiIconButton-root": {
          borderRadius: 2.5,
          padding: 1.2,
          transition: "all 0.2s ease",
          color: mode === "dark" ? "rgba(255, 255, 255, 0.8)" : "rgba(0, 0, 0, 0.7)",

          "&:hover": {
            backgroundColor: mode === "dark" ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.05)",
            color: mode === "dark" ? "#fff" : "#000",
          },
        },
      }}
    >
      <Tooltip title="Edit">
        <IconButton onClick={onEdit}>
          <EditIcon sx={{ fontSize: "1.25rem" }} />
        </IconButton>
      </Tooltip>

      <Tooltip title="Share">
        <IconButton onClick={onShare}>
          <ShareIcon sx={{ fontSize: "1.25rem" }} />
        </IconButton>
      </Tooltip>

      <Tooltip title={isPinned ? "Unpin" : "Pin to Top"}>
        <IconButton
          onClick={onPin}
          sx={{
            ...(isPinned && {
              color: mode === "dark" ? "#52ff74" : "#00aa25",
              backgroundColor: mode === "dark" ? "rgba(82, 255, 116, 0.15) !important" : "rgba(0, 170, 37, 0.08) !important",
              transform: "rotate(30deg) scale(1.05)",
              "&:hover": {
                transform: "rotate(30deg) scale(1.1)",
                backgroundColor: mode === "dark" ? "rgba(82, 255, 116, 0.25) !important" : "rgba(0, 170, 37, 0.12) !important",
              },
            }),
          }}
        >
          <PushPinIcon sx={{ fontSize: "1.25rem" }} />
        </IconButton>
      </Tooltip>

      <Tooltip title="Note Details">
        <IconButton onClick={onInfo}>
          <InfoOutlinedIcon sx={{ fontSize: "1.25rem" }} />
        </IconButton>
      </Tooltip>

      <Tooltip title="Delete Note">
        <IconButton
          onClick={onDelete}
          sx={{
            color: mode === "dark" ? "#ff6b6b" : "#e03131",
            "&:hover": {
              backgroundColor: mode === "dark" ? "rgba(255, 107, 107, 0.15) !important" : "rgba(224, 49, 49, 0.08) !important",
              color: mode === "dark" ? "#ff8787" : "#c92a2a",
            },
          }}
        >
          <DeleteOutlineIcon sx={{ fontSize: "1.25rem" }} />
        </IconButton>
      </Tooltip>
    </Box>
  );
};

const FloatingNewNotes = ({ 
  mode, 
  setNoteTitle, 
  setNoteContent, 
  titleInputRef, 
  contentInputRef, 
  setNoteLabels, 
  setCollaborators, 
  setSelectedNote, 
  setEditDrawerOpen, 
  setDrawerOpen 
}) => {
  const [expanded, setExpanded] = useState(true);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const isScrolled = window.scrollY > 20;
          setScrolled((prev) => (prev !== isScrolled ? isScrolled : prev));
          if (isScrolled) {
            setExpanded(false);
          }
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
    <Box
      sx={{
        position: "fixed",
        bottom: 85,
        right: 41,
        zIndex: 1100,
        pointerEvents: "none",
      }}
    >
      <Button
        onClick={() => {
          // Reset everything so the drawer always opens as a fresh new note
          if (setNoteTitle) setNoteTitle("");
          if (setNoteContent) setNoteContent("");
          if (titleInputRef) titleInputRef.current = "";
          if (contentInputRef) contentInputRef.current = "";
          if (setNoteLabels) setNoteLabels([]);
          if (setCollaborators) setCollaborators([]);
          if (setSelectedNote) setSelectedNote(null);
          if (setEditDrawerOpen) setEditDrawerOpen(false);
          if (setDrawerOpen) setDrawerOpen(true);
        }}
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

          // 🔥 LIQUID GLASS BASE
          backdropFilter: "blur(2px) saturate(2)",
          WebkitBackdropFilter: "blur(2px) saturate(2)",

          background:
            mode === "dark"
              ? "rgba(0, 0, 0, 0.65)"
              : "rgba(255, 255, 255, 0.25)",

          color: mode === "dark" ? "#fff" : "#000",

          // 🔥 DEPTH (liquid feel)
boxShadow: mode === "dark"
                            ? `inset 0 1px 2px rgba(255, 255, 255, 0.11), inset 0 -1px 1px rgba(35, 35, 35, 0.07)`
                            : `inset 0 1px 1px rgba(255,255,255,0.8), inset 0 -1px 1px rgba(0,0,0,0.1)`,

          "& .MuiButton-startIcon": {
            margin: expanded ? "0 8px 0 0" : 0,
            marginLeft: expanded ? 0 : "0px", // Centers the icon perfectly when circular
          },

          // 🔥 SHINE LAYER (liquid reflection)
          "&::before": {
            content: '""',
            position: "absolute",
            top: 0,
            left: "-75%",
            width: "50%",
            height: "100%",
            background:
              "linear-gradient(120deg, transparent, rgba(255, 255, 255, 0.17), transparent)",
            transform: "skewX(-20deg)",
            transition: "all 0.6s ease",
          },

          "&:hover::before": {
            left: "125%",
          },

          // 🔥 GLOW EDGE
          "&::after": {
            content: '""',
            position: "absolute",
            inset: 0,
            borderRadius: "inherit",
            background:
              "linear-gradient(to bottom right, rgba(255, 255, 255, 0.13), transparent)",
            opacity: 0.3,
            pointerEvents: "none",
          },

          "&:hover": {
            transform: "scale(1.05)",
          },
        }}
      >
        <AnimatePresence>
          {expanded && (
            <motion.span
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              exit={{ opacity: 0, width: 0 }}
              style={{
                whiteSpace: "nowrap",
                fontWeight: 300,
                overflow: "hidden",
              }}
            >
              New Note
            </motion.span>
          )}
        </AnimatePresence>
      </Button>
    </Box>
  );
};

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
// Memoize markdown components at module level to avoid recreation
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
  br: () => null, // Skip br tags in preview for lower overhead
});

const NoteCard = React.memo(({ note, onOpen, onMenu, mode, theme }) => {
  const mdComponents = React.useMemo(() => createMdComponents(mode), [mode]);

  // Limit content to 150 chars for low-end Android devices (faster markdown parse)
  const previewContent = note.content ? note.content.slice(0, 150) : "";

  return (
    <Card
      onClick={onOpen}
      sx={{
        ...glass(mode),
        ...cardHover,
        borderRadius: 6,
        cursor: "pointer",
        position: "relative",
        "&:hover": { transform: "translateY(-1px)" }, // Reduced hover lift for low-end devices
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
  const [pageSize] = useState(15); // Reduced from 30 for low-end Android
  const [allNotesLoaded, setAllNotesLoaded] = useState(false);
  const [hasMoreNotes, setHasMoreNotes] = useState(true);
  const observerRef = useRef(null); // Intersection observer for infinite scroll

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
      // Use requestIdleCallback for non-critical updates on low-end devices
      if (window.requestIdleCallback) {
        requestIdleCallback(() => setWeather(cachedWeather), { timeout: 2000 });
      } else {
        setTimeout(() => setWeather(cachedWeather), 100);
      }
    }
  }
}, []); // eslint-disable-line react-hooks/exhaustive-deps


// NOTE: Redundant localStorage read removed — sortOption, viewMode, selectedLabelFilter
// are already initialized from localStorage via lazy useState() on lines 117-119.

// Advanced: Batch localStorage writes with debouncing for low-end devices
const localStorageDebounceRef = useRef(null);
useEffect(() => {
  if (localStorageDebounceRef.current) clearTimeout(localStorageDebounceRef.current);
  localStorageDebounceRef.current = setTimeout(() => {
    try {
      localStorage.setItem("noteSortOption", sortOption);
      localStorage.setItem("noteViewMode", viewMode);
      localStorage.setItem("noteLabelFilter", selectedLabelFilter);
    } catch (e) {
      console.warn("localStorage write failed:", e);
    }
  }, 500); // 500ms debounce to batch rapid changes
  return () => clearTimeout(localStorageDebounceRef.current);
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
      setAllNotesLoaded(false); // Reset pagination state
      setHasMoreNotes(processed.length >= pageSize); // Check if more notes exist

      // Defer collaborator profile fetching to idle time on low-end devices
      if (uids.size > 0) {
        if (window.requestIdleCallback) {
          requestIdleCallback(() => fetchCollaboratorProfiles(Array.from(uids)), { timeout: 3000 });
        } else {
          fetchCollaboratorProfiles(Array.from(uids));
        }
      }
    }, 200); // Increased from 150ms to 200ms for low-end devices
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
    }, 800); // Increased from 500ms to 800ms for low-end devices
    
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
    }, 350); // Increased from 200ms to 350ms for low-end Android devices
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

// Advanced: Infinite scroll implementation for pagination
// Observes last note, triggers "load more" when visible
useEffect(() => {
  if (!hasMoreNotes || allNotesLoaded) return; // Stop if all notes loaded
  
  // Create intersection observer for last note
  if (window.IntersectionObserver && flatNotes.length > 0) {
    const lastNote = document.querySelector(`[data-note-id="${flatNotes[flatNotes.length - 1]?.id}"]`);
    if (!lastNote) return;
    
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !allNotesLoaded && hasMoreNotes) {
          // Load more notes by increasing pageSize or triggering new query
          // For now, this is a placeholder for future pagination implementation
          console.log("📍 Bottom reached - ready to load more notes");
        }
      },
      { rootMargin: "200px" }
    );
    
    observer.observe(lastNote);
    return () => observer.disconnect();
  }
}, [flatNotes, hasMoreNotes, allNotesLoaded]);


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
          px: 2,
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
              mb: 2,
              px: 1
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
    height: 450,
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
<Box sx={{ willChange: "contents" }}>
{viewMode === "list" ? (
  <Stack spacing={1.4} sx={{ perspective: "1000px" }}>
    {[...pinnedNotes, ...unpinnedNotes].map((note, idx) => (
      <div key={note.id} data-note-id={note.id} style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}>
        <NoteCard
          note={note}
          mode={mode}
          theme={theme}
          onOpen={() => openView(note)}
          onMenu={(e) => openMenu(e, idx)}
        />
      </div>
    ))}
  </Stack>
) : (
  <Box
    sx={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(240px,1fr))",
      gap: 1.5,
      perspective: "1000px",
    }}
  >
    {[...pinnedNotes, ...unpinnedNotes].map((note, idx) => (
      <div key={note.id} data-note-id={note.id} style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}>
        <NoteCard
          note={note}
          mode={mode}
          theme={theme}
          onOpen={() => openView(note)}
          onMenu={(e) => openMenu(e, idx)}
        />
      </div>
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
          transitionDuration={{ enter: 200, exit: 150 }}
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
          transitionDuration={{ enter: 200, exit: 150 }}
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
          transitionDuration={{ enter: 200, exit: 150 }}
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
  transitionDuration={{ enter: 200, exit: 150 }}
  PaperProps={{
    sx: {
      backgroundColor: mode === "dark" ? "rgba(10, 10, 10, 0.2)" : "rgba(245, 245, 245, 0.4)",
      backdropFilter: "blur(10px) saturate(190%)",
      WebkitBackdropFilter: "blur(10px) saturate(190%)",
      backgroundImage: "none",
      p: 3,
      pb: 0, 
      maxWidth: 480,
      height: "100vh",
      mx: "auto",
      
      // 🚨 CRITICAL FIXES FOR THE BLUR LAYER:
      display: "flex",
      flexDirection: "column",
      overflow: "visible !important", // Ensures the wrapper doesn't kill child filters
      borderRadius: "0px 0px 20px 20px", // Only round the top corners for a modern look
      boxShadow: "0 -8px 32px rgba(0, 0, 0, 0.15)",
    },
  }}
>
  {/* 1. Header Back Deck (Fixed, Not Scrollable) */}
    <Button
      onClick={() => setViewDrawerOpen(false)}
      sx={{
        position: "absolute",
        top: 85,
        left: 16,
        height: 36,
        borderRadius: 6,
        px: 2,
        backdropFilter: "blur(20px) saturate(200%)",
        WebkitBackdropFilter: "blur(20px) saturate(200%)",
        color: mode === "dark" ? "#fff" : "#000",
        zIndex: 10,
        backgroundColor: mode === "dark" ? "#1d1d1d" : "rgba(0, 0, 0, 0.04)",
        textTransform: "none",
        fontWeight: 600,
        gap: 0.5,
        border: "0px solid",
                                  boxShadow: mode === "dark"
                            ? `inset 0 1px 2px rgba(255, 255, 255, 0.11), inset 0 -1px 1px rgba(35, 35, 35, 0.07)`
                            : `inset 0 1px 1px rgba(255,255,255,0.8), inset 0 -1px 1px rgba(0,0,0,0.1)`,
        "&:hover": {
          backgroundColor: mode === "dark" ? "rgba(255, 255, 255, 0.12)" : "rgba(0, 0, 0, 0.08)",
        }
      }}
    >
      <ArrowBackIcon sx={{ fontSize: "1.1rem" }} /> 
      <Typography variant="body2" fontWeight={600}>Back</Typography>
    </Button>
  
  {/* 2. Isolated Scrolling Body Area */}
  {/* 🚨 This handles 100% of the scrolling so text drops directly behind the action bar */}
  <Box 
    sx={{ 
      flex: 1, 
      overflowY: "scroll", // Forces structural scrolling tracking
      overflowX: "hidden",
      pr: 0.5, 
      mb: 0,
      pt: 16,
      position: "relative",
      WebkitOverflowScrolling: "touch", // Smooth iOS scrolling inertial matching
    }}
  >
    {/* Title */}
    <Typography variant="h5" fontWeight="bold" sx={{ color: theme.palette.text.primary, paddingBottom: 1.5, mb: 2 }}>
      {selectedNote?.title || "Untitled Note"}
    </Typography>

    {/* Shared Collaborators Area */}
    {selectedNote?.sharedWith && selectedNote.sharedWith.length > 0 && (
      <Box sx={{ mb: 2 }}>
        <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
          {selectedNote.sharedWith.map((uid) => {
            const user = sharedUsersInfo[uid];
            return (
              <Box 
                key={uid} 
                sx={{ 
                  display: "flex", 
                  alignItems: "center", 
                  gap: 1, 
                  background: mode === "dark" ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.04)", 
                  borderRadius: 2.5, 
                  pl: 0.5, 
                  pr: 1.5, 
                  py: 0.5,
                  border: "1px solid",
                  borderColor: mode === "dark" ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)"
                }}
              >
                <Avatar
                  src={user?.photoURL || ""}
                  alt={user?.username || "User"}
                  sx={{ width: 22, height: 22, fontSize: 11, bgcolor: theme.palette.primary.main, color: "#fff" }}
                >
                  {user?.username ? user.username[0].toUpperCase() : "U"}
                </Avatar>
                <Typography variant="caption" sx={{ color: mode === "dark" ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.7)", fontWeight: 500 }}>
                  {user?.username || uid.slice(0, 6) + "..."}
                </Typography>
              </Box>
            );
          })}
        </Stack>
      </Box>
    )}

    {/* Labels Layout */}
    {selectedNote?.labels && selectedNote.labels.length > 0 && (
      <Box sx={{ width: "100%", mb: 3 }}>
        <Stack direction="row" display="flex" alignItems="center" spacing={1} useFlexGap flexWrap="wrap">
          {selectedNote.labels.map(label => (
            <Chip
              key={label}
              icon={<LabelIcon style={{ color: "inherit", fontSize: "0.9rem" }} />}
              label={label}
              size="small"
              sx={{
                fontSize: "0.75rem",
                fontWeight: 500,
                borderRadius: 2,
                color: mode === "dark" ? "rgba(255, 255, 255, 0.75)" : "rgba(0, 0, 0, 0.7)",
                background: mode === "dark" ? "rgba(255, 255, 255, 0.06)" : "rgba(0, 0, 0, 0.04)",
                border: "1px solid",
                borderColor: mode === "dark" ? "rgba(255, 255, 255, 0.04)" : "rgba(0, 0, 0, 0.02)",
              }}
            />
          ))}
        </Stack>
      </Box>
    )}

    {/* Markdown Content Field */}
    {/* 🚨 Note the generous padding at the bottom (pb: 10) - this forces text to be able to scroll completely past and behind the toolbar! */}
    <Box sx={{ pb: 12 }}>
      <ReactMarkdown
        components={{
          p: ({ children }) => <Typography variant="body1" sx={{ mb: 2, color: theme.palette.text.primary, whiteSpace: "pre-wrap", wordBreak: "break-word", lineHeight: 1.6 }}>{children}</Typography>,
          h1: ({ children }) => <Typography variant="h4" sx={{ mb: 1.5, fontWeight: 'bold', color: theme.palette.text.primary, whiteSpace: "pre-wrap" }}>{children}</Typography>,
          h2: ({ children }) => <Typography variant="h5" sx={{ mb: 1.5, fontWeight: 'bold', color: theme.palette.text.primary, whiteSpace: "pre-wrap" }}>{children}</Typography>,
          h3: ({ children }) => <Typography variant="h6" sx={{ mb: 1.5, fontWeight: 'bold', color: theme.palette.text.primary, whiteSpace: "pre-wrap" }}>{children}</Typography>,
          ul: ({ children }) => <Box component="ul" sx={{ pl: 3, mb: 2, color: theme.palette.text.primary, "& li": { whiteSpace: "pre-wrap", wordBreak: "break-word", mb: 0.5 } }}>{children}</Box>,
          ol: ({ children }) => <Box component="ol" sx={{ pl: 3, mb: 2, color: theme.palette.text.primary, "& li": { whiteSpace: "pre-wrap", wordBreak: "break-word", mb: 0.5 } }}>{children}</Box>,
          li: ({ children }) => <Typography component="li" sx={{ color: theme.palette.text.primary, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{children}</Typography>,
          code: ({ children }) => <Box component="code" sx={{ bgcolor: mode === "dark" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.04)", px: 0.8, py: 0.3, borderRadius: 1.5, fontSize: "0.9em", fontFamily: 'monospace', whiteSpace: "pre-wrap", wordBreak: "break-word", color: mode === "dark" ? "#ffb454" : "#d32f2f" }}>{children}</Box>,
          br: () => <br />,
          pre: ({ children }) => <Box component="pre" sx={{ bgcolor: mode === "dark" ? "rgba(0,0,0,0.2)" : "rgba(0,0,0,0.02)", p: 2, borderRadius: 2.5, overflow: 'auto', border: "1px solid", borderColor: mode === "dark" ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)", mb: 2, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{children}</Box>,
        }}
      >
        {selectedNote?.content || ''}
      </ReactMarkdown>
    </Box>
  </Box>

<GlassActionToolbar
    mode={mode}
    isPinned={selectedNote?.pinned}
    onEdit={() => {
      setNoteTitle(selectedNote.title || "");
      setNoteContent(selectedNote.content || "");
      setEditDrawerOpen(true);
      setDrawerOpen(true);
      setViewDrawerOpen(false);
    }}
    onShare={() => setAddCollaboratorDrawerOpen(true)}
    onPin={() => handlePinNote(selectedNote)}
    onInfo={() => setDetailsDrawerOpen(true)}
    onDelete={() => {
      setNoteToDelete(selectedNote);
      setDeleteDialogOpen(true);
    }}
  />
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
          transitionDuration={{ enter: 200, exit: 150 }}
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
        
<FloatingNewNotes 
  mode={mode} 
  onOpen={() => {
    // Your existing reset logic
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
/>
          
          </Box>
      </BetaAccessGuard>
      {/* </DeviceGuard> */}
    </ThemeProvider>
  );
};

export default Notes;