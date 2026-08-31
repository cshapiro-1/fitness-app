"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  ShieldCheck, Users, TrendingUp, DollarSign, Clock, Zap, Search, RefreshCw,
  Award, CheckCircle2, UserCheck, Lock, Edit3, ArrowLeft, Dumbbell, Activity,
  Briefcase, User, Timer, Calendar, LogIn, Trash2, Hourglass, Sparkles, Filter,
  Eye, EyeOff, ShieldAlert, Cpu, HeartPulse, ChevronLeft, ChevronRight, Check,
  AlertCircle, RotateCcw, Image, Save, ExternalLink, Wand2
} from "lucide-react";
import Link from "next/link";

interface AdminTrainer {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  role: "TRAINER" | "CLIENT" | "ADMIN";
  isAdmin: boolean;
  isInternalAdmin?: boolean;
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
  isInternalAdmin?: boolean;
  lastLoginAt?: string | null;
  lastActiveAt?: string | null;
  lastSessionDurationSeconds?: number | null;
  loginCount?: number;
  totalSessionSeconds?: number;
  avgSessionDurationSeconds?: number;
}

interface UnifiedAnatomyExercise {
  id: string;
  name: string;
  normalizedName: string;
  type: "EXERCISE" | "STRETCH" | "MOBILITY" | "CARDIO" | "WELLNESS";
  muscleGroup: string;
  equipment: string;
  category: string;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  biomechanicsCue: string;
  steps: string[];
  commonMistakes: string[];
  breathingPattern: string;
  diagramUrl: string;
  diagramStatus: "APPROVED" | "PENDING_APPROVAL" | "REJECTED" | "NEEDS_REVISION";
  diagramNotes?: string;
  approvedByUserId?: string | null;
  approvedAt?: string | null;
  isCustom?: boolean;
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

  // Platform-wide combined metrics
  totalLogins?: number;
  overallAvgSessionSeconds?: number;
  totalAppTimeSeconds?: number;

  // Organic Customer Metrics (Excluding Admin Dev Usage)
  organicTrainersCount?: number;
  organicClientsCount?: number;
  organicTotalLogins?: number;
  organicAvgSessionSeconds?: number;
  organicTotalAppTimeSeconds?: number;
  organicDau?: number;
  organicMau?: number;
  organicStickinessRatio?: number;

  // Internal Admin & Developer Metrics (Collin's Isolated Usage)
  adminTotalLogins?: number;
  adminAvgSessionSeconds?: number;
  adminTotalAppTimeSeconds?: number;
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

type TelemetryViewMode = "ORGANIC" | "ALL" | "ADMIN_ONLY";

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

  // Tab State with LocalStorage & URL Persistence to avoid accidental tab drop / redirection
  const [activeTab, setActiveTab] = useState<"trainers" | "clients" | "anatomy">(() => {
    if (typeof window !== "undefined") {
      const urlTab = new URLSearchParams(window.location.search).get("tab");
      if (urlTab === "trainers" || urlTab === "clients" || urlTab === "anatomy") return urlTab;
      const saved = localStorage.getItem("fitcoach_admin_active_tab");
      if (saved === "trainers" || saved === "clients" || saved === "anatomy") return saved as any;
    }
    return "trainers";
  });

  const handleTabChange = (tab: "trainers" | "clients" | "anatomy") => {
    setActiveTab(tab);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("fitcoach_admin_active_tab", tab);
        const url = new URL(window.location.href);
        url.searchParams.set("tab", tab);
        window.history.replaceState({}, "", url.toString());
      } catch {}
    }
  };

  const [telemetryMode, setTelemetryMode] = useState<TelemetryViewMode>("ORGANIC");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [excludeAdminAccounts, setExcludeAdminAccounts] = useState(true);
  const [actionUserId, setActionUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // ==========================================
  // Anatomy Studio & Review Queue State
  // ==========================================
  const [anatomyExercises, setAnatomyExercises] = useState<UnifiedAnatomyExercise[]>([]);
  const [anatomySummary, setAnatomySummary] = useState<any | null>(null);
  const [selectedAnatomyIndex, setSelectedAnatomyIndex] = useState(0);
  const [anatomyFilterType, setAnatomyFilterType] = useState<"ALL" | "EXERCISE" | "STRETCH" | "PENDING" | "APPROVED">("ALL");
  const [anatomySearch, setAnatomySearch] = useState("");
  const [savingAnatomyId, setSavingAnatomyId] = useState<string | null>(null);
  const [isRegeneratingDiagram, setIsRegeneratingDiagram] = useState(false);
  const [variantMap, setVariantMap] = useState<Record<string, number>>({});

  const [editedCue, setEditedCue] = useState("");
  const [editedDiagramUrl, setEditedDiagramUrl] = useState("");
  const [editedPrimaryMuscles, setEditedPrimaryMuscles] = useState("");
  const [editedSecondaryMuscles, setEditedSecondaryMuscles] = useState("");

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

  const fetchAnatomyData = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/anatomy");
      if (res.ok) {
        const data = await res.json();
        setAnatomyExercises(data.exercises || []);
        setAnatomySummary(data.summary || null);
      }
    } catch {
      console.error("Failed to load anatomy data");
    }
  }, []);

  useEffect(() => {
    fetchAdminData();
    fetchAnatomyData();
  }, [fetchAdminData, fetchAnatomyData]);

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

  // Anatomy Filtered List
  const filteredAnatomyList = useMemo(() => {
    return anatomyExercises.filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(anatomySearch.toLowerCase()) ||
        item.muscleGroup.toLowerCase().includes(anatomySearch.toLowerCase());

      if (!matchesSearch) return false;

      if (anatomyFilterType === "EXERCISE") return item.type === "EXERCISE";
      if (anatomyFilterType === "STRETCH") return item.type === "STRETCH" || item.type === "MOBILITY";
      if (anatomyFilterType === "PENDING") return item.diagramStatus === "PENDING_APPROVAL" || !item.diagramStatus;
      if (anatomyFilterType === "APPROVED") return item.diagramStatus === "APPROVED";
      return true;
    });
  }, [anatomyExercises, anatomySearch, anatomyFilterType]);

  const activeAnatomyItem = filteredAnatomyList[selectedAnatomyIndex] || filteredAnatomyList[0] || null;

  // Sync edit state when active item changes
  useEffect(() => {
    if (activeAnatomyItem) {
      setEditedCue(activeAnatomyItem.biomechanicsCue || "");
      setEditedDiagramUrl(activeAnatomyItem.diagramUrl || "");
      setEditedPrimaryMuscles((activeAnatomyItem.primaryMuscles || []).join(", "));
      setEditedSecondaryMuscles((activeAnatomyItem.secondaryMuscles || []).join(", "));
    }
  }, [activeAnatomyItem]);

  const handleApproveAnatomy = async (item: UnifiedAnatomyExercise) => {
    setSavingAnatomyId(item.id || item.name);
    try {
      // Optimistically mark as approved in UI
      setAnatomyExercises((prev) =>
        prev.map((ex) =>
          ex.name === item.name || ex.id === item.id
            ? {
                ...ex,
                diagramStatus: "APPROVED",
                diagramUrl: editedDiagramUrl || item.diagramUrl,
                biomechanicsCue: editedCue || item.biomechanicsCue,
                primaryMuscles: (editedPrimaryMuscles || "").split(",").map((s) => s.trim()).filter(Boolean),
                secondaryMuscles: (editedSecondaryMuscles || "").split(",").map((s) => s.trim()).filter(Boolean),
                approvedAt: new Date().toISOString(),
              }
            : ex
        )
      );

      const res = await fetch("/api/admin/anatomy", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: item.id,
          name: item.name,
          diagramStatus: "APPROVED",
          diagramUrl: editedDiagramUrl || item.diagramUrl,
          biomechanicsCue: editedCue || item.biomechanicsCue,
          primaryMuscles: (editedPrimaryMuscles || "").split(",").map((s) => s.trim()).filter(Boolean),
          secondaryMuscles: (editedSecondaryMuscles || "").split(",").map((s) => s.trim()).filter(Boolean),
        }),
      });

      if (res.ok) {
        await fetchAnatomyData();
        // Advance smoothly to next item
        setSelectedAnatomyIndex((prev) => Math.min(prev, Math.max(0, filteredAnatomyList.length - 2)));
      } else {
        const errJson = await res.json().catch(() => ({ error: "Failed to approve anatomy diagram" }));
        alert(errJson.error || "Failed to approve anatomy diagram");
        await fetchAnatomyData();
      }
    } catch (err: any) {
      alert(err?.message || "Failed to approve anatomy diagram");
      await fetchAnatomyData();
    } finally {
      setSavingAnatomyId(null);
    }
  };

  const handleRegenerateDiagram = async (item: UnifiedAnatomyExercise) => {
    setIsRegeneratingDiagram(true);
    try {
      const currentVariant = variantMap[item.name] || 0;
      const nextVariant = currentVariant + 1;
      setVariantMap((prev) => ({ ...prev, [item.name]: nextVariant }));

      const res = await fetch("/api/admin/anatomy/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: item.name,
          muscleGroup: item.muscleGroup,
          equipment: item.equipment,
          type: item.type,
          variant: nextVariant,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        if (json.data?.diagramUrl) {
          setEditedDiagramUrl(json.data.diagramUrl);
          setAnatomyExercises((prev) =>
            prev.map((ex) =>
              ex.name === item.name || ex.id === item.id
                ? { ...ex, diagramUrl: json.data.diagramUrl }
                : ex
            )
          );
          // Persist the regenerated URL to DB
          await fetch("/api/admin/anatomy", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id: item.id,
              name: item.name,
              diagramUrl: json.data.diagramUrl,
            }),
          });
        }
      }
    } catch (err) {
      console.error("Failed to regenerate diagram:", err);
    } finally {
      setIsRegeneratingDiagram(false);
    }
  };

  const handleRevertAnatomyToPending = async (item: UnifiedAnatomyExercise) => {
    setSavingAnatomyId(item.id || item.name);
    try {
      // Optimistically mark as pending in UI
      setAnatomyExercises((prev) =>
        prev.map((ex) =>
          ex.name === item.name || ex.id === item.id
            ? { ...ex, diagramStatus: "PENDING_APPROVAL", approvedAt: null, approvedByUserId: null }
            : ex
        )
      );

      const res = await fetch("/api/admin/anatomy", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: item.id,
          name: item.name,
          diagramStatus: "PENDING_APPROVAL",
        }),
      });

      if (res.ok) {
        await fetchAnatomyData();
      }
    } catch {
      alert("Failed to revert status");
    } finally {
      setSavingAnatomyId(null);
    }
  };

  const handleSyncFullLibrary = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/anatomy?resync=true");
      if (res.ok) {
        const data = await res.json();
        setAnatomyExercises(data.exercises || []);
        setAnatomySummary(data.summary || null);
        alert(`Successfully synced ${data.exercises?.length || 0} exercises and stretches!`);
      }
    } catch {
      alert("Failed to sync library");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAnatomyEdits = async (item: UnifiedAnatomyExercise) => {
    setSavingAnatomyId(item.id || item.name);
    try {
      const res = await fetch("/api/admin/anatomy", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: item.id,
          name: item.name,
          diagramUrl: editedDiagramUrl,
          biomechanicsCue: editedCue,
          primaryMuscles: (editedPrimaryMuscles || "").split(",").map((s) => s.trim()).filter(Boolean),
          secondaryMuscles: (editedSecondaryMuscles || "").split(",").map((s) => s.trim()).filter(Boolean),
        }),
      });
      if (res.ok) {
        await fetchAnatomyData();
      } else {
        const err = await res.json().catch(() => ({ error: "Failed to save edits" }));
        alert(err.error || "Failed to save edits");
      }
    } catch (err: any) {
      alert(err?.message || "Failed to save edits");
    } finally {
      setSavingAnatomyId(null);
    }
  };

  const filteredTrainers = useMemo(() => {
    return trainers.filter((t) => {
      if (excludeAdminAccounts && t.isInternalAdmin) return false;

      const query = searchQuery.toLowerCase();
      const nameMatch = t.name?.toLowerCase().includes(query) || false;
      const emailMatch = t.email.toLowerCase().includes(query);
      const matchesSearch = nameMatch || emailMatch;

      const matchesStatus = statusFilter === "ALL" || t.computedStatus === statusFilter.toLowerCase();
      return matchesSearch && matchesStatus;
    });
  }, [trainers, searchQuery, statusFilter, excludeAdminAccounts]);

  const filteredClients = useMemo(() => {
    return clients.filter((c) => {
      if (excludeAdminAccounts && c.isInternalAdmin) return false;

      const query = searchQuery.toLowerCase();
      const nameMatch = c.name.toLowerCase().includes(query);
      const emailMatch = c.email.toLowerCase().includes(query);
      const trainerMatch = c.trainerName.toLowerCase().includes(query);
      return nameMatch || emailMatch || trainerMatch;
    });
  }, [clients, searchQuery, excludeAdminAccounts]);

  // Display values based on selected telemetry view mode
  const currentAvgSession =
    telemetryMode === "ORGANIC"
      ? stats?.organicAvgSessionSeconds ?? 0
      : telemetryMode === "ADMIN_ONLY"
      ? stats?.adminAvgSessionSeconds ?? 0
      : stats?.overallAvgSessionSeconds ?? 0;

  const currentTotalLogins =
    telemetryMode === "ORGANIC"
      ? stats?.organicTotalLogins ?? 0
      : telemetryMode === "ADMIN_ONLY"
      ? stats?.adminTotalLogins ?? 0
      : stats?.totalLogins ?? 0;

  const currentTotalAppTime =
    telemetryMode === "ORGANIC"
      ? stats?.organicTotalAppTimeSeconds ?? 0
      : telemetryMode === "ADMIN_ONLY"
      ? stats?.adminTotalAppTimeSeconds ?? 0
      : stats?.totalAppTimeSeconds ?? 0;

  const currentDau =
    telemetryMode === "ORGANIC"
      ? stats?.organicDau ?? 0
      : stats?.dau ?? 1;

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      {/* Top Admin Header */}
      <header style={{ background: "#0f172a", color: "#ffffff", padding: "16px 24px", borderBottom: "1px solid #1e293b" }}>
        <div style={{ maxWidth: "1280px", margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <ShieldCheck size={24} style={{ color: "#38bdf8" }} />
            <div>
              <h1 style={{ margin: 0, fontSize: "18px", fontWeight: 700 }}>STRKYR Master Admin Portal</h1>
              <div style={{ fontSize: "12px", color: "#94a3b8" }}>Master Operations, User Telemetry &amp; Anatomy Diagram Studio</div>
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
              type="button"
              onClick={fetchAdminData}
              style={{ background: "#dc2626", color: "#ffffff", border: "none", padding: "6px 12px", borderRadius: "6px", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}
            >
              Retry
            </button>
          </div>
        )}

        {/* Telemetry Segment Selector Banner */}
        <div style={{ background: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "14px 18px", marginBottom: "18px", display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Filter size={16} style={{ color: "#2563eb" }} />
            <div>
              <span style={{ fontSize: "13px", fontWeight: 700, color: "#0f172a" }}>Telemetry View Mode:</span>
              <span style={{ fontSize: "12px", color: "#64748b", marginLeft: "6px" }}>
                {telemetryMode === "ORGANIC"
                  ? "🌱 Pure Customer Analytics (Excludes Collin's dev/admin usage)"
                  : telemetryMode === "ADMIN_ONLY"
                  ? "👑 Collin's Dev & Admin Telemetry Only"
                  : "⚡ All Platform Usage Combined"}
              </span>
            </div>
          </div>

          <div style={{ display: "flex", background: "#f1f5f9", borderRadius: "8px", padding: "3px", gap: "4px" }}>
            <button
              type="button"
              onClick={() => setTelemetryMode("ORGANIC")}
              style={{
                padding: "6px 12px",
                fontSize: "12px",
                fontWeight: 700,
                borderRadius: "6px",
                border: "none",
                cursor: "pointer",
                background: telemetryMode === "ORGANIC" ? "#16a34a" : "transparent",
                color: telemetryMode === "ORGANIC" ? "#ffffff" : "#475569",
                transition: "all 0.15s ease",
              }}
            >
              🌱 Organic Customers
            </button>
            <button
              type="button"
              onClick={() => setTelemetryMode("ALL")}
              style={{
                padding: "6px 12px",
                fontSize: "12px",
                fontWeight: 700,
                borderRadius: "6px",
                border: "none",
                cursor: "pointer",
                background: telemetryMode === "ALL" ? "#2563eb" : "transparent",
                color: telemetryMode === "ALL" ? "#ffffff" : "#475569",
                transition: "all 0.15s ease",
              }}
            >
              ⚡ All Combined
            </button>
            <button
              type="button"
              onClick={() => setTelemetryMode("ADMIN_ONLY")}
              style={{
                padding: "6px 12px",
                fontSize: "12px",
                fontWeight: 700,
                borderRadius: "6px",
                border: "none",
                cursor: "pointer",
                background: telemetryMode === "ADMIN_ONLY" ? "#9333ea" : "transparent",
                color: telemetryMode === "ADMIN_ONLY" ? "#ffffff" : "#475569",
                transition: "all 0.15s ease",
              }}
            >
              👑 Collin (Dev)
            </button>
          </div>
        </div>

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
              <span>{telemetryMode === "ORGANIC" ? "ORGANIC COACHES" : "TOTAL COACHES"}</span>
              <Briefcase size={16} style={{ color: "#2563eb" }} />
            </div>
            <div style={{ fontSize: "26px", fontWeight: 800, color: "#0f172a", marginTop: "4px" }}>
              {telemetryMode === "ORGANIC" ? stats?.organicTrainersCount ?? 0 : trainers.length || stats?.totalTrainers || 0}
            </div>
            <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>
              {stats?.trialingUsers ?? 0} trialing · {stats?.expiredUsers ?? 0} expired
            </div>
          </div>

          {/* Total Managed Athletes / Clients */}
          <div style={{ background: "#ffffff", padding: "16px", borderRadius: "12px", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", color: "#64748b", fontSize: "11px", fontWeight: 700, textTransform: "uppercase" }}>
              <span>{telemetryMode === "ORGANIC" ? "ORGANIC ATHLETES" : "TOTAL CLIENTS"}</span>
              <Users size={16} style={{ color: "#7c3aed" }} />
            </div>
            <div style={{ fontSize: "26px", fontWeight: 800, color: "#0f172a", marginTop: "4px" }}>
              {telemetryMode === "ORGANIC" ? stats?.organicClientsCount ?? 0 : clients.length || stats?.totalClients || 0}
            </div>
            <div style={{ fontSize: "11px", color: "#7c3aed", marginTop: "2px", fontWeight: 600 }}>
              {stats?.avgClientsPerTrainer ?? 0} clients / coach
            </div>
          </div>

          {/* Average App Session Length */}
          <div style={{ background: "#ffffff", padding: "16px", borderRadius: "12px", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", color: "#64748b", fontSize: "11px", fontWeight: 700, textTransform: "uppercase" }}>
              <span>{telemetryMode === "ORGANIC" ? "ORGANIC AVG SESSION" : telemetryMode === "ADMIN_ONLY" ? "COLLIN AVG SESSION" : "COMBINED AVG SESSION"}</span>
              <Hourglass size={16} style={{ color: "#059669" }} />
            </div>
            <div style={{ fontSize: "26px", fontWeight: 800, color: "#0f172a", marginTop: "4px" }}>
              {formatSessionDuration(currentAvgSession)}
            </div>
            <div style={{ fontSize: "11px", color: "#059669", marginTop: "2px", fontWeight: 600 }}>
              {formatTotalAppTime(currentTotalAppTime)} total time
            </div>
          </div>

          {/* Total App Logins */}
          <div style={{ background: "#ffffff", padding: "16px", borderRadius: "12px", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", color: "#64748b", fontSize: "11px", fontWeight: 700, textTransform: "uppercase" }}>
              <span>{telemetryMode === "ORGANIC" ? "ORGANIC LOGINS" : telemetryMode === "ADMIN_ONLY" ? "COLLIN LOGINS" : "TOTAL LOGINS"}</span>
              <LogIn size={16} style={{ color: "#0284c7" }} />
            </div>
            <div style={{ fontSize: "26px", fontWeight: 800, color: "#0f172a", marginTop: "4px" }}>
              {currentTotalLogins}
            </div>
            <div style={{ fontSize: "11px", color: "#0284c7", marginTop: "2px", fontWeight: 600 }}>
              {currentDau} DAU
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* TAB CONTROLS: TRAINERS vs CLIENTS vs ANATOMY STUDIO       */}
        {/* ========================================================= */}
        <div style={{ background: "#ffffff", padding: "20px", borderRadius: "12px", border: "1px solid #e2e8f0", marginBottom: "24px" }}>
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "12px", marginBottom: "16px", borderBottom: "1px solid #e2e8f0", paddingBottom: "12px" }}>
            <div style={{ display: "flex", background: "#f1f5f9", borderRadius: "10px", padding: "3px", gap: "4px" }}>
              <button
                type="button"
                onClick={() => handleTabChange("trainers")}
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
                <span>Trainers &amp; Coaches ({filteredTrainers.length})</span>
              </button>

              <button
                type="button"
                onClick={() => handleTabChange("clients")}
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
                <span>Clients &amp; Athletes ({filteredClients.length})</span>
              </button>

              <button
                type="button"
                onClick={() => handleTabChange("anatomy")}
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
                  background: activeTab === "anatomy" ? "#7c3aed" : "transparent",
                  color: activeTab === "anatomy" ? "#ffffff" : "#475569",
                  boxShadow: activeTab === "anatomy" ? "0 1px 3px rgba(124,58,237,0.2)" : "none",
                  transition: "all 0.15s ease",
                }}
              >
                <HeartPulse size={15} />
                <span>Anatomy Diagram Studio &amp; Approval ({anatomySummary?.approvedCount ?? 0}/{anatomySummary?.totalCount ?? anatomyExercises.length})</span>
              </button>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              {activeTab !== "anatomy" && (
                <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", fontWeight: 600, color: "#475569", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={excludeAdminAccounts}
                    onChange={(e) => setExcludeAdminAccounts(e.target.checked)}
                    style={{ accentColor: "#2563eb", cursor: "pointer" }}
                  />
                  <span>Exclude Admin Accounts</span>
                </label>
              )}

              <button
                type="button"
                onClick={() => {
                  fetchAdminData();
                  fetchAnatomyData();
                }}
                style={{ display: "flex", alignItems: "center", gap: "6px", padding: "6px 12px", fontSize: "12px", background: "#f1f5f9", border: "1px solid #cbd5e1", borderRadius: "6px", cursor: "pointer", fontWeight: 600 }}
              >
                <RefreshCw size={13} className={loading ? "spin" : ""} /> Refresh
              </button>
            </div>
          </div>

          {/* ========================================================= */}
          {/* TAB 1: TRAINERS TABLE                                     */}
          {/* ========================================================= */}
          {activeTab === "trainers" && (
            <div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginBottom: "16px" }}>
                <div style={{ position: "relative", flex: "1 1 240px" }}>
                  <Search size={14} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
                  <input
                    className="input"
                    placeholder="Search trainer name or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{ paddingLeft: "30px", width: "100%", fontSize: "12px" }}
                  />
                </div>
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
              </div>

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
                              <div style={{ fontWeight: 700, color: "#0f172a", display: "flex", alignItems: "center", gap: "6px" }}>
                                <span>{t.name || "Unnamed Trainer"}</span>
                                {t.isInternalAdmin && (
                                  <span style={{ fontSize: "10px", background: "#fef3c7", color: "#92400e", padding: "1px 6px", borderRadius: "4px", fontWeight: 700 }}>
                                    👑 DEV / ADMIN
                                  </span>
                                )}
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
                              <span style={{ fontWeight: 800, color: "#0f172a" }}>{t.workoutsLoggedForClients}</span>{" "}
                              <span style={{ fontSize: "11px", color: "#64748b" }}>workouts</span>
                            </td>

                            <td style={{ padding: "12px" }}>
                              <span style={{ fontSize: "11px", fontWeight: 700, color: "#0284c7", background: "#f0f9ff", border: "1px solid #bae6fd", padding: "2px 7px", borderRadius: "6px", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                                <LogIn size={11} />
                                <span>{t.loginCount ?? 1}</span>
                              </span>
                            </td>

                            <td style={{ padding: "12px" }}>
                              <div style={{ fontWeight: 700, color: "#0f172a", fontSize: "12px" }} title={`Total cumulative time: ${totalTimeStr}`}>
                                {avgStr}
                              </div>
                              <div style={{ fontSize: "10px", color: "#94a3b8" }}>{totalTimeStr} total</div>
                            </td>

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
                            </td>

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
                                  type="button"
                                  onClick={() => handleUpdateUser(t.id, { extendTrialDays: 14 })}
                                  disabled={actionUserId === t.id}
                                  style={{ fontSize: "11px", padding: "4px 8px", background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: "6px", cursor: "pointer", fontWeight: 600 }}
                                  title="Add +14 days to trial"
                                >
                                  +14D Trial
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleUpdateUser(t.id, { grantSubscriptionDays: 365 })}
                                  disabled={actionUserId === t.id}
                                  style={{ fontSize: "11px", padding: "4px 8px", background: "#16a34a", color: "#ffffff", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: 700 }}
                                  title="Grant 1 Year Active Subscription"
                                >
                                  Grant 1Yr
                                </button>
                                {!t.isAdmin && (
                                  <button
                                    type="button"
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
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 2: CLIENTS TABLE                                      */}
          {/* ========================================================= */}
          {activeTab === "clients" && (
            <div>
              <div style={{ position: "relative", marginBottom: "16px" }}>
                <Search size={14} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
                <input
                  className="input"
                  placeholder="Search client or coach name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ paddingLeft: "30px", width: "100%", fontSize: "12px" }}
                />
              </div>

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
                              <div style={{ fontWeight: 700, color: "#0f172a", display: "flex", alignItems: "center", gap: "6px" }}>
                                <span>{c.name}</span>
                                {c.isInternalAdmin && (
                                  <span style={{ fontSize: "10px", background: "#fef3c7", color: "#92400e", padding: "1px 6px", borderRadius: "4px", fontWeight: 700 }}>
                                    👑 DEV / ADMIN
                                  </span>
                                )}
                              </div>
                              <div style={{ fontSize: "11px", color: "#64748b" }}>{c.email}</div>
                            </td>

                            <td style={{ padding: "12px" }}>
                              <span style={{ fontSize: "12px", fontWeight: 600, color: "#2563eb", background: "#eff6ff", border: "1px solid #bfdbfe", padding: "2px 8px", borderRadius: "6px" }}>
                                🏋️ {c.trainerName}
                              </span>
                            </td>

                            <td style={{ padding: "12px" }}>
                              <span style={{ fontWeight: 800, color: "#0f172a", fontSize: "14px" }}>{c.workoutsLogged}</span>{" "}
                              <span style={{ fontSize: "11px", color: "#64748b" }}>workouts</span>
                            </td>

                            <td style={{ padding: "12px" }}>
                              <span style={{ fontSize: "11px", fontWeight: 700, color: "#0284c7", background: "#f0f9ff", border: "1px solid #bae6fd", padding: "2px 7px", borderRadius: "6px", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                                <LogIn size={11} />
                                <span>{c.loginCount ?? 1}</span>
                              </span>
                            </td>

                            <td style={{ padding: "12px" }}>
                              <div style={{ fontWeight: 700, color: "#0f172a", fontSize: "12px" }}>{avgStr}</div>
                              <div style={{ fontSize: "10px", color: "#94a3b8" }}>{totalTimeStr} total</div>
                            </td>

                            <td style={{ padding: "12px" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: rel.isRecent ? "#16a34a" : "#94a3b8" }} />
                                <span style={{ fontWeight: 600, color: rel.isRecent ? "#16a34a" : "#0f172a", fontSize: "12px" }}>{rel.text}</span>
                              </div>
                            </td>

                            <td style={{ padding: "12px" }}>
                              <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "11px", fontWeight: 700, background: "#f1f5f9", padding: "2px 7px", borderRadius: "6px" }}>
                                <Timer size={12} />
                                <span>{durationStr}</span>
                              </span>
                            </td>

                            <td style={{ padding: "12px" }}>
                              <span style={{ fontSize: "11px", fontWeight: 700, color: "#0284c7", background: "#f0f9ff", padding: "3px 9px", borderRadius: "6px", border: "1px solid #bae6fd" }}>
                                ✓ Free Athlete Access
                              </span>
                            </td>

                            <td style={{ padding: "12px", color: "#64748b", fontSize: "12px" }}>
                              {new Date(c.createdAt).toLocaleDateString()}
                            </td>

                            <td style={{ padding: "12px", textAlign: "right" }}>
                              <button
                                type="button"
                                onClick={() => handleDeleteUser(c.id, c.name)}
                                disabled={actionUserId === c.id}
                                style={{ fontSize: "11px", padding: "4px 8px", background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca", borderRadius: "6px", cursor: "pointer", fontWeight: 700 }}
                              >
                                <Trash2 size={12} />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 3: ANATOMY DIAGRAM STUDIO & 1-BY-1 APPROVAL           */}
          {/* ========================================================= */}
          {activeTab === "anatomy" && (
            <div>
              {/* Studio Progress Banner */}
              <div style={{ background: "#f5f3ff", border: "1px solid #ddd6fe", borderRadius: "12px", padding: "16px 20px", marginBottom: "20px" }}>
                <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
                  <div>
                    <div style={{ fontSize: "15px", fontWeight: 800, color: "#5b21b6", display: "flex", alignItems: "center", gap: "8px" }}>
                      <HeartPulse size={18} />
                      <span>Anatomy Diagram Verification Queue (Exercise by Exercise &amp; Stretch by Stretch)</span>
                    </div>
                    <div style={{ fontSize: "12px", color: "#6d28d9", marginTop: "2px" }}>
                      Review each anatomical illustration, confirm target muscles and biomechanics cues, and approve diagrams one-by-one.
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                    <button
                      type="button"
                      onClick={handleSyncFullLibrary}
                      style={{
                        fontSize: "12px",
                        fontWeight: 700,
                        background: "#7c3aed",
                        color: "#ffffff",
                        border: "none",
                        padding: "6px 12px",
                        borderRadius: "8px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        boxShadow: "0 1px 3px rgba(124,58,237,0.3)",
                      }}
                      title="Sync and load all newly defined stretches and exercises into database"
                    >
                      <RefreshCw size={13} />
                      <span>🔄 Sync Full Library (27 Stretches &amp; Exercises)</span>
                    </button>
                    <span style={{ fontSize: "13px", fontWeight: 800, color: "#16a34a", background: "#ffffff", padding: "4px 12px", borderRadius: "8px", border: "1px solid #bbf7d0" }}>
                      ✓ {anatomySummary?.approvedCount ?? 0} Approved
                    </span>
                    <span style={{ fontSize: "13px", fontWeight: 800, color: "#d97706", background: "#ffffff", padding: "4px 12px", borderRadius: "8px", border: "1px solid #fef08a" }}>
                      ⏱ {anatomySummary?.pendingCount ?? 0} Pending
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div style={{ width: "100%", height: "8px", background: "#e9d5ff", borderRadius: "4px", overflow: "hidden" }}>
                  <div
                    style={{
                      height: "100%",
                      width: `${anatomySummary?.approvalPercentage ?? 0}%`,
                      background: "linear-gradient(90deg, #7c3aed 0%, #16a34a 100%)",
                      transition: "width 0.4s ease",
                    }}
                  />
                </div>
              </div>

              {/* Filter Pills & Search */}
              <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "10px", marginBottom: "18px" }}>
                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                  {(["ALL", "PENDING", "APPROVED", "EXERCISE", "STRETCH"] as const).map((filter) => (
                    <button
                      key={filter}
                      type="button"
                      onClick={() => {
                        setAnatomyFilterType(filter);
                        setSelectedAnatomyIndex(0);
                      }}
                      style={{
                        padding: "5px 12px",
                        fontSize: "12px",
                        fontWeight: 700,
                        borderRadius: "6px",
                        border: "1px solid",
                        cursor: "pointer",
                        background: anatomyFilterType === filter ? "#7c3aed" : "#ffffff",
                        color: anatomyFilterType === filter ? "#ffffff" : "#475569",
                        borderColor: anatomyFilterType === filter ? "#7c3aed" : "#cbd5e1",
                      }}
                    >
                      {filter === "ALL" ? "All Items" : filter === "PENDING" ? "⏱ Pending Approval" : filter === "APPROVED" ? "✓ Approved" : filter === "EXERCISE" ? "🏋️ Exercises" : "🧘 Stretches"}
                    </button>
                  ))}
                </div>

                <div style={{ position: "relative", width: "240px" }}>
                  <Search size={14} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
                  <input
                    className="input"
                    placeholder="Search movement name..."
                    value={anatomySearch}
                    onChange={(e) => {
                      setAnatomySearch(e.target.value);
                      setSelectedAnatomyIndex(0);
                    }}
                    style={{ paddingLeft: "30px", width: "100%", fontSize: "12px" }}
                  />
                </div>
              </div>

              {/* ACTIVE 1-BY-1 INSPECTION & APPROVAL CARD */}
              {activeAnatomyItem ? (
                <div style={{ border: "2px solid #e2e8f0", borderRadius: "14px", overflow: "hidden", background: "#ffffff", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}>
                  {/* Card Navigation Header */}
                  <div style={{ background: "#0f172a", color: "#ffffff", padding: "12px 18px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <span style={{ fontSize: "13px", fontWeight: 800, color: "#38bdf8" }}>
                        Item {selectedAnatomyIndex + 1} of {filteredAnatomyList.length}
                      </span>
                      <span style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "4px", background: activeAnatomyItem.type === "STRETCH" ? "#7c3aed" : "#2563eb", fontWeight: 700 }}>
                        {activeAnatomyItem.type}
                      </span>
                      <span style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "4px", background: activeAnatomyItem.diagramStatus === "APPROVED" ? "#16a34a" : "#d97706", fontWeight: 700 }}>
                        {activeAnatomyItem.diagramStatus === "APPROVED" ? "✓ APPROVED DIAGRAM" : "⏱ PENDING REVIEW"}
                      </span>
                    </div>

                    {/* Previous / Next Stepper */}
                    <div style={{ display: "flex", gap: "6px" }}>
                      <button
                        type="button"
                        disabled={selectedAnatomyIndex === 0}
                        onClick={() => setSelectedAnatomyIndex((prev) => Math.max(0, prev - 1))}
                        style={{ background: "#1e293b", color: "#ffffff", border: "1px solid #334155", padding: "5px 10px", borderRadius: "6px", cursor: "pointer", fontSize: "12px", display: "flex", alignItems: "center", gap: "4px", opacity: selectedAnatomyIndex === 0 ? 0.5 : 1 }}
                      >
                        <ChevronLeft size={14} /> Previous
                      </button>

                      <button
                        type="button"
                        disabled={selectedAnatomyIndex >= filteredAnatomyList.length - 1}
                        onClick={() => setSelectedAnatomyIndex((prev) => Math.min(filteredAnatomyList.length - 1, prev + 1))}
                        style={{ background: "#1e293b", color: "#ffffff", border: "1px solid #334155", padding: "5px 10px", borderRadius: "6px", cursor: "pointer", fontSize: "12px", display: "flex", alignItems: "center", gap: "4px", opacity: selectedAnatomyIndex >= filteredAnatomyList.length - 1 ? 0.5 : 1 }}
                      >
                        Next <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Card Content Grid */}
                  <div style={{ display: "grid", gridTemplateColumns: "minmax(280px, 360px) 1fr", gap: "20px", padding: "20px" }}>
                    {/* Diagram Illustration Preview & Regeneration Action */}
                    <div>
                      <div style={{ border: "1px solid #e2e8f0", borderRadius: "10px", overflow: "hidden", background: "#f8fafc", position: "relative" }}>
                        <img
                          key={editedDiagramUrl || activeAnatomyItem.diagramUrl}
                          src={editedDiagramUrl || activeAnatomyItem.diagramUrl || "/anatomy/squat.jpg"}
                          alt={activeAnatomyItem.name}
                          style={{ width: "100%", height: "280px", objectFit: "cover", display: "block" }}
                          onError={(e) => {
                            (e.target as any).src = "/anatomy/squat.jpg";
                          }}
                        />

                        {/* Quick Floating Regenerate Button */}
                        <button
                          type="button"
                          onClick={() => handleRegenerateDiagram(activeAnatomyItem)}
                          disabled={isRegeneratingDiagram}
                          style={{
                            position: "absolute",
                            top: "10px",
                            right: "10px",
                            background: "rgba(15, 23, 42, 0.85)",
                            color: "#38bdf8",
                            border: "1px solid #38bdf8",
                            borderRadius: "6px",
                            padding: "4px 10px",
                            fontSize: "11px",
                            fontWeight: 700,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "5px",
                            backdropFilter: "blur(4px)",
                          }}
                          title="Generate new visual rendering"
                        >
                          <Wand2 size={12} className={isRegeneratingDiagram ? "spin" : ""} />
                          <span>{isRegeneratingDiagram ? "Generating..." : "✨ Regenerate"}</span>
                        </button>
                      </div>

                      <div style={{ marginTop: "10px" }}>
                        <label style={{ fontSize: "11px", fontWeight: 700, color: "#475569", display: "block", marginBottom: "4px" }}>
                          Diagram Asset Path / URL
                        </label>
                        <input
                          type="text"
                          className="input"
                          value={editedDiagramUrl}
                          onChange={(e) => setEditedDiagramUrl(e.target.value)}
                          style={{ width: "100%", fontSize: "11px", padding: "6px 8px" }}
                        />
                      </div>
                    </div>

                    {/* Metadata & Kinesiology Details */}
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                        <div>
                          <h2 style={{ margin: 0, fontSize: "20px", fontWeight: 800, color: "#0f172a" }}>
                            {activeAnatomyItem.name}
                          </h2>
                          <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>
                            Muscle Group: <strong style={{ color: "#0f172a" }}>{activeAnatomyItem.muscleGroup}</strong> · Equipment: <strong style={{ color: "#0f172a" }}>{activeAnatomyItem.equipment}</strong>
                          </div>
                        </div>

                        {activeAnatomyItem.diagramStatus === "APPROVED" && (
                          <span style={{ fontSize: "12px", fontWeight: 700, color: "#16a34a", background: "#f0fdf4", border: "1px solid #bbf7d0", padding: "4px 10px", borderRadius: "6px", display: "inline-flex", alignItems: "center", gap: "5px" }}>
                            <Check size={14} /> Approved &amp; Validated
                          </span>
                        )}
                      </div>

                      {/* Primary Muscles */}
                      <div style={{ marginBottom: "12px" }}>
                        <label style={{ fontSize: "11px", fontWeight: 700, color: "#1e3a8a", display: "block", marginBottom: "4px" }}>
                          Primary Target Muscles (Comma separated)
                        </label>
                        <input
                          type="text"
                          className="input"
                          value={editedPrimaryMuscles}
                          onChange={(e) => setEditedPrimaryMuscles(e.target.value)}
                          style={{ width: "100%", fontSize: "12px" }}
                        />
                      </div>

                      {/* Secondary Muscles */}
                      <div style={{ marginBottom: "12px" }}>
                        <label style={{ fontSize: "11px", fontWeight: 700, color: "#475569", display: "block", marginBottom: "4px" }}>
                          Secondary / Synergist Muscles
                        </label>
                        <input
                          type="text"
                          className="input"
                          value={editedSecondaryMuscles}
                          onChange={(e) => setEditedSecondaryMuscles(e.target.value)}
                          style={{ width: "100%", fontSize: "12px" }}
                        />
                      </div>

                      {/* Biomechanics Coaching Cue */}
                      <div style={{ marginBottom: "16px" }}>
                        <label style={{ fontSize: "11px", fontWeight: 700, color: "#475569", display: "block", marginBottom: "4px" }}>
                          Biomechanics Coaching Cue
                        </label>
                        <textarea
                          className="input"
                          rows={2}
                          value={editedCue}
                          onChange={(e) => setEditedCue(e.target.value)}
                          style={{ width: "100%", fontSize: "12px", resize: "vertical" }}
                        />
                      </div>

                      {/* Action Approval Bar */}
                      <div style={{ display: "flex", gap: "10px", borderTop: "1px solid #e2e8f0", paddingTop: "16px", flexWrap: "wrap" }}>
                        <button
                          type="button"
                          onClick={() => handleApproveAnatomy(activeAnatomyItem)}
                          disabled={savingAnatomyId === (activeAnatomyItem.id || activeAnatomyItem.name)}
                          style={{
                            flex: 2,
                            minWidth: "200px",
                            padding: "10px 18px",
                            fontSize: "13px",
                            fontWeight: 800,
                            background: "#16a34a",
                            color: "#ffffff",
                            border: "none",
                            borderRadius: "8px",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "8px",
                            boxShadow: "0 2px 6px rgba(22,163,74,0.3)",
                          }}
                        >
                          <Check size={16} />
                          <span>{activeAnatomyItem.diagramStatus === "APPROVED" ? "✓ Approved (Re-Save & Next)" : "✓ Approve Anatomy Diagram & Proceed"}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleRegenerateDiagram(activeAnatomyItem)}
                          disabled={isRegeneratingDiagram}
                          style={{
                            padding: "10px 14px",
                            fontSize: "12px",
                            fontWeight: 700,
                            background: "#eff6ff",
                            color: "#2563eb",
                            border: "1px solid #bfdbfe",
                            borderRadius: "8px",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "6px",
                          }}
                          title="Generate fresh visual until approved"
                        >
                          <Wand2 size={14} className={isRegeneratingDiagram ? "spin" : ""} />
                          <span>✨ Regenerate</span>
                        </button>

                        {activeAnatomyItem.diagramStatus === "APPROVED" && (
                          <button
                            type="button"
                            onClick={() => handleRevertAnatomyToPending(activeAnatomyItem)}
                            disabled={savingAnatomyId === (activeAnatomyItem.id || activeAnatomyItem.name)}
                            style={{
                              padding: "10px 14px",
                              fontSize: "12px",
                              fontWeight: 700,
                              background: "#fffbeb",
                              color: "#d97706",
                              border: "1px solid #fde68a",
                              borderRadius: "8px",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: "6px",
                            }}
                            title="Revert diagram back to pending approval state"
                          >
                            <RotateCcw size={14} />
                            <span>↩ Revert</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleSaveAnatomyEdits(activeAnatomyItem)}
                          disabled={savingAnatomyId === (activeAnatomyItem.id || activeAnatomyItem.name)}
                          style={{
                            flex: 1,
                            minWidth: "110px",
                            padding: "10px 14px",
                            fontSize: "12px",
                            fontWeight: 700,
                            background: "#f1f5f9",
                            color: "#334155",
                            border: "1px solid #cbd5e1",
                            borderRadius: "8px",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "6px",
                          }}
                        >
                          <Save size={14} />
                          <span>Save</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: "center", padding: "40px", color: "#64748b", background: "#f8fafc", borderRadius: "12px" }}>
                  No movements found matching filters.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}