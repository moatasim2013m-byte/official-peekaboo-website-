const DEFAULT_GEMINI_IMAGE_MODEL = 'gemini-2.0-flash-preview-image-generation';

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

const isGeminiNativeModel = (model) => /gemini/i.test(model);

const buildAttempts = ({ model, modelPath, apiKey, prompt, aspectRatio }) => {
  const predictEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelPath}:predict?key=${encodeURIComponent(apiKey)}`;
  const generateEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelPath}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const predictAttempt = {
    endpoint: predictEndpoint,
    payload: {
      instances: [{ prompt }],
      parameters: {
        sampleCount: 1,
        ...(aspectRatio ? { aspectRatio } : {})
      }
    }
  };

  const generateAttempt = {
    endpoint: generateEndpoint,
    payload: {
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }]
        }
      ],
      generationConfig: {
        responseModalities: ['IMAGE']
      }
    }
  };

  return isGeminiNativeModel(model)
    ? [generateAttempt, predictAttempt]
    : [predictAttempt, generateAttempt];
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
  const attempts = buildAttempts({ model, modelPath, apiKey, prompt, aspectRatio });

  let lastErrorPayload;
  let lastStatusCode;

  for (const attempt of attempts) {
    const response = await postGeminiRequest(attempt);
    if (!response.ok) {
      lastStatusCode = response.status;
      lastErrorPayload = response.data;
      continue;
    }

    const parsed = parseGeminiImage(response.data);
    if (parsed) {
      return parsed;
    }

    lastStatusCode = response.status;
    lastErrorPayload = response.data;
  }

  const err = new Error('Gemini image generation failed');
  err.code = 'GEMINI_API_ERROR';
  err.status = lastStatusCode;
  err.details = lastErrorPayload;
  throw err;
};

module.exports = { generateThemeImage };
