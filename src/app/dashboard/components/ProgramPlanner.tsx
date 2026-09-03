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
  Trophy,
  RotateCcw,
  Award,
  Search,
} from "lucide-react";
import { INITIAL_UNIFIED_EXERCISES } from "@/lib/unifiedExerciseLibrary";
import { calculateWorkoutDate } from "@/lib/periodizationEngine";
import { RemoveAssignedWorkoutsModal } from "./RemoveAssignedWorkoutsModal";
import { getWeightClarification } from "./WorkoutBuilder";
import { ExercisePickerDropdown } from "./ExercisePickerDropdown";
import { EXERCISE_LIBRARY, ExerciseDefinition, isDefaultBodyweight } from "../utils/exerciseLibrary";

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
  restDaysAfter?: number | null;
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
  restDaysBetween?: number | null;
  notes?: string | null;
  client?: { id: string; name: string; email?: string; image?: string } | null;
  workoutTemplates: ProgramWorkoutDay[];
  workoutSessions?: Array<{
    id: string;
    status: string;
    startedAt?: string | null;
    completedAt?: string | null;
    programWeek?: number | null;
    programDay?: number | null;
  }>;
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
  const [formRestDaysBetween, setFormRestDaysBetween] = useState(1);
  const [formDays, setFormDays] = useState<ProgramWorkoutDay[]>([]);
  const [selectedExerciseSuggestions, setSelectedExerciseSuggestions] = useState<string[]>([]);

  // Assign Modal State
  const [assigningProgram, setAssigningProgram] = useState<TrainingProgramData | null>(null);
  const [assignTargetClientId, setAssignTargetClientId] = useState<string>(clientId || (clientsList[0]?.id || ""));
  const [assignStartDate, setAssignStartDate] = useState<string>(() => new Date().toISOString().split("T")[0]);
  const [assignRestDaysBetween, setAssignRestDaysBetween] = useState<number>(1);
  const [isAssigning, setIsAssigning] = useState(false);
  const [assignSuccessMessage, setAssignSuccessMessage] = useState<string | null>(null);

  // Exercise Library Modal State
  const [libraryTargetDayIdx, setLibraryTargetDayIdx] = useState<number | null>(null);
  const [libraryCategory, setLibraryCategory] = useState<string>("ALL");
  const [librarySearchQuery, setLibrarySearchQuery] = useState<string>("");
  const [libraryRecentlyAdded, setLibraryRecentlyAdded] = useState<Record<string, boolean>>({});

  // Schedule Preview & Unassign Modal
  const [previewingProgram, setPreviewingProgram] = useState<TrainingProgramData | null>(null);
  const [unassigningProgram, setUnassigningProgram] = useState<TrainingProgramData | null>(null);
  const [selectedClientFilter, setSelectedClientFilter] = useState<string>("ALL");
  const [expandedBreakdownId, setExpandedBreakdownId] = useState<string | null>(null);

  const fetchPrograms = useCallback(async () => {
    setLoading(true);
    try {
      const url = isTrainer
        ? "/api/programs"
        : clientId
        ? `/api/programs?clientId=${clientId}`
        : "/api/programs";
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
  }, [clientId, isTrainer]);

  useEffect(() => {
    fetchPrograms();
  }, [fetchPrograms]);

  const filteredPrograms = useMemo(() => {
    return programs.filter((p) => {
      if (filterStatus !== "ALL" && p.status !== filterStatus) return false;
      if (selectedClientFilter !== "ALL") {
        if (selectedClientFilter === "TEMPLATES") {
          if (p.clientId) return false;
        } else if (p.clientId !== selectedClientFilter) {
          return false;
        }
      }
      return true;
    });
  }, [programs, filterStatus, selectedClientFilter]);

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
    setFormRestDaysBetween(program.restDaysBetween !== undefined && program.restDaysBetween !== null ? program.restDaysBetween : 1);
    setFormDays(
      program.workoutTemplates.map((wt) => ({
        id: wt.id,
        name: wt.name,
        order: wt.order,
        cadence: wt.cadence,
        dayOfWeek: wt.dayOfWeek,
        restDaysAfter: wt.restDaysAfter,
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
        restDaysBetween: formRestDaysBetween,
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
        const savedData = await res.json();
        setIsCreatingNew(false);
        setEditingProgram(null);
        if (savedData?.program) {
          setPrograms((prev) => {
            const exists = prev.some((p) => p.id === savedData.program.id);
            if (exists) {
              return prev.map((p) => (p.id === savedData.program.id ? { ...p, ...savedData.program } : p));
            }
            return [savedData.program, ...prev];
          });
        }
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
          restDaysBetween: assignRestDaysBetween,
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

  const LIBRARY_CATEGORIES = ["ALL", "Chest", "Back", "Legs", "Shoulders", "Arms", "Core", "Bodyweight", "Stretching"];

  const filteredLibraryExercises = useMemo(() => {
    const q = librarySearchQuery.toLowerCase().trim();
    return EXERCISE_LIBRARY.filter((ex) => {
      const matchCat =
        libraryCategory === "ALL" ||
        ex.muscleGroup.toLowerCase() === libraryCategory.toLowerCase() ||
        (libraryCategory === "Bodyweight" && (ex.equipment === "Bodyweight" || ex.muscleGroup === "Bodyweight"));

      const matchQuery =
        !q ||
        ex.name.toLowerCase().includes(q) ||
        ex.muscleGroup.toLowerCase().includes(q) ||
        ex.equipment.toLowerCase().includes(q);

      return matchCat && matchQuery;
    });
  }, [libraryCategory, librarySearchQuery]);

  // Helper to add exercise to day
  const handleAddExerciseToDay = (dayIdx: number, exerciseName?: string, isBodyweight?: boolean, category?: string) => {
    const updated = [...formDays];
    const targetDay = updated[dayIdx];
    const name = exerciseName || "";
    const isBW = isBodyweight ?? isDefaultBodyweight(name);
    const cat = category || (isBW ? "BODYWEIGHT" : "STRENGTH");
    targetDay.exercises.push({
      name,
      order: targetDay.exercises.length,
      category: cat,
      targetSets: 3,
      targetReps: isBW ? "10-15" : "8-10",
      suggestedWeight: isBW ? 0 : 50,
      rpe: 8,
      supersetGroup: null,
      restSeconds: 90,
      coachingCue: "",
    });
    setFormDays(updated);
  };

  // Helper to add exercise directly from the 120+ Exercise Library
  const handleAddExerciseFromLibrary = (dayIdx: number, ex: ExerciseDefinition) => {
    const isBW = ex.equipment === "Bodyweight" || isDefaultBodyweight(ex.name);
    const cat = isBW ? "BODYWEIGHT" : "STRENGTH";
    const updated = [...formDays];
    const targetDay = updated[dayIdx];
    targetDay.exercises.push({
      name: ex.name,
      order: targetDay.exercises.length,
      category: cat,
      targetSets: 3,
      targetReps: isBW ? "10-15" : "8-10",
      suggestedWeight: isBW ? 0 : 50,
      rpe: 8,
      supersetGroup: null,
      restSeconds: 90,
      coachingCue: "",
    });
    setFormDays(updated);
    setLibraryRecentlyAdded((prev) => ({ ...prev, [ex.name]: true }));
    setTimeout(() => {
      setLibraryRecentlyAdded((prev) => ({ ...prev, [ex.name]: false }));
    }, 2000);
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

      {/* Filter Tabs & Athlete Selector */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "10px",
          borderBottom: "1px solid #e2e8f0",
          paddingBottom: "10px",
          marginBottom: "20px",
        }}
      >
        <div style={{ display: "flex", gap: "8px", overflowX: "auto", flexWrap: "wrap" }}>
          {[
            { id: "ALL", label: `All Programs (${programs.length})` },
            { id: "IN_PROGRESS", label: `⚡ In-Progress (${programs.filter((p) => p.status === "IN_PROGRESS").length})` },
            { id: "DRAFT", label: `📝 Templates (${programs.filter((p) => p.status === "DRAFT").length})` },
            { id: "COMPLETED", label: `✓ Completed (${programs.filter((p) => p.status === "COMPLETED").length})` },
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

        {isTrainer && clientsList.length > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "12px", color: "#64748b", fontWeight: 600 }}>Athlete:</span>
            <select
              value={selectedClientFilter}
              onChange={(e) => setSelectedClientFilter(e.target.value)}
              style={{
                fontSize: "12px",
                fontWeight: 600,
                padding: "4px 8px",
                borderRadius: "8px",
                border: "1px solid #cbd5e1",
                background: "#ffffff",
                color: "#334155",
              }}
            >
              <option value="ALL">All Athletes &amp; Templates</option>
              <option value="TEMPLATES">Templates Only (Unassigned)</option>
              {clientsList.map((cl) => (
                <option key={cl.id} value={cl.id}>
                  {cl.name}
                </option>
              ))}
            </select>
          </div>
        )}
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

                  {/* Active Schedule Date Range */}
                  {isActive && program.startDate && (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        fontSize: "12px",
                        color: "#0369a1",
                        background: "#eff6ff",
                        border: "1px solid #bfdbfe",
                        padding: "4px 10px",
                        borderRadius: "6px",
                        marginBottom: "12px",
                        fontWeight: 700,
                      }}
                    >
                      <CalendarRange size={14} color="#0284c7" />
                      <span>
                        Schedule: {new Date(program.startDate + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        {program.endDate ? ` — ${new Date(program.endDate + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}` : ""}
                      </span>
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

                  {/* Completed Program Celebration Banner */}
                  {program.status === "COMPLETED" && (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        background: "#f0fdf4",
                        border: "1px solid #bbf7d0",
                        borderRadius: "8px",
                        padding: "8px 12px",
                        marginBottom: "12px",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#16a34a", fontSize: "12px", fontWeight: 800 }}>
                        <Trophy size={15} color="#16a34a" />
                        <span>Program Completed (100% Finished)</span>
                      </div>
                      <span style={{ fontSize: "11px", color: "#15803d", fontWeight: 700 }}>
                        {stats?.completedWorkouts || stats?.totalWorkouts || 0} Sessions
                      </span>
                    </div>
                  )}

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

                      {/* Toggle Schedule Breakdown */}
                      <button
                        type="button"
                        onClick={() => setExpandedBreakdownId(expandedBreakdownId === program.id ? null : program.id)}
                        style={{
                          background: "none",
                          border: "none",
                          color: "#0284c7",
                          fontSize: "11px",
                          fontWeight: 700,
                          cursor: "pointer",
                          padding: "4px 0 0 0",
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                      >
                        {expandedBreakdownId === program.id ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                        <span>{expandedBreakdownId === program.id ? "Hide Schedule Breakdown" : "View Schedule Breakdown"}</span>
                      </button>

                      {expandedBreakdownId === program.id && program.workoutSessions && (
                        <div style={{ marginTop: "8px", display: "flex", flexDirection: "column", gap: "4px", maxHeight: "180px", overflowY: "auto", background: "#f8fafc", padding: "8px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                          {[...program.workoutSessions]
                            .sort((a: any, b: any) => {
                              const tA = a.startedAt ? new Date(a.startedAt).getTime() : 0;
                              const tB = b.startedAt ? new Date(b.startedAt).getTime() : 0;
                              if (tA !== tB) return tA - tB;
                              return (a.programWeek ?? 0) - (b.programWeek ?? 0);
                            })
                            .map((s: any, idx: number) => {
                              const isDone = s.status === "COMPLETED";
                              return (
                                <div key={s.id || idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "11px", padding: "3px 6px", background: "#ffffff", borderRadius: "4px", border: "1px solid #f1f5f9" }}>
                                  <span style={{ color: "#334155", fontWeight: 600 }}>
                                    Week {s.programWeek || 1} · Day {s.programDay || 1}
                                  </span>
                                  {isDone ? (
                                    <span style={{ color: "#16a34a", fontWeight: 700, display: "flex", alignItems: "center", gap: "3px" }}>
                                      <CheckCircle2 size={11} /> Completed
                                    </span>
                                  ) : (
                                    <span style={{ color: "#0284c7", fontWeight: 600 }}>
                                      📅 {s.startedAt ? new Date(s.startedAt).toLocaleDateString(undefined, { month: "numeric", day: "numeric" }) : "Scheduled"}
                                    </span>
                                  )}
                                </div>
                              );
                            })}
                        </div>
                      )}
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
                    flexWrap: "wrap",
                  }}
                >
                  {isTrainer && !isActive && (
                    <button
                      type="button"
                      onClick={() => {
                        setAssigningProgram(program);
                        setAssignTargetClientId(clientId || (clientsList[0]?.id || ""));
                        setAssignRestDaysBetween(program.restDaysBetween !== undefined && program.restDaysBetween !== null ? program.restDaysBetween : 1);
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
                      {program.status === "COMPLETED" ? <RotateCcw size={14} /> : <Play size={14} />}
                      <span>{program.status === "COMPLETED" ? "Reassign Program" : "Assign to Client"}</span>
                    </button>
                  )}

                  {isTrainer && isActive && (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          setAssigningProgram(program);
                          setAssignTargetClientId(program.clientId || clientId || (clientsList[0]?.id || ""));
                          setAssignRestDaysBetween(program.restDaysBetween !== undefined && program.restDaysBetween !== null ? program.restDaysBetween : 1);
                        }}
                        style={{
                          padding: "7px 10px",
                          borderRadius: "8px",
                          fontWeight: 700,
                          fontSize: "12px",
                          background: "#eff6ff",
                          border: "1px solid #bfdbfe",
                          color: "#1d4ed8",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                        title="Reassign or restart this program"
                      >
                        <RotateCcw size={13} />
                        <span>Reassign</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setUnassigningProgram(program)}
                        style={{
                          padding: "7px 10px",
                          borderRadius: "8px",
                          fontWeight: 600,
                          fontSize: "12px",
                          background: "#fef2f2",
                          border: "1px solid #fecaca",
                          color: "#dc2626",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                        title="Unassign program and remove all uncompleted planned sessions"
                      >
                        <Trash2 size={13} />
                        <span>Unassign</span>
                      </button>
                    </>
                  )}

                  {isTrainer && (
                    <button
                      type="button"
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
                      type="button"
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
                    Program Description &amp; Goals
                  </label>
                  <input
                    type="text"
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="e.g. Progressive overload focus targeting power and hypertrophy"
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      borderRadius: "8px",
                      border: "1px solid #cbd5e1",
                      fontSize: "14px",
                    }}
                  />
                </div>
              </div>

              {/* Periodization Parameters */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                  gap: "14px",
                  marginBottom: "20px",
                  background: "#f8fafc",
                  padding: "16px",
                  borderRadius: "12px",
                  border: "1px solid #e2e8f0",
                }}
              >
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                    <label style={{ fontSize: "13px", fontWeight: 700, color: "#334155" }}>
                      Program Duration (Weeks)
                    </label>
                    <span style={{ fontSize: "11px", fontWeight: 700, color: "#0284c7" }}>
                      {formDurationWeeks} Weeks
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                    <input
                      type="number"
                      min={1}
                      max={104}
                      value={formDurationWeeks}
                      onChange={(e) => setFormDurationWeeks(Math.max(1, parseInt(e.target.value, 10) || 1))}
                      style={{
                        width: "70px",
                        padding: "8px 10px",
                        borderRadius: "8px",
                        border: "1px solid #cbd5e1",
                        fontSize: "14px",
                        fontWeight: 700,
                      }}
                    />
                    <div style={{ display: "flex", gap: "4px", flexWrap: "wrap", flex: 1 }}>
                      {[4, 6, 8, 12, 16].map((w) => (
                        <button
                          key={w}
                          type="button"
                          onClick={() => setFormDurationWeeks(w)}
                          style={{
                            padding: "4px 8px",
                            fontSize: "11px",
                            fontWeight: 700,
                            borderRadius: "6px",
                            border: formDurationWeeks === w ? "1px solid #0284c7" : "1px solid #e2e8f0",
                            background: formDurationWeeks === w ? "#e0f2fe" : "#ffffff",
                            color: formDurationWeeks === w ? "#0369a1" : "#64748b",
                            cursor: "pointer",
                          }}
                        >
                          {w}w
                        </button>
                      ))}
                    </div>
                  </div>
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
                    <option value={0}>0% (Static Weights)</option>
                    <option value={2}>+2.0% / Week (Conservative)</option>
                    <option value={2.5}>+2.5% / Week (Recommended)</option>
                    <option value={3.5}>+3.5% / Week (Aggressive)</option>
                    <option value={5}>+5.0% / Week (Linear)</option>
                  </select>
                </div>

                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                    <label style={{ fontSize: "13px", fontWeight: 700, color: "#334155" }}>
                      Deload Frequency
                    </label>
                    <span style={{ fontSize: "11px", fontWeight: 700, color: formDeloadFrequency > 0 ? "#d97706" : "#64748b" }}>
                      {formDeloadFrequency > 0 ? `Every ${formDeloadFrequency}w` : "No Deload"}
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                    <input
                      type="number"
                      min={0}
                      max={52}
                      value={formDeloadFrequency}
                      onChange={(e) => setFormDeloadFrequency(Math.max(0, parseInt(e.target.value, 10) || 0))}
                      style={{
                        width: "70px",
                        padding: "8px 10px",
                        borderRadius: "8px",
                        border: "1px solid #cbd5e1",
                        fontSize: "14px",
                        fontWeight: 700,
                      }}
                    />
                    <div style={{ display: "flex", gap: "4px", flexWrap: "wrap", flex: 1 }}>
                      {[
                        { val: 0, label: "None" },
                        { val: 3, label: "3w" },
                        { val: 4, label: "4w" },
                        { val: 6, label: "6w" },
                      ].map((item) => (
                        <button
                          key={item.val}
                          type="button"
                          onClick={() => setFormDeloadFrequency(item.val)}
                          style={{
                            padding: "4px 8px",
                            fontSize: "11px",
                            fontWeight: 700,
                            borderRadius: "6px",
                            border: formDeloadFrequency === item.val ? "1px solid #d97706" : "1px solid #e2e8f0",
                            background: formDeloadFrequency === item.val ? "#fef3c7" : "#ffffff",
                            color: formDeloadFrequency === item.val ? "#b45309" : "#64748b",
                            cursor: "pointer",
                          }}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                    <label style={{ fontSize: "13px", fontWeight: 700, color: "#334155" }}>
                      Rest Days Between Workouts
                    </label>
                    <span style={{ fontSize: "11px", fontWeight: 700, color: formRestDaysBetween === 0 ? "#0284c7" : "#059669" }}>
                      {formRestDaysBetween === 0 ? "0d (Consecutive)" : `${formRestDaysBetween}d Rest`}
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                    <input
                      type="number"
                      min={0}
                      max={6}
                      value={formRestDaysBetween}
                      onChange={(e) => setFormRestDaysBetween(Math.max(0, Math.min(6, parseInt(e.target.value, 10) || 0)))}
                      style={{
                        width: "70px",
                        padding: "8px 10px",
                        borderRadius: "8px",
                        border: "1px solid #cbd5e1",
                        fontSize: "14px",
                        fontWeight: 700,
                      }}
                    />
                    <div style={{ display: "flex", gap: "4px", flexWrap: "wrap", flex: 1 }}>
                      {[
                        { val: 0, label: "0d" },
                        { val: 1, label: "1d (Every other)" },
                        { val: 2, label: "2d" },
                      ].map((item) => (
                        <button
                          key={item.val}
                          type="button"
                          onClick={() => setFormRestDaysBetween(item.val)}
                          style={{
                            padding: "4px 8px",
                            fontSize: "11px",
                            fontWeight: 700,
                            borderRadius: "6px",
                            border: formRestDaysBetween === item.val ? "1px solid #059669" : "1px solid #e2e8f0",
                            background: formRestDaysBetween === item.val ? "#ecfdf5" : "#ffffff",
                            color: formRestDaysBetween === item.val ? "#047857" : "#64748b",
                            cursor: "pointer",
                          }}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>
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

                    {/* Column Headers for Exercise Inputs */}
                    {day.exercises.length > 0 && (
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "minmax(220px, 2fr) 70px 90px 90px 90px 110px 30px",
                          gap: "8px",
                          padding: "0 12px 6px",
                          fontSize: "11px",
                          fontWeight: 800,
                          color: "#64748b",
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                        }}
                      >
                        <div>Exercise Name</div>
                        <div style={{ textAlign: "center" }}>Sets</div>
                        <div style={{ textAlign: "center" }}>Reps</div>
                        <div style={{ textAlign: "center" }}>Weight</div>
                        <div style={{ textAlign: "center" }}>Superset</div>
                        <div style={{ textAlign: "center" }}>Rest</div>
                        <div></div>
                      </div>
                    )}

                    {/* Exercise List */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      {day.exercises.map((ex, exIdx) => {
                        const isSuperset = !!ex.supersetGroup && ex.supersetGroup !== "None";
                        const clarification = getWeightClarification(ex.name, false, ex.category);

                        return (
                          <div
                            key={exIdx}
                            style={{
                              background: "#ffffff",
                              border: isSuperset ? "1.5px solid #a855f7" : "1px solid #e2e8f0",
                              borderRadius: "8px",
                              padding: "10px 12px",
                              display: "grid",
                              gridTemplateColumns: "minmax(220px, 2fr) 70px 90px 90px 90px 110px 30px",
                              gap: "8px",
                              alignItems: "center",
                            }}
                          >
                            {/* Exercise Name with Dropdown Autocomplete */}
                            <div style={{ position: "relative", minWidth: 0 }}>
                              <ExercisePickerDropdown
                                value={ex.name}
                                onSelectExercise={(name, isBW, cat) => {
                                  const updated = [...formDays];
                                  updated[dayIdx].exercises[exIdx].name = name;
                                  updated[dayIdx].exercises[exIdx].category = cat;
                                  if (isBW && (!updated[dayIdx].exercises[exIdx].suggestedWeight || updated[dayIdx].exercises[exIdx].suggestedWeight === 50)) {
                                    updated[dayIdx].exercises[exIdx].suggestedWeight = 0;
                                  }
                                  setFormDays(updated);
                                }}
                                placeholder="Search 120+ exercise library..."
                                style={{ width: "100%" }}
                              />
                              {ex.name && (
                                <div style={{ marginTop: "4px", display: "flex", alignItems: "center", gap: "4px" }}>
                                  <span
                                    style={{
                                      fontSize: "10px",
                                      fontWeight: 700,
                                      color: clarification.badgeColor,
                                      background: clarification.bg,
                                      padding: "1px 5px",
                                      borderRadius: "4px",
                                      border: "1px solid #e2e8f0",
                                    }}
                                    title={clarification.hint}
                                  >
                                    {clarification.badge}
                                  </span>
                                </div>
                              )}
                            </div>

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
                                title={clarification.hint}
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

                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px", flexWrap: "wrap" }}>
                        <button
                          onClick={() => handleAddExerciseToDay(dayIdx)}
                          type="button"
                          style={{
                            background: "#ffffff",
                            border: "1px dashed #cbd5e1",
                            color: "#0284c7",
                            padding: "6px 12px",
                            borderRadius: "6px",
                            fontSize: "12px",
                            fontWeight: 700,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                          }}
                        >
                          <Plus size={14} /> Add Exercise
                        </button>
                        <button
                          onClick={() => {
                            setLibraryTargetDayIdx(dayIdx);
                            setLibrarySearchQuery("");
                            setLibraryCategory("ALL");
                          }}
                          type="button"
                          style={{
                            background: "#f0f9ff",
                            border: "1px solid #bae6fd",
                            color: "#0369a1",
                            padding: "6px 12px",
                            borderRadius: "6px",
                            fontSize: "12px",
                            fontWeight: 700,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                          }}
                        >
                          <Dumbbell size={14} /> Browse Exercise Library (120+)
                        </button>
                      </div>
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

      {/* Exercise Library Modal for Program Planner */}
      {libraryTargetDayIdx !== null && formDays[libraryTargetDayIdx] && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(15, 23, 42, 0.75)",
            backdropFilter: "blur(4px)",
            zIndex: 10000,
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
              maxWidth: "720px",
              maxHeight: "90vh",
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
              border: "1px solid #e2e8f0",
              overflow: "hidden",
            }}
          >
            {/* Header */}
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
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ background: "#e0f2fe", padding: "8px", borderRadius: "10px", color: "#0284c7" }}>
                  <Dumbbell size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: "17px", fontWeight: 800, color: "#0f172a", margin: 0 }}>
                    120+ Exercise Library
                  </h3>
                  <p style={{ fontSize: "12px", color: "#64748b", margin: 0 }}>
                    Adding to: <span style={{ fontWeight: 700, color: "#0284c7" }}>{formDays[libraryTargetDayIdx].name}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setLibraryTargetDayIdx(null)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#64748b",
                  cursor: "pointer",
                  padding: "4px",
                  borderRadius: "6px",
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Search and Category Filters */}
            <div style={{ padding: "16px 20px 10px", borderBottom: "1px solid #f1f5f9", display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ position: "relative" }}>
                <Search size={16} color="#94a3b8" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }} />
                <input
                  type="text"
                  value={librarySearchQuery}
                  onChange={(e) => setLibrarySearchQuery(e.target.value)}
                  placeholder="Search exercise by name, equipment (Barbell, Cable, Dumbbell), or target muscle..."
                  style={{
                    width: "100%",
                    padding: "9px 36px 9px 36px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    fontSize: "13px",
                    fontWeight: 600,
                  }}
                  autoFocus
                />
                {librarySearchQuery && (
                  <button
                    onClick={() => setLibrarySearchQuery("")}
                    style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", background: "transparent", border: "none", color: "#94a3b8", cursor: "pointer" }}
                  >
                    <X size={16} />
                  </button>
                )}
              </div>

              {/* Category Pills */}
              <div style={{ display: "flex", gap: "6px", overflowX: "auto", paddingBottom: "4px" }}>
                {LIBRARY_CATEGORIES.map((cat) => {
                  const isSelected = libraryCategory === cat;
                  return (
                    <button
                      key={cat}
                      onClick={() => setLibraryCategory(cat)}
                      style={{
                        padding: "4px 10px",
                        borderRadius: "20px",
                        fontSize: "12px",
                        fontWeight: 700,
                        whiteSpace: "nowrap",
                        border: isSelected ? "1px solid #0284c7" : "1px solid #e2e8f0",
                        background: isSelected ? "#0284c7" : "#ffffff",
                        color: isSelected ? "#ffffff" : "#475569",
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                      }}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Exercise List */}
            <div style={{ flex: 1, overflowY: "auto", padding: "12px 20px", display: "flex", flexDirection: "column", gap: "8px" }}>
              <div style={{ fontSize: "12px", fontWeight: 700, color: "#64748b", marginBottom: "4px" }}>
                Showing {filteredLibraryExercises.length} {libraryCategory === "ALL" ? "" : libraryCategory} Exercises
              </div>

              {filteredLibraryExercises.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px 20px", color: "#64748b" }}>
                  <Dumbbell size={32} color="#cbd5e1" style={{ margin: "0 auto 8px" }} />
                  <p style={{ fontWeight: 600, fontSize: "14px", margin: "0 0 4px" }}>No matching exercises found</p>
                  <p style={{ fontSize: "12px", color: "#94a3b8" }}>Try searching with a different term or clear the filter.</p>
                </div>
              ) : (
                filteredLibraryExercises.map((ex) => {
                  const isBW = ex.equipment === "Bodyweight" || isDefaultBodyweight(ex.name);
                  const cat = isBW ? "BODYWEIGHT" : "STRENGTH";
                  const clarification = getWeightClarification(ex.name, false, cat);
                  const isRecentlyAdded = !!libraryRecentlyAdded[ex.name];

                  return (
                    <div
                      key={ex.name}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "10px 14px",
                        borderRadius: "10px",
                        border: "1px solid #e2e8f0",
                        background: "#ffffff",
                        gap: "12px",
                      }}
                    >
                      <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                        <div style={{ fontSize: "14px", fontWeight: 700, color: "#0f172a", display: "flex", alignItems: "center", gap: "8px" }}>
                          <span>{ex.name}</span>
                          {ex.isCompound && (
                            <span style={{ fontSize: "10px", fontWeight: 700, color: "#7c3aed", background: "#f5f3ff", padding: "1px 6px", borderRadius: "4px", border: "1px solid #e9d5ff" }}>
                              Compound
                            </span>
                          )}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap", fontSize: "11px", color: "#64748b" }}>
                          <span style={{ fontWeight: 600, color: "#0369a1", background: "#f0f9ff", padding: "1px 6px", borderRadius: "4px" }}>
                            {ex.muscleGroup}
                          </span>
                          <span style={{ fontWeight: 600, color: "#475569", background: "#f1f5f9", padding: "1px 6px", borderRadius: "4px" }}>
                            {ex.equipment}
                          </span>
                          <span style={{ fontWeight: 600, color: clarification.badgeColor, background: clarification.bg, padding: "1px 6px", borderRadius: "4px" }}>
                            {clarification.badge}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleAddExerciseFromLibrary(libraryTargetDayIdx, ex)}
                        style={{
                          background: isRecentlyAdded ? "#16a34a" : "#0284c7",
                          color: "#ffffff",
                          border: "none",
                          padding: "6px 14px",
                          borderRadius: "8px",
                          fontSize: "12px",
                          fontWeight: 700,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                          whiteSpace: "nowrap",
                          transition: "all 0.15s ease",
                        }}
                      >
                        {isRecentlyAdded ? (
                          <>
                            <Check size={14} /> Added
                          </>
                        ) : (
                          <>
                            <Plus size={14} /> Add to Day
                          </>
                        )}
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div
              style={{
                padding: "12px 20px",
                borderTop: "1px solid #e2e8f0",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background: "#f8fafc",
              }}
            >
              <div style={{ fontSize: "12px", color: "#64748b" }}>
                Current exercises in {formDays[libraryTargetDayIdx].name}: <strong style={{ color: "#0f172a" }}>{formDays[libraryTargetDayIdx].exercises.length}</strong>
              </div>
              <button
                onClick={() => setLibraryTargetDayIdx(null)}
                style={{
                  background: "#0284c7",
                  border: "none",
                  padding: "8px 18px",
                  borderRadius: "8px",
                  fontWeight: 700,
                  color: "#ffffff",
                  cursor: "pointer",
                }}
              >
                Done Adding
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

                <div style={{ marginBottom: "16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                    <label style={{ fontSize: "13px", fontWeight: 700, color: "#334155" }}>
                      Program Start Date *
                    </label>
                    <span style={{ fontSize: "11px", fontWeight: 700, color: "#0284c7" }}>
                      Begins Week 1
                    </span>
                  </div>
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
                      fontWeight: 600,
                    }}
                  />
                </div>

                <div style={{ marginBottom: "16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                    <label style={{ fontSize: "13px", fontWeight: 700, color: "#334155" }}>
                      Rest Days Between Workouts
                    </label>
                    <span style={{ fontSize: "11px", fontWeight: 700, color: assignRestDaysBetween === 0 ? "#0284c7" : "#059669" }}>
                      {assignRestDaysBetween === 0 ? "Consecutive (0d Rest)" : `${assignRestDaysBetween} Day${assignRestDaysBetween > 1 ? "s" : ""} Rest`}
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                    <input
                      type="number"
                      min={0}
                      max={6}
                      value={assignRestDaysBetween}
                      onChange={(e) => setAssignRestDaysBetween(Math.max(0, Math.min(6, parseInt(e.target.value, 10) || 0)))}
                      style={{
                        width: "70px",
                        padding: "8px 10px",
                        borderRadius: "8px",
                        border: "1px solid #cbd5e1",
                        fontSize: "14px",
                        fontWeight: 700,
                      }}
                    />
                    <div style={{ display: "flex", gap: "4px", flexWrap: "wrap", flex: 1 }}>
                      {[
                        { val: 0, label: "0d (Consecutive)" },
                        { val: 1, label: "1d (Every Other)" },
                        { val: 2, label: "2d Rest" },
                      ].map((item) => (
                        <button
                          key={item.val}
                          type="button"
                          onClick={() => setAssignRestDaysBetween(item.val)}
                          style={{
                            padding: "4px 8px",
                            fontSize: "11px",
                            fontWeight: 700,
                            borderRadius: "6px",
                            border: assignRestDaysBetween === item.val ? "1px solid #059669" : "1px solid #e2e8f0",
                            background: assignRestDaysBetween === item.val ? "#ecfdf5" : "#ffffff",
                            color: assignRestDaysBetween === item.val ? "#047857" : "#64748b",
                            cursor: "pointer",
                          }}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Live Calendar Schedule Preview */}
                {assignStartDate && assigningProgram.workoutTemplates.length > 0 && (
                  <div style={{ marginBottom: "16px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "12px" }}>
                    <div style={{ fontSize: "12px", fontWeight: 800, color: "#0f172a", marginBottom: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
                      <CalendarRange size={15} color="#0284c7" />
                      <span>Week 1 Schedule Preview</span>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      {assigningProgram.workoutTemplates.map((wt, wtIdx) => {
                        const dStr = calculateWorkoutDate(assignStartDate, 0, wt.dayOfWeek, wtIdx, assignRestDaysBetween);
                        const dateObj = new Date(dStr + "T00:00:00");
                        const formattedDate = !isNaN(dateObj.getTime())
                          ? dateObj.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })
                          : dStr;
                        return (
                          <div key={wtIdx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px", background: "#ffffff", padding: "6px 10px", borderRadius: "6px", border: "1px solid #f1f5f9" }}>
                            <span style={{ fontWeight: 700, color: "#1e293b" }}>{wt.name}</span>
                            <span style={{ fontWeight: 800, color: "#0284c7" }}>📅 {formattedDate}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

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

      {/* Remove Assigned Workouts Warning Modal */}
      {unassigningProgram && (
        <RemoveAssignedWorkoutsModal
          isOpen={!!unassigningProgram}
          onClose={() => setUnassigningProgram(null)}
          clientId={unassigningProgram.clientId || ""}
          clientName={unassigningProgram.client?.name || "Client"}
          programId={unassigningProgram.id}
          programName={unassigningProgram.name}
          assignedCount={unassigningProgram.workoutTemplates.length * unassigningProgram.durationWeeks}
          onSuccess={() => {
            fetchPrograms();
          }}
        />
      )}
    </div>
  );
}
