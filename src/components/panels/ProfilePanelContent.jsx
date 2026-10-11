// src/components/panels/ProfilePanelContent.jsx
import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Avatar,
  Button,
  Stack,
  Divider,
  IconButton,
  Tooltip,
  CircularProgress,
} from "@mui/material";
import {
  Edit3 as EditIcon,
  Share as ShareIcon,
  ContentCopy as CopyIcon,
  Logout as LogoutIcon,
  ExploreOutlined as TripsIcon,
  PeopleOutline as FriendsIcon,
  SettingsOutlined as SettingsIcon,
  QrCode as QrIcon,
} from "../../icons";
import { useAuth } from "../../hooks/useAuth";
import { useThemeToggle } from "../../contexts/ThemeToggleContext";
import { useDesktopPanel } from "../../contexts/DesktopPanelContext";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../../firebase";
import { signOut } from "firebase/auth";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";

const ProfilePanelContent = () => {
  const { user: currentUser } = useAuth();
  const { mode } = useThemeToggle();
  const isDark = mode === "dark";
  const { openPanel, closePanel } = useDesktopPanel();
  const navigate = useNavigate();

  const [userData, setUserData] = useState({
    name: "",
    username: "",
    email: "",
    bio: "",
    photoURL: "",
    friends: [],
  });
  const [tripsCount, setTripsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!currentUser?.uid) return;

    const loadProfileData = async () => {
      setLoading(true);
      try {
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setUserData({
            name: data.name || currentUser.displayName || "User",
            username: data.username || "bunkmate",
            email: currentUser.email || data.email || "",
            bio: data.bio || data.userBio || "Ready to explore the world!",
            photoURL: data.photoURL || currentUser.photoURL || "",
            friends: data.friends || [],
          });
        }

        // Fetch user's trips count
        const tripsQ = query(
          collection(db, "trips"),
          where("members", "array-contains", currentUser.uid)
        );
        const tripsSnap = await getDocs(tripsQ);
        setTripsCount(tripsSnap.size);
      } catch (err) {
        console.error("Error fetching profile details:", err);
      } finally {
        setLoading(false);
      }
    };

    loadProfileData();
  }, [currentUser]);

  const handleCopyProfileLink = () => {
    const link = `${window.location.origin}/profile/${currentUser?.uid}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", py: 8 }}>
        <CircularProgress size={28} />
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      {/* ─── Profile Header Card ─── */}
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          p: 3,
          borderRadius: 4,
          backgroundColor: isDark
            ? "rgba(255, 255, 255, 0.04)"
            : "rgba(0, 0, 0, 0.03)",
          border: `1px solid ${
            isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.08)"
          }`,
        }}
      >
        <Avatar
          src={userData.photoURL}
          alt={userData.name}
          sx={{
            width: 80,
            height: 80,
            borderRadius: "24px",
            fontSize: "2rem",
            fontWeight: 700,
            mb: 1.5,
            border: `2px solid ${
              isDark ? "rgba(255, 255, 255, 0.15)" : "rgba(0, 0, 0, 0.1)"
            }`,
            boxShadow: isDark
              ? "0 8px 24px rgba(0,0,0,0.4)"
              : "0 8px 20px rgba(0,0,0,0.08)",
          }}
        >
          {userData.name?.charAt(0) || "U"}
        </Avatar>

        <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
          {userData.name}
        </Typography>

        <Typography
          variant="body2"
          sx={{
            color: isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)",
            mb: 1.5,
          }}
        >
          @{userData.username}
        </Typography>

        {userData.bio && (
          <Typography
            variant="body2"
            sx={{
              color: isDark ? "rgba(255,255,255,0.75)" : "rgba(0,0,0,0.75)",
              fontSize: "0.88rem",
              lineHeight: 1.4,
              px: 1,
            }}
          >
            {userData.bio}
          </Typography>
        )}
      </Box>

      {/* ─── Quick Stats ─── */}
      <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.5 }}>
        <Box
          onClick={() => {
            closePanel();
            navigate("/trips");
          }}
          sx={{
            p: 2,
            borderRadius: 3,
            cursor: "pointer",
            textAlign: "center",
            backgroundColor: isDark
              ? "rgba(255, 255, 255, 0.03)"
              : "rgba(0, 0, 0, 0.02)",
            border: `1px solid ${
              isDark ? "rgba(255, 255, 255, 0.06)" : "rgba(0, 0, 0, 0.06)"
            }`,
            transition: "all 0.2s ease",
            "&:hover": {
              backgroundColor: isDark
                ? "rgba(255, 255, 255, 0.07)"
                : "rgba(0, 0, 0, 0.05)",
              transform: "translateY(-1px)",
            },
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0.8, mb: 0.5 }}>
            <TripsIcon sx={{ fontSize: 18, color: isDark ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.6)" }} />
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {tripsCount}
            </Typography>
          </Box>
          <Typography variant="caption" sx={{ color: isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)" }}>
            Trips
          </Typography>
        </Box>

        <Box
          onClick={() => {
            closePanel();
            navigate("/chats");
          }}
          sx={{
            p: 2,
            borderRadius: 3,
            cursor: "pointer",
            textAlign: "center",
            backgroundColor: isDark
              ? "rgba(255, 255, 255, 0.03)"
              : "rgba(0, 0, 0, 0.02)",
            border: `1px solid ${
              isDark ? "rgba(255, 255, 255, 0.06)" : "rgba(0, 0, 0, 0.06)"
            }`,
            transition: "all 0.2s ease",
            "&:hover": {
              backgroundColor: isDark
                ? "rgba(255, 255, 255, 0.07)"
                : "rgba(0, 0, 0, 0.05)",
              transform: "translateY(-1px)",
            },
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0.8, mb: 0.5 }}>
            <FriendsIcon sx={{ fontSize: 18, color: isDark ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.6)" }} />
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {userData.friends.length}
            </Typography>
          </Box>
          <Typography variant="caption" sx={{ color: isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)" }}>
            Friends
          </Typography>
        </Box>
      </Box>

      {/* ─── Profile Action Buttons ─── */}
      <Stack spacing={1}>
        <Button
          fullWidth
          variant="outlined"
          startIcon={<EditIcon size={18} />}
          onClick={() => {
            closePanel();
            navigate("/profile");
          }}
          sx={{
            justifyContent: "flex-start",
            borderRadius: 3,
            py: 1.2,
            px: 2,
            textTransform: "none",
            fontWeight: 600,
            color: isDark ? "#fff" : "#111",
            borderColor: isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.12)",
            "&:hover": {
              borderColor: isDark ? "#fff" : "#111",
              backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)",
            },
          }}
        >
          Edit Profile Information
        </Button>

        <Button
          fullWidth
          variant="outlined"
          startIcon={copied ? <CopyIcon sx={{ fontSize: 18, color: "#4caf50" }} /> : <ShareIcon sx={{ fontSize: 18 }} />}
          onClick={handleCopyProfileLink}
          sx={{
            justifyContent: "flex-start",
            borderRadius: 3,
            py: 1.2,
            px: 2,
            textTransform: "none",
            fontWeight: 600,
            color: isDark ? "#fff" : "#111",
            borderColor: isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.12)",
            "&:hover": {
              borderColor: isDark ? "#fff" : "#111",
              backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)",
            },
          }}
        >
          {copied ? "Profile Link Copied!" : "Share Profile Link"}
        </Button>

        <Button
          fullWidth
          variant="outlined"
          startIcon={<SettingsIcon sx={{ fontSize: 18 }} />}
          onClick={() => openPanel("settings")}
          sx={{
            justifyContent: "flex-start",
            borderRadius: 3,
            py: 1.2,
            px: 2,
            textTransform: "none",
            fontWeight: 600,
            color: isDark ? "#fff" : "#111",
            borderColor: isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.12)",
            "&:hover": {
              borderColor: isDark ? "#fff" : "#111",
              backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)",
            },
          }}
        >
          Preferences & Settings
        </Button>
      </Stack>

      <Divider sx={{ my: 1, borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)" }} />

      {/* ─── Logout Button ─── */}
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
        Sign Out of BunkMates
      </Button>
    </Box>
  );
};

export default ProfilePanelContent;
