const fs = require('fs');
const path = require('path');

const apiKey = 'process.env.GEMINI_API_KEY';

const queue = [
  {
    name: "Bulgarian Split Squat",
    filename: "bulgarian_split_squat.jpg",
    prompt: "Ultra-detailed photorealistic 3D medical anatomy octane render of an athletic muscular man performing a Bulgarian Split Squat with rear foot elevated on a bench, descending into a 90 degree front knee bend. Dark studio background (#090d16). Front leg Quadriceps Femoris and Gluteus Maximus glowing brightly in electric cyan (#38bdf8), with Adductors and Hamstrings in warm amber (#f59e0b). 8k resolution, accurate biomechanics."
  },
  {
    name: "Leg Extension",
    filename: "leg_extension.jpg",
    prompt: "Ultra-detailed photorealistic 3D medical anatomy octane render of an athletic man performing a seated machine leg extension at full terminal knee extension lockout. Dark studio background (#090d16). Quadriceps (rectus femoris, vastus lateralis, vastus medialis teardrop) glowing brightly in electric cyan (#38bdf8), with patellar tendon and anterior tibialis in warm amber (#f59e0b). 8k resolution."
  },
  {
    name: "Lying / Seated Leg Curl",
    filename: "leg_curl.jpg",
    prompt: "Ultra-detailed photorealistic 3D medical anatomy octane render of an athletic man performing a leg curl machine flexing knees with heels pulled to glutes. Dark studio background (#090d16). Hamstrings (biceps femoris, semitendinosus, semimembranosus) glowing brightly in electric cyan (#38bdf8), with gastrocnemius calves in warm amber (#f59e0b). 8k resolution."
  },
  {
    name: "Standing Calf Raise",
    filename: "standing_calf_raise.jpg",
    prompt: "Ultra-detailed photorealistic 3D medical anatomy octane render of an athletic muscular lower leg and calf performing a standing calf raise at the peak apex on the balls of the feet. Dark studio background (#090d16). Gastrocnemius (medial and lateral heads) and Soleus glowing brightly in electric cyan (#38bdf8), with Achilles tendon in warm amber (#f59e0b). 8k resolution."
  },
  {
    name: "Barbell Hip Thrust",
    filename: "hip_thrust.jpg",
    prompt: "Ultra-detailed photorealistic 3D medical anatomy octane render of an athletic man performing a barbell hip thrust with upper back against a bench and hips locked out into full extension at 90 degree knee angle. Dark studio background (#090d16). Gluteus Maximus glowing intensely in electric cyan (#38bdf8), with Hamstrings and Core in warm amber (#f59e0b). 8k resolution."
  },
  {
    name: "Romanian Deadlift (RDL)",
    filename: "romanian_deadlift.jpg",
    prompt: "Ultra-detailed photorealistic 3D medical anatomy octane render of an athletic man performing a Romanian Deadlift holding dumbbells/barbell with deep hip hinge and soft knees at shin level. Dark studio background (#090d16). Hamstrings and Gluteus Maximus under loaded eccentric stretch glowing in electric cyan (#38bdf8), with Erector Spinae and Lats in warm amber (#f59e0b). 8k resolution."
  },
  {
    name: "Overhead Shoulder Press",
    filename: "overhead_press.jpg",
    prompt: "Ultra-detailed photorealistic 3D medical anatomy octane render of an athletic muscular man performing a standing barbell overhead shoulder press at full lockout overhead. Dark studio background (#090d16). Anterior and Lateral Deltoids glowing in electric cyan (#38bdf8), with Triceps Brachii and Upper Trapezius in warm amber (#f59e0b). 8k resolution."
  },
  {
    name: "Dumbbell Lateral Raise",
    filename: "lateral_raise.jpg",
    prompt: "Ultra-detailed photorealistic 3D medical anatomy octane render of an athletic man performing a dumbbell lateral raise with arms abducted to 90 degrees parallel to the floor. Dark studio background (#090d16). Lateral Deltoid (acromial head) glowing in electric cyan (#38bdf8), with Upper Trapezius and Supraspinatus in warm amber (#f59e0b). 8k resolution."
  },
  {
    name: "Barbell Bicep Curl",
    filename: "bicep_curl.jpg",
    prompt: "Ultra-detailed photorealistic 3D medical anatomy octane render of an athletic muscular arm performing a standing barbell bicep curl at peak contraction with elbows pinned to ribs. Dark studio background (#090d16). Biceps Brachii (long and short heads) glowing intensely in electric cyan (#38bdf8), with Brachialis and Brachioradialis in warm amber (#f59e0b). 8k resolution."
  },
  {
    name: "Dumbbell Hammer Curl",
    filename: "hammer_curl.jpg",
    prompt: "Ultra-detailed photorealistic 3D medical anatomy octane render of an athletic arm performing a neutral grip dumbbell hammer curl. Dark studio background (#090d16). Brachialis and Brachioradialis forearm glowing in electric cyan (#38bdf8), with Biceps Brachii long head in warm amber (#f59e0b). 8k resolution."
  },
  {
    name: "Cable Tricep Pushdown",
    filename: "tricep_pushdown.jpg",
    prompt: "Ultra-detailed photorealistic 3D medical anatomy octane render of an athletic muscular arm performing a cable straight-bar tricep pushdown at full elbow lockout. Dark studio background (#090d16). Triceps Brachii (lateral, long, and medial heads) glowing intensely in electric cyan (#38bdf8), with Anconeus and Core in warm amber (#f59e0b). 8k resolution."
  }
];

async function runQueue() {
  for (const item of queue) {
    const dest = path.join(__dirname, '..', 'public', 'anatomy', item.filename);
    if (fs.existsSync(dest) && fs.statSync(dest).size > 100000) {
      console.log(`Skipping ${item.filename}, already rendered.`);
      continue;
    }
    console.log(`Rendering ${item.name}...`);
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
          const artDest = path.join('C:', 'Users', 'Collin', '.gemini', 'antigravity', 'brain', '91e3175f-b6f8-401f-90f4-0dbfefd0301b', item.filename);
          fs.writeFileSync(artDest, buf);
          console.log(`🎉 SUCCESS: Saved ${item.filename} (${buf.length} bytes)`);
        } else {
          console.log(`No image in response for ${item.name}`);
        }
      } else {
        console.log(`Failed ${item.name}:`, res.status, await res.text());
      }
    } catch (e) {
      console.error(`Error on ${item.name}:`, e);
    }
    await new Promise(r => setTimeout(r, 1000));
  }
  console.log('Batch complete!');
}

runQueue();
