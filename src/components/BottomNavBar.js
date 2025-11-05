// src/components/BottomNavBar.js
import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Home,
  HomeOutlined,
  StickyNote2Outlined,
  StickyNote2,
  ExploreOutlined,
  Explore,
  SearchOutlined,
  Search,
  ChatBubbleOutline,
} from "@mui/icons-material";
import { Typography, Box, Button } from "@mui/material";
import { useThemeToggle } from "../contexts/ThemeToggleContext";
import { getTheme } from "../theme";

const BottomNavBar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { mode, accent } = useThemeToggle();
  const theme = getTheme(mode, accent);
  const [visible, setVisible] = useState(true);
  const [lastScroll, setLastScroll] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);

  const navItems = [
    { label: "Home", path: "/", icon: <HomeOutlined />, activeIcon: <Home /> },
    { label: "Search", path: "/search", icon: <SearchOutlined />, activeIcon: <Search /> },
    { label: "Notes", path: "/notes", icon: <StickyNote2Outlined />, activeIcon: <StickyNote2 /> },
    { label: "Trips", path: "/trips", icon: <ExploreOutlined />, activeIcon: <Explore /> },
  ];

  // Hide/show on scroll
// Hide/show on scroll (improved)
useEffect(() => {
  const isSearchPage = location.pathname === "/search";

  if (!isSearchPage) {
    setVisible(true);
    return; // No scroll listener on other pages
  }

  let lastScrollY = window.scrollY;
  let ticking = false;

  const updateVisibility = () => {
    const currentScroll = window.scrollY;
    const scrollDown = currentScroll > lastScrollY && currentScroll > 80;

    // Hide if scrolling down, show if scrolling up
    setVisible(!scrollDown);

    lastScrollY = currentScroll > 0 ? currentScroll : 0;
    ticking = false;
  };

  const onScroll = () => {
    if (!ticking) {
      window.requestAnimationFrame(updateVisibility);
      ticking = true;
    }
  };

  window.addEventListener("scroll", onScroll);
  return () => {
    window.removeEventListener("scroll", onScroll);
  };
}, [location.pathname]);


  // Active index detection
  useEffect(() => {
    const index = navItems.findIndex((i) => location.pathname === i.path);
    setActiveIndex(index === -1 ? 0 : index);
  }, [location.pathname]);

  return (
    <Box
      sx={{
        position: "fixed",
        bottom: visible ? 0 : -80,
        left: "50%",
        transform: `translateX(-50%) translateY(${visible ? "0" : "120%"} )`,
        width: "100%",
        maxWidth: 500,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        py: 1.2,
        px: 1,
        zIndex: 999,
        transition: "all 0.5s cubic-bezier(.4,0,.2,1)",
        overflow: "hidden",
        background: mode === "dark" ? "linear-gradient(to bottom, rgba(255,255,255,0), rgba(255,255,255,0), rgba(0, 0, 0, 0.95))" : "linear-gradient(to bottom, rgba(255,255,255,0), rgba(255,255,255,0), rgba(255, 255, 255, 0.95))",
      }}
    >
      {/* Navigation items in row */}
      <Box
      sx={{
        mb: 0.6,
        width: "70%",
        borderRadius: "50px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        py: 1,
        px: 1,
        zIndex: 999,
        backdropFilter: "blur(14px) saturate(1.4)",
        background:
          mode === "dark"
            ? "linear-gradient(135deg, rgba(20,20,20,0.85), rgba(40,40,40,0.6))"
            : "linear-gradient(135deg, rgba(255,255,255,0.7), rgba(240,240,240,0.5))",
        border: mode === "dark"
          ? "1px solid rgba(255,255,255,0.08)"
          : "1px solid rgba(0,0,0,0.08)",
        transition: "all 0.5s cubic-bezier(.4,0,.2,1)",
        overflow: "hidden",
      }}
      >
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-around",
          alignItems: "center",
          flex: 1,
          gap: 1,
        }}
      >
        {navItems.map((item, index) => {
          const isActive = activeIndex === index;
          return (
            <Link
              key={item.label}
              to={item.path}
              style={{
                textDecoration: "none",
                position: "relative",
                zIndex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                flex: 1,
                transition: "transform 0.3s ease",
              }}
            >
              <Box
                sx={{
                  height: 44,
                  width: 60,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transform: isActive ? "scale(1.15)" : "scale(1)",
                  backgroundColor: isActive
                    ? theme.palette.primary.main + "2d"
                    : "transparent",
                  borderRadius: 8,
                  color: isActive
                    ? theme.palette.primary.maintxt
                    : mode === "dark"
                      ? "#bcbcbc"
                      : "#333",
                  transition: "color 0.3s ease, transform 0.3s ease",
                  "&:hover": {
                    color: theme.palette.primary.maintxt,
                  },
                }}
              >
                <Box
                  sx={{
                    fontSize: 24,
                    mt: 0.4,
                    animation: isActive ? "pop 0.4s ease" : "none",
                    "@keyframes pop": {
                      "0%": { transform: "scale(0.9)", opacity: 0.7 },
                      "50%": { transform: "scale(1.1)", opacity: 1 },
                      "100%": { transform: "scale(1)", opacity: 1 },
                    },
                  }}
                >
                  {isActive ? item.activeIcon : item.icon}
                </Box>
              </Box>

              {/* <Typography
                variant="caption"
                sx={{
                  fontSize: "11.5px",
                  mt: 0.2,
                  fontWeight: isActive ? 600 : 400,
                  color: isActive
                    ? theme.palette.primary.maintxt
                    : mode === "dark"
                      ? "#e5e5e59e"
                      : "#333b",
                  opacity: isActive ? 1 : 0.7,
                  transition: "color 0.3s ease, opacity 0.3s ease",
                }}
              >
                {item.label}
              </Typography> */}
            </Link>
          );
        })}
      </Box>
      </Box>
      {/* Chat Button (inline at right edge) */}

      <Button
        onClick={() => navigate("/chats")}
        sx={{
          ml: 1,
          mr: 0.8,
          mb: 0.6,
          width: 65,
          px: 1,
          py: 1,
          height: 65,
          borderRadius: "20px",
          background: theme.palette.primary.main + "7d",
          color: mode === "dark" ? "#fff" : "#000",
          backdropFilter: "blur(10px)",
          border: mode === "dark"
            ? "1px solid rgba(255,255,255,0.07)"
            : "1px solid rgba(0,0,0,0.07)",
          transition: "all 0.3s ease",
          "&:hover": {
            transform: "scale(1.08)",
            background: theme.palette.primary.main + "7d",
          },
        }}
      >
        <ChatBubbleOutline sx={{ fontSize: 22 }} />
      </Button>

    </Box>
  );
};

export default BottomNavBar;