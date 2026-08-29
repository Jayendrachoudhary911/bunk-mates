import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate, Navigate } from "react-router-dom";
import { messaging } from './firebase';
import { getToken, onMessage } from 'firebase/messaging';
import { Box, useMediaQuery } from "@mui/material";
import "./App.css";
import 'leaflet/dist/leaflet.css';

// Contexts & Hooks
import { UserProvider, useUser } from './contexts/UserContext';
import { WeatherProvider } from "./contexts/WeatherContext";
import { SettingsProvider } from "./contexts/SettingsContext";
import { ThemeToggleProvider, useThemeToggle } from './contexts/ThemeToggleContext';
import { BackgroundProvider } from "./contexts/BackgroundContext";
// Pages
import AuthPage from "./auth/AuthPage";
import Home from "./pages/Home";
import Profile from "./pages/Profile";
import Chats from "./pages/Chats";
import Budgetmngr from "./pages/Budget";
import Reminders from "./pages/Reminders";
import Notes from "./pages/Notes";
import NoteDetail from "./notes_components/NoteDetail";
import NoteWorkspace from "./notes_components/NoteWorkspace";
import Waitlist from "./pages/Wishlist";
import Trips from "./pages/Trips";
import JoinTrip from "./invites/JoinTrip";
import SearchPage from "./pages/Search";
import Homepage from "./pages/Homepage";

// Components
import BottomNavBar from './components/BottomNavBar';
import ProtectedRoute from "./components/ProtectedRoute";
import Chatroom from "./components/Chatroom";
import GroupChat from "./components/GroupChat";
import TripDetails from "./components/TripDetails";
import PrivacyPolicy from "./components/PrivacyPolicy";
import TermsAndConditions from "./components/TermsAndConditions";
import CommunityPage from "./components/CommunityPage";
import GroupInvitePage from "./components/GroupInvitePage";
import Notifications from "./components/Notifications";
import ForgotPassword from "./components/ForgotPassword";
import ResetPassword from "./components/ResetPassword";
import HourlyForecast from "./components/Weather/WeatherPage";
import WeatherDebugPage from "./components/Weather/WeatherMap";
import AccountDeletionPolicy from "./components/AccountDeletionPolicy";
import BunkMatesSocialFeed from "./components/BunkMatesSocialFeed";
import GroupDevChats from "./components/DevBeta/GroupChats";
import GroupList from "./components/DevBeta/GroupList";
import OtpLogin from "./components/DevBeta/OtpLogin";
import NewNotes from "./components/DevBeta/Notes";
import UsersMap from "./pages/MapsPage";
import TravelAI from "./pages/TravelAI";


const vapidKey = 'BA3kLicUjBzLvrGk71laA_pRVYsf6LsGczyAzF-NTBWEmOE3r4_OT9YiVt_Mvzqm7dZCoPnht84wfX-WRzlaSLs';

// --- Messaging Logic ---
export const requestPermission = async () => {
  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      const token = await getToken(messaging, { vapidKey });
      console.log('FCM Token:', token);
    }
  } catch (err) {
    console.error('Error getting permission or token:', err);
  }
};

onMessage(messaging, (payload) => {
  console.log('Foreground message received:', payload);
});

// --- Theme Style Injection ---
function BodyBackgroundSetter() {
  const { mode } = useThemeToggle();
  useEffect(() => {
    document.body.style.backgroundColor = mode === "dark" ? "#0c0c0c" : "#f1f1f1";
    document.body.style.setProperty('--slick-dot-color', mode === "dark" ? "#888" : "#bbb");
    document.body.style.setProperty('--slick-dot-active-color', mode === "dark" ? "#ffffff" : "#000000");
  }, [mode]);
  return null;
}

const RequireAuth = ({ children }) => {
  const { user, loading } = useUser();
  const location = useLocation();

  if (loading) {
    return null; // Or return a sleek loading spinner/skeleton here
  }

  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }
  return children;
};

const RestrictAuthForLoggedIn = ({ children }) => {
  const { user, loading } = useUser();

  if (loading) {
    return null;
  }

  if (user) {
    return <Navigate to="/" replace />;
  }
  return children;
};

// --- Guard ---
const DeveloperRoute = ({ children }) => {
  const navigate = useNavigate();
  const isDeveloper = localStorage.getItem("isDeveloper") === "true";
  useEffect(() => {
    if (!isDeveloper) {
      alert("🚫 Access denied. Developer Mode required!");
      navigate("/");
    }
  }, [isDeveloper, navigate]);
  return isDeveloper ? children : null;
};

// --- Main Three-Column Layout ---
function AppContent() {
  const location = useLocation();
  const { mode } = useThemeToggle();

  const isDesktop = useMediaQuery("(min-width:1024px)");
  const isWide = useMediaQuery("(min-width:1440px)");
  const [isExpanded, setIsExpanded] = useState(true);

  /* -------------------------------
     MOBILE BOTTOM NAV VISIBILITY
  -------------------------------- */

  // Routes where BottomNav SHOULD appear on mobile
  const MOBILE_BOTTOM_NAV_ROUTES = [
    "/",
    "/search",
    "/notes",
    "/trips",
    "/chats",
    "/profile",
  ];

  const QUIZ_MOBILE_BOTTOM_NAV_ROUTES = [
    "/quiz-round/home",
    "/quiz-round/search",
    "/quiz-round/notes",
    "/quiz-round/trips",
    "/quiz-round/chats",
    "/quiz-round/profile",
  ];

  // Routes where BottomNav should NEVER appear
  const HIDE_BOTTOM_NAV_PREFIXES = [
    "/auth",
    "/login",
    "/signup",
    "/forgot-password",
    "/reset-password",
    "/chat/",
    "/group/",
    "/developer",
    "/join",
    "/privacy-policy",
    "/terms",
    "/account-deletion-policy",
  ];

  const isAllowedMobileRoute =
    MOBILE_BOTTOM_NAV_ROUTES.includes(location.pathname);
  
  const isQuizMobileRoute =
    QUIZ_MOBILE_BOTTOM_NAV_ROUTES.includes(location.pathname);

  const isExplicitlyHiddenRoute =
    HIDE_BOTTOM_NAV_PREFIXES.some((path) =>
      location.pathname.startsWith(path)
    );

  const isAuthRoute =
    location.pathname.startsWith("/auth") ||
    location.pathname.startsWith("/login") ||
    location.pathname.startsWith("/signup") ||
    location.pathname.startsWith("/forgot-password") ||
    location.pathname.startsWith("/reset-password");

  // Final decision
  const showBottomNav =
    !isDesktop && isAllowedMobileRoute && !isExplicitlyHiddenRoute || isQuizMobileRoute;

  /* -------------------------------
     RIGHT COLUMN LOGIC
  -------------------------------- */
  const showRightCol =
    isWide && ["/", "/trips"].includes(location.pathname);

  return (
    <Box sx={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      
      {/* MOBILE BOTTOM NAV ONLY */}
      {showBottomNav && !isAuthRoute && (
        <BottomNavBar
          isExpanded={isExpanded}
          setIsExpanded={setIsExpanded}
        />
      )}


      {/* MAIN CONTENT WRAPPER */}
      <Box
        sx={{
          display: "flex",
          flexGrow: 1,
          pl: isDesktop && !isAuthRoute ? (isExpanded ? "72px" : "88px") : 0,
          width: "100%",
          height: "100%",
          transition: "padding-left 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        {/* MAIN COLUMN */}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            height: "100%",
            overflowY: "auto",
            position: "relative",
            pb: isAuthRoute ? 0 : (showBottomNav ? "96px" : "40px"),
            scrollbarWidth: "none",
            "&::-webkit-scrollbar": { display: "none" },
          }}
        >
<Routes>
            {/* Protected Routes (Requires Active Session) */}
            <Route path="/" element={<RequireAuth><Home /></RequireAuth>} />
            <Route path="/home" element={<RequireAuth><Home /></RequireAuth>} />
            <Route path="/notes" element={<RequireAuth><Notes /></RequireAuth>} />
            <Route path="/notes/:id" element={<RequireAuth><NoteDetail /></RequireAuth>} />
            <Route path="/notes/:id/workspace" element={<RequireAuth><NoteWorkspace /></RequireAuth>} />
            <Route path="/notes/new/workspace" element={<RequireAuth><NoteWorkspace /></RequireAuth>} />
            <Route path="/trips" element={<RequireAuth><Trips /></RequireAuth>} />
            <Route path="/chats" element={<RequireAuth><Chats /></RequireAuth>} />
            <Route path="/search" element={<RequireAuth><SearchPage /></RequireAuth>} />
            <Route path="/profile" element={<RequireAuth><Profile /></RequireAuth>} />
            <Route path="/travel-ai" element={<RequireAuth><TravelAI /></RequireAuth>} />
            <Route path="/home-dummy" element={<RequireAuth><Homepage /></RequireAuth>} />
            <Route path="/budget-mngr" element={<RequireAuth><Budgetmngr /></RequireAuth>} />
            <Route path="/reminders" element={<RequireAuth><Reminders /></RequireAuth>} />

            {/* Auth Routes (Restricted when Session is Active) */}
            <Route path="/auth/*" element={<RestrictAuthForLoggedIn><AuthPage /></RestrictAuthForLoggedIn>} />
            <Route path="/signup" element={<Navigate to="/auth/signup" replace />} />
            <Route path="/login" element={<Navigate to="/auth/login" replace />} />

            {/* Other routes remain accessible or protected as needed */}
            <Route path="/grouplists" element={<RequireAuth><GroupList /></RequireAuth>} />
            <Route path="/chat/:friendId" element={<RequireAuth><Chatroom /></RequireAuth>} />
            <Route path="/group/:groupName" element={<RequireAuth><GroupChat /></RequireAuth>} />
            <Route path="/trips/:id" element={<RequireAuth><TripDetails /></RequireAuth>} />
            <Route path="/join" element={<JoinTrip />} />
            <Route path="/group-invite/:inviteToken" element={<GroupInvitePage />} />
            <Route path="/waitlist" element={<Waitlist />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/terms" element={<TermsAndConditions />} />
            <Route path="/community" element={<CommunityPage />} />
            <Route path="/notifications" element={<RequireAuth><Notifications /></RequireAuth>} />
            <Route path="/forgot-password" element={<RestrictAuthForLoggedIn><ForgotPassword /></RestrictAuthForLoggedIn>} />
            <Route path="/reset-password" element={<RestrictAuthForLoggedIn><ResetPassword /></RestrictAuthForLoggedIn>} />
            <Route path="/account-deletion-policy" element={<AccountDeletionPolicy />} />
          </Routes>
        </Box>

        {/* RIGHT COLUMN (optional widgets) */}
        {showRightCol && (
          <Box sx={{ width: 360, borderLeft: "1px solid #eee" }}>
            {/* contextual widgets */}
          </Box>
        )}
      </Box>
    </Box>
  );
}


// --- App Root ---
function App() {
  return (
  
  <BackgroundProvider>
    <ThemeToggleProvider>
      <BodyBackgroundSetter />
      <SettingsProvider>
        <WeatherProvider>
          <UserProvider>
            <Router>
              <AppContent />
            </Router>
          </UserProvider>
        </WeatherProvider>
      </SettingsProvider>
    </ThemeToggleProvider>
  </BackgroundProvider>
  );
}

export default App;