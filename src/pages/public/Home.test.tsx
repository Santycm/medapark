import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../components/map/ParkingMap', () => ({
  default: ({ parkings, onSelect }: { parkings: { id: string; name: string }[]; onSelect: (id: string) => void }) => (
    <div data-testid="mapa">
      {parkings.map((p) => (
        <button key={p.id} type="button" onClick={() => onSelect(p.id)}>
          {`marcador ${p.name}`}
        </button>
      ))}
    </div>
  ),
}));
vi.mock('../../services/parkings', () => ({ listPublicParkings: vi.fn() }));

import { MSG } from '../../lib/messages';
import { listPublicParkings } from '../../services/parkings';
import { publicParking } from '../../test/publicFixtures';
import Home from './Home';

const mocked = vi.mocked(listPublicParkings);

const Where = () => {
  const { pathname, search } = useLocation();
  return <p data-testid="url">{pathname + search}</p>;
};

const show = (route = '/') =>
  render(
    <MemoryRouter initialEntries={[route]}>
      <Routes>
        <Route
          path="/"
          element={
            <>
              <Home />
              <Where />
            </>
          }
        />
      </Routes>
    </MemoryRouter>,
  );

beforeEach(() => {
  vi.resetAllMocks();
  mocked.mockResolvedValue({ ok: true, data: [publicParking('A'), publicParking('B')] });
});

describe('Home (mapa público)', () => {
  it('muestra el estado de carga y luego título, subtítulo, mapa y lista', async () => {
    show();
    expect(screen.getByText('Cargando parqueaderos...')).toBeInTheDocument();
    expect(await screen.findByRole('heading', { name: 'Parqueaderos activos (2)' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: MSG.publico.titulo })).toBeInTheDocument();
    expect(screen.getByText(MSG.publico.subtitulo)).toBeInTheDocument();
    expect(screen.getByTestId('mapa')).toBeInTheDocument();
  });

  it('no hay buscador ni filtros', async () => {
    show();
    await screen.findByTestId('mapa');
    expect(screen.queryByRole('searchbox')).not.toBeInTheDocument();
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
  });

  it('un error muestra el mensaje y "Reintentar" vuelve a cargar', async () => {
    const user = userEvent.setup();
    mocked.mockResolvedValueOnce({ ok: false, code: 'RED', message: MSG.publico.errorCarga });
    show();
    expect(await screen.findByText(MSG.publico.errorCarga)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: MSG.publico.reintentar }));
    expect(await screen.findByTestId('mapa')).toBeInTheDocument();
    expect(mocked).toHaveBeenCalledTimes(2);
  });

  it('lista vacía muestra el mensaje de vacío', async () => {
    mocked.mockResolvedValue({ ok: true, data: [] });
    show();
    expect(await screen.findByText(MSG.publico.vacio)).toBeInTheDocument();
  });
});

describe('selección por URL', () => {
  it('?parqueadero=<id> abre el detalle', async () => {
    show('/?parqueadero=B');
    expect(await screen.findByRole('dialog', { name: 'Parqueadero B' })).toBeInTheDocument();
  });

  it('un clic en la lista agrega el parámetro y abre el detalle', async () => {
    const user = userEvent.setup();
    show();
    await user.click(await screen.findByRole('button', { name: /^Parqueadero A/ }));
    expect(screen.getByTestId('url')).toHaveTextContent('/?parqueadero=A');
    expect(screen.getByRole('dialog', { name: 'Parqueadero A' })).toBeInTheDocument();
  });

  it('un clic en el marcador del mapa también selecciona', async () => {
    const user = userEvent.setup();
    show();
    await user.click(await screen.findByRole('button', { name: 'marcador Parqueadero B' }));
    expect(screen.getByTestId('url')).toHaveTextContent('/?parqueadero=B');
  });

  it('Esc y la "X" cierran el detalle', async () => {
    const user = userEvent.setup();
    show('/?parqueadero=A');
    await screen.findByRole('dialog');

    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(screen.getByTestId('url')).toHaveTextContent(/^\/$/);

    await user.click(screen.getByRole('button', { name: /^Parqueadero A/ }));
    await user.click(await screen.findByRole('button', { name: 'Cerrar detalle' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('un id inexistente avisa y limpia la URL', async () => {
    show('/?parqueadero=zzz');
    expect(await screen.findByText(MSG.publico.noDisponible)).toBeInTheDocument();
    expect(screen.getByTestId('url')).toHaveTextContent(/^\/$/);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
