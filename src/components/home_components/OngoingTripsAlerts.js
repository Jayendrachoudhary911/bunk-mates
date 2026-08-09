import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Avatar,
  Chip,
  Button,
} from "@mui/material";
import { motion, AnimatePresence } from "framer-motion";
import { MapContainer, TileLayer, Polyline, Marker } from "react-leaflet";
import L from "leaflet";
import Confetti from "react-confetti";
import { CheckCircleOutline } from "../../icons";
import { designTokens, glass, ctaButtonSx, flexCenterSx } from "../../theme/designSystem";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const geoCache = {};

async function geocodePlace(place) {
  if (geoCache[place]) return geoCache[place];

  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
      place
    )}`
  );
  const data = await res.json();
  if (!data?.length) return null;

  const coords = [parseFloat(data[0].lat), parseFloat(data[0].lon)];
  geoCache[place] = coords;
  return coords;
}

const MiniRouteMap = ({ from, to }) => {
  const [points, setPoints] = useState([]);

  useEffect(() => {
    let mounted = true;

    (async () => {
      const start = await geocodePlace(from);
      const end = await geocodePlace(to);

      if (start && end && mounted) {
        setPoints([start, end]);
      }
    })();

    return () => (mounted = false);
  }, [from, to]);

  if (points.length < 2) {
    return (
      <Box
        sx={{
          height: 90,
          borderRadius: 8,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "rgba(0,0,0,0.08)",
          fontSize: 12,
        }}
      >
        Loading map…
      </Box>
    );
  }

  return (
    <Box
      sx={{
        height: 90,
        borderRadius: 2,
        overflow: "hidden",
        border: "1px solid rgba(0,0,0,0.08)",
      }}
    >
      <MapContainer
        center={points[0]}
        zoom={6}
        scrollWheelZoom={false}
        style={{ height: "100%", width: "100%" }}
        dragging={false}
        zoomControl={false}
        doubleClickZoom={false}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="© OpenStreetMap"
        />
        <Polyline
          positions={points}
          pathOptions={{ color: "#22c55e", weight: 4 }}
        />
        <Marker position={points[0]} />
        <Marker position={points[1]} />
      </MapContainer>
    </Box>
  );
};

const getDayProgress = (start, end) => {
  const startDate = new Date(start);
  const endDate = new Date(end || start);
  const now = new Date();

  const totalDays =
    Math.max(1, Math.ceil((endDate - startDate) / 86400000) + 1);

  const currentDay =
    now < startDate
      ? 0
      : Math.min(
          totalDays,
          Math.ceil((now - startDate) / 86400000) + 1
        );

  return { currentDay, totalDays };
};

export default function OngoingTripsAlerts({
  ongoingAlerts,
  tripGroupsMap,
  mode,
  navigate,
}) {
  const [expandedOngoingId, setExpandedOngoingId] = useState(null);

  if (!ongoingAlerts || ongoingAlerts.length === 0) return null;

  return (
    <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
      {ongoingAlerts.map((t) => {
        const expanded = expandedOngoingId === t.id;
        const { currentDay, totalDays } = getDayProgress(t.start, t.end);
        const completed = currentDay >= totalDays;

        return (
          <motion.div
            key={t.id}
            layout
            transition={{ layout: { duration: 0.35, ease: "easeOut" } }}
          >
            <motion.div
              onClick={() => setExpandedOngoingId(expanded ? null : t.id)}
              whileHover={{ y: -6 }}
              whileTap={{ scale: 0.98 }}
              style={{ cursor: "pointer" }}
            >
              <Box
                sx={{
                  width: 340,
                  p: 1.6,
                  borderRadius: designTokens.radii.card,
                  display: "flex",
                  flexDirection: "column",
                  gap: 1.2,
                  ...glass(mode, {
                    background: completed
                      ? "linear-gradient(135deg, rgba(16,185,129,0.18), rgba(16,185,129,0.08))"
                      : mode === "dark"
                      ? tripGroupsMap[t.id]?.iconURL
                        ? `linear-gradient(rgba(0, 0, 0, 0.01), rgba(0, 0, 0, 0))`
                        : "linear-gradient(135deg, rgba(255,255,255,0.04), rgba(255,255,255,0.04))"
                      : "linear-gradient(135deg, rgba(0,0,0,0.05), rgba(0,0,0,0.02))",
                    border: completed
                      ? "1px solid rgba(16,185,129,0.4)"
                      : undefined,
                  }),
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  backgroundRepeat: "no-repeat",
                }}
              >
                {/* ─── HEADER ─── */}
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                  <motion.div
                    animate={{ scale: [1, 1.15, 1] }}
                    transition={{ repeat: Infinity, duration: 1.6 }}
                  >
                    <Box
                      sx={{
                        width: 38,
                        height: 38,
                        borderRadius: 10,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: completed
                          ? "rgba(16,185,129,0.25)"
                          : "rgba(255, 0, 0, 0.12)",
                      }}
                    >
                      {completed ? (
                        <CheckCircleOutline sx={{ color: "#10b981" }} />
                      ) : (
                        <Avatar
                          src={tripGroupsMap[t.id]?.iconURL}
                          sx={{ color: "#ff6b6b" }}
                        />
                      )}
                    </Box>
                  </motion.div>

                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 800 }} noWrap>
                      {t.name}
                    </Typography>

                    <Typography variant="caption" color="text.secondary">
                      Day {currentDay} / {totalDays}
                    </Typography>
                  </Box>

                  <Chip
                    size="small"
                    label={completed ? "COMPLETED" : "LIVE"}
                    sx={{
                      fontWeight: 800,
                      backgroundColor: completed
                        ? "rgba(16,185,129,0.25)"
                        : "rgba(255,0,0,0.12)",
                      color: completed
                        ? "#10b981"
                        : mode === "dark"
                        ? "#ffb4b4"
                        : "#ff6868ff",
                    }}
                  />
                </Box>

                {completed && expanded && (
                  <Confetti
                    numberOfPieces={160}
                    recycle={false}
                    gravity={0.25}
                    tweenDuration={5000}
                  />
                )}

                {/* ─── EXPANDED ─── */}
                <AnimatePresence>
                  {expanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.35 }}
                    >
                      <Box
                        onClick={(e) => e.stopPropagation()}
                        sx={{
                          mt: 1,
                          pt: 1,
                          borderTop:
                            mode === "dark"
                              ? "1px solid rgba(255,255,255,0.1)"
                              : "1px solid rgba(0,0,0,0.08)",
                          display: "flex",
                          flexDirection: "column",
                          gap: 1,
                        }}
                      >
                        <Typography variant="caption">
                          Route • {t.from} → {t.to}
                        </Typography>

                        <MiniRouteMap from={t.from} to={t.to} />

                        {completed && (
                          <Typography
                            variant="caption"
                            sx={{
                              color: "#10b981",
                              fontWeight: 700,
                              textAlign: "center",
                            }}
                          >
                            🎉 Trip Completed!
                          </Typography>
                        )}

                        <Box
                          sx={{
                            display: "flex",
                            gap: 1.2,
                            mt: 0.5,
                          }}
                        >
                          <Button
                            fullWidth
                            variant="outlined"
                            size="small"
                            onClick={() => navigate(`/trips/${t.id}?tab=details`)}
                            sx={ctaButtonSx(mode, "secondary", { py: 0.9, borderRadius: 6 })}
                          >
                            Trip Details
                          </Button>

                          <Button
                            fullWidth
                            variant="contained"
                            size="small"
                            onClick={() => navigate(`/trips/${t.id}?tab=timeline`)}
                            sx={ctaButtonSx(mode, "primary", { py: 0.9, borderRadius: 6 })}
                          >
                            Timeline
                          </Button>
                        </Box>
                      </Box>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Box>
            </motion.div>
          </motion.div>
        );
      })}
    </Box>
  );
}
