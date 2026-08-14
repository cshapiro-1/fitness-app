"use client";

import React, { useState } from "react";
import { X, Dumbbell, Sparkles } from "lucide-react";
import { calculatePlates, PLATE_COLORS } from "../utils/plateCalculator";

interface PlateCalculatorModalProps {
  initialWeight?: number;
  onClose: () => void;
}

export function PlateCalculatorModal({
  initialWeight = 135,
  onClose,
}: PlateCalculatorModalProps) {
  const [targetWeight, setTargetWeight] = useState<number>(initialWeight);
  const [barWeight, setBarWeight] = useState<number>(45);

  const breakdown = calculatePlates(targetWeight, barWeight);

  const handleAdjust = (delta: number) => {
    setTargetWeight((prev) => Math.max(barWeight, prev + delta));
  };

  return (
    <div className="client-modal-backdrop" onClick={onClose}>
      <div
        className="client-modal-card"
        style={{ maxWidth: "560px" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="client-modal-header">
          <div className="client-modal-header-info">
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Dumbbell size={20} style={{ color: "#2563eb" }} />
              <h2 className="client-modal-title">Barbell Plate Calculator</h2>
            </div>
            <p className="client-modal-subtitle">
              Interactive plate math & barbell loading visualizer.
            </p>
          </div>
          <button className="client-modal-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: "20px 24px" }}>
          {/* Target Weight Controls */}
          <div style={{ marginBottom: "20px" }}>
            <label style={{ fontSize: "12px", fontWeight: 700, color: "#475569", textTransform: "uppercase", display: "block", marginBottom: "8px" }}>
              Target Weight (lbs)
            </label>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <button className="btn-secondary" onClick={() => handleAdjust(-10)}>-10</button>
              <button className="btn-secondary" onClick={() => handleAdjust(-5)}>-5</button>
              <input
                type="number"
                value={targetWeight || ""}
                onChange={(e) => setTargetWeight(Number(e.target.value) || barWeight)}
                className="input-field"
                style={{ textAlign: "center", fontSize: "22px", fontWeight: 800, color: "#2563eb", width: "130px" }}
                min={barWeight}
                step={2.5}
              />
              <button className="btn-secondary" onClick={() => handleAdjust(+5)}>+5</button>
              <button className="btn-secondary" onClick={() => handleAdjust(+10)}>+10</button>
              <button className="btn-primary" onClick={() => handleAdjust(+45)} style={{ padding: "6px 12px", fontSize: "12px" }}>+45</button>
            </div>
          </div>

          {/* Bar Type Selector */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
            <span style={{ fontSize: "12px", fontWeight: 600, color: "#64748b" }}>Bar Weight:</span>
            {[
              { label: "Standard (45 lbs)", wt: 45 },
              { label: "Women's / Tech (35 lbs)", wt: 35 },
              { label: "EZ Bar (15 lbs)", wt: 15 },
            ].map((b) => (
              <button
                key={b.wt}
                type="button"
                onClick={() => setBarWeight(b.wt)}
                style={{
                  fontSize: "11px",
                  fontWeight: 600,
                  padding: "4px 10px",
                  borderRadius: "6px",
                  border: "1px solid",
                  borderColor: barWeight === b.wt ? "#2563eb" : "#cbd5e1",
                  background: barWeight === b.wt ? "#eff6ff" : "#f8fafc",
                  color: barWeight === b.wt ? "#1d4ed8" : "#475569",
                  cursor: "pointer",
                }}
              >
                {b.label}
              </button>
            ))}
          </div>

          {/* Visual Barbell Loading Representation */}
          <div
            style={{
              background: "#0f172a",
              borderRadius: "12px",
              padding: "24px 16px",
              marginBottom: "20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              minHeight: "140px",
              overflowX: "auto",
            }}
          >
            {/* Left Bar Sleeve */}
            <div style={{ height: "12px", width: "40px", background: "#94a3b8", borderRadius: "2px 0 0 2px" }} />
            {/* Center Collar */}
            <div style={{ height: "40px", width: "12px", background: "#cbd5e1", borderRadius: "3px" }} />

            {/* Plates on Sleeve */}
            <div style={{ display: "flex", alignItems: "center", gap: "3px", margin: "0 6px" }}>
              {breakdown.platesPerSide.length === 0 ? (
                <span style={{ fontSize: "12px", color: "#64748b", fontStyle: "italic" }}>Empty Bar ({barWeight} lbs)</span>
              ) : (
                breakdown.platesPerSide.flatMap((p) =>
                  Array.from({ length: p.count }).map((_, i) => {
                    const color = PLATE_COLORS[p.weight] || { bg: "#475569", border: "#334155", text: "#fff" };
                    const heightMap: Record<number, number> = { 45: 100, 35: 85, 25: 70, 10: 55, 5: 42, 2.5: 32 };
                    const h = heightMap[p.weight] || 50;
                    return (
                      <div
                        key={`${p.weight}-${i}`}
                        style={{
                          height: `${h}px`,
                          width: "18px",
                          background: color.bg,
                          border: `1px solid ${color.border}`,
                          borderRadius: "4px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          boxShadow: "0 2px 4px rgba(0,0,0,0.3)",
                        }}
                        title={`${p.weight} lb plate`}
                      >
                        <span
                          style={{
                            fontSize: "9px",
                            fontWeight: 800,
                            color: color.text,
                            writingMode: "vertical-rl",
                            textOrientation: "mixed",
                            transform: "rotate(180deg)",
                          }}
                        >
                          {p.weight}
                        </span>
                      </div>
                    );
                  })
                )
              )}
            </div>

            {/* Right Bar Shaft */}
            <div style={{ height: "12px", width: "80px", background: "#64748b", borderRadius: "0 2px 2px 0" }} />
          </div>

          {/* Breakdown Summary */}
          <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "14px 16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
              <span style={{ fontSize: "13px", fontWeight: 700, color: "#0f172a" }}>Weight Per Side:</span>
              <span style={{ fontSize: "16px", fontWeight: 800, color: "#2563eb" }}>
                {breakdown.weightPerSide} lbs
              </span>
            </div>

            <div style={{ fontSize: "12px", color: "#64748b", display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {breakdown.platesPerSide.length === 0 ? (
                <span>No plates required.</span>
              ) : (
                breakdown.platesPerSide.map((p) => (
                  <span
                    key={p.weight}
                    style={{
                      background: "#ffffff",
                      border: "1px solid #cbd5e1",
                      borderRadius: "6px",
                      padding: "3px 8px",
                      fontWeight: 600,
                      color: "#1e293b",
                    }}
                  >
                    <b>{p.count}x</b> {p.weight} lb
                  </span>
                ))
              )}
            </div>

            {breakdown.remainder > 0 && (
              <div style={{ marginTop: "10px", fontSize: "11px", color: "#d97706", fontWeight: 600 }}>
                ⚠️ Exact target unreachable with standard plates. Achieved: {breakdown.totalAchieved} lbs ({breakdown.remainder} lbs remainder).
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
