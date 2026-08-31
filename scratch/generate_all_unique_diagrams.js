const fs = require('fs');
const path = require('path');

const publicAnatomyDir = path.join(__dirname, '..', 'public', 'anatomy');
if (!fs.existsSync(publicAnatomyDir)) {
  fs.mkdirSync(publicAnatomyDir, { recursive: true });
}

function createSvg(title, subtitle, primaryLabel, cues, targetPaths, synergistPaths, bodyPaths) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="100%" height="100%" style="background:#090d16; font-family:system-ui, -apple-system, sans-serif;">
  <defs>
    <filter id="glow-primary" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="6" result="blur" />
      <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
    </filter>
    <filter id="glow-synergist" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="4" result="blur" />
      <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
    </filter>
    <linearGradient id="primary-grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#38bdf8" /><stop offset="60%" stop-color="#0284c7" /><stop offset="100%" stop-color="#0369a1" />
    </linearGradient>
    <linearGradient id="synergist-grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#f59e0b" /><stop offset="100%" stop-color="#d97706" />
    </linearGradient>
  </defs>

  <!-- Title Badge -->
  <g transform="translate(30, 30)">
    <rect width="440" height="44" rx="8" fill="#0f172a" stroke="#1e293b" stroke-width="1.5"/>
    <circle cx="20" cy="22" r="6" fill="#38bdf8" filter="url(#glow-primary)"/>
    <text x="36" y="27" fill="#f8fafc" font-size="14" font-weight="800" letter-spacing="0.5">${title.toUpperCase()}</text>
    <text x="340" y="27" fill="#38bdf8" font-size="11" font-weight="700">${subtitle.toUpperCase()}</text>
  </g>

  <!-- Floor / Prop Base Line -->
  <line x1="80" y1="540" x2="720" y2="540" stroke="#334155" stroke-width="4" stroke-linecap="round"/>

  <!-- Base Anatomy Body -->
  <g fill="#1e293b" stroke="#334155" stroke-width="2">
    ${bodyPaths}
  </g>

  <!-- Secondary / Synergist Muscles (Glowing Amber) -->
  <g filter="url(#glow-synergist)">
    ${synergistPaths}
  </g>

  <!-- Primary Target Muscles (Glowing Cyan/Teal) -->
  <g filter="url(#glow-primary)">
    ${targetPaths}
  </g>

  <!-- Kinesiology Callout Card -->
  <g transform="translate(480, 100)">
    <rect width="290" height="106" rx="8" fill="#0f172a" stroke="#38bdf8" stroke-width="1.5"/>
    <text x="14" y="24" fill="#38bdf8" font-size="11" font-weight="800">TARGET: ${primaryLabel.toUpperCase()}</text>
    ${cues.map((c, i) => `<text x="14" y="${46 + i * 19}" fill="#f8fafc" font-size="11" font-weight="600">• ${c}</text>`).join('\n    ')}
  </g>
</svg>`;
}

const uniqueDiagrams = {
  // 1. Barbell Bench Press
  'barbell_bench_press.svg': {
    title: "Barbell Bench Press",
    subtitle: "Pectoralis Major & Triceps",
    primaryLabel: "Pectoralis Major (Sternal & Clavicular)",
    cues: ["Retract & depress scapulae", "Lower bar to lower sternum", "Tuck elbows 45° like an arrow"],
    body: `<rect x="180" y="380" width="300" height="40" rx="4" fill="#1e293b" stroke="#334155" stroke-width="2"/>
           <line x1="200" y1="420" x2="200" y2="540" stroke="#334155" stroke-width="8"/>
           <line x1="460" y1="420" x2="460" y2="540" stroke="#334155" stroke-width="8"/>
           <path d="M 220 370 Q 300 370 380 370 L 410 430 L 460 540" stroke="#475569" stroke-width="22" stroke-linecap="round" fill="none"/>
           <circle cx="200" cy="360" r="24" fill="#334155"/>
           <line x1="240" y1="260" x2="380" y2="260" stroke="#64748b" stroke-width="14" stroke-linecap="round"/>`,
    synergists: `<circle cx="260" cy="330" r="14" fill="url(#synergist-grad)"/><path d="M 280 290 L 320 260" stroke="url(#synergist-grad)" stroke-width="16" stroke-linecap="round"/>`,
    targets: `<path d="M 280 340 Q 320 310 350 340 Q 330 370 290 370 Z" fill="url(#primary-grad)" stroke="#7dd3fc" stroke-width="2"/>`
  },

  // 2. Flat Dumbbell Press
  'flat_dumbbell_press.svg': {
    title: "Flat Dumbbell Press",
    subtitle: "Converging Pec Fiber Isolation",
    primaryLabel: "Pectoralis Major Deep Stretch",
    cues: ["Full horizontal adduction arc", "Deep bottom stretch at 90°", "Squeeze pecs at apex"],
    body: `<rect x="180" y="380" width="300" height="40" rx="4" fill="#1e293b" stroke="#334155" stroke-width="2"/>
           <path d="M 220 370 Q 300 370 380 370 L 410 430 L 460 540" stroke="#475569" stroke-width="22" stroke-linecap="round" fill="none"/>
           <circle cx="200" cy="360" r="24" fill="#334155"/>
           <rect x="250" y="240" width="30" height="18" rx="3" fill="#64748b"/>
           <rect x="340" y="240" width="30" height="18" rx="3" fill="#64748b"/>`,
    synergists: `<circle cx="260" cy="330" r="14" fill="url(#synergist-grad)"/>`,
    targets: `<path d="M 270 335 Q 310 305 345 335 Q 330 365 285 365 Z" fill="url(#primary-grad)" stroke="#7dd3fc" stroke-width="2"/>`
  },

  // 3. Barbell Deadlift
  'barbell_deadlift.svg': {
    title: "Barbell Conventional Deadlift",
    subtitle: "Posterior Chain Kinetic Chain",
    primaryLabel: "Gluteus Maximus, Hamstrings & Erectors",
    cues: ["Wedge hips down into bar", "Engage lats & pull slack out", "Drive floor away with mid-foot"],
    body: `<circle cx="340" cy="180" r="26" fill="#334155"/>
           <path d="M 330 210 L 300 310 L 360 410 L 340 520" stroke="#475569" stroke-width="22" stroke-linecap="round" fill="none"/>
           <path d="M 330 220 L 300 360 L 310 480" stroke="#334155" stroke-width="16" stroke-linecap="round" fill="none"/>
           <line x1="240" y1="480" x2="420" y2="480" stroke="#64748b" stroke-width="16" stroke-linecap="round"/>
           <circle cx="330" cy="480" r="32" fill="#1e293b" stroke="#64748b" stroke-width="4"/>`,
    synergists: `<path d="M 320 220 L 310 320" stroke="url(#synergist-grad)" stroke-width="12" stroke-linecap="round"/>`,
    targets: `<path d="M 285 295 Q 330 330 315 385 Q 275 350 285 295 Z" fill="url(#primary-grad)" stroke="#7dd3fc" stroke-width="2"/>
              <path d="M 315 385 Q 345 420 335 480 L 310 470 Z" fill="url(#primary-grad)" stroke="#7dd3fc" stroke-width="2"/>`
  },

  // 4. Romanian Deadlift (RDL)
  'romanian_deadlift.svg': {
    title: "Romanian Deadlift (RDL)",
    subtitle: "Hamstrings & Glute Extension",
    primaryLabel: "Hamstrings (Biceps Femoris)",
    cues: ["Soft knee bend throughout", "Push hips straight back to wall", "Bar scrapes down thighs"],
    body: `<circle cx="380" cy="220" r="26" fill="#334155"/>
           <path d="M 370 250 L 310 330 L 330 450 L 320 530" stroke="#475569" stroke-width="22" stroke-linecap="round" fill="none"/>
           <path d="M 370 260 L 350 380 L 330 460" stroke="#334155" stroke-width="16" stroke-linecap="round" fill="none"/>
           <line x1="270" y1="460" x2="410" y2="460" stroke="#64748b" stroke-width="14" stroke-linecap="round"/>`,
    synergists: `<path d="M 350 260 L 320 330" stroke="url(#synergist-grad)" stroke-width="12" stroke-linecap="round"/>`,
    targets: `<path d="M 310 330 Q 360 360 340 450 Q 305 400 310 330 Z" fill="url(#primary-grad)" stroke="#7dd3fc" stroke-width="2"/>`
  },

  // 5. Lat Pulldown
  'lat_pulldown.svg': {
    title: "Lat Pulldown (Wide Grip)",
    subtitle: "Latissimus Dorsi Outer Flare",
    primaryLabel: "Latissimus Dorsi & Teres Major",
    cues: ["Lean back 10-15° with proud chest", "Drive elbows into back pockets", "Full overhead stretch at top"],
    body: `<circle cx="340" cy="220" r="26" fill="#334155"/>
           <path d="M 320 250 L 360 250 L 350 410 L 310 410 Z"/>
           <path d="M 310 250 L 270 140 M 370 250 L 410 140" stroke="#475569" stroke-width="18" stroke-linecap="round"/>
           <line x1="220" y1="130" x2="460" y2="130" stroke="#64748b" stroke-width="12" stroke-linecap="round"/>
           <rect x="290" y="410" width="80" height="90" rx="4" fill="#1e293b" stroke="#334155" stroke-width="2"/>`,
    synergists: `<circle cx="280" cy="190" r="12" fill="url(#synergist-grad)"/><circle cx="400" cy="190" r="12" fill="url(#synergist-grad)"/>`,
    targets: `<path d="M 315 260 Q 275 320 310 390 Q 330 330 325 270 Z" fill="url(#primary-grad)" stroke="#7dd3fc" stroke-width="2"/>
              <path d="M 365 260 Q 405 320 370 390 Q 350 330 355 270 Z" fill="url(#primary-grad)" stroke="#7dd3fc" stroke-width="2"/>`
  },

  // 6. Barbell Back Squat
  'barbell_squat.svg': {
    title: "Barbell Back Squat",
    subtitle: "Quadriceps & Glute Drive",
    primaryLabel: "Quadriceps Femoris & Gluteus Maximus",
    cues: ["Bar packed across upper traps", "Knees track over toes", "Drive floor away out of the hole"],
    body: `<circle cx="340" cy="220" r="26" fill="#334155"/>
           <path d="M 330 250 L 310 340 L 360 410 L 340 520" stroke="#475569" stroke-width="22" stroke-linecap="round" fill="none"/>
           <line x1="220" y1="240" x2="460" y2="240" stroke="#64748b" stroke-width="16" stroke-linecap="round"/>`,
    synergists: `<path d="M 300 310 Q 340 340 320 380 Z" fill="url(#synergist-grad)"/>`,
    targets: `<path d="M 310 340 Q 370 370 350 430 Q 320 390 310 340 Z" fill="url(#primary-grad)" stroke="#7dd3fc" stroke-width="2"/>`
  },

  // 7. Leg Extension
  'leg_extension.svg': {
    title: "Leg Extension (Machine)",
    subtitle: "Rectus Femoris & Vastus Isolation",
    primaryLabel: "Quadriceps Terminal Lockout",
    cues: ["Align knee with machine axis", "Extend to 1-sec peak contraction", "Control 3-sec eccentric descent"],
    body: `<rect x="250" y="320" width="100" height="90" rx="6" fill="#1e293b" stroke="#334155" stroke-width="2"/>
           <circle cx="300" cy="220" r="24" fill="#334155"/>
           <path d="M 290 250 L 310 340 L 410 350 L 430 440" stroke="#475569" stroke-width="20" stroke-linecap="round" fill="none"/>`,
    synergists: `<circle cx="310" cy="340" r="12" fill="url(#synergist-grad)"/>`,
    targets: `<path d="M 310 330 Q 370 320 410 345 Q 360 365 310 350 Z" fill="url(#primary-grad)" stroke="#7dd3fc" stroke-width="2"/>`
  },

  // 8. Leg Curl
  'leg_curl.svg': {
    title: "Seated / Lying Leg Curl",
    subtitle: "Knee Flexion Hamstring Isolation",
    primaryLabel: "Hamstrings (Biceps Femoris / Semitendinosus)",
    cues: ["Hips pressed firmly down", "Curl pad directly to glutes", "Dorsiflex ankles to lock calves"],
    body: `<rect x="230" y="340" width="120" height="70" rx="6" fill="#1e293b" stroke="#334155" stroke-width="2"/>
           <circle cx="200" cy="300" r="24" fill="#334155"/>
           <path d="M 220 320 L 320 350 L 290 440" stroke="#475569" stroke-width="20" stroke-linecap="round" fill="none"/>`,
    synergists: `<path d="M 290 420 L 310 470" stroke="url(#synergist-grad)" stroke-width="10" stroke-linecap="round"/>`,
    targets: `<path d="M 240 335 Q 310 340 320 370 Q 280 390 240 360 Z" fill="url(#primary-grad)" stroke="#7dd3fc" stroke-width="2"/>`
  },

  // 9. Standing Calf Raise
  'standing_calf_raise.svg': {
    title: "Standing Calf Raise",
    subtitle: "Gastrocnemius & Soleus",
    primaryLabel: "Gastrocnemius (Medial & Lateral Heads)",
    cues: ["2-sec deep stretch below platform", "Drive through big toe knuckle", "2-sec peak hold at apex"],
    body: `<circle cx="340" cy="180" r="26" fill="#334155"/>
           <path d="M 320 210 L 360 210 L 350 360 L 330 360 Z"/>
           <path d="M 330 360 L 330 480 M 350 360 L 350 480" stroke="#475569" stroke-width="18" stroke-linecap="round"/>
           <rect x="290" y="490" width="100" height="14" rx="3" fill="#334155"/>`,
    synergists: `<path d="M 325 430 L 325 470 M 345 430 L 345 470" stroke="url(#synergist-grad)" stroke-width="8"/>`,
    targets: `<path d="M 320 370 Q 300 400 325 435 Q 340 400 330 370 Z" fill="url(#primary-grad)" stroke="#7dd3fc" stroke-width="2"/>
              <path d="M 360 370 Q 380 400 355 435 Q 340 400 350 370 Z" fill="url(#primary-grad)" stroke="#7dd3fc" stroke-width="2"/>`
  },

  // 10. Hip Thrust
  'hip_thrust.svg': {
    title: "Barbell Hip Thrust",
    subtitle: "Peak Gluteus Maximus Contraction",
    primaryLabel: "Gluteus Maximus Lockout",
    cues: ["Upper back pinned on bench", "Vertical shins at top", "Tuck chin & drive hips horizontal"],
    body: `<rect x="180" y="380" width="90" height="60" rx="4" fill="#1e293b" stroke="#334155" stroke-width="2"/>
           <circle cx="210" cy="340" r="22" fill="#334155"/>
           <path d="M 230 370 L 340 370 L 350 490" stroke="#475569" stroke-width="22" stroke-linecap="round" fill="none"/>
           <circle cx="340" cy="360" r="28" fill="#1e293b" stroke="#64748b" stroke-width="4"/>`,
    synergists: `<path d="M 270 380 L 330 380" stroke="url(#synergist-grad)" stroke-width="12" stroke-linecap="round"/>`,
    targets: `<path d="M 280 350 Q 340 340 345 385 Q 300 395 280 350 Z" fill="url(#primary-grad)" stroke="#7dd3fc" stroke-width="2"/>`
  },

  // 11. Overhead Shoulder Press
  'overhead_press.svg': {
    title: "Overhead Shoulder Press",
    subtitle: "Anterior & Lateral Deltoid",
    primaryLabel: "Anterior Deltoid & Triceps",
    cues: ["Brace glutes & core neutral", "Press in vertical path over ears", "Head pushes through window"],
    body: `<circle cx="340" cy="220" r="26" fill="#334155"/>
           <path d="M 320 250 L 360 250 L 350 450 L 330 450 Z"/>
           <path d="M 310 260 L 280 140 M 370 260 L 400 140" stroke="#475569" stroke-width="16" stroke-linecap="round"/>
           <line x1="230" y1="130" x2="450" y2="130" stroke="#64748b" stroke-width="14" stroke-linecap="round"/>`,
    synergists: `<path d="M 290 170 L 290 220 M 390 170 L 390 220" stroke="url(#synergist-grad)" stroke-width="12" stroke-linecap="round"/>`,
    targets: `<circle cx="305" cy="260" r="18" fill="url(#primary-grad)" stroke="#7dd3fc" stroke-width="2"/>
              <circle cx="375" cy="260" r="18" fill="url(#primary-grad)" stroke="#7dd3fc" stroke-width="2"/>`
  },

  // 12. Dumbbell Lateral Raise
  'lateral_raise.svg': {
    title: "Dumbbell Lateral Raise",
    subtitle: "Lateral Deltoid Capped Flare",
    primaryLabel: "Lateral Deltoid (Middle Head)",
    cues: ["Slight 15° forward torso hinge", "Lead with elbows in scapular plane", "Pour pitcher slightly at peak"],
    body: `<circle cx="340" cy="200" r="26" fill="#334155"/>
           <path d="M 320 230 L 360 230 L 355 450 L 325 450 Z"/>
           <path d="M 310 240 L 210 250 M 370 240 L 470 250" stroke="#475569" stroke-width="16" stroke-linecap="round"/>
           <rect x="180" y="240" width="26" height="18" rx="3" fill="#64748b"/>
           <rect x="474" y="240" width="26" height="18" rx="3" fill="#64748b"/>`,
    synergists: `<path d="M 330 220 L 315 240 M 350 220 L 365 240" stroke="url(#synergist-grad)" stroke-width="10"/>`,
    targets: `<ellipse cx="295" cy="240" rx="16" ry="12" fill="url(#primary-grad)" stroke="#7dd3fc" stroke-width="2"/>
              <ellipse cx="385" cy="240" rx="16" ry="12" fill="url(#primary-grad)" stroke="#7dd3fc" stroke-width="2"/>`
  },

  // 13. Standing Bicep Curl
  'bicep_curl.svg': {
    title: "Standing Dumbbell Bicep Curl",
    subtitle: "Biceps Brachii & Supination",
    primaryLabel: "Biceps Brachii (Short & Long Heads)",
    cues: ["Pin elbows to ribcage", "Supinate wrist on the ascent", "Full bottom elbow extension stretch"],
    body: `<circle cx="340" cy="180" r="26" fill="#334155"/>
           <path d="M 320 210 L 360 210 L 350 460 L 330 460 Z"/>
           <path d="M 310 220 L 310 320 L 280 240" stroke="#475569" stroke-width="18" stroke-linecap="round" fill="none"/>
           <circle cx="280" cy="230" r="14" fill="#64748b"/>`,
    synergists: `<path d="M 290 270 L 285 240" stroke="url(#synergist-grad)" stroke-width="10" stroke-linecap="round"/>`,
    targets: `<path d="M 305 240 Q 280 280 305 310 Q 320 280 315 240 Z" fill="url(#primary-grad)" stroke="#7dd3fc" stroke-width="2"/>`
  },

  // 14. Hammer Curl
  'hammer_curl.svg': {
    title: "Dumbbell Hammer Curl",
    subtitle: "Brachialis & Brachioradialis",
    primaryLabel: "Brachialis & Forearm Thickness",
    cues: ["Neutral thumbs-up grip", "Elbows pinned steady", "Squeeze mid-arm at top"],
    body: `<circle cx="340" cy="180" r="26" fill="#334155"/>
           <path d="M 320 210 L 360 210 L 350 460 L 330 460 Z"/>
           <path d="M 310 220 L 310 320 L 280 240" stroke="#475569" stroke-width="18" stroke-linecap="round" fill="none"/>
           <rect x="270" y="220" width="20" height="28" rx="4" fill="#64748b"/>`,
    synergists: `<path d="M 305 240 L 305 300" stroke="url(#synergist-grad)" stroke-width="10"/>`,
    targets: `<path d="M 290 260 L 280 320" stroke="url(#primary-grad)" stroke-width="14" stroke-linecap="round" filter="url(#glow-primary)"/>`
  },

  // 15. Triceps Pushdown
  'tricep_pushdown.svg': {
    title: "Triceps Rope Pushdown",
    subtitle: "Lateral & Medial Triceps Heads",
    primaryLabel: "Triceps Brachii Terminal Extension",
    cues: ["Elbows pinned to sides", "Flare rope apart at bottom", "Full peak lockout squeeze"],
    body: `<circle cx="340" cy="180" r="26" fill="#334155"/>
           <path d="M 320 210 L 360 210 L 350 460 L 330 460 Z"/>
           <path d="M 310 220 L 310 310 L 310 410" stroke="#475569" stroke-width="18" stroke-linecap="round" fill="none"/>
           <line x1="310" y1="120" x2="310" y2="280" stroke="#64748b" stroke-width="6"/>`,
    synergists: `<circle cx="310" cy="220" r="10" fill="url(#synergist-grad)"/>`,
    targets: `<path d="M 315 220 Q 335 270 315 310 Q 305 270 310 220 Z" fill="url(#primary-grad)" stroke="#7dd3fc" stroke-width="2"/>`
  },

  // 16. Plank
  'plank.svg': {
    title: "Forearm Plank Core Isometric",
    subtitle: "Transverse Abdominis & Anterior Core",
    primaryLabel: "Rectus Abdominis & Deep Core Cylinder",
    cues: ["Rigid straight line head to heels", "Posterior pelvic tilt squeeze", "Breathe into braced abdominal wall"],
    body: `<circle cx="210" cy="380" r="22" fill="#334155"/>
           <path d="M 230 400 L 460 400 L 480 480" stroke="#475569" stroke-width="20" stroke-linecap="round" fill="none"/>
           <path d="M 240 400 L 240 480" stroke="#334155" stroke-width="16" stroke-linecap="round"/>`,
    synergists: `<path d="M 380 400 L 450 400" stroke="url(#synergist-grad)" stroke-width="12" stroke-linecap="round"/>`,
    targets: `<path d="M 260 395 L 360 395" stroke="url(#primary-grad)" stroke-width="16" stroke-linecap="round" filter="url(#glow-primary)"/>`
  },

  // 17. Cat-Cow Spine Flow
  'cat_cow.svg': {
    title: "Cat-Cow Spine Flow",
    subtitle: "Spinal Flexion & Extension Mobility",
    primaryLabel: "Erector Spinae & Segmental Vertebrae",
    cues: ["Inhale into anterior pelvic tilt", "Exhale into full spinal flexion dome", "Move one vertebra at a time"],
    body: `<circle cx="200" cy="360" r="22" fill="#334155"/>
           <path d="M 220 380 Q 300 330 380 380 L 380 480" stroke="#475569" stroke-width="20" stroke-linecap="round" fill="none"/>
           <path d="M 220 380 L 220 480" stroke="#334155" stroke-width="16" stroke-linecap="round"/>`,
    synergists: `<circle cx="300" cy="350" r="14" fill="url(#synergist-grad)"/>`,
    targets: `<path d="M 230 365 Q 300 320 370 365" stroke="url(#primary-grad)" stroke-width="14" stroke-linecap="round" fill="none" filter="url(#glow-primary)"/>`
  },

  // 18. Chest Doorway Stretch
  'chest_doorway_stretch.svg': {
    title: "Chest Doorway Stretch",
    subtitle: "Pectoralis Major & Minor Length",
    primaryLabel: "Pectoralis Major & Minor Fibers",
    cues: ["Forearm anchored at 90°", "Step forward gently with same-side leg", "Rotate torso away from frame"],
    body: `<circle cx="340" cy="200" r="26" fill="#334155"/>
           <path d="M 320 230 L 360 230 L 350 460 L 330 460 Z"/>
           <path d="M 310 240 L 220 240 L 220 160" stroke="#475569" stroke-width="18" stroke-linecap="round" fill="none"/>
           <line x1="200" y1="120" x2="200" y2="520" stroke="#64748b" stroke-width="12"/>`,
    synergists: `<circle cx="310" cy="240" r="14" fill="url(#synergist-grad)"/>`,
    targets: `<path d="M 320 245 Q 260 260 300 310 Q 330 280 320 245 Z" fill="url(#primary-grad)" stroke="#7dd3fc" stroke-width="2"/>`
  },

  // 19. Pigeon Stretch
  'pigeon_stretch.svg': {
    title: "Pigeon Hip Opener Stretch",
    subtitle: "Piriformis & Outer Glute Complex",
    primaryLabel: "Piriformis & Deep Hip Rotators",
    cues: ["Front shin angled 45-90° across mat", "Square hips level to floor", "Breathe into outer glute tension"],
    body: `<circle cx="240" cy="320" r="24" fill="#334155"/>
           <path d="M 260 340 L 350 380 L 480 430 L 510 520" stroke="#475569" stroke-width="22" stroke-linecap="round" fill="none"/>
           <path d="M 330 380 L 280 460 L 340 480" stroke="#334155" stroke-width="18" stroke-linecap="round" fill="none"/>`,
    synergists: `<path d="M 380 400 L 460 420" stroke="url(#synergist-grad)" stroke-width="12" stroke-linecap="round"/>`,
    targets: `<path d="M 310 370 Q 360 380 340 430 Q 300 420 310 370 Z" fill="url(#primary-grad)" stroke="#7dd3fc" stroke-width="2"/>`
  },

  // 20. Standing Quad Stretch
  'standing_quad_stretch.svg': {
    title: "Standing Quad Stretch",
    subtitle: "Rectus Femoris & Knee Extensors",
    primaryLabel: "Quadriceps Femoris Length",
    cues: ["Grasp ankle behind glute", "Knees together with hips tucked", "Squeeze glute for anterior hip stretch"],
    body: `<circle cx="340" cy="180" r="26" fill="#334155"/>
           <path d="M 320 210 L 360 210 L 350 360 L 330 360 Z"/>
           <path d="M 350 360 L 350 520" stroke="#475569" stroke-width="18" stroke-linecap="round"/>
           <path d="M 330 360 L 330 460 L 360 420 L 370 330" stroke="#334155" stroke-width="16" stroke-linecap="round" fill="none"/>`,
    synergists: `<path d="M 330 330 L 330 370" stroke="url(#synergist-grad)" stroke-width="10"/>`,
    targets: `<path d="M 325 365 Q 310 410 330 450 Q 345 410 335 365 Z" fill="url(#primary-grad)" stroke="#7dd3fc" stroke-width="2"/>`
  },

  // 21. Band Pass-Throughs
  'band_pass_throughs.svg': {
    title: "Band Pass-Throughs (Dislocates)",
    subtitle: "Glenohumeral & Rotator Cuff Mobility",
    primaryLabel: "Anterior Capsule & Chest Opener",
    cues: ["Wide grip on resistance band", "Rotate smoothly front to back", "Keep ribs down without arching"],
    body: `<circle cx="340" cy="200" r="26" fill="#334155"/>
           <path d="M 320 230 L 360 230 L 350 460 L 330 460 Z"/>
           <path d="M 310 240 L 230 200 M 370 240 L 450 200" stroke="#475569" stroke-width="16" stroke-linecap="round"/>
           <line x1="210" y1="190" x2="470" y2="190" stroke="#38bdf8" stroke-width="6" stroke-dasharray="4,4"/>`,
    synergists: `<circle cx="310" cy="240" r="14" fill="url(#synergist-grad)"/><circle cx="370" cy="240" r="14" fill="url(#synergist-grad)"/>`,
    targets: `<path d="M 310 245 Q 340 260 370 245 Q 340 290 310 245 Z" fill="url(#primary-grad)" stroke="#7dd3fc" stroke-width="2"/>`
  }
};

let generatedCount = 0;
for (const [filename, d] of Object.entries(uniqueDiagrams)) {
  const svgContent = createSvg(d.title, d.subtitle, d.primaryLabel, d.cues, d.targets, d.synergists, d.body);
  const destPath = path.join(publicAnatomyDir, filename);
  fs.writeFileSync(destPath, svgContent, 'utf8');
  generatedCount++;
  console.log(`Generated dedicated unique diagram: ${filename}`);
}

console.log(`\nSuccessfully created ${generatedCount} dedicated unique SVG anatomy diagrams!`);
