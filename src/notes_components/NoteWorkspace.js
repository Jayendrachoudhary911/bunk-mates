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
  ThemeProvider,
  Tooltip,
  Select,
  MenuItem,
  FormControl,
  SwipeableDrawer,
  Grow,
  InputAdornment,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Divider,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import FormatBoldIcon from "@mui/icons-material/FormatBold";
import FormatItalicIcon from "@mui/icons-material/FormatItalic";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import LabelOutlinedIcon from "@mui/icons-material/LabelOutlined";
import FormatListBulletedIcon from "@mui/icons-material/FormatListBulleted";
import FormatListNumberedIcon from "@mui/icons-material/FormatListNumbered";
import FormatQuoteIcon from "@mui/icons-material/FormatQuote";
import FontDownloadIcon from "@mui/icons-material/FontDownload";
import TextFieldsIcon from "@mui/icons-material/TextFields";
import CodeIcon from "@mui/icons-material/Code";
import TitleIcon from "@mui/icons-material/Title";
import SubtitlesIcon from "@mui/icons-material/Subtitles";
import ClosedCaptionIcon from "@mui/icons-material/ClosedCaption";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import SendIcon from "@mui/icons-material/Send";

import { db, auth } from "../firebase";
import {
  doc,
  onSnapshot,
  updateDoc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp,
  documentId,
} from "firebase/firestore";
import BetaAccessGuard from "../components/BetaAccessGuard";
import { useThemeToggle } from "../contexts/ThemeToggleContext";
import { getTheme } from "../theme";

// Glassmorphism design utility
const glass = (mode) => ({
  background:
    mode === "dark"
      ? "rgba(30, 30, 30, 0.08)"
      : "rgba(255, 255, 255, 0.07)",
  backdropFilter: "blur(10px)",
  border: "none",
  boxShadow:
    mode === "dark"
      ? `inset 0 1px 2px rgba(255, 255, 255, 0.11), inset 0 -1px 1px rgba(35, 35, 35, 0.07)`
      : `inset 0 1px 1px rgba(255,255,255,0.8), inset 0 -1px 1px rgba(0,0,0,0.1)`,
});

// Prompt Suggestions List
const PROMPT_SUGGESTIONS = [
  "Summarize the main points into key takeaways",
  "Fix grammar, improve tone, and refine flow",
  "Generate an outline with clear subheadings",
  "Convert key concepts into action items",
  "Expand on this note with detailed context",
];

const NoteWorkspace = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;

  const [loading, setLoading] = useState(isEditMode);
  const [user, setUser] = useState(null);
  const [currentNoteId, setCurrentNoteId] = useState(id || null);

  // User classification state
  const [userType, setUserType] = useState(null);

  // Form states
  const [noteTitle, setNoteTitle] = useState("");
  const [noteContent, setNoteContent] = useState("");
  const [noteLabels, setNoteLabels] = useState([]);
  const [collaborators, setCollaborators] = useState([]);
  const [fontStyle, setFontStyle] = useState("monospace");

  // Layout states
  const [showToolbar, setShowToolbar] = useState(false);
  const [layoutBar, setLayoutBar] = useState(false);

  // App context states
  const [labels, setLabels] = useState([]);
  const [saving, setSaving] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState("");

  // Input states for Drawers
  const [newLabelText, setNewLabelText] = useState("");
  const [searchCollaboratorQuery, setSearchCollaboratorQuery] = useState("");

  // Firebase database states
  const [friendsList, setFriendsList] = useState([]);
  const [loadingFriends, setLoadingFriends] = useState(false);

  // AI Assistant States
  const [aiDrawerOpen, setAiDrawerOpen] = useState(false);
  const [aiApiKey, setAiApiKey] = useState("");
  const [aiModel, setAiModel] = useState("qwen/qwen3.6-27b");
  const [availableModels, setAvailableModels] = useState([]);
  const [aiPrompt, setAiPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const noteContentRef = useRef(null);
  const autoSaveTimerRef = useRef(null);
  const titleInputRef = useRef("");
  const contentInputRef = useRef("");

  const mirrorScrollRef = useRef(null);
  const [collaboratorsDrawerOpen, setCollaboratorsDrawerOpen] = useState(false);
  const [labelsDrawerOpen, setLabelsDrawerOpen] = useState(false);

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

  // Strict Dev Beta check: Matches "Dev Beta", "dev_beta", "dev beta", or "dev"
  const isDevBeta = useMemo(() => {
    if (!userType) return false;
    const lower = userType.toString().trim().toLowerCase();
    return lower === "dev beta" || lower === "dev_beta" || lower === "dev";
  }, [userType]);

  // Lock scroll position when auto-adjusting textarea height
  useEffect(() => {
    const textarea = noteContentRef.current;
    if (textarea) {
      const currentScroll = window.scrollY;
      textarea.style.height = "auto";
      textarea.style.height = `${Math.max(
        textarea.scrollHeight,
        textarea.parentElement.clientHeight - 120
      )}px`;
      window.scrollTo(0, currentScroll);
    }
  }, [noteContent, fontStyle]);

  // Lock scroll position on click / focus inside the editor
  const handleEditorClickOrFocus = () => {
    const currentScroll = window.scrollY;
    requestAnimationFrame(() => {
      window.scrollTo(0, currentScroll);
    });
  };

  const { mode, accent } = useThemeToggle();
  const theme = useMemo(() => getTheme(mode, accent), [mode, accent]);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // Real-time listener for user document in Firestore to fetch type and Groq configurations
  useEffect(() => {
    if (!user) return;
    const userDocRef = doc(db, "users", user.uid);
    const unsubscribe = onSnapshot(
      userDocRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          // Read user type (e.g. "Dev Beta")
          setUserType(data.type || data.userType || null);

          if (data.groqApiKey) {
            setAiApiKey(data.groqApiKey);
          }
          if (data.groqModels && Array.isArray(data.groqModels) && data.groqModels.length > 0) {
            setAvailableModels(data.groqModels);
            setAiModel(data.groqModels[0]);
          }
        }
      },
      (err) => {
        console.error("Failed fetching user Firestore configurations:", err);
      }
    );
    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (!isEditMode || !id) return;

    const fetchNote = async () => {
      try {
        setLoading(true);
        const docSnap = await getDoc(doc(db, "notes", id));
        if (docSnap.exists()) {
          const data = docSnap.data();
          setNoteTitle(data.title || "");
          setNoteContent(data.content || "");
          setNoteLabels(data.labels || []);
          setCollaborators(data.sharedWith || []);
          if (data.fontStyle) setFontStyle(data.fontStyle);

          titleInputRef.current = data.title || "";
          contentInputRef.current = data.content || "";
        } else {
          console.warn("Target note context missing.");
          navigate("/notes");
        }
      } catch (err) {
        console.error("Error retrieving note context data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchNote();
  }, [id, isEditMode, navigate]);

  const handleTitleChange = (e) => {
    setNoteTitle(e.target.value);
    titleInputRef.current = e.target.value;
  };

  const handleFontChange = (e) => {
    setFontStyle(e.target.value);
  };

  // Fetch all existing labels applied across user notes
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "notes"), where("owners", "array-contains", user.uid));
    getDocs(q)
      .then((snapshot) => {
        const labelSet = new Set();
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          (data.labels || []).forEach((label) => {
            if (label !== "Shared") labelSet.add(label);
          });
        });
        setLabels(Array.from(labelSet).sort((a, b) => a.localeCompare(b)));
      })
      .catch(console.error);
  }, [user]);

  // Fetch friends list
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

  useEffect(() => {
    if (user) {
      fetchCurrentUsersFriends();
    }
  }, [user]);

  // Auto-save note
  useEffect(() => {
    if (!user) return;
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);

    autoSaveTimerRef.current = setTimeout(async () => {
      const finalTitle = titleInputRef.current;
      const finalContent = contentInputRef.current;

      if (!finalTitle.trim() && !finalContent.trim()) return;

      try {
        setAutoSaveStatus("saving");
        if (currentNoteId) {
          await updateDoc(doc(db, "notes", currentNoteId), {
            title: finalTitle,
            content: finalContent,
            sharedWith: collaborators,
            labels: noteLabels,
            fontStyle: fontStyle,
          });
        } else {
          const docRef = await addDoc(collection(db, "notes"), {
            title: finalTitle,
            content: finalContent,
            owners: [user.uid],
            sharedWith: collaborators,
            labels: noteLabels,
            pinned: false,
            fontStyle: fontStyle,
            createdAt: serverTimestamp(),
          });
          setCurrentNoteId(docRef.id);
          window.history.replaceState(null, "", `/notes/${docRef.id}/workspace`);
        }
        setAutoSaveStatus("saved");
        setTimeout(() => setAutoSaveStatus(""), 1500);
      } catch (error) {
        console.error("Auto-save operation exception fault:", error);
        setAutoSaveStatus("");
      }
    }, 1200);

    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    };
  }, [noteTitle, noteContent, currentNoteId, collaborators, noteLabels, user, fontStyle]);

  const handleSaveNote = useCallback(async () => {
    if (!user || (!noteTitle.trim() && !noteContent.trim())) return;
    setSaving(true);
    try {
      if (currentNoteId) {
        await updateDoc(doc(db, "notes", currentNoteId), {
          title: noteTitle,
          content: noteContent,
          sharedWith: collaborators,
          labels: noteLabels,
          fontStyle: fontStyle,
        });
      } else {
        await addDoc(collection(db, "notes"), {
          title: noteTitle,
          content: noteContent,
          owners: [user.uid],
          sharedWith: collaborators,
          labels: noteLabels,
          pinned: false,
          fontStyle: fontStyle,
          createdAt: serverTimestamp(),
        });
      }
      navigate(-1);
    } catch (error) {
      console.error("Manual transaction storage commit failure:", error);
    } finally {
      setSaving(false);
    }
  }, [currentNoteId, noteTitle, noteContent, collaborators, noteLabels, user, fontStyle, navigate]);

  const handleToggleLabelMemo = useCallback((label) => {
    setNoteLabels((prev) =>
      prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]
    );
  }, []);

  const handleAddNewLabel = () => {
    const sanitized = newLabelText.trim();
    if (!sanitized) return;
    if (!labels.includes(sanitized)) {
      setLabels((prev) => [...prev, sanitized].sort((a, b) => a.localeCompare(b)));
    }
    if (!noteLabels.includes(sanitized)) {
      setNoteLabels((prev) => [...prev, sanitized]);
    }
    setNewLabelText("");
  };

  const handleToggleCollaborator = (uid) => {
    setCollaborators((prev) =>
      prev.includes(uid) ? prev.filter((id) => id !== uid) : [...prev, uid]
    );
  };

  const filteredFriends = useMemo(() => {
    return friendsList.filter(
      (f) =>
        f.name.toLowerCase().includes(searchCollaboratorQuery.toLowerCase()) ||
        (f.email && f.email.toLowerCase().includes(searchCollaboratorQuery.toLowerCase()))
    );
  }, [friendsList, searchCollaboratorQuery]);

  const applyFormat = useCallback(
    (format) => {
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
        code: `\`${selected || "code"}\``,
        codeblock: `\`\`\`\n${selected || "code block"}\n\`\`\``,
        h1: `\n# ${selected || "Heading 1"}\n`,
        h2: `\n## ${selected || "Heading 2"}\n`,
        subtitle: `\n## ${selected || "Subtitle"}\n`,
        caption: `\n.[${selected || "Caption standard snippet text"}]\n`,
        listBulleted: `\n- ${selected || "List item"}`,
        listNumbered: `\n1. ${selected || "List item"}`,
        quote: `\n> ${selected || "Quote"}`,
      };

      const formatted = formatMap[format] || selected;
      const nextContent = before + formatted + after;
      setNoteContent(nextContent);
      contentInputRef.current = nextContent;

      requestAnimationFrame(() => {
        textarea.focus();
        const pos = before.length + formatted.length;
        textarea.setSelectionRange(pos, pos);
      });
    },
    [noteContent]
  );

  const handleSelectSuggestion = (suggestionText) => {
    setAiPrompt(suggestionText);
  };

  // Helper function to remove <think>...</think> reasoning blocks
  const stripReasoningProcess = (rawText) => {
    if (!rawText) return "";
    return rawText.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
  };

  // Generate / Enhance Note using Groq API
  const handleExecuteAiPrompt = async () => {
    if (!aiPrompt.trim()) return;
    if (!aiApiKey) {
      alert("No valid Groq API key found in your user profile.");
      return;
    }

    setIsGenerating(true);

    try {
      const systemInstruction =
        "You are a concise AI note assistant. Write clear, well-summarized, and fully completed Markdown notes. Do NOT leave responses unfinished or truncated in the middle, and do NOT include internal reasoning, thinking tags, or meta explanations.";

      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${aiApiKey}`,
        },
        body: JSON.stringify({
          model: aiModel || "qwen/qwen3.6-27b",
          messages: [
            { role: "system", content: systemInstruction },
            {
              role: "user",
              content: `Existing Context:\n"""\n${noteContent}\n"""\n\nInstruction: ${aiPrompt}\n\nProvide a concise, summary-focused, and completely finished note output.`,
            },
          ],
          temperature: 0.6,
          max_tokens: 2048,
        }),
      });

      if (!response.ok) {
        throw new Error(`Groq API Error: ${response.statusText}`);
      }

      const data = await response.json();
      let rawText = data.choices[0]?.message?.content || "";
      const cleanedResult = stripReasoningProcess(rawText);

      if (cleanedResult) {
        const updatedNoteContent = noteContent
          ? `${noteContent}\n\n${cleanedResult}`
          : cleanedResult;

        setNoteContent(updatedNoteContent);
        contentInputRef.current = updatedNoteContent;

        // Auto-generate title if missing or generic
        if (!noteTitle.trim() || noteTitle.toLowerCase().includes("untitled")) {
          try {
            const titleResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${aiApiKey}`,
              },
              body: JSON.stringify({
                model: aiModel || "qwen/qwen3.6-27b",
                messages: [
                  {
                    role: "system",
                    content: "Generate a 3-6 word short note title. Output ONLY the title.",
                  },
                  {
                    role: "user",
                    content: `Summarize a title for this note content:\n${updatedNoteContent}`,
                  },
                ],
                temperature: 0.5,
                max_tokens: 60,
              }),
            });

            if (titleResponse.ok) {
              const titleData = await titleResponse.json();
              const newTitle = stripReasoningProcess(
                titleData.choices[0]?.message?.content || ""
              ).replace(/^["']|["']$/g, "");
              if (newTitle) {
                setNoteTitle(newTitle);
                titleInputRef.current = newTitle;
              }
            }
          } catch (tErr) {
            console.error("Auto title generation failed:", tErr);
          }
        }
      }

      setAiPrompt("");
      setAiDrawerOpen(false);
    } catch (err) {
      console.error("AI Generation Error:", err);
      alert("Failed to generate content: " + err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  if (loading) {
    return (
      <ThemeProvider theme={theme}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "100vh",
            bgcolor: theme.palette.background.default,
          }}
        >
          <CircularProgress color="inherit" />
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
            px: 4,
            backgroundColor: theme.palette.background.default,
            color: theme.palette.text.primary,
            minHeight: "100vh",
            maxWidth: 700,
            mx: "auto",
            pb: 10,
            pt: 15,
            boxSizing: "border-box",
            position: "relative",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Top/Bottom Gradients */}
          <Box
            sx={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              height: 120,
              zIndex: 1100,
              pointerEvents: "none",
              background:
                mode === "dark"
                  ? `linear-gradient(to bottom, rgba(12,12,12,1) 0%, rgba(12,12,12,0.85) 25%, rgba(12,12,12,0.55) 60%, rgba(12,12,12,0.15) 85%, transparent 100%)`
                  : `linear-gradient(to bottom, rgba(255, 255,255,1) 0%, rgba(255,255,255,0.88) 25%, rgba(255,255,255,0.58) 60%, rgba(255,255,255,0.18) 85%, transparent 100%)`,
            }}
          />

          <Box
            sx={{
              position: "fixed",
              bottom: 0,
              left: 0,
              right: 0,
              height: 120,
              zIndex: 100,
              pointerEvents: "none",
              background:
                mode === "dark"
                  ? `linear-gradient(to top, rgba(12,12,12,1) 0%, rgba(12,12,12,0.85) 25%, rgba(12,12,12,0.55) 60%, rgba(12,12,12,0.15) 85%, transparent 100%)`
                  : `linear-gradient(to top, rgba(255,255,255,1) 0%, rgba(255,255,255,0.88) 25%, rgba(255,255,255,0.58) 60%, rgba(255,255,255,0.18) 85%, transparent 100%)`,
            }}
          />

          {/* Action Header Panel */}
          <Box
            sx={{
              position: "fixed",
              top: 52,
              left: 16,
              right: 16,
              zIndex: 1200,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              px: 1,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <IconButton
                onClick={() => navigate(-1)}
                sx={{
                  borderRadius: 8,
                  p: 1.5,
                  backdropFilter: "blur(10px)",
                  boxShadow:
                    theme.palette.mode === "dark"
                      ? `inset 0 1px 2px rgba(255, 255, 255, 0.11), inset 0 -1px 1px rgba(35, 35, 35, 0.07)`
                      : `inset 0 1px 1px rgba(255,255,255,0.8), inset 0 -1px 1px rgba(0, 0, 0, 0.1)`,
                  color: mode === "dark" ? "#fff" : "#000",
                  background: mode === "dark" ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
                  "&:hover": {
                    background: mode === "dark" ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)",
                  },
                }}
              >
                <ArrowBackIcon />
              </IconButton>

              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                  {isEditMode ? "Edit Note" : "Create Note"}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    display: "block",
                    mt: 0.3,
                    fontWeight: 600,
                    color:
                      saving || autoSaveStatus === "saving"
                        ? theme.palette.warning.main
                        : autoSaveStatus === "saved"
                        ? theme.palette.success.main
                        : "text.secondary",
                  }}
                >
                  {saving || autoSaveStatus === "saving"
                    ? "Saving..."
                    : autoSaveStatus === "saved"
                    ? "✓ Saved"
                    : ""}
                </Typography>
              </Box>
            </Box>

            <Button
              variant="contained"
              onClick={handleSaveNote}
              disabled={saving}
              sx={{
                borderRadius: 8,
                px: 3,
                py: 1.2,
                color: mode === "dark" ? "#fff" : "#000",
                background: mode === "dark" ? "rgba(255,255,255,0.06)" : "rgba(0, 0, 0, 0.04)",
                backdropFilter: "blur(10px)",
                boxShadow:
                  theme.palette.mode === "dark"
                    ? `inset 0 1px 2px rgba(255, 255, 255, 0.11), inset 0 -1px 1px rgba(35, 35, 35, 0.07)`
                    : `inset 0 1px 1px rgba(255,255,255,0.8), inset 0 -1px 1px rgba(0, 0, 0, 0.1)`,
                "&:hover": {
                  background: mode === "dark" ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.95)",
                },
              }}
            >
              {saving ? "Saving..." : "Save"}
            </Button>
          </Box>

          <Box
            sx={{
              position: "relative",
              flexGrow: 1,
              display: "flex",
              flexDirection: "column",
              minHeight: "60vh",
            }}
          >
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
                  fontSize: 30,
                  fontWeight: 600,
                  color: mode === "dark" ? "#fff" : "#111",
                  px: 0,
                  transition: "all .25s ease",
                  fontFamily: getFontFamily(fontStyle),
                  "& input::placeholder": { opacity: 0.5 },
                },
              }}
            />

            {/* Labels View Wrapper List */}
            <Box
              sx={{
                display: "flex",
                gap: 1,
                mt: 1,
                mb: 2,
                flexWrap: "wrap",
                alignItems: "center",
              }}
            >
              {noteLabels.map((label) => (
                <Chip
                  key={`attached-${label}`}
                  label={label}
                  onClick={() => handleToggleLabelMemo(label)}
                  size="small"
                  variant="filled"
                  sx={{
                    px: 0.5,
                    height: 30,
                    borderRadius: 6,
                    fontWeight: 600,
                    transition: "all .25s ease",
                    border: 0,
                    color: mode === "dark" ? "#000" : "#fff",
                    backgroundColor: mode === "dark" ? "#ffffff" : "rgba(21, 21, 21, 0.86)",
                    boxShadow:
                      mode === "dark"
                        ? `inset 0 1px 1px rgba(52, 52, 52, 0.96), inset 0 -1px 1px rgba(31, 31, 31, 0.68)`
                        : `inset 0 1px 2px rgba(255, 255, 255, 0.11), inset 0 -1px 1px rgba(35, 35, 35, 0.07)`,
                    "&:hover": {
                      transform: "translateY(-2px)",
                      background: theme.palette.primary.dark,
                    },
                  }}
                />
              ))}

              {labels
                .filter((label) => !noteLabels.includes(label))
                .slice(0, 4)
                .map((label) => (
                  <Chip
                    key={`suggested-${label}`}
                    label={label}
                    onClick={() => handleToggleLabelMemo(label)}
                    size="small"
                    variant="outlined"
                    sx={{
                      px: 0.5,
                      height: 30,
                      borderRadius: 6,
                      fontWeight: 600,
                      transition: "all .25s ease",
                      color: mode === "dark" ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.6)",
                      borderStyle: "dashed",
                      background: "transparent",
                      "&:hover": {
                        transform: "translateY(-2px)",
                        background:
                          mode === "dark" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.04)",
                      },
                    }}
                  />
                ))}

              <Chip
                label="+"
                onClick={() => setLabelsDrawerOpen(true)}
                size="small"
                variant="outlined"
                sx={{
                  height: 30,
                  borderRadius: 6,
                  fontWeight: 700,
                  color: theme.palette.text.main,
                  background:
                    mode === "dark" ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.8)",
                  backdropFilter: "blur(10px)",
                  boxShadow:
                    theme.palette.mode === "dark"
                      ? `inset 0 1px 2px rgba(255, 255, 255, 0.11), inset 0 -1px 1px rgba(35, 35, 35, 0.07)`
                      : `inset 0 1px 1px rgba(255,255,255,0.8), inset 0 -1px 1px rgba(0, 0, 0, 0.1)`,
                  cursor: "pointer",
                  transition: "all .2s ease",
                  "& .MuiChip-label": { px: 1.5 },
                }}
              />
            </Box>

            {/* Note Editor Canvas */}
            <TextField
              placeholder="Start writing your note..."
              value={noteContent}
              onChange={(e) => {
                setNoteContent(e.target.value);
                contentInputRef.current = e.target.value;
              }}
              onClick={handleEditorClickOrFocus}
              onFocus={handleEditorClickOrFocus}
              fullWidth
              multiline
              minRows={12}
              variant="standard"
              inputRef={noteContentRef}
              InputProps={{ disableUnderline: true }}
              sx={{
                flex: 1,
                mb: 2,
                py: 2,
                "& .MuiInputBase-root": {
                  color: mode === "dark" ? "#f3f4f6" : "#1f2937",
                  fontFamily: getFontFamily(fontStyle),
                  fontSize: "1.05rem",
                  lineHeight: 1.65,
                  letterSpacing: "0.005em",
                  alignItems: "flex-start",
                },
                "& .MuiInputBase-input": { padding: 0, margin: 0, whiteSpace: "pre-wrap" },
                "& .MuiInputBase-input::placeholder": {
                  color: mode === "dark" ? "#4b5563" : "#9ca3af",
                  opacity: 1,
                  fontStyle: "normal",
                  letterSpacing: "0.01em",
                },
              }}
            />
          </Box>

          {/* Bottom Toolbar & Action Bar */}
          <Box
            sx={{
              position: "fixed",
              bottom: 24,
              left: 24,
              right: 24,
              maxWidth: 652,
              mx: "auto",
              zIndex: 100,
              display: "flex",
              flexDirection: "column",
              gap: 1.5,
              pointerEvents: "none",
              "& > *": { pointerEvents: "auto" },
            }}
          >
            {/* Side Element Bar */}
            <Grow in={Boolean(layoutBar)} timeout={{ enter: 450, exit: 250 }} unmountOnExit>
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 1.5,
                  position: "absolute",
                  right: 0,
                  bottom: 120,
                  width: 20,
                  borderRadius: 2.5,
                  p: 0.5,
                  height: "auto",
                  alignItems: "center",
                  boxShadow: "none",
                  transformOrigin: "right bottom",
                  transition:
                    "transform 0.3s cubic-bezier(0.25, 1, 0.5, 1), opacity 0.25s linear",
                  "@keyframes buttonPop": {
                    "0%": { transform: "scale(0.4) translateY(20px)", opacity: 0 },
                    "70%": { transform: "scale(1.1) translateY(-3px)" },
                    "100%": { transform: "scale(1) translateY(0)", opacity: 1 },
                  },
                }}
              >
                {[
                  { title: "Heading 1", type: "h1", icon: <TitleIcon fontSize="small" />, delay: "0ms" },
                  {
                    title: "Heading 2",
                    type: "h2",
                    icon: <TitleIcon fontSize="small" style={{ transform: "scale(0.85)" }} />,
                    delay: "40ms",
                  },
                  {
                    title: "Subtitle",
                    type: "subtitle",
                    icon: <SubtitlesIcon fontSize="small" />,
                    delay: "80ms",
                  },
                  {
                    title: "Caption",
                    type: "caption",
                    icon: <ClosedCaptionIcon fontSize="small" />,
                    delay: "120ms",
                  },
                  {
                    title: "Inline Code",
                    type: "code",
                    icon: <CodeIcon fontSize="small" />,
                    delay: "160ms",
                  },
                  {
                    title: "Code Block",
                    type: "codeblock",
                    icon: <CodeIcon fontSize="small" style={{ transform: "scale(1.2)" }} />,
                    delay: "200ms",
                  },
                ].map((btn) => (
                  <Tooltip key={btn.type} title={btn.title}>
                    <IconButton
                      onClick={() => applyFormat(btn.type)}
                      size="small"
                      sx={{
                        backdropFilter: "blur(20px) saturate(200%)",
                        WebkitBackdropFilter: "blur(20px) saturate(200%)",
                        borderRadius: 6,
                        background:
                          mode === "dark" ? "rgba(171, 171, 171, 0.08)" : "rgba(230, 230, 230, 0.29)",
                        p: 1.3,
                        boxShadow:
                          theme.palette.mode === "dark"
                            ? `inset 0 1px 2px rgba(255, 255, 255, 0.11), inset 0 -1px 1px rgba(35, 35, 35, 0.07)`
                            : `inset 0 1px 1px rgba(255,255,255,0.8), inset 0 -1px 1px rgba(0, 0, 0, 0.1)`,
                        animation: `buttonPop 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) ${btn.delay} backwards`,
                        transition:
                          "transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.575), background-color 0.2s",
                        "&:hover": {
                          transform: "scale(1.18) translateY(-2px)",
                          background:
                            mode === "dark"
                              ? "rgba(40, 40, 40, 0.95)"
                              : "rgba(240, 240, 240, 0.95)",
                        },
                        "&:active": { transform: "scale(0.92) translateY(1px)" },
                      }}
                    >
                      {btn.icon}
                    </IconButton>
                  </Tooltip>
                ))}
              </Box>
            </Grow>

            {/* Main Formatting Toolbar */}
            <Grow in={Boolean(showToolbar)} timeout={200} unmountOnExit>
              <Box display="flex" justifyContent="center" sx={{ transformOrigin: "center bottom" }}>
                <Stack
                  direction="row"
                  spacing={1.5}
                  sx={{
                    borderRadius: 6,
                    background:
                      mode === "dark" ? "rgba(20, 20, 20, 0.08)" : "rgba(255, 255, 255, 0.29)",
                    p: 1,
                    backdropFilter: "blur(10px) saturate(200%)",
                    WebkitBackdropFilter: "blur(10px) saturate(200%)",
                    alignItems: "center",
                    boxShadow:
                      theme.palette.mode === "dark"
                        ? `inset 0 1px 2px rgba(255, 255, 255, 0.11), inset 0 -1px 1px rgba(35, 35, 35, 0.07)`
                        : `inset 0 1px 1px rgba(255,255,255,0.8), inset 0 -1px 1px rgba(0, 0, 0, 0.1)`,
                  }}
                >
                  <Tooltip title="Bold (Ctrl+B)">
                    <IconButton size="small" onClick={() => applyFormat("bold")}>
                      <FormatBoldIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Italic (Ctrl+I)">
                    <IconButton size="small" onClick={() => applyFormat("italic")}>
                      <FormatItalicIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Bullet List">
                    <IconButton size="small" onClick={() => applyFormat("listBulleted")}>
                      <FormatListBulletedIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Numbered List">
                    <IconButton size="small" onClick={() => applyFormat("listNumbered")}>
                      <FormatListNumberedIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Quote">
                    <IconButton size="small" onClick={() => applyFormat("quote")}>
                      <FormatQuoteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>

                  <Box
                    sx={{
                      height: 24,
                      borderLeft: "1px solid rgba(255,255,255,0.15)",
                      mx: 0.5,
                    }}
                  />
                  <FormControl size="small" variant="standard">
                    <Select
                      value={fontStyle}
                      onChange={handleFontChange}
                      disableUnderline
                      IconComponent={FontDownloadIcon}
                      renderValue={(selected) => (
                        <Typography
                          variant="caption"
                          sx={{ textTransform: "capitalize", fontWeight: 600, px: 0.5 }}
                        >
                          {selected}
                        </Typography>
                      )}
                      sx={{
                        color: "text.primary",
                        fontSize: "0.75rem",
                        "& .MuiSelect-icon": {
                          fontSize: "1rem",
                          right: 4,
                          color:
                            mode === "dark" ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)",
                        },
                        "& .MuiSelect-select": {
                          pr: "24px !important",
                          pl: 1,
                          py: 0.5,
                          display: "flex",
                          alignItems: "center",
                        },
                      }}
                    >
                      <MenuItem
                        value="monospace"
                        style={{ fontFamily: getFontFamily("monospace") }}
                      >
                        Monospace
                      </MenuItem>
                      <MenuItem value="sans" style={{ fontFamily: getFontFamily("sans") }}>
                        Sans-Serif
                      </MenuItem>
                      <MenuItem value="serif" style={{ fontFamily: getFontFamily("serif") }}>
                        Serif
                      </MenuItem>
                      <MenuItem
                        value="dyslexic"
                        style={{ fontFamily: getFontFamily("dyslexic") }}
                      >
                        OpenDyslexic
                      </MenuItem>
                    </Select>
                  </FormControl>
                </Stack>
              </Box>
            </Grow>

            {/* Sticky Footer Shortcuts Bar */}
            <Box
              sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
            >
              <Stack
                direction="row"
                spacing={1}
                sx={{
                  ...glass(mode),
                  p: 1,
                  borderRadius: 8,
                  backgroundColor: showToolbar
                    ? mode === "dark"
                      ? "rgba(255, 255, 255, 0.81)"
                      : "rgba(0, 0, 0, 0.83)"
                    : "transparent",
                }}
              >
                <Tooltip title="Formatting Controls">
                  <IconButton
                    size="small"
                    onClick={() => {
                      setShowToolbar(!showToolbar);
                      setLayoutBar(!layoutBar);
                    }}
                    sx={{ color: showToolbar ? theme.palette.primary.main : "inherit" }}
                  >
                    <TextFieldsIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Stack>

              <Stack direction="row" spacing={1} sx={{ ...glass(mode), p: 1, borderRadius: 8 }}>
                {/* AI Assistant Drawer Trigger (Dev Beta users only) */}
                {isDevBeta && (
                  <Tooltip title="Write with AI">
                    <IconButton
                      size="small"
                      sx={{ p: 1, color: theme.palette.primary.main }}
                      onClick={() => setAiDrawerOpen(true)}
                    >
                      <AutoAwesomeIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}

                <IconButton
                  size="small"
                  sx={{ p: 1 }}
                  onClick={() => {
                    setCollaboratorsDrawerOpen(true);
                    fetchCurrentUsersFriends();
                  }}
                >
                  <PersonAddIcon fontSize="small" />
                </IconButton>
                <IconButton
                  size="small"
                  sx={{ p: 1 }}
                  onClick={() => setLabelsDrawerOpen(true)}
                >
                  <LabelOutlinedIcon fontSize="small" />
                </IconButton>
              </Stack>

              {/* AI WRITING ASSISTANT DRAWER (Dev Beta users only) */}
              {isDevBeta && (
                <SwipeableDrawer
                  anchor="bottom"
                  open={aiDrawerOpen}
                  onClose={() => setAiDrawerOpen(false)}
                  onOpen={() => {}}
                  disableSwipeToOpen
                  PaperProps={{
                    sx: {
                      borderRadius: 8,
                      p: 4,
                      pt: 2,
                      minHeight: "45vh",
                      maxHeight: "85vh",
                      background:
                        mode === "dark" ? "rgba(20,20,20,0.85)" : "rgba(255,255,255,0.85)",
                      backdropFilter: "blur(20px)",
                      boxShadow:
                        theme.palette.mode === "dark"
                          ? `inset 0 1px 2px rgba(255, 255, 255, 0.11), inset 0 -1px 1px rgba(35, 35, 35, 0.07)`
                          : `inset 0 1px 1px rgba(255,255,255,0.8), inset 0 -1px 1px rgba(0, 0, 0, 0.1)`,
                      mx: "auto",
                      m: 2,
                    },
                  }}
                  ModalProps={{
                    BackdropProps: {
                      sx: {
                        backdropFilter: "blur(10px)",
                        backgroundColor: "rgba(0,0,0,0.2)",
                      },
                    },
                  }}
                >
                  <Box sx={{ display: "flex", justifyContent: "center", pb: 2 }}>
                    <Box
                      sx={{
                        width: 60,
                        height: 5,
                        borderRadius: 999,
                        background: mode === "dark" ? "#f1f1f127" : "#0c0c0c3e",
                        cursor: "grab",
                      }}
                    />
                  </Box>

                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      mb: 2,
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <AutoAwesomeIcon color="primary" />
                      <Typography variant="h6" fontWeight={700}>
                        AI Note Assistant
                      </Typography>
                    </Box>

                    {/* Model Selector Dropdown */}
                    {availableModels.length > 0 && (
                      <FormControl size="small" variant="outlined">
                        <Select
                          value={aiModel}
                          onChange={(e) => setAiModel(e.target.value)}
                          sx={{
                            borderRadius: 4,
                            fontSize: "0.8rem",
                            fontWeight: 600,
                            height: 32,
                          }}
                        >
                          {availableModels.map((m) => (
                            <MenuItem key={m} value={m}>
                              {m}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    )}
                  </Box>

                  {/* Prompt Suggestions */}
                  <Typography variant="caption" fontWeight={600} color="text.secondary" mb={1}>
                    Prompt Suggestions (Tap to fill prompt)
                  </Typography>
                  <Box
                    sx={{
                      display: "flex",
                      gap: 1,
                      flexWrap: "wrap",
                      mb: 3,
                      maxHeight: 120,
                      overflowY: "auto",
                    }}
                  >
                    {PROMPT_SUGGESTIONS.map((suggestion, idx) => (
                      <Chip
                        key={idx}
                        label={suggestion}
                        onClick={() => handleSelectSuggestion(suggestion)}
                        variant="outlined"
                        size="small"
                        sx={{
                          borderRadius: 4,
                          fontWeight: 500,
                          cursor: "pointer",
                          background:
                            mode === "dark" ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)",
                          "&:hover": {
                            background:
                              mode === "dark" ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)",
                          },
                        }}
                      />
                    ))}
                  </Box>

                  <Divider sx={{ mb: 2 }} />

                  {/* Prompt Textfield & Execute Button */}
                  <Box sx={{ display: "flex", gap: 1, alignItems: "flex-end" }}>
                    <TextField
                      placeholder="Ask AI to expand, edit, or write notes..."
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleExecuteAiPrompt();
                        }
                      }}
                      multiline
                      maxRows={4}
                      fullWidth
                      variant="outlined"
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          borderRadius: 4,
                          backgroundColor:
                            mode === "dark" ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.02)",
                        },
                      }}
                    />

                    <IconButton
                      onClick={handleExecuteAiPrompt}
                      disabled={isGenerating || !aiPrompt.trim()}
                      color="primary"
                      sx={{
                        p: 1.5,
                        borderRadius: 4,
                        background: mode === "dark" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)",
                      }}
                    >
                      {isGenerating ? (
                        <CircularProgress size={24} color="inherit" />
                      ) : (
                        <SendIcon />
                      )}
                    </IconButton>
                  </Box>
                </SwipeableDrawer>
              )}

              {/* COLLABORATORS DRAWER */}
              <SwipeableDrawer
                anchor="bottom"
                open={collaboratorsDrawerOpen}
                onClose={() => {
                  setCollaboratorsDrawerOpen(false);
                  setSearchCollaboratorQuery("");
                }}
                onOpen={() => {}}
                disableSwipeToOpen
                PaperProps={{
                  sx: {
                    borderRadius: 8,
                    p: 4,
                    pt: 2,
                    minHeight: "50vh",
                    maxHeight: "80vh",
                    background:
                      mode === "dark" ? "rgba(20,20,20,0.08)" : "rgba(255,255,255,0.39)",
                    backdropFilter: "blur(20px)",
                    boxShadow:
                      theme.palette.mode === "dark"
                        ? `inset 0 1px 2px rgba(255, 255, 255, 0.11), inset 0 -1px 1px rgba(35, 35, 35, 0.07)`
                        : `inset 0 1px 1px rgba(255,255,255,0.8), inset 0 -1px 1px rgba(0, 0, 0, 0.1)`,
                    mx: "auto",
                    m: 2,
                  },
                }}
                ModalProps={{
                  BackdropProps: {
                    sx: {
                      backdropFilter: "blur(10px)",
                      backgroundColor: "rgba(0,0,0,0)",
                    },
                  },
                }}
              >
                <Box sx={{ display: "flex", justifyContent: "center", py: -1.5, pb: 3 }}>
                  <Box
                    sx={{
                      width: 60,
                      height: 5,
                      borderRadius: 999,
                      background: mode === "dark" ? "#f1f1f127" : "#0c0c0c3e",
                      backdropFilter: "blur(12px)",
                      cursor: "grab",
                      transition: "all .25s ease",
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
                    width: "100%",
                    mb: 2,
                    "& .MuiOutlinedInput-root": {
                      color: mode === "dark" ? "#fff" : "#111",
                      borderRadius: 3,
                      backgroundColor:
                        mode === "dark" ? "rgba(255, 255, 255, 0.03)" : "rgba(0, 0, 0, 0.02)",
                      boxShadow:
                        mode === "dark"
                          ? `inset 0 1px 2px rgba(255, 255, 255, 0.11), inset 0 -1px 1px rgba(35, 35, 35, 0.07)`
                          : `inset 0 1px 1px rgba(255,255,255,0.8), inset 0 -1px 1px rgba(0,0,0,0.1)`,
                      border: "0px solid",
                      borderColor:
                        mode === "dark" ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.06)",
                      transition: "all 0.2s ease-in-out",
                      "& fieldset": { border: "none" },
                      "&:hover": {
                        backgroundColor:
                          mode === "dark" ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.05)",
                        borderColor:
                          mode === "dark" ? "rgba(255, 255, 255, 0.18)" : "rgba(0, 0, 0, 0.12)",
                      },
                      "&.Mui-focused": {
                        backgroundColor:
                          mode === "dark" ? "rgba(255, 255, 255, 0.04)" : "rgba(255, 255, 255, 0.8)",
                        borderColor: mode === "dark" ? "rgba(255, 255, 255, 0)" : "primary.main",
                        boxShadow:
                          mode === "dark"
                            ? `0 0 0 3px rgba(255, 255, 255, 0.05)`
                            : `0 0 0 3px rgba(25, 118, 210, 0.15)`,
                      },
                    },
                    "& .MuiOutlinedInput-input": {
                      py: 1.2,
                      fontSize: "0.9rem",
                      color: mode === "dark" ? "rgba(255, 255, 255, 0.9)" : "rgba(0, 0, 0, 0.85)",
                      "&::placeholder": {
                        color:
                          mode === "dark" ? "rgba(255, 255, 255, 0.4)" : "rgba(0, 0, 0, 0.4)",
                        opacity: 1,
                      },
                    },
                  }}
                />

                {loadingFriends ? (
                  <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                    <CircularProgress size={28} color="inherit" />
                  </Box>
                ) : (
                  <List dense sx={{ width: "100%", maxHeight: "50vh", overflowY: "auto" }}>
                    {filteredFriends.length > 0 ? (
                      filteredFriends.map((friend) => {
                        const isAdded = collaborators.includes(friend.uid);
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
                                  background:
                                    mode === "dark"
                                      ? "rgba(255,255,255,0.08)"
                                      : "rgba(255,255,255,0.8)",
                                  backdropFilter: "blur(10px)",
                                  boxShadow:
                                    theme.palette.mode === "dark"
                                      ? `inset 0 1px 2px rgba(255, 255, 255, 0.11), inset 0 -1px 1px rgba(35, 35, 35, 0.07)`
                                      : `inset 0 1px 1px rgba(255,255,255,0.8), inset 0 -1px 1px rgba(0, 0, 0, 0.1)`,
                                  "&:hover": {
                                    backgroundColor: isAdded
                                      ? "rgba(46, 125, 50, 0.2)"
                                      : mode === "dark"
                                      ? "rgba(255,255,255,0.1)"
                                      : "rgba(0,0,0,0.08)",
                                  },
                                }}
                              >
                                {isAdded ? (
                                  <Box
                                    sx={{ display: "flex", alignItems: "center", gap: 0.5, px: 0.5 }}
                                  >
                                    <span style={{ fontSize: "0.75rem", fontWeight: 700 }}>
                                      Added
                                    </span>
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
                                sx={{
                                  width: 40,
                                  height: 40,
                                  fontWeight: 700,
                                  bgcolor: theme.palette.primary.main,
                                  color: mode === "dark" ? "#000" : "#fff",
                                }}
                              >
                                {friend.name.charAt(0).toUpperCase()}
                              </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                              primary={friend.name}
                              secondary={friend.username}
                              primaryTypographyProps={{ fontWeight: 600, sx: { pl: 1 } }}
                              secondaryTypographyProps={{ sx: { pl: 1 } }}
                            />
                          </ListItem>
                        );
                      })
                    ) : (
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mt: 2, fontStyle: "italic", textAlign: "center" }}
                      >
                        {friendsList.length === 0
                          ? "You haven't added any friends to your account yet."
                          : "No friends match your search criterion."}
                      </Typography>
                    )}
                  </List>
                )}
              </SwipeableDrawer>

              {/* LABELS DRAWER */}
              <SwipeableDrawer
                anchor="bottom"
                open={labelsDrawerOpen}
                onClose={() => {
                  setLabelsDrawerOpen(false);
                  setNewLabelText("");
                }}
                onOpen={() => {}}
                disableSwipeToOpen
                PaperProps={{
                  sx: {
                    borderRadius: 8,
                    p: 4,
                    pt: 2,
                    minHeight: "20vh",
                    maxHeight: "40vh",
                    background:
                      mode === "dark" ? "rgba(20,20,20,0.08)" : "rgba(255,255,255,0.39)",
                    backdropFilter: "blur(20px)",
                    boxShadow:
                      theme.palette.mode === "dark"
                        ? `inset 0 1px 2px rgba(255, 255, 255, 0.11), inset 0 -1px 1px rgba(35, 35, 35, 0.07)`
                        : `inset 0 1px 1px rgba(255,255,255,0.8), inset 0 -1px 1px rgba(0, 0, 0, 0.1)`,
                    mx: "auto",
                    m: 2,
                  },
                }}
                ModalProps={{
                  BackdropProps: {
                    sx: {
                      backdropFilter: "blur(10px)",
                      backgroundColor: "rgba(0,0,0,0)",
                    },
                  },
                }}
              >
                <Box sx={{ display: "flex", justifyContent: "center", py: -1.5, pb: 3 }}>
                  <Box
                    sx={{
                      width: 60,
                      height: 5,
                      borderRadius: 999,
                      background: mode === "dark" ? "#f1f1f127" : "#0c0c0c3e",
                      backdropFilter: "blur(12px)",
                      cursor: "grab",
                      transition: "all .25s ease",
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
                    onKeyDown={(e) => e.key === "Enter" && handleAddNewLabel()}
                    variant="outlined"
                    size="small"
                    fullWidth
                    sx={{
                      width: "100%",
                      "& .MuiOutlinedInput-root": {
                        color: mode === "dark" ? "#fff" : "#111",
                        borderRadius: 3,
                        backdropFilter: "blur(10px)",
                        WebkitBackdropFilter: "blur(10px)",
                        backgroundColor:
                          mode === "dark" ? "rgba(255, 255, 255, 0)" : "rgba(0, 0, 0, 0.03)",
                        boxShadow:
                          mode === "dark"
                            ? `inset 0 1px 2px rgba(255, 255, 255, 0.11), inset 0 -1px 1px rgba(35, 35, 35, 0.07)`
                            : `inset 0 1px 1px rgba(255,255,255,0.8), inset 0 -1px 1px rgba(0,0,0,0.1)`,
                        border: "0.1px solid",
                        borderColor:
                          mode === "dark" ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.06)",
                        transition: "all 0.2s ease-in-out",
                        "& fieldset": { border: "none" },
                        "&:hover": {
                          backgroundColor:
                            mode === "dark" ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.05)",
                          borderColor:
                            mode === "dark" ? "rgba(255, 255, 255, 0.18)" : "rgba(0, 0, 0, 0.12)",
                        },
                        "&.Mui-focused": {
                          backgroundColor:
                            mode === "dark"
                              ? "rgba(255, 255, 255, 0.04)"
                              : "rgba(255, 255, 255, 0.8)",
                          borderColor: mode === "dark" ? "rgba(255, 255, 255, 0)" : "primary.main",
                          boxShadow:
                            mode === "dark"
                              ? `0 0 0 3px rgba(255, 255, 255, 0.05)`
                              : `0 0 0 3px rgba(25, 118, 210, 0.15)`,
                        },
                      },
                      "& .MuiOutlinedInput-input": {
                        py: 1.2,
                        fontSize: "0.9rem",
                        color: mode === "dark" ? "rgba(255, 255, 255, 0.9)" : "rgba(0, 0, 0, 0.85)",
                        "&::placeholder": {
                          color:
                            mode === "dark" ? "rgba(255, 255, 255, 0.4)" : "rgba(0, 0, 0, 0.4)",
                          opacity: 1,
                        },
                      },
                    }}
                  />
                  <IconButton
                    onClick={handleAddNewLabel}
                    color="primary"
                    disabled={!newLabelText.trim()}
                    sx={{
                      color: mode === "dark" ? "#fff" : "#000",
                      background:
                        mode === "dark" ? "rgba(255, 255, 255, 0.18)" : "rgba(255,255,255,0.8)",
                      backdropFilter: "blur(10px)",
                      boxShadow:
                        theme.palette.mode === "dark"
                          ? `inset 0 1px 2px rgba(255, 255, 255, 0.11), inset 0 -1px 1px rgba(35, 35, 35, 0.07)`
                          : `inset 0 1px 1px rgba(255,255,255,0.8), inset 0 -1px 1px rgba(0, 0, 0, 0.1)`,
                      borderRadius: 8,
                    }}
                  >
                    <AddIcon />
                  </IconButton>
                </Box>

                <Typography variant="subtitle2" fontWeight={600} mb={1.5} color="text.secondary">
                  Your Labels Collection
                </Typography>

                <Box
                  sx={{
                    display: "flex",
                    gap: 1,
                    flexWrap: "wrap",
                    maxHeight: "35vh",
                    overflowY: "auto",
                  }}
                >
                  {labels.length > 0 ? (
                    labels.map((label) => {
                      const isSelected = noteLabels.includes(label);
                      return (
                        <Chip
                          key={label}
                          label={label}
                          onClick={() => handleToggleLabelMemo(label)}
                          variant={isSelected ? "filled" : "outlined"}
                          sx={{
                            borderRadius: 6,
                            px: 0.5,
                            fontWeight: 600,
                            border: 0,
                            color: isSelected
                              ? mode === "dark"
                                ? "#000"
                                : "#fff"
                              : "text.primary",
                            backgroundColor: isSelected
                              ? mode === "dark"
                                ? "#ffffff"
                                : "rgba(21, 21, 21, 0.86)"
                              : mode === "dark"
                              ? "rgba(255,255,255,0.08)"
                              : "rgba(255,255,255,0.8)",
                            boxShadow: isSelected
                              ? mode === "dark"
                                ? `inset 0 1px 1px rgba(52, 52, 52, 0.96), inset 0 -1px 1px rgba(31, 31, 31, 0.68)`
                                : `inset 0 1px 2px rgba(255, 255, 255, 0.11), inset 0 -1px 1px rgba(35, 35, 35, 0.07)`
                              : mode === "dark"
                              ? `inset 0 1px 2px rgba(255, 255, 255, 0.11), inset 0 -1px 1px rgba(35, 35, 35, 0.07)`
                              : `inset 0 1px 1px rgba(255,255,255,0.8), inset 0 -1px 1px rgba(0, 0, 0, 0.1)`,
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
            </Box>
          </Box>
        </Box>
      </BetaAccessGuard>
    </ThemeProvider>
  );
};

export default NoteWorkspace;