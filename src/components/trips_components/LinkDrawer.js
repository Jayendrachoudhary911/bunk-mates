import React from "react";
import {
  Box, Typography, Button, TextField, SwipeableDrawer, IconButton,
} from "@mui/material";
import AddLinkIcon from "@mui/icons-material/Link";
import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";

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
      PaperProps={{
        sx: {
          p: 3,
          borderTopLeftRadius: 26,
          borderTopRightRadius: 26,
          backgroundColor: mode === "dark" ? "#111" : "#fff",
        },
      }}
    >
      <Typography variant="h6" fontWeight="bold" mb={2}>
        Add Trip Link
      </Typography>
      <TextField
        fullWidth
        label="Link Title"
        variant="outlined"
        sx={{ mb: 2 }}
        value={newLink.title}
        onChange={(e) =>
          setNewLink({ ...newLink, title: e.target.value })
        }
      />
      <TextField
        fullWidth
        label="Paste Link (e.g. Google Drive, YouTube, etc.)"
        variant="outlined"
        value={newLink.url}
        onChange={(e) =>
          setNewLink({ ...newLink, url: e.target.value })
        }
      />
      <Button
        variant="contained"
        fullWidth
        startIcon={<AddLinkIcon />}
        sx={{
          mt: 3,
          py: 1.3,
          borderRadius: 3,
          fontWeight: "bold",
          backgroundColor: mode === "dark" ? "#fff" : "#000",
          color: mode === "dark" ? "#000" : "#fff",
          "&:hover": {
            backgroundColor: mode === "dark" ? "#f3f3f3" : "#111",
          },
        }}
        onClick={handleAddLink}
      >
        Add Link
      </Button>
    </SwipeableDrawer>
  );
};

export default LinkDrawer;