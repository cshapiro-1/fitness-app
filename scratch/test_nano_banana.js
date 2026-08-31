const fs = require('fs');
const path = require('path');

const apiKey = 'process.env.GEMINI_API_KEY';

const prompt = `Ultra-detailed photorealistic 3D medical anatomy octane render of an athletic muscular man performing a parallel bar chest dip. Torso tilted forward at 30 degrees to bias the lower sternal pectoralis major. Dark studio environment with dark slate background (#090d16). Lower chest and pectoralis major glowing brightly in electric cyan (#38bdf8), with anterior deltoids and triceps glowing in warm amber (#f59e0b). Anatomically accurate muscular striations, cinematic rim lighting, 8k resolution.`;

async function testModels() {
  const models = [
    'nano-banana-pro-preview',
    'gemini-3-pro-image',
    'gemini-3.1-flash-image',
    'gemini-2.5-flash-image'
  ];

  for (const model of models) {
    console.log(`\nTesting ${model}...`);
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }]
          }]
        })
      });

      console.log(`${model} status:`, res.status);
      const data = await res.json();
      
      // Check if image data is in parts
      const candidates = data.candidates || [];
      for (const cand of candidates) {
        const parts = cand.content?.parts || [];
        for (const part of parts) {
          if (part.inlineData) {
            const buf = Buffer.from(part.inlineData.data, 'base64');
            const dest = path.join(__dirname, '..', 'public', 'anatomy', 'chest_dip.jpg');
            fs.writeFileSync(dest, buf);
            console.log(`🎉 SUCCESS with ${model}! Saved to chest_dip.jpg (${buf.length} bytes)`);
            return;
          }
        }
      }
      console.log(`${model} response text:`, JSON.stringify(data).slice(0, 300));
    } catch (e) {
      console.error(`${model} error:`, e);
    }
  }
}

testModels();
