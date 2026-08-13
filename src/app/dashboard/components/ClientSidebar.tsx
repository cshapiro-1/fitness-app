"use client";

import React from "react";
import { Users, UserPlus, ChevronRight, Trash2, Edit3 } from "lucide-react";
import { Client } from "../types";

interface ClientSidebarProps {
  clients: Client[];
  selected: Client | null;
  loadingClients: boolean;
  onSelectClient: (client: Client) => void;
  onOpenAddClient: () => void;
  onOpenEditClient: (client: Client) => void;
  onDeleteClient: (id: string) => void;
}

export function ClientSidebar({
  clients,
  selected,
  loadingClients,
  onSelectClient,
  onOpenAddClient,
  onOpenEditClient,
  onDeleteClient,
}: ClientSidebarProps) {
  return (
    <aside className="sidebar">
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
          const isSelfProfile = client.name === "My Workouts";
          const isAccepted = client.inviteStatus === "ACCEPTED";
          const isPending = client.inviteStatus === "PENDING";

          return (
            <div
              key={client.id}
              className={`client-item${selected?.id === client.id ? " active" : ""}`}
              onClick={() => onSelectClient(client)}
            >
              <div className="client-item-main">
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span className="client-name">
                    {client.name}
                    {isSelfProfile ? " — Self" : ""}
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
                      {isAccepted ? "Active" : isPending ? "Invite Sent" : "No Invite"}
                    </span>
                  )}
                </div>

                <div className="client-meta">
                  <span>{client._count?.workoutSessions ?? 0} workouts</span>
                  {client.email && (
                    <span className="client-meta-extra" title={client.email}>
                      • {client.email}
                    </span>
                  )}
                </div>
              </div>

              <div className="client-item-actions">
                {!isSelfProfile && (
                  <>
                    <button
                      className="btn-ghost-edit"
                      onClick={(event) => {
                        event.stopPropagation();
                        onOpenEditClient(client);
                      }}
                      title="Edit Client"
                    >
                      <Edit3 size={13} />
                    </button>
                    <button
                      className="btn-ghost-danger"
                      onClick={(event) => {
                        event.stopPropagation();
                        onDeleteClient(client.id);
                      }}
                      title="Delete Client"
                    >
                      <Trash2 size={13} />
                    </button>
                  </>
                )}
                <ChevronRight size={14} className="client-arrow" />
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
}
