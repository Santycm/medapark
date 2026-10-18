import { Bike, Car } from 'lucide-react';
import {
  availableSpaces,
  sortConfigs,
  VEHICLE_LABEL,
  type ParkingLot,
  type VehicleConfig,
} from '../../domain/parking';

type Props = {
  parking: ParkingLot;
  /** Añade la columna "Celdas ocupadas" (pantalla de ocupación). */
  showOccupied?: boolean;
};

const STYLE = {
  CAR: { bg: 'bg-accent-50', fg: 'text-accent-600', Icon: Car },
  MOTORCYCLE: { bg: 'bg-brand-50', fg: 'text-brand-600', Icon: Bike },
} as const;

const Stat = ({ label, value, tone = 'text-navy-900' }: { label: string; value: number; tone?: string }) => (
  <div className="flex flex-col">
    <span className="text-sm text-ink-500">{label}</span>
    <span className={`text-3xl font-bold ${tone}`}>{value}</span>
  </div>
);

const Card = ({ config, showOccupied }: { config: VehicleConfig; showOccupied: boolean }) => {
  const { bg, fg, Icon } = STYLE[config.vehicle_type];
  const label = VEHICLE_LABEL[config.vehicle_type].plural;
  const available = availableSpaces(config);

  return (
    <li className={`flex items-center gap-4 rounded-[14px] p-5 ${bg}`}>
      <span className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white/70 ${fg}`}>
        <Icon size={26} aria-hidden="true" />
      </span>
      <div className="min-w-0 space-y-2">
        <h3 className="text-lg font-bold text-navy-900">{label}</h3>
        <span className="sr-only">{`${label}: ${available} disponibles / ${config.total_spaces}`}</span>
        <div className="flex flex-wrap gap-x-7 gap-y-2" aria-hidden="true">
          {showOccupied && <Stat label="Capacidad total" value={config.total_spaces} />}
          {showOccupied && <Stat label="Celdas ocupadas" value={config.occupied_spaces} tone="text-accent-600" />}
          <Stat label="Celdas disponibles" value={available} tone="text-brand-600" />
          {!showOccupied && <Stat label="Capacidad total" value={config.total_spaces} />}
        </div>
      </div>
    </li>
  );
};

const AvailabilityCards = ({ parking, showOccupied = false }: Props) => (
  <ul className="grid gap-4 md:grid-cols-2" aria-live="polite">
    {sortConfigs(parking.parking_vehicle_configs).map((config) => (
      <Card key={config.id} config={config} showOccupied={showOccupied} />
    ))}
  </ul>
);

export default AvailabilityCards;
