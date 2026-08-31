const fs = require('fs');
const path = require('path');

const apiKey = 'process.env.GEMINI_API_KEY';

const prompt = `Ultra-detailed photorealistic 3D medical anatomy octane render of an athletic muscular man performing an Incline Barbell Bench Press on a 30 to 45 degree inclined bench. Lowering the barbell to the upper clavicular chest notch with tucked elbows. Dark studio background (#090d16). Clavicular upper pectoralis major glowing brightly in electric cyan (#38bdf8), with anterior deltoids and triceps glowing in warm amber (#f59e0b). Anatomically accurate muscular striations, cinematic lighting, 8k resolution.`;

async function generate() {
  console.log('Generating Incline Barbell Bench Press render with Nano Banana...');
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/nano-banana-pro-preview:generateContent?key=${apiKey}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    if (res.ok) {
      const data = await res.json();
      const candidates = data.candidates || [];
      for (const cand of candidates) {
        const parts = cand.content?.parts || [];
        for (const part of parts) {
          if (part.inlineData?.data) {
            const buf = Buffer.from(part.inlineData.data, 'base64');
            const dest = path.join(__dirname, '..', 'public', 'anatomy', 'incline_bench.jpg');
            fs.writeFileSync(dest, buf);
            const artDest = path.join('C:', 'Users', 'Collin', '.gemini', 'antigravity', 'brain', '91e3175f-b6f8-401f-90f4-0dbfefd0301b', 'incline_bench_3d.jpg');
            fs.writeFileSync(artDest, buf);
            console.log(`🎉 SUCCESS! Saved incline_bench.jpg (${buf.length} bytes)`);
            return;
          }
        }
      }
    } else {
      console.log('Failed:', res.status, await res.text());
    }
  } catch (err) {
    console.error('Error:', err);
  }
}

generate();
