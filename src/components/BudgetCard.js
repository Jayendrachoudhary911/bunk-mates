import React from "react";
import { Box, Typography, Paper } from "@mui/material";

export default function BudgetCard({ data, content }) {
  if (!data?.items) return null;

  return (
    <Paper sx={{
      mt: 1,
      p: 2,
      borderRadius: 3,
      background: "#020617",
      border: "1px solid rgba(255,255,255,0.08)"
    }}>
      <Typography variant="h6" fontWeight={700}>
        Budget Breakdown
      </Typography>

      {data.items.map((item, i) => (
        <Box key={i} sx={{ display: "flex", justifyContent: "space-between", mt: 1 }}>
          <Typography>{item.category}</Typography>
          <Typography>₹{item.amount}</Typography>
        </Box>
      ))}

      <Typography sx={{ mt: 2, fontWeight: 700 }}>
        Total: ₹{data.total}
      </Typography>

      {content && (
        <Typography variant="body2" sx={{ mt: 1 }}>
          {content}
        </Typography>
      )}
    </Paper>
  );
}