import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../services/adminParking', () => ({ configureSpaces: vi.fn() }));

import { MSG } from '../../lib/messages';
import { configureSpaces } from '../../services/adminParking';
import { makeConfig, makeLot, renderWithParking } from '../../test/fixtures';
import ConfigureSpaces from './ConfigureSpaces';

const mocked = vi.mocked(configureSpaces);

const setup = (parking = makeLot()) =>
  renderWithParking(<ConfigureSpaces />, {
    my: { state: 'con_parqueadero', parking },
    path: '/admin/parqueadero/celdas',
  });

beforeEach(() => {
  vi.resetAllMocks();
});

describe('ConfigureSpaces', () => {
  it('muestra solo los tipos atendidos, las ocupadas y el total', () => {
    setup(makeLot({ parking_vehicle_configs: [makeConfig('CAR', { total: 20, occupied: 5 })] }));
    expect(screen.getByLabelText('Celdas de Automóviles')).toHaveValue('20');
    expect(screen.queryByLabelText('Celdas de Motocicletas')).not.toBeInTheDocument();
    expect(screen.getByText('Ocupadas actualmente: 5')).toBeInTheDocument();
  });

  it('recalcula el total al cambiar los valores', async () => {
    const user = userEvent.setup();
    setup();
    expect(screen.getByText('30')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Aumentar Celdas de Automóviles' }));
    expect(screen.getByText('31')).toBeInTheDocument();
  });

  it('un valor menor a las ocupadas muestra "reducir" y no llama al servicio', async () => {
    const user = userEvent.setup();
    setup();
    const input = screen.getByLabelText('Celdas de Automóviles');
    await user.clear(input);
    await user.type(input, '3');
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));
    expect(await screen.findByText(MSG.celdas.reducir)).toBeInTheDocument();
    expect(mocked).not.toHaveBeenCalled();
  });

  it('envía solo los tipos cuyo valor cambió y navega con el mensaje de éxito', async () => {
    mocked.mockResolvedValue({ ok: true, data: undefined });
    const user = userEvent.setup();
    const { my } = setup();
    await user.click(screen.getByRole('button', { name: 'Aumentar Celdas de Automóviles' }));
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    await waitFor(() => expect(screen.getByTestId('where')).toHaveTextContent('/admin'));
    expect(mocked).toHaveBeenCalledWith([{ config_id: 'car', total_spaces: 21 }]);
    expect(my.reload).toHaveBeenCalled();
  });

  it('sin cambios no llama al servicio', async () => {
    const user = userEvent.setup();
    setup();
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));
    expect(mocked).not.toHaveBeenCalled();
    expect(screen.getByTestId('where')).toHaveTextContent('/admin');
  });

  it('un error de concurrencia del servidor muestra el mensaje y recarga', async () => {
    mocked.mockResolvedValue({ ok: false, code: 'CAPACIDAD_MENOR_A_OCUPADAS', message: MSG.celdas.reducir });
    const user = userEvent.setup();
    const { my } = setup();
    await user.click(screen.getByRole('button', { name: 'Aumentar Celdas de Automóviles' }));
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));
    expect(await screen.findByText(MSG.celdas.reducir)).toBeInTheDocument();
    expect(my.reload).toHaveBeenCalled();
  });

  it('"Cancelar" vuelve al panel sin guardar', async () => {
    const user = userEvent.setup();
    setup();
    await user.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(mocked).not.toHaveBeenCalled();
    expect(screen.getByTestId('where')).toHaveTextContent('/admin');
  });
});
