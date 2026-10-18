/** `5000` → `"$ 5.000"`, `1500000` → `"$ 1.500.000"` (pesos colombianos, sin decimales). */
export function formatCOP(value: number): string {
  const rounded = Math.round(value);
  const sign = rounded < 0 ? '-' : '';
  const digits = String(Math.abs(rounded)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${sign}$ ${digits}`;
}

/** Acepta la coma decimal: `"6,2442"` → `"6.2442"`. */
export function normalizeDecimal(value: string): string {
  return value.trim().replace(',', '.');
}

/** Coordenada con a lo sumo 6 decimales y sin ceros finales: `6.244200` → `"6.2442"`. */
export function formatCoord(value: number): string {
  return String(Number(value.toFixed(6)));
}
