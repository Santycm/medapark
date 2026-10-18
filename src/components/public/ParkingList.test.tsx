import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { MSG } from '../../lib/messages';
import { offer, publicParking } from '../../test/publicFixtures';
import ParkingList from './ParkingList';

const show = (props: Partial<React.ComponentProps<typeof ParkingList>> = {}) => {
  const onSelect = vi.fn();
  render(
    <ParkingList
      parkings={[publicParking('A'), publicParking('B')]}
      selectedId={null}
      onSelect={onSelect}
      {...props}
    />,
  );
  return { onSelect };
};

describe('ParkingList', () => {
  it('muestra el título con el total y un botón por parqueadero, en el orden recibido', () => {
    show();
    expect(screen.getByRole('heading', { name: 'Parqueaderos activos (2)' })).toBeInTheDocument();
    const buttons = screen.getAllByRole('button');
    expect(buttons[0]).toHaveTextContent('Parqueadero A');
    expect(buttons[1]).toHaveTextContent('Parqueadero B');
  });

  it('muestra la disponibilidad por tipo con texto accesible', () => {
    show({
      parkings: [
        publicParking('A', {
          offers: [offer('CAR', { available: 12, total: 20 }), offer('MOTORCYCLE', { available: 8, total: 15 })],
        }),
      ],
    });
    expect(screen.getByText('Automóviles: 12 disponibles de 20')).toBeInTheDocument();
    expect(screen.getByText('Motocicletas: 8 disponibles de 15')).toBeInTheDocument();
  });

  it('un parqueadero lleno muestra "Sin celdas disponibles"', () => {
    show({ parkings: [publicParking('A', { offers: [offer('CAR', { available: 0 })] }), publicParking('B')] });
    expect(screen.getAllByText(MSG.publico.sinCeldas)).toHaveLength(1);
  });

  it('sin parqueaderos muestra el mensaje vacío', () => {
    show({ parkings: [] });
    expect(screen.getByRole('heading', { name: 'Parqueaderos activos (0)' })).toBeInTheDocument();
    expect(screen.getByText(MSG.publico.vacio)).toBeInTheDocument();
  });

  it('el clic llama a onSelect con el id', async () => {
    const user = userEvent.setup();
    const { onSelect } = show();
    await user.click(screen.getByRole('button', { name: /Parqueadero B/ }));
    expect(onSelect).toHaveBeenCalledWith('B');
  });

  it('el seleccionado tiene aria-current', () => {
    show({ selectedId: 'B' });
    expect(screen.getByRole('button', { name: /Parqueadero B/ })).toHaveAttribute('aria-current', 'true');
    expect(screen.getByRole('button', { name: /Parqueadero A/ })).not.toHaveAttribute('aria-current');
  });
});
