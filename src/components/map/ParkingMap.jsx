import {
    MapContainer,
    TileLayer,
} from 'react-leaflet'

import ParkingMarker from './ParkingMarker'

const MEDELLIN_CENTER = [
    6.2442,
    -75.5812,
]

const ParkingMap = ({ parkings }) => {
    return (
        <MapContainer
            center={MEDELLIN_CENTER}
            zoom={13}
            scrollWheelZoom={true}
            className="h-full w-full"
        >
            <TileLayer
                attribution="&copy; OpenStreetMap contributors"
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {parkings.map((parking) => (
                <ParkingMarker
                    key={parking.id}
                    parking={parking}
                />
            ))}
        </MapContainer>
    )
}

export default ParkingMap