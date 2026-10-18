import { describe, expect, it } from 'vitest';
import { loginSchema, otpSchema } from './auth';
import { MSG } from '../../lib/messages';

const messages = (input: unknown) => {
  const result = loginSchema.safeParse(input);
  if (result.success) return [];
  return result.error.issues.map((issue) => issue.message);
};

describe('loginSchema', () => {
  it('campos vacíos → un mensaje por campo', () => {
    const issues = loginSchema.safeParse({ email: '', password: '' });
    expect(issues.success).toBe(false);
    expect(messages({ email: '', password: '' })).toEqual(
      expect.arrayContaining([MSG.login.correoObligatorio, MSG.login.contrasenaObligatoria]),
    );
  });

  it.each(['admin@dominio', 'admin.com', 'a b@c.co'])('"%s" → Verificar correo electrónico', (email) => {
    expect(messages({ email, password: 'x' })).toEqual([MSG.login.correoFormato]);
  });

  it('recorta el correo pero no la contraseña', () => {
    const result = loginSchema.safeParse({ email: '  Admin@X.co  ', password: ' clave ' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe('Admin@X.co');
      expect(result.data.password).toBe(' clave ');
    }
  });
});

describe('otpSchema', () => {
  it('acepta exactamente 6 dígitos', () => {
    expect(otpSchema.safeParse({ code: '123456' }).success).toBe(true);
    expect(otpSchema.safeParse({ code: '12345' }).success).toBe(false);
    expect(otpSchema.safeParse({ code: '1234567' }).success).toBe(false);
    expect(otpSchema.safeParse({ code: '12345a' }).success).toBe(false);
  });
});
