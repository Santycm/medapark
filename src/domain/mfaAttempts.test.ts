import { describe, expect, it } from 'vitest';
import { MAX_MFA_ATTEMPTS, getFailures, registerFailure, resetFailures } from './mfaAttempts';

describe('mfaAttempts', () => {
  it('el máximo es 5', () => {
    expect(MAX_MFA_ATTEMPTS).toBe(5);
  });

  it('cuenta por usuario y se reinicia', () => {
    expect(getFailures('a')).toBe(0);
    expect(registerFailure('a')).toBe(1);
    expect(registerFailure('a')).toBe(2);
    expect(getFailures('b')).toBe(0);
    resetFailures('a');
    expect(getFailures('a')).toBe(0);
  });

  it('ignora valores corruptos', () => {
    sessionStorage.setItem('medapark:mfa-fallos:a', 'abc');
    expect(getFailures('a')).toBe(0);
  });
});
