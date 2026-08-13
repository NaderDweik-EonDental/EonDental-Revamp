/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_HF_TOKEN?: string;
  readonly VITE_HF_IMAGE_MODEL?: string;
  readonly VITE_HF_PROVIDER?: string;
  readonly VITE_GEMINI_API_KEY?: string;
  readonly VITE_GEMINI_IMAGE_MODEL?: string;
  readonly VITE_GEMINI_PROJECT_ID?: string;
  readonly VITE_GEMINI_PROJECT_NAME?: string;
  readonly VITE_GEMINI_API_BASE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
