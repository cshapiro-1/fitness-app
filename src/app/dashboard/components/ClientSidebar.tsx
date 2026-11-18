"use client";

import React from "react";
import { Users, UserPlus, Trash2, Edit3, Link2, Zap, Dumbbell } from "lucide-react";
import { UserAvatar } from "@/components/UserAvatar";
import { Client } from "../types";

interface ClientSidebarProps {
  clients: Client[];
  selected: Client | null;
  loadingClients: boolean;
  onSelectClient: (client: Client) => void;
  onOpenAddClient: () => void;
  onOpenEditClient: (client: Client) => void;
  onOpenTrainerProfile?: () => void;
  onDeleteClient: (id: string) => void;
  onQuickInvite?: (client: Client) => void;
}

export function ClientSidebar({
  clients,
  selected,
  loadingClients,
  onSelectClient,
  onOpenAddClient,
  onOpenEditClient,
  onOpenTrainerProfile,
  onDeleteClient,
  onQuickInvite,
}: ClientSidebarProps) {
  const selfProfile = clients.find(
    (c) => (c as any).isSelf || c.name.includes("(You)") || c.name === "My Workouts"
  );
  const athletes = clients.filter((c) => c.id !== selfProfile?.id);

  return (
    <aside className="sidebar hide-mobile-sidebar" data-tour="client-sidebar">
      {/* Sidebar Header */}
      <div className="sidebar-header">
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <Users size={15} />
          <span>Clients &amp; Training</span>
        </div>
        <span className="client-count">{athletes.length} athlete{athletes.length === 1 ? "" : "s"}</span>
      </div>

      {/* Add Client Action Button */}
      <div style={{ padding: "0 12px 10px" }}>
        <button
          onClick={onOpenAddClient}
          className="btn-primary sidebar-add-btn"
          title="Add a new client profile"
        >
          <UserPlus size={15} />
          <span>Add Athlete</span>
        </button>
      </div>

      {/* Client List */}
      <div className="client-list">
        {loadingClients && (
          <div className="empty-state">
            <div className="spin-inline" /> Loading clients...
          </div>
        )}

        {/* SECTION 1: COACH PERSONAL TRAINING */}
        {selfProfile && (
          <div style={{ marginBottom: "14px" }}>
            <div
              style={{
                fontSize: "10px",
                fontWeight: 800,
                color: "#2563eb",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                padding: "0 14px 6px",
                display: "flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              <Zap size={11} />
              <span>My Personal Training</span>
            </div>

            <div
              className={`client-item${selected?.id === selfProfile.id ? " active" : ""}`}
              style={{
                borderLeft: selected?.id === selfProfile.id ? "3px solid #2563eb" : "3px solid #93c5fd",
                background: selected?.id === selfProfile.id ? undefined : "#f0f7ff",
              }}
              onClick={() => onSelectClient(selfProfile)}
            >
              <div style={{ position: "relative", flexShrink: 0, marginRight: "10px" }}>
                <UserAvatar
                  src={selfProfile.image}
                  name={selfProfile.name}
                  size={36}
                  style={{
                    border: selected?.id === selfProfile.id ? "2px solid #2563eb" : "1px solid #bfdbfe",
                  }}
                />
              </div>

              <div className="client-item-main">
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span className="client-name" style={{ fontWeight: 800, color: "#0f172a" }}>
                    {selfProfile.name}
                  </span>
                  <span
                    className="client-status-badge"
                    style={{
                      background: "#eff6ff",
                      color: "#1d4ed8",
                      border: "1px solid #bfdbfe",
                      fontWeight: 700,
                      fontSize: "10px",
                      padding: "1px 6px",
                      borderRadius: "9999px",
                    }}
                  >
                    Personal
                  </span>
                </div>

                <div className="client-meta">
                  <span>{selfProfile._count?.workoutSessions ?? 0} personal workouts</span>
                </div>
              </div>

              <div className="client-item-actions">
                <button
                  className="client-action-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onOpenTrainerProfile) {
                      onOpenTrainerProfile();
                    } else {
                      onOpenEditClient(selfProfile);
                    }
                  }}
                  title="Edit Coach Profile & Settings"
                >
                  <Edit3 size={13} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 2: COACHED ATHLETES */}
        <div>
          <div
            style={{
              fontSize: "10px",
              fontWeight: 800,
              color: "#64748b",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              padding: "0 14px 6px",
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            <Dumbbell size={11} />
            <span>Coached Athletes ({athletes.length})</span>
          </div>

          {!loadingClients && athletes.length === 0 && (
            <div className="empty-state" style={{ margin: "4px 12px", padding: "14px", fontSize: "12px" }}>
              No athletes yet. Click <strong>Add Athlete</strong> above or share your invite link.
            </div>
          )}

          {athletes.map((client) => {
            const isAccepted = client.inviteStatus === "ACCEPTED";
            const isPending = client.inviteStatus === "PENDING";

            return (
              <div
                key={client.id}
                className={`client-item${selected?.id === client.id ? " active" : ""}`}
                onClick={() => onSelectClient(client)}
              >
                {/* Client Avatar Thumbnail */}
                <div style={{ position: "relative", flexShrink: 0, marginRight: "10px" }}>
                  <UserAvatar
                    src={client.image}
                    name={client.name}
                    size={36}
                    style={{
                      border: selected?.id === client.id ? "2px solid #2563eb" : "1px solid #cbd5e1",
                    }}
                  />
                </div>

                <div className="client-item-main">
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span className="client-name">
                      {client.name}
                    </span>
                    <span
                      className={`client-status-badge ${
                        isAccepted
                          ? "client-status-accepted"
                          : isPending
                          ? "client-status-pending"
                          : "client-status-none"
                      }`}
                    >
                      {isAccepted ? "Active" : isPending ? "Invite Sent" : "Free"}
                    </span>
                  </div>

                  <div className="client-meta">
                    <span>{client._count?.workoutSessions ?? 0} workouts logged</span>
                    {client.email && (
                      <span className="client-meta-extra" title={client.email}>
                        • {client.email}
                      </span>
                    )}
                  </div>
                </div>

                <div className="client-item-actions">
                  {onQuickInvite && (
                    <button
                      className="client-action-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        onQuickInvite(client);
                      }}
                      title="Copy Athlete Invite Link"
                      style={{ color: "#2563eb" }}
                    >
                      <Link2 size={13} />
                    </button>
                  )}
                  <button
                    className="client-action-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenEditClient(client);
                    }}
                    title="Edit Profile"
                  >
                    <Edit3 size={13} />
                  </button>
                  <button
                    className="client-action-btn delete"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteClient(client.id);
                    }}
                    title="Delete Client"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
