import React, { useEffect, useState } from 'react';
import { create } from 'zustand';
import { nanoid } from 'nanoid';

export interface User { id: string; name: string; createdAt: string }
export interface Workout { id: string; userId: string; exercise: string; weight: number; sets: number; reps: number; date: string }

interface FitnessStore {
  users: User[];
  workouts: Workout[];
  addUser: (name: string) => User;
  addWorkout: (w: Omit<Workout, 'id'>) => Workout;
  removeUser: (id: string) => void;
}

const STORAGE_KEY = 'fitness_v1';

const load = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{"users":[],"workouts":[]}');
  } catch (e) {
    return { users: [], workouts: [] };
  }
};

const useFitnessStore = create<FitnessStore>((set, get) => ({
  users: load().users,
  workouts: load().workouts,
  addUser: (name: string) => {
    const u: User = { id: nanoid(), name, createdAt: new Date().toISOString() };
    const next = { ...get() } as any;
    next.users = [...next.users, u];
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ users: next.users, workouts: next.workouts }));
    set({ users: next.users });
    return u;
  },
  addWorkout: (w) => {
    const workout: Workout = { ...w, id: nanoid() };
    const next = { ...get() } as any;
    next.workouts = [...next.workouts, workout];
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ users: next.users, workouts: next.workouts }));
    set({ workouts: next.workouts });
    return workout;
  },
  removeUser: (id) => {
    const next = { ...get() } as any;
    next.users = next.users.filter((u: User) => u.id !== id);
    next.workouts = next.workouts.filter((w: Workout) => w.userId !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ users: next.users, workouts: next.workouts }));
    set({ users: next.users, workouts: next.workouts });
  }
}));

function computeExerciseAnalytics(workouts: Workout[]) {
  const byExercise: Record<string, Workout[]> = {};
  for (const w of workouts) {
    byExercise[w.exercise] = byExercise[w.exercise] || [];
    byExercise[w.exercise].push(w);
  }

  const analytics: Record<string, { maxWeight: number; avgWeight: number; totalVolume: number; sessions: number }> = {};
  for (const ex of Object.keys(byExercise)) {
    const list = byExercise[ex];
    const maxWeight = Math.max(...list.map((l) => l.weight));
    const avgWeight = list.reduce((s, l) => s + l.weight, 0) / list.length;
    const totalVolume = list.reduce((s, l) => s + (l.weight * l.sets * l.reps), 0);
    analytics[ex] = { maxWeight, avgWeight: Math.round(avgWeight * 100) / 100, totalVolume, sessions: list.length };
  }
  return analytics;
}

const App: React.FC = () => {
  const users = useFitnessStore((s) => s.users);
  const workouts = useFitnessStore((s) => s.workouts);
  const addUser = useFitnessStore((s) => s.addUser);
  const addWorkout = useFitnessStore((s) => s.addWorkout);
  const removeUser = useFitnessStore((s) => s.removeUser);

  const [selectedUserId, setSelectedUserId] = useState<string | null>(users[0]?.id || null);
  const [nameInput, setNameInput] = useState('');

  useEffect(() => {
    if (!selectedUserId && users[0]) setSelectedUserId(users[0].id);
  }, [users]);

  const [exercise, setExercise] = useState('Deadlift');
  const [weight, setWeight] = useState(100);
  const [sets, setSets] = useState(3);
  const [reps, setReps] = useState(5);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

  const userWorkouts = workouts.filter((w) => w.userId === selectedUserId);
  const analytics = computeExerciseAnalytics(userWorkouts);

  return (
    <div style={{ fontFamily: 'system-ui,Segoe UI,Roboto,Helvetica,Arial', padding: 20 }}>
      <h1>Fitness Tracker — Trainer Dashboard</h1>
      <div style={{ display: 'flex', gap: 20, marginTop: 12 }}>
        <section style={{ flex: '0 0 260px', border: '1px solid #ddd', padding: 12, borderRadius: 8 }}>
          <h3>Users</h3>
          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <input placeholder="New user name" value={nameInput} onChange={(e) => setNameInput(e.target.value)} />
            <button onClick={() => { if (!nameInput.trim()) return; const u = addUser(nameInput.trim()); setSelectedUserId(u.id); setNameInput(''); }}>
              Add
            </button>
          </div>
          <div style={{ maxHeight: 240, overflow: 'auto' }}>
            {users.map((u) => (
              <div key={u.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 4px', background: u.id === selectedUserId ? '#f3f4f6' : 'transparent', borderRadius: 4 }}>
                <div style={{ cursor: 'pointer' }} onClick={() => setSelectedUserId(u.id)}>{u.name}</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => { if (confirm('Delete user and their workouts?')) removeUser(u.id); }}>Del</button>
                </div>
              </div>
            ))}
            {users.length === 0 && <div style={{ color: '#666' }}>No users yet — add one above.</div>}
          </div>
        </section>

        <section style={{ flex: 1, border: '1px solid #ddd', padding: 12, borderRadius: 8 }}>
          <h3>Log Workout</h3>
          {!selectedUserId ? <div style={{ color: '#666' }}>Select or create a user first.</div> : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div>
                <label>Exercise</label>
                <input value={exercise} onChange={(e) => setExercise(e.target.value)} />
              </div>
              <div>
                <label>Date</label>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              </div>
              <div>
                <label>Weight (lbs)</label>
                <input type="number" value={weight} onChange={(e) => setWeight(Number(e.target.value))} />
              </div>
              <div>
                <label>Sets</label>
                <input type="number" value={sets} onChange={(e) => setSets(Number(e.target.value))} />
              </div>
              <div>
                <label>Reps</label>
                <input type="number" value={reps} onChange={(e) => setReps(Number(e.target.value))} />
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                <button onClick={() => {
                  if (!selectedUserId) return; addWorkout({ userId: selectedUserId, exercise: exercise.trim() || 'Exercise', weight: Number(weight), sets: Number(sets), reps: Number(reps), date });
                  setExercise('Deadlift'); setWeight(100); setSets(3); setReps(5);
                }}>Save</button>
              </div>
            </div>
          )}

          <h3 style={{ marginTop: 18 }}>Profile & Analytics</h3>
          {!selectedUserId ? null : (
            <div>
              <h4>{users.find((u) => u.id === selectedUserId)?.name}</h4>
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <h5>Recent Workouts</h5>
                  <div style={{ maxHeight: 220, overflow: 'auto', border: '1px solid #eee', padding: 8, borderRadius: 6 }}>
                    {userWorkouts.slice().reverse().map((w) => (
                      <div key={w.id} style={{ padding: 6, borderBottom: '1px solid #f3f3f3' }}>
                        <div><strong>{w.exercise}</strong> — {w.weight} lbs · {w.sets}×{w.reps}</div>
                        <div style={{ fontSize: 12, color: '#666' }}>{w.date}</div>
                      </div>
                    ))}
                    {userWorkouts.length === 0 && <div style={{ color: '#666' }}>No workouts logged yet.</div>}
                  </div>
                </div>
                <div style={{ width: 300 }}>
                  <h5>Analytics</h5>
                  <div style={{ border: '1px solid #eee', padding: 8, borderRadius: 6 }}>
                    {Object.keys(analytics).length === 0 && <div style={{ color: '#666' }}>No analytics yet — log workouts to see progress.</div>}
                    {Object.entries(analytics).map(([ex, a]) => (
                      <div key={ex} style={{ padding: 6, borderBottom: '1px dashed #f2f2f2' }}>
                        <div style={{ fontWeight: 600 }}>{ex}</div>
                        <div style={{ fontSize: 13, color: '#333' }}>Max: {a.maxWeight} lbs · Avg: {a.avgWeight} · Vol: {a.totalVolume}</div>
                        <div style={{ fontSize: 12, color: '#666' }}>{a.sessions} sessions</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
      <hr style={{ margin: '18px 0' }} />
      <div style={{ fontSize: 13, color: '#666' }}>Local storage key: <strong>{STORAGE_KEY}</strong></div>
    </div>
  );
}

export default App;
