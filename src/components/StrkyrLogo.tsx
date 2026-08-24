"use client";

import React from "react";

interface StrkyrLogoProps {
  size?: number;
  className?: string;
  withText?: boolean;
  textColor?: string;
  subtitle?: string;
  accentColor?: string;
}

/**
 * STRKYR (Old Norse for Strength / Fortitude)
 * Precision 2D Scandinavian Monoline Valknut.
 * Minimalist geometric interlocking ribbon triangles with a single electric cobalt accent.
 */
export function StrkyrLogo({
  size = 56,
  className = "",
  withText = false,
  textColor = "#0f172a",
  subtitle = "COACH STUDIO",
  accentColor = "#2563eb",
}: StrkyrLogoProps) {
  return (
    <div
      className={`strkyr-logo-wrap ${className}`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: withText ? "14px" : "0",
        userSelect: "none",
      }}
    >
      {/* Precision 2D Monoline Valknut Vector */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ flexShrink: 0 }}
      >
        {/* Triangle 1: Top Apex (Matte Obsidian) */}
        <path
          d="M50 14 L76 58 L66 58 L50 30 L34 58 L24 58 Z"
          fill="#0f172a"
        />

        {/* Triangle 2: Bottom Right (Electric Cobalt Accent Core) */}
        <path
          d="M62 36 L88 80 L28 80 L33 71 L73 71 L57 44 Z"
          fill={accentColor}
        />

        {/* Triangle 3: Bottom Left (Matte Obsidian Interlock) */}
        <path
          d="M38 36 L43 44 L27 71 L67 71 L72 80 L12 80 Z"
          fill="#0f172a"
        />

        {/* Precision Interlocking Corner Highlights */}
        <path
          d="M50 14 L55 23 L45 23 Z"
          fill="#0f172a"
        />
      </svg>

      {/* Modern Wordmark */}
      {withText && (
        <div style={{ display: "flex", flexDirection: "column", textAlign: "left" }}>
          <div
            style={{
              fontSize: `${Math.round(size * 0.42)}px`,
              fontWeight: 900,
              color: textColor,
              letterSpacing: "-0.04em",
              lineHeight: 1,
              fontFamily: "system-ui, -apple-system, sans-serif",
            }}
          >
            STRKYR
          </div>
          <div
            style={{
              fontSize: `${Math.max(9, Math.round(size * 0.16))}px`,
              fontWeight: 700,
              color: accentColor,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              marginTop: "4px",
              fontFamily: "system-ui, -apple-system, sans-serif",
            }}
          >
            {subtitle}
          </div>
        </div>
      )}
    </div>
  );
}

export default StrkyrLogo;
