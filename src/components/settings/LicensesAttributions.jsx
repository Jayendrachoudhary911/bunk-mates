import React from "react";
import { Box, Typography } from "@mui/material";
import {
  SettingsLayout,
  SettingsHeader,
  SettingsSection,
  SettingsGroup,
  SettingsRow,
  SETTINGS_THEME,
} from "./SettingsShared";

const LIBRARIES = [
  {
    name: "React.js / React Native",
    details: "Core Application UI & Framework — MIT License",
  },
  {
    name: "Firebase (Auth, Firestore, Messaging)",
    details: "Backend Services, Cloud Messaging, Data Storage — Apache License 2.0",
  },
  {
    name: "Material UI (v5)",
    details: "UI Components & Design System — MIT License",
  },
  {
    name: "OpenWeatherMap API",
    details: "Real-Time Weather Data — CC BY-SA 4.0",
  },
  {
    name: "Google Fonts",
    details: "Typography Fonts — SIL Open Font License 1.1",
  },
  {
    name: "Material Icons",
    details: "UI Icons / Visual Assets — Apache License 2.0",
  },
  {
    name: "framer-motion",
    details: "Advanced UI Animations — MIT License",
  },
  {
    name: "@fullcalendar/react, daygrid, etc.",
    details: "Calendar & Scheduling — MIT / Commercial Dual License",
  },
  {
    name: "dayjs / date-fns",
    details: "Date & Time Handling — MIT License",
  },
  {
    name: "react-easy-crop",
    details: "Image Cropping & Manipulation — MIT License",
  },
];

export default function LicensesAttributions({ onBack }) {
  return (
    <SettingsLayout>
      <SettingsHeader title="Licenses & Attributions" onBack={onBack} />

      <Box sx={{ mt: 1, mb: 3 }}>
        <Typography
          variant="h5"
          sx={{
            fontWeight: 800,
            fontSize: { xs: "1.55rem", sm: "1.8rem" },
            color: SETTINGS_THEME.textPrimary,
            letterSpacing: -0.5,
            lineHeight: 1.25,
            mb: 1.5,
          }}
        >
          Third-Party Licenses & Attributions
        </Typography>

        <Typography
          variant="body2"
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

      <SettingsSection title="Library Overview" sx={{ ml: 0.5, mt: 1 }} />

      <SettingsGroup>
        {LIBRARIES.map((lib, idx) => (
          <SettingsRow
            key={lib.name}
            title={lib.name}
            subtitle={lib.details}
            showChevron={false}
            showDivider={idx < LIBRARIES.length - 1}
          />
        ))}
      </SettingsGroup>
    </SettingsLayout>
  );
}
