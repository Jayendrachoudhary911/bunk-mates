import React, { useState, useEffect } from "react";
import { Button, Box } from "@mui/material";
import { motion, AnimatePresence } from "framer-motion";
import { Search as SearchIcon } from "@mui/icons-material";

const searchTerms = [
  "trips...",
  "places...",
  "food...",
  "destinations...",
  "hill stations...",
  "monuments...",
  "cafes...",
];

export default function RotatingSearchButton({ navigate, isDark }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Cycle through terms every 2.5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % searchTerms.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <Button
      fullWidth
      onClick={() => navigate && navigate("/search")}
      variant="outlined"
      startIcon={
        <SearchIcon
          sx={{
            color: isDark ? "rgba(255,255,255,0.75)" : "rgba(0,0,0,0.55)",
            mr: 0.5,
            fontSize: "1.25rem !important",
          }}
        />
      }
      sx={{
        justifyContent: "flex-start",
        borderRadius: 8,
        py: 1.6,
        px: 2.5,
        textTransform: "none",
        backgroundColor: isDark 
          ? "rgba(255, 255, 255, 0.04)" 
          : "rgba(0, 0, 0, 0.025)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        border: 0,
        color: isDark ? "rgba(255,255,255,0.7)" : "rgba(0, 0, 0, 0.69)",
        boxShadow: isDark 
          ? "inset 0 1px 1px rgba(255,255,255,0.08), 0 4px 20px rgba(0,0,0,0.2)" 
          : "inset 0 1px 4px rgba(0, 0, 0, 0.06), 0 4px 16px rgba(0,0,0,0)",
        overflow: "hidden",
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        "&:hover": {
          backgroundColor: isDark 
            ? "rgba(255, 255, 255, 0.08)" 
            : "rgba(0, 0, 0, 0.04)",
          transform: "translateY(-1px)",
        },
        "&:active": {
          transform: "translateY(0px)",
        },
      }}
    >
      <Box 
        component="span" 
        sx={{ 
          display: "flex", 
          alignItems: "center", 
          gap: "6px", 
          width: "100%",
          fontSize: "0.95rem",
          fontWeight: 500,
        }}
      >
        <Box component="span" sx={{ opacity: 0.85 }}>Search</Box>
        
        {/* Animated Rolling Text Box Container */}
        <Box
          component="span"
          sx={{
            display: "inline-flex",
            position: "relative",
            height: "1.4em",
            flexGrow: 1,
            overflow: "hidden",
            alignItems: "center",
          }}
        >
          <AnimatePresence mode="wait">
            <motion.span
              key={searchTerms[currentIndex]}
              initial={{ y: 12, opacity: 0, filter: "blur(4px)" }}
              animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
              exit={{ y: -12, opacity: 0, filter: "blur(4px)" }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              style={{
                position: "absolute",
                left: 0,
                fontWeight: 700,
                color: isDark ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.6)",
                letterSpacing: "0.01em",
                whiteSpace: "nowrap",
              }}
            >
              {searchTerms[currentIndex]}
            </motion.span>
          </AnimatePresence>
        </Box>
      </Box>
    </Button>
  );
}