// src/components/BottomNavBar.js
import React, { useEffect, useState, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  HomeOutlined as Home,
  HomeOutlined,
  StickyNote2Outlined,
  StickyNote2Outlined as StickyNote2,
  ExploreOutlined,
  ExploreOutlined as Explore,
  ChatBubbleOutline,
  ChatBubbleOutline as ChatBubble,
} from "../icons/LucideIcons";
import { Box, CircularProgress, useMediaQuery, useTheme } from "@mui/material";
import { useThemeToggle } from "../contexts/ThemeToggleContext";
import { getTheme } from "../theme";
import { glass } from "../theme/designSystem";
import ProfilePic from "./Profile";
import { useAuth } from "../hooks/useAuth";
import { prefetchRoute } from "../utils/routePrefetcher";

const BottomNavBar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { mode, accent } = useThemeToggle();
  const theme = getTheme(mode, accent);
  const muiTheme = useTheme();
  const { user: currentUser, loading: authLoading } = useAuth();

  const isDesktop = useMediaQuery(muiTheme.breakpoints.up("md"));
  const [visible, setVisible] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);

  const navItems = useMemo(() => [
    { label: "Home", path: "/", icon: <HomeOutlined />, activeIcon: <Home stroke={mode === "dark" ? "#000000" : "#ffffff"} /> },
    { label: "Notes", path: "/notes", icon: <StickyNote2Outlined />, activeIcon: <StickyNote2 stroke={mode === "dark" ? "#000000" : "#ffffff"} /> },
    { label: "Trips", path: "/trips", icon: <ExploreOutlined />, activeIcon: <Explore stroke={mode === "dark" ? "#000000" : "#ffffff"} /> },
    { label: "Chats", path: "/chats", icon: <ChatBubbleOutline />, activeIcon: <ChatBubble stroke={mode === "dark" ? "#000000" : "#ffffff"} /> },
  ], [mode]);

  // 📍 Active nav index
  useEffect(() => {
    const index = navItems.findIndex((i) => location.pathname === i.path);
    setActiveIndex(index === -1 ? 0 : index);
  }, [location.pathname, navItems]);

  // 👁️ Hide on scroll (search only)
  useEffect(() => {
    const isSearchPage = location.pathname === "/search";
    if (!isSearchPage) {
      setVisible(true);
      return;
    }

    let lastScrollY = window.scrollY;
    let ticking = false;

    const updateVisibility = () => {
      const currentScroll = window.scrollY;
      const scrollDown = currentScroll > lastScrollY && currentScroll > 80;
      const nextVisible = !scrollDown;

      setVisible((prev) => (prev !== nextVisible ? nextVisible : prev));
      lastScrollY = currentScroll > 0 ? currentScroll : 0;
      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(updateVisibility);
        ticking = true;
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [location.pathname]);

  const isAuthRoute =
    location.pathname.startsWith("/auth") ||
    location.pathname.startsWith("/login") ||
    location.pathname.startsWith("/signup") ||
    location.pathname.startsWith("/forgot-password") ||
    location.pathname.startsWith("/reset-password");

  if (isAuthRoute || isDesktop) return null;

return (
  <Box
    id="bottom-nav"
    sx={{
      position: "fixed",
      bottom: 0,
      left: 0,
      right: 0,
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      py: 1.2,
      px: 1.5,
      zIndex: 1010,
      // Slide in/out only vertically for smoother behavior
      transform: visible ? "translateY(0)" : "translateY(120%)",
      willChange: "transform",
      transition: "transform 0.5s cubic-bezier(.4,0,.2,1)",
      background:
        mode === "dark"
          ? "linear-gradient(to top, rgba(0,0,0,0.96), rgba(0, 0, 0, 0))"
          : "linear-gradient(to top, rgba(255,255,255,0.96), rgba(255,255,255,0))",
      pointerEvents: "none", // container ignores clicks
    }}
  >
    {/* Inner wrapper with maxWidth, re-enables pointer events */}
    <Box
      sx={{
        width: "100%",
        maxWidth: 330,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        pointerEvents: "auto",
        gap: 1,
      }}
    >
      {/* Nav Buttons */}
      <Box
        sx={{
          flex: 1,
          borderRadius: "50px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          py: 0.9,
          px: 1,
          mb: 1.6,
          backdropFilter: "blur(3px) saturate(1)",
          background:
            mode === "dark"
              ? "rgba(0, 0, 0, 0.55)"
              : "rgba(255, 255, 255, 0.25)",
          border:
            mode === "dark"
              ? "0px solid rgba(255,255,255,0.08)"
              : "0px solid rgba(0,0,0,0.08)",
          boxShadow:
            mode === "dark"
              ? `
                inset 0 1px 1px rgba(255, 255, 255, 0.11),
                inset 0 -1px 1px rgba(255, 255, 255, 0.07),
                0 1px 0px rgba(0,0,0,0.1)
              `
              : `
                inset 0 1px 1px rgba(255,255,255,0.8),
                inset 0 -1px 1px rgba(0,0,0,0.1),
                0 1px 0px rgba(0,0,0,0.1)
              `,
        }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-around",
            alignItems: "center",
            flex: 1,
            gap: 0.5,
          }}
        >
          {navItems.map((item, index) => {
            const isActive = activeIndex === index;
            return (
<Box
  key={item.label}
  onClick={() => navigate(item.path)}
  onMouseEnter={() => prefetchRoute(item.label.toLowerCase())}
  onTouchStart={() => prefetchRoute(item.label.toLowerCase())}
  sx={{
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    flex: 1,

    // 👇 NOT link-like
    cursor: "default",
    userSelect: "none",

    // 👇 tap feedback, not navigation cue
    "&:active": {
      transform: "scale(0.95)",
    },
  }}
>

<Box
  sx={{
    height: 40,
    width: 56,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",

    borderRadius: 10,

    transform: isActive ? "scale(1.08)" : "scale(1)",
    transition: "transform 0.2s ease, background-color 0.2s ease",

    backgroundColor: isActive
      ? mode === "dark"
        ? "#ffffffd0"
        : "#000000d0"
      : "transparent",

    color: isActive
      ? mode === "dark"
        ? "#000"
        : "#fff"
      : mode === "dark"
        ? "#bcbcbc"
        : "#333",

    // 👇 no hover CTA
    "&:hover": {
      backgroundColor: isActive
        ? undefined
        : mode === "dark"
          ? "rgba(255,255,255,0.04)"
          : "rgba(0,0,0,0.04)",
    },
  }}
>
  {isActive ? item.activeIcon : item.icon}
</Box>

              </Box>
            );
          })}
        </Box>
      </Box>

          <Box
            sx={{
              width: 56,
              py: 0,
              mb: 1.2,
              borderRadius: 10,
              height: 56,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: mode === "dark" ? "#fff" : "#000",
              ...glass(mode, {
                background:
                  mode === "dark"
                    ? "rgba(0, 0, 0, 0.55)"
                    : "rgba(255, 255, 255, 0.25)",
              }),
              transition: "all 0.3s ease",
              transform: "scale(1)",
              cursor: 'pointer',
              "&:hover": {
                transform: "scale(1.1)",
                background: theme.palette.primary.main + "20",
              },
            }}
          >
            {authLoading ? (
              <CircularProgress size={20} />
            ) : (
              <ProfilePic currentUser={currentUser} />
            )}
          </Box>
    </Box>
  </Box>
);
};

export default BottomNavBar;