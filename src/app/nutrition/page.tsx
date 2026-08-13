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

const MEAL_TYPES = ["Breakfast", "Lunch", "Dinner", "Snacks", "Post-Workout"];

export default function NutritionPage() {
  const { data: session, status } = useSession();
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );

  const [plan, setPlan] = useState<NutritionPlan | null>(null);
  const [logs, setLogs] = useState<NutritionLogItem[]>([]);
  const [totals, setTotals] = useState({ calories: 0, protein: 0, carbs: 0, fats: 0 });

  const [loading, setLoading] = useState(true);
  const [savingPlan, setSavingPlan] = useState(false);
  const [planSavedSuccess, setPlanSavedSuccess] = useState(false);

  // Quick Food Add Form
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedMealForAdd, setSelectedMealForAdd] = useState("Breakfast");
  const [foodName, setFoodName] = useState("");
  const [foodCalories, setFoodCalories] = useState("");
  const [foodProtein, setFoodProtein] = useState("");
  const [foodCarbs, setFoodCarbs] = useState("");
  const [foodFats, setFoodFats] = useState("");
  const [addingFood, setAddingFood] = useState(false);

  // Fetch Clients or Self-Client
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

  // Fetch Plan & Logs for Selected Client & Date
  const fetchNutritionData = useCallback(async () => {
    if (!selectedClientId) return;
    try {
      // 1. Fetch Plan
      const planRes = await fetch(`/api/nutrition/plan?clientId=${selectedClientId}`);
      if (planRes.ok) {
        const planData = await planRes.json();
        setPlan(planData.plan);
      }

      // 2. Fetch Daily Logs
      const logsRes = await fetch(
        `/api/nutrition/logs?clientId=${selectedClientId}&date=${selectedDate}`
      );
      if (logsRes.ok) {
        const logsData = await logsRes.json();
        setLogs(logsData.logs || []);
        setTotals(logsData.totals || { calories: 0, protein: 0, carbs: 0, fats: 0 });
      }
    } catch (e) {
      console.error("Failed to load nutrition data", e);
    }
  }, [selectedClientId, selectedDate]);

  useEffect(() => {
    fetchNutritionData();
  }, [fetchNutritionData]);

  // Preset Macro Calculator for Cutting vs Bulking
  const applyGoalPreset = (goal: "CUT" | "BULK" | "MAINTAIN") => {
    if (!plan) return;
    const curWeight = plan.currentWeight || 180;

    let cal = 2000;
    let pro = Math.round(curWeight * 1.0);
    let fat = Math.round(curWeight * 0.35);
    let carb = 200;

    if (goal === "CUT") {
      cal = Math.round(curWeight * 11); // Moderate deficit
      pro = Math.round(curWeight * 1.1); // High protein to preserve muscle
      fat = Math.round((cal * 0.25) / 9);
      carb = Math.round((cal - (pro * 4 + fat * 9)) / 4);
    } else if (goal === "BULK") {
      cal = Math.round(curWeight * 16); // Lean surplus
      pro = Math.round(curWeight * 0.9);
      fat = Math.round((cal * 0.25) / 9);
      carb = Math.round((cal - (pro * 4 + fat * 9)) / 4);
    } else {
      cal = Math.round(curWeight * 14); // Maintenance
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
    } catch (e) {
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
    } catch (e) {
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

  const changeDateBy = (days: number) => {
    const d = new Date(selectedDate + "T00:00:00");
    d.setDate(d.getDate() + days);
    setSelectedDate(d.toISOString().split("T")[0]);
  };

  const selectedClient = useMemo(() => {
    return clients.find((c) => c.id === selectedClientId) || null;
  }, [clients, selectedClientId]);

  // Calorie & Macro Percentages
  const targetCal = plan?.dailyCalories || 2000;
  const targetPro = plan?.proteinGrams || 150;
  const targetCarb = plan?.carbsGrams || 200;
  const targetFat = plan?.fatsGrams || 65;

  const calPct = Math.min(Math.round((totals.calories / targetCal) * 100), 100);
  const proPct = Math.min(Math.round((totals.protein / targetPro) * 100), 100);
  const carbPct = Math.min(Math.round((totals.carbs / targetCarb) * 100), 100);
  const fatPct = Math.min(Math.round((totals.fats / targetFat) * 100), 100);

  const remainingCal = targetCal - totals.calories;

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", color: "#0f172a", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      {/* Top App Header */}
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
              <span>Nutrition &amp; Macro Planner</span>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <Link
              href="/dashboard"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "12px",
                fontWeight: 600,
                background: "#eff6ff",
                color: "#2563eb",
                padding: "6px 12px",
                borderRadius: "6px",
                textDecoration: "none",
                border: "1px solid #bfdbfe",
              }}
            >
              <ArrowLeft size={14} />
              <span>Back to Workouts</span>
            </Link>

            <button
              onClick={() => signOut({ callbackUrl: "/auth/signin" })}
              style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", padding: "4px" }}
              title="Sign Out"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ maxWidth: "1200px", margin: "24px auto", padding: "0 20px 60px" }}>
        {/* Client & Date Selector Row */}
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
          {/* Client Selector */}
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

          {/* Date Switcher */}
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

        {/* 2-Column Grid: Left (Targets & Calculator), Right (Daily Meal Logger & Progress) */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.6fr", gap: "24px", alignItems: "start" }}>
          {/* LEFT COLUMN: Nutrition Targets & Cut / Bulk Planner */}
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

            {/* Quick Goal Mode Switcher */}
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

            {/* Target Edit Form */}
            {plan && (
              <form onSubmit={handleSavePlan}>
                {planSavedSuccess && (
                  <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#15803d", padding: "8px 12px", borderRadius: "8px", fontSize: "12px", display: "flex", alignItems: "center", gap: "6px", marginBottom: "14px" }}>
                    <CheckCircle2 size={15} />
                    <span>Nutrition blueprint updated!</span>
                  </div>
                )}

                {/* Weight Inputs */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "14px" }}>
                  <div>
                    <label style={{ fontSize: "11px", fontWeight: 600, color: "#64748b", display: "block", marginBottom: "4px" }}>
                      Current Bodyweight (lbs)
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

                {/* Daily Calories & Water */}
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

                {/* Macros Breakdown (Protein, Carbs, Fats) */}
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

                {/* Coaching Notes */}
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

              {/* Meal Groups */}
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
    </div>
  );
}
