const fs = require('fs');
const path = require('path');

const content = `---
name: anatomy-diagram-review
description: >-
  Systematically review, validate, and approve each kinesiology anatomy diagram
  one-by-one. Presents each movement with options to Approve or Regenerate.
  Strictly blocks production deployment until every single diagram in the library
  has been validated and approved.
---

# Anatomy Diagram 1-by-1 Review & Approval Skill

Use this skill whenever reviewing, auditing, or generating anatomical illustrations for exercises and stretches.

---

## 🛑 Golden Policy: Mandatory Deploy Blocking
> [!CRITICAL]
> **NEVER DEPLOY TO PRODUCTION UNTIL EVERY SINGLE MOVEMENT IN THE LIBRARY (ALL 51 ITEMS) IS EXPLICITLY APPROVED BY THE USER.**
> If even a single diagram is pending, unapproved, or flagged for regeneration, production deployment is strictly forbidden.

---

## Workflow: Step-by-Step Inspection Loop

For each exercise and stretch in \`INITIAL_UNIFIED_EXERCISES\`:

### 1. Present the Movement
Display an interactive preview card with:
1. **Movement Name & Type** (e.g., \`Chest Doorway Stretch\` · \`STRETCH\`)
2. **Current Visual Asset**: Embed the visual render (\`![Diagram Preview](/anatomy/{normalizedName}.jpg)\`)
3. **Primary Agonist**: Electric cyan highlight (\`#38bdf8\`)
4. **Synergists**: Warm amber highlight (\`#f59e0b\`)
5. **Kinesiology Coaching Cue**: Accurate biomechanical form description.
6. **Approval Status**: \`⏱ PENDING APPROVAL\` vs \`✓ APPROVED\`

### 2. Prompt the User for Decision
Provide clear user choices:
- **Option 1: [APPROVE]** -> Mark diagram as validated, persist status APPROVED, and proceed to next item.
- **Option 2: [REGENERATE]** -> Dispatch high-detail prompt to generative engine for a fresh 3D medical octane render, replace the asset, and re-present for review.

### 3. Maintain Progress Ledger
Keep a persistent record of the approval state:
\`\`\`
Total Movements: 51
Approved: [X] / 51
Pending: [Y] / 51
\`\`\`

### 4. Final Deployment Gate
Only when \`Approved == 51 / 51\`:
1. Run \`npm run test\` (asserting 0 duplicate URLs and 100% valid XML/image assets).
2. Run \`npm run build\` (asserting 0 TypeScript and bundling errors).
3. Commit and deploy to \`main\` with production deployment policy.
`;

const projectSkillPath = path.join(__dirname, '..', '.agents', 'skills', 'anatomy-diagram-review', 'SKILL.md');
const globalSkillPath = path.join('C:', 'Users', 'Collin', '.gemini', 'antigravity', 'skills', 'anatomy-diagram-review', 'SKILL.md');

[projectSkillPath, globalSkillPath].forEach(p => {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, content, 'utf8');
  console.log('Successfully wrote skill at:', p);
});
