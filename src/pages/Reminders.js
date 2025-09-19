import React, { useState } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  IconButton,
  Card,
  CardContent,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Collapse,
  Switch,
} from "@mui/material";
import { Add, Notifications, ExpandLess, ExpandMore, Delete } from "@mui/icons-material";

export default function ReminderPage() {
  const [reminders, setReminders] = useState([
    { id: 1, title: "A dummy reminder", date: "2025-06-18", time: "15:37", completed: false },
  ]);
  const [newReminder, setNewReminder] = useState({ title: "", date: "", time: "" });
  const [showCompleted, setShowCompleted] = useState(true);
  const [darkMode, setDarkMode] = useState(true);

  const addReminder = () => {
    if (!newReminder.title || !newReminder.date || !newReminder.time) return;
    const id = reminders.length + 1;
    setReminders([...reminders, { id, ...newReminder, completed: false }]);
    setNewReminder({ title: "", date: "", time: "" });
  };

  const toggleComplete = (id) => {
    setReminders(
      reminders.map((rem) =>
        rem.id === id ? { ...rem, completed: !rem.completed } : rem
      )
    );
  };

  const deleteReminder = (id) => {
    setReminders(reminders.filter((rem) => rem.id !== id));
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: darkMode ? "#121212" : "#f5f5f5",
        color: darkMode ? "#fff" : "#000",
        p: 2,
      }}
    >
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Typography variant="h5" fontWeight="bold">
          Reminders
        </Typography>
        <Switch checked={darkMode} onChange={() => setDarkMode(!darkMode)} />
      </Box>

      {/* Search bar */}
      <TextField
        fullWidth
        size="small"
        placeholder="Search reminders..."
        sx={{
          mt: 2,
          bgcolor: darkMode ? "#1e1e1e" : "#fff",
          input: { color: darkMode ? "#fff" : "#000" },
        }}
      />

      {/* Active Reminders */}
      <Typography variant="h6" mt={3}>
        Active Reminders ({reminders.filter((r) => !r.completed).length})
      </Typography>
      <List>
        {reminders
          .filter((r) => !r.completed)
          .map((rem) => (
            <Card
              key={rem.id}
              sx={{
                my: 1,
                bgcolor: darkMode ? "#1e1e1e" : "#fff",
              }}
            >
              <CardContent sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <ListItemIcon>
                  <Notifications sx={{ color: "#fff" }} />
                </ListItemIcon>
                <ListItemText
                  primary={rem.title}
                  secondary={`${rem.date} ${rem.time}`}
                  sx={{ color: darkMode ? "#fff" : "#000" }}
                />
                <Button
                  variant="outlined"
                  color="success"
                  size="small"
                  onClick={() => toggleComplete(rem.id)}
                >
                  Complete
                </Button>
                <IconButton onClick={() => deleteReminder(rem.id)}>
                  <Delete sx={{ color: "#f44336" }} />
                </IconButton>
              </CardContent>
            </Card>
          ))}
      </List>

      {/* Completed Reminders */}
      <Box mt={2}>
        <Box display="flex" alignItems="center" onClick={() => setShowCompleted(!showCompleted)} sx={{ cursor: "pointer" }}>
          <Typography variant="h6">
            Completed ({reminders.filter((r) => r.completed).length})
          </Typography>
          {showCompleted ? <ExpandLess /> : <ExpandMore />}
        </Box>
        <Collapse in={showCompleted}>
          <List>
            {reminders
              .filter((r) => r.completed)
              .map((rem) => (
                <Card
                  key={rem.id}
                  sx={{
                    my: 1,
                    bgcolor: darkMode ? "#1e1e1e" : "#fff",
                    opacity: 0.7,
                  }}
                >
                  <CardContent sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <ListItemText
                      primary={rem.title}
                      secondary={`${rem.date} ${rem.time}`}
                      sx={{ textDecoration: "line-through", color: "#aaa" }}
                    />
                    <IconButton onClick={() => deleteReminder(rem.id)}>
                      <Delete sx={{ color: "#f44336" }} />
                    </IconButton>
                  </CardContent>
                </Card>
              ))}
          </List>
        </Collapse>
      </Box>

      <Divider sx={{ my: 3, bgcolor: "#555" }} />

      {/* Add New Reminder */}
      <Typography variant="h6">Add New Reminder</Typography>
      <TextField
        fullWidth
        size="small"
        label="Reminder"
        value={newReminder.title}
        onChange={(e) => setNewReminder({ ...newReminder, title: e.target.value })}
        sx={{ mt: 2, bgcolor: darkMode ? "#1e1e1e" : "#fff" }}
      />
      <Box display="flex" gap={2} mt={2}>
        <TextField
          type="date"
          size="small"
          value={newReminder.date}
          onChange={(e) => setNewReminder({ ...newReminder, date: e.target.value })}
          sx={{ flex: 1, bgcolor: darkMode ? "#1e1e1e" : "#fff" }}
        />
        <TextField
          type="time"
          size="small"
          value={newReminder.time}
          onChange={(e) => setNewReminder({ ...newReminder, time: e.target.value })}
          sx={{ flex: 1, bgcolor: darkMode ? "#1e1e1e" : "#fff" }}
        />
      </Box>
      <Button
        fullWidth
        variant="contained"
        startIcon={<Add />}
        sx={{ mt: 2, borderRadius: "20px" }}
        onClick={addReminder}
      >
        Add Reminder
      </Button>
    </Box>
  );
}
