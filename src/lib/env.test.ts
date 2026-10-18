import { describe, expect, it } from 'vitest';
import { readEnv } from './env';

describe('readEnv', () => {
  it('devuelve los valores cuando existen', () => {
    expect(readEnv({ VITE_SUPABASE_URL: ' https://x.supabase.co ', VITE_SUPABASE_ANON_KEY: 'k' })).toEqual({
      supabaseUrl: 'https://x.supabase.co',
      supabaseAnonKey: 'k',
    });
  });

  it('falla con un mensaje claro si falta alguna', () => {
    expect(() => readEnv({ VITE_SUPABASE_URL: 'https://x.supabase.co' })).toThrow(/VITE_SUPABASE_ANON_KEY/);
  });
});
