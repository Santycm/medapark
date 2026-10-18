import { Check } from 'lucide-react';

/** Indicador de pasos: "✓ Credenciales verificadas → 2 Verificación MFA". */
const AuthSteps = () => (
  <ol
    className="mt-auto flex items-start justify-center lg:pt-[1vh]"
    aria-label="Pasos de acceso"
  >
    <li className="flex w-36 flex-col items-center gap-2 text-center text-sm text-ink-500">
      <span className="flex h-10 w-10 items-center justify-center rounded-full lg:h-[clamp(32px,4.6vh,40px)] lg:w-[clamp(32px,4.6vh,40px)] bg-brand-600 text-white">
        <Check size={22} aria-hidden="true" />
      </span>
      Credenciales verificadas
    </li>
    <li aria-hidden="true" className="mt-5 h-[3px] w-16 bg-accent-600" />
    <li
      className="flex w-36 flex-col items-center gap-2 text-center text-sm font-semibold text-navy-900"
      aria-current="step"
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-full lg:h-[clamp(32px,4.6vh,40px)] lg:w-[clamp(32px,4.6vh,40px)] bg-accent-600 text-lg font-bold text-white">
        2
      </span>
      Verificación MFA
    </li>
  </ol>
);

export default AuthSteps;
