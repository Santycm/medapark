import { describe, expect, it } from 'vitest';
import { formatCOP, formatCoord, normalizeDecimal } from './format';

describe('formatCOP', () => {
  it.each([
    [0, '$ 0'],
    [999, '$ 999'],
    [5000, '$ 5.000'],
    [1500000, '$ 1.500.000'],
    [2000.4, '$ 2.000'],
    [-1500, '-$ 1.500'],
  ])('%s → %s', (value, expected) => {
    expect(formatCOP(value)).toBe(expected);
  });
});

describe('normalizeDecimal', () => {
  it('cambia la coma por punto y recorta', () => {
    expect(normalizeDecimal('6,2442')).toBe('6.2442');
    expect(normalizeDecimal('  -75.5812 ')).toBe('-75.5812');
  });
});

describe('formatCoord', () => {
  it('limita a 6 decimales y quita los ceros finales', () => {
    expect(formatCoord(6.2442)).toBe('6.2442');
    expect(formatCoord(6.2442001234)).toBe('6.2442');
    expect(formatCoord(-75.581234567)).toBe('-75.581235');
  });
});
