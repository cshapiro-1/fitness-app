"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Scene,
  PerspectiveCamera,
  WebGLRenderer,
  AmbientLight,
  DirectionalLight,
  Group,
  Mesh,
  MeshStandardMaterial,
  Color,
  Vector2,
  Raycaster,
  SphereGeometry,
  CylinderGeometry,
  BoxGeometry,
  ConeGeometry,
  CircleGeometry,
  ACESFilmicToneMapping,
  BufferGeometry,
  Material,
} from "three";
import {
  Rotate3d,
  Play,
  Pause,
  RotateCw,
  Crosshair,
  MousePointer2,
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
  shortLabel: string;
  category: "CHEST" | "BACK" | "LEGS" | "SHOULDERS" | "ARMS" | "CORE";
  subMuscles: string[];
  view: "anterior" | "posterior" | "both";
  primaryRole: string;
  commonTightness: string;
  color: string;
}

export const MUSCLE_DEFINITIONS: Record<MuscleGroupId, MuscleInfo> = {
  chest: {
    id: "chest", name: "Chest (Pectorals)", shortLabel: "Chest",
    category: "CHEST",
    subMuscles: ["Pectoralis Major (Sternal Head)", "Pectoralis Major (Clavicular Head)", "Pectoralis Minor", "Serratus Anterior"],
    view: "anterior",
    primaryRole: "Horizontal shoulder adduction, internal rotation, and pushing power.",
    commonTightness: "Shortened in desk workers and bench-heavy lifters, pulling shoulders forward into internal rotation.",
    color: "#00f5ff",
  },
  shoulders: {
    id: "shoulders", name: "Shoulders (Deltoids)", shortLabel: "Delts",
    category: "SHOULDERS",
    subMuscles: ["Anterior Deltoid", "Lateral Deltoid (Middle Head)", "Posterior Deltoid (Rear Head)", "Rotator Cuff (Supraspinatus, Infraspinatus)"],
    view: "both",
    primaryRole: "Arm abduction, forward flexion, horizontal abduction, and 360° glenohumeral stability.",
    commonTightness: "Anterior dominance with weak rear deltoids creates shoulder impingement and poor overhead mechanics.",
    color: "#00f5ff",
  },
  biceps: {
    id: "biceps", name: "Biceps & Brachialis", shortLabel: "Biceps",
    category: "ARMS",
    subMuscles: ["Biceps Brachii (Short Head)", "Biceps Brachii (Long Head)", "Brachialis", "Brachioradialis"],
    view: "anterior",
    primaryRole: "Elbow flexion, forearm supination (turning palm up), and shoulder stabilization.",
    commonTightness: "Distal bicep tendon strain and shortened elbow flexion from excessive typing or heavy pulling.",
    color: "#00f5ff",
  },
  triceps: {
    id: "triceps", name: "Triceps Brachii", shortLabel: "Triceps",
    category: "ARMS",
    subMuscles: ["Triceps Brachii (Lateral Head)", "Triceps Brachii (Long Head)", "Triceps Brachii (Medial Head)", "Anconeus"],
    view: "posterior",
    primaryRole: "Elbow extension and shoulder extension (long head stabilization).",
    commonTightness: "Triceps tendon stiffness at olecranon process; long head tightness limits overhead shoulder flexion.",
    color: "#00f5ff",
  },
  forearms: {
    id: "forearms", name: "Forearms & Grip", shortLabel: "Forearms",
    category: "ARMS",
    subMuscles: ["Flexor Carpi Radialis/Ulnaris", "Extensor Digitorum", "Pronator Teres", "Brachioradialis"],
    view: "both",
    primaryRole: "Wrist flexion/extension, radial/ulnar deviation, and grip strength.",
    commonTightness: "Medial/lateral epicondylitis ('Golfer's / Tennis Elbow') and wrist stiffness.",
    color: "#00f5ff",
  },
  traps: {
    id: "traps", name: "Trapezius & Upper Back", shortLabel: "Traps",
    category: "BACK",
    subMuscles: ["Upper Trapezius", "Middle Trapezius", "Lower Trapezius", "Levator Scapulae", "Rhomboids"],
    view: "posterior",
    primaryRole: "Scapular elevation, retraction, upward rotation, and thoracic spine stability.",
    commonTightness: "Upper traps carry stress tension; lower traps often underactive leading to poor scapular upward rotation.",
    color: "#00f5ff",
  },
  lats: {
    id: "lats", name: "Latissimus Dorsi", shortLabel: "Lats",
    category: "BACK",
    subMuscles: ["Latissimus Dorsi", "Teres Major", "Thoracolumbar Fascia"],
    view: "posterior",
    primaryRole: "Shoulder adduction, extension, internal rotation, and lumbar spine decompression.",
    commonTightness: "Tight lats restrict overhead reaching and force lumbar spine hyperextension during overhead pressing.",
    color: "#00f5ff",
  },
  lower_back: {
    id: "lower_back", name: "Lower Back & Spinal Erectors", shortLabel: "Low Back",
    category: "BACK",
    subMuscles: ["Erector Spinae (Iliocostalis, Longissimus, Spinalis)", "Multifidus", "Quadratus Lumborum (QL)"],
    view: "posterior",
    primaryRole: "Spinal extension, lateral lumbar stabilization, and anti-flexion bracing under heavy axial loads.",
    commonTightness: "Erector over-recruitment compensating for weak glutes/core; deep QL asymmetry causes one-sided low back pain.",
    color: "#00f5ff",
  },
  abs: {
    id: "abs", name: "Abs (Rectus Abdominis)", shortLabel: "Abs",
    category: "CORE",
    subMuscles: ["Rectus Abdominis (Upper & Lower)", "Transverse Abdominis", "Pyramidalis"],
    view: "anterior",
    primaryRole: "Trunk flexion, posterior pelvic tilting, and 360° intra-abdominal pressure.",
    commonTightness: "Weak transverse abdominis allows anterior pelvic tilt; shortened rectus can pull ribcage down into rounded posture.",
    color: "#00f5ff",
  },
  obliques: {
    id: "obliques", name: "Obliques & Core Flank", shortLabel: "Obliques",
    category: "CORE",
    subMuscles: ["External Obliques", "Internal Obliques", "Transverse Abdominis", "Quadratus Lumborum"],
    view: "both",
    primaryRole: "Torso rotation, lateral flexion, and anti-rotational spinal protection.",
    commonTightness: "Asymmetrical rotational tightness from dominant-side athletic patterns (golf, baseball, throwing).",
    color: "#00f5ff",
  },
  glutes: {
    id: "glutes", name: "Glutes (Maximus & Medius)", shortLabel: "Glutes",
    category: "LEGS",
    subMuscles: ["Gluteus Maximus (Upper/Lower)", "Gluteus Medius", "Gluteus Minimus", "Deep Piriformis"],
    view: "posterior",
    primaryRole: "Hip extension, abduction, external rotation, and pelvic stability during single-leg drive.",
    commonTightness: "'Glute amnesia' from sitting; piriformis tightness compresses sciatic nerve causing radiating pain.",
    color: "#00f5ff",
  },
  quads: {
    id: "quads", name: "Quadriceps (Front Thigh)", shortLabel: "Quads",
    category: "LEGS",
    subMuscles: ["Rectus Femoris", "Vastus Lateralis (Outer Sweep)", "Vastus Medialis (Teardrop)", "Vastus Intermedius", "Iliopsoas"],
    view: "anterior",
    primaryRole: "Knee extension and hip flexion (Rectus Femoris); absorbing landing impact and driving vertical force.",
    commonTightness: "Shortened hip flexors and rectus femoris pull pelvis into anterior tilt, inhibiting glute firing.",
    color: "#00f5ff",
  },
  hamstrings: {
    id: "hamstrings", name: "Hamstrings (Posterior Thigh)", shortLabel: "Hamstrings",
    category: "LEGS",
    subMuscles: ["Biceps Femoris (Long & Short Heads)", "Semitendinosus", "Semimembranosus"],
    view: "posterior",
    primaryRole: "Knee flexion, hip extension, and decelerating forward running speed.",
    commonTightness: "Often feels tight but is actually 'locked-long' due to anterior pelvic tilt; requires eccentric strengthening.",
    color: "#00f5ff",
  },
  adductors: {
    id: "adductors", name: "Adductors (Inner Thigh / Groin)", shortLabel: "Adductors",
    category: "LEGS",
    subMuscles: ["Adductor Magnus", "Adductor Longus", "Adductor Brevis", "Gracilis", "Pectineus"],
    view: "anterior",
    primaryRole: "Hip adduction, hip flexion/extension assistance, and deep squat stabilization.",
    commonTightness: "Tight adductors pull knees inward (knee valgus) during squats and lunges, limiting hip mobility.",
    color: "#00f5ff",
  },
  calves: {
    id: "calves", name: "Calves (Gastrocnemius & Soleus)", shortLabel: "Calves",
    category: "LEGS",
    subMuscles: ["Gastrocnemius (Medial & Lateral Heads)", "Soleus", "Plantaris", "Achilles Tendon"],
    view: "posterior",
    primaryRole: "Plantarflexion, ankle stabilization, and elastic energy return in sprinting and jumping.",
    commonTightness: "Tight soleus limits ankle dorsiflexion, causing heels to rise or torso to collapse forward in squats.",
    color: "#00f5ff",
  },
  tibialis: {
    id: "tibialis", name: "Tibialis Anterior (Shins & Ankles)", shortLabel: "Tibialis",
    category: "LEGS",
    subMuscles: ["Tibialis Anterior", "Extensor Digitorum Longus", "Peroneus Longus/Brevis"],
    view: "anterior",
    primaryRole: "Ankle dorsiflexion, foot inversion, and absorbing heel-strike forces.",
    commonTightness: "Weakness causes shin splints and poor knee tracking; tightness reduces ankle articulation.",
    color: "#00f5ff",
  },
};

// Pill group ordering so related muscles stay together
const PILL_ORDER: MuscleGroupId[] = [
  "chest", "shoulders", "biceps", "triceps", "forearms",
  "traps", "lats", "lower_back",
  "abs", "obliques",
  "quads", "hamstrings", "glutes", "adductors", "calves", "tibialis",
];

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
  const mountRef = useRef<HTMLDivElement>(null);
  const [rotationAngle, setRotationAngle] = useState<number>(0);
  const [isAutoRotating, setIsAutoRotating] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [cursor3dMuscle, setCursor3dMuscle] = useState<MuscleGroupId | null>(null);
  const sceneRef = useRef<Scene | null>(null);
  const rendererRef = useRef<WebGLRenderer | null>(null);
  const bodyGroupRef = useRef<Group | null>(null);
  const muscleMeshesRef = useRef<Map<MuscleGroupId, Mesh[]>>(new Map());
  const cameraRef = useRef<PerspectiveCamera | null>(null);
  const reqIdRef = useRef<number | null>(null);
  const raycasterRef = useRef<Raycaster>(new Raycaster());
  const pointerRef = useRef<Vector2>(new Vector2());

  const dragStartXRef = useRef<number>(0);
  const startAngleRef = useRef<number>(0);

  // Derive current perspective from rotation angle
  const normalizedAngle = ((rotationAngle % 360) + 360) % 360;
  let currentPerspective: "anterior" | "lateral" | "posterior" = "anterior";
  if (normalizedAngle >= 45 && normalizedAngle < 135) currentPerspective = "lateral";
  else if (normalizedAngle >= 135 && normalizedAngle < 225) currentPerspective = "posterior";
  else if (normalizedAngle >= 225 && normalizedAngle < 315) currentPerspective = "lateral";
  else currentPerspective = "anterior";

  // Auto-rotate loop
  useEffect(() => {
    if (!isAutoRotating) return;
    const interval = setInterval(() => {
      setRotationAngle((prev) => (prev + 0.8) % 360);
    }, 30);
    return () => clearInterval(interval);
  }, [isAutoRotating]);

  // Update 3D body rotation
  useEffect(() => {
    if (bodyGroupRef.current) {
      bodyGroupRef.current.rotation.y = (rotationAngle * Math.PI) / 180;
    }
  }, [rotationAngle]);

  // Update 3D Muscle Materials based on Selection & Hover
  useEffect(() => {
    muscleMeshesRef.current.forEach((meshes, muscleId) => {
      const isSelected = selectedMuscle === muscleId;
      const isHovered = hoveredMuscle === muscleId;

      meshes.forEach((mesh) => {
        const mat = mesh.material as MeshStandardMaterial;
        if (isSelected) {
          mat.color.setHex(0x00f5ff);
          mat.emissive.setHex(0x00f5ff);
          mat.emissiveIntensity = 1.0;
          mat.roughness = 0.15;
          mat.metalness = 0.6;
        } else if (isHovered) {
          mat.color.setHex(0x38bdf8);
          mat.emissive.setHex(0x38bdf8);
          mat.emissiveIntensity = 0.6;
          mat.roughness = 0.25;
          mat.metalness = 0.35;
        } else {
          mat.color.setHex(0x8a3a34);
          mat.emissive.setHex(0x1a0808);
          mat.emissiveIntensity = 0.1;
          mat.roughness = 0.6;
          mat.metalness = 0.15;
        }
      });
    });
  }, [selectedMuscle, hoveredMuscle]);

  // ─── Build 3D Scene ───
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const scene = new Scene();
    scene.background = new Color(0x0a0f1d);
    sceneRef.current = scene;

    const w = container.clientWidth || 340;
    const h = container.clientHeight || 560;
    const camera = new PerspectiveCamera(32, w / h, 0.1, 100);
    camera.position.set(0, 0.8, 8);
    camera.lookAt(0, 0.8, 0);
    cameraRef.current = camera;

    let renderer: WebGLRenderer | null = null;
    try {
      renderer = new WebGLRenderer({ antialias: true, alpha: true });
      renderer.setSize(w, h);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.toneMapping = ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.3;
      container.innerHTML = "";
      container.appendChild(renderer.domElement);
      rendererRef.current = renderer;
    } catch {
      renderer = null;
    }

    // Lighting
    scene.add(new AmbientLight(0xffffff, 1.0));

    const keyLight = new DirectionalLight(0xffffff, 1.6);
    keyLight.position.set(4, 6, 5);
    scene.add(keyLight);

    const fillLight = new DirectionalLight(0x00f5ff, 0.6);
    fillLight.position.set(-5, -2, 3);
    scene.add(fillLight);

    const rimLight = new DirectionalLight(0x38bdf8, 1.2);
    rimLight.position.set(0, 4, -7);
    scene.add(rimLight);

    // Ground plane for reference depth
    const groundGeom = new CircleGeometry(2.5, 48);
    const groundMat = new MeshStandardMaterial({
      color: 0x0e1729,
      roughness: 0.9,
      metalness: 0.0,
    });
    const ground = new Mesh(groundGeom, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -2.9;
    scene.add(ground);

    // Body Group
    const bodyGroup = new Group();
    bodyGroup.position.y = 0;
    scene.add(bodyGroup);
    bodyGroupRef.current = bodyGroup;

    const muscleMap = new Map<MuscleGroupId, Mesh[]>();

    const addMuscle = (
      id: MuscleGroupId,
      geom: BufferGeometry,
      pos: [number, number, number],
      rot: [number, number, number] = [0, 0, 0],
      scale: [number, number, number] = [1, 1, 1]
    ) => {
      const mat = new MeshStandardMaterial({
        color: 0x8a3a34,
        roughness: 0.6,
        metalness: 0.15,
        emissive: 0x1a0808,
        emissiveIntensity: 0.1,
      });
      const mesh = new Mesh(geom, mat);
      mesh.position.set(...pos);
      mesh.rotation.set(...rot);
      mesh.scale.set(...scale);
      mesh.userData = { muscleId: id };
      bodyGroup.add(mesh);
      const arr = muscleMap.get(id) || [];
      arr.push(mesh);
      muscleMap.set(id, arr);
    };

    // Non-interactive skeleton parts
    const boneMat = new MeshStandardMaterial({ color: 0x5e2824, roughness: 0.55, metalness: 0.05 });
    const head = new Mesh(new SphereGeometry(0.48, 32, 32), boneMat);
    head.position.set(0, 3.2, 0);
    bodyGroup.add(head);

    const neck = new Mesh(new CylinderGeometry(0.22, 0.26, 0.5, 20), boneMat);
    neck.position.set(0, 2.7, 0);
    bodyGroup.add(neck);

    const spine = new Mesh(new CylinderGeometry(0.18, 0.22, 1.8, 16), boneMat);
    spine.position.set(0, 1.7, 0);
    bodyGroup.add(spine);

    // Pelvis connector
    const pelvis = new Mesh(new BoxGeometry(0.9, 0.35, 0.35), boneMat);
    pelvis.position.set(0, 0.7, 0);
    bodyGroup.add(pelvis);

    // Knee joints
    const kneeGeo = new SphereGeometry(0.18, 16, 16);
    const kneeL = new Mesh(kneeGeo, boneMat);
    kneeL.position.set(-0.42, -1.2, 0);
    bodyGroup.add(kneeL);
    const kneeR = new Mesh(kneeGeo, boneMat);
    kneeR.position.set(0.42, -1.2, 0);
    bodyGroup.add(kneeR);

    // ── Muscles ──

    // CHEST
    const pecGeo = new BoxGeometry(0.48, 0.44, 0.3);
    addMuscle("chest", pecGeo, [-0.3, 2.16, 0.24], [0, 0.12, -0.04]);
    addMuscle("chest", pecGeo, [0.3, 2.16, 0.24], [0, -0.12, 0.04]);

    // SHOULDERS
    const deltGeo = new SphereGeometry(0.3, 24, 24);
    addMuscle("shoulders", deltGeo, [-0.82, 2.28, 0.02], [0, 0, 0.15], [1.15, 1.2, 1.05]);
    addMuscle("shoulders", deltGeo, [0.82, 2.28, 0.02], [0, 0, -0.15], [1.15, 1.2, 1.05]);

    // BICEPS
    const biGeo = new CylinderGeometry(0.17, 0.14, 0.7, 20);
    addMuscle("biceps", biGeo, [-0.85, 1.6, 0.12], [0, 0, 0.08]);
    addMuscle("biceps", biGeo, [0.85, 1.6, 0.12], [0, 0, -0.08]);

    // TRICEPS
    const triGeo = new CylinderGeometry(0.18, 0.14, 0.72, 20);
    addMuscle("triceps", triGeo, [-0.85, 1.58, -0.12], [0, 0, 0.08]);
    addMuscle("triceps", triGeo, [0.85, 1.58, -0.12], [0, 0, -0.08]);

    // FOREARMS
    const faGeo = new CylinderGeometry(0.14, 0.1, 0.8, 18);
    addMuscle("forearms", faGeo, [-0.92, 0.8, 0.04], [0, 0, 0.06]);
    addMuscle("forearms", faGeo, [0.92, 0.8, 0.04], [0, 0, -0.06]);

    // ABS (6-pack blocks)
    const abGeo = new BoxGeometry(0.26, 0.22, 0.14);
    addMuscle("abs", abGeo, [-0.15, 1.82, 0.26]);
    addMuscle("abs", abGeo, [0.15, 1.82, 0.26]);
    addMuscle("abs", abGeo, [-0.15, 1.55, 0.26]);
    addMuscle("abs", abGeo, [0.15, 1.55, 0.26]);
    addMuscle("abs", abGeo, [-0.14, 1.28, 0.25]);
    addMuscle("abs", abGeo, [0.14, 1.28, 0.25]);

    // OBLIQUES
    const oblGeo = new BoxGeometry(0.22, 0.72, 0.25);
    addMuscle("obliques", oblGeo, [-0.44, 1.5, 0.12], [0, 0, 0.12]);
    addMuscle("obliques", oblGeo, [0.44, 1.5, 0.12], [0, 0, -0.12]);

    // TRAPS
    const trapGeo = new ConeGeometry(0.55, 0.8, 4);
    addMuscle("traps", trapGeo, [0, 2.3, -0.18], [0, 0, Math.PI], [1.35, 1.0, 0.55]);

    // LATS
    const latGeo = new BoxGeometry(0.4, 0.8, 0.24);
    addMuscle("lats", latGeo, [-0.42, 1.8, -0.18], [0, 0.18, 0.12]);
    addMuscle("lats", latGeo, [0.42, 1.8, -0.18], [0, -0.18, -0.12]);

    // LOWER BACK
    const lbGeo = new BoxGeometry(0.44, 0.65, 0.26);
    addMuscle("lower_back", lbGeo, [0, 1.28, -0.18]);

    // GLUTES
    const gluteGeo = new SphereGeometry(0.42, 24, 24);
    addMuscle("glutes", gluteGeo, [-0.34, 0.5, -0.2], [0, 0, 0.1], [1.0, 1.1, 1.1]);
    addMuscle("glutes", gluteGeo, [0.34, 0.5, -0.2], [0, 0, -0.1], [1.0, 1.1, 1.1]);

    // QUADS
    const quadGeo = new CylinderGeometry(0.3, 0.22, 1.4, 24);
    addMuscle("quads", quadGeo, [-0.42, -0.4, 0.1], [0.04, 0, 0.04]);
    addMuscle("quads", quadGeo, [0.42, -0.4, 0.1], [0.04, 0, -0.04]);

    // HAMSTRINGS
    const hamGeo = new CylinderGeometry(0.28, 0.2, 1.4, 24);
    addMuscle("hamstrings", hamGeo, [-0.42, -0.4, -0.12], [-0.04, 0, 0.04]);
    addMuscle("hamstrings", hamGeo, [0.42, -0.4, -0.12], [-0.04, 0, -0.04]);

    // ADDUCTORS
    const addGeo = new CylinderGeometry(0.18, 0.13, 1.15, 16);
    addMuscle("adductors", addGeo, [-0.16, -0.3, 0.0], [0, 0, -0.06]);
    addMuscle("adductors", addGeo, [0.16, -0.3, 0.0], [0, 0, 0.06]);

    // CALVES
    const calfGeo = new CylinderGeometry(0.22, 0.14, 1.3, 24);
    addMuscle("calves", calfGeo, [-0.42, -1.9, -0.1], [-0.04, 0, 0.02]);
    addMuscle("calves", calfGeo, [0.42, -1.9, -0.1], [-0.04, 0, -0.02]);

    // TIBIALIS
    const tibGeo = new CylinderGeometry(0.18, 0.12, 1.3, 20);
    addMuscle("tibialis", tibGeo, [-0.42, -1.9, 0.1], [0.04, 0, 0.02]);
    addMuscle("tibialis", tibGeo, [0.42, -1.9, 0.1], [0.04, 0, -0.02]);

    muscleMeshesRef.current = muscleMap;

    // Render loop
    const animate = () => {
      reqIdRef.current = requestAnimationFrame(animate);
      if (renderer) renderer.render(scene, camera);
    };
    if (renderer) animate();

    const handleResize = () => {
      if (!container || !camera || !renderer) return;
      const cw = container.clientWidth;
      const ch = container.clientHeight;
      camera.aspect = cw / ch;
      camera.updateProjectionMatrix();
      renderer.setSize(cw, ch);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      if (reqIdRef.current) {
        cancelAnimationFrame(reqIdRef.current);
        reqIdRef.current = null;
      }

      // Dispose all GPU geometries and materials across scene graph to eliminate memory leaks
      if (sceneRef.current) {
        sceneRef.current.traverse((obj) => {
          if (obj instanceof Mesh) {
            if (obj.geometry) {
              obj.geometry.dispose();
            }
            if (obj.material) {
              if (Array.isArray(obj.material)) {
                obj.material.forEach((m: Material) => m.dispose());
              } else {
                obj.material.dispose();
              }
            }
          }
        });
        sceneRef.current.clear();
      }

      muscleMeshesRef.current.clear();
      bodyGroupRef.current = null;
      sceneRef.current = null;
      cameraRef.current = null;

      if (renderer) {
        try {
          renderer.forceContextLoss();
          renderer.dispose();
        } catch {
          // ignore in headless / test environments
        }
        if (renderer.domElement && renderer.domElement.parentNode) {
          renderer.domElement.parentNode.removeChild(renderer.domElement);
        }
        rendererRef.current = null;
      }
    };
  }, []);

  // ─── Raycaster ───
  const raycast = useCallback(
    (clientX: number, clientY: number): MuscleGroupId | null => {
      const container = mountRef.current;
      const camera = cameraRef.current;
      const bodyGroup = bodyGroupRef.current;
      if (!container || !camera || !bodyGroup) return null;

      const rect = container.getBoundingClientRect();
      pointerRef.current.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      pointerRef.current.y = -((clientY - rect.top) / rect.height) * 2 + 1;

      raycasterRef.current.setFromCamera(pointerRef.current, camera);
      const hits = raycasterRef.current.intersectObjects(bodyGroup.children, true);

      for (const hit of hits) {
        const id = (hit.object as Mesh).userData?.muscleId;
        if (id) return id as MuscleGroupId;
      }
      return null;
    },
    []
  );

  // ─── Pointer Events ───
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
      if (isDragging) {
        const dx = e.clientX - dragStartXRef.current;
        setRotationAngle((startAngleRef.current + dx * 0.8 + 360) % 360);
      } else {
        const muscleId = raycast(e.clientX, e.clientY);
        setCursor3dMuscle(muscleId);
        onHoverMuscle?.(muscleId);
      }
    },
    [isDragging, raycast, onHoverMuscle]
  );

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!isDragging || e.touches.length === 0) return;
      const dx = e.touches[0].clientX - dragStartXRef.current;
      setRotationAngle((startAngleRef.current + dx * 0.8 + 360) % 360);
    },
    [isDragging]
  );

  const handleMouseUp = useCallback(
    (e: MouseEvent) => {
      if (isDragging) {
        const wasDrag = Math.abs(e.clientX - dragStartXRef.current) > 5;
        if (!wasDrag) {
          const muscleId = raycast(e.clientX, e.clientY);
          if (muscleId) {
            onSelectMuscle(muscleId);
          }
        }
        setIsDragging(false);
      }
    },
    [isDragging, raycast, onSelectMuscle]
  );

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("touchmove", handleTouchMove);
    window.addEventListener("touchend", handleTouchEnd);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, [handleMouseMove, handleMouseUp, handleTouchMove, handleTouchEnd]);

  // ─── Pill click: select + auto-face ───
  const handlePillClick = useCallback(
    (muscleId: MuscleGroupId) => {
      onSelectMuscle(muscleId);
      const def = MUSCLE_DEFINITIONS[muscleId];
      if (def.view === "posterior" && currentPerspective === "anterior") setRotationAngle(180);
      else if (def.view === "anterior" && currentPerspective === "posterior") setRotationAngle(0);
    },
    [onSelectMuscle, currentPerspective]
  );

  // Compute visible pills
  const visiblePills = PILL_ORDER.filter((id) => {
    const m = MUSCLE_DEFINITIONS[id];
    return m.view === currentPerspective || m.view === "both" || currentPerspective === "lateral";
  });

  return (
    <div
      data-testid="interactive-body-map"
      className={`relative flex flex-col items-center select-none rounded-3xl p-5 transition-all duration-300 ${
        isDark
          ? "bg-slate-900/95 border border-slate-800 shadow-2xl text-slate-100 backdrop-blur-xl"
          : "bg-white border border-slate-200 shadow-xl text-slate-900"
      } ${className}`}
    >
      {/* Header */}
      <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <span className="inline-flex p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-md shadow-cyan-500/20">
            <Rotate3d size={18} />
          </span>
          <div>
            <h3 className="text-sm font-black tracking-tight text-white">3D Anatomy Model</h3>
            <p className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
              <MousePointer2 size={10} className="inline" />
              Click a muscle or drag to rotate
            </p>
          </div>
        </div>

        {/* View presets */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-2xl border border-slate-800">
          {([
            { label: "Front", angle: 0, perspective: "anterior" as const },
            { label: "Side", angle: 90, perspective: "lateral" as const },
            { label: "Back", angle: 180, perspective: "posterior" as const },
          ]).map(({ label, angle, perspective }) => (
            <button
              key={label}
              type="button"
              data-testid={label === "Front" ? "toggle-anterior" : label === "Back" ? "toggle-posterior" : undefined}
              onClick={() => { setIsAutoRotating(false); setRotationAngle(angle); }}
              className={`px-3 py-1 text-xs font-black rounded-xl transition-all ${
                currentPerspective === perspective
                  ? "bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/25"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setIsAutoRotating(!isAutoRotating)}
            title={isAutoRotating ? "Pause rotation" : "Auto-rotate"}
            className={`p-1.5 rounded-xl border transition-all ${
              isAutoRotating
                ? "bg-cyan-500/20 border-cyan-400 text-cyan-300"
                : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            {isAutoRotating ? <Pause size={14} /> : <Play size={14} />}
          </button>
        </div>
      </div>

      {/* 3D Canvas */}
      <div
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        className="relative w-full max-w-[360px] aspect-[9/16] rounded-3xl overflow-hidden bg-[#0a0f1d] border-2 border-slate-800/80 shadow-2xl select-none"
        style={{ cursor: isDragging ? "grabbing" : cursor3dMuscle ? "pointer" : "grab" }}
      >
        <div ref={mountRef} className="w-full h-full" />

        {/* Hover tooltip */}
        {hoveredMuscle && !selectedMuscle && !isDragging && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-xl bg-slate-950/90 border border-cyan-500/40 text-[11px] font-bold text-cyan-300 backdrop-blur-sm z-30 pointer-events-none whitespace-nowrap shadow-lg shadow-cyan-500/15">
            {MUSCLE_DEFINITIONS[hoveredMuscle].name}
          </div>
        )}

        {/* Selected muscle HUD */}
        {selectedMuscle && (
          <div className="absolute bottom-3 left-3 right-3 py-2 px-3.5 rounded-2xl bg-slate-950/95 backdrop-blur-md border border-cyan-500/50 flex items-center justify-between text-xs shadow-2xl shadow-cyan-500/20 z-30 pointer-events-none">
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
            <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider bg-cyan-500 text-slate-950">
              Selected
            </span>
          </div>
        )}
      </div>

      {/* Rotation Slider */}
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

      {/* Quick Selector Pills */}
      <div className="w-full mt-4 pt-3.5 border-t border-slate-800/80 flex flex-wrap gap-1.5 justify-center">
        {visiblePills.map((id) => {
          const muscle = MUSCLE_DEFINITIONS[id];
          const isSelected = selectedMuscle === id;
          const isHovered = hoveredMuscle === id;
          return (
            <button
              key={id}
              type="button"
              data-testid={`pill-${id}`}
              onClick={() => handlePillClick(id)}
              onMouseEnter={() => onHoverMuscle?.(id)}
              onMouseLeave={() => onHoverMuscle?.(null)}
              className={`text-[11px] font-extrabold px-3 py-1.5 rounded-xl border transition-all ${
                isSelected
                  ? "bg-cyan-500 text-slate-950 border-cyan-400 shadow-lg shadow-cyan-500/30 scale-105"
                  : isHovered
                  ? "bg-slate-800 text-cyan-300 border-cyan-500/40"
                  : isDark
                  ? "bg-slate-950/90 text-slate-300 border-slate-800 hover:bg-slate-800 hover:text-white"
                  : "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200"
              }`}
            >
              {muscle.shortLabel}
            </button>
          );
        })}
      </div>
    </div>
  );
}
