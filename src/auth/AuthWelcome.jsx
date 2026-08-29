import React from "react";
import { useNavigate } from "react-router-dom";
import { Box, Button, Typography, Stack, Divider } from "@mui/material";
import MailOutlineIcon from "@mui/icons-material/MailOutline";
import { motion } from "framer-motion";

export const GoogleColoredIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 48 48"
    style={{ marginRight: 8, display: "inline-block", verticalAlign: "middle" }}
  >
    <path
      fill="#EA4335"
      d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
    />
    <path
      fill="#4285F4"
      d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
    />
    <path
      fill="#FBBC05"
      d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.55 10.78l7.98-6.19z"
    />
    <path
      fill="#34A853"
      d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
    />
  </svg>
);

const containerVariants = {
  hidden: { opacity: 0, y: 16, filter: "blur(4px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: {
      duration: 0.4,
      ease: [0.25, 0.1, 0.25, 1],
      staggerChildren: 0.08,
      delayChildren: 0.05,
    },
  },
  exit: {
    opacity: 0,
    y: -14,
    filter: "blur(4px)",
    transition: { duration: 0.25, ease: "easeIn" },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: [0.25, 0.1, 0.25, 1] },
  },
};

export default function AuthWelcome({
  onGoogleLogin,
  loading,
  haptic,
  activeTheme,
}) {
  const navigate = useNavigate();

  const primaryBg = activeTheme?.light?.bg || "#D7E3FF";
  const primaryText = activeTheme?.light?.text || "#001B3F";
  const accentColor = activeTheme?.accent || "#88b7f0";

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      style={{ width: "100%" }}
    >
      <Stack spacing={2.2}>
        {/* Header Titles */}
        <motion.div variants={itemVariants}>
          <Box sx={{ mb: 0.5 }}>
            <Typography
              sx={{
                fontSize: "0.75rem",
                fontWeight: 700,
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                color: "rgba(255, 255, 255, 0.65)",
                mb: 0.3,
              }}
            >
              WELCOME TO
            </Typography>
            <Typography
              sx={{
                fontSize: { xs: "1.9rem", sm: "2.15rem" },
                fontWeight: 900,
                color: "#ffffff",
                letterSpacing: "-0.03em",
                lineHeight: 1.1,
              }}
            >
              BunkMates
            </Typography>
          </Box>
        </motion.div>

        {/* LOGIN WITH EMAIL */}
        <motion.div
          variants={itemVariants}
          whileHover={{ scale: 1.015 }}
          whileTap={{ scale: 0.985 }}
        >
          <Button
            fullWidth
            startIcon={<MailOutlineIcon sx={{ fontSize: 19 }} />}
            onClick={() => {
              if (haptic) haptic(15);
              navigate("/auth/login");
            }}
            sx={{
              backgroundColor: primaryBg,
              color: primaryText,
              borderRadius: "28px",
              py: 1.5,
              fontWeight: 800,
              fontSize: "0.85rem",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              boxShadow: `0 4px 18px ${primaryBg}35`,
              transition: "background-color 0.3s ease, box-shadow 0.3s ease",
              "&:hover": {
                backgroundColor: accentColor,
                boxShadow: `0 6px 24px ${accentColor}55`,
              },
            }}
          >
            LOGIN WITH EMAIL
          </Button>
        </motion.div>

        {/* CREATE NEW ACCOUNT */}
        <motion.div
          variants={itemVariants}
          whileHover={{ scale: 1.015 }}
          whileTap={{ scale: 0.985 }}
        >
          <Button
            fullWidth
            startIcon={<MailOutlineIcon sx={{ fontSize: 19 }} />}
            onClick={() => {
              if (haptic) haptic(15);
              navigate("/auth/signup");
            }}
            sx={{
              backgroundColor: "#ffffff11",
              color: "#ffffff",
              boxShadow: 'inset 0 1px 1px rgba(255, 255, 255, 0.11), 0 1px 0px rgba(0,0,0,0.1)',
              borderRadius: "28px",
              py: 1.45,
              fontWeight: 800,
              fontSize: "0.85rem",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              transition: "border-color 0.25s ease, background-color 0.25s ease",
              "&:hover": {
                borderColor: "rgba(255, 255, 255, 0.6)",
                backgroundColor: "rgba(255, 255, 255, 0.08)",
              },
            }}
          >
            CREATE NEW ACCOUNT
          </Button>
        </motion.div>

        {/* Divider */}
        <motion.div variants={itemVariants}>
          <Divider
            sx={{
              my: 0.5,
              color: "rgba(255, 255, 255, 0.35)",
              fontSize: "0.72rem",
              fontWeight: 700,
              letterSpacing: "0.1em",
              "&::before, &::after": { borderColor: "rgba(255, 255, 255, 0.12)" },
            }}
          >
            OR
          </Divider>
        </motion.div>

        {/* CONTINUE WITH GOOGLE */}
        <motion.div
          variants={itemVariants}
          whileHover={{ scale: 1.015 }}
          whileTap={{ scale: 0.985 }}
        >
          <Button
            fullWidth
            onClick={() => {
              if (haptic) haptic(15);
              if (onGoogleLogin) onGoogleLogin();
            }}
            disabled={loading}
            sx={{
              backgroundColor: primaryBg,
              color: primaryText,
              borderRadius: "28px",
              py: 1.5,
              fontWeight: 800,
              fontSize: "0.85rem",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              boxShadow: `0 4px 18px ${primaryBg}35`,
              transition: "background-color 0.3s ease, box-shadow 0.3s ease",
              "&:hover": {
                backgroundColor: accentColor,
                boxShadow: `0 6px 24px ${accentColor}55`,
              },
            }}
          >
            <GoogleColoredIcon />
            CONTINUE WITH GOOGLE
          </Button>
        </motion.div>
      </Stack>
    </motion.div>
  );
}
