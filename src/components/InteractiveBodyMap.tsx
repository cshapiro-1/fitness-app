"use client";

import React, { useState } from "react";
import { Eye } from "lucide-react";

export type MuscleGroupId =
  | "chest"
  | "shoulders"
  | "biceps"
  | "triceps"
  | "forearms"
  | "traps"
  | "lats"
  | "lower_back"
  | "abs"
  | "obliques"
  | "glutes"
  | "quads"
  | "hamstrings"
  | "adductors"
  | "calves"
  | "tibialis";

export interface MuscleInfo {
  id: MuscleGroupId;
  name: string;
  category: "CHEST" | "BACK" | "LEGS" | "SHOULDERS" | "ARMS" | "CORE";
  subMuscles: string[];
  view: "anterior" | "posterior" | "both";
  primaryRole: string;
  commonTightness: string;
  color: string;
}

export const MUSCLE_DEFINITIONS: Record<MuscleGroupId, MuscleInfo> = {
  chest: {
    id: "chest",
    name: "Chest (Pectorals)",
    category: "CHEST",
    subMuscles: ["Pectoralis Major (Sternal Head)", "Pectoralis Major (Clavicular Head)", "Pectoralis Minor", "Serratus Anterior"],
    view: "anterior",
    primaryRole: "Horizontal shoulder adduction, internal rotation, and pushing power.",
    commonTightness: "Shortened in desk workers and bench-heavy lifters, pulling shoulders forward into internal rotation.",
    color: "#00f5ff",
  },
  shoulders: {
    id: "shoulders",
    name: "Shoulders (Deltoids)",
    category: "SHOULDERS",
    subMuscles: ["Anterior Deltoid", "Lateral Deltoid (Middle Head)", "Posterior Deltoid (Rear Head)", "Rotator Cuff (Supraspinatus, Infraspinatus)"],
    view: "both",
    primaryRole: "Arm abduction, forward flexion, horizontal abduction, and 360° glenohumeral stability.",
    commonTightness: "Anterior dominance with weak rear deltoids creates shoulder impingement and poor overhead mechanics.",
    color: "#00f5ff",
  },
  biceps: {
    id: "biceps",
    name: "Biceps & Brachialis",
    category: "ARMS",
    subMuscles: ["Biceps Brachii (Short Head)", "Biceps Brachii (Long Head)", "Brachialis", "Brachioradialis"],
    view: "anterior",
    primaryRole: "Elbow flexion, forearm supination (turning palm up), and shoulder stabilization.",
    commonTightness: "Distal bicep tendon strain and shortened elbow flexion from excessive typing or heavy pulling.",
    color: "#00f5ff",
  },
  triceps: {
    id: "triceps",
    name: "Triceps Brachii",
    category: "ARMS",
    subMuscles: ["Triceps Brachii (Lateral Head)", "Triceps Brachii (Long Head)", "Triceps Brachii (Medial Head)", "Anconeus"],
    view: "posterior",
    primaryRole: "Elbow extension and shoulder extension (long head stabilization).",
    commonTightness: "Triceps tendon stiffness at olecranon process; long head tightness limits overhead shoulder flexion.",
    color: "#00f5ff",
  },
  forearms: {
    id: "forearms",
    name: "Forearms & Grip",
    category: "ARMS",
    subMuscles: ["Flexor Carpi Radialis/Ulnaris", "Extensor Digitorum", "Pronator Teres", "Brachioradialis"],
    view: "both",
    primaryRole: "Wrist flexion/extension, radial/ulnar deviation, and grip strength.",
    commonTightness: "Medial/lateral epicondylitis ('Golfer's / Tennis Elbow') and wrist stiffness.",
    color: "#00f5ff",
  },
  traps: {
    id: "traps",
    name: "Trapezius & Upper Back",
    category: "BACK",
    subMuscles: ["Upper Trapezius", "Middle Trapezius", "Lower Trapezius", "Levator Scapulae", "Rhomboids"],
    view: "posterior",
    primaryRole: "Scapular elevation, retraction, upward rotation, and thoracic spine stability.",
    commonTightness: "Upper traps carry stress tension; lower traps often underactive leading to poor scapular upward rotation.",
    color: "#00f5ff",
  },
  lats: {
    id: "lats",
    name: "Latissimus Dorsi",
    category: "BACK",
    subMuscles: ["Latissimus Dorsi", "Teres Major", "Thoracolumbar Fascia"],
    view: "posterior",
    primaryRole: "Shoulder adduction, extension, internal rotation, and lumbar spine decompression.",
    commonTightness: "Tight lats restrict overhead reaching and force lumbar spine hyperextension during overhead pressing.",
    color: "#00f5ff",
  },
  lower_back: {
    id: "lower_back",
    name: "Lower Back & Spinal Erectors",
    category: "BACK",
    subMuscles: ["Erector Spinae (Iliocostalis, Longissimus, Spinalis)", "Multifidus", "Quadratus Lumborum (QL)"],
    view: "posterior",
    primaryRole: "Spinal extension, lateral lumbar stabilization, and anti-flexion bracing under heavy axial loads.",
    commonTightness: "Erector over-recruitment compensating for weak glutes/core; deep QL asymmetry causes one-sided low back pain.",
    color: "#00f5ff",
  },
  abs: {
    id: "abs",
    name: "Abs (Rectus Abdominis)",
    category: "CORE",
    subMuscles: ["Rectus Abdominis (Upper & Lower)", "Transverse Abdominis", "Pyramidalis"],
    view: "anterior",
    primaryRole: "Trunk flexion, posterior pelvic tilting, and 360° intra-abdominal pressure.",
    commonTightness: "Weak transverse abdominis allows anterior pelvic tilt; shortened rectus can pull ribcage down into rounded posture.",
    color: "#00f5ff",
  },
  obliques: {
    id: "obliques",
    name: "Obliques & Core Flank",
    category: "CORE",
    subMuscles: ["External Obliques", "Internal Obliques", "Transverse Abdominis", "Quadratus Lumborum"],
    view: "both",
    primaryRole: "Torso rotation, lateral flexion, and anti-rotational spinal protection.",
    commonTightness: "Asymmetrical rotational tightness from dominant-side athletic patterns (golf, baseball, throwing).",
    color: "#00f5ff",
  },
  glutes: {
    id: "glutes",
    name: "Glutes (Maximus & Medius)",
    category: "LEGS",
    subMuscles: ["Gluteus Maximus (Upper/Lower)", "Gluteus Medius", "Gluteus Minimus", "Deep Piriformis"],
    view: "posterior",
    primaryRole: "Hip extension, abduction, external rotation, and pelvic stability during single-leg drive.",
    commonTightness: "'Glute amnesia' from sitting; piriformis tightness compresses sciatic nerve causing radiating pain.",
    color: "#00f5ff",
  },
  quads: {
    id: "quads",
    name: "Quadriceps (Front Thigh)",
    category: "LEGS",
    subMuscles: ["Rectus Femoris", "Vastus Lateralis (Outer Sweep)", "Vastus Medialis (Teardrop)", "Vastus Intermedius", "Iliopsoas"],
    view: "anterior",
    primaryRole: "Knee extension and hip flexion (Rectus Femoris); absorbing landing impact and driving vertical force.",
    commonTightness: "Shortened hip flexors and rectus femoris pull pelvis into anterior tilt, inhibiting glute firing.",
    color: "#00f5ff",
  },
  hamstrings: {
    id: "hamstrings",
    name: "Hamstrings (Posterior Thigh)",
    category: "LEGS",
    subMuscles: ["Biceps Femoris (Long & Short Heads)", "Semitendinosus", "Semimembranosus"],
    view: "posterior",
    primaryRole: "Knee flexion, hip extension, and decelerating forward running speed.",
    commonTightness: "Often feels tight but is actually 'locked-long' due to anterior pelvic tilt; requires eccentric strengthening.",
    color: "#00f5ff",
  },
  adductors: {
    id: "adductors",
    name: "Adductors (Inner Thigh / Groin)",
    category: "LEGS",
    subMuscles: ["Adductor Magnus", "Adductor Longus", "Adductor Brevis", "Gracilis", "Pectineus"],
    view: "anterior",
    primaryRole: "Hip adduction, hip flexion/extension assistance, and deep squat stabilization.",
    commonTightness: "Tight adductors pull knees inward (knee valgus) during squats and lunges, limiting hip mobility.",
    color: "#00f5ff",
  },
  calves: {
    id: "calves",
    name: "Calves (Gastrocnemius & Soleus)",
    category: "LEGS",
    subMuscles: ["Gastrocnemius (Medial & Lateral Heads)", "Soleus", "Plantaris", "Achilles Tendon"],
    view: "posterior",
    primaryRole: "Plantarflexion, ankle stabilization, and elastic energy return in sprinting and jumping.",
    commonTightness: "Tight soleus limits ankle dorsiflexion, causing heels to rise or torso to collapse forward in squats.",
    color: "#00f5ff",
  },
  tibialis: {
    id: "tibialis",
    name: "Tibialis Anterior (Shins & Ankles)",
    category: "LEGS",
    subMuscles: ["Tibialis Anterior", "Extensor Digitorum Longus", "Peroneus Longus/Brevis"],
    view: "anterior",
    primaryRole: "Ankle dorsiflexion, foot inversion, and absorbing heel-strike forces.",
    commonTightness: "Weakness causes shin splints and poor knee tracking; tightness reduces ankle articulation.",
    color: "#00f5ff",
  },
};

interface InteractiveBodyMapProps {
  selectedMuscle: MuscleGroupId | null;
  onSelectMuscle: (muscle: MuscleGroupId) => void;
  hoveredMuscle?: MuscleGroupId | null;
  onHoverMuscle?: (muscle: MuscleGroupId | null) => void;
  className?: string;
  isDark?: boolean;
}

export function InteractiveBodyMap({
  selectedMuscle,
  onSelectMuscle,
  hoveredMuscle,
  onHoverMuscle,
  className = "",
  isDark = true,
}: InteractiveBodyMapProps) {
  const [view, setView] = useState<"anterior" | "posterior">("anterior");

  const getFill = (id: MuscleGroupId) => {
    const isSelected = selectedMuscle === id;
    const isHovered = hoveredMuscle === id;

    if (isSelected) return "#00f5ff";
    if (isHovered) return "#38bdf8";
    return isDark ? "#334155" : "#cbd5e1";
  };

  const getOpacity = (id: MuscleGroupId) => {
    const isSelected = selectedMuscle === id;
    const isHovered = hoveredMuscle === id;
    if (isSelected) return 0.95;
    if (isHovered) return 0.85;
    return isDark ? 0.45 : 0.6;
  };

  const getStroke = (id: MuscleGroupId) => {
    if (selectedMuscle === id) return "#ffffff";
    if (hoveredMuscle === id) return "#00f5ff";
    return isDark ? "#475569" : "#94a3b8";
  };

  return (
    <div
      data-testid="interactive-body-map"
      className={`relative flex flex-col items-center select-none rounded-2xl p-4 transition-all duration-300 ${
        isDark ? "bg-slate-900/90 border border-slate-800 shadow-2xl text-slate-100" : "bg-white border border-slate-200 shadow-xl text-slate-900"
      } ${className}`}
    >
      {/* Top View Toggle */}
      <div className="w-full flex items-center justify-between mb-4 pb-3 border-b border-slate-800/60">
        <div className="flex items-center gap-2">
          <span className="inline-flex p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Eye size={16} />
          </span>
          <div>
            <h3 className="text-sm font-bold tracking-tight">Anatomical Body Map</h3>
            <p className="text-[11px] text-slate-400">Click any muscle to isolate and view exercises</p>
          </div>
        </div>

        <div className="inline-flex rounded-xl p-1 bg-slate-800/80 border border-slate-700/60">
          <button
            type="button"
            data-testid="toggle-anterior"
            onClick={() => setView("anterior")}
            className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
              view === "anterior"
                ? "bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Anterior (Front)
          </button>
          <button
            type="button"
            data-testid="toggle-posterior"
            onClick={() => setView("posterior")}
            className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
              view === "posterior"
                ? "bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Posterior (Back)
          </button>
        </div>
      </div>

      {/* SVG Canvas */}
      <div className="relative w-full max-w-[340px] aspect-[1/1.9] flex items-center justify-center">
        <svg
          viewBox="0 0 300 580"
          className="w-full h-full drop-shadow-md"
          style={{ filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.4))" }}
        >
          {/* Base Silhouette Outline */}
          <g opacity={isDark ? "0.2" : "0.15"} fill="currentColor">
            <circle cx="150" cy="45" r="28" />
            <path d="M138 72 L162 72 L168 95 L132 95 Z" />
            <path d="M100 95 L200 95 L225 140 L210 260 L195 290 L105 290 L90 260 L75 140 Z" />
            <path d="M75 120 L50 200 L40 270 L35 340 L55 340 L65 270 L75 200 Z" />
            <path d="M225 120 L250 200 L260 270 L265 340 L245 340 L235 270 L225 200 Z" />
            <path d="M105 290 L95 410 L100 520 L95 560 L135 560 L140 520 L145 410 L148 290 Z" />
            <path d="M195 290 L205 410 L200 520 L205 560 L165 560 L160 520 L155 410 L152 290 Z" />
          </g>

          {view === "anterior" ? (
            <g className="transition-all duration-300">
              {/* Shoulders (Front Delts) */}
              <g
                data-testid="muscle-shoulders"
                onClick={() => onSelectMuscle("shoulders")}
                onMouseEnter={() => onHoverMuscle?.("shoulders")}
                onMouseLeave={() => onHoverMuscle?.(null)}
                className="cursor-pointer group"
              >
                <path
                  d="M78 100 Q65 115 62 135 Q72 145 82 135 Q85 115 88 100 Z"
                  fill={getFill("shoulders")}
                  fillOpacity={getOpacity("shoulders")}
                  stroke={getStroke("shoulders")}
                  strokeWidth="1.5"
                  className="transition-all duration-200"
                />
                <path
                  d="M222 100 Q235 115 238 135 Q228 145 218 135 Q215 115 212 100 Z"
                  fill={getFill("shoulders")}
                  fillOpacity={getOpacity("shoulders")}
                  stroke={getStroke("shoulders")}
                  strokeWidth="1.5"
                  className="transition-all duration-200"
                />
              </g>

              {/* Chest (Pectoralis Major) */}
              <g
                data-testid="muscle-chest"
                onClick={() => onSelectMuscle("chest")}
                onMouseEnter={() => onHoverMuscle?.("chest")}
                onMouseLeave={() => onHoverMuscle?.(null)}
                className="cursor-pointer group"
              >
                <path
                  d="M148 105 L95 105 Q85 130 92 155 Q125 165 148 145 Z"
                  fill={getFill("chest")}
                  fillOpacity={getOpacity("chest")}
                  stroke={getStroke("chest")}
                  strokeWidth="1.5"
                  className="transition-all duration-200"
                />
                <path
                  d="M152 105 L205 105 Q215 130 208 155 Q175 165 152 145 Z"
                  fill={getFill("chest")}
                  fillOpacity={getOpacity("chest")}
                  stroke={getStroke("chest")}
                  strokeWidth="1.5"
                  className="transition-all duration-200"
                />
              </g>

              {/* Biceps */}
              <g
                data-testid="muscle-biceps"
                onClick={() => onSelectMuscle("biceps")}
                onMouseEnter={() => onHoverMuscle?.("biceps")}
                onMouseLeave={() => onHoverMuscle?.(null)}
                className="cursor-pointer group"
              >
                <path
                  d="M60 142 Q52 170 56 198 Q68 198 72 170 Q70 142 60 142 Z"
                  fill={getFill("biceps")}
                  fillOpacity={getOpacity("biceps")}
                  stroke={getStroke("biceps")}
                  strokeWidth="1.5"
                  className="transition-all duration-200"
                />
                <path
                  d="M240 142 Q248 170 244 198 Q232 198 228 170 Q230 142 240 142 Z"
                  fill={getFill("biceps")}
                  fillOpacity={getOpacity("biceps")}
                  stroke={getStroke("biceps")}
                  strokeWidth="1.5"
                  className="transition-all duration-200"
                />
              </g>

              {/* Forearms (Anterior) */}
              <g
                data-testid="muscle-forearms"
                onClick={() => onSelectMuscle("forearms")}
                onMouseEnter={() => onHoverMuscle?.("forearms")}
                onMouseLeave={() => onHoverMuscle?.(null)}
                className="cursor-pointer group"
              >
                <path
                  d="M54 205 Q44 240 40 280 Q52 280 60 240 Q62 205 54 205 Z"
                  fill={getFill("forearms")}
                  fillOpacity={getOpacity("forearms")}
                  stroke={getStroke("forearms")}
                  strokeWidth="1.5"
                  className="transition-all duration-200"
                />
                <path
                  d="M246 205 Q256 240 260 280 Q248 280 240 240 Q238 205 246 205 Z"
                  fill={getFill("forearms")}
                  fillOpacity={getOpacity("forearms")}
                  stroke={getStroke("forearms")}
                  strokeWidth="1.5"
                  className="transition-all duration-200"
                />
              </g>

              {/* Abs (Rectus Abdominis) */}
              <g
                data-testid="muscle-abs"
                onClick={() => onSelectMuscle("abs")}
                onMouseEnter={() => onHoverMuscle?.("abs")}
                onMouseLeave={() => onHoverMuscle?.(null)}
                className="cursor-pointer group"
              >
                <rect x="130" y="152" width="18" height="22" rx="4" fill={getFill("abs")} fillOpacity={getOpacity("abs")} stroke={getStroke("abs")} strokeWidth="1.2" />
                <rect x="152" y="152" width="18" height="22" rx="4" fill={getFill("abs")} fillOpacity={getOpacity("abs")} stroke={getStroke("abs")} strokeWidth="1.2" />
                <rect x="130" y="178" width="18" height="24" rx="4" fill={getFill("abs")} fillOpacity={getOpacity("abs")} stroke={getStroke("abs")} strokeWidth="1.2" />
                <rect x="152" y="178" width="18" height="24" rx="4" fill={getFill("abs")} fillOpacity={getOpacity("abs")} stroke={getStroke("abs")} strokeWidth="1.2" />
                <rect x="132" y="206" width="16" height="28" rx="4" fill={getFill("abs")} fillOpacity={getOpacity("abs")} stroke={getStroke("abs")} strokeWidth="1.2" />
                <rect x="152" y="206" width="16" height="28" rx="4" fill={getFill("abs")} fillOpacity={getOpacity("abs")} stroke={getStroke("abs")} strokeWidth="1.2" />
              </g>

              {/* Obliques */}
              <g
                data-testid="muscle-obliques"
                onClick={() => onSelectMuscle("obliques")}
                onMouseEnter={() => onHoverMuscle?.("obliques")}
                onMouseLeave={() => onHoverMuscle?.(null)}
                className="cursor-pointer group"
              >
                <path
                  d="M102 165 L125 170 L125 235 L112 245 Q98 200 102 165 Z"
                  fill={getFill("obliques")}
                  fillOpacity={getOpacity("obliques")}
                  stroke={getStroke("obliques")}
                  strokeWidth="1.5"
                  className="transition-all duration-200"
                />
                <path
                  d="M198 165 L175 170 L175 235 L188 245 Q202 200 198 165 Z"
                  fill={getFill("obliques")}
                  fillOpacity={getOpacity("obliques")}
                  stroke={getStroke("obliques")}
                  strokeWidth="1.5"
                  className="transition-all duration-200"
                />
              </g>

              {/* Quadriceps (Front Thigh) */}
              <g
                data-testid="muscle-quads"
                onClick={() => onSelectMuscle("quads")}
                onMouseEnter={() => onHoverMuscle?.("quads")}
                onMouseLeave={() => onHoverMuscle?.(null)}
                className="cursor-pointer group"
              >
                <path
                  d="M105 260 Q88 320 95 385 Q115 390 128 385 Q135 320 128 260 Z"
                  fill={getFill("quads")}
                  fillOpacity={getOpacity("quads")}
                  stroke={getStroke("quads")}
                  strokeWidth="1.5"
                  className="transition-all duration-200"
                />
                <path
                  d="M195 260 Q212 320 205 385 Q185 390 172 385 Q165 320 172 260 Z"
                  fill={getFill("quads")}
                  fillOpacity={getOpacity("quads")}
                  stroke={getStroke("quads")}
                  strokeWidth="1.5"
                  className="transition-all duration-200"
                />
              </g>

              {/* Adductors (Inner Thigh) */}
              <g
                data-testid="muscle-adductors"
                onClick={() => onSelectMuscle("adductors")}
                onMouseEnter={() => onHoverMuscle?.("adductors")}
                onMouseLeave={() => onHoverMuscle?.(null)}
                className="cursor-pointer group"
              >
                <path
                  d="M130 270 Q145 320 138 375 L130 375 Q135 320 130 270 Z"
                  fill={getFill("adductors")}
                  fillOpacity={getOpacity("adductors")}
                  stroke={getStroke("adductors")}
                  strokeWidth="1.2"
                  className="transition-all duration-200"
                />
                <path
                  d="M170 270 Q155 320 162 375 L170 375 Q165 320 170 270 Z"
                  fill={getFill("adductors")}
                  fillOpacity={getOpacity("adductors")}
                  stroke={getStroke("adductors")}
                  strokeWidth="1.2"
                  className="transition-all duration-200"
                />
              </g>

              {/* Tibialis Anterior & Front Shins */}
              <g
                data-testid="muscle-tibialis"
                onClick={() => onSelectMuscle("tibialis")}
                onMouseEnter={() => onHoverMuscle?.("tibialis")}
                onMouseLeave={() => onHoverMuscle?.(null)}
                className="cursor-pointer group"
              >
                <path
                  d="M102 405 Q96 460 102 515 Q115 515 120 460 Q118 405 102 405 Z"
                  fill={getFill("tibialis")}
                  fillOpacity={getOpacity("tibialis")}
                  stroke={getStroke("tibialis")}
                  strokeWidth="1.5"
                  className="transition-all duration-200"
                />
                <path
                  d="M198 405 Q204 460 198 515 Q185 515 180 460 Q182 405 198 405 Z"
                  fill={getFill("tibialis")}
                  fillOpacity={getOpacity("tibialis")}
                  stroke={getStroke("tibialis")}
                  strokeWidth="1.5"
                  className="transition-all duration-200"
                />
              </g>
            </g>
          ) : (
            <g className="transition-all duration-300">
              {/* Traps & Upper Back */}
              <g
                data-testid="muscle-traps"
                onClick={() => onSelectMuscle("traps")}
                onMouseEnter={() => onHoverMuscle?.("traps")}
                onMouseLeave={() => onHoverMuscle?.(null)}
                className="cursor-pointer group"
              >
                <path
                  d="M150 82 L120 100 L115 125 L150 175 L185 125 L180 100 Z"
                  fill={getFill("traps")}
                  fillOpacity={getOpacity("traps")}
                  stroke={getStroke("traps")}
                  strokeWidth="1.5"
                  className="transition-all duration-200"
                />
              </g>

              {/* Rear Deltoids */}
              <g
                data-testid="muscle-reardelts"
                onClick={() => onSelectMuscle("shoulders")}
                onMouseEnter={() => onHoverMuscle?.("shoulders")}
                onMouseLeave={() => onHoverMuscle?.(null)}
                className="cursor-pointer group"
              >
                <path
                  d="M78 102 Q65 118 64 138 Q75 145 85 135 Q86 118 88 102 Z"
                  fill={getFill("shoulders")}
                  fillOpacity={getOpacity("shoulders")}
                  stroke={getStroke("shoulders")}
                  strokeWidth="1.5"
                  className="transition-all duration-200"
                />
                <path
                  d="M222 102 Q235 118 236 138 Q225 145 215 135 Q214 118 212 102 Z"
                  fill={getFill("shoulders")}
                  fillOpacity={getOpacity("shoulders")}
                  stroke={getStroke("shoulders")}
                  strokeWidth="1.5"
                  className="transition-all duration-200"
                />
              </g>

              {/* Triceps */}
              <g
                data-testid="muscle-triceps"
                onClick={() => onSelectMuscle("triceps")}
                onMouseEnter={() => onHoverMuscle?.("triceps")}
                onMouseLeave={() => onHoverMuscle?.(null)}
                className="cursor-pointer group"
              >
                <path
                  d="M60 142 Q52 172 55 200 Q66 200 70 172 Q68 142 60 142 Z"
                  fill={getFill("triceps")}
                  fillOpacity={getOpacity("triceps")}
                  stroke={getStroke("triceps")}
                  strokeWidth="1.5"
                  className="transition-all duration-200"
                />
                <path
                  d="M240 142 Q248 172 245 200 Q234 200 230 172 Q232 142 240 142 Z"
                  fill={getFill("triceps")}
                  fillOpacity={getOpacity("triceps")}
                  stroke={getStroke("triceps")}
                  strokeWidth="1.5"
                  className="transition-all duration-200"
                />
              </g>

              {/* Latissimus Dorsi (Lats) */}
              <g
                data-testid="muscle-lats"
                onClick={() => onSelectMuscle("lats")}
                onMouseEnter={() => onHoverMuscle?.("lats")}
                onMouseLeave={() => onHoverMuscle?.(null)}
                className="cursor-pointer group"
              >
                <path
                  d="M112 135 Q95 165 104 215 L145 215 L145 178 Z"
                  fill={getFill("lats")}
                  fillOpacity={getOpacity("lats")}
                  stroke={getStroke("lats")}
                  strokeWidth="1.5"
                  className="transition-all duration-200"
                />
                <path
                  d="M188 135 Q205 165 196 215 L155 215 L155 178 Z"
                  fill={getFill("lats")}
                  fillOpacity={getOpacity("lats")}
                  stroke={getStroke("lats")}
                  strokeWidth="1.5"
                  className="transition-all duration-200"
                />
              </g>

              {/* Lower Back / Spinal Erectors */}
              <g
                data-testid="muscle-lower_back"
                onClick={() => onSelectMuscle("lower_back")}
                onMouseEnter={() => onHoverMuscle?.("lower_back")}
                onMouseLeave={() => onHoverMuscle?.(null)}
                className="cursor-pointer group"
              >
                <path
                  d="M135 218 L165 218 L160 262 L140 262 Z"
                  fill={getFill("lower_back")}
                  fillOpacity={getOpacity("lower_back")}
                  stroke={getStroke("lower_back")}
                  strokeWidth="1.5"
                  className="transition-all duration-200"
                />
              </g>

              {/* Glutes (Maximus & Medius) */}
              <g
                data-testid="muscle-glutes"
                onClick={() => onSelectMuscle("glutes")}
                onMouseEnter={() => onHoverMuscle?.("glutes")}
                onMouseLeave={() => onHoverMuscle?.(null)}
                className="cursor-pointer group"
              >
                <path
                  d="M102 265 Q96 305 145 315 L147 265 Z"
                  fill={getFill("glutes")}
                  fillOpacity={getOpacity("glutes")}
                  stroke={getStroke("glutes")}
                  strokeWidth="1.5"
                  className="transition-all duration-200"
                />
                <path
                  d="M198 265 Q204 305 155 315 L153 265 Z"
                  fill={getFill("glutes")}
                  fillOpacity={getOpacity("glutes")}
                  stroke={getStroke("glutes")}
                  strokeWidth="1.5"
                  className="transition-all duration-200"
                />
              </g>

              {/* Hamstrings */}
              <g
                data-testid="muscle-hamstrings"
                onClick={() => onSelectMuscle("hamstrings")}
                onMouseEnter={() => onHoverMuscle?.("hamstrings")}
                onMouseLeave={() => onHoverMuscle?.(null)}
                className="cursor-pointer group"
              >
                <path
                  d="M100 322 Q94 365 102 390 Q122 390 138 385 Q142 345 138 322 Z"
                  fill={getFill("hamstrings")}
                  fillOpacity={getOpacity("hamstrings")}
                  stroke={getStroke("hamstrings")}
                  strokeWidth="1.5"
                  className="transition-all duration-200"
                />
                <path
                  d="M200 322 Q206 365 198 390 Q178 390 162 385 Q158 345 162 322 Z"
                  fill={getFill("hamstrings")}
                  fillOpacity={getOpacity("hamstrings")}
                  stroke={getStroke("hamstrings")}
                  strokeWidth="1.5"
                  className="transition-all duration-200"
                />
              </g>

              {/* Calves (Gastrocnemius & Soleus) */}
              <g
                data-testid="muscle-calves"
                onClick={() => onSelectMuscle("calves")}
                onMouseEnter={() => onHoverMuscle?.("calves")}
                onMouseLeave={() => onHoverMuscle?.(null)}
                className="cursor-pointer group"
              >
                <path
                  d="M96 405 Q88 450 102 510 Q118 510 126 450 Q122 405 96 405 Z"
                  fill={getFill("calves")}
                  fillOpacity={getOpacity("calves")}
                  stroke={getStroke("calves")}
                  strokeWidth="1.5"
                  className="transition-all duration-200"
                />
                <path
                  d="M204 405 Q212 450 198 510 Q182 510 174 450 Q178 405 204 405 Z"
                  fill={getFill("calves")}
                  fillOpacity={getOpacity("calves")}
                  stroke={getStroke("calves")}
                  strokeWidth="1.5"
                  className="transition-all duration-200"
                />
              </g>
            </g>
          )}
        </svg>
      </div>

      {/* Interactive Muscle Quick Selector Pills */}
      <div className="w-full mt-4 pt-3 border-t border-slate-800/60 flex flex-wrap gap-1.5 justify-center">
        {Object.values(MUSCLE_DEFINITIONS)
          .filter(m => m.view === view || m.view === "both")
          .map(muscle => {
            const isSelected = selectedMuscle === muscle.id;
            return (
              <button
                key={muscle.id}
                type="button"
                data-testid={`pill-${muscle.id}`}
                onClick={() => onSelectMuscle(muscle.id)}
                onMouseEnter={() => onHoverMuscle?.(muscle.id)}
                onMouseLeave={() => onHoverMuscle?.(null)}
                className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border transition-all ${
                  isSelected
                    ? "bg-cyan-500 text-slate-950 border-cyan-400 shadow-md shadow-cyan-500/20"
                    : isDark
                    ? "bg-slate-800/80 text-slate-300 border-slate-700/60 hover:bg-slate-700 hover:text-white"
                    : "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200"
                }`}
              >
                {muscle.name.split(" ")[0]}
              </button>
            );
          })}
      </div>
    </div>
  );
}
