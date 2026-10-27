import React from "react";
import { Typography } from "@mui/material";
import {
  WbSunnyOutlined,
  ThunderstormOutlined,
  AirOutlined,
} from "@mui/icons-material";
import {
  SettingsLayout,
  SettingsHeader,
  SettingsSection,
  SettingsGroup,
  SettingsSwitchRow,
  SettingsSegmentedControl,
  SETTINGS_THEME,
} from "./SettingsShared";

export default function WeatherAlertsView({
  onBack,
  preferences,
  onUpdatePreferences,
}) {
  const weather = preferences.weather || {};

  const updateField = (field, value) => {
    onUpdatePreferences({
      ...preferences,
      weather: {
        ...weather,
        [field]: value,
      },
    });
  };

  return (
    <SettingsLayout>
      <SettingsHeader title="Weather & Alerts" onBack={onBack} />

      {/* Temperature Unit */}
      <SettingsSection title="TEMPERATURE UNIT" sx={{ ml: 0.5, mt: 0 }} />
      <SettingsGroup sx={{ p: 1.5, mb: 3 }}>
        <SettingsSegmentedControl
          value={weather.temperatureUnit || "celsius"}
          onChange={(val) => updateField("temperatureUnit", val)}
          options={[
            { label: "Celsius (°C)", value: "celsius" },
            { label: "Fahrenheit (°F)", value: "fahrenheit" },
          ]}
        />
      </SettingsGroup>

      {/* Forecast Horizon */}
      <SettingsSection title="FORECAST HORIZON" sx={{ ml: 0.5 }} />
      <SettingsGroup sx={{ p: 1.5, mb: 3 }}>
        <SettingsSegmentedControl
          value={String(weather.forecastHorizon || 5)}
          onChange={(val) => updateField("forecastHorizon", Number(val))}
          options={[
            { label: "3 Days", value: "3" },
            { label: "5 Days", value: "5" },
            { label: "7 Days", value: "7" },
          ]}
        />
        <Typography variant="caption" sx={{ color: SETTINGS_THEME.textSecondary, mt: 1, ml: 0.5, display: "block" }}>
          Extended forecasts are provided via OpenWeatherMap APIs.
        </Typography>
      </SettingsGroup>

      {/* Weather Alerts */}
      <SettingsSection title="ENVIRONMENTAL ALERTS" sx={{ ml: 0.5 }} />
      <SettingsGroup sx={{ mb: 3 }}>
        <SettingsSwitchRow
          icon={ThunderstormOutlined}
          title="Severe Weather Advisories"
          subtitle="Instant notifications for storms, heavy rainfall, or extreme heat"
          checked={Boolean(weather.severeWeatherAlerts)}
          onChange={(v) => updateField("severeWeatherAlerts", v)}
          showDivider
        />

        <SettingsSwitchRow
          icon={WbSunnyOutlined}
          title="Precipitation & Rain Alerts"
          subtitle="Morning summary if rain is forecasted during your outdoor trips"
          checked={Boolean(weather.precipitationAlerts)}
          onChange={(v) => updateField("precipitationAlerts", v)}
          showDivider
        />

        <SettingsSwitchRow
          icon={AirOutlined}
          title="Air Pollution Warnings"
          subtitle="Alert when destination Air Quality Index (AQI) exceeds unhealthy thresholds"
          checked={Boolean(weather.pollutionWarnings)}
          onChange={(v) => updateField("pollutionWarnings", v)}
        />
      </SettingsGroup>

      {/* Widget Refresh Interval */}
      <SettingsSection title="HOME WEATHER WIDGET REFRESH" sx={{ ml: 0.5 }} />
      <SettingsGroup sx={{ p: 1.5 }}>
        <SettingsSegmentedControl
          value={weather.refreshInterval || "1h"}
          onChange={(val) => updateField("refreshInterval", val)}
          options={[
            { label: "Every 30 Mins", value: "30m" },
            { label: "Every 1 Hour", value: "1h" },
            { label: "Every 3 Hours", value: "3h" },
          ]}
        />
      </SettingsGroup>
    </SettingsLayout>
  );
}
