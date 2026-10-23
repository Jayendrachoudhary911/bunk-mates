import React, { useEffect, Suspense, lazy } from "react";
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { messaging } from './firebase';
import { getToken, onMessage } from 'firebase/messaging';
import { Box, useMediaQuery, useTheme } from "@mui/material";
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
const SavedTrips = lazy(() => import("./pages/SavedTripsPage"));
const CreateTripPage = lazy(() => import("./pages/CreateTripPage"));
const QrMobileApprove = lazy(() => import("./auth/QrMobileApprove"));


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
    "/trips/create",
    "/create-trip",
    "/qr-login",
    "/auth/qr-approve",
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
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "70vh",
        width: "100%",
        gap: 2,
      }}
    >
      <Box
        className="shimmer"
        sx={{
          p: 2.5,
          borderRadius: "24px",
          bgcolor: "rgba(30, 30, 30, 0.22)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Box sx={{ width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", opacity: 0.7 }}>
          <svg width={32} height={32} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2C7.58 2 4 5.58 4 10c0 3.31 2.01 6.16 4.9 7.37.1.34.25.96.38 1.48.24.96.95 1.65 1.94 1.65h1.56c.99 0 1.7-.69 1.94-1.65.13-.52.28-1.14.38-1.48C17.99 16.16 20 13.31 20 10c0-4.42-3.58-8-8-8z" />
            <circle cx="9" cy="10" r="1.5" fill="currentColor" />
            <circle cx="15" cy="10" r="1.5" fill="currentColor" />
            <path d="M12 13v1" />
            <path d="M10 19v1.5" />
            <path d="M14 19v1.5" />
          </svg>
        </Box>
      </Box>
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
          <Route path="/trips/create" element={<RequireAuth><CreateTripPage /></RequireAuth>} />
          <Route path="/create-trip" element={<RequireAuth><CreateTripPage /></RequireAuth>} />
          <Route path="/chats" element={<RequireAuth><ChatWorkspace /></RequireAuth>} />
          <Route path="/chat/:friendId" element={<RequireAuth><ChatWorkspace /></RequireAuth>} />
          <Route path="/group/:groupName" element={<RequireAuth><ChatWorkspace /></RequireAuth>} />
          <Route path="/search" element={<RequireAuth><SearchPage /></RequireAuth>} />
          <Route path="/profile" element={<RequireAuth><Profile /></RequireAuth>} />
          <Route path="/profile/:id" element={<RequireAuth><Profile /></RequireAuth>} />
          <Route path="/travel-ai" element={<RequireAuth><TravelAI /></RequireAuth>} />
          <Route path="/home-dummy" element={<RequireAuth><Homepage /></RequireAuth>} />
          <Route path="/budget-mngr" element={<RequireAuth><Budgetmngr /></RequireAuth>} />
          <Route path="/reminders" element={<RequireAuth><Reminders /></RequireAuth>} />
          <Route path="/saved-trips" element={<RequireAuth><SavedTrips /></RequireAuth>} />

          {/* Auth Routes (Restricted when Session is Active) */}
          <Route path="/auth/*" element={<RestrictAuthForLoggedIn><AuthPage /></RestrictAuthForLoggedIn>} />
          <Route path="/signup" element={<Navigate to="/auth/signup" replace />} />
          <Route path="/login" element={<Navigate to="/auth/login" replace />} />
          <Route path="/forgot-password" element={<RestrictAuthForLoggedIn><ForgotPassword /></RestrictAuthForLoggedIn>} />
          <Route path="/reset-password" element={<RestrictAuthForLoggedIn><ResetPassword /></RestrictAuthForLoggedIn>} />

          {/* Other routes remain accessible or protected as needed */}
          <Route path="/qr-login" element={<QrMobileApprove />} />
          <Route path="/auth/qr-approve" element={<QrMobileApprove />} />
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