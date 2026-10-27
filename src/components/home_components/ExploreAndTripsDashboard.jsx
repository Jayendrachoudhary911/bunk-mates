import React, { useState, useEffect, useMemo } from "react";
import {
  Box,
  Typography,
  Chip,
  Stack,
  useTheme,
  alpha,
  CircularProgress,
} from "@mui/material";
import { motion, AnimatePresence } from "framer-motion";
import RotatingSearchButton from "./RotatingSearchButton";

// Import your existing components
import YourTrips from "./YourTrips";
import FeaturedPlaces from "./FeaturedPlaces";

export default function ExploreAndTripsDashboard({
  initialTrips = [],
  initialPlaces = [],
  userData,
  onPlanTrip,
  mode,
  navigate,
  fetchTripsService,
  fetchPlacesService,
}) {
  const theme = useTheme();
  const isDark = mode === "dark" || theme.palette.mode === "dark";

  // Data states
  const [myTrips, setMyTrips] = useState(initialTrips);
  const [allFlattenedPlaces, setAllFlattenedPlaces] = useState(initialPlaces);
  const [tripGroupsMap] = useState({});
  const [tripMembersMap] = useState({});
  
  // UI & Loading states
  const [loading, setLoading] = useState(true);
  const [sliderIndex, setSliderIndex] = useState(0);
  const [activeFilter, setActiveFilter] = useState("all"); // 'all' | 'your-trips' | or place type category

  // Fetch data on mount if services are provided or props are empty
  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        setLoading(true);
        const tripsData = fetchTripsService ? await fetchTripsService() : initialTrips;
        const placesData = fetchPlacesService ? await fetchPlacesService() : initialPlaces;

        if (isMounted) {
          setMyTrips(tripsData || []);
          setAllFlattenedPlaces(placesData || []);
        }
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [fetchTripsService, fetchPlacesService, initialTrips, initialPlaces]);

  // Extract unique place types dynamically from data (e.g., Lake, Palace, Monument, Fort, etc.)
  const placeCategories = useMemo(() => {
    const typesSet = new Set();
    allFlattenedPlaces.forEach((place) => {
      if (place.type) {
        typesSet.add(place.type.trim());
      }
    });
    return Array.from(typesSet);
  }, [allFlattenedPlaces]);

  // Filtered places based on selected category filter
  const filteredPlaces = useMemo(() => {
    let result = allFlattenedPlaces;

    // Filter by category type if selected (and not 'all' or 'your-trips')
    if (activeFilter !== "all" && activeFilter !== "your-trips") {
      result = result.filter(
        (place) => place.type?.toLowerCase() === activeFilter.toLowerCase()
      );
    }

    return result;
  }, [allFlattenedPlaces, activeFilter]);

  if (loading) {
    return (
      <Box
        sx={{
          width: "100%",
          minHeight: "50vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 2,
        }}
      >
        <CircularProgress size={40} sx={{ color: "#00d2ff" }} />
        <Typography variant="body2" color="text.secondary">
          Loading your dashboard...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ width: "100%", pb: 0 }}>
      {/* ─── SEARCH BUTTON (Redirects to /search page) ─── */}
<Box sx={{ px: { xs: 2, md: 0 }, mb: 2.5 }}>
      <RotatingSearchButton navigate={navigate} isDark={isDark} />
    </Box>

      {/* ─── FILTER CHIPS (All, Your Trips, & Category Filters from data.json) ─── */}
      <Box
        sx={{
          px: { xs: 2, md: 0 },
          mb: 3,
          display: "flex",
          gap: 1.5,
          overflowX: "auto",
          scrollbarWidth: "none",
          "&::-webkit-scrollbar": { display: "none" },
        }}
      >
        {[
          { key: "all", label: "All Places" },
          { key: "your-trips", label: "Your Trips" },
          ...placeCategories.map((cat) => ({ key: cat, label: cat })),
        ].map((chip) => {
          const isActive = activeFilter === chip.key;
          return (
            <Chip
              key={chip.key}
              label={chip.label}
              onClick={() => setActiveFilter(chip.key)}
              sx={{
                fontWeight: 600,
                fontSize: "0.875rem",
                borderRadius: 8,
                py: 2.2,
                cursor: "pointer",
                transition: "all 0.25s ease",
                backgroundColor: isActive
                  ? isDark
                    ? "#ffffff"
                    : "#0c0c0c"
                  : isDark
                  ? alpha("#ffffff", 0.06)
                  : alpha("#000000", 0.04),
                color: isActive
                  ? isDark
                    ? "#0c0c0c"
                    : "#ffffff"
                  : isDark
                  ? "rgba(255,255,255,0.75)"
                  : "rgba(0,0,0,0.75)",
                boxShadow: isDark 
                    ? 'inset 0 1px 1px rgba(255, 255, 255, 0.11), 0 1px 0px rgba(0,0,0,0.1)'
                    : 'inset 0 1px 3px rgba(0, 0, 0, 0.08), 0 1px 0px rgba(0,0,0,0.1)',
                border: "0px solid",
                "&:hover": {
                  backgroundColor: isActive
                    ? isDark
                      ? "#e0e0e0"
                      : "#222222"
                    : isDark
                    ? alpha("#ffffff", 0.12)
                    : alpha("#000000", 0.08),
                },
              }}
            />
          );
        })}
      </Box>

      {/* ─── CONTENT SECTIONS BASED ON SELECTED FILTER ─── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeFilter}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.25 }}
        >
          {activeFilter === "all" && (
            <Stack spacing={4}>
              <FeaturedPlaces
                allFlattenedPlaces={filteredPlaces}
                userData={userData}
                onPlanTrip={onPlanTrip}
                mode={mode}
                navigate={navigate}
              />
            </Stack>
          )}

          {activeFilter === "your-trips" && (
            <Box sx={{ mt: 1 }}>
              <YourTrips
                myTrips={myTrips}
                tripGroupsMap={tripGroupsMap}
                tripMembersMap={tripMembersMap}
                sliderIndex={sliderIndex}
                setSliderIndex={setSliderIndex}
                mode={mode}
                theme={theme}
                navigate={navigate}
              />
            </Box>
          )}

          {activeFilter !== "all" && activeFilter !== "your-trips" && (
            <Box sx={{ mt: 1 }}>
              <FeaturedPlaces
                allFlattenedPlaces={filteredPlaces}
                userData={userData}
                onPlanTrip={onPlanTrip}
                mode={mode}
                navigate={navigate}
              />
            </Box>
          )}
        </motion.div>
      </AnimatePresence>
    </Box>
  );
}