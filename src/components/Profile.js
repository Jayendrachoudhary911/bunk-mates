import React, { createContext, useContext, useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { auth, db, firestore } from "../firebase";
import packageJson from '../../package.json'; 
import {
  Typography,
  Container,
  Box,
  Avatar,
  Card,
  CircularProgress,
  ThemeProvider,
  createTheme,
  keyframes,
  SwipeableDrawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Slide,
  TextField,
  Switch,
  Dialog,
  DialogTitle,
  DialogActions,
  Button,
  FormControlLabel,
  Stack,
  Chip,
  Slider,
  Drawer,
  IconButton,
  InputAdornment,
} from "@mui/material";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import LogoutIcon from "@mui/icons-material/Logout";
import PersonOutlineIcon from '@mui/icons-material/PersonOutline'; 
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';   
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import MailOutlinedIcon from '@mui/icons-material/MailOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import AccountCircleOutlinedIcon from '@mui/icons-material/AccountCircleOutlined';

import LanguageOutlinedIcon from '@mui/icons-material/LanguageOutlined';
import PersonAddOutlinedIcon from '@mui/icons-material/PersonAddOutlined';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import FeedbackOutlinedIcon from '@mui/icons-material/FeedbackOutlined';
import CheckIcon from '@mui/icons-material/Check';
import SearchIcon from '@mui/icons-material/Search';
import LanguageIcon from '@mui/icons-material/Language';


import PhotoCamera from "@mui/icons-material/PhotoCamera";

import { signOut, updateProfile } from "firebase/auth";
import { doc, updateDoc, getDoc, setDoc, collection, addDoc, serverTimestamp, query, where, onSnapshot } from "firebase/firestore";
import { useTheme, useMediaQuery, Fab, Zoom } from "@mui/material";
import { weatherColors } from "../elements/weatherTheme";
import { useWeather } from "../contexts/WeatherContext";
import { useSettings } from "../contexts/SettingsContext";
import { useThemeToggle } from "../contexts/ThemeToggleContext";
import { getTheme } from "../theme";
import getCroppedImg from '../utils/cropImage';
import Cropper from "react-easy-crop";
import { availableLanguages } from '../utils/languages';

const SESSION_KEY = "bunkmate_session";
const WEATHER_STORAGE_KEY = "bunkmate_weather";

// Fade-in animation keyframes
const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;



const ProfilePic = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [anchorEl, setAnchorEl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerPage, setDrawerPage] = useState("main");
  const [showIndicator, setShowIndicator] = useState(false);
  const muiTheme = useTheme();
  const isSmallScreen = useMediaQuery(muiTheme.breakpoints.down("md"));
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  // User data states
  const [userData, setUserData] = useState({
    name: "",
    username: "",
    email: "",
    mobile: "",
    photoURL: "",
    bio: "",
    type: "",
  });

  const [editedData, setEditedData] = useState({
    name: userData.name || "",
    email: userData.email || "",
  });
  const [userType, setUserType] = useState("");
  const [photoFile, setPhotoFile] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [firestoreDataLoaded, setFirestoreDataLoaded] = useState(false);
  const { weather, setWeather, weatherLoading, setWeatherLoading } = useWeather();
  const { settings, setSettings } = useSettings();
  const [isEditing, setIsEditing] = useState(false);
  const [viewData, setViewData] = useState(null);

  const [feedback, setFeedback] = useState("");
  const [feedbackEmail, setFeedbackEmail] = useState("");
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState(false);

  const [cropDrawerOpen, setCropDrawerOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null); // URL of selected file
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [croppedImageDataUri, setCroppedImageDataUri] = useState(""); // base64 string to save
  const [selectedImageFile, setSelectedImageFile] = useState(null);


  const themeOptions = ["dark", "light"];
  const accentOptions = ["default", "blue", "green", "red", "purple"];

  const handleThemeChange = (theme) => setSettings(s => ({ ...s, theme }));
  const handleAccentChange = (accent) => setSettings(s => ({ ...s, accent, autoAccent: false }));
  const handleAutoAccentChange = (e) => setSettings(s => ({ ...s, autoAccent: e.target.checked }));
  const handleLocationModeChange = (e) => setSettings(s => ({ ...s, locationMode: e.target.checked ? "auto" : "manual" }));
  const handleManualLocationChange = (e) => setSettings(s => ({ ...s, manualLocation: e.target.value }));
  const { mode, setMode, accent, setAccent, toggleTheme } = useThemeToggle();
  const theme = getTheme(mode, accent);

  const [feedbackCount, setFeedbackCount] = useState(0);
  const [userFeedbacks, setUserFeedbacks] = useState([]);
  const [issuesCount, setIssuesCount] = useState(0);
  const [reportsCount, setReportsCount] = useState(0);
  const [userIssues, setUserIssues] = useState([]);
  const [userReports, setUserReports] = useState([]);

  // const [language, setLanguage] = useState('en-US'); // Default language
  // const [languageDrawerOpen, setLanguageDrawerOpen] = useState(false);
  // const [searchTerm, setSearchTerm] = useState('');


  const buttonWeatherBg =
  weather && weatherColors[weather.main]
    ? weatherColors[weather.main]
    : weatherColors.Default;
    

const [features] = useState([
  {
    name: "Trip Creation",
    detail: "Create new trips with names, dates, destinations, and invite members by email or username."
  },
  {
    name: "Trip Dashboard",
    detail: "View trip summary including destination, dates, group icon, checklist, members, and budget."
  },
  {
    name: "Checklist Manager",
    detail: "Add, edit, and mark tasks as complete using a swipeable drawer UI for trip planning."
  },
  {
    name: "Group Chat per Trip",
    detail: "Real-time chat with trip members powered by Firestore, automatically created with each trip."
  },
  {
    name: "Standalone Group Chats",
    detail: "Create custom group chats with friends, add emoji/icon, and manage members in a drawer UI."
  },
  {
    name: "Notes and Media",
    detail: "Add text notes with optional media to your trips; keep private or share with group."
  },
  {
    name: "Reminders & Notifications",
    detail: "Set and manage reminders linked to tasks or notes with local notifications support."
  },
  {
    name: "Trip Budgeting",
    detail: "Assign individual contributions, auto-calculate total budget, and sync with all contributors."
  },
  {
    name: "Expense Tracking",
    detail: "Log and categorize expenses for each trip, view real-time updates on usage."
  },
  {
    name: "Join via Invite Link",
    detail: "Accept or reject invites to trips or groups using a preview-based JoinTrip page."
  },
  {
    name: "Profile Management",
    detail: "Update your username, avatar, and contact info via a swipeable profile drawer."
  },
  {
    name: "Authentication",
    detail: "Secure login and registration using Supabase with persistent sessions."
  },
  {
    name: "Trip Weather Forecast",
    detail: "View current and upcoming weather for your trip location directly on the Trips screen."
  },
  {
    name: "Google Maps Integration",
    detail: "View trip route with full navigation support using external Google Maps link."
  },
  {
    name: "Dark Mode UI",
    detail: "Sleek, minimal dark-themed interface for chats, JoinTrip screen, and core UI."
  }
]);

  // const handleLanguageChange = (langCode) => {
  //   setLanguage(langCode);
  //   setLanguageDrawerOpen(false);
  // };

  // // Filters languages based on the user's search term
  // const filteredLanguages = availableLanguages.filter((lang) =>
  //   lang.name.toLowerCase().includes(searchTerm.toLowerCase())
  // );

    const changelogs = [
{
  version: "2.1.14.0.07(Beta1)",
  date: "2025-07-20",
  changes: [
    "Initial beta release of BunkMate",
    "User authentication using Supabase",
    "Create and manage trips with members",
    "Trip dashboard with weather, route link, and checklist",
    "Real-time group chat per trip with Firestore",
    "Custom group chat creation with emoji/icon support",
    "Notes system with text and media attachments",
    "Reminders with local notification support",
    "Per-member budget contribution and auto-calculated totals",
    "Expense tracking system per trip",
    "Invite members via email or join link with preview screen",
    "User profile management with swipeable drawer",
    "Google Maps redirection for trip routes",
    "Current weather display on Trips page",
    "Dark mode interface for main screens",
    "Firestore-based real-time syncing of trips, budgets, and chats"
  ]
}

  ];

  // Real-time listener for user Firestore document
  useEffect(() => {
    if (!auth.currentUser) return setLoading(false);

    setLoading(true);

    const userId = auth.currentUser.uid;
    const userDocRef = doc(firestore, "users", userId);

    const unsubscribeUser = onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setUserData(data);
        setViewData(data);
      } else {
        setUserData({
          name: "",
          username: "",
          email: "",
          mobile: "",
          photoURL: "",
          bio: "",
          type: "",
        });
        setViewData(null);
      }
      setLoading(false);
    });

    return () => {
      unsubscribeUser();
    };
  }, []);

  // Real-time listeners for feedback, issues, reports
  useEffect(() => {
    if (!auth.currentUser) return;

    const userId = auth.currentUser.uid;

    // Feedback
    const feedbackQuery = query(collection(firestore, "feedback"), where("uid", "==", userId));
    const unsubscribeFeedback = onSnapshot(feedbackQuery, (querySnapshot) => {
      const feedbackList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUserFeedbacks(feedbackList);
      setFeedbackCount(querySnapshot.size);
    });

    // Issues
    const issuesQuery = query(collection(firestore, "issues"), where("userId", "==", userId));
    const unsubscribeIssues = onSnapshot(issuesQuery, (querySnapshot) => {
      const issuesList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUserIssues(issuesList);
      setIssuesCount(querySnapshot.size);
    });

    // Reports
    const reportsQuery = query(collection(firestore, "reports"), where("userId", "==", userId));
    const unsubscribeReports = onSnapshot(reportsQuery, (querySnapshot) => {
      const reportsList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUserReports(reportsList);
      setReportsCount(querySnapshot.size);
    });

    return () => {
      unsubscribeFeedback();
      unsubscribeIssues();
      unsubscribeReports();
    };
  }, []);

  // Save profile changes
  const handleSave = async () => {
    setIsSaving(true);
    try {
      const userRef = doc(firestore, "users", auth.currentUser.uid);
      await updateDoc(userRef, {
        ...userData,
        photoURL: croppedImageDataUri || userData.photoURL || "",
      });

      await updateProfile(auth.currentUser, {
        displayName: userData.name,
        photoURL: croppedImageDataUri || userData.photoURL || undefined,
      });

      setIsSaving(false);
      alert("Profile updated successfully!");
      setDrawerPage("main");
    } catch (error) {
      setIsSaving(false);
      console.error("Error saving profile", error);
      alert("Failed to update profile");
    }
  };

  // Handle file change for cropping
  const onFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(URL.createObjectURL(file));
      setCropDrawerOpen(true);
    }
  };

  // Cropper complete handler helper
  const saveCroppedImage = async () => {
    try {
      const croppedImage = await getCroppedImg(selectedImage, croppedAreaPixels);
      setCroppedImageDataUri(croppedImage);
      setUserData(prev => ({ ...prev, photoURL: croppedImage })); // Update preview
      setCropDrawerOpen(false);
      URL.revokeObjectURL(selectedImage);
      setSelectedImage(null);
    } catch (err) {
      console.error(err);
      alert("Failed to crop image");
    }
  };

  // Handle feedback form submission with notification save
  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    setFeedbackLoading(true);

    const user = auth.currentUser;
    const userName = userData.name || "";
    const userEmail = feedbackEmail || userData.email || "";
    const userUid = user ? user.uid : "";

    try {
      await addDoc(collection(firestore, "feedback"), {
        appVersion: packageJson.version || "",
        createdAt: serverTimestamp(),
        email: userEmail,
        message: feedback,
        name: userName,
        uid: userUid,
      });

      const notifDoc = {
        admin_content: `${userName} has submitted a Feedback.`,
        content: `Hi ${userName}, We've received your Feedback and are thrilled to assist you. Here's a copy of your submission: <br> <b>Name:</b> ${userName} <br> <b>Email:</b> ${userEmail} <br> <b>Message:</b> ${feedback} <br> Our support team will reach out to you shortly if needed. Thank you for connecting with BunkMates!`,
        read: false,
        timestamp: serverTimestamp(),
        title: "📩 Your Feedback is submitted successfully!",
        type: "feedback",
        uid: userUid,
      };

      await addDoc(collection(firestore, "notifications"), notifDoc);

      setFeedback("");
      setFeedbackEmail("");
      setFeedbackSuccess(true);
    } catch (err) {
      alert("Failed to send feedback. Please try again.");
    }
    setFeedbackLoading(false);
  };

  // Drawer open/close handlers
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const settingsPage = params.get("settings");

    if (settingsPage) {
      // A list of valid pages to prevent opening the drawer for arbitrary URL params
      const validPages = [
        "main", "profile", "accounts", "chats", "generalSettings", 
        "support", "feedback", "inviteFriend", "about", "featuresChangelog"
      ];

      if (validPages.includes(settingsPage)) {
        setDrawerOpen(true);
        setDrawerPage(settingsPage);
      } else {
        // If the URL param is not a valid page, close the drawer by clearing the URL
        navigate(location.pathname, { replace: true });
      }
    } else {
      setDrawerOpen(false);
    }
    // The dependency array ensures this effect runs whenever the URL's search string changes.
  }, [location.search, location.pathname, navigate]);

  const handleDrawerOpen = () => {
    navigate("?settings=main");
  };
  const handleDrawerClose = () => {
    navigate(location.pathname);
    setIsEditing(false);
  };


    const handleSetDrawerPage = (page) => {
    navigate(`?settings=${page}`);
  };

  // Logout confirmation and handler
  const handleLogout = async () => {
    try {
      await signOut(auth);
      // Clear local session etc if needed
      navigate("/login");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  const onBack = () => {
    navigate(-1);
  };


  return (
  <ThemeProvider theme={theme}>
<>
{userData.type === "Dev Beta" ? (
<>
  <Box
sx={{
  display: "flex",
  alignItems: "center",
  cursor: "pointer",
  borderRadius: "12px",
  p: 1,
  color: theme.palette.text.primary,
  transition: "background-color 0.3s ease",
  mr: isSmallScreen ? 0 : 1,
  ...(isSmallScreen
    ? {}
    : {
        backgroundColor: "#101010",
        "&:hover": {
          backgroundColor: "#2c2c2c",
        },
      }),
}}
    onClick={handleDrawerOpen}
  >
    <Avatar src={userData.photoURL || ""} sx={{ width: 40, height: 40, mr: isSmallScreen ? 0 : 1 }} />
    {!isSmallScreen && (
      <>
        <Box sx={{ textAlign: "right", mr: 1 }}>
          <Typography variant="body1" sx={{ fontWeight: "bold", color: "text.primary" }}>
            {userData.name || "Username"}
          </Typography>
          <Typography variant="body2" sx={{ fontSize: "0.8rem", color: "text.secondary" }}>
            {userData.email || "Email"}
          </Typography>
        </Box>
        <ArrowDropDownIcon sx={{ color: "text.primary" }} />
      </>
    )}
  </Box>

  {/* Bottom Drawer */}
<Drawer
  anchor="right"
  open={drawerOpen}
  onClose={handleDrawerClose}
  fullWidth
  PaperProps={{
    sx: {
      mx: "auto",
      width: isSmallScreen ? "92vw" : 400,
      backgroundColor: theme.palette.background.main,
      backdropFilter: 'blur(80px)',
      backgroundImage: 'none',
      color: theme.palette.text.primary,
      px: 2,
      pb: 3,
    },
  }}
>

  {/* Main Settings Page */}
  {drawerPage === "main" && (
    <>
      {/* User info */}
      <Box sx={{ display: "flex", alignItems: "left", my: 2, mx: 2 }}>
        <IconButton edge="start" color="inherit" onClick={handleDrawerClose} sx={{ mr: 2 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography sx={{ fontSize: '1.5rem' }}><h2>Settings</h2></Typography>
      </Box>
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, my: 0, mx: 2, py: 2, borderRadius: 5, '&:hover': { bgcolor: mode === "dark" ? '#f1f1f121' : '#e7e7e788'} }} onClick={() => handleSetDrawerPage("profile")}>
        <Avatar src={userData.photoURL || ""} sx={{ width: 50, height: 50 }} />
        <Box>
          <Typography variant="subtitle1" fontWeight="bold">
            {userData.name || "Username"}
          </Typography>
          <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
            {userData.email || "Email"}
          </Typography>
        </Box>
      </Box>

      <Divider sx={{ borderColor: "#333" }} />

      {/* Menu List */}
      <List sx={{ my: 0, gap: 0, display: "flex", flexDirection: "column" }}>

        {/* Accounts */}
        <ListItem sx={{ pb: 0 }}>
          <ListItemButton onClick={() => handleSetDrawerPage("accounts")} sx={{ borderRadius: 3, py: 0.5, px: 1, '&:hover': { bgcolor: mode === "dark" ? '#f1f1f121' : '#e7e7e788' } }}>
            <ListItemIcon sx={{ minWidth: 40 }}><AccountCircleOutlinedIcon sx={{ color: theme.palette.text.primary }} /></ListItemIcon>
            <ListItemText primary="Accounts" secondary="User privacy and security" primaryTypographyProps={{ fontWeight: 'medium' }} secondaryTypographyProps={{ variant: 'body2', color: 'text.secondary', noWrap: true }} />
          </ListItemButton>
        </ListItem>

        {/* Chats */}
        <ListItem sx={{ pb: 0 }}>
          <ListItemButton onClick={() => handleSetDrawerPage("chats")} sx={{ borderRadius: 3, py: 0.5, px: 1, '&:hover': { bgcolor: mode === "dark" ? '#f1f1f121' : '#e7e7e788' } }}>
            <ListItemIcon sx={{ minWidth: 40 }}><ChatBubbleOutlineIcon sx={{ color: theme.palette.text.primary }} /></ListItemIcon>
            <ListItemText primary="Chats" secondary="Theme, Wallpapers, and Chat Settings" primaryTypographyProps={{ fontWeight: 'medium' }} secondaryTypographyProps={{ variant: 'body2', color: 'text.secondary', noWrap: true }} />
          </ListItemButton>
        </ListItem>

        {/* General Settings */}
        <ListItem sx={{ pb: 0 }}>
          <ListItemButton onClick={() => handleSetDrawerPage("generalSettings")} sx={{ borderRadius: 3, py: 0.5, px: 1, '&:hover': { bgcolor: mode === "dark" ? '#f1f1f121' : '#e7e7e788' } }}>
            <ListItemIcon sx={{ minWidth: 40 }}><SettingsOutlinedIcon sx={{ color: theme.palette.text.primary }} /></ListItemIcon>
            <ListItemText primary="General Settings" secondary="App Theme, Language, and Location" primaryTypographyProps={{ fontWeight: 'medium' }} secondaryTypographyProps={{ variant: 'body2', color: 'text.secondary', noWrap: true }} />
          </ListItemButton>
        </ListItem>

        {/* Help */}
        <ListItem sx={{ pb: 0 }}>
          <ListItemButton onClick={() => handleSetDrawerPage("support")} sx={{ borderRadius: 3, py: 0.5, px: 1, '&:hover': { bgcolor: mode === "dark" ? '#f1f1f121' : '#e7e7e788' } }}>
            <ListItemIcon sx={{ minWidth: 40 }}><HelpOutlineIcon sx={{ color: theme.palette.text.primary }} /></ListItemIcon>
            <ListItemText primary="Help" secondary="Contact support and privacy policies" primaryTypographyProps={{ fontWeight: 'medium' }} secondaryTypographyProps={{ variant: 'body2', color: 'text.secondary', noWrap: true }} />
          </ListItemButton>
        </ListItem>

        {/* Send Feedback */}
        <ListItem sx={{ pb: 0 }}>
          <ListItemButton onClick={() => handleSetDrawerPage("feedback")} sx={{ borderRadius: 3, py: 0.5, px: 1, '&:hover': { bgcolor: mode === "dark" ? '#f1f1f121' : '#e7e7e788' } }}>
            <ListItemIcon sx={{ minWidth: 40 }}><FeedbackOutlinedIcon sx={{ color: theme.palette.text.primary }} /></ListItemIcon>
            <ListItemText primary="Send feedback" secondary="Report technical issues" primaryTypographyProps={{ fontWeight: 'medium' }} secondaryTypographyProps={{ variant: 'body2', color: 'text.secondary', noWrap: true }} />
          </ListItemButton>
        </ListItem>

        {/* Invite a Friend */}
        <ListItem sx={{ pb: 0 }}>
          <ListItemButton onClick={() => handleSetDrawerPage("inviteFriend")} sx={{ borderRadius: 3, py: 1.5, px: 1, '&:hover': { bgcolor: mode === "dark" ? '#f1f1f121' : '#e7e7e788' } }}>
            <ListItemIcon sx={{ minWidth: 40 }}><PersonAddOutlinedIcon sx={{ color: theme.palette.text.primary }} /></ListItemIcon>
            <ListItemText primary="Invite a Friend" primaryTypographyProps={{ fontWeight: 'medium' }} />
          </ListItemButton>
        </ListItem>

        {/* About */}
        <ListItem sx={{ pb: 0 }}>
          <ListItemButton onClick={() => handleSetDrawerPage("about")} sx={{ borderRadius: 3, py: 1.5, px: 1, '&:hover': { bgcolor: mode === "dark" ? '#f1f1f121' : '#e7e7e788' } }}>
            <ListItemIcon sx={{ minWidth: 40 }}><InfoOutlinedIcon sx={{ color: theme.palette.text.primary }} /></ListItemIcon>
            <ListItemText primary="About" primaryTypographyProps={{ fontWeight: 'medium' }} />
          </ListItemButton>
        </ListItem>
      </List>
    </>
  )}

  {/* ⭐️ NEW: Accounts Page */}
  {drawerPage === "accounts" && (
    <Container sx={{ mt: 1, mb: 2 }}>
      <Button startIcon={<ArrowBackIcon />} onClick={() => handleSetDrawerPage("main")} sx={{ mb: 2, borderRadius: 8, color: theme.palette.text.primary, backgroundColor: mode === "dark" ? "#f1f1f111" : "#e0e0e071", '&:hover': { backgroundColor: "#f1f1f121" } }}>
        Back
      </Button>
      <Typography variant="h5" fontWeight="bold" sx={{ mb: 3 }}>
        Account Settings
      </Typography>
      <Typography>
        Privacy, security, and account management options will go here.
      </Typography>
      {/* Add your account settings components here */}
    </Container>
  )}

  {/* ⭐️ NEW: Chats Page */}
  {drawerPage === "chats" && (
    <Container sx={{ mt: 1, mb: 2 }}>
      <Button startIcon={<ArrowBackIcon />} onClick={() => handleSetDrawerPage("main")} sx={{ mb: 2, borderRadius: 8, color: theme.palette.text.primary, backgroundColor: mode === "dark" ? "#f1f1f111" : "#e0e0e071", '&:hover': { backgroundColor: "#f1f1f121" } }}>
        Back
      </Button>
      <Typography variant="h5" fontWeight="bold" sx={{ mb: 3 }}>
        Chat Settings
      </Typography>
      <Typography>
        Theme, wallpaper, and other chat-related settings will be here.
      </Typography>
      {/* Add your chat settings components here */}
    </Container>
  )}

  {/* ⭐️ NEW: Invite a Friend Page */}
  {drawerPage === "inviteFriend" && (
    <Container sx={{ mt: 1, mb: 2 }}>
      <Button startIcon={<ArrowBackIcon />} onClick={() => handleSetDrawerPage("main")} sx={{ mb: 2, borderRadius: 8, color: theme.palette.text.primary, backgroundColor: mode === "dark" ? "#f1f1f111" : "#e0e0e071", '&:hover': { backgroundColor: "#f1f1f121" } }}>
        Back
      </Button>
      <Typography variant="h5" fontWeight="bold" sx={{ mb: 3 }}>
        Invite a Friend
      </Typography>
      <Typography sx={{ mb: 2 }}>
        Share your invite link with friends to connect on the app.
      </Typography>
      <TextField
          label="Your Invite Link"
          defaultValue="https://yourapp.com/invite/user123"
          fullWidth
          InputProps={{ readOnly: true }}
      />
      <Button variant="contained" sx={{ mt: 2 }} onClick={() => navigator.clipboard.writeText("https://yourapp.com/invite/user123")}>
        Copy Link
      </Button>
    </Container>
  )}


{drawerPage === "generalSettings" && (
  <Container sx={{ mt: 5, mb: 2 }}>

        {/* Header */}
<Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
  <IconButton
    onClick={() => handleSetDrawerPage("main")}
    sx={{
      mr: 2,
      borderRadius: 8,
      color: theme.palette.text.primary,
      backgroundColor: mode === "dark" ? "#f1f1f111" : "#e0e0e071",
      '&:hover': { backgroundColor: "#f1f1f121" },
    }}
  >
    <ArrowBackIcon />
  </IconButton>
  <Typography variant="h5" fontWeight="bold">
    General Settings
  </Typography>
</Box>


    {/* THEME MODE: "Dark" / "Light" pill toggle group */}
    <Box sx={{ mb: 3 }}>
      <Typography variant="subtitle1" sx={{ mb: 1 }}>Who can use dark mode?</Typography>
      {/* Really, it's just the theme mode selector */}
      <Box sx={{ display: 'flex', gap: 2 }}>
        <Button
          onClick={() => { setMode("dark"); }}
          variant={mode === "dark" ? "contained" : "outlined"}
          sx={{
            borderRadius: 999,
            px: 3, py: 0.5,
            fontWeight: 600,
            fontSize: "1rem",
            backgroundColor: mode === "dark" ? "#121212ff" : "transparent",
            color: mode === "dark" ? "#fff" : theme.palette.text.primary,
            borderColor: "#aaa",
            boxShadow: "none",
          }}
        >Dark</Button>
        <Button
          onClick={() => { setMode("light"); }}
          variant={mode === "light" ? "contained" : "outlined"}
          sx={{
            borderRadius: 999,
            px: 3, py: 0.5,
            fontWeight: 600,
            fontSize: "1rem",
            backgroundColor: mode === "light" ? "#fff" : "transparent",
            color: mode === "light" ? "#222" : theme.palette.text.primary,
            borderColor: "#aaa",
            boxShadow: "none",
            '&:hover': { backgroundColor: "#f7f7f7", color: "#222" },
          }}
        >Light</Button>
      </Box>
    </Box>

    {/* ACCENT COLOR: group of pill/toggle buttons, like image */}
    <Box sx={{ mb: 3 }}>
      <Typography variant="subtitle1" sx={{ mb: 1 }}>Accent Color</Typography>
      <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
        {[
          { opt: "default", label: "", bg: theme.palette.primary.bg , color: theme.palette.text.primary },
        ].map(({ opt, label, bg, color }) => (
          <Button
            key={opt}
            onClick={() => setAccent(opt)}
            variant={"contained"}
            fullWidth
            sx={{
              borderRadius: 4,
              px: 3, py: 1.2,
              fontWeight: 600,
              fontSize: "1rem",
              height: 50,
              backgroundColor: bg,
              boxShadow: "none",
              mb: 3,
              color: accent === opt ? color : theme.palette.primary.main,
              '&:hover': {
                backgroundColor: bg,
                color: color
              }
            }}
          >This is the Accent Preview</Button>
        ))}
      </Box>

<Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", width: 240, mx: "auto", }}>
  {[
    { opt: "blue", label: "Blue", bg: "#bbdefb", color: "#fff" },
    { opt: "green", label: "Green", bg: "#c8e6c9", color: "#fff" },
    { opt: "red", label: "Red", bg: "#EF5350", color: "#fff" },
    { opt: "orange", label: "Orange", bg: "#FFCC80", color: "#fff" },
    { opt: "yellow", label: "Yellow", bg: "#FFEB3B", color: "#000" },
    { opt: "turquoise", label: "Turquoise", bg: "#b6f6ffff", color: "#fff" },
    { opt: "lime", label: "Lime", bg: "#DCE775", color: "#000" },
    { opt: "purple", label: "Purple", bg: "#f4b8ffff", color: "#fff" },
    { opt: "skyblue", label: "Sky Blue", bg: "#81D4FA", color: "#fff" },
    { opt: "mint", label: "Mint", bg: "#A5D6A7", color: "#fff" },
  ].map(({ opt, label, bg, color }) => (
    <Button
      key={opt}
      onClick={() => setAccent(opt)}
      variant={"contained"}
      sx={{
        borderRadius: 999,
        fontWeight: 600,
        fontSize: "0.875rem",
        minWidth: 35,
        minHeight: 35,
        backgroundColor: bg,
        color: accent === opt ? color : theme.palette.text.primary,
        border: accent === opt ? "2px solid" : "2px solid",
        borderColor: accent === opt ? theme.palette.text.primary : "#aaa",
        textTransform: "none",
        boxShadow: "none",
        '&:hover': {
          backgroundColor: bg,
          color: color
        }
      }}
    />
  ))}
</Box>

    </Box>

            {/* <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" sx={{ mb: 1 }}>
            Language
          </Typography>
          <Button
            fullWidth
            onClick={() => setLanguageDrawerOpen(true)}
            startIcon={<LanguageIcon />}
            sx={{
              justifyContent: 'flex-start',
              py: 1.5,
              px: 2,
              borderRadius: 2,
              color: theme.palette.text.primary,
              backgroundColor: mode === 'dark' ? '#f1f1f111' : '#e0e0e071',
              textTransform: 'none',
              '&:hover': { backgroundColor: '#f1f1f121' },
            }}
          >
            {availableLanguages.find((l) => l.code === language)?.name || 'Select Language'}
          </Button>
        </Box> */}

    {/* LOCATION: Allow pill-style toggle for auto/manual */}
<Box sx={{ mb: 4 }}>
  <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>
    Location
  </Typography>

  <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
    <Button
      variant={settings.locationMode === "auto" ? "contained" : "outlined"}
      onClick={() => handleLocationModeChange({ target: { checked: true } })}
      sx={{
        borderRadius: 50,
        px: 4,
        py: 1.5,
        fontWeight: 600,
        textTransform: "none",
        backgroundColor: settings.locationMode === "auto" ? theme.palette.primary.main : "transparent",
        color: settings.locationMode === "auto" ? "#fff" : theme.palette.text.primary,
        borderColor: settings.locationMode === "auto" ? theme.palette.primary.main : "#ccc",
        boxShadow: "none",
        '&:hover': {
          backgroundColor: settings.locationMode === "auto" ? theme.palette.primary.dark : "#f5f5f5",
        },
        minWidth: 100,
      }}
    >
      Auto
    </Button>

    <Button
      variant={settings.locationMode === "manual" ? "contained" : "outlined"}
      onClick={() => handleLocationModeChange({ target: { checked: false } })}
      sx={{
        borderRadius: 50,
        px: 4,
        py: 1.5,
        fontWeight: 600,
        textTransform: "none",
        backgroundColor: settings.locationMode !== "auto" ? theme.palette.primary.main : "transparent",
        color: settings.locationMode !== "auto" ? "#fff" : theme.palette.text.primary,
        borderColor: settings.locationMode !== "auto" ? theme.palette.primary.main : "#ccc",
        boxShadow: "none",
        '&:hover': {
          backgroundColor: settings.locationMode !== "auto" ? theme.palette.primary.dark : "#f5f5f5",
        },
        minWidth: 100,
      }}
    >
      Manual
    </Button>
  </Box>

  {settings.locationMode !== "auto" && (
    <TextField
      label="Set Location Manually"
      value={settings.manualLocation}
      onChange={handleManualLocationChange}
      fullWidth
      variant="outlined"
      sx={{
        mt: 3,
        '& .MuiOutlinedInput-root': {
          borderRadius: 3,
        },
      }}
    />
  )}
</Box>


          {/* <Drawer
        anchor="bottom"
        open={languageDrawerOpen}
        onClose={() => setLanguageDrawerOpen(false)}
        PaperProps={{
          sx: {
            height: '80vh',
            maxHeight: '600px',
            mx: 'auto',
            maxWidth: 450,
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            backgroundColor: theme.palette.background.paper,
          },
        }}
      >
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
            Select Language
          </Typography>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Search language"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
              sx: { borderRadius: 999 },
            }}
          />
        </Box>
        <List sx={{ overflowY: 'auto', px: 1 }}>
          {filteredLanguages.map((lang) => (
            <ListItemButton
              key={lang.code}
              selected={language === lang.code}
              onClick={() => handleLanguageChange(lang.code)}
              sx={{ borderRadius: 2, my: 0.5 }}
            >
              <ListItemText primary={lang.name} />
              {language === lang.code && <CheckIcon color="primary" />}
            </ListItemButton>
          ))}
        </List>
      </Drawer> */}
  </Container>
)}


{drawerPage === "about" && (
  <Container sx={{ mt: 2, mb: 4 }}>
    {/* Back Button */}
    <Button
      startIcon={<ArrowBackIcon />}
      onClick={() => handleSetDrawerPage("main")}
      sx={{
        mb: 2,
        borderRadius: 8, 
        color: theme.palette.text.primary,
        backgroundColor: mode === "dark" ? "#f1f1f111" : "#e0e0e071", 
        '&:hover': { backgroundColor: "#f1f1f121" },
      }}
    >
      Back
    </Button>

    {/* Header */}
    <Typography variant="h5" fontWeight="bold" sx={{ mb: 1 }}>
      App Version & About
    </Typography>

    {/* Version Card */}
    <Box
      sx={{
        backgroundColor: mode === "dark" ? "#1e1e1e71" : "#cccccc81",
        p: 2,
        borderRadius: 5, 
        mb: 3,
        mt: 3,
        boxShadow: "none",
      }}
      onClick={() => handleSetDrawerPage("featuresChangelog")}
    >
      <Typography variant="subtitle1" fontWeight="bold">
        Version
      </Typography>
      <Typography variant="body2" sx={{ color: mode === "dark" ? "#ccc" : "#555" }}>
        {packageJson.version || "N/A"}
      </Typography>
    </Box>

    {/* About Text */}
    <Typography variant="body1" sx={{ mb: 3, color: mode === "dark" ? "#aaa" : "#333" }}>
      This app is designed to simplify your group trip planning experience — chat, split expenses, manage tasks, and discover places together. 
      Built with ❤️ in India.
    </Typography>

    {/* Credits / Licenses */}
    <Box sx={{ mb: 4 }}>
      <Typography variant="h6" gutterBottom>Licenses & Credits</Typography>
        <Typography variant="body2" sx={{ color: mode === "dark" ? "#aaa" : "#333", lineHeight: 1.8 }}>
          • React.js — MIT License<br />
          • Firebase (Auth, Firestore, Messaging) — Apache License 2.0<br />
          • Material UI (v5) — MIT License<br />
          • OpenWeatherMap API — CC BY-SA 4.0 (Attribution Required)<br />
          • Google Fonts — SIL Open Font License 1.1<br />
          • Material Icons — Apache License 2.0<br />
          • Additional Libraries — MIT/Apache Licensed Open Source
        </Typography>
    </Box>

    {/* Policy Links */}
    <Box sx={{ mb: 4 }}>
      <Typography variant="h6" sx={{ mb: 1 }}>Legal & Policy</Typography>

      <Button
        fullWidth
        variant="outlined"
        sx={{ mb: 2, backgroundColor: mode === "dark" ? "#f1f1f111" : "#e0e0e071",  color: theme.palette.text.primary, border: "1px solid #ccc", borderRadius: 3 }}
        onClick={() => window.open('/privacy-policy', '_blank')}
      >
        Privacy Policy
      </Button>

      <Button
        fullWidth
        variant="outlined"
        sx={{ mb: 2, backgroundColor: mode === "dark" ? "#f1f1f111" : "#e0e0e071",  color: theme.palette.text.primary, border: "1px solid #ccc", borderRadius: 3 }}
        onClick={() => window.open('/terms', '_blank')}
      >
        Terms of Service
      </Button>
    </Box>

    {/* Contact / Social */}
    <Box sx={{ mb: 3 }}>
      <Typography variant="h6" sx={{ mb: 1 }}>Connect With Us</Typography>

      <Stack direction="row" spacing={2}>
        <Button
          variant="contained"
          sx={{ backgroundColor: mode === "dark" ? "#f1f1f111" : "#e0e0e071",  color: theme.palette.text.primary, minWidth: 48, boxShadow: "none" }}
          onClick={() => window.open('mailto:jayendrachoudhary.am@gmail.com')}
        >
          <MailOutlinedIcon />
        </Button>
        {/* Add social buttons here if needed */}
      </Stack>
    </Box>

    {/* Open Source Link */}
    <Box sx={{ mt: 4, backgroundColor: mode === "dark" ? "#f1f1f111" : "#e0e0e071",  px: 3, py: 3, borderRadius: 6 }}>
      <Typography variant="h6" gutterBottom>Open Source</Typography>
      <Typography variant="body2" sx={{ color: mode === "dark" ? "#aaa" : "#333", mb: 2 }}>
        Our source code is available on GitHub. Feel free to contribute, report issues, or fork it.
      </Typography>
      <Button
        variant="outlined"
        fullWidth
        sx={{ color: "#000", borderColor: "#555", borderRadius: 3 }}
      >
        Providing Soon...
      </Button>
      {/* <Button
        variant="outlined"
        fullWidth
        onClick={() => window.open('https://github.com/yourapp', '_blank')}
        sx={{ color: "#000", borderColor: "#555" }}
      >
        View on GitHub
      </Button> */}
    </Box>
  </Container>
)}


      {drawerPage === "featuresChangelog" && (
        <Container sx={{ mt: 1, mb: 2 }}>
    <Button
      startIcon={<ArrowBackIcon />}
      onClick={() => handleSetDrawerPage("about")}
      sx={{
        mb: 2,
        borderRadius: 8, 
        color: theme.palette.text.primary,
        backgroundColor: mode === "dark" ? "#f1f1f111" : "#e0e0e071", 
        '&:hover': { backgroundColor: "#f1f1f121" },
      }}
    >
      Back
    </Button>
          <Typography variant="h5" gutterBottom><h2>Features & Changelog</h2></Typography>

          {/* Features Section */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom>Features</Typography>
            {features.map(({ name, detail }, idx) => (
              <Box key={idx} sx={{ mb: 2, ml: 2 }}>
                <Typography variant="subtitle1" component="div" fontWeight="bold">{name}</Typography>
                <Typography variant="body2" sx={{ color: mode === "dark" ? "#aaa" : "#333" }}>{detail}</Typography>
              </Box>
            ))}
          </Box>

          {/* Changelog Section */}
          <Box>
            <Typography variant="h6" gutterBottom>Changelog</Typography>
{changelogs.map(({ version, date, changes }) => (
  <Card sx={{ my: 2, p: 2, boxShadow: "none", backgroundColor: mode === "dark" ? "#f1f1f111" : "#e0e0e071", borderRadius: 5 }} key={version}>
    <Typography variant="subtitle1" fontWeight="bold">
      Version {version} – <span style={{ color: mode === "dark" ? "#aaa" : "#333" }}>{date}</span>
    </Typography>
    <ul style={{ paddingLeft: 20 }}>
      {changes.map((c, i) => <li key={i}><Typography variant="body2">{c}</Typography></li>)}
    </ul>
  </Card>
))}

          </Box>
        </Container>
      )}

{drawerPage === "support" && (
  <Container sx={{ mt: 1, mb: 2 }}>
    <Button
      startIcon={<ArrowBackIcon />}
      onClick={() => handleSetDrawerPage("main")}
      sx={{
        mb: 1,
        borderRadius: 8, 
        color: theme.palette.text.primary,
        backgroundColor: mode === "dark" ? "#f1f1f111" : "#e0e0e071", 
        '&:hover': { backgroundColor: "#f1f1f121" },
      }}
    >
      Back
    </Button>
    <Typography variant="h5" gutterBottom><h2>Support & Help</h2></Typography>

    <Typography variant="body1" sx={{ mb: 3 }}>
      We're here to help you! If you encounter any issues, have questions, or need assistance, please explore the following resources or get in touch with us directly.
    </Typography>

    <Stack spacing={2} sx={{ mb: 4 }}>
    {/* <Card sx={{ px: 2, py: 1, backgroundColor: mode === "dark" ? "#f1f1f111" : "#e0e0e071",  boxShadow: "none" }}>
      <ListItemText
        primary="Support & Help"
        secondary="Support for any issues or questions"
      />
    </Card> */}
    <Card
      onClick={() => window.open("/terms-and-conditions", "_blank")}
      sx={{ px: 2, py: 1, backgroundColor: mode === "dark" ? "#f1f1f111" : "#e0e0e071",  boxShadow: "none", borderRadius: 5 }}
    >
      <ListItemText
        primary="Terms & Conditions"
        secondary="Terms of service and usage policies"
      />
    </Card>
    {/* <Card
      onClick={() => window.open("/faq", "_blank")}
      sx={{ px: 2, py: 1, backgroundColor: mode === "dark" ? "#f1f1f111" : "#e0e0e071",  boxShadow: "none" }}
    >
      <ListItemText
        primary="Frequently Asked Questions"
        secondary="Find answers to common questions"
      />
    </Card> */}
    <Card
      onClick={() => window.open("mailto:jayendrachoudhary.am@gmail.com")} 
      sx={{ px: 2, py: 1, backgroundColor: mode === "dark" ? "#f1f1f111" : "#e0e0e071",  boxShadow: "none", borderRadius: 5  }}
    >
      <ListItemText
        primary="Contact Support"
        secondary="Email us at jayendrachoudhary.am@gmail.com"
      />
    </Card>
</Stack>

    <Button
      variant="contained"
      color="success"
      fullWidth
      onClick={() => {
        // Navigate to community page (adjust if using react-router or other navigation)
        window.open("/community", "_blank");
      }}
      sx={{ fontWeight: "bold", textTransform: "none", mb: 3, borderRadius: 3, backgroundColor: mode === "dark" ? '#f1f1f131' : "#0c0c0c10", color: theme.palette.text.primary, border: 'transparent', boxShadow: 'none' }}
    >
      Visit Our Community
    </Button>
  </Container>
)}


{drawerPage === "profile" && (
  <Container sx={{ mt: 3, mb: 3 }}>
    {/* Title */}
<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
  {!isEditing ? (
    <>
    <Button
      startIcon={<ArrowBackIcon />}
      onClick={() => handleSetDrawerPage("main")}
      sx={{
        borderRadius: 8,
        color: theme.palette.text.primary,
        textTransform: "none",
      }}
    >
  <Typography variant="h6" fontWeight="bold">
    Profile
  </Typography>
    </Button>
  <IconButton
    color="primary"
    onClick={() => setIsEditing(true)}
    sx={{
      borderRadius: 5,
      bgcolor: mode === "dark" ? '#f1f1f111' : '#e0e0e071',
      '&:hover': {
        bgcolor: 'primary.dark',
      },
      color: mode === "dark" ? 'white' : 'black',
    }}
  >
    <EditOutlinedIcon />
  </IconButton>
  </>
  ) : (
    <Typography variant="h5" fontWeight="bold">
      Edit Profile
    </Typography>
  )}
</Box>


    {loading ? (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 6 }}>
        <CircularProgress />
      </Box>
    ) : isEditing ? (
<>
  {/* Avatar and Upload Section */}
  <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", flexDirection: "column", mb: 5 }}>
    <Box
    sx={{
      position: "relative",
      mb: 2,
      "&:hover .hover-preview": {
        opacity: 1,
      }
    }}
    >
    <Avatar
      src={userData.photoURL || ""}
      alt={userData.name}
      sx={{ width: 180, height: 180, mb: 2, borderRadius: 12, boxShadow: 3 }}
    />
    <Button
      component="label"
      sx={{
        position: "absolute",
        bottom: 23,
        right: 8,
        width: 46,
        height: 46,
        borderRadius: "43px 10px",
        border: "none",
        backgroundColor: mode === "dark" ? "#000000a1" : "#ffffffff",
        backdropFilter: "blur(30px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: mode === "dark" ? "#ffffff86" : "#000000ff",
        transition: "opacity 0.3s ease",
        fontSize: 12,
      }}
    >
      <PhotoCamera />
      <input
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            setSelectedImage(URL.createObjectURL(file));
            setCropDrawerOpen(true);
          }
        }}
      />
    </Button>
    </Box>
  </Box>

  {/* Editable Form Fields */}
  <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
    <TextField
      label="Full Name"
      value={userData.name}
      onChange={e => setUserData({ ...userData, name: e.target.value })}
      fullWidth
      sx={{
        borderRadius: 4,
        boxShadow: "none",
        '& .MuiOutlinedInput-root': {
          borderRadius: 4,
        },
        input: {
          color: (theme) => (theme.palette.mode === 'dark' ? '#eee' : '#222'),
        },
        label: {
          color: (theme) => (theme.palette.mode === 'dark' ? '#bbb' : '#666'),
        },
      }}
    />
    <TextField
      label="Username"
      value={userData.username}
      onChange={e => setUserData({ ...userData, username: e.target.value })}
      fullWidth
      sx={{
        borderRadius: 4,
        boxShadow: "none",
        '& .MuiOutlinedInput-root': {
          borderRadius: 4,
        },
        input: {
          color: (theme) => (theme.palette.mode === 'dark' ? '#eee' : '#222'),
        },
        label: {
          color: (theme) => (theme.palette.mode === 'dark' ? '#bbb' : '#666'),
        },
      }}
    />
    <TextField
      label="Email"
      value={userData.email}
      disabled
      fullWidth
      sx={{
        borderRadius: 4,
        boxShadow: "none",
        '& .MuiOutlinedInput-root': {
          borderRadius: 4,
        },
        input: {
          color: (theme) => (theme.palette.mode === 'dark' ? '#eee' : '#222'),
        },
        label: {
          color: (theme) => (theme.palette.mode === 'dark' ? '#bbb' : '#666'),
        },
      }}
    />
    <TextField
      label="Mobile Number"
      value={userData.mobile}
      onChange={e => setUserData({ ...userData, mobile: e.target.value })}
      fullWidth
      sx={{
        borderRadius: 4,
        boxShadow: "none",
        '& .MuiOutlinedInput-root': {
          borderRadius: 4,
        },
        input: {
          color: (theme) => (theme.palette.mode === 'dark' ? '#eee' : '#222'),
        },
        label: {
          color: (theme) => (theme.palette.mode === 'dark' ? '#bbb' : '#666'),
        },
      }}
    />
    <TextField
      label="Bio"
      value={userData.bio}
      onChange={e => setUserData({ ...userData, bio: e.target.value })}
      multiline
      minRows={3}
      fullWidth
      sx={{
        borderRadius: 4,
        boxShadow: "none",
        '& .MuiOutlinedInput-root': {
          borderRadius: 4,
        },
        input: {
          color: (theme) => (theme.palette.mode === 'dark' ? '#eee' : '#222'),
        },
        label: {
          color: (theme) => (theme.palette.mode === 'dark' ? '#bbb' : '#666'),
        },
      }}
    />
  </Box>

  {/* Action Buttons */}
  <Box sx={{ mt: 5, display: "flex", justifyContent: "space-between" }}>
    <Button
      variant="outlined"
      onClick={() => {
        setIsEditing(false);
        setUserData(viewData);
      }}
      sx={{
        borderRadius: 8,
        px: 3,
        py: 1.5,
        textTransform: "none",
        borderColor: theme.palette.divider,
        '&:hover': { backgroundColor: theme.palette.action.hover },
      }}
    >
      Cancel
    </Button>
    <Button
      variant="contained"
      onClick={async () => {
        const changes = {};
        Object.keys(userData).forEach(key => {
          if (userData[key] !== viewData[key]) {
            changes[key] = userData[key];
          }
        });
        if (Object.keys(changes).length === 0) {
          setIsEditing(false);
          return;
        }
        try {
          const userRef = doc(firestore, "users", auth.currentUser.uid);
          await updateDoc(userRef, changes);
          setViewData({ ...viewData, ...changes });
          setIsEditing(false);
          alert("Profile updated!");
        } catch (err) {
          alert("Failed to update profile");
        }
      }}
      sx={{
        borderRadius: 8,
        px: 3,
        py: 1.5,
        textTransform: "none",
        boxShadow: 3,
        backgroundColor: theme.palette.primary.main,
        '&:hover': { backgroundColor: theme.palette.primary.dark },
      }}
    >
      Save Changes
    </Button>
  </Box>
</>

    ) : (
      <>
        {/* View Mode */}
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", mb: 3, position: "relative" }}>
          <Avatar src={viewData?.photoURL || ""} sx={{ width: 110, height: 110 }} />
          {userData.type && (
            <Box sx={{ position: "absolute", bottom: 60, right: "calc(50% - 10%)", zIndex: 10 }}>
              <Chip
                label={userData.type}
                size="small"
                variant="contained"
                sx={{
                  pointerEvents: "none",
                  userSelect: "none",
                  backgroundColor: mode === "dark" ? "#101010c9" : "#f1f1f1c9",
                  backdropFilter: "blur(80px)",
                }}
              />
            </Box>
          )}
          <Typography variant="h6" fontWeight="bold" sx={{ mt: 2 }}>
            {viewData?.name || ""}
          </Typography>
          <Typography sx={{ color: "text.secondary" }}>
            {viewData?.username ? "@" + viewData.username : ""}
          </Typography>
        </Box>

        {/* Beta Stats */}
        {(userData.type === "Beta" || userData.type === "Dev Beta") && (
          <Box sx={{ mb: 3, backgroundColor: "#f1f1f111", borderRadius: 5, px: 3, py: 2 }}>
            <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
              Your Beta Stats
            </Typography>
            <Typography variant="body2">Feedbacks: {feedbackCount}</Typography>
            <Typography variant="body2">Issues: {issuesCount}</Typography>
            <Typography variant="body2">Reports: {reportsCount}</Typography>
          </Box>
        )}

        {/* Profile Details */}
        <List sx={{ borderRadius: 3 }}>
          <ListItem>
            <ListItemText primary="User Type" secondary={userData.type || "N/A"} />
          </ListItem>
          <ListItem>
            <ListItemText primary="Email" secondary={viewData?.email} />
          </ListItem>
          <ListItem>
            <ListItemText primary="Mobile" secondary={viewData?.mobile} />
          </ListItem>
          <ListItem>
            <ListItemText primary="Bio" secondary={viewData?.bio} />
          </ListItem>
        </List>

    {/* Logout */}
    <Box>
      <ListItemButton
        onClick={() => setConfirmLogout(true)}
        sx={{
          backgroundColor: mode === "dark" ? "#ff19191c" : "#ff8e8e82",
          borderRadius: 5,
          py: 2.2,
          '&:hover': { bgcolor: '#ff000086', color: '#ff000046' },
        }}
      >
        <ListItemIcon>
          <LogoutIcon sx={{ color: mode === "dark" ? "#ffe6e6ff" : "#ff0000ff" }} />
        </ListItemIcon>
        <Typography sx={{ color: mode === "dark" ? "#ffe6e6ff" : "#ff0000ff" }}>Logout</Typography>
      </ListItemButton>
    </Box>

      </>
    )}

    {/* Crop Drawer */}
    <Drawer
      anchor="bottom"
      open={cropDrawerOpen}
      onClose={() => setCropDrawerOpen(false)}
        ModalProps={{
          BackdropProps: {
            sx: {
              p: 3,
              backgroundColor: mode === "dark" ? "#0000000d" : "#0000000d",
              backdropFilter: "blur(5px)",
            },
          },
        }}
        PaperProps={{
          sx: {
            p: 3,
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            maxHeight: "70vh",
            overflowY: "auto",
            backdropFilter: "blur(50px)",
            backgroundColor: mode === "dark" ? "#00000089" : "#fff",
            boxShadow: "none"
          },
        }}
    >
      {/* Crop Area */}
      <Box
        sx={{
          position: 'relative',
          height: { xs: '46vh', sm: '54vh', md: '58vh' },
          width: '100%',
          background: mode === 'dark'
            ? 'repeating-linear-gradient(45deg,#343943 0 6px, #232323 6px 12px)'
            : '#eee',
          borderRadius: 3,
          boxShadow: '0px 2px 16px #0001',
          overflow: 'hidden',
          mb: 3,
        }}
      >
        {selectedImage && (
          <Cropper
            image={selectedImage}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape="round"
            showGrid={false}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={(_, croppedAreaPixels) => setCroppedAreaPixels(croppedAreaPixels)}
          />
        )}
      </Box>

      {/* Zoom Slider */}
      <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
        <Typography variant="caption" sx={{ minWidth: 44, mr: 2, color: mode === 'dark' ? '#ddd' : '#222' }}>
          Zoom
        </Typography>
        <Slider
          value={zoom}
          min={1}
          max={3}
          step={0.07}
          size="medium"
  sx={{
    mx: "auto",
    color: mode === "dark" ? "#fff" : "#000",
    height: 20,
    '& .MuiSlider-thumb': {
      height: 32,
      width: 10,
      borderRadius: 4,
      backgroundColor: mode === "dark" ? "#000000ff" : "#ffffffff",
      border: "2px solid",
      borderColor: theme.palette.primary.main,
      transition: "0.3s ease",
      '&:hover': {
        boxShadow: `0 0 0 10px ${mode === "dark" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}`,
      },
    },
    '& .MuiSlider-track': {
      border: "none",
      backgroundColor: theme.palette.primary.main,
    },
    '& .MuiSlider-rail': {
      opacity: 0.2,
      backgroundColor: mode === "dark" ? "#555" : "#ccc",
    },
    '& .MuiSlider-valueLabel': {
      backgroundColor: mode === "dark" ? "#222" : "#eee",
      color: mode === "dark" ? "#fff" : "#000",
      borderRadius: 2,
      fontSize: 12,
    },
  }}
          onChange={(e, zoom) => setZoom(zoom)}
          aria-label="Zoom"
        />
      </Box>

      {/* Action Buttons */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 3 }}>
        <Button
          variant="outlined"
          onClick={() => setCropDrawerOpen(false)}
          sx={{
            borderRadius: 8,
            px: 3,
            py: 1,
            color: mode === 'dark' ? '#fff' : '#333',
            borderColor: mode === 'dark' ? '#fff3' : '#4442',
            '&:hover': { background: mode === 'dark' ? '#262626' : '#f7f7f7' },
          }}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          sx={{
            borderRadius: 8,
            px: 3,
            py: 1,
            fontWeight: 700,
            boxShadow: 'none',
            backgroundColor: theme.palette.primary.main,
            color: '#fff',
            '&:hover': { background: theme.palette.primary.dark },
          }}
          onClick={async () => {
            try {
              const croppedImage = await getCroppedImg(selectedImage, croppedAreaPixels);
              setCroppedImageDataUri(croppedImage);
              setUserData((prev) => ({ ...prev, photoURL: croppedImage }));
              setCropDrawerOpen(false);
              URL.revokeObjectURL(selectedImage);
              setSelectedImage(null);
            } catch (err) {
              console.error(err);
              alert('Failed to crop image');
            }
          }}
        >
          Continue
        </Button>
      </Box>
    </Drawer>
  </Container>
)}



{drawerPage === "feedback" && (
  <Container sx={{ mt: 2, mb: 4 }}>
    {/* Back Button */}
    <Button
      startIcon={<ArrowBackIcon />}
      onClick={() => handleSetDrawerPage("main")}
      sx={{
        mb: 3,
        borderRadius: 8,
        color: theme.palette.text.primary,
        backgroundColor: mode === "dark" ? "#f1f1f111" : "#e0e0e071",
        '&:hover': { backgroundColor: "#f1f1f121" },
      }}
    >
      Back
    </Button>

    {/* Header */}
    <Typography variant="h5" fontWeight="bold" sx={{ mb: 2 }}>
      Report & Feedback
    </Typography>

    <Typography variant="body1" sx={{ mb: 3, color: mode === "dark" ? "#aaa" : "#333" }}>
      We value your feedback! Please let us know if you have any suggestions, feature requests, or want to report a bug.
    </Typography>

    {/* Feedback Form */}
    <Box
      component="form"
      onSubmit={handleFeedbackSubmit}
      sx={{ display: "flex", flexDirection: "column", gap: 2 }}
    >
      <TextField
        label="Your Email (optional)"
        name="email"
        type="email"
        value={feedbackEmail}
        onChange={e => setFeedbackEmail(e.target.value)}
        fullWidth
        sx={{
          backgroundColor: mode === "dark" ? "#23232344" : "#f1f1f144",
          borderRadius: 4,
        }}
      />
      <TextField
        label="Your Feedback"
        name="message"
        required
        multiline
        minRows={4}
        value={feedback}
        onChange={e => setFeedback(e.target.value)}
        fullWidth
        sx={{
          backgroundColor: mode === "dark" ? "#23232344" : "#f1f1f144",
          borderRadius: 4,
        }}
      />
      <Button
        type="submit"
        variant="contained"
        disabled={feedbackLoading}
        sx={{
          mt: 2,
          borderRadius: 3,
          fontWeight: 600,
          backgroundColor: mode === "dark" ? "#ffffffff" : "#222",
          color: mode === "dark" ? "#000" : "#fff",
          boxShadow: "none",
          '&:hover': {
            backgroundColor: mode === "dark" ? "#ecececff" : "#111"
          }
        }}
      >
        {feedbackLoading ? "Sending..." : "Submit Feedback"}
      </Button>
      {feedbackSuccess && (
        <Typography color="success.main" sx={{ mt: 1 }}>
          Thank you for your feedback!
        </Typography>
      )}
    </Box>
    
    <Box sx={{ mt: 4 }}>
      <Typography variant="body2" sx={{ color: "#888" }}>
        For urgent issues, email us at <a href="mailto:jayendrachoudhary.am@gmail.com" style={{ color: "#888888ff" }}>jayendrachoudhary.am@gmail.com</a>
      </Typography>
    </Box>
  </Container>
)}

</Drawer>
</>
) : (
  <>
    <Box
sx={{
  display: "flex",
  alignItems: "center",
  cursor: "pointer",
  borderRadius: "12px",
  p: 1,
  color: theme.palette.text.primary,
  transition: "background-color 0.3s ease",
  mr: isSmallScreen ? 0 : 1,
  ...(isSmallScreen
    ? {}
    : {
        backgroundColor: "#101010",
        "&:hover": {
          backgroundColor: "#2c2c2c",
        },
      }),
}}
    onClick={handleDrawerOpen}
  >
    <Avatar src={userData.photoURL || ""} sx={{ width: 40, height: 40, mr: isSmallScreen ? 0 : 1 }} />
    {!isSmallScreen && (
      <>
        <Box sx={{ textAlign: "right", mr: 1 }}>
          <Typography variant="body1" sx={{ fontWeight: "bold", color: "text.primary" }}>
            {userData.name || "Username"}
          </Typography>
          <Typography variant="body2" sx={{ fontSize: "0.8rem", color: "text.secondary" }}>
            {userData.email || "Email"}
          </Typography>
        </Box>
        <ArrowDropDownIcon sx={{ color: "text.primary" }} />
      </>
    )}
  </Box>

  {/* Bottom Drawer */}
  <SwipeableDrawer
    anchor="bottom"
    open={drawerOpen}
    onClose={handleDrawerClose}
    PaperProps={{
      sx: {
        height: '90vh',
        mx: "auto",
        maxWidth: 450,
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        backgroundColor: theme.palette.background.main,
        backdropFilter: 'blur(80px)',
        backgroundImage: 'none',
        color: theme.palette.text.primary,
        px: 2,
        pb: 3,
      },
    }}
  >
    {/* Drawer drag indicator */}
    <Slide direction="down" in={true} timeout={200}>
      <Box
        sx={{ width: 40, height: 5, backgroundColor: "#666", borderRadius: 8,  my: 1, mx: "auto" }}
      />
    </Slide>

    {/* Main Settings Page */}
    {drawerPage === "main" && (
      <>
        {/* User info */}
        <Box sx={{ display: "flex", alignItems: "left", my: 2, mx: 2 }}>
          <Typography sx={{ fontSize: '1.5rem' }}><h2>Settings</h2></Typography>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, my: 2, mx: 2 }}>
          <Avatar src={userData.photoURL || ""} sx={{ width: 50, height: 50 }} />
          <Box>
            <Typography variant="subtitle1" fontWeight="bold">
              {userData.name || "Username"}
            </Typography>
            <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
              {userData.email || "Email"}
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ borderColor: "#333" }} />

        {/* Menu List */}
        <List sx={{ my: 0, gap: 0.5, display: "flex", flexDirection: "column" }}>
          <ListItem sx={{ pb: 0 }}>
            <ListItemButton onClick={() => setDrawerPage("profile")} 
                sx={{ 
                  backgroundColor: mode === "dark" ? "#f1f1f111" : "#c1c1c195", 
                  borderRadius: 5, 
                  py: 2,
                  '&:hover': { bgcolor: '#f1f1f121'}

                  }}>
              <ListItemIcon>
                <PersonOutlineIcon sx={{ color: theme.palette.text.primary }} />
              </ListItemIcon>
              <ListItemText primary="Profile" />
            </ListItemButton>
          </ListItem>

          <ListItem sx={{ pb: 0 }}>
            <ListItemButton
              onClick={() => setDrawerPage("generalSettings")}
              sx={{ backgroundColor: mode === "dark" ? "#f1f1f111" : "#c1c1c195",  borderRadius: 5,  py: 2, '&:hover': { bgcolor: '#f1f1f121'}}}
            >
              <ListItemIcon>
                <SettingsOutlinedIcon sx={{ color: theme.palette.text.primary }} />
              </ListItemIcon>
              <ListItemText primary="General Settings" />
            </ListItemButton>
          </ListItem>


          {/* New: App Version & About */}
          <ListItem sx={{ pb: 0 }}>
            <ListItemButton onClick={() => setDrawerPage("about")} sx={{ backgroundColor: mode === "dark" ? "#f1f1f111" : "#c1c1c195",  borderRadius: 5,  py: 2, '&:hover': { bgcolor: '#f1f1f121'}}}>
              <ListItemIcon>
                <InfoOutlinedIcon sx={{ color: theme.palette.text.primary }} />
              </ListItemIcon>
              <ListItemText primary="App Version & About" />
            </ListItemButton>
          </ListItem>

          {/* New: Support / Help */}
          <ListItem sx={{ pb: 0 }}>
            <ListItemButton onClick={() => setDrawerPage("support")} sx={{ backgroundColor: mode === "dark" ? "#f1f1f111" : "#c1c1c195",  borderRadius: 5,  py: 2, '&:hover': { bgcolor: '#f1f1f121'}}}>
              <ListItemIcon>
                <HelpOutlineIcon sx={{ color: theme.palette.text.primary }} />
              </ListItemIcon>
              <ListItemText primary="Support / Help" />
            </ListItemButton>
          </ListItem>

          <ListItem sx={{ pb: 0 }}>
            <ListItemButton onClick={() => setDrawerPage("feedback")} sx={{ backgroundColor: mode === "dark" ? "#f1f1f111" : "#c1c1c195",  borderRadius: 5,  py: 2, '&:hover': { bgcolor: '#f1f1f121'}}}>
              <ListItemIcon>
                <HelpOutlineIcon sx={{ color: theme.palette.text.primary }} />
              </ListItemIcon>
              <ListItemText primary="Report & Feedback" />
            </ListItemButton>
          </ListItem>

          <ListItem>
            <ListItemButton onClick={() => setConfirmLogout(true)} sx={{ backgroundColor: mode === "dark" ? "#ff191982" : "#ff8e8e82", borderRadius: 5,  py: 2.2, '&:hover': { bgcolor: '#ff000086', color: '#ff000046'}}}>
              <ListItemIcon>
                <LogoutIcon sx={{ color: mode === "dark" ? "#ffd4d4" : "#ff0000ff" }} />
              </ListItemIcon>
              <Typography sx={{ color: mode === "dark" ? "#ffd4d4" : "#ff0000ff" }}>Logout</Typography>
            </ListItemButton>
          </ListItem>
        </List>
      </>
    )}

    {/* Edit Profile Page */}
    {drawerPage === "profile" && (
      <Container sx={{ mt: 1, mb: 2, color: theme.palette.text.primary }}>

        {/* Your edit profile form here */}
        {/* ... */}
      </Container>
    )}

{drawerPage === "generalSettings" && (
  <Container sx={{ mt: 1, mb: 2 }}>
    <Button
      startIcon={<ArrowBackIcon />}
      onClick={() => setDrawerPage("main")}
      sx={{
        mb: 2,
        borderRadius: 8,
        color: theme.palette.text.primary,
        backgroundColor: mode === "dark" ? "#f1f1f111" : "#e0e0e071",
        '&:hover': { backgroundColor: "#f1f1f121" },
      }}
    >
      Back
    </Button>

        {/* Header */}
    <Typography variant="h5" fontWeight="bold" sx={{ mb: 3 }}>
      General Settings
    </Typography>

    {/* THEME MODE: "Dark" / "Light" pill toggle group */}
    <Box sx={{ mb: 3 }}>
      <Typography variant="subtitle1" sx={{ mb: 1 }}>Who can use dark mode?</Typography>
      {/* Really, it's just the theme mode selector */}
      <Box sx={{ display: 'flex', gap: 2 }}>
        <Button
          onClick={() => { setMode("dark"); }}
          variant={mode === "dark" ? "contained" : "outlined"}
          sx={{
            borderRadius: 999,
            px: 3, py: 0.5,
            fontWeight: 600,
            fontSize: "1rem",
            backgroundColor: mode === "dark" ? "#121212ff" : "transparent",
            color: mode === "dark" ? "#fff" : theme.palette.text.primary,
            borderColor: "#aaa",
            boxShadow: "none",
          }}
        >Dark</Button>
        <Button
          onClick={() => { setMode("light"); }}
          variant={mode === "light" ? "contained" : "outlined"}
          sx={{
            borderRadius: 999,
            px: 3, py: 0.5,
            fontWeight: 600,
            fontSize: "1rem",
            backgroundColor: mode === "light" ? "#fff" : "transparent",
            color: mode === "light" ? "#222" : theme.palette.text.primary,
            borderColor: "#aaa",
            boxShadow: "none",
            '&:hover': { backgroundColor: "#f7f7f7", color: "#222" },
          }}
        >Light</Button>
      </Box>
    </Box>

    {/* ACCENT COLOR: group of pill/toggle buttons, like image */}
    <Box sx={{ mb: 3 }}>
      <Typography variant="subtitle1" sx={{ mb: 1 }}>Accent Color</Typography>
      <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
        {[
          { opt: "default", label: "", bg: theme.palette.primary.bg , color: theme.palette.text.primary },
        ].map(({ opt, label, bg, color }) => (
          <Button
            key={opt}
            onClick={() => setAccent(opt)}
            variant={"contained"}
            fullWidth
            sx={{
              borderRadius: 4,
              px: 3, py: 1.2,
              fontWeight: 600,
              fontSize: "1rem",
              height: 50,
              backgroundColor: bg,
              boxShadow: "none",
              mb: 3,
              color: accent === opt ? color : theme.palette.primary.main,
              '&:hover': {
                backgroundColor: bg,
                color: color
              }
            }}
          >This is the Accent Preview</Button>
        ))}
      </Box>

<Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", width: 240, mx: "auto", }}>
  {[
    { opt: "blue", label: "Blue", bg: "#bbdefb", color: "#fff" },
    { opt: "green", label: "Green", bg: "#c8e6c9", color: "#fff" },
    { opt: "red", label: "Red", bg: "#EF5350", color: "#fff" },
    { opt: "orange", label: "Orange", bg: "#FFCC80", color: "#fff" },
    { opt: "yellow", label: "Yellow", bg: "#FFEB3B", color: "#000" },
    { opt: "turquoise", label: "Turquoise", bg: "#b6f6ffff", color: "#fff" },
    { opt: "lime", label: "Lime", bg: "#DCE775", color: "#000" },
    { opt: "purple", label: "Purple", bg: "#f4b8ffff", color: "#fff" },
    { opt: "skyblue", label: "Sky Blue", bg: "#81D4FA", color: "#fff" },
    { opt: "mint", label: "Mint", bg: "#A5D6A7", color: "#fff" },
  ].map(({ opt, label, bg, color }) => (
    <Button
      key={opt}
      onClick={() => setAccent(opt)}
      variant={"contained"}
      sx={{
        borderRadius: 999,
        fontWeight: 600,
        fontSize: "0.875rem",
        minWidth: 35,
        minHeight: 35,
        backgroundColor: bg,
        color: accent === opt ? color : theme.palette.text.primary,
        border: accent === opt ? "2px solid" : "2px solid",
        borderColor: accent === opt ? theme.palette.text.primary : "#aaa",
        textTransform: "none",
        boxShadow: "none",
        '&:hover': {
          backgroundColor: bg,
          color: color
        }
      }}
    />
  ))}
</Box>

    </Box>

    {/* LOCATION: Allow pill-style toggle for auto/manual */}
    <Box sx={{ mb: 3 }}>
      <Typography variant="subtitle1" sx={{ mb: 1 }}>Location</Typography>
      <Box sx={{ display: "flex", gap: 2 }}>
        <Button
          variant={settings.locationMode === "auto" ? "contained" : "outlined"}
          onClick={() => handleLocationModeChange({ target: { checked: true } })}
          sx={{
            borderRadius: 999,
            px: 3, py: 1.2,
            fontWeight: 600,
            backgroundColor: settings.locationMode === "auto" ? theme.palette.primary.main : "transparent",
            color: settings.locationMode === "auto" ? "#fff" : "#333",
            minWidth: 96,
            boxShadow: "none",
          }}
        >Auto</Button>
        <Button
          variant={settings.locationMode === "manual" ? "contained" : "outlined"}
          onClick={() => handleLocationModeChange({ target: { checked: false } })}
          sx={{
            borderRadius: 999,
            px: 3, py: 1.2,
            fontWeight: 600,
            backgroundColor: settings.locationMode !== "auto" ? theme.palette.primary.main : "transparent",
            color: settings.locationMode !== "auto" ? "#fff" : "#333",
            borderColor: settings.locationMode !== "auto" ? theme.palette.primary.main : "#aaa",
            minWidth: 96,
            boxShadow: "none",
          }}
        >Manual</Button>
      </Box>
      {settings.locationMode !== "auto" && (
        <TextField
          label="Set Location Manually"
          value={settings.manualLocation}
          onChange={handleManualLocationChange}
          fullWidth
          sx={{ mt: 2 }}
        />
      )}
    </Box>
  </Container>
)}


{drawerPage === "about" && (
  <Container sx={{ mt: 2, mb: 4 }}>
    {/* Back Button */}
    <Button
      startIcon={<ArrowBackIcon />}
      onClick={() => setDrawerPage("main")}
      sx={{
        mb: 2,
        borderRadius: 8, 
        color: theme.palette.text.primary,
        backgroundColor: mode === "dark" ? "#f1f1f111" : "#e0e0e071", 
        '&:hover': { backgroundColor: "#f1f1f121" },
      }}
    >
      Back
    </Button>

    {/* Header */}
    <Typography variant="h5" fontWeight="bold" sx={{ mb: 1 }}>
      App Version & About
    </Typography>

    {/* Version Card */}
    <Box
      sx={{
        backgroundColor: mode === "dark" ? "#1e1e1e71" : "#cccccc81",
        p: 2,
        borderRadius: 5, 
        mb: 3,
        mt: 3,
        boxShadow: "none",
      }}
      onClick={() => setDrawerPage("featuresChangelog")}
    >
      <Typography variant="subtitle1" fontWeight="bold">
        Version
      </Typography>
      <Typography variant="body2" sx={{ color: mode === "dark" ? "#ccc" : "#555" }}>
        {packageJson.version || "N/A"}
      </Typography>
    </Box>

    {/* About Text */}
    <Typography variant="body1" sx={{ mb: 3, color: mode === "dark" ? "#aaa" : "#333" }}>
      This app is designed to simplify your group trip planning experience — chat, split expenses, manage tasks, and discover places together. 
      Built with ❤️ in India.
    </Typography>

    {/* Credits / Licenses */}
    <Box sx={{ mb: 4 }}>
      <Typography variant="h6" gutterBottom>Licenses & Credits</Typography>
        <Typography variant="body2" sx={{ color: mode === "dark" ? "#aaa" : "#333", lineHeight: 1.8 }}>
          • React.js — MIT License<br />
          • Firebase (Auth, Firestore, Messaging) — Apache License 2.0<br />
          • Material UI (v5) — MIT License<br />
          • OpenWeatherMap API — CC BY-SA 4.0 (Attribution Required)<br />
          • Google Fonts — SIL Open Font License 1.1<br />
          • Material Icons — Apache License 2.0<br />
          • Additional Libraries — MIT/Apache Licensed Open Source
        </Typography>
    </Box>

    {/* Policy Links */}
    <Box sx={{ mb: 4 }}>
      <Typography variant="h6" sx={{ mb: 1 }}>Legal & Policy</Typography>

      <Button
        fullWidth
        variant="outlined"
        sx={{ mb: 2, backgroundColor: mode === "dark" ? "#f1f1f111" : "#e0e0e071",  color: theme.palette.text.primary, border: "1px solid #ccc", borderRadius: 3 }}
        onClick={() => window.open('/privacy-policy', '_blank')}
      >
        Privacy Policy
      </Button>

      <Button
        fullWidth
        variant="outlined"
        sx={{ mb: 2, backgroundColor: mode === "dark" ? "#f1f1f111" : "#e0e0e071",  color: theme.palette.text.primary, border: "1px solid #ccc", borderRadius: 3 }}
        onClick={() => window.open('/terms', '_blank')}
      >
        Terms of Service
      </Button>
    </Box>

    {/* Contact / Social */}
    <Box sx={{ mb: 3 }}>
      <Typography variant="h6" sx={{ mb: 1 }}>Connect With Us</Typography>

      <Stack direction="row" spacing={2}>
        <Button
          variant="contained"
          sx={{ backgroundColor: mode === "dark" ? "#f1f1f111" : "#e0e0e071",  color: theme.palette.text.primary, minWidth: 48, boxShadow: "none" }}
          onClick={() => window.open('mailto:jayendrachoudhary.am@gmail.com')}
        >
          <MailOutlinedIcon />
        </Button>
        {/* Add social buttons here if needed */}
      </Stack>
    </Box>

    {/* Open Source Link */}
    <Box sx={{ mt: 4, backgroundColor: mode === "dark" ? "#f1f1f111" : "#e0e0e071",  px: 3, py: 3, borderRadius: 6 }}>
      <Typography variant="h6" gutterBottom>Open Source</Typography>
      <Typography variant="body2" sx={{ color: mode === "dark" ? "#aaa" : "#333", mb: 2 }}>
        Our source code is available on GitHub. Feel free to contribute, report issues, or fork it.
      </Typography>
      <Button
        variant="outlined"
        fullWidth
        sx={{ color: "#000", borderColor: "#555", borderRadius: 3 }}
      >
        Providing Soon...
      </Button>
      {/* <Button
        variant="outlined"
        fullWidth
        onClick={() => window.open('https://github.com/yourapp', '_blank')}
        sx={{ color: "#000", borderColor: "#555" }}
      >
        View on GitHub
      </Button> */}
    </Box>
  </Container>
)}


      {drawerPage === "featuresChangelog" && (
        <Container sx={{ mt: 1, mb: 2 }}>
    <Button
      startIcon={<ArrowBackIcon />}
      onClick={() => setDrawerPage("about")}
      sx={{
        mb: 2,
        borderRadius: 8, 
        color: theme.palette.text.primary,
        backgroundColor: mode === "dark" ? "#f1f1f111" : "#e0e0e071", 
        '&:hover': { backgroundColor: "#f1f1f121" },
      }}
    >
      Back
    </Button>
          <Typography variant="h5" gutterBottom><h2>Features & Changelog</h2></Typography>

          {/* Features Section */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom>Features</Typography>
            {features.map(({ name, detail }, idx) => (
              <Box key={idx} sx={{ mb: 2, ml: 2 }}>
                <Typography variant="subtitle1" component="div" fontWeight="bold">{name}</Typography>
                <Typography variant="body2" sx={{ color: mode === "dark" ? "#aaa" : "#333" }}>{detail}</Typography>
              </Box>
            ))}
          </Box>

          {/* Changelog Section */}
          <Box>
            <Typography variant="h6" gutterBottom>Changelog</Typography>
{changelogs.map(({ version, date, changes }) => (
  <Card sx={{ my: 2, p: 2, boxShadow: "none", backgroundColor: mode === "dark" ? "#f1f1f111" : "#e0e0e071", borderRadius: 5 }} key={version}>
    <Typography variant="subtitle1" fontWeight="bold">
      Version {version} – <span style={{ color: mode === "dark" ? "#aaa" : "#333" }}>{date}</span>
    </Typography>
    <ul style={{ paddingLeft: 20 }}>
      {changes.map((c, i) => <li key={i}><Typography variant="body2">{c}</Typography></li>)}
    </ul>
  </Card>
))}

          </Box>
        </Container>
      )}

{drawerPage === "support" && (
  <Container sx={{ mt: 1, mb: 2 }}>
    <Button
      startIcon={<ArrowBackIcon />}
      onClick={() => setDrawerPage("main")}
      sx={{
        mb: 1,
        borderRadius: 8, 
        color: theme.palette.text.primary,
        backgroundColor: mode === "dark" ? "#f1f1f111" : "#e0e0e071", 
        '&:hover': { backgroundColor: "#f1f1f121" },
      }}
    >
      Back
    </Button>
    <Typography variant="h5" gutterBottom><h2>Support & Help</h2></Typography>

    <Typography variant="body1" sx={{ mb: 3 }}>
      We're here to help you! If you encounter any issues, have questions, or need assistance, please explore the following resources or get in touch with us directly.
    </Typography>

    <Stack spacing={2} sx={{ mb: 4 }}>
    {/* <Card sx={{ px: 2, py: 1, backgroundColor: mode === "dark" ? "#f1f1f111" : "#e0e0e071",  boxShadow: "none" }}>
      <ListItemText
        primary="Support & Help"
        secondary="Support for any issues or questions"
      />
    </Card> */}
    <Card
      onClick={() => window.open("/terms-and-conditions", "_blank")}
      sx={{ px: 2, py: 1, backgroundColor: mode === "dark" ? "#f1f1f111" : "#e0e0e071",  boxShadow: "none", borderRadius: 5 }}
    >
      <ListItemText
        primary="Terms & Conditions"
        secondary="Terms of service and usage policies"
      />
    </Card>
    {/* <Card
      onClick={() => window.open("/faq", "_blank")}
      sx={{ px: 2, py: 1, backgroundColor: mode === "dark" ? "#f1f1f111" : "#e0e0e071",  boxShadow: "none" }}
    >
      <ListItemText
        primary="Frequently Asked Questions"
        secondary="Find answers to common questions"
      />
    </Card> */}
    <Card
      onClick={() => window.open("mailto:jayendrachoudhary.am@gmail.com")} 
      sx={{ px: 2, py: 1, backgroundColor: mode === "dark" ? "#f1f1f111" : "#e0e0e071",  boxShadow: "none", borderRadius: 5  }}
    >
      <ListItemText
        primary="Contact Support"
        secondary="Email us at jayendrachoudhary.am@gmail.com"
      />
    </Card>
</Stack>

    <Button
      variant="contained"
      color="success"
      fullWidth
      onClick={() => {
        // Navigate to community page (adjust if using react-router or other navigation)
        window.open("/community", "_blank");
      }}
      sx={{ fontWeight: "bold", textTransform: "none", mb: 3, borderRadius: 3, backgroundColor: mode === "dark" ? '#f1f1f131' : "#0c0c0c10", color: theme.palette.text.primary, border: 'transparent', boxShadow: 'none' }}
    >
      Visit Our Community
    </Button>
  </Container>
)}


{drawerPage === "profile" && (
  <Container sx={{ mt: 2, mb: 2 }}>
    <Button
      startIcon={<ArrowBackIcon />}
      onClick={() => setDrawerPage("main")}
      sx={{ mb: 3, borderRadius: 8, color: theme.palette.text.primary }}
    >Back</Button>

    <Typography variant="h5" fontWeight="bold" sx={{ mb: 3 }}>
      Profile
    </Typography>

    {loading ? (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 6 }}>
        <CircularProgress />
      </Box>
    ) : isEditing ? (
      <>
        <Box sx={{ display: "flex", justifyContent: "center", mb: 3 }}>
          <Avatar src={userData.photoURL || ""} alt={userData.name} sx={{ width: 120, height: 120 }} />
          <Button
  variant="outlined"
  component="label"
  sx={{ mt: 2 }}
>
  Upload Profile Picture
  <input
    type="file"
    accept="image/*"
    hidden
    onChange={(e) => {
      if (e.target.files && e.target.files.length > 0) {
        const file = e.target.files[0];
        setSelectedImage(URL.createObjectURL(file));
        setCropDrawerOpen(true);
      }
    }}
  />
</Button>

        </Box>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <TextField fullWidth label="Full Name" value={userData.name} onChange={e => setUserData({ ...userData, name: e.target.value })} />
          <TextField fullWidth label="Username" value={userData.username} onChange={e => setUserData({ ...userData, username: e.target.value })} />
          <TextField fullWidth label="Email" value={userData.email} disabled />
          <TextField fullWidth label="Mobile Number" value={userData.mobile} onChange={e => setUserData({ ...userData, mobile: e.target.value })} />
          <TextField fullWidth label="Bio" value={userData.bio} onChange={e => setUserData({ ...userData, bio: e.target.value })} multiline minRows={3} />
        </Box>
        <Box sx={{ mt: 4, display: "flex", justifyContent: "space-between" }}>
          <Button variant="outlined" onClick={() => { setIsEditing(false); setUserData(viewData); }}>Cancel</Button>
          <Button variant="contained" onClick={async () => {
            // Build changed fields only
            const changes = {};
            Object.keys(userData).forEach(key => {
              if (userData[key] !== viewData[key]) {
                changes[key] = userData[key];
              }
            });
            if (Object.keys(changes).length === 0) {
              setIsEditing(false);
              return; // nothing changed
            }
            try {
              const userRef = doc(firestore, "users", auth.currentUser.uid);
              await updateDoc(userRef, changes);
              setViewData({ ...viewData, ...changes });   // update local viewData
              setIsEditing(false);
              alert("Profile updated!");
            } catch (err) {
              alert("Failed to update profile");
            }
          }}>Save Changes</Button>
        </Box>
      </>
    ) : (
<>
  <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", mb: 3, position: "relative" }}>
    <Avatar src={viewData?.photoURL || ""} sx={{ width: 110, height: 110 }} />
    {/* User Type Chip at top right of Avatar */}
    {userData.type && (
      <Box
        sx={{
          position: "absolute",
          bottom: 60,
          right: "calc(50% - 10%)", // 50% minus half avatar width to align to top right of avatar
          zIndex: 10,
        }}
      >
        <Chip
          label={userData.type}
          size="small"
          variant="contained"
          sx={{ pointerEvents: "none", userSelect: "none", backgroundColor: mode === "dark" ? "#101010c9" : "#f1f1f1c9", backdropFilter: "blur(80px)" }}
        />
      </Box>
    )}
    <Typography fontWeight="bold" variant="h6" sx={{ mt: 2 }}>
      {viewData?.name || ""}
    </Typography>
    <Typography sx={{ color: "text.secondary" }}>
      {viewData?.username ? "@" + viewData.username : ""}
    </Typography>
  </Box>

  {(userData.type === "Beta" || userData.type === "Dev Beta") && (
    <Box sx={{ mb: 3, background: "#f1f1f111", borderRadius: 5, px: 3, py: 2 }}>
      <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
        Your Beta Stats
      </Typography>
      <Typography variant="body2">Feedbacks: {feedbackCount}</Typography>
      <Typography variant="body2">Issues: {issuesCount}</Typography>
      <Typography variant="body2">Reports: {reportsCount}</Typography>
    </Box>
  )}

  <List>
    <ListItem>
      <ListItemText primary="User Type" secondary={userData.type || "N/A"} />
    </ListItem>
    <ListItem>
      <ListItemText primary="Email" secondary={viewData?.email} />
    </ListItem>
    <ListItem>
      <ListItemText primary="Mobile" secondary={viewData?.mobile} />
    </ListItem>
    <ListItem>
      <ListItemText primary="Bio" secondary={viewData?.bio} />
    </ListItem>
  </List>
  <Button variant="contained" sx={{ mt: 2 }} onClick={() => setIsEditing(true)}>
    Edit Profile
  </Button>
</>
    )}


<Drawer
  anchor="bottom"
  open={cropDrawerOpen}
  onClose={() => setCropDrawerOpen(false)}
  PaperProps={{
    sx: {
      height: { xs: '90vh', sm: '80vh' },
      maxWidth: 420,
      mx: 'auto',
      px: { xs: 1.5, sm: 2.5 },
      pt: 2.5,
      pb: 4,
      borderTopLeftRadius: 16,
      borderTopRightRadius: 16,
      background:
        mode === 'dark'
          ? 'linear-gradient(180deg, #212121 80%, #232323 100%)'
          : 'linear-gradient(180deg, #f4f6f8 80%, #fff 100%)',
      boxShadow: '0 -8px 24px #00000044',
    },
  }}
>
  {/* Crop workspace */}
  <Box
    sx={{
      position: 'relative',
      height: { xs: '46vh', sm: '54vh', md: '58vh' },
      width: '100%',
      background:
        mode === 'dark'
          ? 'repeating-linear-gradient(45deg,#343943 0 6px, #232323 6px 12px)'
          : '#eee',
      borderRadius: 3,
      boxShadow: '0px 2px 16px #0001',
      overflow: 'hidden',
      mb: 2.5,
    }}
  >
    {selectedImage && (
      <Cropper
        image={selectedImage}
        crop={crop}
        zoom={zoom}
        aspect={1}
        cropShape="round"
        showGrid={false}
        onCropChange={setCrop}
        onZoomChange={setZoom}
        onCropComplete={(_, croppedAreaPixels) => setCroppedAreaPixels(croppedAreaPixels)}
      />
    )}
  </Box>

  {/* Slider with label */}
  <Box sx={{ display: 'flex', alignItems: 'center', mt: 1.5 }}>
    <Typography
      variant="caption"
      sx={{ minWidth: 44, mr: 2, color: mode === 'dark' ? '#ddd' : '#222' }}
    >
      Zoom
    </Typography>
    <Slider
      value={zoom}
      min={1}
      max={3}
      step={0.07}
      size="medium"
      sx={{
        width: '100%',
        color: '#3366ff',
        '& .MuiSlider-thumb': { width: 18, height: 18 },
      }}
      onChange={(e, zoom) => setZoom(zoom)}
      aria-label="Zoom"
    />
  </Box>

  {/* Action buttons */}
  <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 3 }}>
    <Button
      variant="outlined"
      onClick={() => setCropDrawerOpen(false)}
      sx={{
        borderRadius: 3,
        px: 3,
        py: 1,
        color: mode === 'dark' ? '#fff' : '#333',
        borderColor: mode === 'dark' ? '#fff3' : '#4442',
        '&:hover': { background: mode === 'dark' ? '#262626' : '#f7f7f7' },
      }}
    >
      Cancel
    </Button>
    <Button
      variant="contained"
      sx={{
        borderRadius: 3,
        px: 3,
        py: 1,
        fontWeight: 700,
        boxShadow: 'none',
        backgroundColor: '#3366ff',
        color: '#fff',
        '&:hover': { background: '#2750bf' },
      }}
      onClick={async () => {
        try {
          const croppedImage = await getCroppedImg(selectedImage, croppedAreaPixels);
          setCroppedImageDataUri(croppedImage);
          setUserData((prev) => ({ ...prev, photoURL: croppedImage })); // update preview
          setCropDrawerOpen(false);
          URL.revokeObjectURL(selectedImage);
          setSelectedImage(null);
        } catch (err) {
          console.error(err);
          alert('Failed to crop image');
        }
      }}
    >
      Continue
    </Button>
  </Box>

  {/* Cropped Data URI preview (readonly) */}
  {croppedImageDataUri && (
    <TextField
      label="Cropped Image Data URI"
      multiline
      minRows={2}
      value={croppedImageDataUri}
      fullWidth
      sx={{
        display: "none",
        mt: 2.6,
        bgcolor: mode === 'dark' ? '#23232366' : '#f1f1f1cc',
        borderRadius: 2,
        fontSize: '0.95rem',
        fontFamily: 'monospace',
      }}
      inputProps={{
        readOnly: true,
        style: { fontSize: '0.95rem', fontFamily: 'monospace', overflowWrap: 'break-word' },
      }}
    />
  )}
</Drawer>


  </Container>
)}


{drawerPage === "feedback" && (
  <Container sx={{ mt: 2, mb: 4 }}>
    {/* Back Button */}
    <Button
      startIcon={<ArrowBackIcon />}
      onClick={() => setDrawerPage("main")}
      sx={{
        mb: 3,
        borderRadius: 8,
        color: theme.palette.text.primary,
        backgroundColor: mode === "dark" ? "#f1f1f111" : "#e0e0e071",
        '&:hover': { backgroundColor: "#f1f1f121" },
      }}
    >
      Back
    </Button>

    {/* Header */}
    <Typography variant="h5" fontWeight="bold" sx={{ mb: 2 }}>
      Report & Feedback
    </Typography>

    <Typography variant="body1" sx={{ mb: 3, color: mode === "dark" ? "#aaa" : "#333" }}>
      We value your feedback! Please let us know if you have any suggestions, feature requests, or want to report a bug.
    </Typography>

    {/* Feedback Form */}
    <Box
      component="form"
      onSubmit={handleFeedbackSubmit}
      sx={{ display: "flex", flexDirection: "column", gap: 2 }}
    >
      <TextField
        label="Your Email (optional)"
        name="email"
        type="email"
        value={feedbackEmail}
        onChange={e => setFeedbackEmail(e.target.value)}
        fullWidth
        sx={{
          backgroundColor: mode === "dark" ? "#23232344" : "#f1f1f144",
          borderRadius: 4,
        }}
      />
      <TextField
        label="Your Feedback"
        name="message"
        required
        multiline
        minRows={4}
        value={feedback}
        onChange={e => setFeedback(e.target.value)}
        fullWidth
        sx={{
          backgroundColor: mode === "dark" ? "#23232344" : "#f1f1f144",
          borderRadius: 4,
        }}
      />
      <Button
        type="submit"
        variant="contained"
        disabled={feedbackLoading}
        sx={{
          mt: 2,
          borderRadius: 3,
          fontWeight: 600,
          backgroundColor: mode === "dark" ? "#ffffffff" : "#222",
          color: mode === "dark" ? "#000" : "#fff",
          boxShadow: "none",
          '&:hover': {
            backgroundColor: mode === "dark" ? "#ecececff" : "#111"
          }
        }}
      >
        {feedbackLoading ? "Sending..." : "Submit Feedback"}
      </Button>
      {feedbackSuccess && (
        <Typography color="success.main" sx={{ mt: 1 }}>
          Thank you for your feedback!
        </Typography>
      )}
    </Box>
    
    <Box sx={{ mt: 4 }}>
      <Typography variant="body2" sx={{ color: "#888" }}>
        For urgent issues, email us at <a href="mailto:jayendrachoudhary.am@gmail.com" style={{ color: "#888888ff" }}>jayendrachoudhary.am@gmail.com</a>
      </Typography>
    </Box>
  </Container>
)}

  </SwipeableDrawer>
</>
)}
{/* Logout Confirm Dialog */}
<Dialog
  open={confirmLogout}
  onClose={() => setConfirmLogout(false)}
  PaperProps={{
    sx: {
      backgroundColor: mode === "dark" ? "#00000000" : "#ffffff91",
      backdropFilter: 'blur(10px)',
      boxShadow: 'none',
      borderRadius: 6,
    }
  }}
>
  <DialogTitle sx={{ px: 3, py: 3, color: mode === "dark" ? "#fff" : "#000" }}>
    Are you sure you want to logout?
  </DialogTitle>
  
  <DialogActions sx={{ px: 3, py: 3 }}>
    <Button
      variant="outlined"
      sx={{
        backgroundColor: mode === "dark" ? "#f1f1f111" : "#e0e0e071",
        color: mode === "dark" ? "#fff" : "#000",
        p: 1.5,
        borderColor: '#ffffff33',
        borderRadius: 5,
      }}
      onClick={() => setConfirmLogout(false)}
    >
      Cancel
    </Button>
    
    <Button
      variant="contained"
      sx={{
        backgroundColor:  mode === "dark" ? "#700000ff" : "#ffd4d4",
        color:  mode === "dark" ? "#ffd4d4" : "#ff0000ff",
        p: 1.5,
        borderRadius: 5,
        boxShadow: 'none',
        '&:hover': {
          backgroundColor: '#ff000088',
        }
      }}
      onClick={() => {
        handleLogout();
        setConfirmLogout(false);
      }}
    >
      Logout
    </Button>
  </DialogActions>
</Dialog>
</>
</ThemeProvider>
    );
};

export default ProfilePic;
