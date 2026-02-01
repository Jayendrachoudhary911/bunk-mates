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
} from "../icons/LucideIcons";

import { collection, query, where, onSnapshot } from "firebase/firestore";
import { useThemeToggle } from "../contexts/ThemeToggleContext";
import { getTheme } from "../theme";

const ProfilePic = () => {
  const navigate = useNavigate();
  const { mode, accent } = useThemeToggle();
  const theme = getTheme(mode, accent);

  // const [language, setLanguage] = useState('en-US'); // Default language
  // const [languageDrawerOpen, setLanguageDrawerOpen] = useState(false);
  // const [searchTerm, setSearchTerm] = useState('');

  const [unreadCount, setUnreadCount] = useState(0);

  // Place this at the top level of your component, with your other hooks


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
        });

        // Cleanup listener on component unmount
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
