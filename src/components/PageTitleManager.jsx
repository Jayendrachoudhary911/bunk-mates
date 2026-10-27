import { useEffect, useState, useRef } from "react";
import { useLocation } from "react-router-dom";
import { auth, db } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, query, where, onSnapshot } from "firebase/firestore";

/**
 * Maps current URL pathname to a clean, descriptive page title.
 */
function resolvePageTitle(pathname, activeGroupName = null) {
  if (!pathname || pathname === "/" || pathname === "/home") {
    return "Home";
  }

  // Chats & messaging
  if (pathname === "/chats") {
    return "Chats";
  }
  if (pathname.startsWith("/chat/")) {
    return "Chat";
  }
  if (pathname.startsWith("/group/")) {
    if (activeGroupName) {
      return activeGroupName;
    }
    const rawGroupName = pathname.replace("/group/", "");
    try {
      const cached = localStorage.getItem(`bm_group_name_${rawGroupName}`);
      if (cached) return cached;
      const rawInfo = localStorage.getItem(`bunkmate_cache_group_info_${rawGroupName}`);
      if (rawInfo) {
        const parsed = JSON.parse(rawInfo);
        if (parsed?.name) return parsed.name;
      }
    } catch (e) {}
    const decoded = decodeURIComponent(rawGroupName);
    return decoded ? `${decoded}` : "Group Chat";
  }

  // Trips
  if (pathname === "/trips") {
    return "Trips";
  }
  if (pathname === "/trips/create" || pathname === "/create-trip") {
    return "Create Trip";
  }
  if (pathname === "/saved-trips") {
    return "Saved Trips";
  }
  if (pathname.startsWith("/trips/")) {
    return "Trip Details";
  }
  if (pathname === "/join") {
    return "Join Trip";
  }
  if (pathname.startsWith("/group-invite/")) {
    return "Group Invite";
  }

  // Notes
  if (pathname === "/notes") {
    return "Notes";
  }
  if (pathname === "/notes/new/workspace") {
    return "New Note";
  }
  if (pathname.endsWith("/workspace") && pathname.startsWith("/notes/")) {
    return "Edit Note";
  }
  if (pathname.startsWith("/notes/")) {
    return "Note Details";
  }

  // Exploration & Social
  if (pathname === "/search") {
    return "Discover & Search";
  }
  if (pathname === "/community") {
    return "Community";
  }
  if (pathname === "/waitlist") {
    return "Wishlist";
  }

  // Profile & User
  if (pathname === "/profile") {
    return "My Profile";
  }
  if (pathname.startsWith("/profile/")) {
    return "User Profile";
  }

  // Tools & Utilities
  if (pathname === "/travel-ai") {
    return "AI Travel Planner";
  }
  if (pathname === "/budget-mngr") {
    return "Budget Manager";
  }
  if (pathname === "/reminders") {
    return "Reminders";
  }
  if (pathname === "/notifications") {
    return "Notifications";
  }

  // Auth
  if (
    pathname === "/auth" ||
    pathname === "/login" ||
    pathname.startsWith("/auth/login")
  ) {
    return "Sign In";
  }
  if (
    pathname === "/signup" ||
    pathname.startsWith("/auth/signup")
  ) {
    return "Sign Up";
  }
  if (pathname === "/forgot-password") {
    return "Forgot Password";
  }
  if (pathname === "/reset-password") {
    return "Reset Password";
  }

  // Policies & Info
  if (pathname === "/privacy-policy") {
    return "Privacy Policy";
  }
  if (pathname === "/terms") {
    return "Terms & Conditions";
  }
  if (pathname === "/account-deletion-policy") {
    return "Account Deletion Policy";
  }

  // Fallback: capitalize route segments
  const cleanSegment = pathname
    .split("/")
    .filter(Boolean)[0];
  if (cleanSegment) {
    return cleanSegment
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  }

  return "Home";
}

/**
 * Updates the browser's favicon with an optional unread notification badge dot/counter.
 */
function updateFaviconBadge(unreadCount, originalFaviconUrl) {
  if (typeof document === "undefined") return;

  let link = document.querySelector("link[rel~='icon']");
  if (!link) {
    link = document.createElement("link");
    link.rel = "icon";
    document.getElementsByTagName("head")[0].appendChild(link);
  }

  if (unreadCount <= 0) {
    if (link.href !== originalFaviconUrl && originalFaviconUrl) {
      link.href = originalFaviconUrl;
    }
    return;
  }

  // Render on off-screen canvas with badge
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const img = new Image();
  img.crossOrigin = "anonymous";
  img.src = originalFaviconUrl || "/logo.svg";

  img.onload = () => {
    ctx.clearRect(0, 0, 64, 64);
    // Draw base icon
    ctx.drawImage(img, 0, 0, 64, 64);

    // Draw notification badge
    const badgeText = unreadCount > 99 ? "99+" : String(unreadCount);
    const badgeRadius = unreadCount > 9 ? 16 : 14;
    const badgeX = 64 - badgeRadius;
    const badgeY = badgeRadius;

    // Outer glow / border for dark or light browser tab contrast
    ctx.beginPath();
    ctx.arc(badgeX, badgeY, badgeRadius + 2, 0, 2 * Math.PI);
    ctx.fillStyle = "#ffffff";
    ctx.fill();

    // Red badge circle
    ctx.beginPath();
    ctx.arc(badgeX, badgeY, badgeRadius, 0, 2 * Math.PI);
    ctx.fillStyle = "#ff3b30";
    ctx.fill();

    // Badge text
    ctx.fillStyle = "#ffffff";
    ctx.font = `bold ${badgeRadius > 14 ? 14 : 16}px system-ui, -apple-system, BlinkMacSystemFont, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(badgeText, badgeX, badgeY + 1);

    link.href = canvas.toDataURL("image/png");
  };

  img.onerror = () => {
    // If base image fails to load, draw a standalone red badge dot
    ctx.clearRect(0, 0, 64, 64);
    ctx.beginPath();
    ctx.arc(32, 32, 28, 0, 2 * Math.PI);
    ctx.fillStyle = "#ff3b30";
    ctx.fill();

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 24px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(unreadCount > 9 ? "9+" : String(unreadCount), 32, 33);

    link.href = canvas.toDataURL("image/png");
  };
}

export default function PageTitleManager() {
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);

  const [activeGroupName, setActiveGroupName] = useState(() => {
    if (typeof window !== "undefined" && window.location.pathname.startsWith("/group/")) {
      const raw = window.location.pathname.replace("/group/", "");
      try {
        const cached = localStorage.getItem(`bm_group_name_${raw}`);
        if (cached) return cached;
        const rawInfo = localStorage.getItem(`bunkmate_cache_group_info_${raw}`);
        if (rawInfo) {
          const parsed = JSON.parse(rawInfo);
          if (parsed?.name) return parsed.name;
        }
      } catch (e) {}
    }
    return null;
  });

  const originalFaviconRef = useRef(null);

  // Capture original favicon URL on mount
  useEffect(() => {
    const existingLink = document.querySelector("link[rel~='icon']");
    if (existingLink && existingLink.href) {
      originalFaviconRef.current = existingLink.href;
    } else {
      originalFaviconRef.current = `${window.location.origin}/logo.svg`;
    }
  }, []);

  // Sync group name when pathname changes or group info event fires
  useEffect(() => {
    if (location.pathname.startsWith("/group/")) {
      const raw = location.pathname.replace("/group/", "");
      try {
        const cached = localStorage.getItem(`bm_group_name_${raw}`);
        if (cached) {
          setActiveGroupName(cached);
          return;
        }
        const rawInfo = localStorage.getItem(`bunkmate_cache_group_info_${raw}`);
        if (rawInfo) {
          const parsed = JSON.parse(rawInfo);
          if (parsed?.name) {
            setActiveGroupName(parsed.name);
            return;
          }
        }
      } catch (e) {}
    } else {
      setActiveGroupName(null);
    }
  }, [location.pathname]);

  useEffect(() => {
    const handleGroupInfo = (e) => {
      if (e.detail?.name) {
        setActiveGroupName(e.detail.name);
      }
    };
    window.addEventListener("bm_group_info_loaded", handleGroupInfo);
    return () => {
      window.removeEventListener("bm_group_info_loaded", handleGroupInfo);
    };
  }, []);

  // Real-time unread count directly from Firestore DB notifications
  useEffect(() => {
    let notifUnsub = null;
    const authUnsub = onAuthStateChanged(auth, (user) => {
      if (notifUnsub) {
        notifUnsub();
        notifUnsub = null;
      }
      if (!user?.uid) {
        setUnreadCount(0);
        return;
      }
      try {
        const notifQ = query(
          collection(db, "notifications"),
          where("uid", "==", user.uid),
          where("seen", "==", false)
        );
        notifUnsub = onSnapshot(
          notifQ,
          (snapshot) => {
            setUnreadCount(snapshot.size);
          },
          () => {}
        );
      } catch {}
    });

    const handleUnreadTotal = (e) => {
      const count = typeof e.detail === "number" ? e.detail : parseInt(e.detail, 10);
      setUnreadCount(isNaN(count) ? 0 : Math.max(0, count));
    };

    window.addEventListener("bm_unread_total_changed", handleUnreadTotal);

    return () => {
      if (notifUnsub) notifUnsub();
      authUnsub();
      window.removeEventListener("bm_unread_total_changed", handleUnreadTotal);
    };
  }, []);

  // Update document.title and favicon when route or unread count changes
  useEffect(() => {
    const rawPageTitle = resolvePageTitle(location.pathname, activeGroupName);
    let finalTitle = `${rawPageTitle} · BunkMates`;

    if (unreadCount > 0) {
      finalTitle = `(${unreadCount}) ${finalTitle}`;
    }

    document.title = finalTitle;

    // Update dynamic favicon badge
    updateFaviconBadge(unreadCount, originalFaviconRef.current);
  }, [location.pathname, unreadCount, activeGroupName]);

  return null;
}
