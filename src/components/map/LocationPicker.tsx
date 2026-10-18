import { useEffect, useMemo, useRef } from 'react';
import type { Marker as LeafletMarker } from 'leaflet';
import { Marker, useMap, useMapEvents } from 'react-leaflet';
import { formatCoord } from '../../lib/format';
import { markerIcon } from './markerIcons';
import MapBase from './MapBase';

type Props = {
  latitude: number | null;
  longitude: number | null;
  onChange: (latitude: number, longitude: number) => void;
};

const round6 = (n: number) => Number(formatCoord(n));

function Recenter({ latitude, longitude }: { latitude: number; longitude: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([latitude, longitude], Math.max(map.getZoom(), 14));
  }, [map, latitude, longitude]);
  return null;
}

function ClickHandler({ onChange }: { onChange: Props['onChange'] }) {
  useMapEvents({
    click: (event) => onChange(round6(event.latlng.lat), round6(event.latlng.lng)),
  });
  return null;
}

/** Selector de ubicación: clic en el mapa o arrastre del marcador. */
const LocationPicker = ({ latitude, longitude, onChange }: Props) => {
  const markerRef = useRef<LeafletMarker>(null);
  const icon = useMemo(() => markerIcon('disponible'), []);
  const hasPosition = latitude !== null && longitude !== null;

  const handlers = useMemo(
    () => ({
      dragend: () => {
        const position = markerRef.current?.getLatLng();
        if (position) onChange(round6(position.lat), round6(position.lng));
      },
    }),
    [onChange],
  );

  return (
    <MapBase aria-label="Mapa para seleccionar la ubicación del parqueadero" className="h-[280px] w-full rounded-xl">
      <ClickHandler onChange={onChange} />
      {hasPosition && (
        <>
          <Marker
            ref={markerRef}
            position={[latitude, longitude]}
            icon={icon}
            draggable
            eventHandlers={handlers}
          />
          <Recenter latitude={latitude} longitude={longitude} />
        </>
      )}
    </MapBase>
  );
};

export default LocationPicker;
