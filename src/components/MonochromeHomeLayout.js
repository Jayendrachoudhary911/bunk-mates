import React from "react";
import { Box, Container, ThemeProvider } from "@mui/material";
import { ProgressiveBlur } from "./ProgressiveBlur";

export default function MonochromeHomeLayout({ mode, theme, children }) {
  const isDark = mode === "dark";

  return (
    <ThemeProvider theme={theme}>
      <Box
        sx={{
          display: "flex",
          minHeight: "100vh",
          flexDirection: "column",
          backgroundColor: isDark ? "#000000" : "#f1f1f1",
          color: isDark ? "#ffffff" : "#000000",
          position: "relative",
          overflowX: "hidden",
        }}
      >
        <ProgressiveBlur mode={mode} height={240} />
        
        <Container
          maxWidth="lg"
          sx={{
            position: "relative",
            zIndex: 3,
            borderRadius: "32px",
            boxShadow: isDark
              ? "inset 0 1px 1px rgba(255, 255, 255, 0.11), inset 0 -1px 1px rgba(255, 255, 255, 0.07), 0 1px 0px rgba(0,0,0,0.1)"
              : "inset 0 1px 1px rgba(255,255,255,0.8), inset 0 -1px 1px rgba(0,0,0,0.1), 0 1px 0px rgba(0,0,0,0.1)",
            backdropFilter: "blur(30px)",
            backgroundColor: isDark ? "rgba(30,30,30,0.22)" : "rgba(255,255,255,0.4)",
            my: 4,
            p: 3,
          }}
        >
          {children}
        </Container>
      </Box>
    </ThemeProvider>
  );
}

export { MonochromeHomeLayout };
