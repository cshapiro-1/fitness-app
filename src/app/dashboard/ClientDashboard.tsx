"use client";

import React, { useEffect, useState } from "react";
import { signOut } from "next-auth/react";
import { Clock3, Dumbbell, LogOut } from "lucide-react";

type WorkoutSet = {
  id: string;
  order: number;
  weight: number;
  reps: number;
  notes?: string | null;
};

type WorkoutExercise = {
  id: string;
  order: number;
  name: string;
  sets: WorkoutSet[];
};

type WorkoutSession = {
  id: string;
  status: "PLANNED" | "IN_PROGRESS" | "COMPLETED";
  startedAt?: string | null;
  completedAt?: string | null;
  createdAt: string;
  notes?: string | null;
  exercises: WorkoutExercise[];
};

export function ClientDashboard({ userName, userImage }: { userName: string; userImage: string | null }) {
  const [workouts, setWorkouts] = useState<WorkoutSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const res = await fetch("/api/workouts");
      if (res.ok) {
        const data = await res.json();
        setWorkouts(data);
      }
      setLoading(false);
    };

    load();
  }, []);

  const planned = workouts.filter((workout) => workout.status !== "COMPLETED");
  const completed = workouts.filter((workout) => workout.status === "COMPLETED");

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

      <div className="main client-main">
        <div className="card">
          <h3 className="section-title">
            <Clock3 size={16} />
            Planned Workouts
          </h3>
          {loading && <div className="empty-state">Loading...</div>}
          {!loading && !planned.length && <div className="empty-state">No planned workouts yet</div>}
          <div className="history-list">
            {planned.map((workout) => (
              <div key={workout.id} className="history-card">
                <div className="history-card-header">
                  <div>
                    <div className="history-date">{workout.status === "IN_PROGRESS" ? "In Progress" : "Planned"}</div>
                    <div className="history-meta">{workout.exercises.length} exercises</div>
                  </div>
                </div>
                {workout.notes && <div className="history-notes">{workout.notes}</div>}
                {workout.exercises.map((exercise) => (
                  <div key={exercise.id} className="history-exercise">
                    <div className="history-exercise-name">{exercise.name}</div>
                    <div className="history-set-list">
                      {exercise.sets.map((setEntry) => (
                        <div key={setEntry.id} className="history-set-row">
                          <span>Set {setEntry.order + 1}</span>
                          <span>{setEntry.weight} lbs x {setEntry.reps}</span>
                          <span>{setEntry.notes || "-"}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h3 className="section-title">Completed Workouts</h3>
          {loading && <div className="empty-state">Loading...</div>}
          {!loading && !completed.length && <div className="empty-state">No workouts completed yet</div>}
          <div className="history-list">
            {completed.map((workout) => (
              <div key={workout.id} className="history-card">
                <div className="history-card-header">
                  <div>
                    <div className="history-date">{workout.completedAt ? new Date(workout.completedAt).toLocaleString() : "-"}</div>
                    <div className="history-meta">{workout.exercises.length} exercises</div>
                  </div>
                </div>
                {workout.notes && <div className="history-notes">{workout.notes}</div>}
                {workout.exercises.map((exercise) => (
                  <div key={exercise.id} className="history-exercise">
                    <div className="history-exercise-name">{exercise.name}</div>
                    <div className="history-set-list">
                      {exercise.sets.map((setEntry) => (
                        <div key={setEntry.id} className="history-set-row">
                          <span>Set {setEntry.order + 1}</span>
                          <span>{setEntry.weight} lbs x {setEntry.reps}</span>
                          <span>{setEntry.notes || "-"}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
