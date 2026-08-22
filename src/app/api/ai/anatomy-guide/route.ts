export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkRateLimit, RATE_LIMIT_PRESETS } from "@/lib/rateLimit";
import { sanitizeText } from "@/lib/sanitize";

// Map of known movements to high-res 3D anatomical charts
const ANATOMY_CHARTS: Record<string, { image: string; title: string; primaryMuscles: string[]; secondaryMuscles: string[]; biomechanicsCue: string }> = {
  squat: {
    image: "/anatomy/squat.jpg",
    title: "Barbell Back Squat",
    primaryMuscles: ["Quadriceps Femoris (Rectus Femoris, Vastus Lateralis/Medialis)", "Gluteus Maximus"],
    secondaryMuscles: ["Hamstring Complex", "Adductor Magnus", "Erector Spinae", "Soleus"],
    biomechanicsCue: "Keep bar directly over mid-foot throughout descent. Drive knees outward over toes and maintain 360° intra-abdominal pressure.",
  },
  bench: {
    image: "/anatomy/bench.jpg",
    title: "Barbell Bench Press",
    primaryMuscles: ["Pectoralis Major (Sternal & Clavicular Heads)", "Anterior Deltoids"],
    secondaryMuscles: ["Triceps Brachii (Lateral & Long Heads)", "Serratus Anterior", "Latissimus Dorsi"],
    biomechanicsCue: "Retract and depress scapulae into bench padding. Maintain 45° elbow angle relative to torso and touch lower-mid sternum.",
  },
  deadlift: {
    image: "/anatomy/deadlift.jpg",
    title: "Conventional Deadlift",
    primaryMuscles: ["Gluteus Maximus", "Hamstrings (Biceps Femoris)", "Latissimus Dorsi"],
    secondaryMuscles: ["Erector Spinae", "Trapezius", "Forearm Flexors", "Quadriceps"],
    biomechanicsCue: "Hinge at hips with bar touching shins. Engage lats to lock upper back, push the floor away through mid-foot.",
  },
  press: {
    image: "/anatomy/overhead_press.jpg",
    title: "Overhead Barbell Press",
    primaryMuscles: ["Anterior Deltoids", "Lateral Deltoids", "Triceps Brachii"],
    secondaryMuscles: ["Upper Trapezius", "Serratus Anterior", "Upper Pectoralis", "Core Stabilizers"],
    biomechanicsCue: "Squeeze glutes and brace core. Press straight up in vertical trajectory, pushing head through the window at lockout.",
  },
  pigeon: {
    image: "/anatomy/pigeon.jpg",
    title: "Pigeon Pose Hip Stretch",
    primaryMuscles: ["Deep Piriformis", "Gluteus Medius & Minimus", "Tensor Fasciae Latae (TFL)"],
    secondaryMuscles: ["Contralateral Iliopsoas", "Rectus Femoris", "Gemelli & Obturators"],
    biomechanicsCue: "Keep hips squared forward without tilting. Exhale deeply to release tension in the outer glute and piriformis.",
  },
  chest_stretch: {
    image: "/anatomy/chest_stretch.jpg",
    title: "Doorway Pec & Anterior Shoulder Stretch",
    primaryMuscles: ["Pectoralis Major (Sternal & Clavicular fibers)", "Anterior Deltoid"],
    secondaryMuscles: ["Biceps Brachii Tendon", "Pectoralis Minor", "Coracobrachialis"],
    biomechanicsCue: "Forearm flat against wall or doorway at 90–120°. Step forward gently with front leg until deep anterior stretch is felt.",
  },
  cat_cow: {
    image: "/anatomy/cat_cow.jpg",
    title: "Cat-Cow Dynamic Spine Mobility",
    primaryMuscles: ["Erector Spinae", "Latissimus Dorsi", "Rectus Abdominis"],
    secondaryMuscles: ["Trapezius", "Rhomboids", "Cervical & Lumbar Extensors"],
    biomechanicsCue: "Inhale to extend spine and lift chin; exhale to round thoracic spine toward ceiling while tucking tailbone.",
  },
};

export async function POST(req: NextRequest) {
  try {
    const rateCheck = checkRateLimit(req, RATE_LIMIT_PRESETS.AI);
    if (rateCheck.limited && rateCheck.response) return rateCheck.response;

    const body = await req.json().catch(() => ({}));
    const exerciseName = sanitizeText(body.exerciseName || "Squat", 150);
    const norm = exerciseName.toLowerCase();

    // Match best anatomical visual chart
    let matchedKey = "squat";
    if (norm.includes("squat") || norm.includes("lunge") || norm.includes("leg press") || norm.includes("quad") || norm.includes("hack squat")) {
      matchedKey = "squat";
    } else if (norm.includes("bench") || norm.includes("push up") || norm.includes("chest press") || norm.includes("fly") || norm.includes("dip")) {
      matchedKey = "bench";
    } else if (norm.includes("pigeon") || norm.includes("glute stretch") || norm.includes("hip stretch") || norm.includes("figure 4") || norm.includes("piriformis")) {
      matchedKey = "pigeon";
    } else if (norm.includes("doorway") || norm.includes("pec stretch") || norm.includes("chest stretch") || norm.includes("wall slide")) {
      matchedKey = "chest_stretch";
    } else if (norm.includes("cat") || norm.includes("cow") || norm.includes("spine") || norm.includes("twist") || norm.includes("mobility") || norm.includes("warm") || norm.includes("cool")) {
      matchedKey = "cat_cow";
    } else if (norm.includes("deadlift") || norm.includes("pull up") || norm.includes("row") || norm.includes("pulldown") || norm.includes("shrug") || norm.includes("back extension") || norm.includes("lat ")) {
      matchedKey = "deadlift";
    } else if (norm.includes("press") || norm.includes("overhead") || norm.includes("shoulder") || norm.includes("lateral raise") || norm.includes("delt")) {
      matchedKey = "press";
    }

    const chart = ANATOMY_CHARTS[matchedKey] || ANATOMY_CHARTS.squat;

    return NextResponse.json({
      success: true,
      exerciseName,
      chart: {
        ...chart,
        queryName: exerciseName,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to retrieve anatomy visual guide" }, { status: 500 });
  }
}
