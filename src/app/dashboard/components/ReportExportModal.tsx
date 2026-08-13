"use client";

import React from "react";
import { X, Download, Printer, FileText, TrendingUp, Calendar, Dumbbell, Award, CheckCircle2 } from "lucide-react";
import { Client, WorkoutSession } from "../types";

export interface ReportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: Client | null;
  workouts: WorkoutSession[];
}

export function ReportExportModal({
  isOpen,
  onClose,
  client,
  workouts,
}: ReportExportModalProps) {
  if (!isOpen || !client) return null;

  // Calculate Client Metrics
  const completedWorkouts = workouts.filter((w) => w.status === "COMPLETED");
  const totalSets = completedWorkouts.reduce(
    (acc, w) => acc + w.exercises.reduce((exAcc, ex) => exAcc + ex.sets.length, 0),
    0
  );

  const totalVolumeLbs = completedWorkouts.reduce(
    (acc, w) =>
      acc +
      w.exercises.reduce(
        (exAcc, ex) =>
          exAcc + ex.sets.reduce((stAcc, st) => stAcc + st.weight * st.reps, 0),
        0
      ),
    0
  );

  // Calculate Heaviest Lifts & 1RMs per exercise
  const exerciseStats: Record<
    string,
    { maxWeight: number; maxRepsAtMax: number; est1RM: number; totalVolume: number; count: number }
  > = {};

  completedWorkouts.forEach((w) => {
    w.exercises.forEach((ex) => {
      if (!exerciseStats[ex.name]) {
        exerciseStats[ex.name] = { maxWeight: 0, maxRepsAtMax: 0, est1RM: 0, totalVolume: 0, count: 0 };
      }
      exerciseStats[ex.name].count += 1;

      ex.sets.forEach((st) => {
        const volume = st.weight * st.reps;
        exerciseStats[ex.name].totalVolume += volume;

        // Brzycki 1RM formula
        const est1RM = st.reps > 1 ? Math.round(st.weight * (36 / (37 - Math.min(st.reps, 36)))) : st.weight;
        if (est1RM > exerciseStats[ex.name].est1RM) {
          exerciseStats[ex.name].est1RM = est1RM;
        }

        if (st.weight > exerciseStats[ex.name].maxWeight) {
          exerciseStats[ex.name].maxWeight = st.weight;
          exerciseStats[ex.name].maxRepsAtMax = st.reps;
        }
      });
    });
  });

  const topExercises = Object.entries(exerciseStats)
    .sort((a, b) => b[1].totalVolume - a[1].totalVolume)
    .slice(0, 8);

  const handleExportCSV = () => {
    const rows = [
      ["Date", "Workout Status", "Exercise", "Set", "Weight (lbs)", "Reps", "Set Volume (lbs)", "Est 1RM (lbs)"],
    ];

    completedWorkouts.forEach((w) => {
      const dateStr = new Date(w.completedAt || w.createdAt).toLocaleDateString();
      w.exercises.forEach((ex) => {
        ex.sets.forEach((st, idx) => {
          const volume = st.weight * st.reps;
          const est1RM = st.reps > 1 ? Math.round(st.weight * (36 / (37 - Math.min(st.reps, 36)))) : st.weight;
          rows.push([
            dateStr,
            w.status,
            `"${ex.name.replace(/"/g, '""')}"`,
            (idx + 1).toString(),
            st.weight.toString(),
            st.reps.toString(),
            volume.toString(),
            est1RM.toString(),
          ]);
        });
      });
    });

    const csvContent = "data:text/csv;charset=utf-8," + rows.map((e) => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${client.name.replace(/\s+/g, "_")}_Fitness_Report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="client-modal-backdrop" onClick={onClose}>
      <div
        className="client-modal-card"
        style={{ maxWidth: "750px", maxHeight: "90vh", overflowY: "auto" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="client-modal-header">
          <div className="client-modal-header-info">
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <FileText size={20} style={{ color: "#2563eb" }} />
              <h2 className="client-modal-title">Client Progress Report: {client.name}</h2>
            </div>
            <p className="client-modal-subtitle">
              Comprehensive performance summary, total tonnage, and 1RM strength progression.
            </p>
          </div>
          <button className="client-modal-close" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: "20px 24px" }}>
          {/* Quick Metrics Bar */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: "12px",
              marginBottom: "24px",
            }}
          >
            <div style={{ background: "#f8fafc", padding: "14px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
              <div style={{ fontSize: "11px", color: "#64748b", fontWeight: 600 }}>Completed Workouts</div>
              <div style={{ fontSize: "22px", fontWeight: 800, color: "#0f172a", marginTop: "2px" }}>
                {completedWorkouts.length}
              </div>
            </div>

            <div style={{ background: "#f8fafc", padding: "14px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
              <div style={{ fontSize: "11px", color: "#64748b", fontWeight: 600 }}>Total Sets Logged</div>
              <div style={{ fontSize: "22px", fontWeight: 800, color: "#0f172a", marginTop: "2px" }}>
                {totalSets}
              </div>
            </div>

            <div style={{ background: "#f8fafc", padding: "14px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
              <div style={{ fontSize: "11px", color: "#64748b", fontWeight: 600 }}>Total Volume Lifted</div>
              <div style={{ fontSize: "22px", fontWeight: 800, color: "#2563eb", marginTop: "2px" }}>
                {totalVolumeLbs.toLocaleString()} <span style={{ fontSize: "12px", fontWeight: 500 }}>lbs</span>
              </div>
            </div>

            <div style={{ background: "#f8fafc", padding: "14px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
              <div style={{ fontSize: "11px", color: "#64748b", fontWeight: 600 }}>Fitness Goals</div>
              <div style={{ fontSize: "12px", fontWeight: 600, color: "#0f172a", marginTop: "4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {client.fitnessGoals || "General Strength"}
              </div>
            </div>
          </div>

          {/* Strength & 1RM Progression Table */}
          <div style={{ marginBottom: "24px" }}>
            <div style={{ fontSize: "14px", fontWeight: 700, color: "#0f172a", marginBottom: "10px", display: "flex", alignItems: "center", gap: "6px" }}>
              <Award size={16} style={{ color: "#eab308" }} />
              <span>Top Movements &amp; Estimated 1RM Progression</span>
            </div>

            {topExercises.length === 0 ? (
              <div style={{ textAlign: "center", padding: "20px", color: "#64748b", background: "#f8fafc", borderRadius: "8px", fontSize: "13px" }}>
                No completed workouts logged yet for this client.
              </div>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px", textAlign: "left" }}>
                <thead>
                  <tr style={{ background: "#f1f5f9", borderBottom: "2px solid #cbd5e1" }}>
                    <th style={{ padding: "8px 12px", color: "#334155" }}>Exercise</th>
                    <th style={{ padding: "8px 12px", color: "#334155" }}>Max Heavy Set</th>
                    <th style={{ padding: "8px 12px", color: "#334155" }}>Est. 1RM</th>
                    <th style={{ padding: "8px 12px", color: "#334155" }}>Total Volume</th>
                  </tr>
                </thead>
                <tbody>
                  {topExercises.map(([name, stats], idx) => (
                    <tr key={name} style={{ borderBottom: "1px solid #e2e8f0", background: idx % 2 === 0 ? "#ffffff" : "#f8fafc" }}>
                      <td style={{ padding: "10px 12px", fontWeight: 600, color: "#0f172a" }}>{name}</td>
                      <td style={{ padding: "10px 12px", color: "#475569" }}>
                        {stats.maxWeight} lbs × {stats.maxRepsAtMax} reps
                      </td>
                      <td style={{ padding: "10px 12px", fontWeight: 700, color: "#16a34a" }}>
                        {stats.est1RM} lbs
                      </td>
                      <td style={{ padding: "10px 12px", color: "#64748b" }}>
                        {stats.totalVolume.toLocaleString()} lbs
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Action Buttons */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "16px", borderTop: "1px solid #e2e8f0" }}>
            <div style={{ fontSize: "12px", color: "#64748b" }}>
              Generated on {new Date().toLocaleDateString()}
            </div>

            <div style={{ display: "flex", gap: "10px" }}>
              <button
                type="button"
                onClick={handlePrint}
                className="btn-secondary"
                style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
              >
                <Printer size={14} />
                <span>Print / Save PDF</span>
              </button>

              <button
                type="button"
                onClick={handleExportCSV}
                className="btn-primary"
                style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
              >
                <Download size={14} />
                <span>Download CSV</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ReportExportModal;
