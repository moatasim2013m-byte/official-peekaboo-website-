const DEFAULT_GEMINI_IMAGE_MODEL = 'gemini-2.0-flash-preview-image-generation';
const FALLBACK_IMAGE_MODELS = [
  'gemini-2.0-flash-preview-image-generation'
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

  return null;
};

const postGeminiRequest = async ({ endpoint, apiKey, payload }) => {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey
    },
    body: JSON.stringify(payload)
  });

  const data = await response.json().catch(() => null);

  return {
    ok: response.ok,
    status: response.status,
    data
  };
};

const buildAttempt = ({ modelPath, prompt }) => ({
  endpoint: `https://generativelanguage.googleapis.com/v1beta/models/${modelPath}:generateContent`,
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
});

const buildModelCandidates = () => {
  const configuredModel = process.env.GEMINI_IMAGE_MODEL?.trim();
  return [...new Set([configuredModel || DEFAULT_GEMINI_IMAGE_MODEL, ...FALLBACK_IMAGE_MODELS].filter(Boolean))];
};

const normalizeProviderError = (data) => {
  if (!data) return null;
  return {
    message: data?.error?.message || null,
    status: data?.error?.status || null,
    code: data?.error?.code || null,
    raw: data
  };
};

const tryGenerateWithModel = async ({ model, apiKey, prompt }) => {
  const modelPath = encodeURIComponent(model);
  const attempt = buildAttempt({ modelPath, prompt });

  const response = await postGeminiRequest({ ...attempt, apiKey });
  if (!response.ok) {
    return {
      error: {
        model,
        status: response.status,
        details: normalizeProviderError(response.data)
      }
    };
  }

  const parsed = parseGeminiImage(response.data);
  if (parsed) {
    return { parsed };
  }

  return {
    error: {
      model,
      status: response.status,
      details: {
        message: 'Image bytes not found in Gemini response',
        raw: response.data
      }
    }
  };
};

const generateThemeImage = async ({ prompt }) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    const err = new Error('GEMINI_API_KEY missing');
    err.code = 'MISSING_API_KEY';
    throw err;
  }

  const models = buildModelCandidates();
  const failures = [];

  for (const model of models) {
    const result = await tryGenerateWithModel({ model, apiKey, prompt });
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
