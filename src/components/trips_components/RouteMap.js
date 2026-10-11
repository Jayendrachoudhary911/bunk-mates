import React, { useEffect, useState, useMemo, useRef } from "react";
import {
  Box,
  Typography,
  Chip,
  IconButton,
  Button,
  CircularProgress,
  Stack,
  Tooltip,
  Paper,
  alpha,
} from "@mui/material";
import {
  Directions as DirectionsIcon,
  MyLocation as MyLocationIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  Fullscreen as FullscreenIcon,
  FullscreenExit as FullscreenExitIcon,
  Route as RouteIcon,
  AccessTime as AccessTimeIcon,
  Straighten as StraightenIcon,
} from "@mui/icons-material";
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Built-in coordinate lookup for fast loading & offline reliability
const KNOWN_COORDINATES = {
  delhi: [28.6139, 77.2090],
  "new delhi": [28.6139, 77.2090],
  mumbai: [19.0760, 72.8777],
  bombay: [19.0760, 72.8777],
  bangalore: [12.9716, 77.5946],
  bengaluru: [12.9716, 77.5946],
  goa: [15.2993, 74.1240],
  panaji: [15.4909, 73.8278],
  jaipur: [26.9124, 75.7873],
  udaipur: [24.5854, 73.7125],
  manali: [32.2432, 77.1892],
  shimla: [31.1048, 77.1734],
  pune: [18.5204, 73.8567],
  hyderabad: [17.3850, 78.4867],
  chennai: [13.0827, 80.2707],
  kolkata: [22.5726, 88.3639],
  agra: [27.1767, 78.0081],
  rishikesh: [30.0869, 78.2676],
  dehradun: [30.3165, 78.0322],
  ladakh: [34.1526, 77.5771],
  leh: [34.1526, 77.5771],
  kerala: [10.8505, 76.2711],
  kochi: [9.9312, 76.2673],
  paris: [48.8566, 2.3522],
  london: [51.5074, -0.1278],
  "new york": [40.7128, -74.0060],
  tokyo: [35.6762, 139.6503],
  dubai: [25.2048, 55.2708],
  singapore: [1.3521, 103.8198],
  bangkok: [13.7563, 100.5018],
};

const geocodeCache = new Map();

async function geocodeLocation(name) {
  if (!name || typeof name !== "string") return null;
  const cleanName = name.trim().toLowerCase();

  // 1. Direct dictionary match
  if (KNOWN_COORDINATES[cleanName]) {
    return KNOWN_COORDINATES[cleanName];
  }

  // Check sub-string match
  for (const [key, coords] of Object.entries(KNOWN_COORDINATES)) {
    if (cleanName.includes(key) || key.includes(cleanName)) {
      return coords;
    }
  }

  // 2. Cache match
  if (geocodeCache.has(cleanName)) {
    return geocodeCache.get(cleanName);
  }

  // 3. OpenStreetMap Geocoding via Stadia Maps API Key (fast, high-rate limits)
  const mapApiKey = process.env.REACT_APP_MAP_API_KEY || "72a80d89-2fa4-422b-ad14-e0064315ff45";
  if (mapApiKey) {
    try {
      const res = await fetch(
        `https://api.stadiamaps.com/geocoding/v1/search?api_key=${mapApiKey}&size=1&text=${encodeURIComponent(cleanName)}`
      );
      if (res.ok) {
        const data = await res.json();
        if (data?.features?.[0]?.geometry?.coordinates) {
          const [lon, lat] = data.features[0].geometry.coordinates;
          const coords = [lat, lon];
          geocodeCache.set(cleanName, coords);
          return coords;
        }
      }
    } catch (err) {
      console.warn("Stadia OSM Geocoding fetch error:", err);
    }
  }

  // 4. Fallback to Nominatim OpenStreetMap API geocoding
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(cleanName)}`
    );
    const data = await res.json();
    if (data && data.length > 0) {
      const coords = [parseFloat(data[0].lat), parseFloat(data[0].lon)];
      geocodeCache.set(cleanName, coords);
      return coords;
    }
  } catch (err) {
    console.warn("Nominatim Geocoding fetch error:", err);
  }

  return null;
}

// Controller to auto-fit map bounds
function MapBoundsController({ bounds }) {
  const map = useMap();
  useEffect(() => {
    if (bounds && bounds.length >= 2) {
      try {
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 13, animate: true });
      } catch (e) {
        console.warn("Bounds error:", e);
      }
    }
  }, [bounds, map]);
  return null;
}

// Custom modern map markers styled with mapcn aesthetic
const createMapMarkerIcon = (label, color = "#38BDF8", type = "start") => {
  return L.divIcon({
    className: "custom-mapcn-marker",
    html: `
      <div style="
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: center;
        transform: translate(-50%, -100%);
      ">
        <div style="
          background: rgba(12, 12, 12, 0.85);
          backdrop-filter: blur(8px);
          color: #fff;
          font-family: Outfit, sans-serif;
          font-size: 11px;
          font-weight: 700;
          padding: 3px 8px;
          border-radius: 99px;
          border: 1.5px solid ${color};
          white-space: nowrap;
          box-shadow: 0 4px 12px rgba(0,0,0,0.4);
          margin-bottom: 4px;
        ">
          ${label}
        </div>
        <div style="
          width: 16px;
          height: 16px;
          background: ${color};
          border: 3px solid #ffffff;
          border-radius: 50%;
          box-shadow: 0 0 10px ${color}, 0 4px 8px rgba(0,0,0,0.5);
        "></div>
      </div>
    `,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });
};

export default function RouteMap({
  from,
  to,
  waypoints = [],
  mode = "dark",
  onOpenDirections,
}) {
  const [fromCoords, setFromCoords] = useState(null);
  const [toCoords, setToCoords] = useState(null);
  const [routePolyline, setRoutePolyline] = useState([]);
  const [routeStats, setRouteStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef(null);

  const isDark = mode === "dark";

  // OpenStreetMap tile layer powered by OpenStreetMap & Stadia Maps API Key
  const mapApiKey = process.env.REACT_APP_MAP_API_KEY || "72a80d89-2fa4-422b-ad14-e0064315ff45";

  const tileLayerUrl = mapApiKey
    ? (isDark
        ? `https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png?api_key=${mapApiKey}`
        : `https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png?api_key=${mapApiKey}`)
    : (isDark
        ? "https://{s}.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}{r}.png"
        : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png");

  useEffect(() => {
    let isCancelled = false;

    async function resolveRoute() {
      if (!from || !to) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const [c1, c2] = await Promise.all([
          geocodeLocation(from),
          geocodeLocation(to),
        ]);

        if (isCancelled) return;

        if (c1) setFromCoords(c1);
        if (c2) setToCoords(c2);

        if (c1 && c2) {
          // Fetch real driving route from OSRM
          try {
            const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${c1[1]},${c1[0]};${c2[1]},${c2[0]}?overview=full&geometries=geojson`;
            const osrmRes = await fetch(osrmUrl);
            const osrmData = await osrmRes.json();

            if (osrmData && osrmData.routes && osrmData.routes.length > 0) {
              const route = osrmData.routes[0];
              // Convert GeoJSON [lon, lat] to Leaflet [lat, lon]
              const points = route.geometry.coordinates.map(([lon, lat]) => [lat, lon]);
              setRoutePolyline(points);

              const distKm = Math.round(route.distance / 1000);
              const durationHours = Math.floor(route.duration / 3600);
              const durationMins = Math.round((route.duration % 3600) / 60);

              setRouteStats({
                distance: `${distKm} km`,
                duration: durationHours > 0 ? `${durationHours}h ${durationMins}m` : `${durationMins}m`,
              });
            } else {
              // Fallback to straight line / curved arc
              setRoutePolyline([c1, c2]);
              const approxDist = Math.round(
                L.latLng(c1[0], c1[1]).distanceTo(L.latLng(c2[0], c2[1])) / 1000
              );
              setRouteStats({
                distance: `~${approxDist} km (direct)`,
                duration: "Direct Path",
              });
            }
          } catch (routeErr) {
            console.warn("OSRM routing fallback:", routeErr);
            setRoutePolyline([c1, c2]);
          }
        }
      } catch (err) {
        console.error("Route resolution error:", err);
      } finally {
        if (!isCancelled) setLoading(false);
      }
    }

    resolveRoute();
    return () => {
      isCancelled = true;
    };
  }, [from, to]);

  const mapBounds = useMemo(() => {
    if (fromCoords && toCoords) {
      return [fromCoords, toCoords];
    }
    if (fromCoords) return [fromCoords];
    if (toCoords) return [toCoords];
    return [
      [20.5937, 78.9629], // Center of India default
      [28.6139, 77.2090],
    ];
  }, [fromCoords, toCoords]);

  const defaultCenter = useMemo(() => {
    if (fromCoords && toCoords) {
      return [(fromCoords[0] + toCoords[0]) / 2, (fromCoords[1] + toCoords[1]) / 2];
    }
    return fromCoords || toCoords || [22.5937, 78.9629];
  }, [fromCoords, toCoords]);

  const mapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(
    from || ""
  )}&destination=${encodeURIComponent(to || "")}`;

  return (
    <Box
      ref={containerRef}
      sx={{
        position: "relative",
        borderRadius: 6,
        overflow: "hidden",
        border: `1px solid ${isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.06)"}`,
        boxShadow: 'none',
        height: isFullscreen ? "100%" : 320,
        width: "100%",
        transition: "height 0.3s ease",
        background: isDark ? "#0d0d0d" : "#f8f9fa",
      }}
    >
      {/* ─── OVERLAY HUD BAR (mapcn inspired) ─── */}
      <Box
        sx={{
          position: "absolute",
          top: 12,
          left: 12,
          right: 12,
          zIndex: 1000,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 1,
          pointerEvents: "none",
        }}
      >
        {/* Route Stats Badge */}
        <Paper
          elevation={0}
          sx={{
            pointerEvents: "auto",
            px: 1.8,
            py: 1,
            borderRadius: 99,
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            backdropFilter: "blur(3px)",
            WebkitBackdropFilter: "blur(3px)",
            backgroundColor: isDark ? "rgba(18, 18, 18, 0.4)" : "rgba(255, 255, 255, 0.45)",
            border: `0px solid ${isDark ? "rgba(255, 255, 255, 0.12)" : "rgba(0, 0, 0, 0.08)"}`,
            boxShadow: isDark ? 'inset 0 1px 1px rgba(255, 255, 255, 0.11), 0 1px 4px rgba(0,0,0,0.1)' : 'inset 0 1px 2px rgba(0, 0, 0, 0.11), 0 1px 4px rgba(0, 0, 0, 0.06)',
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
            <RouteIcon sx={{ fontSize: 18, color: "#38BDF8" }} />
            <Typography variant="caption" fontWeight={800} sx={{ color: isDark ? "#fff" : "#111" }}>
              {from} → {to}
            </Typography>
          </Box>

          {routeStats && (
            <>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <StraightenIcon sx={{ fontSize: 14, opacity: 0.6 }} />
                <Typography variant="caption" fontWeight={700} sx={{ opacity: 0.9 }}>
                  {routeStats.distance}
                </Typography>
              </Box>

              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <AccessTimeIcon sx={{ fontSize: 14, opacity: 0.6 }} />
                <Typography variant="caption" fontWeight={700} sx={{ opacity: 0.9 }}>
                  {routeStats.duration}
                </Typography>
              </Box>
            </>
          )}
        </Paper>

        {/* Map Actions */}
        <Stack direction="row" spacing={1} sx={{ pointerEvents: "auto" }}>
          <Tooltip title="Open in Google Maps">
            <IconButton
              component="a"
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              size="small"
              sx={{
            backdropFilter: "blur(3px)",
            WebkitBackdropFilter: "blur(3px)",
            backgroundColor: isDark ? "rgba(18, 18, 18, 0.4)" : "rgba(255, 255, 255, 0.45)",
            border: `0px solid ${isDark ? "rgba(255, 255, 255, 0.12)" : "rgba(0, 0, 0, 0.08)"}`,
            boxShadow: isDark ? 'inset 0 1px 1px rgba(255, 255, 255, 0.11), 0 1px 4px rgba(0,0,0,0.1)' : 'inset 0 1px 2px rgba(0, 0, 0, 0.11), 0 1px 4px rgba(0, 0, 0, 0.06)',
                color: isDark ? "#fff" : "#111",
                "&:hover": { bgcolor: isDark ? "rgba(255, 255, 255, 0.2)" : "rgba(0, 0, 0, 0.1)" },
              }}
            >
              <DirectionsIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title={isFullscreen ? "Exit Fullscreen" : "Expand Map"}>
            <IconButton
              size="small"
              onClick={() => setIsFullscreen((prev) => !prev)}
              sx={{
            backdropFilter: "blur(3px)",
            WebkitBackdropFilter: "blur(3px)",
            backgroundColor: isDark ? "rgba(18, 18, 18, 0.4)" : "rgba(255, 255, 255, 0.45)",
            border: `0px solid ${isDark ? "rgba(255, 255, 255, 0.12)" : "rgba(0, 0, 0, 0.08)"}`,
            boxShadow: isDark ? 'inset 0 1px 1px rgba(255, 255, 255, 0.11), 0 1px 4px rgba(0,0,0,0.1)' : 'inset 0 1px 2px rgba(0, 0, 0, 0.11), 0 1px 4px rgba(0, 0, 0, 0.06)',
                color: isDark ? "#fff" : "#111",
                "&:hover": { bgcolor: isDark ? "rgba(255, 255, 255, 0.2)" : "rgba(0, 0, 0, 0.1)" },
              }}
            >
              {isFullscreen ? <FullscreenExitIcon fontSize="small" /> : <FullscreenIcon fontSize="small" />}
            </IconButton>
          </Tooltip>
        </Stack>
      </Box>

      {/* ─── LOADING STATE ─── */}
      {loading && (
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            zIndex: 999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: isDark ? "rgba(10, 10, 10, 0.7)" : "rgba(255, 255, 255, 0.7)",
            backdropFilter: "blur(6px)",
          }}
        >
          <Stack alignItems="center" spacing={1.5}>
            <CircularProgress size={30} thickness={4} sx={{ color: "#38BDF8" }} />
            <Typography variant="caption" fontWeight={700} sx={{ opacity: 0.8 }}>
              Calculating route from {from} to {to}...
            </Typography>
          </Stack>
        </Box>
      )}

      {/* ─── LEAFLET MAP CONTAINER ─── */}
      <MapContainer
        center={defaultCenter}
        zoom={6}
        scrollWheelZoom={false}
        zoomControl={false}
        attributionControl={false}
        style={{ height: "100%", width: "100%", zIndex: 1 }}
      >
        <TileLayer
          url={tileLayerUrl}
          maxZoom={20}
          attribution='&copy; <a href="https://stadiamaps.com/">Stadia Maps</a> &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />
        <MapBoundsController bounds={mapBounds} />

        {/* Glow halo under route */}
        {routePolyline.length > 0 && (
          <Polyline
            positions={routePolyline}
            pathOptions={{
              color: "#38BDF8",
              weight: 8,
              opacity: 0.25,
              lineCap: "round",
              lineJoin: "round",
            }}
          />
        )}

        {/* Primary Route Path (mapcn vector route look) */}
        {routePolyline.length > 0 && (
          <Polyline
            positions={routePolyline}
            pathOptions={{
              color: "#38BDF8",
              weight: 4,
              opacity: 0.95,
              lineCap: "round",
              lineJoin: "round",
            }}
          />
        )}

        {/* Origin Marker */}
        {fromCoords && (
          <Marker position={fromCoords} icon={createMapMarkerIcon(`Start: ${from}`, "#4ADE80", "start")}>
            <Popup>
              <Box sx={{ p: 0.5, textAlign: "center" }}>
                <Typography variant="subtitle2" fontWeight={800}>
                  Trip Origin
                </Typography>
                <Typography variant="caption">{from}</Typography>
              </Box>
            </Popup>
          </Marker>
        )}

        {/* Destination Marker */}
        {toCoords && (
          <Marker position={toCoords} icon={createMapMarkerIcon(`End: ${to}`, "#FF7043", "end")}>
            <Popup>
              <Box sx={{ p: 0.5, textAlign: "center" }}>
                <Typography variant="subtitle2" fontWeight={800}>
                  Destination
                </Typography>
                <Typography variant="caption">{to}</Typography>
              </Box>
            </Popup>
          </Marker>
        )}
      </MapContainer>

      {/* ─── OPENSTREETMAP ATTRIBUTION BADGE ─── */}
      <Box
        sx={{
          position: "absolute",
          bottom: 8,
          right: 12,
          zIndex: 1000,
          pointerEvents: "none",
          backgroundColor: isDark ? "rgba(10, 10, 10, 0.72)" : "rgba(255, 255, 255, 0.8)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          px: 1.2,
          py: 0.4,
          borderRadius: 2,
          border: `1px solid ${isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.08)"}`,
          boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
        }}
      >
        <Typography
          variant="caption"
          sx={{
            fontSize: "0.65rem",
            color: isDark ? "rgba(255, 255, 255, 0.65)" : "rgba(0, 0, 0, 0.65)",
            fontWeight: 600,
            letterSpacing: "0.2px",
          }}
        >
          © OpenStreetMap · Stadia
        </Typography>
      </Box>
    </Box>
  );
}
