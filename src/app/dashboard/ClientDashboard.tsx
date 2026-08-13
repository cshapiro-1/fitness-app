"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { signOut } from "next-auth/react";
import { LogOut, TrendingUp, Dumbbell } from "lucide-react";

import Link from "next/link";
import { ShieldCheck } from "lucide-react";

export function ClientDashboard({ userName, userImage, isAdmin }: { userName: string; userImage: string | null; isAdmin?: boolean }) {
  const [workouts, setWorkouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"assigned" | "history" | "analytics">("assigned");

  const fetchWorkouts = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/workouts/client");
    if (res.ok) {
      setWorkouts(await res.json());
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchWorkouts();
  }, [fetchWorkouts]);

  const completed = useMemo(() => workouts.filter((w) => w.status === "COMPLETED"), [workouts]);
  const planned = useMemo(() => workouts.filter((w) => w.status === "PLANNED" || w.status === "IN_PROGRESS"), [workouts]);

  return (
    <div className="app">
      <header className="header">
        <div className="header-left">
          <Dumbbell size={22} />
          <span className="header-title">My Workouts</span>
        </div>
        <div className="header-right" style={{ display: "flex", alignItems: "center", gap: "12px" }}>
     {isAdmin && (
      <Link href="/admin" style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", fontWeight: 600, background: "#0f172a", color: "#38bdf8", padding: "6px 12px", borderRadius: "6px", border: "1px solid #1e293b", textDecoration: "none" }}>
       <ShieldCheck size={15} />
       <span className="hide-mobile">Admin Portal</span>
      </Link>
     )}
     <Link href="/onboarding" style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", fontWeight: 600, background: "#f1f5f9", color: "#475569", padding: "6px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", textDecoration: "none" }}>
      <span className="hide-mobile">Switch Role</span>
     </Link>
          {userImage && <img src={userImage} className="avatar" alt="" />}
          <span className="header-name">{userName}</span>
          <button className="signout-btn" onClick={() => signOut({ callbackUrl: "/auth/signin" })} title="Sign out">
            <LogOut size={16} />
          </button>
        </div>
      </header>

      <main className="main" style={{ maxWidth: "900px", margin: "24px auto", padding: "0 16px" }}>
        <div className="tabs" style={{ marginBottom: "20px" }}>
          <button className={`tab${tab === "assigned" ? " active" : ""}`} onClick={() => setTab("assigned")}>Assigned Workouts ({planned.length})</button>
          <button className={`tab${tab === "history" ? " active" : ""}`} onClick={() => setTab("history")}>History ({completed.length})</button>
          <button className={`tab${tab === "analytics" ? " active" : ""}`} onClick={() => setTab("analytics")}>Analytics</button>
        </div>

        {tab === "assigned" && (
          <div className="card">
            <h3 className="section-title">Assigned Workouts from Trainer</h3>
            {loading && <div className="empty-state">Loading...</div>}
            {!loading && !planned.length && <div className="empty-state">No assigned workouts right now. Check back when your trainer assigns a routine!</div>}
            {planned.map((workout) => (
              <div key={workout.id} className="history-card" style={{ marginBottom: "16px" }}>
                <div className="history-card-header">
                  <div>
                    <div className="history-date">Planned Routine · {workout.exercises.length} Exercises</div>
                    <div className="history-meta">{new Date(workout.createdAt).toLocaleDateString()}</div>
                  </div>
                </div>
                {workout.exercises.map((ex: any) => (
                  <div key={ex.id} className="history-exercise">
                    <div className="history-exercise-name">{ex.name} ({ex.sets.length} sets)</div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        {tab === "history" && (
          <div className="card">
            <h3 className="section-title">Workout History</h3>
            {!completed.length && <div className="empty-state">No completed workouts yet.</div>}
            {completed.map((workout) => (
              <div key={workout.id} className="history-card" style={{ marginBottom: "16px" }}>
                <div className="history-card-header">
                  <div className="history-date">{new Date(workout.completedAt || workout.createdAt).toLocaleString()}</div>
                </div>
                {workout.exercises.map((ex: any) => (
                  <div key={ex.id} className="history-exercise">
                    <div className="history-exercise-name">{ex.name}</div>
                    {ex.sets.map((st: any) => (
                      <div key={st.id} className="history-set-row">
                        <span>Set {st.order + 1}: {st.weight} lbs x {st.reps} reps</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        {tab === "analytics" && (
          <div className="card">
            <h3 className="section-title"><TrendingUp size={16} /> Progress & PRs</h3>
            <p style={{ fontSize: "14px", color: "#666" }}>Completed workouts: {completed.length}</p>
          </div>
        )}
      </main>
    </div>
  );
}
