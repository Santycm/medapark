import { useEffect, useState } from "react";
import { Link } from "react-router";

import ParkingMap from "../../components/map/ParkingMap";
import { getPublicParkings } from "../../services/parkings";

const Home = () => {
  const [parkings, setParkings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const loadParkings = async () => {
      setLoading(true);
      setError("");

      try {
        const data = await getPublicParkings();

        if (!cancelled) {
          setParkings(data);
        }
      } catch (err) {
        if (!cancelled) {
          console.error("Error al cargar los parqueaderos:", err);
          setError("No fue posible cargar los parqueaderos.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadParkings();

    return () => {
      cancelled = true;
    };
  }, [reload]);

  return (
    <main className="min-h-screen bg-slate-100">
      <header className="relative z-1000 border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900">MedaPark</h1>

            <p className="text-xs text-slate-500">Parqueaderos de Medellín</p>
          </div>

          <Link
            to="/login"
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Administración
          </Link>
        </div>
      </header>

      <section className="relative h-[calc(100vh-73px)]">
        {loading && (
          <div className="absolute inset-0 z-500 flex items-center justify-center bg-slate-100">
            <p className="text-sm font-medium text-slate-600">
              Cargando parqueaderos...
            </p>
          </div>
        )}

        {!loading && error && (
          <div className="absolute inset-0 z-500 flex items-center justify-center bg-slate-100 px-4">
            <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
              <p className="text-slate-700">{error}</p>

              <button
                type="button"
                onClick={() => setReload((value) => value + 1)}
                className="mt-4 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
              >
                Reintentar
              </button>
            </div>
          </div>
        )}

        {!loading && !error && parkings.length === 0 && (
          <div className="absolute inset-0 z-500 flex items-center justify-center bg-slate-100 px-4">
            <p className="rounded-xl bg-white p-6 text-center text-slate-600 shadow-sm">
              No hay parqueaderos disponibles actualmente.
            </p>
          </div>
        )}

        {!loading && !error && parkings.length > 0 && (
          <ParkingMap parkings={parkings} />
        )}
      </section>
    </main>
  );
};

export default Home;
