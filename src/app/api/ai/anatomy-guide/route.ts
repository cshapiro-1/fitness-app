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

// Map of known movements to high-res 3D anatomical charts with precise kinesiology
const ANATOMY_CHARTS: Record<string, AnatomyGuideData> = {
  hammer_curl: {
    image: "/anatomy/hammer_curl.jpg",
    title: "Dumbbell Hammer Curl",
    primaryMuscles: ["Brachialis", "Brachioradialis", "Biceps Brachii (Long Head)"],
    secondaryMuscles: ["Pronator Teres", "Flexor Carpi Radialis", "Anterior Deltoid (isometric stabilizer)"],
    biomechanicsCue: "Maintain strict neutral grip (palms facing each other). Keep elbows pinned against your ribcage to isolate elbow flexion without anterior shoulder elevation.",
    steps: [
      "Set Up: Stand tall or sit upright with dumbbells at your sides, neutral grip (palms facing inwards towards thighs), shoulders depressed and retracted.",
      "Execution: Without moving your upper arms, flex the elbows to curl the dumbbells upward toward shoulder height.",
      "Peak Contraction: Squeeze the brachialis and brachioradialis hard at the top of the contraction for 1 count.",
      "Eccentric Lowering: Lower the weights under strict 2-3 second control until your arms are fully extended at the bottom.",
    ],
    commonMistakes: [
      "Swinging elbows forward / shoulder flexion — keep upper arms perpendicular to the floor.",
      "Leaning back or using hip momentum — reduce weight to keep tension strictly on the elbow flexors.",
      "Flaring elbows outward — keep elbows tucked tight to your flanks.",
    ],
    breathingPattern: "Exhale on elbow flexion as you curl up → Inhale during the controlled eccentric lowering.",
  },
  bicep_curl: {
    image: "/anatomy/bicep_curl.jpg",
    title: "Bicep Curl (Barbell / Dumbbell / Cable)",
    primaryMuscles: ["Biceps Brachii (Short Head & Long Head)", "Brachialis"],
    secondaryMuscles: ["Brachioradialis", "Forearm Flexor Complex", "Anterior Deltoid"],
    biomechanicsCue: "Supinate wrists actively as you curl upward. Keep elbows stationary beside your torso to maximize peak tension on both heads of the biceps.",
    steps: [
      "Set Up: Hold barbell or dumbbells with an underhand (supinated) grip, shoulder-width apart.",
      "Lift: Contract your biceps to curl the load toward upper chest while keeping upper arms glued to your sides.",
      "Peak: Flex and squeeze biceps forcefully at top of range without letting elbows drift forward.",
      "Lower: Slowly descend the weight over 3 seconds to full extension, flexing triceps at the bottom.",
    ],
    commonMistakes: [
      "Letting elbows rise forward into shoulder flexion, taking tension off the biceps.",
      "Shortening the bottom range — always achieve full elbow extension for maximum muscle stretch.",
      "Wrist curl compensation — keep wrists neutral and rigid throughout the pull.",
    ],
    breathingPattern: "Inhale at the bottom → Exhale forcefully on the curl → Inhale as you lower.",
  },
  tricep_pushdown: {
    image: "/anatomy/tricep_pushdown.jpg",
    title: "Tricep Pushdown & Extensions",
    primaryMuscles: ["Triceps Brachii (Lateral Head, Long Head, Medial Head)"],
    secondaryMuscles: ["Anconeus", "Pectoralis Major (deep stabilizer)", "Wrist Extensors"],
    biomechanicsCue: "Hinge slightly at hips. Lock elbows firmly at your side flanks, using pure elbow extension to drive the load down without shoulder movement.",
    steps: [
      "Set Up: Attach straight bar or rope to high cable. Grasp with overhand/neutral grip, elbows bent at 90° against ribs.",
      "Extension: Contract triceps to drive the attachment downward until elbows are locked out completely.",
      "Spreading (Rope): If using rope, flare the ends outward slightly at full extension to peak the lateral head.",
      "Return: Resist the cable upward under control until forearms reach parallel (90° elbow flexion).",
    ],
    commonMistakes: [
      "Letting elbows drift forward and backward like a pendulum — pin them strictly in place.",
      "Rounding the upper back — keep chest proud and scapulae set down and back.",
      "Stopping short of full lockout — triceps achieve maximum recruitment at the terminal extension point.",
    ],
    breathingPattern: "Inhale as cable rises → Exhale forcefully as you lock out triceps at the bottom.",
  },
  lateral_raise: {
    image: "/anatomy/lateral_raise.jpg",
    title: "Dumbbell & Cable Lateral Raise",
    primaryMuscles: ["Lateral Deltoid (Middle Deltoid)"],
    secondaryMuscles: ["Supraspinatus", "Anterior Deltoid", "Upper Trapezius", "Serratus Anterior"],
    biomechanicsCue: "Raise arms in the scapular plane (~15–30° forward of torso). Lead with your elbows and maintain a slight forward torso lean to isolate side delts.",
    steps: [
      "Set Up: Stand with feet hip-width apart, holding dumbbells with slight forward torso pitch (10–15°).",
      "Raise: Sweep weights outward and upward in a wide arc, leading with elbows rather than wrists.",
      "Apex: Stop at parallel (shoulder height). Keep thumbs slightly lower than pinkies or neutral.",
      "Descent: Lower weights slowly over 2-3 seconds, stopping just before weights touch thighs to maintain constant tension.",
    ],
    commonMistakes: [
      "Shrugging traps to initiate movement — depress shoulder blades before beginning the raise.",
      "Raising higher than shoulder level — causes excessive upper trap recruitment and subacromial impingement.",
      "Using torso momentum/swinging — pause briefly at the bottom of every rep.",
    ],
    breathingPattern: "Inhale at bottom → Exhale as arms reach shoulder height → Inhale on controlled descent.",
  },
  lat_pulldown: {
    image: "/anatomy/lat_pulldown.jpg",
    title: "Lat Pulldown & Pull-Up",
    primaryMuscles: ["Latissimus Dorsi", "Teres Major"],
    secondaryMuscles: ["Biceps Brachii", "Brachialis", "Rhomboids", "Middle & Lower Trapezius", "Posterior Deltoid"],
    biomechanicsCue: "Initiate pull by depressing shoulder blades down away from ears. Drive elbows down and back toward your hip pockets.",
    steps: [
      "Set Up: Grip wide bar just outside shoulder width with palms forward. Sit tall with thighs locked securely under pads.",
      "Scapular Pull: Depress scapulae downward before bending elbows.",
      "Pull: Drive elbows straight down, pulling bar to upper clavicle/nipple level while keeping chest lifted toward the bar.",
      "Return: Extend arms smoothly back up to a full dead-hang stretch at the top without shrugging shoulders up.",
    ],
    commonMistakes: [
      "Pulling behind the neck — causes severe rotator cuff and cervical spine stress.",
      "Excessive backward lean (>30°) turning the movement into a row.",
      "Rounding upper back at bottom — keep thoracic spine extended and proud.",
    ],
    breathingPattern: "Inhale during top overhead stretch → Exhale as you pull bar down to upper chest.",
  },
  barbell_row: {
    image: "/anatomy/lat_pulldown.jpg",
    title: "Bent-Over Barbell & Dumbbell Row",
    primaryMuscles: ["Latissimus Dorsi", "Rhomboids", "Middle & Lower Trapezius", "Posterior Deltoids"],
    secondaryMuscles: ["Erector Spinae", "Biceps Brachii", "Brachialis", "Forearm Flexors", "Hamstrings (isometric)"],
    biomechanicsCue: "Hinge at hips to a 45–60° torso angle. Pull bar toward lower ribcage / belly button while driving elbows past the torso.",
    steps: [
      "Set Up: Stand with feet hip-width, grip bar slightly wider than knees. Hinge hips back with a flat neutral spine.",
      "Pull: Row the bar smoothly toward lower sternum/umbilicus, pinching shoulder blades together at apex.",
      "Hold: Squeeze the mid-back musculature for 1 count.",
      "Descent: Lower bar under control until arms are fully extended and lats are stretched.",
    ],
    commonMistakes: [
      "Rounding lumbar spine — maintain stiff abdominal brace and hip hinge throughout.",
      "Jerking torso upright to heave the weight — keep torso angle constant.",
      "Pulling to upper chest instead of lower belly — flares elbows and shifts tension away from lats.",
    ],
    breathingPattern: "Inhale at the bottom stretch → Exhale forcefully on the row contraction.",
  },
  rdl: {
    image: "/anatomy/rdl.jpg",
    title: "Romanian Deadlift (RDL)",
    primaryMuscles: ["Hamstrings (Biceps Femoris, Semitendinosus, Semimembranosus)", "Gluteus Maximus"],
    secondaryMuscles: ["Erector Spinae", "Adductor Magnus", "Latissimus Dorsi (bracing)", "Forearm Flexors"],
    biomechanicsCue: "Maintain soft knees (15° bend). Drive hips backward like closing a car door with your butt until deep hamstring stretch is felt.",
    steps: [
      "Set Up: Stand tall with bar or dumbbells against thighs, feet hip-width apart, lats engaged.",
      "Hinge: Keeping shins vertical, push hips backward and slide the load down close along the thighs.",
      "Depth: Stop once hips cannot travel further backward (typically just below knees) with a flat spine.",
      "Drive: Squeeze glutes and hamstrings to drive hips forward back into an upright standing position.",
    ],
    commonMistakes: [
      "Squatting down / bending knees excessively — keeps tension off hamstrings.",
      "Letting bar drift away from shins — keep bar sliding directly against legs.",
      "Rounding lower back at the bottom of the stretch.",
    ],
    breathingPattern: "Inhale & brace at the top → Hold breath through descent → Exhale as you drive hips forward to lockout.",
  },
  hip_thrust: {
    image: "/anatomy/hip_thrust.jpg",
    title: "Barbell & Dumbbell Hip Thrust",
    primaryMuscles: ["Gluteus Maximus (Upper & Lower Fibers)"],
    secondaryMuscles: ["Hamstring Complex", "Quadriceps", "Adductor Magnus", "Erector Spinae"],
    biomechanicsCue: "Rest lower edge of shoulder blades across bench edge. Keep chin tucked and achieve full posterior pelvic tilt at top lockout.",
    steps: [
      "Set Up: Sit on floor with upper back against bench edge, padded barbell resting across hip crease. Feet flat, shoulder-width.",
      "Drive: Drive through heels, lifting hips toward ceiling until thighs and torso form a straight horizontal table.",
      "Lockout: Squeeze glutes maximally at the top, ensuring knees are at 90° and shins are vertical.",
      "Lower: Hinge hips down under control to hover just above floor before the next rep.",
    ],
    commonMistakes: [
      "Hyperextending lumbar spine at top — tuck chin toward chest to lock pelvis in posterior tilt.",
      "Feet too far forward (causes hamstring cramping) or too far back (causes knee stress).",
      "Failing to reach full hip extension at top.",
    ],
    breathingPattern: "Inhale at the bottom → Exhale forcefully as you drive hips up to parallel lockout.",
  },
  plank: {
    image: "/anatomy/plank.jpg",
    title: "Plank & Core Anti-Extension",
    primaryMuscles: ["Rectus Abdominis", "Transverse Abdominis", "Internal & External Obliques"],
    secondaryMuscles: ["Serratus Anterior", "Gluteal Complex", "Quadriceps", "Erector Spinae"],
    biomechanicsCue: "Tuck pelvis into posterior tilt. Pull elbows towards toes isometrically to create active 360° abdominal tension.",
    steps: [
      "Set Up: Place forearms on floor with elbows directly under shoulders, legs extended back on toes.",
      "Brace: Squeeze glutes together, tighten quads, and draw belly button in toward spine.",
      "Hold: Maintain rigid, unwavering straight line from crown of head to heels for target duration.",
    ],
    commonMistakes: [
      "Sagging hips / lumbar hyperextension — puts shearing force on lower back.",
      "Piking hips up toward ceiling — reduces abdominal recruitment.",
      "Holding breath — practice steady rhythmic diaphragmatic breathing.",
    ],
    breathingPattern: "Short, controlled shallow breaths maintaining tight abdominal brace.",
  },
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

    // Exhaustive movement categorization across all 170+ exercise library entries & custom variations
    let matchedKey: string | null = null;

    // 1. Stretches & Mobility (Highest specificity)
    if (
      norm.includes("pigeon") ||
      norm.includes("hip flexor") ||
      norm.includes("couch stretch") ||
      norm.includes("figure 4") ||
      norm.includes("piriformis") ||
      norm.includes("hip opener")
    ) {
      matchedKey = "pigeon";
    } else if (
      norm.includes("doorway") ||
      norm.includes("pec stretch") ||
      norm.includes("chest stretch") ||
      norm.includes("dislocate") ||
      norm.includes("wall slide")
    ) {
      matchedKey = "chest_stretch";
    } else if (
      norm.includes("cat") ||
      norm.includes("cow") ||
      norm.includes("spine") ||
      norm.includes("foam roll") ||
      norm.includes("mobility") ||
      norm.includes("warmup") ||
      norm.includes("warm-up") ||
      norm.includes("warm") ||
      norm.includes("cool") ||
      norm.includes("recovery") ||
      norm.includes("rest") ||
      norm.includes("sleep") ||
      norm.includes("breathwork") ||
      norm.includes("sauna")
    ) {
      matchedKey = "cat_cow";
    }
    // 2. Vertical Back Pulls (Lat Pulldowns, Pull-Ups, Chin-Ups, Straight Arm Pulldown)
    else if (
      norm.includes("pulldown") ||
      norm.includes("pull up") ||
      norm.includes("pull-up") ||
      norm.includes("chin up") ||
      norm.includes("chin-up") ||
      norm.includes("lat pull")
    ) {
      matchedKey = "lat_pulldown";
    }
    // 3. Hammer Curl & Forearm Curls
    else if (norm.includes("hammer") || norm.includes("reverse curl") || norm.includes("wrist") || norm.includes("farmer")) {
      matchedKey = "hammer_curl";
    }
    // 4. Biceps (Supinated, Preacher, Incline, Concentration, Cables)
    else if (
      norm.includes("bicep") ||
      norm.includes("preacher") ||
      norm.includes("concentration") ||
      (norm.includes("curl") && !norm.includes("leg") && !norm.includes("hamstring"))
    ) {
      matchedKey = "bicep_curl";
    }
    // 5. Triceps (Pushdowns, Extensions, Skull Crushers, Dips, Close-Grip Bench, Kickbacks)
    else if (
      norm.includes("tricep") ||
      norm.includes("pushdown") ||
      norm.includes("skull crusher") ||
      norm.includes("skullcrusher") ||
      norm.includes("close-grip") ||
      norm.includes("close grip") ||
      norm.includes("kickback") ||
      (norm.includes("extension") && (norm.includes("overhead") || norm.includes("arm") || norm.includes("cable") || norm.includes("dumbbell")))
    ) {
      matchedKey = "tricep_pushdown";
    }
    // 6. Lateral, Front, and Rear Deltoids (Side Raises, Upright Rows, Face Pulls, Rear Delt Flyes)
    else if (
      norm.includes("lateral raise") ||
      norm.includes("side raise") ||
      norm.includes("front raise") ||
      norm.includes("rear delt") ||
      norm.includes("face pull") ||
      norm.includes("facepull") ||
      norm.includes("upright row") ||
      norm.includes("reverse pec deck") ||
      norm.includes("deltoid fly")
    ) {
      matchedKey = "lateral_raise";
    }
    // 7. Horizontal Rows & Upper Back (Barbell Row, DB Row, T-Bar, Pendlay, Seated Cable Row, Shrugs, Inverted Row)
    else if (
      norm.includes("row") ||
      norm.includes("t-bar") ||
      norm.includes("pendlay") ||
      norm.includes("shrug") ||
      norm.includes("rhomboid")
    ) {
      matchedKey = "barbell_row";
    }
    // 8. Posterior Chain: Hamstrings & Hip Hinge (RDL, Stiff-Leg, Leg Curls, Nordic Curls, Good Mornings)
    else if (
      norm.includes("rdl") ||
      norm.includes("romanian") ||
      norm.includes("leg curl") ||
      norm.includes("hamstring") ||
      norm.includes("good morning") ||
      norm.includes("nordic") ||
      norm.includes("stiff leg")
    ) {
      matchedKey = "rdl";
    }
    // 9. Posterior Chain: Glute Dominant & Pelvic Extension (Hip Thrust, Glute Bridge, Kickbacks, Abductors)
    else if (
      norm.includes("hip thrust") ||
      norm.includes("glute bridge") ||
      norm.includes("kickback") ||
      norm.includes("abductor") ||
      norm.includes("glute")
    ) {
      matchedKey = "hip_thrust";
    }
    // 10. Chest & Horizontal Push (Bench Press, Incline Press, Decline Press, Dumbbell Press, Chest Flyes, Push-Ups, Dips, Pec Deck, Landmine Chest)
    else if (
      norm.includes("bench") ||
      norm.includes("push up") ||
      norm.includes("push-up") ||
      norm.includes("pushup") ||
      norm.includes("chest press") ||
      norm.includes("fly") ||
      norm.includes("crossover") ||
      norm.includes("dip") ||
      norm.includes("pec deck") ||
      norm.includes("landmine chest") ||
      norm.includes("chest")
    ) {
      matchedKey = "bench";
    }
    // 11. Shoulders & Vertical Push (Overhead Press, Military Press, DB Shoulder Press, Arnold Press, Push Press, Landmine Shoulder Press)
    else if (
      norm.includes("overhead") ||
      norm.includes("shoulder press") ||
      norm.includes("arnold press") ||
      norm.includes("military press") ||
      norm.includes("push press") ||
      norm.includes("ohp") ||
      norm.includes("shoulder")
    ) {
      matchedKey = "press";
    }
    // 12. Core & Abdominals (Plank, Side Plank, Leg Raises, Knee Raises, Ab Wheel, Woodchopper, Crunches, Russian Twists, Sit-Ups, Dead Bug, Pallof Press, Mountain Climbers, Hollow Body)
    else if (
      norm.includes("plank") ||
      norm.includes("ab") ||
      norm.includes("crunch") ||
      norm.includes("leg raise") ||
      norm.includes("knee raise") ||
      norm.includes("woodchopper") ||
      norm.includes("twist") ||
      norm.includes("sit-up") ||
      norm.includes("situp") ||
      norm.includes("rollout") ||
      norm.includes("hollow body") ||
      norm.includes("dead bug") ||
      norm.includes("deadbug") ||
      norm.includes("pallof") ||
      norm.includes("climber")
    ) {
      matchedKey = "plank";
    }
    // 13. Quads & Knee-Dominant Lower Body (Squat, Front Squat, Box Squat, Goblet Squat, Bulgarian Split Squat, Lunges, Leg Press, Hack Squat, Leg Extension, Calves, Step-Ups, Sled Push, Wall Sit)
    else if (
      norm.includes("squat") ||
      norm.includes("lunge") ||
      norm.includes("leg press") ||
      norm.includes("hack") ||
      norm.includes("step-up") ||
      norm.includes("step up") ||
      norm.includes("split squat") ||
      norm.includes("leg extension") ||
      norm.includes("calf") ||
      norm.includes("sled") ||
      norm.includes("prowler") ||
      norm.includes("wall sit")
    ) {
      matchedKey = "squat";
    }
    // 14. Explosive & Olympic Lifts / Full Body (Deadlift, Sumo Deadlift, Rack Pull, Power Clean, Clean & Jerk, Snatch, KB Swing, Turkish Get-Up, Burpee, Box Jump, Med Ball Slam, Cardio)
    else if (
      norm.includes("deadlift") ||
      norm.includes("rack pull") ||
      norm.includes("clean") ||
      norm.includes("snatch") ||
      norm.includes("swing") ||
      norm.includes("turkish") ||
      norm.includes("burpee") ||
      norm.includes("box jump") ||
      norm.includes("slam") ||
      norm.includes("jump") ||
      norm.includes("run") ||
      norm.includes("bike") ||
      norm.includes("rowing") ||
      norm.includes("stair") ||
      norm.includes("elliptical") ||
      norm.includes("swim")
    ) {
      matchedKey = "deadlift";
    }

    const chart = (matchedKey && ANATOMY_CHARTS[matchedKey]) || ANATOMY_CHARTS.squat;

    return NextResponse.json({
      success: true,
      exerciseName,
      chart: {
        ...chart,
        title: chart.title.includes(exerciseName) ? chart.title : `${exerciseName} — Visual Anatomy Guide`,
        queryName: exerciseName,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to retrieve anatomy visual guide" }, { status: 500 });
  }
}
