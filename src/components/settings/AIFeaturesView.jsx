import React, { useState } from "react";
import {
  Box,
  Typography,
  Button,
  TextField,
  InputAdornment,
  IconButton,
  CircularProgress,
  Chip,
  Alert,
} from "@mui/material";
import {
  Visibility,
  VisibilityOff,
  CheckCircle,
  VpnKeyOutlined,
} from "@mui/icons-material";
import { doc, updateDoc } from "firebase/firestore";
import { auth, firestore } from "../../firebase";
import {
  SettingsLayout,
  SettingsHeader,
  SettingsSection,
  SettingsGroup,
  SettingsSwitchRow,
  SETTINGS_THEME,
} from "./SettingsShared";

export default function AIFeaturesView({
  onBack,
  preferences,
  onUpdatePreferences,
}) {
  const ai = preferences.ai || {};
  const [groqKey, setGroqKey] = useState(ai.groqApiKey || "");
  const [showKey, setShowKey] = useState(false);
  const [validating, setValidating] = useState(false);
  const [validationStatus, setValidationStatus] = useState("idle"); // "idle" | "valid" | "invalid"
  const [statusMessage, setStatusMessage] = useState("");

  const updateField = (field, value) => {
    onUpdatePreferences({
      ...preferences,
      ai: {
        ...ai,
        [field]: value,
      },
    });
  };

  const handleValidateKey = async () => {
    if (!groqKey.trim()) {
      setStatusMessage("Please enter a Groq API key.");
      setValidationStatus("invalid");
      return;
    }

    setValidating(true);
    setStatusMessage("");

    try {
      const response = await fetch("https://api.groq.com/openai/v1/models", {
        headers: {
          Authorization: `Bearer ${groqKey.trim()}`,
        },
      });

      if (!response.ok) {
        throw new Error("Invalid API Key or unauthorized.");
      }

      setValidationStatus("valid");
      setStatusMessage("Groq API Key verified successfully!");

      updateField("groqApiKey", groqKey.trim());

      if (auth.currentUser) {
        await updateDoc(doc(firestore, "users", auth.currentUser.uid), {
          groqApiKey: groqKey.trim(),
          groqApiKeyStatus: "valid",
          groqApiKeyValidatedAt: new Date().toISOString(),
        });
      }
    } catch (err) {
      setValidationStatus("invalid");
      setStatusMessage("Invalid Groq API key. Please check your credentials.");
    } finally {
      setValidating(false);
    }
  };

  return (
    <SettingsLayout>
      <SettingsHeader title="AI Features" onBack={onBack} />

      {/* AI Recommendations */}
      <SettingsSection title="SMART TRAVEL ASSISTANT" sx={{ ml: 0.5, mt: 0 }} />
      <SettingsGroup sx={{ mb: 3 }}>
        <SettingsSwitchRow
          title="Smart Recommendations"
          subtitle="Allow AI to generate tailored travel itineraries, sights, and food spots"
          checked={Boolean(ai.smartRecommendations !== false)}
          onChange={(v) => updateField("smartRecommendations", v)}
          showDivider
        />

        <SettingsSwitchRow
          title="In-Chat Travel Bot"
          subtitle="Enable AI assistant responses inside trips and group chats"
          checked={Boolean(ai.aiAssistantEnabled !== false)}
          onChange={(v) => updateField("aiAssistantEnabled", v)}
        />
      </SettingsGroup>

      {/* Groq Cloud Integration */}
      <SettingsSection title="BYOK: GROQ API KEY CONFIGURATION" sx={{ ml: 0.5 }} />
      <SettingsGroup sx={{ p: 2 }}>
        <Typography variant="body2" sx={{ color: SETTINGS_THEME.textSecondary, mb: 1.5 }}>
          Bring your own Groq API Key to enable ultra-fast Llama-3 inference across your itineraries and chat suggestions.
        </Typography>

        {statusMessage && (
          <Alert
            severity={validationStatus === "valid" ? "success" : "error"}
            sx={{
              bgcolor:
                validationStatus === "valid"
                  ? "rgba(41, 201, 154, 0.15)"
                  : "rgba(240, 82, 82, 0.15)",
              color: validationStatus === "valid" ? "#29C99A" : "#F05252",
              borderRadius: "14px",
              mb: 2,
            }}
          >
            {statusMessage}
          </Alert>
        )}

        <TextField
          type={showKey ? "text" : "password"}
          fullWidth
          placeholder="gsk_..."
          value={groqKey}
          onChange={(e) => setGroqKey(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <VpnKeyOutlined sx={{ color: SETTINGS_THEME.textSecondary, fontSize: 20 }} />
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                <IconButton onClick={() => setShowKey(!showKey)} sx={{ color: SETTINGS_THEME.textSecondary }}>
                  {showKey ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                </IconButton>
              </InputAdornment>
            ),
            sx: {
              bgcolor: SETTINGS_THEME.surface,
              color: "#FFFFFF",
              borderRadius: "14px",
              "& fieldset": { borderColor: "rgba(255, 255, 255, 0.08)" },
            },
          }}
          sx={{ mb: 2 }}
        />

        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          {validationStatus === "valid" ? (
            <Chip
              icon={<CheckCircle sx={{ color: "#29C99A !important" }} />}
              label="Key Active & Validated"
              size="small"
              sx={{
                bgcolor: "rgba(41, 201, 154, 0.15)",
                color: "#29C99A",
                fontWeight: 700,
                borderRadius: "12px",
              }}
            />
          ) : (
            <Box />
          )}

          <Button
            variant="contained"
            disabled={validating || !groqKey.trim()}
            onClick={handleValidateKey}
            sx={{
              bgcolor: SETTINGS_THEME.accent,
              borderRadius: "14px",
              textTransform: "none",
              fontWeight: 700,
              px: 2.5,
              py: 1,
            }}
          >
            {validating ? <CircularProgress size={18} color="inherit" /> : "Verify & Save Key"}
          </Button>
        </Box>
      </SettingsGroup>
    </SettingsLayout>
  );
}
