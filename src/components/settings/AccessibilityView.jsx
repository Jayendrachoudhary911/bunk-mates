import React from "react";
import {
  SettingsLayout,
  SettingsHeader,
  SettingsSection,
  SettingsGroup,
  SettingsSwitchRow,
  SettingsSegmentedControl,
} from "./SettingsShared";

export default function AccessibilityView({ onBack, preferences, onUpdatePreferences }) {
  const accessibility = preferences.accessibility || {};

  const updateField = (field, value) => {
    onUpdatePreferences({
      ...preferences,
      accessibility: {
        ...accessibility,
        [field]: value,
      },
    });

    if (field === "hapticFeedback" && value && navigator.vibrate) {
      navigator.vibrate(50);
    }
  };

  return (
    <SettingsLayout>
      <SettingsHeader title="Accessibility" onBack={onBack} />

      {/* Vision Support */}
      <SettingsSection title="VISION SUPPORT" sx={{ ml: 0.5, mt: 0 }} />
      <SettingsGroup sx={{ mb: 3 }}>
        <SettingsSwitchRow
          title="High Contrast Mode"
          subtitle="Increase contrast between text, controls, borders, and surfaces"
          checked={Boolean(accessibility.highContrast)}
          onChange={(v) => updateField("highContrast", v)}
          showDivider
        />

        <SettingsSwitchRow
          title="Large Touch Targets"
          subtitle="Increase interactive button and switch touch dimensions"
          checked={Boolean(accessibility.largeTouchTargets)}
          onChange={(v) => updateField("largeTouchTargets", v)}
          showDivider
        />

        <SettingsSwitchRow
          title="Bold Text"
          subtitle="Increase typography weights across labels and content"
          checked={Boolean(accessibility.boldText)}
          onChange={(v) => updateField("boldText", v)}
          showDivider
        />

        <SettingsSwitchRow
          title="Reduce Transparency"
          subtitle="Replace translucent blur surfaces with opaque dark panels"
          checked={Boolean(accessibility.reduceTransparency)}
          onChange={(v) => updateField("reduceTransparency", v)}
        />
      </SettingsGroup>

      {/* Color Blind Mode */}
      <SettingsSection title="COLOR BLIND MODE" sx={{ ml: 0.5 }} />
      <SettingsGroup sx={{ p: 1.5, mb: 3 }}>
        <SettingsSegmentedControl
          value={accessibility.colorBlindMode || "off"}
          onChange={(val) => updateField("colorBlindMode", val)}
          options={[
            { label: "Off", value: "off" },
            { label: "Protanopia", value: "protanopia" },
            { label: "Deuteranopia", value: "deuteranopia" },
            { label: "Tritanopia", value: "tritanopia" },
          ]}
        />
      </SettingsGroup>

      {/* Motion & Feedback */}
      <SettingsSection title="MOTION & FEEDBACK" sx={{ ml: 0.5 }} />
      <SettingsGroup>
        <SettingsSwitchRow
          title="Reduce Motion"
          subtitle="Minimize decorative movement and page transitions"
          checked={Boolean(accessibility.reduceMotion)}
          onChange={(v) => updateField("reduceMotion", v)}
          showDivider
        />

        <SettingsSwitchRow
          title="Haptic Feedback"
          subtitle="Subtle tactile vibration on supported mobile devices"
          checked={Boolean(accessibility.hapticFeedback)}
          onChange={(v) => updateField("hapticFeedback", v)}
          showDivider
        />

        <SettingsSwitchRow
          title="Audio Cues"
          subtitle="Audible tones for major success and error alerts"
          checked={Boolean(accessibility.audioCues)}
          onChange={(v) => updateField("audioCues", v)}
        />
      </SettingsGroup>
    </SettingsLayout>
  );
}
