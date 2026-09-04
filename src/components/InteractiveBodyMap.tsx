"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
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
  Vector3,
  Raycaster,
  CircleGeometry,
  ACESFilmicToneMapping,
  BufferGeometry,
  Material,
  Box3,
  DoubleSide,
  Object3D,
} from "three";
import {
  Rotate3d,
  Play,
  Pause,
  RotateCw,
  Crosshair,
  MousePointer2,
  Layers,
  Sparkles,
  Eye,
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
  // Responsive hotspot coordinates (%) on the high-res 2D medical diagrams
  hotspot?: {
    anterior?: { x: number; y: number; w: number; h: number };
    posterior?: { x: number; y: number; w: number; h: number };
  };
}

export const MUSCLE_DEFINITIONS: Record<MuscleGroupId, MuscleInfo> = {
  chest: {
    id: "chest",
    name: "Chest (Pectorals)",
    shortLabel: "Chest",
    category: "CHEST",
    subMuscles: ["Pectoralis Major (Sternal Head)", "Pectoralis Major (Clavicular Head)", "Pectoralis Minor", "Serratus Anterior"],
    view: "anterior",
    primaryRole: "Horizontal shoulder adduction, internal rotation, and pushing power.",
    commonTightness: "Shortened in desk workers and bench-heavy lifters, pulling shoulders forward into internal rotation.",
    color: "#00f5ff",
    hotspot: {
      anterior: { x: 34, y: 20, w: 32, h: 10 },
    },
  },
  shoulders: {
    id: "shoulders",
    name: "Shoulders (Deltoids)",
    shortLabel: "Delts",
    category: "SHOULDERS",
    subMuscles: ["Anterior Deltoid", "Lateral Deltoid (Middle Head)", "Posterior Deltoid (Rear Head)", "Rotator Cuff (Supraspinatus, Infraspinatus)"],
    view: "both",
    primaryRole: "Arm abduction, forward flexion, horizontal abduction, and 360° glenohumeral stability.",
    commonTightness: "Anterior dominance with weak rear deltoids creates shoulder impingement and poor overhead mechanics.",
    color: "#00f5ff",
    hotspot: {
      anterior: { x: 23, y: 19, w: 54, h: 8 },
      posterior: { x: 23, y: 19, w: 54, h: 8 },
    },
  },
  biceps: {
    id: "biceps",
    name: "Biceps & Brachialis",
    shortLabel: "Biceps",
    category: "ARMS",
    subMuscles: ["Biceps Brachii (Short Head)", "Biceps Brachii (Long Head)", "Brachialis", "Brachioradialis"],
    view: "anterior",
    primaryRole: "Elbow flexion, forearm supination (turning palm up), and shoulder stabilization.",
    commonTightness: "Distal bicep tendon strain and shortened elbow flexion from excessive typing or heavy pulling.",
    color: "#00f5ff",
    hotspot: {
      anterior: { x: 20, y: 27, w: 60, h: 11 },
    },
  },
  triceps: {
    id: "triceps",
    name: "Triceps Brachii",
    shortLabel: "Triceps",
    category: "ARMS",
    subMuscles: ["Triceps Brachii (Lateral Head)", "Triceps Brachii (Long Head)", "Triceps Brachii (Medial Head)", "Anconeus"],
    view: "posterior",
    primaryRole: "Elbow extension and shoulder extension (long head stabilization).",
    commonTightness: "Triceps tendon stiffness at olecranon process; long head tightness limits overhead shoulder flexion.",
    color: "#00f5ff",
    hotspot: {
      posterior: { x: 20, y: 26, w: 60, h: 12 },
    },
  },
  forearms: {
    id: "forearms",
    name: "Forearms & Grip",
    shortLabel: "Forearms",
    category: "ARMS",
    subMuscles: ["Flexor Carpi Radialis/Ulnaris", "Extensor Digitorum", "Pronator Teres", "Brachioradialis"],
    view: "both",
    primaryRole: "Wrist flexion/extension, radial/ulnar deviation, and grip strength.",
    commonTightness: "Medial/lateral epicondylitis ('Golfer's / Tennis Elbow') and wrist stiffness.",
    color: "#00f5ff",
    hotspot: {
      anterior: { x: 17, y: 37, w: 66, h: 13 },
      posterior: { x: 17, y: 37, w: 66, h: 13 },
    },
  },
  traps: {
    id: "traps",
    name: "Trapezius & Upper Back",
    shortLabel: "Traps",
    category: "BACK",
    subMuscles: ["Upper Trapezius", "Middle Trapezius", "Lower Trapezius", "Levator Scapulae", "Rhomboids"],
    view: "posterior",
    primaryRole: "Scapular elevation, retraction, upward rotation, and thoracic spine stability.",
    commonTightness: "Upper traps carry stress tension; lower traps often underactive leading to poor scapular upward rotation.",
    color: "#00f5ff",
    hotspot: {
      posterior: { x: 33, y: 13, w: 34, h: 15 },
    },
  },
  lats: {
    id: "lats",
    name: "Latissimus Dorsi",
    shortLabel: "Lats",
    category: "BACK",
    subMuscles: ["Latissimus Dorsi", "Teres Major", "Thoracolumbar Fascia"],
    view: "posterior",
    primaryRole: "Shoulder adduction, extension, internal rotation, and lumbar spine decompression.",
    commonTightness: "Tight lats restrict overhead reaching and force lumbar spine hyperextension during overhead pressing.",
    color: "#00f5ff",
    hotspot: {
      posterior: { x: 30, y: 27, w: 40, h: 15 },
    },
  },
  lower_back: {
    id: "lower_back",
    name: "Lower Back & Spinal Erectors",
    shortLabel: "Low Back",
    category: "BACK",
    subMuscles: ["Erector Spinae (Iliocostalis, Longissimus, Spinalis)", "Multifidus", "Quadratus Lumborum (QL)"],
    view: "posterior",
    primaryRole: "Spinal extension, lateral lumbar stabilization, and anti-flexion bracing under heavy axial loads.",
    commonTightness: "Erector over-recruitment compensating for weak glutes/core; deep QL asymmetry causes one-sided low back pain.",
    color: "#00f5ff",
    hotspot: {
      posterior: { x: 38, y: 38, w: 24, h: 10 },
    },
  },
  abs: {
    id: "abs",
    name: "Abs (Rectus Abdominis)",
    shortLabel: "Abs",
    category: "CORE",
    subMuscles: ["Rectus Abdominis (Upper & Lower)", "Transverse Abdominis", "Pyramidalis"],
    view: "anterior",
    primaryRole: "Trunk flexion, posterior pelvic tilting, and 360° intra-abdominal pressure.",
    commonTightness: "Weak transverse abdominis allows anterior pelvic tilt; shortened rectus can pull ribcage down into rounded posture.",
    color: "#00f5ff",
    hotspot: {
      anterior: { x: 41, y: 29, w: 18, h: 17 },
    },
  },
  obliques: {
    id: "obliques",
    name: "Obliques & Core Flank",
    shortLabel: "Obliques",
    category: "CORE",
    subMuscles: ["External Obliques", "Internal Obliques", "Transverse Abdominis", "Quadratus Lumborum"],
    view: "both",
    primaryRole: "Torso rotation, lateral flexion, and anti-rotational spinal protection.",
    commonTightness: "Asymmetrical rotational tightness from dominant-side athletic patterns (golf, baseball, throwing).",
    color: "#00f5ff",
    hotspot: {
      anterior: { x: 33, y: 30, w: 34, h: 16 },
      posterior: { x: 33, y: 30, w: 34, h: 16 },
    },
  },
  glutes: {
    id: "glutes",
    name: "Glutes (Maximus & Medius)",
    shortLabel: "Glutes",
    category: "LEGS",
    subMuscles: ["Gluteus Maximus (Upper/Lower)", "Gluteus Medius", "Gluteus Minimus", "Deep Piriformis"],
    view: "posterior",
    primaryRole: "Hip extension, abduction, external rotation, and pelvic stability during single-leg drive.",
    commonTightness: "'Glute amnesia' from sitting; piriformis tightness compresses sciatic nerve causing radiating pain.",
    color: "#00f5ff",
    hotspot: {
      posterior: { x: 33, y: 44, w: 34, h: 13 },
    },
  },
  quads: {
    id: "quads",
    name: "Quadriceps (Front Thigh)",
    shortLabel: "Quads",
    category: "LEGS",
    subMuscles: ["Rectus Femoris", "Vastus Lateralis (Outer Sweep)", "Vastus Medialis (Teardrop)", "Vastus Intermedius", "Iliopsoas"],
    view: "anterior",
    primaryRole: "Knee extension and hip flexion (Rectus Femoris); absorbing landing impact and driving vertical force.",
    commonTightness: "Shortened hip flexors and rectus femoris pull pelvis into anterior tilt, inhibiting glute firing.",
    color: "#00f5ff",
    hotspot: {
      anterior: { x: 32, y: 48, w: 36, h: 21 },
    },
  },
  hamstrings: {
    id: "hamstrings",
    name: "Hamstrings (Posterior Thigh)",
    shortLabel: "Hamstrings",
    category: "LEGS",
    subMuscles: ["Biceps Femoris (Long & Short Heads)", "Semitendinosus", "Semimembranosus"],
    view: "posterior",
    primaryRole: "Knee flexion, hip extension, and decelerating forward running speed.",
    commonTightness: "Often feels tight but is actually 'locked-long' due to anterior pelvic tilt; requires eccentric strengthening.",
    color: "#00f5ff",
    hotspot: {
      posterior: { x: 32, y: 56, w: 36, h: 16 },
    },
  },
  adductors: {
    id: "adductors",
    name: "Adductors (Inner Thigh / Groin)",
    shortLabel: "Adductors",
    category: "LEGS",
    subMuscles: ["Adductor Magnus", "Adductor Longus", "Adductor Brevis", "Gracilis", "Pectineus"],
    view: "anterior",
    primaryRole: "Hip adduction, hip flexion/extension assistance, and deep squat stabilization.",
    commonTightness: "Tight adductors pull knees inward (knee valgus) during squats and lunges, limiting hip mobility.",
    color: "#00f5ff",
    hotspot: {
      anterior: { x: 41, y: 49, w: 18, h: 16 },
    },
  },
  calves: {
    id: "calves",
    name: "Calves (Gastrocnemius & Soleus)",
    shortLabel: "Calves",
    category: "LEGS",
    subMuscles: ["Gastrocnemius (Medial & Lateral Heads)", "Soleus", "Plantaris", "Achilles Tendon"],
    view: "posterior",
    primaryRole: "Plantarflexion, ankle stabilization, and elastic energy return in sprinting and jumping.",
    commonTightness: "Tight soleus limits ankle dorsiflexion, causing heels to rise or torso to collapse forward in squats.",
    color: "#00f5ff",
    hotspot: {
      posterior: { x: 32, y: 72, w: 36, h: 18 },
    },
  },
  tibialis: {
    id: "tibialis",
    name: "Tibialis Anterior (Shins & Ankles)",
    shortLabel: "Tibialis",
    category: "LEGS",
    subMuscles: ["Tibialis Anterior", "Extensor Digitorum Longus", "Peroneus Longus/Brevis"],
    view: "anterior",
    primaryRole: "Ankle dorsiflexion, foot inversion, and absorbing heel-strike forces.",
    commonTightness: "Weakness causes shin splints and poor knee tracking; tightness reduces ankle articulation.",
    color: "#00f5ff",
    hotspot: {
      anterior: { x: 32, y: 72, w: 36, h: 18 },
    },
  },
};

const PILL_ORDER: MuscleGroupId[] = [
  "chest", "shoulders", "biceps", "triceps", "forearms",
  "traps", "lats", "lower_back",
  "abs", "obliques",
  "quads", "hamstrings", "glutes", "adductors", "calves", "tibialis",
];

// Mapping table from 3D anatomical GLTF node tags to STRKYR muscle IDs
const RAW_TO_MUSCLE_ID: Record<string, MuscleGroupId> = {
  chest: "chest",
  deltoids: "shoulders",
  biceps: "biceps",
  triceps: "triceps",
  forearm: "forearms",
  forearms: "forearms",
  traps: "traps",
  lats: "lats",
  lower_back: "lower_back",
  abs: "abs",
  obliques: "obliques",
  glutes: "glutes",
  quads: "quads",
  hamstrings: "hamstrings",
  adductors: "adductors",
  calves: "calves",
  tibialis: "tibialis",
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
  const mountRef = useRef<HTMLDivElement>(null);
  const [viewMode, setViewMode] = useState<"3D" | "DIAGRAM">("3D");
  const [rotationAngle, setRotationAngle] = useState<number>(0);
  const [isAutoRotating, setIsAutoRotating] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [cursor3dMuscle, setCursor3dMuscle] = useState<MuscleGroupId | null>(null);
  const [isModelLoading, setIsModelLoading] = useState<boolean>(true);

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
    if (!isAutoRotating || viewMode !== "3D") return;
    const interval = setInterval(() => {
      setRotationAngle((prev) => (prev + 0.8) % 360);
    }, 30);
    return () => clearInterval(interval);
  }, [isAutoRotating, viewMode]);

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
        if (!mat || !mat.color) return;
        if (isSelected) {
          mat.color.setHex(0x00f5ff);
          mat.emissive.setHex(0x00d8f0);
          mat.emissiveIntensity = 0.95;
          mat.roughness = 0.2;
          mat.metalness = 0.15;
        } else if (isHovered) {
          mat.color.setHex(0x38bdf8);
          mat.emissive.setHex(0x0284c7);
          mat.emissiveIntensity = 0.5;
          mat.roughness = 0.3;
          mat.metalness = 0.1;
        } else {
          // Rich anatomical muscle crimson
          mat.color.setHex(0x9b4844);
          mat.emissive.setHex(0x220a08);
          mat.emissiveIntensity = 0.12;
          mat.roughness = 0.55;
          mat.metalness = 0.05;
        }
      });
    });
  }, [selectedMuscle, hoveredMuscle]);

  // ─── Build Anatomically Sculpted 3D Human Musculature Scene ───
  useEffect(() => {
    if (viewMode !== "3D") return;

    const container = mountRef.current;
    if (!container) return;

    const scene = new Scene();
    scene.background = new Color(0x070b14);
    sceneRef.current = scene;

    const w = container.clientWidth || 300;
    const h = container.clientHeight || 400;
    const aspect = w / h;
    const camera = new PerspectiveCamera(34, aspect, 0.1, 50);
    const targetZ = aspect < 0.65 ? 10.2 : aspect < 0.85 ? 9.5 : 8.8;
    camera.position.set(0, 0, targetZ);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    let renderer: WebGLRenderer | null = null;
    try {
      renderer = new WebGLRenderer({ antialias: true, alpha: true });
      renderer.setSize(w, h);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.toneMapping = ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.35;
      container.innerHTML = "";
      container.appendChild(renderer.domElement);
      rendererRef.current = renderer;
    } catch {
      renderer = null;
    }

    // ── High-Contrast Anatomical Lighting ──
    scene.add(new AmbientLight(0xffffff, 0.85));

    // Key front light
    const keyLight = new DirectionalLight(0xffffff, 1.4);
    keyLight.position.set(3, 4, 4);
    scene.add(keyLight);

    // Cyan rim backlight halo (signature STRKYR medical contour glow)
    const rimCyan = new DirectionalLight(0x00f5ff, 1.8);
    rimCyan.position.set(0, 2, -3);
    scene.add(rimCyan);

    const fillSky = new DirectionalLight(0x8cb0d0, 0.7);
    fillSky.position.set(-3, 2, 2);
    scene.add(fillSky);

    // Medical pedestal ground
    const groundGeom = new CircleGeometry(2.4, 64);
    const groundMat = new MeshStandardMaterial({
      color: 0x091122,
      roughness: 0.95,
      metalness: 0.1,
    });
    const ground = new Mesh(groundGeom, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -2.55;
    scene.add(ground);

    // Body Group (centered at origin for 360° rotation)
    const bodyGroup = new Group();
    bodyGroup.position.set(0, 0, 0);
    scene.add(bodyGroup);
    bodyGroupRef.current = bodyGroup;

    const muscleMap = new Map<MuscleGroupId, Mesh[]>();
    muscleMeshesRef.current = muscleMap;

    const findFlag = (obj: Object3D, key: string): any => {
      for (let p: Object3D | null = obj; p; p = p.parent) {
        if (p.userData && p.userData[key] != null) return p.userData[key];
      }
      return null;
    };

    const applyMaterialToMesh = (mesh: Mesh, muscleId: MuscleGroupId | null) => {
      const isSelected = selectedMuscle === muscleId;
      const isHovered = hoveredMuscle === muscleId;
      if (isSelected) {
        mesh.material = new MeshStandardMaterial({
          color: 0x00f5ff,
          emissive: 0x00d8f0,
          emissiveIntensity: 0.95,
          roughness: 0.2,
          metalness: 0.15,
          side: DoubleSide,
        });
      } else if (isHovered) {
        mesh.material = new MeshStandardMaterial({
          color: 0x38bdf8,
          emissive: 0x0284c7,
          emissiveIntensity: 0.5,
          roughness: 0.3,
          metalness: 0.1,
          side: DoubleSide,
        });
      } else if (muscleId) {
        mesh.material = new MeshStandardMaterial({
          color: 0x9b4844,
          roughness: 0.55,
          metalness: 0.05,
          emissive: 0x220a08,
          emissiveIntensity: 0.12,
          side: DoubleSide,
        });
      } else {
        mesh.material = new MeshStandardMaterial({
          color: 0xded8c8,
          roughness: 0.85,
          metalness: 0.0,
          side: DoubleSide,
        });
      }
    };

    // Load Z-Anatomy Real 3D Human Musculature Model
    setIsModelLoading(true);
    try {
      const loader = new GLTFLoader();
      const dracoLoader = new DRACOLoader();
      dracoLoader.setDecoderPath("/draco/gltf/");
      loader.setDRACOLoader(dracoLoader);

      loader.load(
        "/models/anatomy_musculature.glb",
        (gltf) => {
          const model = gltf.scene;

          model.traverse((child) => {
            if ((child as Mesh).isMesh) {
              const mesh = child as Mesh;
              const rawMuscle = findFlag(mesh, "muscle");
              const muscleId = rawMuscle ? RAW_TO_MUSCLE_ID[rawMuscle] : null;

              if (muscleId) {
                mesh.userData.muscleId = muscleId;
                applyMaterialToMesh(mesh, muscleId);
                const arr = muscleMap.get(muscleId) || [];
                arr.push(mesh);
                muscleMap.set(muscleId, arr);
              } else {
                applyMaterialToMesh(mesh, null);
              }
            }
          });

          // Scale and center model
          const scaleFactor = 0.032;
          model.scale.setScalar(scaleFactor);

          const box = new Box3().setFromObject(model);
          const center = box.getCenter(new Vector3());

          model.position.x = -center.x;
          model.position.y = -center.y + 0.05;
          model.position.z = -center.z;

          bodyGroup.add(model);
          muscleMeshesRef.current = muscleMap;
          setIsModelLoading(false);
        },
        undefined,
        (err) => {
          console.error("Failed to load anatomy GLB:", err);
          setIsModelLoading(false);
        }
      );
    } catch {
      // In non-browser / JSDOM test environments, gracefully skip loader
      setIsModelLoading(false);
    }

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
      const aspect = cw / ch;
      camera.aspect = aspect;
      camera.position.z = aspect < 0.65 ? 10.2 : aspect < 0.85 ? 9.5 : 8.8;
      camera.lookAt(0, 0, 0);
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

      if (sceneRef.current) {
        sceneRef.current.traverse((obj) => {
          if (obj instanceof Mesh) {
            if (obj.geometry) obj.geometry.dispose();
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
          // ignore
        }
        if (renderer.domElement && renderer.domElement.parentNode) {
          renderer.domElement.parentNode.removeChild(renderer.domElement);
        }
        rendererRef.current = null;
      }
    };
  }, [viewMode]);

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
    if (viewMode !== "3D") return;
    setIsDragging(true);
    setIsAutoRotating(false);
    dragStartXRef.current = e.clientX;
    startAngleRef.current = rotationAngle;
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (viewMode !== "3D" || e.touches.length === 0) return;
    setIsDragging(true);
    setIsAutoRotating(false);
    dragStartXRef.current = e.touches[0].clientX;
    startAngleRef.current = rotationAngle;
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (viewMode !== "3D") return;
      if (isDragging) {
        const dx = e.clientX - dragStartXRef.current;
        setRotationAngle((startAngleRef.current + dx * 0.8 + 360) % 360);
      } else {
        const muscleId = raycast(e.clientX, e.clientY);
        setCursor3dMuscle(muscleId);
        onHoverMuscle?.(muscleId);
      }
    },
    [isDragging, raycast, onHoverMuscle, viewMode]
  );

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (viewMode !== "3D" || !isDragging || e.touches.length === 0) return;
      const dx = e.touches[0].clientX - dragStartXRef.current;
      setRotationAngle((startAngleRef.current + dx * 0.8 + 360) % 360);
    },
    [isDragging, viewMode]
  );

  const handleMouseUp = useCallback(
    (e: MouseEvent) => {
      if (viewMode !== "3D") return;
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
    [isDragging, raycast, onSelectMuscle, viewMode]
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

  // Pill click: select + auto-face
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

  // Current high-res medical diagram image
  const currentDiagramImage =
    currentPerspective === "posterior"
      ? "/anatomy/body_posterior.jpg"
      : currentPerspective === "lateral"
      ? "/anatomy/body_lateral.jpg"
      : "/anatomy/body_anterior.jpg";

  return (
    <div
      data-testid="interactive-body-map"
      className={`relative flex flex-col items-center select-none rounded-3xl p-5 transition-all duration-300 ${
        isDark
          ? "bg-slate-900/95 border border-slate-800 shadow-2xl text-slate-100 backdrop-blur-xl"
          : "bg-white border border-slate-200 shadow-xl text-slate-900"
      } ${className}`}
    >
      {/* Top Header with Mode Switcher & Presets */}
      <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <span className="inline-flex p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-md shadow-cyan-500/20">
            <Rotate3d size={18} />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-black tracking-tight text-white">Interactive Anatomy Model</h3>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                {viewMode === "3D" ? "3D WebGL" : "Medical Diagram"}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
              <MousePointer2 size={10} className="inline" />
              {viewMode === "3D"
                ? "Click any 3D muscle or drag to rotate 360°"
                : "Interactive medical-grade anatomy chart"}
            </p>
          </div>
        </div>

        {/* Controls: View Mode & Perspectives */}
        <div className="flex flex-wrap items-center gap-1.5">
          {/* Mode Switcher */}
          <div className="flex items-center bg-slate-950 p-1 rounded-2xl border border-slate-800">
            <button
              type="button"
              data-testid="mode-toggle-3d"
              onClick={() => setViewMode("3D")}
              className={`px-2.5 py-1 text-[11px] font-black rounded-xl transition-all ${
                viewMode === "3D"
                  ? "bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/25"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              3D Model
            </button>
            <button
              type="button"
              data-testid="mode-toggle-diagram"
              onClick={() => setViewMode("DIAGRAM")}
              className={`px-2.5 py-1 text-[11px] font-black rounded-xl transition-all ${
                viewMode === "DIAGRAM"
                  ? "bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/25"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Diagram
            </button>
          </div>

          {/* Perspective Buttons */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-2xl border border-slate-800">
            {([
              { label: "Front", angle: 0, perspective: "anterior" as const },
              { label: "Side", angle: 90, perspective: "lateral" as const },
              { label: "Back", angle: 180, perspective: "posterior" as const },
            ]).map(({ label, angle, perspective }) => (
              <button
                key={label}
                type="button"
                data-testid={label === "Front" ? "toggle-anterior" : label === "Back" ? "toggle-posterior" : undefined}
                onClick={() => {
                  setIsAutoRotating(false);
                  setRotationAngle(angle);
                }}
                className={`px-2.5 py-1 text-xs font-black rounded-xl transition-all ${
                  currentPerspective === perspective
                    ? "bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/25"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {label}
              </button>
            ))}

            {viewMode === "3D" && (
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
                {isAutoRotating ? <Pause size={13} /> : <Play size={13} />}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Viewport Container */}
      <div
        data-testid="body-map-viewport"
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        className="relative w-full max-w-[290px] sm:max-w-[340px] aspect-[4/5] sm:aspect-[9/14] max-h-[380px] sm:max-h-[480px] rounded-3xl overflow-hidden bg-[#070b14] border-2 border-slate-800/80 shadow-2xl select-none flex items-center justify-center touch-none"
        style={{
          cursor: viewMode === "3D" ? (isDragging ? "grabbing" : cursor3dMuscle ? "pointer" : "grab") : "default",
          touchAction: "none",
        }}
      >
        {/* 3D WebGL Canvas Mode */}
        {viewMode === "3D" ? (
          <>
            <div ref={mountRef} className="w-full h-full" />
            {isModelLoading && (
              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-2 bg-[#070b14]/85 backdrop-blur-sm pointer-events-none select-none">
                <div className="w-7 h-7 rounded-full border-2 border-cyan-400/30 border-t-cyan-400 animate-spin" />
                <span className="text-[11px] font-bold text-slate-300">Loading 3D Anatomy...</span>
                <span className="text-[9px] text-slate-500 font-medium">1.45 MB Draco Stream</span>
              </div>
            )}
          </>
        ) : (
          /* High-Res Medical Diagram Mode with Interactive SVG Overlays */
          <div className="relative w-full h-full flex items-center justify-center p-2">
            <img
              src={currentDiagramImage}
              alt="Medical Anatomy Diagram"
              className="w-full h-full object-contain filter drop-shadow-2xl"
            />

            {/* Interactive SVG Muscle Hotspots Overlay */}
            <svg
              viewBox="0 0 100 100"
              className="absolute inset-0 w-full h-full pointer-events-auto"
            >
              {Object.values(MUSCLE_DEFINITIONS).map((muscle) => {
                const isAnterior = currentPerspective === "anterior";
                const isPosterior = currentPerspective === "posterior";
                const spot = isAnterior ? muscle.hotspot?.anterior : isPosterior ? muscle.hotspot?.posterior : null;
                if (!spot) return null;

                const isSelected = selectedMuscle === muscle.id;
                const isHovered = hoveredMuscle === muscle.id;

                return (
                  <rect
                    key={muscle.id}
                    x={`${spot.x}%`}
                    y={`${spot.y}%`}
                    width={`${spot.w}%`}
                    height={`${spot.h}%`}
                    rx="3"
                    ry="3"
                    onClick={() => onSelectMuscle(muscle.id)}
                    onMouseEnter={() => onHoverMuscle?.(muscle.id)}
                    onMouseLeave={() => onHoverMuscle?.(null)}
                    className="cursor-pointer transition-all duration-300"
                    fill={isSelected ? "rgba(0, 245, 255, 0.35)" : isHovered ? "rgba(56, 189, 248, 0.25)" : "transparent"}
                    stroke={isSelected ? "#00f5ff" : isHovered ? "#38bdf8" : "transparent"}
                    strokeWidth={isSelected ? 1.2 : 0.8}
                    strokeDasharray={isSelected ? "2 2" : undefined}
                  />
                );
              })}
            </svg>
          </div>
        )}

        {/* Hover Tooltip */}
        {hoveredMuscle && !selectedMuscle && !isDragging && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 px-3.5 py-1.5 rounded-xl bg-slate-950/90 border border-cyan-500/40 text-[11px] font-bold text-cyan-300 backdrop-blur-sm z-30 pointer-events-none whitespace-nowrap shadow-lg shadow-cyan-500/15">
            {MUSCLE_DEFINITIONS[hoveredMuscle].name}
          </div>
        )}

        {/* Selected Muscle HUD Callout */}
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
            <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider bg-cyan-500 text-slate-950 shadow-sm shadow-cyan-500/30">
              Selected
            </span>
          </div>
        )}
      </div>

      {/* 360° Rotation Slider (Available in 3D Mode) */}
      {viewMode === "3D" && (
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
      )}

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
