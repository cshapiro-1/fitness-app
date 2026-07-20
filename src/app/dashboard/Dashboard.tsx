"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { signOut } from "next-auth/react";
import { Trash2, Plus, LogOut, TrendingUp, Dumbbell, Users, ChevronRight, Clock3 } from "lucide-react";

interface Client {
  id: string;
  name: string;
  notes?: string;
  createdAt: string;
  _count?: { workoutSessions: number };
}

interface WorkoutSet {
  id: string;
  order: number;
  weight: number;
  reps: number;
  notes?: string | null;
}

interface WorkoutExercise {
  id: string;
  order: number;
  name: string;
  sets: WorkoutSet[];
}

interface WorkoutSession {
  id: string;
  clientId: string;
  startedAt: string;
  completedAt: string;
  notes?: string | null;
  exercises: WorkoutExercise[];
}

type DraftSet = { weight: string; reps: string; notes: string };
type DraftExercise = { name: string; sets: DraftSet[] };
type DraftWorkout = { startedAt: string; notes: string; exercises: DraftExercise[] };

const REST_PRESETS = [15, 30, 45, 60, 90, 120, 150, 180, 210, 240, 300];
const EXERCISE_OPTIONS = [
  "Bench Press", "Incline Bench Press", "Decline Bench Press", "Dumbbell Bench Press", "Push Up", "Weighted Push Up",
  "Overhead Press", "Seated Dumbbell Press", "Arnold Press", "Lateral Raise", "Front Raise", "Rear Delt Fly",
  "Pull Up", "Chin Up", "Lat Pulldown", "Bent Over Row", "Seated Cable Row", "Single Arm Dumbbell Row",
  "Deadlift", "Romanian Deadlift", "Trap Bar Deadlift", "Rack Pull", "Good Morning", "Barbell Shrug",
  "Back Squat", "Front Squat", "Goblet Squat", "Leg Press", "Hack Squat", "Bulgarian Split Squat",
  "Lunge", "Walking Lunge", "Step Up", "Leg Extension", "Leg Curl", "Nordic Curl",
  "Hip Thrust", "Glute Bridge", "Cable Kickback", "Calf Raise", "Seated Calf Raise", "Donkey Calf Raise",
  "Barbell Curl", "Dumbbell Curl", "Hammer Curl", "Preacher Curl", "Triceps Pushdown", "Skull Crusher",
  "Close Grip Bench Press", "Overhead Triceps Extension", "Cable Fly", "Chest Fly", "Face Pull", "Upright Row",
  "Plank", "Hanging Leg Raise", "Cable Crunch", "Russian Twist", "Ab Wheel", "Farmer Carry",
  "Hip Abduction", "Hip Adduction", "Machine Row", "Machine Chest Press", "Machine Shoulder Press", "T Bar Row",
  "Smith Squat", "Smith RDL", "Landmine Press", "Landmine Row", "Sled Push", "Sled Pull",
];

const formatRestLabel = (seconds: number) => {
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  if (!remainder) return `${mins}m`;
  return `${mins}m${remainder}s`;
};

const formatClock = (seconds: number) => {
  const mins = Math.floor(seconds / 60).toString().padStart(2, "0");
  const secs = (seconds % 60).toString().padStart(2, "0");
  return `${mins}:${secs}`;
};

type ExerciseTrendPoint = {
  completedAt: string;
  workoutId: string;
  topWeight: number;
  topReps: number;
};

type ExerciseAnalytics = {
  name: string;
  maxWeight: number;
  maxReps: number;
  avgTopWeight: number;
  sessions: number;
  totalSets: number;
  trend: ExerciseTrendPoint[];
};

type WorkoutAnalytics = {
  id: string;
  completedAt: string;
  exerciseCount: number;
  setCount: number;
  peakWeight: number;
  peakReps: number;
};

type DashboardAnalytics = {
  workouts: WorkoutAnalytics[];
  exercises: ExerciseAnalytics[];
  overall: {
    totalWorkouts: number;
    totalExercises: number;
    totalSets: number;
    heaviestSet: { exercise: string; weight: number; reps: number; completedAt: string } | null;
    highestRepSet: { exercise: string; weight: number; reps: number; completedAt: string } | null;
    mostTrainedExercise: { exercise: string; sessions: number } | null;
  };
};

function computeAnalytics(workouts: WorkoutSession[]): DashboardAnalytics {
  const exerciseBuckets = new Map<string, { sets: Array<{ weight: number; reps: number; workoutId: string; completedAt: string }>; sessions: Set<string> }>();

  const workoutsSummary = workouts.map((workout) => {
    const summary = {
      id: workout.id,
      completedAt: workout.completedAt,
      exerciseCount: workout.exercises.length,
      setCount: workout.exercises.reduce((count, exercise) => count + exercise.sets.length, 0),
      peakWeight: 0,
      peakReps: 0,
    };

    workout.exercises.forEach((exercise) => {
      const topWeight = exercise.sets.reduce((max, setEntry) => Math.max(max, setEntry.weight), 0);
      const topReps = exercise.sets.reduce((max, setEntry) => Math.max(max, setEntry.reps), 0);
      summary.peakWeight = Math.max(summary.peakWeight, topWeight);
      summary.peakReps = Math.max(summary.peakReps, topReps);

      if (!exerciseBuckets.has(exercise.name)) {
        exerciseBuckets.set(exercise.name, { sets: [], sessions: new Set<string>() });
      }

      const bucket = exerciseBuckets.get(exercise.name)!;
      bucket.sessions.add(workout.id);
      exercise.sets.forEach((setEntry) => {
        bucket.sets.push({
          weight: setEntry.weight,
          reps: setEntry.reps,
          workoutId: workout.id,
          completedAt: workout.completedAt,
        });
      });
    });

    return summary;
  });

  const exercises = Array.from(exerciseBuckets.entries())
    .map(([name, data]) => {
      const sortedSets = [...data.sets].sort((left, right) => new Date(left.completedAt).getTime() - new Date(right.completedAt).getTime());
      const trendMap = new Map<string, ExerciseTrendPoint>();

      sortedSets.forEach((setEntry) => {
        const current = trendMap.get(setEntry.workoutId);
        if (!current || setEntry.weight > current.topWeight || (setEntry.weight === current.topWeight && setEntry.reps > current.topReps)) {
          trendMap.set(setEntry.workoutId, {
            completedAt: setEntry.completedAt,
            workoutId: setEntry.workoutId,
            topWeight: setEntry.weight,
            topReps: setEntry.reps,
          });
        }
      });

      const trend = Array.from(trendMap.values()).sort((left, right) => new Date(left.completedAt).getTime() - new Date(right.completedAt).getTime());
      const maxWeight = sortedSets.reduce((best, setEntry) => Math.max(best, setEntry.weight), 0);
      const maxReps = sortedSets.reduce((best, setEntry) => Math.max(best, setEntry.reps), 0);
      const avgTopWeight = trend.length
        ? Math.round((trend.reduce((sum, point) => sum + point.topWeight, 0) / trend.length) * 10) / 10
        : 0;

      return {
        name,
        maxWeight,
        maxReps,
        avgTopWeight,
        sessions: data.sessions.size,
        totalSets: sortedSets.length,
        trend,
      };
    })
    .sort((left, right) => right.maxWeight - left.maxWeight || right.sessions - left.sessions || left.name.localeCompare(right.name));

  const heaviestSet = exercises.reduce<DashboardAnalytics["overall"]["heaviestSet"]>((best, exercise) => {
    const candidate = exercise.trend.reduce<DashboardAnalytics["overall"]["heaviestSet"]>((exerciseBest, point) => {
      if (!exerciseBest || point.topWeight > exerciseBest.weight || (point.topWeight === exerciseBest.weight && point.topReps > exerciseBest.reps)) {
        return { exercise: exercise.name, weight: point.topWeight, reps: point.topReps, completedAt: point.completedAt };
      }
      return exerciseBest;
    }, null);

    if (!best) return candidate;
    if (!candidate) return best;
    if (candidate.weight > best.weight || (candidate.weight === best.weight && candidate.reps > best.reps)) return candidate;
    return best;
  }, null);

  const highestRepSet = exercises.reduce<DashboardAnalytics["overall"]["highestRepSet"]>((best, exercise) => {
    const candidate = exercise.trend.reduce<DashboardAnalytics["overall"]["highestRepSet"]>((exerciseBest, point) => {
      if (!exerciseBest || point.topReps > exerciseBest.reps || (point.topReps === exerciseBest.reps && point.topWeight > exerciseBest.weight)) {
        return { exercise: exercise.name, weight: point.topWeight, reps: point.topReps, completedAt: point.completedAt };
      }
      return exerciseBest;
    }, null);

    if (!best) return candidate;
    if (!candidate) return best;
    if (candidate.reps > best.reps || (candidate.reps === best.reps && candidate.weight > best.weight)) return candidate;
    return best;
  }, null);

  const mostTrainedExercise = exercises[0]
    ? { exercise: exercises[0].name, sessions: exercises[0].sessions }
    : null;

  return {
    workouts: workoutsSummary.sort((left, right) => new Date(right.completedAt).getTime() - new Date(left.completedAt).getTime()),
    exercises,
    overall: {
      totalWorkouts: workouts.length,
      totalExercises: exercises.length,
      totalSets: workoutsSummary.reduce((sum, workout) => sum + workout.setCount, 0),
      heaviestSet,
      highestRepSet,
      mostTrainedExercise,
    },
  };
}

export function Dashboard({ userName, userImage }: { userName: string; userImage: string | null }) {
  const [clients, setClients] = useState<Client[]>([]);
  const [selected, setSelected] = useState<Client | null>(null);
  const [workouts, setWorkouts] = useState<WorkoutSession[]>([]);
  const [loadingClients, setLoadingClients] = useState(true);
  const [loadingWorkouts, setLoadingWorkouts] = useState(false);

  const [newName, setNewName] = useState("");
  const [tab, setTab] = useState<"log" | "history" | "analytics">("log");

  const [activeWorkout, setActiveWorkout] = useState<DraftWorkout | null>(null);
  const [exercisePicker, setExercisePicker] = useState("");
  const [savingWorkout, setSavingWorkout] = useState(false);

  const [restSecondsRemaining, setRestSecondsRemaining] = useState(0);
  const [restTimerActive, setRestTimerActive] = useState(false);

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
    setLoadingWorkouts(false);
  }, []);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  useEffect(() => {
    if (selected) fetchWorkouts(selected.id);
    else setWorkouts([]);
  }, [selected, fetchWorkouts]);

  useEffect(() => {
    if (!restTimerActive) return;
    const timer = window.setInterval(() => {
      setRestSecondsRemaining((current) => {
        if (current <= 1) {
          window.clearInterval(timer);
          setRestTimerActive(false);
          return 0;
        }
        return current - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [restTimerActive]);

  const addClient = async () => {
    if (!newName.trim()) return;
    const res = await fetch("/api/clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim() }),
    });
    if (res.ok) {
      const client = await res.json();
      setClients((prev) => [...prev, client]);
      setSelected(client);
      setNewName("");
    }
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
    setActiveWorkout({ startedAt: new Date().toISOString(), notes: "", exercises: [] });
    setExercisePicker("");
    setTab("log");
  };

  const addExerciseToWorkout = () => {
    if (!activeWorkout || !exercisePicker.trim()) return;
    setActiveWorkout((current) => {
      if (!current) return current;
      return {
        ...current,
        exercises: [...current.exercises, { name: exercisePicker.trim(), sets: [{ weight: "", reps: "", notes: "" }] }],
      };
    });
    setExercisePicker("");
  };

  const removeExercise = (exerciseIndex: number) => {
    setActiveWorkout((current) => {
      if (!current) return current;
      return { ...current, exercises: current.exercises.filter((_, index) => index !== exerciseIndex) };
    });
  };

  const updateExerciseName = (exerciseIndex: number, value: string) => {
    setActiveWorkout((current) => {
      if (!current) return current;
      return {
        ...current,
        exercises: current.exercises.map((exercise, index) =>
          index === exerciseIndex ? { ...exercise, name: value } : exercise,
        ),
      };
    });
  };

  const addSet = (exerciseIndex: number) => {
    setActiveWorkout((current) => {
      if (!current) return current;
      return {
        ...current,
        exercises: current.exercises.map((exercise, index) =>
          index === exerciseIndex
            ? { ...exercise, sets: [...exercise.sets, { weight: "", reps: "", notes: "" }] }
            : exercise,
        ),
      };
    });
  };

  const removeSet = (exerciseIndex: number, setIndex: number) => {
    setActiveWorkout((current) => {
      if (!current) return current;
      return {
        ...current,
        exercises: current.exercises.map((exercise, index) => {
          if (index !== exerciseIndex) return exercise;
          const nextSets = exercise.sets.filter((_, currentSetIndex) => currentSetIndex !== setIndex);
          return { ...exercise, sets: nextSets.length ? nextSets : [{ weight: "", reps: "", notes: "" }] };
        }),
      };
    });
  };

  const updateSet = (exerciseIndex: number, setIndex: number, field: keyof DraftSet, value: string) => {
    setActiveWorkout((current) => {
      if (!current) return current;
      return {
        ...current,
        exercises: current.exercises.map((exercise, index) => {
          if (index !== exerciseIndex) return exercise;
          return {
            ...exercise,
            sets: exercise.sets.map((setEntry, currentSetIndex) =>
              currentSetIndex === setIndex ? { ...setEntry, [field]: value } : setEntry,
            ),
          };
        }),
      };
    });
  };

  const completeWorkout = async () => {
    if (!selected || !activeWorkout) return;

    const normalizedExercises = activeWorkout.exercises
      .map((exercise) => ({
        name: exercise.name.trim(),
        sets: exercise.sets
          .map((setEntry) => ({
            weight: Number(setEntry.weight),
            reps: Number(setEntry.reps),
            notes: setEntry.notes.trim(),
          }))
          .filter((setEntry) => Number.isFinite(setEntry.weight) && setEntry.weight >= 0 && Number.isFinite(setEntry.reps) && setEntry.reps > 0),
      }))
      .filter((exercise) => exercise.name && exercise.sets.length > 0);

    if (!normalizedExercises.length) {
      alert("Add at least one exercise with one valid set before completing the workout.");
      return;
    }

    setSavingWorkout(true);
    const res = await fetch("/api/workouts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientId: selected.id,
        startedAt: activeWorkout.startedAt,
        completedAt: new Date().toISOString(),
        notes: activeWorkout.notes,
        exercises: normalizedExercises,
      }),
    });

    if (res.ok) {
      const createdWorkout = await res.json();
      setWorkouts((prev) => [createdWorkout, ...prev]);
      setActiveWorkout(null);
      setExercisePicker("");
      setTab("history");
      setRestTimerActive(false);
      setRestSecondsRemaining(0);
      fetchClients();
    }

    setSavingWorkout(false);
  };

  const deleteWorkout = async (id: string) => {
    await fetch(`/api/workouts/${id}`, { method: "DELETE" });
    setWorkouts((prev) => prev.filter((workout) => workout.id !== id));
    fetchClients();
  };

  const totalDraftSets = useMemo(() => {
    if (!activeWorkout) return 0;
    return activeWorkout.exercises.reduce((count, exercise) => count + exercise.sets.length, 0);
  }, [activeWorkout]);

  const analytics = useMemo(() => computeAnalytics(workouts), [workouts]);

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
        <aside className="sidebar">
          <div className="sidebar-header">
            <Users size={14} />
            <span>Clients</span>
            <span className="client-count">{clients.length}</span>
          </div>
          <div className="new-client-row">
            <input
              className="input"
              placeholder="New client name"
              value={newName}
              onChange={(event) => setNewName(event.target.value)}
              onKeyDown={(event) => event.key === "Enter" && addClient()}
            />
            <button className="btn-icon" onClick={addClient} title="Add client">
              <Plus size={16} />
            </button>
          </div>
          <div className="client-list">
            {loadingClients && <div className="empty-state">Loading...</div>}
            {!loadingClients && !clients.length && <div className="empty-state">No clients yet</div>}
            {clients.map((client) => (
              <div key={client.id} className={`client-item${selected?.id === client.id ? " active" : ""}`} onClick={() => setSelected(client)}>
                <div className="client-item-main">
                  <span className="client-name">{client.name}</span>
                  <span className="client-meta">{client._count?.workoutSessions ?? 0} workouts</span>
                </div>
                <div className="client-item-actions">
                  <ChevronRight size={14} className="client-arrow" />
                  <button className="btn-ghost-danger" onClick={(event) => { event.stopPropagation(); deleteClient(client.id); }} title="Delete">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </aside>

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
                  {(["log", "history", "analytics"] as const).map((currentTab) => (
                    <button key={currentTab} className={`tab${tab === currentTab ? " active" : ""}`} onClick={() => setTab(currentTab)}>
                      {currentTab.charAt(0).toUpperCase() + currentTab.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {tab === "log" && (
                <div className="card workout-builder-card">
                  <h3 className="section-title">Workout Builder</h3>

                  {!activeWorkout && (
                    <div className="builder-empty">
                      <p>Start a workout to build exercises and sets.</p>
                      <button className="btn-primary" onClick={startWorkout}>Start New Workout</button>
                    </div>
                  )}

                  {activeWorkout && (
                    <>
                      <div className="builder-top-row">
                        <div className="workout-meta">
                          <span>Started: {new Date(activeWorkout.startedAt).toLocaleTimeString()}</span>
                          <span>Exercises: {activeWorkout.exercises.length}</span>
                          <span>Sets: {totalDraftSets}</span>
                        </div>
                        <button className="btn-ghost-danger" onClick={() => setActiveWorkout(null)}>Discard Workout</button>
                      </div>

                      <label className="field workout-notes-field">
                        <span>Workout Notes</span>
                        <input
                          className="input"
                          placeholder="How did this session feel?"
                          value={activeWorkout.notes}
                          onChange={(event) => setActiveWorkout((current) => current ? { ...current, notes: event.target.value } : current)}
                        />
                      </label>

                      <div className="exercise-picker">
                        <input
                          className="input"
                          list="exercise-options"
                          placeholder="Choose or type an exercise"
                          value={exercisePicker}
                          onChange={(event) => setExercisePicker(event.target.value)}
                        />
                        <datalist id="exercise-options">
                          {EXERCISE_OPTIONS.map((exerciseName) => (
                            <option key={exerciseName} value={exerciseName} />
                          ))}
                        </datalist>
                        <button className="btn-primary" onClick={addExerciseToWorkout}>Add Exercise</button>
                      </div>

                      <div className="exercise-list">
                        {!activeWorkout.exercises.length && <div className="empty-state">Add your first exercise to begin.</div>}
                        {activeWorkout.exercises.map((exercise, exerciseIndex) => (
                          <div className="exercise-card" key={`${exercise.name}-${exerciseIndex}`}>
                            <div className="exercise-card-header">
                              <input
                                className="input"
                                list="exercise-options"
                                value={exercise.name}
                                onChange={(event) => updateExerciseName(exerciseIndex, event.target.value)}
                              />
                              <button className="btn-ghost-danger" onClick={() => removeExercise(exerciseIndex)} title="Remove exercise">
                                <Trash2 size={14} />
                              </button>
                            </div>

                            <div className="set-list">
                              {exercise.sets.map((setEntry, setIndex) => (
                                <div className="set-row" key={`${exerciseIndex}-${setIndex}`}>
                                  <div className="set-index">Set {setIndex + 1}</div>
                                  <input
                                    className="input"
                                    type="number"
                                    min="0"
                                    step="0.5"
                                    placeholder="Weight"
                                    value={setEntry.weight}
                                    onChange={(event) => updateSet(exerciseIndex, setIndex, "weight", event.target.value)}
                                  />
                                  <input
                                    className="input"
                                    type="number"
                                    min="1"
                                    placeholder="Reps"
                                    value={setEntry.reps}
                                    onChange={(event) => updateSet(exerciseIndex, setIndex, "reps", event.target.value)}
                                  />
                                  <input
                                    className="input"
                                    placeholder="Notes"
                                    value={setEntry.notes}
                                    onChange={(event) => updateSet(exerciseIndex, setIndex, "notes", event.target.value)}
                                  />
                                  <button className="btn-ghost-danger" onClick={() => removeSet(exerciseIndex, setIndex)} title="Remove set">
                                    <Trash2 size={13} />
                                  </button>
                                </div>
                              ))}
                            </div>

                            <button className="btn-icon add-set-btn" onClick={() => addSet(exerciseIndex)}>
                              <Plus size={14} />
                              <span>Add Set</span>
                            </button>
                          </div>
                        ))}
                      </div>

                      <div className="rest-timer-card">
                        <div className="section-title rest-title">
                          <Clock3 size={16} />
                          Rest Timer
                        </div>
                        <div className="rest-controls">
                          {REST_PRESETS.map((seconds) => (
                            <button key={seconds} className="tab" onClick={() => { setRestSecondsRemaining(seconds); setRestTimerActive(true); }}>
                              {formatRestLabel(seconds)}
                            </button>
                          ))}
                        </div>
                        <div className="rest-status">{restTimerActive ? `Rest: ${formatClock(restSecondsRemaining)}` : "Ready"}</div>
                        <div className="rest-actions">
                          <button className="btn-primary" onClick={() => setRestTimerActive((current) => !current)}>
                            {restTimerActive ? "Pause" : "Resume"}
                          </button>
                          <button className="btn-ghost-danger" onClick={() => { setRestTimerActive(false); setRestSecondsRemaining(0); }}>
                            Reset Timer
                          </button>
                        </div>
                      </div>

                      <button className="btn-primary complete-btn" onClick={completeWorkout} disabled={savingWorkout}>
                        {savingWorkout ? "Saving Workout..." : "Complete Workout"}
                      </button>
                    </>
                  )}
                </div>
              )}

              {tab === "history" && (
                <div className="card">
                  <h3 className="section-title">Workout History</h3>
                  {loadingWorkouts && <div className="empty-state">Loading...</div>}
                  {!loadingWorkouts && !workouts.length && <div className="empty-state">No workouts logged yet</div>}
                  <div className="history-list">
                    {workouts.map((workout) => (
                      <div key={workout.id} className="history-card">
                        <div className="history-card-header">
                          <div>
                            <div className="history-date">{new Date(workout.completedAt).toLocaleString()}</div>
                            <div className="history-meta">{workout.exercises.length} exercises</div>
                          </div>
                          <button className="btn-ghost-danger" onClick={() => deleteWorkout(workout.id)}>
                            <Trash2 size={13} />
                          </button>
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
              )}

              {tab === "analytics" && (
                <div className="card">
                  <h3 className="section-title">
                    <TrendingUp size={16} />
                    Analytics
                  </h3>
                  {!analytics.workouts.length && <div className="empty-state">Log workouts to see analytics</div>}
                  {!!analytics.workouts.length && (
                    <>
                      <div className="analytics-summary-grid">
                        <div className="analytics-summary-card">
                          <span className="stat-label">Workouts</span>
                          <span className="analytics-summary-value">{analytics.overall.totalWorkouts}</span>
                        </div>
                        <div className="analytics-summary-card">
                          <span className="stat-label">Exercises</span>
                          <span className="analytics-summary-value">{analytics.overall.totalExercises}</span>
                        </div>
                        <div className="analytics-summary-card">
                          <span className="stat-label">Sets Logged</span>
                          <span className="analytics-summary-value">{analytics.overall.totalSets}</span>
                        </div>
                        <div className="analytics-summary-card">
                          <span className="stat-label">Top Exercise</span>
                          <span className="analytics-summary-value analytics-summary-value-small">
                            {analytics.overall.mostTrainedExercise ? analytics.overall.mostTrainedExercise.exercise : "-"}
                          </span>
                        </div>
                      </div>

                      <div className="analytics-pr-grid">
                        <div className="analytics-pr-card">
                          <span className="stat-label">Heaviest Set</span>
                          <div className="analytics-pr-value">
                            {analytics.overall.heaviestSet ? `${analytics.overall.heaviestSet.weight} lbs` : "-"}
                          </div>
                          {analytics.overall.heaviestSet && (
                            <div className="analytics-pr-detail">
                              {analytics.overall.heaviestSet.exercise} · {analytics.overall.heaviestSet.reps} reps · {new Date(analytics.overall.heaviestSet.completedAt).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                        <div className="analytics-pr-card">
                          <span className="stat-label">Highest Reps</span>
                          <div className="analytics-pr-value">
                            {analytics.overall.highestRepSet ? `${analytics.overall.highestRepSet.reps} reps` : "-"}
                          </div>
                          {analytics.overall.highestRepSet && (
                            <div className="analytics-pr-detail">
                              {analytics.overall.highestRepSet.exercise} · {analytics.overall.highestRepSet.weight} lbs · {new Date(analytics.overall.highestRepSet.completedAt).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="analytics-grid">
                        {analytics.exercises.map((exercise) => (
                          <div key={exercise.name} className="analytics-card">
                            <div className="analytics-exercise">{exercise.name}</div>
                            <div className="analytics-stats">
                              <div className="stat"><span className="stat-value">{exercise.maxWeight}</span><span className="stat-label">Max lbs</span></div>
                              <div className="stat"><span className="stat-value">{exercise.maxReps}</span><span className="stat-label">Max reps</span></div>
                              <div className="stat"><span className="stat-value">{exercise.avgTopWeight}</span><span className="stat-label">Avg top set</span></div>
                              <div className="stat"><span className="stat-value">{exercise.sessions}</span><span className="stat-label">Sessions</span></div>
                            </div>

                            <div className="analytics-metric-row">
                              <span className="analytics-metric-label">Total sets</span>
                              <span className="analytics-metric-value">{exercise.totalSets}</span>
                            </div>

                            <div className="analytics-trend">
                              <div className="analytics-trend-title">Weight over time</div>
                              {exercise.trend.map((point) => (
                                <div key={`${exercise.name}-${point.workoutId}`} className="analytics-trend-row">
                                  <span>{new Date(point.completedAt).toLocaleDateString()}</span>
                                  <span>{point.topWeight} lbs</span>
                                  <span>{point.topReps} reps</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
