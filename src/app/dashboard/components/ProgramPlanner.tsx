"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  CalendarRange,
  Plus,
  Trash2,
  Edit3,
  CheckCircle2,
  Clock,
  Dumbbell,
  Users,
  Sparkles,
  Layers,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Play,
  Calendar,
  AlertCircle,
  TrendingUp,
  RefreshCw,
  Save,
  X,
  Sliders,
  Check,
  Flame,
  Info,
} from "lucide-react";
import { INITIAL_UNIFIED_EXERCISES } from "@/lib/unifiedExerciseLibrary";

export interface ProgramExerciseItem {
  id?: string;
  name: string;
  order: number;
  category?: string;
  targetSets: number;
  targetReps: string;
  suggestedWeight?: number;
  rpe?: number;
  supersetGroup?: string | null;
  restSeconds?: number;
  coachingCue?: string;
  progressionNotes?: string;
}

export interface ProgramWorkoutDay {
  id?: string;
  name: string;
  order: number;
  cadence: string;
  dayOfWeek?: number | null;
  exercises: ProgramExerciseItem[];
}

export interface TrainingProgramData {
  id: string;
  trainerId: string;
  clientId?: string | null;
  name: string;
  description?: string | null;
  durationWeeks: number;
  startDate?: string | null;
  endDate?: string | null;
  status: "DRAFT" | "IN_PROGRESS" | "COMPLETED" | "ARCHIVED";
  progressionType: string;
  progressionRate?: number | null;
  deloadFrequency?: number | null;
  notes?: string | null;
  client?: { id: string; name: string; email?: string; image?: string } | null;
  workoutTemplates: ProgramWorkoutDay[];
  stats?: {
    totalWorkouts: number;
    completedWorkouts: number;
    remainingWorkouts: number;
    completionPercentage: number;
  };
}

interface ProgramPlannerProps {
  clientId?: string;
  clientsList?: Array<{ id: string; name: string; image?: string }>;
  isTrainer?: boolean;
  onStartPlannedWorkout?: (workoutId: string) => void;
}

const REST_TIME_PRESETS = [
  { seconds: 30, label: "30s (Cardio / Endurance)" },
  { seconds: 45, label: "45s (Superset / Circuit)" },
  { seconds: 60, label: "60s (Standard Hypertrophy)" },
  { seconds: 90, label: "90s (Heavy Hypertrophy)" },
  { seconds: 120, label: "2 min (Strength Compound)" },
  { seconds: 180, label: "3 min (Powerlifting Heavy)" },
];

const SUPERSET_PRESETS = ["None", "A1", "A2", "B1", "B2", "C1", "C2"];

export function ProgramPlanner({
  clientId,
  clientsList = [],
  isTrainer = true,
  onStartPlannedWorkout,
}: ProgramPlannerProps) {
  const [programs, setPrograms] = useState<TrainingProgramData[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<"ALL" | "IN_PROGRESS" | "DRAFT" | "COMPLETED">("ALL");

  // Program Editor State
  const [editingProgram, setEditingProgram] = useState<TrainingProgramData | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [savingProgram, setSavingProgram] = useState(false);

  // Form Fields
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formDurationWeeks, setFormDurationWeeks] = useState(6);
  const [formProgressionType, setFormProgressionType] = useState("LINEAR_OVERLOAD");
  const [formProgressionRate, setFormProgressionRate] = useState(2.5);
  const [formDeloadFrequency, setFormDeloadFrequency] = useState(4);
  const [formDays, setFormDays] = useState<ProgramWorkoutDay[]>([]);
  const [selectedExerciseSuggestions, setSelectedExerciseSuggestions] = useState<string[]>([]);

  // Assign Modal State
  const [assigningProgram, setAssigningProgram] = useState<TrainingProgramData | null>(null);
  const [assignTargetClientId, setAssignTargetClientId] = useState<string>(clientId || (clientsList[0]?.id || ""));
  const [assignStartDate, setAssignStartDate] = useState<string>(() => new Date().toISOString().split("T")[0]);
  const [isAssigning, setIsAssigning] = useState(false);
  const [assignSuccessMessage, setAssignSuccessMessage] = useState<string | null>(null);

  // Schedule Preview Modal
  const [previewingProgram, setPreviewingProgram] = useState<TrainingProgramData | null>(null);

  const fetchPrograms = useCallback(async () => {
    setLoading(true);
    try {
      const url = clientId ? `/api/programs?clientId=${clientId}` : "/api/programs";
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setPrograms(data.programs || []);
      }
    } catch (err) {
      console.error("Failed to load programs:", err);
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    fetchPrograms();
  }, [fetchPrograms]);

  const filteredPrograms = useMemo(() => {
    if (filterStatus === "ALL") return programs;
    return programs.filter((p) => p.status === filterStatus);
  }, [programs, filterStatus]);

  // Open Creator for a brand new program
  const handleOpenCreateNew = () => {
    setFormName("New 6-Week Strength & Hypertrophy Program");
    setFormDescription("Progressive overload training program designed for strength and muscular development.");
    setFormDurationWeeks(6);
    setFormProgressionType("LINEAR_OVERLOAD");
    setFormProgressionRate(2.5);
    setFormDeloadFrequency(4);
    setFormDays([
      {
        name: "Day 1 — Upper Body Push & Chest Power",
        order: 0,
        cadence: "WEEKLY",
        exercises: [
          {
            name: "Barbell Bench Press",
            order: 0,
            category: "STRENGTH",
            targetSets: 4,
            targetReps: "6-8",
            suggestedWeight: 185,
            rpe: 8,
            supersetGroup: null,
            restSeconds: 120,
            coachingCue: "Retract scapulae, drive feet into floor, touch lower sternum under control.",
          },
          {
            name: "Incline Barbell Bench Press",
            order: 1,
            category: "STRENGTH",
            targetSets: 3,
            targetReps: "8-10",
            suggestedWeight: 145,
            rpe: 8,
            supersetGroup: "A1",
            restSeconds: 45,
            coachingCue: "Lower to upper clavicular notch without flaring elbows.",
          },
          {
            name: "Dumbbell Lateral Raise",
            order: 2,
            category: "STRENGTH",
            targetSets: 3,
            targetReps: "12-15",
            suggestedWeight: 25,
            rpe: 8.5,
            supersetGroup: "A2",
            restSeconds: 90,
            coachingCue: "Abduct in scapular plane with soft elbows.",
          },
          {
            name: "Cable Tricep Pushdown",
            order: 3,
            category: "STRENGTH",
            targetSets: 3,
            targetReps: "12",
            suggestedWeight: 55,
            rpe: 9,
            supersetGroup: null,
            restSeconds: 60,
            coachingCue: "Pin elbows to ribs and lock out fully at bottom.",
          },
        ],
      },
      {
        name: "Day 2 — Lower Body Squat & Quad Focus",
        order: 1,
        cadence: "WEEKLY",
        exercises: [
          {
            name: "Barbell Back Squat",
            order: 0,
            category: "STRENGTH",
            targetSets: 4,
            targetReps: "6",
            suggestedWeight: 225,
            rpe: 8,
            supersetGroup: null,
            restSeconds: 180,
            coachingCue: "Brace 360°, break hips & knees simultaneously, track knees over toes.",
          },
          {
            name: "Romanian Deadlift (RDL)",
            order: 1,
            category: "STRENGTH",
            targetSets: 3,
            targetReps: "8-10",
            suggestedWeight: 185,
            rpe: 8,
            supersetGroup: null,
            restSeconds: 120,
            coachingCue: "Hinge hips back with soft knees, feel deep hamstring stretch.",
          },
          {
            name: "Leg Extension",
            order: 2,
            category: "STRENGTH",
            targetSets: 3,
            targetReps: "12-15",
            suggestedWeight: 120,
            rpe: 9,
            supersetGroup: "B1",
            restSeconds: 45,
            coachingCue: "Extend to full terminal knee lockout and hold apex 1s.",
          },
          {
            name: "Lying / Seated Leg Curl",
            order: 3,
            category: "STRENGTH",
            targetSets: 3,
            targetReps: "12-15",
            suggestedWeight: 110,
            rpe: 9,
            supersetGroup: "B2",
            restSeconds: 90,
            coachingCue: "Curl heels to glutes keeping hips pressed down into pad.",
          },
        ],
      },
      {
        name: "Day 3 — Back Pull & Posterior Chain",
        order: 2,
        cadence: "WEEKLY",
        exercises: [
          {
            name: "Barbell Bent-Over Row",
            order: 0,
            category: "STRENGTH",
            targetSets: 4,
            targetReps: "8",
            suggestedWeight: 155,
            rpe: 8,
            supersetGroup: null,
            restSeconds: 120,
            coachingCue: "Hinge to 45°, drive elbows to hips, squeeze rhomboids.",
          },
          {
            name: "Lat Pulldown (Wide Grip)",
            order: 1,
            category: "STRENGTH",
            targetSets: 3,
            targetReps: "10-12",
            suggestedWeight: 140,
            rpe: 8.5,
            supersetGroup: "C1",
            restSeconds: 45,
            coachingCue: "Drive elbows down into back pockets with proud chest.",
          },
          {
            name: "Cable Face Pull",
            order: 2,
            category: "STRENGTH",
            targetSets: 3,
            targetReps: "15",
            suggestedWeight: 45,
            rpe: 8,
            supersetGroup: "C2",
            restSeconds: 60,
            coachingCue: "Pull rope to bridge of nose with external rotation.",
          },
          {
            name: "Dumbbell Hammer Curl",
            order: 3,
            category: "STRENGTH",
            targetSets: 3,
            targetReps: "12",
            suggestedWeight: 35,
            rpe: 9,
            supersetGroup: null,
            restSeconds: 60,
            coachingCue: "Strict neutral thumbs-up grip isolating brachialis.",
          },
        ],
      },
    ]);
    setEditingProgram(null);
    setIsCreatingNew(true);
  };

  // Open Editor for an existing program
  const handleOpenEdit = (program: TrainingProgramData) => {
    setEditingProgram(program);
    setFormName(program.name);
    setFormDescription(program.description || "");
    setFormDurationWeeks(program.durationWeeks);
    setFormProgressionType(program.progressionType || "LINEAR_OVERLOAD");
    setFormProgressionRate(program.progressionRate || 2.5);
    setFormDeloadFrequency(program.deloadFrequency || 4);
    setFormDays(
      program.workoutTemplates.map((wt) => ({
        id: wt.id,
        name: wt.name,
        order: wt.order,
        cadence: wt.cadence,
        dayOfWeek: wt.dayOfWeek,
        exercises: (wt.exercises || []).map((ex) => ({
          id: ex.id,
          name: ex.name,
          order: ex.order,
          category: ex.category || "STRENGTH",
          targetSets: ex.targetSets || 3,
          targetReps: String(ex.targetReps || "8-10"),
          suggestedWeight: ex.suggestedWeight || 0,
          rpe: ex.rpe || undefined,
          supersetGroup: ex.supersetGroup || null,
          restSeconds: ex.restSeconds || (ex.supersetGroup ? 45 : 90),
          coachingCue: ex.coachingCue || "",
          progressionNotes: ex.progressionNotes || "",
        })),
      }))
    );
    setIsCreatingNew(true);
  };

  // Save Program (Create or Update with Live Sync)
  const handleSaveProgram = async () => {
    if (!formName.trim()) {
      alert("Please enter a program name.");
      return;
    }
    if (formDays.length === 0) {
      alert("Please add at least one workout day to the program.");
      return;
    }

    setSavingProgram(true);
    try {
      const payload = {
        name: formName.trim(),
        description: formDescription.trim(),
        durationWeeks: formDurationWeeks,
        progressionType: formProgressionType,
        progressionRate: formProgressionRate,
        deloadFrequency: formDeloadFrequency,
        workoutTemplates: formDays,
      };

      let res;
      if (editingProgram?.id) {
        res = await fetch(`/api/programs/${editingProgram.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch("/api/programs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      if (res.ok) {
        setIsCreatingNew(false);
        setEditingProgram(null);
        await fetchPrograms();
        alert(
          editingProgram?.status === "IN_PROGRESS"
            ? "✓ Program updated and all upcoming planned workouts successfully synchronized!"
            : "✓ Program saved successfully!"
        );
      } else {
        const data = await res.json();
        alert(data.error || "Failed to save program.");
      }
    } catch {
      alert("Error saving program.");
    } finally {
      setSavingProgram(false);
    }
  };

  // Delete Program
  const handleDeleteProgram = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"? Uncompleted planned sessions will be removed.`)) return;
    try {
      const res = await fetch(`/api/programs/${id}`, { method: "DELETE" });
      if (res.ok) {
        await fetchPrograms();
      } else {
        alert("Failed to delete program.");
      }
    } catch {
      alert("Error deleting program.");
    }
  };

  // Assign Program to Client
  const handleAssignProgram = async () => {
    if (!assigningProgram || !assignTargetClientId) return;
    setIsAssigning(true);
    setAssignSuccessMessage(null);
    try {
      const res = await fetch(`/api/programs/${assigningProgram.id}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: assignTargetClientId,
          startDate: assignStartDate,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setAssignSuccessMessage(data.message);
        await fetchPrograms();
        setTimeout(() => {
          setAssigningProgram(null);
          setAssignSuccessMessage(null);
        }, 1800);
      } else {
        const data = await res.json();
        alert(data.error || "Failed to assign program.");
      }
    } catch {
      alert("Error assigning program.");
    } finally {
      setIsAssigning(false);
    }
  };

  // Helper to add day
  const handleAddDay = () => {
    const newOrder = formDays.length;
    setFormDays([
      ...formDays,
      {
        name: `Day ${newOrder + 1} — New Workout Split`,
        order: newOrder,
        cadence: "WEEKLY",
        exercises: [
          {
            name: "Barbell Bench Press",
            order: 0,
            category: "STRENGTH",
            targetSets: 3,
            targetReps: "8-10",
            suggestedWeight: 135,
            rpe: 8,
            supersetGroup: null,
            restSeconds: 90,
            coachingCue: "",
          },
        ],
      },
    ]);
  };

  // Helper to remove day
  const handleRemoveDay = (dayIdx: number) => {
    setFormDays(formDays.filter((_, idx) => idx !== dayIdx));
  };

  // Helper to add exercise to day
  const handleAddExerciseToDay = (dayIdx: number) => {
    const updated = [...formDays];
    const targetDay = updated[dayIdx];
    targetDay.exercises.push({
      name: "Exercise Name",
      order: targetDay.exercises.length,
      category: "STRENGTH",
      targetSets: 3,
      targetReps: "8-10",
      suggestedWeight: 50,
      rpe: 8,
      supersetGroup: null,
      restSeconds: 90,
      coachingCue: "",
    });
    setFormDays(updated);
  };

  // Helper to remove exercise
  const handleRemoveExercise = (dayIdx: number, exIdx: number) => {
    const updated = [...formDays];
    updated[dayIdx].exercises = updated[dayIdx].exercises.filter((_, idx) => idx !== exIdx);
    setFormDays(updated);
  };

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", paddingBottom: "80px" }}>
      {/* Header & Controls */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "12px",
          marginBottom: "20px",
        }}
      >
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: 800, color: "#0f172a", display: "flex", alignItems: "center", gap: "8px" }}>
            <CalendarRange size={26} color="#0284c7" />
            <span>Training Program Planner</span>
          </h1>
          <p style={{ fontSize: "14px", color: "#64748b", marginTop: "2px" }}>
            Design multi-week progressive overload programs, supersets, and automated client periodization.
          </p>
        </div>

        {isTrainer && (
          <button
            onClick={handleOpenCreateNew}
            className="action-btn"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              background: "linear-gradient(135deg, #0284c7, #0369a1)",
              color: "#ffffff",
              padding: "10px 18px",
              borderRadius: "10px",
              fontWeight: 700,
              fontSize: "14px",
              border: "none",
              cursor: "pointer",
              boxShadow: "0 4px 12px rgba(2, 132, 199, 0.25)",
            }}
          >
            <Plus size={18} />
            <span>Create New Program</span>
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div
        style={{
          display: "flex",
          gap: "8px",
          borderBottom: "1px solid #e2e8f0",
          paddingBottom: "10px",
          marginBottom: "20px",
          overflowX: "auto",
        }}
      >
        {[
          { id: "ALL", label: "All Programs" },
          { id: "IN_PROGRESS", label: "⚡ In-Progress" },
          { id: "DRAFT", label: "📝 Drafts" },
          { id: "COMPLETED", label: "✓ Completed" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilterStatus(tab.id as any)}
            style={{
              padding: "6px 14px",
              borderRadius: "20px",
              fontSize: "13px",
              fontWeight: filterStatus === tab.id ? 700 : 500,
              background: filterStatus === tab.id ? "#0284c7" : "#f1f5f9",
              color: filterStatus === tab.id ? "#ffffff" : "#475569",
              border: "none",
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Program Cards Grid */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>
          <RefreshCw className="spin-inline" size={24} style={{ marginBottom: "8px" }} />
          <div>Loading training programs...</div>
        </div>
      ) : filteredPrograms.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "48px 20px",
            background: "#ffffff",
            borderRadius: "14px",
            border: "1px dashed #cbd5e1",
          }}
        >
          <CalendarRange size={40} color="#94a3b8" style={{ margin: "0 auto 12px" }} />
          <h3 style={{ fontSize: "17px", fontWeight: 700, color: "#1e293b", marginBottom: "6px" }}>
            No Programs Found
          </h3>
          <p style={{ fontSize: "14px", color: "#64748b", maxWidth: "420px", margin: "0 auto 16px" }}>
            Create custom multi-week training programs with automated periodization and assign them to your athletes.
          </p>
          {isTrainer && (
            <button
              onClick={handleOpenCreateNew}
              style={{
                background: "#0284c7",
                color: "#ffffff",
                padding: "8px 16px",
                borderRadius: "8px",
                fontWeight: 600,
                border: "none",
                cursor: "pointer",
              }}
            >
              + Create First Program
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "16px" }}>
          {filteredPrograms.map((program) => {
            const isActive = program.status === "IN_PROGRESS";
            const isDraft = program.status === "DRAFT";
            const stats = program.stats;

            return (
              <div
                key={program.id}
                style={{
                  background: "#ffffff",
                  borderRadius: "14px",
                  border: isActive ? "1.5px solid #38bdf8" : "1px solid #e2e8f0",
                  boxShadow: isActive ? "0 4px 16px rgba(56, 189, 248, 0.12)" : "0 2px 8px rgba(0,0,0,0.04)",
                  padding: "18px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  transition: "all 0.15s ease",
                }}
              >
                <div>
                  {/* Status & Duration Badge */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: 800,
                        padding: "3px 8px",
                        borderRadius: "6px",
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                        background: isActive ? "#e0f2fe" : isDraft ? "#f1f5f9" : "#dcfce7",
                        color: isActive ? "#0369a1" : isDraft ? "#475569" : "#15803d",
                      }}
                    >
                      {isActive ? "⚡ In-Progress" : isDraft ? "📝 Draft" : "✓ Completed"}
                    </span>

                    <span style={{ fontSize: "12px", color: "#64748b", fontWeight: 600, display: "flex", alignItems: "center", gap: "4px" }}>
                      <Clock size={13} />
                      {program.durationWeeks} Weeks ({program.workoutTemplates.length} Days/Wk)
                    </span>
                  </div>

                  {/* Title & Description */}
                  <h3 style={{ fontSize: "17px", fontWeight: 800, color: "#0f172a", marginBottom: "6px" }}>
                    {program.name}
                  </h3>
                  {program.description && (
                    <p style={{ fontSize: "13px", color: "#64748b", marginBottom: "12px", lineHeight: "1.4" }}>
                      {program.description}
                    </p>
                  )}

                  {/* Assigned Client Pill */}
                  {program.client ? (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        background: "#f8fafc",
                        padding: "6px 10px",
                        borderRadius: "8px",
                        marginBottom: "12px",
                      }}
                    >
                      <Users size={14} color="#0284c7" />
                      <span style={{ fontSize: "12px", fontWeight: 700, color: "#1e293b" }}>
                        Assigned to: {program.client.name}
                      </span>
                    </div>
                  ) : (
                    <div style={{ fontSize: "12px", color: "#94a3b8", marginBottom: "12px", fontStyle: "italic" }}>
                      Not yet assigned to a client
                    </div>
                  )}

                  {/* Periodization Settings Overview */}
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: "6px",
                      marginBottom: "14px",
                    }}
                  >
                    <span style={{ fontSize: "11px", fontWeight: 600, background: "#f1f5f9", padding: "2px 8px", borderRadius: "4px", color: "#475569" }}>
                      📈 +{program.progressionRate ?? 2.5}% / wk Overload
                    </span>
                    {program.deloadFrequency && program.deloadFrequency > 0 && (
                      <span style={{ fontSize: "11px", fontWeight: 600, background: "#fef3c7", padding: "2px 8px", borderRadius: "4px", color: "#92400e" }}>
                        🧘 Deload W{program.deloadFrequency}
                      </span>
                    )}
                    <span style={{ fontSize: "11px", fontWeight: 600, background: "#ede9fe", padding: "2px 8px", borderRadius: "4px", color: "#6d28d9" }}>
                      🔗 Supersets & Timers
                    </span>
                  </div>

                  {/* Progress Bar for Active Program */}
                  {isActive && stats && stats.totalWorkouts > 0 && (
                    <div style={{ marginBottom: "14px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", fontWeight: 700, marginBottom: "4px" }}>
                        <span style={{ color: "#0f172a" }}>Program Progress</span>
                        <span style={{ color: "#0284c7" }}>
                          {stats.completedWorkouts} / {stats.totalWorkouts} ({stats.completionPercentage}%)
                        </span>
                      </div>
                      <div style={{ width: "100%", height: "6px", background: "#e2e8f0", borderRadius: "3px", overflow: "hidden" }}>
                        <div
                          style={{
                            width: `${stats.completionPercentage}%`,
                            height: "100%",
                            background: "linear-gradient(90deg, #38bdf8, #0284c7)",
                            borderRadius: "3px",
                            transition: "width 0.3s ease",
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Card Actions */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    borderTop: "1px solid #f1f5f9",
                    paddingTop: "12px",
                    marginTop: "8px",
                  }}
                >
                  {isTrainer && !isActive && (
                    <button
                      onClick={() => {
                        setAssigningProgram(program);
                        setAssignTargetClientId(clientId || (clientsList[0]?.id || ""));
                      }}
                      style={{
                        flex: 1,
                        background: "#0284c7",
                        color: "#ffffff",
                        padding: "7px 12px",
                        borderRadius: "8px",
                        fontWeight: 700,
                        fontSize: "13px",
                        border: "none",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "6px",
                      }}
                    >
                      <Play size={14} />
                      <span>Assign to Client</span>
                    </button>
                  )}

                  {isTrainer && (
                    <button
                      onClick={() => handleOpenEdit(program)}
                      style={{
                        padding: "7px 12px",
                        borderRadius: "8px",
                        fontWeight: 600,
                        fontSize: "13px",
                        background: "#f8fafc",
                        border: "1px solid #cbd5e1",
                        color: "#334155",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                      title={isActive ? "Edit In-Progress Program (Syncs upcoming workouts)" : "Edit Program"}
                    >
                      <Edit3 size={14} />
                      <span>{isActive ? "Edit Active" : "Edit"}</span>
                    </button>
                  )}

                  {isTrainer && (
                    <button
                      onClick={() => handleDeleteProgram(program.id, program.name)}
                      style={{
                        padding: "7px 10px",
                        borderRadius: "8px",
                        background: "#fee2e2",
                        border: "none",
                        color: "#dc2626",
                        cursor: "pointer",
                      }}
                      title="Delete Program"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Program Creator / Editor Modal */}
      {isCreatingNew && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(15, 23, 42, 0.7)",
            backdropFilter: "blur(4px)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
          }}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: "16px",
              width: "100%",
              maxWidth: "880px",
              maxHeight: "92vh",
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
              overflow: "hidden",
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: "16px 20px",
                borderBottom: "1px solid #e2e8f0",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background: "#f8fafc",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <CalendarRange size={22} color="#0284c7" />
                <h2 style={{ fontSize: "18px", fontWeight: 800, color: "#0f172a" }}>
                  {editingProgram ? (editingProgram.status === "IN_PROGRESS" ? "Edit In-Progress Program (Live Sync)" : "Edit Program") : "Build New Training Program"}
                </h2>
              </div>
              <button
                onClick={() => setIsCreatingNew(false)}
                style={{ background: "transparent", border: "none", color: "#64748b", cursor: "pointer" }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: "20px", overflowY: "auto", flex: 1 }}>
              {editingProgram?.status === "IN_PROGRESS" && (
                <div
                  style={{
                    background: "#eff6ff",
                    border: "1px solid #bfdbfe",
                    borderRadius: "8px",
                    padding: "12px 14px",
                    marginBottom: "16px",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                  }}
                >
                  <Info size={18} color="#2563eb" />
                  <span style={{ fontSize: "13px", color: "#1e40af", fontWeight: 600 }}>
                    Live In-Progress Sync: Saving edits will automatically update all future uncompleted planned sessions on your client&apos;s schedule.
                  </span>
                </div>
              )}

              {/* Program Meta Details */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "14px", marginBottom: "20px" }}>
                <div>
                  <label style={{ fontSize: "13px", fontWeight: 700, color: "#334155", display: "block", marginBottom: "4px" }}>
                    Program Name *
                  </label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. 8-Week Hypertrophy & Power"
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      borderRadius: "8px",
                      border: "1px solid #cbd5e1",
                      fontSize: "14px",
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: "13px", fontWeight: 700, color: "#334155", display: "block", marginBottom: "4px" }}>
                    Duration (Weeks)
                  </label>
                  <select
                    value={formDurationWeeks}
                    onChange={(e) => setFormDurationWeeks(parseInt(e.target.value, 10))}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      borderRadius: "8px",
                      border: "1px solid #cbd5e1",
                      fontSize: "14px",
                    }}
                  >
                    <option value={4}>4 Weeks (1 Month Quick Cycle)</option>
                    <option value={6}>6 Weeks (Standard Block)</option>
                    <option value={8}>8 Weeks (2 Months Hypertrophy)</option>
                    <option value={12}>12 Weeks (3 Months Periodization)</option>
                    <option value={16}>16 Weeks (Extended Prep)</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: "13px", fontWeight: 700, color: "#334155", display: "block", marginBottom: "4px" }}>
                    Progressive Overload Rate
                  </label>
                  <select
                    value={formProgressionRate}
                    onChange={(e) => setFormProgressionRate(parseFloat(e.target.value))}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      borderRadius: "8px",
                      border: "1px solid #cbd5e1",
                      fontSize: "14px",
                    }}
                  >
                    <option value={0}>0% (Maintain Static Weights)</option>
                    <option value={2}>+2.0% / Week (Conservative)</option>
                    <option value={2.5}>+2.5% / Week (Recommended)</option>
                    <option value={3.5}>+3.5% / Week (Aggressive)</option>
                    <option value={5}>+5.0% / Week (Novice Linear)</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: "13px", fontWeight: 700, color: "#334155", display: "block", marginBottom: "4px" }}>
                    Deload Week Frequency
                  </label>
                  <select
                    value={formDeloadFrequency}
                    onChange={(e) => setFormDeloadFrequency(parseInt(e.target.value, 10))}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      borderRadius: "8px",
                      border: "1px solid #cbd5e1",
                      fontSize: "14px",
                    }}
                  >
                    <option value={0}>No Deload Weeks</option>
                    <option value={4}>Every 4th Week (Recommended)</option>
                    <option value={6}>Every 6th Week</option>
                  </select>
                </div>
              </div>

              {/* Workout Days Builder */}
              <div style={{ marginBottom: "20px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                  <h3 style={{ fontSize: "16px", fontWeight: 800, color: "#0f172a" }}>
                    Weekly Workout Splits &amp; Exercises ({formDays.length} Days)
                  </h3>
                  <button
                    onClick={handleAddDay}
                    type="button"
                    style={{
                      background: "#f0fdf4",
                      color: "#16a34a",
                      border: "1px solid #bbf7d0",
                      padding: "6px 12px",
                      borderRadius: "8px",
                      fontSize: "13px",
                      fontWeight: 700,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    <Plus size={15} /> Add Workout Day
                  </button>
                </div>

                {formDays.map((day, dayIdx) => (
                  <div
                    key={dayIdx}
                    style={{
                      background: "#f8fafc",
                      border: "1px solid #e2e8f0",
                      borderRadius: "12px",
                      padding: "16px",
                      marginBottom: "16px",
                    }}
                  >
                    {/* Day Header */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                      <input
                        type="text"
                        value={day.name}
                        onChange={(e) => {
                          const updated = [...formDays];
                          updated[dayIdx].name = e.target.value;
                          setFormDays(updated);
                        }}
                        style={{
                          fontSize: "15px",
                          fontWeight: 800,
                          color: "#0f172a",
                          background: "#ffffff",
                          border: "1px solid #cbd5e1",
                          borderRadius: "6px",
                          padding: "4px 10px",
                          flex: 1,
                          marginRight: "10px",
                        }}
                      />
                      <button
                        onClick={() => handleRemoveDay(dayIdx)}
                        style={{ background: "transparent", border: "none", color: "#dc2626", cursor: "pointer" }}
                        title="Remove Day"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    {/* Exercise List */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      {day.exercises.map((ex, exIdx) => {
                        const isSuperset = !!ex.supersetGroup && ex.supersetGroup !== "None";

                        return (
                          <div
                            key={exIdx}
                            style={{
                              background: "#ffffff",
                              border: isSuperset ? "1.5px solid #a855f7" : "1px solid #e2e8f0",
                              borderRadius: "8px",
                              padding: "10px 12px",
                              display: "grid",
                              gridTemplateColumns: "2fr 70px 90px 90px 90px 110px 30px",
                              gap: "8px",
                              alignItems: "center",
                            }}
                          >
                            {/* Exercise Name */}
                            <input
                              type="text"
                              value={ex.name}
                              onChange={(e) => {
                                const updated = [...formDays];
                                updated[dayIdx].exercises[exIdx].name = e.target.value;
                                setFormDays(updated);
                              }}
                              placeholder="Exercise Name"
                              style={{
                                border: "1px solid #e2e8f0",
                                borderRadius: "6px",
                                padding: "6px 8px",
                                fontSize: "13px",
                                fontWeight: 600,
                              }}
                            />

                            {/* Sets */}
                            <div>
                              <input
                                type="number"
                                value={ex.targetSets}
                                onChange={(e) => {
                                  const updated = [...formDays];
                                  updated[dayIdx].exercises[exIdx].targetSets = parseInt(e.target.value, 10) || 1;
                                  setFormDays(updated);
                                }}
                                title="Sets"
                                style={{
                                  width: "100%",
                                  border: "1px solid #e2e8f0",
                                  borderRadius: "6px",
                                  padding: "6px",
                                  fontSize: "13px",
                                  textAlign: "center",
                                }}
                              />
                            </div>

                            {/* Reps */}
                            <div>
                              <input
                                type="text"
                                value={ex.targetReps}
                                onChange={(e) => {
                                  const updated = [...formDays];
                                  updated[dayIdx].exercises[exIdx].targetReps = e.target.value;
                                  setFormDays(updated);
                                }}
                                placeholder="8-10"
                                title="Reps"
                                style={{
                                  width: "100%",
                                  border: "1px solid #e2e8f0",
                                  borderRadius: "6px",
                                  padding: "6px",
                                  fontSize: "13px",
                                  textAlign: "center",
                                }}
                              />
                            </div>

                            {/* Weight */}
                            <div>
                              <input
                                type="number"
                                value={ex.suggestedWeight || 0}
                                onChange={(e) => {
                                  const updated = [...formDays];
                                  updated[dayIdx].exercises[exIdx].suggestedWeight = parseFloat(e.target.value) || 0;
                                  setFormDays(updated);
                                }}
                                placeholder="Weight"
                                title="Starting Weight (lbs/kg)"
                                style={{
                                  width: "100%",
                                  border: "1px solid #e2e8f0",
                                  borderRadius: "6px",
                                  padding: "6px",
                                  fontSize: "13px",
                                  textAlign: "center",
                                }}
                              />
                            </div>

                            {/* Superset Selector */}
                            <select
                              value={ex.supersetGroup || "None"}
                              onChange={(e) => {
                                const val = e.target.value === "None" ? null : e.target.value;
                                const updated = [...formDays];
                                updated[dayIdx].exercises[exIdx].supersetGroup = val;
                                setFormDays(updated);
                              }}
                              title="Superset Group"
                              style={{
                                border: isSuperset ? "1px solid #a855f7" : "1px solid #e2e8f0",
                                borderRadius: "6px",
                                padding: "6px 4px",
                                fontSize: "12px",
                                background: isSuperset ? "#f5f3ff" : "#ffffff",
                                color: isSuperset ? "#6d28d9" : "#475569",
                                fontWeight: 700,
                              }}
                            >
                              {SUPERSET_PRESETS.map((sg) => (
                                <option key={sg} value={sg}>
                                  {sg === "None" ? "No Superset" : `Superset ${sg}`}
                                </option>
                              ))}
                            </select>

                            {/* Suggested Rest Time */}
                            <select
                              value={ex.restSeconds || 90}
                              onChange={(e) => {
                                const updated = [...formDays];
                                updated[dayIdx].exercises[exIdx].restSeconds = parseInt(e.target.value, 10);
                                setFormDays(updated);
                              }}
                              title="Suggested Rest Time"
                              style={{
                                border: "1px solid #e2e8f0",
                                borderRadius: "6px",
                                padding: "6px 4px",
                                fontSize: "12px",
                                fontWeight: 600,
                              }}
                            >
                              {REST_TIME_PRESETS.map((rt) => (
                                <option key={rt.seconds} value={rt.seconds}>
                                  {rt.seconds}s Rest
                                </option>
                              ))}
                            </select>

                            {/* Remove Exercise */}
                            <button
                              onClick={() => handleRemoveExercise(dayIdx, exIdx)}
                              style={{ background: "transparent", border: "none", color: "#94a3b8", cursor: "pointer" }}
                            >
                              <X size={16} />
                            </button>
                          </div>
                        );
                      })}

                      <button
                        onClick={() => handleAddExerciseToDay(dayIdx)}
                        type="button"
                        style={{
                          background: "#ffffff",
                          border: "1px dashed #cbd5e1",
                          color: "#0284c7",
                          padding: "6px 10px",
                          borderRadius: "6px",
                          fontSize: "12px",
                          fontWeight: 700,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "4px",
                          marginTop: "4px",
                        }}
                      >
                        <Plus size={14} /> Add Exercise to {day.name}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Footer */}
            <div
              style={{
                padding: "14px 20px",
                borderTop: "1px solid #e2e8f0",
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-end",
                gap: "10px",
                background: "#f8fafc",
              }}
            >
              <button
                onClick={() => setIsCreatingNew(false)}
                style={{
                  background: "#f1f5f9",
                  border: "none",
                  padding: "8px 16px",
                  borderRadius: "8px",
                  fontWeight: 600,
                  color: "#475569",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>

              <button
                onClick={handleSaveProgram}
                disabled={savingProgram}
                style={{
                  background: "#0284c7",
                  border: "none",
                  padding: "8px 20px",
                  borderRadius: "8px",
                  fontWeight: 700,
                  color: "#ffffff",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                {savingProgram ? <RefreshCw className="spin-inline" size={16} /> : <Save size={16} />}
                <span>{editingProgram ? "Save & Sync Program" : "Create Program"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Program Modal */}
      {assigningProgram && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(15, 23, 42, 0.7)",
            backdropFilter: "blur(4px)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
          }}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: "16px",
              width: "100%",
              maxWidth: "480px",
              padding: "24px",
              boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
              <Play size={24} color="#0284c7" />
              <div>
                <h3 style={{ fontSize: "18px", fontWeight: 800, color: "#0f172a" }}>
                  Assign Program to Client
                </h3>
                <p style={{ fontSize: "13px", color: "#64748b" }}>
                  {assigningProgram.name} ({assigningProgram.durationWeeks} Weeks)
                </p>
              </div>
            </div>

            {assignSuccessMessage ? (
              <div style={{ textAlign: "center", padding: "20px 0" }}>
                <CheckCircle2 size={40} color="#16a34a" style={{ margin: "0 auto 10px" }} />
                <div style={{ fontSize: "15px", fontWeight: 700, color: "#16a34a" }}>
                  {assignSuccessMessage}
                </div>
              </div>
            ) : (
              <div>
                <div style={{ marginBottom: "16px" }}>
                  <label style={{ fontSize: "13px", fontWeight: 700, color: "#334155", display: "block", marginBottom: "6px" }}>
                    Select Athlete / Client *
                  </label>
                  <select
                    value={assignTargetClientId}
                    onChange={(e) => setAssignTargetClientId(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: "8px",
                      border: "1px solid #cbd5e1",
                      fontSize: "14px",
                    }}
                  >
                    {clientsList.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ marginBottom: "20px" }}>
                  <label style={{ fontSize: "13px", fontWeight: 700, color: "#334155", display: "block", marginBottom: "6px" }}>
                    Program Start Date *
                  </label>
                  <input
                    type="date"
                    value={assignStartDate}
                    onChange={(e) => setAssignStartDate(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: "8px",
                      border: "1px solid #cbd5e1",
                      fontSize: "14px",
                    }}
                  />
                </div>

                <div
                  style={{
                    background: "#f0fdf4",
                    border: "1px solid #bbf7d0",
                    borderRadius: "8px",
                    padding: "12px",
                    marginBottom: "20px",
                    fontSize: "13px",
                    color: "#166534",
                  }}
                >
                  ⚡ All {assigningProgram.durationWeeks * assigningProgram.workoutTemplates.length} periodized workouts will immediately appear on the client&apos;s Planned Workouts calendar with progressive overload applied.
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                  <button
                    onClick={() => setAssigningProgram(null)}
                    style={{
                      background: "#f1f5f9",
                      border: "none",
                      padding: "8px 16px",
                      borderRadius: "8px",
                      fontWeight: 600,
                      color: "#475569",
                      cursor: "pointer",
                    }}
                  >
                    Cancel
                  </button>

                  <button
                    onClick={handleAssignProgram}
                    disabled={isAssigning}
                    style={{
                      background: "#0284c7",
                      border: "none",
                      padding: "8px 20px",
                      borderRadius: "8px",
                      fontWeight: 700,
                      color: "#ffffff",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    {isAssigning ? <RefreshCw className="spin-inline" size={16} /> : <Play size={16} />}
                    <span>Confirm &amp; Schedule</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
