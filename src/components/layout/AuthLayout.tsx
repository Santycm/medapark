import { Link, Outlet } from 'react-router';
import Logo from '../common/Logo';

/** Layout del inicio de sesión (HU01): logo y foto a la izquierda, tarjeta a la derecha. */
const AuthLayout = () => (
  <div className="relative min-h-dvh overflow-x-hidden bg-white lg:h-dvh lg:overflow-hidden">
    <img
      src="/img/login-bg.jpg"
      alt=""
      aria-hidden="true"
      className="pointer-events-none absolute bottom-0 left-0 hidden h-[60%] w-[44%] object-cover lg:block"
    />
    <div
      aria-hidden="true"
      className="pointer-events-none absolute bottom-0 left-0 hidden h-[60%] w-[44%] bg-linear-to-b from-white via-white/80 to-transparent lg:block"
    />
    <div
      aria-hidden="true"
      className="pointer-events-none absolute bottom-0 left-[24%] hidden h-[60%] w-[20%] bg-linear-to-r from-transparent to-white lg:block"
    />

    <div className="relative mx-auto grid min-h-dvh max-w-[1440px] items-center gap-8 px-4 py-8 lg:h-full lg:min-h-0 lg:grid-cols-[minmax(0,5fr)_minmax(0,8fr)] lg:gap-[3vw] lg:px-[3vw] lg:py-[3vh]">
      <Link to="/" aria-label="MedaPark, ir al inicio" className="flex justify-center lg:self-start lg:pt-[6vh]">
        <Logo variant="vertical" className="h-36 lg:h-[26vh]" />
      </Link>

      <main className="w-full max-w-[800px] justify-self-center rounded-3xl bg-white p-6 shadow-[0_12px_40px_rgba(11,37,89,0.08)] sm:p-12 lg:max-w-[min(800px,56vw)] lg:justify-self-end lg:px-[clamp(32px,5vw,72px)] lg:py-[clamp(24px,6vh,72px)]">
        <Outlet />
      </main>
    </div>
  </div>
);

export default AuthLayout;
