import React, { useState } from "react";
import {
  Box,
  Typography,
  Button,
  TextField,
  CircularProgress,
  Alert,
} from "@mui/material";
import {
  PhotoCamera,
  DeleteOutline,
  Send,
} from "@mui/icons-material";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { auth, firestore } from "../../firebase";
import {
  SettingsLayout,
  SettingsHeader,
  SettingsSection,
  SettingsGroup,
  SettingsSegmentedControl,
  SETTINGS_THEME,
} from "./SettingsShared";

export default function SendFeedbackView({ onBack }) {
  const [feedbackType, setFeedbackType] = useState("bug"); // "bug" | "feature" | "general"
  const [details, setDetails] = useState("");
  const [attachment, setAttachment] = useState(null); // base64 preview or file
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        setError("Attachment must be smaller than 5MB.");
        return;
      }
      if (!file.type.startsWith("image/")) {
        setError("Only PNG and JPG images are supported.");
        return;
      }
      setError("");
      const reader = new FileReader();
      reader.onload = (ev) => {
        setAttachment({
          name: file.name,
          dataUrl: ev.target.result,
          size: file.size,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!details.trim()) {
      setError("Please describe your feedback or issue.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const user = auth.currentUser;
      await addDoc(collection(firestore, "feedbacks"), {
        type: feedbackType,
        details: details.trim(),
        hasAttachment: Boolean(attachment),
        attachmentName: attachment ? attachment.name : null,
        // For security and storage best practice, don't store large base64 in Firestore document directly
        attachmentMeta: attachment ? { size: attachment.size } : null,
        userId: user ? user.uid : "anonymous",
        userEmail: user ? user.email : "",
        createdAt: serverTimestamp(),
        status: "new",
        userAgent: navigator.userAgent,
      });

      setSuccess(true);
      setDetails("");
      setAttachment(null);
    } catch (err) {
      console.error("Feedback submit error:", err);
      setError("Failed to send feedback. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SettingsLayout>
      <SettingsHeader title="Send Feedback" onBack={onBack} />

      {success && (
        <Alert
          severity="success"
          sx={{
            bgcolor: "rgba(41, 201, 154, 0.15)",
            color: "#29C99A",
            border: "1px solid #29C99A",
            borderRadius: "16px",
            mb: 3,
          }}
          onClose={() => setSuccess(false)}
        >
          Thank you! Your feedback has been received. Our team will look into it.
        </Alert>
      )}

      {error && (
        <Alert
          severity="error"
          sx={{
            bgcolor: "rgba(240, 82, 82, 0.15)",
            color: "#F05252",
            border: "1px solid #F05252",
            borderRadius: "16px",
            mb: 3,
          }}
          onClose={() => setError("")}
        >
          {error}
        </Alert>
      )}

      <SettingsSection title="FEEDBACK TYPE" sx={{ ml: 0.5, mt: 0 }} />
      <SettingsGroup sx={{ p: 1.5, mb: 3 }}>
        <SettingsSegmentedControl
          value={feedbackType}
          onChange={setFeedbackType}
          options={[
            { label: "Bug Report", value: "bug" },
            { label: "Request Feature", value: "feature" },
            { label: "General", value: "general" },
          ]}
        />
      </SettingsGroup>

      <SettingsSection title="DETAILS" sx={{ ml: 0.5 }} />
      <SettingsGroup sx={{ p: 2, mb: 3 }}>
        <TextField
          multiline
          rows={5}
          fullWidth
          placeholder={
            feedbackType === "bug"
              ? "What went wrong? Steps to reproduce the issue..."
              : feedbackType === "feature"
              ? "What feature would you like to see in BunkMates?"
              : "Share your thoughts, suggestions, or comments..."
          }
          value={details}
          onChange={(e) => {
            if (e.target.value.length <= 1000) {
              setDetails(e.target.value);
            }
          }}
          variant="standard"
          InputProps={{
            disableUnderline: true,
            sx: {
              color: SETTINGS_THEME.textPrimary,
              fontSize: "0.95rem",
              lineHeight: 1.5,
            },
          }}
        />

        <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 1 }}>
          <Typography
            variant="caption"
            sx={{
              color: details.length >= 950 ? SETTINGS_THEME.error : SETTINGS_THEME.textSecondary,
              fontWeight: 600,
            }}
          >
            {details.length} / 1000
          </Typography>
        </Box>
      </SettingsGroup>

      <SettingsSection title="ATTACHMENT (OPTIONAL)" sx={{ ml: 0.5 }} />
      <SettingsGroup sx={{ p: 2, mb: 4 }}>
        {attachment ? (
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <Box
                component="img"
                src={attachment.dataUrl}
                alt="preview"
                sx={{ width: 54, height: 54, borderRadius: "12px", objectFit: "cover" }}
              />
              <Box>
                <Typography variant="body2" sx={{ color: SETTINGS_THEME.textPrimary, fontWeight: 600 }}>
                  {attachment.name}
                </Typography>
                <Typography variant="caption" sx={{ color: SETTINGS_THEME.textSecondary }}>
                  {(attachment.size / 1024).toFixed(1)} KB
                </Typography>
              </Box>
            </Box>
            <Button
              size="small"
              color="error"
              onClick={() => setAttachment(null)}
              startIcon={<DeleteOutline />}
              sx={{ textTransform: "none" }}
            >
              Remove
            </Button>
          </Box>
        ) : (
          <Button
            component="label"
            variant="outlined"
            startIcon={<PhotoCamera />}
            sx={{
              width: "100%",
              py: 1.8,
              borderRadius: "16px",
              borderColor: "rgba(255, 255, 255, 0.12)",
              color: SETTINGS_THEME.textSecondary,
              textTransform: "none",
              borderStyle: "dashed",
              "&:hover": {
                borderColor: SETTINGS_THEME.accent,
                color: "#FFFFFF",
                bgcolor: "rgba(255, 255, 255, 0.02)",
              },
            }}
          >
            Attach Screenshot (PNG/JPG, max 5MB)
            <input type="file" accept="image/png, image/jpeg" hidden onChange={handleFileChange} />
          </Button>
        )}
      </SettingsGroup>

      <Button
        variant="contained"
        fullWidth
        disabled={submitting || !details.trim()}
        onClick={handleSubmit}
        startIcon={submitting ? <CircularProgress size={18} color="inherit" /> : <Send />}
        sx={{
          py: 1.6,
          borderRadius: "20px",
          bgcolor: SETTINGS_THEME.accent,
          color: "#FFFFFF",
          fontWeight: 700,
          fontSize: "1rem",
          textTransform: "none",
          boxShadow: "none",
          "&:hover": {
            bgcolor: "#1E6BC7",
            boxShadow: "none",
          },
          "&:disabled": {
            bgcolor: "rgba(255, 255, 255, 0.12)",
            color: "rgba(255, 255, 255, 0.3)",
          },
        }}
      >
        {submitting ? "Sending..." : "Submit Feedback"}
      </Button>
    </SettingsLayout>
  );
}
