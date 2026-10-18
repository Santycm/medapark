import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../services/adminParking', () => ({ registerEntry: vi.fn(), registerExit: vi.fn() }));

import { MSG } from '../../lib/messages';
import { registerEntry, registerExit } from '../../services/adminParking';
import { makeConfig, makeLot, renderWithParking } from '../../test/fixtures';
import ManageOccupancy from './ManageOccupancy';

const entry = vi.mocked(registerEntry);
const exit = vi.mocked(registerExit);

const setup = (parking = makeLot()) =>
  renderWithParking(<ManageOccupancy />, {
    my: { state: 'con_parqueadero', parking },
    path: '/admin/ocupacion',
  });

const card = (name: string) => within(screen.getByRole('region', { name }));

beforeEach(() => {
  vi.resetAllMocks();
});

describe('ManageOccupancy', () => {
  it('muestra los conteos por tipo y los textos accesibles', () => {
    setup();
    expect(screen.getByText('Automóviles: 15 disponibles / 20')).toBeInTheDocument();
    expect(screen.getByText('Motocicletas: 8 disponibles / 10')).toBeInTheDocument();
  });

  it('con un solo tipo no muestra el otro', () => {
    setup(makeLot({ parking_vehicle_configs: [makeConfig('CAR')] }));
    expect(screen.queryByText(/Motocicleta/)).not.toBeInTheDocument();
  });

  it('un ingreso exitoso actualiza la ocupación y muestra el mensaje', async () => {
    entry.mockResolvedValue({ ok: true, data: 6 });
    const user = userEvent.setup();
    const { my } = setup();
    await user.click(card('Registrar ingreso').getByRole('button', { name: 'Registrar ingreso' }));

    expect(entry).toHaveBeenCalledWith('car');
    expect(my.applyOccupancy).toHaveBeenCalledWith('car', 6);
    expect(await screen.findByText(MSG.ocupacion.ingresoRegistrado)).toBeInTheDocument();
  });

  it('una salida usa el tipo elegido en su propia tarjeta', async () => {
    exit.mockResolvedValue({ ok: true, data: 1 });
    const user = userEvent.setup();
    const { my } = setup();
    await user.click(card('Registrar salida').getByRole('radio', { name: /Motocicleta/ }));
    await user.click(card('Registrar salida').getByRole('button', { name: 'Registrar salida' }));

    expect(exit).toHaveBeenCalledWith('motorcycle');
    expect(my.applyOccupancy).toHaveBeenCalledWith('motorcycle', 1);
    expect(await screen.findByText(MSG.ocupacion.salidaRegistrada)).toBeInTheDocument();
  });

  it('deshabilita el ingreso sin disponibles y la salida sin ocupadas, con su mensaje', () => {
    setup(makeLot({ parking_vehicle_configs: [makeConfig('CAR', { total: 5, occupied: 5 })] }));
    expect(card('Registrar ingreso').getByRole('button', { name: 'Registrar ingreso' })).toBeDisabled();
    expect(screen.getByText(MSG.ocupacion.sinDisponibles)).toBeInTheDocument();
  });

  it('sin ocupadas deshabilita la salida', () => {
    setup(makeLot({ parking_vehicle_configs: [makeConfig('CAR', { total: 5, occupied: 0 })] }));
    expect(card('Registrar salida').getByRole('button', { name: 'Registrar salida' })).toBeDisabled();
    expect(screen.getByText(MSG.ocupacion.sinOcupadas)).toBeInTheDocument();
  });

  it('SIN_DISPONIBLES del servidor muestra el mensaje y recarga', async () => {
    entry.mockResolvedValue({ ok: false, code: 'SIN_DISPONIBLES', message: MSG.ocupacion.sinDisponibles });
    const user = userEvent.setup();
    const { my } = setup();
    await user.click(card('Registrar ingreso').getByRole('button', { name: 'Registrar ingreso' }));
    expect(await screen.findByText(MSG.ocupacion.sinDisponibles)).toBeInTheDocument();
    expect(my.reload).toHaveBeenCalled();
  });

  it('deshabilita el botón durante la petición (sin doble envío)', async () => {
    let resolve!: (v: Awaited<ReturnType<typeof registerEntry>>) => void;
    entry.mockReturnValue(new Promise((r) => (resolve = r)));
    const user = userEvent.setup();
    setup();
    const button = card('Registrar ingreso').getByRole('button', { name: 'Registrar ingreso' });
    await user.dblClick(button);
    expect(entry).toHaveBeenCalledTimes(1);
    resolve({ ok: true, data: 6 });
  });

  it('con capacidad total 0 muestra el aviso y el enlace a configurar celdas', () => {
    setup(makeLot({ parking_vehicle_configs: [makeConfig('CAR', { total: 0, occupied: 0 })] }));
    expect(screen.getByText(/Configura las celdas para gestionar la ocupación/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Configurar celdas' })).toHaveAttribute('href', '/admin/parqueadero/celdas');
  });
});
