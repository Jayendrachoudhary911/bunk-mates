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
  Dialog,
  DialogTitle,
  DialogContent,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
    SwipeableDrawer,
    Grow,
    TextareaAutosize as TextArea,
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
import LayersIcon from "@mui/icons-material/Layers";
import CodeIcon from "@mui/icons-material/Code";
import TitleIcon from "@mui/icons-material/Title";
import SubtitlesIcon from "@mui/icons-material/Subtitles";
import ClosedCaptionIcon from "@mui/icons-material/ClosedCaption";

import { db, auth } from "../firebase";
import {
  doc,
  updateDoc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import BetaAccessGuard from "../components/BetaAccessGuard";
import { useThemeToggle } from "../contexts/ThemeToggleContext";
import { getTheme } from "../theme";

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

// A safe tokenizer and highlighter that wraps markdown syntax symbols in faded tags,
// maintaining EXACT character counts for absolute positioning overlay accuracy.
const highlightMarkdown = (text, mode, theme, fontStyle) => {
  if (!text) return "";

  const accentColor = theme.palette.primary.main || "#9fcfff";
  const secondaryColor = mode === "dark" ? "rgba(255, 255, 255, 0.75)" : "rgba(0, 0, 0, 0.7)";
  const syntaxColor = mode === "dark" ? "rgba(255, 255, 255, 0.35)" : "rgba(0, 0, 0, 0.35)";

  const fadeMarker = (marker) => `<span style="color: ${syntaxColor}; font-weight: normal; font-style: normal; font-family: ${fontStyle};">${marker}</span>`;

  const lines = text.split("\n");
  const highlightedLines = lines.map(line => {
    let lineType = "normal";
    let prefix = "";
    let content = line;

    // Headings & Subtitles
    const headingMatch = line.match(/^(#{1,6})\s+(.*)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      if (level === 1) lineType = "heading";
      else if (level === 2) lineType = "subtitle";
      else lineType = "heading";
      
      prefix = headingMatch[1] + " ";
      content = headingMatch[2];
    }
    // Captions (Custom Markdown specification wrapper: .[text])
    else if (line.trim().startsWith(".[") && line.trim().endsWith("]")) {
      lineType = "caption_block";
      const captionMatch = line.match(/^\s*\.\[(.*)\]\s*$/);
      prefix = ".[";
      content = captionMatch ? captionMatch[1] : line;
    }
    // Lists
    else {
      const listMatch = line.match(/^(\s*[-*+]\s+)(.*)$/);
      if (listMatch) {
        lineType = "list";
        prefix = listMatch[1];
        content = listMatch[2];
      } else {
        const numListMatch = line.match(/^(\s*\d+\.\s+)(.*)$/);
        if (numListMatch) {
          lineType = "numlist";
          prefix = numListMatch[1];
          content = numListMatch[2];
        } else {
          // Blockquote
          const quoteMatch = line.match(/^(\s*>\s+)(.*)$/);
          if (quoteMatch) {
            lineType = "quote";
            prefix = quoteMatch[1];
            content = quoteMatch[2];
          }
        }
      }
    }

    let safeContent = content
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    // Highlight Bold: **text**
    safeContent = safeContent.replace(/\*\*(.*?)\*\*/g, (_, p1) => {
      return `<strong style="color: ${accentColor}; font-weight: 700;">${fadeMarker("**")}${p1}${fadeMarker("**")}</strong>`;
    });

    // Highlight Italic: *text* or _text_
    safeContent = safeContent.replace(/\*(.*?)\*/g, (_, p1) => {
      return `<em style="color: ${accentColor};">${fadeMarker("*")}${p1}${fadeMarker("*")}</em>`;
    });
    safeContent = safeContent.replace(/_(.*?)_/g, (_, p1) => {
      return `<em style="color: ${accentColor};">${fadeMarker("_")}${p1}${fadeMarker("_")}</em>`;
    });

    // Highlight Code: `code`
    safeContent = safeContent.replace(/`(.*?)`/g, (_, p1) => {
      return `<code style="font-family: monospace; background: ${mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)'}; px: 4px; borderRadius: 4px; color: #ffb454;">${fadeMarker("`")}${p1}${fadeMarker("`")}</code>`;
    });

    let safePrefix = prefix
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    if (lineType === "heading") {
      return `<span style="font-weight: 800; color: ${accentColor}; font-size: 1.25rem;">${fadeMarker(safePrefix)}${safeContent}</span>`;
    } else if (lineType === "subtitle") {
      return `<span style="font-weight: 600; color: ${secondaryColor}; font-size: 1.1rem;">${fadeMarker(safePrefix)}${safeContent}</span>`;
    } else if (lineType === "caption_block") {
      return `<span style="font-size: 0.85rem; color: ${mode === 'dark' ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)'}; font-style: italic; letter-spacing: 0.2px;">${fadeMarker(".[")}${safeContent}${fadeMarker("]")}</span>`;
    } else if (lineType === "list" || lineType === "numlist") {
      return `<span style="color: ${accentColor}; font-weight: bold;">${safePrefix}</span>${safeContent}`;
    } else if (lineType === "quote") {
      return `<span style="color: ${secondaryColor}; font-style: italic; border-left: 2px solid ${accentColor}; padding-left: 8px; display: inline-block; width: 100%;">${fadeMarker(safePrefix)}${safeContent}</span>`;
    }

    return safeContent;
  });

  return highlightedLines.join("\n");
};

const NoteWorkspace = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;

  const [loading, setLoading] = useState(isEditMode);
  const [user, setUser] = useState(null);
  const [currentNoteId, setCurrentNoteId] = useState(id || null);

  // Form states
  const [noteTitle, setNoteTitle] = useState("");
  const [noteContent, setNoteContent] = useState("");
  const [noteLabels, setNoteLabels] = useState([]);
  const [collaborators, setCollaborators] = useState([]);
  const [fontStyle, setFontStyle] = useState("monospace");
  
  // Layout states
  const [showToolbar, setShowToolbar] = useState(false);
  const [layoutBar, setLayoutBar] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  
  // App context states
  const [labels, setLabels] = useState([]);
  const [saving, setSaving] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState("");

  const noteContentRef = useRef(null);
  const autoSaveTimerRef = useRef(null);
  const titleInputRef = useRef("");
  const contentInputRef = useRef("");

  const mirrorScrollRef = useRef(null);

  // Auto-resize textarea to fit content but dynamically baseline to fill page layout height
  useEffect(() => {
    const textarea = noteContentRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.max(textarea.scrollHeight, textarea.parentElement.clientHeight - 120)}px`;
    }
  }, [noteContent, fontStyle]);

  const { mode, accent } = useThemeToggle();
  const theme = useMemo(() => getTheme(mode, accent), [mode, accent]);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

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

  useEffect(() => {
  if (noteContentRef.current) {
    noteContentRef.current.style.height = "auto";
    noteContentRef.current.style.height =
      `${noteContentRef.current.scrollHeight}px`;
  }
}, [noteContent]);

  const handleContentChange = (e) => {
    setNoteContent(e.target.value);
    contentInputRef.current = e.target.value;
  };

  const handleFontChange = (e) => {
    setFontStyle(e.target.value);
  };

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
    setNoteLabels(prev =>
      prev.includes(label) ? prev.filter(l => l !== label) : [...prev, label]
    );
  }, []);

  const handleTextareaScroll = (e) => {
    if (mirrorScrollRef.current) {
      mirrorScrollRef.current.scrollTop = e.target.scrollTop;
    }
  };

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
      if (mirrorScrollRef.current) {
        mirrorScrollRef.current.scrollTop = textarea.scrollTop;
      }
    });
  }, [noteContent]);

  const handleKeyDown = (e) => {
    const isModKey = e.ctrlKey || e.metaKey;
    if (isModKey) {
      if (e.key.toLowerCase() === "b") {
        e.preventDefault();
        applyFormat("bold");
      } else if (e.key.toLowerCase() === "i") {
        e.preventDefault();
        applyFormat("italic");
      } else if (e.key.toLowerCase() === "k") {
        e.preventDefault();
        applyFormat("code");
      }
    }
  };

  const highlightedHtml = useMemo(() => {
    return highlightMarkdown(noteContent, mode, theme, fontStyle);
  }, [noteContent, mode, theme, fontStyle]);

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

  const editorStyle = {
    width: "100%",
    height: "100%",
    padding: "20px",
    margin: 0,
    fontSize: "16px",
    fontFamily: getFontFamily(fontStyle),
    lineHeight: "1.65",
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
    boxSizing: "border-box",
  };

  if (loading) {
    return (
      <ThemeProvider theme={theme}>
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", bgcolor: theme.palette.background.default }}>
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
            pt: 14,
            boxSizing: "border-box",
            position: "relative",
            display: "flex",
            flexDirection: "column"
          }}
        >
          {/* Top Return Control Header Layer */}

          {/* Action Header Panel */}
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 3, position: "fixed", top: 47, left: 26, zIndex: 1200 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Button
            onClick={() => navigate(-1)}
            sx={{
              height: 36,
              borderRadius: 6,
              p: 2,
              backdropFilter: "blur(10px) saturate(200%)",
              WebkitBackdropFilter: "blur(10px) saturate(200%)",
              color: mode === "dark" ? "#fff" : "#000",
              zIndex: 10,
              backgroundColor: mode === "dark" ? "#1d1d1d45" : "rgba(0, 0, 0, 0.04)",
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
          </Button>
              <Typography variant="h5" fontWeight="bold" color="text.primary">
                {isEditMode ? "Edit Note" : "Create Note"}
              </Typography>
              <Typography 
                variant="caption" 
                sx={{ 
                  fontSize: "11px",
                  color: autoSaveStatus === "saving" ? theme.palette.warning.main : autoSaveStatus === "saved" ? theme.palette.success.main : "transparent",
                  transition: "color 0.3s ease",
                  fontWeight: 600,
                }}
              >
                {autoSaveStatus === "saving" ? "" : "✓ Saved"}
              </Typography>
            </Box>
            <Button
              variant="contained"
              onClick={handleSaveNote}
              disabled={saving}
              sx={{ borderRadius: 6, color: mode === "dark" ? "#ffffff" : "#000000", background: mode === "dark" ? "rgba(20, 20, 20, 0.85)" : "rgba(255, 255, 255, 0.9)", fontWeight: "bold", width: "110px", boxShadow: theme.palette.mode === "dark"
                  ? `inset 0 1px 2px rgba(255, 255, 255, 0.11), inset 0 -1px 1px rgba(35, 35, 35, 0.07)`
                  : `inset 0 1px 1px rgba(255,255,255,0.8), inset 0 -1px 1px rgba(0, 0, 0, 0.1)`,
              backdropFilter: "blur(10px) saturate(200%)",
              WebkitBackdropFilter: "blur(10px) saturate(200%)", }}
            >
              {saving ? "Saving..." : "Done"}
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
  {/* Title */}

  <TextField
    placeholder="Enter title..."
    value={noteTitle}
    onChange={handleTitleChange}
    fullWidth
    variant="standard"
    InputProps={{
      disableUnderline: true,

      sx: {
        fontSize: 28,
        fontWeight: 800,
        color: mode === "dark" ? "#fff" : "#111",

        px: 0,

        transition: "all .25s ease",

        "& input::placeholder": {
          opacity: 0.5,
        },
      },
    }}
  />

  {/* Labels */}

  <Box
    sx={{
      display: "flex",
      gap: 1,
      mt: 1,
      mb: 2,
    }}
  >
    {labels.map((label) => {
      const selected = noteLabels.includes(label);

      return (
        <Chip
          key={label}
          label={label}
          onClick={() => handleToggleLabelMemo(label)}
          size="small"
          variant={selected ? "filled" : "outlined"}
          sx={{
            px: 0.5,
            height: 30,
            borderRadius: "12px",

            fontWeight: 600,

            transition: "all .25s ease",

            color: selected
              ? mode === "dark"
                ? "#000"
                : "#fff"
              : mode === "dark"
              ? "#BDBDBD"
              : "#555",

            background: selected
              ? theme.palette.primary.main
              : mode === "dark"
              ? "rgba(255,255,255,0.06)"
              : "rgba(0,0,0,0.04)",

            border:
              mode === "dark"
                ? "1px solid rgba(255,255,255,0.08)"
                : "1px solid rgba(0,0,0,0.08)",

            "&:hover": {
              transform: "translateY(-2px)",

              background: selected
                ? theme.palette.primary.dark
                : mode === "dark"
                ? "rgba(255,255,255,0.12)"
                : "rgba(0,0,0,0.08)",
            },
          }}
        />
      );
    })}
  </Box>

  {/* Note Editor */}

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
  }}
  sx={{
    flex: 1,
    mb: 2,
    
    // 1. Container Spacing (Creates a comfortable writing canvas)
    py: 2,                // Top and bottom breathing room
    
    // 2. Text Formatting & Typography
    '& .MuiInputBase-root': {
      color: mode === 'dark' ? '#f3f4f6' : '#1f2937', // Softer contrast to prevent eye strain
      fontFamily: '"Inter", "SF Pro Display", "-apple-system", sans-serif',
      fontSize: '1.05rem',
      lineHeight: 1.65,    // Golden ratio for long-form reading and typing
      letterSpacing: '0.005em',
      alignItems: 'flex-start', // Ensures text starts exactly at the top
    },

    // 3. The Actual Input Area (Crucial for handling paragraphs smoothly)
    '& .MuiInputBase-input': {
      padding: 0,
      margin: 0,
      // Ensures paragraph returns have clean structural depth
      whiteSpace: 'pre-wrap', 
    },

    // 4. Placeholder Styling
    '& .MuiInputBase-input::placeholder': {
      color: mode === 'dark' ? '#4b5563' : '#9ca3af',
      opacity: 1, 
      fontStyle: 'normal',
      letterSpacing: '0.01em',
    },
    
    transition: 'all 0.2s ease-in-out',
  }}
/>
</Box>

          {/* Combined Bottom Dock Layer */}
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
              "& > *": { pointerEvents: "auto" }
            }}
          >

{/* Side Layout Element Bar with Managed Open/Close Transitions */}
<Grow in={Boolean(layoutBar)} timeout={{ enter: 450, exit: 250 }} unmountOnExit>
  <Box sx={{  
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
    
    // Smooth custom cubic transition for the parent container exit
    transition: "transform 0.3s cubic-bezier(0.25, 1, 0.5, 1), opacity 0.25s linear",
    
    // Inject custom CSS animation parameters for child micro-bounces
    "@keyframes buttonPop": {
      "0%": { transform: "scale(0.4) translateY(20px)", opacity: 0 },
      "70%": { transform: "scale(1.1) translateY(-3px)" },
      "100%": { transform: "scale(1) translateY(0)", opacity: 1 }
    }
  }}>
    {[
      { title: "Heading 1", type: "h1", icon: <TitleIcon fontSize="small" />, delay: "0ms" },
      { title: "Heading 2", type: "h2", icon: <TitleIcon fontSize="small" style={{ transform: "scale(0.85)" }} />, delay: "40ms" },
      { title: "Subtitle", type: "subtitle", icon: <SubtitlesIcon fontSize="small" />, delay: "80ms" },
      { title: "Caption", type: "caption", icon: <ClosedCaptionIcon fontSize="small" />, delay: "120ms" },
      { title: "Inline Code", type: "code", icon: <CodeIcon fontSize="small" />, delay: "160ms" },
      { title: "Code Block", type: "codeblock", icon: <CodeIcon fontSize="small" style={{ transform: "scale(1.2)" }} />, delay: "200ms" },
    ].map((btn) => (
      <Tooltip key={btn.type} title={btn.title}>
        <IconButton
          onClick={() => applyFormat(btn.type)}
          size="small"
          sx={{
            backdropFilter: "blur(20px) saturate(200%)",
            WebkitBackdropFilter: "blur(20px) saturate(200%)",     
            borderRadius: 6,
            background: mode === "dark" ? "rgba(20, 20, 20, 0.85)" : "rgba(255, 255, 255, 0.9)",
            p: 1.3,
            boxShadow: theme.palette.mode === "dark"
              ? `inset 0 1px 2px rgba(255, 255, 255, 0.11), inset 0 -1px 1px rgba(35, 35, 35, 0.07)`
              : `inset 0 1px 1px rgba(255,255,255,0.8), inset 0 -1px 1px rgba(0, 0, 0, 0.1)`,
            
            // Staggered stagger load animation entry
            animation: `buttonPop 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) ${btn.delay} backwards`,
            
            // Active interaction micro-bounce effects
            transition: "transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.575), background-color 0.2s",
            "&:hover": {
              transform: "scale(1.18) translateY(-2px)",
              background: mode === "dark" ? "rgba(40, 40, 40, 0.95)" : "rgba(240, 240, 240, 0.95)",
            },
            "&:active": {
              transform: "scale(0.92) translateY(1px)",
            }
          }}
        >
          {btn.icon}
        </IconButton>
      </Tooltip>
    ))}
  </Box>
</Grow>

{/* Main Formatting Toolbar with a smooth fade/scale animation */}
<Grow in={Boolean(showToolbar)} timeout={200} unmountOnExit>
  <Box display="flex" justifyContent="center" sx={{ transformOrigin: "center bottom" }}>
    <Stack direction="row" spacing={1.5} sx={{ 
      borderRadius: 6,
      background: mode === "dark" ? "rgba(20, 20, 20, 0.85)" : "rgba(255, 255, 255, 0.9)",
      p: 1,
      backdropFilter: "blur(10px) saturate(200%)",
      WebkitBackdropFilter: "blur(10px) saturate(200%)",
      alignItems: "center",
      boxShadow: theme.palette.mode === "dark"
        ? `inset 0 1px 2px rgba(255, 255, 255, 0.11), inset 0 -1px 1px rgba(35, 35, 35, 0.07)`
        : `inset 0 1px 1px rgba(255,255,255,0.8), inset 0 -1px 1px rgba(0, 0, 0, 0.1)`
    }}>
      <Tooltip title="Bold (Ctrl+B)">
        <IconButton size="small" onClick={() => applyFormat("bold")}><FormatBoldIcon fontSize="small" /></IconButton>
      </Tooltip>
      <Tooltip title="Italic (Ctrl+I)">
        <IconButton size="small" onClick={() => applyFormat("italic")}><FormatItalicIcon fontSize="small" /></IconButton>
      </Tooltip>
      <Tooltip title="Bullet List">
        <IconButton size="small" onClick={() => applyFormat("listBulleted")}><FormatListBulletedIcon fontSize="small" /></IconButton>
      </Tooltip>
      <Tooltip title="Numbered List">
        <IconButton size="small" onClick={() => applyFormat("listNumbered")}><FormatListNumberedIcon fontSize="small" /></IconButton>
      </Tooltip>
      <Tooltip title="Quote">
        <IconButton size="small" onClick={() => applyFormat("quote")}><FormatQuoteIcon fontSize="small" /></IconButton>
      </Tooltip>

      {/* Font Style Selection Dropdown */}
      <Box sx={{ height: 24, borderLeft: "1px solid rgba(255,255,255,0.15)", mx: 0.5 }} />
      <FormControl size="small" variant="standard">
        <Select
          value={fontStyle}
          onChange={handleFontChange}
          disableUnderline
          IconComponent={FontDownloadIcon}
          renderValue={(selected) => (
            <Typography variant="caption" sx={{ textTransform: "capitalize", fontWeight: 600, px: 0.5 }}>
              {selected}
            </Typography>
          )}
          sx={{
            color: "text.primary",
            fontSize: "0.75rem",
            "& .MuiSelect-icon": {
              fontSize: "1rem",
              right: 4,
              color: mode === "dark" ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)"
            },
            "& .MuiSelect-select": {
              pr: "24px !important",
              pl: 1,
              py: 0.5,
              display: "flex",
              alignItems: "center"
            }
          }}
        >
          <MenuItem value="monospace" style={{ fontFamily: getFontFamily("monospace") }}>Monospace</MenuItem>
          <MenuItem value="sans" style={{ fontFamily: getFontFamily("sans") }}>Sans-Serif</MenuItem>
          <MenuItem value="serif" style={{ fontFamily: getFontFamily("serif") }}>Serif</MenuItem>
          <MenuItem value="dyslexic" style={{ fontFamily: getFontFamily("dyslexic") }}>OpenDyslexic</MenuItem>
        </Select>
      </FormControl>
    </Stack>
  </Box>
</Grow>

            {/* Sticky Footer Shortcuts Bar */}
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Stack direction="row" spacing={1} sx={{ ...glass(mode), p: 1, borderRadius: 8, backgroundColor: showToolbar ? (mode === "dark" ? "rgba(255, 255, 255, 0.81)" : "rgba(0, 0, 0, 0.08)") : "transparent",  }}>
                <Tooltip title="Formatting Controls">
                  <IconButton 
                    size="small" 
                    onClick={() => {setShowToolbar(!showToolbar); setLayoutBar(!layoutBar);}}
                    sx={{ color: showToolbar ? theme.palette.primary.main : "inherit" }}
                  >
                    <TextFieldsIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Stack>

              <Stack direction="row" spacing={1} sx={{ ...glass(mode), p: 1, borderRadius: 8  }}>
                
                <IconButton disabled size="small" sx={{ p: 1 }}><PersonAddIcon fontSize="small" /></IconButton>
                <IconButton disabled size="small" sx={{ p: 1 }}><LabelOutlinedIcon fontSize="small" /></IconButton>
              </Stack>
            </Box>
          </Box>

        </Box>
      </BetaAccessGuard>
    </ThemeProvider>
  );
};

export default NoteWorkspace;