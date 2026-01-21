import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { messaging } from './firebase';
import { getToken, onMessage } from 'firebase/messaging';
import { Box, useMediaQuery, Typography } from "@mui/material";
import "./App.css";
import 'leaflet/dist/leaflet.css';

// Contexts & Hooks
import { UserProvider } from './contexts/UserContext';
import { WeatherProvider } from "./contexts/WeatherContext";
import { SettingsProvider } from "./contexts/SettingsContext";
import { ThemeToggleProvider, useThemeToggle } from './contexts/ThemeToggleContext';
import { BackgroundProvider } from "./contexts/BackgroundContext";
// Pages
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import Home from "./pages/Home";
import Profile from "./pages/Profile";
import Chats from "./pages/Chats";
import Budgetmngr from "./pages/Budget";
import Reminders from "./pages/Reminders";
import Notes from "./pages/Notes";
import Waitlist from "./pages/Wishlist";
import Trips from "./pages/Trips";
import JoinTrip from "./pages/JoinTrip";
import SearchPage from "./pages/Search";

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

  // Routes where BottomNav should NEVER appear
  const HIDE_BOTTOM_NAV_PREFIXES = [
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

  const isExplicitlyHiddenRoute =
    HIDE_BOTTOM_NAV_PREFIXES.some((path) =>
      location.pathname.startsWith(path)
    );

  // Final decision
  const showBottomNav =
    !isDesktop && isAllowedMobileRoute && !isExplicitlyHiddenRoute;

  /* -------------------------------
     RIGHT COLUMN LOGIC
  -------------------------------- */
  const showRightCol =
    isWide && ["/", "/trips"].includes(location.pathname);

  return (
    <Box sx={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      
      {/* MOBILE BOTTOM NAV ONLY */}
      {showBottomNav && (
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
          pl: isDesktop ? (isExpanded ? "72px" : "88px") : 0,
          width: "100%",
          height: "100%",
          transition: "margin-left 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
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
            pb: showBottomNav ? "96px" : "40px",
            scrollbarWidth: "none",
            "&::-webkit-scrollbar": { display: "none" },
          }}
        >
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/notes" element={<Notes />} />
            <Route path="/trips" element={<Trips />} />
            <Route path="/chats" element={<Chats />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/profile" element={<Profile />} />

            <Route path="/budget-mngr" element={<Budgetmngr />} />
            <Route path="/reminders" element={<Reminders />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/login" element={<Login />} />
            <Route path="/grouplists" element={<GroupList />} />

            <Route path="/chat/:friendId" element={<Chatroom />} />
            <Route path="/group/:groupName" element={<GroupChat />} />
            <Route path="/developer/group/:groupName" element={<GroupDevChats />} />
            <Route path="/trips/:id" element={<TripDetails />} />

            <Route path="/join" element={<JoinTrip />} />
            <Route path="/group-invite/:inviteToken" element={<GroupInvitePage />} />
            <Route path="/waitlist" element={<Waitlist />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/terms" element={<TermsAndConditions />} />
            <Route path="/community" element={<CommunityPage />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/account-deletion-policy" element={<AccountDeletionPolicy />} />
            <Route path="/developer/bunkmates/social" element={<BunkMatesSocialFeed />} />

            <Route
              path="/developer/waether-forecast"
              element={
                <DeveloperRoute>
                  <HourlyForecast />
                </DeveloperRoute>
              }
            />
            <Route
              path="/developer/weather"
              element={
                <DeveloperRoute>
                  <WeatherDebugPage />
                </DeveloperRoute>
              }
            />
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