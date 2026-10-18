import { useEffect, useId, useRef, type ReactNode } from 'react';
import {
  Bike,
  ChartColumn,
  Car,
  CircleDollarSign,
  Clock,
  Mail,
  MapPin,
  Navigation,
  Phone,
  X,
  type LucideIcon,
} from 'lucide-react';
import { VEHICLE_LABEL } from '../../domain/parking';
import {
  googleMapsUrl,
  hasValidCoordinates,
  type PublicOffer,
  type PublicParking,
} from '../../domain/publicParking';
import { formatCOP } from '../../lib/format';
import { MSG } from '../../lib/messages';
import Alert from '../common/Alert';

type Props = { parking: PublicParking; onClose: () => void };

const ICON: Record<PublicOffer['vehicle_type'], LucideIcon> = { CAR: Car, MOTORCYCLE: Bike };
const TONE = {
  CAR: 'bg-accent-50 text-accent-600',
  MOTORCYCLE: 'bg-brand-50 text-brand-600',
} as const;

const Section = ({ icon: Icon, title, children }: { icon: LucideIcon; title: string; children: ReactNode }) => (
  <section className="space-y-3 border-t border-line pt-4">
    <h3 className="flex items-center gap-2.5 font-bold text-navy-900">
      <Icon size={20} aria-hidden="true" />
      {title}
    </h3>
    {children}
  </section>
);

/**
 * Detalle del parqueadero seleccionado (HU10/HU11). En escritorio ocupa la columna derecha;
 * en móvil se muestra a pantalla completa.
 */
const ParkingDetailPanel = ({ parking, onClose }: Props) => {
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const showRoute = hasValidCoordinates(parking.latitude, parking.longitude);

  // Foco inicial en la "X" y devolución del foco al cerrar.
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    return () => previous?.focus?.();
  }, []);

  return (
    <div
      role="dialog"
      aria-labelledby={titleId}
      className="fixed inset-0 z-1500 overflow-y-auto bg-white p-5 lg:static lg:z-auto lg:h-full lg:rounded-[14px] lg:border lg:border-line"
    >
      <div className="space-y-4">
        <div className="flex items-center gap-3.5">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-accent-50 text-accent-600">
            <Car size={26} aria-hidden="true" />
          </span>
          <h2 id={titleId} className="min-w-0 flex-1 text-xl font-bold text-navy-900">
            {parking.name}
          </h2>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Cerrar detalle"
            className="rounded-lg p-2 text-navy-900 hover:bg-canvas focus:outline-none focus-visible:ring-4 focus-visible:ring-accent-600/25"
          >
            <X size={24} aria-hidden="true" />
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-3 border-t border-line pt-4">
          <MapPin size={22} aria-hidden="true" className="shrink-0 text-navy-900" />
          <div className="min-w-0 flex-1">
            <p className="font-bold text-navy-900">Dirección</p>
            <p className="text-ink-500">{parking.address}</p>
          </div>
          {showRoute && (
            <a
              href={googleMapsUrl(parking.latitude, parking.longitude)}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${MSG.publico.comoLlegar} a ${parking.name} (se abre en Google Maps)`}
              className="inline-flex items-center gap-2 rounded-[10px] border-[1.5px] border-accent-600 bg-white px-3.5 py-2.5 text-sm font-semibold text-accent-600 transition hover:bg-accent-50 focus:outline-none focus-visible:ring-4 focus-visible:ring-accent-600/25"
            >
              <Navigation size={18} aria-hidden="true" />
              {MSG.publico.comoLlegar}
            </a>
          )}
        </div>

        <div className="grid gap-4 border-t border-line pt-4 sm:grid-cols-2">
          <div className="flex items-start gap-3">
            <Clock size={20} aria-hidden="true" className="mt-0.5 shrink-0 text-navy-900" />
            <div>
              <p className="font-bold text-navy-900">Horario de atención</p>
              <p className="whitespace-pre-line text-ink-500">{parking.opening_hours}</p>
            </div>
          </div>
          <div>
            <p className="font-bold text-navy-900">Información de contacto</p>
            <p className="mt-1 flex items-center gap-2 text-ink-500">
              <Phone size={16} aria-hidden="true" className="text-navy-900" />
              <a href={`tel:${parking.phone}`} className="hover:underline">
                {parking.phone}
              </a>
            </p>
            {parking.contact_email && (
              <p className="mt-1 flex items-center gap-2 break-all text-ink-500">
                <Mail size={16} aria-hidden="true" className="shrink-0 text-navy-900" />
                {parking.contact_email}
              </p>
            )}
          </div>
        </div>

        <Section icon={ChartColumn} title="Disponibilidad actual de celdas">
          <ul className="grid gap-3 sm:grid-cols-2" aria-live="polite">
            {parking.offers.map((offer) => {
              const Icon = ICON[offer.vehicle_type];
              const label = VEHICLE_LABEL[offer.vehicle_type].plural;
              const none = offer.available_spaces === 0;
              return (
                <li key={offer.vehicle_type} className="rounded-xl border border-line p-3.5">
                  <p className="flex items-center gap-2 font-bold text-navy-900">
                    <span className={`flex h-8 w-8 items-center justify-center rounded-full ${TONE[offer.vehicle_type]}`}>
                      <Icon size={16} aria-hidden="true" />
                    </span>
                    {label}
                  </p>
                  <div className="mt-2 flex gap-5">
                    <div>
                      <p className={`text-3xl font-bold ${none ? 'text-ink-500' : 'text-brand-600'}`}>
                        {offer.available_spaces}
                      </p>
                      <p className="text-xs text-ink-500">celdas disponibles</p>
                    </div>
                    <div>
                      <p className="text-3xl font-bold text-navy-900">{offer.total_spaces}</p>
                      <p className="text-xs text-ink-500">capacidad total</p>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </Section>

        <Section icon={CircleDollarSign} title="Tarifas configuradas">
          <ul className="flex justify-around rounded-xl border border-line p-3.5 text-center">
            {parking.offers.map((offer) => (
              <li key={offer.vehicle_type}>
                <p className="font-bold text-navy-900">{VEHICLE_LABEL[offer.vehicle_type].plural}</p>
                <p className="text-2xl font-bold text-navy-900">{formatCOP(offer.hourly_rate)}</p>
                <p className="text-xs text-ink-500">por hora</p>
              </li>
            ))}
          </ul>
        </Section>

        <Alert kind="info">{MSG.publico.notaUltimoEstado}</Alert>
      </div>
    </div>
  );
};

export default ParkingDetailPanel;
