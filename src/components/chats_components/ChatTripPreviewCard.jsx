import React, { useState, useEffect } from "react";
import { Box, Typography, Button, Chip, Stack } from "@mui/material";
import FlightTakeoffIcon from "@mui/icons-material/FlightTakeoff";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import GroupIcon from "@mui/icons-material/Group";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import ShareOutlinedIcon from "@mui/icons-material/ShareOutlined";
import { useNavigate } from "react-router-dom";
import { safeImageUrl } from "../../utils/uiHelpers";
import { collection, query, where, getDocs, getFirestore } from "firebase/firestore";

const ChatTripPreviewCard = ({ cardData = {}, isDark = true, onShare = null }) => {
  const navigate = useNavigate();
  const [resolvedImageUrl, setResolvedImageUrl] = useState("");

  const tripId = cardData.tripId || cardData.id;
  const title = cardData.title || cardData.name || "Trip";
  const destination = cardData.destination || cardData.to || title;
  const startDate = cardData.startDate || "";
  const endDate = cardData.endDate || "";
  const budget = cardData.budget || 0;
  const membersCount = cardData.membersCount || (Array.isArray(cardData.members) ? cardData.members.length : 1);
  
  // Initial fallback image from cardData
  const initialImage = safeImageUrl(cardData.imageUrl || cardData.image || cardData.iconURL || cardData.iconUrl);

  // Effect to fetch profile picture from the "groupChats" Firestore collection matching tripId
  useEffect(() => {
    let isMounted = true;

    const fetchGroupChatIcon = async () => {
      if (!tripId) {
        if (isMounted) setResolvedImageUrl(initialImage);
        return;
      }

      // If iconURL or iconUrl is explicitly passed in cardData, use it immediately
      if (cardData.iconURL || cardData.iconUrl) {
        if (isMounted) setResolvedImageUrl(safeImageUrl(cardData.iconURL || cardData.iconUrl));
        return;
      }

      try {
        const db = getFirestore();
        const groupChatsRef = collection(db, "groupChats"); // Matches Firestore collection name[cite: 10]
        const q = query(groupChatsRef, where("tripId", "==", tripId));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const groupData = querySnapshot.docs[0].data();
          // Matches field name iconURL from your DB schema[cite: 10]
          const chatIcon = groupData.iconURL || groupData.iconUrl || groupData.photoURL || groupData.image;
          if (chatIcon && isMounted) {
            setResolvedImageUrl(safeImageUrl(chatIcon));
            return;
          }
        }

        // Fallback to default card image if no group chat match is found
        if (isMounted) {
          setResolvedImageUrl(initialImage);
        }
      } catch (error) {
        console.error("Error fetching group chat icon for trip from Firestore:", error);
        if (isMounted) setResolvedImageUrl(initialImage);
      }
    };

    fetchGroupChatIcon();

    return () => {
      isMounted = false;
    };
  }, [tripId, cardData.iconURL, cardData.iconUrl, initialImage]);

  const handleOpenTrip = (tab = null) => {
    if (!tripId) return;
    navigate(`/trip/${tripId}${tab ? `?tab=${tab}` : ""}`);
  };

  return (
    <Box
      sx={{
        mt: 1,
        mb: 1,
        minWidth: { xs: 260, sm: 320 },
        maxWidth: 380,
        width: "100%",
        overflow: "hidden",
        bgcolor: 'transparent',
        border: `0px solid`,
        boxShadow: 'none',
      }}
    >
      {/* Cover Image or Gradient Banner (Loads iconURL from Firestore groupChats) */}
      <Box
        sx={{
          height: 130,
          borderRadius: 5,
          mb: 1,
          position: "relative",
          bgcolor: isDark ? "#222222" : "#d0d0d0",
          backgroundImage: resolvedImageUrl
            ? `url(${resolvedImageUrl})`
            :  isDark ? "#000" : '#fff',
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            borderRadius: 4.9,
            background: isDark ? "linear-gradient(to right, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.2) 60%, transparent 100%)" : "linear-gradient(to right, rgba(0, 0, 0, 0.52) 0%, rgba(0,0,0,0.2) 60%, transparent 100%)",
          }}
        />

        {/* Top Tag */}
        <Box sx={{ position: "absolute", top: 12, left: 12 }}>
          <Chip
            icon={<FlightTakeoffIcon sx={{ fontSize: "13px !important", color: "#fff !important" }} />}
            label="Trip Invite"
            size="small"
            sx={{
              height: 24,
              fontSize: "0.7rem",
              fontWeight: 700,
              bgcolor: "rgba(255, 255, 255, 0.1)",
              color: "#fff",
              backdropFilter: "blur(10px)",
              boxShadow: "none",
            }}
          />
        </Box>

        {/* Destination Header */}
        <Box sx={{ position: "absolute", bottom: 35, left: 14, right: 14 }}>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 800,
              fontSize: "1.1rem",
              color: "#fff",
              lineHeight: 1.2,
              letterSpacing: "-0.01em",
            }}
            noWrap
          >
            {title}
          </Typography>
          {destination && destination !== title && (
            <Typography
              variant="caption"
              sx={{ color: "rgba(255,255,255,0.85)", fontSize: "0.75rem", fontWeight: 500 }}
              noWrap
            >
              📍 {destination}
            </Typography>
          )}
        </Box>

              {/* Details Body */}
      <Box sx={{ position: "absolute", bottom: 10, left: 10 }}>
        {/* Meta details chips */}
        <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", gap: 0.6 }}>
          {(startDate || endDate) && (
            <Chip
              icon={<CalendarMonthIcon sx={{ fontSize: "13px !important", opacity: 0.8 }} />}
              label={`${startDate || ""} ${endDate ? `→ ${endDate}` : ""}`}
              size="small"
              sx={{
                height: 24,
                fontSize: "0.7rem",
                fontWeight: 500,
                bgcolor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
                color: "rgba(255,255,255,0.9)",
                border: `0px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)"}`,
              }}
            />
          )}

          {budget > 0 && (
            <Chip
              icon={<AccountBalanceWalletIcon sx={{ fontSize: "13px !important", color: "#4caf50 !important" }} />}
              label={`₹${Number(budget).toLocaleString()}`}
              size="small"
              sx={{
                height: 24,
                fontSize: "0.7rem",
                fontWeight: 700,
                bgcolor: "rgba(76, 175, 80, 0.12)",
                color: "#4caf50",
                border: "0px solid rgba(76, 175, 80, 0.25)",
              }}
            />
          )}

          <Chip
            icon={<GroupIcon sx={{ fontSize: "13px !important", opacity: 0.8 }} />}
            label={`${membersCount} traveler${membersCount > 1 ? "s" : ""}`}
            size="small"
            sx={{
              height: 24,
              fontSize: "0.7rem",
              fontWeight: 500,
              bgcolor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
              color: "rgba(255,255,255,0.9)",
              border: `0px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)"}`,
            }}
          />
        </Stack>
      </Box>
      </Box>
              {/* Suggested Quick Access Action Buttons */}
        <Box sx={{ display: "flex", gap: 1, alignItems: "center", px: 1 }}>
          <Button
            fullWidth
            variant="contained"
            size="small"
            onClick={() => handleOpenTrip()}
            endIcon={<ArrowForwardIcon sx={{ fontSize: "14px !important" }} />}
            sx={{
              py: 0.8,
              borderRadius: 8,
              bgcolor: isDark ? "#dadada" : "#282828",
              color: isDark ? "#090909" : "#f5f5f5",
              textTransform: "none",
              fontWeight: 700,
              fontSize: "0.8rem",
              boxShadow: "none",
              transition: "all 150ms ease",
              "&:hover": { 
                bgcolor: isDark ? "#f1f0f0" : "#0f0f0f",
                boxShadow: "none",
              },
            }}
          >
            View Trip
          </Button>

          <Button
            variant="contained"
            size="small"
            fullWidth
            startIcon={<ShareOutlinedIcon sx={{ fontSize: 16 }} />}
              onClick={(e) => {
                e.stopPropagation();
                onShare(cardData);
              }}
            sx={{
              py: 0.8,
              px: 1.6,
              borderRadius: 8,
              bgcolor: isDark ? "rgb(26, 26, 26)" : "rgb(255, 255, 255)",
              color: isDark ? "#fff" : "#1c1c1e",
              textTransform: "none",
              boxShadow: 'none',
              fontWeight: 600,
              fontSize: "0.8rem",
              whiteSpace: "nowrap",
              transition: "all 150ms ease",
              "&:hover": {
                borderColor: isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)",
                bgcolor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
              boxShadow: 'none',
              },
            }}
          >
            Share
          </Button>

        </Box>
    </Box>
  );
};

export default React.memo(ChatTripPreviewCard);