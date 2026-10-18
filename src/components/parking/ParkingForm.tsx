import { useEffect, useMemo, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Bike,
  Building2,
  Car,
  CircleDollarSign,
  Clock,
  Globe,
  LayoutGrid,
  Mail,
  MapPin,
  Phone,
  Save,
  type LucideIcon,
} from 'lucide-react';
import {
  canRemoveType,
  isOutsideMedellin,
  type VehicleConfig,
  type VehicleType,
} from '../../domain/parking';
import { makeParkingFormSchema, type ParkingFormValues } from '../../domain/schemas/parking';
import { formatCoord, normalizeDecimal } from '../../lib/format';
import { MSG } from '../../lib/messages';
import type { ParkingErrorCode } from '../../services/parkingErrors';
import Alert from '../common/Alert';
import Button from '../common/Button';
import Checkbox from '../common/Checkbox';
import FieldMessage from '../common/FieldMessage';
import RadioCard from '../common/RadioCard';
import TextField from '../common/TextField';
import LocationPicker from '../map/LocationPicker';

export type ParkingServerError = {
  message: string;
  code?: ParkingErrorCode;
  vehicleType?: VehicleType;
};

type Props = {
  mode: 'registrar' | 'editar';
  defaultValues: ParkingFormValues;
  /** Configuraciones guardadas (solo en edición). */
  savedConfigs?: VehicleConfig[];
  onSubmit: (values: ParkingFormValues) => void | Promise<void>;
  onCancel: () => void;
  submitting?: boolean;
  serverError?: ParkingServerError | null;
};

const coordinate = (raw: string, limit: number): number | null => {
  const n = Number(normalizeDecimal(raw));
  return raw.trim() !== '' && Number.isFinite(n) && Math.abs(n) <= limit ? n : null;
};

const ParkingForm = ({
  mode,
  defaultValues,
  savedConfigs,
  onSubmit,
  onCancel,
  submitting = false,
  serverError,
}: Props) => {
  const savedKey = (savedConfigs ?? []).map((c) => c.vehicle_type).join(',');
  const schema = useMemo(
    () =>
      makeParkingFormSchema({
        mode,
        savedTypes: savedKey === '' ? [] : (savedKey.split(',') as VehicleType[]),
      }),
    [mode, savedKey],
  );

  const {
    register,
    handleSubmit,
    control,
    setValue,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<ParkingFormValues>({
    resolver: zodResolver(schema),
    mode: 'onTouched',
    defaultValues,
  });

  const [showSummary, setShowSummary] = useState(false);
  const values = useWatch({ control }) as ParkingFormValues;
  const lat = coordinate(values.latitude, 90);
  const lng = coordinate(values.longitude, 180);
  const outside = lat !== null && lng !== null && isOutsideMedellin(lat, lng);

  // Un error del servidor que apunta a un tipo concreto se ubica en su campo.
  useEffect(() => {
    if (!serverError?.vehicleType) return;
    const field =
      serverError.code === 'TIPO_CON_CELDAS'
        ? serverError.vehicleType === 'CAR'
          ? 'servesCars'
          : 'servesMotorcycles'
        : serverError.vehicleType === 'CAR'
          ? 'carSpaces'
          : 'motorcycleSpaces';
    setError(field, { type: 'server', message: serverError.message });
  }, [serverError, setError]);

  const toggleType =
    (field: 'servesCars' | 'servesMotorcycles', type: VehicleType) => (checked: boolean) => {
      const saved = savedConfigs?.find((c) => c.vehicle_type === type);
      if (!checked && !canRemoveType(saved)) {
        setValue(field, true);
        setError(field, { type: 'manual', message: MSG.parqueadero.quitarTipo });
        return;
      }
      clearErrors(['servesCars', 'servesMotorcycles']);
      setValue(field, checked, { shouldDirty: true, shouldValidate: true });
    };

  const onInvalid = () => setShowSummary(true);
  const submit = handleSubmit(async (v) => {
    setShowSummary(false);
    await onSubmit(v);
  }, onInvalid);

  const groupError = errors.servesCars?.message ?? errors.servesMotorcycles?.message;
  const editing = mode === 'editar';

  /** Tarjeta de un tipo de vehículo: aparece y desaparece con su check, en su propia columna. */
  const typeFields = (
    serves: boolean,
    label: string,
    Icon: LucideIcon,
    tone: string,
    column: string,
    rate: 'carRate' | 'motorcycleRate',
    spaces: 'carSpaces' | 'motorcycleSpaces',
  ) =>
    serves && (
      <section
        aria-label={`Configuración de ${label}`}
        className={`space-y-4 rounded-[14px] border border-line p-4 ${tone} ${column}`}
      >
        <h3 className="flex items-center gap-2 text-base font-bold text-navy-900">
          <Icon size={20} aria-hidden="true" />
          {label}
        </h3>
        <TextField
          label={`Tarifa por hora (${label})`}
          required
          inputMode="numeric"
          placeholder={rate === 'carRate' ? 'Ej. 5000' : 'Ej. 2000'}
          icon={<CircleDollarSign size={18} aria-hidden="true" />}
          hint="Solo se permiten caracteres numéricos."
          error={errors[rate]?.message}
          {...register(rate)}
        />
        <TextField
          label={`Capacidad de celdas (${label})`}
          required
          inputMode="numeric"
          placeholder={spaces === 'carSpaces' ? 'Ej. 50' : 'Ej. 20'}
          icon={<LayoutGrid size={18} aria-hidden="true" />}
          hint="Solo se permiten caracteres numéricos."
          error={errors[spaces]?.message}
          {...register(spaces)}
        />
      </section>
    );

  return (
    <form
      noValidate
      onSubmit={submit}
      className="overflow-hidden rounded-2xl border border-line bg-white"
      aria-label={editing ? 'Editar parqueadero' : 'Registrar parqueadero'}
    >
      <div className="grid gap-8 p-5 sm:p-7 lg:grid-cols-2">
        <div className="space-y-4">
          <TextField
            label="Nombre del parqueadero"
            required
            placeholder="Ej. Parqueadero Centro"
            icon={<Building2 size={18} aria-hidden="true" />}
            error={errors.name?.message}
            {...register('name')}
          />
          <TextField
            label="Dirección"
            required
            placeholder="Ej. Calle 50 # 45-10, Medellín"
            icon={<MapPin size={18} aria-hidden="true" />}
            error={errors.address?.message}
            {...register('address')}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              label="Latitud"
              required
              inputMode="decimal"
              placeholder="Ej. 6.2442"
              icon={<Globe size={18} aria-hidden="true" />}
              hint={MSG.parqueadero.latitudRango}
              error={errors.latitude?.message}
              {...register('latitude')}
            />
            <TextField
              label="Longitud"
              required
              inputMode="decimal"
              placeholder="Ej. -75.5812"
              icon={<Globe size={18} aria-hidden="true" />}
              hint={MSG.parqueadero.longitudRango}
              error={errors.longitude?.message}
              {...register('longitude')}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              label="Teléfono de contacto"
              required
              inputMode="tel"
              placeholder="3001234567"
              icon={<Phone size={18} aria-hidden="true" />}
              hint="Solo se permiten caracteres numéricos."
              error={errors.phone?.message}
              {...register('phone')}
            />
            <TextField
              label={`Correo electrónico de contacto${editing ? '' : ' (opcional)'}`}
              type="email"
              placeholder="contacto@dominio.com"
              icon={<Mail size={18} aria-hidden="true" />}
              hint={MSG.parqueadero.correoFormato}
              error={errors.contactEmail?.message}
              {...register('contactEmail')}
            />
          </div>
          <TextField
            label="Horario de atención"
            required
            placeholder="Ej. Lunes a Domingo, 6:00 a.m. - 10:00 p.m."
            icon={<Clock size={18} aria-hidden="true" />}
            error={errors.openingHours?.message}
            {...register('openingHours')}
          />
        </div>

        <div className="space-y-4">
          <div>
            <p className="mb-1.5 text-sm font-semibold text-navy-900">
              Ubicación en el mapa{' '}
              <span className="text-danger-600" aria-hidden="true">
                *
              </span>
            </p>
            <LocationPicker
              latitude={lat}
              longitude={lng}
              onChange={(nextLat, nextLng) => {
                setValue('latitude', formatCoord(nextLat), {
                  shouldValidate: true,
                  shouldDirty: true,
                });
                setValue('longitude', formatCoord(nextLng), {
                  shouldValidate: true,
                  shouldDirty: true,
                });
              }}
            />
            <div className="mt-3 rounded-[10px] bg-accent-50 p-3.5 text-sm text-navy-900">
              <p>
                {editing
                  ? 'Puedes mover el marcador en el mapa para actualizar la ubicación.'
                  : 'Haz clic en el mapa o arrastra el marcador para establecer la ubicación del parqueadero.'}
              </p>
              <p className="mt-1 font-medium">
                Latitud: {lat !== null ? formatCoord(lat) : '—'}
                {'    '}
                Longitud: {lng !== null ? formatCoord(lng) : '—'}
              </p>
            </div>
            {outside && (
              <div className="mt-3">
                <Alert kind="warning">{MSG.parqueadero.fueraDeMedellin}</Alert>
              </div>
            )}
          </div>

          <fieldset className="space-y-3">
            <legend className="text-sm font-semibold text-navy-900">
              Tipos de vehículo atendidos{' '}
              <span className="text-danger-600" aria-hidden="true">
                *
              </span>
            </legend>
            <div className="flex flex-wrap gap-x-10 gap-y-3">
              <Checkbox
                label="Automóviles"
                icon={<Car size={22} aria-hidden="true" />}
                checked={values.servesCars}
                onChange={(event) => toggleType('servesCars', 'CAR')(event.target.checked)}
              />
              <Checkbox
                label="Motocicletas"
                icon={<Bike size={22} aria-hidden="true" />}
                checked={values.servesMotorcycles}
                onChange={(event) =>
                  toggleType('servesMotorcycles', 'MOTORCYCLE')(event.target.checked)
                }
              />
            </div>
            <FieldMessage>{groupError}</FieldMessage>
          </fieldset>

          {(values.servesCars || values.servesMotorcycles) && (
            <div className="grid items-start gap-4 sm:grid-cols-2">
              {typeFields(
                values.servesCars,
                'Automóviles',
                Car,
                'bg-accent-50/50',
                'sm:col-start-1',
                'carRate',
                'carSpaces',
              )}
              {typeFields(
                values.servesMotorcycles,
                'Motocicletas',
                Bike,
                'bg-brand-50/60',
                'sm:col-start-2',
                'motorcycleRate',
                'motorcycleSpaces',
              )}
            </div>
          )}

          {editing && (
            <fieldset className="space-y-3">
              <legend className="text-sm font-semibold text-navy-900">
                Estado del parqueadero
              </legend>
              <div className="grid gap-3 sm:grid-cols-2">
                <RadioCard
                  name="status"
                  value="activo"
                  checked={values.status === 'activo'}
                  onChange={() => setValue('status', 'activo', { shouldDirty: true })}
                  title="Activo"
                  description="El parqueadero aparece en el mapa y está disponible para los usuarios."
                />
                <RadioCard
                  name="status"
                  value="inactivo"
                  checked={values.status === 'inactivo'}
                  onChange={() => setValue('status', 'inactivo', { shouldDirty: true })}
                  title="Inactivo"
                  description="El parqueadero no aparece en el mapa y no está disponible."
                />
              </div>
            </fieldset>
          )}
        </div>
      </div>

      <div className="space-y-3 border-t border-line bg-canvas/60 px-5 py-4 sm:px-7">
        {showSummary && <FieldMessage>{MSG.parqueadero.requeridos}</FieldMessage>}
        {serverError && <Alert>{serverError.message}</Alert>}
        <div className="flex justify-end gap-3">
          <Button
            variant="secondary"
            onClick={onCancel}
            disabled={submitting}
            className="px-7 py-3"
          >
            Cancelar
          </Button>
          <Button type="submit" loading={submitting} className="px-7 py-3">
            <Save size={18} aria-hidden="true" />
            {editing ? 'Guardar cambios' : 'Guardar'}
          </Button>
        </div>
      </div>
    </form>
  );
};

export default ParkingForm;
