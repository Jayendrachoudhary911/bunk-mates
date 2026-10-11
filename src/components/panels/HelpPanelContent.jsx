// src/components/panels/HelpPanelContent.jsx
import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  Alert,
  CircularProgress,
} from "@mui/material";
import {
  ExpandMore as ExpandMoreIcon,
  FeedbackOutlined as FeedbackIcon,
} from "../../icons";
import { useAuth } from "../../hooks/useAuth";
import { useThemeToggle } from "../../contexts/ThemeToggleContext";
import { db } from "../../firebase";
import { collection, addDoc, serverTimestamp, onSnapshot } from "firebase/firestore";

const HelpPanelContent = () => {
  const { user: currentUser } = useAuth();
  const { mode } = useThemeToggle();
  const isDark = mode === "dark";

  const [faqs, setFaqs] = useState([]);
  const [loadingFaqs, setLoadingFaqs] = useState(true);
  const [feedback, setFeedback] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Real-time listener for FAQs from Firestore database
  useEffect(() => {
    const q = collection(db, "faqs");
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setFaqs(list);
        setLoadingFaqs(false);
      },
      (err) => {
        console.error("Error fetching faqs:", err);
        setFaqs([]);
        setLoadingFaqs(false);
      }
    );
    return () => unsubscribe();
  }, []);

  const handleSubmitFeedback = async (e) => {
    e.preventDefault();
    if (!feedback.trim()) return;

    setSubmitting(true);
    try {
      await addDoc(collection(db, "feedback"), {
        uid: currentUser?.uid || "anonymous",
        userEmail: currentUser?.email || "anonymous",
        message: feedback.trim(),
        timestamp: serverTimestamp(),
      });
      setSubmitted(true);
      setFeedback("");
    } catch (err) {
      console.error("Error submitting feedback:", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      {/* ─── Frequently Asked Questions ─── */}
      <Box>
        <Typography
          variant="caption"
          sx={{
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: 1,
            color: isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)",
            display: "block",
            mb: 1.5,
          }}
        >
          Frequently Asked Questions
        </Typography>

        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          {loadingFaqs ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
              <CircularProgress size={22} sx={{ color: isDark ? "#fff" : "#111" }} />
            </Box>
          ) : faqs.length === 0 ? (
            <Box
              sx={{
                p: 2,
                borderRadius: "14px",
                backgroundColor: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)",
                border: `1px dashed ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}`,
                textAlign: "center",
              }}
            >
              <Typography variant="body2" sx={{ color: isDark ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.6)", fontSize: "0.85rem" }}>
                No database FAQs currently listed. Submit your feedback or questions below!
              </Typography>
            </Box>
          ) : (
            faqs.map((faq, idx) => (
              <Accordion
                key={faq.id || idx}
                elevation={0}
                disableGutters
                sx={{
                  borderRadius: "14px !important",
                  overflow: "hidden",
                  backgroundColor: isDark
                    ? "rgba(255, 255, 255, 0.04)"
                    : "rgba(0, 0, 0, 0.03)",
                  border: `1px solid ${
                    isDark ? "rgba(255, 255, 255, 0.06)" : "rgba(0, 0, 0, 0.06)"
                  }`,
                  "&:before": { display: "none" },
                }}
              >
                <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ fontSize: 18 }} />}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {faq.question || faq.q || faq.title}
                  </Typography>
                </AccordionSummary>
                <AccordionDetails sx={{ pt: 0 }}>
                  <Typography
                    variant="body2"
                    sx={{
                      color: isDark ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.7)",
                      fontSize: "0.85rem",
                      lineHeight: 1.5,
                    }}
                  >
                    {faq.answer || faq.a || faq.content}
                  </Typography>
                </AccordionDetails>
              </Accordion>
            ))
          )}
        </Box>
      </Box>

      <Divider sx={{ borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)" }} />

      {/* ─── Send Feedback ─── */}
      <Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
          <FeedbackIcon sx={{ fontSize: 18, color: "text.secondary" }} />
          <Typography variant="body2" sx={{ fontWeight: 700 }}>
            Send Us Feedback or Ideas
          </Typography>
        </Box>

        <Typography
          variant="caption"
          sx={{
            color: isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)",
            display: "block",
            mb: 1.5,
          }}
        >
          Have a suggestion or found a bug? Let our engineering team know directly.
        </Typography>

        {submitted ? (
          <Alert
            severity="success"
            onClose={() => setSubmitted(false)}
            sx={{ borderRadius: 3 }}
          >
            Thank you! Your feedback has been received.
          </Alert>
        ) : (
          <Box
            component="form"
            onSubmit={handleSubmitFeedback}
            sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}
          >
            <TextField
              multiline
              rows={3}
              placeholder="Tell us what you think or what we can improve..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 3,
                },
              }}
            />

            <Button
              type="submit"
              variant="contained"
              disabled={submitting || !feedback.trim()}
              sx={{
                borderRadius: 2.5,
                textTransform: "none",
                fontWeight: 600,
                alignSelf: "flex-end",
                px: 3,
              }}
            >
              {submitting ? <CircularProgress size={18} /> : "Submit Feedback"}
            </Button>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default HelpPanelContent;
