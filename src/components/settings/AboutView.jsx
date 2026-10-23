import React from "react";
import {
  Box,
  Typography,
} from "@mui/material";
import {
  OpenInNew,
  ArrowForwardIos,
  Instagram,
  YouTube,
  DescriptionOutlined,
  VerifiedUserOutlined,
  MenuBookOutlined,
} from "../../icons";
import {
  SettingsHeader,
  SettingsCard,
  SettingsSectionTitle,
  SETTINGS_THEME,
} from "./SettingsComponents";

export const AboutView = ({ onBack, onOpenLicenses }) => {
  return (
    <Box sx={{ minHeight: "100%", pb: 6, backgroundColor: SETTINGS_THEME.bg }}>
      <SettingsHeader title="About BunkMates" onBack={onBack} />

      {/* App Icon, Name, and Version */}
      <Box sx={{ textAlign: "center", mt: 2, mb: 4 }}>
        <Box
          sx={{
            width: 88,
            height: 88,
            borderRadius: "24px",
            backgroundColor: "#FFFFFF",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 8px 30px rgba(0, 0, 0, 0.4)",
            mb: 2,
            p: 1.5,
          }}
        >
          <Box
            component="img"
            src="/logo.svg"
            alt="BunkMates Logo"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = "/logo512.png";
            }}
            sx={{ width: 56, height: 56, objectFit: "contain" }}
          />
        </Box>

        <Typography
          variant="h5"
          sx={{
            fontWeight: 800,
            color: "#FFFFFF",
            letterSpacing: "-0.01em",
            mb: 0.5,
          }}
        >
          BunkMates
        </Typography>

        <Typography
          sx={{
            color: SETTINGS_THEME.textSecondary,
            fontSize: "0.92rem",
            fontWeight: 500,
          }}
        >
          Version 3.4.1 (Build 4108)
        </Typography>
      </Box>

      {/* LEGAL AGREEMENTS */}
      <SettingsSectionTitle>LEGAL AGREEMENTS</SettingsSectionTitle>
      <SettingsCard sx={{ p: 0 }}>
        {/* Terms & Condition */}
        <Box
          component="a"
          href="https://app.bunkmates.xyz/terms"
          target="_blank"
          rel="noopener noreferrer"
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            py: 2,
            px: 2.5,
            textDecoration: "none",
            borderBottom: `1px solid ${SETTINGS_THEME.divider}`,
            transition: "background-color 0.2s",
            "&:hover": {
              backgroundColor: "rgba(255, 255, 255, 0.04)",
            },
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.8 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                backgroundColor: SETTINGS_THEME.iconBg,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#FFFFFF",
              }}
            >
              <DescriptionOutlined sx={{ fontSize: 20 }} />
            </Box>
            <Box>
              <Typography sx={{ fontWeight: 600, fontSize: "0.98rem", color: "#FFFFFF" }}>
                Terms & Condition
              </Typography>
              <Typography sx={{ fontSize: "0.82rem", color: SETTINGS_THEME.textSecondary }}>
                app.bunkmates.xyz/terms
              </Typography>
            </Box>
          </Box>
          <OpenInNew sx={{ fontSize: 18, color: "rgba(255, 255, 255, 0.3)" }} />
        </Box>

        {/* Privacy Policy */}
        <Box
          component="a"
          href="https://app-beta.bunkmates.xyz/privacy-policy"
          target="_blank"
          rel="noopener noreferrer"
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            py: 2,
            px: 2.5,
            textDecoration: "none",
            borderBottom: `1px solid ${SETTINGS_THEME.divider}`,
            transition: "background-color 0.2s",
            "&:hover": {
              backgroundColor: "rgba(255, 255, 255, 0.04)",
            },
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.8 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                backgroundColor: SETTINGS_THEME.iconBg,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#FFFFFF",
              }}
            >
              <VerifiedUserOutlined sx={{ fontSize: 20 }} />
            </Box>
            <Box>
              <Typography sx={{ fontWeight: 600, fontSize: "0.98rem", color: "#FFFFFF" }}>
                Privacy Policy
              </Typography>
              <Typography sx={{ fontSize: "0.82rem", color: SETTINGS_THEME.textSecondary }}>
                app-beta.bunkmates.xyz/privacy-policy
              </Typography>
            </Box>
          </Box>
          <OpenInNew sx={{ fontSize: 18, color: "rgba(255, 255, 255, 0.3)" }} />
        </Box>

        {/* Open Source Licenses */}
        <Box
          onClick={onOpenLicenses}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onOpenLicenses();
            }
          }}
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            py: 2,
            px: 2.5,
            cursor: "pointer",
            transition: "background-color 0.2s",
            "&:hover": {
              backgroundColor: "rgba(255, 255, 255, 0.04)",
            },
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.8 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                backgroundColor: SETTINGS_THEME.iconBg,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#FFFFFF",
              }}
            >
              <MenuBookOutlined sx={{ fontSize: 20 }} />
            </Box>
            <Box>
              <Typography sx={{ fontWeight: 600, fontSize: "0.98rem", color: "#FFFFFF" }}>
                Open Source Licenses
              </Typography>
              <Typography sx={{ fontSize: "0.82rem", color: SETTINGS_THEME.textSecondary }}>
                Third-party libraries & acknowledgments
              </Typography>
            </Box>
          </Box>
          <ArrowForwardIos sx={{ fontSize: 14, color: "rgba(255, 255, 255, 0.3)" }} />
        </Box>
      </SettingsCard>

      {/* Connect With Us */}
      <SettingsSectionTitle>Connect With Us</SettingsSectionTitle>
      <SettingsCard sx={{ py: 2.5, px: 3 }}>
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 3 }}>
          {/* LinkedIn */}
          <Box
            component="a"
            href="https://www.linkedin.com/company/bunkmates"
            target="_blank"
            rel="noopener noreferrer"
            sx={{
              width: 54,
              height: 54,
              borderRadius: "50%",
              backgroundColor: "#202024",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#FFFFFF",
              textDecoration: "none",
              border: `1px solid ${SETTINGS_THEME.divider}`,
              transition: "transform 0.2s, background-color 0.2s",
              "&:hover": {
                transform: "translateY(-2px)",
                backgroundColor: "#2A2A30",
              },
            }}
          >
            <Typography sx={{ fontWeight: 800, fontSize: "1.1rem" }}>in</Typography>
          </Box>

          {/* YouTube */}
          <Box
            component="a"
            href="https://www.youtube.com/@Team_BunkMates"
            target="_blank"
            rel="noopener noreferrer"
            sx={{
              width: 54,
              height: 54,
              borderRadius: "50%",
              backgroundColor: "#202024",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#FFFFFF",
              textDecoration: "none",
              border: `1px solid ${SETTINGS_THEME.divider}`,
              transition: "transform 0.2s, background-color 0.2s",
              "&:hover": {
                transform: "translateY(-2px)",
                backgroundColor: "#2A2A30",
              },
            }}
          >
            <YouTube sx={{ fontSize: 24 }} />
          </Box>

          {/* Instagram */}
          <Box
            component="a"
            href="https://www.instagram.com/bunkmates.app"
            target="_blank"
            rel="noopener noreferrer"
            sx={{
              width: 54,
              height: 54,
              borderRadius: "50%",
              backgroundColor: "#202024",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#FFFFFF",
              textDecoration: "none",
              border: `1px solid ${SETTINGS_THEME.divider}`,
              transition: "transform 0.2s, background-color 0.2s",
              "&:hover": {
                transform: "translateY(-2px)",
                backgroundColor: "#2A2A30",
              },
            }}
          >
            <Instagram sx={{ fontSize: 22 }} />
          </Box>
        </Box>
      </SettingsCard>

      {/* Copyright Footer */}
      <Box sx={{ textAlign: "center", mt: 6 }}>
        <Typography
          sx={{
            fontSize: "0.82rem",
            color: "#7E828D",
            fontWeight: 500,
          }}
        >
          © 2026 BunkMates Inc. All rights reserved.
        </Typography>
      </Box>
    </Box>
  );
};

export default AboutView;
