"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import * as THREE from "three";
import {
  Rotate3d,
  Play,
  Pause,
  RotateCw,
  Crosshair,
  Activity,
  Sparkles,
  Info,
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
  const mountRef = useRef<HTMLDivElement>(null);
  const [rotationAngle, setRotationAngle] = useState<number>(0);
  const [isAutoRotating, setIsAutoRotating] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const bodyGroupRef = useRef<THREE.Group | null>(null);
  const muscleMeshesRef = useRef<Map<MuscleGroupId, THREE.Mesh[]>>(new Map());
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const reqIdRef = useRef<number | null>(null);

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
      setRotationAngle((prev) => (prev + 1.2) % 360);
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
        const mat = mesh.material as THREE.MeshStandardMaterial;
        if (isSelected) {
          mat.color.setHex(0x00f5ff);
          mat.emissive.setHex(0x00f5ff);
          mat.emissiveIntensity = 0.85;
          mat.roughness = 0.2;
          mat.metalness = 0.5;
        } else if (isHovered) {
          mat.color.setHex(0x38bdf8);
          mat.emissive.setHex(0x38bdf8);
          mat.emissiveIntensity = 0.45;
          mat.roughness = 0.3;
          mat.metalness = 0.3;
        } else {
          // Base athletic anatomical muscular tone
          mat.color.setHex(0x8a3a34);
          mat.emissive.setHex(0x1a0808);
          mat.emissiveIntensity = 0.1;
          mat.roughness = 0.6;
          mat.metalness = 0.15;
        }
      });
    });
  }, [selectedMuscle, hoveredMuscle]);

  // Build Real 3D Human Anatomy Geometry Scene
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0f1d);
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(38, container.clientWidth / container.clientHeight, 0.1, 100);
    camera.position.set(0, 0, 9.2);
    cameraRef.current = camera;

    // 3. Renderer
    let renderer: THREE.WebGLRenderer | null = null;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setSize(container.clientWidth || 340, container.clientHeight || 560);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.2;
      container.innerHTML = "";
      container.appendChild(renderer.domElement);
      rendererRef.current = renderer;
    } catch {
      // Fallback for non-WebGL / test environments
      renderer = null;
    }

    // 4. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 1.4);
    dirLight1.position.set(5, 8, 6);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x00f5ff, 0.8);
    dirLight2.position.set(-6, -4, 4);
    scene.add(dirLight2);

    const backLight = new THREE.DirectionalLight(0x38bdf8, 1.0);
    backLight.position.set(0, 5, -8);
    scene.add(backLight);

    // 5. Build 3D Human Anatomical Muscular Model
    const bodyGroup = new THREE.Group();
    bodyGroup.position.y = -0.1;
    scene.add(bodyGroup);
    bodyGroupRef.current = bodyGroup;

    const muscleMap = new Map<MuscleGroupId, THREE.Mesh[]>();

    const createMuscleMesh = (
      id: MuscleGroupId,
      geom: THREE.BufferGeometry,
      pos: [number, number, number],
      rot: [number, number, number] = [0, 0, 0],
      scale: [number, number, number] = [1, 1, 1]
    ) => {
      const mat = new THREE.MeshStandardMaterial({
        color: 0x8a3a34,
        roughness: 0.6,
        metalness: 0.15,
        emissive: 0x1a0808,
        emissiveIntensity: 0.1,
      });
      const mesh = new THREE.Mesh(geom, mat);
      mesh.position.set(...pos);
      mesh.rotation.set(...rot);
      mesh.scale.set(...scale);
      mesh.userData = { muscleId: id };
      bodyGroup.add(mesh);

      const existing = muscleMap.get(id) || [];
      existing.push(mesh);
      muscleMap.set(id, existing);
      return mesh;
    };

    // Helper Geometries
    const headGeom = new THREE.SphereGeometry(0.48, 32, 32);
    const neckGeom = new THREE.CylinderGeometry(0.24, 0.28, 0.45, 24);
    const pecGeom = new THREE.BoxGeometry(0.46, 0.42, 0.28);
    const deltGeom = new THREE.SphereGeometry(0.32, 24, 24);
    const bicepGeom = new THREE.CylinderGeometry(0.18, 0.16, 0.72, 20);
    const tricepGeom = new THREE.CylinderGeometry(0.19, 0.16, 0.75, 20);
    const forearmGeom = new THREE.CylinderGeometry(0.15, 0.12, 0.85, 20);
    const absGeom = new THREE.BoxGeometry(0.28, 0.24, 0.15);
    const obliqueGeom = new THREE.BoxGeometry(0.22, 0.75, 0.26);
    const trapGeom = new THREE.ConeGeometry(0.55, 0.75, 4);
    const latGeom = new THREE.BoxGeometry(0.38, 0.75, 0.22);
    const lowerBackGeom = new THREE.BoxGeometry(0.42, 0.6, 0.24);
    const gluteGeom = new THREE.SphereGeometry(0.46, 24, 24);
    const quadGeom = new THREE.CylinderGeometry(0.32, 0.24, 1.45, 24);
    const hamstringGeom = new THREE.CylinderGeometry(0.31, 0.23, 1.45, 24);
    const adductorGeom = new THREE.CylinderGeometry(0.2, 0.15, 1.2, 16);
    const calfGeom = new THREE.CylinderGeometry(0.24, 0.16, 1.35, 24);
    const tibialisGeom = new THREE.CylinderGeometry(0.2, 0.14, 1.35, 20);

    // Skeleton Core & Head
    const headMat = new THREE.MeshStandardMaterial({ color: 0x6e2f2b, roughness: 0.5 });
    const head = new THREE.Mesh(headGeom, headMat);
    head.position.set(0, 3.2, 0);
    bodyGroup.add(head);

    const neck = new THREE.Mesh(neckGeom, headMat);
    neck.position.set(0, 2.7, 0);
    bodyGroup.add(neck);

    // Torso Core Frame
    const coreSpine = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.24, 1.8, 16), headMat);
    coreSpine.position.set(0, 1.7, 0);
    bodyGroup.add(coreSpine);

    // 1. CHEST (Pectorals)
    createMuscleMesh("chest", pecGeom, [-0.32, 2.15, 0.24], [0, 0.15, -0.05]);
    createMuscleMesh("chest", pecGeom, [0.32, 2.15, 0.24], [0, -0.15, 0.05]);

    // 2. SHOULDERS (Deltoids)
    createMuscleMesh("shoulders", deltGeom, [-0.85, 2.25, 0.05], [0, 0, 0.2], [1.1, 1.2, 1.0]);
    createMuscleMesh("shoulders", deltGeom, [0.85, 2.25, 0.05], [0, 0, -0.2], [1.1, 1.2, 1.0]);

    // 3. BICEPS
    createMuscleMesh("biceps", bicepGeom, [-0.88, 1.6, 0.1], [0, 0, 0.1]);
    createMuscleMesh("biceps", bicepGeom, [0.88, 1.6, 0.1], [0, 0, -0.1]);

    // 4. TRICEPS
    createMuscleMesh("triceps", tricepGeom, [-0.88, 1.6, -0.12], [0, 0, 0.1]);
    createMuscleMesh("triceps", tricepGeom, [0.88, 1.6, -0.12], [0, 0, -0.1]);

    // 5. FOREARMS
    createMuscleMesh("forearms", forearmGeom, [-0.96, 0.75, 0.05], [0, 0, 0.08]);
    createMuscleMesh("forearms", forearmGeom, [0.96, 0.75, 0.05], [0, 0, -0.08]);

    // 6. ABS (6-Pack)
    createMuscleMesh("abs", absGeom, [-0.17, 1.75, 0.26]);
    createMuscleMesh("abs", absGeom, [0.17, 1.75, 0.26]);
    createMuscleMesh("abs", absGeom, [-0.17, 1.45, 0.26]);
    createMuscleMesh("abs", absGeom, [0.17, 1.45, 0.26]);
    createMuscleMesh("abs", absGeom, [-0.16, 1.15, 0.25]);
    createMuscleMesh("abs", absGeom, [0.16, 1.15, 0.25]);

    // 7. OBLIQUES
    createMuscleMesh("obliques", obliqueGeom, [-0.46, 1.45, 0.12], [0, 0, 0.15]);
    createMuscleMesh("obliques", obliqueGeom, [0.46, 1.45, 0.12], [0, 0, -0.15]);

    // 8. TRAPS & UPPER BACK
    createMuscleMesh("traps", trapGeom, [0, 2.28, -0.18], [0, 0, Math.PI], [1.4, 1.0, 0.6]);

    // 9. LATS
    createMuscleMesh("lats", latGeom, [-0.44, 1.78, -0.16], [0, 0.2, 0.15]);
    createMuscleMesh("lats", latGeom, [0.44, 1.78, -0.16], [0, -0.2, -0.15]);

    // 10. LOWER BACK
    createMuscleMesh("lower_back", lowerBackGeom, [0, 1.25, -0.16]);

    // 11. GLUTES
    createMuscleMesh("glutes", gluteGeom, [-0.36, 0.55, -0.22], [0, 0, 0.15], [1.0, 1.15, 1.1]);
    createMuscleMesh("glutes", gluteGeom, [0.36, 0.55, -0.22], [0, 0, -0.15], [1.0, 1.15, 1.1]);

    // 12. QUADS
    createMuscleMesh("quads", quadGeom, [-0.42, -0.42, 0.12], [0.05, 0, 0.05]);
    createMuscleMesh("quads", quadGeom, [0.42, -0.42, 0.12], [0.05, 0, -0.05]);

    // 13. HAMSTRINGS
    createMuscleMesh("hamstrings", hamstringGeom, [-0.42, -0.42, -0.14], [-0.05, 0, 0.05]);
    createMuscleMesh("hamstrings", hamstringGeom, [0.42, -0.42, -0.14], [-0.05, 0, -0.05]);

    // 14. ADDUCTORS
    createMuscleMesh("adductors", adductorGeom, [-0.18, -0.35, 0.02], [0, 0, -0.08]);
    createMuscleMesh("adductors", adductorGeom, [0.18, -0.35, 0.02], [0, 0, 0.08]);

    // 15. CALVES
    createMuscleMesh("calves", calfGeom, [-0.42, -1.95, -0.12], [-0.05, 0, 0.03]);
    createMuscleMesh("calves", calfGeom, [0.42, -1.95, -0.12], [-0.05, 0, -0.03]);

    // 16. TIBIALIS
    createMuscleMesh("tibialis", tibialisGeom, [-0.42, -1.95, 0.12], [0.05, 0, 0.03]);
    createMuscleMesh("tibialis", tibialisGeom, [0.42, -1.95, 0.12], [0.05, 0, -0.03]);

    muscleMeshesRef.current = muscleMap;

    // Render loop
    const animate = () => {
      reqIdRef.current = requestAnimationFrame(animate);
      if (renderer) {
        renderer.render(scene, camera);
      }
    };
    if (renderer) animate();

    const handleResize = () => {
      if (!container || !camera || !renderer) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      if (reqIdRef.current) cancelAnimationFrame(reqIdRef.current);
      if (renderer) renderer.dispose();
    };
  }, []);

  // Raycaster for 3D Muscle Click and Hover
  const handlePointerRaycast = useCallback(
    (clientX: number, clientY: number, isClick: boolean) => {
      const container = mountRef.current;
      const camera = cameraRef.current;
      const bodyGroup = bodyGroupRef.current;
      if (!container || !camera || !bodyGroup) return;

      const rect = container.getBoundingClientRect();
      const x = ((clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((clientY - rect.height) / rect.height) * 2 + 1;

      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(new THREE.Vector2(x, y), camera);

      const intersects = raycaster.intersectObjects(bodyGroup.children, true);
      if (intersects.length > 0) {
        const hit = intersects.find((i) => (i.object as any).userData?.muscleId);
        if (hit) {
          const muscleId = (hit.object as any).userData.muscleId as MuscleGroupId;
          if (isClick) {
            onSelectMuscle(muscleId);
          } else {
            onHoverMuscle?.(muscleId);
          }
          return;
        }
      }
      if (!isClick) onHoverMuscle?.(null);
    },
    [onSelectMuscle, onHoverMuscle]
  );

  // Mouse & Touch Handlers
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
        const deltaX = e.clientX - dragStartXRef.current;
        const newAngle = (startAngleRef.current + deltaX * 0.85 + 360) % 360;
        setRotationAngle(newAngle);
      } else {
        handlePointerRaycast(e.clientX, e.clientY, false);
      }
    },
    [isDragging, handlePointerRaycast]
  );

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!isDragging || e.touches.length === 0) return;
      const deltaX = e.touches[0].clientX - dragStartXRef.current;
      const newAngle = (startAngleRef.current + deltaX * 0.85 + 360) % 360;
      setRotationAngle(newAngle);
    },
    [isDragging]
  );

  const handleMouseUp = useCallback(
    (e: MouseEvent) => {
      if (isDragging) {
        // If movement was minimal, consider it a click!
        if (Math.abs(e.clientX - dragStartXRef.current) < 5) {
          handlePointerRaycast(e.clientX, e.clientY, true);
        }
        setIsDragging(false);
      }
    },
    [isDragging, handlePointerRaycast]
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

  // When a muscle is selected, smoothly rotate the 3D model if on opposite side
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
              <h3 className="text-sm font-black tracking-tight text-white">WebGL 3D Human Anatomy Model</h3>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                GPU 3D
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">Click any 3D muscle volume directly or drag to rotate 360°</p>
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

      {/* Real WebGL 3D Canvas Viewport */}
      <div
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        className="relative w-full max-w-[340px] aspect-[9/16] rounded-3xl overflow-hidden bg-[#0a0f1d] border-2 border-slate-800/80 shadow-2xl flex items-center justify-center cursor-grab active:cursor-grabbing group select-none"
      >
        {/* Three.js Canvas Mount */}
        <div ref={mountRef} className="w-full h-full" />

        {/* HUD Medical Callout for Selected Muscle */}
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
            <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider bg-cyan-500 text-slate-950 shadow-sm shadow-cyan-500/40">
              Active Focus
            </span>
          </div>
        )}
      </div>

      {/* 360 Rotation Slider Control */}
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
