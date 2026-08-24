"use client";

import React, { useState } from "react";
import {
  MessageSquare,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Calendar,
  Trash2,
  Plus,
  Dumbbell,
  X,
  Zap,
  RotateCcw,
  Check,
} from "lucide-react";
import { StrkyrLogo } from "@/components/StrkyrLogo";
import { parseSMSWorkoutText, ParsedWorkoutSession } from "@/lib/smsWorkoutParser";

export interface TextImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientId?: string;
  clientName?: string;
  role?: "TRAINER" | "CLIENT";
  onImportComplete?: () => void;
}

const SAMPLE_SMS_TEXT = `8/10 - Upper Power
Bench Press 4x8 @ 185, 205, 215, 225
Incline DB Press 3x10 @ 65s
Barbell Row 4x10 @ 185
Bicep Curls 3x12 @ 35s
Felt strong today, good lockout

8/12 - Lower Strength
Barbell Squat 4x6 @ 275, 295, 315, 315
Romanian Deadlift 3x8 @ 225
Leg Press 3x12 @ 450
Standing Calf Raise 4x15 @ 180
Notes: Knees felt 100%, great depth`;

export function TextImportModal({
  isOpen,
  onClose,
  clientId,
  clientName,
  role = "TRAINER",
  onImportComplete,
}: TextImportModalProps) {
  const [step, setStep] = useState<"paste" | "preview">("paste");
  const [rawText, setRawText] = useState("");
  const [parsedSessions, setParsedSessions] = useState<ParsedWorkoutSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleParseText = () => {
    setErrorMsg(null);
    if (!rawText.trim()) {
      setErrorMsg("Please paste some text messages or workout notes first.");
      return;
    }

    const sessions = parseSMSWorkoutText(rawText);
    if (sessions.length === 0) {
      setErrorMsg("Could not detect any valid exercises, sets, or reps. Check the example format below.");
      return;
    }

    setParsedSessions(sessions);
    setStep("preview");
  };

  const handleCommitBackfill = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/ai/import-text-history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId,
          mode: "commit",
          sessions: parsedSessions,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setSuccessMsg(data.message || "Workouts successfully backfilled!");
        setTimeout(() => {
          if (onImportComplete) onImportComplete();
          onClose();
        }, 1200);
      } else {
        setErrorMsg(data.error || "Failed to commit backfilled workouts.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Network error while saving workouts.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSessionDate = (sessionIdx: number, newDate: string) => {
    setParsedSessions((prev) => {
      const copy = [...prev];
      copy[sessionIdx] = { ...copy[sessionIdx], date: newDate };
      return copy;
    });
  };

  const handleDeleteSession = (sessionIdx: number) => {
    setParsedSessions((prev) => prev.filter((_, idx) => idx !== sessionIdx));
  };

  const handleDeleteExercise = (sessionIdx: number, exIdx: number) => {
    setParsedSessions((prev) => {
      const copy = [...prev];
      copy[sessionIdx].exercises = copy[sessionIdx].exercises.filter((_, idx) => idx !== exIdx);
      return copy;
    });
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(15, 23, 42, 0.7)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 99999,
        padding: "16px",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "20px",
          maxWidth: "640px",
          width: "100%",
          padding: "28px",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          border: "1px solid #e2e8f0",
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "18px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "#eff6ff", color: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <MessageSquare size={22} />
            </div>
            <div>
              <span style={{ fontSize: "11px", fontWeight: 800, color: "#2563eb", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                AI Workout Backfill
              </span>
              <h3 style={{ margin: "2px 0 0 0", fontSize: "18px", fontWeight: 900, color: "#0f172a" }}>
                Import Historical Text Messages
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: "transparent", border: "none", color: "#64748b", cursor: "pointer", padding: "4px" }}
          >
            <X size={20} />
          </button>
        </div>

        {clientName && (
          <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "8px 12px", marginBottom: "16px", fontSize: "12px", color: "#475569" }}>
            Target Athlete: <strong style={{ color: "#0f172a" }}>{clientName}</strong>
          </div>
        )}

        {/* Step 1: Paste Raw Text */}
        {step === "paste" && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", overflowY: "auto" }}>
            <p style={{ fontSize: "13px", color: "#475569", margin: "0 0 12px 0", lineHeight: 1.45 }}>
              Copy and paste raw workout text messages sent via Android Messages, SMS, WhatsApp, or notes. Our AI parser extracts dates, exercises, sets, reps, and weights automatically.
            </p>

            <div style={{ position: "relative", marginBottom: "12px" }}>
              <textarea
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder="Paste workout messages here (e.g. '8/12: Bench 4x8 @ 225, Squats 3x5 @ 315...')"
                style={{
                  width: "100%",
                  minHeight: "200px",
                  padding: "12px 14px",
                  borderRadius: "12px",
                  border: "1px solid #cbd5e1",
                  fontSize: "13px",
                  fontFamily: "monospace",
                  lineHeight: 1.5,
                  outline: "none",
                  boxSizing: "border-box",
                  resize: "vertical",
                }}
              />
              <button
                type="button"
                onClick={() => setRawText(SAMPLE_SMS_TEXT)}
                style={{
                  position: "absolute",
                  bottom: "12px",
                  right: "12px",
                  fontSize: "11px",
                  fontWeight: 700,
                  color: "#2563eb",
                  background: "#eff6ff",
                  border: "1px solid #bfdbfe",
                  borderRadius: "6px",
                  padding: "4px 8px",
                  cursor: "pointer",
                }}
              >
                Paste Sample SMS Dump
              </button>
            </div>

            {errorMsg && (
              <div style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626", padding: "10px 12px", borderRadius: "8px", fontSize: "12px", marginBottom: "12px" }}>
                {errorMsg}
              </div>
            )}

            <div style={{ marginTop: "auto", display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button
                type="button"
                onClick={onClose}
                style={{ padding: "10px 16px", borderRadius: "10px", background: "#f1f5f9", border: "1px solid #cbd5e1", color: "#475569", fontWeight: 600, fontSize: "13px", cursor: "pointer" }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleParseText}
                style={{
                  padding: "10px 20px",
                  borderRadius: "10px",
                  background: "#2563eb",
                  color: "#ffffff",
                  border: "none",
                  fontWeight: 800,
                  fontSize: "13px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <span>Parse &amp; Preview Workouts</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Review & Edit Parsed Sessions */}
        {step === "preview" && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <span style={{ fontSize: "13px", fontWeight: 700, color: "#0f172a" }}>
                Detected {parsedSessions.length} Workout Sessions ({parsedSessions.reduce((sum, s) => sum + s.exercises.length, 0)} exercises)
              </span>
              <button
                type="button"
                onClick={() => setStep("paste")}
                style={{ fontSize: "12px", color: "#2563eb", background: "transparent", border: "none", cursor: "pointer", fontWeight: 600 }}
              >
                ← Back to Raw Text
              </button>
            </div>

            <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "12px", marginBottom: "16px", paddingRight: "4px" }}>
              {parsedSessions.map((sessionItem, sIdx) => (
                <div
                  key={sIdx}
                  style={{
                    background: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    borderRadius: "12px",
                    padding: "14px",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <Calendar size={15} style={{ color: "#2563eb" }} />
                      <input
                        type="date"
                        value={sessionItem.date}
                        onChange={(e) => handleUpdateSessionDate(sIdx, e.target.value)}
                        style={{ padding: "4px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "12px", fontWeight: 700 }}
                      />
                      <span style={{ fontSize: "13px", fontWeight: 800, color: "#0f172a" }}>
                        {sessionItem.title || "Workout"}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteSession(sIdx)}
                      style={{ background: "transparent", border: "none", color: "#94a3b8", cursor: "pointer" }}
                      title="Delete this session"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>

                  {sessionItem.notes && (
                    <div style={{ fontSize: "11px", color: "#64748b", fontStyle: "italic", marginBottom: "8px" }}>
                      Note: {sessionItem.notes}
                    </div>
                  )}

                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    {sessionItem.exercises.map((ex, eIdx) => (
                      <div
                        key={eIdx}
                        style={{
                          background: "#ffffff",
                          border: "1px solid #e2e8f0",
                          borderRadius: "8px",
                          padding: "8px 10px",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          fontSize: "12px",
                        }}
                      >
                        <div>
                          <strong style={{ color: "#0f172a" }}>{ex.name}</strong>
                          <span style={{ color: "#64748b", marginLeft: "8px" }}>
                            {ex.sets.length} sets • {ex.sets.map((s) => `${s.weight}#x${s.reps}`).join(", ")}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteExercise(sIdx, eIdx)}
                          style={{ background: "transparent", border: "none", color: "#94a3b8", cursor: "pointer", padding: "2px" }}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {errorMsg && (
              <div style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626", padding: "10px 12px", borderRadius: "8px", fontSize: "12px", marginBottom: "12px" }}>
                {errorMsg}
              </div>
            )}

            {successMsg && (
              <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#15803d", padding: "10px 12px", borderRadius: "8px", fontSize: "12px", marginBottom: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
                <Check size={16} />
                <span>{successMsg}</span>
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px" }}>
              <button
                type="button"
                onClick={() => setStep("paste")}
                style={{ padding: "10px 16px", borderRadius: "10px", background: "#f1f5f9", border: "1px solid #cbd5e1", color: "#475569", fontWeight: 600, fontSize: "13px", cursor: "pointer" }}
              >
                Back
              </button>

              <button
                type="button"
                disabled={loading || parsedSessions.length === 0}
                onClick={handleCommitBackfill}
                style={{
                  padding: "10px 22px",
                  borderRadius: "10px",
                  background: "linear-gradient(135deg, #16a34a, #15803d)",
                  color: "#ffffff",
                  border: "none",
                  fontWeight: 800,
                  fontSize: "13px",
                  cursor: loading || parsedSessions.length === 0 ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  boxShadow: "0 2px 8px rgba(22,163,74,0.25)",
                }}
              >
                {loading ? (
                  <span>Backfilling Database...</span>
                ) : (
                  <>
                    <Zap size={16} />
                    <span>Commit &amp; Backfill {parsedSessions.length} Sessions</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default TextImportModal;
