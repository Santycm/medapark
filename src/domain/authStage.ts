export type AuthStage =
  | 'cargando'
  | 'anonimo'
  | 'requiere_enrolamiento'
  | 'requiere_verificacion'
  | 'autenticado';

export type AuthStageInput = {
  hasSession: boolean;
  currentLevel: 'aal1' | 'aal2' | null;
  verifiedTotpCount: number;
};

export function resolveAuthStage(input: AuthStageInput): Exclude<AuthStage, 'cargando'> {
  if (!input.hasSession) return 'anonimo';
  if (input.currentLevel === 'aal2') return 'autenticado';
  return input.verifiedTotpCount > 0 ? 'requiere_verificacion' : 'requiere_enrolamiento';
}
