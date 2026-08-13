"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { signOut } from "next-auth/react";
import { LogOut, TrendingUp, Dumbbell, Camera, User, Check, X, ShieldCheck } from "lucide-react";
import Link from "next/link";

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
  const [savingPhoto, setSavingPhoto] = useState(false);

  const fetchWorkouts = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/workouts/client");
    if (res.ok) {
      setWorkouts(await res.json());
    }
    setLoading(false);
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
    } catch (e) {
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

  return (
    <div className="app">
      {/* App Header */}
      <header className="header">
        <div className="header-left">
          <Dumbbell size={22} />
          <span className="header-title">Client Workout Portal</span>
        </div>
        <div className="header-right" style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {isAdmin && (
            <Link
              href="/admin"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "4px",
                fontSize: "12px",
                fontWeight: 600,
                background: "#0f172a",
                color: "#38bdf8",
                padding: "6px 12px",
                borderRadius: "6px",
                border: "1px solid #1e293b",
                textDecoration: "none",
              }}
            >
              <ShieldCheck size={15} />
              <span className="hide-mobile">Admin Portal</span>
            </Link>
          )}
          {/* Nutrition & Macros */}
          <Link
            href="/nutrition"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              fontSize: "12px",
              fontWeight: 600,
              background: "#f0fdf4",
              color: "#16a34a",
              padding: "6px 12px",
              borderRadius: "6px",
              border: "1px solid #bbf7d0",
              textDecoration: "none",
            }}
          >
            <span>🥗</span>
            <span className="hide-mobile">Nutrition</span>
          </Link>

          <Link
            href="/onboarding"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              fontSize: "12px",
              fontWeight: 600,
              background: "#f1f5f9",
              color: "#475569",
              padding: "6px 12px",
              borderRadius: "6px",
              border: "1px solid #cbd5e1",
              textDecoration: "none",
            }}
          >
            <span className="hide-mobile">Switch Role</span>
          </Link>

          {/* Client Avatar with Click to Change */}
          <div
            onClick={() => setShowPhotoModal(true)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
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
                style={{ width: "30px", height: "30px", borderRadius: "50%", objectFit: "cover", border: "1px solid #cbd5e1" }}
              />
            ) : (
              <div
                style={{
                  width: "30px",
                  height: "30px",
                  borderRadius: "50%",
                  background: "#16a34a",
                  color: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "12px",
                  fontWeight: 700,
                }}
              >
                {userName ? userName.charAt(0).toUpperCase() : <User size={16} />}
              </div>
            )}
            <span className="header-name">{userName}</span>
          </div>

          <button className="signout-btn" onClick={() => signOut({ callbackUrl: "/auth/signin" })} title="Sign out">
            <LogOut size={16} />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="main" style={{ maxWidth: "900px", margin: "24px auto", padding: "0 16px" }}>
        {/* Free Portal Access Badge */}
        <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#15803d", padding: "10px 16px", borderRadius: "10px", marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px" }}>
          <div>
            <b>Client Portal Active:</b> You have 100% free access to all routines assigned by your coach.
          </div>
          <button
            onClick={() => setShowPhotoModal(true)}
            style={{ background: "#ffffff", color: "#15803d", border: "1px solid #bbf7d0", padding: "4px 10px", borderRadius: "6px", fontWeight: 600, fontSize: "11px", cursor: "pointer" }}
          >
            Change Photo
          </button>
        </div>

        <div className="tabs" style={{ marginBottom: "20px" }}>
          <button className={`tab${tab === "assigned" ? " active" : ""}`} onClick={() => setTab("assigned")}>
            Assigned Workouts ({planned.length})
          </button>
          <button className={`tab${tab === "history" ? " active" : ""}`} onClick={() => setTab("history")}>
            History ({completed.length})
          </button>
          <button className={`tab${tab === "analytics" ? " active" : ""}`} onClick={() => setTab("analytics")}>
            Analytics
          </button>
        </div>

        {tab === "assigned" && (
          <div className="card">
            <h3 className="section-title">Assigned Workouts from Trainer</h3>
            {loading && <div className="empty-state">Loading routines...</div>}
            {!loading && !planned.length && (
              <div className="empty-state">No assigned workouts right now. Check back when your trainer assigns a routine!</div>
            )}
            {planned.map((workout) => (
              <div key={workout.id} className="history-card" style={{ marginBottom: "16px" }}>
                <div className="history-card-header">
                  <div>
                    <div className="history-date">Planned Routine · {workout.exercises.length} Exercises</div>
                    <div className="history-meta">{new Date(workout.createdAt).toLocaleDateString()}</div>
                  </div>
                </div>
                {workout.exercises.map((ex: any) => (
                  <div key={ex.id} className="history-exercise">
                    <div className="history-exercise-name">
                      {ex.name} ({ex.sets.length} sets)
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        {tab === "history" && (
          <div className="card">
            <h3 className="section-title">Workout History</h3>
            {!completed.length && <div className="empty-state">No completed workouts yet.</div>}
            {completed.map((workout) => (
              <div key={workout.id} className="history-card" style={{ marginBottom: "16px" }}>
                <div className="history-card-header">
                  <div className="history-date">
                    {new Date(workout.completedAt || workout.createdAt).toLocaleString()}
                  </div>
                </div>
                {workout.exercises.map((ex: any) => (
                  <div key={ex.id} className="history-exercise">
                    <div className="history-exercise-name">{ex.name}</div>
                    {ex.sets.map((st: any) => (
                      <div key={st.id} className="history-set-row">
                        <span>
                          Set {st.order + 1}: {st.weight} lbs x {st.reps} reps
                        </span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        {tab === "analytics" && (
          <div className="card">
            <h3 className="section-title">
              <TrendingUp size={16} /> Progress & PRs
            </h3>
            <p style={{ fontSize: "14px", color: "#666" }}>Completed workouts: {completed.length}</p>
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
                <p className="client-modal-subtitle">Upload a picture or select an athletic avatar.</p>
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
                      fontSize: "28px",
                      fontWeight: 700,
                    }}
                  >
                    {userName ? userName.charAt(0).toUpperCase() : <User size={36} />}
                  </div>
                )}
              </div>

              <label
                htmlFor="client-file-upload"
                className="btn-primary"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  width: "100%",
                  padding: "10px",
                  cursor: "pointer",
                  marginBottom: "16px",
                }}
              >
                <Camera size={15} />
                <span>Upload From Device</span>
                <input
                  id="client-file-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  style={{ display: "none" }}
                />
              </label>

              <div style={{ fontSize: "12px", color: "#64748b", textAlign: "center", marginBottom: "10px" }}>
                Or pick an avatar preset:
              </div>

              <div style={{ display: "flex", gap: "8px", justifyContent: "center", flexWrap: "wrap", marginBottom: "20px" }}>
                {CLIENT_PRESETS.map((url, idx) => (
                  <img
                    key={idx}
                    src={url}
                    alt=""
                    onClick={() => handleUpdatePhoto(url)}
                    style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "50%",
                      cursor: "pointer",
                      border: currentImage === url ? "2px solid #2563eb" : "1px solid #cbd5e1",
                    }}
                  />
                ))}
              </div>

              <button
                type="button"
                onClick={() => setShowPhotoModal(false)}
                className="btn-secondary"
                style={{ width: "100%" }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
