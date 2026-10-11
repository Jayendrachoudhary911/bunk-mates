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
  Card,
  CardContent,
} from "@mui/material";
import {
  ShieldOutlined as ShieldIcon,
  Home as HomeIcon,
  NavigateNext as NavigateNextIcon,
  CheckCircleOutlineRounded as CheckIcon,
  InfoOutlined as InfoIcon,
  LockOutlined as LockIcon,
} from "@mui/icons-material";
import { Link } from "react-router-dom";

export default function PrivacyPolicyDark() {
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
          <Chip label="Privacy & Security" size="small" color="primary" variant="outlined" sx={{ fontWeight: 600 }} />
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
            <Typography color="text.primary" sx={{ fontWeight: 600 }}>Privacy Policy</Typography>
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
                <LockIcon color="primary" fontSize="small" />
                <Chip label="Data Protection Standards" size="small" variant="outlined" sx={{ fontWeight: 600 }} />
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
                Privacy Policy
              </Typography>
              <Typography
                variant="subtitle2"
                color="text.secondary"
                sx={{ fontWeight: 600, letterSpacing: "0.02em" }}
              >
                Effective Date: October 9, 2025 &nbsp; | &nbsp; Version 2.0
              </Typography>
            </Box>

            {/* Policy Sections Body */}
            <Box sx={{ px: { xs: 3, sm: 5, md: 6 }, py: 4 }}>
              
              {sections.map((section, index) => (
                <PolicySection key={index} number={`0${index + 1}`} {...section} />
              ))}

              <Divider sx={{ my: 4 }} />

              {/* Related Policies Footer Navigation */}
              <Box sx={{ py: 2, textAlign: "center" }}>
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                  Review our{" "}
                  <MuiLink
                    component={Link}
                    to="/terms"
                    color="primary"
                    underline="hover"
                    sx={{ fontWeight: 700 }}
                  >
                    Terms &amp; Conditions
                  </MuiLink>{" "}
                  for complete usage guidelines.
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

// Privacy Policy Sections Data
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

// Reusable Section Component with Timeline Number Badge
function PolicySection({ number, title, content, list }) {
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