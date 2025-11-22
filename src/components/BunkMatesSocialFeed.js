// src/pages/BunkMatesSocialFeed.jsx

import React, { useEffect } from "react";

export default function BunkMatesSocialFeed() {
  useEffect(() => {
    // Prevent duplicate script injection
    const existingScript = document.getElementById("curator-script");
    if (existingScript) return;

    const script = document.createElement("script");
    script.id = "curator-script";
    script.async = true;
    script.charset = "UTF-8";
    script.src =
      "https://cdn.curator.io/published/339a0326-4af1-4a3a-9d8a-584b088ccd5c_e631v0dg.js";

    document.body.appendChild(script);
  }, []);

  return (
    <div
      style={{
        padding: "20px",
        maxWidth: "1200px",
        margin: "0 auto",
        color: "#fff"
      }}
    >
      <h1 style={{ fontSize: "28px", marginBottom: "20px" }}>
        BunkMates – Social Wall
      </h1>

      {/* Curator feed container */}
      <div id="curator-feed-default-feed-layout">
        <a
          href="https://curator.io"
          target="_blank"
          rel="noreferrer"
          className="crt-logo crt-tag"
        >
          Powered by Curator.io
        </a>
      </div>
    </div>
  );
}
