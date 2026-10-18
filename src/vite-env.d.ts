/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface Window {
  /** Solo en desarrollo: cliente de Supabase para la validación manual. */
  __supabase?: import('@supabase/supabase-js').SupabaseClient;
}
