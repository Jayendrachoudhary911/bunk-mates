// src/components/BottomNavBar.js
import React, { useEffect, useState, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  HomeOutlined as Home, // Using Outlined as default Home
  HomeOutlined,
  StickyNote2Outlined,
  StickyNote2Outlined as StickyNote2,
  ExploreOutlined,
  ExploreOutlined as Explore,
  Search as SearchOutlined, // Map Search to SearchOutlined
  Search,
  ChatBubbleOutline,
  ChatBubbleOutline as Chat,
  ChatBubbleOutline as ChatBubble,
  ChevronLeft,
  ChevronRight,
  // Fix: Hamburger & Menu not found, using CategoryOutlined as substitute
  CategoryOutlined as Hamburger,
  CategoryOutlined as Menu,
  ArrowDropDown as ArrowDropDownIcon,
  NotificationsNoneOutlined as NotificationsOutlined,
  NotificationsNoneOutlined as Notifications,
} from "../icons/LucideIcons";
import { Box, Button, Badge, Zoom, keyframes, Typography, CircularProgress, Stack, Tooltip, useMediaQuery, IconButton, Avatar } from "@mui/material";
import { useThemeToggle } from "../contexts/ThemeToggleContext";
import { getTheme } from "../theme";
import { db } from "../firebase";
import {
  doc,
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  limit,
  getDoc,
} from "firebase/firestore";
import ProfilePic from "./Profile";
import { useAuth } from "../hooks/useAuth";

// 🔥 Keyframes for pulsing animation
const pulse = keyframes`
  0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(255, 82, 82, 0.7); }
  70% { transform: scale(1.2); box-shadow: 0 0 8px 4px rgba(255, 82, 82, 0); }
  100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(255, 82, 82, 0); }
`;

const BottomNavBar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { mode, accent } = useThemeToggle();
  const theme = getTheme(mode, accent);
  const { user: currentUser, loading: authLoading } = useAuth();

  const isDesktop = useMediaQuery("(min-width:1024px)");
  const [isExpanded, setIsExpanded] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [visible, setVisible] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [pulseAnim, setPulseAnim] = useState(false);
  const prevUnread = useRef(0);
  const [userData, setUserData] = useState({ name: "", username: "" });
  const [loadingUserData, setLoadingUserData] = useState(true);

  const navItems = [
    { label: "Home", path: "/", icon: <HomeOutlined />, activeIcon: <Home stroke={mode === "dark" ? "#000000" : "#ffffff"} /> },
    { label: "Notes", path: "/notes", icon: <StickyNote2Outlined />, activeIcon: <StickyNote2 stroke={mode === "dark" ? "#000000" : "#ffffff"} /> },
    { label: "Trips", path: "/trips", icon: <ExploreOutlined />, activeIcon: <Explore stroke={mode === "dark" ? "#000000" : "#ffffff"} /> },
    { label: "Chats", path: "/chats", icon: <ChatBubbleOutline />, activeIcon: <ChatBubble stroke={mode === "dark" ? "#000000" : "#ffffff"} /> },
  ];

    const navItemsdesk = [
    { label: "Home", path: "/", icon: <HomeOutlined />, activeIcon: <Home /> },
    { label: "Notes", path: "/notes", icon: <StickyNote2Outlined />, activeIcon: <StickyNote2 /> },
    { label: "Trips", path: "/trips", icon: <ExploreOutlined />, activeIcon: <Explore /> },
    { label: "Chats", path: "/chats", icon: <ChatBubbleOutline />, activeIcon: <ChatBubble /> },
    { label: "Notifications", path: "/notifications", icon: <NotificationsOutlined />, activeIcon: <Notifications /> },
  ];

  // Fetch user data
  useEffect(() => {
    const fetchUserData = async () => {
      if (authLoading || !currentUser?.uid) {
        setLoadingUserData(authLoading);
        return;
      }
      setLoadingUserData(true);
      try {
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        if (userDoc.exists()) {
          setUserData(userDoc.data());
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setLoadingUserData(false);
      }
    };
    fetchUserData();
  }, [currentUser, authLoading]);

  // 🔔 Unread count listener (chats + groups)
  useEffect(() => {
    if (!currentUser?.uid) return;
    let unsubscribers = [];

    const updateUnreadCount = (newCount) => {
      setUnreadCount(newCount);
      if (newCount > prevUnread.current) {
        setPulseAnim(true);
        setTimeout(() => setPulseAnim(false), 600);
      }
      prevUnread.current = newCount;
    };

    let totalUnread = 0;

    // User Chats
    const userChatRef = doc(db, "userChats", currentUser.uid);
    const unsubUserChats = onSnapshot(userChatRef, (docSnap) => {
      if (docSnap.exists()) {
        const chats = docSnap.data();
        let count = 0;
        Object.entries(chats).forEach(([_, chat]) => {
          const unread =
            chat.lastMessage &&
            chat.lastMessage.sender !== currentUser.uid &&
            !chat.lastMessage.readBy?.includes(currentUser.uid);
          if (unread) count++;
        });
        totalUnread = count;
        updateUnreadCount(totalUnread);
      }
    });
    unsubscribers.push(unsubUserChats);

    // Group Chats
    const groupQ = query(
      collection(db, "groupChats"),
      where("members", "array-contains", currentUser.uid)
    );
    const unsubGroups = onSnapshot(groupQ, (snapshot) => {
      let groupUnread = 0;
      const listeners = [];

      snapshot.forEach((groupDoc) => {
        const groupId = groupDoc.id;
        const msgQ = query(
          collection(db, "groupChat", groupId, "messages"),
          orderBy("timestamp", "desc"),
          limit(1)
        );

        const unsubMsgs = onSnapshot(msgQ, (snap) => {
          snap.forEach((msgDoc) => {
            const data = msgDoc.data();
            if (
              data.senderId !== currentUser.uid &&
              !data.isRead &&
              !data.readBy?.includes(currentUser.uid)
            ) {
              groupUnread += 1;
            }
          });
          updateUnreadCount(totalUnread + groupUnread);
        });

        listeners.push(unsubMsgs);
      });

      unsubscribers.push(...listeners);
    });
    unsubscribers.push(unsubGroups);

    return () => unsubscribers.forEach((u) => u && u());
  }, [currentUser]);

  // 📍 Active nav index
  useEffect(() => {
    const index = navItems.findIndex((i) => location.pathname === i.path);
    setActiveIndex(index === -1 ? 0 : index);
  }, [location.pathname]);

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
    return () => window.removeEventListener("scroll", onScroll);
  }, [location.pathname]);

  const isChatActive = location.pathname.startsWith("/chats");

const handleTogglePin = (e) => {
  e.stopPropagation(); // Prevent trigger conflicts
  const newPinnedState = !isPinned;
  setIsPinned(newPinnedState);
  setIsExpanded(newPinnedState); // If pinning, stay expanded; if unpinning, stay collapsed until hover
};

const handleMouseEnter = () => {
  if (!isPinned) setIsExpanded(true);
};

const handleMouseLeave = () => {
  if (!isPinned) setIsExpanded(false);
};

  if (isDesktop) {
return (
  <Box
    onMouseEnter={handleMouseEnter}
    onMouseLeave={handleMouseLeave}
    sx={{
      width: isExpanded ? 225 : 50,
      height: "95vh",
      position: "fixed",
      left: 0,
      top: 0,
      display: "flex",
      flexDirection: "column",
      transition: "all 0.45s cubic-bezier(0.4, 0, 0.2, 1)",
      borderRadius: 3,
      background:
        mode === "dark"
          ? "linear-gradient(180deg, #0c0c0c50, #09090956)"
          : "linear-gradient(180deg, #fafafa49, #f1f1f147)",
      backdropFilter: "blur(20px) saturate(1.2)",
      borderRight: `1px solid ${
        mode === "dark" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"
      }`,
      boxShadow:
        mode === "dark"
          ? "4px 0 30px rgba(0,0,0,0.6)"
          : "4px 0 24px rgba(0,0,0,0.08)",
      zIndex: 1400,
      px: 2,
      py: 3,
    }}
  >

    {/* ───── Logo Area ───── */}
    <Box sx={{ display: "flex", alignItems: "center", mb: 6, px: 2, gap: 2 }}>
    <IconButton
      onClick={handleTogglePin}
      sx={{
        width: "10%",
        height: "10%",
        borderRadius: 3,
        border: `1px solid ${
          mode === "dark" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"
        }`,
        backdropFilter: "blur(8px)",
        "&:hover": {
          bgcolor: mode === "dark" ? "#ffffff10" : "#00000008",
        },
      }}
    >
      {/* {isExpanded ? <ChevronLeft /> : <ChevronRight />} */}
      <Menu />
    </IconButton>

      {isExpanded && (
        <Typography
          variant="h6"
          sx={{
            fontWeight: 500,
            letterSpacing: "0.04em",
            color: theme.palette.text.primary,
            animation: "fadeSlide 0.4s ease",
            "@keyframes fadeSlide": {
              from: { opacity: 0, transform: "translateX(-8px)" },
              to: { opacity: 1, transform: "translateX(0)" },
            },
          }}
        >
          BunkMate
        </Typography>
      )}
    </Box>

    {/* ───── Navigation ───── */}
    <Stack spacing={1} sx={{ flexGrow: 1 }}>
      {navItemsdesk.map((item, index) => {
        const isActive = activeIndex === index;

        return (
          <Tooltip
            key={item.label}
            title={!isExpanded ? item.label : ""}
            placement="right"
          >
            <Box
              onClick={() => navigate(item.path)}
              sx={{
                display: "flex",
                alignItems: "center",
                p: 1.5,
                borderRadius: 4,
                cursor: "pointer",
                position: "relative",
                overflow: "hidden",
                transition: "all 0.25s ease",
                bgcolor: isActive
                  ? mode === "dark"
                    ? "rgba(255,255,255,0.08)"
                    : "rgba(0,0,0,0.06)"
                  : "transparent",
                color: isActive
                  ? mode === "dark"
                    ? "#fff"
                    : "#000"
                  : "text.secondary",
                "&:hover": {
                  bgcolor:
                    mode === "dark"
                      ? "rgba(255,255,255,0.05)"
                      : "rgba(0,0,0,0.08)",
                },
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  mr: isExpanded ? 2 : 0,
                  transform: isActive ? "scale(1.15)" : "scale(1)",
                  transition: "transform 0.2s",
                }}
              >
                {isActive ? item.activeIcon : item.icon}
              </Box>

              {isExpanded && (
                <Typography
                  variant="body2"
                  sx={{ fontWeight: isActive ? 700 : 500 }}
                >
                  {item.label}
                </Typography>
              )}
            </Box>
          </Tooltip>
        );
      })}
    </Stack>

    {/* ───── Profile Section ───── */}
    <Box sx={{ mt: "auto" }}>
      <Box
        onClick={() => navigate("?settings=main")}
        sx={{
          display: "flex",
          alignItems: "center",
          px: 1,
          py: 1.5,
          borderRadius: 4,
          cursor: "pointer",
          transition: "all 0.25s",
          "&:hover": {
            bgcolor:
              mode === "dark"
                ? "rgba(255,255,255,0.06)"
                : "rgba(0,0,0,0.06)",
          },
        }}
      >
        {loadingUserData ? (
          <CircularProgress size={20} />
        ) : (
          <>
            <Avatar
              src={userData?.photoURL || ""}
              sx={{
                width: 32,
                height: 32,
                mr: isExpanded ? 1.5 : 0,
                border: "2px solid rgba(255,255,255,0.2)",
                ml: 0
              }}
            />

            {isExpanded && (
              <Box
                sx={{
                  ml: "auto",
                  px: 0,
                  py: 1,
                  borderRadius: 2,
                  background: "transparent",
                  boxShadow: "none",
                  animation: "fadeUp 0.35s ease",
                  "@keyframes fadeUp": {
                    from: { opacity: 0, transform: "translateY(6px)" },
                    to: { opacity: 1, transform: "translateY(0)" },
                  },
                }}
              >
                <Typography
                  variant="body2"
                  fontWeight={700}
                  lineHeight={1.2}
                  sx={{ color: "text.primary" }}
                >
                  {userData?.name || "Username"}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ color: "text.secondary" }}
                >
                  @{userData?.username || "email"}
                </Typography>
              </Box>
            )}
          </>
        )}
      </Box>
    </Box>
  </Box>
);

  }

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
        maxWidth: 370,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        pointerEvents: "auto",
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
          backdropFilter: "blur(14px) saturate(1.4)",
          background:
            mode === "dark"
              ? "linear-gradient(135deg, rgba(20, 20, 20, 0.12), rgba(40, 40, 40, 0))"
              : "linear-gradient(135deg, rgba(255, 255, 255, 0.12), rgba(240, 240, 240, 0))",
          border:
            mode === "dark"
              ? "1px solid rgba(255,255,255,0.08)"
              : "1px solid rgba(0,0,0,0.08)",
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
              ml: 1,
              mr: 0.8,
              mb: 0.6,
              width: 56,
              py: 0,
              borderRadius: 10,
              height: 56,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              background:
                mode === "dark"
                  ? "linear-gradient(135deg, rgba(20, 20, 20, 0.12), rgba(40, 40, 40, 0))"
                  : "linear-gradient(135deg, rgba(255, 255, 255, 0.12), rgba(240, 240, 240, 0))",
              color: 
                 mode === "dark"
                  ? "#fff"
                  : "#000",
              backdropFilter: "blur(10px)",
              border: mode === "dark"
                ? "1px solid rgba(255,255,255,0.07)"
                : "1px solid rgba(0,0,0,0.07)",
              transition: "all 0.3s ease",
              transform: "scale(1)",
              cursor: 'pointer',
              "&:hover": {
                transform: "scale(1.1)",
                background: theme.palette.primary.main + "20",
              },
            }}
          >
            {loadingUserData ? (
              <CircularProgress size={20} />
            ) : (
              <>
                <ProfilePic currentUser={currentUser} />
              </>
            )}
          </Box>
    </Box>
  </Box>
);
};

export default BottomNavBar;
