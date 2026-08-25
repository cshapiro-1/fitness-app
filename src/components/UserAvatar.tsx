"use client";

import React, { useState, useEffect } from "react";

export interface UserAvatarProps {
  src?: string | null;
  name?: string;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

export function UserAvatar({
  src,
  name = "User",
  size = 32,
  className = "",
  style = {},
}: UserAvatarProps) {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [src]);

  const initial = (name && name.trim().length > 0) ? name.trim().charAt(0).toUpperCase() : "U";

  // Deterministic stylish gradient from name
  const gradients = [
    "linear-gradient(135deg, #2563eb, #1d4ed8)",
    "linear-gradient(135deg, #0284c7, #0369a1)",
    "linear-gradient(135deg, #7c3aed, #6d28d9)",
    "linear-gradient(135deg, #059669, #047857)",
    "linear-gradient(135deg, #d97706, #b45309)",
  ];
  const charCode = name ? name.charCodeAt(0) : 0;
  const bgGradient = gradients[charCode % gradients.length];

  return (
    <div
      style={{
        width: `${size}px`,
        height: `${size}px`,
        minWidth: `${size}px`,
        minHeight: `${size}px`,
        borderRadius: "50%",
        overflow: "hidden",
        position: "relative",
        background: bgGradient,
        color: "#ffffff",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 800,
        fontSize: `${Math.round(size * 0.42)}px`,
        userSelect: "none",
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        flexShrink: 0,
        ...style,
      }}
      className={className}
    >
      {/* Background Initials (Always visible underneath / if image fails) */}
      <span style={{ position: "absolute", zIndex: 1, pointerEvents: "none" }}>
        {initial}
      </span>

      {/* Foreground Image */}
      {src && !hasError && (
        <img
          src={src}
          alt={name}
          referrerPolicy="no-referrer"
          onError={() => setHasError(true)}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            zIndex: 2,
          }}
        />
      )}
    </div>
  );
}

export default UserAvatar;
