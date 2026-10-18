import { describe, expect, it } from 'vitest';
import { MSG } from '../../lib/messages';
import { emptyParkingForm } from '../parkingForm';
import { makeParkingFormSchema, spacesSchema, type ParkingFormValues } from './parking';

const valid: ParkingFormValues = {
  ...emptyParkingForm,
  name: 'Parqueadero Centro',
  address: 'Calle 50 # 45-10, Medellín',
  latitude: '6.2442',
  longitude: '-75.5812',
  phone: '3001234567',
  openingHours: '24 horas',
  servesCars: true,
  carRate: '5000',
  carSpaces: '20',
};

const registrar = makeParkingFormSchema({ mode: 'registrar', savedTypes: [] });
const editar = (savedTypes: ('CAR' | 'MOTORCYCLE')[]) => makeParkingFormSchema({ mode: 'editar', savedTypes });

const errors = (schema: ReturnType<typeof makeParkingFormSchema>, values: ParkingFormValues) => {
  const result = schema.safeParse(values);
  if (result.success) return {} as Record<string, string>;
  return Object.fromEntries(result.error.issues.map((i) => [String(i.path[0]), i.message]));
};

describe('esquema de registro', () => {
  it('acepta un formulario válido', () => {
    expect(registrar.safeParse(valid).success).toBe(true);
  });

  it('vacío → errores en los campos requeridos y en el grupo de tipos', () => {
    const e = errors(registrar, emptyParkingForm);
    expect(e.name).toBe(MSG.parqueadero.campoObligatorio);
    expect(e.address).toBe(MSG.parqueadero.campoObligatorio);
    expect(e.latitude).toBe(MSG.parqueadero.campoObligatorio);
    expect(e.longitude).toBe(MSG.parqueadero.campoObligatorio);
    expect(e.phone).toBe(MSG.parqueadero.campoObligatorio);
    expect(e.openingHours).toBe(MSG.parqueadero.campoObligatorio);
    expect(e.servesCars).toBe(MSG.parqueadero.requeridos);
  });

  it('un tipo marcado sin tarifa ni capacidad → errores; desmarcado con campos vacíos es válido', () => {
    const e = errors(registrar, { ...valid, servesMotorcycles: true });
    expect(e.motorcycleRate).toBe(MSG.parqueadero.campoObligatorio);
    expect(e.motorcycleSpaces).toBe(MSG.parqueadero.campoObligatorio);
    expect(errors(registrar, valid)).toEqual({});
  });

  it('teléfono: no numérico y longitud', () => {
    expect(errors(registrar, { ...valid, phone: '300-123' }).phone).toBe(MSG.parqueadero.telefonoNumerico);
    expect(errors(registrar, { ...valid, phone: '123456' }).phone).toBe(MSG.parqueadero.telefonoLongitud);
    expect(errors(registrar, { ...valid, phone: '12345678901' }).phone).toBe(MSG.parqueadero.telefonoLongitud);
  });

  it('correo: vacío es válido, sin dominio es inválido', () => {
    expect(errors(registrar, { ...valid, contactEmail: '' }).contactEmail).toBeUndefined();
    expect(errors(registrar, { ...valid, contactEmail: 'contacto@dominio' }).contactEmail).toBe(MSG.parqueadero.correoFormato);
    expect(errors(registrar, { ...valid, contactEmail: 'contacto@dominio.com' }).contactEmail).toBeUndefined();
  });

  it('coordenadas: coma decimal válida, fuera de rango y demasiados decimales', () => {
    expect(errors(registrar, { ...valid, latitude: '6,2442' }).latitude).toBeUndefined();
    expect(errors(registrar, { ...valid, latitude: '95' }).latitude).toBe(MSG.parqueadero.latitudRango);
    expect(errors(registrar, { ...valid, longitude: '-181' }).longitude).toBe(MSG.parqueadero.longitudRango);
    expect(errors(registrar, { ...valid, latitude: '6.1234567' }).latitude).toBe(MSG.parqueadero.latitudRango);
    expect(errors(registrar, { ...valid, latitude: 'abc' }).latitude).toBe(MSG.parqueadero.latitudRango);
  });

  it('tarifa: rango 1–999.999 y solo enteros', () => {
    expect(errors(registrar, { ...valid, carRate: '0' }).carRate).toBe(MSG.parqueadero.tarifaRango);
    expect(errors(registrar, { ...valid, carRate: '1000000' }).carRate).toBe(MSG.parqueadero.tarifaRango);
    expect(errors(registrar, { ...valid, carRate: '5000.5' }).carRate).toBe(MSG.parqueadero.tarifaRango);
    expect(errors(registrar, { ...valid, carRate: '999999' }).carRate).toBeUndefined();
  });

  it('capacidad en registro: mínimo 1, máximo 9999 y solo enteros', () => {
    expect(errors(registrar, { ...valid, carSpaces: '0' }).carSpaces).toBe(MSG.parqueadero.capacidadNueva);
    expect(errors(registrar, { ...valid, carSpaces: '2.5' }).carSpaces).toBe(MSG.parqueadero.capacidadNueva);
    expect(errors(registrar, { ...valid, carSpaces: '10000' }).carSpaces).toBe(MSG.parqueadero.capacidadNueva);
  });

  it('un nombre de solo espacios cuenta como vacío', () => {
    expect(errors(registrar, { ...valid, name: '    ' }).name).toBe(MSG.parqueadero.campoObligatorio);
  });

  it('longitudes mínimas y máximas de texto', () => {
    expect(errors(registrar, { ...valid, name: 'ab' }).name).toBe(MSG.parqueadero.longitud(3, 100));
    expect(errors(registrar, { ...valid, address: 'x'.repeat(201) }).address).toBe(MSG.parqueadero.longitud(5, 200));
  });
});

describe('esquema de edición', () => {
  it('un tipo guardado admite capacidad 0, uno nuevo no', () => {
    expect(errors(editar(['CAR']), { ...valid, carSpaces: '0' }).carSpaces).toBeUndefined();
    expect(errors(editar([]), { ...valid, carSpaces: '0' }).carSpaces).toBe(MSG.parqueadero.capacidadNueva);
    expect(errors(editar(['CAR']), { ...valid, carSpaces: '-1' }).carSpaces).toBe(MSG.celdas.enteroNoNegativo);
  });
});

describe('spacesSchema', () => {
  it('acepta enteros de 0 a 9999', () => {
    expect(spacesSchema.safeParse({ a: '0', b: '9999' }).success).toBe(true);
    expect(spacesSchema.safeParse({ a: '-1' }).success).toBe(false);
    expect(spacesSchema.safeParse({ a: '10000' }).success).toBe(false);
    expect(spacesSchema.safeParse({ a: '1.5' }).success).toBe(false);
  });
});
