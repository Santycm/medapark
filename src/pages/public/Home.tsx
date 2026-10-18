import { useCallback, useEffect, useState } from 'react';
import { useLocation, useSearchParams } from 'react-router';
import Alert from '../../components/common/Alert';
import Button from '../../components/common/Button';
import ParkingMap from '../../components/map/ParkingMap';
import ParkingDetailPanel from '../../components/public/ParkingDetailPanel';
import ParkingList from '../../components/public/ParkingList';
import type { PublicParking } from '../../domain/publicParking';
import { MSG } from '../../lib/messages';
import { listPublicParkings } from '../../services/parkings';

type LoadState = 'cargando' | 'error' | 'listo';

/** HU9–HU11: mapa público con lista, detalle y "Cómo llegar". La selección vive en `?parqueadero=`. */
const Home = () => {
  const [params, setParams] = useSearchParams();
  const [state, setState] = useState<LoadState>('cargando');
  const [parkings, setParkings] = useState<PublicParking[]>([]);
  const [reload, setReload] = useState(0);
  const notice = (useLocation().state as { notice?: string } | null)?.notice ?? '';

  const selectedId = params.get('parqueadero');
  const selected = parkings.find((p) => p.id === selectedId) ?? null;

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const result = await listPublicParkings();
      if (cancelled) return;
      if (result.ok) {
        setParkings(result.data);
        setState('listo');
      } else {
        setState('error');
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [reload]);

  // Un id que ya no existe (o no está publicado) se avisa y se limpia de la URL.
  useEffect(() => {
    if (state === 'listo' && selectedId && !selected) {
      setParams({}, { replace: true, state: { notice: MSG.publico.noDisponible } });
    }
  }, [state, selectedId, selected, setParams]);

  const retry = () => {
    setState('cargando');
    setReload((value) => value + 1);
  };

  const select = useCallback(
    (id: string) => setParams({ parqueadero: id }),
    [setParams],
  );
  const close = useCallback(() => setParams({}), [setParams]);

  useEffect(() => {
    if (!selected) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [selected, close]);

  return (
    <main className="mx-auto max-w-[1600px] space-y-4 px-4 py-5 sm:px-7">
      <div>
        <h1 className="text-3xl font-bold text-navy-900">{MSG.publico.titulo}</h1>
        <p className="text-base text-ink-500">{MSG.publico.subtitulo}</p>
      </div>

      {notice && <Alert kind="warning">{notice}</Alert>}

      {state === 'cargando' && (
        <p role="status" className="py-16 text-center font-medium text-ink-500">
          Cargando parqueaderos...
        </p>
      )}

      {state === 'error' && (
        <div className="mx-auto max-w-md space-y-4 rounded-2xl border border-line bg-white p-8 text-center">
          <p className="text-navy-900">{MSG.publico.errorCarga}</p>
          <Button onClick={retry}>{MSG.publico.reintentar}</Button>
        </div>
      )}

      {state === 'listo' && (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_440px]">
          <div className="h-[55dvh] min-h-[320px] lg:h-[calc(100dvh-190px)] lg:min-h-[520px]">
            <ParkingMap parkings={parkings} selectedId={selectedId} onSelect={select} />
          </div>

          <div className="lg:h-[calc(100dvh-190px)] lg:min-h-[520px]">
            {selected ? (
              <ParkingDetailPanel key={selected.id} parking={selected} onClose={close} />
            ) : (
              <div className="rounded-[14px] border border-line bg-white lg:h-full">
                <ParkingList parkings={parkings} selectedId={selectedId} onSelect={select} />
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
};

export default Home;
