"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  ShieldCheck, Users, TrendingUp, DollarSign, Clock, Zap, Search, RefreshCw,
  Award, CheckCircle2, UserCheck, Lock, Edit3, ArrowLeft, Dumbbell, Activity,
  Briefcase, User, Timer, Calendar, LogIn, Trash2, Hourglass
} from "lucide-react";
import Link from "next/link";

interface AdminTrainer {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  role: "TRAINER" | "CLIENT" | "ADMIN";
  isAdmin: boolean;
  subscriptionStatus: string | null;
  computedStatus: "trial" | "active" | "expired" | "client_free";
  trialEndsAt: string | null;
  subscribedUntil: string | null;
  createdAt: string;
  clientCount: number;
  workoutsLoggedForClients: number;
  lastLoginAt?: string | null;
  lastActiveAt?: string | null;
  lastSessionDurationSeconds?: number | null;
  loginCount?: number;
  totalSessionSeconds?: number;
  avgSessionDurationSeconds?: number;
}

interface AdminClient {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  image: string | null;
  createdAt: string;
  trainerId?: string;
  trainerName: string;
  workoutsLogged: number;
  isRegistered: boolean;
  lastLoginAt?: string | null;
  lastActiveAt?: string | null;
  lastSessionDurationSeconds?: number | null;
  loginCount?: number;
  totalSessionSeconds?: number;
  avgSessionDurationSeconds?: number;
}

interface AdminStats {
  totalUsers: number;
  totalTrainers: number;
  totalClients: number;
  totalWorkouts: number;
  totalCompletedWorkouts?: number;
  inProgressSessions?: number;
  totalSetsCount?: number;
  dau?: number;
  wau?: number;
  mau?: number;
  stickinessRatio?: number;
  completionRate?: number;
  avgClientsPerTrainer?: number;
  activeSubscriptions: number;
  trialingUsers: number;
  expiredUsers: number;
  estimatedMRR: number;
  conversionRate: number;
  totalLogins?: number;
  overallAvgSessionSeconds?: number;
  totalAppTimeSeconds?: number;
}

interface StripeBillingData {
  connected: boolean;
  availableBalance: number;
  pendingBalance: number;
  monthlySubscribers: number;
  annualSubscribers: number;
  totalPayingSubscribers: number;
  realMRR: number;
  projectedARR: number;
  recentPayouts: Array<{
    id: string;
    amount: number;
    currency: string;
    status: string;
    arrivalDate: string;
    method: string;
  }>;
  recentTransactions: Array<{
    id: string;
    amount: number;
    currency: string;
    paid: boolean;
    status: string;
    customerEmail: string;
    created: string;
  }>;
}

function formatSessionDuration(seconds?: number | null): string {
  if (seconds === undefined || seconds === null || seconds <= 0) return "-";
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  const remainingSecs = seconds % 60;
  if (mins < 60) {
    return remainingSecs > 0 ? `${mins}m ${remainingSecs}s` : `${mins} mins`;
  }
  const hours = Math.floor(mins / 60);
  const remainingMins = mins % 60;
  return `${hours}h ${remainingMins}m`;
}

function formatTotalAppTime(seconds?: number | null): string {
  if (!seconds || seconds <= 0) return "0 mins";
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  if (mins < 60) return `${mins} mins`;
  const hours = (seconds / 3600).toFixed(1);
  return `${hours} hrs`;
}

function formatRelativeTime(dateStr?: string | null, seconds?: number | null): { text: string; full: string; isRecent: boolean } {
  if (!dateStr) return { text: "Never", full: "No recorded activity", isRecent: false };
  const date = new Date(dateStr);
  const full = date.toLocaleString();
  const diffMs = Date.now() - date.getTime();
  if (isNaN(diffMs)) return { text: "Unknown", full: "Invalid Date", isRecent: false };

  const diffSecs = Math.floor(diffMs / 1000);
  const hasSession = (seconds || 0) > 0;

  if (diffSecs < 120 && hasSession) return { text: "Active now", full, isRecent: true };
  const diffMins = Math.floor(diffSecs / 60);
  if (diffMins < 60) return { text: `${diffMins}m ago`, full, isRecent: diffMins <= 5 && hasSession };
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return { text: `${diffHours}h ago`, full, isRecent: false };
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return { text: "Yesterday", full, isRecent: false };
  if (diffDays < 7) return { text: `${diffDays}d ago`, full, isRecent: false };
  return { text: date.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" }), full, isRecent: false };
}

export function AdminPortal({ userName }: { userName: string }) {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [stripeBilling, setStripeBilling] = useState<StripeBillingData | null>(null);
  const [trainers, setTrainers] = useState<AdminTrainer[]>([]);
  const [clients, setClients] = useState<AdminClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"trainers" | "clients">("trainers");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [actionUserId, setActionUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchAdminData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/stats");
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
        setStripeBilling(data.stripeBilling || null);
        setTrainers(data.trainers || data.users || []);
        setClients(data.clients || []);
      } else {
        const errData = await res.json().catch(() => ({ error: "Failed to load admin statistics." }));
        setError(errData.error || "Failed to load admin statistics.");
      }
    } catch {
      setError("Error connecting to admin API.");
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

  const handleDeleteUser = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to permanently delete "${name}"? This action cannot be undone.`)) {
      return;
    }
    setActionUserId(id);
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchAdminData();
      } else {
        const err = await res.json().catch(() => ({ error: "Failed to delete account" }));
        alert(err.error || "Failed to delete account.");
      }
    } catch {
      alert("Error connecting to delete API.");
    } finally {
      setActionUserId(null);
    }
  };

  const filteredTrainers = useMemo(() => {
    return trainers.filter((t) => {
      const query = searchQuery.toLowerCase();
      const nameMatch = t.name?.toLowerCase().includes(query) || false;
      const emailMatch = t.email.toLowerCase().includes(query);
      const matchesSearch = nameMatch || emailMatch;

      const matchesStatus = statusFilter === "ALL" || t.computedStatus === statusFilter.toLowerCase();
      return matchesSearch && matchesStatus;
    });
  }, [trainers, searchQuery, statusFilter]);

  const filteredClients = useMemo(() => {
    return clients.filter((c) => {
      const query = searchQuery.toLowerCase();
      const nameMatch = c.name.toLowerCase().includes(query);
      const emailMatch = c.email.toLowerCase().includes(query);
      const trainerMatch = c.trainerName.toLowerCase().includes(query);
      return nameMatch || emailMatch || trainerMatch;
    });
  }, [clients, searchQuery]);

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      {/* Top Admin Header */}
      <header style={{ background: "#0f172a", color: "#ffffff", padding: "16px 24px", borderBottom: "1px solid #1e293b" }}>
        <div style={{ maxWidth: "1280px", margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <ShieldCheck size={24} style={{ color: "#38bdf8" }} />
            <div>
              <h1 style={{ margin: 0, fontSize: "18px", fontWeight: 700 }}>STRKYR Master Admin Portal</h1>
              <div style={{ fontSize: "12px", color: "#94a3b8" }}>Master Operations, User Telemetry &amp; Real-Time Activity Tracking</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <Link
              href="/dashboard"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                background: "#1e293b",
                color: "#f8fafc",
                padding: "6px 12px",
                borderRadius: "8px",
                fontSize: "12px",
                textDecoration: "none",
                fontWeight: 600,
                border: "1px solid #334155",
              }}
            >
              <ArrowLeft size={14} /> Back to Dashboard
            </Link>
          </div>
        </div>
      </header>

      <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "24px" }}>
        {error && (
          <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "10px", padding: "14px 18px", marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "#b91c1c", fontSize: "13px", fontWeight: 600 }}>
              <Zap size={18} />
              <span>{error}</span>
            </div>
            <button
              onClick={fetchAdminData}
              style={{ background: "#dc2626", color: "#ffffff", border: "none", padding: "6px 12px", borderRadius: "6px", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}
            >
              Retry
            </button>
          </div>
        )}

        {/* KPI Telemetry Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: "14px", marginBottom: "24px" }}>
          {/* Active Paid Trainers */}
          <div style={{ background: "#ffffff", padding: "16px", borderRadius: "12px", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", color: "#64748b", fontSize: "11px", fontWeight: 700, textTransform: "uppercase" }}>
              <span>ACTIVE SUBSCRIBERS</span>
              <DollarSign size={16} style={{ color: "#16a34a" }} />
            </div>
            <div style={{ fontSize: "26px", fontWeight: 800, color: "#0f172a", marginTop: "4px" }}>
              {stats?.activeSubscriptions ?? 0}
            </div>
            <div style={{ fontSize: "11px", color: "#16a34a", marginTop: "2px", fontWeight: 600 }}>
              ${stats?.estimatedMRR ?? 0} Real MRR
            </div>
          </div>

          {/* Total Trainers */}
          <div style={{ background: "#ffffff", padding: "16px", borderRadius: "12px", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", color: "#64748b", fontSize: "11px", fontWeight: 700, textTransform: "uppercase" }}>
              <span>TOTAL TRAINERS</span>
              <Briefcase size={16} style={{ color: "#2563eb" }} />
            </div>
            <div style={{ fontSize: "26px", fontWeight: 800, color: "#0f172a", marginTop: "4px" }}>
              {trainers.length || stats?.totalTrainers || 0}
            </div>
            <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>
              {stats?.trialingUsers ?? 0} trialing · {stats?.expiredUsers ?? 0} expired
            </div>
          </div>

          {/* Total Managed Athletes / Clients */}
          <div style={{ background: "#ffffff", padding: "16px", borderRadius: "12px", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", color: "#64748b", fontSize: "11px", fontWeight: 700, textTransform: "uppercase" }}>
              <span>TOTAL CLIENTS</span>
              <Users size={16} style={{ color: "#7c3aed" }} />
            </div>
            <div style={{ fontSize: "26px", fontWeight: 800, color: "#0f172a", marginTop: "4px" }}>
              {clients.length || stats?.totalClients || 0}
            </div>
            <div style={{ fontSize: "11px", color: "#7c3aed", marginTop: "2px", fontWeight: 600 }}>
              {stats?.avgClientsPerTrainer ?? 0} clients / coach
            </div>
          </div>

          {/* Workouts Logged */}
          <div style={{ background: "#ffffff", padding: "16px", borderRadius: "12px", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", color: "#64748b", fontSize: "11px", fontWeight: 700, textTransform: "uppercase" }}>
              <span>WORKOUT LOGS</span>
              <Dumbbell size={16} style={{ color: "#ea580c" }} />
            </div>
            <div style={{ fontSize: "26px", fontWeight: 800, color: "#0f172a", marginTop: "4px" }}>
              {stats?.totalWorkouts ?? 0}
            </div>
            <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>
              {stats?.totalCompletedWorkouts ?? 0} finished ({stats?.completionRate ?? 0}%)
            </div>
          </div>

          {/* Average App Session Length */}
          <div style={{ background: "#ffffff", padding: "16px", borderRadius: "12px", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", color: "#64748b", fontSize: "11px", fontWeight: 700, textTransform: "uppercase" }}>
              <span>AVG APP SESSION</span>
              <Hourglass size={16} style={{ color: "#059669" }} />
            </div>
            <div style={{ fontSize: "26px", fontWeight: 800, color: "#0f172a", marginTop: "4px" }}>
              {formatSessionDuration(stats?.overallAvgSessionSeconds)}
            </div>
            <div style={{ fontSize: "11px", color: "#059669", marginTop: "2px", fontWeight: 600 }}>
              {formatTotalAppTime(stats?.totalAppTimeSeconds)} total in app
            </div>
          </div>

          {/* Total App Logins */}
          <div style={{ background: "#ffffff", padding: "16px", borderRadius: "12px", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", color: "#64748b", fontSize: "11px", fontWeight: 700, textTransform: "uppercase" }}>
              <span>TOTAL LOGINS</span>
              <LogIn size={16} style={{ color: "#0284c7" }} />
            </div>
            <div style={{ fontSize: "26px", fontWeight: 800, color: "#0f172a", marginTop: "4px" }}>
              {stats?.totalLogins ?? (trainers.length + clients.length)}
            </div>
            <div style={{ fontSize: "11px", color: "#0284c7", marginTop: "2px", fontWeight: 600 }}>
              {stats?.dau ?? 1} DAU · {stats?.stickinessRatio ?? 100}% stickiness
            </div>
          </div>
        </div>

        {/* Live Stripe Merchant Dashboard */}
        {stripeBilling?.connected && (
          <div style={{ background: "#ffffff", padding: "20px", borderRadius: "12px", border: "1px solid #e2e8f0", marginBottom: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <DollarSign size={20} style={{ color: "#635bff" }} />
                <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "#0f172a" }}>
                  Stripe Merchant Financial Telemetry
                </h3>
              </div>
              <span style={{ fontSize: "11px", fontWeight: 700, background: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0", padding: "3px 8px", borderRadius: "6px" }}>
                ✓ Live Account Connected
              </span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px", marginBottom: "16px" }}>
              <div style={{ background: "#f8fafc", padding: "12px 16px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                <div style={{ fontSize: "11px", color: "#64748b", fontWeight: 600 }}>AVAILABLE BALANCE</div>
                <div style={{ fontSize: "20px", fontWeight: 800, color: "#16a34a", marginTop: "4px" }}>
                  ${stripeBilling.availableBalance.toFixed(2)} USD
                </div>
              </div>

              <div style={{ background: "#f8fafc", padding: "12px 16px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                <div style={{ fontSize: "11px", color: "#64748b", fontWeight: 600 }}>PENDING IN TRANSIT</div>
                <div style={{ fontSize: "20px", fontWeight: 800, color: "#0284c7", marginTop: "4px" }}>
                  ${stripeBilling.pendingBalance.toFixed(2)} USD
                </div>
              </div>

              <div style={{ background: "#f8fafc", padding: "12px 16px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                <div style={{ fontSize: "11px", color: "#64748b", fontWeight: 600 }}>PLAN BREAKDOWN</div>
                <div style={{ fontSize: "13px", fontWeight: 600, color: "#0f172a", marginTop: "6px" }}>
                  <span>{stripeBilling.monthlySubscribers} Monthly ($19/mo)</span> · <span>{stripeBilling.annualSubscribers} Annual ($200/yr)</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* User Directory: Split Trainers & Clients */}
        <div style={{ background: "#ffffff", padding: "20px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
          {/* Tabs: Trainers vs Clients */}
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "12px", marginBottom: "16px", borderBottom: "1px solid #e2e8f0", paddingBottom: "12px" }}>
            <div style={{ display: "flex", background: "#f1f5f9", borderRadius: "10px", padding: "3px", gap: "4px" }}>
              <button
                onClick={() => setActiveTab("trainers")}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "8px 16px",
                  fontSize: "13px",
                  fontWeight: 700,
                  borderRadius: "8px",
                  border: "none",
                  cursor: "pointer",
                  background: activeTab === "trainers" ? "#2563eb" : "transparent",
                  color: activeTab === "trainers" ? "#ffffff" : "#475569",
                  boxShadow: activeTab === "trainers" ? "0 1px 3px rgba(37,99,235,0.2)" : "none",
                  transition: "all 0.15s ease",
                }}
              >
                <Briefcase size={15} />
                <span>Trainers &amp; Coaches ({trainers.length})</span>
              </button>

              <button
                onClick={() => setActiveTab("clients")}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "8px 16px",
                  fontSize: "13px",
                  fontWeight: 700,
                  borderRadius: "8px",
                  border: "none",
                  cursor: "pointer",
                  background: activeTab === "clients" ? "#2563eb" : "transparent",
                  color: activeTab === "clients" ? "#ffffff" : "#475569",
                  boxShadow: activeTab === "clients" ? "0 1px 3px rgba(37,99,235,0.2)" : "none",
                  transition: "all 0.15s ease",
                }}
              >
                <Users size={15} />
                <span>Clients &amp; Athletes ({clients.length})</span>
              </button>
            </div>

            <button
              onClick={fetchAdminData}
              style={{ display: "flex", alignItems: "center", gap: "6px", padding: "6px 12px", fontSize: "12px", background: "#f1f5f9", border: "1px solid #cbd5e1", borderRadius: "6px", cursor: "pointer", fontWeight: 600 }}
            >
              <RefreshCw size={13} className={loading ? "spin" : ""} /> Refresh
            </button>
          </div>

          {/* Search & Filter Controls */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginBottom: "16px" }}>
            <div style={{ position: "relative", flex: "1 1 240px" }}>
              <Search size={14} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
              <input
                className="input"
                placeholder={activeTab === "trainers" ? "Search trainer name or email..." : "Search client or trainer name..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ paddingLeft: "30px", width: "100%", fontSize: "12px" }}
              />
            </div>

            {activeTab === "trainers" && (
              <select
                className="input"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{ fontSize: "12px", padding: "6px 10px" }}
              >
                <option value="ALL">All Memberships</option>
                <option value="ACTIVE">Active Paid</option>
                <option value="TRIAL">Trialing</option>
                <option value="EXPIRED">Expired</option>
              </select>
            )}
          </div>

          {/* ========================================================= */}
          {/* TAB 1: TRAINERS TABLE                                     */}
          {/* ========================================================= */}
          {activeTab === "trainers" && (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid #e2e8f0", color: "#475569", fontSize: "11px", textTransform: "uppercase" }}>
                    <th style={{ padding: "10px 12px" }}>Trainer</th>
                    <th style={{ padding: "10px 12px" }}>Role</th>
                    <th style={{ padding: "10px 12px" }}>Clients</th>
                    <th style={{ padding: "10px 12px" }}>Workouts Logged</th>
                    <th style={{ padding: "10px 12px" }}>Logins</th>
                    <th style={{ padding: "10px 12px" }}>Avg Session</th>
                    <th style={{ padding: "10px 12px" }}>Last Active</th>
                    <th style={{ padding: "10px 12px" }}>Last Session</th>
                    <th style={{ padding: "10px 12px" }}>Membership</th>
                    <th style={{ padding: "10px 12px" }}>Joined</th>
                    <th style={{ padding: "10px 12px", textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTrainers.length === 0 ? (
                    <tr>
                      <td colSpan={11} style={{ textAlign: "center", padding: "24px", color: "#64748b" }}>
                        No trainers found matching filters.
                      </td>
                    </tr>
                  ) : (
                    filteredTrainers.map((t) => {
                      const rel = formatRelativeTime(t.lastActiveAt || t.lastLoginAt, t.lastSessionDurationSeconds);
                      const durationStr = formatSessionDuration(t.lastSessionDurationSeconds);
                      const avgStr = formatSessionDuration(t.avgSessionDurationSeconds);
                      const totalTimeStr = formatTotalAppTime(t.totalSessionSeconds);

                      return (
                        <tr key={t.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                          <td style={{ padding: "12px" }}>
                            <div style={{ fontWeight: 700, color: "#0f172a" }}>
                              {t.name || "Unnamed Trainer"}
                            </div>
                            <div style={{ fontSize: "11px", color: "#64748b" }}>{t.email}</div>
                          </td>

                          <td style={{ padding: "12px" }}>
                            <span style={{ fontSize: "11px", fontWeight: 700, padding: "2px 8px", borderRadius: "6px", background: t.isAdmin ? "#fef3c7" : "#eff6ff", color: t.isAdmin ? "#92400e" : "#2563eb" }}>
                              {t.isAdmin ? "👑 ADMIN" : t.role}
                            </span>
                          </td>

                          <td style={{ padding: "12px", fontWeight: 700 }}>{t.clientCount}</td>

                          <td style={{ padding: "12px" }}>
                            <span style={{ fontWeight: 800, color: "#0f172a" }}>
                              {t.workoutsLoggedForClients}
                            </span>{" "}
                            <span style={{ fontSize: "11px", color: "#64748b" }}>workouts</span>
                          </td>

                          {/* Number of Logins */}
                          <td style={{ padding: "12px" }}>
                            <span style={{ fontSize: "11px", fontWeight: 700, color: "#0284c7", background: "#f0f9ff", border: "1px solid #bae6fd", padding: "2px 7px", borderRadius: "6px", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                              <LogIn size={11} />
                              <span>{t.loginCount ?? 1}</span>
                            </span>
                          </td>

                          {/* Average Session Length */}
                          <td style={{ padding: "12px" }}>
                            <div style={{ fontWeight: 700, color: "#0f172a", fontSize: "12px" }} title={`Total cumulative time: ${totalTimeStr}`}>
                              {avgStr}
                            </div>
                            <div style={{ fontSize: "10px", color: "#94a3b8" }}>{totalTimeStr} total</div>
                          </td>

                          {/* Last Login / Active */}
                          <td style={{ padding: "12px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }} title={rel.full}>
                              <span
                                style={{
                                  width: "7px",
                                  height: "7px",
                                  borderRadius: "50%",
                                  background: rel.isRecent ? "#16a34a" : "#94a3b8",
                                  display: "inline-block",
                                  flexShrink: 0,
                                }}
                              />
                              <span style={{ fontWeight: 600, color: rel.isRecent ? "#16a34a" : "#0f172a", fontSize: "12px" }}>
                                {rel.text}
                              </span>
                            </div>
                            <div style={{ fontSize: "10px", color: "#94a3b8", marginTop: "2px" }}>
                              {t.lastActiveAt ? new Date(t.lastActiveAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : "-"}
                            </div>
                          </td>

                          {/* App Session Duration */}
                          <td style={{ padding: "12px" }}>
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                                fontSize: "11px",
                                fontWeight: 700,
                                background: (t.lastSessionDurationSeconds || 0) >= 300 ? "#f0fdf4" : "#f1f5f9",
                                color: (t.lastSessionDurationSeconds || 0) >= 300 ? "#166534" : "#475569",
                                border: `1px solid ${(t.lastSessionDurationSeconds || 0) >= 300 ? "#bbf7d0" : "#e2e8f0"}`,
                                padding: "2px 7px",
                                borderRadius: "6px",
                              }}
                              title={`Exact logged duration: ${t.lastSessionDurationSeconds || 0} seconds`}
                            >
                              <Timer size={12} />
                              <span>{durationStr}</span>
                            </span>
                          </td>

                          <td style={{ padding: "12px" }}>
                            {t.computedStatus === "active" ? (
                              <span style={{ fontSize: "11px", fontWeight: 700, color: "#16a34a", background: "#f0fdf4", padding: "3px 8px", borderRadius: "6px", border: "1px solid #bbf7d0" }}>
                                ✓ Active Paid
                              </span>
                            ) : t.computedStatus === "trial" ? (
                              <span style={{ fontSize: "11px", fontWeight: 700, color: "#d97706", background: "#fffbe3", padding: "3px 8px", borderRadius: "6px", border: "1px solid #fef08a" }}>
                                ⏱ Trialing
                              </span>
                            ) : (
                              <span style={{ fontSize: "11px", fontWeight: 700, color: "#dc2626", background: "#fef2f2", padding: "3px 8px", borderRadius: "6px", border: "1px solid #fecaca" }}>
                                🔒 Expired
                              </span>
                            )}
                          </td>

                          <td style={{ padding: "12px", color: "#64748b", fontSize: "12px" }}>
                            {new Date(t.createdAt).toLocaleDateString()}
                          </td>

                          <td style={{ padding: "12px", textAlign: "right" }}>
                            <div style={{ display: "flex", justifyContent: "flex-end", gap: "6px" }}>
                              <button
                                onClick={() => handleUpdateUser(t.id, { extendTrialDays: 14 })}
                                disabled={actionUserId === t.id}
                                style={{ fontSize: "11px", padding: "4px 8px", background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: "6px", cursor: "pointer", fontWeight: 600 }}
                                title="Add +14 days to trial"
                              >
                                +14D Trial
                              </button>

                              <button
                                onClick={() => handleUpdateUser(t.id, { grantSubscriptionDays: 365 })}
                                disabled={actionUserId === t.id}
                                style={{ fontSize: "11px", padding: "4px 8px", background: "#16a34a", color: "#ffffff", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: 700 }}
                                title="Grant 1 Year Active Subscription"
                              >
                                Grant 1Yr
                              </button>

                              {!t.isAdmin && (
                                <button
                                  onClick={() => handleDeleteUser(t.id, t.name || t.email)}
                                  disabled={actionUserId === t.id}
                                  style={{ fontSize: "11px", padding: "4px 8px", background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca", borderRadius: "6px", cursor: "pointer", fontWeight: 700 }}
                                  title="Delete Trainer Account"
                                >
                                  <Trash2 size={12} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 2: CLIENTS TABLE                                      */}
          {/* ========================================================= */}
          {activeTab === "clients" && (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid #e2e8f0", color: "#475569", fontSize: "11px", textTransform: "uppercase" }}>
                    <th style={{ padding: "10px 12px" }}>Client / Athlete</th>
                    <th style={{ padding: "10px 12px" }}>Assigned Coach</th>
                    <th style={{ padding: "10px 12px" }}>Workouts Logged</th>
                    <th style={{ padding: "10px 12px" }}>Logins</th>
                    <th style={{ padding: "10px 12px" }}>Avg Session</th>
                    <th style={{ padding: "10px 12px" }}>Last Active</th>
                    <th style={{ padding: "10px 12px" }}>Last Session</th>
                    <th style={{ padding: "10px 12px" }}>Access Tier</th>
                    <th style={{ padding: "10px 12px" }}>Account Created</th>
                    <th style={{ padding: "10px 12px", textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredClients.length === 0 ? (
                    <tr>
                      <td colSpan={10} style={{ textAlign: "center", padding: "24px", color: "#64748b" }}>
                        No clients found matching search.
                      </td>
                    </tr>
                  ) : (
                    filteredClients.map((c) => {
                      const rel = formatRelativeTime(c.lastActiveAt || c.lastLoginAt, c.lastSessionDurationSeconds);
                      const durationStr = formatSessionDuration(c.lastSessionDurationSeconds);
                      const avgStr = formatSessionDuration(c.avgSessionDurationSeconds);
                      const totalTimeStr = formatTotalAppTime(c.totalSessionSeconds);

                      return (
                        <tr key={c.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                          <td style={{ padding: "12px" }}>
                            <div style={{ fontWeight: 700, color: "#0f172a" }}>
                              {c.name}
                            </div>
                            <div style={{ fontSize: "11px", color: "#64748b" }}>{c.email}</div>
                            {c.phone && <div style={{ fontSize: "10px", color: "#94a3b8" }}>{c.phone}</div>}
                          </td>

                          <td style={{ padding: "12px" }}>
                            <span style={{ fontSize: "12px", fontWeight: 600, color: "#2563eb", background: "#eff6ff", border: "1px solid #bfdbfe", padding: "2px 8px", borderRadius: "6px" }}>
                              🏋️ {c.trainerName}
                            </span>
                          </td>

                          <td style={{ padding: "12px" }}>
                            <span style={{ fontWeight: 800, color: "#0f172a", fontSize: "14px" }}>
                              {c.workoutsLogged}
                            </span>{" "}
                            <span style={{ fontSize: "11px", color: "#64748b" }}>workouts</span>
                          </td>

                          {/* Number of Logins */}
                          <td style={{ padding: "12px" }}>
                            <span style={{ fontSize: "11px", fontWeight: 700, color: "#0284c7", background: "#f0f9ff", border: "1px solid #bae6fd", padding: "2px 7px", borderRadius: "6px", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                              <LogIn size={11} />
                              <span>{c.loginCount ?? 1}</span>
                            </span>
                          </td>

                          {/* Average Session Length */}
                          <td style={{ padding: "12px" }}>
                            <div style={{ fontWeight: 700, color: "#0f172a", fontSize: "12px" }} title={`Total cumulative time: ${totalTimeStr}`}>
                              {avgStr}
                            </div>
                            <div style={{ fontSize: "10px", color: "#94a3b8" }}>{totalTimeStr} total</div>
                          </td>

                          {/* Last Login / Active */}
                          <td style={{ padding: "12px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }} title={rel.full}>
                              <span
                                style={{
                                  width: "7px",
                                  height: "7px",
                                  borderRadius: "50%",
                                  background: rel.isRecent ? "#16a34a" : "#94a3b8",
                                  display: "inline-block",
                                  flexShrink: 0,
                                }}
                              />
                              <span style={{ fontWeight: 600, color: rel.isRecent ? "#16a34a" : "#0f172a", fontSize: "12px" }}>
                                {rel.text}
                              </span>
                            </div>
                            <div style={{ fontSize: "10px", color: "#94a3b8", marginTop: "2px" }}>
                              {c.lastActiveAt ? new Date(c.lastActiveAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : "-"}
                            </div>
                          </td>

                          {/* App Session Duration */}
                          <td style={{ padding: "12px" }}>
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                                fontSize: "11px",
                                fontWeight: 700,
                                background: (c.lastSessionDurationSeconds || 0) >= 300 ? "#f0fdf4" : "#f1f5f9",
                                color: (c.lastSessionDurationSeconds || 0) >= 300 ? "#166534" : "#475569",
                                border: `1px solid ${(c.lastSessionDurationSeconds || 0) >= 300 ? "#bbf7d0" : "#e2e8f0"}`,
                                padding: "2px 7px",
                                borderRadius: "6px",
                              }}
                              title={`Exact logged duration: ${c.lastSessionDurationSeconds || 0} seconds`}
                            >
                              <Timer size={12} />
                              <span>{durationStr}</span>
                            </span>
                          </td>

                          <td style={{ padding: "12px" }}>
                            <span style={{ fontSize: "11px", fontWeight: 700, color: "#0284c7", background: "#f0f9ff", padding: "3px 9px", borderRadius: "6px", border: "1px solid #bae6fd", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                              <span>✓</span> Free Athlete Access
                            </span>
                          </td>

                          <td style={{ padding: "12px", color: "#64748b", fontSize: "12px" }}>
                            {new Date(c.createdAt).toLocaleDateString()}
                          </td>

                          <td style={{ padding: "12px", textAlign: "right" }}>
                            <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: "6px" }}>
                              <span style={{ fontSize: "11px", fontWeight: 600, color: c.isRegistered ? "#16a34a" : "#64748b", background: c.isRegistered ? "#f0fdf4" : "#f1f5f9", padding: "3px 8px", borderRadius: "6px" }}>
                                {c.isRegistered ? "✓ Registered" : "Invited"}
                              </span>

                              <button
                                onClick={() => handleDeleteUser(c.id, c.name)}
                                disabled={actionUserId === c.id}
                                style={{ fontSize: "11px", padding: "4px 8px", background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca", borderRadius: "6px", cursor: "pointer", fontWeight: 700 }}
                                title="Delete Client Profile"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}