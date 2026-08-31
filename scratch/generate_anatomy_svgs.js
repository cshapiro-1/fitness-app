const fs = require('fs');
const path = require('path');

const publicAnatomyDir = path.join(__dirname, '..', 'public', 'anatomy');

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
    <rect width="420" height="44" rx="8" fill="#0f172a" stroke="#1e293b" stroke-width="1.5"/>
    <circle cx="20" cy="22" r="6" fill="#38bdf8" filter="url(#glow-primary)"/>
    <text x="36" y="27" fill="#f8fafc" font-size="14" font-weight="800" letter-spacing="0.5">${title.toUpperCase()}</text>
    <text x="330" y="27" fill="#38bdf8" font-size="11" font-weight="700">${subtitle.toUpperCase()}</text>
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
    <rect width="280" height="100" rx="8" fill="#0f172a" stroke="#38bdf8" stroke-width="1.5"/>
    <text x="14" y="24" fill="#38bdf8" font-size="11" font-weight="800">TARGET: ${primaryLabel.toUpperCase()}</text>
    ${cues.map((c, i) => `<text x="14" y="${44 + i * 18}" fill="#f8fafc" font-size="11" font-weight="600">• ${c}</text>`).join('\n    ')}
  </g>
</svg>`;
}

const diagrams = {
  // Lat Hang & Stretch
  'lat_stretch.svg': {
    title: "Lat Hang & Side Reach Stretch",
    subtitle: "Lats & Teres Major",
    primaryLabel: "Latissimus Dorsi Flare",
    cues: ["Hang from bar with soft knees", "Breathe into lateral ribcage", "Depress scapulae gently"],
    body: `<circle cx="340" cy="180" r="28" fill="#334155" stroke="#475569" stroke-width="2"/>
           <path d="M 320 210 L 360 210 L 370 420 L 310 420 Z"/>
           <path d="M 310 210 L 290 90 M 370 210 L 390 90" stroke="#475569" stroke-width="20" stroke-linecap="round"/>
           <line x1="220" y1="80" x2="460" y2="80" stroke="#64748b" stroke-width="16" stroke-linecap="round"/>`,
    synergists: `<circle cx="310" cy="210" r="16" fill="url(#synergist-grad)"/><circle cx="370" cy="210" r="16" fill="url(#synergist-grad)"/>`,
    targets: `<path d="M 310 220 Q 270 300 310 380 Q 330 300 325 230 Z" fill="url(#primary-grad)" stroke="#7dd3fc" stroke-width="2"/>
              <path d="M 370 220 Q 410 300 370 380 Q 350 300 355 230 Z" fill="url(#primary-grad)" stroke="#7dd3fc" stroke-width="2"/>`
  },

  // Child's Pose Lat Stretch
  'childs_pose.svg': {
    title: "Child's Pose Lat Stretch",
    subtitle: "Thoracolumbar & Lats",
    primaryLabel: "Lats & Lower Back",
    cues: ["Sit hips back on heels", "Walk hands diagonally to side", "Breathe into back ribs"],
    body: `<circle cx="240" cy="380" r="24" fill="#334155" stroke="#475569" stroke-width="2"/>
           <path d="M 260 380 Q 360 320 440 380 L 400 480 Q 300 460 260 440 Z"/>
           <path d="M 260 380 L 160 320" stroke="#475569" stroke-width="18" stroke-linecap="round"/>`,
    synergists: `<path d="M 400 400 Q 460 420 420 480 Z" fill="url(#synergist-grad)"/>`,
    targets: `<path d="M 280 360 Q 360 310 420 360 Q 360 350 280 370 Z" fill="url(#primary-grad)" stroke="#7dd3fc" stroke-width="2"/>`
  },

  // Upper Trap & Neck Stretch
  'neck_trap_stretch.svg': {
    title: "Upper Trap & Neck Stretch",
    subtitle: "Upper Trapezius",
    primaryLabel: "Upper Trap & Levator",
    cues: ["Gently tilt ear toward shoulder", "Depress opposite shoulder down", "Hold steady for 30s"],
    body: `<circle cx="340" cy="200" r="32" fill="#334155" stroke="#475569" stroke-width="2"/>
           <path d="M 280 280 L 400 280 L 410 460 L 270 460 Z"/>`,
    synergists: `<circle cx="280" cy="280" r="16" fill="url(#synergist-grad)"/><circle cx="400" cy="280" r="16" fill="url(#synergist-grad)"/>`,
    targets: `<path d="M 340 230 Q 300 250 280 280 Q 320 270 340 245 Z" fill="url(#primary-grad)" stroke="#7dd3fc" stroke-width="2"/>
              <path d="M 340 230 Q 380 250 400 280 Q 360 270 340 245 Z" fill="url(#primary-grad)" stroke="#7dd3fc" stroke-width="2"/>`
  },

  // Foam Roll Thoracic Spine
  'foam_roll_thoracic.svg': {
    title: "Foam Roll Thoracic Spine",
    subtitle: "Upper Back Mobility",
    primaryLabel: "Thoracic Extensors & Rhomboids",
    cues: ["Roll mid-back to top of traps", "Hug elbows together to open scapulae", "Extend upper back over roller"],
    body: `<circle cx="200" cy="380" r="24" fill="#334155" stroke="#475569" stroke-width="2"/>
           <path d="M 220 380 L 420 440 L 380 520 L 220 520 Z"/>
           <ellipse cx="320" cy="460" rx="30" ry="18" fill="#64748b"/>`,
    synergists: `<circle cx="240" cy="400" r="14" fill="url(#synergist-grad)"/>`,
    targets: `<path d="M 250 390 Q 340 420 380 440 Q 320 430 260 400 Z" fill="url(#primary-grad)" stroke="#7dd3fc" stroke-width="2"/>`
  },

  // Thread the Needle
  'thread_the_needle.svg': {
    title: "Thread the Needle Rotation",
    subtitle: "Thoracic Rotation",
    primaryLabel: "Thoracic Rotators & Rear Delts",
    cues: ["Slide arm under torso along floor", "Rest ear gently on mat", "Breathe into mid-back twist"],
    body: `<circle cx="280" cy="340" r="26" fill="#334155" stroke="#475569" stroke-width="2"/>
           <path d="M 300 350 L 460 380 L 440 480 L 320 480 Z"/>
           <path d="M 340 370 L 200 430" stroke="#475569" stroke-width="16" stroke-linecap="round"/>`,
    synergists: `<circle cx="440" cy="390" r="16" fill="url(#synergist-grad)"/>`,
    targets: `<path d="M 320 360 Q 380 370 420 380 Q 370 390 320 380 Z" fill="url(#primary-grad)" stroke="#7dd3fc" stroke-width="2"/>`
  },

  // Standing Quad Stretch
  'quad_stretch.svg': {
    title: "Standing Quad Stretch",
    subtitle: "Quadriceps Femoris",
    primaryLabel: "Rectus Femoris & Vasti",
    cues: ["Pull heel directly to glute", "Keep knees aligned together", "Tuck pelvis under (posterior tilt)"],
    body: `<circle cx="340" cy="140" r="26" fill="#334155" stroke="#475569" stroke-width="2"/>
           <path d="M 320 170 L 360 170 L 365 330 L 315 330 Z"/>
           <path d="M 325 330 L 325 540" stroke="#334155" stroke-width="22" stroke-linecap="round"/>`,
    synergists: `<path d="M 330 330 Q 360 350 350 380 Z" fill="url(#synergist-grad)"/>`,
    targets: `<path d="M 355 330 Q 420 390 400 460 L 365 460 Q 365 390 345 330 Z" fill="url(#primary-grad)" stroke="#7dd3fc" stroke-width="2"/>`
  },

  // Frog Stretch (Deep Adductor)
  'frog_stretch.svg': {
    title: "Frog Stretch (Deep Adductors)",
    subtitle: "Groin & Hip Mobility",
    primaryLabel: "Adductor Longus & Magnus",
    cues: ["Place knees wide on mat", "Keep ankles turned outward", "Gently push hips back toward heels"],
    body: `<circle cx="340" cy="280" r="24" fill="#334155" stroke="#475569" stroke-width="2"/>
           <path d="M 320 300 L 360 300 L 380 400 L 300 400 Z"/>`,
    synergists: `<circle cx="340" cy="390" r="14" fill="url(#synergist-grad)"/>`,
    targets: `<path d="M 300 400 L 180 460 Q 240 480 320 430 Z" fill="url(#primary-grad)" stroke="#7dd3fc" stroke-width="2"/>
              <path d="M 380 400 L 500 460 Q 440 480 360 430 Z" fill="url(#primary-grad)" stroke="#7dd3fc" stroke-width="2"/>`
  },

  // Figure 4 Glute Stretch
  'figure4_stretch.svg': {
    title: "Figure 4 Glute & Piriformis Stretch",
    subtitle: "Outer Hip & Glutes",
    primaryLabel: "Gluteus Medius & Piriformis",
    cues: ["Cross ankle over opposite knee", "Thread hands behind hamstring", "Draw knee gently toward chest"],
    body: `<circle cx="180" cy="480" r="24" fill="#334155" stroke="#475569" stroke-width="2"/>
           <path d="M 200 480 L 360 480 L 380 430 L 220 430 Z"/>`,
    synergists: `<circle cx="360" cy="450" r="14" fill="url(#synergist-grad)"/>`,
    targets: `<path d="M 340 440 Q 400 380 440 420 Q 380 460 340 450 Z" fill="url(#primary-grad)" stroke="#7dd3fc" stroke-width="2"/>`
  },

  // 90/90 Hip Mobility Flow
  'hip_90_90.svg': {
    title: "90/90 Hip Mobility Flow",
    subtitle: "Internal & External Rotation",
    primaryLabel: "Hip Capsule & Glute Medius",
    cues: ["Front leg at 90° angle", "Back leg at 90° angle", "Keep chest proud, fold over front shin"],
    body: `<circle cx="320" cy="220" r="26" fill="#334155" stroke="#475569" stroke-width="2"/>
           <path d="M 300 250 L 340 250 L 350 400 L 290 400 Z"/>`,
    synergists: `<path d="M 350 400 L 480 460 Q 420 480 350 430 Z" fill="url(#synergist-grad)"/>`,
    targets: `<path d="M 290 400 L 160 440 Q 220 480 300 430 Z" fill="url(#primary-grad)" stroke="#7dd3fc" stroke-width="2"/>`
  },

  // Hamstring Standing Fold
  'hamstring_fold.svg': {
    title: "Standing Hamstring Fold",
    subtitle: "Posterior Chain",
    primaryLabel: "Hamstrings & Gastrocnemius",
    cues: ["Hinge deeply at hips", "Maintain soft bend in knees", "Let head and neck hang heavy"],
    body: `<circle cx="300" cy="380" r="24" fill="#334155" stroke="#475569" stroke-width="2"/>
           <path d="M 310 360 L 360 260 L 390 270 L 330 380 Z"/>
           <path d="M 360 260 L 370 540" stroke="#334155" stroke-width="22" stroke-linecap="round"/>`,
    synergists: `<path d="M 370 460 L 370 530" stroke="url(#synergist-grad)" stroke-width="12" stroke-linecap="round"/>`,
    targets: `<path d="M 360 270 Q 400 350 370 440 L 350 440 Q 365 350 345 280 Z" fill="url(#primary-grad)" stroke="#7dd3fc" stroke-width="2"/>`
  },

  // Seated Butterfly Stretch
  'butterfly_stretch.svg': {
    title: "Seated Butterfly Adductor Stretch",
    subtitle: "Inner Thigh & Groin",
    primaryLabel: "Adductor Complex & Gracilis",
    cues: ["Soles of feet pressed together", "Gently lower knees to floor", "Sit tall through spine"],
    body: `<circle cx="340" cy="220" r="26" fill="#334155" stroke="#475569" stroke-width="2"/>
           <path d="M 320 250 L 360 250 L 370 410 L 310 410 Z"/>`,
    synergists: `<circle cx="340" cy="400" r="14" fill="url(#synergist-grad)"/>`,
    targets: `<path d="M 310 410 Q 220 440 250 500 Q 300 460 330 430 Z" fill="url(#primary-grad)" stroke="#7dd3fc" stroke-width="2"/>
              <path d="M 370 410 Q 460 440 430 500 Q 380 460 350 430 Z" fill="url(#primary-grad)" stroke="#7dd3fc" stroke-width="2"/>`
  },

  // Calf Wall Stretch
  'calf_stretch.svg': {
    title: "Calf Wall Stretch",
    subtitle: "Lower Leg & Achilles",
    primaryLabel: "Gastrocnemius & Soleus",
    cues: ["Back heel flat on floor", "Front knee bent toward wall", "Drive hips gently forward"],
    body: `<rect x="620" y="160" width="20" height="380" fill="#334155"/>
           <circle cx="340" cy="200" r="26" fill="#334155" stroke="#475569" stroke-width="2"/>
           <path d="M 320 230 L 360 230 L 400 380 L 350 380 Z"/>
           <path d="M 350 380 L 220 540" stroke="#334155" stroke-width="20" stroke-linecap="round"/>`,
    synergists: `<path d="M 400 380 L 460 540" stroke="#334155" stroke-width="20" stroke-linecap="round"/>`,
    targets: `<path d="M 280 430 Q 310 470 250 520 Q 230 480 260 440 Z" fill="url(#primary-grad)" stroke="#7dd3fc" stroke-width="2"/>`
  },

  // Cross-Body Shoulder Stretch
  'shoulder_crossbody.svg': {
    title: "Cross-Body Shoulder Stretch",
    subtitle: "Posterior Deltoid",
    primaryLabel: "Posterior Deltoid & Infraspinatus",
    cues: ["Draw arm horizontally across chest", "Depress shoulder down away from ear", "Maintain tall neutral spine"],
    body: `<circle cx="340" cy="180" r="28" fill="#334155" stroke="#475569" stroke-width="2"/>
           <path d="M 280 220 L 400 220 L 390 420 L 290 420 Z"/>`,
    synergists: `<path d="M 330 240 Q 370 260 380 320 Z" fill="url(#synergist-grad)"/>`,
    targets: `<path d="M 380 220 Q 420 250 395 290 Q 365 260 375 225 Z" fill="url(#primary-grad)" stroke="#7dd3fc" stroke-width="2"/>`
  },

  // Sleeper Rotator Cuff Stretch
  'sleeper_stretch.svg': {
    title: "Sleeper Rotator Cuff Stretch",
    subtitle: "Internal Rotation",
    primaryLabel: "Infraspinatus & Teres Minor",
    cues: ["Side-lying with upper arm at 90°", "Gently press forearm toward floor", "Keep shoulder blade flat against mat"],
    body: `<circle cx="200" cy="420" r="24" fill="#334155" stroke="#475569" stroke-width="2"/>
           <path d="M 220 420 L 420 440 L 400 500 L 220 500 Z"/>`,
    synergists: `<circle cx="240" cy="430" r="14" fill="url(#synergist-grad)"/>`,
    targets: `<path d="M 230 420 Q 280 440 260 480 Q 220 460 225 430 Z" fill="url(#primary-grad)" stroke="#7dd3fc" stroke-width="2"/>`
  },

  // Overhead Triceps Stretch
  'tricep_stretch.svg': {
    title: "Overhead Triceps Stretch",
    subtitle: "Arm & Shoulder Extensors",
    primaryLabel: "Triceps Brachii (Long Head)",
    cues: ["Elbow pointed to ceiling", "Hand reaching down middle back", "Avoid overarching lumbar spine"],
    body: `<circle cx="340" cy="180" r="28" fill="#334155" stroke="#475569" stroke-width="2"/>
           <path d="M 300 220 L 380 220 L 370 420 L 310 420 Z"/>`,
    synergists: `<circle cx="300" cy="230" r="16" fill="url(#synergist-grad)"/>`,
    targets: `<path d="M 370 210 L 385 100 Q 370 90 355 120 L 350 210 Z" fill="url(#primary-grad)" stroke="#7dd3fc" stroke-width="2"/>`
  },

  // Biceps Wall Stretch
  'bicep_stretch.svg': {
    title: "Biceps Wall Stretch",
    subtitle: "Anterior Arm & Shoulder",
    primaryLabel: "Biceps Brachii & Brachialis",
    cues: ["Palm flat on wall with thumb up", "Rotate torso away from wall", "Keep shoulder packed down"],
    body: `<rect x="180" y="160" width="20" height="380" fill="#334155"/>
           <circle cx="360" cy="200" r="26" fill="#334155" stroke="#475569" stroke-width="2"/>
           <path d="M 330 230 L 390 230 L 380 440 L 320 440 Z"/>`,
    synergists: `<circle cx="335" cy="240" r="16" fill="url(#synergist-grad)"/>`,
    targets: `<path d="M 200 240 L 330 240 Q 300 270 240 260 Z" fill="url(#primary-grad)" stroke="#7dd3fc" stroke-width="2"/>`
  },

  // Wrist Flexor & Extensor Mobility
  'wrist_mobility.svg': {
    title: "Wrist Flexor & Extensor Mobility",
    subtitle: "Forearm & Grip",
    primaryLabel: "Forearm Flexors & Extensors",
    cues: ["Palms on floor with fingers pointing to knees", "Gently lean weight back", "Breathe into forearm stretch"],
    body: `<circle cx="340" cy="240" r="26" fill="#334155" stroke="#475569" stroke-width="2"/>
           <path d="M 310 270 L 370 270 L 390 440 L 290 440 Z"/>`,
    synergists: `<circle cx="340" cy="280" r="14" fill="url(#synergist-grad)"/>`,
    targets: `<path d="M 290 440 L 250 540 Q 280 540 310 470 Z" fill="url(#primary-grad)" stroke="#7dd3fc" stroke-width="2"/>
              <path d="M 390 440 L 430 540 Q 400 540 370 470 Z" fill="url(#primary-grad)" stroke="#7dd3fc" stroke-width="2"/>`
  },

  // Cobra Abdominal Stretch
  'cobra_stretch.svg': {
    title: "Cobra Abdominal Stretch",
    subtitle: "Anterior Core",
    primaryLabel: "Rectus Abdominis & Psoas",
    cues: ["Hips pressed firmly to mat", "Press through hands, lifting chest", "Depress shoulders away from ears"],
    body: `<circle cx="200" cy="260" r="26" fill="#334155" stroke="#475569" stroke-width="2"/>
           <path d="M 220 280 Q 320 360 480 480 L 480 540 L 220 540 Z"/>`,
    synergists: `<circle cx="250" cy="320" r="16" fill="url(#synergist-grad)"/>`,
    targets: `<path d="M 240 300 Q 320 380 400 440 Q 340 460 260 380 Z" fill="url(#primary-grad)" stroke="#7dd3fc" stroke-width="2"/>`
  },

  // QL Side Bend & Lateral Reach
  'ql_stretch.svg': {
    title: "QL Side Bend & Lateral Reach",
    subtitle: "Lateral Core & Spine",
    primaryLabel: "Quadratus Lumborum & Obliques",
    cues: ["Reach overhead arm across body", "Keep hips anchored", "Breathe into lateral flank"],
    body: `<circle cx="340" cy="180" r="28" fill="#334155" stroke="#475569" stroke-width="2"/>
           <path d="M 310 220 Q 360 280 340 420 L 380 420 Q 420 280 370 220 Z"/>`,
    synergists: `<circle cx="360" cy="220" r="16" fill="url(#synergist-grad)"/>`,
    targets: `<path d="M 320 280 Q 280 340 330 400 Q 350 340 340 290 Z" fill="url(#primary-grad)" stroke="#7dd3fc" stroke-width="2"/>`
  },

  // Supine Spinal Twist
  'supine_twist.svg': {
    title: "Supine Spinal Twist",
    subtitle: "Lumbar & Glute Mobility",
    primaryLabel: "Gluteus Medius & Obliques",
    cues: ["Both shoulders flat on mat", "Draw knee across body toward floor", "Turn gaze to opposite arm"],
    body: `<circle cx="200" cy="460" r="24" fill="#334155" stroke="#475569" stroke-width="2"/>
           <path d="M 220 460 L 460 460 L 420 520 L 220 520 Z"/>`,
    synergists: `<circle cx="260" cy="460" r="14" fill="url(#synergist-grad)"/>`,
    targets: `<path d="M 340 440 Q 420 380 450 440 Q 390 480 340 460 Z" fill="url(#primary-grad)" stroke="#7dd3fc" stroke-width="2"/>`
  },

  // World's Greatest Stretch
  'worlds_greatest.svg': {
    title: "World's Greatest Stretch",
    subtitle: "Full-Body Mobility",
    primaryLabel: "Psoas, Thoracic Rotators & Hips",
    cues: ["Deep runner's lunge", "Drop elbow inside ankle", "Rotate arm up to ceiling in full twist"],
    body: `<circle cx="260" cy="280" r="26" fill="#334155" stroke="#475569" stroke-width="2"/>
           <path d="M 280 300 L 440 360 L 420 480 L 240 480 Z"/>
           <path d="M 280 300 L 240 160" stroke="#475569" stroke-width="16" stroke-linecap="round"/>`,
    synergists: `<circle cx="340" cy="360" r="16" fill="url(#synergist-grad)"/>`,
    targets: `<path d="M 300 320 Q 380 340 410 380 Q 360 400 290 350 Z" fill="url(#primary-grad)" stroke="#7dd3fc" stroke-width="2"/>`
  },

  // Barbell Bent-Over Row
  'barbell_row.svg': {
    title: "Barbell Bent-Over Row",
    subtitle: "Upper Back & Lats",
    primaryLabel: "Latissimus Dorsi & Rhomboids",
    cues: ["45° torso hinge with flat spine", "Drive elbows back into back pockets", "Squeeze shoulder blades together"],
    body: `<circle cx="300" cy="220" r="26" fill="#334155" stroke="#475569" stroke-width="2"/>
           <path d="M 320 240 L 440 320 L 410 440 L 300 360 Z"/>
           <line x1="260" y1="420" x2="380" y2="420" stroke="#64748b" stroke-width="14" stroke-linecap="round"/>`,
    synergists: `<circle cx="310" cy="250" r="16" fill="url(#synergist-grad)"/>`,
    targets: `<path d="M 340 250 Q 420 290 400 360 Q 350 330 330 270 Z" fill="url(#primary-grad)" stroke="#7dd3fc" stroke-width="2"/>`
  },

  // Pull-Up
  'pull_up.svg': {
    title: "Pull-Up (Pronated Grip)",
    subtitle: "Vertical Back Pull",
    primaryLabel: "Latissimus Dorsi Flare",
    cues: ["Dead hang to chin over bar", "Depress scapulae before pulling", "Drive elbows down to ribcage"],
    body: `<circle cx="340" cy="180" r="28" fill="#334155" stroke="#475569" stroke-width="2"/>
           <path d="M 310 210 L 370 210 L 360 420 L 320 420 Z"/>
           <path d="M 310 210 L 260 100 M 370 210 L 420 100" stroke="#475569" stroke-width="20" stroke-linecap="round"/>
           <line x1="200" y1="90" x2="480" y2="90" stroke="#64748b" stroke-width="16" stroke-linecap="round"/>`,
    synergists: `<circle cx="310" cy="220" r="16" fill="url(#synergist-grad)"/><circle cx="370" cy="220" r="16" fill="url(#synergist-grad)"/>`,
    targets: `<path d="M 310 230 Q 260 300 310 380 Q 330 310 325 240 Z" fill="url(#primary-grad)" stroke="#7dd3fc" stroke-width="2"/>
              <path d="M 370 230 Q 420 300 370 380 Q 350 310 355 240 Z" fill="url(#primary-grad)" stroke="#7dd3fc" stroke-width="2"/>`
  },

  // Incline Bench Press
  'incline_bench.svg': {
    title: "Incline Barbell Bench Press",
    subtitle: "Upper Chest Bias",
    primaryLabel: "Clavicular Pectoralis Major",
    cues: ["30-45° bench angle", "Touch bar to upper clavicular notch", "Press upward without shoulder rounding"],
    body: `<circle cx="320" cy="260" r="26" fill="#334155" stroke="#475569" stroke-width="2"/>
           <path d="M 330 280 L 430 380 L 370 420 L 280 310 Z"/>
           <line x1="240" y1="200" x2="400" y2="200" stroke="#64748b" stroke-width="14" stroke-linecap="round"/>`,
    synergists: `<circle cx="310" cy="290" r="16" fill="url(#synergist-grad)"/>`,
    targets: `<path d="M 320 290 Q 380 320 360 370 Q 320 340 310 300 Z" fill="url(#primary-grad)" stroke="#7dd3fc" stroke-width="2"/>`
  },

  // Push-Up
  'push_up.svg': {
    title: "Push-Up (Standard Pronated)",
    subtitle: "Horizontal Push",
    primaryLabel: "Pectoralis Major & Triceps",
    cues: ["45° elbow tuck like an arrow", "Rigid head-to-heel plank", "Full protraction at top"],
    body: `<circle cx="200" cy="380" r="24" fill="#334155" stroke="#475569" stroke-width="2"/>
           <path d="M 220 390 L 520 460 L 510 500 L 220 440 Z"/>`,
    synergists: `<circle cx="230" cy="400" r="16" fill="url(#synergist-grad)"/>`,
    targets: `<path d="M 230 400 Q 300 420 340 440 Q 280 430 230 415 Z" fill="url(#primary-grad)" stroke="#7dd3fc" stroke-width="2"/>`
  }
};

for (const [filename, d] of Object.entries(diagrams)) {
  const svgContent = createSvg(d.title, d.subtitle, d.primaryLabel, d.cues, d.targets, d.synergists, d.body);
  fs.writeFileSync(path.join(publicAnatomyDir, filename), svgContent, 'utf8');
  console.log('Created: ' + filename);
}
console.log('Done generating SVG diagrams.');
