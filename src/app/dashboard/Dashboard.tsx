"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { signOut } from "next-auth/react";
import { Dumbbell, LogOut, Edit3, Check, Copy, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { Client, WorkoutSession, DraftWorkout } from "./types";
import { computeAnalytics } from "./utils/analytics";
import { ClientSidebar } from "./components/ClientSidebar";
import { EditClientModal } from "./components/EditClientModal";
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

  // Client Creation Form
  const [newName, setNewName] = useState("");
  const [newNotes, setNewNotes] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [createdInviteUrl, setCreatedInviteUrl] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Client Editing Modal
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [editName, setEditName] = useState("");
  const [editNotes, setEditNotes] = useState("");

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

  const handleClientUpdated = useCallback((updatedClient: Client) => {
    setClients((prev) => prev.map((c) => (c.id === updatedClient.id ? { ...c, ...updatedClient } : c)));
    setSelected((prev) => (prev?.id === updatedClient.id ? { ...prev, ...updatedClient } : prev));
    if (editingClient?.id === updatedClient.id) {
      setEditingClient((prev) => (prev ? { ...prev, ...updatedClient } : prev));
    }
  }, [editingClient]);

  const addClient = async () => {
    if (!newName.trim()) {
      setFormError("Client name is required.");
      return;
    }

    setFormError(null);
    setCreatedInviteUrl(null);

    const res = await fetch("/api/clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim(), notes: newNotes.trim() || null }),
    });

    if (res.ok) {
      const client = await res.json();
      const inviteUrl = client.inviteUrl || (client.inviteToken ? `${window.location.origin}/invite/${client.inviteToken}` : null);
      const clientWithInvite = { ...client, inviteUrl };

      setClients((prev) => [clientWithInvite, ...prev]);
      setSelected(clientWithInvite);
      setNewName("");
      setNewNotes("");

      if (inviteUrl) {
        setCreatedInviteUrl(inviteUrl);
      }
      return;
    }

    const body = await res.json().catch(() => null);
    setFormError(body?.error || "Unable to add this client right now.");
    fetchSubscription();
  };

  const handleSaveEdit = (updatedClient?: Client) => {
    if (updatedClient) {
      handleClientUpdated(updatedClient);
    }
    setEditingClient(null);
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
      alert("Add at least one exercise with a valid number of reps before completing the workout.");
      return;
    }

    setSavingWorkout(true);
    const now = new Date().toISOString();
    const res = await fetch(activeWorkout.plannedWorkoutId ? `/api/workouts/${activeWorkout.plannedWorkoutId}` : "/api/workouts", {
      method: activeWorkout.plannedWorkoutId ? "PATCH" : "POST",
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

      <div className="layout">
        <ClientSidebar
          clients={clients}
          selected={selected}
          loadingClients={loadingClients}
          onSelectClient={setSelected}
          onAddClient={addClient}
          onDeleteClient={deleteClient}
          newName={newName}
          setNewName={setNewName}
          newNotes={newNotes}
          setNewNotes={setNewNotes}
          formError={formError}
          createdInviteUrl={createdInviteUrl}
          copiedLink={copiedLink}
          onCopyLink={copyLink}
        />

        <main className="main">
          {!selected ? (
            <div className="placeholder">
              <Dumbbell size={40} className="placeholder-icon" />
              <p>Select a client or add a new one</p>
            </div>
          ) : (
            <>
              <div className="main-header" style={{ flexWrap: "wrap", gap: "12px", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <h2 className="client-heading">{selected.name}</h2>
                    {selected.name !== "My Workouts" && (
                      <button
                        onClick={() => {
                          setEditingClient(selected);
                          setEditName(selected.name);
                          setEditNotes(selected.notes || "");
                        }}
                        style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", background: "#f1f5f9", border: "1px solid #cbd5e1", padding: "4px 8px", borderRadius: "6px", cursor: "pointer", color: "#475569" }}
                      >
                        <Edit3 size={13} />
                        <span>Edit</span>
                      </button>
                    )}
                  </div>
                  {selected.notes && <p style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>{selected.notes}</p>}
                </div>

                {/* Text Invite Link Bar */}
                {selected.name !== "My Workouts" && (
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    {selected.inviteStatus === "ACCEPTED" ? (
                      <span style={{ fontSize: "12px", fontWeight: 600, color: "#16a34a", background: "#f0fdf4", padding: "6px 12px", borderRadius: "6px", border: "1px solid #bbf7d0" }}>
                        ✓ Joined
                      </span>
                    ) : (
                      getInviteUrl(selected) && (
                        <button
                          onClick={() => copyLink(getInviteUrl(selected)!)}
                          style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", fontWeight: 600, background: "#2563eb", color: "#fff", padding: "8px 14px", borderRadius: "6px", border: "none", cursor: "pointer" }}
                        >
                          {copiedLink ? <Check size={14} /> : <Copy size={14} />}
                          <span>{copiedLink ? "Link Copied!" : "Copy Invite Link to Text"}</span>
                        </button>
                      )
                    )}
                  </div>
                )}

                <div className="tabs">
                  {(["log", "history", "analytics"] as const).map((currentTab) => (
                    <button key={currentTab} className={`tab${tab === currentTab ? " active" : ""}`} onClick={() => setTab(currentTab)}>
                      {currentTab.charAt(0).toUpperCase() + currentTab.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {tab === "log" && (
                <WorkoutBuilder
                  activeWorkout={activeWorkout}
                  setActiveWorkout={setActiveWorkout}
                  plannedWorkouts={plannedWorkouts}
                  exercisePicker={exercisePicker}
                  setExercisePicker={setExercisePicker}
                  savingWorkout={savingWorkout}
                  savingPlan={savingPlan}
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

      {editingClient && (
        <EditClientModal
          editingClient={editingClient}
          editName={editName}
          setEditName={setEditName}
          editNotes={editNotes}
          setEditNotes={setEditNotes}
          onSave={handleSaveEdit}
          onClose={() => setEditingClient(null)}
          onClientUpdated={handleClientUpdated}
        />
      )}
    </div>
  );
}
