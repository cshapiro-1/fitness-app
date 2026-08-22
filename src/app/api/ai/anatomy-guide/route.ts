export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkRateLimit, RATE_LIMIT_PRESETS } from "@/lib/rateLimit";
import { sanitizeText } from "@/lib/sanitize";

export interface AnatomyGuideData {
  image: string;
  title: string;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  biomechanicsCue: string;
  steps: string[];
  commonMistakes: string[];
  breathingPattern: string;
}

// Map of known movements to high-res 3D anatomical charts with how-to steps
const ANATOMY_CHARTS: Record<string, AnatomyGuideData> = {
  squat: {
    image: "/anatomy/squat.jpg",
    title: "Barbell Back Squat",
    primaryMuscles: ["Quadriceps Femoris (Rectus Femoris, Vastus Lateralis/Medialis)", "Gluteus Maximus"],
    secondaryMuscles: ["Hamstring Complex", "Adductor Magnus", "Erector Spinae", "Soleus"],
    biomechanicsCue: "Keep bar directly over mid-foot throughout descent. Drive knees outward over toes and maintain 360° intra-abdominal pressure.",
    steps: [
      "Set Up: Rest bar across upper traps (high bar) or rear deltoids (low bar). Feet shoulder-width apart, toes flared 15–30°.",
      "Brace: Inhale deep into your diaphragm, expand 360° against your belt, and lock your lats down.",
      "Descent: Unlock hips and knees simultaneously. Push knees outward in line with toes, descending until hip crease is below knee level.",
      "Ascent: Drive the floor away through mid-foot, keeping chest proud and spine neutral to lockout.",
    ],
    commonMistakes: [
      "Knee Valgus (knees caving inward on ascent) — actively spread the floor with your feet.",
      "Heels lifting off floor — shift weight slightly toward mid-foot and improve ankle dorsiflexion.",
      "Butt wink / lumbar flexion at bottom — maintain active abdominal brace and stop just before pelvis tucks.",
    ],
    breathingPattern: "Inhale & brace at the top → Hold breath through descent and out of the hole → Exhale past sticking point at lockout.",
  },
  bench: {
    image: "/anatomy/bench.jpg",
    title: "Barbell Bench Press",
    primaryMuscles: ["Pectoralis Major (Sternal & Clavicular Heads)", "Anterior Deltoids"],
    secondaryMuscles: ["Triceps Brachii (Lateral & Long Heads)", "Serratus Anterior", "Latissimus Dorsi"],
    biomechanicsCue: "Retract and depress scapulae into bench padding. Maintain 45° elbow angle relative to torso and touch lower-mid sternum.",
    steps: [
      "Set Up: Lie on bench with eyes directly under bar. Pinch shoulder blades together into the padding and plant feet flat on floor.",
      "Grip & Unrack: Grip bar slightly wider than shoulder width. Straighten arms to bring bar over shoulder joints.",
      "Descent: Lower bar in a slight diagonal trajectory to touch lower-mid sternum (nipple line) with elbows tucked at 45–60°.",
      "Press: Drive legs into floor and push bar upwards and slightly back over shoulder joints to full lockout.",
    ],
    commonMistakes: [
      "Flaring elbows at 90° — puts excessive strain on rotator cuffs; keep elbows tucked at ~45°.",
      "Bouncing bar off the rib cage — pause for 0.5s on the chest under control.",
      "Lifting buttocks off the bench — keep glutes glued to the bench throughout leg drive.",
    ],
    breathingPattern: "Inhale at the top → Lower under control with full chest expansion → Exhale forcefully as you press past mid-range.",
  },
  deadlift: {
    image: "/anatomy/deadlift.jpg",
    title: "Conventional Deadlift",
    primaryMuscles: ["Gluteus Maximus", "Hamstrings (Biceps Femoris)", "Latissimus Dorsi"],
    secondaryMuscles: ["Erector Spinae", "Trapezius", "Forearm Flexors", "Quadriceps"],
    biomechanicsCue: "Hinge at hips with bar touching shins. Engage lats to lock upper back, push the floor away through mid-foot.",
    steps: [
      "Set Up: Stand with feet hip-width apart, bar over mid-foot (1 inch from shins).",
      "Grip & Wedge: Hinge down without moving the bar. Grip just outside knees, pull chest tall, and wedge hips down until shins touch the bar.",
      "Pull Slack: Pull tension out of the bar until you hear the 'click' of the plates against the sleeve.",
      "Drive & Lock: Push the floor away with your legs like a leg press. Once bar passes knees, drive hips forward to stand upright.",
    ],
    commonMistakes: [
      "Rounding the lower back — pull shoulders back, engage lats ('protect your armpits'), and brace hard.",
      "Bar drifting forward away from shins — keep bar glued against legs throughout the entire pull.",
      "Hyperextending spine at lockout — finish tall by squeezing glutes, do not lean back excessively.",
    ],
    breathingPattern: "Take huge diaphragmatic breath at the bottom setup → Lock brace → Push floor → Exhale at top lockout.",
  },
  press: {
    image: "/anatomy/overhead_press.jpg",
    title: "Overhead Barbell Press",
    primaryMuscles: ["Anterior Deltoids", "Lateral Deltoids", "Triceps Brachii"],
    secondaryMuscles: ["Upper Trapezius", "Serratus Anterior", "Upper Pectoralis", "Core Stabilizers"],
    biomechanicsCue: "Squeeze glutes and brace core. Press straight up in vertical trajectory, pushing head through the window at lockout.",
    steps: [
      "Set Up: Bar on anterior deltoids and upper chest. Grip just outside shoulders with vertical forearms.",
      "Brace: Squeeze glutes, flex quads, and brace abdominals to create an immovable base.",
      "Press: Pull head back slightly to clear chin, press bar vertically close to face.",
      "Lockout: Once bar clears forehead, push head forward through arms and shrug traps slightly upward to lock out over mid-foot.",
    ],
    commonMistakes: [
      "Excessive lumbar arching — keep glutes clenched like a plank throughout the rep.",
      "Pressing bar forward in an arc — press strictly vertical in a plumb line.",
      "Elbows dropping behind the bar — keep elbows slightly in front of the bar at bottom position.",
    ],
    breathingPattern: "Inhale at chest position → Press upward → Exhale at top lockout → Inhale quickly as bar descends.",
  },
  pigeon: {
    image: "/anatomy/pigeon.jpg",
    title: "Pigeon Pose Hip Stretch",
    primaryMuscles: ["Deep Piriformis", "Gluteus Medius & Minimus", "Tensor Fasciae Latae (TFL)"],
    secondaryMuscles: ["Contralateral Iliopsoas", "Rectus Femoris", "Gemelli & Obturators"],
    biomechanicsCue: "Keep hips squared forward without tilting. Exhale deeply to release tension in the outer glute and piriformis.",
    steps: [
      "Set Up: From hands and knees or downward dog, bring right knee forward behind right wrist, right ankle angled behind left wrist.",
      "Square Hips: Slide left leg straight back on top of foot. Ensure both hip points point squarely forward.",
      "Hinge Forward: Walk hands forward and lower torso onto forearms or a yoga block.",
      "Hold & Breathe: Relax shoulders, take 5–8 slow deep breaths (45–60s hold), then gently switch sides.",
    ],
    commonMistakes: [
      "Rolling onto outer glute — keep pelvis level and place a foam block under hip if needed.",
      "Twisting the knee — angle shin closer to pelvis if lateral knee discomfort is felt.",
      "Holding breath — use slow 4-second exhalations to signal the nervous system to release muscle guarding.",
    ],
    breathingPattern: "Inhale for 4 seconds expanding ribcage → Exhale for 6 seconds sinking deeper into hip flexion.",
  },
  chest_stretch: {
    image: "/anatomy/chest_stretch.jpg",
    title: "Doorway Pec & Anterior Shoulder Stretch",
    primaryMuscles: ["Pectoralis Major (Sternal & Clavicular fibers)", "Anterior Deltoid"],
    secondaryMuscles: ["Biceps Brachii Tendon", "Pectoralis Minor", "Coracobrachialis"],
    biomechanicsCue: "Forearm flat against wall or doorway at 90–120°. Step forward gently with front leg until deep anterior stretch is felt.",
    steps: [
      "Set Up: Stand in an open doorway. Place right forearm vertically against the doorframe at a 90° elbow angle.",
      "Step Forward: Take a gentle step forward with your right leg until you feel a firm stretch across chest and front shoulder.",
      "Rotate: Slightly rotate torso away from the doorframe to deepen the pectoral stretch.",
      "Hold: Maintain proud chest and neutral neck for 30–45 seconds per side.",
    ],
    commonMistakes: [
      "Shrugging shoulder up toward ear — keep shoulder blade depressed down and back.",
      "Arching lower back — keep ribcage pulled down and pelvis neutral.",
      "Aggressive overstretching — stretch should feel relieving, never sharp in the anterior shoulder joint.",
    ],
    breathingPattern: "Deep diaphragmatic nasal breathing; expand chest on inhale, relax into stretch on exhale.",
  },
  cat_cow: {
    image: "/anatomy/cat_cow.jpg",
    title: "Cat-Cow Dynamic Spine Mobility",
    primaryMuscles: ["Erector Spinae", "Latissimus Dorsi", "Rectus Abdominis"],
    secondaryMuscles: ["Trapezius", "Rhomboids", "Cervical & Lumbar Extensors"],
    biomechanicsCue: "Inhale to extend spine and lift chin; exhale to round thoracic spine toward ceiling while tucking tailbone.",
    steps: [
      "Set Up: Tabletop position on all fours. Wrists directly under shoulders, knees directly under hips.",
      "Cow (Inhale): Drop belly toward floor, lift chest and tailbone toward ceiling, look gently upward.",
      "Cat (Exhale): Press hands into floor, round entire spine upward like an angry cat, tuck chin and pelvis.",
      "Flow: Repeat smoothly for 8–10 continuous cycles matching breath with movement.",
    ],
    commonMistakes: [
      "Moving only from lower back — articulate through each individual cervical and thoracic vertebra.",
      "Bending elbows — keep arms straight so movement originates purely from spinal flexion and extension.",
      "Rushing repetitions — take 3–4 seconds per phase for maximum synovial joint lubrication.",
    ],
    breathingPattern: "Inhale completely during Cow extension → Exhale completely during Cat flexion.",
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
