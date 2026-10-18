import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { ArrowBigLeft, Bike, Car } from "lucide-react";

import { getPublicParkingById, type PublicParking } from "../../services/parkings";

const formatCop = (value: number | null) => {
  if (value == null) {
    return "No disponible";
  }

  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(value);
};

const ParkingDetail = () => {
  const { id } = useParams<{ id: string }>();

  const [parking, setParking] = useState<PublicParking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const loadParking = async () => {
      setLoading(true);
      setError("");
      setParking(null);

      try {
        if (!id) {
          return;
        }

        const data = await getPublicParkingById(id);

        if (!cancelled) {
          setParking(data);
        }
      } catch (err) {
        if (!cancelled) {
          console.error("Error al cargar el parqueadero:", err);
          setError("No fue posible cargar la información del parqueadero.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadParking();

    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
        <p className="text-sm font-medium text-slate-600">
          Cargando parqueadero...
        </p>
      </main>
    );
  }

  if (error || !parking) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
        <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
          <h1 className="text-xl font-bold text-slate-900">
            {error ? "Error al cargar" : "Parqueadero no encontrado"}
          </h1>

          <p className="mt-2 text-sm text-slate-600">
            {error ||
              "Este parqueadero no existe o no está disponible públicamente."}
          </p>

          <Link
            to="/"
            className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900"
          >
            <ArrowBigLeft size={16} />
            Volver al mapa
          </Link>
        </div>
      </main>
    );
  }

  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${parking.latitude},${parking.longitude}`;

  const hasCars = (parking.car_total_spaces ?? 0) > 0;
  const hasMotorcycles = (parking.motorcycle_total_spaces ?? 0) > 0;

  return (
    <main className="min-h-screen bg-slate-100">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center px-4 py-4">
          <Link
            to="/"
            className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900"
          >
            <ArrowBigLeft size={16} />
            Volver al mapa
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="rounded-2xl bg-white p-6 shadow-sm md:p-8">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-start">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">
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
            {hasCars && (
              <div className="rounded-xl bg-slate-50 p-5">
                <p className="flex items-center gap-2 text-sm text-slate-500">
                  <Car size={16} />
                  Automóviles
                </p>

                <p className="mt-2 text-2xl font-bold text-slate-900">
                  {parking.car_available_spaces}
                </p>

                <p className="text-sm text-slate-500">
                  espacios disponibles de {parking.car_total_spaces}
                </p>

                <p className="mt-3 text-sm text-slate-600">
                  Tarifa por hora:{" "}
                  <strong>{formatCop(parking.car_hourly_rate)}</strong>
                </p>
              </div>
            )}

            {hasMotorcycles && (
              <div className="rounded-xl bg-slate-50 p-5">
                <p className="flex items-center gap-2 text-sm text-slate-500">
                  <Bike size={16} />
                  Motocicletas
                </p>

                <p className="mt-2 text-2xl font-bold text-slate-900">
                  {parking.motorcycle_available_spaces}
                </p>

                <p className="text-sm text-slate-500">
                  espacios disponibles de {parking.motorcycle_total_spaces}
                </p>

                <p className="mt-3 text-sm text-slate-600">
                  Tarifa por hora:{" "}
                  <strong>{formatCop(parking.motorcycle_hourly_rate)}</strong>
                </p>
              </div>
            )}
          </div>

          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <section>
              <h2 className="text-lg font-bold text-slate-900">
                Información de contacto
              </h2>

              <p className="mt-3 text-sm text-slate-600">
                <strong>Teléfono:</strong> {parking.phone || "No disponible"}
              </p>

              {parking.contact_email && (
                <p className="mt-2 wrap-break-words text-sm text-slate-600">
                  <strong>Correo:</strong> {parking.contact_email}
                </p>
              )}
            </section>

            <section>
              <h2 className="text-lg font-bold text-slate-900">Horarios</h2>

              <p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-600">
                {parking.opening_hours || "Horario no disponible"}
              </p>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
};

export default ParkingDetail;
