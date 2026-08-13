import { InferenceClient } from '@huggingface/inference';

export type HuggingFaceSmileRequest = {
  photo: File;
  targetShade: string;
  includeWhitening: boolean;
  patientId: string;
};

export type HuggingFaceSmileResult = {
  afterImageUrl: string;
  mimeType: string;
  model: string;
};

const DEFAULT_MODEL =
  import.meta.env.VITE_HF_IMAGE_MODEL?.trim() ||
  'black-forest-labs/FLUX.1-Kontext-dev';

const PROVIDER = (import.meta.env.VITE_HF_PROVIDER?.trim() || 'auto') as
  | 'auto'
  | 'hf-inference'
  | 'fal-ai'
  | 'replicate'
  | 'together'
  | 'wavespeed';

export function isHuggingFaceConfigured(): boolean {
  return Boolean(import.meta.env.VITE_HF_TOKEN?.trim());
}

export async function generateSmileWithHuggingFace(
  request: HuggingFaceSmileRequest,
): Promise<HuggingFaceSmileResult> {
  const token = import.meta.env.VITE_HF_TOKEN?.trim();
  if (!token) {
    throw new Error(
      'Missing VITE_HF_TOKEN. Create a free token at https://huggingface.co/settings/tokens (enable Inference Providers), add it to remotes/feature-smile-simulation/.env, and restart the remote.',
    );
  }

  const client = new InferenceClient(token);
  const prompt = buildSmilePrompt(request);

  try {
    const blob = await client.imageToImage({
      model: DEFAULT_MODEL,
      provider: PROVIDER,
      inputs: request.photo,
      parameters: {
        prompt,
        negative_prompt:
          'different person, face swap, distorted face, cartoon, anime, blurry, extra teeth, missing teeth, watermark, low quality',
      },
    });

    const mimeType = blob.type || 'image/jpeg';
    const afterImageUrl = await blobToDataUrl(blob);
    return {
      afterImageUrl,
      mimeType,
      model: DEFAULT_MODEL,
    };
  } catch (error) {
    throw new Error(formatHuggingFaceError(error));
  }
}

function buildSmilePrompt(request: HuggingFaceSmileRequest): string {
  const whitening = request.includeWhitening
    ? `naturally whiten teeth toward shade ${request.targetShade}`
    : `keep natural tooth color near shade ${request.targetShade}`;

  return [
    'Photorealistic dental smile simulation edit of this exact patient photo.',
    'Straighten and align the visible teeth, close small gaps, improve smile arc and midline.',
    'Keep the same face, skin, lips, gums, eyes, hair, lighting, camera angle, and background.',
    'Only modify the teeth/smile region.',
    `${whitening}.`,
    'Clinical chairside preview, realistic, no beauty-filter look.',
    `Patient id ${request.patientId || 'unknown'}.`,
  ].join(' ');
}

async function blobToDataUrl(blob: Blob): Promise<string> {
  const buffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  const mimeType = blob.type || 'image/jpeg';
  return `data:${mimeType};base64,${btoa(binary)}`;
}

function formatHuggingFaceError(error: unknown): string {
  const message =
    error instanceof Error ? error.message : 'Unknown Hugging Face error';
  const lower = message.toLowerCase();

  if (lower.includes('401') || lower.includes('unauthorized') || lower.includes('invalid token')) {
    return (
      'Hugging Face token rejected. Create a free token at https://huggingface.co/settings/tokens ' +
      'with “Make calls to the Inference Providers” enabled, then set VITE_HF_TOKEN and restart.'
    );
  }

  if (lower.includes('402') || lower.includes('payment') || lower.includes('credits')) {
    return (
      'Hugging Face free inference credits are exhausted for this month. ' +
      'Wait for monthly refresh, or try a lighter model via VITE_HF_IMAGE_MODEL. ' +
      `Details: ${message}`
    );
  }

  if (lower.includes('429') || lower.includes('rate')) {
    return `Hugging Face rate limit hit. Wait a minute and retry. Details: ${message}`;
  }

  if (lower.includes('loading') || lower.includes('503')) {
    return (
      'Hugging Face model is still warming up. Wait ~20 seconds and run simulation again. ' +
      `Details: ${message}`
    );
  }

  return `Hugging Face smile simulation failed: ${message}`;
}
