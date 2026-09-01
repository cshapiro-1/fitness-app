"use client";

import React, { useEffect, useState } from "react";
import { Play, CheckCircle2, Dumbbell, Clock } from "lucide-react";

export interface LiveWorkoutBannerProps {
  workoutId?: string;
  workoutTitle?: string;
  startedAt?: string | null;
  startedByName?: string | null;
  exerciseCount?: number;
  completedSetCount?: number;
  totalSetCount?: number;
  isCoachView?: boolean;
  athleteName?: string;
  onResume: () => void;
  onComplete: () => void;
  isCompleting?: boolean;
}

export function LiveWorkoutBanner({
  workoutId,
  workoutTitle = "Active Workout",
  startedAt,
  startedByName,
  exerciseCount = 0,
  completedSetCount = 0,
  totalSetCount = 0,
  isCoachView = false,
  athleteName,
  onResume,
  onComplete,
  isCompleting = false,
}: LiveWorkoutBannerProps) {
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);

  useEffect(() => {
    const startTime = startedAt ? new Date(startedAt).getTime() : Date.now();
    const updateElapsed = () => {
      const diff = Math.max(0, Math.floor((Date.now() - startTime) / 1000));
      setElapsedSeconds(diff);
    };
    updateElapsed();
    const interval = setInterval(updateElapsed, 1000);
    return () => clearInterval(interval);
  }, [startedAt]);

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <div
      style={{
        background: "linear-gradient(90deg, #1e3a8a 0%, #1e40af 50%, #2563eb 100%)",
        color: "#ffffff",
        padding: "10px 16px",
        borderRadius: "14px",
        marginBottom: "16px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "12px",
        flexWrap: "wrap",
        boxShadow: "0 10px 25px -5px rgba(30, 58, 138, 0.3), 0 4px 10px -2px rgba(30, 58, 138, 0.2)",
        border: "1px solid rgba(255, 255, 255, 0.15)",
      }}
      className="live-workout-banner"
    >
      {/* Left: Pulsing Live Badge + Details */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0, flex: 1 }}>
        {/* Pulsing indicator */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
          <span
            style={{
              width: "10px",
              height: "10px",
              borderRadius: "50%",
              backgroundColor: "#22c55e",
              display: "inline-block",
            }}
          />
          <span
            style={{
              fontSize: "11px",
              fontWeight: 800,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              background: "rgba(34, 197, 94, 0.2)",
              color: "#86efac",
              padding: "2px 6px",
              borderRadius: "4px",
              border: "1px solid rgba(34, 197, 94, 0.4)",
            }}
          >
            LIVE
          </span>
        </div>

        <div style={{ minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
            <span className="live-title" style={{ fontSize: "14px", fontWeight: 800, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {workoutTitle}
            </span>
            {athleteName && isCoachView && (
              <span
                style={{
                  fontSize: "11px",
                  background: "rgba(255, 255, 255, 0.15)",
                  padding: "1px 6px",
                  borderRadius: "4px",
                  fontWeight: 600,
                }}
              >
                Athlete: {athleteName}
              </span>
            )}
          </div>

          <div className="live-meta" style={{ fontSize: "12px", color: "#bfdbfe", display: "flex", alignItems: "center", gap: "8px", marginTop: "2px", flexWrap: "wrap" }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
              <Clock size={12} style={{ color: "#93c5fd" }} />
              <b>{formatTimer(elapsedSeconds)}</b>
            </span>
            <span>•</span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
              <Dumbbell size={12} style={{ color: "#93c5fd" }} />
              {exerciseCount} {exerciseCount === 1 ? "ex" : "exercises"}
            </span>
            {startedByName && (
              <>
                <span>•</span>
                <span style={{ color: "#dbeafe" }}>By {startedByName}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Right: Action Buttons */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
        <button
          type="button"
          onClick={onResume}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            background: "#ffffff",
            color: "#1e3a8a",
            fontWeight: 800,
            fontSize: "13px",
            padding: "8px 14px",
            borderRadius: "8px",
            border: "none",
            cursor: "pointer",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
            transition: "all 0.15s ease",
          }}
          className="live-banner-resume-btn"
          title="Open and edit active workout"
        >
          <Play size={14} fill="#1e3a8a" />
          <span>Resume &amp; Edit</span>
        </button>

        <button
          type="button"
          onClick={onComplete}
          disabled={isCompleting}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            background: "rgba(34, 197, 94, 0.9)",
            color: "#ffffff",
            fontWeight: 800,
            fontSize: "13px",
            padding: "8px 14px",
            borderRadius: "8px",
            border: "1px solid rgba(255, 255, 255, 0.2)",
            cursor: isCompleting ? "not-allowed" : "pointer",
            opacity: isCompleting ? 0.7 : 1,
            transition: "all 0.15s ease",
          }}
          className="live-banner-complete-btn"
          title="Complete and save workout to history"
        >
          <CheckCircle2 size={14} />
          <span>{isCompleting ? "Saving..." : "Finish"}</span>
        </button>
      </div>
    </div>
  );
}
