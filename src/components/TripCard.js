import React from "react";
import { Box, Typography, Paper, Chip } from "@mui/material";

export default function TripCard({ data, content }) {
  if (!data) return null;

  return (
    <Paper sx={{
      mt: 1,
      p: 2,
      borderRadius: 3,
      background: "linear-gradient(135deg, #1e293b, #020617)",
      border: "1px solid rgba(255,255,255,0.08)"
    }}>
      <Typography variant="h6" fontWeight={700}>
        {data.name}
      </Typography>

      <Typography variant="body2" sx={{ opacity: 0.7 }}>
        {data.from} → {data.to}
      </Typography>

      <Box sx={{ mt: 1, display: "flex", gap: 1, flexWrap: "wrap" }}>
        <Chip label={`${data.days} days`} />
        <Chip label={`₹${data.budget}`} />
        <Chip label={`${data.members} members`} />
      </Box>

      {content && (
        <Typography variant="body2" sx={{ mt: 1 }}>
          {content}
        </Typography>
      )}
    </Paper>
  );
}