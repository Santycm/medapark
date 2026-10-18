import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Bike, BarChart3, Car, Info, Save, type LucideIcon } from 'lucide-react';
import Alert from '../../components/common/Alert';
import Button from '../../components/common/Button';
import FieldMessage from '../../components/common/FieldMessage';
import NumberStepper from '../../components/common/NumberStepper';
import FormPage from '../../components/parking/FormPage';
import ParkingSummary from '../../components/parking/ParkingSummary';
import {
  isCapacityValid,
  sortConfigs,
  VEHICLE_LABEL,
  type ParkingLot,
  type VehicleType,
} from '../../domain/parking';
import { useMyParking } from '../../hooks/useMyParking';
import { MSG } from '../../lib/messages';
import { configureSpaces } from '../../services/adminParking';

const STYLE: Record<VehicleType, { bg: string; fg: string; Icon: LucideIcon }> = {
  CAR: { bg: 'bg-accent-50', fg: 'text-accent-600', Icon: Car },
  MOTORCYCLE: { bg: 'bg-brand-50', fg: 'text-brand-600', Icon: Bike },
};

const Form = ({ parking }: { parking: ParkingLot }) => {
  const navigate = useNavigate();
  const { reload } = useMyParking();
  const configs = sortConfigs(parking.parking_vehicle_configs);

  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(configs.map((c) => [c.id, String(c.total_spaces)])),
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState('');
  const [saving, setSaving] = useState(false);

  const numberOf = (id: string) => (values[id] === '' ? 0 : Number(values[id]));
  const total = configs.reduce((sum, c) => sum + numberOf(c.id), 0);

  const save = async () => {
    setServerError('');

    const nextErrors: Record<string, string> = {};
    for (const c of configs) {
      if (!isCapacityValid(numberOf(c.id), c.occupied_spaces)) nextErrors[c.id] = MSG.celdas.reducir;
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const changes = configs
      .filter((c) => numberOf(c.id) !== c.total_spaces)
      .map((c) => ({ config_id: c.id, total_spaces: numberOf(c.id) }));

    if (changes.length === 0) {
      navigate('/admin');
      return;
    }

    setSaving(true);
    const result = await configureSpaces(changes);

    if (result.ok) {
      await reload();
      navigate('/admin', { replace: true, state: { flash: MSG.celdas.actualizadas } });
      return;
    }

    if (result.code === 'CAPACIDAD_MENOR_A_OCUPADAS') await reload();
    setServerError(result.message);
    setSaving(false);
  };

  return (
    <FormPage
      title="Configurar celdas del parqueadero"
      subtitle="Define la cantidad de celdas disponibles para automóviles y motocicletas."
      crumbs={[{ label: 'Mi parqueadero', to: '/admin' }, { label: 'Configurar celdas' }]}
    >
      <ParkingSummary parking={parking} />

      <section className="rounded-2xl border border-line bg-white" aria-label="Configuración de celdas">
        <div className="space-y-4 p-6">
          <h2 className="text-xl font-bold text-navy-900">Configuración de celdas</h2>

          <div className="grid gap-4 md:grid-cols-2">
            {configs.map((c) => {
              const { bg, fg, Icon } = STYLE[c.vehicle_type];
              const label = VEHICLE_LABEL[c.vehicle_type].plural;
              return (
                <div key={c.id} className={`flex items-start gap-4 rounded-[14px] p-5 ${bg}`}>
                  <span className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-white/70 ${fg}`}>
                    <Icon size={28} aria-hidden="true" />
                  </span>
                  <div className="min-w-0 space-y-2">
                    <h3 className="text-lg font-bold text-navy-900">{label}</h3>
                    <p className="text-ink-500">Cantidad total de celdas</p>
                    <NumberStepper
                      label={`Celdas de ${label}`}
                      value={values[c.id]}
                      onChange={(next) => {
                        setValues((current) => ({ ...current, [c.id]: next }));
                        setErrors((current) => ({ ...current, [c.id]: '' }));
                      }}
                    />
                    <p className="flex items-center gap-2 text-sm text-ink-500">
                      <Info size={16} aria-hidden="true" className="text-accent-600" />
                      {MSG.celdas.enteroNoNegativo}
                    </p>
                    <p className="text-sm font-medium text-navy-900">Ocupadas actualmente: {c.occupied_spaces}</p>
                    <FieldMessage>{errors[c.id]}</FieldMessage>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-5 rounded-[14px] border border-line bg-canvas/60 p-5" aria-live="polite">
            <span className="flex h-[52px] w-[52px] items-center justify-center rounded-full bg-accent-50 text-accent-600">
              <BarChart3 size={24} aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <h3 className="text-lg font-bold text-navy-900">Total de celdas configuradas</h3>
              <p className="text-sm text-ink-500">Suma de celdas disponibles en el parqueadero.</p>
            </div>
            {configs.map((c) => {
              const Icon = STYLE[c.vehicle_type].Icon;
              return (
                <div key={c.id} className="flex flex-col items-center">
                  <span className="flex items-center gap-2 text-2xl font-bold text-navy-900">
                    <Icon size={22} aria-hidden="true" />
                    {numberOf(c.id)}
                  </span>
                  <span className="text-sm text-ink-500">{VEHICLE_LABEL[c.vehicle_type].plural}</span>
                </div>
              );
            })}
            <div className="flex flex-col items-center rounded-xl bg-brand-50 px-7 py-2.5">
              <span className="text-sm font-medium text-brand-700">Total</span>
              <span className="text-4xl font-bold text-brand-600">{total}</span>
            </div>
          </div>

          {serverError && <Alert>{serverError}</Alert>}
        </div>

        <div className="flex justify-end gap-3 border-t border-line px-6 py-4">
          <Button variant="secondary" onClick={() => navigate('/admin')} disabled={saving} className="px-7 py-3">
            Cancelar
          </Button>
          <Button onClick={save} loading={saving} className="px-7 py-3">
            <Save size={18} aria-hidden="true" />
            Guardar cambios
          </Button>
        </div>
      </section>
    </FormPage>
  );
};

/** HU6: cantidad de celdas por tipo de vehículo. */
const ConfigureSpaces = () => {
  const my = useMyParking();
  if (my.state !== 'con_parqueadero') return null;
  return <Form parking={my.parking} />;
};

export default ConfigureSpaces;
