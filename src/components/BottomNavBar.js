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
  ChatBubble,
} from "@mui/icons-material";
import { Box, Button, Badge, Zoom, keyframes, Typography, CircularProgress } from "@mui/material";
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

  const [visible, setVisible] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [pulseAnim, setPulseAnim] = useState(false);
  const prevUnread = useRef(0);
  const [userData, setUserData] = useState({ name: "", username: "" });
  const [loadingUserData, setLoadingUserData] = useState(true);

  const navItems = [
    { label: "Home", path: "/", icon: <HomeOutlined />, activeIcon: <Home /> },
    { label: "Notes", path: "/notes", icon: <StickyNote2Outlined />, activeIcon: <StickyNote2 /> },
    { label: "Trips", path: "/trips", icon: <ExploreOutlined />, activeIcon: <Explore /> },
    { label: "Chats", path: "/chats", icon: <ChatBubbleOutline />, activeIcon: <ChatBubble /> },
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
              <Link
                key={item.label}
                to={item.path}
                style={{
                  textDecoration: "none",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  flex: 1,
                }}
              >
                <Box
                  sx={{
                    height: 40,
                    width: 56,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transform: isActive ? "scale(1.1)" : "scale(1)",
                    backgroundColor: isActive
                      ? mode === "dark" ? "#ffffffd0" : "#000000d0"
                      : "transparent",
                    borderRadius: 10,
                    color: isActive
                      ? mode === "dark"
                        ? "#000"
                        : "#fff"
                      : mode === "dark"
                        ? "#bcbcbc"
                        : "#333",
                    transition: "all 0.25s ease",
                  }}
                >
                  {isActive ? item.activeIcon : item.icon}
                </Box>
              </Link>
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
