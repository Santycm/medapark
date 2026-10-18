import type { PublicOffer, PublicParking } from '../domain/publicParking';

export const offer = (
  type: PublicOffer['vehicle_type'],
  o: { available?: number; total?: number; rate?: number } = {},
): PublicOffer => ({
  vehicle_type: type,
  hourly_rate: o.rate ?? (type === 'CAR' ? 5000 : 2000),
  total_spaces: o.total ?? 20,
  available_spaces: o.available ?? 12,
});

export const publicParking = (id: string, o: Partial<PublicParking> = {}): PublicParking => ({
  id,
  name: `Parqueadero ${id}`,
  address: `Calle ${id} # 45-10, Medellín`,
  latitude: 6.2518,
  longitude: -75.568,
  phone: '3001234567',
  contact_email: null,
  opening_hours: 'Lunes a Domingo, 6:00 a.m. - 10:00 p.m.',
  offers: [offer('CAR')],
  ...o,
});
