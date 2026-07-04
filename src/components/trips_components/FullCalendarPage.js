import React, { useMemo } from "react";
import {
  Box,
  Typography,
  IconButton,
  Button,
  Stack,
  Paper,
  Grid,
  ThemeProvider,
  Dialog,
  Slide
} from "@mui/material";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import CloseIcon from "@mui/icons-material/Close";
import { useThemeToggle } from "../../contexts/ThemeToggleContext";
import { getTheme } from "../../theme";

const isSameDay = (date1, date2) => {
  if (!date1 || !date2) return false;
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
};

const defaultGetTripColor = (tripId, mode) => {
  return mode === "dark" ? "#4caf50" : "#2e7d32";
};

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const FullCalendarView = ({
  fullCalendarOpen = false,
  setFullCalendarOpen,
  currentViewDate = new Date(),
  setCurrentViewDate,
  trips = [],
  jumpToTargetDate,
  centeredDateStr,
  getTripColor = defaultGetTripColor
}) => {
  const { mode, accent } = useThemeToggle();
  const theme = useMemo(() => getTheme(mode, accent || "blue"), [mode, accent]);
  const today = useMemo(() => new Date(), []);

  // Compute clean matrix data blocks mapping safely across an uniform 7-column layout layout
  const matrixBlocks = useMemo(() => {
    const year = currentViewDate.getFullYear();
    const month = currentViewDate.getMonth();

    const firstDayOfMonth = new Date(year, month, 1);
    const startPaddingCount = firstDayOfMonth.getDay(); 

    const blocks = [];

    // 1. Lead padding days offset parsing
    for (let i = startPaddingCount; i > 0; i--) {
      const prevDate = new Date(year, month, 1 - i);
      blocks.push({ date: prevDate, isCurrentMonth: false });
    }

    // 2. Main active monthly blocks rendering
    const totalDaysInMonth = new Date(year, month + 1, 0).getDate();
    for (let day = 1; day <= totalDaysInMonth; day++) {
      const activeDate = new Date(year, month, day);
      blocks.push({ date: activeDate, isCurrentMonth: true });
    }

    // 3. Trailing blocks safely padding out a clean 6 rows layout grid
    const targetTotalGridCells = 42; 
    const trailingDaysNeeded = targetTotalGridCells - blocks.length;
    for (let i = 1; i <= trailingDaysNeeded; i++) {
      const nextDate = new Date(year, month + 1, i);
      blocks.push({ date: nextDate, isCurrentMonth: false });
    }

    return blocks;
  }, [currentViewDate]);

  return (
    <ThemeProvider theme={theme}>
      <Dialog
        fullScreen
        open={fullCalendarOpen}
        onClose={() => setFullCalendarOpen && setFullCalendarOpen(false)}
        TransitionComponent={Transition}
        PaperProps={{
          sx: {
            background:
              mode === "dark"
                ? "#000"
                : "#fff",
            color: mode === "dark" ? "#fff" : "#000",
            backgroundImage: "none",
            p: { xs: 2, sm: 4 },
            boxSizing: "border-box"
          }
        }}
      >
        <Box
          sx={{
            width: "100%",    
            maxWidth: 700,
            mx: "auto",
            display: "flex",
            flexDirection: "column"
          }}
        >
          {/* Calendar Navigation Header Element Section */}
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 2,
              pb: 3,
              borderBottom: "1px solid",
              borderColor: mode === "dark" ? "rgba(255,255,255,.06)" : "rgba(0,0,0,.06)",
              mb: 3
            }}
          >
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <Box>
                <Typography sx={{ fontSize: ".85rem", opacity: 0.6, fontWeight: 700, letterSpacing: 1.2 }}>
                  CALENDAR
                </Typography>
                <Typography sx={{ fontSize: { xs: "1.8rem", sm: "2.2rem" }, fontWeight: 800, lineHeight: 1.1 }}>
                  {currentViewDate.toLocaleString("default", { month: "long" })}
                </Typography>
                <Typography sx={{ opacity: 0.7, fontSize: "0.95rem" }}>
                  {currentViewDate.getFullYear()}
                </Typography>
              </Box>

              <Stack direction="row" spacing={1} alignItems="center">
                <Button
                  onClick={() => setCurrentViewDate(new Date())}
                  size="small"
                  sx={{
                    borderRadius: 99,
                    px: 2,
                    py: 0.5,
                    textTransform: "none",
                    fontWeight: 700,
                    color: mode === "dark" ? "#fff" : "#000",
                    bgcolor: mode === "dark" ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
                    "&:hover": { bgcolor: mode === "dark" ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)" }
                  }}
                >
                  Today
                </Button>
                <IconButton
                  onClick={() => setFullCalendarOpen && setFullCalendarOpen(false)}
                  size="small"
                  sx={{
                    borderRadius: 99,
                    color: mode === "dark" ? "#fff" : "#000",
                    bgcolor: mode === "dark" ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
                    "&:hover": { bgcolor: mode === "dark" ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)" }
                  }}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Stack>
            </Box>

            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Typography variant="body2" sx={{ fontWeight: 600, opacity: 0.8 }}>
                {trips.length} {trips.length === 1 ? "Trip Planned" : "Trips Planned"}
              </Typography>

              <Stack direction="row" spacing={0.5}>
                <IconButton
                  size="small"
                  onClick={() => {
                    const d = new Date(currentViewDate);
                    d.setMonth(d.getMonth() - 1);
                    setCurrentViewDate(d);
                  }}
                >
                  <ArrowBackIosNewIcon fontSize="small" />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={() => {
                    const d = new Date(currentViewDate);
                    d.setMonth(d.getMonth() + 1);
                    setCurrentViewDate(d);
                  }}
                >
                  <ArrowForwardIosIcon fontSize="small" />
                </IconButton>
              </Stack>
            </Box>
          </Box>

          {/* Minimalist Grid Matrix Inner Frame */}
          <Paper
            elevation={0}
            sx={{
              p: 2,
              borderRadius: 5,
              bgcolor: mode === "dark" ? "rgba(255,255,255,.02)" : "rgba(0,0,0,.01)",
              border: "1px solid",
              borderColor: mode === "dark" ? "rgba(255,255,255,.04)" : "rgba(0,0,0,.03)",
            }}
          >
            {/* Weekday Structural Row Headers */}
            <Grid container fullWidth columns={7} sx={{ mb: 1, px: "4px" }}>
              {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map((day) => (
                <Grid item xs={1} key={day} fullWidth>
                  <Typography
                    align="center"
                    sx={{
                      fontSize: ".7rem",
                      fontWeight: 800,
                      opacity: 0.4,
                      letterSpacing: 1.1,
                      px: 1
                    }}
                  >
                    {day}
                  </Typography>
                </Grid>
              ))}
            </Grid>

            {/* Core Calendar Days Layout */}
            <Grid container rowSpacing={1.2} columns={7} textAlign="center">
              {matrixBlocks.map(({ date, isCurrentMonth }, index) => {
                const isCellToday = isSameDay(date, today);
                const cellKey = date.toISOString().split("T")[0];
                const isCellTargetActive = centeredDateStr === cellKey;

                const cellTrips = trips.filter((t) => {
                  const start = new Date(t.startDate);
                  const end = new Date(t.endDate);
                  const target = new Date(date);
                  start.setHours(0,0,0,0);
                  end.setHours(23,59,59,999);
                  return target >= start && target <= end;
                });

                return (
                  <Grid item xs={1} key={`cell-${cellKey}-${index}`} sx={{ px: "4px" }}>
                    <Box
                      onClick={() => jumpToTargetDate && jumpToTargetDate(date)}
                      sx={{
                        aspectRatio: "1/1",
                        borderRadius: 3.5,
                        position: "relative",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                        
                        background: isCellToday
                          ? theme.palette.primary.main
                          : isCellTargetActive
                          ? mode === "dark"
                            ? "rgba(255,255,255,.08)"
                            : "rgba(0,0,0,.05)"
                          : "transparent",
                        
                        color: isCellToday
                          ? "#fff"
                          : !isCurrentMonth
                          ? mode === "dark" ? "rgba(255,255,255,0.18)" : "rgba(0,0,0,0.18)"
                          : mode === "dark" ? "rgba(255,255,255,0.9)" : "rgba(0,0,0,0.85)",

                        "&:hover": {
                          transform: "scale(1.05)",
                          background: isCellToday 
                            ? theme.palette.primary.main 
                            : mode === "dark"
                            ? "rgba(255,255,255,.08)"
                            : "rgba(0,0,0,.05)",
                        },
                      }}
                    >
                      <Typography
                        sx={{
                          fontSize: "0.95rem",
                          fontWeight: isCellToday || isCellTargetActive ? 700 : 500,
                          px:1.7
                        }}
                      >
                        {date.getDate()}
                      </Typography>

                      {/* Dynamic Indicator Badges */}
                      {cellTrips.length > 0 && (
                        <Box
                          sx={{
                            width: 5,
                            height: 5,
                            borderRadius: "50%",
                            position: "absolute",
                            bottom: 6,
                            background: isCellToday 
                              ? "#ffffff" 
                              : getTripColor(cellTrips[0].id, mode),
                          }}
                        />
                      )}
                    </Box>
                  </Grid>
                );
              })}
            </Grid>
          </Paper>
        </Box>
      </Dialog>
    </ThemeProvider>
  );
};

export default FullCalendarView;