"use client";

import React, { useState } from "react";
import { AlertTriangle, Trash2, ShieldCheck, X, RefreshCw } from "lucide-react";

interface RemoveAssignedWorkoutsModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientId: string;
  clientName: string;
  programId?: string;
  programName?: string;
  assignedCount: number;
  onSuccess: () => void;
}

export function RemoveAssignedWorkoutsModal({
  isOpen,
  onClose,
  clientId,
  clientName,
  programId,
  programName,
  assignedCount,
  onSuccess,
}: RemoveAssignedWorkoutsModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    setErrorMessage(null);
    try {
      const url = programId
        ? `/api/workouts?clientId=${encodeURIComponent(clientId)}&programId=${encodeURIComponent(programId)}`
        : `/api/workouts?clientId=${encodeURIComponent(clientId)}`;

      const res = await fetch(url, {
        method: "DELETE",
      });

      if (res.ok) {
        onSuccess();
        onClose();
      } else {
        const data = await res.json().catch(() => null);
        setErrorMessage(data?.error || "Failed to remove assigned workouts.");
      }
    } catch {
      setErrorMessage("Network error while removing assigned workouts.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(15, 23, 42, 0.75)",
        backdropFilter: "blur(4px)",
        zIndex: 10000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#ffffff",
          borderRadius: "16px",
          width: "100%",
          maxWidth: "460px",
          padding: "24px",
          boxShadow: "0 20px 45px -10px rgba(0, 0, 0, 0.3)",
          border: "1px solid #fecaca",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Warning Icon */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "12px",
                background: "#fef2f2",
                border: "1px solid #fee2e2",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#dc2626",
                flexShrink: 0,
              }}
            >
              <Trash2 size={22} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: "17px", fontWeight: 800, color: "#0f172a" }}>
                Remove Assigned Workouts?
              </h3>
              <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#64748b" }}>
                {clientName ? `For athlete: ${clientName}` : "For selected athlete"}
                {programName ? ` • ${programName}` : ""}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              color: "#94a3b8",
              cursor: "pointer",
              padding: "4px",
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Warning Details Body */}
        <div style={{ marginBottom: "20px" }}>
          <p style={{ fontSize: "13px", color: "#334155", lineHeight: "1.5", margin: "0 0 12px" }}>
            Are you sure you want to remove{" "}
            <strong style={{ color: "#dc2626" }}>
              {assignedCount > 0 ? `all ${assignedCount} assigned workouts` : "all upcoming assigned workouts"}
            </strong>{" "}
            from {clientName || "this client"}&apos;s schedule?
          </p>

          {/* Safety Shield Box */}
          <div
            style={{
              background: "#f0fdf4",
              border: "1px solid #bbf7d0",
              borderRadius: "10px",
              padding: "12px 14px",
              display: "flex",
              alignItems: "flex-start",
              gap: "10px",
              marginBottom: "12px",
            }}
          >
            <ShieldCheck size={18} color="#16a34a" style={{ flexShrink: 0, marginTop: "2px" }} />
            <div style={{ fontSize: "12px", color: "#166534", lineHeight: "1.45" }}>
              <strong>Your history is safe:</strong> Completed workout logs, personal records (PRs), and past performance will <strong>never</strong> be deleted.
            </div>
          </div>

          {programName && (
            <div
              style={{
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                borderRadius: "8px",
                padding: "10px 12px",
                fontSize: "12px",
                color: "#475569",
              }}
            >
              ℹ️ The program <strong>&quot;{programName}&quot;</strong> will be unassigned and returned to your Draft templates.
            </div>
          )}

          {errorMessage && (
            <div
              style={{
                background: "#fef2f2",
                border: "1px solid #fecaca",
                color: "#b91c1c",
                padding: "10px 12px",
                borderRadius: "8px",
                fontSize: "12px",
                marginTop: "12px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <AlertTriangle size={15} />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>

        {/* Modal Action Buttons */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            style={{
              background: "#f1f5f9",
              border: "1px solid #e2e8f0",
              padding: "9px 16px",
              borderRadius: "8px",
              fontSize: "13px",
              fontWeight: 600,
              color: "#475569",
              cursor: "pointer",
            }}
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleConfirmDelete}
            disabled={isDeleting}
            style={{
              background: "#dc2626",
              border: "1px solid #b91c1c",
              padding: "9px 18px",
              borderRadius: "8px",
              fontSize: "13px",
              fontWeight: 700,
              color: "#ffffff",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              boxShadow: "0 2px 4px rgba(220, 38, 38, 0.25)",
            }}
          >
            {isDeleting ? <RefreshCw className="spin-inline" size={15} /> : <Trash2 size={15} />}
            <span>{isDeleting ? "Removing..." : "Yes, Remove All Assigned"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
