"use client";

import React from "react";
import { Dumbbell, CalendarRange, History, BarChart3, Heart, Users, Utensils } from "lucide-react";

export interface MobileBottomNavProps {
  currentTab: string;
  onSelectTab: (tab: any) => void;
  role: "TRAINER" | "CLIENT";
  hasActiveWorkout?: boolean;
  activeProgramCount?: number;
  unreadCount?: number;
}

export function MobileBottomNav({
  currentTab,
  onSelectTab,
  role,
  hasActiveWorkout = false,
  activeProgramCount = 0,
}: MobileBottomNavProps) {
  const isTrainer = role === "TRAINER";

  const navItems = [
    {
      id: "log",
      label: isTrainer ? "Train" : "Workout",
      icon: Dumbbell,
      badge: hasActiveWorkout ? "Active" : undefined,
      badgeColor: "#10b981",
    },
    {
      id: "programs",
      label: "Programs",
      icon: CalendarRange,
      badge: activeProgramCount > 0 ? `${activeProgramCount}` : undefined,
      badgeColor: "#3b82f6",
    },
    {
      id: "history",
      label: "History",
      icon: History,
    },
    {
      id: "analytics",
      label: "Progress",
      icon: BarChart3,
    },
    {
      id: "mobility",
      label: "Recovery",
      icon: Heart,
    },
  ];

  return (
    <nav
      className="mobile-bottom-nav"
      aria-label="Mobile navigation"
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        height: "64px",
        backgroundColor: "rgba(255, 255, 255, 0.94)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderTop: "1px solid rgba(226, 232, 240, 0.9)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-around",
        zIndex: 50,
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
        boxShadow: "0 -4px 20px rgba(0, 0, 0, 0.06)",
      }}
    >
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = currentTab === item.id;

        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelectTab(item.id)}
            style={{
              flex: 1,
              height: "100%",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              background: "transparent",
              border: "none",
              cursor: "pointer",
              position: "relative",
              padding: "6px 0",
              color: isActive ? "#0284c7" : "#64748b",
              transition: "all 0.15s ease-in-out",
            }}
          >
            {/* Active Pill Indicator */}
            {isActive && (
              <div
                style={{
                  position: "absolute",
                  top: "0px",
                  width: "28px",
                  height: "3px",
                  borderRadius: "0 0 4px 4px",
                  backgroundColor: "#0284c7",
                }}
              />
            )}

            {/* Icon Wrapper with Badge */}
            <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon
                size={21}
                strokeWidth={isActive ? 2.5 : 1.8}
                style={{
                  transform: isActive ? "scale(1.08)" : "scale(1)",
                  transition: "transform 0.15s ease-in-out",
                }}
              />
              {item.badge && (
                <span
                  style={{
                    position: "absolute",
                    top: "-4px",
                    right: "-8px",
                    backgroundColor: item.badgeColor || "#ef4444",
                    color: "#ffffff",
                    fontSize: "9px",
                    fontWeight: 800,
                    padding: "1px 4px",
                    borderRadius: "10px",
                    lineHeight: "1.2",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                  }}
                >
                  {item.badge}
                </span>
              )}
            </div>

            {/* Text Label */}
            <span
              style={{
                fontSize: "11px",
                fontWeight: isActive ? 700 : 500,
                marginTop: "3px",
                letterSpacing: "-0.2px",
              }}
            >
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
