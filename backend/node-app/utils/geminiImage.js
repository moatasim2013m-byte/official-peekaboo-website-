const DEFAULT_GEMINI_IMAGE_MODEL = 'imagen-3.0-generate-002';

const parseGeminiImage = (data) => {
  const prediction = data?.predictions?.[0] || data?.images?.[0] || data?.generatedImages?.[0] || null;

  const imageBase64 = prediction?.bytesBase64Encoded
    || prediction?.image?.imageBytes
    || prediction?.imageBytes
    || prediction?.b64Json
    || prediction?.base64
    || null;

  if (!imageBase64) {
    return null;
  }

  const mimeType = prediction?.mimeType || prediction?.image?.mimeType || 'image/png';
  return { imageBuffer: Buffer.from(imageBase64, 'base64'), mimeType };
};

const generateThemeImage = async ({ prompt, aspectRatio }) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    const err = new Error('GEMINI_API_KEY missing');
    err.code = 'MISSING_API_KEY';
    throw err;
  }

  const model = process.env.GEMINI_IMAGE_MODEL || DEFAULT_GEMINI_IMAGE_MODEL;
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:predict?key=${encodeURIComponent(apiKey)}`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      instances: [{ prompt }],
      parameters: {
        sampleCount: 1,
        ...(aspectRatio ? { aspectRatio } : {})
      }
    })
  });

  if (!response.ok) {
    const err = new Error('Gemini image generation failed');
    err.code = 'GEMINI_API_ERROR';
    throw err;
  }

  const data = await response.json();
  const parsed = parseGeminiImage(data);

  if (!parsed) {
    const err = new Error('Invalid Gemini image response');
    err.code = 'GEMINI_INVALID_RESPONSE';
    throw err;
  }

  return parsed;
};

module.exports = { generateThemeImage };
