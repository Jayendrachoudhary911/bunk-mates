import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Box,
  Typography,
  Avatar,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Snackbar,
  Alert,
  Rating,
  Tabs,
  Tab,
  Slider,
  Drawer,
} from "@mui/material";
import {
  QrCode,
  EditOutlined,
  LockOutlined,
  VisibilityOutlined,
  DevicesOutlined,
  PaletteOutlined,
  TranslateOutlined,
  AccessibilityNewOutlined,
  ChatBubbleOutline,
  AutoAwesomeOutlined,
  CardTravelOutlined,
  LocationOnOutlined,
  CloudDownloadOutlined,
  WbSunnyOutlined,
  AttachMoneyOutlined,
  NotificationsNoneOutlined,
  HelpOutlineOutlined,
  FeedbackOutlined,
  StarOutlineOutlined,
  DescriptionOutlined,
  PersonAddOutlined,
  InfoOutlined,
  Logout,
  Search,
  ContentCopy,
  WhatsApp,
  Telegram,
  Email,
  PhotoCamera,
} from "@mui/icons-material";
import { auth, db, firestore } from "../firebase";
import { doc, getDoc, updateDoc, onSnapshot } from "firebase/firestore";
import { signOut } from "firebase/auth";
import Cropper from "react-easy-crop";
import { QRCodeSVG } from "qrcode.react";
import QrScanner from "./QrScanner";
import getCroppedImg from "../utils/cropImage";

import {
  SettingsLayout,
  SettingsHeader,
  SettingsSection,
  SettingsGroup,
  SettingsRow,
  SETTINGS_THEME,
} from "./settings/SettingsShared";

import {
  loadUserPreferences,
  saveUserPreferences,
  DEFAULT_PREFERENCES,
} from "../services/settingsService";

// Subpage Views
import AboutBunkMates from "./settings/AboutBunkMates";
import LicensesAttributions from "./settings/LicensesAttributions";
import SettingsSearchModal from "./settings/SettingsSearchModal";
import SendFeedbackView from "./settings/SendFeedbackView";
import AccountsSecurityView from "./settings/AccountsSecurityView";
import PrivacyDataView from "./settings/PrivacyDataView";
import AppearanceView from "./settings/AppearanceView";
import AccessibilityView from "./settings/AccessibilityView";
import LanguageRegionView from "./settings/LanguageRegionView";
import ChatsSettingsView from "./settings/ChatsSettingsView";
import MapsNavigationView from "./settings/MapsNavigationView";
import OfflineDownloadsView from "./settings/OfflineDownloadsView";
import WeatherAlertsView from "./settings/WeatherAlertsView";
import TripPreferencesView from "./settings/TripPreferencesView";
import CurrencyExpensesView from "./settings/CurrencyExpensesView";
import NotificationsSettingsView from "./settings/NotificationsSettingsView";
import HelpSupportView from "./settings/HelpSupportView";
import AIFeaturesView from "./settings/AIFeaturesView";

const APP_VERSION_LABEL = "BunkMates v3.4.1 (Build 4108)";

export default function ProfilePic({ currentUser, isEmbedded = false, onClose }) {
  const navigate = useNavigate();
  const location = useLocation();
  const isRoutePage = location?.pathname === "/profile" || location?.pathname === "/settings";

  // Navigation view state
  const [currentView, setCurrentView] = useState("main");
  const [drawerOpen, setDrawerOpen] = useState(false);

  const activeUser = currentUser || auth.currentUser;

  // Resolve initial photo URL from all available sources
  const getInitialPhoto = () => {
    return (
      currentUser?.photoURL ||
      currentUser?.profilePic ||
      currentUser?.profilePicture ||
      auth.currentUser?.photoURL ||
      ""
    );
  };

  // User Profile state
  const [userProfile, setUserProfile] = useState(() => ({
    name: currentUser?.displayName || currentUser?.name || auth.currentUser?.displayName || "",
    username: currentUser?.username || "",
    email: currentUser?.email || auth.currentUser?.email || "",
    photoURL: getInitialPhoto(),
    bio: currentUser?.bio || "",
    type: currentUser?.type || "Standard",
  }));
  const [profileLoading, setProfileLoading] = useState(true);

  // Settings Preferences state
  const [preferences, setPreferences] = useState(DEFAULT_PREFERENCES);

  // Modals & Drawers state
  const [searchOpen, setSearchOpen] = useState(false);
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [qrTab, setQrTab] = useState(0); // 0: My Code, 1: Scan
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [rateModalOpen, setRateModalOpen] = useState(false);
  const [userRating, setUserRating] = useState(5);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: "" });

  // Photo Cropping state
  const [selectedImage, setSelectedImage] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [cropDialogOpen, setCropDialogOpen] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

  // Form edit fields
  const [editName, setEditName] = useState("");
  const [editUsername, setEditUsername] = useState("");
  const [editBio, setEditBio] = useState("");

  // Load User Document & Preferences
  useEffect(() => {
    if (!activeUser) {
      setProfileLoading(false);
      return;
    }

    const uid = activeUser.uid;

    const currentPhoto =
      currentUser?.photoURL ||
      currentUser?.profilePic ||
      currentUser?.profilePicture ||
      activeUser.photoURL ||
      "";

    // Load initial profile from Auth or prop
    setUserProfile((prev) => ({
      ...prev,
      name: activeUser.displayName || currentUser?.name || prev.name || "Traveler",
      email: activeUser.email || currentUser?.email || prev.email || "",
      photoURL: currentPhoto || prev.photoURL,
    }));

    // Subscribe to Firestore User Document
    const userRef = doc(firestore, "users", uid);
    const unsubscribe = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const resolvedPhoto =
          data.photoURL ||
          data.profilePic ||
          data.profilePicture ||
          currentUser?.photoURL ||
          currentUser?.profilePic ||
          currentUser?.profilePicture ||
          activeUser.photoURL ||
          "";

        setUserProfile({
          name: data.name || data.displayName || activeUser.displayName || "Traveler",
          username: data.username || "",
          email: data.email || activeUser.email || "",
          photoURL: resolvedPhoto,
          bio: data.bio || "",
          type: data.type || "Standard",
        });
        setEditName(data.name || data.displayName || activeUser.displayName || "");
        setEditUsername(data.username || "");
        setEditBio(data.bio || "");
      }
      setProfileLoading(false);
    });

    // Load User Preferences
    loadUserPreferences(uid).then((prefs) => {
      setPreferences(prefs);
    });

    return () => unsubscribe();
  }, [activeUser, currentUser]);

  // Update Preferences Handler
  const handleUpdatePreferences = async (newPreferences) => {
    setPreferences(newPreferences);
    if (activeUser) {
      try {
        await saveUserPreferences(activeUser.uid, newPreferences);
      } catch (err) {
        console.error("Failed to save preferences:", err);
      }
    }
  };

  // Back Navigation Handler
  const handleBack = () => {
    if (currentView !== "main") {
      setCurrentView("main");
    } else if (drawerOpen) {
      setDrawerOpen(false);
    } else if (isEmbedded && onClose) {
      onClose();
    } else {
      navigate(-1);
    }
  };

  // Photo Crop Complete
  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleApplyCrop = async () => {
    try {
      const croppedImage = await getCroppedImg(selectedImage, croppedAreaPixels);
      setUserProfile((prev) => ({ ...prev, photoURL: croppedImage }));
      setCropDialogOpen(false);
      setSelectedImage(null);
    } catch (e) {
      console.error(e);
      alert("Failed to crop image.");
    }
  };

  // Save Profile Changes
  const handleSaveProfile = async () => {
    if (!activeUser) return;
    setSavingProfile(true);
    try {
      const userRef = doc(firestore, "users", activeUser.uid);
      await updateDoc(userRef, {
        name: editName.trim(),
        username: editUsername.trim(),
        bio: editBio.trim(),
        photoURL: userProfile.photoURL,
      });

      setSnackbar({ open: true, message: "Profile updated successfully!" });
      setEditProfileOpen(false);
    } catch (err) {
      console.error("Profile save error:", err);
      alert("Failed to save profile changes.");
    } finally {
      setSavingProfile(false);
    }
  };

  // Handle QR Scan Success
  const handleScanSuccess = async (decodedText) => {
    if (!decodedText) return;
    setQrModalOpen(false);

    // If it's a companion friend UID
    const targetUid = decodedText.trim();
    if (targetUid === activeUser?.uid) {
      alert("You scanned your own QR code!");
      return;
    }

    try {
      const userDoc = await getDoc(doc(db, "users", targetUid));
      if (userDoc.exists()) {
        const friend = userDoc.data();
        alert(`Found companion: ${friend.name || friend.displayName || "Traveler"}`);
        navigate(`/profile/@${friend.username || targetUid}`);
      } else {
        alert("Scanned companion not found or code invalid.");
      }
    } catch (e) {
      alert("Error scanning QR code.");
    }
  };

  // Logout Handler
  const handleLogout = async () => {
    try {
      await signOut(auth);
      setLogoutConfirmOpen(false);
      navigate("/auth/login");
    } catch (err) {
      console.error("Sign out error:", err);
    }
  };

  // Copy Profile / Share Link
  const handleCopyLink = (text) => {
    navigator.clipboard.writeText(text);
    setSnackbar({ open: true, message: "Link copied to clipboard!" });
  };

  // RENDER SETTINGS CONTENT
  const renderSettingsContent = () => {
    if (currentView === "about") {
    return (
      <AboutBunkMates
        onBack={() => setCurrentView("main")}
        onNavigateLicenses={() => setCurrentView("licenses")}
      />
    );
  }

  if (currentView === "licenses") {
    return <LicensesAttributions onBack={() => setCurrentView("main")} />;
  }

  if (currentView === "sendFeedback") {
    return <SendFeedbackView onBack={() => setCurrentView("main")} />;
  }

  if (currentView === "accountSecurity" || currentView === "linkedDevices") {
    return <AccountsSecurityView onBack={() => setCurrentView("main")} />;
  }

  if (currentView === "privacyData") {
    return (
      <PrivacyDataView
        onBack={() => setCurrentView("main")}
        preferences={preferences}
        onUpdatePreferences={handleUpdatePreferences}
        userProfile={userProfile}
      />
    );
  }

  if (currentView === "appearance") {
    return (
      <AppearanceView
        onBack={() => setCurrentView("main")}
        preferences={preferences}
        onUpdatePreferences={handleUpdatePreferences}
      />
    );
  }

  if (currentView === "accessibility") {
    return (
      <AccessibilityView
        onBack={() => setCurrentView("main")}
        preferences={preferences}
        onUpdatePreferences={handleUpdatePreferences}
      />
    );
  }

  if (currentView === "languageRegion") {
    return (
      <LanguageRegionView
        onBack={() => setCurrentView("main")}
        preferences={preferences}
        onUpdatePreferences={handleUpdatePreferences}
      />
    );
  }

  if (currentView === "chats") {
    return (
      <ChatsSettingsView
        onBack={() => setCurrentView("main")}
        preferences={preferences}
        onUpdatePreferences={handleUpdatePreferences}
      />
    );
  }

  if (currentView === "mapsNavigation") {
    return (
      <MapsNavigationView
        onBack={() => setCurrentView("main")}
        preferences={preferences}
        onUpdatePreferences={handleUpdatePreferences}
      />
    );
  }

  if (currentView === "offlineDownloads") {
    return <OfflineDownloadsView onBack={() => setCurrentView("main")} />;
  }

  if (currentView === "weatherAlerts") {
    return (
      <WeatherAlertsView
        onBack={() => setCurrentView("main")}
        preferences={preferences}
        onUpdatePreferences={handleUpdatePreferences}
      />
    );
  }

  if (currentView === "tripPreferences") {
    return (
      <TripPreferencesView
        onBack={() => setCurrentView("main")}
        preferences={preferences}
        onUpdatePreferences={handleUpdatePreferences}
      />
    );
  }

  if (currentView === "currencyExpenses") {
    return (
      <CurrencyExpensesView
        onBack={() => setCurrentView("main")}
        preferences={preferences}
        onUpdatePreferences={handleUpdatePreferences}
      />
    );
  }

  if (currentView === "notifications") {
    return (
      <NotificationsSettingsView
        onBack={() => setCurrentView("main")}
        preferences={preferences}
        onUpdatePreferences={handleUpdatePreferences}
      />
    );
  }

  if (currentView === "helpSupport") {
    return <HelpSupportView onBack={() => setCurrentView("main")} />;
  }

  if (currentView === "aiFeatures") {
    return (
      <AIFeaturesView
        onBack={() => setCurrentView("main")}
        preferences={preferences}
        onUpdatePreferences={handleUpdatePreferences}
      />
    );
  }

  // MAIN SETTINGS HOME (Matches Screenshot 1!)
  return (
    <SettingsLayout>
      {/* Top Header */}
      <SettingsHeader
        title="Settings"
        onBack={handleBack}
        rightAction={
          <IconButton
            onClick={() => setQrModalOpen(true)}
            aria-label="QR Code Scanner & Share"
            sx={{
              width: 42,
              height: 42,
              borderRadius: "50%",
              bgcolor: SETTINGS_THEME.surface,
              color: SETTINGS_THEME.textPrimary,
              border: "1px solid rgba(255, 255, 255, 0.05)",
              "&:hover": {
                bgcolor: "rgba(255, 255, 255, 0.15)",
              },
            }}
          >
            <QrCode sx={{ fontSize: 20 }} />
          </IconButton>
        }
      />

      {/* Profile Header Card */}
      <SettingsGroup
        sx={{
          p: 2.2,
          mb: 3,
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 2,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, minWidth: 0 }}>
          <Avatar
            src={userProfile.photoURL}
            alt={userProfile.name}
            sx={{
              width: 60,
              height: 60,
              borderRadius: "50%",
              bgcolor: SETTINGS_THEME.accent,
              color: "#FFFFFF",
              fontWeight: 700,
              fontSize: "1.3rem",
              border: "2px solid rgba(255, 255, 255, 0.12)",
            }}
          >
            {userProfile.name ? userProfile.name.charAt(0).toUpperCase() : "U"}
          </Avatar>

          <Box sx={{ minWidth: 0 }}>
            <Typography
              variant="body1"
              sx={{
                fontWeight: 700,
                fontSize: "1.05rem",
                color: SETTINGS_THEME.textPrimary,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {profileLoading ? "Loading..." : (userProfile.name || "BunkMates Traveler")}
            </Typography>

            <Typography
              variant="caption"
              sx={{
                color: SETTINGS_THEME.textSecondary,
                fontSize: "0.82rem",
                display: "block",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                mt: 0.2,
              }}
            >
              {userProfile.email || `@${userProfile.username || "traveler"}`}
            </Typography>
          </Box>
        </Box>

        <Button
          variant="outlined"
          size="small"
          startIcon={<EditOutlined sx={{ fontSize: 16 }} />}
          onClick={() => setEditProfileOpen(true)}
          sx={{
            borderRadius: "16px",
            color: SETTINGS_THEME.textPrimary,
            borderColor: "rgba(255, 255, 255, 0.15)",
            textTransform: "none",
            fontWeight: 600,
            fontSize: "0.82rem",
            px: 1.8,
            py: 0.7,
            whiteSpace: "nowrap",
            flexShrink: 0,
            "&:hover": {
              borderColor: SETTINGS_THEME.accent,
              bgcolor: "rgba(40, 127, 224, 0.08)",
            },
          }}
        >
          Edit
        </Button>
      </SettingsGroup>

      {/* ACCOUNT SECTION */}
      <SettingsSection title="ACCOUNT" />
      <SettingsGroup sx={{ mb: 3 }}>
        <SettingsRow
          icon={LockOutlined}
          title="Accounts & Security"
          subtitle="Password, Two-Factor Authentication, Linked devices"
          onClick={() => setCurrentView("accountSecurity")}
          showDivider
        />
        <SettingsRow
          icon={VisibilityOutlined}
          title="Privacy & Data"
          subtitle="Profile visibility, live location sharing, data export"
          onClick={() => setCurrentView("privacyData")}
          showDivider
        />
        <SettingsRow
          icon={DevicesOutlined}
          title="Linked Devices"
          subtitle="Manage active QR and web desktop login sessions"
          onClick={() => setCurrentView("linkedDevices")}
        />
      </SettingsGroup>

      {/* APP SETTINGS SECTION */}
      <SettingsSection title="APP SETTINGS" />
      <SettingsGroup sx={{ mb: 3 }}>
        <SettingsRow
          icon={PaletteOutlined}
          title="Appearance"
          subtitle="Dark/Light themes, accent color, font size preview"
          onClick={() => setCurrentView("appearance")}
          showDivider
        />
        <SettingsRow
          icon={TranslateOutlined}
          title="Language & Region"
          subtitle="App locale, time format, date conventions"
          onClick={() => setCurrentView("languageRegion")}
          showDivider
        />
        <SettingsRow
          icon={AccessibilityNewOutlined}
          title="Accessibility"
          subtitle="High contrast, color blind mode, touch target sizes"
          onClick={() => setCurrentView("accessibility")}
          showDivider
        />
        <SettingsRow
          icon={ChatBubbleOutline}
          title="Chats"
          subtitle="Chat wallpaper, read receipts, storage cache"
          onClick={() => setCurrentView("chats")}
          showDivider
        />
        <SettingsRow
          icon={AutoAwesomeOutlined}
          title="AI Features"
          subtitle="Smart recommendations and Groq cloud integration"
          onClick={() => setCurrentView("aiFeatures")}
        />
      </SettingsGroup>

      {/* TRIP EXPERIENCE SECTION (Matches Screenshot 1 top!) */}
      <SettingsSection title="TRIP EXPERIENCE" />
      <SettingsGroup sx={{ mb: 3 }}>
        <SettingsRow
          icon={CardTravelOutlined}
          title="Trip Preferences"
          subtitle="Travel style, accommodations, diet & duration"
          onClick={() => setCurrentView("tripPreferences")}
          showDivider
        />
        <SettingsRow
          icon={LocationOnOutlined}
          title="Maps & Navigation"
          subtitle="Offline cache, route preferences"
          onClick={() => setCurrentView("mapsNavigation")}
          showDivider
        />
        <SettingsRow
          icon={CloudDownloadOutlined}
          title="Offline & Downloads"
          subtitle="Storage management, offline maps"
          onClick={() => setCurrentView("offlineDownloads")}
          showDivider
        />
        <SettingsRow
          icon={WbSunnyOutlined}
          title="Weather"
          subtitle="Local weather forecasts & rain warnings"
          onClick={() => setCurrentView("weatherAlerts")}
          showDivider
        />
        <SettingsRow
          icon={AttachMoneyOutlined}
          title="Currency & Expenses"
          subtitle={`Split bills, home currency ${preferences?.currency?.baseCurrency || "INR"}`}
          onClick={() => setCurrentView("currencyExpenses")}
          showDivider
        />
        <SettingsRow
          icon={NotificationsNoneOutlined}
          title="Notifications"
          subtitle="Trip updates, chat pings, quiet hours (DND)"
          onClick={() => setCurrentView("notifications")}
        />
      </SettingsGroup>

      {/* SUPPORT SECTION (Matches Screenshot 1 bottom!) */}
      <SettingsSection title="SUPPORT" />
      <SettingsGroup sx={{ mb: 3 }}>
        <SettingsRow
          icon={HelpOutlineOutlined}
          title="Help & Support"
          subtitle="Guides, FAQs, 24/7 BunkMates bot"
          onClick={() => setCurrentView("helpSupport")}
          showDivider
        />
        <SettingsRow
          icon={FeedbackOutlined}
          title="Send Feedback"
          subtitle="Feature requests, report bugs"
          onClick={() => setCurrentView("sendFeedback")}
          showDivider
        />
        <SettingsRow
          icon={StarOutlineOutlined}
          title="Rate BunkMates"
          subtitle="Show us some love on the store"
          onClick={() => setRateModalOpen(true)}
          showDivider
        />
        <SettingsRow
          icon={DescriptionOutlined}
          title="Third-Party Licenses"
          subtitle="Open source software & dependencies"
          onClick={() => setCurrentView("licenses")}
          showDivider
        />
        <SettingsRow
          icon={PersonAddOutlined}
          title="Invite a Friend"
          subtitle="Share BunkMates with travel companions"
          onClick={() => setInviteModalOpen(true)}
          showDivider
        />
        <SettingsRow
          icon={InfoOutlined}
          title="About BunkMates"
          subtitle="App version, team credits & legal"
          onClick={() => setCurrentView("about")}
        />
      </SettingsGroup>

      {/* Sign Out Button */}
      <SettingsGroup sx={{ mb: 4 }}>
        <SettingsRow
          icon={Logout}
          title="Sign Out"
          subtitle={`Signed in as ${userProfile.email || userProfile.name}`}
          onClick={() => setLogoutConfirmOpen(true)}
          showChevron={false}
          danger
        />
      </SettingsGroup>

      {/* Centered Version Label (Matches Screenshot 1!) */}
      <Typography
        variant="caption"
        align="center"
        sx={{
          color: SETTINGS_THEME.textSecondary,
          fontSize: "0.85rem",
          mb: 4,
          display: "block",
        }}
      >
        {APP_VERSION_LABEL}
      </Typography>

      {/* Floating Bottom Search Pill (Matches Screenshot 1!) */}
      <Box
        component="button"
        type="button"
        onClick={() => setSearchOpen(true)}
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 1.5,
          width: "100%",
          maxWidth: 420,
          mx: "auto",
          py: 1.6,
          px: 3,
          borderRadius: "32px",
          bgcolor: SETTINGS_THEME.surface,
          color: SETTINGS_THEME.textSecondary,
          border: "1px solid rgba(255, 255, 255, 0.08)",
          cursor: "pointer",
          boxShadow: "0 8px 30px rgba(0, 0, 0, 0.6)",
          transition: "transform 0.15s ease, background-color 0.15s ease",
          "&:hover": {
            bgcolor: "rgba(255, 255, 255, 0.12)",
            color: "#FFFFFF",
            transform: "translateY(-2px)",
          },
        }}
      >
        <Search sx={{ fontSize: 20 }} />
        <Typography variant="body2" sx={{ fontWeight: 500, fontSize: "0.95rem" }}>
          Search settings...
        </Typography>
      </Box>

      {/* Central Registry Search Modal */}
      <SettingsSearchModal
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        onSelectSetting={(view) => setCurrentView(view)}
      />

      {/* Edit Profile Dialog */}
      <Dialog
        open={editProfileOpen}
        onClose={() => setEditProfileOpen(false)}
        PaperProps={{
          sx: {
            bgcolor: SETTINGS_THEME.card,
            color: SETTINGS_THEME.textPrimary,
            borderRadius: "26px",
            p: 1,
            width: "100%",
            maxWidth: 460,
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>Edit Profile</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", mb: 3 }}>
            <Box sx={{ position: "relative" }}>
              <Avatar
                src={userProfile.photoURL}
                alt={userProfile.name}
                sx={{ width: 90, height: 90, bgcolor: SETTINGS_THEME.accent, fontSize: "2rem" }}
              >
                {userProfile.name ? userProfile.name.charAt(0).toUpperCase() : "U"}
              </Avatar>
              <IconButton
                component="label"
                sx={{
                  position: "absolute",
                  bottom: -4,
                  right: -4,
                  bgcolor: SETTINGS_THEME.surface,
                  color: "#FFFFFF",
                  border: "2px solid #000000",
                  "&:hover": { bgcolor: SETTINGS_THEME.accent },
                }}
              >
                <PhotoCamera sx={{ fontSize: 18 }} />
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setSelectedImage(URL.createObjectURL(e.target.files[0]));
                      setCropDialogOpen(true);
                    }
                  }}
                />
              </IconButton>
            </Box>
          </Box>

          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <TextField
              label="Full Name"
              fullWidth
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              InputLabelProps={{ sx: { color: SETTINGS_THEME.textSecondary } }}
              InputProps={{
                sx: {
                  color: "#FFFFFF",
                  bgcolor: SETTINGS_THEME.surface,
                  borderRadius: "14px",
                },
              }}
            />
            <TextField
              label="Username"
              fullWidth
              value={editUsername}
              onChange={(e) => setEditUsername(e.target.value)}
              InputLabelProps={{ sx: { color: SETTINGS_THEME.textSecondary } }}
              InputProps={{
                sx: {
                  color: "#FFFFFF",
                  bgcolor: SETTINGS_THEME.surface,
                  borderRadius: "14px",
                },
              }}
            />
            <TextField
              label="Bio / Travel Quote"
              fullWidth
              multiline
              rows={3}
              value={editBio}
              onChange={(e) => setEditBio(e.target.value)}
              InputLabelProps={{ sx: { color: SETTINGS_THEME.textSecondary } }}
              InputProps={{
                sx: {
                  color: "#FFFFFF",
                  bgcolor: SETTINGS_THEME.surface,
                  borderRadius: "14px",
                },
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setEditProfileOpen(false)}
            sx={{ color: SETTINGS_THEME.textSecondary, textTransform: "none" }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSaveProfile}
            variant="contained"
            disabled={savingProfile}
            sx={{
              bgcolor: SETTINGS_THEME.accent,
              borderRadius: "14px",
              textTransform: "none",
              fontWeight: 700,
            }}
          >
            {savingProfile ? <CircularProgress size={18} color="inherit" /> : "Save Changes"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Image Cropper Dialog */}
      <Dialog
        open={cropDialogOpen}
        onClose={() => setCropDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: SETTINGS_THEME.card,
            color: "#FFFFFF",
            borderRadius: "24px",
            p: 1,
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>Crop Profile Picture</DialogTitle>
        <DialogContent sx={{ position: "relative", height: 320, width: "100%", bgcolor: "#000" }}>
          {selectedImage && (
            <Cropper
              image={selectedImage}
              crop={crop}
              zoom={zoom}
              aspect={1}
              onCropChange={setCrop}
              onCropComplete={onCropComplete}
              onZoomChange={setZoom}
            />
          )}
        </DialogContent>
        <Box sx={{ px: 3, pt: 2 }}>
          <Typography variant="caption" sx={{ color: SETTINGS_THEME.textSecondary }}>
            Zoom
          </Typography>
          <Slider
            value={zoom}
            min={1}
            max={3}
            step={0.1}
            onChange={(e, z) => setZoom(z)}
            sx={{ color: SETTINGS_THEME.accent }}
          />
        </Box>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setCropDialogOpen(false)} sx={{ color: SETTINGS_THEME.textSecondary, textTransform: "none" }}>
            Cancel
          </Button>
          <Button
            onClick={handleApplyCrop}
            variant="contained"
            sx={{ bgcolor: SETTINGS_THEME.accent, borderRadius: "14px", textTransform: "none", fontWeight: 700 }}
          >
            Apply Crop
          </Button>
        </DialogActions>
      </Dialog>

      {/* QR Code Scanner & Share Dialog */}
      <Dialog
        open={qrModalOpen}
        onClose={() => setQrModalOpen(false)}
        PaperProps={{
          sx: {
            bgcolor: SETTINGS_THEME.card,
            color: SETTINGS_THEME.textPrimary,
            borderRadius: "26px",
            p: 1.5,
            width: "100%",
            maxWidth: 420,
          },
        }}
      >
        <Tabs
          value={qrTab}
          onChange={(e, val) => setQrTab(val)}
          centered
          sx={{
            "& .MuiTab-root": { color: SETTINGS_THEME.textSecondary, textTransform: "none", fontWeight: 700 },
            "& .Mui-selected": { color: "#FFFFFF !important" },
            "& .MuiTabs-indicator": { bgcolor: SETTINGS_THEME.accent },
            mb: 2,
          }}
        >
          <Tab label="My QR Code" />
          <Tab label="Scan Companion" />
        </Tabs>

        <DialogContent sx={{ display: "flex", flexDirection: "column", alignItems: "center", py: 2 }}>
          {qrTab === 0 ? (
            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
              <Box
                sx={{
                  p: 2.5,
                  bgcolor: "#FFFFFF",
                  borderRadius: "24px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 8px 30px rgba(0, 0, 0, 0.4)",
                  mb: 2.5,
                }}
              >
                <QRCodeSVG
                  value={activeUser ? activeUser.uid : "https://app.bunkmates.xyz"}
                  size={190}
                  level="H"
                  includeMargin={false}
                />
              </Box>

              <Typography variant="body1" sx={{ fontWeight: 700, color: SETTINGS_THEME.textPrimary, mb: 0.5 }}>
                {userProfile.name}
              </Typography>
              <Typography variant="caption" sx={{ color: SETTINGS_THEME.textSecondary, mb: 2 }}>
                Scan to add as companion or link active session
              </Typography>

              <Button
                variant="outlined"
                size="small"
                startIcon={<ContentCopy />}
                onClick={() => handleCopyLink(`https://app.bunkmates.xyz/profile/@${userProfile.username || activeUser?.uid}`)}
                sx={{
                  borderRadius: "16px",
                  color: SETTINGS_THEME.textPrimary,
                  borderColor: "rgba(255, 255, 255, 0.15)",
                  textTransform: "none",
                }}
              >
                Copy Profile Link
              </Button>
            </Box>
          ) : (
            <Box sx={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}>
              <Box sx={{ width: "100%", borderRadius: "20px", overflow: "hidden", mb: 2 }}>
                <QrScanner onScanSuccess={handleScanSuccess} />
              </Box>
              <Typography variant="caption" sx={{ color: SETTINGS_THEME.textSecondary, textAlign: "center" }}>
                Point camera at a BunkMates QR code to connect
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 1.5 }}>
          <Button onClick={() => setQrModalOpen(false)} sx={{ color: SETTINGS_THEME.textSecondary, textTransform: "none" }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Invite a Friend Dialog */}
      <Dialog
        open={inviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
        PaperProps={{
          sx: {
            bgcolor: SETTINGS_THEME.card,
            color: SETTINGS_THEME.textPrimary,
            borderRadius: "26px",
            p: 1.5,
            width: "100%",
            maxWidth: 420,
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>Invite a Travel Friend</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: SETTINGS_THEME.textSecondary, mb: 3 }}>
            Plan road trips, split bills, and discover hidden gems together with BunkMates.
          </Typography>

          <Box sx={{ display: "flex", justifyContent: "space-around", mb: 3 }}>
            <IconButton
              onClick={() =>
                window.open(
                  `https://api.whatsapp.com/send?text=${encodeURIComponent(
                    "Join me on BunkMates for effortless travel planning & group budgets! https://app.bunkmates.xyz"
                  )}`,
                  "_blank"
                )
              }
              sx={{ bgcolor: "rgba(37, 211, 102, 0.15)", color: "#25D366", p: 1.8 }}
            >
              <WhatsApp fontSize="large" />
            </IconButton>

            <IconButton
              onClick={() =>
                window.open(
                  `https://t.me/share/url?url=${encodeURIComponent(
                    "https://app.bunkmates.xyz"
                  )}&text=${encodeURIComponent("Join me on BunkMates!")}`,
                  "_blank"
                )
              }
              sx={{ bgcolor: "rgba(0, 136, 204, 0.15)", color: "#0088cc", p: 1.8 }}
            >
              <Telegram fontSize="large" />
            </IconButton>

            <IconButton
              onClick={() =>
                (window.location.href = `mailto:?subject=Join%20BunkMates&body=Join%20me%20on%20BunkMates!%20https://app.bunkmates.xyz`)
              }
              sx={{ bgcolor: "rgba(255, 255, 255, 0.08)", color: "#FFFFFF", p: 1.8 }}
            >
              <Email fontSize="large" />
            </IconButton>
          </Box>

          <Button
            variant="outlined"
            fullWidth
            startIcon={<ContentCopy />}
            onClick={() => handleCopyLink("https://app.bunkmates.xyz")}
            sx={{
              borderRadius: "16px",
              color: SETTINGS_THEME.textPrimary,
              borderColor: "rgba(255, 255, 255, 0.15)",
              textTransform: "none",
              py: 1.2,
            }}
          >
            Copy Invite Link
          </Button>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 1.5 }}>
          <Button onClick={() => setInviteModalOpen(false)} sx={{ color: SETTINGS_THEME.textSecondary, textTransform: "none" }}>
            Done
          </Button>
        </DialogActions>
      </Dialog>

      {/* Rate BunkMates Dialog */}
      <Dialog
        open={rateModalOpen}
        onClose={() => setRateModalOpen(false)}
        PaperProps={{
          sx: {
            bgcolor: SETTINGS_THEME.card,
            color: SETTINGS_THEME.textPrimary,
            borderRadius: "26px",
            p: 1.5,
            width: "100%",
            maxWidth: 380,
            textAlign: "center",
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>Rate BunkMates</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <Typography variant="body2" sx={{ color: SETTINGS_THEME.textSecondary, mb: 2 }}>
            Loving your group trip experience? Let us know how we're doing!
          </Typography>

          <Rating
            name="bunkmates-rating"
            value={userRating}
            onChange={(e, val) => setUserRating(val || 5)}
            size="large"
            sx={{ mb: 2, color: "#F59E0B" }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, justifyContent: "center" }}>
          <Button onClick={() => setRateModalOpen(false)} sx={{ color: SETTINGS_THEME.textSecondary, textTransform: "none" }}>
            Maybe Later
          </Button>
          <Button
            variant="contained"
            onClick={() => {
              setRateModalOpen(false);
              setSnackbar({ open: true, message: "Thank you for supporting BunkMates!" });
            }}
            sx={{ bgcolor: SETTINGS_THEME.accent, borderRadius: "14px", textTransform: "none", fontWeight: 700, px: 3 }}
          >
            Submit Review
          </Button>
        </DialogActions>
      </Dialog>

      {/* Logout Confirmation Dialog */}
      <Dialog
        open={logoutConfirmOpen}
        onClose={() => setLogoutConfirmOpen(false)}
        PaperProps={{
          sx: {
            bgcolor: SETTINGS_THEME.card,
            color: SETTINGS_THEME.textPrimary,
            borderRadius: "24px",
            p: 1,
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>Sign Out?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: SETTINGS_THEME.textSecondary }}>
            Are you sure you want to sign out of BunkMates on this device?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setLogoutConfirmOpen(false)} sx={{ color: SETTINGS_THEME.textSecondary, textTransform: "none" }}>
            Cancel
          </Button>
          <Button
            onClick={handleLogout}
            variant="contained"
            color="error"
            startIcon={<Logout />}
            sx={{ borderRadius: "14px", textTransform: "none", fontWeight: 700 }}
          >
            Sign Out
          </Button>
        </DialogActions>
      </Dialog>

      {/* Global Toast */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ open: false, message: "" })}
      >
        <Alert
          severity="success"
          sx={{
            bgcolor: "rgba(41, 201, 154, 0.2)",
            color: "#29C99A",
            border: "1px solid #29C99A",
            borderRadius: "16px",
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </SettingsLayout>
  );
};

  // If embedded in a desktop panel or accessed directly on route /profile or /settings:
  if (isEmbedded || isRoutePage) {
    return renderSettingsContent();
  }

  // Bottom navbar / header trigger: renders the user profile picture
  return (
    <>
      <Box
        onClick={() => setDrawerOpen(true)}
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          width: "100%",
          height: "100%",
        }}
      >
        <Avatar
          src={userProfile.photoURL}
          alt={userProfile.name}
          sx={{
            width: 38,
            height: 38,
            borderRadius: "50%",
            bgcolor: SETTINGS_THEME.accent,
            color: "#FFFFFF",
            fontWeight: 700,
            fontSize: "0.95rem",
            border: "2px solid rgba(255, 255, 255, 0.2)",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.3)",
            transition: "transform 0.2s ease",
            "&:hover": {
              transform: "scale(1.08)",
            },
          }}
        >
          {userProfile.name ? userProfile.name.charAt(0).toUpperCase() : "U"}
        </Avatar>
      </Box>

      {/* Slide-Up Full Screen Drawer for Settings */}
      <Drawer
        anchor="bottom"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{
          sx: {
            width: "100%",
            height: "100%",
            maxHeight: "100vh",
            bgcolor: SETTINGS_THEME.bg,
            color: SETTINGS_THEME.textPrimary,
            overflowY: "auto",
          },
        }}
      >
        {renderSettingsContent()}
      </Drawer>
    </>
  );
}