/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['src/test/setup.ts'],
    css: false,
    // Los formularios largos con user-event pueden tardar más de 5 s cuando la máquina (o el CI) está cargada.
    testTimeout: 20000,
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.test.{ts,tsx}',
        'src/test/**',
        'src/main.tsx',
        'src/App.tsx',
        'src/vite-env.d.ts',
        'src/lib/database.types.ts',
        // Pantallas y componentes del repo original, conservados sin cambios funcionales
        // (rutas latentes, @deprecated) o que la feature 003 rediseña. Se miden cuando se toquen.
        'src/components/auth/{AuthAlert,AuthButton,AuthCard,AuthInput,AuthMessage,ProtectedRoute}.tsx',
        'src/components/map/**',
        'src/pages/app/Profile.tsx',
        'src/pages/auth/{ForgotPassword,SetupMfa,UpdatePassword}.tsx',
        'src/pages/public/**',
      ],
      reporter: ['text', 'text-summary', 'json-summary', 'lcov'],
      thresholds: { statements: 70, branches: 70, functions: 70, lines: 70 },
    },
  },
});
