import React, { useEffect, useState } from "react";
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
  Button,
  Stack,
  Chip,
  Breadcrumbs,
  Card,
  CardContent,
} from "@mui/material";
import {
  DeleteOutlineRounded as DeleteOutlineIcon,
  ShieldOutlined as ShieldIcon,
  MailOutlineRounded as MailIcon,
  CheckCircleOutlineRounded as CheckIcon,
  InfoOutlined as InfoIcon,
  NavigateNext as NavigateNextIcon,
  Home as HomeIcon,
  LockOutlined as LockIcon,
  Schedule as ScheduleIcon,
  HelpOutline as HelpIcon,
} from "@mui/icons-material";
import { Link } from "react-router-dom";

const SUPPORT_EMAIL = "support@bynkmates.xyz";
const OFFICIAL_EMAIL = "official@bunkmates.xyz";

const sectionTitleSx = {
  color: "text.primary",
  fontWeight: 750,
  fontSize: { xs: "1.15rem", sm: "1.25rem" },
  letterSpacing: "-0.02em",
  mb: 1.5,
};

const bodySx = {
  color: "text.secondary",
  lineHeight: 1.8,
  fontSize: { xs: "0.93rem", sm: "0.98rem" },
};

function PolicySection({ number, title, children, id }) {
  return (
    <Box component="section" id={id} sx={{ py: { xs: 3, sm: 4 }, scrollMarginTop: "90px" }}>
      <Stack direction="row" spacing={2} alignItems="flex-start">
        <Box
          aria-hidden="true"
          sx={{
            flex: "0 0 auto",
            width: 38,
            height: 38,
            borderRadius: 3,
            display: "grid",
            placeItems: "center",
            bgcolor: "primary.main",
            color: "primary.contrastText",
            fontSize: "0.85rem",
            fontWeight: 800,
            boxShadow: "0 4px 12px rgba(22, 140, 128, 0.25)",
          }}
        >
          {number}
        </Box>
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography component="h2" sx={sectionTitleSx}>
            {title}
          </Typography>
          {children}
        </Box>
      </Stack>
    </Box>
  );
}

function PolicyList({ items }) {
  return (
    <List disablePadding sx={{ mt: 1.5 }}>
      {items.map((item, index) => (
        <ListItem
          key={`${index}-${typeof item === "string" ? item : item.title}`}
          disableGutters
          alignItems="flex-start"
          sx={{
            py: 1,
            px: 1.5,
            mb: 1,
            borderRadius: 2.5,
            bgcolor: "action.hover",
            border: "1px solid",
            borderColor: "divider",
            gap: 1.5,
          }}
        >
          <CheckIcon
            aria-hidden="true"
            sx={{ color: "success.main", fontSize: 20, mt: "2px", flex: "0 0 auto" }}
          />
          <ListItemText
            primary={typeof item === "string" ? item : item.title}
            secondary={typeof item === "string" ? undefined : item.description}
            primaryTypographyProps={{
              sx: { color: "text.primary", fontSize: "0.95rem", fontWeight: 600, lineHeight: 1.65 },
            }}
            secondaryTypographyProps={{
              sx: { color: "text.secondary", fontSize: "0.89rem", lineHeight: 1.7, mt: 0.4 },
            }}
          />
        </ListItem>
      ))}
    </List>
  );
}

function DeletionIllustration() {
  return (
    <Box
      aria-label="Illustration of account privacy and secure deletion"
      role="img"
      sx={{
        width: { xs: "100%", sm: 280 },
        maxWidth: 320,
        flex: "0 0 auto",
        mx: { xs: "auto", md: 0 },
        mt: { xs: 3, md: 0 },
      }}
    >
      <Box
        sx={{
          border: 1,
          borderColor: "divider",
          borderRadius: 5,
          bgcolor: "background.paper",
          p: 2,
          boxShadow: "0 12px 32px rgba(0,0,0,0.06)",
          overflow: "hidden",
        }}
      >
        <svg viewBox="0 0 260 190" width="100%" role="presentation" aria-hidden="true">
          <rect x="8" y="8" width="244" height="174" rx="22" fill="#EAF7F5" />
          <circle cx="208" cy="42" r="18" fill="#C9ECE7" />
          <circle cx="44" cy="145" r="22" fill="#D2EDE9" />
          <path d="M35 55 C52 32, 75 30, 93 45" fill="none" stroke="#A3D8D1" strokeWidth="3" strokeLinecap="round" />
          <path d="M178 143 C196 124, 220 125, 232 142" fill="none" stroke="#A3D8D1" strokeWidth="3" strokeLinecap="round" />
          <rect x="67" y="38" width="104" height="117" rx="15" fill="#FFFFFF" stroke="#B7DDD7" strokeWidth="2" />
          <rect x="81" y="52" width="76" height="7" rx="3.5" fill="#D7E8E6" />
          <circle cx="119" cy="82" r="15" fill="#CDEBE6" />
          <path d="M95 115 C99 98, 139 98, 143 115" fill="#80C8BD" />
          <rect x="91" y="124" width="56" height="5" rx="2.5" fill="#D7E8E6" />
          <path d="M180 83 L201 91 V109 C201 124 191 135 180 140 C169 135 159 124 159 109 V91 Z" fill="#168C80" />
          <path d="M170 108 L177 115 L191 100" fill="none" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="59" cy="78" r="5" fill="#F2C66D" />
          <circle cx="217" cy="116" r="5" fill="#F2C66D" />
        </svg>
        <Stack direction="row" alignItems="center" justifyContent="center" spacing={1} sx={{ pt: 1 }}>
          <ShieldIcon sx={{ fontSize: 18, color: "#168C80" }} />
          <Typography variant="caption" sx={{ color: "text.primary", fontWeight: 700 }}>
            Secure & Verified Deletion
          </Typography>
        </Stack>
      </Box>
    </Box>
  );
}

export default function AccountDeletionPolicyDark() {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, []);

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "background.default",
        color: "text.primary",
      }}
    >
      {/* Top Navbar */}
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
          <Chip label="Account & Privacy" size="small" color="primary" variant="outlined" sx={{ fontWeight: 600 }} />
        </Toolbar>
      </AppBar>

      {/* Main Content Area */}
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
            <MuiLink component={Link} to="/privacy-policy" color="inherit" sx={{ textDecoration: "none", "&:hover": { color: "primary.main" } }}>
              Privacy &amp; Security
            </MuiLink>
            <Typography color="text.primary" sx={{ fontWeight: 600 }}>Account Deletion Policy</Typography>
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
            {/* Header Banner */}
            <Box
              sx={{
                p: { xs: 3, sm: 5, md: 6 },
                bgcolor: "action.hover",
                borderBottom: 1,
                borderColor: "divider",
              }}
            >
              <Stack
                direction={{ xs: "column", md: "row" }}
                spacing={{ xs: 2, md: 4 }}
                alignItems={{ xs: "stretch", md: "center" }}
                justifyContent="space-between"
              >
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
                    <Box
                      sx={{
                        display: "grid",
                        placeItems: "center",
                        width: 44,
                        height: 44,
                        borderRadius: 3,
                        bgcolor: "background.paper",
                        border: 1,
                        borderColor: "divider",
                        color: "primary.main",
                      }}
                    >
                      <DeleteOutlineIcon />
                    </Box>
                    <Chip label="User Data & Privacy Control" size="small" variant="outlined" sx={{ fontWeight: 600 }} />
                  </Stack>
                  <Typography
                    component="h1"
                    sx={{
                      fontWeight: 850,
                      letterSpacing: "-0.045em",
                      lineHeight: 1.12,
                      fontSize: { xs: "1.9rem", sm: "2.6rem", md: "3rem" },
                      maxWidth: 680,
                    }}
                  >
                    BunkMates Account Deletion Policy
                  </Typography>
                  <Typography sx={{ ...bodySx, mt: 2, maxWidth: 650, fontSize: { xs: "0.98rem", sm: "1.05rem" } }}>
                    Your account and data belong to you. Review our transparent deletion lifecycle, learn step-by-step app procedures, or contact our support team.
                  </Typography>
                  
                  <Stack
                    direction={{ xs: "column", sm: "row" }}
                    spacing={{ xs: 1, sm: 3 }}
                    sx={{ mt: 3, pt: 2, borderTop: "1px dashed", borderColor: "divider" }}
                  >
                    <Stack direction="row" spacing={1} alignItems="center">
                      <ScheduleIcon sx={{ fontSize: 15, color: "text.secondary" }} />
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                        Effective Date: October 9, 2025
                      </Typography>
                    </Stack>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <ShieldIcon sx={{ fontSize: 15, color: "text.secondary" }} />
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                        Last Updated: October 11, 2026
                      </Typography>
                    </Stack>
                  </Stack>
                </Box>
                <DeletionIllustration />
              </Stack>
            </Box>

            {/* Content Body */}
            <Box sx={{ px: { xs: 3, sm: 5, md: 6 }, py: 3 }}>
              
              {/* Quick Jump Index Card */}
              <Card elevation={0} variant="outlined" sx={{ my: 3, borderRadius: 3, bgcolor: "background.default", borderColor: "divider" }}>
                <CardContent sx={{ p: { xs: 2, sm: 3 }, "&:last-child": { pb: { xs: 2, sm: 3 } } }}>
                  <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 1.5, display: "flex", alignItems: "center", gap: 1 }}>
                    <InfoIcon color="primary" fontSize="small" /> Policy Navigation Directory
                  </Typography>
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={2} useFlexGap flexWrap="wrap">
                    <MuiLink href="#section-01" underline="hover" sx={{ fontSize: "0.88rem", fontWeight: 600, color: "text.primary" }}>
                      01. How to Delete Account
                    </MuiLink>
                    <MuiLink href="#section-02" underline="hover" sx={{ fontSize: "0.88rem", fontWeight: 600, color: "text.primary" }}>
                      02. What Data is Deleted
                    </MuiLink>
                    <MuiLink href="#section-03" underline="hover" sx={{ fontSize: "0.88rem", fontWeight: 600, color: "text.primary" }}>
                      03. Retained Records &amp; Logs
                    </MuiLink>
                    <MuiLink href="#section-04" underline="hover" sx={{ fontSize: "0.88rem", fontWeight: 600, color: "text.primary" }}>
                      04. Support &amp; Contact
                    </MuiLink>
                  </Stack>
                </CardContent>
              </Card>

              {/* Section 01: How to delete your account */}
              <PolicySection number="01" title="How to delete your account" id="section-01">
                <Typography sx={bodySx}>
                  You can effortlessly start your account removal directly inside the BunkMates mobile app or web interface. Follow the navigation trail below:
                </Typography>

                {/* Path Navigation Breadcrumb Chips */}
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1.2,
                    flexWrap: "wrap",
                    my: 2.5,
                    p: 2,
                    borderRadius: 3,
                    bgcolor: "action.hover",
                    border: "1px solid",
                    borderColor: "divider",
                  }}
                >
                  {["Profile", "Settings", "Account Settings", "Account Deletion"].map((label, index) => (
                    <React.Fragment key={label}>
                      <Chip
                        label={label}
                        size="medium"
                        variant={index === 3 ? "filled" : "outlined"}
                        color={index === 3 ? "error" : "default"}
                        sx={{ fontWeight: 700, fontSize: "0.85rem" }}
                      />
                      {index < 3 && (
                        <Typography aria-hidden="true" variant="body2" sx={{ fontWeight: 800, color: "primary.main" }}>
                          →
                        </Typography>
                      )}
                    </React.Fragment>
                  ))}
                </Box>

                {/* Interactive Timeline Steps */}
                <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 2, mt: 3, display: "flex", alignItems: "center", gap: 1 }}>
                  <ScheduleIcon color="primary" fontSize="small" /> Step-by-Step Interactive Timeline
                </Typography>

                <Box sx={{ position: "relative", pl: { xs: 2.5, sm: 3 }, borderLeft: "2px solid", borderColor: "primary.main", my: 2, ml: 1 }}>
                  {[
                    { title: "Open BunkMates", desc: "Launch your app or log into your dashboard and navigate to your Profile." },
                    { title: "Access Settings", desc: "Tap the settings icon in the top right corner of your profile screen." },
                    { title: "Select Account Settings", desc: "Open the account security and privacy management drawer." },
                    { title: "Initiate Account Deletion", desc: "Tap on 'Account Deletion' to view account termination options." },
                    { title: "Confirm & Finalize", desc: "Review the data impact warning screen carefully and confirm your choice to terminate." },
                  ].map((step, index) => (
                    <Box key={step.title} sx={{ position: "relative", mb: 3, lastChild: { mb: 0 } }}>
                      {/* Node Bullet */}
                      <Box
                        aria-hidden="true"
                        sx={{
                          position: "absolute",
                          left: { xs: "-33.5px", sm: "-39.5px" },
                          top: 0,
                          width: 26,
                          height: 26,
                          borderRadius: "50%",
                          bgcolor: "background.paper",
                          border: "3px solid",
                          borderColor: "primary.main",
                          display: "grid",
                          placeItems: "center",
                          fontSize: "0.72rem",
                          fontWeight: 800,
                          color: "text.primary",
                        }}
                      >
                        {index + 1}
                      </Box>
                      <Box sx={{ pl: 1 }}>
                        <Typography variant="subtitle2" fontWeight={800} sx={{ fontSize: "0.98rem", color: "text.primary" }}>
                          {step.title}
                        </Typography>
                        <Typography sx={{ ...bodySx, fontSize: "0.9rem", mt: 0.3 }}>
                          {step.desc}
                        </Typography>
                      </Box>
                    </Box>
                  ))}
                </Box>

                {/* Warning Callout Box */}
                <Box
                  sx={{
                    mt: 3,
                    p: 2.5,
                    display: "flex",
                    gap: 1.5,
                    alignItems: "flex-start",
                    borderRadius: 3,
                    bgcolor: "warning.50",
                    color: "warning.dark",
                    border: 1,
                    borderColor: "warning.200",
                  }}
                >
                  <InfoIcon sx={{ mt: "2px", fontSize: 22, flex: "0 0 auto", color: "warning.main" }} />
                  <Typography sx={{ fontSize: "0.92rem", lineHeight: 1.7, fontWeight: 500 }}>
                    <strong>Permanent Action:</strong> Account deletion is permanent and cannot be undone. All active sessions, offline cached files, and personal logs will be wiped instantly.
                  </Typography>
                </Box>

                <Typography sx={{ ...bodySx, mt: 2.5 }}>
                  <strong>Locked out or unable to access the app?</strong> Send an email to{" "}
                  <MuiLink href={`mailto:${SUPPORT_EMAIL}`} underline="hover" sx={{ fontWeight: 700 }}>
                    {SUPPORT_EMAIL}
                  </MuiLink>{" "}
                  with the subject <em>“Account Deletion Request”</em>. Include the email address registered to your BunkMates account so our engineering team can locate and verify your profile. Never send your account password.
                </Typography>
                <Typography sx={{ ...bodySx, mt: 1.5 }}>
                  We strive to process verified manual deletion requests within <strong>30 days</strong> of confirmation.
                </Typography>
              </PolicySection>

              <Divider sx={{ my: 2 }} />

              {/* Section 02: What data may be deleted */}
              <PolicySection number="02" title="What data may be deleted" id="section-02">
                <Typography sx={bodySx}>
                  When your account deletion procedure is fully completed, BunkMates permanently deletes or disassociates all account-linked profile information, subject to technical constraints and legal retention guidelines. This includes:
                </Typography>
                <PolicyList
                  items={[
                    { title: "Profile Information", description: "Your registered display name, email address, phone number, and custom profile avatars." },
                    { title: "Authentication Credentials", description: "Secure login identifiers and tokens managed by our auth providers." },
                    { title: "Personal Notes & Checklists", description: "All private checklists, custom timeline notes, and individual expense records tied solely to your user UID." },
                    { title: "Push Notification Tokens", description: "Device push registration tokens and hardware identifiers." },
                  ]}
                />
              </PolicySection>

              <Divider sx={{ my: 2 }} />

              {/* Section 03: Data that may be retained */}
              <PolicySection number="03" title="Data that may be retained" id="section-03">
                <Typography sx={bodySx}>
                  In compliance with legal obligations and operational stability, certain limited records may be preserved under secure protocols:
                </Typography>
                <PolicyList
                  items={[
                    { title: "Shared Trip Records & Expenses", description: "Group itineraries, shared trip budgets, and split expense history may remain accessible to co-travelers to preserve group financial accuracy. Identifying references to your deleted account are anonymized where feasible." },
                    { title: "Legal & Security Logs", description: "Limited audit trails necessary for fraud prevention, anti-abuse investigations, or legal compliance." },
                    { title: "Encrypted Backups", description: "Residual data snapshots may persist securely in encrypted offline backups until the standard retention overwrite cycle occurs." },
                  ]}
                />
              </PolicySection>

              <Divider sx={{ my: 2 }} />

              {/* Section 04: Contact and support */}
              <PolicySection number="04" title="Contact and support" id="section-04">
                <Typography sx={bodySx}>
                  Have questions regarding your privacy rights or need assistance terminating an account? Reach out to our team directly:
                </Typography>
                <Stack spacing={2} sx={{ mt: 2.5 }}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 2,
                      p: 2.5,
                      border: 1,
                      borderColor: "divider",
                      borderRadius: 3.5,
                      bgcolor: "background.default",
                      transition: "all 0.2s ease",
                      "&:hover": { borderColor: "primary.main", boxShadow: "0 4px 16px rgba(0,0,0,0.03)" },
                    }}
                  >
                    <MailIcon color="primary" sx={{ fontSize: 26 }} />
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="caption" color="text.secondary" fontWeight={700}>SUPPORT &amp; DELETION DESK</Typography>
                      <Typography sx={{ overflowWrap: "anywhere", fontWeight: 700 }}>
                        <MuiLink href={`mailto:${SUPPORT_EMAIL}`} underline="hover">
                          {SUPPORT_EMAIL}
                        </MuiLink>
                      </Typography>
                    </Box>
                    <Button
                      component="a"
                      href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent("Account Deletion Request")}`}
                      size="small"
                      variant="contained"
                      sx={{ borderRadius: 2, textTransform: "none", fontWeight: 700, px: 2 }}
                    >
                      Email support
                    </Button>
                  </Box>

                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 2,
                      p: 2.5,
                      border: 1,
                      borderColor: "divider",
                      borderRadius: 3.5,
                      bgcolor: "background.default",
                      transition: "all 0.2s ease",
                      "&:hover": { borderColor: "primary.main", boxShadow: "0 4px 16px rgba(0,0,0,0.03)" },
                    }}
                  >
                    <MailIcon color="action" sx={{ fontSize: 26 }} />
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="caption" color="text.secondary" fontWeight={700}>OFFICIAL INQUIRIES</Typography>
                      <Typography sx={{ overflowWrap: "anywhere", fontWeight: 700 }}>
                        <MuiLink href={`mailto:${OFFICIAL_EMAIL}`} underline="hover">
                          {OFFICIAL_EMAIL}
                        </MuiLink>
                      </Typography>
                    </Box>
                    <Button
                      component="a"
                      href={`mailto:${OFFICIAL_EMAIL}`}
                      size="small"
                      variant="outlined"
                      sx={{ borderRadius: 2, textTransform: "none", fontWeight: 700, px: 2 }}
                    >
                      Contact
                    </Button>
                  </Box>
                </Stack>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 2, fontWeight: 600 }}>
                  Application Identifier: BunkMates v2.4 (Secure Cloud Edition)
                </Typography>
              </PolicySection>

              <Divider sx={{ my: 3 }} />

              {/* Related Policies Footer Section */}
              <Box sx={{ py: { xs: 2, sm: 3 }, textAlign: "center" }}>
                <Typography sx={{ ...sectionTitleSx, mb: 1, fontSize: "1.05rem" }}>
                  Explore Related Policies
                </Typography>
                <Typography sx={bodySx}>
                  Read our{" "}
                  <MuiLink component={Link} to="/privacy-policy" underline="hover" sx={{ fontWeight: 700 }}>
                    Privacy Policy
                  </MuiLink>{" "}
                  and{" "}
                  <MuiLink component={Link} to="/terms" underline="hover" sx={{ fontWeight: 700 }}>
                    Terms &amp; Conditions
                  </MuiLink>{" "}
                  to learn more about data protection standards.
                </Typography>
              </Box>

            </Box>
          </Paper>

          {/* Copyright Footer */}
          <Typography
            component="footer"
            variant="caption"
            color="text.secondary"
            sx={{ display: "block", textAlign: "center", mt: 4, mb: 2, fontWeight: 600, letterSpacing: "0.02em" }}
          >
            © {new Date().getFullYear()} BunkMates. All rights reserved. Built with security in mind.
          </Typography>
        </Container>
      </Box>
    </Box>
  );
}