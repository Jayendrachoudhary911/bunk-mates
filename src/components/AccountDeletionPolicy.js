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

export default function AccountDeletionPolicyDark() {
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
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <Typography
              variant="h3"
              fontWeight={700}
              gutterBottom
              sx={{
                textAlign: "center",
                color: "#ffffff",
                fontSize: { xs: "1.8rem", sm: "2.4rem" },
              }}
            >
              BunkMates Account Deletion Policy
            </Typography>

            <Typography
              variant="subtitle2"
              color="rgba(200,200,200,0.75)"
              sx={{ textAlign: "center", mb: 3 }}
            >
              Effective Date: October 9, 2025 &nbsp; | &nbsp; Last Updated:
              November 20, 2025
            </Typography>

            <Divider sx={{ mb: 4, borderColor: "rgba(255,255,255,0.06)" }} />

            <Typography variant="body1" sx={{ color: "#ccc", mb: 2, lineHeight: 1.7 }}>
              At <b>BunkMates</b>, we respect your privacy and your right to control your personal data.
              In compliance with Google Play Store policies, we provide a simple and transparent way for users
              to request the deletion of their accounts and associated data.
            </Typography>

            <Typography variant="h6" fontWeight={700} sx={{ color: "#fff", mt: 3, mb: 1.5 }}>
              1. How to Delete Your Account
            </Typography>

            <Typography variant="body1" sx={{ color: "#ccc", mb: 1.5 }}>
              You can request the deletion of your account and data through the following two methods:
            </Typography>

            <Typography variant="subtitle1" fontWeight={700} sx={{ color: "#fff", mt: 1 }}>
              Method A: In-App Deletion (Recommended)
            </Typography>
            <Typography variant="body2" sx={{ color: "#aaa", mb: 2 }}>
              If you still have the BunkMates app installed, you can delete your account instantly:
            </Typography>
            <List dense disablePadding sx={{ pl: 2, mb: 2 }}>
              <ListItem sx={{ py: 0.3 }}>
                <ListItemText
                  primary="Open the BunkMates app."
                  primaryTypographyProps={{ sx: { color: "#ccc" } }}
                />
              </ListItem>
              <ListItem sx={{ py: 0.3 }}>
                <ListItemText
                  primary="Navigate to Profile Icon > Accounts."
                  primaryTypographyProps={{ sx: { color: "#ccc" } }}
                />
              </ListItem>
              <ListItem sx={{ py: 0.3 }}>
                <ListItemText
                  primary="Select Delete Account."
                  primaryTypographyProps={{ sx: { color: "#ccc" } }}
                />
              </ListItem>
              <ListItem sx={{ py: 0.3 }}>
                <ListItemText
                  primary="Confirm your choice. This action is irreversible."
                  primaryTypographyProps={{ sx: { color: "#ccc" } }}
                />
              </ListItem>
            </List>

            <Typography variant="subtitle1" fontWeight={700} sx={{ color: "#fff", mt: 1 }}>
              Method B: Web Request (If you uninstalled the app)
            </Typography>
            <Typography variant="body2" sx={{ color: "#aaa", mb: 2 }}>
              If you have already uninstalled the app or cannot access it, you may request account deletion via
              our support channel:
            </Typography>
            <List dense disablePadding sx={{ pl: 2, mb: 3 }}>
              <ListItem sx={{ py: 0.3 }}>
                <ListItemText
                  primary={<span>Email us at <b>help.bunkmates@gmail.com</b> with the subject line: <i>"Account Deletion Request"</i>.</span>}
                  primaryTypographyProps={{ sx: { color: "#ccc" } }}
                />
              </ListItem>
              <ListItem sx={{ py: 0.3 }}>
                <ListItemText
                  primary="Please include your registered email address in the body of the email to help us locate your account."
                  primaryTypographyProps={{ sx: { color: "#ccc" } }}
                />
              </ListItem>
              <ListItem sx={{ py: 0.3 }}>
                <ListItemText
                  primary="We will process your request and permanently delete your account within 30 days."
                  primaryTypographyProps={{ sx: { color: "#ccc" } }}
                />
              </ListItem>
            </List>

            <Divider sx={{ my: 3, borderColor: "rgba(255,255,255,0.06)" }} />

            <Typography variant="h6" fontWeight={700} sx={{ color: "#fff", mb: 1.5 }}>
              2. What Data Is Deleted?
            </Typography>
            <Typography variant="body2" sx={{ color: "#aaa", mb: 2 }}>
              When your account is deleted, the following data is permanently removed from our servers (including Firebase and Vercel):
            </Typography>
            <List dense disablePadding sx={{ pl: 2, mb: 3 }}>
              <ListItem sx={{ py: 0.3 }}>
                <ListItemText
                  primary={<span><b>Identity Data:</b> Your name, email address, mobile number, and profile photo.</span>}
                  primaryTypographyProps={{ sx: { color: "#ccc" } }}
                />
              </ListItem>
              <ListItem sx={{ py: 0.3 }}>
                <ListItemText
                  primary={<span><b>Authentication Records:</b> Your login credentials and unique user ID from Firebase Authentication.</span>}
                  primaryTypographyProps={{ sx: { color: "#ccc" } }}
                />
              </ListItem>
              <ListItem sx={{ py: 0.3 }}>
                <ListItemText
                  primary={<span><b>Private User Content:</b> Personal notes, private checklists, and individual expenses that are not part of a shared group settlement.</span>}
                  primaryTypographyProps={{ sx: { color: "#ccc" } }}
                />
              </ListItem>
              <ListItem sx={{ py: 0.3 }}>
                <ListItemText
                  primary={<span><b>Device Data:</b> Any associated device tokens or crash logs linked specifically to your user ID.</span>}
                  primaryTypographyProps={{ sx: { color: "#ccc" } }}
                />
              </ListItem>
            </List>

            <Divider sx={{ my: 3, borderColor: "rgba(255,255,255,0.06)" }} />

            <Typography variant="h6" fontWeight={700} sx={{ color: "#fff", mb: 1.5 }}>
              3. What Data Is Retained?
            </Typography>
            <Typography variant="body2" sx={{ color: "#aaa", mb: 2 }}>
              In some cases, we may retain specific data for legitimate legal or operational reasons:
            </Typography>
            <List dense disablePadding sx={{ pl: 2, mb: 3 }}>
              <ListItem sx={{ py: 0.3 }}>
                <ListItemText
                  primary={<span><b>Shared Trip Data:</b> If you were part of a shared trip, some contributions (like itinerary items or group expenses) may remain visible to other group members to maintain the integrity of the trip's history. However, your name will be anonymized (e.g., "Deleted User").</span>}
                  primaryTypographyProps={{ sx: { color: "#ccc" } }}
                />
              </ListItem>

              <ListItem sx={{ py: 0.3 }}>
                <ListItemText
                  primary={<span><b>Security:</b> Limited logs may be retained for a short period to prevent fraud or abuse of our services.</span>}
                  primaryTypographyProps={{ sx: { color: "#ccc" } }}
                />
              </ListItem>
            </List>

            <Divider sx={{ my: 3, borderColor: "rgba(255,255,255,0.06)" }} />

            <Typography variant="h6" fontWeight={700} sx={{ color: "#fff", mb: 1.5 }}>
              4. Contact Us
            </Typography>
            <Typography variant="body2" sx={{ color: "#ccc", mb: 2 }}>
              If you have any trouble deleting your account, please contact our Data Controllers:
            </Typography>

            <List dense disablePadding sx={{ pl: 2 }}>
              <ListItem sx={{ py: 0.3 }}>
                <ListItemText
                  primary={<span><b>Email:</b> team.bunkmates@gmail.com</span>}
                  primaryTypographyProps={{ sx: { color: "#ccc" } }}
                />
              </ListItem>
              <ListItem sx={{ py: 0.3 }}>
                <ListItemText
                  primary={<span><b>App Name:</b> BunkMates</span>}
                  primaryTypographyProps={{ sx: { color: "#ccc" } }}
                />
              </ListItem>
            </List>

            {/* Footer Navigation */}
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
                or{" "}
                <MuiLink
                  component={Link}
                  to="/terms"
                  color="primary"
                  underline="hover"
                >
                  Terms & Conditions
                </MuiLink>{" "}
                for more details.
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
          borderTop: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <Typography variant="body2" color="rgba(255,255,255,0.6)">
          © {new Date().getFullYear()} BunkMates. All rights reserved.
        </Typography>
      </Box>
    </>
  );
}
