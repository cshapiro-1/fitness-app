"use client";

import React from "react";
import {
  Dumbbell,
  Layers,
  Clock,
  TrendingUp,
  Heart,
} from "lucide-react";

export type StudioTabType = "log" | "programs" | "history" | "analytics" | "mobility";

interface StudioNavTabsProps {
  activeTab: StudioTabType;
  onSelectTab: (tab: StudioTabType) => void;
  plannedCount?: number;
  completedCount?: number;
  hasActiveWorkout?: boolean;
}

export function StudioNavTabs({
  activeTab,
  onSelectTab,
  plannedCount = 0,
  completedCount = 0,
  hasActiveWorkout = false,
}: StudioNavTabsProps) {
  const tabsConfig = [
    {
      id: "log" as StudioTabType,
      label: "Workout Logger",
      icon: Dumbbell,
      countBadge: hasActiveWorkout ? "Active" : plannedCount > 0 ? `${plannedCount}` : undefined,
      badgeColor: hasActiveWorkout ? "#dc2626" : "#2563eb",
      badgeBg: hasActiveWorkout ? "#fee2e2" : "#eff6ff",
      color: "#2563eb",
      activeBg: "#eff6ff",
      activeBorder: "#93c5fd",
      activeText: "#1d4ed8",
    },
    {
      id: "programs" as StudioTabType,
      label: "Training Programs",
      icon: Layers,
      countBadge: plannedCount > 0 ? `${plannedCount}` : undefined,
      badgeColor: "#6d28d9",
      badgeBg: "#ede9fe",
      color: "#7c3aed",
      activeBg: "#f5f3ff",
      activeBorder: "#c4b5fd",
      activeText: "#6d28d9",
    },
    {
      id: "history" as StudioTabType,
      label: "Workout History",
      icon: Clock,
      countBadge: completedCount > 0 ? `${completedCount}` : undefined,
      badgeColor: "#047857",
      badgeBg: "#d1fae5",
      color: "#059669",
      activeBg: "#ecfdf5",
      activeBorder: "#6ee7b7",
      activeText: "#047857",
    },
    {
      id: "analytics" as StudioTabType,
      label: "Analytics & Volume",
      icon: TrendingUp,
      countBadge: undefined,
      badgeColor: "#0369a1",
      badgeBg: "#e0f2fe",
      color: "#0284c7",
      activeBg: "#f0f9ff",
      activeBorder: "#7dd3fc",
      activeText: "#0369a1",
    },
    {
      id: "mobility" as StudioTabType,
      label: "Recovery & Mobility",
      icon: Heart,
      countBadge: undefined,
      badgeColor: "#be185d",
      badgeBg: "#fce7f3",
      color: "#db2777",
      activeBg: "#fdf2f8",
      activeBorder: "#f9a8d4",
      activeText: "#be185d",
    },
  ];

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "6px",
        padding: "5px",
        background: "#ffffff",
        border: "1px solid #e2e8f0",
        borderRadius: "12px",
        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.04)",
        overflowX: "auto",
        marginBottom: "16px",
      }}
      className="studio-nav-ribbon"
    >
      {tabsConfig.map((t) => {
        const isActive = activeTab === t.id;
        const IconComponent = t.icon;

        return (
          <button
            key={t.id}
            type="button"
            onClick={() => onSelectTab(t.id)}
            style={{
              flex: 1,
              minWidth: "fit-content",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              padding: "9px 14px",
              borderRadius: "8px",
              border: isActive ? `1.5px solid ${t.activeBorder}` : "1px solid transparent",
              background: isActive ? t.activeBg : "transparent",
              color: isActive ? t.activeText : "#475569",
              cursor: "pointer",
              transition: "all 0.15s ease",
              boxShadow: isActive ? "0 1px 3px rgba(0, 0, 0, 0.05)" : "none",
            }}
            className={`studio-nav-tab-btn ${isActive ? "active" : ""}`}
          >
            <IconComponent
              size={17}
              style={{ color: isActive ? t.color : "#64748b", flexShrink: 0 }}
            />

            <span
              style={{
                fontSize: "13px",
                fontWeight: isActive ? 800 : 600,
                color: isActive ? t.activeText : "#334155",
                whiteSpace: "nowrap",
              }}
            >
              {t.label}
            </span>

            {t.countBadge && (
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 700,
                  padding: "1px 7px",
                  borderRadius: "10px",
                  background: t.badgeBg,
                  color: t.badgeColor,
                  flexShrink: 0,
                }}
              >
                {t.countBadge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
