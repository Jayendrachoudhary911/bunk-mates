import React from "react";
import { useNavigate } from "react-router-dom";
import { Box, Button, Typography, Stack, Avatar } from "@mui/material";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { motion } from "framer-motion";
import { useAuth } from "../hooks/useAuth";
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
  const { user: currentUser } = useAuth();
  const userDoc = useUserRealtime();

  const primaryBg = activeTheme?.light?.bg || "#D7E3FF";
  const primaryText = activeTheme?.light?.text || "#001B3F";
  const accentColor = activeTheme?.accent || "#88b7f0";

  const displayName =
    userDoc?.name || currentUser?.displayName || "Original Bunker";
  const displayEmail = currentUser?.email || "user@bunkmates.com";
  const avatarUrl =
    userDoc?.photoURL ||
    currentUser?.photoURL ||
    `https://api.dicebear.com/9.x/glass/svg?seed=${currentUser?.uid || "avatar"}&radius=50`;

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      style={{ width: "100%" }}
    >
      <Stack
        spacing={3}
        alignItems="center"
        textAlign="center"
        sx={{ py: { xs: 4, sm: 3 } }}
      >
        {/* Glowing Orb / Avatar with floating animation */}
        <motion.div
          variants={itemVariants}
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        >
          <Box sx={{ position: "relative" }}>
            {currentUser?.photoURL ? (
              <Avatar
                src={avatarUrl}
                alt={displayName}
                sx={{
                  width: 96,
                  height: 96,
                  border: `0px solid ${accentColor}`,
                }}
              />
            ) : (
              <Box
                className="auth-glowing-sphere"
                sx={{
                  width: 96,
                  height: 96,
                  borderRadius: "50%",
                  border: `2px solid ${accentColor}80`,
                }}
              />
            )}
          </Box>
        </motion.div>

        {/* User Welcome message */}
        <motion.div variants={itemVariants}>
          <Box>
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
              navigate("/");
            }}
            sx={{
              backgroundColor: primaryBg,
              color: primaryText,
              borderRadius: "28px",
              py: 1.5,
              fontWeight: 800,
              fontSize: "0.92rem",
              letterSpacing: "0.03em",
              textTransform: "none",
              boxShadow: `0 4px 18px ${primaryBg}35`,
              transition: "background-color 0.3s ease, box-shadow 0.3s ease",
              "&:hover": {
                backgroundColor: accentColor,
                boxShadow: `0 6px 24px ${accentColor}55`,
              },
            }}
          >
            Let's Plan a Bunk
          </Button>
        </motion.div>
      </Stack>
    </motion.div>
  );
}
