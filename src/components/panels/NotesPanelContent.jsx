// src/components/panels/NotesPanelContent.jsx
import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Stack,
} from "@mui/material";
import {
  Add as AddIcon,
  PushPin as PinIcon,
} from "../../icons";
import { useAuth } from "../../hooks/useAuth";
import { useThemeToggle } from "../../contexts/ThemeToggleContext";
import { useDesktopPanel } from "../../contexts/DesktopPanelContext";
import { useNavigate } from "react-router-dom";
import { db } from "../../firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";

const NotesPanelContent = () => {
  const { user: currentUser } = useAuth();
  const { mode } = useThemeToggle();
  const isDark = mode === "dark";
  const { closePanel } = useDesktopPanel();
  const navigate = useNavigate();

  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser?.uid) return;
    const q = query(
      collection(db, "notes"),
      where("userId", "==", currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setNotes(list);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress size={28} />
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Typography variant="body2" sx={{ fontWeight: 700 }}>
          Your Notes ({notes.length})
        </Typography>
        <Button
          size="small"
          startIcon={<AddIcon sx={{ fontSize: 16 }} />}
          onClick={() => {
            closePanel();
            navigate("/notes");
          }}
          sx={{
            borderRadius: 2,
            textTransform: "none",
            fontWeight: 600,
            fontSize: "0.8rem",
          }}
        >
          New Note
        </Button>
      </Box>

      {notes.length === 0 ? (
        <Box
          sx={{
            p: 4,
            textAlign: "center",
            borderRadius: 3,
            backgroundColor: isDark
              ? "rgba(255, 255, 255, 0.03)"
              : "rgba(0, 0, 0, 0.02)",
            border: `1px solid ${
              isDark ? "rgba(255, 255, 255, 0.06)" : "rgba(0, 0, 0, 0.06)"
            }`,
          }}
        >
          <Typography variant="body2" sx={{ color: "text.secondary", mb: 1.5 }}>
            No notes written yet.
          </Typography>
          <Button
            variant="contained"
            size="small"
            onClick={() => {
              closePanel();
              navigate("/notes");
            }}
            sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600 }}
          >
            Create Your First Note
          </Button>
        </Box>
      ) : (
        <Stack spacing={1.5}>
          {notes.slice(0, 6).map((note) => (
            <Box
              key={note.id}
              onClick={() => {
                closePanel();
                navigate(`/notes/${note.id}`);
              }}
              sx={{
                p: 2,
                borderRadius: 3,
                cursor: "pointer",
                backgroundColor: isDark
                  ? "rgba(255, 255, 255, 0.04)"
                  : "rgba(0, 0, 0, 0.03)",
                border: `1px solid ${
                  isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.08)"
                }`,
                transition: "all 0.2s ease",
                "&:hover": {
                  backgroundColor: isDark
                    ? "rgba(255, 255, 255, 0.08)"
                    : "rgba(0, 0, 0, 0.06)",
                  transform: "translateX(2px)",
                },
              }}
            >
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 0.5 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                  {note.title || "Untitled Note"}
                </Typography>
                {note.pinned && <PinIcon sx={{ fontSize: 14, color: "primary.main" }} />}
              </Box>

              <Typography
                variant="body2"
                sx={{
                  color: isDark ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.6)",
                  fontSize: "0.82rem",
                  lineHeight: 1.3,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                }}
              >
                {note.content || "Empty note content"}
              </Typography>
            </Box>
          ))}
        </Stack>
      )}

      <Button
        fullWidth
        variant="outlined"
        onClick={() => {
          closePanel();
          navigate("/notes");
        }}
        sx={{
          borderRadius: 2.5,
          textTransform: "none",
          fontWeight: 600,
          mt: 1,
        }}
      >
        Open Full Notes Workspace
      </Button>
    </Box>
  );
};

export default NotesPanelContent;
