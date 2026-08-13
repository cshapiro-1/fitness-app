"use client";

import React, { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Uncaught application error:", error);
  }, [error]);

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f8fafc", padding: "20px" }}>
      <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "32px", maxWidth: "440px", textAlign: "center", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.08)" }}>
        <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "#fee2e2", color: "#dc2626", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: "16px" }}>
          <AlertTriangle size={24} />
        </div>
        <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#0f172a", marginBottom: "8px" }}>
          Something went wrong
        </h2>
        <p style={{ fontSize: "0.88rem", color: "#64748b", marginBottom: "24px", lineHeight: 1.5 }}>
          An unexpected error occurred. You can reload the view to continue where you left off.
        </p>
        <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
          <button
            onClick={() => reset()}
            style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "#2563eb", color: "#ffffff", border: "none", borderRadius: "8px", padding: "10px 18px", fontSize: "0.88rem", fontWeight: 600, cursor: "pointer" }}
          >
            <RefreshCw size={15} />
            <span>Try Again</span>
          </button>
          <a
            href="/dashboard"
            style={{ display: "inline-flex", alignItems: "center", background: "#f1f5f9", color: "#475569", border: "1px solid #cbd5e1", borderRadius: "8px", padding: "10px 18px", fontSize: "0.88rem", fontWeight: 600, textDecoration: "none" }}
          >
            Back to Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}
