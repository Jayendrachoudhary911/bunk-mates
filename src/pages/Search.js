import React, { useState, useMemo } from "react";
import {
  Box,
  TextField,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemAvatar,
  Avatar,
  ListItemText,
  Divider,
  Typography,
  CircularProgress,
  InputAdornment,
  Paper,
  SwipeableDrawer,
  Button,
  Stack,
  Chip,
  useTheme,
  alpha,
  // Hidden is REMOVED
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import MessageIcon from "@mui/icons-material/Chat";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import PlaceIcon from "@mui/icons-material/Place";
import useUniversalSearch from "../hooks/useUniversalSearch";
import { useNavigate } from "react-router-dom";

import { useThemeToggle } from "../contexts/ThemeToggleContext";
import { getTheme } from "../theme";

export default function SearchPage() {
  const { mode, accent } = useThemeToggle();
  const theme = getTheme(mode, accent);
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [tab, setTab] = useState("all");
  
  // Unified state for selected item and drawer content type
  const [selectedItem, setSelectedItem] = useState(null);
  const [drawerContentType, setDrawerContentType] = useState(null); // 'user' or 'place'
  const [drawerOpen, setDrawerOpen] = useState(false);

  const { results, loading } = useUniversalSearch(q, { maxPerCollection: 200 });

  const groups = useMemo(() => {
    return [
      { key: "users", label: "Users", items: results.users },
      { key: "friends", label: "Friends", items: results.friends },
      { key: "notes", label: "Notes", items: results.notes },
      { key: "reminders", label: "Reminders", items: results.reminders },
      { key: "trips", label: "Trips", items: results.trips },
      { key: "places", label: "Places", items: results.places },
    ];
  }, [results]);

  const filteredGroups =
    tab === "all" ? groups : groups.filter((g) => g.key === tab);

  const closeDrawer = () => {
    setDrawerOpen(false);
    // Debounce clearing to allow the drawer animation to complete smoothly
    setTimeout(() => {
      setSelectedItem(null);
      setDrawerContentType(null);
    }, 300);
  };
    
  const handleItemClick = (type, item) => {
    setSelectedItem(item);
    if (type === "users" || type === "friends") {
      setDrawerContentType("user");
      setDrawerOpen(true);
    } else if (type === "places") {
      setDrawerContentType("place");
      setDrawerOpen(true);
    } else if (type === "notes") {
      navigate(`/notes`, { state: { openNoteId: item.id } });
    } else if (type === "reminders") {
      navigate(`/reminders`, { state: { openReminderId: item.id } });
    } else if (type === "trips") {
      navigate(`/trips/${item.id}`);
    }
  };

  const selectedUser = drawerContentType === "user" ? selectedItem : null;
  const selectedPlace = drawerContentType === "place" ? selectedItem : null;
  
  const UserDrawerContent = ({ user }) => (
      <Box>
          {/* Profile Header */}
          <Stack alignItems="center" spacing={1.5} sx={{ mb: 2 }}>
            <Avatar
              src={user.photoURL}
              sx={{
                width: 90,
                height: 90,
                mb: 1,
                boxShadow: `0 0 10px ${
                  theme.palette.mode === "dark" ? "#ff5757" : "#ff8c00"
                }30`,
              }}
            >
              {user.name?.[0]}
            </Avatar>
            <Typography variant="h6" fontWeight={600}>
              {user.name || "Unnamed User"}
            </Typography>
            {user.username && (
              <Typography variant="body2" color="text.secondary">
                @{user.username}
              </Typography>
            )}
          </Stack>

          {user.bio && (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ textAlign: "center", mb: 3 }}
            >
              {user.bio}
            </Typography>
          )}

          {/* Mutual Sections */}
          <Box sx={{ mb: 2 }}>
            {user.mutualFriends?.length > 0 && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Mutual Friends
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  {user.mutualFriends.slice(0, 5).map((f) => (
                    <Chip
                      key={f.uid}
                      avatar={<Avatar src={f.photoURL}>{f.name[0]}</Avatar>}
                      label={f.name}
                      size="small"
                    />
                  ))}
                </Stack>
              </Box>
            )}

            {user.mutualTrips?.length > 0 && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Shared Trips
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  {user.mutualTrips.slice(0, 4).map((t) => (
                    <Chip key={t.id} label={t.name} size="small" />
                  ))}
                </Stack>
              </Box>
            )}

            {user.sharedBudgets?.length > 0 && (
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Shared Budgets
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  {user.sharedBudgets.slice(0, 3).map((b) => (
                    <Chip key={b.id} label={b.name} size="small" />
                  ))}
                </Stack>
              </Box>
            )}
          </Box>

          {/* Action Buttons */}
          <Stack direction="row" spacing={2} justifyContent="center">
            {user.isFriend ? (
              <Button
                variant="contained"
                startIcon={<MessageIcon />}
                onClick={() => navigate(`/chats/${user.uid}`)}
              >
                Message
              </Button>
            ) : (
              <Button
                variant="outlined"
                startIcon={<PersonAddIcon />}
                onClick={() => console.log("Add friend logic")}
              >
                Add Friend
              </Button>
            )}
          </Stack>
        </Box>
  );

  // New component for Place Details Drawer
const PlaceDrawerContent = ({ place, closeDrawer, navigate }) => {
    const theme = useTheme();

return (
  <Box sx={{ px: 3, pb: 3 }}>
    {/* Header */}
    <Stack alignItems="center" spacing={2} sx={{ mb: 3 }}>
      <Avatar
        variant="rounded"
        src={place.images?.[0] || ""}
        sx={{
          width: 120,
          height: 120,
          mb: 1,
          bgcolor: theme.palette.primary.main,
          boxShadow: `0 0 20px ${alpha(theme.palette.primary.main, 0.4)}`,
        }}
      >
        <PlaceIcon fontSize="large" />
      </Avatar>
      <Typography variant="h5" fontWeight={700} align="center">
        {place.name || "Place Details"}
      </Typography>
      <Stack direction="row" spacing={1} flexWrap="wrap" justifyContent="center">
        <Chip
          label={place.type || "Attraction"}
          size="small"
          color="primary"
          variant="outlined"
        />
        <Chip
          label={place.location || place.city || "Unknown Location"}
          size="small"
          variant="outlined"
        />
      </Stack>
    </Stack>

    <Divider sx={{ mb: 3 }} />

    {/* Overview */}
    <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>
      Overview
    </Typography>
    <Typography
      variant="body2"
      color="text.secondary"
      sx={{ mb: 3, whiteSpace: "pre-wrap", lineHeight: 1.6 }}
    >
      {place.description || "No detailed description is available for this place."}
    </Typography>

    {/* Best Time to Visit */}
    <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>
      Best Time to Visit
    </Typography>
    <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 3 }}>
      <Chip label={`Season: ${place.season || "N/A"}`} size="small" color="info" />
      <Chip label={`Weather: ${place.weather || "N/A"}`} size="small" color="info" />
      <Chip label={`Time: ${place.bestTimeToVisit || "N/A"}`} size="small" color="info" />
    </Stack>

    {/* Nearest Attractions */}
    {place.nearestAttractions?.length > 0 && (
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
          Nearest Attractions
        </Typography>
        <Stack direction="row" spacing={1} flexWrap="wrap">
          {place.nearestAttractions.slice(0, 5).map((a, index) => (
            <Chip
              key={index}
              label={a.name}
              size="small"
              variant="outlined"
              sx={{
                bgcolor: alpha(theme.palette.primary.light, 0.1),
                "&:hover": {
                  bgcolor: alpha(theme.palette.primary.light, 0.2),
                  cursor: "pointer",
                },
              }}
            />
          ))}
        </Stack>
      </Box>
    )}

    {/* Action Buttons */}
    <Stack direction={{ xs: "column", sm: "row" }} spacing={2} justifyContent="center" sx={{ pt: 1 }}>
      <Button
        variant="contained"
        color="primary"
        sx={{ px: 4 }}
        onClick={() => {
          closeDrawer();
          navigate(`/trips`, { state: { place } });
        }}
      >
        Plan Trip Here
      </Button>
      <Button variant="outlined" color="secondary" sx={{ px: 4 }} onClick={closeDrawer}>
        Close
      </Button>
    </Stack>
  </Box>
  )
};


  return (
    <Box sx={{ p: 3, maxWidth: 900, mx: "auto" }}>
      {/* Search Input */}
      <Box sx={{ display: "flex", alignItems: "center", mb: 2, position: "relative" }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search users, friends, notes, reminders, trips, places..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          InputProps={{
            autoFocus: true,
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
          }}
          sx={{
            backgroundColor:
              theme.palette.mode === "dark"
                ? alpha("#fff", 0.05)
                : alpha("#000", 0.03),
            borderRadius: 3,
            "& .MuiOutlinedInput-notchedOutline": { border: "none" },
            "&:hover": {
              backgroundColor:
                theme.palette.mode === "dark"
                  ? alpha("#fff", 0.08)
                  : alpha("#000", 0.05),
            },
          }}
        />
        {loading && <CircularProgress size={28} sx={{ position: "absolute", right: 10 }} />}
      </Box>

      {/* Tabs */}
      <Tabs
        value={tab}
        onChange={(e, val) => setTab(val)}
        variant="scrollable"
        scrollButtons="auto"
        sx={{
          mb: 3,
          borderBottom: `1px solid ${theme.palette.divider}`,
          "& .MuiTab-root": { textTransform: "none", fontWeight: 500 },
        }}
      >
        <Tab label="All" value="all" />
        <Tab label="Users" value="users" />
        <Tab label="Friends" value="friends" />
        <Tab label="Notes" value="notes" />
        <Tab label="Reminders" value="reminders" />
        <Tab label="Trips" value="trips" />
        <Tab label="Places" value="places" />
      </Tabs>

      {/* Results */}
      {!q ? (
        <Typography color="text.secondary" align="center">
          Type to search across users, friends, notes, reminders, trips and
          places.
        </Typography>
      ) : (
        filteredGroups.map((group) => {
          // Conditional check to replace the use of the deprecated <Hidden> component
          if (group.items.length === 0 && tab === 'all') return null;
          
          return (
            <Box key={group.key} sx={{ mb: 4 }}>
              {/* This replaces the <Hidden> usage */}
              {group.items.length > 0 && (
                <Typography variant="h6" fontWeight={600} sx={{ mb: 1, textTransform: 'capitalize', color: mode === "dark" ? "#fff" : "#000" }}>
                  {group.label} ({group.items.length})
                </Typography>
              )}
              <List>
                {group.items.slice(0, 50).map((item) => (
                  <Paper
                    key={item.id || item.uid}
                    elevation={1}
                    sx={{
                      mb: 1,
                      borderRadius: 2,
                      overflow: "hidden",
                      transition: "all 0.2s ease",
                      "&:hover": {
                        transform: "translateY(-2px)",
                        boxShadow: theme.shadows[4],
                        cursor: "pointer",
                      },
                    }}
                    onClick={() => handleItemClick(group.key, item)}
                  >
                    <ListItem>
                      <ListItemAvatar>
                        <Avatar
                          // Use first image for places, or existing logic for others
                          src={item.images?.[0] || item.photoURL || item.iconURL || item.icon || ""}
                          sx={{
                            bgcolor:
                              theme.palette.mode === "dark"
                                ? alpha("#fff", 0.08)
                                : alpha("#000", 0.06),
                          }}
                        >
                          {item.name
                            ? item.name[0]
                            : item.title
                            ? item.title[0]
                            : group.key === 'places' ? <PlaceIcon fontSize="small" /> : "?"}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          item.name ||
                          item.title ||
                          item.placeName ||
                          item.text ||
                          item.location ||
                          item.noteTitle ||
                          "Untitled"
                        }
                        secondary={
                          <>
                            {group.key === 'places' && <span>{item.city}, {item.state} ({item.type}) · </span>}
                            {item.username && <span>@{item.username} · </span>}
                            {item.description && (
                              <span>{item.description.slice(0, 80)}...</span>
                            )}
                            {!item.description && item.content && (
                              <span>{String(item.content).slice(0, 80)}...</span>
                            )}
                          </>
                        }
                      />
                    </ListItem>
                  </Paper>
                ))}
              </List>
            </Box>
          );
        })
      )}

      {/* Universal Drawer - Now handles User/Friend and Place */}
      <SwipeableDrawer
        anchor="bottom"
        open={drawerOpen}
        onClose={closeDrawer}
        onOpen={() => {}}
        PaperProps={{
          sx: {
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            p: 3,
            maxWidth: 600, // Limit width for better mobile experience
            mx: 'auto',
            maxHeight: "90vh",
            backdropFilter: "blur(10px)",
            backgroundColor:
              theme.palette.mode === "dark"
                ? alpha(theme.palette.background.paper, 0.9)
                : alpha("#fafafa", 0.85),
          },
        }}
      >
        {selectedUser && drawerContentType === 'user' && <UserDrawerContent user={selectedUser} />}
        {selectedPlace && drawerContentType === 'place' && <PlaceDrawerContent place={selectedPlace} />}
      </SwipeableDrawer>
    </Box>
  );
}