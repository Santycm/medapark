import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../components/map/LocationPicker', () => ({
  default: ({ onChange }: { onChange: (lat: number, lng: number) => void }) => (
    <button type="button" onClick={() => onChange(6.2518, -75.568)}>
      mapa simulado
    </button>
  ),
}));
vi.mock('../../services/adminParking', () => ({ registerParkingLot: vi.fn() }));

import { MSG } from '../../lib/messages';
import { registerParkingLot } from '../../services/adminParking';
import { renderWithParking } from '../../test/fixtures';
import RegisterParking from './RegisterParking';

const mocked = vi.mocked(registerParkingLot);

const setup = () =>
  renderWithParking(<RegisterParking />, {
    my: { state: 'sin_parqueadero' },
    path: '/admin/parqueadero/registrar',
  });

const fillAndSubmit = async () => {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText(/Nombre del parqueadero/), 'Parqueadero Centro');
  await user.type(screen.getByLabelText(/Dirección/), 'Calle 50 # 45-10');
  await user.click(screen.getByRole('button', { name: 'mapa simulado' }));
  await user.type(screen.getByLabelText(/Teléfono de contacto/), '3001234567');
  await user.type(screen.getByLabelText(/Horario de atención/), '24 horas');
  await user.click(screen.getByRole('checkbox', { name: 'Automóviles' }));
  await user.type(screen.getByLabelText(/Tarifa por hora \(Automóviles\)/), '5000');
  await user.type(screen.getByLabelText(/Capacidad de celdas \(Automóviles\)/), '20');
  await user.click(screen.getByRole('button', { name: 'Guardar' }));
  return user;
};

beforeEach(() => {
  vi.resetAllMocks();
});

describe('RegisterParking', () => {
  it('éxito → recarga y navega al panel con el mensaje de registro', async () => {
    mocked.mockResolvedValue({ ok: true, data: { id: 'lot1' } });
    const { my } = setup();
    await fillAndSubmit();

    await waitFor(() => expect(screen.getByTestId('where')).toHaveTextContent('/admin'));
    expect(mocked).toHaveBeenCalledWith(
      'u1',
      expect.objectContaining({
        name: 'Parqueadero Centro',
        contact_email: null,
        configs: [{ vehicle_type: 'CAR', hourly_rate: 5000, total_spaces: 20 }],
      }),
    );
    expect(my.reload).toHaveBeenCalled();
  });

  it('registro incompleto → recarga y va al panel', async () => {
    mocked.mockResolvedValue({ ok: false, code: 'REGISTRO_INCOMPLETO', message: MSG.parqueadero.registroIncompleto });
    const { my } = setup();
    await fillAndSubmit();
    await waitFor(() => expect(screen.getByTestId('where')).toHaveTextContent('/admin'));
    expect(my.reload).toHaveBeenCalled();
  });

  it('un error de permisos se muestra en el formulario y no navega', async () => {
    mocked.mockResolvedValue({ ok: false, code: 'PERMISO_DENEGADO', message: MSG.general.permisoDenegado });
    setup();
    await fillAndSubmit();
    expect(await screen.findByText(MSG.general.permisoDenegado)).toBeInTheDocument();
    expect(screen.queryByTestId('where')).not.toBeInTheDocument();
  });

  it('"Cancelar" vuelve al panel sin guardar', async () => {
    const user = userEvent.setup();
    setup();
    await user.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(screen.getByTestId('where')).toHaveTextContent('/admin');
    expect(mocked).not.toHaveBeenCalled();
  });
});
