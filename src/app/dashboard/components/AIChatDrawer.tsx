"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Sparkles,
  Send,
  X,
  User,
  Users,
  Bot,
  TrendingUp,
  Scale,
  ShieldCheck,
  Zap,
  RotateCcw,
  Copy,
  Check,
  Dumbbell,
  ArrowRight,
  CheckCircle2,
  Calendar,
  Activity,
} from "lucide-react";
import { StrkyrLogo } from "@/components/StrkyrLogo";
import { Client } from "../types";

export interface AIChatAction {
  type: "LOAD_INTO_BUILDER" | "ASSIGN_TO_CLIENT" | "LOG_WORKOUT" | "VIEW_ANATOMY" | "SUBSTITUTE_EXERCISE";
  label: string;
  data: {
    routineName?: string;
    targetClientId?: string;
    targetClientName?: string;
    exercises: Array<{
      name: string;
      category?: string;
      isBodyweight?: boolean;
      sets: Array<{ weight: string | number; reps: string | number; notes?: string }>;
    }>;
    exerciseName?: string;
    suggestedSubstitute?: string;
  };
}

export interface AIChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  role: "TRAINER" | "CLIENT";
  clients?: Client[];
  selectedClient?: Client | null;
  onSelectClient?: (client: Client) => void;
  onLoadRoutineIntoBuilder?: (routine: { routineName: string; exercises: any[] }) => void;
  onAssignRoutine?: (routine: { routineName: string; exercises: any[] }, clientId?: string) => void;
  onViewAnatomy?: (exerciseName: string) => void;
}

interface ChatMessage {
  id: string;
  sender: "user" | "assistant";
  text: string;
  timestamp: string;
  targetName?: string;
  action?: AIChatAction;
  metrics?: {
    totalWorkoutsAnalyzed?: number;
    topLift?: string;
    totalVolume?: string;
  };
}

export function AIChatDrawer({
  isOpen,
  onClose,
  role,
  clients = [],
  selectedClient,
  onSelectClient,
  onLoadRoutineIntoBuilder,
  onAssignRoutine,
  onViewAnatomy,
}: AIChatDrawerProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeClientId, setActiveClientId] = useState<string>(selectedClient?.id || "self");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [executedActionIds, setExecutedActionIds] = useState<Record<string, boolean>>({});

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Sync with selected client prop
  useEffect(() => {
    if (selectedClient) {
      setActiveClientId(selectedClient.id);
    }
  }, [selectedClient?.id]);

  // Initial welcome message
  useEffect(() => {
    if (messages.length === 0) {
      const welcome: ChatMessage = {
        id: "msg-welcome",
        sender: "assistant",
        text:
          role === "TRAINER"
            ? "👋 **Welcome Coach!** I'm your AI Performance Co-Pilot. You can ask me to draft complete workouts (*'Create a 4-day push/pull/legs split'*), analyze any athlete's 1RM progression, check muscular balance ratios, or generate exercise substitutions."
            : "👋 **Welcome!** I'm your personal AI Strength Assistant. Ask me about exercise form cues, your personal PR progression, joint-friendly exercise substitutions, or checking 3D muscle anatomy guides!",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        action:
          role === "TRAINER"
            ? {
                type: "LOAD_INTO_BUILDER",
                label: "⚡ Build New Hypertrophy Workout",
                data: {
                  routineName: "Upper Body Hypertrophy",
                  exercises: [
                    { name: "Barbell Bench Press", category: "STRENGTH", isBodyweight: false, sets: [{ weight: "185", reps: "8", notes: "" }, { weight: "185", reps: "8", notes: "" }] },
                    { name: "Lat Pulldown Machine", category: "STRENGTH", isBodyweight: false, sets: [{ weight: "140", reps: "10", notes: "" }, { weight: "140", reps: "10", notes: "" }] },
                    { name: "Standing Dumbbell Lateral Raise", category: "STRENGTH", isBodyweight: false, sets: [{ weight: "25", reps: "12", notes: "" }, { weight: "25", reps: "12", notes: "" }] },
                  ],
                },
              }
            : undefined,
      };
      setMessages([welcome]);
    }
  }, [role, messages.length]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView?.({ behavior: "smooth" });
  }, [messages, loading]);

  const activeClientName =
    role === "TRAINER"
      ? activeClientId === "self"
        ? "All My Athletes"
        : clients.find((c) => c.id === activeClientId)?.name || "Selected Athlete"
      : "Your Personal History";

  const quickPrompts =
    role === "TRAINER"
      ? [
          "Create a 4-day push-pull-legs routine",
          `How is ${activeClientName}'s bench press progressing?`,
          `Check ${activeClientName} for push/pull muscular imbalances`,
          "Design a lower body power split with squats & RDLs",
        ]
      : [
          "How is my bench press progressing?",
          "What can I substitute if my shoulder hurts on bench press?",
          "Do I have any push/pull volume imbalances?",
          "How do I perform a Barbell Romanian Deadlift?",
        ];

  const handleSendMessage = async (queryText?: string) => {
    const textToSend = queryText || inputValue.trim();
    if (!textToSend || loading) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: "user",
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!queryText) setInputValue("");
    setLoading(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: textToSend,
          clientId: role === "TRAINER" ? activeClientId : undefined,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        const assistantMsg: ChatMessage = {
          id: `msg-${Date.now() + 1}`,
          sender: "assistant",
          text: data.answer,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          targetName: data.target?.name,
          action: data.action || undefined,
          metrics: data.metricsFound,
        };
        setMessages((prev) => [...prev, assistantMsg]);
      } else {
        const errorMsg: ChatMessage = {
          id: `msg-${Date.now() + 1}`,
          sender: "assistant",
          text: `⚠️ **Error:** ${data.error || "Unable to process query."}`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };
        setMessages((prev) => [...prev, errorMsg]);
      }
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        sender: "assistant",
        text: `⚠️ **Network Error:** ${err.message || "Failed to reach AI service."}`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const copyAnswer = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleExecuteAction = (msgId: string, action: AIChatAction) => {
    if (role === "CLIENT" && (action.type === "LOAD_INTO_BUILDER" || action.type === "ASSIGN_TO_CLIENT")) {
      return;
    }
    setExecutedActionIds((prev) => ({ ...prev, [msgId]: true }));

    if (action.type === "LOAD_INTO_BUILDER" || action.type === "LOG_WORKOUT") {
      if (onLoadRoutineIntoBuilder) {
        onLoadRoutineIntoBuilder({
          routineName: action.data.routineName || "AI Generated Workout",
          exercises: action.data.exercises || [],
        });
      }
      onClose();
    } else if (action.type === "ASSIGN_TO_CLIENT") {
      if (onAssignRoutine) {
        onAssignRoutine(
          {
            routineName: action.data.routineName || "AI Generated Workout",
            exercises: action.data.exercises || [],
          },
          action.data.targetClientId || (activeClientId !== "self" ? activeClientId : undefined)
        );
      } else if (onLoadRoutineIntoBuilder) {
        onLoadRoutineIntoBuilder({
          routineName: action.data.routineName || "AI Generated Workout",
          exercises: action.data.exercises || [],
        });
      }
      onClose();
    } else if (action.type === "VIEW_ANATOMY") {
      if (onViewAnatomy && action.data.exerciseName) {
        onViewAnatomy(action.data.exerciseName);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(15, 23, 42, 0.6)",
        backdropFilter: "blur(3px)",
        display: "flex",
        justifyContent: "flex-end",
        zIndex: 9999,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "480px",
          height: "100%",
          backgroundColor: "#ffffff",
          boxShadow: "-10px 0 30px rgba(0, 0, 0, 0.15)",
          display: "flex",
          flexDirection: "column",
          fontFamily: "system-ui, -apple-system, sans-serif",
          animation: "slideInRight 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        {/* Drawer Header */}
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
            <StrkyrLogo size={32} />
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 800, color: "#0f172a" }}>
                  STRKYR Co-Pilot
                </h3>
                <span
                  style={{
                    background: "linear-gradient(135deg, #eff6ff, #dbeafe)",
                    color: "#2563eb",
                    fontSize: "10px",
                    fontWeight: 800,
                    padding: "2px 6px",
                    borderRadius: "4px",
                    border: "1px solid #bfdbfe",
                  }}
                >
                  Action AI
                </span>
              </div>
              <p style={{ margin: "2px 0 0 0", fontSize: "11px", color: "#64748b" }}>
                Interactive Programming &amp; Volume Kinematics
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              color: "#64748b",
              cursor: "pointer",
              padding: "4px",
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Coach Context Selector */}
        {role === "TRAINER" && (
          <div
            style={{
              padding: "10px 16px",
              background: "#eff6ff",
              borderBottom: "1px solid #dbeafe",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <Users size={15} style={{ color: "#2563eb", flexShrink: 0 }} />
            <span style={{ fontSize: "11px", fontWeight: 700, color: "#1e40af" }}>Context:</span>
            <select
              value={activeClientId}
              onChange={(e) => {
                setActiveClientId(e.target.value);
                if (onSelectClient && e.target.value !== "self") {
                  const target = clients.find((c) => c.id === e.target.value);
                  if (target) onSelectClient(target);
                }
              }}
              style={{
                flex: 1,
                padding: "4px 8px",
                borderRadius: "6px",
                border: "1px solid #93c5fd",
                fontSize: "12px",
                fontWeight: 600,
                color: "#0f172a",
                background: "#ffffff",
              }}
            >
              <option value="self">All Assigned Athletes (Studio Overview)</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Message Stream */}
        <div
          style={{
            flex: 1,
            padding: "16px",
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: "14px",
            background: "#ffffff",
          }}
        >
          {messages.map((msg) => {
            const isExecuted = executedActionIds[msg.id];

            return (
              <div
                key={msg.id}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: msg.sender === "user" ? "flex-end" : "flex-start",
                }}
              >
                <div
                  style={{
                    maxWidth: "92%",
                    padding: "12px 14px",
                    borderRadius: msg.sender === "user" ? "16px 16px 2px 16px" : "16px 16px 16px 2px",
                    background: msg.sender === "user" ? "#2563eb" : "#f1f5f9",
                    color: msg.sender === "user" ? "#ffffff" : "#1e293b",
                    fontSize: "13px",
                    lineHeight: "1.5",
                    boxShadow: msg.sender === "user" ? "0 2px 6px rgba(37,99,235,0.25)" : "none",
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {msg.text}

                  {/* 1-Click Interactive Action Card */}
                  {msg.action && !(role === "CLIENT" && (msg.action.type === "LOAD_INTO_BUILDER" || msg.action.type === "ASSIGN_TO_CLIENT")) && (
                    <div
                      style={{
                        marginTop: "12px",
                        background: "#ffffff",
                        border: "1.5px solid #2563eb",
                        borderRadius: "10px",
                        padding: "10px 12px",
                        boxShadow: "0 2px 8px rgba(37,99,235,0.12)",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "11px",
                          fontWeight: 800,
                          color: "#2563eb",
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                          marginBottom: "6px",
                          display: "flex",
                          alignItems: "center",
                          gap: "5px",
                        }}
                      >
                        <Zap size={13} />
                        <span>1-Click Action Available</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleExecuteAction(msg.id, msg.action!)}
                        disabled={isExecuted}
                        style={{
                          width: "100%",
                          padding: "8px 12px",
                          borderRadius: "8px",
                          background: isExecuted
                            ? "#dcfce7"
                            : "linear-gradient(135deg, #2563eb, #1d4ed8)",
                          color: isExecuted ? "#166534" : "#ffffff",
                          border: isExecuted ? "1px solid #86efac" : "none",
                          fontWeight: 800,
                          fontSize: "12px",
                          cursor: isExecuted ? "default" : "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "6px",
                          boxShadow: isExecuted ? "none" : "0 2px 6px rgba(37,99,235,0.25)",
                          transition: "all 0.15s ease",
                        }}
                      >
                        {isExecuted ? (
                          <>
                            <CheckCircle2 size={14} />
                            <span>Action Applied Successfully</span>
                          </>
                        ) : (
                          <>
                            <span>{msg.action.label}</span>
                            <ArrowRight size={14} />
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {/* Metrics Footer for Assistant Responses */}
                  {msg.metrics && msg.metrics.totalVolume && (
                    <div
                      style={{
                        marginTop: "8px",
                        paddingTop: "8px",
                        borderTop: "1px solid #cbd5e1",
                        fontSize: "11px",
                        color: "#475569",
                        display: "flex",
                        justifyContent: "space-between",
                        gap: "8px",
                      }}
                    >
                      <span>📊 {msg.metrics.totalWorkoutsAnalyzed} sessions analyzed</span>
                      <span>🏋️ {msg.metrics.totalVolume} volume</span>
                    </div>
                  )}
                </div>

                {/* Timestamp & Copy Action */}
                <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "4px", padding: "0 4px" }}>
                  <span style={{ fontSize: "10px", color: "#94a3b8" }}>{msg.timestamp}</span>
                  {msg.sender === "assistant" && (
                    <button
                      type="button"
                      onClick={() => copyAnswer(msg.id, msg.text)}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#64748b",
                        fontSize: "10px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "3px",
                      }}
                      title="Copy response"
                    >
                      {copiedId === msg.id ? (
                        <>
                          <Check size={11} style={{ color: "#16a34a" }} />
                          <span style={{ color: "#16a34a" }}>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy size={11} />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {loading && (
            <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#64748b", fontSize: "12px", padding: "8px 12px" }}>
              <Sparkles size={16} className="animate-spin" style={{ color: "#2563eb" }} />
              <span>Analyzing volume kinematics &amp; drafting routines...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Prompts */}
        <div
          style={{
            padding: "10px 16px",
            borderTop: "1px solid #f1f5f9",
            background: "#f8fafc",
            display: "flex",
            gap: "6px",
            overflowX: "auto",
            whiteSpace: "nowrap",
          }}
        >
          {quickPrompts.map((prompt, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSendMessage(prompt)}
              disabled={loading}
              style={{
                fontSize: "11px",
                fontWeight: 600,
                padding: "6px 10px",
                borderRadius: "20px",
                border: "1px solid #cbd5e1",
                background: "#ffffff",
                color: "#334155",
                cursor: "pointer",
                flexShrink: 0,
                transition: "all 0.15s ease",
              }}
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          style={{
            padding: "12px 16px",
            borderTop: "1px solid #e2e8f0",
            background: "#ffffff",
            display: "flex",
            gap: "8px",
          }}
        >
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={
              role === "TRAINER"
                ? `Ask about ${activeClientName} or create a routine...`
                : "Ask about your workouts, bench progression, or routines..."
            }
            disabled={loading}
            style={{
              flex: 1,
              padding: "10px 14px",
              borderRadius: "10px",
              border: "1px solid #cbd5e1",
              fontSize: "13px",
              outline: "none",
            }}
          />
          <button
            type="submit"
            disabled={loading || !inputValue.trim()}
            style={{
              padding: "10px 16px",
              borderRadius: "10px",
              background: "#2563eb",
              color: "#ffffff",
              border: "none",
              fontWeight: 700,
              cursor: loading || !inputValue.trim() ? "not-allowed" : "pointer",
              opacity: loading || !inputValue.trim() ? 0.6 : 1,
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            <Send size={15} />
          </button>
        </form>
      </div>
    </div>
  );
}

export default AIChatDrawer;
