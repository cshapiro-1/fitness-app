"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { signOut } from "next-auth/react";
import { Dumbbell, LogOut, Edit3, Check, Copy, ShieldCheck, Mail, Phone, Target, FileText, Link2 } from "lucide-react";
import Link from "next/link";
import { Client, WorkoutSession, DraftWorkout } from "./types";
import { computeAnalytics } from "./utils/analytics";
import { ClientSidebar } from "./components/ClientSidebar";
import { ClientModal } from "./components/ClientModal";
import { WorkoutBuilder } from "./components/WorkoutBuilder";
import { WorkoutHistory } from "./components/WorkoutHistory";
import { AnalyticsView } from "./components/AnalyticsView";
import { SubscriptionBanner, SubscriptionInfo } from "./components/SubscriptionBanner";

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

  // Client Modals State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [generatingQuickInvite, setGeneratingQuickInvite] = useState(false);

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
    fetchClients();
  }, [fetchSubscription, fetchClients]);

  useEffect(() => {
    if (selected) fetchWorkouts(selected.id);
    else setWorkouts([]);
  }, [selected, fetchWorkouts]);

  const handleAddClient = async (clientData: {
    name: string;
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

  const handleInviteGenerated = (updatedClient: Client) => {
    setClients((prev) => prev.map((c) => (c.id === updatedClient.id ? { ...c, ...updatedClient } : c)));
    setSelected((prev) => (prev?.id === updatedClient.id ? { ...prev, ...updatedClient } : prev));
    if (editingClient?.id === updatedClient.id) {
      setEditingClient(updatedClient);
    }
  };

  const handleQuickGenerateInvite = async (client: Client) => {
    setGeneratingQuickInvite(true);
    try {
      const res = await fetch("/api/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId: client.id }),
      });
      if (res.ok) {
        const data = await res.json();
        const updated = {
          ...client,
          inviteToken: data.inviteToken || data.token,
          inviteUrl: data.inviteUrl,
          inviteStatus: "PENDING" as const,
        };
        handleInviteGenerated(updated);
        copyLink(data.inviteUrl);
      }
    } catch {
      alert("Failed to generate invite link");
    } finally {
      setGeneratingQuickInvite(false);
    }
  };

  const copyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const deleteClient = async (id: string) => {
    if (!confirm("Delete this client and all workout history?")) return;
    await fetch(`/api/clients/${id}`, { method: "DELETE" });
    setClients((prev) => prev.filter((client) => client.id !== id));
    if (selected?.id === id) {
      const next = clients.find((client) => client.id !== id) ?? null;
      setSelected(next);
    }
  };

  const startWorkout = () => {
    setActiveWorkout({ startedAt: new Date().toISOString(), notes: "", exercises: [], plannedWorkoutId: null });
    setExercisePicker("");
    setTab("log");
  };

  const beginPlannedWorkout = async (workout: WorkoutSession) => {
    if (workout.status === "PLANNED") {
      const res = await fetch(`/api/workouts/${workout.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "IN_PROGRESS",
          startedAt: new Date().toISOString(),
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        alert(body?.error || "Unable to begin workout");
        return;
      }
    }

    setActiveWorkout({
      startedAt: workout.startedAt || new Date().toISOString(),
      notes: workout.notes || "",
      plannedWorkoutId: workout.id,
      exercises: workout.exercises.map((exercise) => ({
        name: exercise.name,
        sets: exercise.sets.map((setEntry) => ({
          weight: String(setEntry.weight),
          reps: String(setEntry.reps),
          notes: setEntry.notes || "",
        })),
      })),
    });

    setTab("log");
    fetchWorkouts(workout.clientId);
  };

  const saveWorkoutPlan = async () => {
    if (!selected || !activeWorkout) return;

    const normalizedExercises = activeWorkout.exercises
      .map((exercise, exerciseIndex) => ({
        name: exercise.name.trim(),
        order: exerciseIndex,
        sets: exercise.sets
          .map((setEntry, setIndex) => ({
            order: setIndex,
            weight: setEntry.weight !== "" ? Number(setEntry.weight) : 0,
            reps: setEntry.reps !== "" ? Number(setEntry.reps) : 0,
            notes: setEntry.notes.trim() || "",
          }))
          .filter((setEntry) => !isNaN(setEntry.weight) && setEntry.weight >= 0 && !isNaN(setEntry.reps) && setEntry.reps > 0),
      }))
      .filter((exercise) => exercise.name && exercise.sets.length > 0);

    if (!normalizedExercises.length) {
      alert("Add at least one exercise with a valid number of reps before saving.");
      return;
    }

    setSavingPlan(true);
    const now = new Date().toISOString();
    const res = await fetch("/api/workouts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientId: selected.id,
        status: "PLANNED",
        startedAt: activeWorkout.startedAt || now,
        completedAt: null,
        notes: activeWorkout.notes.trim() || "",
        exercises: normalizedExercises,
      }),
    });

    if (res.ok) {
      const plannedWorkout = await res.json();
      setWorkouts((prev) => [plannedWorkout, ...prev]);
      setActiveWorkout(null);
      setExercisePicker("");
      fetchClients();
    } else {
      const body = await res.json().catch(() => null);
      alert(body?.error || "Could not save workout plan");
    }

    setSavingPlan(false);
  };

  const completeWorkout = async () => {
    if (!selected || !activeWorkout) return;

    const normalizedExercises = activeWorkout.exercises
      .map((exercise, exerciseIndex) => ({
        name: exercise.name.trim(),
        order: exerciseIndex,
        sets: exercise.sets
          .map((setEntry, setIndex) => ({
            order: setIndex,
            weight: setEntry.weight !== "" ? Number(setEntry.weight) : 0,
            reps: setEntry.reps !== "" ? Number(setEntry.reps) : 0,
            notes: setEntry.notes.trim() || "",
          }))
          .filter((setEntry) => !isNaN(setEntry.weight) && setEntry.weight >= 0 && !isNaN(setEntry.reps) && setEntry.reps > 0),
      }))
      .filter((exercise) => exercise.name && exercise.sets.length > 0);

    if (!normalizedExercises.length) {
      alert("Add at least one exercise with a valid number of reps before completing.");
      return;
    }

    setSavingWorkout(true);
    const now = new Date().toISOString();

    const endpoint = activeWorkout.plannedWorkoutId
      ? `/api/workouts/${activeWorkout.plannedWorkoutId}`
      : "/api/workouts";
    const method = activeWorkout.plannedWorkoutId ? "PATCH" : "POST";

    const res = await fetch(endpoint, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientId: selected.id,
        status: "COMPLETED",
        startedAt: activeWorkout.startedAt || now,
        completedAt: now,
        notes: activeWorkout.notes.trim() || "",
        exercises: normalizedExercises,
      }),
    });

    if (res.ok) {
      const createdWorkout = await res.json();
      setWorkouts((prev) => {
        const withoutCurrent = activeWorkout.plannedWorkoutId
          ? prev.filter((workout) => workout.id !== activeWorkout.plannedWorkoutId)
          : prev;
        return [createdWorkout, ...withoutCurrent];
      });
      setActiveWorkout(null);
      setExercisePicker("");
      setTab("history");
      fetchClients();
    } else {
      const body = await res.json().catch(() => null);
      alert(body?.error || "Could not complete workout");
    }

    setSavingWorkout(false);
  };

  const deleteWorkout = async (id: string) => {
    await fetch(`/api/workouts/${id}`, { method: "DELETE" });
    setWorkouts((prev) => prev.filter((workout) => workout.id !== id));
    fetchClients();
  };

  const completedWorkouts = useMemo(() => workouts.filter((workout) => workout.status === "COMPLETED"), [workouts]);
  const plannedWorkouts = useMemo(
    () => workouts.filter((workout) => workout.status === "PLANNED" || workout.status === "IN_PROGRESS"),
    [workouts],
  );

  const analytics = useMemo(() => computeAnalytics(completedWorkouts), [completedWorkouts]);

  const getInviteUrl = (client: Client) => {
    if (client.inviteUrl) return client.inviteUrl;
    if (client.inviteToken) {
      const baseUrl = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
      return `${baseUrl}/invite/${client.inviteToken}`;
    }
    return null;
  };

  return (
    <div className="app">
      <SubscriptionBanner subInfo={subInfo} onSubscribed={fetchSubscription} />

      {/* App Header */}
      <header className="header">
        <div className="header-left">
          <Dumbbell size={22} />
          <span className="header-title">Fitness Tracker</span>
        </div>
        <div className="header-right" style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <Link href="/onboarding" style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", fontWeight: 600, background: "#f1f5f9", color: "#475569", padding: "6px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", textDecoration: "none" }}>
            <span className="hide-mobile">Switch Role</span>
          </Link>
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

          {userImage && <img src={userImage} className="avatar" alt="" />}
          <span className="header-name">{userName}</span>
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
              <div className="main-header" style={{ flexWrap: "wrap", gap: "12px", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ flex: "1 1 300px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                    <h2 className="client-heading">{selected.name}</h2>
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
                  </div>

                  {/* Client Meta Badges: Email, Phone, Goals */}
                  <div className="client-header-meta">
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
                    <p className="client-header-notes">
                      <FileText size={12} style={{ display: "inline", verticalAlign: "middle", marginRight: "4px" }} />
                      {selected.notes}
                    </p>
                  )}
                </div>

                {/* Invite Link & Action Bar */}
                <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                  {selected.name !== "My Workouts" && (
                    <div>
                      {selected.inviteStatus === "ACCEPTED" ? (
                        <span style={{ fontSize: "12px", fontWeight: 600, color: "#15803d", background: "#f0fdf4", padding: "6px 12px", borderRadius: "6px", border: "1px solid #bbf7d0", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                          ✓ Joined Portal
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
    </div>
  );
}
