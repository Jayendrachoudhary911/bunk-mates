import React from "react";
import { Box } from "@mui/material";

/**
 * ProgressiveBlur Component
 * Renders an ultra-smooth progressive backdrop blur gradient with theme-aware ambient tint.
 * Supports both top-down blur (for headers/AppBars) and bottom-up blur (for bottom input bars/navs).
 *
 * @param {string} mode - "dark" | "light"
 * @param {"bottom" | "top"} direction - "bottom" (fade top->bottom) or "top" (fade bottom->top)
 * @param {string|number} height - Height of the blur layer (e.g. "100%", 200, "120px")
 * @param {string} blur - CSS blur radius (e.g. "20px", "28px", "40px", "80px")
 * @param {number} zIndex - zIndex of the blur layer (default 0)
 * @param {object} sx - Additional MUI sx overrides
 */
export const ProgressiveBlur = ({
  mode = "dark",
  direction = "bottom",
  height = "100%",
  blur = "28px",
  zIndex = 0,
  sx = {},
}) => {
  const isBottom = direction === "bottom";
  const gradientDir = isBottom ? "to bottom" : "to top";
  const isDark = mode === "dark";

  // Math cosine-inspired multi-stop curve for seamless, natural optical transition
  const maskGradient = `linear-gradient(${gradientDir}, rgba(0,0,0,1) 0%, rgba(0,0,0,0.92) 18%, rgba(0,0,0,0.72) 38%, rgba(0,0,0,0.42) 62%, rgba(0,0,0,0.12) 82%, rgba(0,0,0,0) 100%)`;

  const bgGradient = isDark
    ? `linear-gradient(${gradientDir}, rgba(12, 12, 14, 0.88) 0%, rgba(12, 12, 14, 0.76) 28%, rgba(12, 12, 14, 0.48) 58%, rgba(12, 12, 14, 0.16) 84%, rgba(12, 12, 14, 0) 100%)`
    : `linear-gradient(${gradientDir}, rgba(255, 255, 255, 0.92) 0%, rgba(255, 255, 255, 0.82) 28%, rgba(255, 255, 255, 0.54) 58%, rgba(255, 255, 255, 0.18) 84%, rgba(255, 255, 255, 0) 100%)`;

  return (
    <Box
      sx={{
        position: "absolute",
        top: isBottom ? 0 : "auto",
        bottom: isBottom ? "auto" : 0,
        left: 0,
        right: 0,
        height,
        zIndex,
        pointerEvents: "none",
        backdropFilter: `blur(${blur})`,
        WebkitBackdropFilter: `blur(${blur})`,
        maskImage: maskGradient,
        WebkitMaskImage: maskGradient,
        background: bgGradient,
        ...sx,
      }}
    />
  );
};

export default ProgressiveBlur;
