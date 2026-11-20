"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  ShieldCheck, Users, TrendingUp, DollarSign, Clock, Zap, Search, RefreshCw,
  Award, CheckCircle2, UserCheck, Lock, Edit3, ArrowLeft, Dumbbell, Activity,
  Briefcase, User, Timer, Calendar, LogIn, Trash2, Hourglass, Sparkles, Filter,
  Eye, EyeOff, ShieldAlert, Cpu, HeartPulse, ChevronLeft, ChevronRight, Check,
  AlertCircle, RotateCcw, Image, Save, ExternalLink, Wand2,
  ArrowUpDown, ArrowUp, ArrowDown
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
  totalClientsWithSelf?: number;
  personalWorkoutsCount?: number;
  workoutsLoggedForClients: number;
  totalWorkoutsLogged?: number;
  clientProfileId?: string | null;
  lastLoginAt?: string | null;
  lastActiveAt?: string | null;
  lastSessionDurationSeconds?: number | null;
  loginCount?: number;
  sessionCount?: number;
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
  isTrainerSelfProfile?: boolean;
  linkedTrainerId?: string | null;
  linkedTrainerName?: string | null;
  lastLoginAt?: string | null;
  lastActiveAt?: string | null;
  lastSessionDurationSeconds?: number | null;
  loginCount?: number;
  sessionCount?: number;
  totalSessionSeconds?: number;
  avgSessionDurationSeconds?: number;
}

interface UnifiedAnatomyExercise {
  id: string;
  name: string;
  normalizedName: string;
  type: string;
  muscleGroup: string;
  equipment: string;
  bodyPart?: string;
  category: string;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  biomechanicsCue: string;
  steps: string[];
  commonMistakes: string[];
  breathingPattern: string;
  diagramUrl: string;
  animationUrl?: string;
  thumbUrl?: string;
  diagramStatus?: string;
  diagramNotes?: string;
  approvedByUserId?: string | null;
  approvedAt?: string | null;
  isCustom?: boolean;
}

interface AdminStats {
  totalUsers: number;
  totalTrainers: number;
  totalClients: number;
  rosterAthletesCount?: number;
  trainerSelfProfilesCount?: number;
  totalWorkouts: number;
  totalCompletedWorkouts?: number;
  inProgressSessions?: number;
  totalPrograms?: number;
  activeAssignedPrograms?: number;
  completedPrograms?: number;
  totalProgramAssignments?: number;
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
  totalSessions?: number;
  totalActiveNowCount?: number;
  overallAvgSessionSeconds?: number;
  totalAppTimeSeconds?: number;

  // Organic Customer Metrics (Excluding Admin Dev Usage)
  organicTrainersCount?: number;
  organicClientsCount?: number;
  organicTotalLogins?: number;
  organicTotalSessions?: number;
  organicActiveNowCount?: number;
  organicAvgSessionSeconds?: number;
  organicTotalAppTimeSeconds?: number;
  organicDau?: number;
  organicMau?: number;
  organicStickinessRatio?: number;

  // Internal Admin & Developer Metrics (Collin's Isolated Usage)
  adminTotalLogins?: number;
  adminTotalSessions?: number;
  adminActiveNowCount?: number;
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
  // Clamp display to realistic maximum (7200 seconds / 2 hours) to avoid visual glitch from legacy data
  const clamped = Math.min(seconds, 7200);
  if (clamped < 60) return `${clamped}s`;
  const mins = Math.floor(clamped / 60);
  const remainingSecs = clamped % 60;
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

function formatRelativeTime(dateStr?: string | null, seconds?: number | null): { text: string; full: string; isRecent: boolean; status: "active" | "idle" | "offline" } {
  if (!dateStr) return { text: "Never", full: "No recorded activity", isRecent: false, status: "offline" };
  const date = new Date(dateStr);
  const full = date.toLocaleString();
  const diffMs = Date.now() - date.getTime();
  if (isNaN(diffMs)) return { text: "Unknown", full: "Invalid Date", isRecent: false, status: "offline" };

  const diffSecs = Math.floor(diffMs / 1000);
  const hasSession = (seconds || 0) > 0;

  if (diffSecs < 120 && hasSession) return { text: "Active now", full, isRecent: true, status: "active" };
  const diffMins = Math.floor(diffSecs / 60);
  if (diffMins < 15 && hasSession) return { text: `Idle (${diffMins}m ago)`, full, isRecent: true, status: "idle" };
  if (diffMins < 60) return { text: `${diffMins}m ago`, full, isRecent: false, status: "offline" };
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return { text: `${diffHours}h ago`, full, isRecent: false, status: "offline" };
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return { text: "Yesterday", full, isRecent: false, status: "offline" };
  if (diffDays < 7) return { text: `${diffDays}d ago`, full, isRecent: false, status: "offline" };
  return { text: date.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" }), full, isRecent: false, status: "offline" };
}

type TrainerSortField =
  | "name"
  | "role"
  | "clientCount"
  | "workoutsLoggedForClients"
  | "sessionCount"
  | "loginCount"
  | "avgSessionDurationSeconds"
  | "lastActiveAt"
  | "lastSessionDurationSeconds"
  | "computedStatus"
  | "createdAt";

type ClientSortField =
  | "name"
  | "trainerName"
  | "workoutsLogged"
  | "sessionCount"
  | "loginCount"
  | "avgSessionDurationSeconds"
  | "lastActiveAt"
  | "lastSessionDurationSeconds"
  | "isRegistered"
  | "createdAt";

function SortableTh<T extends string>({
  field,
  currentField,
  currentDirection,
  onSort,
  children,
  align = "left",
  style,
}: {
  field: T;
  currentField: T;
  currentDirection: "asc" | "desc";
  onSort: (field: T) => void;
  children: React.ReactNode;
  align?: "left" | "right" | "center";
  style?: React.CSSProperties;
}) {
  const isActive = currentField === field;
  return (
    <th
      onClick={() => onSort(field)}
      style={{
        padding: "10px 12px",
        cursor: "pointer",
        userSelect: "none",
        textAlign: align,
        color: isActive ? "#1d4ed8" : "#475569",
        background: isActive ? "#eff6ff" : "transparent",
        borderRadius: "4px",
        transition: "background 0.15s ease, color 0.15s ease",
        whiteSpace: "nowrap",
        ...style,
      }}
      title={`Click to sort by ${typeof children === "string" ? children : field} (${isActive ? (currentDirection === "asc" ? "Ascending" : "Descending") : "click to sort"})`}
      aria-sort={isActive ? (currentDirection === "asc" ? "ascending" : "descending") : "none"}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSort(field);
        }
      }}
    >
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "5px",
          justifyContent: align === "right" ? "flex-end" : align === "center" ? "center" : "flex-start",
        }}
      >
        <span>{children}</span>
        <span style={{ display: "inline-flex", alignItems: "center", opacity: isActive ? 1 : 0.4 }}>
          {isActive ? (
            currentDirection === "asc" ? (
              <ArrowUp size={12} style={{ color: "#2563eb" }} />
            ) : (
              <ArrowDown size={12} style={{ color: "#2563eb" }} />
            )
          ) : (
            <ArrowUpDown size={11} />
          )}
        </span>
      </div>
    </th>
  );
}

export function AdminPortal({ userName = "Admin" }: { userName?: string } = {}) {
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
  const [clientTypeFilter, setClientTypeFilter] = useState<"ALL" | "COACHED" | "TRAINER_SELF">("ALL");
  const [excludeAdminAccounts, setExcludeAdminAccounts] = useState(true);
  const [actionUserId, setActionUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Sorting State
  const [trainerSortField, setTrainerSortField] = useState<TrainerSortField>("createdAt");
  const [trainerSortDirection, setTrainerSortDirection] = useState<"asc" | "desc">("desc");

  const [clientSortField, setClientSortField] = useState<ClientSortField>("createdAt");
  const [clientSortDirection, setClientSortDirection] = useState<"asc" | "desc">("desc");

  const handleTrainerSort = (field: TrainerSortField) => {
    if (trainerSortField === field) {
      setTrainerSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setTrainerSortField(field);
      const descFields: TrainerSortField[] = [
        "createdAt",
        "clientCount",
        "workoutsLoggedForClients",
        "sessionCount",
        "loginCount",
        "avgSessionDurationSeconds",
        "lastActiveAt",
        "lastSessionDurationSeconds",
      ];
      setTrainerSortDirection(descFields.includes(field) ? "desc" : "asc");
    }
  };

  const handleClientSort = (field: ClientSortField) => {
    if (clientSortField === field) {
      setClientSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setClientSortField(field);
      const descFields: ClientSortField[] = [
        "createdAt",
        "workoutsLogged",
        "sessionCount",
        "loginCount",
        "avgSessionDurationSeconds",
        "lastActiveAt",
        "lastSessionDurationSeconds",
      ];
      setClientSortDirection(descFields.includes(field) ? "desc" : "asc");
    }
  };

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
    const list = trainers.filter((t) => {
      if (excludeAdminAccounts && t.isInternalAdmin) return false;

      const query = searchQuery.toLowerCase();
      const nameMatch = t.name?.toLowerCase().includes(query) || false;
      const emailMatch = t.email.toLowerCase().includes(query);
      const matchesSearch = nameMatch || emailMatch;

      const matchesStatus = statusFilter === "ALL" || t.computedStatus === statusFilter.toLowerCase();
      return matchesSearch && matchesStatus;
    });

    return [...list].sort((a, b) => {
      let comparison = 0;
      switch (trainerSortField) {
        case "name": {
          const valA = (a.name || a.email || "").toLowerCase();
          const valB = (b.name || b.email || "").toLowerCase();
          comparison = valA.localeCompare(valB);
          break;
        }
        case "role": {
          const valA = a.isAdmin ? "ADMIN" : (a.role || "");
          const valB = b.isAdmin ? "ADMIN" : (b.role || "");
          comparison = valA.localeCompare(valB);
          break;
        }
        case "clientCount": {
          comparison = (a.clientCount ?? 0) - (b.clientCount ?? 0);
          break;
        }
        case "workoutsLoggedForClients": {
          comparison = (a.workoutsLoggedForClients ?? 0) - (b.workoutsLoggedForClients ?? 0);
          break;
        }
        case "sessionCount":
        case "loginCount": {
          const valA = a.sessionCount ?? a.loginCount ?? 1;
          const valB = b.sessionCount ?? b.loginCount ?? 1;
          comparison = valA - valB;
          break;
        }
        case "avgSessionDurationSeconds": {
          comparison = (a.avgSessionDurationSeconds ?? 0) - (b.avgSessionDurationSeconds ?? 0);
          break;
        }
        case "lastActiveAt": {
          const timeA = a.lastActiveAt ? new Date(a.lastActiveAt).getTime() : a.lastLoginAt ? new Date(a.lastLoginAt).getTime() : 0;
          const timeB = b.lastActiveAt ? new Date(b.lastActiveAt).getTime() : b.lastLoginAt ? new Date(b.lastLoginAt).getTime() : 0;
          comparison = timeA - timeB;
          break;
        }
        case "lastSessionDurationSeconds": {
          comparison = (a.lastSessionDurationSeconds ?? 0) - (b.lastSessionDurationSeconds ?? 0);
          break;
        }
        case "computedStatus": {
          const statusRank: Record<string, number> = { active: 3, trial: 2, expired: 1, client_free: 0 };
          const rankA = statusRank[a.computedStatus] ?? 0;
          const rankB = statusRank[b.computedStatus] ?? 0;
          comparison = rankA - rankB;
          break;
        }
        case "createdAt":
        default: {
          const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          comparison = timeA - timeB;
          break;
        }
      }

      return trainerSortDirection === "asc" ? comparison : -comparison;
    });
  }, [trainers, searchQuery, statusFilter, excludeAdminAccounts, trainerSortField, trainerSortDirection]);

  const coachedClientsCount = useMemo(() => {
    return clients.filter((c) => !c.isTrainerSelfProfile && (!excludeAdminAccounts || !c.isInternalAdmin)).length;
  }, [clients, excludeAdminAccounts]);

  const trainerSelfProfilesCount = useMemo(() => {
    return clients.filter((c) => c.isTrainerSelfProfile && (!excludeAdminAccounts || !c.isInternalAdmin)).length;
  }, [clients, excludeAdminAccounts]);

  const filteredClients = useMemo(() => {
    const list = clients.filter((c) => {
      if (excludeAdminAccounts && c.isInternalAdmin) return false;

      if (clientTypeFilter === "COACHED" && c.isTrainerSelfProfile) return false;
      if (clientTypeFilter === "TRAINER_SELF" && !c.isTrainerSelfProfile) return false;

      const query = searchQuery.toLowerCase();
      const nameMatch = c.name.toLowerCase().includes(query);
      const emailMatch = c.email.toLowerCase().includes(query);
      const trainerMatch = c.trainerName.toLowerCase().includes(query);
      return nameMatch || emailMatch || trainerMatch;
    });

    return [...list].sort((a, b) => {
      let comparison = 0;
      switch (clientSortField) {
        case "name": {
          const valA = (a.name || a.email || "").toLowerCase();
          const valB = (b.name || b.email || "").toLowerCase();
          comparison = valA.localeCompare(valB);
          break;
        }
        case "trainerName": {
          comparison = (a.trainerName || "").toLowerCase().localeCompare((b.trainerName || "").toLowerCase());
          break;
        }
        case "workoutsLogged": {
          comparison = (a.workoutsLogged ?? 0) - (b.workoutsLogged ?? 0);
          break;
        }
        case "sessionCount":
        case "loginCount": {
          const valA = a.sessionCount ?? a.loginCount ?? 1;
          const valB = b.sessionCount ?? b.loginCount ?? 1;
          comparison = valA - valB;
          break;
        }
        case "avgSessionDurationSeconds": {
          comparison = (a.avgSessionDurationSeconds ?? 0) - (b.avgSessionDurationSeconds ?? 0);
          break;
        }
        case "lastActiveAt": {
          const timeA = a.lastActiveAt ? new Date(a.lastActiveAt).getTime() : a.lastLoginAt ? new Date(a.lastLoginAt).getTime() : 0;
          const timeB = b.lastActiveAt ? new Date(b.lastActiveAt).getTime() : b.lastLoginAt ? new Date(b.lastLoginAt).getTime() : 0;
          comparison = timeA - timeB;
          break;
        }
        case "lastSessionDurationSeconds": {
          comparison = (a.lastSessionDurationSeconds ?? 0) - (b.lastSessionDurationSeconds ?? 0);
          break;
        }
        case "isRegistered": {
          comparison = (a.isRegistered ? 1 : 0) - (b.isRegistered ? 1 : 0);
          break;
        }
        case "createdAt":
        default: {
          const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          comparison = timeA - timeB;
          break;
        }
      }

      return clientSortDirection === "asc" ? comparison : -comparison;
    });
  }, [clients, searchQuery, excludeAdminAccounts, clientTypeFilter, clientSortField, clientSortDirection]);

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

  const currentTotalSessions =
    telemetryMode === "ORGANIC"
      ? stats?.organicTotalSessions ?? stats?.organicTotalLogins ?? 0
      : telemetryMode === "ADMIN_ONLY"
      ? stats?.adminTotalSessions ?? stats?.adminTotalLogins ?? 0
      : stats?.totalSessions ?? stats?.totalLogins ?? 0;

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

  const currentActiveNow =
    telemetryMode === "ORGANIC"
      ? stats?.organicActiveNowCount ?? 0
      : telemetryMode === "ADMIN_ONLY"
      ? stats?.adminActiveNowCount ?? 0
      : stats?.totalActiveNowCount ?? 0;

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      {/* Top Admin Header */}
      <header style={{ background: "#0f172a", color: "#ffffff", padding: "16px 24px", borderBottom: "1px solid #1e293b" }}>
        <div style={{ maxWidth: "1280px", margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <ShieldCheck size={24} style={{ color: "#38bdf8" }} />
            <div>
              <h1 style={{ margin: 0, fontSize: "18px", fontWeight: 700 }}>STRKYR Master Admin Portal</h1>
              <div style={{ fontSize: "12px", color: "#94a3b8" }}>Master Operations, User Telemetry &amp; Exercise Animation Library</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <a
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
            </a>
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
              <span>{telemetryMode === "ORGANIC" ? "ORGANIC ATHLETES" : "COACHED ATHLETES"}</span>
              <Users size={16} style={{ color: "#7c3aed" }} />
            </div>
            <div style={{ fontSize: "26px", fontWeight: 800, color: "#0f172a", marginTop: "4px" }}>
              {telemetryMode === "ORGANIC"
                ? stats?.organicClientsCount ?? 0
                : stats?.rosterAthletesCount ?? coachedClientsCount}
            </div>
            <div style={{ fontSize: "11px", color: "#7c3aed", marginTop: "2px", fontWeight: 600 }}>
              {(stats?.trainerSelfProfilesCount ?? trainerSelfProfilesCount) > 0
                ? `${stats?.trainerSelfProfilesCount ?? trainerSelfProfilesCount} coach self-logs separated`
                : `${stats?.avgClientsPerTrainer ?? 0} clients / coach`}
            </div>
          </div>

          {/* Average App Session Length */}
          <div style={{ background: "#ffffff", padding: "16px", borderRadius: "12px", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", color: "#64748b", fontSize: "11px", fontWeight: 700, textTransform: "uppercase" }}>
              <span>{telemetryMode === "ORGANIC" ? "ORGANIC AVG ACTIVE SESSION" : telemetryMode === "ADMIN_ONLY" ? "COLLIN AVG ACTIVE SESSION" : "AVG ACTIVE SESSION"}</span>
              <Hourglass size={16} style={{ color: "#059669" }} />
            </div>
            <div style={{ fontSize: "26px", fontWeight: 800, color: "#0f172a", marginTop: "4px" }}>
              {formatSessionDuration(currentAvgSession)}
            </div>
            <div style={{ fontSize: "11px", color: "#059669", marginTop: "2px", fontWeight: 600 }}>
              {currentActiveNow > 0 ? `🟢 ${currentActiveNow} Active Now · ` : ""}{formatTotalAppTime(currentTotalAppTime)} active time
            </div>
          </div>

          {/* Total App Sessions */}
          <div style={{ background: "#ffffff", padding: "16px", borderRadius: "12px", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", color: "#64748b", fontSize: "11px", fontWeight: 700, textTransform: "uppercase" }}>
              <span>{telemetryMode === "ORGANIC" ? "ORGANIC SESSIONS" : telemetryMode === "ADMIN_ONLY" ? "COLLIN SESSIONS" : "TOTAL SESSIONS"}</span>
              <Activity size={16} style={{ color: "#0284c7" }} />
            </div>
            <div style={{ fontSize: "26px", fontWeight: 800, color: "#0f172a", marginTop: "4px" }}>
              {currentTotalSessions}
            </div>
            <div style={{ fontSize: "11px", color: "#0284c7", marginTop: "2px", fontWeight: 600 }}>
              {currentDau} DAU · Active visits
            </div>
          </div>

          {/* Periodized Training Programs */}
          <div style={{ background: "#ffffff", padding: "16px", borderRadius: "12px", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", color: "#64748b", fontSize: "11px", fontWeight: 700, textTransform: "uppercase" }}>
              <span>TRAINING PROGRAMS</span>
              <Calendar size={16} style={{ color: "#d97706" }} />
            </div>
            <div style={{ fontSize: "26px", fontWeight: 800, color: "#0f172a", marginTop: "4px" }}>
              {stats?.totalPrograms ?? 0}
            </div>
            <div style={{ fontSize: "11px", color: "#d97706", marginTop: "2px", fontWeight: 600 }}>
              {stats?.activeAssignedPrograms ?? 0} active · {stats?.completedPrograms ?? 0} finished
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
                <span>Clients &amp; Athletes ({coachedClientsCount})</span>
                {trainerSelfProfilesCount > 0 && (
                  <span style={{ fontSize: "10px", background: activeTab === "clients" ? "#1d4ed8" : "#f1f5f9", color: activeTab === "clients" ? "#bfdbfe" : "#64748b", padding: "1px 6px", borderRadius: "9999px", fontWeight: 600 }}>
                    +{trainerSelfProfilesCount} Logs
                  </span>
                )}
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
                <Dumbbell size={15} />
                <span>Exercise Library &amp; Animations ({anatomySummary?.totalCount ?? (anatomyExercises.length || 1323)})</span>
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
              <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", flex: "1 1 300px" }}>
                  <div style={{ position: "relative", flex: "1 1 220px" }}>
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
                    aria-label="Filter by membership status"
                  >
                    <option value="ALL">All Memberships</option>
                    <option value="ACTIVE">Active Paid</option>
                    <option value="TRIAL">Trialing</option>
                    <option value="EXPIRED">Expired</option>
                  </select>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span style={{ fontSize: "12px", fontWeight: 700, color: "#64748b", whiteSpace: "nowrap" }}>Sort:</span>
                  <select
                    className="input"
                    value={trainerSortField}
                    onChange={(e) => handleTrainerSort(e.target.value as TrainerSortField)}
                    style={{ fontSize: "12px", padding: "6px 10px" }}
                    aria-label="Sort trainers table by"
                  >
                    <option value="createdAt">Joined Date</option>
                    <option value="name">Trainer Name</option>
                    <option value="clientCount">Clients Count</option>
                    <option value="workoutsLoggedForClients">Workouts Logged</option>
                    <option value="sessionCount">Total Sessions</option>
                    <option value="loginCount" style={{ display: "none" }}>Total Logins</option>
                    <option value="avgSessionDurationSeconds">Avg Session</option>
                    <option value="lastActiveAt">Last Active</option>
                    <option value="lastSessionDurationSeconds">Last Session</option>
                    <option value="computedStatus">Membership Status</option>
                    <option value="role">Role</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => setTrainerSortDirection((d) => (d === "asc" ? "desc" : "asc"))}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      padding: "6px 10px",
                      fontSize: "12px",
                      background: "#ffffff",
                      border: "1px solid #cbd5e1",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontWeight: 700,
                      color: "#1e293b",
                    }}
                    title={`Sort direction: ${trainerSortDirection === "asc" ? "Ascending (click to switch to Descending)" : "Descending (click to switch to Ascending)"}`}
                    aria-label={`Sort direction: ${trainerSortDirection === "asc" ? "Ascending" : "Descending"}`}
                  >
                    {trainerSortDirection === "asc" ? <ArrowUp size={13} style={{ color: "#2563eb" }} /> : <ArrowDown size={13} style={{ color: "#2563eb" }} />}
                    <span>{trainerSortDirection === "asc" ? "Asc" : "Desc"}</span>
                  </button>
                </div>
              </div>

              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
                  <thead>
                    <tr style={{ borderBottom: "2px solid #e2e8f0", color: "#475569", fontSize: "11px", textTransform: "uppercase" }}>
                      <SortableTh field="name" currentField={trainerSortField} currentDirection={trainerSortDirection} onSort={handleTrainerSort}>Trainer</SortableTh>
                      <SortableTh field="role" currentField={trainerSortField} currentDirection={trainerSortDirection} onSort={handleTrainerSort}>Role</SortableTh>
                      <SortableTh field="clientCount" currentField={trainerSortField} currentDirection={trainerSortDirection} onSort={handleTrainerSort}>Clients</SortableTh>
                      <SortableTh field="workoutsLoggedForClients" currentField={trainerSortField} currentDirection={trainerSortDirection} onSort={handleTrainerSort}>Workouts Logged</SortableTh>
                      <SortableTh field="sessionCount" currentField={trainerSortField} currentDirection={trainerSortDirection} onSort={handleTrainerSort}>Sessions</SortableTh>
                      <SortableTh field="avgSessionDurationSeconds" currentField={trainerSortField} currentDirection={trainerSortDirection} onSort={handleTrainerSort}>Avg Session</SortableTh>
                      <SortableTh field="lastActiveAt" currentField={trainerSortField} currentDirection={trainerSortDirection} onSort={handleTrainerSort}>Last Active</SortableTh>
                      <SortableTh field="lastSessionDurationSeconds" currentField={trainerSortField} currentDirection={trainerSortDirection} onSort={handleTrainerSort}>Last Session</SortableTh>
                      <SortableTh field="computedStatus" currentField={trainerSortField} currentDirection={trainerSortDirection} onSort={handleTrainerSort}>Membership</SortableTh>
                      <SortableTh field="createdAt" currentField={trainerSortField} currentDirection={trainerSortDirection} onSort={handleTrainerSort}>Joined</SortableTh>
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

                            <td style={{ padding: "12px" }}>
                              <div style={{ fontWeight: 700, color: "#0f172a" }}>{t.clientCount} clients</div>
                              {t.personalWorkoutsCount !== undefined && t.personalWorkoutsCount > 0 && (
                                <div style={{ fontSize: "10px", color: "#64748b" }}>+ self-log active</div>
                              )}
                            </td>
                            <td style={{ padding: "12px" }}>
                              <div style={{ fontWeight: 800, color: "#0f172a" }}>
                                {t.totalWorkoutsLogged ?? (t.workoutsLoggedForClients + (t.personalWorkoutsCount || 0))} workouts
                              </div>
                              {t.personalWorkoutsCount !== undefined && t.personalWorkoutsCount > 0 ? (
                                <div style={{ fontSize: "10px", color: "#64748b" }}>
                                  {t.personalWorkoutsCount} personal • {t.workoutsLoggedForClients} for clients
                                </div>
                              ) : (
                                <div style={{ fontSize: "10px", color: "#64748b" }}>for clients</div>
                              )}
                            </td>

                            <td style={{ padding: "12px" }}>
                              <span
                                style={{
                                  fontSize: "11px",
                                  fontWeight: 700,
                                  color: "#0284c7",
                                  background: "#f0f9ff",
                                  border: "1px solid #bae6fd",
                                  padding: "2px 7px",
                                  borderRadius: "6px",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "4px",
                                }}
                                title={`${t.sessionCount ?? t.loginCount ?? 1} total app sessions (${t.loginCount ?? 1} sign-ins)`}
                              >
                                <Activity size={11} />
                                <span>{t.sessionCount ?? t.loginCount ?? 1}</span>
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
                                    width: "8px",
                                    height: "8px",
                                    borderRadius: "50%",
                                    background: rel.status === "active" ? "#16a34a" : rel.status === "idle" ? "#eab308" : "#94a3b8",
                                    display: "inline-block",
                                    flexShrink: 0,
                                    boxShadow: rel.status === "active" ? "0 0 6px rgba(22,163,74,0.6)" : "none",
                                  }}
                                />
                                <span style={{ fontWeight: 600, color: rel.status === "active" ? "#16a34a" : rel.status === "idle" ? "#b45309" : "#0f172a", fontSize: "12px" }}>
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
                                title="Active engaged duration (pauses when idle or in background tab, max 2h)"
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
                                  onClick={() => {
                                    setClientTypeFilter("TRAINER_SELF");
                                    setSearchQuery(t.name || t.email);
                                    handleTabChange("clients");
                                  }}
                                  style={{ fontSize: "11px", padding: "4px 8px", background: "#f5f3ff", color: "#6d28d9", border: "1px solid #ddd6fe", borderRadius: "6px", cursor: "pointer", fontWeight: 700 }}
                                  title="View Coach Personal Workout Log"
                                >
                                  Self-Log
                                </button>
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
              <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
                {/* Segment Filter: Coached Athletes vs Trainer Self-Logs vs All */}
                <div style={{ display: "flex", background: "#f1f5f9", borderRadius: "8px", padding: "3px", gap: "4px", flexWrap: "wrap" }}>
                  <button
                    type="button"
                    onClick={() => setClientTypeFilter("COACHED")}
                    style={{
                      padding: "6px 12px",
                      fontSize: "12px",
                      fontWeight: 700,
                      borderRadius: "6px",
                      border: "none",
                      cursor: "pointer",
                      background: clientTypeFilter === "COACHED" ? "#2563eb" : "transparent",
                      color: clientTypeFilter === "COACHED" ? "#ffffff" : "#475569",
                      transition: "all 0.15s ease",
                    }}
                  >
                    🏃 Coached Athletes ({coachedClientsCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setClientTypeFilter("TRAINER_SELF")}
                    style={{
                      padding: "6px 12px",
                      fontSize: "12px",
                      fontWeight: 700,
                      borderRadius: "6px",
                      border: "none",
                      cursor: "pointer",
                      background: clientTypeFilter === "TRAINER_SELF" ? "#7c3aed" : "transparent",
                      color: clientTypeFilter === "TRAINER_SELF" ? "#ffffff" : "#475569",
                      transition: "all 0.15s ease",
                    }}
                  >
                    🏋️ Coach Personal Logs ({trainerSelfProfilesCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setClientTypeFilter("ALL")}
                    style={{
                      padding: "6px 12px",
                      fontSize: "12px",
                      fontWeight: 700,
                      borderRadius: "6px",
                      border: "none",
                      cursor: "pointer",
                      background: clientTypeFilter === "ALL" ? "#0f172a" : "transparent",
                      color: clientTypeFilter === "ALL" ? "#ffffff" : "#475569",
                      transition: "all 0.15s ease",
                    }}
                  >
                    All Records ({coachedClientsCount + trainerSelfProfilesCount})
                  </button>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", flex: "1 1 auto", justifyContent: "flex-end" }}>
                  <div style={{ position: "relative", minWidth: "220px", flex: "1 1 220px", maxWidth: "320px" }}>
                    <Search size={14} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
                    <input
                      className="input"
                      placeholder="Search client or coach name..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      style={{ paddingLeft: "30px", width: "100%", fontSize: "12px" }}
                    />
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span style={{ fontSize: "12px", fontWeight: 700, color: "#64748b", whiteSpace: "nowrap" }}>Sort:</span>
                    <select
                      className="input"
                      value={clientSortField}
                      onChange={(e) => handleClientSort(e.target.value as ClientSortField)}
                      style={{ fontSize: "12px", padding: "6px 10px" }}
                      aria-label="Sort clients table by"
                    >
                      <option value="createdAt">Account Created</option>
                      <option value="name">Client / Athlete</option>
                      <option value="trainerName">Assigned Coach</option>
                      <option value="workoutsLogged">Workouts Logged</option>
                      <option value="sessionCount">Total Sessions</option>
                      <option value="loginCount" style={{ display: "none" }}>Total Logins</option>
                      <option value="avgSessionDurationSeconds">Avg Session</option>
                      <option value="lastActiveAt">Last Active</option>
                      <option value="lastSessionDurationSeconds">Last Session</option>
                      <option value="isRegistered">Access Tier</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => setClientSortDirection((d) => (d === "asc" ? "desc" : "asc"))}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                        padding: "6px 10px",
                        fontSize: "12px",
                        background: "#ffffff",
                        border: "1px solid #cbd5e1",
                        borderRadius: "6px",
                        cursor: "pointer",
                        fontWeight: 700,
                        color: "#1e293b",
                      }}
                      title={`Sort direction: ${clientSortDirection === "asc" ? "Ascending (click to switch to Descending)" : "Descending (click to switch to Ascending)"}`}
                      aria-label={`Sort direction: ${clientSortDirection === "asc" ? "Ascending" : "Descending"}`}
                    >
                      {clientSortDirection === "asc" ? <ArrowUp size={13} style={{ color: "#2563eb" }} /> : <ArrowDown size={13} style={{ color: "#2563eb" }} />}
                      <span>{clientSortDirection === "asc" ? "Asc" : "Desc"}</span>
                    </button>
                  </div>
                </div>
              </div>

              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
                  <thead>
                    <tr style={{ borderBottom: "2px solid #e2e8f0", color: "#475569", fontSize: "11px", textTransform: "uppercase" }}>
                      <SortableTh field="name" currentField={clientSortField} currentDirection={clientSortDirection} onSort={handleClientSort}>Client / Athlete</SortableTh>
                      <SortableTh field="trainerName" currentField={clientSortField} currentDirection={clientSortDirection} onSort={handleClientSort}>Assigned Coach</SortableTh>
                      <SortableTh field="workoutsLogged" currentField={clientSortField} currentDirection={clientSortDirection} onSort={handleClientSort}>Workouts Logged</SortableTh>
                      <SortableTh field="sessionCount" currentField={clientSortField} currentDirection={clientSortDirection} onSort={handleClientSort}>Sessions</SortableTh>
                      <SortableTh field="avgSessionDurationSeconds" currentField={clientSortField} currentDirection={clientSortDirection} onSort={handleClientSort}>Avg Session</SortableTh>
                      <SortableTh field="lastActiveAt" currentField={clientSortField} currentDirection={clientSortDirection} onSort={handleClientSort}>Last Active</SortableTh>
                      <SortableTh field="lastSessionDurationSeconds" currentField={clientSortField} currentDirection={clientSortDirection} onSort={handleClientSort}>Last Session</SortableTh>
                      <SortableTh field="isRegistered" currentField={clientSortField} currentDirection={clientSortDirection} onSort={handleClientSort}>Access Tier</SortableTh>
                      <SortableTh field="createdAt" currentField={clientSortField} currentDirection={clientSortDirection} onSort={handleClientSort}>Account Created</SortableTh>
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
                          <tr key={c.id} style={{ borderBottom: "1px solid #f1f5f9", background: c.isTrainerSelfProfile ? "#faf5ff" : undefined }}>
                            <td style={{ padding: "12px" }}>
                              <div style={{ fontWeight: 700, color: "#0f172a", display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                                <span>{c.name ? c.name.replace(/\s*\(You\)/gi, "").trim() : "Client"}</span>
                                {c.isTrainerSelfProfile && (
                                  <span style={{ fontSize: "10px", background: "#f5f3ff", color: "#6d28d9", border: "1px solid #ddd6fe", padding: "1px 6px", borderRadius: "4px", fontWeight: 700 }}>
                                    🏋️ COACH SELF-LOG
                                  </span>
                                )}
                                {c.isInternalAdmin && (
                                  <span style={{ fontSize: "10px", background: "#fef3c7", color: "#92400e", padding: "1px 6px", borderRadius: "4px", fontWeight: 700 }}>
                                    👑 DEV / ADMIN
                                  </span>
                                )}
                              </div>
                              <div style={{ fontSize: "11px", color: "#64748b" }}>
                                {c.isTrainerSelfProfile ? (
                                  <span>Personal workout tracking profile for coach <strong>{c.linkedTrainerName || c.trainerName}</strong></span>
                                ) : (
                                  c.email
                                )}
                              </div>
                            </td>

                            <td style={{ padding: "12px" }}>
                              {c.isTrainerSelfProfile ? (
                                <span style={{ fontSize: "12px", fontWeight: 600, color: "#6d28d9", background: "#f5f3ff", border: "1px solid #ddd6fe", padding: "2px 8px", borderRadius: "6px" }}>
                                  👤 Self (Coach Log)
                                </span>
                              ) : c.trainerName === "Solo Athlete" ? (
                                <span style={{ fontSize: "12px", fontWeight: 600, color: "#475569", background: "#f1f5f9", border: "1px solid #cbd5e1", padding: "2px 8px", borderRadius: "6px" }}>
                                  👤 Solo Athlete
                                </span>
                              ) : (
                                <span style={{ fontSize: "12px", fontWeight: 600, color: "#2563eb", background: "#eff6ff", border: "1px solid #bfdbfe", padding: "2px 8px", borderRadius: "6px" }}>
                                  🏋️ {c.trainerName}
                                </span>
                              )}
                            </td>

                            <td style={{ padding: "12px" }}>
                              <span style={{ fontWeight: 800, color: "#0f172a", fontSize: "14px" }}>{c.workoutsLogged}</span>{" "}
                              <span style={{ fontSize: "11px", color: "#64748b" }}>workouts</span>
                            </td>

                            <td style={{ padding: "12px" }}>
                              <span
                                style={{
                                  fontSize: "11px",
                                  fontWeight: 700,
                                  color: "#0284c7",
                                  background: "#f0f9ff",
                                  border: "1px solid #bae6fd",
                                  padding: "2px 7px",
                                  borderRadius: "6px",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "4px",
                                }}
                                title={`${c.sessionCount ?? c.loginCount ?? 1} total app sessions (${c.loginCount ?? 1} sign-ins)`}
                              >
                                <Activity size={11} />
                                <span>{c.sessionCount ?? c.loginCount ?? 1}</span>
                              </span>
                            </td>

                            <td style={{ padding: "12px" }}>
                              <div style={{ fontWeight: 700, color: "#0f172a", fontSize: "12px" }}>{avgStr}</div>
                              <div style={{ fontSize: "10px", color: "#94a3b8" }}>{totalTimeStr} total</div>
                            </td>

                            <td style={{ padding: "12px" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "6px" }} title={rel.full}>
                                <span
                                  style={{
                                    width: "8px",
                                    height: "8px",
                                    borderRadius: "50%",
                                    background: rel.status === "active" ? "#16a34a" : rel.status === "idle" ? "#eab308" : "#94a3b8",
                                    display: "inline-block",
                                    flexShrink: 0,
                                    boxShadow: rel.status === "active" ? "0 0 6px rgba(22,163,74,0.6)" : "none",
                                  }}
                                />
                                <span style={{ fontWeight: 600, color: rel.status === "active" ? "#16a34a" : rel.status === "idle" ? "#b45309" : "#0f172a", fontSize: "12px" }}>
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
                                  background: "#f1f5f9",
                                  padding: "2px 7px",
                                  borderRadius: "6px",
                                }}
                                title="Active engaged duration (pauses when idle or in background tab, max 2h)"
                              >
                                <Timer size={12} />
                                <span>{durationStr}</span>
                              </span>
                            </td>

                            <td style={{ padding: "12px" }}>
                              {c.isTrainerSelfProfile ? (
                                <span style={{ fontSize: "11px", fontWeight: 700, color: "#6d28d9", background: "#f5f3ff", padding: "3px 9px", borderRadius: "6px", border: "1px solid #ddd6fe" }}>
                                  ⭐ Coach Personal Profile
                                </span>
                              ) : (
                                <span style={{ fontSize: "11px", fontWeight: 700, color: "#0284c7", background: "#f0f9ff", padding: "3px 9px", borderRadius: "6px", border: "1px solid #bae6fd" }}>
                                  ✓ Free Athlete Access
                                </span>
                              )}
                            </td>

                            <td style={{ padding: "12px", color: "#64748b", fontSize: "12px" }}>
                              {new Date(c.createdAt).toLocaleDateString()}
                            </td>

                            <td style={{ padding: "12px", textAlign: "right" }}>
                              {c.isTrainerSelfProfile ? (
                                <span
                                  style={{ fontSize: "11px", color: "#94a3b8", fontWeight: 600 }}
                                  title="Primary coach profile is protected from deletion to preserve personal workout history"
                                >
                                  🔒 Protected
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteUser(c.id, c.name)}
                                  disabled={actionUserId === c.id}
                                  style={{ fontSize: "11px", padding: "4px 8px", background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca", borderRadius: "6px", cursor: "pointer", fontWeight: 700 }}
                                >
                                  <Trash2 size={12} />
                                </button>
                              )}
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
          {/* TAB 3: EXERCISE LIBRARY & FORM ANIMATIONS (1,323 ITEMS)    */}
          {/* ========================================================= */}
          {activeTab === "anatomy" && (
            <div>
              {/* Exercise Library Stats Banner */}
              <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "14px", padding: "18px 22px", marginBottom: "22px" }}>
                <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "16px" }}>
                  <div>
                    <div style={{ fontSize: "16px", fontWeight: 800, color: "#0f172a", display: "flex", alignItems: "center", gap: "8px" }}>
                      <Dumbbell size={20} style={{ color: "#0284c7" }} />
                      <span>Exercise Library &amp; Form Animations</span>
                      <span style={{ fontSize: "11px", fontWeight: 700, background: "#dbeafe", color: "#1d4ed8", padding: "2px 8px", borderRadius: "12px", border: "1px solid #bfdbfe" }}>
                        Source of Truth
                      </span>
                    </div>
                    <div style={{ fontSize: "12px", color: "#64748b", marginTop: "3px" }}>
                      Unified catalog of 1,323+ exercises indexed with continuous 12-frame looping form demonstrations, muscle targeting, and kinesiological execution cues.
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                    <button
                      type="button"
                      onClick={handleSyncFullLibrary}
                      style={{
                        fontSize: "12px",
                        fontWeight: 700,
                        background: "#0284c7",
                        color: "#ffffff",
                        border: "none",
                        padding: "7px 14px",
                        borderRadius: "8px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        boxShadow: "0 1px 3px rgba(2,132,199,0.3)",
                      }}
                      title="Reload and sync the 1,323 exercise library"
                    >
                      <RefreshCw size={13} />
                      <span>⚡ Sync 1,323 Exercise Library</span>
                    </button>
                    <span style={{ fontSize: "13px", fontWeight: 800, color: "#0f766e", background: "#f0fdfa", padding: "5px 12px", borderRadius: "8px", border: "1px solid #ccfbf1" }}>
                      ✓ {anatomySummary?.totalCount ?? (anatomyExercises.length || 1323)} Total Exercises
                    </span>
                    <span style={{ fontSize: "13px", fontWeight: 800, color: "#16a34a", background: "#f0fdf4", padding: "5px 12px", borderRadius: "8px", border: "1px solid #bbf7d0" }}>
                      🎬 100% Animated
                    </span>
                  </div>
                </div>
              </div>

              {/* Filter Pills & Instant Search */}
              <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                  {(["ALL", "pectorals", "lats", "quads", "hamstrings", "delts", "biceps", "triceps", "glutes", "abs", "calves"] as const).map((muscle) => (
                    <button
                      key={muscle}
                      type="button"
                      onClick={() => {
                        setAnatomyFilterType(muscle === "ALL" ? "ALL" : (muscle as any));
                        setSelectedAnatomyIndex(0);
                      }}
                      style={{
                        padding: "6px 12px",
                        fontSize: "12px",
                        fontWeight: 700,
                        borderRadius: "6px",
                        border: "1px solid",
                        cursor: "pointer",
                        background: (anatomyFilterType === muscle || (muscle === "ALL" && anatomyFilterType === "ALL")) ? "#0284c7" : "#ffffff",
                        color: (anatomyFilterType === muscle || (muscle === "ALL" && anatomyFilterType === "ALL")) ? "#ffffff" : "#475569",
                        borderColor: (anatomyFilterType === muscle || (muscle === "ALL" && anatomyFilterType === "ALL")) ? "#0284c7" : "#cbd5e1",
                        textTransform: "capitalize",
                      }}
                    >
                      {muscle === "ALL" ? "All Muscles" : muscle}
                    </button>
                  ))}
                </div>

                <div style={{ position: "relative", width: "260px" }}>
                  <Search size={14} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
                  <input
                    className="input"
                    placeholder="Search exercise, muscle, equipment..."
                    value={anatomySearch}
                    onChange={(e) => {
                      setAnatomySearch(e.target.value);
                      setSelectedAnatomyIndex(0);
                    }}
                    style={{ paddingLeft: "32px", width: "100%", fontSize: "12px" }}
                  />
                </div>
              </div>

              {/* Exercise Grid with Looping Animations */}
              {filteredAnatomyList.length > 0 ? (
                <div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "18px", marginBottom: "24px" }}>
                    {filteredAnatomyList.slice(selectedAnatomyIndex * 12, (selectedAnatomyIndex + 1) * 12).map((item, idx) => (
                      <div
                        key={item.id || item.name || idx}
                        style={{
                          background: "#ffffff",
                          border: "1px solid #e2e8f0",
                          borderRadius: "14px",
                          overflow: "hidden",
                          boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                          display: "flex",
                          flexDirection: "column",
                          transition: "transform 0.15s ease, box-shadow 0.15s ease",
                        }}
                      >
                        {/* Looping Animation Video Frame */}
                        <div style={{ position: "relative", background: "#020617", height: "200px", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                          <img
                            src={item.animationUrl || item.diagramUrl || item.thumbUrl || "/exercise-animations/bench_press.gif"}
                            alt={item.name}
                            loading="lazy"
                            style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              if (item.thumbUrl && target.src !== item.thumbUrl) {
                                target.src = item.thumbUrl;
                              } else {
                                target.src = "/exercise-animations/bench_press.gif";
                              }
                            }}
                          />
                          <div style={{ position: "absolute", bottom: "8px", right: "8px", background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)", padding: "2px 7px", borderRadius: "5px", fontSize: "10px", color: "#38bdf8", fontWeight: 700, border: "1px solid rgba(255,255,255,0.1)" }}>
                            12-Frame Loop
                          </div>
                          <div style={{ position: "absolute", top: "8px", left: "8px", background: "rgba(15, 23, 42, 0.85)", backdropFilter: "blur(4px)", padding: "2px 7px", borderRadius: "5px", fontSize: "10px", color: "#e2e8f0", fontWeight: 700, border: "1px solid rgba(255,255,255,0.1)", textTransform: "capitalize" }}>
                            {item.equipment}
                          </div>
                        </div>

                        {/* Card Details */}
                        <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", flex: 1, justifyContent: "space-between" }}>
                          <div>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px", marginBottom: "6px" }}>
                              <h4 style={{ fontSize: "14px", fontWeight: 800, color: "#0f172a", margin: 0, lineHeight: 1.3 }}>
                                {item.name}
                              </h4>
                            </div>

                            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "10px" }}>
                              <span style={{ fontSize: "11px", fontWeight: 700, background: "#f0fdf4", color: "#16a34a", padding: "2px 7px", borderRadius: "5px", border: "1px solid #bbf7d0", textTransform: "capitalize" }}>
                                🎯 {item.muscleGroup}
                              </span>
                              {item.category && (
                                <span style={{ fontSize: "11px", fontWeight: 600, background: "#f1f5f9", color: "#475569", padding: "2px 7px", borderRadius: "5px", textTransform: "uppercase" }}>
                                  {item.category}
                                </span>
                              )}
                            </div>

                            {/* Form Cue / Instruction snippet */}
                            <p style={{ fontSize: "12px", color: "#64748b", margin: 0, lineHeight: 1.45, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                              {item.biomechanicsCue || (item.steps && item.steps.length > 0 ? item.steps[0] : "Focus on controlled eccentric lowering and explosive concentric contraction.")}
                            </p>
                          </div>

                          {/* Secondary Muscles */}
                          {item.secondaryMuscles && item.secondaryMuscles.length > 0 && (
                            <div style={{ marginTop: "10px", paddingTop: "8px", borderTop: "1px solid #f1f5f9", fontSize: "11px", color: "#94a3b8" }}>
                              Synergists: <span style={{ color: "#475569" }}>{item.secondaryMuscles.slice(0, 3).join(", ")}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Pagination Controls */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 18px", background: "#f8fafc", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                    <div style={{ fontSize: "12px", color: "#64748b" }}>
                      Showing {selectedAnatomyIndex * 12 + 1} to {Math.min((selectedAnatomyIndex + 1) * 12, filteredAnatomyList.length)} of {filteredAnatomyList.length} exercises
                    </div>

                    <div style={{ display: "flex", gap: "8px" }}>
                      <button
                        type="button"
                        disabled={selectedAnatomyIndex === 0}
                        onClick={() => setSelectedAnatomyIndex((prev) => Math.max(0, prev - 1))}
                        style={{
                          padding: "6px 14px",
                          fontSize: "12px",
                          fontWeight: 700,
                          borderRadius: "6px",
                          border: "1px solid #cbd5e1",
                          background: "#ffffff",
                          color: selectedAnatomyIndex === 0 ? "#94a3b8" : "#0f172a",
                          cursor: selectedAnatomyIndex === 0 ? "not-allowed" : "pointer",
                        }}
                      >
                        ← Previous
                      </button>

                      <span style={{ fontSize: "12px", fontWeight: 700, color: "#0f172a", display: "flex", alignItems: "center", padding: "0 8px" }}>
                        Page {selectedAnatomyIndex + 1} of {Math.max(1, Math.ceil(filteredAnatomyList.length / 12))}
                      </span>

                      <button
                        type="button"
                        disabled={(selectedAnatomyIndex + 1) * 12 >= filteredAnatomyList.length}
                        onClick={() => setSelectedAnatomyIndex((prev) => prev + 1)}
                        style={{
                          padding: "6px 14px",
                          fontSize: "12px",
                          fontWeight: 700,
                          borderRadius: "6px",
                          border: "1px solid #cbd5e1",
                          background: "#ffffff",
                          color: (selectedAnatomyIndex + 1) * 12 >= filteredAnatomyList.length ? "#94a3b8" : "#0f172a",
                          cursor: (selectedAnatomyIndex + 1) * 12 >= filteredAnatomyList.length ? "not-allowed" : "pointer",
                        }}
                      >
                        Next →
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: "center", padding: "60px 20px", color: "#64748b", background: "#f8fafc", borderRadius: "12px", border: "1px dashed #cbd5e1" }}>
                  <Dumbbell size={32} style={{ margin: "0 auto 12px", color: "#94a3b8" }} />
                  <p style={{ fontSize: "14px", fontWeight: 700, color: "#334155", margin: "0 0 4px" }}>No exercises match your search</p>
                  <p style={{ fontSize: "12px", color: "#94a3b8", margin: 0 }}>Try clearing your filters or searching a different exercise name.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}