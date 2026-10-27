// src/components/chats_components/PinDurationDialog.jsx
import React, { useState } from "react";
import {
  SwipeableDrawer,
  Box,
  Typography,
  Button,
  RadioGroup,
  FormControlLabel,
  Radio,
} from "@mui/material";
import PushPinIcon from "@mui/icons-material/PushPin";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import {
  drawerPaperSx,
  drawerBackdropSx,
  DrawerHandle,
} from "../../theme/designSystem";

const DURATION_OPTIONS = [
  { label: "24 Hours", value: "24h", durationMs: 24 * 60 * 60 * 1000 },
  { label: "7 Days", value: "7d", durationMs: 7 * 24 * 60 * 60 * 1000 },
  { label: "30 Days", value: "30d", durationMs: 30 * 24 * 60 * 60 * 1000 },
  { label: "Until Unpinned (Permanent)", value: "forever", durationMs: null },
];

const PinDurationDialog = ({
  open,
  onClose,
  onConfirmPin,
  messageText = "",
  isDark = true,
}) => {
  const [selectedDuration, setSelectedDuration] = useState("24h");
  const mode = isDark ? "dark" : "light";

  const handleConfirm = () => {
    const opt = DURATION_OPTIONS.find((o) => o.value === selectedDuration);
    onConfirmPin({
      durationValue: selectedDuration,
      durationMs: opt?.durationMs || null,
      expiresAt: opt?.durationMs ? Date.now() + opt.durationMs : null,
      durationLabel: opt?.label || "24 Hours",
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
        {/* Header */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.2, pb: 1.5 }}>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: "10px",
              bgcolor: "rgba(0, 183, 255, 0.15)",
              color: "#00b7ff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <PushPinIcon sx={{ fontSize: 18, transform: "rotate(45deg)" }} />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, fontSize: "1.05rem" }}>
              Pin Message
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.65 }}>
              Choose how long this message stays pinned
            </Typography>
          </Box>
        </Box>

        {messageText && (
          <Box
            sx={{
              p: 1.2,
              mb: 1.5,
              borderRadius: "12px",
              bgcolor: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
              border: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)"}`,
            }}
          >
            <Typography
              variant="caption"
              noWrap
              sx={{ display: "block", fontStyle: "italic", opacity: 0.8 }}
            >
              "{messageText.slice(0, 100)}{messageText.length > 100 ? "..." : ""}"
            </Typography>
          </Box>
        )}

        <RadioGroup
          value={selectedDuration}
          onChange={(e) => setSelectedDuration(e.target.value)}
          sx={{ display: "flex", flexDirection: "column", gap: 0.8, my: 1 }}
        >
          {DURATION_OPTIONS.map((opt) => {
            const isChecked = selectedDuration === opt.value;
            return (
              <Box
                key={opt.value}
                onClick={() => setSelectedDuration(opt.value)}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  p: 1.2,
                  px: 1.5,
                  borderRadius: "12px",
                  bgcolor: isChecked
                    ? isDark
                      ? "rgba(0, 183, 255, 0.15)"
                      : "rgba(2, 136, 209, 0.1)"
                    : isDark
                    ? "rgba(255, 255, 255, 0.03)"
                    : "rgba(0, 0, 0, 0.02)",
                  border: `1px solid ${
                    isChecked ? "#00b7ff" : isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)"
                  }`,
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  "&:hover": {
                    bgcolor: isDark ? "rgba(255, 255, 255, 0.07)" : "rgba(0, 0, 0, 0.05)",
                  },
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <AccessTimeIcon sx={{ fontSize: 16, opacity: 0.6 }} />
                  <Typography variant="body2" sx={{ fontWeight: isChecked ? 700 : 500 }}>
                    {opt.label}
                  </Typography>
                </Box>
                <FormControlLabel
                  value={opt.value}
                  control={<Radio size="small" sx={{ color: "#00b7ff", "&.Mui-checked": { color: "#00b7ff" } }} />}
                  label=""
                  sx={{ m: 0 }}
                />
              </Box>
            );
          })}
        </RadioGroup>

        <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1, pt: 2, pb: 1 }}>
          <Button onClick={onClose} sx={{ textTransform: "none", color: "inherit", opacity: 0.7 }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleConfirm}
            sx={{
              bgcolor: "#00b7ff",
              color: "#fff",
              fontWeight: 700,
              textTransform: "none",
              borderRadius: "12px",
              px: 2.5,
              "&:hover": { bgcolor: "#009bd9" },
            }}
          >
            Confirm Pin
          </Button>
        </Box>
      </Box>
    </SwipeableDrawer>
  );
};

export default React.memo(PinDurationDialog);
