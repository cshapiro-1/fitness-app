export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sanitizeText } from "@/lib/sanitize";
import { normalizeExerciseName, INITIAL_UNIFIED_EXERCISES } from "@/lib/unifiedExerciseLibrary";

export async function POST(req: NextRequest) {
  try {
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

    // Category-specific visual pools for intelligent regeneration
    const chestVisuals = [
      "/anatomy/chest_dip.svg",
      "/anatomy/incline_bench.svg",
      "/anatomy/bench.jpg",
      "/anatomy/push_up.svg",
      "/anatomy/chest_stretch.jpg",
    ];

    const backVisuals = [
      "/anatomy/barbell_row.svg",
      "/anatomy/pull_up.svg",
      "/anatomy/lat_pulldown.jpg",
      "/anatomy/face_pull.svg",
      "/anatomy/lat_stretch.svg",
      "/anatomy/childs_pose.svg",
    ];

    const legVisuals = [
      "/anatomy/squat.jpg",
      "/anatomy/bulgarian_split_squat.svg",
      "/anatomy/leg_extension.jpg",
      "/anatomy/hip_thrust.jpg",
      "/anatomy/deadlift.jpg",
      "/anatomy/rdl.jpg",
      "/anatomy/leg_curl.jpg",
      "/anatomy/calf_raise.jpg",
      "/anatomy/hip_abduction.jpg",
      "/anatomy/couch_stretch.svg",
      "/anatomy/quad_stretch.svg",
      "/anatomy/hamstring_fold.svg",
    ];

    const shoulderVisuals = [
      "/anatomy/overhead_press.jpg",
      "/anatomy/lateral_raise.jpg",
      "/anatomy/face_pull.svg",
      "/anatomy/shoulder_crossbody.svg",
      "/anatomy/sleeper_stretch.svg",
      "/anatomy/neck_trap_stretch.svg",
    ];

    const armVisuals = [
      "/anatomy/bicep_curl.jpg",
      "/anatomy/hammer_curl.jpg",
      "/anatomy/tricep_pushdown.jpg",
      "/anatomy/tricep_stretch.svg",
      "/anatomy/bicep_stretch.svg",
      "/anatomy/wrist_mobility.svg",
    ];

    const coreVisuals = [
      "/anatomy/plank.jpg",
      "/anatomy/back_hyperextension.svg",
      "/anatomy/ql_extension.svg",
      "/anatomy/cobra_stretch.svg",
      "/anatomy/ql_stretch.svg",
      "/anatomy/supine_twist.svg",
    ];

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
      "/anatomy/cat_cow.jpg",
      "/anatomy/chest_stretch.jpg",
    ];

    // Select targeted palette based on muscle group and movement
    let targetPalette = stretchVisuals;
    if (movementType !== "STRETCH" && muscleGroup !== "Stretching") {
      if (/chest|pec|bench|dip|push/i.test(muscleGroup) || /chest|pec|bench|dip|push/i.test(norm)) {
        targetPalette = chestVisuals;
      } else if (/back|lat|row|pull|chin/i.test(muscleGroup) || /back|lat|row|pull|chin/i.test(norm)) {
        targetPalette = backVisuals;
      } else if (/leg|squat|quad|hamstring|glute|calf|thrust|deadlift/i.test(muscleGroup) || /leg|squat|quad|hamstring|glute|calf|thrust|deadlift/i.test(norm)) {
        targetPalette = legVisuals;
      } else if (/shoulder|delt|press|raise/i.test(muscleGroup) || /shoulder|delt|press|raise/i.test(norm)) {
        targetPalette = shoulderVisuals;
      } else if (/arm|bicep|tricep|curl|forearm/i.test(muscleGroup) || /arm|bicep|tricep|curl|forearm/i.test(norm)) {
        targetPalette = armVisuals;
      } else if (/core|abs|ab|oblique|ql|spine/i.test(muscleGroup) || /core|abs|ab|oblique|ql|spine/i.test(norm)) {
        targetPalette = coreVisuals;
      } else {
        targetPalette = legVisuals;
      }
    }

    // 1. Check if there is an exact match in initial unified library definitions
    const existingLibMatch = INITIAL_UNIFIED_EXERCISES.find(
      (ex) => ex.normalizedName === norm || ex.name.toLowerCase() === exerciseName.toLowerCase()
    );

    let primaryMuscles: string[] = existingLibMatch?.primaryMuscles || [];
    let secondaryMuscles: string[] = existingLibMatch?.secondaryMuscles || [];
    let biomechanicsCue = existingLibMatch?.biomechanicsCue || "";
    let steps: string[] = existingLibMatch?.steps || [];
    let commonMistakes: string[] = existingLibMatch?.commonMistakes || [];
    let breathingPattern = existingLibMatch?.breathingPattern || "";
    let diagramUrl = existingLibMatch?.diagramUrl || `/anatomy/${norm}.jpg`;

    if (!existingLibMatch) {
      if (movementType === "STRETCH" || muscleGroup === "Stretching" || /stretch|mobility|pigeon|piriformis|fold|opening/i.test(norm)) {
        if (/pigeon|piriformis|figure 4|outer hip|glute/i.test(norm)) {
          primaryMuscles = ["Piriformis", "Gluteus Medius", "Deep Hip External Rotators"];
          secondaryMuscles = ["Gluteus Maximus", "Psoas Major", "Tensor Fasciae Latae"];
          biomechanicsCue = "Square hips to the floor and breathe deeply into outer hip capsule without twisting lumbar spine.";
          diagramUrl = "/anatomy/pigeon.jpg";
        } else if (/couch|hip flexor|psoas|lunge/i.test(norm)) {
          primaryMuscles = ["Rectus Femoris", "Psoas Major", "Iliacus"];
          secondaryMuscles = ["Tensor Fasciae Latae", "Vastus Lateralis"];
          biomechanicsCue = "Rear knee against wall with shin vertical. Squeeze rear glute into posterior tilt.";
          diagramUrl = "/anatomy/couch_stretch.jpg";
        } else if (/chest|pec|doorway|shoulder opener/i.test(norm)) {
          primaryMuscles = ["Pectoralis Major", "Pectoralis Minor"];
          secondaryMuscles = ["Anterior Deltoid", "Coracobrachialis", "Biceps Brachii"];
          biomechanicsCue = "Keep scapula depressed, rotate torso away gently until chest fibers lengthen.";
          diagramUrl = "/anatomy/chest_doorway_stretch.svg";
        } else if (/lat|child|hang/i.test(norm)) {
          primaryMuscles = ["Latissimus Dorsi", "Teres Major"];
          secondaryMuscles = ["Thoracolumbar Fascia", "Intercostals"];
          biomechanicsCue = "Hinge hips back and reach diagonally across body to decompress lat fibers.";
          diagramUrl = "/anatomy/lat_stretch.svg";
        } else {
          primaryMuscles = ["Erector Spinae", "Thoracolumbar Fascia", "Hamstrings"];
          secondaryMuscles = ["Gluteus Maximus", "Latissimus Dorsi", "Core"];
          biomechanicsCue = "Flow with breath, maintaining length through the spine without forcing joint ranges.";
          diagramUrl = `/anatomy/${norm}.svg`;
        }
      } else if (/dip|parallel bar/i.test(norm)) {
        primaryMuscles = ["Lower Pectoralis Major (Sternal Head)"];
        secondaryMuscles = ["Anterior Deltoid", "Triceps Brachii", "Rhomboids"];
        biomechanicsCue = "Lean torso 30° forward, flare elbows slightly out, and lower until shoulders pass elbows.";
        diagramUrl = "/anatomy/chest_dip.jpg";
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
        diagramUrl = `/anatomy/${norm}.svg`;
      }
    }

    // Multi-Provider AI Image Generation: Grok (xAI), Google Imagen 3 (Nano Banana), or OpenAI (DALL-E 3)
    const xaiApiKey = process.env.XAI_API_KEY || process.env.GROK_API_KEY;
    const geminiApiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY;
    const openaiApiKey = process.env.OPENAI_API_KEY;

    const aiPrompt = `Medical 3D anatomical visualization of an athletic human body performing ${exerciseName}. Dark slate studio background (#090d16). Primary target muscles (${primaryMuscles.join(", ")}) highlighted with glowing electric cyan muscle fibers (#38bdf8). Synergist muscles (${secondaryMuscles.join(", ")}) glowing in warm amber (#f59e0b). Clean, hyper-detailed, photorealistic medical fitness anatomy octane 3D render, accurate biomechanics, cinematic lighting, 8k resolution.`;

    let generatedAiUrl: string | null = null;

    // 1. Try Grok (xAI Image API)
    if (xaiApiKey && !generatedAiUrl) {
      try {
        const grokRes = await fetch("https://api.x.ai/v1/images/generations", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${xaiApiKey}`,
          },
          body: JSON.stringify({
            model: "grok-2-image",
            prompt: aiPrompt,
            n: 1,
            size: "1024x1024",
          }),
        });

        if (grokRes.ok) {
          const grokJson = await grokRes.json();
          if (grokJson.data?.[0]?.url) {
            generatedAiUrl = grokJson.data[0].url;
          } else if (grokJson.data?.[0]?.b64_json) {
            generatedAiUrl = `data:image/jpeg;base64,${grokJson.data[0].b64_json}`;
          }
        }
      } catch (grokErr) {
        console.error("Grok image generation error:", grokErr);
      }
    }

    // 2. Try Google Imagen 3 ("Nano Banana" / Gemini)
    if (geminiApiKey && !generatedAiUrl) {
      try {
        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${geminiApiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              instances: [{ prompt: aiPrompt }],
              parameters: {
                sampleCount: 1,
                aspectRatio: "1:1",
                outputOptions: { mimeType: "image/jpeg" },
              },
            }),
          }
        );

        if (geminiRes.ok) {
          const geminiJson = await geminiRes.json();
          const b64 = geminiJson.predictions?.[0]?.bytesBase64Encoded;
          if (b64) {
            generatedAiUrl = `data:image/jpeg;base64,${b64}`;
          }
        }
      } catch (geminiErr) {
        console.error("Gemini Imagen image generation error:", geminiErr);
      }
    }

    // 3. Try OpenAI DALL-E 3
    if (openaiApiKey && !generatedAiUrl) {
      try {
        const aiResponse = await fetch("https://api.openai.com/v1/images/generations", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${openaiApiKey}`,
          },
          body: JSON.stringify({
            model: "dall-e-3",
            prompt: aiPrompt,
            n: 1,
            size: "1024x1024",
            quality: "standard",
          }),
        });

        if (aiResponse.ok) {
          const aiJson = await aiResponse.json();
          if (aiJson.data?.[0]?.url) {
            generatedAiUrl = aiJson.data[0].url;
          }
        }
      } catch (aiErr) {
        console.error("DALL-E generation error:", aiErr);
      }
    }

    if (generatedAiUrl) {
      diagramUrl = generatedAiUrl;
    }

    const generatedData = {
      name: exerciseName,
      normalizedName: norm,
      type: movementType,
      muscleGroup,
      equipment,
      category: movementType === "STRETCH" ? "STATIC_STRETCH" : "STRENGTH",
      primaryMuscles: primaryMuscles.length > 0 ? primaryMuscles : [muscleGroup],
      secondaryMuscles,
      biomechanicsCue: biomechanicsCue || "Maintain strict posture, align joints with line of force, and control the range of motion.",
      steps: steps.length > 0 ? steps : ["Execute with controlled tempo and full range of motion."],
      commonMistakes: commonMistakes.length > 0 ? commonMistakes : ["Using momentum or breaking neutral posture."],
      breathingPattern: breathingPattern || "Breathe rhythmically with eccentric and concentric phases.",
      diagramUrl,
      diagramStatus: "PENDING_APPROVAL",
      createdByUserRole: session.user.role || "ADMIN",
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
