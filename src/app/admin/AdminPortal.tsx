"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  ShieldCheck, Users, TrendingUp, DollarSign, Clock, Zap, Search, RefreshCw,
  Award, CheckCircle2, UserCheck, Lock, Edit3, ArrowLeft, Dumbbell
} from "lucide-react";
import Link from "next/link";

interface AdminUser {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  role: "TRAINER" | "CLIENT";
  isAdmin: boolean;
  subscriptionStatus: string | null;
  computedStatus: "trial" | "active" | "expired";
  trialEndsAt: string | null;
  subscribedUntil: string | null;
  createdAt: string;
  clientCount: number;
}

interface AdminStats {
  totalUsers: number;
  totalTrainers: number;
  totalClients: number;
  totalWorkouts: number;
  activeSubscriptions: number;
  trialingUsers: number;
  expiredUsers: number;
  estimatedMRR: number;
  conversionRate: number;
}

export function AdminPortal({ userName }: { userName: string }) {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [actionUserId, setActionUserId] = useState<string | null>(null);

  const fetchAdminData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/stats");
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
        setUsers(data.users);
      } else {
        alert("Failed to load admin statistics.");
      }
    } catch {
      alert("Error connecting to admin API.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAdminData();
  }, [fetchAdminData]);

  const handleUpdateUser = async (userId: string, body: any) => {
    setActionUserId(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        // Force the browser to refresh and show the updated database state!
        window.location.reload(); 
      } else {
        const errorData = await res.json().catch(() => ({}));
        alert("Failed to update: " + (errorData.error || res.statusText));
      }

      if (res.ok) {
        fetchAdminData();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to update user.");
      }
    } catch {
      alert("Error updating user.");
    } finally {
      setActionUserId(null);
    }
  };

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const query = searchQuery.toLowerCase();
      const nameMatch = u.name?.toLowerCase().includes(query) || false;
      const emailMatch = u.email.toLowerCase().includes(query);
      const matchesSearch = !query || nameMatch || emailMatch;

      const matchesRole = roleFilter === "ALL" || u.role === roleFilter;
      const matchesStatus = statusFilter === "ALL" || u.computedStatus === statusFilter;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchQuery, roleFilter, statusFilter]);

  return (
    <div className="app" style={{ minHeight: "100vh", background: "#f8fafc" }}>
      {/* Admin Header */}
      <header className="header" style={{ background: "#0f172a", color: "#ffffff" }}>
        <div className="header-left">
          <ShieldCheck size={24} style={{ color: "#38bdf8" }} />
          <span className="header-title" style={{ color: "#ffffff" }}>Admin Management Portal</span>
        </div>
        <div className="header-right">
          <Link href="/dashboard" style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", background: "#1e293b", color: "#f8fafc", padding: "6px 12px", borderRadius: "6px", textDecoration: "none" }}>
            <ArrowLeft size={14} /> Back to Dashboard
          </Link>
        </div>
      </header>

      <div style={{ maxWidth: "1200px", margin: "24px auto", padding: "0 16px", display: "flex", flexDirection: "column", gap: "24px" }}>
        {/* Metric Cards Grid */}
        {stats && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "16px" }}>
            <div className="analytics-summary-card" style={{ background: "#ffffff", padding: "16px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#16a34a", fontSize: "12px", fontWeight: 600 }}>
                <DollarSign size={16} /> Estimated MRR
              </div>
              <span className="analytics-summary-value" style={{ color: "#15803d", fontSize: "24px" }}>
                ${stats.estimatedMRR} <span style={{ fontSize: "12px", color: "#64748b", fontWeight: 400 }}>/mo</span>
              </span>
            </div>

            <div className="analytics-summary-card" style={{ background: "#ffffff", padding: "16px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#2563eb", fontSize: "12px", fontWeight: 600 }}>
                <Users size={16} /> Platform Trainers
              </div>
              <span className="analytics-summary-value" style={{ fontSize: "24px" }}>{stats.totalTrainers}</span>
            </div>

            <div className="analytics-summary-card" style={{ background: "#ffffff", padding: "16px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#0284c7", fontSize: "12px", fontWeight: 600 }}>
                <CheckCircle2 size={16} /> Paid Subscribers
              </div>
              <span className="analytics-summary-value" style={{ color: "#0369a1", fontSize: "24px" }}>{stats.activeSubscriptions}</span>
            </div>

            <div className="analytics-summary-card" style={{ background: "#ffffff", padding: "16px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#d97706", fontSize: "12px", fontWeight: 600 }}>
                <Clock size={16} /> Trialing Trainers
              </div>
              <span className="analytics-summary-value" style={{ color: "#b45309", fontSize: "24px" }}>{stats.trialingUsers}</span>
            </div>

            <div className="analytics-summary-card" style={{ background: "#ffffff", padding: "16px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#7c3aed", fontSize: "12px", fontWeight: 600 }}>
                <TrendingUp size={16} /> Conversion Rate
              </div>
              <span className="analytics-summary-value" style={{ color: "#6d28d9", fontSize: "24px" }}>{stats.conversionRate}%</span>
            </div>

            <div className="analytics-summary-card" style={{ background: "#ffffff", padding: "16px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#475569", fontSize: "12px", fontWeight: 600 }}>
                <Dumbbell size={16} /> Total Workouts
              </div>
              <span className="analytics-summary-value" style={{ fontSize: "24px" }}>{stats.totalWorkouts}</span>
            </div>
          </div>
        )}

        {/* User Management Section */}
        <div style={{ background: "#ffffff", padding: "20px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
            <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 700, color: "#0f172a" }}>
              User Directory & Memberships ({filteredUsers.length})
            </h3>
            <button
              onClick={fetchAdminData}
              style={{ display: "flex", alignItems: "center", gap: "6px", padding: "6px 12px", fontSize: "12px", background: "#f1f5f9", border: "1px solid #cbd5e1", borderRadius: "6px", cursor: "pointer" }}
            >
              <RefreshCw size={13} className={loading ? "spin" : ""} /> Refresh Data
            </button>
          </div>

          {/* Search & Filter Controls */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginBottom: "16px" }}>
            <div style={{ position: "relative", flex: "1 1 240px" }}>
              <Search size={14} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
              <input
                className="input"
                placeholder="Search user name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ paddingLeft: "30px", width: "100%", fontSize: "12px" }}
              />
            </div>

            <select
              className="input"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              style={{ fontSize: "12px", padding: "6px 10px" }}
            >
              <option value="ALL">All Roles</option>
              <option value="TRAINER">Trainers Only</option>
              <option value="CLIENT">Clients Only</option>
            </select>

            <select
              className="input"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ fontSize: "12px", padding: "6px 10px" }}
            >
              <option value="ALL">All Subscription Statuses</option>
              <option value="active">Active Paid</option>
              <option value="trial">Trialing</option>
              <option value="expired">Expired</option>
            </select>
          </div>

          {/* Users Table */}
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", textAlign: "left" }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0", color: "#475569" }}>
                  <th style={{ padding: "10px 12px" }}>User</th>
                  <th style={{ padding: "10px 12px" }}>Role</th>
                  <th style={{ padding: "10px 12px" }}>Clients</th>
                  <th style={{ padding: "10px 12px" }}>Subscription Status</th>
                  <th style={{ padding: "10px 12px" }}>Joined</th>
                  <th style={{ padding: "10px 12px", textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: "center", padding: "24px", color: "#64748b" }}>
                      No matching users found.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => (
                    <tr key={u.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "12px" }}>
                        <div style={{ fontWeight: 600, color: "#0f172a" }}>
                          {u.name || "Unnamed User"}{" "}
                          {u.isAdmin && (
                            <span style={{ fontSize: "10px", background: "#fef3c7", color: "#d97706", padding: "1px 5px", borderRadius: "4px", fontWeight: 700 }}>
                              ADMIN
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: "11px", color: "#64748b" }}>{u.email}</div>
                      </td>

                      <td style={{ padding: "12px" }}>
                        <span style={{ fontSize: "11px", fontWeight: 600, padding: "2px 8px", borderRadius: "6px", background: u.role === "TRAINER" ? "#eff6ff" : "#f1f5f9", color: u.role === "TRAINER" ? "#2563eb" : "#475569" }}>
                          {u.role}
                        </span>
                      </td>

                      <td style={{ padding: "12px", fontWeight: 600 }}>{u.clientCount}</td>

                      <td style={{ padding: "12px" }}>
                        {u.computedStatus === "active" && (
                          <span style={{ fontSize: "11px", fontWeight: 600, color: "#16a34a", background: "#f0fdf4", padding: "3px 8px", borderRadius: "6px", border: "1px solid #bbf7d0" }}>
                            ✓ Active Paid
                          </span>
                        )}
                        {u.computedStatus === "trial" && (
                          <span style={{ fontSize: "11px", fontWeight: 600, color: "#d97706", background: "#fffbe3", padding: "3px 8px", borderRadius: "6px", border: "1px solid #fef08a" }}>
                            ⏱ Trialing
                          </span>
                        )}
                        {u.computedStatus === "expired" && (
                          <span style={{ fontSize: "11px", fontWeight: 600, color: "#dc2626", background: "#fef2f2", padding: "3px 8px", borderRadius: "6px", border: "1px solid #fecaca" }}>
                            🔒 Expired
                          </span>
                        )}
                      </td>

                      <td style={{ padding: "12px", color: "#64748b", fontSize: "12px" }}>
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>

                      <td style={{ padding: "12px", textAlign: "right" }}>
                        <div style={{ display: "flex", justifyContent: "flex-end", gap: "6px" }}>
                          <button
                            onClick={() => handleUpdateUser(u.id, { extendTrialDays: 14 })}
                            disabled={actionUserId === u.id}
                            style={{ fontSize: "11px", padding: "4px 8px", background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: "4px", cursor: "pointer" }}
                            title="Add +14 days to trial"
                          >
                            +14D Trial
                          </button>

                          <button
                            onClick={() => handleUpdateUser(u.id, { grantSubscriptionDays: 365 })}
                            disabled={actionUserId === u.id}
                            style={{ fontSize: "11px", padding: "4px 8px", background: "#16a34a", color: "#ffffff", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: 600 }}
                            title="Grant 1 Year Active Subscription"
                          >
                            Grant 1Yr Sub
                          </button>

                          <button
                            onClick={() => handleUpdateUser(u.id, { isAdmin: !u.isAdmin })}
                            disabled={actionUserId === u.id}
                            style={{ fontSize: "11px", padding: "4px 8px", background: u.isAdmin ? "#fee2e2" : "#f1f5f9", color: u.isAdmin ? "#dc2626" : "#475569", border: "none", borderRadius: "4px", cursor: "pointer" }}
                          >
                            {u.isAdmin ? "Revoke Admin" : "Make Admin"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}