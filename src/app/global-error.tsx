"use client";

import React from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body style={{ margin: 0, fontFamily: "system-ui, -apple-system, sans-serif", background: "#f8fafc", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ background: "#ffffff", padding: "32px", borderRadius: "12px", border: "1px solid #e2e8f0", maxWidth: "420px", textAlign: "center" }}>
          <h2 style={{ fontSize: "1.2rem", fontWeight: 700, color: "#0f172a", marginBottom: "8px" }}>Critical Application Error</h2>
          <p style={{ fontSize: "0.85rem", color: "#64748b", marginBottom: "20px" }}>A critical system error occurred. Click below to recover.</p>
          <button
            onClick={() => reset()}
            style={{ background: "#2563eb", color: "#ffffff", border: "none", borderRadius: "8px", padding: "10px 18px", fontSize: "0.88rem", fontWeight: 600, cursor: "pointer" }}
          >
            Reload Application
          </button>
        </div>
      </body>
    </html>
  );
}
