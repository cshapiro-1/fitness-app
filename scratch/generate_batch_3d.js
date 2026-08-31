const fs = require('fs');
const path = require('path');

const apiKey = 'process.env.GEMINI_API_KEY';

const queue = [
  {
    name: "Flat Dumbbell Press",
    filename: "flat_dumbbell_press.jpg",
    prompt: "Ultra-detailed photorealistic 3D medical anatomy octane render of an athletic muscular man performing a flat bench dumbbell press at the peak extension. Dumbbells pressed over chest with elbows at 45 degrees. Dark studio background (#090d16). Pectoralis major (mid and sternal heads) glowing in electric cyan (#38bdf8), with anterior deltoids and triceps in warm amber (#f59e0b). 8k resolution, accurate kinesiology."
  },
  {
    name: "Push-Up",
    filename: "push_up.jpg",
    prompt: "Ultra-detailed photorealistic 3D medical anatomy octane render of an athletic man performing a standard floor push-up at mid-rep. Plank body line from crown of head to heels, elbows tucked at 45 degrees. Dark studio background (#090d16). Pectoralis major and triceps brachii glowing in electric cyan (#38bdf8), rectus abdominis and anterior deltoids in warm amber (#f59e0b). 8k resolution, cinematic lighting."
  },
  {
    name: "Pull-Up",
    filename: "pull_up.jpg",
    prompt: "Ultra-detailed photorealistic 3D medical anatomy octane render of an athletic muscular man performing a pull-up on a straight bar at the top position with chin cleared over the bar. Wide scapular depression and retraction. Dark studio background (#090d16). Latissimus dorsi and teres major glowing brightly in electric cyan (#38bdf8), biceps brachii and middle trapezius in warm amber (#f59e0b). 8k resolution."
  },
  {
    name: "Barbell Bent-Over Row",
    filename: "barbell_row.jpg",
    prompt: "Ultra-detailed photorealistic 3D medical anatomy octane render of an athletic man performing a bent-over barbell row with torso hinged at 45 degrees. Barbell pulled smoothly to the lower ribcage. Dark studio background (#090d16). Latissimus dorsi and rhomboids glowing in electric cyan (#38bdf8), posterior deltoids and spinal erectors in warm amber (#f59e0b). 8k resolution."
  },
  {
    name: "Cable Face Pull",
    filename: "face_pull.jpg",
    prompt: "Ultra-detailed photorealistic 3D medical anatomy octane render of an athletic man performing a cable rope face pull to the eye line with external shoulder rotation. Dark studio background (#090d16). Posterior deltoids, infraspinatus, and teres minor glowing in electric cyan (#38bdf8), middle and lower trapezius in warm amber (#f59e0b). 8k resolution."
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
    // Brief pause to ensure clean rate pacing
    await new Promise(r => setTimeout(r, 1000));
  }
  console.log('Batch complete!');
}

runQueue();
