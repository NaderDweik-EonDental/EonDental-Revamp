/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_CASE_SUBMISSION_REMOTE: string;
  readonly VITE_SMILE_SIMULATION_REMOTE: string;
  readonly VITE_3D_VIEWER_REMOTE: string;
  readonly VITE_ENABLE_MSW?: string;
  readonly VITE_ENABLE_VIEW_SWITCHER?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
