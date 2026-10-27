// src/components/chats_components/SelectTripDialog.jsx
import React from "react";
import {
  SwipeableDrawer,
  Box,
  Typography,
  Button,
  Avatar,
  IconButton,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import LuggageOutlinedIcon from "@mui/icons-material/LuggageOutlined";
import GroupOutlinedIcon from "@mui/icons-material/GroupOutlined";
import PlaceOutlinedIcon from "@mui/icons-material/PlaceOutlined";
import { safeImageUrl } from "../../utils/uiHelpers";
import {
  drawerPaperSx,
  drawerBackdropSx,
  DrawerHandle,
} from "../../theme/designSystem";

const SelectTripDialog = ({
  open,
  onClose,
  trips = [],
  actionType = "budget", // "budget" | "expenses"
  onSelectTrip,
  isDark = true,
}) => {
  const mode = isDark ? "dark" : "light";

  return (
    <SwipeableDrawer
      anchor="bottom"
      open={open}
      onClose={onClose}
      onOpen={() => {}}
      disableSwipeToOpen={false}
      ModalProps={{
        BackdropProps: {
          sx: drawerBackdropSx,
        },
      }}
      PaperProps={{
        sx: {
          ...drawerPaperSx(mode, {
            maxHeight: "85vh",
          }),
          overflowY: "auto",
        },
      }}
    >
      <Box sx={{ display: { xs: "block", md: "none" } }}>
        <DrawerHandle mode={mode} />
      </Box>

      <Box sx={{ maxWidth: 500, mx: "auto", width: "100%", boxSizing: "border-box", pt: { xs: 1, md: 2 } }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            pb: 1.5,
          }}
        >
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, fontSize: "1.05rem" }}>
              Select Common Trip
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: isDark ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.6)",
                fontSize: "0.74rem",
                display: "block",
              }}
            >
              Choose a shared trip to send {actionType === "expenses" ? "detailed expenses" : "quick budget"}
            </Typography>
          </Box>
          <IconButton size="small" onClick={onClose} sx={{ color: "inherit", opacity: 0.7 }}>
            <CloseIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Box>

        <Box sx={{ py: 1, display: "flex", flexDirection: "column", gap: 1 }}>
          {trips.length === 0 ? (
            <Box
              sx={{
                p: 3,
                borderRadius: "14px",
                bgcolor: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
                textAlign: "center",
              }}
            >
              <LuggageOutlinedIcon sx={{ fontSize: 36, opacity: 0.4, mb: 1 }} />
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                No Shared Trips Found
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.6 }}>
                Both users need to be members in the same trip to share budgets or expenses.
              </Typography>
            </Box>
          ) : (
            <Box
              sx={{
                maxHeight: 340,
                overflowY: "auto",
                display: "flex",
                flexDirection: "column",
                gap: 1,
                pr: 0.5,
              }}
            >
              {trips.map((trip) => {
                const tripPhoto = safeImageUrl(trip.photoURL || trip.coverImage);
                const memberCount = Array.isArray(trip.members) ? trip.members.length : 1;
                return (
                  <Box
                    key={trip.id}
                    onClick={() => {
                      onSelectTrip(trip);
                      onClose();
                    }}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1.4,
                      p: 1.2,
                      borderRadius: "14px",
                      bgcolor: isDark
                        ? "rgba(255, 255, 255, 0.05)"
                        : "rgba(0, 0, 0, 0.03)",
                      border: `1px solid ${
                        isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.06)"
                      }`,
                      cursor: "pointer",
                      transition: "all 0.18s ease",
                      "&:hover": {
                        bgcolor: isDark
                          ? "rgba(0, 183, 255, 0.12)"
                          : "rgba(0, 183, 255, 0.08)",
                        borderColor: "rgba(0, 183, 255, 0.35)",
                        transform: "translateX(2px)",
                      },
                    }}
                  >
                    <Avatar
                      src={tripPhoto}
                      variant="rounded"
                      sx={{ width: 44, height: 44, borderRadius: "10px" }}
                    >
                      <LuggageOutlinedIcon />
                    </Avatar>

                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography
                        variant="subtitle2"
                        sx={{ fontWeight: 700, fontSize: "0.88rem" }}
                        noWrap
                      >
                        {trip.name || trip.title || "Trip"}
                      </Typography>

                      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.3 }}>
                        {trip.location && (
                          <Box sx={{ display: "flex", alignItems: "center", gap: 0.3 }}>
                            <PlaceOutlinedIcon sx={{ fontSize: 13, opacity: 0.6 }} />
                            <Typography variant="caption" sx={{ opacity: 0.7, fontSize: "0.7rem" }} noWrap>
                              {trip.location}
                            </Typography>
                          </Box>
                        )}
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.3 }}>
                          <GroupOutlinedIcon sx={{ fontSize: 13, opacity: 0.6 }} />
                          <Typography variant="caption" sx={{ opacity: 0.7, fontSize: "0.7rem" }}>
                            {memberCount} {memberCount === 1 ? "member" : "members"}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  </Box>
                );
              })}
            </Box>
          )}
        </Box>

        <Box sx={{ display: "flex", justifyContent: "flex-end", pt: 1.5, pb: 1 }}>
          <Button onClick={onClose} sx={{ textTransform: "none", color: "inherit", opacity: 0.7 }}>
            Cancel
          </Button>
        </Box>
      </Box>
    </SwipeableDrawer>
  );
};

export default React.memo(SelectTripDialog);
