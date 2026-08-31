export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkRateLimit, RATE_LIMIT_PRESETS } from "@/lib/rateLimit";
import { sanitizeText } from "@/lib/sanitize";
import { normalizeExerciseName, INITIAL_UNIFIED_EXERCISES } from "@/lib/unifiedExerciseLibrary";

export async function POST(req: NextRequest) {
  try {
    const rateCheck = checkRateLimit(req, RATE_LIMIT_PRESETS.AI);
    if (rateCheck.limited && rateCheck.response) return rateCheck.response;

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const exerciseName = sanitizeText(body.name || body.exerciseName || "Custom Movement", 120);
    const muscleGroup = sanitizeText(body.muscleGroup || "Chest", 50);
    const equipment = sanitizeText(body.equipment || "Bodyweight", 50);
    const movementType = sanitizeText(body.type || (muscleGroup === "Stretching" ? "STRETCH" : "EXERCISE"), 20);
    const variant = Number(body.variant || 0);

    const norm = normalizeExerciseName(exerciseName);

    // 1. Check if there is an exact match in initial unified library definitions
    const existingLibMatch = INITIAL_UNIFIED_EXERCISES.find(
      (ex) => ex.normalizedName === norm || ex.name.toLowerCase() === exerciseName.toLowerCase()
    );

    // Kinesiological Intelligence: Determine primary muscles, secondary synergists, cues, and best diagram reference
    let primaryMuscles: string[] = existingLibMatch?.primaryMuscles || [];
    let secondaryMuscles: string[] = existingLibMatch?.secondaryMuscles || [];
    let biomechanicsCue = existingLibMatch?.biomechanicsCue || "";
    let steps: string[] = existingLibMatch?.steps || [];
    let commonMistakes: string[] = existingLibMatch?.commonMistakes || [];
    let breathingPattern = existingLibMatch?.breathingPattern || "";
    let diagramUrl = existingLibMatch?.diagramUrl || "/anatomy/squat.jpg";

    // Visual Variations Palette for Dynamic Regeneration
    const stretchVisuals = [
      "/anatomy/pigeon.jpg",
      "/anatomy/couch_stretch.svg",
      "/anatomy/lat_stretch.svg",
      "/anatomy/childs_pose.svg",
      "/anatomy/neck_trap_stretch.svg",
      "/anatomy/foam_roll_thoracic.svg",
      "/anatomy/thread_the_needle.svg",
      "/anatomy/quad_stretch.svg",
      "/anatomy/frog_stretch.svg",
      "/anatomy/figure4_stretch.svg",
      "/anatomy/hip_90_90.svg",
      "/anatomy/hamstring_fold.svg",
      "/anatomy/butterfly_stretch.svg",
      "/anatomy/calf_stretch.svg",
      "/anatomy/shoulder_crossbody.svg",
      "/anatomy/sleeper_stretch.svg",
      "/anatomy/tricep_stretch.svg",
      "/anatomy/bicep_stretch.svg",
      "/anatomy/wrist_mobility.svg",
      "/anatomy/cobra_stretch.svg",
      "/anatomy/ql_stretch.svg",
      "/anatomy/supine_twist.svg",
      "/anatomy/worlds_greatest.svg",
    ];

    const exerciseVisuals = [
      "/anatomy/bench.jpg",
      "/anatomy/incline_bench.svg",
      "/anatomy/chest_dip.svg",
      "/anatomy/push_up.svg",
      "/anatomy/deadlift.jpg",
      "/anatomy/barbell_row.svg",
      "/anatomy/lat_pulldown.jpg",
      "/anatomy/pull_up.svg",
      "/anatomy/face_pull.svg",
      "/anatomy/squat.jpg",
      "/anatomy/bulgarian_split_squat.svg",
      "/anatomy/leg_extension.jpg",
      "/anatomy/leg_curl.jpg",
      "/anatomy/calf_raise.jpg",
      "/anatomy/hip_thrust.jpg",
      "/anatomy/rdl.jpg",
      "/anatomy/overhead_press.jpg",
      "/anatomy/lateral_raise.jpg",
      "/anatomy/bicep_curl.jpg",
      "/anatomy/hammer_curl.jpg",
      "/anatomy/tricep_pushdown.jpg",
      "/anatomy/plank.jpg",
      "/anatomy/back_hyperextension.svg",
      "/anatomy/ql_extension.svg",
    ];

    if (!existingLibMatch) {
      if (movementType === "STRETCH" || muscleGroup === "Stretching" || /stretch|mobility|pigeon|opening|fold|yoga/i.test(norm)) {
        if (/pigeon|piriformis|figure 4|outer hip|glute/i.test(norm)) {
          primaryMuscles = ["Piriformis", "Gluteus Medius", "Deep Hip External Rotators"];
          secondaryMuscles = ["Gluteus Maximus", "Psoas Major", "Tensor Fasciae Latae"];
          biomechanicsCue = "Square hips to the floor and breathe deeply into outer hip capsule without twisting lumbar spine.";
          diagramUrl = "/anatomy/pigeon.jpg";
        } else if (/couch|hip flexor|psoas|lunge/i.test(norm)) {
          primaryMuscles = ["Rectus Femoris", "Psoas Major", "Iliacus"];
          secondaryMuscles = ["Tensor Fasciae Latae", "Vastus Lateralis"];
          biomechanicsCue = "Rear knee against wall with shin vertical. Squeeze rear glute into posterior tilt.";
          diagramUrl = "/anatomy/couch_stretch.svg";
        } else if (/chest|pec|doorway|shoulder opener/i.test(norm)) {
          primaryMuscles = ["Pectoralis Major", "Pectoralis Minor"];
          secondaryMuscles = ["Anterior Deltoid", "Coracobrachialis", "Biceps Brachii"];
          biomechanicsCue = "Keep scapula depressed, rotate torso away gently until chest fibers lengthen.";
          diagramUrl = "/anatomy/chest_stretch.jpg";
        } else if (/lat|child|hang/i.test(norm)) {
          primaryMuscles = ["Latissimus Dorsi", "Teres Major"];
          secondaryMuscles = ["Thoracolumbar Fascia", "Intercostals"];
          biomechanicsCue = "Hinge hips back and reach diagonally across body to decompress lat fibers.";
          diagramUrl = "/anatomy/lat_stretch.svg";
        } else {
          primaryMuscles = ["Erector Spinae", "Thoracolumbar Fascia", "Hamstrings"];
          secondaryMuscles = ["Gluteus Maximus", "Latissimus Dorsi", "Core"];
          biomechanicsCue = "Flow with breath, maintaining length through the spine without forcing joint ranges.";
          diagramUrl = "/anatomy/cat_cow.jpg";
        }
        steps = [
          `Setup: Settle into starting position on mat with relaxed spine and neutral pelvis.`,
          `Movement: Breathe in deeply, then exhale to gently ease into the targeted stretch zone.`,
          `Hold: Maintain steady diaphragmatic breathing for 30-45 seconds without bouncing.`,
          `Release: Transition out of the stretch slowly and switch sides if unilateral.`,
        ];
        commonMistakes = [
          "Holding breath during deep stretch — breathe slowly through nose.",
          "Forcing painful joint ranges beyond muscular stretch threshold.",
        ];
        breathingPattern = "4-second deep nasal inhale → 6-second relaxing exhale, melting tension on each out-breath.";
      } else if (/dip|parallel bar/i.test(norm)) {
        primaryMuscles = ["Lower Pectoralis Major (Sternal Head)"];
        secondaryMuscles = ["Anterior Deltoid", "Triceps Brachii", "Rhomboids"];
        biomechanicsCue = "Lean torso 30° forward, flare elbows slightly out, and lower until shoulders pass elbows.";
        diagramUrl = "/anatomy/chest_dip.svg";
      } else if (/incline|upper chest/i.test(norm)) {
        primaryMuscles = ["Pectoralis Major (Clavicular 'Upper' Head)"];
        secondaryMuscles = ["Anterior Deltoid", "Triceps Brachii"];
        biomechanicsCue = "Set bench to 30-45°. Lower bar to upper clavicular notch without flaring elbows.";
        diagramUrl = "/anatomy/incline_bench.svg";
      } else if (/push-up|pushup/i.test(norm)) {
        primaryMuscles = ["Pectoralis Major", "Triceps Brachii"];
        secondaryMuscles = ["Anterior Deltoid", "Rectus Abdominis"];
        biomechanicsCue = "Rigid plank line from crown of head to heels. Tuck elbows 45° like an arrow.";
        diagramUrl = "/anatomy/push_up.svg";
      } else if (/pull-up|pullup|chin/i.test(norm)) {
        primaryMuscles = ["Latissimus Dorsi", "Teres Major"];
        secondaryMuscles = ["Biceps Brachii", "Rhomboids"];
        biomechanicsCue = "Full dead hang to chin over bar. Initiate by depressing scapulae before bending elbows.";
        diagramUrl = "/anatomy/pull_up.svg";
      } else if (/row/i.test(norm)) {
        primaryMuscles = ["Latissimus Dorsi", "Rhomboids", "Middle Trapezius"];
        secondaryMuscles = ["Posterior Deltoid", "Biceps Brachii"];
        biomechanicsCue = "45° torso hinge with flat spine. Drive elbows back into back pockets.";
        diagramUrl = "/anatomy/barbell_row.svg";
      } else if (/face pull/i.test(norm)) {
        primaryMuscles = ["Posterior Deltoids", "Infraspinatus", "Teres Minor"];
        secondaryMuscles = ["Middle/Lower Trapezius", "Rhomboids"];
        biomechanicsCue = "Pull rope toward bridge of nose while externally rotating thumbs back.";
        diagramUrl = "/anatomy/face_pull.svg";
      } else if (/bench|press/i.test(norm)) {
        primaryMuscles = ["Pectoralis Major"];
        secondaryMuscles = ["Anterior Deltoid", "Triceps Brachii"];
        biomechanicsCue = "Retract scapulae, maintain 45° elbow tuck, and squeeze chest at apex of press.";
        diagramUrl = "/anatomy/bench.jpg";
      } else {
        primaryMuscles = ["Quadriceps Femoris", "Gluteus Maximus"];
        secondaryMuscles = ["Hamstrings", "Core"];
        biomechanicsCue = "Keep torso upright, push through full foot, and drive knees in line with toes.";
        diagramUrl = "/anatomy/squat.jpg";
      }
    }

    // If variant is requested to cycle through alternative visual renderings:
    if (variant > 0) {
      const palette = (movementType === "STRETCH" || muscleGroup === "Stretching") ? stretchVisuals : exerciseVisuals;
      diagramUrl = palette[variant % palette.length];
    }

    const generatedData = {
      name: exerciseName,
      normalizedName: norm,
      type: movementType,
      muscleGroup,
      equipment,
      category: movementType === "STRETCH" ? "STATIC_STRETCH" : "STRENGTH",
      primaryMuscles,
      secondaryMuscles,
      biomechanicsCue,
      steps,
      commonMistakes,
      breathingPattern,
      diagramUrl,
      diagramStatus: "PENDING_APPROVAL",
      createdByUserRole: session.user.role || "TRAINER",
      createdByUserId: session.user.id,
      isCustom: true,
      variant,
    };

    return NextResponse.json({
      success: true,
      data: generatedData,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to generate anatomy guide" }, { status: 500 });
  }
}
