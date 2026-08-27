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
  leg_extension: {
    image: "/anatomy/leg_extension.jpg",
    title: "Leg Extension (Quadriceps Isolation)",
    primaryMuscles: ["Quadriceps Femoris (Rectus Femoris, Vastus Lateralis, Vastus Medialis 'Teardrop', Vastus Intermedius)"],
    secondaryMuscles: ["Patellar Tendon", "Tensor Fasciae Latae (TFL)", "Anterior Tibialis"],
    biomechanicsCue: "Align machine pivot point directly with the lateral epicondyle of your knee joint. Drive toes upward (dorsiflexion) and lock out fully to peak the vastus medialis teardrop.",
    steps: [
      "Set Up: Adjust back pad so knees bend naturally over seat edge. Position shin pad against lower tibia just above ankle crease.",
      "Execution: Grip side handles firmly to lock pelvis down. Extend knees smoothly until legs are locked straight out.",
      "Peak Contraction: Squeeze quads maximally for 1 full second at the top of the contraction.",
      "Controlled Return: Lower the weight slowly over 3 seconds to a 90° knee angle without letting weights crash.",
    ],
    commonMistakes: [
      "Using explosive hip momentum or lifting pelvis off seat — keep glutes glued down with handles.",
      "Pivot axis misaligned with knee joint — leads to excess shear on the patellofemoral joint.",
      "Slumping spine or bouncing weights at bottom range.",
    ],
    breathingPattern: "Inhale at bottom start position → Exhale forcefully as you extend knees → Inhale on controlled descent.",
  },
  leg_curl: {
    image: "/anatomy/leg_curl.jpg",
    title: "Leg Curl (Lying & Seated Hamstring Isolation)",
    primaryMuscles: ["Hamstrings (Biceps Femoris Long/Short Heads, Semitendinosus, Semimembranosus)"],
    secondaryMuscles: ["Gastrocnemius (Calf)", "Gracilis", "Sartorius", "Plantaris"],
    biomechanicsCue: "Keep hips and pelvis pressed firmly into the bench pad. Flex knees through full range of motion without hyperextending lumbar spine.",
    steps: [
      "Set Up: Position knee joint directly in line with machine pivot axis. Place lever pad behind lower calf Achilles area.",
      "Curl: Contract hamstrings to pull heels toward glutes in a smooth, continuous arc.",
      "Hold: Squeeze hamstrings tightly at peak flexion for 1 count.",
      "Eccentric Stretch: Slowly resist the load back over 3 seconds until knees reach near full extension without hyper-extending.",
    ],
    commonMistakes: [
      "Arching lower back / lifting hips off bench to heave the weight — keep abs braced.",
      "Pointed toes (plantarflexion) leading to calf cramping — keep ankles neutral.",
      "Letting weight slam at top or bottom.",
    ],
    breathingPattern: "Inhale during extension stretch → Exhale forcefully as you curl heels to glutes.",
  },
  hip_abduction: {
    image: "/anatomy/hip_abduction.jpg",
    title: "Hip Abduction Machine & Cable Glute Kickback",
    primaryMuscles: ["Gluteus Medius", "Gluteus Minimus", "Tensor Fasciae Latae (TFL)"],
    secondaryMuscles: ["Upper Gluteus Maximus", "Piriformis", "Deep Hip Rotator Complex", "Obturator Internus"],
    biomechanicsCue: "Sit tall with chest proud or slight forward hip hinge. Drive outward against the pads with the lateral edges of your knees to fire glute medius without lumbar twisting.",
    steps: [
      "Set Up: Sit upright against backrest with outer knees securely against abduction pads. Select moderate controlled load.",
      "Abduction: Drive knees outward against resistance in a wide arc until full gluteus medius contraction is achieved.",
      "Peak: Hold the outer spread position for 1 full second, feeling the intense lateral hip burn.",
      "Return: Resist the inward pull under strict 3-second control, stopping just before weights touch.",
    ],
    commonMistakes: [
      "Using torso swinging to bounce pads outward — keep upper body stationary.",
      "Feet leading the push instead of knees — push outward from knees to isolate glute medius.",
      "Rushing repetitions — slow eccentric phase builds maximum hip stability.",
    ],
    breathingPattern: "Inhale at center start → Exhale forcefully as you drive pads outward → Inhale as knees return.",
  },
  calf_raise: {
    image: "/anatomy/calf_raise.jpg",
    title: "Standing & Seated Calf Raise",
    primaryMuscles: ["Gastrocnemius (Medial & Lateral Heads)", "Soleus"],
    secondaryMuscles: ["Achilles Tendon", "Tibialis Posterior", "Peroneus Longus & Brevis", "Flexor Hallucis Longus"],
    biomechanicsCue: "Drop heels deep below platform edge for a full 2-second stretch. Drive straight up onto the balls of big toes, squeezing apex for 1 second.",
    steps: [
      "Set Up: Place balls of feet on platform with heels hanging freely. Shoulders under pads (standing) or pad over lower quads (seated).",
      "Full Stretch: Lower heels down into deep ankle dorsiflexion under control; pause for 1 second at the bottom.",
      "Plantarflexion: Drive straight up through big toe metatarsals to maximum height.",
      "Peak Squeeze: Hold peak contraction at apex for 1 full count without rolling ankles outward.",
    ],
    commonMistakes: [
      "Bouncing fast at bottom of movement — transfers load to Achilles tendon recoil rather than muscle fibers.",
      "Rolling weight onto outer pinky toes (supination) — keep pressure balanced through big toe.",
      "Bending knees on standing calf raises — maintain straight knees to target gastrocnemius.",
    ],
    breathingPattern: "Inhale on deep bottom stretch → Exhale as you press up onto toes → Inhale on descent.",
  },
  hammer_curl: {
    image: "/anatomy/hammer_curl.jpg",
    title: "Dumbbell Hammer Curl & Forearms",
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
    title: "Bent-Over Row & Upper Back",
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
    title: "Barbell Back Squat & Leg Press",
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
    title: "Barbell Bench Press & Chest Press",
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
    title: "Overhead Barbell Press & Shoulders",
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
  back_hyperextension: {
    image: "/anatomy/rdl.jpg",
    title: "Back Hyperextensions (45° Roman Chair & Glute-Ham)",
    primaryMuscles: ["Erector Spinae (Spinalis, Longissimus, Iliocostalis)", "Gluteus Maximus"],
    secondaryMuscles: ["Hamstrings (Biceps Femoris, Semitendinosus)", "Quadratus Lumborum (QL)"],
    biomechanicsCue: "Hinge strictly at hip crease. Ascend by squeezing glutes and erectors until torso forms a straight line with legs (neutral spine). Never hyperextend lumbar past neutral.",
    steps: [
      "Set Up: Position thigh pad 1-2 inches below hip bones to permit free pelvic articulation.",
      "Descent: Cross arms at chest, lower torso smoothly through deep hip flexion with neutral cervical spine.",
      "Ascent: Squeeze glutes and contract lower back erectors to pull torso upright in a straight line.",
      "Peak Hold: Pause for 1 full second at apex before descending under control.",
    ],
    commonMistakes: [
      "Hyperextending and arching lower back at top — finish in a straight neutral line.",
      "Looking up with neck (cervical strain) — keep chin tucked in line with torso.",
      "Swinging or jerking momentum.",
    ],
    breathingPattern: "Inhale on descent → Exhale as you extend to apex neutral.",
  },
  ql_extension: {
    image: "/anatomy/plank.jpg",
    title: "QL Extensions & Lateral Trunk Flexion (Quadratus Lumborum)",
    primaryMuscles: ["Quadratus Lumborum (Deep Lumbar Stabilizer)", "Internal & External Obliques"],
    secondaryMuscles: ["Transverse Abdominis", "Multifidus", "Gluteus Medius"],
    biomechanicsCue: "Lock pelvis in lateral side-lying 45° Roman chair. Flex spine laterally toward floor, then contract lower flank QL and oblique to return to straight neutral.",
    steps: [
      "Set Up: Side-lying on 45° hyperextension bench. Top foot anchored forward, bottom foot back.",
      "Lateral Flexion: Lower torso sideways toward floor in pure frontal plane movement.",
      "Contraction: Squeeze lateral QL and obliques to pull torso up into alignment.",
      "Controlled Tempo: Perform slow 3-second eccentric stretch on each repetition.",
    ],
    commonMistakes: [
      "Rotating hips forward or back — maintain strict frontal plane lateral flexion.",
      "Overextending past horizontal alignment.",
      "Using heavy loads before establishing spinal motor control.",
    ],
    breathingPattern: "Inhale on lateral descent → Exhale forcefully on lateral contraction.",
  },
  reverse_lunge: {
    image: "/anatomy/squat.jpg",
    title: "Reverse Lunge & Split Squats (Unilateral Knee & Glute)",
    primaryMuscles: ["Quadriceps Femoris (Rectus Femoris, Vastus Lateralis/Medialis)", "Gluteus Maximus"],
    secondaryMuscles: ["Gluteus Medius (Pelvic Stabilizer)", "Hamstrings", "Adductor Magnus", "Soleus"],
    biomechanicsCue: "Step backward with rear foot, keeping front tibia vertical (90° knee angle). Drive through front heel to return.",
    steps: [
      "Set Up: Stand tall with dumbbells at sides or barbell on upper traps.",
      "Step Back: Step backward 2-3 feet onto ball of rear foot, descending until rear knee hovers 1 inch above floor.",
      "Drive: Push aggressively through front mid-foot and heel to return to standing lockout.",
      "Switch: Complete prescribed reps per leg or alternate with steady cadence.",
    ],
    commonMistakes: [
      "Front knee collapsing inward (valgus) — drive front knee tracking over second toe.",
      "Too short a step causing front heel to elevate off floor.",
      "Excessive forward torso collapse.",
    ],
    breathingPattern: "Inhale as you step back and descend → Exhale forcefully driving up through front heel.",
  },
  dips: {
    image: "/anatomy/bench.jpg",
    title: "Parallel Bar Dips (Pectoral & Tricep Power)",
    primaryMuscles: ["Pectoralis Major (Lower Sternal Head)", "Triceps Brachii", "Anterior Deltoids"],
    secondaryMuscles: ["Pectoralis Minor", "Rhomboids", "Serratus Anterior", "Core Stabilizers"],
    biomechanicsCue: "Lean torso 15-20° forward for chest bias; stay vertical for tricep bias. Lower until upper arms reach parallel with floor.",
    steps: [
      "Set Up: Grip parallel bars, lock arms out at top, depress shoulder blades down.",
      "Descent: Lower body under control until elbow angle reaches 90 degrees.",
      "Press: Drive palms into bars to press back to full elbow lockout.",
    ],
    commonMistakes: [
      "Dipping too deep causing anterior shoulder capsule strain.",
      "Shrugging shoulders up toward ears — maintain depression.",
      "Swinging legs.",
    ],
    breathingPattern: "Inhale on descent → Exhale pressing to lockout.",
  },
  face_pull: {
    image: "/anatomy/lateral_raise.jpg",
    title: "Cable Face Pull (Rear Deltoid & Rotator Cuff)",
    primaryMuscles: ["Posterior Deltoids", "Infraspinatus & Teres Minor (External Rotators)", "Middle & Lower Trapezius"],
    secondaryMuscles: ["Rhomboids", "Lateral Deltoids", "Biceps Brachii"],
    biomechanicsCue: "Attach rope to high pulley. Pull towards bridge of nose while externally rotating hands so thumbs point backward behind ears.",
    steps: [
      "Set Up: Set pulley at eye level. Grip rope with thumbs pointing backward.",
      "Pull & Rotate: Pull center of rope to forehead while separating hands outward in a 'double biceps' pose.",
      "Peak Squeeze: Hold external rotation for 1 full second.",
      "Controlled Return: Extend arms slowly under constant cable tension.",
    ],
    commonMistakes: [
      "Using excessive body sway or leaning back.",
      "Failing to externally rotate hands (elbows dropping below hands).",
      "Pulling to neck instead of forehead/eyes.",
    ],
    breathingPattern: "Inhale at starting reach → Exhale as hands pull to ears.",
  },
};

export async function POST(req: NextRequest) {
  try {
    const rateCheck = checkRateLimit(req, RATE_LIMIT_PRESETS.AI);
    if (rateCheck.limited && rateCheck.response) return rateCheck.response;

    const body = await req.json().catch(() => ({}));
    const exerciseName = sanitizeText(body.exerciseName || "Squat", 150);
    const norm = exerciseName.toLowerCase();

    // High-Precision Kinesiological Token Matching
    let matchedKey: string | null = null;

    // 1. Stretches & Mobility (Highest specificity)
    if (
      /\b(pigeon|couch stretch|figure 4|piriformis|hip opener|frog stretch)\b/i.test(norm)
    ) {
      matchedKey = "pigeon";
    } else if (
      /\b(doorway|pec stretch|chest stretch|dislocate|wall slide|cross-body stretch)\b/i.test(norm)
    ) {
      matchedKey = "chest_stretch";
    } else if (
      /\b(cat|cow|spine|foam roll|mobility|warmup|warm-up|recovery|breathwork|sauna|yoga)\b/i.test(norm)
    ) {
      matchedKey = "cat_cow";
    }
    // 2. QL & Deep Quadratus Lumborum / Oblique Extensions (Checked before general extensions)
    else if (/\b(ql|quadratus|quadratus lumborum|side bends?|oblique extensions?|lateral flexion|lateral trunk)\b/i.test(norm) || norm.includes("ql")) {
      matchedKey = "ql_extension";
    }
    // 3. Back Hyperextensions & Roman Chair (Checked before deadlift)
    else if (/\b(hyperextensions?|hyper-extensions?|back extensions?|glute ham|ghr|roman chairs?|reverse hypers?)\b/i.test(norm) || norm.includes("hyperextension")) {
      matchedKey = "back_hyperextension";
    }
    // 4. Hip Abduction & Glute Medius (Explicitly before core to prevent "ab" substring collision!)
    else if (/\b(abduct|abductor|abductors|abduction|clamshell|outer hip|hip abductor)\b/i.test(norm)) {
      matchedKey = "hip_abduction";
    }
    // 5. Calves & Lower Leg (Calf Raise, Donkey Raise, Soleus)
    else if (/\b(calf|calves|soleus|gastrocnemius|tibialis|toe raises?)\b/i.test(norm)) {
      matchedKey = "calf_raise";
    }
    // 6. Reverse Lunges & Split Squats (Unilateral)
    else if (/\b(lunges?|reverse lunges?|walking lunges?|split squats?|bulgarian|step-ups?|step ups?|curtsy lunges?)\b/i.test(norm)) {
      matchedKey = "reverse_lunge";
    }
    // 7. Quad Isolation (Leg Extension, Sissy Squat, Quad Extension)
    else if (/\b(leg extensions?|quad extensions?|sissy squats?|knee extensions?)\b/i.test(norm) || (norm.includes("extension") && (norm.includes("leg") || norm.includes("quad")))) {
      matchedKey = "leg_extension";
    }
    // 8. Hamstring Isolation (Leg Curl, Hamstring Curl, Nordic Curl, Lying Leg Curl, Seated Leg Curl)
    else if (/\b(leg curls?|hamstring curls?|nordic curls?|nordic|lying curls?|seated leg curls?|ham curls?)\b/i.test(norm) || (norm.includes("curl") && (norm.includes("leg") || norm.includes("hamstring")))) {
      matchedKey = "leg_curl";
    }
    // 9. Posterior Chain: Hip Thrust & Glutes (Hip Thrust, Glute Bridge, Kickback)
    else if (/\b(hip thrusts?|glute bridges?|kickbacks?|glute kickbacks?|glutes|adductor|adductors|adduction)\b/i.test(norm)) {
      matchedKey = "hip_thrust";
    }
    // 10. Posterior Chain: Hamstrings & Hip Hinge (RDL, Romanian, Stiff Leg, Good Morning)
    else if (/\b(rdl|romanian|good morning|stiff leg|stiff-leg)\b/i.test(norm)) {
      matchedKey = "rdl";
    }
    // 11. Vertical Back Pulls (Lat Pulldowns, Pull-Ups, Chin-Ups, Straight Arm Pulldown)
    else if (/\b(pulldowns?|pull-ups?|pull ups?|chin-ups?|chin ups?|lat pulls?|lat pulldowns?|straight arm pulldowns?)\b/i.test(norm)) {
      matchedKey = "lat_pulldown";
    }
    // 12. Face Pulls & Rear Delts
    else if (/\b(face pulls?|facepulls?|rear delts?|rear deltoids?|reverse flys?|reverse flyes?|reverse pec deck|band pull-aparts?)\b/i.test(norm) || norm.includes("face pull")) {
      matchedKey = "face_pull";
    }
    // 13. Horizontal Rows & Upper Back (Barbell Row, Dumbbell Row, Cable Row, T-Bar, Pendlay, Shrugs)
    else if (/\b(row|rowing|t-bar|pendlay|shrug|shrugs|rhomboid|inverted row|seal row|meadows row)\b/i.test(norm)) {
      matchedKey = "barbell_row";
    }
    // 14. Forearms & Hammer Curls
    else if (/\b(hammer|reverse curl|wrist curl|farmer|grip|forearm)\b/i.test(norm)) {
      matchedKey = "hammer_curl";
    }
    // 15. Biceps (Supinated, Preacher, Incline, Concentration, Cables)
    else if (/\b(bicep|preacher|concentration|spider curl|ez bar curl|incline curl)\b/i.test(norm) || (norm.includes("curl") && !norm.includes("leg") && !norm.includes("hamstring"))) {
      matchedKey = "bicep_curl";
    }
    // 16. Dips (Parallel Bar / Ring)
    else if (/\b(dips?|chest dip|tricep dip|parallel bar dip|ring dip)\b/i.test(norm)) {
      matchedKey = "dips";
    }
    // 17. Triceps (Pushdowns, Extensions, Skull Crushers, Close-Grip Bench, Kickbacks)
    else if (/\b(tricep|pushdown|skull crusher|skullcrusher|close-grip|close grip|french press|jm press)\b/i.test(norm) || (norm.includes("extension") && !norm.includes("leg") && !norm.includes("quad") && !norm.includes("back") && !norm.includes("ql"))) {
      matchedKey = "tricep_pushdown";
    }
    // 18. Lateral, Front, and Side Deltoids (Side Raises, Upright Rows)
    else if (/\b(lateral raise|side raise|front raise|upright row|deltoid fly)\b/i.test(norm)) {
      matchedKey = "lateral_raise";
    }
    // 19. Shoulders & Vertical Push (Overhead Press, Military Press, DB Shoulder Press, Arnold Press, Push Press)
    else if (/\b(overhead|shoulder press|arnold press|military press|push press|ohp|deltoid press|handstand)\b/i.test(norm)) {
      matchedKey = "press";
    }
    // 20. Chest & Horizontal Push (Bench Press, Incline Press, Decline Press, Dumbbell Press, Chest Flyes, Push-Ups, Pec Deck)
    else if (/\b(bench|push-up|push up|pushup|chest press|chest fly|pec fly|flye|crossover|pec deck|floor press|svend press)\b/i.test(norm) || norm.includes("chest")) {
      matchedKey = "bench";
    }
    // 21. Core & Abdominals (Plank, Ab Wheel, Crunch, Leg Raise, Knee Raise, Woodchopper, Sit-Up, Dead Bug, Pallof)
    else if (/\b(plank|crunch|leg raise|knee raise|woodchopper|woodchop|russian twist|sit-up|situp|ab wheel|rollout|dead bug|deadbug|pallof|hollow body|v-up|hanging leg)\b/i.test(norm) || (/\b(abs|abdominals|core)\b/i.test(norm) && !norm.includes("abduct"))) {
      matchedKey = "plank";
    }
    // 22. Quads & Knee-Dominant Lower Body (Squat, Front Squat, Box Squat, Goblet Squat, Leg Press, Hack Squat)
    else if (/\b(squat|leg press|hack squat|hack|goblet|zercher|wall sit|sled|prowler)\b/i.test(norm) || norm.includes("quad")) {
      matchedKey = "squat";
    }
    // 23. Posterior Chain & Full Body Explosive (Deadlift, Sumo Deadlift, Rack Pull, Power Clean, Snatch, Kettlebell Swing)
    else if (/\b(deadlift|rack pull|clean|snatch|kettlebell swing|kb swing|burpee|box jump|slam ball|turkish get-up)\b/i.test(norm) || norm.includes("back")) {
      matchedKey = "deadlift";
    }

    // Dynamic Intelligent Fallback: If coach added a custom exercise without direct keyword, synthesize based on root words
    if (!matchedKey) {
      if (norm.includes("press")) matchedKey = "bench";
      else if (norm.includes("pull")) matchedKey = "lat_pulldown";
      else if (norm.includes("raise")) matchedKey = "lateral_raise";
      else if (norm.includes("squat") || norm.includes("leg")) matchedKey = "squat";
      else if (norm.includes("curl")) matchedKey = "bicep_curl";
      else if (norm.includes("thrust") || norm.includes("glute")) matchedKey = "hip_thrust";
      else if (norm.includes("hinge") || norm.includes("dead")) matchedKey = "deadlift";
      else matchedKey = "squat";
    }

    const chart = ANATOMY_CHARTS[matchedKey] || ANATOMY_CHARTS.squat;

    return NextResponse.json({
      success: true,
      exerciseName,
      chart: {
        ...chart,
        title: chart.title.toLowerCase().includes(exerciseName.toLowerCase()) ? chart.title : `${exerciseName} — Visual Anatomy Guide`,
        queryName: exerciseName,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to retrieve anatomy visual guide" }, { status: 500 });
  }
}
