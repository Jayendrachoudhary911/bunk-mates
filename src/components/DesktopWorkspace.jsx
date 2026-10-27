// src/components/DesktopWorkspace.jsx
import React from "react";
import { Box, useTheme, useMediaQuery } from "@mui/material";
import DesktopSidebar from "./DesktopSidebar";
import DesktopPanel from "./DesktopPanel";
import { useDesktopPanel } from "../contexts/DesktopPanelContext";
import { useThemeToggle } from "../contexts/ThemeToggleContext";
import { useLocation } from "react-router-dom";

// Icons
import {
  PersonOutline as PersonIcon,
  NotificationsNoneOutlined as NotificationsIcon,
  ExploreOutlined as TripsIcon,
  StickyNote2Outlined as NotesIcon,
  AlarmOutlined as TasksIcon,
  HelpOutline as HelpIcon,
} from "../icons";
import GroupsIcon from "@mui/icons-material/GroupsOutlined";

// Lazy-loaded Panel Contents for optimal code splitting & fast initial LCP
const ProfilePic = React.lazy(() => import("./Profile"));
const TripsPanelContent = React.lazy(() => import("./panels/TripsPanelContent"));
const NotesPanelContent = React.lazy(() => import("./panels/NotesPanelContent"));
const TodosPanelContent = React.lazy(() => import("./panels/TodosPanelContent"));
const HelpPanelContent = React.lazy(() => import("./panels/HelpPanelContent"));
const Notifications = React.lazy(() => import("./Notifications"));
const ChatProfilePanelContent = React.lazy(() => import("./panels/ChatProfilePanelContent"));
const GroupInfoPanelContent = React.lazy(() => import("./panels/GroupInfoPanelContent"));

// Proper gap from the left so the sidebar and the application content won't override
const DESKTOP_CONTENT_MARGIN_LEFT = 88;

const DesktopWorkspace = ({ children }) => {
  const muiTheme = useTheme();
  const isDesktop = useMediaQuery(muiTheme.breakpoints.up("md"));
  const { mode } = useThemeToggle();
  const isDark = mode === "dark";
  const location = useLocation();

  const { activePanel, panelData, closePanel } = useDesktopPanel();

  const isAuthRoute =
    location.pathname.startsWith("/auth") ||
    location.pathname.startsWith("/login") ||
    location.pathname.startsWith("/signup") ||
    location.pathname.startsWith("/forgot-password") ||
    location.pathname.startsWith("/reset-password");

  const isChatRoute =
    location.pathname.startsWith("/chats") ||
    location.pathname.startsWith("/chat/") ||
    location.pathname.startsWith("/group/");

  const isIndividualChatMobile =
    !isDesktop &&
    (location.pathname.startsWith("/chat/") ||
      location.pathname.startsWith("/group/"));

  // Desktop keeps outer container non-scrolling for all chat routes (ChatWorkspace handles inner split panels).
  // Mobile allows natural scroll on /chats, but locks outer scrolling for active /chat and /group rooms.
  const lockOuterScroll = isDesktop ? isChatRoute : isIndividualChatMobile;

  // Determine panel header config based on activePanel
  const panelConfig = React.useMemo(() => {
    switch (activePanel) {
      case "profile":
      case "settings":
        return {
          title: "Profile & Settings",
          subtitle: "Manage your BunkMates account & preferences",
          icon: <PersonIcon sx={{ fontSize: 20 }} />,
          width: 440,
          hideHeader: true,
          noPadding: true,
          content: <ProfilePic isEmbedded={true} onClose={closePanel} />,
        };
      case "notifications":
        return {
          title: "Notifications",
          subtitle: "Activity, requests & alerts",
          icon: <NotificationsIcon sx={{ fontSize: 20 }} />,
          content: <Notifications isPanel={true} />,
        };
      case "trips":
        return {
          title: "Trips Overview",
          subtitle: "Your active and planned journeys",
          icon: <TripsIcon sx={{ fontSize: 20 }} />,
          content: <TripsPanelContent />,
        };
      case "notes":
        return {
          title: "Notes Quick View",
          subtitle: "Your thoughts and workspace notes",
          icon: <NotesIcon sx={{ fontSize: 20 }} />,
          content: <NotesPanelContent />,
        };
      case "todos":
        return {
          title: "Tasks & To-Do",
          subtitle: "Your reminders checklist",
          icon: <TasksIcon sx={{ fontSize: 20 }} />,
          content: <TodosPanelContent />,
        };
      case "help":
        return {
          title: "Help & Support",
          subtitle: "Live inquiries & support tickets",
          icon: <HelpIcon sx={{ fontSize: 20 }} />,
          content: <HelpPanelContent />,
        };
      case "chatProfile":
        return {
          title: panelData?.name || panelData?.displayName || "Friend Profile",
          subtitle: panelData?.username ? `@${panelData.username}` : "Chat details and mutual data",
          icon: <PersonIcon sx={{ fontSize: 20 }} />,
          width: 440,
          hideHeader: true,
          content: (
            <ChatProfilePanelContent
              profileData={panelData}
              onClose={closePanel}
            />
          ),
        };
      case "groupInfo":
        return {
          title: panelData?.name || panelData?.groupName || "Group Details",
          subtitle: `${panelData?.members?.length || 0} Members`,
          icon: <GroupsIcon sx={{ fontSize: 20 }} />,
          width: 440,
          hideHeader: true,
          content: (
            <GroupInfoPanelContent
              groupData={panelData}
              onClose={closePanel}
            />
          ),
        };
      default:
        return null;
    }
  }, [activePanel, panelData, closePanel]);

  const lastConfigRef = React.useRef(null);
  if (panelConfig) {
    lastConfigRef.current = panelConfig;
  }
  const displayConfig = panelConfig || lastConfigRef.current;

  return (
    <Box
      sx={{
        display: "flex",
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
        position: "relative",
        backgroundColor: isDark ? "#0c0c0c" : "#f1f1f1",
      }}
    >
      {/* ─── Layer 1: Desktop Collapsible Sidebar (Desktop Only) ─── */}
      {!isAuthRoute && isDesktop && <DesktopSidebar />}

      {/* ─── Layer 2: Main Primary Content Layer ─── */}
      <Box
        sx={{
          display: "flex",
          flex: 1,
          minWidth: 0,
          height: "100%",
          position: "relative",
          // Comfortable left margin on desktop ensuring sidebar and content never collide or override
          ml: !isAuthRoute && isDesktop ? `${DESKTOP_CONTENT_MARGIN_LEFT}px` : 0,
          transition: "margin-left 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
          overflow: "hidden",
        }}
      >
        {/* Main Content View Container */}
        <Box
          component="main"
          id="main-content-viewport"
          sx={{
            flex: 1,
            minWidth: 0,
            height: "100%",
            position: "relative",
            overflowY: lockOuterScroll ? "hidden" : "auto",
            overflowX: "hidden",
            WebkitOverflowScrolling: "touch",
            scrollbarWidth: "none",
            "&::-webkit-scrollbar": { display: "none" },
            transition: "flex 0.35s cubic-bezier(0.16, 1, 0.3, 1), max-width 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
            pb: isAuthRoute
              ? 0
              : { xs: isIndividualChatMobile ? 0 : "96px", md: 0 },
          }}
        >
          {children}
        </Box>

        {/* ─── Layer 3: Secondary Desktop Panel (Slide-in Right Layer) ─── */}
        {!isAuthRoute && isDesktop && displayConfig && (
          <DesktopPanel
            open={Boolean(activePanel)}
            title={displayConfig.title}
            subtitle={displayConfig.subtitle}
            icon={displayConfig.icon}
            width={displayConfig.width}
            hideHeader={displayConfig.hideHeader}
            noPadding={displayConfig.noPadding}
            onClose={closePanel}
          >
            <React.Suspense fallback={null}>
              {displayConfig.content}
            </React.Suspense>
          </DesktopPanel>
        )}
      </Box>
    </Box>
  );
};

export default DesktopWorkspace;
