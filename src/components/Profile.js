import React, { createContext, useContext, useState, useEffect, useRef, useMemo } from "react";
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
  FormControl,
  Select,
  MenuItem,
  DialogContent,
  DialogContentText,
  Grid,
  Menu,
  ListItemAvatar,
  Fade,
  Tab,
  Tabs,
  Snackbar,
  Badge,
  Collapse
} from "@mui/material";
import {
  ArrowDropDown, ArrowBack, Logout, PersonOutline, InfoOutlined,
  CheckCircle, ChatBubbleOutline, Search, Share,
  Close, ArrowForwardIos, PhotoCamera, WbSunnyOutlined, LockOutlined,
  ContentCopyOutlined, DownloadOutlined, EngineeringOutlined, Mail,
  Settings, HelpOutline as HelpOutlineIcon,
  FeedbackOutlined, PersonAddOutlined,
  PaletteOutlined as PaletteOutlinedIcon, WallpaperOutlined as WallpaperOutlinedIcon,
  FormatSizeOutlined as FormatSizeOutlinedIcon, DeleteSweepOutlined as DeleteSweepOutlinedIcon,
  DeleteForeverOutlined as DeleteForeverOutlinedIcon, PersonAddOutlined as GroupAddOutlinedIcon,
  Luggage as CardTravelOutlinedIcon, BlockOutlined as BlockOutlinedIcon,
  Public as PublicIcon, PeopleOutline as PeopleOutlineIcon, PersonOffOutlined as PersonOffOutlinedIcon,
  Check as CheckIcon, Chat as ChatIcon, LocationOnOutlined as MyLocationOutlinedIcon,
  WhatsApp as WhatsAppIcon, Email as EmailIcon, Telegram as TelegramIcon, Share as ShareIcon,
  LockOutlined as LockOutlinedIcon,
  Block as BlockIcon,
  LocationOnOutlined as LocationOnOutlinedIcon,
  LocationOnOutlined as EditLocationOutlined,
  WbSunnyOutlined as Brightness4Icon,
  WbSunnyOutlined as DarkModeOutlinedIcon,
  DeleteForever as DeleteForeverIcon,
  EngineeringOutlined as EngineeringOutlinedIcon,
  LayersOutlined, Instagram, YouTube,
  AutoAwesome, VpnKey, Visibility, VisibilityOff, ElectricBolt, ErrorOutline,
  QrCode, Edit3, Luggage,
} from "../icons";
import {
  designTokens,
  glass,
  cardHover,
  drawerPaperSx,
  drawerBackdropSx,
  drawerHandleSx,
  DrawerHandle,
  ctaButtonSx,
  glassIconBtnSx,
  glassInputSx,
  searchFieldSx,
  glassItemSx,
  toggleGroupSx,
  filterChipSx,
  glassPillSx,
  glassCard,
  flexBetweenSx,
  flexRowSx,
  flexCenterSx,
} from "../theme/designSystem";
import { signOut, updateProfile, getAuth, deleteUser, GoogleAuthProvider, reauthenticateWithPopup } from "firebase/auth";
import { doc, updateDoc, arrayUnion, getDoc, setDoc, collection, addDoc, serverTimestamp, query, where, onSnapshot, getDocs, arrayRemove, deleteDoc } from "firebase/firestore";
import { useTheme, useMediaQuery, Fab, Zoom } from "@mui/material";
import { weatherColors } from "../elements/weatherTheme";
import { useWeather } from "../contexts/WeatherContext";
import { useSettings } from "../contexts/SettingsContext";
import { useThemeToggle } from "../contexts/ThemeToggleContext";
import { getTheme } from "../theme";
import getCroppedImg from '../utils/cropImage';
import Cropper from "react-easy-crop";
import { availableLanguages } from '../utils/languages';
import { QRCodeSVG } from "qrcode.react";
import { Scanner } from '@yudiel/react-qr-scanner';
import QrScanner from "./QrScanner";
import { useSwipeable } from 'react-swipeable';
import { toPng } from "html-to-image";
import { color } from "framer-motion";
import { alpha } from '@mui/material/styles';
import BackgroundToggle from "../elements/BackgroundToggle";
import { AccountCircleOutlined } from "@mui/icons-material";

const SESSION_KEY = "bunkmate_session";
const WEATHER_STORAGE_KEY = "bunkmate_weather";

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

const buttonStyle = (mode, theme) => ({
  borderRadius: 2,
  textTransform: "none",
  bgcolor: mode === "dark" ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)",
  color: theme.palette.text.primary,
  '&:hover': {
    bgcolor: mode === "dark" ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.1)",
  },
  px: 7,
});

const wallpapers = [
  { id: 'none', name: 'Default', url: 'none', theme: 'both' },
  { id: 'dark1', name: '', url: '/assets/images/chatbg/1.jpeg', theme: 'both' },
  { id: 'dark2', name: '', url: '/assets/images/chatbg/2.jpeg', theme: 'both' },
  { id: 'both1', name: '', url: '/assets/images/chatbg/3.jpeg', theme: 'both' },
  { id: 'dark3', name: '', url: '/assets/images/chatbg/4.jpeg', theme: 'both' },
  { id: 'dark4', name: '', url: '/assets/images/chatbg/5.jpeg', theme: 'both' },
  { id: 'dark5', name: '', url: '/assets/images/chatbg/6.jpeg', theme: 'both' },
  { id: 'dark6', name: '', url: '/assets/images/chatbg/7.jpeg', theme: 'both' },
  { id: 'dark7', name: '', url: '/assets/images/chatbg/8.jpeg', theme: 'both' },
  { id: 'dark8', name: '', url: '/assets/images/chatbg/9.jpeg', theme: 'both' },
  { id: 'dark9', name: '', url: '/assets/images/chatbg/10.jpeg', theme: 'both' },
  { id: 'dark10', name: '', url: '/assets/images/chatbg/11.jpeg', theme: 'both' },
  { id: 'light1', name: '', url: '/assets/images/chatbg/12.jpeg', theme: 'both' },
  { id: 'light2', name: '', url: '/assets/images/chatbg/13.jpeg', theme: 'both' },
];

const downloadLink = "https://bunkmateshome.vercel.app/bm-install";

const ProfilePic = ({currentUser}) => {
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
  const [selectedImage, setSelectedImage] = useState(null); 
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [croppedImageDataUri, setCroppedImageDataUri] = useState(""); 
  const [selectedImageFile, setSelectedImageFile] = useState(null);

  const [tapCount, setTapCount] = React.useState(0);
  const [showDevDialog, setShowDevDialog] = React.useState(false);
  const [enteredKey, setEnteredKey] = React.useState("");
  const [showDevKey, setShowDevKey] = React.useState(false);
  const [isDeveloper, setIsDeveloper] = React.useState(
    localStorage.getItem("isDeveloper") === "true"
  );
  const tapTimer = React.useRef(null);

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

  const [chatTheme, setChatTheme] = useState(localStorage.getItem('bunkmate_chatTheme') || 'system');
  const [fontSize, setFontSize] = useState(parseInt(localStorage.getItem('bunkmate_fontSize'), 10) || 14);
  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [wallpaperDrawerOpen, setWallpaperDrawerOpen] = useState(false);
  const [fontDrawerOpen, setFontDrawerOpen] = useState(false);

  const [isQrDrawerOpen, setQrDrawerOpen] = useState(false);
  const handleQrDrawerOpen = () => setQrDrawerOpen(true);
  const handleQrDrawerClose = () => setQrDrawerOpen(false);
  const [isScannerOpen, setScannerOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [themeAnchorEl, setThemeAnchorEl] = useState(null);
  const [accentDrawerOpen, setAccentDrawerOpen] = useState(false);
  const [locationAnchorEl, setLocationAnchorEl] = useState(null);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [systemPrefersDark] = useState(window.matchMedia('(prefers-color-scheme: dark)').matches);
  const [privacyMenuAnchor, setPrivacyMenuAnchor] = useState(null);
  const [activePrivacySetting, setActivePrivacySetting] = useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [privacySettings, setPrivacySettings] = useState({
    profileVisibility: 'public',
    canBeAddedToGroups: 'everyone',
    canBeAddedToTrips: 'everyone',
  });
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [isLoadingBlocked, setIsLoadingBlocked] = useState(false);
  const [profilePicOpen, setProfilePicOpen] = useState(false);
  const [scannedUserData, setScannedUserData] = useState(null);
  const [showScannedUserDrawer, setShowScannedUserDrawer] = useState(false);
  const [activeTab, setActiveTab] = useState('myCode');
  const [viewMode, setViewMode] = useState('avatar');
  const [snackbar, setSnackbar] = useState({ open: false, message: '' });
  const [unreadCount, setUnreadCount] = useState(0);
  const [backgroundOpen, setBackgroundOpen] = useState(false);
  const [tripsCount, setTripsCount] = useState(0);

  const [groqApiKey, setGroqApiKey] = useState("");
  const [showGroqKey, setShowGroqKey] = useState(false);
  const [groqKeyStatus, setGroqKeyStatus] = useState("idle");
  const [groqKeyError, setGroqKeyError] = useState("");
  const [groqModels, setGroqModels] = useState([]);
  const [groqValidatedAt, setGroqValidatedAt] = useState(null);
  const [isValidatingGroq, setIsValidatingGroq] = useState(false);

  useEffect(() => {
    if (!auth.currentUser) return;
    const userDocRef = doc(firestore, "users", auth.currentUser.uid);
    const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.groqApiKey !== undefined) {
          setGroqApiKey(data.groqApiKey || "");
        }
        if (data.groqApiKeyStatus) {
          setGroqKeyStatus(data.groqApiKeyStatus);
        }
        if (data.groqApiKeyValidatedAt) {
          setGroqValidatedAt(data.groqApiKeyValidatedAt);
        }
        if (data.groqModels) {
          setGroqModels(data.groqModels || []);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  const handleValidateAndSaveGroqKey = async () => {
    if (!groqApiKey || !groqApiKey.trim()) {
      setGroqKeyError("Please enter a Groq API key.");
      setGroqKeyStatus("invalid");
      return;
    }

    setIsValidatingGroq(true);
    setGroqKeyError("");

    try {
      const response = await fetch("https://api.groq.com/openai/v1/models", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${groqApiKey.trim()}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        const errMsg = errData.error?.message || `API Error (${response.status})`;
        throw new Error(errMsg);
      }

      const data = await response.json();
      const availableModels = (data.data || []).map((m) => m.id);
      const validatedTime = new Date().toLocaleString();

      setGroqKeyStatus("valid");
      setGroqModels(availableModels);
      setGroqValidatedAt(validatedTime);

      if (auth.currentUser) {
        const userRef = doc(firestore, "users", auth.currentUser.uid);
        await updateDoc(userRef, {
          groqApiKey: groqApiKey.trim(),
          groqApiKeyStatus: "valid",
          groqApiKeyValidatedAt: validatedTime,
          groqModels: availableModels,
        });
      }

      setSnackbar({
        open: true,
        message: "✅ Groq API Key validated and saved to your account!",
      });
    } catch (err) {
      console.error("Groq key validation error:", err);
      setGroqKeyStatus("invalid");
      setGroqKeyError(err.message || "Failed to validate API key");
      setSnackbar({
        open: true,
        message: `❌ Groq Key Validation Failed: ${err.message}`,
      });
    } finally {
      setIsValidatingGroq(false);
    }
  };

  const handleClearGroqKey = async () => {
    try {
      setGroqApiKey("");
      setGroqKeyStatus("idle");
      setGroqModels([]);
      setGroqValidatedAt(null);
      setGroqKeyError("");
      if (auth.currentUser) {
        const userRef = doc(firestore, "users", auth.currentUser.uid);
        await updateDoc(userRef, {
          groqApiKey: "",
          groqApiKeyStatus: "idle",
          groqApiKeyValidatedAt: null,
          groqModels: [],
        });
      }
      setSnackbar({ open: true, message: "Groq API Key removed from your account." });
    } catch (err) {
      console.error("Error clearing key:", err);
    }
  };

  useEffect(() => {
    if (!auth.currentUser?.uid) return;

    const q = query(
      collection(db, "trips"),
      where("members", "array-contains", auth.currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setTripsCount(snapshot.size);
    });

    return () => unsubscribe();
  }, []);

  const handleSwiped = (eventData) => {
    if (eventData.dir === 'Left' && activeTab === 'myCode') {
      setActiveTab('scanCode');
    }
    if (eventData.dir === 'Right' && activeTab === 'scanCode') {
      setActiveTab('myCode');
    }
  };

  const swipeHandlers = useSwipeable({
    onSwiped: handleSwiped,
    trackMouse: true,
  });

  const [chatWallpaper, setChatWallpaper] = useState(() => {
    const savedWallpaper = localStorage.getItem('bunkmate_chatWallpaper');
    return savedWallpaper || 'none'; 
  });

  const handleWallpaperSelect = (wallpaperUrl) => {
      setChatWallpaper(wallpaperUrl);
      localStorage.setItem('bunkmate_chatWallpaper', wallpaperUrl);
  };
  const themeWallpapers = useMemo(() => {
    return wallpapers.filter(w => w.theme === mode || w.theme === 'both');
  }, [wallpapers, mode]);

  useEffect(() => {
    let defaultWallpaperUrl;
    if (mode === 'dark') {
      defaultWallpaperUrl = wallpapers.find(w => w.id === 'default-dark')?.url;
    } else {
      defaultWallpaperUrl = wallpapers.find(w => w.id === 'default-light')?.url;
    }

    if (defaultWallpaperUrl) {
      handleWallpaperSelect(defaultWallpaperUrl);
    }
  }, [mode]);

  const buttonWeatherBg =
    weather && weatherColors[weather.main]
      ? weatherColors[weather.main]
      : weatherColors.Default;
      
  const toggleDropdown = (key) => {
    setActiveDropdown(activeDropdown === key ? null : key);
  };

  const handleScanCode = () => {
    handleQrDrawerClose();
    setScannerOpen(true);
  };

  const handleScanSuccess = async (decodedText) => {
    if (isProcessing) return;
    setIsProcessing(true);
    setScannerOpen(false);

    const friendUid = decodedText;

    if (!friendUid || friendUid === auth.currentUser.uid) {
      alert(friendUid ? "You can't add yourself!" : "Invalid QR Code.");
      setIsProcessing(false);
      return;
    }

    try {
      const userDocRef = doc(db, "users", friendUid);
      const docSnap = await getDoc(userDocRef);

      if (docSnap.exists()) {
        setScannedUserData({ id: docSnap.id, ...docSnap.data() });
        setShowScannedUserDrawer(true);
      } else {
        alert("User not found.");
      }
    } catch (error) {
      console.error("Error fetching user by UID:", error);
      alert("Could not find user.");
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
      if (!auth.currentUser) return;

      const userId = auth.currentUser.uid;
      const notificationsQuery = query(
          collection(db, "notifications"),
          where("uid", "==", userId),
          where("seen", "==", false)
      );

      const unsubscribe = onSnapshot(notificationsQuery, (querySnapshot) => {
          setUnreadCount(querySnapshot.size);
      });

      return () => unsubscribe();
  }, []);

  const handleAddFriend = async () => {
    if (!scannedUserData) return;

    const friendUid = scannedUserData.id;

    try {
      const currentUserRef = doc(db, "users", auth.currentUser.uid);
      await updateDoc(currentUserRef, {
        friends: arrayUnion(friendUid),
      });

      const friendRef = doc(db, "users", friendUid);
      await updateDoc(friendRef, {
        friends: arrayUnion(auth.currentUser.uid),
      });

      alert("Friend added successfully! 🎉");
      setShowScannedUserDrawer(false);
      setScannedUserData(null);

    } catch (error) {
      console.error("Error adding friend:", error);
      alert("An error occurred while adding the friend.");
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: `Check out ${userData.name}'s profile`,
      message: `Here's a link to ${userData.name}'s profile on BunkMate.`,
      url: `${window.location.origin}/profile/${userData.uid}`,
    };

    try {
      if (window.nativeBridge && typeof window.nativeBridge.share === 'function') {
        window.nativeBridge.share({
          title: shareData.title,
          message: shareData.message,
          url: shareData.url,
        });
      } else if (navigator.share) {
        await navigator.share({
          title: shareData.title,
          text: shareData.message,
          url: shareData.url,
        });
      } else {
        await navigator.clipboard.writeText(shareData.url);
        setSnackbar({ open: true, message: 'Share not supported, link copied instead!' });
      }
    } catch (error) {
      console.error('Error sharing:', error);
      setSnackbar({ open: true, message: 'Could not complete the action.' });
    }
  };

  const handleCopyLink = async () => {
    const profileLink = `${window.location.origin}/profile/${auth.currentUser.uid}`;
    try {
      await navigator.clipboard.writeText(profileLink);
      setSnackbar({ open: true, message: 'Profile link copied to clipboard!' });
    } catch (error) {
      console.error('Error copying link:', error);
      setSnackbar({ open: true, message: 'Failed to copy link.' });
    }
  };

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const libraries = [
    { name: "React.js / React Native", functionality: "Core Application UI & Framework", license: "MIT License" },
    { name: "Firebase (Auth, Firestore, Messaging)", functionality: "Backend Services, Cloud Messaging, Data Storage", license: "Apache License 2.0" },
    { name: "Material UI (v5)", functionality: "UI Components & Design System", license: "MIT License" },
    { name: "OpenWeatherMap API", functionality: "Real-Time Weather Data", license: "CC BY-SA 4.0" },
    { name: "Google Fonts", functionality: "Typography Fonts", license: "SIL Open Font License 1.1" },
    { name: "Material Icons", functionality: "UI Icons / Visual Assets", license: "Apache License 2.0" },
    { name: "framer-motion", functionality: "Advanced UI Animations", license: "MIT License" },
    { name: "@fullcalendar/react, daygrid, etc.", functionality: "Calendar & Scheduling", license: "MIT / Commercial Dual License" },
    { name: "dayjs / date-fns", functionality: "Date & Time Handling", license: "MIT License" },
    { name: "react-easy-crop", functionality: "Client-Side Image Cropping", license: "MIT License" },
    { name: "react-webcam", functionality: "Camera Access & Streaming", license: "MIT License" },
    { name: "jsqr", functionality: "QR Code Scanning", license: "MIT License" },
    { name: "uuid", functionality: "Unique Identifier Generation", license: "MIT License" },
    { name: "lucide-react / qrcode.react", functionality: "UI Icons & QR Generation", license: "ISC License" },
  ];

  const licenseSections = [
    {
      title: "1. The MIT License",
      description:
        "Covers React.js, Material UI, and other core frontend dependencies. The MIT License is permissive, allowing reuse, modification, and redistribution of code provided the original copyright notice is retained.",
      details: [
        "Permission is granted free of charge to use, modify, publish, and distribute the software.",
        "The software is provided 'as is' without warranty of any kind.",
        "Includes copyrights from Facebook, Inc., Material-UI Team, and various contributors.",
      ],
    },
    {
      title: "2. Apache License 2.0",
      description:
        "Applies to Firebase SDKs and Material Icons. This license includes explicit patent grants and requires retaining copyright notices.",
      details: [
        "Grants perpetual, royalty-free copyright and patent licenses.",
        "Allows modification and distribution in source or object form.",
        "Applies to Firebase Auth, Firestore, Messaging, and Material Icons.",
      ],
    },
    {
      title: "3. Creative Commons Attribution-ShareAlike 4.0 (CC BY-SA 4.0)",
      description:
        "Used for OpenWeatherMap API data. Allows adaptation and commercial use provided attribution and same-license sharing.",
      details: [
        "Attribution required — include credit and link to license.",
        'Required credit: “Weather Data provided by OpenWeatherMap, licensed under CC BY-SA 4.0.”',
      ],
    },
    {
      title: "4. SIL Open Font License 1.1",
      description:
        "Covers Google Fonts used in the app’s typography. Allows free use, modification, and bundling of font software.",
      details: [
        "Fonts cannot be sold standalone.",
        "Modified font names must differ from reserved names.",
        "Full OFL text is included in font metadata.",
      ],
    },
    {
      title: "5. FullCalendar Dual License",
      description:
        "FullCalendar components operate under MIT or a Commercial License. Commercial use of advanced features may require a paid license.",
      details: [
        "BunkMates complies with either MIT or commercial terms as required.",
        "Copyright © 2025 Adam Shaw.",
      ],
    },
  ];

  const handleBuildTap = () => {
    setTapCount((prev) => {
      const newCount = prev + 1;

      if (tapTimer.current) clearTimeout(tapTimer.current);
      tapTimer.current = setTimeout(() => setTapCount(0), 1500);

      if (newCount >= 7) {
        setTapCount(0);
        setShowDevDialog(true);
      }

      return newCount;
    });
  };

  const handleVerifyDevKey = async () => {
    try {
      const keyDoc = await getDoc(doc(db, "secret", "devkey"));
      const validKey = keyDoc.exists() ? keyDoc.data().key : null;
      if (enteredKey.trim() === validKey) {
        setIsDeveloper(true);
        localStorage.setItem("isDeveloper", "true");
        setShowDevDialog(false);
        setEnteredKey("");
        alert("✅ Developer Mode Unlocked!");
      } else {
        alert("❌ Invalid Developer Key.");
      }
    } catch (err) {
      console.error("Error verifying dev key:", err);
      alert("Error verifying key. Try again later.");
    }
  };

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

  useEffect(() => {
    if (!auth.currentUser) return;

    const userId = auth.currentUser.uid;

    const feedbackQuery = query(collection(firestore, "feedback"), where("uid", "==", userId));
    const unsubscribeFeedback = onSnapshot(feedbackQuery, (querySnapshot) => {
      const feedbackList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUserFeedbacks(feedbackList);
      setFeedbackCount(querySnapshot.size);
    });

    const issuesQuery = query(collection(firestore, "issues"), where("userId", "==", userId));
    const unsubscribeIssues = onSnapshot(issuesQuery, (querySnapshot) => {
      const issuesList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUserIssues(issuesList);
      setIssuesCount(querySnapshot.size);
    });

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

  useEffect(() => {
    const fetchPrivacySettings = async () => {
      if (auth.currentUser) {
        try {
          const userDocRef = doc(db, "users", auth.currentUser.uid);
          const docSnap = await getDoc(userDocRef);

          if (docSnap.exists()) {
            const userData = docSnap.data();
            const userPrivacy = userData.privacy || {};

            setPrivacySettings({
              profileVisibility: userPrivacy.profileVisibility || 'public',
              canBeAddedToGroups: userPrivacy.canBeAddedToGroups || 'everyone',
              canBeAddedToTrips: userPrivacy.canBeAddedToTrips || 'everyone',
            });
          }
        } catch (error) {
          console.error("Error fetching privacy settings:", error);
        }
      }
    };

    fetchPrivacySettings();
  }, []);

  const handlePrivacyChange = async (setting, newValue) => {
    if (!auth.currentUser || !setting) {
      setPrivacyMenuAnchor(null);
      return;
    }

    const userDocRef = doc(db, "users", auth.currentUser.uid);
    const settingKey = `privacy.${setting}`;

    try {
      await updateDoc(userDocRef, { [settingKey]: newValue });
      setPrivacySettings(prevSettings => ({ ...prevSettings, [setting]: newValue }));
    } catch (error) {
      console.error("Error updating privacy setting:", error);
    } finally {
      setPrivacyMenuAnchor(null);
    }
  };

  const handleVisibilityChange = async (event) => {
    if (!auth.currentUser) return;

    const isPrivate = event.target.checked;
    const newVisibility = isPrivate ? 'private' : 'public';
    const userDocRef = doc(db, "users", auth.currentUser.uid);

    try {
      await updateDoc(userDocRef, { "privacy.profileVisibility": newVisibility });
      setPrivacySettings(s => ({ ...s, profileVisibility: newVisibility }));
    } catch (error) {
      console.error("Error updating profile visibility:", error);
    }
  };

  const handleDeleteAccount = async () => {
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
      alert("No user is signed in.");
      setDeleteConfirmOpen(false);
      return;
    }

    try {
      const userDocRef = doc(db, "users", user.uid);
      await deleteDoc(userDocRef);
      console.log("User document successfully deleted from Firestore.");

      alert("Your account data has been successfully deleted from Firestore.");

      setDeleteConfirmOpen(false);
      navigate("/login");

    } catch (error) {
      console.error("Error deleting user document:", error);
      alert("An error occurred while deleting your account data. Please try again.");
      setDeleteConfirmOpen(false);
    }
  };

  const handlePrivacyMenuOpen = (event, setting) => {
    setActivePrivacySetting(setting);
    setPrivacyMenuAnchor(event.currentTarget);
  };

  useEffect(() => {
    const fetchBlockedUsers = async () => {
      if (drawerPage === "blockedContacts" && auth.currentUser) {
        setIsLoadingBlocked(true);
        try {
          const userDocRef = doc(db, "users", auth.currentUser.uid);
          const docSnap = await getDoc(userDocRef);

          const blockedUids = docSnap.data()?.blockedUids || [];

          if (blockedUids.length === 0) {
            setBlockedUsers([]);
            setIsLoadingBlocked(false);
            return;
          }

          const usersQuery = query(
            collection(db, "users"),
            where('__name__', 'in', blockedUids)
          );
          const querySnapshot = await getDocs(usersQuery);
          const usersData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          
          setBlockedUsers(usersData);

        } catch (error) {
          console.error("Error fetching blocked users:", error);
        } finally {
          setIsLoadingBlocked(false);
        }
      }
    };

    fetchBlockedUsers();
  }, [drawerPage, auth.currentUser]);

  const handleUnblockUser = async (userIdToUnblock) => {
    if (!auth.currentUser) return;
    try {
      const userDocRef = doc(db, "users", auth.currentUser.uid);
      
      await updateDoc(userDocRef, {
        blockedUids: arrayRemove(userIdToUnblock)
      });

      setBlockedUsers(prevUsers => prevUsers.filter(user => user.id !== userIdToUnblock));

    } catch (error) {
      console.error("Error unblocking user:", error);
      alert("Failed to unblock user. Please try again.");
    }
  };

  const onFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(URL.createObjectURL(file));
      setCropDrawerOpen(true);
    }
  };

  const saveCroppedImage = async () => {
    try {
      const croppedImage = await getCroppedImg(selectedImage, croppedAreaPixels);
      setCroppedImageDataUri(croppedImage);
      setUserData(prev => ({ ...prev, photoURL: croppedImage }));
      setCropDrawerOpen(false);
      URL.revokeObjectURL(selectedImage);
      setSelectedImage(null);
    } catch (err) {
      console.error(err);
      alert("Failed to crop image");
    }
  };

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

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const settingsPage = params.get("settings");

    if (settingsPage) {
      const validPages = [
        "main", "profile", "accounts", "chats", "generalSettings", 
        "support", "feedback", "inviteFriend", "about", "featuresChangelog", "adduser", "blockedContacts", "appInfo", "developers", "aiFeatures"
      ];

      if (validPages.includes(settingsPage)) {
        setDrawerOpen(true);
        setDrawerPage(settingsPage);
      } else {
        navigate(location.pathname, { replace: true });
      }
    } else {
      setDrawerOpen(false);
    }
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

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/login");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  const onBack = () => {
    navigate(-1);
  };

  const inviteLink = `${window.location.origin}/invite/${userData.username}`;

  return (
  <ThemeProvider theme={theme}>
<>

  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>


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
        <ArrowDropDown sx={{ color: "text.primary" }} />
      </>
    )}
  </Box>
</Box>

<Drawer
  anchor="right"
  open={drawerOpen}
  onClose={handleDrawerClose}
  fullWidth
PaperProps={{
  sx: {
    mx: "auto",
    width: isSmallScreen ? "92vw" : 400,
    backgroundColor: mode === "dark" ? "#000000" : "#f1f1f1",
    backgroundImage: "none",
    color: theme.palette.text.primary,
    px: 2,
    pb: 4,
    pt: 0,
    overflowY: "auto",
    position: "relative",
  },
}}
>


<Box sx={{ pt: 0 }}>
<Box
  sx={{
    position: "sticky",
    top: 0,
    left: 0,
    right: 0,
    height: 120,
    zIndex: 20,
    mx: -2,
    pointerEvents: "none",

    backdropFilter: "blur(40px)",
    WebkitBackdropFilter: "blur(40px)",

    maskImage: `
      linear-gradient(
        to bottom,
        rgba(0,0,0,1) 0%,
        rgba(0,0,0,0.92) 18%,
        rgba(0,0,0,0.72) 38%,
        rgba(0,0,0,0.42) 62%,
        rgba(0,0,0,0.12) 82%,
        rgba(0,0,0,0) 100%
      )
    `,
    WebkitMaskImage: `
      linear-gradient(
        to bottom,
        rgba(0,0,0,1) 0%,
        rgba(0,0,0,0.92) 18%,
        rgba(0,0,0,0.72) 38%,
        rgba(0,0,0,0.42) 62%,
        rgba(0,0,0,0.12) 82%,
        rgba(0,0,0,0) 100%
      )
    `,

    background:
      mode === "dark"
        ? `
          linear-gradient(
            to bottom,
            rgba(0,0,0,0.35),
            rgba(0,0,0,0)
          )
        `
        : `
          linear-gradient(
            to bottom,
            rgba(255,255,255,0.35),
            rgba(255,255,255,0)
          )
        `,
  }}
/>

  {drawerPage === "main" && (
    <>
      <Box sx={{ display: "flex", position: "sticky", top: 120, left: 0, right: 0, alignItems: "center", my: 0, mx: 2, zIndex: 999 }}>
        <IconButton edge="start" color="inherit" onClick={() => navigate(-1)} 
          sx={{
            position: "relative",
            top: -70,
            mr: 2,
            color: theme.palette.text.primary,
            backgroundColor: mode === "dark" ? "#f1f1f100" : "#01010100",
            p: 1.3,
            height: 45,
            backdropFilter: "blur(6px)",
            boxShadow: 
              mode === "dark" 
              ? "inset 0 2px 6px rgba(255, 255, 255, 0.2), inset 0 -4px 10px rgba(255, 255, 255, 0.2)" 
              : "inset 0 2px 6px rgba(0, 0, 0, 0.2), inset 0 -4px 10px rgba(0, 0, 0, 0.2)",
          }}
        >
          <ArrowBack />
        </IconButton>
      </Box>

<Box
  sx={{
    position: "relative",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    mx: -2,
    mt: -23,  
    px: 3,
    py: 4,
    maxHeight: 500,
    height: "100%",
  }}
>
  <Box
    sx={{
      position: "absolute",
      inset: 0,
      background:
        mode === "dark"
          ? "linear-gradient(180deg, rgba(0, 0, 0, 0.07), rgba(0, 0, 0, 0.08))"
          : "linear-gradient(180deg, rgba(255,255,255,0.12), rgba(255,255,255,0.35))",
      zIndex: 1,
    }}
  />

  <Box
    component="img"
    src={userData.photoURL || ""}
    alt="background"
    sx={{
      width: "100%",
      height: "100%",
      objectFit: "cover",
      display: "block",
      position: "absolute",
            maskImage:
        "linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0.85) 20%, rgba(0,0,0,0.55) 55%, rgba(0,0,0,0.15) 80%, rgba(0,0,0,0) 100%)",

      WebkitMaskImage:
        "linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0.85) 20%, rgba(0,0,0,0.55) 55%, rgba(0,0,0,0.15) 80%, rgba(0,0,0,0) 100%)",
    }}
  />

<Box
  sx={{
    position: "relative",
    zIndex: 5,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    width: "100%",
    mt: 36,
  }}
>
  <Box
    sx={{
      background:"transparent",
      border:"none",
    }}
  >
    <Typography
      variant="h6"
      sx={{
        fontWeight: 700,
        color: "#fff",
        letterSpacing: 0.3,
      }}
    >
      {userData.name || "Username"}
    </Typography>

    <Typography
      variant="body2"
      sx={{
        color: "rgba(255,255,255,0.68)",
        fontSize: "0.9rem",
        mt: 0.3,
      }}
    >
      @{userData.username || "username"}
    </Typography>

<Box
  sx={{
    display: "flex",
    justifyContent: "center",
    gap: 1.2,
    mt: 3,
    flexWrap: "wrap",
    width: "100%",
  }}
>
  <Button
    variant="contained"
    onClick={(e) => {
      setDrawerOpen(false);
      navigate("/trips");
    }}
    sx={{
      minWidth: 112,
      px: 3,
      py: 2.3,
      borderRadius: "18px",
      textTransform: "none",
      boxShadow: "none",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: 0.2,

      background:
        mode === "dark"
          ? "rgba(255, 255, 255, 0)"
          : "rgba(255,255,255,0.3)",

      backdropFilter: "blur(70px) saturate(1.7) brightness(1.8)",
      WebkitBackdropFilter: "blur(70px) saturate(1.7) brightness(1.8)",

      color: "#fff",

      transition: "all 0.25s ease",

      "&:hover": {
        transform: "translateY(-2px)",
        background:
          mode === "dark"
            ? "rgba(255,255,255,0.14)"
            : "rgba(255,255,255,0.4)",
      },
    }}
  >
    <Typography
      sx={{
        fontSize: "1.55rem",
        fontWeight: 700,
        lineHeight: 1,
        color: "#fff",
      }}
    >
      {tripsCount || 0}
    </Typography>

    <Typography
      variant="caption"
      sx={{
        color: "rgba(255,255,255,0.65)",
        fontWeight: 500,
        letterSpacing: 0.4,
      }}
    >
      Trips
    </Typography>
  </Button>

  <Button
    variant="contained"
    onClick={(e) => {
      e.stopPropagation();
      handleSetDrawerPage("profile");
    }}
    sx={{
      minWidth: 112,
      px: 2,
      py: 1.3,
      borderRadius: "18px",
      textTransform: "none",
      boxShadow: "none",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: 0.3,

      background:
        mode === "dark"
          ? "rgba(255, 255, 255, 0)"
          : "rgba(255,255,255,0.3)",

      backdropFilter: "blur(70px) saturate(1.7) brightness(1.8)",
      WebkitBackdropFilter: "blur(70px) saturate(1.7) brightness(1.8)",

      color: "#fff",

      transition: "all 0.25s ease",

      "&:hover": {
        transform: "translateY(-2px)",
        background:
          mode === "dark"
            ? "rgba(255,255,255,0.14)"
            : "rgba(255,255,255,0.4)",
      },
    }}
  >
    <Edit3 size={22} />

    <Typography
      variant="caption"
      sx={{
        color: "rgba(255,255,255,0.7)",
        fontWeight: 500,
        letterSpacing: 0.3,
      }}
    >
      Edit Profile
    </Typography>
  </Button>

  <Button
    variant="contained"
    onClick={(e) => {
      e.stopPropagation();
      handleSetDrawerPage("adduser");
    }}
    sx={{
      minWidth: 112,
      px: 2,
      py: 1.3,
      borderRadius: "18px",
      textTransform: "none",
      boxShadow: "none",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: 0.3,

      background:
        mode === "dark"
          ? "rgba(255, 255, 255, 0)"
          : "rgba(255,255,255,0.3)",

      backdropFilter: "blur(70px) saturate(1.7) brightness(1.8)",
      WebkitBackdropFilter: "blur(70px) saturate(1.7) brightness(1.8)",

      color: "#fff",

      transition: "all 0.25s ease",

      "&:hover": {
        transform: "translateY(-2px)",
        background:
          mode === "dark"
            ? "rgba(255,255,255,0.14)"
            : "rgba(255,255,255,0.4)",
      },
    }}
  >
    <QrCode size={22} />

    <Typography
      variant="caption"
      sx={{
        color: "rgba(255,255,255,0.7)",
        fontWeight: 500,
        letterSpacing: 0.3,
      }}
    >
      QR Code
    </Typography>
  </Button>
</Box>
  </Box>
</Box>
</Box>

      <List sx={{ my: 0, mb: 10, mt: -5, gap: 0, display: "flex", flexDirection: "column" }}>

        <ListItem sx={{ pb: 0 }}>
          <ListItemButton onClick={() => handleSetDrawerPage("accounts")} sx={{ borderRadius: 3, py: 1, px: 1, '&:hover': { bgcolor: mode === "dark" ? '#f1f1f121' : '#e7e7e788' } }}>
            <ListItemIcon sx={{ minWidth: 40 }}><AccountCircleOutlined sx={{ color: theme.palette.text.secondary }} /></ListItemIcon>
            <ListItemText primary="Accounts" secondary="User privacy and security" primaryTypographyProps={{ fontWeight: 'medium' }} secondaryTypographyProps={{ variant: 'body2', color: 'text.secondary', noWrap: true }} />
          </ListItemButton>
        </ListItem>

        <ListItem sx={{ pb: 0 }}>
          <ListItemButton onClick={() => handleSetDrawerPage("chats")} sx={{ borderRadius: 3, py: 1, px: 1, '&:hover': { bgcolor: mode === "dark" ? '#f1f1f121' : '#e7e7e788' } }}>
            <ListItemIcon sx={{ minWidth: 40 }}><ChatBubbleOutline sx={{ color: theme.palette.text.secondary }} /></ListItemIcon>
            <ListItemText primary="Chats" secondary="Theme, Wallpapers, and Chat Settings" primaryTypographyProps={{ fontWeight: 'medium' }} secondaryTypographyProps={{ variant: 'body2', color: 'text.secondary', noWrap: true }} />
          </ListItemButton>
        </ListItem>

        <ListItem sx={{ pb: 0 }}>
          <ListItemButton onClick={() => handleSetDrawerPage("generalSettings")} sx={{ borderRadius: 3, py: 1, px: 1, '&:hover': { bgcolor: mode === "dark" ? '#f1f1f121' : '#e7e7e788' } }}>
            <ListItemIcon sx={{ minWidth: 40 }}><Settings sx={{ color: theme.palette.text.secondary }} /></ListItemIcon>
            <ListItemText primary="General Settings" secondary="App Theme, Language, and Location" primaryTypographyProps={{ fontWeight: 'medium' }} secondaryTypographyProps={{ variant: 'body2', color: 'text.secondary', noWrap: true }} />
          </ListItemButton>
        </ListItem>

{userData?.type === "Dev Beta" && (
  <ListItem sx={{ pb: 0 }}>
    <ListItemButton onClick={() => handleSetDrawerPage("aiFeatures")} sx={{ borderRadius: 3, py: 1, px: 1, '&:hover': { bgcolor: mode === "dark" ? '#f1f1f121' : '#e7e7e788' } }}>
      <ListItemIcon sx={{ minWidth: 40 }}><AutoAwesome sx={{ color: '#00E676' }} /></ListItemIcon>
      <ListItemText primary="AI Features" secondary={groqKeyStatus === "valid" ? "Groq API Key Connected & Synced" : "Configure Groq API Key & AI settings"} primaryTypographyProps={{ fontWeight: 'medium' }} secondaryTypographyProps={{ variant: 'body2', color: 'text.secondary', noWrap: true }} />
      {groqKeyStatus === "valid" && <Chip label="Active" size="small" color="success" sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700 }} />}
    </ListItemButton>
  </ListItem>
)}

        <ListItem sx={{ pb: 0 }}>
          <ListItemButton onClick={() => handleSetDrawerPage("support")} sx={{ borderRadius: 3, py: 1, px: 1, '&:hover': { bgcolor: mode === "dark" ? '#f1f1f121' : '#e7e7e788' } }}>
            <ListItemIcon sx={{ minWidth: 40 }}><HelpOutlineIcon sx={{ color: theme.palette.text.secondary }} /></ListItemIcon>
            <ListItemText primary="Help" secondary="Contact support and privacy policies" primaryTypographyProps={{ fontWeight: 'medium' }} secondaryTypographyProps={{ variant: 'body2', color: 'text.secondary', noWrap: true }} />
          </ListItemButton>
        </ListItem>

        <ListItem sx={{ pb: 0 }}>
          <ListItemButton onClick={() => handleSetDrawerPage("feedback")} sx={{ borderRadius: 3, py: 1, px: 1, '&:hover': { bgcolor: mode === "dark" ? '#f1f1f121' : '#e7e7e788' } }}>
            <ListItemIcon sx={{ minWidth: 40 }}><FeedbackOutlined sx={{ color: theme.palette.text.secondary }} /></ListItemIcon>
            <ListItemText primary="Send feedback" secondary="Report technical issues" primaryTypographyProps={{ fontWeight: 'medium' }} secondaryTypographyProps={{ variant: 'body2', color: 'text.secondary', noWrap: true }} />
          </ListItemButton>
        </ListItem>

        <ListItem sx={{ pb: 0 }}>
          <ListItemButton onClick={() => handleSetDrawerPage("inviteFriend")} sx={{ borderRadius: 3, py: 1.5, px: 1, '&:hover': { bgcolor: mode === "dark" ? '#f1f1f121' : '#e7e7e788' } }}>
            <ListItemIcon sx={{ minWidth: 40 }}><PersonAddOutlined sx={{ color: theme.palette.text.secondary }} /></ListItemIcon>
            <ListItemText primary="Invite a Friend" primaryTypographyProps={{ fontWeight: 'medium' }} />
          </ListItemButton>
        </ListItem>

        <ListItem sx={{ pb: 0 }}>
          <ListItemButton onClick={() => handleSetDrawerPage("about")} sx={{ borderRadius: 3, py: 1.5, px: 1, '&:hover': { bgcolor: mode === "dark" ? '#f1f1f121' : '#e7e7e788' } }}>
            <ListItemIcon sx={{ minWidth: 40 }}><InfoOutlined sx={{ color: theme.palette.text.secondary }} /></ListItemIcon>
            <ListItemText primary="About" primaryTypographyProps={{ fontWeight: 'medium' }} />
          </ListItemButton>
        </ListItem>

{isDeveloper && (
  <ListItem sx={{ pb: 0 }}>
    <ListItemButton
      onClick={() => handleSetDrawerPage("developers")}
      sx={{
        borderRadius: 3,
        py: 1.2,
        px: 1,
        "&:hover": {
          bgcolor: mode === "dark" ? "#f1f1f121" : "#e7e7e788",
          transform: "scale(1.02)",
          transition: "all 0.2s ease",
        },
      }}
    >
      <ListItemIcon sx={{ minWidth: 40 }}>
        <EngineeringOutlinedIcon sx={{ color: theme.palette.text.secondary }} />
      </ListItemIcon>
      <ListItemText
        primary="Testing Features & Other Routes"
        secondary="Access internal tools, sandboxes, and dev utilities"
        primaryTypographyProps={{
          fontWeight: "medium",
        }}
        secondaryTypographyProps={{
          variant: "body2",
          color: "text.secondary",
          noWrap: true,
        }}
      />
      <ArrowForwardIos sx={{ color: theme.palette.text.secondary }} />
    </ListItemButton>
  </ListItem>
)}

      </List>
    </>
  )}

{drawerPage === "accounts" && (
  <Container sx={{ mt: -6, mb: 2 }}>
    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <IconButton
            onClick={() => navigate(-1)}
            sx={{
                mr: 2, borderRadius: 8, color: theme.palette.text.primary,
                backgroundColor: mode === "dark" ? "#f1f1f111" : "#e0e0e071",
                '&:hover': { backgroundColor: "#f1f1f121" },
            }}
        >
            <ArrowBack />
        </IconButton>
        <Typography variant="h5" fontWeight="bold">
            Account Settings
        </Typography>
    </Box>

    <Typography variant="overline" color="text.secondary" sx={{ display: 'block', mt: 3, pl: 2 }}>Privacy</Typography>
    <List>
      <ListItem sx={{ pb: 0 }}>
      <ListItemIcon sx={{ minWidth: 40 }}><LockOutlinedIcon sx={{ color: theme.palette.text.secondary }} /></ListItemIcon>
        <ListItemText primary="Private Profile" secondary="Makes your profile visible only to friends." primaryTypographyProps={{ fontWeight: 'medium' }} secondaryTypographyProps={{ variant: 'body2', color: 'text.secondary', noWrap: true }} />
<Switch
  edge="end"
  checked={privacySettings.profileVisibility === "private"}
  onChange={handleVisibilityChange}
  sx={{
    width: 50,
    height: 28,
    padding: 0,
    "& .MuiSwitch-switchBase": {
      padding: 0.35,
      transition: "all 0.3s ease",
      "&.Mui-checked": {
        transform: "translateX(22px)",
        color: "#fff",
        "& .MuiSwitch-thumb": {
          backgroundColor: theme.palette.mode === "dark" ? "#121212" : "#fff",
        },
        "& + .MuiSwitch-track": {
          backgroundColor: theme.palette.primary.main,
          opacity: 1,
          border: 0,
        },
      },
    },
    "&:not(.Mui-checked)": {
        "& .MuiSwitch-thumb": {
          backgroundColor:
            theme.palette.mode === "dark" ? "#757575" : "#8d8d8dff",
        },
      },

    "& .MuiSwitch-thumb": {
      boxShadow: "none",
      width: 22,
      height: 22,
      borderRadius: "50%",
      transition: "slide 0.3s ease-in-out",
    },
    "& .MuiSwitch-track": {
      borderRadius: 8,
      backgroundColor:  theme.palette.mode === "dark" ? "#f1f1f121" : "#01010115",
      opacity: 1,
      transition: "background-color 0.3s",
    },
  }}
/>

      </ListItem>

  <ListItem sx={{ pb: 0 }}>
    <ListItemButton onClick={(e) => handlePrivacyMenuOpen(e, 'canBeAddedToGroups')} sx={{ borderRadius: 3, py: 1.5, px: 0, '&:hover': { bgcolor: mode === "dark" ? '#f1f1f121' : '#e7e7e788' } }}>
      <ListItemIcon sx={{ minWidth: 40 }}><GroupAddOutlinedIcon sx={{ color: theme.palette.text.secondary }} /></ListItemIcon>
      <ListItemText primary="Who can add you to groups" secondary={privacySettings.canBeAddedToGroups} primaryTypographyProps={{ fontWeight: 'medium' }} secondaryTypographyProps={{ variant: 'body2', color: 'text.secondary', noWrap: true }} />
    </ListItemButton>
  </ListItem>

  <ListItem sx={{ pb: 0 }}>
    <ListItemButton onClick={(e) => handlePrivacyMenuOpen(e, 'canBeAddedToTrips')} sx={{ borderRadius: 3, py: 1.5, px: 0, '&:hover': { bgcolor: mode === "dark" ? '#f1f1f121' : '#e7e7e788' } }}>
      <ListItemIcon sx={{ minWidth: 40 }}><CardTravelOutlinedIcon sx={{ color: theme.palette.text.secondary }} /></ListItemIcon>
      <ListItemText primary="Who can add you to trips" secondary={privacySettings.canBeAddedToTrips} primaryTypographyProps={{ fontWeight: 'medium' }} secondaryTypographyProps={{ variant: 'body2', color: 'text.secondary', noWrap: true }} />
    </ListItemButton>
  </ListItem>
    </List>

    <Typography variant="overline" color="text.secondary" sx={{ display: 'block', mt: 3, pl: 2 }}>Security</Typography>
    <List>
      <ListItemButton onClick={() => handleSetDrawerPage("blockedContacts")}>
        <ListItemIcon><BlockOutlinedIcon /></ListItemIcon>
        <ListItemText primary="Blocked Contacts" secondary="Manage users you've blocked" />
      </ListItemButton>
    </List>

    <Typography variant="overline" color="text.secondary" sx={{ display: 'block', mt: 3, pl: 2 }}>Account Actions</Typography>
    <List>
      <ListItemButton onClick={() => setDeleteConfirmOpen(true)} sx={{ color: 'error.main' }}>
        <ListItemIcon><DeleteForeverOutlinedIcon color="error" /></ListItemIcon>
        <ListItemText primary="Delete Account" secondary="This action is permanent and cannot be undone" />
      </ListItemButton>
    </List>

    <Menu
      anchorEl={privacyMenuAnchor}
      open={Boolean(privacyMenuAnchor)}
      onClose={() => setPrivacyMenuAnchor(null)}
      PaperProps={{
        elevation: 6,
        sx: {
          borderRadius: "16px",
          mt: 1,
          minWidth: "72%",
          backdropFilter: "blur(30px)",
          px: 1,
          bgcolor: mode === "dark" ? "#12121250" : "#ffffff80",
          boxShadow: "none",
          "& .MuiMenuItem-root": {
            borderRadius: "12px",
            mx: 0.5,
            my: 0.5,
            transition: "all 0.2s ease",
          },
        },
      }}
    >
      <MenuItem
        onClick={() => handlePrivacyChange(activePrivacySetting, "everyone")}
        selected={privacySettings[activePrivacySetting] === "everyone"}
      >
        <ListItemIcon>
          <PublicIcon fontSize="small" />
        </ListItemIcon>
        <ListItemText primary="Everyone" />
        {privacySettings[activePrivacySetting] === "everyone" && (
          <CheckIcon fontSize="small" color="primary" />
        )}
      </MenuItem>

      <MenuItem
        onClick={() => handlePrivacyChange(activePrivacySetting, "friends")}
        selected={privacySettings[activePrivacySetting] === "friends"}
      >
        <ListItemIcon>
          <PeopleOutlineIcon fontSize="small" />
        </ListItemIcon>
        <ListItemText primary="Friends" />
        {privacySettings[activePrivacySetting] === "friends" && (
          <CheckIcon fontSize="small" color="primary" />
        )}
      </MenuItem>

      <MenuItem
        onClick={() => handlePrivacyChange(activePrivacySetting, "nobody")}
        selected={privacySettings[activePrivacySetting] === "nobody"}
      >
        <ListItemIcon>
          <PersonOffOutlinedIcon fontSize="small" />
        </ListItemIcon>
        <ListItemText primary="Nobody" />
        {privacySettings[activePrivacySetting] === "nobody" && (
          <CheckIcon fontSize="small" color="primary" />
        )}
      </MenuItem>
    </Menu>

    {/* Delete Account Glassmorphic Swipeable Bottom Drawer */}
    <SwipeableDrawer
      anchor="bottom"
      open={deleteConfirmOpen}
      onClose={() => setDeleteConfirmOpen(false)}
      onOpen={() => {}}
      disableSwipeToOpen
      sx={{ zIndex: 1500 }}
      PaperProps={{
        sx: {
          borderRadius: 8,
          p: 3,
          background: mode === "dark" ? "rgba(20, 20, 20, 0.08)" : "rgba(255, 255, 255, 0.39)",
          backdropFilter: "blur(20px)",
          boxShadow: theme.palette.mode === "dark" 
            ? `inset 0 1px 2px rgba(255, 255, 255, 0.11), inset 0 -1px 1px rgba(35, 35, 35, 0.07)` 
            : `inset 0 1px 1px rgba(255, 255, 255, 0.8), inset 0 -1px 1px rgba(0, 0, 0, 0.1)`,
          maxWidth: 540,
          mx: "auto",
          m: 3
        }
      }}
      ModalProps={{
        BackdropProps: { sx: { backdropFilter: "blur(10px)", backgroundColor: "rgba(0,0,0,0)" } }
      }}
    >
      <Typography variant="h6" fontWeight="700" sx={{ textTransform: "none", textAlign: "center", mb: 2, color: mode === "dark" ? "#fff" : "#000" }}>
        Delete User Account
      </Typography>
      <Box display="flex" flexDirection="column" alignItems="center" gap={2} sx={{ mb: 3 }}>
        <Box 
          sx={{ 
            width: 56, 
            height: 56, 
            borderRadius: "50%", 
            backgroundColor: mode === "dark" ? "rgba(229, 57, 53, 0.15)" : "#ffebee", 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center" 
          }}
        >
          <Typography sx={{ fontSize: 26 }}>🗑️</Typography>
        </Box>
        <Typography variant="body1" textAlign="center" sx={{ fontWeight: 500, px: 2 }}>
          Are you sure you want to permanently delete your <strong>BunkMates account</strong>?
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ fontStyle: "italic", textAlign: "center", px: 2 }}>
          This will delete all of your profile data, trips, chats, and budgets. This change cannot be undone.
        </Typography>
      </Box>
      <Stack direction="row" spacing={2} justifyContent="center" sx={{ pb: 1 }}>
        <Button 
          variant="outlined" 
          fullWidth 
          onClick={() => setDeleteConfirmOpen(false)} 
          sx={{ 
            textTransform: "none", 
            background: mode === "dark" ? "rgba(255, 255, 255, 0.08)" : "rgba(255, 255, 255, 0.42)", 
            backdropFilter: "blur(10px)", 
            boxShadow: theme.palette.mode === "dark" 
              ? `inset 0 1px 2px rgba(255, 255, 255, 0.11), inset 0 -1px 1px rgba(35, 35, 35, 0.07)` 
              : `inset 0 1px 1px rgba(255, 255, 255, 0.8), inset 0 -1px 1px rgba(0, 0, 0, 0.1)`, 
            borderRadius: 8, 
            py: 1.2, 
            fontWeight: 600, 
            border: "none", 
            color: mode === "dark" ? "#fff" : "#000", 
            "&:hover": { backgroundColor: mode === "dark" ? "rgba(255, 255, 255, 0.05)" : "#f5f5f5" } 
          }}
        >
          Cancel
        </Button>
        <Button 
          variant="contained" 
          fullWidth 
          onClick={handleDeleteAccount} 
          sx={{ 
            textTransform: "none", 
            background: mode === "dark" ? "rgba(229, 57, 53, 0.18)" : "rgba(255, 102, 102, 0.69)", 
            backdropFilter: "blur(10px)", 
            boxShadow: theme.palette.mode === "dark" 
              ? `inset 0 1px 2px rgba(255, 255, 255, 0.11), inset 0 -1px 1px rgba(35, 35, 35, 0.07)` 
              : `inset 0 1px 1px rgba(255, 255, 255, 0.8), inset 0 -1px 1px rgba(0, 0, 0, 0.1)`, 
            borderRadius: 8, 
            py: 1.2, 
            fontWeight: 600, 
            color: mode === "dark" ? "#fff" : "#000", 
            "&:hover": { backgroundColor: "#c62828" } 
          }}
        >
          Delete Account
        </Button>
      </Stack>
    </SwipeableDrawer>
  </Container>
)}

{drawerPage === "aiFeatures" && (
  <Container sx={{ mt: -6, mb: 4 }}>
    <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
      <IconButton
        onClick={() => navigate(-1)}
        sx={{
          mr: 2, borderRadius: 8, color: theme.palette.text.primary,
          backgroundColor: mode === "dark" ? "#f1f1f111" : "#e0e0e071",
          '&:hover': { backgroundColor: "#f1f1f121" },
        }}
      >
        <ArrowBack />
      </IconButton>
      <Box>
        <Typography variant="h5" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AutoAwesome sx={{ color: '#00E676' }} /> AI Features Page
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Configure Groq API Key & cross-device AI synchronization
        </Typography>
      </Box>
    </Box>

    <Card
      sx={{
        p: 3,
        mb: 3,
        borderRadius: 4,
        background: mode === "dark" ? "rgba(255, 255, 255, 0.05)" : "rgba(255, 255, 255, 0.8)",
        backdropFilter: "blur(20px)",
        border: mode === "dark" ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(0,0,0,0.08)",
      }}
    >
      <Typography variant="h6" fontWeight="bold" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
        <VpnKey color="primary" /> Groq API Key
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
        Add your Groq API key below. It validates automatically, displays available models and usage metrics, and saves directly to Firestore so all your devices use it seamlessly.
      </Typography>

      <TextField
        fullWidth
        label="Groq API Key"
        type={showGroqKey ? "text" : "password"}
        value={groqApiKey}
        onChange={(e) => setGroqApiKey(e.target.value)}
        placeholder="gsk_..."
        variant="outlined"
        error={groqKeyStatus === "invalid"}
        helperText={groqKeyError || (groqKeyStatus === "valid" ? "Verified & Synced with Firestore" : "")}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <IconButton onClick={() => setShowGroqKey(!showGroqKey)} edge="end">
                {showGroqKey ? <VisibilityOff /> : <Visibility />}
              </IconButton>
            </InputAdornment>
          ),
        }}
        sx={{ mb: 2.5 }}
      />

      <Stack direction="row" spacing={2}>
        <Button
          variant="contained"
          onClick={handleValidateAndSaveGroqKey}
          disabled={isValidatingGroq}
          startIcon={isValidatingGroq ? <CircularProgress size={18} color="inherit" /> : <AutoAwesome />}
          sx={{
            borderRadius: 3,
            px: 3,
            py: 1.2,
            fontWeight: 700,
            textTransform: "none",
            background: "linear-gradient(135deg, #00E676, #00B0FF)",
            color: "#000",
            "&:hover": { opacity: 0.9 },
          }}
        >
          {isValidatingGroq ? "Validating Key..." : "Save & Validate Key"}
        </Button>

        {groqApiKey && (
          <Button
            variant="outlined"
            color="error"
            onClick={handleClearGroqKey}
            sx={{ borderRadius: 3, textTransform: "none", px: 2 }}
          >
            Clear Key
          </Button>
        )}
      </Stack>
    </Card>

    <Card
      sx={{
        p: 3,
        borderRadius: 4,
        background: mode === "dark" ? "rgba(255, 255, 255, 0.05)" : "rgba(255, 255, 255, 0.8)",
        backdropFilter: "blur(20px)",
        border: mode === "dark" ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(0,0,0,0.08)",
      }}
    >
      <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
        <ElectricBolt color="secondary" /> API Usage & Status
      </Typography>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
        <Typography variant="body2" color="text.secondary">Key Status:</Typography>
        {groqKeyStatus === "valid" ? (
          <Chip icon={<CheckCircle sx={{ color: '#00E676 !important' }} />} label="Active & Verified" color="success" size="small" variant="outlined" />
        ) : groqKeyStatus === "invalid" ? (
          <Chip icon={<ErrorOutline color="error" />} label="Invalid / Expired Key" color="error" size="small" variant="outlined" />
        ) : (
          <Chip label="Waiting for Key" size="small" variant="outlined" />
        )}
      </Box>

      {groqValidatedAt && (
        <Typography variant="caption" display="block" color="text.secondary" sx={{ mb: 2 }}>
          Last Validated: {groqValidatedAt}
        </Typography>
      )}

      <Typography variant="caption" display="block" color="text.secondary" sx={{ mb: 1.5, fontWeight: 700 }}>
        Available Groq AI Models ({groqModels.length || 0}):
      </Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        {groqModels.length > 0 ? (
          groqModels.map((m) => (
            <Chip key={m} label={m} size="small" sx={{ fontSize: '0.72rem', borderRadius: 2 }} />
          ))
        ) : (
          <Typography variant="caption" color="text.secondary">
            No models loaded. Click "Save & Validate Key" above to fetch your available Groq models.
          </Typography>
        )}
      </Box>
    </Card>
  </Container>
)}

{drawerPage === "blockedContacts" && (
  <Container sx={{ mt: -6, mb: 2 }}>
    <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
      <IconButton
        onClick={() => navigate(-1)}
        sx={{
          mr: 2,
          borderRadius: 8,
          color: theme.palette.text.primary,
          backgroundColor: mode === "dark" ? "#f1f1f111" : "#e0e0e091",
          "&:hover": { backgroundColor: "#f1f1f121" },
        }}
      >
        <ArrowBack />
      </IconButton>
      <Typography variant="h5" fontWeight="bold">
        Blocked Contacts
      </Typography>
    </Box>

    {isLoadingBlocked ? (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 6 }}>
        <CircularProgress />
      </Box>
    ) : blockedUsers.length === 0 ? (
      <Box
        sx={{
          mt: 6,
          textAlign: "center",
          color: "text.secondary",
          boxShadow: "none"
        }}
      >
        <Avatar
          sx={{
            width: 64,
            height: 64,
            mx: "auto",
            mb: 2,
            bgcolor: mode === "dark" ? "#444" : "#eee",
          }}
        >
          <BlockIcon color="disabled" />
        </Avatar>
        <Typography variant="body1">
          You haven’t blocked anyone yet.
        </Typography>
      </Box>
    ) : (
      <List sx={{ mt: 2 }}>
        {blockedUsers.map((user) => (
          <ListItem
            key={user.id}
            sx={{
              mb: 1.5,
              px: 2,
              py: 1.5,
              borderRadius: 3,
              backgroundColor: "transparent",
              boxShadow: "none",
            }}
            secondaryAction={
              <Button
                variant="contained"
                size="small"
                onClick={() => handleUnblockUser(user.id)}
                sx={{
                  textTransform: "none",
                  borderRadius: 2,
                  fontWeight: 600,
                  px: 1,
                  py: 0.5,
                  boxShadow: "none",
                  color: mode === "dark" ? "#ffb1b1c6" : "#dd0000ff",
                  backgroundColor: mode === "dark" ? "#c100008a" : "#ff8383c6",
                  "&:hover": { opacity: 0.9 },
                }}
              >
                UNBLOCK
              </Button>
            }
          >
            <ListItemAvatar>
              <Avatar
                src={user.photoURL}
                alt={user.name}
                sx={{ width: 44, height: 44 }}
              />
            </ListItemAvatar>
            <ListItemText
              primary={
                <Typography fontWeight={600} color="text.primary">
                  {user.name}
                </Typography>
              }
              secondary={
                <Typography variant="body2" color="text.secondary">
                  @{user.username}
                </Typography>
              }
            />
          </ListItem>
        ))}
      </List>
    )}
  </Container>
)}

{drawerPage === "chats" && (
<Container sx={{ mt: -6, mb: 2 }}>
<Box
  sx={{
    display: 'flex',
    alignItems: 'center',
    gap: 2,
    mb: 2,
  }}
>
  <IconButton
    onClick={() => navigate(-1)}
    sx={{
      borderRadius: 8,
      color: theme.palette.text.primary,
      backgroundColor: mode === "dark" ? "#f1f1f111" : "#e0e0e071",
      '&:hover': { backgroundColor: "#f1f1f121" },
    }}
  >
    <ArrowBack />
  </IconButton>

  <Typography
    variant="h5"
    fontWeight="bold"
    sx={{
      flexGrow: 1,
      textAlign: 'left',
      color: theme.palette.text.primary,
    }}
  >
    Chat Settings
  </Typography>
</Box>

<List>
  <Typography variant="overline" color="text.secondary" sx={{ pl: 2, mb: 1 }}>
    Appearance
  </Typography>

  <ListItem sx={{ pb: 0 }}>
      <ListItemIcon sx={{ minWidth: 40 }}><PaletteOutlinedIcon sx={{ color: theme.palette.text.secondary }} /></ListItemIcon>
      <ListItemText primary="Theme" primaryTypographyProps={{ fontWeight: 'medium' }} />
      <FormControl size="small" sx={{ minWidth: 120 }}>
    <Select
      value={chatTheme}
      onChange={(e) => {
        const newTheme = e.target.value;
        setChatTheme(newTheme);
        localStorage.setItem('bunkmate_chatTheme', newTheme);
      }}
      sx={{
        bgcolor: mode === "dark" ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)",
        borderRadius: 2,
        border: mode === "dark" ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(0,0,0,0.1)",
        boxShadow: mode === "dark" ? "0 4px 12px rgba(0,0,0,0.3)" : "0 4px 12px rgba(0,0,0,0.1)",
        transition: "all 0.3s ease",
        '&:hover': {
          bgcolor: mode === "dark" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)",
          boxShadow: mode === "dark" ? "0 4px 16px rgba(255,255,255,0.1)" : "0 4px 16px rgba(0,0,0,0.2)",
        },
        '& .MuiSelect-select': {
          p: 1,
            display: 'flex',
            alignItems: 'center',
        },
        '& .MuiSvgIcon-root': {
          color: theme.palette.text.secondary,
        },
      }}
      MenuProps={{
        PaperProps: {
          sx: {
            bgcolor: mode === "dark" ? "rgba(26, 26, 26, 0.52)" : "rgba(255, 255, 255, 0.74)",
              backdropFilter: "blur(10px)",
              borderRadius: 2,
              boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            p: 1,
          },
        },
      }}
    >
    <MenuItem
      value="system"
      sx={{
        borderRadius: 1.5,
        transition: "background-color 0.2s ease, transform 0.2s ease",
        '&:hover': {
          bgcolor: mode === "dark" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)",
          transform: "scale(1.02)",
        },
      }}
    >
      System
    </MenuItem>

    <MenuItem
      value="light"
      sx={{
        borderRadius: 1.5,
        transition: "background-color 0.2s ease, transform 0.2s ease",
        '&:hover': {
          bgcolor: mode === "dark" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)",
          transform: "scale(1.02)",
        },
      }}
    >
      Light
    </MenuItem>

    <MenuItem
      value="dark"
      sx={{
        borderRadius: 1.5,
        transition: "background-color 0.2s ease, transform 0.2s ease",
        '&:hover': {
          bgcolor: mode === "dark" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)",
          transform: "scale(1.02)",
        },
      }}
    >
      Dark
    </MenuItem>

  </Select>
      </FormControl>
  </ListItem>

  <ListItem sx={{ pb: 0 }}>
    <ListItemButton onClick={() => setWallpaperDrawerOpen(true)} sx={{ borderRadius: 3, py: 1.5, px: 0, '&:hover': { bgcolor: mode === "dark" ? '#f1f1f121' : '#e7e7e788' } }}>
      <ListItemIcon sx={{ minWidth: 40 }}><WallpaperOutlinedIcon sx={{ color: theme.palette.text.secondary }} /></ListItemIcon>
      <ListItemText primary="Chat wallpaper" secondary="Choose a background for your chats" primaryTypographyProps={{ fontWeight: 'medium' }} secondaryTypographyProps={{ variant: 'body2', color: 'text.secondary', noWrap: true }} />
    </ListItemButton>
  </ListItem>

  <ListItem sx={{ pb: 0 }}>
    <ListItemButton onClick={() => setFontDrawerOpen(true)} sx={{ borderRadius: 3, py: 1.5, px: 0, '&:hover': { bgcolor: mode === "dark" ? '#f1f1f121' : '#e7e7e788' } }}>
      <ListItemIcon sx={{ minWidth: 40 }}><FormatSizeOutlinedIcon sx={{ color: theme.palette.text.secondary }} /></ListItemIcon>
      <ListItemText primary="Font Size" sx={{ mr: 4 }} />
      <Typography
        variant="body2"
        sx={{
          color: theme.palette.text.secondary,
          mr: 2,
          p: 0.5,
          borderRadius: 1.5,
          border: "2px solid rgba(136,136,136,0.3)",
          bgcolor: mode === "dark" ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)",
          minWidth: 50,
          textAlign: 'center'
        }}
      >
        {fontSize}px
      </Typography>
    </ListItemButton>
  </ListItem>

  <Divider sx={{ my: 2 }} />

  <Typography variant="overline" color="text.secondary" sx={{ pl: 2, mb: 1 }}>
    Chat History
  </Typography>

  <ListItem sx={{ pb: 0 }}>
    <ListItemButton onClick={() => setClearDialogOpen(true)} sx={{ borderRadius: 3, py: 1.5, px: 0, '&:hover': { bgcolor: mode === "dark" ? '#f1f1f121' : '#e7e7e788' } }}>
      <ListItemIcon sx={{ minWidth: 40 }}><DeleteSweepOutlinedIcon sx={{ color: theme.palette.text.secondary }} /></ListItemIcon>
      <ListItemText primary="Clear all chats" secondary="Deletes all messages from every chat" primaryTypographyProps={{ fontWeight: 'medium' }} secondaryTypographyProps={{ variant: 'body2', color: 'text.secondary', noWrap: true }} />
    </ListItemButton>
  </ListItem>

  <ListItem sx={{ pb: 0 }}>
    <ListItemButton onClick={() => setDeleteDialogOpen(true)} sx={{ borderRadius: 3, py: 1.5, px: 0, '&:hover': { bgcolor: mode === "dark" ? '#f1f1f121' : '#e7e7e788' } }}>
      <ListItemIcon sx={{ minWidth: 40 }}><DeleteForeverOutlinedIcon sx={{ color: theme.palette.text.secondary }} /></ListItemIcon>
      <ListItemText primary="Delete all chats" secondary="Permanently removes all chats and messages" primaryTypographyProps={{ fontWeight: 'medium' }} secondaryTypographyProps={{ variant: 'body2', color: 'text.secondary', noWrap: true }} />
    </ListItemButton>
  </ListItem>

</List>

<SwipeableDrawer
  anchor="bottom"
  open={fontDrawerOpen}
  onClose={() => setFontDrawerOpen(false)}
  onOpen={() => setFontDrawerOpen(true)}
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
      p: 1,
      borderTopLeftRadius: 16,
      borderTopRightRadius: 16,
      maxHeight: "70vh",
      overflowY: "auto",
      backdropFilter: "blur(50px)",
      backgroundColor: mode === "dark" ? "#00000038" : "#ffffff9b",
      boxShadow: "none"
    },
  }}
>
  <Box sx={{ p: 2.5, overflowY: 'auto' }}>
    <Box
      sx={{
        width: 40,
        height: 5,
        backgroundColor: "grey.400",
        borderRadius: 3,
        mx: 'auto',
        mb: 2,
      }}
    />

    <ListItem sx={{ flexWrap: 'wrap', gap: 2 }}>
      <ListItemIcon><FormatSizeOutlinedIcon /></ListItemIcon>
      <ListItemText primary="Font Size" sx={{ mr: 4 }} />
      <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mr: 2, p: 0.5, borderRadius: 1.5, border: "2px solid #88888848" }}>
        {fontSize}px
      </Typography>
    </ListItem>

    <Box sx={{ my: 4, p: 3, borderRadius: 3, textAlign: 'center', backgroundColor: theme.palette.secondary.main }}>
      <Typography variant="h6" sx={{ mb: 1 }}>
        Preview
      </Typography>
      <Typography
        sx={{
          fontSize: `${fontSize}px`,
          color: mode === "dark" ? "#fff" : "#000",
          transition: "font-size 0.3s ease",
        }}
      >
        The quick brown fox jumps over the lazy dog.
      </Typography>
    </Box>

    <Slider
      sx={{
        mx: "auto",
        color: mode === "dark" ? "#fff" : "#000",
        height: 20,
        '& .MuiSlider-thumb': {
          height: 20,
          width: 35,
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
          background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
        },
        '& .MuiSlider-rail': {
          opacity: 0.2,
          backgroundColor: mode === "dark" ? "#555" : "#ccc",
        },
        '& .MuiSlider-mark': {
          height: 0,
          width: 0,
        },
        '& .MuiSlider-markLabel': {
          color: mode === "dark" ? "#ccc" : "#555",
          fontSize: 12,
          top: 45,
        },
      }}
      value={fontSize}
      onChange={(e, newValue) => {
        setFontSize(newValue);
        localStorage.setItem('bunkmate_fontSize', newValue);
      }}
      aria-labelledby="font-size-slider"
      valueLabelDisplay="auto"
      step={1}
      marks={[
        { value: 12, label: 'S' },
        { value: 14, label: 'M' },
        { value: 18, label: 'L' },
      ]}
      min={12}
      max={18}
    />

      <Typography variant="caption" sx={{ mt: 1, textAlign: "center", display: "block", color: theme.palette.text.secondary }}>
        Adjust the slider to see how text size changes.
      </Typography>

  </Box>
</SwipeableDrawer>

<SwipeableDrawer
    anchor="bottom"
    open={wallpaperDrawerOpen}
    onClose={() => setWallpaperDrawerOpen(false)}
    onOpen={() => setWallpaperDrawerOpen(true)}
    PaperProps={{
        sx: {
            p: 1, borderTopLeftRadius: 16, borderTopRightRadius: 16,
            maxHeight: "70vh", overflowY: "auto",
            backdropFilter: "blur(50px)",
            backgroundColor: mode === "dark" ? "#00000038" : "#ffffff9c",
            boxShadow: "none"
        },
    }}
>
    <Box sx={{ p: 2, overflowY: 'auto' }}>
        <Box sx={{ width: 40, height: 5, backgroundColor: "grey.400", borderRadius: 3, mx: 'auto', mb: 2 }} />
        <Typography variant="h6" fontWeight="bold" textAlign="center" sx={{ mb: 2 }}>
            Chat Wallpaper
        </Typography>

        <Grid container spacing={1}>
            {themeWallpapers.map(wallpaper => (
                <Grid item xs={4} sm={3} md={2} key={wallpaper.id}>
                    <Box
                      onClick={() => handleWallpaperSelect(wallpaper.url)}
                      sx={{
                          position: 'relative',
                          height: 160,
                          width: 100,
                          borderRadius: 2,
                          cursor: 'pointer',
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                          backgroundImage: wallpaper.url === 'none' ? 'none' : `url(${wallpaper.url})`,
                          backgroundColor: wallpaper.url === 'none' ? mode === "dark" ? '#121212' : "#f1f1f1" : 'transparent',
                          border: chatWallpaper === wallpaper.url ? `3px solid ${theme.palette.primary.main}` : '3px solid transparent',
                          transition: 'border 0.2s ease-in-out',
                          '&:hover': {
                              opacity: 0.8
                          }
                        }}
                    >
                        {chatWallpaper === wallpaper.url && (
                            <CheckCircle sx={{ position: 'absolute', top: 8, right: 8, color: 'primary.main', backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: '50%' }} />
                        )}
                        <Typography sx={{ position: 'absolute', bottom: 8, left: 8, color: '#fff', backgroundColor: 'rgba(0,0,0,0.5)', px: 1, borderRadius: 1, fontSize: '0.75rem' }}>
                            {wallpaper.name}
                        </Typography>
                    </Box>
                </Grid>
            ))}
        </Grid>
    </Box>
</SwipeableDrawer>

{/* Clear All Chats Glassmorphic Swipeable Bottom Drawer */}
<SwipeableDrawer
  anchor="bottom" open={clearDialogOpen} onClose={() => setClearDialogOpen(false)} onOpen={() => {}} disableSwipeToOpen sx={{ zIndex: 1500 }}
  PaperProps={{ sx: { borderRadius: 8, p: 3, background: mode === "dark" ? "rgba(20, 20, 20, 0.08)" : "rgba(255,255,255,0.39)", backdropFilter: "blur(20px)", boxShadow: theme.palette.mode === "dark" ? `inset 0 1px 2px rgba(255, 255, 255, 0.11), inset 0 -1px 1px rgba(35, 35, 35, 0.07)` : `inset 0 1px 1px rgba(255,255,255,0.8), inset 0 -1px 1px rgba(0, 0, 0, 0.1)`, maxWidth: 540, mx: "auto", m: 3 } }}
  ModalProps={{ BackdropProps: { sx: { backdropFilter: "blur(10px)", backgroundColor: "rgba(0,0,0,0)" } } }}
>
  <Typography variant="h6" fontWeight="700" sx={{ textTransform: "none", textAlign: "center", mb: 2, color: mode === "dark" ? "#fff" : "#000" }}>Clear All Chat Threads</Typography>
  <Box display="flex" flexDirection="column" alignItems="center" gap={2} sx={{ mb: 3 }}>
    <Box sx={{ width: 56, height: 56, borderRadius: "50%", backgroundColor: mode === "dark" ? "rgba(229, 57, 53, 0.15)" : "#ffebee", display: "flex", alignItems: "center", justifyContent: "center" }}><Typography sx={{ fontSize: 26 }}>💬</Typography></Box>
    <Typography variant="body1" textAlign="center" sx={{ fontWeight: 500, px: 2 }}>Are you sure you want to clear message histories across <strong>all active chats</strong>?</Typography>
    <Typography variant="caption" color="text.secondary" sx={{ fontStyle: "italic", textAlign: "center", px: 2 }}>Your thread connections remain intact, but message payloads will be cleared permanently.</Typography>
  </Box>
  <Stack direction="row" spacing={2} justifyContent="center" sx={{ pb: 1 }}>
    <Button variant="outlined" fullWidth onClick={() => setClearDialogOpen(false)} sx={{ textTransform: "none", background: mode === "dark" ? "rgba(255, 255, 255, 0.08)" : "rgba(255,255,255,0.42)", backdropFilter: "blur(10px)", boxShadow: theme.palette.mode === "dark" ? `inset 0 1px 2px rgba(255, 255, 255, 0.11), inset 0 -1px 1px rgba(35, 35, 35, 0.07)` : `inset 0 1px 1px rgba(255,255,255,0.8), inset 0 -1px 1px rgba(0, 0, 0, 0.1)`, borderRadius: 8, py: 1.2, fontWeight: 600, border: "none", color: mode === "dark" ? "#fff" : "#000", "&:hover": { backgroundColor: mode === "dark" ? "rgba(255, 255, 255, 0.05)" : "#f5f5f5" } }}>Cancel</Button>
    <Button variant="contained" fullWidth onClick={() => { console.log("Clearing all chats..."); setClearDialogOpen(false); }} sx={{ textTransform: "none", background: mode === "dark" ? "rgba(229, 57, 53, 0.18)" : "rgba(255, 102, 102, 0.69)", backdropFilter: "blur(10px)", boxShadow: theme.palette.mode === "dark" ? `inset 0 1px 2px rgba(255, 255, 255, 0.11), inset 0 -1px 1px rgba(35, 35, 35, 0.07)` : `inset 0 1px 1px rgba(255,255,255,0.8), inset 0 -1px 1px rgba(0, 0, 0, 0.1)`, borderRadius: 8, py: 1.2, fontWeight: 600, color: mode === "dark" ? "#fff" : "#000", "&:hover": { backgroundColor: "#c62828" } }}>Clear Messages</Button>
  </Stack>
</SwipeableDrawer>

{/* Delete All Chats Glassmorphic Swipeable Bottom Drawer */}
<SwipeableDrawer
  anchor="bottom" open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} onOpen={() => {}} disableSwipeToOpen sx={{ zIndex: 1500 }}
  PaperProps={{ sx: { borderRadius: 8, p: 3, background: mode === "dark" ? "rgba(20, 20, 20, 0.08)" : "rgba(255,255,255,0.39)", backdropFilter: "blur(20px)", boxShadow: theme.palette.mode === "dark" ? `inset 0 1px 2px rgba(255, 255, 255, 0.11), inset 0 -1px 1px rgba(35, 35, 35, 0.07)` : `inset 0 1px 1px rgba(255,255,255,0.8), inset 0 -1px 1px rgba(0, 0, 0, 0.1)`, maxWidth: 540, mx: "auto", m: 3 } }}
  ModalProps={{ BackdropProps: { sx: { backdropFilter: "blur(10px)", backgroundColor: "rgba(0,0,0,0)" } } }}
>
  <Typography variant="h6" fontWeight="700" sx={{ textTransform: "none", textAlign: "center", mb: 2, color: mode === "dark" ? "#fff" : "#000" }}>Delete All Chat Matrix Instance</Typography>
  <Box display="flex" flexDirection="column" alignItems="center" gap={2} sx={{ mb: 3 }}>
    <Box sx={{ width: 56, height: 56, borderRadius: "50%", backgroundColor: mode === "dark" ? "rgba(229, 57, 53, 0.15)" : "#ffebee", display: "flex", alignItems: "center", justifyContent: "center" }}><Typography sx={{ fontSize: 26 }}>🗑️</Typography></Box>
    <Typography variant="body1" textAlign="center" sx={{ fontWeight: 500, px: 2 }}>Are you sure you want to completely purge <strong>all chats and messages</strong>?</Typography>
    <Typography variant="caption" color="text.secondary" sx={{ fontStyle: "italic", textAlign: "center", px: 2 }}>Warning: This step removes all message logs and chat threads permanently.</Typography>
  </Box>
  <Stack direction="row" spacing={2} justifyContent="center" sx={{ pb: 1 }}>
    <Button variant="outlined" fullWidth onClick={() => setDeleteDialogOpen(false)} sx={{ textTransform: "none", background: mode === "dark" ? "rgba(255, 255, 255, 0.08)" : "rgba(255,255,255,0.42)", backdropFilter: "blur(10px)", boxShadow: theme.palette.mode === "dark" ? `inset 0 1px 2px rgba(255, 255, 255, 0.11), inset 0 -1px 1px rgba(35, 35, 35, 0.07)` : `inset 0 1px 1px rgba(255,255,255,0.8), inset 0 -1px 1px rgba(0, 0, 0, 0.1)`, borderRadius: 8, py: 1.2, fontWeight: 600, border: "none", color: mode === "dark" ? "#fff" : "#000", "&:hover": { backgroundColor: mode === "dark" ? "rgba(255, 255, 255, 0.05)" : "#f5f5f5" } }}>Cancel</Button>
    <Button variant="contained" fullWidth onClick={() => { console.log("Deleting all chats..."); setDeleteDialogOpen(false); }} sx={{ textTransform: "none", background: mode === "dark" ? "rgba(229, 57, 53, 0.18)" : "rgba(255, 102, 102, 0.69)", backdropFilter: "blur(10px)", boxShadow: theme.palette.mode === "dark" ? `inset 0 1px 2px rgba(255, 255, 255, 0.11), inset 0 -1px 1px rgba(35, 35, 35, 0.07)` : `inset 0 1px 1px rgba(255,255,255,0.8), inset 0 -1px 1px rgba(0, 0, 0, 0.1)`, borderRadius: 8, py: 1.2, fontWeight: 600, color: mode === "dark" ? "#fff" : "#000", "&:hover": { backgroundColor: "#c62828" } }}>Delete All Chats</Button>
  </Stack>
</SwipeableDrawer>

    </Container>
)}

{drawerPage === "inviteFriend" && (
  <Container
    sx={{
      mt: -6,
      mb: 3,
      animation: "fadeIn 0.4s ease-in-out",
      "@keyframes fadeIn": { from: { opacity: 0 }, to: { opacity: 1 } },
      px: { xs: 2, sm: 3 },
    }}
  >
    <Box sx={{ display: "flex", alignItems: "center", mb: 4 }}>
      <IconButton
        onClick={() => navigate(-1)}
        sx={{
          mr: 2,
          borderRadius: 8,
          p: 1,
          color: theme.palette.text.primary,
          backgroundColor: mode === "dark" ? "#ffffff10" : "#e0e0e060",
          transition: "all 0.2s ease",
          "&:hover": {
            backgroundColor:
              mode === "dark" ? "#ffffff20" : alpha(theme.palette.primary.main, 0.1),
            transform: "scale(1.05)",
          },
        }}
      >
        <ArrowBack />
      </IconButton>
      <Typography variant="h5" fontWeight="700">
        Invite & Download
      </Typography>
    </Box>

    <Typography
      variant="subtitle1"
      fontWeight="700"
      sx={{ mb: 2, color: theme.palette.text.primary }}
    >
      Share the BunkMates App
    </Typography>

    <Card
      sx={{
        p: 4,
        mb: 4,
        borderRadius: 5,
        textAlign: "center",
        background:
          mode === "dark"
            ? "linear-gradient(145deg, #1b1b1b0d 0%, #2323230a 100%)"
            : "linear-gradient(145deg, #ffffff32 0%, #f8f8f81f 100%)",
        backdropFilter: "blur(10px)",
        boxShadow: "none",
      }}
    >
      <Box sx={{ display: "inline-block", p: 1.5, borderRadius: 3, bgcolor: "white", mb: 2 }}>
        <QRCodeSVG
          value={downloadLink}
          size={200}
          level={"H"}
          bgColor={"#FFFFFF"}
          fgColor={"#000000"}
        />
      </Box>

      <Typography
        variant="body2"
        sx={{ color: theme.palette.text.secondary, mb: 2 }}
      >
        Scan the QR or share this download link:
      </Typography>

      <TextField
        label="App Download Link"
        defaultValue={downloadLink}
        fullWidth
        InputProps={{ readOnly: true }}
        sx={{
          mb: 2,
          "& .MuiInputBase-root": {
            bgcolor:
              mode === "dark"
                ? "rgba(255,255,255,0.05)"
                : "rgba(0,0,0,0.04)",
            borderRadius: 2,
          },
        }}
      />

      <Button
        variant="contained"
        onClick={() => navigator.clipboard.writeText(downloadLink)}
        sx={{
          borderRadius: 8,
          width: "100%",
          py: 1.2,
          fontWeight: 600,
          textTransform: "none",
          transition: "all 0.2s ease",
          bgcolor: theme.palette.primary.main,
          "&:hover": {
            bgcolor: theme.palette.primary.dark,
            transform: "translateY(-2px)",
          },
        }}
      >
        Copy Download Link
      </Button>
    </Card>

    <Divider sx={{ my: 4 }} />

    <Typography
      variant="subtitle1"
      sx={{ mb: 2, color: theme.palette.text.secondary }}
    >
      Share Invite Link via
    </Typography>

    <Stack
      direction="row"
      spacing={2}
      justifyContent="center"
      overflowX="auto"
    >
      {[
        {
          icon: <WhatsAppIcon />,
          action: () =>
            window.open(
              `https://wa.me/?text=Join me on BunkMates using this link: ${downloadLink}`,
              "_blank"
            ),
        },
        {
          icon: <EmailIcon />,
          action: () =>
            window.open(
              `mailto:?subject=Join me on BunkMates&body=Join using my profile link: ${downloadLink}`,
              "_blank"
            ),
        },
        {
          icon: <TelegramIcon />,
          action: () =>
            window.open(
              `https://t.me/share/url?url=${downloadLink}&text=Connect with me on BunkMates!`,
              "_blank"
            ),
        },
        {
          icon: <ShareIcon />,
          label: "More",
          action: () =>
            navigator.share &&
            navigator.share({
              title: "Connect with me on BunkMates!",
              text: "Join using this profile link:",
              url: downloadLink,
            }),
        },
      ].map((btn, idx) => (
        <Button
          key={idx}
          startIcon={btn.icon}
          onClick={btn.action}
          sx={{
            borderRadius: 3,
            textTransform: "none",
            px: 2,
            alignContent: "center",
            fontWeight: 500,
            color: theme.palette.text.primary,
            border: `1px solid ${
              mode === "dark" ? "#ffffff22" : "#00000015"
            }`,
            backgroundColor:
              mode === "dark" ? "#ffffff05" : "rgba(0,0,0,0.03)",
            "&:hover": {
              backgroundColor:
                mode === "dark"
                  ? alpha(theme.palette.primary.main, 0.15)
                  : alpha(theme.palette.primary.main, 0.08),
              transform: "translateY(-2px)",
            },
            transition: "all 0.2s ease",
          }}
        >
          {btn.label}
        </Button>
      ))}
    </Stack>
  </Container>
)}

{drawerPage === "generalSettings" && (
  <Container sx={{ mt: -6, mb: 2 }}>
    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
      <IconButton
        onClick={() => navigate(-1)}
        sx={{
          mr: 2,
          borderRadius: 8,
          color: theme.palette.text.primary,
          backgroundColor: mode === "dark" ? "#f1f1f111" : "#e0e0e071",
          '&:hover': { backgroundColor: "#f1f1f121" },
        }}
      >
        <ArrowBack />
      </IconButton>
      <Typography variant="h5" fontWeight="bold">
        General Settings
      </Typography>
    </Box>

    <List sx={{ mt: 2 }}>

  <ListItem sx={{ pb: 0 }}>
      <ListItemIcon sx={{ minWidth: 40 }}><Brightness4Icon sx={{ color: theme.palette.text.secondary }} /></ListItemIcon>
      <ListItemText primary="Theme" primaryTypographyProps={{ fontWeight: 'medium' }} />
      <FormControl size="small" sx={{ minWidth: 120 }}>
<Select
  value={mode}
  onChange={(e) => {
    const newTheme = e.target.value;
    setMode(newTheme);
  }}
  sx={{
    bgcolor: mode === "dark" ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)",
    borderRadius: 2,
    border: mode === "dark" ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(0,0,0,0.1)",
    boxShadow: mode === "dark" ? "0 4px 12px rgba(0,0,0,0.3)" : "0 4px 12px rgba(0,0,0,0.1)",
    transition: "all 0.3s ease",
    '&:hover': {
      bgcolor: mode === "dark" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)",
      boxShadow: mode === "dark" ? "0 4px 16px rgba(255,255,255,0.1)" : "0 4px 16px rgba(0,0,0,0.2)",
    },
    '& .MuiSelect-select': {
      p: 1.5,
      display: 'flex',
      alignItems: 'center',
      gap: 1,
    },
    '& .MuiSvgIcon-root': {
      color: theme.palette.text.secondary,
    },
  }}
  MenuProps={{
    PaperProps: {
      sx: {
        bgcolor: mode === "dark" ? "rgba(26, 26, 26, 0.8)" : "rgba(255, 255, 255, 0.8)",
        backdropFilter: "blur(10px)",
        borderRadius: 2,
        boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
        p: 1,
      },
    },
  }}
>
  <MenuItem
    value="system"
    sx={{
      borderRadius: 1.5,
      transition: "background-color 0.2s ease, transform 0.2s ease",
      '&:hover': {
        bgcolor: mode === "dark" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)",
        transform: "scale(1.02)",
      },
    }}
  >
    <ListItemIcon><Settings fontSize="small" /></ListItemIcon>
    System
  </MenuItem>

  <MenuItem
    value="light"
    sx={{
      borderRadius: 1.5,
      transition: "background-color 0.2s ease, transform 0.2s ease",
      '&:hover': {
        bgcolor: mode === "dark" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)",
        transform: "scale(1.02)",
      },
    }}
  >
    <ListItemIcon><WbSunnyOutlined fontSize="small" /></ListItemIcon>
    Light
  </MenuItem>

  <MenuItem
    value="dark"
    sx={{
      borderRadius: 1.5,
      transition: "background-color 0.2s ease, transform 0.2s ease",
      '&:hover': {
        bgcolor: mode === "dark" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)",
        transform: "scale(1.02)",
      },
    }}
  >
    <ListItemIcon><DarkModeOutlinedIcon fontSize="small" /></ListItemIcon>
    Dark
  </MenuItem>
</Select>
      </FormControl>
  </ListItem>

  <ListItem sx={{ pb: 0 }}>
    <ListItemButton onClick={() => setAccentDrawerOpen(true)} sx={{ borderRadius: 3, py: 1.5, px: 0, '&:hover': { bgcolor: mode === "dark" ? '#f1f1f121' : '#e7e7e788' } }}>
      <ListItemIcon sx={{ minWidth: 40 }}><PaletteOutlinedIcon sx={{ color: theme.palette.text.secondary }} /></ListItemIcon>
      <ListItemText primary="Accent Color" secondary={accent.charAt(0).toUpperCase() + accent.slice(1)} primaryTypographyProps={{ fontWeight: 'medium' }} secondaryTypographyProps={{ variant: 'body2', color: 'text.secondary', noWrap: true }} />
    </ListItemButton>
  </ListItem>

  <ListItem sx={{ pb: 0 }}>
    <ListItemButton onClick={(e) => setLocationAnchorEl(e.currentTarget)} sx={{ borderRadius: 3, py: 1.5, px: 0, '&:hover': { bgcolor: mode === "dark" ? '#f1f1f121' : '#e7e7e788' } }}>
      <ListItemIcon sx={{ minWidth: 40 }}><LocationOnOutlinedIcon sx={{ color: theme.palette.text.secondary }} /></ListItemIcon>
      <ListItemText primary="Location" secondary={settings.locationMode === 'auto'  ? weather?.name || 'Auto'  :  settings.manualLocation || 'Manual'} primaryTypographyProps={{ fontWeight: 'medium' }} secondaryTypographyProps={{ variant: 'body2', color: 'text.secondary', noWrap: true }} />
    </ListItemButton>
    <FormControl size="small" sx={{ minWidth: 120 }}>
<Select
  value={settings.locationMode}
  onChange={(e) => {
    const newMode = e.target.value;
    handleLocationModeChange({ target: { checked: newMode === 'auto' } });
  }}
  sx={{
    bgcolor: mode === "dark" ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)",
    borderRadius: 2,
    border: mode === "dark" ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(0,0,0,0.1)",
    boxShadow: mode === "dark" ? "0 4px 12px rgba(0,0,0,0.3)" : "0 4px 12px rgba(0,0,0,0.1)",
    transition: "all 0.3s ease",
    '&:hover': {
      bgcolor: mode === "dark" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)",
      boxShadow: mode === "dark" ? "0 4px 16px rgba(255,255,255,0.1)" : "0 4px 16px rgba(0,0,0,0.2)",
    },
    '& .MuiSelect-select': {
      p: 1.5,
      display: 'flex',
      alignItems: 'center',
      gap: 1,
    },
    '& .MuiSvgIcon-root': {
      color: theme.palette.text.secondary,
    },
  }}
  MenuProps={{
    PaperProps: {
      sx: {
        bgcolor: mode === "dark" ? "rgba(26, 26, 26, 0.8)" : "rgba(255, 255, 255, 0.8)",
        backdropFilter: "blur(10px)",
        borderRadius: 2,
        boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
        p: 1,
      },
    },
  }}
>
  <MenuItem
    value="auto"
    sx={{
      borderRadius: 1.5,
      transition: "background-color 0.2s ease, transform 0.2s ease",
      '&:hover': {
        bgcolor: mode === "dark" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)",
        transform: "scale(1.02)",
      },
    }}
  >
    <MyLocationOutlinedIcon fontSize="small" sx={{ mr: 1 }} />
    Auto
  </MenuItem>

  <MenuItem
    value="manual"
    sx={{
      borderRadius: 1.5,
      transition: "background-color 0.2s ease, transform 0.2s ease",
      '&:hover': {
        bgcolor: mode === "dark" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)",
        transform: "scale(1.02)",
      },
    }}
  >
    <EditLocationOutlined fontSize="small" sx={{ mr: 1 }} />
    Manual
  </MenuItem>
</Select>
    </FormControl>
  </ListItem>

<ListItem sx={{ pb: 0 }}>
  <ListItemButton
    sx={{
      borderRadius: 3,
      py: 1.5,
      px: 0,
      "&:hover": {
        bgcolor: mode === "dark" ? "#f1f1f121" : "#e7e7e788",
      },
    }}
  >
<BackgroundToggle />
  </ListItemButton>
</ListItem>

    </List>

    {settings.locationMode === "manual" && (
      <Box sx={{ px: 2, mt: 3 }}>
        <TextField
          label="Set Location Manually"
          value={settings.manualLocation}
          onChange={handleManualLocationChange}
          fullWidth
          variant="outlined"
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 3,
            },
          }}
        />
      </Box>
    )}

    <SwipeableDrawer
      anchor="bottom"
      open={accentDrawerOpen}
      onClose={() => setAccentDrawerOpen(false)}
      onOpen={() => setAccentDrawerOpen(true)}
      PaperProps={{ sx: { borderTopLeftRadius: 16, borderTopRightRadius: 16 } }}
    >
      <Box sx={{ p: 2 }}>
        <Box sx={{ width: 40, height: 5, bgcolor: 'grey.400', borderRadius: 3, mx: 'auto', mb: 2 }}/>
        <Typography variant="h6" fontWeight="bold" textAlign="center" sx={{ mb: 2 }}>
          Accent Color
        </Typography>

        <Button
            variant={"contained"}
            fullWidth
            sx={{
                borderRadius: 4, px: 3, py: 1.2, fontWeight: 600, fontSize: "1rem",
                height: 50, backgroundColor: theme.palette.primary.bg, boxShadow: "none",
                mb: 3, color: theme.palette.primary.maintxt,
                '&:hover': { backgroundColor: theme.palette.primary.bg }
            }}
        >
            This is the Accent Preview
        </Button>
        
        <Box sx={{ display: "flex", justifyContent: "center", gap: 2, flexWrap: "wrap", width: 340, mx: "auto" }}>
            {[
                { opt: "blue", bg: "#bbdefb" }, { opt: "green", bg: "#c8e6c9" },
                { opt: "orange", bg: "#FFCC80" }, { opt: "turquoise", bg: "#b6f6ff" },
                { opt: "skyblue", bg: "#81D4FA" }, { opt: "gray", bg: "#808080" },
                { opt: "yellow", bg: "#FFF59D" }, { opt: "coral", bg: "#FFAB91" },
                { opt: "aqua", bg: "#80CBC4" }, { opt: "red", bg: "#E57373" },
            ].map(({ opt, bg }) => (
                <Button
                    key={opt}
                    onClick={() => setAccent(opt)}
                    variant={"contained"}
                    sx={{
                        borderRadius: 999, minWidth: 35, minHeight: 35, backgroundColor: bg,
                        border: accent === opt ? "2px solid" : "2px solid",
                        borderColor: accent === opt ? theme.palette.text.primary : "transparent",
                        boxShadow: "none",
                        '&:hover': { backgroundColor: bg }
                    }}
                />
            ))}
        </Box>
      </Box>
    </SwipeableDrawer>
  </Container>
)}

{drawerPage === "about" && (
  <Container
    sx={{
      mt: -6,
      mb: 5,
      maxWidth: 700,
      borderRadius: 6,
    }}
  >
    <Button
      startIcon={<ArrowBack />}
      onClick={() => navigate(-1)}
      sx={{
        mb: 3,
        borderRadius: 8,
        color: theme.palette.text.primary,
        background: alpha(theme.palette.primary.main, 0.08),
        "&:hover": {
          background: alpha(theme.palette.primary.main, 0.16),
          transform: "translateX(-2px)",
        },
        transition: "all 0.25s ease",
      }}
    >
      Back
    </Button>

    <Box
      sx={{
        position: "relative",
        height: 220,
        borderRadius: 6,
        overflow: "hidden",
        mb: 4,
        backgroundImage:
          "url(/assets/images/headers/beta_v2_header.svg)",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    />

    <Typography
      variant="h4"
      fontWeight="700"
      sx={{
        mb: 1,
        textAlign: "left",
        color: theme.palette.text.primary,
      }}
    >
      About BunkMates
    </Typography>

    <Typography
      variant="body2"
      align="left"
      sx={{ color: theme.palette.text.secondary, mb: 4 }}
    >
      Version info, policies, and how to reach us 🌍
    </Typography>

<Button
  onClick={() => handleSetDrawerPage("appInfo")}
  fullWidth
  variant="contained"
  endIcon={
    <ArrowForwardIos
      sx={{
        fontSize: 26,
        transition: "transform 0.3s ease",
      }}
    />
  }
  sx={{
    mb: 3,
    py: 1.6,
    px: 2,
    borderRadius: 4,
    textTransform: "none",
    justifyContent: "space-between",
    fontWeight: 600,
    fontSize: "1rem",
    color: theme.palette.text.primary,
    background: mode === "dark"
      ? "linear-gradient(145deg, rgba(255,255,255,0.08), rgba(255,255,255,0.04))"
      : "linear-gradient(145deg, rgba(0,0,0,0.05), rgba(0,0,0,0.02))",
    boxShadow: "none",
    backdropFilter: "blur(10px)",
    WebkitBackdropFilter: "blur(10px)",
    border: `1px solid ${alpha(theme.palette.primary.main, 0.15)}`,
    transition: "all 0.35s ease",
    "&:hover": {
      background: mode === "dark"
        ? "linear-gradient(145deg, rgba(255,255,255,0.15), rgba(255,255,255,0.08))"
        : "linear-gradient(145deg, rgba(0,0,0,0.08), rgba(0,0,0,0.03))",
      transform: "translateY(-3px) scale(1.02)",
      boxShadow: "none",
      "& .MuiButton-startIcon": {
        transform: "translateX(2px)",
      },
      "& .MuiButton-endIcon": {
        transform: "translateX(3px)",
      },
    },
  }}
>
  <Box
    sx={{ display: "flex", alignItems: "center", gap: 2 }}
  >
    <LayersOutlined
        sx={{
          fontSize: 24,
          transition: "transform 0.3s ease",
        }}
      />
    App Info
  </Box>
</Button>

    <Typography
      variant="body1"
      sx={{
        mb: 4,
        color: theme.palette.text.secondary,
        lineHeight: 1.7,
        textAlign: "justify",
      }}
    >
      BunkMates is built to simplify your group travel — from planning and
      chatting to managing expenses, tasks, and exploring destinations
      together. Designed for smooth adventures and lasting memories. 🌄
      <br />
      <br />
      Built with ❤️ in India.
    </Typography>

    <Box sx={{ mb: 4 }}>
      <Typography
        variant="h6"
        fontWeight="600"
        sx={{ mb: 1.5, color: theme.palette.text.primary }}
      >
        Legal & Policy
      </Typography>

      {[
        {
          label: "Privacy Policy",
          link: "/privacy-policy",
        },
        {
          label: "Terms of Service",
          link: "/terms",
        },
      ].map((item, i) => (
        <Button
          key={i}
          fullWidth
          variant="contained"
          sx={{
            mb: 1.5,
            py: 1.3,
            borderRadius: 3,
            textTransform: "none",
            background: alpha(theme.palette.primary.main, 0.08),
            color: theme.palette.text.primary,
            boxShadow: "none",
            "&:hover": {
              background: alpha(theme.palette.primary.main, 0.16),
              transform: "translateY(-2px)",
            },
            transition: "all 0.25s ease",
          }}
          onClick={() => window.open(item.link, "_blank")}
        >
          {item.label}
        </Button>
      ))}
    </Box>

    <Box sx={{ mb: 4 }}>
      <Typography
        variant="h6"
        fontWeight="600"
        sx={{ mb: 1.5, color: theme.palette.text.primary }}
      >
        Connect With Us
      </Typography>
      <Stack direction="row" spacing={2}>
        {[
          {
            icon: <Mail />,
            action: () => window.open("mailto:team.bunkmates@gmail.com"),
          },
          {
            icon: <Instagram />,
            action: () =>
              window.open("https://www.instagram.com/bunkmates.app", "_blank"),
          },
          {
            icon: <YouTube />,
            action: () =>
              window.open("https://www.youtube.com/@Team_BunkMates", "_blank"),
          },
        ].map((social, idx) => (
          <Button
            key={idx}
            variant="contained"
            onClick={social.action}
            sx={{
              background: alpha(theme.palette.primary.main, 0.08),
              color: theme.palette.text.primary,
              minWidth: 52,
              minHeight: 52,
              borderRadius: "50%",
              boxShadow: "none",
              p: 1.5,
              "&:hover": {
                background: alpha(theme.palette.primary.main, 0.16),
                transform: "scale(1.1)",
              },
              transition: "all 0.25s ease",
            }}
          >
            {social.icon}
          </Button>
        ))}
      </Stack>
    </Box>

    <Box
      sx={{
        mt: 5,
        p: 3,
        borderRadius: 5,
        background: alpha(theme.palette.background.paper, 0.4),
        border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
      }}
    >
      <Typography
        variant="h6"
        fontWeight="600"
        sx={{ mb: 1, color: theme.palette.text.primary }}
      >
        Open Source
      </Typography>
      <Typography
        variant="body2"
        sx={{ color: theme.palette.text.secondary, mb: 2 }}
      >
        Our source code will be available soon on GitHub. Stay tuned for the
        launch!
      </Typography>
      <Button
        variant="outlined"
        fullWidth
        sx={{
          borderRadius: 3,
          borderColor: alpha(theme.palette.text.primary, 0.4),
          color: theme.palette.text.primary,
          "&:hover": {
            borderColor: theme.palette.primary.main,
            color: theme.palette.primary.main,
          },
        }}
      >
        Coming Soon...
      </Button>
    </Box>
  </Container>
)}

{drawerPage === "appInfo" && (
  <Container
    sx={{
      mt: -6,
      mb: 3,
      px: { xs: 2, sm: 3 },
      animation: "fadeIn 0.4s ease-in-out",
      "@keyframes fadeIn": { from: { opacity: 0 }, to: { opacity: 1 } },
    }}
  >
        <>
          <Box sx={{ display: "flex", alignItems: "center", mb: 4 }}>
            <IconButton
              onClick={() => navigate(-1)}
              sx={{
                mr: 2,
                borderRadius: 8,
                p: 1,
                color: theme.palette.text.primary,
                backgroundColor: mode === "dark" ? "#ffffff10" : "#e0e0e060",
                transition: "all 0.2s ease",
                "&:hover": {
                  backgroundColor:
                    mode === "dark"
                      ? "#ffffff20"
                      : alpha(theme.palette.primary.main, 0.1),
                  transform: "scale(1.05)",
                },
              }}
            >
              <ArrowBack />
            </IconButton>
            <Typography variant="h5" fontWeight="700">
              App Info
            </Typography>
          </Box>

          <Box sx={{ textAlign: "center", mb: 5 }}>
            <Avatar
              alt="BunkMates Logo"
              src="/logo512.png"
              sx={{
                width: 140,
                height: 140,
                mx: "auto",
                mb: 2,
                borderRadius: "20%",
                boxShadow: "none",
              }}
            />

            <Typography
              variant="h5"
              fontWeight="700"
              sx={{ color: theme.palette.text.primary }}
            >
              BunkMates
            </Typography>
            <Typography
              variant="body2"
              sx={{ color: theme.palette.text.secondary, mt: 0.5 }}
            >
              Bunk The Chaos, Keep The Fun!
            </Typography>
                    {isDeveloper && (
          <Box
            sx={{
              mt: 2,
              display: "inline-flex",
              alignItems: "center",
              gap: 1,
              px: 1.6,
              py: 0.6,
              borderRadius: 2,
              fontSize: "0.8rem",
              fontWeight: 600,
              background:
                mode === "dark"
                  ? alpha(theme.palette.primary.main, 0.15)
                  : alpha(theme.palette.primary.main, 0.1),
              color: theme.palette.primary.main,
              boxShadow: theme.shadows[1],
              animation: "fadeInBadge 0.6s ease-in-out",
              "@keyframes fadeInBadge": {
                from: { opacity: 0, transform: "translateY(8px)" },
                to: { opacity: 1, transform: "translateY(0)" },
              },
              mx: "auto",
            }}
          >
            🧑‍💻 Developer Mode Active
          </Box>
        )}
          </Box>

          <Box
            sx={{
              borderRadius: 4,
              p: 2.5,
              mb: 3,
              backgroundColor:
                mode === "dark"
                  ? "#ffffff08"
                  : alpha(theme.palette.primary.main, 0.02),
              boxShadow: theme.shadows[1],
            }}
          >
            <List disablePadding>
              <ListItem disableGutters sx={{ py: 0.5 }}>
                <ListItemText
                  primary="App Version"
                  secondary="1.0.31"
                  primaryTypographyProps={{
                    fontWeight: 500,
                    color: theme.palette.text.secondary,
                  }}
                  secondaryTypographyProps={{
                    color: theme.palette.text.primary,
                    fontWeight: 600,
                  }}
                />
              </ListItem>

<ListItem
  disableGutters
  sx={{
    py: 0.5,
    transition: "all 0.2s ease",
    "&:active": { transform: "scale(0.98)" },
  }}
  onClick={handleBuildTap}
>
  <ListItemText
    primary="Build ID"
    secondary={packageJson.version || "N/A"}
    primaryTypographyProps={{
      fontWeight: 500,
      color: theme.palette.text.secondary,
    }}
    secondaryTypographyProps={{
      color: theme.palette.text.primary,
      fontWeight: 600,
    }}
  />
</ListItem>

              <ListItem disableGutters sx={{ py: 0.5 }}>
                <ListItemText
                  primary="Developer"
                  secondary="Team BunkMates"
                  primaryTypographyProps={{
                    fontWeight: 500,
                    color: theme.palette.text.secondary,
                  }}
                  secondaryTypographyProps={{
                    color: theme.palette.text.primary,
                    fontWeight: 600,
                  }}
                />
              </ListItem>
            </List>
          </Box>

          {isDeveloper && (
            <ListItem
              disablePadding
              sx={{
                borderRadius: 3,
                overflow: "hidden",
                mb: 1,
                backgroundColor:
                  mode === "dark"
                    ? "#ffffff08"
                    : alpha(theme.palette.primary.main, 0.02),
              }}
            >
              <ListItemButton
                onClick={() => handleSetDrawerPage("developers")}
                sx={{
                  py: 1.7,
                  "&:hover": {
                    bgcolor: alpha(theme.palette.primary.main, 0.08),
                    transition: "all 0.2s ease",
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>
                  <LayersOutlined
                    sx={{ color: theme.palette.text.secondary }}
                  />
                </ListItemIcon>
                <ListItemText
                  primary="Testing Features & Other Routes"
                  primaryTypographyProps={{ fontWeight: 500 }}
                />
                <ArrowForwardIos
                  sx={{ color: theme.palette.text.secondary }}
                />
              </ListItemButton>
            </ListItem>
          )}

          <ListItem
            disablePadding
            sx={{
              borderRadius: 3,
              overflow: "hidden",
              mb: 1,
              backgroundColor:
                mode === "dark"
                  ? "#ffffff08"
                  : alpha(theme.palette.primary.main, 0.02),
            }}
          >
            <ListItemButton
              onClick={() => handleSetDrawerPage("featuresChangelog")}
              sx={{
                py: 1.7,
                "&:hover": {
                  bgcolor: alpha(theme.palette.primary.main, 0.08),
                  transition: "all 0.2s ease",
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>
                <InfoOutlined sx={{ color: theme.palette.text.secondary }} />
              </ListItemIcon>
              <ListItemText
                primary="Third-Party Licenses & Attributions"
                primaryTypographyProps={{ fontWeight: 500 }}
              />
              <ArrowForwardIos sx={{ color: theme.palette.text.secondary }} />
            </ListItemButton>
          </ListItem>

          <Typography
            variant="caption"
            align="center"
            sx={{
              display: "block",
              mt: 5,
              color: theme.palette.text.disabled,
            }}
          >
            © {new Date().getFullYear()} BunkMates. All rights reserved.
          </Typography>
        </>
  </Container>
)}

{drawerPage === "featuresChangelog" && (
  <Container sx={{ mt: -6, mb: 2 }}>
    <Button
      startIcon={<ArrowBack />}
      onClick={() => navigate(-1)}
      sx={{
        mb: 2,
        borderRadius: 8,
        color: theme.palette.text.primary,
        backgroundColor: mode === "dark" ? "#f1f1f111" : "#e0e0e071",
        "&:hover": { backgroundColor: "#f1f1f121" },
      }}
    >
      Back
    </Button>

    <Typography variant="h5" gutterBottom>
      <h2>Third-Party Licenses & Attributions</h2>
    </Typography>

    <Typography
      variant="body1"
      sx={{
        color: mode === "dark" ? "#ccc" : "#444",
        mb: 4,
        lineHeight: 1.7,
      }}
    >
      This page lists all open-source and third-party libraries used in
      <strong> BunkMates</strong>, along with their license types and
      attributions. We ensure full compliance by including the necessary license
      text, copyright notices, and usage terms for every component.
    </Typography>

    <Box sx={{ mb: 4 }}>
      <Typography
        variant="h6"
        gutterBottom
        sx={{ color: mode === "dark" ? "#fff" : "#111" }}
      >
        Library Overview
      </Typography>
      {libraries.map((lib, idx) => (
        <Box key={idx} sx={{ mb: 1.2, ml: 2 }}>
          <Typography
            variant="subtitle1"
            fontWeight="bold"
            sx={{ color: mode === "dark" ? "#fff" : "#000" }}
          >
            {lib.name}
          </Typography>
          <Typography
            variant="body2"
            sx={{ color: mode === "dark" ? "#aaa" : "#333" }}
          >
            {lib.functionality} — {lib.license}
          </Typography>
        </Box>
      ))}
    </Box>

    <Divider sx={{ my: 3, borderColor: "rgba(255,255,255,0.1)" }} />

    <Box>
      {licenseSections.map((sec, idx) => (
        <Box key={idx} sx={{ mb: 4 }}>
          <Typography
            variant="h6"
            fontWeight="bold"
            sx={{
              color: mode === "dark" ? "#fff" : "#111",
              mb: 1.5,
            }}
          >
            {sec.title}
          </Typography>
          <Typography
            variant="body1"
            sx={{
              color: mode === "dark" ? "#ccc" : "#444",
              mb: sec.details ? 1.5 : 0,
              lineHeight: 1.7,
            }}
          >
            {sec.description}
          </Typography>

          {sec.details && (
            <ul style={{ paddingLeft: 22, marginTop: 6 }}>
              {sec.details.map((item, i) => (
                <li key={i}>
                  <Typography
                    variant="body2"
                    sx={{
                      color: mode === "dark" ? "#aaa" : "#333",
                      lineHeight: 1.6,
                    }}
                  >
                    {item}
                  </Typography>
                </li>
              ))}
            </ul>
          )}
        </Box>
      ))}
    </Box>

    <Typography
      variant="body2"
      sx={{
        mt: 5,
        textAlign: "center",
        color: mode === "dark" ? "#777" : "#666",
        fontStyle: "italic",
      }}
    >
      End of Statement — © {new Date().getFullYear()} BunkMates. All rights
      reserved.
    </Typography>
  </Container>
)}

{drawerPage === "support" && (
  <Container sx={{ mt: -6, mb: 2 }}>
    <Button
      startIcon={<ArrowBack />}
      onClick={() => navigate(-1)}
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
    <Card
      onClick={() => window.open("/terms-and-conditions", "_blank")}
      sx={{ px: 2, py: 1, backgroundColor: mode === "dark" ? "#f1f1f111" : "#e0e0e071",  boxShadow: "none", borderRadius: 5 }}
    >
      <ListItemText
        primary="Terms & Conditions"
        secondary="Terms of service and usage policies"
      />
    </Card>
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
        window.open("/community", "_blank");
      }}
      sx={{ fontWeight: "bold", textTransform: "none", mb: 3, borderRadius: 3, backgroundColor: mode === "dark" ? '#f1f1f131' : "#0c0c0c10", color: theme.palette.text.primary, border: 'transparent', boxShadow: 'none' }}
    >
      Visit Our Community
    </Button>
  </Container>
)}

{drawerPage === "profile" && (
  <Container sx={{ mt: -6, mb: 3 }}>
<Box
  sx={{
    position: "sticky",
    top: 50,
    zIndex: 40,
    mt: -10,

    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",

    mb: 3,
    py: 0.6,
    px: 0,
    mx: -1.5,

    background: "transparent",

    isolation: "isolate",
  }}
>
  {!isEditing ? (
    <>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          flexDirection: "row",
          zIndex: 20,
        }}
      >
        <IconButton
          onClick={() => navigate(-1)}
          sx={{
            mr: 1,
            p: 1.3,
            borderRadius: 8,
            color: theme.palette.text.primary,
            backgroundColor:
              mode === "dark" ? "#f1f1f100" : "#e0e0e000",
            backdropFilter: "blur(6px)",
            WebkitBackdropFilter: "blur(6px)",

            boxShadow:
              mode === "dark"
                ? "inset 0 2px 6px rgba(255, 255, 255, 0.2), inset 0 -4px 10px rgba(255, 255, 255, 0.2)"
                : "inset 0 2px 6px rgba(0, 0, 0, 0.2), inset 0 -4px 10px rgba(0, 0, 0, 0.2)",

            "&:hover": {
              backgroundColor: "#f1f1f121",
            },
          }}
        >
          <ArrowBack />
        </IconButton>

        {userData.type && (
          <Typography
            variant="h6"
            fontWeight="bold"
            sx={{
              background: "transparent",
              px: 1.5,
              py: 0.8,
              borderRadius: 12,
              backdropFilter: "blur(6px)",
              WebkitBackdropFilter: "blur(6px)",

              boxShadow:
                mode === "dark"
                  ? "inset 0 2px 6px rgba(255, 255, 255, 0.2), inset 0 -4px 10px rgba(255, 255, 255, 0.2)"
                  : "inset 0 2px 6px rgba(0, 0, 0, 0.2), inset 0 -4px 10px rgba(0, 0, 0, 0.2)",
            }}
          >
            {userData.type || "Profile"}
          </Typography>
        )}
      </Box>

      <IconButton
        color="primary"
        onClick={() => setIsEditing(true)}
        sx={{
          p: 1.3,
          zIndex: 20,
          borderRadius: 5,
          bgcolor: "transparent",
          backdropFilter: "blur(6px)",
          WebkitBackdropFilter: "blur(6px)",

          boxShadow:
            mode === "dark"
              ? "inset 0 2px 6px rgba(255, 255, 255, 0.2), inset 0 -4px 10px rgba(255, 255, 255, 0.2)"
              : "inset 0 2px 6px rgba(0, 0, 0, 0.2), inset 0 -4px 10px rgba(0, 0, 0, 0.2)",

          "&:hover": {
            bgcolor: "primary.dark",
          },

          color: mode === "dark" ? "white" : "black",
        }}
      >
        <Edit3 size={22} />
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
<Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", flexDirection: "column", mb: 5 }}>
  <Box
    sx={{
      position: "relative",
      mb: 2,
    }}
  >
    <Avatar
      src={userData.photoURL || ""}
      alt={userData.name}
      sx={{ 
        width: 180, 
        height: 180, 
        mb: 2, 
        borderRadius: 12, 
        boxShadow: 3,
        cursor: 'pointer',
        transition: 'transform 0.2s ease-in-out',
        '&:hover': {
          transform: 'scale(1.05)',
        }
      }}
      onClick={() => setProfilePicOpen(true)}
    />
    
    <Button
      component="label"
      sx={{
        position: "absolute", bottom: 23, right: 8, width: 46, height: 46,
        borderRadius: "43px 10px", border: "none",
        backgroundColor: mode === "dark" ? "#000000a1" : "#ffffffff",
        backdropFilter: "blur(30px)", display: "flex", alignItems: "center",
        justifyContent: "center", color: mode === "dark" ? "#ffffff86" : "#000000ff",
        transition: "opacity 0.3s ease", fontSize: 12,
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
        borderColor: theme.palette.primary.maintxt,
        color: theme.palette.primary.maintxt,
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
        boxShadow: 0,
        backgroundColor: theme.palette.primary.main,
        '&:hover': { boxShadow: 0, backgroundColor: theme.palette.primary.dark },
      }}
    >
      Save Changes
    </Button>
  </Box>
</>

    ) : (
      <>

  <Box sx={{ display: "flex", opacity: profilePicOpen ? 0 : 1, flexDirection: "column", alignItems: "center", mb: 3, position: "relative" }}>
<Box
  sx={{
    position: "relative",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    mx: 0,
    mt: -15,  
    px: 4,
    py: 4,
    maxHeight: 500,
    height: "100%",
    maxWidth: 540,
    width: "100%",
  }}
>

  <Box
    component="img"
    src={userData.photoURL || ""}
    alt="background"
    sx={{
      height: "100%",
      objectFit: "cover",
      display: "block",
      maxWidth: "100vw",
      width: "calc(100% + 40px)",
      position: "absolute",
            maskImage:
        "linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0.85) 20%, rgba(0,0,0,0.55) 55%, rgba(0,0,0,0.15) 80%, rgba(0,0,0,0) 100%)",

      WebkitMaskImage:
        "linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0.85) 20%, rgba(0,0,0,0.55) 55%, rgba(0,0,0,0.15) 80%, rgba(0,0,0,0) 100%)",
    }}
  />

<Box
  sx={{
    position: "relative",
    zIndex: 5,
    textAlign: "center",
    width: "100%",
    mt: 36,
  }}
>
  <Box
    sx={{
      background:"transparent",
      border:"none",
    }}
  >
    <Typography
      variant="h6"
      sx={{
        fontWeight: 700,
        color: "#fff",
        letterSpacing: 0.3,
      }}
    >
      {userData.name || "Username"}
    </Typography>

    <Typography
      variant="body2"
      sx={{
        color: "rgba(255,255,255,0.68)",
        fontSize: "0.9rem",
        mt: 0.3,
      }}
    >
      @{userData.username || "username"}
    </Typography>

{(userData.type === "Beta" || userData.type === "Dev Beta") && (
  <Box
    sx={{
      mt: 3,
      mb: 3,

      overflow: "hidden",
      position: "relative",

      background:"transparent",

      backdropFilter: "blur(0px)",
      WebkitBackdropFilter: "blur(0px)",

      border:"none",

      boxShadow:"none",

      px: 0,
      py: 0,
    }}
  >
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        mb: 2.5,
        position: "relative",
        zIndex: 2,
      }}
    >
      <Box>
        <Typography
          variant="subtitle1"
          sx={{
            fontWeight: 700,
            color: theme.palette.text.primary,
            letterSpacing: 0.3,
            textAlign: "left"
          }}
        >
          Beta Statistics
        </Typography>

        <Typography
          variant="caption"
          sx={{
            color: theme.palette.text.secondary,
            opacity: 0.75,
            textAlign: "left"
          }}
        >
          Your testing contribution
        </Typography>
      </Box>

      <Box
        sx={{
          px: 1.4,
          py: 0.5,
          borderRadius: "999px",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",

          background:
            mode === "dark"
              ? "rgba(255,255,255,0.06)"
              : "rgba(255,255,255,0.35)",

          border:
            mode === "dark"
              ? "1px solid rgba(255,255,255,0.06)"
              : "1px solid rgba(255,255,255,0.25)",
        }}
      >
        <Typography
          variant="caption"
          sx={{
            fontWeight: 600,
            color: theme.palette.text.secondary,
          }}
        >
          {userData.type}
        </Typography>
      </Box>
    </Box>

    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: 1.2,
        position: "relative",
        zIndex: 2,
      }}
    >
      {[
        {
          label: "Feedbacks",
          value: feedbackCount,
        },
        {
          label: "Issues",
          value: issuesCount,
        },
        {
          label: "Reports",
          value: reportsCount,
        },
      ].map((item) => (
        <Box
          key={item.label}
          sx={{
            textAlign: "center",
            borderRadius: "18px",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
            py: 2,

            background:
              mode === "dark"
                ? "rgba(255,255,255,0.04)"
                : "rgba(255,255,255,0.25)",


            border:
              mode === "dark"
                ? "1px solid rgba(255,255,255,0.05)"
                : "1px solid rgba(255,255,255,0.2)",

            transition: "all 0.25s ease",

            "&:hover": {
              transform: "translateY(-2px)",
              background:
                mode === "dark"
                  ? "rgba(255,255,255,0.07)"
                  : "rgba(255,255,255,0.35)",
            },
          }}
        >
          <Typography
            sx={{
              fontSize: "1.3rem",
              fontWeight: 700,
              color: theme.palette.text.primary,
              lineHeight: 1,
            }}
          >
            {item.value}
          </Typography>

          <Typography
            variant="caption"
            sx={{
              mt: 0.5,
              display: "block",
              color: theme.palette.text.secondary,
              fontWeight: 500,
            }}
          >
            {item.label}
          </Typography>
        </Box>
      ))}
    </Box>
  </Box>
)}
  </Box>
</Box>
</Box>


  </Box>

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
          <Logout sx={{ color: mode === "dark" ? "#ffe6e6ff" : "#ff0000ff" }} />
        </ListItemIcon>
        <Typography sx={{ color: mode === "dark" ? "#ffe6e6ff" : "#ff0000ff" }}>Logout</Typography>
      </ListItemButton>
    </Box>

      </>
    )}

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
      height: 20,
      width: 35,
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

<Dialog
  fullScreen
  open={profilePicOpen}
  onClose={() => {
    setProfilePicOpen(false);
  }}
  PaperProps={{
    sx: {
      backgroundColor: "rgba(0,0,0,0.05)",
      backdropFilter: "blur(12px)",
      overflow: "hidden",
      backgroundImage: "none",
    },
  }}
>
  <Box
    sx={{
      position: "relative",
      height: "100%",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      p: 3,
    }}
    onClick={() => setProfilePicOpen(false)}
  >
    <Box
      sx={{
        flexGrow: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
      }}
    >
      {viewMode === "avatar" && (
        <Zoom in={profilePicOpen} style={{ transitionDelay: "100ms" }}>
          <Box sx={{ position: "relative", display: "inline-flex" }}>
            <Avatar
              src={userData.photoURL || ""}
              alt={userData.name}
              onClick={(e) => e.stopPropagation()}
              sx={{
                width: "min(250px, 90vw)",
                height: "min(250px, 90vw)",
                borderRadius: 56,
                cursor: "default",
                boxShadow: "none",
                transition: "transform 0.4s ease, box-shadow 0.4s ease",
                "&:hover": {
                  transform: "scale(1.05)",
                  boxShadow: "none",
                },
              }}
            />
            <IconButton
              size="small"
              component="label"
              sx={{
                position: "absolute",
                bottom: 18,
                right: 18,
                backgroundColor: "rgba(255,255,255,0.1)",
                backdropFilter: "blur(10px)",
                border: "1px solid rgba(255,255,255,0.2)",
                color: "white",
                "&:hover": { backgroundColor: "rgba(255,255,255,0.25)" },
              }}
            >
              <PersonOutline fontSize="small" />
              <input
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => {
                  if (e.target.files?.length) {
                    const file = e.target.files[0];
                    setSelectedImage(URL.createObjectURL(file));
                    setCropDrawerOpen(true);
                  }
                }}
              />
            </IconButton>
          </Box>
        </Zoom>
      )}

      {viewMode === "qr" && (
        <Zoom in={profilePicOpen}>
          <Card
            id="profile-card"
            onClick={(e) => e.stopPropagation()}
            sx={{
              width: "100%",
              maxWidth: 300,
              bgcolor:"transparent",
              borderRadius: 6,
              p: 3,
              textAlign: "center",
              boxShadow: "none",
              backgroundImage: "none",
            }}
          >
        <Box>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Avatar src={userData.photoURL} sx={{ width: 80, height: 80, mb: -5, zIndex: 2, border: mode === "dark" ? '4px solid #0c0c0c21' : '4px solid #FFFFFF71' }} />
            <Card sx={{ width: '100%', backdropFilter: "blur(50px)", bgcolor: mode === "dark" ? '#0c0c0cae' : '#FFFFFF71', borderRadius: 6, p: 3, pt: 7, textAlign: 'center', boxShadow: "none" }}>
              <Box sx={{ display: "flex", flexDirection: 'column' }}>
                <Typography variant="h5" fontWeight="bold" sx={{ color: theme.palette.text.primary }}>{userData.name}</Typography>
                <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>@{userData.username}</Typography>
              </Box>
              <Box sx={{ bgcolor: 'white', p: 2, borderRadius: 3, display: 'inline-block', mb: 2, mt: 3 }}>
                <QRCodeSVG value={auth.currentUser?.uid || "default-user-id"} size={200} level={"H"} bgColor={"#FFFFFF"} fgColor={"#000000"} />
              </Box>
              <Typography variant="body2" sx={{ color: 'text.secondary', mt: 2 }}>
                Your QR code is private. If you share it, they can add you as a friend.
              </Typography>
            </Card>
          </Box>
        </Box>
          </Card>
        </Zoom>
      )}
    </Box>

    <Box
      sx={{
        display: "flex",
        justifyContent: "space-evenly",
        alignItems: "center",
        width: "100%",
        pb: 4,
        mt: 4,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {viewMode === "avatar" &&
        [
          { icon: <Share />, label: "Share profile", delay: 400, handler: handleShare },
          { icon: <ContentCopyOutlined />, label: "Copy link", delay: 500, handler: handleCopyLink },
          { icon: <QrCode />, label: "QR code", delay: 600, handler: () => setViewMode("qr") },
        ].map(({ icon, label, delay, handler }) => (
          <Zoom in={profilePicOpen} style={{ transitionDelay: `${delay}ms` }} key={label}>
            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", mx: 1.5 }}>
              <IconButton
                onClick={handler}
                sx={{
                  width: 64,
                  height: 64,
                  borderRadius: "50%",
                  bgcolor: mode === "dark" ? "rgba(255,255,255,0.08)" : "rgba(0, 0, 0, 0.15)",
                  color: "white",
                  mb: 1,
                  transition: "all 0.3s ease",
                  "&:hover": {
                    transform: "scale(1.15)",
                    bgcolor: mode === "dark" ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.1)",
                  },
                }}
              >
                {icon}
              </IconButton>
              <Typography variant="caption" sx={{ color: "white", fontWeight: 500 }}>
                {label}
              </Typography>
            </Box>
          </Zoom>
        ))}

      {viewMode === "qr" && (
        <>
          <IconButton
            onClick={() => setViewMode("avatar")}
            sx={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              bgcolor: mode === "dark" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.15)",
              color: "white",
              "&:hover": { transform: "scale(1.15)" },
            }}
          >
            <ArrowBack />
          </IconButton>

          <IconButton
            onClick={async () => {
  const node = document.getElementById("profile-card");
  if (!node) {
    console.error("Profile card element not found!");
    return;
  }

  try {
    const dataUrl = await toPng(node);
    const filename = `${userData.username}-profile.png`;

    if (window.nativeBridge && typeof window.nativeBridge.downloadBase64 === 'function') {
      const base64Data = dataUrl.split(',')[1];
      window.nativeBridge.downloadBase64(base64Data, filename);
    } else {
      const link = document.createElement("a");
      link.download = filename;
      link.href = dataUrl;
      link.click();
    }
  } catch (error) {
    console.error('Error generating or downloading image:', error);
  }
}}
            sx={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              bgcolor: mode === "dark" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.15)",
              color: "white",
              "&:hover": { transform: "scale(1.15)" },
            }}
          >
            <DownloadOutlined />
          </IconButton>
        </>
      )}
    </Box>

    <Snackbar
      open={snackbar.open}
      autoHideDuration={3000}
      onClose={handleSnackbarClose}
      message={snackbar.message}
      anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
    />
  </Box>
</Dialog>

  </Container>
)}

{drawerPage === "feedback" && (
  <Container sx={{ mt: -6, mb: 4 }}>
    <Button
      startIcon={<ArrowBack />}
      onClick={() => navigate(-1)}
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

    <Typography variant="h5" fontWeight="bold" sx={{ mb: 2 }}>
      Report & Feedback
    </Typography>

    <Typography variant="body1" sx={{ mb: 3, color: mode === "dark" ? "#aaa" : "#333" }}>
      We value your feedback! Please let us know if you have any suggestions, feature requests, or want to report a bug.
    </Typography>

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
        For urgent issues, email us at <a href="mailto:team.bunkmates@gmail.com" style={{ color: "#888888ff" }}>team.bunkmates@gmail.com</a>
      </Typography>
    </Box>
  </Container>
)}

{drawerPage === "adduser" && (
  <>
    <Box sx={{ p: 2, mt: -6 }}>
      <Box sx={{ display: "flex", alignItems: "center", flexDirection: "row", mb: 2 }}>
        <IconButton
          onClick={() => navigate(-1)}
          sx={{
            mr: 2, borderRadius: 8, color: theme.palette.text.primary,
            backgroundColor: mode === "dark" ? "#f1f1f111" : "#e0e0e071",
            '&:hover': { backgroundColor: "#f1f1f121" },
          }}
        >
          <ArrowBack />
        </IconButton>
        <Typography variant="h5" fontWeight="bold">QR Code</Typography>
      </Box>

      <Tabs
        value={activeTab}
        onChange={(e, newValue) => setActiveTab(newValue)}
        variant="fullWidth"
        textColor="inherit"
        TabIndicatorProps={{
          style: {
            backgroundColor: "transparent",
            height: "0px"
          }
        }}
        sx={{
            bgcolor: mode === "dark" ? "#ffffff0d" : "#0000000a",
            border: mode === "dark" ? "4px solid #ffffff00" : "4px solid #00000000",
            borderRadius: 8,
            minHeight: "10px",
            mt: 4,
            mb: 2,
            "& .MuiTab-root": {
                fontWeight: 600,
                textTransform: "none",
                fontSize: "1rem",
                minHeight: "10px",
                color: mode === "dark" ? "#bbb" : "#555",
                transition: "all 0.2s ease-in-out",
                "&.Mui-selected": {
                    color: theme.palette.text.primary,
                    backgroundColor: mode === "dark" ? "#f1f1f133" : "#00000022",
                    borderRadius: 8,
                },
            },
        }}
      >
        <Tab label="My Code" value="myCode" />
        <Tab label="Scan Code" value="scanCode" />
      </Tabs>
    </Box>

    <Box {...swipeHandlers} sx={{ position: 'relative', overflow: 'hidden', minHeight: '80vh' }}>
      <Slide direction="right" in={activeTab === 'myCode'} sx={{ mx: "auto" }} mountOnEnter unmountOnExit>
        <Box sx={{ position: 'absolute', width: 280, px: 1, mt: 4, mx: "auto" }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Avatar src={userData.photoURL} sx={{ width: 80, height: 80, mb: -5, zIndex: 2, border: mode === "dark" ? '4px solid #0c0c0c21' : '4px solid #FFFFFF71' }} />
            <Card sx={{ width: '80%', bgcolor: mode === "dark" ? '#0c0c0c21' : '#FFFFFF71', borderRadius: 6, p: 3, pt: 7, textAlign: 'center', boxShadow: "none" }}>
              <Box sx={{ display: "flex", flexDirection: 'column' }}>
                <Typography variant="h5" fontWeight="bold" sx={{ color: theme.palette.text.primary }}>{userData.name}</Typography>
                <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>@{userData.username}</Typography>
              </Box>
              <Box sx={{ bgcolor: 'white', p: 2, borderRadius: 3, display: 'inline-block', mb: 2, mt: 3 }}>
                <QRCodeSVG value={auth.currentUser?.uid || "default-user-id"} size={200} level={"H"} bgColor={"#FFFFFF"} fgColor={"#000000"} />
              </Box>
              <Typography variant="body2" sx={{ color: 'text.secondary', mt: 2 }}>
                Your QR code is private. If you share it, they can add you as a friend.
              </Typography>
            </Card>
          </Box>
        </Box>
      </Slide>

      <Slide direction="left" in={activeTab === 'scanCode'} sx={{ mx: "auto" }} mountOnEnter unmountOnExit>
        <Box sx={{ position: 'absolute', width: 280, px: 2, mt: 4 }}>
          <Box sx={{ position: 'relative', height: '60vh', width: '100%', overflow: 'hidden', borderRadius: 4, bgcolor: 'black' }}>
            <Box sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}>
              <QrScanner onScanSuccess={handleScanSuccess} />
            </Box>
            <Box sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <Box sx={{ width: 240, height: 240, border: '2px solid rgba(255, 255, 255, 0.8)', borderRadius: 6, boxShadow: '0 0 0 9999px rgba(0,0,0,0.5)' }} />
              <Typography sx={{ color: "white", mt: 1 }}>Scan your QR code</Typography>
            </Box>
          </Box>
        </Box>
      </Slide>
    </Box>

<Dialog
  open={showScannedUserDrawer}
  onClose={() => setShowScannedUserDrawer(false)}
  PaperProps={{
    sx: {
      borderRadius: 4,
      maxWidth: 320,
      mx: "auto",
      bgcolor: "transparent",
      p: 0,
      overflow: "visible",
      boxShadow: "none",
    },
  }}
  BackdropProps={{
    sx: {
      backgroundColor: "rgba(0,0,0,0.3)",
      backdropFilter: "blur(50px)",
    },
  }}
>
  {scannedUserData && (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        p: 3,
        position: "relative",
      }}
    >
      <Avatar
        src={scannedUserData.photoURL}
        alt={scannedUserData.name}
        sx={{
          width: 90,
          height: 90,
          mb: -5,
          zIndex: 2,
          border: mode === "dark" ? "4px solid #1F1F1Fcc" : "4px solid #ffffffcc",
          boxShadow: "none",
        }}
      />

      <Card
        sx={{
          width: "100%",
          maxWidth: 300,
          bgcolor: mode === "dark" ? "#1F1F1Fbb" : "#ffffffbb",
          borderRadius: 6,
          p: 3,
          pt: 7,
          textAlign: "center",
          boxShadow: "none",
          backdropFilter: "blur(14px)",
        }}
      >
        <Typography
          variant="h6"
          fontWeight="bold"
          sx={{ color: theme.palette.text.primary }}
        >
          {scannedUserData.name}
        </Typography>
        <Typography
          variant="caption"
          sx={{ color: theme.palette.text.secondary }}
        >
          @{scannedUserData.username}
        </Typography>

        <Typography
          variant="body2"
          sx={{ color: "text.secondary", my: 2 }}
        >
          {scannedUserData.bio || "This user hasn’t added a bio yet."}
        </Typography>

        {userData?.friends?.includes(scannedUserData.id) ? (
          <Chip
            label="Already Friends"
            color="success"
            sx={{
              px: 2,
              py: 0.5,
              fontWeight: 600,
              borderRadius: 2,
              mt: 2,
            }}
          />
        ) : (
          <Button
            variant="contained"
            fullWidth
            onClick={handleAddFriend}
            sx={{
              py: 1.3,
              textTransform: "none",
              fontSize: "1rem",
              borderRadius: 3,
              fontWeight: 600,
              boxShadow: "none",
              mt: 2,
              background: theme.palette.primary.main,
              "&:hover": {
              boxShadow: "none",
              },
            }}
          >
            Add Friend
          </Button>
        )}
      </Card>
    </Box>
  )}
</Dialog>

  </>
)}

{drawerPage === "developers" && (
  <Container
    sx={{
      mt: -6,
      mb: 10,
      px: { xs: 2, sm: 3 },
      animation: "fadeIn 0.4s ease-in-out",
      "@keyframes fadeIn": { from: { opacity: 0 }, to: { opacity: 1 } },
    }}
  >
    <Box sx={{ display: "flex", alignItems: "center", mb: 4 }}>
      <IconButton
        onClick={() => navigate(-1)}
        sx={{
          mr: 2,
          borderRadius: 8,
          p: 1,
          color: theme.palette.text.primary,
          backgroundColor: mode === "dark" ? "#ffffff10" : "#e0e0e060",
          transition: "all 0.2s ease",
          "&:hover": {
            backgroundColor:
              mode === "dark"
                ? "#ffffff20"
                : alpha(theme.palette.primary.main, 0.1),
            transform: "scale(1.05)",
          },
        }}
      >
        <ArrowBack />
      </IconButton>
      <Typography variant="h5" fontWeight="700">
        Developer Tools
      </Typography>
    </Box>

    <Typography
      variant="body2"
      sx={{
        mb: 3,
        color: theme.palette.text.secondary,
        textAlign: "center",
      }}
    >
      🧑‍💻 Welcome to Developer Mode — explore experimental and internal tools
      for testing, debugging, and feature previews.
    </Typography>

    <Box
      sx={{
        borderRadius: 4,
        backgroundColor:
          mode === "dark"
            ? "#ffffff08"
            : alpha(theme.palette.primary.main, 0.02),
        p: 2,
        mb: 3,
        boxShadow: theme.shadows[1],
      }}
    >
      <Typography
        variant="subtitle1"
        sx={{
          mb: 2,
          fontWeight: 700,
          color: theme.palette.primary.main,
        }}
      >
        Testing Features
      </Typography>

      <List disablePadding>
        {[
          {
            label: "Weather Forecast Hourly",
            description: "Displays hourly weather data for testing.",
            action: () => navigate("/developer/waether-forecast"),
          },
          {
            label: "Weather Page",
            description: "Standalone weather information page.",
            action: () => navigate("/developer/weather"),
          },
          {
            label: "New Groups",
            description: "This feature is just for testing the new group chats page.",
            action: () => navigate("/grouplists"),
          },
          {
            label: "For Fun...😜",
            description: "This feature is just for fun and won't go live for public and BETA Testers.",
            action: () => navigate("/developer/bunkmates/social"),
          },
          {
            label: "OTP Login",
            description: "This feature is just for testing OTP login functionality.",
            action: () => navigate("/developer/OtpLogin"),
          },
          {
            label: "User Maps",
            description: "View user distribution heatmaps and analytics.",
            action: () => navigate("/developer/maps"),
          },
          {
            label: "Budget Manager",
            description: "Manage and track your budget allocations.",
            action: () => navigate("/developer/BudgetMngr"),
          },
          {
            label: "Notes",
            description: "A simple note-taking feature for testing purposes.",
            action: () => navigate("/developer/notes"),
          }
        ].map((feature, index) => (
          <ListItem
            key={index}
            sx={{
              mb: 1.2,
              borderRadius: 3,
              transition: "all 0.2s ease",
              "&:hover": {
                bgcolor: alpha(theme.palette.primary.main, 0.06),
                transform: "scale(1.01)",
              },
            }}
            onClick={feature.action}
          >
            <ListItemText
              primary={feature.label}
              secondary={feature.description}
              primaryTypographyProps={{
                fontWeight: 600,
                color: theme.palette.text.primary,
              }}
              secondaryTypographyProps={{
                color: theme.palette.text.secondary,
                fontSize: "0.85rem",
              }}
            />
            <ArrowForwardIos
              sx={{ color: theme.palette.text.secondary }}
            />
          </ListItem>
        ))}
      </List>
    </Box>

    <Typography
      variant="caption"
      align="center"
      sx={{
        display: "block",
        mt: 5,
        color: theme.palette.text.disabled,
      }}
    >
      Developer Utilities © {new Date().getFullYear()} BunkMates Labs
    </Typography>
  </Container>
)}

</Box>
</Drawer>

{/* Logout Glassmorphic Swipeable Bottom Drawer */}
<SwipeableDrawer
  anchor="bottom" open={confirmLogout} onClose={() => setConfirmLogout(false)} onOpen={() => {}} disableSwipeToOpen sx={{ zIndex: 1500 }}
  PaperProps={{ sx: { borderRadius: 8, p: 3, background: mode === "dark" ? "rgba(20, 20, 20, 0.08)" : "rgba(255,255,255,0.39)", backdropFilter: "blur(20px)", boxShadow: theme.palette.mode === "dark" ? `inset 0 1px 2px rgba(255, 255, 255, 0.11), inset 0 -1px 1px rgba(35, 35, 35, 0.07)` : `inset 0 1px 1px rgba(255,255,255,0.8), inset 0 -1px 1px rgba(0, 0, 0, 0.1)`, maxWidth: 540, mx: "auto", m: 3 } }}
  ModalProps={{ BackdropProps: { sx: { backdropFilter: "blur(10px)", backgroundColor: "rgba(0,0,0,0)" } } }}
>
  <Typography variant="h6" fontWeight="700" sx={{ textTransform: "none", textAlign: "center", mb: 2, color: mode === "dark" ? "#fff" : "#000" }}>Account Session Logout</Typography>
  <Box display="flex" flexDirection="column" alignItems="center" gap={2} sx={{ mb: 3 }}>
    <Box sx={{ width: 56, height: 56, borderRadius: "50%", backgroundColor: mode === "dark" ? "rgba(229, 57, 53, 0.15)" : "#ffebee", display: "flex", alignItems: "center", justifyContent: "center" }}><Typography sx={{ fontSize: 26 }}>🚪</Typography></Box>
    <Typography variant="body1" textAlign="center" sx={{ fontWeight: 500, px: 2 }}>Are you sure you want to end your active session and <strong>logout</strong>?</Typography>
    <Typography variant="caption" color="text.secondary" sx={{ fontStyle: "italic", textAlign: "center", px: 2 }}>You can re-authenticate anytime with your existing account credentials.</Typography>
  </Box>
  <Stack direction="row" spacing={2} justifyContent="center" sx={{ pb: 1 }}>
    <Button variant="outlined" fullWidth onClick={() => setConfirmLogout(false)} sx={{ textTransform: "none", background: mode === "dark" ? "rgba(255, 255, 255, 0.08)" : "rgba(255,255,255,0.42)", backdropFilter: "blur(10px)", boxShadow: theme.palette.mode === "dark" ? `inset 0 1px 2px rgba(255, 255, 255, 0.11), inset 0 -1px 1px rgba(35, 35, 35, 0.07)` : `inset 0 1px 1px rgba(255,255,255,0.8), inset 0 -1px 1px rgba(0, 0, 0, 0.1)`, borderRadius: 8, py: 1.2, fontWeight: 600, border: "none", color: mode === "dark" ? "#fff" : "#000", "&:hover": { backgroundColor: mode === "dark" ? "rgba(255, 255, 255, 0.05)" : "#f5f5f5" } }}>Cancel</Button>
    <Button variant="contained" fullWidth onClick={() => { handleLogout(); setConfirmLogout(false); }} sx={{ textTransform: "none", background: mode === "dark" ? "rgba(229, 57, 53, 0.18)" : "rgba(255, 102, 102, 0.69)", backdropFilter: "blur(10px)", boxShadow: theme.palette.mode === "dark" ? `inset 0 1px 2px rgba(255, 255, 255, 0.11), inset 0 -1px 1px rgba(35, 35, 35, 0.07)` : `inset 0 1px 1px rgba(255,255,255,0.8), inset 0 -1px 1px rgba(0, 0, 0, 0.1)`, borderRadius: 8, py: 1.2, fontWeight: 600, color: mode === "dark" ? "#fff" : "#000", "&:hover": { backgroundColor: "#c62828" } }}>Logout</Button>
  </Stack>
</SwipeableDrawer>

{/* Developer Passkey Glassmorphic Swipeable Bottom Drawer */}
<SwipeableDrawer
  anchor="bottom" open={showDevDialog} onClose={() => setShowDevDialog(false)} onOpen={() => {}} disableSwipeToOpen sx={{ zIndex: 1500 }}
  PaperProps={{ sx: { borderRadius: 8, p: 3, background: mode === "dark" ? "rgba(20, 20, 20, 0.08)" : "rgba(255,255,255,0.39)", backdropFilter: "blur(20px)", boxShadow: theme.palette.mode === "dark" ? `inset 0 1px 2px rgba(255, 255, 255, 0.11), inset 0 -1px 1px rgba(35, 35, 35, 0.07)` : `inset 0 1px 1px rgba(255,255,255,0.8), inset 0 -1px 1px rgba(0, 0, 0, 0.1)`, maxWidth: 540, mx: "auto", m: 3 } }}
  ModalProps={{ BackdropProps: { sx: { backdropFilter: "blur(10px)", backgroundColor: "rgba(0,0,0,0)" } } }}
>
  <Typography variant="h6" fontWeight="700" sx={{ textTransform: "none", textAlign: "center", mb: 2, color: mode === "dark" ? "#fff" : "#000" }}>Enter Developer Passkey</Typography>
  <Box display="flex" flexDirection="column" alignItems="center" gap={2} sx={{ mb: 3 }}>
    <Typography variant="body2" textAlign="center" sx={{ color: "text.secondary", px: 2 }}>This access horizon is restricted to verified software developers.</Typography>
    <TextField
      autoFocus
      margin="dense"
      label="Developer Key"
      type={showDevKey ? "text" : "password"}
      placeholder="Enter developer passkey..."
      fullWidth
      variant="outlined"
      value={enteredKey}
      onChange={(e) => setEnteredKey(e.target.value)}
      onKeyDown={(e) => e.key === "Enter" && handleVerifyDevKey()}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <VpnKey sx={{ fontSize: 20, color: mode === "dark" ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)" }} />
          </InputAdornment>
        ),
        endAdornment: (
          <InputAdornment position="end">
            <IconButton onClick={() => setShowDevKey(!showDevKey)} edge="end" sx={{ color: mode === "dark" ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.7)" }}>
              {showDevKey ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
            </IconButton>
          </InputAdornment>
        )
      }}
      sx={{
        width: "100%",
        "& .MuiOutlinedInput-root": {
          color: mode === "dark" ? "#fff" : "#111",
          borderRadius: 4,
          backgroundColor: mode === "dark" ? "rgba(0, 0, 0, 0.2)" : "rgba(255, 255, 255, 0.2)",
          boxShadow: mode === "dark" 
            ? `inset 0 1px 2px rgba(255, 255, 255, 0.11), inset 0 -1px 1px rgba(35, 35, 35, 0.07)` 
            : `inset 0 1px 1px rgba(255, 255, 255, 0.8), inset 0 -1px 1px rgba(0, 0, 0, 0.1)`, 
          border: "0px solid", 
          "& fieldset": { border: "none" }
        }
      }}
    />
  </Box>
  <Stack direction="row" spacing={2} justifyContent="center" sx={{ pb: 1 }}>
    <Button variant="outlined" fullWidth onClick={() => setShowDevDialog(false)} sx={{ textTransform: "none", background: mode === "dark" ? "rgba(255, 255, 255, 0.08)" : "rgba(255,255,255,0.42)", backdropFilter: "blur(10px)", boxShadow: theme.palette.mode === "dark" ? `inset 0 1px 2px rgba(255, 255, 255, 0.11), inset 0 -1px 1px rgba(35, 35, 35, 0.07)` : `inset 0 1px 1px rgba(255,255,255,0.8), inset 0 -1px 1px rgba(0, 0, 0, 0.1)`, borderRadius: 8, py: 1.2, fontWeight: 600, border: "none", color: mode === "dark" ? "#fff" : "#000", "&:hover": { backgroundColor: mode === "dark" ? "rgba(255, 255, 255, 0.05)" : "#f5f5f5" } }}>Cancel</Button>
    <Button variant="contained" fullWidth onClick={handleVerifyDevKey} sx={{ textTransform: "none", background: mode === "dark" ? "rgba(255, 255, 255, 0.85)" : "rgba(0, 0, 0, 0.85)", backdropFilter: "blur(10px)", boxShadow: theme.palette.mode === "dark" ? `inset 0 1px 2px rgba(255, 255, 255, 0.11), inset 0 -1px 1px rgba(35, 35, 35, 0.07)` : `inset 0 1px 1px rgba(255,255,255,0.8), inset 0 -1px 1px rgba(0, 0, 0, 0.1)`, borderRadius: 8, py: 1.2, fontWeight: 600, color: mode === "dark" ? "#000" : "#fff", "&:hover": { backgroundColor: mode === "dark" ? "#fff" : "#222" } }}>Verify Passkey</Button>
  </Stack>
</SwipeableDrawer>

</>
</ThemeProvider>
    );
};

export default ProfilePic;