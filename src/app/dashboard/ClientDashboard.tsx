"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { signOut } from "next-auth/react";
import {
  LogOut,
  TrendingUp,
  Dumbbell,
  Camera,
  User,
  Check,
  X,
  ShieldCheck,
  Calendar,
  Award,
  Flame,
  FileText,
  Sparkles,
  Timer,
  Play,
  Pause,
  RotateCcw,
} from "lucide-react";
import Link from "next/link";
import { isDefaultBodyweight } from "./utils/exerciseLibrary";
import { AnalyticsView } from "./components/AnalyticsView";
import { computeAnalytics } from "./utils/analytics";
import { PlateCalculatorModal } from "./components/PlateCalculatorModal";

const CLIENT_PRESETS = [
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80",
];

export function ClientDashboard({
  userName,
  userImage,
  isAdmin,
}: {
  userName: string;
  userImage: string | null;
  isAdmin?: boolean;
}) {
  const [workouts, setWorkouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"assigned" | "history" | "analytics">("assigned");

  const [currentImage, setCurrentImage] = useState<string | null>(userImage);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [showPlateModal, setShowPlateModal] = useState(false);
  const [savingPhoto, setSavingPhoto] = useState(false);

  // Rest Timer State
  const [restSeconds, setRestSeconds] = useState<number | null>(null);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  // Timer Tick Effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isTimerRunning && restSeconds !== null && restSeconds > 0) {
      interval = setInterval(() => {
        setRestSeconds((prev) => {
          if (prev === null || prev <= 1) {
            setIsTimerRunning(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning, restSeconds]);

  // Dismissible Banner State (Persisted in localStorage)
  const [bannerDismissed, setBannerDismissed] = useState(false);

  useEffect(() => {
    try {
      const isDismissed = localStorage.getItem("fitcoach_free_portal_banner_dismissed");
      if (isDismissed === "true") {
        setBannerDismissed(true);
      }
    } catch {
      // Ignore local storage errors
    }
  }, []);

  const handleDismissBanner = () => {
    setBannerDismissed(true);
    try {
      localStorage.setItem("fitcoach_free_portal_banner_dismissed", "true");
    } catch {
      // Ignore local storage errors
    }
  };

  const fetchWorkouts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/workouts/client");
      if (res.ok) {
        setWorkouts(await res.json());
      }
    } catch (e) {
      console.error("Failed to load workouts", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWorkouts();
  }, [fetchWorkouts]);

  const handleUpdatePhoto = async (newImage: string) => {
    setSavingPhoto(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: newImage }),
      });
      if (res.ok) {
        setCurrentImage(newImage);
        setShowPhotoModal(false);
      }
    } catch {
      alert("Failed to update photo.");
    } finally {
      setSavingPhoto(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("Image must be under 2MB");
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result) {
          handleUpdatePhoto(reader.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const completed = useMemo(() => workouts.filter((w) => w.status === "COMPLETED"), [workouts]);
  const planned = useMemo(() => workouts.filter((w) => w.status === "PLANNED" || w.status === "IN_PROGRESS"), [workouts]);

  const fullAnalytics = useMemo(() => computeAnalytics(workouts), [workouts]);

  return (
    <div className="app">
      {/* App Header */}
      <header className="header">
        <div className="header-left">
          <Dumbbell size={20} style={{ color: "#2563eb" }} />
          <span className="header-title">Client Portal</span>
        </div>

        <div className="header-right" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {isAdmin && (
            <Link
              href="/admin"
              className="nav-btn nav-btn-dark"
            >
              <ShieldCheck size={14} />
              <span className="hide-mobile">Admin</span>
            </Link>
          )}

          {/* Nutrition & Macros */}
          <Link
            href="/nutrition"
            className="nav-btn nav-btn-green"
          >
            <span>🥗</span>
            <span className="hide-mobile">Nutrition</span>
          </Link>

          {/* Admin Coach View Switcher */}
          {isAdmin && (
            <button
              type="button"
              onClick={async () => {
                await fetch("/api/user/role", {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ role: "TRAINER" }),
                });
                window.location.href = "/dashboard";
              }}
              className="nav-btn nav-btn-dark"
              style={{ background: "#1e293b", color: "#f8fafc", cursor: "pointer" }}
              title="Switch to Coach / Trainer Dashboard"
            >
              <Dumbbell size={14} />
              <span className="hide-mobile">Coach View</span>
            </button>
          )}

          {/* Plate Calculator Button */}
          <button
            type="button"
            onClick={() => setShowPlateModal(true)}
            className="nav-btn"
            style={{ display: "flex", alignItems: "center", gap: "5px", color: "#2563eb", fontWeight: 600 }}
            title="Open Barbell Plate Calculator"
          >
            <Dumbbell size={14} />
            <span className="hide-mobile">Plate Math</span>
          </button>

          <Link
            href="/onboarding"
            className="nav-btn"
          >
            <span className="hide-mobile">Switch Role</span>
          </Link>

          {/* Client Avatar with Click to Change */}
          <div
            onClick={() => setShowPhotoModal(true)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              cursor: "pointer",
              padding: "2px 6px",
              borderRadius: "20px",
              background: "rgba(0,0,0,0.03)",
            }}
            title="Click to update profile photo"
          >
            {currentImage ? (
              <img
                src={currentImage}
                className="avatar"
                alt={userName}
                style={{ width: "28px", height: "28px", borderRadius: "50%", objectFit: "cover", border: "1px solid #cbd5e1" }}
              />
            ) : (
              <div
                style={{
                  width: "28px",
                  height: "28px",
                  borderRadius: "50%",
                  background: "#16a34a",
                  color: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "11px",
                  fontWeight: 700,
                }}
              >
                {userName ? userName.charAt(0).toUpperCase() : <User size={14} />}
              </div>
            )}
            <span className="header-name hide-mobile" style={{ fontSize: "12px" }}>{userName}</span>
          </div>

          <button className="signout-btn" onClick={() => signOut({ callbackUrl: "/auth/signin" })} title="Sign out">
            <LogOut size={16} />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="main" style={{ maxWidth: "860px", margin: "16px auto", padding: "0 14px 60px" }}>
        {/* Dismissible Free Portal Access Banner */}
        {!bannerDismissed && (
          <div
            style={{
              background: "#f0fdf4",
              border: "1px solid #bbf7d0",
              color: "#166534",
              padding: "10px 14px",
              borderRadius: "10px",
              marginBottom: "16px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "10px",
              fontSize: "12px",
              boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Sparkles size={16} style={{ color: "#16a34a", flexShrink: 0 }} />
              <span>
                <b>Client Portal Active:</b> 100% free access to all coach routines &amp; nutrition.
              </span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
              <button
                type="button"
                onClick={() => setShowPhotoModal(true)}
                className="btn-secondary"
                style={{ padding: "4px 8px", fontSize: "11px", borderRadius: "6px", height: "auto" }}
              >
                Photo
              </button>

              <button
                type="button"
                onClick={handleDismissBanner}
                className="btn-ghost"
                style={{ padding: "4px", color: "#166534", height: "auto" }}
                title="Dismiss banner"
                aria-label="Dismiss banner"
              >
                <X size={15} />
              </button>
            </div>
          </div>
        )}

        {/* Gym Floor Rest Timer Bar */}
        <div
          style={{
            background: restSeconds !== null && restSeconds > 0 ? "#eff6ff" : "#f8fafc",
            border: "1px solid",
            borderColor: restSeconds !== null && restSeconds > 0 ? "#bfdbfe" : "#e2e8f0",
            borderRadius: "10px",
            padding: "8px 14px",
            marginBottom: "14px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "10px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Timer size={16} style={{ color: restSeconds !== null && restSeconds > 0 ? "#2563eb" : "#64748b" }} />
            <span style={{ fontSize: "12px", fontWeight: 700, color: "#0f172a" }}>
              Rest Timer:
            </span>
            {restSeconds !== null ? (
              <span style={{ fontSize: "16px", fontWeight: 800, color: restSeconds <= 10 && restSeconds > 0 ? "#dc2626" : "#2563eb", minWidth: "40px" }}>
                {Math.floor(restSeconds / 60)}:{(restSeconds % 60).toString().padStart(2, "0")}
              </span>
            ) : (
              <span style={{ fontSize: "12px", color: "#64748b" }}>Ready</span>
            )}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            {[60, 90, 120, 180].map((sec) => (
              <button
                key={sec}
                type="button"
                onClick={() => {
                  setRestSeconds(sec);
                  setIsTimerRunning(true);
                }}
                style={{
                  padding: "4px 8px",
                  fontSize: "11px",
                  fontWeight: 600,
                  borderRadius: "6px",
                  border: "1px solid #cbd5e1",
                  background: "#ffffff",
                  color: "#1e293b",
                  cursor: "pointer",
                }}
              >
                {sec}s
              </button>
            ))}

            {restSeconds !== null && (
              <>
                <button
                  type="button"
                  onClick={() => setIsTimerRunning((r) => !r)}
                  style={{
                    padding: "4px 8px",
                    fontSize: "11px",
                    fontWeight: 700,
                    borderRadius: "6px",
                    border: "none",
                    background: isTimerRunning ? "#f59e0b" : "#2563eb",
                    color: "#ffffff",
                    cursor: "pointer",
                  }}
                >
                  {isTimerRunning ? "Pause" : "Resume"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRestSeconds(null);
                    setIsTimerRunning(false);
                  }}
                  style={{
                    padding: "4px 8px",
                    fontSize: "11px",
                    borderRadius: "6px",
                    border: "1px solid #e2e8f0",
                    background: "#ffffff",
                    color: "#64748b",
                    cursor: "pointer",
                  }}
                >
                  Reset
                </button>
              </>
            )}
          </div>
        </div>

        {/* Clean Responsive Tab Switcher */}
        <div className="tabs" style={{ marginBottom: "16px" }}>
          <button className={`tab${tab === "assigned" ? " active" : ""}`} onClick={() => setTab("assigned")}>
            Assigned ({planned.length})
          </button>
          <button className={`tab${tab === "history" ? " active" : ""}`} onClick={() => setTab("history")}>
            History ({completed.length})
          </button>
          <button className={`tab${tab === "analytics" ? " active" : ""}`} onClick={() => setTab("analytics")}>
            Progress &amp; PRs
          </button>
        </div>

        {/* TAB 1: Assigned Workouts */}
        {tab === "assigned" && (
          <div className="card" style={{ padding: "16px 18px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
              <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 800 }}>Assigned Routines from Coach</h3>
              <span style={{ fontSize: "11px", fontWeight: 700, color: "#2563eb", background: "#eff6ff", padding: "3px 8px", borderRadius: "10px" }}>
                {planned.length} Active
              </span>
            </div>

            {loading && (
              <div className="empty-state">
                <div className="spin-inline" /> Loading assigned workouts...
              </div>
            )}

            {!loading && !planned.length && (
              <div className="empty-state" style={{ padding: "32px 16px" }}>
                <Dumbbell size={32} style={{ opacity: 0.3, marginBottom: "8px" }} />
                <p style={{ margin: 0, fontWeight: 600, color: "#334155" }}>No pending workouts assigned.</p>
                <span style={{ fontSize: "12px", color: "#64748b" }}>When your coach schedules a routine, it will appear here automatically.</span>
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {planned.map((workout) => (
                <div
                  key={workout.id}
                  style={{
                    background: "#ffffff",
                    border: "1px solid #e2e8f0",
                    borderRadius: "12px",
                    padding: "14px 16px",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px", flexWrap: "wrap", gap: "6px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <Calendar size={14} style={{ color: "#2563eb" }} />
                      <span style={{ fontSize: "13px", fontWeight: 700, color: "#0f172a" }}>
                        Planned Session · {workout.exercises?.length || 0} Exercises
                      </span>
                    </div>
                    <span style={{ fontSize: "11px", color: "#64748b", fontWeight: 500 }}>
                      {new Date(workout.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  {workout.notes && (
                    <div style={{ background: "#f8fafc", padding: "8px 12px", borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "12px", color: "#475569", marginBottom: "10px" }}>
                      <FileText size={12} style={{ display: "inline", verticalAlign: "middle", marginRight: "4px" }} />
                      <b>Coach Notes:</b> {workout.notes}
                    </div>
                  )}

                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    {(workout.exercises || []).map((ex: any, idx: number) => {
                      const isBW = ex.isBodyweight || ex.category === "BODYWEIGHT" || isDefaultBodyweight(ex.name);
                      return (
                        <div
                          key={ex.id || idx}
                          style={{
                            background: "#fafafa",
                            border: "1px solid #f1f5f9",
                            borderRadius: "8px",
                            padding: "8px 10px",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            fontSize: "12px",
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <span style={{ fontWeight: 700, color: "#0f172a" }}>{ex.name}</span>
                            {isBW && (
                              <span
                                style={{
                                  fontSize: "9px",
                                  fontWeight: 700,
                                  background: "#f0fdf4",
                                  color: "#166534",
                                  border: "1px solid #bbf7d0",
                                  padding: "1px 5px",
                                  borderRadius: "4px",
                                }}
                              >
                                Bodyweight
                              </span>
                            )}
                          </div>
                          <span style={{ color: "#64748b", fontWeight: 600 }}>
                            {(ex.sets || []).length} sets
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: Workout History */}
        {tab === "history" && (
          <div className="card" style={{ padding: "16px 18px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
              <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 800 }}>Completed Workout History</h3>
              <span style={{ fontSize: "11px", fontWeight: 700, color: "#16a34a", background: "#f0fdf4", padding: "3px 8px", borderRadius: "10px" }}>
                {completed.length} Completed
              </span>
            </div>

            {!completed.length && (
              <div className="empty-state" style={{ padding: "32px 16px" }}>
                <p style={{ margin: 0, fontWeight: 600, color: "#334155" }}>No completed workouts logged yet.</p>
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {completed.map((workout) => (
                <div
                  key={workout.id}
                  style={{
                    background: "#ffffff",
                    border: "1px solid #e2e8f0",
                    borderRadius: "12px",
                    padding: "14px 16px",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px", flexWrap: "wrap", gap: "6px" }}>
                    <div>
                      <div style={{ fontSize: "13px", fontWeight: 700, color: "#0f172a" }}>
                        {new Date(workout.completedAt || workout.createdAt).toLocaleString()}
                      </div>
                      <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>
                        {workout.loggedByRole === "CLIENT"
                          ? `👤 Logged by You${workout.loggedByName ? ` (${workout.loggedByName})` : ""}`
                          : `🏋️ Logged by Coach${workout.loggedByName ? ` (${workout.loggedByName})` : ""}`}
                      </div>
                    </div>
                    <span style={{ fontSize: "11px", fontWeight: 700, color: "#16a34a", background: "#f0fdf4", padding: "2px 8px", borderRadius: "8px" }}>
                      ✓ Finished
                    </span>
                  </div>

                  {workout.notes && (
                    <div style={{ fontSize: "12px", color: "#64748b", fontStyle: "italic", marginBottom: "8px" }}>
                      &ldquo;{workout.notes}&rdquo;
                    </div>
                  )}

                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    {(workout.exercises || []).map((ex: any) => {
                      const isBW = ex.isBodyweight || ex.category === "BODYWEIGHT" || isDefaultBodyweight(ex.name);
                      return (
                        <div key={ex.id} style={{ background: "#fafafa", borderRadius: "8px", padding: "8px 10px", border: "1px solid #f1f5f9" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                            <span style={{ fontWeight: 700, fontSize: "12px", color: "#0f172a" }}>{ex.name}</span>
                            {isBW && (
                              <span
                                style={{
                                  fontSize: "9px",
                                  fontWeight: 700,
                                  background: "#f0fdf4",
                                  color: "#166534",
                                  border: "1px solid #bbf7d0",
                                  padding: "1px 5px",
                                  borderRadius: "4px",
                                }}
                              >
                                Bodyweight
                              </span>
                            )}
                          </div>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                            {(ex.sets || []).map((st: any) => (
                              <span
                                key={st.id}
                                style={{
                                  background: "#ffffff",
                                  border: "1px solid #e2e8f0",
                                  padding: "2px 6px",
                                  borderRadius: "4px",
                                  fontSize: "11px",
                                  color: "#334155",
                                }}
                              >
                                Set {st.order + 1}:{" "}
                                {isBW ? (
                                  st.weight > 0 ? (
                                    <><b>BW + {st.weight} lbs</b> × <b>{st.reps}</b></>
                                  ) : (
                                    <><b>BW</b> × <b>{st.reps}</b></>
                                  )
                                ) : (
                                  <><b>{st.weight}</b> lbs × <b>{st.reps}</b></>
                                )}
                              </span>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: Analytics & PRs */}
        {tab === "analytics" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <AnalyticsView analytics={fullAnalytics} />
          </div>
        )}
      </main>

      {/* Photo Change Modal */}
      {showPhotoModal && (
        <div className="client-modal-backdrop" onClick={() => setShowPhotoModal(false)}>
          <div className="client-modal-card" style={{ maxWidth: "420px" }} onClick={(e) => e.stopPropagation()}>
            <div className="client-modal-header">
              <div className="client-modal-header-info">
                <h2 className="client-modal-title">Change Profile Photo</h2>
                <p className="client-modal-subtitle">Upload your picture or pick an athletic avatar.</p>
              </div>
              <button className="client-modal-close" onClick={() => setShowPhotoModal(false)}>
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: "20px 24px" }}>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: "20px" }}>
                {currentImage ? (
                  <img
                    src={currentImage}
                    alt={userName}
                    style={{ width: "80px", height: "80px", borderRadius: "50%", objectFit: "cover", border: "3px solid #2563eb" }}
                  />
                ) : (
                  <div
                    style={{
                      width: "80px",
                      height: "80px",
                      borderRadius: "50%",
                      background: "#2563eb",
                      color: "#ffffff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "32px",
                      fontWeight: 700,
                    }}
                  >
                    {userName ? userName.charAt(0).toUpperCase() : <User size={40} />}
                  </div>
                )}
              </div>

              {/* Upload Local Image */}
              <div style={{ marginBottom: "20px", textAlign: "center" }}>
                <label
                  htmlFor="profile-upload-input"
                  className="btn-primary"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "8px 16px",
                    fontSize: "12px",
                    cursor: "pointer",
                  }}
                >
                  <Camera size={14} />
                  <span>Upload from Device</span>
                  <input
                    id="profile-upload-input"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    style={{ display: "none" }}
                  />
                </label>
              </div>

              {/* Preset Avatars */}
              <div>
                <div style={{ fontSize: "12px", fontWeight: 700, color: "#0f172a", marginBottom: "10px" }}>
                  Or Choose an Athletic Avatar:
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px" }}>
                  {CLIENT_PRESETS.map((presetUrl, idx) => (
                    <img
                      key={idx}
                      src={presetUrl}
                      alt={`Avatar ${idx + 1}`}
                      onClick={() => handleUpdatePhoto(presetUrl)}
                      style={{
                        width: "100%",
                        height: "70px",
                        borderRadius: "10px",
                        objectFit: "cover",
                        cursor: "pointer",
                        border: currentImage === presetUrl ? "3px solid #2563eb" : "1px solid #e2e8f0",
                        transition: "all 0.15s ease",
                      }}
                    />
                  ))}
                </div>
              </div>

              {savingPhoto && (
                <div style={{ textAlign: "center", marginTop: "14px", fontSize: "12px", color: "#64748b" }}>
                  <div className="spin-inline" /> Saving new photo...
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Plate Loading Calculator Modal */}
      {showPlateModal && (
        <PlateCalculatorModal
          initialWeight={135}
          onClose={() => setShowPlateModal(false)}
        />
      )}
    </div>
  );
}

export default ClientDashboard;
