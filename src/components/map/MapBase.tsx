import type { ReactNode } from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import { MEDELLIN_CENTER } from '../../domain/parking';

type Props = {
  children?: ReactNode;
  className?: string;
  scrollWheelZoom?: boolean;
  'aria-label'?: string;
};

/** Mapa base de MedaPark (CARTO Voyager, centrado en Medellín). */
const MapBase = ({ children, className = 'h-full w-full', scrollWheelZoom = true, ...rest }: Props) => (
  <MapContainer
    center={MEDELLIN_CENTER}
    zoom={13}
    scrollWheelZoom={scrollWheelZoom}
    className={className}
    aria-label={rest['aria-label']}
  >
    <TileLayer
      attribution="&copy; OpenStreetMap contributors &copy; CARTO"
      url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
    />
    {children}
  </MapContainer>
);

export default MapBase;
