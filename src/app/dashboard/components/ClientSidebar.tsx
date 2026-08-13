"use client";

import React from "react";
import { Users, Plus, Check, Copy, ChevronRight, Trash2 } from "lucide-react";
import { Client } from "../types";

interface ClientSidebarProps {
  clients: Client[];
  selected: Client | null;
  loadingClients: boolean;
  onSelectClient: (client: Client) => void;
  onAddClient: () => void;
  onDeleteClient: (id: string) => void;
  newName: string;
  setNewName: (val: string) => void;
  newNotes: string;
  setNewNotes: (val: string) => void;
  formError: string | null;
  createdInviteUrl: string | null;
  copiedLink: boolean;
  onCopyLink: (url: string) => void;
}

export function ClientSidebar({
  clients,
  selected,
  loadingClients,
  onSelectClient,
  onAddClient,
  onDeleteClient,
  newName,
  setNewName,
  newNotes,
  setNewNotes,
  formError,
  createdInviteUrl,
  copiedLink,
  onCopyLink,
}: ClientSidebarProps) {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <Users size={14} />
        <span>Clients</span>
        <span className="client-count">{clients.length}</span>
      </div>

      <div className="onboarding-card">
        <div className="onboarding-card-header">
          <div>
            <div className="onboarding-card-title">Quick add client</div>
            <div className="onboarding-card-subtitle">Add a client profile to assign workouts.</div>
          </div>
          <span className="chip">New</span>
        </div>

        <div className="onboarding-form">
          <label className="field">
            <span>Client Name *</span>
            <input
              className="input"
              placeholder="e.g. John Doe"
              value={newName}
              onChange={(event) => setNewName(event.target.value)}
              onKeyDown={(event) => event.key === "Enter" && onAddClient()}
            />
          </label>

          <label className="field field-full">
            <span>Notes (Optional)</span>
            <textarea
              className="input"
              placeholder="Goals, preferences, or context"
              rows={2}
              value={newNotes}
              onChange={(event) => setNewNotes(event.target.value)}
            />
          </label>

          {formError && <div className="onboarding-alert onboarding-alert-error">{formError}</div>}

          {createdInviteUrl && (
            <div className="onboarding-alert onboarding-alert-success" style={{ display: "block" }}>
              <div style={{ fontWeight: 600, marginBottom: "4px" }}>✓ Client Created & Invite Link Ready!</div>
              <div style={{ display: "flex", gap: "6px" }}>
                <input
                  readOnly
                  value={createdInviteUrl}
                  style={{ flex: 1, fontSize: "11px", padding: "4px 8px", borderRadius: "4px", border: "1px solid #ccc" }}
                />
                <button
                  onClick={() => onCopyLink(createdInviteUrl)}
                  style={{ padding: "4px 8px", fontSize: "11px", backgroundColor: "#16a34a", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer" }}
                >
                  {copiedLink ? <Check size={12} /> : <Copy size={12} />}
                </button>
              </div>
            </div>
          )}

          <button className="btn-primary onboarding-submit" onClick={onAddClient} title="Add client">
            <Plus size={16} />
            <span>Add client</span>
          </button>
        </div>
      </div>

      <div className="client-list">
        {loadingClients && <div className="empty-state">Loading...</div>}
        {!loadingClients && !clients.length && <div className="empty-state">No clients yet — add your first client above.</div>}
        {clients.map((client) => {
          const isSelfProfile = client.name === "My Workouts";
          const inviteStatusText =
            client.inviteStatus === "ACCEPTED"
              ? " — Joined"
              : client.inviteStatus === "PENDING" || client.inviteToken
              ? " — Invite Pending"
              : " — No Invite";

          return (
            <div key={client.id} className={`client-item${selected?.id === client.id ? " active" : ""}`} onClick={() => onSelectClient(client)}>
              <div className="client-item-main">
                <span className="client-name">{client.name}{isSelfProfile ? " — Self" : ""}</span>
                <span className="client-meta">
                  {client._count?.workoutSessions ?? 0} workouts
                  {!isSelfProfile && inviteStatusText}
                </span>
              </div>
              <div className="client-item-actions">
                <ChevronRight size={14} className="client-arrow" />
                {!isSelfProfile && (
                  <button className="btn-ghost-danger" onClick={(event) => { event.stopPropagation(); onDeleteClient(client.id); }} title="Delete">
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
}
