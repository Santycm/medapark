import { describe, expect, it } from 'vitest';
import { resolveAuthStage } from './authStage';

describe('resolveAuthStage', () => {
  it.each([
    [{ hasSession: false, currentLevel: null, verifiedTotpCount: 0 }, 'anonimo'],
    [{ hasSession: true, currentLevel: 'aal2', verifiedTotpCount: 1 }, 'autenticado'],
    [{ hasSession: true, currentLevel: 'aal2', verifiedTotpCount: 0 }, 'autenticado'],
    [{ hasSession: true, currentLevel: 'aal1', verifiedTotpCount: 0 }, 'requiere_enrolamiento'],
    [{ hasSession: true, currentLevel: 'aal1', verifiedTotpCount: 1 }, 'requiere_verificacion'],
    [{ hasSession: true, currentLevel: 'aal1', verifiedTotpCount: 2 }, 'requiere_verificacion'],
    [{ hasSession: true, currentLevel: null, verifiedTotpCount: 0 }, 'requiere_enrolamiento'],
  ] as const)('%j → %s', (input, expected) => {
    expect(resolveAuthStage(input)).toBe(expected);
  });
});
