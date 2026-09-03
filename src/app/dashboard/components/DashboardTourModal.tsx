"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Sparkles,
  Dumbbell,
  Users,
  Layers,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  X,
  Timer,
  Activity,
  Heart,
  Calendar,
  Compass,
} from "lucide-react";

export interface DashboardTourModalProps {
  role: "TRAINER" | "CLIENT";
  isOpen: boolean;
  onClose: () => void;
}

interface TourStep {
  id: string;
  targetSelector: string;
  fallbackSelector?: string;
  badge: string;
  title: string;
  icon: React.ReactNode;
  description: string;
  proTip?: string;
  preferredPosition?: "bottom" | "top" | "right" | "left" | "auto";
}

export function DashboardTourModal({ role, isOpen, onClose }: DashboardTourModalProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [popoverPos, setPopoverPos] = useState<{ top: number; left: number; position: string }>({
    top: 100,
    left: 100,
    position: "bottom",
  });
  const popoverRef = useRef<HTMLDivElement>(null);

  const storageKey = role === "TRAINER" ? "strkyr_tour_seen_trainer" : "strkyr_tour_seen_client";

  const handleCloseTour = useCallback(() => {
    try {
      localStorage.setItem(storageKey, "true");
      localStorage.setItem("strkyr_tour_seen_trainer", "true");
      localStorage.setItem("strkyr_tour_seen_client", "true");
    } catch {}
    onClose();
  }, [storageKey, onClose]);

  const trainerSteps: TourStep[] = [
    {
      id: "studio-tabs",
      targetSelector: '[data-tour="studio-tabs"]',
      fallbackSelector: ".studio-nav-ribbon",
      badge: "Step 1 of 5 • Studio Workspaces",
      title: "Navigation Ribbon & Studio Tabs",
      icon: <Layers size={22} style={{ color: "#2563eb" }} />,
      description:
        "Seamlessly toggle between the Workout Logger, Periodized Multi-Week Programs, Athlete History, PR Kinematic Analytics, and Guided Mobility stretches.",
      proTip: "Tip: Active in-progress workouts will stay pinned as you switch tabs.",
      preferredPosition: "bottom",
    },
    {
      id: "client-sidebar",
      targetSelector: '[data-tour="client-sidebar"]',
      fallbackSelector: ".sidebar",
      badge: "Step 2 of 5 • Athlete Roster",
      title: "Client Management & 1-Click Invites",
      icon: <Users size={22} style={{ color: "#16a34a" }} />,
      description:
        "Select athletes to view their assigned mesocycles or personal progress. Click '+ Client' to create athletes, or copy instant 1-click invite links for free client portal access.",
      proTip: "Athletes get 100% free access to their dedicated client dashboard.",
      preferredPosition: "right",
    },
    {
      id: "ai-copilot",
      targetSelector: '[data-tour="ai-copilot"]',
      badge: "Step 3 of 5 • AI Intelligence",
      title: "AI Performance Co-Pilot & Importer",
      icon: <Sparkles size={22} style={{ color: "#7c3aed" }} />,
      description:
        "Ask AI to generate custom periodized hypertrophy programs, analyze athlete plateaus, or import raw workout notes from SMS text messages with 1 click.",
      proTip: "You retain 100% final approval over every exercise and rep scheme.",
      preferredPosition: "bottom",
    },
    {
      id: "workout-builder",
      targetSelector: '[data-tour="workout-builder"]',
      fallbackSelector: ".main",
      badge: "Step 4 of 5 • Exercise Logger",
      title: "Interactive Logger & Weight Modes",
      icon: <Dumbbell size={22} style={{ color: "#2563eb" }} />,
      description:
        "Build routines with 120+ exercise library, set completion checkmarks, auto-starting 30s rest timers, and clear weight mode badges (Per Dumbbell vs Total Barbell).",
      proTip: "Mark sets done to auto-prompt your 30s rest countdown timer.",
      preferredPosition: "top",
    },
    {
      id: "header-menu",
      targetSelector: '[data-tour="header-menu"]',
      badge: "Step 5 of 5 • Tools & Settings",
      title: "Plate Math, Exports & Profile",
      icon: <Compass size={22} style={{ color: "#ea580c" }} />,
      description:
        "Access the Barbell & Dumbbell Plate Calculator (with 0 lb bar support), export PDF progress reports, toggle roles, and customize studio preferences.",
      proTip: "You can restart this interactive walkthrough anytime from this menu.",
      preferredPosition: "bottom",
    },
  ];

  const clientSteps: TourStep[] = [
    {
      id: "client-tabs",
      targetSelector: '[data-tour="studio-tabs"]',
      fallbackSelector: ".studio-nav-ribbon",
      badge: "Step 1 of 5 • Athlete Portal",
      title: "Your Training Studio",
      icon: <Layers size={22} style={{ color: "#2563eb" }} />,
      description:
        "Access workouts assigned by your coach, browse periodized program calendars, look back on workout history, and follow guided mobility flows.",
      proTip: "Everything assigned by your trainer syncs automatically in real time.",
      preferredPosition: "bottom",
    },
    {
      id: "client-timer",
      targetSelector: '[data-tour="client-timer-bar"]',
      badge: "Step 2 of 5 • Floor Timer",
      title: "Gym Rest Countdown Timer",
      icon: <Timer size={22} style={{ color: "#2563eb" }} />,
      description:
        "Your rest timer runs reliably in the background with wall-clock precision and chimes when rest is up—even if you switch apps or lock your phone.",
      proTip: "Defaults to 30s with quick presets for 15s, 45s, 60s, and 90s.",
      preferredPosition: "bottom",
    },
    {
      id: "client-workouts",
      targetSelector: '[data-tour="client-workouts"]',
      fallbackSelector: ".card",
      badge: "Step 3 of 5 • Workout Execution",
      title: "Log Sets, Reps & PRs",
      icon: <Dumbbell size={22} style={{ color: "#16a34a" }} />,
      description:
        "Follow prescribed coach weights with dumbbell vs barbell clarity. Tap 'Done' on each set to log your progress and trigger rest intervals.",
      proTip: "Hit new volume records to automatically unlock PR trophies.",
      preferredPosition: "top",
    },
    {
      id: "client-ai",
      targetSelector: '[data-tour="ai-copilot"]',
      badge: "Step 4 of 5 • AI Training Assistant",
      title: "Ask AI Training & Form Questions",
      icon: <Sparkles size={22} style={{ color: "#7c3aed" }} />,
      description:
        "Have questions about exercise form, substitute movements, or recovery nutrition? Ask your 24/7 AI training assistant anytime.",
      proTip: "Trained on peer-reviewed exercise science and your workout history.",
      preferredPosition: "bottom",
    },
    {
      id: "client-menu",
      targetSelector: '[data-tour="header-menu"]',
      badge: "Step 5 of 5 • Plate Math & Profile",
      title: "Plate Calculator & Settings",
      icon: <Compass size={22} style={{ color: "#ea580c" }} />,
      description:
        "Need plate math? Open the Barbell Plate Calculator (with 0 lb bar option), update your profile photo, or review release notes.",
      proTip: "Restart this tour anytime by opening your avatar menu.",
      preferredPosition: "bottom",
    },
  ];

  const steps = role === "TRAINER" ? trainerSteps : clientSteps;
  const current = steps[currentStep] || steps[0];

  // Update element bounding box and position popover
  const updatePosition = useCallback(() => {
    if (!isOpen) return;

    let el = document.querySelector(current.targetSelector) as HTMLElement | null;
    if (!el && current.fallbackSelector) {
      el = document.querySelector(current.fallbackSelector) as HTMLElement | null;
    }

    if (el) {
      // Smoothly scroll into view if outside viewport
      const rect = el.getBoundingClientRect();
      const inView =
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth);

      if (!inView && typeof el.scrollIntoView === "function") {
        el.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
      }

      // Re-measure bounding box
      const updatedRect = el.getBoundingClientRect();
      setTargetRect(updatedRect);

      // Calculate popover coordinates
      const popWidth = Math.min(380, window.innerWidth - 32);
      const popHeight = 240;
      const margin = 14;

      let top = 0;
      let left = 0;
      let pos = current.preferredPosition || "bottom";

      if (pos === "bottom") {
        top = updatedRect.bottom + margin;
        left = updatedRect.left + updatedRect.width / 2 - popWidth / 2;
        if (top + popHeight > window.innerHeight - 16) {
          pos = "top";
          top = updatedRect.top - popHeight - margin;
        }
      } else if (pos === "top") {
        top = updatedRect.top - popHeight - margin;
        left = updatedRect.left + updatedRect.width / 2 - popWidth / 2;
        if (top < 16) {
          pos = "bottom";
          top = updatedRect.bottom + margin;
        }
      } else if (pos === "right") {
        top = updatedRect.top + updatedRect.height / 2 - popHeight / 2;
        left = updatedRect.right + margin;
        if (left + popWidth > window.innerWidth - 16) {
          pos = "bottom";
          top = updatedRect.bottom + margin;
          left = updatedRect.left + updatedRect.width / 2 - popWidth / 2;
        }
      }

      // Clamp horizontally within screen
      left = Math.max(16, Math.min(window.innerWidth - popWidth - 16, left));
      top = Math.max(16, Math.min(window.innerHeight - popHeight - 16, top));

      setPopoverPos({ top, left, position: pos });
    } else {
      // Fallback center if element is not in DOM
      setTargetRect(null);
      setPopoverPos({
        top: Math.max(60, (window.innerHeight - 260) / 2),
        left: Math.max(16, (window.innerWidth - 380) / 2),
        position: "center",
      });
    }
  }, [isOpen, current]);

  useEffect(() => {
    if (!isOpen) return;
    updatePosition();

    const handleResize = () => updatePosition();
    const handleScroll = () => updatePosition();

    window.addEventListener("resize", handleResize);
    window.addEventListener("scroll", handleScroll, true);

    const timer = setTimeout(updatePosition, 100);
    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleScroll, true);
      clearTimeout(timer);
    };
  }, [isOpen, currentStep, updatePosition]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleCloseTour();
      } else if (e.key === "ArrowRight" || e.key === "Enter") {
        if (currentStep < steps.length - 1) {
          setCurrentStep((prev) => prev + 1);
        } else {
          handleCloseTour();
        }
      } else if (e.key === "ArrowLeft") {
        if (currentStep > 0) {
          setCurrentStep((prev) => prev - 1);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, currentStep, steps.length, handleCloseTour]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 99999,
        pointerEvents: "auto",
      }}
    >
      {/* Target Element Spotlight Cutout Ring */}
      {targetRect && (
        <div
          style={{
            position: "fixed",
            top: `${Math.max(0, targetRect.top - 6)}px`,
            left: `${Math.max(0, targetRect.left - 6)}px`,
            width: `${targetRect.width + 12}px`,
            height: `${targetRect.height + 12}px`,
            borderRadius: "14px",
            boxShadow:
              "0 0 0 9999px rgba(15, 23, 42, 0.72), 0 0 0 3px #3b82f6, 0 0 25px rgba(59, 130, 246, 0.7)",
            pointerEvents: "none",
            transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
            zIndex: 100000,
          }}
        />
      )}

      {/* Ambient Backdrop fallback if no target is active */}
      {!targetRect && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.72)",
            zIndex: 100000,
          }}
          onClick={handleCloseTour}
        />
      )}

      {/* Floating Spotlight Tour Popover Card */}
      <div
        ref={popoverRef}
        style={{
          position: "fixed",
          top: `${popoverPos.top}px`,
          left: `${popoverPos.left}px`,
          width: "calc(100vw - 32px)",
          maxWidth: "380px",
          background: "#ffffff",
          borderRadius: "16px",
          padding: "20px",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(226, 232, 240, 0.8)",
          zIndex: 100001,
          animation: "tourPopIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        {/* Header: Step Pill & Close */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "12px",
          }}
        >
          <span
            style={{
              fontSize: "11px",
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              color: "#2563eb",
              background: "#eff6ff",
              border: "1px solid #bfdbfe",
              padding: "3px 8px",
              borderRadius: "12px",
            }}
          >
            {current.badge}
          </span>

          <button
            type="button"
            onClick={handleCloseTour}
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              padding: "4px",
              color: "#94a3b8",
              borderRadius: "6px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            title="Skip Tour (Esc)"
          >
            <X size={16} />
          </button>
        </div>

        {/* Feature Title & Icon */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "10px",
              background: "#eff6ff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            {current.icon}
          </div>
          <h3
            style={{
              margin: 0,
              fontSize: "16px",
              fontWeight: 800,
              color: "#0f172a",
              lineHeight: 1.25,
            }}
          >
            {current.title}
          </h3>
        </div>

        {/* Feature Description */}
        <p
          style={{
            margin: "0 0 12px 0",
            fontSize: "13px",
            color: "#475569",
            lineHeight: 1.5,
          }}
        >
          {current.description}
        </p>

        {/* Pro Tip Box */}
        {current.proTip && (
          <div
            style={{
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: "8px",
              padding: "8px 10px",
              marginBottom: "16px",
              fontSize: "11px",
              color: "#64748b",
              lineHeight: 1.4,
            }}
          >
            💡 <b>Pro-Tip:</b> {current.proTip}
          </div>
        )}

        {/* Footer: Progress Dots & Actions */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            paddingTop: "12px",
            borderTop: "1px solid #f1f5f9",
          }}
        >
          {/* Progress Dots */}
          <div style={{ display: "flex", gap: "5px", alignItems: "center" }}>
            {steps.map((s, idx) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setCurrentStep(idx)}
                style={{
                  width: idx === currentStep ? "18px" : "6px",
                  height: "6px",
                  borderRadius: "3px",
                  background: idx === currentStep ? "#2563eb" : "#cbd5e1",
                  border: "none",
                  padding: 0,
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
                title={`Go to step ${idx + 1}`}
              />
            ))}
          </div>

          {/* Navigation Controls */}
          <div style={{ display: "flex", gap: "8px" }}>
            {currentStep > 0 && (
              <button
                type="button"
                onClick={() => setCurrentStep((prev) => prev - 1)}
                style={{
                  background: "#f8fafc",
                  border: "1px solid #cbd5e1",
                  color: "#475569",
                  fontSize: "12px",
                  fontWeight: 700,
                  padding: "6px 10px",
                  borderRadius: "8px",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                <ArrowLeft size={13} />
                <span>Back</span>
              </button>
            )}

            {currentStep < steps.length - 1 ? (
              <button
                type="button"
                onClick={() => setCurrentStep((prev) => prev + 1)}
                style={{
                  background: "#2563eb",
                  border: "none",
                  color: "#ffffff",
                  fontSize: "12px",
                  fontWeight: 700,
                  padding: "6px 14px",
                  borderRadius: "8px",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "5px",
                  boxShadow: "0 2px 4px rgba(37, 99, 235, 0.25)",
                }}
              >
                <span>Next ({currentStep + 1}/{steps.length})</span>
                <ArrowRight size={13} />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleCloseTour}
                style={{
                  background: "linear-gradient(135deg, #16a34a 0%, #15803d 100%)",
                  border: "none",
                  color: "#ffffff",
                  fontSize: "12px",
                  fontWeight: 800,
                  padding: "6px 14px",
                  borderRadius: "8px",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "5px",
                  boxShadow: "0 2px 6px rgba(22, 163, 74, 0.3)",
                }}
              >
                <CheckCircle2 size={14} />
                <span>Finish &amp; Start</span>
              </button>
            )}
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes tourPopIn {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(4px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
