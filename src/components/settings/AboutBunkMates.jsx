import React from "react";
import { Box, Typography, IconButton } from "@mui/material";
import {
  DescriptionOutlined,
  SecurityOutlined,
  ArticleOutlined,
} from "@mui/icons-material";
import {
  SettingsLayout,
  SettingsHeader,
  SettingsSection,
  SettingsGroup,
  SettingsRow,
  SETTINGS_THEME,
} from "./SettingsShared";

export default function AboutBunkMates({ onBack, onNavigateLicenses }) {
  const openExternal = (url) => {
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <SettingsLayout>
      <SettingsHeader title="About BunkMates" onBack={onBack} />

      {/* Brand Hero Block */}
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          mt: 2,
          mb: 4,
          textAlign: "center",
        }}
      >
        <Box
          sx={{
            width: 86,
            height: 86,
            borderRadius: "24px",
            bgcolor: "#FFFFFF",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 8px 30px rgba(0, 0, 0, 0.4)",
            mb: 2.2,
          }}
        >
          <img
            src="/logo.svg"
            alt="BunkMates Logo"
            style={{ width: 52, height: 52, objectFit: "contain" }}
            onError={(e) => {
              // Fallback SVG icon if logo.svg not reachable
              e.currentTarget.style.display = "none";
            }}
          />
        </Box>

        <Typography
          variant="h5"
          sx={{
            fontWeight: 800,
            color: SETTINGS_THEME.textPrimary,
            letterSpacing: -0.3,
            mb: 0.5,
          }}
        >
          BunkMates
        </Typography>

        <Typography
          variant="body2"
          sx={{
            color: SETTINGS_THEME.textSecondary,
            fontSize: "0.88rem",
          }}
        >
          Version 3.4.1 (Build 4108)
        </Typography>
      </Box>

      {/* Legal Agreements Section */}
      <SettingsSection title="LEGAL AGREEMENTS" />

      <SettingsGroup>
        <SettingsRow
          icon={DescriptionOutlined}
          title="Terms & Condition"
          subtitle="app.bunkmates.xyz/terms"
          isExternal
          showChevron
          showDivider
          onClick={() => openExternal("https://app.bunkmates.xyz/terms")}
        />

        <SettingsRow
          icon={SecurityOutlined}
          title="Privacy Policy"
          subtitle="app-beta.bunkmates.xyz/privacy-policy"
          isExternal
          showChevron
          showDivider
          onClick={() => openExternal("https://app-beta.bunkmates.xyz/privacy-policy")}
        />

        <SettingsRow
          icon={ArticleOutlined}
          title="Open Source Licenses"
          subtitle="Third-party libraries & acknowledgments"
          showChevron
          onClick={onNavigateLicenses}
        />
      </SettingsGroup>

      {/* Connect With Us Section */}
      <SettingsSection title="Connect With Us" sx={{ mt: 3 }} />

      <SettingsGroup sx={{ py: 2.5, px: 2, alignItems: "center" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2.5, justifyContent: "center" }}>
          {/* LinkedIn */}
          <IconButton
            onClick={() => openExternal("https://linkedin.com/company/bunkmates")}
            aria-label="LinkedIn"
            sx={{
              width: 52,
              height: 52,
              borderRadius: "50%",
              bgcolor: SETTINGS_THEME.surface,
              color: SETTINGS_THEME.textPrimary,
              border: "1px solid rgba(255, 255, 255, 0.05)",
              fontWeight: 800,
              fontSize: "1.1rem",
              fontFamily: "sans-serif",
              "&:hover": {
                bgcolor: "rgba(255, 255, 255, 0.15)",
                color: "#0A66C2",
              },
            }}
          >
            in
          </IconButton>

          {/* YouTube */}
          <IconButton
            onClick={() => openExternal("https://youtube.com/@bunkmates")}
            aria-label="YouTube"
            sx={{
              width: 52,
              height: 52,
              borderRadius: "50%",
              bgcolor: SETTINGS_THEME.surface,
              color: SETTINGS_THEME.textPrimary,
              border: "1px solid rgba(255, 255, 255, 0.05)",
              "&:hover": {
                bgcolor: "rgba(255, 255, 255, 0.15)",
                color: "#FF0000",
              },
            }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
            </svg>
          </IconButton>

          {/* Instagram */}
          <IconButton
            onClick={() => openExternal("https://instagram.com/bunkmates")}
            aria-label="Instagram"
            sx={{
              width: 52,
              height: 52,
              borderRadius: "50%",
              bgcolor: SETTINGS_THEME.surface,
              color: SETTINGS_THEME.textPrimary,
              border: "1px solid rgba(255, 255, 255, 0.05)",
              "&:hover": {
                bgcolor: "rgba(255, 255, 255, 0.15)",
                color: "#E1306C",
              },
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
              <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
              <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
            </svg>
          </IconButton>
        </Box>
      </SettingsGroup>

      {/* Copyright */}
      <Typography
        variant="caption"
        align="center"
        sx={{
          color: SETTINGS_THEME.textSecondary,
          fontSize: "0.8rem",
          mt: 4,
          mb: 2,
          display: "block",
        }}
      >
        © 2026 BunkMates Inc. All rights reserved.
      </Typography>
    </SettingsLayout>
  );
}
