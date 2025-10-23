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

export default function PrivacyPolicyDark() {
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
          bgcolor: "rgba(18,18,18,0.6)",
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
              Privacy Policy
            </Typography>

            <Typography
              variant="subtitle2"
              color="rgba(200,200,200,0.8)"
              sx={{ textAlign: "center", mb: 4 }}
            >
              Effective Date: October 9, 2025 &nbsp; | &nbsp; Version 2.0
            </Typography>

            <Divider sx={{ mb: 5, borderColor: "rgba(255,255,255,0.1)" }} />

            {sections.map((section, index) => (
              <PolicySection key={index} {...section} />
            ))}

            {/* Footer Navigation */}
            <Box sx={{ mt: 6, textAlign: "center" }}>
              <Typography variant="body2" color="rgba(200,200,200,0.7)">
                Read our{" "}
                <MuiLink
                  component={Link}
                  to="/terms"
                  color="primary"
                  underline="hover"
                >
                  Terms & Conditions
                </MuiLink>{" "}
                for usage guidelines.
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

// Privacy Policy Sections (from your DOCX)
const sections = [
  {
    title: "1. The Information We Collect",
    list: [
      "Information You Provide to Us: includes name, email, password, and optional details like mobile number, bio, or profile photo.",
      "User-Generated Content (UGC): such as trip itineraries, notes, checklists, and expense records.",
      "Communications: details you provide when contacting support.",
      "Automatically Collected Data: includes app usage logs, crash reports, device info, OS version, IP address, and unique identifiers.",
      "End-to-End Encrypted Data: chats, notes, and trip data are encrypted before leaving your device and cannot be accessed by BunkMates or any third parties.",
    ],
  },
  {
    title: "2. User-Generated Content (UGC) and Community Standards",
    list: [
      "Moderation Systems: automated and manual reviews prevent harmful or illegal content.",
      "Prohibited Content: hate speech, harassment, explicit material, or illegal activity is strictly prohibited.",
      "Reporting: users can easily report inappropriate content through the app.",
      "Content Policy: aligns with our Terms of Service for user safety and moderation.",
    ],
  },
  {
    title: "3. How We Use Information (Legal Basis for Processing)",
    list: [
      "Provide and operate the Service — trip planning, collaboration, and expense tracking.",
      "Ensure security and integrity by detecting abuse and verifying accounts.",
      "Communicate with users about updates, support, and notifications.",
      "Improve features through anonymized usage analysis.",
      "Comply with applicable legal obligations.",
    ],
  },
  {
    title: "4. How Information Is Shared and Disclosed",
    list: [
      "With Other Users: only within shared trips or groups.",
      "With Third-Party Services: limited to secure integrations like Firebase and Vercel.",
      "For Legal Reasons: disclosed when required by law or to protect rights and safety.",
      "No Selling of Data: BunkMates never sells user data to advertisers or brokers.",
    ],
  },
  {
    title: "5. Data Permissions and User Consent",
    list: [
      "Permissions are requested only when essential for functionality.",
      "Users are informed why data (like location) is needed before granting access.",
      "Optional permissions include Location (for weather) and Notifications.",
      "All practices comply with Google Play’s Data Safety standards.",
    ],
  },
  {
    title: "6. Data Security",
    list: [
      "Sensitive data is encrypted in transit using HTTPS.",
      "Firebase Authentication and Firestore security rules enforce strict access.",
      "Vercel’s secure cloud hosting and analytics ensure robust protection.",
      "While strong measures exist, no digital system guarantees absolute security.",
    ],
  },
  {
    title: "7. Your Rights and Data Controls",
    list: [
      "Access or correct your profile information through account settings.",
      "Delete your data anytime by deleting your account.",
      "Revoke permissions (location, camera, notifications) through device settings.",
    ],
  },
  {
    title: "8. International Data Transfers",
    content:
      "Your data may be processed in countries like the United States, where some BunkMates servers are hosted (Vercel & Firebase). These transfers are legally safeguarded and necessary for app functionality.",
  },
  {
    title: "9. Children's Privacy",
    content:
      "BunkMates is not intended for children under 13. We do not knowingly collect personal information from minors. If such data is discovered, it will be promptly deleted.",
  },
  {
    title: "10. Changes to This Policy",
    content:
      "We may update this Privacy Policy periodically. Users will be notified of major changes via in-app alerts or email communication.",
  },
  {
    title: "11. Contact Us",
    content:
      "The data controllers responsible for your information are Jayendra Chaudhary, Mohit Sharma, and Sahil Suman. For privacy concerns or questions, contact us at team.bunkmates@gmail.com.",
  },
];

// Reusable Section Component
function PolicySection({ title, content, list }) {
  return (
    <Box sx={{ mb: 5 }}>
      <Typography
        variant="h6"
        fontWeight={700}
        gutterBottom
        sx={{ color: "#fff", mb: 1.5 }}
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
