import React from "react";
import { Box, Typography } from "@mui/material";
import { motion, AnimatePresence } from "framer-motion";

export default function CallReactionsOverlay({ reactions = [] }) {
  return (
    <Box
      sx={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        zIndex: 50,
        overflow: "hidden",
      }}
    >
      <AnimatePresence>
        {reactions.map((rx) => {
          // Generate a varied horizontal starting position across the width
          const randomX = ((rx.id.charCodeAt(0) || 40) * 17) % 70 + 15; // 15% to 85%

          return (
            <motion.div
              key={rx.id}
              initial={{ opacity: 0, y: 150, scale: 0.5, x: `${randomX}%` }}
              animate={{
                opacity: [0, 1, 1, 0],
                y: -380,
                scale: [0.5, 1.4, 1.1, 0.9],
                rotate: [0, -10, 15, -5],
              }}
              transition={{ duration: 2.8, ease: "easeOut" }}
              style={{
                position: "absolute",
                bottom: 80,
                left: 0,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <Typography sx={{ fontSize: "2.8rem", filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.6))" }}>
                {rx.emoji}
              </Typography>
              {rx.senderName && (
                <Box
                  sx={{
                    bgcolor: "rgba(0,0,0,0.6)",
                    backdropFilter: "blur(8px)",
                    borderRadius: "99px",
                    px: 1,
                    py: 0.2,
                    mt: 0.3,
                    border: "1px solid rgba(255,255,255,0.15)",
                  }}
                >
                  <Typography variant="caption" sx={{ color: "#fff", fontSize: "0.65rem", fontWeight: 700 }}>
                    {rx.senderName}
                  </Typography>
                </Box>
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </Box>
  );
}
