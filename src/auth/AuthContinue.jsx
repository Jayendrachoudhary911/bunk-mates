import React from "react";
import { useNavigate } from "react-router-dom";
import { Box, Button, Typography, Stack, Avatar } from "@mui/material";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { motion } from "framer-motion";
import { useUser } from "../contexts/UserContext";
import { auth } from "../firebase";
import { useUserRealtime } from "../hooks/useUserRealtime";

const containerVariants = {
  hidden: { opacity: 0, scale: 0.96, filter: "blur(4px)" },
  visible: {
    opacity: 1,
    scale: 1,
    filter: "blur(0px)",
    transition: {
      duration: 0.45,
      ease: [0.25, 0.1, 0.25, 1],
      staggerChildren: 0.1,
      delayChildren: 0.05,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.96,
    filter: "blur(4px)",
    transition: { duration: 0.25, ease: "easeIn" },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] },
  },
};

export default function AuthContinue({ haptic, activeTheme }) {
  const navigate = useNavigate();
  const { user: contextUser, loading: authLoading } = useUser();
  const currentUser = contextUser || auth.currentUser;
  const userDoc = useUserRealtime();

  React.useEffect(() => {
    if (!authLoading && !currentUser) {
      navigate("/auth/welcome", { replace: true });
    }
  }, [currentUser, authLoading, navigate]);

  const primaryBg = activeTheme?.light?.bg || "#D7E3FF";
  const accentColor = activeTheme?.accent || "#88b7f0";

  const displayName =
    userDoc?.name ||
    currentUser?.displayName ||
    sessionStorage.getItem("bunkmates_user_name") ||
    "Original Bunker";
  const displayEmail = currentUser?.email || "user@bunkmates.com";
  const avatarUrl =
    userDoc?.photoURL ||
    currentUser?.photoURL ||
    `https://api.dicebear.com/9.x/glass/svg?seed=${currentUser?.uid || displayName || "avatar"}&radius=50`;

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      style={{ width: "100%" }}
    >
      <Stack
        spacing={2.5}
        alignItems="center"
        textAlign="center"
        sx={{ py: { xs: 1.5, sm: 2.5 } }}
      >
        {/* Glowing Orb / Avatar with floating animation */}
        <motion.div
          variants={itemVariants}
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        >
          <Box sx={{ position: "relative" }}>
            <Avatar
              src={avatarUrl}
              alt={displayName}
              sx={{
                width: 96,
                height: 96,
                border: `3px solid ${accentColor}`,
                boxShadow: `0 0 28px ${accentColor}55`,
              }}
            />
          </Box>
        </motion.div>

        {/* User Welcome message */}
        <motion.div variants={itemVariants}>
          <Box>
            <Typography
              sx={{
                fontSize: "0.75rem",
                fontWeight: 800,
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                color: "rgba(255, 255, 255, 0.65)",
                mb: 0.5,
              }}
            >
              WELCOME TO BUNKMATES
            </Typography>
            <Typography
              sx={{
                fontSize: { xs: "1.45rem", sm: "1.65rem" },
                fontWeight: 800,
                color: "#ffffff",
                letterSpacing: "-0.02em",
              }}
            >
              Hey,{" "}
              <span style={{ color: "#ffffff", fontWeight: 900 }}>
                {displayName}
              </span>
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: "rgba(255, 255, 255, 0.65)",
                mt: 0.6,
                fontSize: "0.92rem",
              }}
            >
              You're in. Bags packed. Vibes set.
            </Typography>
          </Box>
        </motion.div>

        {/* Signed in as */}
        <motion.div variants={itemVariants}>
          <Box sx={{ py: 0.5 }}>
            <Typography
              sx={{
                fontSize: "0.75rem",
                fontWeight: 600,
                color: "rgba(255, 255, 255, 0.45)",
                letterSpacing: "0.04em",
                textTransform: "uppercase",
              }}
            >
              Signed in as
            </Typography>
            <Typography
              sx={{
                fontSize: "0.9rem",
                fontWeight: 700,
                color: "rgba(255, 255, 255, 0.9)",
                mt: 0.2,
              }}
            >
              {displayEmail}
            </Typography>
          </Box>
        </motion.div>

        {/* Action Button */}
        <motion.div
          variants={itemVariants}
          style={{ width: "100%" }}
          whileHover={{ scale: 1.015 }}
          whileTap={{ scale: 0.985 }}
        >
          <Button
            fullWidth
            endIcon={<ArrowForwardIcon sx={{ fontSize: 18 }} />}
            onClick={() => {
              if (haptic) haptic(20);
              sessionStorage.removeItem("bunkmates_auth_welcome");
              sessionStorage.removeItem("bunkmates_user_name");
              navigate("/", { replace: true });
            }}
            sx={{
              backgroundColor: primaryBg,
              color: "#000000",
              borderRadius: "28px",
              py: 1.5,
              fontWeight: 800,
              fontSize: "0.92rem",
              letterSpacing: "0.03em",
              textTransform: "none",
              boxShadow: "0 4px 18px rgba(255, 255, 255, 0.25)",
              transition: "background-color 0.3s ease, box-shadow 0.3s ease, transform 0.2s ease",
              "&:hover": {
                backgroundColor: "rgba(255, 255, 255, 0.9)",
                boxShadow: "0 6px 24px rgba(255, 255, 255, 0.35)",
              },
            }}
          >
            Continue
          </Button>
        </motion.div>
      </Stack>
    </motion.div>
  );
}
