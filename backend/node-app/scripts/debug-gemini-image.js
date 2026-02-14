require('dotenv').config();

async function debugGeminiImage() {
  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_IMAGE_MODEL || 'gemini-2.0-flash-preview-image-generation';

  if (!apiKey) {
    console.error('[DEBUG] Missing GEMINI_API_KEY');
    process.exit(1);
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;

  const payload = {
    contents: [{ parts: [{ text: 'kid-friendly birthday jungle theme background, no text, no logos' }] }],
    generationConfig: { responseModalities: ['IMAGE'] }
  };

  console.log('[DEBUG] URL:', url);
  console.log('[DEBUG] Model:', model);
  console.log('[DEBUG] API key present:', Boolean(apiKey));

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey
    },
    body: JSON.stringify(payload)
  });

  const data = await response.json().catch(() => ({}));

  console.log('[DEBUG] HTTP status:', response.status);

  if (!response.ok) {
    console.error('[DEBUG] Gemini error response:', JSON.stringify(data, null, 2));
    process.exit(2);
  }

  const inlinePart = data?.candidates
    ?.flatMap((candidate) => candidate?.content?.parts || [])
    ?.find((part) => part?.inlineData?.data);

  if (!inlinePart?.inlineData?.data) {
    console.error('[DEBUG] No inline image data found:', JSON.stringify(data, null, 2));
    process.exit(3);
  }

  console.log('[DEBUG] SUCCESS mimeType:', inlinePart.inlineData.mimeType || 'image/png');
  console.log('[DEBUG] Image bytes (base64 length):', inlinePart.inlineData.data.length);
}

debugGeminiImage().catch((error) => {
  console.error('[DEBUG] Fatal error:', error.message);
  console.error(error);
  process.exit(99);
});
