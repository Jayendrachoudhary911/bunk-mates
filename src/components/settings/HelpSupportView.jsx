import React from "react";
import {
  Box,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Button,
} from "@mui/material";
import {
  ExpandMore,
  EmailOutlined,
  ForumOutlined,
  SmartToyOutlined,
} from "@mui/icons-material";
import {
  SettingsLayout,
  SettingsHeader,
  SettingsSection,
  SettingsGroup,
  SettingsRow,
  SETTINGS_THEME,
} from "./SettingsShared";

const FAQS = [
  {
    q: "How do I create and share a group trip?",
    a: "Navigate to the Trips tab and tap '+ Create Trip'. Once created, invite friends by sharing your unique invite link or QR pairing code.",
  },
  {
    q: "How does Split Expenses calculate balances?",
    a: "When expenses are added to a trip, BunkMates automatically calculates who paid and divides shares equally or by custom percentage. You can settle up anytime with integrated payment links.",
  },
  {
    q: "Can I access my itineraries offline?",
    a: "Yes! BunkMates caches your active trip itineraries, packing checklists, and offline notes directly to your device storage.",
  },
  {
    q: "How does QR Desktop Login work?",
    a: "Tap the QR icon in the Settings header or use /qr-login on desktop. Scanning the pairing QR with your phone securely links your active session in seconds.",
  },
];

export default function HelpSupportView({ onBack }) {

  return (
    <SettingsLayout>
      <SettingsHeader title="Help & Support" onBack={onBack} />

      {/* 24/7 BunkMates Bot */}
      <SettingsSection title="INSTANT ASSISTANCE" sx={{ ml: 0.5, mt: 0 }} />
      <SettingsGroup sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1.5 }}>
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: "50%",
              bgcolor: "rgba(40, 127, 224, 0.15)",
              color: SETTINGS_THEME.accent,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <SmartToyOutlined />
          </Box>
          <Box>
            <Typography variant="body1" sx={{ color: SETTINGS_THEME.textPrimary, fontWeight: 700 }}>
              24/7 BunkMates Travel Bot
            </Typography>
            <Typography variant="caption" sx={{ color: SETTINGS_THEME.textSecondary }}>
              Ask questions about trip planning, packing, or technical issues
            </Typography>
          </Box>
        </Box>

        <Button
          variant="contained"
          fullWidth
          onClick={() => {
            window.location.href = "/travel-ai";
          }}
          sx={{
            py: 1.2,
            borderRadius: "14px",
            bgcolor: SETTINGS_THEME.accent,
            color: "#FFFFFF",
            fontWeight: 700,
            textTransform: "none",
          }}
        >
          Chat with BunkMates Bot
        </Button>
      </SettingsGroup>

      {/* Frequently Asked Questions */}
      <SettingsSection title="FREQUENTLY ASKED QUESTIONS" sx={{ ml: 0.5 }} />
      <Box sx={{ mb: 3 }}>
        {FAQS.map((faq, idx) => (
          <Accordion
            key={idx}
            sx={{
              bgcolor: SETTINGS_THEME.card,
              color: SETTINGS_THEME.textPrimary,
              borderRadius: "18px !important",
              border: "1px solid rgba(255, 255, 255, 0.04)",
              mb: 1.2,
              "&:before": { display: "none" },
            }}
          >
            <AccordionSummary expandIcon={<ExpandMore sx={{ color: SETTINGS_THEME.textSecondary }} />}>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {faq.q}
              </Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ pt: 0 }}>
              <Typography variant="caption" sx={{ color: SETTINGS_THEME.textSecondary, lineHeight: 1.6 }}>
                {faq.a}
              </Typography>
            </AccordionDetails>
          </Accordion>
        ))}
      </Box>

      {/* Contact Channels */}
      <SettingsSection title="GET IN TOUCH" sx={{ ml: 0.5 }} />
      <SettingsGroup>
        <SettingsRow
          icon={EmailOutlined}
          title="Email Support"
          subtitle="support@bunkmates.xyz"
          onClick={() => (window.location.href = "mailto:support@bunkmates.xyz")}
          showChevron={false}
          showDivider
        />
        <SettingsRow
          icon={ForumOutlined}
          title="Community Forum"
          subtitle="Join traveler discussions and share trips with members"
          onClick={() => window.open("/community", "_blank")}
          showChevron
        />
      </SettingsGroup>
    </SettingsLayout>
  );
}
