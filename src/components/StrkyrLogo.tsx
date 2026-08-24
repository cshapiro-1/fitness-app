"use client";

import React from "react";

export type LogoVariant = "srune-barbell" | "valknut-barbell" | "mjolnir-plate";

interface StrkyrLogoProps {
  size?: number;
  className?: string;
  withText?: boolean;
  textColor?: string;
  subtitle?: string;
  accentColor?: string;
  variant?: LogoVariant;
}

/**
 * STRKYR Brandmark
 * Sleek Nordic Minimalism fused with clear Strength & Barbell Fitness symbolism.
 */
export function StrkyrLogo({
  size = 56,
  className = "",
  withText = false,
  textColor = "#0f172a",
  subtitle = "STRENGTH & PERFORMANCE",
  accentColor = "#2563eb",
  variant = "srune-barbell",
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
      {/* 1. S-Rune Barbell Monogram (Olympic Barbell fused into an angular Nordic 'S') */}
      {variant === "srune-barbell" && (
        <svg
          width={size}
          height={size}
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ flexShrink: 0 }}
        >
          {/* Top Barbell Plate & Sleeve (Left) */}
          <rect x="14" y="20" width="8" height="28" rx="2" fill="#0f172a" />
          <rect x="24" y="24" width="5" height="20" rx="1.5" fill="#64748b" />
          {/* Top Barbell Bar */}
          <rect x="29" y="31" width="48" height="6" rx="2" fill="#0f172a" />
          {/* Top Right Plate */}
          <rect x="77" y="20" width="8" height="28" rx="2" fill="#0f172a" />
          <rect x="71" y="24" width="5" height="20" rx="1.5" fill="#64748b" />

          {/* Central Nordic Angular S-Spine connecting the two barbells */}
          <path
            d="M72 31 L34 69"
            stroke={accentColor}
            strokeWidth="7"
            strokeLinecap="round"
          />

          {/* Bottom Barbell Bar */}
          <rect x="23" y="63" width="48" height="6" rx="2" fill="#0f172a" />
          {/* Bottom Left Plate */}
          <rect x="15" y="52" width="8" height="28" rx="2" fill="#0f172a" />
          <rect x="25" y="56" width="5" height="20" rx="1.5" fill="#64748b" />
          {/* Bottom Right Plate */}
          <rect x="78" y="52" width="8" height="28" rx="2" fill="#0f172a" />
          <rect x="71" y="56" width="5" height="20" rx="1.5" fill="#64748b" />

          {/* Center Knurling Grip Accents */}
          <circle cx="50" cy="50" r="3" fill={accentColor} />
        </svg>
      )}

      {/* 2. Barbell Valknut (Three Interlocking Olympic Plates in Valknut Formation) */}
      {variant === "valknut-barbell" && (
        <svg
          width={size}
          height={size}
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ flexShrink: 0 }}
        >
          {/* Top Olympic Weight Plate */}
          <circle cx="50" cy="30" r="18" stroke="#0f172a" strokeWidth="5" fill="none" />
          <circle cx="50" cy="30" r="6" fill={accentColor} />
          {/* Top Plate Collar Notches */}
          <line x1="50" y1="12" x2="50" y2="18" stroke="#0f172a" strokeWidth="3" />
          <line x1="50" y1="42" x2="50" y2="48" stroke="#0f172a" strokeWidth="3" />

          {/* Bottom Left Olympic Weight Plate */}
          <circle cx="34" cy="65" r="18" stroke="#0f172a" strokeWidth="5" fill="none" />
          <circle cx="34" cy="65" r="6" fill="#0f172a" />

          {/* Bottom Right Olympic Weight Plate */}
          <circle cx="66" cy="65" r="18" stroke={accentColor} strokeWidth="5" fill="none" />
          <circle cx="66" cy="65" r="6" fill={accentColor} />

          {/* Interlocking Tri-Bar Vectors */}
          <path d="M50 30 L34 65" stroke="#64748b" strokeWidth="2.5" strokeDasharray="3 3" />
          <path d="M34 65 L66 65" stroke="#64748b" strokeWidth="2.5" strokeDasharray="3 3" />
          <path d="M66 65 L50 30" stroke="#64748b" strokeWidth="2.5" strokeDasharray="3 3" />
        </svg>
      )}

      {/* 3. Mjölnir Plate (Thor's Hammer Silhouette with Barbell Shaft & Weight Hub) */}
      {variant === "mjolnir-plate" && (
        <svg
          width={size}
          height={size}
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ flexShrink: 0 }}
        >
          {/* Hammer Head (Anvil / Bumper Block) */}
          <path
            d="M24 20 L76 20 L80 34 L72 38 L28 38 L20 34 Z"
            fill="#0f172a"
          />
          {/* Inner Power Channel */}
          <path
            d="M32 26 L68 26"
            stroke={accentColor}
            strokeWidth="3"
            strokeLinecap="round"
          />
          {/* Barbell Knurled Shaft */}
          <rect x="46" y="38" width="8" height="34" fill="#0f172a" />
          <line x1="46" y1="46" x2="54" y2="46" stroke="#64748b" strokeWidth="1.5" />
          <line x1="46" y1="54" x2="54" y2="54" stroke="#64748b" strokeWidth="1.5" />
          <line x1="46" y1="62" x2="54" y2="62" stroke="#64748b" strokeWidth="1.5" />
          {/* Bottom Barbell Collar Plate Base */}
          <path
            d="M34 72 L66 72 L72 82 L28 82 Z"
            fill="#0f172a"
          />
          <circle cx="50" cy="77" r="2.5" fill={accentColor} />
        </svg>
      )}

      {/* Modern Wordmark */}
      {withText && (
        <div style={{ display: "flex", flexDirection: "column", textAlign: "left" }}>
          <div
            style={{
              fontSize: `${Math.round(size * 0.42)}px`,
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
