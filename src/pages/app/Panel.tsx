import { useEffect, useState, type ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import {
  Building2,
  Car,
  ChevronRight,
  CircleDollarSign,
  Clock,
  LayoutGrid,
  Mail,
  Map,
  MapPin,
  Pencil,
  Phone,
  Plus,
  type LucideIcon,
} from 'lucide-react';
import Alert from '../../components/common/Alert';
import Badge from '../../components/common/Badge';
import Breadcrumbs from '../../components/common/Breadcrumbs';
import Loader from '../../components/common/Loader';
import AvailabilityCards from '../../components/parking/AvailabilityCards';
import PublishNotice from '../../components/parking/PublishNotice';
import { sortConfigs, totalCapacity, VEHICLE_LABEL, type ParkingLot } from '../../domain/parking';
import { useMyParking } from '../../hooks/useMyParking';
import { formatCOP, formatCoord } from '../../lib/format';
import { MSG } from '../../lib/messages';
import ParkingLoadError from '../../router/guards/ParkingLoadError';

const primaryLink =
  'inline-flex items-center justify-center gap-2 rounded-[10px] bg-brand-600 px-6 py-3.5 text-base font-semibold text-white transition hover:bg-brand-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/30';

/** Mensaje de éxito que llega por `location.state.flash` y se oculta a los 5 s. */
function useFlash(): string | null {
  const location = useLocation();
  const navigate = useNavigate();
  const [flash, setFlash] = useState<string | null>(
    (location.state as { flash?: string } | null)?.flash ?? null,
  );

  useEffect(() => {
    if (!flash) return;
    // Limpia el state para que el mensaje no reaparezca al recargar.
    navigate(location.pathname, { replace: true, state: null });
    const timer = setTimeout(() => setFlash(null), 5000);
    return () => clearTimeout(timer);
  }, [flash, location.pathname, navigate]);

  return flash;
}

const Field = ({ icon: Icon, label, children }: { icon: LucideIcon; label: string; children: ReactNode }) => (
  <div className="flex items-start gap-3.5">
    <Icon size={24} aria-hidden="true" className="mt-0.5 shrink-0 text-navy-900" />
    <div className="min-w-0">
      <p className="font-semibold text-navy-900">{label}</p>
      <div className="text-ink-500">{children}</div>
    </div>
  </div>
);

type AccessCardProps = {
  to: string;
  icon: LucideIcon;
  title: string;
  description: string;
  tone: 'accent' | 'brand';
  disabledNote?: string;
};

const AccessCard = ({ to, icon: Icon, title, description, tone, disabledNote }: AccessCardProps) => {
  const circle = tone === 'accent' ? 'bg-accent-50 text-accent-600' : 'bg-brand-50 text-brand-600';
  const body = (
    <>
      <span className={`flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-full ${circle}`}>
        <Icon size={24} aria-hidden="true" />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="text-lg font-bold text-navy-900">{title}</span>
        <span className="text-sm text-ink-500">{disabledNote ?? description}</span>
      </span>
      {!disabledNote && <ChevronRight size={22} aria-hidden="true" className="text-navy-900" />}
    </>
  );
  const base = 'flex items-center gap-3.5 rounded-2xl border border-line bg-white p-5';

  if (disabledNote) {
    return (
      <div aria-disabled="true" className={`${base} cursor-not-allowed opacity-60`}>
        {body}
      </div>
    );
  }
  return (
    <Link
      to={to}
      className={`${base} transition hover:border-brand-600 focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/20`}
    >
      {body}
    </Link>
  );
};

const ParkingView = ({ parking }: { parking: ParkingLot }) => {
  const flash = useFlash();
  const configs = sortConfigs(parking.parking_vehicle_configs);
  const hasTypes = configs.length > 0;
  const noCapacity = !hasTypes || totalCapacity(parking) === 0;

  return (
    <div className="space-y-4">
      <Breadcrumbs items={[{ label: 'Inicio', to: '/' }, { label: 'Mi parqueadero' }]} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-navy-900">Mi parqueadero</h1>
          <p className="text-base text-ink-500">Consulta la información general de tu parqueadero.</p>
        </div>
        <Badge active={parking.status} />
      </div>

      <PublishNotice parking={parking} />
      {flash && <Alert kind="success">{flash}</Alert>}

      <section className="rounded-2xl border border-line bg-white p-6" aria-label="Información del parqueadero">
        <div className="flex flex-wrap items-center gap-4">
          <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-accent-50 text-navy-900">
            <Building2 size={30} aria-hidden="true" />
          </span>
          <h2 className="min-w-0 flex-1 text-2xl font-bold text-navy-900">{parking.name}</h2>
          <Link
            to="/admin/parqueadero/editar"
            className="inline-flex items-center gap-2 rounded-[10px] border-[1.5px] border-line bg-white px-4 py-3 text-sm font-semibold text-navy-900 transition hover:bg-canvas focus:outline-none focus-visible:ring-4 focus-visible:ring-navy-900/15"
          >
            <Pencil size={18} aria-hidden="true" />
            Editar información
          </Link>
          {noCapacity ? (
            <button
              type="button"
              disabled
              className="inline-flex cursor-not-allowed items-center gap-2 rounded-[10px] bg-accent-600 px-4 py-3 text-sm font-semibold text-white opacity-50"
            >
              <Car size={18} aria-hidden="true" />
              Gestionar ocupación
            </button>
          ) : (
            <Link
              to="/admin/ocupacion"
              className="inline-flex items-center gap-2 rounded-[10px] bg-accent-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-accent-600/90 focus:outline-none focus-visible:ring-4 focus-visible:ring-accent-600/30"
            >
              <Car size={18} aria-hidden="true" />
              Gestionar ocupación
            </Link>
          )}
        </div>

        <hr className="my-5 border-line" />

        <div className="grid gap-x-8 gap-y-6 md:grid-cols-3">
          <Field icon={MapPin} label="Dirección">
            {parking.address}
          </Field>
          <Field icon={Map} label="Coordenadas">
            <p>Latitud: {formatCoord(parking.latitude)}</p>
            <p>Longitud: {formatCoord(parking.longitude)}</p>
          </Field>
          <Field icon={Phone} label="Teléfono de contacto">
            {parking.phone}
          </Field>
          <Field icon={Mail} label="Correo electrónico de contacto">
            {parking.contact_email ?? MSG.parqueadero.correoNoRegistrado}
          </Field>
          <Field icon={Clock} label="Horario de atención">
            <p className="whitespace-pre-line">{parking.opening_hours}</p>
          </Field>
          <Field icon={CircleDollarSign} label="Tarifas por hora">
            {hasTypes ? (
              configs.map((c) => (
                <p key={c.id}>
                  {VEHICLE_LABEL[c.vehicle_type].plural}: {formatCOP(c.hourly_rate)}
                </p>
              ))
            ) : (
              <p>—</p>
            )}
          </Field>
        </div>
      </section>

      {hasTypes && (
        <section className="space-y-3 rounded-2xl border border-line bg-white p-6" aria-label="Disponibilidad">
          <h2 className="text-xl font-bold text-navy-900">Disponibilidad por tipo de vehículo</h2>
          <AvailabilityCards parking={parking} />
        </section>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <AccessCard
          to="/admin/ocupacion"
          icon={Car}
          tone="accent"
          title="Gestionar ocupación"
          description="Registra los ingresos y salidas de vehículos y consulta la ocupación en tiempo real."
          disabledNote={noCapacity ? MSG.ocupacion.sinCapacidad : undefined}
        />
        <AccessCard
          to="/admin/parqueadero/editar"
          icon={Pencil}
          tone="brand"
          title="Editar información"
          description="Modifica la información básica de tu parqueadero (dirección, contacto, tarifas, etc.)."
        />
        <AccessCard
          to="/admin/parqueadero/celdas"
          icon={LayoutGrid}
          tone="accent"
          title="Configurar celdas"
          description="Define la cantidad de celdas disponibles para automóviles y motocicletas."
          disabledNote={!hasTypes ? MSG.parqueadero.avisoSinTipos : undefined}
        />
      </div>
    </div>
  );
};

/** HU4: panel "Mi parqueadero". */
const Panel = () => {
  const my = useMyParking();
  const flash = useFlash();

  if (my.state === 'cargando') return <Loader fullScreen={false} />;
  if (my.state === 'error') return <ParkingLoadError message={my.message} onRetry={my.reload} />;
  if (my.state === 'con_parqueadero') return <ParkingView parking={my.parking} />;

  return (
    <div className="space-y-4">
      <Breadcrumbs items={[{ label: 'Inicio', to: '/' }, { label: 'Mi parqueadero' }]} />
      {flash && <Alert kind="success">{flash}</Alert>}
      <div className="flex justify-center py-10">
        <section className="flex w-full max-w-[560px] flex-col items-center gap-4 rounded-2xl border border-line bg-white p-10 text-center">
          <span className="flex h-20 w-20 items-center justify-center rounded-full bg-brand-50 text-brand-600">
            <Building2 size={38} aria-hidden="true" />
          </span>
          <h1 className="text-2xl font-bold text-navy-900">Aún no has registrado tu parqueadero</h1>
          <p className="text-base text-ink-500">
            Registra la información de tu parqueadero para que los usuarios puedan consultarlo.
          </p>
          <Link to="/admin/parqueadero/registrar" className={primaryLink}>
            <Plus size={18} aria-hidden="true" />
            Registrar parqueadero
          </Link>
        </section>
      </div>
    </div>
  );
};

export default Panel;
