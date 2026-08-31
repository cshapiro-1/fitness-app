export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, RATE_LIMIT_PRESETS } from "@/lib/rateLimit";
import { sanitizeText } from "@/lib/sanitize";
import { normalizeExerciseName } from "@/lib/unifiedExerciseLibrary";

export async function POST(req: NextRequest) {
  try {
    const rateCheck = checkRateLimit(req, RATE_LIMIT_PRESETS.AI);
    if (rateCheck.limited && rateCheck.response) return rateCheck.response;

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const exerciseName = sanitizeText(body.name || body.exerciseName || "Custom Exercise", 120);
    const muscleGroup = sanitizeText(body.muscleGroup || "Chest", 50);
    const equipment = sanitizeText(body.equipment || "Bodyweight", 50);
    const movementType = sanitizeText(body.type || (muscleGroup === "Stretching" ? "STRETCH" : "EXERCISE"), 20);

    const norm = normalizeExerciseName(exerciseName);

    // Kinesiological Intelligence: Determine primary muscles, secondary synergists, cues, and best diagram reference
    let primaryMuscles: string[] = [];
    let secondaryMuscles: string[] = [];
    let biomechanicsCue = "";
    let steps: string[] = [];
    let commonMistakes: string[] = [];
    let breathingPattern = "";
    let diagramUrl = "/anatomy/squat.jpg";

    if (movementType === "STRETCH" || muscleGroup === "Stretching" || /stretch|mobility|pigeon|opening|fold|yoga/i.test(norm)) {
      if (/pigeon|piriformis|figure 4|outer hip|glute/i.test(norm)) {
        primaryMuscles = ["Piriformis", "Gluteus Medius", "Deep Hip External Rotators"];
        secondaryMuscles = ["Gluteus Maximus", "Psoas Major", "Tensor Fasciae Latae"];
        biomechanicsCue = "Square hips to the floor and breathe deeply into outer hip capsule without twisting lumbar spine.";
        diagramUrl = "/anatomy/pigeon.jpg";
      } else if (/chest|pec|doorway|shoulder opener/i.test(norm)) {
        primaryMuscles = ["Pectoralis Major", "Pectoralis Minor"];
        secondaryMuscles = ["Anterior Deltoid", "Coracobrachialis", "Biceps Brachii"];
        biomechanicsCue = "Keep scapula depressed, rotate torso away gently until chest fibers lengthen.";
        diagramUrl = "/anatomy/chest_stretch.jpg";
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
    } else if (/bench|chest press|push-up|pec/i.test(norm)) {
      primaryMuscles = ["Pectoralis Major (Sternal & Clavicular Heads)"];
      secondaryMuscles = ["Anterior Deltoid", "Triceps Brachii", "Serratus Anterior"];
      biomechanicsCue = "Retract scapulae, maintain 45° elbow tuck, and squeeze chest at apex of press.";
      steps = [
        `Setup: Position body with eyes under bar or dumbbells stacked over chest.`,
        `Descent: Lower resistance under 3-second control to lower chest.`,
        `Drive: Press weight smoothly back up while squeezing pecs.`,
      ];
      commonMistakes = ["Flaring elbows out at 90°", "Bouncing weight off ribcage"];
      breathingPattern = "Inhale on descent → Exhale past sticking point.";
      diagramUrl = "/anatomy/bench.jpg";
    } else if (/deadlift|rdl|hinge|good morning/i.test(norm)) {
      primaryMuscles = ["Gluteus Maximus", "Hamstrings", "Erector Spinae"];
      secondaryMuscles = ["Latissimus Dorsi", "Trapezius", "Forearms (Grip)"];
      biomechanicsCue = "Hinge back at hips, maintain neutral spine, and drive floor away through mid-foot.";
      steps = [
        `Setup: Stand with feet hip-width, weight centered over mid-foot.`,
        `Hinge: Push hips back while keeping spine flat and lats engaged.`,
        `Lockout: Contract glutes to stand tall without hyperextending lower back.`,
      ];
      commonMistakes = ["Rounding lower back", "Allowing bar to drift away from body"];
      breathingPattern = "Diaphragmatic inhale at start → Exhale on hip extension lockout.";
      diagramUrl = "/anatomy/deadlift.jpg";
    } else if (/row|pull|pulldown|chin|lat/i.test(norm)) {
      primaryMuscles = ["Latissimus Dorsi", "Rhomboids", "Middle Trapezius"];
      secondaryMuscles = ["Biceps Brachii", "Posterior Deltoid", "Brachialis"];
      biomechanicsCue = "Initiate pull by driving elbows down and back into back pockets with proud chest.";
      steps = [
        `Setup: Set strong base with shoulders packed down and back.`,
        `Pull: Drive elbows back, squeezing shoulder blades together at peak.`,
        `Control: Return slowly under full eccentric muscular stretch.`,
      ];
      commonMistakes = ["Using torso momentum to jerk weight", "Shrugging traps up to ears"];
      breathingPattern = "Inhale on stretch reach → Exhale on contraction pull.";
      diagramUrl = "/anatomy/barbell_row.jpg";
    } else if (/shoulder|press|overhead|ohp|arnold|lateral raise/i.test(norm)) {
      primaryMuscles = ["Deltoids (Anterior & Lateral Heads)"];
      secondaryMuscles = ["Triceps Brachii", "Upper Trapezius", "Serratus Anterior"];
      biomechanicsCue = "Brace core and press overhead in vertical bar path without leaning back.";
      steps = [
        `Setup: Stand tall with glutes clenched and core braced 360°.`,
        `Press: Push weight vertically over center of gravity.`,
        `Lower: Control back to shoulder level under tension.`,
      ];
      commonMistakes = ["Excessive arching of lower back", "Pressing weight too far forward"];
      breathingPattern = "Inhale at bottom → Exhale as weight presses overhead.";
      diagramUrl = "/anatomy/press.jpg";
    } else if (/curl|bicep|hammer/i.test(norm)) {
      primaryMuscles = ["Biceps Brachii", "Brachialis"];
      secondaryMuscles = ["Brachioradialis", "Forearm Flexors"];
      biomechanicsCue = "Pin elbows to ribcage and curl through full elbow flexion without swinging.";
      steps = [
        `Setup: Stand tall with elbows locked at sides.`,
        `Curl: Flex elbows, bringing resistance to shoulder height.`,
        `Lower: Lower slowly over 3 seconds to full extension.`,
      ];
      commonMistakes = ["Swinging hips to lift weight", "Letting elbows drift forward"];
      breathingPattern = "Inhale down → Exhale curling up.";
      diagramUrl = "/anatomy/bicep_curl.jpg";
    } else if (/tricep|pushdown|extension|dip/i.test(norm)) {
      primaryMuscles = ["Triceps Brachii (All Heads)"];
      secondaryMuscles = ["Anconeus", "Anterior Deltoid"];
      biomechanicsCue = "Keep upper arms stationary; extend elbows completely at lockout.";
      steps = [
        `Setup: Fix elbows in position relative to torso.`,
        `Extend: Push down/out until elbows lock out fully.`,
        `Return: Allow forearms to rise slowly under control.`,
      ];
      commonMistakes = ["Flaring elbows excessively", "Using shoulder momentum"];
      breathingPattern = "Inhale on bend → Exhale on extension lockout.";
      diagramUrl = "/anatomy/tricep_pushdown.jpg";
    } else {
      // Default Lower Body / Quad
      primaryMuscles = ["Quadriceps Femoris", "Gluteus Maximus"];
      secondaryMuscles = ["Hamstrings", "Adductors", "Calves", "Core"];
      biomechanicsCue = "Keep torso upright, push through full foot, and drive knees in line with toes.";
      steps = [
        `Setup: Set feet shoulder-width with toes slightly turned out.`,
        `Descent: Lower hips into deep squat while keeping chest proud.`,
        `Ascent: Drive through floor to return to standing lockout.`,
      ];
      commonMistakes = ["Knees collapsing inward", "Heels lifting off ground"];
      breathingPattern = "Inhale on descent → Exhale past sticking point.";
      diagramUrl = "/anatomy/squat.jpg";
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
    };

    return NextResponse.json({
      success: true,
      data: generatedData,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to generate anatomy guide" }, { status: 500 });
  }
}
