import React, { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Button,
  FormControl,
  Select,
  MenuItem,
  InputLabel,
  Stack,
  Switch,
  FormControlLabel,
  LinearProgress,
  Chip,
  IconButton,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import MicIcon from "@mui/icons-material/Mic";
import VolumeUpIcon from "@mui/icons-material/VolumeUp";
import VideocamIcon from "@mui/icons-material/Videocam";
import WifiTetheringIcon from "@mui/icons-material/WifiTethering";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import { useCall } from "../../contexts/CallContext";

export default function DeviceSettingsModal({ open, onClose }) {
  const {
    devices,
    selectedAudioInput,
    selectedVideoInput,
    selectedAudioOutput,
    setSelectedAudioInput,
    setSelectedVideoInput,
    switchAudioOutput,
    lowDataMode,
    setLowDataMode,
    permissions,
    requestCallPermissions,
    localStreamRef,
  } = useCall();

  const [micLevel, setMicLevel] = useState(0);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animFrameRef = useRef(null);

  // Monitor mic audio level when modal is open
  useEffect(() => {
    if (!open || !localStreamRef.current) return;

    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;

      const audioCtx = new AudioCtx();
      audioContextRef.current = audioCtx;

      const audioTracks = localStreamRef.current.getAudioTracks();
      if (!audioTracks.length) return;

      const mediaStreamSource = audioCtx.createMediaStreamSource(localStreamRef.current);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;

      mediaStreamSource.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const updateLevel = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const average = sum / bufferLength;
        const normalized = Math.min(100, Math.round((average / 128) * 100));
        setMicLevel(normalized);
        animFrameRef.current = requestAnimationFrame(updateLevel);
      };

      updateLevel();
    } catch (e) {
      console.warn("Could not start mic level analyser:", e);
    }

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
        audioContextRef.current = null;
      }
      setMicLevel(0);
    };
  }, [open, localStreamRef]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: "24px",
          bgcolor: "#14171c",
          color: "#fff",
          border: "1px solid rgba(255,255,255,0.1)",
          boxShadow: "0 24px 60px rgba(0,0,0,0.85)",
          p: 1,
        },
      }}
    >
      <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", pb: 1 }}>
        <Typography variant="h6" sx={{ fontWeight: 800 }}>
          Audio & Video Settings
        </Typography>
        <IconButton onClick={onClose} sx={{ color: "rgba(255,255,255,0.6)" }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ py: 1 }}>
        {/* Permission Status Chips */}
        <Box sx={{ mb: 2.5, p: 1.5, borderRadius: "16px", bgcolor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
          <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 700, display: "block", mb: 1, letterSpacing: "0.5px" }}>
            DEVICE PERMISSIONS
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
            <Chip
              icon={permissions.mic === "granted" ? <CheckCircleIcon sx={{ fontSize: "1rem !important" }} /> : <ErrorOutlineIcon sx={{ fontSize: "1rem !important" }} />}
              label={`Microphone: ${permissions.mic}`}
              color={permissions.mic === "granted" ? "success" : "default"}
              variant="outlined"
              size="small"
              sx={{ fontWeight: 600 }}
            />
            <Chip
              icon={permissions.camera === "granted" ? <CheckCircleIcon sx={{ fontSize: "1rem !important" }} /> : <ErrorOutlineIcon sx={{ fontSize: "1rem !important" }} />}
              label={`Camera: ${permissions.camera}`}
              color={permissions.camera === "granted" ? "success" : "default"}
              variant="outlined"
              size="small"
              sx={{ fontWeight: 600 }}
            />
            <Chip
              icon={permissions.notifications === "granted" ? <CheckCircleIcon sx={{ fontSize: "1rem !important" }} /> : <ErrorOutlineIcon sx={{ fontSize: "1rem !important" }} />}
              label={`Ringtone Notifications: ${permissions.notifications}`}
              color={permissions.notifications === "granted" ? "success" : "default"}
              variant="outlined"
              size="small"
              sx={{ fontWeight: 600 }}
            />
          </Stack>
          {(permissions.mic !== "granted" || permissions.camera !== "granted") && (
            <Button
              size="small"
              variant="outlined"
              color="primary"
              onClick={() => requestCallPermissions(true)}
              sx={{ mt: 1.5, borderRadius: "12px", textTransform: "none", fontWeight: 700 }}
            >
              Request / Refresh Permissions
            </Button>
          )}
        </Box>

        <Stack spacing={2.5}>
          {/* Microphone Selector */}
          <Box>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
              <MicIcon sx={{ color: "#00e676", fontSize: 20 }} />
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                Microphone (Audio Input)
              </Typography>
            </Stack>
            <FormControl fullWidth size="small">
              <InputLabel sx={{ color: "rgba(255,255,255,0.6)" }}>Select Mic</InputLabel>
              <Select
                value={selectedAudioInput || ""}
                label="Select Mic"
                onChange={(e) => setSelectedAudioInput(e.target.value)}
                sx={{
                  bgcolor: "rgba(255,255,255,0.05)",
                  color: "#fff",
                  borderRadius: "14px",
                  "& .MuiSvgIcon-root": { color: "#fff" },
                }}
              >
                {devices.audioInputs.map((d, i) => (
                  <MenuItem key={d.deviceId || i} value={d.deviceId}>
                    {d.label || `Microphone ${i + 1}`}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Live Mic Test Meter */}
            <Box sx={{ mt: 1.2 }}>
              <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.4 }}>
                <Typography variant="caption" sx={{ color: "text.secondary" }}>
                  Mic Input Level Test
                </Typography>
                <Typography variant="caption" sx={{ color: micLevel > 15 ? "#00e676" : "text.secondary", fontWeight: 700 }}>
                  {micLevel > 10 ? "Detecting Voice" : "Speak to test"}
                </Typography>
              </Stack>
              <LinearProgress
                variant="determinate"
                value={micLevel}
                sx={{
                  height: 6,
                  borderRadius: 3,
                  bgcolor: "rgba(255,255,255,0.08)",
                  "& .MuiLinearProgress-bar": {
                    bgcolor: micLevel > 60 ? "#ff9800" : "#00e676",
                    transition: "transform 0.1s linear",
                  },
                }}
              />
            </Box>
          </Box>

          {/* Speaker / Output Selector */}
          <Box>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
              <VolumeUpIcon sx={{ color: "#29b6f6", fontSize: 20 }} />
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                Speaker (Audio Output)
              </Typography>
            </Stack>
            <FormControl fullWidth size="small">
              <InputLabel sx={{ color: "rgba(255,255,255,0.6)" }}>Select Speaker</InputLabel>
              <Select
                value={selectedAudioOutput || ""}
                label="Select Speaker"
                onChange={(e) => switchAudioOutput(e.target.value)}
                sx={{
                  bgcolor: "rgba(255,255,255,0.05)",
                  color: "#fff",
                  borderRadius: "14px",
                  "& .MuiSvgIcon-root": { color: "#fff" },
                }}
              >
                {devices.audioOutputs.length > 0 ? (
                  devices.audioOutputs.map((d, i) => (
                    <MenuItem key={d.deviceId || i} value={d.deviceId}>
                      {d.label || `Speaker ${i + 1}`}
                    </MenuItem>
                  ))
                ) : (
                  <MenuItem value="">System Default Speaker / Earpiece</MenuItem>
                )}
              </Select>
            </FormControl>
          </Box>

          {/* Camera Selector */}
          <Box>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
              <VideocamIcon sx={{ color: "#ab47bc", fontSize: 20 }} />
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                Camera (Video Input)
              </Typography>
            </Stack>
            <FormControl fullWidth size="small">
              <InputLabel sx={{ color: "rgba(255,255,255,0.6)" }}>Select Camera</InputLabel>
              <Select
                value={selectedVideoInput || ""}
                label="Select Camera"
                onChange={(e) => setSelectedVideoInput(e.target.value)}
                sx={{
                  bgcolor: "rgba(255,255,255,0.05)",
                  color: "#fff",
                  borderRadius: "14px",
                  "& .MuiSvgIcon-root": { color: "#fff" },
                }}
              >
                {devices.videoInputs.map((d, i) => (
                  <MenuItem key={d.deviceId || i} value={d.deviceId}>
                    {d.label || `Camera ${i + 1}`}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          {/* Low Data Mode / Bandwidth Saver */}
          <Box
            sx={{
              p: 1.5,
              borderRadius: "16px",
              bgcolor: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.08)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Box>
              <Stack direction="row" alignItems="center" spacing={1}>
                <WifiTetheringIcon sx={{ color: lowDataMode ? "#ff9800" : "#4caf50", fontSize: 20 }} />
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  Low Data / Slow Internet Mode
                </Typography>
              </Stack>
              <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mt: 0.3 }}>
                Prioritizes audio quality and reduces video resolution on 2G/3G/spotty Wi-Fi
              </Typography>
            </Box>
            <FormControlLabel
              control={
                <Switch
                  checked={lowDataMode}
                  onChange={(e) => setLowDataMode(e.target.checked)}
                  color="warning"
                />
              }
              label=""
              sx={{ m: 0 }}
            />
          </Box>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button
          onClick={onClose}
          variant="contained"
          fullWidth
          sx={{
            borderRadius: "14px",
            py: 1,
            fontWeight: 800,
            textTransform: "none",
            bgcolor: "#fff",
            color: "#000",
            "&:hover": { bgcolor: "#eee" },
          }}
        >
          Done
        </Button>
      </DialogActions>
    </Dialog>
  );
}
