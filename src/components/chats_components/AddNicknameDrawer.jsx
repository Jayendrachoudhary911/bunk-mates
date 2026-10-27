import React, { useState, useEffect } from "react";
import {
  SwipeableDrawer,
  Box,
  Typography,
  TextField,
  Button,
  IconButton,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

const AddNicknameDrawer = ({
  open,
  onClose,
  initialNickname = "",
  onSave,
  effectiveChatTheme = "dark",
}) => {
  const isDark = effectiveChatTheme === "dark";
  const [nickname, setNickname] = useState(initialNickname);
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));

  useEffect(() => {
    setNickname(initialNickname);
  }, [initialNickname, open]);

  const handleSave = () => {
    onSave(nickname);
    onClose();
  };

  return (
    <SwipeableDrawer
      anchor={isDesktop ? "right" : "bottom"}
      open={open}
      onClose={onClose}
      onOpen={() => {}}
      disableSwipeToOpen
      PaperProps={{
        sx: {
          borderTopLeftRadius: isDesktop ? 0 : 24,
          borderTopRightRadius: isDesktop ? 0 : 24,
          bgcolor: isDark
            ? "rgba(18, 18, 18, 0.94)"
            : "rgba(255, 255, 255, 0.96)",
          backdropFilter: "blur(24px)",
          color: isDark ? "#fff" : "#111",
          width: isDesktop ? 440 : "100%",
          maxWidth: isDesktop ? 440 : 440,
          mx: isDesktop ? 0 : "auto",
          p: 3,
          height: isDesktop ? "100vh" : "auto",
          boxShadow: isDesktop
            ? "-8px 0 32px rgba(0,0,0,0.4)"
            : "0 -8px 32px rgba(0,0,0,0.2)",
        },
      }}
    >
      {!isDesktop && (
        <Box
          sx={{
            width: 36,
            height: 4,
            bgcolor: isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.2)",
            borderRadius: 2,
            mx: "auto",
            mb: 2,
          }}
        />
      )}

      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
        <IconButton
          size="small"
          onClick={onClose}
          sx={{ color: isDark ? "#fff" : "#111" }}
        >
          <ArrowBackIcon sx={{ fontSize: 20 }} />
        </IconButton>
        <Typography variant="h6" sx={{ fontWeight: 700, fontSize: "1.15rem" }}>
          Set a Nickname
        </Typography>
      </Box>

      <Typography
        variant="body2"
        sx={{
          color: isDark ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.6)",
          mb: 2.5,
        }}
      >
        Nicknames are only visible to you.
      </Typography>

      <TextField
        value={nickname}
        onChange={(e) => setNickname(e.target.value)}
        placeholder="Enter nickname"
        fullWidth
        autoFocus
        variant="outlined"
        InputProps={{
          sx: {
            borderRadius: "14px",
            bgcolor: isDark
              ? "rgba(255, 255, 255, 0.06)"
              : "rgba(0, 0, 0, 0.04)",
            color: isDark ? "#fff" : "#111",
            "& fieldset": { border: "none" },
          },
        }}
        sx={{ mb: 3 }}
      />

      <Box sx={{ display: "flex", gap: 1.5 }}>
        <Button
          fullWidth
          variant="outlined"
          onClick={onClose}
          sx={{
            py: 1.2,
            borderRadius: "14px",
            borderColor: isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.15)",
            color: isDark ? "#fff" : "#111",
            textTransform: "none",
            fontWeight: 600,
          }}
        >
          Cancel
        </Button>

        <Button
          fullWidth
          variant="contained"
          onClick={handleSave}
          sx={{
            py: 1.2,
            borderRadius: "14px",
            bgcolor: isDark ? "#fff" : "#111",
            color: isDark ? "#111" : "#fff",
            textTransform: "none",
            fontWeight: 600,
            "&:hover": {
              bgcolor: isDark ? "#e0e0e0" : "#222",
            },
          }}
        >
          Save
        </Button>
      </Box>
    </SwipeableDrawer>
  );
};

export default React.memo(AddNicknameDrawer);
