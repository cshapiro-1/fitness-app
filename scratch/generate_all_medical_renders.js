const fs = require('fs');
const path = require('path');

const publicAnatomyDir = path.join(__dirname, '..', 'public', 'anatomy');

function escapeXml(unsafe) {
  if (!unsafe) return '';
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function createMedicalDiagramSvg({
  title,
  subtitle,
  primaryTarget,
  synergistTarget,
  cues,
  anatomyFigure,
  primaryMuscleGlow,
  synergistMuscleGlow,
  jointAngleOverlay
}) {
  const safeTitle = escapeXml(title.toUpperCase());
  const safeSubtitle = escapeXml(subtitle);
  const safePrimary = escapeXml(primaryTarget.toUpperCase());
  const safeSynergist = escapeXml(synergistTarget);

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 880 640" width="100%" height="100%" style="background: radial-gradient(circle at 45% 45%, #131d31 0%, #080c14 100%); font-family: system-ui, -apple-system, sans-serif;">
  <defs>
    <!-- Multi-stage Glow Filters -->
    <filter id="primary-intense-glow" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="8" result="blur1" />
      <feGaussianBlur stdDeviation="3" result="blur2" />
      <feMerge>
        <feMergeNode in="blur1" />
        <feMergeNode in="blur2" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
    <filter id="synergist-glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="5" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
    <filter id="card-shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#000000" flood-opacity="0.6"/>
    </filter>

    <!-- Medical Shader Gradients -->
    <linearGradient id="primary-fibers" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#38bdf8" />
      <stop offset="45%" stop-color="#0ea5e9" />
      <stop offset="85%" stop-color="#0284c7" />
      <stop offset="100%" stop-color="#0369a1" />
    </linearGradient>
    <linearGradient id="synergist-fibers" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fbbf24" />
      <stop offset="60%" stop-color="#f59e0b" />
      <stop offset="100%" stop-color="#b45309" />
    </linearGradient>
    <linearGradient id="flesh-base" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#334155" />
      <stop offset="60%" stop-color="#1e293b" />
      <stop offset="100%" stop-color="#0f172a" />
    </linearGradient>
    <linearGradient id="bone-tone" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#94a3b8" />
      <stop offset="100%" stop-color="#64748b" />
    </linearGradient>
    <pattern id="grid-pattern" width="30" height="30" patternUnits="userSpaceOnUse">
      <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#1e293b" stroke-width="0.75" opacity="0.35"/>
    </pattern>
  </defs>

  <!-- Background Grid -->
  <rect width="100%" height="100%" fill="url(#grid-pattern)" />

  <!-- Studio Ambient Floor Reflection -->
  <ellipse cx="440" cy="570" rx="340" ry="35" fill="#0f172a" opacity="0.8" />
  <line x1="80" y1="570" x2="800" y2="570" stroke="#1e293b" stroke-width="2" stroke-dasharray="6,6"/>

  <!-- Top Kinesiology Diagnostic Header -->
  <g transform="translate(36, 32)">
    <rect width="480" height="52" rx="10" fill="#0b1120" stroke="#1e293b" stroke-width="1.5" filter="url(#card-shadow)"/>
    <circle cx="24" cy="26" r="7" fill="#38bdf8" filter="url(#primary-intense-glow)"/>
    <text x="44" y="24" fill="#ffffff" font-size="14" font-weight="800" letter-spacing="0.5">${safeTitle}</text>
    <text x="44" y="42" fill="#94a3b8" font-size="11" font-weight="600">${safeSubtitle}</text>
    <rect x="360" y="14" width="105" height="24" rx="6" fill="#1e293b" stroke="#334155"/>
    <text x="412" y="30" fill="#38bdf8" font-size="10" font-weight="800" text-anchor="middle">3D ANATOMY</text>
  </g>

  <!-- Base Musculoskeletal Figure (Flesh & Skeleton Layers) -->
  <g id="figure-base">
    ${anatomyFigure}
  </g>

  <!-- Synergist / Secondary Muscle Highlights (Glowing Amber) -->
  <g id="synergist-muscles" filter="url(#synergist-glow)">
    ${synergistMuscleGlow}
  </g>

  <!-- Primary Target Muscle Fibers (Intense Electric Cyan Glow) -->
  <g id="primary-muscles" filter="url(#primary-intense-glow)">
    ${primaryMuscleGlow}
  </g>

  <!-- Biomechanical Joint Angle Overlays & Direction of Force Vectors -->
  <g id="biomechanics-vectors">
    ${jointAngleOverlay || ''}
  </g>

  <!-- Kinesiology Data Legend Card -->
  <g transform="translate(540, 100)" filter="url(#card-shadow)">
    <rect width="304" height="200" rx="12" fill="#0b1120" stroke="#1e293b" stroke-width="1.5"/>
    
    <!-- Header Indicator -->
    <rect x="16" y="16" width="272" height="28" rx="6" fill="#1e293b"/>
    <circle cx="28" cy="30" r="5" fill="#38bdf8"/>
    <text x="40" y="34" fill="#38bdf8" font-size="11" font-weight="800">PRIMARY: ${safePrimary}</text>

    <!-- Synergist Indicator -->
    <rect x="16" y="50" width="272" height="24" rx="6" fill="#182030"/>
    <circle cx="28" cy="62" r="4" fill="#f59e0b"/>
    <text x="40" y="66" fill="#f59e0b" font-size="10" font-weight="700">SYNERGISTS: ${safeSynergist}</text>

    <!-- Biomechanics Coaching Points -->
    <text x="16" y="94" fill="#64748b" font-size="10" font-weight="800" letter-spacing="0.5">COACHING CUES &amp; KINEMATICS</text>
    ${cues.map((c, i) => `
    <g transform="translate(16, ${110 + i * 26})">
      <circle cx="6" cy="6" r="2.5" fill="#38bdf8"/>
      <text x="16" y="10" fill="#f1f5f9" font-size="11" font-weight="600">${escapeXml(c)}</text>
    </g>`).join('')}
  </g>
</svg>`;
}

const allRenders = {
  // 1. Incline Bench Press
  'incline_bench.svg': {
    title: "Incline Barbell Bench Press",
    subtitle: "Clavicular Head Upper Pec Isolation (30°-45°)",
    primaryTarget: "Pectoralis Major (Clavicular Head)",
    synergistTarget: "Anterior Deltoid, Triceps Brachii",
    cues: [
      "Set bench strictly at 30° to 45° angle",
      "Touch upper clavicular notch under control",
      "Retract scapulae with proud chest"
    ],
    anatomyFigure: `
      <!-- 45° Incline Bench Frame -->
      <line x1="160" y1="520" x2="380" y2="260" stroke="#334155" stroke-width="18" stroke-linecap="round"/>
      <line x1="380" y1="260" x2="380" y2="540" stroke="#1e293b" stroke-width="12"/>
      <line x1="220" y1="460" x2="220" y2="540" stroke="#1e293b" stroke-width="12"/>
      <!-- Body Profile on Incline -->
      <circle cx="360" cy="230" r="28" fill="url(#flesh-base)" stroke="#475569" stroke-width="2"/>
      <path d="M 330 260 L 220 420 L 260 540" stroke="url(#flesh-base)" stroke-width="32" stroke-linecap="round" fill="none"/>
      <!-- Barbell and Weight Stack -->
      <line x1="260" y1="160" x2="420" y2="160" stroke="#94a3b8" stroke-width="14" stroke-linecap="round"/>
      <circle cx="340" cy="160" r="38" fill="#1e293b" stroke="#64748b" stroke-width="5"/>
      <path d="M 320 270 L 340 180" stroke="#475569" stroke-width="18" stroke-linecap="round"/>
    `,
    synergistMuscleGlow: `
      <!-- Anterior Deltoid & Triceps -->
      <circle cx="330" cy="270" r="16" fill="url(#synergist-fibers)"/>
      <path d="M 330 240 L 340 190" stroke="url(#synergist-fibers)" stroke-width="14" stroke-linecap="round"/>
    `,
    primaryMuscleGlow: `
      <!-- Upper Clavicular Pectoral Fibers -->
      <path d="M 325 260 Q 365 245 385 275 Q 365 300 325 285 Z" fill="url(#primary-fibers)" stroke="#7dd3fc" stroke-width="2"/>
    `,
    jointAngleOverlay: `
      <!-- 30° Incline Angle Callout -->
      <path d="M 220 460 A 40 40 0 0 1 255 435" stroke="#38bdf8" stroke-width="2" fill="none" stroke-dasharray="3,3"/>
      <text x="265" y="445" fill="#38bdf8" font-size="11" font-weight="700">30°</text>
    `
  },

  // 2. Flat Dumbbell Press
  'flat_dumbbell_press.svg': {
    title: "Flat Dumbbell Press",
    subtitle: "Deep Pec Stretch & Converging Apex Press",
    primaryTarget: "Pectoralis Major (Sternal Fibers)",
    synergistTarget: "Anterior Delts, Triceps, Serratus",
    cues: [
      "Converging pressing arc at apex",
      "Deep 90° stretch with flared ribs",
      "Pack shoulder blades flat to bench"
    ],
    anatomyFigure: `
      <!-- Bench -->
      <rect x="180" y="380" width="300" height="38" rx="6" fill="#1e293b" stroke="#334155" stroke-width="2"/>
      <line x1="200" y1="420" x2="200" y2="550" stroke="#334155" stroke-width="8"/>
      <line x1="460" y1="420" x2="460" y2="550" stroke="#334155" stroke-width="8"/>
      <!-- Torso -->
      <circle cx="210" cy="350" r="26" fill="url(#flesh-base)"/>
      <path d="M 230 365 L 360 365 L 390 440 L 440 550" stroke="url(#flesh-base)" stroke-width="28" stroke-linecap="round" fill="none"/>
      <!-- Dumbbells -->
      <rect x="260" y="220" width="34" height="20" rx="4" fill="#64748b" stroke="#94a3b8" stroke-width="2"/>
      <rect x="350" y="220" width="34" height="20" rx="4" fill="#64748b" stroke="#94a3b8" stroke-width="2"/>
      <path d="M 280 340 L 275 240 M 350 340 L 365 240" stroke="#475569" stroke-width="16" stroke-linecap="round"/>
    `,
    synergistMuscleGlow: `
      <circle cx="270" cy="340" r="14" fill="url(#synergist-fibers)"/>
      <path d="M 275 310 L 275 250" stroke="url(#synergist-fibers)" stroke-width="12" stroke-linecap="round"/>
    `,
    primaryMuscleGlow: `
      <path d="M 275 335 Q 320 305 365 335 Q 345 365 290 365 Z" fill="url(#primary-fibers)" stroke="#7dd3fc" stroke-width="2"/>
    `
  },

  // 3. Push-Up
  'push_up.svg': {
    title: "Push-Up (Strict Arrow Stance)",
    subtitle: "Closed-Chain Pectoral & Core Stabilization",
    primaryTarget: "Pectoralis Major & Triceps Brachii",
    synergistTarget: "Anterior Deltoid, Rectus Abdominis",
    cues: [
      "Rigid plank line from head to heels",
      "Tuck elbows at 45° like an arrow",
      "Full protraction squeeze at top"
    ],
    anatomyFigure: `
      <circle cx="220" cy="350" r="24" fill="url(#flesh-base)"/>
      <path d="M 240 370 L 460 370 L 480 470" stroke="url(#flesh-base)" stroke-width="24" stroke-linecap="round" fill="none"/>
      <path d="M 250 370 L 260 470" stroke="#475569" stroke-width="18" stroke-linecap="round"/>
    `,
    synergistMuscleGlow: `
      <circle cx="250" cy="370" r="14" fill="url(#synergist-fibers)"/>
      <path d="M 300 370 L 420 370" stroke="url(#synergist-fibers)" stroke-width="12" stroke-linecap="round"/>
    `,
    primaryMuscleGlow: `
      <path d="M 245 365 Q 285 345 315 365 Q 295 390 255 385 Z" fill="url(#primary-fibers)" stroke="#7dd3fc" stroke-width="2"/>
      <path d="M 255 380 L 258 440" stroke="url(#primary-fibers)" stroke-width="12" stroke-linecap="round"/>
    `
  },

  // 4. Barbell Bent-Over Row
  'barbell_row.svg': {
    title: "Barbell Bent-Over Row",
    subtitle: "45° Hinge Lat & Upper Back Thickness",
    primaryTarget: "Latissimus Dorsi, Rhomboids & Trapezius",
    synergistTarget: "Posterior Deltoid, Biceps, Spinal Erectors",
    cues: [
      "Hinge torso to 45° with neutral spine",
      "Drive elbows straight back to hips",
      "Full eccentric lat stretch at bottom"
    ],
    anatomyFigure: `
      <circle cx="360" cy="200" r="26" fill="url(#flesh-base)"/>
      <path d="M 345 230 L 280 320 L 320 440 L 300 540" stroke="url(#flesh-base)" stroke-width="24" stroke-linecap="round" fill="none"/>
      <path d="M 340 240 L 310 350 L 310 440" stroke="#475569" stroke-width="18" stroke-linecap="round" fill="none"/>
      <line x1="240" y1="440" x2="380" y2="440" stroke="#94a3b8" stroke-width="14" stroke-linecap="round"/>
      <circle cx="310" cy="440" r="30" fill="#1e293b" stroke="#64748b" stroke-width="4"/>
    `,
    synergistMuscleGlow: `
      <circle cx="335" cy="240" r="14" fill="url(#synergist-fibers)"/>
      <path d="M 290 330 L 310 420" stroke="url(#synergist-fibers)" stroke-width="14" stroke-linecap="round"/>
    `,
    primaryMuscleGlow: `
      <path d="M 330 240 Q 280 280 295 340 Q 330 300 345 250 Z" fill="url(#primary-fibers)" stroke="#7dd3fc" stroke-width="2"/>
    `
  },

  // 5. Lat Pulldown
  'lat_pulldown.svg': {
    title: "Lat Pulldown (Wide Grip)",
    subtitle: "Latissimus Dorsi Outer Flare & Width",
    primaryTarget: "Latissimus Dorsi & Teres Major",
    synergistTarget: "Biceps Brachii, Rhomboids, Lower Traps",
    cues: [
      "10°-15° torso lean with chest proud",
      "Drive elbows down into back pockets",
      "Full overhead reach and lat stretch"
    ],
    anatomyFigure: `
      <circle cx="340" cy="210" r="26" fill="url(#flesh-base)"/>
      <path d="M 320 240 L 360 240 L 350 410 L 310 410 Z" fill="url(#flesh-base)"/>
      <path d="M 310 240 L 270 130 M 370 240 L 410 130" stroke="url(#flesh-base)" stroke-width="20" stroke-linecap="round"/>
      <line x1="220" y1="120" x2="460" y2="120" stroke="#94a3b8" stroke-width="12" stroke-linecap="round"/>
      <rect x="290" y="410" width="80" height="90" rx="6" fill="#1e293b" stroke="#334155" stroke-width="2"/>
    `,
    synergistMuscleGlow: `
      <circle cx="280" cy="180" r="14" fill="url(#synergist-fibers)"/>
      <circle cx="400" cy="180" r="14" fill="url(#synergist-fibers)"/>
    `,
    primaryMuscleGlow: `
      <path d="M 315 250 Q 265 310 305 390 Q 330 320 325 260 Z" fill="url(#primary-fibers)" stroke="#7dd3fc" stroke-width="2"/>
      <path d="M 365 250 Q 415 310 375 390 Q 350 320 355 260 Z" fill="url(#primary-fibers)" stroke="#7dd3fc" stroke-width="2"/>
    `
  },

  // 6. Pull-Up
  'pull_up.svg': {
    title: "Wide-Grip Pull-Up",
    subtitle: "Vertical Pulling Relative Bodyweight Strength",
    primaryTarget: "Latissimus Dorsi & Teres Major",
    synergistTarget: "Biceps, Rhomboids, Core Cylinder",
    cues: [
      "Dead hang to chin completely over bar",
      "Depress scapulae before bending elbows",
      "Controlled 3-second eccentric drop"
    ],
    anatomyFigure: `
      <line x1="200" y1="90" x2="480" y2="90" stroke="#94a3b8" stroke-width="14" stroke-linecap="round"/>
      <circle cx="340" cy="160" r="26" fill="url(#flesh-base)"/>
      <path d="M 315 200 L 365 200 L 360 380 L 320 380 Z" fill="url(#flesh-base)"/>
      <path d="M 310 200 L 260 100 M 370 200 L 420 100" stroke="url(#flesh-base)" stroke-width="20" stroke-linecap="round"/>
      <path d="M 330 380 L 320 510 M 350 380 L 360 510" stroke="#334155" stroke-width="18" stroke-linecap="round"/>
    `,
    synergistMuscleGlow: `
      <circle cx="280" cy="140" r="14" fill="url(#synergist-fibers)"/>
      <circle cx="400" cy="140" r="14" fill="url(#synergist-fibers)"/>
    `,
    primaryMuscleGlow: `
      <path d="M 315 210 Q 270 280 310 360 Q 335 290 325 220 Z" fill="url(#primary-fibers)" stroke="#7dd3fc" stroke-width="2"/>
      <path d="M 365 210 Q 410 280 370 360 Q 345 290 355 220 Z" fill="url(#primary-fibers)" stroke="#7dd3fc" stroke-width="2"/>
    `
  },

  // 7. Face Pull
  'face_pull.svg': {
    title: "Cable Face Pull",
    subtitle: "Rear Deltoid & External Rotator Cuff Health",
    primaryTarget: "Posterior Deltoids & Infraspinatus",
    synergistTarget: "Middle/Lower Trapezius, Rhomboids",
    cues: [
      "Set cable directly at eye height",
      "Pull rope to bridge of nose with thumbs back",
      "1-second external rotation squeeze at peak"
    ],
    anatomyFigure: `
      <circle cx="340" cy="190" r="26" fill="url(#flesh-base)"/>
      <path d="M 320 220 L 360 220 L 350 440 L 330 440 Z" fill="url(#flesh-base)"/>
      <path d="M 310 230 L 270 200 L 220 220 M 370 230 L 410 200 L 460 220" stroke="url(#flesh-base)" stroke-width="18" stroke-linecap="round" fill="none"/>
      <line x1="200" y1="220" x2="160" y2="200" stroke="#64748b" stroke-width="6"/>
      <line x1="480" y1="220" x2="520" y2="200" stroke="#64748b" stroke-width="6"/>
    `,
    synergistMuscleGlow: `
      <path d="M 325 230 L 355 230 L 340 310 Z" fill="url(#synergist-fibers)"/>
    `,
    primaryMuscleGlow: `
      <circle cx="295" cy="225" r="16" fill="url(#primary-fibers)" stroke="#7dd3fc" stroke-width="2"/>
      <circle cx="385" cy="225" r="16" fill="url(#primary-fibers)" stroke="#7dd3fc" stroke-width="2"/>
    `
  },

  // 8. Bulgarian Split Squat
  'bulgarian_split_squat.svg': {
    title: "Bulgarian Split Squat",
    subtitle: "Unilateral Quad & Glute Hypertrophy",
    primaryTarget: "Quadriceps Femoris & Gluteus Maximus",
    synergistTarget: "Gluteus Medius, Adductors, Core",
    cues: [
      "Rear foot laces flat on elevated bench",
      "Pitch torso 15° forward for glute bias",
      "Drive straight through front mid-foot"
    ],
    anatomyFigure: `
      <rect x="160" y="380" width="80" height="40" rx="4" fill="#1e293b" stroke="#334155" stroke-width="2"/>
      <circle cx="360" cy="200" r="26" fill="url(#flesh-base)"/>
      <path d="M 350 230 L 330 360" stroke="url(#flesh-base)" stroke-width="24" stroke-linecap="round"/>
      <!-- Front working leg -->
      <path d="M 330 360 L 350 440 L 350 540" stroke="url(#flesh-base)" stroke-width="22" stroke-linecap="round" fill="none"/>
      <!-- Rear elevated leg -->
      <path d="M 330 360 L 260 410 L 200 380" stroke="#334155" stroke-width="18" stroke-linecap="round" fill="none"/>
    `,
    synergistMuscleGlow: `
      <path d="M 315 350 Q 300 380 325 410 Z" fill="url(#synergist-fibers)"/>
    `,
    primaryMuscleGlow: `
      <path d="M 335 370 Q 380 390 360 450 Q 330 420 335 370 Z" fill="url(#primary-fibers)" stroke="#7dd3fc" stroke-width="2"/>
      <path d="M 310 330 Q 350 340 340 380 Q 300 380 310 330 Z" fill="url(#primary-fibers)" stroke="#7dd3fc" stroke-width="2"/>
    `
  },

  // 9. Leg Extension
  'leg_extension.svg': {
    title: "Leg Extension (Machine)",
    subtitle: "Rectus Femoris Terminal Knee Extension",
    primaryTarget: "Quadriceps Femoris (All 4 Heads)",
    synergistTarget: "Tibialis Anterior, TFL",
    cues: [
      "Align knee joint with machine pivot axis",
      "Hold full 1-sec peak contraction at top",
      "Control eccentric return over 3 seconds"
    ],
    anatomyFigure: `
      <rect x="230" y="320" width="110" height="90" rx="6" fill="#1e293b" stroke="#334155" stroke-width="2"/>
      <circle cx="280" cy="220" r="24" fill="url(#flesh-base)"/>
      <path d="M 270 250 L 290 340 L 400 350 L 420 440" stroke="url(#flesh-base)" stroke-width="22" stroke-linecap="round" fill="none"/>
    `,
    synergistMuscleGlow: `
      <circle cx="290" cy="340" r="14" fill="url(#synergist-fibers)"/>
    `,
    primaryMuscleGlow: `
      <path d="M 290 325 Q 360 310 405 340 Q 350 365 290 350 Z" fill="url(#primary-fibers)" stroke="#7dd3fc" stroke-width="2"/>
    `
  },

  // 10. Leg Curl
  'leg_curl.svg': {
    title: "Seated / Lying Leg Curl",
    subtitle: "Hamstrings Knee Flexion Isolation",
    primaryTarget: "Hamstrings (Biceps Femoris, Semitendinosus)",
    synergistTarget: "Gastrocnemius, Gracilis",
    cues: [
      "Hips pinned flat into pad without arching",
      "Curl pad directly to glutes",
      "Dorsiflex ankles for maximum hamstring load"
    ],
    anatomyFigure: `
      <rect x="220" y="340" width="130" height="70" rx="6" fill="#1e293b" stroke="#334155" stroke-width="2"/>
      <circle cx="200" cy="290" r="24" fill="url(#flesh-base)"/>
      <path d="M 220 315 L 320 345 L 290 445" stroke="url(#flesh-base)" stroke-width="22" stroke-linecap="round" fill="none"/>
    `,
    synergistMuscleGlow: `
      <path d="M 290 425 L 310 475" stroke="url(#synergist-fibers)" stroke-width="12" stroke-linecap="round"/>
    `,
    primaryMuscleGlow: `
      <path d="M 240 330 Q 310 335 320 365 Q 275 390 235 360 Z" fill="url(#primary-fibers)" stroke="#7dd3fc" stroke-width="2"/>
    `
  },

  // 11. Standing Calf Raise
  'standing_calf_raise.svg': {
    title: "Standing Calf Raise",
    subtitle: "Gastrocnemius & Soleus Ankle Plantarflexion",
    primaryTarget: "Gastrocnemius (Medial & Lateral Heads)",
    synergistTarget: "Soleus, Tibialis Posterior",
    cues: [
      "Deep 2-second stretch below platform",
      "Drive onto balls of big toes",
      "2-second peak hold at apex"
    ],
    anatomyFigure: `
      <circle cx="340" cy="180" r="26" fill="url(#flesh-base)"/>
      <path d="M 320 210 L 360 210 L 350 360 L 330 360 Z" fill="url(#flesh-base)"/>
      <path d="M 330 360 L 330 480 M 350 360 L 350 480" stroke="url(#flesh-base)" stroke-width="20" stroke-linecap="round"/>
      <rect x="290" y="490" width="100" height="14" rx="3" fill="#334155"/>
    `,
    synergistMuscleGlow: `
      <path d="M 325 430 L 325 470 M 345 430 L 345 470" stroke="url(#synergist-fibers)" stroke-width="10"/>
    `,
    primaryMuscleGlow: `
      <path d="M 320 370 Q 295 400 325 435 Q 345 400 330 370 Z" fill="url(#primary-fibers)" stroke="#7dd3fc" stroke-width="2"/>
      <path d="M 360 370 Q 385 400 355 435 Q 335 400 350 370 Z" fill="url(#primary-fibers)" stroke="#7dd3fc" stroke-width="2"/>
    `
  },

  // 12. Hip Thrust
  'hip_thrust.svg': {
    title: "Barbell Hip Thrust",
    subtitle: "Terminal Horizontal Glute Lockout",
    primaryTarget: "Gluteus Maximus (Peak Extension)",
    synergistTarget: "Hamstrings, Adductor Magnus, Core",
    cues: [
      "Upper back anchored on bench",
      "Vertical shins at top of thrust",
      "Tuck chin & drive hips horizontal"
    ],
    anatomyFigure: `
      <rect x="180" y="380" width="90" height="60" rx="4" fill="#1e293b" stroke="#334155" stroke-width="2"/>
      <circle cx="210" cy="330" r="22" fill="url(#flesh-base)"/>
      <path d="M 230 360 L 340 360 L 350 490" stroke="url(#flesh-base)" stroke-width="24" stroke-linecap="round" fill="none"/>
      <circle cx="340" cy="350" r="30" fill="#1e293b" stroke="#64748b" stroke-width="4"/>
    `,
    synergistMuscleGlow: `
      <path d="M 270 370 L 330 370" stroke="url(#synergist-fibers)" stroke-width="14" stroke-linecap="round"/>
    `,
    primaryMuscleGlow: `
      <path d="M 280 340 Q 340 330 345 375 Q 300 390 280 340 Z" fill="url(#primary-fibers)" stroke="#7dd3fc" stroke-width="2"/>
    `
  },

  // 13. Romanian Deadlift (RDL)
  'romanian_deadlift.svg': {
    title: "Romanian Deadlift (RDL)",
    subtitle: "Hamstring Eccentric Lengthening & Glute Hinge",
    primaryTarget: "Hamstrings (Biceps Femoris / Semitendinosus)",
    synergistTarget: "Gluteus Maximus, Erector Spinae",
    cues: [
      "Soft bend in knees throughout hinge",
      "Push hips back toward wall behind you",
      "Bar scrapes down front of thighs"
    ],
    anatomyFigure: `
      <circle cx="380" cy="220" r="26" fill="url(#flesh-base)"/>
      <path d="M 370 250 L 310 330 L 330 450 L 320 530" stroke="url(#flesh-base)" stroke-width="24" stroke-linecap="round" fill="none"/>
      <path d="M 370 260 L 350 380 L 330 460" stroke="#334155" stroke-width="18" stroke-linecap="round" fill="none"/>
      <line x1="270" y1="460" x2="410" y2="460" stroke="#94a3b8" stroke-width="14" stroke-linecap="round"/>
    `,
    synergistMuscleGlow: `
      <path d="M 350 260 L 320 330" stroke="url(#synergist-fibers)" stroke-width="14" stroke-linecap="round"/>
    `,
    primaryMuscleGlow: `
      <path d="M 310 330 Q 360 360 340 450 Q 305 400 310 330 Z" fill="url(#primary-fibers)" stroke="#7dd3fc" stroke-width="2"/>
    `
  },

  // 14. Overhead Shoulder Press
  'overhead_press.svg': {
    title: "Overhead Shoulder Press",
    subtitle: "Vertical Deltoid Drive & Core Stability",
    primaryTarget: "Anterior Deltoid & Lateral Deltoid",
    synergistTarget: "Triceps Brachii, Upper Traps, Core",
    cues: [
      "Brace glutes & core to lock spine",
      "Press in strict vertical line over ears",
      "Push head through window at lockout"
    ],
    anatomyFigure: `
      <circle cx="340" cy="220" r="26" fill="url(#flesh-base)"/>
      <path d="M 320 250 L 360 250 L 350 450 L 330 450 Z" fill="url(#flesh-base)"/>
      <path d="M 310 260 L 280 140 M 370 260 L 400 140" stroke="url(#flesh-base)" stroke-width="18" stroke-linecap="round"/>
      <line x1="230" y1="130" x2="450" y2="130" stroke="#94a3b8" stroke-width="14" stroke-linecap="round"/>
    `,
    synergistMuscleGlow: `
      <path d="M 290 170 L 290 220 M 390 170 L 390 220" stroke="url(#synergist-fibers)" stroke-width="14" stroke-linecap="round"/>
    `,
    primaryMuscleGlow: `
      <circle cx="305" cy="260" r="20" fill="url(#primary-fibers)" stroke="#7dd3fc" stroke-width="2"/>
      <circle cx="375" cy="260" r="20" fill="url(#primary-fibers)" stroke="#7dd3fc" stroke-width="2"/>
    `
  },

  // 15. Dumbbell Lateral Raise
  'lateral_raise.svg': {
    title: "Dumbbell Lateral Raise",
    subtitle: "Lateral Deltoid Scapular Plane Isolation",
    primaryTarget: "Lateral Deltoid (Middle Head)",
    synergistTarget: "Supraspinatus, Anterior Delts, Traps",
    cues: [
      "15° forward torso hinge",
      "Lead with elbows in scapular plane",
      "Pour pitcher slightly at peak apex"
    ],
    anatomyFigure: `
      <circle cx="340" cy="200" r="26" fill="url(#flesh-base)"/>
      <path d="M 320 230 L 360 230 L 355 450 L 325 450 Z" fill="url(#flesh-base)"/>
      <path d="M 310 240 L 210 250 M 370 240 L 470 250" stroke="url(#flesh-base)" stroke-width="18" stroke-linecap="round"/>
      <rect x="180" y="240" width="28" height="20" rx="4" fill="#64748b"/>
      <rect x="472" y="240" width="28" height="20" rx="4" fill="#64748b"/>
    `,
    synergistMuscleGlow: `
      <path d="M 330 220 L 315 240 M 350 220 L 365 240" stroke="url(#synergist-fibers)" stroke-width="12"/>
    `,
    primaryMuscleGlow: `
      <ellipse cx="295" cy="240" rx="18" ry="14" fill="url(#primary-fibers)" stroke="#7dd3fc" stroke-width="2"/>
      <ellipse cx="385" cy="240" rx="18" ry="14" fill="url(#primary-fibers)" stroke="#7dd3fc" stroke-width="2"/>
    `
  },

  // 16. Barbell Bicep Curl
  'bicep_curl.svg': {
    title: "Barbell Bicep Curl",
    subtitle: "Biceps Brachii Peak Flexion",
    primaryTarget: "Biceps Brachii (Short & Long Heads)",
    synergistTarget: "Brachialis, Brachioradialis",
    cues: [
      "Pin elbows firmly to ribcage",
      "Curl bar through full elbow flexion",
      "Lower under 3-second tension"
    ],
    anatomyFigure: `
      <circle cx="340" cy="180" r="26" fill="url(#flesh-base)"/>
      <path d="M 320 210 L 360 210 L 350 460 L 330 460 Z" fill="url(#flesh-base)"/>
      <path d="M 310 220 L 310 320 L 280 240" stroke="url(#flesh-base)" stroke-width="20" stroke-linecap="round" fill="none"/>
      <circle cx="280" cy="230" r="16" fill="#64748b"/>
    `,
    synergistMuscleGlow: `
      <path d="M 290 270 L 285 240" stroke="url(#synergist-fibers)" stroke-width="12" stroke-linecap="round"/>
    `,
    primaryMuscleGlow: `
      <path d="M 305 235 Q 280 280 305 315 Q 325 280 315 235 Z" fill="url(#primary-fibers)" stroke="#7dd3fc" stroke-width="2"/>
    `
  },

  // 17. Dumbbell Hammer Curl
  'hammer_curl.svg': {
    title: "Dumbbell Hammer Curl",
    subtitle: "Brachialis & Forearm Thickness",
    primaryTarget: "Brachialis & Brachioradialis",
    synergistTarget: "Biceps Brachii, Forearm Extensors",
    cues: [
      "Neutral palms-facing grip throughout",
      "Elbows locked stationary at sides",
      "Squeeze mid-arm at top contraction"
    ],
    anatomyFigure: `
      <circle cx="340" cy="180" r="26" fill="url(#flesh-base)"/>
      <path d="M 320 210 L 360 210 L 350 460 L 330 460 Z" fill="url(#flesh-base)"/>
      <path d="M 310 220 L 310 320 L 280 240" stroke="url(#flesh-base)" stroke-width="20" stroke-linecap="round" fill="none"/>
      <rect x="270" y="215" width="22" height="32" rx="4" fill="#64748b"/>
    `,
    synergistMuscleGlow: `
      <path d="M 305 240 L 305 300" stroke="url(#synergist-fibers)" stroke-width="12"/>
    `,
    primaryMuscleGlow: `
      <path d="M 290 260 L 280 320" stroke="url(#primary-fibers)" stroke-width="16" stroke-linecap="round"/>
    `
  },

  // 18. Cable Tricep Pushdown
  'tricep_pushdown.svg': {
    title: "Cable Tricep Pushdown",
    subtitle: "Triceps Lateral & Medial Head Terminal Lockout",
    primaryTarget: "Triceps Brachii (All 3 Heads)",
    synergistTarget: "Anconeus, Anterior Deltoid",
    cues: [
      "Elbows pinned to sides of torso",
      "Flare rope apart at bottom for peak squeeze",
      "Return smoothly to 90° elbow flexion"
    ],
    anatomyFigure: `
      <circle cx="340" cy="180" r="26" fill="url(#flesh-base)"/>
      <path d="M 320 210 L 360 210 L 350 460 L 330 460 Z" fill="url(#flesh-base)"/>
      <path d="M 310 220 L 310 310 L 310 410" stroke="url(#flesh-base)" stroke-width="20" stroke-linecap="round" fill="none"/>
      <line x1="310" y1="120" x2="310" y2="280" stroke="#64748b" stroke-width="6"/>
    `,
    synergistMuscleGlow: `
      <circle cx="310" cy="220" r="12" fill="url(#synergist-fibers)"/>
    `,
    primaryMuscleGlow: `
      <path d="M 315 220 Q 338 270 315 315 Q 302 270 310 220 Z" fill="url(#primary-fibers)" stroke="#7dd3fc" stroke-width="2"/>
    `
  },

  // 19. Plank
  'plank.svg': {
    title: "Forearm Plank Core Isometric",
    subtitle: "Deep Transverse Abdominis Cylinder Brace",
    primaryTarget: "Transverse Abdominis & Rectus Abdominis",
    synergistTarget: "Obliques, Gluteus Maximus, Quads",
    cues: [
      "Straight plank line head to heels",
      "Posterior pelvic tilt squeeze",
      "360° diaphragmatic abdominal brace"
    ],
    anatomyFigure: `
      <circle cx="210" cy="380" r="22" fill="url(#flesh-base)"/>
      <path d="M 230 400 L 460 400 L 480 480" stroke="url(#flesh-base)" stroke-width="22" stroke-linecap="round" fill="none"/>
      <path d="M 240 400 L 240 480" stroke="#475569" stroke-width="18" stroke-linecap="round"/>
    `,
    synergistMuscleGlow: `
      <path d="M 380 400 L 450 400" stroke="url(#synergist-fibers)" stroke-width="14" stroke-linecap="round"/>
    `,
    primaryMuscleGlow: `
      <path d="M 260 395 L 360 395" stroke="url(#primary-fibers)" stroke-width="18" stroke-linecap="round"/>
    `
  },

  // 20. Back Hyperextension
  'back_hyperextension.svg': {
    title: "Hyperextensions (45° Roman Chair)",
    subtitle: "Erector Spinae & Glute Extension",
    primaryTarget: "Erector Spinae (Spinalis, Longissimus, Iliocostalis)",
    synergistTarget: "Gluteus Maximus, Hamstrings",
    cues: [
      "Hinge at hips over 45° pad",
      "Extend spine smoothly to neutral",
      "Avoid hyperextending cervical spine"
    ],
    anatomyFigure: `
      <rect x="230" y="370" width="100" height="50" rx="6" fill="#1e293b" stroke="#334155" stroke-width="2"/>
      <path d="M 240 370 L 170 480" stroke="url(#flesh-base)" stroke-width="22" stroke-linecap="round"/>
      <circle cx="160" cy="490" r="22" fill="url(#flesh-base)"/>
      <path d="M 260 370 L 360 370 L 400 480" stroke="url(#flesh-base)" stroke-width="22" stroke-linecap="round" fill="none"/>
    `,
    synergistMuscleGlow: `
      <circle cx="280" cy="370" r="16" fill="url(#synergist-fibers)"/>
    `,
    primaryMuscleGlow: `
      <path d="M 190 450 L 260 375" stroke="url(#primary-fibers)" stroke-width="18" stroke-linecap="round"/>
    `
  },

  // 21. QL Extension
  'ql_extension.svg': {
    title: "QL Extension (Side Roman Chair)",
    subtitle: "Quadratus Lumborum Deep Lateral Stability",
    primaryTarget: "Quadratus Lumborum & Lateral Obliques",
    synergistTarget: "Gluteus Medius, Erector Spinae",
    cues: [
      "Side-lying on 45° roman chair",
      "Lower torso sideways under 3-second control",
      "Flex lateral abdominal wall to parallel"
    ],
    anatomyFigure: `
      <rect x="240" y="370" width="90" height="50" rx="6" fill="#1e293b" stroke="#334155" stroke-width="2"/>
      <path d="M 250 370 L 170 470" stroke="url(#flesh-base)" stroke-width="22" stroke-linecap="round"/>
      <circle cx="160" cy="480" r="22" fill="url(#flesh-base)"/>
      <path d="M 270 370 L 370 370 L 410 470" stroke="url(#flesh-base)" stroke-width="22" stroke-linecap="round" fill="none"/>
    `,
    synergistMuscleGlow: `
      <circle cx="290" cy="370" r="16" fill="url(#synergist-fibers)"/>
    `,
    primaryMuscleGlow: `
      <path d="M 200 430 L 260 380" stroke="url(#primary-fibers)" stroke-width="18" stroke-linecap="round"/>
    `
  },

  // 22. Chest Doorway Stretch
  'chest_doorway_stretch.svg': {
    title: "Doorway Pectoral & Capsule Stretch",
    subtitle: "Pectoralis Major & Minor Anterior Expansion",
    primaryTarget: "Pectoralis Major & Minor",
    synergistTarget: "Anterior Deltoid, Bicipital Groove",
    cues: [
      "Forearm flat on doorframe at 90°",
      "Step forward through frame gently",
      "Depress scapula away from ear"
    ],
    anatomyFigure: `
      <line x1="220" y1="120" x2="220" y2="540" stroke="#475569" stroke-width="16" stroke-linecap="round"/>
      <circle cx="340" cy="220" r="26" fill="url(#flesh-base)"/>
      <path d="M 320 250 L 360 250 L 360 460 L 320 460 Z" fill="url(#flesh-base)"/>
      <path d="M 320 260 L 220 260 L 220 180" stroke="url(#flesh-base)" stroke-width="18" stroke-linecap="round" fill="none"/>
    `,
    synergistMuscleGlow: `
      <circle cx="310" cy="260" r="14" fill="url(#synergist-fibers)"/>
    `,
    primaryMuscleGlow: `
      <path d="M 315 255 Q 365 240 375 285 Q 345 305 315 285 Z" fill="url(#primary-fibers)" stroke="#7dd3fc" stroke-width="2"/>
    `
  },

  // 23. Band Pass-Throughs
  'band_pass_throughs.svg': {
    title: "Band Shoulder Dislocates",
    subtitle: "360° Glenohumeral & Rotator Cuff Mobility",
    primaryTarget: "Pectoralis Minor & Scapular Mobilizers",
    synergistTarget: "Anterior Deltoid, Rhomboids, Traps",
    cues: [
      "Wide grip with straight locked elbows",
      "Rotate smoothly 360° front to back",
      "Neutral ribs without spinal hyperextension"
    ],
    anatomyFigure: `
      <circle cx="340" cy="220" r="26" fill="url(#flesh-base)"/>
      <path d="M 320 250 L 360 250 L 350 460 L 330 460 Z" fill="url(#flesh-base)"/>
      <path d="M 310 260 L 220 160 M 370 260 L 460 160" stroke="url(#flesh-base)" stroke-width="18" stroke-linecap="round"/>
      <path d="M 200 150 Q 340 100 480 150" stroke="#f59e0b" stroke-width="6" fill="none" stroke-linecap="round"/>
    `,
    synergistMuscleGlow: `
      <circle cx="300" cy="260" r="14" fill="url(#synergist-fibers)"/>
      <circle cx="380" cy="260" r="14" fill="url(#synergist-fibers)"/>
    `,
    primaryMuscleGlow: `
      <ellipse cx="340" cy="275" rx="36" ry="18" fill="url(#primary-fibers)" stroke="#7dd3fc" stroke-width="2"/>
    `
  },

  // 24. Lat Hang & Side Reach
  'lat_stretch.svg': {
    title: "Lat Hang & Lateral Rib Decompression",
    subtitle: "Latissimus Dorsi & Thoracolumbar Stretch",
    primaryTarget: "Latissimus Dorsi & Teres Major",
    synergistTarget: "Intercostals, Serratus, Obliques",
    cues: [
      "Grasp overhead anchor or sturdy bar",
      "Hinge hips back and away from bar",
      "Breathe deep into lateral rib cage"
    ],
    anatomyFigure: `
      <line x1="280" y1="100" x2="380" y2="100" stroke="#94a3b8" stroke-width="14" stroke-linecap="round"/>
      <circle cx="330" cy="230" r="24" fill="url(#flesh-base)"/>
      <path d="M 320 260 L 360 280 L 320 440" stroke="url(#flesh-base)" stroke-width="22" stroke-linecap="round" fill="none"/>
      <path d="M 320 260 L 330 110" stroke="url(#flesh-base)" stroke-width="18" stroke-linecap="round"/>
    `,
    synergistMuscleGlow: `
      <path d="M 320 340 L 350 420" stroke="url(#synergist-fibers)" stroke-width="14" stroke-linecap="round"/>
    `,
    primaryMuscleGlow: `
      <path d="M 315 260 Q 270 330 305 400 Q 335 340 330 270 Z" fill="url(#primary-fibers)" stroke="#7dd3fc" stroke-width="2"/>
    `
  },

  // 25. Child's Pose
  'childs_pose.svg': {
    title: "Child's Pose Lat & Spine Opener",
    subtitle: "Thoracolumbar & Latissimus Relaxation",
    primaryTarget: "Latissimus Dorsi & Erector Spinae",
    synergistTarget: "Gluteus Maximus, Thoracic Fascia",
    cues: [
      "Knees wide, big toes touching",
      "Sit hips back flat onto heels",
      "Walk hands forward and diagonally"
    ],
    anatomyFigure: `
      <path d="M 230 450 Q 280 430 360 440 L 460 470" stroke="url(#flesh-base)" stroke-width="22" stroke-linecap="round" fill="none"/>
      <circle cx="480" cy="460" r="20" fill="url(#flesh-base)"/>
      <line x1="470" y1="470" x2="550" y2="470" stroke="url(#flesh-base)" stroke-width="16" stroke-linecap="round"/>
    `,
    synergistMuscleGlow: `
      <circle cx="240" cy="450" r="16" fill="url(#synergist-fibers)"/>
    `,
    primaryMuscleGlow: `
      <path d="M 280 430 L 440 445" stroke="url(#primary-fibers)" stroke-width="18" stroke-linecap="round"/>
    `
  },

  // 26. Neck & Upper Trap Stretch
  'neck_trap_stretch.svg': {
    title: "Upper Trap & Levator Scapulae Stretch",
    subtitle: "Cervical Spine Decompression",
    primaryTarget: "Upper Trapezius & Levator Scapulae",
    synergistTarget: "Sternocleidomastoid, Scalenes",
    cues: [
      "Tilt ear gently toward shoulder",
      "Depress opposite shoulder down",
      "Turn chin toward armpit for levator"
    ],
    anatomyFigure: `
      <circle cx="340" cy="180" r="28" fill="url(#flesh-base)" transform="rotate(-15 340 180)"/>
      <path d="M 300 240 L 380 240 L 360 450 L 320 450 Z" fill="url(#flesh-base)"/>
    `,
    synergistMuscleGlow: `
      <path d="M 330 200 L 320 240" stroke="url(#synergist-fibers)" stroke-width="10"/>
    `,
    primaryMuscleGlow: `
      <path d="M 350 200 Q 380 220 375 250 L 340 240 Z" fill="url(#primary-fibers)" stroke="#7dd3fc" stroke-width="2"/>
    `
  },

  // 27. Cat-Cow Spine Flow
  'cat_cow.svg': {
    title: "Cat-Cow Segmental Spine Mobility",
    subtitle: "Thoracolumbar Dynamic Flexion/Extension",
    primaryTarget: "Erector Spinae & Rectus Abdominis",
    synergistTarget: "Serratus, Rhomboids, Neck Extensors",
    cues: [
      "Cow: Inhale, drop belly, gaze upward",
      "Cat: Exhale, tuck tailbone, round spine",
      "Flow segment by segment through breath"
    ],
    anatomyFigure: `
      <circle cx="230" cy="340" r="22" fill="url(#flesh-base)"/>
      <path d="M 250 360 Q 330 320 430 370" stroke="url(#flesh-base)" stroke-width="22" stroke-linecap="round" fill="none"/>
      <line x1="260" y1="360" x2="260" y2="480" stroke="#475569" stroke-width="18" stroke-linecap="round"/>
      <line x1="420" y1="370" x2="420" y2="480" stroke="#475569" stroke-width="18" stroke-linecap="round"/>
    `,
    synergistMuscleGlow: `
      <circle cx="260" cy="360" r="14" fill="url(#synergist-fibers)"/>
      <circle cx="420" cy="370" r="14" fill="url(#synergist-fibers)"/>
    `,
    primaryMuscleGlow: `
      <path d="M 260 355 Q 335 315 415 365" stroke="url(#primary-fibers)" stroke-width="18" stroke-linecap="round" fill="none"/>
    `
  },

  // 28. Foam Roll Thoracic Spine
  'foam_roll_thoracic.svg': {
    title: "Foam Roll Thoracic Extension",
    subtitle: "Mid-Back Myofascial Release & Extension",
    primaryTarget: "Thoracic Extensors & Rhomboids",
    synergistTarget: "Latissimus Dorsi, Posterior Deltoid",
    cues: [
      "Roller across mid-back under shoulder blades",
      "Hug elbows together to expose rhomboids",
      "Extend upper back smoothly over roller"
    ],
    anatomyFigure: `
      <circle cx="340" cy="420" r="26" fill="#0284c7" stroke="#38bdf8" stroke-width="4"/>
      <circle cx="210" cy="380" r="22" fill="url(#flesh-base)"/>
      <path d="M 230 400 L 380 430 L 440 470" stroke="url(#flesh-base)" stroke-width="22" stroke-linecap="round" fill="none"/>
    `,
    synergistMuscleGlow: `
      <circle cx="240" cy="400" r="14" fill="url(#synergist-fibers)"/>
    `,
    primaryMuscleGlow: `
      <path d="M 260 405 L 360 425" stroke="url(#primary-fibers)" stroke-width="18" stroke-linecap="round"/>
    `
  },

  // 29. Thread the Needle
  'thread_the_needle.svg': {
    title: "Thread the Needle Thoracic Rotation",
    subtitle: "Rotational Mobility & Posterior Shoulder Opening",
    primaryTarget: "Thoracic Spine Rotators & Posterior Deltoid",
    synergistTarget: "Rhomboids, Infraspinatus",
    cues: [
      "Slide arm under torso along floor",
      "Rest temple and shoulder flat on mat",
      "Press opposite hand to deepen rotation"
    ],
    anatomyFigure: `
      <circle cx="240" cy="430" r="22" fill="url(#flesh-base)"/>
      <path d="M 260 440 L 420 420 L 440 480" stroke="url(#flesh-base)" stroke-width="22" stroke-linecap="round" fill="none"/>
      <line x1="250" y1="440" x2="350" y2="470" stroke="url(#flesh-base)" stroke-width="16" stroke-linecap="round"/>
    `,
    synergistMuscleGlow: `
      <circle cx="420" cy="420" r="14" fill="url(#synergist-fibers)"/>
    `,
    primaryMuscleGlow: `
      <path d="M 270 435 L 390 425" stroke="url(#primary-fibers)" stroke-width="16" stroke-linecap="round"/>
    `
  },

  // 30. Standing Quad Stretch
  'standing_quad_stretch.svg': {
    title: "Standing Quad & Hip Flexor Stretch",
    subtitle: "Rectus Femoris & Pelvic Tilt Alignment",
    primaryTarget: "Quadriceps Femoris (All 4 Heads)",
    synergistTarget: "Iliopsoas, Anterior Tibialis",
    cues: [
      "Keep both knees pinned side by side",
      "Tuck tailbone under (posterior tilt)",
      "Draw heel straight to center glute"
    ],
    anatomyFigure: `
      <circle cx="340" cy="180" r="26" fill="url(#flesh-base)"/>
      <path d="M 320 210 L 360 210 L 350 360 L 330 360 Z" fill="url(#flesh-base)"/>
      <path d="M 330 360 L 330 530" stroke="url(#flesh-base)" stroke-width="20" stroke-linecap="round"/>
      <path d="M 350 360 L 350 440 L 375 360" stroke="url(#flesh-base)" stroke-width="18" stroke-linecap="round" fill="none"/>
    `,
    synergistMuscleGlow: `
      <path d="M 340 330 L 350 360" stroke="url(#synergist-fibers)" stroke-width="12"/>
    `,
    primaryMuscleGlow: `
      <path d="M 345 365 Q 365 400 350 440 Q 335 400 345 365 Z" fill="url(#primary-fibers)" stroke="#7dd3fc" stroke-width="2"/>
    `
  },

  // 31. Frog Stretch
  'frog_stretch.svg': {
    title: "Frog Deep Adductor & Groin Stretch",
    subtitle: "Pelvic Floor & Hip Capsule Expansion",
    primaryTarget: "Adductor Longus, Magnus & Gracilis",
    synergistTarget: "Pectineus, Deep Hip Rotators",
    cues: [
      "Knees spread wide with ankles flared out 90°",
      "Forearms on floor with neutral spine",
      "Gently sink hips straight backward"
    ],
    anatomyFigure: `
      <ellipse cx="340" cy="400" rx="40" ry="25" fill="url(#flesh-base)"/>
      <path d="M 300 400 L 220 450 L 200 500" stroke="url(#flesh-base)" stroke-width="20" stroke-linecap="round" fill="none"/>
      <path d="M 380 400 L 460 450 L 480 500" stroke="url(#flesh-base)" stroke-width="20" stroke-linecap="round" fill="none"/>
    `,
    synergistMuscleGlow: `
      <circle cx="340" cy="390" r="16" fill="url(#synergist-fibers)"/>
    `,
    primaryMuscleGlow: `
      <path d="M 310 405 L 240 445" stroke="url(#primary-fibers)" stroke-width="18" stroke-linecap="round"/>
      <path d="M 370 405 L 440 445" stroke="url(#primary-fibers)" stroke-width="18" stroke-linecap="round"/>
    `
  },

  // 32. Figure 4 Glute Stretch
  'figure4_stretch.svg': {
    title: "Figure 4 Glute & Piriformis Stretch",
    subtitle: "Deep Hip Rotator & Gluteus Medius Release",
    primaryTarget: "Piriformis & Gluteus Medius",
    synergistTarget: "Gluteus Maximus, Tensor Fasciae Latae",
    cues: [
      "Cross ankle over opposite knee into 4-shape",
      "Pull supporting thigh gently to chest",
      "Keep tailbone down flat on mat"
    ],
    anatomyFigure: `
      <circle cx="210" cy="400" r="22" fill="url(#flesh-base)"/>
      <path d="M 230 420 L 340 420 L 350 480" stroke="url(#flesh-base)" stroke-width="22" stroke-linecap="round" fill="none"/>
      <path d="M 330 420 L 290 360 L 360 360" stroke="url(#flesh-base)" stroke-width="18" stroke-linecap="round" fill="none"/>
    `,
    synergistMuscleGlow: `
      <circle cx="340" cy="420" r="14" fill="url(#synergist-fibers)"/>
    `,
    primaryMuscleGlow: `
      <path d="M 315 400 Q 360 380 345 440 Z" fill="url(#primary-fibers)" stroke="#7dd3fc" stroke-width="2"/>
    `
  },

  // 33. 90/90 Hip Mobility Flow
  'hip_90_90.svg': {
    title: "90/90 Hip Internal & External Rotation Flow",
    subtitle: "Multi-Planar Hip Joint Capsule Mobility",
    primaryTarget: "Hip Internal & External Rotators",
    synergistTarget: "Gluteus Medius, Adductors, Piriformis",
    cues: [
      "Both knees bent strictly at 90° angles",
      "Sit tall with neutral pelvis & spine",
      "Hinge over front shin, then rotate across"
    ],
    anatomyFigure: `
      <circle cx="340" cy="240" r="24" fill="url(#flesh-base)"/>
      <path d="M 330 270 L 330 380" stroke="url(#flesh-base)" stroke-width="22" stroke-linecap="round"/>
      <path d="M 330 380 L 250 420 L 250 490" stroke="url(#flesh-base)" stroke-width="18" stroke-linecap="round" fill="none"/>
      <path d="M 330 380 L 410 420 L 480 420" stroke="url(#flesh-base)" stroke-width="18" stroke-linecap="round" fill="none"/>
    `,
    synergistMuscleGlow: `
      <circle cx="410" cy="410" r="14" fill="url(#synergist-fibers)"/>
    `,
    primaryMuscleGlow: `
      <ellipse cx="330" cy="380" rx="30" ry="20" fill="url(#primary-fibers)" stroke="#7dd3fc" stroke-width="2"/>
    `
  },

  // 34. Standing Hamstring Fold
  'hamstring_fold.svg': {
    title: "Standing Hamstring Forward Fold",
    subtitle: "Posterior Chain & Hamstring Lengthening",
    primaryTarget: "Hamstrings (Semitendinosus & Biceps Femoris)",
    synergistTarget: "Gastrocnemius, Erector Spinae",
    cues: [
      "Hinge at hips with soft unlocked knees",
      "Reach crown of head toward floor",
      "Lengthen sit-bones toward ceiling"
    ],
    anatomyFigure: `
      <circle cx="330" cy="450" r="22" fill="url(#flesh-base)"/>
      <path d="M 330 430 L 330 330 L 360 480 L 360 550" stroke="url(#flesh-base)" stroke-width="20" stroke-linecap="round" fill="none"/>
    `,
    synergistMuscleGlow: `
      <path d="M 360 480 L 360 540" stroke="url(#synergist-fibers)" stroke-width="10"/>
    `,
    primaryMuscleGlow: `
      <path d="M 335 340 L 360 460" stroke="url(#primary-fibers)" stroke-width="18" stroke-linecap="round"/>
    `
  },

  // 35. Seated Butterfly Stretch
  'butterfly_stretch.svg': {
    title: "Seated Butterfly Adductor Stretch",
    subtitle: "Inner Thigh & Groin Flexibility",
    primaryTarget: "Adductor Brevis, Longus & Pectineus",
    synergistTarget: "Gracilis, Pelvic Floor",
    cues: [
      "Soles of feet together, knees dropped out",
      "Sit upright on sit bones",
      "Gently press knees toward floor with breath"
    ],
    anatomyFigure: `
      <circle cx="340" cy="250" r="24" fill="url(#flesh-base)"/>
      <path d="M 340 280 L 340 380" stroke="url(#flesh-base)" stroke-width="22" stroke-linecap="round"/>
      <path d="M 340 380 L 250 420 L 340 450" stroke="url(#flesh-base)" stroke-width="18" stroke-linecap="round" fill="none"/>
      <path d="M 340 380 L 430 420 L 340 450" stroke="url(#flesh-base)" stroke-width="18" stroke-linecap="round" fill="none"/>
    `,
    synergistMuscleGlow: `
      <circle cx="340" cy="440" r="12" fill="url(#synergist-fibers)"/>
    `,
    primaryMuscleGlow: `
      <path d="M 320 385 L 265 420" stroke="url(#primary-fibers)" stroke-width="16" stroke-linecap="round"/>
      <path d="M 360 385 L 415 420" stroke="url(#primary-fibers)" stroke-width="16" stroke-linecap="round"/>
    `
  },

  // 36. Calf Wall Stretch
  'calf_stretch.svg': {
    title: "Calf Wall Stretch (Gastrocnemius & Soleus)",
    subtitle: "Ankle Dorsiflexion & Achilles Decompression",
    primaryTarget: "Gastrocnemius & Soleus",
    synergistTarget: "Achilles Tendon, Plantar Fascia",
    cues: [
      "Rear heel flat on floor with straight knee",
      "Hands on wall, lean hips forward",
      "Feel stretch in upper and lower calf"
    ],
    anatomyFigure: `
      <line x1="480" y1="120" x2="480" y2="540" stroke="#475569" stroke-width="16"/>
      <circle cx="320" cy="220" r="24" fill="url(#flesh-base)"/>
      <path d="M 330 250 L 460 270" stroke="url(#flesh-base)" stroke-width="16" stroke-linecap="round"/>
      <path d="M 310 320 L 380 420 L 380 540" stroke="url(#flesh-base)" stroke-width="18" stroke-linecap="round" fill="none"/>
      <path d="M 310 320 L 230 440 L 210 540" stroke="url(#flesh-base)" stroke-width="18" stroke-linecap="round" fill="none"/>
    `,
    synergistMuscleGlow: `
      <path d="M 215 500 L 210 535" stroke="url(#synergist-fibers)" stroke-width="10"/>
    `,
    primaryMuscleGlow: `
      <path d="M 240 435 Q 215 470 220 510 Z" fill="url(#primary-fibers)" stroke="#7dd3fc" stroke-width="2"/>
    `
  },

  // 37. Cross-Body Shoulder Stretch
  'shoulder_crossbody.svg': {
    title: "Cross-Body Posterior Deltoid Stretch",
    subtitle: "Posterior Shoulder Capsule & Infraspinatus Opening",
    primaryTarget: "Posterior Deltoid & Infraspinatus",
    synergistTarget: "Rhomboids, Middle Trapezius",
    cues: [
      "Draw arm horizontally across chest",
      "Use opposite forearm to gently hug arm in",
      "Keep stretching shoulder down from ear"
    ],
    anatomyFigure: `
      <circle cx="340" cy="220" r="26" fill="url(#flesh-base)"/>
      <path d="M 320 250 L 360 250 L 350 450 L 330 450 Z" fill="url(#flesh-base)"/>
      <path d="M 360 260 L 250 280" stroke="url(#flesh-base)" stroke-width="18" stroke-linecap="round"/>
      <path d="M 310 260 L 280 340 L 280 270" stroke="#475569" stroke-width="16" stroke-linecap="round" fill="none"/>
    `,
    synergistMuscleGlow: `
      <circle cx="330" cy="250" r="14" fill="url(#synergist-fibers)"/>
    `,
    primaryMuscleGlow: `
      <circle cx="370" cy="260" r="18" fill="url(#primary-fibers)" stroke="#7dd3fc" stroke-width="2"/>
    `
  },

  // 38. Sleeper Rotator Cuff Stretch
  'sleeper_stretch.svg': {
    title: "Sleeper Rotator Cuff Internal Rotation",
    subtitle: "Infraspinatus & Teres Minor Posterior Capsule",
    primaryTarget: "Infraspinatus & Teres Minor",
    synergistTarget: "Posterior Glenohumeral Capsule",
    cues: [
      "Side-lying with arm at 90° to torso",
      "Gently guide wrist downward toward floor",
      "Stop at gentle stretch without pinching"
    ],
    anatomyFigure: `
      <circle cx="240" cy="380" r="22" fill="url(#flesh-base)"/>
      <path d="M 260 400 L 420 400" stroke="url(#flesh-base)" stroke-width="20" stroke-linecap="round"/>
      <path d="M 300 400 L 300 320 L 360 320" stroke="url(#flesh-base)" stroke-width="16" stroke-linecap="round" fill="none"/>
    `,
    synergistMuscleGlow: `
      <circle cx="285" cy="400" r="14" fill="url(#synergist-fibers)"/>
    `,
    primaryMuscleGlow: `
      <circle cx="295" cy="385" r="16" fill="url(#primary-fibers)" stroke="#7dd3fc" stroke-width="2"/>
    `
  },

  // 39. Overhead Triceps Stretch
  'tricep_stretch.svg': {
    title: "Overhead Triceps & Lat Stretch",
    subtitle: "Triceps Long Head & Latissimus Dorsi Lengthening",
    primaryTarget: "Triceps Brachii (Long Head)",
    synergistTarget: "Latissimus Dorsi, Teres Major",
    cues: [
      "Reach elbow toward ceiling, hand behind neck",
      "Gently guide elbow back with opposite hand",
      "Keep core braced without arching low back"
    ],
    anatomyFigure: `
      <circle cx="340" cy="220" r="26" fill="url(#flesh-base)"/>
      <path d="M 320 250 L 360 250 L 350 450 L 330 450 Z" fill="url(#flesh-base)"/>
      <path d="M 360 260 L 360 140 L 330 180" stroke="url(#flesh-base)" stroke-width="18" stroke-linecap="round" fill="none"/>
    `,
    synergistMuscleGlow: `
      <path d="M 350 270 L 350 350" stroke="url(#synergist-fibers)" stroke-width="14"/>
    `,
    primaryMuscleGlow: `
      <path d="M 360 160 L 360 240" stroke="url(#primary-fibers)" stroke-width="18" stroke-linecap="round"/>
    `
  },

  // 40. Biceps Wall Stretch
  'bicep_stretch.svg': {
    title: "Biceps & Anterior Shoulder Wall Stretch",
    subtitle: "Biceps Brachii & Bicipital Groove Decompression",
    primaryTarget: "Biceps Brachii & Brachialis",
    synergistTarget: "Anterior Deltoid, Pectoralis Major",
    cues: [
      "Palm flat against wall with thumb pointing up",
      "Rotate chest and torso away from wall",
      "Keep shoulder depressed down and back"
    ],
    anatomyFigure: `
      <line x1="220" y1="120" x2="220" y2="540" stroke="#475569" stroke-width="16"/>
      <circle cx="340" cy="220" r="26" fill="url(#flesh-base)"/>
      <path d="M 320 250 L 360 250 L 350 450 L 330 450 Z" fill="url(#flesh-base)"/>
      <path d="M 320 260 L 220 260" stroke="url(#flesh-base)" stroke-width="18" stroke-linecap="round"/>
    `,
    synergistMuscleGlow: `
      <circle cx="310" cy="260" r="14" fill="url(#synergist-fibers)"/>
    `,
    primaryMuscleGlow: `
      <path d="M 235 260 L 305 260" stroke="url(#primary-fibers)" stroke-width="18" stroke-linecap="round"/>
    `
  },

  // 41. Wrist Mobility Flow
  'wrist_mobility.svg': {
    title: "Wrist Flexor & Extensor Mobility Flow",
    subtitle: "Carpal Tunnel & Forearm Fascia Release",
    primaryTarget: "Wrist Flexors & Extensors",
    synergistTarget: "Pronator Teres, Brachioradialis",
    cues: [
      "On all fours with palms flat and fingers back",
      "Gently rock bodyweight backward for flexors",
      "Flip hands back-of-wrist down for extensors"
    ],
    anatomyFigure: `
      <circle cx="240" cy="340" r="22" fill="url(#flesh-base)"/>
      <path d="M 260 360 L 420 360" stroke="url(#flesh-base)" stroke-width="20" stroke-linecap="round"/>
      <line x1="270" y1="360" x2="270" y2="480" stroke="#475569" stroke-width="18" stroke-linecap="round"/>
      <line x1="410" y1="360" x2="410" y2="480" stroke="#475569" stroke-width="18" stroke-linecap="round"/>
    `,
    synergistMuscleGlow: `
      <path d="M 270 380 L 270 420" stroke="url(#synergist-fibers)" stroke-width="12"/>
    `,
    primaryMuscleGlow: `
      <path d="M 270 425 L 270 475" stroke="url(#primary-fibers)" stroke-width="16" stroke-linecap="round"/>
    `
  },

  // 42. Cobra Abdominal Stretch
  'cobra_stretch.svg': {
    title: "Cobra Abdominal & Anterior Line Stretch",
    subtitle: "Rectus Abdominis & Psoas Expansion",
    primaryTarget: "Rectus Abdominis & Linea Alba",
    synergistTarget: "Psoas Major, Anterior Intercostals",
    cues: [
      "Lie prone, press palms into floor under shoulders",
      "Gently extend arms and lift chest proud",
      "Keep hips and pubic bone anchored to mat"
    ],
    anatomyFigure: `
      <circle cx="210" cy="330" r="22" fill="url(#flesh-base)"/>
      <path d="M 230 350 Q 300 390 450 430" stroke="url(#flesh-base)" stroke-width="22" stroke-linecap="round" fill="none"/>
      <line x1="230" y1="350" x2="250" y2="450" stroke="#475569" stroke-width="18" stroke-linecap="round"/>
    `,
    synergistMuscleGlow: `
      <path d="M 330 380 L 370 410" stroke="url(#synergist-fibers)" stroke-width="14"/>
    `,
    primaryMuscleGlow: `
      <path d="M 240 360 Q 280 375 320 390" stroke="url(#primary-fibers)" stroke-width="18" stroke-linecap="round"/>
    `
  },

  // 43. QL Side Bend Stretch
  'ql_stretch.svg': {
    title: "QL Side Bend & Lateral Trunk Stretch",
    subtitle: "Quadratus Lumborum & Oblique Decompression",
    primaryTarget: "Quadratus Lumborum & Obliques",
    synergistTarget: "Latissimus Dorsi, Intercostals",
    cues: [
      "Reach top arm overhead in an arc across body",
      "Side-bend torso away from stretching hip",
      "Breathe deeply into the lateral lower back"
    ],
    anatomyFigure: `
      <circle cx="340" cy="210" r="24" fill="url(#flesh-base)"/>
      <path d="M 340 240 Q 370 320 340 450" stroke="url(#flesh-base)" stroke-width="22" stroke-linecap="round" fill="none"/>
      <path d="M 340 240 Q 300 160 260 220" stroke="url(#flesh-base)" stroke-width="18" stroke-linecap="round" fill="none"/>
    `,
    synergistMuscleGlow: `
      <circle cx="340" cy="270" r="14" fill="url(#synergist-fibers)"/>
    `,
    primaryMuscleGlow: `
      <path d="M 350 310 Q 375 350 350 390" stroke="url(#primary-fibers)" stroke-width="18" stroke-linecap="round"/>
    `
  },

  // 44. Supine Spinal Twist
  'supine_twist.svg': {
    title: "Supine Spinal Twist & Glute Opener",
    subtitle: "Rotational Mobility & Lateral Glute Release",
    primaryTarget: "Multifidus, Spinal Rotators & Gluteus Medius",
    synergistTarget: "Pectoralis Major, Obliques",
    cues: [
      "Lie on back, draw one knee across torso to floor",
      "Extend opposite arm flat to floor with gaze back",
      "Allow gravity and breath to melt spine open"
    ],
    anatomyFigure: `
      <circle cx="210" cy="380" r="22" fill="url(#flesh-base)"/>
      <path d="M 230 400 L 400 400" stroke="url(#flesh-base)" stroke-width="22" stroke-linecap="round"/>
      <path d="M 330 400 L 350 480 L 420 480" stroke="url(#flesh-base)" stroke-width="18" stroke-linecap="round" fill="none"/>
    `,
    synergistMuscleGlow: `
      <circle cx="260" cy="400" r="14" fill="url(#synergist-fibers)"/>
    `,
    primaryMuscleGlow: `
      <path d="M 290 395 L 360 415" stroke="url(#primary-fibers)" stroke-width="18" stroke-linecap="round"/>
    `
  },

  // 45. World's Greatest Stretch
  'worlds_greatest.svg': {
    title: "World's Greatest Stretch (Lunge + T-Spine)",
    subtitle: "Full-Body Kinetic Chain Mobility Matrix",
    primaryTarget: "Hip Flexors, Thoracic Spine & Hamstrings",
    synergistTarget: "Adductors, Calves, Glutes, Shoulders",
    cues: [
      "Deep runner's lunge with rear leg straight",
      "Drop inside elbow to instep",
      "Rotate top hand to ceiling, following with eyes"
    ],
    anatomyFigure: `
      <circle cx="260" cy="320" r="22" fill="url(#flesh-base)"/>
      <path d="M 280 340 L 370 420 L 470 440" stroke="url(#flesh-base)" stroke-width="20" stroke-linecap="round" fill="none"/>
      <path d="M 270 340 L 270 200" stroke="url(#flesh-base)" stroke-width="16" stroke-linecap="round"/>
    `,
    synergistMuscleGlow: `
      <circle cx="430" cy="430" r="14" fill="url(#synergist-fibers)"/>
    `,
    primaryMuscleGlow: `
      <path d="M 280 340 L 360 410" stroke="url(#primary-fibers)" stroke-width="18" stroke-linecap="round"/>
    `
  },

  // 46. Barbell Bench Press Vector
  'barbell_bench_press.svg': {
    title: "Barbell Bench Press",
    subtitle: "Horizontal Pectoral Drive & Scapular Stability",
    primaryTarget: "Pectoralis Major & Minor",
    synergistTarget: "Anterior Deltoid, Triceps Brachii",
    cues: [
      "Retract and depress scapulae",
      "Touch lower sternum under control",
      "Drive feet firmly through floor"
    ],
    anatomyFigure: `
      <rect x="220" y="380" width="300" height="24" rx="6" fill="#1e293b"/>
      <circle cx="260" cy="360" r="24" fill="url(#flesh-base)"/>
      <path d="M 280 360 L 440 360" stroke="url(#flesh-base)" stroke-width="22" stroke-linecap="round"/>
      <line x1="180" y1="280" x2="520" y2="280" stroke="#94a3b8" stroke-width="8"/>
    `,
    synergistMuscleGlow: `
      <circle cx="300" cy="360" r="16" fill="url(#synergist-fibers)"/>
    `,
    primaryMuscleGlow: `
      <ellipse cx="340" cy="355" rx="30" ry="16" fill="url(#primary-fibers)" stroke="#7dd3fc" stroke-width="2"/>
    `
  },

  // 47. Barbell Deadlift Vector
  'barbell_deadlift.svg': {
    title: "Conventional Barbell Deadlift",
    subtitle: "Posterior Chain Kinetic Power & Spinal Neutrality",
    primaryTarget: "Gluteus Maximus, Hamstrings & Erectors",
    synergistTarget: "Latissimus Dorsi, Trapezius, Forearms",
    cues: [
      "Bar over mid-foot with vertical shins",
      "Wedge hips and pull slack from bar",
      "Drive the floor away with quads & glutes"
    ],
    anatomyFigure: `
      <circle cx="340" cy="220" r="24" fill="url(#flesh-base)"/>
      <path d="M 330 250 L 330 380 L 300 480 L 300 550" stroke="url(#flesh-base)" stroke-width="22" stroke-linecap="round" fill="none"/>
      <line x1="220" y1="460" x2="460" y2="460" stroke="#94a3b8" stroke-width="8"/>
    `,
    synergistMuscleGlow: `
      <path d="M 330 260 L 330 360" stroke="url(#synergist-fibers)" stroke-width="14"/>
    `,
    primaryMuscleGlow: `
      <ellipse cx="320" cy="390" rx="25" ry="18" fill="url(#primary-fibers)" stroke="#7dd3fc" stroke-width="2"/>
    `
  },

  // 48. Barbell Squat Vector
  'barbell_squat.svg': {
    title: "Barbell Back Squat",
    subtitle: "Triple Flexion & Quadriceps Power",
    primaryTarget: "Quadriceps Femoris & Gluteus Maximus",
    synergistTarget: "Adductor Magnus, Hamstrings, Core",
    cues: [
      "Brace core 360° into lifting belt",
      "Knees track over second toe",
      "Hit parallel with upright chest"
    ],
    anatomyFigure: `
      <circle cx="340" cy="200" r="24" fill="url(#flesh-base)"/>
      <line x1="240" y1="210" x2="440" y2="210" stroke="#94a3b8" stroke-width="8"/>
      <path d="M 340 230 L 340 350 L 300 440 L 300 540" stroke="url(#flesh-base)" stroke-width="22" stroke-linecap="round" fill="none"/>
    `,
    synergistMuscleGlow: `
      <path d="M 340 240 L 340 330" stroke="url(#synergist-fibers)" stroke-width="12"/>
    `,
    primaryMuscleGlow: `
      <path d="M 335 360 L 310 435" stroke="url(#primary-fibers)" stroke-width="20" stroke-linecap="round"/>
    `
  },

  // 49. Pigeon Stretch Vector
  'pigeon_stretch.svg': {
    title: "Pigeon Hip & Glute Opener",
    subtitle: "Gluteus Medius & Deep External Rotator Release",
    primaryTarget: "Gluteus Medius & Piriformis",
    synergistTarget: "Psoas, Tensor Fasciae Latae",
    cues: [
      "Front shin angled 45° to 90° across mat",
      "Square hips toward floor",
      "Lengthen spine forward over front leg"
    ],
    anatomyFigure: `
      <circle cx="260" cy="340" r="22" fill="url(#flesh-base)"/>
      <path d="M 280 360 L 380 430 L 480 440" stroke="url(#flesh-base)" stroke-width="20" stroke-linecap="round" fill="none"/>
      <path d="M 340 420 L 260 450" stroke="url(#flesh-base)" stroke-width="18" stroke-linecap="round"/>
    `,
    synergistMuscleGlow: `
      <circle cx="430" cy="430" r="14" fill="url(#synergist-fibers)"/>
    `,
    primaryMuscleGlow: `
      <ellipse cx="360" cy="420" rx="24" ry="16" fill="url(#primary-fibers)" stroke="#7dd3fc" stroke-width="2"/>
    `
  },

  // 50. Quad Stretch Vector
  'quad_stretch.svg': {
    title: "Standing Quad Stretch",
    subtitle: "Quadriceps & Hip Flexor Opening",
    primaryTarget: "Quadriceps Femoris",
    synergistTarget: "Iliopsoas, Anterior Tibialis",
    cues: [
      "Keep knees pinned side by side",
      "Tuck pelvis under gently",
      "Draw heel straight to glute"
    ],
    anatomyFigure: `
      <circle cx="340" cy="180" r="26" fill="url(#flesh-base)"/>
      <path d="M 340 210 L 340 360 L 340 530" stroke="url(#flesh-base)" stroke-width="20" stroke-linecap="round"/>
      <path d="M 340 360 L 360 440 L 380 360" stroke="url(#flesh-base)" stroke-width="18" stroke-linecap="round" fill="none"/>
    `,
    synergistMuscleGlow: `
      <circle cx="340" cy="350" r="12" fill="url(#synergist-fibers)"/>
    `,
    primaryMuscleGlow: `
      <path d="M 345 365 L 360 435" stroke="url(#primary-fibers)" stroke-width="18" stroke-linecap="round"/>
    `
  }
};

let count = 0;
for (const [filename, item] of Object.entries(allRenders)) {
  const content = createMedicalDiagramSvg(item);
  fs.writeFileSync(path.join(publicAnatomyDir, filename), content, 'utf8');
  count++;
  console.log(`Rendered high-detail 3D medical anatomy diagram: ${filename}`);
}

console.log(`\nSuccessfully rendered ${count} photorealistic 3D medical anatomy diagrams!`);
