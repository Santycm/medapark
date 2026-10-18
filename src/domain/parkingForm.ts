import { normalizeDecimal } from '../lib/format';
import { configOf, type ConfigInput, type ParkingInput, type ParkingLot } from './parking';
import type { ParkingFormValues } from './schemas/parking';

export type { ParkingFormValues } from './schemas/parking';

export const emptyParkingForm: ParkingFormValues = {
  name: '',
  address: '',
  latitude: '',
  longitude: '',
  phone: '',
  contactEmail: '',
  openingHours: '',
  servesCars: false,
  carRate: '',
  carSpaces: '',
  servesMotorcycles: false,
  motorcycleRate: '',
  motorcycleSpaces: '',
  status: 'activo',
};

/** Parqueadero guardado → valores del formulario (inversa de `toParkingInput`). */
export function toFormValues(p: ParkingLot): ParkingFormValues {
  const car = configOf(p, 'CAR');
  const moto = configOf(p, 'MOTORCYCLE');

  return {
    name: p.name,
    address: p.address,
    latitude: String(p.latitude),
    longitude: String(p.longitude),
    phone: p.phone,
    contactEmail: p.contact_email ?? '',
    openingHours: p.opening_hours,
    servesCars: Boolean(car),
    carRate: car ? String(car.hourly_rate) : '',
    carSpaces: car ? String(car.total_spaces) : '',
    servesMotorcycles: Boolean(moto),
    motorcycleRate: moto ? String(moto.hourly_rate) : '',
    motorcycleSpaces: moto ? String(moto.total_spaces) : '',
    status: p.status ? 'activo' : 'inactivo',
  };
}

/** Formulario ya validado → payload del servicio. */
export function toParkingInput(v: ParkingFormValues): ParkingInput {
  const configs: ConfigInput[] = [];
  if (v.servesCars) {
    configs.push({ vehicle_type: 'CAR', hourly_rate: Number(v.carRate), total_spaces: Number(v.carSpaces) });
  }
  if (v.servesMotorcycles) {
    configs.push({
      vehicle_type: 'MOTORCYCLE',
      hourly_rate: Number(v.motorcycleRate),
      total_spaces: Number(v.motorcycleSpaces),
    });
  }

  const email = v.contactEmail.trim();
  return {
    name: v.name.trim(),
    address: v.address.trim(),
    latitude: Number(normalizeDecimal(v.latitude)),
    longitude: Number(normalizeDecimal(v.longitude)),
    phone: v.phone.trim(),
    contact_email: email === '' ? null : email,
    opening_hours: v.openingHours.trim(),
    configs,
  };
}
