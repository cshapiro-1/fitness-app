"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  User,
  Mail,
  Phone,
  Target,
  FileText,
  Link2,
  Copy,
  Check,
  RefreshCw,
  Trash2,
  Camera,
  Image as ImageIcon,
} from "lucide-react";
import { Client } from "../types";

const CLIENT_PRESET_AVATARS = [
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80",
];

export interface ClientModalProps {
  isOpen: boolean;
  mode: "add" | "edit";
  client?: Client | null;
  onClose: () => void;
  onSave: (clientData: {
    name: string;
    image?: string | null;
    email: string | null;
    phone: string | null;
    fitnessGoals: string | null;
    notes: string | null;
  }) => Promise<void> | void;
  onDelete?: (id: string) => Promise<void> | void;
  onInviteGenerated?: (client: Client) => void;
}

export function ClientModal({
  isOpen,
  mode,
  client,
  onClose,
  onSave,
  onDelete,
  onInviteGenerated,
}: ClientModalProps) {
  const [name, setName] = useState("");
  const [image, setImage] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [fitnessGoals, setFitnessGoals] = useState("");
  const [notes, setNotes] = useState("");
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [generatingInvite, setGeneratingInvite] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setCopied(false);
      if (mode === "edit" && client) {
        setName(client.name || "");
        setImage(client.image || "");
        setEmail(client.email || "");
        setPhone(client.phone || "");
        setFitnessGoals(client.fitnessGoals || "");
        setNotes(client.notes || "");
        const existingUrl =
          client.inviteUrl ||
          (client.inviteToken
            ? `${typeof window !== "undefined" ? window.location.origin : ""}/invite/${client.inviteToken}`
            : null);
        setInviteUrl(existingUrl);
      } else {
        setName("");
        setImage("");
        setEmail("");
        setPhone("");
        setFitnessGoals("");
        setNotes("");
        setInviteUrl(null);
      }
    }
  }, [isOpen, mode, client]);

  if (!isOpen) return null;

  const handleGenerateInvite = async () => {
    if (mode === "edit" && client?.id) {
      setGeneratingInvite(true);
      setError(null);
      try {
        const res = await fetch("/api/invite", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ clientId: client.id }),
        });
        const data = await res.json();
        if (res.ok && data.inviteUrl) {
          setInviteUrl(data.inviteUrl);
          if (onInviteGenerated) {
            onInviteGenerated({
              ...client,
              inviteToken: data.inviteToken || data.token,
              inviteUrl: data.inviteUrl,
              inviteStatus: "PENDING",
            });
          }
        } else {
          setError(data.error || "Failed to generate invite link.");
        }
      } catch (err) {
        setError("Network error while generating invite link.");
      } finally {
        setGeneratingInvite(false);
      }
    }
  };

  const handleCopyLink = () => {
    if (inviteUrl) {
      navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("Image size should be less than 2MB");
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result) {
          setImage(reader.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Client name is required.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await onSave({
        name: name.trim(),
        image: image.trim() || null,
        email: email.trim() || null,
        phone: phone.trim() || null,
        fitnessGoals: fitnessGoals.trim() || null,
        notes: notes.trim() || null,
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || "An error occurred while saving.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="client-modal-backdrop" onClick={onClose}>
      <div className="client-modal-card" style={{ maxWidth: "540px", maxHeight: "90vh", overflowY: "auto" }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="client-modal-header">
          <div className="client-modal-header-info">
            <h2 className="client-modal-title">
              {mode === "add" ? "Add New Client" : `Edit Client: ${client?.name || ""}`}
            </h2>
            <p className="client-modal-subtitle">
              {mode === "add"
                ? "Enter client profile details and photo. All clients have 100% free access."
                : "Update client profile details, photo, fitness goals, and invite status."}
            </p>
          </div>
          <button className="client-modal-close" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="client-modal-form">
          {error && <div className="client-modal-alert-error">{error}</div>}

          {/* Profile Picture Section */}
          <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "16px", padding: "14px", background: "#f8fafc", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
            <div style={{ position: "relative", flexShrink: 0 }}>
              {image ? (
                <img
                  src={image}
                  alt={name || "Client Avatar"}
                  style={{ width: "56px", height: "56px", borderRadius: "50%", objectFit: "cover", border: "2px solid #2563eb" }}
                />
              ) : (
                <div
                  style={{
                    width: "56px",
                    height: "56px",
                    borderRadius: "50%",
                    background: "#e2e8f0",
                    color: "#64748b",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "20px",
                    fontWeight: 700,
                  }}
                >
                  {name ? name.charAt(0).toUpperCase() : <User size={26} />}
                </div>
              )}
              <label
                htmlFor="client-avatar-upload"
                style={{
                  position: "absolute",
                  bottom: "-2px",
                  right: "-2px",
                  background: "#2563eb",
                  color: "#ffffff",
                  width: "22px",
                  height: "22px",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.15)",
                }}
                title="Upload client photo"
              >
                <Camera size={12} />
                <input
                  id="client-avatar-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleImageFileChange}
                  style={{ display: "none" }}
                />
              </label>
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "12px", fontWeight: 600, color: "#0f172a", marginBottom: "3px" }}>
                Client Photo / Avatar
              </div>
              <div style={{ fontSize: "11px", color: "#64748b", marginBottom: "6px" }}>
                Upload an image or pick a preset:
              </div>
              <div style={{ display: "flex", gap: "5px", alignItems: "center", flexWrap: "wrap" }}>
                {CLIENT_PRESET_AVATARS.map((avatarUrl, idx) => (
                  <img
                    key={idx}
                    src={avatarUrl}
                    alt={`Avatar ${idx + 1}`}
                    onClick={() => setImage(avatarUrl)}
                    style={{
                      width: "24px",
                      height: "24px",
                      borderRadius: "50%",
                      cursor: "pointer",
                      border: image === avatarUrl ? "2px solid #2563eb" : "1px solid #cbd5e1",
                      opacity: image === avatarUrl ? 1 : 0.75,
                    }}
                  />
                ))}
                {image && (
                  <button
                    type="button"
                    onClick={() => setImage("")}
                    style={{ background: "none", border: "none", fontSize: "10px", color: "#ef4444", cursor: "pointer", marginLeft: "4px" }}
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="client-modal-fields-grid">
            {/* Name */}
            <div className="client-modal-field">
              <label className="client-modal-label">
                <User size={13} />
                <span>Full Name *</span>
              </label>
              <input
                type="text"
                className="client-modal-input"
                placeholder="e.g. Sarah Connor"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoFocus
              />
            </div>

            {/* Email */}
            <div className="client-modal-field">
              <label className="client-modal-label">
                <Mail size={13} />
                <span>Email Address (Optional)</span>
              </label>
              <input
                type="email"
                className="client-modal-input"
                placeholder="e.g. sarah@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            {/* Phone */}
            <div className="client-modal-field">
              <label className="client-modal-label">
                <Phone size={13} />
                <span>Phone Number (Optional)</span>
              </label>
              <input
                type="tel"
                className="client-modal-input"
                placeholder="e.g. (555) 234-5678"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            {/* Photo URL */}
            <div className="client-modal-field">
              <label className="client-modal-label">
                <ImageIcon size={13} />
                <span>Custom Image URL (Optional)</span>
              </label>
              <input
                type="url"
                className="client-modal-input"
                placeholder="https://..."
                value={image}
                onChange={(e) => setImage(e.target.value)}
              />
            </div>

            {/* Fitness Goals */}
            <div className="client-modal-field client-modal-field-full">
              <label className="client-modal-label">
                <Target size={13} />
                <span>Fitness Goals</span>
              </label>
              <textarea
                className="client-modal-textarea"
                rows={2}
                placeholder="e.g. Increase bench press to 200lbs, lower body fat by 3%, run 5k in under 25min"
                value={fitnessGoals}
                onChange={(e) => setFitnessGoals(e.target.value)}
              />
            </div>

            {/* Notes */}
            <div className="client-modal-field client-modal-field-full">
              <label className="client-modal-label">
                <FileText size={13} />
                <span>Coach Notes & Context</span>
              </label>
              <textarea
                className="client-modal-textarea"
                rows={2}
                placeholder="e.g. Left shoulder impingement history, prefers morning sessions"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>

          {/* Invite Link Section (in edit mode or with generated URL) */}
          {mode === "edit" && client && (
            <div className="client-modal-invite-section">
              <div className="client-modal-invite-header">
                <div className="client-modal-invite-title-group">
                  <div className="client-modal-invite-title">
                    <Link2 size={15} />
                    <span>Client Portal Invite (Free Access)</span>
                  </div>
                  <div className="client-modal-invite-desc">
                    {client.inviteStatus === "ACCEPTED"
                      ? "Client has accepted their invite and activated their account."
                      : inviteUrl
                      ? "Share this invite link with your client so they can access their workout portal for free."
                      : "Generate an invite link to give your client free portal access."}
                  </div>
                </div>

                {client.inviteStatus !== "ACCEPTED" && (
                  <button
                    type="button"
                    onClick={handleGenerateInvite}
                    disabled={generatingInvite}
                    className="btn-secondary client-modal-invite-btn"
                  >
                    <RefreshCw size={13} className={generatingInvite ? "spin" : ""} />
                    <span>{generatingInvite ? "Generating..." : inviteUrl ? "New Invite Link" : "Generate Invite Link"}</span>
                  </button>
                )}
              </div>

              {inviteUrl && (
                <div className="client-modal-invite-box">
                  <input
                    type="text"
                    readOnly
                    value={inviteUrl}
                    className="client-modal-invite-input"
                    onClick={(e) => (e.target as HTMLInputElement).select()}
                  />
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="btn-primary client-modal-copy-btn"
                    title="Copy link to clipboard"
                  >
                    {copied ? (
                      <>
                        <Check size={14} />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy size={14} />
                        <span>Copy Link</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Modal Footer */}
          <div className="client-modal-footer">
            {mode === "edit" && client && onDelete && client.name !== "My Workouts" ? (
              <button
                type="button"
                onClick={() => onDelete(client.id)}
                className="btn-ghost-danger"
                style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
              >
                <Trash2 size={14} />
                <span>Delete Client</span>
              </button>
            ) : (
              <div />
            )}

            <div className="client-modal-action-group">
              <button type="button" onClick={onClose} className="btn-secondary">
                Cancel
              </button>
              <button type="submit" disabled={saving} className="btn-primary">
                {saving ? "Saving..." : mode === "add" ? "Add Client" : "Save Changes"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ClientModal;
