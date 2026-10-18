import { Link, Outlet } from 'react-router';
import AuthSteps from '../auth/AuthSteps';
import Logo from '../common/Logo';

/**
 * Layout de las pantallas MFA (HU02): panel de marca con pasos a la izquierda y tarjeta a la derecha.
 * Sin barra superior (el logo ya está en el panel). En escritorio ocupa exactamente el alto de la
 * ventana, con tamaños en vh/vw para evitar el scroll.
 */
const MfaLayout = () => (
  <div className="flex min-h-dvh flex-col bg-canvas lg:h-dvh lg:flex-row lg:overflow-hidden">
    <aside className="flex flex-col gap-5 bg-accent-50 px-8 py-8 lg:min-h-0 lg:w-[38vw] lg:min-w-[360px] lg:max-w-[560px] lg:gap-[2.2vh] lg:px-[clamp(32px,5vw,72px)] lg:py-[clamp(24px,5vh,64px)]">
      <Link to="/" aria-label="MedaPark, ir al inicio" className="self-start">
        <Logo className="h-14 lg:h-[clamp(48px,9vh,84px)]" />
      </Link>
      <p className="text-2xl font-bold leading-tight text-navy-900 lg:text-[clamp(1.5rem,3.7vh,2.125rem)]">
        Parqueaderos más inteligentes para ciudades más conectadas
      </p>
      <p className="text-base leading-relaxed text-ink-500 lg:text-[clamp(0.875rem,2vh,1.125rem)]">
        Gestiona la información de tu parqueadero de forma segura, confiable y en tiempo real.
      </p>
      <div className="hidden min-h-0 flex-1 items-center lg:flex">
        <img
          src="/img/mfa-illustration.png"
          alt=""
          aria-hidden="true"
          className="max-h-full w-full object-contain mix-blend-multiply"
        />
      </div>
      <AuthSteps />
    </aside>

    <main className="flex flex-1 items-center justify-center px-4 py-8 lg:min-h-0 lg:overflow-y-auto lg:py-[2vh]">
      <div className="w-full max-w-[560px] rounded-[20px] bg-white p-6 shadow-[0_8px_32px_rgba(11,37,89,0.08)] sm:px-14 sm:py-10 lg:px-[clamp(28px,3.6vw,56px)] lg:py-[clamp(14px,3.6vh,40px)]">
        <Outlet />
      </div>
    </main>
  </div>
);

export default MfaLayout;
