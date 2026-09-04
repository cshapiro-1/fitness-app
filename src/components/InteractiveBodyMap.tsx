"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Rotate3d,
  Play,
  Pause,
  RotateCw,
  Crosshair,
  Activity,
  Layers,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
} from "lucide-react";

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
  pinCoordinates?: {
    anterior?: { x: number; y: number };
    posterior?: { x: number; y: number };
    lateral?: { x: number; y: number };
  };
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
    pinCoordinates: { anterior: { x: 50, y: 25 }, lateral: { x: 42, y: 25 } },
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
    pinCoordinates: { anterior: { x: 28, y: 23 }, posterior: { x: 28, y: 23 }, lateral: { x: 55, y: 23 } },
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
    pinCoordinates: { anterior: { x: 23, y: 34 }, lateral: { x: 52, y: 31 } },
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
    pinCoordinates: { posterior: { x: 23, y: 34 }, lateral: { x: 62, y: 32 } },
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
    pinCoordinates: { anterior: { x: 18, y: 46 }, posterior: { x: 18, y: 46 }, lateral: { x: 50, y: 45 } },
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
    pinCoordinates: { posterior: { x: 50, y: 22 }, lateral: { x: 58, y: 19 } },
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
    pinCoordinates: { posterior: { x: 38, y: 35 }, lateral: { x: 42, y: 35 } },
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
    pinCoordinates: { posterior: { x: 50, y: 44 } },
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
    pinCoordinates: { anterior: { x: 50, y: 36 }, lateral: { x: 42, y: 36 } },
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
    pinCoordinates: { anterior: { x: 38, y: 38 }, posterior: { x: 35, y: 38 }, lateral: { x: 48, y: 39 } },
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
    pinCoordinates: { posterior: { x: 40, y: 51 }, lateral: { x: 46, y: 50 } },
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
    pinCoordinates: { anterior: { x: 38, y: 60 }, lateral: { x: 54, y: 60 } },
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
    pinCoordinates: { posterior: { x: 38, y: 65 }, lateral: { x: 46, y: 64 } },
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
    pinCoordinates: { anterior: { x: 48, y: 56 } },
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
    pinCoordinates: { posterior: { x: 38, y: 82 }, lateral: { x: 44, y: 82 } },
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
    pinCoordinates: { anterior: { x: 38, y: 82 }, lateral: { x: 56, y: 83 } },
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
  // 3D Rotation angle state (0deg = Anterior Front, 90deg = Side Profile, 180deg = Posterior Back, 270deg = Side Profile 2)
  const [rotationAngle, setRotationAngle] = useState<number>(0);
  const [isAutoRotating, setIsAutoRotating] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragStartXRef = useRef<number>(0);
  const startAngleRef = useRef<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Derive current effective view based on rotation angle (0 to 360)
  const normalizedAngle = ((rotationAngle % 360) + 360) % 360;
  
  let currentPerspective: "anterior" | "lateral" | "posterior" = "anterior";
  if (normalizedAngle >= 45 && normalizedAngle < 135) {
    currentPerspective = "lateral";
  } else if (normalizedAngle >= 135 && normalizedAngle < 225) {
    currentPerspective = "posterior";
  } else if (normalizedAngle >= 225 && normalizedAngle < 315) {
    currentPerspective = "lateral";
  } else {
    currentPerspective = "anterior";
  }

  // Auto-rotate 360 loop
  useEffect(() => {
    if (!isAutoRotating) return;
    const interval = setInterval(() => {
      setRotationAngle((prev) => (prev + 1.2) % 360);
    }, 30);
    return () => clearInterval(interval);
  }, [isAutoRotating]);

  // When a muscle is selected, smoothly rotate the 3D model if on the opposite side
  const handleSelectMuscleAndAutoFace = useCallback(
    (muscleId: MuscleGroupId) => {
      onSelectMuscle(muscleId);
      const def = MUSCLE_DEFINITIONS[muscleId];
      if (def) {
        if (def.view === "posterior" && currentPerspective === "anterior") {
          setRotationAngle(180);
        } else if (def.view === "anterior" && currentPerspective === "posterior") {
          setRotationAngle(0);
        }
      }
    },
    [onSelectMuscle, currentPerspective]
  );

  // Mouse / Touch Drag to Rotate
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setIsAutoRotating(false);
    dragStartXRef.current = e.clientX;
    startAngleRef.current = rotationAngle;
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length > 0) {
      setIsDragging(true);
      setIsAutoRotating(false);
      dragStartXRef.current = e.touches[0].clientX;
      startAngleRef.current = rotationAngle;
    }
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return;
      const deltaX = e.clientX - dragStartXRef.current;
      const newAngle = (startAngleRef.current + deltaX * 0.75 + 360) % 360;
      setRotationAngle(newAngle);
    },
    [isDragging]
  );

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!isDragging || e.touches.length === 0) return;
      const deltaX = e.touches[0].clientX - dragStartXRef.current;
      const newAngle = (startAngleRef.current + deltaX * 0.75 + 360) % 360;
      setRotationAngle(newAngle);
    },
    [isDragging]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      window.addEventListener("touchmove", handleTouchMove);
      window.addEventListener("touchend", handleMouseUp);
    } else {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleTouchMove, handleMouseUp]);

  // Active muscle pin coordinate for current perspective
  const selectedDef = selectedMuscle ? MUSCLE_DEFINITIONS[selectedMuscle] : null;
  const activePin = selectedDef?.pinCoordinates?.[currentPerspective] || null;

  const getOverlayOpacity = (id: MuscleGroupId) => {
    if (selectedMuscle === id) return 0.65;
    if (hoveredMuscle === id) return 0.4;
    return 0.08;
  };

  const getStrokeOpacity = (id: MuscleGroupId) => {
    if (selectedMuscle === id) return 1.0;
    if (hoveredMuscle === id) return 0.8;
    return 0.15;
  };

  return (
    <div
      data-testid="interactive-body-map"
      className={`relative flex flex-col items-center select-none rounded-3xl p-5 transition-all duration-300 ${
        isDark
          ? "bg-slate-900/95 border border-slate-800 shadow-2xl text-slate-100 backdrop-blur-xl"
          : "bg-white border border-slate-200 shadow-xl text-slate-900"
      } ${className}`}
    >
      {/* Top 3D Camera Controls Header */}
      <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <span className="inline-flex p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-md shadow-cyan-500/20">
            <Rotate3d size={18} />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-black tracking-tight text-white">3D Anatomy Turntable</h3>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                360° Interactive
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">Drag body to rotate 360° or click muscles to isolate</p>
          </div>
        </div>

        {/* Quick Perspective Presets & 360 Auto-Rotate Toggle */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-2xl border border-slate-800">
          <button
            type="button"
            data-testid="toggle-anterior"
            onClick={() => setRotationAngle(0)}
            className={`px-3 py-1 text-xs font-black rounded-xl transition-all ${
              currentPerspective === "anterior"
                ? "bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/25"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Front
          </button>
          <button
            type="button"
            onClick={() => setRotationAngle(90)}
            className={`px-3 py-1 text-xs font-black rounded-xl transition-all ${
              currentPerspective === "lateral"
                ? "bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/25"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Side
          </button>
          <button
            type="button"
            data-testid="toggle-posterior"
            onClick={() => setRotationAngle(180)}
            className={`px-3 py-1 text-xs font-black rounded-xl transition-all ${
              currentPerspective === "posterior"
                ? "bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/25"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Back
          </button>

          <button
            type="button"
            onClick={() => setIsAutoRotating(!isAutoRotating)}
            title={isAutoRotating ? "Pause 360° Rotation" : "Auto-Rotate 360°"}
            className={`p-1.5 rounded-xl border transition-all ${
              isAutoRotating
                ? "bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-sm"
                : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            {isAutoRotating ? <Pause size={14} /> : <Play size={14} />}
          </button>
        </div>
      </div>

      {/* 3D Perspective Viewport */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        className="relative w-full max-w-[340px] aspect-[9/16] rounded-3xl overflow-hidden bg-slate-950 border-2 border-slate-800/80 shadow-2xl flex items-center justify-center cursor-grab active:cursor-grabbing group select-none"
        style={{ perspective: "1200px" }}
      >
        {/* 3D Rotating Model Body */}
        <div
          className="relative w-full h-full transition-transform duration-100 ease-out"
          style={{
            transformStyle: "preserve-3d",
            transform: `rotateY(${(rotationAngle % 90) - 45}deg)`,
          }}
        >
          {/* Medical 3D Render Image */}
          <img
            src={
              currentPerspective === "anterior"
                ? "/anatomy/body_anterior.jpg"
                : currentPerspective === "lateral"
                ? "/anatomy/body_lateral.jpg"
                : "/anatomy/body_posterior.jpg"
            }
            alt={`3D Human Anatomy — ${currentPerspective}`}
            className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none"
          />

          {/* Ambient Lighting Vignette */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-slate-950/40 pointer-events-none" />

          {/* Interactive SVG Muscle Overlay Hotspots */}
          <svg
            viewBox="0 0 360 640"
            className="absolute inset-0 w-full h-full"
          >
            <defs>
              <filter id="hyperCyanGlow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="8" result="blur" />
                <feComponentTransfer in="blur" result="glow">
                  <feFuncA type="linear" slope="3.5" />
                </feComponentTransfer>
                <feMerge>
                  <feMergeNode in="glow" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {currentPerspective === "anterior" ? (
              /* ANTERIOR (FRONT) HOTSPOTS */
              <g>
                {/* Shoulders */}
                <g
                  data-testid="muscle-shoulders"
                  onClick={() => handleSelectMuscleAndAutoFace("shoulders")}
                  onMouseEnter={() => onHoverMuscle?.("shoulders")}
                  onMouseLeave={() => onHoverMuscle?.(null)}
                >
                  <path
                    d="M95 120 Q70 140 72 175 Q95 190 115 170 Q120 140 120 120 Z"
                    fill="#00f5ff"
                    fillOpacity={getOverlayOpacity("shoulders")}
                    stroke="#00f5ff"
                    strokeWidth={selectedMuscle === "shoulders" ? "3" : "1.5"}
                    strokeOpacity={getStrokeOpacity("shoulders")}
                    filter={selectedMuscle === "shoulders" ? "url(#hyperCyanGlow)" : undefined}
                  />
                  <path
                    d="M265 120 Q290 140 288 175 Q265 190 245 170 Q240 140 240 120 Z"
                    fill="#00f5ff"
                    fillOpacity={getOverlayOpacity("shoulders")}
                    stroke="#00f5ff"
                    strokeWidth={selectedMuscle === "shoulders" ? "3" : "1.5"}
                    strokeOpacity={getStrokeOpacity("shoulders")}
                    filter={selectedMuscle === "shoulders" ? "url(#hyperCyanGlow)" : undefined}
                  />
                </g>

                {/* Chest */}
                <g
                  data-testid="muscle-chest"
                  onClick={() => handleSelectMuscleAndAutoFace("chest")}
                  onMouseEnter={() => onHoverMuscle?.("chest")}
                  onMouseLeave={() => onHoverMuscle?.(null)}
                >
                  <path
                    d="M178 125 L125 125 Q105 155 115 185 Q150 198 178 180 Z"
                    fill="#00f5ff"
                    fillOpacity={getOverlayOpacity("chest")}
                    stroke="#00f5ff"
                    strokeWidth={selectedMuscle === "chest" ? "3" : "1.5"}
                    strokeOpacity={getStrokeOpacity("chest")}
                    filter={selectedMuscle === "chest" ? "url(#hyperCyanGlow)" : undefined}
                  />
                  <path
                    d="M182 125 L235 125 Q255 155 245 185 Q210 198 182 180 Z"
                    fill="#00f5ff"
                    fillOpacity={getOverlayOpacity("chest")}
                    stroke="#00f5ff"
                    strokeWidth={selectedMuscle === "chest" ? "3" : "1.5"}
                    strokeOpacity={getStrokeOpacity("chest")}
                    filter={selectedMuscle === "chest" ? "url(#hyperCyanGlow)" : undefined}
                  />
                </g>

                {/* Biceps */}
                <g
                  data-testid="muscle-biceps"
                  onClick={() => handleSelectMuscleAndAutoFace("biceps")}
                  onMouseEnter={() => onHoverMuscle?.("biceps")}
                  onMouseLeave={() => onHoverMuscle?.(null)}
                >
                  <path
                    d="M72 178 Q60 215 68 245 Q90 245 96 215 Q95 178 72 178 Z"
                    fill="#00f5ff"
                    fillOpacity={getOverlayOpacity("biceps")}
                    stroke="#00f5ff"
                    strokeWidth={selectedMuscle === "biceps" ? "3" : "1.5"}
                    strokeOpacity={getStrokeOpacity("biceps")}
                    filter={selectedMuscle === "biceps" ? "url(#hyperCyanGlow)" : undefined}
                  />
                  <path
                    d="M288 178 Q300 215 292 245 Q270 245 264 215 Q265 178 288 178 Z"
                    fill="#00f5ff"
                    fillOpacity={getOverlayOpacity("biceps")}
                    stroke="#00f5ff"
                    strokeWidth={selectedMuscle === "biceps" ? "3" : "1.5"}
                    strokeOpacity={getStrokeOpacity("biceps")}
                    filter={selectedMuscle === "biceps" ? "url(#hyperCyanGlow)" : undefined}
                  />
                </g>

                {/* Forearms */}
                <g
                  data-testid="muscle-forearms"
                  onClick={() => handleSelectMuscleAndAutoFace("forearms")}
                  onMouseEnter={() => onHoverMuscle?.("forearms")}
                  onMouseLeave={() => onHoverMuscle?.(null)}
                >
                  <path
                    d="M66 250 Q48 290 42 340 Q62 340 76 290 Q80 250 66 250 Z"
                    fill="#00f5ff"
                    fillOpacity={getOverlayOpacity("forearms")}
                    stroke="#00f5ff"
                    strokeWidth={selectedMuscle === "forearms" ? "3" : "1.5"}
                    strokeOpacity={getStrokeOpacity("forearms")}
                    filter={selectedMuscle === "forearms" ? "url(#hyperCyanGlow)" : undefined}
                  />
                  <path
                    d="M294 250 Q312 290 318 340 Q298 340 284 290 Q280 250 294 250 Z"
                    fill="#00f5ff"
                    fillOpacity={getOverlayOpacity("forearms")}
                    stroke="#00f5ff"
                    strokeWidth={selectedMuscle === "forearms" ? "3" : "1.5"}
                    strokeOpacity={getStrokeOpacity("forearms")}
                    filter={selectedMuscle === "forearms" ? "url(#hyperCyanGlow)" : undefined}
                  />
                </g>

                {/* Abs */}
                <g
                  data-testid="muscle-abs"
                  onClick={() => handleSelectMuscleAndAutoFace("abs")}
                  onMouseEnter={() => onHoverMuscle?.("abs")}
                  onMouseLeave={() => onHoverMuscle?.(null)}
                >
                  <path
                    d="M152 188 L208 188 L202 290 L158 290 Z"
                    fill="#00f5ff"
                    fillOpacity={getOverlayOpacity("abs")}
                    stroke="#00f5ff"
                    strokeWidth={selectedMuscle === "abs" ? "3" : "1.5"}
                    strokeOpacity={getStrokeOpacity("abs")}
                    filter={selectedMuscle === "abs" ? "url(#hyperCyanGlow)" : undefined}
                  />
                </g>

                {/* Obliques */}
                <g
                  data-testid="muscle-obliques"
                  onClick={() => handleSelectMuscleAndAutoFace("obliques")}
                  onMouseEnter={() => onHoverMuscle?.("obliques")}
                  onMouseLeave={() => onHoverMuscle?.(null)}
                >
                  <path
                    d="M125 195 L150 195 L155 285 L135 295 Q120 245 125 195 Z"
                    fill="#00f5ff"
                    fillOpacity={getOverlayOpacity("obliques")}
                    stroke="#00f5ff"
                    strokeWidth={selectedMuscle === "obliques" ? "3" : "1.5"}
                    strokeOpacity={getStrokeOpacity("obliques")}
                    filter={selectedMuscle === "obliques" ? "url(#hyperCyanGlow)" : undefined}
                  />
                  <path
                    d="M235 195 L210 195 L205 285 L225 295 Q240 245 235 195 Z"
                    fill="#00f5ff"
                    fillOpacity={getOverlayOpacity("obliques")}
                    stroke="#00f5ff"
                    strokeWidth={selectedMuscle === "obliques" ? "3" : "1.5"}
                    strokeOpacity={getStrokeOpacity("obliques")}
                    filter={selectedMuscle === "obliques" ? "url(#hyperCyanGlow)" : undefined}
                  />
                </g>

                {/* Quadriceps */}
                <g
                  data-testid="muscle-quads"
                  onClick={() => handleSelectMuscleAndAutoFace("quads")}
                  onMouseEnter={() => onHoverMuscle?.("quads")}
                  onMouseLeave={() => onHoverMuscle?.(null)}
                >
                  <path
                    d="M125 315 Q105 385 115 465 Q140 470 156 465 Q165 385 155 315 Z"
                    fill="#00f5ff"
                    fillOpacity={getOverlayOpacity("quads")}
                    stroke="#00f5ff"
                    strokeWidth={selectedMuscle === "quads" ? "3" : "1.5"}
                    strokeOpacity={getStrokeOpacity("quads")}
                    filter={selectedMuscle === "quads" ? "url(#hyperCyanGlow)" : undefined}
                  />
                  <path
                    d="M235 315 Q255 385 245 465 Q220 470 204 465 Q195 385 205 315 Z"
                    fill="#00f5ff"
                    fillOpacity={getOverlayOpacity("quads")}
                    stroke="#00f5ff"
                    strokeWidth={selectedMuscle === "quads" ? "3" : "1.5"}
                    strokeOpacity={getStrokeOpacity("quads")}
                    filter={selectedMuscle === "quads" ? "url(#hyperCyanGlow)" : undefined}
                  />
                </g>

                {/* Adductors */}
                <g
                  data-testid="muscle-adductors"
                  onClick={() => handleSelectMuscleAndAutoFace("adductors")}
                  onMouseEnter={() => onHoverMuscle?.("adductors")}
                  onMouseLeave={() => onHoverMuscle?.(null)}
                >
                  <path
                    d="M156 325 Q175 385 168 450 L158 450 Q165 385 156 325 Z"
                    fill="#00f5ff"
                    fillOpacity={getOverlayOpacity("adductors")}
                    stroke="#00f5ff"
                    strokeWidth={selectedMuscle === "adductors" ? "3" : "1.5"}
                    strokeOpacity={getStrokeOpacity("adductors")}
                    filter={selectedMuscle === "adductors" ? "url(#hyperCyanGlow)" : undefined}
                  />
                  <path
                    d="M204 325 Q185 385 192 450 L202 450 Q195 385 204 325 Z"
                    fill="#00f5ff"
                    fillOpacity={getOverlayOpacity("adductors")}
                    stroke="#00f5ff"
                    strokeWidth={selectedMuscle === "adductors" ? "3" : "1.5"}
                    strokeOpacity={getStrokeOpacity("adductors")}
                    filter={selectedMuscle === "adductors" ? "url(#hyperCyanGlow)" : undefined}
                  />
                </g>

                {/* Tibialis */}
                <g
                  data-testid="muscle-tibialis"
                  onClick={() => handleSelectMuscleAndAutoFace("tibialis")}
                  onMouseEnter={() => onHoverMuscle?.("tibialis")}
                  onMouseLeave={() => onHoverMuscle?.(null)}
                >
                  <path
                    d="M125 480 Q118 545 125 610 Q142 610 148 545 Q145 480 125 480 Z"
                    fill="#00f5ff"
                    fillOpacity={getOverlayOpacity("tibialis")}
                    stroke="#00f5ff"
                    strokeWidth={selectedMuscle === "tibialis" ? "3" : "1.5"}
                    strokeOpacity={getStrokeOpacity("tibialis")}
                    filter={selectedMuscle === "tibialis" ? "url(#hyperCyanGlow)" : undefined}
                  />
                  <path
                    d="M235 480 Q242 545 235 610 Q218 610 212 545 Q215 480 235 480 Z"
                    fill="#00f5ff"
                    fillOpacity={getOverlayOpacity("tibialis")}
                    stroke="#00f5ff"
                    strokeWidth={selectedMuscle === "tibialis" ? "3" : "1.5"}
                    strokeOpacity={getStrokeOpacity("tibialis")}
                    filter={selectedMuscle === "tibialis" ? "url(#hyperCyanGlow)" : undefined}
                  />
                </g>
              </g>
            ) : currentPerspective === "posterior" ? (
              /* POSTERIOR (BACK) HOTSPOTS */
              <g>
                {/* Traps */}
                <g
                  data-testid="muscle-traps"
                  onClick={() => handleSelectMuscleAndAutoFace("traps")}
                  onMouseEnter={() => onHoverMuscle?.("traps")}
                  onMouseLeave={() => onHoverMuscle?.(null)}
                >
                  <path
                    d="M180 100 L140 120 L135 155 L180 215 L225 155 L220 120 Z"
                    fill="#00f5ff"
                    fillOpacity={getOverlayOpacity("traps")}
                    stroke="#00f5ff"
                    strokeWidth={selectedMuscle === "traps" ? "3" : "1.5"}
                    strokeOpacity={getStrokeOpacity("traps")}
                    filter={selectedMuscle === "traps" ? "url(#hyperCyanGlow)" : undefined}
                  />
                </g>

                {/* Rear Delts */}
                <g
                  data-testid="muscle-reardelts"
                  onClick={() => handleSelectMuscleAndAutoFace("shoulders")}
                  onMouseEnter={() => onHoverMuscle?.("shoulders")}
                  onMouseLeave={() => onHoverMuscle?.(null)}
                >
                  <path
                    d="M95 120 Q70 140 72 175 Q95 190 115 170 Q120 140 120 120 Z"
                    fill="#00f5ff"
                    fillOpacity={getOverlayOpacity("shoulders")}
                    stroke="#00f5ff"
                    strokeWidth={selectedMuscle === "shoulders" ? "3" : "1.5"}
                    strokeOpacity={getStrokeOpacity("shoulders")}
                    filter={selectedMuscle === "shoulders" ? "url(#hyperCyanGlow)" : undefined}
                  />
                  <path
                    d="M265 120 Q290 140 288 175 Q265 190 245 170 Q240 140 240 120 Z"
                    fill="#00f5ff"
                    fillOpacity={getOverlayOpacity("shoulders")}
                    stroke="#00f5ff"
                    strokeWidth={selectedMuscle === "shoulders" ? "3" : "1.5"}
                    strokeOpacity={getStrokeOpacity("shoulders")}
                    filter={selectedMuscle === "shoulders" ? "url(#hyperCyanGlow)" : undefined}
                  />
                </g>

                {/* Triceps */}
                <g
                  data-testid="muscle-triceps"
                  onClick={() => handleSelectMuscleAndAutoFace("triceps")}
                  onMouseEnter={() => onHoverMuscle?.("triceps")}
                  onMouseLeave={() => onHoverMuscle?.(null)}
                >
                  <path
                    d="M72 178 Q60 215 68 250 Q90 250 96 215 Q95 178 72 178 Z"
                    fill="#00f5ff"
                    fillOpacity={getOverlayOpacity("triceps")}
                    stroke="#00f5ff"
                    strokeWidth={selectedMuscle === "triceps" ? "3" : "1.5"}
                    strokeOpacity={getStrokeOpacity("triceps")}
                    filter={selectedMuscle === "triceps" ? "url(#hyperCyanGlow)" : undefined}
                  />
                  <path
                    d="M288 178 Q300 215 292 250 Q270 250 264 215 Q265 178 288 178 Z"
                    fill="#00f5ff"
                    fillOpacity={getOverlayOpacity("triceps")}
                    stroke="#00f5ff"
                    strokeWidth={selectedMuscle === "triceps" ? "3" : "1.5"}
                    strokeOpacity={getStrokeOpacity("triceps")}
                    filter={selectedMuscle === "triceps" ? "url(#hyperCyanGlow)" : undefined}
                  />
                </g>

                {/* Lats */}
                <g
                  data-testid="muscle-lats"
                  onClick={() => handleSelectMuscleAndAutoFace("lats")}
                  onMouseEnter={() => onHoverMuscle?.("lats")}
                  onMouseLeave={() => onHoverMuscle?.(null)}
                >
                  <path
                    d="M135 170 Q112 205 125 265 L175 265 L175 220 Z"
                    fill="#00f5ff"
                    fillOpacity={getOverlayOpacity("lats")}
                    stroke="#00f5ff"
                    strokeWidth={selectedMuscle === "lats" ? "3" : "1.5"}
                    strokeOpacity={getStrokeOpacity("lats")}
                    filter={selectedMuscle === "lats" ? "url(#hyperCyanGlow)" : undefined}
                  />
                  <path
                    d="M225 170 Q248 205 235 265 L185 265 L185 220 Z"
                    fill="#00f5ff"
                    fillOpacity={getOverlayOpacity("lats")}
                    stroke="#00f5ff"
                    strokeWidth={selectedMuscle === "lats" ? "3" : "1.5"}
                    strokeOpacity={getStrokeOpacity("lats")}
                    filter={selectedMuscle === "lats" ? "url(#hyperCyanGlow)" : undefined}
                  />
                </g>

                {/* Lower Back */}
                <g
                  data-testid="muscle-lower_back"
                  onClick={() => handleSelectMuscleAndAutoFace("lower_back")}
                  onMouseEnter={() => onHoverMuscle?.("lower_back")}
                  onMouseLeave={() => onHoverMuscle?.(null)}
                >
                  <path
                    d="M162 268 L198 268 L192 320 L168 320 Z"
                    fill="#00f5ff"
                    fillOpacity={getOverlayOpacity("lower_back")}
                    stroke="#00f5ff"
                    strokeWidth={selectedMuscle === "lower_back" ? "3" : "1.5"}
                    strokeOpacity={getStrokeOpacity("lower_back")}
                    filter={selectedMuscle === "lower_back" ? "url(#hyperCyanGlow)" : undefined}
                  />
                </g>

                {/* Glutes */}
                <g
                  data-testid="muscle-glutes"
                  onClick={() => handleSelectMuscleAndAutoFace("glutes")}
                  onMouseEnter={() => onHoverMuscle?.("glutes")}
                  onMouseLeave={() => onHoverMuscle?.(null)}
                >
                  <path
                    d="M125 325 Q115 375 175 385 L178 325 Z"
                    fill="#00f5ff"
                    fillOpacity={getOverlayOpacity("glutes")}
                    stroke="#00f5ff"
                    strokeWidth={selectedMuscle === "glutes" ? "3" : "1.5"}
                    strokeOpacity={getStrokeOpacity("glutes")}
                    filter={selectedMuscle === "glutes" ? "url(#hyperCyanGlow)" : undefined}
                  />
                  <path
                    d="M235 325 Q245 375 185 385 L182 325 Z"
                    fill="#00f5ff"
                    fillOpacity={getOverlayOpacity("glutes")}
                    stroke="#00f5ff"
                    strokeWidth={selectedMuscle === "glutes" ? "3" : "1.5"}
                    strokeOpacity={getStrokeOpacity("glutes")}
                    filter={selectedMuscle === "glutes" ? "url(#hyperCyanGlow)" : undefined}
                  />
                </g>

                {/* Hamstrings */}
                <g
                  data-testid="muscle-hamstrings"
                  onClick={() => handleSelectMuscleAndAutoFace("hamstrings")}
                  onMouseEnter={() => onHoverMuscle?.("hamstrings")}
                  onMouseLeave={() => onHoverMuscle?.(null)}
                >
                  <path
                    d="M120 395 Q112 445 122 475 Q148 475 168 470 Q172 420 168 395 Z"
                    fill="#00f5ff"
                    fillOpacity={getOverlayOpacity("hamstrings")}
                    stroke="#00f5ff"
                    strokeWidth={selectedMuscle === "hamstrings" ? "3" : "1.5"}
                    strokeOpacity={getStrokeOpacity("hamstrings")}
                    filter={selectedMuscle === "hamstrings" ? "url(#hyperCyanGlow)" : undefined}
                  />
                  <path
                    d="M240 395 Q248 445 238 475 Q212 475 192 470 Q188 420 192 395 Z"
                    fill="#00f5ff"
                    fillOpacity={getOverlayOpacity("hamstrings")}
                    stroke="#00f5ff"
                    strokeWidth={selectedMuscle === "hamstrings" ? "3" : "1.5"}
                    strokeOpacity={getStrokeOpacity("hamstrings")}
                    filter={selectedMuscle === "hamstrings" ? "url(#hyperCyanGlow)" : undefined}
                  />
                </g>

                {/* Calves */}
                <g
                  data-testid="muscle-calves"
                  onClick={() => handleSelectMuscleAndAutoFace("calves")}
                  onMouseEnter={() => onHoverMuscle?.("calves")}
                  onMouseLeave={() => onHoverMuscle?.(null)}
                >
                  <path
                    d="M118 490 Q108 545 125 615 Q144 615 152 545 Q148 490 118 490 Z"
                    fill="#00f5ff"
                    fillOpacity={getOverlayOpacity("calves")}
                    stroke="#00f5ff"
                    strokeWidth={selectedMuscle === "calves" ? "3" : "1.5"}
                    strokeOpacity={getStrokeOpacity("calves")}
                    filter={selectedMuscle === "calves" ? "url(#hyperCyanGlow)" : undefined}
                  />
                  <path
                    d="M242 490 Q252 545 235 615 Q216 615 208 545 Q212 490 242 490 Z"
                    fill="#00f5ff"
                    fillOpacity={getOverlayOpacity("calves")}
                    stroke="#00f5ff"
                    strokeWidth={selectedMuscle === "calves" ? "3" : "1.5"}
                    strokeOpacity={getStrokeOpacity("calves")}
                    filter={selectedMuscle === "calves" ? "url(#hyperCyanGlow)" : undefined}
                  />
                </g>
              </g>
            ) : (
              /* LATERAL (SIDE) HOTSPOTS */
              <g>
                <rect
                  x="140"
                  y="120"
                  width="80"
                  height="460"
                  rx="40"
                  fill="#00f5ff"
                  fillOpacity={selectedMuscle ? 0.25 : 0.05}
                  stroke="#00f5ff"
                  strokeWidth="2"
                  strokeDasharray="6 4"
                  className="animate-pulse"
                />
              </g>
            )}
          </svg>

          {/* Glowing Animated Target Pinpoint over Active Selected Muscle */}
          {activePin && (
            <div
              className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none transition-all duration-500 ease-out z-20"
              style={{ left: `${activePin.x}%`, top: `${activePin.y}%` }}
            >
              <div className="relative flex items-center justify-center">
                <span className="absolute w-8 h-8 rounded-full bg-cyan-400/40 animate-ping" />
                <span className="w-4 h-4 rounded-full bg-cyan-400 border-2 border-white shadow-lg shadow-cyan-400/80" />
                <div className="absolute left-6 whitespace-nowrap px-2.5 py-1 rounded-lg bg-slate-950/90 border border-cyan-400/80 text-[10px] font-black text-white shadow-xl shadow-cyan-500/30 backdrop-blur-md">
                  {selectedDef?.name.split(" ")[0]}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* HUD Medical Pinpoint Indicator on Active Muscle */}
        {selectedMuscle && (
          <div className="absolute bottom-3 left-3 right-3 py-2 px-3.5 rounded-2xl bg-slate-950/95 backdrop-blur-md border border-cyan-500/50 flex items-center justify-between text-xs shadow-2xl shadow-cyan-500/20 z-30">
            <div className="flex items-center gap-2">
              <Crosshair size={15} className="text-cyan-400 animate-spin" style={{ animationDuration: "6s" }} />
              <div>
                <span className="font-black text-white text-[12px] block leading-tight">
                  {MUSCLE_DEFINITIONS[selectedMuscle].name}
                </span>
                <span className="text-[10px] text-cyan-400 font-semibold">
                  {MUSCLE_DEFINITIONS[selectedMuscle].subMuscles[0]}
                </span>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider bg-cyan-500 text-slate-950 shadow-sm shadow-cyan-500/40">
              Active Focus
            </span>
          </div>
        )}
      </div>

      {/* 360 Rotation Turntable Slider Control */}
      <div className="w-full mt-3 px-2 flex items-center gap-3">
        <RotateCw size={13} className="text-slate-500 shrink-0" />
        <input
          type="range"
          min="0"
          max="360"
          value={Math.round(rotationAngle)}
          onChange={(e) => {
            setIsAutoRotating(false);
            setRotationAngle(Number(e.target.value));
          }}
          className="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
        />
        <span className="text-[11px] font-mono text-cyan-400 shrink-0 font-bold w-10 text-right">
          {Math.round(rotationAngle)}°
        </span>
      </div>

      {/* Interactive Muscle Quick Selector Pills */}
      <div className="w-full mt-4 pt-3.5 border-t border-slate-800/80 flex flex-wrap gap-1.5 justify-center">
        {Object.values(MUSCLE_DEFINITIONS)
          .filter(m => m.view === currentPerspective || m.view === "both" || currentPerspective === "lateral")
          .map(muscle => {
            const isSelected = selectedMuscle === muscle.id;
            return (
              <button
                key={muscle.id}
                type="button"
                data-testid={`pill-${muscle.id}`}
                onClick={() => handleSelectMuscleAndAutoFace(muscle.id)}
                onMouseEnter={() => onHoverMuscle?.(muscle.id)}
                onMouseLeave={() => onHoverMuscle?.(null)}
                className={`text-[11px] font-extrabold px-3 py-1.5 rounded-xl border transition-all ${
                  isSelected
                    ? "bg-cyan-500 text-slate-950 border-cyan-400 shadow-lg shadow-cyan-500/30 scale-105"
                    : isDark
                    ? "bg-slate-950/90 text-slate-300 border-slate-800 hover:bg-slate-800 hover:text-white"
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
