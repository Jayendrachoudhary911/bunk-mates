import React, { useState, useEffect } from "react";
import {
  SwipeableDrawer,
  TextField,
  Button,
  IconButton,
  Typography,
  Box,
  Paper,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import ChecklistIcon from "@mui/icons-material/Checklist";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import PeopleAltOutlinedIcon from "@mui/icons-material/PeopleAltOutlined";
import {
  drawerPaperSx,
  drawerBackdropSx,
  DrawerHandle,
} from "../../theme/designSystem";

const GroupChecklistDialog = ({
  open,
  onClose,
  tripChecklist = [],
  tripName = "Trip",
  onSendChecklist,
  isDark = true,
}) => {
  const mode = isDark ? "dark" : "light";
  const [title, setTitle] = useState(`${tripName} Checklist`);
  const [items, setItems] = useState([
    { text: "", required: false },
    { text: "", required: false },
  ]);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [allowBatch] = useState(true);

  useEffect(() => {
    if (open) {
      if (tripChecklist && tripChecklist.length > 0) {
        setItems(
          tripChecklist.map((it) => ({
            text: typeof it === "string" ? it : it.text || it.title || "",
            required: it.required || false,
          }))
        );
      } else {
        setItems([
          { text: "", required: false },
          { text: "", required: false },
        ]);
      }
      setTitle(`${tripName} Checklist`);
    }
  }, [open, tripChecklist, tripName]);

  const handleAddItem = () => {
    setItems((prev) => [...prev, { text: "", required: false }]);
  };

  const handleItemChange = (idx, field, val) => {
    setItems((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [field]: val };
      return copy;
    });
  };

  const handleRemoveItem = (idx) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSend = () => {
    const validItems = items
      .map((it) => ({ ...it, text: it.text.trim() }))
      .filter((it) => it.text.length > 0);

    if (validItems.length === 0) return;

    onSendChecklist({
      title: title.trim() || `${tripName} Checklist`,
      items: validItems,
      isAnonymous: Boolean(isAnonymous),
      allowBatch: Boolean(allowBatch),
    });
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

      <Box sx={{ maxWidth: 500, mx: "auto", width: "100%", boxSizing: "border-box", pt: { xs: 1, md: 2 } }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            pb: 1.5,
            px: 1,
            fontWeight: 700,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <ChecklistIcon sx={{ color: "#4caf50" }} />
            <Typography variant="h6" sx={{ fontWeight: 800, fontSize: "1.1rem" }}>
              Send Checklist
            </Typography>
          </Box>
          <IconButton size="small" onClick={onClose} sx={{ color: isDark ? "#aaa" : "#666" }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>

        <Box sx={{ px: 1, display: "flex", flexDirection: "column", gap: 2 }}>
          <TextField
            label="Checklist Title"
            size="small"
            fullWidth
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: "12px",
                color: isDark ? "#fff" : "#111",
                bgcolor: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.02)",
              },
            }}
          />

          {/* Visibility Setting Mode */}
          <Box>
            <Typography variant="caption" sx={{ fontWeight: 700, opacity: 0.8, textTransform: "uppercase", letterSpacing: 0.5, mb: 1, display: "block" }}>
              Checklist Activity Mode
            </Typography>
            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1 }}>
              <Paper
                onClick={() => setIsAnonymous(false)}
                elevation={0}
                sx={{
                  p: 1.5,
                  borderRadius: "12px",
                  cursor: "pointer",
                  bgcolor: !isAnonymous ? (isDark ? "rgba(76, 175, 80, 0.15)" : "#e8f5e9") : (isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)"),
                  border: `1.5px solid ${!isAnonymous ? "#4caf50" : (isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)")}`,
                  transition: "all 0.2s",
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.8, mb: 0.5 }}>
                  <PeopleAltOutlinedIcon sx={{ fontSize: 18, color: !isAnonymous ? "#4caf50" : "inherit" }} />
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                    Public Tracking
                  </Typography>
                </Box>
                <Typography variant="caption" sx={{ opacity: 0.7, fontSize: "0.75rem", display: "block" }}>
                  Names are shown next to completed items.
                </Typography>
              </Paper>

              <Paper
                onClick={() => setIsAnonymous(true)}
                elevation={0}
                sx={{
                  p: 1.5,
                  borderRadius: "12px",
                  cursor: "pointer",
                  bgcolor: isAnonymous ? (isDark ? "rgba(76, 175, 80, 0.15)" : "#e8f5e9") : (isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)"),
                  border: `1.5px solid ${isAnonymous ? "#4caf50" : (isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)")}`,
                  transition: "all 0.2s",
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.8, mb: 0.5 }}>
                  <LockOutlinedIcon sx={{ fontSize: 18, color: isAnonymous ? "#4caf50" : "inherit" }} />
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                    Anonymous
                  </Typography>
                </Box>
                <Typography variant="caption" sx={{ opacity: 0.7, fontSize: "0.75rem", display: "block" }}>
                  Only progress count is displayed.
                </Typography>
              </Paper>
            </Box>
          </Box>

          {/* Items Section */}
          <Box>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
              <Typography variant="caption" sx={{ fontWeight: 700, opacity: 0.8, textTransform: "uppercase", letterSpacing: 0.5 }}>
                Checklist Items ({items.length})
              </Typography>
              <Button
                size="small"
                startIcon={<AddIcon />}
                onClick={handleAddItem}
                sx={{ textTransform: "none", color: "#4caf50", fontWeight: 700, fontSize: "0.8rem" }}
              >
                Add Item
              </Button>
            </Box>

            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              {items.map((it, idx) => (
                <Box key={idx} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <TextField
                    size="small"
                    fullWidth
                    placeholder={`Item ${idx + 1}`}
                    value={it.text}
                    onChange={(e) => handleItemChange(idx, "text", e.target.value)}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: "10px",
                        bgcolor: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)",
                        fontSize: "0.85rem",
                      },
                    }}
                  />
                  {items.length > 1 && (
                    <IconButton size="small" onClick={() => handleRemoveItem(idx)} sx={{ color: "#f44336", opacity: 0.8 }}>
                      <DeleteOutlineIcon fontSize="small" />
                    </IconButton>
                  )}
                </Box>
              ))}
            </Box>
          </Box>
        </Box>

        <Box sx={{ px: 1, pb: 1, pt: 2.5, display: "flex", justifyContent: "flex-end", gap: 1 }}>
          <Button onClick={onClose} sx={{ color: isDark ? "#aaa" : "#666", textTransform: "none" }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSend}
            disabled={items.filter((it) => it.text.trim().length > 0).length === 0}
            sx={{
              bgcolor: "#4caf50",
              color: "#fff",
              textTransform: "none",
              borderRadius: "10px",
              fontWeight: 600,
              px: 2.5,
              "&:hover": { bgcolor: "#388e3c" },
            }}
          >
            Send Checklist
          </Button>
        </Box>
      </Box>
    </SwipeableDrawer>
  );
};

export default GroupChecklistDialog;
