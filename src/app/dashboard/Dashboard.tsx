"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { signOut } from "next-auth/react";
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
} from "lucide-react";
import Link from "next/link";
import { Client, WorkoutSession, DraftWorkout } from "./types";
import { computeAnalytics } from "./utils/analytics";
import { ClientSidebar } from "./components/ClientSidebar";
import { ClientModal } from "./components/ClientModal";
import { WorkoutBuilder } from "./components/WorkoutBuilder";
import { WorkoutHistory } from "./components/WorkoutHistory";
import { AnalyticsView } from "./components/AnalyticsView";
import { SubscriptionBanner, SubscriptionInfo } from "./components/SubscriptionBanner";
import { TrainerProfileModal } from "./components/TrainerProfileModal";
import { ReportExportModal } from "./components/ReportExportModal";

export interface ExtendedSubscriptionInfo extends SubscriptionInfo {
  isAdmin?: boolean;
}

export function Dashboard({ userName, userImage }: { userName: string; userImage: string | null }) {
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
  const [copiedLink, setCopiedLink] = useState(false);
  const [generatingQuickInvite, setGeneratingQuickInvite] = useState(false);

  // Dark Theme
  const [isDark, setIsDark] = useState(false);

  const [currentTrainerImage, setCurrentTrainerImage] = useState<string | null>(userImage);
  const [currentTrainerName, setCurrentTrainerName] = useState<string>(userName);

  const [tab, setTab] = useState<"log" | "history" | "analytics">("log");

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
      if (data.length && !selected) setSelected(data[0]);
    }
    setLoadingClients(false);
  }, [selected]);

  const fetchWorkouts = useCallback(async (clientId: string) => {
    setLoadingWorkouts(true);
    const res = await fetch(`/api/workouts?clientId=${clientId}`);
    if (res.ok) setWorkouts(await res.json());
    else setWorkouts([]);
    setLoadingWorkouts(false);
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
  }) => {
    const res = await fetch("/api/clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(clientData),
    });

    if (res.ok) {
      const created = await res.json();
      setClients((prev) => [created, ...prev]);
      setSelected(created);
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
        const updated = { ...client, inviteToken: data.inviteToken, inviteStatus: "PENDING" as const };
        setClients((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
        setSelected(updated);
        copyLink(`${window.location.origin}/invite/${data.inviteToken}`);
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
    if (!client.inviteToken) return null;
    if (typeof window !== "undefined") {
      return `${window.location.origin}/invite/${client.inviteToken}`;
    }
    return `/invite/${client.inviteToken}`;
  };

  const completedWorkouts = useMemo(() => workouts.filter((w) => w.status === "COMPLETED"), [workouts]);
  const plannedWorkouts = useMemo(() => workouts.filter((w) => w.status === "PLANNED" || w.status === "IN_PROGRESS"), [workouts]);
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

  const startWorkout = () => {
    setActiveWorkout({
      startedAt: new Date().toISOString(),
      notes: "",
      exercises: [{ name: "Barbell Bench Press", sets: [{ weight: "", reps: "", notes: "" }] }],
    });
  };

  const beginPlannedWorkout = (workout: WorkoutSession) => {
    setActiveWorkout({
      plannedWorkoutId: workout.id,
      startedAt: new Date().toISOString(),
      notes: workout.notes || "",
      exercises: workout.exercises.map((ex) => ({
        name: ex.name,
        sets: ex.sets.map((s) => ({
          weight: String(s.weight),
          reps: String(s.reps),
          notes: s.notes || "",
        })),
      })),
    });
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
        setWorkouts((prev) => [saved, ...prev]);
        setActiveWorkout(null);
      } else {
        const err = await res.json().catch(() => null);
        alert(err?.error || "Failed to save workout plan.");
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
        setActiveWorkout(null);
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
    if (!confirm("Are you sure you want to delete this workout log?")) return;
    const res = await fetch(`/api/workouts/${workoutId}`, { method: "DELETE" });
    if (res.ok) {
      setWorkouts((prev) => prev.filter((w) => w.id !== workoutId));
    }
  };

  return (
    <div className={`app ${isDark ? "dark-theme" : ""}`}>
      <SubscriptionBanner
        subInfo={subInfo}
        onOpenProfile={() => setIsProfileModalOpen(true)}
        onSubscribed={fetchSubscription}
      />

      {/* App Header */}
      <header className="header">
        <div className="header-left">
          <Dumbbell size={22} />
          <span className="header-title">Fitness Tracker</span>
        </div>

        <div className="header-right" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {/* Switch Role Button */}
          <Link
            href="/onboarding"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              fontSize: "12px",
              fontWeight: 600,
              background: "#f1f5f9",
              color: "#475569",
              padding: "6px 12px",
              borderRadius: "6px",
              border: "1px solid #cbd5e1",
              textDecoration: "none",
            }}
          >
            <span className="hide-mobile">Switch Role</span>
          </Link>

          {/* Admin Portal Button */}
          {subInfo?.isAdmin && (
            <Link
              href="/admin"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "4px",
                fontSize: "12px",
                fontWeight: 600,
                background: "#0f172a",
                color: "#38bdf8",
                padding: "6px 12px",
                borderRadius: "6px",
                border: "1px solid #1e293b",
                textDecoration: "none",
              }}
            >
              <ShieldCheck size={15} />
              <span>Admin Portal</span>
            </Link>
          )}

          {/* Profile & Billing Action Button */}
          <button
            type="button"
            onClick={() => setIsProfileModalOpen(true)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "12px",
              fontWeight: 600,
              background: "#2563eb",
              color: "#ffffff",
              padding: "6px 12px",
              borderRadius: "6px",
              border: "none",
              cursor: "pointer",
            }}
          >
            <CreditCard size={14} />
            <span className="hide-mobile">Profile &amp; Billing</span>
          </button>

          {/* Trainer Avatar & Name */}
          <div
            onClick={() => setIsProfileModalOpen(true)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              cursor: "pointer",
              padding: "2px 6px",
              borderRadius: "20px",
              background: "rgba(0,0,0,0.03)",
            }}
            title="Click to view Trainer Profile & Billing"
          >
            {currentTrainerImage ? (
              <img
                src={currentTrainerImage}
                className="avatar"
                alt={currentTrainerName}
                style={{ width: "30px", height: "30px", borderRadius: "50%", objectFit: "cover", border: "1px solid #cbd5e1" }}
              />
            ) : (
              <div
                style={{
                  width: "30px",
                  height: "30px",
                  borderRadius: "50%",
                  background: "#2563eb",
                  color: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "12px",
                  fontWeight: 700,
                }}
              >
                {currentTrainerName ? currentTrainerName.charAt(0).toUpperCase() : <User size={16} />}
              </div>
            )}
            <span className="header-name" style={{ fontWeight: 600, fontSize: "13px" }}>
              {currentTrainerName}
            </span>
          </div>

          {/* Sign Out */}
          <button className="signout-btn" onClick={() => signOut({ callbackUrl: "/auth/signin" })} title="Sign out">
            <LogOut size={16} />
          </button>
        </div>
      </header>

      {/* Layout: Sidebar + Main Content */}
      <div className="layout">
        <ClientSidebar
          clients={clients}
          selected={selected}
          loadingClients={loadingClients}
          onSelectClient={setSelected}
          onOpenAddClient={() => setIsAddModalOpen(true)}
          onOpenEditClient={(client) => setEditingClient(client)}
          onDeleteClient={deleteClient}
        />

        <main className="main">
          {!selected ? (
            <div className="placeholder">
              <Dumbbell size={40} className="placeholder-icon" />
              <p>Select a client or add a new one</p>
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
                          background: selected.name === "My Workouts" ? "#eff6ff" : "#f1f5f9",
                          color: selected.name === "My Workouts" ? "#2563eb" : "#64748b",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "18px",
                          fontWeight: 700,
                          border: "1px solid #cbd5e1",
                        }}
                      >
                        {selected.name ? selected.name.charAt(0).toUpperCase() : <User size={24} />}
                      </div>
                    )}
                    {selected.name !== "My Workouts" && (
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
                        <button
                          onClick={() => setEditingClient(selected)}
                          className="btn-edit-client"
                          title="Edit client profile and goals"
                        >
                          <Edit3 size={13} />
                          <span>Edit Profile</span>
                        </button>
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

                {/* Actions: Export Report, Invite, Tabs */}
                <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
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
                    {(["log", "history", "analytics"] as const).map((currentTab) => (
                      <button key={currentTab} className={`tab${tab === currentTab ? " active" : ""}`} onClick={() => setTab(currentTab)}>
                        {currentTab.charAt(0).toUpperCase() + currentTab.slice(1)}
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
                  onStartWorkout={startWorkout}
                  onBeginPlannedWorkout={beginPlannedWorkout}
                  onSaveWorkoutPlan={saveWorkoutPlan}
                  onCompleteWorkout={completeWorkout}
                />
              )}

              {tab === "history" && (
                <WorkoutHistory
                  completedWorkouts={completedWorkouts}
                  loadingWorkouts={loadingWorkouts}
                  onDeleteWorkout={deleteWorkout}
                />
              )}

              {tab === "analytics" && (
                <AnalyticsView analytics={analytics} />
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
    </div>
  );
}

export default Dashboard;
