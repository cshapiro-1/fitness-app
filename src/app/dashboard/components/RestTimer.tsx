"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Clock3 } from "lucide-react";
import { REST_PRESETS } from "../constants";
import { formatClock, formatRestLabel } from "../utils/formatters";
import { playTimerDing } from "../utils/audio";

export function RestTimer() {
  const [restSecondsRemaining, setRestSecondsRemaining] = useState(0);
  const [restTimerActive, setRestTimerActive] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);

  const ensureAudioContext = useCallback(async () => {
    try {
      if (typeof window === "undefined") return null;
      if (!audioContextRef.current) {
        const Ctx = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!Ctx) return null;
        audioContextRef.current = new Ctx();
      }
      if (audioContextRef.current.state === "suspended") {
        await audioContextRef.current.resume();
      }
      return audioContextRef.current;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    if (!restTimerActive) return;
    const timer = window.setInterval(() => {
      setRestSecondsRemaining((current) => {
        if (current <= 1) {
          window.clearInterval(timer);
          setRestTimerActive(false);
          playTimerDing(audioContextRef.current);
          return 0;
        }
        return current - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [restTimerActive]);

  useEffect(() => {
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => undefined);
        audioContextRef.current = null;
      }
    };
  }, []);

  return (
    <div className="rest-timer-card">
      <div className="section-title rest-title">
        <Clock3 size={16} />
        Rest Timer
      </div>
      <div className="rest-controls">
        {REST_PRESETS.map((seconds) => (
          <button
            key={seconds}
            className="tab"
            onClick={() => {
              ensureAudioContext().catch(() => null);
              setRestSecondsRemaining(seconds);
              setRestTimerActive(true);
            }}
          >
            {formatRestLabel(seconds)}
          </button>
        ))}
      </div>
      <div className="rest-status">{restTimerActive ? `Rest: ${formatClock(restSecondsRemaining)}` : "Ready"}</div>
      <div className="rest-actions">
        <button className="btn-primary" onClick={() => {
          ensureAudioContext().catch(() => null);
          setRestTimerActive((current) => !current);
        }}>
          {restTimerActive ? "Pause" : "Resume"}
        </button>
        <button className="btn-ghost-danger" onClick={() => { setRestTimerActive(false); setRestSecondsRemaining(0); }}>
          Reset Timer
        </button>
      </div>
    </div>
  );
}