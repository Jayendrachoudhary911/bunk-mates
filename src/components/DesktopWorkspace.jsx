// src/components/DesktopWorkspace.jsx
import React from "react";
import { Box, useTheme, useMediaQuery } from "@mui/material";
import DesktopSidebar from "./DesktopSidebar";
import DesktopPanel from "./DesktopPanel";
import { useDesktopPanel } from "../contexts/DesktopPanelContext";
import { useThemeToggle } from "../contexts/ThemeToggleContext";
import { useLocation } from "react-router-dom";

// Panel Contents
import ProfilePic from "./Profile";
import TripsPanelContent from "./panels/TripsPanelContent";
import NotesPanelContent from "./panels/NotesPanelContent";
import TodosPanelContent from "./panels/TodosPanelContent";
import HelpPanelContent from "./panels/HelpPanelContent";
import Notifications from "./Notifications";

// Icons
import {
  PersonOutline as PersonIcon,
  NotificationsNoneOutlined as NotificationsIcon,
  ExploreOutlined as TripsIcon,
  StickyNote2Outlined as NotesIcon,
  AlarmOutlined as TasksIcon,
  HelpOutline as HelpIcon,
} from "../icons";

// Proper gap from the left so the sidebar and the application content won't override
const DESKTOP_CONTENT_MARGIN_LEFT = 88;

const DesktopWorkspace = ({ children }) => {
  const muiTheme = useTheme();
  const isDesktop = useMediaQuery(muiTheme.breakpoints.up("md"));
  const { mode } = useThemeToggle();
  const isDark = mode === "dark";
  const location = useLocation();

  const { activePanel, closePanel } = useDesktopPanel();

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
  const getPanelConfig = () => {
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
      default:
        return null;
    }
  };

  const panelConfig = getPanelConfig();

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
            pb: isAuthRoute
              ? 0
              : { xs: isIndividualChatMobile ? 0 : "96px", md: 0 },
          }}
        >
          {children}
        </Box>

        {/* ─── Layer 3: Secondary Desktop Panel (Slide-in Right Layer) ─── */}
        {!isAuthRoute && isDesktop && panelConfig && (
          <DesktopPanel
            open={Boolean(activePanel)}
            title={panelConfig.title}
            subtitle={panelConfig.subtitle}
            icon={panelConfig.icon}
            width={panelConfig.width}
            hideHeader={panelConfig.hideHeader}
            noPadding={panelConfig.noPadding}
            onClose={closePanel}
          >
            {panelConfig.content}
          </DesktopPanel>
        )}
      </Box>
    </Box>
  );
};

export default DesktopWorkspace;
