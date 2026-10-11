// src/components/panels/TodosPanelContent.jsx
import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Stack,
  Checkbox,
  TextField,
  IconButton,
} from "@mui/material";
import {
  Add as AddIcon,
  DeleteOutline as DeleteIcon,
} from "../../icons";
import { useAuth } from "../../hooks/useAuth";
import { useThemeToggle } from "../../contexts/ThemeToggleContext";
import { useDesktopPanel } from "../../contexts/DesktopPanelContext";
import { useNavigate } from "react-router-dom";
import { db } from "../../firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";

const TodosPanelContent = () => {
  const { user: currentUser } = useAuth();
  const { mode } = useThemeToggle();
  const isDark = mode === "dark";
  const { closePanel } = useDesktopPanel();
  const navigate = useNavigate();

  const [todos, setTodos] = useState([]);
  const [newTodo, setNewTodo] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser?.uid) return;
    const q = query(
      collection(db, "reminders"),
      where("uid", "==", currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      setTodos(list);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const handleAddTodo = async (e) => {
    e.preventDefault();
    if (!newTodo.trim() || !currentUser?.uid) return;

    try {
      await addDoc(collection(db, "reminders"), {
        uid: currentUser.uid,
        title: newTodo.trim(),
        completed: false,
        createdAt: serverTimestamp(),
      });
      setNewTodo("");
    } catch (err) {
      console.error("Error creating todo:", err);
    }
  };

  const handleToggleTodo = async (todo) => {
    try {
      await updateDoc(doc(db, "reminders", todo.id), {
        completed: !todo.completed,
      });
    } catch (err) {
      console.error("Error updating todo:", err);
    }
  };

  const handleDeleteTodo = async (id, e) => {
    e.stopPropagation();
    try {
      await deleteDoc(doc(db, "reminders", id));
    } catch (err) {
      console.error("Error deleting todo:", err);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress size={28} />
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
      {/* ─── Add Todo Input ─── */}
      <Box component="form" onSubmit={handleAddTodo} sx={{ display: "flex", gap: 1 }}>
        <TextField
          size="small"
          fullWidth
          placeholder="Add a new task..."
          value={newTodo}
          onChange={(e) => setNewTodo(e.target.value)}
          sx={{
            "& .MuiOutlinedInput-root": {
              borderRadius: 2.5,
            },
          }}
        />
        <Button
          type="submit"
          variant="contained"
          disabled={!newTodo.trim()}
          sx={{
            borderRadius: 2.5,
            minWidth: 40,
            px: 2,
          }}
        >
          <AddIcon sx={{ fontSize: 20 }} />
        </Button>
      </Box>

      {/* ─── Todo List ─── */}
      {todos.length === 0 ? (
        <Box
          sx={{
            p: 4,
            textAlign: "center",
            borderRadius: 3,
            backgroundColor: isDark
              ? "rgba(255, 255, 255, 0.03)"
              : "rgba(0, 0, 0, 0.02)",
            border: `1px solid ${
              isDark ? "rgba(255, 255, 255, 0.06)" : "rgba(0, 0, 0, 0.06)"
            }`,
          }}
        >
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            No tasks yet. Add one above!
          </Typography>
        </Box>
      ) : (
        <Stack spacing={1}>
          {todos.map((todo) => (
            <Box
              key={todo.id}
              onClick={() => handleToggleTodo(todo)}
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                p: 1.25,
                borderRadius: 2.5,
                cursor: "pointer",
                backgroundColor: isDark
                  ? "rgba(255, 255, 255, 0.04)"
                  : "rgba(0, 0, 0, 0.03)",
                border: `1px solid ${
                  isDark ? "rgba(255, 255, 255, 0.07)" : "rgba(0, 0, 0, 0.07)"
                }`,
                transition: "all 0.18s ease",
                "&:hover": {
                  backgroundColor: isDark
                    ? "rgba(255, 255, 255, 0.08)"
                    : "rgba(0, 0, 0, 0.06)",
                },
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0 }}>
                <Checkbox
                  checked={Boolean(todo.completed)}
                  onChange={() => handleToggleTodo(todo)}
                  size="small"
                  sx={{ p: 0.5 }}
                />
                <Typography
                  variant="body2"
                  sx={{
                    textDecoration: todo.completed ? "line-through" : "none",
                    opacity: todo.completed ? 0.5 : 1,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {todo.title || todo.text || "Task"}
                </Typography>
              </Box>

              <IconButton
                size="small"
                onClick={(e) => handleDeleteTodo(todo.id, e)}
                sx={{
                  color: isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)",
                  "&:hover": { color: "#ff5252" },
                }}
              >
                <DeleteIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </Box>
          ))}
        </Stack>
      )}

      <Button
        fullWidth
        variant="outlined"
        onClick={() => {
          closePanel();
          navigate("/reminders");
        }}
        sx={{
          borderRadius: 2.5,
          textTransform: "none",
          fontWeight: 600,
          mt: 1,
        }}
      >
        Open Full Tasks & Reminders Page
      </Button>
    </Box>
  );
};

export default TodosPanelContent;
