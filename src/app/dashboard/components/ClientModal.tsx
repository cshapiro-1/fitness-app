"use client";

import React, { useState, useEffect } from "react";
import { X, User, Mail, Phone, Target, FileText, Link2, Copy, Check, RefreshCw, Trash2 } from "lucide-react";
import { Client } from "../types";

export interface ClientModalProps {
  isOpen: boolean;
  mode: "add" | "edit";
  client?: Client | null;
  onClose: () => void;
  onSave: (clientData: {
    name: string;
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
      <div className="client-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="client-modal-header">
          <div className="client-modal-header-info">
            <h2 className="client-modal-title">
              {mode === "add" ? "Add New Client" : `Edit Client: ${client?.name || ""}`}
            </h2>
            <p className="client-modal-subtitle">
              {mode === "add"
                ? "Enter client details. An invite link can be generated at any time."
                : "Update profile information, fitness goals, and invite status."}
            </p>
          </div>
          <button className="client-modal-close" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="client-modal-form">
          {error && <div className="client-modal-alert-error">{error}</div>}

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
                    <span>Client Portal Invite</span>
                  </div>
                  <div className="client-modal-invite-desc">
                    {client.inviteStatus === "ACCEPTED"
                      ? "Client has accepted their invite and activated their account."
                      : inviteUrl
                      ? "Share this invite link with your client so they can access their workout portal."
                      : "Generate an invite link to give your client portal access."}
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
