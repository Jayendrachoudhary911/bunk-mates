import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Card,
  CircularProgress,
  useTheme,
  SwipeableDrawer,
} from "@mui/material";
import { ArrowForwardIos as ArrowForwardIcon } from "../../icons";
import { motion } from "framer-motion";
import { doc, getDoc } from "firebase/firestore";

// Required imports
import { db } from "../../firebase";
import placesData from "../../data/data.json";
import PlaceDetailsDialog from "../../elements/PlaceDetailsDialog";
import { glass, drawerPaperSx, drawerBackdropSx, drawerHandleSx } from "../../theme/designSystem";

export default function SavedTripsView({ 
  userId, 
  userData, 
  onPlanTrip, 
  mode, 
  layout = "grid" // Accepts "grid" (2x in a row) or "carousel" (overflowX)
}) {
  const theme = useTheme();
  const isDark = mode === "dark" || theme.palette.mode === "dark";
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [tripIdentifiers, setTripIdentifiers] = useState([]);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // 1. Fetch user's saved trips references from Firestore
  useEffect(() => {
    let isMounted = true;

    async function fetchUserTripsData() {
      if (!userId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const userDocRef = doc(db, "users", userId);
        const userSnap = await getDoc(userDocRef);

        if (userSnap.exists() && isMounted) {
          const data = userSnap.data();
          setTripIdentifiers(data.savedTrips || data.trips || []);
        }
      } catch (error) {
        console.error("Failed to load user trip references:", error);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchUserTripsData();

    return () => {
      isMounted = false;
    };
  }, [userId]);

  // 2. Decode codes like "Mysore_Palace_KA_Mysuru" against data.json
  const masterPlacesDictionary = useMemo(() => {
    const map = new Map();
    if (!placesData || !placesData.states) return map;

    placesData.states.forEach((state) => {
      const stateCode = state.code;
      const stateName = state.name;

      state.districts.forEach((district) => {
        const districtName = district.name;

        district.places.forEach((place) => {
          const cleanName = place.name.replace(/\s+/g, "_");
          const cleanDistrict = district.name.replace(/\s+/g, "_");
          const encodedKey = `${cleanName}_${stateCode}_${cleanDistrict}`;

          map.set(encodedKey.toLowerCase(), {
            ...place,
            id: encodedKey,
            stateCode,
            stateName,
            districtName,
            location: `${districtName}, ${stateName}`,
          });
        });
      });
    });

    return map;
  }, []);

  const decodedDetailedTrips = useMemo(() => {
    const matchedTrips = [];

    tripIdentifiers.forEach((identifier) => {
      if (typeof identifier === "string") {
        const queryKey = identifier.toLowerCase();
        if (masterPlacesDictionary.has(queryKey)) {
          matchedTrips.push(masterPlacesDictionary.get(queryKey));
        } else {
          for (const [key, placeObj] of masterPlacesDictionary.entries()) {
            if (
              key.includes(queryKey) ||
              queryKey.includes(
                placeObj.name.toLowerCase().replace(/\s+/g, "_")
              )
            ) {
              matchedTrips.push(placeObj);
              break;
            }
          }
        }
      }
    });

    return matchedTrips;
  }, [tripIdentifiers, masterPlacesDictionary]);

  const handleCardClick = (trip) => {
    setSelectedPlace(trip);
    setDrawerOpen(true);
  };

  if (loading) {
    return (
      <Box sx={{ py: 6, textAlign: "center", width: "100%" }}>
        <CircularProgress size={28} sx={{ color: "#00d2ff" }} />
      </Box>
    );
  }

  if (decodedDetailedTrips.length === 0) {
    return null;
  }

  const cardBgColor = isDark ? "#131313" : "#ffffff";

  // Reusable single card renderer
  const renderCard = (trip) => (
    <motion.div
      key={trip.id}
      layoutId={`trip-detail-${trip.id}`}
      onClick={() => handleCardClick(trip)}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 260, damping: 28 }}
      style={{
        width: layout === "carousel" ? 280 : "100%",
        flexShrink: 0,
        cursor: "pointer",
      }}
    >
      <Card
        elevation={0}
        component="div"
        sx={{
          p: 0,
          borderRadius: 6,
          cursor: "pointer",
          display: "flex",
          flexDirection: "column",
          backgroundColor: cardBgColor,
          color: "inherit",
          textDecoration: "none",
          WebkitTapHighlightColor: "transparent",
          boxShadow: 'none',
          border: `0px solid ${
            isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"
          }`,
          overflow: "hidden",
          height: "100%",
          transition: "transform 0.2s ease, box-shadow 0.2s ease",
          "&:hover": {
            transform: "translateY(-1px)",
            boxShadow: 'none',
          },
          ...glass(isDark ? "dark" : "light", {
            backgroundColor: isDark
              ? "rgba(19,19,19,0.9)"
              : "rgba(255,255,255,0.9)",
          }),
        }}
      >
        {/* IMAGE BACKGROUND WITH MASKED GRADIENT BLEND */}
        <Box
          sx={{
            width: "100%",
            height: 160,
            position: "relative",
            flexShrink: 0,
            backgroundImage: `url(${trip.images?.[0] || ""})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            maskImage: `linear-gradient(to bottom, black 85%, transparent 100%)`,
            WebkitMaskImage: `linear-gradient(to bottom, black 85%, transparent 100%)`,
          }}
        >
          <Box
            sx={{
              position: "absolute",
              top: 10,
              left: 10,
              backgroundColor: "rgba(0,0,0,0.65)",
              backdropFilter: "blur(12px)",
              color: "#fff",
              px: 1,
              border: 0,
              py: 0.2,
              borderRadius: 1.5,
              fontSize: "0.65rem",
              fontWeight: 700,
            }}
          >
            {trip.stateCode} • {trip.districtName}
          </Box>
        </Box>

        {/* METADATA & CONTENT */}
        <Box
          sx={{
            p: 2,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            flexGrow: 1,
          }}
        >
          <Box>
            <Typography variant="subtitle1" fontWeight={800} fontSize={16} noWrap>
              {trip.name}
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: "block", mb: 1, fontWeight: 600 }}
              noWrap
            >
              📍 {trip.location}
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
                fontSize: "0.82rem",
                lineHeight: 1.5,
              }}
            >
              {trip.description}
            </Typography>
          </Box>
        </Box>
      </Card>
    </motion.div>
  );

  return (
    <Box sx={{ width: "100%", my: 3 }}>

      {/* RENDER LAYOUT BASED ON PROPS */}
      {layout === "carousel" ? (
        <>
          <Box 
            onClick={() => navigate('/saved-trips')}
            sx={{ 
              display: "flex", 
              justifyContent: "space-between", 
              alignItems: "center", 
              mb: 2, 
              px: { xs: 1, md: 0 },
              cursor: "pointer",
              userSelect: 'none',
            }}
          >
            <Typography
              variant="h6"
              sx={{ fontWeight: 700 }}
            >
              Saved Places
            </Typography>
            <ArrowForwardIcon sx={{ fontSize: 16, opacity: 0.7 }} />
          </Box>

          <Box
            sx={{
              display: "flex",
              gap: 2,
              px: { xs: 1, md: 0 },
              overflowX: "auto",
              scrollbarWidth: "none",
              "&::-webkit-scrollbar": { display: "none" },
              pb: 1,
            }}
          >
            {decodedDetailedTrips.map(renderCard)}
          </Box>
        </>
      ) : (
        <>
          <Typography
            variant="h6"
            sx={{ fontWeight: 700, mb: 2, px: { xs: 1, md: 0 } }}
          >
            Saved Places
          </Typography>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
              gap: 2,
              px: { xs: 1, md: 0 },
            }}
          >
            {decodedDetailedTrips.map(renderCard)}
          </Box>
        </>
      )}

      {/* ───── SWIPEABLE FULL-SCREEN SMOOTH DRAWER ───── */}
      <SwipeableDrawer
        anchor="bottom"
        open={drawerOpen}
        onOpen={() => setDrawerOpen(true)}
        onClose={() => setDrawerOpen(false)}
        disableBackdropTransition={true}
        disableDiscovery={true}
        swipeAreaWidth={56}
        ModalProps={{ keepMounted: true }}
        PaperProps={{
          sx: drawerPaperSx(mode, {
            maxHeight: "80vh",
            willChange: "transform",
          }),
        }}
        sx={{
          zIndex: 1600,
          "& .MuiBackdrop-root": drawerBackdropSx,
        }}
      >
        <Box sx={{ display: { xs: "flex", md: "none" }, justifyContent: "center", pt: 1.5, pb: 1 }}>
          <Box sx={{ ...drawerHandleSx() }} />
        </Box>

        <Box sx={{ p: 0, overflowY: "auto", flexGrow: 1 }}>
          {selectedPlace && (
            <PlaceDetailsDialog
              place={selectedPlace}
              open={drawerOpen}
              onClose={() => setDrawerOpen(false)}
              saved={true}
              userData={userData}
              onPlanTrip={onPlanTrip}
              mode={mode}
            />
          )}
        </Box>
      </SwipeableDrawer>
    </Box>
  );
}