const DEFAULT_GEMINI_IMAGE_MODEL = 'imagen-3.0-generate-002';
const FALLBACK_IMAGE_MODELS = [
  'gemini-2.0-flash-preview-image-generation',
  'imagen-3.0-generate-002'
];

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

const buildModelCandidates = () => {
  const configuredModel = process.env.GEMINI_IMAGE_MODEL?.trim();
  return [...new Set([configuredModel || DEFAULT_GEMINI_IMAGE_MODEL, ...FALLBACK_IMAGE_MODELS].filter(Boolean))];
};

const tryGenerateWithModel = async ({ model, apiKey, prompt, aspectRatio }) => {
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
      return { parsed };
    }

    lastStatusCode = response.status;
    lastErrorPayload = response.data;
  }

  return {
    error: {
      model,
      status: lastStatusCode,
      details: lastErrorPayload
    }
  };
};

const generateThemeImage = async ({ prompt, aspectRatio }) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    const err = new Error('GEMINI_API_KEY missing');
    err.code = 'MISSING_API_KEY';
    throw err;
  }

  const models = buildModelCandidates();
  const failures = [];

  for (const model of models) {
    const result = await tryGenerateWithModel({ model, apiKey, prompt, aspectRatio });
    if (result.parsed) {
      return result.parsed;
    }
    failures.push(result.error);
  }

  const lastFailure = failures[failures.length - 1] || null;

  const err = new Error('Gemini image generation failed');
  err.code = 'GEMINI_API_ERROR';
  err.status = lastFailure?.status;
  err.details = {
    triedModels: models,
    failures
  };
  throw err;
};

module.exports = { generateThemeImage };
