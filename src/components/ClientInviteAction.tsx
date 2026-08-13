"use client";

import React, { useState } from "react";
import { Copy, Check } from "lucide-react";

interface ClientInviteActionProps {
  inviteUrl: string;
}

export function ClientInviteAction({ inviteUrl }: ClientInviteActionProps) {
  const [copied, setCopied] = useState(false);

  const copyLink = () => {
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={copyLink}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "6px",
        fontSize: "12px",
        fontWeight: 600,
        background: "#2563eb",
        color: "#ffffff",
        padding: "6px 12px",
        borderRadius: "6px",
        border: "none",
        cursor: "pointer",
      }}
    >
      {copied ? <Check size={14} /> : <Copy size={14} />}
      <span>{copied ? "Copied!" : "Copy Invite Link"}</span>
    </button>
  );
}

export default ClientInviteAction;