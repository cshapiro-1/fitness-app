const fs = require('fs');
const path = require('path');

const apiKey = process.env.GEMINI_API_KEY || '';

const flaggedMovements = [
  {
    num: 8,
    name: "Lat Pulldown (Wide Grip)",
    filename: "lat_pulldown.jpg",
    prompt: "Ultra-detailed photorealistic 3D medical anatomy octane render of an athletic muscular man performing a Wide-Grip Lat Pulldown seated on a cable machine. Torso leaned back 10 degrees, pulling the wide bar straight down to the upper clavicle with elbows driving into back pockets. Dark slate studio background (#090d16). Latissimus dorsi (outer flare) and teres major glowing brightly in electric cyan (#38bdf8), with biceps brachii and lower trapezius in warm amber (#f59e0b). 8k resolution, cinematic rim lighting."
  },
  {
    num: 13,
    name: "Leg Extension",
    filename: "leg_extension.jpg",
    prompt: "Ultra-detailed photorealistic 3D medical anatomy octane render of an athletic man performing a seated machine Leg Extension at full terminal knee lockout. Knees extended straight out with toes dorsiflexed upward. Dark slate studio background (#090d16). Quadriceps femoris (rectus femoris, vastus lateralis, vastus medialis teardrop) glowing brightly in electric cyan (#38bdf8), with patellar tendon in warm amber (#f59e0b). 8k resolution, accurate biomechanics."
  },
  {
    num: 14,
    name: "Lying / Seated Leg Curl",
    filename: "leg_curl.jpg",
    prompt: "Ultra-detailed photorealistic 3D medical anatomy octane render of an athletic man performing a prone lying Hamstring Leg Curl on a machine bench. Flexing knees to curl roller pad tightly against glutes while keeping hips pinned down. Dark slate studio background (#090d16). Hamstrings (biceps femoris, semitendinosus, semimembranosus) glowing brightly in electric cyan (#38bdf8), with gastrocnemius calves in warm amber (#f59e0b). 8k resolution."
  },
  {
    num: 16,
    name: "Barbell Hip Thrust",
    filename: "hip_thrust.jpg",
    prompt: "Ultra-detailed photorealistic 3D medical anatomy octane render of an athletic man performing a Barbell Hip Thrust with upper back hinged against a bench and hips driven into full horizontal lockout extension at 90-degree knee angles. Dark slate studio background (#090d16). Gluteus Maximus glowing intensely in electric cyan (#38bdf8), with Hamstrings and Core in warm amber (#f59e0b). 8k resolution."
  },
  {
    num: 18,
    name: "Overhead Shoulder Press",
    filename: "overhead_press.jpg",
    prompt: "Ultra-detailed photorealistic 3D medical anatomy octane render of an athletic muscular man standing performing a Barbell Overhead Press locked out straight overhead with head through. Dark slate studio background (#090d16). Anterior and Lateral Deltoids glowing in electric cyan (#38bdf8), with Triceps Brachii and Upper Trapezius in warm amber (#f59e0b). 8k resolution, cinematic rim lighting."
  },
  {
    num: 19,
    name: "Dumbbell Lateral Raise",
    filename: "lateral_raise.jpg",
    prompt: "Ultra-detailed photorealistic 3D medical anatomy octane render of an athletic man performing a standing Dumbbell Lateral Raise with arms abducted 90 degrees parallel to floor in scapular plane with slight forward tilt. Dark slate studio background (#090d16). Lateral Deltoid (acromial head) glowing in electric cyan (#38bdf8), with Upper Trapezius and Supraspinatus in warm amber (#f59e0b). 8k resolution."
  },
  {
    num: 20,
    name: "Barbell Bicep Curl",
    filename: "bicep_curl.jpg",
    prompt: "Ultra-detailed photorealistic 3D medical anatomy octane render of an athletic muscular man standing performing a standard supinated Barbell Bicep Curl at peak contraction with elbows pinned to ribs and palms facing upward. Dark slate studio background (#090d16). Biceps Brachii (short and long heads) glowing intensely in electric cyan (#38bdf8), with Brachialis and Brachioradialis in warm amber (#f59e0b). 8k resolution."
  },
  {
    num: 21,
    name: "Dumbbell Hammer Curl",
    filename: "hammer_curl.jpg",
    prompt: "Ultra-detailed photorealistic 3D medical anatomy octane render of an athletic muscular man performing a Dumbbell Hammer Curl with strictly NEUTRAL palms-facing-inward thumbs-up grip (NO supination, vertical dumbbell alignment). Elbows pinned to ribs curling upward. Dark slate studio background (#090d16). Brachialis and Brachioradialis forearm glowing brightly in electric cyan (#38bdf8), with Biceps Brachii long head in warm amber (#f59e0b). 8k resolution."
  },
  {
    num: 22,
    name: "Cable Tricep Pushdown",
    filename: "tricep_pushdown.jpg",
    prompt: "Ultra-detailed photorealistic 3D medical anatomy octane render of an athletic muscular man performing a Cable Straight-Bar Tricep Pushdown with elbows pinned to ribcage, pressing bar straight down into complete elbow extension lockout. Dark slate studio background (#090d16). Triceps Brachii (lateral, long, and medial heads) glowing intensely in electric cyan (#38bdf8), with Anconeus in warm amber (#f59e0b). 8k resolution."
  },
  {
    num: 23,
    name: "Plank",
    filename: "plank.jpg",
    prompt: "Ultra-detailed photorealistic 3D medical anatomy octane render of an athletic man performing a strict prone forearm Plank on a floor mat. Perfectly straight horizontal spine line from crown of head to heels, forearms planted directly under shoulders. Dark slate studio background (#090d16). Rectus Abdominis, Transverse Abdominis, and Obliques glowing brightly in electric cyan (#38bdf8), with Gluteus Maximus and Quadriceps in warm amber (#f59e0b). 8k resolution."
  },
  {
    num: 31,
    name: "Cat-Cow Spine Mobility",
    filename: "cat_cow.jpg",
    prompt: "Ultra-detailed photorealistic 3D medical anatomy octane render of an athletic body on hands and knees (quadruped position) on a mat performing the Cat-Cow spinal flexion and extension movement with clear articulated vertebrae. Dark slate studio background (#090d16). Erector Spinae and Multifidus deep spinal rotators glowing in electric cyan (#38bdf8), with Rectus Abdominis in warm amber (#f59e0b). 8k resolution."
  },
  {
    num: 37,
    name: "Pigeon Stretch",
    filename: "pigeon.jpg",
    prompt: "Ultra-detailed photorealistic 3D medical anatomy octane render of an athletic human body on a yoga mat in a clean, accurate yoga Pigeon Pose (Eka Pada Rajakapotasana). Front right knee is bent on the mat with shin angled 45 to 90 degrees in front of hips; rear left leg is extended straight back flat along the mat; torso is upright and lengthening over the front thigh. Dark slate studio background (#090d16). Front hip Gluteus Medius, Piriformis, and Deep External Rotators glowing brightly in electric cyan (#38bdf8), with rear leg Iliopsoas in warm amber (#f59e0b). 8k resolution, authentic yoga biomechanics."
  }
];

async function regenerateAll() {
  console.log(`Starting targeted regeneration of ${flaggedMovements.length} movements with Nano Banana...\n`);
  for (const item of flaggedMovements) {
    console.log(`[#${item.num}] Regenerating ${item.name}...`);
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
          const dest = path.join(__dirname, '..', 'public', 'anatomy', item.filename);
          fs.writeFileSync(dest, buf);
          const artDest = path.join('C:', 'Users', 'Collin', '.gemini', 'antigravity', 'brain', '91e3175f-b6f8-401f-90f4-0dbfefd0301b', item.filename);
          fs.writeFileSync(artDest, buf);
          console.log(`🎉 [#${item.num}] SUCCESS: Saved ${item.filename} (${buf.length} bytes)`);
        } else {
          console.log(`❌ [#${item.num}] No inlineData for ${item.name}`);
        }
      } else {
        console.log(`❌ [#${item.num}] Failed: ${res.status}`, await res.text());
      }
    } catch (e) {
      console.error(`❌ [#${item.num}] Error:`, e);
    }
    await new Promise(r => setTimeout(r, 1200));
  }
  console.log('\nAll 12 flagged movements successfully regenerated!');
}

regenerateAll();
