const DEFAULT_GEMINI_IMAGE_MODEL = 'gemini-2.0-flash-preview-image-generation';
const FALLBACK_GEMINI_IMAGE_MODELS = [
  process.env.GEMINI_IMAGE_MODEL?.trim(),
  DEFAULT_GEMINI_IMAGE_MODEL,
  'gemini-1.5-pro'
].filter((model, index, models) => model && models.indexOf(model) === index);

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
        parts: [{ text: prompt }]
      }
    ],
    generationConfig: {
      responseModalities: ['IMAGE']
    }
  }
});

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

  let lastFailure = null;
  let lastTriedModel = null;
  const triedModels = [];

  for (const model of FALLBACK_GEMINI_IMAGE_MODELS) {
    lastTriedModel = model;
    triedModels.push(model);

    const result = await tryGenerateWithModel({ model, apiKey, prompt });
    if (result.parsed) {
      return result.parsed;
    }

    const failure = result.error || null;
    lastFailure = failure;

    if (failure?.status !== 404) {
      break;
    }
  }

  const err = new Error('Gemini image generation failed');
  err.code = 'GEMINI_API_ERROR';
  err.status = lastFailure?.status;
  err.details = {
    model: lastTriedModel,
    triedModels,
    providerError: lastFailure?.details || null
  };
  throw err;
};

module.exports = { generateThemeImage };
