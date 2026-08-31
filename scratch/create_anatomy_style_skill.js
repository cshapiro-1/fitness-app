const fs = require('fs');
const path = require('path');

const skillContent = `---
name: anatomy-style-generator
description: >-
  Generates photorealistic 3D medical anatomy kinesiology diagrams for any new
  exercise or stretch (including trainer-submitted custom movements) strictly
  adhering to the STRKYR dark studio octane visual theme.
---

# STRKYR 3D Medical Anatomy Style Generator Skill

Use this skill whenever adding, generating, or updating diagrams for custom trainer-submitted exercises, new workouts, or mobility routines.

---

## 🎨 Mandatory Visual Design System

All anatomy diagrams across STRKYR MUST strictly adhere to this exact aesthetic standard:

| Visual Element | Specification | Hex / RGB Code |
|---|---|---|
| **Background** | Deep dark slate studio backdrop with subtle floor gradient | \`#090d16\` |
| **Primary Agonist** | Glowing electric cyan muscle fibers with striated detail | \`#38bdf8\` (Cyan-400) |
| **Synergists** | Warm amber glowing supporting muscle groups & tendons | \`#f59e0b\` (Amber-500) |
| **Non-Active Muscles** | Natural athletic muscle tone with clean volumetric shading | Dark anatomical tone |
| **Lighting** | Cinematic rim lighting with soft top keylight and edge highlights | 8K Octane 3D Render |
| **Aspect Ratio** | 1:1 Square (1024x1024 minimum, compressed JPEG ~500KB) | \`1:1\` |

---

## 🧠 Master Prompt Formula for New Movements

When generating a diagram with Gemini (\`nano-banana-pro-preview\`), Grok, or DALL-E 3, assemble the prompt using this exact structure:

\`\`\`
Ultra-detailed photorealistic 3D medical anatomy octane render of an athletic muscular human body performing {movementName} ({equipmentType}).
Biomechanics: {exactBiomechanicalPose} with {jointAnglesAndGrip}.
Environment: Dark slate studio background (#090d16) with cinematic rim lighting.
Muscle Highlights:
- Primary Target Muscles ({primaryAgonists}) glowing brightly in electric cyan (#38bdf8) with visible anatomical muscular striations.
- Synergist Muscles ({synergists}) glowing in warm amber (#f59e0b).
Style: Clean, hyper-detailed, photorealistic medical fitness anatomy octane 3D render, accurate kinesiology, 8k resolution.
\`\`\`

---

## 📋 Biomechanical Form Rules to Enforce

1. **Grip Integrity**:
   - **Hammer Curls**: Strictly neutral palms-facing-inward thumbs-up grip.
   - **Standard Bicep Curls / Chin-Ups**: Supinated palms-up grip.
   - **Overhand Rows / Pull-Ups**: Pronated palms-away grip.
2. **Torso & Spine Angle**:
   - **Plank / Push-Up**: Rigid neutral plank line from crown of head to heels.
   - **Incline Press**: 30° to 45° angle.
   - **Dips**: 30° forward torso lean for chest dips; upright for triceps dips.
3. **Yoga & Stretches**:
   - **Pigeon Pose**: Front knee bent on mat at 45-90°, rear leg extended flat behind.
   - **Couch Stretch**: Rear knee against wall with vertical spine and rear glute flexed.

---

## ⚙️ Automated Code & API Pipeline

When a trainer submits a custom exercise or a new movement is registered:

1. **Normalize Name**: Convert exercise name to \`snake_case\` (e.g., \`Bulgarian Split Squat\` -> \`bulgarian_split_squat\`).
2. **Generate Image**: Call \`POST /api/admin/anatomy/generate\` or execute generation script using \`nano-banana-pro-preview\`.
3. **Save Asset**: Write to \`public/anatomy/{normalizedName}.jpg\`.
4. **Register in Library**: Add movement definition into \`src/lib/unifiedExerciseLibrary.ts\` with \`diagramUrl: "/anatomy/{normalizedName}.jpg"\`.
5. **Auto-Heal Sync**: Run database seed/sync to persist across all trainer dashboards.
`;

const projectSkillPath = path.join(__dirname, '..', '.agents', 'skills', 'anatomy-style-generator', 'SKILL.md');
const globalSkillPath = path.join('C:', 'Users', 'Collin', '.gemini', 'antigravity', 'skills', 'anatomy-style-generator', 'SKILL.md');

[projectSkillPath, globalSkillPath].forEach(p => {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, skillContent, 'utf8');
  console.log('Skill written to:', p);
});
