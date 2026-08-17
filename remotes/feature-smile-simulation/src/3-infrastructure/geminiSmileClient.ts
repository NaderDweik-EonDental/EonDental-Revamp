/** Gemini Developer API client for chairside smile image simulation. */

export type GeminiSmileRequest = {
  photo: File;
  targetShade: string;
  includeWhitening: boolean;
  patientId: string;
};

export type GeminiSmileResult = {
  afterImageUrl: string;
  mimeType: string;
  model: string;
  note?: string;
};

const DEFAULT_MODEL =
  import.meta.env.VITE_GEMINI_IMAGE_MODEL?.trim() || 'gemini-2.5-flash-image';

const API_BASE =
  import.meta.env.VITE_GEMINI_API_BASE?.trim() ||
  'https://generativelanguage.googleapis.com/v1beta';

export function isGeminiConfigured(): boolean {
  return Boolean(import.meta.env.VITE_GEMINI_API_KEY?.trim());
}

export async function generateSmileWithGemini(
  request: GeminiSmileRequest,
): Promise<GeminiSmileResult> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error(
      'Missing VITE_GEMINI_API_KEY. Add it to remotes/feature-smile-simulation/.env',
    );
  }

  const { base64, mimeType } = await fileToBase64(request.photo);
  const prompt = buildSmilePrompt(request);

  const url = `${API_BASE}/models/${DEFAULT_MODEL}:generateContent`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-goog-api-key': apiKey,
    },
    body: JSON.stringify({
      contents: [
        {
          role: 'user',
          parts: [
            {
              inlineData: {
                mimeType,
                data: base64,
              },
            },
            { text: prompt },
          ],
        },
      ],
      generationConfig: {
        responseModalities: ['TEXT', 'IMAGE'],
      },
    }),
  });

  if (!response.ok) {
    const detail = await safeReadText(response);
    throw new Error(formatGeminiError(response.status, detail));
  }

  const payload = (await response.json()) as GeminiGenerateResponse;
  const imagePart = findImagePart(payload);
  if (!imagePart) {
    const text = findTextPart(payload);
    throw new Error(
      text
        ? `Gemini returned no image. ${text}`
        : 'Gemini returned no edited smile image. Try another photo or model.',
    );
  }

  const afterMime = imagePart.mimeType || 'image/png';
  const afterImageUrl = `data:${afterMime};base64,${imagePart.data}`;
  return {
    afterImageUrl,
    mimeType: afterMime,
    model: DEFAULT_MODEL,
    note: findTextPart(payload) || undefined,
  };
}

function buildSmilePrompt(request: GeminiSmileRequest): string {
  const whitening = request.includeWhitening
    ? `Also apply a natural professional whitening toward shade ${request.targetShade}.`
    : `Keep tooth color close to the photo, optionally refined toward shade ${request.targetShade}.`;

  return [
    'You are a clinical dental smile-simulation editor.',
    'Edit THIS uploaded patient photo and return a photorealistic AFTER image.',
    'Requirements:',
    '- Correct and align the teeth themselves (orthodontic smile simulation): straighten crooked teeth, close obvious gaps, improve midline and smile arc.',
    '- Keep the same person, face shape, skin, lips, gums, eyes, hair, lighting, camera angle, background, and framing.',
    '- Do not change identity, age, gender presentation, jewelry, or clothing.',
    '- Only modify the dentition / smile region.',
    `- ${whitening}`,
    '- Output a realistic clinical preview suitable for chairside consultation, not a cartoon or beauty-filter look.',
    `- Patient reference id: ${request.patientId || 'unknown'}.`,
  ].join('\n');
}

type GeminiInlineData = {
  mimeType?: string;
  mime_type?: string;
  data?: string;
};

type GeminiPart = {
  text?: string;
  inlineData?: GeminiInlineData;
  inline_data?: GeminiInlineData;
};

type GeminiGenerateResponse = {
  candidates?: Array<{
    content?: {
      parts?: GeminiPart[];
    };
  }>;
  error?: { message?: string };
};

function findImagePart(
  payload: GeminiGenerateResponse,
): { data: string; mimeType: string } | null {
  const parts = payload.candidates?.[0]?.content?.parts ?? [];
  for (const part of parts) {
    const inline = part.inlineData ?? part.inline_data;
    if (inline?.data) {
      return {
        data: inline.data,
        mimeType: inline.mimeType || inline.mime_type || 'image/png',
      };
    }
  }
  return null;
}

function findTextPart(payload: GeminiGenerateResponse): string | null {
  const parts = payload.candidates?.[0]?.content?.parts ?? [];
  const texts = parts
    .map((part) => part.text?.trim())
    .filter((text): text is string => Boolean(text));
  return texts.length > 0 ? texts.join(' ') : null;
}

async function fileToBase64(
  file: File,
): Promise<{ base64: string; mimeType: string }> {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return {
    base64: btoa(binary),
    mimeType: file.type || 'image/jpeg',
  };
}

async function safeReadText(response: Response): Promise<string> {
  try {
    const json = (await response.json()) as {
      error?: { message?: string };
      message?: string;
    };
    return json.error?.message || json.message || JSON.stringify(json);
  } catch {
    try {
      return await response.text();
    } catch {
      return response.statusText || 'Unknown error';
    }
  }
}

function formatGeminiError(status: number, detail: string): string {
  const lower = detail.toLowerCase();
  if (status === 429 || lower.includes('resource_exhausted') || lower.includes('quota')) {
    return (
      'Gemini image quota exceeded for this API key. Enable billing / image ' +
      'generation quota in Google AI Studio (project SmileSimulation), then retry. ' +
      `Details: ${detail}`
    );
  }
  if (lower.includes('not available in your country')) {
    return (
      'Gemini image generation is not available in this region for the current key. ' +
      'Use a project/key with image-edit access, or a VPN/region where Nano Banana is enabled.'
    );
  }
  return `Gemini smile simulation failed (${status}): ${detail}`;
}
