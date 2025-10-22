// src/components/BottomNavBar.js
import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Home,
  HomeOutlined,
  Notifications,
  NotificationsOutlined,
  Note,
  NoteOutlined,
  Map,
  MapOutlined,
  Explore,
  StickyNote2Outlined,
  StickyNote2,
} from "@mui/icons-material";
import ExploreOutlinedIcon from '@mui/icons-material/ExploreOutlined';
import SearchIcon from '@mui/icons-material/Search';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import { useThemeToggle } from "../contexts/ThemeToggleContext";
import { getTheme } from "../theme";
import { Typography } from "@mui/material";

const BottomNavBar = () => {
  const location = useLocation();
  const { mode, accent } = useThemeToggle();
  const theme = getTheme(mode, accent);

  // Prefer app theme from ThemeToggleContext, fallback to system preference
  const themeToggle = useThemeToggle?.();
  const systemPrefersDark =
    typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;

  const navItems = [
    { label: "Home", path: "/", icon: <HomeOutlined />, activeIcon: <Home /> },
    {
      label: "Search",
      path: "/search",
      icon: <SearchOutlinedIcon />,
      activeIcon: <SearchIcon />,
    },
    {
      label: "Notes",
      path: "/notes",
      icon: <StickyNote2Outlined />,
      activeIcon: <StickyNote2 />,
    },
    {
      label: "Trips",
      path: "/trips",
      icon: <ExploreOutlinedIcon />,
      activeIcon: <Explore />,
    },
  ];

  return (
    <div
      style={{
        position: "fixed",
        bottom: "7px",
        left: "50%",
        transform: "translateX(-50%)",
        display: "flex",
        justifyContent: "space-around",
        alignItems: "center",
        width: "90%",
        maxWidth: "400px",
        padding: "12px 0px",
        borderRadius: "22px",
        backdropFilter: "blur(15px)",
        background:
          mode === "dark"
            ? "rgba(25, 25, 25, 0.77)"
            : "rgba(255, 255, 255, 0.4)",
        transition: "all 0.3s ease",
        zIndex: 999,
      }}
    >
      {navItems.map((item) => {
        const isActive = location.pathname === item.path;
        return (
          <Link
            key={item.label}
            to={item.path}
            style={{
              textDecoration: "none",
              color: isActive
                  ? theme.palette.primary.maintxt
                  : mode === "dark"
                    ? "#ccc"
                    : "#555",

              transition: "all 0.3s ease",
              transform: isActive ? "scale(1.1)" : "scale(1)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
            }}
          >
            <div
              style={{
                fontSize: "26px",
                transition: "transform 0.3s ease, opacity 0.3s ease",
                backgroundColor: isActive
                    ? theme.palette.primary.select
                    : "transparent",
                height: "30px",
                width: "60px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "30px",
              }}
            >
              {isActive ? item.activeIcon : item.icon}
            </div>
                <Typography
                    variant="caption"
                    sx={{
                        fontSize: '12px',
                        marginTop: '2px',
                        fontWeight: isActive ? 500 : 200,
                        color: isActive 
                          ? theme.palette.primary.maintxt 
                          : mode === "dark" 
                            ? "#fff" 
                            : "#000",

                    }}
                >
                    {item.label}
                </Typography>
          </Link>
        );
      })}
    </div>
  );
};

export default BottomNavBar;
