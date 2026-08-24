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
} from "lucide-react";
import { StrkyrLogo } from "@/components/StrkyrLogo";
import { Client } from "../types";

export interface AIChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  role: "TRAINER" | "CLIENT";
  clients?: Client[];
  selectedClient?: Client | null;
  onSelectClient?: (client: Client) => void;
}

interface ChatMessage {
  id: string;
  sender: "user" | "assistant";
  text: string;
  timestamp: string;
  targetName?: string;
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
}: AIChatDrawerProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeClientId, setActiveClientId] = useState<string>(selectedClient?.id || "self");
  const [copiedId, setCopiedId] = useState<string | null>(null);

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
            ? "👋 **Welcome Coach!** I'm your AI Performance Co-Pilot. You can ask me to analyze any of your athletes' workout logs, track 1RM progression, diagnose push/pull muscular imbalances, or draft exercise substitutions."
            : "👋 **Welcome!** I'm your personal AI Strength Assistant. Ask me about your past workout logs, personal records, bench/squat progression, or safe exercise substitutions!",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
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
          `How is ${activeClientName}'s bench press progressing?`,
          `Check ${activeClientName} for push/pull muscular imbalances`,
          `Summarize ${activeClientName}'s training history and top lifts`,
          `What are safe exercise substitutions for heavy squats?`,
        ]
      : [
          "How is my bench press progressing?",
          "Do I have any push/pull volume imbalances?",
          "Summarize my recent workouts and total volume",
          "What can I substitute if my shoulder hurts on bench press?",
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
          maxWidth: "460px",
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
                  AI Performance Assistant
                </h3>
                <span style={{ fontSize: "10px", fontWeight: 700, color: "#2563eb", background: "#eff6ff", padding: "2px 6px", borderRadius: "4px" }}>
                  v2.0
                </span>
              </div>
              <span style={{ fontSize: "11px", color: "#64748b" }}>
                {role === "TRAINER" ? "Scoped to your assigned athletes" : "Scoped to your personal training logs"}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              color: "#64748b",
              cursor: "pointer",
              padding: "6px",
              borderRadius: "6px",
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Athlete Context Selector (For Trainers) */}
        {role === "TRAINER" && (
          <div
            style={{
              padding: "10px 16px",
              background: "#eff6ff",
              borderBottom: "1px solid #bfdbfe",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <Users size={16} style={{ color: "#2563eb", flexShrink: 0 }} />
            <span style={{ fontSize: "12px", fontWeight: 700, color: "#1e3a8a" }}>Target Athlete:</span>
            <select
              value={activeClientId}
              onChange={(e) => {
                setActiveClientId(e.target.value);
                const found = clients.find((c) => c.id === e.target.value);
                if (found && onSelectClient) onSelectClient(found);
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
          {messages.map((msg) => (
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
                  maxWidth: "90%",
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
                    onClick={() => copyAnswer(msg.id, msg.text)}
                    style={{
                      background: "transparent",
                      border: "none",
                      color: copiedId === msg.id ? "#16a34a" : "#94a3b8",
                      cursor: "pointer",
                      fontSize: "10px",
                      display: "flex",
                      alignItems: "center",
                      gap: "2px",
                      padding: "2px",
                    }}
                    title="Copy response"
                  >
                    {copiedId === msg.id ? <Check size={10} /> : <Copy size={10} />}
                    <span>{copiedId === msg.id ? "Copied" : "Copy"}</span>
                  </button>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#2563eb", fontSize: "12px", fontWeight: 600, padding: "8px 12px", background: "#eff6ff", borderRadius: "10px", width: "fit-content" }}>
              <Sparkles size={14} className="animate-spin" />
              <span>Analyzing workout telemetry &amp; kinematics...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggested Prompt Chips */}
        <div
          style={{
            padding: "8px 14px",
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
              onClick={() => handleSendMessage(prompt)}
              disabled={loading}
              style={{
                fontSize: "11px",
                fontWeight: 600,
                color: "#2563eb",
                background: "#ffffff",
                border: "1px solid #bfdbfe",
                borderRadius: "14px",
                padding: "4px 10px",
                cursor: "pointer",
                flexShrink: 0,
                boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
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
            padding: "14px 16px",
            borderTop: "1px solid #e2e8f0",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            background: "#ffffff",
          }}
        >
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={role === "TRAINER" ? `Ask about ${activeClientName}'s lifts...` : "Ask about your lifts or exercise science..."}
            disabled={loading}
            style={{
              flex: 1,
              padding: "10px 14px",
              borderRadius: "10px",
              border: "1px solid #cbd5e1",
              fontSize: "13px",
              outline: "none",
              boxSizing: "border-box",
            }}
          />
          <button
            type="submit"
            disabled={loading || !inputValue.trim()}
            style={{
              padding: "10px 14px",
              borderRadius: "10px",
              background: loading || !inputValue.trim() ? "#cbd5e1" : "#2563eb",
              color: "#ffffff",
              border: "none",
              cursor: loading || !inputValue.trim() ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.15s ease",
            }}
          >
            <Send size={16} />
          </button>
        </form>
      </div>
    </div>
  );
}

export default AIChatDrawer;
