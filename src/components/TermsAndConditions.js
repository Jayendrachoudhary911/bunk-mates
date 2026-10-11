import React, { useEffect } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Container,
  Paper,
  Box,
  Divider,
  List,
  ListItem,
  ListItemText,
  Link as MuiLink,
  Breadcrumbs,
  Chip,
  Stack,
} from "@mui/material";
import {
  ShieldOutlined as ShieldIcon,
  Home as HomeIcon,
  NavigateNext as NavigateNextIcon,
  CheckCircleOutlineRounded as CheckIcon,
  GavelOutlined as GavelIcon,
} from "@mui/icons-material";
import { Link } from "react-router-dom";

export default function TermsAndConditionsDark() {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, []);

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default", color: "text.primary" }}>
      {/* Header */}
      <AppBar
        position="sticky"
        elevation={0}
        color="transparent"
        sx={{
          bgcolor: "background.paper",
          borderBottom: 1,
          borderColor: "divider",
          backdropFilter: "blur(16px)",
          zIndex: 1100,
        }}
      >
        <Toolbar sx={{ maxWidth: 1120, width: "100%", mx: "auto", px: { xs: 2, sm: 3 } }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              display: "grid",
              placeItems: "center",
              borderRadius: 3,
              bgcolor: "primary.main",
              color: "primary.contrastText",
              mr: 2,
              boxShadow: "0 4px 12px rgba(22, 140, 128, 0.2)",
            }}
          >
            <ShieldIcon fontSize="small" />
          </Box>
          <Typography sx={{ flexGrow: 1, fontWeight: 800, letterSpacing: "-0.03em", fontSize: "1.1rem" }}>
            BunkMates
          </Typography>
          <Chip label="Terms of Service" size="small" color="primary" variant="outlined" sx={{ fontWeight: 600 }} />
        </Toolbar>
      </AppBar>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          py: { xs: 3, sm: 6, md: 8 },
          px: { xs: 2, sm: 3 },
        }}
      >
        <Container maxWidth="md" disableGutters>
          
          {/* Path Navigation Breadcrumbs */}
          <Breadcrumbs
            separator={<NavigateNextIcon fontSize="small" />}
            aria-label="breadcrumb"
            sx={{ mb: 3, "& .MuiBreadcrumbs-li": { fontSize: "0.85rem", fontWeight: 500 } }}
          >
            <MuiLink component={Link} to="/" color="inherit" sx={{ display: "flex", alignItems: "center", gap: 0.5, textDecoration: "none", "&:hover": { color: "primary.main" } }}>
              <HomeIcon sx={{ fontSize: 16 }} /> Home
            </MuiLink>
            <Typography color="text.primary" sx={{ fontWeight: 600 }}>Terms &amp; Conditions</Typography>
          </Breadcrumbs>

          <Paper
            elevation={0}
            variant="outlined"
            sx={{
              overflow: "hidden",
              borderRadius: { xs: 3, sm: 5 },
              borderColor: "divider",
              bgcolor: "background.paper",
              boxShadow: "0 20px 48px rgba(0,0,0,0.04)",
            }}
          >
            {/* Title Banner */}
            <Box
              sx={{
                p: { xs: 3, sm: 5, md: 6 },
                bgcolor: "action.hover",
                borderBottom: 1,
                borderColor: "divider",
                textAlign: "center",
              }}
            >
              <Stack direction="row" spacing={1} justifyContent="center" alignItems="center" sx={{ mb: 2 }}>
                <GavelIcon color="primary" fontSize="small" />
                <Chip label="Legal Agreement & Guidelines" size="small" variant="outlined" sx={{ fontWeight: 600 }} />
              </Stack>
              <Typography
                variant="h3"
                component="h1"
                fontWeight={850}
                gutterBottom
                sx={{
                  letterSpacing: "-0.045em",
                  color: "text.primary",
                  fontSize: { xs: "2rem", sm: "2.8rem", md: "3rem" },
                }}
              >
                Terms &amp; Conditions
              </Typography>
              <Typography
                variant="subtitle2"
                color="text.secondary"
                sx={{ fontWeight: 600, letterSpacing: "0.02em" }}
              >
                Last Updated: October 23, 2025
              </Typography>
            </Box>

            {/* Terms Sections Body */}
            <Box sx={{ px: { xs: 3, sm: 5, md: 6 }, py: 4 }}>
              
              {sections.map((section, index) => (
                <TOSSection key={index} number={`0${index + 1}`} {...section} />
              ))}

              <Box sx={{ mt: 4, p: 3, borderRadius: 3, bgcolor: "action.hover", border: "1px solid", borderColor: "divider" }}>
                <Typography variant="body1" fontWeight={700} sx={{ mb: 1, color: "text.primary" }}>
                  Official Contact Details
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                  Email:{" "}
                  <MuiLink href="mailto:team.bunkmates@gmail.com" underline="hover" sx={{ fontWeight: 600 }}>
                    team.bunkmates@gmail.com
                  </MuiLink>
                  <br />
                  Address: Rajasthan, India
                </Typography>
              </Box>

              <Divider sx={{ my: 4 }} />

              {/* Privacy Policy Link Footer */}
              <Box sx={{ py: 2, textAlign: "center" }}>
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                  Read our{" "}
                  <MuiLink
                    component={Link}
                    to="/privacy-policy"
                    color="primary"
                    underline="hover"
                    sx={{ fontWeight: 700 }}
                  >
                    Privacy Policy
                  </MuiLink>{" "}
                  to learn how we protect your personal data.
                </Typography>
              </Box>
            </Box>
          </Paper>

          {/* Copyright Footer */}
          <Typography
            component="footer"
            variant="caption"
            color="text.secondary"
            sx={{ display: "block", textAlign: "center", mt: 4, mb: 2, fontWeight: 600 }}
          >
            © {new Date().getFullYear()} BunkMates. All rights reserved.
          </Typography>
        </Container>
      </Box>
    </Box>
  );
}

// Content Data
const sections = [
  {
    title: "1. Acceptance of Terms",
    content:
      "By accessing or using the BunkMates mobile application, website, and related services (collectively, the 'Services'), you acknowledge that you have read, understood, and agree to be bound by these Terms & Conditions. If you do not agree with any part of these terms, you must immediately discontinue use of the Services.",
  },
  {
    title: "2. Services Description",
    list: [
      "Create and manage group trips",
      "Communicate through integrated group chat and voice calls",
      "Set reminders and manage schedules",
      "Share notes and checklists",
      "Track and split expenses among group members",
      "Access weather updates and calendar integration",
      "View unified trip dashboards",
    ],
  },
  {
    title: "3. Eligibility and Account Registration",
    list: [
      "You must be at least 16 years old to use the Services. Some jurisdictions may require a higher age of consent for data processing.",
      "You must provide accurate, complete, and current registration information.",
      "You are responsible for maintaining the confidentiality of your account credentials.",
      "You agree to immediately notify us of any unauthorized use of your account.",
    ],
  },
  {
    title: "4. User Responsibilities",
    list: [
      "Use the Services only for lawful purposes related to trip planning and management.",
      "Do not post harmful, threatening, harassing, or defamatory content.",
      "Do not impersonate anyone or disrupt the Services.",
      "Do not attempt unauthorized access or use automated means to collect data.",
    ],
  },
  {
    title: "5. Trip Management and Group Coordination",
    list: [
      "Trip creators become default Trip Administrators.",
      "Trip Administrators can manage settings, invite/remove members, and moderate content.",
      "All group communication must comply with these terms.",
    ],
  },
  {
    title: "6. Financial Management Features",
    list: [
      "The expense tracking feature is for informational purposes only.",
      "BunkMates does not facilitate actual money transfers.",
      "Users are responsible for verifying expense accuracy and settling directly with others.",
      "BunkMates is not liable for any financial losses or disputes.",
    ],
  },
  {
    title: "7. Intellectual Property",
    list: [
      "All rights and content in the Services belong to BunkMates or its licensors.",
      "You retain ownership of your content but grant BunkMates a license to display it within the app.",
      "BunkMates name, logo, and design are trademarks of BunkMates.",
    ],
  },
  {
    title: "8. Privacy and Data Protection",
    list: [
      "Our Privacy Policy governs the collection and protection of your data.",
      "We use TLS/SSL encryption and secure infrastructure.",
      "We comply with GDPR, CCPA, and other global privacy regulations.",
      "You can contact us at team.bunkmates@gmail.com for data access or deletion requests.",
    ],
  },
  {
    title: "9. Third-Party Services",
    list: [
      "The app integrates with third-party services like weather APIs and Google Maps.",
      "We are not responsible for third-party content or privacy policies.",
      "Your use of third-party services is at your own risk.",
    ],
  },
  {
    title: "10. Disclaimers and Limitations of Liability",
    list: [
      "The Services are provided 'as is' and 'as available' without warranties.",
      "BunkMates is not responsible for travel delays, weather, or safety concerns.",
      "Liability is limited to ₹1,000 or the amount paid in the last 12 months.",
    ],
  },
  {
    title: "11. Indemnification",
    content:
      "You agree to indemnify and hold harmless BunkMates, its developers, and affiliates from any claims, damages, or losses arising from your use of the Services, your violation of these Terms, or your content.",
  },
  {
    title: "12. Termination",
    list: [
      "You may delete your account at any time.",
      "We may suspend or terminate access for violations of these terms.",
      "Upon termination, your right to use the Services ceases immediately.",
    ],
  },
  {
    title: "13. Modifications to Terms",
    content:
      "We may update these Terms at any time. Continued use after changes means you accept the updated terms.",
  },
  {
    title: "14. Governing Law and Dispute Resolution",
    list: [
      "These Terms are governed by the laws of India.",
      "Disputes will be under the jurisdiction of Rajasthan, India.",
      "We encourage informal dispute resolution first.",
    ],
  },
  {
    title: "15. Miscellaneous",
    list: [
      "If any clause is invalid, others remain effective.",
      "You may not transfer your rights without consent.",
      "These Terms represent the full agreement between you and BunkMates.",
      "We are not liable for delays due to force majeure events.",
    ],
  },
  {
    title: "16. Contact Information",
    content:
      "For questions about these Terms, please contact us at team.bunkmates@gmail.com or mail us at Rajasthan, India.",
  },
  {
    title: "17. Compliance and Updates",
    content:
      "We regularly review Google Play and regulatory guidelines to maintain compliance and keep our policies up-to-date.",
  },
  {
    title: "Acknowledgement",
    content:
      "By using BunkMates Services, you acknowledge that you have read, understood, and agree to be bound by these Terms & Conditions.",
  },
];

// Reusable Section Component with Timeline Number Badge
function TOSSection({ number, title, content, list }) {
  return (
    <Box component="section" sx={{ mb: { xs: 4, sm: 5 } }}>
      <Stack direction="row" spacing={2} alignItems="flex-start">
        <Box
          aria-hidden="true"
          sx={{
            flex: "0 0 auto",
            width: 36,
            height: 36,
            borderRadius: 2.5,
            display: "grid",
            placeItems: "center",
            bgcolor: "primary.main",
            color: "primary.contrastText",
            fontSize: "0.82rem",
            fontWeight: 800,
            boxShadow: "0 4px 12px rgba(22, 140, 128, 0.2)",
          }}
        >
          {number}
        </Box>
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography
            variant="h6"
            component="h2"
            fontWeight={750}
            gutterBottom
            sx={{
              color: "text.primary",
              fontSize: { xs: "1.1rem", sm: "1.2rem" },
              letterSpacing: "-0.02em",
              mb: 1.5,
            }}
          >
            {title}
          </Typography>

          {content && (
            <Typography
              variant="body1"
              sx={{
                mb: list ? 1.5 : 0,
                color: "text.secondary",
                lineHeight: 1.8,
                fontSize: { xs: "0.93rem", sm: "0.97rem" },
              }}
            >
              {content}
            </Typography>
          )}

          {list && (
            <List disablePadding sx={{ mt: 1 }}>
              {list.map((item, idx) => (
                <ListItem
                  key={idx}
                  disableGutters
                  alignItems="flex-start"
                  sx={{
                    py: 0.8,
                    px: 1.5,
                    mb: 0.8,
                    borderRadius: 2,
                    bgcolor: "action.hover",
                    border: "1px solid",
                    borderColor: "divider",
                    gap: 1.2,
                  }}
                >
                  <CheckIcon sx={{ color: "success.main", fontSize: 18, mt: "3px", flex: "0 0 auto" }} />
                  <ListItemText
                    primary={item}
                    primaryTypographyProps={{
                      sx: { fontSize: "0.93rem", color: "text.primary", lineHeight: 1.65, fontWeight: 500 },
                    }}
                  />
                </ListItem>
              ))}
            </List>
          )}
        </Box>
      </Stack>
    </Box>
  );
}