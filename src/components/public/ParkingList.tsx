import { Bike, Car, ChevronRight } from 'lucide-react';
import { isFull, type PublicOffer, type PublicParking } from '../../domain/publicParking';
import { VEHICLE_LABEL } from '../../domain/parking';
import { MSG } from '../../lib/messages';

type Props = {
  parkings: PublicParking[];
  selectedId: string | null;
  onSelect: (id: string) => void;
};

/** Pin en forma de gota con un carro; el color indica el estado. */
const Pin = ({ tone }: { tone: 'disponible' | 'lleno' | 'seleccionado' }) => {
  const fill = { disponible: 'fill-brand-700', lleno: 'fill-ink-500/60', seleccionado: 'fill-accent-600' }[tone];
  return (
    <span aria-hidden="true" className="relative inline-block h-10 w-[34px] shrink-0">
      <svg width="34" height="40" viewBox="0 0 24 28" className="absolute inset-0">
        <path
          d="M12 1C6.5 1 2 5.4 2 10.9c0 7.3 10 16.1 10 16.1s10-8.8 10-16.1C22 5.4 17.5 1 12 1z"
          className={fill}
        />
      </svg>
      <span className="absolute left-[7px] top-[6px] flex h-5 w-5 items-center justify-center rounded-full bg-white text-navy-900">
        <Car size={13} />
      </span>
    </span>
  );
};

const Stats = ({ offer, full }: { offer: PublicOffer; full: boolean }) => {
  const Icon = offer.vehicle_type === 'CAR' ? Car : Bike;
  const label = VEHICLE_LABEL[offer.vehicle_type].plural;
  const none = offer.available_spaces === 0;

  return (
    <div className="flex items-center gap-4">
      <Icon size={16} aria-hidden="true" className="text-navy-900" />
      <span className="sr-only">{`${label}: ${offer.available_spaces} disponibles de ${offer.total_spaces}`}</span>
      <div className="flex items-center gap-4" aria-hidden="true">
        <div>
          <p className={`text-xl font-bold leading-none ${none || full ? 'text-ink-500' : 'text-brand-700'}`}>
            {offer.available_spaces}
          </p>
          <p className="text-xs text-ink-500">Celdas disponibles</p>
        </div>
        <span className="h-8 w-px bg-line" />
        <div>
          <p className="text-xl font-bold leading-none text-navy-900">{offer.total_spaces}</p>
          <p className="text-xs text-ink-500">Capacidad total</p>
        </div>
      </div>
    </div>
  );
};

const ParkingList = ({ parkings, selectedId, onSelect }: Props) => (
  <section aria-label="Lista de parqueaderos" className="flex h-full min-h-0 flex-col">
    <header className="flex items-center gap-2.5 px-5 py-4">
      <Car size={22} aria-hidden="true" className="text-navy-900" />
      <h2 className="text-lg font-bold text-navy-900">{MSG.publico.listaTitulo(parkings.length)}</h2>
    </header>

    {parkings.length === 0 ? (
      <p className="px-5 pb-5 text-ink-500">{MSG.publico.vacio}</p>
    ) : (
      <ul className="min-h-0 flex-1 space-y-2.5 overflow-y-auto px-3 pb-3">
        {parkings.map((parking) => {
          const selected = parking.id === selectedId;
          const full = isFull(parking);
          return (
            <li key={parking.id}>
              <button
                type="button"
                onClick={() => onSelect(parking.id)}
                aria-current={selected ? 'true' : undefined}
                className={`flex w-full items-center gap-3 rounded-xl border p-3.5 text-left transition focus:outline-none focus-visible:ring-4 focus-visible:ring-accent-600/25 ${
                  selected ? 'border-accent-600/25 bg-accent-50' : 'border-line bg-white hover:bg-canvas'
                }`}
              >
                <Pin tone={selected ? 'seleccionado' : full ? 'lleno' : 'disponible'} />
                <span className="min-w-0 flex-1 space-y-1.5">
                  <span className="block font-bold text-navy-900">{parking.name}</span>
                  <span className="flex items-center gap-1.5 text-sm text-ink-500">
                    <span
                      aria-hidden="true"
                      className={`h-2 w-2 shrink-0 rounded-full ${full ? 'bg-ink-500/60' : 'bg-brand-600'}`}
                    />
                    {parking.address}
                  </span>
                  <span className="block space-y-1.5">
                    {parking.offers.map((offer) => (
                      <Stats key={offer.vehicle_type} offer={offer} full={full} />
                    ))}
                  </span>
                  {full && (
                    <span className="inline-block rounded-full bg-canvas px-2.5 py-0.5 text-xs font-semibold text-ink-500">
                      {MSG.publico.sinCeldas}
                    </span>
                  )}
                </span>
                <ChevronRight size={22} aria-hidden="true" className="shrink-0 text-navy-900" />
              </button>
            </li>
          );
        })}
      </ul>
    )}
  </section>
);

export default ParkingList;
