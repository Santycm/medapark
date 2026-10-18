import L from 'leaflet';

export type MarkerState = 'disponible' | 'lleno' | 'seleccionado';

const COLORS: Record<MarkerState, string> = {
  disponible: '#0e7c47',
  lleno: '#7b8798',
  seleccionado: '#1d5fd1',
};

/** Pin con un carro en SVG inline (evita los PNG por defecto de Leaflet). */
export function markerIcon(state: MarkerState = 'disponible'): L.DivIcon {
  const size = state === 'seleccionado' ? 46 : 38;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${Math.round(size * 1.2)}" viewBox="0 0 24 29" aria-hidden="true"><path d="M12 1C6.5 1 2 5.4 2 10.9c0 7.3 10 16.1 10 16.1s10-8.8 10-16.1C22 5.4 17.5 1 12 1z" fill="${COLORS[state]}" stroke="#fff" stroke-width="1.5"/><g transform="translate(6.2 5.2) scale(0.5)" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/></g></svg>`;

  return L.divIcon({
    html: svg,
    className: 'medapark-marker',
    iconSize: [size, Math.round(size * 1.2)],
    iconAnchor: [size / 2, Math.round(size * 1.2)],
    popupAnchor: [0, -Math.round(size * 1.2)],
  });
}
