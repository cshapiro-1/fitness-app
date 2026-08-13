"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import {
  Apple,
  Dumbbell,
  ArrowLeft,
  Flame,
  Target,
  Plus,
  Trash2,
  Calendar,
  Save,
  CheckCircle2,
  TrendingDown,
  TrendingUp,
  Droplets,
  Scale,
  Edit3,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  LogOut,
  User,
  X,
  Pill,
  Check,
  Clock,
} from "lucide-react";
import { Client } from "../dashboard/types";

interface NutritionPlan {
  id?: string;
  clientId: string;
  goalType: "CUT" | "BULK" | "MAINTAIN" | "RECOMP";
  dailyCalories: number;
  proteinGrams: number;
  carbsGrams: number;
  fatsGrams: number;
  waterOz: number;
  currentWeight: number | null;
  targetWeight: number | null;
  notes: string | null;
}

interface NutritionLogItem {
  id: string;
  clientId: string;
  date: string;
  mealName: string;
  foodName: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  notes: string | null;
}

interface SupplementLogItem {
  id: string;
  clientId: string;
  date: string;
  name: string;
  dosage: string | null;
  timing: string | null;
  taken: boolean;
  notes: string | null;
}

const MEAL_TYPES = ["Breakfast", "Lunch", "Dinner", "Snacks", "Post-Workout"];

const COMMON_SUPPLEMENTS = [
  { name: "Creatine Monohydrate", dosage: "5g", timing: "Post-Workout" },
  { name: "Whey Protein Isolate", dosage: "1 scoop (25g)", timing: "Post-Workout" },
  { name: "Daily Multivitamin", dosage: "1 serving", timing: "Morning" },
  { name: "Omega-3 Fish Oil", dosage: "2,000mg", timing: "Morning" },
  { name: "Vitamin D3 + K2", dosage: "5,000 IU", timing: "Morning" },
  { name: "Magnesium Glycinate", dosage: "400mg", timing: "Bedtime" },
  { name: "Pre-Workout Energy", dosage: "1 scoop", timing: "Pre-Workout" },
  { name: "Electrolytes", dosage: "1 packet", timing: "Intra-Workout" },
];

export default function NutritionPage() {
  const { data: session, status } = useSession();
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );

  const [plan, setPlan] = useState<NutritionPlan | null>(null);
  const [logs, setLogs] = useState<NutritionLogItem[]>([]);
  const [supplements, setSupplements] = useState<SupplementLogItem[]>([]);
  const [totals, setTotals] = useState({ calories: 0, protein: 0, carbs: 0, fats: 0 });

  const [loading, setLoading] = useState(true);
  const [savingPlan, setSavingPlan] = useState(false);
  const [planSavedSuccess, setPlanSavedSuccess] = useState(false);

  // Quick Food Add Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedMealForAdd, setSelectedMealForAdd] = useState("Breakfast");
  const [foodName, setFoodName] = useState("");
  const [foodCalories, setFoodCalories] = useState("");
  const [foodProtein, setFoodProtein] = useState("");
  const [foodCarbs, setFoodCarbs] = useState("");
  const [foodFats, setFoodFats] = useState("");
  const [addingFood, setAddingFood] = useState(false);

  // Supplement Modal State
  const [showSuppModal, setShowSuppModal] = useState(false);
  const [suppName, setSuppName] = useState("");
  const [suppDosage, setSuppDosage] = useState("");
  const [suppTiming, setSuppTiming] = useState("Morning");
  const [suppNotes, setSuppNotes] = useState("");
  const [addingSupp, setAddingSupp] = useState(false);

  // Fetch Clients
  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/clients");
        if (res.ok) {
          const clientList: Client[] = await res.json();
          setClients(clientList);
          if (clientList.length > 0 && !selectedClientId) {
            setSelectedClientId(clientList[0].id);
          }
        }
      } catch (e) {
        console.error("Error loading clients", e);
      } finally {
        setLoading(false);
      }
    };

    if (session) {
      fetchInitialData();
    }
  }, [session, selectedClientId]);

  // Fetch Plan, Logs & Supplements for Selected Client & Date
  const fetchNutritionData = useCallback(async () => {
    if (!selectedClientId) return;
    try {
      // 1. Fetch Plan
      const planRes = await fetch(`/api/nutrition/plan?clientId=${selectedClientId}`);
      if (planRes.ok) {
        const planData = await planRes.json();
        setPlan(planData.plan);
      }

      // 2. Fetch Daily Food Logs
      const logsRes = await fetch(
        `/api/nutrition/logs?clientId=${selectedClientId}&date=${selectedDate}`
      );
      if (logsRes.ok) {
        const logsData = await logsRes.json();
        setLogs(logsData.logs || []);
        setTotals(logsData.totals || { calories: 0, protein: 0, carbs: 0, fats: 0 });
      }

      // 3. Fetch Daily Supplements
      const suppRes = await fetch(
        `/api/nutrition/supplements?clientId=${selectedClientId}&date=${selectedDate}`
      );
      if (suppRes.ok) {
        const suppData = await suppRes.json();
        setSupplements(suppData.supplements || []);
      }
    } catch (e) {
      console.error("Failed to load nutrition data", e);
    }
  }, [selectedClientId, selectedDate]);

  useEffect(() => {
    fetchNutritionData();
  }, [fetchNutritionData]);

  // Preset Macro Calculator
  const applyGoalPreset = (goal: "CUT" | "BULK" | "MAINTAIN") => {
    if (!plan) return;
    const curWeight = plan.currentWeight || 180;

    let cal = 2000;
    let pro = Math.round(curWeight * 1.0);
    let fat = Math.round(curWeight * 0.35);
    let carb = 200;

    if (goal === "CUT") {
      cal = Math.round(curWeight * 11);
      pro = Math.round(curWeight * 1.1);
      fat = Math.round((cal * 0.25) / 9);
      carb = Math.round((cal - (pro * 4 + fat * 9)) / 4);
    } else if (goal === "BULK") {
      cal = Math.round(curWeight * 16);
      pro = Math.round(curWeight * 0.9);
      fat = Math.round((cal * 0.25) / 9);
      carb = Math.round((cal - (pro * 4 + fat * 9)) / 4);
    } else {
      cal = Math.round(curWeight * 14);
      pro = Math.round(curWeight * 0.95);
      fat = Math.round((cal * 0.28) / 9);
      carb = Math.round((cal - (pro * 4 + fat * 9)) / 4);
    }

    setPlan({
      ...plan,
      goalType: goal,
      dailyCalories: Math.max(cal, 1200),
      proteinGrams: Math.max(pro, 50),
      fatsGrams: Math.max(fat, 30),
      carbsGrams: Math.max(carb, 50),
    });
  };

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!plan || !selectedClientId) return;
    setSavingPlan(true);
    setPlanSavedSuccess(false);

    try {
      const res = await fetch("/api/nutrition/plan", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: selectedClientId,
          goalType: plan.goalType,
          dailyCalories: plan.dailyCalories,
          proteinGrams: plan.proteinGrams,
          carbsGrams: plan.carbsGrams,
          fatsGrams: plan.fatsGrams,
          waterOz: plan.waterOz,
          currentWeight: plan.currentWeight,
          targetWeight: plan.targetWeight,
          notes: plan.notes,
        }),
      });

      if (res.ok) {
        setPlanSavedSuccess(true);
        setTimeout(() => setPlanSavedSuccess(false), 3000);
      }
    } catch {
      alert("Failed to save nutrition targets.");
    } finally {
      setSavingPlan(false);
    }
  };

  const handleAddFoodLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClientId || !foodName.trim() || !foodCalories) return;

    setAddingFood(true);
    try {
      const res = await fetch("/api/nutrition/logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: selectedClientId,
          date: selectedDate,
          mealName: selectedMealForAdd,
          foodName: foodName.trim(),
          calories: parseInt(foodCalories, 10),
          protein: parseFloat(foodProtein) || 0,
          carbs: parseFloat(foodCarbs) || 0,
          fats: parseFloat(foodFats) || 0,
        }),
      });

      if (res.ok) {
        setFoodName("");
        setFoodCalories("");
        setFoodProtein("");
        setFoodCarbs("");
        setFoodFats("");
        setShowAddModal(false);
        fetchNutritionData();
      }
    } catch {
      alert("Failed to log food.");
    } finally {
      setAddingFood(false);
    }
  };

  const handleDeleteLog = async (logId: string) => {
    try {
      const res = await fetch(`/api/nutrition/logs?id=${logId}`, { method: "DELETE" });
      if (res.ok) {
        fetchNutritionData();
      }
    } catch {
      alert("Failed to delete log.");
    }
  };

  // Supplement Handlers
  const handleQuickAddSupplement = async (supp: { name: string; dosage: string; timing: string }) => {
    if (!selectedClientId) return;
    try {
      const res = await fetch("/api/nutrition/supplements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: selectedClientId,
          date: selectedDate,
          name: supp.name,
          dosage: supp.dosage,
          timing: supp.timing,
          taken: true,
        }),
      });
      if (res.ok) {
        fetchNutritionData();
      }
    } catch {
      alert("Failed to add supplement.");
    }
  };

  const handleAddCustomSupplement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClientId || !suppName.trim()) return;

    setAddingSupp(true);
    try {
      const res = await fetch("/api/nutrition/supplements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: selectedClientId,
          date: selectedDate,
          name: suppName.trim(),
          dosage: suppDosage.trim() || null,
          timing: suppTiming,
          notes: suppNotes.trim() || null,
          taken: true,
        }),
      });

      if (res.ok) {
        setSuppName("");
        setSuppDosage("");
        setSuppNotes("");
        setShowSuppModal(false);
        fetchNutritionData();
      }
    } catch {
      alert("Failed to log custom supplement.");
    } finally {
      setAddingSupp(false);
    }
  };

  const handleToggleSupplement = async (id: string, currentTaken: boolean) => {
    try {
      const res = await fetch("/api/nutrition/supplements", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, taken: !currentTaken }),
      });
      if (res.ok) {
        setSupplements((prev) =>
          prev.map((s) => (s.id === id ? { ...s, taken: !currentTaken } : s))
        );
      }
    } catch {
      alert("Failed to update supplement status.");
    }
  };

  const handleDeleteSupplement = async (id: string) => {
    try {
      const res = await fetch(`/api/nutrition/supplements?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setSupplements((prev) => prev.filter((s) => s.id !== id));
      }
    } catch {
      alert("Failed to delete supplement.");
    }
  };

  const changeDateBy = (days: number) => {
    const d = new Date(selectedDate + "T00:00:00");
    d.setDate(d.getDate() + days);
    setSelectedDate(d.toISOString().split("T")[0]);
  };

  const targetCal = plan?.dailyCalories || 2000;
  const targetPro = plan?.proteinGrams || 150;
  const targetCarb = plan?.carbsGrams || 200;
  const targetFat = plan?.fatsGrams || 65;

  const calPct = Math.min(Math.round((totals.calories / targetCal) * 100), 100);
  const proPct = Math.min(Math.round((totals.protein / targetPro) * 100), 100);
  const carbPct = Math.min(Math.round((totals.carbs / targetCarb) * 100), 100);
  const fatPct = Math.min(Math.round((totals.fats / targetFat) * 100), 100);

  const remainingCal = targetCal - totals.calories;
  const takenSuppsCount = supplements.filter((s) => s.taken).length;

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", color: "#0f172a", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      {/* Top Header */}
      <header style={{ background: "#ffffff", borderBottom: "1px solid #e2e8f0", padding: "14px 24px", position: "sticky", top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <Link href="/dashboard" style={{ display: "flex", alignItems: "center", gap: "8px", textDecoration: "none", color: "#0f172a", fontWeight: 700, fontSize: "16px" }}>
              <Dumbbell size={20} style={{ color: "#2563eb" }} />
              <span>FitCoach</span>
            </Link>
            <span style={{ color: "#cbd5e1" }}>/</span>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#16a34a", fontWeight: 700, fontSize: "15px" }}>
              <Apple size={18} />
              <span>Nutrition, Macros &amp; Supplements</span>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Link
              href="/dashboard"
              className="nav-btn nav-btn-blue"
            >
              <ArrowLeft size={14} />
              <span>Back to Workouts</span>
            </Link>

            <button
              onClick={() => signOut({ callbackUrl: "/auth/signin" })}
              className="btn-ghost"
              style={{ padding: "6px" }}
              title="Sign Out"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ maxWidth: "1200px", margin: "24px auto", padding: "0 20px 60px" }}>
        {/* Client & Date Selector */}
        <div
          style={{
            background: "#ffffff",
            padding: "16px 20px",
            borderRadius: "14px",
            border: "1px solid #e2e8f0",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "14px",
            marginBottom: "24px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <User size={18} style={{ color: "#2563eb" }} />
            <span style={{ fontSize: "13px", fontWeight: 700, color: "#334155" }}>Client:</span>
            {clients.length > 0 ? (
              <select
                value={selectedClientId}
                onChange={(e) => setSelectedClientId(e.target.value)}
                style={{
                  padding: "8px 12px",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "#0f172a",
                  background: "#f8fafc",
                }}
              >
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.fitnessGoals ? `(${c.fitnessGoals})` : ""}
                  </option>
                ))}
              </select>
            ) : (
              <span style={{ fontSize: "13px", color: "#64748b" }}>Loading profile...</span>
            )}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <button
              onClick={() => changeDateBy(-1)}
              style={{ background: "#f1f5f9", border: "1px solid #cbd5e1", borderRadius: "6px", padding: "6px 10px", cursor: "pointer" }}
              title="Previous Day"
            >
              <ChevronLeft size={16} />
            </button>

            <div style={{ display: "flex", alignItems: "center", gap: "6px", background: "#f8fafc", border: "1px solid #cbd5e1", padding: "6px 12px", borderRadius: "8px", fontSize: "13px", fontWeight: 700 }}>
              <Calendar size={14} style={{ color: "#64748b" }} />
              <span>{selectedDate === new Date().toISOString().split("T")[0] ? "Today" : selectedDate}</span>
            </div>

            <button
              onClick={() => changeDateBy(1)}
              style={{ background: "#f1f5f9", border: "1px solid #cbd5e1", borderRadius: "6px", padding: "6px 10px", cursor: "pointer" }}
              title="Next Day"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* 2-Column Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.6fr", gap: "24px", alignItems: "start" }}>
          {/* LEFT COLUMN: Targets, Calculator & Supplement Stack */}
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {/* Macro Targets Blueprint */}
            <div style={{ background: "#ffffff", padding: "24px", borderRadius: "16px", border: "1px solid #e2e8f0", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.03)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Target size={18} style={{ color: "#2563eb" }} />
                  <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 800 }}>Macro Target Blueprint</h3>
                </div>
                <span style={{ fontSize: "11px", fontWeight: 700, padding: "3px 8px", borderRadius: "12px", background: plan?.goalType === "CUT" ? "#fef2f2" : plan?.goalType === "BULK" ? "#f0fdf4" : "#eff6ff", color: plan?.goalType === "CUT" ? "#dc2626" : plan?.goalType === "BULK" ? "#16a34a" : "#2563eb" }}>
                  {plan?.goalType === "CUT" ? "🔥 Fat Loss / Cut" : plan?.goalType === "BULK" ? "💪 Hypertrophy / Bulk" : "⚖️ Maintenance"}
                </span>
              </div>

              {/* Goal Presets */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px", marginBottom: "20px" }}>
                <button
                  type="button"
                  onClick={() => applyGoalPreset("CUT")}
                  style={{
                    padding: "8px 6px",
                    borderRadius: "8px",
                    border: plan?.goalType === "CUT" ? "2px solid #dc2626" : "1px solid #e2e8f0",
                    background: plan?.goalType === "CUT" ? "#fef2f2" : "#f8fafc",
                    color: plan?.goalType === "CUT" ? "#dc2626" : "#475569",
                    fontWeight: 700,
                    fontSize: "12px",
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "2px",
                  }}
                >
                  <TrendingDown size={14} />
                  <span>Cut (-500)</span>
                </button>

                <button
                  type="button"
                  onClick={() => applyGoalPreset("BULK")}
                  style={{
                    padding: "8px 6px",
                    borderRadius: "8px",
                    border: plan?.goalType === "BULK" ? "2px solid #16a34a" : "1px solid #e2e8f0",
                    background: plan?.goalType === "BULK" ? "#f0fdf4" : "#f8fafc",
                    color: plan?.goalType === "BULK" ? "#16a34a" : "#475569",
                    fontWeight: 700,
                    fontSize: "12px",
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "2px",
                  }}
                >
                  <TrendingUp size={14} />
                  <span>Bulk (+350)</span>
                </button>

                <button
                  type="button"
                  onClick={() => applyGoalPreset("MAINTAIN")}
                  style={{
                    padding: "8px 6px",
                    borderRadius: "8px",
                    border: plan?.goalType === "MAINTAIN" ? "2px solid #2563eb" : "1px solid #e2e8f0",
                    background: plan?.goalType === "MAINTAIN" ? "#eff6ff" : "#f8fafc",
                    color: plan?.goalType === "MAINTAIN" ? "#2563eb" : "#475569",
                    fontWeight: 700,
                    fontSize: "12px",
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "2px",
                  }}
                >
                  <Scale size={14} />
                  <span>Maintain</span>
                </button>
              </div>

              {plan && (
                <form onSubmit={handleSavePlan}>
                  {planSavedSuccess && (
                    <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#15803d", padding: "8px 12px", borderRadius: "8px", fontSize: "12px", display: "flex", alignItems: "center", gap: "6px", marginBottom: "14px" }}>
                      <CheckCircle2 size={15} />
                      <span>Nutrition blueprint updated!</span>
                    </div>
                  )}

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "14px" }}>
                    <div>
                      <label style={{ fontSize: "11px", fontWeight: 600, color: "#64748b", display: "block", marginBottom: "4px" }}>
                        Current Weight (lbs)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        className="client-modal-input"
                        value={plan.currentWeight || ""}
                        onChange={(e) => setPlan({ ...plan, currentWeight: parseFloat(e.target.value) || null })}
                        placeholder="e.g. 185"
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: "11px", fontWeight: 600, color: "#64748b", display: "block", marginBottom: "4px" }}>
                        Target Goal Weight (lbs)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        className="client-modal-input"
                        value={plan.targetWeight || ""}
                        onChange={(e) => setPlan({ ...plan, targetWeight: parseFloat(e.target.value) || null })}
                        placeholder="e.g. 175"
                      />
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "10px", marginBottom: "14px" }}>
                    <div>
                      <label style={{ fontSize: "11px", fontWeight: 600, color: "#64748b", display: "block", marginBottom: "4px" }}>
                        Daily Calories (kcal) *
                      </label>
                      <input
                        type="number"
                        className="client-modal-input"
                        value={plan.dailyCalories}
                        onChange={(e) => setPlan({ ...plan, dailyCalories: parseInt(e.target.value, 10) || 0 })}
                        required
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: "11px", fontWeight: 600, color: "#64748b", display: "block", marginBottom: "4px" }}>
                        Daily Water (oz)
                      </label>
                      <input
                        type="number"
                        className="client-modal-input"
                        value={plan.waterOz || 100}
                        onChange={(e) => setPlan({ ...plan, waterOz: parseInt(e.target.value, 10) || 100 })}
                      />
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px", marginBottom: "16px" }}>
                    <div>
                      <label style={{ fontSize: "11px", fontWeight: 700, color: "#2563eb", display: "block", marginBottom: "4px" }}>
                        Protein (g)
                      </label>
                      <input
                        type="number"
                        className="client-modal-input"
                        value={plan.proteinGrams}
                        onChange={(e) => setPlan({ ...plan, proteinGrams: parseInt(e.target.value, 10) || 0 })}
                        required
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: "11px", fontWeight: 700, color: "#ea580c", display: "block", marginBottom: "4px" }}>
                        Carbs (g)
                      </label>
                      <input
                        type="number"
                        className="client-modal-input"
                        value={plan.carbsGrams}
                        onChange={(e) => setPlan({ ...plan, carbsGrams: parseInt(e.target.value, 10) || 0 })}
                        required
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: "11px", fontWeight: 700, color: "#ca8a04", display: "block", marginBottom: "4px" }}>
                        Fats (g)
                      </label>
                      <input
                        type="number"
                        className="client-modal-input"
                        value={plan.fatsGrams}
                        onChange={(e) => setPlan({ ...plan, fatsGrams: parseInt(e.target.value, 10) || 0 })}
                        required
                      />
                    </div>
                  </div>

                  <div style={{ marginBottom: "16px" }}>
                    <label style={{ fontSize: "11px", fontWeight: 600, color: "#64748b", display: "block", marginBottom: "4px" }}>
                      Trainer Guidelines &amp; Meal Advice
                    </label>
                    <textarea
                      rows={2}
                      className="client-modal-textarea"
                      placeholder="e.g. Prioritize high-protein breakfast and 1 gal water on lifting days."
                      value={plan.notes || ""}
                      onChange={(e) => setPlan({ ...plan, notes: e.target.value })}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={savingPlan}
                    className="btn-primary"
                    style={{ width: "100%", padding: "10px", display: "flex", justifyContent: "center", alignItems: "center", gap: "6px", fontSize: "13px" }}
                  >
                    <Save size={14} />
                    <span>{savingPlan ? "Saving..." : "Save Nutrition Targets"}</span>
                  </button>
                </form>
              )}
            </div>

            {/* Daily Supplements & Stack Section */}
            <div style={{ background: "#ffffff", padding: "24px", borderRadius: "16px", border: "1px solid #e2e8f0", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.03)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Pill size={18} style={{ color: "#7c3aed" }} />
                  <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 800 }}>Supplements &amp; Stack</h3>
                </div>
                <div style={{ fontSize: "12px", fontWeight: 700, color: takenSuppsCount === supplements.length && supplements.length > 0 ? "#16a34a" : "#7c3aed" }}>
                  {supplements.length > 0 ? `${takenSuppsCount}/${supplements.length} taken` : "0 logged"}
                </div>
              </div>

              {/* Quick Add Preset Chips */}
              <div style={{ marginBottom: "16px" }}>
                <div style={{ fontSize: "11px", fontWeight: 600, color: "#64748b", marginBottom: "6px" }}>
                  Quick Add Common Supplements:
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                  {COMMON_SUPPLEMENTS.map((s) => (
                    <button
                      key={s.name}
                      type="button"
                      onClick={() => handleQuickAddSupplement(s)}
                      style={{
                        background: "#f5f3ff",
                        border: "1px solid #ddd6fe",
                        color: "#6d28d9",
                        borderRadius: "16px",
                        padding: "4px 10px",
                        fontSize: "11px",
                        fontWeight: 600,
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      <Plus size={11} />
                      <span>{s.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Logged Supplements List */}
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "14px" }}>
                {supplements.length === 0 ? (
                  <div style={{ padding: "16px", textAlign: "center", background: "#f8fafc", borderRadius: "10px", border: "1px dashed #cbd5e1", fontSize: "12px", color: "#64748b" }}>
                    No supplements logged for {selectedDate === new Date().toISOString().split("T")[0] ? "today" : selectedDate}. Click a preset above or add a custom supplement.
                  </div>
                ) : (
                  supplements.map((supp) => (
                    <div
                      key={supp.id}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "10px 12px",
                        borderRadius: "10px",
                        border: supp.taken ? "1px solid #bbf7d0" : "1px solid #e2e8f0",
                        background: supp.taken ? "#f0fdf4" : "#ffffff",
                        transition: "all 0.15s ease",
                      }}
                    >
                      <div
                        style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", flex: 1 }}
                        onClick={() => handleToggleSupplement(supp.id, supp.taken)}
                      >
                        <div
                          style={{
                            width: "20px",
                            height: "20px",
                            borderRadius: "6px",
                            border: supp.taken ? "2px solid #16a34a" : "2px solid #cbd5e1",
                            background: supp.taken ? "#16a34a" : "#ffffff",
                            color: "#ffffff",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                          }}
                        >
                          {supp.taken && <Check size={14} />}
                        </div>

                        <div>
                          <div style={{ fontSize: "13px", fontWeight: 700, color: supp.taken ? "#166534" : "#0f172a", textDecoration: supp.taken ? "none" : "none" }}>
                            {supp.name}
                          </div>
                          <div style={{ display: "flex", gap: "6px", marginTop: "2px", fontSize: "11px", color: "#64748b" }}>
                            {supp.dosage && <span>{supp.dosage}</span>}
                            {supp.timing && (
                              <span style={{ display: "inline-flex", alignItems: "center", gap: "2px", background: "#f1f5f9", padding: "1px 6px", borderRadius: "4px" }}>
                                <Clock size={10} /> {supp.timing}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeleteSupplement(supp.id)}
                        style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", padding: "4px" }}
                        title="Delete supplement"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Custom Supplement Button */}
              <button
                type="button"
                onClick={() => setShowSuppModal(true)}
                className="btn-secondary"
                style={{ width: "100%", padding: "8px", fontSize: "12px", fontWeight: 600, display: "flex", justifyContent: "center", alignItems: "center", gap: "6px" }}
              >
                <Plus size={13} />
                <span>Add Custom Supplement</span>
              </button>
            </div>
          </div>

          {/* RIGHT COLUMN: Daily Food Log & Live Macro Progress */}
          <div>
            {/* Daily Macro Progress Summary Card */}
            <div
              style={{
                background: "#ffffff",
                padding: "20px 24px",
                borderRadius: "16px",
                border: "1px solid #e2e8f0",
                boxShadow: "0 4px 6px -1px rgba(0,0,0,0.03)",
                marginBottom: "20px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <div>
                  <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: "#64748b" }}>
                    Daily Macro Intake
                  </div>
                  <div style={{ fontSize: "24px", fontWeight: 800, color: "#0f172a" }}>
                    {totals.calories} <span style={{ fontSize: "14px", fontWeight: 500, color: "#64748b" }}>/ {targetCal} kcal</span>
                  </div>
                </div>

                <div
                  style={{
                    padding: "6px 12px",
                    borderRadius: "10px",
                    fontSize: "12px",
                    fontWeight: 700,
                    background: remainingCal >= 0 ? "#f0fdf4" : "#fef2f2",
                    color: remainingCal >= 0 ? "#16a34a" : "#dc2626",
                    border: remainingCal >= 0 ? "1px solid #bbf7d0" : "1px solid #fecaca",
                  }}
                >
                  {remainingCal >= 0 ? `${remainingCal} kcal remaining` : `${Math.abs(remainingCal)} kcal over budget`}
                </div>
              </div>

              {/* Macro Bars */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "14px" }}>
                {/* Protein */}
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", fontWeight: 700, marginBottom: "4px" }}>
                    <span style={{ color: "#2563eb" }}>Protein</span>
                    <span>{totals.protein}g / {targetPro}g</span>
                  </div>
                  <div style={{ width: "100%", height: "6px", background: "#eff6ff", borderRadius: "4px", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${proPct}%`, background: "#2563eb", borderRadius: "4px" }} />
                  </div>
                </div>

                {/* Carbs */}
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", fontWeight: 700, marginBottom: "4px" }}>
                    <span style={{ color: "#ea580c" }}>Carbs</span>
                    <span>{totals.carbs}g / {targetCarb}g</span>
                  </div>
                  <div style={{ width: "100%", height: "6px", background: "#fff7ed", borderRadius: "4px", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${carbPct}%`, background: "#ea580c", borderRadius: "4px" }} />
                  </div>
                </div>

                {/* Fats */}
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", fontWeight: 700, marginBottom: "4px" }}>
                    <span style={{ color: "#ca8a04" }}>Fats</span>
                    <span>{totals.fats}g / {targetFat}g</span>
                  </div>
                  <div style={{ width: "100%", height: "6px", background: "#fefce8", borderRadius: "4px", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${fatPct}%`, background: "#ca8a04", borderRadius: "4px" }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Meals Log Section */}
            <div style={{ background: "#ffffff", padding: "24px", borderRadius: "16px", border: "1px solid #e2e8f0", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.03)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 800 }}>Meals &amp; Food Diary</h3>
                <button
                  type="button"
                  onClick={() => setShowAddModal(true)}
                  className="btn-primary"
                  style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "12px", padding: "6px 12px" }}
                >
                  <Plus size={14} />
                  <span>Log Food</span>
                </button>
              </div>

              {MEAL_TYPES.map((mealType) => {
                const mealLogs = logs.filter((l) => l.mealName === mealType);
                const mealCal = mealLogs.reduce((acc, l) => acc + l.calories, 0);

                return (
                  <div key={mealType} style={{ marginBottom: "16px", border: "1px solid #f1f5f9", borderRadius: "12px", padding: "12px 14px", background: "#fafafa" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: mealLogs.length ? "8px" : "0" }}>
                      <div style={{ fontSize: "13px", fontWeight: 700, color: "#0f172a" }}>
                        {mealType} <span style={{ fontSize: "11px", fontWeight: 500, color: "#64748b" }}>({mealCal} kcal)</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedMealForAdd(mealType);
                          setShowAddModal(true);
                        }}
                        style={{ background: "none", border: "none", color: "#2563eb", fontSize: "11px", fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "3px" }}
                      >
                        <Plus size={12} /> Add
                      </button>
                    </div>

                    {mealLogs.map((log) => (
                      <div
                        key={log.id}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: "8px 10px",
                          background: "#ffffff",
                          borderRadius: "8px",
                          border: "1px solid #e2e8f0",
                          marginBottom: "6px",
                        }}
                      >
                        <div>
                          <div style={{ fontSize: "13px", fontWeight: 600, color: "#0f172a" }}>{log.foodName}</div>
                          <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>
                            {log.calories} kcal · P: {log.protein}g · C: {log.carbs}g · F: {log.fats}g
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleDeleteLog(log.id)}
                          style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", padding: "4px" }}
                          title="Delete food entry"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </main>

      {/* Log Food Modal */}
      {showAddModal && (
        <div className="client-modal-backdrop" onClick={() => setShowAddModal(false)}>
          <div className="client-modal-card" style={{ maxWidth: "440px" }} onClick={(e) => e.stopPropagation()}>
            <div className="client-modal-header">
              <div className="client-modal-header-info">
                <h2 className="client-modal-title">Log Food Entry</h2>
                <p className="client-modal-subtitle">Add item calories and macronutrient breakdown.</p>
              </div>
              <button className="client-modal-close" onClick={() => setShowAddModal(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddFoodLog} style={{ padding: "20px 24px" }}>
              <div style={{ marginBottom: "12px" }}>
                <label style={{ fontSize: "11px", fontWeight: 600, color: "#374151", display: "block", marginBottom: "4px" }}>Meal</label>
                <select
                  className="client-modal-input"
                  value={selectedMealForAdd}
                  onChange={(e) => setSelectedMealForAdd(e.target.value)}
                >
                  {MEAL_TYPES.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: "12px" }}>
                <label style={{ fontSize: "11px", fontWeight: 600, color: "#374151", display: "block", marginBottom: "4px" }}>Food / Meal Name *</label>
                <input
                  type="text"
                  className="client-modal-input"
                  placeholder="e.g. 6oz Grilled Chicken Breast + 1 cup Rice"
                  value={foodName}
                  onChange={(e) => setFoodName(e.target.value)}
                  autoFocus
                  required
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "12px" }}>
                <div>
                  <label style={{ fontSize: "11px", fontWeight: 600, color: "#374151", display: "block", marginBottom: "4px" }}>Calories (kcal) *</label>
                  <input
                    type="number"
                    className="client-modal-input"
                    placeholder="e.g. 450"
                    value={foodCalories}
                    onChange={(e) => setFoodCalories(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label style={{ fontSize: "11px", fontWeight: 600, color: "#2563eb", display: "block", marginBottom: "4px" }}>Protein (g)</label>
                  <input
                    type="number"
                    className="client-modal-input"
                    placeholder="e.g. 40"
                    value={foodProtein}
                    onChange={(e) => setFoodProtein(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "20px" }}>
                <div>
                  <label style={{ fontSize: "11px", fontWeight: 600, color: "#ea580c", display: "block", marginBottom: "4px" }}>Carbs (g)</label>
                  <input
                    type="number"
                    className="client-modal-input"
                    placeholder="e.g. 45"
                    value={foodCarbs}
                    onChange={(e) => setFoodCarbs(e.target.value)}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "11px", fontWeight: 600, color: "#ca8a04", display: "block", marginBottom: "4px" }}>Fats (g)</label>
                  <input
                    type="number"
                    className="client-modal-input"
                    placeholder="e.g. 10"
                    value={foodFats}
                    onChange={(e) => setFoodFats(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                <button type="button" onClick={() => setShowAddModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={addingFood} className="btn-primary">
                  {addingFood ? "Logging..." : "Log Food Item"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Custom Supplement Modal */}
      {showSuppModal && (
        <div className="client-modal-backdrop" onClick={() => setShowSuppModal(false)}>
          <div className="client-modal-card" style={{ maxWidth: "440px" }} onClick={(e) => e.stopPropagation()}>
            <div className="client-modal-header">
              <div className="client-modal-header-info">
                <h2 className="client-modal-title">Log Supplement</h2>
                <p className="client-modal-subtitle">Track custom athletic and wellness supplements.</p>
              </div>
              <button className="client-modal-close" onClick={() => setShowSuppModal(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddCustomSupplement} style={{ padding: "20px 24px" }}>
              <div style={{ marginBottom: "12px" }}>
                <label style={{ fontSize: "11px", fontWeight: 600, color: "#374151", display: "block", marginBottom: "4px" }}>Supplement Name *</label>
                <input
                  type="text"
                  className="client-modal-input"
                  placeholder="e.g. Ashwagandha KSM-66, Beta Alanine"
                  value={suppName}
                  onChange={(e) => setSuppName(e.target.value)}
                  autoFocus
                  required
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "12px" }}>
                <div>
                  <label style={{ fontSize: "11px", fontWeight: 600, color: "#374151", display: "block", marginBottom: "4px" }}>Dosage (e.g. 600mg, 1 cap)</label>
                  <input
                    type="text"
                    className="client-modal-input"
                    placeholder="e.g. 600mg"
                    value={suppDosage}
                    onChange={(e) => setSuppDosage(e.target.value)}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "11px", fontWeight: 600, color: "#374151", display: "block", marginBottom: "4px" }}>Timing</label>
                  <select
                    className="client-modal-input"
                    value={suppTiming}
                    onChange={(e) => setSuppTiming(e.target.value)}
                  >
                    <option value="Morning">Morning</option>
                    <option value="Pre-Workout">Pre-Workout</option>
                    <option value="Intra-Workout">Intra-Workout</option>
                    <option value="Post-Workout">Post-Workout</option>
                    <option value="Evening / Bedtime">Evening / Bedtime</option>
                    <option value="With Meal">With Meal</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: "20px" }}>
                <label style={{ fontSize: "11px", fontWeight: 600, color: "#374151", display: "block", marginBottom: "4px" }}>Notes / Brand (Optional)</label>
                <input
                  type="text"
                  className="client-modal-input"
                  placeholder="e.g. Take with food"
                  value={suppNotes}
                  onChange={(e) => setSuppNotes(e.target.value)}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                <button type="button" onClick={() => setShowSuppModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={addingSupp} className="btn-primary">
                  {addingSupp ? "Adding..." : "Add Supplement"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
