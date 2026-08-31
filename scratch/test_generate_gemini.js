const fs = require('fs');
const path = require('path');

const apiKey = 'process.env.GEMINI_API_KEY';

const prompt = `Ultra-detailed photorealistic 3D medical anatomy octane render of an athletic muscular man performing a parallel bar chest dip. Torso tilted forward at 30 degrees to bias the lower sternal pectoralis major. Dark studio environment with dark slate background (#090d16). Lower chest and pectoralis major glowing brightly in electric cyan (#38bdf8), with anterior deltoids and triceps glowing in warm amber (#f59e0b). Anatomically accurate muscular striations, cinematic rim lighting, 8k resolution.`;

async function main() {
  console.log('Testing Google Gemini / Imagen generation...');

  // Try 1: Query param key
  const urlQuery = `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${apiKey}`;
  const payload = {
    instances: [{ prompt: prompt }],
    parameters: {
      sampleCount: 1,
      aspectRatio: "1:1",
      outputOptions: { mimeType: "image/jpeg" }
    }
  };

  try {
    const res1 = await fetch(urlQuery, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    console.log('Query param response status:', res1.status);
    const data1 = await res1.json();
    if (res1.ok && data1.predictions?.[0]?.bytesBase64Encoded) {
      const buf = Buffer.from(data1.predictions[0].bytesBase64Encoded, 'base64');
      fs.writeFileSync(path.join(__dirname, '..', 'public', 'anatomy', 'chest_dip.jpg'), buf);
      console.log('Successfully generated and saved chest_dip.jpg via Imagen 3! Size:', buf.length);
      return;
    } else {
      console.log('Query param result:', JSON.stringify(data1));
    }
  } catch (err) {
    console.error('Error 1:', err);
  }

  // Try 2: Bearer token
  const urlBearer = `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict`;
  try {
    const res2 = await fetch(urlBearer, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(payload)
    });
    console.log('Bearer response status:', res2.status);
    const data2 = await res2.json();
    if (res2.ok && data2.predictions?.[0]?.bytesBase64Encoded) {
      const buf = Buffer.from(data2.predictions[0].bytesBase64Encoded, 'base64');
      fs.writeFileSync(path.join(__dirname, '..', 'public', 'anatomy', 'chest_dip.jpg'), buf);
      console.log('Successfully generated and saved chest_dip.jpg via Bearer Imagen 3! Size:', buf.length);
      return;
    } else {
      console.log('Bearer result:', JSON.stringify(data2));
    }
  } catch (err) {
    console.error('Error 2:', err);
  }

  // Try 3: Fast generate
  const urlFast = `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-fast-generate-001:predict?key=${apiKey}`;
  try {
    const res3 = await fetch(urlFast, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    console.log('Fast model response status:', res3.status);
    const data3 = await res3.json();
    if (res3.ok && data3.predictions?.[0]?.bytesBase64Encoded) {
      const buf = Buffer.from(data3.predictions[0].bytesBase64Encoded, 'base64');
      fs.writeFileSync(path.join(__dirname, '..', 'public', 'anatomy', 'chest_dip.jpg'), buf);
      console.log('Successfully generated and saved chest_dip.jpg via Fast Imagen 3! Size:', buf.length);
      return;
    } else {
      console.log('Fast model result:', JSON.stringify(data3));
    }
  } catch (err) {
    console.error('Error 3:', err);
  }
}

main();
