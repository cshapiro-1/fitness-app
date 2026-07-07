"use client";
import React, { useEffect, useState, useCallback } from "react";
import { signOut } from "next-auth/react";
import { Trash2, Plus, LogOut, TrendingUp, Dumbbell, Users, ChevronRight } from "lucide-react";

interface Client { id: string; name: string; notes?: string; createdAt: string; _count?: { workouts: number } }
interface Workout { id: string; clientId: string; exercise: string; weight: number; sets: number; reps: number; date: string; notes?: string }
type Analytics = Record<string, { maxWeight: number; avgWeight: number; totalVolume: number; sessions: number }>;

function computeAnalytics(workouts: Workout[]): Analytics {
  const byEx: Record<string, Workout[]> = {};
  for (const w of workouts) { byEx[w.exercise] = byEx[w.exercise] || []; byEx[w.exercise].push(w); }
  const out: Analytics = {};
  for (const [ex, list] of Object.entries(byEx)) {
    out[ex] = {
      maxWeight: Math.max(...list.map(l => l.weight)),
      avgWeight: Math.round(list.reduce((s, l) => s + l.weight, 0) / list.length * 10) / 10,
      totalVolume: list.reduce((s, l) => s + l.weight * l.sets * l.reps, 0),
      sessions: list.length,
    };
  }
  return out;
}

export function Dashboard({ userName, userImage }: { userName: string; userImage: string | null }) {
  const [clients, setClients] = useState<Client[]>([]);
  const [selected, setSelected] = useState<Client | null>(null);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loadingClients, setLoadingClients] = useState(true);
  const [loadingWorkouts, setLoadingWorkouts] = useState(false);

  const [newName, setNewName] = useState("");
  const [exercise, setExercise] = useState("Deadlift");
  const [weight, setWeight] = useState("100");
  const [sets, setSets] = useState("3");
  const [reps, setReps] = useState("5");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [workoutNotes, setWorkoutNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<"log" | "history" | "analytics">("log");

  const fetchClients = useCallback(async () => {
    setLoadingClients(true);
    const res = await fetch("/api/clients");
    if (res.ok) { const data = await res.json(); setClients(data); if (data.length && !selected) setSelected(data[0]); }
    setLoadingClients(false);
  }, []);

  const fetchWorkouts = useCallback(async (clientId: string) => {
    setLoadingWorkouts(true);
    const res = await fetch(`/api/workouts?clientId=${clientId}`);
    if (res.ok) setWorkouts(await res.json());
    setLoadingWorkouts(false);
  }, []);

  useEffect(() => { fetchClients(); }, [fetchClients]);
  useEffect(() => { if (selected) fetchWorkouts(selected.id); else setWorkouts([]); }, [selected, fetchWorkouts]);

  const addClient = async () => {
    if (!newName.trim()) return;
    const res = await fetch("/api/clients", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: newName.trim() }) });
    if (res.ok) { const c = await res.json(); setClients(prev => [...prev, c]); setSelected(c); setNewName(""); }
  };

  const deleteClient = async (id: string) => {
    if (!confirm("Delete this client and all their workouts?")) return;
    await fetch(`/api/clients/${id}`, { method: "DELETE" });
    setClients(prev => prev.filter(c => c.id !== id));
    if (selected?.id === id) setSelected(clients.find(c => c.id !== id) ?? null);
  };

  const logWorkout = async () => {
    if (!selected || !exercise.trim()) return;
    setSaving(true);
    const res = await fetch("/api/workouts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId: selected.id, exercise: exercise.trim(), weight: Number(weight), sets: Number(sets), reps: Number(reps), date, notes: workoutNotes }),
    });
    if (res.ok) { const w = await res.json(); setWorkouts(prev => [w, ...prev]); setWorkoutNotes(""); fetchClients(); }
    setSaving(false);
  };

  const deleteWorkout = async (id: string) => {
    await fetch(`/api/workouts/${id}`, { method: "DELETE" });
    setWorkouts(prev => prev.filter(w => w.id !== id));
    fetchClients();
  };

  const analytics = computeAnalytics(workouts);

  return (
    <div className="app">
      <header className="header">
        <div className="header-left">
          <Dumbbell size={22} />
          <span className="header-title">Fitness Tracker</span>
        </div>
        <div className="header-right">
          {userImage && <img src={userImage} className="avatar" alt="" />}
          <span className="header-name">{userName}</span>
          <button className="signout-btn" onClick={() => signOut({ callbackUrl: "/auth/signin" })} title="Sign out">
            <LogOut size={16} />
          </button>
        </div>
      </header>

      <div className="layout">
        {/* Sidebar */}
        <aside className="sidebar">
          <div className="sidebar-header">
            <Users size={14} />
            <span>Clients</span>
            <span className="client-count">{clients.length}</span>
          </div>
          <div className="new-client-row">
            <input className="input" placeholder="New client name" value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === "Enter" && addClient()} />
            <button className="btn-icon" onClick={addClient} title="Add client"><Plus size={16} /></button>
          </div>
          <div className="client-list">
            {loadingClients && <div className="empty-state">Loading…</div>}
            {!loadingClients && clients.length === 0 && <div className="empty-state">No clients yet</div>}
            {clients.map(c => (
              <div key={c.id} className={`client-item${selected?.id === c.id ? " active" : ""}`} onClick={() => setSelected(c)}>
                <div className="client-item-main">
                  <span className="client-name">{c.name}</span>
                  <span className="client-meta">{c._count?.workouts ?? 0} workouts</span>
                </div>
                <div className="client-item-actions">
                  <ChevronRight size={14} className="client-arrow" />
                  <button className="btn-ghost-danger" onClick={e => { e.stopPropagation(); deleteClient(c.id); }} title="Delete">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* Main */}
        <main className="main">
          {!selected ? (
            <div className="placeholder">
              <Dumbbell size={40} className="placeholder-icon" />
              <p>Select a client or add a new one</p>
            </div>
          ) : (
            <>
              <div className="main-header">
                <h2 className="client-heading">{selected.name}</h2>
                <div className="tabs">
                  {(["log", "history", "analytics"] as const).map(t => (
                    <button key={t} className={`tab${tab === t ? " active" : ""}`} onClick={() => setTab(t)}>
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {tab === "log" && (
                <div className="card">
                  <h3 className="section-title">Log Workout</h3>
                  <div className="form-grid">
                    <label className="field">
                      <span>Exercise</span>
                      <input className="input" value={exercise} onChange={e => setExercise(e.target.value)} />
                    </label>
                    <label className="field">
                      <span>Date</span>
                      <input className="input" type="date" value={date} onChange={e => setDate(e.target.value)} />
                    </label>
                    <label className="field">
                      <span>Weight (lbs)</span>
                      <input className="input" type="number" value={weight} onChange={e => setWeight(e.target.value)} />
                    </label>
                    <label className="field">
                      <span>Sets</span>
                      <input className="input" type="number" value={sets} onChange={e => setSets(e.target.value)} />
                    </label>
                    <label className="field">
                      <span>Reps</span>
                      <input className="input" type="number" value={reps} onChange={e => setReps(e.target.value)} />
                    </label>
                    <label className="field">
                      <span>Notes</span>
                      <input className="input" placeholder="Optional" value={workoutNotes} onChange={e => setWorkoutNotes(e.target.value)} />
                    </label>
                  </div>
                  <button className="btn-primary" onClick={logWorkout} disabled={saving}>
                    {saving ? "Saving…" : "Save Workout"}
                  </button>
                </div>
              )}

              {tab === "history" && (
                <div className="card">
                  <h3 className="section-title">Workout History</h3>
                  {loadingWorkouts && <div className="empty-state">Loading…</div>}
                  {!loadingWorkouts && workouts.length === 0 && <div className="empty-state">No workouts logged yet</div>}
                  <div className="workout-list">
                    {workouts.map(w => (
                      <div key={w.id} className="workout-row">
                        <div className="workout-info">
                          <span className="workout-exercise">{w.exercise}</span>
                          <span className="workout-detail">{w.weight} lbs · {w.sets}×{w.reps}</span>
                          {w.notes && <span className="workout-notes">{w.notes}</span>}
                        </div>
                        <div className="workout-right">
                          <span className="workout-date">{w.date}</span>
                          <button className="btn-ghost-danger" onClick={() => deleteWorkout(w.id)}><Trash2 size={13} /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {tab === "analytics" && (
                <div className="card">
                  <h3 className="section-title">
                    <TrendingUp size={16} />
                    Analytics
                  </h3>
                  {Object.keys(analytics).length === 0 && <div className="empty-state">Log workouts to see analytics</div>}
                  <div className="analytics-grid">
                    {Object.entries(analytics).map(([ex, a]) => (
                      <div key={ex} className="analytics-card">
                        <div className="analytics-exercise">{ex}</div>
                        <div className="analytics-stats">
                          <div className="stat"><span className="stat-value">{a.maxWeight}</span><span className="stat-label">Max lbs</span></div>
                          <div className="stat"><span className="stat-value">{a.avgWeight}</span><span className="stat-label">Avg lbs</span></div>
                          <div className="stat"><span className="stat-value">{a.totalVolume.toLocaleString()}</span><span className="stat-label">Total vol</span></div>
                          <div className="stat"><span className="stat-value">{a.sessions}</span><span className="stat-label">Sessions</span></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
