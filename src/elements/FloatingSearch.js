import React, { useEffect, useState } from "react";
import { Box, Button } from "@mui/material";
import { Search } from "@mui/icons-material";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";

export default function FloatingSearch({ mode }) {
  const navigate = useNavigate();

  const [expanded, setExpanded] = useState(true);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 20;
      setScrolled(isScrolled);
      if (isScrolled) setExpanded(false);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setExpanded(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Box
      sx={{
        position: "fixed",
        bottom: 74,
        right: 41,
        zIndex: 1100,
        pointerEvents: "none",
      }}
    >
      <Button
        onClick={() => navigate("/search")}
        onMouseEnter={() => !scrolled && setExpanded(true)}
        onMouseLeave={() => !scrolled && setExpanded(false)}
        startIcon={<Search sx={{ fontSize: expanded ? 30 : 54 }} />}
        sx={{
          pointerEvents: "auto",
          position: "relative",
          overflow: "hidden",

          minWidth: expanded ? { xs: "330px", md: "400px" } : 56,
          height: 56,
          borderRadius: expanded ? "35px" : "50%",
          px: expanded ? 3 : 0,

          transition: "all 0.45s cubic-bezier(0.4, 0, 0.2, 1)",

          // 🔥 LIQUID GLASS BASE
          backdropFilter: "blur(8px) saturate(180%)",
          WebkitBackdropFilter: "blur(8px) saturate(180%)",

          background:
            mode === "dark"
              ? "rgba(0, 0, 0, 0.35)"
              : "rgba(255, 255, 255, 0.25)",


          color: mode === "dark" ? "#fff" : "#000",

          // 🔥 DEPTH (liquid feel)
          boxShadow:
            mode === "dark"
              ? `
                inset 0 2px 6px rgba(255, 255, 255, 0.11),
                inset 0 -4px 10px rgba(255, 255, 255, 0.07),
                0 8px 30px rgba(0,0,0,0.4)
              `
              : `
                inset 0 2px 6px rgba(255,255,255,0.8),
                inset 0 -4px 10px rgba(0,0,0,0.1),
                0 8px 25px rgba(0,0,0,0.1)
              `,

          "& .MuiButton-startIcon": {
            margin: expanded ? "0 8px 0 0" : 0,
          },

          // 🔥 SHINE LAYER (liquid reflection)
          "&::before": {
            content: '""',
            position: "absolute",
            top: 0,
            left: "-75%",
            width: "50%",
            height: "100%",
            background:
              "linear-gradient(120deg, transparent, rgba(255, 255, 255, 0.17), transparent)",
            transform: "skewX(-20deg)",
            transition: "all 0.6s ease",
          },

          "&:hover::before": {
            left: "125%",
          },

          // 🔥 GLOW EDGE
          "&::after": {
            content: '""',
            position: "absolute",
            inset: 0,
            borderRadius: "inherit",
            background:
              "linear-gradient(to bottom right, rgba(255, 255, 255, 0.13), transparent)",
            opacity: 0.3,
            pointerEvents: "none",
          },

          "&:hover": {
            transform: "scale(1.05)",
          },
        }}
      >
        <AnimatePresence>
          {expanded && (
            <motion.span
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              exit={{ opacity: 0, width: 0 }}
              style={{
                whiteSpace: "nowrap",
                fontWeight: 800,
                overflow: "hidden",
              }}
            >
              Search Exploration
            </motion.span>
          )}
        </AnimatePresence>
      </Button>
    </Box>
  );
}