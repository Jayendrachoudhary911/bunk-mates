import React from "react";
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Chip,
  TextField,
  DialogActions,
  Card,
  Stack,
  Avatar,
  Button,
} from "@mui/material";
import { CloseOutlined } from "../../icons/LucideIcons";

const formFieldSx = {
  borderRadius: 3,
  backgroundColor: (theme) =>
    theme.palette.mode === "dark" ? "rgba(255,255,255,0.06)" : "#fafafa",
  "& .MuiOutlinedInput-root": {
    borderRadius: 3,
  },
};

export default function CreateTripDrawer({
  createDialogOpen,
  closeDrawer,
  step,
  newTrip,
  setNewTrip,
  handleNext,
  handleBack,
  selectedMembers,
  handleRemoveMember,
  handleContributionChange,
  totalContribution,
  handleCreateTrip,
  handleAddMember,
  randomNatureImage,
  friendCards,
  mode,
  theme,
}) {
  return (
    <Drawer
      anchor="bottom"
      open={createDialogOpen}
      onClose={closeDrawer}
      PaperProps={{
        sx: {
          height: "100vh",
          maxHeight: "100vh",
          overflow: "hidden",
          position: "relative",
          backdropFilter: "blur(22px) saturate(1.6)",
          WebkitBackdropFilter: "blur(22px) saturate(1.6)",
          background:
            mode === "dark"
              ? "linear-gradient(180deg, rgba(10,10,10,0.88), rgba(0,0,0,0.95))"
              : "linear-gradient(180deg, rgba(255,255,255,0.88), rgba(245,247,250,0.96))",
          color: mode === "dark" ? "#fff" : "#111",
          borderTop:
            mode === "dark"
              ? "1px solid rgba(255,255,255,0.08)"
              : "1px solid rgba(0,0,0,0.06)",
          boxShadow:
            mode === "dark"
              ? "0 -24px 80px rgba(0,0,0,0.85)"
              : "0 -24px 60px rgba(0,0,0,0.18)",
          transition: "all 420ms cubic-bezier(0.4, 0, 0.2, 1)",
        },
      }}
    >
      {/* ───── Content Wrapper ───── */}
      <Box
        sx={{
          px: { xs: 2.5, sm: 4 },
          pb: 4,
          pt: 4,
          height: "100%",
          overflowY: "auto",
          "&::-webkit-scrollbar": {
            width: 6,
          },
          "&::-webkit-scrollbar-thumb": {
            borderRadius: 6,
            backgroundColor:
              mode === "dark"
                ? "rgba(255,255,255,0.18)"
                : "rgba(0,0,0,0.18)",
          },
        }}
      >
        {/* Header */}
        <Box
          sx={{
            position: "relative",
            mb: 4,
            pb: 2,
            px: { xs: 0.5, sm: 1 },
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom:
              mode === "dark"
                ? "1px solid rgba(255,255,255,0.08)"
                : "1px solid rgba(0,0,0,0.06)",
          }}
        >
          <Box sx={{ display: "flex", flexDirection: "column" }}>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 900,
                letterSpacing: 0.3,
                lineHeight: 1.2,
              }}
            >
              Create a trip
            </Typography>

            <Typography
              variant="caption"
              sx={{
                mt: 0.5,
                color: "text.secondary",
                fontWeight: 500,
              }}
            >
              Plan routes, dates & invite members
            </Typography>
          </Box>

          <IconButton
            onClick={closeDrawer}
            aria-label="Close create trip"
            sx={{
              width: 40,
              height: 40,
              borderRadius: 8,
              background:
                mode === "dark"
                  ? "rgba(255,255,255,0.08)"
                  : "rgba(0,0,0,0.06)",
              backdropFilter: "blur(10px)",
              WebkitBackdropFilter: "blur(10px)",
              border:
                mode === "dark"
                  ? "1px solid rgba(255,255,255,0.12)"
                  : "1px solid rgba(0,0,0,0.08)",
              transition: "all 180ms cubic-bezier(0.4,0,0.2,1)",
              "&:hover": {
                background:
                  mode === "dark"
                    ? "rgba(255,255,255,0.14)"
                    : "rgba(0,0,0,0.1)",
                transform: "scale(1.05)",
              },
              "&:active": {
                transform: "scale(0.95)",
              },
            }}
          >
            <CloseOutlined fontSize="small" />
          </IconButton>
        </Box>

        {/* Stepper */}
        <Box sx={{ mb: 3 }}>
          <Stack
            direction="row"
            alignItems="center"
            spacing={1.5}
            sx={{
              px: 1,
            }}
          >
            <Chip
              label="Trip Details"
              size="small"
              sx={{
                px: 1.5,
                height: 32,
                fontWeight: 700,
                letterSpacing: 0.2,
                background:
                  step === 0
                    ? "linear-gradient(135deg, #ffffff, #f1f1f1)"
                    : mode === "dark"
                    ? "rgba(255,255,255,0.08)"
                    : "rgba(0,0,0,0.06)",
                color:
                  step === 0
                    ? "#000"
                    : mode === "dark"
                    ? "rgba(255,255,255,0.7)"
                    : "rgba(0,0,0,0.7)",
                border:
                  step === 0
                    ? "none"
                    : mode === "dark"
                    ? "1px solid rgba(255,255,255,0.15)"
                    : "1px solid rgba(0,0,0,0.15)",
                transition: "all 220ms cubic-bezier(0.4,0,0.2,1)",
              }}
            />

            <Box
              sx={{
                flex: 1,
                height: 2,
                borderRadius: 2,
                background:
                  step >= 1
                    ? "linear-gradient(90deg, #ffffff, #f1f1f1)"
                    : mode === "dark"
                    ? "rgba(255,255,255,0.12)"
                    : "rgba(0,0,0,0.12)",
                transition: "background 300ms ease",
              }}
            />

            <Chip
              label="Add Members"
              size="small"
              sx={{
                px: 1.5,
                height: 32,
                fontWeight: 700,
                letterSpacing: 0.2,
                background:
                  step === 1
                    ? "linear-gradient(135deg, #ffffff, #f1f1f1)"
                    : mode === "dark"
                    ? "rgba(255,255,255,0.08)"
                    : "rgba(0,0,0,0.06)",
                color:
                  step === 1
                    ? "#000"
                    : mode === "dark"
                    ? "rgba(255,255,255,0.7)"
                    : "rgba(0,0,0,0.7)",
                border:
                  step === 1
                    ? "none"
                    : mode === "dark"
                    ? "1px solid rgba(255,255,255,0.15)"
                    : "1px solid rgba(0,0,0,0.15)",
                transition: "all 220ms cubic-bezier(0.4,0,0.2,1)",
              }}
            />
          </Stack>
        </Box>

        {/* Step 0: Details */}
        {step === 0 && (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 2.5,
              animation: "fadeUp 0.35s ease",
            }}
          >
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                mb: 1.5,
              }}
            >
              <Box
                sx={{
                  position: "relative",
                  p: 0,
                  borderRadius: 5,
                  background: "transparent",
                }}
              >
                <Avatar
                  src={newTrip.iconDataUri || randomNatureImage}
                  sx={{
                    width: 210,
                    height: 210,
                    borderRadius: 4,
                    boxShadow:
                      mode === "dark"
                        ? "0 20px 40px rgba(0,0,0,0.6)"
                        : "0 16px 36px rgba(0,0,0,0.18)",
                  }}
                />
              </Box>
            </Box>

            <TextField
              label="Trip Name"
              placeholder="e.g. Weekend in Manali"
              fullWidth
              value={newTrip.name}
              onChange={(e) =>
                setNewTrip((prev) => ({ ...prev, name: e.target.value }))
              }
              sx={formFieldSx}
            />

            <Box sx={{ display: "flex", gap: 1.5 }}>
              <TextField
                label="From"
                placeholder="Start location"
                fullWidth
                value={newTrip.from}
                onChange={(e) =>
                  setNewTrip((prev) => ({ ...prev, from: e.target.value }))
                }
                sx={formFieldSx}
              />
              <TextField
                label="To"
                placeholder="Destination"
                fullWidth
                value={newTrip.to}
                onChange={(e) =>
                  setNewTrip((prev) => ({ ...prev, to: e.target.value }))
                }
                sx={formFieldSx}
              />
            </Box>

            <TextField
              label="Route / Location"
              placeholder="Optional route or description"
              fullWidth
              value={newTrip.location}
              onChange={(e) =>
                setNewTrip((prev) => ({ ...prev, location: e.target.value }))
              }
              sx={formFieldSx}
            />

            <Box sx={{ display: "flex", gap: 1.5 }}>
              <TextField
                label="Start Date"
                type="date"
                InputLabelProps={{ shrink: true }}
                fullWidth
                value={newTrip.startDate}
                onChange={(e) =>
                  setNewTrip((prev) => ({ ...prev, startDate: e.target.value }))
                }
                sx={formFieldSx}
              />
              <TextField
                label="End Date"
                type="date"
                InputLabelProps={{ shrink: true }}
                fullWidth
                value={newTrip.endDate}
                onChange={(e) =>
                  setNewTrip((prev) => ({ ...prev, endDate: e.target.value }))
                }
                sx={formFieldSx}
              />
            </Box>

            <DialogActions sx={{ mt: 2, px: 0, gap: 1.5 }}>
              <Button
                fullWidth
                onClick={closeDrawer}
                sx={{
                  height: 46,
                  textTransform: "none",
                  fontWeight: 600,
                  borderRadius: 8,
                  background:
                    mode === "dark"
                      ? "rgba(255,255,255,0.06)"
                      : "rgba(0,0,0,0.05)",
                  color: "text.primary",
                  "&:hover": {
                    background:
                      mode === "dark"
                        ? "rgba(255,255,255,0.12)"
                        : "rgba(0,0,0,0.1)",
                  },
                }}
              >
                Cancel
              </Button>

              <Button
                variant="contained"
                fullWidth
                onClick={handleNext}
                sx={{
                  height: 46,
                  textTransform: "none",
                  backgroundColor: mode === "dark" ? "#ffffff" : "#000000",
                  color: mode === "dark" ? "#000000" : "#ffffff",
                  fontWeight: 700,
                  borderRadius: 8,
                }}
              >
                Next
              </Button>
            </DialogActions>
          </Box>
        )}

        {/* Step 1: Members + budget */}
        {step === 1 && (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 3,
              animation: "fadeUp 0.35s ease",
            }}
          >
            {friendCards.length > 0 && (
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 1 }}>
                  Your Friends
                </Typography>

                <Stack
                  direction="row"
                  spacing={2}
                  sx={{
                    overflowX: "auto",
                    pb: 1,
                    "&::-webkit-scrollbar": { height: 6 },
                    "&::-webkit-scrollbar-thumb": {
                      backgroundColor:
                        theme.palette.mode === "dark"
                          ? "rgba(255,255,255,0.25)"
                          : "rgba(0,0,0,0.25)",
                      borderRadius: 3,
                    },
                  }}
                >
                  {friendCards.map((friend) => (
                    <Card
                      key={friend.uid}
                      sx={{
                        minWidth: 140,
                        p: 2,
                        borderRadius: 4,
                        flexShrink: 0,
                        boxShadow: "none",
                        background:
                          mode === "dark"
                            ? "linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03))"
                            : "linear-gradient(180deg, #ffffff, #f4f6f8)",
                        border:
                          mode === "dark"
                            ? "1px solid rgba(255,255,255,0.12)"
                            : "1px solid rgba(0,0,0,0.08)",
                        transition: "transform 180ms ease, box-shadow 180ms ease",
                        "&:hover": {
                          transform: "translateY(-4px)",
                        },
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          textAlign: "center",
                        }}
                      >
                        <Avatar
                          src={friend.photoURL}
                          sx={{ width: 56, height: 56, mb: 1 }}
                        />

                        <Typography
                          sx={{ fontWeight: 700, lineHeight: 1.2 }}
                          noWrap
                        >
                          {friend.name || friend.username}
                        </Typography>

                        <Typography
                          variant="caption"
                          sx={{ color: "text.secondary" }}
                          noWrap
                        >
                          @{friend.username}
                        </Typography>

                        <Button
                          size="small"
                          onClick={() => handleAddMember(friend)}
                          sx={{
                            mt: 1.2,
                            px: 2,
                            borderRadius: 999,
                            fontWeight: 700,
                            textTransform: "none",
                            boxShadow: "none",
                            background: mode === "dark" ? "#ffffff" : "#000000",
                            color: mode === "dark" ? "#000000" : "#ffffff",
                            "&:hover": {
                              opacity: 0.85,
                            },
                          }}
                        >
                          Add
                        </Button>
                      </Box>
                    </Card>
                  ))}
                </Stack>
              </Box>
            )}

            {selectedMembers.length > 0 && (
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                  Added Members
                </Typography>

                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                  {selectedMembers.map((user) => (
                    <Chip
                      key={user.uid}
                      avatar={<Avatar src={user.photoURL} />}
                      label={user.name || user.username}
                      onDelete={() => handleRemoveMember(user.uid)}
                      sx={{
                        px: 0.5,
                        fontWeight: 600,
                        borderRadius: 2,
                        background:
                          mode === "dark"
                            ? "rgba(255,255,255,0.08)"
                            : "rgba(0,0,0,0.06)",
                      }}
                    />
                  ))}
                </Box>
              </Box>
            )}

            {selectedMembers.length > 0 && (
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                  Contributions
                </Typography>

                <Stack spacing={1.5}>
                  {selectedMembers.map((user, idx) => (
                    <Box
                      key={user.uid}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1.5,
                        p: 1.5,
                        borderRadius: 3,
                        background:
                          mode === "dark"
                            ? "rgba(255,255,255,0.06)"
                            : "rgba(0,0,0,0.04)",
                        border:
                          mode === "dark"
                            ? "1px solid rgba(255,255,255,0.08)"
                            : "1px solid rgba(0,0,0,0.08)",
                      }}
                    >
                      <Avatar src={user.photoURL} />

                      <Box sx={{ flexGrow: 1 }}>
                        <Typography fontWeight={600}>
                          {user.name || user.username}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          @{user.username}
                        </Typography>
                      </Box>

                      <TextField
                        label="₹ Amount"
                        type="number"
                        size="small"
                        value={user.contribution || ""}
                        onChange={(e) =>
                          handleContributionChange(idx, e.target.value)
                        }
                        sx={{
                          width: 120,
                          "& .MuiOutlinedInput-root": {
                            borderRadius: 2,
                          },
                        }}
                      />
                    </Box>
                  ))}
                </Stack>
              </Box>
            )}

            <Box
              sx={{
                mt: 2,
                p: 2,
                borderRadius: 4,
                textAlign: "center",
                background:
                  mode === "dark"
                    ? "linear-gradient(135deg, rgba(16,185,129,0.2), rgba(16,185,129,0.08))"
                    : "linear-gradient(135deg, rgba(16,185,129,0.18), rgba(16,185,129,0.08))",
              }}
            >
              <Typography variant="caption" sx={{ opacity: 0.8 }}>
                Total Budget
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 900 }}>
                ₹ {totalContribution}
              </Typography>
            </Box>

            <DialogActions sx={{ mt: 2, px: 0, gap: 1.5 }}>
              <Button
                fullWidth
                onClick={handleBack}
                sx={{
                  height: 46,
                  borderRadius: 8,
                  fontWeight: 600,
                  textTransform: "none",
                  color: "text.primary",
                  background:
                    mode === "dark"
                      ? "rgba(255,255,255,0.06)"
                      : "rgba(0,0,0,0.06)",
                }}
              >
                Back
              </Button>

              <Button
                variant="contained"
                fullWidth
                onClick={handleCreateTrip}
                sx={{
                  height: 46,
                  borderRadius: 8,
                  fontWeight: 700,
                  textTransform: "none",
                  color: mode === "dark" ? "#000000" : "#ffffff",
                  backgroundColor: mode === "dark" ? "#ffffff" : "#000000",
                }}
              >
                Create Trip
              </Button>
            </DialogActions>
          </Box>
        )}
      </Box>

      <style>
        {`
          @keyframes fadeUp {
            from {
              opacity: 0;
              transform: translateY(8px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}
      </style>
    </Drawer>
  );
}
