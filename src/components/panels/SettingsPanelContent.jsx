// src/components/panels/SettingsPanelContent.jsx
import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Switch,
  FormControlLabel,
  Stack,
  Button,
  Divider,
  TextField,
  InputAdornment,
  Chip,
  RadioGroup,
  Radio,
} from "@mui/material";
import {
  WbSunnyOutlined as SunIcon,
  DarkModeOutlined as MoonIcon,
  PaletteOutlined as PaletteIcon,
  LockOutlined as LockIcon,
  EngineeringOutlined as DevIcon,
  InfoOutlined as InfoIcon,
  Logout as LogoutIcon,
} from "../../icons";
import { useThemeToggle } from "../../contexts/ThemeToggleContext";
import { useAuth } from "../../hooks/useAuth";
import { useDesktopPanel } from "../../contexts/DesktopPanelContext";
import { auth, db } from "../../firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";

const accentColors = [
  { id: "default", name: "Classic", color: "#38bdf8" },
  { id: "blue", name: "Ocean", color: "#0284c7" },
  { id: "green", name: "Emerald", color: "#10b981" },
  { id: "red", name: "Crimson", color: "#f43f5e" },
  { id: "purple", name: "Amethyst", color: "#a855f7" },
];

const SettingsPanelContent = () => {
  const { mode, toggleTheme, accent, setAccent } = useThemeToggle();
  const isDark = mode === "dark";
  const { user: currentUser } = useAuth();
  const { closePanel } = useDesktopPanel();
  const navigate = useNavigate();

  const [isPrivate, setIsPrivate] = useState(false);
  const [isDeveloper, setIsDeveloper] = useState(
    localStorage.getItem("isDeveloper") === "true"
  );
  const [devKey, setDevKey] = useState("");
  const [devMessage, setDevMessage] = useState("");

  // Load privacy settings
  useEffect(() => {
    if (!currentUser?.uid) return;
    const loadPrivacy = async () => {
      try {
        const userSnap = await getDoc(doc(db, "users", currentUser.uid));
        if (userSnap.exists()) {
          const data = userSnap.data();
          setIsPrivate(data?.privacy?.profileVisibility === "private");
        }
      } catch (err) {
        console.error("Error reading privacy:", err);
      }
    };
    loadPrivacy();
  }, [currentUser]);

  const handleTogglePrivacy = async (e) => {
    const checked = e.target.checked;
    setIsPrivate(checked);
    if (!currentUser?.uid) return;

    try {
      await updateDoc(doc(db, "users", currentUser.uid), {
        "privacy.profileVisibility": checked ? "private" : "public",
      });
    } catch (err) {
      console.error("Error updating privacy:", err);
    }
  };

  const handleUnlockDev = async () => {
    try {
      const keyDoc = await getDoc(doc(db, "secret", "devkey"));
      const validKey = keyDoc.exists() ? keyDoc.data().key : null;
      if (devKey.trim() === validKey) {
        setIsDeveloper(true);
        localStorage.setItem("isDeveloper", "true");
        setDevMessage("Developer Mode Active");
        setDevKey("");
      } else {
        setDevMessage("Invalid passkey");
      }
    } catch (err) {
      console.error("Error checking dev passkey:", err);
      setDevMessage("Verification failed");
    }
  };

  const handleLogout = async () => {
    try {
      closePanel();
      await signOut(auth);
      navigate("/login");
    } catch (err) {
      console.error("Error logging out:", err);
    }
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      {/* ─── Appearance Section ─── */}
      <Box>
        <Typography
          variant="caption"
          sx={{
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: 1,
            color: isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)",
            display: "block",
            mb: 1.5,
          }}
        >
          Appearance & Theme
        </Typography>

        <Box
          sx={{
            p: 2,
            borderRadius: 3,
            backgroundColor: isDark
              ? "rgba(255, 255, 255, 0.04)"
              : "rgba(0, 0, 0, 0.03)",
            border: `1px solid ${
              isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.08)"
            }`,
            display: "flex",
            flexDirection: "column",
            gap: 2,
          }}
        >
          {/* Mode toggle */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              {isDark ? (
                <MoonIcon sx={{ fontSize: 20, color: "#90caf9" }} />
              ) : (
                <SunIcon sx={{ fontSize: 20, color: "#ffa726" }} />
              )}
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  Dark Theme
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ color: isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)" }}
                >
                  {isDark ? "Aquamorphic deep dark" : "Clean light surface"}
                </Typography>
              </Box>
            </Box>

            <Switch
              checked={isDark}
              onChange={() => {
                const nextMode = isDark ? "light" : "dark";
                toggleTheme();
                if (currentUser?.uid) {
                  import("../../services/settingsService").then(({ saveUserPreferences }) => {
                    saveUserPreferences(currentUser.uid, {
                      appearance: { theme: nextMode },
                    }).catch(() => {});
                  });
                }
              }}
              color="primary"
            />
          </Box>

          <Divider sx={{ borderColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)" }} />

          {/* Accent Color Palette */}
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
              Accent Color
            </Typography>
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
              {accentColors.map((item) => {
                const selected = (accent || "default") === item.id;
                return (
                  <Chip
                    key={item.id}
                    label={item.name}
                    onClick={() => setAccent && setAccent(item.id)}
                    sx={{
                      cursor: "pointer",
                      fontWeight: selected ? 700 : 500,
                      borderRadius: 2.5,
                      border: `1.5px solid ${selected ? item.color : "transparent"}`,
                      backgroundColor: selected
                        ? isDark
                          ? "rgba(255,255,255,0.12)"
                          : "rgba(0,0,0,0.08)"
                        : isDark
                        ? "rgba(255,255,255,0.05)"
                        : "rgba(0,0,0,0.04)",
                      color: selected ? (isDark ? "#fff" : "#000") : "text.secondary",
                      "& .MuiChip-label": {
                        display: "flex",
                        alignItems: "center",
                        gap: 0.8,
                      },
                      "&:before": {
                        content: '""',
                        width: 10,
                        height: 10,
                        borderRadius: "50%",
                        backgroundColor: item.color,
                        display: "inline-block",
                      },
                    }}
                  />
                );
              })}
            </Box>
          </Box>
        </Box>
      </Box>

      {/* ─── Privacy Section ─── */}
      <Box>
        <Typography
          variant="caption"
          sx={{
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: 1,
            color: isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)",
            display: "block",
            mb: 1.5,
          }}
        >
          Privacy & Visibility
        </Typography>

        <Box
          sx={{
            p: 2,
            borderRadius: 3,
            backgroundColor: isDark
              ? "rgba(255, 255, 255, 0.04)"
              : "rgba(0, 0, 0, 0.03)",
            border: `1px solid ${
              isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.08)"
            }`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <LockIcon sx={{ fontSize: 20 }} />
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                Private Account
              </Typography>
              <Typography
                variant="caption"
                sx={{ color: isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)" }}
              >
                Require approval for friend requests
              </Typography>
            </Box>
          </Box>

          <Switch
            checked={isPrivate}
            onChange={handleTogglePrivacy}
            color="primary"
          />
        </Box>
      </Box>

      {/* ─── Developer Section ─── */}
      <Box>
        <Typography
          variant="caption"
          sx={{
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: 1,
            color: isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)",
            display: "block",
            mb: 1.5,
          }}
        >
          Developer Options
        </Typography>

        <Box
          sx={{
            p: 2,
            borderRadius: 3,
            backgroundColor: isDark
              ? "rgba(255, 255, 255, 0.04)"
              : "rgba(0, 0, 0, 0.03)",
            border: `1px solid ${
              isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.08)"
            }`,
            display: "flex",
            flexDirection: "column",
            gap: 1.5,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <DevIcon sx={{ fontSize: 20 }} />
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                Developer Passkey
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: isDeveloper
                    ? "#4caf50"
                    : isDark
                    ? "rgba(255,255,255,0.5)"
                    : "rgba(0,0,0,0.5)",
                }}
              >
                {isDeveloper ? "Unlocked & active" : "Enter passkey to access beta features"}
              </Typography>
            </Box>
          </Box>

          {!isDeveloper ? (
            <Box sx={{ display: "flex", gap: 1 }}>
              <TextField
                size="small"
                type="password"
                placeholder="Passkey"
                value={devKey}
                onChange={(e) => setDevKey(e.target.value)}
                sx={{
                  flex: 1,
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 2.5,
                  },
                }}
              />
              <Button
                variant="contained"
                onClick={handleUnlockDev}
                sx={{
                  borderRadius: 2.5,
                  textTransform: "none",
                  fontWeight: 600,
                }}
              >
                Unlock
              </Button>
            </Box>
          ) : (
            <Chip
              label="Developer Mode Enabled"
              color="success"
              variant="outlined"
              size="small"
              sx={{ alignSelf: "flex-start", borderRadius: 2 }}
            />
          )}

          {devMessage && (
            <Typography variant="caption" sx={{ color: isDeveloper ? "#4caf50" : "#f44336" }}>
              {devMessage}
            </Typography>
          )}
        </Box>
      </Box>

      {/* ─── App Info ─── */}
      <Box
        sx={{
          p: 2,
          borderRadius: 3,
          backgroundColor: isDark
            ? "rgba(255, 255, 255, 0.02)"
            : "rgba(0, 0, 0, 0.02)",
          display: "flex",
          alignItems: "center",
          gap: 1.5,
        }}
      >
        <InfoIcon sx={{ fontSize: 18, color: "text.secondary" }} />
        <Box>
          <Typography variant="caption" sx={{ color: "text.secondary", display: "block" }}>
            BunkMates Desktop Experience
          </Typography>
          <Typography variant="caption" sx={{ fontWeight: 600, color: "text.primary" }}>
            Version Beta_3.0.08.100 • React 19 • Material UI 7
          </Typography>
        </Box>
      </Box>

      <Divider sx={{ borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)" }} />

      {/* ─── Logout ─── */}
      <Button
        fullWidth
        variant="text"
        startIcon={<LogoutIcon sx={{ fontSize: 18 }} />}
        onClick={handleLogout}
        sx={{
          borderRadius: 3,
          py: 1.2,
          textTransform: "none",
          fontWeight: 600,
          color: "#ff5252",
          "&:hover": {
            backgroundColor: "rgba(255, 82, 82, 0.08)",
          },
        }}
      >
        Sign Out
      </Button>
    </Box>
  );
};

export default SettingsPanelContent;
