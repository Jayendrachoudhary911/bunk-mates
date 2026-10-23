import React from "react";
import { Box } from "@mui/material";

export const ProgressiveBlur = ({ mode, height = 200 }) => (
  <Box
    sx={{
      position: "absolute",
      top: -5,
      left: 0,
      right: 0,
      height: height,
      zIndex: -1,
      mx: -2,
      pointerEvents: "none",
      backdropFilter: "blur(80px)",
      WebkitBackdropFilter: "blur(80px)",
      maskImage: `linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0.92) 18%, rgba(0,0,0,0.72) 38%, rgba(0,0,0,0.42) 62%, rgba(0,0,0,0.12) 82%, rgba(0,0,0,0) 100%)`,
      WebkitMaskImage: `linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0.92) 18%, rgba(0,0,0,0.72) 38%, rgba(0,0,0,0.42) 62%, rgba(0,0,0,0.12) 82%, rgba(0,0,0,0) 100%)`,
      background:
        mode === "dark"
          ? "linear-gradient(to bottom, rgba(0,0,0,0), rgba(0,0,0,0))"
          : "linear-gradient(to bottom, rgba(255,255,255,0), rgba(255,255,255,0))",
    }}
  />
);

export default ProgressiveBlur;
