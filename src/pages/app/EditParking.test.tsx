import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../components/map/LocationPicker', () => ({ default: () => <div>mapa simulado</div> }));
vi.mock('../../services/adminParking', () => ({ updateParkingLot: vi.fn() }));

import { MSG } from '../../lib/messages';
import { updateParkingLot } from '../../services/adminParking';
import { makeLot, renderWithParking } from '../../test/fixtures';
import EditParking from './EditParking';

const mocked = vi.mocked(updateParkingLot);

const setup = () =>
  renderWithParking(<EditParking />, {
    my: { state: 'con_parqueadero', parking: makeLot() },
    path: '/admin/parqueadero/editar',
  });

beforeEach(() => {
  vi.resetAllMocks();
});

describe('EditParking', () => {
  it('muestra los datos actuales con el badge de estado', () => {
    setup();
    expect(screen.getByRole('heading', { name: 'Editar mi parqueadero' })).toBeInTheDocument();
    expect(screen.getByLabelText(/Nombre del parqueadero/)).toHaveValue('Parqueadero Centro');
    expect(screen.getByText('Activo', { selector: 'span.inline-flex' })).toBeInTheDocument();
  });

  it('éxito → recarga y va al panel con el mensaje de actualización', async () => {
    mocked.mockResolvedValue({ ok: true, data: undefined });
    const user = userEvent.setup();
    const { my } = setup();

    const name = screen.getByLabelText(/Nombre del parqueadero/);
    await user.clear(name);
    await user.type(name, 'Parqueadero Norte');
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    await waitFor(() => expect(screen.getByTestId('where')).toHaveTextContent('/admin'));
    expect(mocked).toHaveBeenCalledWith(expect.objectContaining({ name: 'Parqueadero Norte', status: true }));
    expect(my.reload).toHaveBeenCalled();
  });

  it('un error de validación previa muestra el mensaje sin navegar', async () => {
    mocked.mockResolvedValue({
      ok: false,
      code: 'CAPACIDAD_MENOR_A_OCUPADAS',
      message: MSG.celdas.reducir,
      vehicleType: 'CAR',
    });
    const user = userEvent.setup();
    setup();
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));
    expect((await screen.findAllByText(MSG.celdas.reducir)).length).toBeGreaterThan(0);
    expect(screen.queryByTestId('where')).not.toBeInTheDocument();
  });

  it('un guardado parcial recarga los datos y muestra el aviso', async () => {
    mocked.mockResolvedValue({ ok: false, code: 'GUARDADO_PARCIAL', message: MSG.parqueadero.guardadoParcial });
    const user = userEvent.setup();
    const { my } = setup();
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));
    expect(await screen.findByText(MSG.parqueadero.guardadoParcial)).toBeInTheDocument();
    expect(my.reload).toHaveBeenCalled();
  });

  it('"Cancelar" no llama al servicio', async () => {
    const user = userEvent.setup();
    setup();
    await user.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(mocked).not.toHaveBeenCalled();
    expect(screen.getByTestId('where')).toHaveTextContent('/admin');
  });
});
