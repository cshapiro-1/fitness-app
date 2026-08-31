const fs = require('fs');
const path = require('path');

const apiKey = process.env.GEMINI_API_KEY || '';

const prompt = `Ultra-detailed photorealistic 3D medical anatomy octane render of an athletic muscular man performing a standing Dumbbell Lateral Raise. Arms abducted 90 degrees parallel to the floor in the scapular plane with slight forward tilt. Clean, minimalist dark slate studio background (#090d16) with soft rim lighting and completely empty solid dark background with zero floating background cross sections, zero charts, zero overlays. Lateral Deltoids (acromial head) glowing brightly in electric cyan (#38bdf8), with Upper Trapezius and Supraspinatus in warm amber (#f59e0b). 8k resolution, photorealistic 3D medical fitness render.`;

async function regenerateLateralRaise() {
  console.log('Regenerating #19 Dumbbell Lateral Raise with pure clean studio background...');
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
      const cand = data.candidates?.[0];
      const part = cand?.content?.parts?.[0];
      if (part?.inlineData?.data) {
        const buf = Buffer.from(part.inlineData.data, 'base64');
        const dest = path.join(__dirname, '..', 'public', 'anatomy', 'lateral_raise.jpg');
        fs.writeFileSync(dest, buf);
        const artDest = path.join('C:', 'Users', 'Collin', '.gemini', 'antigravity', 'brain', '91e3175f-b6f8-401f-90f4-0dbfefd0301b', 'lateral_raise.jpg');
        fs.writeFileSync(artDest, buf);
        console.log(`🎉 SUCCESS: Saved clean lateral_raise.jpg (${buf.length} bytes)`);
      } else {
        console.log('No image in response');
      }
    } else {
      console.log('Failed:', res.status, await res.text());
    }
  } catch (e) {
    console.error('Error:', e);
  }
}

regenerateLateralRaise();
