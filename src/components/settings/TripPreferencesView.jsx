import React from "react";
import { Box, Typography, Chip } from "@mui/material";
import {
  SettingsLayout,
  SettingsHeader,
  SettingsSection,
  SettingsGroup,
  SettingsSwitchRow,
  SettingsSegmentedControl,
  SETTINGS_THEME,
} from "./SettingsShared";

const ACCOMMODATIONS = [
  { id: "hostel", label: "Hostel" },
  { id: "hotel", label: "Hotel" },
  { id: "airbnb", label: "Airbnb / Rental" },
  { id: "camping", label: "Camping / Outdoors" },
  { id: "boutique", label: "Boutique Hotel" },
  { id: "guesthouse", label: "Guesthouse / Homestay" },
];

const DIET_OPTIONS = [
  { id: "noRestrictions", label: "No Restrictions" },
  { id: "vegetarian", label: "Vegetarian" },
  { id: "vegan", label: "Vegan" },
  { id: "glutenFree", label: "Gluten-Free" },
  { id: "halal", label: "Halal" },
  { id: "kosher", label: "Kosher" },
];

export default function TripPreferencesView({
  onBack,
  preferences,
  onUpdatePreferences,
}) {
  const tripPrefs = preferences.tripPreferences || {};

  const updateField = (field, value) => {
    onUpdatePreferences({
      ...preferences,
      tripPreferences: {
        ...tripPrefs,
        [field]: value,
      },
    });
  };

  const toggleAccommodation = (accId) => {
    const current = tripPrefs.accommodations || [];
    const updated = current.includes(accId)
      ? current.filter((id) => id !== accId)
      : [...current, accId];
    updateField("accommodations", updated);
  };

  return (
    <SettingsLayout>
      <SettingsHeader title="Trip Preferences" onBack={onBack} />

      {/* Mode */}
      <SettingsSection title="PREFERENCE MODE" sx={{ ml: 0.5, mt: 0 }} />
      <SettingsGroup sx={{ p: 1.5, mb: 3 }}>
        <SettingsSegmentedControl
          value={tripPrefs.mode || "auto"}
          onChange={(val) => updateField("mode", val)}
          options={[
            { label: "Auto (Smart Recommendations)", value: "auto" },
            { label: "Manual (Strict Preferences)", value: "manual" },
          ]}
        />
        <Typography variant="caption" sx={{ color: SETTINGS_THEME.textSecondary, mt: 1, ml: 0.5, display: "block" }}>
          {tripPrefs.mode === "auto"
            ? "Suggestions adapt based on your travel history, season, and companions."
            : "Trip builder will strictly follow your configured travel constraints."}
        </Typography>
      </SettingsGroup>

      {/* Default Trip Visibility */}
      <SettingsSection title="DEFAULT TRIP VISIBILITY" sx={{ ml: 0.5 }} />
      <SettingsGroup sx={{ p: 1.5, mb: 3 }}>
        <SettingsSegmentedControl
          value={tripPrefs.defaultTripStyle || "public"}
          onChange={(val) => updateField("defaultTripStyle", val)}
          options={[
            { label: "Public Trip", value: "public" },
            { label: "Private (Invite-Only)", value: "private" },
          ]}
        />
      </SettingsGroup>

      {/* Travel Style */}
      <SettingsSection title="PREFERRED TRAVEL STYLE" sx={{ ml: 0.5 }} />
      <SettingsGroup sx={{ p: 1.5, mb: 3 }}>
        <SettingsSegmentedControl
          value={tripPrefs.travelStyle || "midRange"}
          onChange={(val) => updateField("travelStyle", val)}
          options={[
            { label: "Budget", value: "budget" },
            { label: "Mid-Range", value: "midRange" },
            { label: "Luxury", value: "luxury" },
          ]}
        />
      </SettingsGroup>

      {/* Accommodations Multi-Select */}
      <SettingsSection title="PREFERRED ACCOMMODATIONS" sx={{ ml: 0.5 }} />
      <SettingsGroup sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
          {ACCOMMODATIONS.map((acc) => {
            const isSelected = (tripPrefs.accommodations || []).includes(acc.id);
            return (
              <Chip
                key={acc.id}
                label={acc.label}
                clickable
                onClick={() => toggleAccommodation(acc.id)}
                sx={{
                  bgcolor: isSelected ? SETTINGS_THEME.accent : SETTINGS_THEME.surface,
                  color: isSelected ? "#FFFFFF" : SETTINGS_THEME.textSecondary,
                  fontWeight: isSelected ? 700 : 500,
                  fontSize: "0.85rem",
                  borderRadius: "16px",
                  border: isSelected
                    ? `1px solid ${SETTINGS_THEME.accent}`
                    : "1px solid rgba(255, 255, 255, 0.08)",
                  "&:hover": {
                    bgcolor: isSelected ? SETTINGS_THEME.accent : "rgba(255, 255, 255, 0.1)",
                  },
                }}
              />
            );
          })}
        </Box>
      </SettingsGroup>

      {/* Diet & Lifestyle */}
      <SettingsSection title="DIET & LIFESTYLE" sx={{ ml: 0.5 }} />
      <SettingsGroup sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
          {DIET_OPTIONS.map((diet) => {
            const isSelected = (tripPrefs.diet || "noRestrictions") === diet.id;
            return (
              <Chip
                key={diet.id}
                label={diet.label}
                clickable
                onClick={() => updateField("diet", diet.id)}
                sx={{
                  bgcolor: isSelected ? SETTINGS_THEME.accent : SETTINGS_THEME.surface,
                  color: isSelected ? "#FFFFFF" : SETTINGS_THEME.textSecondary,
                  fontWeight: isSelected ? 700 : 500,
                  fontSize: "0.85rem",
                  borderRadius: "16px",
                  border: isSelected
                    ? `1px solid ${SETTINGS_THEME.accent}`
                    : "1px solid rgba(255, 255, 255, 0.08)",
                  "&:hover": {
                    bgcolor: isSelected ? SETTINGS_THEME.accent : "rgba(255, 255, 255, 0.1)",
                  },
                }}
              />
            );
          })}
        </Box>
      </SettingsGroup>

      {/* Smart Recommendations */}
      <SettingsSection title="SMART AI ITINERARIES" sx={{ ml: 0.5 }} />
      <SettingsGroup>
        <SettingsSwitchRow
          title="Enable AI Recommendations"
          subtitle="Allow BunkMates AI to suggest curated restaurants, hidden gems, and optimal routes"
          checked={Boolean(tripPrefs.smartRecommendations)}
          onChange={(v) => updateField("smartRecommendations", v)}
        />
      </SettingsGroup>
    </SettingsLayout>
  );
}
