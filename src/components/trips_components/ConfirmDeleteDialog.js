import React from "react";
import {
  Box, Typography, Button, Dialog, DialogTitle, DialogContent,
  DialogActions,
} from "@mui/material";
import { AnimatePresence, motion } from "framer-motion";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";

const ConfirmDeleteDialog = ({
  confirmDeleteOpen,
  setConfirmDeleteOpen,
  handleDeleteTrip,
  mode,
}) => {
  return (
    <AnimatePresence>
      {confirmDeleteOpen && (
        <Dialog
          open={confirmDeleteOpen}
          onClose={() => setConfirmDeleteOpen(false)}
          PaperProps={{
            sx: {
              background:
                mode === "dark"
                  ? "linear-gradient(145deg, rgba(20,20,20,0.9), rgba(40,40,40,0.85))"
                  : "linear-gradient(145deg, rgba(255,255,255,0.95), rgba(240,240,240,0.9))",
              p: 2.5,
              borderRadius: 4,
              backdropFilter: "blur(25px)",
              boxShadow: "none",
              width: "100%",
              maxWidth: 420,
              overflow: "hidden",
            },
          }}
          TransitionProps={{
            timeout: 300,
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
          >
            {/* Warning Icon Section */}
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                mb: 2,
              }}
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
              >
                <Box
                  sx={{
                    width: 72,
                    height: 72,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background:
                      mode === "dark"
                        ? "rgba(255, 50, 50, 0.1)"
                        : "rgba(255, 100, 100, 0.15)",
                    boxShadow: "none",
                  }}
                >
                  <WarningAmberRoundedIcon
                    sx={{
                      fontSize: 42,
                      color: "#ff4444",
                    }}
                  />
                </Box>
              </motion.div>
            </Box>

            {/* Title */}
            <DialogTitle
              sx={{
                textAlign: "center",
                fontWeight: "700",
                fontSize: "1.25rem",
                color: mode === "dark" ? "#fff" : "#000",
                pb: 0.5,
              }}
            >
              Confirm Delete
            </DialogTitle>

            {/* Message */}
            <DialogContent>
              <Typography
                color="text.secondary"
                textAlign="center"
                sx={{
                  px: 2,
                  fontSize: "0.95rem",
                  lineHeight: 1.5,
                }}
              >
                Are you sure you want to permanently delete this trip? <br />
                <Typography
                  component="span"
                  sx={{
                    color: "#e53935",
                    fontWeight: "600",
                  }}
                >
                  This action cannot be undone.
                </Typography>
              </Typography>
            </DialogContent>

            {/* Buttons */}
            <DialogActions
              sx={{
                justifyContent: "center",
                gap: 2,
                mt: 2,
                pb: 1,
              }}
            >
              <Button
                variant="outlined"
                onClick={() => setConfirmDeleteOpen(false)}
                sx={{
                  textTransform: "none",
                  borderRadius: 3,
                  px: 3,
                  py: 0.8,
                  fontWeight: 600,
                  borderColor: mode === "dark" ? "#888" : "#aaa",
                  color: mode === "dark" ? "#fff" : "#000",
                  "&:hover": {
                    backgroundColor:
                      mode === "dark" ? "#2a2a2a" : "#f0f0f0",
                    borderColor: mode === "dark" ? "#bbb" : "#000",
                  },
                }}
              >
                Cancel
              </Button>

              <motion.div whileTap={{ scale: 0.95 }}>
                <Button
                  variant="contained"
                  color="error"
                  onClick={handleDeleteTrip}
                  sx={{
                    textTransform: "none",
                    borderRadius: 3,
                    px: 3,
                    py: 0.8,
                    fontWeight: 600,
                    background:
                      "linear-gradient(135deg, #ff4e4e, #d32f2f)",
                    boxShadow: "none",
                    "&:hover": {
                      background:
                        "linear-gradient(135deg, #ff3c3c, #b71c1c)",
                    },
                  }}
                >
                  Delete
                </Button>
              </motion.div>
            </DialogActions>
          </motion.div>
        </Dialog>
      )}
    </AnimatePresence>
  );
};

export default ConfirmDeleteDialog;