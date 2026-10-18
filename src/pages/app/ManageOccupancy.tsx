import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { ArrowLeft, BarChart3, Bike, Car, Info, LogIn, LogOut, type LucideIcon } from 'lucide-react';
import Alert from '../../components/common/Alert';
import Button from '../../components/common/Button';
import FieldMessage from '../../components/common/FieldMessage';
import RadioCard from '../../components/common/RadioCard';
import AvailabilityCards from '../../components/parking/AvailabilityCards';
import FormPage from '../../components/parking/FormPage';
import ParkingSummary from '../../components/parking/ParkingSummary';
import {
  availableSpaces,
  sortConfigs,
  totalCapacity,
  VEHICLE_LABEL,
  type ParkingLot,
  type VehicleConfig,
  type VehicleType,
} from '../../domain/parking';
import { useMyParking } from '../../hooks/useMyParking';
import { MSG } from '../../lib/messages';
import { registerEntry, registerExit } from '../../services/adminParking';

type Kind = 'ingreso' | 'salida';

const ICON: Record<VehicleType, LucideIcon> = { CAR: Car, MOTORCYCLE: Bike };

type CardProps = {
  kind: Kind;
  configs: VehicleConfig[];
  selected: string;
  onSelect: (id: string) => void;
  busy: boolean;
  onSubmit: () => void;
};

const ActionCard = ({ kind, configs, selected, onSelect, busy, onSubmit }: CardProps) => {
  const entry = kind === 'ingreso';
  const current = configs.find((c) => c.id === selected) ?? configs[0];
  const blocked = entry ? availableSpaces(current) <= 0 : current.occupied_spaces <= 0;
  const note = entry ? MSG.ocupacion.sinDisponibles : MSG.ocupacion.sinOcupadas;
  const title = entry ? 'Registrar ingreso' : 'Registrar salida';
  const HeadIcon = entry ? LogIn : LogOut;

  return (
    <section className="space-y-3 rounded-2xl border border-line bg-white p-5" aria-label={title}>
      <div className="flex items-center gap-3">
        <span
          className={`flex h-[46px] w-[46px] items-center justify-center rounded-full ${
            entry ? 'bg-brand-50 text-brand-600' : 'bg-danger-50 text-danger-600'
          }`}
        >
          <HeadIcon size={22} aria-hidden="true" />
        </span>
        <div>
          <h2 className="text-lg font-bold text-navy-900">{title}</h2>
          <p className="text-sm text-ink-500">
            {entry
              ? 'Aumenta en uno la cantidad de celdas ocupadas.'
              : 'Disminuye en uno la cantidad de celdas ocupadas.'}
          </p>
        </div>
      </div>

      <fieldset className="space-y-2">
        <legend className="text-sm font-semibold text-navy-900">
          Tipo de vehículo{' '}
          <span className="text-danger-600" aria-hidden="true">
            *
          </span>
        </legend>
        <div className="grid gap-3 sm:grid-cols-2">
          {configs.map((c) => {
            const Icon = ICON[c.vehicle_type];
            return (
              <RadioCard
                key={c.id}
                name={`tipo-${kind}`}
                value={c.id}
                checked={current.id === c.id}
                onChange={onSelect}
                title={VEHICLE_LABEL[c.vehicle_type].singular}
                icon={<Icon size={22} aria-hidden="true" />}
              />
            );
          })}
        </div>
      </fieldset>

      <Button
        variant={entry ? 'primary' : 'danger'}
        fullWidth
        onClick={onSubmit}
        loading={busy}
        disabled={blocked}
        className="py-3.5"
      >
        <HeadIcon size={18} aria-hidden="true" />
        {title}
      </Button>
      {blocked && <FieldMessage>{note}</FieldMessage>}
    </section>
  );
};

const Occupancy = ({ parking }: { parking: ParkingLot }) => {
  const { applyOccupancy, reload } = useMyParking();
  const configs = sortConfigs(parking.parking_vehicle_configs);

  const [entryId, setEntryId] = useState(configs[0].id);
  const [exitId, setExitId] = useState(configs[0].id);
  const [busy, setBusy] = useState<Kind | null>(null);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  const run = async (kind: Kind) => {
    const configId = kind === 'ingreso' ? entryId : exitId;
    setBusy(kind);
    setError('');
    setStatus('');

    const result = await (kind === 'ingreso' ? registerEntry : registerExit)(configId);

    if (result.ok) {
      applyOccupancy(configId, result.data);
      setStatus(kind === 'ingreso' ? MSG.ocupacion.ingresoRegistrado : MSG.ocupacion.salidaRegistrada);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setStatus(''), 3000);
    } else {
      setError(result.message);
      if (result.code === 'SIN_DISPONIBLES' || result.code === 'SIN_OCUPADAS') await reload();
    }
    setBusy(null);
  };

  return (
    <FormPage
      title="Gestionar ocupación"
      subtitle="Registra los ingresos y salidas de vehículos para mantener actualizada la ocupación."
      crumbs={[{ label: 'Mi parqueadero', to: '/admin' }, { label: 'Gestionar ocupación' }]}
    >
      <ParkingSummary parking={parking} />

      <section className="space-y-3 rounded-2xl border border-line bg-white p-5" aria-label="Ocupación actual">
        <div className="flex items-center gap-3.5">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-50 text-accent-600">
            <BarChart3 size={22} aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-xl font-bold text-navy-900">Ocupación actual</h2>
            <p className="text-sm text-ink-500">Cantidad de celdas ocupadas y disponibles por tipo de vehículo.</p>
          </div>
        </div>
        <AvailabilityCards parking={parking} showOccupied />
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <ActionCard
          kind="ingreso"
          configs={configs}
          selected={entryId}
          onSelect={setEntryId}
          busy={busy === 'ingreso'}
          onSubmit={() => void run('ingreso')}
        />
        <ActionCard
          kind="salida"
          configs={configs}
          selected={exitId}
          onSelect={setExitId}
          busy={busy === 'salida'}
          onSubmit={() => void run('salida')}
        />
      </div>

      <div aria-live="polite" className="space-y-3">
        {status && <Alert kind="success">{status}</Alert>}
        {error && <Alert>{error}</Alert>}
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-xl bg-accent-50 p-4">
        <Info size={20} aria-hidden="true" className="text-accent-600" />
        <p className="min-w-0 flex-1 text-sm text-navy-900">{MSG.ocupacion.info}</p>
        <Link
          to="/admin"
          className="inline-flex items-center gap-2 rounded-[10px] border-[1.5px] border-line bg-white px-4 py-2.5 text-sm font-semibold text-navy-900 hover:bg-canvas"
        >
          <ArrowLeft size={16} aria-hidden="true" />
          Volver al panel
        </Link>
      </div>
    </FormPage>
  );
};

/** HU7: registrar ingresos y salidas de vehículos. */
const ManageOccupancy = () => {
  const my = useMyParking();
  if (my.state !== 'con_parqueadero') return null;

  const { parking } = my;
  if (parking.parking_vehicle_configs.length === 0 || totalCapacity(parking) === 0) {
    return (
      <FormPage
        title="Gestionar ocupación"
        subtitle="Registra los ingresos y salidas de vehículos para mantener actualizada la ocupación."
      >
        <Alert kind="warning">
          {MSG.ocupacion.sinCapacidad}.{' '}
          <Link to="/admin/parqueadero/celdas" className="font-semibold underline">
            Configurar celdas
          </Link>
        </Alert>
      </FormPage>
    );
  }

  return <Occupancy parking={parking} />;
};

export default ManageOccupancy;
