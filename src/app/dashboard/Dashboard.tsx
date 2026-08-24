"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { signOut, useSession } from "next-auth/react";
import {
  Dumbbell,
  LogOut,
  Edit3,
  Check,
  Copy,
  ShieldCheck,
  Mail,
  Phone,
  Target,
  FileText,
  Link2,
  User,
  CreditCard,
  Camera,
  Download,
  Flame,
  Moon,
  Sun,
  ChevronDown,
  Search,
  Users,
  UserPlus,
  X,
  AlertTriangle,
  UserCheck,
  Sparkles,
  Activity,
} from "lucide-react";
import Link from "next/link";
import { Client, WorkoutSession, DraftWorkout, DraftExercise } from "./types";
import { computeAnalytics } from "./utils/analytics";
import { ClientSidebar } from "./components/ClientSidebar";
import { ClientModal } from "./components/ClientModal";
import { WorkoutBuilder } from "./components/WorkoutBuilder";
import { WorkoutHistory } from "./components/WorkoutHistory";
import { AnalyticsView } from "./components/AnalyticsView";
import { SubscriptionBanner, SubscriptionInfo } from "./components/SubscriptionBanner";
import { TrainerProfileModal } from "./components/TrainerProfileModal";
import { ReportExportModal } from "./components/ReportExportModal";
import { PlateCalculatorModal } from "./components/PlateCalculatorModal";
import { AIRoutineGeneratorModal } from "./components/AIRoutineGeneratorModal";
import { ReleaseNotesModal } from "./components/ReleaseNotesModal";
import { MobilityTab } from "./components/MobilityTab";
import { CoachWalkthroughModal } from "./components/CoachWalkthroughModal";
import { DashboardTourModal } from "./components/DashboardTourModal";
import { AIChatDrawer } from "./components/AIChatDrawer";
import { MobileNavDrawer } from "./components/MobileNavDrawer";
import { AppHeaderMenu } from "./components/AppHeaderMenu";
import { StrkyrLogo } from "@/components/StrkyrLogo";
import { GeneratedRoutine } from "../api/ai/generate-routine/route";
import { Compass, Menu } from "lucide-react";

export interface ExtendedSubscriptionInfo extends SubscriptionInfo {
  isAdmin?: boolean;
}

export function Dashboard({ userName, userImage, isAdmin }: { userName: string; userImage: string | null; isAdmin?: boolean }) {
  const { data: session } = useSession();
  const [clients, setClients] = useState<Client[]>([]);
  const [selected, setSelected] = useState<Client | null>(null);
  const [workouts, setWorkouts] = useState<WorkoutSession[]>([]);
  const [loadingClients, setLoadingClients] = useState(true);
  const [loadingWorkouts, setLoadingWorkouts] = useState(false);
  const [subInfo, setSubInfo] = useState<ExtendedSubscriptionInfo | null>(null);

  // Modals State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isPlateModalOpen, setIsPlateModalOpen] = useState(false);
  const [isAIRoutineModalOpen, setIsAIRoutineModalOpen] = useState(false);
  const [isReleaseNotesOpen, setIsReleaseNotesOpen] = useState(false);
  const [isCoachWalkthroughOpen, setIsCoachWalkthroughOpen] = useState(false);
  const [isTourOpen, setIsTourOpen] = useState(false);
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Auto-launch tour on first join
  useEffect(() => {
    try {
      const seen = localStorage.getItem("strkyr_tour_seen_trainer");
      if (!seen) {
        const timer = setTimeout(() => setIsTourOpen(true), 800);
        return () => clearTimeout(timer);
      }
    } catch {}
  }, []);
  const [generatingQuickInvite, setGeneratingQuickInvite] = useState(false);

  // Mobile Client Switcher Drawer
  const [showMobileClientDrawer, setShowMobileClientDrawer] = useState(false);
  const [mobileClientSearch, setMobileClientSearch] = useState("");

  // Workout Session Auto-Save & Navigation Guard State
  const [draftRestoredNotice, setDraftRestoredNotice] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<{
    type: "tab" | "client";
    targetTab?: "log" | "history" | "analytics" | "mobility";
    targetClient?: Client;
  } | null>(null);

  // Dark Theme
  const [isDark, setIsDark] = useState(false);

  const [currentTrainerImage, setCurrentTrainerImage] = useState<string | null>(userImage);
  const [currentTrainerName, setCurrentTrainerName] = useState<string>(userName);

  useEffect(() => {
    if (session?.user?.image && !currentTrainerImage) {
      setCurrentTrainerImage(session.user.image);
    }
    if (session?.user?.name && !currentTrainerName) {
      setCurrentTrainerName(session.user.name);
    }
  }, [session, currentTrainerImage, currentTrainerName]);

  const [tab, setTab] = useState<"log" | "history" | "analytics" | "mobility">("log");

  const [activeWorkout, setActiveWorkout] = useState<DraftWorkout | null>(null);
  const [exercisePicker, setExercisePicker] = useState("");
  const [savingWorkout, setSavingWorkout] = useState(false);
  const [savingPlan, setSavingPlan] = useState(false);

  const fetchSubscription = useCallback(async () => {
    try {
      const res = await fetch("/api/subscription");
      if (res.ok) {
        setSubInfo(await res.json());
      }
    } catch {}
  }, []);

  const fetchTrainerProfile = useCallback(async () => {
    try {
      const res = await fetch("/api/user/profile");
      if (res.ok) {
        const data = await res.json();
        if (data.user?.name) setCurrentTrainerName(data.user.name);
        if (data.user?.image) setCurrentTrainerImage(data.user.image);
      }
    } catch {}
  }, []);

  const fetchClients = useCallback(async () => {
    setLoadingClients(true);
    const res = await fetch("/api/clients");
    if (res.ok) {
      const data = await res.json();
      setClients(data);
      if (data.length) {
        let candidate = data[0];
        try {
          const savedId = localStorage.getItem("fitcoach_last_selected_client_id");
          if (savedId) {
            const found = data.find((c: any) => c.id === savedId);
            if (found) candidate = found;
          } else {
            // Prefer client with recorded workouts if available
            const withWorkouts = data.find(
              (c: any) => (c._count?.workoutSessions || 0) > 0 || (c.workouts?.length || 0) > 0
            );
            if (withWorkouts) candidate = withWorkouts;
          }
        } catch {}
        setSelected((prev) => {
          if (prev) {
            const found = data.find((c: any) => c.id === prev.id);
            return found || prev;
          }
          return candidate;
        });
      }
    }
    setLoadingClients(false);
  }, []);

  const fetchWorkouts = useCallback(async (clientId: string) => {
    setLoadingWorkouts(true);
    const res = await fetch(`/api/workouts?clientId=${clientId}`);
    if (res.ok) setWorkouts(await res.json());
    else setWorkouts([]);
    setLoadingWorkouts(false);
  }, []);

  useEffect(() => {
    document.title = "STRKYR Fitness — Coach Dashboard";
  }, []);

  useEffect(() => {
    fetchSubscription();
    fetchTrainerProfile();
    fetchClients();
  }, [fetchSubscription, fetchTrainerProfile, fetchClients]);

  useEffect(() => {
    if (selected) fetchWorkouts(selected.id);
    else setWorkouts([]);
  }, [selected, fetchWorkouts]);

  const handleAddClient = async (clientData: {
    name: string;
    image?: string | null;
    email: string | null;
    phone: string | null;
    fitnessGoals: string | null;
    notes: string | null;
    emailNotifications?: boolean;
  }) => {
    const res = await fetch("/api/clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(clientData),
    });

    if (res.ok) {
      const created = await res.json();
      setClients((prev) => {
        const selfClient = prev.find((c: any) => c.name.includes("My Workouts") || (c as any).isSelf);
        const others = prev.filter((c: any) => c.id !== created.id && c.id !== selfClient?.id);
        return selfClient ? [selfClient, created, ...others] : [created, ...others];
      });
      setSelected(created);
      try {
        localStorage.setItem("fitcoach_last_selected_client_id", created.id);
      } catch {}
      fetchSubscription();
      return;
    }

    const errorBody = await res.json().catch(() => null);
    throw new Error(errorBody?.error || "Failed to create client.");
  };

  const handleEditClient = async (clientData: {
    name: string;
    image?: string | null;
    email: string | null;
    phone: string | null;
    fitnessGoals: string | null;
    notes: string | null;
    emailNotifications?: boolean;
  }) => {
    if (!editingClient) return;

    const res = await fetch(`/api/clients/${editingClient.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(clientData),
    });

    if (res.ok) {
      const updated = await res.json();
      setClients((prev) => prev.map((c) => (c.id === updated.id ? { ...c, ...updated } : c)));
      setSelected((prev) => (prev?.id === updated.id ? { ...prev, ...updated } : prev));
      return;
    }

    const errorBody = await res.json().catch(() => null);
    throw new Error(errorBody?.error || "Failed to update client.");
  };

  const deleteClient = async (clientId: string) => {
    const target = clients.find((c) => c.id === clientId);
    const targetName = target ? target.name : "this client";
    if (!confirm(`Are you sure you want to remove ${targetName}? This will delete all their workout records.`)) return;

    const res = await fetch(`/api/clients/${clientId}`, { method: "DELETE" });
    if (res.ok) {
      setClients((prev) => prev.filter((c) => c.id !== clientId));
      if (selected?.id === clientId) {
        const remaining = clients.filter((c) => c.id !== clientId);
        setSelected(remaining.length ? remaining[0] : null);
      }
      fetchSubscription();
    } else {
      alert("Failed to delete client.");
    }
  };

  const handleInviteGenerated = (updatedClient: Client) => {
    setClients((prev) => prev.map((c) => (c.id === updatedClient.id ? updatedClient : c)));
    if (selected?.id === updatedClient.id) setSelected(updatedClient);
  };

  const handleQuickGenerateInvite = async (client: Client) => {
    setGeneratingQuickInvite(true);
    try {
      const res = await fetch(`/api/clients/${client.id}/invite`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        const token = data.inviteToken || data.token || data.client?.inviteToken;
        const inviteUrl = typeof window !== "undefined" && token
          ? `${window.location.origin}/invite/${token}`
          : data.inviteUrl || `/invite/${token}`;
        const updated = { ...client, inviteToken: token, inviteUrl, inviteStatus: "PENDING" as const };
        setClients((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
        setSelected(updated);
        copyLink(inviteUrl);
      } else {
        alert("Failed to generate invite link.");
      }
    } catch {
      alert("Error generating invite link.");
    } finally {
      setGeneratingQuickInvite(false);
    }
  };

  const copyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const getInviteUrl = (client: Client) => {
    if (!client.inviteToken || client.inviteToken === "undefined") return null;
    if (typeof window !== "undefined") {
      return `${window.location.origin}/invite/${client.inviteToken}`;
    }
    return `/invite/${client.inviteToken}`;
  };

  const completedWorkouts = useMemo(() => {
    return workouts.filter((w) => {
      const s = (w.status || "").toUpperCase();
      return s === "COMPLETED" || s === "" || (!w.status && (w.completedAt || (w.exercises && w.exercises.length > 0)));
    });
  }, [workouts]);

  const plannedWorkouts = useMemo(() => {
    return workouts.filter((w) => {
      const s = (w.status || "").toUpperCase();
      return s === "PLANNED" || s === "IN_PROGRESS";
    });
  }, [workouts]);
  const analytics = useMemo(() => computeAnalytics(completedWorkouts), [completedWorkouts]);

  // Compute Weekly Workout Streak for Selected Client
  const weeklyStreakInfo = useMemo(() => {
    const now = new Date();
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(now.getDate() - 7);

    const thisWeekWorkouts = completedWorkouts.filter(
      (w) => new Date(w.completedAt || w.createdAt) >= oneWeekAgo
    );

    return {
      thisWeekCount: thisWeekWorkouts.length,
      totalCompleted: completedWorkouts.length,
    };
  }, [completedWorkouts]);

  // Filter clients for mobile switcher drawer
  const filteredMobileClients = useMemo(() => {
    if (!mobileClientSearch.trim()) return clients;
    const q = mobileClientSearch.toLowerCase();
    return clients.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.email && c.email.toLowerCase().includes(q)) ||
        (c.fitnessGoals && c.fitnessGoals.toLowerCase().includes(q))
    );
  }, [clients, mobileClientSearch]);

  // Import AI-Generated Routine into Workout Builder
  const handleImportAIRoutine = (routine: GeneratedRoutine) => {
    const formattedExercises: DraftExercise[] = routine.exercises.map((ex) => ({
      name: ex.name,
      category: ex.category,
      isBodyweight: ex.isBodyweight,
      sets: Array.from({ length: ex.targetSets }).map(() => ({
        reps: String(ex.targetReps || "10"),
        weight: String(ex.suggestedWeight || (ex.isBodyweight ? "0" : "45")),
        notes: "",
      })),
    }));

    setActiveWorkout({
      startedAt: new Date().toISOString(),
      notes: `AI Generated: ${routine.routineName}. Warmup: ${routine.warmupInstructions.join("; ")}`,
      exercises: formattedExercises,
    });
    setTab("log");
  };

  // Has unsaved in-progress workout
  const hasUnsavedWorkout = useMemo(() => {
    return !!(activeWorkout && activeWorkout.exercises && activeWorkout.exercises.length > 0);
  }, [activeWorkout]);

  // Restore workout draft when client changes or app loads
  useEffect(() => {
    if (!selected) {
      setActiveWorkout(null);
      return;
    }
    try {
      const draftKey = `fitcoach_active_draft_${selected.id}`;
      const saved = localStorage.getItem(draftKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && Array.isArray(parsed.exercises) && parsed.exercises.length > 0) {
          setActiveWorkout(parsed);
          setDraftRestoredNotice(true);
        }
      }
    } catch (e) {
      console.error("Failed to restore workout draft", e);
    }
  }, [selected?.id]);

  // Auto-save active workout draft to localStorage
  useEffect(() => {
    if (!selected) return;
    try {
      const draftKey = `fitcoach_active_draft_${selected.id}`;
      if (activeWorkout && activeWorkout.exercises && activeWorkout.exercises.length > 0) {
        localStorage.setItem(draftKey, JSON.stringify(activeWorkout));
      } else {
        localStorage.removeItem(draftKey);
      }
    } catch (e) {
      console.error("Failed to auto-save workout draft", e);
    }
  }, [activeWorkout, selected?.id]);

  // Browser level beforeunload warning
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedWorkout) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedWorkout]);

  // In-app navigation guards
  const handleRequestTab = (targetTab: "log" | "history" | "analytics" | "mobility") => {
    if (tab === "log" && targetTab !== "log" && hasUnsavedWorkout) {
      setPendingNavigation({ type: "tab", targetTab });
    } else {
      setTab(targetTab);
    }
  };

  const handleRequestSelectClient = (targetClient: Client) => {
    try {
      localStorage.setItem("fitcoach_last_selected_client_id", targetClient.id);
    } catch {}
    if (selected && selected.id !== targetClient.id && hasUnsavedWorkout) {
      setPendingNavigation({ type: "client", targetClient });
    } else {
      setSelected(targetClient);
    }
  };

  const startWorkout = () => {
    setActiveWorkout({
      startedAt: new Date().toISOString(),
      notes: "",
      exercises: [{ name: "Barbell Bench Press", sets: [{ weight: "", reps: "", notes: "" }] }],
    });
    setDraftRestoredNotice(false);
  };

  const discardActiveWorkout = () => {
    if (!confirm("Are you sure you want to discard this in-progress workout draft?")) return;
    if (selected) {
      try {
        localStorage.removeItem(`fitcoach_active_draft_${selected.id}`);
      } catch {}
    }
    setActiveWorkout(null);
    setDraftRestoredNotice(false);
  };

  const beginPlannedWorkout = (workout: WorkoutSession) => {
    setActiveWorkout({
      plannedWorkoutId: workout.id,
      startedAt: new Date().toISOString(),
      notes: workout.notes || "",
      exercises: workout.exercises.map((ex) => ({
        name: ex.name,
        isBodyweight: ex.isBodyweight || ex.category === "BODYWEIGHT",
        category: ex.category || (ex.isBodyweight ? "BODYWEIGHT" : "STRENGTH"),
        sets: ex.sets.map((s) => ({
          weight: String(s.weight),
          reps: String(s.reps),
          notes: s.notes || "",
        })),
      })),
    });
    setDraftRestoredNotice(false);
  };

  const saveWorkoutPlan = async () => {
    if (!activeWorkout || !selected) return;
    setSavingPlan(true);
    try {
      const payload = {
        clientId: selected.id,
        status: "PLANNED",
        notes: activeWorkout.notes || null,
        exercises: activeWorkout.exercises.map((ex, exIndex) => ({
          name: ex.name,
          order: exIndex,
          isBodyweight: !!ex.isBodyweight,
          category: ex.isBodyweight ? "BODYWEIGHT" : "STRENGTH",
          sets: ex.sets.map((s, sIndex) => ({
            order: sIndex,
            weight: parseFloat(s.weight) || 0,
            reps: parseInt(s.reps, 10) || 0,
            notes: s.notes || null,
          })),
        })),
      };

      if (activeWorkout.plannedWorkoutId) {
        // Update existing planned workout
        const res = await fetch(`/api/workouts/${activeWorkout.plannedWorkoutId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          const updated = await res.json();
          setWorkouts((prev) => prev.map((w) => (w.id === updated.id ? updated : w)));
          try {
            localStorage.removeItem(`fitcoach_active_draft_${selected.id}`);
          } catch {}
          setActiveWorkout(null);
          setDraftRestoredNotice(false);
        } else {
          const err = await res.json().catch(() => null);
          alert(err?.error || "Failed to update workout plan.");
        }
      } else {
        // Create new planned workout
        const res = await fetch("/api/workouts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          const saved = await res.json();
          setWorkouts((prev) => [saved, ...prev]);
          try {
            localStorage.removeItem(`fitcoach_active_draft_${selected.id}`);
          } catch {}
          setActiveWorkout(null);
          setDraftRestoredNotice(false);
        } else {
          const err = await res.json().catch(() => null);
          alert(err?.error || "Failed to save workout plan.");
        }
      }
    } catch {
      alert("Error saving workout plan.");
    } finally {
      setSavingPlan(false);
    }
  };

  const completeWorkout = async () => {
    if (!activeWorkout || !selected) return;
    setSavingWorkout(true);
    try {
      const payload = {
        clientId: selected.id,
        status: "COMPLETED",
        startedAt: activeWorkout.startedAt,
        completedAt: new Date().toISOString(),
        notes: activeWorkout.notes || null,
        plannedWorkoutId: activeWorkout.plannedWorkoutId || null,
        exercises: activeWorkout.exercises.map((ex, exIndex) => ({
          name: ex.name,
          order: exIndex,
          isBodyweight: !!ex.isBodyweight,
          category: ex.isBodyweight ? "BODYWEIGHT" : "STRENGTH",
          sets: ex.sets.map((s, sIndex) => ({
            order: sIndex,
            weight: parseFloat(s.weight) || 0,
            reps: parseInt(s.reps, 10) || 0,
            notes: s.notes || null,
          })),
        })),
      };

      const res = await fetch("/api/workouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const saved = await res.json();
        setWorkouts((prev) => {
          const filtered = activeWorkout.plannedWorkoutId
            ? prev.filter((w) => w.id !== activeWorkout.plannedWorkoutId)
            : prev;
          return [saved, ...filtered];
        });
        try {
          localStorage.removeItem(`fitcoach_active_draft_${selected.id}`);
        } catch {}
        setActiveWorkout(null);
        setDraftRestoredNotice(false);
        setTab("history");
      } else {
        const err = await res.json().catch(() => null);
        alert(err?.error || "Failed to complete workout.");
      }
    } catch {
      alert("Error saving completed workout.");
    } finally {
      setSavingWorkout(false);
    }
  };

  const deleteWorkout = async (workoutId: string) => {
    if (!confirm("Are you sure you want to delete this workout log? A deletion record will be saved.")) return;
    const res = await fetch(`/api/workouts/${workoutId}`, { method: "DELETE" });
    if (res.ok) {
      const data = await res.json();
      if (data.workout) {
        setWorkouts((prev) => prev.map((w) => (w.id === workoutId ? { ...w, ...data.workout } : w)));
      } else {
        setWorkouts((prev) => prev.filter((w) => w.id !== workoutId));
      }
    }
  };

  const handleRepeatWorkout = (workout: WorkoutSession) => {
    const draftExercises: DraftExercise[] = workout.exercises.map((ex) => ({
      name: ex.name,
      category: ex.category || "STRENGTH",
      isBodyweight: ex.isBodyweight || ex.category === "BODYWEIGHT",
      sets: ex.sets.map((s) => ({
        weight: String(s.weight),
        reps: String(s.reps),
        notes: "",
      })),
    }));

    setActiveWorkout({
      startedAt: new Date().toISOString(),
      notes: "",
      exercises: draftExercises,
    });
    setTab("log");
    setDraftRestoredNotice(true);
  };

  return (
    <div className={`app ${isDark ? "dark-theme" : ""}`}>
      <SubscriptionBanner
        subInfo={subInfo}
        onOpenProfile={() => setIsProfileModalOpen(true)}
        onSubscribed={fetchSubscription}
      />

      {/* App Header */}
      {/* App Header */}
      <header className="header">
        <div className="header-left" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <StrkyrLogo size={32} />
          <span className="header-title" style={{ fontWeight: 900, letterSpacing: "-0.03em", color: "#0f172a" }}>
            STRKYR Studio
          </span>
        </div>

        <div className="header-right" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {/* Mobile Hamburger Menu Trigger */}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(true)}
            className="mobile-menu-btn"
            title="Open Mobile Navigation Menu"
          >
            <Menu size={18} />
          </button>

          {/* AI Performance Assistant Primary CTA */}
          <button
            type="button"
            onClick={() => setIsAIChatOpen(true)}
            className="nav-btn"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              color: "#1e40af",
              fontWeight: 700,
              background: "#eff6ff",
              border: "1px solid #bfdbfe",
              cursor: "pointer",
              padding: "6px 12px",
              borderRadius: "8px",
            }}
            title="Ask AI about Athlete Logs, History & Analytics"
          >
            <Sparkles size={15} style={{ color: "#2563eb" }} />
            <span>Ask AI</span>
          </button>

          {/* Unified Studio Menu & Profile */}
          <AppHeaderMenu
            role="TRAINER"
            userName={currentTrainerName || userName || "Trainer"}
            userImage={currentTrainerImage || userImage || session?.user?.image}
            isAdmin={isAdmin || subInfo?.isAdmin}
            onOpenTour={() => setIsTourOpen(true)}
            onOpenCoachGuide={() => setIsCoachWalkthroughOpen(true)}
            onOpenReleaseNotes={() => setIsReleaseNotesOpen(true)}
            onOpenProfile={() => setIsProfileModalOpen(true)}
            onOpenPlateCalculator={() => setIsPlateModalOpen(true)}
            onSwitchToClientView={async () => {
              await fetch("/api/user/role", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ role: "CLIENT" }),
              });
              window.location.href = "/dashboard";
            }}
          />
        </div>
      </header>

      {/* Layout: Sidebar + Main Content */}
      <div className="layout">
        <ClientSidebar
          clients={clients}
          selected={selected}
          loadingClients={loadingClients}
          onSelectClient={handleRequestSelectClient}
          onOpenAddClient={() => setIsAddModalOpen(true)}
          onOpenEditClient={(client) => setEditingClient(client)}
          onDeleteClient={deleteClient}
          onQuickInvite={handleQuickGenerateInvite}
        />

        <main className="main">
          {/* Mobile Client Switcher Bar (Appears on Mobile in place of scrolling sidebar) */}
          <div className="mobile-client-bar">
            <button
              type="button"
              onClick={() => {
                setMobileClientSearch("");
                setShowMobileClientDrawer(true);
              }}
              className="btn-ghost"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                flex: 1,
                minWidth: 0,
                padding: "4px 6px",
                justifyContent: "flex-start",
                textAlign: "left",
              }}
              title="Click to switch client"
            >
              {selected?.image ? (
                <img
                  src={selected.image}
                  alt={selected.name}
                  style={{ width: "30px", height: "30px", borderRadius: "50%", objectFit: "cover", flexShrink: 0, border: "1px solid #cbd5e1" }}
                />
              ) : (
                <div
                  style={{
                    width: "30px",
                    height: "30px",
                    borderRadius: "50%",
                    background: selected?.name === "My Workouts" ? "#eff6ff" : "#f1f5f9",
                    color: selected?.name === "My Workouts" ? "#2563eb" : "#64748b",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "12px",
                    fontWeight: 700,
                    flexShrink: 0,
                    border: "1px solid #e2e8f0",
                  }}
                >
                  {selected?.name ? selected.name.charAt(0).toUpperCase() : <User size={14} />}
                </div>
              )}
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <span style={{ fontSize: "13px", fontWeight: 700, color: "#0f172a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {selected ? selected.name : "Select Client"}
                  </span>
                  <ChevronDown size={14} style={{ color: "#64748b", flexShrink: 0 }} />
                </div>
                <div style={{ fontSize: "11px", color: "#64748b" }}>
                  {clients.length} client{clients.length === 1 ? "" : "s"} · Tap to switch
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="btn-primary"
              style={{ padding: "6px 10px", fontSize: "11px", borderRadius: "8px", height: "auto", flexShrink: 0, gap: "4px" }}
              title="Add a new client"
            >
              <UserPlus size={13} />
              <span>+ Client</span>
            </button>
          </div>

          {!selected ? (
            <div className="placeholder">
              <Dumbbell size={40} className="placeholder-icon" />
              <p>Select a client or add a new one</p>
              <div style={{ display: "flex", gap: "10px", marginTop: "14px", flexWrap: "wrap", justifyContent: "center" }}>
                <Link
                  href="/recovery"
                  className="btn-secondary"
                  style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "13px", padding: "8px 16px" }}
                >
                  <span>Open Recovery</span>
                </Link>
                <Link
                  href="/nutrition"
                  className="btn-secondary"
                  style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "13px", padding: "8px 16px" }}
                >
                  <span>Nutrition &amp; Macros</span>
                </Link>
              </div>
            </div>
          ) : (
            <>
              {/* Client Info Header */}
              <div className="main-header" style={{ flexWrap: "wrap", gap: "14px", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "14px", flex: "1 1 300px" }}>
                  {/* Client Picture in Header */}
                  <div style={{ position: "relative", flexShrink: 0 }}>
                    {selected.image ? (
                      <img
                        src={selected.image}
                        alt={selected.name}
                        referrerPolicy="no-referrer"
                        style={{
                          width: "52px",
                          height: "52px",
                          borderRadius: "50%",
                          objectFit: "cover",
                          border: "2px solid #2563eb",
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: "52px",
                          height: "52px",
                          borderRadius: "50%",
                          background: selected.name.includes("My Workouts") ? "#eff6ff" : "#f1f5f9",
                          color: selected.name.includes("My Workouts") ? "#2563eb" : "#64748b",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "18px",
                          fontWeight: 700,
                          border: "1px solid #cbd5e1",
                        }}
                      >
                        {selected.name.includes("My Workouts") ? <Dumbbell size={22} /> : (selected.name ? selected.name.charAt(0).toUpperCase() : <User size={24} />)}
                      </div>
                    )}
                    {!selected.name.includes("My Workouts") && (
                      <button
                        onClick={() => setEditingClient(selected)}
                        style={{
                          position: "absolute",
                          bottom: "-2px",
                          right: "-2px",
                          background: "#2563eb",
                          color: "#ffffff",
                          width: "20px",
                          height: "20px",
                          borderRadius: "50%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          border: "none",
                          cursor: "pointer",
                          boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                        }}
                        title="Edit client photo and profile"
                      >
                        <Camera size={11} />
                      </button>
                    )}
                  </div>

                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                      <h2 className="client-heading" style={{ margin: 0 }}>{selected.name}</h2>
                      {selected.name !== "My Workouts" && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleQuickGenerateInvite(selected)}
                            disabled={generatingQuickInvite}
                            className="btn-edit-client"
                            style={{
                              background: copiedLink ? "#f0fdf4" : "#eff6ff",
                              color: copiedLink ? "#16a34a" : "#2563eb",
                              borderColor: copiedLink ? "#bbf7d0" : "#bfdbfe",
                              fontWeight: 600,
                            }}
                            title="Generate and copy athlete invite link"
                          >
                            <Link2 size={13} />
                            <span>{copiedLink ? "Link Copied! ✓" : "Copy Invite Link"}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingClient(selected)}
                            className="btn-edit-client"
                            title="Edit client profile and goals"
                          >
                            <Edit3 size={13} />
                            <span>Edit Profile</span>
                          </button>
                        </>
                      )}

                      {/* Weekly Adherence Streak Badge */}
                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: 700,
                          color: "#c2410c",
                          background: "#fff7ed",
                          border: "1px solid #ffedd5",
                          padding: "3px 8px",
                          borderRadius: "12px",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                        title={`${weeklyStreakInfo.thisWeekCount} workouts completed in the last 7 days`}
                      >
                        <Flame size={13} style={{ color: "#ea580c" }} />
                        <span>{weeklyStreakInfo.thisWeekCount} this week</span>
                      </span>
                    </div>

                    {/* Client Meta Badges: Email, Phone, Goals */}
                    <div className="client-header-meta" style={{ marginTop: "4px" }}>
                      {selected.email && (
                        <span className="client-badge" title="Email address">
                          <Mail size={12} />
                          <span>{selected.email}</span>
                        </span>
                      )}
                      {selected.phone && (
                        <span className="client-badge" title="Phone number">
                          <Phone size={12} />
                          <span>{selected.phone}</span>
                        </span>
                      )}
                      {selected.fitnessGoals && (
                        <span className="client-badge" title="Fitness Goals" style={{ background: "#eff6ff", color: "#1d4ed8", borderColor: "#bfdbfe" }}>
                          <Target size={12} />
                          <span>{selected.fitnessGoals}</span>
                        </span>
                      )}
                    </div>

                    {selected.notes && (
                      <p className="client-header-notes" style={{ margin: "6px 0 0 0" }}>
                        <FileText size={12} style={{ display: "inline", verticalAlign: "middle", marginRight: "4px" }} />
                        {selected.notes}
                      </p>
                    )}
                  </div>
                </div>

                {/* Actions: AI Program, Plate Calculator, Export Report, Invite, Tabs */}
                <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                  {/* AI Program Generator */}
                  <button
                    type="button"
                    onClick={() => setIsAIRoutineModalOpen(true)}
                    className="btn-primary"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "5px",
                      fontSize: "12px",
                      padding: "7px 12px",
                      background: "linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)",
                      border: "none",
                      color: "#ffffff",
                    }}
                    title="Generate an AI-periodized workout program"
                  >
                    <Sparkles size={13} />
                    <span>AI Routine</span>
                  </button>

                  {/* Plate Calculator */}
                  <button
                    type="button"
                    onClick={() => setIsPlateModalOpen(true)}
                    className="btn-secondary"
                    style={{ display: "inline-flex", alignItems: "center", gap: "5px", fontSize: "12px", padding: "7px 12px" }}
                    title="Open Barbell Plate Loading Calculator"
                  >
                    <Dumbbell size={13} style={{ color: "#2563eb" }} />
                    <span>Plate Math</span>
                  </button>

                  {/* Export Progress Report */}
                  <button
                    type="button"
                    onClick={() => setIsReportModalOpen(true)}
                    className="btn-secondary"
                    style={{ display: "inline-flex", alignItems: "center", gap: "5px", fontSize: "12px", padding: "7px 12px" }}
                    title="Export CSV and printable progress report"
                  >
                    <Download size={13} />
                    <span>Export Report</span>
                  </button>

                  {selected.name !== "My Workouts" && (
                    <div>
                      {selected.inviteStatus === "ACCEPTED" ? (
                        <span style={{ fontSize: "12px", fontWeight: 600, color: "#15803d", background: "#f0fdf4", padding: "6px 12px", borderRadius: "6px", border: "1px solid #bbf7d0", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                          ✓ Joined Portal (Free)
                        </span>
                      ) : selected.inviteStatus === "PENDING" && getInviteUrl(selected) ? (
                        <button
                          onClick={() => copyLink(getInviteUrl(selected)!)}
                          className="btn-primary"
                          style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "12px", padding: "8px 14px" }}
                        >
                          {copiedLink ? <Check size={14} /> : <Copy size={14} />}
                          <span>{copiedLink ? "Link Copied!" : "Copy Invite Link"}</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleQuickGenerateInvite(selected)}
                          disabled={generatingQuickInvite}
                          className="btn-secondary"
                          style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "12px", padding: "8px 14px" }}
                        >
                          <Link2 size={14} />
                          <span>{generatingQuickInvite ? "Generating..." : "Generate Invite Link"}</span>
                        </button>
                      )}
                    </div>
                  )}

                  {/* Tabs */}
                  <div className="tabs">
                    {(["log", "history", "analytics", "mobility"] as const).map((currentTab) => (
                      <button
                        key={currentTab}
                        className={`tab${tab === currentTab ? " active" : ""}`}
                        onClick={() => handleRequestTab(currentTab)}
                      >
                        {currentTab === "mobility" ? "Recovery" : currentTab.charAt(0).toUpperCase() + currentTab.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Tab Content */}
              {tab === "log" && (
                <WorkoutBuilder
                  activeWorkout={activeWorkout}
                  setActiveWorkout={setActiveWorkout}
                  exercisePicker={exercisePicker}
                  setExercisePicker={setExercisePicker}
                  plannedWorkouts={plannedWorkouts}
                  historyWorkouts={completedWorkouts}
                  savingPlan={savingPlan}
                  savingWorkout={savingWorkout}
                  draftRestored={draftRestoredNotice}
                  onClearDraftNotice={() => setDraftRestoredNotice(false)}
                  onStartWorkout={startWorkout}
                  onBeginPlannedWorkout={beginPlannedWorkout}
                  onEditPlannedWorkout={beginPlannedWorkout}
                  onSaveWorkoutPlan={saveWorkoutPlan}
                  onCompleteWorkout={completeWorkout}
                  onDiscardWorkout={discardActiveWorkout}
                  onDeleteWorkout={deleteWorkout}
                />
              )}

              {tab === "history" && (
                <WorkoutHistory
                  completedWorkouts={completedWorkouts}
                  loadingWorkouts={loadingWorkouts}
                  onDeleteWorkout={deleteWorkout}
                  onRepeatWorkout={handleRepeatWorkout}
                />
              )}

              {tab === "analytics" && (
                <AnalyticsView analytics={analytics} />
              )}

              {tab === "mobility" && (
                <MobilityTab
                  clientId={selected.id}
                  clientName={selected.name}
                  clientsList={clients.map((c) => ({ id: c.id, name: c.name }))}
                  isTrainer={true}
                  onLogCompletedRoutine={(newWorkout) => {
                    setWorkouts((prev) => [newWorkout, ...prev]);
                  }}
                  recentWorkoutExercises={
                    completedWorkouts.length > 0
                      ? completedWorkouts[0].exercises.map((ex) => ({ name: ex.name, category: ex.category }))
                      : undefined
                  }
                />
              )}
            </>
          )}
        </main>
      </div>

      {/* Add Client Modal */}
      <ClientModal
        isOpen={isAddModalOpen}
        mode="add"
        onClose={() => setIsAddModalOpen(false)}
        onSave={handleAddClient}
      />

      {/* Edit Client Modal */}
      <ClientModal
        isOpen={!!editingClient}
        mode="edit"
        client={editingClient}
        onClose={() => setEditingClient(null)}
        onSave={handleEditClient}
        onDelete={deleteClient}
        onInviteGenerated={handleInviteGenerated}
      />

      {/* Trainer Profile & Billing Modal */}
      <TrainerProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        subInfo={subInfo}
        onProfileUpdated={() => {
          fetchSubscription();
          fetchTrainerProfile();
          fetchClients();
        }}
      />

      {/* Progress Report Export Modal */}
      <ReportExportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        client={selected}
        workouts={workouts}
      />

      {/* Mobile Client Switcher Drawer */}
      {showMobileClientDrawer && (
        <div className="client-modal-backdrop" onClick={() => setShowMobileClientDrawer(false)}>
          <div className="client-modal-card" style={{ maxWidth: "440px" }} onClick={(e) => e.stopPropagation()}>
            <div className="client-modal-header">
              <div className="client-modal-header-info">
                <h2 className="client-modal-title">Select Client</h2>
                <p className="client-modal-subtitle">Switch active roster profile or add a client.</p>
              </div>
              <button className="client-modal-close" onClick={() => setShowMobileClientDrawer(false)}>
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: "14px 16px 20px" }}>
              {/* Search Bar */}
              <div style={{ position: "relative", marginBottom: "12px" }}>
                <Search size={15} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
                <input
                  type="text"
                  className="input"
                  placeholder="Search clients..."
                  value={mobileClientSearch}
                  onChange={(e) => setMobileClientSearch(e.target.value)}
                  style={{ paddingLeft: "32px", fontSize: "13px", height: "38px" }}
                />
              </div>

              {/* Quick Add Client Button */}
              <button
                type="button"
                onClick={() => {
                  setShowMobileClientDrawer(false);
                  setIsAddModalOpen(true);
                }}
                className="btn-primary"
                style={{ width: "100%", justifyContent: "center", marginBottom: "12px", padding: "8px 12px", fontSize: "12px", gap: "6px" }}
              >
                <UserPlus size={14} />
                <span>+ Add New Client</span>
              </button>

              {/* Client List */}
              <div style={{ maxHeight: "320px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "6px" }}>
                {filteredMobileClients.map((client) => {
                  const isSelected = selected?.id === client.id;
                  const isSelfProfile = client.name === "My Workouts";
                  const isAccepted = client.inviteStatus === "ACCEPTED";

                  return (
                    <div
                      key={client.id}
                      onClick={() => {
                        handleRequestSelectClient(client);
                        setShowMobileClientDrawer(false);
                      }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "10px 12px",
                        borderRadius: "10px",
                        border: isSelected ? "2px solid #2563eb" : "1px solid #e2e8f0",
                        background: isSelected ? "#eff6ff" : "#f8fafc",
                        cursor: "pointer",
                        transition: "all 0.15s",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
                        {client.image ? (
                          <img
                            src={client.image}
                            alt={client.name}
                            style={{ width: "34px", height: "34px", borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
                          />
                        ) : (
                          <div
                            style={{
                              width: "34px",
                              height: "34px",
                              borderRadius: "50%",
                              background: isSelfProfile ? "#dbeafe" : "#e2e8f0",
                              color: isSelfProfile ? "#1d4ed8" : "#475569",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "13px",
                              fontWeight: 700,
                              flexShrink: 0,
                            }}
                          >
                            {client.name ? client.name.charAt(0).toUpperCase() : <User size={16} />}
                          </div>
                        )}

                        <div style={{ minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <span style={{ fontSize: "13px", fontWeight: 700, color: "#0f172a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                              {client.name}
                            </span>
                            {isSelfProfile ? (
                              <span style={{ fontSize: "10px", fontWeight: 600, color: "#2563eb", background: "#eff6ff", padding: "1px 5px", borderRadius: "4px" }}>
                                Self
                              </span>
                            ) : isAccepted ? (
                              <span style={{ fontSize: "10px", fontWeight: 600, color: "#15803d", background: "#f0fdf4", padding: "1px 5px", borderRadius: "4px" }}>
                                Active
                              </span>
                            ) : null}
                          </div>

                          <div style={{ fontSize: "11px", color: "#64748b", marginTop: "1px" }}>
                            {client._count?.workoutSessions ?? 0} workouts {client.fitnessGoals ? `· ${client.fitnessGoals}` : ""}
                          </div>
                        </div>
                      </div>

                      {isSelected && (
                        <div style={{ color: "#2563eb", display: "flex", alignItems: "center", flexShrink: 0 }}>
                          <Check size={18} />
                        </div>
                      )}
                    </div>
                  );
                })}

                {filteredMobileClients.length === 0 && (
                  <div className="empty-state" style={{ padding: "20px" }}>
                    No clients found matching &ldquo;{mobileClientSearch}&rdquo;
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Guard: Unsaved Workout Alert Modal */}
      {pendingNavigation && (
        <div className="client-modal-backdrop" onClick={() => setPendingNavigation(null)}>
          <div className="client-modal-card" style={{ maxWidth: "440px" }} onClick={(e) => e.stopPropagation()}>
            <div className="client-modal-header" style={{ background: "#fffbeb", borderBottom: "1px solid #fef3c7" }}>
              <div className="client-modal-header-info">
                <h2 className="client-modal-title" style={{ display: "flex", alignItems: "center", gap: "8px", color: "#b45309" }}>
                  <AlertTriangle size={18} />
                  <span>Active Workout In Progress</span>
                </h2>
                <p className="client-modal-subtitle" style={{ color: "#92400e" }}>
                  You have an in-progress workout for {selected?.name || "this client"}.
                </p>
              </div>
              <button className="client-modal-close" onClick={() => setPendingNavigation(null)}>
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: "20px" }}>
              <p style={{ fontSize: "13px", color: "#475569", lineHeight: 1.5, margin: "0 0 18px 0" }}>
                Your reps, weights, and sets are <b>safely saved to session storage</b>. How would you like to proceed?
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <button
                  type="button"
                  className="btn-primary"
                  style={{ width: "100%", justifyContent: "center", padding: "10px 16px", fontSize: "13px" }}
                  onClick={() => {
                    setPendingNavigation(null);
                    setTab("log");
                  }}
                >
                  Stay on Workout
                </button>

                <button
                  type="button"
                  className="btn-secondary"
                  style={{ width: "100%", justifyContent: "center", padding: "10px 16px", fontSize: "13px" }}
                  onClick={() => {
                    const nav = pendingNavigation;
                    setPendingNavigation(null);
                    if (nav.type === "tab" && nav.targetTab) {
                      setTab(nav.targetTab);
                    } else if (nav.type === "client" && nav.targetClient) {
                      setSelected(nav.targetClient);
                    }
                  }}
                >
                  Keep Draft &amp; Continue
                </button>

                <button
                  type="button"
                  className="btn-ghost-danger"
                  style={{ width: "100%", justifyContent: "center", padding: "8px 16px", fontSize: "12px", border: "1px solid #fee2e2" }}
                  onClick={() => {
                    const nav = pendingNavigation;
                    if (selected) {
                      try {
                        localStorage.removeItem(`fitcoach_active_draft_${selected.id}`);
                      } catch {}
                    }
                    setActiveWorkout(null);
                    setDraftRestoredNotice(false);
                    setPendingNavigation(null);
                    if (nav.type === "tab" && nav.targetTab) {
                      setTab(nav.targetTab);
                    } else if (nav.type === "client" && nav.targetClient) {
                      setSelected(nav.targetClient);
                    }
                  }}
                >
                  Discard Draft &amp; Switch
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Plate Loading Calculator Modal */}
      {isPlateModalOpen && (
        <PlateCalculatorModal
          initialWeight={135}
          onClose={() => setIsPlateModalOpen(false)}
        />
      )}

      {/* AI Workout Routine Generator Modal */}
      {isAIRoutineModalOpen && (
        <AIRoutineGeneratorModal
          onClose={() => setIsAIRoutineModalOpen(false)}
          onImportRoutine={handleImportAIRoutine}
        />
      )}

      {/* Release Notes & Changelog Modal */}
      <ReleaseNotesModal
        isOpen={isReleaseNotesOpen}
        onClose={() => setIsReleaseNotesOpen(false)}
      />

      {/* Coach-Governed AI Platform Walkthrough Modal */}
      <CoachWalkthroughModal
        isOpen={isCoachWalkthroughOpen}
        onClose={() => setIsCoachWalkthroughOpen(false)}
      />

      {/* Graphical Dashboard Tour Modal */}
      <DashboardTourModal
        role="TRAINER"
        isOpen={isTourOpen}
        onClose={() => setIsTourOpen(false)}
      />

      {/* AI Performance Assistant Chat Drawer */}
      <AIChatDrawer
        role="TRAINER"
        isOpen={isAIChatOpen}
        onClose={() => setIsAIChatOpen(false)}
        clients={clients}
        selectedClient={selected}
        onSelectClient={handleRequestSelectClient}
      />

      {/* Mobile Slide-Out Navigation Drawer */}
      <MobileNavDrawer
        role="TRAINER"
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        userName={userName}
        userImage={userImage}
        isAdmin={isAdmin || subInfo?.isAdmin}
        onOpenTour={() => setIsTourOpen(true)}
        onOpenCoachGuide={() => setIsCoachWalkthroughOpen(true)}
        onOpenReleaseNotes={() => setIsReleaseNotesOpen(true)}
        onOpenProfile={() => setIsProfileModalOpen(true)}
      />
    </div>
  );
}

export default Dashboard;
