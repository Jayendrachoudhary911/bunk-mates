import React from "react";
import { Box, Typography } from "@mui/material";
import {
  SettingsLayout,
  SettingsHeader,
  SettingsSection,
  SettingsGroup,
  SettingsSwitchRow,
  SettingsSegmentedControl,
  SETTINGS_THEME,
} from "./SettingsShared";

export default function MapsNavigationView({
  onBack,
  preferences,
  onUpdatePreferences,
}) {
  const maps = preferences.maps || {};

  const updateField = (field, value) => {
    onUpdatePreferences({
      ...preferences,
      maps: {
        ...maps,
        [field]: value,
      },
    });
  };

  return (
    <SettingsLayout>
      <SettingsHeader title="Maps & Navigation" onBack={onBack} />

      {/* Map Provider */}
      <SettingsSection title="PREFERRED NAVIGATION APP" sx={{ ml: 0.5, mt: 0 }} />
      <SettingsGroup sx={{ p: 1.5, mb: 3 }}>
        <SettingsSegmentedControl
          value={maps.preferredMapApp || "google"}
          onChange={(val) => updateField("preferredMapApp", val)}
          options={[
            { label: "Google Maps", value: "google" },
            { label: "Apple Maps", value: "apple" },
            { label: "Waze", value: "waze" },
          ]}
        />
        <Typography variant="caption" sx={{ color: SETTINGS_THEME.textSecondary, mt: 1, ml: 0.5, display: "block" }}>
          External navigation directions and coordinates will open automatically in this app.
        </Typography>
      </SettingsGroup>

      {/* Distance Units */}
      <SettingsSection title="DISTANCE UNITS" sx={{ ml: 0.5 }} />
      <SettingsGroup sx={{ p: 1.5, mb: 3 }}>
        <SettingsSegmentedControl
          value={maps.distanceUnits || "km"}
          onChange={(val) => updateField("distanceUnits", val)}
          options={[
            { label: "Kilometers (km)", value: "km" },
            { label: "Miles (mi)", value: "miles" },
          ]}
        />
      </SettingsGroup>

      {/* Route Preferences */}
      <SettingsSection title="ROUTE PREFERENCES" sx={{ ml: 0.5 }} />
      <SettingsGroup sx={{ mb: 3 }}>
        <SettingsSwitchRow
          title="Auto-Reroute"
          subtitle="Recalculate route automatically when deviating from destination"
          checked={Boolean(maps.autoReroute)}
          onChange={(v) => updateField("autoReroute", v)}
          showDivider
        />

        <SettingsSwitchRow
          title="Avoid Tolls"
          subtitle="Prioritize toll-free highways and alternate secondary routes"
          checked={Boolean(maps.avoidTolls)}
          onChange={(v) => updateField("avoidTolls", v)}
        />
      </SettingsGroup>

      {/* Map Style & POI */}
      <SettingsSection title="MAP DISPLAY & STYLE" sx={{ ml: 0.5 }} />
      <SettingsGroup sx={{ p: 1.5, mb: 3 }}>
        <Box sx={{ mb: 1.5 }}>
          <SettingsSegmentedControl
            value={maps.mapStyle || "standard"}
            onChange={(val) => updateField("mapStyle", val)}
            options={[
              { label: "Standard", value: "standard" },
              { label: "Satellite", value: "satellite" },
              { label: "Terrain", value: "terrain" },
            ]}
          />
        </Box>
        <SettingsSwitchRow
          title="Show Points of Interest"
          subtitle="Display landmarks, cafes, hostels, and gas stations on map"
          checked={Boolean(maps.showPointsOfInterest)}
          onChange={(v) => updateField("showPointsOfInterest", v)}
        />
      </SettingsGroup>
    </SettingsLayout>
  );
}
