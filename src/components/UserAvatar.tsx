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
  const [imageError, setImageError] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setImageError(false);
    setLoaded(false);
  }, [src]);

  const initial = name ? name.trim().charAt(0).toUpperCase() : "U";

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

  if (src && !imageError) {
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
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          ...style,
        }}
        className={className}
      >
        <img
          src={src}
          alt={name}
          referrerPolicy="no-referrer"
          onLoad={() => setLoaded(true)}
          onError={() => setImageError(true)}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
          }}
        />
      </div>
    );
  }

  return (
    <div
      style={{
        width: `${size}px`,
        height: `${size}px`,
        minWidth: `${size}px`,
        minHeight: `${size}px`,
        borderRadius: "50%",
        background: bgGradient,
        color: "#ffffff",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 800,
        fontSize: `${Math.round(size * 0.42)}px`,
        userSelect: "none",
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        ...style,
      }}
      className={className}
    >
      {initial}
    </div>
  );
}

export default UserAvatar;
