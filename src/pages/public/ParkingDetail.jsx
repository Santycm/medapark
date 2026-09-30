import { Link, useParams } from "react-router";
import {Car, Bike, ArrowBigLeft} from 'lucide-react'
import { parkings } from "../../data/parkings";

const ParkingDetail = () => {
  const { id } = useParams();

  const parking = parkings.find((item) => item.id === id);

  if (!parking) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
        <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
          <h1 className="text-xl font-bold text-slate-900">
            Parqueadero no encontrado
          </h1>

          <Link
            to="/"
            className="mt-5 flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900"
          >
            <ArrowBigLeft size={16} />
            Volver al mapa
          </Link>
        </div>
      </main>
    );
  }

  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${parking.latitude},${parking.longitude}`;

  return (
    <main className="min-h-screen bg-slate-100">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center px-4 py-4">
          <Link
            to="/"
            className="text-sm font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-2"
          >
            <ArrowBigLeft size={16} /> Volver al mapa
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="rounded-2xl bg-white p-6 shadow-sm md:p-8">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-start">
            <div>
              <p className="text-sm font-semibold text-slate-400">
                {parking.neighborhood}
              </p>

              <h1 className="mt-1 text-3xl font-bold text-slate-900">
                {parking.name}
              </h1>

              <p className="mt-2 text-sm text-slate-500">{parking.address}</p>
            </div>

            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl bg-slate-900 px-5 py-3 text-center text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Cómo llegar
            </a>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl bg-slate-50 p-5">
              <p className="text-sm text-slate-500 flex items-center gap-2"><Car size={16} /> Carros</p>

              <p className="mt-2 text-2xl font-bold text-slate-900">
                {parking.availability.cars.available}
              </p>

              <p className="text-sm text-slate-500">
                espacios disponibles de {parking.availability.cars.total}
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 p-5">
              <p className="text-sm text-slate-500 flex items-center gap-2"><Bike size={16} /> Motocicletas</p>

              <p className="mt-2 text-2xl font-bold text-slate-900">
                {parking.availability.motorcycles.available}
              </p>

              <p className="text-sm text-slate-500">
                espacios disponibles de {parking.availability.motorcycles.total}
              </p>
            </div>
          </div>

          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <section>
              <h2 className="text-lg font-bold text-slate-900">Información</h2>

              <p className="mt-3 text-sm leading-6 text-slate-600">
                {parking.description}
              </p>

              <p className="mt-4 text-sm text-slate-600">
                <strong>Teléfono:</strong> {parking.phone}
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-slate-900">Tarifas</h2>

              <div className="mt-3 space-y-2 text-sm text-slate-600">
                <p className="flex items-center gap-2">
                  <Car size={16} /> Carro: <strong>{parking.rates.car}</strong>
                </p>

                <p className="flex items-center gap-2">
                  <Bike size={16} /> Moto: <strong>{parking.rates.motorcycle}</strong>
                </p>
              </div>

              <h2 className="mt-6 text-lg font-bold text-slate-900">
                Horarios
              </h2>

              <div className="mt-3 space-y-2 text-sm text-slate-600">
                <p>Lunes a viernes: {parking.schedule.mondayToFriday}</p>

                <p>Sábado: {parking.schedule.saturday}</p>

                <p>Domingo: {parking.schedule.sunday}</p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
};

export default ParkingDetail;
