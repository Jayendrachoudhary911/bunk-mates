import React from "react";
import {
  Box,
  Typography,
  Button,
  SwipeableDrawer,
  IconButton,
  Divider,
  Stack,
  Chip,
  ToggleButton,
  ToggleButtonGroup,
  Slider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";

import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import ShieldOutlinedIcon from "@mui/icons-material/ShieldOutlined";
import PaletteOutlinedIcon from "@mui/icons-material/PaletteOutlined";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";

/* ---------------- Utils ---------------- */

const glassCard = (mode) => ({
  borderRadius: 4,
  p: 2.5,
  background:
    mode === "dark"
      ? "linear-gradient(145deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))"
      : "linear-gradient(145deg, #ffffff, #f5f5f5)",
  backdropFilter: "blur(18px)",
  border:
    mode === "dark"
      ? "1px solid rgba(255,255,255,0.08)"
      : "1px solid rgba(0,0,0,0.06)",
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

  return (
    <SwipeableDrawer
      anchor="bottom"
      open={settingsDrawerOpen}
      onClose={() => setSettingsDrawerOpen(false)}
      PaperProps={{
        sx: {
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
          background:
            mode === "dark"
              ? "linear-gradient(180deg, #0f0f0f, #000)"
              : "linear-gradient(180deg, #fff, #f7f7f7)",
          boxShadow: "none",
          maxHeight: "85vh",
        },
      }}
      ModalProps={{
        BackdropProps: {
          sx: {
            backdropFilter: "blur(10px)",
            backgroundColor: "rgba(0,0,0,0.15)",
          },
        },
      }}
    >
      {/* Drag Handle */}
      <Box
        sx={{
          width: 42,
          height: 5,
          borderRadius: 3,
          bgcolor: "text.disabled",
          mx: "auto",
          mt: 1.5,
          mb: 2,
        }}
      />

      {/* Header */}
      <Box
        sx={{
          px: 3,
          pb: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Typography variant="h6" fontWeight={700}>
          {isAdmin ? "Trip Settings" : "Trip Info"}
        </Typography>
        <IconButton onClick={() => setSettingsDrawerOpen(false)}>
          <CloseOutlinedIcon />
        </IconButton>
      </Box>

      <Stack spacing={3} px={3} pb={4}>
        {/* ---------------- Trip Info ---------------- */}
        <Box sx={glassCard(mode)}>
          <Stack direction="row" alignItems="center" spacing={1} mb={1.5}>
            <InfoOutlinedIcon fontSize="small" />
            <Typography fontWeight={600}>Trip Info</Typography>
          </Stack>

          <Stack spacing={1}>
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
            <Stack direction="row" alignItems="center" spacing={1} mb={2}>
              <ShieldOutlinedIcon fontSize="small" />
              <Typography fontWeight={600}>Permissions</Typography>
            </Stack>

            <Stack spacing={2}>
              {Object.keys(tripPermissions).map((perm) => (
                <Box key={perm}>
                  <Typography variant="caption" color="text.secondary">
                    {perm
                      .replace("canAdd", "Who can add ")
                      .replace("canEdit", "Who can edit ")}
                  </Typography>

                  <Stack direction="row" spacing={1} mt={1}>
                    <Button
                      size="small"
                      variant={
                        tripPermissions[perm] === "all"
                          ? "contained"
                          : "outlined"
                      }
                      onClick={() =>
                        updatePermissions({
                          ...tripPermissions,
                          [perm]: "all",
                        })
                      }
                    >
                      Everyone
                    </Button>
                    <Button
                      size="small"
                      variant={
                        tripPermissions[perm] === "admins"
                          ? "contained"
                          : "outlined"
                      }
                      onClick={() =>
                        updatePermissions({
                          ...tripPermissions,
                          [perm]: "admins",
                        })
                      }
                    >
                      Admins
                    </Button>
                  </Stack>
                </Box>
              ))}
            </Stack>
          </Box>
        )}

        {/* ---------------- Admins ---------------- */}
        {isAdmin && (
          <Box sx={glassCard(mode)}>
            <Typography fontWeight={600} mb={1.5}>
              Manage Admins
            </Typography>

            <Stack spacing={1}>
              {memberDetails.map((user) => {
                const isTripAdmin = tripAdmins.includes(user.uid);
                return (
                  <Stack
                    key={user.uid}
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                  >
                    <Typography variant="body2">
                      {getMemberName(user.uid)}
                    </Typography>

                    {isTripAdmin ? (
                      user.uid !== trip?.createdBy && (
                        <Button
                          size="small"
                          color="warning"
                          onClick={() => demoteAdmin(user.uid)}
                        >
                          Demote
                        </Button>
                      )
                    ) : (
                      <Button
                        size="small"
                        onClick={() => promoteToAdmin(user.uid)}
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

                {isAdmin && (
          <Box sx={{ ...glassCard(mode), pt: 2 }}>
            <Stack direction="row" alignItems="center" spacing={1} mb={1.5}>
              <InfoOutlinedIcon fontSize="small" />
              <Typography fontWeight={600}>Display</Typography>
            </Stack>

            <Typography variant="caption">Layout</Typography>
            <Box mt={1} mb={2}>
              <ToggleButtonGroup
                value={displaySettings.layout}
                exclusive
                onChange={(_, v) => v && updateDisplaySettings({ layout: v })}
                size="small"
              >
                <ToggleButton value="grid">Grid</ToggleButton>
                <ToggleButton value="list">List</ToggleButton>
              </ToggleButtonGroup>
            </Box>

            <Typography variant="caption">Grid columns (items per row)</Typography>
            <Box mt={1} mb={2} px={1}>
              <Slider
                value={displaySettings.gridCols}
                min={1}
                max={6}
                step={1}
                valueLabelDisplay="auto"
                onChange={(_, v) => updateDisplaySettings({ gridCols: v })}
              />
            </Box>

            <Typography variant="caption">List columns</Typography>
            <Box mt={1} mb={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Columns</InputLabel>
                <Select
                  value={displaySettings.listCols}
                  label="Columns"
                  onChange={(e) => updateDisplaySettings({ listCols: Number(e.target.value) })}
                >
                  {[1,2,3].map((n) => <MenuItem value={n} key={n}>{n}</MenuItem>)}
                </Select>
              </FormControl>
            </Box>

            <Typography variant="caption">Card Type</Typography>
            <Box mt={1} mb={1}>
              <ToggleButtonGroup
                value={displaySettings.cardType}
                exclusive
                onChange={(_, v) => v && updateDisplaySettings({ cardType: v })}
                size="small"
              >
                <ToggleButton value="regular">Regular</ToggleButton>
                <ToggleButton value="detailed">Detailed</ToggleButton>
              </ToggleButtonGroup>
            </Box>
            <Typography variant="caption" color="text.secondary">
              Changes saved to trip settings and reflected in the UI.
            </Typography>
          </Box>
        )}

        {/* ---------------- Danger Zone ---------------- */}
        {isAdmin && (
          <Box
            sx={{
              ...glassCard(mode),
              border: "1px solid rgba(255,0,0,0.25)",
            }}
          >
            <Typography fontWeight={600} color="error" mb={1}>
              Danger Zone
            </Typography>
            <Button
              fullWidth
              variant="outlined"
              color="error"
              startIcon={<DeleteOutlineIcon />}
              sx={{ borderRadius: 3 }}
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
    </SwipeableDrawer>
  );
};

/* ---------------- Small Info Row ---------------- */

const InfoRow = ({ label, value }) => (
  <Box
    sx={{
      display: "flex",
      justifyContent: "space-between",
      gap: 2,
    }}
  >
    <Typography variant="caption" color="text.secondary">
      {label}
    </Typography>
    <Typography variant="body2" fontWeight={500}>
      {value || "—"}
    </Typography>
  </Box>
);

export default SettingsDrawer;
