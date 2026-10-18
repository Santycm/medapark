import { Marker, Popup } from "react-leaflet";
import { Link } from "react-router";
import L from "leaflet";

import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

import { Car, Bike } from "lucide-react";

import type { PublicParking } from "../../services/parkings";

const defaultIcon = L.icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const ParkingMarker = ({ parking }: { parking: PublicParking }) => {
  const hasCars = (parking.car_total_spaces ?? 0) > 0;
  const hasMotorcycles = (parking.motorcycle_total_spaces ?? 0) > 0;

  return (
    <Marker position={[parking.latitude, parking.longitude]} icon={defaultIcon}>
      <Popup>
        <div className="min-w-52">
          <h3 className="text-base font-bold text-slate-900">{parking.name}</h3>

          <p className="mt-1 text-sm text-slate-500">{parking.address}</p>

          <div className="mt-3 space-y-2 text-sm text-slate-700">
            {hasCars && (
              <div className="flex items-center gap-2">
                <Car size={16} strokeWidth={2} />

                <span>
                  <strong>{parking.car_available_spaces}</strong> carros
                  disponibles
                </span>
              </div>
            )}

            {hasMotorcycles && (
              <div className="flex items-center gap-2">
                <Bike size={16} strokeWidth={2} />

                <span>
                  <strong>{parking.motorcycle_available_spaces}</strong> motos
                  disponibles
                </span>
              </div>
            )}
          </div>

          <Link
            to={`/parking/${parking.id}`}
            className="mt-4 block rounded-lg bg-slate-900 px-3 py-2 text-center text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Ver parqueadero
          </Link>
        </div>
      </Popup>
    </Marker>
  );
};

export default ParkingMarker;
