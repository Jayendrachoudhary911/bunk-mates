import React from "react";
import { Box, Typography, TextField, InputAdornment } from "@mui/material";
import {
  SettingsLayout,
  SettingsHeader,
  SettingsSection,
  SettingsGroup,
  SettingsSwitchRow,
  SettingsSegmentedControl,
  SETTINGS_THEME,
} from "./SettingsShared";

const CURRENCIES = [
  { code: "INR", label: "Indian Rupee (₹ INR)", symbol: "₹" },
  { code: "USD", label: "US Dollar ($ USD)", symbol: "$" },
  { code: "EUR", label: "Euro (€ EUR)", symbol: "€" },
  { code: "GBP", label: "British Pound (£ GBP)", symbol: "£" },
  { code: "JPY", label: "Japanese Yen (¥ JPY)", symbol: "¥" },
  { code: "AUD", label: "Australian Dollar ($ AUD)", symbol: "$" },
  { code: "CAD", label: "Canadian Dollar ($ CAD)", symbol: "$" },
];

export default function CurrencyExpensesView({
  onBack,
  preferences,
  onUpdatePreferences,
}) {
  const currency = preferences.currency || {};

  const updateField = (field, value) => {
    onUpdatePreferences({
      ...preferences,
      currency: {
        ...currency,
        [field]: value,
      },
    });
  };

  const selectedCurrencyObj = CURRENCIES.find((c) => c.code === (currency.baseCurrency || "INR")) || CURRENCIES[0];

  return (
    <SettingsLayout>
      <SettingsHeader title="Currency & Expenses" onBack={onBack} />

      {/* Base Currency */}
      <SettingsSection title="BASE DISPLAY CURRENCY" sx={{ ml: 0.5, mt: 0 }} />
      <SettingsGroup sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
          {CURRENCIES.map((curr) => {
            const isSelected = (currency.baseCurrency || "INR") === curr.code;
            return (
              <Box
                key={curr.code}
                component="button"
                onClick={() => updateField("baseCurrency", curr.code)}
                sx={{
                  py: 1,
                  px: 1.8,
                  borderRadius: "14px",
                  bgcolor: isSelected ? SETTINGS_THEME.accent : SETTINGS_THEME.surface,
                  color: isSelected ? "#FFFFFF" : SETTINGS_THEME.textSecondary,
                  fontWeight: isSelected ? 700 : 500,
                  fontSize: "0.85rem",
                  border: isSelected
                    ? `1px solid ${SETTINGS_THEME.accent}`
                    : "1px solid rgba(255, 255, 255, 0.08)",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  "&:hover": {
                    bgcolor: isSelected ? SETTINGS_THEME.accent : "rgba(255, 255, 255, 0.1)",
                  },
                }}
              >
                {curr.symbol} {curr.code}
              </Box>
            );
          })}
        </Box>
      </SettingsGroup>

      {/* Currency Display Rules */}
      <SettingsSection title="DISPLAY PREFERENCES" sx={{ ml: 0.5 }} />
      <SettingsGroup sx={{ mb: 3 }}>
        <SettingsSwitchRow
          title="Show Currency Symbol"
          subtitle="Display currency prefixes (e.g. ₹, $) alongside values"
          checked={Boolean(currency.showCurrencySymbol)}
          onChange={(v) => updateField("showCurrencySymbol", v)}
          showDivider
        />

        <SettingsSwitchRow
          title="Auto Round-off Decimals"
          subtitle="Round fractional amounts to nearest whole number for readability"
          checked={Boolean(currency.autoRoundOff)}
          onChange={(v) => updateField("autoRoundOff", v)}
        />
      </SettingsGroup>

      {/* Split Bills Defaults */}
      <SettingsSection title="SPLIT BILLS DEFAULTS" sx={{ ml: 0.5 }} />
      <SettingsGroup sx={{ p: 1.5, mb: 3 }}>
        <Typography variant="body2" sx={{ color: SETTINGS_THEME.textSecondary, mb: 0.8, ml: 0.5 }}>
          Default Split Method
        </Typography>
        <Box sx={{ mb: 1.5 }}>
          <SettingsSegmentedControl
            value={currency.defaultSplitMethod || "equal"}
            onChange={(val) => updateField("defaultSplitMethod", val)}
            options={[
              { label: "Equally (1/N)", value: "equal" },
              { label: "Percentage (%)", value: "percentage" },
              { label: "Exact Amounts", value: "exact" },
            ]}
          />
        </Box>

        <SettingsSwitchRow
          title="Auto-Categorize Group Spends"
          subtitle="Automatically infer categories (Food, Stay, Transit) from expense titles"
          checked={Boolean(currency.autoCategorizeGroupSpends)}
          onChange={(v) => updateField("autoCategorizeGroupSpends", v)}
        />
      </SettingsGroup>

      {/* Monthly Savings Goal */}
      <SettingsSection title="MONTHLY TRAVEL SAVINGS GOAL" sx={{ ml: 0.5 }} />
      <SettingsGroup sx={{ p: 2 }}>
        <SettingsSwitchRow
          title="Enable Savings Goal"
          subtitle="Track progress towards your monthly travel fund"
          checked={Boolean(currency.savingsGoalEnabled)}
          onChange={(v) => updateField("savingsGoalEnabled", v)}
        />

        {currency.savingsGoalEnabled && (
          <Box sx={{ mt: 2, pt: 2, borderTop: `1px solid ${SETTINGS_THEME.divider}` }}>
            <Typography variant="body2" sx={{ color: SETTINGS_THEME.textSecondary, mb: 1 }}>
              Target Monthly Savings
            </Typography>
            <TextField
              type="number"
              fullWidth
              value={currency.savingsGoalAmount || 15000}
              onChange={(e) => updateField("savingsGoalAmount", Math.max(0, Number(e.target.value)))}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start" sx={{ color: SETTINGS_THEME.textPrimary }}>
                    {selectedCurrencyObj.symbol}
                  </InputAdornment>
                ),
                sx: {
                  bgcolor: SETTINGS_THEME.surface,
                  color: "#FFFFFF",
                  borderRadius: "14px",
                  "& fieldset": { borderColor: "rgba(255, 255, 255, 0.08)" },
                },
              }}
            />
          </Box>
        )}
      </SettingsGroup>
    </SettingsLayout>
  );
}
