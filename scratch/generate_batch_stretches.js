const fs = require('fs');
const path = require('path');

const apiKey = 'process.env.GEMINI_API_KEY';

const queue = [
  {
    name: "Plank",
    filename: "plank.jpg",
    prompt: "Ultra-detailed photorealistic 3D medical anatomy octane render of an athletic man performing a prone forearm plank. Straight horizontal spine with braced core. Dark studio background (#090d16). Rectus Abdominis, Transverse Abdominis, and Obliques glowing brightly in electric cyan (#38bdf8), with Gluteus Maximus and Quadriceps in warm amber (#f59e0b). 8k resolution."
  },
  {
    name: "Back Hyperextension",
    filename: "back_hyperextension.jpg",
    prompt: "Ultra-detailed photorealistic 3D medical anatomy octane render of an athletic man on a 45 degree roman chair performing a back hyperextension extending hips to neutral. Dark studio background (#090d16). Erector Spinae (spinalis, longissimus, iliocostalis) and Gluteus Maximus glowing in electric cyan (#38bdf8), with Hamstrings in warm amber (#f59e0b). 8k resolution."
  },
  {
    name: "QL Extension",
    filename: "ql_extension.jpg",
    prompt: "Ultra-detailed photorealistic 3D medical anatomy octane render of an athletic man performing a side-lying Roman chair lateral trunk raise (QL extension). Dark studio background (#090d16). Quadratus Lumborum and Internal/External Obliques glowing in electric cyan (#38bdf8), with Gluteus Medius in warm amber (#f59e0b). 8k resolution."
  },
  {
    name: "Band Shoulder Dislocates",
    filename: "band_pass_throughs.jpg",
    prompt: "Ultra-detailed photorealistic 3D medical anatomy octane render of an athletic man performing shoulder pass-through dislocates with a resistance band in full overhead rotational arc. Dark studio background (#090d16). Rotator cuff (Subscapularis, Infraspinatus, Teres Minor, Supraspinatus) glowing in electric cyan (#38bdf8), with Anterior/Posterior Deltoids in warm amber (#f59e0b). 8k resolution."
  },
  {
    name: "Lat Hang Stretch",
    filename: "lat_stretch.jpg",
    prompt: "Ultra-detailed photorealistic 3D medical anatomy octane render of an athletic man performing a single-arm bar lat hang stretch with lateral ribcage expansion. Dark studio background (#090d16). Latissimus Dorsi and Teres Major on full lengthened stretch glowing in electric cyan (#38bdf8), with Intercostals in warm amber (#f59e0b). 8k resolution."
  },
  {
    name: "Child's Pose Lat Stretch",
    filename: "childs_pose.jpg",
    prompt: "Ultra-detailed photorealistic 3D medical anatomy octane render of an athletic body in yoga child's pose on a mat with hips sunk back onto heels and fingertips reaching forward. Dark studio background (#090d16). Latissimus Dorsi and Thoracolumbar Fascia glowing in electric cyan (#38bdf8), with Posterior Deltoids and Glutes in warm amber (#f59e0b). 8k resolution."
  },
  {
    name: "Upper Trap Neck Stretch",
    filename: "neck_trap_stretch.jpg",
    prompt: "Ultra-detailed photorealistic 3D medical anatomy octane render of a human neck and shoulder performing a lateral head tilt upper trap and levator scapulae stretch. Dark studio background (#090d16). Upper Trapezius and Levator Scapulae glowing in electric cyan (#38bdf8), with Sternocleidomastoid in warm amber (#f59e0b). 8k resolution."
  },
  {
    name: "Cat-Cow Spine Mobility",
    filename: "cat_cow.jpg",
    prompt: "Ultra-detailed photorealistic 3D medical anatomy octane render of a human spine on all fours quadruped position in cat-cow spinal flexion and extension. Dark studio background (#090d16). Erector Spinae and Multifidus glowing in electric cyan (#38bdf8), with Rectus Abdominis in warm amber (#f59e0b). 8k resolution."
  },
  {
    name: "Foam Roll Thoracic Spine",
    filename: "foam_roll_thoracic.jpg",
    prompt: "Ultra-detailed photorealistic 3D medical anatomy octane render of an athletic body foam rolling the thoracic mid-spine with arms crossed over chest. Dark studio background (#090d16). Thoracic Erector Spinae, Rhomboids, and Middle Trapezius glowing in electric cyan (#38bdf8), with Posterior Ribcage in warm amber (#f59e0b). 8k resolution."
  },
  {
    name: "Thread the Needle",
    filename: "thread_the_needle.jpg",
    prompt: "Ultra-detailed photorealistic 3D medical anatomy octane render of a body in quadruped position threading one arm under torso across the floor in deep thoracic spine rotation. Dark studio background (#090d16). Thoracic Spine Rotators and Posterior Deltoid glowing in electric cyan (#38bdf8), with Rhomboids in warm amber (#f59e0b). 8k resolution."
  },
  {
    name: "Standing Quad Stretch",
    filename: "standing_quad_stretch.jpg",
    prompt: "Ultra-detailed photorealistic 3D medical anatomy octane render of an athletic body in standing quad stretch pulling heel to glute with knees pinned side by side. Dark studio background (#090d16). Quadriceps (Rectus Femoris, Vastus Lateralis/Medialis) glowing in electric cyan (#38bdf8), with Iliopsoas in warm amber (#f59e0b). 8k resolution."
  },
  {
    name: "Frog Stretch",
    filename: "frog_stretch.jpg",
    prompt: "Ultra-detailed photorealistic 3D medical anatomy octane render of an athletic body in deep frog stretch with knees spread wide and forearms on mat. Dark studio background (#090d16). Adductor Longus, Magnus, and Gracilis glowing in electric cyan (#38bdf8), with Deep Hip Rotators in warm amber (#f59e0b). 8k resolution."
  },
  {
    name: "Figure 4 Glute Stretch",
    filename: "figure4_stretch.jpg",
    prompt: "Ultra-detailed photorealistic 3D medical anatomy octane render of a body in supine figure 4 stretch with ankle crossed over opposite knee pulling thigh to chest. Dark studio background (#090d16). Piriformis and Gluteus Medius glowing in electric cyan (#38bdf8), with Gluteus Maximus in warm amber (#f59e0b). 8k resolution."
  },
  {
    name: "90/90 Hip Mobility",
    filename: "hip_90_90.jpg",
    prompt: "Ultra-detailed photorealistic 3D medical anatomy octane render of a seated body in 90/90 hip mobility position with both knees bent at 90 degrees. Dark studio background (#090d16). Hip internal and external rotators and Gluteus Medius glowing in electric cyan (#38bdf8), with Piriformis and Adductors in warm amber (#f59e0b). 8k resolution."
  },
  {
    name: "Standing Hamstring Fold",
    filename: "hamstring_fold.jpg",
    prompt: "Ultra-detailed photorealistic 3D medical anatomy octane render of an athletic body in standing hamstring forward fold hinging at hips reaching towards toes. Dark studio background (#090d16). Hamstrings (Semitendinosus, Semimembranosus, Biceps Femoris) glowing in electric cyan (#38bdf8), with Gastrocnemius and Glutes in warm amber (#f59e0b). 8k resolution."
  },
  {
    name: "Butterfly Stretch",
    filename: "butterfly_stretch.jpg",
    prompt: "Ultra-detailed photorealistic 3D medical anatomy octane render of a seated body in butterfly stretch with soles of feet together and knees pressed toward floor. Dark studio background (#090d16). Adductor Brevis, Longus, and Pectineus glowing in electric cyan (#38bdf8), with Gracilis in warm amber (#f59e0b). 8k resolution."
  },
  {
    name: "Calf Wall Stretch",
    filename: "calf_stretch.jpg",
    prompt: "Ultra-detailed photorealistic 3D medical anatomy octane render of a lower leg in calf wall stretch with straight rear knee and flat heel on floor. Dark studio background (#090d16). Gastrocnemius and Soleus glowing in electric cyan (#38bdf8), with Achilles Tendon in warm amber (#f59e0b). 8k resolution."
  },
  {
    name: "Cross-Body Shoulder Stretch",
    filename: "shoulder_crossbody.jpg",
    prompt: "Ultra-detailed photorealistic 3D medical anatomy octane render of a shoulder performing cross-body posterior deltoid stretch with arm pulled horizontally across chest. Dark studio background (#090d16). Posterior Deltoid and Infraspinatus glowing in electric cyan (#38bdf8), with Rhomboids in warm amber (#f59e0b). 8k resolution."
  },
  {
    name: "Sleeper Stretch",
    filename: "sleeper_stretch.jpg",
    prompt: "Ultra-detailed photorealistic 3D medical anatomy octane render of a side-lying shoulder in sleeper stretch internally rotating forearm toward floor at 90 degree elbow bend. Dark studio background (#090d16). Infraspinatus and Teres Minor posterior capsule glowing in electric cyan (#38bdf8). 8k resolution."
  },
  {
    name: "Overhead Triceps Stretch",
    filename: "tricep_stretch.jpg",
    prompt: "Ultra-detailed photorealistic 3D medical anatomy octane render of an arm in overhead triceps stretch with elbow bent behind head. Dark studio background (#090d16). Triceps Brachii (Long Head) glowing in electric cyan (#38bdf8), with Latissimus Dorsi in warm amber (#f59e0b). 8k resolution."
  },
  {
    name: "Biceps Wall Stretch",
    filename: "bicep_stretch.jpg",
    prompt: "Ultra-detailed photorealistic 3D medical anatomy octane render of an arm in standing biceps wall stretch with palm flat on wall rotating chest away. Dark studio background (#090d16). Biceps Brachii and Brachialis glowing in electric cyan (#38bdf8), with Anterior Deltoid in warm amber (#f59e0b). 8k resolution."
  },
  {
    name: "Wrist Mobility Flow",
    filename: "wrist_mobility.jpg",
    prompt: "Ultra-detailed photorealistic 3D medical anatomy octane render of wrists on all fours in quadruped wrist flexor and extensor mobility stretch. Dark studio background (#090d16). Forearm Flexor and Extensor muscle bellies glowing in electric cyan (#38bdf8), with Pronator Teres in warm amber (#f59e0b). 8k resolution."
  },
  {
    name: "Cobra Stretch",
    filename: "cobra_stretch.jpg",
    prompt: "Ultra-detailed photorealistic 3D medical anatomy octane render of a body in yoga cobra pose prone with chest arched upward and hips anchored to mat. Dark studio background (#090d16). Rectus Abdominis and Linea Alba glowing in electric cyan (#38bdf8), with Psoas Major in warm amber (#f59e0b). 8k resolution."
  },
  {
    name: "QL Side Bend Stretch",
    filename: "ql_stretch.jpg",
    prompt: "Ultra-detailed photorealistic 3D medical anatomy octane render of a body in lateral side bend reach opening the lateral flank. Dark studio background (#090d16). Quadratus Lumborum and Obliques glowing in electric cyan (#38bdf8), with Latissimus Dorsi in warm amber (#f59e0b). 8k resolution."
  },
  {
    name: "Supine Spinal Twist",
    filename: "supine_twist.jpg",
    prompt: "Ultra-detailed photorealistic 3D medical anatomy octane render of a body in supine spinal twist with one knee crossed over torso to floor and opposite arm extended. Dark studio background (#090d16). Spinal Rotators, Multifidus, and Gluteus Medius glowing in electric cyan (#38bdf8), with Obliques in warm amber (#f59e0b). 8k resolution."
  },
  {
    name: "World's Greatest Stretch",
    filename: "worlds_greatest.jpg",
    prompt: "Ultra-detailed photorealistic 3D medical anatomy octane render of a body performing the World's Greatest Stretch in deep runner's lunge with inside elbow dropped and top arm rotated to ceiling. Dark studio background (#090d16). Hip Flexors, Thoracic Spine, and Hamstrings glowing in electric cyan (#38bdf8), with Adductors and Calves in warm amber (#f59e0b). 8k resolution."
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
  console.log('All remaining 3D medical renders completed!');
}

runQueue();
