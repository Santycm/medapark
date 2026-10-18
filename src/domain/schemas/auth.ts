import { z } from 'zod';
import { MSG } from '../../lib/messages';

const EMAIL_FORMAT = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, MSG.login.correoObligatorio)
    .regex(EMAIL_FORMAT, MSG.login.correoFormato),
  // La contraseña no se recorta: los espacios pueden ser parte de ella.
  password: z.string().min(1, MSG.login.contrasenaObligatoria),
});

export type LoginValues = z.infer<typeof loginSchema>;

export const otpSchema = z.object({
  code: z.string().regex(/^\d{6}$/),
});

export type OtpValues = z.infer<typeof otpSchema>;
