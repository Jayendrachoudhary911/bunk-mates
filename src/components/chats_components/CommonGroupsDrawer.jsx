import React, { useState } from "react";
import {
  SwipeableDrawer,
  Box,
  Typography,
  TextField,
  InputAdornment,
  Card,
  CardActionArea,
  CardContent,
  Avatar,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import { useNavigate } from "react-router-dom";
import { safeImageUrl } from "../../utils/uiHelpers";

const CommonGroupsDrawer = ({
  open,
  onClose,
  commonGroups = [],
  effectiveChatTheme = "dark",
}) => {
  const isDark = effectiveChatTheme === "dark";
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  const filtered = commonGroups.filter((g) =>
    g.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <SwipeableDrawer
      anchor="bottom"
      open={open}
      onClose={onClose}
      onOpen={() => {}}
      disableSwipeToOpen
      PaperProps={{
        sx: {
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          bgcolor: isDark
            ? "rgba(18, 18, 18, 0.94)"
            : "rgba(255, 255, 255, 0.96)",
          backdropFilter: "blur(24px)",
          color: isDark ? "#fff" : "#111",
          maxWidth: 480,
          mx: "auto",
          p: 2,
          height: "85vh",
        },
      }}
    >
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

      <Typography
        variant="h6"
        sx={{ textAlign: "center", fontWeight: 700, mb: 1.5 }}
      >
        Common Groups ({commonGroups.length})
      </Typography>

      <TextField
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search shared groups..."
        fullWidth
        size="small"
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon
                sx={{
                  color: isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)",
                  fontSize: 20,
                }}
              />
            </InputAdornment>
          ),
          sx: {
            borderRadius: "14px",
            bgcolor: isDark
              ? "rgba(255, 255, 255, 0.06)"
              : "rgba(0, 0, 0, 0.04)",
            color: isDark ? "#fff" : "#111",
            "& fieldset": { border: "none" },
          },
        }}
        sx={{ mb: 2 }}
      />

      <Box sx={{ maxHeight: "calc(85vh - 140px)", overflowY: "auto" }}>
        {filtered.map((group) => (
          <Card
            key={group.id}
            sx={{
              bgcolor: isDark
                ? "rgba(255, 255, 255, 0.05)"
                : "rgba(0, 0, 0, 0.03)",
              color: isDark ? "#fff" : "#111",
              borderRadius: "14px",
              mb: 1,
              boxShadow: "none",
            }}
          >
            <CardActionArea
              onClick={() => {
                onClose();
                navigate(`/group/${group.id}`);
              }}
            >
              <CardContent
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                  p: "12px !important",
                }}
              >
                <Avatar
                  src={safeImageUrl(group.iconURL)}
                  sx={{ width: 42, height: 42, bgcolor: "#333" }}
                >
                  {group.emoji || group.name?.[0] || "👥"}
                </Avatar>
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Typography
                    variant="subtitle2"
                    noWrap
                    sx={{ fontWeight: 600 }}
                  >
                    {group.name}
                  </Typography>
                  <Typography
                    variant="caption"
                    noWrap
                    sx={{
                      color: isDark
                        ? "rgba(255,255,255,0.5)"
                        : "rgba(0,0,0,0.5)",
                    }}
                  >
                    {group.members?.length || 0} members
                  </Typography>
                </Box>
              </CardContent>
            </CardActionArea>
          </Card>
        ))}

        {filtered.length === 0 && (
          <Typography
            variant="body2"
            sx={{
              textAlign: "center",
              py: 4,
              color: isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)",
            }}
          >
            No common groups found.
          </Typography>
        )}
      </Box>
    </SwipeableDrawer>
  );
};

export default React.memo(CommonGroupsDrawer);
