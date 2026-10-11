// src/components/DesktopSidebar.jsx
import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Tooltip,
  Avatar,
  Badge,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import {
  HomeOutlined as HomeIcon,
  ChatBubbleOutline as ChatIcon,
  ExploreOutlined as TripsIcon,
  StickyNote2Outlined as NotesIcon,
  AlarmOutlined as TasksIcon,
  NotificationsNoneOutlined as NotificationsIcon,
  SettingsOutlined as SettingsIcon,
  HelpOutline as HelpIcon,
} from "../icons";
import { useThemeToggle } from "../contexts/ThemeToggleContext";
import { useDesktopPanel } from "../contexts/DesktopPanelContext";
import { useAuth } from "../hooks/useAuth";
import { db } from "../firebase";
import {
  doc,
  collection,
  query,
  where,
  onSnapshot,
  getDoc,
} from "firebase/firestore";

const COLLAPSED_WIDTH = 44;
const EXPANDED_WIDTH = 236;

const DesktopSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const muiTheme = useTheme();
  const isDesktop = useMediaQuery(muiTheme.breakpoints.up("md"));
  const { mode } = useThemeToggle();
  const isDark = mode === "dark";

  const { activePanel, togglePanel } = useDesktopPanel();
  const { user: currentUser } = useAuth();

  // Always starts collapsed by default
  const [isHovered, setIsHovered] = useState(false);
  const [unreadChats, setUnreadChats] = useState(0);
  const [unreadNotifs, setUnreadNotifs] = useState(0);
  const [userData, setUserData] = useState({ name: "", username: "", photoURL: "" });

  const hoverTimerRef = useRef(null);

  // Fetch current user details
  useEffect(() => {
    if (!currentUser?.uid) return;
    const fetchUser = async () => {
      try {
        const userSnap = await getDoc(doc(db, "users", currentUser.uid));
        if (userSnap.exists()) {
          const data = userSnap.data();
          setUserData({
            name: data.name || currentUser.displayName || "User",
            username: data.username || "bunkmate",
            photoURL: data.photoURL || currentUser.photoURL || "",
          });
        } else {
          setUserData({
            name: currentUser.displayName || "User",
            username: "bunkmate",
            photoURL: currentUser.photoURL || "",
          });
        }
      } catch (err) {
        console.error("Error loading user in sidebar:", err);
      }
    };
    fetchUser();
  }, [currentUser]);

  // Unread chats listener
  useEffect(() => {
    if (!currentUser?.uid) return;
    const unsubs = [];

    // Direct chats
    const userChatRef = doc(db, "userChats", currentUser.uid);
    const unsubDirect = onSnapshot(userChatRef, (docSnap) => {
      if (docSnap.exists()) {
        const chats = docSnap.data();
        let count = 0;
        Object.values(chats).forEach((chat) => {
          if (
            chat.lastMessage &&
            chat.lastMessage.sender !== currentUser.uid &&
            !chat.lastMessage.readBy?.includes(currentUser.uid)
          ) {
            count++;
          }
        });
        setUnreadChats(count);
      }
    });
    unsubs.push(unsubDirect);

    return () => unsubs.forEach((u) => u && u());
  }, [currentUser]);

  // Unread notifications listener
  useEffect(() => {
    if (!currentUser?.uid) return;
    const notifQuery = query(
      collection(db, "notifications"),
      where("uid", "==", currentUser.uid),
      where("seen", "==", false)
    );
    const unsub = onSnapshot(notifQuery, (snap) => {
      setUnreadNotifs(snap.size);
    });
    return () => unsub();
  }, [currentUser]);

  // Hide on mobile or auth pages
  const isAuthRoute =
    location.pathname.startsWith("/auth") ||
    location.pathname.startsWith("/login") ||
    location.pathname.startsWith("/signup") ||
    location.pathname.startsWith("/forgot-password") ||
    location.pathname.startsWith("/reset-password");

  if (!isDesktop || isAuthRoute) {
    return null;
  }

  const handleMouseEnter = () => {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    hoverTimerRef.current = setTimeout(() => {
      setIsHovered(false);
    }, 60);
  };

  const navItems = [
    {
      id: "home",
      label: "Home",
      icon: <HomeIcon sx={{ fontSize: 22 }} />,
      path: "/",
      isActive:
        location.pathname === "/" || location.pathname === "/home",
      onClick: () => navigate("/"),
    },
    {
      id: "chats",
      label: "Chats",
      icon: <ChatIcon sx={{ fontSize: 22 }} />,
      badge: unreadChats,
      path: "/chats",
      isActive:
        location.pathname.startsWith("/chats") ||
        location.pathname.startsWith("/chat/") ||
        location.pathname.startsWith("/group/"),
      onClick: () => navigate("/chats"),
    },
    {
      id: "trips",
      label: "Trips",
      icon: <TripsIcon sx={{ fontSize: 22 }} />,
      path: "/trips",
      isActive: location.pathname.startsWith("/trips"),
      onClick: () => navigate("/trips"),
    },
    {
      id: "notes",
      label: "Notes",
      icon: <NotesIcon sx={{ fontSize: 22 }} />,
      path: "/notes",
      isActive: location.pathname.startsWith("/notes"),
      onClick: () => navigate("/notes"),
    },
    {
      id: "todos",
      label: "Tasks / To-Do",
      icon: <TasksIcon sx={{ fontSize: 22 }} />,
      path: "/reminders",
      isActive: location.pathname.startsWith("/reminders"),
      onClick: () => navigate("/reminders"),
    },
    {
      id: "notifications",
      label: "Notifications",
      icon: <NotificationsIcon sx={{ fontSize: 22 }} />,
      badge: unreadNotifs,
      isActive: activePanel === "notifications",
      onClick: () => togglePanel("notifications"),
    },
    {
      id: "settings",
      label: "Settings",
      icon: <SettingsIcon sx={{ fontSize: 22 }} />,
      isActive: activePanel === "settings",
      onClick: () => togglePanel("settings"),
    },
    {
      id: "help",
      label: "Help & Support",
      icon: <HelpIcon sx={{ fontSize: 22 }} />,
      isActive: activePanel === "help",
      onClick: () => togglePanel("help"),
    },
  ];

  return (
    <Box
      component="nav"
      aria-label="Desktop Primary Navigation"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      sx={{
        position: "fixed",
        top: 0,
        left: 0,
        bottom: 0,
        m: 2,
        borderRadius: 6,
        width: isHovered ? EXPANDED_WIDTH : COLLAPSED_WIDTH,
        zIndex: 1300, // High z-index so it expands OVER content without pushing
        display: "flex",
        flexDirection: "column",
        backgroundColor: isDark
          ? isHovered
            ? "rgba(255, 255, 255, 0.05)"
            : "rgba(12, 12, 12, 0)"
          : isHovered
          ? "rgba(255, 255, 255, 0.95)"
          : "rgba(248, 249, 251, 0.85)",
        backdropFilter: "blur(30px) saturate(1.4)",
        WebkitBackdropFilter: "blur(30px) saturate(1.4)",
        border: 0,
        boxShadow: 'inset 0 1px 6px rgba(255, 255, 255, 0.02), inset 0 -1px 3px rgba(255, 255, 255, 0.02), inset 2px 1px 3px rgba(255, 255, 255, 0.02), inset -2px 1px 3px rgba(255, 255, 255, 0.02)',
        transition: "width 220ms cubic-bezier(0.16, 1, 0.3, 1), background-color 220ms ease, box-shadow 220ms ease",
        py: 2.5,
        px: 1.5,
        userSelect: "none",
        overflowX: "hidden",
        overflowY: "auto",
        scrollbarWidth: "none",
        "&::-webkit-scrollbar": { display: "none" },
      }}
    >
      {/* ─── Top Brand Logo Area ─── */}
      <Box
        onClick={() => navigate("/")}
        role="button"
        tabIndex={0}
        aria-label="Go to BunkMates Home"
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && navigate("/")}
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          cursor: "pointer",
          mb: 3,
          pl: 0.4,
          pr: 1,
          height: 44,
          borderRadius: 4,
          transition: "background-color 0.2s ease",
          "&:hover": {
            backgroundColor: isDark
              ? "rgba(255, 255, 255, 0.05)"
              : "rgba(0, 0, 0, 0.04)",
          },
        }}
      >
        <Box
          sx={{
            width: 38,
            height: 38,
            borderRadius: 3.2,
            background: isDark
              ? "linear-gradient(135deg, #2a2a2a, #141414)"
              : "linear-gradient(135deg, #ffffff, #e6e6e6)",
            border: `0px solid ${
              isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.1)"
            }`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: isDark
              ? "inset 0 1px 2px rgba(255,255,255,0.2), 0 4px 12px rgba(0,0,0,0.3)"
              : "inset 0 1px 2px rgba(255,255,255,0.9), 0 3px 10px rgba(0,0,0,0.06)",
            flexShrink: 0,
          }}
        >
          <Typography
            sx={{
              fontWeight: 800,
              fontSize: "1.1rem",
              letterSpacing: "-0.5px",
              background: isDark
                ? "linear-gradient(45deg, #fff, #aaa)"
                : "linear-gradient(45deg, #111, #555)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            B
          </Typography>
        </Box>

        {isHovered && (
          <Box
            sx={{
              overflow: "hidden",
              whiteSpace: "nowrap",
              animation: "bmFadeIn 0.2s ease forwards",
              "@keyframes bmFadeIn": {
                from: { opacity: 0, transform: "translateX(-6px)" },
                to: { opacity: 1, transform: "translateX(0)" },
              },
            }}
          >
            <Typography
              variant="subtitle1"
              sx={{
                fontWeight: 700,
                fontSize: "1rem",
                letterSpacing: "-0.2px",
                color: isDark ? "#ffffff" : "#111111",
                lineHeight: 1.1,
              }}
            >
              BunkMates
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)",
                fontSize: "0.68rem",
                letterSpacing: "0.5px",
                textTransform: "uppercase",
              }}
            >
              Workspace
            </Typography>
          </Box>
        )}
      </Box>

      {/* ─── Navigation Items ─── */}
      <Box
        component="ul"
        sx={{
          listStyle: "none",
          m: 0,
          p: 0,
          display: "flex",
          flexDirection: "column",
          gap: 0.8,
          flex: 1,
        }}
      >
        {navItems.map((item) => {
          const active = item.isActive;

          return (
            <li key={item.id} style={{ listStyle: "none" }}>
              <Tooltip
                title={!isHovered ? item.label : ""}
                placement="right"
                arrow
              >
                <Box
                  role="button"
                  tabIndex={0}
                  aria-label={item.label}
                  aria-current={active ? "page" : undefined}
                  onClick={item.onClick}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      item.onClick();
                    }
                  }}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1.75,
                    height: 44,
                    px: 1.25,
                    borderRadius: 4,
                    cursor: "pointer",
                    position: "relative",
                    transition: "all 0.18s cubic-bezier(0.16, 1, 0.3, 1)",
                    color: active
                      ? isDark
                        ? "#ffffff"
                        : "#000000"
                      : isDark
                      ? "rgba(255, 255, 255, 0.65)"
                      : "rgba(0, 0, 0, 0.65)",
                    backgroundColor: active
                      ? isDark
                        ? "rgba(255, 255, 255, 0.1)"
                        : "rgba(0, 0, 0, 0.07)"
                      : "transparent",
                    boxShadow: active
                      ? isDark
                        ? "inset 0 1px 1px rgba(255,255,255,0.12), 0 2px 8px rgba(0,0,0,0.2)"
                        : "inset 0 1px 1px rgba(255,255,255,0.9), 0 2px 8px rgba(0,0,0,0.05)"
                      : "none",
                    "&:hover": {
                      color: isDark ? "#ffffff" : "#000000",
                      backgroundColor: active
                        ? isDark
                          ? "rgba(255, 255, 255, 0.14)"
                          : "rgba(0, 0, 0, 0.09)"
                        : isDark
                        ? "rgba(255, 255, 255, 0.05)"
                        : "rgba(0, 0, 0, 0.04)",
                      transform: active ? "none" : "translateX(2px)",
                    },
                    "&:focus-visible": {
                      outline: `2px solid ${
                        isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)"
                      }`,
                      outlineOffset: 2,
                    },
                  }}
                >

                  {/* Icon with optional badge */}
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: 24,
                      height: 24,
                      flexShrink: 0,
                    }}
                  >
                    {item.badge ? (
                      <Badge
                        badgeContent={item.badge}
                        color="error"
                        max={99}
                        sx={{
                          "& .MuiBadge-badge": {
                            fontSize: "0.68rem",
                            height: 16,
                            minWidth: 16,
                            padding: "0 4px",
                          },
                        }}
                      >
                        {item.icon}
                      </Badge>
                    ) : (
                      item.icon
                    )}
                  </Box>

                  {/* Label (visible when hovered) */}
                  {isHovered && (
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: active ? 600 : 500,
                        fontSize: "0.9rem",
                        letterSpacing: "-0.1px",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        animation: "bmLabelFade 0.18s ease forwards",
                        "@keyframes bmLabelFade": {
                          from: { opacity: 0, transform: "translateX(-4px)" },
                          to: { opacity: 1, transform: "translateX(0)" },
                        },
                      }}
                    >
                      {item.label}
                    </Typography>
                  )}
                </Box>
              </Tooltip>
            </li>
          );
        })}
      </Box>

      {/* ─── Bottom Profile & Settings Section ─── */}

<Box
  sx={{
    mt: "auto",
    pt: 1.5,
    borderTop: `1px solid ${
      isDark ? "rgba(255, 255, 255, 0.07)" : "rgba(0, 0, 0, 0.07)"
    }`,
  }}
>
  <Tooltip
    title={!isHovered ? "Profile & Account" : ""}
    placement="right"
    arrow
  >
    <Box
      role="button"
      tabIndex={0}
      aria-label="Open Profile Panel"
      onClick={() => togglePanel("profile")}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          togglePanel("profile");
        }
      }}
      sx={{
        position: "relative",
        isolation: "isolate",
        display: "flex",
        alignItems: "center",
        gap: 1.5,
        minHeight: 52,
        p: 0.8,
        borderRadius: "14px",
        cursor: "pointer",
        overflow: "hidden",

        background:
          activePanel === "profile"
            ? isDark
              ? "rgba(255, 255, 255, 0.1)"
              : "rgba(0, 0, 0, 0.07)"
            : "transparent",

        transition:
          "background-color 0.18s ease, border-color 0.18s ease",

        "&:hover": {
          backgroundColor: isDark
            ? "rgba(255, 255, 255, 0.06)"
            : "rgba(0, 0, 0, 0.05)",
        },

        /**
         * Profile image background.
         *
         * Only becomes visible while the sidebar is expanded.
         * The gradient fades the image from visible on the left
         * into the normal panel background on the right.
         */
        ...(isHovered &&
          userData.photoURL && {
            "&::before": {
              content: '""',
              position: "absolute",
              inset: 0,
              zIndex: -2,

              backgroundImage: `url("${userData.photoURL}")`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",

              opacity: 0,

              WebkitMaskImage:
                "linear-gradient(90deg, #000 0%, #000 50%, #000 100%, transparent 88%)",
              maskImage:
                "linear-gradient(90deg, #000 0%, #000 50%, #000 100%, transparent 88%)",

              transition: "opacity 0.25s ease",
              pointerEvents: "none",
            },

          }),
      }}
    >
      <Badge
        overlap="circular"
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        variant="dot"
        sx={{
          flexShrink: 0,

          "& .MuiBadge-badge": {
            backgroundColor: "#44b700",
            color: "#44b700",
            boxShadow: `0 0 0 2px ${
              isDark ? "#121212" : "#fff"
            }`,
            width: 9,
            height: 9,
            zIndex: 3,
            opacity: isHovered ? 1 : 1,
            transition: "opacity 0.2s ease",
          },
        }}
      >
        <Avatar
          src={userData.photoURL || undefined}
          alt={userData.name || "User"}
          sx={{
            width: 36,
            height: 36,
            borderRadius: 8,
            fontSize: "0.95rem",
            fontWeight: 600,
            opacity: isHovered ? 1 : 1,

            bgcolor: isDark
              ? "rgba(255,255,255,0.12)"
              : "rgba(0,0,0,0.08)",

            color: isDark ? "#fff" : "#111",

            border: 0,

            position: "relative",
            zIndex: 2,

            transition: "transform 0.2s ease",

            ".MuiBox-root:hover &": {
              transform: "scale(1.03)",
            },
          }}
        >
          {!userData.photoURL &&
            (userData.name?.charAt(0)?.toUpperCase() || "U")}
        </Avatar>
      </Badge>

      {isHovered && (
        <Box
          sx={{
            position: "relative",
            zIndex: 2,

            minWidth: 0,
            flex: 1,

            overflow: "hidden",
            whiteSpace: "nowrap",

            animation: "bmFadeIn 0.2s ease forwards",

            "@keyframes bmFadeIn": {
              from: {
                opacity: 0,
                transform: "translateX(-5px)",
              },
              to: {
                opacity: 1,
                transform: "translateX(0)",
              },
            },
          }}
        >
          <Typography
            variant="body2"
            sx={{
              fontWeight: 600,
              fontSize: "0.88rem",
              lineHeight: 1.2,

              color: isDark ? "#fff" : "#111",

              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {userData.name || "User"}
          </Typography>

          <Typography
            variant="caption"
            sx={{
              color: isDark
                ? "rgba(255,255,255,0.58)"
                : "rgba(0,0,0,0.52)",

              fontSize: "0.74rem",
              display: "block",
              lineHeight: 1.1,

              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            @{userData.username || "user"}
          </Typography>
        </Box>
      )}
    </Box>
  </Tooltip>
</Box>

    </Box>
  );
};

export default DesktopSidebar;
