"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Timer, Play, Pause, RotateCcw, Plus, X, Volume2, VolumeX,
  Minimize2, Maximize2, Settings, Music, Check, ArrowLeft,
  ChevronRight, Clock, Sparkles, BellOff, AlertTriangle, Flame,
  CheckCircle2
} from "lucide-react";

import {
  playTimerSound,
  startAlarmLoop,
  stopAlarmLoop,
  prewarmAudio,
  TIMER_SOUND_OPTIONS,
  TimerSoundId
} from "@/lib/soundAlert";

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
  const [isAlarmRinging, setIsAlarmRinging] = useState(false);

  // Custom Time Input State
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customMinutes, setCustomMinutes] = useState(Math.floor(initialSeconds / 60) || 1);
  const [customSeconds, setCustomSeconds] = useState(initialSeconds % 60 || 30);

  // Sound Picker State
  const [showSoundPicker, setShowSoundPicker] = useState(false);
  const [selectedSound, setSelectedSound] = useState<TimerSoundId>("air_horn");
  const [playingPreview, setPlayingPreview] = useState<string | null>(null);

  // Stop alarm loop on unmount
  useEffect(() => {
    return () => {
      stopAlarmLoop();
    };
  }, []);

  // Load saved sound preference
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("strkyr_timer_sound") as TimerSoundId;
      if (saved && TIMER_SOUND_OPTIONS.some((o) => o.id === saved)) {
        setSelectedSound(saved);
      }
      const savedMute = localStorage.getItem("strkyr_timer_muted");
      if (savedMute === "true") {
        setSoundEnabled(false);
      }
    }
  }, []);

  const dismissAlarm = useCallback(() => {
    stopAlarmLoop();
    setIsAlarmRinging(false);
  }, []);

  const handleSelectSound = (soundId: TimerSoundId) => {
    setSelectedSound(soundId);
    if (typeof window !== "undefined") {
      localStorage.setItem("strkyr_timer_sound", soundId);
    }
    prewarmAudio();
    stopAlarmLoop();
    setPlayingPreview(soundId);
    playTimerSound(soundId);
    setTimeout(() => setPlayingPreview(null), 1000);
  };

  const handleToggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    if (typeof window !== "undefined") {
      localStorage.setItem("strkyr_timer_muted", String(!next));
    }
    if (next) {
      prewarmAudio();
    } else {
      dismissAlarm();
    }
  };

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isRunning && secondsRemaining > 0) {
      interval = setInterval(() => {
        setSecondsRemaining((prev) => prev - 1);
      }, 1000);
    } else if (secondsRemaining === 0 && isRunning) {
      setIsRunning(false);
      setIsAlarmRinging(true);
      if (soundEnabled) {
        // Start repeating alarm loop every 1.5s until dismissed
        startAlarmLoop(selectedSound, 1500);
      }
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, secondsRemaining, soundEnabled, selectedSound]);

  const startPreset = (secs: number) => {
    prewarmAudio();
    dismissAlarm();
    setTotalSeconds(secs);
    setSecondsRemaining(secs);
    setIsRunning(true);
    setShowCustomModal(false);
  };

  const handleApplyCustomTime = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    dismissAlarm();
    const mins = Math.max(0, Math.min(customMinutes, 60));
    const secs = Math.max(0, Math.min(customSeconds, 59));
    const total = mins * 60 + secs;
    if (total > 0) {
      startPreset(total);
    }
  };

  const adjustCustom = (deltaSecs: number) => {
    let total = customMinutes * 60 + customSeconds + deltaSecs;
    if (total < 5) total = 5;
    if (total > 3600) total = 3600;
    setCustomMinutes(Math.floor(total / 60));
    setCustomSeconds(total % 60);
  };

  const add30Seconds = () => {
    prewarmAudio();
    dismissAlarm();
    setTotalSeconds((prev) => prev + 30);
    setSecondsRemaining((prev) => prev + 30);
    setIsRunning(true);
  };

  const resetTimer = () => {
    prewarmAudio();
    dismissAlarm();
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
        onClick={() => {
          setIsMinimized(false);
          if (isAlarmRinging) {
            dismissAlarm();
          }
        }}
        style={{
          position: "fixed",
          bottom: "20px",
          right: "20px",
          background: isAlarmRinging ? "#dc2626" : secondsRemaining === 0 ? "#16a34a" : "#0f172a",
          color: "#ffffff",
          padding: "8px 14px",
          borderRadius: "30px",
          boxShadow: isAlarmRinging ? "0 0 20px rgba(220, 38, 38, 0.6)" : "0 10px 25px -5px rgba(0,0,0,0.3)",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          cursor: "pointer",
          zIndex: 9999,
          fontSize: "13px",
          fontWeight: 700,
          border: `2px solid ${isAlarmRinging ? "#f87171" : "#2563eb"}`,
          animation: isAlarmRinging ? "pulse 1s infinite" : "none",
          transition: "transform 0.15s ease",
        }}
      >
        <Timer size={16} className={isRunning ? "spin-pulse" : ""} />
        <span>{isAlarmRinging ? "🚨 REST OVER! Tap to Dismiss" : formatTime(secondsRemaining)}</span>
        <Maximize2 size={13} style={{ color: "#ffffff" }} />
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
        border: `2px solid ${isAlarmRinging ? "#ef4444" : "#e2e8f0"}`,
        boxShadow: isAlarmRinging
          ? "0 0 30px rgba(239, 68, 68, 0.35), 0 20px 30px -10px rgba(0,0,0,0.25)"
          : "0 20px 30px -10px rgba(0,0,0,0.18)",
        width: "320px",
        zIndex: 9999,
        overflow: "hidden",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      {/* Header */}
      <div
        style={{
          background: isAlarmRinging
            ? "linear-gradient(90deg, #dc2626 0%, #b91c1c 100%)"
            : secondsRemaining === 0
            ? "#16a34a"
            : "linear-gradient(90deg, #1e3a8a 0%, #2563eb 100%)",
          color: "#ffffff",
          padding: "10px 14px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", fontWeight: 700 }}>
          <Timer size={15} />
          <span>
            {isAlarmRinging
              ? "🚨 REST OVER! TIME FOR NEXT SET"
              : showSoundPicker
              ? "Harsh Ring Tone Settings"
              : showCustomModal
              ? "Custom Rest Timer"
              : secondsRemaining === 0
              ? "Rest Complete"
              : "Rest Timer"}
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          {/* Sound Tone Picker Icon */}
          <button
            type="button"
            onClick={() => {
              setShowSoundPicker(!showSoundPicker);
              setShowCustomModal(false);
            }}
            style={{
              background: showSoundPicker ? "rgba(255,255,255,0.25)" : "none",
              border: "none",
              color: "#ffffff",
              cursor: "pointer",
              padding: "3px 5px",
              borderRadius: "4px",
            }}
            title="Choose alarm sound"
          >
            <Music size={14} />
          </button>

          {/* Sound Mute Toggle */}
          <button
            type="button"
            onClick={handleToggleSound}
            style={{ background: "none", border: "none", color: "#ffffff", cursor: "pointer", padding: "2px" }}
            title={soundEnabled ? "Mute alarm" : "Enable alarm"}
          >
            {soundEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
          </button>

          {/* Minimize */}
          <button
            type="button"
            onClick={() => setIsMinimized(true)}
            style={{ background: "none", border: "none", color: "#ffffff", cursor: "pointer", padding: "2px" }}
            title="Minimize timer"
          >
            <Minimize2 size={14} />
          </button>

          {/* Close */}
          {onClose && (
            <button
              type="button"
              onClick={() => {
                dismissAlarm();
                onClose();
              }}
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
            background: isAlarmRinging ? "#dc2626" : secondsRemaining === 0 ? "#16a34a" : "#2563eb",
            transition: "width 0.5s ease",
          }}
        />
      </div>

      {/* VIEW 1: SOUND PICKER DRAWER */}
      {showSoundPicker && (
        <div style={{ padding: "14px", maxHeight: "290px", overflowY: "auto", background: "#f8fafc" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
            <span style={{ fontSize: "11px", fontWeight: 700, color: "#475569", textTransform: "uppercase" }}>
              Select Harsh Alarm Tone
            </span>
            <button
              onClick={() => setShowSoundPicker(false)}
              style={{ fontSize: "11px", background: "none", border: "none", color: "#2563eb", fontWeight: 600, cursor: "pointer" }}
            >
              Done
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {TIMER_SOUND_OPTIONS.map((sound) => {
              const isCurrent = selectedSound === sound.id;
              const isPlaying = playingPreview === sound.id;

              return (
                <div
                  key={sound.id}
                  onClick={() => handleSelectSound(sound.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "8px 10px",
                    background: isCurrent ? "#fef2f2" : "#ffffff",
                    border: `1px solid ${isCurrent ? "#f87171" : "#e2e8f0"}`,
                    borderRadius: "8px",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "16px" }}>{sound.icon}</span>
                    <div>
                      <div style={{ fontSize: "12px", fontWeight: 700, color: isCurrent ? "#991b1b" : "#0f172a" }}>
                        {sound.name}
                      </div>
                      <div style={{ fontSize: "10px", color: "#64748b" }}>{sound.description}</div>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectSound(sound.id);
                      }}
                      style={{
                        padding: "3px 7px",
                        fontSize: "10px",
                        fontWeight: 700,
                        background: isPlaying ? "#dc2626" : "#f1f5f9",
                        color: isPlaying ? "#ffffff" : "#475569",
                        border: "1px solid #cbd5e1",
                        borderRadius: "4px",
                        cursor: "pointer",
                      }}
                      title="Preview Alarm"
                    >
                      {isPlaying ? "▶ Blasting" : "▶ Test"}
                    </button>
                    {isCurrent && <Check size={14} style={{ color: "#dc2626" }} />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW 2: CUSTOM TIME INPUT DRAWER */}
      {showCustomModal && !showSoundPicker && (
        <form onSubmit={handleApplyCustomTime} style={{ padding: "16px", background: "#f8fafc" }}>
          <div style={{ fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "12px", textAlign: "center" }}>
            Set Custom Rest Duration
          </div>

          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
            {/* Minutes Input */}
            <div style={{ textAlign: "center" }}>
              <input
                type="number"
                min="0"
                max="60"
                value={customMinutes}
                onChange={(e) => setCustomMinutes(Math.max(0, parseInt(e.target.value) || 0))}
                style={{
                  width: "65px",
                  fontSize: "24px",
                  fontWeight: 800,
                  textAlign: "center",
                  padding: "6px",
                  borderRadius: "8px",
                  border: "2px solid #cbd5e1",
                  background: "#ffffff",
                  color: "#0f172a",
                }}
              />
              <div style={{ fontSize: "11px", color: "#64748b", marginTop: "4px", fontWeight: 600 }}>Minutes</div>
            </div>

            <span style={{ fontSize: "24px", fontWeight: 800, color: "#94a3b8", paddingBottom: "16px" }}>:</span>

            {/* Seconds Input */}
            <div style={{ textAlign: "center" }}>
              <input
                type="number"
                min="0"
                max="59"
                value={customSeconds}
                onChange={(e) => setCustomSeconds(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                style={{
                  width: "65px",
                  fontSize: "24px",
                  fontWeight: 800,
                  textAlign: "center",
                  padding: "6px",
                  borderRadius: "8px",
                  border: "2px solid #cbd5e1",
                  background: "#ffffff",
                  color: "#0f172a",
                }}
              />
              <div style={{ fontSize: "11px", color: "#64748b", marginTop: "4px", fontWeight: 600 }}>Seconds</div>
            </div>
          </div>

          {/* Quick Stepper Buttons */}
          <div style={{ display: "flex", gap: "6px", justifyContent: "center", marginBottom: "14px" }}>
            <button
              type="button"
              onClick={() => adjustCustom(-15)}
              style={{ fontSize: "10px", padding: "4px 8px", background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "6px", cursor: "pointer", fontWeight: 600 }}
            >
              -15s
            </button>
            <button
              type="button"
              onClick={() => adjustCustom(15)}
              style={{ fontSize: "10px", padding: "4px 8px", background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "6px", cursor: "pointer", fontWeight: 600 }}
            >
              +15s
            </button>
            <button
              type="button"
              onClick={() => adjustCustom(30)}
              style={{ fontSize: "10px", padding: "4px 8px", background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "6px", cursor: "pointer", fontWeight: 600 }}
            >
              +30s
            </button>
            <button
              type="button"
              onClick={() => adjustCustom(60)}
              style={{ fontSize: "10px", padding: "4px 8px", background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "6px", cursor: "pointer", fontWeight: 600 }}
            >
              +1m
            </button>
          </div>

          {/* Action Buttons */}
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              type="button"
              onClick={() => setShowCustomModal(false)}
              style={{
                flex: 1,
                padding: "8px",
                fontSize: "12px",
                fontWeight: 600,
                background: "#f1f5f9",
                border: "1px solid #cbd5e1",
                borderRadius: "8px",
                cursor: "pointer",
                color: "#475569",
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                flex: 2,
                padding: "8px",
                fontSize: "12px",
                fontWeight: 700,
                background: "#2563eb",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                color: "#ffffff",
                boxShadow: "0 1px 3px rgba(37,99,235,0.3)",
              }}
            >
              Start Custom ({customMinutes}m {customSeconds}s)
            </button>
          </div>
        </form>
      )}

      {/* VIEW 3: MAIN COUNTDOWN DISPLAY */}
      {!showCustomModal && !showSoundPicker && (
        <div style={{ padding: "16px", textAlign: "center" }}>
          {/* Big Alarm Dismiss Banner when Alarm is Ringing */}
          {isAlarmRinging ? (
            <div style={{ marginBottom: "14px" }}>
              <div
                style={{
                  fontSize: "36px",
                  fontWeight: 900,
                  color: "#dc2626",
                  margin: "0 0 10px 0",
                  letterSpacing: "-0.5px",
                }}
              >
                0:00
              </div>

              <button
                type="button"
                onClick={dismissAlarm}
                style={{
                  width: "100%",
                  padding: "12px",
                  background: "#dc2626",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "10px",
                  fontSize: "14px",
                  fontWeight: 800,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  boxShadow: "0 4px 14px rgba(220, 38, 38, 0.4)",
                  animation: "pulse 1.2s infinite",
                }}
              >
                <BellOff size={18} />
                <span>DISMISS ALARM (READY)</span>
              </button>
            </div>
          ) : (
            <div
              style={{
                fontSize: "44px",
                fontWeight: 800,
                fontVariantNumeric: "tabular-nums",
                color: secondsRemaining === 0 ? "#16a34a" : "#0f172a",
                margin: "2px 0 10px 0",
                letterSpacing: "-0.5px",
              }}
            >
              {formatTime(secondsRemaining)}
            </div>
          )}

          {/* Current Ring Tone Badge */}
          {!isAlarmRinging && (
            <div style={{ marginBottom: "12px" }}>
              <button
                type="button"
                onClick={() => setShowSoundPicker(true)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "5px",
                  background: "#f1f5f9",
                  border: "1px solid #e2e8f0",
                  borderRadius: "20px",
                  padding: "2px 10px",
                  fontSize: "11px",
                  color: "#475569",
                  cursor: "pointer",
                  fontWeight: 600,
                }}
                title="Click to change alarm tone"
              >
                <span>{TIMER_SOUND_OPTIONS.find((s) => s.id === selectedSound)?.icon}</span>
                <span>Tone: {TIMER_SOUND_OPTIONS.find((s) => s.id === selectedSound)?.name}</span>
              </button>
            </div>
          )}

          {/* Play / Pause / Reset / +30s Actions */}
          <div style={{ display: "flex", gap: "8px", justifyContent: "center", marginBottom: "14px" }}>
            <button
              type="button"
              onClick={() => {
                prewarmAudio();
                dismissAlarm();
                setIsRunning(!isRunning);
              }}
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

          {/* Presets Row + Custom Button */}
          <div style={{ display: "flex", gap: "5px", justifyContent: "center", flexWrap: "wrap" }}>
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
                  padding: "4px 7px",
                  fontSize: "11px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                {secs >= 60 ? `${secs / 60}m` : `${secs}s`}
              </button>
            ))}

            {/* Custom Input Button */}
            <button
              type="button"
              onClick={() => {
                dismissAlarm();
                setShowCustomModal(true);
                setShowSoundPicker(false);
              }}
              style={{
                background: "#f0f9ff",
                border: "1px solid #bae6fd",
                color: "#0284c7",
                borderRadius: "6px",
                padding: "4px 8px",
                fontSize: "11px",
                fontWeight: 700,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "3px",
              }}
              title="Enter custom rest time"
            >
              <Clock size={11} />
              <span>Custom</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default RestTimer;