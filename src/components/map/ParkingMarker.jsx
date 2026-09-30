import { Marker, Popup } from "react-leaflet";
import {
    Car,
    Bike,
} from 'lucide-react'

import { Link } from "react-router";

const ParkingMarker = ({ parking }) => {
  return (
    <Marker position={[parking.latitude, parking.longitude]}>
      <Popup>
        <div className="min-w-52">
          <h3 className="text-base font-bold text-slate-900">{parking.name}</h3>

          <p className="mt-1 text-sm text-slate-500">{parking.address}</p>

          <div className="mt-3 space-y-1 text-sm">
            <p className="flex items-center gap-2">
               <Car size={16} /> <strong>{parking.availability.cars.available}</strong>{" "}
              disponibles
            </p>

            <p className="flex items-center gap-2">
              <Bike size={16} /> <strong>{parking.availability.motorcycles.available}</strong>{" "}
              disponibles
            </p>
          </div>

          <Link
            to={`/parking/${parking.id}`}
            className="mt-3 block rounded-lg bg-slate-900 px-3 py-2 text-center text-sm font-semibold text-white"
          >
            Ver parqueadero
          </Link>
        </div>
      </Popup>
    </Marker>
  );
};

export default ParkingMarker;
