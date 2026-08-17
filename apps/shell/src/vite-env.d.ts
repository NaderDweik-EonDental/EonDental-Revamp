interface ImportMetaEnv {
  readonly VITE_CASE_SUBMISSION_REMOTE?: string;
  readonly VITE_SMILE_SIMULATION_REMOTE?: string;
  readonly VITE_3D_VIEWER_REMOTE?: string;
  readonly VITE_TREATMENT_PLAN_REMOTE?: string;
  readonly VITE_ENABLE_MSW?: string;
  readonly VITE_ENABLE_VIEW_SWITCHER?: string;
  readonly BASE_URL: string;
  readonly DEV: boolean;
  readonly PROD: boolean;
  readonly MODE: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
