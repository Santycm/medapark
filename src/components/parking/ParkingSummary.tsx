import { Building2, Map, MapPin } from 'lucide-react';
import { formatCoord } from '../../lib/format';
import type { ParkingLot } from '../../domain/parking';
import Badge from '../common/Badge';

/** Resumen del parqueadero (nombre, dirección, coordenadas y estado) para las pantallas de celdas y ocupación. */
const ParkingSummary = ({ parking }: { parking: ParkingLot }) => (
  <section aria-label="Resumen del parqueadero" className="rounded-2xl border border-line bg-white p-5">
    <div className="flex items-center gap-4">
      <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-accent-50 text-navy-900">
        <Building2 size={26} aria-hidden="true" />
      </span>
      <h2 className="text-2xl font-bold text-navy-900">{parking.name}</h2>
    </div>
    <hr className="my-4 border-line" />
    <div className="flex flex-wrap items-center gap-x-10 gap-y-4">
      <div className="flex items-start gap-3">
        <MapPin size={22} aria-hidden="true" className="mt-0.5 text-navy-900" />
        <div>
          <p className="font-semibold text-navy-900">Dirección</p>
          <p className="text-ink-500">{parking.address}</p>
        </div>
      </div>
      <div className="flex items-start gap-3">
        <Map size={22} aria-hidden="true" className="mt-0.5 text-navy-900" />
        <div>
          <p className="font-semibold text-navy-900">Coordenadas</p>
          <p className="text-ink-500">Latitud: {formatCoord(parking.latitude)}</p>
          <p className="text-ink-500">Longitud: {formatCoord(parking.longitude)}</p>
        </div>
      </div>
      <div className="ml-auto">
        <Badge active={parking.status} />
      </div>
    </div>
  </section>
);

export default ParkingSummary;
