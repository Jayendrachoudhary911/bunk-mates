// src/components/BottomNavBar.js
import React, { useEffect, useState, useRef } from "react";
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
  Chat,
} from "@mui/icons-material";
import { Box, Button, Badge, Zoom, keyframes } from "@mui/material";
import { useThemeToggle } from "../contexts/ThemeToggleContext";
import { getTheme } from "../theme";
import { auth, db } from "../firebase";
import {
  doc,
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  limit,
} from "firebase/firestore";

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

  const [visible, setVisible] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [pulseAnim, setPulseAnim] = useState(false);
  const prevUnread = useRef(0);
  const [currentUser, setCurrentUser] = useState(null);

  const navItems = [
    { label: "Home", path: "/", icon: <HomeOutlined />, activeIcon: <Home /> },
    { label: "Search", path: "/search", icon: <SearchOutlined />, activeIcon: <Search /> },
    { label: "Notes", path: "/notes", icon: <StickyNote2Outlined />, activeIcon: <StickyNote2 /> },
    { label: "Trips", path: "/trips", icon: <ExploreOutlined />, activeIcon: <Explore /> },
  ];

  // 🔒 Detect auth user
  useEffect(() => {
    const unsub = auth.onAuthStateChanged((u) => setCurrentUser(u));
    return () => unsub();
  }, []);

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
        background:
          mode === "dark"
            ? "linear-gradient(to bottom, rgba(255,255,255,0), rgba(0,0,0,0.95))"
            : "linear-gradient(to bottom, rgba(255,255,255,0), rgba(255,255,255,0.95))",
      }}
    >
      {/* Nav Buttons */}
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
          backdropFilter: "blur(14px) saturate(1.4)",
          background:
            mode === "dark"
              ? "linear-gradient(135deg, rgba(20,20,20,0.85), rgba(40,40,40,0.6))"
              : "linear-gradient(135deg, rgba(255,255,255,0.7), rgba(240,240,240,0.5))",
          border: mode === "dark"
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
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  flex: 1,
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
                    transition: "all 0.3s ease",
                  }}
                >
                  {isActive ? item.activeIcon : item.icon}
                </Box>
              </Link>
            );
          })}
        </Box>
      </Box>

      {/* 💬 Chat Button with pulse badge */}
      <Zoom in>
        <Badge
          overlap="circular"
          badgeContent={unreadCount > 0 ? unreadCount : null}
          color="error"
          sx={{
            "& .MuiBadge-badge": {
              fontSize: "0.7rem",
              fontWeight: 600,
              minWidth: 18,
              height: 18,
              boxShadow: "0 0 6px rgba(0,0,0,0.3)",
              animation: pulseAnim ? `${pulse} 0.8s ease` : "none",
            },
          }}
        >
          <Button
            onClick={() => navigate("/chats")}
            sx={{
              ml: 1,
              mr: 0.8,
              mb: 0.6,
              width: 65,
              height: 65,
              borderRadius: "20px",
              background: isChatActive
                ? theme.palette.primary.main
                : theme.palette.primary.main + "7d",
              color: isChatActive
                ? theme.palette.primary.maintxt
                : mode === "dark"
                  ? "#fff"
                  : "#000",
              backdropFilter: "blur(10px)",
              border: mode === "dark"
                ? "1px solid rgba(255,255,255,0.07)"
                : "1px solid rgba(0,0,0,0.07)",
              transition: "all 0.3s ease",
              transform: isChatActive ? "scale(1.05)" : "scale(1)",
              "&:hover": {
                transform: "scale(1.1)",
                background: theme.palette.primary.main,
              },
            }}
          >
            {isChatActive ? (
              <Chat sx={{ fontSize: 22 }} />
            ) : (
              <ChatBubbleOutline sx={{ fontSize: 22 }} />
            )}
          </Button>
        </Badge>
      </Zoom>
    </Box>
  );
};

export default BottomNavBar;
