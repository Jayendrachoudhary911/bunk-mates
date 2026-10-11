import React, { useState, useEffect } from "react";
import { Box, Button, Tab, Tabs } from "@mui/material";
import { motion, AnimatePresence } from "framer-motion";
import { SquarePen } from "lucide-react"; // Ensure lucide-react is installed

const FloatingNewTripsButton = ({ mode, onOpen }) => {
  const [expanded, setExpanded] = useState(true);
  const [scrolled, setScrolled] = useState(false);
    const [currentTab, setCurrentTab] = useState(0); 
  const isDarkMode = mode === 'dark';

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const isScrolled = window.scrollY > 20;
          setScrolled((prev) => (prev !== isScrolled ? isScrolled : prev));
          if (isScrolled) setExpanded(false);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setExpanded(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Box sx={{ position: "fixed", bottom: 85, right: 41, zIndex: 1100, pointerEvents: "none" }}>
              <Box sx={{ px: 2.3, mt: 1 }}>
        <Tabs
          value={currentTab}
          onChange={(_, v) => setCurrentTab(v)}
          variant="fullWidth"
          sx={{
            minHeight: 36,
            height: 36,
            backgroundColor: isDarkMode ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.04)",
            borderRadius: 8,
            backdropFilter: "blur(12px) saturate(180%)",
            wenkitBackdropFilter: "blur(12px) saturate(180%)",boxShadow: mode === "dark"
          ? `inset 0 1px 1px rgba(255, 255, 255, 0.11), inset 0 -1px 1px rgba(35, 35, 35, 0.07)`
          : `inset 0 1px 1px rgba(255,255,255,0.8), inset 0 -1px 1px rgba(0,0,0,0.1)`,
            p: '3px',
            '& .MuiTabs-indicator': {
              height: '100%',
              borderRadius: 8,
              backgroundColor: isDarkMode ? "#ffffff" : "#111111",
              boxShadow: mode === "dark"
          ? `inset 0 1px 1px rgba(0, 0, 0, 0.39), inset 0 -1px 1px rgba(0, 0, 0, 0.07)`
          : `inset 0 1px 1px rgba(255, 255, 255, 0.46), inset 0 -1px 1px rgba(255, 255, 255, 0.1)`,
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1) !important',
            },
            '& .MuiTabs-flexContainer': {
              height: '100%',
            }
          }}
        >
          {['All', 'Upcoming', 'Ongoing', 'Past'].map((lbl, idx) => {
            const isSelected = currentTab === idx;
            return (
              <Tab
                label={lbl}
                key={idx}
                disableRipple
                sx={{
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: '0.75rem',
                  letterSpacing: '0.01em',
                  minHeight: '100%',
                  height: '100%',
                  zIndex: 1,
                  color: isDarkMode ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.56)',
                  transition: 'color 0.2s ease',
                  '&.Mui-selected': {
                    color: isDarkMode ? '#000000' : '#ffffff',
                  },
                  '&:hover': {
                    color: isSelected 
                      ? (isDarkMode ? '#000000' : '#ffffff') 
                      : (isDarkMode ? '#ffffff' : '#000000'),
                    opacity: isSelected ? 1 : 0.85,
                  }
                }}
              />
            );
          })}
        </Tabs>
      </Box>
      
      <Button
        onClick={onOpen} // Call the parent prop directly here
        onMouseEnter={() => !scrolled && setExpanded(true)}
        onMouseLeave={() => !scrolled && setExpanded(false)}
        startIcon={<SquarePen sx={{ fontSize: expanded ? 27 : 42 }} />}
        sx={{
          pointerEvents: "auto",
          position: "relative",
          overflow: "hidden",
          minWidth: expanded ? { xs: "130px", md: "200px" } : 56,
          height: 56,
          borderRadius: expanded ? "35px" : "50%",
          px: expanded ? 3 : 0,
          transition: "all 0.45s cubic-bezier(0.4, 0, 0.2, 1)",
          willChange: "transform, min-width, border-radius",
          backdropFilter: "blur(2px) saturate(2)",
          WebkitBackdropFilter: "blur(2px) saturate(2)",
          background: mode === "dark" ? "rgba(0, 0, 0, 0.65)" : "rgba(255, 255, 255, 0.25)",
          color: mode === "dark" ? "#fff" : "#000",
          boxShadow: mode === "dark"
            ? `inset 0 1px 2px rgba(255, 255, 255, 0.11), inset 0 -1px 1px rgba(35, 35, 35, 0.07)`
            : `inset 0 1px 1px rgba(255,255,255,0.8), inset 0 -1px 1px rgba(0,0,0,0.1)`,
          "& .MuiButton-startIcon": {
            margin: expanded ? "0 8px 0 0" : 0,
            marginLeft: expanded ? 0 : "0px",
          },
          "&::before": {
            content: '""', position: "absolute", top: 0, left: "-75%", width: "50%", height: "100%",
            background: "linear-gradient(120deg, transparent, rgba(255, 255, 255, 0.17), transparent)",
            transform: "skewX(-20deg)", transition: "all 0.6s ease",
          },
          "&:hover::before": { left: "125%" },
          "&::after": {
            content: '""', position: "absolute", inset: 0, borderRadius: "inherit",
            background: "linear-gradient(to bottom right, rgba(255, 255, 255, 0.13), transparent)",
            opacity: 0.3, pointerEvents: "none",
          },
          "&:hover": { transform: "scale(1.05)" },
        }}
      >
        <AnimatePresence>
          {expanded && (
            <motion.span
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              exit={{ opacity: 0, width: 0 }}
              style={{ whiteSpace: "nowrap", fontWeight: 300, overflow: "hidden" }}
            >
              New Trip
            </motion.span>
          )}
        </AnimatePresence>
      </Button>
    </Box>
  );
};

export default FloatingNewTripsButton;