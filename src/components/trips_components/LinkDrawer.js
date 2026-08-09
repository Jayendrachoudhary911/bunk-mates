import React from "react";
import {
  Box, Typography, Button, TextField, SwipeableDrawer,
} from "@mui/material";
import AddLinkIcon from "@mui/icons-material/Link";
import {
  drawerPaperSx,
  drawerBackdropSx,
  DrawerHandle,
  glassInputSx,
  ctaButtonSx,
} from "../../theme/designSystem";

const LinkDrawer = ({
  linkDrawerOpen,
  setLinkDrawerOpen,
  newLink,
  setNewLink,
  handleAddLink,
  mode,
}) => {
  return (
    <SwipeableDrawer
      anchor="bottom"
      open={linkDrawerOpen}
      onClose={() => setLinkDrawerOpen(false)}
      PaperProps={{ sx: drawerPaperSx(mode, { maxHeight: "90vh", borderRadius: "22px 22px 0 0" }) }}
      sx={{ "& .MuiBackdrop-root": drawerBackdropSx }}
    >
      <DrawerHandle mode={mode} />

      <Box sx={{ px: 1 }}>
        <Typography variant="h6" fontWeight={700} mb={2}>
          Add Trip Link
        </Typography>
        <TextField
          fullWidth
          label="Link Title"
          variant="outlined"
          sx={{ mb: 2, ...glassInputSx(mode) }}
          value={newLink.title}
          onChange={(e) => setNewLink({ ...newLink, title: e.target.value })}
        />
        <TextField
          fullWidth
          label="Paste Link (e.g. Google Drive, YouTube, etc.)"
          variant="outlined"
          value={newLink.url}
          sx={glassInputSx(mode)}
          onChange={(e) => setNewLink({ ...newLink, url: e.target.value })}
        />
        <Button
          variant="contained"
          fullWidth
          startIcon={<AddLinkIcon />}
          sx={ctaButtonSx(mode, "primary", { mt: 3, py: 1.3 })}
          onClick={handleAddLink}
        >
          Add Link
        </Button>
      </Box>
    </SwipeableDrawer>
  );
};

export default LinkDrawer;