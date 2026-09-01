"use client";

import React from "react";
import {
  Dumbbell,
  Layers,
  Clock,
  TrendingUp,
  Heart,
  Flame,
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
      shortLabel: "Logger",
      subtitle: "Build & Log Sets",
      icon: Dumbbell,
      badge: hasActiveWorkout ? "In Progress" : plannedCount > 0 ? `${plannedCount} Planned` : undefined,
      badgeType: hasActiveWorkout ? "active" : "neutral",
      color: "#2563eb",
      activeBg: "linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)",
      activeBorder: "#93c5fd",
      activeText: "#1d4ed8",
    },
    {
      id: "programs" as StudioTabType,
      label: "Training Programs",
      shortLabel: "Programs",
      subtitle: "Periodization & Splits",
      icon: Layers,
      badge: plannedCount > 0 ? `${plannedCount} Scheduled` : undefined,
      badgeType: "purple",
      color: "#7c3aed",
      activeBg: "linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)",
      activeBorder: "#c4b5fd",
      activeText: "#6d28d9",
    },
    {
      id: "history" as StudioTabType,
      label: "Workout History",
      shortLabel: "History",
      subtitle: "Past Logs & PRs",
      icon: Clock,
      badge: completedCount > 0 ? `${completedCount} Logs` : undefined,
      badgeType: "green",
      color: "#059669",
      activeBg: "linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)",
      activeBorder: "#6ee7b7",
      activeText: "#047857",
    },
    {
      id: "analytics" as StudioTabType,
      label: "Analytics & Volume",
      shortLabel: "Analytics",
      subtitle: "Trends & 1RM Math",
      icon: TrendingUp,
      badge: undefined,
      badgeType: "neutral",
      color: "#0284c7",
      activeBg: "linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)",
      activeBorder: "#7dd3fc",
      activeText: "#0369a1",
    },
    {
      id: "mobility" as StudioTabType,
      label: "Recovery & Mobility",
      shortLabel: "Recovery",
      subtitle: "Stretches & Warm-Ups",
      icon: Heart,
      badge: "Hub",
      badgeType: "pink",
      color: "#db2777",
      activeBg: "linear-gradient(135deg, #fdf2f8 0%, #fce7f3 100%)",
      activeBorder: "#f9a8d4",
      activeText: "#be185d",
    },
  ];

  return (
    <div
      style={{
        display: "flex",
        alignItems: "stretch",
        gap: "8px",
        padding: "6px",
        background: "#ffffff",
        border: "1px solid #e2e8f0",
        borderRadius: "14px",
        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.04)",
        overflowX: "auto",
        scrollbarWidth: "none",
        msOverflowStyle: "none",
        marginBottom: "18px",
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
              flex: "1 1 0",
              minWidth: "135px",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "10px 14px",
              borderRadius: "10px",
              border: isActive ? `1.5px solid ${t.activeBorder}` : "1px solid transparent",
              background: isActive ? t.activeBg : "transparent",
              color: isActive ? t.activeText : "#475569",
              cursor: "pointer",
              transition: "all 0.15s ease",
              textAlign: "left",
              boxShadow: isActive ? "0 2px 4px rgba(0, 0, 0, 0.04)" : "none",
            }}
            className={`studio-nav-tab-btn ${isActive ? "active" : ""}`}
          >
            {/* Icon Pill */}
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "8px",
                background: isActive ? "#ffffff" : "#f1f5f9",
                border: isActive ? `1px solid ${t.activeBorder}` : "1px solid #e2e8f0",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: isActive ? t.color : "#64748b",
                flexShrink: 0,
                boxShadow: isActive ? "0 1px 2px rgba(0, 0, 0, 0.05)" : "none",
              }}
            >
              <IconComponent size={18} />
            </div>

            {/* Tab Text & Subtitle */}
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span
                  style={{
                    fontSize: "13px",
                    fontWeight: isActive ? 800 : 700,
                    color: isActive ? t.activeText : "#1e293b",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {t.label}
                </span>
                {t.badge && (
                  <span
                    style={{
                      fontSize: "10px",
                      fontWeight: 700,
                      padding: "1px 6px",
                      borderRadius: "10px",
                      background:
                        t.badgeType === "active"
                          ? "#fee2e2"
                          : t.badgeType === "purple"
                          ? "#ede9fe"
                          : t.badgeType === "green"
                          ? "#d1fae5"
                          : t.badgeType === "pink"
                          ? "#fce7f3"
                          : "#f1f5f9",
                      color:
                        t.badgeType === "active"
                          ? "#dc2626"
                          : t.badgeType === "purple"
                          ? "#6d28d9"
                          : t.badgeType === "green"
                          ? "#047857"
                          : t.badgeType === "pink"
                          ? "#be185d"
                          : "#64748b",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {t.badge}
                  </span>
                )}
              </div>
              <div
                style={{
                  fontSize: "11px",
                  color: isActive ? t.color : "#94a3b8",
                  fontWeight: 500,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  marginTop: "1px",
                }}
              >
                {t.subtitle}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
