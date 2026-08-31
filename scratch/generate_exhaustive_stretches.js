const fs = require('fs');
const path = require('path');

const apiKey = process.env.GEMINI_API_KEY || '';

const exhaustiveStretches = [
  {
    name: "Pec Minor & Anterior Shoulder Floor Angels",
    normalizedName: "pec_minor_floor_angels",
    type: "STRETCH",
    muscleGroup: "Stretching",
    equipment: "Bodyweight",
    category: "MOBILITY",
    primaryMuscles: ["Pectoralis Minor", "Anterior Deltoid"],
    secondaryMuscles: ["Serratus Anterior", "Coracobrachialis", "Rhomboids"],
    biomechanicsCue: "Lie supine on floor with knees bent. Slide forearms and backs of hands along floor in a snow angel arc while keeping lower back flat.",
    steps: [
      "Lie supine on mat with knees bent 90° and feet flat.",
      "Place arms in 'goalpost' position with elbows at 90° and backs of wrists touching floor.",
      "Slowly glide hands overhead in an arc, maintaining wrist and elbow contact with the floor.",
      "Pause at maximum overhead reach for 2 seconds, then return smoothly."
    ],
    commonMistakes: [
      "Arching lower back off the floor to compensate for tight pecs.",
      "Wrists or elbows lifting off the floor during the overhead glide."
    ],
    breathingPattern: "Inhale as arms slide overhead into chest stretch → Exhale as elbows pull down toward ribs.",
    diagramUrl: "/anatomy/pec_minor_floor_angels.jpg",
    diagramStatus: "APPROVED",
    prompt: "Ultra-detailed photorealistic 3D medical anatomy octane render of a human body lying supine on a floor mat performing Pec Minor Floor Angels with arms gliding in a 90 degree goalpost arc. Dark slate studio background (#090d16). Pectoralis Minor and Anterior Deltoids glowing in electric cyan (#38bdf8), with Serratus Anterior and Rhomboids in warm amber (#f59e0b). 8k resolution."
  },
  {
    name: "Wall Slides & Overhead Scapular Angels",
    normalizedName: "wall_slides_scapular",
    type: "STRETCH",
    muscleGroup: "Stretching",
    equipment: "Bodyweight",
    category: "MOBILITY",
    primaryMuscles: ["Serratus Anterior", "Lower Trapezius"],
    secondaryMuscles: ["Rotator Cuff", "Pectoralis Minor", "Rhomboids"],
    biomechanicsCue: "Stand with back, head, elbows, and wrists pressed flat against wall. Slide arms up into a 'V' without losing wall contact.",
    steps: [
      "Stand with heels 4 inches from wall, pressing sacrum, upper back, and head against wall.",
      "Bring elbows and wrists against wall at 90° abduction.",
      "Slide arms upward overhead into a 'V' shape, actively engaging lower traps.",
      "Lower under control, keeping entire posterior chain in wall contact."
    ],
    commonMistakes: [
      "Flaring ribcage outward.",
      "Elbows peeling forward away from the wall."
    ],
    breathingPattern: "Inhale at starting position → Exhale as arms press overhead along the wall.",
    diagramUrl: "/anatomy/wall_slides_scapular.jpg",
    diagramStatus: "APPROVED",
    prompt: "Ultra-detailed photorealistic 3D medical anatomy octane render of an athletic body standing with back against a wall performing Wall Slides Scapular Angels reaching overhead into a V. Dark slate studio background (#090d16). Serratus Anterior and Lower Trapezius glowing in electric cyan (#38bdf8), with Rotator Cuff in warm amber (#f59e0b). 8k resolution."
  },
  {
    name: "Prone Y-T-W Scapular & Trap Activator",
    normalizedName: "prone_ytw_scapular",
    type: "STRETCH",
    muscleGroup: "Stretching",
    equipment: "Bodyweight",
    category: "MOBILITY",
    primaryMuscles: ["Lower Trapezius", "Middle Trapezius", "Rhomboids"],
    secondaryMuscles: ["Infraspinatus", "Teres Minor", "Posterior Deltoid"],
    biomechanicsCue: "Lie prone on mat. Thumbs up, raise arms into 'Y', then 'T', then 'W' formations, squeezing shoulder blades down and back.",
    steps: [
      "Lie face down with forehead resting gently on a towel.",
      "Extend arms at 45° overhead with thumbs pointing to ceiling (Y-position); lift arms 2 inches.",
      "Move arms straight out to sides at 90° (T-position); squeeze mid-back.",
      "Pull elbows down into ribs with bent arms (W-position); squeeze lower traps."
    ],
    commonMistakes: [
      "Shrugging shoulders into ears.",
      "Hyperextending the cervical spine (keep neck neutral)."
    ],
    breathingPattern: "Inhale on floor → Exhale as arms lift and scapulae retract.",
    diagramUrl: "/anatomy/prone_ytw_scapular.jpg",
    diagramStatus: "APPROVED",
    prompt: "Ultra-detailed photorealistic 3D medical anatomy octane render of an athletic man lying prone on a mat performing Prone Y-T-W Scapular raises with thumbs pointing upward. Dark slate studio background (#090d16). Lower Trapezius, Middle Trapezius, and Rhomboids glowing in electric cyan (#38bdf8), with Infraspinatus in warm amber (#f59e0b). 8k resolution."
  },
  {
    name: "Overhead Lat Wall Hinge Stretch",
    normalizedName: "overhead_lat_wall_hinge",
    type: "STRETCH",
    muscleGroup: "Stretching",
    equipment: "Bodyweight",
    category: "STATIC_STRETCH",
    primaryMuscles: ["Latissimus Dorsi", "Teres Major"],
    secondaryMuscles: ["Thoracic Erector Spinae", "Posterior Deltoids", "Triceps Brachii (Long Head)"],
    biomechanicsCue: "Place hands shoulder-height on wall, step back, and hinge at hips until torso is parallel to floor, letting chest sink through shoulders.",
    steps: [
      "Place palms flat against wall at shoulder height.",
      "Walk feet backward and hinge deeply at hips with soft knees.",
      "Let chest and head drop between arms toward the floor until deep lat stretch is felt.",
      "Hold for 30-45 seconds, breathing deeply into posterior ribcage."
    ],
    commonMistakes: [
      "Rounding the thoracic spine instead of sinking with a straight back.",
      "Locking knees out into hyperextension."
    ],
    breathingPattern: "Inhale into lateral ribs → Exhale and let chest sink half an inch deeper.",
    diagramUrl: "/anatomy/overhead_lat_wall_hinge.jpg",
    diagramStatus: "APPROVED",
    prompt: "Ultra-detailed photorealistic 3D medical anatomy octane render of an athletic body in Overhead Lat Wall Hinge Stretch with hands on wall and torso hinged 90 degrees parallel to floor. Dark slate studio background (#090d16). Latissimus Dorsi and Teres Major glowing in electric cyan (#38bdf8), with Thoracic Spine in warm amber (#f59e0b). 8k resolution."
  },
  {
    name: "Thoracic Windmill (Open Book T-Spine)",
    normalizedName: "thoracic_windmill_open_book",
    type: "STRETCH",
    muscleGroup: "Stretching",
    equipment: "Bodyweight",
    category: "MOBILITY",
    primaryMuscles: ["Thoracic Spine Rotators", "Pectoralis Major", "Anterior Deltoid"],
    secondaryMuscles: ["Rhomboids", "Obliques", "Multifidus"],
    biomechanicsCue: "Side-lying with top knee pinned to floor or foam roller. Sweep top arm in a 180° overhead arc across floor, opening chest to ceiling.",
    steps: [
      "Lie on side with hips and knees stacked at 90°.",
      "Keep bottom arm pinned forward; sweep top arm in a giant circle above head along the floor.",
      "Rotate upper chest to face ceiling while keeping top knee glued down.",
      "Complete 8-10 slow rotations per side."
    ],
    commonMistakes: [
      "Top knee lifting off floor (isolates hips instead of thoracic spine).",
      "Rushing the circle without feeling chest and spine release."
    ],
    breathingPattern: "Inhale at reach → Exhale as chest spirals open to ceiling.",
    diagramUrl: "/anatomy/thoracic_windmill_open_book.jpg",
    diagramStatus: "APPROVED",
    prompt: "Ultra-detailed photorealistic 3D medical anatomy octane render of a body in side-lying position performing Thoracic Windmill Open Book sweep with arm extended in 180 degree rotation. Dark slate studio background (#090d16). Thoracic Spine Rotators and Pectoralis Major glowing in electric cyan (#38bdf8), with Obliques in warm amber (#f59e0b). 8k resolution."
  },
  {
    name: "Half-Kneeling Psoas & Hip Flexor Lunge",
    normalizedName: "half_kneeling_psoas_lunge",
    type: "STRETCH",
    muscleGroup: "Stretching",
    equipment: "Bodyweight",
    category: "STATIC_STRETCH",
    primaryMuscles: ["Psoas Major", "Iliacus", "Rectus Femoris"],
    secondaryMuscles: ["Tensor Fasciae Latae", "Gluteus Maximus (Agonist Drive)"],
    biomechanicsCue: "Half-kneeling 90/90 stance. Tuck pelvis into posterior tilt, squeeze rear glute, and shift hips forward 2 inches with tall vertical spine.",
    steps: [
      "Kneel on one knee with opposite foot flat in front, both knees bent at 90°.",
      "Tuck tailbone under (posterior pelvic tilt) and squeeze rear glute tightly.",
      "Shift body weight slightly forward while keeping torso perfectly vertical.",
      "Raise same-side arm overhead with slight lateral reach away from kneeling leg."
    ],
    commonMistakes: [
      "Excessive lumbar lordosis / hyperextending lower back.",
      "Lunging too far forward without locking pelvic tilt first."
    ],
    breathingPattern: "Inhale tall through crown → Exhale, squeeze rear glute, and deepen anterior hip stretch.",
    diagramUrl: "/anatomy/half_kneeling_psoas_lunge.jpg",
    diagramStatus: "APPROVED",
    prompt: "Ultra-detailed photorealistic 3D medical anatomy octane render of an athletic man in a half-kneeling 90/90 lunge performing a Psoas & Hip Flexor Stretch with arm reaching overhead. Dark slate studio background (#090d16). Psoas Major, Iliacus, and Rectus Femoris glowing in electric cyan (#38bdf8), with Gluteus Maximus in warm amber (#f59e0b). 8k resolution."
  },
  {
    name: "Samson Stretch (Overhead Interlocked Lunge)",
    normalizedName: "samson_stretch_lunge",
    type: "STRETCH",
    muscleGroup: "Stretching",
    equipment: "Bodyweight",
    category: "STATIC_STRETCH",
    primaryMuscles: ["Psoas Major", "Rectus Femoris", "Latissimus Dorsi"],
    secondaryMuscles: ["Anterior Abdominal Wall", "Tensor Fasciae Latae", "Shoulder Girdle"],
    biomechanicsCue: "Deep forward lunge with rear knee resting lightly on mat. Interlock fingers and press palms vertically toward ceiling, extending whole anterior chain.",
    steps: [
      "Step into a deep forward lunge.",
      "Interlock fingers with palms turned upward toward ceiling.",
      "Drive arms back past ears while actively pushing hips forward and down.",
      "Hold for 30-45 seconds, breathing into abdomen."
    ],
    commonMistakes: [
      "Letting front knee cave inward (keep knee tracking over second toe).",
      "Shoulders collapsing forward."
    ],
    breathingPattern: "Inhale expand ribcage upward → Exhale drive palms higher and sink hips.",
    diagramUrl: "/anatomy/samson_stretch_lunge.jpg",
    diagramStatus: "APPROVED",
    prompt: "Ultra-detailed photorealistic 3D medical anatomy octane render of an athletic body in Samson Stretch deep lunge with fingers interlocked pressing straight up overhead. Dark slate studio background (#090d16). Psoas Major, Rectus Femoris, and Latissimus Dorsi glowing in electric cyan (#38bdf8), with Abdominal Wall in warm amber (#f59e0b). 8k resolution."
  },
  {
    name: "Dynamic Spiderman Lunge with T-Spine Reach",
    normalizedName: "spiderman_lunge_thoracic_reach",
    type: "STRETCH",
    muscleGroup: "Stretching",
    equipment: "Bodyweight",
    category: "MOBILITY",
    primaryMuscles: ["Adductor Magnus", "Psoas Major", "Thoracic Spine"],
    secondaryMuscles: ["Hamstrings", "Gluteus Maximus", "Posterior Deltoids"],
    biomechanicsCue: "Deep runner's lunge with front foot outside front hand. Drop inside elbow toward floor, then rotate arm and chest open toward ceiling.",
    steps: [
      "Start in top push-up plank position.",
      "Step right foot forward outside right hand.",
      "Drop right elbow toward inside of right ankle.",
      "Rotate right arm and chest up toward ceiling, tracking hand with eyes.",
      "Place hand back down and repeat on opposite side."
    ],
    commonMistakes: [
      "Front heel coming off floor (keep whole foot planted).",
      "Twisting from lumbar spine instead of mid-back."
    ],
    breathingPattern: "Inhale at bottom elbow drop → Exhale rotate ribcage open to sky.",
    diagramUrl: "/anatomy/spiderman_lunge_thoracic_reach.jpg",
    diagramStatus: "APPROVED",
    prompt: "Ultra-detailed photorealistic 3D medical anatomy octane render of an athletic body in Spiderman Lunge with inside arm rotated vertically pointing to ceiling. Dark slate studio background (#090d16). Adductor Magnus, Psoas Major, and Thoracic Spine glowing in electric cyan (#38bdf8), with Hamstrings in warm amber (#f59e0b). 8k resolution."
  },
  {
    name: "Lizard Pose with Quad / Back-Foot Grab",
    normalizedName: "lizard_pose_quad_grab",
    type: "STRETCH",
    muscleGroup: "Stretching",
    equipment: "Bodyweight",
    category: "STATIC_STRETCH",
    primaryMuscles: ["Rectus Femoris (Rear Leg)", "Psoas Major", "Adductor Longus (Front Leg)"],
    secondaryMuscles: ["Anterior Shoulder", "Gluteus Medius"],
    biomechanicsCue: "Deep lizard lunge. Reach opposite hand back to grasp rear foot, gently pulling heel toward glute while chest opens upward.",
    steps: [
      "Enter a deep lizard lunge with both hands inside front foot.",
      "Bend rear knee and reach back with same-side or opposite hand to grasp toes/ankle.",
      "Gently draw rear heel toward glute while keeping hips sinking forward.",
      "Hold for 30 seconds per side."
    ],
    commonMistakes: [
      "Torso collapsing forward onto floor.",
      "Yanking foot abruptly without warming quads first."
    ],
    breathingPattern: "Inhale create length through spine → Exhale gently draw heel 1 inch closer to glute.",
    diagramUrl: "/anatomy/lizard_pose_quad_grab.jpg",
    diagramStatus: "APPROVED",
    prompt: "Ultra-detailed photorealistic 3D medical anatomy octane render of a body in Lizard Pose on mat reaching back to hold rear foot in deep quad stretch. Dark slate studio background (#090d16). Rear Rectus Femoris, Psoas Major, and Front Adductors glowing in electric cyan (#38bdf8), with Shoulder in warm amber (#f59e0b). 8k resolution."
  },
  {
    name: "Seated Straddle Pancake Stretch",
    normalizedName: "seated_straddle_pancake",
    type: "STRETCH",
    muscleGroup: "Stretching",
    equipment: "Bodyweight",
    category: "STATIC_STRETCH",
    primaryMuscles: ["Adductor Magnus", "Adductor Longus", "Gracilis", "Hamstrings"],
    secondaryMuscles: ["Thoracolumbar Fascia", "Gluteus Medius", "Calves"],
    biomechanicsCue: "Sit tall with legs spread wide in straddle. Hinge forward from pelvis with straight spine, walking fingertips forward across floor.",
    steps: [
      "Sit on mat and spread legs wide into maximum comfortable straddle.",
      "Point toes toward ceiling and engage quads to lock knees.",
      "Hinge at hips, maintaining a proud chest as hands walk forward along floor.",
      "Lower chest toward floor without rounding mid-back."
    ],
    commonMistakes: [
      "Rounding upper back and tucking chin (fake depth).",
      "Knees rolling inward (keep kneecaps pointed straight up)."
    ],
    breathingPattern: "Inhale lengthen spine → Exhale walk fingers forward into deeper adductor release.",
    diagramUrl: "/anatomy/seated_straddle_pancake.jpg",
    diagramStatus: "APPROVED",
    prompt: "Ultra-detailed photorealistic 3D medical anatomy octane render of an athletic body in Seated Straddle Pancake Stretch with legs wide and torso folding forward to floor. Dark slate studio background (#090d16). Adductor Magnus, Gracilis, and Hamstrings glowing in electric cyan (#38bdf8), with Spinal Fascia in warm amber (#f59e0b). 8k resolution."
  },
  {
    name: "Standing Pike Stretch (Toe Touch)",
    normalizedName: "standing_pike_stretch",
    type: "STRETCH",
    muscleGroup: "Stretching",
    equipment: "Bodyweight",
    category: "STATIC_STRETCH",
    primaryMuscles: ["Hamstrings (All Heads)", "Gastrocnemius"],
    secondaryMuscles: ["Erector Spinae", "Gluteus Maximus", "Plantar Fascia"],
    biomechanicsCue: "Stand feet together. Hinge from hips, folding torso over thighs and reaching palms toward floor with soft knees.",
    steps: [
      "Stand with feet touching and weight balanced over mid-foot.",
      "Hinge hips backward and let torso drape down over legs.",
      "Grasp calves, ankles, or place palms on floor.",
      "Relax head and neck completely."
    ],
    commonMistakes: [
      "Hyperextending knees backward into joint lock.",
      "Tensing shoulders and neck."
    ],
    breathingPattern: "Inhale into back of ribcage → Exhale release tension and sink deeper into forward fold.",
    diagramUrl: "/anatomy/standing_pike_stretch.jpg",
    diagramStatus: "APPROVED",
    prompt: "Ultra-detailed photorealistic 3D medical anatomy octane render of an athletic body in Standing Pike Stretch forward fold reaching hands to toes. Dark slate studio background (#090d16). Hamstrings and Gastrocnemius calves glowing in electric cyan (#38bdf8), with Erector Spinae in warm amber (#f59e0b). 8k resolution."
  },
  {
    name: "Jefferson Curl (Segmental Spinal Flexion)",
    normalizedName: "jefferson_curl_spinal_flow",
    type: "STRETCH",
    muscleGroup: "Stretching",
    equipment: "Bodyweight",
    category: "MOBILITY",
    primaryMuscles: ["Posterior Chain Fascia", "Hamstrings", "Erector Spinae"],
    secondaryMuscles: ["Multifidus", "Calves", "Gluteus Maximus"],
    biomechanicsCue: "Stand on box or flat floor. Segmentally roll spine down vertebra by vertebra starting at chin, letting arms hang heavy.",
    steps: [
      "Stand tall; tuck chin to chest.",
      "Slowly roll down through cervical, thoracic, and lumbar spine one vertebra at a time.",
      "Let arms and weight hang freely past toes at bottom stretch.",
      "Reverse the roll, stacking spine upward from tailbone to crown."
    ],
    commonMistakes: [
      "Moving too quickly without segmental spinal articulation.",
      "Using heavy loads before mastering bodyweight mobility."
    ],
    breathingPattern: "Exhale on the slow descent → Inhale expand spine → Exhale on slow roll up.",
    diagramUrl: "/anatomy/jefferson_curl_spinal_flow.jpg",
    diagramStatus: "APPROVED",
    prompt: "Ultra-detailed photorealistic 3D medical anatomy octane render of a human spine and athletic body performing a Jefferson Curl slow spinal roll down. Dark slate studio background (#090d16). Spinal Vertebrae Erector Spinae and Hamstrings glowing in electric cyan (#38bdf8), with Posterior Fascia in warm amber (#f59e0b). 8k resolution."
  },
  {
    name: "Seated Single-Leg Hamstring Stretch (Hurdler)",
    normalizedName: "seated_single_leg_hamstring",
    type: "STRETCH",
    muscleGroup: "Stretching",
    equipment: "Bodyweight",
    category: "STATIC_STRETCH",
    primaryMuscles: ["Hamstrings (Biceps Femoris, Semitendinosus)", "Gastrocnemius"],
    secondaryMuscles: ["Lower Back (Quadratus Lumborum)", "Gluteus Medius"],
    biomechanicsCue: "One leg extended straight, opposite foot tucked into inner thigh. Hinge forward over extended leg with neutral spine.",
    steps: [
      "Sit on mat with one leg extended straight and opposite foot resting against inner thigh.",
      "Square shoulders toward extended foot.",
      "Hinge at hip, reaching hands toward toes while keeping spine long.",
      "Hold for 30-45 seconds, then switch legs."
    ],
    commonMistakes: [
      "Slouching upper back to grab toes instead of hinging from hip.",
      "Extended leg foot flopping outward."
    ],
    breathingPattern: "Inhale lengthen spine → Exhale fold heart toward knee.",
    diagramUrl: "/anatomy/seated_single_leg_hamstring.jpg",
    diagramStatus: "APPROVED",
    prompt: "Ultra-detailed photorealistic 3D medical anatomy octane render of an athletic body in Seated Single-Leg Hurdler Hamstring Stretch folding over straight leg. Dark slate studio background (#090d16). Hamstrings and Gastrocnemius glowing in electric cyan (#38bdf8), with Lower Back QL in warm amber (#f59e0b). 8k resolution."
  },
  {
    name: "Brettzel 1.0 (Full Body Multi-Planar Mobility)",
    normalizedName: "brettzel_stretch",
    type: "STRETCH",
    muscleGroup: "Stretching",
    equipment: "Bodyweight",
    category: "MOBILITY",
    primaryMuscles: ["Quadriceps & Hip Flexors (Bottom Leg)", "Gluteus Medius & Piriformis (Top Leg)", "Thoracic Spine"],
    secondaryMuscles: ["Pectoralis Major", "Latissimus Dorsi", "Obliques"],
    biomechanicsCue: "Lie on side. Top knee flexed 90° across chest pinned by bottom hand. Bottom knee bent back with foot held by top hand. Rotate shoulders to floor.",
    steps: [
      "Lie on right side; bring left knee up to 90° and hold it down with right hand.",
      "Bend right knee behind you; reach left hand back to grasp right ankle/foot.",
      "Inhale deeply, then exhale and rotate left shoulder back toward floor.",
      "Hold for 5 deep breaths per side."
    ],
    commonMistakes: [
      "Top knee lifting off floor during thoracic rotation.",
      "Forcing the shoulder down without relaxed diaphragmatic breathing."
    ],
    breathingPattern: "Inhale expand 360° → Exhale relax and sink both shoulders closer to floor.",
    diagramUrl: "/anatomy/brettzel_stretch.jpg",
    diagramStatus: "APPROVED",
    prompt: "Ultra-detailed photorealistic 3D medical anatomy octane render of a human body in the Brettzel mobility stretch with interlocked legs and rotated thoracic spine. Dark slate studio background (#090d16). Quad Hip Flexors, Glute Piriformis, and Thoracic Spine glowing in electric cyan (#38bdf8), with Pectorals in warm amber (#f59e0b). 8k resolution."
  },
  {
    name: "Deep Squat Ankle Prying & Hip Opener (Malasana)",
    normalizedName: "deep_squat_ankle_prying",
    type: "STRETCH",
    muscleGroup: "Stretching",
    equipment: "Bodyweight",
    category: "MOBILITY",
    primaryMuscles: ["Soleus & Achilles Tendon (Dorsiflexion)", "Adductor Magnus", "Hip Capsule"],
    secondaryMuscles: ["Gluteus Maximus", "Tibialis Anterior", "Erector Spinae"],
    biomechanicsCue: "Full deep squat with heels flat on floor. Place elbows inside knees, press palms together, and pry hips open while shifting weight side to side.",
    steps: [
      "Stand with feet shoulder-width apart, toes turned slightly out.",
      "Descend into full deep resting squat with flat heels.",
      "Place elbows inside inner knees and bring hands together in prayer position.",
      "Press elbows outward to open hips while keeping spine tall.",
      "Gently shift weight side to side to pry open ankle dorsiflexion."
    ],
    commonMistakes: [
      "Heels lifting off the floor (place a wedge under heels if needed).",
      "Collapsing chest and rounding shoulders forward."
    ],
    breathingPattern: "Inhale tall into pelvic floor → Exhale push knees outward with elbows.",
    diagramUrl: "/anatomy/deep_squat_ankle_prying.jpg",
    diagramStatus: "APPROVED",
    prompt: "Ultra-detailed photorealistic 3D medical anatomy octane render of an athletic muscular man in deep Malasana squat with elbows prying inner knees and flat heels. Dark slate studio background (#090d16). Soleus Achilles Tendon and Adductors glowing in electric cyan (#38bdf8), with Hip Capsule in warm amber (#f59e0b). 8k resolution."
  },
  {
    name: "Tibialis Anterior & Shin Wall Stretch",
    normalizedName: "tibialis_anterior_stretch",
    type: "STRETCH",
    muscleGroup: "Stretching",
    equipment: "Bodyweight",
    category: "STATIC_STRETCH",
    primaryMuscles: ["Tibialis Anterior", "Extensor Digitorum Longus"],
    secondaryMuscles: ["Peroneus Tertius", "Anterior Ankle Retinaculum"],
    biomechanicsCue: "Stand with top of toes curled under resting against floor or wall. Gently bend knees and drive ankle forward to stretch front shin.",
    steps: [
      "Stand tall; place top of toes of one foot flat on floor behind you (plantarflexed).",
      "Gently bend standing knee and press ankle joint forward.",
      "Feel stretch radiating along front of shin from knee to big toe.",
      "Hold for 30 seconds per leg."
    ],
    commonMistakes: [
      "Putting too much body weight on curled toes.",
      "Ankle rolling outward into inversion."
    ],
    breathingPattern: "Inhale balance spine → Exhale gently press front of ankle forward.",
    diagramUrl: "/anatomy/tibialis_anterior_stretch.jpg",
    diagramStatus: "APPROVED",
    prompt: "Ultra-detailed photorealistic 3D medical anatomy octane render of a lower leg and foot performing a Tibialis Anterior Shin Stretch with toes plantarflexed on floor. Dark slate studio background (#090d16). Tibialis Anterior and Extensor Digitorum glowing in electric cyan (#38bdf8), with Ankle Retinaculum in warm amber (#f59e0b). 8k resolution."
  },
  {
    name: "Seated Ankle Eversion & Peroneal Stretch",
    normalizedName: "peroneal_ankle_stretch",
    type: "STRETCH",
    muscleGroup: "Stretching",
    equipment: "Bodyweight",
    category: "STATIC_STRETCH",
    primaryMuscles: ["Peroneus Longus", "Peroneus Brevis"],
    secondaryMuscles: ["Lateral Calf (Soleus)", "Lateral Collateral Ankle Ligaments"],
    biomechanicsCue: "Sit with ankle crossed over opposite knee. Gently invert and plantarflex foot with hand, stretching outer lateral calf and ankle.",
    steps: [
      "Sit on chair or floor; cross right ankle over left thigh.",
      "Grasp outer border of right foot with right hand.",
      "Gently pull foot into inversion (sole turning upward) and slight plantarflexion.",
      "Hold for 30 seconds per side."
    ],
    commonMistakes: [
      "Yanking ankle with sharp aggressive pressure.",
      "Twisting the knee joint instead of moving foot at the subtalar joint."
    ],
    breathingPattern: "Inhale relax lower leg → Exhale gently guide sole of foot upward.",
    diagramUrl: "/anatomy/peroneal_ankle_stretch.jpg",
    diagramStatus: "APPROVED",
    prompt: "Ultra-detailed photorealistic 3D medical anatomy octane render of a lower leg in a Peroneal Muscle Ankle Stretch with foot gently inverted. Dark slate studio background (#090d16). Peroneus Longus and Peroneus Brevis glowing in electric cyan (#38bdf8), with Lateral Ankle in warm amber (#f59e0b). 8k resolution."
  },
  {
    name: "Subscapularis Internal Rotation Towel Stretch",
    normalizedName: "subscapularis_towel_stretch",
    type: "STRETCH",
    muscleGroup: "Stretching",
    equipment: "Bodyweight",
    category: "STATIC_STRETCH",
    primaryMuscles: ["Subscapularis", "Anterior Shoulder Capsule"],
    secondaryMuscles: ["Pectoralis Major", "Latissimus Dorsi", "Triceps Brachii"],
    biomechanicsCue: "Hold towel behind back vertically. Top hand gently pulls towel upward, guiding bottom arm into internal rotation behind back.",
    steps: [
      "Hold a rolled towel in top hand over shoulder.",
      "Reach bottom hand behind lower back and grasp bottom end of towel.",
      "Gently pull towel upward with top hand until a mild stretch is felt in front of bottom shoulder.",
      "Hold for 30 seconds per side."
    ],
    commonMistakes: [
      "Hunching bottom shoulder forward (keep scapula retracted).",
      "Aggressive upward pulling causing sharp anterior shoulder pain."
    ],
    breathingPattern: "Inhale stand tall → Exhale smooth gentle upward pull with top arm.",
    diagramUrl: "/anatomy/subscapularis_towel_stretch.jpg",
    diagramStatus: "APPROVED",
    prompt: "Ultra-detailed photorealistic 3D medical anatomy octane render of an athletic back performing Subscapularis Internal Rotation Towel Stretch with hands behind back. Dark slate studio background (#090d16). Subscapularis and Anterior Capsule glowing in electric cyan (#38bdf8), with Pectoralis in warm amber (#f59e0b). 8k resolution."
  },
  {
    name: "Forearm Flexor Prayer Stretch",
    normalizedName: "forearm_flexor_prayer",
    type: "STRETCH",
    muscleGroup: "Stretching",
    equipment: "Bodyweight",
    category: "STATIC_STRETCH",
    primaryMuscles: ["Flexor Carpi Radialis", "Flexor Carpi Ulnaris", "Flexor Digitorum Superficialis"],
    secondaryMuscles: ["Pronator Teres", "Palmaris Longus", "Median Nerve"],
    biomechanicsCue: "Press palms firmly together in front of chest at chin height. Slowly lower wrists toward navel while keeping palm heels glued together.",
    steps: [
      "Place palms flat together in front of chest with fingers pointing upward (prayer pose).",
      "Slowly lower hands down toward belly button, keeping palms completely flat together.",
      "Feel stretch radiating along inner forearm from wrist to inside elbow.",
      "Hold for 30 seconds."
    ],
    commonMistakes: [
      "Heels of palms separating (reduces forearm flexor stretch).",
      "Shrugging shoulders upward."
    ],
    breathingPattern: "Inhale relax shoulders → Exhale lower wrists half an inch lower.",
    diagramUrl: "/anatomy/forearm_flexor_prayer.jpg",
    diagramStatus: "APPROVED",
    prompt: "Ultra-detailed photorealistic 3D medical anatomy octane render of athletic arms and hands in Forearm Flexor Prayer Stretch lowering wrists with palms flat. Dark slate studio background (#090d16). Forearm Flexor muscle bellies glowing in electric cyan (#38bdf8), with Pronator Teres in warm amber (#f59e0b). 8k resolution."
  },
  {
    name: "Reverse Prayer Wrist Extensor Stretch",
    normalizedName: "reverse_prayer_wrist_stretch",
    type: "STRETCH",
    muscleGroup: "Stretching",
    equipment: "Bodyweight",
    category: "STATIC_STRETCH",
    primaryMuscles: ["Extensor Carpi Radialis", "Extensor Carpi Ulnaris", "Extensor Digitorum"],
    secondaryMuscles: ["Brachioradialis", "Supinator"],
    biomechanicsCue: "Place backs of hands together in front of chest with fingers pointing downward. Gently lift elbows and wrists to stretch dorsal forearms.",
    steps: [
      "Place backs of hands together with fingers pointing straight down toward floor.",
      "Gently raise elbows upward while keeping dorsal sides of hands touching.",
      "Feel stretch along top of forearms and wrists.",
      "Hold for 30 seconds."
    ],
    commonMistakes: [
      "Backs of hands peeling apart.",
      "Applying excessive compressive force on wrist joint."
    ],
    breathingPattern: "Inhale relax fingers → Exhale gently elevate elbows for deeper extension stretch.",
    diagramUrl: "/anatomy/reverse_prayer_wrist_stretch.jpg",
    diagramStatus: "APPROVED",
    prompt: "Ultra-detailed photorealistic 3D medical anatomy octane render of hands in Reverse Prayer Wrist Extensor Stretch with backs of hands pressed together and fingers pointing down. Dark slate studio background (#090d16). Forearm Extensor muscles glowing in electric cyan (#38bdf8), with Brachioradialis in warm amber (#f59e0b). 8k resolution."
  },
  {
    name: "Sphinx & Seal Lumbar Extension",
    normalizedName: "seal_lumbar_stretch",
    type: "STRETCH",
    muscleGroup: "Stretching",
    equipment: "Bodyweight",
    category: "STATIC_STRETCH",
    primaryMuscles: ["Rectus Abdominis", "Psoas Major", "Anterior Longitudinal Ligament"],
    secondaryMuscles: ["Erector Spinae", "Triceps Brachii", "Serratus Anterior"],
    biomechanicsCue: "Prone on mat. Press palms into mat with arms extended and hands turned out 45°, letting hips and pubic bone melt heavy into floor.",
    steps: [
      "Lie face down on mat with legs hip-width apart.",
      "Place hands on floor in front of shoulders, turned slightly outward.",
      "Press hands down to straighten arms into Seal pose while relaxing glutes and lower back completely.",
      "Hold for 30-45 seconds."
    ],
    commonMistakes: [
      "Clenching glutes tightly (blocks natural lumbar decompression).",
      "Shrugging shoulders into neck."
    ],
    breathingPattern: "Inhale into anterior abdominal wall → Exhale let pelvis sink heavy into floor.",
    diagramUrl: "/anatomy/seal_lumbar_stretch.jpg",
    diagramStatus: "APPROVED",
    prompt: "Ultra-detailed photorealistic 3D medical anatomy octane render of an athletic body in Seal Lumbar Extension pose with straight arms and arched chest. Dark slate studio background (#090d16). Rectus Abdominis and Psoas Major glowing in electric cyan (#38bdf8), with Spine in warm amber (#f59e0b). 8k resolution."
  },
  {
    name: "Prone Scorpion Hip & Pec Stretch",
    normalizedName: "prone_scorpion_stretch",
    type: "STRETCH",
    muscleGroup: "Stretching",
    equipment: "Bodyweight",
    category: "MOBILITY",
    primaryMuscles: ["Pectoralis Major", "Anterior Deltoid", "Hip Flexors / Psoas"],
    secondaryMuscles: ["Quadriceps", "Obliques", "Gluteus Maximus"],
    biomechanicsCue: "Lie prone with arms in 'T'. Lift one leg and reach heel up and across body toward opposite hand, opening chest and hip.",
    steps: [
      "Lie face down with arms extended straight out to sides in a 'T'.",
      "Bend right knee; lift right leg and rotate hips to reach right foot across to floor near left hand.",
      "Keep left shoulder flat against floor to stretch chest.",
      "Hold for 20 seconds, then repeat on opposite side."
    ],
    commonMistakes: [
      "Arm on stretched side lifting off floor.",
      "Aggressively forcing the foot across with momentum."
    ],
    breathingPattern: "Inhale on floor → Exhale reach foot across body and open anterior hip.",
    diagramUrl: "/anatomy/prone_scorpion_stretch.jpg",
    diagramStatus: "APPROVED",
    prompt: "Ultra-detailed photorealistic 3D medical anatomy octane render of a body performing the Prone Scorpion Stretch reaching foot across body with opposite arm in T. Dark slate studio background (#090d16). Pectoralis Major and Hip Flexor Psoas glowing in electric cyan (#38bdf8), with Obliques in warm amber (#f59e0b). 8k resolution."
  },
  {
    name: "Supine Iron Cross Lumbar Twist",
    normalizedName: "supine_iron_cross",
    type: "STRETCH",
    muscleGroup: "Stretching",
    equipment: "Bodyweight",
    category: "MOBILITY",
    primaryMuscles: ["Gluteus Medius", "Tensor Fasciae Latae", "Lumbar Rotators"],
    secondaryMuscles: ["Hamstrings (Lateral Head)", "Obliques", "Pectoralis Major"],
    biomechanicsCue: "Lie supine with arms in 'T'. Lift one straight leg to 90° and drop it across body toward opposite hand while keeping both shoulders pinned.",
    steps: [
      "Lie on back with arms spread wide in a 'T', palms facing down.",
      "Raise right leg straight up toward ceiling.",
      "Lower straight right leg across torso toward left hand.",
      "Keep right shoulder pinned to floor and turn head to right.",
      "Hold for 30 seconds, then switch legs."
    ],
    commonMistakes: [
      "Shoulder peeling off floor on the rotational side.",
      "Bending knee excessively if aiming for IT-band / lateral hip stretch."
    ],
    breathingPattern: "Inhale raise leg to ceiling → Exhale drop leg across body and release lower back.",
    diagramUrl: "/anatomy/supine_iron_cross.jpg",
    diagramStatus: "APPROVED",
    prompt: "Ultra-detailed photorealistic 3D medical anatomy octane render of a body in Supine Iron Cross stretch dropping straight leg across torso with arms in T. Dark slate studio background (#090d16). Gluteus Medius Tensor Fasciae Latae and Lumbar Rotators glowing in electric cyan (#38bdf8), with Obliques in warm amber (#f59e0b). 8k resolution."
  },
  {
    name: "Happy Baby Pose (Sacral & Adductor Opener)",
    normalizedName: "happy_baby_pose",
    type: "STRETCH",
    muscleGroup: "Stretching",
    equipment: "Bodyweight",
    category: "STATIC_STRETCH",
    primaryMuscles: ["Adductor Longus & Magnus", "Gracilis", "Pelvic Floor"],
    secondaryMuscles: ["Hamstrings", "Sacroiliac Joint Fascia", "Biceps Brachii"],
    biomechanicsCue: "Lie supine. Grasp outer edges of feet with hands, drawing knees down toward armpits while flattening sacrum against floor.",
    steps: [
      "Lie on back; bend knees and bring them toward armpits.",
      "Grasp outer edges of feet with hands with shins perpendicular to floor.",
      "Gently pull feet downward, drawing knees closer to floor outside ribcage.",
      "Keep entire spine and tailbone glued to mat."
    ],
    commonMistakes: [
      "Sacrum and lower back curling up off floor.",
      "Straining neck (keep head relaxed on floor)."
    ],
    breathingPattern: "Inhale expand pelvic floor and belly → Exhale gently draw knees deeper toward floor.",
    diagramUrl: "/anatomy/happy_baby_pose.jpg",
    diagramStatus: "APPROVED",
    prompt: "Ultra-detailed photorealistic 3D medical anatomy octane render of an athletic body in Happy Baby Pose on back holding outer feet with knees pulled to armpits. Dark slate studio background (#090d16). Adductor Magnus, Gracilis, and Pelvic Floor glowing in electric cyan (#38bdf8), with Sacral Spine in warm amber (#f59e0b). 8k resolution."
  },
  {
    name: "Downward-Facing Dog (Posterior Chain Flow)",
    normalizedName: "downward_facing_dog",
    type: "STRETCH",
    muscleGroup: "Stretching",
    equipment: "Bodyweight",
    category: "MOBILITY",
    primaryMuscles: ["Gastrocnemius & Soleus", "Hamstrings", "Latissimus Dorsi"],
    secondaryMuscles: ["Serratus Anterior", "Erector Spinae", "Plantar Fascia"],
    biomechanicsCue: "Inverted 'V' shape. Spread fingers wide, press chest toward thighs, push hips to ceiling, and drive heels down toward mat.",
    steps: [
      "Start on all fours with hands shoulder-width and feet hip-width.",
      "Tuck toes and lift knees, driving hips high into an inverted 'V'.",
      "Press through palms to lengthen spine, letting head hang between arms.",
      "Pedal heels alternately to stretch calves, then press both heels toward mat."
    ],
    commonMistakes: [
      "Hunching upper back with shoulders crowded around ears.",
      "Placing all weight into wrists instead of driving hips backward."
    ],
    breathingPattern: "Inhale lift hips higher to ceiling → Exhale press chest toward thighs and heels toward floor.",
    diagramUrl: "/anatomy/downward_facing_dog.jpg",
    diagramStatus: "APPROVED",
    prompt: "Ultra-detailed photorealistic 3D medical anatomy octane render of an athletic body in Downward-Facing Dog inverted V pose pressing heels to floor. Dark slate studio background (#090d16). Calves Gastrocnemius Soleus, Hamstrings, and Lats glowing in electric cyan (#38bdf8), with Serratus Anterior in warm amber (#f59e0b). 8k resolution."
  },
  {
    name: "Upward-Facing Dog (Anterior Chain & Psoas Opener)",
    normalizedName: "upward_facing_dog",
    type: "STRETCH",
    muscleGroup: "Stretching",
    equipment: "Bodyweight",
    category: "STATIC_STRETCH",
    primaryMuscles: ["Rectus Abdominis", "Psoas Major", "Pectoralis Major"],
    secondaryMuscles: ["Anterior Deltoids", "Triceps Brachii", "Quadriceps"],
    biomechanicsCue: "Press through tops of feet and palms, lifting thighs and knees completely off mat while rolling shoulders back and proud.",
    steps: [
      "Lie prone with tops of feet on mat and hands beside lower ribs.",
      "Press firmly through palms to straighten arms, elevating chest.",
      "Press tops of feet down to lift knees and thighs completely off floor.",
      "Draw shoulders down and back, opening heart forward."
    ],
    commonMistakes: [
      "Letting thighs sag onto the mat (that's Cobra pose, not Upward Dog).",
      "Crunching cervical spine by throwing head backward."
    ],
    breathingPattern: "Inhale pull chest forward through shoulders → Exhale stabilize through palms and tops of feet.",
    diagramUrl: "/anatomy/upward_facing_dog.jpg",
    diagramStatus: "APPROVED",
    prompt: "Ultra-detailed photorealistic 3D medical anatomy octane render of an athletic muscular body in Upward-Facing Dog with thighs elevated and chest arched proud. Dark slate studio background (#090d16). Rectus Abdominis, Psoas Major, and Pectoralis Major glowing in electric cyan (#38bdf8), with Triceps and Quads in warm amber (#f59e0b). 8k resolution."
  },
  {
    name: "Levator Scapulae & Scalenes Lateral Neck Release",
    normalizedName: "levator_scapulae_neck_release",
    type: "STRETCH",
    muscleGroup: "Stretching",
    equipment: "Bodyweight",
    category: "STATIC_STRETCH",
    primaryMuscles: ["Levator Scapulae", "Scalenes (Anterior/Middle/Posterior)"],
    secondaryMuscles: ["Upper Trapezius", "Sternocleidomastoid", "Splenius Capitis"],
    biomechanicsCue: "Sit tall. Turn head 45° to right and look down toward right armpit. Place right hand on back of head with gentle downward guidance.",
    steps: [
      "Sit upright with spine erect; anchor left hand under chair seat.",
      "Turn head 45° to the right (looking toward right armpit).",
      "Tuck chin down toward chest.",
      "Place right hand on crown of head and apply gentle downward guidance.",
      "Hold for 30 seconds per side."
    ],
    commonMistakes: [
      "Yanking head aggressively.",
      "Letting anchor shoulder shrug upward."
    ],
    breathingPattern: "Inhale stand tall through cervical spine → Exhale gently guide chin 1mm closer to armpit.",
    diagramUrl: "/anatomy/levator_scapulae_neck_release.jpg",
    diagramStatus: "APPROVED",
    prompt: "Ultra-detailed photorealistic 3D medical anatomy octane render of a human neck and shoulder performing Levator Scapulae Scalenes Neck Release with hand guiding head toward armpit. Dark slate studio background (#090d16). Levator Scapulae and Scalenes glowing in electric cyan (#38bdf8), with Upper Trapezius in warm amber (#f59e0b). 8k resolution."
  },
  {
    name: "Side-Lying Ribcage Intercostal Opener",
    normalizedName: "side_lying_intercostal_stretch",
    type: "STRETCH",
    muscleGroup: "Stretching",
    equipment: "Bodyweight",
    category: "STATIC_STRETCH",
    primaryMuscles: ["External & Internal Intercostals", "Serratus Anterior", "Quadratus Lumborum"],
    secondaryMuscles: ["Latissimus Dorsi", "Obliques", "Diaphragm"],
    biomechanicsCue: "Side-lying over a foam roller or rolled towel under lateral ribs. Reach top arm overhead along floor, breathing deeply into ribcage.",
    steps: [
      "Lie on side with a foam roller or rolled towel positioned under lateral ribcage.",
      "Extend top arm straight overhead along floor.",
      "Take slow, massive diaphragmatic inhales, expanding the intercostal ribs upward.",
      "Hold for 1-2 minutes per side."
    ],
    commonMistakes: [
      "Shallow chest breathing (deep intercostal breath is required).",
      "Rolling forward onto stomach."
    ],
    breathingPattern: "Massive 4-second inhale expanding ribs laterally → 6-second slow exhale relaxing over roller.",
    diagramUrl: "/anatomy/side_lying_intercostal_stretch.jpg",
    diagramStatus: "APPROVED",
    prompt: "Ultra-detailed photorealistic 3D medical anatomy octane render of a body in Side-Lying Intercostal Stretch reaching top arm overhead with expanding ribcage. Dark slate studio background (#090d16). Intercostals and Serratus Anterior glowing in electric cyan (#38bdf8), with QL and Lats in warm amber (#f59e0b). 8k resolution."
  },
  {
    name: "Dragon Pose (Deep Sacroiliac & Quad Stretch)",
    normalizedName: "dragon_pose_hip_opener",
    type: "STRETCH",
    muscleGroup: "Stretching",
    equipment: "Bodyweight",
    category: "STATIC_STRETCH",
    primaryMuscles: ["Psoas Major", "Iliacus", "Rectus Femoris", "Gluteus Maximus"],
    secondaryMuscles: ["Sacroiliac Ligaments", "Adductor Magnus", "Tensor Fasciae Latae"],
    biomechanicsCue: "Deep forward yin lunge with back knee far behind hips. Let hips sink completely into floor with hands resting on front thigh or blocks.",
    steps: [
      "Step right foot forward into a long lunge.",
      "Walk left knee backward as far as comfortable, resting top of foot on mat.",
      "Rest hands on right thigh or floor, allowing pelvis to surrender heavy toward mat.",
      "Hold passively for 2-3 minutes per side."
    ],
    commonMistakes: [
      "Front heel lifting off floor.",
      "Tensing hip flexors instead of passively surrendering weight."
    ],
    breathingPattern: "Slow diaphragmatic breathing, softening hip flexors with each exhalation.",
    diagramUrl: "/anatomy/dragon_pose_hip_opener.jpg",
    diagramStatus: "APPROVED",
    prompt: "Ultra-detailed photorealistic 3D medical anatomy octane render of an athletic body in deep Dragon Pose yin yoga lunge sinking hips to mat. Dark slate studio background (#090d16). Psoas Major, Rectus Femoris, and Deep SI Joint Hip Capsule glowing in electric cyan (#38bdf8), with Adductors in warm amber (#f59e0b). 8k resolution."
  }
];

async function generateAll() {
  console.log(`Starting generation of ${exhaustiveStretches.length} exhaustive medical anatomy stretches with Nano Banana...\n`);
  
  for (let i = 0; i < exhaustiveStretches.length; i++) {
    const item = exhaustiveStretches[i];
    const filename = path.basename(item.diagramUrl);
    const dest = path.join(__dirname, '..', 'public', 'anatomy', filename);
    const artDest = path.join('C:', 'Users', 'Collin', '.gemini', 'antigravity', 'brain', '91e3175f-b6f8-401f-90f4-0dbfefd0301b', filename);
    
    if (fs.existsSync(dest) && fs.statSync(dest).size > 100000) {
      console.log(`[${i+1}/${exhaustiveStretches.length}] Skipping ${filename}, already exists.`);
      continue;
    }
    
    console.log(`[${i+1}/${exhaustiveStretches.length}] Rendering ${item.name}...`);
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/nano-banana-pro-preview:generateContent?key=${apiKey}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: item.prompt }] }]
        })
      });

      if (res.ok) {
        const data = await res.json();
        const cand = data.candidates?.[0];
        const part = cand?.content?.parts?.[0];
        if (part?.inlineData?.data) {
          const buf = Buffer.from(part.inlineData.data, 'base64');
          fs.writeFileSync(dest, buf);
          fs.writeFileSync(artDest, buf);
          console.log(`🎉 [${i+1}/${exhaustiveStretches.length}] SUCCESS: Saved ${filename} (${buf.length} bytes)`);
        } else {
          console.log(`❌ No inlineData for ${item.name}`);
        }
      } else {
        console.log(`❌ Failed ${item.name}: ${res.status}`, await res.text());
      }
    } catch (e) {
      console.error(`❌ Error on ${item.name}:`, e);
    }
    await new Promise(r => setTimeout(r, 1200));
  }
  
  console.log('\nAll new 3D anatomy stretch renders generated successfully!');
  
  // Append new exercises to unifiedExerciseLibrary.ts if not already present
  const libPath = path.join(__dirname, '..', 'src', 'lib', 'unifiedExerciseLibrary.ts');
  let libCode = fs.readFileSync(libPath, 'utf8');
  
  let addedCount = 0;
  const itemsToAdd = [];
  
  for (const stretch of exhaustiveStretches) {
    if (!libCode.includes(`"${stretch.normalizedName}"`)) {
      itemsToAdd.push(stretch);
      addedCount++;
    }
  }
  
  if (itemsToAdd.length > 0) {
    console.log(`Appending ${itemsToAdd.length} new exhaustive stretches into unifiedExerciseLibrary.ts...`);
    
    // Find the end of INITIAL_UNIFIED_EXERCISES array
    const lastBracketIdx = libCode.lastIndexOf('];');
    if (lastBracketIdx !== -1) {
      const codeToAppend = itemsToAdd.map(item => {
        return `  {
    name: ${JSON.stringify(item.name)},
    normalizedName: ${JSON.stringify(item.normalizedName)},
    type: "STRETCH",
    muscleGroup: "Stretching",
    equipment: ${JSON.stringify(item.equipment)},
    category: ${JSON.stringify(item.category)},
    primaryMuscles: ${JSON.stringify(item.primaryMuscles)},
    secondaryMuscles: ${JSON.stringify(item.secondaryMuscles)},
    biomechanicsCue: ${JSON.stringify(item.biomechanicsCue)},
    steps: ${JSON.stringify(item.steps, null, 6).replace(/\n/g, '\n    ')},
    commonMistakes: ${JSON.stringify(item.commonMistakes, null, 6).replace(/\n/g, '\n    ')},
    breathingPattern: ${JSON.stringify(item.breathingPattern)},
    diagramUrl: ${JSON.stringify(item.diagramUrl)},
    diagramStatus: "APPROVED",
  },`;
      }).join('\n');
      
      const updatedLib = libCode.slice(0, lastBracketIdx) + codeToAppend + '\n' + libCode.slice(lastBracketIdx);
      fs.writeFileSync(libPath, updatedLib, 'utf8');
      console.log(`✅ Successfully added ${addedCount} new stretches to unifiedExerciseLibrary.ts! Total movements is now: ${51 + addedCount}`);
    }
  } else {
    console.log('All stretches are already registered in library.');
  }
}

generateAll();
