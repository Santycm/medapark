import { useMemo } from 'react';
import { Marker, Tooltip } from 'react-leaflet';
import { isFull, type PublicParking } from '../../domain/publicParking';
import { iconFor, type MarkerState } from './markerIcons';

type Props = {
  parking: PublicParking;
  selected: boolean;
  onSelect: (id: string) => void;
};

function markerStateOf(parking: PublicParking, selected: boolean): MarkerState {
  if (selected) return 'seleccionado';
  return isFull(parking) ? 'lleno' : 'disponible';
}

/** Marcador del mapa público: el clic selecciona (abre el detalle), sin popup. */
const ParkingMarker = ({ parking, selected, onSelect }: Props) => {
  const icon = useMemo(() => iconFor(markerStateOf(parking, selected)), [parking, selected]);

  return (
    <Marker
      position={[parking.latitude, parking.longitude]}
      icon={icon}
      title={parking.name}
      keyboard
      zIndexOffset={selected ? 1000 : 0}
      eventHandlers={{ click: () => onSelect(parking.id) }}
    >
      {selected && (
        <Tooltip permanent direction="top" offset={[0, -46]} opacity={1}>
          <strong className="block text-sm text-navy-900">{parking.name}</strong>
          <span className="block text-xs text-ink-500">{parking.address}</span>
        </Tooltip>
      )}
    </Marker>
  );
};

export default ParkingMarker;
