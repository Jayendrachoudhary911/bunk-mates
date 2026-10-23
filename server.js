// server.js
// Optional production static server & local development utility
const express = require("express");
const path = require("path");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Serve static assets from build if available
const buildPath = path.join(__dirname, "build");
app.use(express.static(buildPath));

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "healthy", service: "BunkMates Web Server", timestamp: new Date().toISOString() });
});

// Fallback to React index.html for SPA client-side routing
app.get("*", (req, res) => {
  res.sendFile(path.join(buildPath, "index.html"), (err) => {
    if (err) {
      res.status(200).send("BunkMates server running. Run 'npm start' for React development mode or 'npm run build' before serving.");
    }
  });
});

app.listen(PORT, () => {
  console.log(`[BunkMates] Server listening on port ${PORT}`);
});
