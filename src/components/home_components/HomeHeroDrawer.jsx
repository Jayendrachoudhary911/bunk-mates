import React, { useState } from "react";
import {
  Box,
  Container,
  Typography,
  Avatar,
  AvatarGroup,
  IconButton,
  Button,
  Chip,
  useMediaQuery,
  useTheme as useMuiTheme,
} from "@mui/material";
import { motion, AnimatePresence } from "framer-motion";
import Notifications from "../../elements/Notifications";
import WeatherWidget from "./WeatherWidget";
import AQIWidget from "./AQIWidget";
import YourTrips from "./YourTrips";
import RemindersGlimpse from "./RemindersGlimpse";
import OngoingTripsAlerts from "./OngoingTripsAlerts";
import UpcomingTripsAlerts from "./UpcomingTripsAlerts";
import { M3_EXPRESSIVE_PALETTE } from "../../theme/palette";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import FlightTakeoffIcon from "@mui/icons-material/FlightTakeoff";
import AccessTimeFilledIcon from "@mui/icons-material/AccessTimeFilled";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import LocationOnIcon from "@mui/icons-material/LocationOn";

export default function HomeHeroDrawer({
  userData,
  getGreeting,
  weather,
  weatherLoading,
  aqiData,
  liveAlerts,
  myTrips,
  tripGroupsMap,
  tripMembersMap,
  sliderIndex,
  setSliderIndex,
  reminders,
  handleToggleReminderComplete,
  mode,
  accent,
  theme,
  navigate,
  isScrolled,
  onExpandChange,
}) {
  const muiTheme = useMuiTheme();
  const isSmallScreen = useMediaQuery(muiTheme.breakpoints.down("md"));

  // Palette lookup
  const currentPalette =
    M3_EXPRESSIVE_PALETTE[accent] || M3_EXPRESSIVE_PALETTE.blue;
  const activeTheme = currentPalette[mode] || currentPalette.light;

  const bgColor = activeTheme.bg;
  const textColor = activeTheme.text;
  const containerBg = activeTheme.container;
  const onContainerColor = activeTheme.onContainer;
  const badgeBg = activeTheme.badgeBg;
  const accentColor = currentPalette.accent;

  // Widget expand toggles
  const [tripsExpanded, setTripsExpanded] = useState(false);
  const [remindersExpanded, setRemindersExpanded] = useState(false);
  const [drawerSnapped, setDrawerSnapped] = useState(false);

  // Sync scroll state with snapped bar
  const isCompact = isScrolled || drawerSnapped;

  const hasTrips = myTrips && myTrips.length > 0;
  const activeTrip = hasTrips ? myTrips[sliderIndex] || myTrips[0] : null;
  const tripMembers = activeTrip?.id
    ? tripMembersMap[activeTrip.id] || []
    : [];

  const pendingReminders = (reminders || []).filter((r) => !r.completed);
  const nextReminder = pendingReminders[0] || (reminders && reminders[0]);

  // Drag handling
  const handleDragEnd = (event, info) => {
    // If dragged up significantly -> snap to top collapsed
    if (info.offset.y < -50 || info.velocity.y < -300) {
      setDrawerSnapped(true);
      if (onExpandChange) onExpandChange(false);
    }
    // If dragged down from collapsed -> restore
    else if (info.offset.y > 50 || info.velocity.y > 300) {
      if (drawerSnapped) {
        setDrawerSnapped(false);
      } else {
        // Dragged down even more from normal -> expand all shortcut widgets!
        setTripsExpanded(true);
        setRemindersExpanded(true);
        if (onExpandChange) onExpandChange(true);
      }
    }
  };

  return (
    <motion.div
      layout
      style={{
        width: "100%",
        position: "relative",
        zIndex: 1100,
      }}
      transition={{ type: "spring", stiffness: 320, damping: 32 }}
    >
      <Box
        component={motion.div}
        layout
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0.16}
        onDragEnd={handleDragEnd}
        sx={{
          width: "100%",
          backgroundColor: bgColor,
          color: textColor,
          borderBottomLeftRadius: 36,
          borderBottomRightRadius: 36,
          boxShadow:
            mode === "dark"
              ? "0 18px 45px rgba(0, 0, 0, 0.65)"
              : "0 14px 38px rgba(0, 0, 0, 0.12)",
          position: "relative",
          overflow: "hidden",
          transition: "background-color 0.5s ease",
          touchAction: "pan-y",
        }}
      >
        {/* Subtle Ambient Radial Highlight */}
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            background:
              currentPalette.ambientGradient ||
              `radial-gradient(circle at 75% 20%, ${accentColor}35 0%, transparent 65%)`,
            opacity: mode === "dark" ? 0.35 : 0.2,
            pointerEvents: "none",
            zIndex: 0,
          }}
        />

        {/* ------------------------------------------------------------- */}
        {/* 1. COMPACT SNAPPED HEADER VIEW (Shown when scrolled down)    */}
        {/* ------------------------------------------------------------- */}
        <AnimatePresence>
          {isCompact ? (
            <motion.div
              key="compact-hero-bar"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.25 }}
            >
              <Container
                maxWidth="lg"
                sx={{
                  py: 1.5,
                  px: { xs: 2.5, md: 4 },
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  position: "relative",
                  zIndex: 1,
                }}
              >
                {/* Greeting & Name */}
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1.5,
                    cursor: "pointer",
                  }}
                  onClick={() => setDrawerSnapped(false)}
                >
                  <Avatar
                    src={
                      userData?.photoURL ||
                      `https://api.dicebear.com/9.x/glass/svg?seed=${userData?.name || "User"}&radius=50`
                    }
                    sx={{
                      width: 38,
                      height: 38,
                      border: `2px solid ${accentColor}`,
                      boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                    }}
                  />
                  <Box>
                    <Typography
                      sx={{
                        fontSize: "0.72rem",
                        fontWeight: 700,
                        opacity: 0.75,
                        textTransform: "uppercase",
                        letterSpacing: "0.08em",
                        lineHeight: 1,
                      }}
                    >
                      {getGreeting()}
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: "1.05rem",
                        fontWeight: 900,
                        lineHeight: 1.2,
                        color: textColor,
                      }}
                    >
                      {userData?.name || "Explorer"}
                    </Typography>
                  </Box>
                </Box>

                {/* Right Action: Weather chip & Expand handle */}
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
                  {weather?.current && (
                    <Chip
                      size="small"
                      label={`${Math.round(weather.current.temp)}°C · ${weather.city || "Local"}`}
                      sx={{
                        backgroundColor: containerBg,
                        color: onContainerColor,
                        fontWeight: 800,
                        fontSize: "0.78rem",
                        borderRadius: "16px",
                      }}
                    />
                  )}

                  <Button
                    size="small"
                    variant="contained"
                    onClick={() => {
                      setDrawerSnapped(false);
                      setTripsExpanded(false);
                      setRemindersExpanded(false);
                    }}
                    endIcon={<KeyboardArrowDownIcon sx={{ fontSize: 18 }} />}
                    sx={{
                      backgroundColor: containerBg,
                      color: onContainerColor,
                      fontWeight: 800,
                      fontSize: "0.78rem",
                      borderRadius: "20px",
                      textTransform: "none",
                      px: 1.5,
                      py: 0.5,
                      boxShadow: "none",
                      "&:hover": {
                        backgroundColor: badgeBg,
                        boxShadow: "none",
                      },
                    }}
                  >
                    Open Drawer
                  </Button>
                </Box>
              </Container>
            </motion.div>
          ) : (
            /* ------------------------------------------------------------- */
            /* 2. FULL EXPANDED DRAWER HERO VIEW                            */
            /* ------------------------------------------------------------- */
            <motion.div
              key="full-hero-drawer"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.35 }}
            >
              <Container
                maxWidth="lg"
                sx={{
                  pt: { xs: 4, md: 5 },
                  pb: 3,
                  px: { xs: 2.5, md: 4 },
                  position: "relative",
                  zIndex: 1,
                }}
              >
                {/* Top Row: User Greeting & Notifications */}
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    mb: 3,
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <Avatar
                      src={
                        userData?.photoURL ||
                        `https://api.dicebear.com/9.x/glass/svg?seed=${userData?.name || "User"}&radius=50`
                      }
                      sx={{
                        width: { xs: 48, sm: 54 },
                        height: { xs: 48, sm: 54 },
                        border: `2px solid ${accentColor}`,
                        boxShadow: "0 4px 14px rgba(0,0,0,0.18)",
                      }}
                    />
                    <Box>
                      <Typography
                        sx={{
                          fontSize: { xs: "0.8rem", sm: "0.9rem" },
                          fontWeight: 700,
                          opacity: 0.8,
                          letterSpacing: "0.06em",
                          textTransform: "uppercase",
                          lineHeight: 1.1,
                          mb: 0.3,
                        }}
                      >
                        {getGreeting()},
                      </Typography>
                      <Typography
                        sx={{
                          fontSize: { xs: "1.45rem", sm: "1.85rem" },
                          fontWeight: 900,
                          letterSpacing: "-0.03em",
                          lineHeight: 1.1,
                          color: textColor,
                        }}
                      >
                        {userData?.name || "Explorer"}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Notification Bell with styled container */}
                  <Box
                    sx={{
                      backgroundColor: containerBg,
                      color: onContainerColor,
                      borderRadius: "50%",
                      p: 1.1,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
                      transition: "transform 0.2s ease",
                      "&:hover": { transform: "scale(1.08)" },
                    }}
                  >
                    <Notifications sx={{ color: onContainerColor }} />
                  </Box>
                </Box>

                {/* Weather & AQI Widgets Row */}
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: 2,
                    mb: 3,
                  }}
                >
                  <WeatherWidget
                    weather={weather}
                    weatherLoading={weatherLoading}
                    mode={mode}
                    textColor={textColor}
                    theme={theme}
                  />

                  <AQIWidget aqiData={aqiData} mode={mode} />
                </Box>

                {/* Live Trip Alerts (if any) */}
                {liveAlerts &&
                  ((liveAlerts.ongoing && liveAlerts.ongoing.length > 0) ||
                    (liveAlerts.upcoming && liveAlerts.upcoming.length > 0)) && (
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                        mb: 2,
                        gap: 1,
                      }}
                    >
                      <OngoingTripsAlerts
                        ongoingAlerts={liveAlerts.ongoing || []}
                        tripGroupsMap={tripGroupsMap}
                        mode={mode}
                        navigate={navigate}
                      />

                      <UpcomingTripsAlerts
                        upcomingAlerts={liveAlerts.upcoming || []}
                        mode={mode}
                        isSmallScreen={isSmallScreen}
                      />
                    </Box>
                  )}

                {/* ----------------------------------------------------------- */}
                {/* 3. SHORTCUT-LIKE WIDGETS ROW: YOUR TRIPS & REMINDERS       */}
                {/* ----------------------------------------------------------- */}
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
                    gap: 2,
                    mb: 1.5,
                  }}
                >
                  {/* WIDGET A: YOUR TRIPS SHORTCUT */}
                  <Box
                    sx={{
                      backgroundColor: containerBg,
                      color: onContainerColor,
                      borderRadius: 4,
                      p: 2.2,
                      boxShadow: "0 4px 18px rgba(0, 0, 0, 0.06)",
                      border: `1px solid ${accentColor}30`,
                      transition: "all 0.25s ease",
                      cursor: "pointer",
                      "&:hover": {
                        boxShadow: "0 6px 24px rgba(0, 0, 0, 0.12)",
                        transform: "translateY(-2px)",
                      },
                    }}
                    onClick={() => setTripsExpanded((prev) => !prev)}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        mb: 1.5,
                      }}
                    >
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <FlightTakeoffIcon
                          sx={{ fontSize: 20, color: onContainerColor }}
                        />
                        <Typography
                          sx={{
                            fontSize: "0.88rem",
                            fontWeight: 900,
                            letterSpacing: "0.02em",
                          }}
                        >
                          YOUR TRIPS
                        </Typography>
                      </Box>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <Chip
                          size="small"
                          label={
                            hasTrips
                              ? `${myTrips.length} Active`
                              : "No Trips"
                          }
                          sx={{
                            backgroundColor: badgeBg,
                            color: textColor,
                            fontWeight: 800,
                            fontSize: "0.72rem",
                            borderRadius: "12px",
                            height: 22,
                          }}
                        />
                        <IconButton
                          size="small"
                          sx={{ color: onContainerColor, p: 0.4 }}
                        >
                          {tripsExpanded ? (
                            <KeyboardArrowUpIcon fontSize="small" />
                          ) : (
                            <KeyboardArrowDownIcon fontSize="small" />
                          )}
                        </IconButton>
                      </Box>
                    </Box>

                    {hasTrips && activeTrip ? (
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          mt: 0.5,
                        }}
                      >
                        <Box sx={{ minWidth: 0, pr: 1 }}>
                          <Typography
                            noWrap
                            sx={{
                              fontSize: "1.05rem",
                              fontWeight: 800,
                              color: textColor,
                              display: "flex",
                              alignItems: "center",
                              gap: 0.5,
                            }}
                          >
                            <LocationOnIcon
                              sx={{ fontSize: 16, color: onContainerColor }}
                            />
                            {activeTrip.title ||
                              activeTrip.destination ||
                              "Squad Adventure"}
                          </Typography>
                          <Typography
                            sx={{
                              fontSize: "0.76rem",
                              fontWeight: 600,
                              opacity: 0.75,
                              mt: 0.2,
                            }}
                          >
                            {activeTrip.startDate
                              ? new Date(
                                  activeTrip.startDate
                                ).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                })
                              : "Upcoming"}
                            {activeTrip.endDate
                              ? ` - ${new Date(
                                  activeTrip.endDate
                                ).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                })}`
                              : ""}
                          </Typography>
                        </Box>

                        {/* Avatar Group with +X more */}
                        <AvatarGroup
                          max={3}
                          sx={{
                            "& .MuiAvatar-root": {
                              width: 32,
                              height: 32,
                              fontSize: "0.75rem",
                              fontWeight: 800,
                              border: `2px solid ${containerBg}`,
                            },
                          }}
                        >
                          {tripMembers.map((m, idx) => (
                            <Avatar
                              key={m.uid || idx}
                              src={
                                m.photoURL ||
                                `https://api.dicebear.com/9.x/glass/svg?seed=${m.name || idx}&radius=50`
                              }
                              alt={m.name || "Member"}
                            />
                          ))}
                          {tripMembers.length === 0 && (
                            <Avatar
                              src={
                                userData?.photoURL ||
                                `https://api.dicebear.com/9.x/glass/svg?seed=${userData?.name || "Owner"}&radius=50`
                              }
                            />
                          )}
                        </AvatarGroup>
                      </Box>
                    ) : (
                      <Typography
                        sx={{
                          fontSize: "0.84rem",
                          fontWeight: 600,
                          opacity: 0.7,
                          py: 0.5,
                        }}
                      >
                        Plan a new getaway with your friends
                      </Typography>
                    )}
                  </Box>

                  {/* WIDGET B: REMINDERS SHORTCUT */}
                  <Box
                    sx={{
                      backgroundColor: containerBg,
                      color: onContainerColor,
                      borderRadius: 4,
                      p: 2.2,
                      boxShadow: "0 4px 18px rgba(0, 0, 0, 0.06)",
                      border: `1px solid ${accentColor}30`,
                      transition: "all 0.25s ease",
                      cursor: "pointer",
                      "&:hover": {
                        boxShadow: "0 6px 24px rgba(0, 0, 0, 0.12)",
                        transform: "translateY(-2px)",
                      },
                    }}
                    onClick={() => setRemindersExpanded((prev) => !prev)}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        mb: 1.5,
                      }}
                    >
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <AccessTimeFilledIcon
                          sx={{ fontSize: 20, color: onContainerColor }}
                        />
                        <Typography
                          sx={{
                            fontSize: "0.88rem",
                            fontWeight: 900,
                            letterSpacing: "0.02em",
                          }}
                        >
                          REMINDERS
                        </Typography>
                      </Box>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <Chip
                          size="small"
                          label={`${pendingReminders.length} Pending`}
                          sx={{
                            backgroundColor: badgeBg,
                            color: textColor,
                            fontWeight: 800,
                            fontSize: "0.72rem",
                            borderRadius: "12px",
                            height: 22,
                          }}
                        />
                        <IconButton
                          size="small"
                          sx={{ color: onContainerColor, p: 0.4 }}
                        >
                          {remindersExpanded ? (
                            <KeyboardArrowUpIcon fontSize="small" />
                          ) : (
                            <KeyboardArrowDownIcon fontSize="small" />
                          )}
                        </IconButton>
                      </Box>
                    </Box>

                    {nextReminder ? (
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          mt: 0.5,
                        }}
                      >
                        <Box sx={{ minWidth: 0, pr: 1 }}>
                          <Typography
                            noWrap
                            sx={{
                              fontSize: "1.02rem",
                              fontWeight: 800,
                              color: textColor,
                            }}
                          >
                            {nextReminder.title || nextReminder.text || "Upcoming Reminder"}
                          </Typography>
                          <Typography
                            sx={{
                              fontSize: "0.76rem",
                              fontWeight: 600,
                              opacity: 0.75,
                              mt: 0.2,
                              display: "flex",
                              alignItems: "center",
                              gap: 0.5,
                            }}
                          >
                            <CalendarMonthIcon sx={{ fontSize: 13 }} />
                            {nextReminder.dueDate
                              ? new Date(
                                  nextReminder.dueDate
                                ).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                })
                              : "Today"}
                          </Typography>
                        </Box>

                        <Box
                          sx={{
                            width: 32,
                            height: 32,
                            borderRadius: "50%",
                            backgroundColor: badgeBg,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: textColor,
                            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                          }}
                        >
                          <CheckCircleOutlineIcon sx={{ fontSize: 18 }} />
                        </Box>
                      </Box>
                    ) : (
                      <Typography
                        sx={{
                          fontSize: "0.84rem",
                          fontWeight: 600,
                          opacity: 0.7,
                          py: 0.5,
                        }}
                      >
                        All tasks caught up! Relax and enjoy.
                      </Typography>
                    )}
                  </Box>
                </Box>

                {/* ----------------------------------------------------------- */}
                {/* 4. FULL EXPANDED VIEWS (When user clicks on shortcut)       */}
                {/* ----------------------------------------------------------- */}
                <AnimatePresence>
                  {tripsExpanded && (
                    <motion.div
                      key="expanded-trips-content"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.35, ease: "easeInOut" }}
                      style={{ overflow: "hidden", marginBottom: 16 }}
                    >
                      <Box
                        sx={{
                          pt: 2,
                          pb: 1,
                          borderTop: `1px dashed ${accentColor}40`,
                        }}
                      >
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
                    </motion.div>
                  )}
                </AnimatePresence>

                <AnimatePresence>
                  {remindersExpanded && (
                    <motion.div
                      key="expanded-reminders-content"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.35, ease: "easeInOut" }}
                      style={{ overflow: "hidden", marginBottom: 16 }}
                    >
                      <Box
                        sx={{
                          pt: 2,
                          pb: 1,
                          borderTop: `1px dashed ${accentColor}40`,
                        }}
                      >
                        <RemindersGlimpse
                          reminders={reminders}
                          mode={mode}
                          handleToggleReminderComplete={
                            handleToggleReminderComplete
                          }
                        />
                      </Box>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Container>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ------------------------------------------------------------- */}
        {/* 5. SLEEK BOTTOM DRAG HANDLE & ARC INDICATOR                  */}
        {/* ------------------------------------------------------------- */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            py: 1,
            cursor: "grab",
            "&:active": { cursor: "grabbing" },
          }}
          onClick={() => {
            if (isCompact) {
              setDrawerSnapped(false);
            } else {
              setDrawerSnapped(true);
            }
          }}
        >
          <Box
            sx={{
              width: 46,
              height: 4.5,
              borderRadius: 3,
              backgroundColor:
                mode === "dark"
                  ? "rgba(255, 255, 255, 0.3)"
                  : "rgba(0, 0, 0, 0.22)",
              transition: "all 0.25s ease",
              "&:hover": {
                width: 58,
                backgroundColor:
                  mode === "dark"
                    ? "rgba(255, 255, 255, 0.55)"
                    : "rgba(0, 0, 0, 0.4)",
              },
            }}
          />
        </Box>
      </Box>
    </motion.div>
  );
}
