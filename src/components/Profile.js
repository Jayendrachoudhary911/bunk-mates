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
  Badge
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
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

import LanguageOutlinedIcon from '@mui/icons-material/LanguageOutlined';
import PersonAddOutlinedIcon from '@mui/icons-material/PersonAddOutlined';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import FeedbackOutlinedIcon from '@mui/icons-material/FeedbackOutlined';
import CheckIcon from '@mui/icons-material/Check';
import SearchIcon from '@mui/icons-material/Search';
import LanguageIcon from '@mui/icons-material/Language';
import PaletteOutlinedIcon from '@mui/icons-material/PaletteOutlined';
import WallpaperOutlinedIcon from '@mui/icons-material/WallpaperOutlined';
import FormatSizeOutlinedIcon from '@mui/icons-material/FormatSizeOutlined';
import DeleteSweepOutlinedIcon from '@mui/icons-material/DeleteSweepOutlined';
import DeleteForeverOutlinedIcon from '@mui/icons-material/DeleteForeverOutlined';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ChatIcon from '@mui/icons-material/Chat';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import EmailIcon from '@mui/icons-material/Email';
import TelegramIcon from '@mui/icons-material/Telegram';
import ShareIcon from '@mui/icons-material/Share';
import QrCodeIcon from "@mui/icons-material/QrCode";
import QrCodeScannerIcon from "@mui/icons-material/QrCodeScanner";
import CloseIcon from "@mui/icons-material/Close";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import PhotoCamera from "@mui/icons-material/PhotoCamera";
import Brightness4Icon from '@mui/icons-material/Brightness4';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';
import WbSunnyOutlinedIcon from '@mui/icons-material/WbSunnyOutlined';
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined';
import MyLocationOutlinedIcon from '@mui/icons-material/MyLocationOutlined';
import EditLocationOutlinedIcon from '@mui/icons-material/EditLocationOutlined';
import FormatSizeIcon from '@mui/icons-material/FormatSize';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import GroupAddOutlinedIcon from '@mui/icons-material/GroupAddOutlined';
import CardTravelOutlinedIcon from '@mui/icons-material/CardTravelOutlined';
import BlockOutlinedIcon from '@mui/icons-material/BlockOutlined';
import PublicIcon from '@mui/icons-material/Public';
import PeopleOutlineIcon from '@mui/icons-material/PeopleOutline';
import PersonOffOutlinedIcon from '@mui/icons-material/PersonOffOutlined';
import BlockIcon from "@mui/icons-material/Block";
import ShareOutlinedIcon from '@mui/icons-material/ShareOutlined';
import LinkOutlinedIcon from '@mui/icons-material/LinkOutlined';
import QrCode2OutlinedIcon from '@mui/icons-material/QrCode2Outlined';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import PhotoLibraryOutlinedIcon from '@mui/icons-material/PhotoLibraryOutlined';
import FlashlightOnOutlinedIcon from '@mui/icons-material/FlashlightOnOutlined';
import ContentCopyOutlinedIcon from "@mui/icons-material/ContentCopyOutlined";
import DownloadOutlinedIcon from '@mui/icons-material/DownloadOutlined';
import NotificationsNoneOutlinedIcon from '@mui/icons-material/NotificationsNoneOutlined';
import InstagramIcon from "@mui/icons-material/Instagram";
import YouTubeIcon from "@mui/icons-material/YouTube";
import LayersOutlinedIcon from '@mui/icons-material/LayersOutlined';
import EngineeringOutlinedIcon from '@mui/icons-material/EngineeringOutlined'

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

  const [tapCount, setTapCount] = React.useState(0);
  const [showDevDialog, setShowDevDialog] = React.useState(false);
  const [enteredKey, setEnteredKey] = React.useState("");
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

  // const [language, setLanguage] = useState('en-US'); // Default language
  // const [languageDrawerOpen, setLanguageDrawerOpen] = useState(false);
  // const [searchTerm, setSearchTerm] = useState('');

  const [chatTheme, setChatTheme] = useState(localStorage.getItem('bunkmate_chatTheme') || 'system');
  const [fontSize, setFontSize] = useState(parseInt(localStorage.getItem('bunkmate_fontSize'), 10) || 14);
  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [wallpaperDrawerOpen, setWallpaperDrawerOpen] = useState(false); // ⭐️ State for the drawer
  const [fontDrawerOpen, setFontDrawerOpen] = useState(false); // ⭐️ State for the drawer

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
    profileVisibility: 'public', // 'public' or 'private'
    canBeAddedToGroups: 'everyone', // 'everyone' or 'friends'
    canBeAddedToTrips: 'everyone', // 'everyone' or 'friends'
  });
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [isLoadingBlocked, setIsLoadingBlocked] = useState(false);
  const [profilePicOpen, setProfilePicOpen] = useState(false);
  const [scannedUserData, setScannedUserData] = useState(null);
  const [showScannedUserDrawer, setShowScannedUserDrawer] = useState(false);
  const [activeTab, setActiveTab] = useState('myCode');
  const [viewMode, setViewMode] = useState('avatar'); // 'avatar' or 'qr'
  const [snackbar, setSnackbar] = useState({ open: false, message: '' });
  const [unreadCount, setUnreadCount] = useState(0);

  // Place this at the top level of your component, with your other hooks

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
  trackMouse: true, // Allows swiping with a mouse for testing
});

const [chatWallpaper, setChatWallpaper] = useState(() => {
  // On initial load, try to get the wallpaper from localStorage
  const savedWallpaper = localStorage.getItem('bunkmate_chatWallpaper');
  
  // If a wallpaper was saved, use it. Otherwise, use a default value.
  return savedWallpaper || 'none'; 
});

// Your existing handler function works perfectly with this setup
const handleWallpaperSelect = (wallpaperUrl) => {
    setChatWallpaper(wallpaperUrl);
    localStorage.setItem('bunkmate_chatWallpaper', wallpaperUrl);
};
  const themeWallpapers = useMemo(() => {
    return wallpapers.filter(w => w.theme === mode || w.theme === 'both');
  }, [wallpapers, mode]);

  useEffect(() => {
  let defaultWallpaperUrl;

  // Check the current theme mode
  if (mode === 'dark') {
    // Find the default dark wallpaper by its unique ID
    defaultWallpaperUrl = wallpapers.find(w => w.id === 'default-dark')?.url;
  } else {
    // Find the default light wallpaper by its unique ID
    defaultWallpaperUrl = wallpapers.find(w => w.id === 'default-light')?.url;
  }

  // If a default wallpaper was found, select it
  // (This assumes you have a function like 'handleWallpaperSelect' that sets the state)
  if (defaultWallpaperUrl) {
    handleWallpaperSelect(defaultWallpaperUrl);
  }
}, [mode]); // This dependency array ensures the hook only runs when 'mode' changes

  const buttonWeatherBg =
  weather && weatherColors[weather.main]
    ? weatherColors[weather.main]
    : weatherColors.Default;
    
const toggleDropdown = (key) => {
  setActiveDropdown(activeDropdown === key ? null : key);
};

const handleScanCode = () => {
  handleQrDrawerClose(); // Close the previous drawer
  setScannerOpen(true);   // Open the scanner modal
};

// This handler receives the decoded text directly
const handleScanSuccess = async (decodedText) => {
  if (isProcessing) return;
  setIsProcessing(true);
  setScannerOpen(false); // Close scanner on success

  // ... The rest of your existing logic for fetching and displaying the user profile
  // is exactly the same and does not need to be changed.
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

        // Cleanup listener on component unmount
        return () => unsubscribe();
    }, []);

// This handler receives the error message
const handleScanError = (errorMessage) => {
  // We can ignore common errors, but log others
  if (!errorMessage.includes("QR code parse error")) {
      console.error("QR Scanner Error:", errorMessage);
  }
};

// This new function handles the logic for adding the friend
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
    // Close the drawer and clear the state after adding
    setShowScannedUserDrawer(false);
    setScannedUserData(null);

  } catch (error) {
    console.error("Error adding friend:", error);
    alert("An error occurred while adding the friend.");
  }
};

// No changes needed for handleError
const handleError = (error) => {
  if (!error.message.includes("NotFoundException")) {
    console.error("QR Scanner Error:", error?.message);
  }
};

const handleShare = async () => {
  // 1. Prepare the data to be shared.
  const shareData = {
    title: `Check out ${userData.name}'s profile`,
    message: `Here's a link to ${userData.name}'s profile on BunkMate.`, // Used for both native and web
    url: `${window.location.origin}/profile/${userData.uid}`,
  };

  try {
    // 2. Check for the native app bridge first.
    // This 'nativeBridge' is the custom object we defined for the WebView.
    if (window.nativeBridge && typeof window.nativeBridge.share === 'function') {
      window.nativeBridge.share({
        title: shareData.title,
        message: shareData.message,
        url: shareData.url,
      });
    }
    // 3. If no native bridge, check for the browser's Web Share API.
    else if (navigator.share) {
      await navigator.share({
        title: shareData.title,
        text: shareData.message, // Note: Web Share API uses 'text' instead of 'message'
        url: shareData.url,
      });
    }
    // 4. If all else fails, fall back to copying the link to the clipboard.
    else {
      await navigator.clipboard.writeText(shareData.url);
      setSnackbar({ open: true, message: 'Share not supported, link copied instead!' });
    }
  } catch (error) {
    console.error('Error sharing:', error);
    // Optionally, show an error message to the user
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

// Handles closing the snackbar
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
  // Increment tap count
  setTapCount((prev) => {
    const newCount = prev + 1;

    // Reset if paused for too long
    if (tapTimer.current) clearTimeout(tapTimer.current);
    tapTimer.current = setTimeout(() => setTapCount(0), 1500);

    // When tapped 7 times
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
        alert("✅ Developer Mode Unlocked!");
      } else {
        alert("❌ Invalid Developer Key.");
      }
    } catch (err) {
      console.error("Error verifying dev key:", err);
      alert("Error verifying key. Try again later.");
    }
  };

  // const handleLanguageChange = (langCode) => {
  //   setLanguage(langCode);
  //   setLanguageDrawerOpen(false);
  // };

  // // Filters languages based on the user's search term
  // const filteredLanguages = availableLanguages.filter((lang) =>
  //   lang.name.toLowerCase().includes(searchTerm.toLowerCase())
  // );



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

  useEffect(() => {
  // Function to fetch settings from Firestore
  const fetchPrivacySettings = async () => {
    if (auth.currentUser) {
      try {
        const userDocRef = doc(db, "users", auth.currentUser.uid);
        const docSnap = await getDoc(userDocRef);

        if (docSnap.exists()) {
          const userData = docSnap.data();
          const userPrivacy = userData.privacy || {}; // Get privacy object, or empty if it doesn't exist

          // Set state with fetched data, providing defaults for any missing fields
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
}, []); // This effect runs when the currentUser is identified

const handlePrivacyChange = async (setting, newValue) => {
  // Check for the setting name passed directly as an argument
  if (!auth.currentUser || !setting) {
    setPrivacyMenuAnchor(null); // Still close the menu
    return;
  }

  const userDocRef = doc(db, "users", auth.currentUser.uid);
  const settingKey = `privacy.${setting}`; // Creates the path e.g., "privacy.canBeAddedToGroups"

  try {
    // Update Firestore
    await updateDoc(userDocRef, { [settingKey]: newValue });

    // Update local state
    setPrivacySettings(prevSettings => ({ ...prevSettings, [setting]: newValue }));
    
  } catch (error) {
    console.error("Error updating privacy setting:", error);
  } finally {
    setPrivacyMenuAnchor(null); // Close the menu
  }
};

// New handler function for the switch
const handleVisibilityChange = async (event) => {
  if (!auth.currentUser) return;

  const isPrivate = event.target.checked;
  const newVisibility = isPrivate ? 'private' : 'public';
  const userDocRef = doc(db, "users", auth.currentUser.uid);

  try {
    // 1. Update Firestore
    await updateDoc(userDocRef, { "privacy.profileVisibility": newVisibility });
    
    // 2. Update local state
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
      // Delete Firestore user document
      const userDocRef = doc(db, "users", user.uid);
      await deleteDoc(userDocRef);
      console.log("User document successfully deleted from Firestore.");

      alert("Your account data has been successfully deleted from Firestore.");

      // Close the confirmation dialog and navigate away
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
    // Check if the correct page is open and the user is logged in
    if (drawerPage === "blockedContacts" && auth.currentUser) {
      setIsLoadingBlocked(true);
      try {
        const userDocRef = doc(db, "users", auth.currentUser.uid);
        const docSnap = await getDoc(userDocRef);

        // 1. FIXED: Use 'blockedUids' to match your Firestore field name
        const blockedUids = docSnap.data()?.blockedUids || [];

        if (blockedUids.length === 0) {
          setBlockedUsers([]); // No one is blocked
          setIsLoadingBlocked(false);
          return;
        }

        // Fetch user profiles for all blocked UIDs
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

  // 2. FIXED: Call the function inside the effect
  fetchBlockedUsers();

// 3. FIXED: Add dependencies to re-run when the page opens
}, [drawerPage, auth.currentUser]);

const handleUnblockUser = async (userIdToUnblock) => {
  if (!auth.currentUser) return;
  try {
    const userDocRef = doc(db, "users", auth.currentUser.uid);
    
    // FIXED: Use 'blockedUids' to match your Firestore field name
    await updateDoc(userDocRef, {
      blockedUids: arrayRemove(userIdToUnblock)
    });

    // Update the local state to remove the user from the list instantly
    setBlockedUsers(prevUsers => prevUsers.filter(user => user.id !== userIdToUnblock));

  } catch (error) {
    console.error("Error unblocking user:", error);
    alert("Failed to unblock user. Please try again.");
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
        "support", "feedback", "inviteFriend", "about", "featuresChangelog", "adduser", "blockedContacts", "appInfo", "developers"
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

  const inviteLink = `${window.location.origin}/invite/${userData.username}`;

  return (
  <ThemeProvider theme={theme}>
<>

  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
    <Badge
        color="error"
        variant="dot"
        badgeContent={unreadCount}
        sx={{
            '& .MuiBadge-badge': {
                right: 8,
                top: 6,
            },
        }}
    >
      <NotificationsNoneOutlinedIcon
        sx={{ fontSize: 28, color: mode === "dark" ? "#fff" : "#333", cursor: "pointer" }}
        onClick={() => navigate("/notifications")}
      />
    </Badge>

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
      backgroundColor: mode === "dark" ? "#00000059" : "#ffffffb4",
      backdropFilter: 'blur(80px)',
      backgroundImage: 'none',
      color: theme.palette.text.primary,
      px: 2,
      pb: 3,
    },
  }}
>

  {drawerPage === "main" && (
    <>
      {/* User info */}
      <Box sx={{ display: "flex", alignItems: "left", my: 2, mx: 2 }}>
        <IconButton edge="start" color="inherit" onClick={() => navigate(-1)} sx={{ mr: 2 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography sx={{ fontSize: '1.5rem' }}><h2>Settings</h2></Typography>
      </Box>

    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mx: 2 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, my: 0, py: 2, borderRadius: 5, '&:hover': { bgcolor: mode === "dark" ? '#f1f1f121' : '#e7e7e788'} }} onClick={() => handleSetDrawerPage("profile")}>
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
      
          <IconButton
          onClick={() => handleSetDrawerPage("adduser")}
          sx={{
            ml: 1,
            color: theme.palette.text.primary,
            backgroundColor: mode === "dark" ? "#f1f1f111" : "#01010111",
            "&:hover": {
              backgroundColor: "#f1f1f111",
            },
          }}
        >
          <QrCodeIcon />
        </IconButton>

    </Box>

      <Divider sx={{ borderColor: "#333" }} />

      {/* Menu List */}
      <List sx={{ my: 0, gap: 0, display: "flex", flexDirection: "column" }}>

        {/* Accounts */}
        <ListItem sx={{ pb: 0 }}>
          <ListItemButton onClick={() => handleSetDrawerPage("accounts")} sx={{ borderRadius: 3, py: 1, px: 1, '&:hover': { bgcolor: mode === "dark" ? '#f1f1f121' : '#e7e7e788' } }}>
            <ListItemIcon sx={{ minWidth: 40 }}><AccountCircleOutlinedIcon sx={{ color: theme.palette.text.secondary }} /></ListItemIcon>
            <ListItemText primary="Accounts" secondary="User privacy and security" primaryTypographyProps={{ fontWeight: 'medium' }} secondaryTypographyProps={{ variant: 'body2', color: 'text.secondary', noWrap: true }} />
          </ListItemButton>
        </ListItem>

        {/* Chats */}
        <ListItem sx={{ pb: 0 }}>
          <ListItemButton onClick={() => handleSetDrawerPage("chats")} sx={{ borderRadius: 3, py: 1, px: 1, '&:hover': { bgcolor: mode === "dark" ? '#f1f1f121' : '#e7e7e788' } }}>
            <ListItemIcon sx={{ minWidth: 40 }}><ChatBubbleOutlineIcon sx={{ color: theme.palette.text.secondary }} /></ListItemIcon>
            <ListItemText primary="Chats" secondary="Theme, Wallpapers, and Chat Settings" primaryTypographyProps={{ fontWeight: 'medium' }} secondaryTypographyProps={{ variant: 'body2', color: 'text.secondary', noWrap: true }} />
          </ListItemButton>
        </ListItem>

        {/* General Settings */}
        <ListItem sx={{ pb: 0 }}>
          <ListItemButton onClick={() => handleSetDrawerPage("generalSettings")} sx={{ borderRadius: 3, py: 1, px: 1, '&:hover': { bgcolor: mode === "dark" ? '#f1f1f121' : '#e7e7e788' } }}>
            <ListItemIcon sx={{ minWidth: 40 }}><SettingsOutlinedIcon sx={{ color: theme.palette.text.secondary }} /></ListItemIcon>
            <ListItemText primary="General Settings" secondary="App Theme, Language, and Location" primaryTypographyProps={{ fontWeight: 'medium' }} secondaryTypographyProps={{ variant: 'body2', color: 'text.secondary', noWrap: true }} />
          </ListItemButton>
        </ListItem>

        {/* Help */}
        <ListItem sx={{ pb: 0 }}>
          <ListItemButton onClick={() => handleSetDrawerPage("support")} sx={{ borderRadius: 3, py: 1, px: 1, '&:hover': { bgcolor: mode === "dark" ? '#f1f1f121' : '#e7e7e788' } }}>
            <ListItemIcon sx={{ minWidth: 40 }}><HelpOutlineIcon sx={{ color: theme.palette.text.secondary }} /></ListItemIcon>
            <ListItemText primary="Help" secondary="Contact support and privacy policies" primaryTypographyProps={{ fontWeight: 'medium' }} secondaryTypographyProps={{ variant: 'body2', color: 'text.secondary', noWrap: true }} />
          </ListItemButton>
        </ListItem>

        {/* Send Feedback */}
        <ListItem sx={{ pb: 0 }}>
          <ListItemButton onClick={() => handleSetDrawerPage("feedback")} sx={{ borderRadius: 3, py: 1, px: 1, '&:hover': { bgcolor: mode === "dark" ? '#f1f1f121' : '#e7e7e788' } }}>
            <ListItemIcon sx={{ minWidth: 40 }}><FeedbackOutlinedIcon sx={{ color: theme.palette.text.secondary }} /></ListItemIcon>
            <ListItemText primary="Send feedback" secondary="Report technical issues" primaryTypographyProps={{ fontWeight: 'medium' }} secondaryTypographyProps={{ variant: 'body2', color: 'text.secondary', noWrap: true }} />
          </ListItemButton>
        </ListItem>

        {/* Invite a Friend */}
        <ListItem sx={{ pb: 0 }}>
          <ListItemButton onClick={() => handleSetDrawerPage("inviteFriend")} sx={{ borderRadius: 3, py: 1.5, px: 1, '&:hover': { bgcolor: mode === "dark" ? '#f1f1f121' : '#e7e7e788' } }}>
            <ListItemIcon sx={{ minWidth: 40 }}><PersonAddOutlinedIcon sx={{ color: theme.palette.text.secondary }} /></ListItemIcon>
            <ListItemText primary="Invite a Friend" primaryTypographyProps={{ fontWeight: 'medium' }} />
          </ListItemButton>
        </ListItem>

        {/* About */}
        <ListItem sx={{ pb: 0 }}>
          <ListItemButton onClick={() => handleSetDrawerPage("about")} sx={{ borderRadius: 3, py: 1.5, px: 1, '&:hover': { bgcolor: mode === "dark" ? '#f1f1f121' : '#e7e7e788' } }}>
            <ListItemIcon sx={{ minWidth: 40 }}><InfoOutlinedIcon sx={{ color: theme.palette.text.secondary }} /></ListItemIcon>
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
      <KeyboardArrowRightIcon sx={{ color: theme.palette.text.secondary }} />
    </ListItemButton>
  </ListItem>
)}


      </List>
    </>
  )}

{drawerPage === "accounts" && (
  <Container sx={{ mt: 5, mb: 2 }}>
    {/* Header */}
    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <IconButton
            onClick={() => navigate(-1)}
            sx={{
                mr: 2, borderRadius: 8, color: theme.palette.text.primary,
                backgroundColor: mode === "dark" ? "#f1f1f111" : "#e0e0e071",
                '&:hover': { backgroundColor: "#f1f1f121" },
            }}
        >
            <ArrowBackIcon />
        </IconButton>
        <Typography variant="h5" fontWeight="bold">
            Account Settings
        </Typography>
    </Box>

    {/* --- Privacy Section --- */}
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
          backgroundColor: theme.palette.mode === "dark" ? "#121212" : "#fff", // Thumb ON color
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
            theme.palette.mode === "dark" ? "#757575" : "#8d8d8dff", // Thumb OFF color
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

    {/* --- Security Section --- */}
    <Typography variant="overline" color="text.secondary" sx={{ display: 'block', mt: 3, pl: 2 }}>Security</Typography>
    <List>
      <ListItemButton onClick={() => handleSetDrawerPage("blockedContacts")}>
        <ListItemIcon><BlockOutlinedIcon /></ListItemIcon>
        <ListItemText primary="Blocked Contacts" secondary="Manage users you've blocked" />
      </ListItemButton>
    </List>

    {/* --- Account Actions Section --- */}
    <Typography variant="overline" color="text.secondary" sx={{ display: 'block', mt: 3, pl: 2 }}>Account Actions</Typography>
    <List>
      <ListItemButton onClick={() => setDeleteConfirmOpen(true)} sx={{ color: 'error.main' }}>
        <ListItemIcon><DeleteForeverOutlinedIcon color="error" /></ListItemIcon>
        <ListItemText primary="Delete Account" secondary="This action is permanent and cannot be undone" />
      </ListItemButton>
    </List>

    {/* --- Privacy Options Menu --- */}
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
    // ✅ FIX: Check the value within the privacySettings object
    selected={privacySettings[activePrivacySetting] === "everyone"}
  >
    <ListItemIcon>
      <PublicIcon fontSize="small" />
    </ListItemIcon>
    <ListItemText primary="Everyone" />
    {/* ✅ FIX: Use the same corrected condition here */}
    {privacySettings[activePrivacySetting] === "everyone" && (
      <CheckIcon fontSize="small" color="primary" />
    )}
  </MenuItem>

  <MenuItem
    onClick={() => handlePrivacyChange(activePrivacySetting, "friends")}
    // ✅ FIX: Check the value within the privacySettings object
    selected={privacySettings[activePrivacySetting] === "friends"}
  >
    <ListItemIcon>
      <PeopleOutlineIcon fontSize="small" />
    </ListItemIcon>
    <ListItemText primary="Friends" />
    {/* ✅ FIX: Use the same corrected condition here */}
    {privacySettings[activePrivacySetting] === "friends" && (
      <CheckIcon fontSize="small" color="primary" />
    )}
  </MenuItem>

  <MenuItem
    onClick={() => handlePrivacyChange(activePrivacySetting, "nobody")}
    // ✅ FIX: Check the value within the privacySettings object
    selected={privacySettings[activePrivacySetting] === "nobody"}
  >
    <ListItemIcon>
      <PersonOffOutlinedIcon fontSize="small" />
    </ListItemIcon>
    <ListItemText primary="Nobody" />
    {/* ✅ FIX: Use the same corrected condition here */}
    {privacySettings[activePrivacySetting] === "nobody" && (
      <CheckIcon fontSize="small" color="primary" />
    )}
  </MenuItem>
</Menu>

    {/* --- Delete Account Confirmation Dialog --- */}
    <Dialog
      open={deleteConfirmOpen} 
      onClose={() => setDeleteConfirmOpen(false)}      
  PaperProps={{
    sx: {
      borderRadius: 3,
      p: 2,
      minWidth: 320,
      backgroundColor: mode === "dark" ? "#00000000" : "#ffffff00",
      backgroundImage: "none",
      boxShadow: "none",
    },
  }}
  BackdropProps={{
    sx: {
      backdropFilter: "blur(8px)",
      backgroundColor: mode === "dark" ? "rgba(43, 43, 43, 0.5)" : "rgba(199, 199, 199, 0.2)",
    },
  }}
  transitionDuration={300}
  >
  <Box sx={{ textAlign: 'center', mb: 2, opacity: 0.7 }}>
    <Avatar sx={{ bgcolor: "#ff000044", mx: 'auto', width: 66, height: 66, p: 2 }}>
      <ChatIcon fontSize="large" sx={{ color: theme.palette.text.primary }} />
    </Avatar>
  </Box>

<DialogTitle
  sx={{
    textAlign: "center",
    fontWeight: "bold",
    pb: 1,
  }}
>
  Are you absolutely sure?
</DialogTitle>

<DialogContent
  sx={{
    textAlign: "center",
    px: 4,
    py: 2,
  }}
>
  <DialogContentText
    sx={{
      fontSize: "1rem",
      lineHeight: 1.6,
      color: "text.secondary",
    }}
  >
    This will permanently delete your account and all of your data, including
    trips, chats, and budgets.{" "}
    <strong style={{ color: "#c03f3fff" }}>This action cannot be undone.</strong>
  </DialogContentText>
</DialogContent>

  <DialogActions sx={{ justifyContent: 'center', gap: 2, pb: 2 }}>
    <Button
      variant="outlined"
      onClick={() => setDeleteConfirmOpen(false)}
      sx={{
        px: 3,
        textTransform: "none",
        borderColor: mode === "dark" ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.2)",
        color: theme.palette.text.primary,
        backdropFilter: "blur(4px)",
        borderRadius: 8,
        '&:hover': {
          backgroundColor: mode === "dark" ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)",
        },
      }}
    >
      Cancel
    </Button>
    <Button
      variant="contained"
      onClick={handleDeleteAccount}
      sx={{
        px: 3,
        textTransform: "none",
        backdropFilter: "blur(4px)",
        borderRadius: 8,
        backgroundColor: "#ff000044",
        boxShadow: "none",
        color: theme.palette.text.primary,
        '&:hover': {
          backgroundColor: "#ff000064",
        },
      }}
      autoFocus
    >
      Delete My Account
    </Button>
  </DialogActions>
    </Dialog>

  </Container>
)}

{drawerPage === "blockedContacts" && (
  <Container sx={{ mt: 5, mb: 2 }}>
    {/* Header */}
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
        <ArrowBackIcon />
      </IconButton>
      <Typography variant="h5" fontWeight="bold">
        Blocked Contacts
      </Typography>
    </Box>

    {/* Content */}
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
<Container sx={{ mt: 5, mb: 2 }}>
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
    <ArrowBackIcon />
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
  
  {/* --- Appearance Section --- */}
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

  {/* --- Chat History Section --- */}
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

        {/* Sample text preview */}
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

        {/* --- DYNAMIC WALLPAPER GRID --- */}
        <Grid container spacing={1}>
            {/* Map over the new, pre-filtered list */}
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
                            <CheckCircleIcon sx={{ position: 'absolute', top: 8, right: 8, color: 'primary.main', backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: '50%' }} />
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

        {/* --- Dialogs (No changes here) --- */}
<Dialog
  open={clearDialogOpen}
  onClose={() => setClearDialogOpen(false)}
  PaperProps={{
    sx: {
      borderRadius: 3,
      p: 2,
      minWidth: 320,
      backgroundColor: mode === "dark" ? "#00000000" : "rgba(255, 255, 255, 0.8)",
      backgroundImage: "none",
      boxShadow: "none",
    },
  }}
  BackdropProps={{
    sx: {
      backdropFilter: "blur(8px)",
      backgroundColor: mode === "dark" ? "rgba(43, 43, 43, 0.5)" : "rgba(0, 0, 0, 0.2)",
    },
  }}
  transitionDuration={300} // smooth fade
>
  <Box sx={{ textAlign: 'center', mb: 2, opacity: 0.7 }}>
    <Avatar sx={{ bgcolor: "#ff000044", mx: 'auto', width: 66, height: 66, p: 2 }}>
      <ChatIcon fontSize="large" sx={{ color: theme.palette.text.primary }} />
    </Avatar>
  </Box>

  <DialogTitle sx={{ fontWeight: 'bold', textAlign: 'center', color: theme.palette.text.primary }}>
    Clear All Chats?
  </DialogTitle>

  <DialogContent>
    <DialogContentText sx={{ color: theme.palette.text.secondary, textAlign: 'center', mb: 2 }}>
      Are you sure you want to clear all messages? This action cannot be undone.
    </DialogContentText>
    <Typography variant="body2" sx={{ color: theme.palette.text.secondary, textAlign: 'center' }}>
      Your chat list will remain, but all message history will be deleted. Please confirm before proceeding.
    </Typography>
  </DialogContent>

  <DialogActions sx={{ justifyContent: 'center', gap: 2, pb: 2 }}>
    <Button
      variant="outlined"
      onClick={() => setClearDialogOpen(false)}
      sx={{
        px: 3,
        textTransform: "none",
        borderColor: mode === "dark" ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.2)",
        color: theme.palette.text.primary,
        backdropFilter: "blur(4px)",
        borderRadius: 8,
        '&:hover': {
          backgroundColor: mode === "dark" ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)",
        },
      }}
    >
      Cancel
    </Button>
    <Button
      variant="contained"
      onClick={() => {
        console.log("Clearing all chats...");
        setClearDialogOpen(false);
      }}
      sx={{
        px: 3,
        textTransform: "none",
        backdropFilter: "blur(4px)",
        borderRadius: 8,
        backgroundColor: "#ff000044",
        boxShadow: "none",
        color: theme.palette.text.primary,
        '&:hover': {
          backgroundColor: "#ff000064",
        },
      }}
      autoFocus
    >
      Clear Chats
    </Button>
  </DialogActions>
</Dialog>


{/* Delete Chats Dialog */}
<Dialog
  open={deleteDialogOpen}
  onClose={() => setDeleteDialogOpen(false)}
  PaperProps={{
    sx: {
      borderRadius: 3,
      p: 2,
      minWidth: 320,
      backgroundColor: mode === "dark" ? "#00000000" : "rgba(255, 255, 255, 0.8)",
      backgroundImage: "none",
      boxShadow: "none",
    },
  }}
  BackdropProps={{
    sx: {
      backdropFilter: "blur(8px)",
      backgroundColor: mode === "dark" ? "rgba(43, 43, 43, 0.5)" : "rgba(0, 0, 0, 0.2)",
    },
  }}
  transitionDuration={300} // smooth fade
>
  <Box sx={{ textAlign: 'center', mb: 2 }}>
    <Avatar sx={{ bgcolor: theme.palette.error.main, mx: 'auto', opacity: 0.7, width: 66, height: 66, p: 0.5, boxShadow: "none" }}>
      <DeleteForeverIcon fontSize="large" />
    </Avatar>
  </Box>

  <DialogTitle sx={{ fontWeight: 'bold', textAlign: 'center', color: theme.palette.text.primary }}>
    Delete All Chats Permanently?
  </DialogTitle>

  <DialogContent>
    <DialogContentText sx={{ color: theme.palette.text.secondary, textAlign: 'center', mb: 2 }}>
      This will permanently delete all of your chats and messages. It cannot be undone.
    </DialogContentText>
    <Typography variant="body2" sx={{ color: theme.palette.error.main, textAlign: 'center', mb: 1 }}>
      Warning: This action is irreversible.
    </Typography>
    <Typography variant="caption" sx={{ color: theme.palette.text.secondary, textAlign: 'center' }}>
      Please ensure you have backed up any important information before proceeding. Once deleted, you will not be able to recover the data.
    </Typography>
  </DialogContent>

  <DialogActions sx={{ justifyContent: 'center', gap: 2, pb: 2 }}>
    <Button
      variant="outlined"
      onClick={() => setDeleteDialogOpen(false)}
      sx={{
        px: 3,
        borderRadius: 8,
        textTransform: "none",
        borderColor: mode === "dark" ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.2)",
        color: theme.palette.text.primary,
        backdropFilter: "blur(4px)",
        '&:hover': {
          borderColor: theme.palette.primary.main,
          backgroundColor: mode === "dark" ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)",
        },
      }}
    >
      Cancel
    </Button>
    <Button
      variant="contained"
      onClick={() => {
        console.log("Deleting all chats...");
        setDeleteDialogOpen(false);
      }}
      color="error"
      sx={{
        px: 3,
        textTransform: "none",
        backdropFilter: "blur(4px)",
        borderRadius: 8,
        '&:hover': {
          backgroundColor: theme.palette.error.dark,
        },
      }}
      autoFocus
    >
      Delete Permanently
    </Button>
  </DialogActions>
</Dialog>


    </Container>
)}

{drawerPage === "inviteFriend" && (
  <Container
    sx={{
      mt: 5,
      mb: 3,
      animation: "fadeIn 0.4s ease-in-out",
      "@keyframes fadeIn": { from: { opacity: 0 }, to: { opacity: 1 } },
      px: { xs: 2, sm: 3 },
    }}
  >
    {/* Header */}
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
        <ArrowBackIcon />
      </IconButton>
      <Typography variant="h5" fontWeight="700">
        Invite & Download
      </Typography>
    </Box>

    {/* --- App Download QR Code Section --- */}
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

    {/* --- Personal Invite Link Section --- */}
    {/* <Typography
      variant="subtitle1"
      fontWeight="700"
      sx={{ mb: 1.5, color: theme.palette.text.primary }}
    >
      Personal Invite Link
    </Typography>
    <Typography
      variant="body2"
      sx={{ mb: 2, color: theme.palette.text.secondary }}
    >
      Share your <b>personal invite link</b> so friends can instantly connect
      with you after downloading the app.
    </Typography>

    <TextField
      label="Your Profile Link"
      defaultValue={inviteLink}
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
      onClick={() => navigator.clipboard.writeText(inviteLink)}
      sx={{
        mb: 3,
        width: "100%",
        borderRadius: 2,
        py: 1.2,
        fontWeight: 600,
        textTransform: "none",
        bgcolor: theme.palette.primary.main,
        "&:hover": {
          bgcolor: theme.palette.primary.dark,
          transform: "translateY(-2px)",
        },
      }}
    >
      Copy Profile Link
    </Button> */}

    <Typography
      variant="subtitle1"
      sx={{ mb: 2, color: theme.palette.text.secondary }}
    >
      Share Invite Link via
    </Typography>

    {/* Share Buttons */}
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
  <Container sx={{ mt: 5, mb: 2 }}>
    {/* Header */}
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
        <ArrowBackIcon />
      </IconButton>
      <Typography variant="h5" fontWeight="bold">
        General Settings
      </Typography>
    </Box>

    {/* Settings List */}
    <List sx={{ mt: 2 }}>

  <ListItem sx={{ pb: 0 }}>
      <ListItemIcon sx={{ minWidth: 40 }}><Brightness4Icon sx={{ color: theme.palette.text.secondary }} /></ListItemIcon>
      <ListItemText primary="Theme" primaryTypographyProps={{ fontWeight: 'medium' }} />
      <FormControl size="small" sx={{ minWidth: 120 }}>
<Select
  value={mode} // Assumes 'mode' is your state variable ('light', 'dark', or 'system')
  onChange={(e) => {
    const newTheme = e.target.value;
    setMode(newTheme); // Your state setter
    // This part is crucial: if the user selects "system", you might need another effect
    // elsewhere to apply the correct theme based on their OS preference.
    // For now, we'll just set the mode to the selected value.
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
      gap: 1, // Adds space between icon and text
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
    <ListItemIcon><SettingsOutlinedIcon fontSize="small" /></ListItemIcon>
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
    <ListItemIcon><WbSunnyOutlinedIcon fontSize="small" /></ListItemIcon>
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
      gap: 1, // Adds space between icon and text
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
    <EditLocationOutlinedIcon fontSize="small" sx={{ mr: 1 }} />
    Manual
  </MenuItem>
</Select>
    </FormControl>
  </ListItem>

    </List>

    {/* Manual Location Input Field (shown only if manual mode is active) */}
    {settings.locationMode === "manual" && (
      <Box sx={{ px: 2, mt: 3 }}> {/* Added some top margin for spacing */}
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


    {/* Accent Color Selection Drawer */}
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

        {/* Accent Preview Button */}
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
        
        {/* Color Palette */}
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
      mt: 6,
      mb: 5,
      maxWidth: 700,
      borderRadius: 6,
    }}
  >
    {/* Back Button */}
    <Button
      startIcon={<ArrowBackIcon />}
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

    {/* Header */}
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

    {/* Version Card */}
<Button
  onClick={() => handleSetDrawerPage("appInfo")}
  fullWidth
  variant="contained"
  endIcon={
    <KeyboardArrowRightIcon
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
    <LayersOutlinedIcon
        sx={{
          fontSize: 24,
          transition: "transform 0.3s ease",
        }}
      />
    App Info
  </Box>
</Button>

    {/* About Text */}
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

    {/* Legal Links */}
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

    {/* Connect Section */}
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
            icon: <MailOutlinedIcon />,
            action: () => window.open("mailto:team.bunkmates@gmail.com"),
          },
          {
            icon: <InstagramIcon />,
            action: () =>
              window.open("https://www.instagram.com/bunkmates.app", "_blank"),
          },
          {
            icon: <YouTubeIcon />,
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

    {/* Open Source Section */}
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
      mt: 5,
      mb: 3,
      px: { xs: 2, sm: 3 },
      animation: "fadeIn 0.4s ease-in-out",
      "@keyframes fadeIn": { from: { opacity: 0 }, to: { opacity: 1 } },
    }}
  >
        <>
          {/* Header */}
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
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h5" fontWeight="700">
              App Info
            </Typography>
          </Box>

          {/* App Logo and Info */}
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

          {/* Version Details */}
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

              {/* Build ID with tap handler */}
<ListItem
  disableGutters
  sx={{
    py: 0.5,
    transition: "all 0.2s ease",
    "&:active": { transform: "scale(0.98)" },
  }}
  onClick={handleBuildTap} // ✅ Correct syntax
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

          {/* Developer Features Option */}
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
                  <LayersOutlinedIcon
                    sx={{ color: theme.palette.text.secondary }}
                  />
                </ListItemIcon>
                <ListItemText
                  primary="Testing Features & Other Routes"
                  primaryTypographyProps={{ fontWeight: 500 }}
                />
                <KeyboardArrowRightIcon
                  sx={{ color: theme.palette.text.secondary }}
                />
              </ListItemButton>
            </ListItem>
          )}

          {/* Third-Party Licenses Link */}
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
                <InfoOutlinedIcon sx={{ color: theme.palette.text.secondary }} />
              </ListItemIcon>
              <ListItemText
                primary="Third-Party Licenses & Attributions"
                primaryTypographyProps={{ fontWeight: 500 }}
              />
              <KeyboardArrowRightIcon sx={{ color: theme.palette.text.secondary }} />
            </ListItemButton>
          </ListItem>

          {/* Footer */}
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

          {/* Developer Passkey Dialog */}
          <Dialog
            open={showDevDialog}
            onClose={() => setShowDevDialog(false)}
            PaperProps={{ sx: { borderRadius: 3, p: 1.5 } }}
          >
            <DialogTitle>Enter Developer Passkey</DialogTitle>
            <DialogContent>
              <TextField
                autoFocus
                margin="dense"
                label="Developer Key"
                type="text"
                fullWidth
                variant="outlined"
                value={enteredKey}
                onChange={(e) => setEnteredKey(e.target.value)}
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setShowDevDialog(false)}>Cancel</Button>
              <Button variant="contained" onClick={handleVerifyDevKey}>
                Verify
              </Button>
            </DialogActions>
          </Dialog>
        </>
  </Container>
)}

{drawerPage === "featuresChangelog" && (
  <Container sx={{ mt: 5, mb: 2 }}>
    {/* Back Button */}
    <Button
      startIcon={<ArrowBackIcon />}
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

    {/* Title */}
    <Typography variant="h5" gutterBottom>
      <h2>Third-Party Licenses & Attributions</h2>
    </Typography>

    {/* Overview Intro */}
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

    {/* Library Overview */}
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

    {/* License Sections */}
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

    {/* Footer Note */}
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
  <Container sx={{ mt: 5, mb: 2 }}>
    <Button
      startIcon={<ArrowBackIcon />}
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
  <Container sx={{ mt: 4, mb: 3 }}>
    {/* Title */}
<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
  {!isEditing ? (
    <>
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        flexDirection: "row"
      }}
    >
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
        <ArrowBackIcon />
      </IconButton>
  <Typography variant="h5" fontWeight="bold">
    Profile
  </Typography>
  </Box>
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
  {/* --- AVATAR & UPLOAD BUTTON --- */}
  <Box
    sx={{
      position: "relative",
      mb: 2,
    }}
  >
    {/* Avatar now opens the full-screen dialog on click */}
    <Avatar
      src={userData.photoURL || ""}
      alt={userData.name}
      sx={{ 
        width: 180, 
        height: 180, 
        mb: 2, 
        borderRadius: 12, 
        boxShadow: 3,
        cursor: 'pointer', // Add cursor to indicate it's clickable
        transition: 'transform 0.2s ease-in-out',
        '&:hover': {
          transform: 'scale(1.05)',
        }
      }}
      onClick={() => setProfilePicOpen(true)}
    />
    
    {/* Upload button remains the same */}
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
        {/* View Mode */}
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", mb: 3, position: "relative" }}>
          <>
  {/* --- Your Existing Avatar Code (with onClick added) --- */}
  <Box sx={{ display: "flex", opacity: profilePicOpen ? 0 : 1, flexDirection: "column", alignItems: "center", mb: 3, position: "relative" }}>
    <Avatar
      src={viewData?.photoURL || ""}
      sx={{
        width: 110,
        height: 110,
        cursor: 'pointer', // Make it look clickable
        transition: 'transform 0.2s ease',
        '&:hover': {
          transform: 'scale(1.05)',
        },
      }}
      onClick={() => setProfilePicOpen(true)} // This opens the dialog
    />
    {userData.type && (
      <Box sx={{ position: "absolute", bottom: -10, right: "calc(30% - 10%)", zIndex: 10 }}>
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
  </Box>
</>
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

      {/* --- Full-Screen Profile Picture Dialog --- */}
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
    {/* Avatar / QR Container */}
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
            {/* Avatar + Edit Button */}
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
              <EditOutlinedIcon fontSize="small" />
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

    {/* Bottom Action Buttons */}
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
          { icon: <ShareOutlinedIcon />, label: "Share profile", delay: 400, handler: handleShare },
          { icon: <ContentCopyOutlinedIcon />, label: "Copy link", delay: 500, handler: handleCopyLink },
          { icon: <QrCode2OutlinedIcon />, label: "QR code", delay: 600, handler: () => setViewMode("qr") },
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
          {/* Back Button */}
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
            <ArrowBackIcon />
          </IconButton>

          {/* Download Button */}
          <IconButton
            onClick={async () => {
  const node = document.getElementById("profile-card");
  if (!node) {
    console.error("Profile card element not found!");
    return;
  }

  try {
    // Generate the image as a data URL
    const dataUrl = await toPng(node);
    const filename = `${userData.username}-profile.png`;

    // Check if the app is running in the native WebView and has our new function
    if (window.nativeBridge && typeof window.nativeBridge.downloadBase64 === 'function') {
      // Extract the base64 part of the data URL
      const base64Data = dataUrl.split(',')[1];
      // Call the native function to handle the download
      window.nativeBridge.downloadBase64(base64Data, filename);
    } else {
      // Fallback for regular web browsers
      const link = document.createElement("a");
      link.download = filename;
      link.href = dataUrl;
      link.click();
    }
  } catch (error) {
    console.error('Error generating or downloading image:', error);
    // Optionally, show a snackbar or alert for the error
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
            <DownloadOutlinedIcon />
          </IconButton>
        </>
      )}
    </Box>

    {/* Snackbar */}
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
  <Container sx={{ mt: 5, mb: 4 }}>
    {/* Back Button */}
    <Button
      startIcon={<ArrowBackIcon />}
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
        For urgent issues, email us at <a href="mailto:team.bunkmates@gmail.com" style={{ color: "#888888ff" }}>team.bunkmates@gmail.com</a>
      </Typography>
    </Box>
  </Container>
)}

{drawerPage === "adduser" && (
  <>
    <Box sx={{ p: 2, mt: 3 }}>
      {/* --- Header --- */}
      <Box sx={{ display: "flex", alignItems: "center", flexDirection: "row", mb: 2 }}>
        <IconButton
          onClick={() => navigate(-1)}
          sx={{
            mr: 2, borderRadius: 8, color: theme.palette.text.primary,
            backgroundColor: mode === "dark" ? "#f1f1f111" : "#e0e0e071",
            '&:hover': { backgroundColor: "#f1f1f121" },
          }}
        >
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h5" fontWeight="bold">QR Code</Typography>
      </Box>

      {/* --- Tab Selector --- */}
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

    {/* --- Swipeable Content Area --- */}
    <Box {...swipeHandlers} sx={{ position: 'relative', overflow: 'hidden', minHeight: '80vh' }}>
      
      {/* --- My Code View (with Slide animation) --- */}
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

      {/* --- Scan Code View (with Slide animation) --- */}
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

    {/* --- Scanned User Profile Dialog --- */}
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
      {/* Avatar with floating effect */}
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

      {/* Card */}
      <Card
        sx={{
          width: "100%",
          maxWidth: 300,
          bgcolor: mode === "dark" ? "#1F1F1Fbb" : "#ffffffbb",
          borderRadius: 6,
          p: 3,
          pt: 7, // push content for avatar overlap
          textAlign: "center",
          boxShadow: "none",
          backdropFilter: "blur(14px)",
        }}
      >
        {/* Name + username */}
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

        {/* Bio */}
        <Typography
          variant="body2"
          sx={{ color: "text.secondary", my: 2 }}
        >
          {scannedUserData.bio || "This user hasn’t added a bio yet."}
        </Typography>

        {/* Action */}
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
      mt: 5,
      mb: 4,
      px: { xs: 2, sm: 3 },
      animation: "fadeIn 0.4s ease-in-out",
      "@keyframes fadeIn": { from: { opacity: 0 }, to: { opacity: 1 } },
    }}
  >
    {/* Header */}
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
        <ArrowBackIcon />
      </IconButton>
      <Typography variant="h5" fontWeight="700">
        Developer Tools
      </Typography>
    </Box>

    {/* Developer Section Info */}
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

    {/* Feature List */}
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
            <KeyboardArrowRightIcon
              sx={{ color: theme.palette.text.secondary }}
            />
          </ListItem>
        ))}
      </List>
    </Box>

    {/* Other Routes */}
    {/* <Box
      sx={{
        borderRadius: 4,
        backgroundColor:
          mode === "dark"
            ? "#ffffff08"
            : alpha(theme.palette.primary.main, 0.02),
        p: 2,
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
        Other Developer Routes
      </Typography>

      <List disablePadding>
        {[
          {
            label: "Firestore Playground",
            description: "Temporary Firestore data editor & viewer.",
            action: () => navigate("/developer/firestore-playground"),
          },
          {
            label: "Notifications Preview",
            description: "Preview app notification styles and types.",
            action: () => navigate("/developer/notifications"),
          },
          {
            label: "UI Components Showcase",
            description: "Showcase of custom Material UI component variants.",
            action: () => navigate("/developer/ui-demo"),
          },
          {
            label: "Error Boundary Test",
            description: "Trigger runtime errors to test recovery screens.",
            action: () => navigate("/developer/error-test"),
          },
        ].map((route, idx) => (
          <ListItem
            key={idx}
            sx={{
              mb: 1.2,
              borderRadius: 3,
              transition: "all 0.2s ease",
              "&:hover": {
                bgcolor: alpha(theme.palette.primary.main, 0.06),
                transform: "scale(1.01)",
              },
            }}
            onClick={route.action}
          >
            <ListItemText
              primary={route.label}
              secondary={route.description}
              primaryTypographyProps={{
                fontWeight: 600,
                color: theme.palette.text.primary,
              }}
              secondaryTypographyProps={{
                color: theme.palette.text.secondary,
                fontSize: "0.85rem",
              }}
            />
            <KeyboardArrowRightIcon
              sx={{ color: theme.palette.text.secondary }}
            />
          </ListItem>
        ))}
      </List>
    </Box> */}

    {/* Footer */}
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


</Drawer>

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

<Dialog
  open={showDevDialog}
  onClose={() => setShowDevDialog(false)}
  PaperProps={{
    sx: {
      borderRadius: 4,
      p: 2,
      background: mode === "dark"
        ? "linear-gradient(180deg, #0a0a0a55 0%, #1212124b 100%)"
        : "linear-gradient(180deg, #fafafa96 0%, #f0f0f09d 100%)",
      boxShadow: "none",
      backdropFilter: "blur(20px)",
      width: "100%",
      maxWidth: 400,
    },
  }}
  TransitionProps={{
    timeout: 400,
  }}
>
  {/* Header */}
  <DialogTitle
    sx={{
      textAlign: "center",
      fontWeight: 700,
      letterSpacing: 0.4,
      fontSize: "1.25rem",
      color: theme.palette.primary.main,
      mb: 1,
    }}
  >
    Enter Developer Passkey
  </DialogTitle>

  {/* Subtitle */}
  <Typography
    variant="body2"
    sx={{
      textAlign: "center",
      color: theme.palette.text.secondary,
      mb: 2,
      mx: 2,
    }}
  >
    This access is restricted to authorized developers only.
  </Typography>

  {/* Input Field */}
  <DialogContent>
    <TextField
      autoFocus
      margin="dense"
      label="Developer Key"
      type="text"
      variant="outlined"
      fullWidth
      value={enteredKey}
      onChange={(e) => setEnteredKey(e.target.value)}
      sx={{
        "& .MuiOutlinedInput-root": {
          borderRadius: 3,
          "&:hover fieldset": {
            borderColor: theme.palette.primary.main,
          },
          "&.Mui-focused fieldset": {
            borderColor: theme.palette.primary.main,
            boxShadow: "none",
          },
        },
        input: {
          color: theme.palette.text.primary,
          letterSpacing: 0.5,
        },
      }}
    />
  </DialogContent>

  {/* Action Buttons */}
  <DialogActions
    sx={{
      display: "flex",
      justifyContent: "space-between",
      px: 3,
      pb: 2,
    }}
  >
    <Button
      onClick={() => setShowDevDialog(false)}
      sx={{
        borderRadius: 3,
        textTransform: "none",
        fontWeight: 500,
        color: theme.palette.text.secondary,
        "&:hover": {
          color: theme.palette.primary.main,
          backgroundColor:
            mode === "dark"
              ? "rgba(255,255,255,0.05)"
              : "rgba(0,0,0,0.04)",
        },
      }}
    >
      Cancel
    </Button>
    <Button
      variant="contained"
      onClick={handleVerifyDevKey}
      sx={{
        borderRadius: 3,
        textTransform: "none",
        fontWeight: 600,
        px: 3,
        py: 0.8,
        background: theme.palette.primary.main,
        boxShadow: mode === "dark"
          ? "0 0 15px rgba(0,255,200,0.4)"
          : "0 0 15px rgba(25,118,210,0.4)",
        "&:hover": {
          background: theme.palette.primary.dark,
          transform: "scale(1.03)",
          transition: "0.25s ease",
        },
      }}
    >
      Verify
    </Button>
  </DialogActions>
</Dialog>


</>
</ThemeProvider>
    );
};

export default ProfilePic;
