"use client";

import React from "react";

interface StrkyrLogoProps {
  size?: number;
  className?: string;
  withText?: boolean;
  textColor?: string;
  subtitle?: string;
}

/**
 * STRKYR (Styrkr - Old Norse for Strength & Force)
 * Modern minimalist emblem combining Nordic runic geometry (Sowilo / Uruz bindrune)
 * with a high-performance athletic chevron shield.
 */
export function StrkyrLogo({
  size = 56,
  className = "",
  withText = false,
  textColor = "#0f172a",
  subtitle = "COACH STUDIO",
}: StrkyrLogoProps) {
  return (
    <div
      className={`strkyr-logo-wrap ${className}`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: withText ? "12px" : "0",
        userSelect: "none",
      }}
    >
      {/* Nordic Strength Sigil (SVG Vector) */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ flexShrink: 0, filter: "drop-shadow(0 4px 12px rgba(37, 99, 235, 0.25))" }}
      >
        <defs>
          {/* Deep Obsidian Background Gradient */}
          <linearGradient id="strkyrDarkBg" x1="10" y1="4" x2="90" y2="96" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#0f172a" />
            <stop offset="50%" stopColor="#1e293b" />
            <stop offset="100%" stopColor="#020617" />
          </linearGradient>

          {/* Electric Nordic Cobalt -> Arctic Cyan Gradient */}
          <linearGradient id="strkyrNordicBlue" x1="20" y1="20" x2="80" y2="80" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#60a5fa" />
            <stop offset="40%" stopColor="#2563eb" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>

          {/* Core Energy Highlight */}
          <linearGradient id="strkyrGlow" x1="50" y1="20" x2="50" y2="80" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#93c5fd" />
            <stop offset="100%" stopColor="#3b82f6" />
          </linearGradient>

          {/* Outer Rim Stroke Gradient */}
          <linearGradient id="strkyrRim" x1="10" y1="4" x2="90" y2="96" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#2563eb" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#1e293b" stopOpacity="0.9" />
          </linearGradient>
        </defs>

        {/* Outer Faceted Nordic Shield Base */}
        <polygon
          points="50,6 88,27 88,73 50,94 12,73 12,27"
          fill="url(#strkyrDarkBg)"
          stroke="url(#strkyrRim)"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />

        {/* Subtle Inner Geometric Guideline */}
        <polygon
          points="50,14 80,31 80,69 50,86 20,69 20,31"
          fill="none"
          stroke="#334155"
          strokeWidth="1"
          strokeDasharray="2 3"
          opacity="0.4"
        />

        {/* Nordic Styrkr Strength Glyph (Faceted Geometric 'S' Runemark) */}
        {/* Top Upper Chevron Blade */}
        <path
          d="M68 28 L35 28 L27 38 L55 38 L32 60 L42 60 L68 36 Z"
          fill="url(#strkyrNordicBlue)"
        />

        {/* Bottom Lower Chevron Blade */}
        <path
          d="M32 72 L65 72 L73 62 L45 62 L68 40 L58 40 L32 64 Z"
          fill="url(#strkyrNordicBlue)"
        />

        {/* Central Kinetic Lightning Core Vector (Sowilo / Victory & Power) */}
        <polygon
          points="52,22 46,45 56,45 44,78 60,49 49,49"
          fill="url(#strkyrGlow)"
          opacity="0.9"
        />

        {/* Subtle Nordic Cornerstone Rune Accents */}
        <circle cx="50" cy="11" r="1.5" fill="#38bdf8" />
        <circle cx="83" cy="29" r="1.5" fill="#38bdf8" />
        <circle cx="83" cy="71" r="1.5" fill="#38bdf8" />
        <circle cx="50" cy="89" r="1.5" fill="#38bdf8" />
        <circle cx="17" cy="71" r="1.5" fill="#38bdf8" />
        <circle cx="17" cy="29" r="1.5" fill="#38bdf8" />
      </svg>

      {/* Optional Wordmark */}
      {withText && (
        <div style={{ display: "flex", flexDirection: "column", textAlign: "left" }}>
          <div
            style={{
              fontSize: `${Math.round(size * 0.44)}px`,
              fontWeight: 900,
              color: textColor,
              letterSpacing: "-0.03em",
              lineHeight: 1,
              fontFamily: "system-ui, -apple-system, sans-serif",
            }}
          >
            STRKYR
          </div>
          <div
            style={{
              fontSize: `${Math.max(9, Math.round(size * 0.18))}px`,
              fontWeight: 700,
              color: "#2563eb",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              marginTop: "3px",
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
