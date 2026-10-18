export type Result<T, C extends string = string> =
  | { ok: true; data: T }
  | { ok: false; code: C; message: string };

export const ok = <T>(data: T): { ok: true; data: T } => ({ ok: true, data });

export const fail = <C extends string>(
  code: C,
  message: string,
): { ok: false; code: C; message: string } => ({ ok: false, code, message });
