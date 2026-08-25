"use client";

import React, { useState, useRef } from "react";
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
  Clipboard,
  Upload,
  User,
  Users,
  FileText,
} from "lucide-react";
import { StrkyrLogo } from "@/components/StrkyrLogo";
import { parseSMSWorkoutText, ParsedWorkoutSession } from "@/lib/smsWorkoutParser";
import { Client } from "../types";

export interface TextImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientId?: string;
  clientName?: string;
  clients?: Client[];
  role?: "TRAINER" | "CLIENT";
  onImportComplete?: () => void;
}

const SAMPLE_SMS_TEXT = `[Collin Shapiro]
8/10 - Upper Power
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
Notes: Knees felt 100%, great depth

[Sarah Jenkins]
8/14 - Full Body Mobility & Hypertrophy
Dumbbell Goblet Squat 3x12 @ 45
Lat Pulldowns 3x10 @ 110
Push-Ups 3x15
Dumbbell Shoulder Press 3x10 @ 25s
Plank 3x60s`;

export function TextImportModal({
  isOpen,
  onClose,
  clientId,
  clientName,
  clients = [],
  role = "TRAINER",
  onImportComplete,
}: TextImportModalProps) {
  const [step, setStep] = useState<"paste" | "preview">("paste");
  const [rawText, setRawText] = useState("");
  const [selectedTargetClientId, setSelectedTargetClientId] = useState<string>(clientId || "auto");
  const [parsedSessions, setParsedSessions] = useState<ParsedWorkoutSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Handle 1-Tap Paste from Android Clipboard
  const handlePasteClipboard = async () => {
    setErrorMsg(null);
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const clipboardText = await navigator.clipboard.readText();
        if (clipboardText && clipboardText.trim()) {
          setRawText((prev) => (prev ? `${prev}\n\n${clipboardText}` : clipboardText));
          return;
        }
      }
      setErrorMsg("Please grant clipboard permission or paste text directly into the box.");
    } catch {
      setErrorMsg("Clipboard access was blocked by browser. Please paste directly into the box.");
    }
  };

  // Handle Android File Upload (.txt, .json, .csv, SMS backups)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setRawText(content);
        setErrorMsg(null);
      }
    };
    reader.onerror = () => {
      setErrorMsg("Failed to read file. Please try copy-pasting the text instead.");
    };
    reader.readAsText(file);
  };

  const handleParseText = () => {
    setErrorMsg(null);
    if (!rawText.trim()) {
      setErrorMsg("Please paste some text messages or workout notes first.");
      return;
    }

    const knownList = clients.map((c) => ({ id: c.id, name: c.name }));
    const sessions = parseSMSWorkoutText(rawText, undefined, knownList);

    if (sessions.length === 0) {
      setErrorMsg("Could not detect any valid exercises, sets, or reps. Check the example format below.");
      return;
    }

    // Apply selected target client if specific client chosen
    const resolvedSessions = sessions.map((s) => {
      if (selectedTargetClientId !== "auto") {
        const targetClient = clients.find((c) => c.id === selectedTargetClientId);
        return {
          ...s,
          clientId: selectedTargetClientId,
          clientName: targetClient ? targetClient.name : s.clientName,
        };
      }
      // If auto-detect, check if session name matches any client
      if (!s.clientId && s.clientName) {
        const found = clients.find((c) => c.name.toLowerCase() === s.clientName?.toLowerCase());
        if (found) {
          return { ...s, clientId: found.id, clientName: found.name };
        }
      } else if (!s.clientId && clientId) {
        return { ...s, clientId, clientName };
      }
      return s;
    });

    setParsedSessions(resolvedSessions);
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
          clientId: selectedTargetClientId !== "auto" ? selectedTargetClientId : clientId,
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

  const handleUpdateSessionClient = (sessionIdx: number, targetClientId: string) => {
    const targetClient = clients.find((c) => c.id === targetClientId);
    setParsedSessions((prev) => {
      const copy = [...prev];
      copy[sessionIdx] = {
        ...copy[sessionIdx],
        clientId: targetClientId,
        clientName: targetClient ? targetClient.name : copy[sessionIdx].clientName,
      };
      return copy;
    });
  };

  const handleDeleteSession = (sessionIdx: number) => {
    setParsedSessions((prev) => prev.filter((_, idx) => idx !== sessionIdx));
  };

  const totalExercisesFound = parsedSessions.reduce((sum, s) => sum + s.exercises.length, 0);
  const totalSetsFound = parsedSessions.reduce(
    (sum, s) => sum + s.exercises.reduce((exSum, e) => exSum + e.sets.length, 0),
    0
  );

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(15, 23, 42, 0.75)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 99999,
        padding: "12px",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "680px",
          maxHeight: "92vh",
          backgroundColor: "#ffffff",
          borderRadius: "16px",
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.2)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "16px 20px",
            background: "linear-gradient(135deg, #0f172a, #1e293b)",
            color: "#ffffff",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "10px",
                background: "rgba(59, 130, 246, 0.2)",
                border: "1px solid rgba(59, 130, 246, 0.4)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#60a5fa",
              }}
            >
              <MessageSquare size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: "16px", fontWeight: 700, margin: 0 }}>
                Import Workouts from Text / SMS
              </h3>
              <p style={{ fontSize: "12px", color: "#94a3b8", margin: "2px 0 0" }}>
                Import past client history from Android messages, WhatsApp, or notes
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              color: "#94a3b8",
              cursor: "pointer",
              padding: "6px",
              borderRadius: "6px",
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: "20px", overflowY: "auto", flex: 1 }}>
          {errorMsg && (
            <div
              style={{
                background: "#fef2f2",
                border: "1px solid #fecaca",
                color: "#991b1b",
                padding: "10px 14px",
                borderRadius: "8px",
                fontSize: "13px",
                marginBottom: "16px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <span>⚠️</span>
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div
              style={{
                background: "#f0fdf4",
                border: "1px solid #bbf7d0",
                color: "#166534",
                padding: "12px 14px",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: 600,
                marginBottom: "16px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <CheckCircle2 size={18} style={{ color: "#16a34a" }} />
              <span>{successMsg}</span>
            </div>
          )}

          {step === "paste" && (
            <div>
              {/* Target Athlete Selection */}
              {role === "TRAINER" && clients.length > 0 && (
                <div
                  style={{
                    background: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    borderRadius: "10px",
                    padding: "12px 14px",
                    marginBottom: "16px",
                  }}
                >
                  <label
                    style={{
                      display: "block",
                      fontSize: "12px",
                      fontWeight: 700,
                      color: "#334155",
                      marginBottom: "6px",
                    }}
                  >
                    Target Athlete for Imported Workouts:
                  </label>
                  <select
                    className="input"
                    value={selectedTargetClientId}
                    onChange={(e) => setSelectedTargetClientId(e.target.value)}
                    style={{ width: "100%", fontSize: "13px", padding: "8px 10px" }}
                  >
                    <option value="auto">✨ Auto-Detect Clients from Text Headers (Multi-Client)</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        👤 {c.name} {c.name.includes("My Workouts") ? "(Personal)" : ""}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Android Action Toolbar (Paste / File Upload / Example) */}
              <div
                style={{
                  display: "flex",
                  gap: "8px",
                  marginBottom: "12px",
                  flexWrap: "wrap",
                }}
              >
                <button
                  type="button"
                  onClick={handlePasteClipboard}
                  className="btn-secondary"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    fontSize: "12px",
                    fontWeight: 600,
                    padding: "8px 12px",
                    borderColor: "#3b82f6",
                    color: "#1d4ed8",
                    background: "#eff6ff",
                  }}
                >
                  <Clipboard size={14} />
                  <span>📋 Paste from Clipboard</span>
                </button>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="btn-secondary"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    fontSize: "12px",
                    fontWeight: 600,
                    padding: "8px 12px",
                  }}
                >
                  <Upload size={14} />
                  <span>📁 Upload Text File (.txt/.json)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setRawText(SAMPLE_SMS_TEXT)}
                  className="btn-secondary"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    fontSize: "12px",
                    padding: "8px 12px",
                  }}
                >
                  <Sparkles size={14} style={{ color: "#8b5cf6" }} />
                  <span>Try Sample SMS</span>
                </button>

                {rawText && (
                  <button
                    type="button"
                    onClick={() => setRawText("")}
                    style={{
                      marginLeft: "auto",
                      background: "transparent",
                      border: "none",
                      color: "#94a3b8",
                      fontSize: "12px",
                      cursor: "pointer",
                    }}
                  >
                    Clear Text
                  </button>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt,.json,.csv,.log,.xml"
                  onChange={handleFileUpload}
                  style={{ display: "none" }}
                />
              </div>

              {/* Free Text Input Area */}
              <div style={{ position: "relative" }}>
                <textarea
                  className="input"
                  rows={10}
                  placeholder={`Paste text messages, WhatsApp chat, or workout logs here...\n\nExample:\n[Collin Shapiro]\n8/10 - Upper Power\nBench Press 4x8 @ 185, 205, 215, 225\nIncline DB Press 3x10 @ 65s\nBarbell Row 4x10 @ 185\nBicep Curls 3x12 @ 35s\n\n8/12 - Lower Strength\nSquats 4x6 @ 315\nLeg Press 3x12 @ 450`}
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  style={{
                    width: "100%",
                    fontSize: "13px",
                    fontFamily: "monospace",
                    lineHeight: "1.5",
                    padding: "12px",
                    borderRadius: "10px",
                    resize: "vertical",
                  }}
                />
              </div>

              {/* Formatting Helper Tip */}
              <div
                style={{
                  marginTop: "12px",
                  background: "#f1f5f9",
                  padding: "10px 14px",
                  borderRadius: "8px",
                  fontSize: "12px",
                  color: "#475569",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "8px",
                }}
              >
                <span style={{ fontSize: "14px" }}>💡</span>
                <div>
                  <strong>Flexible Parser:</strong> Handles dates (e.g. <code>8/10</code>, <code>Aug 12</code>), exercises (<code>Bench Press</code>, <code>Squat</code>), sets &amp; reps (<code>4x8 @ 225</code>, <code>3x10 with 65s</code>), and client headers (<code>[Client Name]</code>).
                </div>
              </div>
            </div>
          )}

          {step === "preview" && (
            <div>
              {/* Parse Summary Bar */}
              <div
                style={{
                  background: "#f0fdf4",
                  border: "1px solid #bbf7d0",
                  padding: "12px 16px",
                  borderRadius: "10px",
                  marginBottom: "16px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: "10px",
                }}
              >
                <div>
                  <div style={{ fontSize: "14px", fontWeight: 700, color: "#166534" }}>
                    ✓ Ready to Import {parsedSessions.length} Workout Sessions
                  </div>
                  <div style={{ fontSize: "12px", color: "#15803d" }}>
                    Total: {totalExercisesFound} exercises · {totalSetsFound} recorded sets
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setStep("paste")}
                  className="btn-secondary"
                  style={{ fontSize: "12px", padding: "6px 12px" }}
                >
                  ← Edit Text
                </button>
              </div>

              {/* Parsed Workout Cards */}
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {parsedSessions.map((session, sIdx) => (
                  <div
                    key={sIdx}
                    style={{
                      background: "#ffffff",
                      border: "1px solid #e2e8f0",
                      borderRadius: "12px",
                      padding: "14px 16px",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        borderBottom: "1px solid #f1f5f9",
                        paddingBottom: "10px",
                        marginBottom: "10px",
                        flexWrap: "wrap",
                        gap: "8px",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                          <Calendar size={14} style={{ color: "#2563eb" }} />
                          <input
                            type="date"
                            value={session.date}
                            onChange={(e) => handleUpdateSessionDate(sIdx, e.target.value)}
                            style={{
                              fontSize: "12px",
                              padding: "4px 8px",
                              borderRadius: "6px",
                              border: "1px solid #cbd5e1",
                              fontWeight: 600,
                            }}
                          />
                        </div>

                        {/* Client Selector per session card */}
                        {role === "TRAINER" && clients.length > 0 && (
                          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                            <User size={13} style={{ color: "#64748b" }} />
                            <select
                              value={session.clientId || ""}
                              onChange={(e) => handleUpdateSessionClient(sIdx, e.target.value)}
                              style={{
                                fontSize: "12px",
                                padding: "4px 8px",
                                borderRadius: "6px",
                                border: "1px solid #cbd5e1",
                                background: "#f8fafc",
                                fontWeight: 600,
                                color: "#1e293b",
                              }}
                            >
                              <option value="">👤 Select Client...</option>
                              {clients.map((c) => (
                                <option key={c.id} value={c.id}>
                                  {c.name}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeleteSession(sIdx)}
                        style={{
                          background: "transparent",
                          border: "none",
                          color: "#ef4444",
                          cursor: "pointer",
                          padding: "4px",
                        }}
                        title="Remove this workout session"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    {/* Exercises List */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      {session.exercises.map((ex, exIdx) => (
                        <div
                          key={exIdx}
                          style={{
                            background: "#f8fafc",
                            padding: "8px 12px",
                            borderRadius: "8px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            fontSize: "12px",
                          }}
                        >
                          <div style={{ fontWeight: 600, color: "#0f172a" }}>
                            {ex.name}
                          </div>
                          <div style={{ color: "#64748b" }}>
                            {ex.sets.map((st, stIdx) => (
                              <span key={stIdx} style={{ marginLeft: "6px" }}>
                                {st.weight > 0 ? `${st.weight}lbs × ${st.reps}` : `${st.reps} reps`}
                                {stIdx < ex.sets.length - 1 ? "," : ""}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: "16px 20px",
            borderTop: "1px solid #e2e8f0",
            backgroundColor: "#f8fafc",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <button
            type="button"
            className="btn-secondary"
            onClick={onClose}
            style={{ fontSize: "13px" }}
          >
            Cancel
          </button>

          {step === "paste" ? (
            <button
              type="button"
              className="btn-primary"
              onClick={handleParseText}
              disabled={!rawText.trim()}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "13px",
                padding: "8px 18px",
              }}
            >
              <span>Parse Workouts</span>
              <ArrowRight size={15} />
            </button>
          ) : (
            <button
              type="button"
              className="btn-primary"
              onClick={handleCommitBackfill}
              disabled={loading || parsedSessions.length === 0}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "13px",
                padding: "8px 18px",
                background: "#16a34a",
                borderColor: "#15803d",
              }}
            >
              {loading ? (
                <span>Importing Workouts...</span>
              ) : (
                <>
                  <Check size={16} />
                  <span>Import {parsedSessions.length} Workouts</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
