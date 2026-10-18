import { ShieldCheck } from 'lucide-react';

/** Placeholder de la 001: la feature 002 lo reemplaza por "Mi parqueadero" (HU4). */
const Panel = () => {
  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-3xl font-bold text-navy-900">Hola de nuevo</h1>
        <p className="mt-1 text-base text-ink-500">
          Tu sesión está protegida con verificación en dos pasos.
        </p>
      </div>
      <div className="flex items-center gap-4 rounded-2xl border border-line bg-white p-7">
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600">
          <ShieldCheck size={28} aria-hidden="true" />
        </span>
        <div>
          <p className="text-lg font-semibold text-navy-900">Sesión activa</p>
          <p className="text-base text-ink-500">
            Aquí aparecerá la información de tu parqueadero.
          </p>
        </div>
      </div>
    </section>
  );
};

export default Panel;
