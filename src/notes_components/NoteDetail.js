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
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ShareIcon from "@mui/icons-material/Share";
import PushPinIcon from "@mui/icons-material/PushPin";
import LabelIcon from "@mui/icons-material/Label";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import ReactMarkdown from 'react-markdown';
import { db, auth } from "../firebase";
import {
  doc,
  onSnapshot,
  updateDoc,
  deleteDoc,
  getDoc,
} from "firebase/firestore";
import BetaAccessGuard from "../components/BetaAccessGuard";
import { useThemeToggle } from "../contexts/ThemeToggleContext";
import { getTheme } from "../theme";
import { useBackButtonClose } from "../hooks/useBackButtonClose";
import confetti from 'canvas-confetti';

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
      <Tooltip title="Share">
        <IconButton onClick={onShare} 
          sx={{
            p: 2,
            borderRadius: 8,
            backdropFilter: "blur(15px) saturate(180%)",
            WebkitBackdropFilter: "blur(15px) saturate(180%)",
            backgroundColor: mode === "dark" ? "#1d1d1d22" : "rgba(255, 255, 255, 0.75)",
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
        backgroundColor: mode === "dark" ? "#1d1d1d22" : "rgba(255, 255, 255, 0.75)",
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
                color: mode === "dark" ? "#52ff74" : "#00aa25",
                backgroundColor: mode === "dark" ? "rgba(82, 255, 116, 0.15) !important" : "rgba(0, 170, 37, 0.08) !important",
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
            backgroundColor: mode === "dark" ? "#1d1d1d22" : "rgba(255, 255, 255, 0.75)",
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
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [sharedUsersInfo, setSharedUsersInfo] = useState({});

  const collaboratorCacheRef = useRef({});
  const { mode, accent } = useThemeToggle();
  const theme = useMemo(() => getTheme(mode, accent), [mode, accent]);
  const mdComponents = useMemo(() => createMdComponents(mode), [mode]);

  useBackButtonClose(detailsDrawerOpen, () => setDetailsDrawerOpen(false));
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
          {/* Top Return Layer Controls */}
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

          <Box sx={{ pb: 10 }}>
            <ReactMarkdown components={mdComponents}>
              {note.content || "*No content saved on this note*"}
            </ReactMarkdown>
          </Box>

          {/* Core Action Command Dock */}
          <GlassActionToolbar
            mode={mode}
            isPinned={note.pinned}
            onEdit={() => navigate(`/notes/${note.id}/workspace`)} // Refactored directly to the new dedicated Workspace router endpoint setup
            onShare={() => setDetailsDrawerOpen(true)}
            onPin={() => handlePinNote(note)}
            onInfo={() => setDetailsDrawerOpen(true)}
            onDelete={() => setDeleteDialogOpen(true)}
          />

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
                  ? `inset 0 1px 2px rgba(255, 255, 255, 0.11), inset 0 -1px 1px rgba(35, 35, 35, 0.07)`
                  : `inset 0 1px 1px rgba(255,255,255,0.8), inset 0 -1px 1px rgba(0, 0, 0, 0.1)`
              },
            }}
          >
            <Typography variant="h6" fontWeight="800" sx={{ mb: 3, letterSpacing: "0.5px", textTransform: "uppercase", fontSize: "0.85rem", color: "text.secondary" }}>
              Note Details
            </Typography>

            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
              <Box sx={{ gridColumn: { sm: "span 2" }, p: 2.5, borderRadius: 4, background: mode === "dark" ? "rgba(255, 255, 255, 0.01)" : "rgba(0, 0, 0, 0.01)", border: `1px solid ${mode === "dark" ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)"}` }}>
                <Typography variant="subtitle2" sx={{ color: theme.palette.text.secondary, fontWeight: 700, mb: 2, textTransform: "uppercase", fontSize: "0.75rem", letterSpacing: "0.5px" }}>
                  Authors & Sharing
                </Typography>
                
                <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, gap: 4 }}>
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

              <Box>
                <Typography variant="subtitle2" sx={{ color: theme.palette.text.secondary, fontWeight: 700, mb: 2, px: 1, textTransform: "uppercase", fontSize: "0.75rem", letterSpacing: "0.5px" }}>
                  Organization & Tags
                </Typography>

                <Box sx={{ display: "flex", flexDirection: "row", gap: 2, alignItems: { sm: "center" } }}>
                  <Box sx={{ flex: 2, p: 2.5, borderRadius: 4, background: mode === "dark" ? "rgba(255, 255, 255, 0.01)" : "rgba(0, 0, 0, 0.01)", border: `1px solid ${mode === "dark" ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)"}` }}>
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

                  <Box sx={{ flex: 1, p: 2.5, borderRadius: 4, background: mode === "dark" ? "rgba(255, 255, 255, 0.01)" : "rgba(0, 0, 0, 0.01)", border: `1px solid ${mode === "dark" ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)"}` }}>
                    <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontWeight: 600, display: "block", mb: 1 }}>Status:</Typography>
                    <Box sx={{ display: "inline-flex", alignItems: "center", gap: 1, py: 0.5, borderRadius: "12px" }}>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: note?.pinned ? "success.main" : "text.disabled", fontSize: 13 }}>
                        {note?.pinned ? "📌 Pinned" : "Regular Note"}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Box>

              <Box sx={{ p: 2, borderRadius: 3, background: mode === "dark" ? "rgba(255, 255, 255, 0.005)" : "rgba(0, 0, 0, 0.005)", border: `1px solid ${mode === "dark" ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)"}` }}>
                <Typography variant="subtitle2" sx={{ color: theme.palette.text.secondary, fontWeight: 600, mb: 0.5 }}>Created At:</Typography>
                <Typography variant="body2" sx={{ fontWeight: 500, color: "text.primary" }}>
                  {note?.createdAt?.toDate
                    ? note.createdAt.toDate().toLocaleString()
                    : note?.createdAt
                      ? new Date(note.createdAt).toLocaleString()
                      : "N/A"}
                </Typography>
              </Box>

              <Box sx={{ p: 2, borderRadius: 3, background: mode === "dark" ? "rgba(255, 255, 255, 0.005)" : "rgba(0, 0, 0, 0.005)", border: `1px solid ${mode === "dark" ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)"}` }}>
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
                Are you sure you want to delete <strong>{note?.title || "this note"}</strong>?
              </Typography>
            </DialogContent>
            <DialogActions sx={{ mb: 2, mr: 2 }}>
              <Button 
                onClick={() => setDeleteDialogOpen(false)} 
                color="inherit" 
                variant="outlined" 
                sx={{ borderRadius: 4, fontWeight: "bold", backgroundColor: mode === "dark" ? "#f1f1f111" : "#e0e0e071", color: mode === "dark" ? "#fff" : "#000", boxShadow: "none" }}
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