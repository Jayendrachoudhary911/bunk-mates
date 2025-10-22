import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { messaging } from './firebase';
import { getToken, onMessage } from 'firebase/messaging';
import { Box } from "@mui/material";
import "./App.css";
import 'leaflet/dist/leaflet.css';
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import Home from "./pages/Home";
import Homepage from "./pages/Homepage";
import Profile from "./pages/Profile";
import Chats from "./pages/Chats";
import Budgetmngr from "./pages/Budget"
import Reminders from "./pages/Reminders";
import Notes from "./pages/Notes";
import Waitlist from "./pages/Wishlist";
import { UserProvider } from './contexts/UserContext';
import Chatroom from "./components/Chatroom";
import GroupChat from "./components/GroupChat";

import Trips from "./pages/Trips";
import ProtectedRoute from "./components/ProtectedRoute";
import { WeatherProvider } from "./contexts/WeatherContext";
import { SettingsProvider } from "./contexts/SettingsContext";
import TripDetails from "./components/TripDetails";
import JoinTrip from "./pages/JoinTrip"
import PrivacyPolicy from "./components/PrivacyPolicy";
import TermsAndConditions from "./components/TermsAndConditions";
import CommunityPage from "./components/CommunityPage";
import GroupInvitePage from "./components/GroupInvitePage";
import Notifications from "./components/Notifications";
import ForgotPassword from "./components/ForgotPassword";
import ResetPassword from "./components/ResetPassword";
import SearchPage from "./pages/Search";
import { ThemeToggleProvider, useThemeToggle } from './contexts/ThemeToggleContext';

import BottomNavBar from './components/BottomNavBar'; 
import SwipeableRoutes from './components/SwipeableRoutes';
import { SWIPEABLE_PATHS } from './components/navItems';

const vapidKey = 'BA3kLicUjBzLvrGk71laA_pRVYsf6LsGczyAzF-NTBWEmOE3r4_OT9YiVt_Mvzqm7dZCoPnht84wfX-WRzlaSLs'; // From Firebase console

const isPathSwipeable = (pathname) => SWIPEABLE_PATHS.includes(pathname);
// We'll also exclude specific non-main routes like login/signup, trip details, chatroom, etc.
const isPathExcludedFromNavBar = (pathname) => 
  ['/signup', '/login', '/chat/', '/group/', '/trips/', '/join', '/group-invite/', '/forgot-password', '/reset-password'].some(start => pathname.startsWith(start));

export const requestPermission = async () => {
  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      const token = await getToken(messaging, { vapidKey });
      console.log('FCM Token:', token);
      // Save this token to your Firestore to use for sending messages
    } else {
      console.log('Notification permission denied');
    }
  } catch (err) {
    console.error('Error getting permission or token:', err);
  }
};

onMessage(messaging, (payload) => {
  console.log('Foreground message received:', payload);
  // Optional: show custom toast/notification UI here
});

function BodyBackgroundSetter() {
  const { mode } = useThemeToggle();
  useEffect(() => {
    document.body.style.backgroundColor = mode === "dark" ? "#0c0c0c" : "#f1f1f1";
    document.body.style.setProperty('--slick-dot-color', mode === "dark" ? "#888" : "#bbb");
    document.body.style.setProperty('--slick-dot-active-color', mode === "dark" ? "#ffffffff" : "#000000ff");
  }, [mode]);
  return null;
}

function AppContent() {
  const location = useLocation();
  const showBottomBar = !isPathExcludedFromNavBar(location.pathname);

  return (
    <>
      {/* Wrap all routes in SwipeableRoutes. The component will only apply the swipe logic 
        to the paths defined in SWIPEABLE_PATHS, but it must be an ancestor of all Routes.
      */}
      <Box sx={{ pb: 9 }}>
      <SwipeableRoutes>
        <Routes>
          <Route path="/signup" element={<Signup />} />
          <Route path="/login" element={<Login />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/chats" element={<Chats />} />
          <Route path="/chat/:friendId" element={<Chatroom />} />
          <Route path="/group/:groupName" element={<GroupChat />}/>
          
          {/* Main swipeable pages */}
          <Route path="/budget-mngr" element={<Budgetmngr />}/>
          <Route path="/reminders" element={<Reminders />} />
          <Route path="/notes" element={<Notes />} />
          <Route path="/trips" element={<Trips />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/" element={
            // <ProtectedRoute>
              <Home />
            // </ProtectedRoute>
          } />
          {/* End of main swipeable pages */}

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
          
        </Routes>
      </SwipeableRoutes>
      </Box>
      {/* Render the BottomNavBar conditionally */}
      {showBottomBar && <BottomNavBar />}
    </>
  );
}

function App() {
  return (
    <ThemeToggleProvider>
    <BodyBackgroundSetter />
    <SettingsProvider>
      <WeatherProvider>
        <Router>
         <AppContent />
        </Router>
      </WeatherProvider>
    </SettingsProvider>
    </ThemeToggleProvider>
  );
}

export default App;
