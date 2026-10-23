import React from "react";
import { Box, Typography } from "@mui/material";
import {
  SettingsHeader,
  SettingsCard,
  SETTINGS_THEME,
} from "./SettingsComponents";

const LIBRARIES = [
  {
    name: "React.js / React Native",
    description: "Core Application UI & Framework — MIT License",
  },
  {
    name: "Firebase (Auth, Firestore, Messaging)",
    description: "Backend Services, Cloud Messaging, Data Storage — Apache License 2.0",
  },
  {
    name: "Material UI (v5)",
    description: "UI Components & Design System — MIT License",
  },
  {
    name: "OpenWeatherMap API",
    description: "Real-Time Weather Data — CC BY-SA 4.0",
  },
  {
    name: "Google Fonts",
    description: "Typography Fonts — SIL Open Font License 1.1",
  },
  {
    name: "Material Icons",
    description: "UI Icons / Visual Assets — Apache License 2.0",
  },
  {
    name: "framer-motion",
    description: "Advanced UI Animations — MIT License",
  },
  {
    name: "@fullcalendar/react, daygrid, etc.",
    description: "Calendar & Scheduling — MIT / Commercial Dual License",
  },
  {
    name: "dayjs / date-fns",
    description: "Date & Time Handling — MIT License",
  },
  {
    name: "react-easy-crop",
    description: "Image Cropping & Manipulation — MIT License",
  },
];

export const LicensesView = ({ onBack }) => {
  return (
    <Box sx={{ minHeight: "100%", pb: 6, backgroundColor: SETTINGS_THEME.bg }}>
      <SettingsHeader title="Licenses & Attributions" onBack={onBack} />

      <Box sx={{ px: 2, mb: 3 }}>
        <Typography
          variant="h5"
          sx={{
            fontWeight: 800,
            color: "#FFFFFF",
            letterSpacing: "-0.01em",
            mb: 2,
            lineHeight: 1.25,
          }}
        >
          Third-Party Licenses & Attributions
        </Typography>

        <Typography
          sx={{
            color: SETTINGS_THEME.textSecondary,
            fontSize: "0.9rem",
            lineHeight: 1.6,
          }}
        >
          This page lists all open-source and third-party libraries used in BunkMates,
          along with their license types and attributions. We ensure full compliance by
          including the necessary license text, copyright notices, and usage terms for
          every component.
        </Typography>
      </Box>

      {/* Library Overview Section */}
      <Box sx={{ px: 2, mb: 1.5 }}>
        <Typography
          sx={{
            fontSize: "1.05rem",
            fontWeight: 700,
            color: "#FFFFFF",
          }}
        >
          Library Overview
        </Typography>
      </Box>

      <SettingsCard sx={{ p: 0 }}>
        {LIBRARIES.map((lib, idx) => (
          <Box
            key={lib.name}
            sx={{
              py: 2,
              px: 2.5,
              borderBottom:
                idx === LIBRARIES.length - 1
                  ? "none"
                  : `1px solid ${SETTINGS_THEME.divider}`,
            }}
          >
            <Typography
              sx={{
                fontWeight: 600,
                fontSize: "0.98rem",
                color: "#FFFFFF",
                mb: 0.4,
              }}
            >
              {lib.name}
            </Typography>
            <Typography
              sx={{
                fontSize: "0.82rem",
                color: SETTINGS_THEME.textSecondary,
              }}
            >
              {lib.description}
            </Typography>
          </Box>
        ))}
      </SettingsCard>
    </Box>
  );
};

export default LicensesView;
