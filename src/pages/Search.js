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
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import MessageIcon from "@mui/icons-material/Chat";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import PlaceIcon from "@mui/icons-material/Place";
import { motion } from "framer-motion";
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
  const [selectedItem, setSelectedItem] = useState(null);
  const [drawerContentType, setDrawerContentType] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const { results, loading } = useUniversalSearch(q, { maxPerCollection: 200 });

  const groups = useMemo(
    () => [
      { key: "users", label: "Users", items: results.users },
      { key: "friends", label: "Friends", items: results.friends },
      { key: "notes", label: "Notes", items: results.notes },
      { key: "reminders", label: "Reminders", items: results.reminders },
      { key: "trips", label: "Trips", items: results.trips },
      { key: "places", label: "Places", items: results.places },
    ],
    [results]
  );

  const filteredGroups =
    tab === "all" ? groups : groups.filter((g) => g.key === tab);

  const closeDrawer = () => {
    setDrawerOpen(false);
    setTimeout(() => {
      setSelectedItem(null);
      setDrawerContentType(null);
    }, 300);
  };

  const handleItemClick = (type, item) => {
    setSelectedItem(item);
    if (["users", "friends"].includes(type)) {
      setDrawerContentType("user");
      setDrawerOpen(true);
    } else if (type === "places") {
      setDrawerContentType("place");
      setDrawerOpen(true);
    } else if (type === "notes") navigate(`/notes`, { state: { openNoteId: item.id } });
    else if (type === "reminders") navigate(`/reminders`, { state: { openReminderId: item.id } });
    else if (type === "trips") navigate(`/trips/${item.id}`);
  };

  // -------- User Drawer --------
  const UserDrawerContent = ({ user }) => (
    <Box>
      <Stack alignItems="center" spacing={1.5} sx={{ mb: 2 }}>
        <Avatar
          src={user.photoURL}
          sx={{
            width: 90,
            height: 90,
            mb: 1,
            boxShadow: `0 0 12px ${alpha(theme.palette.primary.main, 0.6)}`,
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
        <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
          {user.bio}
        </Typography>
      )}

      <Box sx={{ mb: 3 }}>
        {user.mutualFriends?.length > 0 && (
          <Section title="Mutual Friends">
            {user.mutualFriends.slice(0, 5).map((f) => (
              <Chip
                key={f.uid}
                avatar={<Avatar src={f.photoURL}>{f.name[0]}</Avatar>}
                label={f.name}
                size="small"
              />
            ))}
          </Section>
        )}
        {user.mutualTrips?.length > 0 && (
          <Section title="Shared Trips">
            {user.mutualTrips.slice(0, 4).map((t) => (
              <Chip key={t.id} label={t.name} size="small" />
            ))}
          </Section>
        )}
      </Box>

      <Stack direction="row" spacing={2} justifyContent="center">
        {user.isFriend ? (
          <Button variant="contained" startIcon={<MessageIcon />} onClick={() => navigate(`/chats/${user.uid}`)}>
            Message
          </Button>
        ) : (
          <Button variant="outlined" startIcon={<PersonAddIcon />}>
            Add Friend
          </Button>
        )}
      </Stack>
    </Box>
  );

  // -------- Place Drawer --------
  const PlaceDrawerContent = ({ place }) => (
    <Box sx={{ px: 3, pb: 3 }}>
      <Stack alignItems="center" spacing={2} sx={{ mb: 3 }}>
        <Avatar
          variant="rounded"
          src={place.images?.[0]}
          sx={{
            width: 120,
            height: 120,
            boxShadow: `0 0 20px ${alpha(theme.palette.primary.main, 0.4)}`,
          }}
        >
          <PlaceIcon fontSize="large" />
        </Avatar>
        <Typography variant="h5" fontWeight={700}>
          {place.name}
        </Typography>
        <Stack direction="row" spacing={1} flexWrap="wrap" justifyContent="center">
          <Chip label={place.type || "Attraction"} size="small" color="primary" variant="outlined" />
          <Chip label={place.city || "Unknown Location"} size="small" variant="outlined" />
        </Stack>
      </Stack>

      <Divider sx={{ mb: 3 }} />

      <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>
        Overview
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        {place.description || "No detailed description available."}
      </Typography>

      <Stack direction="row" spacing={1} justifyContent="center" sx={{ pt: 1 }}>
        <Button variant="contained" onClick={() => navigate(`/trips`, { state: { place } })}>
          Plan Trip Here
        </Button>
        <Button variant="outlined" onClick={closeDrawer}>
          Close
        </Button>
      </Stack>
    </Box>
  );

  const Section = ({ title, children }) => (
    <Box sx={{ mb: 2 }}>
      <Typography variant="subtitle2" sx={{ mb: 1 }}>
        {title}
      </Typography>
      <Stack direction="row" spacing={1} flexWrap="wrap">
        {children}
      </Stack>
    </Box>
  );

  return (
    <Box sx={{ p: 3, maxWidth: 900, mx: "auto" }}>
      {/* Search Bar */}
      <Paper
        sx={{
          p: 1.2,
          mb: 3,
          borderRadius: 4,
          display: "flex",
          alignItems: "center",
          background: alpha(theme.palette.background.paper, 0.4),
          backdropFilter: "blur(12px)",
          boxShadow: theme.shadows[4],
        }}
      >
        <SearchIcon color="action" sx={{ mx: 1 }} />
        <TextField
          fullWidth
          placeholder="Search across users, notes, trips & more..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          variant="standard"
          InputProps={{ disableUnderline: true }}
        />
        {loading && <CircularProgress size={22} />}
      </Paper>

      {/* Tabs */}
      <Tabs
        value={tab}
        onChange={(e, val) => setTab(val)}
        variant="scrollable"
        scrollButtons="auto"
        sx={{
          mb: 2,
          "& .MuiTab-root": {
            textTransform: "none",
            fontWeight: 500,
          },
          "& .Mui-selected": {
            color: theme.palette.primary.main,
          },
          "& .MuiTabs-indicator": {
            backgroundColor: theme.palette.primary.main,
            height: 3,
            borderRadius: 2,
          },
        }}
      >
        {["all", "users", "friends", "notes", "reminders", "trips", "places"].map((t) => (
          <Tab key={t} value={t} label={t.charAt(0).toUpperCase() + t.slice(1)} />
        ))}
      </Tabs>

      {/* Results */}
      {!q ? (
        <Typography color="text.secondary" align="center" sx={{ mt: 5 }}>
          Type something to start searching ✨
        </Typography>
      ) : (
        filteredGroups.map(
          (group) =>
            group.items.length > 0 && (
              <Box key={group.key} sx={{ mb: 3 }}>
                <Typography variant="h6" fontWeight={600} sx={{ mb: 1 }}>
                  {group.label} ({group.items.length})
                </Typography>
                <List>
                  {group.items.slice(0, 50).map((item) => (
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} key={item.id || item.uid}>
                      <Paper
                        sx={{
                          mb: 1.2,
                          p: 1,
                          borderRadius: 3,
                          background: alpha(theme.palette.background.paper, 0.5),
                          backdropFilter: "blur(10px)",
                          transition: "all 0.25s ease",
                          "&:hover": { boxShadow: theme.shadows[6] },
                        }}
                        onClick={() => handleItemClick(group.key, item)}
                      >
                        <ListItem>
                          <ListItemAvatar>
                            <Avatar
                              src={item.images?.[0] || item.photoURL || item.iconURL || ""}
                              sx={{
                                bgcolor: alpha(theme.palette.primary.main, 0.15),
                                boxShadow: `0 0 8px ${alpha(theme.palette.primary.main, 0.3)}`,
                              }}
                            />
                          </ListItemAvatar>
                          <ListItemText
                            primary={
                              <Typography variant="subtitle1" fontWeight={600}>
                                {item.name || item.title || "Untitled"}
                              </Typography>
                            }
                            secondary={
                              <Typography variant="body2" color="text.secondary" noWrap>
                                {item.description || item.content || item.location || ""}
                              </Typography>
                            }
                          />
                        </ListItem>
                      </Paper>
                    </motion.div>
                  ))}
                </List>
              </Box>
            )
        )
      )}

      {/* Drawer */}
      <SwipeableDrawer
        anchor="bottom"
        open={drawerOpen}
        onClose={closeDrawer}
        PaperProps={{
          sx: {
            borderTopLeftRadius: 22,
            borderTopRightRadius: 22,
            maxWidth: 600,
            mx: "auto",
            maxHeight: "90vh",
            background: alpha(theme.palette.background.paper, 0.3),
            backdropFilter: "blur(18px)",
            p: 3,
            boxShadow: theme.shadows[10],
          },
        }}
      >
        {drawerContentType === "user" && selectedItem && <UserDrawerContent user={selectedItem} />}
        {drawerContentType === "place" && selectedItem && <PlaceDrawerContent place={selectedItem} />}
      </SwipeableDrawer>
    </Box>
  );
}
