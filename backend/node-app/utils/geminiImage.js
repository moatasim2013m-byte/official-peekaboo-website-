const DEFAULT_GEMINI_IMAGE_MODEL = 'imagen-3.0-generate-002';

const parseGeminiImage = (data) => {
  const inlinePart = data?.candidates
    ?.flatMap((candidate) => candidate?.content?.parts || [])
    ?.find((part) => part?.inlineData?.data);

  if (inlinePart?.inlineData?.data) {
    return {
      imageBuffer: Buffer.from(inlinePart.inlineData.data, 'base64'),
      mimeType: inlinePart.inlineData.mimeType || 'image/png'
    };
  }

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

const postGeminiRequest = async ({ endpoint, payload }) => {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  const data = await response.json().catch(() => null);

  return {
    ok: response.ok,
    status: response.status,
    data
  };
};

const generateThemeImage = async ({ prompt, aspectRatio }) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    const err = new Error('GEMINI_API_KEY missing');
    err.code = 'MISSING_API_KEY';
    throw err;
  }

  const model = process.env.GEMINI_IMAGE_MODEL || DEFAULT_GEMINI_IMAGE_MODEL;
  const modelPath = encodeURIComponent(model);
  const predictEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelPath}:predict?key=${encodeURIComponent(apiKey)}`;
  const generateEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelPath}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const attempts = [
    {
      endpoint: predictEndpoint,
      payload: {
      instances: [{ prompt }],
      parameters: {
        sampleCount: 1,
        ...(aspectRatio ? { aspectRatio } : {})
      }
    }
    },
    {
      endpoint: generateEndpoint,
      payload: {
        contents: [
          {
            role: 'user',
            parts: [{ text: prompt }]
          }
        ],
        generationConfig: {
          responseModalities: ['TEXT', 'IMAGE'],
          ...(aspectRatio ? { aspectRatio } : {})
        }
      }
    }
  ];

  let lastErrorPayload;

  for (const attempt of attempts) {
    const response = await postGeminiRequest(attempt);
    if (!response.ok) {
      lastErrorPayload = response.data;
      continue;
    }

    const parsed = parseGeminiImage(response.data);
    if (parsed) {
      return parsed;
    }
    lastErrorPayload = response.data;
  }

  const err = new Error('Gemini image generation failed');
  err.code = 'GEMINI_API_ERROR';
  err.details = lastErrorPayload;
  throw err;
};

module.exports = { generateThemeImage };
