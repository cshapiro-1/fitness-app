"use client";

import React from "react";

export type LogoVariant =
  | "mjolnir-tbar"        // 1. Horizontal Olympic Barbell as Hammerhead with Knurled Handle
  | "mjolnir-anvil-hub"   // 2. Heavy Chiseled Anvil Hammer with Olympic Center Hub
  | "mjolnir-cross"       // 3. Kinetic Power Cross with Diagonal Barbell Shafts
  | "mjolnir-monoline"    // 4. Ultra-Minimalist Copenhagen Monoline Hammer & Plate
  | "mjolnir-wedge"       // 5. Nordic Geometric Styrkr Wedge with Lightning Core
  | "srune-barbell"
  | "valknut-barbell";

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
 * STRKYR (Styrkr - Old Norse for Strength & Fortitude)
 * Minimalist Mjölnir (Thor's Hammer) & Olympic Barbell Fusion Brandmarks.
 */
export function StrkyrLogo({
  size = 56,
  className = "",
  withText = false,
  textColor = "#0f172a",
  subtitle = "STRENGTH & PERFORMANCE",
  accentColor = "#2563eb",
  variant = "mjolnir-tbar",
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
      {/* ============================================================== */}
      {/* 1. THE OLYMPIC T-BAR HAMMER                                     */}
      {/* (Loaded Olympic Barbell Head with Knurled Shaft & Norse Ring)  */}
      {/* ============================================================== */}
      {variant === "mjolnir-tbar" && (
        <svg
          width={size}
          height={size}
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ flexShrink: 0 }}
        >
          {/* Horizontal Hammer Head: Olympic Barbell Bar */}
          <rect x="18" y="24" width="64" height="6" rx="2" fill="#0f172a" />

          {/* Left Loaded Bumper Plates */}
          <rect x="14" y="14" width="7" height="26" rx="2" fill="#0f172a" />
          <rect x="22" y="17" width="5" height="20" rx="1.5" fill={accentColor} />

          {/* Right Loaded Bumper Plates */}
          <rect x="79" y="14" width="7" height="26" rx="2" fill="#0f172a" />
          <rect x="73" y="17" width="5" height="20" rx="1.5" fill={accentColor} />

          {/* Center Anvil Crown Block */}
          <path d="M42 20 L58 20 L55 24 L45 24 Z" fill="#0f172a" />

          {/* Vertical Barbell Shaft / Handle */}
          <rect x="46" y="30" width="8" height="42" fill="#0f172a" />

          {/* Precision Knurling Grips on Shaft */}
          <line x1="46" y1="40" x2="54" y2="40" stroke="#ffffff" strokeWidth="1.5" strokeDasharray="1.5 1.5" />
          <line x1="46" y1="48" x2="54" y2="48" stroke="#ffffff" strokeWidth="1.5" strokeDasharray="1.5 1.5" />
          <line x1="46" y1="56" x2="54" y2="56" stroke="#ffffff" strokeWidth="1.5" strokeDasharray="1.5 1.5" />
          <line x1="46" y1="64" x2="54" y2="64" stroke="#ffffff" strokeWidth="1.5" strokeDasharray="1.5 1.5" />

          {/* Norse Pommel Base Ring */}
          <circle cx="50" cy="78" r="7" stroke="#0f172a" strokeWidth="3.5" fill="none" />
          <circle cx="50" cy="78" r="2.5" fill={accentColor} />
        </svg>
      )}

      {/* ============================================================== */}
      {/* 2. THE ANVIL PLATE                                             */}
      {/* (Solid Chamfered Mjölnir Head with Olympic Center Hub)         */}
      {/* ============================================================== */}
      {variant === "mjolnir-anvil-hub" && (
        <svg
          width={size}
          height={size}
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ flexShrink: 0 }}
        >
          {/* Heavy Chamfered Anvil Hammerhead */}
          <path
            d="M20 18 L80 18 L88 36 L76 40 L24 40 L12 36 Z"
            fill="#0f172a"
          />

          {/* Center Olympic Plate Hub Hole & Steel Ring */}
          <circle cx="50" cy="29" r="7" fill="#ffffff" />
          <circle cx="50" cy="29" r="4.5" fill={accentColor} />
          <circle cx="50" cy="29" r="2" fill="#ffffff" />

          {/* Vertical Barbell Shaft with Olympic Collar Stops */}
          <rect x="44" y="40" width="12" height="4" fill="#64748b" />
          <rect x="46" y="44" width="8" height="34" fill="#0f172a" />

          {/* Grip Knurling */}
          <line x1="46" y1="52" x2="54" y2="52" stroke="#64748b" strokeWidth="1.5" />
          <line x1="46" y1="60" x2="54" y2="60" stroke="#64748b" strokeWidth="1.5" />
          <line x1="46" y1="68" x2="54" y2="68" stroke="#64748b" strokeWidth="1.5" />

          {/* Triangular Nordic Base Anchor */}
          <polygon points="50,90 40,78 60,78" fill="#0f172a" />
          <line x1="44" y1="82" x2="56" y2="82" stroke={accentColor} strokeWidth="2" />
        </svg>
      )}

      {/* ============================================================== */}
      {/* 3. THE CROSS-COLLAR MJÖLNIR                                     */}
      {/* (Athletic 45° Diagonal Barbell Shafts & Power Hammer)          */}
      {/* ============================================================== */}
      {variant === "mjolnir-cross" && (
        <svg
          width={size}
          height={size}
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ flexShrink: 0 }}
        >
          {/* Diagonal Barbell Shaft 1 (Top Left to Bottom Right) */}
          <line x1="22" y1="26" x2="78" y2="82" stroke="#cbd5e1" strokeWidth="4" strokeLinecap="round" />
          <rect x="18" y="20" width="6" height="12" rx="1.5" fill="#64748b" transform="rotate(-45 18 20)" />
          <rect x="74" y="76" width="6" height="12" rx="1.5" fill="#64748b" transform="rotate(-45 74 76)" />

          {/* Diagonal Barbell Shaft 2 (Top Right to Bottom Left) */}
          <line x1="78" y1="26" x2="22" y2="82" stroke="#cbd5e1" strokeWidth="4" strokeLinecap="round" />
          <rect x="78" y="20" width="6" height="12" rx="1.5" fill="#64748b" transform="rotate(45 78 20)" />
          <rect x="22" y="76" width="6" height="12" rx="1.5" fill="#64748b" transform="rotate(45 22 76)" />

          {/* Central Vertical Mjölnir Hammerhead */}
          <path
            d="M28 20 L72 20 L76 34 L66 38 L34 38 L24 34 Z"
            fill="#0f172a"
          />
          {/* Central Power Core */}
          <line x1="38" y1="28" x2="62" y2="28" stroke={accentColor} strokeWidth="3" strokeLinecap="round" />

          {/* Vertical Knurled Shaft */}
          <rect x="46" y="38" width="8" height="42" fill="#0f172a" />
          <circle cx="50" cy="85" r="4.5" fill={accentColor} />
        </svg>
      )}

      {/* ============================================================== */}
      {/* 4. THE COPENHAGEN MONOLINE HAMMER                              */}
      {/* (Single Unbroken Minimalist Line forming Hammer & Plate Hub)   */}
      {/* ============================================================== */}
      {variant === "mjolnir-monoline" && (
        <svg
          width={size}
          height={size}
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ flexShrink: 0 }}
        >
          {/* Continuous Monoline Hammer Outline with 45° Chamfers */}
          <path
            d="M26 22 L74 22 L82 34 L66 40 L54 40 L54 72 A 8 8 0 0 1 46 72 L46 40 L34 40 L18 34 Z"
            stroke="#0f172a"
            strokeWidth="4"
            strokeLinejoin="round"
            strokeLinecap="round"
            fill="none"
          />

          {/* Center Olympic Barbell Plate Ring inside Hammer Head */}
          <circle cx="50" cy="30" r="4.5" stroke={accentColor} strokeWidth="3" fill="none" />

          {/* Knurled Shaft Notches */}
          <line x1="46" y1="50" x2="54" y2="50" stroke="#0f172a" strokeWidth="2.5" />
          <line x1="46" y1="60" x2="54" y2="60" stroke="#0f172a" strokeWidth="2.5" />

          {/* Bottom Pommel Ring */}
          <circle cx="50" cy="82" r="5" fill={accentColor} />
        </svg>
      )}

      {/* ============================================================== */}
      {/* 5. THE STYRKR POWER WEDGE                                       */}
      {/* (Geometric Brutalist Anvil Block with Electric Force Vector)   */}
      {/* ============================================================== */}
      {variant === "mjolnir-wedge" && (
        <svg
          width={size}
          height={size}
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ flexShrink: 0 }}
        >
          {/* Top Left Wedge Blade */}
          <path d="M22 18 L47 18 L47 38 L28 38 L16 30 Z" fill="#0f172a" />

          {/* Top Right Wedge Blade */}
          <path d="M53 18 L78 18 L84 30 L72 38 L53 38 Z" fill="#0f172a" />

          {/* Central Lightning Power Channel (Sowilo Energy) */}
          <polygon points="49,14 47,40 53,40 51,14" fill={accentColor} />

          {/* Vertical Barbell Steel Collar Stop */}
          <rect x="42" y="38" width="16" height="4" rx="1" fill="#64748b" />

          {/* Vertical Shaft */}
          <rect x="46" y="42" width="8" height="36" fill="#0f172a" />

          {/* Olympic Knurling Bands */}
          <line x1="46" y1="50" x2="54" y2="50" stroke={accentColor} strokeWidth="2" />
          <line x1="46" y1="58" x2="54" y2="58" stroke={accentColor} strokeWidth="2" />
          <line x1="46" y1="66" x2="54" y2="66" stroke={accentColor} strokeWidth="2" />

          {/* Heavy Steel Base Weight Block */}
          <rect x="36" y="78" width="28" height="8" rx="2" fill="#0f172a" />
          <rect x="42" y="80" width="16" height="4" rx="1" fill={accentColor} />
        </svg>
      )}

      {/* Legacy/Classic Variants */}
      {variant === "srune-barbell" && (
        <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
          <rect x="14" y="20" width="8" height="28" rx="2" fill="#0f172a" />
          <rect x="24" y="24" width="5" height="20" rx="1.5" fill="#64748b" />
          <rect x="29" y="31" width="48" height="6" rx="2" fill="#0f172a" />
          <rect x="77" y="20" width="8" height="28" rx="2" fill="#0f172a" />
          <rect x="71" y="24" width="5" height="20" rx="1.5" fill="#64748b" />
          <path d="M72 31 L34 69" stroke={accentColor} strokeWidth="7" strokeLinecap="round" />
          <rect x="23" y="63" width="48" height="6" rx="2" fill="#0f172a" />
          <rect x="15" y="52" width="8" height="28" rx="2" fill="#0f172a" />
          <rect x="25" y="56" width="5" height="20" rx="1.5" fill="#64748b" />
          <rect x="78" y="52" width="8" height="28" rx="2" fill="#0f172a" />
          <rect x="71" y="56" width="5" height="20" rx="1.5" fill="#64748b" />
          <circle cx="50" cy="50" r="3" fill={accentColor} />
        </svg>
      )}

      {variant === "valknut-barbell" && (
        <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
          <circle cx="50" cy="30" r="18" stroke="#0f172a" strokeWidth="5" fill="none" />
          <circle cx="50" cy="30" r="6" fill={accentColor} />
          <line x1="50" y1="12" x2="50" y2="18" stroke="#0f172a" strokeWidth="3" />
          <line x1="50" y1="42" x2="50" y2="48" stroke="#0f172a" strokeWidth="3" />
          <circle cx="34" cy="65" r="18" stroke="#0f172a" strokeWidth="5" fill="none" />
          <circle cx="34" cy="65" r="6" fill="#0f172a" />
          <circle cx="66" cy="65" r="18" stroke={accentColor} strokeWidth="5" fill="none" />
          <circle cx="66" cy="65" r="6" fill={accentColor} />
          <path d="M50 30 L34 65" stroke="#64748b" strokeWidth="2.5" strokeDasharray="3 3" />
          <path d="M34 65 L66 65" stroke="#64748b" strokeWidth="2.5" strokeDasharray="3 3" />
          <path d="M66 65 L50 30" stroke="#64748b" strokeWidth="2.5" strokeDasharray="3 3" />
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
