import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import {
  Box,
  ThemeProvider,
  Badge
} from "@mui/material";
import {
  NotificationsNoneOutlined,
} from "../icons";

import { collection, query, where, onSnapshot } from "firebase/firestore";
import { useThemeToggle } from "../contexts/ThemeToggleContext";
import { getTheme } from "../theme";
import { getCachedData, setCachedData } from "../utils/chatCache";

const ProfilePic = () => {
  const navigate = useNavigate();
  const { mode, accent } = useThemeToggle();
  const theme = getTheme(mode, accent);

  const [unreadCount, setUnreadCount] = useState(() => {
    const uid = auth.currentUser?.uid;
    return uid ? getCachedData(`user_unread_notifs_${uid}`, 0) : 0;
  });

  useEffect(() => {
    if (!auth.currentUser) return;

    const userId = auth.currentUser.uid;
    const notificationsQuery = query(
      collection(db, "notifications"),
      where("uid", "==", userId),
      where("seen", "==", false)
    );

    const unsubscribe = onSnapshot(notificationsQuery, (querySnapshot) => {
      setUnreadCount(querySnapshot.size);
      setCachedData(`user_unread_notifs_${userId}`, querySnapshot.size);
    });

    return () => unsubscribe();
  }, []);

  return (
  <ThemeProvider theme={theme}>
<>

  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>

    <Badge
        color="error"
        variant="dot"
        badgeContent={unreadCount}
        sx={{
            '& .MuiBadge-badge': {
                right: 8,
                top: 6,
            },
        }}
    >
      <NotificationsNoneOutlined
        sx={{ fontSize: 28, color: mode === "dark" ? "#fff" : "#333", cursor: "pointer" }}
        onClick={() => navigate("/notifications")}
      />
    </Badge>

</Box>

</>
</ThemeProvider>
    );
};

export default ProfilePic;
