import { Link, useLocation } from 'react-router';
import { MSG } from '../lib/messages';

const NotFound = () => {
  const { pathname } = useLocation();
  const inAdmin = pathname.startsWith('/admin');

  return (
    <section className="flex min-h-64 flex-col items-center justify-center px-4 py-16 text-center">
      <p className="text-7xl font-bold text-brand-600">404</p>
      <h1 className="mt-3 text-3xl font-bold text-navy-900">{MSG.general.noEncontrada}</h1>
      <Link
        to={inAdmin ? '/admin' : '/'}
        className="mt-5 rounded-[10px] bg-brand-600 px-6 py-3.5 text-base font-semibold text-white transition hover:bg-brand-700"
      >
        {inAdmin ? 'Volver al panel' : 'Volver al inicio'}
      </Link>
    </section>
  );
};

export default NotFound;
