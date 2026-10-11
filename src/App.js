import React, { useEffect, Suspense, lazy } from "react";
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { messaging } from './firebase';
import { getToken, onMessage } from 'firebase/messaging';
import { Box, CircularProgress, useMediaQuery, useTheme } from "@mui/material";
import "./App.css";
import 'leaflet/dist/leaflet.css';

// Contexts & Hooks
import { UserProvider, useUser } from './contexts/UserContext';
import { WeatherProvider } from "./contexts/WeatherContext";
import { SettingsProvider } from "./contexts/SettingsContext";
import { ThemeToggleProvider, useThemeToggle } from './contexts/ThemeToggleContext';
import { BackgroundProvider } from "./contexts/BackgroundContext";
import { DesktopPanelProvider } from "./contexts/DesktopPanelContext";

// Desktop Layout Components
import DesktopWorkspace from "./components/DesktopWorkspace";
import BottomNavBar from './components/BottomNavBar';

// Lazy Loaded Pages and Components for Performance & Code Splitting
const Home = lazy(() => import("./pages/Home"));
const AuthPage = lazy(() => import("./auth/AuthPage"));
const Profile = lazy(() => import("./pages/Profile"));
const ChatWorkspace = lazy(() => import("./components/ChatWorkspace"));
const Budgetmngr = lazy(() => import("./pages/Budget"));
const Reminders = lazy(() => import("./pages/Reminders"));
const Notes = lazy(() => import("./pages/Notes"));
const NoteDetail = lazy(() => import("./notes_components/NoteDetail"));
const NoteWorkspace = lazy(() => import("./notes_components/NoteWorkspace"));
const Waitlist = lazy(() => import("./pages/Wishlist"));
const Trips = lazy(() => import("./pages/Trips"));
const JoinTrip = lazy(() => import("./invites/JoinTrip"));
const SearchPage = lazy(() => import("./pages/Search"));
const Homepage = lazy(() => import("./pages/Homepage"));
const TravelAI = lazy(() => import("./pages/TravelAI"));
const TripDetails = lazy(() => import("./components/TripDetails"));
const PrivacyPolicy = lazy(() => import("./components/PrivacyPolicy"));
const TermsAndConditions = lazy(() => import("./components/TermsAndConditions"));
const CommunityPage = lazy(() => import("./components/CommunityPage"));
const GroupInvitePage = lazy(() => import("./components/GroupInvitePage"));
const Notifications = lazy(() => import("./components/Notifications"));
const ForgotPassword = lazy(() => import("./auth/ForgotPassword"));
const ResetPassword = lazy(() => import("./auth/ResetPassword"));
const AccountDeletionPolicy = lazy(() => import("./components/AccountDeletionPolicy"));
const GroupList = lazy(() => import("./components/DevBeta/GroupList"));


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
  const location = useLocation();

  if (loading) {
    return null;
  }

  if (user) {
    const isWelcoming = sessionStorage.getItem("bunkmates_auth_welcome") === "true";
    if (isWelcoming) {
      if (!location.pathname.startsWith("/auth/continue")) {
        return <Navigate to="/auth/continue" replace />;
      }
      return children;
    }

    return <Navigate to="/" replace />;
  }
  return children;
};


// --- Main Layout ---
function AppContent() {
  const location = useLocation();
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));

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

  // Final decision: mobile-only
  const showBottomNav =
    !isDesktop && ((isAllowedMobileRoute && !isExplicitlyHiddenRoute) || isQuizMobileRoute);

  // Fallback loader during chunk downloads
  const PageLoader = (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "70vh",
        width: "100%",
      }}
    >
      <CircularProgress size={38} thickness={3.8} sx={{ color: "primary.main" }} />
    </Box>
  );

  return (
    <DesktopWorkspace>
      {/* MOBILE BOTTOM NAV ONLY */}
      {showBottomNav && !isAuthRoute && (
        <BottomNavBar />
      )}

      <Suspense fallback={PageLoader}>
        <Routes>
          {/* Protected Routes (Requires Active Session) */}
          <Route path="/" element={<RequireAuth><Home /></RequireAuth>} />
          <Route path="/home" element={<RequireAuth><Home /></RequireAuth>} />
          <Route path="/notes" element={<RequireAuth><Notes /></RequireAuth>} />
          <Route path="/notes/:id" element={<RequireAuth><NoteDetail /></RequireAuth>} />
          <Route path="/notes/:id/workspace" element={<RequireAuth><NoteWorkspace /></RequireAuth>} />
          <Route path="/notes/new/workspace" element={<RequireAuth><NoteWorkspace /></RequireAuth>} />
          <Route path="/trips" element={<RequireAuth><Trips /></RequireAuth>} />
          <Route path="/chats" element={<RequireAuth><ChatWorkspace /></RequireAuth>} />
          <Route path="/chat/:friendId" element={<RequireAuth><ChatWorkspace /></RequireAuth>} />
          <Route path="/group/:groupName" element={<RequireAuth><ChatWorkspace /></RequireAuth>} />
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
          <Route path="/forgot-password" element={<RestrictAuthForLoggedIn><ForgotPassword /></RestrictAuthForLoggedIn>} />
          <Route path="/reset-password" element={<RestrictAuthForLoggedIn><ResetPassword /></RestrictAuthForLoggedIn>} />

          {/* Other routes remain accessible or protected as needed */}
          <Route path="/grouplists" element={<RequireAuth><GroupList /></RequireAuth>} />
          <Route path="/trips/:id" element={<RequireAuth><TripDetails /></RequireAuth>} />
          <Route path="/join" element={<JoinTrip />} />
          <Route path="/group-invite/:inviteToken" element={<GroupInvitePage />} />
          <Route path="/waitlist" element={<Waitlist />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsAndConditions />} />
          <Route path="/community" element={<CommunityPage />} />
          <Route path="/notifications" element={<RequireAuth><Notifications /></RequireAuth>} />
          <Route path="/account-deletion-policy" element={<AccountDeletionPolicy />} />
        </Routes>
      </Suspense>
    </DesktopWorkspace>
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
              <DesktopPanelProvider>
                <Router>
                  <AppContent />
                </Router>
              </DesktopPanelProvider>
            </UserProvider>
          </WeatherProvider>
        </SettingsProvider>
      </ThemeToggleProvider>
    </BackgroundProvider>
  );
}

export default App;