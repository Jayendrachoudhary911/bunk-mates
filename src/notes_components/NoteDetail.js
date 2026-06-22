import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  IconButton,
  Button,
  Stack,
  CircularProgress,
  Chip,
  Tooltip,
  SwipeableDrawer,
  Avatar,
  ThemeProvider,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  InputAdornment,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ShareIcon from "@mui/icons-material/Share";
import PushPinIcon from "@mui/icons-material/PushPin";
import LabelIcon from "@mui/icons-material/Label";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import SearchIcon from "@mui/icons-material/Search";
import AddIcon from "@mui/icons-material/Add";
import ReactMarkdown from 'react-markdown';
import { db, auth } from "../firebase";
import {
  doc,
  onSnapshot,
  updateDoc,
  deleteDoc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  documentId,
  arrayUnion
} from "firebase/firestore";
import BetaAccessGuard from "../components/BetaAccessGuard";
import { useThemeToggle } from "../contexts/ThemeToggleContext";
import { getTheme } from "../theme";
import { useBackButtonClose } from "../hooks/useBackButtonClose";
import confetti from 'canvas-confetti';

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

// Markdown custom components
const createMdComponents = (mode, dynamicFont) => ({
  p: ({ children }) => (
    <Typography variant="body1" sx={{ mb: 2, color: "text.primary", fontSize: "0.95rem", lineHeight: 1.6, whiteSpace: "pre-wrap", wordBreak: "break-word", fontFamily: dynamicFont }}>
      {children}
    </Typography>
  ),
  h1: ({ children }) => <Typography variant="h4" sx={{ mb: 1.5, mt: 2.5, fontWeight: 800, color: "text.primary", fontFamily: dynamicFont }}>{children}</Typography>,
  h2: ({ children }) => <Typography variant="h5" sx={{ mb: 1.5, mt: 2, fontWeight: 700, color: "text.primary", fontFamily: dynamicFont }}>{children}</Typography>,
  h3: ({ children }) => <Typography variant="h6" sx={{ mb: 1.5, mt: 1.8, fontWeight: 700, color: "text.primary", fontFamily: dynamicFont }}>{children}</Typography>,
  ul: ({ children }) => <Box component="ul" sx={{ pl: 3, mb: 2, color: "text.primary", fontFamily: dynamicFont, "& li": { whiteSpace: "pre-wrap", wordBreak: "break-word", mb: 0.5 } }}>{children}</Box>,
  ol: ({ children }) => <Box component="ol" sx={{ pl: 3, mb: 2, color: "text.primary", fontFamily: dynamicFont, "& li": { whiteSpace: "pre-wrap", wordBreak: "break-word", mb: 0.5 } }}>{children}</Box>,
  li: ({ children }) => <Typography component="li" sx={{ color: "text.primary", whiteSpace: "pre-wrap", wordBreak: "break-word", fontFamily: dynamicFont }}>{children}</Typography>,
  code: ({ children }) => <Box component="code" sx={{ bgcolor: mode === "dark" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.04)", px: 0.8, py: 0.3, borderRadius: 1.5, fontSize: "0.9em", fontFamily: 'monospace', whiteSpace: "pre-wrap", wordBreak: "break-word", color: mode === "dark" ? "#ffb454" : "#d32f2f" }}>{children}</Box>,
  br: () => <br />,
  pre: ({ children }) => <Box component="pre" sx={{ bgcolor: mode === "dark" ? "rgba(0,0,0,0.2)" : "rgba(0,0,0,0.02)", p: 2, borderRadius: 2.5, overflow: 'auto', border: "1px solid", borderColor: mode === "dark" ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)", mb: 2, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{children}</Box>,
});

// Bottom control toolbar
const GlassActionToolbar = ({
  mode,
  isPinned,
  onEdit,
  onShare,
  onPin,
  onInfo,
  onDelete,
}) => {
  const handlePinClick = (event) => {
    onPin();
    if (!isPinned) {
      const rect = event.currentTarget.getBoundingClientRect();
      const x = (rect.left + rect.width / 2) / window.innerWidth;
      const y = (rect.top + rect.height / 2) / window.innerHeight;

      const pinShape1 = confetti.shapeFromText({ text: '📍', scalar: 4.2 });
      const pinShape2 = confetti.shapeFromText({ text: '📌', scalar: 4.2 });

      confetti({
        particleCount: 30,
        spread: 30,
        startVelocity: 25,
        origin: { x, y },
        shapes: [pinShape1, pinShape2],
        colors: ['#52ff74', '#3498db', '#f1c40f', '#e74c3c', '#9b59b6'], 
        disableForReducedMotion: true,
      });
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        p: 0.7,
        mx: "auto",
        position: "fixed",
        bottom: 24,
        left: 14,
        right: 24,
        zIndex: 1000,
        "& .MuiIconButton-root": {
          transition: "all 0.2s ease",
          color: mode === "dark" ? "rgba(255, 255, 255, 0.8)" : "rgba(0, 0, 0, 0.7)",
          "&:hover": {
            backgroundColor: mode === "dark" ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.05)",
            color: mode === "dark" ? "#fff" : "#000",
          },
        },
      }}
    >
      <Box
        sx={{
          position: "fixed",
          left: 0,
          right: 0,
          bottom: 0,
          height: 120,
          pointerEvents: "none",
          background: mode === "dark" 
            ? "linear-gradient(to top, rgb(0, 0, 0) 0%, rgba(0, 0, 0, 0.5) 50%, rgba(0, 0, 0, 0) 100%)" 
            : "linear-gradient(to top, rgba(255, 255, 255, 0.8) 0%, rgba(255, 255, 255, 0) 100%)",
        }}
      />
      
      {/* Share Section */}
      <Tooltip title="Share / Collaborators">
        <IconButton onClick={onShare} 
          sx={{
            p: 2,
            borderRadius: 8,
            backdropFilter: "blur(15px) saturate(180%)",
            WebkitBackdropFilter: "blur(15px) saturate(180%)",
            backgroundColor: mode === "dark" ? "#00000007" : "rgba(255, 255, 255, 0.07)",
            boxShadow: mode === "dark"
              ? `inset 0 1px 2px rgba(255, 255, 255, 0.11), inset 0 -1px 1px rgba(35, 35, 35, 0.07)`
              : `inset 0 1px 1px rgba(255,255,255,0.8), inset 0 -1px 1px rgba(0,0,0,0.1)`,
          }}
        >
          <ShareIcon sx={{ fontSize: "1.35rem" }} />
        </IconButton>
      </Tooltip>

      {/* Center Group Section */}
      <Box sx={{
        display: "flex",
        alignItems: "center",
        gap: 1,
        p: 1,
        borderRadius: 8,
        backdropFilter: "blur(15px) saturate(180%)",
        WebkitBackdropFilter: "blur(15px) saturate(180%)",
        backgroundColor: mode === "dark" ? "#1d1d1d07" : "rgba(255, 255, 255, 0.07)",
        border: 0,
        boxShadow: mode === "dark"
          ? `inset 0 1px 2px rgba(255, 255, 255, 0.11), inset 0 -1px 1px rgba(35, 35, 35, 0.07)`
          : `inset 0 1px 1px rgba(255,255,255,0.8), inset 0 -1px 1px rgba(0,0,0,0.1)`,
      }}>
        <Tooltip title="Edit">
          <IconButton onClick={onEdit}>
            <EditIcon sx={{ fontSize: "1.35rem" }} />
          </IconButton>
        </Tooltip>

        <Tooltip title={isPinned ? "Unpin" : "Pin to Top"}>
          <IconButton
            onClick={handlePinClick}
            sx={{
              transition: "all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
              ...(isPinned && {
                color: mode === "dark" ? "#52ff74" : "#00891e",
                backgroundColor: mode === "dark" ? "rgba(82, 255, 116, 0.15) !important" : "rgba(0, 202, 44, 0.22) !important",
                transform: "rotate(30deg) scale(1.1)",
                animation: "pinPop 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards",
                "&:hover": {
                  transform: "rotate(35deg) scale(1.18)",
                  backgroundColor: mode === "dark" ? "rgba(82, 255, 116, 0.25) !important" : "rgba(0, 170, 37, 0.12) !important",
                },
                "&:active": {
                  transform: "rotate(25deg) scale(0.95)",
                },
              }),
              ...(!isPinned && {
                "&:active": {
                  transform: "scale(0.92)",
                }
              }),
              "@keyframes pinPop": {
                "0%": { transform: "rotate(0deg) scale(0.5)", opacity: 0.7 },
                "70%": { transform: "rotate(40deg) scale(1.2)" },
                "100%": { transform: "rotate(30deg) scale(1.1)", opacity: 1 }
              }
            }}
          >
            <PushPinIcon sx={{ fontSize: "1.35rem" }} />
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
            <DeleteOutlineIcon sx={{ fontSize: "1.35rem" }} />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Info Section */}
      <Tooltip title="Note Details">
        <IconButton onClick={onInfo}
          sx={{
            p: 2,
            borderRadius: 8,
            backdropFilter: "blur(15px) saturate(180%)",
            WebkitBackdropFilter: "blur(15px) saturate(180%)",
            backgroundColor: mode === "dark" ? "#1d1d1d07" : "rgba(255, 255, 255, 0.07)",
            boxShadow: mode === "dark"
              ? `inset 0 1px 2px rgba(255, 255, 255, 0.11), inset 0 -1px 1px rgba(35, 35, 35, 0.07)`
              : `inset 0 1px 1px rgba(255,255,255,0.8), inset 0 -1px 1px rgba(0,0,0,0.1)`,
          }}
        >
          <InfoOutlinedIcon sx={{ fontSize: "1.35rem" }} />
        </IconButton>
      </Tooltip>
    </Box>
  );
};

const NoteDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [note, setNote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  // Structural drawer & modal trigger states
  const [detailsDrawerOpen, setDetailsDrawerOpen] = useState(false);
  const [collaboratorsDrawerOpen, setCollaboratorsDrawerOpen] = useState(false);
  const [labelsDrawerOpen, setLabelsDrawerOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [sharedUsersInfo, setSharedUsersInfo] = useState({});

  // Labels and system list collections mappings
  const [labels, setLabels] = useState([]);
  const [newLabelText, setNewLabelText] = useState("");

  // Friends search list layout state mapping
  const [friendsList, setFriendsList] = useState([]);
  const [loadingFriends, setLoadingFriends] = useState(false);
  const [searchCollaboratorQuery, setSearchCollaboratorQuery] = useState("");

  const collaboratorCacheRef = useRef({});
  const { mode, accent } = useThemeToggle();
  const theme = useMemo(() => getTheme(mode, accent), [mode, accent]);
  
  const dynamicFontFamily = useMemo(() => {
    return getFontFamily(note?.fontStyle || "monospace");
  }, [note?.fontStyle]);

  const mdComponents = useMemo(() => createMdComponents(mode, dynamicFontFamily), [mode, dynamicFontFamily]);

  useBackButtonClose(detailsDrawerOpen, () => setDetailsDrawerOpen(false));
  useBackButtonClose(collaboratorsDrawerOpen, () => setCollaboratorsDrawerOpen(false));
  useBackButtonClose(labelsDrawerOpen, () => setLabelsDrawerOpen(false));
  useBackButtonClose(deleteDialogOpen, () => setDeleteDialogOpen(false));

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

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
      console.warn("Error loading collaborator profiles:", e);
    }
  }, []);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    const unsubscribe = onSnapshot(doc(db, "notes", id), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const loadedNote = {
          id: docSnap.id,
          title: data.title || "",
          content: data.content || "",
          createdAt: data.createdAt,
          owners: data.owners || [],
          pinned: data.pinned ?? false,
          labels: data.labels || [],
          sharedWith: data.sharedWith || [],
          fontStyle: data.fontStyle || "monospace",
        };
        setNote(loadedNote);

        const uids = new Set([...loadedNote.owners, ...loadedNote.sharedWith]);
        if (uids.size > 0) {
          fetchCollaboratorProfiles(Array.from(uids));
        }
      } else {
        setNote(null);
      }
      setLoading(false);
    }, (err) => {
      console.error("Error fetching note snapshot data:", err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [id, fetchCollaboratorProfiles]);

  // Fetch all existing labels across user workspace collections
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "notes"), where("owners", "array-contains", user.uid));
    getDocs(q).then((snapshot) => {
      const labelSet = new Set();
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        (data.labels || []).forEach((label) => {
          if (label !== "Shared") labelSet.add(label);
        });
      });
      setLabels(Array.from(labelSet).sort((a, b) => a.localeCompare(b)));
    }).catch(console.error);
  }, [user]);

  // Fetch verified friends list profile details
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
            const friendsQuery = query(
              collection(db, "users"), 
              where(documentId(), "in", chunk)
            );
            
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
      console.error("Failed to query records from current user's friends list:", err);
    } finally {
      setLoadingFriends(false);
    }
  };

  const handleToggleCollaborator = async (uid) => {
    if (!note) return;
    const updatedSharedWith = note.sharedWith.includes(uid)
      ? note.sharedWith.filter(id => id !== uid)
      : [...note.sharedWith, uid];

    try {
      await updateDoc(doc(db, "notes", note.id), {
        sharedWith: updatedSharedWith,
        owners: arrayUnion(user.uid, uid)
      });
    } catch (err) {
      console.error("Failed to mutate cloud collaborator records layout context link:", err);
    }
  };

  const handleToggleLabelMemo = async (label) => {
    if (!note) return;
    const updatedLabels = note.labels.includes(label)
      ? note.labels.filter(l => l !== label)
      : [...note.labels, label];

    try {
      await updateDoc(doc(db, "notes", note.id), {
        labels: updatedLabels
      });
    } catch (err) {
      console.error("Failed to save changes to cloud label properties:", err);
    }
  };

  const handleAddNewLabel = async () => {
    const sanitized = newLabelText.trim();
    if (!sanitized || !note) return;
    if (!labels.includes(sanitized)) {
      setLabels(prev => [...prev, sanitized].sort((a, b) => a.localeCompare(b)));
    }
    if (!note.labels.includes(sanitized)) {
      try {
        await updateDoc(doc(db, "notes", note.id), {
          labels: arrayUnion(sanitized)
        });
      } catch (err) {
        console.error("Failed to write inline custom label reference link:", err);
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

  const handlePinNote = useCallback(async (n) => {
    if (!n) return;
    await updateDoc(doc(db, "notes", n.id), { pinned: !n.pinned });
  }, []);

  const handleDeleteNote = useCallback(async (noteId) => {
    await deleteDoc(doc(db, "notes", noteId));
    navigate("/notes");
  }, [navigate]);

  if (loading) {
    return (
      <ThemeProvider theme={theme}>
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", bgcolor: theme.palette.background.default }}>
          <CircularProgress color="inherit" />
        </Box>
      </ThemeProvider>
    );
  }

  if (!note) {
    return (
      <ThemeProvider theme={theme}>
        <Box sx={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", height: "100vh", bgcolor: theme.palette.background.default, gap: 2 }}>
          <Typography color="text.secondary" variant="h6">Note not found or deleted.</Typography>
          <Button variant="contained" onClick={() => navigate("/notes")}>Back to Notes</Button>
        </Box>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <BetaAccessGuard>
        <Box
          sx={{
            p: 3, px: 4, backgroundColor: theme.palette.background.default, color: theme.palette.text.primary,
            minHeight: "100vh", maxWidth: 700, mx: "auto", pt: 13, pb: 12, boxSizing: "border-box", position: "relative",
          }}
        >
          {/* Header Gradients Blur Element Layer Covers */}
          <Box
            sx={{
              position: "fixed", top: 0, left: 0, right: 0, height: 120, zIndex: 1100, pointerEvents: "none",
              background: mode === "dark"
                ? `linear-gradient(to bottom, rgba(12,12,12,1) 0%, rgba(12,12,12,0.85) 25%, rgba(12,12,12,0.55) 60%, rgba(12,12,12,0.15) 85%, transparent 100%)`
                : `linear-gradient(to bottom, rgba(255,255,255,1) 0%, rgba(255,255,255,0.88) 25%, rgba(255,255,255,0.58) 60%, rgba(255,255,255,0.18) 85%, transparent 100%)`,
            }}
          />
          <Box
            sx={{
              position: "fixed", top: 51, left: 11, right: 11, zIndex: 1200, display: "flex", alignItems: "center", justifyContent: "space-between", px: 1
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <IconButton
                onClick={() => navigate(-1)}
                sx={{
                  borderRadius: 8, p: 1.5, backdropFilter: "blur(10px)",
                  boxShadow: theme.palette.mode === "dark"
                            ? `inset 0 1px 2px rgba(255, 255, 255, 0.11), inset 0 -1px 1px rgba(35, 35, 35, 0.07)`
                            : `inset 0 1px 1px rgba(255,255,255,0.8), inset 0 -1px 1px rgba(0, 0, 0, 0.1)`,
                  color: mode === "dark" ? "#fff" : "#000",
                  background: mode === "dark" ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
                  "&:hover": { background: mode === "dark" ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)" },
                }}
              >
                <ArrowBackIcon />
              </IconButton>
            </Box>
          </Box>

          <Typography variant="h4" fontWeight="600" sx={{ color: theme.palette.text.primary, mb: 1, mt: 2, fontFamily: dynamicFontFamily }}>
            {note.title || "Untitled Note"}
          </Typography>

          {/* Collaborator Avatars */}
          {note.sharedWith && note.sharedWith.length > 0 && (
            <Box sx={{ mb: 1, mt: 2 }}>
              <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                {note.sharedWith.map((uid) => {
                  const u = sharedUsersInfo[uid];
                  return (
                    <Box 
                      key={uid} 
                      sx={{ 
                        display: "flex", alignItems: "center", gap: 1, pl: 0.5, pr: 1.5, py: 0.5, 
                        background: mode === "dark" ? "rgba(255, 255, 255, 0.08)" : "rgba(255,255,255,0.08)",
                        backdropFilter: "blur(10px)",
                        boxShadow: theme.palette.mode === "dark"
                          ? `inset 0 1px 2px rgba(255, 255, 255, 0.11), inset 0 -1px 1px rgba(35, 35, 35, 0.07)`
                          : `inset 0 1px 1px rgba(255,255,255,0.8), inset 0 -1px 1px rgba(0, 0, 0, 0.1)`, borderRadius: 8
                      }}
                    >
                      <Avatar
                        src={u?.photoURL || ""}
                        alt={u?.username || "User"}
                        sx={{ width: 22, height: 22, fontSize: 11, bgcolor: theme.palette.primary.main, color: "#fff" }}
                      >
                        {u?.username ? u.username[0].toUpperCase() : "U"}
                      </Avatar>
                      <Typography variant="caption" sx={{ color: mode === "dark" ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.7)", fontWeight: 500 }}>
                        {u?.username || uid.slice(0, 6) + "..."}
                      </Typography>
                    </Box>
                  );
                })}
              </Stack>
            </Box>
          )}

          {/* Label Chips */}
          {note.labels && note.labels.length > 0 && (
            <Box sx={{ width: "100%", mb: 3, ml: 0.2 }}>
              <Stack direction="row" display="flex" alignItems="center" spacing={1} useFlexGap flexWrap="wrap">
                {note.labels.map(label => (
                  <Chip
                    key={label}
                    icon={<LabelIcon style={{ color: "inherit", fontSize: "0.9rem" }} />}
                    label={label}
                    size="small"
                    sx={{
                      fontSize: "0.75rem", fontWeight: 500, borderRadius: 2, px: 0.5,
                      color: mode === "dark" ? "rgba(255, 255, 255, 0.75)" : "rgba(0, 0, 0, 0.7)",
                      background: mode === "dark" ? "rgba(255, 255, 255, 0.08)" : "rgba(255,255,255,0.8)",
                      backdropFilter: "blur(10px)",
                      boxShadow: theme.palette.mode === "dark"
                        ? `inset 0 1px 2px rgba(255, 255, 255, 0.11), inset 0 -1px 1px rgba(35, 35, 35, 0.07)`
                        : `inset 0 1px 1px rgba(255,255,255,0.8), inset 0 -1px 1px rgba(0, 0, 0, 0.1)`, borderRadius: 8
                    }}
                  />
                ))}
              </Stack>
            </Box>
          )}

          <Box sx={{ pb: 10 }}>
            <ReactMarkdown components={mdComponents}>
              {note.content || "*No content saved on this note*"}
            </ReactMarkdown>
          </Box>

          {/* Core Action Command Dock */}
          <GlassActionToolbar
            mode={mode}
            isPinned={note.pinned}
            onEdit={() => navigate(`/notes/${note.id}/workspace`)}
            onShare={() => { setCollaboratorsDrawerOpen(true); fetchCurrentUsersFriends(); }}
            onPin={() => handlePinNote(note)}
            onInfo={() => setDetailsDrawerOpen(true)}
            onDelete={() => setDeleteDialogOpen(true)}
          />

          {/* COLLABORATORS DRAWERS SELECTION CONTEXT LAYER */}
          <SwipeableDrawer
            anchor="bottom"
            open={collaboratorsDrawerOpen}
            onClose={() => {
              setCollaboratorsDrawerOpen(false);
              setSearchCollaboratorQuery("");
            }}
            onOpen={() => {}}
            disableSwipeToOpen
            sx={{ zIndex: 1450 }}
            PaperProps={{
              sx: {
                borderRadius: 8, p: 4, pt: 2, minHeight: "50vh", maxHeight: "80vh",
                background: mode === "dark" ? "rgba(20, 20, 20, 0.08)" : "rgba(255, 255, 255, 0.39)",
                backdropFilter: "blur(20px)", backgroundImage: "none",
                boxShadow: theme.palette.mode === "dark"
                  ? `inset 0 1px 2px rgba(255, 255, 255, 0.11), inset 0 -1px 1px rgba(35, 35, 35, 0.07)`
                  : `inset 0 1px 1px rgba(255,255,255,0.8), inset 0 -1px 1px rgba(0, 0, 0, 0.1)`,
                mx :"auto", m: 2
              },
            }}
            ModalProps={{
              BackdropProps: { sx: { backdropFilter: "blur(10px)", backgroundColor: "rgba(0,0,0,0)" } }
            }}
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

            <Typography variant="h6" fontWeight={700} mb={2}>
              Collaborators
            </Typography>

            <TextField
              placeholder="Search friends by name or email..."
              value={searchCollaboratorQuery}
              onChange={(e) => setSearchCollaboratorQuery(e.target.value)}
              fullWidth
              variant="outlined"
              size="small"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" style={{ color: "gray" }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                width: "100%", mb: 2,
                "& .MuiOutlinedInput-root": {
                  color: mode === "dark" ? "#fff" : "#111", borderRadius: 3,
                  backgroundColor: mode === "dark" ? "rgba(255, 255, 255, 0.03)" : "rgba(0, 0, 0, 0.02)",
                  boxShadow: mode === "dark"
                    ? `inset 0 1px 2px rgba(255, 255, 255, 0.11), inset 0 -1px 1px rgba(35, 35, 35, 0.07)`
                    : `inset 0 1px 1px rgba(255,255,255,0.8), inset 0 -1px 1px rgba(162, 162, 162, 0.1)`,
                  border: "0px solid", borderColor: mode === "dark" ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.06)",
                  transition: "all 0.2s ease-in-out",
                  "& fieldset": { border: "none" },
                  "&:hover": {
                    backgroundColor: mode === "dark" ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.05)",
                    borderColor: mode === "dark" ? "rgba(255, 255, 255, 0.18)" : "rgba(0, 0, 0, 0.12)",
                  },
                  "&.Mui-focused": {
                    backgroundColor: mode === "dark" ? "rgba(255, 255, 255, 0.04)" : "rgba(255, 255, 255, 0.8)",
                    borderColor: mode === "dark" ? "rgba(255, 255, 255, 0)" : "primary.main",
                    boxShadow: mode === "dark" ? `0 0 0 3px rgba(255, 255, 255, 0.05)` : `0 0 0 3px rgba(25, 118, 210, 0.15)`,
                  },
                },
                "& .MuiOutlinedInput-input": {
                  py: 1.2, fontSize: "0.9rem", color: mode === "dark" ? "rgba(255, 255, 255, 0.9)" : "rgba(0, 0, 0, 0.85)",
                  "&::placeholder": { color: mode === "dark" ? "rgba(255, 255, 255, 0.4)" : "rgba(0, 0, 0, 0.4)", opacity: 1 },
                },
              }}
            />

            {loadingFriends ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                <CircularProgress size={28} color="inherit" />
              </Box>
            ) : (
              <List dense sx={{ width: '100%', maxHeight: "50vh", overflowY: "auto" }}>
                {filteredFriends.length > 0 ? (
                  filteredFriends.map((friend) => {
                    const isAdded = note.sharedWith.includes(friend.uid);
                    return (
                      <ListItem
                        key={friend.uid}
                        disablePadding
                        secondaryAction={
                          <IconButton
                            edge="end"
                            onClick={() => handleToggleCollaborator(friend.uid)}
                            color={isAdded ? "success" : "default"}
                            sx={{
                              borderRadius: "20px",
                              background: mode === "dark" ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.8)",
                              backdropFilter: "blur(10px)",
                              boxShadow: theme.palette.mode === "dark"
                                ? `inset 0 1px 2px rgba(255, 255, 255, 0.11), inset 0 -1px 1px rgba(35, 35, 35, 0.07)`
                                : `inset 0 1px 1px rgba(255,255,255,0.8), inset 0 -1px 1px rgba(0, 0, 0, 0.1)`,
                              "&:hover": {
                                backgroundColor: isAdded 
                                  ? "rgba(46, 125, 50, 0.2)" 
                                  : mode === "dark" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)",
                              }
                            }}
                          >
                            {isAdded ? (
                              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, px: 0.5 }}>
                                <span style={{ fontSize: "0.75rem", fontWeight: 700 }}>Added</span>
                              </Box>
                            ) : (
                              <AddIcon fontSize="small" />
                            )}
                          </IconButton>
                        }
                        sx={{ py: 1 }}
                      >
                        <ListItemAvatar>
                          <Avatar 
                            src={friend.photoURL || friend.profilePic} 
                            alt={friend.name}
                            sx={{ width: 40, height: 40, fontWeight: 700, bgcolor: theme.palette.primary.main, color: mode === "dark" ? "#000" : "#fff" }}
                          >
                            {friend.name.charAt(0).toUpperCase()}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText 
                          primary={friend.name} 
                          secondary={`@${friend.username}`}
                          primaryTypographyProps={{ fontWeight: 600, sx: { pl: 1 } }}
                          secondaryTypographyProps={{ sx: { pl: 1 } }}
                        />
                      </ListItem>
                    );
                  })
                ) : (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 2, fontStyle: "italic", textAlign: "center" }}>
                    {friendsList.length === 0 
                      ? "You haven't added any friends to your account yet." 
                      : "No friends match your search criterion."}
                  </Typography>
                )}
              </List>
            )}
          </SwipeableDrawer>

          {/* LABELS DRAWER LAYER */}
          <SwipeableDrawer
            anchor="bottom"
            open={labelsDrawerOpen}
            onClose={() => { setLabelsDrawerOpen(false); setNewLabelText(""); }}
            onOpen={() => {}}
            disableSwipeToOpen
            sx={{ zIndex: 1450 }}
            PaperProps={{
              sx: {
                borderRadius: 8, p: 4, pt: 2, minHeight: "20vh", maxHeight: "50vh",
                background: mode === "dark" ? "rgba(20, 20, 20, 0.08)" : "rgba(255,255,255,0.39)",
                backdropFilter: "blur(10px)", backgroundImage: "none",
                boxShadow: theme.palette.mode === "dark"
                  ? `inset 0 1px 2px rgba(255, 255, 255, 0.11), inset 0 -1px 1px rgba(35, 35, 35, 0.07)`
                  : `inset 0 1px 1px rgba(255,255,255,0.8), inset 0 -1px 1px rgba(0, 0, 0, 0.1)`,
                mx :"auto", m: 2
              },
            }}
            ModalProps={{
              BackdropProps: { sx: { backdropFilter: "blur(10px)", backgroundColor: "rgba(0,0,0,0)" } }
            }}
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
            <Typography variant="h6" fontWeight={700} mb={2}>
              Labels
            </Typography>

            <Box sx={{ display: "flex", gap: 1, mb: 3 }}>
              <TextField
                placeholder="Create new label..."
                value={newLabelText}
                onChange={(e) => setNewLabelText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddNewLabel()}
                variant="outlined"
                size="small"
                fullWidth                
                sx={{
                  width: "100%",
                  "& .MuiOutlinedInput-root": {
                    color: mode === "dark" ? "#fff" : "#111", borderRadius: 3,
                    backgroundColor: mode === "dark" ? "rgba(255, 255, 255, 0)" : "rgba(0, 0, 0, 0.01)",
                    boxShadow: mode === "dark"
                      ? `inset 0 1px 2px rgba(255, 255, 255, 0.11), inset 0 -1px 1px rgba(35, 35, 35, 0.07)`
                      : `inset 0 1px 1px rgba(255,255,255,0.8), inset 0 -1px 1px rgba(0,0,0,0.1)`,
                    border: "0.1px solid", borderColor: mode === "dark" ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.06)",
                    transition: "all 0.2s ease-in-out",
                    "& fieldset": { border: "none" },
                    "&:hover": {
                      backgroundColor: mode === "dark" ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.05)",
                      borderColor: mode === "dark" ? "rgba(255, 255, 255, 0.18)" : "rgba(0, 0, 0, 0.12)",
                    },
                    "&.Mui-focused": {
                      backgroundColor: mode === "dark" ? "rgba(255, 255, 255, 0.04)" : "rgba(255, 255, 255, 0.8)",
                      borderColor: mode === "dark" ? "rgba(255, 255, 255, 0)" : "primary.main",
                      boxShadow: mode === "dark" ? `0 0 0 3px rgba(255, 255, 255, 0.05)` : `0 0 0 3px rgba(25, 118, 210, 0.15)`,
                    },
                  },
                  "& .MuiOutlinedInput-input": {
                    py: 1.2, fontSize: "0.9rem", color: mode === "dark" ? "rgba(255, 255, 255, 0.9)" : "rgba(0, 0, 0, 0.85)",
                    "&::placeholder": { color: mode === "dark" ? "rgba(255, 255, 255, 0.4)" : "rgba(0, 0, 0, 0.4)", opacity: 1 },
                  },
                }}
              />
              <IconButton 
                onClick={handleAddNewLabel} 
                color="primary"
                disabled={!newLabelText.trim()}
                sx={{ 
                  color: mode === "dark" ? "#fff" : "#000",
                  background: mode === "dark" ? "rgba(255, 255, 255, 0.18)" : "rgba(255,255,255,0.8)",
                  backdropFilter: "blur(10px)",
                  boxShadow: theme.palette.mode === "dark"
                    ? `inset 0 1px 2px rgba(255, 255, 255, 0.11), inset 0 -1px 1px rgba(35, 35, 35, 0.07)`
                    : `inset 0 1px 1px rgba(255,255,255,0.8), inset 0 -1px 1px rgba(0, 0, 0, 0.1)`, borderRadius: 8 }}
              >
                <AddIcon />
              </IconButton>
            </Box>

            <Typography variant="subtitle2" fontWeight={600} mb={1.5} color="text.secondary">
              Your Labels Collection
            </Typography>
            
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", maxHeight: "25vh", overflowY: "auto" }}>
              {labels.length > 0 ? (
                labels.map((label) => {
                  const isSelected = note.labels.includes(label);
                  return (
                    <Chip
                      key={label}
                      label={label}
                      onClick={() => handleToggleLabelMemo(label)}
                      variant={isSelected ? "filled" : "outlined"}
                      sx={{
                        borderRadius: 6, px: 0.5, fontWeight: 600, border: 0,
                        color: isSelected ? (mode === "dark" ? "#000" : "#fff") : "text.primary",
                        backgroundColor: isSelected ? (mode === "dark" ? "#ffffff" : "rgba(21, 21, 21, 0.86)") : (mode === "dark" ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.8)"),
                        boxShadow: isSelected ? (mode === "dark"
                        ? `inset 0 1px 1px rgba(52, 52, 52, 0.96), inset 0 -1px 1px rgba(31, 31, 31, 0.68)`
                        : `inset 0 1px 2px rgba(255, 255, 255, 0.11), inset 0 -1px 1px rgba(35, 35, 35, 0.07)`)
                        : (mode === "dark"
                              ? `inset 0 1px 2px rgba(255, 255, 255, 0.11), inset 0 -1px 1px rgba(35, 35, 35, 0.07)`
                              : `inset 0 1px 1px rgba(255,255,255,0.8), inset 0 -1px 1px rgba(0, 0, 0, 0.1)`),
                        backdropFilter: "blur(10px)",
                      }}
                    />
                  );
                })
              ) : (
                <Typography variant="body2" color="text.secondary" fontStyle="italic">
                  No labels created yet. Add one above!
                </Typography>
              )}
            </Box>
          </SwipeableDrawer>

          {/* Details Metadata Drawer Context Layer Layout View */}
          <SwipeableDrawer
            anchor="bottom"
            open={detailsDrawerOpen}
            fullWidth
            onClose={() => setDetailsDrawerOpen(false)}
            onOpen={() => {}}
            disableSwipeToOpen={true}
            disableDiscovery={true}
            transitionDuration={{ enter: 200, exit: 150 }}
            sx={{ zIndex: 1400 }}
            PaperProps={{
              sx: {
                borderRadius: 8, pt: 2,
                background: mode === "dark" ? "rgba(20, 20, 20, 0.08)" : "rgba(255, 255, 255, 0.39)",
                backgroundImage: "none", backdropFilter: "blur(20px)", p: 3, m: 2, height: "auto", maxHeight: "65vh", width: "80%", mx: "auto",
                boxShadow: theme.palette.mode === "dark"
                  ? `inset 0 1px 2px rgba(255, 255, 255, 0.11), inset 0 -1px 1px rgba(35, 35, 35, 0.07)`
                  : `inset 0 1px 1px rgba(255,255,255,0.8), inset 0 -1px 1px rgba(0, 0, 0, 0.1)`
              },
            }}
            ModalProps={{
              BackdropProps: { sx: { backdropFilter: "blur(10px)", backgroundColor: "rgba(0,0,0,0)" } }
            }}
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

            <Typography variant="h6" fontWeight="800" sx={{ mb: 3, letterSpacing: "0.5px", textTransform: "uppercase", fontSize: "0.85rem", color: "text.secondary" }}>
              Note Details
            </Typography>

            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {/* Section 1: Authors & Sharing */}
              <Box sx={{ p: 2.5, borderRadius: 6, background: mode === "dark" ? "rgba(255, 255, 255, 0.01)" : "rgba(0, 0, 0, 0.01)", border: `1px solid ${mode === "dark" ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)"}` }}>
                <Typography variant="subtitle2" sx={{ color: theme.palette.text.secondary, fontWeight: 700, mb: 2, textTransform: "uppercase", fontSize: "0.75rem", letterSpacing: "0.5px" }}>
                  Authors & Sharing
                </Typography>
                
                <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, gap: 4 }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontWeight: 600, display: "block", mb: 1 }}>Author:</Typography>
                    {note?.owners && note.owners.length > 0 ? (
                      <Box sx={{ display: "inline-flex", alignItems: "center", gap: 1, background: mode === "dark" ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)", borderRadius: "20px", pl: 0.5, pr: 1.5, py: 0.5 }}>
                        <Avatar
                          src={sharedUsersInfo[note.owners[0]]?.photoURL || ""}
                          alt={sharedUsersInfo[note.owners[0]]?.username || "User"}
                          sx={{ width: 22, height: 22, fontSize: 11, bgcolor: theme.palette.secondary.main, color: "#fff" }}
                        >
                          {sharedUsersInfo[note.owners[0]]?.username ? sharedUsersInfo[note.owners[0]].username[0].toUpperCase() : "U"}
                        </Avatar>
                        <Typography variant="body2" sx={{ color: theme.palette.text.primary, fontSize: 13, fontWeight: 500 }}>
                          {sharedUsersInfo[note.owners[0]]?.username || note.owners[0].slice(0, 6) + "..."}
                        </Typography>
                      </Box>
                    ) : (
                      <Typography variant="body2" sx={{ color: "text.disabled", fontStyle: "italic" }}>Unknown</Typography>
                    )}
                  </Box>

                  <Box sx={{ flex: 2 }}>
                    <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontWeight: 600, display: "block", mb: 1 }}>Collaborators:</Typography>
                    <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ gap: 0.5 }}>
                      {note?.sharedWith && note.sharedWith.length > 0 ? (
                        note.sharedWith.map((uid) => {
                          const u = sharedUsersInfo[uid];
                          return (
                            <Box key={uid} sx={{ display: "flex", alignItems: "center", gap: 1, background: mode === "dark" ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)", borderRadius: "20px", pl: 0.5, pr: 1.5, py: 0.5 }}>
                              <Avatar
                                src={u?.photoURL || ""}
                                alt={u?.username || "User"}
                                sx={{ width: 22, height: 22, fontSize: 11, bgcolor: theme.palette.primary.main, color: "#fff" }}
                              >
                                {u?.username ? u.username[0].toUpperCase() : "U"}
                              </Avatar>
                              <Typography variant="body2" sx={{ color: theme.palette.text.primary, fontSize: 13, fontWeight: 500 }}>
                                {u?.username || uid.slice(0, 6) + "..."}
                              </Typography>
                            </Box>
                          );
                        })
                      ) : (
                        <Typography variant="body2" sx={{ color: "text.disabled", fontStyle: "italic", mt: 0.5 }}>Private Note</Typography>
                      )}
                    </Stack>
                    <Button 
                      startIcon={<AddIcon fontSize="small" />} 
                      size="small" 
                      onClick={() => { setCollaboratorsDrawerOpen(true); fetchCurrentUsersFriends(); }}
                        sx={{
    mt: 1.5,

    px: 2,
    py: 0.1,

    textTransform: "none",

    fontSize: "0.9rem",
    fontWeight: 200,
    letterSpacing: 0.2,

    color: "text.primary",


                      background: mode === "dark" ? "rgba(255, 255, 255, 0.02)" : "rgba(255,255,255,0.3)",
                      backdropFilter: "blur(10px)",borderRadius: 18,

    transition: "all 0.25s ease",

    "& .MuiButton-startIcon": {
      mr: 0.75,
    },

    "&:active": {
      transform: "scale(0.97)",
    },
  }}
                    >
                      Manage Collaborators
                    </Button>
                  </Box>
                </Box>
              </Box>

              {/* Section 2: Properties & Style */}
              <Box sx={{ p: 0.5 }}>
                <Typography variant="subtitle2" sx={{ color: theme.palette.text.secondary, fontWeight: 700, mb: 2, pl: 1, textTransform: "uppercase", fontSize: "0.75rem", letterSpacing: "0.5px" }}>
                  Properties & Style
                </Typography>

                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
                  <Box sx={{ p: 2.5, borderRadius: 6, background: mode === "dark" ? "rgba(255, 255, 255, 0.01)" : "rgba(0, 0, 0, 0.01)", border: `1px solid ${mode === "dark" ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)"}` }}>
                    <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontWeight: 600, display: "block", mb: 1 }}>Labels:</Typography>
                    <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ gap: 0.5 }}>
                      {note?.labels && note.labels.length > 0 ? (
                        note.labels.map((label) => (
                          <Chip
                            key={label}
                            icon={<LabelIcon sx={{ color: mode === "dark" ? "#fff" : "#000", fontSize: "14px !important" }} />}
                            label={label}
                            size="small"
                            sx={{
                              fontSize: "0.75rem", borderRadius: "8px", fontWeight: 500,
                              color: mode === "dark" ? "#fff" : "#000",
                              background: mode === "dark" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
                            }}
                          />
                        ))
                      ) : (
                        <Typography variant="body2" sx={{ color: "text.disabled", fontStyle: "italic" }}>No labels assigned</Typography>
                      )}
                    </Stack>
<Button
  startIcon={<AddIcon fontSize="small" />}
  size="small"
  onClick={() => setLabelsDrawerOpen(true)}
  sx={{
    mt: 1.5,

    px: 2,
    py: 0.1,

    textTransform: "none",

    fontSize: "0.9rem",
    fontWeight: 200,
    letterSpacing: 0.2,

    color: "text.primary",


                      background: mode === "dark" ? "rgba(255, 255, 255, 0.02)" : "rgba(255,255,255,0.3)",
                      backdropFilter: "blur(10px)",borderRadius: 18,

    transition: "all 0.25s ease",

    "& .MuiButton-startIcon": {
      mr: 0.75,
    },

    "&:active": {
      transform: "scale(0.97)",
    },
  }}
>
  Manage Labels
</Button>
                  </Box>

                  <Box sx={{ display: "flex", gap: 2 }}>
                    <Box sx={{ p: 2.5, width: "50%", borderRadius: 6, background: mode === "dark" ? "rgba(255, 255, 255, 0.01)" : "rgba(0, 0, 0, 0.01)", border: `1px solid ${mode === "dark" ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)"}` }}>
                      <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontWeight: 600, display: "block", mb: 0.5 }}>Status:</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: note?.pinned ? "success.main" : "text.disabled", fontSize: 13 }}>
                        {note?.pinned ? "📌 Pinned" : "Regular Note"}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ p: 2.5, width: "50%", borderRadius: 6, background: mode === "dark" ? "rgba(255, 255, 255, 0.01)" : "rgba(0, 0, 0, 0.01)", border: `1px solid ${mode === "dark" ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)"}` }}>
                      <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontWeight: 600, display: "block", mb: 0.5 }}>Active Font:</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, textTransform: "capitalize", fontFamily: dynamicFontFamily, color: "text.main", fontSize: 13 }}>
                        {note?.fontStyle || "Monospace"}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Box>

              {/* Section 3: Row Alignment for Timestamps & System IDs */}
              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
                <Box sx={{ p: 2, borderRadius: 6, background: mode === "dark" ? "rgba(255, 255, 255, 0.005)" : "rgba(0, 0, 0, 0.005)", border: `1px solid ${mode === "dark" ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)"}` }}>
                  <Typography variant="subtitle2" sx={{ color: theme.palette.text.secondary, fontWeight: 600, mb: 0.5 }}>Created On:</Typography>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: "text.primary" }}>
                      {note?.createdAt?.toDate 
                        ? note.createdAt.toDate().toLocaleDateString(undefined, { dateStyle: 'medium' }) 
                        : note?.createdAt ? new Date(note.createdAt).toLocaleDateString(undefined, { dateStyle: 'medium' }) : "N/A"}
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500, color: "text.secondary" }}>
                      @ {note?.createdAt?.toDate 
                        ? note.createdAt.toDate().toLocaleTimeString(undefined, { timeStyle: 'short', hour12: true }) 
                        : note?.createdAt ? new Date(note.createdAt).toLocaleTimeString(undefined, { timeStyle: 'short', hour12: true }) : "N/A"}
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ p: 2, borderRadius: 6, background: mode === "dark" ? "rgba(255, 255, 255, 0.005)" : "rgba(0, 0, 0, 0.005)", border: `1px solid ${mode === "dark" ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)"}` }}>
                  <Typography variant="subtitle2" sx={{ color: theme.palette.text.secondary, fontWeight: 600, mb: 0.5 }}>Note ID:</Typography>
                  <Typography variant="body2" sx={{ fontFamily: "monospace", color: "text.secondary", fontSize: "0.8rem", pt: 0.3 }}>
                    {note?.id || "N/A"}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </SwipeableDrawer>

          {/* Premium Custom Delete Confirm Dialog */}
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
              <Typography variant="body1" textAlign="center" sx={{ fontWeight: 500, px: 2 }}>Are you sure you want to permanently delete <strong>{note?.title || "this note"}</strong>?</Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontStyle: "italic" }}>This change can't be undone.</Typography>
            </Box>
            <Stack direction="row" spacing={2} justifyContent="center">
              <Button variant="outlined" fullWidth onClick={() => setDeleteDialogOpen(false)} sx={{ textTransform: "none", background: mode === "dark" ? "rgba(255, 255, 255, 0.08)" : "rgba(217, 217, 217, 0.42)", backdropFilter: "blur(10px)", boxShadow: theme.palette.mode === "dark" ? `inset 0 1px 2px rgba(255, 255, 255, 0.11), inset 0 -1px 1px rgba(35, 35, 35, 0.07)` : `inset 0 1px 1px rgba(255,255,255,0.8), inset 0 -1px 1px rgba(0, 0, 0, 0.1)`, borderRadius: 8, py: 1.2, fontWeight: 600, border: "none", color: mode === "dark" ? "#fff" : "#000", "&:hover": { backgroundColor: mode === "dark" ? "rgba(255,255,255,0.05)" : "#f5f5f5" } }}>Cancel</Button>
              <Button variant="contained" fullWidth onClick={async () => { await handleDeleteNote(note.id); setDeleteDialogOpen(false); }} sx={{ textTransform: "none", background: mode === "dark" ? "rgba(229, 57, 53, 0.18)" : "rgba(255, 102, 102, 0.69)", backdropFilter: "blur(10px)", boxShadow: theme.palette.mode === "dark" ? `inset 0 1px 2px rgba(255, 255, 255, 0.11), inset 0 -1px 1px rgba(35, 35, 35, 0.07)` : `inset 0 1px 1px rgba(255,255,255,0.8), inset 0 -1px 1px rgba(0, 0, 0, 0.1)`, borderRadius: 8, py: 1.2, fontWeight: 600, color: mode === "dark" ? "#fff" : "#000", "&:hover": { backgroundColor: "#c62828" } }}>Delete Note</Button>
            </Stack>
          </SwipeableDrawer>
        </Box>
      </BetaAccessGuard>
    </ThemeProvider>
  );
};

export default NoteDetail;