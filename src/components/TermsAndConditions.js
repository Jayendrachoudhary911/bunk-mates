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
} from "@mui/material";
import { Link } from "react-router-dom";

export default function TermsAndConditionsDark() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <>
      {/* Header */}
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          bgcolor: "rgba(18, 18, 18, 0.6)",
          backdropFilter: "blur(10px)",
          borderBottom: "0px solid rgba(255,255,255,0.08)",
        }}
      >
        <Toolbar>
          <Typography
            variant="h6"
            sx={{
              flexGrow: 1,
              fontWeight: 800,
              color: "#fff",
              letterSpacing: 0.5,
            }}
          >
            BunkMates
          </Typography>
        </Toolbar>
      </AppBar>

      {/* Main Content */}
      <Box
        sx={{
          minHeight: "100vh",
          bgcolor: "linear-gradient(180deg, #0f0f0f 0%, #1b1b1b 100%)",
          py: 8,
          color: "#e0e0e0",
        }}
      >
        <Container maxWidth="md">
          <Paper
            elevation={6}
            sx={{
              px: { xs: 3, sm: 6 },
              py: { xs: 5, sm: 8 },
              borderRadius: 4,
              background: "rgba(30,30,30,0.9)",
              backdropFilter: "blur(12px)",
              color: "#e0e0e0",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            <Typography
              variant="h3"
              fontWeight={700}
              gutterBottom
              sx={{
                textAlign: "center",
                color: "#ffffff",
                fontSize: { xs: "2rem", sm: "2.8rem" },
              }}
            >
              Terms & Conditions
            </Typography>

            <Typography
              variant="subtitle2"
              color="rgba(200,200,200,0.8)"
              sx={{ textAlign: "center", mb: 4 }}
            >
              Last Updated: October 23, 2025
            </Typography>

            <Divider sx={{ mb: 5, borderColor: "rgba(255,255,255,0.1)" }} />

            {sections.map((section, index) => (
              <TOSSection key={index} {...section} />
            ))}

            <Typography variant="body1" fontWeight={500} sx={{ mt: 4 }}>
              Email: team.bunkmates@gmail.com
              <br />
              Address: Rajasthan, India
            </Typography>

            {/* Privacy Policy Link */}
            <Box sx={{ mt: 6, textAlign: "center" }}>
              <Typography variant="body2" color="rgba(200,200,200,0.7)">
                Read our{" "}
                <MuiLink
                  component={Link}
                  to="/privacy-policy"
                  color="primary"
                  underline="hover"
                >
                  Privacy Policy
                </MuiLink>{" "}
                to learn how we handle your data.
              </Typography>
            </Box>
          </Paper>
        </Container>
      </Box>

      {/* Footer */}
      <Box
        sx={{
          bgcolor: "#121212",
          py: 3,
          textAlign: "center",
          borderTop: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <Typography variant="body2" color="rgba(255,255,255,0.6)">
          © {new Date().getFullYear()} BunkMates. All rights reserved.
        </Typography>
      </Box>
    </>
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

// Reusable Section Component
function TOSSection({ title, content, list }) {
  return (
    <Box sx={{ mb: 5 }}>
      <Typography
        variant="h6"
        fontWeight={700}
        gutterBottom
        sx={{
          color: "#fff",
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
            color: "#ccc",
            lineHeight: 1.7,
          }}
        >
          {content}
        </Typography>
      )}

      {list && (
        <List dense disablePadding sx={{ pl: 2 }}>
          {list.map((item, idx) => (
            <ListItem key={idx} sx={{ py: 0.4 }}>
              <ListItemText
                primaryTypographyProps={{
                  sx: { fontSize: "0.95rem", color: "#aaa" },
                }}
                primary={item}
              />
            </ListItem>
          ))}
        </List>
      )}
    </Box>
  );
}
