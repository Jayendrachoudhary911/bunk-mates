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
import InstagramIcon from "@mui/icons-material/Instagram";
import YouTubeIcon from "@mui/icons-material/YouTube";
import LayersOutlinedIcon from '@mui/icons-material/LayersOutlined';
import EngineeringOutlinedIcon from '@mui/icons-material/EngineeringOutlined'
import NotificationsNoneOutlinedIcon from '@mui/icons-material/NotificationsNoneOutlined';

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

</Box>

</>
</ThemeProvider>
    );
};

export default ProfilePic;
