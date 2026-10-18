import { z } from 'zod';
import { MSG } from '../../lib/messages';
import { normalizeDecimal } from '../../lib/format';
import type { VehicleType } from '../parking';

const EMAIL_FORMAT = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const INTEGER = /^\d+$/;

export type ParkingFormValues = {
  name: string;
  address: string;
  latitude: string;
  longitude: string;
  phone: string;
  contactEmail: string;
  openingHours: string;
  servesCars: boolean;
  carRate: string;
  carSpaces: string;
  servesMotorcycles: boolean;
  motorcycleRate: string;
  motorcycleSpaces: string;
  status: 'activo' | 'inactivo';
};

type Options = {
  mode: 'registrar' | 'editar';
  /** En edición, los tipos ya guardados admiten capacidad 0. */
  savedTypes: VehicleType[];
};

const formShape = z.object({
  name: z.string(),
  address: z.string(),
  latitude: z.string(),
  longitude: z.string(),
  phone: z.string(),
  contactEmail: z.string(),
  openingHours: z.string(),
  servesCars: z.boolean(),
  carRate: z.string(),
  carSpaces: z.string(),
  servesMotorcycles: z.boolean(),
  motorcycleRate: z.string(),
  motorcycleSpaces: z.string(),
  status: z.enum(['activo', 'inactivo']),
});

/** Cuántos decimales trae un número escrito como texto. */
const decimals = (text: string) => (text.split('.')[1] ?? '').length;

export function makeParkingFormSchema({ mode, savedTypes }: Options) {
  return formShape.superRefine((v, ctx) => {
    const fail = (path: keyof ParkingFormValues, message: string) =>
      ctx.addIssue({ code: 'custom', path: [path], message });

    const text = (path: keyof ParkingFormValues, raw: string, min: number, max: number) => {
      const value = raw.trim();
      if (value === '') return fail(path, MSG.parqueadero.campoObligatorio);
      if (value.length < min || value.length > max) fail(path, MSG.parqueadero.longitud(min, max));
    };

    text('name', v.name, 3, 100);
    text('address', v.address, 5, 200);
    text('openingHours', v.openingHours, 3, 120);

    const coordinate = (
      path: 'latitude' | 'longitude',
      raw: string,
      limit: number,
      message: string,
    ) => {
      const value = normalizeDecimal(raw);
      if (value === '') return fail(path, MSG.parqueadero.campoObligatorio);
      const n = Number(value);
      if (!Number.isFinite(n) || Math.abs(n) > limit || decimals(value) > 6) fail(path, message);
    };
    coordinate('latitude', v.latitude, 90, MSG.parqueadero.latitudRango);
    coordinate('longitude', v.longitude, 180, MSG.parqueadero.longitudRango);

    const phone = v.phone.trim();
    if (phone === '') fail('phone', MSG.parqueadero.campoObligatorio);
    else if (!INTEGER.test(phone)) fail('phone', MSG.parqueadero.telefonoNumerico);
    else if (phone.length < 7 || phone.length > 10) fail('phone', MSG.parqueadero.telefonoLongitud);

    const email = v.contactEmail.trim();
    if (email !== '' && !EMAIL_FORMAT.test(email)) fail('contactEmail', MSG.parqueadero.correoFormato);

    if (!v.servesCars && !v.servesMotorcycles) {
      fail('servesCars', MSG.parqueadero.requeridos);
    }

    const type = (
      serves: boolean,
      vehicle: VehicleType,
      ratePath: 'carRate' | 'motorcycleRate',
      spacesPath: 'carSpaces' | 'motorcycleSpaces',
    ) => {
      if (!serves) return;

      const rate = v[ratePath].trim();
      if (rate === '') fail(ratePath, MSG.parqueadero.campoObligatorio);
      else if (!INTEGER.test(rate) || Number(rate) < 1 || Number(rate) > 999999) {
        fail(ratePath, MSG.parqueadero.tarifaRango);
      }

      const min = mode === 'editar' && savedTypes.includes(vehicle) ? 0 : 1;
      const spaces = v[spacesPath].trim();
      const rangeMessage = min === 0 ? MSG.celdas.enteroNoNegativo : MSG.parqueadero.capacidadNueva;
      if (spaces === '') fail(spacesPath, MSG.parqueadero.campoObligatorio);
      else if (!INTEGER.test(spaces) || Number(spaces) < min || Number(spaces) > 9999) {
        fail(spacesPath, rangeMessage);
      }
    };
    type(v.servesCars, 'CAR', 'carRate', 'carSpaces');
    type(v.servesMotorcycles, 'MOTORCYCLE', 'motorcycleRate', 'motorcycleSpaces');
  });
}

/** HU6: capacidades por configuración, enteros de 0 a 9999. */
export const spacesSchema = z.record(
  z.string(),
  z.string().regex(INTEGER, MSG.celdas.enteroNoNegativo).refine((s) => Number(s) <= 9999, MSG.celdas.enteroNoNegativo),
);
