export type Env = { supabaseUrl: string; supabaseAnonKey: string };

export function readEnv(source: Partial<Record<string, string>>): Env {
  const supabaseUrl = source.VITE_SUPABASE_URL?.trim();
  const supabaseAnonKey = source.VITE_SUPABASE_ANON_KEY?.trim();

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Faltan las variables VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY. Copia .env.example a .env y completa los valores.',
    );
  }

  return { supabaseUrl, supabaseAnonKey };
}

export const env: Env = readEnv(import.meta.env);
