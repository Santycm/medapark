import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import type { PublicParking } from '../../domain/publicParking';
import MapLegend from '../public/MapLegend';
import MapBase from './MapBase';
import ParkingMarker from './ParkingMarker';

type Props = {
  parkings: PublicParking[];
  selectedId: string | null;
  onSelect: (id: string) => void;
};

/** Ajusta la vista a todos los parqueaderos (una vez), vuela a la selección y recalcula el tamaño. */
function ViewController({ parkings, selectedId }: Omit<Props, 'onSelect'>) {
  const map = useMap();
  const fitted = useRef(false);

  useEffect(() => {
    if (fitted.current || parkings.length === 0) return;
    fitted.current = true;
    map.fitBounds(
      parkings.map((p) => [p.latitude, p.longitude] as [number, number]),
      { padding: [40, 40], maxZoom: 15 },
    );
  }, [map, parkings]);

  useEffect(() => {
    const selected = parkings.find((p) => p.id === selectedId);
    if (selected) map.flyTo([selected.latitude, selected.longitude], Math.max(map.getZoom(), 15));
  }, [map, parkings, selectedId]);

  useEffect(() => {
    const container = map.getContainer();
    const observer = new ResizeObserver(() => map.invalidateSize());
    observer.observe(container);
    return () => observer.disconnect();
  }, [map]);

  return null;
}

const ParkingMap = ({ parkings, selectedId, onSelect }: Props) => (
  <div className="relative h-full w-full">
    <MapBase aria-label="Mapa de parqueaderos de Medellín" className="h-full w-full rounded-[14px]">
      <ViewController parkings={parkings} selectedId={selectedId} />
      {parkings.map((parking) => (
        <ParkingMarker
          key={parking.id}
          parking={parking}
          selected={parking.id === selectedId}
          onSelect={onSelect}
        />
      ))}
    </MapBase>
    <MapLegend />
  </div>
);

export default ParkingMap;
