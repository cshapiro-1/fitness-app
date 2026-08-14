"use client";

import React, { useState } from "react";
import { X, Sparkles, Dumbbell, Zap, Check, ArrowRight, Clock, ShieldAlert } from "lucide-react";
import { GeneratedRoutine } from "../../api/ai/generate-routine/route";

interface AIRoutineGeneratorModalProps {
  onClose: () => void;
  onImportRoutine: (routine: GeneratedRoutine) => void;
}

export function AIRoutineGeneratorModal({
  onClose,
  onImportRoutine,
}: AIRoutineGeneratorModalProps) {
  const [goal, setGoal] = useState<string>("HYPERTROPHY");
  const [split, setSplit] = useState<string>("Push / Chest & Shoulders");
  const [level, setLevel] = useState<string>("Intermediate");
  const [timeMinutes, setTimeMinutes] = useState<number>(60);
  const [generating, setGenerating] = useState(false);
  const [generatedResult, setGeneratedResult] = useState<GeneratedRoutine | null>(null);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await fetch("/api/ai/generate-routine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          goal,
          split,
          experienceLevel: level,
          availableTimeMinutes: timeMinutes,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setGeneratedResult(data.routine);
      } else {
        alert("Failed to generate AI routine. Please try again.");
      }
    } catch {
      alert("Error generating routine.");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="client-modal-backdrop" onClick={onClose}>
      <div
        className="client-modal-card"
        style={{ maxWidth: "680px" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="client-modal-header">
          <div className="client-modal-header-info">
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Sparkles size={20} style={{ color: "#2563eb" }} />
              <h2 className="client-modal-title">AI Workout Program Generator</h2>
            </div>
            <p className="client-modal-subtitle">
              Instant periodized workout design with biomechanical cues & warmups.
            </p>
          </div>
          <button className="client-modal-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: "20px 24px", maxHeight: "75vh", overflowY: "auto" }}>
          {!generatedResult ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
              {/* Primary Goal */}
              <div>
                <label style={{ fontSize: "12px", fontWeight: 700, color: "#475569", textTransform: "uppercase", display: "block", marginBottom: "8px" }}>
                  Primary Objective
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
                  {[
                    { id: "HYPERTROPHY", label: "Hypertrophy", desc: "Muscle growth & volume" },
                    { id: "STRENGTH", label: "Pure Strength", desc: "Maximal neurological force" },
                    { id: "BODYWEIGHT", label: "Calisthenics", desc: "Bodyweight & gymnastics" },
                  ].map((g) => (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => {
                        setGoal(g.id);
                        if (g.id === "STRENGTH") setSplit("Upper Body Push");
                        else if (g.id === "BODYWEIGHT") setSplit("Calisthenics & Core");
                        else setSplit("Push / Chest & Shoulders");
                      }}
                      style={{
                        padding: "10px 12px",
                        textAlign: "left",
                        borderRadius: "8px",
                        border: "1px solid",
                        borderColor: goal === g.id ? "#2563eb" : "#e2e8f0",
                        background: goal === g.id ? "#eff6ff" : "#ffffff",
                        cursor: "pointer",
                      }}
                    >
                      <div style={{ fontSize: "13px", fontWeight: 700, color: goal === g.id ? "#1d4ed8" : "#0f172a" }}>{g.label}</div>
                      <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>{g.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Split Focus */}
              <div>
                <label style={{ fontSize: "12px", fontWeight: 700, color: "#475569", textTransform: "uppercase", display: "block", marginBottom: "8px" }}>
                  Target Split Focus
                </label>
                <select
                  value={split}
                  onChange={(e) => setSplit(e.target.value)}
                  className="input-field"
                  style={{ width: "100%", padding: "10px 12px" }}
                >
                  {goal === "STRENGTH" && (
                    <>
                      <option value="Upper Body Push">Upper Body Push (Bench / OHP Focus)</option>
                      <option value="Lower Body Heavy">Lower Body Heavy (Squat / RDL Focus)</option>
                    </>
                  )}
                  {goal === "HYPERTROPHY" && (
                    <>
                      <option value="Push / Chest & Shoulders">Push / Chest, Shoulders & Triceps</option>
                      <option value="Pull / Back & Biceps">Pull / Back, Rear Delts & Biceps</option>
                    </>
                  )}
                  {goal === "BODYWEIGHT" && (
                    <option value="Calisthenics & Core">Calisthenics Mastery & Core Stability</option>
                  )}
                </select>
              </div>

              {/* Experience Level & Session Time */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: 700, color: "#475569", textTransform: "uppercase", display: "block", marginBottom: "8px" }}>
                    Athlete Level
                  </label>
                  <select
                    value={level}
                    onChange={(e) => setLevel(e.target.value)}
                    className="input-field"
                    style={{ width: "100%", padding: "8px 10px" }}
                  >
                    <option value="Beginner">Beginner (Foundational)</option>
                    <option value="Intermediate">Intermediate (Progressive Overload)</option>
                    <option value="Advanced">Advanced (High Intensity / Volume)</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: "12px", fontWeight: 700, color: "#475569", textTransform: "uppercase", display: "block", marginBottom: "8px" }}>
                    Session Duration
                  </label>
                  <select
                    value={timeMinutes}
                    onChange={(e) => setTimeMinutes(Number(e.target.value))}
                    className="input-field"
                    style={{ width: "100%", padding: "8px 10px" }}
                  >
                    <option value={45}>45 Minutes (Express)</option>
                    <option value={60}>60 Minutes (Standard)</option>
                    <option value={75}>75 Minutes (High Volume)</option>
                  </select>
                </div>
              </div>

              {/* Generate Button */}
              <div style={{ marginTop: "10px" }}>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={handleGenerate}
                  disabled={generating}
                  style={{ width: "100%", padding: "12px", justifyContent: "center", fontSize: "14px", fontWeight: 700 }}
                >
                  {generating ? (
                    <>
                      <div className="spin-inline" /> Generating AI Periodized Routine...
                    </>
                  ) : (
                    <>
                      <Sparkles size={16} /> Generate AI Program
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {/* Header Info */}
              <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: "10px", padding: "14px 16px" }}>
                <div style={{ fontSize: "16px", fontWeight: 800, color: "#1e40af" }}>
                  {generatedResult.routineName}
                </div>
                <div style={{ display: "flex", gap: "12px", fontSize: "12px", color: "#3b82f6", marginTop: "4px", flexWrap: "wrap" }}>
                  <span>🎯 Goal: <b>{generatedResult.goal}</b></span>
                  <span>⏱️ Duration: <b>{generatedResult.estimatedDurationMinutes} mins</b></span>
                  <span>🔥 Level: <b>{generatedResult.level}</b></span>
                </div>
              </div>

              {/* Warmup Checklist */}
              <div style={{ background: "#fafafa", borderRadius: "8px", padding: "12px", border: "1px solid #f1f5f9" }}>
                <div style={{ fontSize: "12px", fontWeight: 700, color: "#0f172a", marginBottom: "6px" }}>
                  🏃‍♂️ Dynamic Warmup Protocol:
                </div>
                <ul style={{ margin: 0, paddingLeft: "18px", fontSize: "12px", color: "#475569" }}>
                  {generatedResult.warmupInstructions.map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              </div>

              {/* Exercise Breakdown */}
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <div style={{ fontSize: "13px", fontWeight: 800, color: "#0f172a" }}>
                  Exercises ({generatedResult.exercises.length} Total):
                </div>

                {generatedResult.exercises.map((ex, i) => (
                  <div
                    key={i}
                    style={{
                      background: "#ffffff",
                      border: "1px solid #e2e8f0",
                      borderRadius: "8px",
                      padding: "10px 12px",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: "13px", fontWeight: 700, color: "#0f172a" }}>
                        {i + 1}. {ex.name}
                      </span>
                      <span style={{ fontSize: "11px", fontWeight: 600, color: "#2563eb", background: "#eff6ff", padding: "2px 8px", borderRadius: "6px" }}>
                        {ex.targetSets} sets × {ex.targetReps} reps
                      </span>
                    </div>
                    <div style={{ fontSize: "11px", color: "#64748b", marginTop: "4px", fontStyle: "italic" }}>
                      💡 Cue: {ex.coachingCue}
                    </div>
                  </div>
                ))}
              </div>

              {/* Actions: Re-generate or Import */}
              <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setGeneratedResult(null)}
                  style={{ flex: 1, padding: "10px", justifyContent: "center" }}
                >
                  Back to Parameters
                </button>

                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => {
                    onImportRoutine(generatedResult);
                    onClose();
                  }}
                  style={{ flex: 2, padding: "10px", justifyContent: "center", fontWeight: 700 }}
                >
                  <Check size={16} /> Import into Workout Builder
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
