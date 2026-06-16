/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ADMIN_BASE?: string;
  readonly VITE_ADMIN_HATCH?: string;
  readonly VITE_ADMIN_FORAGE?: string;
  readonly VITE_DEV_API_TARGET?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
