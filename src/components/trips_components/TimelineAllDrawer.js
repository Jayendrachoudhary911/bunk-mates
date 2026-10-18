import React from "react";
import {
  Box,
  Typography,
  SwipeableDrawer,
  List,
  Checkbox,
  Button,
  Stack,
  IconButton,
  Paper,
} from "@mui/material";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import CloseIcon from "@mui/icons-material/Close";
import EventNoteOutlinedIcon from "@mui/icons-material/EventNoteOutlined";
import {
  drawerPaperSx,
  drawerBackdropSx,
  DrawerHandle,
  glassItemSx,
  flexBetweenSx,
  designTokens,
  glassIconBtnSx
} from "../../theme/designSystem";

const formatTimelineTime = (t) => {
  if (!t) return "";
  if (typeof t === "object" && t !== null) {
    if (typeof t.toDate === "function") return t.toDate().toLocaleString();
    if (typeof t.seconds === "number") return new Date(t.seconds * 1000).toLocaleString();
    if (t instanceof Date) return t.toLocaleString();
  }
  const d = new Date(t);
  return isNaN(d.getTime()) ? (typeof t === "string" ? t : "") : d.toLocaleString();
};

const TimelineAllDrawer = ({
  timelineAllDrawerOpen,
  setTimelineAllDrawerOpen,
  timeline,
  toggleEventCompleted,
  mode,
  userData,
  onGenerateAiSummary,
}) => {
  const isDevBeta = userData?.type === "Dev Beta";

  const handleClose = () => {
    setTimelineAllDrawerOpen(false);
  };

  return (
    <SwipeableDrawer
      anchor="bottom"
      open={timelineAllDrawerOpen}
      onClose={handleClose}
      onOpen={() => {}}
      disableSwipeToOpen={false}
      PaperProps={{
        sx: drawerPaperSx(mode, {
          maxHeight: "90vh"
        }),
      }}
      sx={{ "& .MuiBackdrop-root": drawerBackdropSx }}
    >
      {/* Drag handle visible only on mobile/touch screens */}
      <Box sx={{ display: { xs: "block", md: "none" } }}>
        <DrawerHandle mode={mode} />
      </Box>

      {/* Header Container */}
      <Box
        sx={{
          px: 1,
          pt: { xs: 1, md: 3 },
          pb: 2.5,
          ...flexBetweenSx,
          maxWidth: 600,
          mx: "auto",
          width: "100%",
          boxSizing: "border-box",
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Box>
            <Typography variant="h6" fontWeight={700} lineHeight={1.2}>
              Full Trip Timeline
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {timeline.length} {timeline.length === 1 ? "event" : "events"} scheduled
            </Typography>
          </Box>
        </Stack>

        <Stack direction="row" spacing={1} alignItems="center">
          {isDevBeta && (
            <Button
              size="small"
              variant="outlined"
              startIcon={<AutoAwesomeIcon sx={{ color: mode === "dark" ? "#ffffff" : "#000000" }} />}
              onClick={onGenerateAiSummary}
              sx={{
                borderRadius: designTokens.radii.chip,
                textTransform: "none",
                fontWeight: 600,
                border: 0,
                color: mode === "dark" ? "#ffffff" : "#000000",
                bgcolor:
                  mode === "dark"
                    ? "rgba(255, 255, 255, 0.06)"
                    : "rgba(1, 1, 1, 0.1)",
              }}
            >
              AI Summary
            </Button>
          )}

          {/* Close Button visible only on desktop screens */}
          <IconButton
            onClick={handleClose}
            size="small"
            sx={glassIconBtnSx(mode, { p: 1, display: { xs: 'none', md: 'flex' } })}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Stack>
      </Box>

      {/* Content Area */}
      <Box
        sx={{
          maxWidth: 600,
          mx: "auto",
          width: "100%",
          boxSizing: "border-box",
          px: 0,
          pb: 2,
          flex: 1,
          overflowY: "auto",
          maxHeight: "75vh",
          "&::-webkit-scrollbar": { display: "none" },
        }}
      >
        {timeline.length === 0 ? (
          <Paper
            elevation={0}
            sx={{
              p: 4,
              textAlign: "center",
              borderRadius: 6,
              border: "1px dashed",
              borderColor: mode === "dark" ? "rgba(255,255,255,0.1)" : "divider",
              bgcolor: "transparent",
              my: 2,
            }}
          >
            <EventNoteOutlinedIcon sx={{ fontSize: 40, color: "text.secondary", mb: 1, opacity: 0.5 }} />
            <Typography variant="subtitle2" fontWeight={700} gutterBottom>
              No events added yet
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Your scheduled timeline items will show up here once created.
            </Typography>
          </Paper>
        ) : (
          <List sx={{ p: 0, display: "flex", flexDirection: "column", gap: 1 }}>
            {timeline.map((item) => {
              const itemTime = formatTimelineTime(item.time);
              const isCompleted = item.completed;
              return (
                <Paper
                  key={item.id}
                  elevation={0}
                  sx={{
                    ...glassItemSx(mode),
                    p: 2,
                    borderRadius: 6,
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 2,
                    opacity: isCompleted ? 0.6 : 1,
                    transition: "all 0.2s ease-in-out",
                    border: "1px solid",
                    borderColor: mode === "dark" ? "rgba(255,255,255,0.06)" : "divider",
                  }}
                >
                  <Checkbox
                    checked={!!isCompleted}
                    onChange={() => toggleEventCompleted(item)}
                    color="primary"
                    sx={{ p: 0, mt: 0.2 }}
                  />
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography
                      variant="body1"
                      fontWeight={isCompleted ? 400 : 700}
                      color={isCompleted ? "text.secondary" : "text.primary"}
                      sx={{
                        textDecoration: isCompleted ? "line-through" : "none",
                        mb: 0.5,
                      }}
                      noWrap
                    >
                      {typeof item.title === "object" ? JSON.stringify(item.title) : item.title}
                    </Typography>

                    {itemTime && (
                      <Typography
                        variant="caption"
                        color="primary.main"
                        display="block"
                        fontWeight={600}
                        sx={{ opacity: 0.9, mb: 0.5 }}
                      >
                        {itemTime}
                      </Typography>
                    )}

                    {item.note && (
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        display="block"
                        sx={{
                          wordBreak: "break-word",
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}
                      >
                        {typeof item.note === "object" ? "" : item.note}
                      </Typography>
                    )}
                  </Box>
                </Paper>
              );
            })}
          </List>
        )}
      </Box>
    </SwipeableDrawer>
  );
};

export default TimelineAllDrawer;