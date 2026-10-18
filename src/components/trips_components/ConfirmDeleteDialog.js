import React from "react";
import {
  Box,
  Typography,
  Button,
  SwipeableDrawer,
  IconButton,
  Stack,
} from "@mui/material";
import { motion } from "framer-motion";
import {
  CloseOutlined as CloseOutlinedIcon,
  WarningAmberRounded as WarningAmberRoundedIcon,
} from "../../icons";
import {
  drawerPaperSx,
  drawerBackdropSx,
  DrawerHandle,
  glassIconBtnSx,
} from "../../theme/designSystem";

const ConfirmDeleteDrawer = ({
  confirmDeleteOpen,
  setConfirmDeleteOpen,
  handleDeleteTrip,
  mode,
}) => {
  const isDarkMode = mode === "dark";

  const handleClose = () => {
    setConfirmDeleteOpen(false);
  };

  return (
    <SwipeableDrawer
      anchor="bottom"
      open={confirmDeleteOpen}
      onClose={handleClose}
      onOpen={() => {}}
      disableSwipeToOpen={false}
      PaperProps={{
        sx: {
          ...drawerPaperSx(mode, {
            maxHeight: "85vh",
          }),
          overflowY: "auto",
        },
      }}
      ModalProps={{
        BackdropProps: {
          sx: drawerBackdropSx,
        },
      }}
    >
      {/* Mobile Drag Handle */}
      <Box sx={{ display: { xs: "block", md: "none" } }}>
        <DrawerHandle mode={mode} />
      </Box>

      {/* Header with Desktop Close Button */}
      <Box
        sx={{
          px: { xs: 0, md: 3.5 },
          pt: { xs: 1, md: 3 },
          pb: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          maxWidth: 600,
          mx: "auto",
          width: "100%",
          boxSizing: "border-box",
        }}
      >
        <Box sx={{ width: 40, display: { xs: 'none', md: 'block' } }} />
        <Typography
          variant="h6"
          fontWeight={800}
          textAlign="center"
          sx={{
            color: isDarkMode ? "#fff" : "#000",
            letterSpacing: "-0.3px",
            flexGrow: 1,
          }}
        >
          Confirm Delete
        </Typography>
        <IconButton
          onClick={handleClose}
          size="small"
          sx={glassIconBtnSx(mode, { p: 1, display: { xs: 'none', md: 'flex' } })}
        >
          <CloseOutlinedIcon fontSize="small" />
        </IconButton>
      </Box>

      {/* Content Section */}
      <Box
        component={motion.div}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        sx={{
          maxWidth: 600,
          mx: "auto",
          width: "100%",
          boxSizing: "border-box",
          px: { xs: 0, md: 3.5 },
          pb: { xs: 0, md: 4 },
          textAlign: "center",
        }}
      >
        {/* Warning Icon Box */}
<Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            my: 3,
          }}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
          >
            <Box
              sx={{
                width: 76,
                height: 76,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: isDarkMode
                  ? "rgba(244, 67, 54, 0.15)"
                  : "rgba(244, 67, 54, 0.08)",
                border: "0px solid",
              }}
            >
              <WarningAmberRoundedIcon
                sx={{
                  fontSize: 40,
                  color: "#ef4444",
                }}
              />
            </Box>
          </motion.div>
        </Box>

        <Typography
          variant="body1"
          color="text.secondary"
          textAlign="center"
          sx={{
            px: 2,
            fontSize: "0.95rem",
            lineHeight: 1.6,
            mb: 3.5,
          }}
        >
          Are you sure you want to permanently delete this trip? <br />
          <Typography
            component="span"
            sx={{
              display: "inline-block",
              mt: 0.75,
              color: "#ef4444",
              fontWeight: 700,
              fontSize: "0.88rem",
            }}
          >
            This action cannot be undone and will remove all associated data.
          </Typography>
        </Typography>

        {/* Action Buttons */}
<Stack direction="row" spacing={1.5}>
          <Button
            fullWidth
            variant="outlined"
            onClick={handleClose}
            sx={{
              borderRadius: 8,
              py: 1.4,
              textTransform: "none",
              fontWeight: 700,
              fontSize: "0.95rem",
              border: "none",
              boxShadow: isDarkMode ? 'inset 0 1px 1px rgba(255, 255, 255, 0.11), 0 1px 4px rgba(0,0,0,0.1)' : 'inset 0 1px 4px rgba(12, 12, 12, 0.11), 0 1px 4px rgba(0,0,0,0.1)',
              color: "text.primary",
              bgcolor: isDarkMode ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.01)",
              transition: "all 0.2s ease",
              "&:hover": {
                backgroundColor: isDarkMode ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
              },
            }}
          >
            Cancel
          </Button>

          <Button
            fullWidth
            variant="contained"
            color="error"
            onClick={handleDeleteTrip}
            sx={{
              borderRadius: 8,
              py: 1.4,
              textTransform: "none",
              fontWeight: 700,
              fontSize: "0.95rem",
              boxShadow: "none",
              background: '#b900002e',
              color: mode === "dark" ? "#ffabab" : "#ae3636" ,
              transition: "all 0.2s ease",
              "&:hover": {
                background: '#b900004d',
              },
            }}
          >
            Delete Trip
          </Button>
        </Stack>
      </Box>
    </SwipeableDrawer>
  );
};

export default ConfirmDeleteDrawer;