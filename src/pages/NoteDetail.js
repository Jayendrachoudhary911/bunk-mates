import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  IconButton,
  Button,
  TextField,
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
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ShareIcon from "@mui/icons-material/Share";
import FormatBoldIcon from "@mui/icons-material/FormatBold";
import FormatItalicIcon from "@mui/icons-material/FormatItalic";
import CodeIcon from "@mui/icons-material/Code";
import PushPinIcon from "@mui/icons-material/PushPin";
import LabelIcon from "@mui/icons-material/Label";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import LabelOutlinedIcon from "@mui/icons-material/LabelOutlined";
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
  arrayUnion,
} from "firebase/firestore";
import BetaAccessGuard from "../components/BetaAccessGuard";
import { useThemeToggle } from "../contexts/ThemeToggleContext";
import { getTheme } from "../theme";
import NotificationsPage from "../elements/Notifications";
import { useBackButtonClose } from "../hooks/useBackButtonClose";

// Glassmorphism design utility
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

// Markdown custom components
const createMdComponents = (mode) => ({
  p: ({ children }) => (
    <Typography variant="body1" sx={{ mb: 2, color: "text.primary", fontSize: "0.95rem", lineHeight: 1.6, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
      {children}
    </Typography>
  ),
  h1: ({ children }) => <Typography variant="h4" sx={{ mb: 1.5, mt: 2.5, fontWeight: 800, color: "text.primary" }}>{children}</Typography>,
  h2: ({ children }) => <Typography variant="h5" sx={{ mb: 1.5, mt: 2, fontWeight: 700, color: "text.primary" }}>{children}</Typography>,
  h3: ({ children }) => <Typography variant="h6" sx={{ mb: 1.5, mt: 1.8, fontWeight: 700, color: "text.primary" }}>{children}</Typography>,
  ul: ({ children }) => <Box component="ul" sx={{ pl: 3, mb: 2, color: "text.primary", "& li": { whiteSpace: "pre-wrap", wordBreak: "break-word", mb: 0.5 } }}>{children}</Box>,
  ol: ({ children }) => <Box component="ol" sx={{ pl: 3, mb: 2, color: "text.primary", "& li": { whiteSpace: "pre-wrap", wordBreak: "break-word", mb: 0.5 } }}>{children}</Box>,
  li: ({ children }) => <Typography component="li" sx={{ color: "text.primary", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{children}</Typography>,
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
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "8px 16px",
        width: 260,
        mx: "auto",
        position: "fixed",
        bottom: 24,
        left: 24,
        right: 24,
        zIndex: 1000,
        borderRadius: 8,
        backdropFilter: "blur(15px) saturate(180%)",
        WebkitBackdropFilter: "blur(15px) saturate(180%)",
        backgroundColor:
          mode === "dark" ? "#1d1d1d22" : "rgba(255, 255, 255, 0.75)",
        boxShadow: mode === "dark"
          ? `inset 0 1px 2px rgba(255, 255, 255, 0.11), inset 0 -1px 1px rgba(35, 35, 35, 0.07)`
          : `inset 0 1px 1px rgba(255,255,255,0.8), inset 0 -1px 1px rgba(0,0,0,0.1)`,
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

const NoteDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [note, setNote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  // Sub-drawer & modal states
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editDrawerOpen, setEditDrawerOpen] = useState(false);
  const [addCollaboratorDrawerOpen, setAddCollaboratorDrawerOpen] = useState(false);
  const [addLabelDrawerOpen, setAddLabelDrawerOpen] = useState(false);
  const [detailsDrawerOpen, setDetailsDrawerOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Edit drawer state variables
  const [noteTitle, setNoteTitle] = useState("");
  const [noteContent, setNoteContent] = useState("");
  const [noteLabels, setNoteLabels] = useState([]);
  const [collaborators, setCollaborators] = useState([]);
  const [newCollaboratorUsername, setNewCollaboratorUsername] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState("");
  const [isPreview, setIsPreview] = useState(false);

  const [labels, setLabels] = useState([]);
  const [sharedUsersInfo, setSharedUsersInfo] = useState({});

  const noteContentRef = useRef(null);
  const autoSaveTimerRef = useRef(null);
  const titleInputRef = useRef("");
  const contentInputRef = useRef("");
  const collaboratorCacheRef = useRef({});

  const { mode, accent } = useThemeToggle();
  const theme = useMemo(() => getTheme(mode, accent), [mode, accent]);
  const mdComponents = useMemo(() => createMdComponents(mode), [mode]);

  // Hook up back button responsiveness for all drawers and modals
  useBackButtonClose(drawerOpen, () => setDrawerOpen(false));
  useBackButtonClose(addCollaboratorDrawerOpen, () => setAddCollaboratorDrawerOpen(false));
  useBackButtonClose(addLabelDrawerOpen, () => setAddLabelDrawerOpen(false));
  useBackButtonClose(detailsDrawerOpen, () => setDetailsDrawerOpen(false));
  useBackButtonClose(deleteDialogOpen, () => setDeleteDialogOpen(false));

  // Handle Auth
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // Fetch collaborator profile details
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

  // Fetch the specific note in real-time
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
        };
        setNote(loadedNote);
        
        // Pre-fill edit inputs if drawer is closed (so it doesn't overwrite active typing)
        if (!drawerOpen) {
          setNoteTitle(loadedNote.title);
          setNoteContent(loadedNote.content);
          setNoteLabels(loadedNote.labels);
          setCollaborators(loadedNote.sharedWith);
          titleInputRef.current = loadedNote.title;
          contentInputRef.current = loadedNote.content;
        }

        const uids = new Set([...loadedNote.owners, ...loadedNote.sharedWith]);
        if (uids.size > 0) {
          fetchCollaboratorProfiles(Array.from(uids));
        }
      } else {
        setNote(null);
      }
      setLoading(false);
    }, (err) => {
      console.error("Error fetching note:", err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [id, fetchCollaboratorProfiles, drawerOpen]);

  // Load user's labels for the edit label selector
  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "notes"),
      where("owners", "array-contains", user.uid)
    );
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

  // Handle Note Auto-save during drawer edit
  useEffect(() => {
    if (!editDrawerOpen || !note) return;
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    
    autoSaveTimerRef.current = setTimeout(async () => {
      const finalTitle = titleInputRef.current;
      const finalContent = contentInputRef.current;
      
      if (!finalTitle.trim() && !finalContent.trim()) return;
      
      try {
        setAutoSaveStatus("saving");
        await updateDoc(doc(db, "notes", note.id), {
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
    }, 800);
    
    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    };
  }, [noteTitle, noteContent, note?.id, editDrawerOpen, collaborators, noteLabels, note]);

  // Save manual notes edits
  const handleEditNote = useCallback(async () => {
    if (!note || (!noteTitle.trim() && !noteContent.trim())) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, "notes", note.id), {
        title: noteTitle,
        content: noteContent,
        sharedWith: collaborators,
        labels: noteLabels,
      });
      setEditDrawerOpen(false);
      setDrawerOpen(false);
      setSaving(false);
    } catch (error) {
      console.error("Error editing note:", error);
      setSaving(false);
    }
  }, [note, noteTitle, noteContent, collaborators, noteLabels]);

  const handlePinNote = useCallback(async (n) => {
    if (!n) return;
    await updateDoc(doc(db, "notes", n.id), { pinned: !n.pinned });
  }, []);

  const handleDeleteNote = useCallback(async (id) => {
    await deleteDoc(doc(db, "notes", id));
    navigate("/notes");
  }, [navigate]);

  const handleAddCollaboratorFromDrawer = useCallback(async () => {
    if (!newCollaboratorUsername.trim() || !note) return;

    try {
      const q = query(
        collection(db, "users"),
        where("username", "==", newCollaboratorUsername.trim())
      );
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        const userDoc = snapshot.docs[0];
        const shareUid = userDoc.id;

        if (shareUid === user.uid) {
          setError("You cannot share with yourself.");
          return;
        }

        const noteRef = doc(db, "notes", note.id);
        await updateDoc(noteRef, {
          sharedWith: arrayUnion(shareUid),
          owners: arrayUnion(user.uid, shareUid)
        });

        if (!collaborators.includes(shareUid)) {
          setCollaborators(prev => [...prev, shareUid]);
        }

        setNewCollaboratorUsername("");
        setAddCollaboratorDrawerOpen(false);
        setError("");
      } else {
        setError("User not found.");
      }
    } catch (err) {
      console.error("Error adding collaborator:", err);
      setError("Something went wrong. Please try again.");
    }
  }, [newCollaboratorUsername, note, user?.uid, collaborators]);

  const handleAddCustomLabel = useCallback(() => {
    if (!newLabel.trim()) return;
    if (!labels.includes(newLabel.trim())) {
      setLabels(prev => [...prev, newLabel.trim()]);
    }
    setNoteLabels(prev => [...prev, newLabel.trim()]);
    setNewLabel("");
    setAddLabelDrawerOpen(false);
  }, [newLabel, labels]);

  const handleToggleLabelMemo = useCallback((label) => {
    setNoteLabels(prev =>
      prev.includes(label) ? prev.filter(l => l !== label) : [...prev, label]
    );
  }, []);

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
    contentInputRef.current = before + formatted + after;

    requestAnimationFrame(() => {
      textarea.focus();
      const pos = before.length + formatted.length;
      textarea.setSelectionRange(pos, pos);
    });
  }, [noteContent]);

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
            p: 3,
            px: 2,
            backgroundColor: theme.palette.background.default,
            color: theme.palette.text.primary,
            minHeight: "100vh",
            maxWidth: 700,
            mx: "auto",
            pt: 13,
            pb: 12,
            boxSizing: "border-box",
            position: "relative",
          }}
        >
          {/* Top Back Button */}
          <Button
            onClick={() => navigate("/notes")}
            sx={{
              position: "absolute",
              top: 54,
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

          {/* Title Area */}
          <Typography variant="h4" fontWeight="bold" sx={{ color: theme.palette.text.primary, mb: 1, mt: 2 }}>
            {note.title || "Untitled Note"}
          </Typography>

          {/* Collaborator Avatars */}
          {note.sharedWith && note.sharedWith.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                {note.sharedWith.map((uid) => {
                  const u = sharedUsersInfo[uid];
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
            <Box sx={{ width: "100%", mb: 3 }}>
              <Stack direction="row" display="flex" alignItems="center" spacing={1} useFlexGap flexWrap="wrap">
                {note.labels.map(label => (
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

          {/* Note Body Text */}
          <Box sx={{ pb: 10 }}>
            <ReactMarkdown components={mdComponents}>
              {note.content || "*No content saved on this note*"}
            </ReactMarkdown>
          </Box>

          {/* Glass floating toolbar */}
          <GlassActionToolbar
            mode={mode}
            isPinned={note.pinned}
            onEdit={() => {
              setNoteTitle(note.title);
              setNoteContent(note.content);
              titleInputRef.current = note.title;
              contentInputRef.current = note.content;
              setEditDrawerOpen(true);
              setDrawerOpen(true);
            }}
            onShare={() => setAddCollaboratorDrawerOpen(true)}
            onPin={() => handlePinNote(note)}
            onInfo={() => setDetailsDrawerOpen(true)}
            onDelete={() => {
              setDeleteDialogOpen(true);
            }}
          />

          {/* Edit Drawer (Same structure as original Notes page edit drawer) */}
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
                backgroundColor: theme.palette.background.default,
                p: 3,
                maxWidth: 480,
                height: "95vh",
                mx: "auto",
              },
            }}
          >
            <Box sx={{ display: "flex", flexDirection: "column", pb: 9 }}>
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2, mt: 4.5 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Typography variant="h6" fontWeight="bold" color="text.primary">
                    Edit Note
                  </Typography>
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
                </Box>
                <Button
                  variant="contained"
                  onClick={handleEditNote}
                  disabled={saving}
                  sx={{ borderRadius: 4, color: "#000", backgroundColor: theme.palette.primary.bgr, fontWeight: "bold", width: "110px", boxShadow: "none" }}
                >
                  {saving ? "Saving..." : "Save"}
                </Button>
              </Box>

              <TextField
                placeholder="Enter title..."
                value={noteTitle}
                onChange={(e) => {
                  setNoteTitle(e.target.value);
                  titleInputRef.current = e.target.value;
                }}
                fullWidth
                variant="standard"
                InputProps={{
                  disableUnderline: true,
                  sx: { fontSize: 22, fontWeight: 600, color: mode === "dark" ? "#fff" : "#000", mb: 1 },
                }}
              />

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

              <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
                <Button
                  variant={isPreview ? "contained" : "outlined"}
                  onClick={() => setIsPreview(!isPreview)}
                  sx={{
                    borderRadius: 4,
                    color: isPreview ? "#000" : "text.primary",
                    backgroundColor: isPreview ? theme.palette.primary.bgr : "transparent",
                    borderColor: mode === "dark" ? "#fff" : "#000",
                  }}
                >
                  {isPreview ? "Edit" : "Preview"}
                </Button>
              </Box>

              {isPreview ? (
                <Box sx={{ flex: 1, mb: 2, p: 2, border: `1px solid ${theme.palette.divider}`, borderRadius: 2, minHeight: 300 }}>
                  <ReactMarkdown
                    components={{
                      p: ({ children }) => <Typography variant="body1" sx={{ mb: 2, color: "text.primary", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{children}</Typography>,
                      h1: ({ children }) => <Typography variant="h4" sx={{ mb: 1, fontWeight: 'bold', color: "text.primary", whiteSpace: "pre-wrap" }}>{children}</Typography>,
                      h2: ({ children }) => <Typography variant="h5" sx={{ mb: 1, fontWeight: 'bold', color: "text.primary", whiteSpace: "pre-wrap" }}>{children}</Typography>,
                      h3: ({ children }) => <Typography variant="h6" sx={{ mb: 1, fontWeight: 'bold', color: "text.primary", whiteSpace: "pre-wrap" }}>{children}</Typography>,
                      ul: ({ children }) => <Box component="ul" sx={{ pl: 2, mb: 2, "& li": { whiteSpace: "pre-wrap", wordBreak: "break-word" } }}>{children}</Box>,
                      ol: ({ children }) => <Box component="ol" sx={{ pl: 2, mb: 2, "& li": { whiteSpace: "pre-wrap", wordBreak: "break-word" } }}>{children}</Box>,
                      li: ({ children }) => <Typography component="li" sx={{ color: "text.primary", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{children}</Typography>,
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
                  onChange={(e) => {
                    setNoteContent(e.target.value);
                    contentInputRef.current = e.target.value;
                  }}
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

          {/* Add Collaborator Drawer */}
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

          {/* Add Label Drawer */}
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

          {/* Details Drawer */}
          <SwipeableDrawer
            anchor="bottom"
            open={detailsDrawerOpen}
            fullWidth
            onClose={() => setDetailsDrawerOpen(false)}
            onOpen={() => {}}
            disableSwipeToOpen={true}
            disableDiscovery={true}
            transitionDuration={{ enter: 200, exit: 150 }}
            PaperProps={{
              sx: {
                borderRadius: 6,
                background: mode === "dark" ? "rgba(20, 20, 20, 0.85)" : "rgba(255, 255, 255, 0.9)",
                backgroundImage: "none",
                backdropFilter: "blur(20px)",
                p: 3,
                pt: 7.5,
                m: 2,
                height: "50vh",
                width: "80%",
                mx: "auto",
    boxShadow: theme.palette.mode === "dark"
      ? `
        inset 0 1px 2px rgba(255, 255, 255, 0.11),
        inset 0 -1px 1px rgba(35, 35, 35, 0.07)
      `
      : `
        inset 0 1px 1px rgba(255, 255, 255, 0.8),
        inset 0 -1px 1px rgba(0, 0, 0, 0.1)
      `
              },
            }}
          >
  <Typography variant="h6" fontWeight="800" sx={{ mb: 3, letterSpacing: "0.5px", textTransform: "uppercase", fontSize: "0.85rem", color: "text.secondary" }}>
    Note Details
  </Typography>

  <Box
    sx={{
      display: "grid",
      gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
      gap: 2,
    }}
  >

    {/* GROUP 1: Authors & Sharing (Created By + Collaborators Side-by-Side) */}
    <Box
      sx={{
        gridColumn: { sm: "span 2" },
        p: 2.5,
        borderRadius: 4,
        background: mode === "dark" ? "rgba(255, 255, 255, 0.01)" : "rgba(0, 0, 0, 0.01)",
        border: `1px solid ${mode === "dark" ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)"}`,
      }}
    >
      <Typography variant="subtitle2" sx={{ color: theme.palette.text.secondary, fontWeight: 700, mb: 2, textTransform: "uppercase", fontSize: "0.75rem", letterSpacing: "0.5px" }}>
        Authors & Sharing
      </Typography>
      
      <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, gap: 4 }}>
        {/* Created By Block */}
        <Box sx={{ flex: 1 }}>
          <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontWeight: 600, display: "block", mb: 1 }}>Created By:</Typography>
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

        {/* Collaborators Block */}
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
        </Box>
      </Box>
    </Box>

    {/* GROUP 2: Organization & Tags (Labels + Pinned Together) */}
    <Box>
      <Typography variant="subtitle2" sx={{ color: theme.palette.text.secondary, fontWeight: 700, mb: 2, px: 1, textTransform: "uppercase", fontSize: "0.75rem", letterSpacing: "0.5px" }}>
        Organization & Tags
      </Typography>

      <Box sx={{ display: "flex", flexDirection: "row", gap: 2, alignItems: { sm: "center" } }}>
        {/* Labels Block */}
        <Box sx={{ flex: 2,
        p: 2.5,
        borderRadius: 4,
        background: mode === "dark" ? "rgba(255, 255, 255, 0.01)" : "rgba(0, 0, 0, 0.01)",
        border: `1px solid ${mode === "dark" ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)"}`, }}>
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
                    fontSize: "0.75rem",
                    borderRadius: "8px",
                    fontWeight: 500,
                    color: mode === "dark" ? "#fff" : "#000",
                    background: mode === "dark" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
                  }}
                />
              ))
            ) : (
              <Typography variant="body2" sx={{ color: "text.disabled", fontStyle: "italic" }}>No labels assigned</Typography>
            )}
          </Stack>
        </Box>

        {/* Pinned Status Block */}
        <Box sx={{ flex: 1, 
        p: 2.5,
        borderRadius: 4,
        background: mode === "dark" ? "rgba(255, 255, 255, 0.01)" : "rgba(0, 0, 0, 0.01)",
        border: `1px solid ${mode === "dark" ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)"}`, }}>
          <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontWeight: 600, display: "block", mb: 1 }}>Status:</Typography>
          <Box 
            sx={{ 
              display: "inline-flex", 
              alignItems: "center", 
              gap: 1, 
              py: 0.5, 
              borderRadius: "12px",
            }}
          >
            <Typography variant="body2" sx={{ fontWeight: 700, color: note?.pinned ? "success.main" : "text.disabled", fontSize: 13 }}>
              {note?.pinned ? "📌 Pinned" : "Regular Note"}
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>

    {/* Timestamps & Identifiers (Footer elements) */}
    <Box
      sx={{
        p: 2,
        borderRadius: 3,
        background: mode === "dark" ? "rgba(255, 255, 255, 0.005)" : "rgba(0, 0, 0, 0.005)",
        border: `1px solid ${mode === "dark" ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)"}`,
      }}
    >
      <Typography variant="subtitle2" sx={{ color: theme.palette.text.secondary, fontWeight: 600, mb: 0.5 }}>Created At:</Typography>
      <Typography variant="body2" sx={{ fontWeight: 500, color: "text.primary" }}>
        {note?.createdAt?.toDate
          ? note.createdAt.toDate().toLocaleString()
          : note?.createdAt
            ? new Date(note.createdAt).toLocaleString()
            : "N/A"}
      </Typography>
    </Box>

    <Box
      sx={{
        p: 2,
        borderRadius: 3,
        background: mode === "dark" ? "rgba(255, 255, 255, 0.005)" : "rgba(0, 0, 0, 0.005)",
        border: `1px solid ${mode === "dark" ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)"}`,
      }}
    >
      <Typography variant="subtitle2" sx={{ color: theme.palette.text.secondary, fontWeight: 600, mb: 0.5 }}>Note ID:</Typography>
      <Typography variant="body2" sx={{ fontFamily: "monospace", color: "text.secondary", fontSize: "0.8rem" }}>
        {note?.id || "N/A"}
      </Typography>
    </Box>
  </Box>
          </SwipeableDrawer>

          {/* Delete Confirm Dialog */}
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
                <strong>{note?.title || "this note"}</strong>?
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
                  await handleDeleteNote(note.id);
                }}
                color="error"
                variant="contained"
                sx={{ backgroundColor: mode === "dark" ? "#700000ff" : "#ffd4d4", borderRadius: 4, color: mode === "dark" ? "#ffd4d4" : "#ff0000ff", boxShadow: "none", fontWeight: "bold" }}
              >
                Delete
              </Button>
            </DialogActions>
          </Dialog>
        </Box>
      </BetaAccessGuard>
    </ThemeProvider>
  );
};

export default NoteDetail;
