"use client";

import { Users, UserPlus, ChevronRight, Trash2, Edit3, User, Link2, Dumbbell } from "lucide-react";
import { UserAvatar } from "@/components/UserAvatar";
import { Client } from "../types";

interface ClientSidebarProps {
  clients: Client[];
  selected: Client | null;
  loadingClients: boolean;
  onSelectClient: (client: Client) => void;
  onOpenAddClient: () => void;
  onOpenEditClient: (client: Client) => void;
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
  onDeleteClient,
  onQuickInvite,
}: ClientSidebarProps) {
  return (
    <aside className="sidebar hide-mobile-sidebar" data-tour="client-sidebar">
      {/* Sidebar Header */}
      <div className="sidebar-header">
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <Users size={15} />
          <span>Clients</span>
        </div>
        <span className="client-count">{clients.length}</span>
      </div>

      {/* Add Client Action Button */}
      <div style={{ padding: "0 12px 12px" }}>
        <button
          onClick={onOpenAddClient}
          className="btn-primary sidebar-add-btn"
          title="Add a new client profile"
        >
          <UserPlus size={15} />
          <span>Add Client</span>
        </button>
      </div>

      {/* Client List */}
      <div className="client-list">
        {loadingClients && (
          <div className="empty-state">
            <div className="spin-inline" /> Loading clients...
          </div>
        )}

        {!loadingClients && !clients.length && (
          <div className="empty-state">
            No clients yet. Click <strong>Add Client</strong> above to get started.
          </div>
        )}

        {clients.map((client) => {
          const isSelfProfile = (client as any).isSelf || client.name.includes("My Workouts");
          const isAccepted = client.inviteStatus === "ACCEPTED";
          const isPending = client.inviteStatus === "PENDING";

          return (
            <div
              key={client.id}
              className={`client-item${selected?.id === client.id ? " active" : ""}`}
              style={isSelfProfile ? { borderLeft: selected?.id === client.id ? "3px solid #2563eb" : "3px solid #60a5fa", background: selected?.id === client.id ? undefined : "#f8faff" } : undefined}
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
                  <span className="client-name" style={isSelfProfile ? { fontWeight: 700, color: "#0f172a" } : undefined}>
                    {client.name}
                  </span>
                  {!isSelfProfile && (
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
                  )}
                </div>

                <div className="client-meta">
                  <span>{client._count?.workoutSessions ?? 0} workouts logged</span>
                  {client.email && !isSelfProfile && (
                    <span className="client-meta-extra" title={client.email}>
                      • {client.email}
                    </span>
                  )}
                </div>
              </div>

              <div className="client-item-actions">
                {!isSelfProfile && onQuickInvite && (
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
                {!isSelfProfile && (
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
                )}
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
}
