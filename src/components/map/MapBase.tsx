import type { ReactNode } from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import { MEDELLIN_CENTER } from '../../domain/parking';

type Props = {
  children?: ReactNode;
  className?: string;
  scrollWheelZoom?: boolean;
  'aria-label'?: string;
};

/** Mapa base de MedaPark (mosaicos de OpenStreetMap, sin API key, centrado en Medellín). */
const MapBase = ({ children, className = 'h-full w-full', scrollWheelZoom = true, ...rest }: Props) => (
  <MapContainer
    center={MEDELLIN_CENTER}
    zoom={13}
    scrollWheelZoom={scrollWheelZoom}
    className={className}
    aria-label={rest['aria-label']}
  >
    <TileLayer
      attribution="&copy; OpenStreetMap contributors"
      url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
    />
    {children}
  </MapContainer>
);

export default MapBase;
