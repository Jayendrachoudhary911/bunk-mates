import React from "react";
import {
  SwipeableDrawer,
  Box,
  Typography,
  List,
  Card,
  CardActionArea,
  CardContent,
  Avatar,
  IconButton,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useNavigate } from "react-router-dom";

const MutualFriendsDrawer = ({
  open,
  onClose,
  mutualFriends,
  effectiveChatTheme = "dark",
}) => {
  const isDark = effectiveChatTheme === "dark";
  const navigate = useNavigate();
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));

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
          maxWidth: isDesktop ? 440 : 480,
          mx: isDesktop ? 0 : "auto",
          p: 2.5,
          height: isDesktop ? "100vh" : "80vh",
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

      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
        <IconButton
          size="small"
          onClick={onClose}
          sx={{ color: isDark ? "#fff" : "#111" }}
        >
          <ArrowBackIcon sx={{ fontSize: 20 }} />
        </IconButton>
        <Typography
          variant="h6"
          sx={{ fontWeight: 700, fontSize: "1.15rem" }}
        >
          Mutual Friends ({mutualFriends?.length || 0})
        </Typography>
      </Box>

      <List sx={{ maxHeight: "calc(80vh - 80px)", overflowY: "auto", pr: 0.5 }}>
        {mutualFriends && mutualFriends.length > 0 ? (
          mutualFriends.map((mf) => (
            <Card
              key={mf.id}
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
                  navigate(`/chat/${mf.id}`);
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
                    src={mf.photoURL}
                    sx={{ width: 42, height: 42, bgcolor: "#333" }}
                  >
                    {mf.name?.[0] || "?"}
                  </Avatar>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography
                      variant="subtitle2"
                      noWrap
                      sx={{ fontWeight: 600 }}
                    >
                      {mf.name}
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
                      @{mf.username}
                    </Typography>
                  </Box>
                </CardContent>
              </CardActionArea>
            </Card>
          ))
        ) : (
          <Typography
            variant="body2"
            sx={{
              textAlign: "center",
              py: 4,
              color: isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)",
            }}
          >
            No mutual friends found.
          </Typography>
        )}
      </List>
    </SwipeableDrawer>
  );
};

export default React.memo(MutualFriendsDrawer);
