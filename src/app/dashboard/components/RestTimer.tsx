"use client";

import React, { useState, useEffect, useRef } from "react";
import { Timer, Play, Pause, RotateCcw, Plus, X, Volume2, VolumeX, Minimize2, Maximize2 } from "lucide-react";

export interface RestTimerProps {
  initialSeconds?: number;
  onClose?: () => void;
}

export function RestTimer({ initialSeconds = 90, onClose }: RestTimerProps) {
  const [totalSeconds, setTotalSeconds] = useState(initialSeconds);
  const [secondsRemaining, setSecondsRemaining] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isRunning && secondsRemaining > 0) {
      interval = setInterval(() => {
        setSecondsRemaining((prev) => prev - 1);
      }, 1000);
    } else if (secondsRemaining === 0 && isRunning) {
      setIsRunning(false);
      playChime();
      if ("vibrate" in navigator) {
        try {
          navigator.vibrate([200, 100, 200]);
        } catch {}
      }
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, secondsRemaining]);

  const playChime = () => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!audioContextRef.current && AudioCtx) {
        audioContextRef.current = new AudioCtx();
      }
      const ctx = audioContextRef.current;
      if (ctx && ctx.state === "suspended") {
        ctx.resume();
      }
      if (ctx) {
        // Play gentle double bell chime
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(587.33, now); // D5
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.15); // A5
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.6);
      }
    } catch (e) {
      console.error("Audio chime error:", e);
    }
  };

  const startPreset = (secs: number) => {
    setTotalSeconds(secs);
    setSecondsRemaining(secs);
    setIsRunning(true);
  };

  const add30Seconds = () => {
    setTotalSeconds((prev) => prev + 30);
    setSecondsRemaining((prev) => prev + 30);
    setIsRunning(true);
  };

  const resetTimer = () => {
    setSecondsRemaining(totalSeconds);
    setIsRunning(false);
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins}:${remainder < 10 ? "0" : ""}${remainder}`;
  };

  const progressPct = totalSeconds > 0 ? ((totalSeconds - secondsRemaining) / totalSeconds) * 100 : 0;

  if (isMinimized) {
    return (
      <div
        onClick={() => setIsMinimized(false)}
        style={{
          position: "fixed",
          bottom: "20px",
          right: "20px",
          background: secondsRemaining === 0 ? "#16a34a" : "#0f172a",
          color: "#ffffff",
          padding: "8px 14px",
          borderRadius: "30px",
          boxShadow: "0 10px 25px -5px rgba(0,0,0,0.3)",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          cursor: "pointer",
          zIndex: 9999,
          fontSize: "13px",
          fontWeight: 700,
          border: "2px solid #2563eb",
        }}
      >
        <Timer size={16} className={isRunning ? "spin-pulse" : ""} />
        <span>{secondsRemaining === 0 ? "Rest Over!" : formatTime(secondsRemaining)}</span>
        <Maximize2 size={13} style={{ color: "#94a3b8" }} />
      </div>
    );
  }

  return (
    <div
      style={{
        position: "fixed",
        bottom: "24px",
        right: "24px",
        background: "#ffffff",
        borderRadius: "16px",
        border: "1px solid #e2e8f0",
        boxShadow: "0 20px 30px -10px rgba(0,0,0,0.18)",
        width: "300px",
        zIndex: 9999,
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          background: secondsRemaining === 0 ? "#16a34a" : "linear-gradient(90deg, #1e3a8a 0%, #2563eb 100%)",
          color: "#ffffff",
          padding: "10px 14px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", fontWeight: 700 }}>
          <Timer size={15} />
          <span>{secondsRemaining === 0 ? "Rest Complete! Ready for next set" : "Rest Timer"}</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <button
            type="button"
            onClick={() => setSoundEnabled(!soundEnabled)}
            style={{ background: "none", border: "none", color: "#ffffff", cursor: "pointer", padding: "2px" }}
            title={soundEnabled ? "Mute chime" : "Enable chime"}
          >
            {soundEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
          </button>
          <button
            type="button"
            onClick={() => setIsMinimized(true)}
            style={{ background: "none", border: "none", color: "#ffffff", cursor: "pointer", padding: "2px" }}
            title="Minimize timer"
          >
            <Minimize2 size={14} />
          </button>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              style={{ background: "none", border: "none", color: "#ffffff", cursor: "pointer", padding: "2px" }}
              title="Close timer"
            >
              <X size={15} />
            </button>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div style={{ width: "100%", height: "4px", background: "#e2e8f0" }}>
        <div
          style={{
            height: "100%",
            width: `${progressPct}%`,
            background: secondsRemaining === 0 ? "#16a34a" : "#2563eb",
            transition: "width 0.5s ease",
          }}
        />
      </div>

      {/* Main Display */}
      <div style={{ padding: "16px", textAlign: "center" }}>
        <div
          style={{
            fontSize: "42px",
            fontWeight: 800,
            fontVariantNumeric: "tabular-nums",
            color: secondsRemaining === 0 ? "#16a34a" : "#0f172a",
            margin: "4px 0 12px 0",
          }}
        >
          {formatTime(secondsRemaining)}
        </div>

        {/* Play / Pause / Reset / +30s Actions */}
        <div style={{ display: "flex", gap: "8px", justifyContent: "center", marginBottom: "16px" }}>
          <button
            type="button"
            onClick={() => setIsRunning(!isRunning)}
            className="btn-primary"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 16px",
              fontSize: "12px",
              borderRadius: "8px",
            }}
          >
            {isRunning ? (
              <>
                <Pause size={14} />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play size={14} />
                <span>Resume</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={add30Seconds}
            className="btn-secondary"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              padding: "8px 12px",
              fontSize: "12px",
              borderRadius: "8px",
            }}
            title="Add 30 seconds"
          >
            <Plus size={13} />
            <span>+30s</span>
          </button>

          <button
            type="button"
            onClick={resetTimer}
            className="btn-secondary"
            style={{
              display: "inline-flex",
              alignItems: "center",
              padding: "8px 10px",
              fontSize: "12px",
              borderRadius: "8px",
            }}
            title="Reset to start"
          >
            <RotateCcw size={14} />
          </button>
        </div>

        {/* Presets Row */}
        <div style={{ display: "flex", gap: "6px", justifyContent: "center" }}>
          {[30, 60, 90, 120, 180].map((secs) => (
            <button
              key={secs}
              type="button"
              onClick={() => startPreset(secs)}
              style={{
                background: totalSeconds === secs && secondsRemaining > 0 ? "#eff6ff" : "#f8fafc",
                border: totalSeconds === secs && secondsRemaining > 0 ? "1px solid #2563eb" : "1px solid #e2e8f0",
                color: totalSeconds === secs && secondsRemaining > 0 ? "#2563eb" : "#475569",
                borderRadius: "6px",
                padding: "4px 8px",
                fontSize: "11px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {secs >= 60 ? `${secs / 60}m` : `${secs}s`}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default RestTimer;