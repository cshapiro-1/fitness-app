const apiKey = 'process.env.GEMINI_API_KEY';

async function listModels() {
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
  console.log('Status:', res.status);
  const data = await res.json();
  if (data.models) {
    console.log('Available models:', data.models.map(m => m.name));
  } else {
    console.log('Response:', JSON.stringify(data));
  }
}

listModels();
