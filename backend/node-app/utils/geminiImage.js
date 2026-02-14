const getAccessTokenFromMetadata = async () => {
  const response = await fetch('http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token', {
    headers: {
      'Metadata-Flavor': 'Google'
    }
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const err = new Error('Gemini image generation failed');
    err.code = 'GEMINI_API_ERROR';
    err.status = response.status;
    err.details = {
      model: null,
      providerError: {
        message: data?.error?.message || 'Failed to fetch metadata access token',
        status: response.status,
        code: data?.error?.code || null,
        raw: data
      }
    };
    throw err;
  }

  const token = data?.access_token;
  if (!token) {
    const err = new Error('Gemini image generation failed');
    err.code = 'GEMINI_API_ERROR';
    err.details = {
      model: null,
      providerError: {
        message: 'Metadata access token missing',
        status: null,
        code: null,
        raw: data
      }
    };
    throw err;
  }

  return token;
};

const generateThemeImage = async ({ prompt, aspectRatio }) => {
  const project = process.env.GOOGLE_CLOUD_PROJECT?.trim();
  if (!project) {
    const err = new Error('GOOGLE_CLOUD_PROJECT missing');
    err.code = 'MISSING_API_KEY';
    throw err;
  }

  const location = process.env.VERTEX_LOCATION?.trim() || 'us-central1';
  const model = process.env.IMAGEN_MODEL?.trim() || 'imagen-3.0-generate-002';
  const endpoint = `https://${location}-aiplatform.googleapis.com/v1/projects/${project}/locations/${location}/publishers/google/models/${encodeURIComponent(model)}:predict`;

  try {
    const accessToken = await getAccessTokenFromMetadata();

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        instances: [{ prompt }],
        parameters: {
          sampleCount: 1,
          aspectRatio: aspectRatio || '1:1',
          outputOptions: { mimeType: 'image/png' }
        }
      })
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const err = new Error('Gemini image generation failed');
      err.code = 'GEMINI_API_ERROR';
      err.status = response.status;
      err.details = {
        model: `vertex:${model}`,
        providerError: {
          message: data?.error?.message || null,
          status: data?.error?.status || response.status,
          code: data?.error?.code || null,
          raw: data
        }
      };
      throw err;
    }

    const prediction = data?.predictions?.[0];
    const bytesBase64Encoded = prediction?.bytesBase64Encoded;

    if (!bytesBase64Encoded) {
      const err = new Error('Gemini image generation failed');
      err.code = 'GEMINI_API_ERROR';
      err.status = response.status;
      err.details = {
        model: `vertex:${model}`,
        providerError: {
          message: 'Image bytes not found in Vertex response',
          status: response.status,
          code: null,
          raw: data
        }
      };
      throw err;
    }

    return {
      imageBuffer: Buffer.from(bytesBase64Encoded, 'base64'),
      mimeType: prediction.mimeType || 'image/png'
    };
  } catch (error) {
    if (error?.code === 'GEMINI_API_ERROR') {
      throw error;
    }

    const err = new Error('Gemini image generation failed');
    err.code = 'GEMINI_API_ERROR';
    err.status = Number(error?.status) || undefined;
    err.details = {
      model: `vertex:${model}`,
      providerError: {
        message: error?.message || null,
        status: Number(error?.status) || null,
        code: error?.code || null,
        raw: error
      }
    };
    throw err;
  }
};

module.exports = { generateThemeImage };
