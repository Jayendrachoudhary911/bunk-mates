import React, { useState } from "react";
import {
  SwipeableDrawer,
  TextField,
  Button,
  Box,
  Typography,
  IconButton,
} from "@mui/material";
import RemoveIcon from "@mui/icons-material/Close";
import AddIcon from "@mui/icons-material/Add";
import {
  drawerPaperSx,
  drawerBackdropSx,
  DrawerHandle,
} from "../../theme/designSystem";

const GroupPollDialog = ({
  open,
  onClose,
  onCreatePoll,
  effectiveChatTheme = "dark",
}) => {
  const isDark = effectiveChatTheme === "dark";
  const mode = isDark ? "dark" : "light";
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [allowMultiple, setAllowMultiple] = useState(false);
  const [creatorOnlyResults, setCreatorOnlyResults] = useState(false);

  const handleOptionChange = (idx, value) => {
    setOptions((prev) => {
      const copy = [...prev];
      copy[idx] = value;
      return copy;
    });
  };

  const handleAddOption = () => {
    if (options.length < 8) {
      setOptions((prev) => [...prev, ""]);
    }
  };

  const handleRemoveOption = (idx) => {
    if (options.length > 2) {
      setOptions((prev) => prev.filter((_, i) => i !== idx));
    }
  };

  const handleSubmit = () => {
    if (!question.trim()) return;
    const validOptions = options
      .map((o) => o.trim())
      .filter(Boolean)
      .map((text) => ({ text, votes: [] }));

    if (validOptions.length < 2) return;

    onCreatePoll({
      question: question.trim(),
      options: validOptions,
      allowMultiple,
      creatorOnlyResults,
    });

    setQuestion("");
    setOptions(["", ""]);
    setAllowMultiple(false);
    setCreatorOnlyResults(false);
    onClose();
  };

  return (
    <SwipeableDrawer
      anchor="bottom"
      open={open}
      onClose={onClose}
      onOpen={() => {}}
      disableSwipeToOpen={false}
      ModalProps={{
        BackdropProps: {
          sx: drawerBackdropSx,
        },
      }}
      PaperProps={{
        sx: {
          ...drawerPaperSx(mode, {
            maxHeight: "85vh",
          }),
          overflowY: "auto",
        },
      }}
    >
      <Box sx={{ display: { xs: "block", md: "none" } }}>
        <DrawerHandle mode={mode} />
      </Box>

      <Box sx={{ maxWidth: 500, mx: "auto", width: "100%", boxSizing: "border-box", pt: { xs: 1, md: 2 }, px: 2, pb: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 800, pb: 1.5, fontSize: "1.05rem" }}>
          📊 Create a Poll
        </Typography>

        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.6 }}>
          <TextField
            label="Poll Question"
            fullWidth
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            size="small"
            variant="outlined"
            InputLabelProps={{
              style: { color: isDark ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.6)" },
            }}
            InputProps={{
              sx: {
                borderRadius: "12px",
                color: isDark ? "#fff" : "#111",
                bgcolor: isDark
                  ? "rgba(255, 255, 255, 0.04)"
                  : "rgba(0, 0, 0, 0.03)",
                border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"}`,
              },
            }}
          />

          <Box>
            <Typography
              variant="caption"
              sx={{
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: 0.8,
                color: isDark ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.6)",
                mb: 1,
                display: "block",
              }}
            >
              Options ({options.length}/8)
            </Typography>

            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              {options.map((opt, idx) => (
                <Box key={idx} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder={`Option ${idx + 1}`}
                    value={opt}
                    onChange={(e) => handleOptionChange(idx, e.target.value)}
                    InputProps={{
                      sx: {
                        borderRadius: "12px",
                        color: isDark ? "#fff" : "#111",
                        bgcolor: isDark
                          ? "rgba(255, 255, 255, 0.03)"
                          : "rgba(0, 0, 0, 0.02)",
                        border: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)"}`,
                      },
                    }}
                  />
                  {options.length > 2 && (
                    <IconButton
                      size="small"
                      onClick={() => handleRemoveOption(idx)}
                      sx={{ color: isDark ? "#ff5555" : "#d32f2f" }}
                    >
                      <RemoveIcon fontSize="small" />
                    </IconButton>
                  )}
                </Box>
              ))}
            </Box>

            {options.length < 8 && (
              <Button
                startIcon={<AddIcon />}
                onClick={handleAddOption}
                size="small"
                sx={{
                  textTransform: "none",
                  fontWeight: 600,
                  color: "#00b7ff",
                  mt: 1,
                }}
              >
                Add Option
              </Button>
            )}
          </Box>

          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 1.5,
              p: 1.5,
              borderRadius: "14px",
              bgcolor: isDark ? "rgba(255, 255, 255, 0.03)" : "rgba(0, 0, 0, 0.02)",
              border: `1px solid ${isDark ? "rgba(255, 255, 255, 0.06)" : "rgba(0, 0, 0, 0.05)"}`,
            }}
          >
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                cursor: "pointer",
              }}
              onClick={() => setAllowMultiple((prev) => !prev)}
            >
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 600, color: isDark ? "#fff" : "#111" }}>
                  Allow Multiple Answers
                </Typography>
                <Typography variant="caption" sx={{ color: isDark ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.6)" }}>
                  Members can vote for more than one option
                </Typography>
              </Box>
              <Box
                sx={{
                  width: 40,
                  height: 22,
                  borderRadius: 11,
                  bgcolor: allowMultiple ? "#00b7ff" : isDark ? "#333" : "#ccc",
                  display: "flex",
                  alignItems: "center",
                  px: 0.25,
                  transition: "all 0.2s ease",
                }}
              >
                <Box
                  sx={{
                    width: 18,
                    height: 18,
                    borderRadius: "50%",
                    bgcolor: "#fff",
                    transform: allowMultiple ? "translateX(18px)" : "translateX(0)",
                    transition: "all 0.2s ease",
                  }}
                />
              </Box>
            </Box>

            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                cursor: "pointer",
              }}
              onClick={() => setCreatorOnlyResults((prev) => !prev)}
            >
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 600, color: isDark ? "#fff" : "#111" }}>
                  Anonymous Poll
                </Typography>
                <Typography variant="caption" sx={{ color: isDark ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.6)" }}>
                  Hide voter identities from results
                </Typography>
              </Box>
              <Box
                sx={{
                  width: 40,
                  height: 22,
                  borderRadius: 11,
                  bgcolor: creatorOnlyResults ? "#00b7ff" : isDark ? "#333" : "#ccc",
                  display: "flex",
                  alignItems: "center",
                  px: 0.25,
                  transition: "all 0.2s ease",
                }}
              >
                <Box
                  sx={{
                    width: 18,
                    height: 18,
                    borderRadius: "50%",
                    bgcolor: "#fff",
                    transform: creatorOnlyResults ? "translateX(18px)" : "translateX(0)",
                    transition: "all 0.2s ease",
                  }}
                />
              </Box>
            </Box>
          </Box>
        </Box>

        <Box sx={{ pt: 2, display: "flex", gap: 1, alignItems: "center" }}>
          <Button
            fullWidth
            variant="contained"
            size="small"
            onClick={onClose}
            sx={{
              py: 0.8,
              borderRadius: 8,
              bgcolor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
              color: isDark ? "#fff" : "#1c1c1e",
              textTransform: "none",
              boxShadow: "none",
              fontWeight: 600,
              fontSize: "0.8rem",
              transition: "all 150ms ease",
              "&:hover": {
                bgcolor: isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.1)",
                boxShadow: "none",
              },
            }}
          >
            Cancel
          </Button>
          <Button
            fullWidth
            variant="contained"
            size="small"
            onClick={handleSubmit}
            disabled={!question.trim() || options.filter((o) => o.trim()).length < 2}
            sx={{
              py: 0.8,
              borderRadius: 8,
              bgcolor: isDark ? "#dadada" : "#282828",
              color: isDark ? "#090909" : "#f5f5f5",
              textTransform: "none",
              fontWeight: 700,
              fontSize: "0.8rem",
              boxShadow: "none",
              transition: "all 150ms ease",
              "&:hover": {
                bgcolor: isDark ? "#f1f0f0" : "#0f0f0f",
                boxShadow: "none",
              },
            }}
          >
            Send Poll
          </Button>
        </Box>
      </Box>
    </SwipeableDrawer>
  );
};

export default React.memo(GroupPollDialog);