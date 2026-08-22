"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import {
  LogOut,
  TrendingUp,
  Dumbbell,
  Camera,
  User,
  Check,
  X,
  ShieldCheck,
  Calendar,
  Award,
  Flame,
  FileText,
  Sparkles,
  Timer,
  Play,
  Pause,
  RotateCcw,
  Search,
  Filter,
  Copy,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { isDefaultBodyweight } from "./utils/exerciseLibrary";
import { AnalyticsView } from "./components/AnalyticsView";
import { computeAnalytics, getMuscleGroup } from "./utils/analytics";
import { PlateCalculatorModal } from "./components/PlateCalculatorModal";
import { ReleaseNotesModal } from "./components/ReleaseNotesModal";
import { MobilityTab } from "./components/MobilityTab";

const CLIENT_PRESETS = [
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80",
];

const MUSCLE_GROUPS = ["ALL", "Chest", "Back", "Legs", "Shoulders", "Arms", "Core", "Other"];

export function ClientDashboard({
  userName,
  userImage,
  isAdmin,
}: {
  userName: string;
  userImage: string | null;
  isAdmin?: boolean;
}) {
  const { data: session } = useSession();
  const [workouts, setWorkouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"assigned" | "history" | "analytics" | "mobility">("assigned");

  const [currentImage, setCurrentImage] = useState<string | null>(userImage);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [showPlateModal, setShowPlateModal] = useState(false);
  const [showReleaseModal, setShowReleaseModal] = useState(false);
  const [savingPhoto, setSavingPhoto] = useState(false);

  // History Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedExercise, setSelectedExercise] = useState("ALL");
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState("ALL");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Rest Timer State
  const [restSeconds, setRestSeconds] = useState<number | null>(null);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  // Timer Tick Effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isTimerRunning && restSeconds !== null && restSeconds > 0) {
      interval = setInterval(() => {
        setRestSeconds((prev) => {
          if (prev === null || prev <= 1) {
            setIsTimerRunning(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning, restSeconds]);

  // Set Document Title
  useEffect(() => {
    document.title = "STRKYR Fitness — Client Portal";
  }, []);

  // Dismissible Banner State (Persisted in localStorage)
  const [bannerDismissed, setBannerDismissed] = useState(false);

  useEffect(() => {
    try {
      const isDismissed = localStorage.getItem("fitcoach_free_portal_banner_dismissed");
      if (isDismissed === "true") {
        setBannerDismissed(true);
      }
    } catch {
      // Ignore local storage errors
    }
  }, []);

  const handleDismissBanner = () => {
    setBannerDismissed(true);
    try {
      localStorage.setItem("fitcoach_free_portal_banner_dismissed", "true");
    } catch {
      // Ignore local storage errors
    }
  };

  const fetchWorkouts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/workouts/client");
      if (res.ok) {
        setWorkouts(await res.json());
      }
    } catch (e) {
      console.error("Failed to load workouts", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWorkouts();
  }, [fetchWorkouts]);

  const handleUpdatePhoto = async (newImage: string) => {
    setSavingPhoto(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: newImage }),
      });
      if (res.ok) {
        setCurrentImage(newImage);
        setShowPhotoModal(false);
      }
    } catch {
      alert("Failed to update photo.");
    } finally {
      setSavingPhoto(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("Image must be under 2MB");
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result) {
          handleUpdatePhoto(reader.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const [repeatingWorkoutId, setRepeatingWorkoutId] = useState<string | null>(null);

  const handleDeleteWorkout = async (workoutId: string) => {
    if (!confirm("Are you sure you want to delete this workout? A deletion record will be saved.")) return;
    try {
      const res = await fetch(`/api/workouts/${workoutId}`, { method: "DELETE" });
      if (res.ok) {
        const data = await res.json();
        if (data.workout) {
          setWorkouts((prev) => prev.map((w) => (w.id === workoutId ? { ...w, ...data.workout } : w)));
        } else {
          setWorkouts((prev) => prev.filter((w) => w.id !== workoutId));
        }
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete workout.");
      }
    } catch {
      alert("Network error while deleting workout.");
    }
  };

  const handleRepeatWorkout = async (workout: any) => {
    setRepeatingWorkoutId(workout.id);
    try {
      const res = await fetch("/api/workouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: workout.clientId,
          status: "PLANNED",
          notes: workout.notes ? `Repeat: ${workout.notes}` : `Repeat session from ${new Date(workout.completedAt || workout.createdAt).toLocaleDateString()}`,
          exercises: (workout.exercises || []).map((ex: any) => ({
            name: ex.name,
            category: ex.category || (ex.isBodyweight ? "BODYWEIGHT" : "STRENGTH"),
            isBodyweight: ex.isBodyweight || ex.category === "BODYWEIGHT",
            sets: (ex.sets || []).map((s: any) => ({
              weight: s.weight || 0,
              reps: s.reps || 0,
              notes: s.notes || "",
            })),
          })),
        }),
      });

      if (res.ok) {
        const created = await res.json();
        setWorkouts((prev) => [created, ...prev]);
        setTab("assigned");
      } else {
        const err = await res.json();
        alert(err.error || "Failed to repeat workout.");
      }
    } catch {
      alert("Network error repeating workout.");
    } finally {
      setRepeatingWorkoutId(null);
    }
  };

  const completed = useMemo(() => workouts.filter((w) => w.status === "COMPLETED"), [workouts]);
  const planned = useMemo(() => workouts.filter((w) => w.status === "PLANNED" || w.status === "IN_PROGRESS"), [workouts]);

  const fullAnalytics = useMemo(() => computeAnalytics(workouts), [workouts]);

  // Extract all unique exercises from completed history
  const allCompletedExercises = useMemo(() => {
    const set = new Set<string>();
    completed.forEach((w) => {
      (w.exercises || []).forEach((ex: any) => {
        if (ex.name) set.add(ex.name);
      });
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [completed]);

  // Available exercises filtered by muscle group
  const availableExercises = useMemo(() => {
    if (selectedMuscleGroup === "ALL") return allCompletedExercises;
    return allCompletedExercises.filter((ex) => getMuscleGroup(ex) === selectedMuscleGroup);
  }, [allCompletedExercises, selectedMuscleGroup]);

  // Quick Date Preset
  const applyDatePreset = (days: number | null) => {
    if (days === null) {
      setStartDate("");
      setEndDate("");
      return;
    }
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days);
    setStartDate(start.toISOString().split("T")[0]);
    setEndDate(end.toISOString().split("T")[0]);
  };

  // Filtered completed workouts based on search, exercise, muscle group, and dates
  const filteredCompletedWorkouts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return completed
      .map((workout) => {
        const workoutDate = new Date(workout.completedAt || workout.createdAt);

        // Date Range
        if (startDate) {
          const s = new Date(startDate);
          s.setHours(0, 0, 0, 0);
          if (workoutDate < s) return null;
        }
        if (endDate) {
          const e = new Date(endDate);
          e.setHours(23, 59, 59, 999);
          if (workoutDate > e) return null;
        }

        // Search text matching (notes, exercise names, set notes)
        if (q) {
          const notesMatch = workout.notes?.toLowerCase().includes(q);
          const exNameMatch = (workout.exercises || []).some((ex: any) =>
            ex.name?.toLowerCase().includes(q)
          );
          const setNotesMatch = (workout.exercises || []).some((ex: any) =>
            (ex.sets || []).some((s: any) => s.notes?.toLowerCase().includes(q))
          );
          if (!notesMatch && !exNameMatch && !setNotesMatch) return null;
        }

        // Exercise and Muscle Group Hierarchy
        const matchingExercises = (workout.exercises || []).filter((ex: any) => {
          const mg = getMuscleGroup(ex.name);
          if (selectedMuscleGroup !== "ALL" && mg !== selectedMuscleGroup) return false;
          if (selectedExercise !== "ALL" && ex.name !== selectedExercise) return false;
          return true;
        });

        if (matchingExercises.length === 0) return null;

        return {
          ...workout,
          exercises: matchingExercises,
        };
      })
      .filter((w): w is any => w !== null)
      .sort(
        (a: any, b: any) =>
          new Date(b.completedAt || b.createdAt).getTime() -
          new Date(a.completedAt || a.createdAt).getTime()
      );
  }, [completed, searchQuery, selectedExercise, selectedMuscleGroup, startDate, endDate]);

  const hasActiveFilters = startDate || endDate || selectedMuscleGroup !== "ALL" || selectedExercise !== "ALL" || searchQuery.trim() !== "";

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedExercise("ALL");
    setSelectedMuscleGroup("ALL");
    setStartDate("");
    setEndDate("");
  };

  const copyWorkoutToClipboard = (workout: any) => {
    const dateStr = workout.completedAt
      ? new Date(workout.completedAt).toLocaleDateString(undefined, { dateStyle: "full" })
      : "Workout";

    let text = `💪 Workout - ${dateStr}\n`;
    if (workout.notes) text += `Notes: ${workout.notes}\n`;
    text += `\n`;

    (workout.exercises || []).forEach((ex: any) => {
      const mg = getMuscleGroup(ex.name);
      text += `• ${ex.name} (${mg}):\n`;
      (ex.sets || []).forEach((s: any, idx: number) => {
        text += `   Set ${idx + 1}: ${s.weight} lbs × ${s.reps} reps${s.notes ? ` (${s.notes})` : ""}\n`;
      });
      text += `\n`;
    });

    navigator.clipboard.writeText(text.trim());
    setCopiedId(workout.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="app">
      {/* App Header */}
      <header className="header">
        <div className="header-left">
          <Dumbbell size={20} style={{ color: "#2563eb" }} />
          <span className="header-title">Client Portal</span>
        </div>

        <div className="header-right" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {isAdmin && (
            <Link
              href="/admin"
              className="nav-btn nav-btn-dark"
            >
              <ShieldCheck size={14} />
              <span className="hide-mobile">Admin</span>
            </Link>
          )}

          {/* Release Notes / What's New */}
          <button
            type="button"
            onClick={() => setShowReleaseModal(true)}
            className="nav-btn"
            style={{ display: "flex", alignItems: "center", gap: "5px", color: "#2563eb", fontWeight: 600 }}
            title="What's New in FitCoach"
          >
            <Sparkles size={14} />
            <span className="hide-mobile">What&apos;s New</span>
          </button>

          {/* Recovery */}
          <Link
            href="/recovery"
            className="nav-btn"
            style={{ display: "inline-flex", alignItems: "center", gap: "5px", color: "#0284c7", background: "#f0f9ff", border: "1px solid #bae6fd", fontWeight: 600 }}
            title="Pre/post workout warm-ups, stretches, sauna, and recovery"
          >
            <span>🧘</span>
            <span className="hide-mobile">Recovery</span>
          </Link>

          {/* Nutrition & Macros */}
          <Link
            href="/nutrition"
            className="nav-btn nav-btn-green"
          >
            <span>🥗</span>
            <span className="hide-mobile">Nutrition</span>
          </Link>

          {/* Admin Coach View Switcher */}
          {isAdmin && (
            <button
              type="button"
              onClick={async () => {
                await fetch("/api/user/role", {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ role: "TRAINER" }),
                });
                window.location.href = "/dashboard";
              }}
              className="nav-btn nav-btn-dark"
              style={{ background: "#1e293b", color: "#f8fafc", cursor: "pointer" }}
              title="Switch to Coach / Trainer Dashboard"
            >
              <Dumbbell size={14} />
              <span className="hide-mobile">Coach View</span>
            </button>
          )}

          {/* Plate Calculator Button */}
          <button
            type="button"
            onClick={() => setShowPlateModal(true)}
            className="nav-btn"
            style={{ display: "flex", alignItems: "center", gap: "5px", color: "#2563eb", fontWeight: 600 }}
            title="Open Barbell Plate Calculator"
          >
            <Dumbbell size={14} />
            <span className="hide-mobile">Plate Math</span>
          </button>

          {/* Role Switcher */}
          <Link
            href="/onboarding"
            className="nav-btn"
            style={{ fontSize: "11px", fontWeight: 600, color: "#475569" }}
            title="Switch Persona / Role"
          >
            Switch Role
          </Link>

          {/* Avatar with Clickable Change Modal */}
          <div
            style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" }}
            onClick={() => setShowPhotoModal(true)}
            title="Click to update photo"
          >
            {currentImage ? (
              <img
                src={currentImage}
                alt={userName}
                className="avatar"
                style={{ objectFit: "cover", border: "1px solid #cbd5e1" }}
              />
            ) : (
              <div
                style={{
                  width: "28px",
                  height: "28px",
                  borderRadius: "50%",
                  background: "#eff6ff",
                  color: "#2563eb",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "12px",
                  fontWeight: 700,
                  border: "1px solid #bfdbfe",
                }}
              >
                {userName ? userName.charAt(0).toUpperCase() : <User size={14} />}
              </div>
            )}
            <span className="header-name hide-mobile" style={{ fontSize: "12px" }}>{userName}</span>
          </div>

          <button className="signout-btn" onClick={() => signOut({ callbackUrl: "/auth/signin" })} title="Sign out">
            <LogOut size={16} />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="main" style={{ maxWidth: "860px", margin: "16px auto", padding: "0 14px 60px" }}>
        {/* Dismissible Free Portal Access Banner */}
        {!bannerDismissed && (
          <div
            style={{
              background: "#f0fdf4",
              border: "1px solid #bbf7d0",
              color: "#166534",
              padding: "10px 14px",
              borderRadius: "10px",
              marginBottom: "16px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "10px",
              fontSize: "12px",
              boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Sparkles size={16} style={{ color: "#16a34a", flexShrink: 0 }} />
              <span>
                <b>Client Portal Active:</b> 100% free access to all coach routines &amp; nutrition.
              </span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
              <button
                type="button"
                onClick={() => setShowPhotoModal(true)}
                className="btn-secondary"
                style={{ padding: "4px 8px", fontSize: "11px", borderRadius: "6px", height: "auto" }}
              >
                Photo
              </button>

              <button
                type="button"
                onClick={handleDismissBanner}
                className="btn-ghost"
                style={{ padding: "4px", color: "#166534", height: "auto" }}
                title="Dismiss banner"
                aria-label="Dismiss banner"
              >
                <X size={15} />
              </button>
            </div>
          </div>
        )}

        {/* Gym Floor Rest Timer Bar */}
        <div
          style={{
            background: restSeconds !== null && restSeconds > 0 ? "#eff6ff" : "#f8fafc",
            border: "1px solid",
            borderColor: restSeconds !== null && restSeconds > 0 ? "#bfdbfe" : "#e2e8f0",
            borderRadius: "10px",
            padding: "8px 14px",
            marginBottom: "14px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "10px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Timer size={16} style={{ color: restSeconds !== null && restSeconds > 0 ? "#2563eb" : "#64748b" }} />
            <span style={{ fontSize: "12px", fontWeight: 700, color: "#0f172a" }}>
              Rest Timer:
            </span>
            {restSeconds !== null ? (
              <span style={{ fontSize: "16px", fontWeight: 800, color: restSeconds <= 10 && restSeconds > 0 ? "#dc2626" : "#2563eb", minWidth: "40px" }}>
                {Math.floor(restSeconds / 60)}:{(restSeconds % 60).toString().padStart(2, "0")}
              </span>
            ) : (
              <span style={{ fontSize: "12px", color: "#64748b" }}>Ready</span>
            )}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            {[60, 90, 120, 180].map((sec) => (
              <button
                key={sec}
                type="button"
                onClick={() => {
                  setRestSeconds(sec);
                  setIsTimerRunning(true);
                }}
                style={{
                  padding: "4px 8px",
                  fontSize: "11px",
                  fontWeight: 600,
                  borderRadius: "6px",
                  border: "1px solid #cbd5e1",
                  background: "#ffffff",
                  color: "#1e293b",
                  cursor: "pointer",
                }}
              >
                {sec}s
              </button>
            ))}

            {restSeconds !== null && (
              <>
                <button
                  type="button"
                  onClick={() => setIsTimerRunning((r) => !r)}
                  style={{
                    padding: "4px 8px",
                    fontSize: "11px",
                    fontWeight: 700,
                    borderRadius: "6px",
                    border: "none",
                    background: isTimerRunning ? "#f59e0b" : "#2563eb",
                    color: "#ffffff",
                    cursor: "pointer",
                  }}
                >
                  {isTimerRunning ? "Pause" : "Resume"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRestSeconds(null);
                    setIsTimerRunning(false);
                  }}
                  style={{
                    padding: "4px 8px",
                    fontSize: "11px",
                    borderRadius: "6px",
                    border: "1px solid #e2e8f0",
                    background: "#ffffff",
                    color: "#64748b",
                    cursor: "pointer",
                  }}
                >
                  Reset
                </button>
              </>
            )}
          </div>
        </div>

        {/* Clean Responsive Tab Switcher */}
        <div className="tabs" style={{ marginBottom: "16px" }}>
          <button className={`tab${tab === "assigned" ? " active" : ""}`} onClick={() => setTab("assigned")}>
            Assigned ({planned.length})
          </button>
          <button className={`tab${tab === "history" ? " active" : ""}`} onClick={() => setTab("history")}>
            History ({completed.length})
          </button>
          <button className={`tab${tab === "analytics" ? " active" : ""}`} onClick={() => setTab("analytics")}>
            Progress &amp; PRs
          </button>
          <button className={`tab${tab === "mobility" ? " active" : ""}`} onClick={() => setTab("mobility")}>
            🧘 Recovery
          </button>
        </div>

        {/* TAB 1: Assigned Workouts */}
        {tab === "assigned" && (
          <div className="card" style={{ padding: "16px 18px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
              <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 800 }}>Assigned Routines from Coach</h3>
              <span style={{ fontSize: "11px", fontWeight: 700, color: "#2563eb", background: "#eff6ff", padding: "3px 8px", borderRadius: "10px" }}>
                {planned.length} Active
              </span>
            </div>

            {loading && (
              <div className="empty-state">
                <div className="spin-inline" /> Loading assigned workouts...
              </div>
            )}

            {!loading && !planned.length && (
              <div className="empty-state" style={{ padding: "32px 16px" }}>
                <Dumbbell size={32} style={{ opacity: 0.3, marginBottom: "8px" }} />
                <p style={{ margin: 0, fontWeight: 600, color: "#334155" }}>No pending workouts assigned.</p>
                <span style={{ fontSize: "12px", color: "#64748b" }}>When your coach schedules a routine, it will appear here automatically.</span>
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {planned.map((workout) => (
                <div
                  key={workout.id}
                  style={{
                    background: "#ffffff",
                    border: "1px solid #e2e8f0",
                    borderRadius: "12px",
                    padding: "14px 16px",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px", flexWrap: "wrap", gap: "6px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <Calendar size={14} style={{ color: "#2563eb" }} />
                      <span style={{ fontSize: "13px", fontWeight: 700, color: "#0f172a" }}>
                        Planned Session · {workout.exercises?.length || 0} Exercises
                      </span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ fontSize: "11px", color: "#64748b", fontWeight: 500 }}>
                        {new Date(workout.createdAt).toLocaleDateString()}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDeleteWorkout(workout.id)}
                        className="btn-ghost-danger"
                        title="Remove assigned workout"
                        style={{ padding: "3px 6px", borderRadius: "6px" }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  {workout.notes && (
                    <div style={{ background: "#f8fafc", padding: "8px 12px", borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "12px", color: "#475569", marginBottom: "10px" }}>
                      <FileText size={12} style={{ display: "inline", verticalAlign: "middle", marginRight: "4px" }} />
                      <b>Coach Notes:</b> {workout.notes}
                    </div>
                  )}

                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    {(workout.exercises || []).map((ex: any, idx: number) => {
                      const isBW = ex.isBodyweight || ex.category === "BODYWEIGHT" || isDefaultBodyweight(ex.name);
                      return (
                        <div
                          key={ex.id || idx}
                          style={{
                            background: "#fafafa",
                            border: "1px solid #f1f5f9",
                            borderRadius: "8px",
                            padding: "8px 10px",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            fontSize: "12px",
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <span style={{ fontWeight: 700, color: "#0f172a" }}>{ex.name}</span>
                            {isBW && (
                              <span
                                style={{
                                  fontSize: "9px",
                                  fontWeight: 700,
                                  background: "#f0fdf4",
                                  color: "#166534",
                                  border: "1px solid #bbf7d0",
                                  padding: "1px 5px",
                                  borderRadius: "4px",
                                }}
                              >
                                Bodyweight
                              </span>
                            )}
                          </div>
                          <span style={{ color: "#64748b", fontWeight: 600 }}>
                            {(ex.sets || []).length} sets
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: Workout History with Interactive Search & Filter */}
        {tab === "history" && (
          <div className="card" style={{ padding: "16px 18px", display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
              <div>
                <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 800 }}>Completed Workout History</h3>
                <p style={{ margin: "2px 0 0 0", fontSize: "12px", color: "#64748b" }}>
                  Search specific exercises, sessions, or coach cues across your training log.
                </p>
              </div>
              <span style={{ fontSize: "11px", fontWeight: 700, color: "#16a34a", background: "#f0fdf4", padding: "3px 8px", borderRadius: "10px" }}>
                {completed.length} Total Sessions
              </span>
            </div>

            {/* Filter & Search Bar */}
            <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "14px", display: "flex", flexDirection: "column", gap: "12px" }}>
              {/* Top Search Input */}
              <div style={{ position: "relative" }}>
                <Search size={15} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#64748b" }} />
                <input
                  type="text"
                  className="input"
                  placeholder="Search specific workout (e.g. Bench Press, Squat, Leg Day, heavy, smooth)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ width: "100%", paddingLeft: "36px", fontSize: "13px" }}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#94a3b8", cursor: "pointer" }}
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Multi-tier Dropdown Filters */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "10px" }}>
                {/* Specific Exercise Dropdown */}
                <div>
                  <label style={{ fontSize: "11px", fontWeight: 600, color: "#475569", display: "block", marginBottom: "4px" }}>
                    Specific Exercise
                  </label>
                  <select
                    className="input"
                    value={selectedExercise}
                    onChange={(e) => setSelectedExercise(e.target.value)}
                    style={{ width: "100%", fontSize: "12px", padding: "6px 8px" }}
                  >
                    <option value="ALL">All Exercises ({allCompletedExercises.length})</option>
                    {availableExercises.map((exName) => (
                      <option key={exName} value={exName}>
                        {exName}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Muscle Group Filter */}
                <div>
                  <label style={{ fontSize: "11px", fontWeight: 600, color: "#475569", display: "block", marginBottom: "4px" }}>
                    Muscle Group
                  </label>
                  <select
                    className="input"
                    value={selectedMuscleGroup}
                    onChange={(e) => {
                      setSelectedMuscleGroup(e.target.value);
                      if (e.target.value !== "ALL" && selectedExercise !== "ALL") {
                        const inGroup = allCompletedExercises.find((ex) => ex === selectedExercise && getMuscleGroup(ex) === e.target.value);
                        if (!inGroup) setSelectedExercise("ALL");
                      }
                    }}
                    style={{ width: "100%", fontSize: "12px", padding: "6px 8px" }}
                  >
                    {MUSCLE_GROUPS.map((mg) => (
                      <option key={mg} value={mg}>
                        {mg === "ALL" ? "All Muscle Groups" : mg}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Date Presets */}
                <div>
                  <label style={{ fontSize: "11px", fontWeight: 600, color: "#475569", display: "block", marginBottom: "4px" }}>
                    Timeframe
                  </label>
                  <div style={{ display: "flex", gap: "4px" }}>
                    {[
                      { label: "All", days: null },
                      { label: "30D", days: 30 },
                      { label: "90D", days: 90 },
                      { label: "6M", days: 180 },
                    ].map((p) => (
                      <button
                        key={p.label}
                        type="button"
                        onClick={() => applyDatePreset(p.days)}
                        style={{
                          flex: 1,
                          padding: "6px 4px",
                          fontSize: "11px",
                          fontWeight: 600,
                          borderRadius: "6px",
                          border: "1px solid",
                          borderColor: (!startDate && !endDate && p.days === null) ? "#2563eb" : "#cbd5e1",
                          background: (!startDate && !endDate && p.days === null) ? "#eff6ff" : "#ffffff",
                          color: (!startDate && !endDate && p.days === null) ? "#1e40af" : "#475569",
                          cursor: "pointer",
                        }}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Active Filter Summary & Clear */}
              {hasActiveFilters && (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "6px", borderTop: "1px dashed #cbd5e1" }}>
                  <span style={{ fontSize: "11px", color: "#64748b" }}>
                    Showing <b>{filteredCompletedWorkouts.length}</b> of <b>{completed.length}</b> workouts
                  </span>
                  <button
                    type="button"
                    onClick={clearFilters}
                    style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", background: "none", border: "none", color: "#2563eb", cursor: "pointer", fontWeight: 600 }}
                  >
                    <RotateCcw size={12} /> Clear Filters
                  </button>
                </div>
              )}
            </div>

            {loading && (
              <div className="empty-state">
                <div className="spin-inline" /> Loading history...
              </div>
            )}

            {!loading && !filteredCompletedWorkouts.length && (
              <div className="empty-state" style={{ padding: "32px 16px" }}>
                <p style={{ margin: 0, fontWeight: 600, color: "#334155" }}>
                  {hasActiveFilters ? "No workouts found matching your search criteria." : "No completed workouts logged yet."}
                </p>
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="btn-secondary"
                    style={{ marginTop: "12px", fontSize: "12px" }}
                  >
                    Reset Search Filters
                  </button>
                )}
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {filteredCompletedWorkouts.map((workout: any) => (
                <div
                  key={workout.id}
                  style={{
                    background: "#ffffff",
                    border: "1px solid #e2e8f0",
                    borderRadius: "12px",
                    padding: "14px 16px",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px", flexWrap: "wrap", gap: "6px" }}>
                    <div>
                      <div style={{ fontSize: "13px", fontWeight: 700, color: "#0f172a" }}>
                        {new Date(workout.completedAt || workout.createdAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
                      </div>
                      <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>
                        {workout.loggedByRole === "CLIENT"
                          ? `👤 Logged by You${workout.loggedByName ? ` (${workout.loggedByName})` : ""}`
                          : `🏋️ Logged by Coach${workout.loggedByName ? ` (${workout.loggedByName})` : ""}`}
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <button
                        type="button"
                        onClick={() => handleRepeatWorkout(workout)}
                        disabled={repeatingWorkoutId === workout.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                          fontSize: "11px",
                          fontWeight: 600,
                          background: "#eff6ff",
                          color: "#2563eb",
                          border: "1px solid #bfdbfe",
                          padding: "3px 8px",
                          borderRadius: "6px",
                          cursor: "pointer",
                        }}
                        title="Re-assign this workout to your assigned list"
                      >
                        <RotateCcw size={12} className={repeatingWorkoutId === workout.id ? "spin" : ""} />
                        <span>{repeatingWorkoutId === workout.id ? "Repeating..." : "Repeat"}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => copyWorkoutToClipboard(workout)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                          fontSize: "11px",
                          fontWeight: 600,
                          background: copiedId === workout.id ? "#dcfce7" : "#f1f5f9",
                          color: copiedId === workout.id ? "#16a34a" : "#475569",
                          border: "1px solid",
                          borderColor: copiedId === workout.id ? "#bbf7d0" : "#cbd5e1",
                          padding: "3px 8px",
                          borderRadius: "6px",
                          cursor: "pointer",
                        }}
                        title="Copy session details to clipboard"
                      >
                        {copiedId === workout.id ? <Check size={12} /> : <Copy size={12} />}
                        <span>{copiedId === workout.id ? "Copied!" : "Copy"}</span>
                      </button>

                      {!workout.deletedAt && (
                        <button
                          type="button"
                          onClick={() => handleDeleteWorkout(workout.id)}
                          className="btn-ghost-danger"
                          title="Delete workout from history"
                          style={{ padding: "3px 6px", borderRadius: "6px" }}
                        >
                          <Trash2 size={13} />
                        </button>
                      )}

                      {workout.deletedAt ? (
                        <span style={{ fontSize: "11px", fontWeight: 700, color: "#991b1b", background: "#fef2f2", border: "1px solid #fecaca", padding: "2px 8px", borderRadius: "8px" }}>
                          🗑️ Deleted
                        </span>
                      ) : (
                        <span style={{ fontSize: "11px", fontWeight: 700, color: "#16a34a", background: "#f0fdf4", padding: "2px 8px", borderRadius: "8px" }}>
                          ✓ Finished
                        </span>
                      )}
                    </div>
                  </div>

                  {workout.deletedAt && (
                    <div
                      style={{
                        background: "#fef2f2",
                        border: "1px solid #fecaca",
                        borderRadius: "8px",
                        padding: "8px 12px",
                        marginBottom: "10px",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        color: "#991b1b",
                        fontSize: "12px",
                        fontWeight: 600,
                      }}
                    >
                      <Trash2 size={13} style={{ color: "#dc2626", flexShrink: 0 }} />
                      <span>
                        Workout deleted by <b>{workout.deletedByName || "User"}</b> on{" "}
                        {new Date(workout.deletedAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
                      </span>
                    </div>
                  )}

                  {workout.notes && (
                    <div style={{ fontSize: "12px", color: "#64748b", fontStyle: "italic", marginBottom: "8px" }}>
                      &ldquo;{workout.notes}&rdquo;
                    </div>
                  )}

                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    {(workout.exercises || []).map((ex: any) => {
                      const isBW = ex.isBodyweight || ex.category === "BODYWEIGHT" || isDefaultBodyweight(ex.name);
                      const mg = getMuscleGroup(ex.name);
                      const isHighlighted = selectedExercise === ex.name;

                      return (
                        <div
                          key={ex.id}
                          style={{
                            background: isHighlighted ? "#eff6ff" : "#fafafa",
                            borderRadius: "8px",
                            padding: "8px 10px",
                            border: "1px solid",
                            borderColor: isHighlighted ? "#bfdbfe" : "#f1f5f9",
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                              <span style={{ fontWeight: 700, fontSize: "12px", color: isHighlighted ? "#1e40af" : "#0f172a" }}>
                                {ex.name}
                              </span>
                              <span style={{ fontSize: "10px", color: "#64748b" }}>({mg})</span>
                              {isBW && (
                                <span
                                  style={{
                                    fontSize: "9px",
                                    fontWeight: 700,
                                    background: "#f0fdf4",
                                    color: "#166534",
                                    border: "1px solid #bbf7d0",
                                    padding: "1px 5px",
                                    borderRadius: "4px",
                                  }}
                                >
                                  Bodyweight
                                </span>
                              )}
                            </div>
                            <span style={{ fontSize: "11px", color: "#64748b" }}>
                              {(ex.sets || []).length} sets
                            </span>
                          </div>

                          <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                            {(ex.sets || []).map((st: any) => (
                              <span
                                key={st.id}
                                style={{
                                  background: "#ffffff",
                                  border: "1px solid #e2e8f0",
                                  padding: "2px 6px",
                                  borderRadius: "4px",
                                  fontSize: "11px",
                                  color: "#334155",
                                }}
                              >
                                Set {st.order + 1}:{" "}
                                {ex.category === "STRETCHING" || ex.name.toLowerCase().includes("stretch") || ex.name.toLowerCase().includes("warm") || ex.name.toLowerCase().includes("pose") || ex.name.toLowerCase().includes("roll") ? (
                                  <><b>{st.reps}s</b> hold</>
                                ) : isBW ? (
                                  st.weight > 0 ? (
                                    <><b>BW + {st.weight} lbs</b> × <b>{st.reps}</b></>
                                  ) : (
                                    <><b>BW</b> × <b>{st.reps}</b></>
                                  )
                                ) : (
                                  <><b>{st.weight}</b> lbs × <b>{st.reps}</b></>
                                )}
                              </span>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: Analytics & PRs */}
        {tab === "analytics" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <AnalyticsView analytics={fullAnalytics} />
          </div>
        )}

        {/* TAB 4: Mobility & Recovery */}
        {tab === "mobility" && (
          <MobilityTab
            clientId={workouts[0]?.clientId || (session?.user as any)?.id || ""}
            clientName={userName}
            isTrainer={false}
            onLogCompletedRoutine={(newWorkout) => {
              setWorkouts((prev) => [newWorkout, ...prev]);
            }}
            recentWorkoutExercises={
              completed.length > 0
                ? completed[0].exercises?.map((ex: any) => ({ name: ex.name, category: ex.category }))
                : undefined
            }
          />
        )}
      </main>

      {/* Photo Change Modal */}
      {showPhotoModal && (
        <div className="client-modal-backdrop" onClick={() => setShowPhotoModal(false)}>
          <div className="client-modal-card" style={{ maxWidth: "420px" }} onClick={(e) => e.stopPropagation()}>
            <div className="client-modal-header">
              <h2 className="client-modal-title">Update Profile Photo</h2>
              <button className="client-modal-close" onClick={() => setShowPhotoModal(false)}>
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: "16px 0", display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ textAlign: "center" }}>
                {currentImage ? (
                  <img
                    src={currentImage}
                    alt="Preview"
                    style={{ width: "80px", height: "80px", borderRadius: "50%", objectFit: "cover", margin: "0 auto 8px auto", border: "2px solid #2563eb" }}
                  />
                ) : (
                  <div
                    style={{ width: "80px", height: "80px", borderRadius: "50%", background: "#eff6ff", color: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 8px auto", fontSize: "32px" }}
                  >
                    👤
                  </div>
                )}
              </div>

              <div>
                <label className="btn-secondary" style={{ width: "100%", justifyContent: "center", cursor: "pointer", padding: "10px" }}>
                  <Camera size={16} />
                  <span>Upload from Device</span>
                  <input type="file" accept="image/*" onChange={handleFileChange} style={{ display: "none" }} />
                </label>
              </div>

              <div>
                <span style={{ fontSize: "11px", fontWeight: 600, color: "#64748b", textTransform: "uppercase", display: "block", marginBottom: "8px" }}>
                  Or pick a preset avatar:
                </span>
                <div style={{ display: "flex", gap: "8px", justifyContent: "center", flexWrap: "wrap" }}>
                  {CLIENT_PRESETS.map((url, idx) => (
                    <img
                      key={idx}
                      src={url}
                      alt={`Preset ${idx + 1}`}
                      onClick={() => handleUpdatePhoto(url)}
                      style={{ width: "36px", height: "36px", borderRadius: "50%", cursor: "pointer", border: currentImage === url ? "2px solid #2563eb" : "1px solid #cbd5e1" }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="client-modal-footer">
              <button type="button" onClick={() => setShowPhotoModal(false)} className="btn-secondary" style={{ width: "100%" }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Barbell Plate Math Calculator Modal */}
      {showPlateModal && (
        <PlateCalculatorModal
          initialWeight={135}
          onClose={() => setShowPlateModal(false)}
        />
      )}

      {/* Release Notes Modal */}
      <ReleaseNotesModal
        isOpen={showReleaseModal}
        onClose={() => setShowReleaseModal(false)}
      />
    </div>
  );
}
