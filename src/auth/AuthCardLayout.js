// src/components/AuthLayout.jsx
import React, { useState, useEffect, useMemo } from "react";
import { Box, Typography } from "@mui/material";
import { motion, AnimatePresence } from "framer-motion";
import { M3_EXPRESSIVE_PALETTE } from "../theme/palette";

const paletteKeys = ["blue", "purple", "emerald", "amber", "orange"];

export default function AuthLayout({ 
  topTitleSmall, 
  topTitleLarge, 
  sloganPool, 
  children 
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [colorIndex, setColorIndex] = useState(0);

  // Active expressive palette configuration
  const activeTheme = useMemo(() => {
    const key = paletteKeys[colorIndex % paletteKeys.length];
    return M3_EXPRESSIVE_PALETTE[key];
  }, [colorIndex]);

  // Smooth background color and slogan cycling
  useEffect(() => {
    const interval = setInterval(() => {
      if (sloganPool && sloganPool.length > 0) {
        setCurrentIndex((prev) => (prev + 1) % sloganPool.length);
      }
      setColorIndex((prev) => (prev + 1) % paletteKeys.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [sloganPool]);

  const currentTopText = sloganPool ? sloganPool[currentIndex % sloganPool.length] : null;

  return (
    <Box
      sx={{
        minHeight: "100vh",
        backgroundColor: "#09090b",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        p: { xs: 0, sm: 2 },
      }}
    >
      <Box
        sx={{
          width: "100%",
          maxWidth: 440,
          minHeight: { xs: "100vh", sm: "62vh" },
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#000000",
          borderRadius: { xs: 0, sm: "36px" },
          overflow: "hidden",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.7)",
          border: "1px solid rgba(255, 255, 255, 0.08)",
        }}
      >
        {/* ================= TOP ACCENT HERO SECTION ================= */}
        <motion.div
          animate={{ backgroundColor: activeTheme.light.bg }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
          style={{
            padding: "40px 32px 36px",
            borderBottomLeftRadius: "36px",
            borderBottomRightRadius: "36px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
          }}
        >
          {sloganPool ? (
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              >
                <Typography
                  sx={{
                    fontSize: { xs: 36, sm: 42 },
                    fontWeight: 900,
                    lineHeight: 1.08,
                    letterSpacing: "-0.03em",
                    color: activeTheme.light.text,
                    whiteSpace: "pre-line",
                  }}
                >
                  {currentTopText}
                </Typography>
              </motion.div>
            </AnimatePresence>
          ) : (
            <Box>
              <Typography
                sx={{
                  fontSize: 13,
                  fontWeight: 800,
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                  color: activeTheme.light.text,
                  opacity: 0.8,
                }}
              >
                {topTitleSmall}
              </Typography>
              <Typography
                sx={{
                  fontSize: 34,
                  fontWeight: 900,
                  letterSpacing: "-0.02em",
                  color: activeTheme.light.text,
                }}
              >
                {topTitleLarge}
              </Typography>
            </Box>
          )}
        </motion.div>

        {/* ================= BOTTOM FORM SHEET ================= */}
        <Box
          sx={{
            flex: 1,
            backgroundColor: "#000000",
            p: { xs: 3, sm: 3.5 },
            display: "flex",
            flexDirection: "column",
            overflowY: "auto",
          }}
        >
          {/* Inject child form elements with the active accent color passed down if needed */}
          {React.cloneElement(children, { activeTheme })}
        </Box>
      </Box>
    </Box>
  );
}