import React from "react";
import {
  Box,
  Typography,
  Button,
  SwipeableDrawer,
  IconButton,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Slider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Avatar,
} from "@mui/material";
import {
  CloseOutlined as CloseOutlinedIcon,
  DeleteOutline as DeleteOutlineIcon,
  ShieldOutlined as ShieldOutlinedIcon,
  InfoOutlined as InfoOutlinedIcon,
  Tune as TuneOutlinedIcon,
  Group as AdminPanelSettingsOutlinedIcon,
} from "../../icons";
import {
  drawerPaperSx,
  drawerBackdropSx,
  DrawerHandle,
  glassIconBtnSx
} from "../../theme/designSystem";

const glassCard = (mode) => ({
  borderRadius: 6,
  p: 2.5,
  border: "0px solid",
  bgcolor: mode === "dark" ? "rgba(255,255,255,0.025)" : "rgba(0,0,0,0.015)",
});

/* ---------------- Component ---------------- */

const SettingsDrawer = ({
  settingsDrawerOpen,
  setSettingsDrawerOpen,
  trip,
  tripAdmins,
  memberDetails,
  tripPermissions,
  updatePermissions,
  promoteToAdmin,
  demoteAdmin,
  mode,
  setMode,
  accent,
  setAccent,
  confirmDeleteOpen,
  setConfirmDeleteOpen,
  getMemberName,
  currentUseruid,
  displaySettings = { layout: "grid", gridCols: 3, listCols: 1, cardType: "regular" },
  updateDisplaySettings = () => {},
}) => {
  const isAdmin = tripAdmins.includes(currentUseruid);

  const handleClose = () => {
    setSettingsDrawerOpen(false);
  };

  return (
    <SwipeableDrawer
      anchor="bottom"
      open={settingsDrawerOpen}
      onClose={handleClose}
      onOpen={() => {}}
      disableSwipeToOpen={false}
      PaperProps={{
        sx: {
          ...drawerPaperSx(mode, {
            maxHeight: "85vh"
          }),
          overflowY: "auto",
        },
      }}
      ModalProps={{
        BackdropProps: {
          sx: drawerBackdropSx,
        },
      }}
    >
      {/* Drag handle visible only on mobile/touch screens */}
      <Box sx={{ display: { xs: "block", md: "none" } }}>
        <DrawerHandle mode={mode} />
      </Box>

      {/* Header */}
      <Box
        sx={{
          px: 1,
          pt: { xs: 1, md: 3 },
          pb: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          maxWidth: 600,
          mx: "auto",
          width: "100%",
          boxSizing: "border-box",
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Box>
            <Typography variant="h6" fontWeight={700} lineHeight={1.2}>
              {isAdmin ? "Trip Settings" : "Trip Info"}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {isAdmin ? "Manage permissions, display layouts, and trip details" : "View general trip metadata and overview"}
            </Typography>
          </Box>
        </Stack>

        <IconButton
          onClick={handleClose}
          size="small"
          sx={glassIconBtnSx(mode, { p: 1, display: { xs: 'none', md: 'flex' } })}
        >
          <CloseOutlinedIcon fontSize="small" />
        </IconButton>
      </Box>

      <Box
        sx={{
          maxWidth: 600,
          mx: "auto",
          width: "100%",
          boxSizing: "border-box",
          px: 1,
          pb: 2,
        }}
      >
        <Stack spacing={2.5}>
          {/* ---------------- Trip Info ---------------- */}
          <Box sx={glassCard(mode)}>
            <Stack direction="row" alignItems="center" spacing={1.5} mb={2}>
              <InfoOutlinedIcon fontSize="small" color="primary" />
              <Typography fontWeight={700} variant="subtitle2">Trip Overview</Typography>
            </Stack>

            <Stack spacing={1.2}>
              <InfoRow label="Name" value={trip?.name} />
              <InfoRow label="Location" value={trip?.location} />
              <InfoRow
                label="Dates"
                value={
                  trip?.startDate && trip?.endDate
                    ? `${new Date(trip.startDate).toDateString()} → ${new Date(
                        trip.endDate
                      ).toDateString()}`
                    : "Not set"
                }
              />
              <InfoRow
                label="Route"
                value={
                  trip?.from && trip?.to
                    ? `${trip.from} → ${trip.to}`
                    : "Not set"
                }
              />
              <InfoRow
                label="Created by"
                value={getMemberName(trip?.createdBy)}
              />
              <InfoRow label="Members" value={`${memberDetails.length}`} />
            </Stack>
          </Box>

{/* ---------------- Permissions ---------------- */}
          {isAdmin && (
            <Box sx={glassCard(mode)}>
              <Stack direction="row" alignItems="center" spacing={1.5} mb={2.5}>
                <ShieldOutlinedIcon fontSize="small" color="primary" />
                <Typography fontWeight={700} variant="subtitle2">Permissions</Typography>
              </Stack>

              <Stack spacing={2.5}>
                {Object.keys(tripPermissions).map((perm) => {
                  const permLabel = perm
                    .replace("canAdd", "Who can add ")
                    .replace("canEdit", "Who can edit ");

                  return (
                    <Box
                      key={perm}
                      sx={{
                        bgcolor: 'transparent',
                        border: "0px solid",
                      }}
                    >
                      <Typography
                        variant="caption"
                        fontWeight={700}
                        color="text.secondary"
                        sx={{ display: "block", mb: 1.5, textTransform: "uppercase", letterSpacing: 0.5 }}
                      >
                        {permLabel}
                      </Typography>

                      <ToggleButtonGroup
                        value={tripPermissions[perm]}
                        exclusive
                        onChange={(_, v) => {
                          if (v) {
                            updatePermissions({
                              ...tripPermissions,
                              [perm]: v,
                            });
                          }
                        }}
                        size="small"
                        fullWidth
                        sx={{
                          bgcolor: mode === "dark" ? "rgba(0,0,0,0.2)" : "rgba(0,0,0,0.04)",
                          borderRadius: 8,
                          p: 0.5,
                          "& .MuiToggleButton-root": {
                            border: "none",
                            borderRadius: 8,
                            textTransform: "none",
                            fontWeight: 700,
                            fontSize: "0.8rem",
                            py: 0.8,
                            color: "text.secondary",
                            "&.Mui-selected": {
                              bgcolor: mode === "dark" ? "rgba(255,255,255,0.12)" : "background.paper",
                              color: "text.primary",
                              boxShadow: mode === "dark" ? "0 2px 8px rgba(0,0,0,0.4)" : "0 2px 8px rgba(0,0,0,0.08)",
                            },
                          },
                        }}
                      >
                        <ToggleButton value="all">Everyone</ToggleButton>
                        <ToggleButton value="admins">Admins Only</ToggleButton>
                      </ToggleButtonGroup>
                    </Box>
                  );
                })}
              </Stack>
            </Box>
          )}

          {/* ---------------- Admins ---------------- */}
          {isAdmin && (
            <Box sx={glassCard(mode)}>
              <Stack direction="row" alignItems="center" spacing={1.5} mb={2}>
                <AdminPanelSettingsOutlinedIcon fontSize="small" color="primary" />
                <Typography fontWeight={700} variant="subtitle2">Manage Admins</Typography>
              </Stack>

              <Stack spacing={1.5}>
                {memberDetails.map((user) => {
                  const isTripAdmin = tripAdmins.includes(user.uid);
                  const displayName = getMemberName(user.uid);
                  const usernameHandle = user.username ? `@${user.username}` : `Member`;

                  return (
                    <Stack
                      key={user.uid}
                      direction="row"
                      alignItems="center"
                      justifyContent="space-between"
                      sx={{
                        p: 0,
                        pb: 1,
                        borderRadius: 0,
                        bgcolor: 'transparent',
                        borderBottom: "1px dashed",
                        borderColor: mode === "dark" ? "rgba(255,255,255,0.04)" : "divider",
                      }}
                    >
                      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ minWidth: 0, mr: 1 }}>
                        <Avatar
                          src={user.photoURL}
                          sx={{
                            width: 36,
                            height: 36,
                            fontWeight: 700,
                            bgcolor: "primary.main",
                            color: "primary.contrastText",
                            border: "0px solid",
                          }}
                        >
                          {displayName.charAt(0)}
                        </Avatar>
                        <Box sx={{ minWidth: 0 }}>
                          <Typography variant="body2" fontWeight={700} noWrap>
                            {displayName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" noWrap display="block">
                            {usernameHandle}
                          </Typography>
                        </Box>
                      </Stack>

                      {isTripAdmin ? (
                        user.uid !== trip?.createdBy && (
                          <Button
                            size="small"
                            color="warning"
                            onClick={() => demoteAdmin(user.uid)}
                            sx={{
                              textTransform: "none",
                              fontWeight: 700,
                              fontSize: "0.72rem",
                              borderRadius: 2,
                              px: 1.5,
                            }}
                          >
                            Demote
                          </Button>
                        )
                      ) : (
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => promoteToAdmin(user.uid)}
                          sx={{
                            textTransform: "none",
                            fontWeight: 700,
                            fontSize: "0.72rem",
                            borderRadius: 2,
                            px: 1.5,
                            borderWidth: "1.5px",
                            "&:hover": { borderWidth: "1.5px" },
                          }}
                        >
                          Promote
                        </Button>
                      )}
                    </Stack>
                  );
                })}
              </Stack>
            </Box>
          )}

          {/* ---------------- Display Settings ---------------- */}
          {isAdmin && (
            <Box sx={glassCard(mode)}>
              <Stack direction="row" alignItems="center" spacing={1.5} mb={2.5}>
                <TuneOutlinedIcon fontSize="small" color="primary" />
                <Typography fontWeight={700} variant="subtitle2">Display Settings</Typography>
              </Stack>

              <Stack spacing={2.5} px={1}>
                {/* Layout Style */}
                <Box
                  sx={{
                    bgcolor: 'transparent',
                    border: "0px solid",
                  }}
                >
                  <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ display: "block", mb: 1.5, textTransform: "uppercase", letterSpacing: 0.5 }}>
                    Layout Style
                  </Typography>
                  <ToggleButtonGroup
                    value={displaySettings.layout}
                    exclusive
                    onChange={(_, v) => v && updateDisplaySettings({ layout: v })}
                    size="small"
                    fullWidth
                    sx={{
                      bgcolor: mode === "dark" ? "rgba(0,0,0,0.2)" : "rgba(0,0,0,0.04)",
                      borderRadius: 8,
                      p: 0.5,
                      "& .MuiToggleButton-root": {
                        border: "none",
                        borderRadius: 8,
                        textTransform: "none",
                        fontWeight: 700,
                        fontSize: "0.8rem",
                        py: 0.8,
                        color: "text.secondary",
                        "&.Mui-selected": {
                          bgcolor: mode === "dark" ? "rgba(255,255,255,0.12)" : "background.paper",
                          color: "text.primary",
                          boxShadow: mode === "dark" ? "0 2px 8px rgba(0,0,0,0.4)" : "0 2px 8px rgba(0,0,0,0.08)",
                        },
                      },
                    }}
                  >
                    <ToggleButton value="grid">Grid View</ToggleButton>
                    <ToggleButton value="list">List View</ToggleButton>
                  </ToggleButtonGroup>
                </Box>

                {/* Grid Columns Slider */}
                <Box
                  sx={{
                    bgcolor: 'transparent',
                    border: "0px solid",
                  }}
                >
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: "uppercase", letterSpacing: 0.5 }}>
                      Grid Columns
                    </Typography>
                    <Typography variant="caption" fontWeight={800} color="primary.main">
                      {displaySettings.gridCols || 3} items/row
                    </Typography>
                  </Box>
                  <Box px={1} pt={1}>

<Slider
    value={displaySettings.gridCols || 3}
    min={1}
    max={6}
    step={1}
    marks
    valueLabelDisplay="auto"
    onChange={(_, v) =>
        updateDisplaySettings({ gridCols: v })
    }
    sx={{
mt: 1.5,
px: 0.5,
color: "primary.main",
height: 18,

"& .MuiSlider-rail": {
    height: 15,
    pl: 1,
    opacity: 1,
    bgcolor: "action.disabledBackground",
    borderRadius: 6,
        transform: "translate(-0.5%, -50%)",
},

"& .MuiSlider-track": {
    height: 14,
    border: "none",
    borderRadius: 6,
    transition: "width 250ms cubic-bezier(0.22, 1, 0.36, 1)",
},

"& .MuiSlider-thumb": {
    width: 24,
    height: 14,
    borderRadius: 2,
    bgcolor: "background.paper",
    border: "2px solid",
    borderColor: "primary.main",
    boxShadow: "none",
    transition: "transform 180ms ease, box-shadow 180ms ease",
        transform: "translate(-50%, -50%)",

    "&:hover": {
        boxShadow: (theme) =>
            `0 0 0 5px ${theme.palette.action.hover}`,
    },

    "&.Mui-active": {
        transform: "translate(-50%, -50%) scale(2)",
    },

    "&::before": {
        boxShadow: "none",
    },
},

"& .MuiSlider-mark": {
    width: 4,
    height: 4,
    borderRadius: "50%",
    bgcolor: "text.disabled",
    transition: "background-color 180ms ease",
},


        "& .MuiSlider-valueLabel": {
            borderRadius: 2,
            bgcolor: "text.primary",
            color: "background.paper",
            fontSize: "0.72rem",
            fontWeight: 500,
            padding: "4px 8px",
            transformOrigin: "bottom center",
            transition: "opacity 150ms ease",
            animation: "sliderLabelIn 180ms ease-out",
        },

        "@keyframes sliderLabelIn": {
            "0%": {
                opacity: 0,
                transform: "translateY(0px) scale(0.92)",
            },
            "100%": {
                opacity: 1,
                transform: "translateY(0) scale(1)",
            },
        },

        "@media (prefers-reduced-motion: reduce)": {
            "& *, & *::before, & *::after": {
                animationDuration: "0.01ms !important",
                transitionDuration: "0.01ms !important",
            },
        },
    }}
/>

                  </Box>
                </Box>

                {/* List Columns Select */}
                <Box
                  sx={{
                    bgcolor: 'transparent',
                    border: "0px solid",
                  }}
                >
                  <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ display: "block", mb: 1.5, textTransform: "uppercase", letterSpacing: 0.5 }}>
                    List Columns
                  </Typography>
                  <FormControl fullWidth size="small">
                    <InputLabel id="list-cols-label">Columns Count</InputLabel>
                    <Select
                      labelId="list-cols-label"
                      value={displaySettings.listCols || 1}
                      label="Columns Count"
                      onChange={(e) => updateDisplaySettings({ listCols: Number(e.target.value) })}
                      sx={{
                        borderRadius: 4,
                        bgcolor: mode === "dark" ? "rgba(255,255,255,0.03)" : "background.paper",
                      }}
                    >
                      {[1, 2, 3].map((n) => <MenuItem value={n} key={n}>{n} Column{n > 1 ? "s" : ""}</MenuItem>)}
                    </Select>
                  </FormControl>
                </Box>

                {/* Card Type */}
                <Box
                  sx={{
                    bgcolor: 'transparent',
                    border: "0px solid",
                  }}
                >
                  <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ display: "block", mb: 1.5, textTransform: "uppercase", letterSpacing: 0.5 }}>
                    Card Style Type
                  </Typography>
                  <ToggleButtonGroup
                    value={displaySettings.cardType || "regular"}
                    exclusive
                    onChange={(_, v) => v && updateDisplaySettings({ cardType: v })}
                    size="small"
                    fullWidth
                    sx={{
                      bgcolor: mode === "dark" ? "rgba(0,0,0,0.2)" : "rgba(0,0,0,0.04)",
                      borderRadius: 8,
                      p: 0.5,
                      "& .MuiToggleButton-root": {
                        border: "none",
                        borderRadius: 8,
                        textTransform: "none",
                        fontWeight: 700,
                        fontSize: "0.8rem",
                        py: 0.8,
                        color: "text.secondary",
                        "&.Mui-selected": {
                          bgcolor: mode === "dark" ? "rgba(255,255,255,0.12)" : "background.paper",
                          color: "text.primary",
                          boxShadow: mode === "dark" ? "0 2px 8px rgba(0,0,0,0.4)" : "0 2px 8px rgba(0,0,0,0.08)",
                        },
                      },
                    }}
                  >
                    <ToggleButton value="regular">Regular</ToggleButton>
                    <ToggleButton value="detailed">Detailed</ToggleButton>
                  </ToggleButtonGroup>
                </Box>
              </Stack>
            </Box>
          )}

          {/* ---------------- Danger Zone ---------------- */}
          {isAdmin && (
            <Box
              sx={{
                ...glassCard(mode),
                border: "0px solid",
                borderRadius: 6,
                bgcolor: mode === "dark" ? "rgba(244, 67, 54, 0.04)" : "rgba(244, 67, 54, 0.13)",
              }}
            >
              <Typography fontWeight={700} variant="subtitle2" color="error.main" mb={1}>
                Danger Zone
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block" mb={2}>
                Deleting this trip is permanent and will remove all associated events, expenses, and chats.
              </Typography>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<DeleteOutlineIcon />}
                sx={{
                  borderRadius: 3,
                  textTransform: "none",
                  fontWeight: 700,
                  background: '#b900002e',
                  color: mode === "dark" ? "#ffabab" : "#ae3636" ,
                  py: 1,
                  boxShadow: 'none',
                  borderWidth: "0",
                  "&:hover": {
                    background: '#b900004d',
                  },
                }}
                onClick={() => {
                  setSettingsDrawerOpen(false);
                  setConfirmDeleteOpen(true);
                }}
              >
                Delete Trip
              </Button>
            </Box>
          )}
        </Stack>
      </Box>
    </SwipeableDrawer>
  );
};

/* ---------------- Helper Components ---------------- */


const InfoRow = ({ label, value }) => (
  <Box
    sx={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      gap: 2,
      py: 0.5,
      borderBottom: "1px dashed",
      borderColor: "divider",
      "&:last-child": {
        borderBottom: "none",
      },
    }}
  >
    <Typography variant="caption" color="text.secondary" fontWeight={600}>
      {label}
    </Typography>
    <Typography variant="body2" fontWeight={600} noWrap sx={{ maxWidth: "60%" }}>
      {value || "—"}
    </Typography>
  </Box>
);

export default SettingsDrawer;