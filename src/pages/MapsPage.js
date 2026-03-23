import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import Supercluster from "supercluster";
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db, auth } from "../firebase";
import {
  Box,
  Typography,
  IconButton,
  Stack,
  Avatar,
  Card,
  CardContent,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import MyLocationIcon from "@mui/icons-material/MyLocation";
import { useThemeToggle } from "../contexts/ThemeToggleContext";
import { getTheme } from "../theme";
import { useNavigate } from "react-router-dom";

const ORS_API_KEY = "5b3ce3597851110001cf62484a264622a33048f694b7220a215994ec";

const UsersMap = () => {
  const navigate = useNavigate();
  const { mode, accent } = useThemeToggle();
  const theme = getTheme(mode, accent);

  const mapRef = useRef(null);
  const markersLayerRef = useRef(null);
  const routeLayerRef = useRef(null);

  const [authUser, setAuthUser] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [followMe, setFollowMe] = useState(true);
  const [routeInfo, setRouteInfo] = useState(null);
  const [isRouting, setIsRouting] = useState(false);
  const [locationError, setLocationError] = useState(false);

  // ================= AUTH =================
  useEffect(() => {
    const unsub = auth.onAuthStateChanged((user) => {
      if (user) setAuthUser(user);
    });
    return () => unsub();
  }, []);

  // ================= MAP INIT =================
  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }

    const map = L.map("map", {
      center: [20.5937, 78.9629],
      zoom: 5,
      zoomControl: false,
    });

    const styleUrl =
      mode === "dark"
        ? `https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}.png`
        : `https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}.png`;

    L.tileLayer(styleUrl, { maxZoom: 20 }).addTo(map);

    markersLayerRef.current = L.layerGroup().addTo(map);
    routeLayerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;
  }, [mode]);

// ================= TRACK LOCATION =================
useEffect(() => {
  if (!authUser || !navigator.geolocation) return;

  let lastUpdate = 0;

  const watchId = navigator.geolocation.watchPosition(
    async (position) => {
      const now = Date.now();
      // Only update every 15 seconds to save quota and reduce triggers
      if (now - lastUpdate < 15000) return;
      lastUpdate = now;

      const { latitude, longitude } = position.coords;

      if (followMe && mapRef.current && !selectedUser) {
        mapRef.current.setView([latitude, longitude], 14);
      }

      // WRAP IN TRY/CATCH TO PREVENT ERR_BLOCKED_BY_CLIENT CRASHES
      try {
        const userRef = doc(db, "users", authUser.uid);
        await updateDoc(userRef, {
          location: {
            lat: latitude,
            lng: longitude,
            updatedAt: serverTimestamp(),
          },
          isOnline: true,
        });
      } catch (err) {
        // Log it locally but don't break the UI
        if (err.message.includes('blocked-by-client')) {
          console.warn("Firestore request blocked by an extension (AdBlocker).");
        } else {
          console.error("Firestore Update Failed:", err);
        }
      }
    },
    (err) => console.error("Geolocation Error:", err),
    { enableHighAccuracy: true }
  );

  return () => navigator.geolocation.clearWatch(watchId);
}, [authUser, followMe, selectedUser]);

  // ================= FIRESTORE USERS =================
  useEffect(() => {
    if (!authUser) return;

    const unsub = onSnapshot(collection(db, "users"), (snapshot) => {
      const list = [];

      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.location && data.isOnline) {
          list.push({ id: docSnap.id, ...data });
        }
      });

      setUsers(list);
      const me = list.find((u) => u.id === authUser.uid);
      if (me) setCurrentUser(me);
      renderMarkers(list);
    });

    return () => unsub();
  }, [authUser]);

  // ================= MARKERS =================
  const renderMarkers = (userList) => {
    if (!mapRef.current) return;

    markersLayerRef.current.clearLayers();

    const points = userList.map((user) => ({
      type: "Feature",
      properties: user,
      geometry: {
        type: "Point",
        coordinates: [user.location.lng, user.location.lat],
      },
    }));

    const cluster = new Supercluster({ radius: 60, maxZoom: 20 });
    cluster.load(points);

    const bounds = mapRef.current.getBounds();
    const zoom = mapRef.current.getZoom();

    const clusters = cluster.getClusters(
      [
        bounds.getWest(),
        bounds.getSouth(),
        bounds.getEast(),
        bounds.getNorth(),
      ],
      zoom
    );

    clusters.forEach((feature) => {
      const [lng, lat] = feature.geometry.coordinates;

      if (feature.properties.cluster) {
        const count = feature.properties.point_count;

        const clusterIcon = L.divIcon({
          html: `<div style="
              background:${theme.palette.primary.main};
              color:#fff;
              width:50px;height:50px;border-radius:50%;
              display:flex;align-items:center;justify-content:center;
              font-weight:bold;">${count}</div>`,
        });

        L.marker([lat, lng], { icon: clusterIcon })
          .on("click", () => {
            const expansionZoom =
              cluster.getClusterExpansionZoom(feature.id);
            mapRef.current.setView([lat, lng], expansionZoom);
          })
          .addTo(markersLayerRef.current);
      } else {
        const user = feature.properties;

        const icon = L.divIcon({
          html: `<div style="
              width:45px;height:45px;border-radius:50%;
              background-image:url('${user.photoURL || ""}');
              background-size:cover;
              border:3px solid ${
                user.id === currentUser?.id
                  ? "#00ff88"
                  : theme.palette.primary.main
              };
            "></div>`,
        });

        L.marker([lat, lng], { icon })
          .on("click", () => setSelectedUser(user))
          .addTo(markersLayerRef.current);
      }
    });
  };

  const calculateDistance = (user) => {
    if (!currentUser?.location || !user.location) return null;

    const toRad = (v) => (v * Math.PI) / 180;
    const R = 6371;

    const dLat = toRad(user.location.lat - currentUser.location.lat);
    const dLon = toRad(user.location.lng - currentUser.location.lng);

    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(currentUser.location.lat)) *
        Math.cos(toRad(user.location.lat)) *
        Math.sin(dLon / 2) ** 2;

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return (R * c).toFixed(2);
  };

  // ================= ROUTING (ROAD + STRAIGHT LINE) =================
  useEffect(() => {
    if (!selectedUser || !currentUser?.location || !mapRef.current) return;

    if (selectedUser.id === authUser?.uid) {
      routeLayerRef.current.clearLayers();
      setRouteInfo(null);
      return;
    }

    const fetchRoute = async () => {
      try {
        setIsRouting(true);
        routeLayerRef.current.clearLayers();
        setRouteInfo(null);

        const start = [
          currentUser.location.lat,
          currentUser.location.lng,
        ];
        const end = [
          selectedUser.location.lat,
          selectedUser.location.lng,
        ];


        // 2️⃣ Road Route
        const response = await fetch(
          "https://api.openrouteservice.org/v2/directions/driving-car",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: ORS_API_KEY,
            },
            body: JSON.stringify({
              coordinates: [
                [start[1], start[0]],
                [end[1], end[0]],
              ],
              instructions: false,
            }),
          }
        );

        const data = await response.json();
        if (!data.features?.length) return;

        const geometry = data.features[0].geometry;
        const coords = data.features[0].geometry.coordinates;
        const latLngs = coords.map(([lng, lat]) => [lat, lng]);

        const routeLine = L.polyline(latLngs, {
          color: theme.palette.primary.main,
          weight: 5,
          opacity: 0.8,
          lineJoin: 'round',
          dashArray: mode === 'dark' ? "1, 10" : null, // Optional: stylish dotted line for dark mode
        }).addTo(routeLayerRef.current);

        const summary = data.features[0].properties.summary;

        setRouteInfo({
          distance: (summary.distance / 1000).toFixed(2),
          duration: Math.ceil(summary.duration / 60),
        });

        mapRef.current.fitBounds(routeLine.getBounds(), {
          padding: [100, 100],
          maxZoom: 16,
          animate: true,
          duration: 1.5
        });

      } catch (err) {
        console.error("Routing error:", err);
      }
    };

    fetchRoute();
  }, [selectedUser, currentUser, theme]);

  // ================= UI =================
  return (
    <Box sx={{ height: "100vh", width: "100%", position: "relative" }}>
<Box
  sx={{
    position: "absolute",
    top: -1,
    left: 0,
    width: "100%",
    height: 120,
    pointerEvents: "none", // allows map interaction
    zIndex: 900,
    backdropFilter: "blur(18px)",
    WebkitBackdropFilter: "blur(18px)",
    maskImage:
      "linear-gradient(to bottom, black 40%, rgba(0,0,0,0.6) 70%, transparent 100%)",
    WebkitMaskImage:
      "linear-gradient(to bottom, black 40%, rgba(0,0,0,0.6) 70%, transparent 100%)",
    background:
      mode === "dark"
        ? "linear-gradient(to bottom, rgba(0,0,0,0.45), rgba(0,0,0,0.2), transparent)"
        : "linear-gradient(to bottom, rgba(255,255,255,0.6), rgba(255,255,255,0.3), transparent)",
  }}
/>

      <Box
        sx={{
          position: "absolute",
          zIndex: 1000,
          m: 2,
          mt: 6.5,
          pl: 1,
          pr: 2,
          py: 1,
          borderRadius: 8,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background:
            mode === "dark"
              ? "rgba(0, 0, 0, 0.22)"
              : "rgba(255,255,255,0.7)",
          backdropFilter: "blur(10px)",
        }}
      >
        <Stack direction="row" spacing={2} alignItems="center">
          <IconButton onClick={() => navigate(-1)} sx={{ color: theme.palette.text.primary, backgroundColor: mode === "dark" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)" }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography fontWeight="bold" color={theme.palette.text.primary}>Live Users Map</Typography>
        </Stack>
      </Box>

      <Box
        sx={{
          position: "absolute",
          bottom: 236,
          right: 2,
          zIndex: 1000,
          m: 2,
          p: 2,
          borderRadius: 8,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background:
            mode === "dark"
              ? "rgba(0, 0, 0, 0.22)"
              : "rgba(255,255,255,0.7)",
          backdropFilter: "blur(10px)",
        }}
      >
        <Stack direction="row" alignItems="center">
          <MyLocationIcon sx={{ color: theme.palette.text.primary }} />
        </Stack>
      </Box>

      <div id="map" style={{ height: "100%", width: "100%", filter: mode === 'dark' ? 'grayscale(0.2) invert(0) contrast(1.1)' : 'none', bgcolor: mode === 'dark' ? '#1a1a1a' : '#f0f0f0' }} />

      {/* USER CARDS */}
<Box
  sx={{
    position: "absolute",
    bottom: 0,
    width: "92vw",
    p: 2,
    overflowX: "auto",
    display: "flex",
    gap: 2,
  }}
>
  {users.map((user) => {
    const distance = calculateDistance(user);
    const isCurrent = user.id === currentUser?.id;

    const lastActive =
      user.location?.updatedAt?.toDate
        ? user.location.updatedAt.toDate().toLocaleTimeString()
        : "Recently";

    return (
      <Card
        key={user.id}
        onClick={() => setSelectedUser(user)}
        sx={{
          minWidth: 320,
          borderRadius: 6,
          cursor: "pointer",
          transition: "all .2s ease",
          backdropFilter: "blur(10px)",
          border:
            selectedUser?.id === user.id
              ? `2px solid ${theme.palette.primary.main}`
              : "1px solid rgba(255,255,255,0.1)",
          background:
            mode === "dark"
              ? "rgba(20, 20, 20, 0.37)"
              : "rgba(255,255,255,0.95)",
          transform:
            selectedUser?.id === user.id
              ? "translateY(-4px)"
              : "translateY(0px)",
        }}
      >
        <CardContent>
          {/* HEADER */}
          <Stack direction="row" spacing={2} alignItems="center">
            <Box position="relative">
              <Avatar
                src={user.photoURL}
                sx={{ width: 60, height: 60 }}
              />
              <Box
                sx={{
                  position: "absolute",
                  bottom: 2,
                  right: 2,
                  width: 14,
                  height: 14,
                  borderRadius: "50%",
                  backgroundColor: user.isOnline
                    ? "#4caf50"
                    : "#999",
                  border: "2px solid white",
                }}
              />
            </Box>

            <Box flex={1}>
              <Typography fontWeight="bold" fontSize={16}>
                {user.fullName || user.name}
              </Typography>

              <Typography variant="caption" color="text.secondary">
                @{user.username}
              </Typography>

              <Typography
                variant="caption"
                sx={{
                  display: "block",
                  color: isCurrent
                    ? "#00ff88"
                    : user.isOnline
                    ? "#4caf50"
                    : "#999",
                }}
              >
                {isCurrent
                  ? "You"
                  : user.isOnline
                  ? "Online"
                  : "Offline"}
              </Typography>
            </Box>
          </Stack>

          {/* BIO */}
          {user.bio && (
            <Typography
              variant="body2"
              sx={{ mt: 1, opacity: 0.85 }}
            >
              {user.bio.length > 90
                ? user.bio.slice(0, 90) + "..."
                : user.bio}
            </Typography>
          )}

          {/* DETAILS */}
          <Box sx={{ mt: 1.5 }}>
            <Typography variant="caption" display="block">
              📍 {distance ? `${distance} km away` : "Distance unavailable"}
            </Typography>

            <Typography variant="caption" display="block">
              🕒 Last active: {lastActive}
            </Typography>

            <Typography variant="caption" display="block">
              🌎 Lat: {user.location.lat.toFixed(3)} | Lng:{" "}
              {user.location.lng.toFixed(3)}
            </Typography>

            {user.createdAt && (
              <Typography variant="caption" display="block">
                📅 Joined:{" "}
                {user.createdAt?.toDate
                  ? user.createdAt.toDate().toLocaleDateString()
                  : new Date(user.createdAt).toLocaleDateString()}
              </Typography>
            )}

            {user.tripCount !== undefined && (
              <Typography variant="caption" display="block">
                ✈ Trips: {user.tripCount}
              </Typography>
            )}
          </Box>

          {/* ACTION BUTTONS */}
          {/* <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
            <Box
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/profile/${user.id}`);
              }}
              sx={{
                flex: 1,
                textAlign: "center",
                py: 0.6,
                borderRadius: 2,
                fontSize: 12,
                background: theme.palette.primary.main,
                color: "#fff",
                cursor: "pointer",
              }}
            >
              View Profile
            </Box>

            {!isCurrent && (
              <Box
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/chat/${user.id}`);
                }}
                sx={{
                  flex: 1,
                  textAlign: "center",
                  py: 0.6,
                  borderRadius: 2,
                  fontSize: 12,
                  background:
                    mode === "dark"
                      ? "rgba(255,255,255,0.1)"
                      : "rgba(0,0,0,0.05)",
                  cursor: "pointer",
                }}
              >
                Message
              </Box>
            )}
          </Stack> */}
        </CardContent>
      </Card>
    );
  })}
</Box>

{isRouting && (
        <Box sx={{
          position: 'absolute',
          top: 120,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1200,
          bgcolor: 'rgba(0,0,0,0.7)',
          color: '#fff',
          px: 2, py: 1,
          borderRadius: 2,
          fontSize: '12px',
          backdropFilter: 'blur(5px)'
        }}>
          Calculating road path...
        </Box>
      )}

{locationError && (
  <Box sx={{
    position: "absolute",
    top: 130,
    left: "50%",
    transform: "translateX(-50%)",
    zIndex: 2000,
    bgcolor: "error.main",
    color: "white",
    px: 3, py: 1,
    borderRadius: 2,
    boxShadow: 3,
    textAlign: 'center'
  }}>
    <Typography variant="body2" fontWeight="bold">
      Location Access Denied
    </Typography>
    <Typography variant="caption">
      Please enable location in your browser settings to see yourself on the map.
    </Typography>
  </Box>
)}

      {routeInfo && selectedUser && (
        <Box
          sx={{
            position: "absolute",
            bottom: 300,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 1100,
            px: 3,
            py: 1.5,
            borderRadius: 4,
            backdropFilter: "blur(10px)",
            background:
              mode === "dark"
                ? "rgba(0,0,0,0.6)"
                : "rgba(255,255,255,0.9)",
          }}
        >
          <Typography fontWeight="bold">
            Route to {selectedUser.fullName || selectedUser.name}
          </Typography>
          <Typography variant="caption">
            🚗 {routeInfo.distance} km • ⏱ {routeInfo.duration} mins
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default UsersMap;